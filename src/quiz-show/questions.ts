import type { LanguageMode } from '../types';
import type { ShowMode, ShowQuestion } from './types';
import prompts from './partyPrompts.json';
interface PartyPrompt { prompt: string[]; answer: string[]; aliases: string[]; options: string[][]; difficulty: string }
const banks: Record<ShowMode,PartyPrompt[]> = prompts;
/** Full banks stay separate from learning units and host-authored questions. */
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
 const locale=language==='ENGLISH'?1:language==='HIRAGANA'?2:0;
 return banks[mode].map((q,i):ShowQuestion=>({id:`starter-${mode}-${i}`,prompt:q.prompt[locale],answer:q.answer[locale],aliases:[...new Set([...q.aliases,...q.answer.filter(Boolean),q.answer[1].replace(/^(?:a|an) /,'')])].filter(Boolean),options:q.options[locale]||[],format:mode==='DRAW'?'FLIP':'TEXT',seconds:mode==='DRAW'||mode==='VOTE'?90:mode==='BUZZER'?25:mode==='NEAREST'?60:40,points:100,party:true,difficulty:q.difficulty as ShowQuestion['difficulty'],opinion:['CONSENSUS','MAJORITY','WOLF','VOTE','NEAREST'].includes(mode)}));
}
