import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [, , originalPath, maskPath, outputPath, ...flags] = process.argv;
const checkerboardMask = flags.includes('--checkerboard');

if (!originalPath || !maskPath || !outputPath) {
  console.error('Usage: node scripts/compose-vacation-background-mask.mjs <original> <transparent-mask> <output> [--checkerboard]');
  process.exit(1);
}

const original = await sharp(originalPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const mask = await sharp(maskPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (original.info.width !== mask.info.width || original.info.height !== mask.info.height) {
  throw new Error(`Canvas mismatch: original=${original.info.width}x${original.info.height}, mask=${mask.info.width}x${mask.info.height}`);
}

const output = Buffer.from(original.data);
const pixelCount = original.info.width * original.info.height;

if (checkerboardMask) {
  const visited = new Uint8Array(pixelCount);
  const queue = [];
  const isCheckerboard = (offset) => {
    const r = mask.data[offset];
    const g = mask.data[offset + 1];
    const b = mask.data[offset + 2];
    const a = mask.data[offset + 3];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return a > 0 && max - min <= 18 && min >= 170;
  };
  const enqueue = (x, y) => {
    if (x < 0 || x >= original.info.width || y < 0 || y >= original.info.height) return;
    const index = y * original.info.width + x;
    if (visited[index]) return;
    visited[index] = 1;
    if (isCheckerboard(index * 4)) queue.push([x, y]);
  };
  for (let x = 0; x < original.info.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, original.info.height - 1);
  }
  for (let y = 1; y < original.info.height - 1; y += 1) {
    enqueue(0, y);
    enqueue(original.info.width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    const offset = (y * original.info.width + x) * 4;
    output[offset] = 0;
    output[offset + 1] = 0;
    output[offset + 2] = 0;
    output[offset + 3] = 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
} else {
  for (let index = 0; index < pixelCount; index += 1) {
    const alphaOffset = index * 4 + 3;
    output[alphaOffset] = mask.data[alphaOffset] < 16 ? 0 : mask.data[alphaOffset];
    if (output[alphaOffset] === 0) {
      output[index * 4] = 0;
      output[index * 4 + 1] = 0;
      output[index * 4 + 2] = 0;
    }
  }
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const encoded = await sharp(output, {
  raw: { width: original.info.width, height: original.info.height, channels: 4 },
}).webp({ quality: 95, alphaQuality: 100, effort: 5 }).toBuffer();
await fs.writeFile(outputPath, encoded);
console.log(`${outputPath}: composed original RGB with ${checkerboardMask ? 'checkerboard flood-fill' : 'generated alpha'} mask`);
