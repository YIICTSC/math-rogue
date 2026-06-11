import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;

const rootDir = path.resolve(import.meta.dirname, '..');
const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(rootDir, 'public');
const sourcePath = path.join(buildDir, 'icon-source-imagegen.png');

await mkdir(buildDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const source = await readFile(sourcePath);
const baseIcon = sharp(source).resize(256, 256, {
  fit: 'cover',
  kernel: sharp.kernel.nearest,
});

const iconSizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  iconSizes.map((iconSize) =>
    baseIcon
      .clone()
      .resize(iconSize, iconSize, {
        fit: 'cover',
        kernel: sharp.kernel.nearest,
      })
      .png()
      .toBuffer()
  )
);

await writeFile(path.join(buildDir, 'icon.png'), pngBuffers[pngBuffers.length - 1]);
await writeFile(path.join(buildDir, 'icon.ico'), await pngToIco(pngBuffers));
await writeFile(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[pngBuffers.length - 1]);
