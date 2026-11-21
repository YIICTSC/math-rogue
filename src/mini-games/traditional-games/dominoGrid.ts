import { dominoDeck, dominoFaces, dominoTile } from './domino';
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

type GridGame = 'sidominos' | 'broadway' | 'skyscraper';
export const isGridGame = (game: string): game is GridGame =>
  game === 'sidominos' || game === 'broadway' || game === 'skyscraper';
export type GridMove = Extract<TableAction, { type: 'grid' }>;
export type GridCell = {
  x: number;
  y: number;
  pip: number;
  height: number;
  tile: number;
  vertical: boolean;
};
export type GridState = TableBase & {
  kind: 'domino-grid';
  game: GridGame;
  stock: number[];
  cells: GridCell[];
  eliminated: number[];
  passes: number;
  finalTurns: number | null;
};

export function gridDeal(s: GridState) {
  const sky = s.game === 'skyscraper',
    sid = s.game === 'sidominos';
  const deck = dominoDeck(6).filter(
    (tile) => !sid || dominoFaces(tile).every((p) => p > 0 && p < 6),
  );
  if (s.game !== 'broadway') deck.push(...deck.map((tile) => tile + 256));
  shuffle(s, deck);
  s.cells = [];
  s.turn = s.dealer;
  s.eliminated = [];
  s.finalTurns = null;
  s.passes = 0;
  if (sid) {
    const count = [0, 0, 14, 9, 7][s.players.length];
    s.stock = deal(s, deck, count);
    for (let y = 0; y < 2; y++) {
      const tile = s.stock.shift()!;
      s.cells.push(
        ...gridCells({
          type: 'grid',
          tile,
          x: 0,
          y,
          vertical: false,
          flip: false,
        }),
      );
    }
  } else if (sky) {
    s.stock = deal(s, deck, 10);
  } else {
    const pip = 7 - s.round;
    const tile = dominoTile(pip, pip);
    s.stock = deal(s, deck, 7);
    s.turn = s.hands.findIndex((hand) => hand.includes(tile));
    remove(s.hands[s.turn], tile);
    s.cells = gridCells({
      type: 'grid',
      tile,
      x: 0,
      y: 0,
      vertical: !!(s.turn % 2),
      flip: false,
    });
    s.turn = nextSeat(s, s.turn);
  }
}

export function gridCells(move: GridMove, height = 1): GridCell[] {
  const { x, y, vertical, tile, flip } = move;
  const faces = dominoFaces(tile);
  if (flip) faces.reverse();
  return faces.map((pip, i) => ({
    x: x + (vertical ? 0 : i),
    y: y + (vertical ? i : 0),
    pip,
    height,
    tile,
    vertical,
  }));
}
const key = (x: number, y: number) => x + ',' + y;
const cross = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
function row(board: Map<string, GridCell>, { x, y }: GridCell, dx: number, dy: number) {
  const values = [board.get(key(x, y))!.pip];
  for (const dir of [-1, 1]) {
    for (let i = 1; ; i++) {
      const cell = board.get(key(x + i * dx * dir, y + i * dy * dir));
      if (!cell) break;
      if (dir === -1) values.unshift(cell.pip);
      else values.push(cell.pip);
    }
  }
  return values;
}
export function matchesPattern(pips: number[]) {
  const period = pips.indexOf(pips[0], 1);
  if (period === -1) return new Set(pips).size === pips.length;
  return (
    new Set(pips.slice(0, period)).size === period &&
    pips.every((pip, i) => pip === pips[i % period])
  );
}
function scorePlacement(s: GridState, board: Map<string, GridCell>, move: GridMove) {
  const cells = gridCells(move);
  if (s.game === 'skyscraper') {
    if (cells.some((c) => c.x < 0 || c.x > 3 || c.y < 0 || c.y > 3)) return -1;
    const underneath = cells.map((c) => board.get(key(c.x, c.y)));
    if (board.size < 16)
      return !move.vertical && move.x % 2 === 0 && underneath.every((c) => !c) ? 0 : -1;
    return underneath[0]!.height === underneath[1]!.height &&
      cells.every((c, i) => !c.pip || !underneath[i]!.pip || c.pip === underneath[i]!.pip)
      ? 0
      : -1;
  }
  if (cells.some((c) => board.has(key(c.x, c.y)))) return -1;
  const contacts = cells.flatMap((c) =>
    cross.flatMap(([dx, dy]) => {
      const near = board.get(key(c.x + dx, c.y + dy));
      return near ? [near.pip === c.pip] : [];
    }),
  );
  if (s.game === 'broadway') {
    if (!contacts.includes(true)) return -1;
    return [0, 0, 1, 5, 10][Math.min(4, contacts.filter(Boolean).length)];
  }
  if (!contacts.length) return -1;
  for (const c of cells) board.set(key(c.x, c.y), c);
  const dx = move.vertical ? 0 : 1,
    dy = 1 - dx;
  const along = row(board, cells[0], dx, dy);
  const across = cells.map((c) => row(board, c, dy, dx));
  for (const c of cells) board.delete(key(c.x, c.y));
  if (![along, ...across].every(matchesPattern)) return -1;
  return (
    (along.length === 2 ? 1 : along.length) *
    across[0].length *
    across[1].length *
    (cells[0].pip === cells[1].pip ? 2 : 1)
  );
}

const findBoard = (s: GridState) => new Map(s.cells.map((c) => [key(c.x, c.y), c]));
export function gridMoves(s: GridState, seat: number): TableAction[] {
  if (s.turn !== seat) return [];
  const board = findBoard(s);
  const targets = new Map<string, { x: number; y: number; vertical: boolean }>();
  for (const vertical of [false, true]) {
    if (s.game === 'broadway' && vertical !== !!(seat % 2)) continue;
    const add = (x: number, y: number) =>
      targets.set(key(x, y) + '/' + vertical, { x, y, vertical });
    if (s.game === 'skyscraper') {
      for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) add(x, y);
    } else {
      for (const cell of s.cells)
        for (const [dx, dy] of cross) {
          const x = cell.x + dx,
            y = cell.y + dy;
          if (board.has(key(x, y))) continue;
          add(x, y);
          add(x - (vertical ? 0 : 1), y - (vertical ? 1 : 0));
        }
    }
  }
  const moves: GridMove[] = [];
  for (const tile of s.hands[seat]) {
    const [a, b] = dominoFaces(tile);
    for (const target of targets.values())
      for (const flip of a === b ? [false] : [false, true]) {
        const move: GridMove = { type: 'grid', tile, ...target, flip };
        if (scorePlacement(s, board, move) >= 0) moves.push(move);
      }
  }
  return moves.length ? moves : [{ type: 'pass' }];
}

function finish(s: GridState) {
  for (const [seat, hand] of s.hands.entries()) {
    addPoints(
      s,
      seat,
      -hand.reduce((sum, tile) => {
        const [a, b] = dominoFaces(tile);
        return sum + (s.game === 'broadway' ? 1 : a === b ? 5 : 25);
      }, 0),
    );
  }
  settle(s, s.game !== 'broadway' || s.round === 7);
}

export function gridApply(s: GridState, seat: number, move: TableAction) {
  if (s.turn !== seat) return false;
  const board = findBoard(s);
  if (move.type === 'grid') {
    if (
      !s.hands[seat].includes(move.tile) ||
      !Number.isSafeInteger(move.x) ||
      !Number.isSafeInteger(move.y) ||
      typeof move.vertical !== 'boolean' ||
      typeof move.flip !== 'boolean' ||
      (s.game === 'broadway' && move.vertical !== !!(seat % 2))
    )
      return false;
    const points = scorePlacement(s, board, move);
    if (points < 0) return false;
    const height = 1 + (board.get(key(move.x, move.y))?.height ?? 0);
    for (const cell of gridCells(move, height)) board.set(key(cell.x, cell.y), cell);
    s.cells = [...board.values()];
    remove(s.hands[seat], move.tile);
    if (s.game === 'skyscraper' && s.stock.length) s.hands[seat].push(s.stock.shift()!);
    s.passes = 0;
    s.event = { key: points ? 'score' : 'place', seat, amount: points };
    addPoints(s, seat, points);
  } else if (move.type === 'pass') {
    if (gridMoves(s, seat)[0].type !== 'pass') return false;
    s.passes++;
    s.event = { key: 'pass', seat };
    if (s.game === 'skyscraper') {
      s.eliminated.push(seat);
      s.scores[seat] = s.eliminated.length - s.players.length;
      if (s.eliminated.length === s.players.length - 1) {
        settle(s, true);
        return true;
      }
    }
  } else return false;
  if (s.finalTurns !== null) s.finalTurns--;
  else if (s.game === 'sidominos' && !s.hands[seat].length) s.finalTurns = s.players.length - 1;
  if (s.game !== 'skyscraper' && (s.finalTurns === 0 || s.passes >= s.players.length)) finish(s);
  do s.turn = nextSeat(s, s.turn);
  while (s.eliminated.includes(s.turn));
  return true;
}
export function gridCpu(s: GridState, seat: number) {
  const board = findBoard(s);
  return gridMoves(s, seat).reduce<TableAction | undefined>((best, action) => {
    if (
      !best ||
      (action.type === 'grid' &&
        best.type === 'grid' &&
        scorePlacement(s, board, action) > scorePlacement(s, board, best))
    )
      return action;
    return best;
  }, undefined);
}
