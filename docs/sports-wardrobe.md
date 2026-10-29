# Sports wardrobe and original human characters

The 35 elementary, high-school and magic protagonists have four skinned kits:

- Tennis: short-sleeved polo, collar/placket, shorts, wristbands, socks and court shoes.
- Basketball: sleeveless jersey, double-digit chest mark, side panels, shorts and court shoes.
- Dodgeball: training shirt with chest band/badge, shorts and wristbands.
- Golf: collared polo, long trousers and golf shoes.

All four sports offer **Sports outfit / Regular outfit** before play. Regular
outfit restores the source character's complete costume, hair, headwear and props.
Sports outfits preserve the face and hair while replacing clothes and held props.
The shared golfer rig is used in all four games; tennis now also routes named
characters through this same wardrobe path in matches as well as the editor.

The shared editor can turn a protagonist into an original human (`customBase`),
select another protagonist's hair (`customHair`), recolor skin/hair/top/bottoms,
and choose the original costume or one of four kits. Original characters use the
existing eight generic voice choices. The existing generic species/face editor
remains available. Each game's existing avatar storage, lobby command and snapshot
carry the new validated optional fields; old saves retain their defaults.

GP exposes `kartColor` for named and original drivers. Missing `kartColor` falls
back to the old `outfit` color. Kart paint and driver clothes are separate, both
in the normal instanced renderer and the minimal renderer. Original humans also
support the minimal renderer's baked seated pose.

## Assets and regeneration

`public/models/sports-wardrobe/*.glb` is a separate library; the original RPG
models and editable `.blend` files are preserved. The original voxel builder and
`designs.json` provide source parts, rig, animation and proportions. The wardrobe
builder adds all four sets of clothes, joins geometry with `_PART` and `_TINT`
attributes, and exports a single skinned mesh/material. Runtime filters the index
buffer and recolors semantic regions without rebuilding skeletons. Alternate hair
uses the same compatible head rig. Changes reuse the loaded model, and each player
owns its geometry/materials. No character in a shared GLB cache is recolored.

```
blender -b -t 2 --python scripts/blender/build-sports-wardrobe.py
# Install dev dependencies listed in scripts/blender/voxel-heroes/package.json.
node scripts/blender/voxel-heroes/optimize-wardrobe.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

Source/generated metadata: `assets/protagonists/sports-wardrobe.json`,
`sports-wardrobe-validation.json`, `src/three/wardrobeParts.json`.
Quantization excludes semantic IDs. Models are validated with glTF Validator.

`node scripts/test-sports-wardrobe-browser.mjs` audits 140 kit combinations,
regular costume restoration, mixed hair, colors, input validation, saved editor
settings, independent GP paint, mobile layouts and English UI. Screenshots are
written to `tmp/sports-wardrobe-qa/`.
