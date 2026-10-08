import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {SCHOOL_SPRITE_RECTS} from './spriteRects';
export const SCHOOL_ITEM_SPRITES:Record<string,number>={BAG_SAVE:0,BAG_HEAL:1,BAG_IDENTIFY:2,BAG_CHANGE:3,SUPPLY_CLEAN:4,SUPPLY_BLESS:5,SUPPLY_RETURN:6,SUPPLY_REVIVE:7,SUPPLY_PICK:8,SUPPLY_FLOAT:9,NURSE_PENCIL:10,DRAGON_RULER:11,TRAP:12,REST:13,TRADER:14,SECRET:15};
export const SCHOOL_ACTOR_SPRITES:Record<string,number>={SPLIT:0,SEAL:1,SWALLOW:2,ERASE:3,RICE:4,EVOLVE:5,MONITOR:6,DETENTION:7,HEAL:8,GUARD:10,FETCH:12,LOST:14};
const paths={items:'sprites/school-wanderer/items-atlas.webp',actors:'sprites/school-wanderer/actors-atlas.webp'};
const images:Partial<Record<keyof typeof paths,HTMLImageElement>>={};
export function loadSchoolSprites(){for(const kind of ['items','actors'] as const)if(!images[kind]&&typeof Image!=='undefined'){const image=new Image();image.src=assetUrl(paths[kind]);images[kind]=image;}}
export function drawSchoolSprite(ctx:CanvasRenderingContext2D,kind:'items'|'actors',index:number,x:number,y:number,size:number):boolean {
 const image=images[kind],rect=SCHOOL_SPRITE_RECTS[kind][index];if(!image?.complete||!image.naturalWidth||!rect)return false;
 const [sx,sy,w,h]=rect,scale=(size-4)/Math.max(w,h);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,sx,sy,w,h,x+(size-w*scale)/2,y+(size-h*scale)/2,w*scale,h*scale);ctx.restore();return true;
}
export function SchoolSupplyIcon({type,size=40}:{type:string;size?:number}){const index=SCHOOL_ITEM_SPRITES[type];if(index===undefined)return null;const [x,y,w,h]=SCHOOL_SPRITE_RECTS.items[index];return <svg width={size} height={size} viewBox={`${x-4} ${y-4} ${w+8} ${h+8}`} aria-hidden="true" style={{flexShrink:0,imageRendering:'pixelated'}}><image href={assetUrl(paths.items)} width="1254" height="1254"/></svg>;}
export function SchoolActorIcon({role,size=44}:{role:string;size?:number}){const index=SCHOOL_ACTOR_SPRITES[role];if(index===undefined)return null;const [x,y,w,h]=SCHOOL_SPRITE_RECTS.actors[index];return <svg width={size} height={size} viewBox={`${x-4} ${y-4} ${w+8} ${h+8}`} aria-hidden="true" style={{flexShrink:0,imageRendering:'pixelated'}}><image href={assetUrl(paths.actors)} width="1254" height="1254"/></svg>;}
