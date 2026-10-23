import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const metadata = path.join(root, 'assets/ending-expansion');
const sources = JSON.parse(await fs.readFile(path.join(metadata, 'art-sources.json'), 'utf8'));
for (const file of (await fs.readdir(metadata)).filter(f => /^(magic|high-school)-.*\.json$/.test(f))) {
  sources.push(JSON.parse(await fs.readFile(path.join(metadata, file), 'utf8')));
}
const counts = { 'high-school/true': 0, 'magic/true': 0, 'magic/friendship': 0, 'magic/epilogue': 0 };
const outputs = new Set();
const records = [];
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
for (const entry of sources) {
  counts[`${entry.theme}/${entry.kind}`]++;
  assert.equal(entry.tool, 'image_gen.imagegen');
  assert.ok(entry.prompt.length > 100);
  for (const reference of entry.references ?? [entry.reference]) await fs.access(path.isAbsolute(reference) ? reference : path.join(root, reference));
  const source = await fs.readFile(entry.source);
  const { width, height } = await sharp(source).metadata();
  const files = [];
  const count = entry.kind === 'friendship' ? 1 : 3;
  for (let i = 0; i < count; i++) {
    const relative = entry.kind === 'friendship'
      ? `public/sprites/endings/summer-expansion/magic/friendship/${entry.heroId.toLowerCase()}.webp`
      : `public/sprites/endings/summer-expansion/${entry.theme}/${entry.kind}/${entry.heroId.toLowerCase()}/${i + 1}.webp`;
    assert.ok(!outputs.has(relative), `duplicate art assignment ${relative}`); outputs.add(relative);
    const bytes = await fs.readFile(path.join(root, relative));
    const decoded = await sharp(bytes).metadata();
    assert.equal(decoded.format, 'webp');
    let expected;
    if (entry.kind === 'friendship') {
      assert.ok(decoded.width >= 1000 && decoded.width > decoded.height);
      expected = await sharp(source).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
    } else {
      assert.equal(decoded.width, 1024); assert.equal(decoded.height, 1024);
      const top = Math.round(height * i / 3), bottom = Math.round(height * (i + 1) / 3);
      expected = await sharp(source).extract({ left: 0, top, width, height: bottom - top })
        .resize(1024, 1024, { fit: 'contain', background: '#0f172a' }).webp({ quality: 90 }).toBuffer();
    }
    assert.equal(sha(bytes), sha(expected), `output does not match generation source/crop ${relative}`);
    files.push({ path: relative, width: decoded.width, height: decoded.height, sha256: sha(bytes), bytes: bytes.length });
  }
  records.push({ theme: entry.theme, heroId: entry.heroId, kind: entry.kind, sourceSha256: sha(source), files });
}
assert.deepEqual(counts, { 'high-school/true': 9, 'magic/true': 17, 'magic/friendship': 34, 'magic/epilogue': 17 });
assert.equal(outputs.size, 163);
if (process.argv.includes('--record')) {
  await fs.writeFile(path.join(metadata, 'delivery-manifest.json'), JSON.stringify({ generator: 'image_gen.imagegen', counts, images: outputs.size, records }, null, 2) + '\n');
}
console.log(`PASS: ${sources.length} ImageGen sources, ${outputs.size} distinct WebP outputs, identities/references, sizes, decoding, byte-for-byte source/crop SHA-256 correspondence.`);
