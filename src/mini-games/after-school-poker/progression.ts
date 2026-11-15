/** Poker-only lifetime progress. Round receipts make retries and restored victory screens idempotent. */
export interface PokerProgress {version:1;wins:number;clears:number;bestAnte:number;receipts:string[];}
export const POKER_PROGRESS_KEY='pixel_spire_poker_progress_v1';
export const freshPokerProgress=():PokerProgress=>({version:1,wins:0,clears:0,bestAnte:1,receipts:[]});
export function readPokerProgress():PokerProgress{try{const raw=JSON.parse(localStorage.getItem(POKER_PROGRESS_KEY)||'null');if(!raw||raw.version!==1)return freshPokerProgress();return {version:1,wins:Math.max(0,Math.floor(Number(raw.wins)||0)),clears:Math.max(0,Math.floor(Number(raw.clears)||0)),bestAnte:Math.max(1,Math.floor(Number(raw.bestAnte)||1)),receipts:Array.isArray(raw.receipts)?raw.receipts.filter((v:unknown)=>typeof v==='string').slice(-512):[]};}catch{return freshPokerProgress();}}
export function progressionTier(p:PokerProgress,ante=1){return Math.min(8,Math.max(Math.max(p.bestAnte,ante)-1,Math.floor(p.wins/3),p.clears*3));}
export function awardPokerWin(p:PokerProgress,runId:string,ante:number,blind:number):PokerProgress{const receipt=`${runId}:${ante}:${blind}`;if(p.receipts.includes(receipt))return p;return {...p,wins:p.wins+1,clears:p.clears+(ante===8&&blind===2?1:0),bestAnte:Math.max(p.bestAnte,ante+(blind===2?1:0)),receipts:[...p.receipts,receipt].slice(-512)};}
export function persistPokerProgress(p:PokerProgress){try{localStorage.setItem(POKER_PROGRESS_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function unlockedPokerItem(id:string,tier:number,requirements:Record<string,number>){return (requirements[id]??0)<=tier;}
