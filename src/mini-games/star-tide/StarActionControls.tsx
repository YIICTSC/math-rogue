import React from 'react';
import type {World} from './engine';
import {TOOL_LABELS} from './content';
import {StarActionIcon,type StarAction} from './StarActionIcon';
import type {WeaponSlot} from './weaponControls';

type Props={world:World;en:boolean;active:boolean;interact:boolean;onAction:(name:string)=>void;onPress:(slot:WeaponSlot,source:string)=>void;onRelease:(source:string)=>void;onCancel:(source:string)=>void};
type ButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement>&{icon?:StarAction;weapon?:number;label:string;badge?:string;shortcut?:string;fill?:number;charging?:boolean};

function ActionButton({icon,weapon,label,badge,shortcut,fill=0,charging=false,className='',children,...props}:ButtonProps){
 return <button {...props} className={`st-action-btn ${className}`} data-charging={charging||undefined} style={{'--st-action-fill':`${Math.max(0,Math.min(1,fill))*360}deg`} as React.CSSProperties} onContextMenu={e=>e.preventDefault()}>
  <span className="st-action-face"><StarActionIcon action={icon} weapon={weapon}/>{badge&&<span className="st-action-badge">{badge}</span>}{shortcut&&<kbd className="st-action-key">{shortcut}</kbd>}</span>
  {weapon!==undefined?<small className="st-weapon-label">{label}</small>:<strong>{label}</strong>}{children}
 </button>;
}

export function StarActionControls({world:w,en,active,interact,onAction,onPress,onRelease,onCancel}:Props){
 const l=(ja:string,english:string)=>en?english:ja;
 const weapon=(slot:WeaponSlot)=>{
  const tool=slot==='b',equipped=tool?w.s.tool:w.s.weaponA,charging=w.chargeHeld&&w.chargeSlot===tool;
  const source=(id:number)=>`pointer-${id}`;
  return <ActionButton key={slot} className={`st-weapon st-weapon-${slot}`} weapon={equipped} icon={slot==='a'&&interact?'interact':undefined} badge={slot.toUpperCase()} shortcut={tool?'X':'Z'} label={slot==='a'&&interact?l('調べる','Interact'):TOOL_LABELS[equipped][en?1:0]} charging={charging} fill={charging?w.chargeTime/.5:0} disabled={!active}
   aria-label={tool?l('B 装備武器','B Equipped weapon'):l('A 装備武器・調べる','A Equipped weapon / interact')} title={l('短押しで攻撃・長押しで大技','Tap to attack; hold for a charged skill')}
   onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onPress(slot,source(e.pointerId));}}
   onPointerUp={e=>{e.preventDefault();onRelease(source(e.pointerId));}}
   onPointerCancel={e=>onCancel(source(e.pointerId))} onLostPointerCapture={e=>onCancel(source(e.pointerId))}
   onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();e.stopPropagation();onPress(slot,`button-${slot}`);}}}
   onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();onRelease(`button-${slot}`);}}}
   onClick={e=>{if(e.detail===0)onAction(slot);}}/>;
 };
 return <div className="st-action-cluster" role="group" aria-label={l('戦闘アクション','Combat actions')}>
  <div className="st-combat-tools">
   <ActionButton className="st-target" icon="target" label={l('注目','Lock on')} shortcut="Q" aria-label={l('注目 Q','Lock Q')} aria-pressed={Boolean(w.target)} disabled={!active} onClick={()=>onAction('target')}/>
   <ActionButton className="st-guard" icon="guard" label={l('防御','Guard')} shortcut="Shift" aria-label={l('防御 Shift・LB：長押し、直前でジャストガード','Guard Shift / LB: hold; time a perfect guard')} aria-pressed={w.guarding} disabled={!active}
    onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onAction('guard');}} onPointerUp={()=>onAction('unguard')} onPointerCancel={()=>{w.guarding=false;}} onLostPointerCapture={()=>{w.guarding=false;}}
    onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();e.stopPropagation();onAction('guard');}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();onAction('unguard');}}}/>
   <ActionButton className="st-awaken" icon="burst" label={w.drive>0?l('解放中','Burst'):l('必殺','Starburst')} shortcut="V" badge={w.drive>0?`${Math.ceil(w.drive)}s`:undefined} fill={w.drive>0?1:w.s.energy/100}
    aria-label={w.drive>0?l('星潮解放中','Starburst active'):l('星潮解放 V','Starburst V')} disabled={!active||w.s.energy<100||w.drive>0} onClick={()=>onAction('awaken')}>
    <meter className="st-visually-hidden" min={0} max={100} value={w.s.energy} aria-label={l('星潮ゲージ','Starburst charge')}/>
   </ActionButton>
  </div>
  <div className="st-buttons">{weapon('b')}{weapon('a')}<ActionButton className="st-dodge" icon="dodge" label={l('回避','Dodge')} shortcut="Space" disabled={!active} aria-label={l('回避','Dodge')} onClick={e=>{if(e.detail===0)onAction('roll');}} onPointerDown={e=>{e.preventDefault();onAction('roll');}}/></div>
  <div className="st-action-bottom"><ActionButton className="st-glide" icon="glide" label={w.gliderUnlocked?l('滑空','Glide'):l('帆','Sail')} badge={!w.gliderUnlocked?'🔒':undefined} shortcut="G" disabled={!active||!w.gliderUnlocked} aria-pressed={w.gliding} aria-label={w.gliderUnlocked?l('滑空 G','Glide G'):l('帆 🔒','Sail 🔒')} onClick={()=>onAction('glide')}/><span className="st-hold-hint">{l('A / B 長押しで大技','Hold A / B for a skill')}</span></div>
 </div>;
}
