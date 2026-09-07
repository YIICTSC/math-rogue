import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/normalize-vacation-animation-sheet.mjs <input.png> <output.webp>');
}

const source = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = source;
const { width, height, channels } = info;
const pixelCount = width * height;
const alphaOffset = channels - 1;
const visited = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

const isBackgroundLike = (index) => {
  const offset = index * channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const minimum = Math.min(red, green, blue);
  const maximum = Math.max(red, green, blue);
  return minimum >= 180 && maximum - minimum <= 14;
};

const enqueue = (index) => {
  if (visited[index] || !isBackgroundLike(index)) return;
  visited[index] = 1;
  queue[tail] = index;
  tail += 1;
};

for (let x = 0; x < width; x += 1) {
  enqueue(x);
  enqueue((height - 1) * width + x);
}
for (let y = 1; y < height - 1; y += 1) {
  enqueue(y * width);
  enqueue(y * width + width - 1);
}

while (head < tail) {
  const index = queue[head];
  head += 1;
  const x = index % width;
  const y = Math.floor(index / width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < width) enqueue(index + 1);
  if (y > 0) enqueue(index - width);
  if (y + 1 < height) enqueue(index + width);
}

for (let index = 0; index < pixelCount; index += 1) {
  if (visited[index]) data[index * channels + alphaOffset] = 0;
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await sharp(data, { raw: { width, height, channels } })
  .resize({ width: 1254, height: 1254, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 95, alphaQuality: 100, effort: 5 })
  .toFile(outputPath);

const cleared = visited.reduce((count, value) => count + value, 0);
console.log(`${outputPath}: ${width}x${height}, cleared background pixels=${cleared}`);
