import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSourceAsset } from './source-asset-exclusions.mjs';

const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'android-asset-pack-manifest.json');
const generatedModulePath = path.resolve('src/generated/androidAssetPackVersions.ts');
const hostedBaseUrl = 'https://yiictsc.github.io/math-rogue/';
const runtimeExtensions = new Set(['.mp3', '.ogg', '.png', '.svg', '.ttf', '.webp']);

const getLocalFileName = (assetPath) => {
  assetPath = assetPath.normalize('NFC');
  let first = 2166136261;
  let second = 2246822507;
  for (let index = 0; index < assetPath.length; index += 1) {
    const code = assetPath.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619) >>> 0;
    second = Math.imul(second ^ code, 3266489909) >>> 0;
  }
  const extension = path.extname(assetPath).toLowerCase();
  return `${first.toString(36)}${second.toString(36)}${extension}`;
};

const packDefinitions = {
  'visual-elementary': {
    label: '基本映像',
    description: '小学校テーマ、カード、敵、背景、ミニゲームの画像',
    kind: 'visual',
    theme: 'elementary',
  },
  'visual-high-school': {
    label: '高校映像',
    description: '高校テーマのキャラクター、敵、背景、イベント画像',
    kind: 'visual',
    theme: 'high-school',
  },
  'visual-magic': {
    label: '魔法映像',
    description: '魔法テーマのキャラクター、敵、背景、イベント画像',
    kind: 'visual',
    theme: 'magic',
  },
  'audio-common': {
    label: '共通音声',
    description: '基本BGM、効果音、英語音声、ミニゲーム音声',
    kind: 'audio',
    theme: 'elementary',
  },
  'audio-high-school': {
    label: '高校音声',
    description: '高校テーマ専用のBGMとボイス',
    kind: 'audio',
    theme: 'high-school',
  },
  'audio-magic': {
    label: '魔法音声',
    description: '魔法テーマ専用のBGM、ボイス、イベント音声',
    kind: 'audio',
    theme: 'magic',
  },
};

const isAudioPath = (relativePath) =>
  relativePath.startsWith('bgm/')
  || relativePath.startsWith('bgm-new/')
  || relativePath.startsWith('sfx/');

const getPackId = (relativePath) => {
  const lower = relativePath.toLowerCase();
  const theme = lower.includes('magic')
    ? 'magic'
    : lower.includes('high-school')
      ? 'high-school'
      : 'elementary';
  if (isAudioPath(relativePath)) {
    return theme === 'elementary' ? 'audio-common' : `audio-${theme}`;
  }
  return `visual-${theme}`;
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
};

const hashFile = (filePath) => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  stream.on('error', reject);
  stream.on('data', chunk => hash.update(chunk));
  stream.on('end', () => resolve(hash.digest('hex')));
});

const discoveredFiles = (await walk(publicDir))
  .filter(filePath => runtimeExtensions.has(path.extname(filePath).toLowerCase()))
  .filter(filePath => !filePath.endsWith('-source.webp'))
  .map(filePath => ({
    filePath,
    path: path.relative(publicDir, filePath).split(path.sep).join('/').normalize('NFC'),
  }))
  .filter(file => file.path.includes('/'))
  .filter(file => !isSourceAsset(file.path));

// Git can contain canonically equivalent Unicode filenames (for example an
// NFC name and the same Japanese name expressed as NFD). macOS presents those
// as one file, while the Linux CI runner checks out both. Runtime lookups are
// NFC-normalized, so keep one manifest entry for each normalized asset path.
const files = [...new Map(
  discoveredFiles
    .filter(file => !file.path.startsWith('web-audio/'))
    .map(file => [file.path, file])
).values()];

const packs = Object.fromEntries(Object.entries(packDefinitions).map(([id, definition]) => [
  id,
  { id, ...definition, version: '', totalBytes: 0, files: [] },
]));

for (const file of files) {
  const fileStat = await stat(file.filePath);
  const sha256 = await hashFile(file.filePath);
  const pack = packs[getPackId(file.path)];
  pack.totalBytes += fileStat.size;
  pack.files.push({ path: file.path, size: fileStat.size, sha256 });
}

for (const pack of Object.values(packs)) {
  pack.files.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const localNames = new Set();
  const hash = createHash('sha256');
  pack.files.forEach(file => {
    const localName = getLocalFileName(file.path);
    if (localNames.has(localName)) throw new Error(`Asset filename collision in ${pack.id}: ${file.path}`);
    localNames.add(localName);
    hash.update(`${file.path}\0${file.size}\0${file.sha256}\n`);
  });
  pack.version = hash.digest('hex').slice(0, 16);
}

const contentVersion = createHash('sha256')
  .update(Object.values(packs).map(pack => `${pack.id}:${pack.version}`).join('\n'))
  .digest('hex')
  .slice(0, 16);

const manifest = {
  schemaVersion: 1,
  hostedBaseUrl,
  contentVersion,
  packs,
};

await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
await mkdir(path.dirname(generatedModulePath), { recursive: true });
await writeFile(
  generatedModulePath,
  `// Generated by scripts/generate-android-asset-manifest.mjs. Do not edit.\n`
  + `export const ANDROID_ASSET_PACK_VERSIONS = ${JSON.stringify(
    Object.fromEntries(Object.values(packs).map(pack => [pack.id, pack.version])),
    null,
    2,
  )} as const;\n`
);

const totalMiB = Object.values(packs).reduce((sum, pack) => sum + pack.totalBytes, 0) / 1024 / 1024;
console.log(`Generated ${Object.keys(packs).length} Android asset packs (${totalMiB.toFixed(1)} MiB).`);
