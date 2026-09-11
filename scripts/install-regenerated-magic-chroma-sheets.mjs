import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = process.cwd();
const generatedRoot = 'C:/Users/myfav/.codex/generated_images/01a078a5-0e8f-7f21-800a-6f63f3c47e47';
const backupRoot = path.join(repoRoot, 'tmp', 'repaired-magic-chroma-sheets-20260911');

const replacements = [
  ['exec-8e8d869c-f31f-47bb-9645-b1a9717de8cc.png', 'public/sprites/magic/characters-attack-sheets/heroine-08-after.webp'],
  ['exec-295164de-3182-4b77-935a-5987efcc1e69.png', 'public/sprites/magic/characters-skill-sheets/heroine-08-after.webp'],
  ['exec-f8571e0c-ed16-4609-b77c-37c6b41a4cf5.png', 'public/sprites/magic/characters-attack-sheets/heroine-08-before.webp'],
  ['exec-136c25cd-b80c-48b5-8fa4-89cb060251f1.png', 'public/sprites/magic/characters-skill-sheets/heroine-08-before.webp'],
  ['exec-d99de0b6-8934-44c2-8ef3-19cba117a107.png', 'public/sprites/magic/male-characters-idle-special-sheets/sakuya-after.webp'],
  ['exec-35ffb30f-1440-45eb-84f0-410babdfbcb0.png', 'public/sprites/magic/male-characters-attack-sheets/elliot-after.webp'],
  ['exec-7ec87b81-5346-4f13-a90e-31792e507dd4.png', 'public/sprites/magic/male-characters-idle-special-sheets/leon-after.webp'],
  ['exec-f3a9b8ff-8d6d-4cc6-9ba4-501090dd012d.png', 'public/sprites/magic/male-characters-idle-sheets/riku-after.webp'],
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function estimateKeyColor(data, info) {
  const patchSize = Math.min(32, Math.floor(Math.min(info.width, info.height) / 8));
  const samples = [];
  const corners = [
    [0, 0],
    [info.width - patchSize, 0],
    [0, info.height - patchSize],
    [info.width - patchSize, info.height - patchSize],
  ];
  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + patchSize; y += 1) {
      for (let x = startX; x < startX + patchSize; x += 1) {
        const index = (y * info.width + x) * info.channels;
        samples.push([data[index], data[index + 1], data[index + 2]]);
      }
    }
  }
  return samples.reduce(
    (sum, pixel) => sum.map((value, index) => value + pixel[index]),
    [0, 0, 0],
  ).map((value) => value / samples.length);
}

function removeChromaKey(inputPath) {
  return sharp(inputPath).raw().toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
    if (info.channels < 3) throw new Error(`Expected RGB input: ${inputPath}`);
    const key = estimateKeyColor(data, info);
    const rgba = Buffer.alloc(info.width * info.height * 4);
    const coreThreshold = 28;
    const edgeThreshold = 82;

    for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
      const source = pixel * info.channels;
      const target = pixel * 4;
      const red = data[source];
      const green = data[source + 1];
      const blue = data[source + 2];
      const distance = Math.hypot(red - key[0], green - key[1], blue - key[2]);
      const alpha = distance <= coreThreshold
        ? 0
        : distance >= edgeThreshold
          ? 255
          : Math.round(((distance - coreThreshold) / (edgeThreshold - coreThreshold)) * 255);

      rgba[target] = alpha === 0 ? 0 : red;
      rgba[target + 1] = alpha === 0 ? 0 : green;
      rgba[target + 2] = alpha === 0 ? 0 : blue;
      rgba[target + 3] = alpha;

      if (alpha > 0 && alpha < 255) {
        const normalizedAlpha = alpha / 255;
        rgba[target] = clamp(Math.round((red - key[0] * (1 - normalizedAlpha)) / normalizedAlpha), 0, 255);
        rgba[target + 1] = clamp(Math.round((green - key[1] * (1 - normalizedAlpha)) / normalizedAlpha), 0, 255);
        rgba[target + 2] = clamp(Math.round((blue - key[2] * (1 - normalizedAlpha)) / normalizedAlpha), 0, 255);
      }
    }

    return {
      image: sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }),
      key,
    };
  });
}

await fs.mkdir(backupRoot, { recursive: true });

for (const [generatedName, targetRelative] of replacements) {
  const generatedPath = path.join(generatedRoot, generatedName);
  const targetPath = path.join(repoRoot, targetRelative);
  const backupPath = path.join(backupRoot, path.basename(targetRelative));
  if (!(await fs.stat(backupPath).catch(() => null))) {
    await fs.copyFile(targetPath, backupPath);
  }

  const { image, key } = await removeChromaKey(generatedPath);
  await image.webp({ quality: 92, alphaQuality: 100, smartSubsample: true }).toFile(targetPath);
  const metadata = await sharp(targetPath).metadata();
  if (metadata.width !== 1254 || metadata.height !== 1254 || metadata.hasAlpha !== true || metadata.format !== 'webp') {
    throw new Error(`Unexpected output metadata for ${targetRelative}: ${JSON.stringify(metadata)}`);
  }
  console.log(`${targetRelative}: ${metadata.width}x${metadata.height} ${metadata.format} alpha=${metadata.hasAlpha} key=${key.map((value) => Math.round(value)).join(',')}`);
}

console.log(`Backups: ${backupRoot}`);
