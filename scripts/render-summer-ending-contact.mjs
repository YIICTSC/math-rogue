import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = process.cwd();
const kind = process.argv[2] ?? 'true';
const sourceRoot = path.join(root, 'assets/ending-expansion');
const first = JSON.parse(await fs.readFile(path.join(sourceRoot, 'art-sources.json'), 'utf8'));
const others = await Promise.all((await fs.readdir(sourceRoot)).filter(f => /^(magic|high-school)-.*\.json$/.test(f))
  .map(async file => JSON.parse(await fs.readFile(path.join(sourceRoot, file), 'utf8'))));
const entries = [...first, ...others].filter(e => e.kind === kind).sort((a,b) => `${a.theme}/${a.heroId}`.localeCompare(`${b.theme}/${b.heroId}`));
const out = path.join(root, 'build/summer-ending-qa');
await fs.mkdir(out, { recursive: true });
for (let offset = 0; offset < entries.length; offset += 6) {
  const group = entries.slice(offset, offset + 6);
  const height = kind === 'friendship' ? 260 : 720;
  const width = kind === 'friendship' ? 390 : 240;
  const tiles = await Promise.all(group.map(async(entry, i) => ({
    input: await sharp(entry.source).resize(width, height, { fit: 'contain', background: '#0f172a' }).png().toBuffer(),
    left: (i % 3) * width, top: Math.floor(i / 3) * height,
  })));
  const target = path.join(out, `${kind}-${offset}.png`);
  await sharp({ create: { width: width * 3, height: height * 2, channels: 3, background: '#0f172a' } }).composite(tiles).png().toFile(target);
  console.log(JSON.stringify({ target, order: group.map(e => `${e.theme}/${e.heroId}`) }));
}
