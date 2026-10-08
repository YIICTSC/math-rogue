import React from 'react';
import { ITEM_UNLOCKS, WEAPON_UNLOCKS, ITEMS, WEAPONS, type Input, type Run } from './engine';
export default function EquipmentBar({run,en,stageId,onInput}:{run:Run;en:boolean;stageId:number;onInput:(v:Partial<Input>)=>void}) {
 const weapon=WEAPONS[run.weapon], item=ITEMS[run.item];
 return <div className="gear-loadout" aria-label={en?'Equipment slots':'装備スロット'}>
 <div className="gear-weapon-slot"><label>{en?'Weapon':'武器'}<select aria-label={en?'Weapon slot':'武器スロット'} value={run.weapon} onChange={e=>onInput({weapon:Number(e.target.value)})}>{WEAPONS.map((w,i)=><option key={i} value={i} disabled={stageId<WEAPON_UNLOCKS[i]}>{stageId<WEAPON_UNLOCKS[i]?`🔒 ST.${WEAPON_UNLOCKS[i]} · `:""}{w.icon} {en?w.en:w.ja} · {w.range}m</option>)}</select></label>
 <button disabled={run.ammo<weapon.cost} onClick={()=>onInput({shoot:true})}>{weapon.icon} {en?'Attack':'攻撃'} <small>{weapon.melee?'∞':run.ammo} · R</small></button>
 </div><div className="gear-item-slot"><label>{en?'Item':'アイテム'}<select aria-label={en?'Item slot':'アイテムスロット'} value={run.item} onChange={e=>onInput({item:Number(e.target.value)})}>{ITEMS.map((v,i)=><option key={i} value={i} disabled={stageId<ITEM_UNLOCKS[i]}>{stageId<ITEM_UNLOCKS[i]?`🔒 ST.${ITEM_UNLOCKS[i]} · `:""}{v.icon} {en?v.en:v.ja} ×{run.items[i]}</option>)}</select></label>
 <button disabled={!run.items[run.item]||run.cooldown>0} onClick={()=>onInput({useItem:true})}>{item.icon} {en?'Use':'使う'} <small>X</small></button>
 </div></div>;
}
