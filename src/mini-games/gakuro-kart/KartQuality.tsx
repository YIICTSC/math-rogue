import React,{useEffect,useState,useSyncExternalStore} from 'react';
import type {LanguageMode} from '../../types';
import type {KartRoom} from './network';
import {slowConnectionHint,type ConnectionHints,type KartQuality} from './performance';
const key='gakuro-gp-quality-v1',listeners=new Set<()=>void>();
let fallback:KartQuality='auto';
const read=():KartQuality=>{try{const v=localStorage.getItem(key)??localStorage.getItem('storybook-3d-quality-v1');return v==='high'||v==='low'||v==='minimal'?v:'auto';}catch{return fallback;}};
export const useKartQuality=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},read,()=> 'auto' as KartQuality);
export function setKartQuality(value:KartQuality){fallback=value;try{localStorage.setItem(key,value);}catch{}listeners.forEach(fn=>fn());}
export function useKartPerformance(room:KartRoom|null,online:boolean){
 const preferred=useKartQuality(),[slowRoom,setSlowRoom]=useState<KartRoom|null>(null);
 useEffect(()=>{
  if(!online||!room)return;
  const connection=(navigator as Navigator&{connection?:ConnectionHints&EventTarget}).connection;
  const check=()=>{if(document.hidden){room.connectionHealth.resume(performance.now());return;}if(slowConnectionHint(connection)||room.isSlowConnection())setSlowRoom(room);};
  const resume=()=>room.connectionHealth.resume(performance.now());
  check();const timer=setInterval(check,500);connection?.addEventListener('change',check);document.addEventListener('visibilitychange',resume);
  return()=>{clearInterval(timer);connection?.removeEventListener('change',check);document.removeEventListener('visibilitychange',resume);};
 },[online,room]);
 const hinted=online&&typeof navigator!=='undefined'&&slowConnectionHint((navigator as Navigator&{connection?:ConnectionHints}).connection);
 const forced=online&&!!room&&(slowRoom===room||hinted);
 return {quality:forced?'minimal' as const:preferred,forced,onSlowFrame:()=>{if(online&&room)setSlowRoom(room);}};
}
export default function KartQualityButton({languageMode,effective,forced}:{languageMode:LanguageMode;effective:KartQuality;forced:boolean}){
 const preferred=useKartQuality(),en=languageMode==='ENGLISH',hi=languageMode==='HIRAGANA';
 const labels={auto:en?'Graphics: Auto':hi?'がしつ：じどう':'画質：自動',high:en?'Graphics: High':hi?'がしつ：こうがしつ':'画質：高画質',low:en?'Graphics: Low':hi?'がしつ：けいりょう':'画質：軽量',minimal:en?'Graphics: Minimal':hi?'がしつ：さいけいりょう':'画質：最軽量'};
 return <button className="storybook-quality" data-kart-quality={effective} aria-label={en?'Change GP graphics quality':hi?'GPのがしつをきりかえる':'GPの画質を切り替える'} title={forced?(en?'Minimal graphics automatically enabled for this online session.':hi?'このオンラインつうしんでは、じどうでさいけいりょうにします。':'このオンライン通信では、自動で最軽量にしています。'):undefined} onClick={()=>{const modes:KartQuality[]=['auto','high','low','minimal'];setKartQuality(modes[(modes.indexOf(preferred)+1)%modes.length]);}}>{labels[effective]}{forced?(en?' (Auto)':hi?'（じどう）':'（自動）'):''}</button>;
}
