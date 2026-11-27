import type { Adventurer, World } from '../engine';
import { operateFarmMachine } from '../farm/model';
import { sandboxAllows } from '../sandboxAccess';
import { c } from '../town/catalog';
import type { VoxelItem } from '../voxelCatalog';
import { cityBuilding } from './catalog';
import type { CityLot } from './model';

export const CITY_WORKS = {
  farm: { blocks:['farm_machine'], job:c('農場の世話','Farmhand','のうじょうのせわ') },
  workshop: { blocks:['auto_furnace','warehouse_chest'], job:c('工房の加工','Machinist','こうぼうのかこう') },
  market: { blocks:['warehouse_chest'], job:c('市場の品出し','Market trader','いちばのしなだし') },
  wind: { blocks:['crystal_wire','crystal_lamp'], job:c('電力網の保守','Grid technician','でんりょくもうのほしゅ') },
  solar: { blocks:['crystal_wire','crystal_lamp'], job:c('電力網の保守','Grid technician','でんりょくもうのほしゅ') },
  bus: { blocks:['station_rail'], job:c('駅の運営','Station attendant','えきのうんえい') },
  police: { blocks:['warehouse_chest'], job:c('守護ゴーレムの整備','Golem keeper','しゅごゴーレムのせいび') },
} as const;

type WorksKind = keyof typeof CITY_WORKS;
export type CityWorkLink = { cell:string; home:string; arrivals:number; lastMonth?:number; units?:number };
export type CityWorks = { links:Record<string,CityWorkLink> };
export type CityWorksAction = { type:'city-works-link'; lot:string; cell:string; home:string }
  | { type:'city-works-unlink'; lot:string };
const cellKey = /^\d{1,3},-?\d{1,3},\d{1,3}$/;
const supply:Partial<Record<WorksKind,Partial<Record<VoxelItem,number>>>>={
  market:{smoked_fish:2,bottled_honey:2,fruit:3},workshop:{iron_ingot:2,copper_ingot:2},police:{iron_ingot:3,crystal_powder:1},
};

export function cityWorkKind(lot:CityLot):WorksKind|undefined {
  return Object.hasOwn(CITY_WORKS,lot.kind)?lot.kind as WorksKind:undefined;
}

function linkedHardware(w:World,lot:CityLot,key:string) {
  const kind=cityWorkKind(lot), block=w.voxels?.edits[key];
  if(!kind||!block||!cellKey.test(key)||w.voxels?.placedBy?.[key]!==lot.owner||
    !(CITY_WORKS[kind].blocks as readonly string[]).includes(block)) return false;
  const [x,y,z]=key.split(',').map(Number);
  return Math.abs(lot.x-x)+Math.abs(lot.y-z)<=6&&Math.abs(y)<=4&&sandboxAllows(w,lot.owner,{x,y,z},'device');
}

export function cityWorkHardware(w:World, lot:CityLot) {
  return Object.keys(w.voxels?.placedBy??{}).filter(key=>linkedHardware(w,lot,key)).sort();
}

export function cityWorkHomes(w:World,lot:CityLot) {
  return w.city?.lots.filter(home=>home.connected&&!home.damage&&!!cityBuilding(home.kind)?.capacity&&
    Math.abs(home.x-lot.x)+Math.abs(home.y-lot.y)<=20)??[];
}

export function applyCityWorks(w:World,p:Adventurer,action:CityWorksAction) {
  if(w.gameMode!=='COOP'||!w.city||typeof action.lot!=='string')return false;
  const s=w.city, lot=s.lots.find(entry=>entry.id===action.lot&&entry.owner===p.id);
  if(!lot||!cityWorkKind(lot))return false;
  if(action.type==='city-works-unlink') {
    if(!s.works?.links[lot.id])return false;
    delete s.works.links[lot.id];
  } else {
    const {cell,home}=action;
    const residence=cityWorkHomes(w,lot).find(choice=>choice.id===home);
    if(typeof cell!=='string'||typeof home!=='string'||!linkedHardware(w,lot,cell)||
      !residence||Object.entries(s.works?.links??{}).filter(([id,link])=>id!==lot.id&&link.home===home).length>=cityBuilding(residence.kind)!.capacity*residence.level||
      Object.entries(s.works?.links??{}).some(([id,link])=>id!==lot.id&&link.cell===cell))return false;
    const links=(s.works??={links:{}}).links;
    const previous=links[lot.id];
    if(previous?.cell===cell&&previous.home===home)return false;
    links[lot.id]={cell,home,arrivals:0};
  }
  return true;
}

function staffed(w:World,lot:CityLot,link:CityWorkLink) {
  if(lot.damage||!lot.connected||!linkedHardware(w,lot,link.cell))return false;
  const home=cityWorkHomes(w,lot).find(entry=>entry.id===link.home);
  if(!home?.people)return false;
  const assignments=Object.entries(w.city!.works!.links).filter(([id,entry])=>entry.home===home.id&&
    w.city!.lots.some(other=>other.id===id&&!other.damage&&other.connected)).map(([id])=>id);
  return assignments.indexOf(lot.id)<home.people;
}

export function recordCityRailArrival(w:World,cell:string,owner:string) {
  const s=w.city;
  if(!s?.works)return;
  const link=Object.values(s.works.links).find(entry=>entry.cell===cell);
  if(!link||link.arrivals>=8)return;
  const lot=s.lots.find(entry=>s.works!.links[entry.id]===link);
  if(lot?.kind==='bus'&&lot.owner===owner&&staffed(w,lot,link))link.arrivals++;
}

function supplyBatch(w:World,key:string,stock:NonNullable<(typeof supply)[WorksKind]>) {
  const container=w.voxels?.containers?.[key];
  if(!container)return 0;
  for(const [item,count] of Object.entries(stock) as [VoxelItem,number][]){
    if((container.items[item]??0)<count)continue;
    container.items[item]!-=count;
    if(!container.items[item])delete container.items[item];
    w.voxels!.revision++;
    return count;
  }
  return 0;
}

export function advanceCityWorks(w:World) {
  const city=w.city;
  if(!city?.works)return;
  for(const [lotId,link] of Object.entries(city.works.links)){
    const lot=city.lots.find(entry=>entry.id===lotId),kind=lot&&cityWorkKind(lot);
    if(!lot||!kind){delete city.works.links[lotId];continue;}
    let units=0;
    if(staffed(w,lot,link)){
      const signal=w.voxels?.machinery?.devices[link.cell]?.signal??0;
      const batch=supply[kind];
      if(batch)units=supplyBatch(w,link.cell,batch);
      else if(kind==='bus')units=link.arrivals;
      else if(kind==='wind'||kind==='solar')units=signal;
      else if(kind==='farm'&&signal){
        const [x,,z]=link.cell.split(',').map(Number);
        const farm=w.farm?.people[lot.owner];
        if(farm?.plots.some(plot=>plot.x!==undefined&&plot.y!==undefined&&Math.abs(plot.x-x)+Math.abs(plot.y-z)<=4&&
          operateFarmMachine(w,lot.owner,plot.x,plot.y,'harvest')))units=1;
      }
    }
    link.arrivals=0;
    link.units=units;
    link.lastMonth=city.month;
  }
}

export function cityWorksBenefits(w:World) {
  const s=w.city;
  const bonuses={power:new Set<string>(),transit:0,commerce:0,farm:0,defense:0};
  if(!s?.works)return bonuses;
  for(const lot of s.lots){
    const link=s.works.links[lot.id], units=link?.units??0;
    if(!units||!link||link.lastMonth!==s.month||!staffed(w,lot,link))continue;
    switch(lot.kind){
      case 'wind':case 'solar': bonuses.power.add(lot.id);break;
      case 'bus': bonuses.transit+=Math.min(8,units*2);break;
      case 'market':case 'workshop': bonuses.commerce+=12+units*4;break;
      case 'farm': bonuses.farm+=2;break;
      case 'police': bonuses.defense++;break;
    }
  }
  return bonuses;
}
