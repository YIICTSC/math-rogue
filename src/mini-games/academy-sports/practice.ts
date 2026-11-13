import {createSoccer,stepSoccer,type Soccer} from './soccer';
import {createVolleyball,stepVolleyball,resetRally,landing,type Volleyball} from './volleyball';
import {PRACTICE_MODES} from './modes';
import {vec,len,type Config,type Input,type PracticeState} from './core';
type TrainingMatch=Soccer|Volleyball;
export const isActionPractice=(c:Config)=>c.mode==='practice'&&!!c.drill&&PRACTICE_MODES[c.sport].some(m=>m.drill===c.drill);
/** Every attempt uses the actual sport's actions and collision/ball simulation. */
export function resetPracticeAttempt(s:TrainingMatch){
 const old=s.practice,keep={id:s.id,clock:s.clock,elapsed:s.elapsed,events:s.events,serial:s.serial,stats:s.stats};
 const next=s.sport==='soccer'?createSoccer(s.config):createVolleyball(s.config);Object.assign(s,next,keep);
 const id=s.config.drill!,team=s.config.team,sign=team===0?1:-1;
 const p:PracticeState={id,attempt:old?.attempt||1,successes:old?.successes||0,limit:5,time:0,result:null,resultTime:0,baseline:{...s.stats[team]},startSelected:team*100+9,jumped:false,dashed:false,dove:false,acted:false,target:vec(),special:false};s.practice=p;s.phase='ready';s.phaseTime=.9;
 for(const a of s.players){a.cooldown=0;a.stun=0;a.charge=0;a.spirit=100;a.action=0;a.p.y=0;a.v=vec();}
 if(s.sport==='soccer'){
  const dir=-sign,human=s.players.find(a=>a.id===team*100+9)!;s.selected=human.id;s.stage='open';s.restartTimer=0;s.halfTime=0;s.cinema=0;s.pendingShot=null;s.guard[1-team]=12;
  for(const a of s.players){a.p=vec(a.team===team?16:-18,0,dir*(a.team===team?-8:-15)+(a.slot-5)*1.3);a.home={...a.p};if(a.role==='GK'){a.p=vec(0,0,a.team===0?30:-30);a.home={...a.p};}}
  human.p=vec(0,0,dir*18);human.home={...human.p};human.face=dir<0?Math.PI:0;s.ball={...s.ball,...human.p,y:.23,owner:human.id,team,last:human.id,vx:0,vy:0,vz:0};s.lastTouch=team;s.lastPass=-1;s.shotTeam=-1;s.shotTimer=0;
  if(id==='soccer-shot'||id==='soccer-special'){const keeper=s.players.find(a=>a.team!==team&&a.role==='GK')!;keeper.role='DF';keeper.p=vec(-18,0,0);keeper.home={...keeper.p};}
  for(const slot of[1,2]){const defender=s.players.find(a=>a.id===(1-team)*100+slot)!;defender.p=vec(slot===1?-14:14,0,dir*29);defender.home={...defender.p};}
  const friend=s.players.find(a=>a.id===team*100+8)!;friend.p=vec(5,0,dir*24);friend.home={...friend.p};
  if(id==='soccer-tackle'||id==='soccer-dribble'){
   const opponent=s.players.find(a=>a.id===(1-team)*100+9)!;opponent.p=vec(0,0,dir*19.3);opponent.home={...opponent.p};opponent.face=dir<0?0:Math.PI;opponent.skills.control=.45;human.skills.defense=.95;
   if(id==='soccer-tackle'){s.ball.owner=opponent.id;s.ball.team=1-team;s.ball.last=opponent.id;s.ball.z=opponent.p.z;s.lastTouch=1-team;}
  }
  if(id==='soccer-switch'){s.ball.owner=-1;s.ball.x=8;s.ball.z=dir*10;}
  if(id==='soccer-move'){p.target=vec(5,0,dir*20);}
  p.startSelected=s.selected;
 }else{
  s.server=team;resetRally(s);const slot=id==='volley-set'?0:id==='volley-spike'||id==='volley-block'?2:4;
  if(!['volley-serve','volley-special'].includes(id)){
   s.selected=team*100+slot;const human=s.players.find(a=>a.id===s.selected)!;
   for(const a of s.players){a.p=vec(a.slot%2?4:-4,0,(a.team===0?1:-1)*8);a.home={...a.p};}
   human.p=vec(0,0,sign*(id==='volley-block'?.8:id==='volley-spike'?1.5:id==='volley-set'?2.8:6));human.home={...human.p};s.stage='rally';s.contacts=id==='volley-set'?1:id==='volley-spike'?2:0;s.contactTeam=s.contacts?team:1-team;s.lastContact=team*100+1;s.receiver=human.id;
   s.ball={...s.ball,x:human.p.x,y:id==='volley-dive'?1.5:3.4,z:human.p.z,vx:0,vy:-.5,vz:0,owner:-1,team:1-team,last:(1-team)*100+2};
   if(id==='volley-block'){s.ball.z=-sign*2;s.ball.vz=sign*5;s.ball.vy=-.2;s.ball.y=3.7;s.lastContact=(1-team)*100+2;}
   if(id==='volley-dive'){s.ball.x=2.2;s.ball.vy=-.5;}
   if(id==='volley-move'){p.target=vec(3,0,sign*4);s.ball.owner=human.id;s.ball.team=team;s.contactTeam=team;s.ball.y=1;s.ball.vy=0;}
  }
  p.startSelected=s.selected;
 }
 const controlled=s.players.find(a=>a.id===s.selected)!,prior=s.players.find(a=>a.team===team&&a.hero===s.config.hero);if(prior&&prior!==controlled)prior.hero=controlled.hero;controlled.hero=s.config.hero;
}
function result(s:TrainingMatch,success:boolean){const p=s.practice!;if(p.result)return;p.result=success?'success':'miss';p.resultTime=1.3;s.phase='play';if(success)p.successes++;s.score[s.config.team]=p.successes;s.score[1-s.config.team]=p.attempt-p.successes;}
export function stepPractice(s:TrainingMatch,input:Input,dt:number){
 const p=s.practice!;if(s.phase==='finished')return;
 if(p.result){p.resultTime-=dt;if(p.resultTime>0)return;if(p.attempt>=p.limit){s.phase='finished';s.winner=null;s.score=[...s.score];return;}p.attempt++;resetPracticeAttempt(s);return;}
 const team=s.config.team,player=s.players.find(a=>a.id===s.selected)!;
 if(s.phase==='ready'){s.phaseTime-=dt;if(s.phaseTime<=0)s.phase='play';return;}
 p.time+=dt;p.dashed ||= input.dash&&Math.hypot(input.x,input.z)>.3;p.jumped ||= player.p.y>.25;p.dove ||= player.motion==='catch';
 if(p.id==='soccer-move'||p.id==='volley-move'){
  // A quiet court for basic movement: use the sport movement path without a live rally.
  if(s.sport==='soccer')stepSoccer(s,input,dt);
  else {const ball={...s.ball};s.stage='rally';stepVolleyball(s,input,dt);Object.assign(s.ball,ball);s.phase='play';}
  if(len(player.p,p.target)<1.4&&(p.id==='soccer-move'?p.dashed:p.jumped))result(s,true);
 }else{
  if(s.sport==='soccer'){s.halfTime=0;if(p.id==='soccer-dribble'&&!p.acted)for(const opponent of s.players.filter(a=>a.team!==team))opponent.cooldown=Math.max(.2,opponent.cooldown);stepSoccer(s,input,dt);}else stepVolleyball(s,input,dt);
  const stats=s.stats[team],delta=(key:string)=>p.acted?(stats[key]||0)-(p.baseline[key]||0):0;
  if(p.id==='soccer-shot'||p.id==='soccer-special'){
   p.special ||= s.sport==='soccer'&&!!(s.ball.special||s.pendingShot?.special);
   if(delta('goals')>0&&(p.id==='soccer-shot'||p.special))result(s,true);
   else if(s.sport==='soccer'&&delta('shots')>0&&s.stage==='restart')result(s,false);
  }else if(p.id==='soccer-pass'||p.id==='soccer-lob'){if(delta('completedPasses')>0)result(s,true);}
  else if(p.id==='soccer-dribble'){if(s.sport==='soccer'&&delta('dribbles')>0&&s.duel?.grade!=='burst')result(s,true);}
  else if(p.id==='soccer-tackle'){if(delta('steals')>0&&s.ball.owner===s.selected)result(s,true);}
  else if(p.id==='soccer-switch'){if(p.acted&&s.selected!==p.startSelected)result(s,true);}
  else if(p.id==='volley-serve'||p.id==='volley-special'){
   p.special ||= delta('signatures')>0;if(p.id==='volley-special'&&p.special)result(s,true);
   if(s.sport==='volleyball'&&delta('serves')>0&&s.ball.z*(team===0?1:-1)<0){const end=landing(s);if(Math.abs(end.x)<4.5&&Math.abs(end.z)<9&&(p.id==='volley-serve'||p.special))result(s,true);}
  }else if(p.id==='volley-receive'){if(delta('receives')>0)result(s,true);}
  else if(p.id==='volley-dive'){if(delta('receives')>0&&p.dove)result(s,true);}
  else if(p.id==='volley-set'){if(delta('setsMade')>0)result(s,true);}
  else if(p.id==='volley-spike'){if(delta('spikes')>0&&p.jumped)result(s,true);}
  else if(p.id==='volley-block'){if(delta('blocks')>0)result(s,true);}
 }
 if(!p.result&&(p.time>12||(['replay','interval','finished'] as string[]).includes(s.phase)))result(s,false);
}
