import {hash,len,move,type Core,type Athlete,type Vec} from './core';

/** Difficulty belongs to opponents; lowering it must not handicap solo teammates. */
const teammate=(s:Core,p:Athlete)=>!s.online&&s.config.mode!=='watch'&&p.team===s.config.team;
export function cpuLevel(s:Core,p:Athlete){return teammate(s,p)?2:s.config.difficulty;}
export function cpuRoll(s:Core,p:Athlete,salt:number){return hash(s.config.seed+p.id*719+salt*997)%10000/10000;}
export const CPU_PROFILES=[
 {reaction:.7,pace:.78,shotError:3.2,shotPower:.78,volleyPower:.68,volleyRead:.7,blockChance:.12},
 {reaction:.48,pace:.87,shotError:2.3,shotPower:.85,volleyPower:.77,volleyRead:.85,blockChance:.25},
 {reaction:.3,pace:.95,shotError:1.4,shotPower:.93,volleyPower:.89,volleyRead:.95,blockChance:.45},
 {reaction:.18,pace:1,shotError:.65,shotPower:1,volleyPower:1,volleyRead:1,blockChance:.65},
] as const;
export const cpuProfile=(s:Core,p:Athlete)=>CPU_PROFILES[cpuLevel(s,p)];
export function cpuRunTo(s:Core,p:Athlete,target:Vec,dt:number,boost=false){
 const d=len(p.p,target),pace=teammate(s,p)?1:cpuProfile(s,p).pace;
 move(p,d<.15?0:(target.x-p.p.x)/Math.max(1,d)*pace,d<.15?0:(target.z-p.p.z)/Math.max(1,d)*pace,dt,boost);
}
/** Hold a decision for a real reaction interval, instead of tracking every frame. */
export function cpuTarget(s:Core,p:Athlete,target:Vec){
 if(teammate(s,p))return target;
 if(!p.cpuTarget||s.clock>=(p.cpuAt||0)){p.cpuTarget={...target};p.cpuAt=s.clock+cpuProfile(s,p).reaction;}
 return p.cpuTarget;
}
