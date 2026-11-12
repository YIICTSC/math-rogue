import type { KartQuestion } from '../mini-games/gakuro-kart/learning';

export const QUIZ_PROTOCOL = 1;
export const MAX_ANSWERERS = 40;
export const MODES = ['STANDARD', 'BUZZER', 'SURVIVAL', 'TEAMS', 'CONSENSUS', 'MAJORITY', 'NEAREST', 'DRAW', 'VOTE', 'WOLF'] as const;
export type ShowMode = typeof MODES[number];
export const minimumAnswerers = (mode: ShowMode) => mode === 'WOLF' ? 3 : ['DRAW','CONSENSUS','MAJORITY','VOTE'].includes(mode) ? 2 : 1;
export const supportsLearningUnits = (mode: ShowMode) => ['STANDARD','BUZZER','SURVIVAL','TEAMS'].includes(mode);
export type AnswerFormat = 'TEXT' | 'CHOICE' | 'FLIP';
export type Phase = 'lobby' | 'ready' | 'open' | 'closed' | 'reveal' | 'voting' | 'scoreboard' | 'finished' | 'review' | 'trial' | 'night' | 'dawn';
export type Role = 'host' | 'player' | 'screen';
export interface ShowQuestion {
  id: string;
  prompt: string;
  answer: string;
  aliases: string[];
  options: string[];
  format: AnswerFormat;
  seconds: number;
  points: number;
  passage?: string;
  visual?: KartQuestion['visual'];
  audioPrompt?: KartQuestion['audioPrompt'];
}
/** Normalized vector ink: coordinates in [0,1000], fixed palette and bounded points. */
export interface InkStroke { c: number; w: number; p: number[] }
export interface Answer { text: string; ink: InkStroke[]; revision: number; submitted: boolean }
export interface Player { id: string; name: string; connected: boolean; score: number; lives: number; team: number }
export interface Round {
  id: string; index: number; mode: ShowMode; question: ShowQuestion; eligible: string[];
  answers: Record<string, Answer>; revealed: string[]; showAnswer: boolean; showJudgments: boolean;
  grades: Record<string, boolean>; awards: Record<string, number>; startLives: Record<string, number>;
  deadline: number; remaining: number; paused: boolean; artist: string | null;
  buzzer: string | null; buzzOrder: string[]; locked: string[];
  votes: Record<string, string>; consensus: boolean | null;
  agreementAwarded?: boolean;
}
export type WolfRole = 'HUMAN' | 'WOLF' | 'SEER' | 'MEDIUM' | 'GUARD' | 'MAD';
export interface WolfSeat { role: WolfRole; original: WolfRole; active: boolean; lastGuard: string | null; reports: { target: string; wolf: boolean; day: number }[] }
export interface WolfGame {
  seats: Record<string, WolfSeat>; matches: number; goal: number; winner: 'HUMAN' | 'WOLF' | null;
  review: Record<string, boolean>; votes: Record<string, string>; night: Record<string, string>;
  event: { kind: 'banished' | 'attacked' | 'safe' | 'tie' | 'skip'; target?: string } | null;
}
export interface ShowWorld {
  revision: number; title: string; mode: ShowMode; teamCount: number; phase: Phase;
  players: Record<string, Player>; bank: ShowQuestion[]; index: number; round: Round | null;
  accepting: boolean; hostConnected: boolean; createdAt: number;
  wolf: WolfGame | null;
  overview: boolean;
  plan: { order: 'SEQUENTIAL' | 'RANDOM'; limit: number; shuffleChoices: boolean; autoAdvance?: boolean };
  queue: number[];
  autoProgress?: { phase: Phase; roundId: string; at: number };
}
export interface AnswerTile {
  id: string; submitted: boolean; revealed: boolean; visible: boolean; text?: string;
  inkRevision: number; hasInk: boolean; correct?: boolean; award?: number; votes?: number;
}
export interface ShowView {
  revision: number; serverNow: number; title: string; mode: ShowMode; teamCount: number; phase: Phase;
  accepting: boolean; hostConnected: boolean; players: Player[]; self: string; role: Role;
  questionCount: number; index: number;
  overview: boolean;
  plan: ShowWorld['plan'];
  round: null | {
    id: string; mode: ShowMode; prompt: string; format: AnswerFormat; options: string[];
    passage?: string; visual?: ShowQuestion['visual']; audioPrompt?: ShowQuestion['audioPrompt'];
    seconds: number; points: number; deadline: number; remaining: number; paused: boolean;
    eligible: string[]; artist: string | null; buzzer: string | null; buzzOrder: string[]; locked: string[];
    answer?: string; showAnswer: boolean; showJudgments: boolean; tiles: AnswerTile[]; votedFor?: string; consensus: boolean | null;
  };
  host?: { bank: ShowQuestion[] };
  wolf?: {
    matches: number; goal: number; winner: WolfGame['winner']; active: string[];
    reviewCount: number; voteCount: number; nightCount: number; nightTotal: number;
    myReview?: boolean; myVote?: string; myNight?: string; event: WolfGame['event'];
    mine?: WolfSeat; allies?: string[]; roles?: Record<string, WolfSeat>;
  };
}
export type ShowAction =
  | { type: 'configure'; title: string; mode: ShowMode; teamCount: number }
  | { type: 'bank'; questions: ShowQuestion[] }
  | { type: 'plan'; order: 'SEQUENTIAL' | 'RANDOM'; limit: number; shuffleChoices: boolean; autoAdvance?: boolean }
  | { type: 'start' | 'open' | 'close' | 'pause' | 'autoJudge' | 'score' | 'next' | 'finish' | 'voting' | 'revealAnswer' | 'revealAll' | 'publish' | 'balance'; roundId?: string }
  | { type: 'reveal'; roundId: string; playerId: string }
  | { type: 'grade'; roundId: string; playerId: string; correct: boolean }
  | { type: 'consensus'; roundId: string; agree: boolean }
  | { type: 'extraTime'; roundId: string }
  | { type: 'accepting'; value: boolean }
  | { type: 'layout'; overview: boolean }
  | { type: 'team'; playerId: string; team: number }
  | { type: 'adjust'; playerId: string; delta: number }
  | { type: 'remove'; playerId: string }
  | { type: 'buzz'; roundId: string }
  | { type: 'answer'; roundId: string; text: string; ink: InkStroke[]; submit: boolean }
  | { type: 'vote'; roundId: string; playerId: string }
  | WolfAction;
export type WolfAction = { type: 'wolfReview'; value: boolean } | { type: 'wolfVote' | 'wolfNight'; playerId: string } | { type: 'wolfResolve' };
export type ShowError = 'FULL' | 'NAME' | 'CLOSED' | 'AUTH' | 'PHASE' | 'QUESTION' | 'ANSWER' | 'LATE' | 'BUZZ' | 'VOTE' | 'NETWORK' | 'EXPIRED' | 'RATE' | 'NOT_FOUND';
export interface Actor { id: string; role: Role }
