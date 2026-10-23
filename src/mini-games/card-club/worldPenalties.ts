import { combinations,high,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck,fixedDeals } from './classicCommon';
export const worldPenalty=(game:string,card:number)=>suit(card)===2?1:card===50?13:game==='blackmaria'&&card===39?7:game==='blackmaria'&&card===51?10:0;
function start(s:ClubState){
 initClassic(s);resetClassicDeck(s);const count=s.game==='blacklady'?[0,0,0,16,12,10,8,7][s.players.length]:s.stock.length/s.players.length;dealCards(s,count);
 if(s.stock.length){s.extra.board=s.stock;s.stock=[];s.extra.visible=Array.from({length:s.extra.board.length===3?2:Math.floor(s.extra.board.length/2)},(_,i)=>i);}
 s.extra.step='worldPass';s.extra.classic!.contract=s.game==='blacklady'?2:3;s.turn=nextSeat(s,s.dealer);
}
function actions(s:ClubState):Action[]{
 if(s.extra.step==='worldPass')return combinations(s.players[s.turn].hand,s.extra.classic!.contract).map(cards=>({type:'exchange',cards}));
 const hand=s.players[s.turn].hand,follow=s.trick.length?hand.filter(card=>suit(card)===suit(s.trick[0].card)):hand;
 return (follow.length?follow:hand).map(card=>({type:'play',cards:[card]}));
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn,n=s.players.length;
 if(e.step==='worldPass'){
  e.selections[i]=a.cards!;s.turn=(i+1)%n;
  if(e.selections.every(cs=>cs.length===c.contract)){
   e.selections.forEach((cards,j)=>removeCards(s,j,cards));e.selections.forEach((cards,j)=>s.players[(j+n-1)%n].hand.push(...cards));e.selections=e.selections.map(()=>[]);
   if(s.game==='blacklady'&&c.contract===2)c.contract=1;else e.step='play';s.turn=nextSeat(s,s.dealer);
  }return;
 }
 const card=a.cards![0];removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<n){s.turn=nextSeat(s);return;}
 const winner=s.trick.filter(t=>suit(t.card)===suit(s.trick[0].card)).reduce((a,b)=>high(a.card)>high(b.card)?a:b).player;
 s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;record(s,'trick',winner);
 if(s.players.every(p=>!p.hand.length)){
  s.players[winner].taken.push(...e.board);e.board=[];e.visible=[];
  const penalties=s.players.map(p=>p.taken.reduce((sum,card)=>sum+worldPenalty(s.game,card),0));e.points=penalties;s.players.forEach((p,j)=>p.score-=penalties[j]);
  if(s.game==='blacklady'){
   const clear=penalties.flatMap((points,j)=>!points?[j]:[]),pool=26+s.players[0].bags,share=clear.length?Math.floor(pool/clear.length):0;
   clear.forEach(j=>s.players[j].score+=share);s.players[0].bags=pool-share*clear.length;fixedDeals(s,2);
  }else if(s.players.some(p=>p.score<=-100))finish(s);else roundOver(s);
 }
}
function cpu(v:ClubView):Action|undefined{
 const risk=(card:number)=>worldPenalty(v.game,card)*3+high(card)+(suit(card)===3&&high(card)>=12?20:0);
 if(v.extra.step==='worldPass')return [...v.actions].sort((a,b)=>b.cards!.reduce((sum,c)=>sum+risk(c),0)-a.cards!.reduce((sum,c)=>sum+risk(c),0))[0];
 if(!v.trick.length)return [...v.actions].sort((a,b)=>risk(a.cards![0])-risk(b.cards![0]))[0];
 const lead=suit(v.trick[0].card),highest=Math.max(...v.trick.filter(t=>suit(t.card)===lead).map(t=>high(t.card))),loses=v.actions.filter(a=>suit(a.cards![0])!==lead||high(a.cards![0])<highest);
 return [...(loses.length?loses:v.actions)].sort((a,b)=>risk(b.cards![0])-risk(a.cards![0]))[0];
}
export const worldPenaltyRules:RuleExtension={start,actions,apply,cpu};
