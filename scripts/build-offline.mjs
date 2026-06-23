import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

process.env.VITE_OFFLINE_DISTRIBUTABLE = 'true';

const distDir = path.resolve('dist');
await rm(distDir, { recursive: true, force: true });
await build();

const sourceAssetDirectories = [
  'sprites/high-school/sheets',
  'sprites/magic/generated-sources',
  'sprites/magic/sheets',
  'sprites/magic/cards/male-sheets',
  'sprites/magic/cards/sheets',
  'sprites/magic/events/character-sheets',
  'sprites/magic/events/friendship-male-sheets',
  'sprites/magic/events/romance-sheets',
  'sprites/magic/events/sheets',
];

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

await Promise.all(sourceAssetDirectories.map((relativePath) =>
  rm(path.join(distDir, relativePath), { recursive: true, force: true })
));

// WAV files are local production masters. Every shipped voice has an OGG equivalent.
// Markdown and text files under public are asset-production notes/manifests, not game data.
await removeFilesByExtension(distDir, new Set(['.wav', '.md', '.txt']));

const sizeAfterCleanup = await directorySize(distDir);
const removedMiB = (sizeBeforeCleanup - sizeAfterCleanup) / 1024 / 1024;
console.log(`Offline asset cleanup removed ${removedMiB.toFixed(1)} MiB.`);
