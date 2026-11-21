import { dominoDeck, dominoFaces, dominoTile } from './domino';
import {
  addPoints,
  deal,
  nextSeat,
  remove,
  settle,
  shuffle,
  sum,
  type TableAction,
  type TableBase,
} from './model';

type TrickGame = 'eleven-point' | 'twenty-one-point' | 'bingo';
export const isTrickGame = (game: string): game is TrickGame =>
  game === 'eleven-point' || game === 'twenty-one-point' || game === 'bingo';
type Play = { seat: number; tile: number };
export type TrickState = TableBase & {
  kind: 'domino-tricks';
  game: TrickGame;
  stock: number[];
  exchange: number[][];
  stage: 'exchange' | 'trick' | 'claim';
  suit: number | null;
  trump: number | null;
  indicator: number | null;
  trick: Play[];
  lastTrick: Play[];
  captured: number[][];
  trickCounts: number[];
  announced: number[][];
  bonuses: number[];
  requiredDoubles: number[];
  closer: number | null;
  closePoints: number;
  closeTricks: number;
  nextLeader: number | null;
  yieldLead: boolean;
};
export const BINGO_CLOSE = 1,
  BINGO_CLAIM = 2,
  TRICK_YIELD = 3;
const isDouble = (tile: number) => dominoFaces(tile)[0] === dominoFaces(tile)[1];
const strengthPip = (value: number) => value || 7;

export function trickDeal(s: TrickState) {
  const bingo = s.game === 'bingo';
  if (s.nextLeader !== null) s.dealer = s.nextLeader;
  s.stock = deal(s, shuffle(s, dominoDeck(6)), s.players.length === 3 ? 9 : 7);
  s.turn = s.dealer;
  s.exchange = s.players.map(() => []);
  s.captured = s.players.map(() => []);
  s.trickCounts = s.players.map(() => 0);
  s.announced = s.players.map(() => []);
  s.bonuses = s.players.map(() => 0);
  s.trick = [];
  s.lastTrick = [];
  s.suit = null;
  s.closer = null;
  s.requiredDoubles = [];
  s.yieldLead = !bingo && s.round > 1;
  s.indicator = bingo ? s.stock.pop()! : null;
  s.trump =
    s.indicator === null ? null : Math.max(...dominoFaces(s.indicator).map(strengthPip)) % 7;
  s.stage = bingo ? 'trick' : 'exchange';
}
function matches(tile: number, suit: number, trump: number | null) {
  const faces = dominoFaces(tile);
  if (trump !== null && faces.includes(trump)) return suit === trump;
  return suit === 7 ? isDouble(tile) : faces.includes(suit);
}
function ranking(tile: number, suit: number, trump: number | null) {
  const [a, b] = dominoFaces(tile);
  if (trump !== null && tile === 0) return 100;
  const isTrump = trump !== null && (a === trump || b === trump);
  if (!isTrump && !matches(tile, suit, trump)) return -1;
  if (suit === 7) return a;
  const relevant = isTrump ? trump : suit;
  const other = a === relevant ? b : a;
  return (isTrump ? 20 : 0) + (a === b ? 8 : trump === null ? other : strengthPip(other));
}
function tilePoints(s: TrickState, tile: number) {
  const faces = dominoFaces(tile);
  if (s.game === 'eleven-point') return tile === 0 ? 4 : Number(faces.includes(3));
  if (s.game === 'twenty-one-point')
    return tile === 0 ? 11 : Number(sum(faces) >= 5 && sum(faces) <= 7);
  const total = sum(faces.map(strengthPip));
  const trump = faces.includes(s.trump!);
  return trump && isDouble(tile) ? 28 : trump || isDouble(tile) || total === 10 ? total : 0;
}
const bingoPoints = (s: TrickState, seat: number) =>
  s.trickCounts[seat]
    ? sum(s.captured[seat].map((tile) => tilePoints(s, tile))) + s.bonuses[seat]
    : 0;
const legalDoubles = (s: TrickState, seat: number) =>
  s.hands[seat].filter((tile) => isDouble(tile) && !s.announced[seat].includes(tile));

export function trickMoves(s: TrickState, seat: number): TableAction[] {
  if (seat !== s.turn) return [];
  const hand = s.hands[seat];
  if (s.stage === 'exchange') {
    return [
      {
        type: 'tiles',
        tiles: [...hand].sort((a, b) => tilePoints(s, b) - tilePoints(s, a)).slice(0, 3),
      },
    ];
  }
  if (s.stage === 'claim') return [{ type: 'option', value: BINGO_CLAIM }, { type: 'pass' }];
  const bingo = s.game === 'bingo';
  if (!s.trick.length) {
    const moves: TableAction[] = hand.flatMap<TableAction>((tile) => {
      if (bingo)
        return !s.requiredDoubles.length || s.requiredDoubles.includes(tile)
          ? [{ type: 'place', tile, end: 0 }]
          : [];
      const [a, b] = dominoFaces(tile);
      return (a === b ? [a, 7] : [a, b]).map((end) => ({
        type: 'place',
        tile,
        end,
      }));
    });
    if (bingo) {
      moves.push({ type: 'option', value: BINGO_CLAIM });
      if (s.trickCounts[seat] && s.stock.length && s.closer === null)
        moves.push({ type: 'option', value: BINGO_CLOSE });
      const doubles = legalDoubles(s, seat);
      if (doubles.length >= 2 && !s.requiredDoubles.length)
        moves.push({ type: 'tiles', tiles: doubles });
    } else if (s.yieldLead) moves.push({ type: 'option', value: TRICK_YIELD });
    return moves;
  }
  const suit = s.suit!;
  let eligible = hand;
  if (!bingo || !s.stock.length || s.closer !== null) {
    const follow = hand.filter((tile) => matches(tile, suit, s.trump));
    if (follow.length && bingo) {
      const leadRank = ranking(s.trick[0].tile, suit, s.trump);
      const higher = follow.filter((tile) => ranking(tile, suit, s.trump) > leadRank);
      eligible = higher.length ? higher : follow;
    } else if (follow.length) eligible = follow;
    else if (bingo) {
      const trumps = hand.filter((tile) => matches(tile, s.trump!, s.trump) || tile === 0);
      if (trumps.length) eligible = trumps;
    }
  }
  return eligible.map((tile) => ({ type: 'place', tile, end: 0 }));
}

function bingoFinish(s: TrickState, claimant: number | null, fixed?: number) {
  if (claimant !== null) {
    const opponent = nextSeat(s, claimant);
    const success = fixed !== undefined || bingoPoints(s, claimant) >= 70;
    const winner = success ? claimant : opponent;
    const otherPoints = s.closer === claimant ? s.closePoints : bingoPoints(s, opponent);
    const otherTricks = s.closer === claimant ? s.closeTricks : s.trickCounts[opponent];
    const chips =
      fixed ??
      (success
        ? !otherTricks
          ? 3
          : otherPoints < 30 || s.closer === opponent
            ? 2
            : 1
        : s.trickCounts.includes(0)
          ? 3
          : 2);
    addPoints(s, winner, chips);
    s.nextLeader = winner;
    s.event = { key: 'contract', seat: winner, amount: chips };
  }
  settle(s, Math.max(...s.scores) >= 7);
}
function finishBlack(s: TrickState) {
  const totals = s.captured.map((tiles) => sum(tiles.map((tile) => tilePoints(s, tile))));
  const total = s.game === 'eleven-point' ? 11 : 21;
  const moon = totals.indexOf(total);
  const delta = totals.map((score, i) => (moon < 0 ? score : i === moon ? 0 : 22));
  s.scores = s.scores.map((score, i) => score + delta[i]);
  const tied = delta.flatMap((score, i) => (score === Math.max(...delta) ? [i] : []));
  const draw = shuffle(s, dominoDeck(6));
  const weight = (tile: number) => sum(dominoFaces(tile)) * 8 + Math.max(...dominoFaces(tile));
  s.nextLeader = tied.reduce((best, seat) =>
    weight(draw[seat]) > weight(draw[best]) ? seat : best,
  );
  settle(s, Math.max(...s.scores) >= total * 10, true);
}

export function trickApply(s: TrickState, seat: number, move: TableAction) {
  if (seat !== s.turn) return false;
  const bingo = s.game === 'bingo',
    hand = s.hands[seat];
  const available = trickMoves(s, seat);
  if (move.type === 'tiles') {
    if (
      !available.some((a) => a.type === 'tiles') ||
      !Array.isArray(move.tiles) ||
      move.tiles.length > hand.length ||
      new Set(move.tiles).size !== move.tiles.length ||
      !move.tiles.every((tile) => hand.includes(tile))
    )
      return false;
    if (s.stage === 'exchange') {
      if (move.tiles.length !== 3) return false;
      s.exchange[seat] = [...move.tiles];
      s.turn = nextSeat(s, seat);
      if (s.turn === s.dealer) {
        const outgoing = s.exchange;
        for (const [i, tiles] of outgoing.entries())
          tiles.forEach((tile) => remove(s.hands[i], tile));
        for (const [i, tiles] of outgoing.entries()) s.hands[nextSeat(s, i)].push(...tiles);
        s.stage = 'trick';
      }
      return true;
    }
    const doubles = legalDoubles(s, seat);
    if (move.tiles.length < 2 || !move.tiles.every((tile) => doubles.includes(tile))) return false;
    if (move.tiles.length === 7) bingoFinish(s, seat, 3);
    else {
      s.announced[seat].push(...move.tiles);
      s.bonuses[seat] +=
        [0, 0, 20, 40, 50, 60, 70][move.tiles.length] + (move.tiles.includes(0) ? 10 : 0);
      s.requiredDoubles = [...move.tiles];
    }
    return true;
  }
  if (
    move.type === 'option' &&
    available.some((a) => a.type === 'option' && a.value === move.value)
  ) {
    if (move.value === TRICK_YIELD) {
      s.yieldLead = false;
      s.turn = nextSeat(s, seat);
    } else if (move.value === BINGO_CLOSE) {
      s.closer = seat;
      s.closePoints = bingoPoints(s, nextSeat(s, seat));
      s.closeTricks = s.trickCounts[nextSeat(s, seat)];
    } else bingoFinish(s, seat);
    return true;
  }
  if (move.type === 'pass' && s.stage === 'claim') {
    if (seat === s.lastTrick[0].seat) s.turn = nextSeat(s, seat);
    else bingoFinish(s, null);
    return true;
  }
  if (
    move.type !== 'place' ||
    !available.some((a) => a.type === 'place' && a.tile === move.tile && a.end === move.end)
  )
    return false;
  remove(hand, move.tile);
  if (!s.trick.length) {
    s.yieldLead = false;
    s.requiredDoubles = [];
    const faces = dominoFaces(move.tile);
    s.suit = !bingo
      ? move.end
      : faces.includes(s.trump!)
        ? s.trump
        : Math.max(...faces.map(strengthPip)) % 7;
  }
  s.trick.push({ seat, tile: move.tile });
  s.event = { key: 'place', seat };
  s.turn = nextSeat(s, seat);
  if (s.trick.length < s.players.length) return true;
  const value = (play: Play) => ranking(play.tile, s.suit!, s.trump);
  const winner = s.trick.reduce((best, play) => (value(play) > value(best) ? play : best)).seat;
  const tiles = s.trick.map((play) => play.tile);
  s.captured[winner].push(...tiles);
  s.trickCounts[winner]++;
  s.lastTrick = s.trick;
  s.trick = [];
  s.suit = null;
  s.turn = winner;
  s.event = { key: 'trick', seat: winner };
  if (!bingo) {
    if (s.stock.length) s.captured[winner].push(s.stock.pop()!);
    if (!s.hands[winner].length) finishBlack(s);
    return true;
  }
  if (s.trump !== 0 && tiles.includes(0) && tiles.includes(dominoTile(s.trump!, s.trump!))) {
    addPoints(s, winner, 1);
    if (s.scores[winner] >= 7) {
      settle(s, true);
      return true;
    }
  }
  if (s.closer === null && s.stock.length) {
    s.hands[winner].push(s.stock.shift()!);
    s.hands[nextSeat(s, winner)].push(s.stock.shift() ?? s.indicator!);
    if (!s.stock.length) s.indicator = null;
  } else if (!s.hands[winner].length) {
    if (s.closer !== null) bingoFinish(s, s.closer);
    else {
      s.bonuses[winner] += 10;
      s.stage = 'claim';
      s.turn = s.lastTrick[0].seat;
    }
  }
  return true;
}

export function trickCpu(s: TrickState, seat: number) {
  const moves = trickMoves(s, seat);
  if (s.game === 'bingo') {
    const claim = moves.find((a) => a.type === 'option' && a.value === BINGO_CLAIM);
    if (claim && bingoPoints(s, seat) >= 70) return claim;
    if (s.stage === 'claim') return moves.find((a) => a.type === 'pass');
    return moves.find((a) => a.type === 'tiles') ?? moves.find((a) => a.type === 'place');
  }
  return (
    moves.find((a) => a.type === 'tiles') ??
    moves
      .filter((a) => a.type === 'place')
      .sort((a, b) => {
        if (!s.trick.length) return ranking(a.tile, a.end, null) - ranking(b.tile, b.end, null);
        const leader = ranking(s.trick[0].tile, s.suit!, null);
        const priority = (tile: number) =>
          (ranking(tile, s.suit!, null) > leader ? 20 : 0) - tilePoints(s, tile);
        return priority(a.tile) - priority(b.tile);
      })[0]
  );
}
