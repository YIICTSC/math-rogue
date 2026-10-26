import {validAvatar} from '../gakuro-kart/avatar';
import {validLesson} from '../gakuro-kart/learning';
import {bracketSeeds,scorePoint} from './scoring';
import type {Ball,LessonFactory,Match,Mode,Player,Shot,Side,Team,TennisView,TennisWorld,Unit} from './types';
export type * from './types';
export const MAX_PLAYERS=32,MAX_MEMBERS=40,HALF_LENGTH=11.885,SINGLES_WIDTH=4.115,DOUBLES_WIDTH=5.485,SERVICE_LENGTH=6.4,NET=.94;
export const SHOTS:Shot[]=['topspin','slice','lob','drop','special'];
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const sideY=(side:Side)=>side===0?-1:1;
const other=(side:Side)=>(1-side) as Side;
function random(w:TennisWorld){w.random=(Math.imul(w.random,1664525)+1013904223)>>>0;return w.random/4294967296;}
export function createTennis(seed=1,practice=false):TennisWorld{return {version:1,seed,random:seed>>>0,clock:0,phase:'lobby',mode:'singles',targetGames:1,practice,paused:false,title:'',players:{},teams:[],matches:[],round:0,nextRoundAt:0,champion:null,quizSerial:0};}
export function addPlayer(w:TennisWorld,id:string,name:string,spectator=false){
 if(w.phase==='result'||typeof id!=='string'||!id||id.length>100||w.players[id]||Object.keys(w.players).length>=MAX_MEMBERS||typeof name!=='string'||!name.trim())return false;
 const playing=Object.values(w.players).filter(p=>!p.spectator).length;
 const used=new Set(Object.values(w.players).map(p=>p.slot));let slot=0;while(used.has(slot))slot++;
 w.players[id]={id,name:name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,16)||'Player',slot,connected:true,spectator:spectator||w.phase!=='lobby'||playing>=MAX_PLAYERS,correct:0,history:[],quiz:null,input:{x:0,y:0,at:0}};return true;
}
export function configure(w:TennisWorld,mode:unknown,target:unknown){if(w.phase!=='lobby'||!['singles','doubles'].includes(String(mode))||![1,3,6].includes(Number(target)))return false;w.mode=mode as Mode;w.targetGames=Number(target) as 1|3|6;return true;}
export function setSpectator(w:TennisWorld,id:string,enabled:unknown){const p=w.players[id];if(w.phase!=='lobby'||!p||typeof enabled!=='boolean'||!enabled&&Object.values(w.players).filter(p=>p.connected&&!p.spectator).length>=MAX_PLAYERS)return false;p.spectator=enabled;return true;}
function teamsFor(w:TennisWorld):Team[]{
 const ids=Object.values(w.players).filter(p=>p.connected&&!p.spectator).sort((a,b)=>a.slot-b.slot).map(p=>p.id),members:(string|null)[][]=[];
 if(w.mode==='singles'){ids.forEach(id=>members.push([id]));if(w.practice&&ids.length===1)members.push([null]);}
 else if(ids.length<=2){ids.forEach(id=>members.push([id,null]));if(w.practice&&ids.length===1)members.push([null,null]);}
 else for(let i=0;i<ids.length;i+=2)members.push([ids[i],ids[i+1]||null]);
 return members.map((members,id)=>({id,members,name:members.map((p,i)=>p?w.players[p].name:`CPU ${id+1}-${i+1}`).join(' / ')}));
}
function emptyBall(side:Side):Ball{return {x:0,y:sideY(side)*11,z:1.2,vx:0,vy:0,vz:0,spin:0,lastSide:side,bounces:0,serve:true,netLet:false,trail:[]};}
function makeMatch(w:TennisWorld,a:number,b:number|null):Match{
 const id=`r${w.round}-m${w.matches.length}`,units:Unit[]=[];
 for(const [side,team]of [[0,a],[1,b]] as const)if(team!==null)w.teams[team].members.forEach((owner,index)=>{
  const p=owner?w.players[owner]:undefined;units.push({id:`${id}-${side}-${index}`,owner,name:p?.name||`CPU ${side+1}-${index+1}`,side:side as Side,x:w.mode==='doubles'?(index===0?-2.7:2.7):0,y:sideY(side as Side)*(index===0?10.8:6.9),vx:0,vy:0,energy:.25,stamina:1,swing:0,shot:'topspin',shotSeq:0,buffer:0,aim:0,power:.6,dash:0,cpu:!p||!p.connected,avatar:p?.avatar});
 });
 return {id,round:w.round,teams:[a,b],units,games:[0,0],points:[0,0],tiebreak:false,phase:b===null?'finished':'study',winner:b===null?a:null,reason:b===null?'bye':'',server:0,serverUnit:0,receiver:'',faults:0,ball:emptyBall(0),time:0,wait:0,rally:0,longest:0,pointSerial:0,shotSerial:0,studyAt:w.clock,pendingWinner:null,afterStudy:'serve'};
}
function prepareServe(m:Match,w:TennisWorld){
 m.phase='serve';m.time=0;m.wait=0;m.rally=0;m.reason='';
 const sum=m.points[0]+m.points[1],serveSide=m.tiebreak?((sum===0?0:Math.floor((sum+1)/2)%2) as Side):((m.games[0]+m.games[1])%2 as Side);
 m.server=serveSide;
 const servers=m.units.filter(u=>u.side===serveSide),gameIndex=Math.floor((m.games[0]+m.games[1])/2);
 const rotation=m.tiebreak?Math.floor((sum+(serveSide===0?1:-1))/4):0;
 const server=servers[w.mode==='doubles'?(gameIndex+rotation)%servers.length:0];m.serverUnit=m.units.indexOf(server);
 const courtHalf=sum%2===0?1:-1;
 server.x=courtHalf*sideY(serveSide)*-1.8;server.y=sideY(serveSide)*(HALF_LENGTH+.5);
 for(const u of m.units){u.buffer=0;u.vx=u.vy=0;if(u!==server){const index=m.units.filter(v=>v.side===u.side).indexOf(u);u.x=w.mode==='doubles'?(u.side===serveSide?-Math.sign(server.x)*2.7:index===0?-2.7:2.7):courtHalf*sideY(serveSide)*2.3;u.y=sideY(u.side)*(u.side===serveSide?5.8:10.4);}}
 const receivers=m.units.filter(u=>u.side!==serveSide).sort((a,b)=>Math.abs(a.x+server.x)-Math.abs(b.x+server.x));m.receiver=receivers[0].id;if(w.mode==='doubles'&&receivers[1])receivers[1].y=sideY(receivers[1].side)*6.8;
 m.ball=emptyBall(serveSide);m.ball.x=server.x;m.ball.y=server.y;
}
function beginStudy(w:TennisWorld,m:Match,factory:LessonFactory|undefined,after:'serve'|'finish',winner:number|null=null){
 const players=m.units.flatMap(u=>u.owner&&w.players[u.owner]?.connected?[w.players[u.owner]]:[]);
 // Build all lessons first: an invalid factory must never leave only half a court gated.
 const lessons=players.map(p=>{const lesson=factory?.(p.history);if(!validLesson(lesson)||lesson.questions.length!==3)throw new Error('Invalid tennis lesson');return structuredClone(lesson);});
 m.phase='study';m.afterStudy=after;m.pendingWinner=winner;m.studyAt=w.clock;m.ball.vx=m.ball.vy=m.ball.vz=0;
 for(let i=0;i<players.length;i++){const p=players[i];p.quiz={id:++w.quizSerial,index:0,lesson:lessons[i],selected:null,feedback:null};p.input={x:0,y:0,at:w.clock};}
 if(!players.length)resumeAfterStudy(w,m);
}
function resumeAfterStudy(w:TennisWorld,m:Match){if(m.afterStudy==='finish'){m.phase='finished';m.winner=m.pendingWinner;}else{m.faults=0;prepareServe(m,w);}}
export function startTennis(w:TennisWorld,factory:LessonFactory){
 if(w.phase!=='lobby')return false;
 const teams=teamsFor(w);if(teams.length<2)return false;
 // Validate a sample before changing tournament state.
 if(!validLesson(factory([])))return false;
 w.teams=teams;w.phase='playing';w.round=0;w.matches=[];w.champion=null;w.nextRoundAt=0;
 const seeds=bracketSeeds(teams.length);
 try{for(let i=0;i<seeds.length;i+=2){const a=seeds[i],b=seeds[i+1];if(a===null&&b===null)continue;const m=makeMatch(w,a??b!,a===null?null:b);w.matches.push(m);if(m.phase!=='finished')beginStudy(w,m,factory,'serve');}}
 catch{w.phase='lobby';w.matches=[];w.teams=[];for(const p of Object.values(w.players))p.quiz=null;return false;}
 return true;
}
export function rematch(w:TennisWorld){if(w.phase!=='result')return false;w.phase='lobby';w.matches=[];w.teams=[];w.champion=null;w.round=0;w.nextRoundAt=0;for(const[id,p]of Object.entries(w.players)){if(!p.connected)delete w.players[id];else{p.quiz=null;p.correct=0;p.history=[];p.input={x:0,y:0,at:w.clock};}}return true;}
export function currentMatch(w:TennisWorld,id:string){return w.matches.find(m=>m.round===w.round&&m.units.some(u=>u.owner===id));}
export function disconnectPlayer(w:TennisWorld,id:string){const p=w.players[id];if(!p)return;if(w.phase==='lobby'){delete w.players[id];return;}p.connected=false;p.quiz=null;p.input={x:0,y:0,at:w.clock};for(const m of w.matches)for(const u of m.units)if(u.owner===id)u.cpu=true;}
function finishPoint(w:TennisWorld,m:Match,winner:Side,reason:Match['reason'],factory:LessonFactory|undefined){
 if(m.phase!=='rally'&&m.phase!=='serve')return;
 m.reason=reason;m.longest=Math.max(m.longest,m.rally);m.pointSerial++;m.faults=0;m.ball.vx=m.ball.vy=m.ball.vz=0;
 const result=scorePoint(m,winner,w.targetGames);m.pendingWinner=result.match?m.teams[winner]:null;m.afterStudy=result.match?'finish':'serve';m.phase='point';m.wait=2.1;
 // Defer question creation until point feedback has been visible.
 m.studyAt=result.game||w.clock-m.studyAt>=180?-1:m.studyAt;
}
function fault(w:TennisWorld,m:Match,reason:Match['reason'],factory:LessonFactory|undefined){m.faults++;if(m.faults>=2)finishPoint(w,m,other(m.server),'double-fault',factory);else{const faults=m.faults;prepareServe(m,w);m.faults=faults;m.reason=reason;m.wait=.9;}}
function ballFlight(m:Match,u:Unit,shot:Shot,aim:number,power:number,w:TennisWorld){
 const serve=m.phase==='serve',direction=-sideY(u.side),width=w.mode==='singles'?SINGLES_WIDTH:DOUBLES_WIDTH;
 let targetX=aim*(width-.35),targetY=direction*(shot==='drop'?2.3:shot==='lob'?10.4:10.1),duration=shot==='lob'?1.75:shot==='drop'?.9:shot==='special'?.66:shot==='slice'?1.25:1.0;
 if(serve){targetX=-Math.sign(u.x)*(1.7+Math.abs(aim)*1.6);targetY=direction*5.7;duration=1.02;}
 duration*=1.12-power*.22;
 const z=serve?2.7:Math.max(.65,m.ball.z),startX=serve?u.x:m.ball.x,startY=serve?u.y:m.ball.y;
 const crossing=Math.abs(startY)/(Math.abs(startY)+Math.abs(targetY));if(crossing>0&&crossing<1){const minimum=2*(NET+.26-z*(1-crossing)-.08*crossing)/(9.8*crossing*(1-crossing));if(minimum>0)duration=Math.max(duration,Math.sqrt(minimum));}
 const spin=serve?0:shot==='slice'?aim*1.4:shot==='special'?aim*2.5:0;
 // Fixed landing target and ballistic height: collision decisions belong to simulation, not rendering.
 const gravity=9.8,dx=targetX-startX,dy=targetY-startY;
 m.ball={x:startX,y:startY,z,vx:dx/duration-spin*duration*.5,vy:dy/duration,vz:(.08-z+.5*gravity*duration*duration)/duration,spin,lastSide:u.side,bounces:0,serve,netLet:false,trail:[]};
 m.phase='rally';m.time=0;m.rally++;m.shotSerial++;u.shot=shot;u.shotSeq=m.shotSerial;u.swing=.42;u.buffer=0;u.energy=shot==='special'?0:Math.min(1,u.energy+.10);u.stamina=Math.max(0,u.stamina-.04);
}
function attemptHit(w:TennisWorld,m:Match,u:Unit){
 if(u.buffer<=0||u.swing>.14)return false;
 if(m.phase==='serve'){if(m.units[m.serverUnit]!==u||m.wait>0)return false;ballFlight(m,u,'topspin',u.aim,u.power,w);return true;}
 if(m.phase!=='rally'||m.ball.lastSide===u.side||m.ball.z<.22||m.ball.z>3.7||Math.hypot(m.ball.x-u.x,m.ball.y-u.y)>1.65)return false;
 if(m.ball.serve&&(m.ball.bounces===0||m.receiver!==u.id))return false;
 if(Math.sign(m.ball.y)!==sideY(u.side))return false;
 let shot=u.shot;if(shot==='special'&&u.energy<.99)shot='topspin';ballFlight(m,u,shot,u.aim,u.power,w);return true;
}
export function command(w:TennisWorld,id:string,raw:unknown,factory?:LessonFactory){
 const p=w.players[id],c=raw as Record<string,any>;if(!p||!p.connected||!c||typeof c!=='object'||Array.isArray(c))return false;
 if(c.type==='avatar'){if(w.phase!=='lobby'||!validAvatar(c.avatar))return false;p.avatar=structuredClone(c.avatar);return true;}
 if(p.spectator||w.phase!=='playing')return false;
 const m=currentMatch(w,id),u=m?.units.find(u=>u.owner===id);if(!m||!u||m.phase==='finished')return false;
 if(c.type==='answer'||c.type==='continue'){
  const q=p.quiz;if(m.phase!=='study'||!q||c.id!==q.id||c.index!==q.index)return false;
  if(c.type==='answer'){if(q.selected!==null||!Number.isInteger(c.option)||c.option<0||c.option>3)return false;q.selected=c.option;q.feedback=q.lesson.questions[q.index].correct;if(q.selected===q.feedback){p.correct++;u.energy=Math.min(1,u.energy+.2);}return true;}
  if(q.selected===null)return false;
  p.history=[...p.history,q.lesson.questions[q.index].id].slice(-120);
  if(++q.index===3){p.quiz=null;if(m.units.every(unit=>!unit.owner||!w.players[unit.owner].connected||!w.players[unit.owner].quiz))resumeAfterStudy(w,m);}else{q.selected=null;q.feedback=null;}return true;
 }
 if(m.phase==='study'||m.phase==='point'||w.paused)return false;
 if(c.type==='move'){if(![c.x,c.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1))return false;const length=Math.max(1,Math.hypot(c.x,c.y));p.input={x:c.x/length,y:c.y/length,at:w.clock};return true;}
 if(c.type==='dash'){if(u.stamina<.55||u.dash>0)return false;u.stamina-=.55;u.dash=.28;return true;}
 if(c.type==='swing'){if(!SHOTS.includes(c.shot)||![c.aim,c.power].every(n=>typeof n==='number'&&Number.isFinite(n))||Math.abs(c.aim)>1||c.power<0||c.power>1||u.swing>.1)return false;u.shot=c.shot;u.aim=c.aim;u.power=c.power;u.buffer=.32;attemptHit(w,m,u);return true;}
 return false;
}
function driveUnits(w:TennisWorld,m:Match,dt:number){
 const width=w.mode==='singles'?SINGLES_WIDTH:DOUBLES_WIDTH;
 for(const u of m.units){u.swing=Math.max(0,u.swing-dt);u.buffer=Math.max(0,u.buffer-dt);u.dash=Math.max(0,u.dash-dt);u.stamina=Math.min(1,u.stamina+dt*.16);
  let x=0,y=0;
  if(u.cpu){
   if(m.phase==='serve'){if(m.units[m.serverUnit]===u&&m.time>.9&&m.wait<=0){u.shot='topspin';u.aim=random(w)*1.4-.7;u.power=.55;u.buffer=.3;}}
   else if(m.phase==='rally'){
    const b=m.ball;
    // CPUs have a reaction delay and occasional late reads; they use the same reach checks.
    const reaction=.16+((m.shotSerial*7+u.side*3+w.seed)%17===0?.55:0);
    if(b.lastSide!==u.side&&m.time<reaction){u.buffer=0;}
    else if(b.lastSide!==u.side){
     const root=(b.vz+Math.sqrt(Math.max(0,b.vz*b.vz+19.6*Math.max(0,b.z-.8))))/9.8;
     const horizon=clamp(root,.05,1.3),targetX=clamp(b.x+b.vx*horizon+b.spin*horizon*horizon*.5,-width-.45,width+.45),targetY=clamp(b.y+b.vy*horizon,sideY(u.side)>0?.8:-13.2,sideY(u.side)>0?13.2:-.8);
     const teammates=m.units.filter(v=>v.side===u.side),nearest=teammates.sort((a,b)=>Math.hypot(a.x-targetX,a.y-targetY)-Math.hypot(b.x-targetX,b.y-targetY))[0];
     if(b.serve?m.receiver===u.id:nearest===u){x=targetX-u.x;y=targetY-u.y;u.buffer=.25;u.shot=b.z>2.3?'topspin':u.energy>=1?'special':m.rally%7===4?'drop':m.rally%5===3?'lob':m.rally%3===1?'slice':'topspin';u.aim=Math.sin(m.shotSerial*2.2+u.side)*.86;u.power=.48+(m.rally%3)*.1;}
     else{x=(u.id.endsWith('-1')?2.7:-2.7)-u.x;y=sideY(u.side)*6-u.y;}
    }else{x=(w.mode==='doubles'?(u.id.endsWith('-1')?2.6:-2.6):0)-u.x;y=sideY(u.side)*(w.mode==='doubles'&&u.id.endsWith('-1')?6.5:10)-u.y;}
   }
   const length=Math.hypot(x,y);if(length>.06){x/=Math.max(1,length);y/=Math.max(1,length);}else{x=y=0;}
  }else if(u.owner){const input=w.players[u.owner]?.input;if(input&&w.clock-input.at<.4){x=input.x;y=input.y;}}
  if(m.phase==='serve'&&m.units[m.serverUnit]===u){x=y=0;}
  const speed=(u.cpu?5.8:7.3)*(u.dash>0?1.85:1)*(u.stamina<.1?.85:1);u.vx=x*speed;u.vy=y*speed;
  u.x=clamp(u.x+u.vx*dt,-width-1.4,width+1.4);u.y=clamp(u.y+u.vy*dt,u.side===0?-14.0:.65,u.side===0?-.65:14.0);
  attemptHit(w,m,u);
 }
}
function updateBall(w:TennisWorld,m:Match,dt:number,factory:LessonFactory|undefined){
 const b=m.ball,previousY=b.y,previousZ=b.z;b.trail.push([b.x,b.y,b.z]);if(b.trail.length>12)b.trail.shift();b.x+=b.vx*dt+.5*b.spin*dt*dt;b.vx+=b.spin*dt;b.y+=b.vy*dt;b.z+=b.vz*dt-4.9*dt*dt;b.vz-=9.8*dt;
 if(previousY*b.y<0){const t=Math.abs(previousY)/(Math.abs(previousY)+Math.abs(b.y)),z=previousZ+(b.z-previousZ)*t;if(z<NET+.08){if(b.serve){b.netLet=true;b.vx*=.45;b.vy*=.45;b.vz=Math.max(.9,b.vz*.35);}else{finishPoint(w,m,other(b.lastSide),'net',factory);return;}}}
 if(b.z<=.08){b.z=.08;
  if(b.bounces===0){
   const width=w.mode==='singles'?SINGLES_WIDTH:DOUBLES_WIDTH,inside=Math.abs(b.x)<=width+.045&&Math.abs(b.y)<=HALF_LENGTH+.045&&Math.sign(b.y)===-sideY(b.lastSide);
   const server=m.units[m.serverUnit],serviceLegal=inside&&Math.abs(b.x)<=SINGLES_WIDTH+.045&&Math.abs(b.y)<=SERVICE_LENGTH+.045&&Math.sign(b.x)===-Math.sign(server.x);
   if(b.serve&&!serviceLegal){fault(w,m,b.netLet?'net':'out',factory);return;}
   if(!inside){finishPoint(w,m,other(b.lastSide),'out',factory);return;}
   if(b.serve&&b.netLet){const faults=m.faults;prepareServe(m,w);m.faults=faults;m.reason='let';m.wait=.9;return;}
   b.bounces=1;b.vz=Math.max(2.8,Math.abs(b.vz)*(m.units.filter(u=>u.side===b.lastSide).sort((a,b)=>b.shotSeq-a.shotSeq)[0]?.shot==='slice'?.52:.7));b.vx*=.84;b.vy*=.82;
  }else finishPoint(w,m,b.lastSide,m.rally===1?'ace':'bounce',factory);
 }
 if(Math.abs(b.x)>22||Math.abs(b.y)>28||m.time>18)finishPoint(w,m,other(b.lastSide),'out',factory);
}
function teamConnected(w:TennisWorld,m:Match,side:Side){const members=w.teams[m.teams[side]!].members,humans=members.filter((id):id is string=>id!==null);return !humans.length||humans.some(id=>w.players[id]?.connected);}
export function tick(w:TennisWorld,dt:number,factory?:LessonFactory){
 if(w.phase!=='playing'||w.paused||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);w.clock+=dt;
 const round=w.matches.filter(m=>m.round===w.round);
 for(const m of round){if(m.phase==='finished')continue;
  const connected=[teamConnected(w,m,0),teamConnected(w,m,1)];
  if(!w.practice&&(!connected[0]||!connected[1])){m.phase='finished';m.winner=connected[0]?m.teams[0]:connected[1]?m.teams[1]:null;m.reason='forfeit';for(const u of m.units)if(u.owner)w.players[u.owner].quiz=null;continue;}
  if(m.phase==='study'){if(m.units.every(u=>!u.owner||!w.players[u.owner].connected||!w.players[u.owner].quiz))resumeAfterStudy(w,m);continue;}
  m.time+=dt;m.wait=Math.max(0,m.wait-dt);
  if(m.phase==='point'){if(m.wait===0){if(m.studyAt===-1)beginStudy(w,m,factory,m.afterStudy,m.pendingWinner);else prepareServe(m,w);}continue;}
  driveUnits(w,m,dt);
  if(m.phase==='rally')updateBall(w,m,dt,factory);
  else if(m.phase==='serve'){const server=m.units[m.serverUnit];m.ball.x=server.x;m.ball.y=server.y;m.ball.z=1.3+Math.sin(w.clock*3)*.1;if(m.time>20&&!server.cpu)fault(w,m,'out',factory);}
 }
 if(round.every(m=>m.phase==='finished')){
  if(!w.nextRoundAt)w.nextRoundAt=w.clock+3;
  if(w.clock<w.nextRoundAt)return;
  const winners=round.map(m=>m.winner).filter((id):id is number=>id!==null);
  if(winners.length<=1){w.champion=winners[0]??null;w.phase='result';return;}
  w.round++;w.nextRoundAt=0;
  for(let i=0;i<winners.length;i+=2){const m=makeMatch(w,winners[i],winners[i+1]??null);w.matches.push(m);if(m.phase!=='finished')beginStudy(w,m,factory,'serve');}
 }
}
export function viewFor(w:TennisWorld,id:string,observe?:string|null):TennisView{
 const own=w.players[id],active=currentMatch(w,id),watched=w.matches.find(m=>m.id===observe&&m.round===w.round),m=active&&active.phase!=='finished'?active:watched||w.matches.find(m=>m.round===w.round&&m.phase!=='finished')||active||w.matches.at(-1)||null;
 const q=own?.quiz;let quiz:TennisView['quiz']=null;if(q){const{correct,...question}=q.lesson.questions[q.index];quiz={id:q.id,index:q.index,question:structuredClone(question),selected:q.selected,answer:q.feedback};}
 return {version:1,clock:w.clock,phase:w.phase,mode:w.mode,targetGames:w.targetGames,practice:w.practice,paused:w.paused,title:w.title,players:Object.values(w.players).sort((a,b)=>a.slot-b.slot).map(({id,name,slot,connected,spectator,avatar,correct,quiz})=>({id,name,slot,connected,spectator,avatar,correct,studying:!!quiz})),teams:structuredClone(w.teams),bracket:w.matches.map(({id,round,teams,games,points,tiebreak,phase,winner,reason})=>({id,round,teams:[...teams],games:[...games],points:[...points],tiebreak,phase,winner,reason})),round:w.round,champion:w.champion,match:m?structuredClone(m):null,quiz};
}
