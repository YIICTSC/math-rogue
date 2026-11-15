import type {UpgradeStats} from './upgrades';
export const AIR_ENEMIES=[
 {id:'chalk-drone',name:['チョークドローン','Chalk drone','チョークドローン'],hp:3,width:70,height:50,score:90,speed:1.05},
 {id:'paper-wyvern',name:['紙装甲ワイバーン','Paper wyvern','かみそうこうワイバーン'],hp:4,width:86,height:60,score:110,speed:1.15},
 {id:'clock-ghost',name:['目覚ましゴースト','Alarm ghost','めざましゴースト'],hp:4,width:68,height:68,score:100,speed:.85},
 {id:'firefly',name:['蛍の斥候','Firefly scout','ほたるのせっこう'],hp:2,width:58,height:45,score:80,speed:1.3},
 {id:'beetle',name:['甲虫パトロール','Beetle patrol','こうちゅうパトロール'],hp:6,width:82,height:58,score:140,speed:.8},
 {id:'saw-fish',name:['ノコギリ飛魚','Saw-wing fish','ノコギリとびうお'],hp:4,width:90,height:62,score:120,speed:1.2},
 {id:'pencil-fighter',name:['鉛筆ファイター','Pencil fighter','えんぴつファイター'],hp:3,width:86,height:48,score:100,speed:1.35},
 {id:'jellybot',name:['浮遊クラゲボット','Jellybot','ふゆうクラゲボット'],hp:5,width:72,height:70,score:120,speed:.75},
 {id:'owl-bomber',name:['機巧フクロウ','Clockwork owl','きこうフクロウ'],hp:6,width:86,height:68,score:160,speed:.9},
 {id:'book-mimic',name:['飛行教科書ミミック','Textbook mimic','ひこうきょうかしょミミック'],hp:5,width:84,height:62,score:140,speed:1},
 {id:'manta',name:['蒼翼マンタ','Stealth manta','そうよくマンタ'],hp:4,width:100,height:54,score:130,speed:1.4},
 {id:'sky-train',name:['空路機関車','Sky locomotive','くうろきかんしゃ'],hp:7,width:106,height:68,score:180,speed:.8},
 {id:'flagship',name:['紅蓮の飛行船','Crimson flagship','ぐれんのひこうせん'],hp:12,width:210,height:120,score:1500,speed:1},
 {id:'sky-dragon',name:['黄金機竜','Golden sky dragon','おうごんきりゅう'],hp:16,width:210,height:135,score:1800,speed:1.2},
 {id:'ufo',name:['星核UFO','Starcore UFO','せいかくユーフォー'],hp:14,width:190,height:120,score:1700,speed:1.05},
 {id:'fortress',name:['天空時計城','Sky clock fortress','てんくうとけいじょう'],hp:20,width:220,height:145,score:2200,speed:.85},
] as const;
export type AirKind=typeof AIR_ENEMIES[number]['id'];
export const airEnemy=(kind?:string)=>AIR_ENEMIES.find(e=>e.id===kind)||AIR_ENEMIES[0];
export interface AirBoss {hp:number;life:number;shot:number;kind?:AirKind;maxHp?:number;born?:number;hitFlash?:number;}
export interface AirObstacle {id:string;type:string;x:number;y:number;width:number;height:number;airKind?:AirKind;hp?:number;maxHp?:number;hitFlash?:number;}
export interface AirProjectile {id:string;x:number;y:number;vx:number;vy:number;isHoming?:boolean;isPierce?:boolean;isLarge?:boolean;radius?:number;damage?:number;airWeapon?:'rocket'|'homing'|'drone'|'laser'|'thunder'|'net'|'blade'|'firework';life?:number;previousX?:number;previousY?:number;hitTargets?:string[];splash?:number;}
export interface CombatFx {id:number;kind:AirKind|'impact';x:number;y:number;vx:number;vy:number;age:number;life:number;width:number;height:number;rotation:number;boss:boolean;}
export interface CombatWorld {frame:number;boss:AirBoss|null;combatWidth?:number;combatFx?:CombatFx[];stats:{bosses:number;breaks:number};score:number;}
export const bossBounds=(s:Pick<CombatWorld,'frame'|'boss'|'combatWidth'>)=>{const def=airEnemy(s.boss?.kind||'flagship'),phase=(s.frame-(s.boss?.born||0))*.025;return {x:Math.max(280,Math.min(610,(s.combatWidth||800)-115))+Math.sin(phase*.6)*12,y:113+Math.sin(phase)*18,width:def.width,height:def.height};};
export function spawnAirBoss(s:Pick<CombatWorld,'frame'|'boss'>,variant:number){const def=AIR_ENEMIES[12+((variant%4)+4)%4];s.boss={hp:def.hp,maxHp:def.hp,life:1200,shot:100,kind:def.id,born:s.frame,hitFlash:0};}
export function queueCombatFx(s:Pick<CombatWorld,'frame'|'combatFx'>,kind:CombatFx['kind'],x:number,y:number,width=80,height=60,boss=false){s.combatFx??=[];s.combatFx.push({id:s.frame*100+s.combatFx.length,kind,x,y,width,height,boss,age:0,life:kind==='impact'?28:boss?120:85,vx:kind==='impact'?0:-.65,vy:kind==='impact'?0:.8,rotation:0});while(s.combatFx.length>18){const impact=s.combatFx.findIndex(f=>f.kind==='impact');const small=s.combatFx.findIndex(f=>!f.boss);s.combatFx.splice(impact>=0?impact:small>=0?small:0,1);}}
export function advanceCombatFx(s:Pick<CombatWorld,'frame'|'boss'|'combatFx'>){if(s.boss?.hitFlash)s.boss.hitFlash--;s.combatFx=(s.combatFx||[]).filter(f=>++f.age<f.life);for(const f of s.combatFx){if(f.kind==='impact')continue;f.x+=f.vx;f.y+=f.vy;f.vy+=.1;f.rotation-=f.boss?.018:.035;}}
export function downAirEnemy(s:CombatWorld,obs:AirObstacle){if(!obs.airKind||(obs.hp??1)<=0)return false;obs.hp=0;const def=airEnemy(obs.airKind);queueCombatFx(s,def.id,obs.x,obs.y,obs.width,obs.height);s.stats.breaks++;s.score+=def.score;return true;}
export function damageAirBoss(s:CombatWorld,damage:number){const boss=s.boss;if(!boss||boss.hp<=0)return false;boss.hp=Math.max(0,boss.hp-Math.max(0,damage));boss.hitFlash=8;const rect=bossBounds(s);if(boss.hp>0){queueCombatFx(s,'impact',rect.x,rect.y,60,60);return false;}const def=airEnemy(boss.kind||'flagship');queueCombatFx(s,def.id,rect.x,rect.y,rect.width,rect.height,true);s.stats.bosses++;s.score+=def.score;s.boss=null;return true;}
interface AirTarget {id:string;x:number;y:number;width:number;height:number;obstacle:AirObstacle|null;}
export function airTargets(s:CombatWorld,obstacles:readonly AirObstacle[]):AirTarget[]{const targets:AirTarget[]=obstacles.filter(o=>o.airKind&&(o.hp??1)>0).map(o=>({id:o.id,x:o.x,y:o.y,width:o.width,height:o.height,obstacle:o}));if(s.boss&&s.boss.hp>0)targets.push({id:'air-boss-'+(s.boss.born||0),...bossBounds(s),obstacle:null});return targets;}
export function nearestAirTarget(s:CombatWorld,obstacles:readonly AirObstacle[],x:number,y:number){return airTargets(s,obstacles).filter(t=>t.x>x-80).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];}
export function emitAirWeapons(s:CombatWorld,p:{x:number;y:number},stats:UpgradeStats,obstacles:readonly AirObstacle[]):AirProjectile[]{
 const targets=airTargets(s,obstacles).filter(t=>t.x>p.x-40&&t.x<(s.combatWidth||800)+120),target=nearestAirTarget(s,obstacles,p.x,p.y-32),shots:AirProjectile[]=[];if(!target)return shots;
 const emit=(weapon:NonNullable<AirProjectile['airWeapon']>,damage:number,vx:number,vy:number,x=p.x+16,y=p.y-34,extras:Partial<AirProjectile>={})=>shots.push({id:`air-${s.frame}-${shots.length}`,x,y,vx,vy,damage:damage*stats.airDamage,airWeapon:weapon,life:160,radius:weapon==='laser'?8:10,...extras});
 const directed=(speed:number)=>{const dx=target.x-p.x,dy=target.y-(p.y-34),length=Math.hypot(dx,dy)||1;return {x:dx/length*speed,y:dy/length*speed};};
 for(let index=0;index<8;index++){const level=stats.antiAir[index];if(!level)continue;const interval=Math.max(30,[105,135,115,155,330,190,160,230][index]-level*[12,13,11,13,30,16,14,20][index]);if(s.frame%interval!==0)continue;const aim=directed(index===3?22:11);
  if(index===0)emit('rocket',level+2,aim.x,aim.y);
  if(index===1)emit('homing',level+1,aim.x,aim.y,p.x+12,p.y-48,{isHoming:true});
  if(index===2)emit('drone',level+1,aim.x,aim.y,p.x-18,p.y-78,{isHoming:true});
  if(index===3)emit('laser',level+2,aim.x,aim.y,p.x+8,p.y-40,{isPierce:true});
  if(index===4)for(const t of targets)emit('thunder',level+1,0,0,t.x,t.y,{life:1,radius:18});
  if(index===5)emit('net',level,aim.x*.7,aim.y*.7,p.x+15,p.y-36,{isHoming:true,isPierce:true});
  if(index===6)emit('blade',level+1,aim.x,aim.y,p.x+8,p.y-40,{isPierce:true,isHoming:true});
  if(index===7)for(const spread of [-.18,0,.18]){const angle=Math.atan2(aim.y,aim.x)+spread;emit('firework',level+1,Math.cos(angle)*10,Math.sin(angle)*10,p.x+12,p.y-36,{splash:45+level*9});}
 }
 return shots;
}
/** Swept circle against a target box, so fast lasers cannot tunnel through a foe. */
export function airShotHits(pr:AirProjectile,target:{x:number;y:number;width:number;height:number}){
 const r=pr.radius||7,left=target.x-target.width*.42-r,right=target.x+target.width*.42+r,top=target.y-target.height*.42-r,bottom=target.y+target.height*.42+r;
 const x0=pr.previousX??pr.x,y0=pr.previousY??pr.y,dx=pr.x-x0,dy=pr.y-y0;let enter=0,exit=1;
 for(const [start,d,min,max]of [[x0,dx,left,right],[y0,dy,top,bottom]]){if(Math.abs(d)<1e-9){if(start<min||start>max)return false;}else{const a=(min-start)/d,b=(max-start)/d;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));if(enter>exit)return false;}}
 return true;
}
export function resolveAirHits(s:CombatWorld,obstacles:AirObstacle[],projectiles:AirProjectile[],stats:UpgradeStats){
 let hits=0,downs=0,bossDown=false;const consumed=new Set<AirProjectile>();
 const strike=(target:ReturnType<typeof airTargets>[number],damage:number)=>{hits++;if(target.obstacle){const obs=target.obstacle;if((obs.hp??0)<=0)return;obs.hp=Math.max(0,(obs.hp??1)-damage);obs.hitFlash=8;queueCombatFx(s,'impact',target.x,target.y,48,48);if(obs.hp<=0){obs.hp=1;if(downAirEnemy(s,obs))downs++;}}else if(damageAirBoss(s,damage)){bossDown=true;downs++;}};
 for(const pr of projectiles){for(const target of airTargets(s,obstacles)){
  if(pr.hitTargets?.includes(target.id)||!airShotHits(pr,target))continue;
  const dice=(s.frame*37+pr.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0))%100;const damage=Math.max(1,(pr.damage||stats.damage)*(dice<stats.critChance*100?2:1));strike(target,damage);pr.hitTargets??=[];pr.hitTargets.push(target.id);
  if(pr.splash){queueCombatFx(s,'impact',pr.x,pr.y,pr.splash*2,pr.splash*2);for(const other of airTargets(s,obstacles))if(other.id!==target.id&&!pr.hitTargets.includes(other.id)&&Math.hypot(other.x-pr.x,other.y-pr.y)<pr.splash+other.width*.3){strike(other,damage*.7);pr.hitTargets.push(other.id);}}
  if(!pr.isPierce){consumed.add(pr);break;}
 }}
 return {projectiles:projectiles.filter(p=>!consumed.has(p)),hits,downs,bossDown};
}
