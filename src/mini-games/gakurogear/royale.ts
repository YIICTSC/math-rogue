import { blocked, clearSight, WEAPONS, type Mission, type Obstacle, type Point } from './engine';
import type { OnlineWorld, Participant, VrInput } from './onlineEngine';

export type BattleKit = {
  shield: number; stamina: number; sprinting: boolean; exhausted: boolean; recoverAt: number;
  materials: number; buildAt: number; ammo: number[]; eliminations: number;
  hitAt: number; hitFrom: Point | null; strikeAt: number;
  pickup: { kind: string; slot: number; at: number } | null;
};
export type Cover = Obstacle & { id: number; owner: string; hp: number; until: number };
export type BattleTrace = { id: number; owner: string; from: Point; to: Point; at: number; hit: boolean; shield: boolean; weapon: number };
export type RoyaleState = { serial: number; covers: Cover[]; traces: BattleTrace[]; feed: { id: number; actor: string; target: string; at: number }[] };
export const newBattleKit = (): BattleKit => ({ shield: 0, stamina: 100, sprinting: false, exhausted: false, recoverAt: 0, materials: 2, buildAt: 0, ammo: [6, 0, 0, 0, 0, 0], eliminations: 0, hitAt: -99, hitFrom: null, strikeAt: -99, pickup: null });
export const newRoyale = (): RoyaleState => ({ serial: 0, covers: [], traces: [], feed: [] });

/** Three deliberate loot / rotation / closing cycles, all derived from server time. */
export function storm(w: Pick<OnlineWorld, 'mission' | 'limit' | 'time'>) {
  const initial=(w.mission.size??18)-1, ratios=[1,.64,.32,3/initial], durations=[.18,.16,.14,.16,.1,.16];
  let start=0;
  for(let i=0;i<durations.length;i++) {
    const end=start+durations[i]*w.limit, phase=Math.floor(i/2), shrinking=i%2===1;
    if(w.time<end) {
      const from=initial*ratios[phase], next=initial*ratios[phase+1];
      return { radius: shrinking?from+(next-from)*Math.max(0,(w.time-start)/(end-start)):from, next, seconds: Math.max(0,Math.ceil(end-w.time)), phase: phase+1, shrinking, final: false };
    }
    start=end;
  }
  return {radius:3,next:3,seconds:Math.max(0,Math.ceil(w.limit-w.time)),phase:3,shrinking:false,final:true};
}
export function battleMission(w: OnlineWorld): Mission {
  const covers=(w.royale?.covers??[]).filter(c=>c.hp>0&&c.until>w.time);
  return covers.length?{...w.mission,obstacles:[...w.mission.obstacles,...covers]}:w.mission;
}
export function tickRoyale(w: OnlineWorld) {
  if(!w.royale)w.royale=newRoyale();
  w.royale.covers=w.royale.covers.filter(c=>c.hp>0&&c.until>w.time);
  w.royale.traces=w.royale.traces.filter(c=>w.time-c.at<.6);
  w.royale.feed=w.royale.feed.filter(c=>w.time-c.at<6).slice(-4);
}
export function sprintPlayer(w: OnlineWorld,p:Participant,input:VrInput,dt:number) {
  const k=p.battle;
  if(k.stamina>=30)k.exhausted=false;
  k.sprinting=!!input.sprint&&!k.exhausted&&!input.crouch&&!input.shoot&&!input.hold&&!p.reloading&&Math.hypot(input.x,input.z)>.1&&k.stamina>0;
  if(k.sprinting){k.stamina=Math.max(0,k.stamina-dt*30);k.recoverAt=w.time+.6;if(k.stamina===0)k.exhausted=true;}
  else if(w.time>=k.recoverAt)k.stamina=Math.min(100,k.stamina+dt*22);
  return k.sprinting?1.7:1;
}
export function placeCover(w:OnlineWorld,p:Participant,facing:number) {
  const r=w.royale,k=p.battle;
  if(!r||p.out||p.quiz||k.materials<1||w.time<k.buildAt)return false;
  // Axis-aligned panels match the simulation's collision geometry exactly.
  const sideways=Math.abs(Math.sin(facing))>Math.abs(Math.cos(facing));
  const c:Cover={id:r.serial+1,owner:p.id,x:p.run.player.x+Math.sin(facing)*1.8,z:p.run.player.z+Math.cos(facing)*1.8,w:sideways?.32:2.4,d:sideways?2.4:.32,h:1.9,kind:'wall',hp:3,until:w.time+25};
  const m=battleMission(w);
  if(Math.abs(c.x)+c.w/2>(m.size??18)-.4||Math.abs(c.z)+c.d/2>(m.size??18)-.4||m.obstacles.some(b=>Math.abs(c.x-b.x)<(c.w+b.w)/2+.1&&Math.abs(c.z-b.z)<(c.d+b.d)/2+.1))return false;
  if(Object.values(w.players).some(q=>q.connected&&!q.spectator&&Math.abs(q.run.player.x-c.x)<c.w/2+.4&&Math.abs(q.run.player.z-c.z)<c.d/2+.4))return false;
  if(w.supplies.some(q=>q.readyAt<=w.time&&Math.abs(q.x-c.x)<c.w/2+.5&&Math.abs(q.z-c.z)<c.d/2+.5))return false;
  const own=r.covers.filter(q=>q.owner===p.id);if(own.length>=2)r.covers=r.covers.filter(q=>q.id!==own[0].id);
  r.serial++;r.covers.push(c);k.materials--;k.buildAt=w.time+.65;return true;
}
export function recordShot(w:OnlineWorld,p:Participant,from:Point,facing:number,target?:Participant,shield=false) {
  const state=w.royale;if(!state)return;
  const m=battleMission(w),weapon=WEAPONS[p.run.weapon];let to={x:from.x,z:from.z};
  for(let d=.08;!target&&d<=weapon.range;d+=.08) {
    const q={x:from.x+Math.sin(facing)*d,z:from.z+Math.cos(facing)*d};
    if(blocked(m,q,.04,true)) {
      const c=state.covers.find(c=>Math.abs(q.x-c.x)<c.w/2+.04&&Math.abs(q.z-c.z)<c.d/2+.04);
      if(c&&!p.out&&clearSight({...m,obstacles:m.obstacles.filter(b=>b!==c)},from,q,true))c.hp--;
      break;
    }
    to=q;if(target&&Math.hypot(q.x-target.run.player.x,q.z-target.run.player.z)<weapon.spread+.15)break;
  }
  if(target)to={x:target.run.player.x,z:target.run.player.z};
  state.traces.push({id:++state.serial,owner:p.id,from:{x:from.x,z:from.z},to,at:w.time,hit:!!target,shield,weapon:p.run.weapon});
  state.traces=state.traces.slice(-80);
  if(p.run.bubble){p.run.bubble.end=to;p.run.bubble.hit=!!target;}
}
export function registerHit(w:OnlineWorld,target:Participant,attacker?:Participant) {
  target.battle.hitAt=w.time;target.battle.hitFrom=attacker?{x:attacker.run.player.x,z:attacker.run.player.z}:null;
  if(attacker){attacker.stats.hits++;attacker.battle.strikeAt=w.time;attacker.run.stealth=0;}
  const shield=!!attacker&&target.battle.shield>0;
  if(shield)target.battle.shield--;
  else if(target.out)target.respawnHits++;else target.hits++;
  target.invulnerable=attacker ? .9 : 2;
  if((target.out?target.respawnHits:target.hits)>=3&&!target.out&&attacker){
    attacker.battle.eliminations++;
    if(w.royale)w.royale.feed.push({id:++w.royale.serial,actor:attacker.id,target:target.id,at:w.time});
  }
  return shield;
}
