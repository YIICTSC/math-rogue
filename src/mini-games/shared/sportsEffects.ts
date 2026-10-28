import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {assetUrl} from '../../utils/assetPaths';
import type {Sport,SportsEvent} from './sportsEvents';
type Position={x:number;y:number;z:number};
type Actor={id:string;x:number;y:number};
/** Blender geometry and keyframes, one small effect instance per court. No physics changes. */
export function createSportsEffect(scene:T.Scene,sport:Sport){
 const group=new T.Group();group.name=`BlenderSportsEffect-${sport}`;group.visible=false;scene.add(group);
 const flame=sport==='golf'?new T.Mesh(new T.SphereGeometry(.65,12,8),new T.MeshBasicMaterial({color:0xff5710,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false})):undefined;
 const trailGeometry=flame?new T.BufferGeometry():undefined;
 const trailPositions=new Float32Array(36*3),trailHistory:T.Vector3[]=[];
 const trail=trailGeometry?new T.Points(trailGeometry,new T.PointsMaterial({color:0xffa020,size:.85,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false})):undefined;
 if(trailGeometry)trailGeometry.setAttribute('position',new T.BufferAttribute(trailPositions,3));
 if(flame){scene.add(flame);flame.visible=false;}if(trail){scene.add(trail);trail.visible=false;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false,mixer:T.AnimationMixer|undefined,actions:T.AnimationAction[]=[],age=10,lastEvent=-1,lastNow=0,ready=false,lastStream:string|undefined;
 const resources=new Set<T.BufferGeometry|T.Material|T.Texture>();
 new GLTFLoader().load(assetUrl(`models/sports-effects/${sport}.glb`),gltf=>{
  gltf.scene.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);m.depthWrite=false;m.transparent=true;m.blending=T.AdditiveBlending;m.side=T.DoubleSide;}}});
  if(disposed){resources.forEach(r=>r.dispose());return;}
  group.add(gltf.scene);mixer=new T.AnimationMixer(gltf.scene);actions=gltf.animations.map(a=>{const action=mixer!.clipAction(a);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;return action;});ready=true;if(age<1.5)actions.forEach(a=>a.reset().play());group.userData.ready=true;group.userData.animations=actions.length;
 },undefined,()=>{group.userData.failed=true;});
 const trigger=(point:Position)=>{age=0;group.position.set(point.x,point.y,point.z);actions.forEach(a=>a.reset().play());};
 return {
  group,
  update(now:number,events:SportsEvent[]|undefined,actors:Actor[],ball?:Position,specialFlight=false,stream?:string){
   if(now-lastNow>500)age=10;const dt=Math.max(0,Math.min(.08,(now-lastNow)/1000));lastNow=now;age+=dt;
   const latest=events?.filter(e=>e.kind==='special').at(-1);
   if(stream!==lastStream){lastStream=stream;lastEvent=latest?.id??0;age=10;}
   if(lastEvent===-1)lastEvent=latest?.id??0;
   if(latest&&latest.id>lastEvent){lastEvent=latest.id;const actor=actors.find(a=>a.id===latest.actor);if(actor)trigger({x:actor.x,y:1.2,z:-actor.y});}
   if(specialFlight&&ball){group.position.set(ball.x,ball.y,ball.z);if(age>1.4)trigger(ball);}
   if(flame){flame.visible=specialFlight&&!document.hidden;if(ball)flame.position.set(ball.x,ball.y,ball.z);flame.scale.setScalar(1.2+.3*Math.sin(now*.025));}
   if(trail){
    trail.visible=specialFlight&&!document.hidden&&!reduced.matches;
    if(trail.visible&&ball){
     trailHistory.unshift(new T.Vector3(ball.x,ball.y,ball.z));trailHistory.length=Math.min(36,trailHistory.length);
     for(let i=0;i<36;i++){const point=trailHistory[Math.min(i,trailHistory.length-1)];const radius=i/36*.6;trailPositions[i*3]=point.x+Math.sin(i*2+now*.007)*radius;trailPositions[i*3+1]=point.y+Math.cos(i*2+now*.007)*radius;trailPositions[i*3+2]=point.z;}
     trail.geometry.attributes.position.needsUpdate=true;trail.geometry.computeBoundingSphere();
    }else trailHistory.length=0;
   }
   mixer?.update(dt);group.visible=ready&&(age<1.5||specialFlight)&&!document.hidden;
   group.scale.setScalar(sport==='golf'?2.8:sport==='basketball'?1.2:1.5);
   if(reduced.matches){group.visible=ready&&specialFlight;group.scale.multiplyScalar(.55);}
  },
  dispose(){if(trail){scene.remove(trail);trail.geometry.dispose();(trail.material as T.Material).dispose();}if(flame){scene.remove(flame);flame.geometry.dispose();(flame.material as T.Material).dispose();}disposed=true;mixer?.stopAllAction();scene.remove(group);resources.forEach(r=>r.dispose());resources.clear();},
 };
}
