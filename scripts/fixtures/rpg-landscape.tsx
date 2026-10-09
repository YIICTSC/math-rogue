import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import Scene from '../../src/rpg/WorldScene3D';
import {createWorld,addPlayer,applyAction} from '../../src/rpg/engine';
import {landscapeHeight} from '../../src/rpg/worldLandscape';
const world=createWorld(42);addPlayer(world,'local','Explorer');world.started=true;
const player=world.players.local;player.life!.energy=6;
player.position3D={x:92.5,z:-22,y:0};
(window as any).world=world;
function App(){const [w,setWorld]=useState(world),[facing,setFacing]=useState(0);
 (window as any).visit=(x:number,z:number,y?:number,heading=0)=>{player.position3D={x,z,y:y??landscapeHeight(world.seed,Math.floor(x),Math.floor(z))};world.revision++;setWorld({...world});setFacing(heading);};
 return <div className="rpg-root" style={{position:'fixed',inset:0}}><Scene world={w} selfId="local" facing={facing} onFacing={setFacing} onTile={()=>{}} onUnavailable={()=>{throw new Error('3D unavailable');}} onVoxelAction={a=>{applyAction(world,'local',a,Date.now());setWorld({...world});}}/></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
