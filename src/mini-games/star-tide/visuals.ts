/** Shipped sprite layouts. Indices are shared by rendering and asset verification. */
export const HEROES = [
  { id: 'nagi', ja: 'ナギ', en: 'Nagi', role: '航海士', roleEn: 'Navigator' },
  { id: 'mio', ja: 'ミオ', en: 'Mio', role: '森の案内人', roleEn: 'Forest scout' },
  { id: 'sena', ja: 'セナ', en: 'Sena', role: '修理工', roleEn: 'Mechanic' },
] as const;
export type HeroId = typeof HEROES[number]['id'];
export const heroId = (value: unknown): HeroId =>
  HEROES.some(h => h.id === value) ? value as HeroId : 'nagi';

export type EnemyBehavior = 'pursue' | 'orbit' | 'charge' | 'ranged' | 'hop' | 'sentry';
export const ENEMIES: { ja: string; en: string; behavior: EnemyBehavior; speed: number; sheet: number; row: number }[] = [
  ['珊瑚ヤドカリ', 'Coral hermit', 'charge', .8],
  ['潮ゼリー', 'Tide jelly', 'hop', .85],
  ['月翅モス', 'Moon moth', 'orbit', 1.1],
  ['苔岩ゴーレム', 'Moss golem', 'pursue', .65],
  ['木の葉キツネ', 'Leaf fox', 'charge', 1.1],
  ['星灯ウィスプ', 'Star wisp', 'ranged', .7],
  ['殻鎧の衛兵', 'Shell guard', 'sentry', .75],
  ['牙花ランナー', 'Fangbloom', 'ranged', .6],
  ['霜冠オオカミ', 'Frost wolf', 'charge', 1.1],
  ['氷晶コウモリ', 'Ice bat', 'orbit', 1.15],
  ['火種トカゲ', 'Ember lizard', 'ranged', .8],
  ['熔岩ダンゴムシ', 'Lava pillbug', 'charge', .9],
  ['夜光クラゲ', 'Lantern jellyfish', 'hop', .8],
  ['影帆エイ', 'Shadow manta', 'orbit', 1],
  ['砂時計サソリ', 'Hourglass scorpion', 'sentry', .85],
  ['星砂タマムシ', 'Starsand beetle', 'pursue', .9],
  ['雨傘キノコ', 'Raincap', 'hop', .85],
  ['水路の機兵', 'Canal automaton', 'sentry', .65],
  ['雲尾グリフォン', 'Cloudtail gryphon', 'charge', 1.1],
  ['風鈴ハーピー', 'Windchime harpy', 'ranged', .8],
  ['月鏡の人形', 'Moonmirror doll', 'sentry', .7],
  ['書架ミミック', 'Archive mimic', 'hop', .85],
  ['暁冠の狛犬', 'Dawn hound', 'pursue', 1],
  ['星軌の球体', 'Orbit sentinel', 'ranged', .75],
].map(([ja, en, behavior, speed], i) => ({
  ja: String(ja), en: String(en), behavior: behavior as EnemyBehavior,
  speed: Number(speed), sheet: Math.floor(i / 8), row: i % 8,
}));

// Each region has its own residents; all 24 species occur in the actual campaign.
export const ENEMY_POOLS = [
  [0, 1, 2, 6], [3, 4, 7, 2], [1, 5, 0, 15], [4, 6, 14, 3],
  [8, 9, 20, 3], [10, 11, 6, 23], [12, 13, 5, 2], [14, 15, 4, 11],
  [16, 17, 1, 12], [18, 19, 9, 13], [20, 21, 17, 5], [22, 23, 18, 20],
] as const;
export function enemyKind(chapter: number, room: number, index: number) {
  const pool = ENEMY_POOLS[chapter];
  return pool[(room + index) % pool.length];
}

export type Biome = { ja: string; en: string; row: number; variant: number; ambient: string; particle: string };
const BIOME_NAMES = [
  ['潮風の花原', 'Seabreeze meadow', '珊瑚の渚', 'Coral strand', '#d5f1b0', '#ffdcbe'],
  ['木漏れ日の森', 'Sunbeam woods', '苔むす古樹林', 'Ancient mosswood', '#bed599', '#d3e48d'],
  ['葦の水辺', 'Reedwater marsh', '硝子の塩原', 'Glass salt flats', '#c3eded', '#d2f6ff'],
  ['黄金の丘陵', 'Golden hills', '落葉の並木道', 'Autumn avenue', '#f8d497', '#db874e'],
  ['霜花の高原', 'Frostflower heights', '氷晶の渓流', 'Crystal ice gorge', '#d5ebff', '#e0f3ff'],
  ['黒曜の岩原', 'Obsidian wastes', '熾火の溶岩地', 'Ember caldera', '#f3ae7d', '#ff9a5c'],
  ['夜光の磯', 'Luminous shore', '藍影の林', 'Indigo shadow grove', '#a4b5ec', '#91ffde'],
  ['星砂の砂丘', 'Starsand dunes', '緑陰のオアシス', 'Shaded oasis', '#f4d9a3', '#fce8ab'],
  ['雨煙の水路', 'Rainmist canals', '石畳の庭園', 'Rainbell gardens', '#bccfe0', '#b0e6f3'],
  ['風花の浮島', 'Windflower isle', '雲海の遺跡', 'Cloudsea ruins', '#e2f2cf', '#e7f6ff'],
  ['月影の石庭', 'Moonshadow garden', '星屑の廃宮', 'Stardust palace', '#c1b7e2', '#d9c9ff'],
  ['暁光の草原', 'Dawnlight meadow', '白金の聖域', 'Platinum sanctuary', '#ffe8be', '#fff0b9'],
];
export const BIOMES: Biome[] = BIOME_NAMES.flatMap((n, row) => [0, 1].map(variant => ({
  ja: n[variant * 2], en: n[variant * 2 + 1], row, variant, ambient: n[4], particle: n[5],
})));
export function biomeFor(chapter: number, room: number): Biome {
  return BIOMES[chapter * 2 + (room % 4 >= 2 ? 1 : 0)];
}

export function visualHash(chapter: number, room: number, x: number, y: number) {
  let n = Math.imul(chapter + 1, 374761393) ^ Math.imul(room + 1, 668265263)
    ^ Math.imul(x + 1, 1274126177) ^ Math.imul(y + 1, 2246822519);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return (n ^ n >>> 16) >>> 0;
}

export type HeroMotion = { moving: boolean; walk: number; attack: number; effect: number; dash: number; hurt: number; gliding: boolean; time: number; dx: number; dy: number };
/** Local action clocks, never wall time: pausing does not advance an animation. */
export function heroFrame(w: HeroMotion) {
  if (w.dash > 0) return { row: 6, frame: Math.min(5, Math.floor((.22 - w.dash) / .22 * 6)), flip: w.dx < 0 };
  if (w.gliding) return { row: 7, frame: Math.floor(w.walk * 8) % 3, flip: w.dx < 0 };
  if (w.attack > 0) {
    const duration = w.effect ? .55 : .32;
    const vertical = Math.abs(w.dy) > Math.abs(w.dx);
    return { row: vertical ? (w.effect ? 2 : 0) + (w.dy < 0 ? 1 : 0) : w.effect ? 5 : 4,
      frame: Math.min(5, Math.floor((duration - w.attack) / duration * 6)), flip: !vertical && w.dx < 0, vertical };
  }
  // Shield invulnerability shares the hurt timer, but must retain its tool pose.
  if (w.hurt > .35) return { row: 7, frame: 3 + Math.floor(w.time * 10) % 3, flip: w.dx < 0 };
  const row = Math.abs(w.dy) > Math.abs(w.dx) ? w.dy < 0 ? 1 : 0 : w.dx < 0 ? 3 : 2;
  return { row, frame: w.moving ? Math.floor(w.walk * 10) % 6 : 0, flip: false };
}

export const UPGRADE_SHEETS = [
  { id: 'hero-nagi', columns: 6, rows: 8, transparent: true },
  { id: 'hero-mio', columns: 6, rows: 8, transparent: true },
  { id: 'hero-sena', columns: 6, rows: 8, transparent: true },
  { id: 'hero-nagi-vertical', columns: 6, rows: 4, transparent: true },
  { id: 'hero-mio-vertical', columns: 6, rows: 4, transparent: true },
  { id: 'hero-sena-vertical', columns: 6, rows: 4, transparent: true },
  { id: 'enemies-a', columns: 6, rows: 8, transparent: true },
  { id: 'enemies-b', columns: 6, rows: 8, transparent: true },
  { id: 'enemies-c', columns: 6, rows: 8, transparent: true },
  { id: 'terrain', columns: 8, rows: 12, transparent: false },
  { id: 'props', columns: 8, rows: 12, transparent: true },
  { id: 'boss-motion', columns: 8, rows: 6, transparent: true },
  { id: 'floors', columns: 6, rows: 4, transparent: false },
  { id: 'shore-rounding', columns: 8, rows: 12, transparent: true },
  { id: 'cliff-rounding', columns: 8, rows: 12, transparent: true },
] as const;
