import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = process.cwd();
const generatedRoot = 'C:/Users/myfav/.codex/generated_images/01a078a5-0e8f-7f21-800a-6f63f3c47e47';
const backupRoot = path.join(repoRoot, 'tmp', 'repaired-magic-audit-sheets-20260911');

const replacements = [
  ['exec-1753684f-6860-47c8-975c-5adec3df6f59.png', 'public/sprites/magic/characters-attack-sheets/heroine-08-before.webp'],
  ['exec-1cb3cc23-c9df-44d4-9dfa-c1d8cf0ac09c.png', 'public/sprites/magic/characters-skill-sheets/heroine-08-before.webp'],
  ['exec-680b9c0c-06ad-40b7-b815-aa28cc1d6d82.png', 'public/sprites/magic/characters-attack-sheets/heroine-08-after.webp'],
  ['exec-79347bcd-e7e6-4e58-98f3-75379142413c.png', 'public/sprites/magic/characters-skill-sheets/heroine-08-after.webp'],
  ['exec-e4c9e50b-2dd4-410e-8e15-41a097221cb8.png', 'public/sprites/magic/male-characters-idle-special-sheets/sakuya-after.webp'],
  ['exec-91990f0d-4f16-4155-9ede-212f56428a8a.png', 'public/sprites/magic/male-characters-attack-sheets/elliot-after.webp'],
  ['exec-b2c04d3f-0e5a-429c-bc7a-0bdc78d53780.png', 'public/sprites/magic/male-characters-idle-special-sheets/leon-after.webp'],
  ['exec-4500803b-5187-44ef-abfb-51cdd84ddb1a.png', 'public/sprites/magic/male-characters-idle-sheets/riku-after.webp'],
];

function isCheckerPixel(data, index) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= 8 && (r + g + b) / 3 >= 160;
}

async function removeBorderConnectedCheckerboard(inputPath) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return;
    const pixel = y * info.width + x;
    if (visited[pixel]) return;
    const index = pixel * info.channels;
    if (!isCheckerPixel(data, index)) return;
    visited[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, info.height - 1);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    enqueue(0, y);
    enqueue(info.width - 1, y);
  }

  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  const rgba = Buffer.alloc(pixelCount * 4);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const source = pixel * info.channels;
    const target = pixel * 4;
    rgba[target] = data[source];
    rgba[target + 1] = data[source + 1];
    rgba[target + 2] = data[source + 2];
    rgba[target + 3] = visited[pixel] ? 0 : 255;
  }

  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
}

await fs.mkdir(backupRoot, { recursive: true });

for (const [generatedName, targetRelative] of replacements) {
  const generatedPath = path.join(generatedRoot, generatedName);
  const targetPath = path.join(repoRoot, targetRelative);
  const backupPath = path.join(backupRoot, path.basename(targetRelative));
  await fs.copyFile(targetPath, backupPath);
  const cleaned = await removeBorderConnectedCheckerboard(generatedPath);
  await cleaned.webp({ quality: 92, alphaQuality: 100, smartSubsample: true }).toFile(targetPath);
  const metadata = await sharp(targetPath).metadata();
  if (metadata.width !== 1254 || metadata.height !== 1254 || metadata.hasAlpha !== true || metadata.format !== 'webp') {
    throw new Error(`Unexpected output metadata for ${targetRelative}: ${JSON.stringify(metadata)}`);
  }
  console.log(`${targetRelative}: ${metadata.width}x${metadata.height} ${metadata.format} alpha=${metadata.hasAlpha}`);
}

console.log(`Backups: ${backupRoot}`);
