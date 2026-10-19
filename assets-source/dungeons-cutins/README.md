# Ultimate character cut-ins — Dungeons 1 and 2

Original ImageGen illustrations based on each existing protagonist's standing reference. The reference preserves identity, hairstyle, costume and palette; each ultimate has a different action pose. Transformation variants use the corresponding transformed standing art, rather than recoloring a normal cut-in.

- Dungeons 1: 35 normal cut-ins and 17 transformed Magic chapter variants.
- Dungeons 2: 9 protagonists × 3 skills × 2 forms = 54 cut-ins.
- Total: 106 transparent WebP images, capped at 384×768 for mobile delivery. Signature cards share their own protagonist's third ultimate artwork.
- Runtime: `public/sprites/ultimate-cutins/<hero>-skill-<1–3>[-transformed].webp`.
- The shared resolver uses hero, skill name and current transformation state. Only the selected protagonist's images are preloaded. Cut-ins accompany the existing Blender animation and disappear with the 1.25-second ability burst.

ImageGen outputs three independent equal-width portrait panels per 1536×1024 source sheet. Original generated PNGs are retained in the production workspace's `generated_images` directory. The runtime files are cropped and encoded with Pillow, without repainting or synthesizing artwork. `manifest.json` records every skill/form, output SHA-256, source-sheet SHA-256 and reference SHA-256 for provenance.

Production extraction: `python scripts/dungeons-cutins/pack-cutins.py --work <production-work-directory>`. The work directory contains `all-jobs.json` (panel order, hero, slot, form, reference), `first-results.json` (initial sheet paths) and `<job-id>.path` for subsequent source sheets. These local source paths are not runtime dependencies.

Validation: `node scripts/test-dungeons-cutins.mjs` and `node scripts/test-dungeons-cutins-browser.mjs` (debug Vite at port 5173; optional `WANDERER_TEST_BASE_URL` and `DUNGEONS_SCREENSHOT_DIR`). The browser check covers both selection/status screens, desktop/mobile sizes, each D2 skill, transformed cut-ins and teardown.
