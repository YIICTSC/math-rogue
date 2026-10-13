import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import type {HomeGame} from '../homeGames';
import {platforms,coins,landmarks,enemies,STAGE_COLORS} from './level';
import type {SkyRunner} from './simulation';
type Props={game:HomeGame;selfId:string;time:number;yaw:React.MutableRefObject<number>;onFailure:()=>void};
export default function SkyScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 useEffect(()=>{const node=host.current;if(!node)return;let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{props.onFailure();return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=navigator.hardwareConcurrency>4;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#72c6ed');node.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(52,1,.1,140),sun=new THREE.DirectionalLight('#fff4d8',2.4);sun.position.set(-15,30,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun,new THREE.HemisphereLight('#eaf8ff','#647f83',2));
 let stage=-1,environment=new THREE.Group();scene.add(environment);const platformMeshes=new Map<string,THREE.Mesh>(),coinMeshes:THREE.Object3D[]=[],enemyMeshes=new Map<number,THREE.Group>(),starMeshes:THREE.Object3D[]=[];
 const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[];
 const material=(color:THREE.ColorRepresentation,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.45,metalness});materials.push(m);return m;};
 const mesh=(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Object3D,pos:number[],scale?:number[])=>{geometries.push(geo);const m=new THREE.Mesh(geo,mat);m.position.set(pos[0],pos[1],pos[2]);if(scale)m.scale.set(scale[0],scale[1],scale[2]);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const skin=material('#ffd5ad'),hair=material('#334b6c'),coat=material('#41bfc2'),boots=material('#274257'),bag=material('#dc624d'),black=material('#172131'),gold=material('#ffd56b',.5),white=material('#eefaff'),rock=material('#aa8a69');
 const avatar=new THREE.Group(),body=new THREE.Group(),legL=new THREE.Group(),legR=new THREE.Group();avatar.add(body);scene.add(avatar);
 mesh(new THREE.SphereGeometry(.33,16,12),coat,body,[0,.66,0],[1,1.25,.75]);mesh(new THREE.SphereGeometry(.37,20,16),skin,body,[0,1.16,0],[1,.94,.87]);
 mesh(new THREE.SphereGeometry(.39,16,12),hair,body,[0,1.34,-.07],[1,.65,.88]);for(let k=0;k<4;k++){const tuft=mesh(new THREE.ConeGeometry(.15,.4,5),hair,body,[-.25+k*.16,1.52,-.02]);tuft.rotation.z=-.5+k*.3;}
 for(const x of [-.13,.13])mesh(new THREE.SphereGeometry(.055,10,8),black,body,[x,1.18,.32],[.7,1.5,.5]);
 mesh(new THREE.BoxGeometry(.43,.48,.23),bag,body,[0,.76,-.3]);mesh(new THREE.BoxGeometry(.37,.09,.04),gold,body,[0,.72,-.43]);
 for(const x of [-.39,.39]){const arm=mesh(new THREE.CapsuleGeometry(.1,.28,4,8),coat,body,[x,.75,0]);arm.rotation.z=x<0?-.22:.22;mesh(new THREE.SphereGeometry(.12,10,8),skin,body,[x,.5,.03]);}
 body.add(legL,legR);legL.position.set(-.16,.38,0);legR.position.set(.16,.38,0);for(const leg of [legL,legR])mesh(new THREE.CapsuleGeometry(.13,.15,4,8),boots,leg,[0,-.15,.08],[1,1,1.35]);
 const others=new Map<string,THREE.Group>();
 const disposeEnvironment=()=>{environment.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(!materials.includes(m))m.dispose();});}});environment.clear();platformMeshes.clear();coinMeshes.length=starMeshes.length=0;enemyMeshes.clear();};
 function rebuild(r:SkyRunner,time:number){disposeEnvironment();stage=r.stage;const colors=STAGE_COLORS[stage],lm=landmarks(stage,time),coinData=coins(stage,time);scene.background=new THREE.Color(colors[0]);scene.fog=new THREE.Fog(colors[0],55,115);const turf=material(colors[1]);
  platforms(stage,time).forEach(p=>{const group=new THREE.Group();environment.add(group);group.position.set(p.x,p.y,p.z);const block=mesh(new THREE.BoxGeometry(p.w,p.h,p.d),rock,group,[0,-p.h/2,0]);platformMeshes.set(p.id,block);mesh(new THREE.BoxGeometry(p.w+.08,.22,p.d+.08),p.kind?material(p.kind==='ice'?'#d8f3ff':p.kind==='belt'?'#e6ad55':p.kind==='blink'?'#bd8ce1':p.kind==='fan'?'#79d9b5':'#eac184'):turf,group,[0,-.03,0]);if(p.spring){mesh(new THREE.CylinderGeometry(.85,.85,.15,16),gold,group,[0,.18,0]);mesh(new THREE.TorusGeometry(.55,.07,6,20),white,group,[0,.29,0]).rotation.x=Math.PI/2;}
   if(p.kind){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;ctx.font='bold 92px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';ctx.fillText({ice:'❄',belt:'→',blink:'◷',fan:'↑',lift:'↕'}[p.kind],64,64);const map=new THREE.CanvasTexture(c),mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false});materials.push(mat);mesh(new THREE.PlaneGeometry(1.5,1.5),mat,group,[0,.13,0]).rotation.x=-Math.PI/2;}
   for(let k=0;k<3;k++){if(p.id==='bridge'||p.id==='spring')continue;const tree=new THREE.Group();tree.position.set(-p.w/2+.65,.1,-p.d/2+.7+k*.5);group.add(tree);mesh(new THREE.CylinderGeometry(.08,.15,1,6),rock,tree,[0,.5,0]);mesh(new THREE.SphereGeometry(.6,8,6),turf,tree,[0,1.4,0]);}
  });
  coinData.forEach(c=>{const m=mesh(new THREE.TorusGeometry(.24,.085,6,16),gold,environment,[c.x,c.y,c.z]);coinMeshes.push(m);});
  [lm.switch,lm.summit].forEach(p=>{const m=mesh(new THREE.OctahedronGeometry(.55),gold,environment,[p.x,p.y+1.2,p.z]);starMeshes.push(m);});
  mesh(new THREE.CylinderGeometry(.7,.85,.15,12),coat,environment,[lm.switch.x,lm.switch.y+.08,lm.switch.z]);
  const goal=new THREE.Group();goal.position.set(lm.goal.x,lm.goal.y,lm.goal.z);environment.add(goal);mesh(new THREE.TorusGeometry(1,.15,8,24,Math.PI),white,goal,[0,.9,0]);for(const x of [-1,1])mesh(new THREE.CylinderGeometry(.15,.23,1,8),white,goal,[x,.5,0]);
  const flag=new THREE.Group();flag.position.set(lm.checkpoint.x,lm.checkpoint.y,lm.checkpoint.z);environment.add(flag);mesh(new THREE.CylinderGeometry(.05,.05,2,6),white,flag,[0,1,0]);mesh(new THREE.BoxGeometry(.65,.4,.04),bag,flag,[.3,1.7,0]);
  for(let k=0;k<20;k++){const cloud=mesh(new THREE.SphereGeometry(1,8,6),white,environment,[(k%5-2)*17,-6-Math.floor(k/5)*2,-k*3],[4,1,2]);cloud.castShadow=false;}
  for(const e of enemies(stage,time)){const ghost=new THREE.Group();environment.add(ghost);mesh(new THREE.SphereGeometry(.45,12,10),material(stage===2?'#b798dd':'#f19489'),ghost,[0,.45,0],[1,1.1,1]);for(const x of [-.15,.15])mesh(new THREE.SphereGeometry(.05,8,6),black,ghost,[x,.55,.4]);enemyMeshes.set(e.id,ghost);}
 }
 const resize=new ResizeObserver(()=>{const w=node.clientWidth,h=node.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(node);
 const onLost=(e:Event)=>{e.preventDefault();latest.current.onFailure();};renderer.domElement.addEventListener('webglcontextlost',onLost);
 let frame=0,last=performance.now();const target=new THREE.Vector3(),desired=new THREE.Vector3(),ray=new THREE.Raycaster();
 function render(now:number){const p=latest.current,r=p.game.sky?.runners[p.selfId];if(r){if(stage!==r.stage)rebuild(r,p.time);const dt=Math.min(.05,(now-last)/1000);last=now;const mix=1-Math.exp(-20*dt);target.set(r.x,r.y,r.z);avatar.position.lerp(target,mix);avatar.rotation.y=r.yaw;avatar.visible=p.time>=r.invincibleUntil||Math.floor(now/100)%2===0;const walk=Math.hypot(r.vx,r.vz);legL.rotation.x=Math.sin(now*.018)*Math.min(.7,walk*.12);legR.rotation.x=-legL.rotation.x;body.position.y=r.grounded?Math.sin(now*.005)*.018:0;body.rotation.z=p.time<r.attackUntil?Math.sin(now*.04)*.35:0;
   for(const floor of platforms(stage,p.time)){const block=platformMeshes.get(floor.id);if(block?.parent){block.parent.position.set(floor.x,floor.y,floor.z);block.parent.visible=floor.active!==false;}}const coinData=coins(stage,p.time);
   coinMeshes.forEach((m,k)=>{m.visible=!r.coins.includes(k);m.rotation.y=now*.002;m.position.set(coinData[k].x,coinData[k].y+Math.sin(now*.003+k)*.08,coinData[k].z);});starMeshes.forEach((m,k)=>{m.visible=!r.stars.includes(k+1);m.rotation.y=now*.0015;});enemies(stage,p.time).forEach(e=>{const m=enemyMeshes.get(e.id);if(m){m.visible=!r.defeated.includes(e.id);m.position.set(e.x,e.y,e.z);}});
   for(const id of p.game.players){if(id===p.selfId)continue;const other=p.game.sky?.runners[id];if(!other)continue;let m=others.get(id);if(!m){m=new THREE.Group();mesh(new THREE.CapsuleGeometry(.3,.6,4,10),material('#ffbd78'),m,[0,.7,0]);scene.add(m);others.set(id,m);}m.visible=other.stage===stage;m.position.set(other.x,other.y,other.z);}
   target.copy(avatar.position).y+=1.1;desired.set(target.x+Math.sin(p.yaw.current)*8,target.y+4.2,target.z+Math.cos(p.yaw.current)*8);const dir=desired.clone().sub(target),distance=dir.length();ray.set(target,dir.normalize());const hit=ray.intersectObjects([...platformMeshes.values()].filter(m=>m.parent?.visible),false)[0];if(hit&&hit.distance<distance)desired.copy(target).addScaledVector(dir,Math.max(1.5,hit.distance-.4));camera.position.lerp(desired,1-Math.exp(-9*dt));camera.lookAt(target);renderer.render(scene,camera);
  }frame=requestAnimationFrame(render);
 }frame=requestAnimationFrame(render);
 return()=>{cancelAnimationFrame(frame);resize.disconnect();renderer.domElement.removeEventListener('webglcontextlost',onLost);disposeEnvironment();geometries.forEach(g=>g.dispose());materials.forEach(m=>{if('map'in m)(m.map as THREE.Texture|undefined)?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();};
 },[props.game.key,props.selfId]);
 return <div className="sky-canvas" ref={host} aria-label="3D adventure stage"/>;
}
