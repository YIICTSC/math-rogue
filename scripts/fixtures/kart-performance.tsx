import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import KartQualityButton,{useKartQuality,setKartQuality} from '../../src/mini-games/gakuro-kart/KartQuality';
import {KartRoom} from '../../src/mini-games/gakuro-kart/network';
import {KartScene} from '../../src/mini-games/gakuro-kart/scene';
import {createRace,addRacer} from '../../src/mini-games/gakuro-kart/engine';
import type {KartQuality} from '../../src/mini-games/gakuro-kart/performance';
import * as T from 'three';
import {ProtagonistModel} from '../../src/three/protagonistModel';
import {driverAppearanceKey} from '../../src/mini-games/gakuro-kart/MinimalDriver';
const qa=window as any;
let packetTimer:ReturnType<typeof setInterval>,scene:KartScene;
function App(){
 const [online,setOnline]=useState(false),[room,setRoom]=useState<KartRoom|null>(null);
 const quality=useKartQuality();
 qa.connect=()=>{clearInterval(packetTimer);const next=new KartRoom(()=>{},()=>{});next.code='501234';next.connectionHealth.packet(performance.now());packetTimer=setInterval(()=>next.connectionHealth.packet(performance.now()),100);setRoom(next);setOnline(true);};
 qa.stall=()=>clearInterval(packetTimer);qa.offline=()=>{clearInterval(packetTimer);setOnline(false);};
 return <div data-online={online} data-room={room?.code} data-selected-quality={quality}><KartQualityButton languageMode="ENGLISH"/></div>;
}
qa.setQuality=setKartQuality;
qa.showScene=(quality:KartQuality,course=0,named=false)=>{
 scene?.dispose();document.querySelector('#course canvas')?.remove();const canvas=document.createElement('canvas');canvas.style.cssText='width:1280px;height:720px';document.getElementById('course')!.append(canvas);
 const world=createRace(course,42);for(let i=0;i<40;i++){addRacer(world,String(i),'Player '+i,0,true);if(named)world.players[String(i)].avatar.protagonist=['elementary-warrior','high-school-assassin','magic-akari'][i%3];}
 scene=new KartScene(canvas,world,'0',false,()=>{throw Error('Context lost');},quality);scene.draw(performance.now());
 const internal=scene as any;
 qa.inspectDrivers=()=>{let skinned=0;internal.scene.traverse((o:any)=>{if(o.isSkinnedMesh)skinned++;});return {ready:[...internal.protagonists.values()].filter((h:any)=>h.ready).length,skinned,geometryCount:new Set([...internal.protagonists.values()].flatMap((h:any)=>h.root.children.map((m:any)=>m.geometry))).size,expectedGeometryCount:new Set(Object.values(world.players).map(p=>driverAppearanceKey(p.avatar))).size,ids:[...new Set([...internal.protagonists.values()].map((h:any)=>h.root.userData.protagonist))],failed:[...internal.protagonists.values()].filter((h:any)=>h.root.userData.failed).length,ownGeometryId:internal.protagonists.get('0')?.root.children[0]?.geometry?.id,ownVertices:internal.protagonists.get('0')?.root.children[0]?.geometry?.getAttribute('position').count};};
 qa.measure=()=>{scene.draw(performance.now());return {calls:internal.renderer.info.render.calls,triangles:internal.renderer.info.render.triangles,pixels:canvas.width*canvas.height,antialias:internal.renderer.getContext().getContextAttributes().antialias,parts:internal.parts.length,players:Object.keys(world.players).length,imported:!!internal.storybook,shadows:internal.renderer.shadowMap.enabled};};
 qa.slowDraws=()=>{const render=internal.renderer.render;internal.renderer.render=()=>{};let now=performance.now();try{for(let i=0;i<400;i++)scene.draw(now+=60);}finally{internal.clock=performance.now();internal.renderer.render=render;}return qa.measure();};
 qa.changeDriver=(avatar:object)=>{Object.assign(world.players['0'].avatar,avatar);scene.draw(performance.now());};
 qa.comparePose=async(id:string)=>{const avatar={...world.players['0'].avatar,protagonist:id},baked=await internal.minimalDrivers.get(avatar),live=new ProtagonistModel(true);await live.set(id);live.update(0,'Idle',true);live.root.updateMatrixWorld(true);const expected=new T.Box3().setFromObject(live.root,true),actual=baked.boundingBox;live.dispose();return {expected:expected.getSize(new T.Vector3()).toArray(),actual:actual.getSize(new T.Vector3()).toArray()};};
 return qa.measure();
};
createRoot(document.getElementById('root')!).render(<App/>);
