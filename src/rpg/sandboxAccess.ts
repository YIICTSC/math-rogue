import type { Adventurer, World } from './engine';
import { MAP_HEIGHT, MAP_WIDTH } from './worldDimensions';

export const SANDBOX_OPTIONS={
  ownerEdits:['保護されている建材の持ち主だけが解体できる','Only builders can break their placed blocks','たてたひとだけがけんざいをこわせる'],
  ownerControls:['装置の操作を持ち主に限る','Restrict controls to device owners','そうちをつかえるのはもちぬしだけ'],
  ownerChests:['収納を持ち主に限る','Restrict storage to owners','しゅうのうをつかえるのはもちぬしだけ'],
  ownerCarts:['乗車を持ち主に限る','Restrict boarding to cart owners','のりものにのれるのはもちぬしだけ'],
  noFluids:['人工の水と溶岩を止める','Disable placed water and lava','おいたみずとようがんをとめる'],
  pauseMachines:['回路と鉄道を一時停止','Pause machinery and railways','かいろとてつどうをいちじていし'],
  noDuels:['対戦を無効にする','Disable duels','たいせんをとめる'],
} as const;
export type SandboxOption=keyof typeof SANDBOX_OPTIONS;
export type ZoneAccess='private'|'shared'|'protected';
export type ZoneInput={name:string;left:number;right:number;front:number;back:number;access:ZoneAccess;owner?:string};
type Zone=ZoneInput&{id:string};
export type SandboxEvent={id:number;name:string;actor:string;kind:'place'|'break'|'device'|'storage'|'fluid'|'blueprint'|'undo';
  tile?:{x:number;y:number;z:number};block?:string;undone?:true;before?:null};
export type SandboxState={options:Partial<Record<SandboxOption,true>>;zones:Zone[];history:SandboxEvent[];sequence:number};
export type SandboxAction=
  | {type:'voxel-admin';command:'option';option:SandboxOption;enabled:boolean}
  | {type:'voxel-admin';command:'zone';zone:ZoneInput}
  | {type:'voxel-admin';command:'remove-zone';id:string}
  | {type:'voxel-admin';command:'undo';id:number};
type Operation='build'|'break'|'device'|'storage'|'cart'|'fluid';
type Cell={x:number;y:number;z:number};

const MAX_ZONES=24, MAX_HISTORY=64;
const newState=():SandboxState=>({options:{},zones:[],history:[],sequence:0});
const optionsFor:Partial<Record<Operation,SandboxOption>>={break:'ownerEdits',device:'ownerControls',storage:'ownerChests',cart:'ownerCarts'};
const isZoneAccess=(value:unknown):value is ZoneAccess=>value==='private'||value==='shared'||value==='protected';
const contains=(zone:ZoneInput,x:number,z:number)=>x>=zone.left&&x<=zone.right&&z>=zone.front&&z<=zone.back;
const intersects=(a:ZoneInput,b:ZoneInput)=>a.left<=b.right&&a.right>=b.left&&a.front<=b.back&&a.back>=b.front;
export const sandboxHost=(w:World,player:string)=>w.gameMode==='COOP'&&(w.hostId??Object.keys(w.players)[0])===player;

export function sandboxAllows(w:World,actor:string,cell:Cell,operation:Operation,deviceOwner?:string) {
  const sandbox=w.sandbox;
  if (!sandbox) return true;
  const zone=sandbox.zones.find(region=>contains(region,cell.x,cell.z));
  if (operation==='fluid'&&sandbox.options.noFluids) return false;
  if (zone?.access==='protected'||zone?.access==='private'&&zone.owner!==actor) return false;
  if (zone?.access==='shared') return true;
  const option=optionsFor[operation];
  const owner=deviceOwner??w.voxels?.placedBy?.[`${cell.x},${cell.y},${cell.z}`];
  return !option||!sandbox.options[option]||!owner||owner===actor;
}

export function recordSandboxEvent(w:World,p:Adventurer,event:Omit<SandboxEvent,'id'|'actor'|'name'>) {
  if (w.gameMode!=='COOP'||!w.machineGeology&&!w.sandbox) return;
  const state=w.sandbox??=newState();
  state.history.push({...event,actor:p.id,name:p.name,id:++state.sequence});
  if (state.history.length>MAX_HISTORY) state.history.splice(0,state.history.length-MAX_HISTORY);
}

function normalizeZone(value:unknown):ZoneInput|null {
  const zone=value as ZoneInput;
  if (!zone||typeof zone.name!=='string'||!isZoneAccess(zone.access)) return null;
  const name=zone.name.trim();
  if (!name||name.length>24||/[\u0000-\u001f]/.test(name)) return null;
  const {left,right,front,back}=zone;
  if (![left,right,front,back].every(Number.isSafeInteger)||left<1||front<1||right>=MAP_WIDTH-1||back>=MAP_HEIGHT-1||
    left>right||front>back||right-left>23||back-front>23) return null;
  if (zone.access==='private'&&(typeof zone.owner!=='string'||!zone.owner||zone.owner.length>180)) return null;
  return {name,left,right,front,back,access:zone.access,owner:zone.access==='private'?zone.owner:undefined};
}

export function applySandboxSettings(w:World,p:Adventurer,action:SandboxAction) {
  if (p.spectator||!sandboxHost(w,p.id)) return false;
  if (action.command==='option') {
    if (!Object.hasOwn(SANDBOX_OPTIONS,action.option)||typeof action.enabled!=='boolean') return false;
    const state=w.sandbox??=newState();
    if (action.enabled) state.options[action.option]=true;
    else delete state.options[action.option];
  } else if (action.command==='zone') {
    const zone=normalizeZone(action.zone);
    if (!zone||zone.owner&&!Object.hasOwn(w.players,zone.owner)) return false;
    const state=w.sandbox??=newState();
    if (state.zones.length>=MAX_ZONES||state.zones.some(old=>intersects(zone,old))) return false;
    state.zones.push({...zone,id:`zone-${++state.sequence}`});
  } else if (action.command==='remove-zone') {
    const index=w.sandbox?.zones.findIndex(zone=>zone.id===action.id)??-1;
    if (index<0) return false;
    w.sandbox!.zones.splice(index,1);
  } else return false;
  w.revision++;
  return true;
}

export function restoreSandboxSettings(w:World) {
  const saved=w.sandbox;
  if (!saved) return;
  const state=newState();
  for (const key of Object.keys(SANDBOX_OPTIONS) as SandboxOption[]) if (saved.options?.[key]===true) state.options[key]=true;
  if (Array.isArray(saved.zones)) for (const row of saved.zones.slice(0,MAX_ZONES)) {
    const zone=normalizeZone(row);
    if (zone&&typeof row.id==='string'&&/^zone-\d+$/.test(row.id)&&!state.zones.some(old=>old.id===row.id||intersects(zone,old))) state.zones.push({...zone,id:row.id});
  }
  if (Array.isArray(saved.history)) state.history=saved.history.slice(-MAX_HISTORY).filter(event=>
    !!event&&Number.isSafeInteger(event.id)&&event.id>0&&typeof event.actor==='string'&&typeof event.name==='string'&&
    ['place','break','device','storage','fluid','blueprint','undo'].includes(event.kind)&&
    (!event.tile||[event.tile.x,event.tile.y,event.tile.z].every(Number.isSafeInteger)));
  state.sequence=Math.max(0,Number.isSafeInteger(saved.sequence)?saved.sequence:0,...state.history.map(event=>event.id),...state.zones.map(zone=>Number(zone.id.slice(5))));
  w.sandbox=state;
}
