import React,{useEffect,useState} from 'react';
import {assetUrl} from '../../../utils/assetPaths';
import {abyssHero} from './roster';
import type {StudentAbility} from '../student/abilities';
import './ultimate-fx.css';
const templates:Record<string,string>={slash:'lyria',star:'lyria',ice:'celis',water:'celis',fire:'ignis',leaf:'flora',shadow:'noctia',song:'aurene',thunder:'leon',alchemy:'orion'};
export const blenderEffectUrl=(heroId:string,slot:number)=>assetUrl(`sprites/dungeons2/fx/${heroId.replace('dungeons2-','')}-skill-${slot+1}.webp`);
export function blenderEffect(heroId:string,ability:StudentAbility){const hero=abyssHero(heroId);const slot=hero?(hero.card.en===ability.en?2:Math.max(0,hero.skills.findIndex(s=>s.en===ability.en))):(ability.line?0:ability.heal||ability.guard||ability.cure?1:2);const id=heroId.startsWith('dungeons2-')?heroId:`dungeons2-${templates[ability.effect]||'lyria'}`;return {url:blenderEffectUrl(id,slot),slot,id};}
export function preloadBlenderAbilities(heroId:string,ability:StudentAbility){if(typeof Image==='undefined')return;const hero=abyssHero(heroId);for(const s of hero?.skills||[ability]){const image=new Image();image.src=blenderEffect(heroId,s).url;}}
/** 24 Blender-rendered frames; D1 reuses element templates, D2 has three per hero. */
export function BlenderAbilityEffect({heroId,ability}:{heroId:string;ability:StudentAbility}){
 const {url,slot,id}=blenderEffect(heroId,ability),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;const image=new Image();image.onload=()=>{if(active)setLoaded(true);};image.src=url;return()=>{active=false;};},[url]);
 return <div className={`blender-ultimate-fx ${loaded?'ready':''}`} data-blender-effect={`${id}:${slot+1}`} role="presentation" style={{backgroundImage:`url(${url})`}}/>;
}
