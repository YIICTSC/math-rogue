# 風来の学生 / Wandering Student

Both school-dungeon games share this implementation. Existing game IDs, score keys, base keys and adventure save format remain compatible.

- 35 selectable protagonists (9 elementary, 9 high-school, 17 magic). Selection applies to the next expedition; saved expeditions keep their own identity. Dojo uses the selected protagonist without altering expedition state.
- 35 ordinary and 17 magical-form ImageGen atlases, each 512×256 lossless WebP, 4×2 cells of 128px. Direction indices: **S, N, E, W / SE, SW, NE, NW**. Shared per-hero scale, foot baseline 124, transparent padding. Normal SE corrections cover high-school and magic; transformed SE and Mirai's right profile were reviewed and corrected separately. No mirrored substitutes.
- RPG's existing 35 voxel GLBs are reused. The 17 magical forms add authored cloaks, pauldrons, gems, trim and boots using the existing Blender pipeline; 12 bones and Idle/Walk/Jump/Attack, one skinned mesh/material. Editable sources live in `assets/protagonists/*-transformed.blend`; optimized runtime files in `public/models/protagonists/`.
- 36 themed supplies (12 per chapter) use existing equipment, marks, synthesis, loot and shop systems. Story-only starting supplies are theme-specific. Challenge loadout restrictions remain unchanged.
- Three chapter stories, six scenes each (floors 1/5/10/15/20 and ending). Seen scenes are recorded, replay does not grant duplicate equipment, and progress persists by chapter. Old world events, principal combat and challenge clears remain intact.

## Transformation

Magic protagonists have a Transform button in the adventure toolbar. Activating takes **one turn**, stays active for the current floor, and cannot be toggled off to avoid retaliation. Final outgoing and incoming HP damage both multiply by **2**, after defense, traits and critical modifiers. Misses remain zero; healing and base stats do not change. Melee, projectiles, thrown items, staff/scroll effects, cards, poison, traps and starvation use the same multiplier. Companion damage is independent. The form is saved on the same floor, resets on floor generation and return home, and is unavailable during dojo practice. Both the sprite and the voxel outfit change.

## Assets and reproduction

`public/sprites/wandering-student/provenance.json` records ImageGen source hashes, source crop rectangles, reviewed overrides and normalization parameters. Raw ImageGen outputs are retained in the working artifact directory; checked-in lossless atlases are the runtime originals. `scripts/student-sprites/normalize.py --manifest <generation-manifest.json> --out public/sprites/wandering-student` rebuilds them when those raw sources are present. One manifest entry contains `id`, `path` and optional `directionOverrides: {SE: {path, box: [left, top, right, bottom]}}`.

Blender form builds:

```sh
blender -b -t 3 --python scripts/blender/voxel-heroes/build.py -- --out <output> --designs scripts/blender/voxel-heroes/transformed-designs.json
node scripts/blender/voxel-heroes/optimize.mjs <output>
```

References are the project's existing `*-after.webp` magical illustrations. Unseen rear surfaces and voxel details are original interpretations.

## Verification

```sh
node scripts/test-wandering-student.mjs
node scripts/test-wandering-student-browser.mjs
node scripts/test-school-adventure.mjs
node scripts/test-school-dojo.mjs
node scripts/test-school-adventure-browser.mjs
pnpm run build
pnpm run server:build
```

Browser checks cover both games, 416 runtime direction frames, protagonist selection, story rewards/replay, real melee damage and retaliation, transformation reload, 3D and equipment-preview forms, next-floor reset, and legacy-save fallback. The asset pipeline also validates each magical GLB and all four animated bounds in a browser. iPhone/Android hardware performance was not measured in this environment.
