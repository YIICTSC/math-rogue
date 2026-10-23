import { high,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,nextSeat,record } from './ruleHelpers';
import { fixedDeals,initClassic } from './classicCommon';
export const speculationStrength=(card:number)=>(high(card)-2)*4+suit(card);
function done(s:ClubState){const c=s.extra.classic!;if(s.table[0]!==39&&s.players.some((p,i)=>i!==c.caller&&p.hand.length))return false;s.players[c.caller].score+=s.pool;record(s,'points',c.caller,s.pool);s.pool=0;fixedDeals(s,2);return true;}
function resume(s:ClubState){if(done(s))return;s.turn=s.extra.classic!.last;s.extra.step='specTurn';}
function start(s:ClubState){
 const c=initClassic(s);s.players.forEach((p,i)=>{if(!s.round)p.score=30;const ante=i===s.dealer?2:1;p.score-=ante;s.pool+=ante;});dealCards(s,3);s.table=[s.stock.pop()!];s.extra.indicator=s.table[0];c.caller=s.dealer;c.revealed=true;c.reveals=[{player:s.dealer,card:s.table[0]}];c.last=nextSeat(s,s.dealer);s.turn=s.dealer;s.extra.step='specOffer';done(s);
}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,i=s.turn,hand=s.players[i].hand;
 if(s.extra.step==='specOffer')return [{type:'stand'},...[1,2,3].map(value=>({type:'bid' as const,value}))];
 if(s.extra.step==='specAuction')return [{type:'pass'},...Array.from({length:Math.max(0,Math.floor(s.players[i].score)-Math.max(c.banned,c.contract+1)+1)},(_,j)=>({type:'bid' as const,value:Math.max(c.banned,c.contract+1)+j}))];
 return [...i!==c.caller&&!c.go[i]&&hand.length?[{type:'reveal' as const}]:[],...hand.length&&c.countIndex===0?[1,2,3].map(value=>({type:'bid' as const,value})):[],...c.go[i]||i===c.caller||!hand.length?[{type:'continue' as const}]:[]];
}
function auctionNext(s:ClubState){
 const c=s.extra.classic!,others=c.remaining.filter(i=>i!==c.partner);
 if(!others.length){
  if(c.partner>=0){s.players[c.partner].score-=c.contract;s.players[c.attacker].score+=c.contract;if(c.defender){s.players[c.partner].hand.push(s.players[c.attacker].hand.pop()!);}else c.caller=c.partner;record(s,'exchange',c.partner,c.contract);}
  resume(s);return;
 }
 for(let k=1;k<=s.players.length;k++){const i=(s.turn+k)%s.players.length;if(others.includes(i)){s.turn=i;break;}}
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn;
 if(s.extra.step==='specAuction'){
  if(a.type==='pass')c.remaining=c.remaining.filter(j=>j!==i);else {c.contract=a.value!;c.partner=i;record(s,'bid',i,a.value);}
  auctionNext(s);return;
 }
 if(a.type==='bid'){
  const blind=s.extra.step==='specTurn';if(blind)c.countIndex=1;
  c.attacker=blind?i:c.caller;c.defender=blind?1:0;c.banned=a.value!;c.contract=0;c.partner=-1;c.remaining=s.players.flatMap((_,j)=>j===c.attacker?[]:[j]);s.turn=c.attacker;s.extra.step='specAuction';auctionNext(s);return;
 }
 if(s.extra.step==='specOffer'){resume(s);return;}
 if(a.type==='reveal'){
  const card=s.players[i].hand.pop()!;c.go[i]=true;c.reveals.push({player:i,card});record(s,'reveal',i,undefined,card);
  if(speculationStrength(card)>speculationStrength(s.table[0])){s.discard.push(...s.table);s.table=[card];s.extra.indicator=card;c.caller=i;c.last=i;s.extra.step='specOffer';done(s);}else s.discard.push(card);
  return;
 }
 if(done(s))return;
 s.turn=nextSeat(s);c.go[s.turn]=false;c.countIndex=0;c.last=s.turn;s.extra.step='specTurn';
}
function cpu(v:ClubView):Action|undefined{
 const c=v.extra.classic!;
 if(v.extra.step==='specOffer')return v.actions.find(a=>a.type==='bid'&&a.value===1)||v.actions[0];
 if(v.extra.step==='specAuction'){
  const max=c.defender?1:Math.max(1,Math.floor(v.pool*(speculationStrength(v.table[0])+1)/52*.55));return v.actions.find(a=>a.type==='bid'&&a.value!<=max)||v.actions[0];
 }
 return v.actions.find(a=>a.type==='reveal')||v.actions.find(a=>a.type==='continue')||v.actions[0];
}
export const speculationRules:RuleExtension={start,actions,apply,cpu};
