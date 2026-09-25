from __future__ import annotations

import argparse
import gc
import hashlib
import re
import shutil
import sys
import tempfile
import time
from pathlib import Path

import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = ROOT.parent / "Irodori-TTS"
CHECKPOINT = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
HS_VOICE_ROOT = ROOT / "public" / "sfx" / "high-school-voices"
MAGIC_VOICE_ROOT = ROOT / "public" / "sfx" / "magic-voices"
AUDITION_ROOT = ROOT / "public" / "sfx" / "protagonist-voice-audition"

REFERENCE_FILES = {
    ("high-school", "DODGEBALL"): AUDITION_ROOT / "high-school" / "DODGEBALL" / "01-base.ogg",
    ("magic", "HIYORI"): AUDITION_ROOT / "magic" / "HIYORI" / "02-bright.ogg",
}

TARGET_SECONDS = {"high-school": (0.65, 2.15), "magic": (0.65, 2.15)}

STYLE_CAPTIONS = {
    ("high-school", "DODGEBALL"): (
        "指定された採用参照音声と同じ人物の声として、声色・声域・年齢感を保つ。"
        "高校生男子の張りのある若い中音。バスケ部エースらしく快活で自信があり、"
        "少し速めのテンポで子音と語尾を歯切れよく明瞭にする。爽快で仲間思い。"
        "スポーツらしい勢いは出すが、怒鳴り続けず、威圧的にも大人びすぎにもならない。"
    ),
    ("magic", "HIYORI"): (
        "指定された採用参照音声と同じ人物の声として、声色・声域・年齢感を保つ。"
        "花咲ひよりの明るく優しい女性中高音。春の日差しのような温かさと、"
        "花が開く瞬間の素直な喜びを込める。短い戦闘台詞を明瞭に、歯切れよく届ける。"
        "高く幼くなりすぎず、鋭い攻撃台詞も優しさを失わず、悲鳴のように叫ばない。"
    ),
}

ACTION_DIRECTIONS = {
    "attack": "一瞬の攻撃に合わせた短い掛け声。出だしを明瞭にして素早く言い切る。",
    "summon": "仲間へ呼びかける。相手に届く明るさと、チームへの信頼を込める。",
    "block": "攻撃を受け止める瞬間。反射的だが言葉ははっきり、頼もしさを出す。",
    "power": "力が高まる高揚感。短く勢いよく、声を張りすぎず前向きに言い切る。",
    "damage": "被弾の反応。痛みや驚きを短く自然に表し、過度な絶叫にしない。",
    "item": "アイテム使用時の短い台詞。機敏に、明るくテンポよく発話する。",
    "finish": "勝負を決める瞬間。爽快な達成感を込め、最後を気持ちよく締める。",
    "defeat": "力尽きる悔しさや仲間への思い。短く抑制し、過度に暗く重くしない。",
    "spell": "魔法技の名前を明瞭に発音する。華やかで弾みのある声、最後まで言い切る。",
}


def read_high_school_jobs() -> list[dict[str, str]]:
    source = (ROOT / "docs" / "high-school-voice-lines.md").read_text(encoding="utf-8")
    heading = re.search(r"^## バスケ部エース\s*$", source, re.MULTILINE)
    if not heading:
        raise RuntimeError("バスケ部エースの戦闘ボイス節が見つかりません")
    next_heading = re.search(r"^## ", source[heading.end():], re.MULTILINE)
    end = heading.end() + next_heading.start() if next_heading else len(source)
    section = source[heading.end():end]
    jobs = [
        {"theme": "high-school", "hero_id": "DODGEBALL", "line_id": line_id, "text": text.strip()}
        for line_id, text in re.findall(r"\b((?:attack|summon|block|power|damage|item|finish|defeat)-\d+)「([^」]+)」", section)
    ]
    if len(jobs) != 40:
        raise RuntimeError(f"DODGEBALLは戦闘ボイス40件を想定しています。取得数: {len(jobs)}")
    return jobs


def read_hiyori_jobs() -> list[dict[str, str]]:
    source = (ROOT / "docs" / "magic-voice-lines.md").read_text(encoding="utf-8")
    row = next((line for line in source.splitlines() if line.startswith("| HIYORI |")), None)
    if row is None:
        raise RuntimeError("花咲ひよりの戦闘ボイス行が見つかりません")
    jobs = [
        {"theme": "magic", "hero_id": "HIYORI", "line_id": line_id, "text": text.strip()}
        for line_id, text in re.findall(r"\b((?:attack|damage|spell)-\d+):\s*([^<|]+)", row)
    ]
    if len(jobs) != 9:
        raise RuntimeError(f"HIYORIは戦闘ボイス9件を想定しています。取得数: {len(jobs)}")
    return jobs


def stable_seed(job: dict[str, str]) -> int:
    raw = f"battle-v4/{job['theme']}/{job['hero_id']}/{job['line_id']}/{job['text']}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(raw).digest()[:4], "little") % 2_000_000_000


def target_seconds(text: str, theme: str) -> float:
    spoken_chars = len(re.sub(r"[\s、。！？!?・…「」『』（）()]", "", text))
    low, high = TARGET_SECONDS[theme]
    return round(min(high, max(low, 0.45 + spoken_chars * 0.105)), 2)


def caption_for(job: dict[str, str]) -> str:
    kind = job["line_id"].split("-", 1)[0]
    return STYLE_CAPTIONS[(job["theme"], job["hero_id"])] + ACTION_DIRECTIONS[kind] + (
        "本文のセリフだけを日本語で発話する。説明や台詞の読み上げ前の案内は加えない。"
        "短いゲーム内戦闘ボイスとして、間延びさせず自然に言い切る。"
    )


def prepare_reference(source: Path, destination: Path) -> Path:
    if not source.is_file() or source.stat().st_size == 0:
        raise FileNotFoundError(f"採用参照音声がありません: {source}")
    audio, sample_rate = sf.read(str(source), dtype="float32")
    destination.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(destination), audio, sample_rate, format="WAV", subtype="PCM_16")
    return destination


def convert_to_ogg(wav_path: Path, ogg_path: Path) -> float:
    audio, sample_rate = sf.read(str(wav_path), dtype="float32")
    ogg_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(ogg_path), audio, sample_rate, format="OGG", subtype="VORBIS")
    duration = float(sf.info(str(ogg_path)).duration)
    if duration < 0.25 or duration > 2.8:
        raise RuntimeError(f"生成尺が戦闘ボイスの範囲外です: {duration:.2f}s")
    return duration


def build_runtime():
    if str(IRODORI_ROOT) not in sys.path:
        sys.path.insert(0, str(IRODORI_ROOT))
    from irodori_tts.inference_runtime import InferenceRuntime, RuntimeKey, SamplingRequest, download_hf_checkpoint, save_wav

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
    return runtime, SamplingRequest, save_wav


def main() -> int:
    parser = argparse.ArgumentParser(description="Regenerate DODGEBALL and HIYORI battle voices with Irodori-TTS v4.")
    parser.add_argument("--steps", type=int, default=16)
    parser.add_argument("--dry-run", action="store_true", help="List the selected lines without loading the model.")
    args = parser.parse_args()

    jobs = read_high_school_jobs() + read_hiyori_jobs()
    if args.steps < 1:
        parser.error("--steps must be a positive integer")
    print(f"model={CHECKPOINT} steps={args.steps} jobs={len(jobs)}")
    for job in jobs:
        print(
            f"{job['theme']} {job['hero_id']} {job['line_id']} "
            f"target={target_seconds(job['text'], job['theme']):.2f}s: {job['text']}"
        )
    if args.dry_run:
        return 0

    runtime, SamplingRequest, save_wav = build_runtime()
    generated: list[tuple[dict[str, str], Path, float]] = []
    failed: list[str] = []
    started = time.time()
    temp_root = ROOT / "tmp"
    temp_root.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="protagonist-battle-voices-v4-", dir=temp_root) as temp_name:
        work_root = Path(temp_name)
        references = {
            key: prepare_reference(source, work_root / "references" / f"{key[1]}.wav")
            for key, source in REFERENCE_FILES.items()
        }

        for index, job in enumerate(jobs, start=1):
            key = (job["theme"], job["hero_id"])
            wav_path = work_root / "wav" / job["theme"] / job["hero_id"] / f"{job['line_id']}.wav"
            ogg_path = work_root / "ogg" / job["theme"] / job["hero_id"] / f"{job['line_id']}.ogg"
            requested_seconds = target_seconds(job["text"], job["theme"])
            print(f"[{index}/{len(jobs)}] {job['hero_id']} {job['line_id']} ({requested_seconds:.2f}s)", flush=True)
            try:
                result = runtime.synthesize(
                    SamplingRequest(
                        text=job["text"],
                        caption=caption_for(job),
                        ref_wav=str(references[key]),
                        seconds=requested_seconds,
                        min_seconds=0.5,
                        max_seconds=2.5,
                        num_steps=args.steps,
                        cfg_scale_text=3.0,
                        cfg_scale_caption=3.0,
                        cfg_scale_speaker=5.0,
                        cfg_guidance_mode="independent",
                        seed=stable_seed(job),
                        t_schedule_mode="sway",
                        sway_coeff=-1.0,
                        trim_tail=True,
                    ),
                    log_fn=None,
                )
                wav_path.parent.mkdir(parents=True, exist_ok=True)
                save_wav(wav_path, result.audio, result.sample_rate)
                duration = convert_to_ogg(wav_path, ogg_path)
                generated.append((job, ogg_path, duration))
                print(f"  ready {duration:.2f}s", flush=True)
                del result
                gc.collect()
            except Exception as exc:  # Keep all current game assets intact if any clip fails.
                failed.append(f"{job['hero_id']}/{job['line_id']}: {exc!r}")
                print(f"  FAILED: {exc}", file=sys.stderr, flush=True)

        if failed:
            print(f"No public files were replaced; failed={len(failed)}", file=sys.stderr)
            for item in failed:
                print(f"  {item}", file=sys.stderr)
            return 1
        if len(generated) != 49:
            print(f"No public files were replaced; expected 49 generated clips, got {len(generated)}", file=sys.stderr)
            return 1

        for job, source, _duration in generated:
            target_root = HS_VOICE_ROOT if job["theme"] == "high-school" else MAGIC_VOICE_ROOT
            target = target_root / job["hero_id"] / f"{job['line_id']}.ogg"
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)

    print(f"promoted={len(generated)} (DODGEBALL=40, HIYORI=9) elapsed={time.time() - started:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
