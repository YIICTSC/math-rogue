import React,{useEffect,useRef} from 'react';
import {ArrowUp,ArrowLeft,ArrowDown,ArrowRight} from 'lucide-react';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
export default function TouchPad({disabled,onMove,languageMode}:{disabled:boolean;onMove:(dx:number,dy:number)=>void;languageMode:LanguageMode}){
 const held=useRef<{id:number;dx:number;dy:number}|null>(null),latest=useRef({disabled,onMove});latest.current={disabled,onMove};
 useEffect(()=>{if(disabled)held.current=null;},[disabled]);
 useEffect(()=>{const stop=()=>{held.current=null;},timer=setInterval(()=>{const h=held.current;if(h&&!latest.current.disabled)latest.current.onMove(h.dx,h.dy);},160);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);return()=>{clearInterval(timer);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);};},[]);
 const button=(dx:number,dy:number,label:string,icon:React.ReactNode)=><button aria-label={trans(label,languageMode)} disabled={disabled} onPointerDown={e=>{if(latest.current.disabled||held.current||!e.isPrimary||e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);held.current={id:e.pointerId,dx,dy};latest.current.onMove(dx,dy);}} onPointerUp={e=>{if(held.current?.id===e.pointerId)held.current=null;}} onPointerCancel={()=>{held.current=null;}} onLostPointerCapture={()=>{held.current=null;}} onClick={e=>{if(e.detail===0&&!latest.current.disabled)latest.current.onMove(dx,dy);}}>{icon}</button>;
 return <div className="rpg-dpad" aria-label={trans('移動ボタン',languageMode)}>{button(0,-1,'上へ移動',<ArrowUp/>)}<div>{button(-1,0,'左へ移動',<ArrowLeft/>)}{button(0,1,'下へ移動',<ArrowDown/>)}{button(1,0,'右へ移動',<ArrowRight/>)}</div></div>;
}
