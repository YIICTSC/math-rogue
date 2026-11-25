import type { LanguageMode } from '../types';
import { PARTY_CATEGORIES, supportsLearningUnits, type PartyCategory, type ShowMode, type ShowQuestion, type VarietySelection } from './types';
import { situationQuestions, themedQuestions, topicKey, VARIETY_LEVELS, type Level } from './catalogue/partyTopics';
import { recommendedAudiences } from './catalogue/audiences';
import { reviewedDifficulty } from './catalogue/difficulty';
import { matchesPartyPlan, shuffle } from './engine';
import { onAirPrompt } from './prompt';
import prompts from './partyPrompts.json';
import variety from './varietyPrompts.json';
import reviewed from './reviewedPrompts.json';
import expandedPrompts from './expandedPrompts.json';
interface PartyPrompt { prompt: string[]; answer: string[]; aliases: string[]; options: string[][]; difficulty: string; category?: string }
const banks: Record<ShowMode,PartyPrompt[]> = prompts;
const additions: Record<ShowMode,PartyPrompt[]> = variety;
const newQuestions: Partial<Record<ShowMode,PartyPrompt[]>> = reviewed;
const expandedQuestions: Partial<Record<ShowMode,PartyPrompt[]>> = expandedPrompts;
const knowledgeModes: ReadonlySet<ShowMode> = new Set(['STANDARD','BUZZER','SURVIVAL','TEAMS']);

// Keep source positions as IDs. Retired rows stay in the original data for older rooms.
const starterLimits: Record<ShowMode,number> = {
 STANDARD:12, BUZZER:12, SURVIVAL:12, TEAMS:12, CONSENSUS:20,
 WOLF:0, MAJORITY:0, VOTE:0, DRAW:20, NEAREST:20,
};
const retiredStarter: Partial<Record<ShowMode,number[]>> = {
 STANDARD:[2,10], SURVIVAL:[0,11], TEAMS:[3,8], BUZZER:[9],
 CONSENSUS:[2,3,7,9,11,12,15,17,19],
 DRAW:[1,2,7,10,17], NEAREST:[4,6,7,14,18],
};
const sharedOpinionPrefix: ReadonlySet<ShowMode> = new Set(['CONSENSUS','WOLF','VOTE']);
const retiredKnowledge = [20,23,61,68,72,77,83];
const retiredVariety: Partial<Record<ShowMode,number[]>> = {
 MAJORITY:[1,7,23,25,28,29,32,34,40,42,56],
 NEAREST:[3,11,12,17,18,40,44,47,63,100],
 DRAW:[1],
};
export const CATEGORY_COPY: Record<PartyCategory,[string,string,string]> = {
 ALL:['すべて','All categories','すべて'],ANIMALS:['どうぶつ','Animals','どうぶつ'],FOOD:['たべもの','Food','たべもの'],LOVE:['恋愛・友情','Love & friendship','れんあい・ゆうじょう'],DAILY:['くらし','Everyday life','くらし'],WORLD:['旅・世界','Travel & the world','たび・せかい'],NATURE:['自然・科学','Nature & science','しぜん・かがく'],CULTURE:['音楽・物語','Music & stories','おんがく・ものがたり'],FANTASY:['もしも・空想','What if?','もしも・くうそう'],
 SPORTS:['スポーツ','Sports','スポーツ'],GAMES:['ゲーム・遊び','Games & play','ゲーム・あそび'],SCHOOL:['学校・青春','School days','がっこう・せいしゅん'],WORK:['仕事・発明','Jobs & inventions','しごと・はつめい'],HISTORY:['歴史・昔の暮らし','History & life in the past','れきし・むかしのくらし'],TECH:['デジタル・未来','Digital life & the future','デジタル・みらい'],MYSTERY:['ひらめき・謎','Puzzles & mysteries','ひらめき・なぞ'],MONEY:['お金・買い物','Money & shopping','おかね・かいもの'],SEASONS:['季節・行事','Seasons & celebrations','きせつ・ぎょうじ'],TRANSPORT:['乗り物','Transport','のりもの'],HEALTH:['からだ・健康','Body & well-being','からだ・けんこう'],SPACE:['宇宙・天体','Space & astronomy','うちゅう・てんたい'],
};

export const MODE_VARIETY_COPY: Record<ShowMode,[string,string,string]> = {
 STANDARD:['知識とひらめきで挑むクイズ。4択は自動判定します。','Facts and insights; four-choice answers are checked automatically.','ちしきとひらめきのクイズ。4たくはじどうではんてい。'],
 BUZZER:['短い手がかりから答えをつかむ、早押し向けの問題です。','Quick questions for spotting an answer and buzzing in.','こたえがわかったらはやおしするもんだいだよ。'],
 SURVIVAL:['似た選択肢もよく比べて、ライフを守る知識クイズです。','Compare plausible choices and protect your lives.','にたせんたくしをくらべて、ライフをまもろう。'],
 TEAMS:['得意分野を持ち寄れる、幅広いジャンルの知識クイズです。','Broad factual topics let teammates contribute different strengths.','みんなのとくいをあわせる、いろいろなクイズ。'],
 CONSENSUS:['自分の好みより共通イメージを探して、全員一致を狙います。','Find a shared association rather than a personal favorite.','じぶんのこのみより、みんなのおなじイメージをさがそう。'],
 MAJORITY:['正解は一つではありません。迷う選択から多数派を探します。','There is no fixed correct answer; choose among genuine trade-offs.','きまったせいかいはないよ。まようせんたくでたすうはをさがそう。'],
 NEAREST:['時間・回数・人数などの理想を数字で回答。参加者の平均を狙います。','Answer numerical opinions about time, counts and people; aim for the group mean.','じかんやかいすうのりそうをすうじでこたえ、みんなのへいきんをねらおう。'],
 DRAW:['形で伝わる物や動作を描きます。短い答え・別表記も受け付けます。','Draw recognizable objects and actions; core nouns and alternative names are accepted.','かたちでつたわるものやうごきをかこう。みじかいこたえもつかえるよ。'],
 VOTE:['おかしな場面の続きを自由に発想して、みんなの投票で選びます。','Invent an amusing answer to a playful scene, then vote for your favorites.','おかしなばめんをじゆうにはっそうして、みんなでとうひょう。'],
 WOLF:['共通イメージを合わせながら、答え方や審議で仲間に紛れた狼を探します。','Match shared associations and use answers and deliberation to spot hidden wolves.','おなじイメージをあわせながら、こたえかたでおおかみをさがそう。'],
};
function classify(prompt:string):Exclude<PartyCategory,'ALL'>{
 if(/スポーツ|サッカー|バスケ|テニス|野球|バレー|運動会|リレー|マラソン/.test(prompt))return 'SPORTS';
 if(/ゲーム|チェス|将棋|オセロ|トランプ|サイコロ|パズル|RPG/.test(prompt))return 'GAMES';
 if(/学校|教室|授業|宿題|文化祭|修学旅行|卒業|給食|図書室|部活動/.test(prompt))return 'SCHOOL';
 if(/宇宙|月面|銀河|惑星|ロケット|人工衛星|宇宙人/.test(prompt))return 'SPACE';
 if(/デジタル|スマホ|アプリ|ロボット|パソコン|インターネット|AI|通知/.test(prompt))return 'TECH';
 if(/探偵|謎解き|暗号|推理|手がかり/.test(prompt))return 'MYSTERY';
 if(/貯金|買い物|財布|お金|予算|おこづかい|お小遣い|値段|値札/.test(prompt))return 'MONEY';
 if(/仕事|職業|発明|会社|職人|工房/.test(prompt))return 'WORK';
 if(/歴史|昔の|江戸|縄文|古代|博物館|タイムマシン/.test(prompt))return 'HISTORY';
 if(/季節|夏祭り|お正月|冬休み|夏休み|花見|紅葉|こいのぼり|雪だるま/.test(prompt))return 'SEASONS';
 if(/乗り物|電車|自転車|飛行機|バス停|鉄道|船長|ヨット|気球/.test(prompt))return 'TRANSPORT';
 if(/健康|睡眠|歯みがき|歯磨き|ストレッチ|昼寝|深呼吸/.test(prompt))return 'HEALTH';
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
function authoredQuestions(mode:ShowMode,language:LanguageMode):ShowQuestion[]{
 const original = banks[mode].flatMap((q,i)=>i<starterLimits[mode]&&!retiredStarter[mode]?.includes(i)
  ? [question(mode,language,q,`starter-${mode}-${i}`)] : []);
 const retired = knowledgeModes.has(mode)?retiredKnowledge:retiredVariety[mode];
 const expanded = additions[mode].flatMap((q,i)=>(!sharedOpinionPrefix.has(mode)||i>=64)&&!retired?.includes(i)
  ? [question(mode,language,q,`variety-${mode}-${i}`)] : []);
 const sourceMode = knowledgeModes.has(mode) ? 'STANDARD' : mode;
 const authored = newQuestions[sourceMode] ?? [];
 const extra = expandedQuestions[sourceMode] ?? [];
 return [...original,...expanded,...authored.map((q,i)=>question(mode,language,q,`reviewed-${mode}-${i}`)),
  ...extra.map((q,i)=>question(mode,language,q,`expanded-${mode}-${i}`))];
}

const locales = ['JAPANESE', 'ENGLISH', 'HIRAGANA'] as const;
const catalogues = new Map<ShowMode, ShowQuestion[][]>();
const BASE_VARIETY_PER_LEVEL = 30;
export const MAX_VARIETY_PACK = 240;
export type { VarietySelection } from './types';

const promptKey = (mode: ShowMode, q: ShowQuestion) =>
 topicKey(mode === 'DRAW' ? q.answer : onAirPrompt({mode, prompt:q.prompt}));

const partyModes = ['CONSENSUS', 'MAJORITY', 'VOTE', 'WOLF'] as const;
// A few legacy surveys asked for an abstract count or carried a theme from another category.
const retiredSurveyText = /ペットのドラゴン|秘密基地の広さ|夢のお城の部屋数|透明になれる時間|大切な人と一年に何個、新しい思い出|自然の中で何日過ごしたい|空飛ぶ町には何人|月面基地に一度に何人|一つの料理を極めるなら/u;

// Older rooms can still contain cards from a previous catalogue.
export function isLegacyVarietyId(mode: ShowMode, id: string) {
 return id.startsWith('catalogue-') || (mode === 'NEAREST' && /^(?:party-estimate-|(?:starter|variety|reviewed|expanded)-NEAREST-)/u.test(id));
}

/** Keep the same catalogue IDs and selection in all three languages. */
export function varietyQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
 let banks = catalogues.get(mode);
 if (!banks) {
  banks = locales.map(() => []);
  const own = locales.map(locale => authoredQuestions(mode, locale));
  const retiredSurveys = mode === 'NEAREST' ? new Set(own[0].filter(q =>
    q.id.startsWith('expanded-') || retiredSurveyText.test(q.prompt)).map(q => q.id)) : new Set<string>();
  const sharedModes = partyModes.includes(mode as typeof partyModes[number]) ? partyModes.filter(m => m !== mode) : [];
  const shared = locales.map(locale => sharedModes.flatMap(m => authoredQuestions(m, locale)));
  const visibleKeys = locales.map(() => new Set<string>());
  const menuTopics = new Set<string>();
  const append = (rows: ShowQuestion[], theme: string, level: Level = reviewedDifficulty(mode, rows[0])) => {
   const keys = rows.map(q => promptKey(mode, q));
   if (menuTopics.has(theme) || keys.some((key, locale) => visibleKeys[locale].has(key))) return false;
   menuTopics.add(theme);
   const audiences = rows[0].audiences ?? recommendedAudiences(rows[0]);
   for (const [locale, q] of rows.entries()) {
    visibleKeys[locale].add(keys[locale]);
    banks![locale].push({ ...q, audiences, difficulty: level, seconds: mode === 'VOTE' ? 90 : q.seconds });
   }
   return true;
  };
  for (const category of PARTY_CATEGORIES) {
   if (category === 'ALL') continue;
   const counts = { EASY: 0, NORMAL: 0, HARD: 0 };
   const add = (rows: ShowQuestion[], theme: string) => {
    if (mode === 'NEAREST') {
     if (!retiredSurveys.has(rows[0].id)) append(rows, theme);
     return;
    }
    // Preserve the selection and order of existing cards. The displayed level is reviewed separately.
    const least = VARIETY_LEVELS.reduce((a, b) => counts[a] <= counts[b] ? a : b);
    const preferred = rows[0].difficulty;
    const originalLevel = preferred && counts[preferred] < BASE_VARIETY_PER_LEVEL ? preferred : least;
    if (counts[originalLevel] < BASE_VARIETY_PER_LEVEL && append(rows, theme)) counts[originalLevel]++;
   };
   const addAuthored = (source: ShowQuestion[][]) => {
    for (const [i, q] of source[0].entries()) {
     if (q.category !== category) continue;
     const theme = q.answer && !/^\d/u.test(q.answer) ? topicKey(q.answer) : promptKey(mode, q);
     add(source.map(items => items[i]), theme);
    }
   };
   const candidates = locales.map(locale => themedQuestions(mode, locale, category));
   if (!sharedModes.length) addAuthored(own);
   for (const [i, entry] of candidates[0].entries()) {
    if (sharedModes.length && entry.question.id.startsWith('party-estimate-')) continue;
    add(candidates.map(items => items[i].question), entry.theme);
   }
   if (sharedModes.length) {
    addAuthored(own);
    addAuthored(shared);
    for (const [i, entry] of candidates[0].entries()) {
     if (entry.question.id.startsWith('party-estimate-')) add(candidates.map(items => items[i].question), entry.theme);
    }
   }
  }
  for (const category of PARTY_CATEGORIES) {
   if (category === 'ALL') continue;
   const additions = locales.map(locale => situationQuestions(mode, locale, category));
   for (const [i, { theme, question }] of additions[0].entries()) {
    append(additions.map(items => items[i].question), theme, question.difficulty);
   }
  }
  catalogues.set(mode, banks);
 }
 return banks[language === 'ENGLISH' ? 1 : language === 'HIRAGANA' ? 2 : 0].slice();
}

export function varietyPack(catalogue: ShowQuestion[], selection: VarietySelection): ShowQuestion[] {
 const eligible = catalogue.filter(q => matchesPartyPlan(q, selection));
 if (eligible.length <= MAX_VARIETY_PACK) return eligible;
 return (selection.order === 'RANDOM' ? shuffle(eligible) : eligible).slice(0, MAX_VARIETY_PACK);
}

/** A fresh room starts with three random prompts per category, mixing available levels. */
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
 const shuffled = shuffle(varietyQuestions(mode, language));
 return PARTY_CATEGORIES.flatMap(category => {
  const prompts = shuffled.filter(q => q.category === category);
  const mixed = VARIETY_LEVELS.flatMap(level => prompts.find(q => q.difficulty === level) ?? []);
  return [...mixed, ...prompts.filter(q => !mixed.includes(q))].slice(0, 3);
 });
}
