import React,{useRef,useState,useEffect} from 'react';
import {createPortal} from 'react-dom';
import type {SchoolAdventure} from '../useSchoolAdventure';
import {TECHNIQUES,WEAPONS,WEAPON_KINDS,equippedWeaponKind,techniqueCost,techniqueRank,weaponLevel,type WeaponKind} from '../dungeons1/mastery';
import {WeaponKindIcon} from '../dungeons1/MasteryPanel';
import './techniques.css';
export function TechniqueBar({adventure:a,weapon,logs,onUse,blocked=false}:{adventure:SchoolAdventure;weapon:any;logs:string[];onUse:(id:string)=>boolean;blocked?:boolean}){
 const kind=equippedWeaponKind(weapon),p=a.martialProgress,l=a.text,gauge=a.techniqueGauge;
 const [detail,setDetail]=useState(''),[tab,setTab]=useState<WeaponKind>(kind);const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),held=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const open=(id='')=>{setDetail(id);setTab(kind);a.setPanel('TECHNIQUES');};
 const use=(id:string)=>{if(onUse(id)){a.closeTechniquePanel();return true;}return false;};
 const selected=TECHNIQUES.find(t=>t.id===detail)||TECHNIQUES.find(t=>t.kind===tab)!;
 const usable=!blocked&&!a.abilityBlocked&&a.state.place==='DUNGEON'&&a.state.mode!=='PUZZLE'&&!a.isDojoActive();
 const slots=p.slots[kind]||['','','',''];
 const close=()=>a.closeTechniquePanel();
 useEffect(()=>{if(a.panel!=='TECHNIQUES')return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopImmediatePropagation();close();}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[a.panel]);
 return <div className="dungeon-technique-area" onPointerDown={e=>e.stopPropagation()}>
  <div className="dungeon-technique-bar" aria-label={l('ひらめき技','Discovered techniques')}>
   <div className="technique-energy" role="meter" aria-label={l('技ゲージ','Technique energy')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={gauge}><small>{l('技','TP')}</small><b>{gauge}</b><i><span style={{width:gauge+'%'}}/></i></div>
   {slots.map((id,i)=>{const t=TECHNIQUES.find(t=>t.id===id),cost=t?techniqueCost(t,techniqueRank(p,t.id)):0,ready=Boolean(t&&usable&&gauge>=cost);return <button key={i} className={'technique-shortcut'+(ready?' ready':'')} aria-disabled={!ready} aria-label={t?`${l(t.ja,t.en)} · ${cost} TP`:l('未登録','Empty slot')} onPointerDown={()=>{held.current=false;clearTimeout(timer.current);timer.current=setTimeout(()=>{held.current=true;open(id);},450);}} onPointerUp={()=>clearTimeout(timer.current)} onPointerCancel={()=>clearTimeout(timer.current)} onPointerLeave={()=>clearTimeout(timer.current)} onContextMenu={e=>{e.preventDefault();held.current=true;open(id);}} onClick={()=>{if(held.current){held.current=false;return;}if(t){if(ready)use(t.id);else open(t.id);}else open();}}>
    {t?<><WeaponKindIcon kind={kind} size={20}/><span className="technique-name">{l(t.ja,t.en)}</span><small className="technique-cost">{cost}</small></>:<><b>＋</b><small>{l('未登録','Empty')}</small></>}
   </button>})}
   <button className="technique-all" onClick={()=>open()}>{l('全技','All')}<small>≡</small></button>
  </div>
  <div className="dungeon-log-strip" role="log" aria-live="polite">{logs.slice(-2).map((text,i)=><div key={i}>{text}</div>)}</div>
  {a.panel==='TECHNIQUES'&&createPortal(<div className="technique-modal" role="dialog" aria-modal="true" aria-label={l('ひらめき技','Discovered techniques')} data-gamepad-modal onPointerDown={e=>e.stopPropagation()}><section><header><h2>{l('ひらめき技・スロット','Techniques & shortcuts')}</h2><button autoFocus onClick={close}>{l('閉じる','Close')} ×</button></header><p>{l('通常攻撃で技ゲージを獲得。ひらめいた瞬間は無料で発動。','Normal attacks build energy. Newly discovered techniques activate for free.')}</p><nav>{WEAPON_KINDS.map(k=><button key={k} aria-pressed={tab===k} onClick={()=>{setTab(k);setDetail(TECHNIQUES.find(t=>t.kind===k)!.id);}}>{l(WEAPONS[k].ja,WEAPONS[k].en)} Lv{weaponLevel(p,k)}</button>)}</nav><div className="technique-collection">{TECHNIQUES.filter(t=>t.kind===tab).map(t=><button key={t.id} aria-pressed={selected.id===t.id} onClick={()=>setDetail(t.id)}><WeaponKindIcon kind={t.kind} size={28}/><span>{l(t.ja,t.en)}</span><small>{p.learned.includes(t.id)?'✧':'🔒'}</small></button>)}</div><article><h3>{l(selected.ja,selected.en)}</h3><p>{l('消費','Cost')} {techniqueCost(selected,techniqueRank(p,selected.id))} TP · ×{selected.power} · {l('技熟練','Rank')} {techniqueRank(p,selected.id)}/5</p><p>{l('使用回数','Uses')}: {p.techniqueUses[selected.id]||0} · {l(selected.pattern==='burst'?'周囲8方向':selected.pattern==='sweep'?'前方なぎ払い':selected.pattern==='pierce'?'貫通攻撃':'単体攻撃',selected.pattern==='burst'?'All adjacent foes':selected.pattern==='sweep'?'Frontal sweep':selected.pattern==='pierce'?'Piercing attack':'Single target')}</p>{p.learned.includes(selected.id)?<><div className="technique-register">{[0,1,2,3].map(i=><button key={i} onClick={()=>a.setTechniqueSlot(tab,i,selected.id)}>{l('登録','Set')} {i+1}</button>)}</div><button className="technique-use" disabled={!usable||selected.kind!==kind||gauge<techniqueCost(selected,techniqueRank(p,selected.id))} onClick={()=>use(selected.id)}>{l('発動','Activate')}</button></>:<p>{l('武器と前段階の技を鍛えてひらめこう。','Train this weapon and its earlier techniques to discover it.')}</p>}</article></section></div>,document.body)}
 </div>;
}
