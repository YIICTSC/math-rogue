import { combinations,rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,award } from './classicCommon';
const value=(card:number)=>Math.min(rank(card),10);
export function cribHand(cards:number[],starter:number,crib=false){
 const all=[...cards,starter],out={fifteens:0,pairs:0,runs:0,flush:0,nobs:0,total:0};
 for(let mask=1;mask<1<<5;mask++){const cs=all.filter((_,i)=>mask&(1<<i));if(cs.reduce((n,c)=>n+value(c),0)===15)out.fifteens+=2;}
 for(const pair of combinations(all,2))if(rank(pair[0])===rank(pair[1]))out.pairs+=2;
 for(let size=5;size>=3;size--){for(const cs of combinations(all,size)){const ranks=cs.map(rank).sort((a,b)=>a-b);if(ranks.every((r,i)=>!i||r===ranks[i-1]+1))out.runs+=size;}if(out.runs)break;}
 if(cards.every(card=>suit(card)===suit(cards[0]))){if(suit(starter)===suit(cards[0]))out.flush=5;else if(!crib)out.flush=4;}
 out.nobs=cards.some(c=>rank(c)===11&&suit(c)===suit(starter))?1:0;out.total=out.fifteens+out.pairs+out.runs+out.flush+out.nobs;return out;
}
export function cribPeg(cards:number[],total:number){
 let points=total===15||total===31?2:0;
 let same=1;for(let i=cards.length-2;i>=0&&rank(cards[i])===rank(cards.at(-1)!);i--)same++;
 points+=same===2?2:same===3?6:same===4?12:0;
 for(let length=cards.length;length>=3;length--){const tail=cards.slice(-length).map(rank).sort((a,b)=>a-b);if(tail.every((r,i)=>!i||r===tail[i-1]+1)){points+=length;break;}}
 return points;
}
function add(s:ClubState,who:number,points:number,label:string){if(points)award(s,who,points,label);if(s.players[who].score>=121){finish(s,[who]);return true;}return false;}
function start(s:ClubState){initClassic(s);dealCards(s,6);s.turn=1-s.dealer;s.extra.step='cribDiscard';}
function actions(s:ClubState):Action[]{
 const e=s.extra,p=s.players[s.turn];
 if(e.step==='cribDiscard')return combinations(p.hand,2).map(cards=>({type:'discard',cards}));
 if(e.step==='cribCount')return [{type:'continue'}];
 const plays=p.hand.filter(card=>s.total+value(card)<=31).map(card=>({type:'play' as const,cards:[card]}));return plays.length?plays:[{type:'pass'}];
}
function bank(s:ClubState){const c=s.extra.classic!;s.table.forEach((card,i)=>c.rows[c.owners[i]].push(card));s.table=[];c.owners=[];s.total=0;c.go.fill(false);}
function endPeg(s:ClubState){s.extra.step='cribCount';s.extra.classic!.countIndex=0;s.turn=1-s.dealer;}
function finishRun(s:ClubState,thirtyone:boolean){
 const c=s.extra.classic!,last=c.last;
 if(!thirtyone&&last>=0&&add(s,last,1,'lastCard'))return;
 bank(s);
 if(s.players.every(p=>!p.hand.length)){endPeg(s);return;}
 s.turn=1-last;if(!s.players[s.turn].hand.length)s.turn=last;
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn,p=s.players[i];
 if(e.step==='cribDiscard'){
  removeCards(s,i,a.cards!);c.crib.push(...a.cards!);record(s,'crib',i,2);
  if(c.crib.length===4){const starter=s.stock.pop()!;e.board=[starter];e.visible=[0];e.indicator=starter;if(rank(starter)===11&&add(s,s.dealer,2,'heels'))return;e.step='cribPeg';s.turn=1-s.dealer;}
  else s.turn=1-i;return;
 }
 if(e.step==='cribCount'){
  const seat=c.countIndex===0?1-s.dealer:s.dealer,hand=c.countIndex===2?c.crib:c.rows[seat],score=cribHand(hand,e.indicator,c.countIndex===2);
  for(const label of ['fifteens','pairs','runs','flush','nobs'] as const)if(add(s,seat,score[label],label))return;
  c.countIndex++;if(c.countIndex===3)roundOver(s);else s.turn=s.dealer;return;
 }
 if(a.type==='pass'){
  c.go[i]=true;record(s,'go',i);
  const other=1-i,can=s.players[other].hand.some(card=>s.total+value(card)<=31);
  if(can)s.turn=other;else finishRun(s,false);return;
 }
 const card=a.cards![0];removeCards(s,i,[card]);s.table.push(card);c.owners.push(i);s.total+=value(card);c.last=i;record(s,'total',i,s.total,card);
 if(add(s,i,cribPeg(s.table,s.total),'pegging'))return;
 if(s.total===31){finishRun(s,true);return;}
 if(s.players.every(p=>!p.hand.length)){finishRun(s,false);return;}
 const other=1-i;s.turn=!c.go[other]&&s.players[other].hand.length?other:i;
 if(!s.players[s.turn].hand.some(card=>s.total+value(card)<=31)&&!s.players[1-s.turn].hand.some(card=>s.total+value(card)<=31))finishRun(s,false);
}
function cpu(v:ClubView):Action|undefined{
 const e=v.extra,hand=v.players[v.self].hand;
 if(e.step==='cribDiscard'){
  // Expected hand score over all unseen starters, using only the actor's own cards.
  const starters=Array.from({length:52},(_,i)=>i).filter(card=>!hand.includes(card));
  const estimate=(a:Action)=>{const kept=hand.filter(card=>!a.cards!.includes(card));return starters.reduce((n,card)=>n+cribHand(kept,card).total,0)/starters.length+(rank(a.cards![0])===rank(a.cards![1])?2:0)*(v.self===v.dealer?1:-1);};
  return [...v.actions].sort((a,b)=>estimate(b)-estimate(a))[0];
 }
 if(e.step==='cribCount')return v.actions[0];
 return [...v.actions].sort((a,b)=>{
  if(a.type!=='play'||b.type!=='play')return 0;
  const score=(x:Action)=>cribPeg([...v.table,x.cards![0]],v.total+value(x.cards![0]))*20-([5,10,21].includes(v.total+value(x.cards![0]))?8:0)-value(x.cards![0])*.1;
  return score(b)-score(a);
 })[0];
}
export const cribbageRules:RuleExtension={start,actions,apply,cpu};
