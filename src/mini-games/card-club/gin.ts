import { rank,sorted } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { meldOptions,isMeld } from './rummy';
import { dealCards,finish,nextSeat,record,roundOver } from './ruleHelpers';
import { initClassic,award } from './classicCommon';
const value=(cards:number[])=>cards.reduce((n,c)=>n+Math.min(rank(c),10),0);
export interface GinHand {points:number;melds:number[][];loose:number[]}
const cache=new Map<string,GinHand>();
export function ginHand(cards:number[]):GinHand{
 const hand=[...cards].sort((a,b)=>a-b),key=hand.join(',');const cached=cache.get(key);if(cached)return cached;
 const options=meldOptions(hand),memo=new Map<number,GinHand>();
 const solve=(mask:number):GinHand=>{
  if(memo.has(mask))return memo.get(mask)!;
  const rest=hand.filter((_,i)=>!(mask&(1<<i)));let best:GinHand={points:value(rest),melds:[],loose:rest};
  for(const meld of options){const bits=meld.reduce((m,c)=>m|(1<<hand.indexOf(c)),0);if(mask&bits)continue;const after=solve(mask|bits);if(after.points<best.points)best={...after,melds:[meld,...after.melds]};}
  memo.set(mask,best);return best;
 };
 const result=solve(0);if(cache.size>5000)cache.clear();cache.set(key,result);return result;
}
/** Jointly choose defender melds and chained layoffs, rather than greedily losing a meld. */
export function ginDefense(cards:number[],targets:number[][]):number{
 const options=meldOptions(cards),seen=new Map<string,number>();
 const lay=(rest:number[],melds:number[][]):number=>{
  const key=rest.join(',')+'|'+melds.map(m=>[...m].sort((a,b)=>a-b).join(',')).join('/');if(seen.has(key))return seen.get(key)!;
  let best=value(rest);
  for(const c of rest)for(let i=0;i<melds.length;i++)if(isMeld([...melds[i],c])){const next=melds.map((m,j)=>j===i?[...m,c]:m);best=Math.min(best,lay(rest.filter(x=>x!==c),next));}
  seen.set(key,best);return best;
 };
 const visit=(rest:number[],at:number):number=>{
  let best=lay(rest,targets);
  for(let i=at;i<options.length;i++)if(options[i].every(c=>rest.includes(c)))best=Math.min(best,visit(rest.filter(c=>!options[i].includes(c)),i+1));
  return best;
 };
 return visit([...cards].sort((a,b)=>a-b),0);
}
function start(s:ClubState){initClassic(s);dealCards(s,10);s.discard=[s.stock.pop()!];s.extra.indicator=s.discard[0];s.turn=nextSeat(s,s.dealer);s.extra.step='ginOffer';}
function actions(s:ClubState):Action[]{
 const e=s.extra,p=s.players[s.turn];
 if(e.step==='ginOffer')return [{type:'draw',target:1},{type:'pass'}];
 if(e.step==='ginForce')return [{type:'draw'}];
 if(e.step==='ginDraw')return [{type:'draw'},...s.discard.length?[{type:'draw' as const,target:1}]:[]];
 return p.hand.filter(c=>!s.extra.classic!.drawnFromDiscard||c!==s.extra.classic!.banned).flatMap(c=>[{type:'discard' as const,cards:[c]},...ginHand(p.hand.filter(x=>x!==c)).points<=10?[{type:'knock' as const,cards:[c]}]:[]]);
}
function settle(s:ClubState,i:number){
 const c=s.extra.classic!,a=ginHand(s.players[i].hand),other=1-i,b=a.points?ginDefense(s.players[other].hand,a.melds):ginHand(s.players[other].hand).points;
 const winner=a.points===0||a.points<b?i:other,points=a.points===0?b+25:winner===i?b-a.points:a.points-b+25;
 award(s,winner,points,a.points===0?'gin':winner===i?'knock':'undercut');s.players[winner].bags++;c.nextDealer=1-winner;
 c.notes.push({player:i,label:'deadwood',points:a.points},{player:other,label:'deadwood',points:b});
 if(s.players[winner].score>=100){const shutout=s.players[1-winner].score===0;s.players.forEach((p,j)=>award(s,j,p.bags*25+(j===winner?100+(shutout?100:0):0),'bonus'));finish(s,[winner]);}
 else roundOver(s);
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn,p=s.players[i];
 if(a.type==='pass'){c.passes++;s.turn=1-i;e.step=c.passes===2?'ginForce':'ginOffer';return;}
 if(a.type==='draw'){p.hand=sorted([...p.hand,a.target===1?s.discard.pop()!:s.stock.pop()!]);c.drawnFromDiscard=a.target===1;c.banned=c.drawnFromDiscard?e.indicator:-1;e.step='ginDiscard';e.indicator=s.discard.at(-1)??-1;record(s,'draw',i);return;}
 const card=a.cards![0];p.hand=p.hand.filter(x=>x!==card);s.discard.push(card);e.indicator=card;record(s,'discard',i,undefined,card);
 if(a.type==='knock'){settle(s,i);return;}
 if(s.stock.length<=2){c.nextDealer=s.dealer;record(s,'blocked');roundOver(s);return;}
 s.turn=1-i;e.step='ginDraw';
}
function cpu(v:ClubView):Action|undefined{
 const hand=v.players[v.self].hand,e=v.extra;
 if(['ginDraw','ginOffer','ginForce'].includes(e.step)){
  const top=e.indicator,now=ginHand(hand).points;
  const use=top>=0&&[...hand,top].some(c=>ginHand([...hand,top].filter(x=>x!==c)).points<now);
  return v.actions.find(a=>use?a.target===1:e.step==='ginOffer'?a.type==='pass':a.target===undefined)||v.actions[0];
 }
 return [...v.actions].sort((a,b)=>ginHand(hand.filter(c=>c!==a.cards![0])).points-ginHand(hand.filter(c=>c!==b.cards![0])).points||Number(b.type==='knock')-Number(a.type==='knock')||rank(b.cards![0])-rank(a.cards![0]))[0];
}
export const ginRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.extra.classic!.nextDealer};
