import { rank } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
export const sevenValue=(card:number)=>[1,10].includes(rank(card))?10:0;
export function sevenWinner(trick:{player:number;card:number}[]){const sevens=trick.filter(t=>rank(t.card)===7);return (sevens.length?sevens:trick.filter(t=>rank(t.card)===rank(trick[0].card))).at(-1)!.player;}
export const sedmaPartner=(round:number,seat:number)=>[[2,3,0,1],[1,0,3,2],[3,2,1,0]][Math.floor(round/4)%3][seat];
const partner=(s:ClubState|ClubView,seat:number)=>s.players.length===2?-1:s.game==='sedma'?sedmaPartner(s.round,seat):(seat+2)%4;
function start(s:ClubState){initClassic(s);resetClassicDeck(s);dealCards(s,s.game==='sedma'?8:4);s.turn=nextSeat(s,s.dealer);}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,hand=s.players[s.turn].hand;
 if(s.extra.step==='sevenRetry')return [{type:'accept'},...hand.filter(card=>rank(card)===7||rank(card)===c.banned).map(card=>({type:'play' as const,cards:[card]}))];
 return hand.map(card=>({type:'play',cards:[card]}));
}
function showPartners(s:ClubState){
 const c=s.extra.classic!;if(s.players.length!==4||c.revealed||s.stock.length)return;c.revealed=true;
 s.players.forEach((p,i)=>p.hand.forEach(card=>c.notices.push({to:partner(s,i),from:i,card})));record(s,'partnerHands');
}
function bank(s:ClubState){
 const c=s.extra.classic!,winner=c.caller;s.players[winner].taken.push(...s.table);s.table=[];s.turn=winner;record(s,'trick',winner);
 if(s.game==='sedmice'){
  while(s.stock.length&&s.players.some(p=>p.hand.length<4))for(let k=0;k<s.players.length;k++){const i=(winner+k)%s.players.length;if(s.stock.length&&s.players[i].hand.length<4)s.players[i].hand.push(s.stock.pop()!);}
  showPartners(s);
 }
 if(s.players.every(p=>!p.hand.length)){
  s.players.forEach((p,i)=>{const other=partner(s,i),cards=[...p.taken,...other>=0?s.players[other].taken:[]];const points=cards.reduce((sum,card)=>sum+sevenValue(card),0)+(i===winner||other===winner?10:0);s.extra.points[i]=points;p.score+=points;});
  if(s.game==='sedma'?s.round>=11:s.players.some(p=>p.score>=120))finish(s);else roundOver(s);
 }
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn;
 if(a.type==='accept'){s.extra.step='play';bank(s);return;}
 const card=a.cards![0];if(!s.trick.length){c.first=i;c.banned=rank(card);}s.extra.step='play';removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<s.players.length){s.turn=nextSeat(s);return;}
 const winner=sevenWinner(s.trick);s.players[winner].tricks++;s.table.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];c.caller=winner;c.trickNo++;
 const leader=c.first;
 if(s.game==='sedmice'&&winner!==leader&&winner!==partner(s,leader)&&s.players[leader].hand.some(card=>rank(card)===7||rank(card)===c.banned)){s.turn=leader;s.extra.step='sevenRetry';return;}
 bank(s);
}
function cpu(v:ClubView):Action|undefined{
 const plays=v.actions.filter(a=>a.type==='play'),value=(card:number)=>sevenValue(card)+(rank(card)===7?20:rank(card)===1?12:0),ally=partner(v,v.self);
 if(v.extra.step==='sevenRetry'){
  const points=v.table.reduce((sum,c)=>sum+sevenValue(c),0);return points>=10?plays.sort((a,b)=>value(a.cards![0])-value(b.cards![0]))[0]||v.actions[0]:v.actions[0];
 }
 if(!v.trick.length)return [...plays].sort((a,b)=>value(a.cards![0])-value(b.cards![0]))[0];
 const winner=sevenWinner(v.trick),allied=winner===ally,wins=plays.filter(a=>sevenWinner([...v.trick,{player:v.self,card:a.cards![0]}])===v.self);
 if(allied)return [...plays].sort((a,b)=>sevenValue(b.cards![0])-sevenValue(a.cards![0])||value(a.cards![0])-value(b.cards![0]))[0];
 return [...(wins.length?wins:plays)].sort((a,b)=>value(a.cards![0])-value(b.cards![0]))[0];
}
export const sevenRules:RuleExtension={start,actions,apply,cpu};
