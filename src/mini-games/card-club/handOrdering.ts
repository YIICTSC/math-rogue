import {high,rank,suit} from './cards';
import {definition} from './catalog';
import {CLASSIC_TRICKS,classicSuit,classicWeight} from './classicTricks';
import {EXTENDED_TRICKS,effectiveSuit,trickStrength} from './extendedTricks';
import {bluffStrength} from './bluffTricks';
import {marriageStrength} from './marriageGames';
import {ecarteStrength} from './ecarte';
import {ladderCardStrength} from './ladder';
import {speculationStrength} from './speculation';
import type {ClubView} from './model';
export type HandOrder='dealt'|'suit'|'rank';
/** Ascending playing strength, using the same special ranks as the rule engine. */
export function handStrength(v:ClubView,card:number):number{
 if(v.game==='daihinmin')return ladderCardStrength(card,!!v.ladder?.reversed);
 if(CLASSIC_TRICKS.has(v.game)){
  const first=v.extra.classic?.trickNo===0,lead=v.trick.length?classicSuit(v.game,v.trick[0].card,v.trump):-1;
  const allSame=v.trick.length>0&&v.trick.every(t=>suit(t.card)===lead)&&suit(card)===lead;
  return classicWeight(v.game,card,v.trump,lead,allSame,first,!v.trick.length||v.trick[0]?.card===52);
 }
 if(card===52)return 10000;
 if(EXTENDED_TRICKS.has(v.game))return trickStrength(v.game,card)+(effectiveSuit(v.game,card)===v.trump?100:0);
 if(v.game==='put'||v.game==='truc')return bluffStrength(v.game,card);
 if(v.game==='66'||v.game==='schnapsen')return marriageStrength(card)+(suit(card)===v.trump?100:0);
 if(v.game==='ecarte')return ecarteStrength(card)+(suit(card)===v.trump?100:0);
 if(v.game==='speculation')return speculationStrength(card);
 if(v.game==='sedma'||v.game==='sedmice')return rank(card)===7?100:rank(card)===rank(v.trick[0]?.card??-2)?50:rank(card);
 if(v.game==='shithead2')return rank(card)===2?100:rank(card)===10?99:high(card);
 const trumpGame=definition(v.game).family==='TRICK'||['durak2','perevodnoy','rollingstone','cangkul','getaway'].includes(v.game);
 if(trumpGame||['war','beggar','reddog'].includes(v.game))return high(card)+(trumpGame&&suit(card)===v.trump?100:0);
 // Matching, collecting and sequence-building games have no single-card strength.
 return rank(card);
}
export function orderHand(v:ClubView,order:HandOrder):number[]{
 const cards=[...v.players[v.self].hand];
 return order==='dealt'?cards:cards.sort((a,b)=>(order==='suit'?suit(a)-suit(b):0)||handStrength(v,a)-handStrength(v,b)||rank(a)-rank(b)||suit(a)-suit(b));
}
