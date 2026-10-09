import {trans} from '../utils/textUtils';
import React,{useState} from 'react';
import {LANDMARKS,MOUNTAINS} from './worldLandscape';
import type {LanguageMode} from '../types';
export default function LandscapeCompass({x,z,languageMode}:{x:number;z:number;languageMode?:LanguageMode}){
 const [target,setTarget]=useState(0),l=LANDMARKS[target];
 const direction=Math.atan2(l.x-x,-(l.z-z))*180/Math.PI;
 return <details className="rpg-landscape-compass" onPointerDown={e=>e.stopPropagation()}>
  <summary>🧭 {Math.round(Math.hypot(l.x-x,l.z-z))} m <span style={{display:'inline-block',transform:`rotate(${direction}deg)`}}>↑</span></summary>
  <select aria-label="Destination" value={target} onChange={e=>setTarget(Number(e.target.value))}>{LANDMARKS.map((l,i)=><option key={l.id} value={i}>{trans(l.label,languageMode||'JAPANESE')}</option>)}</select>
  <svg viewBox="-512 -512 1280 1280" role="img" aria-label="Exploration map"><rect x="-512" y="-512" width="1280" height="1280" fill="#395847"/><rect width="192" height="88" fill="#d6b87b"/>{MOUNTAINS.map(m=><path key={m.x} d={`M${m.x-35},${m.z+30}l35,-65 35,65z`} fill="#cfdbe2"/>)}{LANDMARKS.map((v,i)=><circle key={v.id} cx={v.x} cy={v.z} r={i===target?19:11} fill={i===target?'#ffe28c':'#a5cce5'}/>)}<line x1={x} y1={z} x2={l.x} y2={l.z} stroke="#ffe28c" strokeWidth="4" strokeDasharray="9 9"/><circle cx={x} cy={z} r="12" fill="white"/></svg>
  <small>X {Math.floor(x)} · Z {Math.floor(z)} · 1 m / block</small>
 </details>;
}
