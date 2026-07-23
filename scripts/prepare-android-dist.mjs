import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const remoteAssetDirectories = [
  'banners',
  'bgm',
  'bgm-new',
  'card-illustrations',
  'enemy-illustrations',
  'event-illustrations',
  'map-symbols-commons',
  'sfx',
  'sprites',
  'ui',
];

await Promise.all(
  remoteAssetDirectories.map((relativePath) =>
    rm(path.join(distDir, relativePath), { recursive: true, force: true })
  )
);

async function directorySize(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? directorySize(target) : (await stat(target)).size;
    })
  );
  return sizes.reduce((total, size) => total + size, 0);
}

const remainingMiB = (await directorySize(distDir)) / 1024 / 1024;
console.log(
  `Android dist uses hosted media assets; local package size is ${remainingMiB.toFixed(1)} MiB.`
);
