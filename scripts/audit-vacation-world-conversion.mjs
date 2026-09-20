import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const exists = relativePath => fs.existsSync(path.join(publicDir, relativePath));
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const listWebp = relativeDir => {
  const absoluteDir = path.join(publicDir, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  return fs.readdirSync(absoluteDir).filter(name => name.endsWith('.webp'));
};
const assertIndexedSet = (relativeDir, count) => {
  const files = new Set(listWebp(relativeDir));
  assert(files.size === count, `${relativeDir} expected ${count} files, got ${files.size}`);
  for (let index = 0; index < count; index += 1) {
    assert(files.has(`${index}.webp`), `${relativeDir} is missing ${index}.webp`);
  }
};

const environmentAssets = [
  'high-school-vacation-shop.webp',
  'magic-vacation-shop.webp',
  'high-school-vacation-treasure.webp',
  'magic-vacation-treasure.webp',
  'high-school-vacation-rest.webp',
  'magic-vacation-rest.webp',
  'high-school-vacation-reward.webp',
  'magic-vacation-reward.webp',
  'high-school-vacation-event-base.webp',
  'magic-vacation-event-base.webp',
  'high-school-vacation-act-clear.webp',
  'magic-vacation-act-clear.webp',
  'high-school-vacation-final-approach.webp',
  'magic-vacation-final-bridge.webp',
  'high-school-vacation-challenge-select.webp',
  'high-school-vacation-challenge.webp',
  'magic-vacation-challenge-select.webp',
  'magic-vacation-challenge.webp',
  'high-school-vacation-start.webp',
  'magic-vacation-start.webp',
];

for (const asset of environmentAssets) {
  assert(exists(`sprites/backgrounds/learning-rogue/${asset}`), `Missing Vacation environment asset: ${asset}`);
}

assertIndexedSet('sprites/high-school/vacation-enemies', 50);
assertIndexedSet('sprites/high-school/vacation-humanoid-enemies', 53);
assertIndexedSet('sprites/high-school/vacation-humanoid-enemies-attack', 53);
assertIndexedSet('sprites/high-school/vacation-humanoid-enemies-skill', 53);
assertIndexedSet('sprites/magic/vacation-enemies', 45);
assertIndexedSet('sprites/magic/vacation-humanoid-enemies', 22);
assertIndexedSet('sprites/magic/vacation-humanoid-enemies-attack', 22);
assertIndexedSet('sprites/magic/vacation-humanoid-enemies-skill', 22);

const specialAssets = [
  'sprites/high-school/vacation-bosses/azuki-idle.webp',
  'sprites/high-school/vacation-bosses/azuki-pounce.webp',
  'sprites/high-school/vacation-bosses/azuki-howl.webp',
  'sprites/high-school/vacation-bosses/dodomedesu.webp',
  'sprites/high-school/vacation-bosses/genzo.webp',
  'sprites/high-school/vacation-bosses/kocho.webp',
  'sprites/high-school/vacation-bosses/true-kocho.webp',
  'sprites/magic/vacation-bosses/grand-witch.webp',
  'sprites/magic/vacation-bosses/star-calamity.webp',
];
for (const asset of specialAssets) assert(exists(asset), `Missing Vacation special boss asset: ${asset}`);

const highSchoolCharacters = ['assassin', 'bard', 'caretaker', 'chef', 'dodgeball', 'gardener', 'librarian', 'mage', 'warrior'];
for (const character of highSchoolCharacters) {
  for (let ending = 1; ending <= 5; ending += 1) {
    for (let page = 1; page <= 3; page += 1) {
      assert(exists(`sprites/endings/high-school-vacation/${character}/ending-${ending}-${page}.webp`), `Missing high-school Vacation ending: ${character}/${ending}-${page}`);
    }
  }
}
for (let page = 1; page <= 3; page += 1) {
  assert(exists(`sprites/endings/magic-vacation/common/ending-${page}.webp`), `Missing Magic Vacation common ending page ${page}`);
}

for (const character of highSchoolCharacters) {
  for (const kind of ['opening', 'true']) {
    for (let page = 1; page <= 3; page += 1) {
      assert(exists(`sprites/endless-endings/high-school-vacation/${character}/${kind}-${page}.webp`), `Missing high-school Vacation endless art: ${character}/${kind}-${page}`);
    }
  }
}
for (const character of ['ren', 'soma', 'minato', 'riku', 'yamato', 'leon', 'elliot', 'sakuya']) {
  for (const kind of ['opening', 'true']) {
    for (let page = 1; page <= 3; page += 1) {
      assert(exists(`sprites/endless-endings/magic-vacation/male/${character}/${kind}-${page}.webp`), `Missing male Magic Vacation endless art: ${character}/${kind}-${page}`);
    }
  }
}
for (const character of highSchoolCharacters) {
  for (const kind of ['opening', 'true']) {
    for (let page = 1; page <= 3; page += 1) {
      assert(exists(`sprites/endless-endings/magic-vacation/${character}/${kind}-${page}.webp`), `Missing female Magic Vacation endless art: ${character}/${kind}-${page}`);
    }
  }
}
for (const arc of ['high-school', 'magic']) {
  for (let floor = 5; floor <= 50; floor += 5) {
    for (const action of ['idle', 'attack', 'skill']) {
      assert(exists(`sprites/endless-bosses-vacation/${arc}/${String(floor).padStart(2, '0')}-${action}.webp`), `Missing Vacation endless boss: ${arc}/${floor}/${action}`);
    }
  }
}

const server = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const env = await server.ssrLoadModule('/src/data/vacationEnvironmentAssets.ts');
  const themes = await server.ssrLoadModule('/src/data/visualThemes.ts');
  const hsStories = await server.ssrLoadModule('/src/data/highSchoolVacationStories.ts');
  const hsStandardStories = await server.ssrLoadModule('/src/data/highSchoolStories.ts');
  const magicStories = await server.ssrLoadModule('/src/data/magicVacationStories.ts');
  const magicStandardStories = await server.ssrLoadModule('/src/data/magicStories.ts');
  const endless = await server.ssrLoadModule('/src/data/endlessEndingSequences.ts');
  const themedEndings = await server.ssrLoadModule('/src/data/themedEndingSequences.ts');

  const requiredEnvironmentKeys = ['shop', 'treasure', 'rest', 'reward', 'event', 'actClear', 'finalBridge', 'challengeSelect', 'challenge', 'start'];
  assert(env.VACATION_ENVIRONMENT_ASSET_PATHS.length === 20, 'Vacation environment manifest must contain exactly 20 screen assets.');
  for (const key of requiredEnvironmentKeys) {
    const hsStandard = env.getEnvironmentBackgroundPath('high-school', key, 'STANDARD');
    const hsVacation = env.getEnvironmentBackgroundPath('high-school', key, 'VACATION');
    const magicStandard = env.getEnvironmentBackgroundPath('magic', key, 'STANDARD');
    const magicVacation = env.getEnvironmentBackgroundPath('magic', key, 'VACATION');
    assert(!hsStandard.includes('vacation'), `STANDARD high-school path leaked Vacation for ${key}: ${hsStandard}`);
    assert(!magicStandard.includes('vacation'), `STANDARD magic path leaked Vacation for ${key}: ${magicStandard}`);
    assert(hsVacation.includes('vacation'), `VACATION high-school path did not select Vacation for ${key}: ${hsVacation}`);
    assert(magicVacation.includes('vacation'), `VACATION magic path did not select Vacation for ${key}: ${magicVacation}`);
  }

  assert(hsStories.HIGH_SCHOOL_VACATION_STORIES.length === 30, 'High-school Vacation story count must remain 30.');
  assert(magicStories.MAGIC_VACATION_STORIES.length === 30, 'Magic Vacation story count must remain 30.');
  assert(hsStories.HIGH_SCHOOL_VACATION_STORIES.every((story, index) => story.id === hsStandardStories.HIGH_SCHOOL_STORIES[index]?.id && story.parts.length === 3), 'High-school Vacation story IDs/parts diverged from the standard progression.');
  assert(magicStories.MAGIC_VACATION_STORIES.every((story, index) => story.id === magicStandardStories.MAGIC_STORIES[index]?.id && story.parts.length === 3), 'Magic Vacation story IDs/parts diverged from the standard progression.');

  const sampleMonster = themes.HIGH_SCHOOL_ENEMY_VARIANTS[0];
  const sampleHumanoid = themes.HIGH_SCHOOL_HUMANOID_ENEMY_VARIANTS[0];
  const standardMonsterPath = themes.getThemedMonsterEnemySpritePath(sampleMonster, 'high-school', 'STANDARD');
  const vacationMonsterPath = themes.getThemedMonsterEnemySpritePath(sampleMonster, 'high-school', 'VACATION');
  const standardHumanoidPath = themes.getThemedHumanoidEnemySpritePath(sampleHumanoid, 'high-school', 'idle', 'STANDARD');
  const vacationHumanoidPath = themes.getThemedHumanoidEnemySpritePath(sampleHumanoid, 'high-school', 'idle', 'VACATION');
  assert(!standardMonsterPath.includes('vacation') && !standardHumanoidPath.includes('vacation'), 'STANDARD enemy resolver leaked Vacation path.');
  assert(vacationMonsterPath.includes('vacation-enemies') && vacationHumanoidPath.includes('vacation-humanoid-enemies'), 'VACATION enemy resolver did not select Vacation path.');

  const hsOpening = endless.getEndlessEndingSequence('OPENING', 'WARRIOR', '主人公', 'high-school', undefined, 'VACATION');
  const magicOpening = endless.getEndlessEndingSequence('OPENING', 'WARRIOR', '主人公', 'magic', 'AKARI', 'VACATION');
  assert(hsOpening.pages.every(page => page.imagePath.includes('high-school-vacation')), 'High-school Vacation endless sequence did not use Vacation art.');
  assert(magicOpening.pages.every(page => page.imagePath.includes('magic-vacation')), 'Magic Vacation endless sequence did not use Vacation art.');

  const hsEnding = themedEndings.getThemedEndingVariants('high-school', 'WARRIOR', '主人公', 'VACATION');
  const standardEnding = themedEndings.getThemedEndingVariants('high-school', 'WARRIOR', '主人公', 'STANDARD');
  assert(hsEnding.length === 5 && hsEnding.every(variant => variant.pages.every(page => page.imagePath.includes('high-school-vacation'))), 'High-school Vacation ending resolver did not use all 135 Vacation CG references.');
  assert(standardEnding.every(variant => variant.pages.every(page => !page.imagePath.includes('vacation'))), 'STANDARD ending resolver leaked Vacation art.');

  const sourceChecks = [
    ['src/App.tsx', 'appearanceMode={gameState.player.appearanceMode}'],
    ['src/App.tsx', '星海バカンスの真エンディング'],
    ['src/components/EnemyIllustration.tsx', 'vacationMajorBossPath'],
    ['src/data/endlessEndingSequences.ts', 'ENDLESS_VACATION_COPY'],
    ['src/components/EndlessClearScreen.tsx', 'getVacationEndlessChapterResult'],
    ['src/components/CompendiumScreen.tsx', 'selectedThemedEnding'],
    ['src/services/assetPreloadService.ts', 'HIGH_SCHOOL_VACATION_ENEMY_ASSET_PATHS'],
    ['src/data/magicAssetManifest.ts', 'magic-vacation'],
  ];
  for (const [file, needle] of sourceChecks) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert(content.includes(needle), `Vacation world integration marker missing: ${file} -> ${needle}`);
  }

  console.log('Vacation world conversion audit passed.');
  console.log('Environment assets: 20 / enemy variants: 320 / HS ending CGs: 135');
  console.log('Endless Vacation art and standard/Vacation resolver isolation: passed');
} finally {
  await server.close();
}
