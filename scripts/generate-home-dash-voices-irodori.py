"""Generate Home Dash action voices with official Irodori v4.1 MeanFlow.

Run with the official cloud runtime's Python after `uv sync --extra cpu` (or
cu128). Every hero uses the existing main-story attack and power/spell clips
as its speaker reference. Cached latents and finished clips make runs resumable.
SilentCipher watermarks are retained. See docs/go-home-dash-refresh.md.
"""
from __future__ import annotations
import argparse
from contextlib import nullcontext
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]

def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''): digest.update(chunk)
    return digest.hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--irodori-root', type=Path, default=ROOT.parent / 'Irodori-TTS')
    parser.add_argument('--device', default='cpu')
    parser.add_argument('--threads', type=int, default=2)
    parser.add_argument('--cpu-autocast', action='store_true', help='Use BF16 CPU autocast on an AVX512-BF16 host')
    parser.add_argument('--only', help='Generate a single hero')
    parser.add_argument('--events', help='Comma-separated event names')
    parser.add_argument('--model', help='Override official model, e.g. v4.1-Small for RF refinement')
    parser.add_argument('--steps', type=int, default=4)
    parser.add_argument('--seed-offset', type=int, default=0)
    parser.add_argument('--regenerate', action='store_true')
    parser.add_argument('--seconds', type=float, help='Explicit action clip duration for pronunciation refinement')
    parser.add_argument('--text-guidance', type=float, default=3)
    parser.add_argument('--caption-guidance', type=float, default=3)
    parser.add_argument('--speaker-guidance', type=float, default=5)
    parser.add_argument('--repair-list', type=Path, help='JSON list of hero/event keys to regenerate')
    args = parser.parse_args()
    if args.cpu_autocast and args.device != 'cpu': parser.error('--cpu-autocast requires --device cpu')
    sys.path.insert(0, str(args.irodori_root))
    import torch
    from irodori_tts.inference_runtime import InferenceRuntime, RuntimeKey, SamplingRequest, download_hf_checkpoint, save_wav
    import soundfile as sf
    import numpy as np
    torch.set_num_threads(args.threads)
    repairs = set(json.loads(args.repair_list.read_text())) if args.repair_list else None
    catalog = json.loads((ROOT / 'assets/go-home-dash/hero-voice-lines.json').read_text())
    model_id = args.model or catalog['model']
    checkpoint = download_hf_checkpoint(model_id)
    runtime = InferenceRuntime.from_key(RuntimeKey(checkpoint=checkpoint, model_device=args.device, codec_device=args.device))
    if args.cpu_autocast:
        runtime.model.to(dtype=torch.bfloat16)
        runtime._model_dtype = torch.bfloat16
        runtime.codec.model.to(dtype=torch.bfloat16)
        runtime.codec.dtype = torch.bfloat16
        # IIR loudness filtering and SilentCipher require FP32; neural network
        # matmuls/convolutions use the host's AVX512 BF16 instructions.
        runtime.codec._normalize_loudness = torch.autocast('cpu', enabled=False)(runtime.codec._normalize_loudness)
        encode_watermark = runtime.watermarker.encode_batch
        def fp32_watermark(audios, **kwargs):
            with torch.autocast('cpu', enabled=False):
                return encode_watermark([audio.float() for audio in audios], **kwargs)
        runtime.watermarker.encode_batch = fp32_watermark
    scratch = ROOT / 'tmp/home-dash-voice-source'
    scratch.mkdir(parents=True, exist_ok=True)
    output = ROOT / 'public/sfx/go-home-dash'
    provenance = {'model': catalog['model'], 'checkpoint_sha256': sha256(checkpoint), 'clips': {}}
    record = ROOT / 'assets/go-home-dash/hero-voice-build.json'
    if record.exists(): provenance.update(json.loads(record.read_text()))
    provenance['irodori_revision'] = subprocess.check_output(['git', '-C', str(args.irodori_root), 'rev-parse', 'HEAD'], text=True).strip()
    provenance.setdefault('sampling_steps', 4)
    provenance['silentcipher_watermark'] = bool(runtime.watermarker.ready)
    for hero in catalog['heroes']:
        if args.only and hero['id'] != args.only: continue
        if repairs is not None and not any(key.startswith(hero['id']+'/') for key in repairs): continue
        directory = output / hero['id']
        directory.mkdir(parents=True, exist_ok=True)
        reference_files = [{"path": p, "sha256": sha256(ROOT / p)} for p in hero['references']]
        reference_digest = hashlib.sha256(json.dumps(reference_files, sort_keys=True).encode()).hexdigest()[:12]
        reference = scratch / f"{hero['id']}-{reference_digest}-reference.wav"
        if not reference.exists():
            inputs = sum((['-i', str(ROOT / path)] for path in hero['references']), [])
            subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ''.join(f'[{i}:a]' for i in range(len(hero['references']))) + f"concat=n={len(hero['references'])}:v=0:a=1[out]", '-map', '[out]', '-ac', '1', '-ar', '44100', str(reference)], check=True)
        provenance.setdefault('references', {})[hero['id']] = reference_files
        for event, text in hero['lines'].items():
            if args.events and event not in args.events.split(','): continue
            if repairs is not None and f"{hero['id']}/{event}" not in repairs: continue
            target = directory / f'{event}.ogg'
            key = f"{hero['id']}/{event}"
            if target.exists() and key in provenance['clips'] and not args.regenerate:
                continue
            start = time.monotonic()
            latent = scratch / f"{hero['id']}-{reference_digest}-reference.pt"
            if not latent.exists():
                with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                    reference_latent = runtime.codec.encode_file(str(reference))
                torch.save(reference_latent.float().cpu(), latent)

            emotion = {'jump': 'Short, lively jumping call.', 'dash': 'Fast, energetic burst of speed.', 'flight': 'Excited, soaring through the sky.', 'damage': 'Brief surprise, still determined.', 'upgrade': 'Happy and confident.', 'defeat': 'Disappointed but ready to try again.'}[event]
            with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                result = runtime.synthesize(SamplingRequest(text=text, caption=hero['caption'] + ' ' + emotion, no_ref=False, ref_latent=str(latent), num_steps=args.steps, seed=hero['seed'] + args.seed_offset, seconds=args.seconds, cfg_scale_text=args.text_guidance, cfg_scale_caption=args.caption_guidance, cfg_scale_speaker=args.speaker_guidance, max_seconds=8), log_fn=lambda _: None)
            wav = scratch / f"{hero['id']}-{event}.wav"
            save_wav(wav, result.audio, result.sample_rate)
            data, rate = sf.read(wav)
            if len(data) / rate < .35 or not np.isfinite(data).all() or np.max(np.abs(data)) < .003:
                raise RuntimeError(f'Invalid or silent voice: {key}')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=7.85:d=0.15', '-t', '8', '-ac', '1', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', str(target)], check=True)
            provenance['clips'][key] = {'text': text, 'references': reference_files, 'reference_digest': reference_digest, 'explicit_seconds': args.seconds, 'guidance': [args.text_guidance, args.caption_guidance, args.speaker_guidance], 'model': model_id, 'checkpoint_sha256': sha256(checkpoint), 'sampling_steps': args.steps, 'sample_rate': result.sample_rate, 'seconds': round(len(data) / rate, 3), 'seed': result.used_seed, 'sha256': sha256(target), 'compute': 'cpu-bf16' if args.cpu_autocast else args.device + '-fp32', 'timings': dict(result.stage_timings)}
            record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
            print(f"{len(provenance['clips'])}/156 {key} {time.monotonic()-start:.1f}s", flush=True)
    provenance.pop('verified_clips', None)
    record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__': main()
