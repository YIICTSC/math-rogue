"""Offline poker rival voices using official Irodori v4.1 MeanFlow.

Install https://github.com/Aratako/Irodori-TTS at --irodori-root, `uv sync
--extra cpu` (or cu128), then run with that environment's Python. A single
runtime is reused. Every rival's entrance becomes its voice identity reference.
Existing finished clips are kept, so interrupted generation can be resumed.
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
    parser.add_argument('--only', help='Generate a single rival')
    args = parser.parse_args()
    if args.cpu_autocast and args.device != 'cpu': parser.error('--cpu-autocast requires --device cpu')
    sys.path.insert(0, str(args.irodori_root))
    import torch
    from irodori_tts.inference_runtime import InferenceRuntime, RuntimeKey, SamplingRequest, download_hf_checkpoint, save_wav
    import soundfile as sf
    import numpy as np
    torch.set_num_threads(args.threads)
    catalog = json.loads((ROOT / 'assets/after-school-poker/rival-voice-lines.json').read_text())
    checkpoint = download_hf_checkpoint(catalog['model'])
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
    scratch = ROOT / 'tmp/poker-voice-source'
    scratch.mkdir(parents=True, exist_ok=True)
    output = ROOT / 'public/sfx/poker-rivals'
    provenance = {'model': catalog['model'], 'checkpoint_sha256': sha256(checkpoint), 'clips': {}}
    record = ROOT / 'assets/after-school-poker/rival-voice-build.json'
    if record.exists(): provenance['clips'].update(json.loads(record.read_text()).get('clips', {}))
    provenance['irodori_revision'] = subprocess.check_output(['git', '-C', str(args.irodori_root), 'rev-parse', 'HEAD'], text=True).strip()
    provenance['sampling_steps'] = 4
    provenance['silentcipher_watermark'] = bool(runtime.watermarker.ready)
    for rival in catalog['rivals']:
        if args.only and rival['id'] != args.only: continue
        directory = output / rival['id']
        directory.mkdir(parents=True, exist_ok=True)
        reference = scratch / f"{rival['id']}-spawn.wav"
        for event, text in rival['lines'].items():
            target = directory / f'{event}.ogg'
            key = f"{rival['id']}/{event}"
            if target.exists() and key in provenance['clips']:
                if event == 'spawn' and not reference.exists():
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(target), str(reference)], check=True)
                continue
            start = time.monotonic()
            latent = scratch / f"{rival['id']}-reference.pt"
            if event != 'spawn' and not latent.exists():
                with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                    reference_latent = runtime.codec.encode_file(str(reference))
                torch.save(reference_latent.float().cpu(), latent)

            emotion = {'spawn': 'Welcoming and confident.', 'damage': 'Surprised but determined.', 'win': 'Happy, triumphant and friendly.', 'defeat': 'Disappointed yet gracious, sincere.'}[event]
            with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                result = runtime.synthesize(SamplingRequest(text=text, caption=rival['caption'] + ' ' + emotion, no_ref=event == 'spawn', ref_latent=str(latent) if event != 'spawn' else None, num_steps=4, seed=rival['seed'], max_seconds=8), log_fn=lambda _: None)
            wav = scratch / f"{rival['id']}-{event}.wav"
            save_wav(wav, result.audio, result.sample_rate)
            data, rate = sf.read(wav)
            if len(data) / rate < .35 or not np.isfinite(data).all() or np.max(np.abs(data)) < .003:
                raise RuntimeError(f'Invalid or silent voice: {key}')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=7.85:d=0.15', '-t', '8', '-ac', '1', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', str(target)], check=True)
            provenance['clips'][key] = {'text': text, 'sample_rate': result.sample_rate, 'seconds': round(len(data) / rate, 3), 'seed': result.used_seed, 'sha256': sha256(target), 'compute': 'cpu-bf16' if args.cpu_autocast else args.device + '-fp32', 'timings': dict(result.stage_timings)}
            record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
            print(f"{len(provenance['clips'])}/240 {key} {time.monotonic()-start:.1f}s", flush=True)
    durations = {key: min(8, info['seconds']) for key, info in sorted(provenance['clips'].items())}
    (ROOT / 'src/data/pokerRivalVoiceDurations.ts').write_text('// Generated from the offline Irodori audio build.\nexport const POKER_RIVAL_VOICE_SECONDS: Record<string, number> = ' + json.dumps(durations, ensure_ascii=False, indent=2) + ';\n')
    record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__': main()
