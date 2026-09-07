import fs from 'node:fs/promises';
import sharp from 'sharp';

const [inputPath, outputPath, mode = 'neutral'] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/prepare-vacation-sprite.mjs <input.png> <output.webp> [neutral|cyan]');
}

const source = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = source;
const { width, height, channels } = info;
const pixelCount = width * height;
const alpha = new Uint8Array(pixelCount).fill(255);

if (mode === 'cyan') {
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const key = [0, 255, 255];
  const isCyanLike = (index) => {
    const offset = index * channels;
    const dr = data[offset] - key[0];
    const dg = data[offset + 1] - key[1];
    const db = data[offset + 2] - key[2];
    return dr * dr + dg * dg + db * db <= 125 * 125;
  };
  const enqueue = (index) => {
    if (visited[index] || !isCyanLike(index)) return;
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
    // Chroma-key output can enclose small background islands inside magic
    // ribbons or props, so clear every close-to-key pixel, not only the
    // region connected to the outer edge.
    if (visited[index] || isCyanLike(index)) alpha[index] = 0;
  }
} else {
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (visited[index]) return;
    const offset = index * channels;
    const minimum = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const maximum = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    if (minimum < 180 || maximum - minimum > 14) return;
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
    const neighbors = [];
    if (x > 0) neighbors.push(index - 1);
    if (x + 1 < width) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - width);
    if (y + 1 < height) neighbors.push(index + width);
    for (const neighbor of neighbors) enqueue(neighbor);
  }
  for (let index = 0; index < pixelCount; index += 1) {
    if (visited[index]) alpha[index] = 0;
  }
}

for (let index = 0; index < pixelCount; index += 1) {
  data[index * channels + channels - 1] = alpha[index];
}

await fs.mkdir(new URL('.', `file://${outputPath.replaceAll('\\', '/')}`), { recursive: true }).catch(() => {});
await sharp(data, { raw: { width, height, channels } })
  .resize({ width: 1254, height: 1254, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 95, alphaQuality: 100, effort: 6 })
  .toFile(outputPath);

console.log(`${outputPath}: ${width}x${height} -> 1254x1254 (${mode})`);
