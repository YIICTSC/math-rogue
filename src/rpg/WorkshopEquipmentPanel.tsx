import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import { IMPRINTS, POTIONS, WORKSHOP_TOOLS, potionSeconds, toolLimit, type ExplorationPotion, type ToolImprint } from './explorationEquipment';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import type { ToolKind } from './voxelCatalog';
import { activeTools, nearbyWorkshop, repairMaterial, type WorkshopAction } from './voxelWorkshop';

export default function WorkshopEquipmentPanel({world,player,languageMode,send}:{world:World;player:Adventurer;
  languageMode:LanguageMode;send:(action:WorkshopAction)=>void}) {
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const localized=([ja,en,hi]:readonly [string,string,string])=>L(ja,en,hi);
  const item=(id:string)=>sandboxItemName(id,languageMode);
  const [imprint,setImprint]=useState<ToolImprint>('sharpness');
  const life=player.life, tools=activeTools(player);
  const [anvil,stone,table]=['anvil','whetstone','imprint_table'].map(block=>nearbyWorkshop(world,player,block));
  const study=Math.max(0,player.correctAnswers-(life?.imprintStudy||0));
  const names:Record<ToolKind,string>={pickaxe:L('ツルハシ','Pickaxe','ツルハシ'),axe:L('斧','Axe','おの'),shovel:L('シャベル','Shovel','シャベル')};
  const tierNames={stone:L('石','Stone','いし'),iron:L('鉄','Iron','てつ'),steel:L('鋼','Steel','はがね'),diamond:L('ダイヤ','Diamond','ダイヤ')};
  return <section className="rpg-research-panel">
    <h3>{L('道具の手入れ','Maintain tools','どうぐのていれ')}</h3>
    <p>{L('耐久が尽きると省エネルギーの効果が弱まります。金床と同じ材質の素材1個で修理できます。','Worn tools still work. Repair one with an anvil and one piece of its material.','たいきゅうがつきるとエネルギーをもっとつかいます。かなとことおなじしゅるいのそざい1こでしゅうりできます。')}</p>
    <p>{L('魔刻台で、正解の記録1問分と魔刻の書1冊を使い、道具に効果をつけます。砥石で効果を消せます。','Imprint tools at the imprinting table using one correct answer and one book. A grindstone can clear an imprint.','まこくだいで、せいかいのきろく1もんぶんとまこくのしょ1さつをつかいます。といしでこうかをけせます。')}
      {' · '}{L('使える正解','Available answers','つかえるせいかい')} {study} · {item('imprint_book')} ×{life?.bag.imprint_book||0}
    </p>
    <ul className="rpg-research-supplies">{(['anvil','whetstone','imprint_table','brew_table'] as const).map(station=>
      <li key={station}>{item(station)} {nearbyWorkshop(world,player,station)?'✓':'—'}</li>)}</ul>
    {WORKSHOP_TOOLS.some(tool=>tools[tool])&&<label>{L('付ける効果','Choose an imprint','つけるこうか')}
      <select value={imprint} onChange={e=>setImprint(e.target.value as ToolImprint)}>
        {(Object.keys(IMPRINTS) as ToolImprint[]).map(id=><option key={id} value={id}>{localized(IMPRINTS[id])}</option>)}
      </select>
    </label>}
    <div className="voxel-recipe-grid">{WORKSHOP_TOOLS.map(tool=>{
      const tier=tools[tool];
      if(!tier)return null;
      const limit=toolLimit(player,tool,tier), wear=life?.toolWear?.[tool]??0, magic=life?.toolImprints?.[tool];
      const material=repairMaterial(tier);
      return <article key={tool}>
        <strong>{tierNames[tier]} · {names[tool]}</strong>
        <small>{L('耐久','Durability','たいきゅう')} {Math.max(0,limit-wear)} / {limit}</small>
        {magic&&<small>{localized(IMPRINTS[magic])}</small>}
        <div className="rpg-device-actions">
          <button disabled={!anvil||!wear||!life?.bag[material]} onClick={()=>send({type:'voxel-tools',tool,operation:'repair'})}>
            {L('修理する','Repair','しゅうりする')} · {item(material)} ×1
          </button>
          {magic ? <button disabled={!stone} onClick={()=>send({type:'voxel-tools',tool,operation:'clean'})}>{L('効果を消す','Clear imprint','こうかをけす')}</button>
          : <button disabled={!table||!study||!life?.bag.imprint_book} onClick={()=>send({type:'voxel-tools',tool,operation:'imprint',imprint})}>
            {L('効果を付ける','Imprint','こうかをつける')}
          </button>}
        </div>
      </article>;
    })}</div>
    <h3>{L('探索用ポーション','Exploration potions','たんさくようポーション')}</h3>
    <div className="voxel-recipe-grid">{(Object.keys(POTIONS) as ExplorationPotion[]).map(id=>{
      const potion=POTIONS[id], duration=potionSeconds(world,player,id);
      return <article key={id}>
        <strong><FlaskConical size={15} /> {item(id)}</strong>
        <small>{localized(potion.copy)} · {potion.seconds} s</small>
        <button disabled={!!duration||!life?.bag[id]} onClick={()=>send({type:'voxel-potion',item:id})}>
          {duration ? `${L('効果中','Active','こうかちゅう')} ${Math.ceil(duration)} s` : `${L('飲む','Drink','のむ')} · ${life?.bag[id]||0}`}
        </button>
      </article>;
    })}</div>
  </section>;
}
