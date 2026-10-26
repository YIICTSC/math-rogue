import React,{useSyncExternalStore} from 'react';
import type {LanguageMode} from '../../types';
import type {KartQuality} from './performance';
type SelectedQuality=Exclude<KartQuality,'auto'>;
const key='gakuro-gp-quality-v1',listeners=new Set<()=>void>();
let sessionChoice:SelectedQuality|undefined;
const read=():SelectedQuality=>{if(sessionChoice)return sessionChoice;try{const v=localStorage.getItem(key)??localStorage.getItem('storybook-3d-quality-v1');return v==='low'||v==='minimal'?v:'high';}catch{return 'high';}};
export const useKartQuality=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},read,()=> 'high' as SelectedQuality);
export function setKartQuality(value:KartQuality){const selected=value==='auto'?'high':value;sessionChoice=selected;try{localStorage.setItem(key,selected);}catch{}listeners.forEach(fn=>fn());}
/** The player's setting is identical in local and online races. */
export default function KartQualityButton({languageMode}:{languageMode:LanguageMode}){
 const quality=useKartQuality(),en=languageMode==='ENGLISH',hi=languageMode==='HIRAGANA';
 const labels={high:en?'Graphics: High':hi?'がしつ：こうがしつ':'画質：高画質',low:en?'Graphics: Low':hi?'がしつ：けいりょう':'画質：軽量',minimal:en?'Graphics: Minimal':hi?'がしつ：さいけいりょう':'画質：最軽量'};
 return <button className="storybook-quality" data-kart-quality={quality} aria-label={en?'Change GP graphics quality':hi?'GPのがしつをきりかえる':'GPの画質を切り替える'} onClick={()=>{const modes:SelectedQuality[]=['high','low','minimal'];setKartQuality(modes[(modes.indexOf(quality)+1)%modes.length]);}}>{labels[quality]}</button>;
}
