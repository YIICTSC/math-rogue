import {BOMB_ICON_PATH,BOMB_ICON_ORDER} from './bombIcons';
import {frameArena,followArena,cameraBlend} from './camera';
import {createScreenMarkers,seatColor} from './markers';
import {participantNumber} from './VrRadar';
import React,{useEffect,useRef} from 'react';
import * as T from 'three';
import {BOMB_MAPS,CELL,cellPoint} from './bombEngine';
import type {OnlineWorld} from './onlineEngine';
import {createVrCharacter} from './character';
import {defaultAvatar} from '../gakuro-kart/avatar';
export default function BombCanvas({world,selfId,overview=false}:{world:OnlineWorld;selfId:string;overview?:boolean}){
 const host=useRef<HTMLDivElement>(null),latest=useRef({world,selfId,overview});latest.current={world,selfId,overview};
 useEffect(()=>{const el=host.current!,a=latest.current.world.bombArena!;let frame=0;
  const renderer=new T.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x102638);el.appendChild(renderer.domElement);
  const markers=createScreenMarkers(el),tracked=new T.Vector3(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;let tracking=false,lastDraw=0;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-12,12,12,-12,.1,180);scene.add(new T.HemisphereLight(0xe6ffff,0x455056,2.4));const sun=new T.DirectionalLight(0xffeed4,2);sun.position.set(-15,30,15);scene.add(sun);
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[];
  const mat=(color:number,extra:T.MeshStandardMaterialParameters={})=>{const m=new T.MeshStandardMaterial({color,roughness:.55,...extra});materials.push(m);return m;};
  const geo=<G extends T.BufferGeometry>(g:G)=>{geometries.push(g);return g;};
  const floor=new T.Mesh(geo(new T.BoxGeometry(a.side*CELL,.2,a.side*CELL)),mat(BOMB_MAPS[a.map].color));floor.position.y=-.15;scene.add(floor);
  const box=geo(new T.BoxGeometry(CELL*.94,1.35,CELL*.94)),size=a.side*a.side;
  const hard=new T.InstancedMesh(box,mat(0x365570,{metalness:.2}),size),soft=new T.InstancedMesh(box,mat(a.map===1?0xb78ba6:a.map===2?0xc8995c:0x76a25c),size);
  const bombs=new T.InstancedMesh(geo(new T.SphereGeometry(.38,12,8)),mat(0x172037,{metalness:.55}),240),flames=new T.InstancedMesh(geo(new T.BoxGeometry(CELL*.9,.42,CELL*.9)),mat(0xffa832,{emissive:0xff7517,emissiveIntensity:1.7,transparent:true,opacity:.85}),size*4);
  const drops=new T.InstancedMesh(geo(new T.OctahedronGeometry(.38)),mat(0xffffff,{metalness:.3}),size),distant=new T.InstancedMesh(geo(new T.CapsuleGeometry(.22,.65,2,6)),mat(0xffffff),40);
  for(const m of[hard,soft,bombs,flames,drops,distant]){m.frustumCulled=false;scene.add(m);}
  let iconClosed=false;const iconTextures:T.Texture[]=[],iconMeshes:T.InstancedMesh[]=[];
  const iconSource=new T.TextureLoader().load(BOMB_ICON_PATH,texture=>{
   if(iconClosed){texture.dispose();return;}
   texture.colorSpace=T.SRGBColorSpace;
   for(let i=0;i<5;i++){const map=texture.clone();map.repeat.set(1/5,1);map.offset.set(i/5,0);map.needsUpdate=true;iconTextures.push(map);
    const material=new T.MeshBasicMaterial({map,side:T.DoubleSide});materials.push(material);
    const plane=geo(new T.PlaneGeometry(CELL*.72,CELL*.72));plane.rotateX(-Math.PI/2);
    const mesh=new T.InstancedMesh(plane,material,size);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);iconMeshes.push(mesh);
   }
  });
  const selfRing=new T.Mesh(geo(new T.RingGeometry(.48,.64,32)),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,depthTest:false}));materials.push(selfRing.material);selfRing.rotation.x=-Math.PI/2;selfRing.renderOrder=8;scene.add(selfRing);
  const arrow=new T.Mesh(geo(new T.ConeGeometry(.18,.6,3)),new T.MeshBasicMaterial({color:0xffffff,depthTest:false}));materials.push(arrow.material);arrow.renderOrder=9;scene.add(arrow);
  const transform=new T.Object3D(),color=new T.Color(),rigs=new Map<string,{root:T.Group;key:string}>();let cells='',lastCells:number[]|undefined;
  const stamp=(m:T.InstancedMesh,index:number,x:number,z:number,y=.65,scale=1)=>{transform.position.set(x,y,z);transform.scale.setScalar(scale);transform.rotation.set(0,0,0);transform.updateMatrix();m.setMatrixAt(index,transform.matrix);};
  const disposeRig=(root:T.Group)=>{root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});scene.remove(root);};
  const resize=new ResizeObserver(()=>{renderer.setSize(el.clientWidth,el.clientHeight,false);});resize.observe(el);
  const draw=(now:number)=>{const{world:w,selfId:id,overview:full}=latest.current as {world:OnlineWorld;selfId:string;overview:boolean},arena=w.bombArena;if(!arena)return;const own=w.players[id],near=own?.run.player??{x:0,z:0};
   if(arena.cells!==lastCells){lastCells=arena.cells;const key=arena.cells.join('');if(key!==cells){cells=key;let h=0,s=0;arena.cells.forEach((v,i)=>{if(v){const p=cellPoint(arena,i%arena.side,Math.floor(i/arena.side));stamp(v===1?hard:soft,v===1?h++:s++,p.x,p.z);}});hard.count=h;soft.count=s;hard.instanceMatrix.needsUpdate=soft.instanceMatrix.needsUpdate=true;}}
   const aspect=el.clientWidth/Math.max(1,el.clientHeight),focus=new T.Vector3(near.x,0,near.z),dt=Math.min(.05,(now-lastDraw)/1000);lastDraw=now;
   if(!tracking||tracked.distanceTo(focus)>30){tracked.copy(focus);tracking=true;}else tracked.lerp(focus,cameraBlend(dt,reducedMotion));
   if(full)frameArena(camera,arena.side*CELL/2,aspect,1.6,20/65);else followArena(camera,tracked,aspect,10,20/65,arena.side*CELL/2);
   el.dataset.overview=String(full);el.dataset.target=id;
   bombs.count=arena.bombs.length;arena.bombs.forEach((b,i)=>{const p=cellPoint(arena,b.x,b.z);stamp(bombs,i,p.x,p.z,.42,1+Math.sin(now/90)*.06);});bombs.instanceMatrix.needsUpdate=true;
   flames.count=Math.min(arena.flames.length,size*4);arena.flames.slice(0,size*4).forEach((f,i)=>{const p=cellPoint(arena,f.x,f.z);stamp(flames,i,p.x,p.z,.25);});flames.instanceMatrix.needsUpdate=true;
   drops.count=arena.drops.length;arena.drops.forEach((d,i)=>{const p=cellPoint(arena,d.x,d.z);stamp(drops,i,p.x,p.z,.6+Math.sin(now/450)*.1);drops.setColorAt(i,color.set(({flame:0xff9852,remote:0xc793ff,kick:0x6bd9ff,speed:0xffed6b,capacity:0x99edb3})[d.kind]));});drops.instanceMatrix.needsUpdate=true;if(drops.instanceColor)drops.instanceColor.needsUpdate=true;
   if(iconMeshes.length===5){drops.visible=false;for(let k=0;k<5;k++){let count=0;for(const d of arena.drops)if(d.kind===BOMB_ICON_ORDER[k]){const p=cellPoint(arena,d.x,d.z);stamp(iconMeshes[k],count++,p.x,p.z,.55);}iconMeshes[k].count=count;iconMeshes[k].instanceMatrix.needsUpdate=true;}}
   const players=Object.values(w.players).filter(p=>p.connected&&!p.spectator&&!p.out),close=new Set(players.sort((x,y)=>Math.hypot(x.run.player.x-near.x,x.run.player.z-near.z)-Math.hypot(y.run.player.x-near.x,y.run.player.z-near.z)).slice(0,12).map(p=>p.id));let simple=0;
   for(const p of players){if(!close.has(p.id)){stamp(distant,simple,p.run.player.x,p.run.player.z,.75);distant.setColorAt(simple++,seatColor(participantNumber(w,p.id)));continue;}const avatar=p.avatar??defaultAvatar(),key=JSON.stringify(avatar);let rig=rigs.get(p.id);if(rig?.key!==key){if(rig)disposeRig(rig.root);rig={root:createVrCharacter(avatar),key};scene.add(rig.root);rigs.set(p.id,rig);}rig.root.visible=p.invulnerable===0||Math.floor(now/100)%2===0;rig.root.position.set(p.run.player.x,0,p.run.player.z);rig.root.rotation.y=p.run.player.angle;}
   for(const[id,rig]of rigs){if(!close.has(id)||!w.players[id]?.connected||w.players[id]?.out){disposeRig(rig.root);rigs.delete(id);}}distant.count=simple;distant.instanceMatrix.needsUpdate=true;if(distant.instanceColor)distant.instanceColor.needsUpdate=true;
   selfRing.visible=arrow.visible=!!own&&!own.out;selfRing.position.set(near.x,.05,near.z);arrow.position.set(near.x+Math.sin(own?.run.player.angle??0)*.85,.1,near.z+Math.cos(own?.run.player.angle??0)*.85);arrow.rotation.set(Math.PI/2,0,-(own?.run.player.angle??0));
   markers.draw(camera,players.filter(p=>full||Math.hypot(p.run.player.x-near.x,p.run.player.z-near.z)<13).map(p=>({id:p.id,number:participantNumber(w,p.id),name:p.id===id?p.name:players.length<=8?p.name:undefined,point:new T.Vector3(p.run.player.x,1.6,p.run.player.z),self:p.id===id})),full);
   el.dataset.focusVisible=String(new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).containsPoint(focus));
   el.dataset.bombs=String(arena.bombs.length);el.dataset.players=String(players.length);renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);iconClosed=true;iconSource.dispose();iconTextures.forEach(t=>t.dispose());iconMeshes.forEach(m=>m.dispose());markers.dispose();resize.disconnect();for(const rig of rigs.values())disposeRig(rig.root);for(const m of[hard,soft,bombs,flames,drops,distant])m.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[world.seed,world.round]);
 return <div ref={host} className="gear-canvas" aria-label="Bomb battle arena"/>;
}
