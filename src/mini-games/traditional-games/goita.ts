import {
  addPoints,
  deal,
  remove,
  settle,
  shuffle,
  type TableAction,
  type TableBase,
} from './model';

export const GOITA_NAMES = ['し', '香', '馬', '銀', '金', '角', '飛', '王'] as const;
export const GOITA_VALUES = [10, 20, 20, 30, 30, 40, 40, 50];
const PACK = [10, 4, 4, 4, 4, 2, 2, 2].flatMap(
  (count, kind) => Array(count).fill(kind) as number[],
);
export const goitaKind = (tile: number) => PACK[tile];
type Pair = { cover: number | null; attack: number };
export interface GoitaState extends TableBase {
  kind: 'goita';
  game: 'goita';
  rows: Pair[][];
  attack: { tile: number; seat: number } | null;
  five: number[];
  votes: boolean[];
  award: { seat: number; tiles: number[] } | null;
}

const partner = (seat: number) => (seat + 2) % 4;
const previousSeat = (seat: number) => (seat + 3) % 4;
const pawns = (hand: number[]) => hand.filter((tile) => goitaKind(tile) === 0).length;

function score(s: GoitaState, seat: number, points: number, special = false) {
  addPoints(s, seat, points);
  s.dealer = seat;
  s.event = { key: special ? 'hand-award' : 'goita-out', seat, amount: points };
  settle(s, s.scores[seat] >= 150);
}

export function newGoitaDeal(s: GoitaState) {
  deal(
    s,
    shuffle(
      s,
      PACK.map((_, tile) => tile),
    ),
    8,
  );
  s.rows = s.players.map(() => []);
  s.attack = null;
  s.turn = s.dealer;
  s.five = [];
  s.votes = [];
  s.award = null;
  for (const [seat, hand] of s.hands.entries()) {
    const n = pawns(hand);
    if (n === 5) s.five.push(seat);
    if (n >= 6) {
      s.award = { seat, tiles: [...hand] };
      const kinds = hand.map(goitaKind),
        others = kinds.filter((k) => k !== 0);
      const points =
        n === 8
          ? 100
          : Math.max(...others.map((k) => GOITA_VALUES[k])) *
            (n === 7 || others[0] === others[1] ? 2 : 1);
      score(s, seat, points, true);
      return;
    }
  }
  if (s.five.length === 2 && partner(s.five[0]) === s.five[1]) {
    score(s, s.five[0], 150, true);
    s.event = { key: 'five-shi', seat: s.five[0], amount: 150 };
  } else if (s.five.length) {
    s.event = { key: 'five-shi', seat: s.five[0] };
    s.turn = partner(s.five[0]);
  }
}

export function goitaMoves(s: GoitaState, seat: number): TableAction[] {
  if (s.turn !== seat) return [];
  if (s.votes.length < s.five.length)
    return [
      { type: 'five', accept: true },
      { type: 'five', accept: false },
    ];
  const free = !s.attack || s.attack.seat === seat;
  const hand = s.hands[seat];
  const lead = s.attack ? goitaKind(s.attack.tile) : -1;
  const visibleKing = s.rows.some((row) =>
    row.some(
      (pair) =>
        goitaKind(pair.attack) === 7 || (pair.cover !== null && goitaKind(pair.cover) === 7),
    ),
  );
  const hasKings = hand.filter((tile) => goitaKind(tile) === 7).length === 2;
  const moves: TableAction[] = hand.flatMap((cover) => {
    const kind = goitaKind(cover);
    if (!free && kind !== lead && (kind !== 7 || lead === 0 || lead === 1)) return [];
    return hand
      .filter(
        (tile) =>
          tile !== cover && (goitaKind(tile) !== 7 || hand.length === 2 || visibleKing || hasKings),
      )
      .map((attack) => ({ type: 'goita', cover, attack }));
  });
  if (!free) moves.push({ type: 'pass' });
  return moves;
}

export function applyGoita(s: GoitaState, seat: number, a: TableAction) {
  if (
    !goitaMoves(s, seat).some(
      (move) =>
        move.type === a.type &&
        (a.type === 'goita'
          ? 'cover' in move && a.cover === move.cover && a.attack === move.attack
          : a.type === 'five'
            ? typeof a.accept === 'boolean'
            : true),
    )
  )
    return false;
  if (a.type === 'five') {
    s.votes.push(a.accept);
    if (s.votes.length !== s.five.length) {
      s.event = { key: 'five-shi', seat: s.five[s.votes.length] };
      s.turn = partner(s.five[s.votes.length]);
      return true;
    }
    if (s.votes.every((accept) => !accept)) {
      s.event = { key: 'redeal', seat };
      newGoitaDeal(s);
    } else {
      s.five = [];
      s.votes = [];
      s.turn = s.dealer;
      s.event = { key: 'place', seat: s.dealer };
    }
    return true;
  }
  if (a.type === 'pass') {
    s.turn = previousSeat(seat);
    s.event = { key: 'pass', seat };
    return true;
  }
  if (a.type !== 'goita') return false;
  const free = !s.attack || s.attack.seat === seat;
  remove(s.hands[seat], a.cover);
  remove(s.hands[seat], a.attack);
  s.rows[seat].push({ cover: free ? null : a.cover, attack: a.attack });
  s.attack = { seat, tile: a.attack };
  s.turn = previousSeat(seat);
  s.event = { key: 'attack', seat };
  if (!s.hands[seat].length) {
    const kind = goitaKind(a.attack);
    score(s, seat, GOITA_VALUES[kind] * (free && goitaKind(a.cover) === kind ? 2 : 1));
  }
  return true;
}

export function goitaCpu(s: GoitaState, seat: number) {
  const moves = goitaMoves(s, seat);
  if (moves[0]?.type === 'five') return { type: 'five', accept: true } as const;
  const hand = s.hands[seat];
  if (s.attack?.seat === partner(seat) && s.hands[partner(seat)].length <= 2 && hand.length > 2)
    return { type: 'pass' } as const;
  const candidates = moves.filter((a) => a.type === 'goita');
  const value = (a: Extract<TableAction, { type: 'goita' }>) => {
    const k = goitaKind(a.attack),
      c = goitaKind(a.cover);
    return hand.length === 2
      ? GOITA_VALUES[k] * ((!s.attack || s.attack.seat === seat) && c === k ? 2 : 1)
      : (k === 7 ? 20 : k === 1 ? 14 : k === 0 ? 11 : 8) -
          GOITA_VALUES[c] * 0.25 +
          (hand.filter((tile) => goitaKind(tile) === k).length - 1) * 1.6;
  };
  return candidates.sort((a, b) => value(b) - value(a))[0] ?? moves[0];
}
