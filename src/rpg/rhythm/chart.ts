import { RHYTHM_SONGS, type RhythmSong } from "./catalog.generated";
export type RhythmDifficulty = "easy" | "normal" | "expert";
export type RhythmLength = "full" | "short";
export interface RhythmNote {
  time: number;
  lane: number;
  end?: number;
}
export const rhythmSong = (id: string) => RHYTHM_SONGS.find((s) => s.id === id);
export const chartDuration = (song: RhythmSong, length: RhythmLength) =>
  length === "short" ? Math.min(90, song.duration) : song.duration;
const cache = new Map<string, RhythmNote[]>();
export function rhythmChart(
  song: RhythmSong,
  difficulty: RhythmDifficulty,
  length: RhythmLength,
): RhythmNote[] {
  const key = `${song.id}:${difficulty}:${length}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const duration = chartDuration(song, length),
    beat = 60 / song.bpm,
    interval =
      beat * (difficulty === "easy" ? 2 : difficulty === "expert" ? 0.5 : 1),
    notes: RhythmNote[] = [],
    patterns = [
      [0, 1, 2, 3],
      [0, 2, 1, 3],
      [3, 2, 1, 0],
      [0, 1, 0, 2],
      [3, 1, 2, 0],
    ],
    occupied = [0, 0, 0, 0];
  let hash = 0;
  for (const c of song.id) hash = (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0;
  let onset = 0,
    index = 0;
  for (
    let grid = song.offset;
    grid < duration - 0.28;
    grid += interval, index++
  ) {
    if (grid < 0.6) continue;
    while (
      onset + 1 < song.onsets.length &&
      Math.abs(song.onsets[onset + 1] / 1000 - grid) <=
        Math.abs(song.onsets[onset] / 1000 - grid)
    )
      onset++;
    const audible = song.onsets[onset] / 1000,
      delta = Math.abs(audible - grid);
    if (!Number.isFinite(audible) || delta > Math.max(0.6, beat)) continue;
    const time =
      Math.round(
        (delta < Math.min(0.065, interval * 0.18) ? audible : grid) * 1000,
      ) / 1000;
    const phrase = Math.floor(index / 16),
      pattern = patterns[(phrase + hash) % patterns.length],
      lane = pattern[index % 4];
    if (time <= occupied[lane] + 0.14) continue;
    const strong = (song.power[onset] || 0) > 55;
    const hold =
      difficulty !== "easy" &&
      index % 16 == 8 &&
      time + beat * 2 < duration - 0.3;
    const end = hold
      ? Math.round((time + beat * (difficulty === "expert" ? 2 : 1.5)) * 1000) /
        1000
      : undefined;
    notes.push({ time, lane, ...(end ? { end } : {}) });
    occupied[lane] = end || time;
    if (difficulty === "expert" && strong && index % 8 === 0) {
      const second = (lane + 2) % 4;
      if (time > occupied[second] + 0.14) {
        notes.push({ time, lane: second });
        occupied[second] = time;
      }
    }
  }
  notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, notes);
  return notes;
}
export type RhythmGrade = 1 | 2 | 3 | 4;
export function rhythmGrade(delta: number): RhythmGrade {
  const d = Math.abs(delta);
  return d <= 0.045 ? 1 : d <= 0.095 ? 2 : d <= 0.17 ? 3 : 4;
}
export const rhythmRank = (score: number) =>
  score >= 995000
    ? "SSS"
    : score >= 950000
      ? "S"
      : score >= 850000
        ? "A"
        : score >= 700000
          ? "B"
          : score >= 500000
            ? "C"
            : "D";
export const chartUnits = (notes: RhythmNote[]) =>
  notes.length + notes.filter((n) => n.end !== undefined).length;
