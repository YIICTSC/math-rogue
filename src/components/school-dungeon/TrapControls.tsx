import React from 'react';
import {Download,Upload} from 'lucide-react';
import type {SchoolAdventure} from './useSchoolAdventure';
import './trap-controls.css';
export function TrapControls({adventure:a,blocked=false}:{adventure:SchoolAdventure;blocked?:boolean}){
 const s=a.state,l=a.text,disabled=blocked||Boolean(a.panel||a.dojoRun||a.abilityBlocked)||s.place!=='DUNGEON';
 return <div className="dungeon-trap-controls" role="group" aria-label={l('罠の操作','Trap controls')} onPointerDown={e=>e.stopPropagation()}>
 <button disabled={disabled||s.pouch.length>=8} onClick={()=>a.trapAction()} aria-label={l('正面の罠を回収','Collect trap ahead')} title={l('正面の見えている罠を回収・1ターン','Collect a visible trap ahead · 1 turn')}><Download size={15}/><span>{l('罠回収','Collect')}</span></button>
 <button disabled={disabled||!s.pouch.length} onClick={()=>a.trapAction(true)} aria-label={l('正面に罠を置く','Place trap ahead')} title={l('正面に罠を再配置・1ターン','Place a carried trap ahead · 1 turn')}><Upload size={15}/><span>{l('罠配置','Place')}</span><small>{s.pouch.length}/8</small></button>
 </div>;
}
