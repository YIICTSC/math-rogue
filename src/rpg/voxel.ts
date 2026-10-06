import {WIDTH,HEIGHT,type World,type Adventurer} from './engine';
import {natureAt,lifePlayer,lifeWalkable,type Material} from './life';
import {energyOf} from './energy';
import {occupiedFarmTile} from './farm/model';
import {occupiedCityTile} from './city/model';
export const BLOCKS = ['wood','stone','plank','brick','frostwood','ore','crystal'] as const;
export type Block = typeof BLOCKS[number];
export interface VoxelWorld {edits:Record<string,Block|null>;revision:number}
export type VoxelAction={type:'voxel-move';dx:number;dy:number}|{type:'voxel-snap'}|{type:'voxel-break'|'voxel-place';x:number;y:number;z:number;block?:Block};
export const voxelKey=(x:number,y:number,z:number)=>`${x},${y},${z}`;
export function protectedVoxel(w:World,x:number,z:number){return x<1||z<1||x>=WIDTH-1||z>=HEIGHT-1||occupiedFarmTile(w,z*WIDTH+x)||occupiedCityTile(w,z*WIDTH+x)||w.sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-z)<=1)||w.life.houses.some(h=>Math.abs(h.x-x)+Math.abs(h.y-z)<=1);}
export function blockAt(w:World,x:number,y:number,z:number):Block|null {
 const key=voxelKey(x,y,z);if(w.voxels&&Object.hasOwn(w.voxels.edits,key))return w.voxels.edits[key];
 if(y<0||y>2||protectedVoxel(w,x,z))return null;
 const node=natureAt(w,z*WIDTH+x);if(!node||w.life.nodes[z*WIDTH+x]?.regrowAt)return null;
 if(y>=(node.rock?1:3))return null;
 return BLOCKS.includes(node.material as Block)?node.material as Block:node.rock?'stone':'wood';
}
export function voxelWalkable(w:World,x:number,z:number){const tx=Math.floor(x),tz=Math.floor(z);if(tx<1||tz<1||tx>=WIDTH-1||tz>=HEIGHT-1||w.tiles[tz*WIDTH+tx]==='water')return false;return !blockAt(w,tx,0,tz)&&!blockAt(w,tx,1,tz)&&lifeWalkable(w,tx,tz);}
export function applyVoxel(w:World,p:Adventurer,a:VoxelAction,now:number){
 if(a.type==='voxel-snap'){delete p.position3D;w.revision++;return true;}
 if(a.type==='voxel-move'){
  if(!Number.isFinite(a.dx)||!Number.isFinite(a.dy)||Math.hypot(a.dx,a.dy)>.45||now-p.lastMove<45)return false;
  const pos=p.position3D??{x:p.x+.5,z:p.y+.5};let {x,z}=pos;
  const travel=Math.min(.4,Math.max(0,(now-p.lastMove)/1000)*3.2),length=Math.hypot(a.dx,a.dy);if(!length)return false;
  const dx=a.dx*Math.min(1,travel/length),dz=a.dy*Math.min(1,travel/length);
  const fits=(nx:number,nz:number)=>[-.18,.18].every(ox=>[-.18,.18].every(oz=>voxelWalkable(w,nx+ox,nz+oz)));
  if(fits(x+dx,z))x+=dx;if(fits(x,z+dz))z+=dz;
  p.position3D={x,z};p.x=Math.floor(x);p.y=Math.floor(z);p.lastMove=now;p.moveCount++;w.revision++;return true;
 }
 const {x,y,z}=a;if(![x,y,z].every(Number.isInteger)||y<0||y>7||protectedVoxel(w,x,z)||now-(p.voxelAt||0)<220)return false;
 const pos=p.position3D??{x:p.x+.5,z:p.y+.5};if(Math.hypot(x+.5-pos.x,y+.5-1.05,z+.5-pos.z)>4.5)return false;
 const lp=lifePlayer(p),existing=blockAt(w,x,y,z);const state=w.voxels??={edits:{},revision:0};
 if(Object.keys(state.edits).length>=6000&&!Object.hasOwn(state.edits,voxelKey(x,y,z)))return false;
 if(a.type==='voxel-break'){
  if(!existing)return false;if(energyOf(lp)<1){p.message='エネルギーが足りません。問題に正解して回復しましょう。';w.revision++;return true;}lp.energy=energyOf(lp)-1;lp.bag[existing as Material]=(lp.bag[existing as Material]||0)+1;state.edits[voxelKey(x,y,z)]=null;
  const tile=z*WIDTH+x;if(![0,1,2].some(h=>blockAt(w,x,h,z))&&natureAt(w,tile))w.life.nodes[tile]={hits:0,regrowAt:Number.MAX_SAFE_INTEGER};
 }else{
  if(existing||!a.block||!BLOCKS.includes(a.block)||(lp.bag[a.block]||0)<1||w.tiles[z*WIDTH+x]==='water')return false;
  if(y>0&&![[x,y-1,z],[x-1,y,z],[x+1,y,z],[x,y,z-1],[x,y,z+1]].some(([bx,by,bz])=>blockAt(w,bx,by,bz)))return false;
  if(y<2&&Object.values(w.players).some(q=>Math.floor(q.position3D?.x??q.x+.5)===x&&Math.floor(q.position3D?.z??q.y+.5)===z))return false;
  lp.bag[a.block]=(lp.bag[a.block]||0)-1;state.edits[voxelKey(x,y,z)]=a.block;
 }
 p.message=a.type==='voxel-break'?'ブロックから素材を獲得しました。':'ブロックを設置しました。';p.voxelAt=now;state.revision++;w.revision++;return true;
}
