/** Normalize the ImageGen title, expression atlases and signature supporter art.
 * Usage: node scripts/prepare-poker-illustrations.mjs /path/to/generated_images
 * Source PNGs remain intact. The checked-in WebP files are the shipping assets.
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
const input = process.argv[2];
if (!input)
  throw new Error("Pass the directory containing the ImageGen source PNGs.");
const source = JSON.parse(
  await fs.readFile(
    "assets/after-school-poker/illustration-sources.json",
    "utf8",
  ),
);
const output = "public/sprites/after-school-poker";
await fs.mkdir(`${output}/portraits`, { recursive: true });
await sharp(path.join(input, source.title.generated))
  .resize(1536)
  .webp({ quality: 88 })
  .toFile(`${output}/title.webp`);
for (const group of source.expressions) {
  const file = path.join(input, group.generated),
    meta = await sharp(file).metadata();
  for (const [row, hero] of group.heroes.entries()) {
    const top = Math.round((row * meta.height) / group.heroes.length),
      bottom = Math.round(((row + 1) * meta.height) / group.heroes.length);
    const cells = [];
    for (let col = 0; col < 6; col++) {
      const left = Math.round((col * meta.width) / 6),
        right = Math.round(((col + 1) * meta.width) / 6);
      const cell = await sharp(file)
        .extract({ left, top, width: right - left, height: bottom - top })
        .resize(256, 205, { fit: "contain", background: "#0e254a" })
        .png()
        .toBuffer();
      cells.push({ input: cell, left: col * 256, top: 0 });
    }
    await sharp({
      create: { width: 1536, height: 205, channels: 4, background: "#0e254a" },
    })
      .composite(cells)
      .webp({ quality: 88 })
      .toFile(`${output}/portraits/${hero.id}.webp`);
  }
}
const sheet = path.join(input, source.supporters.generated),
  meta = await sharp(sheet).metadata(),
  cells = [];
for (let row = 0; row < 5; row++)
  for (let col = 0; col < 6; col++) {
    const left = Math.round((col * meta.width) / 6),
      right = Math.round(((col + 1) * meta.width) / 6),
      top = Math.round((row * meta.height) / 5),
      bottom = Math.round(((row + 1) * meta.height) / 5);
    cells.push({
      input: await sharp(sheet)
        .extract({ left, top, width: right - left, height: bottom - top })
        .resize(160, 160, { fit: "contain", background: "#061327" })
        .png()
        .toBuffer(),
      left: col * 160,
      top: row * 160,
    });
  }
await sharp({
  create: { width: 960, height: 800, channels: 4, background: "#061327" },
})
  .composite(cells)
  .webp({ quality: 90 })
  .toFile(`${output}/supporters.webp`);
console.log("Prepared title, 26 × 6 expressions and 30 supporter/club icons.");
