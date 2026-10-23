import { CLUB_GAMES, REFERENCE_GAMES, isPlayable } from './catalog';

export const GENRE_LABELS:Record<string,string>={
  'トリックテイキング':'Trick-taking', 'カシノ系のゲーム':'Fishing / capturing',
  'ラミー系のゲーム':'Rummy', '手札出しきりゲーム':'Shedding', '大貧民の仲間':'Climbing / President',
  'クリベッジの仲間':'Cribbage', 'ポーカーの仲間':'Poker', 'レイアウトゲーム':'Layout / patience',
  '交換ゲーム':'Exchanging / collecting', 'うそつきゲーム':'Bluffing', '加算ゲーム':'Adding / totals',
  '推理ブラフゲーム':'Deduction', 'マネージメントゲーム':'Management', 'ユニークな新作':'Original games',
  'その他':'Other', '全取得ゲーム':'Collecting the pack', 'ギャンブルゲーム':'Chance / betting points',
};
export const GENRES=Object.keys(GENRE_LABELS);
const ALIASES:Record<string,string>={memory:'神経衰弱 しんけいすいじゃく concentration pelmanism',oldmaid:'ババ抜き ばばぬき',fantan:'七並べ しちならべ',daihinmin:'大富豪 だいふごう president',war:'戦争 せんそう',heart2:'ハーツ hearts'};
export function normalizeSearch(text:string){return text.normalize('NFKC').toLocaleLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[・･ー\-–—_/]/g,' ');}
export function searchGames(query='',genre='',status:'all'|'available'|'unavailable'='all'){
  const words=normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  return REFERENCE_GAMES.filter(g=>{
    if(genre&&g.category!==genre)return false;
    if(status!=='all'&&isPlayable(g.id)!==(status==='available'))return false;
    const definition=CLUB_GAMES.find(d=>d.id===g.id);
    const haystack=normalizeSearch(`${g.id} ${g.name} ${g.english} ${g.category} ${g.subcategory} ${GENRE_LABELS[g.category]} ${definition?.family||''} ${ALIASES[g.id]||''}`);
    return words.every(w=>haystack.includes(w));
  });
}
