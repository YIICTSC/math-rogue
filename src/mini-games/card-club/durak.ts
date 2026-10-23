import { high,rank,sorted,suit } from './cards';
import type { Action,ClubState,ClubView } from './model';
import type { RuleExtension } from './extensionModel';
import { dealCards,finish,nextSeat,record,removeCards } from './ruleHelpers';
import { initClassic,resetClassicDeck } from './classicCommon';
export const durakBeats=(defense:number,attack:number,trump:number)=>suit(defense)===suit(attack)?high(defense)>high(attack):suit(defense)===trump&&suit(attack)!==trump;
function begin(s:ClubState,attacker:number){
 const c=s.extra.classic!;c.attacker=attacker;c.defender=nextSeat(s,attacker);c.first=attacker;c.limit=Math.min(6,s.players[c.defender].hand.length);c.rows=c.rows.map(()=>[]);c.passes=0;s.turn=attacker;s.extra.step='durakAttack';
}
function start(s:ClubState){
 initClassic(s);resetClassicDeck(s);dealCards(s,6);
 const e=s.extra;e.indicator=s.stock.length?s.stock.pop()!:s.players[s.dealer].hand.at(-1)!;s.trump=suit(e.indicator);if(s.stock.length||s.players.length<6)s.stock.unshift(e.indicator);
 const low=s.players.flatMap((p,i)=>p.hand.filter(c=>suit(c)===s.trump).map(card=>({i,card}))).sort((a,b)=>high(a.card)-high(b.card))[0];begin(s,low?.i??nextSeat(s,s.dealer));
}
function actions(s:ClubState):Action[]{
 const c=s.extra.classic!,hand=s.players[s.turn].hand,attacks=c.rows[0],defenses=c.rows[1];
 if(s.extra.step==='durakAttack'){
  const ranks=[...attacks,...defenses].map(rank);return [...hand.filter(card=>!attacks.length||ranks.includes(rank(card))).map(card=>({type:'play' as const,cards:[card]})),...attacks.length?[{type:'pass' as const}]:[]];
 }
 const attack=attacks[defenses.length];
 const moves:Action[]=[...hand.filter(card=>durakBeats(card,attack,s.trump)).map(card=>({type:'defend' as const,cards:[card]})),{type:'take'}];
 const next=nextSeat(s,c.defender);
 if(s.game==='perevodnoy'&&!defenses.length&&attacks.length<6&&attacks.every(card=>rank(card)===rank(attacks[0]))&&s.players[next].hand.length>=attacks.length+1)
  moves.push(...hand.filter(card=>rank(card)===rank(attacks[0])).map(card=>({type:'transfer' as const,cards:[card]})));
 return moves;
}
function complete(s:ClubState,success:boolean){
 const c=s.extra.classic!,defender=c.defender;let next=success?defender:nextSeat(s,defender);
 const cards=[...c.rows[0],...c.rows[1]];if(success)s.discard.push(...cards);else s.players[defender].hand=sorted([...s.players[defender].hand,...cards]);c.rows=c.rows.map(()=>[]);
 const order=Array.from({length:s.players.length},(_,i)=>(c.first+i)%s.players.length);
 const refill=s.game==='perevodnoy'&&c.passes?order:[...order.filter(i=>i!==defender),defender];
 for(const i of refill)while(s.stock.length&&s.players[i].hand.length<6)s.players[i].hand.push(s.stock.pop()!);
 s.extra.indicator=s.stock.includes(s.extra.indicator)?s.extra.indicator:-1;
 s.players.forEach(p=>{p.hand=sorted(p.hand);p.out=!s.stock.length&&!p.hand.length;});
 const alive=s.players.flatMap((p,i)=>p.out?[]:[i]);
 if(alive.length<=1){s.players.forEach(p=>p.score=p.out?1:0);finish(s,alive.length?s.players.flatMap((p,i)=>p.out?[i]:[]):s.players.map((_,i)=>i),alive.length?'durak':'draw');return;}
 if(s.players[next].out)next=nextSeat(s,next);
 const position=`${next}/${s.stock.join(',')}/${s.players.map(p=>p.hand.join(',')).join('|')}`;
 if(s.extra.seen.filter(x=>x===position).length>=2){finish(s,s.players.map((_,i)=>i),'repetition');return;}
 s.extra.seen.push(position);begin(s,next);
}
function apply(s:ClubState,a:Action){
 const c=s.extra.classic!,i=s.turn;
 if(a.type==='pass'){complete(s,true);return;}
 if(a.type==='take'){record(s,'take',i,c.rows.flat().length);complete(s,false);return;}
 const card=a.cards![0];removeCards(s,i,[card]);record(s,a.type,i,undefined,card);
 if(a.type==='play'){c.rows[0].push(card);s.turn=c.defender;s.extra.step='durakDefend';return;}
 if(a.type==='transfer'){
  c.rows[0].push(card);c.attacker=i;c.defender=nextSeat(s,i);c.limit=Math.min(6,s.players[c.defender].hand.length);c.passes++;s.turn=c.defender;return;
 }
 c.rows[1].push(card);
 if(c.rows[1].length<c.rows[0].length)return;
 if(c.rows[0].length>=c.limit||!s.players[c.defender].hand.length){complete(s,true);return;}
 s.turn=c.attacker;s.extra.step='durakAttack';
}
function cpu(v:ClubView):Action|undefined{
 const a=v.actions,weight=(c:number)=>high(c)+(suit(c)===v.trump?20:0);
 if(v.extra.step==='durakAttack')return [...a.filter(x=>x.type==='play')].sort((x,y)=>weight(x.cards![0])-weight(y.cards![0]))[0]||a[0];
 const transfer=a.find(x=>x.type==='transfer');if(transfer)return transfer;
 return [...a.filter(x=>x.type==='defend')].sort((x,y)=>weight(x.cards![0])-weight(y.cards![0]))[0]||a[0];
}
export const durakRules:RuleExtension={start,actions,apply,cpu};
