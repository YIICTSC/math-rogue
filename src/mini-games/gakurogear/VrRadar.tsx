import React,{useState} from 'react';
import {MISSIONS} from './engine';
import {playerSeats,zoneOffset,safeRadius} from './onlineRules';
import type {OnlineWorld,Participant} from './onlineEngine';

export const participantNumber=(world:OnlineWorld,id:string)=>Object.keys(world.players).indexOf(id)+1;
export function playerObjective(world:OnlineWorld,player:Participant) {
  if(world.mode!=='coop')return Math.hypot(player.run.player.x,player.run.player.z)>safeRadius(world)?{x:0,z:0}:undefined;
  const base=MISSIONS[world.missionId-1],offset=zoneOffset(world,Math.max(0,playerSeats(world).findIndex(p=>p.id===player.id)));
  const targets=base.targets.filter((_,i)=>!player.run.collected[i]).map(p=>({x:p.x+offset.x,z:p.z+offset.z}));
  return targets.sort((a,b)=>Math.hypot(a.x-player.run.player.x,a.z-player.run.player.z)-Math.hypot(b.x-player.run.player.x,b.z-player.run.player.z))[0]??{x:base.exit.x+offset.x,z:base.exit.z+offset.z};
}
export default function VrRadar({world,player,en}:{world:OnlineWorld;player:Participant;en:boolean}) {
  const [full,setFull]=useState(false),size=world.mission.size??8,range=full?size:12;
  const x=full?0:player.run.player.x,z=full?0:player.run.player.z,objective=playerObjective(world,player);
  const selfSize=range*.075,markSize=range*.03;
  const delta=objective?{x:objective.x-player.run.player.x,z:objective.z-player.run.player.z}:undefined;
  const distance=delta?Math.hypot(delta.x,delta.z):0;
  return <div className="gear-radar-panel"><button type="button" aria-pressed={full} onClick={()=>setFull(v=>!v)}>{en?(full?'Nearby radar':'Expand radar'):(full?'近傍レーダー':'レーダーを拡大')}</button><svg role="img" className="gear-radar" viewBox={`${x-range} ${z-range} ${range*2} ${range*2}`} aria-label={en?(full?'Arena radar':'Nearby radar'):(full?'全体レーダー':'近傍レーダー')}>
    <rect x={x-range} y={z-range} width={range*2} height={range*2} fill="#071e20"/>
    {world.mission.obstacles.filter(b=>Math.abs(b.x-x)<range+b.w&&Math.abs(b.z-z)<range+b.d).map((b,i)=><rect key={i} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} fill="#667b6f"/>)}
    {world.mode==='royale'&&<circle cx={0} cy={0} r={safeRadius(world)} fill="none" stroke="#72f7bd" strokeWidth={range*.025}/>}
    {world.supplies.filter(s=>s.readyAt<=world.time).map(s=><circle key={`s${s.id}`} cx={s.x} cy={s.z} r={markSize} fill={s.kind==='ammo'?'#ffd36e':s.kind==='energy'?'#70dfff':'#ff92bb'}/>)}
    {playerSeats(world).filter(p=>p.connected&&p.id!==player.id).map(p=><circle key={p.id} cx={p.run.player.x} cy={p.run.player.z} r={markSize} fill={p.out?'#566165':'#ed9fff'}/>)}
    {objective&&<path d={`M${objective.x} ${objective.z-selfSize}l${selfSize} ${selfSize}l${-selfSize} ${selfSize}l${-selfSize} ${-selfSize}Z`} fill="#ffe58a" stroke="#172a25" strokeWidth={range*.012}/>}
    <path d={`M${player.run.player.x} ${player.run.player.z+selfSize}l${selfSize*.65} ${-selfSize*1.6}l${-selfSize*.65} ${selfSize*.3}l${-selfSize*.65} ${-selfSize*.3}Z`} transform={`rotate(${-player.run.player.angle*180/Math.PI} ${player.run.player.x} ${player.run.player.z})`} fill="white" stroke="#10202a" strokeWidth={range*.02}/>
    {!full&&delta&&distance>range*.75&&<path d={`M0 ${range*.72}l${range*.08} ${-range*.14}h${-range*.16}Z`} transform={`translate(${x} ${z}) rotate(${-Math.atan2(delta.x,delta.z)*180/Math.PI})`} fill="#ffe58a"/>}
  </svg><small>{en?'➤ You / ◆ Objective':'➤ 自分・観戦対象 / ◆ 目標'}{objective&&` · ${Math.round(distance)}m`}</small></div>;
}
