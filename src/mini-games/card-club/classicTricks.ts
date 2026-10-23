import { high,rank,shuffled,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver,addTeam } from './ruleHelpers';
import { initClassic,resetClassicDeck,fixedDeals } from './classicCommon';
export const CLASSIC_TRICKS=new Set(['euchre2','euchre-uk','germanwhist','minnesotawhist','chinesewhist','knockout','nap','napoleon']);
const euchre=(game:string)=>game==='euchre2'||game==='euchre-uk';
const partnerSuit=(st:number)=>[3,2,1,0][st];
export const countingCard=(c:number)=>c<52&&(rank(c)===1||rank(c)>=10);
export function classicSuit(game:string,card:number,trump:number){return euchre(game)&&(card===52||rank(card)===11&&suit(card)===partnerSuit(trump))?trump:suit(card);}
export function classicWeight(game:string,card:number,trump:number,lead:number,allSame=false,first=false,jokerLead=false){
 if(game==='napoleon'){
  if(card===39)return 1000;
  if(card===52)return jokerLead?950:-1;
  if(card===trump*13+10)return 900;
  if(card===partnerSuit(trump)*13+10)return 800;
  if(allSame&&!first&&rank(card)===2)return 700;
 }
 if(euchre(game)){
  if(card===52)return 1000;
  if(card===trump*13+10)return 900;
  if(card===partnerSuit(trump)*13+10)return 800;
 }
 const st=classicSuit(game,card,trump);return (st===trump?600:st===lead?300:0)+high(card);
}
export function classicWinner(game:string,trick:{player:number;card:number}[],trump:number,first=false){
 const jokerLead=game==='napoleon'&&trick[0].card===52,lead=jokerLead?trump:classicSuit(game,trick[0].card,trump);
 const allSame=trick.every(t=>t.card!==52&&suit(t.card)===lead);
 return trick.reduce((best,t)=>classicWeight(game,t.card,trump,lead,allSame,first,jokerLead)>classicWeight(game,best.card,trump,lead,allSame,first,jokerLead)?t:best).player;
}
function start(s:ClubState){
 const c=initClassic(s),n=s.players.length,e=s.extra;resetClassicDeck(s);s.turn=nextSeat(s,s.dealer);c.first=s.turn;
 if(s.game==='knockout'){
  s.players.forEach(p=>{if(s.round===0)p.lives=1;p.out=p.lives===0;});dealCards(s,Math.max(1,7-s.round));e.indicator=s.stock.at(-1)!;s.trump=suit(e.indicator);s.turn=s.dealer;
 }else if(euchre(s.game)){
  dealCards(s,5);e.indicator=s.stock.at(-1)!;c.indicatorSuit=e.indicator===52?-1:suit(e.indicator);e.step=e.indicator===52?'euchreBlind':'euchreBid1';if(e.step==='euchreBlind')s.turn=s.dealer;
 }else if(s.game==='germanwhist'){
  dealCards(s,13);e.indicator=s.stock.at(-1)!;s.trump=suit(e.indicator);
 }else if(s.game==='minnesotawhist'){
  dealCards(s,13);e.step='whistVote';
 }else if(s.game==='chinesewhist'){
  const stacks=n===2?12:n===3?8:6;dealCards(s,stacks*2+(n===2?2:1));
  s.players.forEach((p,i)=>{c.hidden[i]=p.hand.splice(0,stacks);c.rows[i]=p.hand.splice(0,stacks);});e.step='chineseTrump';s.turn=s.dealer;
 }else if(s.game==='nap'){
  dealCards(s,5);e.step='napBid';
 }else if(s.game==='napoleon'){
  const count=n===4?12:n===5?10:n===6?8:7;dealCards(s,count);c.handSize=count;e.step='napoleonBid';
 }
}
function playable(s:ClubState){
 const c=s.extra.classic!,hand=[...s.players[s.turn].hand,...s.game==='chinesewhist'?c.rows[s.turn].filter(x=>x>=0):[]];
 if(!s.trick.length)return s.game==='napoleon'&&c.trickNo===0?hand.filter(card=>card!==52):hand;
 const lead=s.game==='napoleon'&&s.trick[0].card===52?s.trump:classicSuit(s.game,s.trick[0].card,s.trump);
 const follow=hand.filter(card=>(s.game!=='napoleon'||card!==52)&&classicSuit(s.game,card,s.trump)===lead);
 if(follow.length)return [...follow,...s.game==='napoleon'&&hand.includes(52)?[52]:[]];return hand;
}
function actions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,hand=s.players[s.turn].hand;
 if(e.step==='whistVote')return hand.map(card=>({type:'bid',cards:[card]}));
 if(e.step==='chineseTrump'||e.step==='euchreBlind')return [0,1,2,3].map(suit=>({type:'trump',suit}));
 if(e.step==='euchreBid1'||e.step==='euchreBid2'){
  const suits=e.step==='euchreBid1'?[c.indicatorSuit]:[0,1,2,3].filter(st=>st!==c.indicatorSuit);
  return [{type:'pass'},...suits.flatMap(suit=>[{type:'order' as const,suit},{type:'order' as const,suit,alone:true}])];
 }
 if(e.step==='euchreSwap')return [{type:'pass'},...hand.map(card=>({type:'discard' as const,cards:[card]}))];
 if(e.step==='napBid')return [{type:'pass'},...[1,2,3,4,5,6].filter(value=>value>c.contract&&(value!==6||c.contract===5)).map(value=>({type:'bid' as const,value}))];
 if(e.step==='napoleonBid')return [{type:'pass'},...Array.from({length:11},(_,k)=>k+10).flatMap(value=>[0,1,2,3].filter(st=>value>c.contract||value===c.contract&&st>s.trump).map(suit=>({type:'bid' as const,value,suit})))];
 if(e.step==='napoleonName')return Array.from({length:53},(_,card)=>({type:'name',cards:[card]}));
 if(e.step==='napoleonDiscard')return hand.map(card=>({type:'discard',cards:[card]}));
 return playable(s).map(card=>({type:'play',cards:[card]}));
}
function readyEuchre(s:ClubState){
 const c=s.extra.classic!;s.extra.step='play';s.turn=s.game==='euchre-uk'&&c.contract===1?nextSeat(s,c.caller):nextSeat(s,s.dealer);
}
function endDeal(s:ClubState){
 const c=s.extra.classic!,n=s.players.length;
 if(euchre(s.game)){
  const team=c.caller%2,tricks=s.players.filter((_,i)=>i%2===team).reduce((n,p)=>n+p.tricks,0),won=tricks>=3;
  addTeam(s,won?team:1-team,won?tricks===5?c.contract===1?4:2:1:2);
  if(s.players.some(p=>p.score>=(s.game==='euchre2'?10:5)))finish(s);else roundOver(s);return;
 }
 if(s.game==='knockout'){
  s.players.forEach(p=>{if(!p.out&&!p.tricks){p.out=true;p.lives=0;}p.score=p.out?0:1;});
  const alive=s.players.flatMap((p,i)=>p.out?[]:[i]);if(alive.length===1){finish(s,alive,'survivor');return;}
  const max=Math.max(...s.players.map(p=>p.tricks));c.nextDealer=shuffled(alive.filter(i=>s.players[i].tricks===max),s.seed+s.round)[0];roundOver(s);return;
 }
 if(s.game==='germanwhist'){
  const [a,b]=s.players.map(p=>p.tricks);s.players[a>b?0:1].score+=Math.abs(a-b);
  if(s.players.some(p=>p.score>=11))finish(s);else roundOver(s);return;
 }
 if(s.game==='minnesotawhist'||s.game==='chinesewhist'){
  const teams=n===4?2:n,threshold=s.game==='minnesotawhist'||n===4?6:n===3?5:13;
  for(let team=0;team<teams;team++){
   const tricks=s.players.filter((_,i)=>i%teams===team).reduce((sum,p)=>sum+p.tricks,0),delta=Math.max(0,tricks-threshold)*(s.game==='minnesotawhist'&&c.contract===0?-1:1);
   s.players.forEach((p,i)=>{if(i%teams===team)p.score+=delta;});
  }
  if(s.players.some(p=>p.score>=(s.game==='minnesotawhist'?13:5)))finish(s);else roundOver(s);return;
 }
 if(s.game==='nap'){
  const tricks=s.players[c.caller].tricks,target=[0,2,3,0,4,5,5][c.contract],won=c.contract===3?tricks===0:tricks>=target;
  const amount=(won?[0,2,3,3,4,10,20]:[0,2,3,3,4,6,12])[c.contract]*(won?1:-1);
  s.players.forEach((p,i)=>p.score+=i===c.caller?amount*(n-1):-amount);fixedDeals(s,2);return;
 }
 if(s.game==='napoleon'){
  const attack=[c.caller,...c.partner>=0?[c.partner]:[]],points=attack.reduce((sum,i)=>sum+s.players[i].taken.filter(countingCard).length,0),won=points>=c.contract;
  c.revealed=true;c.notes.push({player:c.caller,label:'contract',points});s.players.forEach((p,i)=>{if(attack.includes(i)===won)p.score++;});fixedDeals(s,1);
 }
}
function playCard(s:ClubState,card:number){
 const c=s.extra.classic!,i=s.turn,p=s.players[i];
 if(p.hand.includes(card))removeCards(s,i,[card]);else c.rows[i][c.rows[i].indexOf(card)]=-1;
 if(s.game==='nap'&&!s.trick.length&&c.trickNo===0&&c.contract!==3)s.trump=suit(card);
 if(s.game==='napoleon'&&card===c.partnerCard)c.revealed=true;
 s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<s.players.filter(p=>!p.out).length){s.turn=nextSeat(s);return;}
 const winner=classicWinner(s.game,s.trick,s.trump,c.trickNo===0),wasDrawing=s.game==='germanwhist'&&s.stock.length>0;
 s.players[winner].taken.push(...s.trick.map(t=>t.card));if(!wasDrawing)s.players[winner].tricks++;s.lastTrick=s.trick;s.trick=[];s.turn=winner;c.trickNo++;record(s,'trick',winner);
 if(s.game==='germanwhist'&&wasDrawing){s.players[winner].hand.push(s.stock.pop()!);s.players[1-winner].hand.push(s.stock.pop()!);s.players.forEach(p=>p.hand=sorted(p.hand));s.extra.indicator=s.stock.at(-1)??-1;}
 if(s.game==='chinesewhist')c.rows.forEach((row,i)=>row.forEach((card,j)=>{if(card<0&&c.hidden[i][j]>=0){row[j]=c.hidden[i][j];c.hidden[i][j]=-1;}}));
 const empty=s.players.filter(p=>!p.out).every(p=>!p.hand.length)&&(s.game!=='chinesewhist'||c.rows.every(row=>row.every(card=>card<0)));
 if(empty)endDeal(s);
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn,n=s.players.length;
 if(e.step==='whistVote'){
  e.selections[i]=a.cards!;s.turn=(i+1)%n;
  if(e.selections.every(cs=>cs.length)){
   let firstBlack=-1;for(let k=1;k<=n;k++){const j=(s.dealer+k)%n,card=e.selections[j][0];c.bids[j]=card;if([0,3].includes(suit(card))){firstBlack=j;break;}}
   c.contract=firstBlack>=0?1:0;c.caller=firstBlack;s.turn=firstBlack>=0?(firstBlack+n-1)%n:nextSeat(s,s.dealer);e.step='play';
  }return;
 }
 if(e.step==='chineseTrump'){s.trump=a.suit!;s.turn=nextSeat(s,s.dealer);e.step='play';return;}
 if(e.step==='euchreBlind'){c.indicatorSuit=a.suit!;e.step='euchreBid1';s.turn=nextSeat(s,s.dealer);return;}
 if(e.step==='euchreBid1'||e.step==='euchreBid2'){
  if(a.type==='pass'){
   c.passes++;s.turn=(i+1)%n;if(c.passes===n){if(e.step==='euchreBid1'){e.step='euchreBid2';e.indicator=-1;c.passes=0;}else roundOver(s);}return;
  }
  c.caller=i;s.trump=a.suit!;c.contract=a.alone?1:0;if(a.alone)s.players[(i+2)%4].out=true;
  record(s,'contract',i,a.alone?1:0);if(e.step==='euchreBid1'){e.step='euchreSwap';s.turn=s.dealer;}else readyEuchre(s);return;
 }
 if(e.step==='euchreSwap'){
  if(a.type==='discard'){removeCards(s,i,a.cards!);s.discard.push(a.cards![0]);s.players[i].hand=sorted([...s.players[i].hand,s.stock.pop()!]);}readyEuchre(s);return;
 }
 if(e.step==='napBid'){
  if(a.type==='bid'){c.contract=a.value!;c.caller=i;s.players[i].bid=a.value!;record(s,'bid',i,a.value);}
  c.passes++;s.turn=(i+1)%n;
  if(c.passes===n){if(c.caller<0)fixedDeals(s,2);else {e.step='play';s.turn=c.caller;}}return;
 }
 if(e.step==='napoleonBid'){
  if(a.type==='bid'){c.contract=a.value!;c.caller=i;s.trump=a.suit!;c.passes=0;s.players[i].bid=a.value!;record(s,'bid',i,a.value);}
  else c.passes++;
  s.turn=(i+1)%n;
  if(c.caller>=0&&c.passes===n-1){e.step='napoleonName';s.turn=c.caller;}
  else if(c.caller<0&&c.passes===n)fixedDeals(s,1);return;
 }
 if(e.step==='napoleonName'){
  c.partnerCard=a.cards![0];c.partner=s.players.findIndex((p,j)=>j!==i&&p.hand.includes(c.partnerCard));c.banned=s.stock.length;s.players[i].hand=sorted([...s.players[i].hand,...s.stock]);s.stock=[];e.step='napoleonDiscard';record(s,'name',i,undefined,c.partnerCard);return;
 }
 if(e.step==='napoleonDiscard'){
  const card=a.cards![0];removeCards(s,i,[card]);s.discard.push(card);c.banned--;if(countingCard(card))record(s,'faceDiscard',i,undefined,card);
  if(!c.banned){e.step='play';s.turn=c.caller;}return;
 }
 playCard(s,a.cards![0]);
}
function bestSuit(cards:number[],game:string){return [0,1,2,3].sort((a,b)=>suitEstimate(cards,game,b)-suitEstimate(cards,game,a))[0];}
function suitEstimate(cards:number[],game:string,trump:number){return cards.reduce((n,card)=>n+(classicSuit(game,card,trump)===trump?(rank(card)===11||card===52?2:high(card)>=12?1.3:.7):high(card)===14?.6:0),0);}
function cpu(v:ClubView):Action|undefined{
 const e=v.extra,c=e.classic!,hand=[...v.players[v.self].hand,...v.game==='chinesewhist'?c.rows[v.self].filter(x=>x>=0):[]],a=v.actions;
 if(e.step==='whistVote'){
  const wantHigh=hand.reduce((n,c)=>n+(high(c)>=12?high(c)-11:0),0)>=9;
  return a.find(x=>[0,3].includes(suit(x.cards![0]))===wantHigh)||a[0];
 }
 if(e.step==='chineseTrump')return a.find(x=>x.suit===bestSuit(hand,v.game))||a[0];
 if(e.step==='euchreBlind')return a[(v.revision*7)%4];
 if(e.step==='euchreBid1'||e.step==='euchreBid2'){
  const orders=a.filter(x=>x.type==='order'),best=[...orders].sort((x,y)=>suitEstimate(hand,v.game,y.suit!)-suitEstimate(hand,v.game,x.suit!))[0];
  const strength=best?suitEstimate(hand,v.game,best.suit!):0;return strength>=3?a.find(x=>x.type==='order'&&x.suit===best.suit&&!!x.alone===(strength>=5.5))||best:a[0];
 }
 if(e.step==='napBid'){
  const strength=suitEstimate(hand,v.game,bestSuit(hand,v.game)),limit=strength>=4?5:strength>=3?4:strength>=2.2?2:1;
  return [...a].filter(x=>x.type==='bid'&&x.value!<=limit&&x.value!==3).sort((x,y)=>y.value!-x.value!)[0]||a[0];
 }
 if(e.step==='napoleonBid'){
  const st=bestSuit(hand,v.game),estimate=Math.min(19,Math.max(10,hand.filter(countingCard).length+4+Math.floor(suitEstimate(hand,v.game,st))));
  return [...a].filter(x=>x.type==='bid'&&x.suit===st&&x.value!<=estimate).sort((x,y)=>x.value!-y.value!)[0]||a[0];
 }
 if(e.step==='napoleonName')return a.find(x=>x.cards![0]===39&&!hand.includes(39))||a.find(x=>!hand.includes(x.cards![0])&&countingCard(x.cards![0]))||a[0];
 if(e.step==='euchreSwap'||e.step==='napoleonDiscard'){
  const choices=a.filter(x=>x.type==='discard'),cost=(card:number)=>classicWeight(v.game,card,v.trump,-1)+(countingCard(card)?100:0);
  return [...choices].sort((x,y)=>cost(x.cards![0])-cost(y.cards![0]))[0]||a[0];
 }
 const lose=v.game==='minnesotawhist'&&c.contract===0||v.game==='nap'&&c.contract===3&&c.caller===v.self;
 const weight=(card:number)=>classicWeight(v.game,card,v.trump,v.trick.length?classicSuit(v.game,v.trick[0].card,v.trump):-1);
 if(!v.trick.length)return [...a].sort((x,y)=>(lose?1:-1)*(weight(x.cards![0])-weight(y.cards![0])))[0];
 const winner=classicWinner(v.game,v.trick,v.trump,c.trickNo===0),team=v.players.length===4&&v.game!=='knockout'&&v.game!=='nap'&&v.game!=='napoleon';
 const ownNapTeam=v.self===c.caller||hand.includes(c.partnerCard)||c.revealed&&v.self===c.partner;
 const ally=team&&winner%2===v.self%2||v.game==='napoleon'&&c.revealed&&([c.caller,c.partner].includes(winner)===ownNapTeam);
 const wins=a.filter(x=>classicWinner(v.game,[...v.trick,{player:v.self,card:x.cards![0]}],v.trump,c.trickNo===0)===v.self);
 return [...(!lose&&!ally&&wins.length?wins:a)].sort((x,y)=>weight(x.cards![0])-weight(y.cards![0]))[0];
}
export const classicTrickRules:RuleExtension={start,actions,apply,cpu,nextDealer:s=>s.game==='knockout'?s.extra.classic!.nextDealer:(s.dealer+1)%s.players.length};
