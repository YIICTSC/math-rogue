import {specialHero,specialName} from './specials';
import {cpuLevel,cpuProfile,cpuRoll,cpuRunTo,cpuTarget} from './ai';
import {core,athlete,vec,len,clamp,unit,event,stat,pose,tickCore,capture,replay,finish,move,physics,kickBall,morale,jump,hash,segmentDistance,type Core,type Config,type Input,type Action,type Vec,type Athlete,controlInput} from './core';
export const SOCCER_FIELD={width:21,length:33,goal:4.2,height:2.8};
export const SOCCER_TECHNIQUES=['星帆ブレイク','蒼雷スパイラル','風渡りアーク','天灯ドライブ','月影スライス','双灯コネクト'];
export interface Soccer extends Core {chains?:number[];chainAt?:number[];duel?:{actor:number;at:number;grade:'perfect'|'good'|'burst'};sport:'soccer';half:number;halfTime:number;added:number;stage:'open'|'restart';restart:'kickoff'|'throw-in'|'corner'|'free-kick'|'penalty'|'goal-kick'|'offside';restartTeam:number;restartAt:Vec;restartTimer:number;lastPass:number;passTarget:number;offside:number[];guard:number[];lastTouch:number;shotTeam:number;shotTimer:number;cinema:number;pendingShot:{actor:number;charge:number;special:boolean}|null;goalFlash:number;decision:number;lastInput:Input;}
const direction=(team:number)=>team===0?-1:1;
function formation(c:Config,team:number,slot:number){const dir=direction(team);if(slot===0)return vec(0,0,-dir*30);const lines=c.formation==='4-4-2'?[4,4,2]:c.formation==='3-5-2'?[3,5,2]:[4,3,3];let start=1;for(let row=0;row<3;row++){const n=lines[row];if(slot<start+n){const col=slot-start;return vec((col-(n-1)/2)*(n===5?7:9),0,dir*[-17,-2,15][row]);}start+=n;}return vec();}
export function createSoccer(c:Config):Soccer{
 const s=Object.assign(core(c),{chains:[0,0],chainAt:[0,0],sport:'soccer' as const,half:1,halfTime:0,added:0,stage:'restart' as const,restart:'kickoff' as const,restartTeam:0,restartAt:vec(),restartTimer:0,lastPass:-1,passTarget:-1,offside:[] as number[],guard:[100,100],lastTouch:0,shotTeam:-1,shotTimer:0,cinema:0,pendingShot:null,goalFlash:0,decision:0,lastInput:{x:0,z:0,aimX:0,aimZ:0,dash:false,primary:false}});
 const lines=c.formation==='4-4-2'?[4,4,2]:c.formation==='3-5-2'?[3,5,2]:[4,3,3];
 for(let t=0;t<2;t++)for(let i=0;i<11;i++)s.players.push(athlete(t,i,i===0?'GK':i<=lines[0]?'DF':i<=lines[0]+lines[1]?'MF':'FW',formation(c,t,i),c));s.selected=c.team*100+9;placeRestart(s,'kickoff',0,vec());const captain=s.players.find(p=>p.id===c.team*100+9)!,selected=s.players.find(p=>p.id===s.selected)!;if(selected.team===c.team&&selected.id!==captain.id){const prior=selected.hero;selected.hero=c.hero;captain.hero=prior;}return s;
}
function holder(s:Soccer){return s.players.find(p=>p.id===s.ball.owner);}
function assign(s:Soccer,p:Athlete){if(s.ball.team!==p.team&&s.chains)s.chains[s.ball.team]=0;s.ball.owner=p.id;s.ball.team=p.team;s.lastTouch=p.team;s.ball.vx=s.ball.vy=s.ball.vz=0;if(!s.online&&p.team===s.config.team&&s.config.mode!=='watch')s.selected=p.id;}
export function placeRestart(s:Soccer,kind:Soccer['restart'],team:number,point:Vec){
 s.stage='restart';s.restart=kind;s.restartTeam=team;s.restartAt={...point};s.restartTimer=0;s.offside=[];s.shotTeam=-1;s.shotTimer=0;
 for(const p of s.players){delete p.cpuTarget;delete p.cpuAt;}
 if(kind==='kickoff')for(const p of s.players){p.p=formation(s.config,p.team,p.slot);p.home={...p.p};p.v=vec();}
 const taker=s.players.filter(p=>p.team===team&&p.role!=='GK').sort((a,b)=>len(a.p,point)-len(b.p,point))[0];taker.p={...point};assign(s,taker);s.ball.x=point.x;s.ball.z=point.z;s.ball.y=.22;
 for(const p of s.players)if(p.team!==team&&len(p.p,point)<4){const d=unit(p.p.x-point.x,p.p.z-point.z);p.p.x=point.x+d.x*4;p.p.z=point.z+d.z*4;}
 event(s,'whistle',{'kickoff':'キックオフ','throw-in':'スローイン',corner:'コーナーキック','free-kick':'フリーキック',penalty:'ペナルティーキック','goal-kick':'ゴールキック',offside:'オフサイド'}[kind],taker.id);
}
/** Solo possession follows the ball, including goalkeeper catches and restarts. */
export function syncSoloSoccerControl(s:Soccer){if(s.online||s.config.mode==='watch')return;const p=holder(s);if(p?.team===s.config.team)s.selected=p.id;}
function addChain(s:Soccer,team:number,n=1){s.chains??=[0,0];s.chainAt??=[0,0];s.chains[team]=Math.min(5,s.chains[team]+n);s.chainAt[team]=s.clock;}
function dribbleMove(s:Soccer,p:Athlete){
 if(s.ball.owner!==p.id||p.spirit<18||p.cooldown>0)return;
 const nearest=s.players.filter(q=>q.team!==p.team).sort((a,b)=>len(a.p,p.p)-len(b.p,p.p))[0],distance=len(nearest.p,p.p);
 const grade=distance<1.9?'perfect':distance<3.2?'good':'burst',d=unit(s.lastInput.x||Math.sin(p.face),s.lastInput.z||Math.cos(p.face));
 const length=grade==='perfect'?2.3:1.6;p.p.x=clamp(p.p.x+d.x*length,-20,20);p.p.z=clamp(p.p.z+d.z*length,-32,32);p.face=Math.atan2(d.x,d.z);p.spirit-=18;p.cooldown=.8;pose(p,'run',.4);
 // Shift the held ball in the same simulation step; a tackle cannot use its previous position.
 s.ball.x=p.p.x+d.x*.55;s.ball.z=p.p.z+d.z*.55;
 if(grade!=='burst'){nearest.stun=grade==='perfect'?.45:.22;pose(nearest,'hurt',.3);addChain(s,p.team,grade==='perfect'?2:1);morale(s,p.team,grade==='perfect'?12:6);}
 s.duel={actor:p.id,at:s.clock,grade};stat(s,p.team,'dribbles');event(s,'hit',grade==='perfect'?'PERFECT・切り返し成功！':grade==='good'?'GOOD・切り返し成功！':'切り返しドリブル！',p.id);
}
function markOffside(s:Soccer,p:Athlete){const dir=direction(p.team),defenders=s.players.filter(q=>q.team!==p.team).map(q=>q.p.z*dir).sort((a,b)=>b-a),line=Math.max(defenders[1]||0,s.ball.z*dir);s.offside=s.config.rules==='standard'?s.players.filter(q=>q.team===p.team&&q.id!==p.id&&q.p.z*dir>Math.max(0,line)+.2).map(q=>q.id):[];}
function pass(s:Soccer,lob=false,requester?:Athlete){const p=holder(s);if(!p||p.stun)return;const dir=direction(p.team),input=controlInput(s,p,s.lastInput),aim=input&&Math.hypot(input.x,input.z)>.1?unit(input.x,input.z):{x:0,z:dir};
 const targets=s.players.filter(q=>q.team===p.team&&q.id!==p.id&&q.role!=='GK').sort((a,b)=>{const score=(q:Athlete)=>{const d=unit(q.p.x-p.p.x,q.p.z-p.p.z);return(d.x*aim.x+d.z*aim.z)*12+(q.p.z-p.p.z)*dir*.12-len(q.p,p.p)*.12;};return score(b)-score(a);});
 const target=requester??targets[0];if(!target)return;markOffside(s,p);s.lastPass=p.id;s.passTarget=target.id;const destination={...target.p};if(lob){destination.z+=dir*4;destination.x+=target.v.x*.3;}const flight=clamp(len(s.ball,destination)/22,1.15,1.8);kickBall(s,p,destination,lob?len(s.ball,destination)/flight:19,lob?(.75-s.ball.y+.5*9.81*flight*flight)/flight:1,0);pose(p,'kick',.45);p.cooldown=.25;stat(s,p.team,'passes');s.stage='open';event(s,'hit',requester?'パスを要求！':lob?'スペースへのロングパス':'パス！',p.id);
}
function shoot(s:Soccer,p:Athlete,charge:number,special=false){
 const dir=direction(p.team),boost=s.awaken[p.team]>0?1.15:1,skill=special&&p.spirit>=35;
 const shotInput=controlInput(s,p,s.lastInput),profile=cpuProfile(s,p),salt=(s.stats[p.team].shots||0)*31+Math.floor(s.clock),human=!!shotInput;
 const aim=human?clamp(shotInput.aimX||shotInput.x,-1,1):(cpuRoll(s,p,salt)*2-1)*.9,target=vec(aim*3.65,0,dir*34),distance=len(p.p,target),accuracy=p.skills.control*(s.config.assist?1:.8);
 if(!human)target.x+=(cpuRoll(s,p,salt+1)*2-1)*profile.shotError*Math.max(.6,distance/15);
 target.x+=Math.sin(p.face)*distance*(1-accuracy)*.04;
 const signature=specialHero(p.hero);const speed=(18+clamp(charge,0,2)*9+p.skills.power*7)*(skill?signature.speed*1.12:1)*boost*(1+(s.chains?.[p.team]||0)*.035)*(human?1:profile.shotPower);const technique=p.slot%SOCCER_TECHNIQUES.length;
 kickBall(s,p,target,speed,skill?(technique===3?8:technique===2?6:2.8)+signature.lift:1.4+Math.min(3,charge*2),skill?(technique%2?1:-1)*(technique===4?3:1.2)+signature.curve:aim*.2);
 s.ball.special=skill;s.ball.power=speed;s.ball.y=Math.max(.3,p.p.y+.3);p.spirit=Math.max(0,p.spirit-(skill?35:8));pose(p,'kick',.65);p.cooldown=.45;s.shotTeam=p.team;s.shotTimer=4;s.lastPass=-1;s.offside=[];stat(s,p.team,'shots');morale(s,p.team,8);event(s,skill?'special':'hit',skill?specialName(p.hero,'soccer'):charge>.8?'パワーシュート！':'シュート！',p.id,skill?'shot':undefined);
}
export function soccerAction(s:Soccer,action:Action){
 syncSoloSoccerControl(s);if(action==='next'){s.phaseTime=0;return;}if(s.phase!=='play'||s.cinema>0)return;
 const p=s.players.find(p=>p.id===s.selected)!;if(!p)return;const own=s.ball.owner===p.id;
 if(action==='switch'){if(!s.online&&holder(s)?.team===s.config.team)return;const list=s.players.filter(q=>q.team===s.config.team&&q.role!=='GK').sort((a,b)=>len(a.p,s.ball)-len(b.p,s.ball));s.selected=list[(list.findIndex(q=>q.id===p.id)+1)%Math.min(3,list.length)].id;return;}
 if(action==='primary'){
  if(s.stage==='restart'&&s.restartTeam===p.team){if(s.restart==='penalty'||s.restart==='free-kick'){s.stage='open';shoot(s,holder(s)!,1.1);}else pass(s);return;}
  if(own)p.charge=.02;else if(s.ball.y>1.3&&len(p.p,s.ball)<2.3){jump(p,6);s.ball.x=p.p.x;s.ball.z=p.p.z;shoot(s,p,.6);event(s,'hit','ヘディング！',p.id);}else soccerAction(s,'defend');
 }
 if(action==='release'&&p.charge>0){if(own){const special=p.charge>=1.1&&p.spirit>=35;if(special){s.pendingShot={actor:p.id,charge:p.charge,special:true};s.cinema=.7;pose(p,'kick',1.3);event(s,'special',specialName(p.hero,'soccer'),p.id,'shot');}else shoot(s,p,p.charge);}p.charge=0;}
 if(action==='pass'||action==='lob'){const teammate=holder(s);if(own)pass(s,action==='lob');else if(teammate?.team===p.team&&teammate.cooldown<=0)pass(s,action==='lob',p);}
 if((action==='alternate'||action==='defend')&&own){dribbleMove(s,p);return;}
 if(action==='special'){
  if(own&&p.spirit>=35){s.pendingShot={actor:p.id,charge:1.5,special:true};s.cinema=.7;pose(p,'kick',1.3);event(s,'special',specialName(p.hero,'soccer'),p.id,'shot');}
  else if(!own&&p.spirit>=25){const keeper=s.players.find(q=>q.team===p.team&&q.role==='GK')!;p.spirit-=25;pose(keeper,'catch',.9);keeper.v.y=5;keeper.p.x=clamp(s.ball.x+s.ball.vx*.2,-4,4);s.guard[p.team]=Math.min(100,s.guard[p.team]+18);event(s,'special','星盾セーブ！',keeper.id);}
 }
 if(action==='defend'&&!own&&!p.cooldown){const h=holder(s);p.cooldown=.8;pose(p,'tackle',.45);p.spirit=Math.max(0,p.spirit-12);if(h&&h.team!==p.team&&len(p.p,h.p)<1.9){const toward=unit(h.p.x-p.p.x,h.p.z-p.p.z),facing={x:Math.sin(h.face),z:Math.cos(h.face)},behind=toward.x*facing.x+toward.z*facing.z;
   if(s.config.rules==='standard'&&behind>.5&&p.spirit<55){stat(s,p.team,'fouls');const box=Math.abs(h.p.x)<10&&h.p.z*direction(h.team)>23;placeRestart(s,box?'penalty':'free-kick',h.team,box?vec(0,0,direction(h.team)*24):{...h.p});return;}
   if(p.skills.defense+p.spirit/100+(.7-behind)>.9+h.skills.control){h.stun=.35;assign(s,p);addChain(s,p.team);stat(s,p.team,'steals');morale(s,p.team,12);event(s,'catch','ボール奪取！',p.id);}}
 }
}
function keeperStep(s:Soccer,p:Athlete,dt:number,input:Input){
 const controlled=!!controlInput(s,p,input);
 const ownGoal=-direction(p.team)*31;const b=s.ball;const towardGoal=b.owner<0&&b.vz*Math.sign(ownGoal)>0;
 const eta=Math.abs(b.vz)>.1?(ownGoal-b.z)/b.vz:99,profile=cpuProfile(s,p),error=(cpuRoll(s,p,(s.stats[1-p.team].shots||0)+17)*2-1)*profile.shotError*.4;
 const targetX=towardGoal&&eta>0?clamp(b.x+b.vx*eta+error,-4.2,4.2):clamp(b.x*.18,-3,3);
 if(!controlled)cpuRunTo(s,p,cpuTarget(s,p,vec(targetX,0,ownGoal+(towardGoal?0:direction(p.team)))),dt,towardGoal&&cpuLevel(s,p)>=2);s.guard[p.team]=Math.min(100,s.guard[p.team]+dt*1.5);
 if(towardGoal&&eta<.5&&eta>0){if(b.y>1.7&&p.p.y===0)jump(p,6);pose(p,'catch',.3);}
 if(b.owner<0&&len(p.p,b)<1.5+(p.action?.3:0)&&b.y<2+p.p.y&&b.team!==p.team){
  const guard=s.guard[p.team];s.guard[p.team]=Math.max(0,guard-b.power*.5);stat(s,p.team,'saves');morale(s,p.team,18);
  if(b.power>guard*.75+18){b.vz=-b.vz*.4;b.vx+=(p.p.x-b.x)*3;b.vy=4;b.special=false;s.lastTouch=p.team;event(s,'catch','パンチング！',p.id);p.cooldown=.8;}
  else {assign(s,p);s.shotTeam=-1;pose(p,'catch',.65);event(s,'catch','ゴールキーパー・セーブ！',p.id);p.cooldown=.7;}
 }
 if(b.owner===p.id&&p.cooldown<=0&&!controlled)pass(s,true);
}
export function stepSoccer(s:Soccer,input:Input,dt:number){
 syncSoloSoccerControl(s);for(let team=0;team<2;team++)if(s.chains&&s.chainAt&&s.clock-s.chainAt[team]>10)s.chains[team]=0;
 if(s.cinema>0){s.clock+=dt;s.cinema-=dt;if(s.cinema<=0&&s.pendingShot){const c=s.pendingShot;s.pendingShot=null;shoot(s,s.players.find(p=>p.id===c.actor)!,c.charge,c.special);}return;}
 if(!tickCore(s,dt))return;capture(s,dt);s.lastInput={...input};s.goalFlash=Math.max(0,s.goalFlash-dt);s.shotTimer=Math.max(0,s.shotTimer-dt);
 s.halfTime+=dt;if(s.halfTime>=s.config.minutes*30+s.added){if(s.half===1){s.half=2;s.halfTime=0;s.added=0;s.phase='interval';s.phaseTime=3;placeRestart(s,'kickoff',1,vec());event(s,'whistle','ハーフタイム');return;}finish(s);return;}
 if(['practice'].includes(s.config.mode)&&!s.practice&&s.elapsed>90){finish(s);return;}
 if(s.stage==='restart'){
  s.restartTimer+=dt;if(s.restartTimer>1.2&&(s.online?!s.controls?.[s.ball.owner]:(s.restartTeam!==s.config.team||s.config.mode==='watch'))){s.stage='open';if(s.restart==='penalty')shoot(s,holder(s)!,1.1);else pass(s,s.restart==='corner'||s.restart==='goal-kick');}
  if(s.restartTimer>12){s.stage='open';pass(s);}return;
 }
 let h=holder(s);for(const human of s.players){const control=controlInput(s,human,input);if(control){move(human,control.x,control.z,dt,control.dash);human.p.x=clamp(human.p.x,-20.5,20.5);human.p.z=clamp(human.p.z,-32.5,32.5);if(control.primary&&h?.id===human.id)human.charge=Math.min(2,human.charge+dt*(s.awaken[human.team]>0?1.5:1)*(1+(s.chains?.[human.team]||0)*.07));}}
 s.decision+=dt;
 const chasers=[0,1].map(team=>s.players.filter(p=>p.team===team&&p.role!=='GK').sort((a,b)=>len(a.p,s.ball)-len(b.p,s.ball)).slice(0,2).map(p=>p.id));
 for(const p of s.players){
  if(p.role==='GK'){keeperStep(s,p,dt,input);continue;}if(controlInput(s,p,input))continue;
  let target={...p.home};const dir=direction(p.team),owns=h?.team===p.team;
  const level=cpuLevel(s,p),profile=cpuProfile(s,p),think=s.decision>=profile.reaction;
  if(h?.id===p.id){target=vec(p.p.x*.9,0,dir*31);cpuRunTo(s,p,cpuTarget(s,p,target),dt,p.spirit>55&&level>=2);
   const goal=vec(0,0,dir*33),distance=len(p.p,goal),blocked=s.players.some(q=>q.team!==p.team&&q.role!=='GK'&&len(q.p,p.p)<2.5);
   if(p.cooldown<=0&&think){
    if(distance<[13,15,18,20][level]&&(Math.abs(p.p.x)<10||distance<8)){shoot(s,p,.25+level*.2,p.spirit>55&&level>=2&&cpuRoll(s,p,Math.floor(s.clock))<[0,0,.18,.35][level]);p.cooldown=1.5-level*.2;}
    else if(blocked||p.spirit<20||hash(Math.floor(s.clock)+p.id)%17<2){const saved=s.lastInput;s.lastInput={...input,x:0,z:dir};pass(s,blocked);s.lastInput=saved;p.cooldown=.8;}
   }
  }else{
   if(!owns&&chasers[p.team].includes(p.id))target=vec(s.ball.x,0,s.ball.z+dir*.5);
   else {target.x=clamp(target.x+s.ball.x*.18,-19,19);target.z=clamp(target.z+s.ball.z*.25+(owns?dir*4:-dir*4),-29,29);if(s.passTarget===p.id&&s.ball.owner<0)target=vec(s.ball.x+s.ball.vx*.28,0,s.ball.z+s.ball.vz*.28);}
   cpuRunTo(s,p,cpuTarget(s,p,target),dt,!owns&&chasers[p.team][0]===p.id&&level>=2);
   if(h&&h.team!==p.team&&len(p.p,h.p)<1.2&&p.cooldown<=0&&p.spirit>10&&think){p.cooldown=1.6-level*.25;const approach=unit(h.p.x-p.p.x,h.p.z-p.p.z);if(cpuRoll(s,p,Math.floor(s.clock*2))<[.3,.48,.68,.82][level]&&approach.x*Math.sin(h.face)+approach.z*Math.cos(h.face)<.7&&p.skills.defense+p.spirit/180>h.skills.control+.2){assign(s,p);stat(s,p.team,'steals');pose(p,'tackle',.4);event(s,'catch','インターセプト！',p.id);h=p;}}
  }
 }
 if(s.decision>=Math.max(cpuProfile(s,s.players[0]).reaction,cpuProfile(s,s.players[11]).reaction))s.decision=0;
 // Soft body separation preserves shape instead of making twenty players pile onto the ball.
 for(let i=0;i<s.players.length;i++)for(let j=i+1;j<s.players.length;j++){const a=s.players[i],b=s.players[j],d=len(a.p,b.p);if(d<.75&&d>.001){const nx=(a.p.x-b.p.x)/d,nz=(a.p.z-b.p.z)/d,push=(.75-d)*.2;a.p.x+=nx*push;a.p.z+=nz*push;b.p.x-=nx*push;b.p.z-=nz*push;}}
 h=holder(s);const b=s.ball,previous={x:b.x,y:b.y,z:b.z};
 if(h){const speed=Math.hypot(h.v.x,h.v.z),stride=.55+Math.sin(s.clock*speed*2)*.12;b.x=h.p.x+Math.sin(h.face)*stride;b.z=h.p.z+Math.cos(h.face)*stride;b.y=.23+Math.abs(Math.sin(s.clock*speed))*Math.min(.13,speed*.02);b.team=h.team;s.lastTouch=h.team;}
 else {
  physics(b,dt,9.81,.15);if(b.y<.22){b.y=.22;b.vy=Math.abs(b.vy)*.46;if(Math.abs(b.vy)<.3)b.vy=0;b.vx*=.985;b.vz*=.985;}
  for(const p of s.players){if(p.role==='GK'||p.cooldown>.4)continue;if((len(p.p,b)<.85||segmentDistance(previous,b,p.p)<.85)&&b.y<1.4&&s.ball.last!==p.id){
    if(s.offside.includes(p.id)){placeRestart(s,'offside',1-p.team,{...p.p});return;}
    const teammate=s.lastPass>=0&&s.players.find(q=>q.id===s.lastPass)?.team===p.team;assign(s,p);p.cooldown=.28;if(teammate){addChain(s,p.team);stat(s,p.team,'completedPasses');morale(s,p.team,7);}else{stat(s,p.team,'steals');morale(s,p.team,6);}s.lastPass=-1;s.passTarget=-1;s.offside=[];event(s,'catch',teammate?'パスがつながった！':'ボールを確保！',p.id);break;}}
 }
 const F=SOCCER_FIELD;
 // A score requires crossing the goal plane between the posts and below the crossbar.
 if(b.owner<0&&Math.abs(b.z)>=F.length&&Math.abs(previous.z)<F.length){
  const end=Math.sign(b.z),alpha=(end*F.length-previous.z)/(b.z-previous.z),crossX=previous.x+(b.x-previous.x)*alpha,crossY=previous.y+(b.y-previous.y)*alpha;
  if(Math.abs(crossX)<F.goal&&crossY<F.height&&crossY>=0){const team=end<0?0:1;s.score[team]++;stat(s,team,'goals');s.goalFlash=2;s.added=Math.min(10,s.added+2);morale(s,team,30);replay(s,'ゴール！',2.6);placeRestart(s,'kickoff',1-team,vec());return;}
  if(Math.abs(Math.abs(crossX)-F.goal)<.25&&crossY<F.height+.25||Math.abs(crossY-F.height)<.2&&Math.abs(crossX)<F.goal+.25){b.vz*=-.6;b.z=end*(F.length-.2);event(s,'bounce','ポストに当たった！');}
  else {const defender=end<0?0:1,attacker=1-defender,corner=s.lastTouch===attacker;placeRestart(s,corner?'corner':'goal-kick',corner?defender:attacker,corner?vec(Math.sign(b.x||1)*20,0,end*32):vec(0,0,end*27));return;}
 }
 if(Math.abs(b.x)>F.width){placeRestart(s,'throw-in',1-s.lastTouch,vec(Math.sign(b.x)*20.6,0,clamp(b.z,-31,31)));return;}
 if(Math.abs(b.z)>F.length+3){placeRestart(s,'goal-kick',b.z<0?1:0,vec(0,0,b.z<0?-27:27));}
 syncSoloSoccerControl(s);
}
