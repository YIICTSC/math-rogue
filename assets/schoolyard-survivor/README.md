# Schoolyard Survivor art sources

`schoolyard-survivor.blend` is the compressed, editable Blender 4.3 scene used to render the shipped assets. Three collections contain 40 school-tool weapons, six monsters plus six obstacle props, and six eight-frame magic flipbooks. Geometry, beveled edges, materials, orthographic camera and transparent renders are authored by `generate_blender.py`; no external model downloads are required.

```sh
blender -b -t 4 --python assets/schoolyard-survivor/generate_blender.py
node scripts/build-schoolyard-survivor-assets.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

`atlas.json` records the 128px cell ordering (eight columns). The runtime loads the actual rendered cells for weapon icons/projectiles, enemies, collidable scenery and additive flipbook effects. Lossless intermediate PNG renders and Blender backup files are ignored.

`public/sprites/schoolyard-survivor/title.webp` is an original generated key visual. Design references are the existing Dungeons 1 eight-direction sheets for `elementary-warrior`, `high-school-warrior` and `magic-akari`. Art direction: twilight school courtyard, school-tool weapons, enchanted books and bells, cyan/gold magic rings, pink crescent slashes; three heroes at center-right and dark open space for the separately rendered title. It contains no baked-in lettering. All 35 playable characters use the existing Dungeons 1 2D sheets, not new substitutes.

Gameplay remains in the existing fixed-step Canvas 2D runtime. `world.ts` holds the roster, battlefield definitions and shared collision/spawn geometry. Title, selection, pause, combat controls and results are DOM overlays with portrait/landscape layouts. Learning challenges and the existing 40 weapon/evolution upgrade system remain integrated. Shift / controller A / the dash button grant a short invulnerable dash; Space / controller X / the burst button spend charge earned by kills. Bosses arrive at 90, 180 and 300 seconds; defeating the final boss clears the run. Timers use simulation steps, so pause and learning challenges freeze delayed weapon volleys.

Verification:

```sh
node scripts/test-schoolyard-survivor.mjs
node scripts/test-schoolyard-survivor-browser.mjs
```

Browser screenshots are written to `tmp/schoolyard-survivor/`. Test-only Vite transforms expose the simulation to the fixture; production has no added test controls or debug shortcuts.

Burst cut-ins reuse the exact Dungeons 1 `AbilityCutin` component, each hero's normal-form ultimate illustration and ability title/color (all 35 heroes). A cut-in lasts 75 simulation steps, freezes during pause/learning, never intercepts pointer input and clears on a new run. The selected hero's art is preloaded at departure.

High-school and magic heroes use the same recorded voice banks and variant mapping as Dungeons for attacks, damage, healing, bursts and results. Ordinary lines are occasional and spaced by four seconds, while burst/result lines take priority. Muting, voice volume, pause, learning, hero changes and exit are respected; stopping also invalidates pending voice loads. Elementary heroes stay silent.
