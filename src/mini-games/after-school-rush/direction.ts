import type { AttackEffectKey } from '../../types';
import type { MiniRushCue } from '../../services/miniRushSound';
import type { Entry } from './catalog';
import type { Copy } from './rules';
import { visualFor, type Motion } from './visuals';

type Voice = readonly [path: string, duration: number];
type Cast = {
  name: Copy;
  cheer: Voice;
  retry: Voice;
  effort?: Voice;
};

const story = (role: string, clip: string, duration: number): Voice =>
  [`sfx/high-school-voices/${role}/${clip}.ogg`, duration];
const dash = (actor: string, clip: string, duration: number): Voice =>
  [`sfx/go-home-dash/${actor}/${clip}.ogg`, duration];

const CAST = {
  'high-school-warrior': {
    name: ['叛逆の高校生', 'Rebellious High Schooler', 'はんぎゃくの こうこうせい'],
    cheer: dash('high-school-warrior', 'upgrade', 1680), retry: story('WARRIOR', 'damage-4', 1000),
    effort: dash('high-school-warrior', 'jump', 1400),
  },
  'high-school-caretaker': {
    name: ['生物部の先輩', 'Biology Club Mentor', 'せいぶつぶの せんぱい'],
    cheer: story('CARETAKER', 'finish-1', 1850), retry: story('CARETAKER', 'damage-3', 1000),
  },
  'high-school-assassin': {
    name: ['謎めく転入生', 'Mysterious Transfer Student', 'なぞめく てんにゅうせい'],
    cheer: dash('high-school-assassin', 'upgrade', 2200), retry: story('ASSASSIN', 'damage-3', 1000),
  },
  'high-school-chef': {
    name: ['学食の料理長', 'Cafeteria Chef', 'がくしょくの りょうりちょう'],
    cheer: story('CHEF', 'finish-1', 1500), retry: story('CHEF', 'damage-4', 1000),
  },
  'high-school-gardener': {
    name: ['園芸部部長', 'Gardening Club Captain', 'えんげいぶ ぶちょう'],
    cheer: story('GARDENER', 'finish-1', 1500), retry: story('GARDENER', 'damage-5', 1000),
  },
  'high-school-librarian': {
    name: ['文芸部書記', 'Literary Club Secretary', 'ぶんげいぶ しょき'],
    cheer: dash('high-school-librarian', 'upgrade', 2080), retry: story('LIBRARIAN', 'damage-4', 1350),
  },
  'high-school-mage': {
    name: ['化学研究会長', 'Chemistry Club President', 'かがくけんきゅう かいちょう'],
    cheer: story('MAGE', 'finish-1', 1500), retry: story('MAGE', 'damage-5', 1450),
    effort: story('MAGE', 'attack-1', 1350),
  },
  'high-school-dodgeball': {
    name: ['バスケ部エース', 'Basketball Ace', 'バスケぶ エース'],
    cheer: story('DODGEBALL', 'finish-5', 1500), retry: story('DODGEBALL', 'damage-3', 1000),
    effort: story('DODGEBALL', 'attack-1', 1050),
  },
  'high-school-bard': {
    name: ['放送部ディレクター', 'Broadcast Club Director', 'ほうそうぶ ディレクター'],
    cheer: dash('high-school-bard', 'upgrade', 1560), retry: dash('high-school-bard', 'damage', 1360),
    effort: dash('high-school-bard', 'jump', 1600),
  },
  'magic-shizuku': {
    name: ['水城しずく', 'Shizuku Mizuki', 'みずき しずく'],
    cheer: ['sfx/dungeons-chronicles/magic-shizuku/win.ogg', 2100], retry: dash('magic-shizuku', 'defeat', 2200),
  },
  'magic-koharu': {
    name: ['風森こはる', 'Koharu Kazamori', 'かざもり こはる'],
    cheer: dash('magic-koharu', 'upgrade', 1720), retry: dash('magic-koharu', 'defeat', 1840),
    effort: dash('magic-koharu', 'flight', 2040),
  },
  'magic-akari': {
    name: ['星宮あかり', 'Akari Hoshimiya', 'ほしみや あかり'],
    cheer: dash('magic-akari', 'upgrade', 1600), retry: dash('magic-akari', 'defeat', 1520),
    effort: dash('magic-akari', 'jump', 800),
  },
} satisfies Record<string, Cast>;

export type CastId = keyof typeof CAST;
const CHAPTER_CAST: readonly CastId[] = [
  'high-school-warrior', 'high-school-caretaker', 'high-school-chef', 'high-school-gardener',
  'high-school-librarian', 'high-school-mage', 'high-school-dodgeball', 'high-school-bard',
  'magic-shizuku', 'magic-akari',
];

const GUESTS: Readonly<Partial<Record<string, CastId>>> = {
  'gate/shadow-step': 'high-school-assassin',
  'yard/crosswind-lap': 'high-school-warrior',
  'yard/jump-rope-gap': 'high-school-warrior',
  'yard/high-five': 'high-school-warrior',
  'yard/shoe-grid': 'high-school-warrior',
  'yard/puddle-skip': 'high-school-warrior',
  'yard/cone-slalom': 'high-school-warrior',
  'yard/tag-safety': 'high-school-warrior',
  'library/whisper-watch': 'high-school-assassin',
  'roof/launch-glider': 'magic-koharu',
  'roof/thermal-updraft': 'magic-koharu',
};

export function chapterCast(chapter: number) {
  return CHAPTER_CAST[chapter];
}

export function castFor(entry: Entry) {
  const id = GUESTS[entry.key] ?? chapterCast(entry.chapter);
  const cast: Cast = CAST[id];
  return { id, ...cast };
}

export type Pose = 'idle' | 'walk' | 'jump' | 'duck' | 'strike' | 'throw' | 'swing' | 'read' | 'use' | 'aim' | 'win' | 'miss';
type Direction = {
  pose: Pose;
  cue: MiniRushCue;
  effect?: AttackEffectKey;
  effort?: boolean;
};

const MOTIONS: Readonly<Record<Motion, Direction>> = {
  connect: { pose: 'use', cue: 'snap' },
  cut: { pose: 'swing', cue: 'snip' },
  draw: { pose: 'use', cue: 'paper' },
  drop: { pose: 'throw', cue: 'drop' },
  fill: { pose: 'use', cue: 'water' },
  flip: { pose: 'use', cue: 'paper' },
  fold: { pose: 'use', cue: 'paper' },
  insert: { pose: 'use', cue: 'snap' },
  leap: { pose: 'jump', cue: 'jump', effect: 'wind', effort: true },
  pick: { pose: 'use', cue: 'collect' },
  plant: { pose: 'use', cue: 'drop', effect: 'plant' },
  reveal: { pose: 'read', cue: 'paper' },
  scan: { pose: 'read', cue: 'snap' },
  shoot: { pose: 'throw', cue: 'shot', effect: 'projectile', effort: true },
  signal: { pose: 'use', cue: 'bell', effect: 'flash' },
  slide: { pose: 'use', cue: 'brush' },
  split: { pose: 'use', cue: 'snip' },
  squeeze: { pose: 'use', cue: 'water' },
  stack: { pose: 'use', cue: 'drop' },
  strike: { pose: 'swing', cue: 'tap', effect: 'impact' },
  swap: { pose: 'use', cue: 'brush' },
  turn: { pose: 'use', cue: 'snap' },
  walk: { pose: 'walk', cue: 'step' },
};

export function directionFor(entry: Entry, index: number): Direction {
  if (entry.game.action) {
    const family = entry.game.action.family;
    if (index === 5) return { pose: 'duck', cue: family === 'rhythm' ? 'beat' : 'dodge' };
    if (['run', 'climb', 'hurdles', 'flap'].includes(family)) return MOTIONS.leap;
    if (['aim', 'throw'].includes(family)) return MOTIONS.shoot;
    if (family === 'duel') return MOTIONS.strike;
    if (family === 'rhythm') return { pose: 'use', cue: 'beat' };
    if (family === 'sweep') return { pose: 'use', cue: 'brush' };
    if (family === 'push') return { pose: 'use', cue: 'gravel' };
    if (family === 'carry') return { pose: 'use', cue: 'drop' };
    if (['collect', 'dodge', 'chase'].includes(family)) return { pose: 'duck', cue: 'dodge' };
    return MOTIONS.pick;
  }
  return MOTIONS[visualFor(entry)[3]];
}
