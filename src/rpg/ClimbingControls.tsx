import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { LanguageMode } from '../types';
import type { World } from './engine';
import { climbTarget, terrainJumpFactor } from './buildingPhysics';
import { ridingCart } from './machinery';
import { sandboxText } from './MachineryInspector';
import { traveling } from './transport';
import { blockAt, playerHeight, type VoxelAction } from './voxel';

export default function ClimbingControls({world,selfId,languageMode,disabled,send,twoD}:{world:World;selfId:string;languageMode?:LanguageMode;
  twoD:boolean;disabled?:boolean;send:(action:VoxelAction)=>void}) {
  const player=world.players[selfId];
  const sendRef=useRef(send);
  sendRef.current=send;
  const airborne=!!player?.position3D?.vy;
  useEffect(()=>{
    if(!twoD||!airborne||disabled)return;
    const timer=window.setInterval(()=>sendRef.current({type:'voxel-move',dx:0,dy:0}),80);
    return ()=>window.clearInterval(timer);
  },[twoD,airborne,disabled]);
  if (!player||disabled||world.gameMode!=='COOP'||player.spectator||traveling(world,player)||ridingCart(world,selfId)) return null;
  const up=climbTarget(world,player,1),down=climbTarget(world,player,-1);
  const spring=twoD&&terrainJumpFactor(blockAt(world,player.x,Math.ceil(playerHeight(world,player))-1,player.y))>1;
  if (!up&&!down&&!spring) return null;
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  return <div className="rpg-climbing-controls" aria-label={L('昇り降り','Climbing','のぼりおり')} onPointerDown={e=>e.stopPropagation()}>
    {(up||down) && <><button disabled={!up} onClick={()=>send({type:'voxel-climb',direction:1})}><ArrowUp size={17}/>{L('登る','Climb','のぼる')}</button>
      <button disabled={!down} onClick={()=>send({type:'voxel-climb',direction:-1})}><ArrowDown size={17}/>{L('降りる','Descend','おりる')}</button></>}
    {spring && <button disabled={airborne} onClick={()=>send({type:'voxel-jump'})}><ArrowUp size={17}/>{L('跳ねる','Bounce','はねる')}</button>}
  </div>;
}
