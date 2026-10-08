import React from 'react';
import { ITEMS, WEAPONS, type Input, type Run } from './engine';
export default function EquipmentBar({run,en,onInput}:{run:Run;en:boolean;onInput:(v:Partial<Input>)=>void}) {
 const weapon=WEAPONS[run.weapon], item=ITEMS[run.item];
 return <div className="gear-loadout" aria-label={en?'Equipment slots':'装備スロット'}>
 <label>{en?'Weapon':'武器'}<select aria-label={en?'Weapon slot':'武器スロット'} value={run.weapon} onChange={e=>onInput({weapon:Number(e.target.value)})}>{WEAPONS.map((w,i)=><option key={i} value={i}>{w.icon} {en?w.en:w.ja} · {w.range}m</option>)}</select></label>
 <button disabled={run.ammo<weapon.cost} onClick={()=>onInput({shoot:true})}>{weapon.icon} {en?'Attack':'攻撃'} <small>{weapon.melee?'∞':run.ammo} · R</small></button>
 <label>{en?'Item':'アイテム'}<select aria-label={en?'Item slot':'アイテムスロット'} value={run.item} onChange={e=>onInput({item:Number(e.target.value)})}>{ITEMS.map((v,i)=><option key={i} value={i}>{v.icon} {en?v.en:v.ja} ×{run.items[i]}</option>)}</select></label>
 <button disabled={!run.items[run.item]||run.cooldown>0} onClick={()=>onInput({useItem:true})}>{item.icon} {en?'Use':'使う'} <small>X</small></button>
 </div>;
}
