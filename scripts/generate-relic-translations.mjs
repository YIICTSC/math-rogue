import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const KuroshiroModule = require('kuroshiro');
const AnalyzerModule = require('kuroshiro-analyzer-kuromoji');
const Kuroshiro = KuroshiroModule.default || KuroshiroModule;
const Analyzer = AnalyzerModule.default || AnalyzerModule;

const rootDir = path.resolve('.');
const constantsPath = path.join(rootDir, 'src/constants.ts');
const outputPath = path.join(rootDir, 'src/data/relicTranslations.generated.ts');

const ENGLISH_TRANSLATIONS = {
  MORNING_FLAG: { name: 'Morning Assembly Flag', description: 'At the start of battle, the first Attack you use costs 1 less.' },
  DESK_CALENDAR: { name: 'Desk Calendar', description: 'Draw 2 cards at the start of turn 3.' },
  ERASER_CAP: { name: 'Eraser Cap', description: 'The first Skill you use in battle costs 0.' },
  NAME_STAMP: { name: 'Name Stamp', description: 'At the start of battle, upgrade a random card in your hand.' },
  RED_PENCIL: { name: 'Red Pencil', description: 'At the end of a turn in which you used no Attacks, gain 5 Block.' },
  PROTRACTOR: { name: 'Protractor', description: 'Reduce the first attack damage you receive each turn by 2.' },
  PENCIL_CASE: { name: 'Pencil Case', description: 'At the start of battle, if your hand contains an Attack, Skill, and Power, gain 1 Energy.' },
  PENCIL_SHARPENER: { name: 'Pencil Sharpener', description: 'At the start of a turn, if you have 3 or fewer cards in hand, draw 1 card.' },
  SCHOOLBELL: { name: 'Music Room Bell', description: 'At the start of turn 5, apply 1 Vulnerable to all enemies.' },
  CLASS_ROSTER: { name: 'Class Roster', description: 'If a battle has at least 3 enemies, draw 1 card at the start of battle.' },
  TEAM_ARMLET: { name: 'Class Armlet', description: 'At the start of an Elite or Boss battle, gain 1 Strength.' },
  SLEEPY_EYE: { name: 'Wake-Up Gum', description: 'At the start of turn 1, gain 2 Energy. At the end of turn 2, lose 1 remaining Energy.' },
  DIARY: { name: 'Diary', description: 'If you took no damage during battle, heal 5 HP at the end of battle.' },
  HOURGLASS_OF_RECESS: { name: 'Recess Hourglass', description: 'The first time your HP falls to 50% or less in each battle, gain 12 Block.' },
  CHALKBOARD_CLOCK: { name: 'Blackboard Clock', description: 'While an enemy has Weak, draw 1 card at the start of each turn.' },
  CLASS_FLAG: { name: 'Class Flag', description: 'At the start of battle, gain 5 Block if there is 1 enemy, or 1 Dexterity if there are 2 or more.' },
  LUNCH_BELL: { name: 'Lunch Bell', description: 'If your hand is empty at the end of a turn, draw 2 cards next turn.' },
  RAIN_COVER: { name: 'Backpack Rain Cover', description: 'Reduce the first Debuff value you receive in each battle by 1.' },
  SCHOOL_MAP: { name: 'School Map', description: 'At the start of battle, if the enemy intends to attack next, gain 8 Block.' },
  HEALTH_RECORD: { name: 'Health Record', description: 'When the gap between Max HP and current HP is at least 30, gain Max HP +2 after victory.' },
  HANKO: { name: 'Name Seal', description: 'Gain 15G when you win a battle at full HP.' },
  DESK_DRAWER: { name: 'Desk Drawer', description: 'Draw 1 card the first time you use a Potion in each battle.' },
  RING_NOTE: { name: 'Loose-Leaf Note', description: 'At the start of battle, Retain a random card in your hand.' },
  FIRE_DRILL: { name: 'Fire Drill Hood', description: 'The first time you would take lethal damage in each battle, survive at 1 HP and gain 8 Block.' },
  FOUNTAIN_PEN: { name: 'Fountain Pen', description: 'Gain 1 Energy the first time you play an upgraded card in each battle.' },
  INK_ERASER: { name: 'Ink Eraser', description: 'Gain Max HP +2 whenever you remove a Curse from your deck.' },
  CLASS_NEWSPAPER: { name: 'Class Newspaper', description: 'If you use an Attack, Skill, and Power in one turn, draw 1 card at the end of that turn.' },
  RULER_CASE: { name: 'Ruler Case', description: 'After using 2 Attacks in a row, your next Attack deals 3 more damage.' },
  CHALK: { name: 'Chalk', description: 'When you use a Power, apply 1 Vulnerable to all enemies. Once per turn.' },
  BLACKBOARD_ERASER: { name: 'Blackboard Eraser', description: 'If any enemy is Weak, gain 4 Block at the start of each turn.' },
  HANDWRITING_SHEET: { name: 'Handwriting Sheet', description: 'When you use the same card twice in one turn, temporarily upgrade that card.' },
  STAMP_CARD: { name: 'Reward Stamp Card', description: 'Gain 10G every time you play 10 cards.' },
  TEXTBOOK: { name: 'Textbook', description: 'The first card you use each turn costs 1 less.' },
  QUESTION_CARD: { name: 'Question Card', description: 'At the start of battle, a random Attack in your hand costs 0.' },
  ORIGAMI_CRANE: { name: 'Origami Crane', description: 'Gain 3 Block whenever you Exhaust a card. Once per turn.' },
  CUTOUT_ART: { name: 'Paper Cutout', description: 'After you Exhaust a card, your next Attack plays twice. Once per battle.' },
  GLUE_STICK: { name: 'Glue Stick', description: 'Upgrade a card when you add it to your deck.' },
  SCISSORS: { name: 'Scissors', description: 'Gain 5G when you skip a card in a combat reward.' },
  STAPLER: { name: 'Stapler', description: 'The first card you Retain each turn costs 0 next turn.' },
  BINDER: { name: 'Binder', description: 'The first card you Exhaust in battle is returned to your discard pile.' },
  NOTEBOOK: { name: 'Notebook', description: 'At the start of battle, the top card of your draw pile costs 1 less.' },
  FLASHCARD: { name: 'Flashcard', description: 'After drawing 3 cards in one turn, your next Skill gains 4 Block.' },
  PEN_ROLL: { name: 'Pen Roll', description: 'While you have at least 4 cards in hand, Skills gain 2 Block.' },
  ERASER: { name: 'Eraser', description: 'When you discard a card, return a random card from your discard pile to your hand. Once per turn.' },
  CORRECTION_TAPE: { name: 'Correction Tape', description: 'The first Curse you draw in each battle is Exhausted, then draw 1 card.' },
  FILE_FOLDER: { name: 'File Folder', description: 'If your deck has 15 or fewer cards, gain 5 Block at the start of battle.' },
  CARBON_PAPER: { name: 'Carbon Paper', description: 'Every 5 Skills, upgrade a random Attack in your hand.' },
  TRANSPARENT_SHEET: { name: 'Transparent Desk Mat', description: 'If you have at least 5 cards in hand, your first Skill gains 3 Block.' },
  CALLIGRAPHY_BRUSH: { name: 'Calligraphy Brush', description: 'Whenever you play an upgraded card, deal 2 damage to all enemies.' },
  ABACUS: { name: 'Abacus', description: 'Gain 2G for every 1 Energy left at the end of a turn.' },
  KITCHEN_TIMER: { name: 'Kitchen Timer', description: 'If you took no damage during a turn, draw 1 card next turn.' },
  MAGNET: { name: 'Magnet', description: 'When you discard a card, deal 1 damage to a random enemy. Up to 3 times per turn.' },
  POCKET_CALCULATOR: { name: 'Pocket Calculator', description: 'Gain 1G for every 5 Block left at the end of a turn.' },
  SCHOOL_DIE: { name: 'School Die', description: 'At the start of battle, randomly gain 0 to 2 Energy. If the roll is 0, draw 1 card.' },
  LUCKY_CHARM: { name: 'Charm', description: 'Negate the first Debuff you receive in each battle.' },
  VENDING_TOKEN: { name: 'Vending Token', description: 'Gain 20G when you win a battle without using a Potion.' },
  ENVELOPE: { name: 'Envelope', description: 'Gain 20G every 3 battles won.' },
  CONTACT_BOOK_STAMP: { name: 'Contact Book Seal', description: 'After 3 consecutive turns without receiving a Debuff, heal 4 HP.' },
  COMMUTER_PASS: { name: 'Commuter Pass', description: 'The first card you buy in a shop costs 25G less.' },
  LUNCH_TICKET: { name: 'Lunch Ticket', description: 'When you choose a Potion reward, gain 1 Energy at the start of the next battle.' },
  RECESS_TOKEN: { name: 'Recess Token', description: 'After battle, gain 1 Energy during turn 1 of the next battle.' },
  PREPAID_CARD: { name: 'Prepaid Card', description: 'Gain 150G when obtained. You can no longer skip card rewards.' },
  BIRTHDAY_CANDLE: { name: 'Birthday Candle', description: 'Gain Max HP +1 after each first victory against a non-Boss battle. Up to 10 times.' },
  MINT_CASE: { name: 'Mint Case', description: 'When you use a Potion, reduce the value of the next Debuff you receive by 1.' },
  FIRST_AID_BAG: { name: 'First-Aid Bag', description: 'When you use a Potion, gain 4 Block. Once per battle.' },
  THERMOMETER: { name: 'Thermometer', description: 'When HP is 30% or less and the enemy attacks, reduce damage taken by 2.' },
  WEIGHT_SCALE: { name: 'Weight Scale', description: 'At the start of battle, gain up to 10 Block based on the gap between Max HP and current HP.' },
  STOPWATCH: { name: 'Stopwatch', description: 'In each battle, if you play your first 3 cards within one turn, gain 1 Energy.' },
  METRONOME: { name: 'Metronome', description: 'Whenever you play cards with the same cost consecutively, draw 1 card.' },
  DIRECTION_COMPASS: { name: 'Direction Compass', description: 'If all 3 cards in a card reward have different types, heal 5 HP.' },
  PENCIL_LEAD: { name: 'Pencil Lead', description: 'Every 5 Attacks, your next Attack costs 0.' },
  WHITE_CHALK: { name: 'White Chalk', description: 'On the first turn you apply a Debuff to an enemy, deal 2 damage to all enemies.' },
  RAINBOW_PENCIL: { name: 'Rainbow Pencil', description: 'If you use an Attack, Skill, and Power in one turn, gain 1 Dexterity.' },
  SCHOOL_EMBLEM_KEYCHAIN: { name: 'School Emblem Keychain', description: 'At the start of battle, gain 1 Block for every 5 relics you own.' },
  LIBRARY_PASS: { name: 'Library Pass', description: 'After buying a relic in a shop, the next Potion you buy costs 20G less.' },
  FIELD_TRIP_BADGE: { name: 'Field Trip Badge', description: 'Gain 15G whenever you complete an event.' },
  FIELD_TRIP_GUIDE: { name: 'Field Trip Guide', description: 'Upgrade a card when you gain it from an event.' },
  SCHOOL_GATE_KEY: { name: 'School Gate Key', description: 'At the start of an Elite battle, apply 1 Weak to all enemies.' },
  HALL_PASS: { name: 'Hall Pass', description: 'After upgrading a card at a rest site, draw 1 card at the start of the next battle.' },
  CLUB_CARD: { name: 'Club Membership Card', description: 'Gain 30G after winning an Elite battle.' },
  MAKEUP_EXAM_PASS: { name: 'Makeup Exam Pass', description: 'When you first answer a question incorrectly, upgrade a random card in your deck.' },
  REPORT_CARD: { name: 'Report Card', description: 'After winning a battle without taking damage, upgrade the first card in the next card reward.' },
  GOLD_STAR_STICKER: { name: 'Gold Star Sticker', description: 'Heal 3 HP every 3 consecutive correct answers.' },
  MEDAL_CASE: { name: 'Medal Case', description: 'Gain Max HP +3 whenever you defeat an Elite or Boss.' },
  TREASURE_MAP: { name: 'Treasure Map', description: 'Gain 30 more G from treasure chests.' },
  SECRET_BASE_MAP: { name: 'Secret Base Map', description: 'Heal 3 HP whenever you complete a question-mark space.' },
  STANDING_UMBRELLA: { name: 'Spare Umbrella', description: 'After upgrading a card at a rest site, gain Max HP +2. Once per act.' },
  INFIRMARY_BLANKET: { name: 'Infirmary Blanket', description: 'When you choose to heal at a rest site, increase the healing by 8.' },
  SLEEPING_BAG: { name: 'Sleeping Bag', description: 'Resting at a rest site fully heals you, but you cannot choose to upgrade a card there.' },
  LUNCH_MENU: { name: 'Lunch Menu', description: 'Heal 3 HP whenever you obtain a Potion.' },
  SCHOOL_CALENDAR: { name: 'School Calendar', description: 'Gain Max HP +2 every 4 battles won.' },
  ANNOUNCEMENT_LETTER: { name: 'Announcement Handout', description: 'After skipping a card in a combat reward, draw 1 card at the start of the next battle.' },
  CLUB_STAMP_CARD: { name: 'Club Stamp Card', description: 'Every 5 battles, add a random Common card to your deck.' },
  CLASSROOM_KEY: { name: 'Spare Classroom Key', description: 'The first time you buy a relic in a shop, obtain a Potion. If full, gain 50G instead.' },
  LIBRARY_LOAN_CARD: { name: 'Library Loan Card', description: 'Gain 10G when you leave a shop without buying a card.' },
  CANTEEN_COUPON: { name: 'Canteen Coupon', description: 'The first Potion you buy in a shop is free.' },
  LOST_AND_FOUND: { name: 'Lost-and-Found Box', description: 'When you obtain a relic from an Elite battle, heal 8 HP.' },
  PTA_HANDOUT: { name: 'PTA Handout', description: 'After completing a question-mark space, gain 1 Energy during turn 1 of the next battle.' },
  GRADUATION_ALBUM: { name: 'Graduation Album', description: 'When you defeat an Act Boss, remove or upgrade 2 cards from your deck.' },
  LATE_SLIP: { name: 'Late Slip', description: 'At the start of battle, discard 1 card to gain 1 Energy.' },
  DETENTION_CARD: { name: 'Detention Card', description: 'If your hand is empty at the end of a turn, gain 1 Energy. Draw 1 fewer extra card next turn.' },
  ZERO_POINT_TEST: { name: 'Zero-Point Test', description: 'After answering a question incorrectly, gain 3 Strength for the next battle only.' },
  EXTRA_HOMEWORK: { name: 'Extra Homework', description: 'After victory, gain 30G by replacing 1 hand card with Shame at the start of the next battle.' },
  MAKEUP_TEST: { name: 'Makeup Test Workbook', description: 'After a correct answer, gain 8 Block at the start of the next battle. No effect after an incorrect answer.' },
  ANIMAL_CARE_BADGE: { name: 'Animal Care Badge', description: 'Heal 4 HP whenever you defeat a Poisoned enemy. Up to 3 times per battle.' },
  SCIENCE_EXPERIMENT_KIT: { name: 'Science Experiment Kit', description: 'At the start of battle, apply 2 Poison to all enemies and lose 2 HP.' },
  SCIENCE_BEAKER: { name: 'Science Beaker', description: 'When you apply a Debuff, deal 1 damage to that enemy. Up to 5 times per turn.' },
  PLANT_DIARY: { name: 'Plant Observation Diary', description: 'If you play at least 10 cards during battle, heal 4 HP at the end of battle.' },
  WORM_BOX: { name: 'Worm Box', description: 'Gain 1G whenever you apply Poison to an enemy. Up to 10G per battle.' },
  SCHOOL_MASCOT: { name: 'School Mascot', description: 'When you take damage, add a random Skill to your hand at 0 cost. Once per turn.' },
  PAPER_CROWN: { name: 'Paper Crown', description: 'While you own 5 or fewer relics, gain 1 Strength at the start of battle.' },
  LUCKY_PENCIL: { name: 'Lucky Pencil', description: 'Gain Max HP +3 every 3 card rewards you receive.' },
  BROKEN_CLOCK: { name: 'Broken Clock', description: 'Gain 2 Energy every turn, but lose 3 HP at the end of each turn.' },
  FORBIDDEN_NOTE: { name: 'Forbidden Note', description: 'At the start of battle, draw 3 extra cards. At the end of turn 1, add a Dazed card to your hand.' },
  CLASS_PRESIDENT_BADGE: { name: 'Class President Badge', description: 'At the start of a turn, gain 2 Strength with at least 5 cards in hand, otherwise gain 8 Block.' },
  MYSTERY_RUBBER: { name: 'Mysterious Eraser', description: 'After victory, upgrade a random card in your deck and add 1 Curse.' },
  DUAL_PENCIL: { name: 'Two-Color Pencil', description: 'The first Attack and first Skill each turn gain 2 effect value.' },
  GYM_MEGAPHONE: { name: 'Gymnasium Megaphone', description: 'When there are at least 2 enemies, increase all Debuffs you apply by 1.' },
  SECRET_STAMP: { name: 'Secret Seal', description: 'When you buy a relic in a shop, upgrade a random card in your deck.' },
  PRINCIPAL_SEAL: { name: "Principal's Seal", description: 'At the start of battle, gain 2 Energy, but card rewards have 1 fewer option.' },
  SCHOOL_ROOF_FLAG: { name: 'Rooftop Flag', description: 'While HP is 50% or less, the first card you use each turn costs 0.' },
  GOLDEN_LUNCHBOX: { name: 'Golden Lunchbox', description: 'Gain 50G after battle, but lose Max HP 10.' },
  THREE_COLOR_RIBBON: { name: 'Three-Color Ribbon', description: 'After playing 6 cards in one turn, Retain 3 cards next turn.' },
  PERFECT_SCORE_CERTIFICATE: { name: 'Perfect Score Certificate', description: 'After 3 consecutive correct answers, gain 2 Energy at the start of the next battle.' },
  HERO_BADGE: { name: 'Hero Badge', description: 'Gain Max HP +2 after each no-damage battle. On taking damage, lose half of this accumulated bonus.' },
  STAR_PROJECTOR: { name: 'Star Projector', description: 'Every 4 turns, deal 8 damage to all enemies and draw 2 cards.' },
  TIME_CAPSULE: { name: 'Time Capsule', description: 'At the start of battle, draw 3 cards. At the end of turn 1, discard your entire hand.' },
  SCHOOL_ARCHIVE: { name: 'School Archive', description: 'Card rewards always offer 5 cards, but you cannot skip card rewards.' },
  MASTER_KEY: { name: 'Master Key', description: 'When a Curse would appear in a chest, lose 10 HP instead.' },
  INVISIBLE_INK: { name: 'Invisible Ink', description: 'The first Attack you use in each battle ignores enemy Block.' },
  THREE_WAY_RULER: { name: 'Three-Way Ruler', description: 'At the start of each turn, gain 2 Block for each of Attack, Skill, and Power that you did not use first.' },
  GYMNASIUM_FLAG: { name: 'Gymnasium Banner', description: 'Whenever you defeat an enemy, the next card you use in that battle gains 4 effect value.' },
  LAST_BELL: { name: 'Final Bell', description: 'At the start of turn 7, deal 30 damage to all enemies, but lose 1 Energy each turn until turn 7.' },
  ALUMNI_PIN: { name: 'Alumni Badge', description: 'At the start of battle, draw 1 card with at least 4 card types in your deck, otherwise gain 1 Energy.' },
};

const humanizeId = (id) => id
  .toLowerCase()
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const normalizeHiragana = (value) => value
  .replaceAll('しゅさつ', 'てふだ')
  .replaceAll('すてさつ', 'すてふだ')
  .replaceAll('やまさつ', 'やまふだ')
  .replace(/おはら(?=[がをのにへも、。…\s])/g, 'おなか')
  .replaceAll('たいしゅつかーど', 'かしだしカード')
  .replaceAll('いんくかめ', 'インクびん')
  .replaceAll('あとかたづけけ', 'あとかたづけ')
  .replaceAll('いっって', 'いって')
  .replaceAll('おきんがたりない', 'おかねがたりない')
  .replaceAll('じゅほのお', 'じゅえん')
  .replaceAll('あるま、', 'あるあいだ、')
  .replaceAll('いちばんじょう', 'いちばんうえ');

const parseRelics = (source) => {
  const block = source.match(/export const RELIC_LIBRARY:[^=]+= \{([\s\S]*?)\n\};/);
  if (!block) throw new Error('RELIC_LIBRARY was not found.');
  return [...block[1].matchAll(/^\s+([A-Z0-9_]+): \{ id: '([^']+)', name: '([^']+)', description: '([^']+)'/gm)]
    .map(([, id, , name, description]) => ({ id, name, description }))
    .slice(66);
};

const quote = (value) => JSON.stringify(value);

const source = await fs.readFile(constantsPath, 'utf8');
const relics = parseRelics(source);
const analyzerPackageRoot = path.dirname(require.resolve('kuroshiro-analyzer-kuromoji/package.json'));
const analyzerRequire = createRequire(path.join(analyzerPackageRoot, 'package.json'));
const dictPath = path.dirname(analyzerRequire.resolve('kuromoji/package.json')) + '/dict';
const kuroshiro = new Kuroshiro();
await kuroshiro.init(new Analyzer({ dictPath }));

const translated = [];
for (const relic of relics) {
  const english = ENGLISH_TRANSLATIONS[relic.id] || {
    name: humanizeId(relic.id),
    description: 'This relic provides a unique school-route effect.',
  };
  translated.push({
    ...relic,
    englishName: english.name,
    englishDescription: english.description,
    hiraganaName: normalizeHiragana(await kuroshiro.convert(relic.name, { to: 'hiragana', mode: 'normal' })),
    hiraganaDescription: normalizeHiragana(await kuroshiro.convert(relic.description, { to: 'hiragana', mode: 'normal' })),
  });
}

const names = Object.fromEntries(translated.map(item => [item.name, item.englishName]));
const descriptions = Object.fromEntries(translated.map(item => [item.description, item.englishDescription]));
const hiragana = Object.fromEntries(translated.flatMap(item => [
  [item.name, item.hiraganaName],
  [item.description, item.hiraganaDescription],
]));

const output = `// Generated by scripts/generate-relic-translations.mjs. Do not edit manually.\nexport const RELIC_ENGLISH_NAME_TRANSLATIONS = ${JSON.stringify(names, null, 2)} as const;\n\nexport const RELIC_ENGLISH_DESCRIPTION_TRANSLATIONS = ${JSON.stringify(descriptions, null, 2)} as const;\n\nexport const RELIC_HIRAGANA_TRANSLATIONS = ${JSON.stringify(hiragana, null, 2)} as const;\n`;
await fs.writeFile(outputPath, output);
console.log(`Generated ${path.relative(rootDir, outputPath)} for ${translated.length} additional relics.`);
