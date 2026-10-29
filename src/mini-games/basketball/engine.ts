import {cpuSpecialReady,spendCpuSpecial,initialCpuSpecialBudget} from '../shared/cpuSpecialBudget';
import {sportsEvent} from '../shared/sportsEvents';
import {validAvatar} from '../gakuro-kart/avatar';
import {validLesson} from '../gakuro-kart/learning';
import {bracketSeeds} from '../tennis/scoring';
import {COURT,ROLES,POSITIONS,MATCH_SECONDS,SHOT_SECONDS,CHARGE_MAX,clamp,distance,rimDistance,shotQuality,shotChance,emptyStats,contest} from './rules';
import type {BasketWorld,BasketView,Match,Unit,Side,Team,LessonFactory,Position,Stats} from './types';
export type * from './types';
export {MATCH_SECONDS} from './rules';
export const MAX_PLAYERS=24,MAX_MEMBERS=32,WIDTH=COURT.width,LENGTH=COURT.back;
const rng=(w:BasketWorld)=>{w.random=(Math.imul(w.random,1664525)+1013904223)>>>0;return w.random/4294967296;};
const other=(side:Side)=>(1-side) as Side;
function notice(w:BasketWorld,m:Match,text:string){m.notice=text;m.noticeAt=w.clock;m.serial++;}
function stat(w:BasketWorld,u:Unit,key:keyof Stats,value=1){u.stats[key]+=value;if(u.owner){const p=w.players[u.owner];p.stats??=emptyStats();p.stats[key]+=value;}u.energy=clamp(u.energy+.12,0,1);}
export function createBasketball(seed=1,practice=false,tutorial=false):BasketWorld{return {version:2,tutorialRequested:practice&&tutorial,seed,random:seed>>>0,clock:0,phase:'lobby',practice,paused:false,title:'',players:{},teams:[],matches:[],round:0,nextRoundAt:0,champion:null,quizSerial:0};}
export function addPlayer(w:BasketWorld,id:string,name:string,spectator=false){
 if(w.phase==='result'||!id||id.length>100||Object.hasOwn(w.players,id)||['__proto__','constructor','prototype'].includes(id)||Object.keys(w.players).length>=MAX_MEMBERS||typeof name!=='string'||!name.trim())return false;
 const used=new Set(Object.values(w.players).map(p=>p.slot));let slot=0;while(used.has(slot))slot++;
 w.players[id]={id,name:name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,16)||'Player',slot,connected:true,spectator:spectator||w.phase!=='lobby'||Object.values(w.players).filter(p=>!p.spectator).length>=MAX_PLAYERS,role:'SF',stats:emptyStats(),correct:0,history:[],quiz:null,input:{x:0,y:0,at:0}};return true;
}
export function setSpectator(w:BasketWorld,id:string,enabled:unknown){const p=w.players[id];if(w.phase!=='lobby'||!p||typeof enabled!=='boolean'||!enabled&&Object.values(w.players).filter(p=>p.connected&&!p.spectator).length>=MAX_PLAYERS)return false;p.spectator=enabled;return true;}
function teamsFor(w:BasketWorld):Team[]{const ids=Object.values(w.players).filter(p=>p.connected&&!p.spectator).map(p=>p.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(rng(w)*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}const count=Math.max(2,Math.ceil(ids.length/3)),teams:Team[]=Array.from({length:count},(_,id)=>({id,name:`TEAM ${id+1}`,members:[null,null,null]}));ids.forEach((id,i)=>{teams[i%count].members[Math.floor(i/count)]=id;});return teams;}
function makeMatch(w:BasketWorld,a:number,b:number|null):Match{
 const id=`r${w.round}-m${w.matches.length}`,units:Unit[]=[];
 for(const[side,team]of [[0,a],[1,b]] as const)if(team!==null){const used=new Set(w.teams[team].members.flatMap(id=>id?[w.players[id].role||'SF']:[]));w.teams[team].members.forEach((owner,i)=>{const p=owner?w.players[owner]:undefined,role=p?.role||(['PG','SF','C'] as Position[]).find(r=>!used.has(r))||'C';used.add(role);
  units.push({id:`${id}-${side}-${i}`,owner,name:p?.name||`CPU ${side+1}-${i+1}`,side,role,x:0,y:0,vx:0,vy:0,cpu:!p||!p.connected,avatar:p?.avatar,energy:.35,stamina:1,focus:.65,charge:0,charging:false,release:0,motion:'idle',action:0,actionSeq:0,cooldown:0,dashCooldown:0,skillCooldown:0,dodge:0,catch:0,hurt:0,jump:0,screen:0,buff:0,aiAt:0,stats:emptyStats()});});}
 const m:Match={id,cpuSpecialAt:initialCpuSpecialBudget(w.clock),round:w.round,teams:[a,b],units,phase:b===null?'finished':'study',winner:b===null?a:null,reason:b===null?'bye':'',score:[0,0],time:0,studyAt:0,shotClock:24,possession:0,mustClear:false,inbound:0,serial:0,notice:'',noticeAt:0,ball:{x:0,y:-3.5,z:1,vx:0,vy:0,vz:0,holder:null,side:null,flight:0,special:false,pass:false,age:0,lock:0,trail:[],shooter:null,receiver:null,assist:null,points:2,success:false}};
 checkBall(m,0);return m;
}
function study(w:BasketWorld,m:Match,factory:LessonFactory|undefined){
 const ps=m.units.flatMap(u=>u.owner&&w.players[u.owner].connected?[w.players[u.owner]]:[]),lessons=ps.map(p=>{const l=factory?.(p.history);if(!validLesson(l)||l.questions.length!==3)throw Error('Invalid basketball lesson');return structuredClone(l);});
 m.phase='study';m.studyAt=m.time;for(const u of m.units){u.charging=false;u.charge=0;u.vx=u.vy=0;}
 ps.forEach((p,i)=>{p.quiz={id:++w.quizSerial,index:0,lesson:lessons[i],selected:null,feedback:null};p.input={x:0,y:0,at:w.clock};});if(!ps.length)m.phase='play';
}
export function startBasketball(w:BasketWorld,factory:LessonFactory){
 if(w.phase!=='lobby'||!validLesson(factory([])))return false;const count=Object.values(w.players).filter(p=>p.connected&&!p.spectator).length;if(count<(w.practice?1:2))return false;
 w.teams=teamsFor(w);w.phase='playing';w.round=0;w.matches=[];w.champion=null;w.nextRoundAt=0;const seeds=bracketSeeds(w.teams.length);
 try{for(let i=0;i<seeds.length;i+=2){const a=seeds[i],b=seeds[i+1];if(a===null&&b===null)continue;const m=makeMatch(w,a??b!,a===null?null:b);w.matches.push(m);if(w.tutorialRequested&&w.practice)initTutorial(m);if(m.phase!=='finished')study(w,m,factory);}}
 catch{w.phase='lobby';w.matches=[];w.teams=[];for(const p of Object.values(w.players))p.quiz=null;return false;}return true;
}
export function currentMatch(w:BasketWorld,id:string){return w.matches.find(m=>m.round===w.round&&m.units.some(u=>u.owner===id));}
export function disconnectPlayer(w:BasketWorld,id:string){const p=w.players[id];if(!p)return;if(w.phase==='lobby'){delete w.players[id];return;}p.connected=false;p.quiz=null;p.input={x:0,y:0,at:w.clock};for(const m of w.matches)for(const u of m.units)if(u.owner===id){u.cpu=true;u.charging=false;}}
export function rematch(w:BasketWorld){if(w.phase!=='result')return false;w.phase='lobby';w.matches=[];w.teams=[];w.champion=null;w.nextRoundAt=0;for(const[id,p]of Object.entries(w.players))if(!p.connected)delete w.players[id];else{p.correct=0;p.stats=emptyStats();p.history=[];p.quiz=null;p.input={x:0,y:0,at:w.clock};}return true;}
function takeBall(m:Match,u:Unit,rebound=false){
 const changed=u.side!==m.possession;m.possession=u.side;if(changed)m.mustClear=!m.tutorial;if(m.tutorial)m.mustClear=false;
 if(changed)m.shotClock=SHOT_SECONDS;else if(rebound)m.shotClock=Math.max(14,m.shotClock);
 Object.assign(m.ball,{holder:u.id,side:null,flight:0,pass:false,age:0,lock:.16,vx:0,vy:0,vz:0,x:u.x,y:u.y,z:1,receiver:null,shooter:null,success:false});u.charging=false;
 if(changed||rebound)m.ball.assist=null;
}
function checkBall(m:Match,side:Side){
 m.possession=side;m.mustClear=false;m.shotClock=SHOT_SECONDS;m.inbound=0;
 const attack=[[-4,-.9],[0,-3.5],[3,3.6]],defend=[[-3,1.3],[0,.7],[2.8,4.4]];
 for(const s of[0,1])m.units.filter(u=>u.side===s).forEach((u,i)=>{const p=(s===side?attack:defend)[i];u.x=p[0];u.y=p[1];u.vx=u.vy=0;u.charging=false;u.charge=0;u.screen=u.jump=u.dodge=0;u.motion='idle';u.action=0;});
 const holder=m.units.find(u=>u.side===side&&u.role==='PG')||m.units.find(u=>u.side===side);if(holder){takeBall(m,holder);m.ball.assist=null;}
}
function shoot(w:BasketWorld,m:Match,u:Unit,quality:number){
 if(m.ball.holder!==u.id||m.inbound>0||m.mustClear)return false;
 const d=rimDistance(u);if(m.tutorial&&d>3.5)return false;
 const dunk=d<(u.role==='SF'&&u.buff>0?3.3:2.15)&&u.stamina>.18,role=ROLES[u.role],duration=dunk?.68:1.05+Math.min(.18,d*.012);
 const success=!!m.tutorial||rng(w)<shotChance(m,u,quality),miss=success?0:(rng(w)>.5?1:-1)*(1.15+rng(w)*.7);
 Object.assign(m.ball,{holder:null,side:u.side,flight:1,pass:false,special:u.buff>0,age:0,lock:duration,x:u.x,y:u.y,z:1.65,vx:(miss-u.x)/duration,vy:(COURT.hoopY-u.y)/duration,vz:(3.1-1.65+4.9*duration*duration)/duration,points:d>COURT.three?3:2,success,shooter:u.id,receiver:null,trail:[]});
 u.charging=false;u.charge=0;u.release=quality;u.action=.65;u.jump=dunk?.68:.5;u.motion=dunk?'dunk':'shot';u.actionSeq=m.serial+1;u.stamina=clamp(u.stamina-.08,0,1);if(u.role==='SG'||u.role==='SF')u.buff=0;
 sportsEvent(m,'action',w.clock,u.id);
 notice(w,m,dunk?'DUNK':quality>.92?'PERFECT RELEASE':contest(m,u)>.45?'CONTESTED':'SHOT');return true;
}
function passBall(w:BasketWorld,m:Match,u:Unit,targetId?:string,recipient?:Unit){
 if(m.ball.holder!==u.id||m.inbound>0)return false;
 const input=u.owner?w.players[u.owner].input:undefined;
 const mates=m.units.filter(v=>v.side===u.side&&v!==u),rank=(v:Unit)=>{const dx=v.x-u.x,dy=v.y-u.y,d=Math.max(.1,Math.hypot(dx,dy));const aim=input&&w.clock-input.at<.35?(dx*input.x+dy*input.y)/d:0;return shotChance(m,v)+aim*.8-distance(u,v)*.018;};
 const target=recipient||mates.find(v=>v.id===targetId)||mates.sort((a,b)=>rank(b)-rank(a))[0];if(!target)return false;
 const duration=Math.max(.22,distance(target,u)/(u.role==='PG'?23:19)),tx=clamp(target.x+target.vx*duration*.65,-7,7),ty=clamp(target.y+target.vy*duration*.65,-7,7.5);
 Object.assign(m.ball,{holder:null,side:u.side,flight:1,pass:true,special:false,age:0,lock:duration,x:u.x,y:u.y,z:1.15,vx:(tx-u.x)/duration,vy:(ty-u.y)/duration,vz:2.1,receiver:target.id,shooter:null,assist:u.id,trail:[]});
 u.charging=false;u.charge=0;u.motion='pass';u.action=.32;u.actionSeq=m.serial+1;notice(w,m,'PASS');return true;
}
function dash(w:BasketWorld,m:Match,u:Unit){
 if(u.dashCooldown>0||u.stamina<.2||u.charging||u.hurt>0)return false;
 const p=u.owner?w.players[u.owner]:undefined;if(m.tutorial?.stage==='dash'&&p&&Math.hypot(p.input.x,p.input.y)<.15)return false;
 u.dodge=.46;u.dashCooldown=2.2;u.stamina-=.2;u.motion='drive';u.action=.46;u.screen=0;
 if(p&&Math.hypot(p.input.x,p.input.y)<.15){const goal=m.mustClear?{x:u.x<0?-5:5,y:-1.5}:m.ball.holder===u.id?{x:0,y:COURT.hoopY}:m.ball;const d=Math.max(.1,distance(goal,u));p.input={x:(goal.x-u.x)/d,y:(goal.y-u.y)/d,at:w.clock};}
 if(m.tutorial?.stage==='dash'){m.tutorial.stage='pass';m.tutorial.elapsed=0;}return true;
}
function jump(w:BasketWorld,m:Match,u:Unit,kind:'block'|'rebound'){
 if(u.jump>0||u.cooldown>0||u.stamina<.13||m.ball.holder===u.id)return false;
 u.jump=.68;u.motion=kind;u.action=.68;u.cooldown=.85;u.stamina-=.13;u.charging=false;u.actionSeq=m.serial+1;notice(w,m,kind==='block'?'BLOCK ATTEMPT':'REBOUND ATTEMPT');return true;
}
function steal(w:BasketWorld,m:Match,u:Unit){
 if(u.cooldown>0||u.jump>0||u.hurt>0||m.ball.holder===u.id||u.stamina<.08)return false;
 u.catch=.3;u.cooldown=.9;u.motion='steal';u.action=.3;u.stamina-=.08;
 const holder=m.units.find(v=>v.id===m.ball.holder);
 if(holder&&holder.side!==u.side&&distance(holder,u)<1.5){const chance=ROLES[u.role].steal+(holder.charging?.22:0)-(holder.dodge>0?.32:0);if(m.tutorial||rng(w)<chance){takeBall(m,u);stat(w,u,'steals');notice(w,m,'STEAL');if(m.tutorial?.stage==='steal'){m.tutorial.stage='shoot';m.tutorial.elapsed=0;}}}return true;
}
function screen(w:BasketWorld,m:Match,u:Unit){if(m.possession!==u.side||m.ball.holder===u.id||u.cooldown>0||u.stamina<.12)return false;u.screen=1.5;u.action=1.5;u.motion='screen';u.stamina-=.12;u.cooldown=1.9;notice(w,m,'SCREEN');return true;}
function skill(w:BasketWorld,m:Match,u:Unit){
 if(u.cpu&&!cpuSpecialReady(m,u.side,w.clock))return false;
 if(u.energy<.999||u.skillCooldown>0||m.tutorial||m.inbound>0||u.charging)return false;if(['PF','C'].includes(u.role)&&(m.ball.holder===u.id||u.stamina<.13))return false;
 if(['PG','SG','SF'].includes(u.role)&&m.ball.holder!==u.id)return false;
 if(u.role==='PG'&&u.stamina<.2)return false;
 if(u.cpu)spendCpuSpecial(m,u.side,w.clock);u.energy=0;u.skillCooldown=18;u.buff=u.role==='SG'?6:4;u.actionSeq=m.serial+1;
 if(u.role==='PG'){u.dashCooldown=0;dash(w,m,u);u.dodge=.75;}
 else if(u.role==='SF'){u.dashCooldown=0;dash(w,m,u);}
 else if(u.role==='PF'){u.cooldown=0;jump(w,m,u,'rebound');}
 else if(u.role==='C'){u.cooldown=0;jump(w,m,u,'block');}
 u.actionSeq=m.serial+1;notice(w,m,'SKILL');sportsEvent(m,'special',w.clock,u.id);return true;
}
export function command(w:BasketWorld,id:string,raw:unknown,_factory?:LessonFactory){
 const p=w.players[id],c=raw as Record<string,any>;if(!p?.connected||!c||typeof c!=='object'||Array.isArray(c))return false;
 if(c.type==='avatar'){if(w.phase!=='lobby'||!validAvatar(c.avatar))return false;p.avatar=structuredClone(c.avatar);return true;}
 if(c.type==='role'){if(w.phase!=='lobby'||!POSITIONS.includes(c.role))return false;p.role=c.role;return true;}
 if(p.spectator||w.phase!=='playing')return false;const m=currentMatch(w,id),u=m?.units.find(u=>u.owner===id);if(!m||!u||m.phase==='finished')return false;
 if(c.type==='answer'||c.type==='continue'){
  const q=p.quiz;if(m.phase!=='study'||!q||c.id!==q.id||c.index!==q.index)return false;
  if(c.type==='answer'){if(q.selected!==null||!Number.isInteger(c.option)||c.option<0||c.option>3)return false;q.selected=c.option;q.feedback=q.lesson.questions[q.index].correct;if(q.selected===q.feedback){p.correct++;u.energy=clamp(u.energy+.1,0,1);u.focus=clamp(u.focus+.1,0,1);}return true;}
  if(q.selected===null)return false;p.history=[...p.history,q.lesson.questions[q.index].id].slice(-120);if(++q.index===3){p.quiz=null;if(m.units.every(v=>!v.owner||!w.players[v.owner].connected||!w.players[v.owner].quiz))m.phase='play';}else{q.selected=null;q.feedback=null;}return true;
 }
 if(c.type==='shot-cancel'){u.charging=false;u.charge=0;return true;}
 if(c.type==='move'&&c.x===0&&c.y===0){p.input={x:0,y:0,at:w.clock};return true;}
 if(m.phase!=='play'||w.paused)return false;
 if(c.type==='tutorial-complete'){if(!w.practice||m.tutorial?.stage!=='complete'||m.tutorial.owner!==id)return false;delete m.tutorial;w.tutorialRequested=false;m.score=[0,0];m.time=m.studyAt=0;for(const v of m.units)v.stats=emptyStats();p.stats=emptyStats();checkBall(m,u.side);takeBall(m,u);return true;}
 if(m.tutorial&&c.type!=='move'){const stage=m.tutorial.stage,allowed=stage==='dash'?['dodge']:stage==='pass'?['pass']:stage==='steal'?['catch']:stage==='shoot'?['throw','shot-start','shot-release']:[];if(!allowed.includes(c.type))return false;}
 if(m.inbound>0)return false;
 if(c.type==='move'){if(![c.x,c.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1))return false;const length=Math.max(1,Math.hypot(c.x,c.y));p.input={x:c.x/length,y:c.y/length,at:w.clock};if(length>.15&&(c.x||c.y))u.screen=0;return true;}
 if(c.type==='shot-start'){if(m.ball.holder!==u.id||u.charging||m.mustClear)return false;u.charging=true;u.charge=0;u.motion='shot';return true;}
 if(c.type==='shot-release'){if(!u.charging)return false;return shoot(w,m,u,shotQuality(u.charge));}
 if(c.type==='throw'){if(typeof c.aim!=='number'||!Number.isFinite(c.aim)||Math.abs(c.aim)>1||typeof c.special!=='boolean')return false;return c.special?skill(w,m,u):shoot(w,m,u,.65);}
 if(c.type==='pass'){if(c.target!==undefined&&(typeof c.target!=='string'||c.target.length>80))return false;return passBall(w,m,u,c.target);}
 if(c.type==='catch')return steal(w,m,u);
 if(c.type==='dodge')return dash(w,m,u);
 if(c.type==='block')return jump(w,m,u,'block');
 if(c.type==='rebound')return jump(w,m,u,'rebound');
 if(c.type==='screen')return screen(w,m,u);
 if(c.type==='special')return skill(w,m,u);
 if(c.type==='call'){const holder=m.units.find(v=>v.id===m.ball.holder);return !!holder&&holder.side===u.side&&holder.cpu&&passBall(w,m,holder,u.id);}
 return false;
}
function initTutorial(m:Match){const own=m.units.find(u=>u.owner);if(!own)return;own.x=-3.8;own.y=-3;m.tutorial={stage:'move',owner:own.owner!,startX:own.x,startY:own.y,elapsed:0};m.units.filter(u=>u.side===own.side&&u!==own).forEach((u,i)=>{u.x=i?3:-2;u.y=i?1:3;});m.units.filter(u=>u.side!==own.side).forEach((u,i)=>{u.x=i%2?-5.8:5.8;u.y=i*1.8+1;});takeBall(m,own);m.mustClear=false;}
function advanceTutorial(w:BasketWorld,m:Match,dt:number){const t=m.tutorial!;t.elapsed+=dt;const own=m.units.find(u=>u.owner===t.owner)!;
 if(t.stage==='move'&&Math.hypot(own.x-t.startX,own.y-t.startY)>1.8){t.stage='dash';t.elapsed=0;}
 else if(t.stage==='pass'&&m.ball.holder&&m.ball.holder!==own.id){t.stage='receive';t.elapsed=0;}
 else if(t.stage==='receive'){const holder=m.units.find(u=>u.id===m.ball.holder);if(holder&&holder!==own&&t.elapsed>.8)passBall(w,m,holder,own.id,own);if(holder===own&&t.elapsed>1.8){const opponent=m.units.find(u=>u.side!==own.side)!;opponent.x=clamp(own.x+1,-7,7);opponent.y=own.y;takeBall(m,opponent);m.mustClear=false;t.stage='steal';t.elapsed=0;}}
}
function finish(w:BasketWorld,m:Match,side:Side,reason:Match['reason']){sportsEvent(m,'referee',w.clock,undefined,'game');m.phase='finished';m.winner=m.teams[side];m.reason=reason;m.ball.vx=m.ball.vy=0;for(const u of m.units)if(u.owner)w.players[u.owner].quiz=null;}
function cpuMove(w:BasketWorld,m:Match,u:Unit):{x:number;y:number}{
 const b=m.ball,holder=m.units.find(v=>v.id===b.holder),slot=Number(u.id.at(-1))%3;
 if(!holder){const teammates=m.units.filter(v=>v.side===u.side).sort((a,c)=>distance(a,b)-distance(c,b));if(teammates[0]===u){if(b.z>1&&b.vz<1&&distance(u,b)<ROLES[u.role].reach+.4&&u.cooldown<=0)jump(w,m,u,'rebound');return {x:b.x-u.x,y:b.y-u.y};}return {x:(slot-1)*3.5-u.x,y:3-u.y};}
 if(holder===u){
  if(m.mustClear)return {x:(u.x<0?-5.2:5.2)-u.x,y:-1.3-u.y};
  if(u.charging){if(u.charge>=.68)shoot(w,m,u,shotQuality(u.charge));return {x:0,y:0};}
  if(w.clock>=u.aiAt&&b.age>.65){u.aiAt=w.clock+.28+rng(w)*.35;const pressure=contest(m,u),mates=m.units.filter(v=>v.side===u.side&&v!==u).sort((a,c)=>shotChance(m,c)-shotChance(m,a));if(pressure>.48&&mates[0]&&shotChance(m,mates[0])>shotChance(m,u)+.12&&rng(w)<.8){passBall(w,m,u,mates[0].id);return {x:0,y:0};}
   const d=rimDistance(u),range=u.role==='SG'?7.1:u.role==='PG'?5.8:u.role==='SF'?4.8:3;
   if((d<range&&pressure<.65||m.shotClock<4)&&u.action<=0){u.charging=true;u.charge=0;u.motion='shot';return {x:0,y:0};}
   if(u.energy>=1&&u.skillCooldown<=0)skill(w,m,u);
  }
  const aim=u.role==='SG'?{x:u.x<0?-4.8:4.8,y:2.2}:u.role==='PG'?{x:u.x<0?-2:2,y:3.6}:{x:Math.sin(w.seed+slot)*1.3,y:5.6};return {x:aim.x-u.x,y:aim.y-u.y};
 }
 if(holder.side===u.side){
  const spot=u.role==='C'||u.role==='PF'?{x:holder.x>0?-2.3:2.3,y:4.4}:{x:slot%2?-5.3:5.3,y:slot===0?-.3:1.7};
  if(['C','PF'].includes(u.role)&&distance(u,holder)<3.2&&u.cooldown<=0&&m.units.some(v=>v.side!==u.side&&distance(v,u)<1.6))screen(w,m,u);
  return {x:spot.x-u.x,y:spot.y-u.y};
 }
 const opponents=m.units.filter(v=>v.side!==u.side),mark=opponents[slot]||holder,d=Math.max(.1,rimDistance(mark));
 if(w.clock>=u.aiAt){u.aiAt=w.clock+.24+rng(w)*.2;if(distance(u,holder)<1.15&&u.cooldown<=0&&rng(w)<.34)steal(w,m,u);if(holder.charging&&holder.charge>.42&&distance(u,holder)<ROLES[u.role].reach+.4&&u.cooldown<=0&&rng(w)<.4)jump(w,m,u,'block');}
 if(b.flight&&!b.pass&&distance(u,b)<3&&u.cooldown<=0)jump(w,m,u,'block');
 return {x:mark.x+(0-mark.x)/d*1.45-u.x,y:mark.y+(COURT.hoopY-mark.y)/d*1.45-u.y};
}
function drive(w:BasketWorld,m:Match,dt:number){
 for(const u of m.units){
  for(const key of ['catch','cooldown','dodge','dashCooldown','skillCooldown','hurt','action','jump','screen','buff'] as const)u[key]=Math.max(0,u[key]-dt);
  u.stamina=clamp(u.stamina+dt*(u.dodge>0?.025:.14),0,1);u.energy=clamp(u.energy+dt*.008,0,1);if(u.action===0&&!u.charging)u.motion='idle';
  if(u.charging){u.charge+=dt;if(u.charge>=CHARGE_MAX)shoot(w,m,u,shotQuality(CHARGE_MAX));}
  let x=0,y=0;
  if(m.tutorial&&(u.cpu||m.tutorial.stage==='complete'||m.tutorial.stage==='receive'||m.tutorial.stage==='pass'&&m.ball.flight)){u.vx=u.vy=0;continue;}
  if(u.cpu){const input=cpuMove(w,m,u),d=Math.max(1,Math.hypot(input.x,input.y));x=input.x/d;y=input.y/d;}
  else if(u.owner){const input=w.players[u.owner].input;if(w.clock-input.at<.35){x=input.x;y=input.y;}}
  const speed=ROLES[u.role].speed*(u.dodge>0?(u.role==='PG'&&u.buff>0?1.95:1.65):1)*(u.charging?.18:1)*(u.hurt>0?.3:1)*(u.screen>0?0:1);
  u.vx=x*speed;u.vy=y*speed;u.x=clamp(u.x+u.vx*dt,-COURT.width+.4,COURT.width-.4);u.y=clamp(u.y+u.vy*dt,COURT.front+.4,COURT.back-.5);
 }
 if(!m.tutorial)for(let i=0;i<m.units.length;i++)for(let j=i+1;j<m.units.length;j++){
  const a=m.units[i],b=m.units[j],d=distance(a,b);if(d>=.72||d<.001)continue;const dx=(a.x-b.x)/d,dy=(a.y-b.y)/d,amount=(.72-d)*.45;
  if(a.screen>0&&a.side!==b.side){b.hurt=Math.max(b.hurt,.16);b.x-=dx*amount*2;b.y-=dy*amount*2;}
  else if(b.screen>0&&a.side!==b.side){a.hurt=Math.max(a.hurt,.16);a.x+=dx*amount*2;a.y+=dy*amount*2;}
  else {a.x+=dx*amount;a.y+=dy*amount;b.x-=dx*amount;b.y-=dy*amount;}
 }
}
function segmentDistance(u:Unit,ax:number,ay:number,bx:number,by:number){const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy,t=den?clamp(((u.x-ax)*dx+(u.y-ay)*dy)/den,0,1):0;return Math.hypot(u.x-ax-dx*t,u.y-ay-dy*t);}
function loose(m:Match){Object.assign(m.ball,{holder:null,flight:0,pass:false,side:null,receiver:null,age:0,lock:.2,assist:null});}
function score(w:BasketWorld,m:Match){const b=m.ball,side=b.side!,shooter=m.units.find(u=>u.id===b.shooter);m.score[side]+=b.points;if(shooter){stat(w,shooter,'points',b.points);shooter.motion='celebrate';shooter.action=.7;}
 const assist=m.units.find(u=>u.id===b.assist);if(assist&&assist!==shooter)stat(w,assist,'assists');notice(w,m,b.points===3?'3 POINTS!':'BASKET!');sportsEvent(m,'referee',w.clock,shooter?.id,b.points===3?'three':'two');
 if(m.tutorial?.stage==='shoot'){m.tutorial.stage='complete';b.flight=0;b.holder=null;b.z=3.1;return;}
 m.possession=other(side);m.inbound=1.5;Object.assign(b,{holder:null,flight:0,z:3.1,vx:0,vy:0,vz:0,age:0});
}
function fly(w:BasketWorld,m:Match,dt:number){
 const b=m.ball;b.age+=dt;b.lock=Math.max(0,b.lock-dt*(b.flight?0:1));
 if(b.holder){const u=m.units.find(v=>v.id===b.holder)!;b.x=u.x;b.y=u.y;b.z=.45+Math.abs(Math.sin(b.age*12))*.9;if(m.mustClear&&rimDistance(u)>COURT.clear){m.mustClear=false;notice(w,m,'CLEARED');}if(!m.tutorial)m.shotClock-=dt;if(m.shotClock<=0){notice(w,m,'SHOT CLOCK');sportsEvent(m,'referee',w.clock,undefined,'shot-clock');checkBall(m,other(u.side));}return;}
 const oldX=b.x,oldY=b.y;b.trail.push([b.x,b.y,b.z]);if(b.trail.length>12)b.trail.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz-=9.8*dt;
 if(b.flight){
  if(b.pass&&!m.tutorial){m.shotClock-=dt;if(m.shotClock<=0){notice(w,m,'SHOT CLOCK');sportsEvent(m,'referee',w.clock,undefined,'shot-clock');checkBall(m,other(m.possession));return;}}
  for(const u of m.units){if(m.tutorial||u.side===b.side||b.age<.08)continue;const near=segmentDistance(u,oldX,oldY,b.x,b.y);
   if(!b.pass&&u.jump>0&&u.motion==='block'&&near<ROLES[u.role].reach*.65+(u.buff>0?.5:0)&&b.z<3.3){b.vx=(u.x<0?-1:1)*3;b.vy=-3;b.vz=2;loose(m);u.action=.4;stat(w,u,'blocks');notice(w,m,'BLOCK');return;}
   if(b.pass&&near<(u.catch>0?1.1:.45)&&b.z<2.5){takeBall(m,u);stat(w,u,'steals');notice(w,m,'INTERCEPT');return;}
  }
  if(b.age>=b.lock){
   if(b.pass){const receiver=m.units.find(u=>u.id===b.receiver)||m.units.filter(u=>u.side===b.side).sort((a,c)=>distance(a,b)-distance(c,b))[0];if(receiver&&(m.tutorial||distance(receiver,b)<2)){const remaining=m.shotClock,assist=b.assist;takeBall(m,receiver);m.shotClock=remaining;b.assist=assist;return;}b.vx*=.18;b.vy*=.18;b.vz=-1;loose(m);return;}
   if(b.success&&Math.abs(b.x)<1.05){score(w,m);return;}
   b.x=clamp(b.x,-1.8,1.8);b.y=COURT.hoopY-.3;const a=rng(w)*Math.PI*2;b.vx=Math.cos(a)*2.6;b.vy=Math.sin(a)*2.1;b.vz=2.8;b.z=3.1;loose(m);notice(w,m,'REBOUND');
  }
 }else{
  if(b.shooter===null&&!m.tutorial){m.shotClock-=dt;if(m.shotClock<=0){notice(w,m,'SHOT CLOCK');sportsEvent(m,'referee',w.clock,undefined,'shot-clock');checkBall(m,other(m.possession));return;}}
  if(b.z<.24){b.z=.24;b.vz=Math.abs(b.vz)*.38;if(Math.abs(b.vz)<.5)b.vz=0;b.vx*=Math.exp(-dt*3);b.vy*=Math.exp(-dt*3);}
  for(const u of [...m.units].sort((a,c)=>distance(a,b)-distance(c,b))){if(b.lock>0)break;const reach=ROLES[u.role].reach+(u.buff>0&&u.role==='PF'?1.4:0),near=distance(u,b);if(u.jump>0&&near<reach&&b.vz<1.5&&b.z<3.7||b.z<.65&&near<.7){const rebound=b.shooter!==null;takeBall(m,u,rebound);if(rebound){stat(w,u,'rebounds');notice(w,m,'REBOUND WIN');}return;}}
  if(Math.abs(b.x)>COURT.width+.2||b.y<COURT.front-.2||b.y>COURT.back+.2){notice(w,m,'OUT');checkBall(m,other(m.possession));return;}
  if(b.age>5){const nearest=[...m.units].sort((a,c)=>distance(a,b)-distance(c,b))[0];takeBall(m,nearest,true);}
 }
}
export function tick(w:BasketWorld,dt:number,factory?:LessonFactory){
 if(w.phase!=='playing'||w.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);w.clock+=dt;
 const round=w.matches.filter(m=>m.round===w.round);
 for(const m of round){
  if(m.phase==='finished')continue;
  const connected=m.teams.map(t=>{const humans=w.teams[t!].members.filter((id):id is string=>id!==null);return !humans.length||humans.some(id=>w.players[id].connected);});
  if(!w.practice&&(!connected[0]||!connected[1])){finish(w,m,connected[0]?0:1,'forfeit');continue;}
  if(m.phase==='study'){if(m.units.every(u=>!u.owner||!w.players[u.owner].connected||!w.players[u.owner].quiz))m.phase='play';continue;}
  if(m.tutorial?.stage==='complete')continue;
  if(m.tutorial){drive(w,m,dt);fly(w,m,dt);advanceTutorial(w,m,dt);continue;}
  m.time+=dt;
  if(m.inbound>0){m.inbound=Math.max(0,m.inbound-dt);if(m.inbound===0)checkBall(m,m.possession);}
  else {drive(w,m,dt);fly(w,m,dt);}
  if(m.time>=MATCH_SECONDS&&m.score[0]!==m.score[1]&&(!m.ball.flight||m.ball.pass)){finish(w,m,m.score[0]>m.score[1]?0:1,'time');continue;}
  const holder=m.units.find(u=>u.id===m.ball.holder);if(m.time<MATCH_SECONDS&&m.time-m.studyAt>=60&&(m.inbound>0||holder&&!holder.charging))study(w,m,factory);
 }
 if(round.every(m=>m.phase==='finished')){
  if(!w.nextRoundAt)w.nextRoundAt=w.clock+3;if(w.clock<w.nextRoundAt)return;const winners=round.map(m=>m.winner).filter((n):n is number=>n!==null);
  if(winners.length<=1){w.champion=winners[0]??null;w.phase='result';return;}
  w.round++;w.nextRoundAt=0;for(let i=0;i<winners.length;i+=2){const m=makeMatch(w,winners[i],winners[i+1]??null);w.matches.push(m);if(m.phase!=='finished')study(w,m,factory);}
 }
}
export function viewFor(w:BasketWorld,id:string,observe?:string|null):BasketView{
 const own=currentMatch(w,id),watched=w.matches.find(m=>m.id===observe&&m.round===w.round),m=own&&own.phase!=='finished'?own:watched||w.matches.find(m=>m.round===w.round&&m.phase!=='finished')||own||w.matches.at(-1)||null,p=w.players[id],q=p?.quiz;let quiz:BasketView['quiz']=null;
 if(q){const{correct,...question}=q.lesson.questions[q.index];quiz={id:q.id,index:q.index,question:structuredClone(question),selected:q.selected,answer:q.feedback};}
 const publicMatch=m?structuredClone(m):null;if(publicMatch)publicMatch.ball.success=false;
 return {version:2,clock:w.clock,phase:w.phase,practice:w.practice,paused:w.paused,title:w.title,players:Object.values(w.players).map(({id,name,slot,connected,spectator,avatar,correct,quiz,role,stats})=>({id,name,slot,connected,spectator,avatar,correct,studying:!!quiz,role:role||'SF',stats:structuredClone(stats||emptyStats())})),teams:structuredClone(w.teams),bracket:w.matches.map(({id,round,teams,phase,winner,reason,score})=>({id,round,teams:[...teams],phase,winner,reason,score:[...score]})),round:w.round,champion:w.champion,match:publicMatch,quiz};
}
