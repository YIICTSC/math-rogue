import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {assetUrl} from '../../../utils/assetPaths';
import type {CoinRun,CoinKind} from './engine';
const colors:Record<CoinKind,string>={coin:'#e8edf2',gold:'#ffd56b',gem:'#57e9f0',refill:'#a7ee7b',curse:'#5e3769',crown:'#d393ff'};
const previewCoins=Array.from({length:90},(_,id)=>({id:id+10000,x:-1.15+(id%10)*.255,y:1.65+Math.floor(id/10)*.255,h:0,kind:(id%13===0?'gold':'coin') as CoinKind}));
function release(object:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();object.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
export default function CoinCanvas({run,aim,onAim,onDrop,paused,label}:{run?:CoinRun;aim:number;onAim:(x:number)=>void;onDrop?:(x:number)=>void;paused:boolean;label:string}){
 const element=useRef<HTMLCanvasElement>(null),latest=useRef({run,aim,paused,onAim,onDrop}),pointer=useRef<(e:React.PointerEvent<HTMLCanvasElement>)=>void>(()=>{}),[fallback,setFallback]=useState(false);latest.current={run,aim,paused,onAim,onDrop};
 useEffect(()=>{
  const canvas=element.current;if(!canvas)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{setFallback(true);return;}
  renderer.setPixelRatio(Math.min(1.8,devicePixelRatio));renderer.setClearColor('#122a31',1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,60);camera.position.set(0,6.8,8.3);camera.lookAt(0,1.25,.1);
  scene.add(new THREE.HemisphereLight('#e8f9ff','#79652e',3));const sun=new THREE.DirectionalLight('#fff2ce',4);sun.position.set(3,7,5);scene.add(sun);const rim=new THREE.DirectionalLight('#82f8f2',2);rim.position.set(-4,3,-3);scene.add(rim);
  const marker=new THREE.Mesh(new THREE.TorusGeometry(.15,.018,8,32),new THREE.MeshBasicMaterial({color:'#a2fff0',transparent:true,opacity:.9}));marker.rotation.x=Math.PI/2;marker.position.y=1.33;scene.add(marker);
  const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.28),point=new THREE.Vector3();
  pointer.current=e=>{if(e.button!==0)return;const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);if(ray.ray.intersectPlane(plane,point)){const x=Math.max(-1.5,Math.min(1.5,point.x));latest.current.onAim(x);latest.current.onDrop?.(x);}};
  const resize=()=>{const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  let dead=false,frame=0,last=performance.now(),loadedAt=last,lastRun:CoinRun|undefined,lastStage=0,token:THREE.Object3D|undefined,instances:THREE.InstancedMesh[]=[],pusher:THREE.Object3D|undefined;
  const positions=new Map<number,{x:number;y:number;h:number;kind:CoinKind}>(),falling:Array<{x:number;y:number;kind:CoinKind;at:number;side:boolean;seed:number}>=[],pile:Array<{x:number;z:number;kind:CoinKind;seed:number}>=[],dummy=new THREE.Object3D(),color=new THREE.Color();
  const loader=new GLTFLoader();
  void Promise.all([loader.loadAsync(assetUrl('models/rpg/coin-dozer.glb')),loader.loadAsync(assetUrl('models/rpg/coin-token.glb'))]).then(([cabinet,coin])=>{
   if(dead){release(cabinet.scene);release(coin.scene);return;}token=coin.scene;scene.add(cabinet.scene);pusher=cabinet.scene.getObjectByName('Pusher');token.updateMatrixWorld(true);
   // GLTF primitives have no geometry groups: use a single material per primitive.
   // An array of materials on that geometry silently draws no coins.
   token.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld),source=Array.isArray(o.material)?o.material[0]:o.material,material=source.clone();if(material instanceof THREE.MeshStandardMaterial){material.color.set('#fff');material.metalness=.55;material.roughness=.28;}const part=new THREE.InstancedMesh(geometry,material,360);part.instanceMatrix.setUsage(THREE.DynamicDrawUsage);part.frustumCulled=false;instances.push(part);scene.add(part);});if(!instances.length)throw new Error('Coin mesh unavailable');
  }).catch(()=>{if(!dead){setFallback(true);dead=true;cancelAnimationFrame(frame);}});
  const draw=(now:number)=>{if(dead)return;const dt=Math.min(.06,(now-last)/1000);last=now;const state=latest.current,r=state.run;if(r!==lastRun){lastRun=r;loadedAt=now;}
   if(r&&r.stage!==lastStage){positions.clear();falling.length=0;pile.length=0;lastStage=r.stage;}
   const elapsed=state.paused||r?.phase!=='playing'?0:Math.min(.2,(now-loadedAt)/1000),clock=r?(r.clock+elapsed):(state.paused?0:now/1000);
   if(pusher){const rank=r?.relics.filter(v=>v==='reach').length||0,turbo=r?.relics.filter(v=>v==='turbo').length||0;pusher.position.z=.65+.95*(1+rank*.12)*(1-Math.cos(clock/(2.2*Math.pow(.85,turbo))*Math.PI*2))/2-.24-2.2;}
   marker.position.x=state.aim;marker.position.z=-1.35;
   if(instances.length){const coins=r?.coins||previewCoins,ids=new Set(coins.map(c=>c.id));let stagger=0;for(const [id,p]of positions)if(!ids.has(id)){if(falling.length<90)falling.push({...p,at:now+stagger++*18,side:Math.abs(p.x)>1.6,seed:id});positions.delete(id);}let index=0;
    const stamp=(kind:CoinKind)=>{dummy.updateMatrix();for(const part of instances){part.setMatrixAt(index,dummy.matrix);part.setColorAt(index,color.set(colors[kind]));}index++;};
    for(const c of coins){let p=positions.get(c.id);if(!p){p={x:c.x,y:c.y,h:c.h,kind:c.kind};positions.set(c.id,p);}const f=Math.min(1,dt*18);p.x+=(c.x-p.x)*f;p.y+=(c.y-p.y)*f;p.h+=(c.h-p.h)*f;dummy.position.set(p.x,1.285+p.h,p.y-2.2);dummy.rotation.set(p.h*.8,c.id*.57,p.h*.5);dummy.scale.setScalar(c.kind==='crown'?1.8:1.3);stamp(c.kind);}
    for(let i=falling.length-1;i>=0;i--){const p=falling[i],t=Math.max(0,(now-p.at)/1000),spread=Math.sin(p.seed*12.9898);if(t>1.3){if(!p.side){pile.push({x:Math.max(-1.4,Math.min(1.4,p.x+spread*.2)),z:2.68+(Math.cos(p.seed*7.3)+1)*.23,kind:p.kind,seed:p.seed});if(pile.length>65)pile.shift();}falling.splice(i,1);continue;}
     const travel=Math.min(1,t/.72),bounce=t>.72?Math.abs(Math.sin((t-.72)*16))*Math.exp(-(t-.72)*6)*.13:0;
     dummy.position.set(p.x+spread*travel*.13,p.side?1.28-t*t*3:1.285+(0.87-1.285)*travel+Math.sin(travel*Math.PI)*.35+bounce,p.side?p.y-2.2:p.y-2.2+(2.9-(p.y-2.2))*travel);dummy.rotation.set(t*7,spread+t*3,t*5);dummy.scale.setScalar(1.3);stamp(p.kind);}
    for(let i=0;i<pile.length;i++){const p=pile[i];dummy.position.set(p.x,.88+Math.floor(i/18)*.04,p.z);dummy.rotation.set(Math.sin(p.seed)*.16,p.seed*.57,Math.cos(p.seed)*.15);dummy.scale.setScalar(1.3);stamp(p.kind);}
    for(const part of instances){part.count=index;part.instanceMatrix.needsUpdate=true;if(part.instanceColor)part.instanceColor.needsUpdate=true;}
   }
   renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  const lost=(e:Event)=>{e.preventDefault();setFallback(true);dead=true;cancelAnimationFrame(frame);};canvas.addEventListener('webglcontextlost',lost);
  return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);pointer.current=()=>{};release(scene);if(token)release(token);renderer.dispose();};
 },[]);
 return <div className="gc-coin-view">{fallback?<svg viewBox="0 0 360 450" role="img" aria-label={label} onPointerDown={e=>{if(e.button!==0)return;const box=e.currentTarget.getBoundingClientRect(),x=Math.max(-1.5,Math.min(1.5,(e.clientX-box.left)/box.width*3.6-1.8));onAim(x);onDrop?.(x);}}><rect width="360" height="450" rx="20" fill="#163b36"/><rect x="18" y="45" width="324" height="350" rx="10" fill="#8e6424"/><rect x="25" y="80" width="310" height="32" fill="#e6c06b"/>{(run?.coins||previewCoins).map(c=><circle key={c.id} cx={180+c.x*90} cy={50+c.y*80} r={c.kind==='crown'?14:10} fill={colors[c.kind]} stroke="#fae7b3"/>)}<path d={'M'+(180+aim*90)+' 30v35'} stroke="#b8fff7" strokeWidth="5"/></svg>:<canvas ref={element} aria-label={label} role="img" onPointerDown={e=>pointer.current(e)}/> }</div>;
}
