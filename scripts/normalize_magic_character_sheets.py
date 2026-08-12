#!/usr/bin/env python3
"""Normalize the frame anchor of the Magic arc character sprite sheets.

The generated 2x2 sheets contain transparent cutouts, so the safest way to
remove frame-to-frame drift is to move each quadrant by its visible lower-body
anchor.  The idle sheet supplies the canonical anchor for each character and
before/after state; action sheets then use that same anchor.  This preserves
the pose and effects while keeping CSS animations from making the character
teleport between frames or between actions.
"""

from __future__ import annotations

import argparse
import tempfile
import statistics
from pathlib import Path

from PIL import Image


CELL_SIZE = 627
ALPHA_THRESHOLD = 18
SHEET_SIZE = CELL_SIZE * 2
SHEET_FOLDERS = (
    "characters-idle-sheets",
    "characters-idle-special-sheets",
    "characters-attack-sheets",
    "characters-skill-sheets",
    "characters-hit-sheets",
    "characters-low-hp-sheets",
    "male-characters-idle-sheets",
    "male-characters-idle-special-sheets",
    "male-characters-attack-sheets",
    "male-characters-skill-sheets",
    "male-characters-hit-sheets",
    "male-characters-low-hp-sheets",
)


def sheet_kind(path: Path) -> str:
    name = path.parent.name
    if name.endswith("-sheets"):
        return name.removesuffix("-sheets")
    return name


def character_key(path: Path) -> str:
    """Return the stable character/state key shared by idle and action folders."""

    gender = "male" if path.parent.name.startswith("male-") else "female"
    return f"{gender}:{path.stem}"


def split_cells(image: Image.Image) -> list[Image.Image]:
    return [
        image.crop((column * CELL_SIZE, row * CELL_SIZE, (column + 1) * CELL_SIZE, (row + 1) * CELL_SIZE))
        for row in range(2)
        for column in range(2)
    ]


def frame_anchor(cell: Image.Image) -> tuple[float, float] | None:
    """Estimate the lower-body anchor, ignoring isolated upper effects.

    The x coordinate is the median of row centers in the lower half.  This is
    resistant to a wand or magic effect extending to one side.  The y
    coordinate is the last substantial occupied row, which tracks the feet
    better than the full alpha bounding box when an upper effect is large.
    """

    mask = cell.getchannel("A").point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    if not mask.getbbox():
        return None

    lower_top = int(CELL_SIZE * 0.45)
    lower = mask.crop((0, lower_top, CELL_SIZE, CELL_SIZE))
    lower_box = lower.getbbox()
    if not lower_box:
        return None
    x0, y0, x1, y1 = lower_box

    # Use the median center of occupied scan lines in the body band.  A wand,
    # scarf, or impact effect may extend far to one side, but it only affects
    # a small number of rows; the median keeps the character's torso/legs as
    # the visual center of gravity.
    body_top = int(CELL_SIZE * 0.50)
    body_bottom = int(CELL_SIZE * 0.90)
    row_centers: list[float] = []
    for y in range(body_top, body_bottom):
        row_box = mask.crop((0, y, CELL_SIZE, y + 1)).getbbox()
        if row_box and row_box[2] - row_box[0] >= 3:
            row_centers.append((row_box[0] + row_box[2] - 1) / 2)
    center_x = statistics.median(row_centers) if row_centers else (x0 + x1 - 1) / 2
    return center_x, float(y1 - 1 + lower_top)


def paste_shifted(destination: Image.Image, source: Image.Image, dx: int, dy: int) -> None:
    """Paste source into destination with clipping for safe edge handling."""

    source_left = max(0, -dx)
    source_top = max(0, -dy)
    source_right = min(CELL_SIZE, CELL_SIZE - dx)
    source_bottom = min(CELL_SIZE, CELL_SIZE - dy)
    if source_left >= source_right or source_top >= source_bottom:
        return
    cropped = source.crop((source_left, source_top, source_right, source_bottom))
    destination.alpha_composite(cropped, (max(0, dx), max(0, dy)))


def apply_sheet(path: Path, target_x: float, target_y: float) -> tuple[float, float, float, float]:
    with Image.open(path) as source_image:
        source = source_image.convert("RGBA")
    cells = split_cells(source)
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    x_drift: list[float] = []
    y_drift: list[float] = []

    for index, cell in enumerate(cells):
        anchor = frame_anchor(cell)
        if anchor is None:
            output.alpha_composite(cell, ((index % 2) * CELL_SIZE, (index // 2) * CELL_SIZE))
            continue
        dx = round(target_x - anchor[0])
        dy = round(target_y - anchor[1])
        # Keep effects inside their original quadrant where possible.  This
        # prevents normalization from turning a generous margin into a crop.
        alpha_mask = cell.getchannel("A").point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
        # Clamp against the lower-body box rather than a wand or aura near the
        # top edge.  The character anchor must be corrected even when an
        # effect reaches the cell boundary; only the planted body is the
        # invariant we are normalizing here.
        lower_top = int(CELL_SIZE * 0.45)
        lower_box = alpha_mask.crop((0, lower_top, CELL_SIZE, CELL_SIZE)).getbbox()
        body_top = int(CELL_SIZE * 0.50)
        body_bottom = int(CELL_SIZE * 0.90)
        body_box = alpha_mask.crop((0, body_top, CELL_SIZE, body_bottom)).getbbox()
        if body_box:
            x0, _, x1, _ = body_box
            dx = max(-x0, min(CELL_SIZE - x1, dx))
        if lower_box:
            _, y0, _, y1 = lower_box
            dy = max(-(y0 + lower_top), min(CELL_SIZE - (y1 + lower_top), dy))
        shifted = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
        paste_shifted(shifted, cell, dx, dy)
        output.alpha_composite(shifted, ((index % 2) * CELL_SIZE, (index // 2) * CELL_SIZE))
        x_drift.append(float(anchor[0] - target_x))
        y_drift.append(float(anchor[1] - target_y))

    # Do not replace the source while Pillow still has an open decoder for it.
    # A neighbouring temporary file also keeps an interrupted run recoverable.
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.stem}.", suffix=".webp", delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        output.save(temporary_path, "WEBP", quality=92, method=0)
        temporary_path.replace(path)
    finally:
        temporary_path.unlink(missing_ok=True)
    before_x = max(x_drift) - min(x_drift) if x_drift else 0.0
    before_y = max(y_drift) - min(y_drift) if y_drift else 0.0
    return before_x, before_y, target_x, target_y


def discover(root: Path) -> list[Path]:
    paths: list[Path] = []
    for folder in SHEET_FOLDERS:
        paths.extend(sorted(path for path in (root / folder).glob("*.webp") if not path.name.startswith(".")))
    valid_paths: list[Path] = []
    for path in paths:
        try:
            with Image.open(path) as image:
                if image.size == (SHEET_SIZE, SHEET_SIZE):
                    valid_paths.append(path)
        except Exception as error:
            raise SystemExit(f"Unable to read sprite sheet: {path}: {error}") from error
    return valid_paths


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("public/sprites/magic"))
    args = parser.parse_args()
    paths = discover(args.root)
    if not paths:
        raise SystemExit("No Magic 2x2 sprite sheets found")

    idle_paths = [path for path in paths if "idle-sheets" in path.parent.name and "special" not in path.parent.name]
    canonical: dict[str, tuple[float, float]] = {}
    for path in idle_paths:
        key = character_key(path)
        with Image.open(path) as source_image:
            idle_image = source_image.convert("RGBA")
        anchors = [frame_anchor(cell) for cell in split_cells(idle_image)]
        anchors = [anchor for anchor in anchors if anchor is not None]
        if anchors:
            canonical[key] = (
                statistics.median(anchor[0] for anchor in anchors),
                min(max(anchor[1] for anchor in anchors), CELL_SIZE - 18),
            )

    changed = 0
    total_x = 0.0
    total_y = 0.0
    for path in paths:
        key = character_key(path)
        target = canonical.get(key)
        if target is None:
            continue
        before_x, before_y, _, _ = apply_sheet(path, *target)
        total_x = max(total_x, before_x)
        total_y = max(total_y, before_y)
        changed += 1

    print(f"normalized={changed} canonical={len(canonical)} max_frame_x_drift_before={total_x:.1f}px max_frame_y_drift_before={total_y:.1f}px")
    print(f"output_size={SHEET_SIZE}x{SHEET_SIZE} alpha_threshold={ALPHA_THRESHOLD}")


if __name__ == "__main__":
    main()
