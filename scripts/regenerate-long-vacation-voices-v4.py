from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = ROOT.parent / "Irodori-TTS"
MODEL_REPO = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
WORK_ROOT = ROOT / "tmp" / "long-vacation-voices-v4"
SOURCE_MANIFESTS = (
    ROOT / "tmp" / "vacation-voices-v4" / "manifest.json",
    ROOT / "tmp" / "vacation-ending-voices-v4" / "manifest.json",
)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def target_seconds(text: str) -> float:
    # Japanese TTS needs more room than the original fixed 3.2-second pass.
    # Keep every selected long line below the runtime's 8-second generation cap.
    return round(min(8.0, max(4.9, 2.5 + len(text) * 0.10)), 1)


def load_jobs(threshold: int) -> list[dict]:
    jobs: list[dict] = []
    for manifest_path in SOURCE_MANIFESTS:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
        for source_job in payload["jobs"]:
            text = source_job["text"]
            if len(text) < threshold:
                continue
            job = dict(source_job)
            job["source_manifest"] = str(manifest_path)
            job["target_seconds"] = target_seconds(text)
            jobs.append(job)
    unique: dict[str, dict] = {}
    for job in jobs:
        unique[job["public_path"]] = job
    return list(unique.values())


def get_job_value(job: dict, snake: str, camel: str):
    return job.get(snake, job.get(camel))


def stable_seed(job: dict) -> int:
    text = job["text"]
    key = f"{job['theme']}/{get_job_value(job, 'hero_id', 'heroId')}/{get_job_value(job, 'line_id', 'lineId')}/{text}/long".encode("utf-8")
    return int.from_bytes(hashlib.sha256(key).digest()[:4], "little") % 2_000_000_000


def main() -> int:
    parser = argparse.ArgumentParser(description="Regenerate long Vacation voice lines with longer Irodori-TTS v4 durations.")
    parser.add_argument("--threshold", type=int, default=24, help="Minimum Japanese character count to regenerate.")
    parser.add_argument("--fast", action="store_true", help="Use 8 diffusion steps.")
    parser.add_argument("--promote", action="store_true", help="Copy regenerated OGG files into public/sfx.")
    parser.add_argument("--dry-run", action="store_true", help="List selected lines without loading the model.")
    args = parser.parse_args()

    base = load_module("protagonist_ending_voice_generator", ROOT / "scripts" / "generate-protagonist-ending-voices-v4.py")
    vacation = load_module("vacation_voice_generator", ROOT / "scripts" / "generate-vacation-voices-v4.py")
    vacation_ending = load_module("vacation_ending_voice_generator", ROOT / "scripts" / "generate-vacation-ending-voices-v4.py")
    jobs = load_jobs(args.threshold)

    print(f"model={MODEL_REPO}")
    print(f"threshold={args.threshold} jobs={len(jobs)} fast={args.fast} promote={args.promote}")
    by_kind: dict[str, int] = {}
    for job in jobs:
        by_kind[job["kind"]] = by_kind.get(job["kind"], 0) + 1
    print(f"kinds={json.dumps(by_kind, ensure_ascii=False)}")
    for job in jobs:
        print(
            f"{job['kind']} {get_job_value(job, 'hero_id', 'heroId')} "
            f"{get_job_value(job, 'line_id', 'lineId')} chars={len(job['text'])} "
            f"seconds={job['target_seconds']}"
        )
    if args.dry_run:
        return 0

    runtime, SamplingRequest, save_wav = base.build_runtime()
    refs: dict[tuple[str, str], Path] = {}
    steps = 8 if args.fast else 16
    generated = 0
    failed: list[dict] = []
    started = time.time()

    for index, job in enumerate(jobs, start=1):
        theme = job["theme"]
        hero_id = get_job_value(job, "hero_id", "heroId")
        line_id = get_job_value(job, "line_id", "lineId")
        work_dir = WORK_ROOT / "assets" / theme / hero_id
        wav_path = work_dir / f"{line_id}.wav"
        try:
            cache_key = (theme, hero_id)
            if cache_key not in refs:
                source = base.find_reference_source(theme, hero_id)
                refs[cache_key] = base.prepare_reference(source, WORK_ROOT / "refs" / theme / f"{hero_id}.wav")
            if job["kind"] == "HS_VACATION_ENDING":
                caption = vacation_ending.get_caption(job)
            else:
                caption = vacation.get_caption(base, job)
            work_dir.mkdir(parents=True, exist_ok=True)
            print(
                f"[{index}/{len(jobs)}] {job['kind']} {hero_id} {line_id} "
                f"chars={len(job['text'])} seconds={job['target_seconds']}: {job['text']}",
                flush=True,
            )
            result = runtime.synthesize(
                SamplingRequest(
                    text=job["text"],
                    caption=caption,
                    ref_wav=str(refs[cache_key]),
                    seconds=job["target_seconds"],
                    min_seconds=0.5,
                    max_seconds=8.0,
                    num_steps=steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.0,
                    cfg_scale_speaker=5.0,
                    cfg_guidance_mode="independent",
                    seed=stable_seed(job),
                    t_schedule_mode="sway",
                    sway_coeff=-1.0,
                    trim_tail=True,
                )
            )
            save_wav(wav_path, result.audio, result.sample_rate)
            base.convert_to_ogg(wav_path)
            generated += 1
        except Exception as exc:
            failed.append({"job": job, "error": repr(exc)})
            print(f"FAILED {job['kind']}/{hero_id}/{line_id}: {exc}", file=sys.stderr, flush=True)

    manifest = {
        "model": MODEL_REPO,
        "steps": steps,
        "threshold": args.threshold,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "planned": len(jobs),
        "generated": generated,
        "failed": failed,
        "jobs": jobs,
    }
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    (WORK_ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    if failed:
        print(f"failed={len(failed)}; public assets were not promoted", file=sys.stderr)
        return 1
    if args.promote:
        for job in jobs:
            theme = job["theme"]
            hero_id = get_job_value(job, "hero_id", "heroId")
            line_id = get_job_value(job, "line_id", "lineId")
            source = WORK_ROOT / "assets" / theme / hero_id / f"{line_id}.ogg"
            target = Path(job["public_path"])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        print(f"promoted={len(jobs)} to public/sfx")
    print(f"complete generated={generated} elapsed={time.time() - started:.1f}s work_dir={WORK_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
