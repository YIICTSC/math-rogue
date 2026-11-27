import type { Adventurer, World } from './engine';
import type { Bag, LifePlayer } from './life';

export type SharedWorldState=Omit<World,'tiles'>;
type WirePlayer=Omit<Adventurer,'life'>&{life?:Omit<LifePlayer,'bag'>};
type WireState=Omit<SharedWorldState,'voxels'|'players'>&{players:Record<string,WirePlayer>};
type Voxels=NonNullable<World['voxels']>;
type Layout=Omit<Voxels,'edits'|'placedBy'|'rotations'|'containers'|'machinery'|'fluids'|'details'>&{
  placedBy?:true;
  rotations?:true;
  containers?:true;
  machinery?:Omit<NonNullable<Voxels['machinery']>,'devices'|'heads'|'carts'>;
  fluids?:true;
  details?:{gravity?:true;signs?:true};
};
type Bucket='edits'|'owners'|'rotation'|'containers'|'devices'|'heads'|'carts'|'sources'|'flows'|'bags'|'gravity'|'signs';
type Changes={set?:Record<string,unknown>;remove?:string[]};
export type DeltaPacket={type:'state-delta';base:number;state:WireState;layout?:Layout|null;changes:Partial<Record<Bucket,Changes>>};

function voxelLayout(voxels:Voxels|undefined):Layout|null {
  if(!voxels)return null;
  const {edits,placedBy,rotations,containers,machinery,fluids,details,...metadata}=voxels;
  let machine:Layout['machinery'];
  if(machinery){const {devices,heads,carts,...simulation}=machinery;machine=simulation;}
  return {...metadata,...(placedBy?{placedBy:true}:{}),...(rotations?{rotations:true}:{}),
    ...(containers?{containers:true}:{}),...(machine?{machinery:machine}:{}),...(fluids?{fluids:true}:{}),
    ...(details?{details:{...(details.gravity?{gravity:true}:{}),...(details.signs?{signs:true}:{})}}:{})};
}

function buckets(state:SharedWorldState) {
  const voxels=state.voxels;
  const machinery=voxels?.machinery, fluids=voxels?.fluids;
  const bags=Object.create(null) as Record<string,Bag>;
  for(const [id,player] of Object.entries(state.players))if(player.life)bags[id]=player.life.bag;
  return {edits:voxels?.edits,owners:voxels?.placedBy,rotation:voxels?.rotations,containers:voxels?.containers,
    devices:machinery?.devices,heads:machinery?.heads,carts:machinery?.carts,sources:fluids?.sources,flows:fluids?.cells,bags,
    gravity:voxels?.details?.gravity,signs:voxels?.details?.signs};
}

export class WorldDeltaWriter {
  private base=-1;
  private layout='';
  private encoded:Partial<Record<Bucket,Map<string,string>>>={};

  capture(snapshot:SharedWorldState):DeltaPacket|null {
    if(snapshot.revision===this.base)return null;
    const base=this.base;
    this.base=snapshot.revision;
    const nextLayout=voxelLayout(snapshot.voxels), json=JSON.stringify(nextLayout);
    const layoutChanged=json!==this.layout;
    this.layout=json;
    const changes:DeltaPacket['changes']={};
    for(const [name,data] of Object.entries(buckets(snapshot)) as [Bucket,Record<string,unknown>|undefined][]) {
      const previous=this.encoded[name];
      const next=new Map<string,string>();
      const set:[string,unknown][]=[];
      for(const [key,value] of Object.entries(data??{})) {
        const encoded=JSON.stringify(value);
        if(encoded===undefined)continue;
        next.set(key,encoded);
        if(previous?.get(key)!==encoded)set.push([key,value]);
      }
      const removed=previous?[...previous.keys()].filter(key=>!next.has(key)):[];
      if(set.length||removed.length)changes[name]={...(set.length?{set:Object.fromEntries(set)}:{}),...(removed.length?{remove:removed}:{})};
      this.encoded[name]=next;
    }
    if(base<0)return null;
    const {voxels,players,...light}=snapshot;
    const wire:WireState={...light,players:Object.fromEntries(Object.entries(players).map(([id,player])=>{
      const {life,...rest}=player;
      if(!life)return [id,rest];
      const {bag,...status}=life;
      return [id,{...rest,life:status}];
    }))};
    return {type:'state-delta',base,state:wire,...(layoutChanged?{layout:nextLayout}:{}),changes};
  }
}

function applyChanges<T>(current:Record<string,T>|undefined,change:Changes|undefined):Record<string,T> {
  if(!change)return current??{};
  const result={...current,...change.set} as Record<string,T>;
  for(const key of change.remove??[])if(Object.hasOwn(result,key))delete result[key];
  return result;
}

/** The shared revision orders complete snapshots and deltas on both room transports. */
export function applyWorldDelta(world:World,packet:DeltaPacket):SharedWorldState|null {
  if(packet.base!==world.revision||!packet.state||!packet.changes||packet.state.revision<=packet.base)return null;
  const layout=packet.layout===undefined?voxelLayout(world.voxels):packet.layout;
  const old=world.voxels, change=packet.changes;
  let voxels:Voxels|undefined;
  if(layout) {
    const {placedBy,rotations,containers,machinery,fluids,details,...metadata}=layout;
    voxels={...metadata,edits:applyChanges(old?.edits,change.edits)};
    if(placedBy)voxels.placedBy=applyChanges(old?.placedBy,change.owners);
    if(rotations)voxels.rotations=applyChanges(old?.rotations,change.rotation);
    if(containers)voxels.containers=applyChanges(old?.containers,change.containers);
    if(machinery)voxels.machinery={...machinery,devices:applyChanges(old?.machinery?.devices,change.devices),
      heads:applyChanges(old?.machinery?.heads,change.heads),carts:applyChanges(old?.machinery?.carts,change.carts)};
    if(fluids)voxels.fluids={sources:applyChanges(old?.fluids?.sources,change.sources),cells:applyChanges(old?.fluids?.cells,change.flows)};
    if(details)voxels.details={...(details.gravity?{gravity:applyChanges(old?.details?.gravity,change.gravity)}:{}),
      ...(details.signs?{signs:applyChanges(old?.details?.signs,change.signs)}:{})};
  }
  const previousBags=Object.create(null) as Record<string,Bag>;
  for(const [id,player] of Object.entries(world.players))if(player.life)previousBags[id]=player.life.bag;
  const bags=applyChanges(previousBags,change.bags);
  const players=Object.fromEntries(Object.entries(packet.state.players).map(([id,player])=>[
    id,player.life?{...player,life:{...player.life,bag:bags[id]??{}}}:player,
  ])) as World['players'];
  return {...packet.state,...(voxels?{voxels}:{}),players};
}
