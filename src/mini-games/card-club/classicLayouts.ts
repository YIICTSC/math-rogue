import { rank,shuffled,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck,recycleStock } from './classicCommon';
export const golfValue=(card:number)=>rank(card)===13?0:rank(card)===2?-2:Math.min(rank(card),10);
export function golfScore(cards:number[]){let points=0;for(let col=0;col<3;col++)if(rank(cards[col])!==rank(cards[col+3]))points+=golfValue(cards[col])+golfValue(cards[col+3]);return points;}
function golfStart(s:ClubState){const c=initClassic(s);dealCards(s,6);s.players.forEach((p,i)=>{c.rows[i]=p.hand;p.hand=[];});s.discard=[s.stock.pop()!];s.extra.indicator=s.discard[0];s.extra.step='golfReveal';s.turn=nextSeat(s,s.dealer);}
function golfActions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,i=s.turn;
 if(e.step==='golfReveal')return c.rows[i].flatMap((_,index)=>c.shown[i].includes(index)?[]:[{type:'pick' as const,index}]);
 if(e.step==='golfDraw')return [...s.stock.length||s.discard.length>1?[{type:'draw' as const}]:[],...s.discard.length?[{type:'draw' as const,target:1}]:[]];
 return [...c.rows[i].map((_,index)=>({type:'swap' as const,index})),...!c.drawnFromDiscard?[{type:'discard' as const,cards:[s.players[i].hand[0]]}]:[]];
}
function golfEnd(s:ClubState){s.players.forEach((p,i)=>p.score-=golfScore(s.extra.classic!.rows[i]));if(s.round>=8)finish(s);else roundOver(s);}
function golfApply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn,p=s.players[i];
 if(a.type==='pick'){
  c.shown[i].push(a.index!);if(c.shown[i].length===2){s.turn=nextSeat(s);if(c.shown.every(row=>row.length===2)){e.step='golfDraw';s.turn=nextSeat(s,s.dealer);}}return;
 }
 if(a.type==='draw'){recycleStock(s);p.hand=[a.target===1?s.discard.pop()!:s.stock.pop()!];c.drawnFromDiscard=a.target===1;e.indicator=s.discard.at(-1)??-1;e.step='golfSwap';return;}
 const draw=p.hand.pop()!;
 if(a.type==='swap'){const index=a.index!,old=c.rows[i][index];c.rows[i][index]=draw;s.discard.push(old);if(!c.shown[i].includes(index))c.shown[i].push(index);record(s,'swap',i,index,draw);}
 else s.discard.push(draw);
 e.indicator=s.discard.at(-1)!;e.iterations++;
 if(c.shown[i].length===6||e.iterations>=200){golfEnd(s);return;}
 s.turn=nextSeat(s);e.step='golfDraw';
}
function golfCpu(v:ClubView):Action|undefined{
 const e=v.extra,c=e.classic!,row=c.rows[v.self];
 if(e.step==='golfReveal')return v.actions[0];
 const unknown=row.findIndex(card=>card<0),worst=row.reduce((best,card,i)=>card>=0&&(row[best]<0||golfValue(card)>golfValue(row[best]))?i:best,0);
 if(e.step==='golfDraw'){
  const top=e.indicator,help=top>=0&&(unknown>=0?golfValue(top)<=3:golfValue(top)<golfValue(row[worst]));return v.actions.find(a=>help?a.target===1:a.target===undefined)||v.actions[0];
 }
 return v.actions.find(a=>a.type==='swap'&&a.index===(unknown>=0?unknown:worst))||v.actions[0];
}
export const golfRules:RuleExtension={start:golfStart,actions:golfActions,apply:golfApply,cpu:golfCpu};
const swimValue=(c:number)=>rank(c)===1?11:Math.min(rank(c),10);
export function swimScore(cards:number[]){
 if(cards.every(c=>rank(c)===rank(cards[0])))return {points:rank(cards[0])===1?32:30.5,tie:100+(rank(cards[0])===1?14:rank(cards[0]))};
 const bySuit=[0,1,2,3].map(st=>({points:cards.filter(c=>suit(c)===st).reduce((n,c)=>n+swimValue(c),0),tie:[3,0,1,2][st]}));return bySuit.sort((a,b)=>b.points-a.points||b.tie-a.tie)[0];
}
function swimStart(s:ClubState){
 const c=initClassic(s);resetClassicDeck(s);s.players.forEach(p=>{if(s.round===0)p.lives=4;p.out=p.lives<=0;p.score=p.lives;});
 dealCards(s,3);s.table=s.stock.splice(-3);if(s.players[s.dealer].out)s.dealer=nextSeat(s,s.dealer);s.turn=s.dealer;s.extra.step='swimDealer';c.first=nextSeat(s,s.dealer);swimSpecial(s);
}
function swimActions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!;
 if(e.step==='swimDealer')return [{type:'swap'},{type:'pass'}];
 if(e.step==='swimClose')return [{type:'close'},{type:'continue'}];
 return [...s.players[s.turn].hand.flatMap(card=>s.table.map((_,index)=>({type:'swap' as const,cards:[card],index}))),{type:'pass'}];
}
function swimEnd(s:ClubState){
 const c=s.extra.classic!,alive=s.players.flatMap((p,i)=>p.out?[]:[i]),scores=s.players.map(p=>swimScore(p.hand));
 const fire=alive.find(i=>scores[i].points===32),worst=[...alive].sort((i,j)=>scores[i].points-scores[j].points||scores[i].tie-scores[j].tie)[0];
 for(const i of alive){c.notes.push({player:i,label:'swimScore',points:scores[i].points});const loses=fire!==undefined?i!==fire:scores[i].points===scores[worst].points&&scores[i].tie===scores[worst].tie;if(loses)s.players[i].lives--;s.players[i].out=s.players[i].lives<=0;s.players[i].score=s.players[i].lives;}
 const survivors=alive.filter(i=>!s.players[i].out);if(survivors.length<=1){finish(s,survivors.length?survivors:alive,'survivor');return;}
 c.nextDealer=nextSeat(s,s.dealer);roundOver(s);
}
function swimSpecial(s:ClubState){if(s.players.some(p=>!p.out&&swimScore(p.hand).points>=31)){swimEnd(s);return true;}return false;}
function swimNext(s:ClubState){
 const c=s.extra.classic!;if(c.closedBy>=0){c.remaining=c.remaining.filter(i=>i!==s.turn);if(!c.remaining.length){swimEnd(s);return;}}
 s.turn=nextSeat(s);s.extra.step='swimTurn';
}
function swimApply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,p=s.players[s.turn];
 if(e.step==='swimDealer'){if(a.type==='swap')[p.hand,s.table]=[s.table,p.hand];e.step='swimTurn';s.turn=c.first;swimSpecial(s);return;}
 if(e.step==='swimClose'){
  if(a.type==='close'){c.closedBy=s.turn;c.remaining=s.players.flatMap((p,i)=>!p.out&&i!==s.turn?[i]:[]);record(s,'close',s.turn);}
  swimNext(s);return;
 }
 if(a.type==='swap'){const card=a.cards![0],at=p.hand.indexOf(card);[p.hand[at],s.table[a.index!]]=[s.table[a.index!],card];p.hand=sorted(p.hand);c.passes=0;record(s,'swap',s.turn,undefined,card);}
 else c.passes++;
 e.iterations++;
 if(swimSpecial(s))return;
 if(c.passes>=s.players.filter(p=>!p.out).length){
  s.discard.push(...s.table);s.table=[];if(s.stock.length<3){s.stock=shuffled([...s.stock,...s.discard],s.seed+s.revision);s.discard=[];}s.table=s.stock.splice(-3);c.passes=0;
 }
 if(e.iterations>=200){swimEnd(s);return;}
 if(c.closedBy>=0)swimNext(s);else e.step='swimClose';
}
function swimCpu(v:ClubView):Action|undefined{
 const e=v.extra,hand=v.players[v.self].hand,score=swimScore(hand).points;
 if(e.step==='swimDealer')return v.actions.find(a=>a.type===(score<18?'swap':'pass'));
 if(e.step==='swimClose')return v.actions.find(a=>a.type===(score>=25||e.iterations>=16?'close':'continue'));
 let best=v.actions.find(a=>a.type==='pass')!,bestScore=score;
 for(const a of v.actions)if(a.type==='swap'){const next=hand.map(card=>card===a.cards![0]?v.table[a.index!]:card),n=swimScore(next).points;if(n>bestScore){best=a;bestScore=n;}}
 return best;
}
export const swimRules:RuleExtension={start:swimStart,actions:swimActions,apply:swimApply,cpu:swimCpu,nextDealer:s=>s.extra.classic!.nextDealer};
