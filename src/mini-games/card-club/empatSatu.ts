import { rank,suit,sorted } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic } from './classicCommon';
import { worldCycle } from './worldShedding';
const value=(card:number)=>rank(card)===1?11:Math.min(rank(card),10);
export function empatScore(cards:number[]){
 const options=[0,1,2,3].map(st=>{const signed=cards.map(card=>(suit(card)===st?1:-1)*value(card));return {points:signed.reduce((a,b)=>a+b,0),worst:Math.min(...signed),suit:st};});
 return options.sort((a,b)=>b.points-a.points||b.worst-a.worst)[0];
}
function start(s:ClubState){initClassic(s);dealCards(s,4);s.turn=s.dealer;s.extra.step='empatDraw';}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,hand=s.players[s.turn].hand;
 if(s.extra.step==='empatDiscard')return hand.filter(card=>card!==c.banned).map(card=>({type:'discard',cards:[card]}));
 return [...s.stock.length?[{type:'draw' as const}]:[{type:'stand' as const}],...s.discard.length?[{type:'draw' as const,target:1}]:[],...hand.every(card=>suit(card)===suit(hand[0]))?[{type:'close' as const}]:[]];
}
function settle(s:ClubState){
 const c=s.extra.classic!,scores=s.players.map(p=>empatScore(p.hand)),best=[...scores].sort((a,b)=>b.points-a.points||b.worst-a.worst)[0];
 s.players.forEach((p,i)=>{p.score=scores[i].points;c.notes.push({player:i,label:'handValue',points:p.score});});
 finish(s,scores.flatMap((score,i)=>score.points===best.points&&score.worst===best.worst?[i]:[]));
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn;
 if(a.type==='stand'||a.type==='close'){settle(s);return;}
 if(a.type==='draw'){
  const card=a.target===1?s.discard.pop()!:s.stock.pop()!;s.players[i].hand=sorted([...s.players[i].hand,card]);c.banned=a.target===1?card:-1;s.extra.step='empatDiscard';s.extra.indicator=s.discard.at(-1)??-1;record(s,'draw',i);return;
 }
 removeCards(s,i,a.cards!);s.discard.push(...a.cards!);s.extra.indicator=a.cards![0];s.extra.step='empatDraw';s.turn=nextSeat(s);record(s,'discard',i,undefined,a.cards![0]);
 worldCycle(s,500,()=>settle(s));
}
function cpu(v:ClubView):Action|undefined{
 const hand=v.players[v.self].hand;
 if(v.extra.step==='empatDiscard')return [...v.actions].sort((a,b)=>{const x=empatScore(hand.filter(c=>c!==a.cards![0])),y=empatScore(hand.filter(c=>c!==b.cards![0]));return y.points-x.points||y.worst-x.worst;})[0];
 const stop=v.actions.find(a=>a.type==='close');if(stop)return stop;
 const top=v.extra.indicator;if(top>=0){const improved=hand.some(card=>empatScore([...hand.filter(c=>c!==card),top]).points>empatScore(hand).points);if(improved)return v.actions.find(a=>a.target===1);}
 return v.actions.find(a=>a.type==='draw'&&a.target===undefined)||v.actions.find(a=>a.type==='stand')||v.actions[0];
}
export const empatRules:RuleExtension={start,actions,apply,cpu};
