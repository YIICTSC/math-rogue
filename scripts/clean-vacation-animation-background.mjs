import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [, , inputPath, outputPath = inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/clean-vacation-animation-background.mjs <input.webp> [output.webp]');
  process.exit(1);
}

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const cellSize = Math.floor(info.width / 2);
const isBackgroundCandidate = (r, g, b, alpha) => {
  if (alpha <= 16) return true;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const neutral = max - min <= 60;
  return (neutral && min >= 120) || (neutral && max <= 36);
};

let cleared = 0;
for (let frame = 0; frame < 4; frame += 1) {
  const xOffset = (frame % 2) * cellSize;
  const yOffset = Math.floor(frame / 2) * cellSize;
  const visited = new Uint8Array(cellSize * cellSize);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || x >= cellSize || y < 0 || y >= cellSize) return;
    const index = y * cellSize + x;
    if (visited[index]) return;
    visited[index] = 1;
    const offset = ((yOffset + y) * info.width + xOffset + x) * 4;
    if (!isBackgroundCandidate(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
    queue.push([x, y]);
  };
  for (let x = 0; x < cellSize; x += 1) {
    enqueue(x, 0);
    enqueue(x, cellSize - 1);
  }
  for (let y = 1; y < cellSize - 1; y += 1) {
    enqueue(0, y);
    enqueue(cellSize - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    const offset = ((yOffset + y) * info.width + xOffset + x) * 4;
    if (data[offset + 3] !== 0 || data[offset] !== 0 || data[offset + 1] !== 0 || data[offset + 2] !== 0) cleared += 1;
    data[offset] = 0;
    data[offset + 1] = 0;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const encoded = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .webp({ quality: 95, alphaQuality: 100, effort: 5 })
  .toBuffer();
const temporaryPath = `${outputPath}.clean-${process.pid}-${Math.random().toString(36).slice(2)}.tmp`;
await fs.writeFile(temporaryPath, encoded);
await fs.copyFile(temporaryPath, outputPath);
await fs.unlink(temporaryPath);
console.log(`${outputPath}: ${info.width}x${info.height}, cleared connected background pixels=${cleared}`);
