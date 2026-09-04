from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = ROOT.parent / "Irodori-TTS"
MODEL_REPO = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
WORK_ROOT = ROOT / "tmp" / "protagonist-ending-voices-v4"
PUBLIC_ROOTS = {
    "high-school": ROOT / "public" / "sfx" / "high-school-voices",
    "magic": ROOT / "public" / "sfx" / "magic-event-voices",
}

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

MAGIC_CAPTIONS = {
    "AKARI": "高校生の女性魔法主人公。明るくまっすぐな若い中高音。仲間を照らすリーダーらしく、前向きな台詞は弾むように、決意は力強く。",
    "SHIZUKU": "高校生の女性魔法主人公。冷静で透明感のある中音。論理的に落ち着いて話し、感情が揺れる場面では抑えた優しさをにじませる。",
    "HIYORI": "高校生の女性魔法主人公。柔らかく包み込む穏やかな中音。相手を安心させる温かさを持ち、守る決意は静かに強く。",
    "TSUBASA": "高校生の女性魔法主人公。熱血で率直な明るい中高音。短い言葉を勢いよく届け、仲間を鼓舞する場面ではまっすぐ熱く。",
    "REI": "高校生の女性魔法主人公。寡黙で厳格な低めの声。無駄なく静かに話し、守る言葉だけに深い庇護と意志を込める。",
    "MADOKA": "高校生の女性魔法主人公。内気で知的な若い中音。少し控えめだが研究への情熱があり、勇気を出す場面では声を一段明るくする。",
    "KOHARU": "高校生の女性魔法主人公。穏やかで自然体の中音。風のように柔らかく話し、仲間を導く時は落ち着いた芯を見せる。",
    "MIRAI": "高校生の女性魔法主人公。華やかで表現力のある中高音。舞台のように明るく弾ませつつ、本音の場面では寂しさと温かさを自然に出す。",
    "SERA": "高校生の女性魔法主人公。礼儀正しく透明感のある中高音。異世界の記録者らしい丁寧さと、希望を失わない素直な明るさを持つ。",
    "REN": "高校生の男性魔法主人公。世話焼きで誠実な若い中低音。近い距離の親しみやすさを持ち、仲間を守る時は頼れる力強さを出す。",
    "SOMA": "高校生の男性魔法主人公。規律正しく知的な中低音。完璧主義らしく明瞭に区切り、感情を選ぶ場面では抑えた誠実さを込める。",
    "MINATO": "高校生の男性魔法主人公。素直で努力家の若い中音。少し控えめな親しみやすさから始め、成長と決意の場面では前向きに声を張る。",
    "RIKU": "高校生の男性魔法主人公。飄々とした軽やかな中音。知的な余裕と遊び心を持ち、仲間を選ぶ場面では静かな本気を見せる。",
    "YAMATO": "高校生の男性魔法主人公。ぶっきらぼうで熱い低めの声。乱暴な語尾の奥に情の厚さを持ち、守る台詞は腹から強く。",
    "LEON": "高校生の男性魔法主人公。華やかで自信のある中高音。舞台役者のように響かせ、冗談は軽く、仲間への本音はまっすぐ輝かせる。",
    "ELLIOT": "高校生の男性魔法主人公。礼儀正しく気品のある静かな中低音。星界の記録者らしい距離感と孤独を持ち、希望の台詞には柔らかな光を込める。",
    "SAKUYA": "高校生の男性魔法主人公。冷たく抑えた低音。封印術師らしく言葉を重く区切り、過去を越える決意には隠れた熱と優しさを込める。",
}

ENDING_TONE_DIRECTIONS = {
    "serious": "真剣な決意を低めに明瞭に伝える。",
    "funny": "軽快で親しみやすく、少し笑いを含ませる。",
    "cool": "余計な力を抜き、落ち着いた格好よさで言い切る。",
    "cute": "明るく弾むが、照れのある自然な可愛さを出す。",
    "heartfelt": "温かく感情を込め、最後に余韻を残す。",
}


def load_jobs() -> dict:
    manifest_script = r'''
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const themed = await server.ssrLoadModule('/src/data/themedEndingSequences.ts');
  const endless = await server.ssrLoadModule('/src/data/endlessEndingSequences.ts');
  const revisions = await server.ssrLoadModule('/src/data/endlessEndingCopyRevision.ts');
  const endingService = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const jobs = [];
  const add = (job) => jobs.push({ ...job, text: String(job.text).replace(/^「|」$/g, '').trim() });
  const quote = (value) => String(value).match(/「([^」]+)」/)?.[1] ?? String(value);
  const hasPublic = (theme, heroId, lineId) => fs.existsSync(path.join(process.cwd(), 'public', 'sfx', theme === 'magic' ? 'magic-event-voices' : 'high-school-voices', heroId, `${lineId}.ogg`));

  const highSchoolIds = ['WARRIOR', 'CARETAKER', 'ASSASSIN', 'DODGEBALL', 'BARD', 'LIBRARIAN', 'CHEF', 'GARDENER', 'MAGE'];
  for (const heroId of highSchoolIds) {
    for (const variant of themed.getThemedEndingVariants('high-school', heroId, heroId)) {
      const lineId = `ending-${variant.id}`;
      if (!hasPublic('high-school', heroId, lineId)) add({ theme: 'high-school', kind: 'ENDING', heroId, lineId, text: quote(variant.pages[2].text) });
    }
    for (const kind of ['OPENING', 'TRUE']) {
      const sequence = endless.getEndlessEndingSequence(kind, heroId, heroId, 'high-school');
      sequence.pages.forEach((page, index) => {
        const lineId = `endless-${kind.toLowerCase()}-${index + 1}`;
        if (!hasPublic('high-school', heroId, lineId)) add({ theme: 'high-school', kind, heroId, lineId, text: quote(page.dialogue) });
      });
    }
  }

  for (const [heroId, entry] of Object.entries(revisions.ENDLESS_REVISION_COPY.magic)) {
    for (const kind of ['OPENING', 'TRUE']) {
      const sequence = endless.getEndlessEndingSequence(kind, entry.baseCharacterId, entry.protagonistId, 'magic', entry.protagonistId);
      sequence.pages.forEach((page, index) => {
        const lineId = `endless-${kind.toLowerCase()}-${index + 1}`;
        if (!hasPublic('magic', heroId, lineId)) add({ theme: 'magic', kind, heroId, lineId, text: quote(page.dialogue) });
      });
    }
  }

  const debugEntries = endingService.getDebugMagicEndingGalleryEntries(0);
  let magicEndingMissing = 0;
  for (const entry of debugEntries) {
    for (let index = 0; index < (entry.voiceLines?.length ?? 0); index += 1) {
      const voiceLine = entry.voiceLines[index];
      if (!voiceLine) continue;
      if (!hasPublic('magic', voiceLine.heroId, voiceLine.lineId)) {
        magicEndingMissing += 1;
        add({ theme: 'magic', kind: 'ENDING', heroId: voiceLine.heroId, lineId: voiceLine.lineId, text: quote(entry.lines[index] ?? '') });
      }
    }
  }

  const unique = new Map();
  for (const job of jobs) unique.set(`${job.theme}/${job.heroId}/${job.lineId}`, job);
  console.log(JSON.stringify({ jobs: [...unique.values()], magicEndingMissing }));
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
    return json.loads(result.stdout)


def stable_seed(job: dict) -> int:
    key = f"{job['theme']}/{job['heroId']}/{job['lineId']}/{job['text']}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(key).digest()[:4], "little") % 2_000_000_000


def get_caption(job: dict) -> str:
    if job["theme"] == "high-school":
        base = HIGH_SCHOOL_CAPTIONS[job["heroId"]]
        if job["kind"] == "ENDING":
            tone = job["lineId"].removeprefix("ending-")
            direction = ENDING_TONE_DIRECTIONS.get(tone, ENDING_TONE_DIRECTIONS["serious"])
        elif job["kind"] == "OPENING":
            direction = "未知の道へ踏み出す導入として、前向きな決意を込める。"
        else:
            direction = "旅の先で得た確信と、次の日々への温かい決意を込める。"
    else:
        base = MAGIC_CAPTIONS[job["heroId"]]
        direction = (
            "新しい階層へ進む期待と仲間を守る決意を、魔法の光のように明瞭に届ける。"
            if job["kind"] == "OPENING"
            else "戦いの先で得た自由と、次の未来を選ぶ希望を、自然な感情の起伏で届ける。"
        )
    return f"{base}{direction}感情の起伏を明確にし、棒読みを避けた自然なキャラクター演技。"


def find_reference_source(theme: str, hero_id: str) -> Path:
    if theme == "high-school":
        root = PUBLIC_ROOTS[theme] / hero_id
        candidates = [root / "power-5.ogg", root / "attack-2.ogg", root / "attack-1.ogg", root / "item-2.ogg"]
    else:
        root = PUBLIC_ROOTS[theme] / hero_id
        candidates = sorted(root.glob("ending-*.ogg"), key=lambda path: path.stat().st_size, reverse=True)
        candidates.extend([root / "spell-1.ogg", root / "attack-1.ogg"])
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"No reference voice found for {theme}/{hero_id}")


def prepare_reference(source: Path, target: Path) -> Path:
    if target.exists():
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    data, sample_rate = sf.read(str(source), dtype="float32")
    sf.write(str(target), data, sample_rate, format="WAV", subtype="PCM_16")
    return target


def convert_to_ogg(wav_path: Path) -> Path:
    ogg_path = wav_path.with_suffix(".ogg")
    data, sample_rate = sf.read(str(wav_path), dtype="float32")
    sf.write(str(ogg_path), data, sample_rate, format="OGG", subtype="VORBIS")
    return ogg_path


def build_runtime():
    sys.path.insert(0, str(IRODORI_ROOT))
    from irodori_tts.inference_runtime import (  # type: ignore
        InferenceRuntime,
        RuntimeKey,
        SamplingRequest,
        download_hf_checkpoint,
        save_wav,
    )

    checkpoint = download_hf_checkpoint(MODEL_REPO)
    key = RuntimeKey(
        checkpoint=checkpoint,
        model_device="cuda",
        model_precision="bf16",
        codec_device="cpu",
        codec_precision="fp32",
    )
    return InferenceRuntime.from_key(key), SamplingRequest, save_wav


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate missing protagonist ending voices with Irodori-TTS v4.")
    parser.add_argument("--force", action="store_true", help="Regenerate files that already exist in the public folders.")
    parser.add_argument("--fast", action="store_true", help="Use 8 diffusion steps for a quick pass.")
    parser.add_argument("--promote", action="store_true", help="Copy successful OGG files into public/sfx.")
    parser.add_argument("--dry-run", action="store_true", help="List missing lines without loading the model.")
    parser.add_argument("--only", default="", help="Comma-separated protagonist IDs to process.")
    args = parser.parse_args()

    payload = load_jobs()
    jobs = payload["jobs"]
    only = {value.strip().upper() for value in args.only.split(",") if value.strip()}
    if only:
        jobs = [job for job in jobs if job["heroId"].upper() in only]

    for job in jobs:
        public_path = PUBLIC_ROOTS[job["theme"]] / job["heroId"] / f"{job['lineId']}.ogg"
        job["public_path"] = str(public_path)
        job["work_dir"] = str(WORK_ROOT / "assets" / job["theme"] / job["heroId"])

    print(f"model={MODEL_REPO}")
    print(f"magic_ending_missing={payload['magicEndingMissing']}")
    print(f"jobs={len(jobs)} fast={args.fast} promote={args.promote}")
    if args.dry_run:
        for job in jobs:
            print(f"{job['theme']} {job['heroId']} {job['lineId']}: {job['text']}")
        return 0
    if not jobs:
        print("No missing protagonist ending voices found.")
        return 0

    runtime, SamplingRequest, save_wav = build_runtime()
    refs: dict[tuple[str, str], Path] = {}
    steps = 8 if args.fast else 16
    generated = 0
    skipped = 0
    failed: list[dict] = []
    started = time.time()
    for index, job in enumerate(jobs, start=1):
        work_dir = Path(job["work_dir"])
        wav_path = work_dir / f"{job['lineId']}.wav"
        ogg_path = work_dir / f"{job['lineId']}.ogg"
        public_path = Path(job["public_path"])
        if not args.force and public_path.exists() and public_path.stat().st_size > 0:
            skipped += 1
            continue
        try:
            cache_key = (job["theme"], job["heroId"])
            if cache_key not in refs:
                source = find_reference_source(*cache_key)
                refs[cache_key] = prepare_reference(
                    source,
                    WORK_ROOT / "refs" / job["theme"] / f"{job['heroId']}.wav",
                )
            work_dir.mkdir(parents=True, exist_ok=True)
            print(f"[{index}/{len(jobs)}] {job['theme']} {job['heroId']} {job['lineId']}: {job['text']}", flush=True)
            result = runtime.synthesize(
                SamplingRequest(
                    text=job["text"],
                    caption=get_caption(job),
                    ref_wav=str(refs[cache_key]),
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
            convert_to_ogg(wav_path)
            generated += 1
        except Exception as exc:  # keep all existing public assets intact on any failure
            failed.append({"job": job, "error": repr(exc)})
            print(f"FAILED {job['theme']}/{job['heroId']}/{job['lineId']}: {exc}", file=sys.stderr, flush=True)

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
            source = WORK_ROOT / "assets" / job["theme"] / job["heroId"] / f"{job['lineId']}.ogg"
            target = Path(job["public_path"])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        print(f"promoted={len(jobs)} to public/sfx")
    print(f"complete generated={generated} skipped={skipped} elapsed={time.time() - started:.1f}s work_dir={WORK_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


