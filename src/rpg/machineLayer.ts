import type { World } from './engine';
import { beaconLandmarks, beaconRadius, inspectMachine, machineCarts, machineSignal, machineStorage, railConnections } from './machinery';
import { isMachinePart, isRail, isTransportLane, MACHINE_PARTS } from './machineryParts';
import { fluidAt } from './placedFluids';
import { blueprintPoint, type BlueprintPreview } from './blueprints';
import { blockAt, terrainHeight, voxelKey, VOXEL_COLORS } from './voxel';
import { cavernBlock, cavernWater } from './subsurface';

export type MachineLayerView = 'slice' | 'circuit' | 'rail' | 'logistics' | 'fluids';
export type MachineLayer = {
  height: number;
  view: MachineLayerView;
  selected: { x: number; z: number } | null;
  blueprint?:BlueprintPreview|null;
  onSelect: (x: number, z: number) => void;
  onNudge: (dx: number, dz: number) => void;
};
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const inside = (bounds: Bounds, x: number, z: number) =>
  x >= bounds.minX && x < bounds.maxX && z >= bounds.minY && z < bounds.maxY;

function flowIcon(ctx: CanvasRenderingContext2D, w: World, x: number, y: number, z: number, tile: number, view: MachineLayerView) {
  const fluid = fluidAt(w,x,y,z);
  if (!fluid) return;
  const cx = (x+.5)*tile, cy = (z+.5)*tile;
  ctx.save();
  ctx.globalAlpha = view==='slice' || view==='fluids' ? .94 : .35;
  ctx.fillStyle = fluid.kind==='water' ? '#247c9b' : '#c64e29';
  ctx.fillRect(x*tile+1,z*tile+1,tile-2,tile-2);
  ctx.strokeStyle = fluid.kind==='water' ? '#a2dcf3' : '#ffbd67';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (fluid.dx || fluid.dz) {
    const dx = fluid.dx, dz = fluid.dz;
    ctx.moveTo(cx-3*dx,cy-3*dz); ctx.lineTo(cx+3*dx,cy+3*dz);
    ctx.lineTo(cx+dx-dz*2,cy+dz+dx*2);ctx.moveTo(cx+3*dx,cy+3*dz);
    ctx.lineTo(cx+dx+dz*2,cy+dz-dx*2);
  } else {
    ctx.arc(cx,cy,fluid.source===voxelKey(x,y,z) ? 3.4 : 1.6,0,Math.PI*2);
  }
  ctx.stroke();
  ctx.restore();
}

function icon(ctx: CanvasRenderingContext2D, w: World, x: number, y: number, z: number, tile: number, view: MachineLayerView) {
  flowIcon(ctx,w,x,y,z,tile,view);
  const block = blockAt(w, x, y, z);
  if (!block) return;
  const active = machineSignal(w, x, y, z);
  const cx = (x + .5) * tile, cz = (z + .5) * tile;
  ctx.save();
  ctx.translate(cx, cz);
  const color = VOXEL_COLORS[block] || '#74898c';
  let relevant = true;
  if (view === 'rail') relevant = isRail(block);
  if (view === 'logistics') relevant = machineStorage(block);
  if (view === 'circuit') relevant = isMachinePart(block) && !isRail(block);
  if (view === 'fluids') relevant = block==='water_pump' || block==='water_drain' || block==='water_sensor' || block==='signal_gate' || block==='dispenser';
  ctx.globalAlpha = relevant ? 1 : .43;
  ctx.fillStyle = color;
  ctx.fillRect(-tile / 2 + 1, -tile / 2 + 1, tile - 2, tile - 2);
  ctx.strokeStyle = '#223537';
  ctx.lineWidth = 1;
  ctx.strokeRect(-tile / 2 + 1, -tile / 2 + 1, tile - 2, tile - 2);
  if (isRail(block) || block === 'crystal_wire') {
    const rail = isRail(block);
    const links = rail ? railConnections(w, { x, y, z }) : directions.flatMap(([dx, dz], direction) =>
      [0, 1, -1].flatMap(dy => isMachinePart(w.voxels?.edits[voxelKey(x + dx, y + dy, z + dz)])
        ? [{ y: y + dy, direction }] : []));
    ctx.strokeStyle = rail ? '#fff1c4' : active ? '#ffb9cd' : '#7f405d';
    ctx.lineWidth = rail ? 2 : 2.5;
    ctx.beginPath();
    for (const link of links.length ? links : [{ direction: 0, y }, { direction: 2, y }]) {
      const [dx, dz] = directions[link.direction];
      const cross = rail ? 1.8 : 0;
      for (const offset of rail ? [-cross, cross] : [0]) {
        ctx.moveTo(dz * offset, dx * offset);
        ctx.lineTo(dx * tile / 2 + dz * offset, dz * tile / 2 + dx * offset);
      }
    }
    ctx.stroke();
    if (links.some(link => link.y !== y)) {
      ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#172329';
      ctx.fillText(links.some(link => link.y > y) ? '↑' : '↓', -6, -2);
    }
  } else if (isMachinePart(block)) {
    const { device, rotation } = inspectMachine(w, x, y, z);
    const shape = MACHINE_PARTS[block][4];
    ctx.rotate(rotation * Math.PI / 2);
    ctx.strokeStyle = '#182f32'; ctx.fillStyle = active ? '#fff0ad' : '#403336'; ctx.lineWidth = 1.5;
    if (shape==='piston'&&device?.vertical) {
      ctx.rotate(-rotation * Math.PI / 2);
      ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.fillText('⇧',0,3);
      ctx.rotate(rotation * Math.PI / 2);
    } else if (shape==='portal') {
      ctx.strokeStyle=active?'#a5e4f5':'#436876';ctx.lineWidth=2;
      ctx.strokeRect(-4.3,-5.7,8.6,11.4);
      ctx.fillStyle=active?'#dafbf2':'#6c8fa1';ctx.fillRect(-1.5,-1.5,3,3);
    } else if (shape === 'lamp' || shape === 'crystal') {
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.lineTo(-5, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (shape === 'gate') {
      const rotated = device?.opened ? 3 : 0;
      ctx.fillRect(-5 + rotated, -2 - rotated, device?.opened ? 3 : 10, device?.opened ? 10 : 4);
    } else {
      ctx.beginPath();ctx.moveTo(0, -5);ctx.lineTo(3, 0);ctx.lineTo(1, 0);ctx.lineTo(1, 4);
      ctx.lineTo(-1, 4);ctx.lineTo(-1, 0);ctx.lineTo(-3, 0);ctx.closePath();ctx.fill();
    }
    ctx.rotate(-rotation * Math.PI / 2);
    if (device?.tier) {
      ctx.strokeStyle = device.beamColor??'#81fff0'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-tile / 2, -tile / 2, tile, tile);
    }
  } else {
    ctx.fillStyle = '#ffffff33';
    ctx.fillRect(-tile / 2 + 2, -tile / 2 + 2, tile - 4, 1);
  }
  if (view === 'circuit' && isMachinePart(block) && !isRail(block)) {
    ctx.font = 'bold 6px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = active ? '#fff5a9' : '#e9dfd6';
    ctx.strokeStyle = '#183236'; ctx.lineWidth = 1.4;
    ctx.strokeText(String(active), 6, 6);
    ctx.fillText(String(active), 6, 6);
  }
  if (isTransportLane(block) && Object.values(w.voxels?.containers?.[voxelKey(x,y,z)]?.items ?? {}).some(Boolean)) {
    ctx.fillStyle='#ffe6a5';ctx.strokeStyle='#4b3427';ctx.lineWidth=1;
    ctx.fillRect(-3,-3,6,6);ctx.strokeRect(-3,-3,6,6);
  }
  ctx.restore();
}

export function drawMachineLayer(ctx: CanvasRenderingContext2D, w: World, tile: number, bounds: Bounds, layer: MachineLayer) {
  for (let z = bounds.minY; z < bounds.maxY; z++) for (let x = bounds.minX; x < bounds.maxX; x++) {
    const cave=layer.height<0 ? cavernBlock(w,x,layer.height,z) : undefined;
    const pool=cave!==undefined&&cavernWater(w,x,z,layer.height);
    ctx.fillStyle = pool&&layer.height>=pool.surface-pool.depth ? '#347981' : cave===null
      ? (x+z)%2?'#464653':'#4b4c57' : (x + z) % 2 ? '#20383b' : '#253f41';
    ctx.fillRect(x * tile, z * tile, tile, tile);
    icon(ctx, w, x, layer.height, z, tile, layer.view);
  }
  if (w.sandbox?.zones.length) {
    ctx.save();
    ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
    const colors={private:'#bb9de2',shared:'#9ce1c4',protected:'#f0a586'};
    for (const zone of w.sandbox.zones) {
      if (zone.right<bounds.minX||zone.left>=bounds.maxX||zone.back<bounds.minY||zone.front>=bounds.maxY) continue;
      ctx.strokeStyle=colors[zone.access];
      ctx.strokeRect(zone.left*tile+.75,zone.front*tile+.75,(zone.right-zone.left+1)*tile-1.5,(zone.back-zone.front+1)*tile-1.5);
    }
    ctx.restore();
  }
  if(layer.blueprint){
    const {origin,pattern}=layer.blueprint;
    for(const cell of pattern.cells){
      const {x,y,z}=blueprintPoint(origin,cell);
      if(y!==layer.height||!inside(bounds,x,z))continue;
      const blocked=!!blockAt(w,x,y,z);
      ctx.fillStyle=blocked?'#c96e6e80':'#5ad7ce80';
      ctx.fillRect(x*tile+1,z*tile+1,tile-2,tile-2);
      ctx.strokeStyle=blocked?'#ffa18b':'#a9fff5';
      ctx.lineWidth=1;
      ctx.strokeRect(x*tile+1,z*tile+1,tile-2,tile-2);
      ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0d5';
      ctx.fillText(['↑','→','↓','←'][cell.rotation],(x+.5)*tile,(z+.68)*tile);
    }
  }
  if (layer.selected) {
    ctx.strokeStyle = '#fff198'; ctx.lineWidth = 1.7;
    ctx.strokeRect(layer.selected.x * tile + 1, layer.selected.z * tile + 1, tile - 2, tile - 2);
  }
  if(layer.view==='circuit')drawBeaconMarkers(ctx,w,tile,bounds,true,layer.height);
}

export function drawBeaconMarkers(ctx:CanvasRenderingContext2D,w:World,tile:number,bounds:Bounds,overview:boolean,height?:number){
  for(const {point,tier,color} of beaconLandmarks(w)){
    const {x,y,z}=point;
    if(!inside(bounds,x,z))continue;
    const distance=height===undefined?0:Math.abs(height-y),range=beaconRadius(tier);
    if(height!==undefined&&distance>range)continue;
    const cx=(x+.5)*tile,cz=(z+.5)*tile;
    ctx.save();
    if(tier&&overview){
      ctx.globalAlpha=.55;ctx.strokeStyle=color;ctx.lineWidth=height===undefined?3:1;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.arc(cx,cz,Math.sqrt(range*range-distance*distance)*tile,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.globalAlpha=1;
    }
    const size=height!==undefined?3:overview?9:3;
    ctx.fillStyle=tier?color:'#8e9b95';ctx.strokeStyle='#183637';ctx.lineWidth=overview?2:1;
    ctx.beginPath();ctx.moveTo(cx,cz-size);ctx.lineTo(cx+size,cz);ctx.lineTo(cx,cz+size);ctx.lineTo(cx-size,cz);
    ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
}

const exteriorCache = new WeakMap<World, { revision: number; keys: string[] }>();
export function drawSurfaceMachines(ctx: CanvasRenderingContext2D, w: World, tile: number, bounds: Bounds) {
  const state = w.voxels?.machinery;
  if (!state && !w.voxels?.fluids) return;
  let cache = exteriorCache.get(w);
  if (!cache || cache.revision !== w.voxels!.revision) {
    cache = { revision: w.voxels!.revision, keys: [...new Set([
      ...Object.keys(state?.devices ?? {}), ...Object.keys(state?.heads ?? {}), ...Object.keys(w.voxels?.fluids?.cells ?? {}),
    ])] };
    exteriorCache.set(w, cache);
  }
  for (const key of cache.keys) {
    const [x, y, z] = key.split(',').map(Number);
    if (inside(bounds, x, z) && y === terrainHeight(w, x, z)) icon(ctx, w, x, y, z, tile, 'slice');
  }
}

export function drawMachineCarts(ctx: CanvasRenderingContext2D, w: World, tile: number, bounds: Bounds, height?: number) {
  const carts=machineCarts(w).filter(({x,y,z})=>inside(bounds,x,z) && (height===undefined ? Math.abs(y-terrainHeight(w,x,z))<=.5 : y===height));
  const visible=new Map(carts.map(cart=>[cart.id,cart]));
  ctx.strokeStyle='#ebc794';ctx.lineWidth=2;
  for (const cart of carts) {
    const front=cart.coupledTo ? visible.get(cart.coupledTo) : undefined;
    if (!front) continue;
    ctx.beginPath();ctx.moveTo((cart.x+.5)*tile,(cart.z+.5)*tile);ctx.lineTo((front.x+.5)*tile,(front.z+.5)*tile);ctx.stroke();
  }
  for (const { x, z, direction } of carts) {
    ctx.save();
    ctx.translate((x + .5) * tile, (z + .5) * tile);
    ctx.rotate((direction ?? 0) * Math.PI / 2);
    ctx.fillStyle = '#1e3138'; ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = '#b27255'; ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = '#645054'; ctx.fillRect(-3, -3, 6, 7);
    ctx.fillStyle = '#f0db9b'; ctx.fillRect(-3, -5, 6, 2);
    ctx.restore();
  }
}
