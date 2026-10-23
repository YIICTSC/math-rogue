import { combinations,rank,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';

export function isMeld(cards:number[]){
  if(cards.length<3||new Set(cards).size!==cards.length)return false;
  if(cards.length<=4&&cards.every(c=>rank(c)===rank(cards[0])))return true;
  const ordered=[...cards].sort((a,b)=>rank(a)-rank(b));
  return ordered.every((c,i)=>suit(c)===suit(ordered[0])&&(i===0||rank(c)===rank(ordered[i-1])+1));
}
export function meldOptions(hand:number[]){
  const out:number[][]=[];
  for(let r=1;r<=13;r++){const cards=hand.filter(c=>rank(c)===r);for(let k=3;k<=cards.length;k++)out.push(...combinations(cards,k));}
  for(let st=0;st<4;st++){
    const cards=hand.filter(c=>suit(c)===st).sort((a,b)=>rank(a)-rank(b));
    for(let i=0;i<cards.length;i++)for(let j=i+2;j<cards.length;j++){const run=cards.slice(i,j+1);if(!isMeld(run))break;out.push(run);}
  }
  return out;
}
const deadwood=(cards:number[])=>cards.reduce((v,c)=>v+Math.min(rank(c),10),0);
function start(s:ClubState){dealCards(s,s.players.length===2?10:s.players.length<=4?7:4);s.discard.push(s.stock.pop()!);s.extra.indicator=s.discard.at(-1)!;s.extra.step='draw';s.turn=nextSeat(s,s.dealer);}
function actions(s:ClubState):Action[]{
  const e=s.extra,p=s.players[s.turn];
  if(e.step==='draw')return [...s.stock.length||s.discard.length?[{type:'draw' as const}]:[],...s.discard.length?[{type:'draw' as const,target:1}]:[]];
  return [...meldOptions(p.hand).map(cards=>({type:'meld' as const,cards})),...e.melds.flatMap((m,index)=>p.hand.filter(c=>isMeld([...m.cards,c])).map(c=>({type:'layoff' as const,cards:[c],index}))),...p.hand.map(c=>({type:'discard' as const,cards:[c]}))];
}
function apply(s:ClubState,a:Action){
  const e=s.extra,p=s.players[s.turn],i=s.turn;
  if(a.type==='draw'){
    if(a.target===1)p.hand.push(s.discard.pop()!);
    else {if(!s.stock.length){s.stock=[...s.discard].reverse();s.discard=[];}p.hand.push(s.stock.pop()!);}
    p.hand=sorted(p.hand);e.indicator=s.discard.at(-1)??-1;e.step='meld';e.openedBeforeTurn=e.opened[i];record(s,'draw',i);return;
  }
  removeCards(s,i,a.cards!);
  if(a.type==='meld'){e.melds.push({owner:i,cards:a.cards!});e.opened[i]=true;record(s,'meld',i,a.cards!.length);}
  else if(a.type==='layoff'){e.melds[a.index!].cards.push(...a.cards!);e.opened[i]=true;record(s,'layoff',i,undefined,a.cards![0]);}
  else {s.discard.push(a.cards![0]);e.indicator=a.cards![0];e.iterations++;record(s,'discard',i,undefined,a.cards![0]);}
  if(!p.hand.length){
    const amount=s.players.reduce((v,q,j)=>v+(j!==i?deadwood(q.hand):0),0)*(e.openedBeforeTurn?1:2);p.score+=amount;record(s,'goingOut',i,amount);
    if(s.round+1>=s.players.length*2)finish(s);else roundOver(s);return;
  }
  if(a.type==='discard'){
    e.step='draw';s.turn=nextSeat(s);
    const key=`${s.turn}:${s.stock.join(',')}:${s.discard.join(',')}:${s.players.map(q=>q.hand.join(',')).join('|')}:${e.melds.map(m=>m.cards.join(',')).join('|')}`;
    // A table limit is explicit in the rules: a blocked deal scores nothing.
    if(e.seen.includes(key)||e.iterations>=500){record(s,'blocked');if(s.round+1>=s.players.length*2)finish(s);else roundOver(s);return;}
    e.seen.push(key);
  }
}
function usefulness(c:number,hand:number[]){
  const same=hand.filter(x=>x!==c&&rank(x)===rank(c)).length;
  const near=hand.filter(x=>x!==c&&suit(x)===suit(c)&&Math.abs(rank(x)-rank(c))<=2).length;
  return same*5+near*3;
}
function cpu(v:ClubView):Action|undefined{
  const a=v.actions,e=v.extra,hand=v.players[v.self].hand;if(!a.length)return;
  if(e.step==='draw'){
    const top=e.indicator;
    const helps=top>=0&&(meldOptions([...hand,top]).some(m=>m.includes(top))||e.melds.some(m=>isMeld([...m.cards,top]))||usefulness(top,[...hand,top])>=5);
    return a.find(x=>helps?x.target===1:x.target===undefined)||a[0];
  }
  const melds=a.filter(x=>x.type==='meld'||x.type==='layoff');
  if(melds.length)return melds.sort((x,y)=>y.cards!.length-x.cards!.length)[0];
  return [...a].sort((x,y)=>{
    const c=x.cards![0],d=y.cards![0];return usefulness(c,hand)-usefulness(d,hand)||Math.min(rank(d),10)-Math.min(rank(c),10);
  })[0];
}
export const rummyRules:RuleExtension={start,actions,apply,cpu};
