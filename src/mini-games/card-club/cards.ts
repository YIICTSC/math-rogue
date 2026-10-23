export const SUITS = ['♣','♦','♥','♠'] as const;
export const rank=(card:number)=>card%13+1;
export const suit=(card:number)=>Math.floor(card/13);
export const high=(card:number)=>rank(card)===1?14:rank(card);
export const cardLabel=(card:number)=>card===52?'JOKER':`${SUITS[suit(card)]}${['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][rank(card)]}`;
export const scopaValue=(card:number)=>rank(card)>10?rank(card)-3:rank(card);
export function shuffled<T>(items:T[],seed:number):T[]{
  const out=[...items]; let n=seed>>>0;
  const rand=()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out;
}
export const pack=()=>Array.from({length:52},(_,i)=>i);
export const sorted=(cards:number[])=>[...cards].sort((a,b)=>suit(a)-suit(b)||high(a)-high(b));
export function combinations<T>(list:T[],n:number):T[][] {
  if(n===0)return [[]]; if(n>list.length)return [];
  return list.flatMap((v,i)=>combinations(list.slice(i+1),n-1).map(t=>[v,...t]));
}
export function blackjackValue(cards:number[]){let total=cards.reduce((s,c)=>s+Math.min(rank(c),10),0);if(cards.some(c=>rank(c)===1)&&total+10<=21)total+=10;return total;}
