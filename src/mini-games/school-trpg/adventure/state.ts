import {
  AFFIXES,
  CALLINGS,
  GOOD_IDS,
  IDEALS,
  ORIGINS,
  STAT_IDS,
  type Affix,
  type Calling,
  type Good,
  type Goods,
  type Ideal,
  type Origin,
  type Rarity,
  type Slot,
  type Stat,
  type Text,
  type Weapon,
} from './content';
import type { BadgeId } from './guild';
import type { Boon } from './tales';
import {
  ACADEMY_WORLD,
  addressKey,
  hash,
  type Address,
  type Mission,
  type Resident,
} from './world';

export const ADVENTURE_VERSION = 2;
export const MAX_PARTY_SIZE = 6;
export const MEAL_INTERVAL = 24;
export const CREATION_POINTS = 5;
export const START_STATS: Record<Stat, number> = { might: 2, finesse: 2, insight: 2, presence: 3 };
export const PORTRAIT_IDS = [
  ...Array.from({ length: 20 }, (_, i) => 'f' + (i + 1)),
  ...Array.from({ length: 20 }, (_, i) => 'm' + (i + 1)),
];

export const DEATH_RULES = ['permadeath', 'return-town'] as const;
export type DeathRule = (typeof DEATH_RULES)[number];

export type Character = {
  name: string;
  portrait: string;
  calling: Calling;
  origin: Origin;
  ideal: Ideal;
  stats: Record<Stat, number>;
  world: string;
  deathRule: DeathRule;
};
export type Gear = {
  id: string;
  slot: Slot;
  weapon?: Weapon;
  rarity: Rarity;
  power: number;
  affix?: Affix;
  found: number;
};
export type Journal = {
  text: Text;
  dayHour: number;
  tone: 'story' | 'good' | 'risk';
  check?: Check;
};
export type Check = {
  stat: Stat;
  faces: number[];
  natural: number;
  bonus: number;
  total: number;
  target: number;
  outcome: 'critical' | 'success' | 'partial' | 'fail';
  inspiration: boolean;
};
export type Garden = {
  level: number;
  planted: number[];
  additions?: Partial<Record<import('./building').Improvement, number>>;
};
export type Friend = { resident: Resident; trust: number; visitedDay: number; offeredDay: number };
export type DungeonRecord = { seen: number[]; cleared: number[]; inspected: number[] };
export type Enemy = {
  template: number;
  hp: number;
  max: number;
  power: number;
  pattern: number;
  stagger: boolean;
  known: boolean;
};
export type Ally = { id: string; hp: number; max: number };
export type Encounter = {
  cell: number;
  guardian: boolean;
  bound: boolean;
  turn: number;
  enemies: Enemy[];
  allies?: Ally[];
  combo: number;
  guard: boolean;
  surprise: boolean;
};
export type Delve = {
  floor: number;
  cell: number;
  previous: number | null;
  direction: number;
  light: number;
  threat: number;
  encounter: Encounter | null;
};
export type Counters = {
  combats: number;
  pacified: number;
  guardians: number;
  jobs: number;
  contracts: number;
  crafted: number;
  harvests: number;
  lessons: number;
  landmarks: number;
  trades: number;
};
export type ActiveMission = Mission & { baseline: number };
export type Adventure = {
  version: typeof ADVENTURE_VERSION;
  id: string;
  revision: number;
  character: Character;
  location: Address;
  homeGate: Address;
  gates: Record<string, Address>;
  knownTowns: Record<string, Address>;
  exploredLandmarks: Record<string, boolean>;
  townTales: Record<string, { boon?: Boon; day: number }>;
  time: number;
  lastMealAt: number;
  fallenAt: number | null;
  defeats: number;
  level: number;
  xp: number;
  talent: number;
  gold: number;
  hp: number;
  focus: number;
  fatigue: number;
  inspiration: number;
  goods: Goods;
  gear: Gear[];
  equipment: Partial<Record<Slot, string>>;
  nextGear: number;
  workshop: Record<string, Garden>;
  friends: Record<string, Friend>;
  followers: string[];
  townWork: Record<string, number>;
  lastGather: { location: string; time: number } | null;
  inspirationLessonDay: number;
  mission: ActiveMission | null;
  fulfilled: string[];
  floors: Record<string, DungeonRecord>;
  deepest: Record<string, number>;
  delve: Delve | null;
  counters: Counters;
  badges: Partial<Record<BadgeId, number>>;
  goals: Array<{ id: string; text: string; complete: boolean }>;
  journal: Journal[];
  rng: number;
};

export type LifeActivity =
  | 'work'
  | 'gather'
  | 'fish'
  | 'practice'
  | 'survey'
  | 'performance'
  | 'forage';
export type SocialActivity = 'talk' | 'gift' | 'assist' | 'recruit' | 'dismiss';
export type CombatMove =
  | 'strike'
  | 'heavy'
  | 'quick'
  | 'spark'
  | 'guard'
  | 'study'
  | 'parley'
  | 'retreat';
export type DelveMove = 'forward' | 'backward' | 'left' | 'right';
export type DungeonVerb =
  | 'confront'
  | 'open'
  | 'inspect'
  | 'pick'
  | 'force'
  | 'harvest'
  | 'meditate'
  | 'sneak'
  | 'descend'
  | 'ascend';
export type Action =
  | { type: 'tale'; option: number }
  | { type: 'travel'; direction: number }
  | { type: 'gate'; world: string }
  | { type: 'return-home' | 'set-home' }
  | { type: 'life'; activity: LifeActivity }
  | { type: 'rest'; rest: 'bench' | 'inn' | 'home'; hours?: number }
  | { type: 'trade'; good: Good; sell: boolean }
  | { type: 'social'; id: string; verb: SocialActivity }
  | { type: 'build'; mode: 'buy' | 'raise' | 'upgrade' | 'plant' | 'harvest' }
  | { type: 'craft'; recipe: Good | Slot }
  | { type: 'equip' | 'salvage' | 'sell-gear'; id: string }
  | { type: 'use'; good: 'tonic' | 'lantern' | 'ration' | 'fieldKit' | 'strongTonic' }
  | { type: 'inn-meal' }
  | { type: 'fabricate'; recipe: import('./building').BlueprintId }
  | { type: 'build-improvement'; improvement: import('./building').Improvement }
  | { type: 'train'; stat: Stat }
  | { type: 'lesson'; correct: number }
  | { type: 'mission'; id: string }
  | { type: 'claim-mission' | 'cancel-mission' }
  | { type: 'badge'; id: BadgeId }
  | { type: 'goal'; text: string }
  | { type: 'complete-goal'; id: string }
  | { type: 'declare'; statement: string; stat: Stat; inspiration: boolean; target?: number }
  | { type: 'enter'; floor?: number }
  | { type: 'leave-delve' }
  | { type: 'move'; direction: DelveMove }
  | { type: 'feature'; verb: DungeonVerb; symbol?: number }
  | { type: 'combat'; move: CombatMove; target: number }
  | { type: 'auto-combat'; target: number };

export function worldCode(input: string) {
  return input
    .trim()
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
}
export const freshWorldCode = () =>
  'world-' +
  (
    globalThis.crypto?.getRandomValues(new Uint32Array(1))[0] ??
    Math.floor(Math.random() * 0xffffffff)
  ).toString(36);
export const defaultCharacter = (): Character => ({
  name: '',
  portrait: 'f1',
  calling: 'vanguard',
  origin: 'academy',
  ideal: 'discovery',
  stats: { ...START_STATS },
  world: ACADEMY_WORLD,
  deathRule: 'permadeath',
});
export function validCharacter(c: Character) {
  return (
    c &&
    typeof c.name === 'string' &&
    c.name.trim().length > 0 &&
    c.name.length <= 24 &&
    PORTRAIT_IDS.includes(c.portrait) &&
    Object.hasOwn(CALLINGS, c.calling) &&
    Object.hasOwn(ORIGINS, c.origin) &&
    Object.hasOwn(IDEALS, c.ideal) &&
    typeof c.world === 'string' &&
    Boolean(worldCode(c.world)) &&
    DEATH_RULES.includes(c.deathRule) &&
    c.stats &&
    STAT_IDS.every((id) => Number.isInteger(c.stats[id]) && c.stats[id] >= 1 && c.stats[id] <= 4) &&
    STAT_IDS.reduce((sum, id) => sum + c.stats[id] - 1, 0) === CREATION_POINTS
  );
}

export function startAdventure(character: Character, id: string): Adventure | null {
  if (!validCharacter(character)) return null;
  const origin = ORIGINS[character.origin];
  const calling = CALLINGS[character.calling];
  const region = worldCode(character.world).slice(0, 14);
  const world = 'road-' + hash(region + '/' + id).toString(36) + '-' + region;
  const location = { world, x: origin.start[0], y: origin.start[1] };
  const goods = Object.fromEntries(GOOD_IDS.map((good) => [good, 0])) as Goods;
  goods.herb = 1;
  goods.tonic = 2;
  goods.lantern = 2;
  goods.ration = 2;
  goods.timber = 1;
  goods[origin.good] += 2;
  goods[calling.good] += 2;
  const weapon: Gear = {
    id: 'starting-weapon',
    slot: 'weapon',
    weapon: calling.gear,
    rarity: 'common',
    power: 2,
    found: 1,
  };
  const gear: Gear[] = [weapon];
  const equipment: Adventure['equipment'] = { weapon: weapon.id };
  if (character.origin === 'hills') {
    gear.push({ id: 'wool-coat', slot: 'coat', rarity: 'common', power: 1, found: 1 });
    equipment.coat = 'wool-coat';
  }
  const state: Adventure = {
    version: ADVENTURE_VERSION,
    id,
    revision: 0,
    character: { ...character, name: character.name.trim(), world },
    location,
    homeGate: location,
    gates: { [world]: location },
    knownTowns: { [addressKey(location)]: location },
    exploredLandmarks: {},
    townTales: {},
    time: 8,
    lastMealAt: 8,
    fallenAt: null,
    defeats: 0,
    level: 1,
    xp: 0,
    talent: 0,
    gold: character.origin === 'harbor' ? 44 : 32,
    hp: 0,
    focus: 0,
    fatigue: 0,
    inspiration: 1,
    goods,
    gear,
    equipment,
    nextGear: 1,
    workshop: {},
    friends: {},
    followers: [],
    townWork: {},
    lastGather: null,
    inspirationLessonDay: 0,
    mission: null,
    fulfilled: [],
    floors: {},
    deepest: {},
    delve: null,
    counters: {
      combats: 0,
      pacified: 0,
      guardians: 0,
      jobs: 0,
      contracts: 0,
      crafted: 0,
      harvests: 0,
      lessons: 0,
      landmarks: 0,
      trades: 0,
    },
    badges: {},
    goals: [],
    journal: [],
    rng: hash(world + '/' + id),
  };
  state.hp = maxHp(state);
  state.focus = maxFocus(state);
  note(state, [
    '旅の記録を開いた。行き先は自分で決めよう。',
    'You open your travel journal. The next page is yours.',
  ]);
  return state;
}

export const equipped = (s: Adventure, slot: Slot) =>
  s.gear.find((gear) => s.equipment[slot] === gear.id);
const wears = (s: Adventure, affix: Affix) =>
  (['weapon', 'coat', 'charm'] as Slot[]).filter((slot) => equipped(s, slot)?.affix === affix)
    .length;
export const scoreFor = (s: Adventure, stat: Stat) =>
  s.character.stats[stat] +
  (['weapon', 'coat', 'charm'] as Slot[]).filter((slot) => {
    const affix = equipped(s, slot)?.affix;
    return affix && AFFIXES[affix].stat === stat;
  }).length;
export const maxHp = (s: Adventure) =>
  20 + s.character.stats.might * 3 + s.level * 3 + wears(s, 'vigor') * 4;
export const maxFocus = (s: Adventure) =>
  5 +
  s.character.stats.insight +
  Math.floor(s.level / 2) +
  (s.character.calling === 'scholar' ? 3 : 0) +
  wears(s, 'focus') * 2 +
  (equipped(s, 'charm')?.power ?? 0);
export const armor = (s: Adventure) => (equipped(s, 'coat')?.power ?? 0) + wears(s, 'sturdy');
export const xpGoal = (level: number) => 18 + level * 8;
export const missedMeals = (s: Adventure) =>
  Math.floor(Math.max(0, s.time - s.lastMealAt) / MEAL_INTERVAL);
export const hoursUntilMeal = (s: Adventure) =>
  Math.max(0, MEAL_INTERVAL - (s.time - s.lastMealAt));
export const hungerPenalty = (s: Adventure) =>
  missedMeals(s) ? Math.min(9, 1 + 2 * missedMeals(s)) : 0;

export function advance(s: Adventure, hours: number) {
  const before = missedMeals(s);
  s.time += hours;
  const after = missedMeals(s);
  if (s.hp <= 0 || before >= after) return;
  for (let day = before + 1; day <= after && s.hp > 0; day++) {
    s.hp = Math.max(0, s.hp - Math.ceil(maxHp(s) * Math.min(0.56, 0.15 + day * 0.08)));
    s.focus = Math.max(0, s.focus - Math.ceil(maxFocus(s) * Math.min(1, 0.25 * day)));
    s.fatigue = Math.min(9, s.fatigue + 3);
  }
  note(s, [
    '食事を抜いた。体力と集中が落ち、判定が不利になった。',
    'You missed a meal. HP and Focus fell, and checks are harder.',
    'しょくじを ぬいた。たいりょくと しゅうちゅうが おち、はんていが ふりに なった。',
  ], 'risk');
}
export const recover = (s: Adventure, hp: number, focus: number) => {
  if (s.hp <= 0) return;
  const factor = missedMeals(s) >= 2 ? 0 : missedMeals(s) === 1 ? 0.35 : 1;
  s.hp = Math.min(maxHp(s), s.hp + Math.floor(hp * factor));
  s.focus = Math.min(maxFocus(s), s.focus + Math.floor(focus * factor));
};
export function finishDefeat(s: Adventure) {
  if (s.hp > 0 || s.fallenAt !== null) return false;
  s.defeats++;
  s.delve = null;
  if (s.character.deathRule === 'permadeath') {
    s.fallenAt = s.time;
    note(s, [
      'ここで旅が終わった。足跡は旅日誌に残る。',
      'Your adventure ends here. Your travels remain in the journal.',
      'ここで たびが おわった。あしあとは たびにっしに のこる。',
    ], 'risk');
  } else {
    const fee = Math.min(s.gold, 4 + Math.ceil(s.gold * 0.17));
    s.gold -= fee;
    advance(s, 7);
    s.lastMealAt = s.time;
    s.fatigue = 4;
    s.hp = Math.ceil(maxHp(s) * 0.6);
    s.focus = Math.ceil(maxFocus(s) * 0.5);
    note(s, [
      '町に運ばれ、食事と手当てを受けた。救助費 ' + fee + ' G。',
      'You were taken to town, fed and treated. Rescue cost ' + fee + ' G.',
    ], 'risk');
  }
  return true;
}
export function awardExperience(s: Adventure, xp: number) {
  s.xp += xp;
  while (s.xp >= xpGoal(s.level)) {
    s.xp -= xpGoal(s.level);
    s.level++;
    s.talent++;
    recover(s, 8, 4);
    note(
      s,
      [
        `レベル${s.level}。能力を伸ばすポイントを1獲得した。`,
        `Level ${s.level}. You gained one attribute point.`,
      ],
      'good',
    );
  }
}
export function note(s: Adventure, copy: Text, tone: Journal['tone'] = 'story', check?: Check) {
  s.journal.unshift({ text: copy, dayHour: s.time, tone, ...(check ? { check } : {}) });
  if (s.journal.length > 36) s.journal.length = 36;
}
export function nextRandom(s: Adventure, max: number) {
  s.rng = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
  return Math.floor((s.rng / 4294967296) * max);
}

export const checkBonus = (s: Adventure, stat: Stat) =>
  scoreFor(s, stat) +
  (CALLINGS[s.character.calling].stat === stat ? 2 : 0) +
  Math.floor((s.level - 1) / 3) -
  Math.min(3, Math.floor(s.fatigue / 3)) -
  hungerPenalty(s) +
  (s.followers.some(
    (id) =>
      s.friends[id]?.resident.role &&
      ((stat === 'insight' && s.friends[id].resident.role === 'reader') ||
        (stat === 'presence' && s.friends[id].resident.role === 'broker')),
  )
    ? 1
    : 0);
export function rollCheck(
  s: Adventure,
  stat: Stat,
  target: number,
  spendInspiration = false,
  mod = 0,
): Check {
  const inspiration = spendInspiration && s.inspiration > 0;
  if (inspiration) s.inspiration--;
  const faces = [1 + nextRandom(s, 20)];
  if (inspiration) faces.push(1 + nextRandom(s, 20));
  const natural = Math.max(...faces);
  const bonus = checkBonus(s, stat) + mod;
  const total = natural + bonus;
  const outcome =
    natural === 20
      ? 'critical'
      : natural === 1
        ? 'fail'
        : total >= target
          ? 'success'
          : total >= target - 2
            ? 'partial'
            : 'fail';
  return { stat, faces, natural, bonus, total, target, outcome, inspiration };
}
export const succeeded = (check: Check) =>
  check.outcome === 'success' || check.outcome === 'critical';
export const awardInspiration = (s: Adventure) => {
  s.inspiration = Math.min(s.inspiration + 1, 5);
};

export function affordable(s: Adventure, costs: Partial<Goods>) {
  return GOOD_IDS.every((good) => s.goods[good] >= (costs[good] ?? 0));
}
export function spendGoods(s: Adventure, costs: Partial<Goods>) {
  if (!affordable(s, costs)) return false;
  for (const good of GOOD_IDS) s.goods[good] -= costs[good] ?? 0;
  return true;
}

export function gearLabel(gear: Gear, base: Text, affix?: Text): Text {
  return [(affix ? affix[0] + 'の' : '') + base[0], (affix ? affix[1] + ' ' : '') + base[1]];
}
