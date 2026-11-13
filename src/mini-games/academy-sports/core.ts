/** Fixed-step, serializable sports simulation. Rendering never decides a score. */
export type SportId='baseball'|'soccer'|'volleyball'|'festival';
export type Motion='idle'|'run'|'pitch'|'swing'|'throw'|'catch'|'kick'|'tackle'|'serve'|'receive'|'set'|'spike'|'block'|'jump'|'punch'|'guard'|'hurt'|'celebrate';
export type Action='primary'|'release'|'pass'|'lob'|'defend'|'dash'|'jump'|'switch'|'special'|'alternate'|'advance'|'retreat'|'steal'|'throw1'|'throw2'|'throw3'|'throw4'|'next';
export interface Vec {x:number;y:number;z:number}
export interface Input {x:number;z:number;aimX:number;aimZ:number;dash:boolean;primary:boolean}
export const neutral=():Input=>({x:0,z:0,aimX:0,aimZ:0,dash:false,primary:false});
export type DrillId='soccer-move'|'soccer-shot'|'soccer-pass'|'soccer-lob'|'soccer-dribble'|'soccer-tackle'|'soccer-special'|'soccer-switch'|'volley-serve'|'volley-receive'|'volley-set'|'volley-spike'|'volley-block'|'volley-dive'|'volley-special'|'volley-move';
export interface PracticeState {id:DrillId;attempt:number;successes:number;limit:number;time:number;result:null|'success'|'miss';resultTime:number;baseline:Record<string,number>;startSelected:number;jumped:boolean;dashed:boolean;dove:boolean;acted:boolean;target:Vec;special:boolean;}
export interface Config {drill?:DrillId;sport:SportId;difficulty:0|1|2|3;mode:'match'|'practice'|'batting'|'pitching'|'fielding'|'home-run'|'watch';rules:'simple'|'standard';assist:boolean;innings:3|6|9;minutes:1|3;sets:1|3;points:15|25;formation:'4-4-2'|'4-3-3'|'3-5-2';night:boolean;ringOut:boolean;hero:string;team:number;seed:number;}
export const defaultConfig=(sport:SportId):Config=>({sport,difficulty:1,mode:'match',rules:'simple',assist:true,innings:3,minutes:1,sets:1,points:15,formation:'4-3-3',night:false,ringOut:true,hero:'elementary-dodgeball',team:0,seed:7891});
export interface Skills {speed:number;power:number;control:number;defense:number;stamina:number;jump:number;teamwork:number;pitch:number;}
export interface Athlete {id:number;team:number;slot:number;hero:string;role:string;name:string;p:Vec;v:Vec;home:Vec;face:number;skills:Skills;spirit:number;hp:number;motion:Motion;action:number;cooldown:number;jump:number;stun:number;charge:number;stats:Record<string,number>;cpuTarget?:Vec;cpuAt?:number;}
export interface Ball extends Vec {vx:number;vy:number;vz:number;owner:number;team:number;power:number;spin:number;special:boolean;last:number;}
export interface Event {id:number;at:number;kind:'hit'|'catch'|'whistle'|'cheer'|'special'|'bounce'|'score'|'hurt';text:string;actor:number;move?:'pitch'|'drive'|'shot'|'serve'|'spike';}
export interface Frame {ball:Vec;players:{id:number;p:Vec;face:number;motion:Motion;jump:number;action:number}[];}
export interface Core {practice?:PracticeState;online?:boolean;controls?:Record<number,Input>;id:string;config:Config;clock:number;phase:'ready'|'play'|'replay'|'interval'|'finished';phaseTime:number;players:Athlete[];ball:Ball;score:number[];winner:number|null;selected:number;notice:string;events:Event[];serial:number;history:Frame[];replay:Frame[];replayTime:number;elapsed:number;morale:number[];awaken:number[];stats:Record<string,number>[];}
export const vec=(x=0,y=0,z=0):Vec=>({x,y,z});
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const len=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
export const dist3=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const hash=(n:number)=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
export const unit=(x:number,z:number)=>{const d=Math.hypot(x,z)||1;return{x:x/d,z:z/d};};
const HEROES=['elementary-dodgeball','high-school-warrior','magic-akari','elementary-caretaker','magic-mirai','elementary-assassin','high-school-dodgeball','magic-minato','elementary-bard','magic-koharu','high-school-gardener'];
export function athlete(team:number,slot:number,role:string,p:Vec,c:Config):Athlete{
 const h=hash(c.seed+team*319+slot*77),s=(offset:number)=>.55+(hash(h+offset)%450)/1000;
 return{id:team*100+slot,team,slot,role,hero:team===c.team&&slot===(c.sport==='soccer'?9:c.sport==='volleyball'?3:0)?c.hero:HEROES[(slot+team*3)%HEROES.length],name:`${team+1}-${slot+1}`,p:{...p},home:{...p},v:vec(),face:team===0?Math.PI:0,skills:{speed:s(1),power:s(2),control:s(3),defense:s(4),stamina:s(5),jump:s(6),teamwork:s(7),pitch:s(8)},spirit:100,hp:100,motion:'idle',action:0,cooldown:0,jump:0,stun:0,charge:0,stats:{}};
}
export function core(c:Config,teams=2):Core{return{id:`${c.sport}-${c.seed}-${Date.now()}`,config:{...c},clock:0,phase:'ready',phaseTime:1.5,players:[],ball:{...vec(),vx:0,vy:0,vz:0,owner:-1,team:0,power:0,spin:0,special:false,last:-1},score:Array(teams).fill(0),winner:null,selected:c.team*100,notice:'試合開始',events:[],serial:0,history:[],replay:[],replayTime:0,elapsed:0,morale:Array(teams).fill(0),awaken:Array(teams).fill(0),stats:Array.from({length:teams},()=>({}))};}
export function event(s:Core,kind:Event['kind'],text:string,actor=-1,move?:Event['move']){s.notice=text;s.events.push({id:++s.serial,at:s.clock,kind,text,actor,...(move?{move}:{})});s.events=s.events.slice(-20);}
export const stat=(s:Core,team:number,key:string,n=1)=>s.stats[team][key]=(s.stats[team][key]||0)+n;
export function pose(p:Athlete,motion:Motion,time=.5){p.motion=motion;p.action=time;}
export function tickCore(s:Core,dt:number){
 if(s.phase==='finished')return false;s.clock+=dt;
 s.players.forEach(p=>{p.action=Math.max(0,p.action-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.stun=Math.max(0,p.stun-dt);if(!p.action&&p.motion!=='run')p.motion='idle';p.spirit=clamp(p.spirit+dt*(4+p.skills.stamina*2)*(s.awaken[p.team]>0?2:1),0,100);if(p.p.y>0||p.v.y>0){p.v.y-=15*dt;p.p.y=Math.max(0,p.p.y+p.v.y*dt);if(!p.p.y)p.v.y=0;}p.jump=p.p.y;});
 s.awaken=s.awaken.map(a=>Math.max(0,a-dt));
 if(s.phase==='ready'||s.phase==='replay'||s.phase==='interval'){s.phaseTime-=dt;s.replayTime+=dt;if(s.phaseTime<=0){s.phase='play';s.replayTime=0;}return false;}
 s.elapsed+=dt;return true;
}
export function capture(s:Core,dt:number){if(Math.floor(s.clock*15)!==Math.floor((s.clock-dt)*15)){s.history.push({ball:{x:s.ball.x,y:s.ball.y,z:s.ball.z},players:s.players.map(p=>({id:p.id,p:{...p.p},face:p.face,motion:p.motion,jump:p.jump,action:p.action}))});if(s.history.length>65)s.history.shift();}}
export function replay(s:Core,text:string,seconds=2.4){s.replay=s.history.map(f=>({ball:{...f.ball},players:f.players.map(p=>({...p,p:{...p.p}}))}));s.phase='replay';s.phaseTime=seconds;s.replayTime=0;event(s,'score',text);}
export function finish(s:Core){s.phase='finished';s.winner=s.score.every(v=>v===s.score[0])?null:s.score.indexOf(Math.max(...s.score));event(s,'cheer',s.winner===null?'引き分け':`TEAM ${s.winner+1} の勝利！`);s.players.forEach(p=>pose(p,p.team===s.winner?'celebrate':'idle',5));}
export function move(p:Athlete,x:number,z:number,dt:number,boost=false){
 if(p.stun>0)return;const d=Math.max(1,Math.hypot(x,z));const speed=(3.5+p.skills.speed*3)*(boost&&p.spirit>5?1.55:1)*(p.spirit<5?.65:1);const k=Math.min(1,dt*12);
 p.v.x+=(x/d*speed-p.v.x)*k;p.v.z+=(z/d*speed-p.v.z)*k;p.p.x+=p.v.x*dt;p.p.z+=p.v.z*dt;if(Math.hypot(p.v.x,p.v.z)>.15){p.face=Math.atan2(p.v.x,p.v.z);if(!p.action)p.motion='run';}else if(!p.action)p.motion='idle';if(boost&&Math.hypot(x,z)>.1)p.spirit=Math.max(0,p.spirit-dt*15);
}
export function runTo(p:Athlete,target:Vec,dt:number,boost=false){const d=len(p.p,target);move(p,d<.15?0:(target.x-p.p.x)/Math.max(1,d),d<.15?0:(target.z-p.p.z)/Math.max(1,d),dt,boost);}
export const jump=(p:Athlete,power=6)=>{if(p.p.y<.05&&!p.stun){p.v.y=power+p.skills.jump*1.2;pose(p,'jump',.6);}};
export function kickBall(s:Core,p:Athlete,target:Vec,speed:number,lift=0,spin=0){const d=unit(target.x-s.ball.x,target.z-s.ball.z);s.ball.owner=-1;s.ball.special=false;s.ball.team=p.team;s.ball.last=p.id;s.ball.vx=d.x*speed;s.ball.vz=d.z*speed;s.ball.vy=lift;s.ball.spin=spin;}
export function physics(b:Ball,dt:number,gravity=9.81,drag=.05){b.vx+=b.vz*b.spin*dt*.02;b.vz-=b.vx*b.spin*dt*.02;b.vy-=gravity*dt;b.vx*=1-drag*dt;b.vz*=1-drag*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;}
export function morale(s:Core,team:number,n:number){s.morale[team]=Math.min(100,s.morale[team]+n);if(s.morale[team]>=100){s.awaken[team]=12;s.morale[team]=0;event(s,'special','チーム覚醒！');}}
export const cpu=(s:Core,p:Athlete)=>s.config.mode==='watch'||p.team!==s.config.team||p.id!==s.selected;
export const aiInterval=(level:number)=>[.55,.32,.18,.09][level];
export function assertFinite(s:Core){for(const p of s.players)for(const n of[p.p.x,p.p.y,p.p.z,p.hp,p.spirit])if(!Number.isFinite(n))throw Error('Non-finite athlete');for(const n of[s.ball.x,s.ball.y,s.ball.z,...s.score])if(!Number.isFinite(n))throw Error('Non-finite match');}
/** Corrupt or older settings must never create invalid teams or unfinishable rules. */
export function normalizeConfig(raw:unknown,sport:SportId):Config{
 const c=defaultConfig(sport);if(!raw||typeof raw!=='object')return c;const p=raw as Partial<Config>;
 if([0,1,2,3].includes(p.difficulty!))c.difficulty=p.difficulty!;
 if(Number.isInteger(p.team)&&p.team!>=0&&p.team!<(sport==='festival'?4:2))c.team=p.team!;
 if(['simple','standard'].includes(p.rules!))c.rules=p.rules!;
 if([3,6,9].includes(p.innings!))c.innings=p.innings!;
 if([1,3].includes(p.minutes!))c.minutes=p.minutes!;
 if([1,3].includes(p.sets!))c.sets=p.sets!;
 if([15,25].includes(p.points!))c.points=p.points!;
 if(['4-4-2','4-3-3','3-5-2'].includes(p.formation!))c.formation=p.formation!;
 if(typeof p.hero==='string'&&/^[a-z0-9-]{1,70}$/.test(p.hero))c.hero=p.hero;
 for(const key of['assist','night','ringOut'] as const)if(typeof p[key]==='boolean')c[key]=p[key]!;
 return c;
}
export function normalizeInput(input:Input):Input{const finite=(n:number)=>Number.isFinite(n)?clamp(n,-1,1):0;return{x:finite(input.x),z:finite(input.z),aimX:finite(input.aimX),aimZ:finite(input.aimZ),dash:input.dash===true,primary:input.primary===true};}
export function segmentDistance(a:Vec,b:Vec,p:Vec){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(a.x+dx*t-p.x,a.z+dz*t-p.z);}

/** Host assigns each human a single unit; unassigned units retain CPU behavior. */
export function controlInput(s:Core,p:Athlete,fallback:Input):Input|undefined{return s.online?s.controls?.[p.id]:s.config.mode!=='watch'&&s.selected===p.id?fallback:undefined;}
