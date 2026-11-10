import {specialHero,specialName,SIGNATURE_COST} from './specials';
import {core,athlete,vec,len,clamp,unit,event,stat,pose,tickCore,capture,replay,finish,move,runTo,physics,kickBall,morale,jump,hash,type Core,type Config,type Input,type Action,type Vec,type Athlete,controlInput,neutral} from './core';
export const SERVES=['通常サーブ','ジャンプサーブ','フローター','狙い撃ち'];
export const SETS=['通常トス','高いトス','クイック','バックトス','時間差'];
export const ATTACKS=['クロス','ストレート','フェイント','ブロックアウト','強打','パイプ'];
const side=(team:number)=>team===0?1:-1;
export interface Volleyball extends Core {signatureReady?:Record<number,boolean>;buffers?:Record<number,number>;sport:'volleyball';points:number[];setNumber:number;server:number;serveSlot:number[];rotations:number[];stage:'serve'|'toss'|'rally';serveType:number;setType:number;attackType:number;contacts:number;contactTeam:number;lastContact:number;lastWasBlock:boolean;timer:number;rally:number;target:number;receiver:number;precision:number;buffer:number;serveAim:Vec;landing:Vec;link:boolean;}
function home(team:number,slot:number,rotation=0){const i=(slot+rotation)%6;return vec([-3,0,3,3,0,-3][i],0,side(team)*[2,2,2,6,6,6][i]);}
export function createVolleyball(c:Config):Volleyball{
 const s=Object.assign(core(c),{sport:'volleyball' as const,points:[0,0],setNumber:1,server:0,serveSlot:[3,3],rotations:[0,0],stage:'serve' as const,serveType:0,setType:0,attackType:0,contacts:0,contactTeam:0,lastContact:-1,lastWasBlock:false,timer:0,rally:0,target:2,receiver:100,precision:1,buffer:0,serveAim:vec(1,0,-6),landing:vec(),link:false});
 for(let t=0;t<2;t++)for(let i=0;i<6;i++)s.players.push(athlete(t,i,['S','WS','MB','OP','L','WS'][i],home(t,i),c));resetRally(s);return s;
}
export function resetRally(s:Volleyball){
 for(const p of s.players){p.home=home(p.team,p.slot,s.rotations[p.team]);p.p={...p.home};p.v=vec();p.face=p.team===0?Math.PI:0;p.charge=0;}
 const server=s.players.find(p=>p.id===s.server*100+s.serveSlot[s.server])!;server.p=vec(2,0,side(s.server)*10);s.stage='serve';s.contacts=0;s.lastContact=-1;s.lastWasBlock=false;s.contactTeam=s.server;s.timer=0;s.rally=0;s.buffer=0;s.link=false;s.signatureReady={};
 s.ball={...s.ball,x:server.p.x,y:1.2,z:server.p.z,vx:0,vy:0,vz:0,owner:server.id,team:server.team,last:server.id,special:false};s.serveAim=vec(-1,0,-side(s.server)*6);s.selected=s.config.team===s.server?server.id:s.config.team*100+4;
 event(s,'whistle','サーブでラリー開始',server.id);
}
export function volleyballPoint(s:Volleyball,team:number,reason:string){
 s.points[team]++;stat(s,team,'points');morale(s,team,12);const target=s.config.points===15||s.setNumber===s.config.sets&&s.config.sets>1?15:25;
 const wonSet=s.points[team]>=target&&s.points[team]-s.points[1-team]>=2;
 if(wonSet){s.score[team]++;stat(s,team,'sets');if(s.score[team]>=Math.floor(s.config.sets/2)+1){finish(s);event(s,'cheer','マッチポイントを決めた！');return;}s.setNumber++;s.points=[0,0];}
 if(s.server!==team){s.rotations[team]=(s.rotations[team]+1)%6;s.serveSlot[team]=(3-s.rotations[team]+6)%6;}s.server=team;
 replay(s,wonSet?'セット獲得！':reason,1.6);resetRally(s);event(s,'score',reason);
}
function arc(s:Volleyball,p:Athlete,target:Vec,time:number,extra=0){
 const b=s.ball;b.special=false;b.owner=-1;b.team=p.team;b.last=p.id;b.vx=(target.x-b.x)/time;b.vz=(target.z-b.z)/time;b.vy=(target.y-b.y+.5*9.81*time*time)/time+extra;b.spin=0;s.lastContact=p.id;s.contactTeam=p.team;s.lastWasBlock=false;
}
export function landing(s:Volleyball):Vec{const b={...s.ball};for(let i=0;i<180;i++){physics(b,1/60,9.81,0);if(b.y<.2)return vec(b.x,0,b.z);}return vec(b.x,0,b.z);}
function futureAt(b:Volleyball['ball'],seconds:number){return vec(b.x+b.vx*seconds,Math.max(0,b.y+b.vy*seconds-4.905*seconds*seconds),b.z+b.vz*seconds);}
export function touch(s:Volleyball,p:Athlete,kind:'receive'|'set'|'spike'|'block',input:Input){
 const b=s.ball;if(p.cooldown>0||p.stun)return false;
 const error=len(p.p,b),height=b.y-p.p.y,range=kind==='receive'?(p.motion==='catch'?2.7:1.9)+(s.config.assist?.35:0):kind==='set'?1.8:2;
 if(error>range||height>(kind==='receive'?2.3:3.15)||height<.1){return false;}
 if(s.config.rules==='standard'&&p.id===s.lastContact&&!s.lastWasBlock){volleyballPoint(s,1-p.team,'ダブルコンタクト');return false;}
 if(kind!=='block'){
  if(s.contactTeam!==p.team){s.contacts=0;s.contactTeam=p.team;}
  s.contacts++;if(s.contacts>3){volleyballPoint(s,1-p.team,'フォーヒット');return false;}
 }
 p.cooldown=.38;p.spirit=Math.max(0,p.spirit-5);const quality=clamp(1-error/range*.45-Math.abs(height-(kind==='receive'?1:2.6))*.12,0,1);s.precision=quality;
 if(kind==='receive'){
  const setter=s.players.filter(q=>q.team===p.team&&q.id!==p.id).sort((a,b)=>(a.role==='S'?-10:0)-(b.role==='S'?-10:0)+len(a.p,vec(0,0,side(p.team)*2))-len(b.p,vec(0,0,side(p.team)*2)))[0];
  const target=vec(setter.p.x*.3,2.6,side(p.team)*2.8);arc(s,p,target,1.02+(1-quality)*.25);s.receiver=setter.id;stat(s,p.team,'receives');pose(p,'receive',.55);morale(s,p.team,quality>.75?8:3);event(s,'catch',quality>.8?'ナイスレシーブ！':'レシーブ！',p.id);
 }else if(kind==='set'){
  const choices=s.players.filter(q=>q.team===p.team&&q.id!==p.id&&q.role!=='L');let attacker=choices.find(q=>q.slot===s.target)||choices.sort((a,b)=>b.skills.power-a.skills.power)[0];
  const quick=s.setType===2,time=quick?.68:s.setType===1?1.35:s.setType===4?1.15:.95;
  const back=s.setType===3||s.attackType===5,target=vec(s.setType===3?-2.5:attacker.home.x*.75,3.1,side(p.team)*(back?4:1.5));
  arc(s,p,target,time);s.receiver=attacker.id;pose(p,'set',.55);stat(s,p.team,'setsMade');morale(s,p.team,quality>.75?9:4);event(s,'hit',SETS[s.setType],p.id);
 }else if(kind==='spike'){
  if(s.config.rules==='standard'&&p.role==='L'&&b.y>2.43){volleyballPoint(s,1-p.team,'リベロのアタック反則');return false;}
  const sign=side(p.team),human=s.online?!!s.controls?.[p.id]:p.team===s.config.team&&s.config.mode!=='watch';let target:Vec;
  if(human)target=vec(clamp((input.aimX||input.x)*4,-4.1,4.1),0,-sign*(s.attackType===2?2.1:7));
  else{const spots=[vec(-3.5,0,-sign*7.2),vec(3.5,0,-sign*7.2),vec(0,0,-sign*3)];target=spots.sort((a,b)=>{const nearest=(q:Vec)=>Math.min(...s.players.filter(x=>x.team!==p.team).map(x=>len(x.p,q)));return nearest(b)-nearest(a);})[0];}
  if(s.attackType===1)target.x=clamp(b.x,-3.8,3.8);if(s.attackType===3)target.x=Math.sign(b.x||1)*4.45;
  const charged=!!s.signatureReady?.[p.id],signature=specialHero(p.hero);const distance=len(b,target),speed=(s.attackType===2?9:15+quality*7+p.skills.power*4)*(s.link?1.12:1)*(charged?signature.speed:1),time=clamp(distance/speed,charged?.26:.32,.7);
  const dispersion=(1-quality)*(1-p.skills.control)*1.7;target.x+=Math.sin(p.id+s.rally)*dispersion;target.z+=Math.cos(p.id+s.rally)*dispersion;
  arc(s,p,target,time);b.power=speed*(charged?signature.power:1);b.special=charged||s.link;if(charged){b.spin=signature.curve*.65;delete s.signatureReady![p.id];stat(s,p.team,'signatures');}pose(p,'spike',.65);stat(s,p.team,'spikes');if(charged)event(s,'special',specialName(p.hero,'volleyball'),p.id,'spike');else if(s.link)event(s,'special',s.setType===2?'星継ぎクイック！':s.attackType===5?'宵風パイプ！':'双灯コンビネーション！',p.id);else event(s,'hit',ATTACKS[s.attackType]+'スパイク！',p.id);
 }else {b.vz=-b.vz*.72;b.vy=-3;b.team=p.team;b.last=p.id;s.lastContact=p.id;s.lastWasBlock=true;s.contacts=0;s.contactTeam=p.team;pose(p,'block',.6);stat(s,p.team,'blocks');morale(s,p.team,16);event(s,'catch','ブロック成功！',p.id);}
 if(!s.online&&kind!=='block'&&p.team===s.config.team&&s.config.mode!=='watch')s.selected=s.receiver;
 return true;
}
function serveHit(s:Volleyball){
 const p=s.players.find(q=>q.id===s.ball.last)!,b=s.ball,charged=!!s.signatureReady?.[p.id],signature=specialHero(p.hero);const timing=Math.abs(b.y-(s.serveType===1?3.2:2.4));
 const quality=clamp(1-timing*.6,0,1);if(s.serveType===1&&p.p.y<.1)jump(p,6);b.y=Math.max(b.y,p.p.y+2.1);
 const time=s.serveType===1?.8:s.serveType===2?1.15:1.05;const target={...s.serveAim,y:.25};arc(s,p,target,(time+(1-quality)*.25)/(charged?signature.speed:1));b.spin=s.serveType===2?Math.sin(s.clock)*.6:0;b.power=17*(charged?signature.power:1);b.special=charged;if(charged){b.spin+=signature.curve*.65;delete s.signatureReady![p.id];stat(s,p.team,'signatures');}s.contacts=0;s.stage='rally';s.timer=0;s.lastContact=p.id;pose(p,'serve',.7);stat(s,p.team,'serves');event(s,charged?'special':'hit',charged?specialName(p.hero,'volleyball','JAPANESE','serve'):SERVES[s.serveType],p.id,charged?'serve':undefined);
}
export function volleyballAction(s:Volleyball,action:Action,input:Input){
 if(action==='next'){s.phaseTime=0;return;}if(s.phase!=='play')return;const p=s.players.find(q=>q.id===s.selected)!;if(!p)return;
 if(action==='alternate'){if(s.stage==='serve')s.serveType=(s.serveType+1)%4;else s.setType=(s.setType+1)%5;}
 if(action==='lob')s.attackType=(s.attackType+1)%6;
 if(action==='pass'){const candidates=s.players.filter(q=>q.team===p.team&&q.role!=='L');s.target=candidates[(candidates.findIndex(q=>q.slot===s.target)+1)%candidates.length].slot;}
 if(action==='switch'){const members=s.players.filter(q=>q.team===s.config.team).sort((a,b)=>len(a.p,s.ball)-len(b.p,s.ball));s.selected=members[(members.findIndex(q=>q.id===p.id)+1)%members.length].id;}
 if(action==='special'&&p.spirit>=SIGNATURE_COST&&!s.signatureReady?.[p.id]){s.signatureReady??={};s.signatureReady[p.id]=true;p.spirit-=SIGNATURE_COST;event(s,'whistle','必殺球を準備！',p.id);}
 if(action==='jump')jump(p,6);
 if(action==='defend'){if(Math.abs(p.p.z)<3){jump(p,6.2);pose(p,'block',.7);}else{pose(p,'catch',.75);move(p,input.x,input.z,.16,true);}return;}
 if(action==='primary'){
  if(s.stage==='serve'&&s.server===p.team){s.stage='toss';s.ball.owner=-1;s.ball.y=1.7;s.ball.vy=5.5;s.ball.vx=s.ball.vz=0;s.timer=0;pose(p,'serve',1.2);return;}
  if(s.stage==='toss'&&s.server===p.team){serveHit(s);return;}
  if(s.stage==='rally'){if(s.online){s.buffers??={};s.buffers[p.id]=.4;}else s.buffer=.2;const kind=s.contactTeam===p.team&&s.contacts>=2?'spike':s.contactTeam===p.team&&s.contacts===1?'set':'receive';if(touch(s,p,kind,s.controls?.[p.id]||input)){s.buffer=0;if(s.buffers)s.buffers[p.id]=0;}}
 }
}
export function stepVolleyball(s:Volleyball,input:Input,dt:number){
 if(!tickCore(s,dt))return;capture(s,dt);s.timer+=dt;s.rally+=dt;if(s.buffers)for(const id of Object.keys(s.buffers))s.buffers[Number(id)]=Math.max(0,s.buffers[Number(id)]-dt);s.buffer=Math.max(0,s.buffer-dt);
 const b=s.ball,server=s.players.find(p=>p.id===s.server*100+s.serveSlot[s.server])!,human=s.online?server:s.players.find(p=>p.id===s.selected)!,serveInput=s.online?s.controls?.[server.id]||neutral():input,serverCpu=s.online?!s.controls?.[server.id]:s.config.mode==='watch'||s.server!==s.config.team;
 if(s.online&&s.stage!=='rally')for(const p of s.players){const control=s.controls?.[p.id];if(control&&p.id!==server.id){move(p,control.x,control.z,dt,control.dash);p.p.x=clamp(p.p.x,-4.4,4.4);p.p.z=clamp(p.p.z,p.team===0?.2:-8.8,p.team===0?8.8:-.2);}}
 if(s.stage==='serve'){
  if(serverCpu){if(s.timer>1){s.stage='toss';b.owner=-1;b.vy=5.5;b.y=1.7;s.timer=0;}}
  else {human.p.x=clamp(human.p.x+serveInput.x*dt*3,-4,4);s.serveAim.x=clamp(s.serveAim.x+(serveInput.aimX||serveInput.x)*dt*2,-4,4);b.x=human.p.x;}
  return;
 }
 if(s.stage==='toss'){
  physics(b,dt,9.81,0);if((serverCpu)&&s.timer>.5)serveHit(s);
  else if(s.timer>1.5){volleyballPoint(s,1-s.server,'サーブミス');}return;
 }
 const old={...b};physics(b,dt,9.81,0);s.landing=landing(s);
 const ballSide=b.z>=0?0:1;
 if(old.z*b.z<0&&Math.abs(b.x)<4.6){const alpha=old.z/(old.z-b.z),height=old.y+(b.y-old.y)*alpha;
  if(height<2.43){b.z=Math.sign(old.z)*.08;b.vz=-b.vz*.2;b.vy=-1;event(s,'bounce','ネットに当たった！');}
  else {for(const p of s.players.filter(p=>p.team===ballSide&&Math.abs(p.p.z)<2&&p.motion==='block'))if(Math.abs(p.p.x-b.x)<.85&&height<2.3+p.p.y&&height>1.8){touch(s,p,'block',input);break;}}
 }
 if(b.y<=.12){const out=Math.abs(b.x)>4.5||Math.abs(b.z)>9;const winner=out?1-b.team:1-(b.z>=0?0:1);if(s.contacts===0&&s.lastContact>=0)stat(s,winner,'aces');if(b.power>17&&winner===b.team)stat(s,winner,'kills');volleyballPoint(s,winner,out?'アウト！':'ボールがコートに落ちた！');return;}
 if(Math.abs(b.x)>7||Math.abs(b.z)>13){volleyballPoint(s,1-b.team,'アウト！');return;}
 const receivingTeam=s.contactTeam===ballSide&&s.contacts>0?ballSide:ballSide;
 const desired=s.contactTeam===receivingTeam&&s.contacts>0?s.receiver:s.players.filter(p=>p.team===receivingTeam&&p.id!==s.lastContact).sort((a,b)=>len(a.p,s.landing)-len(b.p,s.landing))[0].id;
 for(const p of s.players){
  p.spirit=Math.max(0,p.spirit-dt*(7+s.rally*.3));
  const control=controlInput(s,p,input),playerControlled=!!control;let target={...p.home};
  if(p.id===desired){const future=futureAt(b,b.vy>0?.25:.08);target=vec(clamp(future.x,-4.3,4.3),0,clamp(future.z,receivingTeam===0?.4:-8.5,receivingTeam===0?8.5:-.4));}
  else if(p.team!==receivingTeam&&p.role!=='L'&&s.contacts>=2){target=vec(clamp(b.x+(p.slot-1)*.8,-4,4),0,side(p.team)*.8);}
  if(playerControlled){if(s.config.assist&&Math.hypot(control!.x,control!.z)<.1&&p.id===desired)runTo(p,target,dt);else move(p,control!.x,control!.z,dt,control!.dash);p.p.x=clamp(p.p.x,-4.4,4.4);p.p.z=clamp(p.p.z,p.team===0?.2:-8.8,p.team===0?8.8:-.2);
   if((s.online?(s.buffers?.[p.id]||0):s.buffer)>0){const kind=s.contactTeam===p.team&&s.contacts>=2?'spike':s.contactTeam===p.team&&s.contacts===1?'set':'receive';if(touch(s,p,kind,s.controls?.[p.id]||input)){s.buffer=0;if(s.buffers)s.buffers[p.id]=0;}}
  }else {
   runTo(p,target,dt,p.id===desired);
   if(p.id===desired&&b.z*side(p.team)>0&&p.cooldown<=0){const kind=s.contactTeam===p.team&&s.contacts>=2?'spike':s.contactTeam===p.team&&s.contacts===1?'set':'receive';
    const reaction=[.9,.6,.35,.15][s.config.difficulty];const d=len(p.p,b);if(kind==='spike'&&b.vy<3&&b.y>2&&d<2)jump(p,6);
    const reach=kind==='receive'?1.9:3.0+p.p.y;if(d<1.5+p.skills.control*.4&&b.y<reach&&b.vy<reaction+1.5&&p.spirit>Math.min(24,s.rally*.4)){touch(s,p,kind,input);}
   }
   if(p.team!==receivingTeam&&s.contacts>=2&&Math.abs(p.p.z)<1.3&&Math.abs(p.p.x-b.x)<1.5&&b.vy<1&&b.y>2) {jump(p,6);pose(p,'block',.6);}
  }
 }
 if(!s.online&&s.config.assist&&s.config.mode!=='watch'&&s.contactTeam!==s.config.team&&ballSide===s.config.team&&s.players.find(p=>p.id===s.selected)?.id!==desired)s.selected=desired;
}
