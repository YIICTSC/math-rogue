import {SIDE_COURSES,solidPoints,type Item,type Power,type SideCourse,type V} from './courses';
export const SIDE_RULES={radius:1.45,gravity:22,speed:64,step:1/120,maxFlight:18,maxStrokes:18} as const;
export type Bag=Record<Item,number>;
export type Ball={x:number;y:number;vx:number;vy:number};
export type EventKind='shot'|'land'|'coin'|'warp'|'spring'|'break'|'water'|'goal'|'brake'|'undo';
export interface SideState {courseId:number;ball:Ball;origin:V;phase:'aim'|'flight'|'holed';strokes:number;time:number;flight:number;still:number;shot:Power;inventory:Bag;coins:number[];broken:number[];frozen:number[];warpCooldown:number;event:EventKind;serial:number;conceded:boolean;attached?:{solid:number;offset:V};previous?:{ball:Ball;strokes:number;coins:number[];broken:number[];frozen:number[];inventory:Bag}}
const bag=():Bag=>({normal:999,sticky:2,ice:2,heavy:2,bounce:2,float:2,phase:2,brake:2,undo:2});
export function createSideState(courseId:number):SideState{const c=SIDE_COURSES[courseId]||SIDE_COURSES[0];return {courseId:c.id,ball:{x:c.tee.x,y:c.tee.y,vx:0,vy:0},origin:{...c.tee},phase:'aim',strokes:0,time:0,flight:0,still:0,shot:'normal',inventory:bag(),coins:[],broken:[],frozen:[],warpCooldown:0,event:'land',serial:0,conceded:false};}
const event=(s:SideState,kind:EventKind)=>{s.event=kind;s.serial++;};
export function shootSide(s:SideState,angle:number,power:number,shot:Power,correct=3){
 if(s.phase!=='aim'||!Number.isFinite(angle)||!Number.isFinite(power)||!Number.isInteger(correct)||correct<0||correct>3||!(shot in s.inventory)||s.inventory[shot]<1)return false;
 s.previous={ball:{...s.ball},strokes:s.strokes,coins:[...s.coins],broken:[...s.broken],frozen:[...s.frozen],inventory:{...s.inventory}};
 if(shot!=='normal')s.inventory[shot]--;
 const a=angle*Math.PI/180,v=SIDE_RULES.speed*Math.sqrt(Math.max(.03,Math.min(1,power)))*(.85+correct*.05)*(shot==='heavy'?.86:1);
 s.ball.vx=Math.cos(a)*v;s.ball.vy=Math.sin(a)*v;s.origin={x:s.ball.x,y:s.ball.y};s.strokes++;s.phase='flight';s.flight=s.still=0;s.shot=shot;s.attached=undefined;event(s,'shot');return true;
}
export function airBrake(s:SideState){if(s.phase!=='flight'||s.inventory.brake<1)return false;s.inventory.brake--;s.ball.vx=0;s.ball.vy=0;event(s,'brake');return true;}
export function rewindSide(s:SideState){if(!s.previous||s.inventory.undo<1)return false;const previous=s.previous,undo=Math.min(s.inventory.undo,previous.inventory.undo)-1;Object.assign(s,{ball:{...previous.ball},strokes:previous.strokes,coins:[...previous.coins],broken:[...previous.broken],frozen:[...previous.frozen],inventory:{...previous.inventory,undo},phase:'aim',previous:undefined,attached:undefined,conceded:false});event(s,'undo');return true;}
export function grantStudyItems(s:SideState,correct:number){for(const key of ['sticky','ice','heavy','bounce','float','phase','brake','undo'] as Item[])s.inventory[key]=Math.min(5,s.inventory[key]+(correct>0?1:0));}
function fail(s:SideState){s.attached=undefined;s.ball={...s.origin,vx:0,vy:0};s.strokes++;s.phase=s.strokes>=SIDE_RULES.maxStrokes?'holed':'aim';s.conceded=s.strokes>=SIDE_RULES.maxStrokes;event(s,'water');}
function inside(p:V,points:V[]){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function contact(p:V,points:V[]){let best=Infinity,out={x:0,y:1,nx:0,ny:1,distance:Infinity};for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(length*length||1))),x=a.x+dx*t,y=a.y+dy*t,dist=Math.hypot(p.x-x,p.y-y);if(dist<best){best=dist;out={x,y,nx:dy/length,ny:-dx/length,distance:dist};}}return {...out,inside:inside(p,points)};}
function substep(s:SideState,c:SideCourse,dt:number){
 s.time+=dt;
 if(s.phase==='aim'&&s.attached){const points=solidPoints(c.solids[s.attached.solid],s.time);s.ball.x=points[0].x+s.attached.offset.x;s.ball.y=points[0].y+s.attached.offset.y;}
 if(s.phase!=='flight')return;
 const b=s.ball,r=SIDE_RULES.radius;s.flight+=dt;s.warpCooldown=Math.max(0,s.warpCooldown-dt);
 let ax=0,ay=-SIDE_RULES.gravity*(s.shot==='float'?.32:s.shot==='heavy'?1.5:1);
 for(const d of c.devices){if(b.x<d.x||b.x>d.x+d.w||b.y<d.y||b.y>d.y+d.h)continue;if(d.kind==='fan'||d.kind==='gravity'){ax+=(d.force?.x||0)*(s.shot==='heavy'?.2:1);ay+=(d.force?.y||0)*(s.shot==='heavy'?.45:1);}}
 b.vx+=ax*dt;b.vy+=ay*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
 let touched=false;
 for(let i=0;i<c.solids.length;i++){
  const solid=c.solids[i];if(s.broken.includes(i)||solid.material==='fragile'&&s.shot==='phase')continue;
  const points=solidPoints(solid,s.time),hit=contact(b,points);if(!hit.inside&&hit.distance>r)continue;
  if(solid.material==='fragile'&&s.shot==='heavy'&&Math.hypot(b.vx,b.vy)>8){s.broken.push(i);event(s,'break');continue;}
  b.x=hit.x+hit.nx*(r+.015);b.y=hit.y+hit.ny*(r+.015);touched=true;
  const normal=b.vx*hit.nx+b.vy*hit.ny;
  if(s.shot==='sticky'||solid.material==='sticky'){
   b.vx=b.vy=0;s.phase='aim';s.attached={solid:i,offset:{x:b.x-points[0].x,y:b.y-points[0].y}};event(s,'land');break;
  }
  if(normal<0){const restitution=s.shot==='bounce'?.84:Math.abs(normal)>4?.32:0;b.vx-=(1+restitution)*normal*hit.nx;b.vy-=(1+restitution)*normal*hit.ny;}
  const tangent=b.vx*-hit.ny+b.vy*hit.nx,friction=(solid.material==='ice'?.45:solid.material==='sand'?30:9)*dt,reduce=Math.sign(tangent)*Math.min(Math.abs(tangent),friction);b.vx+=reduce*hit.ny;b.vy-=reduce*hit.nx;
  if(Math.hypot(b.vx,b.vy)<1.8&&Math.abs(hit.ny)>.35){s.still+=dt;if(s.still>.12){b.vx=b.vy=0;s.phase='aim';s.attached={solid:i,offset:{x:b.x-points[0].x,y:b.y-points[0].y}};event(s,'land');}}
 }
 if(!touched)s.still=0;
 for(let i=0;i<c.devices.length;i++){
  const d=c.devices[i];if(b.x+r<d.x||b.x-r>d.x+d.w||b.y+r<d.y||b.y-r>d.y+d.h)continue;
  if(d.kind==='water'||d.kind==='lava'){
   if(d.kind==='water'&&(s.shot==='ice'||s.frozen.includes(i))){if(!s.frozen.includes(i))s.frozen.push(i);b.y=d.y+d.h+r;b.vx*=.98;if(Math.abs(b.vy)<8){b.vx=b.vy=0;s.phase='aim';event(s,'land');}else b.vy=Math.abs(b.vy)*.15;}
   else {fail(s);return;}
  }else if(d.kind==='portal'&&s.warpCooldown===0){const target=c.devices[d.pair??-1];if(target?.kind==='portal'){b.x=target.x+target.w/2;b.y=target.y+target.h/2;s.warpCooldown=.8;s.attached=undefined;s.phase='flight';s.still=0;event(s,'warp');}}
  else if(d.kind==='spring'&&b.vy<=5){b.vy=68;b.y=d.y+d.h+r;s.phase='flight';s.attached=undefined;s.still=0;event(s,'spring');}
  else if(d.kind==='bumper'){const x=d.x+d.w/2,y=d.y+d.h/2,dist=Math.hypot(b.x-x,b.y-y);if(dist<d.w/2+r){const nx=(b.x-x)/(dist||1),ny=(b.y-y)/(dist||1);b.x=x+nx*(d.w/2+r+.1);b.y=y+ny*(d.w/2+r+.1);b.vx=nx*46;b.vy=ny*46;s.phase='flight';s.attached=undefined;s.still=0;event(s,'spring');}}
 }
 for(let i=0;i<c.coins.length;i++)if(!s.coins.includes(i)&&Math.hypot(b.x-c.coins[i].x,b.y-c.coins[i].y)<5){s.coins.push(i);event(s,'coin');}
 if(Math.hypot(b.x-c.cup.x,b.y-(c.cup.y+r))<3.8&&Math.hypot(b.vx,b.vy)<24){b.x=c.cup.x;b.y=c.cup.y+r;b.vx=b.vy=0;s.phase='holed';event(s,'goal');return;}
 if(b.x<-15||b.x>c.width+15||b.y<-24||b.y>c.height+160||s.flight>SIDE_RULES.maxFlight){fail(s);return;}
 if(s.phase==='aim'&&s.strokes>=SIDE_RULES.maxStrokes){s.conceded=true;s.phase='holed';}
}
export function tickSide(s:SideState,dt:number){if(!Number.isFinite(dt)||dt<=0)return;const c=SIDE_COURSES[s.courseId];for(let time=Math.min(.1,dt);time>1e-7;){const step=Math.min(time,SIDE_RULES.step);substep(s,c,step);time-=step;}}
/** No separate approximation: the dotted path simulates the same collision/device code. */
export function previewSide(s:SideState,angle:number,power:number,shot:Power,correct=3){
 const copy=structuredClone(s),points:V[]=[];if(!shootSide(copy,angle,power,shot,correct))return points;
 for(let n=0;n<120*SIDE_RULES.maxFlight&&copy.phase==='flight';n++){
  const before={x:copy.ball.x,y:copy.ball.y},serial=copy.serial;tickSide(copy,SIDE_RULES.step);
  // A penalty returns the real ball to its origin; the preview ends at the hazard.
  if(copy.serial!==serial&&copy.event==='water'){points.push(before);return points;}
  if(n%10===0)points.push({x:copy.ball.x,y:copy.ball.y});
 }
 points.push({x:copy.ball.x,y:copy.ball.y});return points;
}
