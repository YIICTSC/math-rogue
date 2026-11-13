import { CATALOG, CHAPTER_ROUNDS, chapterEntries, type Entry } from './catalog';
import type { Clock, State } from './originals/model';
import type { Input } from './rules';
import { controlsFor, resolveControl, type RushControl } from './controls';
import type { ActionControl } from './action/types';
import { challengeEntry } from './action/challenge';

export const READY_MS = 1500;
export const FEEDBACK_MS = 950;
export const MAX_MISSES = 3;
export const RUSH_BLOCK = 8;
export type Action = { index: number; at: number };
type Round = { entry: Entry; state: State; duration: number; speed: number; action?: Action; cursor?: number; history?: State[];
  queuedButtons?: { button: 'a' | 'b'; at: number }[] };
export const INPUT_BUFFER_MS = 250;
export type Mode = { kind: 'rush' } | { kind: 'story'; chapter: number } | { kind: 'practice'; entry: Entry };
export type Run = {
  mode: Mode; number: number; misses: number; streak: number; deck: Entry[];
  score: number; wins: number; bestStreak: number; completed: boolean; seed: number; bosses: number;
};
export type Outcome = 'clear' | 'mistake' | 'time';
export type Active = {
  tag: 'ready' | 'play' | 'feedback'; run: Run; round: Round; since: number; now: number;
  pausedAt?: number; outcome?: Outcome; points?: number; resolvedAt?: number; recovered?: boolean;
};
export type Stage = { tag: 'lobby' } | Active | { tag: 'results'; run: Run }
  | { tag: 'study'; run: Run; last: Entry };

function shuffle<T>(items: readonly T[], seed: number) {
  const result = [...items]; let value = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const j = value % (i + 1); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Every normal stage is a physical action challenge. */
export const RUSH_ENTRIES = CATALOG.filter(entry => !entry.game.boss);

export function difficulty(run: Run) {
  if (run.mode.kind === 'practice') return 0;
  if (run.mode.kind === 'story') return Math.min(4, Math.floor(run.mode.chapter / 4) + Math.floor((run.number - 1) / 3));
  return Math.min(4, Math.floor((run.number - 1) / RUSH_BLOCK));
}
export const isSpeedUp = (run: Run) => run.mode.kind === 'rush' && run.number > 1
  && (run.number - 1) % RUSH_BLOCK === 0 && run.number <= RUSH_BLOCK * 4 + 1;
export const readyDuration = (stage: Active) => stage.round.entry.game.boss ? 1700
  : stage.run.mode.kind === 'rush' ? isSpeedUp(stage.run) ? 1200 : 700 : READY_MS;
export const feedbackDuration = (stage: Active) => stage.run.mode.kind === 'practice' ? FEEDBACK_MS
  : stage.round.entry.game.boss ? 1200 : stage.outcome === 'clear' ? 520 : 760;
export const playElapsed = (stage: Active) => Math.max(0, (stage.now - stage.since) * stage.round.speed);
export const remainingTime = (stage: Active) => Math.max(0, (stage.round.duration - playElapsed(stage)) / stage.round.speed);

function makeStoryDeck(chapter: number, seed: number) {
  const entries = chapterEntries(chapter);
  const regular = shuffle(entries.filter(entry => !entry.game.boss), seed).slice(0, CHAPTER_ROUNDS - 1);
  const boss = entries.find(entry => entry.game.boss);
  return boss ? [...regular, boss] : regular;
}

function nextRound(run: Run, now: number, last?: Entry): Active {
  const deck = run.deck.length ? [...run.deck] : shuffle(RUSH_ENTRIES, run.seed + run.number * 65537);
  const bossRound = run.mode.kind === 'rush' && run.number % RUSH_BLOCK === 0;
  if (!bossRound && run.mode.kind === 'rush') {
    const different = deck.findIndex(entry => entry.key !== last?.key
      && entry.game.action?.family !== last?.game.action?.family && (run.number !== 1 || entry.game.action?.family === 'run'));
    if (different > 0) [deck[0], deck[different]] = [deck[different], deck[0]];
  }
  const bosses = shuffle(CATALOG.filter(entry => entry.game.boss), run.seed);
  const base = bossRound ? bosses[(run.number / RUSH_BLOCK - 1) % bosses.length] : deck.shift()!;
  const seed = (run.seed + Math.imul(run.number, 2654435761)) >>> 0;
  const entry = challengeEntry(base, difficulty(run), seed);
  const seconds = entry.game.seconds ?? 10;
  const duration = (run.mode.kind === 'practice' ? Math.max(15, seconds + 3) : seconds) * 1000;
  const speed = run.mode.kind !== 'rush' || entry.game.boss ? 1 : 1 + difficulty(run) * .1;
  return {
    tag: 'ready', since: now, now, run: { ...run, deck },
    round: { entry, duration, speed, state: entry.game.mechanic.initialFor?.(seed, difficulty(run)) ?? [...entry.game.mechanic.initial] },
  };
}

export function start(mode: Mode, now: number, seed = Math.floor(Math.random() * 0x100000000)): Stage {
  const deck = mode.kind === 'practice' ? [mode.entry] : mode.kind === 'story' ? makeStoryDeck(mode.chapter, seed) : [];
  return nextRound({ mode, deck, number: 1, misses: 0, wins: 0, score: 0, streak: 0,
    bestStreak: 0, completed: false, seed, bosses: 0 }, now);
}

function finish(stage: Active, now: number, outcome: Outcome): Active {
  const { run, round, since } = stage;
  const clear = outcome === 'clear', boss = !!round.entry.game.boss;
  const fraction = Math.max(0, 1 - (now - since) * round.speed / round.duration);
  const points = clear ? (boss ? 300 : 100) + Math.round(75 * fraction) + difficulty(run) * 25 : 0;
  const streak = clear ? run.streak + 1 : 0;
  const recovered = clear && boss && run.mode.kind === 'rush' && run.misses > 0;
  return {
    ...stage, tag: 'feedback', since: now, now, outcome, recovered,
    resolvedAt: Math.min(round.duration, (now - since) * round.speed), points,
    run: { ...run, misses: Math.max(0, run.misses + Number(!clear) - Number(recovered)),
      wins: run.wins + Number(clear), score: run.score + points, streak,
      bosses: run.bosses + Number(clear && boss), bestStreak: Math.max(streak, run.bestStreak),
      completed: clear && boss },
  };
}

export function pause(stage: Stage, now: number): Stage {
  if (stage.tag === 'lobby' || stage.tag === 'results' || stage.tag === 'study') return stage;
  if (stage.pausedAt !== undefined)
    return { ...stage, since: stage.since + now - stage.pausedAt, now, pausedAt: undefined };
  const state = stage.round.entry.game.mechanic.control?.(stage.round.state, { kind: 'stick', x: 0, y: 0 },
    { now: playElapsed(stage), before: playElapsed(stage), dt: 0 });
  return { ...stage, pausedAt: now, round: { ...stage.round, state: state ?? stage.round.state, queuedButtons: undefined } };
}
export function resumeAfterStudy(stage: Stage, now: number): Stage {
  return stage.tag === 'study' ? nextRound(stage.run, now, stage.last) : stage;
}

/** One input vocabulary for touch, keyboard and physical controllers. Clocks never rewind on undo. */
export function control(stage: Stage, now: number, command: RushControl): Stage {
  if ((stage.tag !== 'play' && stage.tag !== 'ready') || stage.pausedAt !== undefined) return stage;
  if (stage.round.entry.game.mechanic.control) return actionControl(stage, now, command === 'a' || command === 'b'
    ? { kind: 'button', button: command } : { kind: 'stick', x: command === 'left' ? -1 : command === 'right' ? 1 : 0, y: command === 'up' ? -1 : command === 'down' ? 1 : 0 });
  const live = step(stage, now);
  if (live.tag !== 'play') return live;
  const { round } = live, profile = controlsFor(round.entry), time = playElapsed(live);
  const count = round.entry.game.mechanic.display(round.state, { now: time, before: time, dt: 0 }).buttons.length;
  const resolved = resolveControl(profile, round.cursor ?? 0, count, command);
  if (!resolved) return live;
  if ('cursor' in resolved) return { ...live, round: { ...round, cursor: resolved.cursor } };
  if ('undo' in resolved) {
    if (!round.history?.length) return live;
    return { ...live, round: { ...round, state: round.history[round.history.length - 1], history: round.history.slice(0, -1), action: undefined } };
  }
  const next = step(live, now, resolved);
  if (next.tag !== 'play' && next.tag !== 'feedback') return next;
  const history = profile.scheme === 'select' && next.tag === 'play' && next.round.action !== round.action && next.round.state !== round.state
    ? [...(round.history ?? []), round.state].slice(-32) : round.history;
  return { ...next, round: { ...next.round, cursor: resolved.index, history } };
}

function actionControl(stage: Stage, now: number, event: ActionControl): Stage {
  if ((stage.tag !== 'play' && stage.tag !== 'ready') || stage.pausedAt !== undefined) return stage;
  const live = step(stage, now);
  if (live.tag === 'ready') {
    // A thumb already on the stick must still steer when GO appears. Keep only
    // fresh button edges so an early jump cannot disappear at the READY boundary.
    if (event.kind === 'stick') {
      const state = live.round.entry.game.mechanic.control?.(live.round.state, event, { now: 0, before: 0, dt: 0 });
      return state ? { ...live, round: { ...live.round, state } } : live;
    }
    const queuedButtons = [...(live.round.queuedButtons ?? []).filter(input => input.button !== event.button), { button: event.button, at: now }];
    return { ...live, round: { ...live.round, queuedButtons } };
  }
  if (live.tag !== 'play') return live;
  const m = live.round.entry.game.mechanic, time = playElapsed(live);
  const state = m.control?.(live.round.state, event, { now: time, before: time, dt: 0 });
  if (!state) return live;
  const changed = state.some((value, i) => value !== live.round.state[i]);
  const action = event.kind === 'button' && changed ? { index: event.button === 'a' ? 4 : 5, at: time } : live.round.action;
  const next = { ...live, round: { ...live.round, state, action } };
  const result = m.result?.(state);
  return result ? finish(next, now, result) : next;
}
export const steer = (stage: Stage, now: number, x: number, y: number): Stage => actionControl(stage, now, { kind: 'stick', x, y });

export function step(stage: Stage, timestamp: number, input?: Input): Stage {
  if (stage.tag === 'lobby' || stage.tag === 'results' || stage.tag === 'study' || stage.pausedAt !== undefined) return stage;
  const now = Math.max(stage.now, timestamp), elapsed = now - stage.since;
  if (stage.tag === 'feedback') {
    if (elapsed < feedbackDuration(stage) || input) return now === stage.now ? stage : { ...stage, now };
    const { run } = stage;
    if (run.mode.kind === 'practice' || run.misses >= MAX_MISSES || (run.mode.kind === 'story' && !run.deck.length))
      return { tag: 'results', run };
    const nextRun = { ...run, number: run.number + 1 };
    if (run.mode.kind === 'rush' && run.number % RUSH_BLOCK === 0)
      return { tag: 'study', run: nextRun, last: stage.round.entry };
    return nextRound(nextRun, now, stage.round.entry);
  }
  if (stage.tag === 'ready') {
    if (elapsed < readyDuration(stage) || input) return now === stage.now ? stage : { ...stage, now };
    let state = stage.round.state, action: Action | undefined;
    for (const queued of stage.round.queuedButtons ?? []) {
      if (now - queued.at > INPUT_BUFFER_MS) continue;
      state = stage.round.entry.game.mechanic.control?.(state, { kind: 'button', button: queued.button }, { now: 0, before: 0, dt: 0 }) ?? state;
      action = { index: queued.button === 'a' ? 4 : 5, at: 0 };
    }
    return { ...stage, tag: 'play', since: now, now, round: { ...stage.round, state, action, queuedButtons: undefined } };
  }
  const logical = elapsed * stage.round.speed;
  if (logical >= stage.round.duration) return finish(stage, now, 'time');
  const clock: Clock = { now: logical, before: (stage.now - stage.since) * stage.round.speed,
    dt: (now - stage.now) * stage.round.speed };
  const mechanic = stage.round.entry.game.mechanic;
  const tick = mechanic.tick?.(stage.round.state, clock);
  if (tick === 'clear' || tick === 'mistake') return finish(stage, now, tick);
  const state = tick ?? stage.round.state;
  const next = { ...stage, now, round: { ...stage.round, state } };
  const result = mechanic.result?.(state);
  if (result) return finish(next, now, result);
  if (!input) return next;
  const control = mechanic.display(state, clock).buttons[input.index];
  if (!control || control.disabled) return next;
  const change = mechanic.tap(state, input.index, clock);
  if (change === undefined) return next;
  const action = { index: input.index, at: logical };
  if (change === 'clear' || change === 'mistake') return finish({ ...next, round: { ...next.round, action } }, now, change);
  const applied = { ...next, round: { ...next.round, state: change, action } };
  const outcome = mechanic.result?.(change);
  return outcome ? finish(applied, now, outcome) : applied;
}
