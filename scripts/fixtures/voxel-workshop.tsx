import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import Scene from '../../src/rpg/WorldScene3D';
import {createWorld,addPlayer,applyAction,WIDTH} from '../../src/rpg/engine';
import {CATALOG_BLOCKS,type CatalogBlock} from '../../src/rpg/voxelCatalog';
import {farmOf} from '../../src/rpg/farm/model';
const w=createWorld(42);addPlayer(w,'local','Builder');w.started=true;w.sites=[];
const p=w.players.local;p.x=22;p.y=17;p.position3D={x:22.5,y:0,z:17.5};
p.life!.bag=Object.fromEntries([...CATALOG_BLOCKS,'coal','iron_ingot','stick','fertilizer'].map(b=>[b,24]));p.life!.energy=6;
w.voxels={terrainVersion:2,legacyFlat:[],revision:1,edits:{},rotations:{}};
for(let z=3;z<43;z++)for(let x=3;x<43;x++){w.tiles[z*WIDTH+x]='grass';w.voxels.legacyFlat!.push(x+','+z);}
const place=(x:number,y:number,z:number,b:CatalogBlock,r=0)=>{w.voxels!.edits[x+','+y+','+z]=b;w.voxels!.rotations![x+','+y+','+z]=r;};
for(let x=18;x<=26;x++)for(let z=21;z<=27;z++){place(x,-1,z,'stonebrick');if(x===18||x===26||z===27){place(x,0,z,'whiteconcrete');place(x,1,z,(x+z)%3?'blueglass':'birchplank');place(x,2,z,'birchplank');}place(x,3,z,'woodslab');}
place(20,0,19,'workbench');place(22,0,19,'furnace');place(24,0,19,'chest');place(25,0,18,'composter');
place(20,0,21,'woodstairs',2);place(22,0,21,'woodstairs',2);place(24,0,21,'woodstairs',2);
for(let x=16;x<21;x++)place(x,0,16,'fence');place(20,0,16,'lantern');place(27,0,19,'irrigator');
const f=farmOf(w,p);for(let i=0;i<6;i++)Object.assign(f.plots[i],{x:28+i%3,y:20+Math.floor(i/3),crop:'carrot',growth:2,water:0});
(window as any).world=w;
function App(){
 const [world,setWorld]=useState(w),[facing,setFacing]=useState(2),[failed,setFailed]=useState(false);
 return <div className="rpg-root" style={{position:'fixed',inset:0}}>
  {failed?<p>Rendering failed</p>:<Scene world={world} selfId="local" facing={facing} onFacing={setFacing} onTile={()=>{}} onUnavailable={()=>setFailed(true)} onVoxelAction={a=>{applyAction(w,'local',a,Date.now());setWorld({...w});}}/>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
