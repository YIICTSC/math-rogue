import {isMeld,meldOptions} from './rummy';
import {ginHand} from './gin';
export function retainHandGroups(groups:number[][],hand:number[]){
 const used=new Set<number>(),kept:number[][]=[];
 for(const group of groups)if(isMeld(group)&&group.every(card=>hand.includes(card)&&!used.has(card))){kept.push([...group]);group.forEach(card=>used.add(card));}
 return kept;
}
export function automaticHandGroups(hand:number[]):number[][]{
 if(hand.length<=14)return ginHand(hand).melds.map(group=>[...group]);
 // Large rummy hands use bounded greedy grouping rather than an exponential search.
 const groups:number[][]=[];let rest=[...hand];
 for(;;){const best=meldOptions(rest).sort((a,b)=>b.reduce((n,c)=>n+Math.min(c%13+1,10),0)-a.reduce((n,c)=>n+Math.min(c%13+1,10),0))[0];if(!best)break;groups.push(best);rest=rest.filter(card=>!best.includes(card));}return groups;
}
