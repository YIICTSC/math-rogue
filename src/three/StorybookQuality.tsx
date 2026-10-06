import React,{useSyncExternalStore} from 'react';
import { trans } from '../utils/textUtils';
import type { LanguageMode } from '../types';
import type { Quality } from './storybookStyle';
const key='storybook-3d-quality-v1',listeners=new Set<()=>void>();
const read=():Quality=>{try{const value=localStorage.getItem(key);return value==='high'||value==='low'?value:'auto';}catch{return 'auto';}};
export const useStorybookQuality=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},read,()=> 'auto' as Quality);
export default function StorybookQuality({languageMode='JAPANESE'}:{languageMode?:LanguageMode}){
 const quality=useStorybookQuality();return <button className="storybook-quality" aria-label={trans('3D画質を切り替える',languageMode)} onClick={()=>{const next=quality==='auto'?'high':quality==='high'?'low':'auto';try{localStorage.setItem(key,next);}catch{}listeners.forEach(f=>f());}}>{trans(quality==='auto'?'画質：自動':quality==='high'?'画質：高画質':'画質：軽量',languageMode)}</button>;
}
