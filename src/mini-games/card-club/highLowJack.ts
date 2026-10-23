import { high,rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic } from './classicCommon';
import { worldWinner } from './worldTricks';
export const pitchValue=(card:number)=>({10:10,1:4,13:3,12:2,11:1}[rank(card)]||0);
export function pitchPlayable(hand:number[],trick:{card:number}[],trump:number){
 if(!trick.length)return hand;const lead=suit(trick[0].card),follow=hand.filter(card=>suit(card)===lead);
 return follow.length?hand.filter(card=>suit(card)===lead||suit(card)===trump):hand;
}
export function pitchAwards(players:{taken:number[]}[],trump:number){
 const trumps=players.flatMap((p,i)=>p.taken.filter(card=>suit(card)===trump).map(card=>({card,owner:i}))).sort((a,b)=>high(a.card)-high(b.card));
 const values=players.map(p=>p.taken.reduce((sum,card)=>sum+pitchValue(card),0)),max=Math.max(...values),game=values.filter(v=>v===max).length===1?values.indexOf(max):-1;
 return [trumps.at(-1)?.owner??-1,trumps[0]?.owner??-1,trumps.find(t=>rank(t.card)===11)?.owner??-1,game];
}
function point(s:ClubState,who:number,points:number,label:string){s.players[who].score+=points;s.extra.classic!.notes.push({player:who,label,points});record(s,'points',who,points);if(s.players[who].score>=11){finish(s,[who]);return true;}return false;}
function candidate(s:ClubState){
 const c=s.extra.classic!,card=s.stock.pop()!,seen=c.shown[0].includes(suit(card));s.extra.board.push(card);s.extra.visible.push(s.extra.board.length-1);s.extra.indicator=card;s.trump=suit(card);
 if(!seen){c.shown[0].push(s.trump);if(rank(card)===11&&point(s,s.dealer,1,'jack'))return 'end';}return seen?'repeat':'new';
}
function start(s:ClubState){const c=initClassic(s);dealCards(s,6);s.turn=nextSeat(s,s.dealer);c.nextDealer=(s.dealer+1)%s.players.length;s.extra.step=s.game==='pitch'?'pitchBid':'allFourOffer';if(s.game==='allfour')candidate(s);}
function remember(s:ClubState){
 const trumpCards=s.players.flatMap((p,owner)=>p.hand.filter(card=>suit(card)===s.trump).map(card=>({card,owner}))).sort((a,b)=>high(a.card)-high(b.card));
 const low=trumpCards[0],highCard=trumpCards.at(-1);s.extra.classic!.deckHistory=[highCard?.card??-1,highCard?.owner??-1,low?.card??-1,low?.owner??-1];
}
function ready(s:ClubState){s.turn=1-s.dealer;s.extra.step=s.players.some(p=>p.hand.length>6)?'allFourDiscard':'play';if(s.extra.step==='play')remember(s);}
function actions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,hand=s.players[s.turn].hand;
 if(e.step==='pitchBid')return [{type:'pass'},...Array.from({length:4},(_,i)=>i+1).filter(value=>value>c.contract).map(value=>({type:'bid' as const,value}))];
 if(e.step==='allFourOffer'||e.step==='allFourReply')return [{type:'stand'},{type:'pass'}];
 if(e.step==='allFourDiscard')return hand.map(card=>({type:'discard',cards:[card]}));
 return pitchPlayable(hand,s.trick,s.trump).map(card=>({type:'play',cards:[card]}));
}
function score(s:ClubState){
 const c=s.extra.classic!,awards=pitchAwards(s.players,s.trump);
 if(s.game==='allfour'){awards[0]=c.deckHistory[1];awards[1]=c.deckHistory[3];for(const [i,who] of awards.entries())if(who>=0&&point(s,who,1,['high','low','jack','game'][i]))return;roundOver(s);return;}
 const earned=s.players.map((_,i)=>awards.filter(who=>who===i).length),old=s.players.map(p=>p.score),bidder=c.caller;
 s.players.forEach((p,i)=>{const points=i===bidder&&earned[i]<c.contract?-c.contract:earned[i];p.score+=points;c.notes.push({player:i,label:'gamePoints',points});});
 const reached=s.players.flatMap((p,i)=>p.score>=11?[i]:[]);
 if(reached.length){let winner=reached.includes(bidder)?bidder:-1;if(winner<0){const scores=[...old];for(const who of awards)if(who>=0&&++scores[who]>=11&&reached.includes(who)){winner=who;break;}}finish(s,[winner>=0?winner:reached[0]]);}else roundOver(s);
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn;
 if(e.step==='pitchBid'){
  if(a.type==='bid'){c.contract=a.value!;c.caller=i;s.players[i].bid=a.value!;}c.passes++;s.turn=nextSeat(s);
  if(c.passes===s.players.length){if(c.caller<0){c.nextDealer=s.dealer;roundOver(s);}else {e.step='play';s.turn=c.caller;}}return;
 }
 if(e.step==='allFourOffer'){if(a.type==='stand')ready(s);else {e.step='allFourReply';s.turn=s.dealer;}return;}
 if(e.step==='allFourReply'){
  if(a.type==='stand'){if(!point(s,1-s.dealer,1,'gift'))ready(s);return;}
  do{
   if(c.shown[0].length===4||s.stock.length<7){c.nextDealer=s.dealer;roundOver(s);return;}
   dealCards(s,3);const result=candidate(s);if(result==='end')return;if(result==='new'){e.step='allFourOffer';s.turn=1-s.dealer;return;}
  }while(true);
 }
 if(e.step==='allFourDiscard'){
  removeCards(s,i,a.cards!);s.discard.push(...a.cards!);if(s.players[i].hand.length===6){if(i!==s.dealer)s.turn=s.dealer;else {e.step='play';s.turn=1-s.dealer;remember(s);}}return;
 }
 const card=a.cards![0];if(s.game==='pitch'&&!s.trick.length&&c.trickNo===0)s.trump=suit(card);removeCards(s,i,[card]);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<s.players.length){s.turn=nextSeat(s);return;}
 const winner=worldWinner(s.trick,s.trump);s.players[winner].taken.push(...s.trick.map(t=>t.card));s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;c.trickNo++;
 if(s.players.every(p=>!p.hand.length))score(s);
}
function cpu(v:ClubView):Action|undefined{
 const hand=v.players[v.self].hand,st=[0,1,2,3].sort((a,b)=>hand.filter(c=>suit(c)===b).reduce((sum,c)=>sum+high(c),0)-hand.filter(c=>suit(c)===a).reduce((sum,c)=>sum+high(c),0))[0];
 if(v.extra.step==='pitchBid'){
  const strength=hand.filter(card=>suit(card)===st),want=Math.min(4,Math.max(1,strength.filter(card=>high(card)>=11).length));return [...v.actions].filter(a=>a.type==='bid'&&a.value!<=want).at(-1)||v.actions[0];
 }
 if(v.extra.step==='allFourOffer'||v.extra.step==='allFourReply')return {type:hand.filter(card=>suit(card)===v.trump).length>=2?'stand':'pass'};
 if(v.extra.step==='allFourDiscard')return [...v.actions].sort((a,b)=>(suit(a.cards![0])===v.trump?30:0)+high(a.cards![0])-(suit(b.cards![0])===v.trump?30:0)-high(b.cards![0]))[0];
 let plays=v.actions;
 if(v.game==='pitch'&&!v.trick.length&&v.extra.classic!.trickNo===0)plays=plays.filter(a=>suit(a.cards![0])===st);
 if(!v.trick.length)return [...plays].sort((a,b)=>high(b.cards![0])-high(a.cards![0]))[0];
 const wins=plays.filter(a=>worldWinner([...v.trick,{player:v.self,card:a.cards![0]}],v.trump)===v.self),cost=(card:number)=>high(card)+(suit(card)===v.trump?20:0);
 return [...(wins.length?wins:plays)].sort((a,b)=>cost(a.cards![0])-cost(b.cards![0]))[0];
}
export const highLowRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.extra.classic!.nextDealer};
