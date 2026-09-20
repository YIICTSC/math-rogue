from __future__ import annotations

import argparse
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = ROOT.parent / "Irodori-TTS"
MODEL_REPO = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
WORK_ROOT = ROOT / "tmp" / "vacation-ending-voices-v4"
PUBLIC_ROOT = ROOT / "public" / "sfx" / "high-school-voices"

HIGH_SCHOOL_IDS = (
    "WARRIOR",
    "CARETAKER",
    "ASSASSIN",
    "DODGEBALL",
    "BARD",
    "LIBRARIAN",
    "CHEF",
    "GARDENER",
    "MAGE",
)

TONES = ("serious", "funny", "cool", "cute", "heartfelt")

HIGH_SCHOOL_CAPTIONS = {
    "WARRIOR": "高校生の男子アニメ主人公。低めでクールな若い中低音。反骨心があり、短く鋭く言い切る。決意の場面では熱を強めるが、大人の渋声にはしない。",
    "CARETAKER": "高校生の女性アニメ主人公。落ち着いた柔らかい中音。生き物を見守る包容力と、静かな芯の強さを出す。安心させる台詞は穏やかに、決意は明瞭に。",
    "ASSASSIN": "高校生の中性的な若いアニメ主人公。低めで静かな声。普段は抑制的で、秘密を抱えた距離感を出し、選択を語る場面だけ芯を強める。",
    "DODGEBALL": "高校生の男子アニメ主人公。明るく前へ押し出す中高音。スポーツ選手らしい息の勢いと素早いテンポを持ち、仲間への声かけは熱く爽やかに。",
    "BARD": "高校生の女性アニメ主人公。明るく通る放送部の声。言葉を届ける表現力と軽快なリズムを持ち、感動場面では温かな余韻を残す。",
    "LIBRARIAN": "高校生の女性アニメ主人公。知的で静かな中音。文芸部らしく言葉を丁寧に区切り、冷静さの中に好奇心と仲間への優しさを込める。",
    "CHEF": "高校生の男子アニメ主人公。気さくで頼れる明るい中低音。料理長らしい面倒見のよさと勢いを持ち、冗談は親しみやすく、決意は力強く。",
    "GARDENER": "高校生の女性アニメ主人公。穏やかで透明感のある中音。植物を育てるような優しさを保ち、未来を語る時は静かに力強く伸びる声。",
    "MAGE": "高校生の女性アニメ主人公。研究者らしい明瞭な中音。観察と仮説を語る冷静さ、実験が成功した時の知的な高揚感を自然に出す。",
}

TONE_DIRECTIONS = {
    "serious": "真剣な決意を低めに明瞭に伝える。",
    "funny": "軽快で親しみやすく、少し笑いを含ませる。",
    "cool": "余計な力を抜き、落ち着いた格好よさで言い切る。",
    "cute": "明るく弾むが、照れのある自然な可愛さを出す。",
    "heartfelt": "温かく感情を込め、最後に余韻を残す。",
}


def load_base_generator():
    path = ROOT / "scripts" / "generate-protagonist-ending-voices-v4.py"
    spec = importlib.util.spec_from_file_location("protagonist_ending_voices_v4", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load base generator: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_jobs() -> list[dict]:
    manifest_script = r'''
import { createServer } from 'vite';

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const copy = await server.ssrLoadModule('/src/data/vacationEndingCopy.ts');
  const characterIds = ['WARRIOR', 'CARETAKER', 'ASSASSIN', 'DODGEBALL', 'BARD', 'LIBRARIAN', 'CHEF', 'GARDENER', 'MAGE'];
  const tones = ['serious', 'funny', 'cool', 'cute', 'heartfelt'];
  const jobs = [];
  for (const heroId of characterIds) {
    for (const tone of tones) {
      const line = copy.getVacationEndingDialogue(heroId, tone);
      jobs.push({
        theme: 'high-school',
        kind: 'HS_VACATION_ENDING',
        heroId,
        tone,
        lineId: `vacation-ending-${tone}`,
        text: String(line.ja).replace(/^「|」$/g, '').trim(),
      });
    }
  }
  console.log(JSON.stringify(jobs));
} finally {
  await server.close();
}
'''
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(
        ["node", "--input-type=module", "-e", manifest_script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
    )
    jobs = json.loads(result.stdout)
    for job in jobs:
        job["public_path"] = str(PUBLIC_ROOT / job["heroId"] / f"{job['lineId']}.ogg")
        job["work_dir"] = str(WORK_ROOT / "assets" / job["heroId"])
    return jobs


def stable_seed(job: dict) -> int:
    import hashlib

    key = f"{job['theme']}/{job['heroId']}/{job['lineId']}/{job['text']}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(key).digest()[:4], "little") % 2_000_000_000


def get_caption(job: dict) -> str:
    base = HIGH_SCHOOL_CAPTIONS[job["heroId"]]
    direction = TONE_DIRECTIONS[job["tone"]]
    return (
        f"{base}バカンスモード高校編のエンディング。{direction}"
        "夏の旅を終え、仲間と未来を選ぶ余韻を込める。感情の起伏を明確にし、棒読みを避けた自然なキャラクター演技。"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate high-school Vacation ending voices with Irodori-TTS v4.")
    parser.add_argument("--force", action="store_true", help="Regenerate files that already exist.")
    parser.add_argument("--fast", action="store_true", help="Use 8 diffusion steps for a quick pass.")
    parser.add_argument("--promote", action="store_true", help="Copy generated OGG files into public/sfx.")
    parser.add_argument("--dry-run", action="store_true", help="List missing lines without loading the model.")
    parser.add_argument("--only", default="", help="Comma-separated protagonist IDs to process.")
    args = parser.parse_args()

    base = load_base_generator()
    jobs = load_jobs()
    only = {value.strip().upper() for value in args.only.split(",") if value.strip()}
    if only:
        jobs = [job for job in jobs if job["heroId"].upper() in only]

    print(f"model={MODEL_REPO}")
    print(f"jobs={len(jobs)} fast={args.fast} promote={args.promote}")
    missing = [job for job in jobs if not Path(job["public_path"]).is_file() or Path(job["public_path"]).stat().st_size == 0]
    print(f"missing={len(missing)} existing={len(jobs) - len(missing)}")
    if args.dry_run:
        for job in missing:
            print(f"{job['heroId']} {job['lineId']}: {job['text']}")
        return 0
    if not missing:
        print("No missing high-school Vacation ending voice materials found.")
        return 0

    runtime, SamplingRequest, save_wav = base.build_runtime()
    refs: dict[str, Path] = {}
    steps = 8 if args.fast else 16
    generated = 0
    skipped = 0
    failed: list[dict] = []
    started = time.time()
    for index, job in enumerate(jobs, start=1):
        public_path = Path(job["public_path"])
        if not args.force and public_path.is_file() and public_path.stat().st_size > 0:
            skipped += 1
            continue
        work_dir = Path(job["work_dir"])
        wav_path = work_dir / f"{job['lineId']}.wav"
        try:
            hero_id = job["heroId"]
            if hero_id not in refs:
                source = base.find_reference_source("high-school", hero_id)
                refs[hero_id] = base.prepare_reference(source, WORK_ROOT / "refs" / f"{hero_id}.wav")
            work_dir.mkdir(parents=True, exist_ok=True)
            print(f"[{index}/{len(jobs)}] {hero_id} {job['lineId']}: {job['text']}", flush=True)
            result = runtime.synthesize(
                SamplingRequest(
                    text=job["text"],
                    caption=get_caption(job),
                    ref_wav=str(refs[hero_id]),
                    seconds=3.2,
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
        except Exception as exc:  # Keep all existing public assets intact on failure.
            failed.append({"job": job, "error": repr(exc)})
            print(f"FAILED {job['heroId']}/{job['lineId']}: {exc}", file=sys.stderr, flush=True)

    manifest = {
        "model": MODEL_REPO,
        "steps": steps,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "jobs": jobs,
        "generated": generated,
        "skipped": skipped,
        "failed": failed,
    }
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    (WORK_ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    if failed:
        print(f"failed={len(failed)}; public assets were not promoted", file=sys.stderr)
        return 1
    if args.promote:
        for job in jobs:
            source = WORK_ROOT / "assets" / job["heroId"] / f"{job['lineId']}.ogg"
            target = Path(job["public_path"])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        print(f"promoted={len(jobs)} to public/sfx")
    print(f"complete generated={generated} skipped={skipped} elapsed={time.time() - started:.1f}s work_dir={WORK_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
