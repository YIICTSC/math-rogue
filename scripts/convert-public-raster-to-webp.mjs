import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicRoot = path.join(root, 'public');
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg']);
const skippedFiles = new Set(['apple-touch-icon.png']);

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(target));
    } else if (sourceExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(target);
    }
  }
  return files;
}

const files = await walk(publicRoot);
let converted = 0;
let skipped = 0;

for (const input of files) {
  const relative = path.relative(publicRoot, input).split(path.sep).join('/');
  if (skippedFiles.has(relative)) {
    skipped += 1;
    continue;
  }

  const output = input.replace(/\.(?:png|jpe?g)$/i, '.webp');
  try {
    await fs.access(output);
    skipped += 1;
    continue;
  } catch {
    // Generate only missing WebP siblings so the command is safe to resume.
  }

  await sharp(input)
    .webp({
      quality: 82,
      alphaQuality: 90,
      effort: 5,
      smartSubsample: true,
    })
    .toFile(output);
  converted += 1;
  console.log(`Converted ${relative}`);
}

console.log(`Converted ${converted} raster images to WebP; skipped ${skipped}.`);
