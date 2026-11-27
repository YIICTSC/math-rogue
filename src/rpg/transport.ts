import type { Adventurer, World } from './engine';
import { lifePlayer } from './life';
import { ridingCart } from './machinery';
import { placedWater } from './placedFluids';
import { sandboxAllows } from './sandboxAccess';
import {
  GLIDER_BOOST_SECONDS, GLIDER_DESCENT, GLIDER_SPEED, WATERCRAFT,
  WATERCRAFT_LIMIT, isWatercraftItem, type WatercraftItem,
} from './transportCatalog';
import { ALL_MATERIAL_NAMES, type VoxelItem } from './voxelCatalog';
import { bodyClear, floorAt, MIN_DEPTH, naturalVoxelWater, playerHeight, protectedVoxel } from './voxel';
import { landscapeRegion, legacyRegion, WORLD_SCALE } from './worldLandscape';
import { ridingAnimal, steerPackAnimal } from './packAnimals';

type Point = { x: number; y: number; z: number };
type Cargo = Partial<Record<VoxelItem, number>>;
type Vector = { dx: number; dz: number };

export interface Watercraft extends Point {
  id: string;
  item: WatercraftItem;
  owner: string;
  rider?: string;
  heading: number;
  cargo: Cargo;
}

export interface Gliding extends Vector {
  lastUpdate: number;
  boost: number;
  usedBoost: boolean;
}

export interface TransportState {
  boats: Record<string, Watercraft>;
  sequence: number;
}

export type TransportAction = { type: 'voxel-transport' } & (
  | { command: 'launch'; item: WatercraftItem }
  | { command: 'board' | 'dock' | 'stow'; boat: string }
  | { command: 'cargo'; boat: string; item: VoxelItem; amount: number; direction: 'load' | 'unload' }
  | { command: 'glide'; heading: number }
  | { command: 'boost' }
);

const compass: Vector[] = [{ dx: 0, dz: -1 }, { dx: 1, dz: 0 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }];
const reach = 3;
const deck = .18;
const radius = .27;
const motionDt = .075;
const boatValues = (w: World) => Object.values(w.transport?.boats ?? {});
export const watercraft = boatValues;
export const boardedBoat = (w: World, id: string) => w.transport && boatValues(w).find(boat => boat.rider === id);
export const traveling = (w: World, p: Adventurer) => !!(p.gliding || boardedBoat(w, p.id) || ridingAnimal(w,p.id));
const col = (x: number, z: number) => ({ x: Math.floor(x), z: Math.floor(z) });
const inMap = (x: number, z: number) => legacyRegion(x,z) || landscapeRegion(x,z);
const nearby = (position: Point, target: Point) => Math.hypot(position.x-target.x, position.y-target.y, position.z-target.z) <= reach;
const centerOf = (w: World, p: Adventurer): Point => ({
  x: p.position3D?.x ?? p.x+.5, y: playerHeight(w,p), z: p.position3D?.z ?? p.y+.5,
});

export function closeWatercraft(w: World, p: Adventurer) {
  const pos = centerOf(w,p);
  return boatValues(w).filter(boat => nearby(pos,boat));
}

function waterSurface(w: World, x: number, z: number, height: number) {
  if (!inMap(x,z)) return null;
  const water = placedWater(w,x,z,height) ?? naturalVoxelWater(w,x,z);
  if (!water || water.depth < .34 || Math.abs(height-water.surface) > .85) return null;
  for (const [dx,dz] of [[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]]) {
    const cell=col(x+dx,z+dz);
    if (!inMap(cell.x,cell.z) || !bodyClear(w,cell.x,cell.z,water.surface-.24,water.surface+1.97)) return null;
  }
  return water.surface;
}

function intersectsBoat(w: World, x: number, y: number, z: number, except?: Watercraft) {
  return boatValues(w).some(boat => boat!==except && Math.hypot(boat.x-x,boat.z-z) < .85 && Math.abs(boat.y-y)<.85);
}

export function occupiedByBoat(w: World, x: number, y: number, z: number) {
  return boatValues(w).some(boat => Math.abs(boat.x-(x+.5))<.75 && Math.abs(boat.z-(z+.5))<.75 &&
    y<boat.y+.6 && y+1>boat.y-.24);
}

export function launchLocation(w: World, p: Adventurer): Point | null {
  if (w.gameMode!=='COOP' || traveling(w,p) || ridingCart(w,p.id)) return null;
  if (boatValues(w).length>=WATERCRAFT_LIMIT) return null;
  const pos=centerOf(w,p), origin=col(pos.x,pos.z), locations: Point[]=[];
  for (let dx=-2;dx<=2;dx++) for (let dz=-2;dz<=2;dz++) {
    const x=origin.x+dx+.5, z=origin.z+dz+.5;
    // A swimmer and a player standing beside the shore may both launch a boat.
    const y=waterSurface(w,x,z,pos.y) ?? waterSurface(w,x,z,pos.y+1);
    if (y===null || !nearby(pos,{x,y,z}) || intersectsBoat(w,x,y,z) || protectedVoxel(w,Math.floor(x),Math.floor(z)) ||
      !sandboxAllows(w,p.id,{x:Math.floor(x),y:Math.floor(y),z:Math.floor(z)},'build')) continue;
    locations.push({x,y,z});
  }
  locations.sort((a,b)=>Math.hypot(pos.x-a.x,pos.z-a.z)-Math.hypot(pos.x-b.x,pos.z-b.z));
  return locations[0] ?? null;
}

function setPosition(p: Adventurer, point: Point, surface2D = p.position3D?.surface2D ?? true) {
  p.position3D={...point,surface2D,layered2D:surface2D,oxygen:p.position3D?.oxygen};
  if (legacyRegion(point.x,point.z)) {
    p.x=Math.floor(point.x);
    p.y=Math.floor(point.z);
  }
}

function mooringSpot(w: World, boat: Watercraft): Point | null {
  const pos=col(boat.x,boat.z), swim: Point[]=[];
  for (const {dx,dz} of [...compass,{dx:0,dz:0}]) {
    const x=pos.x+dx,z=pos.z+dz;
    if (!inMap(x,z)) continue;
    const ground=floorAt(w,x,z,boat.y+1.35);
    const pool=placedWater(w,x,z,boat.y) ?? naturalVoxelWater(w,x,z);
    if (ground!==null && ground>=boat.y-.9 && (!pool || ground>=pool.surface)) return {x:x+.5,y:ground,z:z+.5};
    if (pool && bodyClear(w,x,z,pool.surface-1.2)) swim.push({x:x+.5,y:pool.surface-1.2,z:z+.5});
  }
  return swim[0] ?? null;
}

export function launchGlide(w: World, p: Adventurer, heading: number): Point | null {
  if (!Number.isInteger(heading) || !compass[heading] || !p.life?.bag.glider_wing || traveling(w,p) || ridingCart(w,p.id)) return null;
  const pos=centerOf(w,p), {dx,dz}=compass[heading];
  const x=Math.floor(pos.x)+dx, z=Math.floor(pos.z)+dz;
  if (!inMap(x,z) || !bodyClear(w,x,z,pos.y)) return null;
  const ground=floorAt(w,x,z,pos.y+.01);
  if (ground===null || pos.y-ground<2.6) return null;
  return {x:x+.5,y:pos.y,z:z+.5};
}

export function applyTransport(w: World, p: Adventurer, action: TransportAction, now: number) {
  if (!w.started || w.ended || w.gameMode!=='COOP' || ridingCart(w,p.id) || ridingAnimal(w,p.id) || p.spectator ||
    now-(p.transportAt ?? 0)<180) return false;
  const bag=lifePlayer(p).bag;
  if (action.command==='glide') {
    const point=launchGlide(w,p,action.heading);
    if (!point) return false;
    setPosition(p,point);
    p.gliding={...compass[action.heading],lastUpdate:now,boost:0,usedBoost:false};
  } else if (action.command==='boost') {
    const glide=p.gliding;
    if (!glide || glide.usedBoost || !bag.glider_boost) return false;
    bag.glider_boost--;
    glide.usedBoost=true;
    glide.boost=GLIDER_BOOST_SECONDS;
  } else if (action.command==='launch') {
    if (!isWatercraftItem(action.item) || !bag[action.item]) return false;
    const position=launchLocation(w,p);
    if (!position) return false;
    const transport: TransportState=w.transport??={boats:{},sequence:0};
    const id=`boat-${++transport.sequence}`;
    transport.boats[id]={...position,id,item:action.item,owner:p.id,heading:0,cargo:{}};
    bag[action.item]--;
  } else {
    if (typeof action.boat!=='string' || !Object.hasOwn(w.transport?.boats ?? {},action.boat)) return false;
    const boat=w.transport!.boats[action.boat];
    if (p.gliding || !nearby(centerOf(w,p),boat)) return false;
    const occupied=boardedBoat(w,p.id), cell={...col(boat.x,boat.z),y:Math.floor(boat.y)};
    if (action.command==='board') {
      if (occupied || boat.rider || waterSurface(w,boat.x,boat.z,boat.y)===null ||
        !sandboxAllows(w,p.id,cell,'cart',boat.owner)) return false;
      boat.rider=p.id;
      setPosition(p,{x:boat.x,y:boat.y+deck,z:boat.z});
    } else if (action.command==='dock') {
      if (boat.rider!==p.id) return false;
      const spot=mooringSpot(w,boat);
      if (!spot) return false;
      delete boat.rider;
      setPosition(p,spot);
    } else if (action.command==='stow') {
      if (occupied || boat.rider || boat.owner!==p.id || Object.values(boat.cargo).some(Boolean) ||
        !sandboxAllows(w,p.id,cell,'cart',boat.owner)) return false;
      delete w.transport!.boats[boat.id];
      bag[boat.item]=(bag[boat.item] ?? 0)+1;
    } else if (action.command==='cargo') {
      if (boat.owner!==p.id || occupied&&occupied!==boat || boat.rider&&boat.rider!==p.id ||
        !sandboxAllows(w,p.id,cell,'storage',boat.owner) || !WATERCRAFT[boat.item].slots ||
        !Object.hasOwn(ALL_MATERIAL_NAMES,action.item) || !Number.isSafeInteger(action.amount) ||
        action.amount<1 || action.amount>64 || !['load','unload'].includes(action.direction)) return false;
      const {item,amount,direction}=action;
      const from=direction==='load'?bag:boat.cargo, to=direction==='load'?boat.cargo:bag;
      if ((from[item] ?? 0)<amount) return false;
      if (direction==='load' && ((to[item] ?? 0)+amount>64 || !to[item] && Object.keys(to).length>=WATERCRAFT[boat.item].slots)) return false;
      from[item]=from[item]!-amount;
      if (!from[item]) delete from[item];
      to[item]=(to[item] ?? 0)+amount;
    } else return false;
  }
  p.transportAt=now;
  w.revision++;
  return true;
}

export function steerTransport(w: World, p: Adventurer, dx: number, dz: number, continuous: boolean, now: number) {
  if (!w.started || w.ended || w.gameMode!=='COOP' || p.spectator) return false;
  if(ridingAnimal(w,p.id))return steerPackAnimal(w,p,dx,dz,continuous,now);
  const length=Math.hypot(dx,dz);
  if (!Number.isFinite(length) || length<=0 || (continuous ? length>.45 || now-p.lastMove<45 :
    !Number.isInteger(dx) || !Number.isInteger(dz) || length!==1 || now-p.lastMove<145)) return false;
  if (p.gliding) {
    p.gliding.dx=dx/length;
    p.gliding.dz=dz/length;
    if (p.position3D) p.position3D.surface2D=!continuous;
  } else {
    const boat=boardedBoat(w,p.id);
    if (!boat) return false;
    const speed=WATERCRAFT[boat.item].speed;
    const step=continuous ? Math.min(.48,Math.max(.045,Math.min(.1,(now-p.lastMove)/1000))*speed) : Math.min(.8,speed*.17);
    const mx=dx/length*step,mz=dz/length*step;
    for (const n of [.5,1]) {
      const x=boat.x+mx*n,z=boat.z+mz*n,y=waterSurface(w,x,z,boat.y);
      if (y===null || intersectsBoat(w,x,y,z,boat)) return false;
      if (n===1) {
        Object.assign(boat,{x,y,z,heading:Math.atan2(dx,-dz)});
        setPosition(p,{x,y:y+deck,z},!continuous);
      }
    }
  }
  p.lastMove=now;
  p.moveCount++;
  w.revision++;
  return true;
}

function glideStep(w: World, pos: Point, glide: Gliding, dt: number) {
  const speed=GLIDER_SPEED*(glide.boost>0?1.65:1);
  let x=pos.x+glide.dx*speed*dt,z=pos.z+glide.dz*speed*dt;
  if (!inMap(x,z) || !bodyClear(w,Math.floor(x),Math.floor(z),pos.y)) {x=pos.x;z=pos.z;}
  const y=pos.y-GLIDER_DESCENT*dt;
  const cell=col(x,z), ground=floorAt(w,cell.x,cell.z,pos.y+.01,y);
  const water=placedWater(w,x,z,pos.y) ?? naturalVoxelWater(w,x,z);
  // End the glide at the surface or a platform before applying normal swimming or walking.
  const landing=Math.max(ground ?? -Infinity,water && water.surface<=pos.y+.01 ? water.surface : -Infinity);
  if (landing>=y) {
    const feet=water && ground!==landing && bodyClear(w,cell.x,cell.z,landing-1.2) ? landing-1.2 : landing;
    return {point:{x,y:feet,z},landed:true};
  }
  if (y<=MIN_DEPTH+1) return {point:pos,landed:true};
  return {point:{x,y,z},landed:false};
}

export function glideEstimate(w: World, p: Adventurer) {
  if (!p.gliding) return null;
  let point=centerOf(w,p), distance=0;
  const glide={...p.gliding};
  const sample=.105;
  const samples=Math.ceil((point.y-MIN_DEPTH)/(sample*GLIDER_DESCENT));
  for (let n=0;n<samples;n++) {
    const next=glideStep(w,point,glide,sample);
    distance+=Math.hypot(point.x-next.point.x,point.z-next.point.z);
    point=next.point;
    if (next.landed) break;
    glide.boost=Math.max(0,glide.boost-sample);
  }
  return {point,distance};
}

export function advanceTransport(w: World, now: number) {
  if (!w.started || w.ended) return;
  for (const boat of boatValues(w)) {
    const p=boat.rider ? w.players[boat.rider] : undefined;
    if (boat.rider && (!p || p.nativeScene || p.life?.indoors)) {
      delete boat.rider;
      w.revision++;
    }
  }
  for (const p of Object.values(w.players)) {
    const glide=p.gliding;
    if (!glide || p.spectator) continue;
    let elapsed=Math.min(.45,(now-glide.lastUpdate)/1000);
    if (elapsed<.045) continue;
    let point=centerOf(w,p);
    glide.lastUpdate=now;
    while (elapsed>1e-4) {
      const dt=Math.min(motionDt,elapsed), next=glideStep(w,point,glide,dt);
      point=next.point;
      glide.boost=Math.max(0,glide.boost-dt);
      if (next.landed) {delete p.gliding;break;}
      elapsed-=dt;
    }
    setPosition(p,point);
    w.revision++;
  }
}

export function restoreTransport(w: World, now: number) {
  const saved=w.transport;
  if (saved) {
    const boats: TransportState['boats']={}, aboard=new Set<string>();
    let sequence=Number.isSafeInteger(saved.sequence) && saved.sequence>=0 && saved.sequence<1e8?saved.sequence:0;
    for (const [id,boat] of Object.entries(saved.boats ?? {}).slice(0,WATERCRAFT_LIMIT)) {
      if (!/^boat-[1-9]\d{0,7}$/.test(id) || !boat || !isWatercraftItem(boat.item) ||
        typeof boat.owner!=='string' || ![boat.x,boat.y,boat.z,boat.heading].every(Number.isFinite) ||
        !inMap(boat.x,boat.z) || boat.y < MIN_DEPTH || boat.y > WORLD_SCALE.ceiling) continue;
      const slots=WATERCRAFT[boat.item].slots, cargo: Cargo={};
      for (const [item,count] of Object.entries(boat.cargo ?? {})) {
        if (Object.keys(cargo).length>=slots) break;
        if (Object.hasOwn(ALL_MATERIAL_NAMES,item) && Number.isInteger(count) && count>=1 && count<=64) cargo[item as VoxelItem]=count;
      }
      const rider=typeof boat.rider==='string' && Object.hasOwn(w.players,boat.rider) && w.players[boat.rider];
      const restored:Watercraft={id,x:boat.x,y:boat.y,z:boat.z,heading:boat.heading,item:boat.item,owner:boat.owner,cargo};
      if (rider && !aboard.has(rider.id) && !rider.spectator && !ridingCart(w,rider.id) && nearby(centerOf(w,rider),boat)) {
        restored.rider=rider.id;
        aboard.add(rider.id);
        setPosition(rider,{x:boat.x,y:boat.y+deck,z:boat.z});
      }
      boats[id]=restored;
      sequence=Math.max(sequence,Number(id.slice(5)));
    }
    w.transport={boats,sequence};
  }
  for (const p of Object.values(w.players)) {
    const glide=p.gliding;
    if (!glide) continue;
    const length=Math.hypot(glide.dx,glide.dz);
    if (!p.position3D || p.position3D.y===undefined || !Number.isFinite(p.position3D.y) || p.position3D.y>WORLD_SCALE.ceiling+1 ||
      !Number.isFinite(length) || length===0 || !p.life?.bag.glider_wing || boardedBoat(w,p.id)) delete p.gliding;
    else p.gliding={dx:glide.dx/length,dz:glide.dz/length,lastUpdate:now,
      boost:Number.isFinite(glide.boost)?Math.min(GLIDER_BOOST_SECONDS,Math.max(0,glide.boost)):0,usedBoost:glide.usedBoost===true};
  }
}
