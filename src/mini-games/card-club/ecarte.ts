import { combinations,rank,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
export const ecarteStrength=(card:number)=>[0,5,0,0,0,0,0,1,2,3,4,6,7,8][rank(card)];
function point(s:ClubState,who:number,points:number){s.players[who].score+=points;s.extra.classic!.notes.push({player:who,label:'gamePoints',points});if(s.players[who].score>=5){finish(s,[who]);return true;}return false;}
function start(s:ClubState){initClassic(s);resetClassicDeck(s);dealCards(s,5);const up=s.stock.pop()!;s.extra.board=[up];s.extra.visible=[0];s.extra.indicator=up;s.trump=suit(up);s.turn=1-s.dealer;s.extra.step='ecarteOffer';if(rank(up)===13)point(s,s.dealer,1);}
function king(s:ClubState){const c=s.extra.classic!,p=s.players[s.turn];return !c.go[s.turn]&&!s.trick.some(t=>t.player===s.turn)&&p.tricks===0&&c.trickNo===0&&p.hand.includes(s.trump*13+12);}
function actions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,hand=s.players[s.turn].hand;
 const announce:Action[]=king(s)?[{type:'reveal',cards:[s.trump*13+12]}]:[];
 if(e.step==='ecarteOffer'||e.step==='ecarteReply')return [...announce,{type:'accept'},{type:'stand'}];
 if(e.step==='ecarteDiscard'){
  const available=s.stock.length-(s.turn===s.dealer?c.bids[1-s.dealer]:0),max=Math.min(5,available);
  return [...announce,...Array.from({length:max},(_,i)=>i+1).flatMap(n=>combinations(hand,n).map(cards=>({type:'exchange' as const,cards}))),...s.turn===s.dealer?[{type:'pass' as const}]:[]];
 }
 if(!s.trick.length)return [...announce,...hand.map(card=>({type:'play' as const,cards:[card]}))];
 const lead=s.trick[0].card,follow=hand.filter(card=>suit(card)===suit(lead)),strong=follow.filter(card=>ecarteStrength(card)>ecarteStrength(lead));
 const allowed=strong.length?strong:follow.length?follow:hand.some(card=>suit(card)===s.trump)?hand.filter(card=>suit(card)===s.trump):hand;
 return [...announce,...allowed.map(card=>({type:'play' as const,cards:[card]}))];
}
function ready(s:ClubState,refuser:number){if(s.extra.classic!.contract===0)s.extra.classic!.closedBy=refuser;s.extra.step='play';s.turn=1-s.dealer;}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn;
 if(a.type==='reveal'){c.go[i]=true;c.reveals.push({player:i,card:a.cards![0]});record(s,'king',i,1,a.cards![0]);point(s,i,1);return;}
 if(e.step==='ecarteOffer'){if(a.type==='stand'){ready(s,i);return;}e.step='ecarteReply';s.turn=s.dealer;return;}
 if(e.step==='ecarteReply'){if(a.type==='stand'){ready(s,i);return;}e.step='ecarteDiscard';s.turn=1-s.dealer;c.bids.fill(0);return;}
 if(e.step==='ecarteDiscard'){
  const cards=a.cards||[];c.bids[i]=cards.length;removeCards(s,i,cards);s.discard.push(...cards);record(s,'exchange',i,cards.length);
  if(i!==s.dealer){s.turn=s.dealer;return;}
  for(const seat of [1-s.dealer,s.dealer])for(let n=0;n<c.bids[seat];n++)s.players[seat].hand.push(s.stock.pop()!);
  c.contract++;s.turn=1-s.dealer;e.step=s.stock.length?'ecarteOffer':'play';return;
 }
 const card=a.cards![0];removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length===1){s.turn=1-i;return;}
 const [lead,follow]=s.trick,beats=suit(follow.card)===suit(lead.card)?ecarteStrength(follow.card)>ecarteStrength(lead.card):suit(follow.card)===s.trump,winner=beats?follow.player:lead.player;
 s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;c.trickNo++;
 if(c.trickNo===5){const best=s.players[0].tricks>=3?0:1,points=s.players[best].tricks===5||c.contract===0&&c.closedBy!==best?2:1;if(!point(s,best,points))roundOver(s);}
}
function cpu(v:ClubView):Action|undefined{
 const reveal=v.actions.find(a=>a.type==='reveal');if(reveal)return reveal;
 const hand=v.players[v.self].hand,cost=(card:number)=>ecarteStrength(card)+(suit(card)===v.trump?7:0);
 if(['ecarteOffer','ecarteReply'].includes(v.extra.step))return v.actions.find(a=>a.type===(hand.filter(card=>cost(card)>=7).length>=3?'stand':'accept'));
 if(v.extra.step==='ecarteDiscard'){
  const weak=hand.filter(card=>cost(card)<7).sort((a,b)=>cost(a)-cost(b));return [...v.actions].filter(a=>a.type==='exchange'&&a.cards!.every(card=>weak.includes(card))).sort((a,b)=>b.cards!.length-a.cards!.length)[0]||v.actions.find(a=>a.type==='pass')||v.actions[0];
 }
 const plays=v.actions.filter(a=>a.type==='play');if(!v.trick.length)return [...plays].sort((a,b)=>cost(b.cards![0])-cost(a.cards![0]))[0];
 return [...plays].sort((a,b)=>cost(a.cards![0])-cost(b.cards![0]))[0];
}
export const ecarteRules:RuleExtension={start,actions,apply,cpu};
