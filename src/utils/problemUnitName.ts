import type { SubjectCategoryType } from '../subjectConfig';
import type { LanguageMode } from '../types';
import { trans } from './textUtils';

const JAPANESE_CURRICULUM_UNIT_CATEGORIES = new Set<SubjectCategoryType>([
  'MATH',
  'MATH_GRADES',
  'KOKUGO_GRADES',
  'KANJI',
  'KANKEN',
  'HARD_KANJI',
  'LIFE',
  'SCIENCE',
  'SOCIAL',
  'ENGLISH',
  'SUMMARY',
  'MAP_PREF',
  'IT_INFO',
  'UPPER_MODERN',
  'UPPER_CLASSICS',
  'UPPER_ENGLISH',
  'UPPER_INFORMATION',
  'UPPER_TRIVIA',
  'UPPER_MATH',
  'UPPER_SCIENCE',
  'UPPER_SOCIETY',
  'UPPER_ESSAY',
  'UPPER_PRACTICAL',
]);

const NATIVE_ENGLISH_UNIT_CATEGORIES = new Set<SubjectCategoryType>([
  'NATIVE_ELA',
  'NATIVE_MATH',
  'NATIVE_SCIENCE',
  'NATIVE_SOCIAL',
  'NATIVE_JAPANESE',
]);

const hasJapaneseScript = (value: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(value);

export const shouldKeepJapaneseProblemUnitName = (
  name: string,
  categoryId?: SubjectCategoryType,
) => {
  if (categoryId && NATIVE_ENGLISH_UNIT_CATEGORIES.has(categoryId)) return false;
  if (categoryId && JAPANESE_CURRICULUM_UNIT_CATEGORIES.has(categoryId)) return true;
  return hasJapaneseScript(name);
};

// The two player-facing problem selection screens intentionally show the
// curriculum's original Japanese unit label in every language mode. Subject
// names, controls, and explanatory copy continue to use the selected locale.
export const formatProblemSelectionUnitName = (name: string) => name;

export const formatProblemUnitName = (
  name: string,
  languageMode: LanguageMode,
  categoryId?: SubjectCategoryType,
) => {
  if (languageMode !== 'ENGLISH') return name;
  // Daily assignments compose labels from independently translated category and
  // unit names. Translate each segment so the generic sentence fallback cannot
  // swallow an entire composite label.
  return name
    .split(/(\s*[/：:]\s*)/)
    .map((segment) => {
      if (/^\s*[/：:]\s*$/.test(segment)) {
        return segment.includes('/') ? ' / ' : ': ';
      }
      return segment
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => trans(part, languageMode))
        .join(' ');
    })
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
