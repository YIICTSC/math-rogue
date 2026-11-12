import type { LanguageMode } from '../types';
import type { ShowMode, ShowQuestion } from './types';
import prompts from './partyPrompts.json';

interface PartyPrompt { prompt: string[]; answer: string[]; aliases: string[] }
const banks: Record<ShowMode, PartyPrompt[]> = prompts;

/** Hand-authored packs: factual quizzes have answers; social prompts never do. */
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
  const locale = language === 'ENGLISH' ? 1 : language === 'HIRAGANA' ? 2 : 0;
  return banks[mode].map((q, i): ShowQuestion => ({
    id: `starter-${mode}-${i}`, prompt: q.prompt[locale], answer: q.answer[locale],
    aliases: [...new Set([...q.aliases, ...q.answer.filter(Boolean), q.answer[1].replace(/^(?:a|an) /, '')])].filter(Boolean),
    options: [], format: mode === 'DRAW' ? 'FLIP' : 'TEXT',
    seconds: mode === 'DRAW' || mode === 'VOTE' ? 90 : mode === 'BUZZER' ? 25 : mode === 'NEAREST' ? 60 : 40,
    points: 100,
  }));
}
