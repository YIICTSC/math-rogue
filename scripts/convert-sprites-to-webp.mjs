import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public', 'sprites');
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }
    if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = await walk(root);
let converted = 0;
let failed = 0;

for (const file of files) {
  const output = file.replace(/\.(png|jpe?g)$/i, '.webp');
  try {
    await sharp(file)
      .webp({
        quality: 82,
        alphaQuality: 90,
        effort: 5,
        smartSubsample: true,
      })
      .toFile(output);
    converted += 1;
  } catch (error) {
    failed += 1;
    console.error(`Failed to convert ${path.relative(process.cwd(), file)}:`, error);
  }
}

console.log(`Converted ${converted} sprite images to WebP.`);
if (failed > 0) {
  process.exitCode = 1;
}
