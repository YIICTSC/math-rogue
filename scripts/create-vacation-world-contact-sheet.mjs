import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const output = path.join(root, 'docs', 'vacation-world-assets-contact-sheet.webp');
const manifestPath = path.join(root, 'docs', 'vacation-imagegen-manifest.json');
const tileWidth = 180;
const imageHeight = 124;
const labelHeight = 32;
const tileHeight = imageHeight + labelHeight;
const columns = 12;
const margin = 24;
const headerHeight = 42;
const titleHeight = 76;

const rel = (value) => value.replaceAll('/', path.sep);
const absolute = (value) => path.join(publicDir, rel(value));
const exists = (value) => fs.existsSync(absolute(value));
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const listFiles = (folder, predicate = () => true) => {
  const directory = absolute(folder);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && predicate(entry.name))
    .map(entry => `${folder}/${entry.name}`)
    .sort(naturalSort);
};

const listRecursive = (folder) => {
  const directory = absolute(folder);
  if (!fs.existsSync(directory)) return [];
  const result = [];
  const visit = (current, prefix) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => naturalSort(a.name, b.name))) {
      const currentRelative = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) visit(path.join(current, entry.name), currentRelative);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.webp')) result.push(currentRelative.replaceAll(path.sep, '/'));
    }
  };
  visit(directory, folder);
  return result.sort(naturalSort);
};

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const manifestFiles = manifest.assets
  .map(asset => asset.runtimePath.replace(/^public[\\/]/, '').replaceAll('\\\\', '/'))
  .filter(file => file.toLowerCase().endsWith('.webp'));
const listManifest = (prefix) => manifestFiles
  .filter(file => file.startsWith(prefix))
  .sort(naturalSort);

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const svg = (width, height, content) => Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`);

const section = (title, files, mode = 'sprite') => ({ title, files, mode });

const backgroundKeys = ['shop', 'treasure', 'rest', 'reward', 'event-base', 'act-clear', 'final-approach', 'challenge-select', 'challenge', 'start'];
const magicBackgroundKeys = ['shop', 'treasure', 'rest', 'reward', 'event-base', 'act-clear', 'final-bridge', 'challenge-select', 'challenge', 'start'];

const sections = [
  section('背景 / 高校編 (imagegen)', listManifest('sprites/backgrounds/learning-rogue/high-school-vacation-'), 'background'),
  section('背景 / マジック編 (imagegen)', listManifest('sprites/backgrounds/learning-rogue/magic-vacation-'), 'background'),
  section('敵 / 高校編 monster (imagegen)', listManifest('sprites/high-school/vacation-enemies/')),
  section('敵 / 高校編 humanoid idle (imagegen)', listManifest('sprites/high-school/vacation-humanoid-enemies/')),
  section('敵 / 高校編 humanoid attack (imagegen)', listManifest('sprites/high-school/vacation-humanoid-enemies-attack/')),
  section('敵 / 高校編 humanoid skill (imagegen)', listManifest('sprites/high-school/vacation-humanoid-enemies-skill/')),
  section('敵 / マジック編 monster (imagegen)', listManifest('sprites/magic/vacation-enemies/')),
  section('敵 / マジック編 humanoid idle (imagegen)', listManifest('sprites/magic/vacation-humanoid-enemies/')),
  section('敵 / マジック編 humanoid attack (imagegen)', listManifest('sprites/magic/vacation-humanoid-enemies-attack/')),
  section('敵 / マジック編 humanoid skill (imagegen)', listManifest('sprites/magic/vacation-humanoid-enemies-skill/')),
  section('特殊ボス (imagegen)', listManifest('sprites/high-school/vacation-bosses/').concat(listManifest('sprites/magic/vacation-bosses/'))),
  section('エンディング (imagegen)', listManifest('sprites/endings/')),
  section('恋愛イベント / SERA-LEON 修正版 (imagegen)', listManifest('sprites/magic/events/romance/vacation/SERA/LEON/')),
  section('エンドレス (imagegen)', listManifest('sprites/endless-')),
].map(group => ({ ...group, files: group.files.filter(exists) }))
  .filter(group => group.files.length > 0);

const allCount = sections.reduce((count, group) => count + group.files.length, 0);
const width = margin * 2 + columns * tileWidth;
const sectionHeights = sections.map(group => headerHeight + Math.ceil(group.files.length / columns) * tileHeight);
const height = titleHeight + margin + sectionHeights.reduce((sum, value) => sum + value, 0) + margin;

const layers = [
  { input: svg(width, titleHeight, `<rect width="100%" height="100%" fill="#020617"/><text x="${margin}" y="32" fill="#f8fafc" font-size="28" font-family="sans-serif" font-weight="700">Vacation World Assets — ${allCount} files</text><text x="${margin}" y="57" fill="#94a3b8" font-size="13" font-family="sans-serif">Imagegen-verified Vacation world, ending, and romance assets — review-only contact sheet</text>`), left: 0, top: 0 },
];

const tileBuffers = [];
for (const group of sections) {
  tileBuffers.push({ group, tiles: await Promise.all(group.files.map(async (file) => {
    const isBackground = group.mode === 'background';
    const source = await sharp(absolute(file))
      .resize(tileWidth, imageHeight, {
        fit: isBackground ? 'cover' : 'contain',
        position: 'centre',
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      })
      .png()
      .toBuffer();
    const label = file
      .replace(/^sprites\//, '')
      .replaceAll('vacation-', 'v-')
      .replaceAll('/', ' / ');
    const truncated = label.length > 31 ? `…${label.slice(-30)}` : label;
    const tile = await sharp({
      create: { width: tileWidth, height: tileHeight, channels: 4, background: '#0f172a' },
    })
      .composite([
        { input: source, left: 0, top: 0 },
        { input: svg(tileWidth, labelHeight, `<rect width="100%" height="100%" fill="#0f172a"/><text x="7" y="21" fill="#cbd5e1" font-size="10" font-family="monospace">${escapeXml(truncated)}</text>`) , left: 0, top: imageHeight },
      ])
      .png()
      .toBuffer();
    return tile;
  })) });
}

let top = titleHeight + margin;
for (const { group, tiles } of tileBuffers) {
  layers.push({
    input: svg(width - margin * 2, headerHeight, `<rect width="100%" height="100%" rx="8" fill="#1e293b"/><text x="14" y="27" fill="#fbbf24" font-size="16" font-family="sans-serif" font-weight="700">${escapeXml(group.title)} — ${group.files.length}</text>`),
    left: margin,
    top,
  });
  top += headerHeight;
  for (let index = 0; index < tiles.length; index += 1) {
    layers.push({
      input: tiles[index],
      left: margin + (index % columns) * tileWidth,
      top: top + Math.floor(index / columns) * tileHeight,
    });
  }
  top += Math.ceil(tiles.length / columns) * tileHeight;
}

fs.mkdirSync(path.dirname(output), { recursive: true });
await sharp({
  create: { width, height, channels: 4, background: '#020617' },
})
  .composite(layers)
  .webp({ quality: 84 })
  .toFile(output);

console.log(`Vacation world contact sheet created: ${path.relative(root, output)} (${width}x${height}, ${allCount} files)`);
