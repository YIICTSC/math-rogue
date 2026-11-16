import {createSideBoard,tickSideBoard,fractureSolid,debrisPoints,polygonContact,type SideBoard,type Debris} from './debris';
import {SIDE_COURSES,solidPoints,type Item,type Power,type SideCourse,type V} from './courses';
export const SIDE_RULES={radius:1.45,gravity:103,speed:138,step:1/240,maxFlight:10,maxStrokes:18} as const;
export type Bag=Record<Item,number>;
export type Ball={x:number;y:number;vx:number;vy:number};
export type EventKind='shot'|'land'|'coin'|'warp'|'spring'|'break'|'water'|'goal'|'brake'|'undo';
export interface SideState {canUndo?:boolean;courseId:number;ball:Ball;origin:V;phase:'aim'|'flight'|'holed';strokes:number;time:number;flight:number;still:number;shot:Power|'special';fragments:Debris[];inventory:Bag;coins:number[];broken:number[];frozen:number[];warpCooldown:number;event:EventKind;serial:number;conceded:boolean;attached?:{solid?:number;fragment?:number;offset:V};previous?:{ball:Ball;strokes:number;coins:number[];broken:number[];frozen:number[];inventory:Bag}}
const bag=():Bag=>({normal:999,sticky:0,ice:0,heavy:0,bounce:0,float:0,phase:0,brake:0,undo:0});
export function createSideState(courseId:number):SideState{const c=SIDE_COURSES[courseId]||SIDE_COURSES[0];return {courseId:c.id,ball:{x:c.tee.x,y:c.tee.y,vx:0,vy:0},origin:{...c.tee},phase:'aim',strokes:0,time:0,flight:0,still:0,shot:'normal',fragments:[],inventory:bag(),coins:[],broken:[],frozen:[],warpCooldown:0,event:'land',serial:0,conceded:false};}
const event=(s:SideState,kind:EventKind)=>{s.event=kind;s.serial++;};
export function shootSide(s:SideState,angle:number,power:number,shot:Power|'special',correct=3){
 if(s.phase!=='aim'||!Number.isFinite(angle)||!Number.isFinite(power)||!Number.isInteger(correct)||correct<0||correct>3||shot!=='special'&&(!(shot in s.inventory)||s.inventory[shot]<1))return false;
 s.previous={ball:{...s.ball},strokes:s.strokes,coins:[...s.coins],broken:[...s.broken],frozen:[...s.frozen],inventory:{...s.inventory}};
 if(shot!=='normal'&&shot!=='special')s.inventory[shot]--;
 const a=angle*Math.PI/180,v=SIDE_RULES.speed*Math.sqrt(Math.max(.03,Math.min(1,power)))*Math.sqrt([.55,.7,.85,1][correct])*(shot==='heavy'?.86:shot==='special'?1.2:1);
 s.ball.vx=Math.cos(a)*v;s.ball.vy=Math.sin(a)*v;s.origin={x:s.ball.x,y:s.ball.y};s.strokes++;s.phase='flight';s.flight=s.still=0;s.shot=shot;s.attached=undefined;event(s,'shot');return true;
}
export function airBrake(s:SideState){if(s.phase!=='flight'||s.inventory.brake<1)return false;s.inventory.brake--;s.ball.vx=0;s.ball.vy=0;event(s,'brake');return true;}
export function rewindSide(s:SideState){if(!s.previous||s.inventory.undo<1)return false;const previous=s.previous,undo=Math.min(s.inventory.undo,previous.inventory.undo)-1;Object.assign(s,{ball:{...previous.ball},strokes:previous.strokes,coins:[...previous.coins],inventory:{...previous.inventory,undo},phase:'aim',previous:undefined,attached:undefined,conceded:false});event(s,'undo');return true;}
function fail(s:SideState){
 s.attached=undefined;let origin={...s.origin};const c=SIDE_COURSES[s.courseId],polygons=[...c.solids.flatMap((v,i)=>s.broken.includes(i)?[]:[solidPoints(v,s.time)]),...s.fragments.filter(f=>f.sleeping&&f.y>-24).map(debrisPoints)];
 if(!polygons.some(p=>{const h=polygonContact(origin,p);return h.distance<4&&h.ny>.3;})){
  const candidates=polygons.flatMap(points=>points.map((a,i)=>{const b=points[(i+1)%points.length];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2+SIDE_RULES.radius+1,top:b.x<a.x};})).filter(p=>p.top);candidates.sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));if(candidates[0])origin=candidates[0];
 }
 s.ball={x:origin.x,y:origin.y,vx:0,vy:0};s.strokes++;s.phase=s.strokes>=SIDE_RULES.maxStrokes?'holed':'aim';s.conceded=s.strokes>=SIDE_RULES.maxStrokes;event(s,'water');
}
function substep(s:SideState,c:SideCourse,dt:number){

 if(s.phase==='aim'&&s.attached){const a=s.attached;if(a.fragment!==undefined){const f=s.fragments.find(f=>f.id===a.fragment);if(f){const cos=Math.cos(f.angle),sin=Math.sin(f.angle);s.ball.x=f.x+a.offset.x*cos-a.offset.y*sin;s.ball.y=f.y+a.offset.x*sin+a.offset.y*cos;}}else if(a.solid!==undefined){const points=solidPoints(c.solids[a.solid],s.time);s.ball.x=points[0].x+a.offset.x;s.ball.y=points[0].y+a.offset.y;}}
 if(s.phase==='aim'&&s.attached){const a=s.attached,f=a.fragment!==undefined?s.fragments.find(f=>f.id===a.fragment):undefined;if(a.solid!==undefined&&s.broken.includes(a.solid)||a.fragment!==undefined&&(!f||!f.sleeping&&!f.fixed&&s.shot!=='sticky')){s.attached=undefined;s.phase='flight';s.flight=0;if(f){s.ball.vx=f.vx;s.ball.vy=f.vy;}}}
 if(s.phase!=='flight')return;
 const b=s.ball,r=SIDE_RULES.radius;s.flight+=dt;s.warpCooldown=Math.max(0,s.warpCooldown-dt);
 let ax=0,ay=-SIDE_RULES.gravity*(s.shot==='float'?.32:s.shot==='heavy'?1.5:1);
 for(const d of c.devices){if(b.x<d.x||b.x>d.x+d.w||b.y<d.y||b.y>d.y+d.h)continue;if(d.kind==='fan'||d.kind==='gravity'){ax+=(d.force?.x||0)*4.68*(s.shot==='heavy'?.2:1);ay+=(d.force?.y||0)*4.68*(s.shot==='heavy'?.45:1);}}
 b.vx+=ax*dt;b.vy+=ay*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
 let touched=false;
 for(let i=0;i<c.solids.length;i++){
  const solid=c.solids[i];if(s.broken.includes(i)||solid.material==='fragile'&&s.shot==='phase')continue;
  const points=solidPoints(solid,s.time),hit=polygonContact(b,points);if(s.shot==='special'&&s.flight<3.5&&(hit.inside||hit.distance<9)&&fractureSolid(s,c,i,b,{x:b.vx,y:b.vy})){event(s,'break');continue;}if(!hit.inside&&hit.distance>r+.04)continue;
  if(solid.material==='fragile'&&s.shot==='heavy'&&Math.hypot(b.vx,b.vy)>8){s.broken.push(i);event(s,'break');continue;}
  b.x=hit.x+hit.nx*(r+.015);b.y=hit.y+hit.ny*(r+.015);touched=true;
  const normal=b.vx*hit.nx+b.vy*hit.ny;
  if(s.shot==='sticky'||solid.material==='sticky'){
   b.vx=b.vy=0;s.phase='aim';s.attached={solid:i,offset:{x:b.x-points[0].x,y:b.y-points[0].y}};event(s,'land');break;
  }
  if(normal<0){const restitution=s.shot==='bounce'?.84:Math.abs(normal)>4?.32:0;b.vx-=(1+restitution)*normal*hit.nx;b.vy-=(1+restitution)*normal*hit.ny;}
  const tangent=b.vx*-hit.ny+b.vy*hit.nx,friction=(solid.material==='ice'?2.1:solid.material==='sand'?140:42)*dt,reduce=Math.sign(tangent)*Math.min(Math.abs(tangent),friction);b.vx+=reduce*hit.ny;b.vy-=reduce*hit.nx;
  if(Math.hypot(b.vx,b.vy)<3.2&&Math.abs(hit.ny)>.35){s.still+=dt;if(s.still>.12){b.vx=b.vy=0;s.phase='aim';s.attached={solid:i,offset:{x:b.x-points[0].x,y:b.y-points[0].y}};event(s,'land');}}
 }
 for(const f of s.fragments){
  if(f.y<-60)continue;const points=debrisPoints(f),hit=polygonContact(b,points);if(!hit.inside&&hit.distance>r+.04)continue;
  if(s.shot==='special'&&s.flight<3.5&&!f.fixed){f.sleeping=false;f.vx=b.vx*.42+(f.x-b.x)*2;f.vy=48+Math.abs(b.vy)*.2;f.spin=Math.sin(f.id)*5;continue;}
  b.x=hit.x+hit.nx*(r+.02);b.y=hit.y+hit.ny*(r+.02);touched=true;
  const n=(b.vx-f.vx)*hit.nx+(b.vy-f.vy)*hit.ny;if(n<0){const e=s.shot==='bounce'?.78:Math.abs(n)>8?.24:0;b.vx-=n*hit.nx*(1+e);b.vy-=n*hit.ny*(1+e);}
  b.vx*=Math.max(0,1-4*dt);const relative=Math.hypot(b.vx-f.vx,b.vy-f.vy);
  if((relative<4&&f.sleeping)||s.shot==='sticky'){s.still+=dt;if(s.still>.09||s.shot==='sticky'){b.vx=b.vy=0;s.phase='aim';const dx=b.x-f.x,dy=b.y-f.y,cos=Math.cos(f.angle),sin=Math.sin(f.angle);s.attached={fragment:f.id,offset:{x:dx*cos+dy*sin,y:-dx*sin+dy*cos}};event(s,'land');}}
 }
 if(!touched)s.still=0;
 for(let i=0;i<c.devices.length;i++){
  const d=c.devices[i];if(b.x+r<d.x||b.x-r>d.x+d.w||b.y+r<d.y||b.y-r>d.y+d.h)continue;
  if(d.kind==='water'||d.kind==='lava'){
   if(d.kind==='water'&&(s.shot==='ice'||s.frozen.includes(i))){if(!s.frozen.includes(i))s.frozen.push(i);b.y=d.y+d.h+r;b.vx*=.98;if(Math.abs(b.vy)<8){b.vx=b.vy=0;s.phase='aim';event(s,'land');}else b.vy=Math.abs(b.vy)*.15;}
   else {fail(s);return;}
  }else if(d.kind==='portal'&&s.warpCooldown===0){const target=c.devices[d.pair??-1];if(target?.kind==='portal'){b.x=target.x+target.w/2;b.y=target.y+target.h/2;s.warpCooldown=.8;s.attached=undefined;s.phase='flight';s.still=0;event(s,'warp');}}
  else if(d.kind==='spring'&&b.vy<=5){b.vy=146;b.y=d.y+d.h+r;s.phase='flight';s.attached=undefined;s.still=0;event(s,'spring');}
  else if(d.kind==='bumper'){const x=d.x+d.w/2,y=d.y+d.h/2,dist=Math.hypot(b.x-x,b.y-y);if(dist<d.w/2+r){const nx=(b.x-x)/(dist||1),ny=(b.y-y)/(dist||1);b.x=x+nx*(d.w/2+r+.1);b.y=y+ny*(d.w/2+r+.1);b.vx=nx*99;b.vy=ny*99;s.phase='flight';s.attached=undefined;s.still=0;event(s,'spring');}}
 }
 for(let i=0;i<c.coins.length;i++)if(!s.coins.includes(i)&&Math.hypot(b.x-c.coins[i].x,b.y-c.coins[i].y)<5){s.coins.push(i);event(s,'coin');}
 if(Math.hypot(b.x-c.cup.x,b.y-(c.cup.y+r))<3.8&&Math.hypot(b.vx,b.vy)<40){b.x=c.cup.x;b.y=c.cup.y+r;b.vx=b.vy=0;s.phase='holed';event(s,'goal');return;}
 if(b.x<-15||b.x>c.width+15||b.y<-24||b.y>c.height+160||s.flight>SIDE_RULES.maxFlight){fail(s);return;}
 if(s.phase==='aim'&&s.strokes>=SIDE_RULES.maxStrokes){s.conceded=true;s.phase='holed';}
}
export function attachSideBoard(s:SideState,board:SideBoard){s.broken=board.broken;s.frozen=board.frozen;s.fragments=board.fragments;s.time=board.time;}
export function tickSide(s:SideState,dt:number,shared?:SideBoard){
 if(!Number.isFinite(dt)||dt<=0)return;const board=shared||{time:s.time,broken:s.broken,frozen:s.frozen,fragments:s.fragments};
 if(!shared)tickSideBoard(board,s.courseId,dt);attachSideBoard(s,board);const c=SIDE_COURSES[s.courseId];
 for(let time=Math.min(.1,dt);time>1e-7;){const step=Math.min(time,SIDE_RULES.step);substep(s,c,step);time-=step;}s.time=board.time;
}
