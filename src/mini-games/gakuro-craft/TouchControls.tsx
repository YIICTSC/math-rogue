import React,{useEffect,useRef,useState} from 'react';
import {stickVector,type TouchControl} from './touchInput';
type Vector={dx:number;dz:number};
export function VirtualStick({disabled,t,onMove}:{disabled:boolean;t:(s:string)=>string;onMove:(value:Vector|null)=>void}){
 const button=useRef<HTMLButtonElement>(null),pointer=useRef<{id:number;x:number;y:number;radius:number}|null>(null),callback=useRef(onMove),[knob,setKnob]=useState({x:0,y:0});callback.current=onMove;
 const stop=()=>{const active=pointer.current;pointer.current=null;setKnob({x:0,y:0});if(active){callback.current(null);if(button.current?.hasPointerCapture(active.id))button.current.releasePointerCapture(active.id);}};
 const move=(e:React.PointerEvent<HTMLButtonElement>)=>{const active=pointer.current;if(!active||active.id!==e.pointerId)return;const v=stickVector(e.clientX-active.x,e.clientY-active.y,active.radius);setKnob({x:v.x*active.radius,y:v.y*active.radius});callback.current({dx:v.dx,dz:v.dz});};
 useEffect(()=>{if(disabled)stop();},[disabled]);
 useEffect(()=>{const visibility=()=>{if(document.hidden)stop();};window.addEventListener('blur',stop);window.addEventListener('resize',stop);window.addEventListener('orientationchange',stop);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('blur',stop);window.removeEventListener('resize',stop);window.removeEventListener('orientationchange',stop);document.removeEventListener('visibilitychange',visibility);stop();};},[]);
 return <button ref={button} className="gc-stick" aria-label={t('バーチャルスティック')} disabled={disabled} onContextMenu={e=>e.preventDefault()}
 onPointerDown={e=>{if(disabled||e.button!==0||!e.isPrimary||pointer.current)return;e.preventDefault();const r=e.currentTarget.getBoundingClientRect();pointer.current={id:e.pointerId,x:r.left+r.width/2,y:r.top+r.height/2,radius:r.width*.32};e.currentTarget.setPointerCapture(e.pointerId);move(e);}}
 onPointerMove={move} onPointerUp={e=>{if(pointer.current?.id===e.pointerId)stop();}} onPointerCancel={e=>{if(pointer.current?.id===e.pointerId)stop();}} onLostPointerCapture={e=>{if(pointer.current?.id===e.pointerId)stop();}}>
 <span className="gc-stick-cross" aria-hidden="true"/><span className="gc-stick-knob" aria-hidden="true" style={{transform:`translate(-50%,-50%) translate(${knob.x}px,${knob.y}px)`}}>✥</span></button>;
}
export function MovementSettings({value,onChange,t}:{value:TouchControl;onChange:(value:TouchControl)=>void;t:(s:string)=>string}){return <section className="gc-movement-settings"><h3>{t('タッチでの移動操作')}</h3><div className="gc-row"><button aria-pressed={value==='dpad'} onClick={()=>onChange('dpad')}>{t('十字ボタン')}</button><button aria-pressed={value==='stick'} onClick={()=>onChange('stick')}>{t('バーチャルスティック')}</button></div><p>{t('スティックを倒した方向へ移動。軽く倒すとゆっくり、指を離すと停止します。')}</p><small>{t('選んだ操作方法は、この端末に保存されます。')}</small></section>;}
