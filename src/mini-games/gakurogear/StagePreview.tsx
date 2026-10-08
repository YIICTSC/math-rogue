import React,{useEffect,useRef} from 'react';
import {createScene} from './scene';
import {createRun,type Mission} from './engine';
export default function StagePreview({mission}:{mission:Mission}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!host.current)return;let view:ReturnType<typeof createScene>;try{view=createScene(host.current,mission);view.draw(createRun(mission),{mode:'overhead',yaw:0});}catch{return;}let frame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const start=performance.now();const draw=(now:number)=>{if(!document.hidden)view.preview(reduced?0:(now-start)/1000);frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);view.dispose();};},[mission]);
 return <div ref={host} className="gear-stage-preview" aria-hidden="true"/>;
}
