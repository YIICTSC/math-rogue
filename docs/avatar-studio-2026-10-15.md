# GAKURO GP / VR / Golf avatar studio

## Assets and integration

Original sport/fantasy avatar components built with Blender 4.5.11. All three games
consume the versioned `public/models/storybook/characters-v3.glb` library. Existing
species, hairstyle, face, color, expression and accessory IDs are unchanged;
save files and online messages require no migration.

- 59 named component meshes in one GLB (approximately 2.82 MiB).
- 11 complete hairstyles plus the existing shaved-head choice. Swept custom meshes,
  sculpted root transitions, subdivision and decimation replace repeated hair blobs.
- 13 accessories plus “none”: goggles, helmet, crown, round/square glasses,
  sunglasses, ribbon, flower, headphones, cat-ear band, beret, earrings and visor.
  Material-separated meshes preserve outfit tinting and distinguish enamel, satin,
  metal and lenses.
- Reshaped cheek/chin profile, torso, mittens with thumbs, trousers and shoes.
  Animal muzzles, floppy ears and tails receive dedicated Blender shapes.
- Seven eye silhouettes, five face contours, four complexion styles and eight
  expressions continue to work. Eye proportions and surface roughness are revised. The new “つぶらな瞳” /
  “Cute oval eyes” option uses black vertical ovals, a large white glint and a
  small lower tint, with closed smiling eyes and a one-eye wink. Old IDs 0–5
  retain their meaning; ID 6 is appended.
- GP retains its instanced driver/steering system; golf retains articulated arms
  and club. VR now retains live geometry references so characters created before
  GLB loading completes receive the new meshes. Previously it cloned the temporary
  geometry and kept that fallback forever. Unused VR geometry/materials are disposed.

VR character previews fit the loaded avatar bounds, including tall hair and ears,
and add neutral lighting only during editing. Golf entry now exposes the character
creator before starting a practice session or creating a room.

The torso details and palettes are shared across games. This does not introduce
new clothing selections or alter gameplay, hitboxes, movement or network rules.

## Editable source / reproduction

`scripts/blender/build-avatar-studio.py` creates the library, catalog and editable
`assets/avatar-studio/avatar-studio.blend`. The .blend contains hidden named source
components and a lit review character. Unhide source components in the Outliner to
edit them; the standalone review character is a copy. Four PNG renders beside the
.blend show front, 45-degree, side and rear views. These images are review assets,
not runtime textures. The Blender review uses simplified eyes; the live Three.js
views are authoritative for expression and customization appearance.

```powershell
& ../tools/blender/blender-4.5.11-windows-x64/blender.exe --background --factory-startup --python scripts/blender/build-avatar-studio.py
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

The older v1/v2 libraries and generator are retained for existing references.
`src/three/storybookCharacters.ts` uses v3; the versioned URL prevents stale cached
v2 geometry. Legacy components normalize to their original rig dimensions, while
complete hairstyle/accessory components preserve Blender-authored rig coordinates.
No production texture images or additional texture requests are needed.

## Verification

Commands for this revision:

```text
pnpm run build
node scripts/test-storybook-characters-browser.mjs
node scripts/test-avatar-studio-browser.mjs
node scripts/test-avatar-vr-preview.mjs
node scripts/test-human-avatar-editor-browser.mjs
```

The component test covers 1,344 species/hair/accessory configurations, expressions,
early disposal and missing-library fallback. The studio test checks finite mesh
coordinates, all hairstyle IDs and cold/cached VR loading, and renders hairstyle /
accessory contact sheets plus four viewpoints. The VR preview test uses the actual
VR scene, saves appearance, switches hair and headwear, renders training and checks
renderer cleanup. The editor test covers saved face/eye/accessory selections and
scrolling to the last option at desktop, phone portrait and phone landscape sizes.

Review screenshots are under `tmp/avatar-studio-qa`, `tmp/avatar-vr-preview` and
`tmp/human-editor-qa`. Hair roots and top/bottom mesh caps were corrected after
render inspection. Polygon counts were reduced after silhouette review.

Browser checks use Chromium/SwiftShader. Physical mobile-device performance and
40-player network performance have not been benchmarked in this art revision.
Integrated with GitHub main through 0c0c657c. Type checking, production build,
English UI gate, server build, avatar rendering, editor persistence/mobile layouts,
VR camera and offline CPU battle checks pass before upload. Render remains manual.
