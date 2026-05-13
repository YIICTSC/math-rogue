import { AnswerMode } from '../types';

const STORAGE_KEY_ANSWER_MODE = 'learning_rogue_answer_mode_v1';

export const normalizeAnswerMode = (mode?: string | null): AnswerMode => (
  mode === 'INPUT' ? 'INPUT' : 'CHOICE'
);

export const saveAnswerModePreference = (mode: AnswerMode) => {
  try {
    localStorage.setItem(STORAGE_KEY_ANSWER_MODE, normalizeAnswerMode(mode));
  } catch {
    // Ignore storage failures; callers still pass the mode through props.
  }
};

export const getAnswerModePreference = (): AnswerMode => {
  try {
    return normalizeAnswerMode(localStorage.getItem(STORAGE_KEY_ANSWER_MODE));
  } catch {
    return 'CHOICE';
  }
};

export const resolveAnswerMode = (mode?: AnswerMode, allowStoredFallback: boolean = false): AnswerMode => {
  if (allowStoredFallback) {
    const stored = getAnswerModePreference();
    if (stored === 'INPUT') return 'INPUT';
  }
  return normalizeAnswerMode(mode);
};
