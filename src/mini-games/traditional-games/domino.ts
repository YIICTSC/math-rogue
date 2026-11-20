import {
  addPoints,
  deal,
  nextSeat,
  remove,
  settle,
  shuffle,
  sum,
  teamOf,
  type LineGame,
  type TableAction,
  type TableBase,
} from './model';

export const dominoTile = (left: number, right: number) => left * 16 + right;
export const dominoFaces = (tile: number): [number, number] => [tile >> 4, tile & 15];
const pipTotal = (tile: number) => (tile >> 4) + (tile & 15);
const double = (tile: number) => tile >> 4 === (tile & 15);
const matches = (tile: number, end: number) => tile >> 4 === end || (tile & 15) === end;
export const dominoDeck = (max: number) =>
  Array.from({ length: max + 1 }, (_, a) =>
    Array.from({ length: max + 1 - a }, (_, b) => dominoTile(a, a + b)),
  ).flat();

export type DominoLine = {
  tiles: number[];
  pip: number;
  parent: number;
  anchor: number;
  public: boolean;
};
type Spinner = {
  tile: number;
  directions: [number, number];
  line: number;
  at: number;
  expanded: boolean;
};
export interface DominoState extends TableBase {
  kind: 'domino';
  game: LineGame;
  stock: number[];
  hub: number | null;
  lines: DominoLine[];
  spinners: Spinner[];
  forced: number[];
  opening: number | null;
  passes: number;
  drawn: number;
  trainOpening: boolean[];
  trainBonus: boolean;
  limit: number;
}

const limits: Partial<Record<LineGame, number>> = {
  competitive: 200,
  cyprus: 60,
  'five-up': 61,
  sniff: 250,
  'seven-rocks': 250,
  bergen: 10,
  'fives-threes': 61,
};

const newLine = (pip: number, parent = -1, anchor = -1, isPublic = false): DominoLine => ({
  tiles: [],
  pip,
  parent,
  anchor,
  public: isPublic,
});

export function newDominoDeal(s: DominoState) {
  const game = s.game,
    n = s.players.length;
  const max = game === 'mexican' ? 12 : game === 'chicken' || game === 'cyprus' ? 9 : 6;
  const count =
    game === 'cyprus'
      ? [0, 0, 11, 10, 9, 8, 7, 7, 6][n]
      : game === 'chicken'
        ? [0, 0, 20, 14, 11, 9, 7][n]
        : game === 'mexican'
          ? n <= 4
            ? 15
            : n <= 6
              ? 12
              : 10
          : game === 'bergen'
            ? n <= 3
              ? 6
              : 5
            : game === 'fives-threes'
              ? n === 2
                ? 7
                : 5
              : game === 'five-up'
                ? n === 2
                  ? 7
                  : 5
                : game === 'sniff'
                  ? 9 - n
                  : 7;
  s.stock = deal(s, shuffle(s, dominoDeck(max)), count);
  s.hub = s.opening = null;
  s.lines = [];
  s.spinners = [];
  s.forced = [];
  s.trainOpening = game === 'mexican' ? s.players.map(() => true) : [];
  s.passes = s.drawn = 0;
  s.trainBonus = false;
  s.limit = (game === 'bergen' && n === 2 ? 15 : limits[game]) ?? max + 1;
  s.turn = s.dealer;
  if (game === 'chicken' || game === 'mexican') {
    const pip = max + 1 - s.round;
    const center = dominoTile(pip, pip);
    while (!s.hands.some((hand) => hand.includes(center))) {
      for (const hand of s.hands) if (s.stock.length) hand.push(s.stock.shift()!);
    }
    s.turn = s.hands.findIndex((hand) => hand.includes(center));
    s.opening = center;
  } else if (game === 'cyprus' || game === 'bergen') {
    s.opening =
      s.hands
        .flat()
        .filter(double)
        .sort((a, b) => b - a)[0] ??
      s.hands.flat().sort((a, b) => pipTotal(a) - pipTotal(b) || a - b)[0];
    s.turn = s.hands.findIndex((hand) => hand.includes(s.opening!));
  }
}

export type TileMove = Extract<TableAction, { type: 'place' }>;

export function dominoMoves(s: DominoState, seat: number): TableAction[] {
  if (s.turn !== seat) return [];
  let hand = s.hands[seat];
  if (s.hub === null) {
    if (s.opening !== null) hand = [s.opening];
    return hand.map((tile) => ({ type: 'place', tile, end: -1 }));
  }
  const game = s.game;
  const initialTrain = !!s.trainOpening[seat];
  const doubleEnds =
    game === 'mexican' && !s.trainBonus && !s.trainOpening.some(Boolean)
      ? s.lines.flatMap((line, i) => (line.tiles.length && double(line.tiles.at(-1)!) ? [i] : []))
      : [];
  const openEnds = s.forced.length
    ? s.forced
    : initialTrain
      ? [seat]
      : doubleEnds.length
        ? doubleEnds
        : s.lines.flatMap((line, i) =>
            game === 'mexican' && !line.public && i !== seat ? [] : [i],
          );
  const moves: TileMove[] = openEnds.flatMap((end) =>
    hand
      .filter((tile) => matches(tile, s.lines[end].pip))
      .map((tile) => ({ type: 'place', tile, end })),
  );
  if (moves.length) return moves;

  if (initialTrain || game === 'competitive' || game === 'fives-threes') return [{ type: 'pass' }];
  const drawLimit =
    game === 'sniff' ? 2 : ['cyprus', 'chicken', 'mexican'].includes(game) ? 1 : Infinity;
  const reserve =
    game === 'bergen' || (s.players.length === 2 && (game === 'sniff' || game === 'five-up'))
      ? 2
      : game === 'five-up'
        ? 1
        : 0;
  return s.drawn < drawLimit && s.stock.length > reserve ? [{ type: 'draw' }] : [{ type: 'pass' }];
}

export function openPips(s: Pick<DominoState, 'game' | 'lines' | 'hub'>) {
  if (s.hub === null) return 0;
  const value = sum(
    s.lines.map((line, i) => {
      if (line.tiles.length) return line.pip * (double(line.tiles.at(-1)!) ? 2 : 1);
      if (i < 2) return line.pip;
      return s.game === 'sniff' ? line.pip : 0;
    }),
  );
  return value;
}

function onTablePoints(s: DominoState) {
  if (s.game === 'bergen') {
    if (s.lines.every((l) => !l.tiles.length)) return double(s.hub!) ? 2 : 0;
    if (s.lines[0].pip !== s.lines[1].pip) return 0;
    return s.lines.some((l) => double(l.tiles.at(-1) ?? s.hub!)) ? 3 : 2;
  }
  const pips = openPips(s);
  const fives = pips % 5 === 0 ? pips / 5 : 0;
  if (s.game === 'fives-threes') return fives + (pips % 3 === 0 ? pips / 3 : 0);
  if (s.game === 'five-up') return fives;
  return s.game === 'sniff' || s.game === 'seven-rocks' ? fives * 5 : 0;
}

function settleDomino(s: DominoState, finisher?: number) {
  const penalties = s.hands.map((hand) =>
    sum(hand.map((tile) => (s.game === 'chicken' && tile === 0 ? 50 : pipTotal(tile)))),
  );
  if (s.game === 'mexican' || s.game === 'chicken') {
    penalties.forEach((points, seat) => addPoints(s, seat, points));
    settle(s, s.round >= s.limit, true);
    return;
  }
  const totals = penalties.map((value, seat) =>
    s.teams ? value + penalties[(seat + 2) % 4] : value,
  );
  const seats = s.players.map((_, seat) => seat).filter((seat) => !s.teams || seat < 2);
  const rank = (seat: number) =>
    s.game === 'bergen' ? s.hands[seat].filter(double).length * 1000 + totals[seat] : totals[seat];
  const min = Math.min(...seats.map(rank));
  const lowest = seats.filter((seat) => rank(seat) === min);
  const winner = finisher ?? (lowest.length === 1 ? lowest[0] : undefined);
  if (winner !== undefined && s.game !== 'fives-threes') {
    const opposition = sum(penalties.filter((_, seat) => teamOf(s, seat) !== teamOf(s, winner)));
    let points = opposition;
    if (s.game === 'competitive') points = sum(penalties);
    if (s.game === 'cyprus' && finisher === undefined)
      points = Math.max(0, opposition - penalties[winner]);
    if (s.game === 'five-up') {
      points = Math.round(opposition / 5);
      if (s.players.length === 3) {
        const opponents = penalties
          .map((_, seat) => seat)
          .filter((seat) => seat !== winner)
          .sort((a, b) => penalties[a] - penalties[b]);
        const low = Math.round(penalties[opponents[0]] / 5),
          high = Math.round(penalties[opponents[1]] / 5);
        if (finisher !== undefined) addPoints(s, opponents[0], high - low);
        points =
          finisher === undefined
            ? Math.max(0, low + high - Math.round(penalties[winner] / 5))
            : low + high;
      }
    }
    if (s.game === 'seven-rocks' || s.game === 'sniff') points = Math.round(opposition / 5) * 5;
    if (s.game === 'bergen') points = 2;
    addPoints(s, winner, points);
    if (s.event) s.event.amount = (s.event.amount ?? 0) + points;
  }
  const high = Math.max(...s.scores);
  settle(s, s.game === 'five-up' ? high > s.limit : high >= s.limit);
}

function addSpinner(s: DominoState, line: number, tile: number) {
  if (!double(tile) || (s.game !== 'five-up' && s.spinners.length)) return;
  const at = line < 0 ? -1 : s.lines[line].tiles.length - 1;
  s.spinners.push({
    tile,
    line,
    at,
    expanded: false,
    directions: line < 0 ? [0, 1] : [line, line],
  });
}

function expandSpinners(s: DominoState) {
  for (const spinner of s.spinners) {
    if (spinner.expanded) continue;
    const ready =
      spinner.line === -1
        ? spinner.directions.every((i) => s.lines[i].tiles.length)
        : s.lines[spinner.line].tiles.length > spinner.at + 1;
    if (!ready) continue;
    const pip = spinner.tile & 15;
    s.lines.push(newLine(pip, spinner.line, spinner.at), newLine(pip, spinner.line, spinner.at));
    spinner.expanded = true;
  }
}

function nextDomino(s: DominoState, seat: number) {
  s.drawn = 0;
  s.trainBonus = false;
  s.turn = nextSeat(s, seat);
}

export function applyDomino(s: DominoState, seat: number, action: TableAction) {
  const valid = dominoMoves(s, seat).some(
    (move) =>
      move.type === action.type &&
      (move.type !== 'place' ||
        (action.type === 'place' && move.tile === action.tile && move.end === action.end)),
  );
  if (!valid) return false;
  if (action.type === 'draw') {
    s.hands[seat].push(s.stock.shift()!);
    s.drawn++;
    s.event = { key: 'draw', seat };
    return true;
  }
  if (action.type === 'pass') {
    s.event = { key: 'pass', seat };
    if (s.trainOpening[seat]) {
      if (!s.lines[seat].tiles.length) s.lines[seat].public = true;
      s.trainOpening[seat] = false;
      if (!s.trainOpening.some(Boolean) && s.hands.some((hand) => !hand.length)) settleDomino(s);
    } else {
      if (s.game === 'mexican') s.lines[seat].public = true;
      if (++s.passes === s.players.length) {
        s.event = { key: 'blocked', seat };
        settleDomino(s);
      }
    }
    nextDomino(s, seat);
    return true;
  }
  if (action.type !== 'place') return false;
  const { tile, end } = action;
  const [a, b] = dominoFaces(tile);
  remove(s.hands[seat], tile);
  s.passes = 0;
  if (s.hub === null) {
    s.hub = tile;
    const branches =
      s.game === 'cyprus'
        ? 8
        : s.game === 'chicken'
          ? 4
          : s.game === 'mexican'
            ? s.players.length + 1
            : 2;
    s.lines = Array.from({ length: branches }, (_, i) =>
      newLine(i === 0 ? a : b, -1, -1, i === s.players.length),
    );
    if (s.game === 'chicken' || s.game === 'cyprus') s.forced = s.lines.map((_, i) => i);
    if (['five-up', 'sniff', 'seven-rocks'].includes(s.game)) addSpinner(s, -1, tile);
  } else {
    const line = s.lines[end];
    const exposed = a === line.pip ? b : a;
    line.tiles.push(dominoTile(line.pip, exposed));
    line.pip = exposed;
    s.forced = s.forced.filter((i) => i !== end);
    if (s.game === 'chicken' && double(tile)) {
      const start = s.lines.length;
      const index = line.tiles.length - 1;
      s.lines.push(newLine(exposed, end, index), newLine(exposed, end, index));
      s.forced = [end, start, start + 1, ...s.forced];
    }
    if (['five-up', 'sniff', 'seven-rocks'].includes(s.game)) {
      addSpinner(s, end, tile);
      expandSpinners(s);
    }
    if (s.game === 'mexican' && seat === end) line.public = false;
  }
  const out = !s.hands[seat].length;
  const amount = onTablePoints(s) + (s.game === 'fives-threes' && out ? 1 : 0);
  const points = s.game === 'fives-threes' && s.scores[seat] + amount > s.limit ? 0 : amount;
  addPoints(s, seat, points);
  s.event = { key: out ? 'domino' : points ? 'score' : 'place', seat, amount: points };
  if ((s.game === 'bergen' || s.game === 'fives-threes') && s.scores[seat] >= s.limit)
    settle(s, true);
  else if (out && !s.trainOpening.some(Boolean)) settleDomino(s, seat);
  const extendTrain = s.game === 'mexican' && (s.trainOpening[seat] || double(tile));
  if (!extendTrain) nextDomino(s, seat);
  else {
    s.drawn = 0;
    s.trainBonus = !s.trainOpening[seat];
  }
  return true;
}

export function dominoCpu(s: DominoState, seat: number) {
  const moves = dominoMoves(s, seat);
  let best = moves[0],
    value = -Infinity;
  for (const move of moves) {
    if (move.type !== 'place') continue;
    const trial = structuredClone(s);
    if (!applyDomino(trial, seat, move)) continue;
    const options = trial.hands[seat].filter((tile) =>
      trial.lines.some((line) => matches(tile, line.pip)),
    ).length;
    const score =
      (trial.scores[seat] - s.scores[seat]) *
        (s.game === 'mexican' || s.game === 'chicken' ? -2 : 3) +
      pipTotal(move.tile) * 0.4 +
      options * 0.32 +
      (!trial.hands[seat].length ? 100 : 0);
    if (score > value) {
      value = score;
      best = move;
    }
  }
  return best;
}
