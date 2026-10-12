import type {World} from './engine';
import type {Player} from '../types';
import {furnishing,newInterior} from './homeCatalog';
import {resident} from './social';
import {roomUsable} from './voxelRooms';
export type FurnitureBenefit='might'|'guard'|'focus'|'comfort';
export interface HomeBattleBonus {strength:number;block:number;draw:number;heal:number;items:string[]}
export const HOME_BONUS_CAP={strength:4,block:16,draw:2,heal:8};
const groups:Record<FurnitureBenefit,Set<string>>={
 might:new Set(['armorStand','workbench','plushBear','plushFox','plushDragon','plushWolf','redRug']),
 guard:new Set(['wardrobe','chair','blueRug','wovenRug','mirror','shoeCabinet','coatRack','treasureChest','plushTurtle','plushPenguin','seasonTravelChest']),
 focus:new Set(['bookshelf','desk','painting','clock','crystalDisplay','floorlamp','lantern','telescope','globe','musicBox','piano','harp','plushOwl','seasonFlowerJournal','seasonLantern']),
 comfort:new Set(),
};
export function furnitureBenefit(item:string):FurnitureBenefit|null {
 const f=furnishing(item);if(!f||f.game)return null;
 return f.benefit||(['might','guard','focus'] as const).find(g=>groups[g].has(item))||'comfort';
}
export function summarizeFurniture(items:Iterable<string>):HomeBattleBonus {
 const bonus:HomeBattleBonus={strength:0,block:0,draw:0,heal:0,items:[]};
 for(const item of new Set(items)){
  const benefit=furnitureBenefit(item);if(!benefit)continue;bonus.items.push(item);
  if(benefit==='might')bonus.strength++;else if(benefit==='guard')bonus.block+=2;else if(benefit==='focus')bonus.draw++;else bonus.heal+=2;
 }
 for(const key of ['strength','block','draw','heal'] as const)bonus[key]=Math.min(bonus[key],HOME_BONUS_CAP[key]);
 return bonus;
}
/** Owned homes and cohabiting homes count, never inventory or someone else's home. */
export function homeBattleBonus(world:World,selfId:string):HomeBattleBonus {
 const items=world.life.houses.filter(h=>resident(world,h.id,selfId)).flatMap(h=>(h.interior?.placed||newInterior().placed).map(f=>f.item));
 for(const room of world.voxelRooms||[])if(room.owner===selfId&&roomUsable(world,room))items.push(...room.furniture.map(f=>f.item));
 return summarizeFurniture(items);
}
export function applyHomeBattleBonus(player:Player,bonus:HomeBattleBonus):number {
 player.strength+=bonus.strength;player.block+=bonus.block;player.currentHp=Math.min(player.maxHp,player.currentHp+bonus.heal);
 return bonus.draw;
}
