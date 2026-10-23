import { rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic } from './classicCommon';
import { worldCycle } from './worldShedding';
export function suitBalanced(hand:number[]){const counts=[0,1,2,3].map(st=>hand.filter(card=>suit(card)===st).length);return counts.every(n=>n===counts[0]);}
export function canReturn(hand:number[],total:number){const sums=new Set([0]);for(const card of hand)for(const n of [...sums])if(n+rank(card)<=total)sums.add(n+rank(card));return sums.has(total);}
function start(s:ClubState){const c=initClassic(s);s.direction=-1;dealCards(s,7);s.turn=nextSeat(s,s.dealer);s.extra.step='suitOffer';c.first=s.turn;c.last=nextSeat(s,s.turn,1);}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,hand=s.players[s.turn].hand;
 if(s.extra.step==='suitOffer')return hand.map(card=>({type:'play',cards:[card]}));
 if(s.extra.step==='suitReply')return [{type:'draw'},...canReturn(hand,c.contract)?[{type:'accept' as const}]:[]];
 if(s.extra.step==='suitReturn')return hand.filter(card=>rank(card)<=c.contract&&canReturn(hand.filter(c=>c!==card),c.contract-rank(card))).map(card=>({type:'exchange',cards:[card]}));
 if(s.extra.step==='suitBottom')return [{type:'continue'},...c.countIndex<3?hand.map(card=>({type:'discard' as const,cards:[card]})):[]];
 return [{type:'continue'},...hand.filter(card=>rank(card)<=2).map(card=>({type:'discard' as const,cards:[card]}))];
}
function turnorFinish(s:ClubState){s.turn=s.extra.classic!.first;s.extra.step='suitFinish';}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,card=a.cards?.[0];
 if(s.extra.step==='suitOffer'){c.first=i;c.last=nextSeat(s,i,1);c.contract=rank(card!);removeCards(s,i,[card!]);s.players[c.last].hand.push(card!);c.reveals=[{player:i,card:card!}];s.turn=c.last;s.extra.step='suitReply';record(s,'play',i,undefined,card);}
 else if(s.extra.step==='suitReply'){
  if(a.type==='accept')s.extra.step='suitReturn';else {const count=Math.min(5,s.stock.length);for(let j=0;j<count;j++)s.players[i].hand.push(s.stock.pop()!);record(s,'draw',i,count);turnorFinish(s);}
 }else if(s.extra.step==='suitReturn'){
  removeCards(s,i,[card!]);s.players[c.first].hand.push(card!);c.contract-=rank(card!);record(s,'exchange',i,undefined,card);
  if(!c.contract){c.countIndex=0;s.extra.step='suitBottom';}
 }else if(s.extra.step==='suitBottom'){
  if(a.type==='continue')turnorFinish(s);else {removeCards(s,i,[card!]);s.stock.unshift(card!);c.countIndex++;record(s,'discard',i,undefined,card);if(c.countIndex>=3)turnorFinish(s);}
 }else if(a.type==='discard'){removeCards(s,i,[card!]);s.stock.unshift(card!);record(s,'discard',i,undefined,card);}
 else {
  if(!s.players[i].hand.length||suitBalanced(s.players[i].hand)){s.players[i].score=1;finish(s,[i]);return;}
  s.turn=nextSeat(s,i);c.first=s.turn;c.last=nextSeat(s,s.turn,1);s.extra.step='suitOffer';if(!s.players[s.turn].hand.length){s.players[s.turn].score=1;finish(s,[s.turn]);return;}
 }
 worldCycle(s,2000,()=>finish(s,s.players.map((_,j)=>j),'draw'));
}
function cpu(v:ClubView):Action|undefined{
 const hand=v.players[v.self].hand;
 if(v.extra.step==='suitOffer')return [...v.actions].sort((a,b)=>hand.filter(c=>suit(c)===suit(b.cards![0])).length-hand.filter(c=>suit(c)===suit(a.cards![0])).length||rank(b.cards![0])-rank(a.cards![0]))[0];
 if(v.extra.step==='suitReply'){const offered=v.extra.classic!.reveals[0]?.card;return !canReturn(hand.filter(card=>card!==offered),v.extra.classic!.contract)&&v.stock>0?v.actions.find(a=>a.type==='draw'):v.actions.find(a=>a.type==='accept')||v.actions[0];}
 if(v.extra.step==='suitReturn')return [...v.actions].sort((a,b)=>rank(a.cards![0])-rank(b.cards![0]))[0];
 if(v.extra.step==='suitFinish'&&suitBalanced(hand))return v.actions.find(a=>a.type==='continue');
 if(v.extra.step==='suitBottom'||v.extra.step==='suitFinish')return v.actions.find(a=>a.type==='discard')||v.actions[0];
 return v.actions[0];
}
export const suitmatchRules:RuleExtension={start,actions,apply,cpu};
