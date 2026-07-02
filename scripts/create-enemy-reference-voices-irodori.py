from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from urllib import error, request


ROOT = Path(__file__).resolve().parents[1]
IRODORI_URL = "http://127.0.0.1:8088/v1/audio/speech"
DEFAULT_VOICES_DIR = Path(r"C:\Users\myfav\Documents\VScode\tools\Irodori-TTS-Server\voices")
DEFAULT_SOURCE = ROOT / "src/data/humanoidEnemyVoiceLines.ts"
DEFAULT_DESIGN = ROOT / "docs/humanoid-enemy-voice-quality-design.md"

EXPECTED_GENDERS = {
    "hs_00": "male", "hs_01": "female", "hs_02": "male", "hs_03": "male",
    "hs_04": "female", "hs_05": "male", "hs_06": "male", "hs_07": "female",
    "hs_08": "male", "hs_09": "female", "hs_10": "male", "hs_11": "female",
    "hs_12": "male", "hs_13": "male", "hs_14": "male", "hs_15": "male",
    "hs_16": "male", "hs_17": "male", "hs_18": "male", "hs_19": "male",
    "hs_20": "male", "hs_21": "male", "hs_22": "male", "hs_23": "male",
    "hs_24": "male", "hs_25": "male", "hs_26": "male", "hs_27": "male",
    "hs_28": "male", "hs_29": "male", "hs_30": "male", "hs_31": "male",
    "hs_32": "male", "hs_33": "male", "hs_34": "male", "hs_35": "female",
    "hs_36": "female", "hs_37": "female", "hs_38": "female", "hs_39": "female",
    "hs_40": "female", "hs_41": "female", "hs_42": "female", "hs_43": "female",
    "hs_44": "female", "hs_45": "female", "hs_46": "female", "hs_47": "female",
    "hs_48": "female", "hs_49": "female", "hs_50": "female", "hs_51": "female",
    "hs_52": "female",
    "mg_00": "female", "mg_01": "male", "mg_02": "male", "mg_03": "male",
    "mg_04": "male", "mg_05": "male", "mg_06": "female", "mg_07": "male",
    "mg_08": "male", "mg_09": "male", "mg_10": "male", "mg_11": "male",
    "mg_12": "male", "mg_13": "male", "mg_14": "male", "mg_15": "male",
    "mg_16": "male", "mg_17": "male", "mg_18": "male", "mg_19": "male",
    "mg_20": "female", "mg_21": "female",
}


@dataclass(frozen=True)
class EnemySeed:
    theme: str
    enemy_id: str
    name: str
    gender: str
    speaker_id: str
    motif: str


@dataclass(frozen=True)
class VoiceQuality:
    kind: str
    label: str
    note: str
    sample: str
    direction: str
    pitch_target: str
    speed: float
    cfg_text: float
    pressure: str
    texture: str


def stable_seed(value: str) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "little") % 2_000_000_000


def parse_seeds(source_path: Path) -> list[EnemySeed]:
    source = source_path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*gender:\s*'([^']+)'\s*,\s*speakerId:\s*'([^']+)'\s*,\s*motif:\s*'([^']+)'\s*\}"
    )
    seeds: list[EnemySeed] = []
    for enemy_id, name, gender, speaker_id, motif in pattern.findall(source):
        theme = "high-school" if enemy_id.startswith("hs_") else "magic"
        seeds.append(EnemySeed(theme, enemy_id, name, gender, speaker_id.upper(), motif))
    if not seeds:
        raise RuntimeError(f"No ENEMY_* voice profiles found in {source_path}")
    return seeds


def validate_expected_genders(seeds: list[EnemySeed]) -> None:
    actual = {seed.enemy_id: seed.gender for seed in seeds}
    missing = sorted(set(EXPECTED_GENDERS) - set(actual))
    extra = sorted(set(actual) - set(EXPECTED_GENDERS))
    mismatches = [
        f"{enemy_id}: expected={expected} actual={actual.get(enemy_id)}"
        for enemy_id, expected in EXPECTED_GENDERS.items()
        if actual.get(enemy_id) != expected
    ]
    if missing or extra or mismatches:
        details = []
        if missing:
            details.append("missing=" + ", ".join(missing))
        if extra:
            details.append("extra=" + ", ".join(extra))
        if mismatches:
            details.append("mismatch=" + "; ".join(mismatches))
        raise RuntimeError("enemy gender audit failed: " + " / ".join(details))


def get_voice_quality(seed: EnemySeed) -> VoiceQuality:
    text = f"{seed.name} {seed.motif}"
    quality = VoiceQuality(
        kind="monitor",
        label="監督・巡回",
        note="硬めで圧のある標準敵声",
        sample="巡回開始。違反は見逃さない。",
        direction="近い距離で冷たく言い切る敵声。",
        pitch_target="中低",
        speed=0.96,
        cfg_text=3.0,
        pressure="medium",
        texture="dry",
    )

    if re.search("真・校長|校長|女王|大魔女|星災", text):
        quality = VoiceQuality("sovereign", "支配者・ラスボス", "低めで間を置く威厳", "静粛に。最後の裁定を下す。", "玉座から命じるように、低く遅く重い敵声。", "低", 0.84, 3.2, "heavy", "commanding")
    elif re.search("剣道|竹刀|弓道|射手|槍|騎士|盾|番長|用心棒|壁|門番|主将|執行|鎖|鎧", text):
        quality = VoiceQuality("martial", "武闘・前衛", "短く鋭い掛け声と強い子音", "はっ。間合いに入ったな。斬り込むぞ。", "腹から出す短い掛け声。攻撃前の鋭い敵声。", "中低", 1.06, 3.1, "hard", "sharp")
    elif re.search("白衣|査問|書記|図書|司書|化学|数学|電算|錬金|ルーン|水晶|時術|時計|実験|研究|証明", text):
        quality = VoiceQuality("scholar", "研究・書記", "抑えた声で冷静に区切る", "検証開始。数値は嘘をつきません。", "実験記録を読むように、冷静で細かい敵声。", "中", 0.92, 3.4, "low", "precise")
    elif re.search("王子|令嬢|評議員|紫扇|審査員|茶道|銀髪|赤章|表彰台|白手袋|星界", text):
        quality = VoiceQuality("noble", "優雅・高圧", "滑らかだが上から押す声", "跪く必要はない。ただ、従いなさい。", "丁寧だが見下ろす、滑らかな敵声。", "中高", 0.88, 3.1, "medium", "smooth")
    elif re.search("演劇|仮面|奇術|幻術|鏡|ハッカー|新聞|カメラ|放送|軽音|ギタ|吹奏楽|コンダクター|舞台", text):
        quality = VoiceQuality("showman", "演出・攪乱", "テンポよく芝居がかった声", "さあ、幕を上げよう。目を逸らすなよ。", "客席に見せつけるような、軽く跳ねる敵声。", "中高", 1.08, 3.3, "medium", "bright")
    elif re.search("禁書|呪い|死霊|影|蝋燭|月社|祓い|茨|獣面|地脈|星見|予言|氷鏡|雷|炎|魔導|禁術", text):
        quality = VoiceQuality("mystic", "魔術・不穏", "息を含ませて低く揺らす", "しずまれ。古い呪文が目を覚ます。", "囁きに力を込める、不穏で湿った敵声。", "低", 0.9, 3.5, "medium", "breathy")
    elif re.search("バスケ|陸上|応援|体育|疾走|エース|号令", text):
        quality = VoiceQuality("athlete", "運動・熱量", "大きめで速い、前に出る声", "おら、ついて来い。ここから加速だ。", "前へ押し出す、大きく速い敵声。", "中", 1.14, 3.0, "hard", "energetic")
    elif re.search("保健|園芸|剪定|厨房|購買|文化祭|進路", text):
        quality = VoiceQuality("practical", "実務・処置", "近い距離から淡々と詰める声", "処置します。痛みごと、縛ります。", "作業を止めずに淡々と迫る敵声。", "中", 0.98, 3.1, "medium", "plain")

    number = int(re.sub(r"^(hs|mg)_", "", seed.enemy_id))
    speed_variation = (((number * 7) % 5) - 2) * 0.02
    gender_bias = -0.03 if seed.gender == "male" else 0.03
    magic_bias = 0.02 if seed.theme == "magic" else 0.0
    speed = max(0.76, min(1.22, quality.speed + speed_variation + gender_bias + magic_bias))

    return VoiceQuality(
        quality.kind,
        quality.label,
        quality.note,
        quality.sample,
        quality.direction,
        quality.pitch_target,
        round(speed, 2),
        quality.cfg_text,
        quality.pressure,
        quality.texture,
    )


def reference_text(seed: EnemySeed, quality: VoiceQuality) -> str:
    if seed.gender == "male":
        gender_line = "俺の声で命じる。おい、そこまでだ。"
        gender_direction = "低い男性の敵声。"
    else:
        gender_line = "私の声で告げる。ふふ、逃がさないよ。"
        gender_direction = "高めの女性の敵声。"
    return (
        f"{seed.name}。{seed.motif}。"
        f"{gender_direction}{quality.direction}"
        f"{gender_line}"
        f"{quality.sample}"
    )


def markdown_cell(value: str) -> str:
    return value.replace("|", "｜")


def write_design_markdown(rows: list[tuple[EnemySeed, VoiceQuality]], design_path: Path) -> None:
    design_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# 人型敵ボイス声質設計表",
        "",
        "- 目的: irodori-TTS3 の `voice: \"none\"` で敵専用参照WAVを作り、`ENEMY_*` 話者として最終戦闘ボイスへ使う。",
        "- 性別: ユーザー確認済みの `checkedGender` 表と一致しない場合は生成を停止する。",
        "- 参照WAV生成: `scripts/create-enemy-reference-voices-irodori.py`",
        "- 生成先: `C:\\Users\\myfav\\Documents\\VScode\\tools\\Irodori-TTS-Server\\voices\\ENEMY_*.wav`",
        "",
        "| theme | id | name | gender | speakerId | 声質カテゴリ | pitch目標 | speed | cfgText | 圧 | 質感 | 参照台詞 |",
        "|---|---|---|---|---|---|---|---:|---:|---|---|---|",
    ]
    for seed, quality in rows:
        lines.append(
            "| "
            f"{seed.theme} | {seed.enemy_id} | {markdown_cell(seed.name)} | {seed.gender} | `{seed.speaker_id}` | "
            f"{markdown_cell(quality.label)} | {quality.pitch_target} | {quality.speed:.2f} | {quality.cfg_text:.1f} | "
            f"{quality.pressure} | {quality.texture} | {markdown_cell(reference_text(seed, quality))} |"
        )
    design_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def synthesize_reference(seed: EnemySeed, quality: VoiceQuality, wav_path: Path, num_steps: int) -> None:
    payload = {
        "model": "irodori-tts",
        "input": reference_text(seed, quality),
        "voice": "none",
        "response_format": "wav",
        "speed": quality.speed,
        "irodori": {
            "num_steps": num_steps,
            "cfg_scale_text": quality.cfg_text,
            "cfg_scale_speaker": 0.0,
            "t_schedule_mode": "sway",
            "sway_coeff": -1.0,
            "chunking_enabled": False,
            "seed": stable_seed(f"enemy-reference-{seed.speaker_id}-{quality.kind}-{seed.gender}"),
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(DEFAULT_SOURCE))
    parser.add_argument("--voices-dir", default=str(DEFAULT_VOICES_DIR))
    parser.add_argument("--design", default=str(DEFAULT_DESIGN))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--fast", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only", default="")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_path = Path(args.source)
    if not source_path.is_absolute():
        source_path = ROOT / source_path
    voices_dir = Path(args.voices_dir)
    design_path = Path(args.design)
    if not design_path.is_absolute():
        design_path = ROOT / design_path

    only = {item.strip().lower() for item in args.only.split(",") if item.strip()}
    seeds = parse_seeds(source_path)
    validate_expected_genders(seeds)
    if only:
        seeds = [
            seed for seed in seeds
            if seed.enemy_id.lower() in only or seed.speaker_id.lower() in only or seed.name.lower() in only
        ]

    rows = [(seed, get_voice_quality(seed)) for seed in seeds]
    write_design_markdown(rows, design_path)
    print(f"design={design_path} enemies={len(rows)}")

    if args.dry_run:
        for seed, quality in rows[:12]:
            print(f"{seed.enemy_id} {seed.speaker_id} {quality.label} speed={quality.speed:.2f}: {reference_text(seed, quality)}")
        return

    voices_dir.mkdir(parents=True, exist_ok=True)
    num_steps = 8 if args.fast else 16
    generated = 0
    skipped = 0
    failed: list[str] = []

    for index, (seed, quality) in enumerate(rows, start=1):
        wav_path = voices_dir / f"{seed.speaker_id}.wav"
        if wav_path.exists() and not args.force:
            skipped += 1
            continue
        started = time.time()
        try:
            print(f"[{index}/{len(rows)}] reference {seed.enemy_id} {seed.speaker_id} {quality.label} speed={quality.speed:.2f}")
            synthesize_reference(seed, quality, wav_path, num_steps)
            generated += 1
            print(f"  done {time.time() - started:.1f}s")
        except (error.HTTPError, error.URLError, TimeoutError, OSError) as exc:
            failed.append(seed.speaker_id)
            print(f"  failed: {exc}", file=sys.stderr)

    print(f"generated={generated} skipped={skipped} failed={len(failed)} voices={voices_dir}")
    if failed:
        print("failed references:", ", ".join(failed), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
