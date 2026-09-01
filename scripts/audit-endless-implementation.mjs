import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/endlessMode.ts');
const appPath = path.join(root, 'src/App.tsx');
const mapPath = path.join(root, 'src/services/mapGenerator.ts');
const mapScreenPath = path.join(root, 'src/components/MapScreen.tsx');
const restPath = path.join(root, 'src/components/RestScreen.tsx');
const data = fs.readFileSync(dataPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const map = fs.readFileSync(mapPath, 'utf8');
const mapScreen = fs.readFileSync(mapScreenPath, 'utf8');
const rest = fs.readFileSync(restPath, 'utf8');
const failures = [];

const bossRows = [...data.matchAll(/^\s*\['(elementary|high-school|magic)',\s*(\d+),\s*'(BOSS|MAJOR_BOSS)'/gm)]
  .map(match => ({ arc: match[1], floor: Number(match[2]), tier: match[3] }));
if (bossRows.length !== 30) failures.push(`expected 30 endless bosses, found ${bossRows.length}`);
for (const arc of ['elementary', 'high-school', 'magic']) {
  const floors = bossRows.filter(row => row.arc === arc).map(row => row.floor);
  const expected = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  if (expected.some(floor => !floors.includes(floor))) failures.push(`${arc} is missing a milestone floor`);
}

const assetRoot = path.join(root, 'public/sprites/endless-bosses');
for (const row of bossRows) {
  const arcDir = path.join(assetRoot, row.arc);
  const prefix = `${String(row.floor).padStart(2, '0')}-`;
  for (const action of ['idle', 'attack', 'skill']) {
    const asset = path.join(arcDir, `${prefix}${action}.webp`);
    if (!fs.existsSync(asset)) {
      failures.push(`missing WebP boss asset: ${path.relative(root, asset)}`);
      continue;
    }
    const header = fs.readFileSync(asset).subarray(0, 12).toString('ascii');
    if (!header.startsWith('RIFF') || header.slice(8, 12) !== 'WEBP') failures.push(`not a WebP asset: ${path.relative(root, asset)}`);
  }
}
for (const arc of ['elementary', 'high-school', 'magic']) {
  const asset = path.join(root, `public/sprites/backgrounds/learning-rogue/endless-${arc}.webp`);
  if (!fs.existsSync(asset)) failures.push(`missing endless map background: ${path.relative(root, asset)}`);
}

for (const [label, source, patterns] of [
  ['map generation', map, [/mapHeight\s*=\s*options\.endless\s*\?\s*50/, /endlessBossId/]],
  ['reward persistence', app, [/endlessRewardPending/, /endlessRunRewards/, /createEndlessRewardItems/, /handleEndlessRewardReroll/]],
  ['reward choice safety', data, [/boss\.floor === 50/, /selectedRewardIds/, /FALLBACK_CARD_UPGRADE/]],
  ['learning judgment hook', app, [/ENDLESS_LEARNING_SCREENS/, /applyEndlessLearningAnswer/, /subjectId/]],
  ['boss preview', mapScreen, [/nextBossDefinition\.weakness/, /recommendedPrep/]],
  ['major boss intermission', rest, [/endlessMajorBoss/, /onOpenShop/, /onOrganizeDeck/]],
]) {
  for (const pattern of patterns) if (!pattern.test(source)) failures.push(`${label} is missing ${pattern}`);
}

if (failures.length) {
  console.error(`Endless implementation audit failed (${failures.length})`);
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`Endless implementation audit passed: ${bossRows.length} bosses, WebP assets, persistence, learning hooks, previews, and intermission choices verified.`);
