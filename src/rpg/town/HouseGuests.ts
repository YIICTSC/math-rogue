import {residentAppearance} from './wardrobe';
import {residentsOf} from './residents';
import type {World} from '../engine';
import {roomWalkable} from '../homeCatalog';
import {interiorOf} from '../life';
import {copy,RESIDENTS} from './catalog';
export interface HouseGuest {id:string;name:string;image?:string;atlasIndex?:number;x:number;y:number}
export function houseGuests(w:World,houseId:string,language:string):HouseGuest[]{const s=w.town,h=w.life.houses.find(h=>h.id===houseId);if(!s||!h)return [];const guests:HouseGuest[]=[],room=interiorOf(h),used=new Set(Object.values(w.players).filter(p=>p.life?.indoors===houseId).map(p=>`${p.life?.roomPos?.x},${p.life?.roomPos?.y}`));const place=(guest:Omit<HouseGuest,'x'|'y'>)=>{for(let y=4;y<11;y++)for(let x=3;x<15;x++){if(!roomWalkable(room,x,y)||used.has(`${x},${y}`))continue;used.add(`${x},${y}`);guests.push({...guest,x,y});return;}};for(const r of residentsOf(w))if(s.bonds.some(b=>b.people.includes(r.id)&&(b.houseId===houseId||b.visitHouse?.id===houseId&&b.visitHouse.day===s.day)))place({id:r.id,name:copy(r.name,language),image:residentAppearance(w,r.id,r.portrait)});for(const family of s.families)if(family.parents.some(id=>id===h.owner)&&(!family.travel||family.travel.returned)){const age=s.day-family.bornDay;place({id:family.id,name:family.name,atlasIndex:(age>=12?2:age>=5?1:0)*4+family.bornDay%4});}return guests.slice(0,8);}
