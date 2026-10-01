import type { Enemy, Player } from '../types';
import { EnemyIntentType } from '../types';
import { activityBusy, acceptProfile } from './activities';
import { distance, random, validProfile, type World, type Adventurer, type NativeProfile } from './engine';

export interface Duel {
  id: string;
  members: [string, string];
  status: 'request' | 'preparing' | 'active' | 'finished' | 'aborted';
  first: string;
  actor: string;
  turn: number;
  revision: number;
  players: Record<string, Player>;
  started: string[];
  returned: string[];
  expires: number;
  winner?: string;
}
export type DuelAction =
  | { type: 'duel-request'; target: string }
  | { type: 'duel-accept' | 'duel-cancel' | 'duel-forfeit'; duelId: string }
  | { type: 'duel-ready'; duelId: string; player: Player }
  | { type: 'duel-state'; duelId: string; revision: number; kind: 'start' | 'card' | 'end' | 'effect'; cardId?: string; consumedIds?: string[]; player: Player; opponent: Enemy }
  | { type: 'duel-return'; duelId: string; profile: NativeProfile };

export type RivalEnemy = Enemy & { rivalPowers: Record<string, number> };
// Adapt the player's defensive powers to the main game's enemy-facing card resolver.
export function resolveRivalDefense(enemy: Enemy, damage: number, attacker: Player): number {
  if(enemy.enemyType!=='RPG_RIVAL' || damage<=0)return damage;
  const powers=(enemy as RivalEnemy).rivalPowers || {};
  if(powers.INTANGIBLE>0)damage=1;
  if(powers.BUFFER>0){powers.BUFFER--;return 0;}
  const reflected=(powers.THORNS||0)+(powers.STATIC_DISCHARGE||0)*5;
  if(reflected>0){attacker.currentHp=Math.max(0,attacker.currentHp-reflected);attacker.hpLostThisTurn=(attacker.hpLostThisTurn||0)+reflected;}
  return damage;
}
export function duelEnemy(duel: Duel, id: string, name: string): RivalEnemy {
  const p = duel.players[id];
  return {
    id: `rival-${id}`, name, enemyType: 'RPG_RIVAL', rivalPowers: {...p?.powers},
    corpseExplosion: false, floatingText: null, maxHp: p?.maxHp || 1, currentHp: p?.currentHp || 0,
    block: p?.block || 0, strength: p?.strength || 0,
    weak: p?.powers?.WEAK || 0, vulnerable: p?.powers?.VULNERABLE || 0,
    poison: p?.powers?.POISON || 0, artifact: p?.powers?.ARTIFACT || 0,
    nextIntent: { type: EnemyIntentType.UNKNOWN, value: 0 },
  };
}
function validBattlePlayer(p: Player): boolean {
  return !!p && typeof p === 'object' &&
    [p.currentHp,p.maxHp,p.block,p.strength,p.currentEnergy,p.maxEnergy,p.gold].every(Number.isFinite) &&
    p.maxHp > 0 && p.currentHp <= p.maxHp && p.block >= 0 &&
    ['deck','hand','drawPile','discardPile','relics','potions'].every(k=>Array.isArray(p[k]) && p[k].length <= 500) &&
    !!p.powers && typeof p.powers === 'object' && !!p.turnFlags && !!p.relicCounters;
}
function finish(w: World, d: Duel, winner?: string) {
  if(d.status !== 'active')return;
  d.status='finished';d.winner=winner;d.revision++;
  if(winner && w.players[winner]) w.players[winner].rivalKills++;
  for(const id of d.members) if(w.players[id])w.players[id].message=id===winner?'ライバルに勝利しました！':'対戦が終了しました。';
  w.revision++;
}
export function advanceDuels(w: World, now: number) {
  for(const d of w.duels) {
    if(['request','preparing'].includes(d.status) && now >= d.expires || w.ended && ['request','preparing','active'].includes(d.status)) {
      d.status='aborted';d.revision++;
      for(const id of d.members)if(w.players[id])delete w.players[id].duelId;
      w.revision++;
    }
  }
}
export function leaveDuels(w: World, id: string) {
  for(const d of w.duels.filter(d=>d.members.includes(id))) {
    if(d.status==='active')finish(w,d,d.members.find(pid=>pid!==id));
    else if(['request','preparing'].includes(d.status))d.status='aborted';
    for(const pid of d.members)if(w.players[pid] && (d.status==='aborted' || pid===id))delete w.players[pid].duelId;
  }
}
export function applyDuel(w: World, p: Adventurer, action: DuelAction, now: number): boolean {
  if(w.gameMode !== 'BATTLE_ROYALE' || w.ended)return false;
  const tell=(message:string)=>{p.message=message;w.revision++;return true;};
  if(action.type==='duel-request') {
    const q=w.players[action.target];
    if (q?.spectator) return false;
    if(!q || q.id===p.id || [p,q].some(q=>q.nativeScene || activityBusy(w,q) || !q.profile?.deck || q.hp<=0) || distance(p,q)>3)return false;
    const first=random(w.seed+w.revision+now)()<.5?p.id:q.id;
    const d:Duel={id:`duel-${w.revision}-${p.id}`,members:[p.id,q.id],status:'request',first,actor:first,turn:1,revision:0,players:{},started:[],returned:[],expires:now+60000};
    w.duels.push(d);p.duelId=d.id;q.duelId=d.id;
    return tell('対戦を申し込みました。');
  }
  const d=w.duels.find(d=>d.id===action.duelId && d.members.includes(p.id));
  if(!d)return false;
  if(action.type==='duel-cancel' && d.status==='request') {
    d.status='aborted';for(const id of d.members)if(w.players[id])delete w.players[id].duelId;
    return tell('対戦をキャンセルしました。');
  }
  if(action.type==='duel-accept' && d.status==='request' && p.id===d.members[1]) {
    d.status='preparing';d.expires=now+60000;return tell('対戦の準備をしています。');
  }
  if(action.type==='duel-ready' && d.status==='preparing' && !d.players[p.id] && validBattlePlayer(action.player)) {
    if(action.player.maxHp!==p.profile?.maxHp || action.player.currentHp>p.maxHp)return false;
    d.players[p.id]=structuredClone(action.player);
    if(d.members.every(id=>!!d.players[id]))d.status='active';
    d.revision++;w.revision++;return true;
  }
  if(action.type==='duel-forfeit' && d.status==='active') {finish(w,d,d.members.find(id=>id!==p.id));return true;}
  if(action.type==='duel-state' && d.status==='active') {
    if(d.actor!==p.id || action.revision!==d.revision || !validBattlePlayer(action.player))return false;
    const other=d.members.find(id=>id!==p.id)!,op=action.opponent,before=d.players[p.id];
    if(!op || op.id!==`rival-${other}` || ![op.currentHp,op.maxHp,op.block,op.strength,op.weak,op.vulnerable,op.poison,op.artifact].every(Number.isFinite) || op.maxHp!==d.players[other].maxHp || op.currentHp>op.maxHp || op.block<0)return false;
    if(action.kind==='card') {
      const sources=action.consumedIds;
      const card=sources?.length===2 && new Set(sources).size===2 && sources.every(id=>before.hand.some(c=>c.id===id))
        ? {type:before.hand.filter(c=>sources.includes(c.id)).some(c=>c.type==='ATTACK')?'ATTACK':'SKILL',unplayable:before.hand.some(c=>sources.includes(c.id)&&c.unplayable)}
        : before.hand.find(c=>c.id===action.cardId);
      if(!card || card.unplayable || card.type==='ATTACK' && d.turn===1 || !d.started.includes(`${d.turn}`))return false;
    } else if(action.kind==='start') {
      if(d.started.includes(`${d.turn}`))return false;
      d.started.push(`${d.turn}`);
    } else if(!['end','effect'].includes(action.kind) || !d.started.includes(`${d.turn}`))return false;
    const rival=d.players[other];
    p.totalDamage+=Math.max(0,rival.currentHp-Math.max(0,op.currentHp));
    d.players[p.id]=structuredClone(action.player);
    d.players[other]={...rival,currentHp:Math.max(0,op.currentHp),block:op.block,strength:op.strength,powers:{...rival.powers,WEAK:op.weak,VULNERABLE:op.vulnerable,POISON:op.poison,ARTIFACT:op.artifact,BUFFER:Math.max(0,Math.floor(Number.isFinite((op as RivalEnemy).rivalPowers?.BUFFER)?(op as RivalEnemy).rivalPowers.BUFFER:rival.powers.BUFFER||0))}};
    d.revision++;
    if(op.currentHp<=0 || action.player.currentHp<=0)finish(w,d,op.currentHp<=0 && action.player.currentHp>0?p.id:action.player.currentHp<=0 && op.currentHp>0?other:undefined);
    else if(action.kind==='end'){d.turn++;d.actor=other;}
    w.revision++;return true;
  }
  if(action.type==='duel-return' && ['finished','aborted'].includes(d.status) && !d.returned.includes(p.id) && validProfile(action.profile) && acceptProfile(p,action.profile)) {
    p.profile={...action.profile,visualTheme:p.profile?.visualTheme};p.hp=action.profile.hp;p.maxHp=action.profile.maxHp;p.gold=action.profile.gold;
    if(d.winner && d.winner!==p.id){const town=w.sites.find(s=>s.kind==='town')!;p.x=town.x;p.y=town.y;}
    if(d.winner===p.id)p.completedBattles=(p.completedBattles||0)+1;
    d.returned.push(p.id);delete p.duelId;
    if(d.members.every(id=>d.returned.includes(id)||!w.players[id]))w.duels=w.duels.filter(other=>other.id!==d.id);
    w.revision++;return true;
  }
  return false;
}
