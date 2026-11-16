export type DreamPower='none'|'comet'|'spark'|'wing'|'stone';
export interface DreamObject {x:number;y:number;kind:'star'|'bumper'|'spring'|'fan'|'pond'|'sand'|'ice'|'crystal'|'spike';radius:number;power?:DreamPower;dx?:number;dy?:number}
export interface DreamCourse {name:string;english:string;par:number;start:{x:number;y:number};goal:{x:number;y:number};objects:DreamObject[];slope:{x:number;y:number};palette:number}
const star=(x:number,y:number,power?:DreamPower):DreamObject=>({x,y,kind:'star',radius:.28,power});
export const DREAM_COURSES:DreamCourse[]=[
 {name:'わた雲のはじめて',english:'Cotton Cloud Welcome',par:3,start:{x:1,y:4},goal:{x:7,y:4},objects:[star(3,4),star(5,4)],slope:{x:0,y:0},palette:0},
 {name:'星くずのカーブ',english:'Stardust Curve',par:4,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(3,5),star(5,3),{x:4,y:4,kind:'bumper',radius:.55}],slope:{x:0,y:0},palette:1},
 {name:'ぷるぷるプリズム',english:'Prism Springs',par:4,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(3,4,'wing'),star(6,2),{x:4.5,y:3,kind:'spring',radius:.7}],slope:{x:0,y:0},palette:2},
 {name:'ミルキーリバー',english:'Milky River',par:5,start:{x:1,y:4},goal:{x:7,y:4},objects:[star(2.6,4),star(6,4),{x:4.2,y:4,kind:'pond',radius:1.05}],slope:{x:0,y:0},palette:0},
 {name:'そよ風のメリーゴーランド',english:'Breeze Carousel',par:5,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(3,4,'comet'),star(6,2),{x:4,y:4,kind:'fan',radius:1,dx:.1,dy:-.24}],slope:{x:0,y:0},palette:1},
 {name:'おひるね砂糖砂漠',english:'Sugar Sand Dunes',par:5,start:{x:1,y:4},goal:{x:7,y:4},objects:[star(3,4),star(6,4,'spark'),{x:4.8,y:4,kind:'sand',radius:1.2}],slope:{x:.12,y:0},palette:3},
 {name:'こおりのワルツ',english:'Ice Waltz',par:5,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(3,4),star(6,3),{x:4.5,y:4,kind:'ice',radius:1.5},{x:5,y:2,kind:'bumper',radius:.65}],slope:{x:0,y:.06},palette:2},
 {name:'流れ星エクスプレス',english:'Comet Express',par:5,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(2.5,5,'comet'),star(5,3),star(6.5,2),{x:4,y:4,kind:'crystal',radius:.35,power:'wing'}],slope:{x:.08,y:-.03},palette:1},
 {name:'いなずま雲の回廊',english:'Thundercloud Gallery',par:6,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(2.5,4.5,'spark'),star(5,4),star(6.5,2.5),{x:4,y:4,kind:'spike',radius:.55},{x:6,y:4,kind:'bumper',radius:.55}],slope:{x:0,y:0},palette:3},
 {name:'ふわり王城の坂道',english:'Cloud Castle Slopes',par:6,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(3,4,'stone'),star(6,3),{x:4.3,y:3.5,kind:'spring',radius:.7},{x:5,y:5,kind:'pond',radius:.85}],slope:{x:-.1,y:.06},palette:0},
 {name:'夢色リフレクション',english:'Dream Reflections',par:6,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(2.7,5,'wing'),star(4.5,2.5),star(6.5,3),{x:3.5,y:3.5,kind:'bumper',radius:.6},{x:5.5,y:4.5,kind:'pond',radius:.9}],slope:{x:0,y:0},palette:2},
 {name:'星のおうかん',english:'Crown of Stars',par:7,start:{x:1,y:5},goal:{x:7,y:2},objects:[star(2.7,5,'comet'),star(4,3,'spark'),star(6,2,'wing'),{x:4,y:5,kind:'spring',radius:.65},{x:5.2,y:3.6,kind:'pond',radius:.85},{x:6,y:5,kind:'bumper',radius:.55}],slope:{x:.04,y:-.02},palette:3},
];
export interface DreamState {course:number;x:number;y:number;z:number;vx:number;vy:number;vz:number;angle:number;spin:number;loft:boolean;phase:'aim'|'spin'|'power'|'rolling'|'clear'|'failed';meter:number;meterTime:number;strokes:number;energy:number;removed:number[];power:DreamPower;powerUsed:boolean;assist:number;elapsed:number;contact:number;last:{x:number;y:number};message:'ready'|'hit'|'bounce'|'water'|'out'|'goal'|'power'|'';freeze:number}
export function dreamInitial(course=0):DreamState {const c=DREAM_COURSES[course];return{course,x:c.start.x,y:c.start.y,z:0,vx:0,vy:0,vz:0,angle:0,spin:0,loft:false,phase:'aim',meter:.5,meterTime:0,strokes:0,energy:4,removed:[],power:'none',powerUsed:false,assist:0,elapsed:0,contact:0,last:{...c.start},message:'ready',freeze:0};}
export function dreamButton(state:DreamState,button:'a'|'b'):DreamState{
 const s={...state,removed:[...state.removed]};
 if(button==='b'){
  if(s.phase==='aim')s.phase='spin';else if(s.phase==='spin'||s.phase==='power')s.phase='aim';
  else if(s.phase==='rolling'&&s.power!=='none'&&!s.powerUsed){s.powerUsed=true;s.message='power';if(s.power==='comet'){s.vx*=1.55;s.vy*=1.55;}if(s.power==='wing')s.vz=Math.max(s.vz,4.8);if(s.power==='stone'){s.vx*=.18;s.vy*=.18;s.vz=-5;}if(s.power==='spark'){const c=DREAM_COURSES[s.course];c.objects.forEach((o,i)=>{if(o.kind==='star'&&Math.hypot(s.x-o.x,s.y-o.y)<1.8&&!s.removed.includes(i))s.removed.push(i);});}}
  return s;
 }
 if(s.phase==='spin'){s.phase='aim';return s;}
 if(s.phase==='aim'){s.phase='power';s.meterTime=0;s.meter=0;return s;}
 if(s.phase==='power'){
  const speed=1.6+s.meter*5.7;s.phase='rolling';s.strokes++;s.energy--;s.vx=Math.cos(s.angle)*speed;s.vy=Math.sin(s.angle)*speed;s.vz=s.loft?2.5+s.meter*3:0;s.powerUsed=false;s.assist=0;s.elapsed=0;s.last={x:s.x,y:s.y};s.message='';return s;
 }
 if(s.phase==='rolling'&&s.assist===0){s.assist=.2;s.message='bounce';}
 return s;
}
export function dreamAim(s:DreamState,dx:number,dy:number):DreamState{
 if(s.phase==='spin')return{...s,spin:Math.max(-1,Math.min(1,s.spin+dx*.12))};
 if(s.phase!=='aim')return s;return{...s,angle:s.angle+dx*.06,loft:dy<0?true:dy>0?false:s.loft};
}
function stopped(s:DreamState,c:DreamCourse){s.vx=0;s.vy=0;s.vz=0;s.z=0;s.phase=s.energy<0||s.strokes>=14?'failed':'aim';s.last={x:s.x,y:s.y};}
export function dreamTick(state:DreamState,dt:number):DreamState{
 const s={...state,removed:[...state.removed]};const c=DREAM_COURSES[s.course];dt=Math.min(dt,1/30);
 if(s.freeze>0){s.freeze-=dt;return s;}
 if(s.phase==='power'){s.meterTime+=dt;s.meter=(1-Math.cos(s.meterTime*4.6))/2;return s;}
 if(s.phase!=='rolling')return s;s.message='';s.elapsed+=dt;s.contact=Math.max(0,s.contact-dt);
 const ground=s.z<=.02;s.vx+=c.slope.x*dt;s.vy+=c.slope.y*dt;
 if(ground&&s.spin){const angle=s.spin*.9*dt,vx=s.vx;s.vx=vx*Math.cos(angle)-s.vy*Math.sin(angle);s.vy=vx*Math.sin(angle)+s.vy*Math.cos(angle);}
 s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;s.vz-=9*dt;
 if(s.z<0){s.z=0;if(Math.abs(s.vz)>.6){s.vz=-s.vz*(s.assist>.01?.88:.42);if(s.assist>.01){s.vx*=1.12;s.vy*=1.12;s.message='bounce';}}else s.vz=0;}
 let friction=ground?.96:.12;
 for(let i=0;i<c.objects.length;i++){
  const o=c.objects[i];if(s.removed.includes(i)||Math.hypot(s.x-o.x,s.y-o.y)>o.radius+.16||s.z>.6)continue;
  if(o.kind==='star'){s.removed.push(i);s.energy=Math.min(4,s.energy+1);if(o.power)s.power=o.power;s.freeze=.045;s.message='hit';}
  if(o.kind==='crystal'){s.removed.push(i);s.power=o.power??'comet';s.message='power';}
  if(o.kind==='sand')friction=3;if(o.kind==='ice')friction=.12;
  if(o.kind==='fan'){s.vx+=(o.dx??0)*dt*10;s.vy+=(o.dy??0)*dt*10;}
  if(o.kind==='spring'&&s.contact===0){s.vz=5.5;s.contact=.3;s.message='bounce';}
  if(o.kind==='bumper'&&s.contact===0){const nx=s.x-o.x,ny=s.y-o.y,len=Math.hypot(nx,ny)||1,dot=(s.vx*nx+s.vy*ny)/len;s.vx-=2*dot*nx/len;s.vy-=2*dot*ny/len;s.x=o.x+nx/len*(o.radius+.18);s.y=o.y+ny/len*(o.radius+.18);s.contact=.12;s.message='bounce';}
  if((o.kind==='pond'||o.kind==='spike')&&s.contact===0){if(o.kind==='pond'&&s.assist>.01&&Math.hypot(s.vx,s.vy)>1){s.vz=3;s.contact=.35;s.message='bounce';}else{s.x=s.last.x;s.y=s.last.y;s.energy--;s.message=o.kind==='pond'?'water':'out';stopped(s,c);return s;}}
 }
 if(s.x<.15||s.x>7.85||s.y<.15||s.y>6.85){s.x=s.last.x;s.y=s.last.y;s.energy--;s.message='out';stopped(s,c);return s;}
 const all=c.objects.every((o,i)=>o.kind!=='star'||s.removed.includes(i));
 if(all&&Math.hypot(s.x-c.goal.x,s.y-c.goal.y)<.45&&s.z<.45&&Math.hypot(s.vx,s.vy)<4.5){s.phase='clear';s.x=c.goal.x;s.y=c.goal.y;s.vx=s.vy=s.vz=0;s.message='goal';return s;}
 const speed=Math.hypot(s.vx,s.vy),loss=Math.max(0,1-friction*dt);s.vx*=loss;s.vy*=loss;s.assist=Math.max(0,s.assist-dt);
 if((speed<.17&&s.z===0&&Math.abs(s.vz)<.1&&s.elapsed>.5)||s.elapsed>14)stopped(s,c);
 return s;
}
