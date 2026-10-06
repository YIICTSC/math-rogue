import React,{useEffect,useRef,useState} from 'react';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
/** Independent pointer capture lets this stick run alongside left-hand movement. */
export default function VoxelLookStick({onLook,languageMode}:{onLook:(dx:number,dy:number)=>void;languageMode:LanguageMode}){
 const [knob,setKnob]=useState({x:0,y:0}),held=useRef<{id:number;x:number;y:number}|null>(null),latest=useRef(onLook);latest.current=onLook;
 const stop=()=>{held.current=null;setKnob({x:0,y:0});};
 useEffect(()=>{const timer=setInterval(()=>{const h=held.current;if(h)latest.current(h.x*.045,h.y*.032);},40);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};},[]);
 const track=(e:React.PointerEvent<HTMLButtonElement>)=>{const r=e.currentTarget.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2),length=Math.hypot(dx,dy),scale=length>1?1/length:1;held.current={id:e.pointerId,x:length<.12?0:dx*scale,y:length<.12?0:dy*scale};const range=Math.max(8,r.width/2-15);setKnob({x:dx*scale*range,y:dy*scale*range});};
 return <button className="rpg-look-stick" aria-label={trans('視点スティック',languageMode)} onPointerDown={e=>{if(held.current||e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);track(e);}} onPointerMove={e=>{if(held.current?.id===e.pointerId&&e.currentTarget.hasPointerCapture(e.pointerId))track(e);}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={e=>{const d:Record<string,number[]>={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.08],ArrowDown:[0,.08]};if(d[e.key]){e.preventDefault();e.stopPropagation();onLook(d[e.key][0],d[e.key][1]);}}}><span aria-hidden="true">◉</span><i style={{transform:`translate(${knob.x}px,${knob.y}px)`}}/><small>{trans('視点',languageMode)}</small></button>;
}
