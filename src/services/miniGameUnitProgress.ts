import type { AssignmentAnswerResult } from '../types';
import { storageService } from './storageService';

export const MINI_GAME_UNIT_CORRECT_EVENT = 'learning-rogue:mini-game-unit-correct';
export type MiniGameUnitCorrectDetail = { mode: string; count: number; handled: boolean };
const recordedReceipts = new Set<string>();

/** Attribute an accepted answer to its actual unit, including mixed-unit lessons. */
export function recordMiniGameUnitProgress(result: Pick<AssignmentAnswerResult, 'mode' | 'correct' | 'pointReceipt'>) {
  if (!result.correct || !result.mode || result.mode === 'ASSIGNMENT_CUSTOM') return;
  if (result.pointReceipt) {
    if (recordedReceipts.has(result.pointReceipt)) return;
    recordedReceipts.add(result.pointReceipt);
    if (recordedReceipts.size > 4096) recordedReceipts.delete(recordedReceipts.values().next().value!);
  }
  const detail: MiniGameUnitCorrectDetail = { mode: result.mode, count: 1, handled: false };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MINI_GAME_UNIT_CORRECT_EVENT, { detail }));
  }
  // The app owns mastery rewards and React state. Standalone game entries still
  // persist progress when there is no app listener (e.g. an embedded game).
  if (!detail.handled) {
    const counts = storageService.getModeCorrectCounts();
    storageService.saveModeCorrectCounts({ ...counts, [result.mode]: (counts[result.mode] || 0) + 1 });
  }
}
