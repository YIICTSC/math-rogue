import React,{useEffect,useRef,useState} from 'react';
export function stickVector(dx:number,dy:number,radius:number){const length=Math.hypot(dx,dy),scale=Math.max(radius,length,1);return {x:dx/scale,z:dy/scale};}
export default function BombStick({disabled,onChange,en}:{disabled:boolean;onChange:(x:number,z:number)=>void;en:boolean}){
 const owner=useRef<number|null>(null),center=useRef({x:0,y:0,radius:42}),change=useRef(onChange);change.current=onChange;
 const [knob,setKnob]=useState({x:0,z:0});
 const reset=()=>{owner.current=null;setKnob({x:0,z:0});change.current(0,0);};
 useEffect(()=>{if(disabled)reset();},[disabled]);
 useEffect(()=>{window.addEventListener('blur',reset);return()=>{window.removeEventListener('blur',reset);change.current(0,0);};},[]);
 const move=(x:number,y:number)=>{const c=center.current,value=stickVector(x-c.x,y-c.y,c.radius);setKnob(value);change.current(value.x,value.z);};
 return <div className="gear-bomb-stick-area"><div className={'gear-bomb-stick'+(disabled?' is-disabled':'')} role="group" aria-label={en?'Movement stick':'移動スティック'} onPointerDown={e=>{if(disabled||owner.current!==null)return;e.preventDefault();owner.current=e.pointerId;const r=e.currentTarget.getBoundingClientRect();center.current={x:r.left+r.width/2,y:r.top+r.height/2,radius:r.width*.32};e.currentTarget.setPointerCapture(e.pointerId);move(e.clientX,e.clientY);}} onPointerMove={e=>{if(owner.current===e.pointerId)move(e.clientX,e.clientY);}} onPointerUp={e=>{if(owner.current===e.pointerId)reset();}} onPointerCancel={e=>{if(owner.current===e.pointerId)reset();}} onLostPointerCapture={e=>{if(owner.current===e.pointerId)reset();}}><span className="gear-bomb-stick-cross" aria-hidden="true">＋</span><span className="gear-bomb-stick-knob" style={{transform:`translate(${knob.x*32}px,${knob.z*32}px)`}}/></div><small>{en?'MOVE / WASD':'移動 / WASD'}</small></div>;
}
