import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assetUrl} from '../../utils/assetPaths';
import type {ArcadeState} from './arcade';
import {loopPose,easeRush,transitionProgress} from './rush';
import {drawTrickBurst,trickRotation} from './courseEffects';

import {trackDepth} from './rushTrack';

export interface RushRenderFrame {state:ArcadeState;distance:number;jump:number;frame:number;vy?:number;side:HTMLImageElement|null;rear:HTMLImageElement|null;actions?:HTMLImageElement|null;reduced:boolean;}
/** A render adapter driven by the existing fixed-step simulation; no second game clock. */
export function createRushRenderer(){
 const canvas=document.createElement('canvas');let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});}catch{return null;}
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setPixelRatio(1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 let alive=true,available=true,ready=false,lastWidth=0,lastHeight=0;
 const lost=(e:Event)=>{e.preventDefault();available=false;},restored=()=>{available=true;};
 canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,2,.1,180),depth=new THREE.Group(),loop=new THREE.Group();scene.add(depth,loop);
 const sky=document.createElement('canvas');sky.width=2;sky.height=256;const skyCtx=sky.getContext('2d')!,gradient=skyCtx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#133e59');gradient.addColorStop(.62,'#6aada8');gradient.addColorStop(1,'#f8d9a2');skyCtx.fillStyle=gradient;skyCtx.fillRect(0,0,2,256);
 const skyTexture=new THREE.CanvasTexture(sky);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;scene.fog=new THREE.Fog('#6baba8',45,125);
 scene.add(new THREE.HemisphereLight('#dcffed','#29445a',3));const sun=new THREE.DirectionalLight('#ffdcaa',3.2);sun.position.set(-15,35,12);scene.add(sun);
 const sunMesh=new THREE.Mesh(new THREE.SphereGeometry(6,16,12),new THREE.MeshBasicMaterial({color:'#ffe1a2',fog:false}));sunMesh.position.set(-30,19,-95);scene.add(sunMesh);
 const spriteCanvas=document.createElement('canvas');spriteCanvas.width=128;spriteCanvas.height=160;const spriteCtx=spriteCanvas.getContext('2d')!,spriteTexture=new THREE.CanvasTexture(spriteCanvas);spriteTexture.colorSpace=THREE.SRGBColorSpace;spriteTexture.magFilter=THREE.LinearFilter;
 const hero=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTexture,transparent:true,alphaTest:.07,depthWrite:false}));hero.scale.set(1.9,2.4,1);hero.renderOrder=3;scene.add(hero);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d')!,g=gc.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#e8ffffc0');g.addColorStop(.32,'#62f5d45c');g.addColorStop(1,'#43cddd00');gc.fillStyle=g;gc.fillRect(0,0,64,64);
 const glowTexture=new THREE.CanvasTexture(glowCanvas),aura=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));aura.renderOrder=2;scene.add(aura);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.75,20),new THREE.MeshBasicMaterial({color:'#092333',transparent:true,opacity:.42,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
 const tiles:THREE.Object3D[]=[],arches:THREE.Object3D[]=[],decor:{o:THREE.Object3D;i:number;side:number}[]=[],props=new Map<number,THREE.Object3D>(),prefabs=new Map<string,THREE.Object3D>();
 const loader=new GLTFLoader();
 const loading=loader.loadAsync(assetUrl('sprites/go-home-dash/rush/rush-course.glb')).then(gltf=>{
  if(!alive){disposeTree(gltf.scene);return;}
  for(const name of ['RoadTile','SkyArch','Tree','Tower','FloatingIsland','Barrier','LowBar','Coin','Star','LoopTrack']){const o=gltf.scene.getObjectByName(name);if(!o)throw Error('Missing rush prefab '+name);o.traverse(v=>{if(v instanceof THREE.Mesh){const mats=Array.isArray(v.material)?v.material:[v.material];mats.forEach(m=>{m.side=THREE.DoubleSide;});}});prefabs.set(name,o);}
  for(let i=0;i<7;i++){const o=prefabs.get('RoadTile')!.clone();tiles.push(o);depth.add(o);}
  for(let i=0;i<5;i++){const o=prefabs.get('SkyArch')!.clone();arches.push(o);depth.add(o);}
  for(let i=0;i<9;i++)for(const side of [-1,1]){
   const o=prefabs.get(i%3===0?'Tower':'Tree')!.clone();o.scale.setScalar(i%3===0?1+(i%2)*.4:1);decor.push({o,i,side});depth.add(o);
   const island=prefabs.get('FloatingIsland')!.clone();island.position.set(side*13,-5,-i*22);island.userData.trackIndex=i;depth.add(island);
  }
  loop.add(prefabs.get('LoopTrack')!.clone());ready=true;
 }).catch(()=>{ready=false;});
 function draw(ctx:CanvasRenderingContext2D,w:number,h:number,f:RushRenderFrame){
  if(!alive||!available||!ready||f.state.rush.kind!=='depth')return false;
  const rw=Math.min(1280,Math.max(400,Math.round(w))),rh=Math.max(250,Math.round(rw*h/w));
  if(rw!==lastWidth||rh!==lastHeight){renderer.setSize(rw,rh,false);lastWidth=rw;lastHeight=rh;camera.aspect=rw/rh;}
  const r=f.state.rush,isLoop=r.kind==='loop';depth.visible=!isLoop;loop.visible=isLoop;
  const action=!isLoop&&f.actions?.complete&&(f.jump>1||f.state.slide>0),slidingAction=action&&f.jump<=1;const sheet=isLoop?f.side:action?f.actions:f.rear;hero.visible=!!sheet?.complete&&!!sheet.naturalWidth;
  if(hero.visible&&sheet){spriteCtx.clearRect(0,0,128,160);const cell=sheet.naturalWidth/4,ch=isLoop||action?sheet.naturalHeight/2:sheet.naturalHeight;const frame=action?(slidingAction?(f.state.slide>44?0:f.state.slide<9?3:1+Math.floor(f.frame/7)%2):f.jump<22?((f.vy??0)<0?0:3):(f.vy??0)<-2?1:2):Math.floor(f.frame/Math.max(3,8-r.speed*.35))%4;spriteCtx.drawImage(sheet,frame*cell,slidingAction?ch:0,cell,ch,0,0,128,160);spriteTexture.needsUpdate=true;}
  const boost=r.turbo>0||f.state.boost>0||f.state.fever>0;
  const baseFov=isLoop?43:58+(f.reduced?0:Math.min(12,r.speed*.65));
  camera.fov=camera.aspect<1?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov/2))/camera.aspect)):baseFov;camera.updateProjectionMatrix();
  if(isLoop){
   const p=loopPose(r.progress,r.variant),follow=Math.abs(p.x)>6?p.x-Math.sign(p.x)*6:0;
   camera.position.set(follow,6,camera.aspect<1?20:24);camera.lookAt(follow,5.2,0);
   hero.position.set(p.x-Math.sin(p.angle)*1.05,p.y+Math.cos(p.angle)*1.05,.7+p.z);(hero.material as THREE.SpriteMaterial).rotation=p.angle;hero.scale.set(1.9,2.4,1);shadow.visible=false;
  }else{
   const curve=f.reduced?0:Math.sin(r.progress*Math.PI*2)*.45;
   camera.position.set(r.laneX*.35,4.8,11);camera.lookAt(curve,1,-24);camera.rotation.z=f.reduced?0:-curve*.07;
   const phase=f.distance*.035;
   tiles.forEach((o,i)=>o.position.set(0,0,trackDepth(i,24,tiles.length,phase,24)));arches.forEach((o,i)=>o.position.set(0,0,trackDepth(i,30,arches.length,phase)));
   decor.forEach(({o,i,side})=>o.position.set(side*(9+i%3*3),-1,trackDepth(i,20,9,phase)));
   for(const island of depth.children)if(island.userData.trackIndex!==undefined)island.position.z=trackDepth(island.userData.trackIndex,22,9,phase*.8);
   const sliding=f.state.slide>0&&f.jump<10;hero.position.set(r.laneX*3,1.07+Math.max(0,f.jump)*.025,2);hero.scale.set(1.9,2.4,1);(hero.material as THREE.SpriteMaterial).rotation=f.reduced?0:(r.lane-r.laneX)*-.18;
   shadow.visible=true;shadow.position.set(r.laneX*3,.045,2);
   const live=new Set<number>();
   for(const e of r.objects){const ahead=e.at-f.distance-120;if(e.taken||ahead< -100||ahead>2900)continue;live.add(e.id);let o=props.get(e.id);
    if(!o){if(e.kind==='gap'){o=new THREE.Mesh(new THREE.BoxGeometry(2.8,.025,2.2),new THREE.MeshBasicMaterial({color:'#031420'}));}else{o=prefabs.get(({coin:'Coin',star:'Star',barrier:'Barrier',lowBar:'LowBar',boost:'Coin'})[e.kind])!.clone();}props.set(e.id,o);depth.add(o);}
    o.position.set(e.lane*3,e.kind==='boost'?.02:0,2-ahead*.035);if(e.kind==='coin'||e.kind==='star'){o.rotation.y=f.reduced?0:f.frame*.05+e.id;o.position.y=f.reduced?.1:.12+Math.sin(f.frame*.06+e.id)*.1;}
    if(e.kind==='boost')o.scale.set(2.7,.2,2.7);
   }
   for(const [id,o]of props)if(!live.has(id)){depth.remove(o);if(o instanceof THREE.Mesh&&o.geometry.type==='BoxGeometry'){o.geometry.dispose();(o.material as THREE.Material).dispose();}props.delete(id);}
  }
  const transition=r.transition,t=easeRush(transitionProgress(r));
  // Screen-space entry passes over the road; depth testing would hide the runner underneath it.
  (hero.material as THREE.SpriteMaterial).depthTest=!(transition?.direction==='toDepth'&&transition.phase==='arrive');
  if(transition?.direction==='toDepth'&&transition.phase==='arrive'){
   camera.updateMatrixWorld();const screen=hero.position.clone().project(camera);screen.y=THREE.MathUtils.lerp(-1.45,screen.y,1-Math.pow(1-transitionProgress(r),3));hero.position.copy(screen.unproject(camera));shadow.visible=t>.8;
  }else if(transition?.direction==='toSide'&&transition.phase==='depart'){
   hero.position.z-=t*70;hero.position.x=transition.fromLane*3*(1-t);hero.scale.multiplyScalar(1-t*.55);shadow.position.set(hero.position.x,.045,hero.position.z);
  }
  if(!transition)(hero.material as THREE.SpriteMaterial).rotation+=trickRotation(f.state,f.reduced);
  aura.visible=hero.visible&&(boost||r.momentum>12||f.state.shield>0);aura.position.copy(hero.position);aura.position.z-=.08;aura.scale.set(3.2,4.2,1);(aura.material as THREE.SpriteMaterial).opacity=boost?.75:.35;
  try{renderer.render(scene,camera);ctx.drawImage(canvas,0,0,w,h);camera.updateMatrixWorld();const screen=hero.position.clone().project(camera);drawTrickBurst(ctx,(screen.x+1)*w/2,(1-screen.y)*h/2+32,f.state,f.reduced,Math.min(w/800,h/400));ctx.canvas.dataset.rushRenderer='webgl';ctx.canvas.dataset.rushModel='blender';return true;}catch{available=false;return false;}
 }
 function dispose(){if(!alive)return;alive=false;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);disposeTree(scene);for(const o of prefabs.values())disposeTree(o);spriteTexture.dispose();glowTexture.dispose();skyTexture.dispose();renderer.dispose();renderer.forceContextLoss();}
 return {draw,dispose,loading,get ready(){return ready;},get canvas(){return canvas;}};
}
function disposeTree(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Sprite){if(o instanceof THREE.Mesh)geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
export type RushRenderer=NonNullable<ReturnType<typeof createRushRenderer>>;
