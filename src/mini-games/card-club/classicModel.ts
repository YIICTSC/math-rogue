/** Physical cards live in rows, hidden and crib. Other card references are declaration/history snapshots, never physical piles. */
export interface ClassicState {
  notices:{to:number;from:number;card:number}[]; reveals:{player:number;card:number}[];
  deckHistory:number[];
  rows:number[][]; hidden:number[][]; shown:number[][]; owners:number[]; bids:number[];
  caller:number; contract:number; partnerCard:number; partner:number; revealed:boolean;
  passes:number; trickNo:number; handSize:number; banned:number; indicatorSuit:number;
  attacker:number; defender:number; limit:number; attackCount:number; defenseIndex:number; first:number;
  drawnFromDiscard:boolean; closedBy:number; remaining:number[];
  crib:number[]; countIndex:number; go:boolean[]; last:number; nextDealer:number;
  pendingMarriage:number[];
  notes:{player:number;label:string;points:number}[];
}
export const emptyClassic=(n:number):ClassicState=>({pendingMarriage:Array(n).fill(0),notices:[],reveals:[],deckHistory:[],rows:Array.from({length:n},()=>[]),hidden:Array.from({length:n},()=>[]),shown:Array.from({length:n},()=>[]),owners:[],bids:Array(n).fill(-1),caller:-1,contract:0,partnerCard:-1,partner:-1,revealed:false,passes:0,trickNo:0,handSize:0,banned:-1,indicatorSuit:-1,attacker:0,defender:1,limit:6,attackCount:0,defenseIndex:0,first:0,drawnFromDiscard:false,closedBy:-1,remaining:[],crib:[],countIndex:0,go:Array(n).fill(false),last:-1,nextDealer:-1,notes:[]});
