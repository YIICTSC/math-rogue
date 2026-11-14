import {pack,rank,high,suit,shuffled,combinations} from './cards';
import type {Action,ClubState,ClubView} from './model';
import type {RuleExtension} from './extensionModel';
import {dealCards,nextSeat,record,removeCards,roundOver,finish} from './ruleHelpers';
import {initClassic,fixedDeals} from './classicCommon';
export const yanivValue=(c:number)=>c>=52?0:Math.min(10,rank(c));
export function yanivDiscard(cards:number[]){
 if(cards.length===1)return true;if(cards.length<2)return false;
 if(cards.every(c=>c<52&&rank(c)===rank(cards[0])))return true;
 if(cards.length<3)return false;const real=cards.filter(c=>c<52),wild=cards.length-real.length;
 if(!real.length||real.some(c=>suit(c)!==suit(real[0])))return false;
 const nums=real.map(rank).sort((a,b)=>a-b);if(new Set(nums).size!==nums.length)return false;
 return nums.at(-1)!-nums[0]+1<=cards.length&&nums.at(-1)!-nums[0]+1-nums.length<=wild;
}
const handPoints=(cards:number[])=>cards.reduce((n,c)=>n+yanivValue(c),0);
function yanivActions(s:ClubState):Action[]{
 if(s.extra.step==='yanivDraw')return [{type:'draw'},...s.extra.classic!.shown[s.turn].map(index=>({type:'pick' as const,index}))];
 const hand=s.players[s.turn].hand,groups=Array.from({length:hand.length},(_,i)=>combinations(hand,i+1)).flat().filter(yanivDiscard);
 return [...handPoints(hand)<=5?[{type:'knock' as const}]:[],...groups.map(cards=>({type:'discard' as const,cards:[...cards].sort((a,b)=>(a>=52?99:rank(a))-(b>=52?99:rank(b)))}))];
}
export const yanivRules:RuleExtension={start:s=>{initClassic(s);s.stock=shuffled([...pack(),52,53],s.seed+s.round*1009);dealCards(s,5);s.table=[s.stock.pop()!];s.turn=nextSeat(s,s.dealer);s.extra.step='yanivDiscard';},actions:yanivActions,apply:(s,a)=>{
 const c=s.extra.classic!,i=s.turn,p=s.players[i];
 if(a.type==='knock'){
  const points=s.players.map(q=>q.out?Infinity:handPoints(q.hand)),caught=points.some((n,j)=>j!==i&&n<=points[i]);
  s.players.forEach((q,j)=>{if(q.out)return;let penalty=j===i?(caught?points[j]+30:0):points[j];let total=-q.score+penalty;if(total===100||total===200)total/=2;q.score=-total;q.out=total>200;});
  const least=Math.min(...points),leader=Array.from({length:s.players.length},(_,k)=>(i+k+1)%s.players.length).find(j=>points[j]===least)!;c.nextDealer=(leader+s.players.length-1)%s.players.length;record(s,caught?'challenge':'knock',i);const alive=s.players.flatMap((q,j)=>q.out?[]:[j]);if(alive.length<=1)finish(s,alive.length?alive:undefined);else roundOver(s);return;
 }
 if(a.type==='discard'){const previous=[...s.table];c.shown[i]=previous.length?[previous[0],previous.at(-1)!].filter((v,k,a)=>a.indexOf(v)===k):[];s.discard.push(...s.table);removeCards(s,i,a.cards!);s.table=[...a.cards!];s.extra.step='yanivDraw';record(s,'discard',i,a.cards!.length);return;}
 if(a.type==='pick'){s.discard=s.discard.filter(x=>x!==a.index);p.hand.push(a.index!);}else{if(!s.stock.length){s.stock=shuffled(s.discard,s.seed+s.revision);s.discard=[];}if(s.stock.length)p.hand.push(s.stock.pop()!);}
 c.shown[i]=[];s.turn=nextSeat(s);s.extra.step='yanivDiscard';
 },nextDealer:s=>s.extra.classic?.nextDealer??s.dealer,cpu:v=>{if(v.extra.step==='yanivDraw'){const picks=v.actions.filter(a=>a.type==='pick').sort((a,b)=>yanivValue(a.index!)-yanivValue(b.index!));const pick=picks[0];return pick&&(v.table.length>1||yanivValue(pick.index!)<Math.min(...v.table.map(yanivValue)))?pick:v.actions[0];}return v.actions.find(a=>a.type==='knock')||[...v.actions].sort((a,b)=>(b.cards?.length||0)*20+handPoints(b.cards||[])-(a.cards?.length||0)*20-handPoints(a.cards||[]))[0];}};
function mitchDraw(s:ClubState){const c=s.extra.classic!;while(c.passes<3&&s.stock.length){const card=s.stock.pop()!;if(rank(card)===1){s.discard.push(card);c.passes++;if(c.passes===3){s.players.forEach((p,i)=>{if(c.rows.slice(i*4,i*4+4).every(r=>!r.length)&&c.go[i])p.score-=10;});return;}}else{s.players[s.turn].hand.push(card);return;}}}
export const mitchRules:RuleExtension={start:s=>{const c=initClassic(s);c.rows=Array.from({length:s.players.length*4},()=>[]);c.passes=0;s.turn=nextSeat(s,s.dealer);dealCards(s,5);for(const p of s.players){for(const card of [...p.hand])if(rank(card)===1){removeCards(s,s.players.indexOf(p),[card]);s.discard.push(card);c.passes++;while(s.stock.length){const x=s.stock.pop()!;if(rank(x)===1){s.discard.push(x);c.passes++;}else{p.hand.push(x);break;}}}}mitchDraw(s);},actions:s=>s.players[s.turn].hand.flatMap(card=>{const row=s.extra.classic!.rows[s.turn*4+suit(card)];return [{type:'discard' as const,cards:[card]},...(!row.length||rank(card)<rank(row.at(-1)!))?[{type:'play' as const,cards:[card]}]:[]];}),apply:(s,a)=>{
 const c=s.extra.classic!,i=s.turn,card=a.cards![0];removeCards(s,i,[card]);if(a.type==='play')c.rows[i*4+suit(card)].push(card);else s.discard.push(card);c.go[i]=true;record(s,a.type,i,undefined,card);
 if(s.players.every(p=>!p.hand.length)){
  for(let color=0;color<4;color++){const rows=s.players.map((_,j)=>c.rows[j*4+color]);const order=rows.map((r,j)=>({j,n:r.length,low:r.length?rank(r.at(-1)!):0})).sort((a,b)=>b.n-a.n||b.low-a.low);if(!order[0].n)continue;s.players.forEach((p,j)=>p.score+=j===order[0].j?4:-rows[j].length);}
  fixedDeals(s,2);return;
 }
 do{s.turn=nextSeat(s);}while(!s.players[s.turn].hand.length&&(c.passes>=3||!s.stock.length));mitchDraw(s);
 },cpu:v=>v.actions.find(a=>a.type==='play')||v.actions[0]};
export type BullClaim={type:number;rank:number;second?:number;suit?:number};
export const BULL_CLAIMS:BullClaim[]=[
 ...[0,1,3,5].flatMap(type=>Array.from({length:13},(_,i)=>({type,rank:i+2}))),
 ...combinations(Array.from({length:13},(_,i)=>i+2),2).map(([a,b])=>({type:2,rank:b,second:a})),
 ...Array.from({length:13},(_,i)=>i+2).flatMap(rank=>Array.from({length:13},(_,i)=>i+2).filter(x=>x!==rank).map(second=>({type:4,rank,second}))),
 ...Array.from({length:10},(_,i)=>i+5).flatMap(rank=>[0,1,2,3].map(suit=>({type:6,rank,suit}))),
].sort((a:BullClaim,b:BullClaim)=>a.type-b.type||a.rank-b.rank||(a.second||0)-(b.second||0)||(a.suit||0)-(b.suit||0));
export function bullClaimHolds(cards:number[],claim:BullClaim){
 const count=(n:number)=>cards.filter(c=>high(c)===n).length;
 if(claim.type===6)return Array.from({length:5},(_,i)=>claim.rank-i).every(n=>cards.some(c=>suit(c)===claim.suit&&high(c)===(n===1?14:n)));
 if(claim.type===2)return count(claim.rank)>=2&&count(claim.second!)>=2;
 if(claim.type===4)return count(claim.rank)>=3&&count(claim.second!)>=2;
 return count(claim.rank)>=[1,2,0,3,0,4][claim.type];
}
export const bullLabel=(index:number,en=false)=>{const c=BULL_CLAIMS[index],r=(n:number)=>n===14?'A':n===13?'K':n===12?'Q':n===11?'J':String(n);return `${(en?['High card','Pair','Two pairs','Three of a kind','Full house','Four of a kind','Straight flush']:['1枚','ワンペア','ツーペア','スリーカード','フルハウス','フォーカード','ストレートフラッシュ'])[c.type]} ${r(c.rank)}${c.second?' + '+r(c.second):''}${c.suit!==undefined?' ♣♦♥♠'[c.suit+1]:''}`;};
export const pokerBullRules:RuleExtension={start:s=>{initClassic(s);s.claim=-1;s.players.forEach(p=>{if(s.round===0)p.lives=5;if(!p.out)for(let i=0;i<1+5-p.lives;i++)p.hand.push(s.stock.pop()!);});s.turn=nextSeat(s,s.dealer);s.extra.claimant=-1;},actions:s=>{
 const remaining=BULL_CLAIMS.map((c,value)=>({c,value})).filter(({value,c})=>s.claim<0||c.type>BULL_CLAIMS[s.claim].type||c.type===BULL_CLAIMS[s.claim].type&&(c.rank>BULL_CLAIMS[s.claim].rank||c.rank===BULL_CLAIMS[s.claim].rank&&(c.second||0)>(BULL_CLAIMS[s.claim].second||0)));
 return [...s.claim>=0?[{type:'challenge' as const}]:[],...remaining.map(({value})=>({type:'bid' as const,value}))];
 },apply:(s,a)=>{if(a.type==='bid'){s.claim=a.value!;s.extra.claimant=s.turn;record(s,'bid',s.turn,s.claim);s.turn=nextSeat(s);return;}
 const loser=bullClaimHolds(s.players.flatMap(p=>p.hand),BULL_CLAIMS[s.claim])?s.turn:s.extra.claimant;s.players[loser].lives--;s.players[loser].score--;s.players[loser].out=s.players[loser].lives<=0;s.extra.classic!.nextDealer=loser;record(s,'challenge',loser);
 const alive=s.players.flatMap((p,i)=>p.out?[]:[i]);if(alive.length===1)finish(s,alive);else roundOver(s);
 },nextDealer:s=>s.extra.classic?.nextDealer??-1,cpu:v=>{
 const own=v.players[v.self].hand,held=v.actions.filter(a=>a.type==='bid'&&bullClaimHolds(own,BULL_CLAIMS[a.value!]));return held[0]||v.actions.find(a=>a.type==='challenge')||v.actions.find(a=>a.type==='bid');}};
export const trumpCrewRules:RuleExtension={start:s=>{
 const c=initClassic(s),stage=s.players[0].score+1;c.handSize=stage;c.contract=stage;s.stock=shuffled([...pack(),52],s.seed+s.round*1009);dealCards(s,stage);s.extra.indicator=s.stock.pop()!;s.trump=s.extra.indicator===52?-1:suit(s.extra.indicator);s.turn=s.dealer;s.extra.step='crewStrength';s.players.forEach(p=>p.bid=null);
 },actions:s=>{
 const c=s.extra.classic!;
 if(s.extra.step==='crewStrength')return [0,1,2].map(value=>({type:'name',value}));
 if(s.extra.step==='crewBid')return (s.turn===s.dealer?[c.contract]:Array.from({length:c.contract+1},(_,i)=>i)).map(value=>({type:'bid',value}));
 const hand=s.players[s.turn].hand,lead=s.activeSuit,following=s.trick.length&&lead>=0&&hand.some(c=>c<52&&suit(c)===lead);
 return hand.filter(c=>c===52||!following||suit(c)===lead).flatMap(card=>card===52&&!s.trick.length?[-1,0,1,2,3].map(suit=>({type:'play' as const,cards:[card],suit})):[{type:'play' as const,cards:[card]}]);
 },apply:(s,a)=>{
 const c=s.extra.classic!,i=s.turn;
 if(a.type==='name'){s.extra.multiplier=a.value!;s.extra.step='crewBid';s.turn=nextSeat(s,s.dealer);record(s,'bid',i,a.value);return;}
 if(a.type==='bid'){s.players[i].bid=a.value!;c.contract-=a.value!;record(s,'bid',i,a.value);s.turn=nextSeat(s);if(i===s.dealer){s.extra.step='crewPlay';s.turn=nextSeat(s,s.dealer);}return;}
 const card=a.cards![0];removeCards(s,i,[card]);if(!s.trick.length)s.activeSuit=card===52?(a.suit??-1):suit(card);s.trick.push({player:i,card});record(s,'play',i,undefined,card);
 if(s.trick.length<s.players.length){s.turn=nextSeat(s);return;}
 const weight=(card:number)=>card===52?1000:(suit(card)===s.trump?100:suit(card)===s.activeSuit?50:0)+high(card),winner=s.trick.reduce((a,b)=>weight(a.card)>weight(b.card)?a:b).player;
 s.players[winner].tricks++;s.players[winner].taken.push(...s.trick.map(t=>t.card));s.lastTrick=s.trick;s.trick=[];s.turn=winner;
 if(s.players.every(p=>!p.hand.length)){const success=s.players.every(p=>p.tricks===p.bid);if(success)s.players.forEach(p=>p.score++);record(s,success?'crewSuccess':'crewRetry');if(success&&s.players[0].score>=Math.floor(52/s.players.length))finish(s,s.players.map((_,i)=>i));else roundOver(s);}
 },cpu:v=>{const hand=v.players[v.self].hand,c=v.extra.classic!;if(v.extra.step==='crewStrength'){const value=hand.filter(card=>card===52||suit(card)===v.trump&&high(card)>10).length;return v.actions.find(a=>a.value===(value?value>1?2:1:0));}if(v.extra.step==='crewBid'){const estimate=hand.filter(card=>card===52||suit(card)===v.trump&&high(card)>=11).length;return v.actions.find(a=>a.value===Math.min(c.contract,estimate))||v.actions[0];}
 const need=(v.players[v.self].bid||0)>v.players[v.self].tricks,weight=(a:Action)=>a.cards![0]===52?100:(suit(a.cards![0])===v.trump?20:0)+high(a.cards![0]);return [...v.actions].sort((a,b)=>need?weight(b)-weight(a):weight(a)-weight(b))[0];}};
