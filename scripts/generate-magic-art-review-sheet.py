from __future__ import annotations

from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
MAGIC = PUBLIC / "sprites" / "magic"
OUT_DIR = ROOT / "tmp" / "magic-art-review"
DOCS = ROOT / "docs"


@dataclass(frozen=True)
class Character:
    id: str
    name: str
    before: Path
    after: Path
    spec: str


HEROINES = [
    Character("AKARI", "星宮あかり", MAGIC / "characters" / "heroine-01-before.png", MAGIC / "characters" / "heroine-01-after.png", "赤髪ポニーテール、星飾り、赤金"),
    Character("SHIZUKU", "水城しずく", MAGIC / "characters" / "heroine-02-before.png", MAGIC / "characters" / "heroine-02-after.png", "長い濃紺髪、眼鏡、青銀"),
    Character("HIYORI", "花咲ひより", MAGIC / "characters" / "heroine-03-before.png", MAGIC / "characters" / "heroine-03-after.png", "桃色の長髪、柔らかい表情"),
    Character("TSUBASA", "火神つばさ", MAGIC / "characters" / "heroine-04-before.png", MAGIC / "characters" / "heroine-04-after.png", "短い橙髪、スポーティー、橙黒ハンマー"),
    Character("REI", "黒羽れい", MAGIC / "characters" / "heroine-05-before.png", MAGIC / "characters" / "heroine-05-after.png", "非常に長い黒髪、赤眼、黒紅"),
    Character("MADOKA", "翠川まどか", MAGIC / "characters" / "heroine-06-before.png", MAGIC / "characters" / "heroine-06-after.png", "ミント髪ツイン団子、丸眼鏡"),
    Character("KOHARU", "風森こはる", MAGIC / "characters" / "heroine-07-before.png", MAGIC / "characters" / "heroine-07-after.png", "長い緑の編み髪、琥珀眼"),
    Character("MIRAI", "紫藤みらい", MAGIC / "characters" / "heroine-08-before.png", MAGIC / "characters" / "heroine-08-after.png", "紫髪サイドポニー、舞台系"),
    Character("SERA", "白峰セラ", MAGIC / "characters" / "heroine-09-before.png", MAGIC / "characters" / "heroine-09-after.png", "銀白ショート、金眼、白紺金"),
]

TARGETS = [
    Character("REN", "朝霧 蓮", MAGIC / "male-characters" / "ren-before.png", MAGIC / "male-characters" / "ren-after.png", "灰茶短髪、青緑眼、紺ブレザー"),
    Character("SOMA", "御影 颯真", MAGIC / "male-characters" / "soma-before.png", MAGIC / "male-characters" / "soma-after.png", "銀青の整った髪、眼鏡、白紺"),
    Character("MINATO", "白石 湊", MAGIC / "male-characters" / "minato-before.png", MAGIC / "male-characters" / "minato-after.png", "淡い水色短髪、白マフラー"),
    Character("RIKU", "天音 理玖", MAGIC / "male-characters" / "riku-before.png", MAGIC / "male-characters" / "riku-after.png", "ラベンダーグレー低い結び髪"),
    Character("YAMATO", "黒瀬 大和", MAGIC / "male-characters" / "yamato-before.png", MAGIC / "male-characters" / "yamato-after.png", "黒髪に赤い毛先、赤パーカー"),
    Character("LEON", "神代 レオン", MAGIC / "male-characters" / "leon-before.png", MAGIC / "male-characters" / "leon-after.png", "金髪ウェーブ、紫眼、黒紫"),
    Character("ELLIOT", "エリオット・ノクス", MAGIC / "male-characters" / "elliot-before.png", MAGIC / "male-characters" / "elliot-after.png", "白金髪、金眼、白制服"),
    Character("SAKUYA", "九条 朔夜", MAGIC / "male-characters" / "sakuya-before.png", MAGIC / "male-characters" / "sakuya-after.png", "長い黒髪に深紅差し色、赤眼、黒赤"),
]

ENDING_NAMES = ["r6.webp", "r6-true.webp", "r6-special.webp", "r6-bond.webp"]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_font(size: int) -> ImageFont.ImageFont:
    for candidate in [
        "C:/Windows/Fonts/YuGothM.ttc",
        "C:/Windows/Fonts/meiryo.ttc",
        "C:/Windows/Fonts/arial.ttf",
    ]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def open_tile(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    tile = Image.new("RGB", size, (24, 20, 34))
    x = (size[0] - image.width) // 2
    y = (size[1] - image.height) // 2
    tile.paste(image, (x, y))
    return tile


def draw_contact_sheet(title: str, items: Iterable[tuple[str, Path]], out: Path, columns: int = 4) -> None:
    items = list(items)
    tile_size = (220, 220)
    label_h = 42
    gap = 12
    margin = 18
    title_h = 52
    rows = (len(items) + columns - 1) // columns
    width = margin * 2 + columns * tile_size[0] + (columns - 1) * gap
    height = margin * 2 + title_h + rows * (tile_size[1] + label_h) + max(0, rows - 1) * gap
    sheet = Image.new("RGB", (width, height), (28, 19, 43))
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(28)
    label_font = load_font(15)
    draw.text((margin, margin), title, font=title_font, fill=(245, 241, 255))
    y0 = margin + title_h
    for index, (label, path) in enumerate(items):
        col = index % columns
        row = index // columns
        x = margin + col * (tile_size[0] + gap)
        y = y0 + row * (tile_size[1] + label_h + gap)
        if path.exists():
            tile = open_tile(path, tile_size)
        else:
            tile = Image.new("RGB", tile_size, (70, 30, 40))
            ImageDraw.Draw(tile).text((20, 95), "MISSING", font=title_font, fill=(255, 210, 210))
        sheet.paste(tile, (x, y))
        draw.rectangle((x, y + tile_size[1], x + tile_size[0], y + tile_size[1] + label_h), fill=(12, 9, 20))
        draw.text((x + 8, y + tile_size[1] + 7), label[:32], font=label_font, fill=(238, 232, 246))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=92)


def route_dirs() -> list[tuple[Character, Character, Path]]:
    routes: list[tuple[Character, Character, Path]] = []
    romance = MAGIC / "events" / "romance"
    target_by_id = {target.id: target for target in TARGETS}
    for heroine in HEROINES:
        hero_dir = romance / heroine.id
        if not hero_dir.exists():
            continue
        for target_dir in sorted(hero_dir.iterdir()):
            if target_dir.is_dir() and target_dir.name in target_by_id:
                routes.append((heroine, target_by_id[target_dir.name], target_dir))
    return routes


def write_html() -> None:
    routes = route_dirs()
    css = """
body{margin:0;background:#171225;color:#f7f2ff;font-family:system-ui,'Yu Gothic',sans-serif}
header{position:sticky;top:0;z-index:2;background:#211735;padding:16px 20px;border-bottom:1px solid #493665}
h1{margin:0 0 8px;font-size:24px}p{margin:4px 0;color:#d9cceb}
.section{padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.route{display:grid;grid-template-columns:180px repeat(10,150px);gap:10px;align-items:start;margin:18px 0;padding-bottom:18px;border-bottom:1px solid #38294f;overflow-x:auto}
.card{background:#241a35;border:1px solid #44325f;border-radius:8px;padding:8px}
.card img{width:100%;height:170px;object-fit:contain;background:#100c18;border-radius:4px}.route .card img{height:135px}
.label{font-size:12px;line-height:1.35;color:#efe7ff;word-break:break-all}.spec{font-size:12px;color:#c9bbde;margin-top:4px}
.warn{color:#ffd08a;font-weight:700}.missing{height:135px;display:grid;place-items:center;background:#4a1f2c;color:#ffd6dc;border-radius:4px}
"""
    html: list[str] = [
        "<!doctype html><meta charset='utf-8'>",
        f"<title>Magic Art Total Review</title><style>{css}</style>",
        "<header><h1>マジック編 イラスト総確認シート</h1>",
        "<p>立ち絵、変身後立ち絵、イベント、エンディング4差分をキャラクター仕様と並べて確認するための索引。</p>",
        "<p class='warn'>重点確認: 火神つばさは短い橙髪、九条朔夜は長い黒髪に深紅差し色。</p></header>",
    ]
    html.append("<section class='section'><h2>主人公 立ち絵 / 変身後</h2><div class='grid'>")
    for char in HEROINES:
        for label, path in [("通常", char.before), ("変身後", char.after)]:
            html.append(card(f"{char.id} {char.name} {label}", path, char.spec))
    html.append("</div></section>")
    html.append("<section class='section'><h2>恋愛対象 立ち絵 / 変身後</h2><div class='grid'>")
    for char in TARGETS:
        for label, path in [("通常", char.before), ("変身後", char.after)]:
            html.append(card(f"{char.id} {char.name} {label}", path, char.spec))
    html.append("</div></section>")
    html.append("<section class='section'><h2>共通イベント</h2><div class='grid'>")
    for event_path in sorted((MAGIC / "events").glob("*.webp"), key=lambda p: p.name):
        html.append(card(event_path.name, event_path, "共通イベント"))
    html.append("</div></section>")
    html.append("<section class='section'><h2>恋愛イベント / エンディング</h2>")
    for heroine, target, folder in routes:
        html.append(f"<div class='route'><div class='card'><div class='label'><b>{escape(heroine.id)}-{escape(target.id)}</b><br>{escape(heroine.name)}<br>{escape(target.name)}</div><div class='spec'>{escape(heroine.spec)}<br>{escape(target.spec)}</div></div>")
        for filename in ["r1.webp", "r2.webp", "r3.webp", "r4.webp", "r5.webp", *ENDING_NAMES]:
            html.append(card(filename, folder / filename, ""))
        html.append("</div>")
    html.append("</section>")
    (DOCS / "magic-art-total-review.html").write_text("\n".join(html), encoding="utf-8")


def card(label: str, path: Path, spec: str) -> str:
    if path.exists():
        image = f"<a href='../{rel(path)}'><img src='../{rel(path)}' loading='lazy' alt='{escape(label)}'></a>"
    else:
        image = "<div class='missing'>MISSING</div>"
    spec_html = f"<div class='spec'>{escape(spec)}</div>" if spec else ""
    return f"<figure class='card'>{image}<figcaption class='label'>{escape(label)}<br>{escape(rel(path))}</figcaption>{spec_html}</figure>"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    draw_contact_sheet(
        "Magic heroines standing / transformed",
        [(f"{c.id} before", c.before) for c in HEROINES] + [(f"{c.id} after", c.after) for c in HEROINES],
        OUT_DIR / "01-heroines-standing.jpg",
        columns=3,
    )
    draw_contact_sheet(
        "Magic male protagonists / romance targets",
        [(f"{c.id} before", c.before) for c in TARGETS] + [(f"{c.id} after", c.after) for c in TARGETS],
        OUT_DIR / "02-male-standing.jpg",
        columns=4,
    )
    draw_contact_sheet(
        "Magic common events",
        [(p.stem, p) for p in sorted((MAGIC / "events").glob("*.webp"), key=lambda p: p.name)],
        OUT_DIR / "03-common-events.jpg",
        columns=5,
    )
    routes = route_dirs()
    draw_contact_sheet(
        "Magic ending variants all routes",
        [(f"{hero.id}-{target.id} {p.name}", p) for hero, target, folder in routes for p in [folder / name for name in ENDING_NAMES]],
        OUT_DIR / "04-ending-variants-all.jpg",
        columns=6,
    )
    for focus in ["TSUBASA", "SAKUYA"]:
        draw_contact_sheet(
            f"Focus ending variants: {focus}",
            [
                (f"{hero.id}-{target.id} {p.name}", p)
                for hero, target, folder in routes
                if hero.id == focus or target.id == focus
                for p in [folder / name for name in ENDING_NAMES]
            ],
            OUT_DIR / f"focus-{focus}-ending-variants.jpg",
            columns=4,
        )
    write_html()


if __name__ == "__main__":
    main()
