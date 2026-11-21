import { dominoDeck, dominoFaces, dominoTile, type DominoLine } from './domino';
import { dominoCorners, dominoOverlap, type DominoLayout, type DominoNode } from './dominoLayout';
import {
  addPoints,
  deal,
  nextSeat,
  random,
  remove,
  settle,
  shuffle,
  sum,
  type ExtraDominoGame,
  type TableAction,
  type TableBase,
} from './model';

type LaneGame = Exclude<
  ExtraDominoGame,
  | 'sidominos'
  | 'broadway'
  | 'skyscraper'
  | 'eleven-point'
  | 'twenty-one-point'
  | 'bingo'
  | 'shanghai'
  | 'rummicube'
>;
export const isLaneGame = (game: ExtraDominoGame): game is LaneGame =>
  ![
    'sidominos',
    'broadway',
    'skyscraper',
    'eleven-point',
    'twenty-one-point',
    'bingo',
    'shanghai',
    'rummicube',
  ].includes(game);
export const NOS_CONTRACTS = [
  'ノーマル',
  'ノーマルクロス',
  'ノーマルダブルクロス',
  'ロシア',
  'ロシアクロス',
  'ロシアダブルクロス',
  'ノーマルクロス → ロシア',
  'ノーマルクロス → ロシアダブルクロス',
  'ロシアクロス → ノーマル',
  'ロシアクロス → ノーマルダブルクロス',
  '条件つき',
  'ボラプク',
  'トライアングル',
  'トライアングルダブルクロス',
  'トライアングル → ノーマル',
  'トライアングル → ノーマルクロス',
  'ロシア2回 → ノーマルクロス',
  'ボラプククロス',
  'ボラプクダブルクロス',
  'ロシア2回 → ノーマルダブルクロス',
] as const;
export const NOS_ENGLISH = [
  'Ordinary',
  'Ordinary cross',
  'Ordinary double cross',
  'Russian (Matador)',
  'Russian cross',
  'Russian double cross',
  'Ordinary cross → Russian',
  'Ordinary cross → Russian double cross',
  'Russian cross → ordinary',
  'Russian cross → ordinary double cross',
  'Conditional',
  'Volapük',
  'Triangle',
  'Triangle double cross',
  'Triangle → ordinary',
  'Triangle → ordinary cross',
  'Two Russian starts → ordinary cross',
  'Volapük cross',
  'Volapük double cross',
  'Two Russian starts → ordinary double cross',
] as const;
export const LANE_CHALLENGE = 30,
  LANE_BLOCK = 31,
  LANE_BUYBACK = 32,
  LANE_DECLARE = 33;
type Placed = { actual: number; face: number; end: number; seat: number };
export type LaneState = TableBase & {
  kind: 'domino-lanes';
  game: LaneGame;
  stock: number[];
  hub: number | null;
  lines: DominoLine[];
  forced: number[];
  history: Placed[];
  passes: number;
  drawn: number;
  played: number;
  opener: number | null;
  previousWinner: number | null;
  anchorSeat: number | null;
  stage:
    | 'play'
    | 'react'
    | 'contract'
    | 'condition'
    | 'declare'
    | 'early-double'
    | 'block'
    | 'buyback';
  contract: number;
  condition: number;
  declared: number[][];
  skip: number[];
  block: number | null;
  dice: number[];
  bets: number[];
  mustBet: number | null;
  lastBetRound: number[];
  turnCounts: number[];
  eliminated: number[];
  exits: number[];
  seen: string[];
  deadline: number | null;
  lastPlaced: number | null;
  chips: number[];
  pool: number;
  revealed: number | null;
  shown: number[][];
  openedBlind: number | null;
};
const line = (pip: number): DominoLine => ({
  pip,
  tiles: [],
  parent: -1,
  anchor: -1,
  public: true,
});
const left = (tile: number) => dominoFaces(tile)[0];
const right = (tile: number) => dominoFaces(tile)[1];
const pipTotal = (tile: number) => left(tile) + right(tile);
const isDouble = (tile: number) => left(tile) === right(tile);
const weight = (tile: number) => pipTotal(tile) * 16 + Math.max(left(tile), right(tile));
const heavy = (hand: number[]) => [...hand].sort((a, b) => weight(b) - weight(a))[0];
const flip = (tile: number) => dominoTile(right(tile), left(tile));
const same = (a: number, b: number) => a === b || flip(a) === b;
const matador = (tile: number) => tile === 0 || pipTotal(tile) === 7;
const rotate = (s: LaneState) => {
  do s.turn = nextSeat(s, s.turn);
  while (s.eliminated.includes(s.turn) || s.exits.includes(s.turn));
};
const decide = (s: LaneState, key: TableBase['event'] & object) => {
  s.event = key;
};
const dealCount = [0, 0, 14, 9, 7, 5, 4, 4, 3];
const scoreDice = (s: LaneState) => Array.from({ length: 4 }, () => 1 + Math.floor(random(s) * 6));
function setDeadline(s: LaneState) {
  s.deadline = s.game === 'speed' ? Date.now() + 20000 : null;
}
function chipTransfer(s: LaneState, from: number, to: number, chips: number) {
  s.scores[from] -= chips;
  s.scores[to] += chips;
}
function chipAll(s: LaneState, seat: number, chips: number, active = false) {
  for (const i of s.hands.keys())
    if (i !== seat && (!active || !s.exits.includes(i))) chipTransfer(s, i, seat, chips);
}
function seedBoard(s: LaneState, tile: number, seat: number) {
  s.hub = tile;
  s.lines = [line(left(tile)), line(right(tile))];
  s.history.push({ actual: tile, face: tile, end: -1, seat });
}
const maxWeightSeat = (hands: number[][]) =>
  hands.reduce(
    (best, hand, i) =>
      hand.length && (!hands[best].length || weight(heavy(hand)) > weight(heavy(hands[best])))
        ? i
        : best,
    0,
  );
const isAustrian = (game: LaneGame) =>
  game === 'buki' || game === 'pulle' || game === 'austrian-block' || game === 'austrian-draw';

export function laneDeal(s: LaneState) {
  const n = s.players.length,
    game = s.game;
  if (game === 'nos' && s.round === 1) {
    s.scores.fill(500);
    s.roundStartScores.fill(500);
  }
  if (game === 'pulle' && s.round === 1) {
    s.chips = s.players.map(() => 8);
    s.pool = s.players.length * 2;
  }
  const deck = dominoDeck(isAustrian(game) ? 8 : 6).filter(
    (tile) => !isAustrian(game) || !isDouble(tile),
  );
  const count =
    game === 'buki'
      ? 6
      : game === 'pulle' || game === 'dead-space'
        ? 7
        : isAustrian(game)
          ? n === 2
            ? 8
            : 7
          : game === 'flower-scorpion'
            ? n === 4
              ? 5
              : 6
            : game === 'nos'
              ? 8 - n
              : dealCount[n];
  do {
    const cards = shuffle(s, [...deck]);
    s.stock = deal(s, cards, count);
    if (game === 'pulle') {
      for (const i of s.eliminated) s.stock.push(...s.hands[i].splice(0));
    } else if (game === 'billitonnen' && n === 5) {
      for (let i = 0; i < 3; i++) s.hands[(s.dealer + i) % n].push(s.stock.shift()!);
    }
  } while (game === 'nos' && s.round === 1 && !s.hands.some((hand) => hand.some(isDouble)));
  s.turn = s.dealer;
  s.hub = null;
  s.lines = [];
  s.forced = [];
  s.history = [];
  s.passes = s.drawn = s.played = 0;
  s.opener = null;
  s.anchorSeat = null;
  s.contract = 0;
  s.condition = 0;
  s.stage = 'play';
  s.declared = s.players.map(() => []);
  s.shown = s.players.map(() => []);
  s.skip = s.players.map(() => 0);
  s.turnCounts = s.players.map(() => 0);
  s.block = null;
  s.exits = [];
  s.seen = [];
  s.revealed = null;
  s.openedBlind = null;
  s.lastPlaced = null;
  if (game === 'buki') {
    if (s.round === 1) s.turn = maxWeightSeat(s.hands);
    if (s.previousWinner !== null) s.turn = s.previousWinner;
  }
  if ((game === 'austrian-block' || game === 'austrian-draw') && s.round === 1)
    s.turn = maxWeightSeat(s.hands);
  if (game === 'pulle') {
    if (s.eliminated.includes(s.turn)) rotate(s);
    if (s.round > 1 && !s.eliminated.length) {
      s.stage = 'buyback';
      s.anchorSeat = s.turn;
    }
  }
  if (game === 'speed') {
    s.turn = maxWeightSeat(s.hands);
    s.opener = heavy(s.hands[s.turn]);
  }
  if (game === 'flower-scorpion') s.dice = scoreDice(s);
  if (game === 'nos') {
    if (s.round === 1) s.turn = maxWeightSeat(s.hands.map((h) => h.filter(isDouble)));
    else s.turn = s.previousWinner ?? s.turn;
    s.dealer = s.turn;
    if (!s.hands[s.turn].some(isDouble)) {
      const tile = s.stock.shift()!;
      seedBoard(s, tile, s.turn);
      chipAll(s, s.turn, isDouble(tile) ? 2 * (left(tile) || 7) : -pipTotal(tile));
      s.stage = 'contract';
    }
  }
  if (game === 'billitonnen') {
    s.turn = s.dealer;
    if (n === 3) seedBoard(s, s.stock.pop()!, s.turn);
    else {
      seedBoard(s, s.hands[s.turn].pop()!, s.turn);
      rotate(s);
    }
  }
  setDeadline(s);
}

const crossContract = (n: number) =>
  [1, 2, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19].includes(n) && n !== 15;
const triangle = (n: number) => n >= 12 && n <= 15;
const russianOpening = (n: number) => [4, 5, 8, 9].includes(n);
function nosContractAllowed(s: LaneState, n: number) {
  if (s.hub === null) return false;
  if (triangle(n)) return s.hub === 0;
  if (crossContract(n)) return isDouble(s.hub) && (!russianOpening(n) || s.hub !== 0);
  return true;
}
function nosRule(s: LaneState, end: number) {
  const mode = s.contract,
    len = s.lines[end].tiles.length;
  const total = s.history.length - 1;
  let russian =
    [3, 4, 5, 12, 13].includes(mode) ||
    ([6, 7].includes(mode) && total >= 4) ||
    ([8, 9].includes(mode) && total < 4) ||
    ([11, 17, 18].includes(mode) && end % 2 !== s.condition % 2) ||
    ([14, 15].includes(mode) && total < 3) ||
    ([16, 19].includes(mode) && end < 2 && len === 0);
  if (mode === 10) {
    const variant = Math.floor(s.condition / 10);
    const limit = s.condition % 5 || 2;
    russian =
      variant === 1 || (variant === 2 && total >= limit) || (variant === 3 && total < limit);
  }
  const doubleNext =
    (([2, 5, 7, 8, 9, 18, 19].includes(mode) && total >= 4) || (mode === 13 && total >= 3)) &&
    len === 1;
  return {
    russian,
    doubleNext,
    matadorNext: doubleNext && russian && mode !== 13,
  };
}
function availableEnds(s: LaneState) {
  const ends = s.lines.map((_, i) => i);
  if (s.stage === 'early-double') return ends;
  if (s.game !== 'nos') return ends;
  const total = s.history.length - 1;
  if (crossContract(s.contract) || triangle(s.contract)) {
    const roots = ends.filter((i) => !s.lines[i].tiles.length);
    if (roots.length) {
      if (s.contract === 15) return total < 3 ? roots.filter((i) => i < 3) : roots;
      if ([16, 19].includes(s.contract)) return roots.filter((i) => i < 2 === total < 2);
      return roots;
    }
  }
  if (s.contract === 10) {
    const arm = Math.floor(s.condition / 5) % 2;
    const count = s.condition % 5;
    if (count === 0 && total < 2) return [total === 0 ? arm : 1 - arm];
    if (total < count) return [arm];
  }
  return ends;
}

function keepLeftNodes(s: Pick<LaneState, 'hub' | 'lines'>) {
  if (s.hub === null) return { nodes: [] as DominoNode[], ends: [] as DominoLayout['ends'] };
  const length = 64,
    width = 32,
    gap = 0.8;
  const root: DominoNode = {
    key: 'hub',
    tile: s.hub,
    x: 0,
    y: 0,
    flow: 0,
    angle: 0,
    width: length,
    height: width,
  };
  const nodes = [root];
  const ends = s.lines.map(({ tiles, pip }, arm) => {
    let flow = arm ? 0 : Math.PI;
    let x = Math.cos(flow) * (length / 2 + gap),
      y = Math.sin(flow) * (length / 2 + gap);
    for (const [i, tile] of tiles.entries()) {
      const crosswise = isDouble(tile),
        offset = (crosswise ? width : length) / 2;
      const dx = Math.cos(flow),
        dy = Math.sin(flow);
      const node = {
        key: arm + '-' + i,
        tile,
        x: x + dx * offset,
        y: y + dy * offset,
        flow,
        angle: flow - (crosswise ? Math.PI / 2 : 0),
        width: length,
        height: width,
      };
      nodes.push(node);
      if (crosswise) flow -= Math.PI / 2;
      x = node.x + Math.cos(flow) * (length / 2 + gap);
      y = node.y + Math.sin(flow) * (length / 2 + gap);
    }
    return { x, y, line: arm, pip, flow };
  });
  return { nodes, ends };
}
export function keepLeftLayout(s: Pick<LaneState, 'hub' | 'lines'>): DominoLayout {
  const { nodes, ends } = keepLeftNodes(s);
  const points = [...nodes.flatMap(dominoCorners), ...ends, { x: -52, y: -42 }, { x: 52, y: 42 }];
  const x = Math.min(...points.map((p) => p.x)) - 38,
    y = Math.min(...points.map((p) => p.y)) - 38;
  return {
    nodes,
    ends,
    labels: [],
    engine: false,
    bounds: {
      x,
      y,
      width: Math.max(...points.map((p) => p.x)) + 38 - x,
      height: Math.max(...points.map((p) => p.y)) + 38 - y,
    },
  };
}

function fit(s: LaneState, tile: number, end: number, ignore = false) {
  if (s.hub === null) return end === -1 ? [tile] : [];
  if (!s.lines[end] || !availableEnds(s).includes(end)) return [];
  const pip = s.lines[end].pip;
  const last = s.lines[end].tiles.at(-1);
  const { russian, doubleNext, matadorNext } =
    s.game === 'nos' ? nosRule(s, end) : { russian: false, doubleNext: false, matadorNext: false };
  if (doubleNext && !isDouble(tile) && !(matadorNext && matador(tile))) return [];
  let oriented = [...new Set([tile, flip(tile)])].filter(
    (t) =>
      ignore ||
      (russian
        ? (matador(t) && (last === undefined || !matador(last))) || left(t) + pip === 7
        : left(t) === (s.game === 'one-up' ? (pip + 1) % 7 : pip)),
  );
  if (s.game === 'keep-left' && oriented.length) {
    const board = keepLeftNodes(s);
    const lines = s.lines.map((line, i) =>
      i === end ? { ...line, tiles: [...line.tiles, tile] } : line,
    );
    const after = keepLeftNodes({ hub: s.hub, lines }).nodes;
    const next = after.find((node) => node.key === end + '-' + s.lines[end].tiles.length)!;
    if (board.nodes.some((node) => dominoOverlap(node, next))) oriented = [];
  }
  return oriented;
}
const drawable = (s: LaneState) => s.stock.length > (s.game === 'nos' ? 2 : 0);

function placements(s: LaneState, hand: number[], ignore = false) {
  const moves: Extract<TableAction, { type: 'place' }>[] = [];
  for (const tile of hand) {
    if (s.game === 'dead-space' && left(tile) === 0) continue;
    if (s.hub === null) {
      if (s.opener !== null && tile !== s.opener) continue;
      if (s.game === 'nos' && !isDouble(tile)) continue;
      moves.push({ type: 'place', tile, end: -1 });
    } else
      for (const end of availableEnds(s)) {
        const options = fit(s, tile, end, ignore);
        for (const t of options)
          moves.push({ type: 'place', tile, end: end + (t === tile ? 0 : 8) });
      }
  }
  return moves;
}

function canBet(s: LaneState, seat: number) {
  return (
    seat !== s.dealer &&
    s.lastBetRound[seat] !== s.round &&
    (s.bets[seat] < 6 || s.turnCounts[seat] === 0 || s.turnCounts[seat] === 2)
  );
}

export function laneMoves(s: LaneState, seat: number): TableAction[] {
  if (s.turn !== seat) return [];
  const hand = s.hands[seat],
    game = s.game;
  if (s.stage === 'react') return [{ type: 'option', value: LANE_CHALLENGE }, { type: 'pass' }];
  if (s.stage === 'contract')
    return NOS_CONTRACTS.flatMap((_, value) =>
      nosContractAllowed(s, value) ? [{ type: 'option', value }] : [],
    );
  if (s.stage === 'condition')
    return Array.from({ length: s.contract === 10 ? 40 : 2 }, (_, value) => ({
      type: 'option',
      value,
    }));
  if (s.stage === 'buyback')
    return s.chips[seat] > 0
      ? [{ type: 'option', value: LANE_BUYBACK }, { type: 'pass' }]
      : [{ type: 'pass' }];
  if (s.stage === 'declare') {
    const limit = s.players.length === 3 ? 4 : 3;
    return [
      ...(hand.filter(isDouble).length >= limit
        ? [{ type: 'option' as const, value: LANE_DECLARE }]
        : []),
      { type: 'pass' },
    ];
  }
  if (s.stage === 'block') return [{ type: 'option', value: LANE_BLOCK }, { type: 'pass' }];
  if (s.stage === 'early-double')
    return [...placements(s, hand.filter(isDouble)), { type: 'pass' }];
  if (game === 'nos' && s.skip[seat]) return [{ type: 'pass' }];
  if (game === 'billitonnen') {
    if (s.openedBlind !== null) return placements(s, [s.openedBlind]);
    return [
      { type: 'option', value: 0 },
      { type: 'option', value: 1 },
    ];
  }
  if (game === 'bluffing') {
    const ends = s.hub === null ? [-1] : [0, 1];
    return hand.flatMap((tile) =>
      ends.flatMap((end): TableAction[] => {
        if (end === -1)
          return dominoDeck(6).map((face) => ({
            type: 'claim',
            tile,
            end,
            face,
          }));
        return Array.from({ length: 7 }, (_, pip) => ({
          type: 'claim',
          tile,
          end,
          face: dominoTile(s.lines[end].pip, pip),
        }));
      }),
    );
  }
  let moves: TableAction[] = placements(
    s,
    hand,
    game === 'request' && s.passes >= s.players.length,
  );
  if (game === 'double-edged' && s.hub !== null) {
    const singles = moves.filter((a) => a.type === 'place');
    const first = singles.filter((a) => a.end % 8 === 0);
    const second = singles.filter((a) => a.end % 8 === 1);
    moves = [
      ...singles.filter((a) => isDouble(a.tile)),
      ...first.flatMap((a) =>
        second
          .filter((b) => b.tile !== a.tile)
          .map((b): TableAction => ({ type: 'pair', tile: a.tile, other: b.tile })),
      ),
    ];
  }
  if (game === 'buki' && canBet(s, seat)) {
    const stakes: TableAction[] = [2, 4, 6]
      .filter((value) => value >= s.bets[seat])
      .map((value) => ({ type: 'option', value }));
    if (s.bets[seat] === 0 && (s.turnCounts[seat] >= 2 || s.mustBet === seat)) return stakes;
    moves.push(...stakes);
  }
  if (moves.some((move) => move.type === 'place' || move.type === 'pair')) {
    if (game === 'speed' && s.played) moves.push({ type: 'pass' });
    return moves;
  }
  if (game === 'give-or-take' && s.hub !== null)
    return (s.lines.some((l) => l.tiles.length) ? [0, 1] : [0]).map((value) => ({
      type: 'option',
      value,
    }));
  const draws =
    ['nos', 'flower-scorpion', 'austrian-draw', 'one-up'].includes(game) ||
    (game === 'double-edged' && !s.drawn) ||
    game === 'dead-space';
  moves.push({ type: draws && drawable(s) ? 'draw' : 'pass' });
  return moves;
}

function flowerScore(s: LaneState, tile: number) {
  const flower = dominoTile(s.dice[0], s.dice[1]),
    scorpion = dominoTile(s.dice[2], s.dice[3]);
  const [a, b] = s.lines;
  const doubles =
    Number(isDouble(a.tiles.at(-1) ?? s.hub!)) + Number(isDouble(b.tiles.at(-1) ?? s.hub!));
  const opening = s.history.length === 1;
  const ends = dominoTile(a.pip, b.pip);
  const bergen = opening ? (isDouble(tile) ? 2 : 0) : a.pip === b.pip ? 2 + Number(doubles > 0) : 0;
  return (
    bergen +
    Number(same(tile, flower)) -
    Number(same(tile, scorpion)) +
    (2 + doubles) * (Number(same(ends, flower)) - Number(same(ends, scorpion)))
  );
}
function roundEnd(s: LaneState, seat: number | null) {
  const game = s.game;
  const remaining = s.hands.map((hand) =>
    sum(hand.map((t) => (game === 'nos' && t === 0 ? 14 : pipTotal(t)))),
  );
  const active = s.hands.flatMap((_, i) => (s.eliminated.includes(i) ? [] : [i]));
  if (game === 'nos') {
    if (s.block !== null) chipAll(s, s.block, 20, true);
    for (const i of active)
      for (const j of active)
        if (remaining[j] > remaining[i]) chipTransfer(s, j, i, remaining[j] - remaining[i]);
    const stock = shuffle(s, dominoDeck(6));
    s.previousWinner = active.reduce((a, b) =>
      remaining[b] > remaining[a] ||
      (remaining[b] === remaining[a] && weight(stock[b]) > weight(stock[a]))
        ? b
        : a,
    );
    settle(s, s.round >= 5);
    return;
  }
  if (game === 'pulle') {
    for (const i of active) s.scores[i] += remaining[i];
    const eliminated = active.filter((i) => s.scores[i] >= 101);
    if (eliminated.length === active.length) {
      s.eliminated = [];
      s.scores.fill(0);
      s.chips = s.chips.map((chips) => chips - 2);
      s.pool += s.players.length * 2;
    } else s.eliminated.push(...eliminated);
    s.winners = active.filter((i) => !s.eliminated.includes(i));
    s.phase = s.winners.length === 1 ? 'result' : 'round';
    if (s.phase === 'result') {
      s.chips[s.winners[0]] += s.pool;
      s.pool = 0;
    }
    return;
  }
  if (game === 'flower-scorpion') {
    const pairHeld = (first: number, second: number) =>
      s.hands.findIndex((hand) => hand.some((tile) => same(tile, dominoTile(first, second))));
    const doubleHeld = s.hands.map((hand) => Math.min(16, ...hand.filter(isDouble).map(left)));
    const winner =
      seat ??
      [
        pairHeld(s.dice[0], s.dice[1]),
        pairHeld(s.dice[2], s.dice[3]),
        doubleHeld.some((pip) => pip < 16) ? doubleHeld.indexOf(Math.min(...doubleHeld)) : -1,
      ].find((i) => i >= 0);
    if (winner !== undefined) addPoints(s, winner, 2);
    settle(s, Math.max(...s.scores) >= 20);
    return;
  }
  const priority = (i: number) =>
    remaining[i] + (game === 'double-edged' ? 400 * s.hands[i].length : 0);
  const lowest = Math.min(...active.map(priority));
  const victors = seat === null ? active.filter((i) => priority(i) === lowest) : [seat];
  const winner = victors.length === 1 ? victors[0] : null;
  if (game === 'buki') {
    s.previousWinner = winner ?? s.history.at(-1)?.seat ?? s.turn;
    if (winner !== null) {
      for (const i of active) {
        if (i === s.dealer) continue;
        if (i === winner) chipTransfer(s, s.dealer, i, 2.5 * s.bets[i]);
        else chipTransfer(s, i, s.dealer, s.bets[i]);
      }
      s.mustBet = winner === s.dealer ? null : winner;
      s.bets.fill(0);
    }
    settle(s, s.round >= 5);
    return;
  }
  if (game === 'billitonnen' || game === 'austrian-draw' || game === 'austrian-block') {
    for (const i of victors) addPoints(s, i, 1);
    settle(s, true);
    return;
  }
  if (winner !== null) addPoints(s, winner, 1);
  settle(s, s.round >= 5);
}

function shiftTurn(s: LaneState, started: number) {
  s.turn = started;
  if (s.game === 'buki') s.turnCounts[started]++;
  rotate(s);
  s.drawn = s.played = 0;
  setDeadline(s);
}
export function laneTick(s: LaneState, now: number) {
  if (s.game !== 'speed' || s.phase !== 'play' || s.deadline === null || now < s.deadline)
    return false;
  const seat = s.turn;
  if (s.opener !== null && s.hub === null) {
    const tile = s.opener;
    seedBoard(s, tile, seat);
    remove(s.hands[seat], tile);
    s.opener = null;
    decide(s, { key: 'place', seat });
  } else {
    s.passes = s.played ? 0 : s.passes + 1;
    decide(s, { key: 'pass', seat });
  }
  if (s.passes >= s.players.length) roundEnd(s, null);
  else shiftTurn(s, seat);
  return true;
}
function place(s: LaneState, seat: number, tile: number, end: number, upright: number) {
  if (end < 0) {
    seedBoard(s, upright, seat);
    s.history.at(-1)!.actual = tile;
  } else {
    s.lines[end].tiles.push(upright);
    s.lines[end].pip = right(upright);
    s.history.push({ actual: tile, face: upright, end, seat });
  }
  remove(s.hands[seat], tile);
  s.opener = null;
  s.passes = 0;
  decide(s, { key: 'place', seat });
}
function rebuild(s: LaneState) {
  const entries = [...s.history];
  s.history.length = 0;
  s.hub = null;
  s.lines = [];
  if (!entries.length) return;
  // When the original joint is collected, promote the nearest remaining tile without reversing the chain.
  const arms = [entries.filter((p) => p.end === 0), entries.filter((p) => p.end === 1)];
  const hub = entries.find((p) => p.end === -1) ?? arms[0].shift() ?? arms[1].shift()!;
  if (hub.end === 0) hub.face = flip(hub.face);
  hub.end = -1;
  s.hub = hub.face;
  s.history.push(hub, ...entries.filter((p) => p !== hub));
  s.lines = [line(left(s.hub)), line(right(s.hub))];
  for (const [i, arm] of arms.entries()) {
    s.lines[i].tiles = arm.map((p) => p.face);
    if (arm.length) s.lines[i].pip = right(arm.at(-1)!.face);
  }
}

function afterDeclaration(s: LaneState, seat: number) {
  s.turn = nextSeat(s, seat);
  if (s.turn !== s.dealer) return;
  s.turn = nextSeat(s, s.dealer);
  const double = isDouble(s.hub!);
  const early =
    ![11, 17, 18].includes(s.contract) && (!double || [0, 1, 2, 10].includes(s.contract));
  s.stage = early ? 'early-double' : 'play';
}
function declareNos(s: LaneState, contract: number) {
  s.contract = contract;
  if (triangle(contract)) s.lines = Array.from({ length: contract === 15 ? 4 : 3 }, () => line(0));
  else if (crossContract(contract)) s.lines = Array.from({ length: 4 }, () => line(left(s.hub!)));
  s.stage = [10, 11, 17, 18].includes(contract) ? 'condition' : 'declare';
}
function nosAfterPlay(s: LaneState, seat: number) {
  if (!s.hands[seat].length) {
    if (!s.exits.length) chipAll(s, seat, 5);
    s.exits.push(seat);
    if (s.exits.length >= s.players.length - 1) {
      roundEnd(s, seat);
      return;
    }
  } else if (s.block === null && s.hands[seat].length && s.players.length - s.exits.length >= 2) {
    s.stage = 'block';
    return;
  }
  shiftTurn(s, seat);
}
function matchMove(a: TableAction, b: TableAction) {
  if (a.type !== b.type) return false;
  if (a.type === 'place' && b.type === 'place') return a.tile === b.tile && a.end === b.end;
  if (a.type === 'pair' && b.type === 'pair') return a.tile === b.tile && a.other === b.other;
  if (a.type === 'claim' && b.type === 'claim')
    return a.tile === b.tile && a.face === b.face && a.end === b.end;
  if (a.type === 'option' && b.type === 'option') return a.value === b.value;
  return a.type === 'pass' || a.type === 'draw';
}

export function laneApply(s: LaneState, seat: number, a: TableAction) {
  if (
    s.turn !== seat ||
    (s.deadline !== null && Date.now() >= s.deadline) ||
    !laneMoves(s, seat).some((b) => matchMove(a, b))
  )
    return false;
  const hand = s.hands[seat];
  if (s.stage === 'react') {
    const last = s.history.at(-1)!;
    if (a.type === 'option') {
      const receiver = same(last.actual, last.face) ? seat : last.seat;
      s.revealed = last.actual;
      s.hands[receiver].push(...s.history.map((entry) => entry.actual));
      s.history = [];
      rebuild(s);
      s.passes = 0;
    }
    s.turn = nextSeat(s, seat);
    if (a.type === 'option' || s.turn === last.seat) {
      s.stage = 'play';
      if (!s.hands[last.seat].length) roundEnd(s, last.seat);
      shiftTurn(s, last.seat);
    }
    return true;
  }
  if (s.stage === 'contract') {
    if (a.type === 'option') declareNos(s, a.value);
    return true;
  }
  if (s.stage === 'condition') {
    if (a.type === 'option') s.condition = a.value;
    s.stage = 'declare';
    return true;
  }
  if (s.stage === 'declare') {
    if (a.type === 'option') {
      s.declared[seat] = hand.filter(isDouble);
      const n = s.declared[seat].length;
      chipAll(
        s,
        seat,
        s.players.length === 3
          ? n === 5
            ? 500
            : 200
          : s.players.length === 4
            ? n === 4
              ? 250
              : 25
            : 30,
      );
    }
    afterDeclaration(s, seat);
    return true;
  }
  if (s.stage === 'early-double') {
    if (a.type === 'place') {
      const end = a.end % 8;
      place(s, seat, a.tile, end, a.end >= 8 ? flip(a.tile) : a.tile);
      chipTransfer(s, s.dealer, seat, left(a.tile) || 7);
      s.skip[seat]++;
      return true;
    }
    s.turn = nextSeat(s, seat);
    if (s.turn === s.dealer) {
      s.stage = 'play';
      s.turn = nextSeat(s, s.dealer);
    }
    return true;
  }
  if (s.stage === 'block') {
    if (a.type === 'option') s.block = seat;
    s.stage = 'play';
    shiftTurn(s, seat);
    return true;
  }
  if (s.stage === 'buyback') {
    if (a.type === 'option') {
      const others = s.scores.filter((_, i) => i !== seat).sort((a, b) => a - b);
      s.scores[seat] = others[1] + Number(others[0] === others[2]);
      s.chips[seat]--;
      s.pool++;
    }
    rotate(s);
    if (s.turn === s.anchorSeat) {
      s.stage = 'play';
      s.anchorSeat = null;
    }
    return true;
  }
  if (a.type === 'claim') {
    place(s, seat, a.tile, a.end, a.face);
    s.revealed = null;
    s.stage = 'react';
    s.turn = nextSeat(s, seat);
    return true;
  }
  if (a.type === 'option') {
    if (s.game === 'buki') {
      s.bets[seat] = a.value;
      s.lastBetRound[seat] = s.round;
      return true;
    }
    if (s.game === 'billitonnen') {
      const tile = hand.at(-1)!;
      s.revealed = tile;
      if (fit(s, tile, a.value).length) {
        s.openedBlind = tile;
        s.passes = 0;
      } else {
        hand.unshift(hand.pop()!);
        if (isDouble(tile) && !s.shown[seat].includes(tile)) s.shown[seat].push(tile);
        s.passes++;
        // A failed reveal rotates the concealed hand. Only call a block when no tile can ever match.
        if (s.passes >= s.players.length && s.hands.every((h) => !placements(s, h).length))
          roundEnd(s, null);
        else shiftTurn(s, seat);
      }
      return true;
    }
    const reverseIndex = [...s.history].reverse().findIndex((p) => p.end === a.value);
    const index = reverseIndex < 0 ? 0 : s.history.length - 1 - reverseIndex;
    const removed = s.history.splice(index < 0 ? 0 : index, 1)[0];
    hand.push(removed.actual);
    rebuild(s);
    decide(s, { key: 'draw', seat });
    shiftTurn(s, seat);
    const signature = JSON.stringify([
      s.turn,
      s.history.map((p) => [p.face, p.end]),
      s.hands.map((h) => [...h].sort((a, b) => a - b)),
    ]);
    if (s.seen.includes(signature)) roundEnd(s, null);
    else s.seen.push(signature);
    return true;
  }
  if (a.type === 'draw') {
    const count = s.game === 'double-edged' ? 2 : 1;
    hand.push(...s.stock.splice(0, count));
    decide(s, { key: 'draw', seat });
    s.drawn++;
    if (s.game === 'dead-space') {
      shiftTurn(s, seat);
      s.passes = 0;
    }
    return true;
  }
  if (a.type === 'pass') {
    decide(s, { key: 'pass', seat });
    if (s.game === 'nos' && s.skip[seat]) {
      s.skip[seat]--;
      shiftTurn(s, seat);
      return true;
    }
    if (s.game === 'request' && s.anchorSeat === null) s.anchorSeat = seat;
    s.passes = s.played ? 0 : s.passes + 1;
    const seats = s.players.length - s.exits.length - s.eliminated.length;
    if (s.passes >= seats && s.game !== 'request') roundEnd(s, null);
    else shiftTurn(s, seat);
    return true;
  }
  if (a.type !== 'place' && a.type !== 'pair') return false;
  const opening = s.hub === null;
  const last = s.history.at(-1);
  const lastPlaced = s.lastPlaced;
  s.lastPlaced = seat;
  const end = a.type === 'pair' ? 0 : a.end % 8;
  const attached = [...s.history].reverse().find((entry) => entry.end === end) ?? s.history[0];
  if (a.type === 'pair') place(s, seat, a.tile, end, fit(s, a.tile, end)[0]);
  else place(s, seat, a.tile, end, a.end >= 8 ? flip(a.tile) : a.tile);
  if (a.type === 'pair') {
    const oriented = fit(s, a.other, 1)[0];
    place(s, seat, a.other, 1, oriented);
  }
  if (s.game === 'billitonnen') {
    s.openedBlind = null;
    s.shown[seat] = s.shown[seat].filter((tile) => tile !== a.tile);
    if (!hand.length) roundEnd(s, seat);
    return true;
  }
  if (s.game === 'nos') {
    s.declared[seat] = s.declared[seat].filter((tile) => tile !== a.tile);
    if (opening) {
      chipAll(s, seat, left(a.tile) || 7);
      s.stage = 'contract';
    } else {
      if (s.block !== null) chipAll(s, s.block, -40, true);
      s.block = null;
      if (isDouble(a.tile) && attached === last && last.seat !== seat && s.hands[last.seat].length)
        chipTransfer(s, last.seat, seat, left(a.tile) || 7);
      nosAfterPlay(s, seat);
    }
    return true;
  }
  if (s.game === 'pick-up' && lastPlaced !== null && lastPlaced !== seat && isDouble(a.tile)) {
    const others = s.history.filter(
      (entry) => entry.actual !== a.tile && dominoFaces(entry.actual).includes(left(a.tile)),
    );
    s.hands[lastPlaced].push(...others.map((entry) => entry.actual));
    s.history = s.history.filter((entry) => !others.includes(entry));
    rebuild(s);
  }
  if (s.game === 'flower-scorpion') {
    const score = flowerScore(s, a.tile);
    if (score) {
      addPoints(s, seat, score);
      decide(s, { key: 'score', seat, amount: score });
    }
    if (s.scores[seat] >= 20) {
      settle(s, true);
      return true;
    }
  }
  if (!hand.length) {
    decide(s, { key: 'domino', seat });
    roundEnd(s, seat);
    return true;
  }
  if (s.game === 'dead-space' && s.stock.length) hand.push(s.stock.shift()!);
  if (s.game === 'speed' && ++s.played < 3) return true;
  const started = s.anchorSeat ?? seat;
  s.anchorSeat = null;
  shiftTurn(s, started);
  return true;
}
export function laneCpu(s: LaneState, seat: number) {
  const moves = laneMoves(s, seat);
  if (s.stage === 'react') return moves[random(s) < 0.14 ? 0 : 1];
  if (s.stage === 'contract') return moves[Math.floor(random(s) * moves.length)];
  if (s.stage === 'block' || s.stage === 'buyback') return moves.find((a) => a.type === 'pass');
  if (s.game === 'billitonnen' && s.openedBlind === null)
    return moves[Math.floor(random(s) * moves.length)];
  if (s.game === 'bluffing') {
    const truthful = moves.filter((a) => a.type === 'claim' && same(a.tile, a.face));
    const choices = truthful.length && random(s) < 0.86 ? truthful : moves;
    return choices[Math.floor(random(s) * choices.length)];
  }
  const priority = (a: TableAction) =>
    a.type === 'place'
      ? weight(a.tile)
      : a.type === 'pair'
        ? 256 + weight(a.tile) + weight(a.other)
        : -1;
  return [...moves].sort((a, b) => priority(b) - priority(a))[0];
}
