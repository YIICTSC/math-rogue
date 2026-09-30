# Furniture sprite sheets

Original assets generated with the built-in image_gen tool, then cropped, cleaned and packed with Sharp.

- furniture-home-a.webp: bed, sofa, desk, bookshelf, stove, workbench, wardrobe, chair, table, rug, clock.
- furniture-home-b.webp: cushion, plant, painting, cabinet, bath, bench, lamp, flower, campfire, piano, aquarium.
- Each final WebP: 640 x 2112, four columns x eleven rows, 160 x 192 transparent cells.
- Craft image PNGs were converted to WebP at quality 92 with lossless alpha; the conversion script checks dimensions, format, and transparency before removing each source PNG.
- Columns: front-right, front-left, back-left, back-right. Paired left/right views use horizontal reflection; fronts and backs use separate generated artwork.
- Mapping and clipping live in FurnitureSprite.tsx. HomeView uses the same renderer as the preview gallery.

Generation prompt: original cozy school island furniture, orthographic quarter-view looking down at 30 degrees, warm wood/pastel fabric, polished hand-painted low-poly style, isolated transparent sprites, four successive quarter turns, distinct front/back structures, no labels, arrows, scenery or emoji. A: bed/sofa/study desk/bookshelf/kitchen/workbench/wardrobe/chair/table/rug/clock. B: cushion/plant/easel/cabinet/bath/bench/lantern/flower planter/campfire/piano/aquarium. Correction prompt: replace incorrect rear views with solid backs and reverse chair backrests; preserve object identity and transparency.

Asset check: `node scripts/test-craft-furniture.mjs`.

## Wardrobe and table repair

`furniture-home-a-v2.webp` is now used by the game. Its wardrobe and table rows are replaced from `furniture-wardrobe-table-source.webp`, generated with imagegen as a four-column/two-row transparent sheet with large gaps. `furniture-wardrobe-table.webp` contains the normalized eight replacement frames. Each replacement cell has at least 16px transparent horizontal padding and20px vertical padding. The source objects are kept whole; wardrobe crowns and all table legs are preserved. The asset test checks this padding in every replacement direction.

Repair prompt: whole curved-top wooden wardrobe and round wooden coffee table with mug, four successive quarter-view orientations, exactly four columns and two rows, at least25percent source padding, large transparent gaps, all crowns and legs visible, no overlap, labels, arrows or scenery.

## Plush, hobby furniture and home cat

Built-in imagegen was used. Final WebP atlases are `furniture-plush.webp` (4×2), `furniture-hobbies.webp` (4×3), and `home-cat.webp` (4×3). Source outputs are preserved alongside them as `*-source.webp`. All cells are160×192 with16px or more horizontal and20px or more vertical padding. Each source cell was verified to contain the entire object before packing. WebP edges were cleaned before compositing.

Prompt set: original cozy quarter-view school-island style, polished hand-painted art, isolated transparent background, at least25percent padding in each source cell, no labels/arrows/scenery. Plush: four rotations of teal-bow teddy bear and yellow-bow plush bunny, visible rear seams/tails. Hobbies: four rotations of darts cabinet, six-pocket billiards table and purple arcade cabinet; front interfaces and solid backs differ. Cat: ginger-and-white kitten with teal collar, four walk frames, four grooming/stretch frames, two sleep frames and crouch/roll. Pet correction: shrink characters to50percent within their cells and increase all gaps so ears/tails/paws stay whole.

## Ten selectable home pets
Built-in image_gen created ten original transparent six-frame sheets (not placeholders): Shiba Inu, tricolor Corgi, apricot toy poodle, calico cat, silver tabby cat, black cat, lop rabbit, golden hamster, panda cub, and Japanese long-tailed tit. Each sheet contains two walking frames, grooming, side sleeping, playful crouch, and a dedicated trusting belly-up pose. The last pose is gated by bond100 in petMotion.ts.

Final assets: `pet-{shiba,corgi,poodle,calico,tabby,blackCat,rabbit,hamster,panda,longTailedTit}.webp`. Each is480×384,3columns×2rows,160×192cells,16px minimum side padding and20px vertical padding; all ears/tails/paws remain within cells. Original outputs retained as `pet-*-source.webp`. `scripts/build-craft-pets.mjs` trims transparent margins and packs each animal at a consistent scale across its six frames.

Exact base prompt, per-animal subjects, and source filenames: `pets-generation.json`. Base request: original cozy hand-painted quarter-view pet, consistent identity, exactly3columns×2rows, two distinct walk poses/groom/sleep/play/belly-up, fully visible whole animal with large transparent gaps, no labels/scenery. Bird uses wing preening and bird feet. Tool: built-in image_gen; no CLI fallback.

Verification: `node scripts/test-craft-pets.mjs` and the mobile browser adoption/affection tests.
