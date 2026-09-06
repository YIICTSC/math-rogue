import fs from 'node:fs/promises';
import sharp from 'sharp';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/normalize-sprite-sheet-alpha.mjs <input.png> <output.png>');
}

const source = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = source;
const { width, height, channels } = info;
const pixelCount = width * height;
const alphaOffset = channels - 1;
const alphaValues = new Uint8Array(pixelCount);

for (let index = 0; index < pixelCount; index += 1) {
  const alpha = data[index * channels + alphaOffset];
  alphaValues[index] = alpha;
}

// ImageGen may render its requested transparent canvas as a light checkerboard.
// Remove only bright, neutral pixels connected to the outer edge so white
// costume details enclosed by the character remain intact. Run this even when
// the image already has partial alpha: a prior pass can leave a few opaque
// checkerboard pixels at a corner.
{
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
    if (visited[index]) alphaValues[index] = 0;
  }
}

for (let index = 0; index < pixelCount; index += 1) {
  data[index * channels + alphaOffset] = alphaValues[index];
}

await fs.mkdir(new URL('.', `file://${outputPath.replaceAll('\\', '/')}`), { recursive: true }).catch(() => {});
await sharp(data, { raw: { width, height, channels } }).png().toFile(outputPath);

const transparentCount = alphaValues.reduce((count, alpha) => count + (alpha === 0 ? 1 : 0), 0);
console.log(`${outputPath}: ${width}x${height}, RGBA, transparent=${transparentCount}/${pixelCount}`);
