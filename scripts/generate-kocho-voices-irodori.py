"""Generate Kocho hero and enemy voices with the latest inspected official Irodori CPU runtime.

Run with the official runtime's Python after `uv sync --extra cpu`. Guest heroes use their main-story voices; the original hero uses a designed
fictional speaker reference. Cached latents and finished clips make runs resumable.
SilentCipher watermarks are retained. See docs/kocho-voices.md.
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
    parser.add_argument('--irodori-root', type=Path, default=ROOT.parent / 'irodori-kocho')
    parser.add_argument('--enemies', action='store_true', help='Generate the dedicated enemy catalog')
    parser.add_argument('--device', default='cpu')
    parser.add_argument('--threads', type=int, default=2)
    parser.add_argument('--cpu-autocast', action='store_true', help='Use BF16 CPU autocast on an AVX512-BF16 host')
    parser.add_argument('--only', help='Generate a single speaker')
    parser.add_argument('--events', help='Comma-separated event names')
    parser.add_argument('--model', help='Override official model, e.g. v4.1-Small for RF refinement')
    parser.add_argument('--steps', type=int, default=4)
    parser.add_argument('--cfg-mode', default='joint', choices=['joint','independent'])
    parser.add_argument('--seed-offset', type=int, default=0)
    parser.add_argument('--regenerate', action='store_true')
    parser.add_argument('--seconds', type=float, help='Explicit action clip duration for pronunciation refinement')
    parser.add_argument('--text-guidance', type=float, default=3)
    parser.add_argument('--caption-guidance', type=float, default=3)
    parser.add_argument('--speaker-guidance', type=float, default=3)
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
    catalog = json.loads((ROOT / ('assets/kocho/enemy-voice-lines.json' if args.enemies else 'assets/kocho/voice-lines.json')).read_text())
    model_id = args.model or catalog['model']
    checkpoint = download_hf_checkpoint(model_id)
    checkpoint_digest = sha256(checkpoint)
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
    scratch = ROOT / ('tmp/kocho-enemy-voice-source' if args.enemies else 'tmp/kocho-voice-source')
    scratch.mkdir(parents=True, exist_ok=True)
    output = ROOT / ('public/sfx/kocho-enemy-voices' if args.enemies else 'public/sfx/kocho-voices')
    provenance = {'model': catalog['model'], 'checkpoint_sha256': checkpoint_digest, 'clips': {}}
    record = ROOT / ('assets/kocho/enemy-voice-build.json' if args.enemies else 'assets/kocho/voice-build.json')
    if record.exists(): provenance.update(json.loads(record.read_text()))
    provenance['irodori_revision'] = subprocess.check_output(['git', '-C', str(args.irodori_root), 'rev-parse', 'HEAD'], text=True).strip()
    provenance.pop('sampling_steps', None)
    provenance['default_model'] = catalog['model']
    provenance['last_generation'] = {'model':model_id, 'sampling_steps':args.steps, 'cfg_mode':args.cfg_mode}
    provenance['compute']='cpu-bf16' if args.cpu_autocast else args.device
    provenance['upstream_url']='https://github.com/Aratako/Irodori-TTS'
    provenance['model_device']=str(runtime.model_device)
    provenance['codec_device']=str(runtime.codec_device)
    provenance['torch_version']=torch.__version__
    provenance['cpu_threads']=args.threads
    provenance.setdefault('models', {})[model_id] = {'checkpoint_sha256': checkpoint_digest, 'sampler': runtime.model_cfg.flow_parameterization, 'snapshot': str(checkpoint).split('/snapshots/')[-1].split('/')[0]}
    effective_guidance = 'fused training-time CFG; runtime scales ignored' if runtime.model_cfg.flow_parameterization == 'meanflow' else args.cfg_mode
    provenance['silentcipher_watermark'] = bool(runtime.watermarker.ready)
    for hero in catalog['heroes']:
        if args.only and hero['id'] != args.only: continue
        if repairs is not None and not any(key.startswith(hero['id']+'/') for key in repairs): continue
        directory = output / hero['id']
        directory.mkdir(parents=True, exist_ok=True)
        if not hero['references']:
            # Original hero had no established voice: design one fictional speaker,
            # then condition every line on that same generated reference.
            anchor = ROOT / 'assets/kocho/original-speaker.wav'
            if not anchor.exists():
                with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                    anchor_result = runtime.synthesize(SamplingRequest(text='校長先生！俺たちの本気を見せる！正々堂々、勝負だ！', caption=hero['caption'], no_ref=True, num_steps=args.steps, seed=hero['seed'], seconds=5, cfg_scale_text=3, cfg_scale_caption=3, max_seconds=8), log_fn=lambda _: None)
                save_wav(anchor, anchor_result.audio, anchor_result.sample_rate)
            hero['references'] = ['assets/kocho/original-speaker.wav']
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
            spoken_text = hero.get('synthesis_text', {}).get(event, text)
            clip_seconds = args.seconds
            recipe = dict(text=text, spoken_text=spoken_text, caption=hero['caption'], references=reference_files, seconds=clip_seconds, model=model_id, steps=args.steps, seed=hero['seed'] + int(hashlib.sha256(event.encode()).hexdigest()[:6], 16) + args.seed_offset, guidance=[args.text_guidance,args.caption_guidance,args.speaker_guidance], cfg_mode=args.cfg_mode)
            recipe_digest = hashlib.sha256(json.dumps(recipe,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
            if target.exists() and provenance['clips'].get(key, {}).get('recipe_sha256') == recipe_digest and not args.regenerate:
                continue
            start = time.monotonic()
            latent = scratch / f"{hero['id']}-{reference_digest}-reference.pt"
            if not latent.exists():
                with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                    reference_latent = runtime.codec.encode_file(str(reference))
                torch.save(reference_latent.float().cpu(), latent)

            emotion = 'A decisive anime battle technique call. Emphasize the technique name clearly.' if event.startswith('skill-') else 'Short, expressive action-game performance, with strong character emotion.'
            with torch.autocast('cpu', dtype=torch.bfloat16) if args.cpu_autocast else nullcontext():
                result = runtime.synthesize(SamplingRequest(text=spoken_text, caption=hero['caption'] + ' ' + emotion, no_ref=False, ref_latent=str(latent), num_steps=args.steps, seed=hero['seed'] + int(hashlib.sha256(event.encode()).hexdigest()[:6], 16) + args.seed_offset, seconds=clip_seconds, cfg_guidance_mode=args.cfg_mode, cfg_scale_text=args.text_guidance, cfg_scale_caption=args.caption_guidance, cfg_scale_speaker=args.speaker_guidance, max_seconds=8), log_fn=lambda _: None)
            wav = scratch / f"{hero['id']}-{event}.wav"
            save_wav(wav, result.audio, result.sample_rate)
            data, rate = sf.read(wav)
            if len(data) / rate < .35 or not np.isfinite(data).all() or np.max(np.abs(data)) < .003:
                raise RuntimeError(f'Invalid or silent voice: {key}')
            encoded = target.with_suffix('.tmp.ogg')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st=7.85:d=0.15', '-t', '8', '-ac', '1', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', str(encoded)], check=True)
            encoded.replace(target)
            provenance['clips'][key] = {'sampler': runtime.model_cfg.flow_parameterization, 'effective_guidance': effective_guidance, 'recipe_sha256': recipe_digest, 'text': text, 'spoken_text': spoken_text, 'references': reference_files, 'reference_digest': reference_digest, 'explicit_seconds': clip_seconds, 'guidance': [args.text_guidance, args.caption_guidance, args.speaker_guidance], 'model': model_id, 'checkpoint_sha256': checkpoint_digest, 'cfg_mode': args.cfg_mode, 'sampling_steps': args.steps, 'sample_rate': result.sample_rate, 'seconds': round(len(data) / rate, 3), 'seed': result.used_seed, 'sha256': sha256(target), 'compute': 'cpu-bf16' if args.cpu_autocast else args.device + '-fp32', 'timings': dict(result.stage_timings)}
            temporary = record.with_suffix('.tmp')
            temporary.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
            temporary.replace(record)
            print(f"{len(provenance['clips'])}/{sum(len(h['lines']) for h in catalog['heroes'])} {key} {time.monotonic()-start:.1f}s", flush=True)
    provenance.pop('verified_clips', None)
    record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__': main()
