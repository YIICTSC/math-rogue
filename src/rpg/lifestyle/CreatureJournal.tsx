import React, { lazy, Suspense, useState } from 'react';
import type { LanguageMode } from '../../types';
import type { Adventurer, World } from '../engine';
import { LIVESTOCK, PET_SPECIES } from '../farm/catalog';
import { animalArtId, hasRareCoat, type GrowthStage } from '../farm/animalLook';
import { assetUrl } from '../../utils/assetPaths';
import { copy } from '../town/catalog';
import { BIOMES } from '../biomes';
import { trans } from '../../utils/textUtils';
import { sandboxText } from '../MachineryInspector';
import { creaturePortrait } from './creatureArt';
import { WILDLIFE } from './wildlife';
import './creatureJournal.css';

const Preview = lazy(()=>import('./CreaturePreview'));
const domestic = [...LIVESTOCK,...PET_SPECIES];
const catalogue = [
  ...domestic.map(entry=>({id:entry.id,name:entry.name})),
  ...Object.entries(WILDLIFE).map(([id,profile])=>({id,name:profile.name})),
];

export default function CreatureJournal({world,player,languageMode}:{world:World;player:Adventurer;languageMode:LanguageMode}) {
  const [opened,setOpened]=useState(false);
  const [model,setModel]=useState(false);
  const [choice,setChoice]=useState('cow');
  const [stage,setStage]=useState<GrowthStage>('adult');
  const [rare,setRare]=useState(false);
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const farm=world.farm?.people[player.id];
  const kept=(id:string)=>(farm?.animals ?? []).filter(a=>a.kind===id).length+(farm?.pets ?? []).filter(p=>p.kind===id).length;
  const owned=kept(choice);
  const discovered=catalogue.filter(({id})=>Object.hasOwn(player.wildlifeSeen ?? {},id) || kept(id)>0).length;
  const entry=catalogue.find(entry=>entry.id===choice)!;
  const wild=WILDLIFE[choice], ranch=LIVESTOCK.find(item=>item.id===choice);
  const art=ranch ? animalArtId(choice,stage,rare?'rare':undefined) : choice;
  const habitat=wild?.habitat==='river' ? L('河川','Rivers','かわ')
    : wild?.habitat==='cave' ? L('地下の洞窟','Underground caves','ちかのどうくつ')
    : wild?.habitat==='sky' ? L('高い山と天空','High mountains and sky','たかいやまとてんくう')
    : wild?.habitat==='coast' ? L('沿岸の海','Coastal waters','えんがんのうみ')
    : wild ? trans(BIOMES.find(biome=>biome.id===wild.habitat)?.name || '',languageMode)
    : ranch ? L('牧場','Ranch','ぼくじょう') : L('自宅','Home','じたく');

  return <details className="rpg-creature-journal" onToggle={e=>{setOpened(e.currentTarget.open);if(!e.currentTarget.open)setModel(false);}}>
    <summary>{L('生き物図鑑','Creature journal','いきものずかん')} · {discovered}/{catalogue.length}</summary>
    {opened && <>
      <label>{L('生き物','Species','いきもの')}
        <select aria-label={L('生き物','Species','いきもの')} value={choice} onChange={e=>{setChoice(e.target.value);setStage('adult');setRare(false);}}>
          <optgroup label={L('牧場とペット','Ranch and pets','ぼくじょうとペット')}>{catalogue.slice(0,domestic.length).map(item=>
            <option key={item.id} value={item.id}>{copy(item.name,languageMode)}</option>)}</optgroup>
          <optgroup label={L('野生の生き物','Wildlife','やせいのいきもの')}>{catalogue.slice(domestic.length).map(item=>
            <option key={item.id} value={item.id}>{copy(item.name,languageMode)}{Object.hasOwn(player.wildlifeSeen ?? {},item.id) ? ' ✓' : ''}</option>)}</optgroup>
        </select>
      </label>
      {ranch && <label>{L('成長段階','Growth stage','せいちょうだんかい')}
        <select aria-label={L('成長段階','Growth stage','せいちょうだんかい')} value={stage} onChange={e=>setStage(e.target.value as GrowthStage)}>
          <option value="young">{L('子ども','Young','こども')}</option>
          <option value="growing">{L('育成中','Growing','いくせいちゅう')}</option>
          <option value="adult">{L('おとな','Adult','おとな')}</option>
        </select>
      </label>}
      {hasRareCoat(choice) && <button aria-pressed={rare} onClick={()=>setRare(value=>!value)}>{L('珍しい毛色','Rare coat','めずらしいけいろ')}</button>}
      <div className="rpg-creature-display">
        {model ? <Suspense fallback={<p role="status">{L('モデルを読み込み中','Loading model','モデルをよみこみちゅう')}</p>}>
          <Preview key={art} kind={art} languageMode={languageMode} />
        </Suspense> : <img src={assetUrl(creaturePortrait(art))} alt="" />}
        <button onClick={()=>setModel(value=>!value)}>{model ? L('イラストに戻る','Show illustration','イラストにもどる') : L('3Dで見る','Open 3D view','3Dでみる')}</button>
      </div>
      <h3>{copy(entry.name,languageMode)}</h3>
      <dl>
        <dt>{L('生息場所','Habitat','せいそくばしょ')}</dt><dd>{habitat}</dd>
        <dt>{L('食べ物','Food','たべもの')}</dt><dd>{wild?copy(wild.food,languageMode):ranch?L('飼料','Animal feed','しりょう'):L('ペットフード','Pet food','ペットフード')}</dd>
        {wild?<><dt>{L('発見','Sightings','はっけん')}</dt><dd>{Object.hasOwn(player.wildlifeSeen ?? {},choice)
          ? L(`${player.wildlifeSeen![choice]+1}日目に発見`,`First seen on day ${player.wildlifeSeen![choice]+1}`,`${player.wildlifeSeen![choice]+1}にちめにはっけん`)
          : L('未発見','Undiscovered','みはっけん')}</dd></>:<><dt>{L('飼育中','Under your care','しいくちゅう')}</dt><dd>{owned}</dd></>}
      </dl>
      {wild && <p>{copy(wild.fact,languageMode)}</p>}
      {ranch && <p>{L('健康と親密度を上げると、牧場で繁殖できます。','Healthy animals with a strong bond can breed at your ranch.','けんこうとしんみつどをあげると、ぼくじょうではんしょくできます。')}</p>}
    </>}
  </details>;
}
