import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourcePath = path.join(root, 'public/sprites/magic/male-characters/riku-after.webp');
const targetPath = path.join(root, 'public/sprites/magic/male-characters-idle-sheets/riku-after.webp');
const backupPath = path.join(root, 'tmp/riku-idle-after-before-costume-fix.webp');
const cellSize = 627;
const frameScales = [0.96, 0.98, 0.97, 0.95];
const frameOffsets = [
  { x: -2, y: 0 },
  { x: 1, y: -2 },
  { x: 2, y: 1 },
  { x: -1, y: 0 },
];

const sourceBuffer = await fs.readFile(sourcePath);
const { data: sourceRaw, info: sourceInfo } = await sharp(sourceBuffer)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// The source cutout has a green-key fringe around the otherwise transparent
// silhouette.  Decontaminate only pixels at the alpha boundary so the green
// fabric inside the costume remains untouched.
const cleanedRaw = Buffer.from(sourceRaw);
const channelCount = sourceInfo.channels;
const alphaAt = (x, y) => cleanedRaw[(y * sourceInfo.width + x) * channelCount + channelCount - 1];
for (let y = 0; y < sourceInfo.height; y += 1) {
  for (let x = 0; x < sourceInfo.width; x += 1) {
    const pixel = (y * sourceInfo.width + x) * channelCount;
    const alpha = cleanedRaw[pixel + channelCount - 1];
    if (alpha <= 18) continue;
    const red = cleanedRaw[pixel];
    const green = cleanedRaw[pixel + 1];
    const blue = cleanedRaw[pixel + 2];
    const greenExcess = green - Math.max(red, blue);
    if (green > 160 && red < 112 && blue < 112 && greenExcess > 90) {
      cleanedRaw[pixel + channelCount - 1] = 0;
      continue;
    }
    if (green > 122 && red < 145 && blue < 145 && greenExcess > 52) {
      cleanedRaw[pixel + channelCount - 1] = Math.min(alpha, Math.max(0, Math.min(255, Math.round((Math.max(red, blue) + 82 - green) * 3))));
      if (cleanedRaw[pixel + channelCount - 1] <= 18) continue;
    }
    let touchesTransparent = false;
    for (let oy = -2; oy <= 2 && !touchesTransparent; oy += 1) {
      for (let ox = -2; ox <= 2; ox += 1) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx >= 0 && nx < sourceInfo.width && ny >= 0 && ny < sourceInfo.height && alphaAt(nx, ny) <= 18) {
          touchesTransparent = true;
          break;
        }
      }
    }
    if (!touchesTransparent) continue;
    const neutral = Math.max(red, blue);
    const excess = green - neutral;
    if (excess <= 12) continue;
    cleanedRaw[pixel + 1] = neutral;
    if (alpha < 150 && excess > 28) cleanedRaw[pixel + channelCount - 1] = Math.round(alpha * 0.7);
  }
}
const cleanedSourceBuffer = await sharp(cleanedRaw, {
  raw: { width: sourceInfo.width, height: sourceInfo.height, channels: channelCount },
}).png().toBuffer();

let left = sourceInfo.width;
let top = sourceInfo.height;
let right = -1;
let bottom = -1;
for (let y = 0; y < sourceInfo.height; y += 1) {
  for (let x = 0; x < sourceInfo.width; x += 1) {
    const alpha = sourceRaw[(y * sourceInfo.width + x) * sourceInfo.channels + sourceInfo.channels - 1];
    if (alpha > 18) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
}

if (right < left || bottom < top) throw new Error('Riku transformed source has no visible pixels');

const visibleSource = await sharp(cleanedSourceBuffer)
  .ensureAlpha()
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .png()
  .toBuffer();

const frameBuffers = await Promise.all(frameScales.map(async (scale, index) => {
  const resized = await sharp(visibleSource)
    .resize({ width: Math.round((right - left + 1) * scale), height: Math.round((bottom - top + 1) * scale) })
    .png()
    .toBuffer();
  const metadata = await sharp(resized).metadata();
  const frame = sharp({
    create: {
      width: cellSize,
      height: cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{
    input: resized,
    left: Math.round((cellSize - metadata.width) / 2) + frameOffsets[index].x,
    top: cellSize - metadata.height - 15 + frameOffsets[index].y,
  }]).png();
  return frame.toBuffer();
}));

await fs.mkdir(path.dirname(backupPath), { recursive: true });
try {
  await fs.access(backupPath);
} catch {
  await fs.copyFile(targetPath, backupPath);
}

const output = sharp({
  create: {
    width: cellSize * 2,
    height: cellSize * 2,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
}).composite(frameBuffers.map((input, index) => ({
  input,
  left: (index % 2) * cellSize,
  top: Math.floor(index / 2) * cellSize,
})));

await output.webp({ quality: 92, effort: 5, alphaQuality: 100 }).toFile(targetPath);
console.log(`Rebuilt ${path.relative(root, targetPath)} from ${path.relative(root, sourcePath)}`);
console.log(`Backup: ${path.relative(root, backupPath)}`);
