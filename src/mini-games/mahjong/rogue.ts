import { countsOf, makeWall, shuffled, sorted, terminal, Tile } from './tiles';
export type Bank = { kind: 'sequence' | 'triplet' | 'quad' | 'pair'; tiles: Tile[] };
export const PATTERNS = [
  { id: 'sequence', name: '順子の教本', description: '順子1組ごとに倍率を加算。', fan: 1 },
  { id: 'triplet', name: '刻子の教本', description: '刻子・槓子1組ごとに倍率を加算。', fan: 1 },
  { id: 'simple', name: '断么の教本', description: '2〜8だけの組ごとに倍率を加算。', fan: 1 },
  { id: 'honor', name: '字牌の教本', description: '字牌の組ごとに倍率を加算。', fan: 2 },
  { id: 'color', name: '染め手の教本', description: '全体が一色なら倍率を加算。字牌混在も可能。', fan: 4 },
  { id: 'flower', name: '花の教本', description: '抜いた花牌1枚ごとに倍率を加算。', fan: 1 },
] as const;
export const RELICS = [
  { id: 'compass', name: '連番の羅針盤', description: '順子1組につき基礎点＋40。' },
  { id: 'ink', name: '三つ墨', description: '刻子・槓子1組につき基礎点＋55。' },
  { id: 'garden', name: '季節のしおり', description: '花牌1枚につき基礎点＋60。' },
  { id: 'prism', name: '三色プリズム', description: '萬・筒・索が全部あれば最終得点×2。' },
  { id: 'mirror', name: '同色の鏡', description: '数牌が一色なら最終得点×2。' },
  { id: 'reserve', name: '長考の砂時計', description: '各関門の交換回数＋2。' },
  { id: 'gold', name: '金箔の筆箱', description: '金箔牌1枚につき基礎点＋70。' },
  { id: 'echo', name: '復習の鐘', description: '成立した教本が3種類以上なら最終得点×2。' },
  { id: 'wind', name: '四方の風見', description: '字牌1枚につき基礎点＋25。' },
  { id: 'savings', name: '余白のノート', description: '残った交換回数1回につき基礎点＋25。' },
] as const;
export type RelicId = typeof RELICS[number]['id'];
export type Offer = { id: string; kind: 'relic' | 'pattern' | 'foil' | 'copy' | 'remove' | 'tool'; target?: string; price: number; sold?: boolean };
export type Rogue = {
  version: 2; deck: Tile[]; wall: Tile[]; hand: Tile[]; banks: Bank[]; flowers: Tile[]; discards: Tile[];
  stage: number; coins: number; exchanges: number; relics: RelicId[]; levels: Record<string, number>; tools: number;
  phase: 'play' | 'shop' | 'lost' | 'won'; offers: Offer[]; score: number; total: number; best: number; last?: RogueScore;
};
export type RogueScore = { chips: number; mult: number; factor: number; total: number; lines: { name: string; value: number }[] };
export const GOALS = [600, 1000, 1600, 2500, 4000, 6500, 10000, 16000];
export const rogueGoal = (stage: number) => GOALS[Math.min(stage - 1, 7)] * 2 ** Math.max(0, stage - 8);
export const bossRule = (stage: number) => stage % 6 === 0 ? '封印：字牌の教本の倍率が0。' : stage % 3 === 0 ? '封印：花の教本の倍率が0。' : '';
export function classify(tiles: Tile[]): Bank['kind'] | null {
  if (tiles.some(t => t.type >= 34) || new Set(tiles.map(t => t.id)).size !== tiles.length) return null;
  const values = tiles.map(t => t.type).sort((a, b) => a - b);
  if (values.length === 2 && values[0] === values[1]) return 'pair';
  if (values.length === 3 && values.every(t => t === values[0])) return 'triplet';
  if (values.length === 4 && values.every(t => t === values[0])) return 'quad';
  if (values.length === 3 && values[0] < 27 && values[0] % 9 <= 6 && values[1] === values[0] + 1 && values[2] === values[0] + 2) return 'sequence';
  return null;
}
function replenish(state: Rogue) {
  while (state.hand.length < 16 && state.wall.length) {
    const t = state.wall.shift()!;
    if (t.type >= 34) state.flowers.push(t); else state.hand.push(t);
  }
  state.hand = sorted(state.hand);
}
function startStage(state: Rogue, random = Math.random): Rogue {
  state.wall = shuffled(state.deck.map(t => ({ ...t })), random); state.hand = []; state.banks = []; state.flowers = []; state.discards = [];
  state.exchanges = 4 + (state.relics.includes('reserve') ? 2 : 0); state.phase = 'play'; state.score = 0; state.offers = [];
  replenish(state); return state;
}
export function createRogue(random = Math.random): Rogue {
  const deck = [...makeWall(random), ...Array.from({ length: 8 }, (_, n) => ({ id: `flower-${n}`, type: 34 + n }))];
  return startStage({ version: 2, deck, stage: 1, coins: 0, exchanges: 4, relics: [], levels: Object.fromEntries(PATTERNS.map(p => [p.id, 1])), tools: 2, phase: 'play', offers: [], hand: [], banks: [], flowers: [], discards: [], wall: [], score: 0, total: 0, best: 0 }, random);
}
export function rogueScore(state: Rogue): RogueScore {
  const all = state.banks.flatMap(b => b.tiles), suits = new Set(all.filter(t => t.type < 27).map(t => Math.floor(t.type / 9)));
  const n = (kind: Bank['kind']) => state.banks.filter(b => b.kind === kind).length;
  const values: Record<string, number> = {
    sequence: n('sequence'), triplet: n('triplet') + n('quad'), simple: state.banks.filter(b => b.tiles.every(t => !terminal(t.type))).length,
    honor: state.banks.filter(b => b.tiles.every(t => t.type >= 27)).length, color: suits.size === 1 ? 1 : 0, flower: state.flowers.length,
  };
  if (state.stage % 3 === 0) values.flower = 0;
  if (state.stage % 6 === 0) values.honor = 0;
  const lines = PATTERNS.filter(p => values[p.id]).map(p => ({ name: p.name, value: values[p.id] * p.fan * state.levels[p.id] }));
  let chips = 40 + all.reduce((a, t) => a + (t.type < 27 ? t.type % 9 + 1 : 10) * 2 + (t.foil ? 35 : 0), 0) + n('sequence') * 25 + n('triplet') * 40 + n('quad') * 70 + n('pair') * 15 + state.flowers.length * 25;
  const has = (id: RelicId) => state.relics.includes(id);
  if (has('compass')) chips += n('sequence') * 40;
  if (has('ink')) chips += (n('triplet') + n('quad')) * 55;
  if (has('garden')) chips += state.flowers.length * 60;
  if (has('gold')) chips += all.filter(t => t.foil).length * 70;
  if (has('wind')) chips += all.filter(t => t.type >= 27).length * 25;
  if (has('savings')) chips += state.exchanges * 25;
  const mult = 1 + lines.reduce((a, p) => a + p.value, 0);
  let factor = 1;
  if (has('prism') && suits.size === 3) factor *= 2;
  if (has('mirror') && suits.size === 1) factor *= 2;
  if (has('echo') && lines.length >= 3) factor *= 2;
  return { chips, mult, factor, total: chips * mult * factor, lines };
}
function shopOffers(state: Rogue): Offer[] {
  const relics: Offer[] = shuffled(RELICS.filter(r => !state.relics.includes(r.id))).slice(0, 2).map(r => ({ id: `relic-${r.id}`, kind: 'relic', target: r.id, price: 9 }));
  const patterns: Offer[] = shuffled([...PATTERNS]).slice(0, 2).map(p => ({ id: `pattern-${p.id}`, kind: 'pattern', target: p.id, price: 5 }));
  return [...relics, ...patterns, { id: 'foil', kind: 'foil', price: 4 }, { id: 'copy', kind: 'copy', price: 4 }, { id: 'remove', kind: 'remove', price: 3 }, { id: 'tool', kind: 'tool', price: 4 }];
}
export type RogueAction = { type: 'bank' | 'exchange' | 'tool'; ids: string[] } | { type: 'buy'; id: string; targetId?: string } | { type: 'next' } | { type: 'settle' };
export function rogueStep(original: Rogue, action: RogueAction): Rogue {
  const s: Rogue = structuredClone(original);
  if (action.type === 'next') {
    if (s.phase !== 'shop' && s.phase !== 'won') return original;
    s.stage++; return startStage(s);
  }
  if (action.type === 'buy') {
    if (s.phase !== 'shop') return original;
    const o = s.offers.find(o => o.id === action.id && !o.sold);
    if (!o || s.coins < o.price) return original;
    const target = s.deck.find(t => t.id === action.targetId);
    if (['foil', 'copy', 'remove'].includes(o.kind) && (!target || target.type >= 34)) return original;
    if (o.kind === 'relic') { if (s.relics.includes(o.target as RelicId) || s.relics.length >= 8) return original; s.relics.push(o.target as RelicId); }
    if (o.kind === 'pattern') s.levels[o.target!]++;
    if (o.kind === 'foil') { if (target!.foil) return original; target!.foil = true; }
    if (o.kind === 'copy') s.deck.push({ ...target!, id: `${target!.id}-copy-${s.stage}` });
    if (o.kind === 'remove') { if (s.deck.filter(t => t.type < 34).length <= 50) return original; s.deck = s.deck.filter(t => t.id !== target!.id); }
    if (o.kind === 'tool') s.tools++;
    o.sold = true; s.coins -= o.price; return s;
  }
  if (s.phase !== 'play') return original;
  if (action.type === 'settle') { s.last = rogueScore(s); s.score = s.last.total; s.phase = 'lost'; return s; }
  const ids = [...new Set(action.ids)], tiles = ids.map(id => s.hand.find(t => t.id === id));
  if (tiles.some(t => !t)) return original;
  if (action.type === 'exchange') {
    if (!s.exchanges || !ids.length || ids.length > 5 || s.wall.length < ids.length) return original;
    s.exchanges--; s.discards.push(...tiles as Tile[]); s.hand = s.hand.filter(t => !ids.includes(t.id)); replenish(s); return s;
  }
  if (action.type === 'tool') {
    if (!s.tools || tiles.length !== 1) return original;
    const tile = tiles[0]!; if (tile.type >= 27) return original;
    // Original consumable: rotate a single numbered tile within its suit for this gate only.
    tile.type = Math.floor(tile.type / 9) * 9 + (tile.type + 1) % 9; s.tools--; s.hand = sorted(s.hand); return s;
  }
  const kind = classify(tiles as Tile[]);
  if (!kind || (kind === 'pair' ? s.banks.some(b => b.kind === 'pair') : s.banks.filter(b => b.kind !== 'pair').length >= 4)) return original;
  s.banks.push({ kind, tiles: tiles as Tile[] }); s.hand = s.hand.filter(t => !ids.includes(t.id));
  if (s.banks.length === 5) {
    s.last = rogueScore(s); s.score = s.last.total; s.total += s.score; s.best = Math.max(s.best, s.score);
    if (s.score < rogueGoal(s.stage)) s.phase = 'lost';
    else { s.coins += 12 + Math.min(s.exchanges, 4) * 2; s.phase = s.stage === 8 ? 'won' : 'shop'; s.offers = shopOffers(s); }
  } else replenish(s);
  return s;
}
export function bankHint(hand: Tile[], banks: Bank[]): string[] {
  const c = countsOf(hand), find = (types: number[]) => { const available = [...hand], ids: string[] = []; for (const type of types) { const i = available.findIndex(t => t.type === type); if (i < 0) return []; ids.push(available[i].id); available.splice(i, 1); } return ids; };
  if (banks.filter(b => b.kind !== 'pair').length < 4) {
    for (let t = 0; t < 34; t++) if (c[t] >= 3) return find([t, t, t]);
    for (let t = 0; t < 27; t++) if (t % 9 <= 6 && c[t] && c[t + 1] && c[t + 2]) return find([t, t + 1, t + 2]);
  }
  if (!banks.some(b => b.kind === 'pair')) for (let t = 0; t < 34; t++) if (c[t] >= 2) return find([t, t]);
  return [];
}
export function validRogueSave(value: unknown): value is Rogue {
  if (!value || typeof value !== 'object') return false;
  const s = value as Rogue;
  const tile = (t: Tile) => t && typeof t.id === 'string' && Number.isInteger(t.type) && t.type >= 0 && t.type < 42;
  if (!(s.version === 2 && Number.isInteger(s.stage) && s.stage > 0 && s.stage < 1000 && Number.isFinite(s.coins) && s.coins >= 0 && Number.isInteger(s.exchanges) && s.exchanges >= 0 && s.exchanges <= 6 && ['play', 'shop', 'lost', 'won'].includes(s.phase))) return false;
  if (![s.deck, s.hand, s.wall, s.flowers, s.discards].every(list => Array.isArray(list) && list.length < 300 && list.every(tile))) return false;
  if (s.deck.length < 50 || s.hand.length > 16 || new Set(s.deck.map(t => t.id)).size !== s.deck.length) return false;
  if (!Array.isArray(s.banks) || s.banks.length > 5 || !s.banks.every(b => b && Array.isArray(b.tiles) && b.tiles.every(tile) && classify(b.tiles) === b.kind)) return false;
  if (s.banks.filter(b => b.kind === 'pair').length > 1 || s.banks.filter(b => b.kind !== 'pair').length > 4) return false;
  if (!Array.isArray(s.relics) || s.relics.length > 8 || new Set(s.relics).size !== s.relics.length || !s.relics.every(id => RELICS.some(r => r.id === id))) return false;
  if (!PATTERNS.every(p => Number.isInteger(s.levels?.[p.id]) && s.levels[p.id] > 0 && s.levels[p.id] <= 10000)) return false;
  if (!Array.isArray(s.offers) || !s.offers.every(o => o && typeof o.id === 'string' && Number.isFinite(o.price) && o.price >= 0 && ['relic', 'pattern', 'foil', 'copy', 'remove', 'tool'].includes(o.kind) && (o.kind !== 'relic' || RELICS.some(r => r.id === o.target)) && (o.kind !== 'pattern' || PATTERNS.some(p => p.id === o.target)))) return false;
  return [s.tools, s.score, s.total, s.best].every(n => Number.isFinite(n) && n >= 0);
}
