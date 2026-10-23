import { combinations,high,pack,rank,shuffled,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { addTeam,dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';

export const EXTENDED_TRICKS=new Set(['briscola','sueca','polignac','laus','kalter','gurka','spar','miseria','ciapano','heart2']);
const jacks=(g:string)=>g==='laus'||g==='kalter';
export const effectiveSuit=(g:string,c:number)=>jacks(g)&&rank(c)===11?4:suit(c);
export function trickStrength(g:string,c:number){
  if(jacks(g))return rank(c)===11?[4,1,2,3][suit(c)]:[7,8,9,12,13,10,1].indexOf(rank(c));
  const order=g==='briscola'?[2,4,5,6,7,11,12,13,3,1]:g==='sueca'?[2,3,4,5,6,12,11,13,7,1]:g==='ciapano'?[4,5,6,7,11,12,13,1,2,3]:g==='polignac'?[7,8,9,10,1,11,12,13]:null;
  return order?order.indexOf(rank(c)):high(c);
}
const pointValue=(g:string,c:number)=>{
  const r=rank(c);
  if(g==='sueca')return r===1?11:r===7?10:r===13?4:r===11?3:r===12?2:0;
  if(g==='briscola')return r===1?11:r===3?10:r===13?4:r===12?3:r===11?2:0;
  if(g==='polignac')return r===11?(suit(c)===3?2:1):0;
  if(g==='laus')return r===11?25:r===1?10:r===10?5:r===12?[300,0,100,200][suit(c)]:0;
  if(g==='kalter')return r===1?11:r===10?10:r===13?4:r===12?3:r===11?2:0;
  if(g==='ciapano')return r===1?3:[2,3,11,12,13].includes(r)?1:0; // integer thirds
  if(g==='heart2')return suit(c)===2?1:c===50?13:0;
  return 0;
};
export function extendedDeck(game:string,n:number){
  let cards=pack();
  if(['briscola','sueca','miseria','ciapano'].includes(game))cards=cards.filter(c=>![8,9,10].includes(rank(c)));
  if(game==='briscola'){if(n===3)cards=cards.filter(c=>c!==1);if(n===6)cards=cards.filter(c=>rank(c)!==2);}
  if(['polignac','laus','kalter'].includes(game))cards=cards.filter(c=>rank(c)===1||rank(c)>=7);
  if(game==='polignac'&&n!==4)cards=cards.filter(c=>c!==6&&c!==45);
  if(game==='spar')cards=cards.filter(c=>rank(c)===1||rank(c)>=6);
  return cards;
}
function start(s:ClubState){
  const n=s.players.length,e=s.extra;
  s.stock=shuffled(extendedDeck(s.game,n),s.seed+s.round*1009);
  s.direction=['briscola','ciapano','miseria'].includes(s.game)?-1:1;
  if(s.game==='gurka')s.players.forEach(p=>p.out=p.score<=-30);
  if(s.game==='laus'||s.game==='kalter')s.trump=4;
  const cards=s.game==='briscola'?3:s.game==='gurka'?6:s.game==='spar'?7:Math.floor(s.stock.length/n);
  dealCards(s,cards);s.turn=nextSeat(s,s.dealer);e.firstLeader=s.turn;
  if(s.game==='briscola'){e.indicator=s.stock.pop()!;s.trump=suit(e.indicator);s.stock.unshift(e.indicator);}
  if(s.game==='sueca'){e.indicator=s.players[s.dealer].hand.at(-1)!;s.trump=suit(e.indicator);}
  if(s.game==='ciapano'&&n===3){s.players[s.dealer].hand.push(s.stock.pop()!);s.turn=s.dealer;e.step='discard';}
  if(s.game==='miseria'){s.turn=s.dealer;if(s.round%2===1)e.step='trump';}
  if(s.game==='heart2'){
    if(s.round%4!==3)e.step='exchange';
    else s.turn=s.players.findIndex(p=>p.hand.includes(1));
  }
}
function playableCards(s:ClubState){
  const hand=s.players[s.turn].hand,lead=s.trick[0];
  if(s.game==='briscola')return hand;
  if(s.game==='gurka'&&lead){const last=s.trick.at(-1)!.card,min=Math.min(...hand.map(high)),higher=hand.filter(c=>high(c)>=high(last));return rank(last)===1||!higher.length?hand.filter(c=>high(c)===min):higher;}
  if(lead){const cards=hand.filter(c=>effectiveSuit(s.game,c)===effectiveSuit(s.game,lead.card));return cards.length?cards:hand;}
  if(s.game==='heart2'){
    if(s.extra.firstTrick)return hand.filter(c=>c===1);
    if(!s.broken&&hand.some(c=>suit(c)!==2))return hand.filter(c=>suit(c)!==2);
  }
  return hand;
}
function actions(s:ClubState):Action[]{
  const e=s.extra,hand=s.players[s.turn].hand;
  if(e.step==='discard')return hand.map(c=>({type:'discard',cards:[c]}));
  if(e.step==='trump')return [0,1,2,3].map(suit=>({type:'trump',suit}));
  if(e.step==='exchange')return combinations(hand,3).map(cards=>({type:'exchange',cards}));
  return playableCards(s).flatMap(c=>[{type:'play' as const,cards:[c]},...s.game==='kalter'&&hand.length===8?[{type:'play' as const,cards:[c],double:true}]:[]]);
}
function losersFinish(s:ClubState){const min=Math.min(...s.players.map(p=>p.score)),winners=s.players.flatMap((p,i)=>p.score>min?[i]:[]);finish(s,winners.length?winners:s.players.map((_,i)=>i),winners.length?'penalty':'draw');}
function settle(s:ClubState,lastWinner:number){
  const e=s.extra,n=s.players.length,g=s.game;
  e.points=s.players.map(p=>p.taken.reduce((sum,c)=>sum+pointValue(g,c),0));
  if(g==='briscola'||g==='sueca'){
    if(n===3){const over=e.points.flatMap((v,i)=>v>=41?[i]:[]);for(const i of over)s.players[i].score+=e.points[i]===120?3:over.length===1?2:1;}
    else for(let t=0;t<2;t++){
      const points=e.points.reduce((v,x,i)=>v+(i%2===t?x:0),0),tricks=s.players.reduce((v,p,i)=>v+(i%2===t?p.tricks:0),0);
      if(points>=61)addTeam(s,t,g==='briscola'?1:tricks===10?4:points>=91?2:1);
    }
    if(s.players.some(p=>p.score>=(g==='sueca'?4:3))){finish(s);return;}
  }else if(g==='polignac'||g==='laus'){
    s.players.forEach((p,i)=>p.score-=g==='laus'&&p.taken.includes(24)?0:e.points[i]);
    if(s.players.some(p=>p.score<=-(g==='polignac'?10:1500))){losersFinish(s);return;}
  }else if(g==='kalter'){
    const sweep=s.players.findIndex(p=>p.tricks===8);
    if(sweep>=0)s.players.forEach((p,i)=>{if(i!==sweep)p.score-=120*e.multiplier;});
    else {const most=Math.max(...e.points),factor=e.multiplier*2**s.players.filter(p=>p.tricks===0).length;s.players.forEach((p,i)=>{if(e.points[i]===most)p.score-=Math.round(e.points[i]*factor/10)*10;});}
    const zero=s.players.flatMap((p,i)=>p.score===0?[i]:[]);
    if(s.round===4&&zero.length===1){finish(s,zero);return;}
    const low=Math.min(...s.players.map(p=>p.score));
    if(low<=-2000&&s.players.filter(p=>p.score===low).length===1){losersFinish(s);return;}
  }else if(g==='gurka'){
    const max=Math.max(...s.lastTrick.map(t=>high(t.card)));s.lastTrick.forEach(t=>{if(high(t.card)===max)s.players[t.player].score-=max;});
    const inDeal=s.players.flatMap((p,i)=>!p.out?[i]:[]);s.players.forEach(p=>p.out=p.score<=-30);const alive=s.players.flatMap((p,i)=>!p.out?[i]:[]);
    if(alive.length<=1){finish(s,alive.length?alive:inDeal,alive.length?'survivor':'draw');return;}
  }else if(g==='spar'){
    const c=s.lastTrick.find(t=>t.player===lastWinner)!.card,amount=rank(c)===6?3:rank(c)===7?2:1;
    s.players.forEach((p,i)=>p.score+=i===lastWinner?amount*(n-1):-amount);finish(s,[lastWinner]);return;
  }else if(g==='miseria'){
    s.players.forEach(p=>p.score+=p.tricks*(s.round%2===0?-1:1));if(s.round===7){finish(s);return;}
  }else if(g==='ciapano'){
    const sweep=e.points.indexOf(32);
    if(sweep>=0)s.players.forEach((p,i)=>{if(i!==sweep)p.score-=11;});
    else {const penalties=e.points.map(x=>Math.floor(x/3));penalties[lastWinner]=11-penalties.reduce((v,x,i)=>v+(i!==lastWinner?x:0),0);s.players.forEach((p,i)=>p.score-=penalties[i]);e.points=penalties;}
    if(s.players.some(p=>p.score<=-31)){finish(s);return;}
  }else if(g==='heart2'){
    const moon=e.points.indexOf(26);s.players.forEach((p,i)=>p.score+=moon>=0?(i===moon?26:0):-e.points[i]);
    if(s.players.some(p=>p.score<=-100)){finish(s);return;}
  }
  roundOver(s);
}
function apply(s:ClubState,a:Action){
  const e=s.extra,i=s.turn,g=s.game;
  if(a.type==='discard'){removeCards(s,i,a.cards!);s.discard.push(...a.cards!);e.step='play';s.turn=e.firstLeader;return;}
  if(a.type==='trump'){s.trump=a.suit!;e.step='play';return;}
  if(a.type==='exchange'){
    e.selections[i]=a.cards!;s.turn=nextSeat(s);
    if(e.selections.every(cs=>cs.length===3)){
      const offset=[1,3,2][s.round%4];s.players.forEach((_,j)=>removeCards(s,j,e.selections[j]));
      e.selections.forEach((cs,j)=>s.players[(j+offset)%4].hand.push(...cs));e.selections=e.selections.map(()=>[]);e.step='play';s.turn=s.players.findIndex(p=>p.hand.includes(1));
    }return;
  }
  const c=a.cards![0];removeCards(s,i,[c]);s.trick.push({player:i,card:c});if(g==='heart2'&&suit(c)===2)s.broken=true;
  if(a.double){e.multiplier*=2;record(s,'double',i,e.multiplier);}record(s,'play',i,undefined,c);
  if(s.trick.length<s.players.filter(p=>!p.out).length){s.turn=nextSeat(s);return;}
  const lead=effectiveSuit(g,s.trick[0].card),weight=(card:number)=>(g==='gurka'?0:effectiveSuit(g,card)===s.trump?100:effectiveSuit(g,card)===lead?50:0)+trickStrength(g,card);
  const winner=s.trick.reduce((best,t)=>weight(t.card)>weight(best.card)||g==='gurka'&&weight(t.card)===weight(best.card)?t:best).player;
  s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;s.capturesBy=winner;e.firstTrick=false;record(s,'trick',winner);
  if(g==='briscola'&&s.stock.length){for(let k=0;k<s.players.length;k++){const j=(winner+k*s.direction+s.players.length*2)%s.players.length;if(s.stock.length)s.players[j].hand.push(s.stock.pop()!);}if(!s.stock.length)e.indicator=-1;}
  if(s.players.every(p=>p.out||!p.hand.length)){
    if(g==='ciapano'){s.players[winner].taken.push(...s.discard);s.discard=[];}
    settle(s,winner);
  }
}
function cpu(v:ClubView):Action|undefined{
  const a=v.actions,e=v.extra;if(!a.length)return;
  if(e.step==='exchange')return [...a].sort((x,y)=>y.cards!.reduce((n,c)=>n+high(c)+(c===50?30:0),0)-x.cards!.reduce((n,c)=>n+high(c)+(c===50?30:0),0))[0];
  if(e.step==='discard')return [...a].sort((x,y)=>pointValue(v.game,y.cards![0])-pointValue(v.game,x.cards![0]))[0];
  if(e.step==='trump')return [...a].sort((x,y)=>v.players[v.self].hand.filter(c=>suit(c)===y.suit).length-v.players[v.self].hand.filter(c=>suit(c)===x.suit).length)[0];
  const avoid=['polignac','laus','kalter','gurka','ciapano','heart2'].includes(v.game)||v.game==='miseria'&&v.round%2===0;
  return [...a].sort((x,y)=>(avoid?1:-1)*(trickStrength(v.game,x.cards![0])-trickStrength(v.game,y.cards![0]))||Number(!!x.double)-Number(!!y.double))[0];
}
export const extendedTricks:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.game==='miseria'?(s.round%2===0?nextSeat(s,s.dealer,-1):s.dealer):nextSeat(s,s.dealer,['briscola','ciapano'].includes(s.game)?-1:1)};
