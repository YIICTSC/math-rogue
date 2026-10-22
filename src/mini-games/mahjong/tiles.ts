/** Tile types are 0..8 characters, 9..17 dots, 18..26 bamboo, 27..33 honors. */
export type Tile = { id: string; type: number; foil?: boolean };
export type Meld = { kind: 'chi' | 'pon' | 'kan'; tiles: Tile[]; open: boolean; from?: number };
export const HONORS = ['東', '南', '西', '北', '白', '發', '中'];
export const tileName = (type: number) => type < 27 ? `${type % 9 + 1}${['萬', '筒', '索'][Math.floor(type / 9)]}` : HONORS[type - 27] || '花';
export const tileKey = (type: number) => type < 27 ? `${['m', 'p', 's'][Math.floor(type / 9)]}${type % 9 + 1}` : `z${type - 26}`;
export const terminal = (t: number) => t >= 27 || t % 9 === 0 || t % 9 === 8;
export const countsOf = (tiles: Tile[]) => tiles.reduce((c, t) => { if (t.type < 34) c[t.type]++; return c; }, Array(34).fill(0) as number[]);
export const sorted = (tiles: Tile[]) => [...tiles].sort((a, b) => a.type - b.type || a.id.localeCompare(b.id));
export function shuffled<T>(values: T[], random = Math.random): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export const makeWall = (random = Math.random) => shuffled(Array.from({ length: 136 }, (_, i) => ({ type: Math.floor(i / 4), id: `tile-${i}` })), random);
export const nextDora = (t: number) => t < 27 ? Math.floor(t / 9) * 9 + (t + 1) % 9 : t < 31 ? 27 + (t - 26) % 4 : 31 + (t - 30) % 3;
export const ORPHANS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
export type Shape = { pair: number; groups: number[][]; special?: 'pairs' | 'orphans' };
export function shapes(tiles: Tile[], melds: Meld[] = []): Shape[] {
  if (tiles.length !== 14 - melds.length * 3) return [];
  const c = countsOf(tiles), result: Shape[] = [];
  if (c.some(n => n > 4)) return [];
  if (!melds.length && c.filter(n => n === 2).length === 7) result.push({ pair: -1, groups: [], special: 'pairs' });
  if (!melds.length && ORPHANS.every(t => c[t] > 0) && ORPHANS.some(t => c[t] === 2)) result.push({ pair: -1, groups: [], special: 'orphans' });
  const visit = (pair: number, groups: number[][]) => {
    const first = c.findIndex(n => n > 0);
    if (first < 0) { if (groups.length + melds.length === 4) result.push({ pair, groups }); return; }
    if (groups.length + melds.length >= 4) return;
    if (c[first] >= 3) { c[first] -= 3; visit(pair, [...groups, [first, first, first]]); c[first] += 3; }
    if (first < 27 && first % 9 <= 6 && c[first + 1] && c[first + 2]) {
      c[first]--; c[first + 1]--; c[first + 2]--; visit(pair, [...groups, [first, first + 1, first + 2]]); c[first]++; c[first + 1]++; c[first + 2]++;
    }
  };
  c.forEach((n, pair) => { if (n >= 2) { c[pair] -= 2; visit(pair, []); c[pair] += 2; } });
  return result;
}
export function waits(hand: Tile[], melds: Meld[] = []): number[] {
  if (hand.length !== 13 - melds.length * 3) return [];
  const owned = countsOf([...hand, ...melds.flatMap(m => m.tiles)]);
  return Array.from({ length: 34 }, (_, type) => type).filter(type => owned[type] < 4 && shapes([...hand, { id: 'wait', type }], melds).length > 0);
}
// Exact standard shanten DFS; partial groups cannot exceed the remaining meld slots.
const shantenCache = new Map<string, number>();
export function shanten(tiles: Tile[], open = 0): number {
  const c = countsOf(tiles), key = `${open}:${c.join('')}`;
  if (shantenCache.has(key)) return shantenCache.get(key)!;
  let best = 8;
  const dfs = (start: number, melds: number, partial: number, pair: number) => {
    let i = start; while (i < 34 && !c[i]) i++;
    if (i === 34) { best = Math.min(best, 8 - 2 * (melds + open) - Math.min(partial, 4 - melds - open) - pair); return; }
    if (melds + open < 4) {
      if (c[i] >= 3) { c[i] -= 3; dfs(i, melds + 1, partial, pair); c[i] += 3; }
      if (i < 27 && i % 9 < 7 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; dfs(i, melds + 1, partial, pair); c[i]++; c[i + 1]++; c[i + 2]++; }
    }
    if (c[i] >= 2) {
      c[i] -= 2;
      if (!pair) dfs(i, melds, partial, 1);
      if (partial < 4) dfs(i, melds, partial + 1, pair);
      c[i] += 2;
    }
    if (partial < 4 && i < 27) for (const gap of [1, 2]) if (i % 9 + gap < 9 && c[i + gap]) { c[i]--; c[i + gap]--; dfs(i, melds, partial + 1, pair); c[i]++; c[i + gap]++; }
    c[i]--; dfs(i, melds, partial, pair); c[i]++;
  };
  dfs(0, 0, 0, 0);
  if (!open) {
    const pairs = c.filter(n => n >= 2).length, unique = c.filter(Boolean).length;
    best = Math.min(best, 6 - pairs + Math.max(0, 7 - unique), 13 - ORPHANS.filter(t => c[t]).length - Number(ORPHANS.some(t => c[t] >= 2)));
  }
  if (shantenCache.size > 12000) shantenCache.clear();
  shantenCache.set(key, best); return best;
}
/** Uses only this player's tiles and public discards, never another concealed hand. */
export function bestDiscard(hand: Tile[], melds: Meld[] = [], safe: number[] = []): number {
  const c = countsOf(hand);
  return hand.map((tile, i) => {
    const rest = hand.filter((_, j) => i !== j);
    const r = tile.type % 9;
    const link = tile.type < 27 ? (r > 0 ? c[tile.type - 1] : 0) + (r < 8 ? c[tile.type + 1] : 0) + .4 * ((r > 1 ? c[tile.type - 2] : 0) + (r < 7 ? c[tile.type + 2] : 0)) : 0;
    return { i, score: shanten(rest, melds.length) * 100 + (c[tile.type] > 1 ? 5 : 0) + link - (terminal(tile.type) ? .3 : 0) - (safe.includes(tile.type) ? 2 : 0) };
  }).sort((a, b) => a.score - b.score || b.i - a.i)[0]?.i ?? 0;
}
