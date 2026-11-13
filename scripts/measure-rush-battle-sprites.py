#!/usr/bin/env python3
"""Measure existing main-game 2x2 sheets for Mini Rush. Requires Pillow.
Run with --check to verify anchors without rewriting the committed data.
"""
import json
import re
import statistics
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'src/mini-games/after-school-rush/battleSpriteMetrics.json'
paths = dict(re.findall(r'"([^"\n]+)": "(sprites/[^"\n]+)"',
                       (ROOT / 'src/mini-games/go-home-dash/heroes.ts').read_text()))
existing = json.loads(TARGET.read_text())
measured = {}
for actor in existing:
    measured[actor] = {}
    for action in ('attack', 'skill', 'hit'):
        source = ROOT / 'public' / paths[actor].replace('/characters/', f'/characters-{action}-sheets/')
        image = Image.open(source).convert('RGBA')
        width, height = image.width // 2, image.height // 2
        heights, feet, shifts = [], [], []
        for frame in range(4):
            x, y = frame % 2 * width, frame // 2 * height
            alpha = image.crop((x, y, x + width, y + height)).getchannel('A').point(lambda a: 255 if a > 48 else 0)
            left, top, right, bottom = alpha.getbbox()
            heights.append((bottom - top) / height)
            feet.append(round((1 - bottom / height) * 100, 3))
            band = alpha.crop((0, max(top, bottom - round(height * .07)), width, bottom)).getbbox()
            center = (band[0] + band[2]) / 2
            shifts.append(round((.5 - center / width) * 100, 3))
        measured[actor][action] = {'scale': round(max(.9, min(1.22, .82 / statistics.median(heights))), 4),
                                   'feet': feet, 'shift': shifts}
if '--check' in sys.argv:
    assert measured == existing, 'Battle artwork changed: remeasure and visually review its frame anchors'
    print('PASS 36 main-game sheets / 144 frame anchors match source artwork')
else:
    TARGET.write_text(json.dumps(measured, indent=2) + '\n')
