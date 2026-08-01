import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { sourceAssetDirectories, sourceAssetFiles } from './source-asset-exclusions.mjs';

const distDir = path.resolve('dist');

async function removeFilesByExtension(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeFilesByExtension(target, extensions);
    } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
      await rm(target);
    }
  }));
}

async function directorySize(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sizes = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? directorySize(target) : (await stat(target)).size;
  }));
  return sizes.reduce((total, size) => total + size, 0);
}

const sizeBeforeCleanup = await directorySize(distDir);

await Promise.all([
  ...sourceAssetDirectories.map(relativePath =>
    rm(path.join(distDir, relativePath), { recursive: true, force: true })
  ),
  ...sourceAssetFiles.map(relativePath =>
    rm(path.join(distDir, relativePath), { force: true })
  ),
]);

// WAV files are local production masters. Every shipped voice has an OGG equivalent.
// Markdown and text files under public are asset-production notes/manifests, not game data.
await removeFilesByExtension(distDir, new Set(['.wav', '.md', '.txt']));

const sizeAfterCleanup = await directorySize(distDir);
const removedMiB = (sizeBeforeCleanup - sizeAfterCleanup) / 1024 / 1024;
console.log(`Asset cleanup removed ${removedMiB.toFixed(1)} MiB from dist.`);
