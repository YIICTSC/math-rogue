import type { Adventurer, World } from './engine';
import { lifePlayer, type Bag } from './life';
import { farmMachineSignal, operateFarmMachine, validFarmMachineJob, type FarmMachineJob } from './farm/model';
import { ranchPosition } from './farm/animalLook';
import { exchangeFluidBucket, fluidAt } from './placedFluids';
import { isFilteredPart, isLogisticsPart, isMachinePart, isProcessor, isRail, isTransportLane, manuallyOpenedGate, PROCESSOR, type LogisticsPart, type MachinePart, type ProcessorPart } from './machineryParts';
import { ALL_MATERIAL_NAMES, CART_NAMES, WORKSHOP_RECIPES, type CartItem, type CatalogBlock, type VoxelItem } from './voxelCatalog';
import { recordCityRailArrival } from './city/works';
import { blockAt, bodyClear, floorAt, playerHeight, protectedVoxel, solid, terrainHeight, voxelKey, voxelWater,
  MAX_HEIGHT, MIN_DEPTH, type TerrainBlock } from './voxel';
import { DAY_SECONDS } from './town/catalog';
import { legacyRegion } from './worldLandscape';
import { sandboxAllows } from './sandboxAccess';
import { occupiedByBoat } from './transport';
import { recordBuildingEdit } from './buildingPhysics';

export type MachineCell = { x: number; y: number; z: number };
export type MachineMode = 'compare' | 'subtract';
export type NoteInstrument = 'bell' | 'wood' | 'reed';
export const NOTE_REPEATS = [0,1,2,3,4,6,8,12,16] as const;
export type MachineCommand =
  | (MachineCell & { type: 'voxel-device'; command: 'use' | 'rotate' | 'piston-axis' | 'cart-ride' | 'cart-drive' | 'cart-stop' | 'cart-remove' | 'station-signal' | 'waygate-travel' })
  | (MachineCell & { type: 'voxel-device'; command: 'waygate-link'; value: string })
  | (MachineCell & { type: 'voxel-device'; command: 'cart-place'; value?: CartItem })
  | (MachineCell & { type: 'voxel-device'; command: 'cart-cargo'; item: VoxelItem; direction: 'load' | 'unload'; amount: number })
  | (MachineCell & { type: 'voxel-device'; command: 'station-name'; value: string })
  | (MachineCell & { type: 'voxel-device'; command: 'cart-route'; value: string })
  | (MachineCell & { type: 'voxel-device'; command: 'cart-couple'; value: string })
  | (MachineCell & { type: 'voxel-device'; command: 'cart-timetable'; value: CartTimetable | null })
  | (MachineCell & { type: 'voxel-device'; command: 'farm-job'; value: FarmMachineJob })
  | { type: 'voxel-device'; x: number; y: number; z: number; command: 'delay' | 'note' | 'note-volume' | 'note-repeat' | 'sensor-range'; value: number }
  | { type: 'voxel-device'; x: number; y: number; z: number; command: 'mode'; value: MachineMode }
  | { type: 'voxel-device'; x: number; y: number; z: number; command: 'filter' | 'recipe' | 'instrument'; value: string };

interface Device {
  signal: number;
  enabled?: boolean;
  until?: number;
  opened?: boolean;
  blocked?: boolean;
  pending?: number;
  due?: number;
  delay?: number;
  mode?: MachineMode;
  observed?: string;
  tier?: number;
  beamColor?: string;
  filter?: VoxelItem;
  recipe?: string;
  progress?: number;
  requested?: boolean;
  note?: number;
  noteGain?: number;
  notePeriod?: number;
  instrument?: NoteInstrument;
  played?: number;
  stationName?: string;
  stationSignal?: boolean;
  sensorRange?: number;
  signalChanges?: number;
  arrivedFrom?: string;
  farmJob?: FarmMachineJob;
  vertical?: boolean;
  workTick?: number;
  waygate?: string;
}
type CartTimetable = { stops: string[]; dwellSeconds: number };
interface Cart {
  owner: string;
  cell: string;
  previous?: string;
  direction?: number;
  rider?: string;
  moving: boolean;
  next: number;
  kind?: CartItem;
  cargo?: Bag;
  waiting?: boolean;
  destination?: string;
  timetable?: CartTimetable;
  coupledTo?: string;
}

export interface MachineryState {
  tick: number;
  devices: Record<string, Device>;
  heads: Record<string, string>;
  carts: Record<string, Cart>;
  overloaded?: boolean;
}

const STEP_MS = 250;
const MAX_DEVICES = 2048;
const MAX_CARTS = 48;
const UPDATE_BUDGET = 4096;
const PISTON_LIMIT = 12;
const CART_REACH = 3.6;
const MAX_STOPS = 6;

// The indices are shared with placement rotation. Three.js samples these same directions.
const horizontal = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]] as const;
const sides = [...horizontal, [0, 1, 0], [0, -1, 0]] as const;
const steps = horizontal.flatMap(([x, , z]) => [[x, 1, z], [x, -1, z]] as const);
const fromKey = (key: string): MachineCell => {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
};
const offset = (cell: MachineCell, [x, y, z]: readonly number[], amount = 1): MachineCell =>
  ({ x: cell.x + x * amount, y: cell.y + y * amount, z: cell.z + z * amount });
const keyOf = ({ x, y, z }: MachineCell) => voxelKey(x, y, z);
const at = (w: World, pos: MachineCell) => blockAt(w, pos.x, pos.y, pos.z);
const rotationAt = (w: World, key: string) => (w.voxels?.rotations?.[key] ?? 0) & 3;
const stateOf = (w: World) => w.voxels?.machinery;
const kindAt = (w: World, key: string) => w.voxels?.edits[key];

interface CircuitWork {
  state: MachineryState;
  dirty: Set<string>;
  active: Set<string>;
  receivedItems: Set<Bag>;
  last: number | undefined;
}
const workByWorld = new WeakMap<World, CircuitWork>();

const needsTick = new Set<MachinePart>([
  'pressure_plate', 'weight_plate', 'daylight_sensor', 'water_sensor', 'crystal_button',
  'presence_sensor','vibration_sensor','item_sensor','tripwire_hook',
  'wooden_button', 'crystal_inverter', 'crystal_repeater', 'crystal_comparator', 'crystal_observer',
  'signal_gate', 'fence_gate', 'trapdoor', 'iron_door', 'steel_shutter', 'drawbridge', 'piston', 'sticky_piston', 'crystal_beacon', 'detector_rail',
  'hopper', 'dropper', 'dispenser', 'item_pipe', 'conveyor', 'item_sorter', 'item_collector',
  ...Object.keys(PROCESSOR) as ProcessorPart[], 'farm_sensor', 'farm_machine',
]);

function workFor(w: World, state: MachineryState) {
  let work = workByWorld.get(w);
  if (!work || work.state!==state) {
    const keys = Object.keys(state.devices).sort();
    work = {
      state,
      dirty: new Set(keys),
      active: new Set(keys.filter(key => needsTick.has(kindAt(w, key) as MachinePart)||!!state.devices[key].notePeriod)),
      receivedItems: new Set(),
      last: undefined,
    };
    workByWorld.set(w, work);
  }
  return work;
}

function markNearby(work: CircuitWork, state: MachineryState, cell: MachineCell) {
  const key = keyOf(cell);
  if (state.devices[key]) work.dirty.add(key);
  for (const vector of [...sides, ...steps]) {
    const neighbor = keyOf(offset(cell, vector));
    if (state.devices[neighbor]) work.dirty.add(neighbor);
  }
}

export function markMachineNeighbor(w: World, x: number, y: number, z: number) {
  const state = stateOf(w);
  if (state) markNearby(workFor(w, state), state, { x, y, z });
}

export const canAddMachinePart = (w: World) => Object.keys(stateOf(w)?.devices ?? {}).length < MAX_DEVICES;

export function recordMachineEdit(w: World, x: number, y: number, z: number, before: TerrainBlock | null, after: CatalogBlock | null) {
  const voxels = w.voxels;
  if (!voxels) return;
  const key=voxelKey(x,y,z);
  recordBuildingEdit(w,key,after);
  const state = voxels.machinery ?? (isMachinePart(after)
    ? (voxels.machinery = { tick: 0, devices: {}, heads: {}, carts: {} })
    : undefined);
  if (!state) return;
  const work = workFor(w, state);
  const cell = { x, y, z };
  if (isMachinePart(before)) {
    // A piston owns only its temporary head. Moved blocks stay where they landed.
    for (const [head, base] of Object.entries(state.heads)) {
      if (base === key) { delete state.heads[head]; markNearby(work, state, fromKey(head)); }
    }
    delete state.devices[key];
    work.dirty.delete(key);
    work.active.delete(key);
    if (isRail(before)) {
      const cart = Object.values(state.carts).find(cart => cart.cell === key);
      if (cart) { cart.moving = false; cart.waiting = false; }
    }
  }
  if (isMachinePart(after)) {
    state.devices[key] = { signal: 0 };
    if (needsTick.has(after)) work.active.add(key);
  }
  markNearby(work, state, cell);
}

export const machineSignal = (w: World, x: number, y: number, z: number) =>
  stateOf(w)?.devices[voxelKey(x, y, z)]?.signal ?? 0;

export const poweredGateOpen = (w: World, x: number, y: number, z: number) =>
  !!stateOf(w)?.devices[voxelKey(x, y, z)]?.opened;

export const hasPistonHead = (w: World, key: string) => !!stateOf(w)?.heads[key];

export function waygateEndpoints(w:World,owner:string,excluding:string) {
  return Object.entries(stateOf(w)?.devices ?? {}).filter(([key])=>key!==excluding&&kindAt(w,key)==='waygate'&&sameOwner(w,key,owner))
    .map(([key,device])=>({key,...fromKey(key),active:device.signal>0}));
}

export function machineCarts(w: World) {
  return Object.entries(stateOf(w)?.carts ?? {}).map(([id, cart]) => ({ id, ...cart, ...fromKey(cart.cell) }));
}

export const ridingCart = (w: World, id: string) => Object.values(stateOf(w)?.carts ?? {}).some(cart => cart.rider === id);
export const cartWorkbench = (w: World, id: string) => Object.values(stateOf(w)?.carts ?? {})
  .some(cart => cart.rider === id && cart.kind === 'minecart_work' && !cart.moving);
export const cargoCart = (type?: CartItem) => type === 'minecart_chest' || type === 'minecart_hopper';

function movingGateOccupied(w: World, cell: MachineCell, carrying: Adventurer[] = [], replaced?:Cart) {
  return Object.values(w.players).some(player => {
    if (player.spectator || player.life?.indoors || carrying.includes(player)) return false;
    const dx = Math.abs((player.position3D?.x ?? player.x + .5) - cell.x - .5);
    const dz = Math.abs((player.position3D?.z ?? player.y + .5) - cell.z - .5);
    const y = playerHeight(w, player);
    return dx < .77 && dz < .77 && y < cell.y + 1 && y + 1.72 > cell.y;
  }) || occupiedByBoat(w,cell.x,cell.y,cell.z) || Object.values(stateOf(w)?.carts ?? {}).some(cart=>cart!==replaced&&cart.cell===keyOf(cell));
}

const trailerFor=(state:MachineryState,id:string)=>Object.values(state.carts).find(cart=>cart.coupledTo===id);
const activeCart=(cart:Cart|undefined)=>!!cart&&(cart.moving || !!cart.waiting);

function allowedCell(w: World, { x, y, z }: MachineCell) {
  return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
    y > MIN_DEPTH && y <= MAX_HEIGHT && !protectedVoxel(w, x, z);
}

function canMoveBlock(w: World, cell: MachineCell, owner: string, carrying:Adventurer[] = []) {
  const voxels = w.voxels!;
  const key = keyOf(cell);
  const block = voxels.edits[key];
  return allowedCell(w, cell) && sandboxAllows(w,owner,cell,'break') && voxels.placedBy?.[key] === owner && block &&
    !isMachinePart(block) && !machineStorage(block) && !['door', 'furnace', 'workbench', 'irrigator', 'bookshelf', 'composter'].includes(block) &&
    !voxels.containers?.[key] && !voxels.fluids?.sources[key] && !movingGateOccupied(w, cell, carrying) &&
    !Object.values(w.players).some(player => !player.spectator && !player.life?.indoors && !carrying.includes(player) &&
      Math.floor(player.position3D?.x ?? player.x) === cell.x &&
      Math.floor(player.position3D?.z ?? player.y) === cell.z &&
      Math.abs(playerHeight(w, player) - cell.y - 1) < .15);
}

function moveBlock(w: World, from: MachineCell, to: MachineCell, work: CircuitWork, state: MachineryState) {
  const voxels = w.voxels!;
  const origin = keyOf(from), target = keyOf(to);
  voxels.edits[target] = voxels.edits[origin];
  voxels.edits[origin] = null;
  voxels.placedBy![target] = voxels.placedBy![origin];
  delete voxels.placedBy![origin];
  if (voxels.rotations) {
    voxels.rotations[target] = voxels.rotations[origin] ?? 0;
    delete voxels.rotations[origin];
  }
  const details=voxels.details;
  if(details?.gravity?.[origin]) {
    details.gravity[target]=true;
    delete details.gravity[origin];
  }
  if(details?.signs && Object.hasOwn(details.signs,origin)) {
    details.signs[target]=details.signs[origin];
    delete details.signs[origin];
  }
  markNearby(work, state, from);
  markNearby(work, state, to);
}

function liftRiders(w: World, cell: MachineCell, owner:string) {
  if (kindAt(w,keyOf(cell))!=='lift_platform' || !sameOwner(w,keyOf(cell),owner)) return [];
  return Object.values(w.players).filter(player=>!player.spectator && !player.life?.indoors && !player.nativeScene &&
    Math.floor(player.position3D?.x??player.x)===cell.x && Math.floor(player.position3D?.z??player.y)===cell.z &&
    Math.abs(playerHeight(w,player)-cell.y-1)<.08);
}

function carryLift(riders:Adventurer[],feet:number) {
  for (const rider of riders) {
    const pos=rider.position3D ?? {x:rider.x+.5,z:rider.y+.5,surface2D:true,layered2D:true};
    rider.position3D={...pos,y:feet,vy:undefined};
  }
}

function updatePiston(w: World, state: MachineryState, work: CircuitWork, cell: MachineCell, kind: MachinePart, device: Device, signal: number) {
  const key = keyOf(cell);
  const dir = device.vertical ? [0,1,0] : horizontal[rotationAt(w, key)];
  const front = offset(cell, dir);
  const head = keyOf(front);
  const owner = w.voxels?.placedBy?.[key];
  if (!owner || !sandboxAllows(w,owner,cell,'device')) return false;
  if (signal && !device.opened) {
    const line: MachineCell[] = [];
    let dest = front;
    const carrying=device.vertical ? liftRiders(w,front,owner) : [];
    while (at(w, dest) && line.length < PISTON_LIMIT) {
      if (!canMoveBlock(w, dest, owner,carrying)) break;
      line.push(dest);
      dest = offset(dest, dir);
    }
    const fillsAnEdit = line.length && !Object.hasOwn(w.voxels!.edits, keyOf(dest)) &&
      Object.keys(w.voxels!.edits).length >= 18000;
    const blocked = !!at(w, dest) || !allowedCell(w,dest) || !sandboxAllows(w,owner,dest,'build') || movingGateOccupied(w,dest,carrying) || !!fillsAnEdit ||
      !!w.voxels?.fluids?.sources[keyOf(dest)] ||
      !!carrying.length && (line.length!==1 || !bodyClear(w,front.x,front.z,front.y+2) ||
        movingGateOccupied(w,offset(front,[0,1,0],2),carrying));
    const changed = !!device.blocked !== blocked;
    device.blocked = blocked;
    if (blocked) return changed;
    if (line.length) {
      for (let i = line.length - 1; i >= 0; i--) moveBlock(w, line[i], offset(line[i], dir), work, state);
    }
    carryLift(carrying,front.y+2);
    state.heads[head] = key;
    device.opened = true;
    w.voxels!.revision++;
    markNearby(work, state, front);
    return true;
  }
  if (!signal && device.opened) {
    const next = offset(front, dir);
    const carrying=kind==='sticky_piston'&&device.vertical?liftRiders(w,next,owner):[];
    if (carrying.length && (movingGateOccupied(w,front,carrying) ||
      movingGateOccupied(w,next,carrying) || !canMoveBlock(w,next,owner,carrying))) {
      const changed=!device.blocked;
      device.blocked=true;
      return changed;
    }
    delete state.heads[head];
    if (kind === 'sticky_piston' && !at(w,front) && sandboxAllows(w,owner,front,'build') && !movingGateOccupied(w,front,carrying) && canMoveBlock(w,next,owner,carrying)) {
      moveBlock(w, next, front, work, state);
      carryLift(carrying,next.y);
    }
    device.opened = false;
    device.blocked = false;
    w.voxels!.revision++;
    markNearby(work, state, front);
    return true;
  }
  if (!signal && device.blocked) { device.blocked = false; return true; }
  return false;
}

const directed: ReadonlySet<MachinePart> = new Set(['crystal_inverter','crystal_repeater','crystal_comparator','crystal_observer',
  'farm_sensor','presence_sensor','vibration_sensor','item_sensor']);
const outputs: ReadonlySet<MachinePart> = new Set([
  'crystal_wire', 'crystal_source', 'crystal_lever', 'crystal_button', 'wooden_button',
  'pressure_plate', 'weight_plate', 'daylight_sensor', 'water_sensor', 'detector_rail', 'tripwire_hook', ...directed,
]);

function receive(w: World, state: MachineryState, source: MachineCell, target: MachineCell, isStep = false) {
  const id = keyOf(source), kind = kindAt(w, id);
  if (!isMachinePart(kind) || !outputs.has(kind)) return 0;
  if (isStep && kind !== 'crystal_wire') return 0;
  if (directed.has(kind) && keyOf(offset(source, horizontal[rotationAt(w, id)])) !== keyOf(target)) return 0;
  if (kind==='tripwire_hook' && keyOf(offset(source,horizontal[(rotationAt(w,id)+2)&3]))!==keyOf(target)) return 0;
  return Math.max(0, (state.devices[id]?.signal ?? 0) - (kind === 'crystal_wire' && kindAt(w, keyOf(target)) === 'crystal_wire' ? 1 : 0));
}

function delayed(device: Device, now: number, wanted: number, delay = 1) {
  if (device.pending !== wanted) {
    device.pending = wanted;
    device.due = now + delay;
  }
  return (device.due ?? now) <= now ? wanted : device.signal;
}

function occupancy(w: World, cell: MachineCell) {
  const players=Object.values(w.players).filter(p =>
    !p.spectator && !p.life?.indoors && !ridingCart(w, p.id) &&
    Math.floor(p.position3D?.x ?? p.x) === cell.x && Math.floor(p.position3D?.z ?? p.y) === cell.z &&
    Math.abs(playerHeight(w, p) - cell.y) < .65).length
    + Object.values(stateOf(w)?.carts ?? {}).filter(cart => cart.cell === keyOf(cell)).length;
  let livestock=0;
  for (const f of Object.values(w.farm?.people ?? {})) {
    if (f.x===undefined || f.y===undefined || cell.x<f.x || cell.x>f.x+5 || cell.z<f.y || cell.z>f.y+5) continue;
    for (const [i,animal] of f.animals.entries()) {
      const position=ranchPosition(w,f,animal,i);
      if (position&&Math.floor(position.x)===cell.x&&Math.floor(position.z)===cell.z&&terrainHeight(w,cell.x,cell.z)===cell.y) livestock++;
    }
  }
  return players+livestock;
}

function tripwireSignal(w:World,cell:MachineCell,direction:number) {
  const line=horizontal[direction];
  let triggered=false;
  for (let distance=1; distance<=7; distance++) {
    const point=offset(cell,line,distance), key=keyOf(point), part=kindAt(w,key);
    if (part==='tripwire_hook') return distance>1 && rotationAt(w,key)===((direction+2)&3) && triggered ? 15 : 0;
    if (part!=='tripwire') return 0;
    if (!triggered) triggered=!!occupancy(w,point);
  }
  return 0;
}

function nearbyPlayerSignal(w:World, cell:MachineCell, range:number, recentMovement:boolean) {
  return Object.values(w.players).some(player=>{
    if (player.spectator || player.nativeScene || player.life?.indoors) return false;
    if (recentMovement && (player.lastMove<=0 || w.life.now-player.lastMove>500)) return false;
    return Math.hypot((player.position3D?.x ?? player.x+.5)-cell.x-.5,playerHeight(w,player)-cell.y,
      (player.position3D?.z ?? player.y+.5)-cell.z-.5)<=range;
  }) ? 15 : 0;
}

function readStorage(w: World, pos: MachineCell) {
  const container = w.voxels?.containers?.[keyOf(pos)];
  const amount = Object.values(container?.items ?? {}).reduce((total, n) => total + (n || 0), 0);
  return amount ? Math.min(15, Math.ceil(amount / 64)) : 0;
}

const baseBlocks = new Set<TerrainBlock>(['iron_block','gold_block','diamond_block','steel','polishedstone','obsidian','crystal']);
const beamGlass: Partial<Record<TerrainBlock,string|null>> = {
  glass:null,glasspane:null,blueglass:'#88d9ff',bluepane:'#88d9ff',pinkglass:'#ff98cd',pinkpane:'#ff98cd',
  amberglass:'#ffc47b',amberpane:'#ffc47b',violetglass:'#c6a5ff',violetpane:'#c6a5ff',
};

const defaultBeamColor='#90fff3';
function beaconBeamColor(w:World,cell:MachineCell) {
  let color=defaultBeamColor;
  for (let y=cell.y+1;y<=MAX_HEIGHT;y++) {
    const block=blockAt(w,cell.x,y,cell.z);
    if(!block)continue;
    if(!Object.hasOwn(beamGlass,block))return null;
    const tint=beamGlass[block];
    if(tint&&color===defaultBeamColor)color=tint;
  }
  return color;
}
function beaconBaseTier(w: World, cell: MachineCell) {
  let tier = 0;
  for (let level = 1; level <= 4; level++) {
    for (let x = -level; x <= level; x++) for (let z = -level; z <= level; z++) {
      const block=blockAt(w,cell.x+x,cell.y-level,cell.z+z);
      if (!block || !baseBlocks.has(block)) return tier;
    }
    tier = level;
  }
  return tier;
}

export const beaconRadius=(tier:number)=>6+tier*4;
export function beaconLandmarks(w:World) {
  return Object.entries(stateOf(w)?.devices??{}).flatMap(([key,device])=>
    w.voxels?.edits[key]==='crystal_beacon'?[{point:fromKey(key),tier:device.tier??0,color:device.beamColor??defaultBeamColor}]:[]);
}

export function activeBeaconAt(w: World, p: Adventurer) {
  if(w.gameMode!=='COOP')return 0;
  let tier = 0;
  const x = p.position3D?.x ?? p.x + .5, z = p.position3D?.z ?? p.y + .5;
  const y = playerHeight(w, p);
  for (const [key, device] of Object.entries(stateOf(w)?.devices ?? {})) {
    if (!device.tier) continue;
    const cell = fromKey(key);
    if (Math.hypot(x - cell.x - .5, y - cell.y, z - cell.z - .5) <= beaconRadius(device.tier)) tier = Math.max(tier, device.tier);
  }
  return tier;
}

function sameOwner(w: World, key: string, owner: string) {
  return w.voxels?.placedBy?.[key] === owner;
}

export function storageLimits(block: string) {
  if (block === 'warehouse_chest') return { stack: 128, slots: 48 };
  if (isTransportLane(block)) return { stack: 1, slots: 1 };
  return { stack: 64, slots: 24 };
}

export function canStore(items: Bag, item: VoxelItem, count: number, block: string = 'chest', freed?: VoxelItem) {
  if (block==='dispenser' && !['bucket','water_bucket','lava_bucket'].includes(item)) return false;
  const { stack, slots } = storageLimits(block);
  const freedSlot = freed && items[freed] === 1 ? 1 : 0;
  return (items[item] || 0) + count <= stack &&
    (!!items[item] || Object.values(items).filter(Boolean).length - freedSlot < slots);
}

export const machineStorage = (block: TerrainBlock | null): block is LogisticsPart | 'chest' | 'warehouse_chest' =>
  !!block && (block === 'chest' || block === 'warehouse_chest' || isLogisticsPart(block));

type Storage = { items: Bag; block: string; filter?: VoxelItem };

function containerAt(w: World, pos: MachineCell, owner: string): Storage | null {
  const voxels = w.voxels!;
  const key = keyOf(pos), block = at(w, pos);
  if (!allowedCell(w,pos) || !sandboxAllows(w,owner,pos,'storage') || !sameOwner(w,key,owner) || !machineStorage(block)) return null;
  const containers = voxels.containers ??= {};
  return { items: (containers[key] ??= { items: {} }).items, block,
    filter: block==='item_collector' ? stateOf(w)?.devices[key]?.filter : undefined };
}

const acceptsItem = (to: Storage, item: VoxelItem, count = 1) =>
  (!to.filter || to.filter===item) && canStore(to.items,item,count,to.block);

function moveItem(from: Bag, to: Storage, filter?: VoxelItem, received?: Set<Bag>) {
  const item = filter || (Object.keys(from).sort() as VoxelItem[]).find(key => (from[key] || 0) > 0);
  if (!item || !from[item] || from === to.items || !acceptsItem(to,item)) return false;
  if (--from[item]! === 0) delete from[item];
  to.items[item] = (to.items[item] || 0) + 1;
  if (isTransportLane(to.block)) received?.add(to.items);
  return true;
}

function waterReceiver(w:World,start:MachineCell,owner:string,from:Bag,item:VoxelItem) {
  const first=fluidAt(w,start.x,start.y,start.z);
  if (!first || first.kind!=='water' || first.owner!==owner) return null;
  const queue=[start], reached=new Set([keyOf(start)]);
  for (let i=0;i<queue.length && i<70;i++) {
    const cell=queue[i], flow=fluidAt(w,cell.x,cell.y,cell.z)!;
    for(const dir of [[0,-1,0],...horizontal]){
      const next=offset(cell,dir);
      const receiver=containerAt(w,next,owner);
      if(receiver && receiver.items!==from && acceptsItem(receiver,item)) return receiver;
      const downstream=fluidAt(w,next.x,next.y,next.z), id=keyOf(next);
      if(!downstream || downstream.source!==first.source || downstream.level>flow.level || reached.has(id))continue;
      reached.add(id);queue.push(next);
    }
  }
  return null;
}

function updateLogistics(w: World, state: MachineryState, work: CircuitWork, cell: MachineCell, kind: MachinePart, device: Device, input: number) {
  const key = keyOf(cell), rotation = rotationAt(w, key), owner = w.voxels?.placedBy?.[key];
  if (!owner) return false;
  const above = offset(cell, [0, 1, 0]);
  const forward = offset(cell, horizontal[rotation]);
  const from = containerAt(w, above, owner);
  const to = containerAt(w, forward, owner);
  const store = containerAt(w, cell, owner);
  if (!store) return false;
  const { items } = store;
  if (kind === 'dispenser') {
    if (!input || device.signal) return false;
    const selected = device.filter ?? (items.water_bucket ? 'water_bucket' : 'bucket');
    const command = selected==='water_bucket' ? 'water' : selected==='lava_bucket' ? 'lava' : selected==='bucket' ? 'scoop' : null;
    return !!command && exchangeFluidBucket(w,forward,owner,items,command,
      (removed,added)=>canStore(items,added,1,kind,removed));
  }
  if (isTransportLane(kind)) {
    return !input && !work.receivedItems.has(items) && !!to && moveItem(items,to,undefined,work.receivedItems);
  }
  if (kind === 'item_sorter') {
    if (input || !device.filter) return false;
    const side = offset(cell,horizontal[(rotation+1)&3]);
    const rejects = containerAt(w,side,owner);
    const sent = !!to && moveItem(items,to,device.filter,work.receivedItems);
    const other = (Object.keys(items).sort() as VoxelItem[]).find(item=>item!==device.filter && items[item]);
    const rejected = !!other && !!rejects && moveItem(items,rejects,other,work.receivedItems);
    const collected = !!from && moveItem(from.items,store);
    if (rejected) markNearby(work,state,side);
    if (sent || collected) { markNearby(work,state,above); markNearby(work,state,forward); }
    return sent || rejected || collected;
  }
  if (kind === 'hopper' || kind === 'dropper' || kind === 'item_collector') {
    if (kind === 'dropper' ? !input || !!device.signal : !!input) return false;
    const payload=device.filter || (Object.keys(items).sort() as VoxelItem[]).find(item=>!!items[item]);
    const destination=to || (kind==='dropper'&&payload&&items[payload] ? waterReceiver(w,forward,owner,items,payload) : null);
    const sent = !!destination && moveItem(items,destination,device.filter,work.receivedItems);
    const collected = kind === 'hopper' && !!from && moveItem(from.items,store,device.filter);
    if (sent || collected) {
      markNearby(work, state, above);
      markNearby(work, state, forward);
      return true;
    }
    return false;
  }
  if (!isProcessor(kind)) return false;
  const processor=PROCESSOR[kind];
  const recipe = WORKSHOP_RECIPES.find(r => r.id === (device.recipe || processor.recipe));
  const furnace = processor.fuel;
  if (!recipe || !canAutomate(kind, recipe.id) || !Object.hasOwn(ALL_MATERIAL_NAMES, recipe.output)) return false;
  const output = recipe.output as VoxelItem;
  const fuel = furnace ? (['coal', 'charcoal', 'wood'] as const).find(item =>
    (items[item] || 0) > (recipe.cost[item] || 0)) : undefined;
  if (from) {
    const ingredients = (Object.keys(recipe.cost) as VoxelItem[]).filter(item => (items[item] || 0) < recipe.cost[item]!);
    const item = ingredients.find(item => !!from.items[item]) || (furnace && !fuel
      ? (['coal', 'charcoal', 'wood'] as const).find(item => !!from.items[item]) : undefined);
    if (item && moveItem(from.items, store, item)) {
      markNearby(work, state, above);
      return true;
    }
  }
  const ready = !!to && acceptsItem(to,output,recipe.count) &&
    Object.entries(recipe.cost).every(([item, count]) => (items[item as VoxelItem] || 0) >= count!) && (!furnace || !!fuel);
  if (!ready) return false; // Progress and paid materials remain reserved in this machine's input slots.
  if (processor.pulse && !device.progress && !device.requested) return false;
  const duration = processor.ticks;
  device.progress = (device.progress || 0) + 1;
  if (device.progress < duration) return true;
  for (const [item, count] of Object.entries(recipe.cost) as [VoxelItem, number][]) {
    if ((items[item]! -= count) === 0) delete items[item];
  }
  if (fuel && --items[fuel]! === 0) delete items[fuel];
  to.items[output] = (to.items[output] || 0) + recipe.count;
  if (isTransportLane(to.block)) work.receivedItems.add(to.items);
  device.progress = 0;
  device.requested = false;
  markNearby(work, state, forward);
  return true;
}

export function canAutomate(kind: string, recipeId: string) {
  const recipe = WORKSHOP_RECIPES.find(r => r.id === recipeId);
  if (!recipe || recipe.tier || recipe.output === 'hoe') return false;
  switch(kind){
    case 'auto_furnace':return recipe.station==='furnace';
    case 'auto_crafter':return recipe.station==='hand'||recipe.station==='workbench';
    case 'blast_furnace':return ['iron_ingot','copper_ingot','gold_ingot'].includes(recipeId);
    case 'smoker':return recipeId==='smoked_fish';
    case 'stonecutter':return ['stonebrick','stoneslab','stonestairs','stonewall','sandstone','polishedstone'].includes(recipeId);
    case 'auto_composter':return recipe.station==='composter';
    case 'auto_brewer':return recipe.station==='brew_table';
    default:return false;
  }
}

function updateDevice(w: World, state: MachineryState, work: CircuitWork, key: string, device: Device, kind: MachinePart) {
  const cell = fromKey(key);
  const direction = rotationAt(w, key);
  const rear = offset(cell, horizontal[(direction + 2) & 3]);
  const receiveRear = () => receive(w, state, rear, cell);
  const rawInput = () => Math.max(...sides.map(dir => receive(w, state, offset(cell, dir), cell)),
    ...(kind === 'crystal_wire' ? steps.map(dir => receive(w, state, offset(cell, dir), cell, true)) : []));
  let signal: number;
  let changed = false;
  switch (kind) {
    case 'crystal_source': signal = 15; break;
    case 'crystal_lever': signal = device.enabled ? 15 : 0; break;
    case 'crystal_button':
    case 'wooden_button': signal = (device.until || 0) > state.tick ? 15 : 0; break;
    case 'pressure_plate': signal = occupancy(w, cell) ? 15 : 0; break;
    case 'weight_plate': signal = Math.min(15, occupancy(w, cell) * 4); break;
    case 'daylight_sensor': signal = Math.round(15 * Math.max(0, Math.sin((w.town?.elapsed ?? 0) % DAY_SECONDS / DAY_SECONDS * Math.PI * 2 + Math.PI/4))); break;
    case 'presence_sensor': signal=nearbyPlayerSignal(w,cell,3,false);break;
    case 'vibration_sensor': signal=nearbyPlayerSignal(w,cell,device.sensorRange ?? 4,true);break;
    case 'item_sensor': signal=readStorage(w,rear) ? 15 : 0;break;
    case 'tripwire_hook': signal=tripwireSignal(w,cell,direction);break;
    case 'tripwire': signal=0;break;
    case 'water_sensor': {
      const water = voxelWater(w, rear.x, rear.z,rear.y);
      signal = water && rear.y < water.surface && rear.y >= water.surface - water.depth ? 15 : 0;
      break;
    }
    case 'farm_sensor': {
      const owner=w.voxels?.placedBy?.[key];
      signal=owner && Math.abs(rear.y-terrainHeight(w,rear.x,rear.z))<=1 ? farmMachineSignal(w,owner,rear.x,rear.z) : 0;
      break;
    }
    case 'farm_machine': {
      const owner=w.voxels?.placedBy?.[key], target=offset(cell,horizontal[direction]);
      signal=rawInput();
      if (owner && signal && state.tick%4===0 && Math.abs(target.y-terrainHeight(w,target.x,target.z))<=1) {
        changed=operateFarmMachine(w,owner,target.x,target.z,device.farmJob ?? 'harvest');
        if (changed) device.workTick=state.tick;
      }
      break;
    }
    case 'detector_rail': signal = Object.values(state.carts).some(cart => cart.cell === key) ? 15 : 0; break;
    case 'crystal_inverter': signal = delayed(device, state.tick, receiveRear() ? 0 : 15); break;
    case 'crystal_repeater': signal = delayed(device, state.tick, receiveRear() ? 15 : 0, device.delay || 1); break;
    case 'crystal_comparator': {
      const main = Math.max(receiveRear(), readStorage(w, rear));
      const side = Math.max(receive(w, state, offset(cell, horizontal[(direction + 1) & 3]), cell),
        receive(w, state, offset(cell, horizontal[(direction + 3) & 3]), cell));
      signal = delayed(device, state.tick, device.mode === 'subtract' ? Math.max(0, main - side) : main >= side ? main : 0);
      break;
    }
    case 'crystal_observer': {
      const seen = keyOf(rear);
      const observation = [at(w, rear) ?? 'air', state.devices[seen]?.signal || 0,
        state.devices[seen]?.opened ? 1 : 0, readStorage(w, rear)].join(':');
      if (device.observed !== undefined && device.observed !== observation) {
        device.until = state.tick + 2;
        changed = true;
      }
      device.observed = observation;
      signal = (device.until || 0) > state.tick ? 15 : 0;
      break;
    }
    case 'signal_gate':
    case 'fence_gate':
    case 'trapdoor':
    case 'iron_door':
    case 'steel_shutter':
    case 'drawbridge': {
      signal = rawInput();
      const open = !!signal || manuallyOpenedGate(kind)&&!!device.enabled || !!device.opened && movingGateOccupied(w, cell);
      if (!!device.opened !== open) { device.opened = open; changed = true; }
      break;
    }
    case 'piston':
    case 'sticky_piston':
      signal = rawInput();
      changed = updatePiston(w, state, work, cell, kind, device, signal);
      break;
    case 'crystal_beacon': {
      signal = 0;
      const color = device.enabled ? beaconBeamColor(w,cell) : null;
      const tier = color ? beaconBaseTier(w,cell) : 0;
      if ((device.tier || 0) !== tier) { device.tier = tier; changed = true; }
      const beamColor=tier&&color ? color : undefined;
      if(device.beamColor!==beamColor){device.beamColor=beamColor;changed=true;}
      break;
    }
    case 'hopper':
    case 'dropper':
    case 'dispenser':
    case 'item_pipe':
    case 'conveyor':
    case 'item_sorter':
    case 'item_collector':
    case 'auto_furnace':
    case 'auto_crafter':
    case 'blast_furnace':
    case 'smoker':
    case 'stonecutter':
    case 'auto_composter':
    case 'auto_brewer':
      signal = rawInput();
      if (isProcessor(kind) && PROCESSOR[kind].pulse && signal && !device.signal) device.requested = true;
      changed = updateLogistics(w, state, work, cell, kind, device, signal);
      break;
    case 'note_block':
      signal = rawInput();
      if (signal && (!device.signal || device.notePeriod && state.tick-(device.played ?? 0)>=device.notePeriod)) {
        device.played=state.tick;
        changed=true;
      }
      break;
    default: signal = rawInput();
  }
  if (signal !== device.signal) {
    if (kind==='crystal_inverter') device.signalChanges=Math.min(255,(device.signalChanges??0)+1);
    device.signal = signal;
    // Only an emitting component can change its neighbors' inputs.
    if (outputs.has(kind)) markNearby(work, state, cell);
    return true;
  }
  return changed;
}

export function inspectMachine(w: World, x: number, y: number, z: number) {
  const key = voxelKey(x, y, z);
  const state=stateOf(w);
  const device = state?.devices[key];
  const entry = Object.entries(state?.carts ?? {}).find(([,cart])=>cart.cell===key);
  const cart=entry?.[1];
  const trailer=entry&&state ? trailerFor(state,entry[0]) : undefined;
  const locomotive=cart?.coupledTo ? state?.carts[cart.coupledTo] : undefined;
  return { device, cart, cartId:entry?.[0], trailer, locomotive, rotation:rotationAt(w,key), owner:w.voxels?.placedBy?.[key] };
}

export function circuitConnections(w:World,cell:MachineCell) {
  const state=stateOf(w);
  if (!state) return [];
  const cables=kindAt(w,keyOf(cell))==='crystal_wire';
  return (cables?[...sides,...steps]:sides).flatMap(dir=>{
    const neighbor=offset(cell,dir), block=kindAt(w,keyOf(neighbor));
    if (!isMachinePart(block)) return [];
    const stepped=dir[1]!==0 && (dir[0]!==0||dir[2]!==0);
    return [{...neighbor,block,input:receive(w,state,neighbor,cell,stepped),output:receive(w,state,cell,neighbor,stepped)}];
  });
}

function railSupported(w: World, cell: MachineCell) {
  return isRail(kindAt(w, keyOf(cell))) && solid(at(w, offset(cell, [0, -1, 0]))) &&
    bodyClear(w, cell.x, cell.z, cell.y);
}
export function railConnections(w: World, cell: MachineCell) {
  const key=keyOf(cell), buffer=kindAt(w,key)==='buffer_rail';
  return horizontal.flatMap((dir, direction) => (buffer&&rotationAt(w,key)!==direction?[]:[0,1,-1]).flatMap(dy => {
    const next = offset(cell, [dir[0], dy, dir[2]]);
    const nextKey=keyOf(next), part=kindAt(w,nextKey);
    if (part==='buffer_rail'&&rotationAt(w,nextKey)!==((direction+2)&3)) return [];
    return isRail(part) ? [{ ...next, direction }] : [];
  }));
}

export function connectedStations(w:World, start:MachineCell, behind?:string) {
  const root=keyOf(start), previous=new Map<string,string>();
  const stations:Array<{key:string;name:string|undefined}>=[];
  if (!railSupported(w,start)) return {previous,stations};
  const queue=[start];
  previous.set(root,root);
  for (let i=0;i<queue.length && i<768;i++) {
    const cell=queue[i], key=keyOf(cell);
    if (key!==root && kindAt(w,key)==='station_rail') {
      stations.push({key,name:stateOf(w)?.devices[key]?.stationName});
    }
    for (const next of railConnections(w,cell)) {
      const nextKey=keyOf(next);
      if (previous.has(nextKey)||key===root&&nextKey===behind||!railSupported(w,next)) continue;
      previous.set(nextKey,key);
      queue.push(next);
    }
  }
  return {previous,stations};
}

function routeTo(w:World, from:MachineCell, destination:string, behind?:string) {
  if (kindAt(w,destination)!=='station_rail') return [];
  const start=keyOf(from), {previous}=connectedStations(w,from,behind);
  let current=destination;
  const path:string[]=[];
  while(current!==start){
    const parent=previous.get(current);
    if (!parent||path.length>=768) return [];
    path.push(current);
    current=parent;
  }
  return path.reverse();
}
const cartRoutes=new WeakMap<Cart,{revision:number;path:string[]}>();

function normalizeTimetable(w:World, value:CartTimetable|null|undefined) {
  if (!value || !Array.isArray(value.stops) || value.stops.length<2 || value.stops.length>MAX_STOPS ||
    !whole(value.dwellSeconds,2,60) || new Set(value.stops).size!==value.stops.length ||
    !value.stops.every(stop=>typeof stop==='string' && positionKey.test(stop) && kindAt(w,stop)==='station_rail')) return undefined;
  return {stops:[...value.stops],dwellSeconds:value.dwellSeconds};
}

function nextTimetableStop(cart:Cart) {
  const {stops}=cart.timetable!;
  cart.destination=stops[(stops.indexOf(cart.cell)+1)%stops.length];
  cartRoutes.delete(cart);
}

function setRiderPosition(w: World, rider: Adventurer, cell: MachineCell) {
  rider.position3D = { x: cell.x + .5, y: cell.y, z: cell.z + .5, surface2D: rider.position3D?.surface2D, layered2D: rider.position3D?.layered2D };
  if (legacyRegion(cell.x, cell.z)) {
    rider.x = cell.x;
    rider.y = cell.z;
  }
}

function driveCarts(w: World, state: MachineryState) {
  let changed = false;
  for (const [id,cart] of Object.entries(state.carts)) {
    const rider = cart.rider ? w.players[cart.rider] : undefined;
    if (cart.rider && (!rider || rider.spectator || rider.nativeScene || rider.life?.indoors)) {
      delete cart.rider;
      cart.moving = false;
      changed = true;
    }
    if (cart.coupledTo) continue;
    const cell = fromKey(cart.cell);
    if (cart.kind === 'minecart_hopper' && !cart.moving && kindAt(w,cart.cell) === 'station_rail') {
      const atStation = state.devices[cart.cell];
      const direction = horizontal[rotationAt(w,cart.cell)];
      const cargo = cart.cargo ??= {};
      const source = containerAt(w,offset(cell,[0,2,0]),cart.owner);
      const target = containerAt(w,offset(cell,direction),cart.owner);
      if (!atStation?.signal) {
        const moved = !!target && moveItem(cargo,target,undefined,workFor(w,state).receivedItems);
        const collected = !!source && moveItem(source.items,{items:cargo,block:'cart'});
        if (moved || collected) {
          markNearby(workFor(w,state),state,cell);
          changed = true;
        }
      }
    }
    const stop = state.devices[cart.cell];
    const canDepart = cart.timetable ? state.tick>=cart.next && (!stop?.stationSignal || !!stop.signal) : !!stop?.signal;
    if (cart.waiting && canDepart && railSupported(w,cell)) {
      cart.waiting = false;
      cart.moving = true;
      changed = true;
    }
    if (!cart.moving || state.tick < cart.next) continue;
    if (!railSupported(w, cell)) { cart.moving = false; changed = true; continue; }
    const trailer=trailerFor(state,id), from=cart.cell, behind=trailer?.cell;
    if (behind && (!railSupported(w,fromKey(behind)) || !railConnections(w,cell).some(next=>keyOf(next)===behind))) {
      cart.moving=false;
      changed=true;
      continue;
    }
    const desired = state.devices[cart.cell]?.signal ? rotationAt(w, cart.cell) : cart.direction ?? rotationAt(w, cart.cell);
    const edges = railConnections(w,cell).filter(next=>keyOf(next)!==cart.previous&&keyOf(next)!==behind&&railSupported(w,next));
    let next: (typeof edges)[number] | undefined = edges.find(candidate => candidate.direction === desired) ??
      edges.find(candidate => candidate.direction === cart.direction) ?? edges[0];
    let route:ReturnType<typeof cartRoutes.get>;
    if (cart.destination) {
      route=cartRoutes.get(cart);
      if (!route || route.revision!==w.voxels!.revision || route.path[0]===behind) {
        route={revision:w.voxels!.revision,path:routeTo(w,cell,cart.destination,behind)};
        cartRoutes.set(cart,route);
      }
      // Routes may legally reverse when the switch must take the same rail back.
      next=railConnections(w,cell).find(candidate=>keyOf(candidate)===route.path[0]&&railSupported(w,candidate));
    }
    if (!next) { cart.moving=false; changed=true; continue; }
    if (movingGateOccupied(w,next) || trailer && movingGateOccupied(w,cell,rider?[rider]:[],cart)) {
      if (cart.timetable) cart.next=state.tick+2;
      else cart.moving=false;
      changed=true;
      continue;
    }
    route?.path.shift();
    const powered = kindAt(w, cart.cell) === 'powered_rail' && !!state.devices[cart.cell]?.signal;
    cart.previous = cart.cell;
    cart.cell = keyOf(next);
    if (kindAt(w,cart.cell)==='station_rail') state.devices[cart.cell].arrivedFrom=from;
    if (trailer && behind) {
      trailer.previous=behind;
      trailer.cell=from;
      trailer.direction=railConnections(w,fromKey(behind)).find(link=>keyOf(link)===from)?.direction;
      const passenger=trailer.rider?w.players[trailer.rider]:undefined;
      if (passenger) { setRiderPosition(w,passenger,cell); passenger.moveCount++; }
    }
    cart.direction = next.direction;
    cart.next = state.tick + (powered || cart.kind==='minecart_engine' ? 1 : next.y > cell.y ? 3 : 2);
    if (cart.cell===cart.destination) {
      cart.moving=false;
      cart.waiting=!!cart.timetable;
      if (cart.timetable) {
        recordCityRailArrival(w,cart.cell,cart.owner);
        nextTimetableStop(cart);
        cart.next=state.tick+cart.timetable.dwellSeconds*1000/STEP_MS;
      } else {
        delete cart.destination;
        cartRoutes.delete(cart);
      }
    } else if (kindAt(w,cart.cell)==='buffer_rail' || kindAt(w,cart.cell)==='trigger_rail' && state.devices[cart.cell]?.signal) {
      cart.moving=false;
      cart.waiting=false;
    } else if (kindAt(w, cart.cell) === 'station_rail' && !state.devices[cart.cell]?.signal &&
      (!cart.timetable || state.devices[cart.cell]?.stationSignal)) {
      cart.moving = false;
      cart.waiting = true;
    }
    if (rider) { setRiderPosition(w, rider, next); rider.moveCount++; }
    changed = true;
  }
  return changed;
}

/** Only authority calls this. Wires run through changed neighborhoods; timers advance one step, never offline catch-up. */
export function advanceMachinery(w: World, now: number) {
  const state = stateOf(w);
  if (!w.started || w.ended || !state || w.sandbox?.options.pauseMachines) return;
  const work = workFor(w, state);
  if (work.last !== undefined && now - work.last < STEP_MS) return;
  work.last = now;
  work.receivedItems.clear();
  state.tick++;
  let changed = driveCarts(w, state);
  const current = new Set([...work.active, ...work.dirty]);
  work.dirty.clear();
  let remaining = UPDATE_BUDGET;
  // Delayed components get one sample per simulation step. Only wires relax within the step.
  for (const key of [...current].sort()) {
    const device = state.devices[key], kind = kindAt(w, key);
    if (!device || !isMachinePart(kind)) continue;
    if (--remaining < 0) { work.dirty.add(key); continue; }
    if (updateDevice(w, state, work, key, device, kind)) changed = true;
  }
  while (remaining > 0) {
    const wires = [...work.dirty].filter(key => kindAt(w, key) === 'crystal_wire').sort();
    if (!wires.length) break;
    for (const key of wires) {
      if (remaining-- <= 0) break;
      work.dirty.delete(key);
      const device = state.devices[key];
      if (device && updateDevice(w, state, work, key, device, 'crystal_wire')) changed = true;
    }
  }
  const overloaded=remaining<=0 && work.dirty.size>0;
  if (overloaded!==!!state.overloaded) { state.overloaded=overloaded;changed=true; }
  if (changed) w.revision++;
}

export function applyMachineCommand(w: World, p: Adventurer, command: MachineCommand, now: number) {
  if (typeof command.command !== 'string' || !allowedCell(w, command) || now - (p.voxelDeviceAt || 0) < 180) return false;
  const state = stateOf(w);
  if (!state) return false;
  const key = keyOf(command), cell = fromKey(key), kind = kindAt(w, key), device = state.devices[key];
  const x = p.position3D?.x ?? p.x + .5, z = p.position3D?.z ?? p.y + .5;
  const distance = Math.hypot(x - cell.x - .5, z - cell.z - .5, playerHeight(w, p) - cell.y);
  if (distance > CART_REACH) return false;
  const owner = sameOwner(w, key, p.id);
  const cartEntry = Object.entries(state.carts).find(([, cart]) => cart.cell === key);
  const cart = cartEntry?.[1];
  const leavingCart=command.command==='cart-ride'&&cart?.rider===p.id;
  const vehicleOperation=command.command.startsWith('cart-');
  if (!leavingCart&&!sandboxAllows(w,p.id,cell,vehicleOperation?'cart':'device',cart?.owner)) return false;
  const trailer=cartEntry&&trailerFor(state,cartEntry[0]);
  const locomotive=cart?.coupledTo ? state.carts[cart.coupledTo] : undefined;
  const lp = lifePlayer(p);
  switch (command.command) {
    case 'waygate-link': {
      if (!owner || kind!=='waygate' || !device || typeof command.value!=='string') return false;
      if (command.value==='') { delete device.waygate; break; }
      if (!positionKey.test(command.value) || command.value===key || kindAt(w,command.value)!=='waygate' ||
        !sameOwner(w,command.value,p.id) || !sandboxAllows(w,p.id,fromKey(command.value),'device')) return false;
      device.waygate=command.value;
      break;
    }
    case 'waygate-travel': {
      if (w.gameMode!=='COOP'||kind!=='waygate'||!device?.signal||!device.waygate||ridingCart(w,p.id)) return false;
      const destination=fromKey(device.waygate);
      if (!allowedCell(w,destination) || kindAt(w,device.waygate)!=='waygate' || !state.devices[device.waygate]?.signal ||
        w.voxels?.placedBy?.[device.waygate]!==w.voxels?.placedBy?.[key] ||
        !sandboxAllows(w,p.id,destination,'device')) return false;
      const rot=rotationAt(w,device.waygate);
      const arrival=[rot,(rot+1)%4,(rot+3)%4,(rot+2)%4].flatMap(direction=>{
        const cell=offset(destination,horizontal[direction]), floor=floorAt(w,cell.x,cell.z,destination.y+1);
        const pool=voxelWater(w,cell.x,cell.z,floor??undefined);
        return floor!==null&&floor>=destination.y-1&&(!pool||floor>=pool.surface)&&!movingGateOccupied(w,{...cell,y:Math.floor(floor)})&&
          sandboxAllows(w,p.id,cell,'device') ? [{...cell,y:floor}] : [];
      })[0];
      if (!arrival) return false;
      const surface2D=p.position3D?.surface2D??true;
      p.position3D={x:arrival.x+.5,y:arrival.y,z:arrival.z+.5,surface2D,layered2D:surface2D};
      p.x=arrival.x;p.y=arrival.z;p.lastMove=now;
      break;
    }
    case 'cart-place': {
      const item = command.value ?? 'minecart';
      if (typeof item !== 'string' || !Object.hasOwn(CART_NAMES,item) ||
        cart || !railSupported(w, cell) || !lp.bag[item] ||
        !owner || Object.keys(state.carts).length >= MAX_CARTS) return false;
      lp.bag[item]!--;
      // One cart can occupy a rail segment. The ID stays stable as it moves.
      state.carts[key + ':' + state.tick] = { owner: p.id, kind: item, cell: key, moving: false, next: state.tick };
      break;
    }
    case 'cart-ride':
      if (!cart || locomotive?.moving || cart.rider && cart.rider !== p.id) return false;
      if (cart.rider === p.id) {
        const exits = horizontal.map(dir => offset(cell, dir));
        let exit = exits.find(pos => bodyClear(w, pos.x, pos.z, pos.y) && floorAt(w, pos.x, pos.z, pos.y + .05) === pos.y);
        if (!exit && railSupported(w, cell)) exit = cell;
        if (!exit) return false;
        setRiderPosition(w, p, exit);
        delete cart.rider;
        cart.moving = false;
        cart.waiting = false;
      } else {
        if (ridingCart(w, p.id) || !railSupported(w, cell)) return false;
        cart.rider = p.id;
        setRiderPosition(w, p, cell);
      }
      break;
    case 'cart-drive':
    case 'cart-stop':
      if (!cart || cart.coupledTo || (cart.rider ? cart.rider !== p.id : cart.owner !== p.id)) return false;
      cart.moving = command.command === 'cart-drive' && railSupported(w, cell);
      cart.waiting = false;
      // Reversing at a terminus is allowed when the next trip begins.
      if (cart.moving) {
        if (cart.timetable && !cart.destination) nextTimetableStop(cart);
        delete cart.previous;
        cart.next = state.tick + 1;
        if (cart.timetable && device?.stationSignal && !device.signal) { cart.moving=false; cart.waiting=true; }
      }
      break;
    case 'cart-route': {
      if (!cart || cart.coupledTo || cart.timetable || (cart.rider?cart.rider!==p.id:cart.owner!==p.id) ||
        typeof command.value!=='string' || command.value!==''&&!positionKey.test(command.value)) return false;
      if (!command.value) {
        delete cart.destination;
        cartRoutes.delete(cart);
        break;
      }
      const path=routeTo(w,cell,command.value,trailer?.cell);
      if (!path.length) return false;
      cart.destination=command.value;
      cartRoutes.set(cart,{revision:w.voxels!.revision,path});
      break;
    }
    case 'cart-timetable': {
      if (!cart || cart.coupledTo || cart.owner!==p.id || activeCart(cart) || cart.rider && cart.rider!==p.id) return false;
      if (command.value===null) {
        delete cart.timetable;
        delete cart.destination;
        cartRoutes.delete(cart);
        break;
      }
      const timetable=normalizeTimetable(w,command.value);
      if (!timetable) return false;
      const {previous}=connectedStations(w,cell,trailer?.cell);
      if (!timetable.stops.every(stop=>previous.has(stop))) return false;
      cart.timetable=timetable;
      nextTimetableStop(cart);
      break;
    }
    case 'cart-couple': {
      if (!cart || !cartEntry || cart.owner!==p.id || activeCart(cart) || activeCart(locomotive) ||
        typeof command.value!=='string') return false;
      if (!command.value) {
        if (trailer) delete trailer.coupledTo;
        else if (cart.coupledTo) delete cart.coupledTo;
        else return false;
        cartRoutes.delete(locomotive ?? cart);
        break;
      }
      const next=Object.hasOwn(state.carts,command.value) ? state.carts[command.value] : undefined;
      if (!next || next.owner!==p.id || next.coupledTo || cart.coupledTo || trailer || trailerFor(state,command.value) ||
        activeCart(next) || next.rider || !railSupported(w,cell) || !railSupported(w,fromKey(next.cell)) ||
        !railConnections(w,cell).some(link=>keyOf(link)===next.cell)) return false;
      next.coupledTo=cartEntry[0];
      delete next.destination;
      delete next.timetable;
      cartRoutes.delete(cart);
      break;
    }
    case 'cart-remove': {
      if (!cart || cart.owner!==p.id || cart.moving || cart.rider || cart.coupledTo || trailer || Object.values(cart.cargo ?? {}).some(Boolean)) return false;
      const item = cart.kind ?? 'minecart';
      delete state.carts[cartEntry![0]];
      lp.bag[item] = (lp.bag[item] || 0) + 1;
      break;
    }
    case 'cart-cargo': {
      const { amount, item, direction }=command;
      if (!cart || cart.owner!==p.id || cart.moving || locomotive?.moving || !cargoCart(cart.kind) ||
          !Object.hasOwn(ALL_MATERIAL_NAMES,item) || !whole(amount,1,64) ||
          direction!=='load' && direction!=='unload') return false;
      const cargo = cart.cargo ??= {};
      const from = direction==='load' ? lp.bag : cargo;
      const to = direction==='load' ? cargo : lp.bag;
      if ((from[item]||0)<amount || direction==='load' && !canStore(to,item,amount)) return false;
      from[item]! -= amount;
      if (!from[item]) delete from[item];
      to[item] = (to[item]||0) + amount;
      break;
    }
    case 'station-name': {
      if (!owner || kind!=='station_rail' || !device || typeof command.value!=='string') return false;
      const title = command.value.trim();
      if (!title || title.length>24 || /[\r\n\t\u0000-\u001f]/.test(title)) return false;
      device.stationName = title;
      break;
    }
    case 'station-signal':
      if (!owner || kind!=='station_rail' || !device) return false;
      device.stationSignal=!device.stationSignal;
      break;
    case 'farm-job':
      if (!owner || kind!=='farm_machine' || !device || !validFarmMachineJob(command.value)) return false;
      if (device.farmJob!==command.value) delete device.workTick;
      device.farmJob=command.value;
      break;
    case 'use':
      if (!device) return false;
      if (kind === 'crystal_lever' || manuallyOpenedGate(kind)) device.enabled = !device.enabled;
      else if (kind === 'crystal_button' || kind === 'wooden_button') device.until = state.tick + (kind === 'wooden_button' ? 8 : 4);
      else if (kind === 'crystal_beacon' && owner) {
        if (device.enabled) device.enabled = false;
        else {
          if (!(lp.bag.diamond || 0) || !beaconBeamColor(w,cell) || !beaconBaseTier(w,cell)) return false;
          lp.bag.diamond!--;
          device.enabled = true;
        }
      } else return false;
      break;
    case 'rotate':
      if (!device || !owner || ((kind === 'piston' || kind === 'sticky_piston') && device.opened)) return false;
      (w.voxels!.rotations ??= {})[key] = (rotationAt(w, key) + 1) & 3;
      w.voxels!.revision++;
      break;
    case 'piston-axis':
      if (!owner || !device || device.opened || (kind!=='piston' && kind!=='sticky_piston')) return false;
      device.vertical=!device.vertical;
      w.voxels!.revision++;
      break;
    case 'delay':
      if (kind !== 'crystal_repeater' || !device || !owner || !Number.isInteger(command.value) ||
        command.value < 1 || command.value > 4) return false;
      device.delay = command.value;
      delete device.pending;
      break;
    case 'sensor-range':
      if (kind!=='vibration_sensor'||!device||!owner||![2,4,6].includes(command.value)) return false;
      device.sensorRange=command.value;
      break;
    case 'mode':
      if (kind !== 'crystal_comparator' || !device || !owner || !['compare', 'subtract'].includes(command.value)) return false;
      device.mode = command.value;
      break;
    case 'filter':
      if (!kind || !isFilteredPart(kind) || !device || !owner || typeof command.value!=='string' ||
        (command.value !== '' && !Object.hasOwn(ALL_MATERIAL_NAMES, command.value))) return false;
      if (kind==='dispenser' && command.value && !canStore({},command.value as VoxelItem,1,kind)) return false;
      device.filter = command.value as VoxelItem || undefined;
      break;
    case 'recipe':
      if (!device || !owner || !kind || !canAutomate(kind, command.value)) return false;
      device.recipe = command.value;
      device.progress = 0;
      device.requested = false;
      break;
    case 'instrument':
      if (kind !== 'note_block' || !device || !owner || !['bell','wood','reed'].includes(command.value)) return false;
      device.instrument = command.value as NoteInstrument;
      break;
    case 'note':
      if (kind !== 'note_block' || !device || !owner || !Number.isInteger(command.value) ||
        command.value < 0 || command.value > 24) return false;
      device.note = command.value;
      break;
    case 'note-volume':
      if (kind!=='note_block'||!device||!owner||!Number.isInteger(command.value)||command.value<0||command.value>100) return false;
      device.noteGain=command.value;
      break;
    case 'note-repeat':
      if (kind!=='note_block'||!device||!owner||!NOTE_REPEATS.some(period=>period===command.value)) return false;
      device.notePeriod=command.value;
      if (device.notePeriod) workFor(w,state).active.add(key);
      else workFor(w,state).active.delete(key);
      break;
    default: return false;
  }
  p.voxelDeviceAt = now;
  markNearby(workFor(w, state), state, cell);
  w.revision++;
  return true;
}

const positionKey = /^-?\d{1,5},-?\d{1,4},-?\d{1,5}$/;
const whole = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max;
export function restoreMachinery(w: World) {
  const voxels = w.voxels, saved = voxels?.machinery;
  if (!voxels || saved === undefined) return;
  const tick = whole(saved?.tick, 0, Number.MAX_SAFE_INTEGER - 1000) ? saved.tick : 0;
  const devices: MachineryState['devices'] = {};
  for (const [key, block] of Object.entries(voxels.edits || {}).filter(([key, block]) => positionKey.test(key) && isMachinePart(block)).slice(0, MAX_DEVICES)) {
    const candidate = saved?.devices?.[key];
    const state = candidate && typeof candidate === 'object' ? candidate : { signal: 0 };
    const device: Device = { signal: whole(state.signal, 0, 15) ? state.signal : 0 };
    for (const flag of ['enabled', 'opened', 'blocked', 'requested'] as const) {
      if (typeof state[flag] === 'boolean') device[flag] = state[flag];
    }
    if (whole(state.until, 0, tick + 8)) device.until = state.until;
    if (whole(state.due, 0, tick + 4)) device.due = state.due;
    if (whole(state.pending, 0, 15)) device.pending = state.pending;
    if (whole(state.delay, 1, 4)) device.delay = state.delay;
    if (block === 'crystal_beacon' && device.enabled) {
      const pos=fromKey(key),color=beaconBeamColor(w,pos);
      device.tier=color?beaconBaseTier(w,pos):0;
      if(device.tier&&color)device.beamColor=color;
    }
    if ((block==='piston' || block==='sticky_piston') && state.vertical===true) device.vertical=true;
    if (isMachinePart(block)&&isProcessor(block)&&whole(state.progress,0,PROCESSOR[block].ticks)) device.progress=state.progress;
    if (whole(state.note, 0, 24)) device.note = state.note;
    if (block==='note_block'&&whole(state.noteGain,0,100)) device.noteGain=state.noteGain;
    if (block==='note_block'&&NOTE_REPEATS.some(period=>period===state.notePeriod)) device.notePeriod=state.notePeriod;
    if (block==='waygate'&&typeof state.waygate==='string'&&state.waygate!==key&&positionKey.test(state.waygate)&&
      voxels.edits[state.waygate]==='waygate'&&voxels.placedBy?.[state.waygate]===voxels.placedBy?.[key]) device.waygate=state.waygate;
    if (state.instrument && ['bell','wood','reed'].includes(state.instrument)) device.instrument = state.instrument;
    if (whole(state.played, 0, tick)) device.played = state.played;
    if (state.mode === 'compare' || state.mode === 'subtract') device.mode = state.mode;
    if (typeof state.observed === 'string' && state.observed.length < 100) device.observed = state.observed;
    if (typeof state.filter === 'string' && Object.hasOwn(ALL_MATERIAL_NAMES, state.filter)) device.filter = state.filter;
    if (typeof state.recipe === 'string' && canAutomate(block!, state.recipe)) device.recipe = state.recipe;
    if (block==='farm_machine'&&whole(state.workTick,0,tick))device.workTick=state.workTick;
    if (block==='station_rail' && typeof state.stationName==='string') device.stationName=state.stationName.slice(0,24);
    if (block==='station_rail' && state.stationSignal===true) device.stationSignal=true;
    if (block==='station_rail' && typeof state.arrivedFrom==='string' && positionKey.test(state.arrivedFrom)) device.arrivedFrom=state.arrivedFrom;
    if (block==='crystal_inverter' && whole(state.signalChanges,0,255)) device.signalChanges=state.signalChanges;
    if (block==='vibration_sensor' && state.sensorRange && [2,4,6].includes(state.sensorRange)) device.sensorRange=state.sensorRange;
    if (block==='farm_machine' && validFarmMachineJob(state.farmJob)) device.farmJob=state.farmJob;
    devices[key] = device;
  }
  const heads: MachineryState['heads'] = {};
  for (const [key, device] of Object.entries(devices)) {
    if (!device.opened || !['piston', 'sticky_piston'].includes(voxels.edits[key] ?? '')) continue;
    const cell = keyOf(offset(fromKey(key), device.vertical?[0,1,0]:horizontal[rotationAt(w,key)]));
    if (!voxels.edits[cell]) heads[cell] = key;
    else device.opened = false;
  }
  const carts: MachineryState['carts'] = {};
  const occupied = new Set<string>(), riders = new Set<string>();
  for (const [id, cart] of Object.entries(saved?.carts ?? {}).slice(0, MAX_CARTS)) {
    if (!/^[-0-9,:]+$/.test(id) || !cart || !positionKey.test(cart.cell) ||
      !allowedCell(w, fromKey(cart.cell)) || typeof cart.owner !== 'string' || occupied.has(cart.cell)) continue;
    occupied.add(cart.cell);
    const rail = isRail(voxels.edits[cart.cell]);
    const timetable=normalizeTimetable(w,cart.timetable);
    const restored: Cart = { owner: cart.owner.slice(0, 180), cell: cart.cell, moving: rail && cart.moving === true,
      next: whole(cart.next,0,tick+(timetable ? timetable.dwellSeconds*1000/STEP_MS : 3)) ? cart.next : tick+1 };
    if (timetable) restored.timetable=timetable;
    if (typeof cart.rider === 'string' && Object.hasOwn(w.players, cart.rider) && !riders.has(cart.rider)) {
      restored.rider = cart.rider;
      riders.add(cart.rider);
    }
    if (whole(cart.direction, 0, 3)) restored.direction = cart.direction;
    if (cart.previous && positionKey.test(cart.previous)) restored.previous = cart.previous;
    if (typeof cart.destination==='string' && positionKey.test(cart.destination) && voxels.edits[cart.destination]==='station_rail') {
      restored.destination=cart.destination;
    }
    if (typeof cart.kind==='string' && Object.hasOwn(CART_NAMES,cart.kind)) restored.kind=cart.kind;
    if (cargoCart(restored.kind)) {
      const cargo:Bag={};
      for (const [item,count] of Object.entries(cart.cargo ?? {})) {
        if (!Object.hasOwn(ALL_MATERIAL_NAMES,item) || !whole(count,1,64)) continue;
        cargo[item as VoxelItem]=count;
        if (Object.keys(cargo).length>=24) break;
      }
      restored.cargo=cargo;
    }
    if (voxels.edits[cart.cell]==='station_rail') restored.waiting=cart.waiting===true;
    carts[id] = restored;
  }
  const headIds=new Set<string>();
  for (const [id,cart] of Object.entries(carts)) {
    const headId=saved?.carts?.[id]?.coupledTo;
    const head=typeof headId==='string' && Object.hasOwn(carts,headId) ? carts[headId] : undefined;
    if (!headId || !head || headIds.has(headId) || saved?.carts?.[headId]?.coupledTo || cart.owner!==head.owner) continue;
    const a=fromKey(cart.cell), b=fromKey(head.cell);
    if (Math.abs(a.x-b.x)+Math.abs(a.z-b.z)!==1 || Math.abs(a.y-b.y)>1) continue;
    cart.coupledTo=headId;
    cart.moving=false;
    cart.waiting=false;
    headIds.add(headId);
  }
  voxels.machinery = { tick, devices, heads, carts };
}
