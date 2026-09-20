import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const exists = (relativePath) => fs.existsSync(path.join(publicDir, relativePath));
const fail = (message) => {
  throw new Error(message);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};

const heroines = ['AKARI', 'SHIZUKU', 'HIYORI', 'TSUBASA', 'REI', 'MADOKA', 'KOHARU', 'MIRAI', 'SERA'];
const males = ['REN', 'SOMA', 'MINATO', 'RIKU', 'YAMATO', 'LEON', 'ELLIOT', 'SAKUYA'];
const allMagicCharacters = [...heroines, ...males];
const endingSuffixes = ['-bond', '-special', '', '-true'];

const server = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const hs = await server.ssrLoadModule('/src/data/highSchoolVacationEvents.ts');
  const battle = await server.ssrLoadModule('/src/data/battleBackgrounds.ts');
  const vacationRomance = await server.ssrLoadModule('/src/data/magicVacationRomanceDialogue.ts');
  const vacationEndingCopy = await server.ssrLoadModule('/src/data/vacationEndingCopy.ts');
  const themedEndingSequences = await server.ssrLoadModule('/src/data/themedEndingSequences.ts');
  const romanceService = await server.ssrLoadModule('/src/services/magicRomanceEventService.ts');
  const endingService = await server.ssrLoadModule('/src/services/magicEndingService.ts');
  const eventService = await server.ssrLoadModule('/src/services/eventService.ts');

  assert(hs.HIGH_SCHOOL_VACATION_EVENTS.length === 90, 'High-school Vacation events must be exactly 90.');
  hs.HIGH_SCHOOL_VACATION_EVENTS.forEach((event, index) => {
    const expectedId = `HSV${String(index + 1).padStart(3, '0')}`;
    assert(event.id === expectedId, `Unexpected Vacation event ID at index ${index}: ${event.id}`);
    assert(event.imageIndex === index, `Unexpected imageIndex for ${event.id}`);
    assert(exists(`sprites/high-school/events/vacation/${String(index).padStart(3, '0')}.webp`), `Missing event CG for ${event.id}`);
    assert(event.choices.length >= 2 && event.choices.length <= 3, `Unexpected choice count for ${event.id}`);
  });

  assert(battle.HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES.length === 8, 'High-school Vacation battle backgrounds must be 8.');
  assert(battle.MAGIC_VACATION_BATTLE_BACKGROUND_SCENES.length === 8, 'Magic Vacation battle backgrounds must be 8.');
  for (const scene of [
    ...battle.HIGH_SCHOOL_VACATION_BATTLE_BACKGROUND_SCENES,
    ...battle.MAGIC_VACATION_BATTLE_BACKGROUND_SCENES,
  ]) {
    const relative = scene.image.replace(/^.*sprites\//, 'sprites/').split('?')[0];
    assert(exists(relative), `Missing battle background: ${relative}`);
    assert(scene.flavorTexts.length >= 3, `Vacation battle scene ${scene.id} needs at least 3 log variants.`);
  }

  for (const theme of ['high-school', 'magic']) {
    for (let act = 1; act <= 4; act += 1) {
      assert(exists(`sprites/backgrounds/learning-rogue/${theme}-vacation-map-act${act}.webp`), `Missing ${theme} Vacation map act ${act}`);
    }
  }

  const hsHeroIds = ['WARRIOR', 'CARETAKER', 'ASSASSIN', 'DODGEBALL', 'BARD', 'LIBRARIAN', 'CHEF', 'GARDENER', 'MAGE'];
  const hsCues = ['relax', 'cheer', 'discovery', 'help', 'challenge', 'night'];
  for (const heroId of hsHeroIds) {
    for (const cue of hsCues) {
      assert(exists(`sfx/high-school-voices/${heroId}/vacation-${cue}.ogg`), `Missing high-school Vacation voice: ${heroId}/${cue}`);
    }
  }

  const hsVacationPlayer = {
    id: 'WARRIOR',
    appearanceMode: 'VACATION',
    currentHp: 80,
    maxHp: 100,
    gold: 0,
    deck: [],
    relics: [],
    potions: [],
    turnFlags: {},
  };
  const restoredHsVacationEvent = eventService.generateEvent(
    hsVacationPlayer,
    () => {},
    () => {},
    () => {},
    'JAPANESE',
    [],
    '朝いちばんの砂浜',
    'high-school',
    1,
    1,
    false,
  );
  assert(
    restoredHsVacationEvent.imageKey === 'high-school-vacation-event-0',
    'High-school Vacation restore did not resolve HSV001: ' + JSON.stringify({
      title: restoredHsVacationEvent.title,
      imageKey: restoredHsVacationEvent.imageKey,
    }),
  );
  assert(restoredHsVacationEvent.highSchoolVoiceName?.startsWith('vacation-'), 'High-school Vacation event did not expose a Vacation voice cue.');

  let romanceCgCount = 0;
  for (const heroineId of heroines) {
    for (const maleId of males) {
      for (let stage = 1; stage <= 5; stage += 1) {
        const relative = `sprites/magic/events/romance/vacation/${heroineId}/${maleId}/r${stage}.webp`;
        assert(exists(relative), `Missing Magic Vacation romance CG: ${relative}`);
        romanceCgCount += 1;
      }
      for (const suffix of endingSuffixes) {
        const relative = `sprites/magic/events/romance/vacation/${heroineId}/${maleId}/r6${suffix}.webp`;
        assert(exists(relative), `Missing Magic Vacation ending CG: ${relative}`);
        romanceCgCount += 1;
      }
      for (let stageIndex = 0; stageIndex < 5; stageIndex += 1) {
        const dialogue = vacationRomance.getMagicVacationRomanceDialogue(heroineId, maleId, stageIndex);
        assert(dialogue.description.includes('「'), `Vacation dialogue is missing speaker lines: ${heroineId}/${maleId}/R${stageIndex + 1}`);
        const imageKey = vacationRomance.getMagicVacationRomanceImageKey(heroineId, maleId, stageIndex + 1);
        assert(imageKey === `magic-romance-vacation:${heroineId}:${maleId}:r${stageIndex + 1}`, `Unexpected image key: ${imageKey}`);
      }
    }
  }
  assert(romanceCgCount === 648, `Expected 648 final Magic Vacation romance CGs, got ${romanceCgCount}`);

  const vacationEndingCharacters = ['ASSASSIN', 'BARD', 'CARETAKER', 'CHEF', 'DODGEBALL', 'GARDENER', 'LIBRARIAN', 'MAGE', 'WARRIOR'];
  const vacationEndingTones = ['serious', 'funny', 'cool', 'cute', 'heartfelt'];
  let vacationEndingPageCount = 0;
  for (const characterId of vacationEndingCharacters) {
    const variants = themedEndingSequences.getThemedEndingVariants('high-school', characterId, characterId, 'VACATION');
    assert(variants.length === vacationEndingTones.length, `Expected five Vacation ending tones for ${characterId}`);
    for (const variant of variants) {
      assert(variant.pages.length === 3, `Vacation ending ${characterId}/${variant.id} must have three pages`);
      for (const page of variant.pages) {
        assert(page.imagePath.includes('endings/high-school-vacation/'), `Vacation ending used a non-Vacation image path: ${page.imagePath}`);
        assert(exists(page.imagePath), `Missing Vacation ending image: ${page.imagePath}`);
        assert(page.text.length > 0 && page.dialogue && page.dialogue.length > 0, `Vacation ending copy is incomplete: ${characterId}/${variant.id}`);
        vacationEndingPageCount += 1;
      }
    }
  }
  assert(vacationEndingPageCount === 135, `Expected 135 high-school Vacation ending pages, got ${vacationEndingPageCount}`);
  assert(vacationEndingCopy.MAGIC_VACATION_COMMON_ENDING_PAGES.length === 3, 'Magic Vacation common ending must have three pages.');
  vacationEndingCopy.MAGIC_VACATION_COMMON_ENDING_PAGES.forEach((page, index) => {
    assert(exists(`sprites/endings/magic-vacation/common/ending-${index + 1}.webp`), `Missing Magic Vacation common ending image ${index + 1}`);
    assert(page.description.ja.length > 0 && page.dialogue.ja.length > 0, `Magic Vacation common ending copy is incomplete at page ${index + 1}`);
  });

  for (const characterId of allMagicCharacters) {
    for (let stage = 1; stage <= 5; stage += 1) {
      assert(exists(`sfx/magic-event-voices/${characterId}/vacation-romance-r${stage}.ogg`), `Missing Vacation romance voice: ${characterId}/R${stage}`);
    }
  }

  let endingVoiceCount = 0;
  for (const characterId of allMagicCharacters) {
    const rankLines = vacationRomance.MAGIC_VACATION_ENDING_LINES[characterId];
    assert(rankLines, `Missing Vacation ending lines for ${characterId}`);
    for (const rank of ['BOND', 'SPECIAL', 'ROMANCE', 'TRUE_ROMANCE']) {
      const lines = rankLines[rank];
      assert(lines?.length === 2, `Expected 2 ending lines for ${characterId}/${rank}`);
      for (const line of lines) {
        const voice = endingService.getMagicEndingVoiceLine(line, characterId);
        assert(voice?.lineId, `Could not resolve ending voice ID for ${characterId}/${rank}`);
        assert(exists(`sfx/magic-event-voices/${voice.heroId}/${voice.lineId}.ogg`), `Missing hashed Vacation ending voice: ${voice.heroId}/${voice.lineId}.ogg`);
        endingVoiceCount += 1;
      }
    }
  }
  assert(endingVoiceCount === 136, `Expected 136 Vacation ending voices, got ${endingVoiceCount}`);

  const standardHsBattle = battle.chooseBattleBackgroundScene('COMBAT', 1, 1, 'high-school', 'STANDARD');
  const vacationHsBattle = battle.chooseBattleBackgroundScene('COMBAT', 1, 1, 'high-school', 'VACATION');
  const standardMagicBattle = battle.chooseBattleBackgroundScene('COMBAT', 1, 1, 'magic', 'STANDARD');
  const vacationMagicBattle = battle.chooseBattleBackgroundScene('COMBAT', 1, 1, 'magic', 'VACATION');
  assert(!standardHsBattle.image.includes('vacation'), 'Standard high-school battle leaked Vacation background.');
  assert(vacationHsBattle.image.includes('high-school-vacation-battle-'), 'High-school Vacation battle background was not selected.');
  assert(!standardMagicBattle.image.includes('vacation'), 'Standard Magic battle leaked Vacation background.');
  assert(vacationMagicBattle.image.includes('magic-vacation-battle-'), 'Magic Vacation battle background was not selected.');

  const vacationPlayer = {
    id: 'MAGE',
    appearanceMode: 'VACATION',
    magicProtagonistGender: 'female',
    magicProtagonistId: 'AKARI',
    magicRomance: {
      affection: { REN: 100 },
      stages: { REN: 5 },
      selectedCounts: { REN: 5 },
      completedEventIds: ['AKARI_REN_r5'],
    },
  };
  const standardPlayer = { ...vacationPlayer, appearanceMode: 'STANDARD' };
  const vacationEnding = endingService.getMagicEndingPages(vacationPlayer, 'AKARI').find(page => page.kind === 'romance');
  const standardEnding = endingService.getMagicEndingPages(standardPlayer, 'AKARI').find(page => page.kind === 'romance');
  assert(vacationEnding?.imagePath.includes('/romance/vacation/'), 'Vacation ending did not use Vacation CG.');
  assert(!standardEnding?.imagePath.includes('/romance/vacation/'), 'Standard ending leaked Vacation CG.');

  const vacationSelectionPlayer = {
    ...vacationPlayer,
    magicRomance: {
      affection: {},
      stages: {},
      selectedCounts: {},
      completedEventIds: [],
    },
  };
  let localState = { player: vacationSelectionPlayer, currentEventTitle: undefined };
  let nestedRomanceEvent = null;
  const selectionEvent = romanceService.generateMagicRomanceSelectionEvent(
    vacationSelectionPlayer,
    'AKARI',
    1,
    (updater) => {
      localState = typeof updater === 'function' ? updater(localState) : updater;
    },
    (event) => {
      nestedRomanceEvent = event;
    },
    () => {},
    { showAllRomanceCandidates: true, showAllFriendshipCandidates: true },
  );
  assert(selectionEvent.title === 'バカンス、誰と過ごす？', 'Magic Vacation selection title was not switched.');
  selectionEvent.options[0].action();
  assert(nestedRomanceEvent?.imageKey?.startsWith('magic-romance-vacation:'), 'Magic Vacation route did not use Vacation image key.');
  assert(nestedRomanceEvent?.voiceLines?.every(line => line.lineId === 'vacation-romance-r1'), 'Magic Vacation R1 did not use dedicated R1 voice IDs.');

  const sourceChecks = [
    ['src/components/MapScreen.tsx', 'vacation-map-act'],
    ['src/components/EventScreen.tsx', 'high-school-vacation-event-'],
    ['src/components/EventScreen.tsx', 'magic-romance-vacation:'],
    ['src/services/eventService.ts', 'HIGH_SCHOOL_VACATION_EVENTS'],
    ['src/services/magicRomanceEventService.ts', 'getMagicVacationRomanceDialogue'],
    ['src/services/magicEndingService.ts', 'getMagicVacationRomanceEnding'],
    ['src/App.tsx', 'highSchoolVoiceName'],
  ];
  for (const [file, needle] of sourceChecks) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert(content.includes(needle), `Integration marker missing: ${file} -> ${needle}`);
  }

  console.log('Vacation Mode runtime audit passed.');
  console.log('High-school Vacation events: 90 / CGs: 90 / voices: 54');
  console.log('Vacation maps: 8 / battle backgrounds: 16');
  console.log('Magic Vacation romance CGs: 648 / R1-R5 voices: 85 / R6 voices: 136');
  console.log('High-school Vacation ending pages: 135 / Magic common Vacation ending pages: 3');
} finally {
  await server.close();
}
