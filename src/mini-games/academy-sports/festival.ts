import {core,athlete,vec,len,clamp,unit,hash,event,stat,pose,tickCore,capture,replay,finish,move,runTo,morale,jump,type Core,type Config,type Input,type Action,type Vec,type Athlete,controlInput} from './core';
export const FESTIVAL_EVENTS=['街中クロスカントリー','障害物部屋競走','巨大ターゲット競争','屋上バトル'];
export type ObstacleKind='hurdle'|'moving'|'ice'|'spring'|'wall'|'gap'|'switch'|'crusher'|'rolling'|'platform';
export interface Obstacle {id:number;kind:ObstacleKind;x:number;z:number;width:number;depth:number;height:number;room:number;}
export interface Item {id:number;x:number;z:number;kind:'boost'|'heal'|'ball';taken:boolean;respawn:number;}
export interface Festival extends Core {individualFinishes?:Record<number,number>;sport:'festival';contest:number;timer:number;limit:number;active:number[];progress:number[];checkpoints:number[];finishes:number[];targetHP:number[];doors:boolean[][];items:Item[];held:Record<number,string>;obstacles:Obstacle[];results:{contest:number;order:number[];records:number[]}[];bonus:number[];combo:Record<number,number>;lastHit:Record<number,number>;falling:Record<number,boolean>;stageDone:boolean;projectiles:{owner:number;team:number;p:Vec;v:Vec;life:number}[];}
export function createFestival(c:Config):Festival{
 const s=Object.assign(core(c,4),{sport:'festival' as const,contest:0,timer:0,limit:90,active:[] as number[],progress:[0,0,0,0],checkpoints:[0,0,0,0],finishes:[Infinity,Infinity,Infinity,Infinity],targetHP:[100,100,100,100],doors:Array.from({length:4},()=>Array(8).fill(false)) as boolean[][],items:[] as Item[],held:{} as Record<number,string>,obstacles:[] as Obstacle[],results:[] as Festival['results'],bonus:[0,0,0,0],combo:{} as Record<number,number>,lastHit:{} as Record<number,number>,falling:{} as Record<number,boolean>,stageDone:false,projectiles:[] as Festival['projectiles']});
 for(let t=0;t<4;t++)for(let i=0;i<2;i++)s.players.push(athlete(t,i,i?'SUPPORT':'CAPTAIN',vec((t-1.5)*2,0,i*2),c));startContest(s,0);return s;
}
export function startContest(s:Festival,index:number){
 s.contest=index;s.individualFinishes={};s.timer=0;s.limit=index<2?90:index===2?75:90;s.progress=[0,0,0,0];s.checkpoints=[0,0,0,0];s.finishes=[Infinity,Infinity,Infinity,Infinity];s.targetHP=[100,100,100,100];s.doors=Array.from({length:4},()=>Array(8).fill(false));s.held={};s.falling={};s.projectiles=[];s.stageDone=false;s.bonus=[0,0,0,0];
 s.active=s.players.filter(p=>s.online||index===2||p.slot===0).map(p=>p.id);s.selected=s.config.team*100;
 for(const p of s.players){p.hp=100;p.spirit=100;p.stun=0;p.cooldown=0;p.v=vec();p.p=index<2?vec((p.team-1.5)*2,0,p.slot*2):index===2?vec(Math.sin(p.team*Math.PI/2)*7+p.slot*.8,0,Math.cos(p.team*Math.PI/2)*7):vec((p.team%2?1:-1)*5,0,p.team<2?5:-5);p.home={...p.p};}
 s.obstacles=[];if(index===0){for(let i=0;i<16;i++)s.obstacles.push({id:i,kind:(['hurdle','moving','ice','spring','gap','platform'] as const)[i%6],x:((i%3)-1)*2,z:-16-i*12,width:i%6===4?8:2.5,depth:1.3,height:1+(i%3)*.3,room:i});}
 if(index===1){const kinds:ObstacleKind[]=['platform','crusher','gap','moving','switch','ice','rolling','platform'];for(let i=0;i<8;i++)s.obstacles.push({id:i,kind:kinds[i],x:kinds[i]==='switch'?3:0,z:-12-i*18,width:kinds[i]==='switch'?1:kinds[i]==='rolling'?1.8:7.8,depth:1.5,height:kinds[i]==='crusher'?3:kinds[i]==='rolling'?1.8:1.1,room:i});}
 s.items=[];for(let i=0;i<(index<2?12:6);i++)s.items.push({id:i,x:index<2?((i%3)-1)*3:Math.sin(i*Math.PI/3)*6,z:index<2?-10-i*15:Math.cos(i*Math.PI/3)*6,kind:(['boost','heal','ball'] as const)[i%3],taken:false,respawn:0});event(s,'whistle',FESTIVAL_EVENTS[index]);
}
export function groundHeight(s:Festival,x:number,z:number,time=s.clock){
 if(s.contest===0){const d=-z;if(d>107&&d<130)return Math.max(0,2.1-Math.abs(d-118)*.19);if(d>153&&d<164)return Math.floor((d-153)/2)*.18;return 0;}
 if(s.contest===2){const radius=Math.hypot(x,z);if(radius<1.5)return 4.8;for(let i=0;i<8;i++){const px=Math.sin(i*Math.PI/4)*4.1,pz=Math.cos(i*Math.PI/4)*4.1;if(Math.hypot(x-px,z-pz)<1.28)return 2.4+(i%3)*.6+(i%2?Math.sin(time*1.3+i)*.45:0);}return 0;}
 return 0;
}
export function festivalOrder(s:Festival){return[0,1,2,3].sort((a,b)=>{if(Number.isFinite(s.finishes[a])||Number.isFinite(s.finishes[b]))return s.finishes[a]-s.finishes[b]||a-b;return s.contest<2?s.progress[b]-s.progress[a]:s.contest===2?s.targetHP[a]-s.targetHP[b]:(s.online?s.players.filter(p=>p.team===b).reduce((n,p)=>n+p.hp,0)-s.players.filter(p=>p.team===a).reduce((n,p)=>n+p.hp,0):s.players.find(p=>p.id===b*100)!.hp-s.players.find(p=>p.id===a*100)!.hp)||s.progress[b]-s.progress[a]||a-b;});}
export function endContest(s:Festival){
 if(s.stageDone)return;s.stageDone=true;const order=festivalOrder(s),records=s.contest<2?s.finishes.map((v,i)=>Number.isFinite(v)?v:90+((s.contest===0?220:156)-s.progress[i])):s.contest===2?[...s.targetHP]:[0,1,2,3].map(t=>s.online?s.players.filter(p=>p.team===t).reduce((n,p)=>n+p.hp,0):s.players.find(p=>p.id===t*100)!.hp);
 order.forEach((team,rank)=>{s.score[team]+=[100,70,40,10][rank]+Math.min(5,s.bonus[team]);stat(s,team,'eventPoints',[100,70,40,10][rank]);stat(s,team,'podiums',rank===0?1:0);});s.results.push({contest:s.contest,order,records});
 if(s.contest===3||s.config.mode==='practice'){finish(s);event(s,'cheer','総合表彰式！');return;}
 s.phase='interval';s.phaseTime=4;event(s,'score',`${FESTIVAL_EVENTS[s.contest]} 結果発表`);
}
function respawn(s:Festival,p:Athlete){
 const checkpoint=s.checkpoints[p.team];p.p=s.contest<2?vec((p.team-1.5)*1.4,0,-checkpoint*18):vec(Math.sin(p.team*Math.PI/2)*7,0,Math.cos(p.team*Math.PI/2)*7);p.v=vec();p.stun=.5;p.hp=Math.max(20,p.hp-8);s.falling[p.id]=false;event(s,'bounce','チェックポイントから復帰',p.id);
}
function damage(s:Festival,p:Athlete,other:Athlete,amount:number,launch=false){
 if(other.stun>.4)return;const delta=unit(other.p.x-p.p.x,other.p.z-p.p.z);const guarding=other.motion==='guard'&&(Math.sin(other.face)*-delta.x+Math.cos(other.face)*-delta.z)>.1;
 const dealt=amount*(guarding?.2:1)*(1.15-other.skills.defense*.25);other.hp=Math.max(0,other.hp-dealt);other.spirit=Math.max(0,other.spirit-(guarding?12:3));other.stun=guarding?.12:.45;pose(other,guarding?'guard':'hurt',.5);other.p.x+=delta.x*(launch?2.5:.8);other.p.z+=delta.z*(launch?2.5:.8);if(launch)other.v.y=4;morale(s,p.team,10);stat(s,p.team,'hits');event(s,'hurt',guarding?'ガード！':'コミカルヒット！',p.id);
 if(!other.hp&&s.contest===3)s.progress[other.team]=s.timer;
 if(!other.hp&&s.contest!==3)respawn(s,other);
}
function attack(s:Festival,p:Athlete,strong=false,grab=false){
 if(p.cooldown||p.stun||p.hp<=0)return;p.cooldown=strong?1.1:.45;const combo=(s.combo[p.id]||0)+1;s.combo[p.id]=combo;pose(p,grab?'throw':strong?'kick':combo%2?'punch':'kick',.45);const range=strong?2.8:grab?1.1:1.7;
 for(const other of s.players.filter(q=>s.active.includes(q.id)&&q.team!==p.team&&q.hp>0))if(len(p.p,other.p)<range&&Math.abs(p.p.y-other.p.y)<1.6){damage(s,p,other,strong?19:grab?12:8,strong||grab);}
 if(s.contest===2&&Math.hypot(p.p.x,p.p.z)<3.2&&p.p.y>3.8){s.targetHP[p.team]=Math.max(0,s.targetHP[p.team]-(strong?24:10)*(p.skills.power+.3));stat(s,p.team,'targetDamage',strong?24:10);event(s,'hit','ターゲットにヒット！',p.id);}
 if(s.contest===1){for(const o of s.obstacles)if(o.kind==='switch'&&len(p.p,vec(o.x,0,o.z))<2.3){s.doors[p.team][o.room]=true;event(s,'catch','スイッチで扉が開いた！',p.id);}}
}
export function festivalAction(s:Festival,action:Action,input:Input){
 if(action==='next'){s.phaseTime=0;return;}if(s.phase!=='play')return;const p=s.players.find(q=>q.id===s.selected)!;if(!p||p.hp<=0)return;
 if(action==='jump'){const floor=groundHeight(s,p.p.x,p.p.z);if(Math.abs(p.p.y-floor)<.25&&p.v.y<=.1){p.v.y=8+p.skills.jump;pose(p,'jump',.8);}}
 if(action==='primary')attack(s,p);if(action==='alternate')attack(s,p,false,true);if(action==='defend'){pose(p,'guard',.75);p.spirit=Math.max(0,p.spirit-5);}
 if(action==='special'&&s.morale[p.team]>=45){s.morale[p.team]-=45;p.cooldown=0;attack(s,p,true);jump(p,5);event(s,'special',['星跳び旋風','朝風ラッシュ','若葉インパクト','灯火スピン'][p.team],p.id);}
 if(action==='pass'){
  const item=s.held[p.id];if(item){delete s.held[p.id];if(item==='boost'){p.spirit=100;move(p,input.x||0,input.z||-1,.35,true);event(s,'special','風のシューズ！',p.id);}else if(item==='heal'){p.hp=Math.min(100,p.hp+30);p.spirit=100;event(s,'catch','元気ドリンク！',p.id);}else {const other=s.players.filter(q=>q.team!==p.team&&s.active.includes(q.id)).sort((a,b)=>len(a.p,p.p)-len(b.p,p.p))[0];const target=s.contest===2?vec(Math.sin(p.team*Math.PI/2)*.9,7.3,Math.cos(p.team*Math.PI/2)*.9):other?{...other.p,y:1}:vec(p.p.x,1,p.p.z-8);const travel=Math.max(.5,len(p.p,target)/16);s.projectiles.push({owner:p.id,team:p.team,p:vec(p.p.x,p.p.y+1.5,p.p.z),v:vec((target.x-p.p.x)/travel,(target.y-p.p.y-1.5+4.905*travel*travel)/travel,(target.z-p.p.z)/travel),life:3});pose(p,'throw',.5);event(s,'hit','ボールを投げた！',p.id);}}
 }
}
function raceStep(s:Festival,p:Athlete,input:Input,dt:number,controlled:boolean){
 if(s.online?Number.isFinite(s.individualFinishes?.[p.id]):Number.isFinite(s.finishes[p.team]))return;const before={...p.p},oldFloor=groundHeight(s,p.p.x,p.p.z);let x=input.x,z=input.z;
 if(!controlled){
  const level=s.config.difficulty,lead=[2.1,2.9,3.6,4.1][level];
  const nearest=s.obstacles.filter(o=>o.z<p.p.z&&p.p.z-o.z<8).sort((a,b)=>b.z-a.z)[0];z=-1;x=clamp(((p.team-1.5)*1.2-p.p.x)*.7,-1,1);
  if(level>=2&&s.contest===0&&-p.p.z>68&&-p.p.z<95)x=clamp((4.4-p.p.x)*1.4,-1,1);
  if(nearest){if(nearest.kind==='switch'&&!s.doors[p.team][nearest.room]){x=clamp((3-p.p.x)*1.5,-1,1);if(p.p.z-nearest.z<2&&Math.abs(p.p.x-3)<1.4){attack(s,p);s.doors[p.team][nearest.room]=true;}}
   else if(['hurdle','gap','crusher','moving','platform'].includes(nearest.kind)&&p.p.z-nearest.z<lead&&p.p.y<=oldFloor+.2){p.v.y=7.8+p.skills.jump;pose(p,'jump',.7);}
   if(level>=2&&nearest.kind==='rolling'){const predicted=Math.sin(s.clock*2+.6+nearest.id)*3;x=clamp((predicted>0?-3.5:3.5)-p.p.x,-1,1);}
  }
 }else if(s.config.assist&&Math.abs(z)<.1)z=-1;
 move(p,x,z,dt,controlled?input.dash:p.spirit>20);
 const floor=groundHeight(s,p.p.x,p.p.z);if(p.p.y<=floor&&p.v.y<=0&&before.y>=floor-.5){p.p.y=floor;p.v.y=0;}
 p.p.x=clamp(p.p.x,-5.3,5.3);
 for(const o of s.obstacles){
  const ox=o.kind==='moving'||o.kind==='rolling'?Math.sin(s.clock*(o.kind==='rolling'?2:1.5)+o.id)*3:o.x;
  if(Math.abs(p.p.z-o.z)<o.depth*.5+.4&&Math.abs(p.p.x-ox)<o.width*.5+.3){
   const height=o.kind==='crusher'?Math.max(.2,1.4+Math.sin(s.clock*2)*1.8):o.height;
   if(o.kind==='spring'&&p.p.y<floor+.4){p.v.y=9;pose(p,'jump',.8);}
   else if(o.kind==='ice'){p.p.x+=p.v.x*dt*.7;}
   else if(o.kind==='switch'){/* Trigger is on the wall's side, not a collision box. */}
   else if(o.kind==='gap'){if(p.p.y<.35){s.falling[p.id]=true;p.v.y=-3;}}
   else if(p.p.y<floor+height&&p.stun<=0){p.p.z=before.z;p.stun=.35;p.spirit=Math.max(0,p.spirit-8);pose(p,'hurt',.35);if(!controlled&&p.p.y<=floor+.1)p.v.y=8;}
  }
  if(o.kind==='switch'&&!s.doors[p.team][o.room]&&p.p.z<o.z-1&&before.z>=o.z-1){p.p.z=before.z;p.stun=.08;}
 }
 if(s.falling[p.id]){p.p.y-=dt*5;if(p.p.y<-3)respawn(s,p);}
 if(s.contest===0&&-p.p.z>70&&-p.p.z<95&&p.p.x>3.5&&p.spirit>10){p.p.z-=dt*1.8;p.spirit-=dt*3;}
 s.progress[p.team]=Math.max(s.progress[p.team],-p.p.z);const checkpoint=Math.floor(Math.max(0,-p.p.z)/18);s.checkpoints[p.team]=Math.max(s.checkpoints[p.team],checkpoint);
 const length=s.contest===0?220:156;if(-p.p.z>=length){if(s.online){s.individualFinishes??={};s.individualFinishes[p.id]=s.timer;const team=s.players.filter(q=>q.team===p.team&&s.active.includes(q.id));if(team.every(q=>Number.isFinite(s.individualFinishes![q.id])))s.finishes[p.team]=Math.max(...team.map(q=>s.individualFinishes![q.id]));}else s.finishes[p.team]=Math.min(s.finishes[p.team],s.timer);pose(p,'celebrate',5);event(s,'score',`TEAM ${p.team+1} ゴール！`,p.id);}
}
function targetStep(s:Festival,p:Athlete,input:Input,dt:number,controlled:boolean){
 const floor=groundHeight(s,p.p.x,p.p.z),before=p.p.y,previous={...p.p};
 if(controlled)move(p,input.x,input.z,dt,input.dash);else{
  const radius=Math.hypot(p.p.x,p.p.z);const angle=p.team*Math.PI/2,target=radius>4.8?vec(Math.sin(angle)*4.1,0,Math.cos(angle)*4.1):vec(0,0,0);
  if(Math.abs(p.p.y-floor)<.25&&p.v.y<=.1&&!p.cooldown){p.v.y=8+p.skills.jump;pose(p,'jump',.8);}
  runTo(p,target,dt,true);if(Math.hypot(p.p.x,p.p.z)<3&&p.p.y>3.8)attack(s,p,p.spirit>40);
  if(s.held[p.id]&&!p.cooldown){const selected=s.selected;s.selected=p.id;festivalAction(s,'pass',input);s.selected=selected;}
 }
 let afterFloor=groundHeight(s,p.p.x,p.p.z);if(afterFloor>floor+.5&&p.p.y<afterFloor-.25){p.p.x=previous.x;p.p.z=previous.z;afterFloor=floor;}
 if(p.v.y<=0&&before>=afterFloor-.3&&p.p.y<=afterFloor){p.p.y=afterFloor;p.v.y=0;}
 p.p.x=clamp(p.p.x,-9,9);p.p.z=clamp(p.p.z,-9,9);
 if(s.targetHP[p.team]<=0&&!Number.isFinite(s.finishes[p.team])){s.finishes[p.team]=s.timer;event(s,'score',`TEAM ${p.team+1} ターゲット破壊！`,p.id);}
}
function brawlStep(s:Festival,p:Athlete,input:Input,dt:number,controlled:boolean){
 if(p.hp<=0)return;
 if(controlled)move(p,input.x,input.z,dt,input.dash);else{
  const enemy=s.players.filter(q=>s.active.includes(q.id)&&q.team!==p.team&&q.hp>0).sort((a,b)=>len(a.p,p.p)-len(b.p,p.p))[0];if(enemy){runTo(p,enemy.p,dt,len(p.p,enemy.p)>3&&p.spirit>20);if(enemy.action>0&&s.config.difficulty>1&&p.spirit>20&&hash(Math.floor(s.clock*4)+p.id)%3===0)pose(p,'guard',.3);else if(len(p.p,enemy.p)<1.7){const counter=s.config.difficulty>=2&&enemy.motion==='guard'&&len(p.p,enemy.p)<1.1;attack(s,p,s.morale[p.team]>45,counter);if(s.morale[p.team]>45)s.morale[p.team]-=45;}}
 }
 if(Math.abs(p.p.x)>9||Math.abs(p.p.z)>9){if(s.config.ringOut){p.hp=0;s.progress[p.team]=s.timer;pose(p,'hurt',1.2);event(s,'whistle','リングアウト！',p.id);}else{p.p.x=clamp(p.p.x,-8.8,8.8);p.p.z=clamp(p.p.z,-8.8,8.8);}}
 if(p.hp<=0){s.finishes[p.team]=Infinity;stat(s,p.team,'knockoutsTaken');}
}
export function stepFestival(s:Festival,input:Input,dt:number){
 const advancing=tickCore(s,dt);if(s.phase==='play'&&s.stageDone){startContest(s,s.contest+1);s.phase='ready';s.phaseTime=1.5;return;}if(!advancing)return;capture(s,dt);s.timer+=dt;
 for(const p of s.players.filter(p=>s.active.includes(p.id))){const control=controlInput(s,p,input),controlled=!!control,playerInput=control||input;
  if(s.contest<2)raceStep(s,p,playerInput,dt,controlled);else if(s.contest===2)targetStep(s,p,playerInput,dt,controlled);else brawlStep(s,p,playerInput,dt,controlled);
  for(const item of s.items){if(item.taken){item.respawn-=dt;if(item.respawn<=0)item.taken=false;continue;}if(!s.held[p.id]&&len(p.p,vec(item.x,0,item.z))<.9&&p.p.y<1.5){s.held[p.id]=item.kind;item.taken=true;item.respawn=s.contest<2?999:10;event(s,'catch','アイテムを拾った！',p.id);if(!controlled){const selected=s.selected;s.selected=p.id;festivalAction(s,'pass',input);s.selected=selected;}}}
 }
 for(const projectile of s.projectiles){projectile.life-=dt;projectile.v.y-=9.81*dt;projectile.p.x+=projectile.v.x*dt;projectile.p.y+=projectile.v.y*dt;projectile.p.z+=projectile.v.z*dt;
  if(s.contest===2&&Math.hypot(projectile.p.x,projectile.p.z)<2&&projectile.p.y>6.2&&projectile.p.y<8.7){s.targetHP[projectile.team]=Math.max(0,s.targetHP[projectile.team]-14);stat(s,projectile.team,'targetDamage',14);projectile.life=0;event(s,'hit','ターゲット命中！',projectile.owner);}
  else for(const q of s.players.filter(q=>q.team!==projectile.team&&s.active.includes(q.id)&&q.hp>0))if(len(q.p,projectile.p)<.7&&Math.abs(q.p.y+1-projectile.p.y)<1.1){damage(s,s.players.find(p=>p.id===projectile.owner)!,q,12,true);projectile.life=0;break;}
 }s.projectiles=s.projectiles.filter(p=>p.life>0&&p.p.y>0);
 if(s.contest===3){const alive=s.players.filter(p=>s.active.includes(p.id)&&p.hp>0);if(new Set(alive.map(p=>p.team)).size<=1){if(alive[0])s.finishes[alive[0].team]=s.timer;endContest(s);return;}}
 if(s.timer>=s.limit||s.contest<3&&s.finishes.every(Number.isFinite))endContest(s);
}
