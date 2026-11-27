import React, { useState } from 'react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import type { MachineCell } from './machinery';
import { energyOf } from './energy';
import { playerHeight, VOXEL_COLORS } from './voxel';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import type { VoxelItem } from './voxelCatalog';
import { copy } from './town/catalog';
import { earnedBlueprint, TECH_PLANS } from './technologyResearch';
import { blueprintCost, captureBlueprint, normalizeBlueprint, transformBlueprint,
  type Blueprint, type BlueprintAction, type BlueprintPreview } from './blueprints';

const STORAGE_KEY='rpg-construction-blueprints-v1';
const MAX_SAVED=16;
const AXES=['x','y','z'] as const;
const directions=['↑','→','↓','←'];

function loadBlueprints(): Blueprint[] {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]');
    return Array.isArray(saved) ? saved.slice(0,MAX_SAVED).map(normalizeBlueprint).filter((item):item is Blueprint=>!!item) : [];
  } catch { return []; }
}

export default function BlueprintPanel({world,player,languageMode,send,onPreview}:{world:World;player:Adventurer;languageMode:LanguageMode;send:(action:BlueprintAction)=>void;onPreview?:(value:BlueprintPreview)=>void}) {
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const current=()=>({x:Math.floor(player.position3D?.x??player.x),y:Math.floor(playerHeight(world,player)),z:Math.floor(player.position3D?.z??player.y)});
  const [library,setLibrary]=useState(loadBlueprints);
  const [choice,setChoice]=useState(0);
  const [corner,setCorner]=useState(current);
  const [size,setSize]=useState<MachineCell>({x:3,y:2,z:3});
  const [origin,setOrigin]=useState(current);
  const [name,setName]=useState('');
  const [turns,setTurns]=useState(0);
  const [mirror,setMirror]=useState(false);
  const [text,setText]=useState('');
  const [message,setMessage]=useState('');
  const pattern=library[choice] ? transformBlueprint(library[choice],turns,mirror) : null;
  const items=pattern ? Object.entries(blueprintCost(pattern)) : [];
  const affordable=items.every(([id,count])=>(player.life?.bag[id as VoxelItem]||0)>=(count??0))&&
    energyOf(player.life)+1e-8>=(pattern?.cells.length??0)*.1;
  const floors=[...new Set(pattern?.cells.map(cell=>cell.y)??[])].sort((a,b)=>a-b);
  const columns=Math.max(0,...(pattern?.cells.map(cell=>cell.x)??[]))+1;
  const earned=TECH_PLANS.filter(plan=>player.life?.research?.includes(plan.id));
  function save(next:Blueprint[]) {
    setLibrary(next);
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); }
    catch { setMessage(L('端末への保存に失敗しました','Could not save to this device','たんまつへのほぞんにしっぱいしました')); }
  }
  function add(blueprint:Blueprint) {
    setChoice(0);setTurns(0);setMirror(false);
    save([blueprint,...library].slice(0,MAX_SAVED));
  }
  function capture() {
    const blueprint=captureBlueprint(world,player,corner,size,name);
    if(!blueprint){
      setMessage(L('近くの自分の建材を1～48個選び、設計図に名前を付けてください。','Select 1–48 of your nearby blocks and give the blueprint a name.','ちかくのじぶんのけんざいを1～48こえらび、せっけいずになまえをつけてね。'));
      return;
    }
    add(blueprint);
    setMessage(L('設計図を保存しました','Blueprint saved','せっけいずをほぞんしました'));
  }
  function importPattern() {
    let incoming:Blueprint|null=null;
    try { incoming=normalizeBlueprint(JSON.parse(text)); } catch {}
    if(!incoming){
      setMessage(L('設計図を読み込めませんでした','Could not read the blueprint','せっけいずをよみこめませんでした'));
      return;
    }
    add(incoming);
    setMessage(L('設計図を読み込みました','Blueprint imported','せっけいずをよみこみました'));
  }
  function fields(value:MachineCell,onChange:(value:MachineCell)=>void,range=false) {
    return AXES.map(axis=><label key={axis}>{axis.toUpperCase()}
      <input type="number" value={value[axis]} min={range?1:undefined} max={range?8:undefined} onChange={e=>{
        const v=e.target.valueAsNumber;
        if(Number.isSafeInteger(v))onChange({...value,[axis]:v});
      }} />
    </label>);
  }
  return <section className="rpg-research-panel rpg-blueprint-panel" aria-label={L('建築の設計図','Construction blueprints','けんちくのせっけいず')}>
    {!!earned.length&&<label>{L('研究で得た設計図','Blueprints earned in the lab','けんきゅうでえたせっけいず')}
      <select value="" onChange={event=>{
        const plan=earned.find(value=>value.id===event.target.value);
        const pattern=plan&&earnedBlueprint(plan,copy(plan.title,languageMode));
        if(pattern)add(pattern);
      }}>
        <option value="" disabled>{L('選んで保存','Choose to save','えらんでほぞん')}</option>
        {earned.map(plan=><option key={plan.id} value={plan.id}>{copy(plan.title,languageMode)}</option>)}
      </select>
    </label>}
    <details>
      <summary>{L('ワールドの建築をコピー','Copy a structure','ワールドのけんちくをコピー')}</summary>
      <label>{L('設計図の名前','Blueprint name','せっけいずのなまえ')} <input value={name} onChange={e=>setName(e.target.value)} maxLength={32} /></label>
      <fieldset className="rpg-research-origin"><legend>{L('範囲の始点','Area origin','はんいのしてん')}</legend>
        {fields(corner,setCorner)}<button onClick={()=>setCorner(current())}>{L('現在地','My position','げんざいち')}</button>
      </fieldset>
      <fieldset className="rpg-research-origin"><legend>{L('範囲の大きさ（各8マスまで）','Area size (up to 8 per axis)','はんいのおおきさ（かく8マスまで）')}</legend>{fields(size,setSize,true)}</fieldset>
      <button onClick={capture}>{L('設計図に保存','Save as blueprint','せっけいずにほぞん')}</button>
      <button onClick={()=>send({type:'voxel-blueprint',command:'demolish',...corner,size})}>{L('指定範囲を撤去','Remove selected blocks','えらんだはんいをとりのぞく')}</button>
    </details>
    {!!library.length && <label>{L('保存した設計図','Saved blueprints','ほぞんしたせっけいず')}
      <select value={choice} onChange={e=>{setChoice(Number(e.target.value));setTurns(0);setMirror(false);}}>{library.map((item,i)=>
        <option value={i} key={i}>{item.name}</option>
      )}</select>
    </label>}
    {pattern && <>
      <div className="rpg-device-actions">
        <button onClick={()=>setTurns((turns+1)&3)}>{L('回転','Rotate','かいてん')} {turns*90}°</button>
        <button onClick={()=>setMirror(!mirror)} aria-pressed={mirror}>{L('左右反転','Mirror','さゆうはんてん')}</button>
        <button onClick={()=>{setText(JSON.stringify(pattern,null,2));setMessage(L('設計図のデータを書き出しました','Blueprint exported to the text box','せっけいずのデータをかきだしました'));}}>{L('書き出し','Export','かきだし')}</button>
      </div>
      <fieldset className="rpg-research-origin"><legend>{L('建築する位置','Placement origin','けんちくするいち')}</legend>
        {fields(origin,setOrigin)}<button onClick={()=>setOrigin(current())}>{L('現在地','My position','げんざいち')}</button>
      </fieldset>
      {floors.map(y=><section className="rpg-research-slice" key={y}><h4>Y {origin.y+y}</h4>
        <ol className="rpg-research-grid" style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}}>
          {pattern.cells.filter(cell=>cell.y===y).map(cell=><li key={cell.x+','+cell.z} style={{gridColumn:cell.x+1,gridRow:cell.z+1}}>
            <small><span className="rpg-research-color" style={{background:VOXEL_COLORS[cell.block]}} />{cell.x+origin.x}, {cell.z+origin.z}</small>
            <strong>{sandboxItemName(cell.block,languageMode)} {directions[cell.rotation]}</strong>
          </li>)}
        </ol>
      </section>)}
      <ul className="rpg-research-supplies">{items.map(([id,count])=><li key={id}>{sandboxItemName(id,languageMode)} ×{count}</li>)}</ul>
      <div className="rpg-device-actions">
        {onPreview&&<button onClick={()=>onPreview({origin,pattern})}>{L('ワールドで仮表示','Preview in world','ワールドでかりひょうじ')}</button>}
        <button disabled={!affordable} onClick={()=>send({type:'voxel-blueprint',command:'place',...origin,pattern})}>
          {L('まとめて建築','Build blueprint','まとめてけんちく')} · ⚡ {(pattern.cells.length*.1).toFixed(1)}
        </button>
      </div>
    </>}
    {!!player.life?.blueprintReceipt?.length && <button onClick={()=>send({type:'voxel-blueprint',command:'undo'})}>
      {L('直前の建築を取り消す','Undo last blueprint placement','まえのけんちくをとりけす')}
    </button>}
    <details open={!!text || undefined}>
      <summary>{L('設計図の読み込みと書き出し','Import and export','せっけいずのよみこみとかきだし')}</summary>
      <textarea aria-label={L('設計図データ','Blueprint data','せっけいずデータ')} value={text} onChange={e=>setText(e.target.value)} maxLength={18000} rows={5} />
      <button disabled={!text} onClick={importPattern}>{L('読み込み','Import','よみこみ')}</button>
    </details>
    {message&&<output role="status">{message}</output>}
  </section>;
}
