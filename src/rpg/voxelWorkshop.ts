import { canStore, cartWorkbench, machineStorage, markMachineNeighbor } from './machinery';
import type {World,Adventurer} from './engine';
import {WIDTH,HEIGHT} from './engine';
import {blockAt,playerHeight,voxelKey,voxelWater} from './voxel';
import {lifePlayer,canAfford,type Bag} from './life';
import {energyOf} from './energy';
import {farmBusy,farmOf} from './farm/model';
import {cropById} from './farm/catalog';
import {terrainHeight} from './voxel';
import {IMPRINTS,POTIONS,WORKSHOP_TOOLS,potionSeconds,type ExplorationPotion,type ToolImprint} from './explorationEquipment';
import { sandboxAllows } from './sandboxAccess';
import {ALL_MATERIAL_NAMES,WORKSHOP_RECIPES,TOOL_RANK,type VoxelItem,type WorkshopRecipe,type ToolKind,type ToolTier} from './voxelCatalog';

export type WorkshopAction={type:'voxel-craft';recipe:string;amount:number}|{type:'voxel-storage';x:number;y:number;z:number;item:VoxelItem;amount:number;direction:'deposit'|'withdraw'}|{type:'voxel-compost'}|{type:'voxel-seeds';crop:string}
 | {type:'voxel-tools';tool:ToolKind;operation:'repair'|'clean'}
 | {type:'voxel-tools';tool:ToolKind;operation:'imprint';imprint:ToolImprint}
 | {type:'voxel-potion';item:ExplorationPotion};
export interface VoxelContainer{items:Bag}
export function nearbyWorkshop(w:World,p:Adventurer,block:string){
 if(block==='workbench'&&cartWorkbench(w,p.id))return {x:p.x,y:Math.floor(playerHeight(w,p)),z:p.y};
 const feet=playerHeight(w,p),px=p.position3D?.x??p.x+.5,pz=p.position3D?.z??p.y+.5;
 for(let y=Math.floor(feet)-1;y<=Math.floor(feet)+2;y++)for(let z=Math.floor(pz)-3;z<=Math.floor(pz)+3;z++)for(let x=Math.floor(px)-3;x<=Math.floor(px)+3;x++)
  if(Math.hypot(x+.5-px,y+.5-(feet+1),z+.5-pz)<=3.5&&blockAt(w,x,y,z)===block&&sandboxAllows(w,p.id,{x,y,z},'device'))return {x,y,z};
}
export const activeTools=(p:Adventurer):Partial<Record<ToolKind,ToolTier>>=>({...p.life?.tools,...(p.life?.pickaxe?{pickaxe:p.life.pickaxe}:{})});
const repairMaterials:Record<ToolTier,VoxelItem>={stone:'stone',iron:'iron_ingot',steel:'steel',diamond:'diamond'};
export const repairMaterial=(tier:ToolTier)=>repairMaterials[tier];
export function workshopStatus(w:World,p:Adventurer,r:WorkshopRecipe,amount=1){
 const bag=lifePlayer(p).bag,tool=['pickaxe','axe','shovel'].includes(r.output)?r.output as ToolKind:undefined;
 if(r.station!=='hand'&&!nearbyWorkshop(w,p,r.station))return 'station';
 if(tool&&TOOL_RANK.indexOf(activeTools(p)[tool]!)>=TOOL_RANK.indexOf(r.tier!))return 'owned';
 if(r.output==='hoe'&&p.life?.hoe)return 'owned';
 const cost=Object.fromEntries(Object.entries(r.cost).map(([k,n])=>[k,n!*amount])) as Bag;
 if(!canAfford(bag,cost))return 'materials';
 if(r.station==='furnace'&&!['coal','charcoal','wood'].some(k=>(bag[k as VoxelItem]||0)-(cost[k as VoxelItem]||0)>=amount))return 'fuel';
 if(energyOf(p.life)+1e-8<.1*amount)return 'energy';
 return 'ready';
}
export function applyWorkshop(w:World,p:Adventurer,a:WorkshopAction,now:number){
 if(farmBusy(w,p)||p.life?.indoors||now-(p.life?.workshopAt||0)<200)return false;
 const lp=lifePlayer(p),tell=(message:string)=>{p.message=message;w.revision++;return true;};
 if(a.type==='voxel-potion'){
  if(w.gameMode!=='COOP'||!Object.hasOwn(POTIONS,a.item)||!lp.bag[a.item]||potionSeconds(w,p,a.item)>0)return false;
  lp.bag[a.item]!--;
  (lp.potionUntil??={})[a.item]=w.life.time+POTIONS[a.item].seconds;
  lp.workshopAt=now;w.revision++;
  return true;
 }
 if(a.type==='voxel-tools'){
  if(w.gameMode!=='COOP'||!WORKSHOP_TOOLS.includes(a.tool))return false;
  const tier=activeTools(p)[a.tool];
  if(!tier||!TOOL_RANK.includes(tier))return false;
  if(a.operation==='repair'){
   const item=repairMaterial(tier);
   if(!nearbyWorkshop(w,p,'anvil')||!lp.toolWear?.[a.tool]||!lp.bag[item])return false;
   lp.bag[item]!--;
   lp.toolWear[a.tool]=0;
  }else if(a.operation==='clean'){
   if(!nearbyWorkshop(w,p,'whetstone')||!lp.toolImprints?.[a.tool])return false;
   delete lp.toolImprints[a.tool];
  }else if(a.operation==='imprint'){
   if(!nearbyWorkshop(w,p,'imprint_table')||!Object.hasOwn(IMPRINTS,a.imprint)||!lp.bag.imprint_book||
     p.correctAnswers<=(lp.imprintStudy||0)||lp.toolImprints?.[a.tool])return false;
   lp.bag.imprint_book--;
   lp.imprintStudy=(lp.imprintStudy||0)+1;
   (lp.toolImprints??={})[a.tool]=a.imprint;
  }else return false;
  lp.workshopAt=now;w.revision++;
  return true;
 }
 if(a.type==='voxel-craft'){
  if(!Number.isInteger(a.amount)||a.amount<1||a.amount>16)return false;
  const r=WORKSHOP_RECIPES.find(r=>r.id===a.recipe);if(!r)return false;
  if((r.tier||r.output==='hoe')&&a.amount!==1)return false;
  const status=workshopStatus(w,p,r,a.amount);
  if(status!=='ready')return tell(({station:'必要な作業設備の近くへ移動してください。',owned:'同じ強さ以上の道具を持っています。',materials:'材料が足りません。',fuel:'燃料が足りません。石炭・木炭・木材を用意してください。',energy:'エネルギーが足りません。問題に正解して回復しましょう。'})[status]);
  for(const [k,n] of Object.entries(r.cost))lp.bag[k as VoxelItem]=(lp.bag[k as VoxelItem]||0)-n!*a.amount;
  if(r.station==='furnace'){const fuel=(['coal','charcoal','wood'] as const).find(k=>(lp.bag[k]||0)>=a.amount)!;lp.bag[fuel]!-=a.amount;}
  if(r.tier){const tool=r.output as ToolKind;(lp.tools??={})[tool]=r.tier;if(tool==='pickaxe')lp.pickaxe=r.tier;if(lp.toolWear)lp.toolWear[tool]=0;}
  else if(r.output==='hoe')lp.hoe=true;
  else lp.bag[r.output as VoxelItem]=(lp.bag[r.output as VoxelItem]||0)+r.count*a.amount;
  lp.energy=Math.round((energyOf(lp)-a.amount*.1)*100)/100;lp.workshopAt=now;return tell('素材を加工しました。');
 }
 if(a.type==='voxel-storage'){
  if(![a.x,a.y,a.z,a.amount].every(Number.isInteger)||a.amount<1||a.amount>64||!Object.hasOwn(ALL_MATERIAL_NAMES,a.item)||!['deposit','withdraw'].includes(a.direction))return false;
  const block=blockAt(w,a.x,a.y,a.z);
  if(!machineStorage(block)||!sandboxAllows(w,p.id,a,'storage')||(block!=='chest'&&w.voxels?.placedBy?.[voxelKey(a.x,a.y,a.z)]!==p.id)||Math.hypot(a.x+.5-(p.position3D?.x??p.x+.5),a.z+.5-(p.position3D?.z??p.y+.5),a.y-playerHeight(w,p))>3.5)return false;
  const containers=w.voxels!.containers??={},container=containers[voxelKey(a.x,a.y,a.z)]??={items:{}},to=a.direction==='deposit'?container.items:lp.bag,from=a.direction==='deposit'?lp.bag:container.items;
  if((from[a.item]||0)<a.amount)return false;
  if(a.direction==='deposit'&&!canStore(to,a.item,a.amount,block))return tell('チェストがいっぱいです。');
  from[a.item]!-=a.amount;markMachineNeighbor(w,a.x,a.y,a.z);to[a.item]=(to[a.item]||0)+a.amount;lp.workshopAt=now;w.voxels!.revision++;return tell('共有チェストを更新しました。');
 }
 if(a.type==='voxel-compost'){
  if((lp.bag.fertilizer||0)<1)return false;
  lp.bag.fertilizer!--;farmOf(w,p).compost+=3;lp.workshopAt=now;return tell('有機肥料を農園の堆肥に補充しました。');
 }
 if(a.type==='voxel-seeds'){
  const crop=cropById(a.crop),farm=w.farm?.people[p.id];if(!crop||!farm||(farm.pantry[a.crop]?.normal||0)<2)return false;
  farm.pantry[a.crop].normal-=2;farm.seeds[a.crop]=Math.min(999,(farm.seeds[a.crop]||0)+3);lp.workshopAt=now;return tell('収穫物から種を採りました。');
 }
 return false;
}
/** Tanks draw nearby natural water and irrigate planted cells on the same surface. */
export function irrigatedPlot(w:World,x:number,z:number){
 for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
  const tx=x+dx,tz=z+dz;if(tx<1||tz<1||tx>=WIDTH-1||tz>=HEIGHT-1)continue;
  const y=terrainHeight(w,tx,tz);if(Math.abs(y-terrainHeight(w,x,z))>1||w.voxels?.edits[voxelKey(tx,y,tz)]!=='irrigator')continue;
  for(let wz=tz-4;wz<=tz+4;wz++)for(let wx=tx-4;wx<=tx+4;wx++){
   if(wx<0||wz<0||wx>=WIDTH||wz>=HEIGHT)continue;
   const pool=voxelWater(w,wx,wz,y);
   if(pool&&pool.surface>=y-1&&pool.surface<=y+3)return true;
  }
 }
 return false;
}
