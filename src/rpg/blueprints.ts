import type { Adventurer, World } from './engine';
import type { MachineCell } from './machinery';
import { canAddMachinePart, machineCarts, machineStorage, recordMachineEdit } from './machinery';
import { isMachinePart } from './machineryParts';
import { applyVoxel, blockAt, MAX_HEIGHT, MIN_DEPTH, playerHeight, protectedVoxel, voxelKey, type Block } from './voxel';
import { CATALOG_BLOCKS } from './voxelCatalog';
import { canAfford, lifePlayer, type Bag } from './life';
import { energyOf } from './energy';
import { farmBusy } from './farm/model';
import { sandboxAllows } from './sandboxAccess';

const LIMIT = 48;
const SIDE = 8;
export type BlueprintCell = MachineCell & {block:Block;rotation:number};
export type Blueprint = {version:1;name:string;cells:BlueprintCell[]};
export type BlueprintReceipt = BlueprintCell & {previouslyEdited:boolean};
export type BlueprintPreview = {origin:MachineCell;pattern:Blueprint};
export type BlueprintAction = (MachineCell & {type:'voxel-blueprint';command:'place';pattern:Blueprint})
  | (MachineCell & {type:'voxel-blueprint';command:'demolish';size:MachineCell})
  | {type:'voxel-blueprint';command:'undo'};
const key=(cell:MachineCell)=>voxelKey(cell.x,cell.y,cell.z);
const catalogue=new Set<string>(CATALOG_BLOCKS);

export function normalizeBlueprint(input:unknown):Blueprint|null {
  const value=input as Blueprint|undefined;
  if(!value||value.version!==1||typeof value.name!=='string'||!Array.isArray(value.cells)||!value.cells.length||value.cells.length>LIMIT)return null;
  const name=value.name.trim();
  if(!name||name.length>32||/[\u0000-\u001f]/.test(name))return null;
  const cells:BlueprintCell[]=[],seen=new Set<string>();
  for(const cell of value.cells){
    if(!cell||![cell.x,cell.y,cell.z].every(n=>Number.isInteger(n)&&n>=0&&n<SIDE)||
      !Number.isInteger(cell.rotation)||cell.rotation<0||cell.rotation>3||typeof cell.block!=='string'||!catalogue.has(cell.block))return null;
    const id=key(cell);
    if(seen.has(id))return null;
    seen.add(id);
    cells.push({x:cell.x,y:cell.y,z:cell.z,block:cell.block,rotation:cell.rotation});
  }
  cells.sort((a,b)=>a.y-b.y||a.z-b.z||a.x-b.x);
  return {version:1,name,cells};
}

function distance(w:World,p:Adventurer,cell:MachineCell) {
  return Math.hypot(cell.x+.5-(p.position3D?.x??p.x+.5),cell.y+.5-playerHeight(w,p)-1.6,cell.z+.5-(p.position3D?.z??p.y+.5));
}

export function captureBlueprint(w:World,p:Adventurer,base:MachineCell,size:MachineCell,name:string) {
  if(![base.x,base.y,base.z].every(Number.isSafeInteger)||![size.x,size.y,size.z].every(n=>Number.isInteger(n)&&n>=1&&n<=SIDE)||
    distance(w,p,base)>4.5)return null;
  const cells:BlueprintCell[]=[];
  for(let y=0;y<size.y;y++)for(let z=0;z<size.z;z++)for(let x=0;x<size.x;x++){
    const spot={x:base.x+x,y:base.y+y,z:base.z+z}, id=key(spot);
    const block=w.voxels?.edits[id];
    if(!block)continue;
    if(w.voxels?.placedBy?.[id]!==p.id||protectedVoxel(w,spot.x,spot.z)||!sandboxAllows(w,p.id,spot,'build'))return null;
    cells.push({x,y,z,block,rotation:w.voxels.rotations?.[id]??0});
  }
  return normalizeBlueprint({version:1,name,cells});
}

export function transformBlueprint(pattern:Blueprint,turns:number,mirror:boolean):Blueprint {
  let cells=pattern.cells.map(cell=>({...cell}));
  if(mirror){
    const width=Math.max(...cells.map(cell=>cell.x));
    cells=cells.map(cell=>({...cell,x:width-cell.x,rotation:(4-cell.rotation)&3}));
  }
  for(let i=0;i<(turns&3);i++){
    const depth=Math.max(...cells.map(cell=>cell.z));
    cells=cells.map(cell=>({...cell,x:depth-cell.z,z:cell.x,rotation:(cell.rotation+1)&3}));
  }
  return {...pattern,cells};
}

export function blueprintCost(pattern:Blueprint) {
  const cost:Bag={};
  for(const {block} of pattern.cells)cost[block]=(cost[block]||0)+1;
  return cost;
}

export const blueprintPoint=(origin:MachineCell,cell:BlueprintCell):BlueprintCell=>({...cell,x:origin.x+cell.x,y:origin.y+cell.y,z:origin.z+cell.z});

function removeBlueprint(w:World,p:Adventurer,receipt:BlueprintReceipt[]) {
  const voxels=w.voxels;
  if(!voxels||!receipt.length||receipt.length>LIMIT)return false;
  const touched=new Set(receipt.map(key));
  for(const cell of receipt){
    const id=key(cell);
    if(distance(w,p,cell)>4.5||protectedVoxel(w,cell.x,cell.z)||!sandboxAllows(w,p.id,cell,'break')||voxels.placedBy?.[id]!==p.id||
       voxels.edits[id]!==cell.block||(voxels.rotations?.[id]??0)!==cell.rotation)return false;
    if(machineStorage(cell.block)&&Object.values(voxels.containers?.[id]?.items??{}).some(Boolean))return false;
    if((cell.block==='piston'||cell.block==='sticky_piston')&&voxels.machinery?.devices[id]?.opened)return false;
    const above=voxelKey(cell.x,cell.y+1,cell.z);
    if(!touched.has(above)&&voxels.edits[above])return false;
    if(Object.values(w.players).some(q=>!q.spectator&&!q.life?.indoors&&Math.floor(q.position3D?.x??q.x)===cell.x&&
      Math.floor(q.position3D?.z??q.y)===cell.z&&Math.abs(playerHeight(w,q)-cell.y-1)<.15))return false;
    if(machineCarts(w).some(cart=>cart.cell===id))return false;
  }
  const life=lifePlayer(p);
  delete life.blueprintReceipt;
  for(const cell of receipt){
    const id=key(cell);
    recordMachineEdit(w,cell.x,cell.y,cell.z,cell.block,null);
    if(cell.previouslyEdited)voxels.edits[id]=null;
    else delete voxels.edits[id];
    if(voxels.placedBy)delete voxels.placedBy[id];
    if(voxels.rotations)delete voxels.rotations[id];
    if(voxels.containers)delete voxels.containers[id];
    life.bag[cell.block]=(life.bag[cell.block]||0)+1;
  }
  voxels.revision++;
  w.revision++;
  return true;
}

/** A paste is first applied to a private draft using normal placement rules and costs. */
export function applyBlueprint(w:World,p:Adventurer,action:BlueprintAction,now:number) {
  if(w.gameMode!=='COOP'||farmBusy(w,p)||p.life?.indoors||now-(p.life?.workshopAt||0)<500)return false;
  const life=lifePlayer(p);
  if(action.command==='undo'){
    if(!life.blueprintReceipt||!removeBlueprint(w,p,life.blueprintReceipt))return false;
    life.workshopAt=now;
    return true;
  }
  if(action.command==='demolish'){
    if(!action.size)return false;
    const selected=captureBlueprint(w,p,action,action.size,'Removal');
    if(!selected)return false;
    const cost=selected.cells.length*.1;
    if(energyOf(life)+1e-8<cost)return false;
    const receipt=selected.cells.map(cell=>({...blueprintPoint(action,cell),previouslyEdited:true}));
    if(!removeBlueprint(w,p,receipt))return false;
    life.energy=Math.round((energyOf(life)-cost)*100)/100;
    life.workshopAt=now;
    return true;
  }
  if(action.command!=='place'||![action.x,action.y,action.z].every(Number.isSafeInteger))return false;
  const pattern=normalizeBlueprint(action.pattern);
  if(!pattern||!canAfford(life.bag,blueprintCost(pattern))||energyOf(life)+1e-8<pattern.cells.length*.1)return false;
  const receipt=pattern.cells.map(cell=>{
    const pos=blueprintPoint(action,cell);
    return {...pos,previouslyEdited:Object.hasOwn(w.voxels?.edits??{},key(pos))};
  });
  if(receipt.some(cell=>cell.y<=MIN_DEPTH||cell.y>MAX_HEIGHT||protectedVoxel(w,cell.x,cell.z)||!sandboxAllows(w,p.id,cell,'build')||
    distance(w,p,cell)>4.5||!!blockAt(w,cell.x,cell.y,cell.z)))return false;
  if(receipt.some(cell=>isMachinePart(cell.block))&&!canAddMachinePart(w))return false;
  // The room remains unchanged when a later cell fails its collision or support check.
  const draft=structuredClone(w), builder=draft.players[p.id];
  for(const cell of receipt){
    builder.voxelAt=now-221;
    applyVoxel(draft,builder,{type:'voxel-place',...cell},now);
    if(draft.voxels?.edits[key(cell)]!==cell.block)return false;
  }
  w.voxels=draft.voxels;
  life.bag=builder.life!.bag;
  life.energy=builder.life!.energy;
  life.workshopAt=now;
  life.blueprintReceipt=receipt;
  p.voxelAt=now;
  for(const [id,player]of Object.entries(w.players)){
    if(player.position3D)player.position3D=draft.players[id].position3D;
  }
  w.revision++;
  return true;
}
