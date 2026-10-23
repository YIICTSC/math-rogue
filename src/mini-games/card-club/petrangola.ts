import { combinations,rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
const order=(card:number)=>rank(card)>=11?rank(card)-3:rank(card);
export function petrangolaScore(cards:number[]){
 const rs=cards.map(rank),ranks=cards.map(order).sort((a,b)=>a-b),same=rs.every(r=>r===rs[0]);if(same&&rs[0]===1)return 400;
 const suited=cards.every(c=>suit(c)===suit(cards[0]));
 if(suited){if(ranks[0]===1&&ranks[1]===9&&ranks[2]===10)return 311;if(ranks[1]===ranks[0]+1&&ranks[2]===ranks[1]+1)return 300+ranks[2];}
 if(same)return 211-ranks[0];
 return Math.max(...[0,1,2,3].map(st=>cards.filter(card=>suit(card)===st).reduce((sum,c)=>sum+(rank(c)===1?11:Math.min(10,rank(c))),0)));
}
function start(s:ClubState){const c=initClassic(s);resetClassicDeck(s);s.direction=-1;s.players.forEach(p=>{if(!s.round)p.lives=3;p.out=p.lives<=0;p.score=p.lives;});if(s.players[s.dealer].out)s.dealer=nextSeat(s,s.dealer);dealCards(s,3);s.table=s.stock.splice(-3);s.turn=s.dealer;s.extra.step='petrDealer';c.nextDealer=nextSeat(s,s.dealer);}
function actions(s:ClubState):Action[]{
 if(s.extra.step==='petrDealer')return [{type:'swap'},{type:'pass'}];const hand=s.players[s.turn].hand;
 return [{type:'pass'},...[1,2,3].flatMap(n=>combinations(hand,n).flatMap(cards=>combinations([0,1,2],n).map(indexes=>({type:'swap' as const,cards,index:indexes.reduce((mask,j)=>mask|1<<j,0)}))))];
}
function score(s:ClubState){
 const c=s.extra.classic!,alive=s.players.flatMap((p,i)=>p.out?[]:[i]),points=alive.map(i=>petrangolaScore(s.players[i].hand)),worst=Math.min(...points);
 alive.forEach((i,j)=>{c.notes.push({player:i,label:'petrangolaValue',points:points[j]});if(points[j]===worst)s.players[i].lives--;s.players[i].out=s.players[i].lives<=0;s.players[i].score=s.players[i].lives;});
 const survivors=alive.filter(i=>!s.players[i].out);if(survivors.length<=1)finish(s,survivors.length?survivors:alive,survivors.length?'survivor':'draw');else {c.nextDealer=nextSeat(s,s.dealer);roundOver(s);}
}
function knock(s:ClubState){const c=s.extra.classic!;if(c.closedBy<0){c.closedBy=s.turn;c.remaining=s.players.flatMap((p,i)=>!p.out&&i!==s.turn?[i]:[]);record(s,'knock',s.turn);}}
function next(s:ClubState){const c=s.extra.classic!;if(c.closedBy>=0){c.remaining=c.remaining.filter(i=>i!==s.turn);if(!c.remaining.length){score(s);return;}}s.turn=nextSeat(s);s.extra.step='petrTurn';}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,p=s.players[s.turn];
 if(s.extra.step==='petrDealer'){if(a.type==='swap'){[p.hand,s.table]=[s.table,p.hand];knock(s);}s.turn=nextSeat(s,s.dealer);s.extra.step='petrTurn';return;}
 if(a.type==='pass')knock(s);else {const indexes=[0,1,2].filter(i=>a.index!&(1<<i));a.cards!.forEach((card,j)=>{const at=p.hand.indexOf(card);[p.hand[at],s.table[indexes[j]]]=[s.table[indexes[j]],card];});record(s,'swap',s.turn,a.cards!.length);if(a.cards!.length===3)knock(s);}
 next(s);
}
function cpu(v:ClubView):Action|undefined{
 if(v.extra.step==='petrDealer')return v.actions.find(a=>a.type===(petrangolaScore(v.table)>=20?'swap':'pass'));
 const hand=v.players[v.self].hand;let best=v.actions[0],value=petrangolaScore(hand);
 for(const a of v.actions)if(a.type==='swap'){const indexes=[0,1,2].filter(i=>a.index!&(1<<i)),next=hand.map(card=>a.cards!.includes(card)?v.table[indexes[a.cards!.indexOf(card)]]:card),points=petrangolaScore(next);if(points>value){value=points;best=a;}}
 return best;
}
export const petrangolaRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.extra.classic!.nextDealer};
