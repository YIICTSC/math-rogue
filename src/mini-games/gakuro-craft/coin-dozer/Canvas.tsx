import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {assetUrl} from '../../../utils/assetPaths';
import type {CoinRun,CoinKind} from './engine';
const colors:Record<CoinKind,string>={coin:'#e7b94c',gold:'#ffd56b',gem:'#57e9f0',refill:'#a7ee7b',curse:'#5e3769',crown:'#d393ff'};
function release(object:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();object.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
export default function CoinCanvas({run,aim,onAim,paused,label}:{run?:CoinRun;aim:number;onAim:(x:number)=>void;paused:boolean;label:string}){
 const element=useRef<HTMLCanvasElement>(null),latest=useRef({run,aim,paused,onAim}),pointer=useRef<(e:React.PointerEvent<HTMLCanvasElement>)=>void>(()=>{}),[fallback,setFallback]=useState(false);latest.current={run,aim,paused,onAim};
 useEffect(()=>{
  const canvas=element.current;if(!canvas)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{setFallback(true);return;}
  renderer.setPixelRatio(Math.min(1.8,devicePixelRatio));renderer.setClearColor('#122a31',1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,60);camera.position.set(4.7,7.2,7.7);camera.lookAt(0,1.05,0);
  scene.add(new THREE.HemisphereLight('#e8f9ff','#79652e',3));const sun=new THREE.DirectionalLight('#fff2ce',4);sun.position.set(3,7,5);scene.add(sun);const rim=new THREE.DirectionalLight('#82f8f2',2);rim.position.set(-4,3,-3);scene.add(rim);
  const marker=new THREE.Mesh(new THREE.TorusGeometry(.15,.018,8,32),new THREE.MeshBasicMaterial({color:'#a2fff0',transparent:true,opacity:.9}));marker.rotation.x=Math.PI/2;marker.position.y=1.33;scene.add(marker);
  const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.28),point=new THREE.Vector3();
  pointer.current=e=>{const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);if(ray.ray.intersectPlane(plane,point))latest.current.onAim(Math.max(-1.5,Math.min(1.5,point.x)));};
  const resize=()=>{const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  let dead=false,frame=0,last=performance.now(),loadedAt=last,lastRun:CoinRun|undefined,lastStage=0,token:THREE.Object3D|undefined,instances:THREE.InstancedMesh|undefined,pusher:THREE.Object3D|undefined;
  const positions=new Map<number,{x:number;y:number;h:number;kind:CoinKind}>(),falling:Array<{x:number;y:number;kind:CoinKind;at:number}>=[],dummy=new THREE.Object3D(),color=new THREE.Color();
  const loader=new GLTFLoader();
  void Promise.all([loader.loadAsync(assetUrl('models/rpg/coin-dozer.glb')),loader.loadAsync(assetUrl('models/rpg/coin-token.glb'))]).then(([cabinet,coin])=>{
   if(dead){release(cabinet.scene);release(coin.scene);return;}token=coin.scene;scene.add(cabinet.scene);pusher=cabinet.scene.getObjectByName('Pusher');let mesh:THREE.Mesh|undefined;token.traverse(o=>{if(o instanceof THREE.Mesh&&!mesh)mesh=o;});if(!mesh)throw new Error('Coin mesh unavailable');
   const materials=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>{const material=m.clone();if(material instanceof THREE.MeshStandardMaterial)material.color.set('#fff');return material;});instances=new THREE.InstancedMesh(mesh.geometry,materials,150);instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);instances.frustumCulled=false;scene.add(instances);
  }).catch(()=>{if(!dead){setFallback(true);dead=true;cancelAnimationFrame(frame);}});
  const draw=(now:number)=>{if(dead)return;const dt=Math.min(.06,(now-last)/1000);last=now;const state=latest.current,r=state.run;if(r!==lastRun){lastRun=r;loadedAt=now;}
   if(r&&r.stage!==lastStage){positions.clear();falling.length=0;lastStage=r.stage;}
   const elapsed=state.paused||r?.phase!=='playing'?0:Math.min(.2,(now-loadedAt)/1000),clock=(r?.clock||0)+elapsed;
   if(pusher){const rank=r?.relics.filter(v=>v==='reach').length||0,turbo=r?.relics.filter(v=>v==='turbo').length||0;pusher.position.z=.58+.6*(1+rank*.12)*(1-Math.cos(clock/(2.8*Math.pow(.85,turbo))*Math.PI*2))/2-.24-2.2;}
   marker.position.x=state.aim;marker.position.z=-1.35;
   if(instances){const ids=new Set(r?.coins.map(c=>c.id));for(const [id,p]of positions)if(!ids.has(id)){if(falling.length<30)falling.push({...p,at:now});positions.delete(id);}let index=0;
    for(const c of r?.coins||[]){let p=positions.get(c.id);if(!p){p={x:c.x,y:c.y,h:c.h,kind:c.kind};positions.set(c.id,p);}const f=Math.min(1,dt*18);p.x+=(c.x-p.x)*f;p.y+=(c.y-p.y)*f;p.h+=(c.h-p.h)*f;dummy.position.set(p.x,1.285+p.h,p.y-2.2);dummy.rotation.set(p.h*.35,c.id*.57,0);dummy.scale.setScalar(c.kind==='crown'?1.5:1);dummy.updateMatrix();instances.setMatrixAt(index,dummy.matrix);instances.setColorAt(index++,color.set(colors[c.kind]));}
    for(let i=falling.length-1;i>=0;i--){const p=falling[i],t=(now-p.at)/1000;if(t>.65){falling.splice(i,1);continue;}dummy.position.set(p.x,1.28-t*t*3.4,p.y-2.2+t*.5);dummy.rotation.set(t*4,0,t*2);dummy.scale.setScalar(1);dummy.updateMatrix();instances.setMatrixAt(index,dummy.matrix);instances.setColorAt(index++,color.set(colors[p.kind]));}instances.count=index;instances.instanceMatrix.needsUpdate=true;if(instances.instanceColor)instances.instanceColor.needsUpdate=true;
   }
   renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  const lost=(e:Event)=>{e.preventDefault();setFallback(true);dead=true;cancelAnimationFrame(frame);};canvas.addEventListener('webglcontextlost',lost);
  return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);pointer.current=()=>{};release(scene);if(token)release(token);renderer.dispose();};
 },[]);
 return <div className="gc-coin-view">{fallback?<svg viewBox="0 0 360 450" role="img" aria-label={label}><rect width="360" height="450" rx="20" fill="#163b36"/><rect x="18" y="45" width="324" height="350" rx="10" fill="#8e6424"/><rect x="25" y="80" width="310" height="32" fill="#e6c06b"/>{run?.coins.map(c=><circle key={c.id} cx={180+c.x*90} cy={50+c.y*80} r={c.kind==='crown'?14:10} fill={colors[c.kind]} stroke="#fae7b3"/>)}<path d={'M'+(180+aim*90)+' 30v35'} stroke="#b8fff7" strokeWidth="5"/></svg>:<canvas ref={element} aria-label={label} role="img" onPointerDown={e=>pointer.current(e)}/> }</div>;
}
