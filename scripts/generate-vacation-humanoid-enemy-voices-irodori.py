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


ACTIONS = ("spawn", "attack", "defense", "skill", "damage", "defeat")
CHECKPOINT = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
PLAN_PATH = ROOT / "docs/vacation-humanoid-enemy-voice-lines-450.md"

AGE_BAND_IDS = {
    "young adult": {
        "hs_01", "hs_08", "hs_12", "hs_15", "hs_17", "hs_20", "hs_21", "hs_24", "hs_26",
        "hs_28", "hs_32", "hs_36", "hs_40", "hs_41", "hs_44", "hs_45", "hs_47", "hs_49",
        "mg_00", "mg_08", "mg_11", "mg_17", "mg_19",
    },
    "adult": {
        "hs_02", "hs_03", "hs_06", "hs_09", "hs_18", "hs_19", "hs_22", "hs_23", "hs_25",
        "hs_27", "hs_30", "hs_31", "hs_34", "hs_35", "hs_37", "hs_42", "hs_43", "hs_46", "hs_48",
        "mg_01", "mg_02", "mg_03", "mg_04", "mg_05", "mg_06", "mg_07", "mg_09", "mg_10", "mg_12",
        "mg_14", "mg_18", "mg_21",
    },
    "mature": {
        "hs_00", "hs_04", "hs_05", "hs_07", "hs_10", "hs_11", "hs_16", "hs_29", "hs_33", "hs_38",
        "hs_39", "hs_50", "hs_51", "hs_52",
        "mg_13", "mg_15", "mg_16", "mg_20",
    },
    "older": {"hs_13", "hs_14"},
}
AGE_BAND_BY_ID = {enemy_id: age_band for age_band, ids in AGE_BAND_IDS.items() for enemy_id in ids}

SPECIAL_VOICE_DIRECTIONS = {
    "hs_01": "成人女性として高くしすぎず、短く鋭く発声する。",
    "hs_05": "成熟した救難隊長。太く通る男性声で指示語を強くする。",
    "hs_13": "深めの教育者声。叱責にも余裕を持たせる。",
    "hs_14": "重低音で速度を少し落とし、最も強い威圧感を出す。",
    "hs_15": "明るくスポーティで、テンポを速める。",
    "hs_20": "若く粗めのロックボーカルのように勢いを出す。",
    "hs_26": "高めで明るく、応援声の張りを強くする。",
    "hs_37": "学生声ではなく、低めで冷静な女性声にする。",
    "hs_39": "中性的なくぐもった低音。男性性より重装感を優先する。",
    "hs_42": "くぐもりと無機質さを優先し、研究兵らしさを出す。",
    "hs_48": "中性的で演劇的。役を演じるように発声する。",
    "hs_52": "低めの女性声で、高貴さと命令調を強める。",
    "mg_00": "若い成人女性声で高めに元気よく、見習いらしい勢いを残す。",
    "mg_08": "若い成人女性声。柔らかいが語尾に不気味な無邪気さを入れる。",
    "mg_15": "低く重く、腹から響くような男性声にする。",
    "mg_16": "低めでゆっくり。焦らず余裕のある話し方にする。",
    "mg_17": "細く静かで息を多めにし、幽玄さを出す。",
    "mg_20": "女性声の中でも最も威厳を強くし、低めでゆっくりにする。",
    "mg_21": "低めで神秘的。感情を抑えた女王口調にする。",
}


def parse_seeds() -> list[dict[str, str]]:
    source = (ROOT / "src/data/humanoidEnemyVoiceLines.ts").read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*'([^']+)'\s*,\s*imageIndex:\s*(\d+)\s*,\s*"
        r"name:\s*'([^']+)'\s*,\s*gender:\s*'([^']+)'\s*,\s*"
        r"speakerId:\s*'([^']+)'\s*,\s*role:\s*'([^']+)'\s*,\s*motif:\s*'([^']+)'\s*\}"
    )
    rows: list[dict[str, str]] = []
    for enemy_id, image_index, name, gender, speaker_id, role, motif in pattern.findall(source):
        if not speaker_id.startswith("ENEMY_VACATION_"):
            continue
        rows.append(
            {
                "theme": "high-school" if enemy_id.startswith("hs_") else "magic",
                "id": enemy_id,
                "image_index": image_index,
                "name": name,
                "gender": gender,
                "speaker_id": speaker_id,
                "role": role,
                "motif": motif,
            }
        )
    if len(rows) != 75:
        raise RuntimeError(f"expected 75 vacation humanoid seeds, found {len(rows)}")
    return rows


def parse_plan_lines(seeds: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    if not PLAN_PATH.exists():
        raise RuntimeError(f"voice-line plan not found: {PLAN_PATH}")
    rows: dict[str, dict[str, str]] = {}
    theme: str | None = None
    for raw_line in PLAN_PATH.read_text(encoding="utf-8").splitlines():
        if raw_line.startswith("## 高校編"):
            theme = "high-school"
        elif raw_line.startswith("## マジック編"):
            theme = "magic"
        if theme is None or not raw_line.lstrip().startswith("|"):
            continue
        cells = [cell.strip().strip("`") for cell in raw_line.strip().strip("|").split("|")]
        if len(cells) != 11 or not re.fullmatch(r"(?:hs|mg)_\d{2}", cells[1]):
            continue
        rows[cells[1]] = {
            "theme": theme,
            "speaker_id": cells[2],
            "gender": cells[3],
            "role": cells[4],
            **{action: cells[5 + index] for index, action in enumerate(ACTIONS)},
        }

    seed_by_id = {seed["id"]: seed for seed in seeds}
    if len(rows) != len(seeds):
        raise RuntimeError(f"expected {len(seeds)} plan rows, found {len(rows)}")
    if set(rows) != set(seed_by_id):
        missing = sorted(set(seed_by_id) - set(rows))
        extra = sorted(set(rows) - set(seed_by_id))
        raise RuntimeError(f"plan ids do not match seeds; missing={missing} extra={extra}")

    texts: list[str] = []
    for enemy_id, row in rows.items():
        seed = seed_by_id[enemy_id]
        for key in ("theme", "speaker_id", "gender", "role"):
            if row[key] != seed[key]:
                raise RuntimeError(f"plan mismatch for {enemy_id} {key}: {row[key]!r} != {seed[key]!r}")
        for action in ACTIONS:
            if not row[action].strip():
                raise RuntimeError(f"empty planned line: {enemy_id} {action}")
            texts.append(row[action])
    duplicates = len(texts) - len(set(texts))
    if duplicates:
        raise RuntimeError(f"planned voice lines contain {duplicates} duplicate texts")
    if set(AGE_BAND_BY_ID) != set(seed_by_id):
        raise RuntimeError("age-band mapping does not cover all vacation humanoid seeds")
    return rows


def create_caption(seed: dict[str, str]) -> str:
    gender = "男性" if seed["gender"] == "male" else "女性"
    age_band = AGE_BAND_BY_ID[seed["id"]]
    if seed["theme"] == "high-school":
        world = "真夏の海辺で戦う高校生の敵"
    else:
        world = "真夏の海辺で戦う魔法学園の敵"
    age_direction = {
        "young adult": "若年成人らしく、明瞭で軽快にする。",
        "adult": "成人らしく、中音から中低音で落ち着きと自信を出す。",
        "mature": "中堅成人らしく、低めで厚みのある権威的な声にする。",
        "older": "年長成人らしく、深く重く、間を長めに取って威厳を出す。",
    }[age_band]
    special_direction = SPECIAL_VOICE_DIRECTIONS.get(seed["id"], "")
    return (
        f"{world}の{gender}。見た目年齢は{age_band}。"
        f"役柄は{seed['role']}。"
        f"{age_direction}"
        "戦闘中のキャラクターボイスとして、台詞の意味に合う感情と勢いを付ける。"
        "語尾を明瞭に、日本語をはっきり発音する。"
        f"個別指示: {special_direction}"
    )


def stable_seed(line_id: str) -> int:
    digest = hashlib.sha256(line_id.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "little") % 2_000_000_000


def target_seconds(text: str, action: str) -> float:
    minimum = {
        "spawn": 1.65,
        "attack": 1.55,
        "defense": 1.75,
        "skill": 1.7,
        "damage": 1.65,
        "defeat": 1.55,
    }.get(action, 1.6)
    spoken_chars = len(re.sub(r"[、。！？!?\s…・「」『』（）()]", "", text))
    return round(min(3.0, max(minimum, 0.62 + spoken_chars * 0.085)), 2)


def create_reference_text(seed: dict[str, str]) -> str:
    if seed["theme"] == "high-school":
        return f"私は{seed['role']}。この声で、夏の浜辺を守る。"
    return f"私は{seed['role']}。この声で、夏の魔法戦を制する。"


def convert_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    audio, sample_rate = sf.read(str(wav_path), dtype="float32")
    ogg_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(ogg_path), audio, sample_rate, format="OGG", subtype="VORBIS")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate vacation humanoid enemy voices with Irodori-TTS v4.")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--only", default="", help="Comma-separated profile ids, such as hs_00,mg_21")
    args = parser.parse_args()

    seeds = parse_seeds()
    plan_lines = parse_plan_lines(seeds)
    only = {item.strip().lower() for item in args.only.split(",") if item.strip()}
    selected_seeds = [
        seed for seed in seeds if not only or seed["id"].lower() in only
    ]
    jobs = [
        {**seed, "action": action, "text": plan_lines[seed["id"]][action]}
        for seed in selected_seeds
        for action in ACTIONS
    ]
    print(
        f"jobs={len(jobs)} enemies={len(selected_seeds)} plan={PLAN_PATH.name} "
        f"speaker_refs={len(selected_seeds)} steps={args.steps}",
        flush=True,
    )
    if args.dry_run:
        for row in jobs[:12]:
            print(f"{row['theme']} {row['id']} {row['action']} {row['gender']}: {row['text']}")
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

    wav_root = IRODORI_ROOT / "outputs" / "vacation-humanoid-voices"
    reference_root = IRODORI_ROOT / "outputs" / "vacation-humanoid-reference-voices"
    generated = 0
    skipped = 0
    failed: list[str] = []
    reference_paths: dict[str, Path] = {}

    for index, seed in enumerate(selected_seeds, start=1):
        reference_path = reference_root / seed["theme"] / seed["id"] / "reference.wav"
        reference_paths[seed["id"]] = reference_path
        reference_id = f"vacation-reference-{seed['theme']}-{seed['id']}"
        if not args.force and reference_path.exists():
            print(f"[reference {index}/{len(selected_seeds)}] {seed['theme']} {seed['id']} reused", flush=True)
            continue
        started = time.time()
        try:
            print(f"[reference {index}/{len(selected_seeds)}] {seed['theme']} {seed['id']}", flush=True)
            result = runtime.synthesize(
                SamplingRequest(
                    text=create_reference_text(seed),
                    caption=create_caption(seed),
                    no_ref=True,
                    num_candidates=1,
                    decode_mode="sequential",
                    seconds=2.6,
                    num_steps=args.steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.6,
                    cfg_scale_speaker=0.0,
                    cfg_guidance_mode="independent",
                    t_schedule_mode="sway",
                    sway_coeff=-1.0,
                    context_kv_cache=True,
                    seed=stable_seed(reference_id),
                    trim_tail=True,
                ),
                log_fn=None,
            )
            reference_path.parent.mkdir(parents=True, exist_ok=True)
            save_wav(reference_path, result.audio, result.sample_rate)
            print(f"  reference ready {time.time() - started:.1f}s", flush=True)
            del result
            gc.collect()
        except Exception as exc:  # noqa: BLE001
            failed.append(reference_id)
            print(f"  reference failed: {exc}", file=sys.stderr, flush=True)

    if failed:
        print("failed references:", ", ".join(failed), file=sys.stderr, flush=True)
        raise SystemExit(1)

    for index, row in enumerate(jobs, start=1):
        out_dir = ROOT / "public/sfx/enemy-voices-vacation" / row["theme"] / row["id"]
        ogg_path = out_dir / f"{row['action']}.ogg"
        wav_path = wav_root / row["theme"] / row["id"] / f"{row['action']}.wav"
        if not args.force and ogg_path.exists():
            skipped += 1
            continue
        started = time.time()
        line_id = f"vacation-{row['theme']}-{row['id']}-{row['action']}"
        try:
            print(f"[{index}/{len(jobs)}] {row['theme']} {row['id']} {row['action']} {row['gender']}", flush=True)
            result = runtime.synthesize(
                SamplingRequest(
                    text=row["text"],
                    caption=create_caption(row),
                    ref_wav=str(reference_paths[row["id"]]),
                    ref_normalize_db=-16.0,
                    ref_ensure_max=True,
                    no_ref=False,
                    num_candidates=1,
                    decode_mode="sequential",
                    seconds=target_seconds(row["text"], row["action"]),
                    num_steps=args.steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.6,
                    cfg_scale_speaker=4.0,
                    cfg_guidance_mode="independent",
                    t_schedule_mode="sway",
                    sway_coeff=-1.0,
                    context_kv_cache=True,
                    seed=stable_seed(line_id),
                    trim_tail=True,
                ),
                log_fn=None,
            )
            wav_path.parent.mkdir(parents=True, exist_ok=True)
            save_wav(wav_path, result.audio, result.sample_rate)
            convert_to_ogg(wav_path, ogg_path)
            generated += 1
            print(f"  done {time.time() - started:.1f}s -> {ogg_path.relative_to(ROOT)}", flush=True)
            del result
            gc.collect()
        except Exception as exc:  # noqa: BLE001
            failed.append(line_id)
            print(f"  failed: {exc}", file=sys.stderr, flush=True)

    print(f"generated={generated} skipped={skipped} failed={len(failed)}", flush=True)
    if failed:
        print("failed lines:", ", ".join(failed), file=sys.stderr, flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
