# Dungeons 1: 35 dedicated Blender ultimates

`ultimate-fx.blend` contains one editable 24-frame/20fps scene per protagonist. Scene names are `<hero-id>_skill_1`. `abilities.json` records the gameplay ability names, colors and elemental behavior used to create the scenes. Character-specific sword edges, turning pages, musical notes, comets, thunderbolts, curling tides, serving plates and guardian petals orbit, gather and disperse in 3D. Shared elemental ribbons and shock waves keep the visual language consistent with Dungeons 2.

Regenerate from the repository root with Blender 4.3.2 and Python Pillow/NumPy:

```sh
blender -b -t 1 --python scripts/dungeons2/render-ultimate-fx.py -- --output /workspace/d1-fx-render --series1-roster assets-source/dungeons/abilities.json
python scripts/dungeons2/pack-ultimate-fx.py /workspace/d1-fx-render --series1
```

Each shipping WebP atlas contains 24 RGBA frames in a 6×4 grid of 192-pixel cells. `ultimate-fx.json` records dimensions, timing and checksums. The game resolves all 35 original hero IDs to their own atlas; it no longer substitutes Dungeons 2 hero effects. Existing cooldowns, combat resolution and voice banks are retained. Raw renders remain outside the repository.
