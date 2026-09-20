from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "docs" / "vacation-mode-background-event-implementation-plan.md"
WORK_ROOT = ROOT / "tmp" / "vacation-voices-v4"
PUBLIC_ROOTS = {
    "high-school": ROOT / "public" / "sfx" / "high-school-voices",
    "magic": ROOT / "public" / "sfx" / "magic-event-voices",
}

HIGH_SCHOOL_IDS = (
    "WARRIOR", "CARETAKER", "ASSASSIN", "MAGE", "DODGEBALL",
    "BARD", "LIBRARIAN", "CHEF", "GARDENER",
)
MAGIC_HEROINE_IDS = (
    "AKARI", "SHIZUKU", "HIYORI", "TSUBASA", "REI",
    "MADOKA", "KOHARU", "MIRAI", "SERA",
)
MAGIC_MALE_IDS = ("REN", "SOMA", "MINATO", "RIKU", "YAMATO", "LEON", "ELLIOT", "SAKUYA")
MALE_NAME_TO_ID = {
    "蓮": "REN", "颯真": "SOMA", "湊": "MINATO", "理玖": "RIKU",
    "大和": "YAMATO", "レオン": "LEON", "エリオット": "ELLIOT", "朔夜": "SAKUYA",
}

HS_VACATION_DIRECTIONS = {
    "relax": "穏やかで肩の力が抜けた休息の声。",
    "cheer": "夏休みを心から楽しむ明るい声。",
    "discovery": "新しい発見への好奇心を弾ませる声。",
    "help": "相手を安心させる、温かく頼れる声。",
    "challenge": "遊び心のある勝負への熱を込めた声。",
    "night": "夜の海辺に合う静かな余韻を残す声。",
}

MAGIC_STAGE_DIRECTIONS = {
    1: "旅先での出会い。自然な驚きと明るい夏の期待を込める。",
    2: "信頼が育つ場面。相手と予定を共有する安心感を込める。",
    3: "距離が近づく場面。照れを抑えた親しさと静かな嬉しさを込める。",
    4: "魔法の危機。焦りすぎず、共闘する決意を明瞭に届ける。",
    5: "告白と約束。誠実な温かさと、次の夏への希望を込める。",
}

MAGIC_RANK_DIRECTIONS = {
    "BOND": "友人以上の大切さをにじませ、恋人とは断定しない穏やかな声。",
    "SPECIAL": "互いを特別と認める静かな照れと誠実さを込める。",
    "ROMANCE": "恋人としての温かい約束を、年齢相応にまっすぐ届ける。",
    "TRUE_ROMANCE": "恋と使命を両方選ぶ強い希望を、魔法の光のように届ける。",
}


def load_base_generator():
    path = ROOT / "scripts" / "generate-protagonist-ending-voices-v4.py"
    spec = importlib.util.spec_from_file_location("protagonist_voice_generator", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load base generator: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def section_between(markdown: str, start: str, end: str) -> str:
    start_index = markdown.index(start) + len(start)
    end_index = markdown.index(end, start_index)
    return markdown[start_index:end_index]


def table_rows(section: str, known_ids: set[str]) -> dict[str, list[str]]:
    rows: dict[str, list[str]] = {}
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and cells[0] in known_ids:
            rows[cells[0]] = cells
    return rows


def quoted_text(cell: str) -> str:
    match = re.search(r"「([^」]+)」", cell)
    if not match:
        raise ValueError(f"No quoted Japanese line found in: {cell}")
    return match.group(1).strip()


def hash_ending_voice_text(value: str) -> str:
    hash_value = 0
    for character in value:
        hash_value = ((hash_value * 31) + ord(character)) & 0xFFFFFFFF
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    if hash_value == 0:
        return "0"
    output = ""
    while hash_value:
        hash_value, remainder = divmod(hash_value, 36)
        output = digits[remainder] + output
    return output


def add_job(jobs: list[dict], theme: str, kind: str, hero_id: str, line_id: str, text: str, **extra) -> None:
    jobs.append({
        "theme": theme,
        "kind": kind,
        "hero_id": hero_id,
        "line_id": line_id,
        "text": text,
        **extra,
    })


def load_jobs() -> list[dict]:
    markdown = PLAN_PATH.read_text(encoding="utf-8")
    jobs: list[dict] = []

    hs_section = section_between(
        markdown,
        "## 8. 高校編Vacationボイス",
        "## 9. 高校編Vacationイベント90件",
    )
    hs_rows = table_rows(hs_section, set(HIGH_SCHOOL_IDS))
    hs_reactions = ("relax", "cheer", "discovery", "help", "challenge", "night")
    for hero_id in HIGH_SCHOOL_IDS:
        cells = hs_rows[hero_id]
        for index, reaction in enumerate(hs_reactions, start=1):
            add_job(
                jobs,
                "high-school",
                "HS_VACATION",
                hero_id,
                f"vacation-{reaction}",
                quoted_text(cells[index]),
                reaction=reaction,
            )

    male_section = section_between(
        markdown,
        "### 10.3 対象本人のVacation代表台詞",
        "### 10.4 対象別の声の方向",
    )
    male_rows = table_rows(male_section, set(MALE_NAME_TO_ID))
    heroine_section = section_between(
        markdown,
        "### 10.5 9ヒロインのVacation返答台詞",
        "### 10.6 Vacation恋愛会話の組み立て",
    )
    heroine_rows = table_rows(heroine_section, set(MAGIC_HEROINE_IDS))
    for hero_id in MAGIC_HEROINE_IDS:
        cells = heroine_rows[hero_id]
        for stage in range(1, 6):
            add_job(
                jobs,
                "magic",
                "MAGIC_ROMANCE",
                hero_id,
                f"vacation-romance-r{stage}",
                quoted_text(cells[stage]),
                stage=stage,
            )
    for name, hero_id in MALE_NAME_TO_ID.items():
        cells = male_rows[name]
        for stage in range(1, 6):
            add_job(
                jobs,
                "magic",
                "MAGIC_ROMANCE",
                hero_id,
                f"vacation-romance-r{stage}",
                quoted_text(cells[stage]),
                stage=stage,
            )

    ending_section = section_between(
        markdown,
        "### 10.8 R6 Vacation ending 全台詞",
        "## 11. マジック編Vacation CG生成指示",
    )
    ending_ids = set(MAGIC_HEROINE_IDS + MAGIC_MALE_IDS)
    for line in ending_section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 4 or cells[0] not in ending_ids:
            continue
        hero_id = cells[0]
        rank = cells[1]
        for line_index in (2, 3):
            text = quoted_text(cells[line_index])
            voice_hash = hash_ending_voice_text(f"{hero_id}:{text}")
            add_job(
                jobs,
                "magic",
                "MAGIC_ENDING",
                hero_id,
                f"ending-{voice_hash}",
                text,
                rank=rank,
            )

    unique: dict[tuple[str, str, str], dict] = {}
    for job in jobs:
        unique[(job["theme"], job["hero_id"], job["line_id"])] = job
    result = list(unique.values())
    if len(result) != 275:
        raise RuntimeError(f"Vacation voice plan produced {len(result)} jobs; expected 275")
    return result


def get_caption(base, job: dict) -> str:
    if job["theme"] == "high-school":
        direction = HS_VACATION_DIRECTIONS[job["reaction"]]
        voice_direction = "高校生らしい自然な明るさを保ち、棒読みを避けた短いゲームボイスにする。"
        return f"{base.HIGH_SCHOOL_CAPTIONS[job['hero_id']]}{direction}{voice_direction}"
    if job["kind"] == "MAGIC_ROMANCE":
        direction = MAGIC_STAGE_DIRECTIONS[job["stage"]]
    else:
        direction = MAGIC_RANK_DIRECTIONS[job["rank"]]
    common = "夏休みの温かさを保ち、色気や大人びた誘惑は避け、清潔で年齢相応の自然な演技にする。"
    return f"{base.MAGIC_CAPTIONS[job['hero_id']]}{direction}{common}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Magic Vacation voice materials with Irodori-TTS v4.1.")
    parser.add_argument("--fast", action="store_true", help="Use 8 diffusion steps.")
    parser.add_argument("--force", action="store_true", help="Regenerate existing Vacation OGG files.")
    parser.add_argument("--promote", action="store_true", help="Copy generated OGG files into public/sfx.")
    parser.add_argument("--dry-run", action="store_true", help="List jobs without loading the model.")
    parser.add_argument("--only", default="", help="Comma-separated hero IDs to process.")
    args = parser.parse_args()

    base = load_base_generator()
    jobs = load_jobs()
    only = {value.strip().upper() for value in args.only.split(",") if value.strip()}
    if only:
        jobs = [job for job in jobs if job["hero_id"] in only]

    for job in jobs:
        public_path = PUBLIC_ROOTS[job["theme"]] / job["hero_id"] / f"{job['line_id']}.ogg"
        job["public_path"] = str(public_path)
        job["work_dir"] = str(WORK_ROOT / "assets" / job["theme"] / job["hero_id"])

    print(f"model={base.MODEL_REPO}")
    print(f"jobs={len(jobs)} fast={args.fast} promote={args.promote}")
    if args.dry_run:
        for job in jobs:
            print(f"{job['theme']} {job['hero_id']} {job['line_id']}: {job['text']}")
        return 0

    missing = [
        job for job in jobs
        if args.force or not Path(job["public_path"]).is_file() or Path(job["public_path"]).stat().st_size == 0
    ]
    print(f"missing={len(missing)} existing={len(jobs) - len(missing)}")
    if not missing:
        print("No missing Vacation voice materials found.")
        return 0

    runtime, SamplingRequest, save_wav = base.build_runtime()
    refs: dict[tuple[str, str], Path] = {}
    steps = 8 if args.fast else 16
    generated = 0
    skipped = len(jobs) - len(missing)
    failed: list[dict] = []
    started = time.time()
    for index, job in enumerate(missing, start=1):
        work_dir = Path(job["work_dir"])
        wav_path = work_dir / f"{job['line_id']}.wav"
        ogg_path = work_dir / f"{job['line_id']}.ogg"
        try:
            cache_key = (job["theme"], job["hero_id"])
            if cache_key not in refs:
                source = base.find_reference_source(*cache_key)
                refs[cache_key] = base.prepare_reference(
                    source,
                    WORK_ROOT / "refs" / job["theme"] / f"{job['hero_id']}.wav",
                )
            work_dir.mkdir(parents=True, exist_ok=True)
            print(f"[{index}/{len(missing)}] {job['theme']} {job['hero_id']} {job['line_id']}: {job['text']}", flush=True)
            key = f"{job['theme']}/{job['hero_id']}/{job['line_id']}/{job['text']}".encode("utf-8")
            seed = int.from_bytes(hashlib.sha256(key).digest()[:4], "little") % 2_000_000_000
            result = runtime.synthesize(
                SamplingRequest(
                    text=job["text"],
                    caption=get_caption(base, job),
                    ref_wav=str(refs[cache_key]),
                    seconds=3.2,
                    min_seconds=0.5,
                    max_seconds=8.0,
                    num_steps=steps,
                    cfg_scale_text=3.0,
                    cfg_scale_caption=3.0,
                    cfg_scale_speaker=5.0,
                    cfg_guidance_mode="independent",
                    seed=seed,
                    t_schedule_mode="sway",
                    sway_coeff=-1.0,
                    trim_tail=True,
                )
            )
            save_wav(wav_path, result.audio, result.sample_rate)
            base.convert_to_ogg(wav_path)
            generated += 1
        except Exception as exc:  # preserve all successful files if one line fails
            failed.append({"job": job, "error": repr(exc)})
            print(f"FAILED {job['theme']}/{job['hero_id']}/{job['line_id']}: {exc}", file=sys.stderr, flush=True)

    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "model": base.MODEL_REPO,
        "steps": steps,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "planned": len(jobs),
        "missing": len(missing),
        "generated": generated,
        "skipped": skipped,
        "failed": failed,
        "jobs": jobs,
    }
    (WORK_ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    if failed:
        print(f"failed={len(failed)}; public assets were not promoted", file=sys.stderr)
        return 1
    if args.promote:
        for job in missing:
            source = WORK_ROOT / "assets" / job["theme"] / job["hero_id"] / f"{job['line_id']}.ogg"
            target = Path(job["public_path"])
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        print(f"promoted={len(missing)} to public/sfx")
    print(f"complete generated={generated} skipped={skipped} elapsed={time.time() - started:.1f}s work_dir={WORK_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
