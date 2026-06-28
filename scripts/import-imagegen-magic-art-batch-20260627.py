from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ROMANCE = ROOT / "public" / "sprites" / "magic" / "events" / "romance"
SHEET_DIR = ROMANCE / "generated-sheets"
BACKUP = ROOT / ".codex-logs" / "magic-art-batch-20260627-pre-imagegen-backup"
REVIEW_DIR = ROOT / "tmp" / "magic-art-review"

GENERATED = [
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_0b1ab21db419fe47016a3f935a288c8191a06c005da773c9a3.png"),
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_0b1ab21db419fe47016a3f9499c6e08191ab915da88fa82438.png"),
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_0ce75a8d5ad02455016a3f96dee0e8819196a68e866e69e690.png"),
]

SHEET_NAMES = [
    "magic-art-batch-20260627-01.png",
    "magic-art-batch-20260627-02.png",
    "magic-art-batch-20260627-03.png",
]

MAPPING: list[tuple[int, int, str, str, str]] = [
    (0, 0, "AKARI", "SOMA", "r6.webp"),
    (0, 1, "TSUBASA", "RIKU", "r6-true.webp"),
    (0, 2, "TSUBASA", "RIKU", "r6-special.webp"),
    (0, 3, "TSUBASA", "RIKU", "r6-bond.webp"),
    (0, 4, "TSUBASA", "YAMATO", "r6.webp"),
    (0, 5, "TSUBASA", "LEON", "r6.webp"),
    (0, 6, "TSUBASA", "ELLIOT", "r6.webp"),
    (0, 7, "TSUBASA", "ELLIOT", "r6-true.webp"),
    (0, 8, "REI", "REN", "r2.webp"),
    (1, 0, "REI", "REN", "r5.webp"),
    (1, 1, "REI", "MINATO", "r3.webp"),
    (1, 2, "MADOKA", "REN", "r6-true.webp"),
    (1, 3, "MADOKA", "SOMA", "r6-true.webp"),
    (1, 4, "MADOKA", "SOMA", "r6-special.webp"),
    (1, 5, "MADOKA", "MINATO", "r6-true.webp"),
    (1, 6, "MADOKA", "MINATO", "r6-special.webp"),
    (1, 7, "MADOKA", "YAMATO", "r6-true.webp"),
    (1, 8, "MADOKA", "LEON", "r6-true.webp"),
    (2, 0, "MADOKA", "LEON", "r6-special.webp"),
    (2, 1, "MADOKA", "ELLIOT", "r6-true.webp"),
    (2, 2, "KOHARU", "YAMATO", "r1.webp"),
    (2, 3, "KOHARU", "LEON", "r6.webp"),
    (2, 4, "KOHARU", "ELLIOT", "r3.webp"),
    (2, 5, "MIRAI", "YAMATO", "r6-bond.webp"),
]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_font(size: int) -> ImageFont.ImageFont:
    for candidate in ["C:/Windows/Fonts/YuGothM.ttc", "C:/Windows/Fonts/meiryo.ttc", "C:/Windows/Fonts/arial.ttf"]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def crop_cell(sheet: Image.Image, index: int) -> Image.Image:
    col = index % 3
    row = index // 3
    width, height = sheet.size
    x0 = round(width * col / 3)
    x1 = round(width * (col + 1) / 3)
    y0 = round(height * row / 3)
    y1 = round(height * (row + 1) / 3)
    inset_x = max(4, width // 512)
    inset_y = max(4, height // 512)
    if col > 0:
        x0 += inset_x
    if col < 2:
        x1 -= inset_x
    if row > 0:
        y0 += inset_y
    if row < 2:
        y1 -= inset_y
    return sheet.crop((x0, y0, x1, y1)).convert("RGB").resize((768, 768), Image.Resampling.LANCZOS)


def make_review(items: list[tuple[str, Path]]) -> None:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    tile = 180
    label_h = 38
    gap = 10
    margin = 18
    cols = 6
    rows = (len(items) + cols - 1) // cols
    width = margin * 2 + cols * tile + (cols - 1) * gap
    height = margin * 2 + 46 + rows * (tile + label_h) + (rows - 1) * gap
    sheet = Image.new("RGB", (width, height), (27, 20, 40))
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(24)
    label_font = load_font(12)
    draw.text((margin, margin), "ImageGen regenerated magic art batch 2026-06-27", font=title_font, fill=(246, 240, 255))
    y_base = margin + 46
    for index, (label, path) in enumerate(items):
        col = index % cols
        row = index // cols
        x = margin + col * (tile + gap)
        y = y_base + row * (tile + label_h + gap)
        with Image.open(path) as source:
            image = source.convert("RGB")
            image.thumbnail((tile, tile), Image.Resampling.LANCZOS)
        bg = Image.new("RGB", (tile, tile), (12, 10, 18))
        bg.paste(image, ((tile - image.width) // 2, (tile - image.height) // 2))
        sheet.paste(bg, (x, y))
        draw.rectangle((x, y + tile, x + tile, y + tile + label_h), fill=(12, 9, 20))
        draw.text((x + 6, y + tile + 6), label[:28], font=label_font, fill=(235, 229, 246))
    sheet.save(REVIEW_DIR / "regenerated-batch-20260627.jpg", quality=92)


def main() -> None:
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP.mkdir(parents=True, exist_ok=True)

    sheet_paths: list[Path] = []
    for source, name in zip(GENERATED, SHEET_NAMES):
        if not source.exists():
            raise FileNotFoundError(source)
        destination = SHEET_DIR / name
        shutil.copy2(source, destination)
        sheet_paths.append(destination)

    changed: list[str] = []
    review_items: list[tuple[str, Path]] = []
    for sheet_index, cell_index, hero, target, filename in MAPPING:
        destination = ROMANCE / hero / target / filename
        if not destination.exists():
            raise FileNotFoundError(destination)
        backup_folder = BACKUP / hero / target
        backup_folder.mkdir(parents=True, exist_ok=True)
        shutil.copy2(destination, backup_folder / filename)
        with Image.open(sheet_paths[sheet_index]) as sheet:
            crop_cell(sheet, cell_index).save(destination, "WEBP", quality=92, method=6)
        label = f"{hero}-{target} {filename}"
        changed.append(f"- `{rel(destination)}` <= `{rel(sheet_paths[sheet_index])}` cell {cell_index + 1}")
        review_items.append((label, destination))

    make_review(review_items)
    report = ROOT / "docs" / "magic-art-regeneration-batch-20260627.md"
    report.write_text(
        "# Magic Art Regeneration Batch 2026-06-27\n\n"
        "指定された24枚をImageGenの正方形3x3スプライトシート3枚から切り出して導入した。"
        "出力先WebPは既存仕様に合わせて768x768。\n\n"
        "## ImageGen Sprite Sheets\n\n"
        + "\n".join(f"- `{rel(SHEET_DIR / name)}`" for name in SHEET_NAMES)
        + "\n\n## Imported Cells\n\n"
        + "\n".join(changed)
        + "\n\n## Review Sheet\n\n"
        "- `tmp/magic-art-review/regenerated-batch-20260627.jpg`\n\n"
        "## Backup\n\n"
        f"- Previous files: `{rel(BACKUP)}/`\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
