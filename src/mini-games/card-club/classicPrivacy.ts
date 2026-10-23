import type { ClubState } from './model';
export function classicView(s:ClubState){
 const c=s.extra.classic;if(!c)return null;const reveal=s.phase==='round'||s.phase==='result';
 return {...c,deckHistory:[],
  rows:s.game==='golf'?c.rows.map((row,i)=>row.map((card,j)=>reveal||c.shown[i].includes(j)?card:-1)):s.game==='pontoon'?s.players.map((p,i)=>c.shown[i].map(index=>p.hand[index])):c.rows,
  hidden:c.hidden.map(row=>row.map(card=>card<0?-2:reveal?card:-1)),
  crib:reveal||s.extra.step==='cribCount'&&c.countIndex===2?c.crib:c.crib.map(()=>-1),
  partner:c.revealed||reveal?c.partner:-1,
 };
}
export function classicHideOwnHand(s:ClubState,index:number){
 return s.game==='euchre-uk'&&s.extra.step==='euchreBlind'&&index===s.dealer||s.game==='pontoon'&&index===s.dealer&&s.extra.step!=='pontoonDealer'&&s.phase!=='round'&&s.phase!=='result';
}
export const classicHideTable=(s:ClubState)=>s.game==='schwimmen'&&s.extra.step==='swimDealer'&&s.phase==='play';
