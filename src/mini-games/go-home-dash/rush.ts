import type {ArcadePlayer,ArcadeState} from './arcade';
import {announce,hash,reward,checkMissions} from './arcade';

export type RushKind='run'|'loop'|'depth';
export type DepthKind='coin'|'star'|'barrier'|'lowBar'|'gap'|'boost';
export interface DepthObject {id:number;lane:number;at:number;kind:DepthKind;taken:boolean;judged?:boolean;}
export interface RushState {
 enabled:boolean;padSlideHeld:boolean;kind:RushKind;section:number;start:number;length:number;progress:number;variant:number;
 lane:number;laneX:number;objects:DepthObject[];momentum:number;speed:number;
 chargeHeld:boolean;charge:number;chargeCooldown:number;turbo:number;flash:number;
 jumpQueued:boolean;trickDone:boolean;clean:boolean;coins:number;loopCoins:number;
 loops:number;depths:number;homings:number;bestSpeed:number;warned:number;padDirection:number;
}
export const RUSH_SPACING=6200,RUSH_OFFSET=2200;
export function createRush():RushState{return {enabled:true,padSlideHeld:false,kind:'run',section:-1,start:0,length:0,progress:0,variant:0,lane:0,laneX:0,objects:[],momentum:0,speed:4.5,chargeHeld:false,charge:0,chargeCooldown:0,turbo:0,flash:0,jumpQueued:false,trickDone:false,clean:true,coins:0,loopCoins:0,loops:0,depths:0,homings:0,bestSpeed:4.5,warned:-1,padDirection:0};}
export function rushAt(seed:number,distance:number){
 const section=Math.max(0,Math.floor((distance-RUSH_OFFSET)/RUSH_SPACING));
 const start=RUSH_OFFSET+section*RUSH_SPACING,kind:RushKind=section%2===0?'loop':'depth',length=kind==='loop'?1850:3500;
 return {section,start,length,variant:hash(seed+section)%3,kind:distance>=start&&distance<start+length?kind:'run' as RushKind,progress:Math.max(0,Math.min(1,(distance-start)/length))};
}
export function rushSpeed(s:ArcadeState,base:number,p:ArcadePlayer){
 const r=s.rush;r.momentum=Math.max(0,r.momentum-.014);if(r.turbo>0)r.turbo--;if(r.flash>0)r.flash--;if(r.chargeCooldown>0)r.chargeCooldown--;
 const speed=Math.min(18,base*(1+r.momentum*.0045)*(p.dashFrames>0?1.55:r.turbo>0?1.42:s.boost>0?1.25:1));
 r.speed=r.kind==='loop'?Math.max(8.5,speed):speed;r.bestSpeed=Math.max(r.bestSpeed,r.speed);return r.speed;
}
function depthLayout(seed:number,start:number):DepthObject[]{
 const objects:DepthObject[]=[];let id=0;
 const add=(lane:number,at:number,kind:DepthKind)=>objects.push({id:++id,lane,at:start+at,kind,taken:false});
 for(let wave=0;wave<5;wave++){
  const at=580+wave*530,safe=(hash(seed+wave*101)%3)-1,blocked=(safe+2)%3-1;
  // At most two occupied lanes per wave. The first wave teaches a single lane change.
  add(blocked,at,wave%3===0?'barrier':wave%3===1?'lowBar':'gap');
  if(wave>0){const other=[-1,0,1].find(l=>l!==safe&&l!==blocked)!;add(other,at,wave%2?'barrier':'lowBar');}
  for(let c=0;c<5;c++)add(safe,at-150+c*64,'coin');
  if(wave===2||wave===4)add(safe,at+190,'star');
  if(wave===1||wave===3)add(safe,at+280,'boost');
 }
 return objects;
}
export function syncRush(s:ArcadeState,p:ArcadePlayer,distance:number,floor:number){
 const r=s.rush;if(!r.enabled){r.kind='run';return false;}const next=rushAt(s.seed,distance+120),changed=next.kind!==r.kind||next.kind!=='run'&&next.section!==r.section;
 if(changed){
  if(r.kind!=='run'){
   if(r.kind==='loop')r.loops++;else r.depths++;
   reward(s,r.clean?450:150,r.clean?14:5);announce(s,r.clean?'rushClean':'rushClear');
  }
  r.kind=next.kind;r.section=next.section;r.start=next.start;r.length=next.length;r.variant=next.variant;r.progress=next.progress;
  r.trickDone=false;r.clean=true;r.coins=0;r.loopCoins=0;r.lane=0;r.laneX=0;r.jumpQueued=false;r.chargeHeld=false;r.charge=0;
  r.objects=next.kind==='depth'?depthLayout(s.seed+next.section*997,next.start):[];
  s.entities=[];s.boss=null;s.vehicle='normal';s.vehicleTime=0;s.slide=0;
  p.x=120;p.y=floor;p.vy=0;p.flying=false;p.isFalling=false;p.isJumping=false;p.jumpCount=0;p.invulFrame=Math.max(p.invulFrame,45);
  if(next.kind!=='run'){r.momentum=Math.min(100,r.momentum+16);announce(s,next.kind==='loop'?'loopStart':'depthStart');}
 }
 r.progress=next.progress;
 // Announce the upcoming turn before changing the camera, including on slower devices.
 const upcoming=rushAt(s.seed,distance+120+560);
 if(r.kind==='run'&&upcoming.kind!=='run'&&r.warned!==upcoming.section){r.warned=upcoming.section;announce(s,upcoming.kind==='loop'?'loopSoon':'depthSoon');}
 return changed;
}
export function shiftRushLane(s:ArcadeState,direction:number){
 if(s.rush.kind!=='depth')return false;
 s.rush.lane=Math.max(-1,Math.min(1,s.rush.lane+Math.sign(direction)));return true;
}
export function releaseRushCharge(s:ArcadeState){
 const r=s.rush;r.chargeHeld=false;
 if(r.kind==='run'&&r.charge>=24&&r.chargeCooldown===0){r.turbo=150+Math.min(90,r.charge);r.momentum=Math.min(100,r.momentum+25);r.flash=32;r.chargeCooldown=360;announce(s,'spinRelease');r.charge=0;return true;}
 r.charge=0;return false;
}
export function chargeRush(s:ArcadeState,p:ArcadePlayer){
 const r=s.rush;if(r.chargeHeld&&r.kind==='run'&&!p.flying&&!p.isJumping&&r.chargeCooldown===0){r.charge=Math.min(90,r.charge+1);s.slide=Math.max(s.slide,3);}
 else if(r.chargeHeld&&p.isJumping){r.charge=0;}
}
/** Advance the special course using the same fixed simulation clock and damage rules. */
export function stepRush(s:ArcadeState,p:ArcadePlayer,distance:number,floor:number){
 const r=s.rush;let damage=false;
 if(r.kind==='loop'){
  p.y=floor;p.vy=0;p.isJumping=false;p.isFalling=false;
  const coins=Math.floor(Math.max(0,Math.min(1,(r.progress-.18)/.64))*20);
  while(r.loopCoins<coins){r.loopCoins++;s.stats.coins++;reward(s,12,1);}
  if(r.jumpQueued&&!r.trickDone&&r.progress>.38&&r.progress<.66){r.trickDone=true;s.stats.perfects++;reward(s,300,16);r.momentum=Math.min(100,r.momentum+25);r.flash=45;announce(s,'loopTrick');}
 }else if(r.kind==='depth'){
  r.laneX+=(r.lane-r.laneX)*.24;
  p.vy+=.6*(s.lowGravity>0?.55:1);p.y=Math.min(floor,p.y+p.vy);p.isJumping=p.y<floor-1;
  if(!p.isJumping){p.vy=0;p.jumpCount=0;}
  for(const e of r.objects){
   if(e.taken||e.judged||distance+120<e.at-35)continue;
   if(distance+120>e.at+65){e.taken=true;if(['barrier','lowBar','gap'].includes(e.kind)){s.stats.dodges++;reward(s,30,3);}continue;}
   const attracted=e.kind==='coin'&&(s.magnet>0||s.fever>0),inLane=attracted||Math.abs(r.laneX-e.lane)<.45,lift=floor-p.y;
   if(!inLane)continue;
   if(e.kind==='coin'||e.kind==='star'){
    if(lift>(attracted?200:85))continue;e.taken=true;r.coins++;if(e.kind==='coin'){s.stats.coins++;reward(s,15,2);}else{s.stats.stars++;reward(s,250,12);announce(s,'star');}
   }else if(e.kind==='boost'){e.taken=true;r.turbo=160;r.flash=20;reward(s,50,5);announce(s,'boost');}
   else{
    e.judged=true;
    const avoided=e.kind==='lowBar'?s.slide>0||lift>155:e.kind==='gap'?lift>28:lift>54||p.dashFrames>0||s.fever>0;
    if(avoided){s.stats.dodges++;reward(s,65,5);if(e.kind==='barrier'&&p.dashFrames>0){e.taken=true;s.stats.breaks++;r.flash=18;announce(s,'smash');}}
    else if(p.invulFrame<=0){r.clean=false;r.momentum=Math.max(0,r.momentum-45);damage=true;}
   }
  }
 }
 r.jumpQueued=false;checkMissions(s);return damage;
}
/** The runner's feet follow the lane itself; the camera and background never do a barrel roll. */
export function loopPose(progress:number,variant=0){
 const a=Math.max(0,Math.min(1,(progress-.16)/.68)),angle=a*Math.PI*2;
 if(progress<.16)return {x:-14+progress/.16*14,y:.3,angle:0,z:0};
 if(progress>.84)return {x:(progress-.84)/.16*14,y:.3,angle:Math.PI*2,z:0};
 return {x:Math.sin(angle)*5.8,y:6-Math.cos(angle)*5.8,angle,z:variant===2?Math.sin(angle)*.9:0};
}
