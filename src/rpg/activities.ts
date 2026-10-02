import type { Card, Relic } from '../types';
import type { World, Adventurer, NativeProfile } from './engine';
import { CARDS_LIBRARY } from '../constants';

export interface Mutation { revision: number; relics?: Relic[]; remove: string[]; cards: Card[]; gold: number; heal: number; }
export interface Trade { id: string; from: string; to: string; accepted: boolean; offers: Record<string, string[]>; confirmed: string[]; expires: number; }
export interface Dungeon { id: string; siteId: string; leader: string; members: string[]; ready: string[]; arrived: string[]; damageActions?: string[]; status: 'lobby' | 'active' | 'complete' | 'aborted'; }
export interface WorldEvent { kind: 'BATTLES' | 'ANSWERS' | 'SEALS'; title: string; target: number; progress: number; expires: number; completed: boolean; finished: boolean; contributors: Record<string, number>; baseline: Record<string, number>; }
export interface Activities { trades: Trade[]; dungeons: Dungeon[]; event: WorldEvent; nextEventAt: number; eventNumber: number; secretsFound: string[]; bossWeakened: boolean; }
export type ActivityAction =
 | { type: 'trade-request'; target: string }
 | { type: 'trade-accept' | 'trade-cancel' | 'trade-confirm'; tradeId: string }
 | { type: 'trade-offer'; tradeId: string; cards: string[] }
 | { type: 'dungeon-damage'; dungeonId:string; target:string; actionId:string; damage:number }
 | { type: 'dungeon-join'; siteId: string }
 | { type: 'dungeon-ready' | 'dungeon-leave' | 'dungeon-start' | 'dungeon-arrived' | 'dungeon-complete' | 'dungeon-abort'; dungeonId: string }
 | { type: 'arcade-play'; siteId: string; game: 'FLIP' | 'ROULETTE' | 'SLOT'; choice: number }
 | { type: 'arcade-finish'; token: string; correctCount: number }
 | { type: 'secret-search'; siteId: string };

const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const pendingMutation = (p: Adventurer) => (p.profile?.mutationRevision || 0) < (p.mutationRevision || 0);
export const activityBusy = (w: World, p: Adventurer) => !!p.life?.work || !!p.life?.indoors || !!p.duelId || !!p.arcadePending || !!p.dungeonId || w.activities.trades.some(t => t.from === p.id || t.to === p.id) || pendingMutation(p);
const available = (w: World, p: Adventurer) => !w.ended && !p.nativeScene && !activityBusy(w,p);
function rewardCard(w:World,p:Adventurer): Card | undefined {
 const pool = Object.values(CARDS_LIBRARY).filter(c => ['COMMON','UNCOMMON','RARE'].includes(c.rarity) && (!c.visualTheme || c.visualTheme === (p.profile?.visualTheme || w.setup?.visualTheme || 'elementary')));
 const card = pool[(w.seed + w.revision * 37) % Math.max(1,pool.length)];
 return card ? {...structuredClone(card),id:`rpg-prize-${p.id}-${w.revision}-${p.mutationRevision || 0}`} : undefined;
}
export function grant(p:Adventurer, change:Omit<Mutation,'revision'>) {
 p.mutationRevision = (p.mutationRevision || 0)+1;
 const mutation = {...change,revision:p.mutationRevision};
 p.mutations = [...(p.mutations || []),mutation];
 if (p.profile) {
   p.profile = {...p.profile, deck:(p.profile.deck || []).filter(c=>!change.remove.includes(c.id)).concat(change.cards), gold:Math.max(0,p.profile.gold+change.gold), hp:Math.min(p.maxHp,p.profile.hp+change.heal)};
   p.profile.deckSize = p.profile.deck.length;
   p.gold=p.profile.gold; p.hp=p.profile.hp;
 }
}
export function acceptProfile(p:Adventurer,profile:NativeProfile) {
 if ((profile.mutationRevision || 0) !== (p.mutationRevision || 0)) return false;
 p.mutations=(p.mutations || []).filter(m=>m.revision>(profile.mutationRevision || 0));
 return true;
}
function event(w:World,now:number,n:number):WorldEvent {
 const kind = (['BATTLES','ANSWERS','SEALS'] as const)[(w.seed+n)%3];
 const count=Math.max(1,Object.values(w.players).filter(p=>!p.spectator).length);
 return {kind,title:kind==='BATTLES'?'図書館を取り戻せ':kind==='ANSWERS'?'知識の灯をともせ':'校長の力を封じろ',target:kind==='SEALS'?3:count*(kind==='ANSWERS'?8:2),progress:0,expires:Math.min(w.deadlineAt,now+180000),completed:false,finished:false,contributors:{},baseline:Object.fromEntries(Object.values(w.players).map(p=>[p.id,kind==='BATTLES'?p.completedBattles:p.correctAnswers]))};
}
export function createActivities():Activities {
 return {trades:[],dungeons:[],event:{kind:'ANSWERS',title:'知識の灯をともせ',target:8,progress:0,expires:0,completed:false,finished:true,contributors:{},baseline:{}},nextEventAt:0,eventNumber:0,secretsFound:[],bossWeakened:false};
}
export function advanceActivities(w:World,now:number) {
 const a=w.activities;
 const before=a.trades.length;
 a.trades=a.trades.filter(t=>!w.ended && t.expires>now && w.players[t.from] && w.players[t.to]);
 if (before!==a.trades.length) w.revision++;
 if(w.ended) {
   for(const p of Object.values(w.players)) delete p.arcadePending;
   for(const d of a.dungeons) if(d.status==='active'||d.status==='lobby') {d.status='aborted'; for(const id of d.members) if(w.players[id]) delete w.players[id].dungeonId; w.revision++;}
   return;
 }
 if(a.event.finished && now>=a.nextEventAt) {a.eventNumber++;a.event=event(w,now,a.eventNumber);w.revision++;}
 const e=a.event;
 if(e.finished) return;
 const target=e.kind==='SEALS'?3:Math.max(1,Object.keys(w.players).length)*(e.kind==='ANSWERS'?8:2);
 if(target>e.target){e.target=target;w.revision++;}
 if(e.kind!=='SEALS') {
   for(const p of Object.values(w.players)) if(e.baseline[p.id]===undefined)e.baseline[p.id]=e.kind==='BATTLES'?p.completedBattles:p.correctAnswers;
   const values=Object.values(w.players).map(p=>[p.id,Math.max(0,(e.kind==='BATTLES'?p.completedBattles:p.correctAnswers)-(e.baseline[p.id] ?? (e.kind==='BATTLES'?p.completedBattles:p.correctAnswers)))] as const);
   const progress=values.reduce((s,[,v])=>s+v,0);
   if(progress!==e.progress){e.progress=progress;e.contributors=Object.fromEntries(values);w.revision++;}
 }
 if(e.progress>=e.target || now>=e.expires) {
   e.finished=true;e.completed=e.progress>=e.target;a.nextEventAt=now+60000;
   if(e.completed) {
     if(e.kind==='SEALS') a.bossWeakened=true;
     for(const p of Object.values(w.players)) {
       const card=rewardCard(w,p);
       grant(p,{remove:[],cards:e.kind==='BATTLES'&&card?[card]:[],gold:20+(e.contributors[p.id]>0?15:0),heal:e.kind==='ANSWERS'?Math.ceil(p.maxHp*.25):0});
       if(e.kind==='ANSWERS') p.siteUses=Object.fromEntries(w.sites.filter(s=>['town','rest','event'].includes(s.kind)).map(s=>[s.id,p.completedBattles-3]));
       p.message=`${e.title}達成！ 共通報酬を獲得。`;
     }
   }
   w.revision++;
 }
}
export function leaveActivities(w:World,id:string) {
 w.activities.trades=w.activities.trades.filter(t=>t.from!==id&&t.to!==id);
 for(const d of w.activities.dungeons) if(d.members.includes(id)) {
   if(d.status==='active'||d.leader===id) {d.status='aborted';for(const pid of d.members) if(w.players[pid]) {delete w.players[pid].dungeonId;w.players[pid].message='ダンジョンを中断しました。';}}
   else {d.members=d.members.filter(pid=>pid!==id);d.ready=d.ready.filter(pid=>pid!==id);}
 }
}
export function applyActivity(w:World,p:Adventurer,action:ActivityAction,now:number):boolean {
 const a=w.activities;
 if(w.ended||p.nativeScene) return false;
 const tell=(text:string)=>{p.message=text;w.revision++;return true;};
 if(action.type==='trade-request') {
   const q=w.players[action.target];
   if(!q||q.spectator||q===p||!available(w,p)||!available(w,q)||distance(p,q)>3||!p.profile?.deck||!q.profile?.deck) return tell('近くの探索中ではない仲間と交換できます。');
   a.trades.push({id:`trade-${w.revision}-${p.id}`,from:p.id,to:q.id,accepted:false,offers:{[p.id]:[],[q.id]:[]},confirmed:[],expires:now+120000});
   return tell('トレードを申し込みました。');
 }
 if(action.type.startsWith('trade-') && 'tradeId' in action) {
   const t=a.trades.find(t=>t.id===action.tradeId);
   if(!t||![t.from,t.to].includes(p.id)) return false;
   if(action.type==='trade-cancel'){a.trades=a.trades.filter(q=>q!==t);return tell('トレードをキャンセルしました。');}
   if(action.type==='trade-accept'&&p.id===t.to){t.accepted=true;return tell('交換するカードを選んでください。');}
   if(!t.accepted) return false;
   if(action.type==='trade-offer') {
     if(!Array.isArray(action.cards)||action.cards.some(id=>typeof id!=='string'))return false;
     const ids=[...new Set(action.cards)];
     if(ids.length>5||ids.some(id=>!p.profile?.deck?.some(c=>c.id===id))) return false;
     t.offers[p.id]=ids;t.confirmed=[];return tell('交換内容を更新しました。');
   }
   if(action.type==='trade-confirm') {
     const participants=[w.players[t.from],w.players[t.to]];
     if(participants.some(q=>!q?.profile?.deck||pendingMutation(q))) return false;
     if(!t.offers[t.from].length||!t.offers[t.to].length) return tell('双方がカードを提示してください。');
     const cards=participants.map(q=>t.offers[q.id].map(id=>q.profile!.deck!.find(c=>c.id===id)));
     if(cards.some(cs=>cs.some(c=>!c))) return false;
     if(participants.some((q,i)=>q.profile!.deck!.length-cards[i].length+cards[1-i].length<5)) return tell('交換後のデッキは5枚以上必要です。');
     if(!t.confirmed.includes(p.id)) t.confirmed.push(p.id);
     if(t.confirmed.length===2) {
       participants.forEach((q,i)=>{grant(q,{remove:t.offers[q.id],cards:cards[1-i].map((c,j)=>({...c!,id:`${t.id}-received-${i}-${j}`})),gold:0,heal:0});q.message='カードの交換が成立しました！';});
       a.trades=a.trades.filter(q=>q!==t);
     }
     w.revision++;return true;
   }
 }
 if(action.type==='dungeon-join') {
   const s=w.sites.find(s=>s.id===action.siteId&&s.kind==='dungeon');
   if(!s||distance(s,p)>2||!available(w,p)) return false;
   let d=a.dungeons.find(d=>d.siteId===s.id&&d.status==='lobby');
   if(d?.members.length===4) return tell('ダンジョンの募集は満員です。');
   if(!d){d={id:`dungeon-${w.revision}`,siteId:s.id,leader:p.id,members:[],ready:[],arrived:[],status:'lobby'};a.dungeons.push(d);}
   d.members.push(p.id);p.dungeonId=d.id;return tell('ダンジョンの参加者を募集中です。');
 }
 if(action.type.startsWith('dungeon-')&&'dungeonId' in action) {
   const d=a.dungeons.find(d=>d.id===action.dungeonId&&d.members.includes(p.id));
   if(!d) return false;
   if(action.type==='dungeon-damage') {
     if(d.status!=='active'||d.leader!==p.id||!d.members.includes(action.target)||typeof action.actionId!=='string'||action.actionId.length>160||!Number.isSafeInteger(action.damage)||action.damage<0||action.damage>1000000)return false;
     if(d.damageActions?.includes(action.actionId))return false;
     d.damageActions=[...(d.damageActions||[]),action.actionId];
     w.players[action.target].totalDamage+=action.damage;w.revision++;return true;
   }
   if(action.type==='dungeon-ready'&&d.status==='lobby'){d.ready=d.ready.includes(p.id)?d.ready.filter(id=>id!==p.id):[...d.ready,p.id];return tell('準備状態を更新しました。');}
   if(action.type==='dungeon-leave'&&d.status==='lobby'){leaveActivities(w,p.id);delete p.dungeonId;return tell('募集を離れました。');}
   if(action.type==='dungeon-start'&&d.leader===p.id&&d.status==='lobby'&&d.members.every(id=>d.ready.includes(id)&&!pendingMutation(w.players[id]))){d.status='active';return tell('協力ダンジョンを開始します！');}
   if(action.type==='dungeon-arrived'&&d.status==='active'){if(!d.arrived.includes(p.id))d.arrived.push(p.id);w.revision++;return true;}
   if((action.type==='dungeon-complete'&&d.leader===p.id||action.type==='dungeon-abort')&&d.status==='active'){
     d.status=action.type==='dungeon-complete'?'complete':'aborted';
     for(const id of d.members) {const q=w.players[id];if(!q)continue;delete q.dungeonId;if(d.status==='complete'){q.completedBattles+=3;grant(q,{remove:[],cards:[],gold:60,heal:0});}q.message=d.status==='complete'?'ダンジョン攻略！ ボーナス60コインを獲得。':'ダンジョンから帰還しました。';}
     w.revision++;return true;
   }
 }
 if(action.type==='arcade-play') {
   const s=w.sites.find(s=>s.id===action.siteId&&s.kind==='town');
   if(!s||distance(s,p)>2||!available(w,p)||!p.profile||p.profile.gold<10||!Number.isInteger(action.choice)||action.choice<0||action.choice>2||!['FLIP','ROULETTE','SLOT'].includes(action.game))return false;
   const uses=p.arcadeUses||0,limit=3+Math.floor(p.completedBattles/3);
   if(uses>=limit)return tell('戦闘3勝でゲームセンターの利用回数が増えます。');
   p.arcadeUses=uses+1;p.interactionCount++;
   // The owner chooses the result; retries cannot change a settled play.
   let n=(w.seed^Math.imul(w.revision+1,2654435761)^Math.imul(uses+1,2246822519))>>>0;n^=n>>>16;
   p.arcadePending={token:`arcade-${p.id}-${w.revision}`,siteId:s.id,game:action.game,choice:action.choice,roll:n%6};
   grant(p,{remove:[],cards:[],gold:-10,heal:0});return tell('問題に挑戦して景品を獲得しよう！');
 }
 if(action.type==='arcade-finish') {
   const game=p.arcadePending;
   if(!game||game.token!==action.token||!Number.isSafeInteger(action.correctCount)||action.correctCount<0||action.correctCount>100)return false;
   delete p.arcadePending;
   const card=rewardCard(w,p),win=action.correctCount>0&&(game.game==='SLOT'?game.roll===0:game.roll%3===game.choice);
   const gold=win?(game.game==='SLOT'?50:20):0;
   grant(p,{remove:[],cards:win&&game.game==='FLIP'&&card?[card]:[],gold:gold+(action.correctCount>=3?10:0),heal:win&&game.game==='ROULETTE'?Math.ceil(p.maxHp*.2):0});
   p.arcadeOutcome={...game,win,correctCount:action.correctCount,gold:gold+(action.correctCount>=3?10:0),heal:win&&game.game==='ROULETTE'?Math.ceil(p.maxHp*.2):0,...(win&&game.game==='FLIP'&&card?{card}:{})};
   p.arcadeResult=win?'当たり！ 景品を獲得しました。':'今回はハズレ。次の探索へ！';return tell(p.arcadeResult);
 }
 if(action.type==='secret-search') {
   const s=w.sites.find(s=>s.id===action.siteId&&['fragment','secret','seal'].includes(s.kind));
   if(!s||distance(s,p)>2||!available(w,p))return false;
   if(s.kind==='seal') {
     const e=a.event;if(e.kind!=='SEALS'||e.finished)return tell('封印装置は共通イベント中に使えます。');
     if(s.eventNumber===a.eventNumber)return tell('この封印は解除済みです。');
     p.interactionCount++;s.eventNumber=a.eventNumber;e.progress++;e.contributors[p.id]=(e.contributors[p.id]||0)+1;return tell('封印を解除しました！');
   }
   if(s.kind==='fragment'){if(!a.secretsFound.includes(s.id)){p.interactionCount++;a.secretsFound.push(s.id);grant(p,{remove:[],cards:[],gold:10,heal:0});for(const q of Object.values(w.players))q.message='地図の断片を発見！ 仲間にも共有されました。';}w.revision++;return true;}
   if(a.secretsFound.length<3)return tell('地図の断片を3つ集めると遺跡が開きます。');
   if(p.claimed.includes(s.id))return tell('秘密の宝箱は開封済みです。');
   p.interactionCount++;p.claimed.push(s.id);const card=rewardCard(w,p);grant(p,{remove:[],cards:card?[card]:[],gold:40,heal:0});return tell('秘密の遺跡でカードと40コインを発見！');
 }
 return false;
}
