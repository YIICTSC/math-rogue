import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/endlessMode.ts');
const appPath = path.join(root, 'src/App.tsx');
const mapPath = path.join(root, 'src/services/mapGenerator.ts');
const mapScreenPath = path.join(root, 'src/components/MapScreen.tsx');
const restPath = path.join(root, 'src/components/RestScreen.tsx');
const floorResultPath = path.join(root, 'src/components/FloorResultScreen.tsx');
const clearPath = path.join(root, 'src/components/EndlessClearScreen.tsx');
const eventPath = path.join(root, 'src/services/eventService.ts');
const chapterResultsPath = path.join(root, 'src/data/endlessChapterResults.ts');
const data = fs.readFileSync(dataPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const map = fs.readFileSync(mapPath, 'utf8');
const mapScreen = fs.readFileSync(mapScreenPath, 'utf8');
const rest = fs.readFileSync(restPath, 'utf8');
const floorResult = fs.readFileSync(floorResultPath, 'utf8');
const clear = fs.readFileSync(clearPath, 'utf8');
const event = fs.readFileSync(eventPath, 'utf8');
const chapterResults = fs.readFileSync(chapterResultsPath, 'utf8');
const failures = [];

const bossRows = [...data.matchAll(/^\s*\['(elementary|high-school|magic)',\s*(\d+),\s*'(BOSS|MAJOR_BOSS)'/gm)]
  .map(match => ({ arc: match[1], floor: Number(match[2]), tier: match[3] }));
if (bossRows.length !== 30) failures.push(`expected 30 endless bosses, found ${bossRows.length}`);
for (const arc of ['elementary', 'high-school', 'magic']) {
  const floors = bossRows.filter(row => row.arc === arc).map(row => row.floor);
  const expected = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  if (expected.some(floor => !floors.includes(floor))) failures.push(`${arc} is missing a milestone floor`);
}

const chapterResultRows = [...chapterResults.matchAll(/^\s*chapter:\s*(\d+),/gm)].map(match => Number(match[1]));
if (chapterResultRows.length !== 50) failures.push(`expected 50 endless chapter results, found ${chapterResultRows.length}`);
if (new Set(chapterResultRows).size !== 50 || chapterResultRows.some((chapter, index) => chapter !== index + 1)) {
  failures.push('endless chapter results must cover chapters 1 through 50 exactly once');
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
  for (const band of ['01-10', '11-20', '21-30', '31-40', '41-50']) {
    const depthAsset = path.join(root, `public/sprites/backgrounds/learning-rogue/endless-${arc}-${band}.webp`);
    if (!fs.existsSync(depthAsset)) failures.push(`missing endless depth background: ${path.relative(root, depthAsset)}`);
  }
}

for (const [label, source, patterns] of [
  ['map generation', map, [/mapHeight\s*=\s*MAP_HEIGHT/, /endlessChapter/, /endlessBossChapter/, /endlessBossId/]],
  ['chapter transitions', app, [/endlessChapter: 1/, /currentNode\?\.y === MAP_HEIGHT - 1/, /const nextChapter = endlessChapter \+ 1/]],
  ['map depth backgrounds', mapScreen, [/endlessDepthBand/, /endless-\$\{visualTheme\}-\$\{endlessDepthBand\}/]],
  ['reward persistence', app, [/endlessRewardPending/, /endlessRunRewards/, /createEndlessRewardItems/, /handleEndlessRewardReroll/]],
  ['reward choice safety', data, [/boss\.floor === 50/, /selectedRewardIds/, /FALLBACK_CARD_UPGRADE/]],
  ['boss phase definitions', data, [/phaseCountByMechanic/, /phaseCount:/]],
  ['true endless boss generation', data, [/createTrueEndlessBoss/, /floor > 50 && floor % 5 === 0/]],
  ['boss reward flow', app, [/createEndlessRewardItems/, /endlessRewardPending/, /handleEndlessRewardReroll/]],
  ['major boss intermission', rest, [/endlessMajorBoss/, /onOpenShop/, /onOrganizeDeck/]],
  ['chapter result data', chapterResults, [/ENDLESS_CHAPTER_RESULTS/, /chapter:\s*50/, /getEndlessChapterResult/, /getTrueEndlessChapterResult/]],
  ['chapter result screen', floorResult, [/getEndlessChapterResult/, /getTrueEndlessChapterResult/, /isEndless/, /ENDLESS CHAPTER/]],
  ['endless clear screen', clear, [/ENDLESS MODE CLEARED/, /onReturnToTitle/, /onEnterTrueEndless/, /getEndlessChapterResult/]],
  ['true endless transition', app, [/ENDLESS_CLEAR/, /endlessTrueMode/, /nextChapter = 51/]],
  ['shared endless special events', event, [/(canSpawnSpecialBossEvent|shouldShowDodomedesuEvent)\s*=/, /if \(\s*isEndless/, /HIGH_SCHOOL_SUPPORTER_NPC_EVENTS/]],
  ['magic endless event routing', app, [/activeVisualTheme === 'magic' && !nextState\.isEndless/, /savedVisualTheme === 'magic' && !saved\.isEndless/]],
  ['chapter result transition', app, [/unlockedEndlessChapterCard/, /screen: GameScreen\.FLOOR_RESULT/, /体力が全回復した/]],
]) {
  for (const pattern of patterns) if (!pattern.test(source)) failures.push(`${label} is missing ${pattern}`);
}

if (failures.length) {
  console.error(`Endless implementation audit failed (${failures.length})`);
  console.error(failures.map(failure => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`Endless implementation audit passed: ${bossRows.length} bosses, WebP assets, reward persistence, and intermission choices verified.`);
