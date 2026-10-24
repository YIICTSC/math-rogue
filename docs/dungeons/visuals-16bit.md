# Dungeons 1: 16-bit graphics and hero actions

Dungeons 1 now uses the same 32px material tiles, quarter-wall autotiling,
terrain features, building facades and town backdrop as Dungeons 2. Existing
map layouts, collision, visibility, traps and turn rules still drive the render.
The legacy renderer remains available while images load or if an image fails.
The optional 3D view retains its existing renderer.

The 2D hero renderer supports all 35 protagonists and 17 transformed magic forms.
Actions are walk, attack, throw, swing, read, use and shoot, in eight directions.
Motion is visual only and expires by elapsed time; it never schedules a turn.
Town and dojo input use the same dispatcher as dungeon input. Dungeons 2 cues
are forwarded to its existing action system.

- The red-cap elementary warrior has a dedicated ImageGen atlas: eight poses ×
  eight facings. The source is preserved in
  `assets-source/dungeons1/elementary-warrior-actions.png`.
- Other heroes use articulated poses assembled from their existing directional
  illustrations, with alternating feet, shoulder movement and pixel-art props.
  They are not individually redrawn ImageGen sheets. Transformed forms use their
  own source art. Twenty-four pose frames per direction are cached on demand;
  an LRU retains at most four atlases (~27 MiB) across hero/form changes.
- Feet use the original illustration's baseline. Nearest-neighbor sampling keeps
  the sprite clusters sharp. The DOM traveler canvas also renders actions in town.

Regenerate the painted atlas:

```sh
node scripts/dungeons1/normalize-hero-actions.mjs assets-source/dungeons1/elementary-warrior-actions.png
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

Run manifest generators from a full checkout. A sparse checkout needs to retain
records for absent assets instead of replacing the complete Android packs.
Provenance and output/reference hashes are in `assets/dungeons1/hero-actions.json`.

Verification:

```sh
node scripts/test-dungeons1-art.mjs
node scripts/test-dungeons1-art-browser.mjs
node scripts/test-dungeons2-world-browser.mjs
node scripts/test-dungeons2-actions-browser.mjs
pnpm run build
pnpm run server:build
```

The browser test exercises actual movement and item handlers, town and dojo,
all 9,984 procedural pose cells, idle restoration and desktop/phone viewports.
Screenshots are written to `tmp/d1-art/` (not included in source control).
