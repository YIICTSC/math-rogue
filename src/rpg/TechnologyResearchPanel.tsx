import React, { useState } from 'react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import type { MachineCell } from './machinery';
import { playerHeight, voxelKey, VOXEL_COLORS } from './voxel';
import { copy } from './town/catalog';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import { TECH_PLANS, researchStatus, type ResearchAction } from './technologyResearch';

const arrows=['↑','→','↓','←'];
export default function TechnologyResearchPanel({world,player,languageMode,send}:{world:World;player:Adventurer;languageMode:LanguageMode;send:(action:ResearchAction)=>void}) {
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const currentCell=()=>({
    x:Math.floor(player.position3D?.x??player.x),
    y:Math.floor(playerHeight(world,player)),
    z:Math.floor(player.position3D?.z??player.y),
  });
  const [id,setId]=useState(TECH_PLANS[0].id);
  const [origin,setOrigin]=useState(currentCell);
  const plan=TECH_PLANS.find(plan=>plan.id===id)!;
  const status=researchStatus(world,player,plan,origin), done=player.life?.research?.includes(plan.id);
  const heights=[...new Set(plan.parts.map(part=>part.y))].sort((a,b)=>a-b);
  const supplies=new Map(Object.entries(plan.supplies ?? {}));
  for (const {block} of plan.parts) supplies.set(block,(supplies.get(block)??0)+1);
  const minX=Math.min(...plan.parts.map(part=>part.x)),minZ=Math.min(...plan.parts.map(part=>part.z));
  const cols=Math.max(...plan.parts.map(part=>part.x))-minX+1;
  return <section className="rpg-research-panel" aria-label={L('技術研究所','Technology lab','ぎじゅつけんきゅうじょ')}>
    <header><h3>{L('技術研究所','Technology lab','ぎじゅつけんきゅうじょ')}</h3><b>{player.life?.research?.length ?? 0} / {TECH_PLANS.length}</b></header>
    <label>{L('設計図','Blueprint','せっけいず')}
      <select value={id} onChange={e=>setId(e.target.value)}>{TECH_PLANS.map(plan=>(
        <option value={plan.id} key={plan.id}>{copy(plan.title,languageMode)}{player.life?.research?.includes(plan.id)?' ✓':''}</option>
      ))}</select>
    </label>
    <p>{copy(plan.directions,languageMode)}</p>
    <h3>{L('必要な材料','Materials needed','ひつようなざいりょう')}</h3>
    <ul className="rpg-research-supplies">{[...supplies].map(([item,count])=><li key={item}>{sandboxItemName(item,languageMode)} ×{count}</li>)}</ul>
    <div className="rpg-research-origin">
      <span>{L('基準座標','Origin','きじゅんざひょう')}</span>
      {(['x','y','z'] as const).map(axis=><label key={axis}>{axis.toUpperCase()} <input type="number" value={origin[axis]}
        onChange={e=>{const value=e.target.valueAsNumber;if(Number.isSafeInteger(value))setOrigin(o=>({...o,[axis]:value}));}} /></label>)}
      <button onClick={()=>setOrigin(currentCell())}>{L('現在地を使う','Use my position','げんざいちをつかう')}</button>
    </div>
    {heights.map(height=><section className="rpg-research-slice" key={height}>
      <h4>Y {origin.y+height} · {L('北','North','きた')} ↑</h4>
      <ol className="rpg-research-grid" style={{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}}>
        {plan.parts.map((part,index)=>{
          if (part.y!==height) return null;
          const x=origin.x+part.x,y=origin.y+part.y,z=origin.z+part.z, key=voxelKey(x,y,z);
          const mark=world.voxels?.edits[key]===part.block && world.voxels?.placedBy?.[key]===player.id;
          return <li key={key} data-placed={mark} style={{gridColumn:part.x-minX+1,gridRow:part.z-minZ+1}}>
            <small><span className="rpg-research-color" style={{background:VOXEL_COLORS[part.block]}} />{index+1} · {x}, {z}</small>
            <strong>{sandboxItemName(part.block,languageMode)} {arrows[part.rotation]}{mark?' ✓':''}</strong>
          </li>;
        })}
      </ol>
    </section>)}
    <footer className="rpg-research-progress">
      <span>{L('配置','Parts placed','はいち')} {status.found} / {plan.parts.length}</span>
      <button disabled={done||!status.ready} onClick={()=>send({type:'voxel-research',plan:id,...origin})}>
        {done? L('達成済み','Completed','たっせいずみ') : L('動作を記録する','Record working machine','どうさをきろくする')}
      </button>
    </footer>
  </section>;
}
