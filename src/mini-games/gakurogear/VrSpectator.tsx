import React,{useState} from 'react';
import HostSpectator,{useSpectatorTarget} from '../shared/HostSpectator';
import {playerSeats} from './onlineRules';
import type {OnlineWorld} from './onlineEngine';
import type {VrRoom} from './network';
export function useVrSpectator(world:OnlineWorld,selfId:string){
 const own=world.players[selfId],spectating=!!own?.spectator,players=playerSeats(world).filter(p=>p.connected),alive=players.filter(p=>!p.out);
 const candidates=world.mode==='coop'||!alive.length?players:alive;
 const [autoSwitch,setAutoSwitch]=useState(true);
 const {target,next}=useSpectatorTarget(spectating,candidates.map(p=>p.id),autoSwitch);
 const viewId=spectating?(target??selfId):selfId;
 return {own,spectating,viewId,autoSwitch,setAutoSwitch,viewed:world.players[viewId],next,count:candidates.length};
}
export default function VrSpectator({world,room,en,view}:{world:OnlineWorld;room:VrRoom;en:boolean;view:ReturnType<typeof useVrSpectator>}){
 return room.host&&!room.solo&&(world.phase!=='playing'||view.spectating)?<HostSpectator enabled={view.spectating} canChangeMode={world.phase!=='playing'} onChange={v=>room.setSpectator(v)} name={view.viewed?.id!==room.selfId?view.viewed?.name:undefined} count={view.count} onNext={view.next} autoSwitch={view.autoSwitch} onAutoSwitch={view.setAutoSwitch} languageMode={en?'ENGLISH':'JAPANESE'}/>:null;
}
