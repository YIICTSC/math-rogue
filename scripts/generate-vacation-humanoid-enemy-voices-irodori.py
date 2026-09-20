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


def create_lines(seed: dict[str, str]) -> dict[str, str]:
    role = seed["role"]
    motif = seed["motif"]
    name = seed["name"]
    if seed["theme"] == "high-school":
        return {
            "spawn": f"{name}、真夏の防衛線に出る！",
            "attack": f"{motif}、全開で叩き込む！",
            "defense": f"{role}の鉄壁、ここで受け止める！",
            "skill": f"{motif}、バカンス特別技――発動！",
            "damage": f"まだ沈まない！{role}、反撃態勢！",
            "defeat": "浜の記録はここまでだ……！",
        }
    return {
        "spawn": f"{name}、夏の魔導戦を始める！",
        "attack": f"{motif}、潮騒ごと撃ち抜く！",
        "defense": f"{role}の結界、絶対に崩さない！",
        "skill": f"{motif}、サマーフォース解放！",
        "damage": f"魔力はまだ燃えている！{role}、再起動！",
        "defeat": "この夏の魔法が……ほどけていく……！",
    }


def create_caption(seed: dict[str, str]) -> str:
    gender = "若い男性" if seed["gender"] == "male" else "若い女性"
    if seed["theme"] == "high-school":
        world = "真夏の海辺で戦う高校生の敵"
    else:
        world = "真夏の海辺で戦う魔法学園の敵"
    return (
        f"テンションが非常に高い、{world}の{gender}。"
        f"役柄は{seed['role']}。"
        "戦闘中の必殺技ボイスのように、明るく勢いよく大声で叫ぶ。"
        "語尾を強く、スピード感を出し、日本語をはっきり発音する。"
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
    only = {item.strip().lower() for item in args.only.split(",") if item.strip()}
    jobs = [
        {**seed, "action": action, "text": text}
        for seed in seeds
        for action, text in create_lines(seed).items()
        if not only or seed["id"].lower() in only
    ]
    print(f"jobs={len(jobs)} enemies={len(seeds)} steps={args.steps}", flush=True)
    if args.dry_run:
        for row in jobs[:12]:
            print(f"{row['theme']} {row['id']} {row['action']} {row['gender']}: {row['text']}")
        return

    checkpoint = download_hf_checkpoint(CHECKPOINT)
    runtime = InferenceRuntime.from_key(
        RuntimeKey(
            checkpoint=checkpoint,
            model_device="cuda",
            model_precision="fp32",
            codec_device="cuda",
            codec_precision="fp32",
            compile_model=False,
            compile_dynamic=False,
        )
    )

    wav_root = IRODORI_ROOT / "outputs" / "vacation-humanoid-voices"
    generated = 0
    skipped = 0
    failed: list[str] = []
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
                    no_ref=True,
                    num_candidates=1,
                    decode_mode="sequential",
                    seconds=target_seconds(row["text"], row["action"]),
                    num_steps=args.steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.6,
                    cfg_scale_speaker=0.0,
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
