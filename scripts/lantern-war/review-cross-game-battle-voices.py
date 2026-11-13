"""Independent CPU ASR and waveform review for missing cross-game reactions."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from voice_review_rules import assess

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True, help='Local faster-whisper model directory')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
base = root / 'assets/lantern-war/cross-game-battle'
plan = json.loads((base / 'voice-plan.json').read_text())
review_path = base / 'voice-review.json'
review = json.loads(review_path.read_text()) if review_path.exists() else {}
model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=2, num_workers=1)
for job in plan['clips']:
    path = root / 'public' / job['path']
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    key = job['actor'] + ':' + job['kind']
    if review.get(key, {}).get('sha256') == digest:
        continue
    samples, rate = sf.read(path)
    segments, _ = model.transcribe(str(path), language='ja', beam_size=5, condition_on_previous_text=False, vad_filter=False)
    heard = ''.join(s.text for s in segments)
    entry = {**assess(job, heard), 'heard': heard, 'sha256': digest, 'model': 'Systran/faster-whisper-small', 'model_revision': '536b0662742c02347bc0e980a01041f333bce120', 'device': 'cpu', 'compute_type': 'int8', 'duration': len(samples) / rate, 'peak': float(np.max(np.abs(samples))), 'rms': float(np.sqrt(np.mean(samples ** 2))), 'clipped_fraction': float(np.mean(np.abs(samples) >= .999))}
    assert np.isfinite(samples).all() and entry['rms'] > .003 and entry['clipped_fraction'] < .001
    review[key] = entry
    review_path.write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')
    print('REVIEW' if entry['needs_review'] else 'OK', key, job['text'], '=>', heard, entry['cer'], flush=True)
print('Flagged', sum(c['needs_review'] for c in review.values()), flush=True)
