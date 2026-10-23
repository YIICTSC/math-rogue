import { combinations,high,rank,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { addTeam,dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';
import { fixedDeals,initClassic } from './classicCommon';
export function worldWinner(trick:{player:number;card:number}[],trump:number){const lead=suit(trick[0].card),weight=(card:number)=>(suit(card)===trump?40:suit(card)===lead?20:0)+high(card);return trick.reduce((a,b)=>weight(a.card)>weight(b.card)?a:b).player;}
export function callBridgePlayable(hand:number[],trick:{card:number}[]){
 if(!trick.length)return hand;
 const lead=suit(trick[0].card),follow=hand.filter(card=>suit(card)===lead);if(follow.length)return follow;
 if(lead===3)return hand;
 const trumps=hand.filter(card=>suit(card)===3),onTable=trick.filter(t=>suit(t.card)===3);
 if(!onTable.length)return trumps.length?trumps:hand;
 const best=Math.max(...onTable.map(t=>high(t.card))),beats=trumps.filter(card=>high(card)>best);return beats.length?beats:hand;
}
function start(s:ClubState){
 const c=initClassic(s),n=s.players.length;
 if(s.game==='hokm'){
  s.direction=-1;c.caller=nextSeat(s,s.dealer);c.nextDealer=s.dealer;s.turn=c.caller;s.extra.step='hokmTrump';
  // Only Hâkem receives cards before the declaration; partner must not know a hand yet.
  s.players[c.caller].hand=s.stock.splice(-5);return;
 }
 if(s.game==='callbridge'){s.direction=-1;dealCards(s,13);s.turn=nextSeat(s,s.dealer);s.trump=3;s.extra.step='callBid';return;}
 dealCards(s,16);s.turn=s.dealer;s.extra.step='sergentTrump';
 if(s.round>0){
  const plus=s.players.flatMap((p,i)=>p.bags>0?[i]:[]).sort((a,b)=>s.players[b].lives-s.players[a].lives),minus=s.players.flatMap((p,i)=>p.bags<0?[i]:[]);
  if(plus.length===1)for(const to of minus)c.remaining.push(plus[0],to,-s.players[to].bags);
  else for(const from of plus)if(minus.length)c.remaining.push(from,minus[0],s.players[from].bags);
  if(c.remaining.length){s.turn=c.remaining[0];s.extra.step='sergentExchange';}
 }
}
function actions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,hand=s.players[s.turn].hand;
 if(e.step==='hokmTrump'||e.step==='sergentTrump')return [0,1,2,3].map(suit=>({type:'trump',suit}));
 if(e.step==='callBid')return Array.from({length:11},(_,k)=>({type:'bid',value:k+2}));
 if(e.step==='sergentExchange')return hand.map(card=>({type:'exchange',cards:[card],target:c.remaining[1]}));
 if(e.step==='sergentDiscard')return combinations(hand,4).map(cards=>({type:'discard',cards}));
 const follow=s.trick.length?hand.filter(card=>suit(card)===suit(s.trick[0].card)):hand,allowed=s.game==='callbridge'?callBridgePlayable(hand,s.trick):follow.length?follow:hand;
 return allowed.map(card=>({type:'play',cards:[card]}));
}
function hokmEnd(s:ClubState,team:number){
 const c=s.extra.classic!,other=s.players.filter((_,i)=>i%2!==team).reduce((sum,p)=>sum+p.tricks,0),points=other?1:team===c.caller%2?2:3;
 addTeam(s,team,points);c.nextDealer=team===c.caller%2?s.dealer:nextSeat(s,s.dealer);c.notes.push({player:team,label:'gamePoints',points});
 if(s.players[team].score>=7)finish(s);else roundOver(s);
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn;
 if(e.step==='hokmTrump'){
  s.trump=a.suit!;for(let k=0;k<4;k++){const seat=(c.caller-k+4)%4,needed=13-s.players[seat].hand.length;s.players[seat].hand=sorted([...s.players[seat].hand,...s.stock.splice(-needed)]);}e.step='play';s.turn=c.caller;return;
 }
 if(e.step==='callBid'){
  s.players[i].bid=a.value!;s.turn=nextSeat(s);if(s.players.every(p=>p.bid!==null)){e.step='play';s.turn=nextSeat(s,s.dealer);}return;
 }
 if(e.step==='sergentExchange'){
  const [from,to]=c.remaining,card=a.cards![0],strong=s.players[to].hand.filter(c=>suit(c)===suit(card)).sort((a,b)=>high(b)-high(a))[0];
  if(strong!==undefined&&high(strong)>high(card)){
   removeCards(s,from,[card]);removeCards(s,to,[strong]);s.players[from].hand.push(strong);s.players[to].hand.push(card);c.notices.push({to:from,from:to,card:strong});
  }
  if(--c.remaining[2]===0)c.remaining.splice(0,3);
  if(c.remaining.length)s.turn=c.remaining[0];else {e.step='sergentTrump';s.turn=s.dealer;}return;
 }
 if(e.step==='sergentTrump'){s.trump=a.suit!;e.step='sergentDiscard';return;}
 if(e.step==='sergentDiscard'){
  removeCards(s,i,a.cards!);s.discard.push(...a.cards!);const kitty=[...s.stock];s.players[i].hand=sorted([...s.players[i].hand,...kitty]);s.stock=[];
  for(const previous of c.notices.filter(n=>n.from===s.dealer))for(const card of kitty)if(suit(card)===suit(previous.card)&&high(card)>high(previous.card))c.notices.push({to:previous.to,from:s.dealer,card});
  e.step='play';s.turn=nextSeat(s,s.dealer);return;
 }
 const card=a.cards![0];removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<s.players.length){s.turn=nextSeat(s);return;}
 const winner=worldWinner(s.trick,s.trump);s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;c.trickNo++;record(s,'trick',winner);
 if(s.game==='hokm'){
  const total=s.players.filter((_,j)=>j%2===winner%2).reduce((sum,p)=>sum+p.tricks,0);if(total>=7)hokmEnd(s,winner%2);return;
 }
 if(s.players.every(p=>!p.hand.length)){
  if(s.game==='callbridge'){
   s.players.forEach(p=>{const bid=p.bid!,success=p.tricks===bid||p.tricks===bid+1;p.score+=success?bid>=8?13:bid:-bid;});fixedDeals(s,2);
  }else{
   s.players.forEach((p,j)=>{const target=j===s.dealer?8:j===nextSeat(s,s.dealer)?5:3;p.bags=p.tricks-target;p.lives=target;p.score+=p.bags;});
   const sweep=s.players.findIndex(p=>p.tricks>=12);if(sweep>=0)finish(s,[sweep]);else if(s.round>=8)finish(s);else roundOver(s);
  }
 }
}
function cpu(v:ClubView):Action|undefined{
 const e=v.extra,hand=v.players[v.self].hand,estimate=(st:number)=>hand.reduce((sum,card)=>sum+(suit(card)===st?high(card):0),0);
 if(e.step==='hokmTrump'||e.step==='sergentTrump'){const suit=[0,1,2,3].sort((a,b)=>estimate(b)-estimate(a))[0];return {type:'trump',suit};}
 if(e.step==='callBid'){
  const wanted=Math.max(2,Math.min(12,Math.round(hand.reduce((sum,card)=>sum+(suit(card)===3?.65:0)+(high(card)>=12?.5:0),0))));return v.actions.find(a=>a.value===wanted);
 }
 if(e.step==='sergentExchange')return [...v.actions].sort((a,b)=>high(a.cards![0])-high(b.cards![0]))[0];
 const cost=(card:number)=>high(card)+(suit(card)===v.trump?20:0);
 if(e.step==='sergentDiscard'){const weak=[...hand].sort((a,b)=>cost(a)-cost(b)).slice(0,4);return v.actions.find(a=>a.cards?.every(card=>weak.includes(card)));}
 if(!v.trick.length)return [...v.actions].sort((a,b)=>cost(b.cards![0])-cost(a.cards![0]))[0];
 const winner=worldWinner(v.trick,v.trump),ally=v.game==='hokm'&&winner%2===v.self%2,wins=v.actions.filter(a=>worldWinner([...v.trick,{player:v.self,card:a.cards![0]}],v.trump)===v.self),want=v.game!=='callbridge'||v.players[v.self].tricks<v.players[v.self].bid!;
 return [...(!ally&&want&&wins.length?wins:v.actions)].sort((a,b)=>cost(a.cards![0])-cost(b.cards![0]))[0];
}
export const worldTrickRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.game==='hokm'?s.extra.classic!.nextDealer:(s.dealer+(s.game==='callbridge'?-1:1)+s.players.length)%s.players.length};
