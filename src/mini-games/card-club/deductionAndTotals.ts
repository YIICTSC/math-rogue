import { high,rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record } from './ruleHelpers';
import { fixedDeals,initClassic,resetClassicDeck } from './classicCommon';
function guessStart(s:ClubState){const c=initClassic(s);resetClassicDeck(s);c.hidden[0]=[s.stock.pop()!];dealCards(s,6);s.turn=1-s.dealer;s.extra.step='guessTurn';}
function guessActions(s:ClubState):Action[]{return Array.from({length:13},(_,i)=>i+1).flatMap(value=>[...s.extra.classic!.shown[0].includes(value)?[]:[{type:'ask' as const,value}],{type:'name' as const,value}]);}
function guessApply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,value=a.value!;
 if(a.type==='ask'){const other=1-i,has=s.players[other].hand.some(card=>rank(card)===value);c.shown[0].push(value);c.notes.push({player:other,label:has?'answerYes':'answerNo',points:value});record(s,has?'answerYes':'answerNo',other,value);s.turn=other;return;}
 const correct=rank(c.hidden[0][0])===value,winner=correct?i:1-i;s.players[winner].score=1;c.reveals.push({player:i,card:c.hidden[0][0]});finish(s,[winner]);
}
function guessCpu(v:ClubView):Action|undefined{
 const own=v.players[v.self].hand.map(rank),c=v.extra.classic!;
 const known=c.notes.filter(n=>n.player!==v.self&&n.label==='answerYes').map(n=>n.points),possible=Array.from({length:13},(_,i)=>i+1).filter(r=>!own.includes(r)&&!known.includes(r));
 const certain=c.notes.find(n=>n.player!==v.self&&n.label==='answerNo'&&possible.includes(n.points));
 if(certain||possible.length===1)return v.actions.find(a=>a.type==='name'&&a.value===(certain?.points??possible[0]));
 return v.actions.find(a=>a.type==='ask'&&possible.includes(a.value!))||v.actions.find(a=>a.type==='name'&&a.value===possible[0]);
}
export const guessRules:RuleExtension={start:guessStart,actions:guessActions,apply:guessApply,cpu:guessCpu};
function dogStart(s:ClubState){initClassic(s);s.pool=s.players[0].bags;s.players[0].bags=0;s.players.forEach(p=>p.score--);s.pool+=s.players.length;dealCards(s,5);s.turn=nextSeat(s,s.dealer);s.extra.step='dogBet';}
function dogActions(s:ClubState):Action[]{return Array.from({length:Math.min(10,s.pool)},(_,i)=>({type:'bid',value:i+1}));}
export function dogProof(hand:number[],card:number){return hand.filter(c=>suit(c)===suit(card)&&high(c)>high(card)).sort((a,b)=>high(a)-high(b))[0];}
function dogApply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,card=s.stock.pop()!,proof=dogProof(s.players[i].hand,card),stake=a.value!;s.discard.push(card);s.extra.indicator=card;c.reveals=[{player:i,card},...proof===undefined?[]:[{player:i,card:proof}]];
 const won=proof!==undefined;s.players[i].score+=won?stake:-stake;s.pool+=won?-stake:stake;record(s,'reveal',i,stake,card);record(s,'points',i,won?stake:-stake);
 if(!s.pool){s.players.forEach(p=>p.score--);s.pool=s.players.length;}
 c.passes++;if(c.passes>=s.players.length){s.players[0].bags=s.pool;fixedDeals(s,2);}else s.turn=nextSeat(s);
}
function dogCpu(v:ClubView){const hand=v.players[v.self].hand,chance=Array.from({length:52},(_,i)=>i).filter(card=>!hand.includes(card)&&dogProof(hand,card)!==undefined).length/47;return v.actions[chance>.58?v.actions.length-1:0];}
export const redDogRules:RuleExtension={start:dogStart,actions:dogActions,apply:dogApply,cpu:dogCpu};
