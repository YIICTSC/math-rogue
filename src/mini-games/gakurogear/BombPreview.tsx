import React,{useMemo} from 'react';
import BombCanvas from './BombCanvas';
import {createWorld,addPlayer,startWorld} from './onlineEngine';
export default function BombPreview({map}:{map:number}){
 const world=useMemo(()=>{const w=createWorld('bomb',1,{title:'',questions:[]},300);w.bombMap=map;addPlayer(w,'preview','');addPlayer(w,'other','');startWorld(w,20261014);Object.values(w.players).forEach(p=>p.invulnerable=0);return w;},[map]);
 return <div className="gear-bomb-preview"><BombCanvas key={map} world={world} selfId="preview" overview/></div>;
}
