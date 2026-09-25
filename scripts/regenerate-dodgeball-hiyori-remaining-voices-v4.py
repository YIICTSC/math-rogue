from __future__ import annotations

import gc
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from collections import Counter
from pathlib import Path

import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
IRODORI_ROOT = ROOT.parent / "Irodori-TTS"
MODEL_REPO = "Aratako/Irodori-TTS-v4.1-Small-Quantized/int8-weight-only"
PUBLIC_ROOTS = {
    "high-school": ROOT / "public" / "sfx" / "high-school-voices",
    "magic": ROOT / "public" / "sfx" / "magic-event-voices",
}
REFERENCE_FILES = {
    ("high-school", "DODGEBALL"): ROOT / "public" / "sfx" / "protagonist-voice-audition" / "high-school" / "DODGEBALL" / "01-base.ogg",
    ("magic", "HIYORI"): ROOT / "public" / "sfx" / "protagonist-voice-audition" / "magic" / "HIYORI" / "02-bright.ogg",
}
EXPECTED_COUNTS = {"DODGEBALL": 22, "HIYORI": 112}
BATTLE_FILE = re.compile(r"^(?:attack|block|damage|defeat|finish|item|power|summon)-[1-5]\.ogg$", re.IGNORECASE)
# This legacy file has no matching line ID in the current dialogue sources; preserve it.
UNMAPPED_LEGACY_FILES = {("magic", "HIYORI", "ending-ymbhyz")}

STYLE_CAPTIONS = {
    "DODGEBALL": (
        "採用されたバスケ部エース01 BASE参照音声と同じ人物。張りのある若い男性の中音、"
        "快活で仲間思い、スポーツ選手らしい自然な息と少し速めのテンポ。"
        "声色・声域・年齢感を維持し、子音と語尾を明瞭にする。爽やかな熱さを出し、"
        "威圧的な不良声や大人びた低音、怒鳴り続ける演技にはしない。"
    ),
    "HIYORI": (
        "採用された花咲ひより02 BRIGHT参照音声と同じ人物。明るく優しい女性の中高音、"
        "春の日差しのような温かさと素直な喜び。声色・声域・年齢感を維持し、"
        "包み込む優しさと聞き取りやすさを大切にする。高く幼くなりすぎず、"
        "親しみのある自然な抑揚で演じる。"
    ),
}


NODE_MANIFEST = r'''
import { createServer } from 'vite';

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
  const magicEnding = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const romance = await server.ssrLoadModule('/src/data/magicRomanceDialogue.ts');
  const romanceEvents = await server.ssrLoadModule('/src/services/magicRomanceEventService.ts');
  const friendship = await server.ssrLoadModule('/src/data/magicFriendshipEndingDialogue.ts');
  const jobs = [];
  const utterance = (value) => {
    const text = String(value ?? '').trim();
    const match = text.match(/^[^「]*「(.+)」$/s);
    return (match ? match[1] : text).trim();
  };
  const add = (theme, heroId, kind, lineId, value, detail = '') => {
    const text = utterance(value);
    if (text) jobs.push({ theme, hero_id: heroId, kind, detail, line_id: lineId, text });
  };

  for (const variant of themed.getThemedEndingVariants('high-school', 'DODGEBALL', 'DODGEBALL')) {
    add('high-school', 'DODGEBALL', 'ending', `ending-${variant.id}`, variant.pages[2].text, variant.id);
  }
  for (const kind of ['OPENING', 'TRUE']) {
    const sequence = endless.getEndlessEndingSequence(kind, 'DODGEBALL', 'DODGEBALL', 'high-school');
    sequence.pages.forEach((page, index) => add(
      'high-school', 'DODGEBALL', 'endless', `endless-${kind.toLowerCase()}-${index + 1}`, page.dialogue, kind,
    ));
  }

  const debugEntries = magicEnding.getDebugMagicEndingGalleryEntries(0);
  for (const entry of debugEntries) {
    for (let index = 0; index < (entry.voiceLines?.length ?? 0); index += 1) {
      const voiceLine = entry.voiceLines[index];
      if (voiceLine?.heroId?.toUpperCase() === 'HIYORI') {
        add('magic', 'HIYORI', entry.kind === 'friendship' ? 'friendship' : 'ending', voiceLine.lineId, entry.lines?.[index] ?? '');
      }
    }
  }
  const revision = revisions.ENDLESS_REVISION_COPY.magic.HIYORI;
  for (const kind of ['OPENING', 'TRUE']) {
    const sequence = endless.getEndlessEndingSequence(
      kind, revision.baseCharacterId, revision.protagonistId, 'magic', revision.protagonistId,
    );
    sequence.pages.forEach((page, index) => add(
      'magic', 'HIYORI', 'endless', `endless-${kind.toLowerCase()}-${index + 1}`, page.dialogue, kind,
    ));
  }

  for (const lines of Object.values(friendship.MAGIC_FRIENDSHIP_ENDING_DIALOGUE)) {
    for (const line of lines) {
      if (line.speakerId?.toUpperCase() === 'HIYORI') {
        add('magic', 'HIYORI', 'friendship', line.lineId, line.text);
      }
    }
  }

  const maleIds = ['REN', 'SOMA', 'MINATO', 'RIKU', 'YAMATO', 'LEON', 'ELLIOT', 'SAKUYA'];
  for (const maleId of maleIds) {
    for (const [heroId, targetId] of [['HIYORI', maleId], [maleId, 'HIYORI']]) {
      for (let stage = 0; stage < 5; stage += 1) {
        const dialogue = romance.getMagicRomanceDialogue(heroId, targetId, stage);
        const lines = dialogue.description.split('\n')
          .map((line) => line.match(/^([^「]+)「(.+)」$/))
          .filter(Boolean);
        const voiceLines = romanceEvents.getMagicRomanceVoiceLines(heroId, targetId, stage, dialogue.description);
        if (lines.length !== voiceLines.length) {
          throw new Error(`Romance voice/text mismatch for ${heroId}/${targetId}/r${stage + 1}`);
        }
        lines.forEach((match, index) => {
          if (voiceLines[index].heroId?.toUpperCase() === 'HIYORI') {
            add('magic', 'HIYORI', 'romance', voiceLines[index].lineId, match[2]);
          }
        });
      }
    }
  }

  console.log(JSON.stringify({ jobs }));
} finally {
  await server.close();
}
'''


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load voice manifest helper: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def load_source_jobs() -> list[dict[str, str]]:
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(
        ["node", "--input-type=module", "-e", NODE_MANIFEST],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
    )
    jobs = json.loads(result.stdout)["jobs"]

    vacation = load_module("vacation_voice_manifest", ROOT / "scripts" / "generate-vacation-voices-v4.py")
    jobs.extend(
        {"theme": item["theme"], "hero_id": item["hero_id"], "kind": "vacation", "detail": item.get("reaction", item.get("rank", item.get("stage", ""))), "line_id": item["line_id"], "text": item["text"]}
        for item in vacation.load_jobs()
        if item["hero_id"] in EXPECTED_COUNTS
    )

    vacation_ending = load_module("vacation_ending_voice_manifest", ROOT / "scripts" / "generate-vacation-ending-voices-v4.py")
    jobs.extend(
        {"theme": "high-school", "hero_id": item["heroId"], "kind": "vacation-ending", "detail": item["tone"], "line_id": item["lineId"], "text": item["text"]}
        for item in vacation_ending.load_jobs()
        if item["heroId"] == "DODGEBALL"
    )

    target_files = existing_targets()
    wanted = set(target_files)
    unique: dict[tuple[str, str, str], dict[str, str]] = {}
    for job in jobs:
        key = (job["theme"], job["hero_id"], job["line_id"])
        if key not in wanted:
            continue
        previous = unique.get(key)
        if previous and previous["text"] != job["text"]:
            raise RuntimeError(f"Conflicting source dialogue for {key}: {previous['text']} / {job['text']}")
        if previous is None or (previous["kind"] == "ending" and job["kind"] == "vacation"):
            unique[key] = job

    missing = sorted(wanted - set(unique))
    if missing:
        sample = ", ".join(f"{hero}/{line}" for _theme, hero, line in missing[:12])
        raise RuntimeError(f"Existing voice files do not map to source dialogue ({len(missing)} missing): {sample}")

    counts = Counter(hero for _theme, hero, _line in unique)
    if counts != Counter(EXPECTED_COUNTS):
        raise RuntimeError(f"Expected existing dialogue counts {EXPECTED_COUNTS}, found {dict(counts)}")
    return [unique[key] for key in sorted(unique)]


def existing_targets() -> dict[tuple[str, str, str], Path]:
    targets: dict[tuple[str, str, str], Path] = {}
    for path in (PUBLIC_ROOTS["high-school"] / "DODGEBALL").glob("*.ogg"):
        if BATTLE_FILE.match(path.name):
            continue  # The previously regenerated battle set is not part of this "remaining lines" pass.
        targets[("high-school", "DODGEBALL", path.stem)] = path
    for path in (PUBLIC_ROOTS["magic"] / "HIYORI").glob("*.ogg"):
        if ("magic", "HIYORI", path.stem) in UNMAPPED_LEGACY_FILES:
            continue
        targets[("magic", "HIYORI", path.stem)] = path
    return targets


def spoken_length(text: str) -> int:
    return len(re.sub(r"[\s、。！？!?・…「」『』（）()「」,:：;；—–-]", "", text))


def target_seconds(text: str) -> float:
    # Leave enough room for long event/ending lines so their tails do not collapse.
    return round(min(14.0, max(1.8, 1.7 + spoken_length(text) * 0.105)), 2)


def caption_for(job: dict[str, str]) -> str:
    base = STYLE_CAPTIONS[job["hero_id"]]
    kind = job["kind"]
    if job["hero_id"] == "DODGEBALL":
        if kind == "ending":
            tone = job.get("detail", "serious")
            direction = {
                "serious": "仲間と未来を選ぶ決意。胸からまっすぐ、最後まで熱く言い切る。",
                "funny": "親しみやすい軽快さと自然な笑み。大げさに崩しすぎない。",
                "cool": "余計な力を抜いた爽やかな格好よさ。語尾を締める。",
                "cute": "明るく弾むが、高く幼くしすぎず少し照れを含む。",
                "heartfelt": "仲間への温かい感謝と余韻を込める。",
            }.get(tone, "決意と仲間への思いを込める。")
        elif kind == "endless":
            direction = "新しい挑戦への期待または戦い抜いた確信。前向きで勢いのある声。"
        elif kind == "vacation-ending":
            direction = f"バカンスの思い出を締める語り。{job.get('detail', '')}の感情を自然に乗せる。"
        else:
            direction = {
                "relax": "休息中の気の抜けた親しさ。",
                "cheer": "夏休みを楽しむ明るい声。",
                "discovery": "発見への好奇心を弾ませる。",
                "help": "仲間を安心させる頼もしさ。",
                "challenge": "勝負への熱を快活に出す。",
                "night": "夜の海辺に合う穏やかな余韻。",
            }.get(job.get("detail", ""), "快活で仲間思いの自然な演技。")
    else:
        if kind == "ending":
            direction = "大切な人と歩む未来への優しさと希望。自然な感情の起伏をつける。"
        elif kind == "endless":
            direction = "旅の導入は期待を、真の結末は支え合う希望を込めて明瞭に。"
        elif kind == "friendship":
            direction = "友人を思いやる親しさ。柔らかく、少し弾む温かさ。"
        elif kind == "romance":
            direction = "相手の気持ちに寄り添う親密な語り。優しさと素直な喜びを込める。"
        else:
            direction = "夏の思い出を振り返る温かさと、相手を気遣う優しさ。"
    return f"{base}{direction}本文のセリフだけを日本語で発話する。棒読みを避け、語尾まで明瞭に届ける。"


def prepare_reference(source: Path, target: Path) -> Path:
    if not source.is_file() or source.stat().st_size == 0:
        raise FileNotFoundError(f"採用参照音声がありません: {source}")
    audio, sample_rate = sf.read(str(source), dtype="float32")
    target.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(target), audio, sample_rate, format="WAV", subtype="PCM_16")
    return target


def build_runtime():
    if str(IRODORI_ROOT) not in sys.path:
        sys.path.insert(0, str(IRODORI_ROOT))
    from irodori_tts.inference_runtime import InferenceRuntime, RuntimeKey, SamplingRequest, download_hf_checkpoint, save_wav

    checkpoint = download_hf_checkpoint(MODEL_REPO)
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
    import argparse

    parser = argparse.ArgumentParser(description="Regenerate all remaining DODGEBALL and HIYORI voice lines with their selected Irodori-TTS v4 references.")
    parser.add_argument("--dry-run", action="store_true", help="Audit exact file/text coverage without loading TTS.")
    parser.add_argument("--steps", type=int, default=16)
    args = parser.parse_args()
    if args.steps < 1:
        parser.error("--steps must be a positive integer")

    targets = existing_targets()
    jobs = load_source_jobs()
    print(f"model={MODEL_REPO} steps={args.steps} selected={len(jobs)} targets={dict(Counter(job['hero_id'] for job in jobs))}")
    for key, source in REFERENCE_FILES.items():
        print(f"reference={key[1]} {source.relative_to(ROOT)}")
    if args.dry_run:
        for job in jobs:
            print(f"{job['hero_id']} {job['line_id']} kind={job['kind']} target={target_seconds(job['text']):.2f}s chars={spoken_length(job['text'])}")
        print("No files changed (dry-run).")
        return 0

    runtime, SamplingRequest, save_wav = build_runtime()
    started = time.time()
    generated: list[tuple[dict[str, str], Path, float]] = []
    failures: list[str] = []
    with tempfile.TemporaryDirectory(prefix="dodgeball-hiyori-v4-", dir=ROOT / "tmp") as temporary:
        work = Path(temporary)
        refs = {
            key: prepare_reference(source, work / "references" / f"{key[1]}.wav")
            for key, source in REFERENCE_FILES.items()
        }

        for index, job in enumerate(jobs, start=1):
            key = (job["theme"], job["hero_id"])
            seconds = target_seconds(job["text"])
            wav_path = work / "staged" / job["theme"] / job["hero_id"] / f"{job['line_id']}.wav"
            ogg_path = wav_path.with_suffix(".ogg")
            print(f"[{index}/{len(jobs)}] {job['hero_id']} {job['line_id']} ({seconds:.2f}s)", flush=True)
            try:
                result = runtime.synthesize(
                    SamplingRequest(
                        text=job["text"],
                        caption=caption_for(job),
                        ref_wav=str(refs[key]),
                        seconds=seconds,
                        min_seconds=0.65,
                        max_seconds=14.0,
                        num_steps=args.steps,
                        cfg_scale_text=3.0,
                        cfg_scale_caption=3.0,
                        cfg_scale_speaker=5.0,
                        cfg_guidance_mode="independent",
                        seed=int.from_bytes(hashlib.sha256(f"remaining-v4/{job['theme']}/{job['hero_id']}/{job['line_id']}/{job['text']}".encode("utf-8")).digest()[:4], "little") % 2_000_000_000,
                        t_schedule_mode="sway",
                        sway_coeff=-1.0,
                        trim_tail=True,
                    ),
                    log_fn=None,
                )
                wav_path.parent.mkdir(parents=True, exist_ok=True)
                save_wav(wav_path, result.audio, result.sample_rate)
                audio, sample_rate = sf.read(str(wav_path), dtype="float32")
                sf.write(str(ogg_path), audio, sample_rate, format="OGG", subtype="VORBIS")
                duration = float(sf.info(str(ogg_path)).duration)
                if duration < max(0.65, seconds * 0.42) or duration > 14.5:
                    raise RuntimeError(f"生成尺が指定台詞に対して短すぎる/長すぎます: {duration:.2f}s (target {seconds:.2f}s)")
                generated.append((job, ogg_path, duration))
                print(f"  ready {duration:.2f}s", flush=True)
                del result, audio
                gc.collect()
            except Exception as exc:
                failures.append(f"{job['hero_id']}/{job['line_id']}: {exc!r}")
                print(f"  FAILED: {exc}", file=sys.stderr, flush=True)

        if failures or len(generated) != len(jobs):
            print(f"No public files were replaced; generated={len(generated)}/{len(jobs)} failed={len(failures)}", file=sys.stderr)
            for failure in failures:
                print(f"  {failure}", file=sys.stderr)
            return 1

        # Back up only these explicit targets, then promote as one guarded operation.
        backup_root = work / "backups"
        promoted: list[Path] = []
        try:
            for job, source, _duration in generated:
                key = (job["theme"], job["hero_id"], job["line_id"])
                target = targets[key]
                relative = target.relative_to(ROOT / "public" / "sfx")
                backup = backup_root / relative
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, backup)
                descriptor, replacement_name = tempfile.mkstemp(
                    prefix=f".{target.stem}.", suffix=".staging", dir=target.parent,
                )
                os.close(descriptor)
                replacement = Path(replacement_name)
                try:
                    shutil.copy2(source, replacement)
                    if replacement.stat().st_size == 0 or sf.info(str(replacement)).duration <= 0:
                        raise RuntimeError(f"Staged file failed validation: {replacement}")
                    os.replace(replacement, target)
                finally:
                    replacement.unlink(missing_ok=True)
                promoted.append(target)
                if target.stat().st_size == 0 or sf.info(str(target)).duration <= 0:
                    raise RuntimeError(f"Promoted file failed validation: {target}")
        except Exception:
            for target in promoted:
                relative = target.relative_to(ROOT / "public" / "sfx")
                shutil.copy2(backup_root / relative, target)
            raise

        durations = [duration for _job, _path, duration in generated]
        print(
            f"promoted={len(generated)} DODGEBALL=22 HIYORI=112 duration="
            f"{min(durations):.2f}-{max(durations):.2f}s elapsed={time.time() - started:.1f}s",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
