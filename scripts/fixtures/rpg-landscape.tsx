import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import '../../src/rpg/rpg.css';
import Scene from '../../src/rpg/WorldScene3D';
import Canvas from '../../src/rpg/WorldCanvas';
import {createWorld,addPlayer,applyAction} from '../../src/rpg/engine';
import {landscapeHeight} from '../../src/rpg/worldLandscape';
const world=createWorld(42);addPlayer(world,'local','Explorer');world.started=true;
const player=world.players.local;player.life!.energy=6;
player.position3D={x:92.5,z:-22,y:0};
(window as any).world=world;
function App(){const [w,setWorld]=useState(world),[facing,setFacing]=useState(0),[mode,setMode]=useState(true),[overview,setOverview]=useState(false);
 (window as any).mapMode=(three:boolean,all=false)=>{if(!three)applyAction(world,'local',{type:'voxel-snap'},Date.now());setMode(three);setOverview(all);setWorld({...world});};
 (window as any).editMap=(edits:Record<string,string|null>,rotations:Record<string,number>={})=>{world.voxels??={edits:{},revision:0,terrainVersion:2};Object.assign(world.voxels.edits,edits);Object.assign(world.voxels.rotations??={},rotations);world.voxels.revision++;world.revision++;setWorld({...world});};
 (window as any).visit=(x:number,z:number,y?:number,heading=0)=>{player.position3D={x,z,y:y??landscapeHeight(world.seed,Math.floor(x),Math.floor(z))};world.revision++;setWorld({...world});setFacing(heading);};
 return <div className="rpg-root" style={{position:'fixed',inset:0,padding:0}}><div className="rpg-map-container" style={{position:'absolute',inset:0,margin:0,border:0,borderRadius:0,height:'100%',maxHeight:'none',minHeight:0}}>{mode?<Scene world={w} selfId="local" facing={facing} onFacing={setFacing} onTile={()=>{}} onUnavailable={()=>{throw new Error('3D unavailable');}} onVoxelAction={a=>{applyAction(world,'local',a,Date.now());setWorld({...world});}}/>:<Canvas world={w} selfId="local" overview={overview} onTile={()=>{}}/>}</div></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
