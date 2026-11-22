"""Generate the two table collections' declaration voices on a local CPU.

Use --prepare-references to export the established speakers. Serve the pinned
Irodori model with speech.cpp, --device cpu, and one --add-voice per WAV.
The same task can be shared between two local CPU workers with --shard 0/2 and 1/2.
"""

import argparse
from array import array
import hashlib
from io import BytesIO
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
LINES = ROOT / 'src/data/tableDeclarationLines.json'
BASE = ROOT / 'assets/traditional-games'
OUTPUT = ROOT / 'public/sfx/table-declarations'
INSTRUCTIONS = '参照と同じ声で、対局中に短く明瞭に発声する。せりふを足さない。息や余計な音を入れない。'
MODEL = 'Irodori-TTS-v4.1-Small-MF'
MODEL_REVISION = 'ccc78f5d480b6e51b69b2d5042a14c4da04fea6e'
IRODORI_REVISION = 'f01c08cd40c0afa62a862439a5de12f6dcf62054'
QUANT_REVISION = '9db7da1bec3d1069ef8e29732e0497be60c7b047'
CHECKPOINT_SHA256 = '1913bf74000a3300c703eb91c985a4e5c4d7a2bbeb0cc7fe07d1583c4fea9729'
PRIORITY = ('yaniv', 'assaf', 'mine', 'return', 'doubt', 'bull', 'knock', 'gin')


def references():
    previous = json.loads((BASE / 'voice-build.json').read_text())
    return {
        key.split('/')[0]: clip['reference'][1 if key == 'magic-sakuya/turn' else 0]
        for key, clip in previous['clips'].items()
        if key.endswith('/turn')
    }


def read_json(url):
    with urllib.request.urlopen(url, timeout=15) as reply:
        return json.load(reply)


def request_wav(endpoint, voice, text, seconds, seed, steps):
    request = urllib.request.Request(
        endpoint + '/v1/audio/speech',
        data=json.dumps({
            'input': text, 'voice': voice, 'seconds': seconds, 'seed': seed, 'steps': steps,
            'instructions': INSTRUCTIONS, 'response_format': 'wav',
        }).encode(),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=90) as reply:
        if reply.headers.get('X-Speech-Stop') not in (None, 'complete'):
            raise ValueError('Synthesis reached the model limit')
        return reply.read()


def read_voice(data):
    with wave.open(BytesIO(data)) as source:
        assert source.getnchannels() == 1 and source.getsampwidth() == 2
        rate = source.getframerate()
        samples = array('h', source.readframes(source.getnframes()))
    peak = max(map(abs, samples), default=0)
    if peak < 530:
        raise ValueError('Silent speech')
    return samples, rate, peak


def trimmed_voice(data, number):
    samples, rate, peak = read_voice(data)
    width = rate // 100
    cutoff = max(76, peak * .023)
    active = []
    for offset in range(0, len(samples) - width + 1, width):
        block = samples[offset:offset + width]
        if sum(value * value for value in block) >= width * cutoff ** 2:
            active.append(offset // width)
    if len(active) < 13:
        raise ValueError('Speech is too short')
    # Keep the first run of speech when the model appends a separate breath or mouth sound.
    end = active[-1]
    minimum = 23 if number else 35
    for left, right in zip(active, active[1:]):
        if left - active[0] >= minimum and right - left >= 19:
            end = left
            break
    first = max(0, active[0] * width - 2 * width)
    last = min(len(samples), (end + 5) * width)
    clip = samples[first:last]
    if len(clip) < rate * .16:
        raise ValueError('Trimmed speech is too short')
    return clip.tobytes(), rate


def prepared_voice(data, number, keep_whole):
    if keep_whole:
        samples, rate, peak = read_voice(data)
        duration = len(samples) / rate
        fade = max(0, duration - .025)
        filters = f'volume={min(3.0, 21500 / peak):.5f},afade=t=out:st={fade:.4f}:d=0.025'
        return samples.tobytes(), rate, filters + ',apad=pad_dur=0.055'
    pcm, rate = trimmed_voice(data, number)
    fade = max(0, len(pcm) / (rate * 2) - .035)
    filters = f'loudnorm=I=-19:TP=-2:LRA=7,afade=t=out:st={fade:.4f}:d=0.035,apad=pad_dur=0.055'
    return pcm, rate, filters


def generate(args):
    roster = references()
    lines = json.loads(LINES.read_text())
    keys = list(dict.fromkeys([*PRIORITY, *lines]))
    if args.event:
        keys = args.event
    requested = [(hero, key) for key in keys for hero in roster if not args.hero or hero == args.hero]
    if args.shard:
        index, count = map(int, args.shard.split('/'))
        if not 0 <= index < count:
            raise ValueError('Shard must be a zero-based worker index and a positive count')
        requested = requested[index::count]
    print(f'Preparing {len(requested)} declaration clips', flush=True)
    available = read_json(args.endpoint + '/v1/models')
    if MODEL not in json.dumps(available):
        raise RuntimeError(f'Start the CPU speech server with {MODEL}')
    failures = []
    for index, (hero, key) in enumerate(requested, 1):
        target = OUTPUT / hero / (key + '.mp3')
        if target.exists() and not args.replace:
            continue
        text = lines[key]
        seconds = round(max(.73, min(1.8, .43 + len(text) * .109)), 3)
        digest = hashlib.sha256((hero + '/' + key).encode()).hexdigest()
        seed = 308000 + int(digest[:7], 16)
        for attempt in range(8):
            increment = args.seed_offset + attempt
            try:
                data = request_wav(args.endpoint, hero, text, seconds, seed + increment, args.steps)
                pcm, rate, filters = prepared_voice(
                    data, key.startswith('n') and key[1:].isdigit(), args.preserve_utterance,
                )
                break
            except ValueError:
                seconds = min(2.05, seconds + .14)
        else:
            failures.append(f'{hero}/{key}')
            print(f'Needs retake: {hero}/{key}', flush=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        duration = len(pcm) / (rate * 2)
        with tempfile.NamedTemporaryFile(suffix='.mp3', dir=target.parent, delete=False) as temp:
            temporary = Path(temp.name)
        try:
            subprocess.run([
                'ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(rate), '-ac', '1',
                '-i', '-', '-af',
                filters,
                '-ar', '32000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', str(temporary),
            ], input=pcm, check=True)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
        print(f'{index}/{len(requested)} {hero}/{key} {text} {duration:.2f}s seed:{seed + increment} request:{seconds:.2f}', flush=True)

    if failures:
        raise RuntimeError(f'Clips requiring a retake: {", ".join(failures)}')

def prepare_references(directory):
    directory.mkdir(exist_ok=True, parents=True)
    for hero, source in references().items():
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / source), '-ac', '1',
            '-ar', '48000', str(directory / (hero + '.wav')),
        ], check=True)


def arguments_from_cli():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--endpoint', default='http://127.0.0.1:18627')
    parser.add_argument('--prepare-references', type=Path)
    parser.add_argument('--hero')
    parser.add_argument('--shard')
    parser.add_argument('--event', action='append')
    parser.add_argument('--steps', type=int, default=4)
    parser.add_argument('--replace', action='store_true')
    parser.add_argument('--preserve-utterance', action='store_true', help='Keep every syllable of a verified call')
    parser.add_argument('--seed-offset', type=int, default=0)
    return parser.parse_args()


if __name__ == '__main__':
    arguments = arguments_from_cli()
    if arguments.prepare_references:
        prepare_references(arguments.prepare_references)
    else:
        generate(arguments)
