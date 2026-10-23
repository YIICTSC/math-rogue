import { blackjackValue,rank } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { finish,nextSeat,record,roundOver } from './ruleHelpers';
import { initClassic,award } from './classicCommon';
const natural=(cards:number[])=>cards.length===2&&blackjackValue(cards)===21;
function card(s:ClubState,i:number){const draw=s.stock.pop()!;s.players[i].hand.push(draw);s.extra.classic!.deckHistory.push(draw);}
function start(s:ClubState){const c=initClassic(s);for(let k=1;k<=s.players.length;k++)card(s,(s.dealer+k)%s.players.length);s.turn=nextSeat(s,s.dealer);s.extra.step='pontoonBet';c.first=s.turn;}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,p=s.players[s.turn],score=blackjackValue(p.hand);
 if(s.extra.step==='pontoonBet')return [1,2,3].map(value=>({type:'bid',value}));
 if(s.extra.step==='pontoonDealer')return [{type:score<17?'hit':'stand'}];
 return [...score>=16?[{type:'stand' as const}]:[],...score<21&&s.stock.length?[{type:'hit' as const},...!c.go[s.turn]?Array.from({length:p.stake-c.bids[s.turn]+1},(_,k)=>({type:'buy' as const,value:k+c.bids[s.turn]})):[]]:[]];
}
function settle(s:ClubState){
 const d=s.players[s.dealer],dv=blackjackValue(d.hand),dn=natural(d.hand);
 s.players.forEach((p,i)=>{if(i===s.dealer)return;const pv=blackjackValue(p.hand),pn=natural(p.hand),delta=dn||pv>21?-p.stake:pn?p.stake*2:dv>21||pv>dv?p.stake:-p.stake;award(s,i,delta,'pontoon');award(s,s.dealer,-delta,'pontoon');});
 if(s.round+1>=s.players.length*2)finish(s);else roundOver(s);
}
function advance(s:ClubState){s.turn=nextSeat(s);if(s.turn===s.dealer){s.extra.step='pontoonDealer';if(natural(s.players[s.dealer].hand))settle(s);}}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,p=s.players[i];
 if(s.extra.step==='pontoonBet'){
  p.stake=a.value!;c.bids[i]=p.stake;s.turn=(i+1)%s.players.length;
  if(s.turn===s.dealer){for(let k=1;k<=s.players.length;k++)card(s,(s.dealer+k)%s.players.length);s.players.forEach((p,j)=>{if(j!==s.dealer&&natural(p.hand)){p.out=true;c.shown[j]=[p.hand.findIndex(card=>rank(card)===1)];}});s.extra.step='pontoonPlay';s.turn=nextSeat(s,s.dealer);if(s.turn===s.dealer){s.extra.step='pontoonDealer';if(natural(s.players[s.dealer].hand))settle(s);}}return;
 }
 if(s.extra.step==='pontoonDealer'){
  if(a.type==='hit'){card(s,i);c.shown[i]=p.hand.map((_,j)=>j);if(blackjackValue(p.hand)>=17)settle(s);}else settle(s);return;
 }
 if(a.type==='stand'){p.out=true;record(s,'stand',i);advance(s);return;}
 if(a.type==='buy'){p.stake+=a.value!;c.bids[i]=a.value!;}else {c.go[i]=true;c.shown[i].push(p.hand.length);}
 card(s,i);record(s,a.type,i);
 const total=blackjackValue(p.hand);if(total>=21){p.out=true;if(total>21)c.shown[i]=p.hand.map((_,j)=>j);advance(s);}
}
function cpu(v:ClubView):Action|undefined{
 if(v.extra.step==='pontoonBet')return v.actions.find(a=>a.value===(rank(v.players[v.self].hand[0])===1?3:1));
 const value=blackjackValue(v.players[v.self].hand);return v.actions.find(a=>a.type===(value<17?'hit':'stand'))||v.actions[0];
}
export const pontoonRules:RuleExtension={start,actions,apply,cpu,
 nextDealer:s=>Math.floor(s.round/2)%s.players.length,
 nextStock:s=>{
  const nextDealer=Math.floor((s.round+1)/2)%s.players.length;
  if(nextDealer!==s.dealer||s.players.some((p,i)=>i!==s.dealer&&natural(p.hand)))return undefined;
  return [...s.extra.classic!.deckHistory].reverse().concat(s.stock);
 },
};
