# Storybook 3D for Learning Rogue

RPG, GAKURO GP and GAKURO GOLF share original, warm fantasy scenery. Three.js renders the existing authoritative game state; Blender creates the scenery and animation. This update does not change map collision, track geometry, golf holes or network rules.

## Editable assets

- `assets/storybook/storybook.blend`: Blender 4.3 source with an arranged asset gallery.
- `scripts/blender/build-storybook.py`: deterministic original mesh/material/animation generation.
- `public/models/storybook/storybook-v1.glb`: embedded geometry/materials, no external texture dependency, approximately 938 KiB.
- `public/models/storybook/catalog.json`: 19 models and exported animation clips.

Regenerate from the repository root:

```sh
blender --background --python scripts/blender/build-storybook.py
```

Trees, flowers, mushrooms, rocks, cottages, a clubhouse, a tower, an arch, lanterns, a bridge, a bench, cacti, a windmill and a butterfly use one palette. The windmill rotor and butterfly wings have Blender-authored animation clips. The `.blend` gallery spaces the roots for editing; when exporting manually, move the named asset roots back to the origin before exporting glTF. Regeneration rebuilds the gallery from the script, so keep hand-edited variations separately.

Repeated static meshes use `InstancedMesh` by material; animated objects share imported resources but own their animation mixers.

## Rendering and settings

`src/three/storybookModels.ts` owns loading, instancing, animation and resource disposal for each scene. Original scene decoration remains available if model loading fails. Gameplay continues while models load. The GLB is versioned and included in both web and Android asset manifests.

`src/three/storybookStyle.ts` provides softly varied terrain, water highlights, distant hills, clouds, pollen and common color management. High quality enables directional shadows. Low quality also reduces distant tree counts in kart and golf. Auto selects lightweight rendering on small screens or coarse-pointer devices; low quality limits pixel ratio to 1 and disables shadow maps. Auto/high/low controls are available in kart and golf; RPG uses its existing dedicated map-quality setting. Reduced-motion preferences stop decorative animation.

RPG keeps NPC and player illustration billboards, farming objects and interaction metadata. Imported buildings and resources retain tile picking. GP places shared decoration along the actual selected/custom track; the road and quiz section remain unchanged. Golf places scenery around each existing hole, preserving ball physics and camera/reaction behavior.

## Validation

```sh
node scripts/test-storybook-assets.mjs
node scripts/test-storybook-browser.mjs
node scripts/test-kart-camera-browser.mjs
node scripts/test-rpg-world3d-browser.mjs
node scripts/test-golf-shot-browser.mjs
pnpm run build
pnpm run server:build
node scripts/generate-android-asset-manifest.mjs
node scripts/verify-android-asset-manifest.mjs
```

Browser tests use Chromium with software WebGL, including mobile viewport emulation. Actual device frame rate depends on the GPU; these tests do not establish a frame-rate guarantee.

## Storybook characters for kart and golf

`assets/storybook/characters.blend` and `scripts/blender/build-storybook-characters.py` contain twelve original character components: a sculpted head, sweater, sleeves, mittens, hair cap/locks, ears, shoes, trousers, robot head and collar. Exported geometry is embedded in `public/models/storybook/characters-v1.glb` (approximately 99 KiB). Regenerate with `blender --background --python scripts/blender/build-storybook-characters.py`.

`storybookCharacters.ts` loads this small bank once and upgrades the existing shared geometry in place. Meshes and instances retain identity, avatar color/species/hair/accessory/expression settings and existing multiplayer data. A disposed geometry is never upgraded; a missing model retains its primitive fallback. GPU buffers are released before replacement. No network protocol or gameplay dimension changes are needed.

GP drivers use the rounded Blender components with cloth trim, gentle neck movement, blinking and steering hand motion, while retaining instancing for forty players. Golf uses the same head, clothing and hair components plus rounded shoes and trousers. Arms rotate about separate shoulder pivots. A score reaction temporarily changes the face expression, then restores the player's selected expression. Existing meter, spin, club, swing and score camera rules remain intact.

`node scripts/test-storybook-characters-browser.mjs` checks the loaded Blender geometry, 384 species/hair/accessory configurations, score expression restoration, shoulder pivots, early disposal and unavailable-model fallback. Existing kart-avatar and golf-shot browser tests cover customization, multiplayer synchronization and gameplay.
