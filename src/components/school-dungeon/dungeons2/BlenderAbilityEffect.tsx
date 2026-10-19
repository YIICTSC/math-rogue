import React,{useEffect,useState} from 'react';
import {assetUrl} from '../../../utils/assetPaths';
import {abyssHero} from './roster';
import {STUDENT_ABILITIES,type StudentAbility} from '../student/abilities';
import './ultimate-fx.css';
export const blenderEffectUrl=(heroId:string,slot:number)=>assetUrl(`sprites/dungeons2/fx/${heroId.replace('dungeons2-','')}-skill-${slot+1}.webp`);
export function blenderEffect(heroId:string,ability:StudentAbility){
 const hero=abyssHero(heroId);
 if(!hero&&heroId in STUDENT_ABILITIES)return {url:assetUrl(`sprites/dungeons/fx/${heroId}-skill-1.webp`),slot:0,id:heroId};
 const slot=hero?(hero.card.en===ability.en?2:Math.max(0,hero.skills.findIndex(s=>s.en===ability.en))):0,id=hero?.id||'dungeons2-lyria';
 return {url:blenderEffectUrl(id,slot),slot,id};
}
export function preloadBlenderAbilities(heroId:string,ability:StudentAbility){if(typeof Image==='undefined')return;const hero=abyssHero(heroId);for(const s of hero?.skills||[ability]){const image=new Image();image.src=blenderEffect(heroId,s).url;}}
/** 24 Blender-rendered frames; D1 has one dedicated scene per hero, D2 has three per hero. */
export function BlenderAbilityEffect({heroId,ability}:{heroId:string;ability:StudentAbility}){
 const {url,slot,id}=blenderEffect(heroId,ability),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;const image=new Image();image.onload=()=>{if(active)setLoaded(true);};image.src=url;return()=>{active=false;};},[url]);
 return <div className={`blender-ultimate-fx ${loaded?'ready':''}`} data-blender-effect={`${id}:${slot+1}`} role="presentation" style={{backgroundImage:`url(${url})`}}/>;
}
