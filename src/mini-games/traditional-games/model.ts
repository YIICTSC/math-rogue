import type { TableDeclaration } from '../shared/tableDeclarations';
import { CARD_CLUB_VOICE_HEROES } from '../../data/cardClubVoices';

export const CLASSIC_DOMINO_GAMES = [
  'competitive',
  'cyprus',
  'chicken',
  'mexican',
  'five-up',
  'sniff',
  'seven-rocks',
  'bergen',
  'fives-threes',
  'forty-two',
] as const;
export const EXTRA_DOMINO_GAMES = [
  'buki',
  'pulle',
  'austrian-block',
  'austrian-draw',
  'nos',
  'billitonnen',
  'bluffing',
  'double-edged',
  'request',
  'keep-left',
  'give-or-take',
  'speed',
  'dead-space',
  'one-up',
  'pick-up',
  'flower-scorpion',
  'eleven-point',
  'twenty-one-point',
  'bingo',
  'sidominos',
  'broadway',
  'skyscraper',
  'shanghai',
  'rummicube',
] as const;
export const DOMINO_GAMES = [...CLASSIC_DOMINO_GAMES, ...EXTRA_DOMINO_GAMES] as const;
export type ExtraDominoGame = (typeof EXTRA_DOMINO_GAMES)[number];
export type DominoGame = (typeof DOMINO_GAMES)[number];
export type LineGame = Exclude<(typeof CLASSIC_DOMINO_GAMES)[number], 'forty-two'>;
export const isExtraDomino = (game: TableGame): game is ExtraDominoGame =>
  (EXTRA_DOMINO_GAMES as readonly TableGame[]).includes(game);
export type TableGame = DominoGame | 'peeper' | 'crokinole' | 'goita';
export const seatsFor = (game: TableGame): readonly number[] => {
  switch (game) {
    case 'bingo':
      return [2];
    case 'nos':
    case 'billitonnen':
      return [3, 4, 5];
    case 'eleven-point':
    case 'twenty-one-point':
      return [3, 4];
    case 'skyscraper':
      return [2, 3];
    case 'rummicube':
      return [2, 3, 4, 5];
    case 'bluffing':
    case 'double-edged':
    case 'request':
    case 'keep-left':
    case 'give-or-take':
    case 'speed':
    case 'dead-space':
    case 'one-up':
    case 'pick-up':
      return [2, 3, 4, 5, 6, 7, 8];
    case 'buki':
    case 'pulle':
    case 'broadway':
    case 'competitive':
    case 'goita':
    case 'forty-two':
      return [4];
    case 'crokinole':
      return [2, 4];
    case 'peeper':
      return [2, 3, 4, 5, 6];
    case 'cyprus':
      return [2, 3, 4, 5, 6, 7, 8];
    case 'chicken':
      return [2, 3, 4, 5, 6];
    case 'mexican':
      return [2, 3, 4, 5, 6, 7, 8];
    default:
      return [2, 3, 4];
  }
};

export interface TableMember {
  id: string;
  name: string;
  hero: string;
  cpu: boolean;
}

export function isTableMember(value: unknown): value is TableMember {
  if (!value || typeof value !== 'object') return false;
  const member = value as Partial<TableMember>;
  return (
    typeof member.id === 'string' &&
    typeof member.name === 'string' &&
    !!member.name.trim() &&
    member.name.length <= 32 &&
    CARD_CLUB_VOICE_HEROES.some((id) => id === member.hero)
  );
}

export const teamsFor = (game: TableGame, count: number) =>
  count === 4 &&
  (
    [
      'competitive',
      'forty-two',
      'broadway',
      'goita',
      'crokinole',
      'five-up',
      'sniff',
    ] as TableGame[]
  ).includes(game);

type EventKey =
  | 'place'
  | 'pass'
  | 'draw'
  | 'domino'
  | 'blocked'
  | 'score'
  | 'bomb'
  | 'mine'
  | 'return'
  | 'peeper-out'
  | 'attack'
  | 'five-shi'
  | 'goita-out'
  | 'redeal'
  | 'hand-award'
  | 'twenty'
  | 'foul'
  | 'shot'
  | 'bid'
  | 'trump'
  | 'trick'
  | 'contract';

export type TableEvent = { key: EventKey; seat: number; amount?: number };

export type TableAction =
  | { type: 'place'; tile: number; end: number }
  | { type: 'tiles'; tiles: number[]; rank?: number }
  | { type: 'mine' | 'return' }
  | { type: 'goita'; cover: number; attack: number }
  | { type: 'five'; accept: boolean }
  | { type: 'shot'; angle: number; aim: number; power: number }
  | { type: 'bid' | 'trump'; value: number }
  | { type: 'option'; value: number }
  | { type: 'pair'; tile: number; other: number }
  | { type: 'claim'; tile: number; end: number; face: number }
  | {
      type: 'grid';
      tile: number;
      x: number;
      y: number;
      vertical: boolean;
      flip: boolean;
    }
  | { type: 'meld'; groups: number[][] }
  | { type: 'draw' | 'pass' | 'next' };

export type TableBase = {
  game: TableGame;
  players: TableMember[];
  teams: boolean;
  turn: number;
  dealer: number;
  round: number;
  phase: 'play' | 'round' | 'result';
  scores: number[];
  roundStartScores: number[];
  winners: number[];
  revision: number;
  event: TableEvent | null;
  declarations?: TableDeclaration[];
  hands: number[][];
  rng: number;
};

export function baseFor(game: TableGame, players: TableMember[], seed: number): TableBase {
  const scores = players.map(() => 0);
  return {
    game,
    players: players.map((p) => ({ ...p })),
    teams: teamsFor(game, players.length),
    turn: 0,
    dealer: 0,
    round: 1,
    phase: 'play',
    scores,
    roundStartScores: [...scores],
    winners: [],
    revision: 0,
    event: null,
    declarations: [],
    hands: players.map(() => []),
    rng: seed >>> 0,
  };
}

export const teamOf = (s: Pick<TableBase, 'teams'>, seat: number) => (s.teams ? seat % 2 : seat);
export const nextSeat = (s: Pick<TableBase, 'players'>, seat: number) =>
  (seat + 1) % s.players.length;
export const seatGroup = (s: Pick<TableBase, 'players' | 'teams'>, seat: number) =>
  s.players.flatMap((_, index) => (teamOf(s, index) === teamOf(s, seat) ? [index] : []));
export const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
export function addPoints(s: TableBase, seat: number, points: number) {
  for (const member of seatGroup(s, seat)) s.scores[member] += points;
}
export function settle(s: TableBase, final: boolean, lowWins = false) {
  const best = (lowWins ? Math.min : Math.max)(...s.scores);
  s.winners = s.scores.flatMap((points, seat) => (points === best ? [seat] : []));
  s.phase = final ? 'result' : 'round';
}

export function random(s: Pick<TableBase, 'rng'>) {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let value = s.rng;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
}

export function shuffle(s: Pick<TableBase, 'rng'>, stock: number[]) {
  for (let i = stock.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [stock[i], stock[j]] = [stock[j], stock[i]];
  }
  return stock;
}
export function deal(s: TableBase, stock: number[], count: number) {
  s.hands = s.players.map(() => stock.splice(0, count).sort((a, b) => a - b));
  return stock;
}

export function remove(hand: number[], tile: number) {
  hand.splice(hand.indexOf(tile), 1);
}
