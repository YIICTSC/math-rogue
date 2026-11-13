import type { LanguageMode } from '../types';
import type { PartyCategory, ShowMode, ShowQuestion } from './types';
import prompts from './partyPrompts.json';
import variety from './varietyPrompts.json';
interface PartyPrompt { prompt: string[]; answer: string[]; aliases: string[]; options: string[][]; difficulty: string; category?: string }
const banks: Record<ShowMode,PartyPrompt[]> = prompts;
const additions: Record<ShowMode,PartyPrompt[]> = variety;
export const CATEGORY_COPY: Record<PartyCategory,[string,string,string]> = {
 ALL:['すべて','All categories','すべて'],ANIMALS:['どうぶつ','Animals','どうぶつ'],FOOD:['たべもの','Food','たべもの'],LOVE:['恋愛・友情','Love & friendship','れんあい・ゆうじょう'],DAILY:['くらし','Everyday life','くらし'],WORLD:['旅・世界','Travel & the world','たび・せかい'],NATURE:['自然・科学','Nature & science','しぜん・かがく'],CULTURE:['音楽・物語','Music & stories','おんがく・ものがたり'],FANTASY:['もしも・空想','What if?','もしも・くうそう'],
};
function classify(prompt:string):Exclude<PartyCategory,'ALL'>{
 if(/恋|友達|友人|仲直り|デート|告白|友情|手紙|大切な人/.test(prompt))return 'LOVE';
 if(/動物|ネコ|猫|犬|ペンギン|ウサギ|イルカ|キリン|パンダ|鳥|水族館/.test(prompt))return 'ANIMALS';
 if(/食|料理|お菓子|おやつ|パン|ケーキ|プリン|カレー|果物|ラーメン|給食/.test(prompt))return 'FOOD';
 if(/旅|国|都市|地図|観光|空港|世界|電車|駅/.test(prompt))return 'WORLD';
 if(/音楽|歌|映画|物語|絵本|本屋|図書|俳句|楽器|美術|漫画/.test(prompt))return 'CULTURE';
 if(/宇宙|魔法|魔王|勇者|竜|ドラゴン|妖精|空飛ぶ|未来/.test(prompt))return 'FANTASY';
 if(/自然|科学|星|月|太陽|地球|花|植物|海|森|雨|雪|虹/.test(prompt))return 'NATURE';
 return 'DAILY';
}
function question(mode:ShowMode,language:LanguageMode,q:PartyPrompt,id:string):ShowQuestion{
 const locale=language==='ENGLISH'?1:language==='HIRAGANA'?2:0;
 return {id,prompt:q.prompt[locale],answer:q.answer[locale],aliases:[...new Set([...q.aliases,...q.answer.filter(Boolean),q.answer[1].replace(/^(?:a|an) /,'')])].filter(Boolean),options:q.options[locale]||[],format:mode==='DRAW'?'FLIP':'TEXT',seconds:mode==='DRAW'||mode==='VOTE'?90:mode==='BUZZER'?25:mode==='NEAREST'?60:40,points:100,party:true,difficulty:q.difficulty as ShowQuestion['difficulty'],category:q.category as ShowQuestion['category']||classify(q.prompt[0]),opinion:['CONSENSUS','MAJORITY','WOLF','VOTE','NEAREST'].includes(mode)};
}
/** Preserve the original 60-question packs and IDs for saved rooms. */
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
 return banks[mode].map((q,i)=>question(mode,language,q,`starter-${mode}-${i}`));
}
/** Category and difficulty filtering is authoritative, shared by host and server. */
export function varietyQuestions(mode:ShowMode,language:LanguageMode):ShowQuestion[]{
 return [...starterQuestions(mode,language),...additions[mode].map((q,i)=>question(mode,language,q,`variety-${mode}-${i}`))];
}
