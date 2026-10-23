import { high,shuffled,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic } from './classicCommon';
import { worldWinner } from './worldTricks';
/** Repetition keys stay on the authority; snapshots never expose the deck/hands. */
export function worldCycle(s:ClubState,limit:number,onLimit=()=>finish(s,s.players.map((_,i)=>i),'repetition')){
 const e=s.extra,c=e.classic!,key=JSON.stringify([s.turn,e.step,s.stock,s.discard,s.table,s.trick,c.trickNo===0,s.players.map(p=>[p.hand,p.out]),c.rows,c.hidden,c.remaining,c.closedBy,c.banned,s.direction]);
 e.iterations++;if(e.seen.filter(p=>p===key).length>=2||e.iterations>=limit){onLimit();return true;}e.seen.push(key);return false;
}
function begin(s:ClubState,leader:number){s.turn=leader;s.extra.classic!.remaining=Array.from({length:s.players.length},(_,k)=>(leader+k)%s.players.length).filter(i=>!s.players[i].out);}
function start(s:ClubState){
 const c=initClassic(s);
 if(s.game==='cangkul'){dealCards(s,7);begin(s,nextSeat(s,s.dealer));}
 else {dealCards(s,Math.ceil(52/s.players.length));c.first=s.players.findIndex(p=>p.hand.includes(39));begin(s,c.first);}
}
function actions(s:ClubState):Action[]{
 const hand=s.players[s.turn].hand,c=s.extra.classic!;
 if(s.game==='getaway'&&c.trickNo===0&&!s.trick.length)return [{type:'play',cards:[39]}];
 const follow=s.trick.length?hand.filter(card=>suit(card)===suit(s.trick[0].card)):hand;
 if(follow.length)return follow.map(card=>({type:'play',cards:[card]}));
 if(s.game==='getaway')return hand.map(card=>({type:'play',cards:[card]}));
 return [{type:s.stock.length?'draw':'pass'}];
}
function resolveCangkul(s:ClubState){
 const c=s.extra.classic!,winner=worldWinner(s.trick,-1),passes=c.owners;
 const cards=s.trick.map(t=>t.card);if(passes.length)cards.forEach((card,j)=>s.players[passes[j%passes.length]].hand.push(card));else s.discard.push(...cards);
 s.lastTrick=s.trick;s.trick=[];c.owners=[];begin(s,winner);record(s,'trick',winner);
}
function resolveGetaway(s:ClubState,offSuit:boolean){
 const c=s.extra.classic!,winner=worldWinner(s.trick,-1),first=c.trickNo===0;
 s.lastTrick=s.trick;const cards=s.trick.map(t=>t.card);s.trick=[];c.trickNo++;
 if(offSuit&&!first)s.players[winner].hand.push(...cards);
 else{
  // An empty-handed trick winner must draw from discards predating this trick.
  if(!s.players[winner].hand.length){s.discard=shuffled(s.discard,s.seed+s.revision);if(s.discard.length)s.players[winner].hand.push(s.discard.pop()!);}
  s.discard.push(...cards);
 }
 s.players.forEach(p=>p.out=!p.hand.length);const alive=s.players.flatMap((p,j)=>!p.out?[j]:[]);
 if(alive.length<=1){s.players.forEach(p=>p.score=p.out?1:0);finish(s,alive.length?s.players.flatMap((p,j)=>p.out?[j]:[]):s.players.map((_,j)=>j),alive.length?'getaway':'draw');return;}
 begin(s,first?c.first:s.players[winner].out?nextSeat(s,winner):winner);record(s,offSuit?'take':'trick',winner,offSuit?cards.length:undefined);
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn;
 if(a.type==='draw'){
  const lead=suit(s.trick[0].card);let card:number;
  do{card=s.stock.pop()!;s.players[i].hand.push(card);}while(s.stock.length&&suit(card)!==lead);
  record(s,'draw',i);
  if(suit(card)===lead){removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);c.remaining.shift();}
  else {worldCycle(s,2000);return;}
 }else if(a.type==='pass'){c.owners.push(i);c.remaining.shift();record(s,'pass',i);}
 else{
  const card=a.cards![0],off=s.trick.length>0&&suit(card)!==suit(s.trick[0].card);removeCards(s,i,[card]);s.trick.push({player:i,card});c.remaining.shift();record(s,'play',i,undefined,card);
  if(s.game==='cangkul'&&!s.players[i].hand.length){s.players[i].score=1;finish(s,[i]);return;}
  if(s.game==='getaway'&&c.trickNo>0&&off){
   // Two-seat last-card lead is a proved loss, even though its holder would pick up.
   const leader=s.trick[0].player;
   if(s.players.filter(p=>!p.out).length===2&&!s.players[leader].hand.length){s.players.forEach((p,j)=>p.score=j===leader?0:1);finish(s,s.players.flatMap((_,j)=>j===leader?[]:[j]),'getaway');return;}
   resolveGetaway(s,true);if(s.phase!=='result')worldCycle(s,5000);return;
  }
 }
 if(!c.remaining.length){if(s.game==='cangkul')resolveCangkul(s);else resolveGetaway(s,false);}
 else s.turn=c.remaining[0];
 if(s.phase!=='result')worldCycle(s,s.game==='cangkul'?2000:5000);
}
function cpu(v:ClubView):Action|undefined{
 if(v.actions[0].type!=='play')return v.actions[0];
 if(v.game==='cangkul')return [...v.actions].sort((a,b)=>high(b.cards![0])-high(a.cards![0]))[0];
 const lead=v.trick.length?suit(v.trick[0].card):-1,off=v.actions.filter(a=>suit(a.cards![0])!==lead);
 return [...(v.trick.length&&off.length?off:v.actions)].sort((a,b)=>v.trick.length?high(b.cards![0])-high(a.cards![0]):high(a.cards![0])-high(b.cards![0]))[0];
}
export const worldSheddingRules:RuleExtension={start,actions,apply,cpu};
