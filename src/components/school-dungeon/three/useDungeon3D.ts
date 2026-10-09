import {useEffect,useRef,useState} from 'react';
import type {DungeonFrame,createDungeonScene} from './scene';

export function useDungeon3D(){
  const host=useRef<HTMLDivElement>(null);
  const scene=useRef<Awaited<ReturnType<typeof createDungeonScene>>|null>(null);
  const [enabled,setEnabled]=useState(()=>{try{return localStorage.getItem('school-wanderer-3d')==='on';}catch{return false;}});
  const [ready,setReady]=useState(false);
  const active=useRef(enabled);active.current=enabled;
  useEffect(()=>{
    if(!enabled||!host.current)return;
    let cancelled=false;
    const mount=host.current;
    const failed=()=>{if(cancelled)return;active.current=false;setReady(false);setEnabled(false);try{localStorage.setItem('school-wanderer-3d','off');}catch{}};
    mount.addEventListener('school-3d-error',failed);
    import('./scene').then(m=>m.createDungeonScene(mount)).then(value=>{
      if(cancelled)value.dispose();else{scene.current=value;setReady(true);}
    }).catch(error=>{if(!cancelled){console.warn('School Wanderer 3D: using 2D fallback',error);failed();}});
    return()=>{cancelled=true;mount.removeEventListener('school-3d-error',failed);scene.current?.dispose();scene.current=null;setReady(false);};
  },[enabled]);
  return {host,enabled,ready,toggle:()=>{active.current=!active.current;try{localStorage.setItem('school-wanderer-3d',active.current?'on':'off');}catch{}setEnabled(active.current);},draw:(frame:DungeonFrame)=>{
    if(!active.current||!scene.current)return false;
    scene.current.draw(frame);return true;
  }};
}
