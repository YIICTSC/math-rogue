import {AbilityCutin} from './AbilityCutin';
import {preloadAbilityCutins} from './cutins';
import {BlenderAbilityEffect,preloadBlenderAbilities} from '../dungeons2/BlenderAbilityEffect';
import {abilityDescription} from './abilities';
import React from 'react';
import type {SchoolAdventure} from '../useSchoolAdventure';
import {createPortal} from 'react-dom';
import type {StudentAbility} from './abilities';
function AbilityKey({a,ability,index,disabled,compact,onInfo}:{a:SchoolAdventure;ability:StudentAbility;index:number;disabled:boolean;compact:boolean;onInfo?:(index:number)=>void}){
 const timer=React.useRef<ReturnType<typeof setTimeout>|null>(null),held=React.useRef(false),origin=React.useRef({x:0,y:0});
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
 React.useEffect(()=>clear,[]);
 const name=a.text(ability.name,ability.en),key=['Q','E','F'][index],remaining=a.abilityRemainingFor(index);
 return <button className={'student-ability-button'+(compact?' d2-ability-key':'')} type="button" aria-label={a.text('固有技','Unique ability')+(index?' '+(index+1):'')+(compact?' · '+name:'')} aria-keyshortcuts={key} data-gamepad-shortcut={index===0?'X':undefined} disabled={a.series===1&&disabled} aria-disabled={disabled} aria-haspopup={onInfo?'dialog':undefined} title={name+' · '+a.text(abilityDescription(ability,false),abilityDescription(ability,true))}
 onPointerDown={e=>{clear();held.current=false;if(!onInfo||e.button!==0)return;origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);timer.current=setTimeout(()=>{held.current=true;timer.current=null;onInfo(index);},500);}}
 onPointerMove={e=>{if(!onInfo||!timer.current)return;if(Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>12){clear();held.current=true;}}} onPointerUp={clear} onPointerCancel={()=>{clear();held.current=true;}} onBlur={clear}
 onContextMenu={e=>{if(onInfo){e.preventDefault();clear();held.current=true;onInfo(index);}}}
 onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')held.current=false;if(onInfo&&(e.key==='F1'||e.key==='ContextMenu')){e.preventDefault();onInfo(index);}}}
 onClick={e=>{clear();if(held.current){held.current=false;e.preventDefault();return;}if(!disabled)a.activateAbility(index);}}
 style={{'--ability-color':ability.color}as React.CSSProperties}>
 <span className="ability-slot-name">{`✦ ${name}`}</span><small>{remaining?`${remaining}T`:compact?key:a.text('必殺技','Ultimate')+' / '+key}</small></button>;
}
export function AbilityButton({adventure:a,compact=false}:{adventure:SchoolAdventure;compact?:boolean}){
 const [inspected,setInspected]=React.useState<number|null>(null);
 React.useEffect(()=>{preloadAbilityCutins(a.hero.id);setInspected(null);},[a.hero.id]);
 React.useEffect(()=>{if(a.state.place==='DUNGEON')preloadBlenderAbilities(a.hero.id,a.ability);},[a.hero.id,a.series,a.state.place]);
 const ability=inspected===null?null:a.abilities[inspected];
 return <><div className={a.abilities.length>1?'d2-ability-loadout':'student-ability-single'}>{a.abilities.map((ability,index)=>{
 const remaining=a.abilityRemainingFor(index),disabled=Boolean(a.abilityBlocked||a.panel||a.dojoRun||a.state.place!=='DUNGEON'||a.state.mode==='PUZZLE'||remaining>0);
 return <AbilityKey key={a.hero.id+ability.en} a={a} ability={ability} index={index} disabled={disabled} compact={compact} onInfo={a.series===2?setInspected:undefined}/>;
 })}</div>{ability&&createPortal(<div className="d2-ability-info-backdrop" onPointerDown={e=>e.stopPropagation()} onClick={e=>{if(e.target===e.currentTarget)setInspected(null);}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setInspected(null);if(e.key==='Tab')e.preventDefault();}}>
 <section role="dialog" aria-modal="true" aria-label={a.text('必殺技の効果','Ultimate skill effects')} className="d2-ability-info" data-gamepad-navigation-root data-gamepad-initial-scope="d2-ability-help" style={{'--ability-color':ability.color}as React.CSSProperties}>
 <h3>{a.text(ability.name,ability.en)}</h3><p>{a.text(abilityDescription(ability,false),abilityDescription(ability,true))}</p><button type="button" autoFocus data-gamepad-back data-gamepad-initial-choice onClick={()=>setInspected(null)}>{a.text('閉じる','Close')}</button>
 </section></div>,document.body)}</>;
}
export function AbilityBurst({adventure:a}:{adventure:SchoolAdventure}){const burst=a.abilityBurst;if(!burst)return null;return <div key={burst.id} className={`student-ability-burst ability-${burst.ability.effect}`} aria-live="polite" style={{'--ability-color':burst.ability.color}as React.CSSProperties}><AbilityCutin heroId={a.hero.id} abilityName={burst.ability.en} transformed={Boolean(a.state.transformed)}/><BlenderAbilityEffect heroId={a.hero.id} ability={burst.ability}/><i className="ability-rune"/><i className="ability-shockwave"/><i className="ability-shockwave second"/>{Array.from({length:12},(_,i)=><b key={i} style={{'--ray':i}as React.CSSProperties}/>)}<strong>{a.text(burst.ability.name,burst.ability.en)}</strong></div>;}
export function DungeonBiome({adventure:a}:{adventure:SchoolAdventure}){if(!a.expedition||a.state.place!=='DUNGEON'||a.dojoRun)return null;return <div className={`dungeon-biome biome-${a.expedition.biome}`} style={{'--biome-color':a.expedition.color}as React.CSSProperties}><span>{a.text(a.expedition.ja,a.expedition.en)} · {a.state.floor}/{a.expedition.floors}F{a.expedition.id==='CLOCKWORK'&&` · ${Math.max(0,100-a.state.floorTurns)} ${a.text('手','turns')}`}</span></div>;}
