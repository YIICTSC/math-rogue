import type { AttackEffectKey } from '../../types';
import type { MiniRushCue } from '../../services/miniRushSound';
import type { Entry } from './catalog';
import type { Copy } from './rules';
import sportsVoiceDurations from '../../data/sportsVoiceDurations.json';
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

export type RushAudioEvent = 'start' | 'action' | 'score' | 'hurt' | 'clear';
export type RushFoley = { path: string; duration: number; fallback: MiniRushCue };
const foley = (name: string, duration = 400, fallback: MiniRushCue = 'tap'): RushFoley => ({ path: `sfx/${name}.mp3`, duration, fallback });

/** Original recordings from the sport, fishing, crafting and battle games. The
 * caller plays them only after the corresponding action/state was accepted. */
export function soundFor(entry: Entry, event: RushAudioEvent, index = 4): RushFoley | undefined {
  const family = entry.game.action?.family, secondary = index === 5;
  const sport = family === 'bat' ? 'baseball' : family === 'soccer' ? 'soccer' : family === 'volley' || family === 'rally' ? 'volleyball' : undefined;
  if (sport) return foley(`academy-sports/${sport}/${event === 'start' ? 'whistle' : event === 'hurt' ? 'hurt' : event === 'clear' ? 'score' : event === 'score' ? 'hit' : secondary && family === 'volley' ? 'special' : 'hit'}`, event === 'clear' ? 700 : 350, event === 'clear' ? 'collect' : 'tap');
  if (family === 'golf') return event === 'clear' || event === 'score' ? foley('golf/cup', 650, 'collect')
    : event === 'hurt' ? foley('golf/ob', 400, 'tap') : event === 'start' ? foley('golf/start', 550, 'ready') : foley(secondary ? 'golf/putt' : 'golf/swing', 450, 'shot');
  if (family === 'fishing') return foley(`rpg-fishing/${event === 'start' ? 'cast' : event === 'clear' ? 'catch' : event === 'score' ? 'perfect' : event === 'hurt' ? 'miss' : secondary ? 'bite' : 'reel'}`, event === 'clear' ? 850 : 400, event === 'clear' || event === 'score' ? 'collect' : 'water');
  if (family === 'mining') return event === 'start' ? undefined : foley(event === 'clear' ? 'rpg-life/craft' : event === 'score' ? 'rpg-games/dozer-gem' : event === 'hurt' ? 'rpg-games/miss' : 'rpg-life/mine', event === 'clear' ? 650 : 300, event === 'score' ? 'collect' : 'gravel');
  if (family === 'kart') return event === 'action' ? foley('rpg-games/race-move', 300, secondary ? 'gravel' : 'dodge') : event === 'clear' ? foley('academy-sports/festival/score', 700, 'collect') : undefined;
  if (family === 'parry' || family === 'duel') return event === 'action' ? foley(`attack-effects/${secondary ? 'flash' : 'slash'}`, 250, secondary ? 'spark' : 'tap') : event === 'score' ? foley('attack-effects/critical', 300, 'snap') : undefined;
  if (family === 'grapple') return event === 'action' ? foley(`attack-effects/${secondary ? 'wind' : 'projectile'}`, 300, 'jump') : event === 'score' || event === 'clear' ? foley('rpg-games/relic', 450, 'collect') : undefined;
  if (event !== 'action') return undefined;
  if (family === 'aim' || family === 'throw') return foley('attack-effects/projectile', 220, 'shot');
  if (family === 'rhythm') return foley(`rpg-games/maou-rhythm-${secondary ? 'snare' : 'kick'}`, 200, 'beat');
  if (family === 'sweep') return foley('rpg-life/gather', 200, 'brush');
  return undefined;
}

// Milliseconds measured from the reused files with ffprobe. Keeping the source
// actor in every path prevents a guest action from speaking in another voice.
const REUSED_VOICE_MS: Record<CastId, readonly [number, number, number, number]> = {
  'high-school-warrior': [1860, 2080, 1800, 1960], 'high-school-caretaker': [1348, 1870, 1360, 1880],
  'high-school-assassin': [1860, 2080, 2200, 2200], 'high-school-chef': [1853, 2080, 3123, 2880],
  'high-school-gardener': [2080, 2080, 1720, 1720], 'high-school-librarian': [1842, 1874, 1680, 2080],
  'high-school-mage': [2041, 2046, 1280, 1880], 'high-school-dodgeball': [1874, 2080, 1200, 1760],
  'high-school-bard': [2056, 2080, 1440, 1640], 'magic-shizuku': [1386, 2080, 1960, 2840],
  'magic-koharu': [1347, 2080, 1640, 2040], 'magic-akari': [1500, 2080, 1240, 1520],
};
export function actionVoiceFor(entry: Entry, index = 4): Voice | undefined {
  const cast = castFor(entry), family = entry.game.action?.family;
  const sport = family === 'bat' || family === 'golf' ? 'golf' : family === 'rally' || family === 'volley' ? 'tennis' : family === 'soccer' ? 'basketball' : undefined;
  if (sport) {
    const key = `${cast.id}/${sport}/action`, duration = (sportsVoiceDurations as Record<string, number>)[key];
    if (duration) return [`sfx/sports/${key}.ogg`, duration];
  }
  if (index === 5 && family !== 'mining') return undefined;
  if (family === 'kart' || family === 'grapple') return dash(cast.id, family === 'kart' ? 'dash' : 'flight', REUSED_VOICE_MS[cast.id][family === 'kart' ? 2 : 3]);
  if (family === 'parry' || family === 'mining' || family === 'fishing') {
    const attack = family === 'parry';
    return [`sfx/dungeons-chronicles/${cast.id}/${attack ? 'attack' : 'use'}.ogg`, REUSED_VOICE_MS[cast.id][attack ? 0 : 1]];
  }
  return cast.effort;
}

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
    if (family === 'bat' || family === 'rally' || family === 'golf') return { pose: 'swing', cue: 'shot', effect: 'impact', effort: true };
    if (family === 'soccer' || family === 'volley') return { pose: 'throw', cue: index === 5 ? 'jump' : 'shot', effect: 'projectile', effort: true };
    if (family === 'kart') return { pose: index === 5 ? 'duck' : 'walk', cue: index === 5 ? 'gravel' : 'dodge', effect: index === 5 ? undefined : 'wind', effort: index !== 5 };
    if (family === 'parry') return { pose: index === 5 ? 'use' : 'strike', cue: index === 5 ? 'spark' : 'tap', effect: index === 5 ? 'flash' : 'slash', effort: index !== 5 };
    if (family === 'grapple') return { pose: 'jump', cue: 'jump', effect: 'wind', effort: index !== 5 };
    if (family === 'fishing') return { pose: 'use', cue: 'water', effort: index !== 5 };
    if (family === 'mining') return { pose: 'strike', cue: 'gravel', effect: index === 5 ? 'shockwave' : 'impact', effort: true };
    if (index === 5) return family === 'rhythm' ? { pose: 'use', cue: 'beat' }
      : ['run', 'climb', 'catch', 'chase'].includes(family) ? { pose: 'walk', cue: 'dodge', effect: 'wind' }
        : ['duel', 'collect', 'dodge'].includes(family) ? { pose: 'use', cue: 'spark', effect: 'flash' }
          : family === 'hurdles' ? { pose: 'duck', cue: 'dodge' } : { pose: 'use', cue: 'snap' };
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
