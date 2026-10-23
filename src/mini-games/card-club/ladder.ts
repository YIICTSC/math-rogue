import { combinations, rank, suit } from './cards';
import type { Action, ClubState } from './model';
export type LadderState={count:number;form:'set'|'run';rank:number;last:number;passes:number;reversed:boolean;order:number[]};
const r=(c:number)=>c===52?100:rank(c)===1?14:rank(c)===2?15:rank(c);
const strength=(value:number,count:number,form:'set'|'run',reversed:boolean)=>value===100?100:form==='set'?(reversed?18-value:value):(reversed?18-value:value+count-1);
const physical=(st:number,value:number)=>st*13+(value===14?1:value===15?2:value)-1;
export function ladderActions(s:ClubState):Action[]{
 const hand=s.players[s.turn].hand,ladder=s.ladder!,actions:Action[]=[],hasJoker=hand.includes(52);
 const add=(cards:number[],form:'set'|'run',value:number)=>{
  if(ladder.count&&(cards.length!==ladder.count||form!==ladder.form||strength(value,cards.length,form,ladder.reversed)<=strength(ladder.rank,ladder.count,ladder.form,ladder.reversed)))return;
  const action:Action={type:'play',cards,form,value};actions.push(action);if(cards.length===4&&form==='set')actions.push({...action,revolution:true});
 };
 for(const c of hand)add([c],'set',r(c));
 for(let value=3;value<=15;value++){
  const group=hand.filter(c=>c!==52&&r(c)===value);
  for(let n=2;n<=Math.min(5,group.length+(hasJoker?1:0));n++){
   for(const cs of combinations(group,n))add(cs,'set',value);
   if(hasJoker)for(const cs of combinations(group,n-1))add([...cs,52],'set',value);
  }
 }
 for(let st=0;st<4;st++)for(let n=3;n<=13;n++)for(let start=3;start+n-1<=15;start++){
  const run=Array.from({length:n},(_,i)=>physical(st,start+i)),missing=run.filter(c=>!hand.includes(c));
  if(!missing.length)add(run,'run',start);
  if(hasJoker&&missing.length<=1){const omissions=missing.length?missing:run;for(const omit of omissions)add([...run.filter(c=>c!==omit),52],'run',start);}
 }
 if(ladder.count)actions.push({type:'pass'});return actions;
}
export function playLadder(s:ClubState,action:Action){
 const p=s.players[s.turn],ladder=s.ladder!,player=s.turn;
 const next=(from:number)=>{for(let k=1;k<=s.players.length;k++){const i=(from+k)%s.players.length;if(!s.players[i].out)return i;}return from;};
 if(action.type==='pass'){
  ladder.passes++;const required=s.players.filter(p=>!p.out).length-(s.players[ladder.last].out?0:1);
  if(ladder.passes>=required){s.discard.push(...s.table);s.table=[];ladder.count=0;ladder.passes=0;s.turn=s.players[ladder.last].out?next(ladder.last):ladder.last;}else s.turn=next(player);
 }else{
  p.hand=p.hand.filter(c=>!action.cards!.includes(c));s.discard.push(...s.table);s.table=[...action.cards!];ladder.count=action.cards!.length;ladder.form=action.form!;ladder.rank=action.value!;ladder.last=player;ladder.passes=0;
  if(action.revolution)ladder.reversed=!ladder.reversed;
  if(!p.hand.length){p.out=true;ladder.order.push(player);}
  if(s.players.filter(p=>!p.out).length<=1){const last=s.players.findIndex(p=>!p.out);if(last>=0)ladder.order.push(last);ladder.order.forEach((i,place)=>s.players[i].score=s.players.length-place-1);s.phase='result';s.winners=[ladder.order[0]];s.resultReason='empty';}
  else s.turn=next(player);
 }
}
