import{useEffect,useRef}from'react';
import{audioService}from'../../services/audioService';
import type{Campaign}from'./types';
import{lanternMusic}from'./musicSelection';
export{lanternMusic}from'./musicSelection';
export function useLanternMusic(entered:boolean,s:Campaign|null){
 const track=lanternMusic(entered,s),scope=useRef<ReturnType<typeof audioService.acquireBgmScene>|null>(null),latest=useRef(track),moving=useRef(false);latest.current=track;
 useEffect(()=>{const t=latest.current;scope.current=audioService.acquireBgmScene(t.type,t.options,30);const travel=(event:Event)=>{moving.current=!!(event as CustomEvent).detail;if(!moving.current){const t=latest.current;scope.current?.update(t.type,t.options);}};window.addEventListener('learning-rogue:lantern-travel',travel);return()=>{scope.current?.();scope.current=null;window.removeEventListener('learning-rogue:lantern-travel',travel);};},[]);
 useEffect(()=>{if(s?.phase==='field'&&moving.current)return;scope.current?.update(track.type,track.options);},[track.type,track.options.mode,track.options.theme,s?.phase]);
}
