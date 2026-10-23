import { rank,suit,sorted } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
export const marriageValue=(card:number)=>({1:11,10:10,13:4,12:3,11:2}[rank(card)]||0);
export const marriageStrength=(card:number)=>({1:6,10:5,13:4,12:3,11:2,9:1}[rank(card)]||0);
export function marriagePlayable(game:string,hand:number[],trick:{card:number}[],trump:number,strict:boolean){
 if(!trick.length||!strict)return hand;
 const lead=trick[0].card,follow=hand.filter(card=>suit(card)===suit(lead));
 if(game==='66')return follow.length?follow:hand;
 const beat=follow.filter(card=>marriageStrength(card)>marriageStrength(lead));
 return beat.length?beat:follow.length?follow:hand.some(card=>suit(card)===trump)?hand.filter(card=>suit(card)===trump):hand;
}
function start(s:ClubState){initClassic(s);resetClassicDeck(s);dealCards(s,s.game==='66'?6:5);const card=s.stock.pop()!;s.stock.unshift(card);s.extra.indicator=card;s.trump=suit(card);s.turn=1-s.dealer;}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,hand=s.players[s.turn].hand,leader=!s.trick.length,open=s.stock.length>0&&c.closedBy<0;
 const cards=marriagePlayable(s.game,hand,s.trick,s.trump,!open);
 const plays=cards.flatMap(card=>[{type:'play' as const,cards:[card]},...leader&&(s.game==='66'||open)&&[12,13].includes(rank(card))&&!c.shown[s.turn].includes(suit(card))&&hand.includes(suit(card)*13+(rank(card)===12?12:11))?[{type:'play' as const,cards:[card],double:true}]:[]]);
 const exchange=s.trump*13+(s.game==='66'?8:10);
 return [...plays,...leader&&open&&s.players[s.turn].tricks>0&&hand.includes(exchange)&&exchange!==s.extra.indicator?[{type:'swap' as const,cards:[exchange]}]:[],...leader&&open&&(s.game==='schnapsen'||s.players[s.turn].tricks>0)?[{type:'close' as const}]:[]];
}
function settle(s:ClubState,claimant:number){
 const c=s.extra.classic!,winner=s.extra.points[claimant]>=66?claimant:1-claimant,other=1-winner;
 let points:number;
 if(winner===claimant)points=(s.game==='66'?s.players[other].tricks===0:s.extra.points[other]===0)?3:s.extra.points[other]<33?2:1;
 else points=(s.game==='66'?s.players.some(p=>p.tricks===0):s.extra.points.some(p=>p===0))||s.game==='66'&&c.closedBy===claimant&&c.go[winner]?3:2;
 points+=s.players[0].bags;s.players[0].bags=0;s.players[winner].score+=points;c.notes.push({player:winner,label:'gamePoints',points});record(s,'points',winner,points);
 if(s.players[winner].score>=7)finish(s,[winner]);else roundOver(s);
}
function autoClaim(s:ClubState,i:number){if(s.extra.points[i]<66)return false;settle(s,i);return true;}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn;
 if(a.type==='swap'){
  const old=e.indicator;removeCards(s,i,a.cards!);s.players[i].hand=sorted([...s.players[i].hand,old]);s.stock[s.stock.indexOf(old)]=a.cards![0];e.indicator=a.cards![0];record(s,'swap',i,undefined,old);return;
 }
 if(a.type==='close'){c.closedBy=i;c.go[1-i]=s.players[1-i].tricks===0;e.indicator=-1;record(s,'close',i);return;}
 const card=a.cards![0];
 if(a.double){
  c.shown[i].push(suit(card));for(const rankOffset of [11,12])c.reveals.push({player:i,card:suit(card)*13+rankOffset});
  const points=suit(card)===s.trump?40:20;if(s.players[i].tricks===0)c.pendingMarriage[i]+=points;else e.points[i]+=points;const label=s.players[i].tricks===0?'pendingMarriage':'marriage';c.notes.push({player:i,label,points});record(s,label,i,points,card);if(autoClaim(s,i))return;
 }
 removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length===1){s.turn=1-i;return;}
 const weight=(card:number)=>(suit(card)===s.trump?20:suit(card)===suit(s.trick[0].card)?10:0)+marriageStrength(card);
 const winner=weight(s.trick[0].card)>weight(s.trick[1].card)?s.trick[0].player:s.trick[1].player;
 s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;if(c.pendingMarriage[winner]){e.points[winner]+=c.pendingMarriage[winner];c.notes.forEach(note=>{if(note.player===winner&&note.label==='pendingMarriage')note.label='marriage';});record(s,'marriage',winner,c.pendingMarriage[winner]);c.pendingMarriage[winner]=0;}e.points[winner]+=s.trick.reduce((sum,t)=>sum+marriageValue(t.card),0);s.lastTrick=s.trick;s.trick=[];s.turn=winner;record(s,'trick',winner);
 if(c.closedBy<0&&s.stock.length){s.players[winner].hand.push(s.stock.pop()!);s.players[1-winner].hand.push(s.stock.pop()!);e.indicator=s.stock.length?e.indicator:-1;}
 if(s.players.every(p=>!p.hand.length)){
  if(c.closedBy<0)e.points[winner]+=10;
  if(autoClaim(s,winner))return;
  if(c.closedBy>=0){settle(s,c.closedBy);return;}
  if(s.game==='schnapsen'&&Math.max(...e.points)>=66&&e.points[0]!==e.points[1]){settle(s,e.points[0]>e.points[1]?0:1);return;}
  if(s.game==='66'||e.points[0]>=66)s.players[0].bags++;roundOver(s);return;
 }
 autoClaim(s,winner);
}
function cpu(v:ClubView):Action|undefined{
 const hand=v.players[v.self].hand,marriage=v.actions.filter(a=>a.double);
 if(marriage.length)return marriage[0];const exchange=v.actions.find(a=>a.type==='swap');if(exchange)return exchange;
 const plays=v.actions.filter(a=>a.type==='play'),weight=(card:number)=>(suit(card)===v.trump?20:0)+marriageStrength(card);
 if(!v.trick.length){
  const strong=hand.filter(card=>suit(card)===v.trump||marriageStrength(card)>=5).length;
  if(v.extra.points[v.self]>=50&&strong>=hand.length-1&&v.actions.some(a=>a.type==='close'))return {type:'close'};
  return [...plays].sort((a,b)=>weight(b.cards![0])-weight(a.cards![0]))[0];
 }
 const lead=v.trick[0].card,beats=(card:number)=>suit(card)===suit(lead)?marriageStrength(card)>marriageStrength(lead):suit(card)===v.trump;
 const wins=plays.filter(a=>beats(a.cards![0]));return [...(wins.length?wins:plays)].sort((a,b)=>weight(a.cards![0])-weight(b.cards![0]))[0];
}
export const marriageRules:RuleExtension={start,actions,apply,cpu};
