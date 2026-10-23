import { high,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
import { worldWinner } from './worldTricks';
import { worldCycle } from './worldShedding';
function start(s:ClubState){initClassic(s);resetClassicDeck(s);dealCards(s,8);s.turn=nextSeat(s,s.dealer);}
function actions(s:ClubState):Action[]{const hand=s.players[s.turn].hand,follow=s.trick.length?hand.filter(card=>suit(card)===suit(s.trick[0].card)):hand;return follow.length?follow.map(card=>({type:'play',cards:[card]})):[{type:'take'}];}
function apply(s:ClubState,a:Action){
 const i=s.turn;
 if(a.type==='take'){s.players[i].hand.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];record(s,'take',i);worldCycle(s,2000);return;}
 const card=a.cards![0];removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(!s.players[i].hand.length){s.players[i].score=1;finish(s,[i]);return;}
 if(s.trick.length===s.players.length){const winner=worldWinner(s.trick,-1);s.discard.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];s.turn=winner;}else s.turn=nextSeat(s);
 worldCycle(s,2000);
}
function cpu(v:ClubView):Action|undefined{return [...v.actions].sort((a,b)=>a.type==='play'&&b.type==='play'?high(b.cards![0])-high(a.cards![0]):0)[0];}
export const rollingRules:RuleExtension={start,actions,apply,cpu};
