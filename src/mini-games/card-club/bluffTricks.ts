import { rank } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,record,removeCards,roundOver } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
export const bluffStrength=(game:string,card:number)=>game==='put'?[4,5,6,7,8,9,10,11,12,13,1,2,3].indexOf(rank(card)):[8,9,10,11,12,13,1,6,7].indexOf(rank(card));
function start(s:ClubState){const c=initClassic(s);resetClassicDeck(s);dealCards(s,3);s.turn=1-s.dealer;c.contract=s.game==='put'?5:1;s.extra.step=s.game==='truc'?'trucRedealOffer':'play';}
function actions(s:ClubState):Action[]{
 const e=s.extra,c=e.classic!,hand=s.players[s.turn].hand;
 if(e.step==='trucRedealOffer')return [{type:'draw'},{type:'continue'}];
 if(e.step==='trucRedealReply')return [{type:'accept'},{type:'pass'}];
 if(e.step==='bluffReply')return [{type:'accept'},{type:'pass'},...s.game==='truc'&&c.bids[2]===1?[{type:'bid' as const,value:-1}]:[]];
 if(e.step==='putCheckpoint')return [{type:'bid',value:5},{type:'pass'}];
 const plays:Action[]=hand.map(card=>({type:'play',cards:[card]}));
 if(s.game==='put'&&c.trickNo===0&&!c.go[s.turn])return [...plays,{type:'bid',value:5},{type:'pass'}];
 if(s.game==='truc'&&!c.go[s.turn]&&!c.revealed){const normal=c.contract===1?2:c.contract+2;return [...plays,{type:'bid',value:normal},{type:'bid',value:-1}];}
 return plays;
}
function score(s:ClubState,winner:number,points:number,match=false){
 if(winner<0){roundOver(s);return;}
 if(match)points=12-s.players[winner].score;s.players[winner].score+=points;s.extra.classic!.notes.push({player:winner,label:'gamePoints',points});record(s,'points',winner,points);
 if(match||s.players[winner].score>=(s.game==='put'?5:12))finish(s,[winner]);else roundOver(s);
}
function apply(s:ClubState,a:Action){
 const e=s.extra,c=e.classic!,i=s.turn;
 if(e.step==='trucRedealOffer'){if(a.type==='draw'){e.step='trucRedealReply';s.turn=s.dealer;}else e.step='play';return;}
 if(e.step==='trucRedealReply'){
  if(a.type==='accept'){s.players.forEach(p=>{s.discard.push(...p.hand);p.hand=[];});dealCards(s,3);}e.step='play';s.turn=1-s.dealer;return;
 }
 if(e.step==='bluffReply'){
  if(a.type==='pass'){score(s,c.caller,s.game==='put'?1:c.bids[1]);return;}
  if(a.type==='bid'){c.revealed=true;e.step='play';s.turn=c.last;return;}
  if(s.game==='truc')c.contract=c.bids[0];e.step='play';s.turn=c.last;return;
 }
 if(a.type==='pass'){score(s,1-i,1);return;}
 if(a.type==='bid'){
  const checkpoint=e.step==='putCheckpoint';c.caller=i;c.last=checkpoint?c.first:i;c.go[i]=true;c.bids[1]=c.contract;
  const all=s.game==='truc'&&a.value===-1;c.bids[0]=a.value===-1?12-s.players[i].score:a.value!;c.bids[2]=all?1:0;
  e.step='bluffReply';s.turn=1-i;record(s,'raise',i,c.bids[0]);return;
 }
 const card=a.cards![0];if(!s.trick.length)c.first=i;removeCards(s,i,[card]);s.trick.push({player:i,card});c.go[i]=false;record(s,'play',i,undefined,card);
 if(s.trick.length===1){s.turn=1-i;return;}
 const [lead,follow]=s.trick,aPower=bluffStrength(s.game,lead.card),bPower=bluffStrength(s.game,follow.card),winner=aPower===bPower?-1:aPower>bPower?lead.player:follow.player;
 if(winner>=0){s.players[winner].tricks++;s.players[winner].taken.push(...s.trick.map(t=>t.card));}else s.discard.push(...s.trick.map(t=>t.card));
 c.owners.push(winner);s.lastTrick=s.trick;s.trick=[];c.trickNo++;s.turn=winner>=0?winner:lead.player;c.first=s.turn;
 if(s.game==='put'&&c.trickNo===1){e.step='putCheckpoint';s.turn=1-s.dealer;return;}
 if(s.game==='truc'){
  const first=c.owners.find(w=>w>=0),drawn=c.owners.includes(-1),double=s.players.findIndex(p=>p.tricks>=2);
  if(double>=0||drawn&&first!==undefined){score(s,double>=0?double:first!,c.contract,c.revealed);return;}
 }
 if(c.trickNo===3){const [a,b]=s.players.map(p=>p.tricks);score(s,a===b?-1:a>b?0:1,s.game==='put'?5:c.contract,c.revealed);}
}
function cpu(v:ClubView):Action|undefined{
 const c=v.extra.classic!,hand=v.players[v.self].hand,values=hand.map(card=>bluffStrength(v.game,card)).sort((a,b)=>b-a),strong=values.filter(n=>n>=(v.game==='put'?9:6)).length;
 if(v.extra.step==='trucRedealOffer')return {type:strong?'continue':'draw'};
 if(v.extra.step==='trucRedealReply')return {type:strong?'pass':'accept'};
 if(v.extra.step==='bluffReply')return {type:strong||v.players[1-v.self].score+(v.game==='put'?1:c.bids[1])>= (v.game==='put'?5:12)?'accept':'pass'};
 if(v.extra.step==='putCheckpoint')return {type:strong||v.players[v.self].tricks>v.players[1-v.self].tricks||v.players[1-v.self].score>=4?'bid':'pass',...strong||v.players[v.self].tricks>v.players[1-v.self].tricks||v.players[1-v.self].score>=4?{value:5}:{}};
 if(v.game==='truc'&&strong>=2&&c.contract<4&&v.actions.some(a=>a.type==='bid'))return v.actions.find(a=>a.type==='bid'&&a.value===(c.contract===1?2:c.contract+2))||v.actions[0];
 const plays=v.actions.filter(a=>a.type==='play');if(!v.trick.length)return [...plays].sort((a,b)=>bluffStrength(v.game,b.cards![0])-bluffStrength(v.game,a.cards![0]))[0];
 const wins=plays.filter(a=>bluffStrength(v.game,a.cards![0])>bluffStrength(v.game,v.trick[0].card));return [...(wins.length?wins:plays)].sort((a,b)=>bluffStrength(v.game,a.cards![0])-bluffStrength(v.game,b.cards![0]))[0];
}
export const bluffRules:RuleExtension={start,actions,apply,cpu};
