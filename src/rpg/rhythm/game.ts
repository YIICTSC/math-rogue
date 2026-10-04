import type {
  HomeGame,
  HomeGameWorld,
} from "../../mini-games/gakuro-craft/homeGames";
import { RHYTHM_SONGS } from "./catalog.generated";
import {
  rhythmSong,
  rhythmChart,
  chartDuration,
  chartUnits,
  rhythmGrade,
  type RhythmDifficulty,
  type RhythmLength,
  type RhythmGrade,
} from "./chart";
export interface RhythmResult {
  heads: number[];
  tails: number[];
  raw: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  gauge: number;
  cursor: number;
}
export interface RhythmState {
  song: string;
  difficulty: RhythmDifficulty;
  length: RhythmLength;
  ready: boolean[];
  start: number;
  run: number;
  pausedAt?: number;
  results: RhythmResult[];
}
export type RhythmCommand =
  | {
      type: "game_rhythm_select";
      key: string;
      song: string;
      difficulty: RhythmDifficulty;
      length: RhythmLength;
    }
  | {
      type: "game_rhythm_ready";
      key: string;
      ready: boolean;
      song: string;
      difficulty: RhythmDifficulty;
      length: RhythmLength;
    }
  | { type: "game_rhythm_pause"; key: string; paused: boolean }
  | {
      type: "game_rhythm_hit";
      key: string;
      note: number;
      edge: "down" | "up";
      at: number;
      run: number;
    };
export const newRhythm = (): RhythmState => ({
  song: RHYTHM_SONGS.find((s) => s.path === "bgm-new/battle.mp3")!.id,
  difficulty: "normal",
  length: "full",
  ready: [],
  start: 0,
  run: 0,
  results: [],
});
export function newRhythmResult(count: number): RhythmResult {
  return {
    heads: Array(count).fill(0),
    tails: Array(count).fill(0),
    raw: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    gauge: 100,
    cursor: 0,
  };
}
export function awardRhythm(result: RhythmResult, grade: RhythmGrade) {
  result.raw += [0, 1000, 750, 400, 0][grade];
  result.combo = grade === 4 ? 0 : result.combo + 1;
  result.maxCombo = Math.max(result.maxCombo, result.combo);
  result[
    (["", "perfect", "great", "good", "miss"] as const)[grade] as
      | "perfect"
      | "great"
      | "good"
      | "miss"
  ]++;
  result.gauge = Math.max(
    0,
    Math.min(100, result.gauge + (grade === 4 ? -6 : grade === 3 ? 0 : 0.65)),
  );
}
export function startRhythm(w: HomeGameWorld, g: HomeGame) {
  const r = g.rhythm!;
  const notes = rhythmChart(rhythmSong(r.song)!, r.difficulty, r.length);
  r.run++;
  r.start = w.time + 4;
  r.pausedAt = undefined;
  r.results = g.players.map(() => newRhythmResult(notes.length));
  g.deadline = r.start + chartDuration(rhythmSong(r.song)!, r.length) + 1;
}
export function rhythmCommand(
  w: HomeGameWorld,
  g: HomeGame,
  seat: number,
  c: RhythmCommand,
): boolean {
  const r = g.rhythm!;
  if (c.type === "game_rhythm_select") {
    if (
      g.phase === "playing" ||
      seat !== 0 ||
      !rhythmSong(c.song) ||
      !["easy", "normal", "expert"].includes(c.difficulty) ||
      !["full", "short"].includes(c.length)
    )
      return false;
    r.song = c.song;
    r.difficulty = c.difficulty;
    r.length = c.length;
    r.ready = g.players.map(() => false);
    g.phase = "lobby";
    g.scores = g.players.map(() => 0);
    r.results = [];
    g.winner = [];
    g.revision++;
    return true;
  }
  if (c.type === "game_rhythm_ready") {
    if (
      g.phase === "playing" ||
      typeof c.ready !== "boolean" ||
      c.song !== r.song ||
      c.difficulty !== r.difficulty ||
      c.length !== r.length
    )
      return false;
    r.ready[seat] = c.ready;
    g.revision++;
    return true;
  }
  if (c.type === "game_rhythm_pause") {
    if (g.phase !== "playing" || seat !== 0 || typeof c.paused !== "boolean")
      return false;
    if (c.paused && r.pausedAt === undefined) r.pausedAt = w.time;
    else if (!c.paused && r.pausedAt !== undefined) {
      const dt = w.time - r.pausedAt;
      r.start += dt;
      g.deadline += dt;
      r.pausedAt = undefined;
    } else return false;
    g.revision++;
    return true;
  }
  if (
    c.run !== r.run ||
    w.paused ||
    g.phase !== "playing" ||
    r.pausedAt !== undefined ||
    !Number.isInteger(c.note) ||
    !Number.isFinite(c.at) ||
    !["down", "up"].includes(c.edge)
  )
    return false;
  const song = rhythmSong(r.song)!,
    notes = rhythmChart(song, r.difficulty, r.length),
    n = notes[c.note],
    result = r.results[seat];
  if (
    !n ||
    !result ||
    c.at < 0 ||
    c.at > w.time - r.start + 0.2 ||
    c.at < w.time - r.start - 0.65
  )
    return false;
  if (c.edge === "down") {
    if (result.heads[c.note]) return false;
    const grade = rhythmGrade(c.at - n.time);
    if (grade === 4) return false;
    result.heads[c.note] = grade;
    awardRhythm(result, grade);
  } else {
    if (
      n.end === undefined ||
      !result.heads[c.note] ||
      result.heads[c.note] === 4 ||
      result.tails[c.note] ||
      c.at < n.time
    )
      return false;
    const grade = rhythmGrade(c.at - n.end);
    result.tails[c.note] = grade;
    awardRhythm(result, grade);
  }
  g.scores[seat] = Math.round((result.raw / (chartUnits(notes) * 1000)) * 1e6);
  g.revision++;
  return true;
}
export function tickRhythm(w: HomeGameWorld, g: HomeGame) {
  const r = g.rhythm!;
  if (r.pausedAt !== undefined) return;
  const notes = rhythmChart(rhythmSong(r.song)!, r.difficulty, r.length),
    elapsed = w.time - r.start,
    units = chartUnits(notes);
  let changed = false;
  for (let seat = 0; seat < r.results.length; seat++) {
    const result = r.results[seat];
    while (result.cursor < notes.length) {
      const i = result.cursor,
        n = notes[i];
      if ((n.end ?? n.time) + 0.75 >= elapsed) break;
      if (!result.heads[i]) {
        result.heads[i] = 4;
        awardRhythm(result, 4);
        changed = true;
      }
      if (n.end !== undefined && !result.tails[i]) {
        result.tails[i] = 4;
        awardRhythm(result, 4);
        changed = true;
      }
      result.cursor++;
    }
    // Later notes can expire while an earlier long note is still being held.
    for (
      let i = result.cursor;
      i < notes.length && notes[i].time + 0.75 < elapsed;
      i++
    ) {
      if (!result.heads[i]) {
        result.heads[i] = 4;
        awardRhythm(result, 4);
        changed = true;
      }
    }
    g.scores[seat] = Math.round((result.raw / Math.max(1, units * 1000)) * 1e6);
  }
  if (changed) g.revision++;
  if (w.time >= g.deadline) {
    g.phase = "finished";
    const best = Math.max(...g.scores);
    g.winner = g.scores
      .map((s, i) => (s === best ? i : -1))
      .filter((i) => i >= 0);
    g.message = "演奏が終わりました！";
    g.revision++;
  }
}
