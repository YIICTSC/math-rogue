import {
  addPoints,
  deal,
  nextSeat,
  remove,
  settle,
  shuffle,
  type TableAction,
  type TableBase,
} from './model';

export const peeperRank = (tile: number) => Math.floor(tile / 4) + 1;
export type PeeperKind =
  | 'single'
  | 'pair'
  | 'run'
  | 'pair-run'
  | 'bomb-one'
  | 'bomb-two'
  | 'mine'
  | 'return';
export type PeeperPlay = { kind: PeeperKind; rank: number; tiles: number[]; seat: number };
export interface PeeperState extends TableBase {
  kind: 'peeper';
  game: 'peeper';
  pile: PeeperPlay | null;
  discard: number;
  passed: number;
}

export function newPeeperDeal(s: PeeperState) {
  deal(
    s,
    shuffle(
      s,
      Array.from({ length: 64 }, (_, i) => i),
    ),
    s.players.length <= 4 ? 16 : s.players.length === 5 ? 12 : 10,
  );
  const first = s.hands.findIndex((hand) => hand.includes(0));
  s.turn = first === -1 ? s.dealer : first;
  s.pile = null;
  s.discard = s.passed = 0;
}

const bombs: PeeperKind[] = ['bomb-one', 'bomb-two'];
const bombPower = (play: Pick<PeeperPlay, 'kind'>) => bombs.indexOf(play.kind) + 1;
export function stronger(play: Omit<PeeperPlay, 'seat'>, old: PeeperPlay | null) {
  if (!old) return true;
  if (old.kind === 'mine' || old.kind === 'return') return false;
  if (bombPower(play) !== bombPower(old)) return bombPower(play) > bombPower(old);
  return play.kind === old.kind && play.tiles.length === old.tiles.length && play.rank > old.rank;
}

function rankGroups(tiles: number[]) {
  const groups = Array.from({ length: 17 }, () => [] as number[]);
  for (const tile of tiles) groups[peeperRank(tile)].push(tile);
  return groups;
}

function collectRun(groups: number[][], start: number, end: number, copy: number) {
  const tiles: number[] = [],
    wild = [...groups[16]];
  for (let rank = start; rank <= end; rank++) {
    const natural = rank === 16 ? [] : groups[rank].slice(0, copy);
    const needs = copy - natural.length;
    if (needs > wild.length) return null;
    tiles.push(...natural, ...wild.splice(0, needs));
  }
  return tiles;
}

// Build at most one valid tile combination for each pattern at each rank.
export function peeperChoices(hand: number[]) {
  const groups = rankGroups(hand);
  const choices: Omit<PeeperPlay, 'seat'>[] = hand.map((tile) => ({
    kind: 'single',
    rank: peeperRank(tile),
    tiles: [tile],
  }));
  for (let rank = 1; rank <= 16; rank++) {
    for (const [count, kind] of [
      [3, 'bomb-one'],
      [4, 'bomb-two'],
    ] as const) {
      if (groups[rank].length >= count)
        choices.push({ kind, rank, tiles: groups[rank].slice(0, count) });
    }
    if (rank === 16 || groups[rank].length) {
      const pair = collectRun(groups, rank, rank, 2);
      if (pair) choices.push({ kind: 'pair', rank, tiles: pair });
    }
    for (let start = Math.max(1, rank - hand.length + 1); start <= rank - 2; start++) {
      const run = collectRun(groups, start, rank, 1);
      if (run) choices.push({ kind: 'run', rank, tiles: run });
      const paired = collectRun(groups, start, rank, 2);
      if (paired) choices.push({ kind: 'pair-run', rank, tiles: paired });
    }
  }
  return choices;
}

export function peeperSelection(tiles: number[], pile: PeeperPlay | null, rank?: number) {
  if (
    !Array.isArray(tiles) ||
    !tiles.length ||
    tiles.length > 16 ||
    tiles.some((t) => !Number.isInteger(t) || t < 0 || t > 63) ||
    new Set(tiles).size !== tiles.length
  )
    return null;
  return (
    peeperChoices(tiles)
      .filter(
        (play) =>
          play.tiles.length === tiles.length &&
          (rank === undefined || play.rank === rank) &&
          stronger(play, pile),
      )
      .sort((a, b) => bombPower(a) - bombPower(b) || a.rank - b.rank)[0] ?? null
  );
}

function counterTiles(
  s: Pick<PeeperState, 'pile'>,
  seat: number,
  hand: number[],
  kind: 'mine' | 'return',
) {
  if (!s.pile || s.pile.seat === seat || s.pile.kind !== (kind === 'mine' ? 'single' : 'mine'))
    return [];
  const need = kind === 'mine' ? 2 : 1;
  const matching = hand.filter((t) => peeperRank(t) === s.pile!.rank);
  return matching.length >= need ? matching.slice(0, need) : [];
}

export function peeperMoves(s: PeeperState, seat: number): TableAction[] {
  const hand = s.hands[seat];
  const moves: TableAction[] = [];
  if (counterTiles(s, seat, hand, 'mine').length) moves.push({ type: 'mine' });
  if (counterTiles(s, seat, hand, 'return').length) moves.push({ type: 'return' });
  if (s.turn === seat) {
    if (s.pile) moves.push({ type: 'pass' });
    moves.push(
      ...peeperChoices(hand)
        .filter((a) => stronger(a, s.pile))
        .map((a) => ({ type: 'tiles', tiles: a.tiles, rank: a.rank }) as const),
    );
  }
  return moves;
}

const penalty = (tile: number) => {
  const rank = peeperRank(tile);
  return rank === 16 ? 30 : Math.ceil(rank / 5) * 5;
};

export function applyPeeper(s: PeeperState, seat: number, a: TableAction) {
  if (a.type === 'pass' && s.turn === seat && s.pile) {
    s.passed++;
    s.event = { key: 'pass', seat };
    if (s.passed >= s.players.length - 1) {
      s.turn = s.pile.seat;
      s.discard += s.pile.tiles.length;
      s.pile = null;
      s.passed = 0;
    } else s.turn = nextSeat(s, seat);
    return true;
  }
  let play: Omit<PeeperPlay, 'seat'> | null = null;
  if (a.type === 'mine' || a.type === 'return') {
    const tiles = counterTiles(s, seat, s.hands[seat], a.type);
    if (tiles.length) play = { kind: a.type, tiles, rank: s.pile!.rank };
  } else if (a.type === 'tiles' && seat === s.turn) {
    play = peeperSelection(a.tiles, s.pile, a.rank);
    if (play && !play.tiles.every((t) => s.hands[seat].includes(t))) play = null;
  }
  if (!play) return false;
  for (const tile of play.tiles) remove(s.hands[seat], tile);
  s.discard += s.pile?.tiles.length ?? 0;
  s.pile = { ...play, seat };
  s.passed = 0;
  s.turn = nextSeat(s, seat);
  s.event = {
    key:
      play.kind === 'mine'
        ? 'mine'
        : play.kind === 'return'
          ? 'return'
          : bombPower(play)
            ? 'bomb'
            : 'place',
    seat,
  };
  if (!s.hands[seat].length) {
    let gain = 0;
    for (let i = 0; i < s.hands.length; i++) {
      const loss = s.hands[i].reduce((n, t) => n + penalty(t), 0);
      s.scores[i] -= loss;
      gain += loss;
    }
    addPoints(s, seat, gain);
    if (s.event.key === 'place') s.event.key = 'peeper-out';
    s.event.amount = gain;
    settle(s, s.round >= 3);
  }
  return true;
}

export function peeperCpu(s: PeeperState, seat: number) {
  const hand = s.hands[seat];
  if (counterTiles(s, seat, hand, 'return').length) return { type: 'return' } as const;
  if (counterTiles(s, seat, hand, 'mine').length) return { type: 'mine' } as const;
  if (s.turn !== seat) return undefined;
  const plays = peeperChoices(hand).filter((play) => stronger(play, s.pile));
  const best = plays.sort((a, b) => {
    const value = (p: Omit<PeeperPlay, 'seat'>) =>
      p.tiles.length === hand.length
        ? 1000
        : p.tiles.length * 4 -
          p.rank * 0.54 -
          bombPower(p) * 15 -
          p.tiles.filter((t) => peeperRank(t) === 16).length * 5;
    return value(b) - value(a);
  })[0];
  return best
    ? ({ type: 'tiles', tiles: best.tiles, rank: best.rank } as const)
    : ({ type: 'pass' } as const);
}
