import type { KochoHeroId } from '../guests';
import type { HeroTechnique } from '../techniques';
export type Direction = 'right' | 'down' | 'left' | 'up';
export interface Point { x:number; y:number }
export interface FieldCard {
 id:string; name:string; englishName?:string; englishDescription?:string; type:'ATTACK'|'MOVE'|'UTILITY'; range:number[]; damage:number; shield?:number;
 cooldown:number; currentCooldown:number; description:string; energyCost:number; maxSlots:number; usedSlots:number;
 effectType?:'NORMAL'|'COUNTER'|'PUSH'|'PULL'|'RECOIL'|'DASH_ATTACK'|'FURTHEST'|'PIERCE'|'TELEPORT'|'STUN'|'HEAL'|'DRAIN'|'PIERCE_DASH';
 technique?:HeroTechnique; parts?:FieldCard[];
}
export interface EnemyTemplate {name:string; maxHp:number; sprite:string; attackDmg:number; range:number[]; speed:number; attackCooldown:number; special?:string}
export interface FieldEnemy extends Point {id:string; name:string; hp:number; maxHp:number; damage:number; range:number; awake:boolean; timer:number; windup:boolean; boss:boolean; art:number; stun:number; facing:Direction; phase?:number}
export type BuildingKind='school'|'shop'|'arcade';
export interface FieldBuilding extends Point {id:BuildingKind; name:string}
export interface FieldDrop extends Point {id:string; amount:number}
export interface FieldEvent {kind:'move'|'attack'|'hit'|'guard'|'heal'|'coin'|'special'; at:Point; name?:string; value?:number}
export interface FieldState {
 version:1; hero:KochoHeroId; stage:number; width:number; player:Point; facing:Direction; hp:number; maxHp:number; shield:number; barrier:number; strength:number; focus:number;
 hand:FieldCard[]; queue:string[]; enemies:FieldEnemy[]; buildings:FieldBuilding[]; drops:FieldDrop[]; money:number; relics:string[]; items:string[];
 specialCD:number; turn:number; status:'play'|'clear'|'won'|'lost'; logs:string[]; events:FieldEvent[]; seed:number; seen:string[]; purchased:string[];
}
export type FieldAction={type:'move';direction:Direction}|{type:'face';direction:Direction}|{type:'special';direction:Direction}|{type:'wait'}|{type:'card';id:string}|{type:'item';id:string};
export const VECTORS:Record<Direction,Point>={right:{x:1,y:0},down:{x:0,y:1},left:{x:-1,y:0},up:{x:0,y:-1}};
export const distance=(a:Point,b:Point)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
