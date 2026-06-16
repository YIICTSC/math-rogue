from collections import defaultdict, deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "public" / "sprites" / "magic"
SHEETS = ROOT / "sheets"
TARGET_SIZE = 418
MAX_SUBJECT_SIZE = 392
MIN_COMPONENT_AREA = 24
KEEP_COMPONENT_AREA = 55


def border_key(image):
    width, height = image.size
    points = []
    for x in (0, width // 4, width // 2, 3 * width // 4, width - 1):
        points.extend(((x, 0), (x, height - 1)))
    for y in (0, height // 4, height // 2, 3 * height // 4, height - 1):
        points.extend(((0, y), (width - 1, y)))
    values = [image.getpixel(point)[:3] for point in points]
    return tuple(sorted(value[channel] for value in values)[len(values) // 2] for channel in range(3))


def remove_chroma(image):
    image = image.convert("RGBA")
    key_r, key_g, key_b = border_key(image)
    is_magenta = key_r > 150 and key_b > 140 and key_g < 130
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if is_magenta:
                hard = red > 172 and blue > 168 and green < 120 and abs(red - blue) < 85
                soft = red > 145 and blue > 140 and green < 150 and red + blue - 2 * green > 115
                if hard:
                    pixels[x, y] = (red, green, blue, 0)
                elif soft:
                    new_alpha = max(0, min(255, int((150 - green) * 2.2)))
                    if new_alpha < alpha:
                        pixels[x, y] = (red, green, blue, new_alpha)
            else:
                hard = green > 160 and red < 112 and blue < 112 and green - max(red, blue) > 90
                soft = green > 122 and red < 145 and blue < 145 and green - max(red, blue) > 52
                if hard:
                    pixels[x, y] = (red, green, blue, 0)
                elif soft:
                    new_alpha = max(0, min(255, int((max(red, blue) + 82 - green) * 3)))
                    if new_alpha < alpha:
                        pixels[x, y] = (red, green, blue, new_alpha)
    return image


def find_components(image):
    pixels = image.load()
    width, height = image.size
    seen = bytearray(width * height)
    components = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if seen[start_index] or pixels[start_x, start_y][3] <= 16:
                seen[start_index] = 1
                continue

            queue = deque([(start_x, start_y)])
            seen[start_index] = 1
            points = []
            left = right = start_x
            top = bottom = start_y

            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)

                for next_x, next_y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    next_index = next_y * width + next_x
                    if seen[next_index]:
                        continue
                    seen[next_index] = 1
                    if pixels[next_x, next_y][3] > 16:
                        queue.append((next_x, next_y))

            area = len(points)
            if area >= MIN_COMPONENT_AREA:
                components.append(
                    {
                        "points": points,
                        "bbox": (left, top, right + 1, bottom + 1),
                        "area": area,
                        "center": ((left + right) / 2, (top + bottom) / 2),
                    }
                )
    return components


def assign_to_centers(components, centers, sheet_size):
    width, height = sheet_size
    groups = defaultdict(list)
    for component in components:
        left, top, right, bottom = component["bbox"]
        component_width = right - left
        component_height = bottom - top

        if (
            (component_width > width * 0.42 or component_height > height * 0.72)
            and component["area"] < 9000
        ):
            continue

        center_x, center_y = component["center"]
        index = min(
            range(len(centers)),
            key=lambda item: (center_x - centers[item][0]) ** 2 + (center_y - centers[item][1]) ** 2,
        )
        if component["area"] >= KEEP_COMPONENT_AREA or component_width > 12 or component_height > 12:
            groups[index].append(component)
    return groups


def render_group(sheet, components):
    if not components:
        raise ValueError("No foreground components assigned")

    left = max(0, min(component["bbox"][0] for component in components) - 10)
    top = max(0, min(component["bbox"][1] for component in components) - 10)
    right = min(sheet.width, max(component["bbox"][2] for component in components) + 10)
    bottom = min(sheet.height, max(component["bbox"][3] for component in components) + 10)

    mask = Image.new("L", sheet.size, 0)
    mask_pixels = mask.load()
    alpha_pixels = sheet.getchannel("A").load()
    for component in components:
        for x, y in component["points"]:
            mask_pixels[x, y] = alpha_pixels[x, y]

    isolated = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    isolated.paste(sheet, (0, 0), mask)
    cropped = isolated.crop((left, top, right, bottom))
    bbox = cropped.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Foreground became empty")
    cropped = cropped.crop(bbox)

    scale = min(MAX_SUBJECT_SIZE / cropped.width, MAX_SUBJECT_SIZE / cropped.height, 1.0)
    resized_width = max(1, round(cropped.width * scale))
    resized_height = max(1, round(cropped.height * scale))
    resized = cropped.resize((resized_width, resized_height), Image.Resampling.LANCZOS)

    output = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    offset_x = (TARGET_SIZE - resized_width) // 2
    offset_y = TARGET_SIZE - resized_height - 12
    if offset_y < 0:
        offset_y = (TARGET_SIZE - resized_height) // 2
    output.alpha_composite(resized, (offset_x, offset_y))
    return output


def process_monsters():
    output_dir = ROOT / "enemies"
    output_dir.mkdir(parents=True, exist_ok=True)
    enemy_index = 0

    for sheet_path in sorted(SHEETS.glob("monster-sheet-*.png")):
        sheet = remove_chroma(Image.open(sheet_path))
        components = find_components(sheet)
        centers = [
            ((column + 0.5) * sheet.width / 3, (row + 0.5) * sheet.height / 3)
            for row in range(3)
            for column in range(3)
        ]
        groups = assign_to_centers(components, centers, sheet.size)
        for cell_index in range(9):
            if not groups[cell_index]:
                raise RuntimeError(f"Missing monster cell {cell_index} in {sheet_path.name}")
            render_group(sheet, groups[cell_index]).save(output_dir / f"{enemy_index}.png")
            enemy_index += 1
    if enemy_index != 45:
        raise RuntimeError(f"Expected 45 monsters, wrote {enemy_index}")


def process_humanoids():
    output_dirs = [
        ROOT / "humanoid-enemies",
        ROOT / "humanoid-enemies-attack",
        ROOT / "humanoid-enemies-skill",
    ]
    for directory in output_dirs:
        directory.mkdir(parents=True, exist_ok=True)

    sheet_paths = sorted(SHEETS.glob("humanoid-??-sheet.png"))
    sheet_paths.extend((SHEETS / "boss-sheet.png", SHEETS / "true-boss-sheet.png"))

    for enemy_index, sheet_path in enumerate(sheet_paths):
        sheet = remove_chroma(Image.open(sheet_path))
        components = find_components(sheet)
        centers = [
            (sheet.width / 6, sheet.height / 2),
            (sheet.width / 2, sheet.height / 2),
            (5 * sheet.width / 6, sheet.height / 2),
        ]
        groups = assign_to_centers(components, centers, sheet.size)
        for action_index in range(3):
            if not groups[action_index]:
                raise RuntimeError(f"Missing action {action_index} in {sheet_path.name}")
            render_group(sheet, groups[action_index]).save(output_dirs[action_index] / f"{enemy_index}.png")


if __name__ == "__main__":
    process_monsters()
    process_humanoids()
    print("Created 45 monster sprites and 22 humanoid/boss sprites for each action.")
