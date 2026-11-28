import type { Adventurer, Site, World } from './engine';
import { lifePlayer, type LifeWorld } from './life';
import { machineSignal, restoreMachinery, ridingCart } from './machinery';
import { restoreFluids } from './placedFluids';
import { REALMS, REALM_ARENA, REALM_GATE, REALM_SENTRIES, inRealm, realmFloorAnchor, realmId, realmProtected, realmTiles, type RealmId } from './realmTerrain';
import { restoreSandboxSettings, sandboxAllows, type SandboxState } from './sandboxAccess';
import { restoreTransport, traveling, type TransportState } from './transport';
import { BLOCKS, MAX_HEIGHT, MIN_DEPTH, blockAt, bodyClear, floorAt, playerHeight, terrainHeight, voxelKey, voxelWater, type VoxelWorld } from './voxel';
import type { VoxelItem } from './voxelCatalog';
import { legacyRegion, landscapeRegion } from './worldLandscape';

type PortalCell={x:number;y:number;z:number};
type SitePosition={x:number;z:number};
export type RealmVisit={id:RealmId;home:PortalCell};
export type RealmState={
  voxels:VoxelWorld;
  sites:Site[];
  nodes:LifeWorld['nodes'];
  sandbox?:SandboxState;
  transport?:TransportState;
};
export type RealmAction=
  | (PortalCell & {type:'voxel-dimension';command:'enter'})
  | {type:'voxel-dimension';command:'return'|'reward'};

export const resolveWorldSite=(world:World|undefined,id:string)=>world?.sites.find(site=>site.id===id)
  ?? Object.values(world?.realms??{}).flatMap(realm=>realm.sites).find(site=>site.id===id);
export const realmName=(id:RealmId,language:string)=>REALMS[id].name[language==='ENGLISH'?1:language==='HIRAGANA'?2:0];
export const realmSiteId=(id:RealmId,index:number)=>`realm-${id}-${index}`;

function newSites(id:RealmId):Site[] {
  return [REALM_ARENA,...REALM_SENTRIES].map((point,index)=>({
    id:realmSiteId(id,index),dimension:id,dimensionIndex:index,
    x:point.x,y:point.z,kind:'enemy',name:index?REALMS[id].sentries[index-1][0]:REALMS[id].guardian[0],
    hp:0,maxHp:0,cleared:false,
  }));
}

function newRealm(id:RealmId):RealmState {
  return {voxels:{revision:0,edits:{},terrainVersion:2,placedBy:{},rotations:{}},sites:newSites(id),nodes:{}};
}

const projections=new WeakMap<World,Map<RealmId|'main',World>>();
const freshOptions:SandboxState['options']={};
export function realmView(root:World,id?:RealmId) {
  if(root.dimensionId||!root.realms)return root;
  const state=id===undefined?undefined:root.realms[id];
  if(!state&&!Object.values(root.players).some(player=>player.realm))return root;
  let worlds=projections.get(root);
  if(!worlds){worlds=new Map();projections.set(root,worlds);}
  const key=id??'main',projection=worlds.get(key)??{...root};
  worlds.set(key,projection);
  const players=Object.fromEntries(Object.entries(root.players).filter(([,player])=>player.realm?.id===id));
  if(!id||!state)return Object.assign(projection,root,{players});
  const options=root.sandbox?.options??freshOptions;
  const sandbox=state.sandbox?{...state.sandbox,options}:root.sandbox?{options,zones:[],history:[],sequence:0}:undefined;
  return Object.assign(projection,root,{
    dimensionId:id,realms:undefined,players,tiles:realmTiles(id,root.seed),sites:state.sites,
    voxels:state.voxels,transport:state.transport,life:{...root.life,nodes:state.nodes,houses:[],games:{}},
    terrainStyle:undefined,terrainPeaks:undefined,caverns:undefined,city:undefined,
    town:undefined,social:undefined,farm:undefined,packAnimals:undefined,voxelRooms:undefined,sandbox,
  });
}

export function commitRealm(root:World,id:RealmId,view:World) {
  const state=root.realms?.[id];
  if(!state||view===root)return;
  state.voxels=view.voxels!;
  state.transport=view.transport;
  state.nodes=view.life.nodes;
  state.sites=view.sites;
  if(view.sandbox&&(view.sandbox.history.length||view.sandbox.zones.length)) {
    state.sandbox={...view.sandbox,options:{}};
  } else delete state.sandbox;
  root.revision=view.revision;
  root.logs=view.logs;
}

function setLocation(p:Adventurer,x:number,y:number,z:number,surface2D:boolean,now:number) {
  p.position3D={x,y,z,surface2D,layered2D:surface2D};
  p.x=Math.floor(x);
  p.y=Math.floor(z);
  p.lastMove=now;
}

const distance=(p:Adventurer,q:SitePosition)=>Math.hypot((p.position3D?.x??p.x+.5)-q.x-.5,(p.position3D?.z??p.y+.5)-q.z-.5);
const closeToGate=(w:World,p:Adventurer)=>distance(p,REALM_GATE)<=2.85&&Math.abs(playerHeight(w,p)-realmFloorAnchor(w.dimensionId!))<2.25;
export const realmReturnReach=(w:World,p:Adventurer)=>!!w.dimensionId&&closeToGate(w,p);

export function realmBattleReach(w:World,p:Adventurer,site:Site) {
  return site.dimension===w.dimensionId&&site.dimension===p.realm?.id&&Math.abs(playerHeight(w,p)-terrainHeight(w,site.x,site.y))<2.2;
}

export function realmReturn(root:World,p:Adventurer,now:number) {
  const home=p.realm?.home;
  if(!home)return false;
  const range=(last:number)=>Array.from({length:last*2+1},(_,i)=>i-last);
  function clear(base:PortalCell,max:number){
    for(let radius=0;radius<=max;radius++)for(const dx of range(radius))for(const dz of range(radius)){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
      const x=Math.floor(base.x)+dx,z=Math.floor(base.z)+dz;
      const elevation=Math.max(base.y+1,terrainHeight(root,x,z)+1);
      const floor=floorAt(root,x,z,elevation);
      const pool=floor===null?null:voxelWater(root,x,z,floor);
      if(floor!==null&&Math.abs(floor-base.y)<8&&(!pool||floor>=pool.surface)&&
        sandboxAllows(root,p.id,{x,y:Math.floor(floor),z},'device')&&
        !Object.values(root.players).some(player=>!player.realm&&player.id!==p.id&&player.x===x&&player.y===z))return {x:x+.5,y:floor,z:z+.5};
    }
  }
  const town=root.sites.find(site=>site.kind==='town');
  const exit=clear(home,5)??(town&&clear({x:town.x,y:terrainHeight(root,town.x,town.y),z:town.y},5));
  if(!exit)return false;
  setLocation(p,exit.x,exit.y,exit.z,p.position3D?.surface2D??true,now);
  delete p.realm;
  p.message='地上のワールドに戻りました。';
  root.revision++;
  return true;
}

export function applyRealmTravel(root:World,p:Adventurer,action:RealmAction,now:number) {
  if(root.gameMode!=='COOP'||!root.started||root.ended||p.spectator||p.nativeScene||p.life?.indoors||p.life?.work||
    p.duelId||p.dungeonId||p.arcadePending||root.town?.encounters?.[p.id]||root.town?.cooking[p.id]||
    root.activities.trades.some(trade=>trade.from===p.id||trade.to===p.id))return false;
  if(p.realm){
    const id=p.realm.id,view=realmView(root,id);
    if(traveling(view,p)||ridingCart(view,p.id))return false;
    if(action.command==='return')return closeToGate(view,p)&&realmReturn(root,p,now);
    if(action.command!=='reward'||distance(p,REALM_ARENA)>2.5||!realmBattleReach(view,p,view.sites[0])||!view.sites[0]?.cleared)return false;
    const claimed=p.voxelDiscoveries??=[],record=`realm-cache-${id}`;
    if(claimed.includes(record))return false;
    const bag=lifePlayer(p).bag;
    for(const [item,amount] of Object.entries(REALMS[id].reward) as [VoxelItem,number][]){
      bag[item]=(bag[item]??0)+amount;
    }
    claimed.push(record);
    p.message='守護者の宝を受け取りました。';
    root.revision++;
    return true;
  }
  if(action.command!=='enter'||traveling(root,p)||ridingCart(root,p.id))return false;
  const {x,y,z}=action;
  if(![x,y,z].every(Number.isSafeInteger)||y<MIN_DEPTH||y>MAX_HEIGHT||
    distance(p,{x,z})>3.5||Math.abs(playerHeight(root,p)-y)>2.6||blockAt(root,x,y,z)!=='waygate'||
    !sandboxAllows(root,p.id,{x,y,z},'device')||!machineSignal(root,x,y,z))return false;
  const id=root.voxels?.machinery?.devices[voxelKey(x,y,z)]?.realm;
  if(!realmId(id))return false;
  const base=root.realms??={};
  base[id]??=newRealm(id);
  const view=realmView(root,id);
  const height=realmFloorAnchor(id);
  const candidates=[{x:REALM_GATE.x,z:REALM_GATE.z+1},{x:REALM_GATE.x-1,z:REALM_GATE.z},
    {x:REALM_GATE.x+1,z:REALM_GATE.z},{x:REALM_GATE.x,z:REALM_GATE.z-1}];
  const arrival=candidates.find(cell=>bodyClear(view,cell.x,cell.z,height)&&!Object.values(view.players).some(player=>
    player.x===cell.x&&player.y===cell.z));
  if(!arrival)return false;
  const home={x:p.position3D?.x??p.x+.5,y:playerHeight(root,p),z:p.position3D?.z??p.y+.5};
  p.realm={id,home};
  setLocation(p,arrival.x+.5,height,arrival.z+.5,p.position3D?.surface2D??true,now);
  p.message='新しい世界に到着しました。';
  root.revision++;
  return true;
}

export function restoreRealms(root:World,now:number) {
  if(!root.realms&&!Object.values(root.players).some(player=>player.realm))return;
  const saved=root.realms??{};
  root.realms={};
  for(const [id,raw] of Object.entries(saved)){
    if(!realmId(id)||!raw?.voxels||typeof raw.voxels.edits!=='object'||!raw.voxels.edits)continue;
    const state=newRealm(id);
    state.voxels={...raw.voxels,edits:{},terrainVersion:2,placedBy:{},rotations:{}};
    for(const [key,block] of Object.entries(raw.voxels.edits).slice(0,18000)){
      if(!/^\d{1,3},-?\d{1,3},\d{1,3}$/.test(key)||block!==null&&!BLOCKS.includes(block))continue;
      const [x,y,z]=key.split(',').map(Number);
      if(realmProtected(x,z)||y<=MIN_DEPTH||y>MAX_HEIGHT)continue;
      state.voxels.edits[key]=block;
      const owner=raw.voxels.placedBy?.[key],rotation=raw.voxels.rotations?.[key];
      if(typeof owner==='string'&&owner.length<=180)state.voxels.placedBy![key]=owner;
      if(Number.isInteger(rotation)&&rotation!>=0&&rotation!<=3)state.voxels.rotations![key]=rotation!;
    }
    state.sites=state.sites.map(site=>{
      const old=Array.isArray(raw.sites)?raw.sites.find(entry=>entry?.id===site.id):undefined;
      if(!old?.nativeInitialized||!Number.isFinite(old.maxHp)||!Number.isFinite(old.hp)||old.maxHp<=0||old.maxHp>1000000)return site;
      return {...site,nativeInitialized:true,maxHp:old.maxHp,hp:Math.max(0,Math.min(old.maxHp,old.hp)),cleared:old.cleared===true&&old.hp===0};
    });
    state.sandbox=raw.sandbox;
    state.transport=raw.transport;
    state.nodes={};
    root.realms[id]=state;
  }
  for(const p of Object.values(root.players)){
    const visit=p.realm,pos=p.position3D;
    if(!visit)continue;
    if(!realmId(visit.id)||!root.realms[visit.id]||!pos||!inRealm(pos.x,pos.z)||!Number.isFinite(pos.y)||pos.y!<MIN_DEPTH||pos.y!>MAX_HEIGHT+2||
      !visit.home||![visit.home.x,visit.home.y,visit.home.z].every(Number.isFinite)||
      !legacyRegion(visit.home.x,visit.home.z)&&!landscapeRegion(visit.home.x,visit.home.z)){
      const town=root.sites.find(site=>site.kind==='town');
      delete p.realm;
      if(town)setLocation(p,town.x+.5,terrainHeight(root,town.x,town.y),town.y+.5,true,now);
      else delete p.position3D;
    }
  }
  for(const id of Object.keys(root.realms) as RealmId[]){
    const view=realmView(root,id);
    restoreSandboxSettings(view);
    if(view.sandbox&&root.sandbox)view.sandbox.options=root.sandbox.options;
    restoreMachinery(view);
    restoreFluids(view);
    restoreTransport(view,now);
    commitRealm(root,id,view);
  }
}
