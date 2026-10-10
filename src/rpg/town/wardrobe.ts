import type {World} from '../engine';
import {c,RESIDENTS,type Copy} from './catalog';
export type ResidentEmotion='joy'|'shy'|'surprise'|'sad';
export interface ResidentReaction {emotion:ResidentEmotion;until:number}
export const OUTFITS=[
 {id:'casual',name:c('くつろぎの普段着','Cozy everyday wear','くつろぎのふだんぎ'),price:20,bond:5},
 {id:'adventure',name:c('新しい冒険服','New adventurer outfit','あたらしいぼうけんふく'),price:30,bond:10},
 {id:'swim',name:c('海辺の水着セット','Beach swimwear set','うみべのみずぎせっと'),price:35,bond:25},
 {id:'festival',name:c('お祭りの浴衣','Festival yukata','おまつりのゆかた'),price:30,bond:15},
 {id:'formal',name:c('華やかな礼装','Elegant formalwear','はなやかなれいそう'),price:45,bond:30},
 {id:'wedding',name:c('白いウェディング衣装','White wedding attire','しろいうぇでぃんぐいしょう'),price:60,bond:50},
 {id:'winter',name:c('あったか冬服','Warm winter outfit','あったかふゆふく'),price:25,bond:10},
 {id:'cafe',name:c('カフェの制服','Cafe uniform','かふぇのせいふく'),price:25,bond:15},
] as const;
export type OutfitId=typeof OUTFITS[number]['id'];
export const outfitById=(id:string)=>OUTFITS.find(o=>o.id===id);
export const supportsWardrobe=(id:string)=>RESIDENTS.some(r=>r.id===id);
export function outfitPreference(w:World,id:string){return OUTFITS[(w.town?.people[id]?.personality??RESIDENTS.find(r=>r.id===id)?.personality??0)%OUTFITS.length].id;}
export function outfitRequirement(w:World,id:string,outfit:typeof OUTFITS[number]){return Math.max(0,outfit.bond-(outfitPreference(w,id)===outfit.id?5:0));}
export function outfitImage(id:string,outfit:string){if(!supportsWardrobe(id)||!outfitById(outfit))return undefined;return `sprites/rpg/wardrobe/${id.slice(9)}/${outfit}.webp`;}
export function reactionImage(id:string,emotion:ResidentEmotion){return supportsWardrobe(id)?`sprites/rpg/wardrobe/${id.slice(9)}/${emotion}.webp`:undefined;}
export function residentAppearance(w:World,id:string,fallback:string){return outfitImage(id,w.town?.people[id]?.wearing||'')||fallback;}
export const EMOTION_NAMES:Record<ResidentEmotion,Copy>={joy:c('うれしい！','Delighted!','うれしい！'),shy:c('ありがとう…','Thank you…','ありがとう…'),surprise:c('びっくり！','Surprised!','びっくり！'),sad:c('しょんぼり','Disappointed','しょんぼり')};

export function npcAppearance(w:World,portrait:string){const resident=RESIDENTS.find(r=>r.portrait===portrait);return resident?residentAppearance(w,resident.id,portrait):portrait;}
