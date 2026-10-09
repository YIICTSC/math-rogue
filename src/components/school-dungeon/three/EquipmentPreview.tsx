import React,{useEffect,useRef} from 'react';
import {newAdventure} from '../adventure';
import type {Gear} from './appearance';

/** Close-up in the existing status panel so small-screen players can inspect worn gear. */
export default function EquipmentPreview({gear}:{gear:Gear}){
  const host=useRef<HTMLDivElement>(null),latest=useRef(gear);latest.current=gear;
  useEffect(()=>{
    let cancelled=false,frame=0,view:Awaited<ReturnType<typeof import('./scene')['createDungeonScene']>>|undefined;
    const mount=host.current!;
    import('./scene').then(m=>m.createDungeonScene(mount,true)).then(scene=>{
      if(cancelled){scene.dispose();return;}view=scene;
      const map=Array.from({length:3},()=>Array(3).fill('FLOOR')),adventure=newAdventure();
      let previous=0;
      const draw=(time:number)=>{if(cancelled)return;if(time-previous>50){previous=time;scene.draw({map,player:{x:1,y:1,dir:{x:0,y:1},equipment:latest.current},enemies:[],floorItems:[],traps:[],floor:1,effects:[],adventure,dojo:null,visible:()=>true,sight:false,trapSight:false,knownItem:()=>true});}frame=requestAnimationFrame(draw);};
      frame=requestAnimationFrame(draw);
    }).catch(()=>{mount.style.display='none';});
    return()=>{cancelled=true;cancelAnimationFrame(frame);view?.dispose();};
  },[]);
  return <div ref={host} aria-hidden="true" style={{height:170,width:'100%',borderRadius:8,overflow:'hidden',marginBottom:8}}/>;
}
