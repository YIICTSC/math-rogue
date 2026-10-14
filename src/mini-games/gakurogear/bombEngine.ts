import {playerSeats} from './onlineRules';
import type { OnlineWorld, Participant, VrInput } from './onlineEngine';
import { createRun, MISSIONS } from './engine';
export const BOMB_MAPS = [
  { name:'放課後の中庭', en:'After-school courtyard', color:0x72b692, density:.48 },
  { name:'図書室ラビリンス', en:'Library labyrinth', color:0x997bb5, density:.64 },
  { name:'体育館クロスロード', en:'Gym crossroads', color:0xdaaa68, density:.36 },
] as const;
export const CELL = 1.8, MAX_BOMB_STOCK = 12;
export type BombUpgrade = 'flame'|'remote'|'kick'|'speed'|'capacity';
export type BombLoadout = { stock:number; range:number; capacity:number; speed:number; remote:boolean; kick:boolean };
export type ArenaBomb = { id:number; owner:string; x:number; z:number; range:number; fuse:number; remote:boolean; pass:string[]; dx:number; dz:number; move:number };
export type BombArena = { map:number; side:number; cells:number[]; drops:{id:number;x:number;z:number;kind:BombUpgrade}[]; bombs:ArenaBomb[]; flames:{x:number;z:number;until:number;owner:string}[]; serial:number };
export const newBombLoadout = ():BombLoadout => ({stock:3,range:2,capacity:2,speed:3,remote:false,kick:false});
export const cellPoint = (a:BombArena,x:number,z:number) => ({x:(x-(a.side-1)/2)*CELL,z:(z-(a.side-1)/2)*CELL});
export const pointCell = (a:BombArena,p:{x:number;z:number}) => ({x:Math.round(p.x/CELL+(a.side-1)/2),z:Math.round(p.z/CELL+(a.side-1)/2)});
export function makeBombArena(w:OnlineWorld) {
  const ids=playerSeats(w).map(p=>p.id),side=Math.max(17,Math.ceil(Math.sqrt(ids.length))*4+1)|1;
  let n=w.seed>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const map=w.bombMap,positions:{x:number;z:number}[]=[];
  for(let z=1;z<side-1;z+=4)for(let x=1;x<side-1;x+=4)positions.push({x,z});
  for(let i=positions.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
  const spawn=positions.slice(0,ids.length),reserved=new Set(spawn.flatMap(p=>[[p.x,p.z],[p.x+1,p.z],[p.x,p.z+1]].map(([x,z])=>z*side+x)));
  const cells=Array.from({length:side*side},(_,i)=>{
    const x=i%side,z=Math.floor(i/side),mid=(side-1)/2;
    if(!x||!z||x===side-1||z===side-1)return 1;
    if(reserved.has(i))return 0;
    const plaza=map===0&&Math.hypot(x-mid,z-mid)<3.5,cross=map===2&&(x===mid||z===mid);
    if(((x%2===0&&z%2===0)||(map===1&&z%4===0&&x%4!==1))&&!plaza&&!cross)return 1;
    if(cross)return 0;
    return rand()<(plaza ? .15 : BOMB_MAPS[map].density)?2:0;
  });
  const a:BombArena={map,side,cells,drops:[],bombs:[],flames:[],serial:0};w.bombArena=a;
  w.mission={...structuredClone(MISSIONS[0]),size:side*CELL/2,obstacles:[],routes:[],cameras:[],targets:[],switches:[],sensors:[],terrain:[],requiredHolds:0,requiredShots:0,exit:{x:999,z:999},limit:w.limit};
  ids.forEach((id,i)=>{const p=w.players[id];p.run=createRun(w.mission);p.run.player={...cellPoint(a,spawn[i].x,spawn[i].z),angle:0};p.bomb=newBombLoadout();p.hits=0;p.out=false;p.invulnerable=2;});
}
function solid(a:BombArena,x:number,z:number){return x<0||z<0||x>=a.side||z>=a.side||a.cells[z*a.side+x]!==0;}
export function placeBomb(w:OnlineWorld,p:Participant){if(p.spectator)return false;const a=w.bombArena;if(!a||p.out||p.quiz||!p.bomb.stock||a.bombs.filter(b=>b.owner===p.id).length>=p.bomb.capacity)return false;const c=pointCell(a,p.run.player);if(solid(a,c.x,c.z)||a.bombs.some(b=>b.x===c.x&&b.z===c.z))return false;
  a.bombs.push({id:++a.serial,owner:p.id,...c,range:p.bomb.range,fuse:p.bomb.remote?20:2.5,remote:p.bomb.remote,pass:playerSeats(w).filter(q=>{const v=pointCell(a,q.run.player);return v.x===c.x&&v.z===c.z;}).map(q=>q.id),dx:0,dz:0,move:0});p.bomb.stock--;return true;
}
function explode(w:OnlineWorld,b:ArenaBomb){const a=w.bombArena!;a.bombs=a.bombs.filter(q=>q!==b);const tiles=[{x:b.x,z:b.z}];for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]])for(let i=1;i<=b.range;i++){const x=b.x+dx*i,z=b.z+dz*i;if(x<0||z<0||x>=a.side||z>=a.side||a.cells[z*a.side+x]===1)break;tiles.push({x,z});if(a.cells[z*a.side+x]===2){a.cells[z*a.side+x]=0;const kinds:BombUpgrade[]=['flame','remote','kick','speed','capacity'];a.drops.push({id:++a.serial,x,z,kind:kinds[((x*7+z*13+w.seed)>>>0)%5]});break;}}
  for(const tile of tiles){a.flames.push({...tile,until:w.time+.65,owner:b.owner});for(const other of a.bombs)if(other.x===tile.x&&other.z===tile.z)other.fuse=0;}
}
export function tickBombArena(w:OnlineWorld,controls:Record<string,VrInput>,dt:number){const a=w.bombArena!;
  for(const p of playerSeats(w)){p.invulnerable=Math.max(0,p.invulnerable-dt);if(!p.connected||p.out||p.quiz)continue;const input=controls[p.id];if(!input)continue;const speed=p.bomb.speed*dt,n=Math.max(1,Math.hypot(input.x,input.z));
    for(const [dx,dz]of[[input.x/n*speed,0],[0,input.z/n*speed]]){const next={x:p.run.player.x+dx,z:p.run.player.z+dz},corners=[[-.27,-.27],[-.27,.27],[.27,-.27],[.27,.27]].map(([x,z])=>pointCell(a,{x:next.x+x,z:next.z+z}));if(corners.some(c=>solid(a,c.x,c.z)))continue;
      const hit=a.bombs.find(b=>!b.pass.includes(p.id)&&corners.some(c=>c.x===b.x&&c.z===b.z));if(hit){if(p.bomb.kick){const kx=Math.sign(dx),kz=Math.sign(dz);if(!solid(a,hit.x+kx,hit.z+kz)&&!a.bombs.some(b=>b!==hit&&b.x===hit.x+kx&&b.z===hit.z+kz)){hit.dx=kx;hit.dz=kz;}}continue;}Object.assign(p.run.player,next);if(dx||dz)p.run.player.angle=Math.atan2(dx,dz);
    }
    if(input.bomb)placeBomb(w,p);if(input.remote)for(const b of a.bombs)if(b.owner===p.id&&b.remote)b.fuse=0;
    const c=pointCell(a,p.run.player);for(const drop of [...a.drops])if(drop.x===c.x&&drop.z===c.z){if(drop.kind==='flame')p.bomb.range=Math.min(8,p.bomb.range+1);if(drop.kind==='capacity')p.bomb.capacity=Math.min(6,p.bomb.capacity+1);if(drop.kind==='speed')p.bomb.speed=Math.min(6,p.bomb.speed+.5);if(drop.kind==='remote')p.bomb.remote=true;if(drop.kind==='kick')p.bomb.kick=true;a.drops=a.drops.filter(d=>d!==drop);}
  }
  for(const b of a.bombs){b.pass=b.pass.filter(id=>{const p=w.players[id];if(!p)return false;const c=cellPoint(a,b.x,b.z);return Math.abs(p.run.player.x-c.x)<CELL/2+.3&&Math.abs(p.run.player.z-c.z)<CELL/2+.3;});b.fuse-=dt;if(b.dx||b.dz){b.move+=dt;if(b.move>=.12){b.move=0;const x=b.x+b.dx,z=b.z+b.dz;if(solid(a,x,z)||a.bombs.some(q=>q!==b&&q.x===x&&q.z===z)||playerSeats(w).some(p=>!p.out&&p.connected&&pointCell(a,p.run.player).x===x&&pointCell(a,p.run.player).z===z)){b.dx=b.dz=0;}else{b.x=x;b.z=z;}}}}
  for(let n=0;n<240;n++){const b=a.bombs.find(b=>b.fuse<=0);if(!b)break;explode(w,b);}a.flames=a.flames.filter(f=>f.until>w.time);
  for(const p of playerSeats(w)){if(!p.connected||p.out||p.invulnerable>0)continue;const c=pointCell(a,p.run.player),f=a.flames.find(f=>f.x===c.x&&f.z===c.z);if(f){p.hits++;p.invulnerable=1;if(w.players[f.owner]&&f.owner!==p.id)w.players[f.owner].stats.hits++;if(p.hits>=3){p.out=true;p.quiz=false;p.run.status='caught';}}}
}
