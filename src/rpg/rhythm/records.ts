import type { RhythmDifficulty, RhythmLength } from "./chart";
export interface RhythmRecord {
  score: number;
  combo: number;
  fullCombo: boolean;
  plays: number;
}
const recordKey = (
  song: string,
  difficulty: RhythmDifficulty,
  length: RhythmLength,
) => `${song}|${difficulty}|${length}`;
export function rhythmRecords(): Record<string, RhythmRecord> {
  try {
    return (
      JSON.parse(localStorage.getItem("rpg-rhythm-records-v1") || "{}") || {}
    );
  } catch {
    return {};
  }
}
export const rhythmRecord = (
  song: string,
  difficulty: RhythmDifficulty,
  length: RhythmLength,
) => rhythmRecords()[recordKey(song, difficulty, length)];
export function saveRhythmRecord(
  song: string,
  difficulty: RhythmDifficulty,
  length: RhythmLength,
  score: number,
  combo: number,
  miss: number,
) {
  const bank = rhythmRecords(),
    key = recordKey(song, difficulty, length),
    previous = bank[key];
  bank[key] = {
    score: Math.max(previous?.score || 0, score),
    combo: Math.max(previous?.combo || 0, combo),
    fullCombo: !!previous?.fullCombo || miss === 0,
    plays: (previous?.plays || 0) + 1,
  };
  try {
    localStorage.setItem("rpg-rhythm-records-v1", JSON.stringify(bank));
  } catch {
    /* Gameplay remains available if device storage is full. */
  }
  return bank[key];
}
