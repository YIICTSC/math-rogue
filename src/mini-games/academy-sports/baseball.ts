import {core,athlete,vec,len,clamp,unit,hash,event,stat,pose,tickCore,capture,replay,finish,move,runTo,physics,aiInterval,neutral,type Core,type Config,type Input,type Action,type Vec} from './core';
export const BASES=[vec(0,0,18),vec(13,0,5),vec(0,0,-8),vec(-13,0,5),vec(0,0,18)];
export const PITCHES=['ストレート','ツーシーム','スライダー','カーブ','フォーク','チェンジアップ','シュート','シンカー','星弧ドロップ'] as const;
const DEF=[vec(0,0,0),vec(0,0,20),vec(14,0,4),vec(7,0,-9),vec(-14,0,4),vec(-7,0,-9),vec(-25,0,-29),vec(0,0,-38),vec(25,0,-29)];
export interface Runner {unit:number;from:number;target:number;at:number;progress:number;forced:boolean;tag:boolean;done:boolean;retouch?:number;advanceAfterTag?:boolean;}
export interface Baseball extends Core {sport:'baseball';inning:number;half:0|1;outs:number;strikes:number;balls:number;bases:(number|null)[];batting:number[];bat:number;pitcher:number;stage:'set'|'meter'|'windup'|'pitch'|'live'|'throw'|'settle';timer:number;pitch:number;aim:{x:number;y:number};pitchAim:{x:number;y:number};pitchCount:number;accuracy:number;swingAt:number;batMode:'contact'|'power'|'bunt';hitMode:'ground'|'line'|'fly';bounced:boolean;fielder:number;runners:Runner[];throwBase:number;throwTarget:number;throwTime:number;playRuns:number;outsAtHit:number;flightTime:number;stealing:boolean;practicePlays:number;lineScore:number[][];plateAt:number;plateBall:Vec;}
export function createBaseball(c:Config):Baseball{
 const s:Baseball=Object.assign(core(c),{sport:'baseball' as const,inning:1,half:0 as 0|1,outs:0,strikes:0,balls:0,bases:[null,null,null] as (number|null)[],batting:[0,0],bat:0,pitcher:100,stage:'set' as const,timer:0,pitch:0,aim:{x:0,y:1.2},pitchAim:{x:0,y:1.2},pitchCount:0,accuracy:1,swingAt:-99,batMode:'contact' as const,hitMode:'line' as const,bounced:false,fielder:100,runners:[] as Runner[],throwBase:1,throwTarget:102,throwTime:0,playRuns:0,outsAtHit:0,flightTime:0,stealing:false,practicePlays:0,lineScore:[[],[]] as number[][],plateAt:-1,plateBall:vec()});
 for(let t=0;t<2;t++)for(let i=0;i<9;i++)s.players.push(athlete(t,i,['P','C','1B','2B','3B','SS','LF','CF','RF'][i],DEF[i],c));
 if(c.mode==='pitching'||c.mode==='fielding')s.half=(1-c.team) as 0|1;
 if(c.mode==='batting'||c.mode==='home-run'||c.mode==='practice')s.half=c.team as 0|1;
 if(c.mode==='home-run'){s.batMode='power';s.hitMode='fly';}
 setupAtBat(s);return s;
}
const batter=(s:Baseball)=>s.players.find(p=>p.id===s.bat)!;
const pitcher=(s:Baseball)=>s.players.find(p=>p.id===s.pitcher)!;
const battingHuman=(s:Baseball)=>s.half===s.config.team&&s.config.mode!=='watch';
function setupAtBat(s:Baseball){
 const attack=s.half,defend=1-attack;s.bat=attack*100+s.batting[attack]%9;s.pitcher=defend*100;s.fielder=s.pitcher;s.stage='set';s.timer=0;s.swingAt=-99;s.plateAt=-1;s.bounced=false;s.flightTime=0;s.runners=[];s.stealing=false;
 for(const p of s.players){p.v=vec();p.p={...(p.team===defend?DEF[p.slot]:vec(22+p.slot*.75,0,19+(p.slot%2)*1.4))};p.face=p.team===defend?0:Math.PI;}
 batter(s).p=vec(-.9,0,18);for(let i=0;i<3;i++){const p=s.players.find(p=>p.id===s.bases[i]);if(p)p.p={...BASES[i+1]};}
 s.ball={...s.ball,x:0,y:1.4,z:0,vx:0,vy:0,vz:0,owner:s.pitcher,team:defend,special:false};s.selected=battingHuman(s)?s.bat:s.pitcher;
}
function nextBatter(s:Baseball){s.practicePlays++;s.strikes=0;s.balls=0;s.batting[s.half]=(s.batting[s.half]+1)%9;
 if(['practice','batting','pitching','fielding','home-run'].includes(s.config.mode)&&s.practicePlays>=10){finish(s);return;}
 if(['practice','batting','pitching','fielding','home-run'].includes(s.config.mode)&&s.outs>=3){s.outs=0;s.bases=[null,null,null];}
 if(s.outs>=3){const finishedHalf=s.half;s.outs=0;s.bases=[null,null,null];s.lineScore[finishedHalf][s.inning-1]=s.score[finishedHalf]-s.lineScore[finishedHalf].slice(0,s.inning-1).reduce((a,b)=>a+b,0);
  if(finishedHalf===0){if(s.inning>=s.config.innings&&s.score[1]>s.score[0]){finish(s);return;}s.half=1;}
  else {if(s.inning>=s.config.innings&&(s.score[0]!==s.score[1]||s.inning>=s.config.innings+3)){finish(s);return;}s.inning++;s.half=0;}
 }
 setupAtBat(s);
}
function addRun(s:Baseball){s.score[s.half]++;stat(s,s.half,'runs');if(s.half===1&&s.inning>=s.config.innings&&s.score[1]>s.score[0]&&s.outs<3){event(s,'cheer','サヨナラ！');finish(s);}}
export function walk(s:Baseball){
 if(s.bases[0]!==null){if(s.bases[1]!==null){if(s.bases[2]!==null)addRun(s);s.bases[2]=s.bases[1];}s.bases[1]=s.bases[0];}s.bases[0]=s.bat;stat(s,s.half,'walks');event(s,'whistle','フォアボール');nextBatter(s);
}
export function pitchVerdict(s:Baseball,kind:'strike'|'ball'|'foul'){
 if(kind==='ball'){s.balls++;if(s.balls>=4){walk(s);return;}event(s,'whistle','ボール');}
 else {if(kind==='strike'||s.strikes<2||s.batMode==='bunt')s.strikes++;if(s.strikes>=3){s.outs++;stat(s,1-s.half,'strikeouts');event(s,'whistle','三振！');nextBatter(s);return;}event(s,'whistle',kind==='foul'?'ファウル':'ストライク');}
 setupAtBat(s);s.timer=-.65;
}
function pitchStart(s:Baseball,accuracy:number){s.accuracy=accuracy;s.stage='windup';s.timer=0;s.pitchCount++;s.swingAt=-99;pose(pitcher(s),'pitch',1);pitcher(s).spirit=Math.max(0,pitcher(s).spirit-1.1);stat(s,1-s.half,'pitches');}
function releasePitch(s:Baseball){
 const p=pitcher(s),kind=s.pitch,slow=kind===3||kind===5;
 // Workload survives the between-pitch spirit recovery, so long outings lose pace/control.
 const fatigue=clamp((s.stats[p.team].pitches||0)/(65+p.skills.stamina*55)+(1-p.spirit/100)*.5,0,1);
 const speed=((slow?14:20)+p.skills.pitch*10)*(1-fatigue*.12),travel=18/speed,error=(1-s.accuracy)*.8+fatigue*.4;
 const sign=((hash(s.pitchCount+s.config.seed)%200)/100-1);const targetX=s.pitchAim.x+sign*error,targetY=s.pitchAim.y+Math.sin(s.pitchCount*1.7)*error;
 s.ball={...s.ball,x:0,y:1.9,z:0,vx:targetX/travel,vy:(targetY-1.9+.5*9.81*travel*travel)/travel,vz:speed,owner:-1,team:p.team,power:speed,spin:kind===2?-1.1:kind===6?1.1:kind===1?.4:kind===8?-.9:0,last:p.id};
 s.stage='pitch';s.timer=0;s.plateAt=-1;event(s,'hit',PITCHES[kind],p.id);
}
function predictLanding(s:Baseball){const b={...s.ball};let t=0;while(t<7&&b.y>0){physics(b,.05,9.81,.055);t+=.05;}return vec(b.x,0,b.z);}
export function hitBall(s:Baseball,timing:number,contactX:number,contactY:number){
 const p=batter(s),size=s.batMode==='contact'?.64:s.batMode==='power'?.36:.52;
 const miss=Math.hypot(s.ball.x-contactX,s.ball.y-contactY);const window=s.config.assist?.21:.15;
 if(Math.abs(timing)>window||miss>size+.12)return false;
 const quality=clamp(1-Math.abs(timing)/window*.55-miss/(size+.12)*.45,0,1);const bunt=s.batMode==='bunt';
 const speed=bunt?5+quality*4:13+quality*(s.batMode==='power'?35:27)*(.7+p.skills.power*.5);
 const launch=(bunt?7:s.hitMode==='ground'?6:s.hitMode==='fly'?47:25)*Math.PI/180;
 const direction=clamp(timing/window*1.02+(contactX-s.ball.x)*.35,-1.35,1.35);
 s.ball.vx=Math.sin(direction)*Math.cos(launch)*speed;s.ball.vz=-Math.cos(direction)*Math.cos(launch)*speed;s.ball.vy=Math.sin(launch)*speed;s.ball.y=1.2;s.ball.spin=(contactX-s.ball.x)*2;s.ball.power=speed;s.ball.owner=-1;s.ball.team=s.half;s.ball.last=p.id;
 s.stage='live';s.timer=0;s.bounced=false;s.playRuns=s.score[s.half];s.outsAtHit=s.outs;s.flightTime=0;pose(p,'swing',.6);stat(s,s.half,'contacts');
 let forced=true;s.runners=[];
 for(let b=1;b<=3;b++){const id=s.bases[b-1];if(id!==null){s.runners.push({unit:id,from:b,target:forced?b+1:b,at:b,progress:0,forced,tag:false,done:false});}else forced=false;}
 s.runners.push({unit:s.bat,from:0,target:1,at:0,progress:0,forced:true,tag:false,done:false});
 s.fielder=nearestFielder(s,predictLanding(s)).id;s.selected=battingHuman(s)?s.bat:s.fielder;event(s,'hit',quality>.85?'真芯でとらえた！':bunt?'バント！':'打球が伸びる！',p.id);return true;
}
function nearestFielder(s:Baseball,target:Vec){return s.players.filter(p=>p.team!==s.half).sort((a,b)=>len(a.p,target)-len(b.p,target))[0];}
function rebuildBases(s:Baseball){s.bases=[null,null,null];for(const r of s.runners)if(!r.done&&r.at>0&&r.at<4)s.bases[r.at-1]=r.unit;}
function settle(s:Baseball,text:string){
 if(s.phase==='finished')return;
 const hitter=s.runners.find(r=>r.unit===s.bat);if(s.bounced&&hitter&&hitter.at>=1&&(!hitter.done||hitter.at===4))stat(s,s.half,'hits');
 if(s.outs-s.outsAtHit>=2){stat(s,1-s.half,'doublePlays');text='ダブルプレー！';}
 rebuildBases(s);s.stage='settle';s.timer=0;replay(s,text,1.7);
}
function putOut(s:Baseball,r:Runner,force=false){if(r.done||s.outs>=3)return;r.done=true;s.outs++;stat(s,1-s.half,'putouts');event(s,'catch',force?'フォースアウト！':r.retouch!==undefined?'タッチアップ前の帰塁アウト！':'タッチアウト！',r.unit);
 if(r.from===0)for(const other of s.runners)other.forced=false;
 if(s.outs>=3){if(force){const invalid=s.score[s.half]-s.playRuns;s.score[s.half]=s.playRuns;stat(s,s.half,'runs',-invalid);}settle(s,'スリーアウト・チェンジ');}}
export function throwToBase(s:Baseball,base:number){
 if(!['live','throw'].includes(s.stage)||s.ball.owner<0)return;const holder=s.players.find(p=>p.id===s.ball.owner)!;const destination=BASES[base];
 const receiver=s.players.filter(p=>p.team!==s.half&&p.id!==holder.id).sort((a,b)=>len(a.p,destination)-len(b.p,destination))[0];
 s.throwBase=base;s.throwTarget=receiver.id;s.throwTime=0;const d=len(holder.p,destination),time=Math.max(.2,d/(17+holder.skills.power*12));
 s.ball.owner=-1;s.ball.x=holder.p.x;s.ball.z=holder.p.z;s.ball.y=1.4;s.ball.vx=(destination.x-holder.p.x)/time;s.ball.vz=(destination.z-holder.p.z)/time;s.ball.vy=(1.2-1.4+.5*9.81*time*time)/time;s.ball.spin=0;s.stage='throw';pose(holder,'throw',.45);event(s,'hit',`${base===4?'本塁':base+'塁'}へ送球`,holder.id);
}
function chooseThrow(s:Baseball){const alive=s.runners.filter(r=>!r.done&&r.target>r.at);const threatening=alive.sort((a,b)=>b.target-a.target).find(r=>r.forced||r.target===4);return threatening?.target??(alive[0]?.target||1);}
export function baseballAction(s:Baseball,action:Action,input:Input=neutral()){
 if(action==='next'){s.phaseTime=0;return;}if(s.phase!=='play')return;
 const attack=battingHuman(s),live=['live','throw'].includes(s.stage);
 if(attack&&live){if(action==='primary')action='advance';else if(action==='defend'||action==='alternate')action='retreat';}
 if(attack&&!live&&action==='special'&&s.bases[0]!==null&&s.bases[1]===null)action='steal';
 if(action==='alternate'){if(!attack){s.pitch=(s.pitch+1)%PITCHES.length;event(s,'whistle',PITCHES[s.pitch]);}else s.batMode=s.batMode==='contact'?'power':s.batMode==='power'?'bunt':'contact';return;}
 if(action==='special'){s.hitMode=s.hitMode==='line'?'fly':s.hitMode==='fly'?'ground':'line';return;}
 if(action==='switch'&&!attack&&live){const list=s.players.filter(p=>p.team!==s.half).sort((a,b)=>len(a.p,s.ball)-len(b.p,s.ball));s.fielder=list[(list.findIndex(p=>p.id===s.fielder)+1)%Math.min(3,list.length)].id;s.selected=s.fielder;}
 if(action==='primary'){
  if(battingHuman(s)&&s.stage==='pitch'){s.swingAt=s.clock;pose(batter(s),'swing',.4);}
  else if(!battingHuman(s)&&s.stage==='set'){s.stage='meter';s.timer=0;}
  else if(!battingHuman(s)&&s.stage==='meter')pitchStart(s,1-Math.abs(.5+.5*Math.sin(s.timer*7)-.78));
  else if(!battingHuman(s)&&s.stage==='live'&&s.ball.owner>=0){const directed=Math.hypot(input.x,input.z)>.3;const base=Math.abs(input.x)>Math.abs(input.z)?input.x>0?1:3:input.z<0?2:4;throwToBase(s,directed?base:chooseThrow(s));}
 }
 if(action.startsWith('throw'))throwToBase(s,Number(action.slice(5)));
 if(action==='defend'&&['live','throw'].includes(s.stage)){const f=s.players.find(p=>p.id===s.fielder)!;if(!f.cooldown){pose(f,'catch',.8);f.cooldown=1.2;f.v.y=4;}}
 if(action==='advance'||action==='retreat')for(const r of s.runners)if(!r.done){
  if(r.retouch!==undefined){r.advanceAfterTag=action==='advance';continue;}
  r.target=action==='advance'?Math.min(4,r.at+1):Math.max(r.from,r.at);r.tag=action==='retreat';
 }
 if(action==='steal'&&['set','windup','pitch'].includes(s.stage)&&!s.stealing&&s.bases[0]!==null&&s.bases[1]===null){s.stealing=true;const id=s.bases[0]!;s.runners=[{unit:id,from:1,target:2,at:1,progress:0,forced:false,tag:false,done:false}];event(s,'special','盗塁スタート！',id);}
}
function runnersStep(s:Baseball,dt:number){for(const r of s.runners){if(r.done)continue;const p=s.players.find(p=>p.id===r.unit)!;
 const destination=BASES[r.target],before=len(p.p,destination);if(r.target!==r.at||r.tag){runTo(p,destination,dt,true);if(len(p.p,destination)<.5){r.at=r.target;r.tag=false;
  if(r.retouch!==undefined&&r.at===r.retouch){delete r.retouch;if(r.advanceAfterTag){r.target=Math.min(4,r.at+1);r.advanceAfterTag=false;}}
  if(r.at===4){addRun(s);r.done=true;if(!s.bounced&&r.from>0){stat(s,s.half,'sacrificeFlies');event(s,'score','犠牲フライで生還！',r.unit);}}
  else if(s.config.mode==='watch'||s.half!==s.config.team){const ballDistance=len(s.ball,BASES[Math.min(4,r.at+1)]);if(s.ball.owner<0&&s.bounced&&ballDistance>22&&s.timer>1.5)r.target=Math.min(4,r.at+1);}}}r.progress=before;
 }}
export function stepBaseball(s:Baseball,input:Input,dt:number){
 if(!tickCore(s,dt))return;capture(s,dt);s.timer+=dt;
 if(s.stage==='settle'){nextBatter(s);return;}
 const humanBat=s.online?!!s.controls?.[s.bat]:battingHuman(s),b=s.ball,p=pitcher(s);const batInput=s.online?s.controls?.[s.bat]||neutral():input,pitchInput=s.online?s.controls?.[s.pitcher]||neutral():input,humanPitch=s.online?!!s.controls?.[s.pitcher]:!humanBat&&s.config.mode!=='watch'&&s.config.mode!=='fielding';
 if(s.stage==='set'){
  if(s.stealing)runnersStep(s,dt);
  if(humanPitch){s.pitchAim.x=clamp(s.pitchAim.x+pitchInput.x*dt*1.5,-1.35,1.35);s.pitchAim.y=clamp(s.pitchAim.y-pitchInput.z*dt*1.5,.3,2.8);}
  if(!humanPitch){if(s.timer>.8){s.pitch=hash(s.pitchCount+s.config.seed)%PITCHES.length;const n=hash(s.pitchCount*97+s.config.seed);s.pitchAim={x:(n%200/100-1)*.7,y:.6+(n%140)/100};pitchStart(s,.6+s.config.difficulty*.1);}}
  return;
 }
 if(s.stage==='meter')return;
 if(s.stage==='windup'){if(s.stealing)runnersStep(s,dt);if(s.timer>.65)releasePitch(s);return;}
 if(s.stage==='pitch'){
  const oldZ=b.z;if(!s.online||s.plateAt<0){physics(b,dt,9.81,0);if(s.pitch===3)b.vy-=dt*2;if(s.pitch===4&&b.z>10)b.vy-=dt*10;if(s.pitch===7){b.vy-=dt*4;b.vx+=dt*.8;}if(s.pitch===8&&b.z>9){b.vx+=dt*3;b.vy-=dt*6;}}
  if(humanBat){s.aim.x=clamp(s.aim.x+batInput.x*dt*2.5,-1.25,1.25);s.aim.y=clamp(s.aim.y-batInput.z*dt*2.5,.25,2.9);if(s.config.assist&&Math.abs(batInput.x)+Math.abs(batInput.z)<.1){s.aim.x+=(b.x-s.aim.x)*dt*4;s.aim.y+=(b.y-s.aim.y)*dt*4;}}
  else {const level=s.config.difficulty;s.hitMode=(['ground','line','fly'] as const)[hash(s.pitchCount*31+s.config.seed)%3];const reactionError=(hash(s.pitchCount*11+s.config.seed)%100/100-.5)*(.7-level*.12);s.aim={x:b.x+Math.sin(s.pitchCount*3.2)*(.22-level*.05),y:b.y+Math.cos(s.pitchCount)*(.22-level*.04)};if(b.z>18-b.vz*(.05+level*.015+reactionError)&&s.swingAt<0){s.swingAt=s.clock;pose(batter(s),'swing',.4);}}
  if(s.stealing)runnersStep(s,dt);
  if(oldZ<18&&b.z>=18){s.plateAt=s.clock-(b.z-18)/b.vz;s.plateBall=vec(b.x,b.y,18);if(s.online){b.x=s.plateBall.x;b.y=s.plateBall.y;b.z=18;}}
  if(s.plateAt>=0&&s.swingAt>=0&&Math.abs(s.swingAt-s.plateAt)<.23){const actual=vec(b.x,b.y,b.z);b.x=s.plateBall.x;b.y=s.plateBall.y;b.z=18;if(hitBall(s,s.swingAt-s.plateAt,s.aim.x,s.aim.y))return;b.x=actual.x;b.y=actual.y;b.z=actual.z;}
  if(s.online?s.plateAt>=0&&s.clock-s.plateAt>.4:b.z>=20.5){const swung=s.swingAt>=0;
   if(s.stealing){const r=s.runners[0];if(r&&r.at<2){r.done=true;s.bases[0]=null;s.outs++;event(s,'catch','盗塁阻止！');if(s.outs>=3){nextBatter(s);return;}}else if(r){s.bases[0]=null;s.bases[1]=r.unit;}}
   pitchVerdict(s,swung?'strike':Math.abs(b.x)<.62&&b.y>.5&&b.y<2?'strike':'ball');return;}
  if(s.timer>2.5||!s.online&&b.y<-.5)pitchVerdict(s,'ball');return;
 }
 if(s.stage==='live'||s.stage==='throw'){
  s.flightTime+=dt;
  if(b.owner<0){const oldY=b.y;physics(b,dt,9.81,s.stage==='throw'?0:.055);if(b.y<=0){b.y=.08;b.vy=Math.abs(b.vy)*.24;b.vx*=.75;b.vz*=.75;if(!s.bounced&&s.stage==='live'&&Math.abs(Math.atan2(b.x,18-b.z))>Math.PI/4){pitchVerdict(s,'foul');return;}s.bounced=true;if(oldY>.3)event(s,'bounce','バウンド');}
   if(s.stage==='live'&&Math.hypot(b.x,18-b.z)>66&&Math.abs(Math.atan2(b.x,18-b.z))<=Math.PI/4){
    if(b.y>3.2&&!s.bounced){const n=s.runners.filter(r=>!r.done).length;for(let i=0;i<n;i++)addRun(s);s.bases=[null,null,null];s.runners=[];stat(s,s.half,'homeRuns');stat(s,s.half,'hits');settle(s,'ホームラン！');return;}
    b.x=clamp(b.x,-48,48);b.z=Math.max(b.z,-48);b.vx*=-.25;b.vz*=-.25;
   }
  }else{const holder=s.players.find(p=>p.id===b.owner)!;b.x=holder.p.x;b.y=1.3+holder.p.y;b.z=holder.p.z;}
  const landing=predictLanding(s),field=s.players.find(p=>p.id===s.fielder)!;
  for(const f of s.players.filter(f=>f.team!==s.half)){
   if(s.online?!!s.controls?.[f.id]:f.id===s.fielder&&s.config.team===f.team&&s.config.mode!=='watch'){const control=s.online?s.controls![f.id]:input;move(f,control.x,control.z,dt,control.dash);}
   else if(s.stage==='throw'&&f.id===s.throwTarget)runTo(f,BASES[s.throwBase],dt,true);
   else if(f.id===s.fielder&&b.owner!==f.id)runTo(f,b.y>2?landing:vec(b.x,0,b.z),dt,true);
   else if(b.owner!==f.id)runTo(f,f.home,dt);
   if(b.owner<0&&len(f.p,b)<(f.action&&f.motion==='catch'?2.5:1.1)&&b.y<2.3+f.p.y&&s.flightTime>.12){
    b.owner=f.id;pose(f,'catch',.35);s.fielder=f.id;s.selected=humanBat?s.bat:f.id;
    if(s.stage==='live'&&!s.bounced){s.outs++;stat(s,1-s.half,'flyOuts');s.runners=s.runners.filter(r=>r.from>0);for(const r of s.runners){r.target=r.from;r.tag=true;r.forced=false;r.retouch=r.from;r.advanceAfterTag=(s.config.mode==='watch'||s.half!==s.config.team)&&r.from>=2&&len(f.p,BASES[r.from])>25&&s.outs<2;}event(s,'catch','フライ捕球！ タッチアップは帰塁してから',f.id);if(s.outs>=3){s.score[s.half]=s.playRuns;settle(s,'スリーアウト・チェンジ');return;}}
    else if(s.stage==='throw'){
     if(len(f.p,BASES[s.throwBase])<.85)for(const r of s.runners.filter(r=>!r.done&&r.target===s.throwBase))if((r.forced||r.retouch===s.throwBase)&&len(s.players.find(p=>p.id===r.unit)!.p,BASES[s.throwBase])>.65)putOut(s,r,r.forced);
     if(s.phase!=='play')return;s.stage='live';
    }
    event(s,'catch','捕球！',f.id);break;
   }
  }
  runnersStep(s,dt);if(s.phase!=='play')return;
  if(b.owner>=0){for(const r of s.runners.filter(r=>!r.done&&r.target!==r.at)){const holder=s.players.find(p=>p.id===b.owner)!;const runner=s.players.find(p=>p.id===r.unit)!;if(len(holder.p,runner.p)<.8)putOut(s,r);if(s.phase!=='play')return;}
   if((s.online?!s.controls?.[s.fielder]:(s.config.team!==1-s.half||s.config.mode==='watch'))&&field.action<=0&&s.timer>1){const base=chooseThrow(s);if(s.runners.some(r=>!r.done&&r.target!==r.at))throwToBase(s,base);}
   if(s.runners.every(r=>r.done||r.at===r.target&&!r.tag)&&s.timer>1.5){settle(s,s.outs>s.outsAtHit?'アウト判定':'セーフ！');return;}}
  if(s.timer>18)settle(s,'プレー終了');
 }
}
