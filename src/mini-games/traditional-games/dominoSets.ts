import { dominoDeck, dominoFaces } from './domino';
import {
  addPoints,
  deal,
  nextSeat,
  random,
  remove,
  settle,
  shuffle,
  sum,
  type TableAction,
  type TableBase,
} from './model';

export type SetState = TableBase & {
  kind: 'domino-sets';
  game: 'shanghai' | 'rummicube';
  stock: number[];
  groups: number[][];
  opened: boolean[];
  dice: number[];
  chains: number;
  played: number[];
  passes: number;
};
const roll = (s: SetState) => [1 + Math.floor(random(s) * 6), 1 + Math.floor(random(s) * 6)];
const points = (tile: number) => sum(dominoFaces(tile));
export function setDeal(s: SetState) {
  const shanghai = s.game === 'shanghai';
  const count = shanghai ? s.players.length : 2;
  const deck = Array.from({ length: count }, (_, i) =>
    dominoDeck(6).map((tile) => tile + 256 * i),
  ).flat();
  s.stock = deal(s, shuffle(s, deck), shanghai ? 10 : 8);
  s.turn = s.dealer;
  s.groups = [];
  s.opened = s.players.map(() => false);
  s.played = s.players.map(() => 0);
  s.dice = shanghai ? roll(s) : [];
  s.passes = s.chains = 0;
}

const compatible = (a: number, b: number) => a === b || !a || !b;
export function orientedChain(tiles: number[], dice: number[]) {
  let paths: { end: number; tiles: number[] }[] = [{ end: dice[0], tiles: [] }];
  for (const tile of tiles) {
    const [a, b] = dominoFaces(tile);
    paths = paths
      .flatMap(({ end, tiles }) => {
        const copy = tile & ~255;
        return [
          ...(compatible(end, a) ? [{ end: b, tiles: [...tiles, tile] }] : []),
          ...(a !== b && compatible(end, b)
            ? [{ end: a, tiles: [...tiles, copy + b * 16 + a] }]
            : []),
        ];
      })
      .filter(({ end }, i, entries) => entries.findIndex((p) => p.end === end) === i);
  }
  return paths.find((p) => compatible(p.end, dice[1]))?.tiles;
}

function exampleChain(hand: number[], [start, goal]: number[]) {
  // The shortest connection never needs to revisit a pip or reuse a tile.
  const queue = [{ pip: start, tiles: [] as number[] }];
  const seen = new Set<number>();
  for (const { pip, tiles } of queue)
    for (const tile of hand) {
      if (tiles.includes(tile)) continue;
      const [a, b] = dominoFaces(tile);
      for (const [from, to] of [
        [a, b],
        [b, a],
      ]) {
        if (!compatible(pip, from)) continue;
        if (compatible(to, goal)) return [...tiles, tile];
        if (seen.has(to)) continue;
        seen.add(to);
        queue.push({ pip: to, tiles: [...tiles, tile] });
      }
    }
  return [];
}

const wild = (tile: number) => (tile & 255) === 0 || (tile & 255) === 102;
const keys = (tile: number) => [...dominoFaces(tile), 7 + points(tile)];
export function isMeld(group: number[]) {
  if (group.length < 3) return false;
  const ordinary = group.filter((tile) => !wild(tile));
  return (
    !ordinary.length ||
    keys(ordinary[0]).some((k) => ordinary.every((tile) => keys(tile).includes(k)))
  );
}
function openingMeld(hand: number[]) {
  const wilds = hand.filter(wild);
  for (let k = 0; k <= 19; k++) {
    const group = hand.filter((tile) => !wild(tile) && keys(tile).includes(k)).concat(wilds);
    if (group.length >= 3) return group.slice(0, 3);
  }
  return [];
}

export function setMoves(s: SetState, seat: number): TableAction[] {
  if (seat !== s.turn) return [];
  const hand = s.hands[seat];
  if (s.game === 'shanghai') {
    const chain = exampleChain(hand, s.dice);
    return chain.length ? [{ type: 'tiles', tiles: chain }] : [{ type: 'pass' }];
  }
  const moves: TableAction[] = [];
  if (s.opened[seat]) {
    for (const [index, group] of s.groups.entries()) {
      const tile = hand.find((tile) => isMeld([...group, tile]));
      if (tile !== undefined)
        moves.push({
          type: 'meld',
          groups: s.groups.map((g, i) => (i === index ? [...g, tile] : g)),
        });
    }
  }
  const triple = openingMeld(hand);
  if (triple.length) moves.push({ type: 'meld', groups: [...s.groups, triple] });
  moves.push({ type: s.stock.length ? 'draw' : 'pass' });
  return moves;
}

export function setApply(s: SetState, seat: number, a: TableAction) {
  if (seat !== s.turn) return false;
  const hand = s.hands[seat];
  if (s.game === 'shanghai') {
    if (a.type === 'tiles') {
      if (
        !Array.isArray(a.tiles) ||
        !a.tiles.length ||
        a.tiles.length > hand.length ||
        new Set(a.tiles).size !== a.tiles.length ||
        a.tiles.some((tile) => !hand.includes(tile))
      )
        return false;
      const chain = orientedChain(a.tiles, s.dice);
      if (!chain) return false;
      a.tiles.forEach((tile) => remove(hand, tile));
      s.groups.push(chain);
      s.played[seat] += chain.length;
      s.chains++;
      s.dice = roll(s);
      s.event = { key: 'place', seat, amount: chain.length };
      return true;
    }
    if (a.type !== 'pass' || exampleChain(hand, s.dice).length) return false;
    const available = s.stock.splice(0, s.chains);
    hand.push(...available);
    s.event = { key: available.length ? 'draw' : 'pass', seat };
    if (available.length < s.chains) {
      s.scores = s.scores.map((score, i) => score + s.played[i] - s.hands[i].length);
      const best = Math.max(...s.scores);
      settle(s, best >= 50 && s.scores.filter((score) => score === best).length === 1);
    }
    s.chains = 0;
    s.dice = roll(s);
  } else {
    if (a.type === 'meld') {
      if (
        !Array.isArray(a.groups) ||
        !a.groups.length ||
        a.groups.length > 18 ||
        a.groups.some(
          (g) => !Array.isArray(g) || g.length > 56 || !g.every(Number.isSafeInteger) || !isMeld(g),
        )
      )
        return false;
      const table = s.groups.flat();
      const all = a.groups.flat();
      if (
        all.length > 56 ||
        new Set(all).size !== all.length ||
        table.some((tile) => !all.includes(tile))
      )
        return false;
      const placed = all.filter((tile) => !table.includes(tile));
      if (!placed.length || placed.some((tile) => !hand.includes(tile))) return false;
      if (
        !s.opened[seat] &&
        (placed.length !== 3 ||
          a.groups.length !== s.groups.length + 1 ||
          s.groups.some(
            (g, i) =>
              g.length !== a.groups[i].length || g.some((tile, j) => tile !== a.groups[i][j]),
          ))
      )
        return false;
      placed.forEach((tile) => remove(hand, tile));
      s.groups = a.groups.map((g) => [...g]);
      s.opened[seat] = true;
      s.passes = 0;
      s.event = { key: 'place', seat, amount: placed.length };
    } else if (a.type === 'draw' && s.stock.length) {
      hand.push(s.stock.shift()!);
      s.passes = 0;
      s.event = { key: 'draw', seat };
    } else if (a.type === 'pass' && !s.stock.length) {
      s.passes++;
      s.event = { key: 'pass', seat };
    } else return false;
    if (!hand.length || s.passes === s.players.length) {
      const totals = s.hands.map((h) => sum(h.map(points)));
      const winner = hand.length ? totals.indexOf(Math.min(...totals)) : seat;
      addPoints(s, winner, sum(totals) - totals[winner]);
      settle(s, Math.max(...s.scores) >= 100);
    }
  }
  s.turn = nextSeat(s, seat);
  return true;
}
