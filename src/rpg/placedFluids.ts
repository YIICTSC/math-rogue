import type { Adventurer, World } from './engine';
import { lifePlayer, type Bag } from './life';
import { machineSignal, poweredGateOpen, type MachineCell } from './machinery';
import { EYE_HEIGHT, blockAt, MAX_HEIGHT, MIN_DEPTH, playerHeight, protectedVoxel, voxelKey, naturalVoxelWater } from './voxel';
import { WIDTH } from './engine';
import { WORLD_SCALE, legacyRegion, roadAt } from './worldLandscape';
import { sandboxAllows } from './sandboxAccess';

type Kind = 'water' | 'lava';
type Source = { kind: Kind; owner: string };
type Flow = { kind: Kind; source: string; owner: string; level: number; dx: number; dz: number };
export interface PlacedFluids {
  sources: Record<string, Source>;
  cells: Record<string, Flow>;
}
export type FluidAction = MachineCell & { type: 'voxel-fluid'; command: 'scoop' | 'water' | 'lava' };
type BucketItem = 'bucket' | 'water_bucket' | 'lava_bucket';

const LIMIT_SOURCES = 32;
const LIMIT_CELLS = 576;
const LIMIT_PER_SOURCE = 70;
const REACH = 4.5;
const SPREAD = 6;
const directions = [[0,-1],[1,0],[0,1],[-1,0]] as const;
const keyOf = (p: MachineCell) => voxelKey(p.x,p.y,p.z);
const decode = (key: string) => {
  const [x,y,z] = key.split(',').map(Number);
  return { x,y,z };
};
const state = (w: World) => w.voxels?.fluids;
type Cache = { cells: PlacedFluids['cells']; columns: Map<string, Array<MachineCell & Flow>> };
const caches = new WeakMap<World, Cache>();
const lastDistribution = new WeakMap<World, { revision: number; stamp: string }>();

function lavaWouldCoverPlayer(w: World, pos: MachineCell) {
  return Object.values(w.players).some(player => {
    if (player.spectator || player.life?.indoors || player.x !== pos.x || player.y !== pos.z) return false;
    const feet = playerHeight(w, player);
    return pos.y + 1 > feet && pos.y < feet + WORLD_SCALE.playerHeight;
  });
}

function admissible(w: World, pos: MachineCell, owner: string) {
  const { x,y,z } = pos;
  if (y <= MIN_DEPTH || y > MAX_HEIGHT || protectedVoxel(w,x,z) || !sandboxAllows(w,owner,pos,'fluid')) return false;
  if (legacyRegion(x,z) ? w.tiles[z * WIDTH + x] === 'road' : roadAt(x,z)) return false;
  const block = blockAt(w,x,y,z);
  if (block && (block !== 'signal_gate' || !poweredGateOpen(w,x,y,z))) return false;
  // Do not let someone redirect fluid through the side of another builder's structure.
  const edits = w.voxels?.placedBy;
  const near = [keyOf(pos), voxelKey(x,y-1,z), voxelKey(x,y+1,z), ...directions.map(([dx,dz]) => voxelKey(x+dx,y,z+dz))];
  return !edits || near.every(key => !edits[key] || edits[key] === owner);
}

export function fluidAt(w: World, x: number, y: number, z: number) {
  return state(w)?.cells[voxelKey(x,y,z)];
}

export function fluidCanScoop(w: World, pos: MachineCell, owner: string) {
  const source = state(w)?.sources[keyOf(pos)];
  if (source) return source.owner === owner;
  const natural = naturalVoxelWater(w,pos.x,pos.z);
  return !blockAt(w,pos.x,pos.y,pos.z) && !!natural && pos.y < natural.surface && pos.y >= natural.surface-natural.depth;
}

export function placedWater(w: World, x: number, z: number, feet?: number) {
  const fluid = state(w);
  if (!fluid) return null;
  let cache = caches.get(w);
  if (!cache || cache.cells !== fluid.cells) {
    const columns = new Map<string, Array<MachineCell & Flow>>();
    for (const [key, flow] of Object.entries(fluid.cells)) {
      if (flow.kind !== 'water') continue;
      const point = decode(key), col = `${point.x},${point.z}`;
      const line = columns.get(col) || [];
      line.push({ ...point, ...flow });
      columns.set(col,line);
    }
    cache = { cells: fluid.cells, columns };
    caches.set(w,cache);
  }
  const line = cache.columns.get(`${Math.floor(x)},${Math.floor(z)}`);
  if (!line?.length) return null;
  const cell = feet === undefined ? line.reduce((a,b)=>a.y>=b.y?a:b) :
    line.filter(p=>p.y>=Math.floor(feet)-1&&p.y<=Math.floor(feet)+1).sort((a,b)=>b.y-a.y)[0];
  if (!cell) return null;
  let surface = cell.y+1, bottom = cell.y;
  while (line.some(c=>c.y===surface)) surface++;
  while (line.some(c=>c.y===bottom-1)) bottom--;
  const base=blockAt(w,cell.x,bottom-1,cell.z);
  const lift=base==='bubbling_stone' ? 2 : base==='magma_block' ? -1.4 : 0;
  return { surface, depth: surface-bottom, flowX: lift ? 0 : cell.dx*.5, flowZ: lift ? 0 : cell.dz*.5, kind: 'river' as const, lift };
}

function drainCells(w:World) {
  const drains=new Map<string,string>();
  for (const [key,device] of Object.entries(w.voxels?.machinery?.devices ?? {})) {
    if (w.voxels?.edits[key]!=='water_drain' || !device.signal) continue;
    const owner=w.voxels.placedBy?.[key];
    if (!owner) continue;
    const p=decode(key),[dx,dz]=directions[(w.voxels.rotations?.[key] ?? 0)&3];
    drains.set(voxelKey(p.x+dx,p.y,p.z+dz),owner);
    drains.set(voxelKey(p.x,p.y+1,p.z),owner);
  }
  return drains;
}

function pumpSources(w: World, fluid: PlacedFluids) {
  const output: Array<[string, Source]> = [];
  for (const key of Object.keys(w.voxels?.machinery?.devices ?? {}).sort()) {
    if (w.voxels?.edits[key] !== 'water_pump') continue;
    const { x,y,z } = decode(key);
    const owner = w.voxels?.placedBy?.[key], [dx,dz] = directions[(w.voxels?.rotations?.[key] ?? 0) & 3];
    if (!owner || !machineSignal(w,x,y,z)) continue;
    const intake = voxelKey(x-dx,y,z-dz);
    const natural = naturalVoxelWater(w,x-dx,z-dz);
    if (fluid.sources[intake]?.kind !== 'water' && !(natural && y <= natural.surface && y > natural.surface-natural.depth)) continue;
    const outlet = { x:x+dx,y,z:z+dz };
    if (admissible(w,outlet,owner)) output.push([keyOf(outlet),{kind:'water',owner}]);
  }
  return output;
}

/** The distribution is bounded and derived from persistent sources and current geometry. */
export function advanceFluids(w: World) {
  const voxels = w.voxels;
  if (!voxels || !w.started || w.ended) return;
  if (w.sandbox?.options.noFluids) {
    if (voxels.fluids && Object.keys(voxels.fluids.cells).length) {
      voxels.fluids.cells={}; voxels.revision++; w.revision++;
    }
    lastDistribution.delete(w);
    return;
  }
  if (!voxels.fluids) {
    if (!Object.keys(voxels.machinery?.devices ?? {}).some(key=>voxels.edits[key]==='water_pump')) return;
    voxels.fluids = { sources: {}, cells: {} };
  }
  const fluid = voxels.fluids;
  const pumps = pumpSources(w,fluid), drains=drainCells(w);
  const stamp = (w.sandbox?.zones.map(zone=>zone.id).join(',')??'')+'|'+pumps.map(([key])=>key).join('|') + '|' +
    Object.entries(voxels.machinery?.devices ?? {}).filter(([key])=>voxels.edits[key]==='signal_gate').map(([key,d])=>key+':'+Number(!!d.opened)).join('|')
    + '|' + [...drains.keys()].join('|');
  const current = lastDistribution.get(w);
  if (current?.revision === voxels.revision && current.stamp === stamp) return;
  const cells: PlacedFluids['cells'] = {};
  const manual = Object.entries(fluid.sources).sort(([a],[b])=>a.localeCompare(b));
  const origins: Array<[string,Source]> = manual.concat(pumps.filter(([key])=>!fluid.sources[key]));
  const bySource = new Map(origins);
  let cellCount = 0, editCount = Object.keys(voxels.edits).length;
  let mixed = false;
  for (const [source, entry] of origins) {
    const root = decode(source);
    if (!admissible(w,root,entry.owner)) continue;
    const queue = [{ ...root, level: SPREAD, dx: 0, dz: 0 }];
    const visited = new Set<string>();
    for (let i=0; i<queue.length && visited.size<LIMIT_PER_SOURCE && cellCount<LIMIT_CELLS; i++) {
      const cell = queue[i], key = keyOf(cell);
      if (visited.has(key) || cell.level<0 || root.y-cell.y>8 || !admissible(w,cell,entry.owner)) continue;
      if (entry.kind==='water' && key!==source && drains.get(key)===entry.owner) continue;
      if (entry.kind === 'lava' && lavaWouldCoverPlayer(w,cell)) continue;
      visited.add(key);
      const existing = cells[key];
      const other = fluid.sources[key] || (existing && bySource.get(existing.source));
      if (other && other.kind !== entry.kind) {
        if (other.owner === entry.owner && fluid.sources[key]?.kind !== 'water' && !voxels.placedBy?.[key] &&
          !blockAt(w,cell.x,cell.y,cell.z) && !lavaWouldCoverPlayer(w,cell) &&
          (Object.hasOwn(voxels.edits,key) || editCount<18000)) {
          if (!Object.hasOwn(voxels.edits,key)) editCount++;
          voxels.edits[key] = fluid.sources[key]?.kind==='lava' ? 'obsidian' : 'cobble';
          (voxels.placedBy ??= {})[key] = entry.owner;
          delete fluid.sources[key];
          if (existing) { delete cells[key]; cellCount--; }
          mixed = true;
        }
        continue;
      }
      if (!existing) cellCount++;
      if (!existing || cell.level > existing.level) cells[key] = { kind: entry.kind, source, owner:entry.owner, level:cell.level, dx:cell.dx, dz:cell.dz };
      const below = { ...cell, y:cell.y-1, dx:0, dz:0 };
      if (root.y-below.y<=8 && admissible(w,below,entry.owner)) {
        queue.push(below);
      } else if (cell.level>0) {
        for (const [dx,dz] of directions) queue.push({ x:cell.x+dx,y:cell.y,z:cell.z+dz,level:cell.level-(entry.kind==='lava'?2:1),dx,dz });
      }
    }
  }
  if (mixed || JSON.stringify(cells) !== JSON.stringify(fluid.cells)) {
    fluid.cells = Object.fromEntries(Object.entries(cells).filter(([,flow]) =>
      bySource.get(flow.source)?.kind === fluid.sources[flow.source]?.kind ||
      pumps.some(([key])=>key === flow.source)));
    voxels.revision++;
    w.revision++;
  }
  if (!mixed) lastDistribution.set(w,{revision:voxels.revision,stamp});
}

export function exchangeFluidBucket(w: World, pos: MachineCell, owner: string, bag: Bag, command: FluidAction['command'],
  canExchange: (removed: BucketItem, added: BucketItem) => boolean = () => true) {
  const { x, y, z } = pos;
  if (![x,y,z].every(Number.isInteger) || y <= MIN_DEPTH || y > MAX_HEIGHT || protectedVoxel(w,x,z) || !sandboxAllows(w,owner,pos,'fluid')) return false;
  const key = keyOf(pos), previous = state(w);
  const source = previous?.sources[key];
  let consumed: BucketItem, produced: BucketItem;
  if (command === 'scoop') {
    consumed = 'bucket';
    produced = source?.kind === 'lava' ? 'lava_bucket' : 'water_bucket';
    if (!bag[consumed] || !fluidCanScoop(w,pos,owner) || !canExchange(consumed,produced)) return false;
    if (source && previous) delete previous.sources[key];
  } else {
    consumed = command === 'lava' ? 'lava_bucket' : 'water_bucket';
    produced = 'bucket';
    if (!bag[consumed] || source || !admissible(w,pos,owner) ||
      (previous && Object.keys(previous.sources).length >= LIMIT_SOURCES) || !canExchange(consumed,produced)) return false;
    if (command === 'lava' && lavaWouldCoverPlayer(w,pos)) return false;
    const voxels = w.voxels ??= {edits:{},revision:0,terrainVersion:2};
    const fluid = voxels.fluids ??= { sources:{}, cells:{} };
    fluid.sources[key] = { kind:command, owner };
  }
  bag[consumed]!--;
  bag[produced] = (bag[produced] || 0) + 1;
  if (w.voxels) w.voxels.revision++;
  return true;
}

export function applyFluidAction(w: World, p: Adventurer, action: FluidAction, now: number) {
  const { x, y, z, command } = action;
  if (now-(p.voxelAt||0)<220 || !['scoop','water','lava'].includes(command)) return false;
  const feet=playerHeight(w,p), px=p.position3D?.x??p.x+.5, pz=p.position3D?.z??p.y+.5;
  if (Math.hypot(x+.5-px,y+.5-feet-EYE_HEIGHT,z+.5-pz)>REACH ||
    !exchangeFluidBucket(w,action,p.id,lifePlayer(p).bag,command)) return false;
  p.voxelAt = now;
  w.revision++;
  advanceFluids(w);
  return true;
}

export function restoreFluids(w: World) {
  const fluid = state(w);
  if (!fluid) return;
  const sources: PlacedFluids['sources'] = {};
  for (const [key, source] of Object.entries(fluid.sources ?? {}).slice(0,LIMIT_SOURCES)) {
    if (!/^-?\d{1,5},-?\d{1,4},-?\d{1,5}$/.test(key) || !source ||
      !['water','lava'].includes(source.kind) || typeof source.owner!=='string' ||
      !canRestoreSource(w,decode(key))) continue;
    sources[key]={kind:source.kind,owner:source.owner.slice(0,180)};
  }
  w.voxels!.fluids={sources,cells:{}};
  advanceFluids(w);
}

function canRestoreSource(w:World,pos:MachineCell) {
  return pos.y>MIN_DEPTH && pos.y<=MAX_HEIGHT && !protectedVoxel(w,pos.x,pos.z);
}
