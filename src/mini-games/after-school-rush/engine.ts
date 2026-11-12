import { CATALOG, CHAPTER_ROUNDS, chapterEntries, type Entry } from './catalog';
import type { Change, Clock, State } from './originals/model';
import type { Input } from './rules';

export const READY_MS = 1500;
export const FEEDBACK_MS = 950;
export const MAX_MISSES = 3;

export type Action = { index: number; at: number };
type Round = { entry: Entry; state: State; duration: number; action?: Action };
export type Mode = { kind: 'rush' } | { kind: 'story'; chapter: number } | { kind: 'practice'; entry: Entry };
type Run = {
  mode: Mode;
  number: number;
  misses: number;
  streak: number;
  deck: Entry[];
  score: number;
  wins: number;
  bestStreak: number;
  completed: boolean;
};
export type Outcome = 'clear' | 'mistake' | 'time';
type Active = {
  tag: 'ready' | 'play' | 'feedback';
  run: Run;
  round: Round;
  since: number;
  now: number;
  pausedAt?: number;
  outcome?: Outcome;
  points?: number;
  resolvedAt?: number;
};
export type Stage = { tag: 'lobby' } | Active | { tag: 'results'; run: Run };

function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function difficulty(run: Run) {
  if (run.mode.kind === 'practice') return 0;
  if (run.mode.kind === 'story') return Math.floor(run.mode.chapter / 4);
  return Math.min(2, Math.floor((run.number - 1) / 6));
}

function makeStoryDeck(chapter: number) {
  const entries = chapterEntries(chapter);
  const regular = shuffle(entries.filter((entry) => !entry.game.boss)).slice(0, CHAPTER_ROUNDS - 1);
  const boss = entries.find((entry) => entry.game.boss);
  return boss ? [...regular, boss] : regular;
}

function nextRound(run: Run, now: number, last?: Entry): Active {
  const deck = run.deck.length ? [...run.deck] : shuffle(CATALOG.filter((entry) => !entry.game.boss));
  if (run.mode.kind === 'rush' && deck[0].game.genre === last?.game.genre) {
    const different = deck.findIndex((entry) => entry.game.genre !== last.game.genre);
    if (different > 0) [deck[0], deck[different]] = [deck[different], deck[0]];
  }
  const entry = deck[0];
  const seconds = entry.game.seconds ?? 10;
  const time =
    run.mode.kind === 'practice'
      ? Math.max(15, seconds + 3)
      : entry.game.boss
        ? seconds
        : Math.max(8, seconds - difficulty(run) * 0.5);
  return {
    tag: 'ready',
    since: now,
    now,
    run: { ...run, deck: deck.slice(1) },
    round: { entry, duration: time * 1000, state: entry.game.mechanic.initial },
  };
}

export function start(mode: Mode, now: number): Stage {
  const deck =
    mode.kind === 'practice' ? [mode.entry] : mode.kind === 'story' ? makeStoryDeck(mode.chapter) : [];
  return nextRound(
    { mode, deck, number: 1, misses: 0, wins: 0, score: 0, streak: 0, bestStreak: 0, completed: false },
    now,
  );
}

function finish(stage: Active, now: number, outcome: Outcome): Active {
  const { run, round, since } = stage;
  const clear = outcome === 'clear';
  const boss = round.entry.game.boss;
  const fraction = Math.max(0, 1 - (now - since) / round.duration);
  const points = clear ? (boss ? 300 : 100) + Math.round(75 * fraction) + difficulty(run) * 25 : 0;
  const streak = clear ? run.streak + 1 : 0;
  return {
    ...stage,
    tag: 'feedback',
    since: now,
    now,
    outcome,
    resolvedAt: Math.min(round.duration, now - since),
    points,
    run: {
      ...run,
      misses: run.misses + Number(!clear),
      wins: run.wins + Number(clear),
      score: run.score + points,
      streak,
      bestStreak: Math.max(streak, run.bestStreak),
      completed: clear && Boolean(boss),
    },
  };
}

export function pause(stage: Stage, now: number): Stage {
  if (stage.tag === 'lobby' || stage.tag === 'results') return stage;
  if (stage.pausedAt !== undefined)
    return { ...stage, since: stage.since + now - stage.pausedAt, now, pausedAt: undefined };
  return { ...stage, pausedAt: now };
}

export function step(stage: Stage, timestamp: number, input?: Input): Stage {
  if (stage.tag === 'lobby' || stage.tag === 'results' || stage.pausedAt !== undefined) return stage;
  const now = Math.max(stage.now, timestamp);
  const elapsed = now - stage.since;
  if (stage.tag === 'feedback') {
    if (elapsed < FEEDBACK_MS || input) return now === stage.now ? stage : { ...stage, now };
    const { run } = stage;
    if (
      run.mode.kind === 'practice' ||
      run.misses >= MAX_MISSES ||
      (run.mode.kind === 'story' && run.deck.length === 0)
    ) {
      return { tag: 'results', run };
    }
    return nextRound({ ...run, number: run.number + 1 }, now, stage.round.entry);
  }
  if (stage.tag === 'ready')
    return elapsed >= READY_MS && !input ? { ...stage, tag: 'play', since: now, now } : stage;
  if (elapsed >= stage.round.duration) return finish(stage, now, 'time');

  const clock: Clock = { now: elapsed, before: stage.now - stage.since, dt: now - stage.now };
  const mechanic = stage.round.entry.game.mechanic;
  const tick = mechanic.tick?.(stage.round.state, clock);
  if (tick === 'clear' || tick === 'mistake') return finish(stage, now, tick);
  const state = tick ?? stage.round.state;
  const next = { ...stage, now, round: { ...stage.round, state } };
  if (!input) return next;
  const control = mechanic.display(state, clock).buttons[input.index];
  if (!control || control.disabled) return next;
  const change = mechanic.tap(state, input.index, clock);
  if (change === undefined) return next;
  const action = { index: input.index, at: elapsed };
  if (change === 'clear' || change === 'mistake') {
    return finish({ ...next, round: { ...next.round, action } }, now, change);
  }
  return { ...next, round: { ...next.round, state: change, action } };
}
