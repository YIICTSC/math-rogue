import { rank,shuffled,suit } from './cards';
import type { Action,ClubState } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';

const pitypat:RuleExtension={
  start:s=>{dealCards(s,5);s.table.push(s.stock.pop()!);s.turn=nextSeat(s,s.dealer);},
  actions:s=>{
    const hand=s.players[s.turn].hand;
    if(s.extra.step==='discard')return hand.map(c=>({type:'play',cards:[c]}));
    const plays=hand.filter(c=>rank(c)===rank(s.table.at(-1)!)).map(c=>({type:'play' as const,cards:[c]}));
    return [...plays,...s.extra.step==='revealed'?[{type:'pass' as const}]:[{type:'reveal' as const}]];
  },
  apply:(s,a)=>{
    const e=s.extra,i=s.turn,p=s.players[i];
    if(a.type==='reveal'){
      if(!s.stock.length){const top=s.table.pop()!;s.stock=shuffled(s.table,s.seed+s.revision);s.table=[top];}
      if(s.stock.length)s.table.push(s.stock.pop()!);e.step='revealed';record(s,'reveal',i,undefined,s.table.at(-1));
      if(!p.hand.some(c=>rank(c)===rank(s.table.at(-1)!))){s.turn=nextSeat(s);e.step='play';}return;
    }
    if(a.type==='pass'){s.turn=nextSeat(s);e.step='play';return;}
    removeCards(s,i,a.cards!);s.table.push(...a.cards!);record(s,'play',i,undefined,a.cards![0]);
    const paired=p.hand.length%2===0&&[...new Set(p.hand.map(rank))].every(r=>p.hand.filter(c=>rank(c)===r).length%2===0);
    if(!p.hand.length||paired){s.players.forEach((q,j)=>q.score=j===i?s.players.length-1:-1);finish(s,[i]);return;}
    if(e.step==='discard'){s.turn=nextSeat(s);e.step='play';}else e.step='discard';
  },
  cpu:v=>v.actions.find(a=>a.type==='play')||v.actions[0],
};
const snip:RuleExtension={
  start:s=>{while(s.stock.length)dealCards(s,1);s.turn=nextSeat(s,s.dealer);},
  actions:s=>{
    const hand=s.players[s.turn].hand,e=s.extra,cards=e.obligation?hand.filter(c=>rank(c)===rank(s.table.at(-1)!)):hand;
    return cards.length?cards.map(c=>({type:'play',cards:[c]})):[{type:'pass'}];
  },
  apply:(s,a)=>{
    const e=s.extra,i=s.turn;
    if(a.type==='pass'){e.firstTrick=false;s.turn=nextSeat(s);record(s,'pass',i);return;}
    const c=a.cards![0];removeCards(s,i,[c]);
    if(e.obligation&&e.firstTrick){s.players[e.claimant].score-=e.obligation;s.pool+=e.obligation;record(s,'snipped',e.claimant,e.obligation);}
    s.table.push(c);e.obligation++;e.claimant=i;e.firstTrick=true;record(s,'play',i,undefined,c);
    if(!s.players[i].hand.length){let amount=s.pool;s.players.forEach((p,j)=>{if(j!==i){p.score-=p.hand.length;amount+=p.hand.length;}});s.players[i].score+=amount;finish(s,[i]);return;}
    if(e.obligation===4)e.obligation=0;else s.turn=nextSeat(s);
  },
  cpu:v=>v.actions[0],
};
const red=(c:number)=>[1,2].includes(suit(c));
const fits=(c:number,top:number)=>rank(c)===rank(top)-1&&red(c)!==red(top);
function settleKings(s:ClubState){s.players.forEach(p=>p.score-=p.hand.reduce((v,c)=>v+(rank(c)===13?10:1),0));if(s.players.some(p=>p.score<=-25))finish(s);else roundOver(s);}
const kings:RuleExtension={
  start:s=>{dealCards(s,7);s.extra.piles=Array.from({length:8},(_,i)=>i<4?[s.stock.pop()!]:[]);s.extra.step='draw';s.turn=nextSeat(s,s.dealer);},
  actions:s=>{
    const e=s.extra,hand=s.players[s.turn].hand;
    if(e.step==='draw'&&s.stock.length)return [{type:'draw'}];
    const out:Action[]=hand.flatMap(c=>e.piles.flatMap((pile,index)=>(pile.length?fits(c,pile.at(-1)!):index<4||rank(c)===13)?[{type:'play' as const,cards:[c],index}]:[]));
    for(let index=0;index<4;index++)if(e.piles[index].length)for(let target=0;target<8;target++)if(target!==index){const from=e.piles[index][0],dest=e.piles[target];if(dest.length?fits(from,dest.at(-1)!):target>=4&&rank(from)===13)out.push({type:'move',index,target});}
    return [...out,{type:'pass'}];
  },
  apply:(s,a)=>{
    const e=s.extra,i=s.turn,p=s.players[i];
    if(a.type==='draw'){p.hand.push(s.stock.pop()!);e.step='play';record(s,'draw',i);return;}
    if(a.type==='pass'){
      e.iterations=e.firstTrick?e.iterations+1:0;e.firstTrick=true;e.step='draw';s.turn=nextSeat(s);record(s,'pass',i);
      if(!s.stock.length&&e.iterations>=s.players.length)settleKings(s);return;
    }
    if(a.type==='move'){e.piles[a.target!].push(...e.piles[a.index!]);e.piles[a.index!]=[];record(s,'move',i);}
    else {removeCards(s,i,a.cards!);e.piles[a.index!].push(...a.cards!);record(s,'play',i,undefined,a.cards![0]);}
    e.step='play';e.firstTrick=false;e.iterations=0;if(!p.hand.length)settleKings(s);
  },
  cpu:v=>v.actions.find(a=>a.type==='play'&&rank(a.cards![0])===13&&a.index!>=4)||v.actions.find(a=>a.type==='move')||v.actions.find(a=>a.type==='play')||v.actions[0],
};
export const sheddingRules:Partial<Record<string,RuleExtension>>={pitypat,snipsnupsnorem:snip,kingsinthe:kings};
