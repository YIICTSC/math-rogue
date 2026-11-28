import type { Adventurer, World } from './engine';
import { GATHER_ENERGY_MAX } from './energy';
import { lifePlayer } from './life';
import { ridingCart } from './machinery';
import { traveling } from './transport';
import { bodyClear, floorAt, MAX_HEIGHT, MIN_DEPTH, playerHeight, voxelWater } from './voxel';
import { ALL_MATERIAL_NAMES, type VoxelItem } from './voxelCatalog';
import { inRealm } from './realmTerrain';
import { landscapeRegion, legacyRegion, WORLD_SCALE } from './worldLandscape';

export type RpgStartIntent='solo'|'online'|'join'|'creative';
export type CreativeAction={type:'voxel-creative-flight'};
const materials=Object.keys(ALL_MATERIAL_NAMES) as VoxelItem[];
const availableStock=512;

export function fillCreativeStock(p:Adventurer) {
  const lp=lifePlayer(p);
  for(const item of materials)if((lp.bag[item]??0)<availableStock)lp.bag[item]=availableStock;
  lp.energy=GATHER_ENERGY_MAX;
}

export function openCreativeWorld(w:World,p:Adventurer) {
  w.creative=true;
  w.sites=w.sites.filter(site=>site.kind==='town');
  w.activities.event.finished=true;
  fillCreativeStock(p);
}

export function toggleCreativeFlight(w:World,p:Adventurer) {
  if(!w.creative||!w.started||w.ended||p.spectator||p.life?.indoors||traveling(w,p)||ridingCart(w,p.id))return false;
  const current=p.position3D;
  const x=current?.x??p.x+.5,z=current?.z??p.y+.5,y=playerHeight(w,p);
  if(p.creativeFlight){
    const tx=Math.floor(x),tz=Math.floor(z);
    const floor=floorAt(w,tx,tz,y+.03),pool=voxelWater(w,tx,tz,y);
    const landing=pool&&pool.surface<y&&(floor===null||pool.surface>floor)?pool.surface-1.3:floor;
    if(landing===null||!bodyClear(w,tx,tz,landing))return false;
    delete p.creativeFlight;
    p.position3D={x,y:landing,z,surface2D:true,layered2D:true};
  } else {
    if(!bodyClear(w,Math.floor(x),Math.floor(z),y))return false;
    p.creativeFlight=true;
    p.position3D={x,y,z,surface2D:current?.surface2D??true,layered2D:true};
  }
  w.revision++;
  return true;
}

export function steerCreativeFlight(w:World,p:Adventurer,dx:number,dy:number,dz:number,step2D:boolean,now:number) {
  const pos=p.position3D;
  const displacement=Math.hypot(dx,dy,dz);
  const cooldown=dy||step2D?110:45;
  if(!pos||!w.creative||!p.creativeFlight||p.spectator||
    !Number.isFinite(displacement)||displacement<=0||displacement>(dy||step2D?1:.45)||now-p.lastMove<cooldown)return false;
  const y=(pos.y??0)+dy;
  const x=pos.x+dx,z=pos.z+dz;
  if(y<=MIN_DEPTH||y>MAX_HEIGHT+1||(!legacyRegion(x,z)&&!landscapeRegion(x,z))||
    (w.dimensionId&&!inRealm(x,z)))return false;
  const radius=WORLD_SCALE.radius;
  for(const [ox,oz] of [[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]]){
    if(!bodyClear(w,Math.floor(x+ox),Math.floor(z+oz),Math.min(y,pos.y??0),Math.max(y,pos.y??0)+WORLD_SCALE.playerHeight))return false;
  }
  p.position3D={x,y,z,surface2D:step2D,layered2D:true};
  if(legacyRegion(x,z)){p.x=Math.floor(x);p.y=Math.floor(z);}
  p.lastMove=now;p.moveCount++;w.revision++;
  return true;
}
