import { rank } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,roundOver } from './ruleHelpers';
import { initClassic } from './classicCommon';
function start(s:ClubState){const c=initClassic(s);s.players.forEach(p=>{if(s.round===0)p.lives=3;p.out=p.lives<=0;p.score=p.lives;});if(s.players[s.dealer].out)s.dealer=nextSeat(s,s.dealer);dealCards(s,1);s.turn=nextSeat(s,s.dealer);c.nextDealer=s.dealer;}
function actions():Action[]{return [{type:'stand'},{type:'swap'}];}
function apply(s:ClubState,a:Action){
 const i=s.turn,c=s.extra.classic!;
 if(a.type==='swap'){
  const p=s.players[i];if(i===s.dealer){c.reveals.push({player:i,card:p.hand[0]});const old=p.hand[0];p.hand[0]=s.stock.pop()!;s.discard.push(old);}
  else {const other=nextSeat(s,i),q=s.players[other];if(rank(q.hand[0])===13){c.reveals.push({player:other,card:q.hand[0]});record(s,'blocked',other);}else [p.hand,q.hand]=[q.hand,p.hand];}
 }
 c.passes++;record(s,a.type,i);
 if(i===s.dealer){
  const alive=s.players.flatMap((p,j)=>p.out?[]:[j]),min=Math.min(...alive.map(j=>rank(s.players[j].hand[0])));
  for(const j of alive)if(rank(s.players[j].hand[0])===min){s.players[j].lives--;s.players[j].score=s.players[j].lives;s.players[j].out=s.players[j].lives<=0;record(s,'life',j,s.players[j].lives);}
  const survivors=alive.filter(j=>!s.players[j].out);if(survivors.length<=1)finish(s,survivors.length?survivors:alive,survivors.length?'survivor':'draw');else {c.nextDealer=nextSeat(s,s.dealer);roundOver(s);}return;
 }
 s.turn=nextSeat(s);
}
function cpu(v:ClubView):Action|undefined{return {type:rank(v.players[v.self].hand[0])<=6?'swap':'stand'};}
export const cuckooRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.extra.classic!.nextDealer};
