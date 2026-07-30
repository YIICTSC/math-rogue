import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(rootDir, 'build', 'icon-source-imagegen.png');
const socialCardPath = path.join(rootDir, 'docs', 'images', 'learning-rogue-social-card.png');
const resourceDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
const playAssetDir = path.join(rootDir, 'build', 'google-play');
const playScreenshotDir = path.join(playAssetDir, 'screenshots');
const source = await readFile(sourcePath);

const densities = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 },
};

const splashSizes = {
  'drawable/splash.png': [480, 320],
  'drawable-land-mdpi/splash.png': [480, 320],
  'drawable-land-hdpi/splash.png': [800, 480],
  'drawable-land-xhdpi/splash.png': [1280, 720],
  'drawable-land-xxhdpi/splash.png': [1600, 960],
  'drawable-land-xxxhdpi/splash.png': [1920, 1280],
  'drawable-port-mdpi/splash.png': [320, 480],
  'drawable-port-hdpi/splash.png': [480, 800],
  'drawable-port-xhdpi/splash.png': [720, 1280],
  'drawable-port-xxhdpi/splash.png': [960, 1600],
  'drawable-port-xxxhdpi/splash.png': [1280, 1920],
};

await Promise.all(
  Object.entries(densities).flatMap(([density, sizes]) => {
    const targetDir = path.join(resourceDir, `mipmap-${density}`);
    return [
      mkdir(targetDir, { recursive: true }),
      sharp(source)
        .resize(sizes.launcher, sizes.launcher, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher.png')),
      sharp(source)
        .resize(sizes.launcher, sizes.launcher, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_round.png')),
      sharp(source)
        .resize(sizes.foreground, sizes.foreground, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_foreground.png')),
    ];
  })
);

await Promise.all(
  Object.entries(splashSizes).map(async ([relativePath, [width, height]]) => {
    const targetPath = path.join(resourceDir, relativePath);
    const iconSize = Math.round(Math.min(width, height) * 0.42);
    const icon = await sharp(source)
      .resize(iconSize, iconSize, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
    await mkdir(path.dirname(targetPath), { recursive: true });
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: '#000000',
      },
    })
      .composite([{ input: icon, gravity: 'center' }])
      .png()
      .toFile(targetPath);
  })
);

await mkdir(playAssetDir, { recursive: true });
await sharp(source)
  .resize(512, 512, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(path.join(playAssetDir, 'icon-512.png'));

const socialMetadata = await sharp(socialCardPath).metadata();
if (!socialMetadata.width || !socialMetadata.height) {
  throw new Error('Unable to read social card dimensions.');
}
const targetAspect = 1024 / 500;
const cropHeight = Math.floor(socialMetadata.width / targetAspect);
const top = Math.max(0, Math.floor((socialMetadata.height - cropHeight) / 2));
await sharp(socialCardPath)
  .extract({
    left: 0,
    top,
    width: socialMetadata.width,
    height: Math.min(cropHeight, socialMetadata.height),
  })
  .resize(1024, 500, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(path.join(playAssetDir, 'feature-graphic-1024x500.png'));

const playScreenshots = [
  ['03-adventure-map.jpg', '01-adventure-map.jpg'],
  ['04-card-battle.jpg', '02-card-battle.jpg'],
  ['05-learning-quiz.jpg', '03-learning-quiz.jpg'],
  ['06-card-battle.jpg', '04-card-battle.jpg'],
  ['07-learning-quiz.jpg', '05-learning-quiz.jpg'],
];
await mkdir(playScreenshotDir, { recursive: true });
await Promise.all(
  playScreenshots.map(([sourceName, targetName]) =>
    copyFile(
      path.join(rootDir, 'release', 'steam', 'store-assets', 'screenshots', sourceName),
      path.join(playScreenshotDir, targetName),
    ).catch(async (error) => {
      if (error.code !== 'ENOENT') throw error;
      // Store screenshots are checked in so clean clones can regenerate icons
      // before a fresh Steam screenshot capture has been prepared.
      await readFile(path.join(playScreenshotDir, targetName));
    }),
  ),
);

await writeFile(
  path.join(playAssetDir, 'README.txt'),
  [
    'Google Play listing assets generated from the approved 学習ローグ icon and social card.',
    '',
    'icon-512.png',
    '  Google Play app icon, 512 x 512 px, RGB PNG',
    '',
    'feature-graphic-1024x500.png',
    '  Google Play feature graphic, 1024 x 500 px, RGB PNG',
    '',
    'screenshots/01-adventure-map.jpg ... 05-learning-quiz.jpg',
    '  Actual gameplay screenshots, 1920 x 1080 px.',
    '  Upload the set to phone, 7-inch tablet, and 10-inch tablet listings.',
    '',
    'Store copy, data-safety draft, and release checklist:',
    '  ../../docs/google-play-release.md',
    '',
  ].join('\n'),
);

console.log('Generated Android launcher icons and Google Play listing graphics.');
