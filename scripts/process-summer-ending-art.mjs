import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestRoot = path.join(root, 'assets/ending-expansion');
const sources = JSON.parse(await fs.readFile(path.join(manifestRoot, 'art-sources.json'), 'utf8'));
for (const file of (await fs.readdir(manifestRoot)).filter(file => /^(high-school|magic)-.*\.json$/.test(file))) {
  sources.push(JSON.parse(await fs.readFile(path.join(manifestRoot, file), 'utf8')));
}
// These are storyboards, not sprite sheets. Three equal full-bleed scenes, no gutters.
for (const entry of sources) {
  const replaceReviewed = process.argv.includes(`--replace=${entry.theme}/${entry.kind}/${entry.heroId}`);
  const { width, height } = await sharp(entry.source).metadata();
  if (entry.kind === 'friendship') {
    if (!width || !height || width < height || width < 1000) throw new Error(`Invalid friendship CG: ${entry.heroId}`);
    const folder = path.join(root, 'public/sprites/endings/summer-expansion/magic/friendship');
    await fs.mkdir(folder, { recursive: true });
    const target = path.join(folder, `${entry.heroId.toLowerCase()}.webp`);
    try { await fs.access(target); if (!replaceReviewed) continue; } catch { /* New deliverable. */ }
    await sharp(entry.source).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 90 }).toFile(target);
    console.log(path.relative(root, target));
    continue;
  }
  if (!width || !height || height < width * 2.8 || height > width * 3.2) {
    throw new Error(`${entry.heroId}: expected a vertical three-square storyboard, got ${width}x${height}`);
  }
  const folder = path.join(root, 'public/sprites/endings/summer-expansion', entry.theme, entry.kind, entry.heroId.toLowerCase());
  await fs.mkdir(folder, { recursive: true });
  for (let index = 0; index < 3; index++) {
    const top = Math.round(height * index / 3);
    const bottom = Math.round(height * (index + 1) / 3);
    const target = path.join(folder, `${index + 1}.webp`);
    // Refuse unreviewed replacements: remove/revise the manifest entry instead.
    try { await fs.access(target); if (!replaceReviewed) continue; } catch { /* New deliverable. */ }
    await sharp(entry.source).extract({ left: 0, top, width, height: bottom - top })
      .resize(1024, 1024, { fit: 'contain', background: '#0f172a' }).webp({ quality: 90 }).toFile(target);
    console.log(path.relative(root, target));
  }
}
