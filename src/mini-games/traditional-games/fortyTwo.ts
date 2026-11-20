import { dominoDeck, dominoFaces } from './domino';
import {
  addPoints,
  deal,
  nextSeat,
  remove,
  settle,
  shuffle,
  sum,
  teamOf,
  type TableAction,
  type TableBase,
} from './model';

type TrickTile = { seat: number; tile: number };
export interface FortyTwoState extends TableBase {
  kind: 'forty-two';
  game: 'forty-two';
  stage: 'bid' | 'trump' | 'trick';
  offered: number;
  bid: number;
  bidder: number;
  trump: number | null;
  trick: TrickTile[];
  lastTrick: TrickTile[];
  won: number[];
}

const HIGH_BIDS = [84, 126, 168, 210, 252, 294];
export function newFortyTwoDeal(s: FortyTwoState) {
  deal(s, shuffle(s, dominoDeck(6)), 7);
  s.stage = 'bid';
  s.offered = s.bid = 0;
  s.bidder = s.dealer;
  s.trump = null;
  s.trick = [];
  s.lastTrick = [];
  s.won = [0, 0];
  s.turn = nextSeat(s, s.dealer);
}

const hasPip = (tile: number, pip: number) => dominoFaces(tile).includes(pip);
const belongs = (tile: number, pip: number, trump: number) =>
  hasPip(tile, pip) && (pip === trump || !hasPip(tile, trump));
const suit = (s: FortyTwoState) => {
  const a = s.trick[0]?.tile;
  if (a === undefined) return null;
  return hasPip(a, s.trump!) ? s.trump! : a & 15;
};
const strength = (tile: number, lead: number, trump: number) => {
  const [a, b] = dominoFaces(tile);
  const category = hasPip(tile, trump) ? 2 : hasPip(tile, lead) ? 1 : 0;
  return (
    category * 10 + (a === b ? 9 : category === 2 ? (a === trump ? b : a) : a === lead ? b : a)
  );
};
const countValue = (tile: number) => {
  const [a, b] = dominoFaces(tile);
  return a + b === 5 || a + b === 10 ? a + b : 0;
};

export function fortyTwoMoves(s: FortyTwoState, seat: number): TableAction[] {
  if (s.turn !== seat) return [];
  if (s.stage === 'bid') {
    const regular = Array.from({ length: 13 }, (_, i) => 30 + i).filter((value) => value > s.bid);
    const bids = [
      ...regular,
      ...HIGH_BIDS.filter((value) => value > s.bid && value <= Math.max(84, s.bid + 42)),
    ];
    const choices: TableAction[] = bids.map((value) => ({ type: 'bid', value }));
    if (s.offered < 3 || s.bid > 0) choices.push({ type: 'pass' });
    return choices;
  }
  if (s.stage === 'trump')
    return Array.from({ length: 7 }, (_, value) => ({ type: 'trump', value }));
  const lead = suit(s),
    hand = s.hands[seat];
  const follow = lead === null ? [] : hand.filter((tile) => belongs(tile, lead, s.trump!));
  return (follow.length ? follow : hand).map((tile) => ({ type: 'place', tile, end: -1 }));
}

export function applyFortyTwo(s: FortyTwoState, seat: number, a: TableAction) {
  if (
    !fortyTwoMoves(s, seat).some(
      (move) =>
        move.type === a.type &&
        (a.type === 'bid' || a.type === 'trump'
          ? 'value' in move && a.value === move.value
          : a.type === 'place'
            ? 'tile' in move && a.tile === move.tile && a.end === -1
            : true),
    )
  )
    return false;
  if (s.stage === 'bid') {
    if (a.type === 'bid') {
      s.bid = a.value;
      s.bidder = seat;
    }
    s.event = a.type === 'bid' ? { key: 'bid', seat, amount: a.value } : { key: 'pass', seat };
    s.offered++;
    if (s.offered === 4) {
      s.stage = 'trump';
      s.turn = s.bidder;
    } else s.turn = nextSeat(s, seat);
    return true;
  }
  if (a.type === 'trump') {
    s.trump = a.value;
    s.stage = 'trick';
    s.event = { key: 'trump', seat, amount: a.value };
    return true;
  }
  if (a.type !== 'place') return false;
  remove(s.hands[seat], a.tile);
  s.trick.push({ seat, tile: a.tile });
  s.event = { key: 'place', seat };
  if (s.trick.length < s.players.length) {
    s.turn = nextSeat(s, seat);
    return true;
  }
  const lead = suit(s)!,
    trump = s.trump!;
  const high = s.trick.reduce((best, tile) =>
    strength(tile.tile, lead, trump) > strength(best.tile, lead, trump) ? tile : best,
  );
  const points = 1 + sum(s.trick.map((entry) => countValue(entry.tile)));
  s.won[teamOf(s, high.seat)] += points;
  s.lastTrick = s.trick;
  s.trick = [];
  s.turn = high.seat;
  s.event = { key: 'trick', seat: high.seat, amount: points };
  if (!s.hands[seat].length) {
    const declarer = teamOf(s, s.bidder);
    const winner = s.won[declarer] >= Math.min(s.bid, 42) ? declarer : 1 - declarer;
    const marks = Math.max(1, (s.bid / 42) | 0);
    addPoints(s, winner, marks);
    s.event = { key: 'contract', seat: winner, amount: marks };
    settle(s, s.scores[winner] >= 7);
  }
  return true;
}

export function fortyTwoCpu(s: FortyTwoState, seat: number) {
  const moves = fortyTwoMoves(s, seat);
  const hand = s.hands[seat];
  if (s.stage === 'trump') {
    const weight = (pip: number) =>
      sum(hand.filter((tile) => hasPip(tile, pip)).map((tile) => strength(tile, pip, pip) - 16));
    return [...moves].sort(
      (a, b) => weight('value' in b ? b.value : 0) - weight('value' in a ? a.value : 0),
    )[0];
  }
  if (s.stage === 'bid') {
    const confidence = hand.filter((tile) => {
      const [a, b] = dominoFaces(tile);
      return a === b || b === 6;
    }).length;
    return (confidence < 4 ? moves.find((a) => a.type === 'pass') : undefined) ?? moves[0];
  }
  if (s.trick.length) {
    const lead = suit(s)!,
      trump = s.trump!;
    const highest = [...s.trick].sort(
      (a, b) => strength(b.tile, lead, trump) - strength(a.tile, lead, trump),
    )[0];
    const tileMoves = moves
      .filter((move) => move.type === 'place')
      .sort((a, b) => strength(a.tile, lead, trump) - strength(b.tile, lead, trump));
    if (teamOf(s, highest.seat) === teamOf(s, seat)) {
      return tileMoves.sort((a, b) => countValue(b.tile) - countValue(a.tile))[0];
    }
    return (
      tileMoves.find(
        (move) => strength(move.tile, lead, trump) > strength(highest.tile, lead, trump),
      ) ?? tileMoves[0]
    );
  }
  return moves.find((move) => move.type === 'place' && hasPip(move.tile, s.trump!)) ?? moves[0];
}
