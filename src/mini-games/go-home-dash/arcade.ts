import { floorAt, routeAt } from './routes';

export type RunMode = 'classic' | 'daily' | 'practice';
export type Vehicle = 'normal' | 'gravity' | 'wave' | 'rocket';
export type Pickup = 'coin' | 'star' | 'magnet' | 'shield' | 'double' | 'sneakers' | 'board' | 'rocket' | 'lowGravity' | 'wave' | 'gravity' | 'charge' | 'orb' | 'pad' | 'boost';
export type Hazard = 'spike' | 'tunnel' | 'wall' | 'saw' | 'laser' | 'missile' | 'airGate' | 'rail';
export interface ArcadeEntity {
  id: number; kind: Pickup | Hazard; d: number; lift: number; width: number; height: number;
  air?: boolean; warned?: boolean; taken?: boolean; passed?: boolean; hit?: boolean; born: number;
}
export interface ArcadePlayer {
  x: number; y: number; vy: number; isJumping: boolean; isFalling: boolean; jumpCount: number;
  flying: boolean; invulFrame: number; dashFrames: number; dashCooldown: number; isPressing: boolean;
}
export interface ArcadeStats { coins: number; stars: number; dodges: number; breaks: number; perfects: number; bosses: number; missions: number }
export interface ArcadeState {
  seed: number; runMode: RunMode; frame: number; chunk: number; serial: number; entities: ArcadeEntity[];
  combo: number; bestCombo: number; comboTime: number; fever: number; energy: number;
  magnet: number; double: number; sneakers: number; board: number; shield: number; lowGravity: number;
  boost: number; slide: number; vehicle: Vehicle; vehicleTime: number; gravity: number;
  stats: ArcadeStats; missionDone: boolean[]; score: number; notice: string; noticeTime: number;
  boss: { hp: number; life: number; shot: number } | null; clearAhead: boolean; changedVehicle: boolean;
}
export const PATTERNS = ['coinRoad','magnetTrail','orbSpikes','slideTunnel','dashWall','sawSlalom','moonJump','gravityRoad','waveGates','rocketRide','laserDance','bossRush','skyRail','springChain','treasureRoad','boostRoad'] as const;
const pickups = new Set<string>(['coin','star','magnet','shield','double','sneakers','board','rocket','lowGravity','wave','gravity','charge','orb','pad','boost']);
export const isPickup = (kind: string) => pickups.has(kind);
export const hash = (n: number) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; };
export function dailySeed(day = new Date().toISOString().slice(0,10)) { return [...day].reduce((n,c)=>hash(n+c.charCodeAt(0)), 1701); }
export function seededRandom(seed: number) { let n=seed;return ()=>{n=(n+0x6d2b79f5)|0;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;}; }
export function createArcade(seed: number, runMode: RunMode = 'classic', distance = 0): ArcadeState {
  return {seed,runMode,frame:0,chunk:Math.floor(distance/1800)-1,serial:0,entities:[],combo:0,bestCombo:0,comboTime:0,fever:0,energy:0,magnet:0,double:0,sneakers:0,board:0,shield:0,lowGravity:0,boost:0,slide:0,vehicle:'normal',vehicleTime:0,gravity:1,stats:{coins:0,stars:0,dodges:0,breaks:0,perfects:0,bosses:0,missions:0},missionDone:[false,false,false],score:0,notice:'',noticeTime:0,boss:null,clearAhead:false,changedVehicle:false};
}
export function announce(s: ArcadeState, notice: string) {s.notice=notice;s.noticeTime=110;}
export function addEntity(s: ArcadeState, kind: ArcadeEntity['kind'], d: number, lift: number, width=26,height=26,air=false) {
  const e={id:++s.serial,kind,d,lift,width,height,air,born:s.frame};s.entities.push(e);return e;
}
export function entityY(s: ArcadeState, e: ArcadeEntity) {
  const base=e.air?340:floorAt(s.seed,e.d);
  return base-e.lift+(e.kind==='saw'?Math.sin((s.frame-e.born)*.04)*12:0);
}
export function multiplier(s: ArcadeState) {return (1+Math.min(4,Math.floor(s.combo/10)))*(s.double>0?2:1)*(s.fever>0?2:1);}
export function reward(s: ArcadeState, value=20, energy=4) {
  s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.comboTime=360;s.score+=value*multiplier(s);
  if(s.fever<=0){s.energy=Math.min(100,s.energy+energy);if(s.energy>=100){s.energy=0;s.fever=480;announce(s,'fever');}}
}
export function missionProgress(s: ArcadeState) {return [s.stats.coins,s.stats.dodges,s.stats.breaks];}
export const MISSION_TARGETS=[25,8,3];
export function checkMissions(s: ArcadeState) {missionProgress(s).forEach((v,i)=>{if(!s.missionDone[i]&&v>=MISSION_TARGETS[i]){s.missionDone[i]=true;s.stats.missions++;s.score+=500;s.energy=Math.min(99,s.energy+20);announce(s,'mission');}});}
function trail(s:ArcadeState,d:number,lift:number,count=8,arc=false,air=false){for(let i=0;i<count;i++)addEntity(s,'coin',d+i*46,lift+(arc?Math.sin(i/(count-1)*Math.PI)*92:0),18,18,air);}
export function spawnPattern(s:ArcadeState, name:typeof PATTERNS[number], d:number, flight=false) {
  s.clearAhead=true;
  if(flight){
    trail(s,d,150,10,false,true);addEntity(s,['magnet','double','board','charge'][hash(s.seed+s.chunk)%4] as Pickup,d+280,150,30,30,true);
    addEntity(s,'star',d+650,120,26,26,true);return;
  }
  switch(name){
    case 'coinRoad':trail(s,d,28);addEntity(s,'shield',d+450,36);break;
    case 'magnetTrail':addEntity(s,'magnet',d,36);trail(s,d+160,80,13,true);break;
    case 'orbSpikes':addEntity(s,'orb',d+180,110,42,42);addEntity(s,'spike',d+330,0,115,34);trail(s,d+130,55,9,true);break;
    case 'slideTunnel':addEntity(s,'tunnel',d+240,90,180,54);trail(s,d+80,18,9);announce(s,'slideHint');break;
    case 'dashWall':addEntity(s,'charge',d,32);addEntity(s,'wall',d+300,100,72,100);trail(s,d+410,28);announce(s,'dashHint');break;
    case 'sawSlalom':addEntity(s,'saw',d+230,118,46,46);trail(s,d,26);addEntity(s,'star',d+220,192);break;
    case 'moonJump':addEntity(s,'lowGravity',d,36,42,80);addEntity(s,'spike',d+420,0,150,32);trail(s,d+130,70,11,true);break;
    case 'gravityRoad':addEntity(s,'gravity',d,38,42,80);trail(s,d+200,286,12,false,true);trail(s,d+720,50,6,false,true);break;
    case 'waveGates':addEntity(s,'wave',d,38,42,80);addEntity(s,'airGate',d+600,165,64,340,true);trail(s,d+160,165,12,false,true);break;
    case 'rocketRide':addEntity(s,'rocket',d,38,38,44);trail(s,d+180,150,18,true,true);addEntity(s,'star',d+560,240,26,26,true);break;
    case 'laserDance':addEntity(s,'laser',d+250,55,180,14);addEntity(s,'laser',d+700,55,150,14);trail(s,d,125,14,true);announce(s,'laserHint');break;
    case 'bossRush':s.boss={hp:3,life:780,shot:90};announce(s,'bossHint');addEntity(s,'charge',d,32);break;
    case 'skyRail':addEntity(s,'orb',d+40,80,42,42);addEntity(s,'rail',d+400,105,460,12);trail(s,d+220,140);trail(s,d+200,24);addEntity(s,'star',d+420,160);announce(s,'upperHint');break;
    case 'springChain':addEntity(s,'pad',d+150,0,64,12);trail(s,d+180,70,9,true);addEntity(s,'pad',d+650,0,64,12);addEntity(s,'star',d+860,150);break;
    case 'treasureRoad':addEntity(s,'double',d,34);addEntity(s,'board',d+240,34);trail(s,d+300,30,14,true);addEntity(s,'star',d+900,130);break;
    case 'boostRoad':addEntity(s,'sneakers',d,32);addEntity(s,'boost',d+190,0,80,10);trail(s,d+220,40,14,true);addEntity(s,'charge',d+950,32);break;
  }
}
export function beginArcade(s:ArcadeState,distance:number,flight:boolean,viewWidth=800) {
  s.frame++;s.clearAhead=false;s.changedVehicle=false;
  for(const key of ['comboTime','fever','magnet','double','sneakers','board','shield','lowGravity','boost','slide','noticeTime'] as const)if(s[key]>0)s[key]--;
  if(s.comboTime===0)s.combo=0;
  if(s.vehicleTime>0&&--s.vehicleTime===0){s.vehicle='normal';s.changedVehicle=true;announce(s,'landing');}
  s.entities=s.entities.filter(e=>!e.taken&&e.d-distance>-160&&e.d-distance<Math.max(3000,viewWidth+2200));
  const chunk=Math.floor((distance+Math.max(900,viewWidth+100))/1800);
  while(chunk>s.chunk){
    const next=++s.chunk;
    const index=next<16?next:hash(s.seed+next)%PATTERNS.length;
    spawnPattern(s,PATTERNS[index],next*1800+700,flight||routeAt(s.seed,next*1800+1400).flight);
  }
  if(s.boss){
    if(--s.boss.life<=0){s.boss=null;announce(s,'bossEscape');}
    else if(--s.boss.shot<=0){addEntity(s,'missile',distance+850,90+(hash(s.seed+s.frame)%3)*65,48,22,true);s.boss.shot=100;}
  }
  for(const e of s.entities)if(e.kind==='missile')e.d-=5;
}
export function activateOrb(s:ArcadeState,p:ArcadePlayer,distance:number) {
  const e=s.entities.find(e=>(e.kind==='orb'||e.kind==='pad')&&!e.taken&&Math.abs(e.d-distance-p.x)<(e.kind==='pad'?22:58)&&Math.abs(entityY(s,e)-(p.y-30))<95);
  if(!e)return false;
  e.taken=true;p.vy=-16.5;p.isJumping=true;p.isFalling=false;p.jumpCount=1;
  s.stats.perfects++;reward(s,100,12);announce(s,'perfect');return true;
}
export function dashArcade(s:ArcadeState,p:ArcadePlayer) {
  if(s.boss){s.boss.hp--;s.boss.life=Math.max(s.boss.life,180);p.dashCooldown=80;reward(s,100,10);announce(s,'bossHit');if(s.boss.hp<=0){s.boss=null;s.stats.bosses++;s.score+=1500;s.entities=s.entities.filter(e=>e.kind!=='missile');announce(s,'bossWin');}}
}
export function hitArcade(s:ArcadeState):boolean {
  if(s.fever>0)return true;
  s.combo=0;s.comboTime=0;s.energy=Math.max(0,s.energy-20);
  if(s.shield>0){s.shield=0;announce(s,'saved');return true;}
  if(s.board>0){s.board=0;announce(s,'boardBreak');return true;}
  if(s.vehicle==='rocket'){s.vehicle='normal';s.vehicleTime=0;s.changedVehicle=true;announce(s,'boardBreak');return true;}
  return false;
}
export function laserActive(s:ArcadeState,e:ArcadeEntity){return (s.frame-e.born)%150>=65&&(s.frame-e.born)%150<125;}
export function entityRects(s:ArcadeState,e:ArcadeEntity,distance:number) {
  const x=e.d-distance,y=entityY(s,e);
  if(e.kind==='airGate')return [{x:x-e.width/2,y:0,w:e.width,h:Math.max(0,y-96)},{x:x-e.width/2,y:y+96,w:e.width,h:Math.max(0,340-y-96)}];
  if(e.kind==='spike')return [{x:x-e.width/2+6,y:y-e.height+8,w:e.width-12,h:e.height-8}];
  return [{x:x-e.width/2,y,w:e.width,h:e.height}];
}
export function arcadePlatform(s:ArcadeState,p:ArcadePlayer,distance:number,previousY:number) {
  let top=Infinity;
  for(const e of s.entities)if(e.kind==='rail'&&Math.abs(e.d-distance-p.x)<e.width/2&&p.vy>=0){const y=entityY(s,e);if(previousY<=y+5&&p.y>=y)top=Math.min(top,y);}
  return top;
}
export function endArcade(s:ArcadeState,p:ArcadePlayer,distance:number) {
  let damage=false;
  const body={x:p.x-14,y:p.y-(s.slide>0&&!p.flying?26:64),w:28,h:s.slide>0&&!p.flying?20:56};
  const overlaps=(r:{x:number;y:number;w:number;h:number})=>body.x+body.w>r.x&&body.x<r.x+r.w&&body.y+body.h>r.y&&body.y<r.y+r.h;
  for(const e of s.entities){
    if(e.taken)continue;
    const x=e.d-distance,y=entityY(s,e),dx=x-p.x,dy=y-(p.y-30);
    if(!e.warned&&x<780&&x>300){
      const hint=e.kind==='tunnel'?'slideHint':e.kind==='wall'?'dashHint':e.kind==='laser'?'laserHint':e.kind==='rail'?'upperHint':'';
      if(hint){e.warned=true;announce(s,hint);}
    }
    if(isPickup(e.kind)){
      const floorItem=e.kind==='pad'||e.kind==='boost';
      const attracted=(e.kind==='coin'&&(s.magnet>0||s.fever>0)&&Math.hypot(dx,dy)<190);
      const collected=floorItem?Math.abs(dx)<e.width/2&&Math.abs(p.y-y)<20:Math.hypot(dx,dy)<(e.kind==='orb'?30:34);
      if(e.kind==='orb')continue;
      if(attracted){e.d+=(p.x+distance-e.d)*.22;e.lift+=(dy)*.22;}
      if(!collected)continue;
      e.taken=true;
      if(e.kind==='coin'){s.stats.coins++;reward(s,10,2);}
      else if(e.kind==='star'){s.stats.stars++;reward(s,250,18);announce(s,'star');}
      else if(e.kind==='pad'){p.vy=-17;p.isJumping=true;p.jumpCount=0;reward(s,40,6);announce(s,'bounce');}
      else if(e.kind==='boost'){s.boost=5*60;reward(s,40,6);announce(s,'boost');}
      else if(e.kind==='charge'){p.dashCooldown=0;announce(s,'charge');}
      else if(e.kind==='gravity'||e.kind==='wave'||e.kind==='rocket'){
        s.vehicle=e.kind;s.vehicleTime=540;s.gravity=1;s.changedVehicle=true;p.y=Math.min(p.y,floorAt(s.seed,distance+p.x)-30,275);p.vy=-4;p.isFalling=false;p.isJumping=true;p.jumpCount=0;announce(s,e.kind);
      }else {s[e.kind as 'magnet'|'shield'|'double'|'sneakers'|'board'|'lowGravity']=600;announce(s,e.kind);}
      continue;
    }
    if(e.kind==='rail')continue;
    if(e.kind==='laser'&&!laserActive(s,e))continue;
    const hit=entityRects(s,e,distance).some(overlaps);
    if(hit){
      if(e.kind==='wall'&&(p.dashFrames>0||s.fever>0)){e.taken=true;s.stats.breaks++;reward(s,120,12);announce(s,'smash');continue;}
      e.hit=true;
      if(p.invulFrame<=0){damage=true;p.invulFrame=1;}
    }
    if(!e.passed&&dx<-(e.width/2+24)){
      e.passed=true;
      if(!e.hit){s.stats.dodges++;reward(s,30,5);if(Math.abs(dy)<105){s.score+=50;announce(s,'nearMiss');}}
    }
  }
  checkMissions(s);
  return damage;
}
export const PROFILE_KEY='home-dash-arcade-v1';
export interface ArcadeProfile { coins:number; stars:number; bestCombo:number; dailyDay:string; dailyBest:number; runs:number }
export function loadArcadeProfile():ArcadeProfile {
  const base={coins:0,stars:0,bestCombo:0,dailyDay:'',dailyBest:0,runs:0};
  try{const v=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(v&&typeof v==='object')for(const key of ['coins','stars','bestCombo','dailyBest','runs'] as const)if(Number.isSafeInteger(v[key])&&v[key]>=0)base[key]=v[key];if(typeof v?.dailyDay==='string')base.dailyDay=v.dailyDay;}catch{}
  return base;
}
export function saveArcadeRun(s:ArcadeState,score:number) {
  if(s.runMode==='practice')return;
  const profile=loadArcadeProfile(),day=new Date().toISOString().slice(0,10);
  profile.coins+=s.stats.coins;profile.stars+=s.stats.stars;profile.bestCombo=Math.max(profile.bestCombo,s.bestCombo);profile.runs++;
  if(s.runMode==='daily'){profile.dailyBest=profile.dailyDay===day?Math.max(profile.dailyBest,score):score;profile.dailyDay=day;}
  try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{}
}
export function trailColor(profile:ArcadeProfile){return profile.stars>=5?'#f9a8d4':profile.coins>=100?'#83f3eb':'#ffc76a';}
