from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
import time
from pathlib import Path
from urllib import request, error

import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
IRODORI_URL = "http://127.0.0.1:8088/v1/audio/speech"
IRODORI_VOICES_DIR = Path(r"C:\Users\myfav\Documents\VScode\tools\Irodori-TTS-Server\voices")

CHARACTER_IDS = [
    "AKARI",
    "SHIZUKU",
    "HIYORI",
    "TSUBASA",
    "REI",
    "MADOKA",
    "KOHARU",
    "MIRAI",
    "SERA",
    "REN",
    "SOMA",
    "MINATO",
    "RIKU",
    "YAMATO",
    "LEON",
    "ELLIOT",
    "SAKUYA",
]


def parse_lines() -> list[dict[str, str]]:
    source = (ROOT / "src/data/magicFriendshipEndingDialogue.ts").read_text(encoding="utf-8")
    pattern = re.compile(
        r"speakerId:\s*'([^']+)'\s*,\s*lineId:\s*'([^']+)'\s*,\s*text:\s*'([^']*)'"
    )
    rows = []
    for speaker_id, line_id, text in pattern.findall(source):
        quote = re.match(r"^[^「]+「(.+)」$", text)
        rows.append(
            {
                "speaker_id": speaker_id.upper(),
                "line_id": line_id.lower(),
                "text": quote.group(1) if quote else text,
            }
        )
    return rows


def prepare_reference_voices() -> None:
    IRODORI_VOICES_DIR.mkdir(parents=True, exist_ok=True)
    for character_id in CHARACTER_IDS:
        event_dir = ROOT / "public/sfx/magic-event-voices" / character_id
        battle_dir = ROOT / "public/sfx/magic-voices" / character_id
        candidates = list(event_dir.glob("ending-*.wav"))
        if not candidates:
            candidates = list(battle_dir.glob("spell-*.wav")) or list(battle_dir.glob("attack-*.wav"))
        if not candidates:
            print(f"reference missing: {character_id}", file=sys.stderr)
            continue
        source = max(candidates, key=lambda path: path.stat().st_size)
        target = IRODORI_VOICES_DIR / f"{character_id}.wav"
        if not target.exists() or source.stat().st_mtime > target.stat().st_mtime:
            shutil.copy2(source, target)


def stable_seed(line_id: str) -> int:
    digest = hashlib.sha256(line_id.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "little") % 2_000_000_000


def synthesize(row: dict[str, str], wav_path: Path) -> None:
    payload = {
        "model": "irodori-tts",
        "input": row["text"],
        "voice": row["speaker_id"],
        "response_format": "wav",
        "speed": 1.0,
        "irodori": {
            "num_steps": 16,
            "cfg_scale_text": 3.0,
            "cfg_scale_speaker": 5.0,
            "t_schedule_mode": "sway",
            "sway_coeff": -1.0,
            "chunking_enabled": False,
            "seed": stable_seed(row["line_id"]),
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        IRODORI_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=900) as response:
        wav_path.write_bytes(response.read())


def convert_to_ogg(wav_path: Path) -> Path:
    ogg_path = wav_path.with_suffix(".ogg")
    data, sample_rate = sf.read(str(wav_path), dtype="float32")
    sf.write(str(ogg_path), data, sample_rate, format="OGG", subtype="VORBIS")
    return ogg_path


def main() -> None:
    force = "--force" in sys.argv
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = {item.strip().lower() for item in arg.removeprefix("--only=").split(",") if item.strip()}

    prepare_reference_voices()
    rows = parse_lines()
    if only:
        rows = [row for row in rows if row["line_id"] in only]

    generated = 0
    skipped = 0
    failed: list[str] = []
    for index, row in enumerate(rows, start=1):
        out_dir = ROOT / "public/sfx/magic-event-voices" / row["speaker_id"]
        out_dir.mkdir(parents=True, exist_ok=True)
        wav_path = out_dir / f'{row["line_id"]}.wav'
        ogg_path = out_dir / f'{row["line_id"]}.ogg'
        if not force and wav_path.exists() and ogg_path.exists():
            skipped += 1
            continue
        started = time.time()
        try:
            print(f"[{index}/{len(rows)}] {row['speaker_id']} {row['line_id']}")
            synthesize(row, wav_path)
            convert_to_ogg(wav_path)
            generated += 1
            print(f"  done {time.time() - started:.1f}s")
        except (error.HTTPError, error.URLError, TimeoutError, OSError) as exc:
            failed.append(row["line_id"])
            print(f"  failed: {exc}", file=sys.stderr)

    print(f"generated={generated} skipped={skipped} failed={len(failed)}")
    if failed:
        print("failed lines:", ", ".join(failed), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
