# Dungeons 2: 16-bit Western fantasy world

The Dungeons 2 map uses original ImageGen art: 16 ground materials, rounded wall edges and convex/concave corners, four terrain/trap tiles, eight complete town facades, a matching town landscape, and 26 enemy designs with eight authored compass facings (208 sprites). Existing heroes, saves, collisions, enemy abilities, and visibility rules are retained. Dungeons 1 keeps its existing art.

The wall renderer samples all eight surrounding cells and composes four quarters. Each quarter chooses a solid, exposed edge, rounded outside corner, or rounded inside corner. Map boundaries count as walls. Normal movement sets enemy facing from the actual displacement; adjacent attacks and ranged attacks face the target. Sleeping/frozen enemies retain their direction.

Monster strips use S, SW, W, NW, N, NE, E, SE. Each monster's eight frames share one scale and a bottom-center anchor in 64px cells. Alpha gutters are detected before extraction to avoid clipping wide wings. Atlas normalization uses nearest-neighbor resampling and lossless WebP. Buildings use a 4×2 atlas with 128px cells; their complete roofs/doors replace the previous town art only for Dungeons 2.

`assets/dungeons2/world/imagegen-provenance.json` records source hashes and extraction rectangles. Original generated PNGs are retained in the generation workspace. To reproduce normalization, place those originals under `/workspace/generated_images` and run:

```sh
D2_F_SHEET=118c1f04-cfb5-4a71-8b0a-385ec0005a8b node scripts/dungeons2/normalize-world-art.mjs
```

Validation:

```sh
# With the dev server running on 5173:
node scripts/test-dungeons2-world.mjs
# Starts an isolated browser fixture using the real Dungeons 2 component:
node scripts/test-dungeons2-world-browser.mjs
```

The asset test checks 26×8 distinct complete frames and renders all 256 wall-neighbor configurations. The component test covers the town atlas, actual dungeon drawing, enemy movement direction, desktop, phone portrait, and phone landscape.

Verified in the actual component at 1280×800, 390×844 and 844×390, including the town background and complete building facade, training dungeon, and a real enemy turn. No browser runtime errors. All 26×8 images are drawn through the production monster renderer in the atlas test. Existing hero/signature-card, enemy-rank and journey rule checks also pass.
