import type { Adventurer, World } from './engine';
import { fluidAt } from './placedFluids';
import { sandboxAllows } from './sandboxAccess';
import { cavernStructure } from './subsurface';
import { occupiedByBoat } from './transport';
import { blockAt, bodyClear, floorAt, MIN_DEPTH, playerHeight, protectedVoxel, solid, voxelKey, voxelWater, type TerrainBlock } from './voxel';

export type BuildingDetails={gravity?:Record<string,true>;signs?:Record<string,string>};
export type BuildingAction={type:'voxel-climb';direction:-1|1}|
  {type:'voxel-sign';x:number;y:number;z:number;text:string};

const gravityBlocks=new Set(['sand','gravel','concrete_powder']);
const thinDecor=new Set(['ladder','hanging_rope','scaffold','carpet','signboard','hanging_sign','display_frame','field_banner',
  'chain','flowerpot','garden_bed','candle','bronze_bell','glowcap']);
const climbs=new Set(['ladder','hanging_rope','scaffold']);
export const openDecoration=(block:unknown)=>typeof block==='string'&&thinDecor.has(block);
export const isClimbingBlock=(block:unknown)=>typeof block==='string'&&climbs.has(block);
export const isSign=(block:unknown)=>block==='signboard'||block==='hanging_sign';

export function recordBuildingEdit(w:World,key:string,after:TerrainBlock|null) {
  const voxels=w.voxels;
  if (!voxels) return;
  const before=voxels.details;
  if (before?.signs&&!isSign(after)) delete before.signs[key];
  if (before?.gravity&&(!after||!gravityBlocks.has(after))) delete before.gravity[key];
  if (w.buildingPhysics&&after&&gravityBlocks.has(after)&&voxels.placedBy?.[key]) {
    const details=voxels.details??={};
    const active=details.gravity??={};
    active[key]=true;
  }
}

const last=new WeakMap<World,{time:number;revision:number;water:unknown}>();
export function advanceBuildPhysics(w:World,now:number) {
  const voxels=w.voxels, falling=voxels?.details?.gravity;
  const checked=last.get(w), water=voxels?.fluids?.cells;
  if (!w.started || w.ended || !voxels || !falling || now-(checked?.time ?? 0)<240 ||
    checked?.revision===voxels.revision&&checked.water===water) return;
  let changes=0, recheck=false;
  const supported=Object.values(w.players).filter(p=>!p.spectator&&!p.life?.indoors).map(p=>{
    const pos=p.position3D,feet=playerHeight(w,p);
    return {x:Math.floor(pos?.x ?? p.x),z:Math.floor(pos?.z ?? p.y),feet};
  });
  const keys=Object.keys(falling).map(key=>({key,point:key.split(',').map(Number)})).sort((a,b)=>a.point[1]-b.point[1]);
  for (const {key,point:[x,y,z]} of keys) {
    const id=voxels.placedBy?.[key], block=voxels.edits[key];
    if (!id || !block || !gravityBlocks.has(block)) {delete falling[key];changes++;continue;}
    if (block==='concrete_powder'&&[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].some(([dx,dy,dz])=>{
      const cond=fluidAt(w,x+dx,y+dy,z+dz);
      const adjacent=voxelWater(w,x+dx,z+dz,y+dy);
      return cond?.kind==='water'||!!adjacent&&adjacent.surface>=y+dy&&adjacent.surface-adjacent.depth<=y+dy;
    })) {
      voxels.edits[key]='whiteconcrete';
      delete falling[key];
      changes++;
      continue;
    }
    const dest={x,y:y-1,z}, next=voxelKey(x,y-1,z);
    if (y-1<=MIN_DEPTH || blockAt(w,x,y-1,z) || voxels.fluids?.sources[next] || protectedVoxel(w,x,z) ||
      cavernStructure(w,x,y-1,z)||!sandboxAllows(w,id,dest,'build')) continue;
    if (occupiedByBoat(w,x,y-1,z)||supported.some(p=>p.x===x&&p.z===z&&p.feet<y&&p.feet+1.78>y-1)) {
      recheck=true;
      continue;
    }
    voxels.edits[next]=block;
    voxels.edits[key]=null;
    voxels.placedBy![next]=id;
    delete voxels.placedBy![key];
    if (voxels.rotations) delete voxels.rotations[key];
    falling[next]=true;
    delete falling[key];
    if (++changes>=64) break;
  }
  last.set(w,{time:now,revision:recheck?-1:voxels.revision,water});
  if(changes){voxels.revision++;w.revision++;}
}

export function climbTarget(w:World,p:Adventurer,direction:-1|1) {
  const feet=playerHeight(w,p), y=feet+direction;
  const pos=p.position3D, x=Math.floor(pos?.x??p.x),z=Math.floor(pos?.z??p.y);
  if (pos?.vy || feet!==Math.floor(feet)) return null;
  for (const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
    const tx=x+dx,tz=z+dz;
    if (!isClimbingBlock(blockAt(w,tx,feet,tz))&&!isClimbingBlock(blockAt(w,tx,y,tz))) continue;
    if (bodyClear(w,tx,tz,Math.min(feet,y),Math.max(feet,y)+1.78) && (isClimbingBlock(blockAt(w,tx,y,tz))||
      isClimbingBlock(blockAt(w,tx,y-1,tz))||floorAt(w,tx,tz,y+.01)===y)) return {x:tx+.5,y,z:tz+.5};
  }
  return null;
}

export function applyBuildingAction(w:World,p:Adventurer,action:BuildingAction,now:number) {
  if(w.gameMode!=='COOP'||!w.started||w.ended||p.spectator)return false;
  if(action.type==='voxel-climb') {
    if ((action.direction!==1&&action.direction!==-1)||now-p.lastMove<200) return false;
    const next=climbTarget(w,p,action.direction);
    if(!next)return false;
    const surface=p.position3D?.surface2D??true;
    p.position3D={...next,surface2D:surface,layered2D:surface,oxygen:p.position3D?.oxygen};
    p.x=Math.floor(next.x);p.y=Math.floor(next.z);p.lastMove=now;p.moveCount++;
  } else {
    const {x,y,z}=action, voxels=w.voxels;
    if(!voxels||![x,y,z].every(Number.isSafeInteger)||typeof action.text!=='string'||action.text.length>48||/[\u0000-\u001f\u007f]/.test(action.text))return false;
    const pos=p.position3D;
    if(Math.hypot(x+.5-(pos?.x??p.x+.5),y-playerHeight(w,p),z+.5-(pos?.z??p.y+.5))>3.6)return false;
    const key=voxelKey(x,y,z);
    if(voxels.placedBy?.[key]!==p.id||!isSign(voxels.edits[key])||!sandboxAllows(w,p.id,{x,y,z},'device'))return false;
    const details=voxels.details??={},signs=details.signs??={};
    if(action.text.trim())signs[key]=action.text.trim();
    else delete signs[key];
  }
  w.revision++;
  return true;
}

export function terrainMoveFactor(type:TerrainBlock|null) {
  return type==='honey_floor'?.63:type==='packed_ice'?1.29:1;
}

export function terrainJumpFactor(type:TerrainBlock|null) {
  return type==='rebound_floor'?1.55:type==='slime_floor'?1.3:type==='honey_floor'?.75:1;
}

export const buildingSupport=(block:TerrainBlock|null)=>solid(block)||isClimbingBlock(block);
