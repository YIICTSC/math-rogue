import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import KartQualityButton,{useKartPerformance,setKartQuality} from '../../src/mini-games/gakuro-kart/KartQuality';
import {KartRoom} from '../../src/mini-games/gakuro-kart/network';
import {KartScene} from '../../src/mini-games/gakuro-kart/scene';
import {createRace,addRacer} from '../../src/mini-games/gakuro-kart/engine';
import type {KartQuality} from '../../src/mini-games/gakuro-kart/performance';
const qa=window as any;
let packetTimer:ReturnType<typeof setInterval>,scene:KartScene;
function App(){
 const [online,setOnline]=useState(false),[room,setRoom]=useState<KartRoom|null>(null);
 const graphics=useKartPerformance(room,online);
 qa.connect=()=>{clearInterval(packetTimer);const next=new KartRoom(()=>{},()=>{});next.code='501234';next.connectionHealth.packet(performance.now());packetTimer=setInterval(()=>next.connectionHealth.packet(performance.now()),100);setRoom(next);setOnline(true);};
 qa.stall=()=>clearInterval(packetTimer);qa.offline=()=>{clearInterval(packetTimer);setOnline(false);};qa.slowFrame=graphics.onSlowFrame;
 return <KartQualityButton languageMode="ENGLISH" effective={graphics.quality} forced={graphics.forced}/>;
}
qa.setQuality=setKartQuality;
qa.showScene=(quality:KartQuality,course=0)=>{
 scene?.dispose();document.querySelector('#course canvas')?.remove();const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:720px';document.getElementById('course')!.append(canvas);
 const world=createRace(course,42);for(let i=0;i<40;i++)addRacer(world,String(i),'Player '+i,0,true);
 scene=new KartScene(canvas,world,'0',false,()=>{throw Error('Context lost');},quality);scene.draw(performance.now());
 const internal=scene as any;
 return {calls:internal.renderer.info.render.calls,triangles:internal.renderer.info.render.triangles,pixels:canvas.width*canvas.height,antialias:internal.renderer.getContext().getContextAttributes().antialias,parts:internal.parts.length,players:Object.keys(world.players).length,imported:!!internal.storybook,geometry:world.customCourse,shadows:internal.renderer.shadowMap.enabled};
};
createRoot(document.getElementById('root')!).render(<App/>);
