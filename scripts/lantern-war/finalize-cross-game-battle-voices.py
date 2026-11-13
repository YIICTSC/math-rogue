"""Package/verify only the new battle recordings; never alter original-game voices."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--verify', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
base = root / 'assets/lantern-war/cross-game-battle'
plan = json.loads((base / 'voice-plan.json').read_text())
record = json.loads((base / 'voice-build.json').read_text())
bank_path = root / 'src/mini-games/lantern-war/battleVoiceBank.json'
bank = json.loads(bank_path.read_text())
for job in plan['clips']:
    path = root / 'public' / job['path']
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=sample_rate,channels:format=duration', '-of', 'json', str(path)]))
    if info['streams'][0]['sample_rate'] != '44100':
        assert not args.verify, 'Unexpected output sample rate'
        temp = path.with_suffix('.tmp.ogg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-ac', '1', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '4', str(temp)], check=True)
        temp.replace(path)
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(path)]))
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    clip = record['clips'][job['actor'] + ':' + job['kind']]
    if args.verify:
        assert clip['sha256'] == digest and abs(clip['duration'] - duration) < .001
        assert abs(bank[job['actor']][job['kind']]['duration'] - duration) < .001
    else:
        clip.update(sha256=digest, duration=duration)
        bank[job['actor']][job['kind']]['duration'] = duration
if not args.verify:
    record.update(sample_rate=44100, channels=1, threads=2, silentcipher_watermark=True, normalization='loudnorm I=-18 TP=-1.5 LRA=7')
    (base / 'voice-build.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    bank_path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n')
print('Verified' if args.verify else 'Packaged', len(plan['clips']), 'CPU-generated battle recordings')
