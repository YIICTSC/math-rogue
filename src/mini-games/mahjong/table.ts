import { bestDiscard, countsOf, makeWall, Meld, shanten, sorted, Tile, waits } from './tiles';
import { HandScore, scoreHand, WinContext } from './scoring';
export type Player = { hand: Tile[]; melds: Meld[]; river: { tile: Tile; called?: boolean; riichi?: boolean }[]; points: number; riichi: number; ippatsu: boolean; tempFuriten: boolean; riichiFuriten: boolean; riichiDiscard?: string };
export type Call = { kind: 'ron' | 'pon' | 'chi' | 'kan'; seat: number; ids: string[] };
export type RoundResult = { winner: number | null; from: number | null; score: HandScore | null; delta: number[]; tenpai?: boolean[]; tile?: Tile; hand?: Tile[]; melds?: Meld[] };
export type Table = {
  players: Player[]; wall: Tile[]; dead: Tile[]; round: number; dealer: number; honba: number; sticks: number; rounds: number;
  turn: number; phase: 'draw' | 'discard' | 'reaction' | 'result' | 'finished'; drawn?: string; rinshan: boolean; kanCount: number; interrupted: boolean;
  pending?: { tile: Tile; from: number; calls: Call[]; riichi?: number; addedKan?: number };
  result?: RoundResult; history: string[];
};
export type TableAction = { type: 'draw' } | { type: 'discard'; id: string; riichi?: boolean } | { type: 'react'; call?: Call } | { type: 'tsumo' } | { type: 'kan'; tileType: number } | { type: 'next' };
const blankPlayer = (points: number): Player => ({ hand: [], melds: [], river: [], points, riichi: 0, ippatsu: false, tempFuriten: false, riichiFuriten: false });
export function createTable(rounds = 8, random = Math.random): Table {
  return deal({ players: Array.from({ length: 4 }, () => blankPlayer(25000)), round: 0, dealer: 0, honba: 0, sticks: 0, rounds } as Table, random);
}
function deal(previous: Table, random = Math.random): Table {
  const pool = makeWall(random), players = previous.players.map(p => blankPlayer(p.points));
  // Deal 13 to each of four seats; every tile has one unique physical identity.
  for (let n = 0; n < 13; n++) for (let s = 0; s < 4; s++) players[(previous.dealer + s) % 4].hand.push(pool.shift()!);
  players.forEach(p => { p.hand = sorted(p.hand); });
  const dead = pool.splice(-14);
  return { ...previous, players, dead, wall: pool, turn: previous.dealer, phase: 'draw', drawn: undefined, pending: undefined, result: undefined, kanCount: 0, rinshan: false, interrupted: false, history: ['配牌完了。13枚から1枚ツモり、不要な1枚を捨てます。'] };
}
export const seatWind = (state: Table, seat: number) => 27 + (seat - state.dealer + 4) % 4;
export const indicators = (state: Table) => Array.from({ length: state.kanCount + 1 }, (_, i) => state.dead[4 + i * 2].type);
export function context(state: Table, seat: number, tile: Tile, tsumo: boolean, chankan = false): WinContext {
  const p = state.players[seat];
  return { winning: tile.type, tsumo, dealer: seat === state.dealer, seat: seatWind(state, seat), round: 27 + Math.floor(state.round / 4), riichi: p.riichi, ippatsu: p.ippatsu, rinshan: tsumo && state.rinshan, chankan, lastTile: state.wall.length === 0, heavenly: !state.interrupted && seat === state.dealer && state.players.every(p => !p.river.length), earthly: !state.interrupted && seat !== state.dealer && !p.river.length, indicators: indicators(state), ura: Array.from({ length: state.kanCount + 1 }, (_, i) => state.dead[5 + i * 2].type) };
}
export function isFuriten(state: Table, seat: number) {
  const p = state.players[seat];
  const w = waits(p.hand, p.melds);
  return p.tempFuriten || p.riichiFuriten || p.river.some(r => w.includes(r.tile.type));
}
export function canTsumo(state: Table) {
  if (state.phase !== 'discard' || !state.drawn) return null;
  const p = state.players[state.turn], t = p.hand.find(t => t.id === state.drawn);
  return t ? scoreHand(p.hand, p.melds, context(state, state.turn, t, true)) : null;
}
export function riichiDiscards(state: Table, seat = state.turn): string[] {
  const p = state.players[seat];
  if (state.phase !== 'discard' || state.turn !== seat || p.riichi || p.points < 1000 || p.melds.some(m => m.open) || state.wall.length < 4) return [];
  return p.hand.filter(t => waits(p.hand.filter(x => x.id !== t.id), p.melds).length).map(t => t.id);
}
export function kanTypes(state: Table): number[] {
  if (state.phase !== 'discard' || !state.drawn || state.kanCount >= 4 || !state.wall.length) return [];
  const p = state.players[state.turn], c = countsOf(p.hand);
  const types = c.flatMap((n, type) => n === 4 || (n && p.melds.some(m => m.kind === 'pon' && m.tiles[0].type === type)) ? [type] : []);
  if (!p.riichi) return types;
  const before = waits(p.hand.filter(t => t.id !== state.drawn), p.melds).join(',');
  return types.filter(type => c[type] === 4 && p.hand.find(t => t.id === state.drawn)?.type === type && before === waits(p.hand.filter(t => t.type !== type), [...p.melds, { kind: 'kan', open: false, tiles: p.hand.filter(t => t.type === type) }]).join(','));
}
function callsFor(state: Table, from: number, tile: Tile, rob = false): Call[] {
  const calls: Call[] = [];
  for (let distance = 1; distance < 4; distance++) {
    const seat = (from + distance) % 4, p = state.players[seat];
    if (!isFuriten(state, seat) && scoreHand([...p.hand, tile], p.melds, context(state, seat, tile, false, rob))) calls.push({ kind: 'ron', seat, ids: [] });
    if (rob || p.riichi || state.wall.length === 0) continue;
    const same = p.hand.filter(t => t.type === tile.type);
    if (same.length >= 2) calls.push({ kind: 'pon', seat, ids: same.slice(0, 2).map(t => t.id) });
    if (same.length === 3 && state.kanCount < 4) calls.push({ kind: 'kan', seat, ids: same.map(t => t.id) });
    if (distance === 1 && tile.type < 27) for (let start = tile.type - 2; start <= tile.type; start++) {
      if (start < 0 || Math.floor(start / 9) !== Math.floor(tile.type / 9) || start % 9 > 6) continue;
      const needed = [start, start + 1, start + 2].filter(t => t !== tile.type);
      const own = needed.map(type => p.hand.find(t => t.type === type));
      if (own.every(Boolean)) calls.push({ kind: 'chi', seat, ids: own.map(t => t!.id) });
    }
  }
  return calls;
}
function log(state: Table, message: string) { state.history = [...state.history.slice(-19), message]; }
function exhaustive(state: Table): Table {
  const tenpai = state.players.map(p => waits(p.hand, p.melds).length > 0), n = tenpai.filter(Boolean).length;
  const delta = tenpai.map(t => n === 0 || n === 4 ? 0 : t ? 3000 / n : -3000 / (4 - n));
  state.players.forEach((p, i) => { p.points += delta[i]; });
  state.phase = 'result'; state.result = { winner: null, from: null, score: null, delta, tenpai };
  log(state, '流局。テンパイ・ノーテンを確認して精算します。'); return state;
}
function win(state: Table, seat: number, from: number | null, tile: Tile): Table {
  const p = state.players[seat], hand = from === null ? p.hand : [...p.hand, tile];
  const score = scoreHand(hand, p.melds, context(state, seat, tile, from === null, state.pending?.addedKan !== undefined));
  if (!score) return state;
  const delta = [0, 0, 0, 0];
  if (from !== null) { delta[from] -= score.ron + state.honba * 300; delta[seat] += score.ron + state.honba * 300; }
  else for (let i = 0; i < 4; i++) if (i !== seat) { const amount = (i === state.dealer ? score.dealerPay : score.childPay) + state.honba * 100; delta[i] -= amount; delta[seat] += amount; }
  delta[seat] += state.sticks * 1000; state.sticks = 0;
  state.players.forEach((x, i) => { x.points += delta[i]; });
  state.result = { winner: seat, from, score, delta, hand, melds: p.melds, tile }; state.phase = 'result';
  log(state, from === null ? 'ツモ和了。役と符・翻を確認しましょう。' : 'ロン和了。放銃者が点数を支払います。');
  state.pending = undefined; return state;
}
function draw(state: Table, replacement = false): Table {
  if (!state.wall.length) return exhaustive(state);
  const p = state.players[state.turn];
  let tile: Tile;
  if (replacement) {
    tile = state.dead[state.kanCount - 1]; state.dead[state.kanCount - 1] = state.wall.pop()!;
  } else tile = state.wall.shift()!;
  p.hand.push(tile); p.tempFuriten = false; state.drawn = tile.id; state.rinshan = replacement; state.phase = 'discard';
  return state;
}
function finishKan(state: Table, seat: number, type: number, open: boolean, from?: number, external?: Tile): Table {
  const p = state.players[seat];
  const pon = p.melds.findIndex(m => m.kind === 'pon' && m.tiles[0].type === type);
  if (pon >= 0 && !external) {
    const tile = p.hand.find(t => t.type === type)!; p.hand = p.hand.filter(t => t.id !== tile.id);
    p.melds[pon] = { ...p.melds[pon], kind: 'kan', tiles: [...p.melds[pon].tiles, tile] };
  } else { const own = p.hand.filter(t => t.type === type); p.hand = p.hand.filter(t => t.type !== type); p.melds.push({ kind: 'kan', open, from, tiles: [...own, ...(external ? [external] : [])] }); }
  state.players.forEach(p => { p.ippatsu = false; }); state.interrupted = true;
  state.kanCount++; state.turn = seat; state.pending = undefined;
  log(state, 'カン。新しいドラ表示牌を開き、嶺上牌を引きます。');
  return draw(state, true);
}
function acceptableCpuCall(state: Table, c: Call): boolean {
  if (c.kind === 'ron') return true;
  const p = state.players[c.seat], tile = state.pending!.tile;
  const rest = p.hand.filter(t => !c.ids.includes(t.id));
  const meld: Meld = { kind: c.kind, open: true, tiles: [...p.hand.filter(t => c.ids.includes(t.id)), tile] };
  const hasYakuRoute = [...p.melds, meld].some(m => m.kind !== 'chi' && (m.tiles[0].type >= 31 || m.tiles[0].type === seatWind(state, c.seat) || m.tiles[0].type === 27 + Math.floor(state.round / 4))) || [...rest, ...p.melds.flatMap(m => m.tiles), ...meld.tiles].every(t => t.type < 27 && t.type % 9 > 0 && t.type % 9 < 8);
  if (!hasYakuRoute) return false;
  if (c.kind === 'kan') return true;
  const after = rest.length ? rest.filter((_, i) => i !== bestDiscard(rest, [...p.melds, meld])) : rest;
  return shanten(after, p.melds.length + 1) < shanten(p.hand, p.melds.length);
}
export function tableStep(original: Table, action: TableAction): Table {
  // Reject stale UI actions without mutating the current table.
  if (action.type === 'draw' && original.phase !== 'draw') return original;
  if (action.type === 'react' && original.phase !== 'reaction') return original;
  if (action.type === 'discard' && (original.phase !== 'discard' || !original.players[original.turn].hand.some(t => t.id === action.id))) return original;
  if (action.type === 'tsumo' && !canTsumo(original)) return original;
  if (action.type === 'kan' && !kanTypes(original).includes(action.tileType)) return original;
  if (action.type === 'next' && original.phase !== 'result') return original;
  const state: Table = structuredClone(original), p = state.players[state.turn];
  if (action.type === 'next') {
    const result = state.result!;
    const repeat = result.winner === state.dealer || (result.winner === null && result.tenpai![state.dealer]);
    state.honba = result.winner === null || repeat ? state.honba + 1 : 0;
    if (!repeat) { state.round++; state.dealer = (state.dealer + 1) % 4; }
    if (state.round >= state.rounds || state.players.some(p => p.points < 0)) {
      state.phase = 'finished';
      if (state.sticks) { const leader = state.players.map((p, i) => ({ points: p.points, i })).sort((a, b) => b.points - a.points || a.i - b.i)[0].i; state.players[leader].points += state.sticks * 1000; state.sticks = 0; }
      return state;
    }
    return deal(state);
  }
  if (action.type === 'draw') return draw(state);
  if (action.type === 'tsumo') return win(state, state.turn, null, p.hand.find(t => t.id === state.drawn)!);
  if (action.type === 'kan') {
    const ponIndex = p.melds.findIndex(m => m.kind === 'pon' && m.tiles[0].type === action.tileType);
    if (ponIndex >= 0) {
      const tile = p.hand.find(t => t.type === action.tileType)!;
      state.pending = { tile, from: state.turn, calls: callsFor(state, state.turn, tile, true), addedKan: ponIndex };
      state.phase = 'reaction'; return state;
    }
    return finishKan(state, state.turn, action.tileType, false);
  }
  if (action.type === 'discard') {
    if (p.riichi && action.id !== state.drawn) return original;
    const riichi = action.riichi && riichiDiscards(original).includes(action.id) ? (!p.river.length && !state.interrupted ? 2 : 1) : 0;
    if (action.riichi && !riichi) return original;
    if (p.riichi) p.ippatsu = false;
    const tile = p.hand.find(t => t.id === action.id)!; p.hand = sorted(p.hand.filter(t => t.id !== action.id));
    p.river.push({ tile, riichi: Boolean(riichi) }); state.drawn = undefined;
    state.pending = { tile, from: state.turn, calls: callsFor(state, state.turn, tile), riichi }; state.phase = 'reaction';
    return state;
  }
  if (action.type === 'react') {
    const pending = state.pending!;
    const validHuman = action.call && pending.calls.find(c => c.seat === 0 && c.kind === action.call!.kind && c.ids.join(',') === action.call!.ids.join(','));
    if (action.call && !validHuman) return original;
    if (!validHuman || validHuman.kind !== 'ron') if (pending.calls.some(c => c.seat === 0 && c.kind === 'ron')) {
      state.players[0].tempFuriten = true; if (state.players[0].riichi) state.players[0].riichiFuriten = true;
    }
    const cpu = pending.calls.filter(c => c.seat !== 0 && acceptableCpuCall(state, c));
    const all = [...cpu, ...(validHuman ? [validHuman] : [])];
    const rons = all.filter(c => c.kind === 'ron').sort((a, b) => (a.seat - pending.from + 4) % 4 - (b.seat - pending.from + 4) % 4);
    if (rons.length) return win(state, rons[0].seat, pending.from, pending.tile);
    if (pending.addedKan !== undefined) return finishKan(state, pending.from, pending.tile.type, true);
    if (pending.riichi) {
      const declarer = state.players[pending.from]; declarer.points -= 1000; state.sticks++; declarer.riichi = pending.riichi; declarer.ippatsu = true; declarer.riichiDiscard = pending.tile.id;
      log(state, 'リーチ成立。1000点を供託し、以後はツモ切りです。');
    }
    const call = all.filter(c => c.kind !== 'ron').sort((a, b) => Number(a.kind === 'chi') - Number(b.kind === 'chi') || (a.seat - pending.from + 4) % 4 - (b.seat - pending.from + 4) % 4)[0];
    if (call) {
      state.players.forEach(p => { p.ippatsu = false; }); state.interrupted = true;
      state.players[pending.from].river.at(-1)!.called = true;
      if (call.kind === 'kan') return finishKan(state, call.seat, pending.tile.type, true, pending.from, pending.tile);
      const caller = state.players[call.seat];
      caller.melds.push({ kind: call.kind as 'chi' | 'pon', open: true, from: pending.from, tiles: sorted([...caller.hand.filter(t => call.ids.includes(t.id)), pending.tile]) });
      caller.hand = caller.hand.filter(t => !call.ids.includes(t.id)); state.turn = call.seat; state.phase = 'discard'; state.drawn = undefined; state.pending = undefined; state.rinshan = false;
      log(state, call.kind === 'chi' ? 'チー。上家の捨て牌で順子を作りました。1枚捨てます。' : 'ポン。同じ牌3枚を公開しました。1枚捨てます。'); return state;
    }
    state.turn = (pending.from + 1) % 4; state.phase = 'draw'; state.pending = undefined; state.rinshan = false;
    return state.wall.length ? state : exhaustive(state);
  }
  return original;
}
export function cpuStep(state: Table): Table {
  if (state.phase === 'reaction') return state.pending?.calls.some(c => c.seat === 0) ? state : tableStep(state, { type: 'react' });
  if (state.turn === 0) return state;
  if (state.phase === 'draw') return tableStep(state, { type: 'draw' });
  if (state.phase !== 'discard') return state;
  if (canTsumo(state)) return tableStep(state, { type: 'tsumo' });
  const p = state.players[state.turn];
  const kan = kanTypes(state); if (kan.length) return tableStep(state, { type: 'kan', tileType: kan[0] });
  if (p.riichi) return tableStep(state, { type: 'discard', id: state.drawn! });
  const safe = state.players.flatMap(other => other.riichi ? other.river.map(r => r.tile.type) : []);
  const tile = p.hand[bestDiscard(p.hand, p.melds, safe)];
  return tableStep(state, { type: 'discard', id: tile.id, riichi: riichiDiscards(state).includes(tile.id) });
}
