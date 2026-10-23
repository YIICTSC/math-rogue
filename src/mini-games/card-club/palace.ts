import { combinations,high,rank,sorted } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic } from './classicCommon';
import { worldCycle } from './worldShedding';
export const palacePlayable=(card:number,top:number)=>top<0||rank(card)===2||rank(card)===10||rank(top)===2||high(card)>=high(top);
function start(s:ClubState){
 const c=initClassic(s);dealCards(s,9);s.players.forEach((p,i)=>{c.hidden[i]=p.hand.splice(0,3);c.rows[i]=p.hand.splice(0,3);});
 const clockwise=Array.from({length:s.players.length},(_,k)=>(s.dealer+k+1)%s.players.length);
 for(const r of [3,4,5,6,7,8,9,10,11,12,1,2]){const exposed=clockwise.find(i=>c.rows[i].some(card=>rank(card)===r)),held=clockwise.find(i=>s.players[i].hand.some(card=>rank(card)===r));if(exposed!==undefined||held!==undefined){c.first=exposed??held!;break;}}
 s.turn=nextSeat(s,s.dealer);s.extra.step='palaceSetup';
}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,p=s.players[s.turn],top=s.table.at(-1)??-1;
 if(s.extra.step==='palaceSetup')return [{type:'continue'},...p.hand.flatMap(card=>c.rows[s.turn].map((_,index)=>({type:'swap' as const,cards:[card],index})))];
 if(!p.hand.length&&!c.rows[s.turn].length)return c.hidden[s.turn].map((_,index)=>({type:'pick',index}));
 const source=p.hand.length?p.hand:c.rows[s.turn],plays:Action[]=[];
 for(const r of new Set(source.map(rank))){const group=source.filter(card=>rank(card)===r);if(!palacePlayable(group[0],top))continue;for(let n=1;n<=group.length;n++)plays.push(...combinations(group,n).map(cards=>({type:'play' as const,cards})));}
 return [...plays,...s.table.length?p.hand.length?[{type:'take' as const}]:c.rows[s.turn].map((card,index)=>({type:'take' as const,cards:[card],index})):[]];
}
function refill(s:ClubState,i:number){while(s.stock.length&&s.players[i].hand.length<3)s.players[i].hand.push(s.stock.pop()!);s.players[i].hand=sorted(s.players[i].hand);}
function advance(s:ClubState,again=false){
 const c=s.extra.classic!;s.players.forEach((p,i)=>p.out=!p.hand.length&&!c.rows[i].length&&!c.hidden[i].length);
 const alive=s.players.flatMap((p,i)=>p.out?[]:[i]);
 if(alive.length<=1){s.players.forEach(p=>p.score=p.out?1:0);finish(s,s.players.flatMap((p,i)=>p.out?[i]:[]),'palace');return;}
 if(!again||s.players[s.turn].out)s.turn=nextSeat(s);worldCycle(s,5000);
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,p=s.players[i];
 if(s.extra.step==='palaceSetup'){
  if(a.type==='swap'){const old=c.rows[i][a.index!];removeCards(s,i,a.cards!);p.hand.push(old);c.rows[i][a.index!]=a.cards![0];return;}
  c.go[i]=true;s.turn=nextSeat(s);if(c.go.every(Boolean)){s.extra.step='play';s.turn=c.first;}return;
 }
 if(a.type==='take'){
  p.hand.push(...s.table);s.table=[];if(a.cards){c.rows[i].splice(a.index!,1);p.hand.push(a.cards[0]);}refill(s,i);record(s,'take',i,p.hand.length);advance(s);return;
 }
 let cards:number[];
 if(a.type==='pick'){
  cards=c.hidden[i].splice(a.index!,1);record(s,'reveal',i,undefined,cards[0]);
  if(!palacePlayable(cards[0],s.table.at(-1)??-1)){p.hand.push(...s.table,...cards);s.table=[];refill(s,i);advance(s);return;}
 }else{
  cards=a.cards!;if(p.hand.length)removeCards(s,i,cards);else c.rows[i]=c.rows[i].filter(card=>!cards.includes(card));
 }
 s.table.push(...cards);record(s,'play',i,cards.length,cards[0]);refill(s,i);
 const top=rank(cards[0]),four=s.table.length>=4&&s.table.slice(-4).every(card=>rank(card)===top),burn=top===10||four;
 if(burn){s.discard.push(...s.table);s.table=[];record(s,'burn',i);}advance(s,burn);
}
function cpu(v:ClubView):Action|undefined{
 const c=v.extra.classic!,hand=v.players[v.self].hand,cost=(card:number)=>[2,10].includes(rank(card))?20:high(card);
 if(v.extra.step==='palaceSetup'){
  const improves=v.actions.filter(a=>a.type==='swap'&&cost(a.cards![0])>cost(c.rows[v.self][a.index!]));
  return improves.sort((a,b)=>(cost(b.cards![0])-cost(c.rows[v.self][b.index!]))-(cost(a.cards![0])-cost(c.rows[v.self][a.index!])))[0]||v.actions[0];
 }
 const plays=v.actions.filter(a=>a.type==='play');if(plays.length)return plays.sort((a,b)=>cost(a.cards![0])-cost(b.cards![0])||b.cards!.length-a.cards!.length)[0];
 if(!hand.length&&c.rows[v.self].length)return [...v.actions].sort((a,b)=>cost(a.cards![0])-cost(b.cards![0]))[0];return v.actions[0];
}
export const palaceRules:RuleExtension={start,actions,apply,cpu};
