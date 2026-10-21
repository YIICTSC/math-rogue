import { multiTouchAction } from '../utils/multiTouchAction';
import React,{useEffect,useRef,useState} from 'react';
import type {LanguageMode} from '../types';
import {useRpgPreferences} from './preferences';
import {cameraStick} from './cameraInput';
export default function CameraControls({languageMode='JAPANESE',disabled=false,building=false,thirdPerson=false,onView,onLook,onReset}:{languageMode?:LanguageMode;disabled?:boolean;building?:boolean;thirdPerson?:boolean;onView?:()=>void;onLook:(x:number,y:number,dt:number)=>void;onReset:()=>void}){
 const p=useRpgPreferences(),L=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 const owner=useRef<number|null>(null),vector=useRef({x:0,y:0}),latest=useRef({onLook,disabled}),[knob,setKnob]=useState({x:0,y:0});latest.current={onLook,disabled};
 const stop=()=>{owner.current=null;vector.current={x:0,y:0};setKnob({x:0,y:0});};
 useEffect(()=>{stop();},[disabled,p.lookControl,p.lookDeadZone]);
 useEffect(()=>{let frame=0,last=performance.now();const loop=(now:number)=>{const dt=(now-last)/1000;last=now;if(owner.current!==null&&!latest.current.disabled)latest.current.onLook(vector.current.x,vector.current.y,dt);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);const blur=()=>stop();window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);return()=>{cancelAnimationFrame(frame);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);};},[]);
 const move=(e:React.PointerEvent<HTMLButtonElement>)=>{if(owner.current!==e.pointerId)return;const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2),scale=1/Math.max(1,Math.hypot(x,y));setKnob({x:x*scale*30,y:y*scale*30});vector.current=cameraStick(x,y,p.lookDeadZone);};
 return <div className={'rpg-camera-controls'+(building?' rpg-camera-controls--building':'')} onPointerDown={e=>e.stopPropagation()}>
 {p.lookControl!=='drag'&&<button className="rpg-camera-stick" aria-label={L('視点スティック','Camera stick','してんすてぃっく')} disabled={disabled} onPointerDown={e=>{if(disabled||owner.current!==null||e.button!==0)return;e.preventDefault();owner.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={e=>{if(owner.current===e.pointerId)stop();}} onPointerCancel={e=>{if(owner.current===e.pointerId)stop();}} onLostPointerCapture={e=>{if(owner.current===e.pointerId)stop();}}><span aria-hidden="true">◎</span><i style={{transform:`translate(${knob.x}px,${knob.y}px)`}}/><small>{L('視点','Look','してん')}</small></button>}
 <div className="rpg-camera-toolbar">{onView&&<button aria-label={L('カメラ切替','Switch camera','かめらきりかえ')} aria-pressed={thirdPerson} disabled={disabled} {...multiTouchAction(onView)}>{thirdPerson?'3P':'1P'}</button>}
 <button className="rpg-camera-reset" disabled={disabled} {...multiTouchAction(onReset)}>{L('視点を水平に戻す','Level camera','してんをすいへいにもどす')}</button></div></div>;
}
