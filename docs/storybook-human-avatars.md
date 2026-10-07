# Human avatars shared by kart and golf

The human head uses a softer cheek-to-chin silhouette and a flattened forward face.
Three.js adds layered eyes, highlights, brows, blush and curved mouths. Animal and
robot expressions continue to use their existing components. All saved species,
hair, accessory and expression IDs remain compatible.

Hair uses a shared crown and curved, tapered Blender strands, with separate
silhouettes for all twelve styles. Helmets hide the hair as before. Kart drivers
and standing golfers both consume `createAvatarParts()`.

Regenerate the editable Blender source and GLB:

```sh
blender --background --factory-startup --python scripts/blender/build-storybook-characters.py
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
```

Source: `assets/storybook/characters.blend`. Runtime library:
`public/models/storybook/characters-v2.glb`. The versioned URL prevents an old
cached library from hiding the new human head and strand components.

Validation: `node scripts/test-storybook-characters-browser.mjs` covers 384
species/hair/accessory combinations, expression restoration, early disposal and
missing-library fallback. `node scripts/test-kart-avatar-browser.mjs --ui-only`
covers customization, saved selections and desktop/mobile layouts.

Optional `faceShape`, `faceStyle`, `eyeStyle` and `eyeColor` fields default to
zero for old saves and network avatars. Humans have five chin/cheek contours,
four complexion details, six eye silhouettes and six iris colors. Accessory IDs
0–3 retain their meaning; IDs 4–13 add glasses and decorative headwear.
`node scripts/test-human-avatar-editor-browser.mjs` verifies the new choices,
persistence and scrolling to the final accessory in both games at desktop,
phone portrait and phone landscape sizes.
