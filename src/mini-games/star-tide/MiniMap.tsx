import React from 'react';
import {ROOM_NAMES} from './content';
import type {World} from './engine';
export function MiniMap({world:w,en,expanded=false,onOpen}:{world:World;en:boolean;expanded?:boolean;onOpen?:()=>void}){
 const prefix=w.s.chapter+':',visited=new Set(w.s.visited),cleared=new Set(w.s.cleared),solved=new Set(w.s.solved),chests=new Set(w.s.chests);
 const chart=w.s.charts.includes(w.s.chapter);
 const cells=ROOM_NAMES.map((names,i)=>{
  const k=prefix+i,seen=visited.has(k),current=!w.inSky&&w.s.room===i,done=cleared.has(k),puzzle=solved.has(k),key=[17,19,21].includes(i)&&chests.has(k);
  return <span key={i} className={`st-map-cell ${seen?'seen':''} ${current?'current':''} ${done?'cleared':''} ${puzzle?'solved':''}`} aria-current={current?'location':undefined} title={`${i+1}. ${seen||chart?names[en?1:0]:'?'}${done?' ✓':''}${puzzle?' ◇':''}${key?' ★':''}`}><span>{seen||chart?i+1:'·'}</span><b>{key?'★':done&&puzzle?'✦':done?'✓':puzzle?'◇':current?'◆':''}</b></span>;
 });
 const label=en?'Area map: current location, combat cleared, mechanism solved and keys':'エリア地図：現在地・戦闘クリア・仕掛け攻略・鍵';
 const content=<><span className="st-map-heading">{en?'AREA':'エリア'} {w.inSky?'☁':w.s.room+1} / 24</span><span className="st-map-grid">{cells}</span><small>{en?'◆ You · ✓ Battle · ◇ Mechanism':'◆ 現在地 · ✓ 戦闘 · ◇ 仕掛け'}</small></>;
 return expanded?<div className="st-area-map expanded" role="img" aria-label={label}>{content}</div>:<button className="st-area-map" aria-label={label} onClick={onOpen}>{content}</button>;
}
