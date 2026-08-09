import { createHash } from 'node:crypto';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSourceAsset } from './source-asset-exclusions.mjs';

const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'web-asset-manifest.json');
const runtimeExtensions = new Set([
  '.png', '.svg', '.ttf', '.otf', '.woff', '.woff2', '.webp',
  '.ogg',
]);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
};

const isAudioPath = (assetPath) => {
  const lowerPath = assetPath.toLowerCase();
  return lowerPath.startsWith('bgm/')
    || lowerPath.startsWith('bgm-new/')
    || lowerPath.startsWith('sfx/')
    || lowerPath.startsWith('web-audio/bgm/')
    || lowerPath.startsWith('web-audio/bgm-new/')
    || lowerPath.startsWith('web-audio/sfx/');
};

const getPack = (assetPath) => {
  const lowerPath = assetPath.toLowerCase();
  if (lowerPath.includes('magic')) return 'magic';
  if (lowerPath.includes('high-school')) return 'high-school';
  if (isAudioPath(assetPath)) return 'common';
  if (lowerPath.includes('/endings/elementary/') || lowerPath.includes('/elementary/')) return 'elementary';
  return 'common';
};

const filesOnDisk = await walk(publicDir);
const filePaths = filesOnDisk
  .map(filePath => ({
    filePath,
    path: path.relative(publicDir, filePath).split(path.sep).join('/').normalize('NFC'),
  }))
  .filter(file => runtimeExtensions.has(path.extname(file.path).toLowerCase()))
  .filter(file => !isSourceAsset(file.path));

const filePathSet = new Set(filePaths.map(file => file.path));
const preferredFiles = filePaths.filter(file => {
  const extension = path.extname(file.path).toLowerCase();
  if (extension !== '.png') return true;
  const webpPath = `${file.path.slice(0, -extension.length)}.webp`;
  return !filePathSet.has(webpPath);
});

const packs = {
  common: { id: 'common', totalBytes: 0, files: [] },
  elementary: { id: 'elementary', totalBytes: 0, files: [] },
  'high-school': { id: 'high-school', totalBytes: 0, files: [] },
  magic: { id: 'magic', totalBytes: 0, files: [] },
};

for (const file of preferredFiles) {
  const size = (await stat(file.filePath)).size;
  const pack = packs[getPack(file.path)];
  pack.totalBytes += size;
  pack.files.push({ path: file.path, size });
}

for (const pack of Object.values(packs)) {
  pack.files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
}

const contentHash = createHash('sha256');
for (const pack of Object.values(packs)) {
  contentHash.update(`${pack.id}:${pack.totalBytes}\n`);
  pack.files.forEach(file => contentHash.update(`${file.path}\0${file.size}\n`));
}

const manifest = {
  schemaVersion: 2,
  contentVersion: contentHash.digest('hex').slice(0, 16),
  packs,
};

await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
const totalMiB = Object.values(packs).reduce((sum, pack) => sum + pack.totalBytes, 0) / 1024 / 1024;
console.log(`Generated web asset pack manifest (${totalMiB.toFixed(1)} MiB).`);
