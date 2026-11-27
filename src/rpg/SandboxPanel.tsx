import React, { useState } from 'react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import { SANDBOX_OPTIONS, type SandboxAction, type SandboxOption, type ZoneAccess, type ZoneInput } from './sandboxAccess';
import { isMachinePart } from './machineryParts';

const zoneNames={private:['個人','Private','こじん'],shared:['共有','Shared','きょうゆう'],protected:['保護','Protected','ほご']} as const;
const eventNames={
  place:['設置','Placement','せっち'],break:['解体','Removal','かいたい'],device:['装置操作','Device control','そうちそうさ'],
  storage:['収納','Storage','しゅうのう'],fluid:['流体','Fluid','りゅうたい'],blueprint:['設計図','Blueprint','せっけいず'],undo:['復旧','Restored','ふっきゅう'],
} as const;

export default function SandboxPanel({world,player,languageMode,send}:{world:World;player:Adventurer;languageMode:LanguageMode;
  send:(action:SandboxAction)=>void}) {
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const local=([ja,en,hi]:readonly [string,string,string])=>L(ja,en,hi);
  const position=()=>({left:player.x-2,right:player.x+2,front:player.y-2,back:player.y+2});
  const [zone,setZone]=useState<ZoneInput>(()=>({name:'',...position(),access:'shared',owner:player.id}));
  const state=world.sandbox;
  const participants=Object.values(world.players).filter(person=>!person.spectator);
  const recent=[...(state?.history??[])].reverse();
  const overlap=(state?.zones??[]).some(old=>zone.left<=old.right&&zone.right>=old.left&&zone.front<=old.back&&zone.back>=old.front);
  const coordinates=[
    ['left','最小 X','Min X','さいしょう X'],['right','最大 X','Max X','さいだい X'],
    ['front','最小 Z','Min Z','さいしょう Z'],['back','最大 Z','Max Z','さいだい Z'],
  ] as const;
  return <section className="rpg-research-panel" aria-label={L('ワールド管理','World management','ワールドかんり')}>
    <h3>{L('ワールド管理','World management','ワールドかんり')}</h3>
    <div className="rpg-device-actions">
      {(Object.keys(SANDBOX_OPTIONS) as SandboxOption[]).map(option=><label key={option}>
        <input type="checkbox" checked={!!state?.options[option]} onChange={event=>send({type:'voxel-admin',command:'option',option,enabled:event.target.checked})} />
        {local(SANDBOX_OPTIONS[option])}
      </label>)}
    </div>
    <h3>{L('建築区域','Building zones','けんちくくいき')}</h3>
    <p>{L('個人区域は指定した冒険者が使えます。共有区域では仲間と作業できます。保護区域は建築や装置操作を止めます。',
      'A private zone is for one builder. Teammates can work in shared zones. Protected zones block building and device controls.',
      'こじんくいきはえらんだぼうけんしゃがつかえます。きょうゆうくいきではなかまとさぎょうできます。ほごくいきはけんちくやそうちそうさをとめます。')}</p>
    <form onSubmit={event=>{event.preventDefault();send({type:'voxel-admin',command:'zone',zone});}}>
      <label>{L('区域名','Zone name','くいきめい')} <input maxLength={24} required value={zone.name} onChange={event=>setZone({...zone,name:event.target.value})} /></label>
      <label>{L('利用できる人','Access','つかえるひと')}
        <select value={zone.access} onChange={event=>setZone({...zone,access:event.target.value as ZoneAccess})}>
          {(Object.keys(zoneNames) as ZoneAccess[]).map(access=><option key={access} value={access}>{local(zoneNames[access])}</option>)}
        </select>
      </label>
      {zone.access==='private'&&<label>{L('持ち主','Owner','もちぬし')}
        <select value={zone.owner} onChange={event=>setZone({...zone,owner:event.target.value})}>
          {participants.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>}
      <fieldset className="rpg-research-origin"><legend>{L('区域の範囲','Zone bounds','くいきのはんい')}</legend>
        {coordinates.map(([key,ja,en,hi])=><label key={key}>{L(ja,en,hi)}
          <input type="number" value={zone[key]} onChange={event=>{const value=event.target.valueAsNumber;if(Number.isSafeInteger(value))setZone({...zone,[key]:value});}} />
        </label>)}
        <button type="button" onClick={()=>setZone({...zone,...position()})}>{L('現在地を中心に','Center on my position','げんざいちをまんなかに')}</button>
      </fieldset>
      <button disabled={!zone.name.trim()||overlap||zone.left>zone.right||zone.front>zone.back||zone.right-zone.left>23||zone.back-zone.front>23}>
        {L('区域を登録','Register zone','くいきをとうろく')}
      </button>
      {overlap&&<small role="status">{L('既存の区域と重なっています','This overlaps an existing zone','すでにあるくいきとかさなっています')}</small>}
    </form>
    <ul className="rpg-device-inventory">{state?.zones.map(region=><li key={region.id}>
      <span>{region.name} · {local(zoneNames[region.access])} · X {region.left}–{region.right} / Z {region.front}–{region.back}</span>
      <button onClick={()=>send({type:'voxel-admin',command:'remove-zone',id:region.id})}>{L('指定を解除','Remove restriction','していをかいじょ')}</button>
    </li>)}</ul>
    {!!recent.length&&<details>
      <summary>{L('建築・操作履歴','Building and control history','けんちく・そうさりれき')} · {recent.length}</summary>
      <ul className="rpg-device-inventory">{recent.map(event=><li key={event.id}>
        <span>{event.name} · {local(eventNames[event.kind])}{event.block&&` · ${sandboxItemName(event.block,languageMode)}`}
          {event.tile&&` · ${event.tile.x}, ${event.tile.y}, ${event.tile.z}`}{event.undone?' ✓':''}</span>
        {event.kind==='place'&&!event.undone&&event.block&&!isMachinePart(event.block)&&event.block!=='door'&&
          <button onClick={()=>send({type:'voxel-admin',command:'undo',id:event.id})}>{L('設置を戻す','Undo placement','せっちをもどす')}</button>}
      </li>)}</ul>
    </details>}
  </section>;
}
