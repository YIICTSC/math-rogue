import { createHash } from 'node:crypto';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSourceAsset } from './source-asset-exclusions.mjs';

const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'web-asset-manifest.json');
const runtimeExtensions = new Set(['.png', '.svg', '.ttf', '.otf', '.woff', '.woff2', '.webp']);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
};

const getTheme = (assetPath) => {
  const lowerPath = assetPath.toLowerCase();
  if (lowerPath.includes('magic')) return 'magic';
  if (lowerPath.includes('high-school')) return 'high-school';
  return 'elementary';
};

const filesOnDisk = await walk(publicDir);
const filePaths = filesOnDisk
  .map(filePath => ({
    filePath,
    path: path.relative(publicDir, filePath).split(path.sep).join('/').normalize('NFC'),
  }))
  .filter(file => runtimeExtensions.has(path.extname(file.path).toLowerCase()))
  .filter(file => !file.path.startsWith('web-audio/'))
  .filter(file => !file.path.startsWith('bgm/'))
  .filter(file => !file.path.startsWith('bgm-new/'))
  .filter(file => !file.path.startsWith('sfx/'))
  .filter(file => !isSourceAsset(file.path));

const filePathSet = new Set(filePaths.map(file => file.path));
const preferredFiles = filePaths.filter(file => {
  const extension = path.extname(file.path).toLowerCase();
  if (extension !== '.png') return true;
  const webpPath = `${file.path.slice(0, -extension.length)}.webp`;
  return !filePathSet.has(webpPath);
});

const themes = {
  elementary: { id: 'elementary', totalBytes: 0, files: [] },
  'high-school': { id: 'high-school', totalBytes: 0, files: [] },
  magic: { id: 'magic', totalBytes: 0, files: [] },
};

for (const file of preferredFiles) {
  const size = (await stat(file.filePath)).size;
  const theme = themes[getTheme(file.path)];
  theme.totalBytes += size;
  theme.files.push({ path: file.path, size });
}

for (const theme of Object.values(themes)) {
  theme.files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
}

const contentHash = createHash('sha256');
for (const theme of Object.values(themes)) {
  contentHash.update(`${theme.id}:${theme.totalBytes}\n`);
  theme.files.forEach(file => contentHash.update(`${file.path}\0${file.size}\n`));
}

const manifest = {
  schemaVersion: 1,
  contentVersion: contentHash.digest('hex').slice(0, 16),
  themes,
};

await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
const totalMiB = Object.values(themes).reduce((sum, theme) => sum + theme.totalBytes, 0) / 1024 / 1024;
console.log(`Generated web visual asset manifest (${totalMiB.toFixed(1)} MiB).`);
