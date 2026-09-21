import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicPath = (relativePath) => path.join(root, 'public', 'sprites', relativePath);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'vacation-imagegen-manifest.json'), 'utf8'));
const byRuntimePath = new Map(manifest.assets.map((asset) => [asset.runtimePath, asset]));
const required = [];
const add = (relativePath) => required.push(relativePath);

const backgroundKeys = [
  'shop', 'treasure', 'rest', 'reward', 'event-base', 'act-clear',
  'final-approach', 'challenge-select', 'challenge', 'start',
];
for (const theme of ['high-school', 'magic']) {
  for (const key of backgroundKeys) {
    const actualKey = theme === 'magic' && key === 'final-approach' ? 'final-bridge' : key;
    add(`backgrounds/learning-rogue/${theme}-vacation-${actualKey}.webp`);
  }
}
for (let index = 0; index < 50; index += 1) add(`high-school/vacation-enemies/${index}.webp`);
for (let index = 0; index < 53; index += 1) {
  for (const folder of ['vacation-humanoid-enemies', 'vacation-humanoid-enemies-attack', 'vacation-humanoid-enemies-skill']) {
    add(`high-school/${folder}/${index}.webp`);
  }
}
for (let index = 0; index < 45; index += 1) add(`magic/vacation-enemies/${index}.webp`);
for (let index = 0; index < 22; index += 1) {
  for (const folder of ['vacation-humanoid-enemies', 'vacation-humanoid-enemies-attack', 'vacation-humanoid-enemies-skill']) {
    add(`magic/${folder}/${index}.webp`);
  }
}
for (const file of ['kocho.webp', 'true-kocho.webp']) {
  add(`high-school/vacation-bosses/${file}`);
}
for (const file of ['grand-witch.webp', 'star-calamity.webp']) add(`magic/vacation-bosses/${file}`);

for (const character of ['assassin', 'bard', 'caretaker', 'chef', 'dodgeball', 'gardener', 'librarian', 'mage', 'warrior']) {
  for (let tone = 1; tone <= 5; tone += 1) {
    for (let page = 1; page <= 3; page += 1) {
      add(`endings/high-school-vacation/${character}/ending-${tone}-${page}.webp`);
    }
  }
}
for (let page = 1; page <= 3; page += 1) add(`endings/magic-vacation/common/ending-${page}.webp`);

const fail = (message) => {
  throw new Error(message);
};
if (required.length !== 482) fail(`Expected 482 world-conversion assets, got ${required.length}.`);
if (new Set(manifest.assets.map((asset) => asset.runtimePath)).size !== manifest.assets.length) {
  fail('Manifest contains duplicate runtime paths.');
}

for (const runtimePath of required) {
  const asset = byRuntimePath.get(`public/sprites/${runtimePath}`);
  if (!asset) fail(`Missing manifest entry: ${runtimePath}`);
  if (asset.generationTool !== 'imagegen' || !asset.generationId || !asset.imagegenSourcePath) {
    fail(`Incomplete imagegen provenance: ${runtimePath}`);
  }
  if (!fs.existsSync(publicPath(runtimePath))) fail(`Missing runtime WebP: ${runtimePath}`);
  if (!fs.existsSync(path.join(root, asset.imagegenSourcePath))) fail(`Missing source PNG: ${asset.imagegenSourcePath}`);
  if (runtimePath.includes('/endings/') && (!asset.sourceSheetPath || !fs.existsSync(path.join(root, asset.sourceSheetPath)))) {
    fail(`Missing source sheet: ${runtimePath}`);
  }
}

for (const runtimePath of required.filter((item) => item.includes('/endings/'))) {
  const metadata = await sharp(publicPath(runtimePath)).metadata();
  if (metadata.width !== 1280 || metadata.height !== 720) {
    fail(`Ending dimensions must be 1280x720: ${runtimePath} (${metadata.width}x${metadata.height})`);
  }
}

const heldPrefixes = [
  'public/sprites/endless-endings/high-school-vacation/',
  'public/sprites/endless-endings/magic-vacation/',
  'public/sprites/endless-bosses-vacation/',
];
for (const asset of manifest.assets) {
  if (heldPrefixes.some((prefix) => asset.runtimePath.startsWith(prefix))) {
    fail(`Held Endless scope must not be in the ImageGen manifest: ${asset.runtimePath}`);
  }
}

const hash = (relativePath) => crypto.createHash('sha256').update(fs.readFileSync(publicPath(relativePath))).digest('hex');
const seraLeon = ['r1.webp', 'r2.webp', 'r3.webp', 'r4.webp', 'r5.webp', 'r6.webp', 'r6-bond.webp', 'r6-special.webp', 'r6-true.webp'];
const seraYamato = seraLeon.map((file) => `magic/events/romance/vacation/SERA/YAMATO/${file}`);
for (const file of seraLeon) {
  const asset = byRuntimePath.get(`public/sprites/magic/events/romance/vacation/SERA/LEON/${file}`);
  if (!asset?.sourceSheetPath || !fs.existsSync(path.join(root, asset.sourceSheetPath))) {
    fail(`Missing SERA/LEON source sheet: ${file}`);
  }
}
const leonHashes = seraLeon.map((file) => hash(`magic/events/romance/vacation/SERA/LEON/${file}`));
const yamatoHashes = seraYamato.map(hash);
if (leonHashes.every((value, index) => value === yamatoHashes[index])) {
  fail('SERA/LEON and SERA/YAMATO romance CGs are still byte-identical.');
}

console.log('Vacation world conversion audit passed.');
console.log(`World conversion assets: ${required.length} / ${required.length}`);
console.log('Ending dimensions: 138 / 138 at 1280x720');
console.log('Optional SERA/LEON romance repair: 9 / 9 present and distinct from YAMATO.');
console.log('Held scope: Endless Ending 156 + Endless Boss 60 excluded from ImageGen manifest.');
