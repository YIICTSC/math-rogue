import {trans} from '../utils/textUtils';
import React,{useState} from 'react';
import {LANDMARKS,MOUNTAINS} from './worldLandscape';
import type {LanguageMode} from '../types';
export default function LandscapeCompass({x,z,languageMode}:{x:number;z:number;languageMode?:LanguageMode}){
 const [target,setTarget]=useState(0),l=LANDMARKS[target];
 if(!l)return null;
 const direction=Math.atan2(l.x-x,-(l.z-z))*180/Math.PI;
 return <details className="rpg-landscape-compass" onPointerDown={e=>e.stopPropagation()}>
  <summary>🧭 {Math.round(Math.hypot(l.x-x,l.z-z))} m <span style={{display:'inline-block',transform:`rotate(${direction}deg)`}}>↑</span></summary>
  <select aria-label="Destination" value={target} onChange={e=>setTarget(Number(e.target.value))}>{LANDMARKS.map((l,i)=><option key={l.id} value={i}>{trans(l.label,languageMode||'JAPANESE')}</option>)}</select>
  <svg viewBox="0 0 256 128" role="img" aria-label="Exploration map"><rect width="256" height="128" fill="#395847"/>{MOUNTAINS.map(m=><path key={m.x} d={`M${m.x-8},${m.z+7}l8,-15 8,15z`} fill="#cfdbe2"/>)}{LANDMARKS.map((v,i)=><circle key={v.id} cx={v.x} cy={v.z} r={i===target?4:2.5} fill={i===target?'#ffe28c':'#a5cce5'}/>)}<line x1={x} y1={z} x2={l.x} y2={l.z} stroke="#ffe28c" strokeWidth="1" strokeDasharray="3 3"/><circle cx={x} cy={z} r="3" fill="white"/></svg>
  <small>X {Math.floor(x)} · Z {Math.floor(z)} · 1 m / block</small>
 </details>;
}
