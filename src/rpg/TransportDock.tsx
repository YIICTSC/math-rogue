import React, { useState } from 'react';
import { Anchor, ArrowUpRight, Box, Navigation, Ship, Wind, X } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import { boardedBoat, closeWatercraft, glideEstimate, launchGlide, launchLocation, type TransportAction } from './transport';
import { isWatercraftItem, WATERCRAFT } from './transportCatalog';
import { PACK_SPECIES, nearPackAnimal, ownedPackAnimal, packFeedCandidates, type PackAction } from './packAnimals';
import { PackAnimalPanel } from './PackAnimalPanel';
import { ALL_MATERIAL_NAMES, type VoxelItem } from './voxelCatalog';
import { playerHeight } from './voxel';
import './transport.css';

type Translate = (ja: string, en: string, hi: string) => string;

function Hold({cargo,limit,player,transfer,L,languageMode}:{cargo:Partial<Record<VoxelItem,number>>;limit:number;player:Adventurer;
  transfer:(item:VoxelItem,amount:number,direction:'load'|'unload')=>void;L:Translate;languageMode?:LanguageMode}) {
  const [item,setItem]=useState<VoxelItem|''>('');
  const bag=player.life?.bag ?? {};
  const items=Object.keys(bag).filter(id=>Object.hasOwn(ALL_MATERIAL_NAMES,id)&&bag[id as VoxelItem]!>0) as VoxelItem[];
  const picked=item&&items.includes(item)?item:items[0];
  const occupiedSlots=Object.keys(cargo).length;
  const capacity=picked&&(cargo[picked] ?? 0)>0 || occupiedSlots<limit;
  const name=(id:string)=>sandboxItemName(id,languageMode);
  return <details className="rpg-boat-hold">
    <summary><Box size={15}/> {L('積み荷','Cargo hold','つみに')} · {occupiedSlots} / {limit}</summary>
    <ul>{Object.entries(cargo).map(([id,count])=><li key={id}><span>{name(id)} ×{count}</span>
      <button onClick={()=>transfer(id as VoxelItem,count!,'unload')}>
        {L('下ろす','Unload','おろす')}</button></li>)}</ul>
    {items.length>0 && <div className="rpg-transport-actions">
      <select aria-label={L('積む素材','Item to load','つむそざい')} value={picked} onChange={e=>setItem(e.target.value as VoxelItem)}>
        {items.map(id=><option value={id} key={id}>{name(id)} ×{bag[id]}</option>)}
      </select>
      {[1,8].map(amount=><button key={amount} disabled={!capacity || (bag[picked] ?? 0)<amount || (cargo[picked] ?? 0)+amount>64}
        onClick={()=>transfer(picked,amount,'load')}>
        {L('積む','Load','つむ')} ×{amount}</button>)}
    </div>}
  </details>;
}

export default function TransportDock({world,selfId,languageMode,facing,disabled,send}:{world:World;selfId:string;
  languageMode?:LanguageMode;facing:number;disabled?:boolean;send:(action:TransportAction|PackAction)=>void}) {
  const [open,setOpen]=useState(false),[launchHeading,setLaunchHeading]=useState<number|null>(null);
  const player=world.players[selfId];
  if (!player || player.spectator || world.gameMode!=='COOP' || disabled) return null;
  const hulls=Object.keys(player.life?.bag ?? {}).filter(id=>isWatercraftItem(id)&&player.life?.bag[id]!>0).filter(isWatercraftItem);
  const nearby=closeWatercraft(world,player);
  const aboard=boardedBoat(world,selfId), glide=player.gliding, hasWing=!!player.life?.bag.glider_wing;
  const friend=ownedPackAnimal(world,selfId), companion=friend&&nearPackAnimal(world,player,friend)?friend:undefined;
  const onAnimal=companion?.rider===selfId;
  const wild=!aboard&&!glide&&!friend&&!!(player.life?.bag.hay||player.life?.bag.herb)?packFeedCandidates(world,player):[];
  if (!nearby.length&&!hulls.length&&!glide&&!hasWing&&!companion&&!wild.length) return null;
  const L: Translate=(ja,en,hi)=>sandboxText(languageMode,ja,en,hi);
  const heading=launchHeading??((Math.round(facing)%4+4)%4);
  const estimate=glide ? glideEstimate(world,player) : null;
  const bearing=glide ? Math.round((Math.atan2(glide.dx,-glide.dz)*180/Math.PI+360)%360) : 0;
  const name=L('乗り物','Transport','のりもの');
  const hasBoost=!!player.life?.bag.glider_boost;
  const route=estimate?.point;
  const launchPoint=open && hulls.length>0 && !aboard ? launchLocation(world,player) : null;

  return <><div className="rpg-transport-dock" onPointerDown={event=>event.stopPropagation()}>
    {glide && route ? <div className="rpg-glider-instruments" aria-label={L('滑空計器','Gliding instruments','かっくうけいき')}>
      <div><Navigation size={17} style={{transform:`rotate(${bearing-45}deg)`}} /> <strong>{bearing}°</strong>
        <span>Y {playerHeight(world,player).toFixed(1)} m</span></div>
      <small>{L('残り','Range','のこり')} {Math.round(estimate.distance)} m · {L('着地','Landing','ちゃくち')} {Math.floor(route.x)}, {Math.floor(route.z)}</small>
      <button disabled={!hasBoost || glide.usedBoost} onClick={()=>send({type:'voxel-transport',command:'boost'})}>
        <Wind size={16}/> {L('加速','Boost','かそく')}{glide.boost>0 ? ` ${glide.boost.toFixed(1)} s` : ''}</button>
    </div> : <div className="rpg-transport-actions">
      <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}><Ship size={17}/> {name}</button>
      {aboard && <button onClick={()=>send({type:'voxel-transport',command:'dock',boat:aboard.id})}><Anchor size={15}/>
        {L('下船','Disembark','ふねをおりる')}</button>}
      {onAnimal && <button onClick={()=>send({type:'voxel-pack-animal',command:'dismount',id:companion.id})}>
        {L('騎乗をやめる','Dismount','きじょうをやめる')}</button>}
    </div>}
    </div>
    {open && !glide && <div className="voxel-workshop-overlay" onPointerDown={event=>event.stopPropagation()}
      onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setOpen(false);}}>
      <section className="voxel-workshop rpg-transport-panel" role="dialog" aria-modal="true" aria-label={name}>
        <header><h2>{name}</h2><button autoFocus aria-label={L('閉じる','Close','とじる')} onClick={()=>setOpen(false)}><X size={19}/></button></header>
        <div className="voxel-workshop-scroll">
          {!aboard && !onAnimal && hulls.length>0 && <section><h3>{L('進水','Launch','ふねをだす')}</h3>
            <div className="rpg-transport-actions">{hulls.map(item=><button key={item} disabled={!launchPoint}
              onClick={()=>send({type:'voxel-transport',command:'launch',item})}>{sandboxItemName(item,languageMode)}</button>)}</div>
            <p>{L('岸辺で組み立てた船を出せます。','Launch a crafted boat beside open water.','みずべでつくったふねをだせます。')}</p>
          </section>}
          {nearby.map(boat=>{
            const owner=boat.owner===selfId, ready=!onAnimal&&!aboard&&!boat.rider;
            return <section key={boat.id} className="rpg-transport-boat"><h3><Ship size={17}/>{sandboxItemName(boat.item,languageMode)}</h3>
              <small>{Math.floor(boat.x)}, {Math.floor(boat.z)} · {world.players[boat.rider ?? '']?.name ?? L('停泊中','Moored','ていはくちゅう')}</small>
              <div className="rpg-transport-actions">
                {ready && <button onClick={()=>{send({type:'voxel-transport',command:'board',boat:boat.id});setOpen(false);}}>{L('乗る','Board','のる')}</button>}
                {ready && owner && <button disabled={Object.keys(boat.cargo).length>0} onClick={()=>send({type:'voxel-transport',command:'stow',boat:boat.id})}>
                  {L('回収','Stow','かいしゅう')}</button>}
                {aboard===boat && <button onClick={()=>{send({type:'voxel-transport',command:'dock',boat:boat.id});setOpen(false);}}>{L('下船','Disembark','ふねをおりる')}</button>}
              </div>
              {!onAnimal && owner && (!boat.rider || boat.rider===selfId) && WATERCRAFT[boat.item].slots>0 &&
                <Hold cargo={boat.cargo} limit={WATERCRAFT[boat.item].slots} player={player} L={L} languageMode={languageMode}
                  transfer={(item,amount,direction)=>send({type:'voxel-transport',command:'cargo',boat:boat.id,item,amount,direction})}/>}
            </section>;
          })}
          {hasWing && !aboard && !onAnimal && <section><h3>{sandboxItemName('glider_wing',languageMode)}</h3>
            <p>{L('高台の縁で方角を選んで飛び出します。飛行中は移動操作で旋回できます。','Choose a heading beside a drop and launch. Steer in the air with the movement controls.','たかだいのふちでほうがくをえらんでとびだします。とびながらいどうそうさでまがれます。')}</p>
            <div className="rpg-transport-actions"><select aria-label={L('滑空方向','Glide heading','かっくうほうこう')}
              value={heading} onChange={e=>setLaunchHeading(Number(e.target.value))}>
              {['↑ N','→ E','↓ S','← W'].map((label,i)=><option key={label} value={i}>{label}</option>)}
            </select><button disabled={!launchGlide(world,player,heading)} onClick={()=>{send({type:'voxel-transport',command:'glide',heading});setOpen(false);}}>
              <ArrowUpRight size={17}/> {L('滑空を始める','Launch glider','かっくうをはじめる')}</button></div>
          </section>}
          {!aboard && <PackAnimalPanel world={world} player={player} animal={companion} candidates={wild} languageMode={languageMode}
            send={send} onMount={()=>setOpen(false)} cargo={companion&&<Hold cargo={companion.cargo} limit={PACK_SPECIES[companion.kind].slots}
              player={player} L={L} languageMode={languageMode} transfer={(item,amount,direction)=>
                send({type:'voxel-pack-animal',command:'cargo',id:companion.id,item,amount,direction})}/>}/>}
        </div>
      </section>
    </div>}
  </>;
}
