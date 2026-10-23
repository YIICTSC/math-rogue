import { rank } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { addTeam,dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';

const memory:RuleExtension={
  start:s=>{s.extra.board=[...s.stock];s.stock=[];s.turn=nextSeat(s,s.dealer);},
  actions:s=>s.extra.step==='mismatch'?[{type:'continue'}]:s.extra.board.flatMap((c,index)=>c<0||s.extra.visible.includes(index)?[]:[{type:'pick' as const,index}]),
  apply:(s,a)=>{
    const e=s.extra,i=s.turn;
    if(a.type==='continue'){e.visible=[];e.step='play';s.turn=nextSeat(s);return;}
    e.visible.push(a.index!);e.memory[a.index!]=e.board[a.index!];record(s,'flip',i,a.index!+1,e.board[a.index!]);
    if(e.visible.length!==2)return;
    const [x,y]=e.visible;
    if(rank(e.board[x])===rank(e.board[y])){
      s.players[i].taken.push(e.board[x],e.board[y]);s.players[i].score++;e.board[x]=-2;e.board[y]=-2;e.visible=[];delete e.memory[x];delete e.memory[y];record(s,'pair',i);
      if(e.board.every(c=>c===-2))finish(s);
    }else e.step='mismatch';
  },
  cpu:v=>{
    const e=v.extra,a=v.actions;if(e.step==='mismatch')return a[0];
    const known=Object.entries(e.memory).map(([index,card])=>({index:Number(index),card})).filter(x=>e.board[x.index]!==-2);
    if(e.visible.length){const r=rank(e.board[e.visible[0]]),match=a.find(x=>e.memory[x.index!]!==undefined&&rank(e.memory[x.index!])===r);if(match)return match;}
    else {for(const x of known){if(known.some(y=>x.index!==y.index&&rank(x.card)===rank(y.card))){const action=a.find(y=>y.index===x.index);if(action)return action;}}}
    const unknown=a.filter(x=>e.memory[x.index!]===undefined);return (unknown.length?unknown:a)[v.revision%(unknown.length||a.length)];
  },
};
function collectBeggar(s:ClubState){
  const e=s.extra;s.players[e.claimant].hand.push(...s.table);s.table=[];s.players[e.claimant].out=false;s.turn=e.claimant;e.claimant=-1;e.obligation=0;record(s,'capture',s.turn);
}
const beggar:RuleExtension={
  start:s=>{while(s.stock.length)dealCards(s,1);s.turn=nextSeat(s,s.dealer);},
  actions:()=>[{type:'reveal'}],
  apply:s=>{
    const e=s.extra,i=s.turn,p=s.players[i],c=p.hand.shift()!;s.table.push(c);record(s,'play',i,undefined,c);e.iterations++;
    const debt=rank(c)===1?4:rank(c)>10?rank(c)-10:0;
    if(debt){e.claimant=i;e.obligation=debt;s.turn=nextSeat(s);}
    else if(e.obligation){
      e.obligation--;if(!e.obligation||!p.hand.length){if(!p.hand.length)p.out=true;collectBeggar(s);}
    }else {p.out=!p.hand.length;s.turn=nextSeat(s);}
    // A claimant with an empty queue stays eligible until their claim resolves.
    s.players.forEach((q,j)=>q.out=!q.hand.length&&j!==e.claimant);
    if(s.players[s.turn].out)s.turn=nextSeat(s);
    if(e.claimant>=0&&s.turn===e.claimant)collectBeggar(s);
    const alive=s.players.flatMap((q,j)=>q.hand.length?[j]:[]);
    if(alive.length<=1&&e.claimant<0){s.players.forEach(q=>q.score=q.hand.length);finish(s,alive.length?alive:s.players.map((_,j)=>j));return;}
    const key=`${s.turn}:${e.claimant}:${e.obligation}:${s.players.map(q=>q.hand.join(',')).join('|')}:${s.table.join(',')}`;
    if(e.seen.includes(key)){s.players.forEach(q=>q.score=q.hand.length);finish(s,s.players.map((_,j)=>j),'repetition');return;}
    e.seen.push(key);
    if(e.iterations>=5000){s.players.forEach(q=>q.score=q.hand.length);finish(s,undefined,'limit');}
  },
};
const pishti:RuleExtension={
  start:s=>{
    dealCards(s,4);s.table=s.stock.splice(-4);let spins=0;
    while(rank(s.table.at(-1)!)===11&&spins++<4)s.table.unshift(s.table.pop()!);
    if(rank(s.stock[0])===11)s.players[s.dealer].taken.push(s.stock.shift()!);
    s.extra.indicator=s.stock[0]??-1;s.extra.opening=3;s.turn=nextSeat(s,s.dealer);
  },
  actions:s=>s.players[s.turn].hand.map(c=>({type:'play',cards:[c]})),
  apply:(s,a)=>{
    const i=s.turn,c=a.cards![0],p=s.players[i],top=s.table.at(-1);removeCards(s,i,[c]);
    if(top!==undefined&&(rank(top)===rank(c)||rank(c)===11)){
      if(s.table.length===1){if(s.players.length===4)addTeam(s,i%2,10);else p.score+=10;record(s,'sweep',i,10);}
      p.taken.push(...s.table,c);s.table=[];s.extra.opening=0;record(s,'capture',i);
    }else s.table.push(c);
    s.lastTrick=[{player:i,card:c}];s.turn=nextSeat(s);
    if(s.players.every(q=>!q.hand.length)){
      if(s.stock.length){dealCards(s,4);if(!s.stock.length)s.extra.indicator=-1;return;}
      const teams=2,sets=[0,1].map(t=>s.players.flatMap((q,j)=>j%teams===t?q.taken:[]));
      sets.forEach((cs,t)=>{const value=cs.reduce((v,x)=>v+(x===22?3:x===1?2:[1,11].includes(rank(x))?1:0),0)+(cs.length>sets[1-t].length?3:0);addTeam(s,t,value);});
      if(s.players.some(q=>q.score>=101))finish(s);else roundOver(s);
    }
  },
  cpu:v=>v.actions.find(a=>{const top=v.table.at(-1);return top!==undefined&&top>=0&&rank(a.cards![0])===rank(top);})||v.actions.find(a=>v.table.length>1&&rank(a.cards![0])===11)||v.actions.find(a=>![1,11].includes(rank(a.cards![0])))||v.actions[0],
};
export const sideRules:Partial<Record<string,RuleExtension>>={memory,beggar,pishti};
