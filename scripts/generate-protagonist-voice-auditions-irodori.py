from __future__ import annotations

import argparse
import gc
import hashlib
import re
import sys
import time
from pathlib import Path

import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = Path(r"C:\Users\myfav\Documents\VScode\Irodori-TTS")
if str(IRODORI_ROOT) not in sys.path:
    sys.path.insert(0, str(IRODORI_ROOT))

from irodori_tts.inference_runtime import (  # noqa: E402
    InferenceRuntime,
    RuntimeKey,
    SamplingRequest,
    download_hf_checkpoint,
    save_wav,
)


CHECKPOINT = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
PLAN_PATH = ROOT / "docs" / "protagonist-voice-audition-master.md"
PUBLIC_ROOT = ROOT / "public" / "sfx" / "protagonist-voice-audition"
WAV_ROOT = IRODORI_ROOT / "outputs" / "protagonist-voice-audition"
CANDIDATE_KEYS = ("BASE", "BRIGHT", "COOL", "WARM", "RESOLVE")


def parse_plan() -> list[dict[str, object]]:
    if not PLAN_PATH.exists():
        raise RuntimeError(f"audition plan not found: {PLAN_PATH}")
    source = PLAN_PATH.read_text(encoding="utf-8")
    sections: list[dict[str, object]] = []
    heading_pattern = re.compile(r"^## (HS-[^ ]+|MG-[^ ]+) ([^/]+?) / (.+)$", re.MULTILINE)
    for match in heading_pattern.finditer(source):
        next_heading = re.search(r"^## ", source[match.end():], re.MULTILINE)
        end = match.end() + (next_heading.start() if next_heading else len(source[match.end():]))
        block = source[match.end():end]
        caption_match = re.search(r"^\*\*基準caption:\*\* (.+)$", block, re.MULTILINE)
        image_match = re.search(r"^\*\*立ち絵:\*\* (.+)$", block, re.MULTILINE)
        rows: list[dict[str, str]] = []
        for line in block.splitlines():
            if not line.startswith("| 0"):
                continue
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) < 6:
                continue
            candidate_parts = cells[0].split()
            rows.append(
                {
                    "candidate": cells[0],
                    "key": candidate_parts[-1],
                    "voice": cells[1],
                    "emotion": cells[2],
                    "speed": cells[3],
                    "text": cells[4].strip("「」"),
                    "direction": cells[5],
                }
            )
        if not caption_match or not image_match or len(rows) != 5:
            raise RuntimeError(f"invalid audition section: {match.group(1)}")
        keys = tuple(row["key"] for row in rows)
        if keys != CANDIDATE_KEYS:
            raise RuntimeError(f"unexpected candidate keys for {match.group(1)}: {keys}")
        sections.append(
            {
                "id": match.group(1),
                "theme": "high-school" if match.group(1).startswith("HS-") else "magic",
                "hero_id": match.group(2).strip(),
                "name": match.group(3).strip(),
                "caption": caption_match.group(1),
                "image_path": image_match.group(1).removeprefix("public/"),
                "rows": rows,
            }
        )
    if len(sections) != 26 or sum(len(section["rows"]) for section in sections) != 130:
        raise RuntimeError(f"expected 26 sections and 130 candidates, got {len(sections)} sections")
    return sections


def stable_seed(theme: str, hero_id: str, candidate_key: str, text: str) -> int:
    raw = f"{theme}/{hero_id}/{candidate_key}/{text}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(raw).digest()[:8], "little") % 2_000_000_000


def target_seconds(text: str) -> float:
    spoken_chars = len(re.sub(r"[、。！？!?\s…・「」『』（）()]", "", text))
    return round(min(7.0, max(4.2, 2.8 + spoken_chars * 0.09)), 2)


def candidate_caption(section: dict[str, object], row: dict[str, str]) -> str:
    return (
        f"{section['caption']}"
        f"候補声は{row['voice']}。テンションと感情は{row['emotion']}。話速は{row['speed']}。"
        f"追加演技指示: {row['direction']}"
        "説明文は読まず、自己紹介の本文だけを自然な日本語で発話する。"
        "棒読みを避け、キャラクターの立ち絵に合う若いアニメ主人公の演技にする。"
    )


def convert_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    audio, sample_rate = sf.read(str(wav_path), dtype="float32")
    ogg_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(ogg_path), audio, sample_rate, format="OGG", subtype="VORBIS")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 5 protagonist voice audition candidates with Irodori-TTS v4.")
    parser.add_argument("--force", action="store_true", help="Regenerate existing audition files.")
    parser.add_argument("--dry-run", action="store_true", help="List jobs without loading the model.")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--only", default="", help="Comma-separated protagonist IDs, such as WARRIOR,AKARI,REN")
    args = parser.parse_args()

    sections = parse_plan()
    only = {item.strip().upper() for item in args.only.split(",") if item.strip()}
    selected = [section for section in sections if not only or str(section["hero_id"]).upper() in only]
    jobs = [
        {"section": section, "row": row}
        for section in selected
        for row in section["rows"]  # type: ignore[index]
    ]
    print(f"jobs={len(jobs)} protagonists={len(selected)} candidates=5 steps={args.steps}", flush=True)
    if args.dry_run:
        for job in jobs[:10]:
            section = job["section"]
            row = job["row"]
            print(f"{section['theme']} {section['hero_id']} {row['key']}: {row['text']}")
        return

    checkpoint = download_hf_checkpoint(CHECKPOINT)
    runtime = InferenceRuntime.from_key(
        RuntimeKey(
            checkpoint=checkpoint,
            model_device="cuda",
            model_precision="bf16",
            codec_device="cpu",
            codec_precision="fp32",
            compile_model=False,
            compile_dynamic=False,
        )
    )

    generated = 0
    skipped = 0
    failed: list[str] = []
    started_all = time.time()
    for index, job in enumerate(jobs, start=1):
        section = job["section"]
        row = job["row"]
        theme = str(section["theme"])
        hero_id = str(section["hero_id"])
        candidate_key = str(row["key"])
        file_name = f"{int(str(row['candidate']).split()[0]):02d}-{candidate_key.lower()}"
        ogg_path = PUBLIC_ROOT / theme / hero_id / f"{file_name}.ogg"
        wav_path = WAV_ROOT / theme / hero_id / f"{file_name}.wav"
        if not args.force and ogg_path.exists() and ogg_path.stat().st_size > 0:
            skipped += 1
            continue
        line_id = f"audition-{theme}-{hero_id}-{candidate_key}"
        try:
            print(f"[{index}/{len(jobs)}] {theme} {hero_id} {candidate_key}: {row['text']}", flush=True)
            result = runtime.synthesize(
                SamplingRequest(
                    text=str(row["text"]),
                    caption=candidate_caption(section, row),
                    no_ref=True,
                    num_candidates=1,
                    decode_mode="sequential",
                    seconds=target_seconds(str(row["text"])),
                    min_seconds=3.0,
                    max_seconds=8.0,
                    num_steps=args.steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.8,
                    cfg_scale_speaker=0.0,
                    cfg_guidance_mode="independent",
                    t_schedule_mode="sway",
                    sway_coeff=-1.0,
                    context_kv_cache=True,
                    seed=stable_seed(theme, hero_id, candidate_key, str(row["text"])),
                    trim_tail=True,
                ),
                log_fn=None,
            )
            wav_path.parent.mkdir(parents=True, exist_ok=True)
            save_wav(wav_path, result.audio, result.sample_rate)
            convert_to_ogg(wav_path, ogg_path)
            generated += 1
            print(f"  done {time.time() - started_all:.1f}s -> {ogg_path.relative_to(ROOT)}", flush=True)
            del result
            gc.collect()
        except Exception as exc:  # noqa: BLE001
            failed.append(line_id)
            print(f"  failed {line_id}: {exc}", file=sys.stderr, flush=True)

    print(f"generated={generated} skipped={skipped} failed={len(failed)}", flush=True)
    if failed:
        print("failed jobs:", ", ".join(failed), file=sys.stderr, flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
