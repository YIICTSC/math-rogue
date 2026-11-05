import {OPENING_DISTANCE,ROUTE_LENGTH} from './routes';
import type {ArcadePlayer,ArcadeState} from './arcade';
import {announce,hash,reward,checkMissions} from './arcade';

export type RushKind='run'|'loop'|'depth';
export type DepthKind='coin'|'star'|'barrier'|'lowBar'|'gap'|'boost';
export interface DepthObject {id:number;lane:number;at:number;kind:DepthKind;taken:boolean;judged?:boolean;}
export interface RushState {
 transition:null|{direction:'toDepth'|'toSide';phase:'depart'|'arrive';frame:number;fromX:number;fromY:number;fromLane:number};trickTime:number;trickSerial:number;
 enabled:boolean;padSlideHeld:boolean;kind:RushKind;section:number;start:number;length:number;progress:number;variant:number;
 lane:number;laneX:number;objects:DepthObject[];momentum:number;speed:number;
 chargeHeld:boolean;charge:number;chargeCooldown:number;turbo:number;flash:number;
 jumpQueued:boolean;trickDone:boolean;clean:boolean;coins:number;loopCoins:number;
 loops:number;depths:number;homings:number;bestSpeed:number;warned:number;padDirection:number;
}
export const RUSH_SPACING=6200,RUSH_OFFSET=2200,TRANSITION_FRAMES=42;
export const DEPTH_START=OPENING_DISTANCE,DEPTH_LENGTH=ROUTE_LENGTH,DEPTH_SPACING=ROUTE_LENGTH*3;
export function createRush():RushState{return {transition:null,trickTime:0,trickSerial:0,enabled:true,padSlideHeld:false,kind:'run',section:-1,start:0,length:0,progress:0,variant:0,lane:0,laneX:0,objects:[],momentum:0,speed:4.5,chargeHeld:false,charge:0,chargeCooldown:0,turbo:0,flash:0,jumpQueued:false,trickDone:false,clean:true,coins:0,loopCoins:0,loops:0,depths:0,homings:0,bestSpeed:4.5,warned:-1,padDirection:0};}
export function rushAt(seed:number,distance:number){
 const depthSection=Math.floor((distance-DEPTH_START)/DEPTH_SPACING),depthStart=DEPTH_START+depthSection*DEPTH_SPACING;
 if(depthSection>=0&&distance<depthStart+DEPTH_LENGTH)return{section:1000000+depthSection,start:depthStart,length:DEPTH_LENGTH,variant:hash(seed+depthSection)%3,kind:'depth' as RushKind,progress:(distance-depthStart)/DEPTH_LENGTH};
 return{section:-1,start:0,length:0,variant:0,kind:'run' as RushKind,progress:0};
}
export const transitionProgress=(r:RushState)=>r.transition?Math.min(1,r.transition.frame/TRANSITION_FRAMES):1;
export const easeRush=(t:number)=>t*t*(3-2*t);
export function sideTransitionX(r:RushState,width:number,normal=120){const t=r.transition;if(!t)return normal;const p=easeRush(transitionProgress(r));return t.direction==='toDepth'?t.fromX+(width+100-t.fromX)*p:-100+(normal+100)*p;}
export function advanceRushTransition(s:ArcadeState,p:ArcadePlayer,floor:number){
 const r=s.rush,t=r.transition;if(!t)return false;
 if(++t.frame<TRANSITION_FRAMES)return false;
 if(t.phase==='depart'){
  r.kind=t.direction==='toDepth'?'depth':'run';t.phase='arrive';t.frame=0;
  p.x=120;p.y=floor;p.vy=0;p.flying=false;p.isFalling=false;p.isJumping=false;p.jumpCount=0;
  announce(s,t.direction==='toDepth'?'depthStart':'sideReturning');return true;
 }
 r.transition=null;p.invulFrame=Math.max(p.invulFrame,60);return false;
}
export function airTrick(s:ArcadeState,p:ArcadePlayer,floor:number){
 const r=s.rush;if(r.transition||r.kind==='loop'||!p.isJumping||p.flying||floor-p.y<44||r.trickDone)return false;
 r.trickDone=true;r.trickTime=72;r.trickSerial++;r.flash=28;p.vy=Math.min(p.vy,-8);s.stats.perfects++;reward(s,180,12);announce(s,'airTrick');return true;
}
export function rushSpeed(s:ArcadeState,base:number,p:ArcadePlayer){
 const r=s.rush;if(r.trickTime>0)r.trickTime--;r.momentum=Math.max(0,r.momentum-.014);if(r.turbo>0)r.turbo--;if(r.flash>0)r.flash--;if(r.chargeCooldown>0)r.chargeCooldown--;
 const speed=Math.min(18,base*(1+r.momentum*.0045)*(p.dashFrames>0?1.55:r.turbo>0?1.42:s.boost>0?1.25:1));
 r.speed=r.kind==='loop'?Math.max(8.5,speed):speed;r.bestSpeed=Math.max(r.bestSpeed,r.speed);return r.speed;
}
function depthLayout(seed:number,start:number,length:number):DepthObject[]{
 const objects:DepthObject[]=[];let id=0;
 const add=(lane:number,at:number,kind:DepthKind)=>objects.push({id:++id,lane,at:start+at,kind,taken:false});
 for(let wave=0;wave<Math.floor((length-1400)/530);wave++){
  const at=580+wave*530,safe=(hash(seed+wave*101)%3)-1,blocked=(safe+2)%3-1;
  // At most two occupied lanes per wave. The first wave teaches a single lane change.
  add(blocked,at,wave%3===0?'barrier':wave%3===1?'lowBar':'gap');
  if(wave>0){const other=[-1,0,1].find(l=>l!==safe&&l!==blocked)!;add(other,at,wave%2?'barrier':'lowBar');}
  for(let c=0;c<5;c++)add(safe,at-150+c*64,'coin');
  if(wave%5===2||wave%5===4)add(safe,at+190,'star');
  if(wave%5===1||wave%5===3)add(safe,at+280,'boost');
 }
 return objects;
}
export function syncRush(s:ArcadeState,p:ArcadePlayer,distance:number,floor:number){
 const r=s.rush;if(!r.enabled){r.kind='run';return false;}const next=rushAt(s.seed,distance+120),changed=next.kind!==r.kind||next.kind!=='run'&&next.section!==r.section;
 if(r.transition)return false;
 if(changed){
  const previous=r.kind;
  if(previous!=='run'){
   if(previous==='loop')r.loops++;else r.depths++;
   reward(s,r.clean?450:150,r.clean?14:5);announce(s,r.clean?'rushClean':'rushClear');
  }
  if(next.kind==='depth'){
   r.section=next.section;r.start=next.start;r.length=next.length;r.variant=next.variant;r.progress=0;
   r.objects=depthLayout(s.seed+next.section*997,next.start,next.length);r.transition={direction:'toDepth',phase:'depart',frame:0,fromX:p.x,fromY:p.y,fromLane:r.laneX};
  }else if(previous==='depth')r.transition={direction:'toSide',phase:'depart',frame:0,fromX:p.x,fromY:p.y,fromLane:r.laneX};
  else{r.kind=next.kind;r.section=next.section;r.start=next.start;r.length=next.length;r.variant=next.variant;r.progress=next.progress;}
  r.trickDone=false;r.clean=true;r.coins=0;r.loopCoins=0;r.lane=0;r.laneX=0;r.jumpQueued=false;r.chargeHeld=false;r.charge=0;
  s.boss=null;s.vehicle='normal';s.vehicleTime=0;s.slide=0;
  p.x=120;p.y=floor;p.vy=0;p.flying=false;p.isFalling=false;p.isJumping=false;p.jumpCount=0;p.invulFrame=Math.max(p.invulFrame,45);
  if(next.kind!=='run'){r.momentum=Math.min(100,r.momentum+16);announce(s,next.kind==='loop'?'loopStart':'depthSoon');}
 }
 r.progress=r.transition?(r.transition.direction==='toDepth'?0:1):next.progress;
 // Announce the upcoming turn before changing the camera, including on slower devices.
 const upcoming=rushAt(s.seed,distance+120+560);
 if(r.kind==='run'&&upcoming.kind!=='run'&&r.warned!==upcoming.section){r.warned=upcoming.section;announce(s,upcoming.kind==='loop'?'loopSoon':'depthSoon');}
 return changed;
}
export function moveRushLane(s:ArcadeState,direction:number,amount:number){
 if(s.rush.kind!=='depth'||s.rush.transition||!direction||!Number.isFinite(amount)||amount<=0)return false;
 s.rush.lane=Math.max(-1,Math.min(1,s.rush.lane+Math.sign(direction)*amount));return true;
}
export function shiftRushLane(s:ArcadeState,direction:number){return moveRushLane(s,direction,1);}
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
  if(r.jumpQueued&&!r.trickDone&&r.progress>.38&&r.progress<.66){r.trickDone=true;r.trickTime=72;r.trickSerial++;s.stats.perfects++;reward(s,300,16);r.momentum=Math.min(100,r.momentum+25);r.flash=45;announce(s,'loopTrick');}
 }else if(r.kind==='depth'){
  r.laneX+=(r.lane-r.laneX)*.24;
  p.vy+=.6*(s.lowGravity>0?.55:1);p.y=Math.min(floor,p.y+p.vy);p.isJumping=p.y<floor-1;
  if(!p.isJumping){p.vy=0;p.jumpCount=0;r.trickDone=false;}
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

/** Side-view course part: approach, rotate on the rail, then let the camera catch up. */
export function sideLoopPose(progress:number,trickTime=0,reduced=false){
 const radius=104,center=208;
 if(progress<.16){const t=Math.max(0,progress/.16);return{x:120+(center-120)*t,lift:0,angle:0,cx:center+272*(1-t),radius};}
 if(progress>.84){const t=Math.min(1,(progress-.84)/.16);return{x:center+(120-center)*t,lift:0,angle:Math.PI*2,cx:center-388*t,radius};}
 const angle=(progress-.16)/.68*Math.PI*2,leap=!reduced&&trickTime>36?Math.sin((72-trickTime)/36*Math.PI)*32:0;return{x:center+Math.sin(angle)*(radius+leap),lift:radius*(1-Math.cos(angle))-Math.cos(angle)*leap,angle,cx:center,radius};
}
