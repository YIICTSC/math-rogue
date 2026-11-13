import type { LanguageMode } from '../types';
import type { PartyCategory, ShowMode, ShowQuestion } from './types';
import prompts from './partyPrompts.json';
import variety from './varietyPrompts.json';
interface PartyPrompt { prompt: string[]; answer: string[]; aliases: string[]; options: string[][]; difficulty: string; category?: string }
const banks: Record<ShowMode,PartyPrompt[]> = prompts;
const additions: Record<ShowMode,PartyPrompt[]> = variety;
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
/** Preserve the original 60-question packs and IDs for saved rooms. */
export function starterQuestions(mode: ShowMode, language: LanguageMode): ShowQuestion[] {
 return banks[mode].map((q,i)=>question(mode,language,q,`starter-${mode}-${i}`));
}
/** Category and difficulty filtering is authoritative, shared by host and server. */
export function varietyQuestions(mode:ShowMode,language:LanguageMode):ShowQuestion[]{
 return [...starterQuestions(mode,language),...additions[mode].map((q,i)=>question(mode,language,q,`variety-${mode}-${i}`))];
}
