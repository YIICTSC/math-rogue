from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ROMANCE = ROOT / "public" / "sprites" / "magic" / "events" / "romance"
SHEET_DIR = ROMANCE / "generated-sheets"
BACKUP = ROOT / ".codex-logs" / "magic-ending-art-pre-imagegen-backup"

GENERATED = [
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_037b2e6224d398ba016a3f657a0b88819188bc76b9b765fc49.png"),
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_037b2e6224d398ba016a3f667484a0819195a2aa313c8e223c.png"),
    Path(r"C:\Users\myfav\.codex\generated_images\019f061e-ad2f-77b3-ae01-0b12827cdfd4\ig_037b2e6224d398ba016a3f67749b0481918c24b5648e9bda74.png"),
]

SHEET_NAMES = [
    "sakuya-ending-variants-01.png",
    "sakuya-ending-variants-02.png",
    "tsubasa-ending-variants-01.png",
]

MAPPING: list[tuple[int, int, str, str, str]] = [
    (0, 0, "SHIZUKU", "SAKUYA", "r6-true.webp"),
    (0, 1, "SHIZUKU", "SAKUYA", "r6-special.webp"),
    (0, 2, "SHIZUKU", "SAKUYA", "r6-bond.webp"),
    (0, 3, "HIYORI", "SAKUYA", "r6-true.webp"),
    (0, 4, "HIYORI", "SAKUYA", "r6-special.webp"),
    (0, 5, "HIYORI", "SAKUYA", "r6-bond.webp"),
    (0, 6, "MADOKA", "SAKUYA", "r6-true.webp"),
    (0, 7, "MADOKA", "SAKUYA", "r6-special.webp"),
    (0, 8, "MADOKA", "SAKUYA", "r6-bond.webp"),
    (1, 0, "SERA", "SAKUYA", "r6-true.webp"),
    (1, 1, "SERA", "SAKUYA", "r6-special.webp"),
    (1, 2, "SERA", "SAKUYA", "r6-bond.webp"),
    (1, 3, "MIRAI", "SAKUYA", "r6-true.webp"),
    (1, 4, "MIRAI", "SAKUYA", "r6-special.webp"),
    (1, 5, "MIRAI", "SAKUYA", "r6-bond.webp"),
    (1, 6, "KOHARU", "SAKUYA", "r6-true.webp"),
    (1, 7, "KOHARU", "SAKUYA", "r6-special.webp"),
    (1, 8, "KOHARU", "SAKUYA", "r6-bond.webp"),
    (2, 0, "TSUBASA", "MINATO", "r6.webp"),
    (2, 1, "TSUBASA", "REN", "r6.webp"),
    (2, 2, "TSUBASA", "RIKU", "r6.webp"),
    (2, 3, "TSUBASA", "SOMA", "r6.webp"),
]


def crop_cell(sheet: Image.Image, index: int) -> Image.Image:
    col = index % 3
    row = index // 3
    width, height = sheet.size
    x0 = round(width * col / 3)
    x1 = round(width * (col + 1) / 3)
    y0 = round(height * row / 3)
    y1 = round(height * (row + 1) / 3)
    # Remove the hard gutters generated between cells without cutting into faces.
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
    cell = sheet.crop((x0, y0, x1, y1)).convert("RGB")
    return cell.resize((768, 768), Image.Resampling.LANCZOS)


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
    for sheet_index, cell_index, hero, target, filename in MAPPING:
        folder = ROMANCE / hero / target
        destination = folder / filename
        if not destination.exists():
            raise FileNotFoundError(destination)
        backup_folder = BACKUP / hero / target
        backup_folder.mkdir(parents=True, exist_ok=True)
        shutil.copy2(destination, backup_folder / filename)

        with Image.open(sheet_paths[sheet_index]) as sheet:
            crop_cell(sheet, cell_index).save(destination, "WEBP", quality=92, method=6)
        changed.append(f"- `{hero}/{target}/{filename}` <= `{SHEET_NAMES[sheet_index]}` cell {cell_index + 1}")

    report = ROOT / "docs" / "magic-ending-art-consistency-fixes.md"
    report.write_text(
        "# Magic Ending Art Consistency Fixes\n\n"
        "ImageGenで3x3スプライトシートを3枚生成し、各セルを切り出して導入した。"
        "火神つばさは短い橙髪、九条朔夜は長い黒髪に深紅差し色を固定し、"
        "場所と行動がルートごとに変わるようにした。\n\n"
        "## ImageGen Sprite Sheets\n\n"
        + "\n".join(f"- `{(SHEET_DIR / name).relative_to(ROOT).as_posix()}`" for name in SHEET_NAMES)
        + "\n\n## Imported Cells\n\n"
        + "\n".join(changed)
        + "\n\n## Backup\n\n"
        f"- Previous files: `{BACKUP.relative_to(ROOT).as_posix()}/`\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
