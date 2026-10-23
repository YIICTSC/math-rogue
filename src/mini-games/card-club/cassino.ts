import { rank,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic } from './classicCommon';
interface Unit {cards:number[];value:number;locked:boolean;owner:number;build:number;loose:number}
const units=(s:ClubState|ClubView):Unit[]=>[...s.table.map((card,i)=>({cards:[card],value:rank(card),locked:false,owner:-1,build:-1,loose:i})),...s.extra.classic!.rows.map((cards,i)=>({cards,value:s.extra.classic!.bids[i],locked:s.extra.classic!.go[i],owner:s.extra.classic!.owners[i],build:i,loose:-1}))];
/** All selected units must partition into groups of the played value. Builds stay indivisible. */
export function casinoPartition(values:{value:number;locked:boolean}[],target:number):boolean{
 if(!values.length)return true;
 const first=values[0];if(first.value===target&&casinoPartition(values.slice(1),target))return true;
 if(first.locked||target>10||first.value>target||first.value>10)return false;
 const pick=(at:number,sum:number,taken:number[]):boolean=>{
  if(sum===target)return casinoPartition(values.filter((_,i)=>i!==0&&!taken.includes(i)),target);
  if(sum>target)return false;
  for(let i=at;i<values.length;i++)if(!values[i].locked&&values[i].value<=10&&pick(i+1,sum+values[i].value,[...taken,i]))return true;
  return false;
 };return pick(1,first.value,[]);
}
function selectedUnits(s:ClubState|ClubView,cards:number[]){
 const all=units(s),selected=all.filter(u=>u.cards.some(c=>cards.includes(c)));
 return selected.every(u=>u.cards.every(c=>cards.includes(c)))&&selected.flatMap(u=>u.cards).length===cards.length?selected:null;
}
function promises(s:ClubState|ClubView,hand:number[],gone:Unit[]){return units(s).every(u=>u.owner!==s.turn||gone.some(g=>g.build===u.build&&g.loose===u.loose)||hand.some(card=>rank(card)===u.value));}
export function casinoCaptureValid(s:ClubState|ClubView,a:Action){
 if(a.type!=='play'||Object.keys(a).some(k=>!['type','cards'].includes(k))||!Array.isArray(a.cards)||!a.cards.length||new Set(a.cards).size!==a.cards.length)return false;
 const [card,...captured]=a.cards;if(!s.players[s.turn].hand.includes(card))return false;
 const selected=selectedUnits(s,captured);if(!selected||!casinoPartition(selected,rank(card)))return false;
 return promises(s,s.players[s.turn].hand.filter(c=>c!==card),selected);
}
/** A build extends exactly one whole loose card/build, as required by this table. */
export function casinoBuildValid(s:ClubState|ClubView,a:Action){
 if(a.type!=='build'||Object.keys(a).some(k=>!['type','cards','value'].includes(k))||!Array.isArray(a.cards)||a.cards.length<2||new Set(a.cards).size!==a.cards.length||!Number.isInteger(a.value))return false;
 const [card,...rest]=a.cards,target=a.value!,hand=s.players[s.turn].hand;
 if(!hand.includes(card)||!hand.some(c=>c!==card&&rank(c)===target))return false;
 const chosen=selectedUnits(s,rest);if(!chosen||chosen.length!==1||!promises(s,hand.filter(c=>c!==card),chosen))return false;
 // Each subgroup is either an existing compound of this target or a new numeric sum.
 // Requiring a complete partition also rejects partial builds and mismatched faces.
 return casinoPartition([{value:rank(card),locked:rank(card)>10},...chosen],target);
}
function captureGroups(all:Unit[],target:number){
 const groups:number[][]=[];for(let i=0;i<all.length;i++)if(all[i].value===target)groups.push([i]);
 if(target>10)return groups;
 const search=(at:number,sum:number,chosen:number[])=>{
  if(groups.length>=192)return;
  if(sum===target){if(chosen.length>1)groups.push(chosen);return;}
  for(let i=at;i<all.length;i++)if(!all[i].locked&&all[i].value<=10&&sum+all[i].value<=target)search(i+1,sum+all[i].value,[...chosen,i]);
 };search(0,0,[]);return groups;
}
function captureCandidates(s:ClubState,card:number){
 const all=units(s),groups=captureGroups(all,rank(card));let best:number[]=[],work=0;
 const visit=(at:number,chosen:number[])=>{
  if(++work>1200)return;
  if(chosen.reduce((n,i)=>n+all[i].cards.length,0)>best.reduce((n,i)=>n+all[i].cards.length,0))best=chosen;
  for(let i=at;i<groups.length;i++)if(!groups[i].some(index=>chosen.includes(index)))visit(i+1,[...chosen,...groups[i]]);
 };visit(0,[]);
 const candidates=[[],best,...groups.slice(0,32)].map(indices=>({type:'play' as const,cards:[card,...indices.flatMap(i=>all[i].cards)]}));
 return candidates.filter((a,i)=>candidates.findIndex(b=>JSON.stringify(a)===JSON.stringify(b))===i&&casinoCaptureValid(s,a));
}
function buildActions(s:ClubState):Action[]{
 const all=units(s),hand=s.players[s.turn].hand,actions:Action[]=[];
 for(const card of hand){const after=hand.filter(c=>c!==card);for(let index=0;index<all.length;index++){
  const unit=all[index];if(!promises(s,after,[unit]))continue;
  if(rank(card)===unit.value&&after.some(c=>rank(c)===unit.value))actions.push({type:'build',cards:[card],index,value:unit.value,form:'set'});
  const sum=rank(card)+unit.value;
  if(!unit.locked&&rank(card)<=10&&unit.value<=10&&sum<=10&&after.some(c=>rank(c)===sum))actions.push({type:'build',cards:[card],index,value:sum,form:'run'});
 }}return actions;
}
function start(s:ClubState){const c=initClassic(s);c.rows=[];c.bids=[];c.go=[];c.owners=[];dealCards(s,4);s.table=s.stock.splice(-4);s.turn=nextSeat(s,s.dealer);}
function actions(s:ClubState):Action[]{return [...s.players[s.turn].hand.flatMap(card=>captureCandidates(s,card)),...buildActions(s)];}
function removeUnits(s:ClubState,taken:Unit[]){
 const c=s.extra.classic!;s.table=s.table.filter(card=>!taken.some(u=>u.cards.includes(card)));
 const keep=c.rows.map((_,i)=>i).filter(i=>!taken.some(u=>u.build===i));c.rows=keep.map(i=>c.rows[i]);c.bids=keep.map(i=>c.bids[i]);c.go=keep.map(i=>c.go[i]);c.owners=keep.map(i=>c.owners[i]);
}
function score(s:ClubState){
 const c=s.extra.classic!,last=s.capturesBy;
 if(last>=0){s.players[last].taken.push(...s.table,...c.rows.flat());s.table=[];c.rows=[];c.bids=[];c.go=[];c.owners=[];}
 const teams=s.players.length===4?2:s.players.length,groups=Array.from({length:teams},(_,i)=>s.players.flatMap((p,j)=>j%teams===i?p.taken:[]));
 const counts=groups.map(cs=>cs.length),spades=groups.map(cs=>cs.filter(card=>suit(card)===3).length);
 groups.forEach((cards,team)=>{
  const points=cards.filter(card=>rank(card)===1).length+(cards.includes(22)?2:0)+(cards.includes(40)?1:0)+(counts.filter(n=>n===Math.max(...counts)).length===1&&counts[team]===Math.max(...counts)?3:0)+(spades.filter(n=>n===Math.max(...spades)).length===1&&spades[team]===Math.max(...spades)?1:0);
  s.players.forEach((p,i)=>{if(i%teams===team)p.score+=points;});
 });
 const scores=Array.from({length:teams},(_,i)=>s.players[i].score),max=Math.max(...scores);
 if(max>=21&&scores.filter(n=>n===max).length===1)finish(s);else roundOver(s);
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn,card=a.cards![0],all=units(s);removeCards(s,i,[card]);
 if(a.type==='build'){
  const chosen=a.index===undefined?selectedUnits(s,a.cards!.slice(1))!: [all[a.index]];removeUnits(s,chosen);c.rows.push([...chosen.flatMap(u=>u.cards),card]);c.bids.push(a.value!);c.go.push(a.index===undefined?rank(card)+chosen.reduce((sum,u)=>sum+u.value,0)!==a.value||chosen.some(u=>u.locked):a.form==='set');c.owners.push(i);record(s,'build',i,a.value);
 }else{
  const captured=a.cards!.slice(1),selected=all.filter(u=>u.cards.some(card=>captured.includes(card)));
  if(captured.length){removeUnits(s,selected);s.players[i].taken.push(card,...captured);s.capturesBy=i;record(s,'capture',i,captured.length,card);
   if(!s.table.length&&!c.rows.length){s.players.forEach((p,j)=>{if(j===i||s.players.length===4&&j%2===i%2)p.score++;});record(s,'sweep',i);}
  }else {s.table.push(card);record(s,'play',i,undefined,card);}
 }
 s.turn=nextSeat(s);
 if(s.players.every(p=>!p.hand.length)){if(s.stock.length)dealCards(s,4);else score(s);}
}
function cpu(v:ClubView):Action|undefined{
 const plays=v.actions.filter(a=>a.type==='play'),worth=(a:Action)=>a.cards!.length*4+a.cards!.slice(1).reduce((n,card)=>n+(rank(card)===1?3:0)+(card===22?5:0)+(card===40?3:0)+(suit(card)===3?1:0),0);
 const best=[...plays].sort((a,b)=>worth(b)-worth(a))[0];if(best&&best.cards!.length>1)return best;
 return v.actions.find(a=>a.type==='build')||best||v.actions[0];
}
export const cassinoRules:RuleExtension={start,actions,apply,cpu,validate:(s,a)=>casinoCaptureValid(s,a)||casinoBuildValid(s,a)};
