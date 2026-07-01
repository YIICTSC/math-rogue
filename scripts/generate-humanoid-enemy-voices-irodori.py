from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
import time
from pathlib import Path
from urllib import error, request

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

ACTIONS = ("spawn", "attack", "defense", "skill", "damage", "defeat")
ACTION_LABELS = {
    "出現時": "spawn",
    "攻撃時": "attack",
    "防御時": "defense",
    "スキル": "skill",
    "ダメージ時": "damage",
    "やられた時": "defeat",
}


def parse_seeds() -> list[dict[str, str]]:
    source = (ROOT / "src/data/humanoidEnemyVoiceLines.ts").read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*gender:\s*'([^']+)'\s*,\s*speakerId:\s*'([^']+)'\s*,\s*motif:\s*'([^']+)'\s*\}"
    )
    rows: list[dict[str, str]] = []
    for enemy_id, name, gender, speaker_id, motif in pattern.findall(source):
        theme = "high-school" if enemy_id.startswith("hs_") else "magic"
        rows.append(
            {
                "theme": theme,
                "id": enemy_id,
                "name": name,
                "gender": gender,
                "speaker_id": speaker_id.upper(),
                "motif": motif,
            }
        )
    return rows


def create_lines(seed: dict[str, str]) -> dict[str, str]:
    name = seed["name"]
    motif = seed["motif"]
    if seed["theme"] == "high-school":
        return {
            "spawn": f"{name}、巡回開始。",
            "attack": f"{motif}で押し通す。",
            "defense": f"{motif}で守る。",
            "skill": f"{motif}、発令。",
            "damage": f"{motif}が乱れた。",
            "defeat": f"{motif}、記録終了。",
        }
    return {
        "spawn": f"{name}、詠唱開始。",
        "attack": f"{motif}よ、撃て。",
        "defense": f"{motif}で結界を。",
        "skill": f"{motif}、解放。",
        "damage": f"{motif}が揺らぐ。",
        "defeat": f"{motif}がほどける。",
    }


def parse_markdown_lines() -> dict[str, dict[str, str]]:
    path = ROOT / "docs/humanoid-enemy-voice-lines.md"
    if not path.exists():
        return {}
    result: dict[str, dict[str, str]] = {}
    current_name: str | None = None
    row_pattern = re.compile(r"^\| (出現時|攻撃時|防御時|スキル|ダメージ時|やられた時) \| (.+) \|$")
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("### "):
            current_name = line.removeprefix("### ").strip()
            result.setdefault(current_name, {})
            continue
        if not current_name:
            continue
        match = row_pattern.match(line)
        if not match:
            continue
        result[current_name][ACTION_LABELS[match.group(1)]] = match.group(2)
    return {
        name: lines
        for name, lines in result.items()
        if all(action in lines for action in ACTIONS)
    }


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


def synthesize(text: str, speaker_id: str, line_id: str, wav_path: Path, num_steps: int) -> None:
    payload = {
        "model": "irodori-tts",
        "input": text,
        "voice": speaker_id,
        "response_format": "wav",
        "speed": 1.0,
        "irodori": {
            "num_steps": num_steps,
            "cfg_scale_text": 3.0,
            "cfg_scale_speaker": 5.0,
            "t_schedule_mode": "sway",
            "sway_coeff": -1.0,
            "chunking_enabled": False,
            "seed": stable_seed(line_id),
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
    dry_run = "--dry-run" in sys.argv
    num_steps = 8 if "--fast" in sys.argv else 16
    only: set[str] | None = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = {item.strip().lower() for item in arg.removeprefix("--only=").split(",") if item.strip()}

    seeds = parse_seeds()
    markdown_lines = parse_markdown_lines()
    jobs: list[dict[str, str]] = []
    for seed in seeds:
        lines = markdown_lines.get(seed["name"], create_lines(seed))
        for action, text in lines.items():
            line_id = f"{seed['theme']}-{seed['id']}-{action}"
            if only and seed["id"].lower() not in only and line_id.lower() not in only:
                continue
            jobs.append({ **seed, "action": action, "line_id": line_id, "text": text })

    print(f"jobs={len(jobs)} enemies={len(seeds)}")
    if dry_run:
        for row in jobs[:12]:
            print(f"{row['line_id']} {row['speaker_id']}: {row['text']}")
        return

    prepare_reference_voices()
    generated = 0
    skipped = 0
    failed: list[str] = []
    for index, row in enumerate(jobs, start=1):
        out_dir = ROOT / "public/sfx/enemy-voices" / row["theme"] / row["id"]
        out_dir.mkdir(parents=True, exist_ok=True)
        wav_path = out_dir / f"{row['action']}.wav"
        ogg_path = out_dir / f"{row['action']}.ogg"
        if not force and wav_path.exists() and ogg_path.exists():
            skipped += 1
            continue
        started = time.time()
        try:
            print(f"[{index}/{len(jobs)}] {row['theme']} {row['id']} {row['action']} {row['speaker_id']}")
            synthesize(row["text"], row["speaker_id"], row["line_id"], wav_path, num_steps)
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
