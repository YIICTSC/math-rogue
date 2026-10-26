# Dedicated dungeon map materials (2026-10-26)

Dungeons 1 and 2 share 22 dedicated material sets, one for every expedition or challenge route. Previously they shared the same 16-cell floor sheet and 16-cell wall sheet. The new ImageGen sheets contain 64 authored cells each (1,408 distinct cells in total).

Each route has 24 floor variants, 24 wall variants, two appearances each for water/ice/cracks/pits, and eight staircase variants. Forest roots and moss, glacial crystals, wet docks, library masonry, foundry iron, mirror marble, clockwork brass, infirmary tiles and other route-specific details are authored into the materials. These are scenery; they do not add pickups, facilities or event triggers.

## Rendering

- One of four understated floor materials sets the base for each floor. Corresponding wear appears sparsely, while additional material/inlay cells provide rare accents. This avoids random checkerboard patches and repeated high-contrast motifs.
- Coordinate/floor hashes choose all differences deterministically. Returning to a tile or loading a save cannot shuffle its appearance.
- The 24 wall textures are derived into the original 16 corner masks. All 8,448 derived cells preserve the original alpha silhouette, convex corners and concave corners. The 256 neighbor configurations per route use the existing quarter-selection logic.
- Walls are visibly solid; niches, reliefs and structural variants appear on wall faces. Water, ice, cracks, black pits and stairs retain separate, readable appearances. Stairs also retain a small consistent downward marker.
- Geometry, movement, terrain effects, traps, NPCs and random item generation are unchanged. Town/scenic/dojo render paths retain their existing material logic.
- Only the current set and two recently used sets remain in the image cache. Existing materials provide the loading/error fallback.

## Sources and rebuild

The original ImageGen results remain in the generation workspace. Lossless source WebPs are retained in `assets-source/dungeons-map-materials/`. Their hashes, generator, reference wall mask hash, themes and runtime output hashes are recorded in `assets/dungeons-map-materials/build.json`.

The existing `public/sprites/dungeons2/world/materials.webp` was supplied as the pixel-art style reference. Each route received its own ImageGen call, with an exact 8×8 material layout. Normalization resamples the grid to 64px cells; it does not generate additional artwork. Wall-mask multiplication is a derived rendering asset, not additional independently generated images.

```sh
node scripts/build-dungeons-map-materials.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

For a fresh generation batch, the builder accepts a JSON array of `{route, theme, source}` records as its optional argument; `source` points to each ImageGen output. Originals are copied, never moved or deleted.

## Verification

```sh
node scripts/test-dungeons-map-materials.mjs
node scripts/test-dungeons-map-materials-browser.mjs
node scripts/verify-android-asset-manifest.mjs
pnpm run build
pnpm run server:build
```

The media/rule check verifies all 1,408 cells are distinct within their authored set, source/output hashes, reachability of all material variants and exact wall-mask alpha. The browser check uses both actual game components, all 22 route sets, water/ice/cracks/pits/stairs, desktop and phone portrait/landscape, and 5,632 route/neighbor-mask combinations. Screenshots are written to `tmp/dungeons-map-materials/` for visual review.
