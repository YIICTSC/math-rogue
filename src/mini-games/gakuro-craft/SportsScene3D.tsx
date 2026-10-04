import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import type {HomeGame,GameCommand} from './homeGames';
import type {BowlingLane,PartyState} from './partyGames';
import {PIN_POSITIONS} from './partyGames';
export type SportsSceneProps={kind:'pool'|'bowling';spinX?:number;spinY?:number;t:(s:string)=>string;top:boolean;onUnavailable:()=>void;pool?:HomeGame['pool'];lane?:BowlingLane;shot?:PartyState['shot'];progress?:number;aim?:number;spin?:number;color?:string;myTurn?:boolean;paused?:boolean;placing?:boolean;gameKey?:string;turn?:number;send?:(c:GameCommand)=>void;onPower?:(n:number)=>void;onPlace?:()=>void};
type Pull={id:number;x:number;z:number;endX:number;endZ:number;screenX:number;screenY:number;turn:number|undefined};
const BALL_COLORS=['#f7f2df','#e8bf37','#2969ba','#d94945','#8950b0','#e48136','#2c916e','#8b332e','#15191b'];
export default function SportsScene3D(props:SportsSceneProps){
 const surface=useRef<HTMLCanvasElement>(null),latest=useRef(props),project=useRef<(x:number,y:number)=>THREE.Vector3|null>(),pull=useRef<Pull|null>(null);
 latest.current=props;
 useEffect(()=>{pull.current=null;props.onPower?.(0);},[props.gameKey,props.turn,props.myTurn,props.paused,props.top]);
 useEffect(()=>{const cancel=()=>{pull.current=null;latest.current.onPower?.(0);};window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[]);
 useEffect(()=>{
  const canvas=surface.current!;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{latest.current.onUnavailable();return;}
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#101b29');
  const camera=new THREE.OrthographicCamera(-1.4,1.4,1,-1,.01,30),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const ambient=new THREE.HemisphereLight('#f4f6ff','#314254',2);scene.add(ambient);
  const light=new THREE.DirectionalLight('#fff0cf',3);light.position.set(-1,4,2);light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.left=-3;light.shadow.camera.right=3;light.shadow.camera.top=4;light.shadow.camera.bottom=-4;light.shadow.bias=-.0005;scene.add(light);
  const fill=new THREE.DirectionalLight('#7bb9dd',1.1);fill.position.set(2,2,-3);scene.add(fill);
  const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[];
  const material=(color:string,roughness=.6,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m;};
  const mesh=(geometry:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{geometries.push(geometry);const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;};
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const wood=material('#633923',.35),brass=material('#c8a864',.32,.7),felt=material('#167261',.95),dark=material('#071219',.95);
  let balls:THREE.Mesh[]=[],pins:THREE.Mesh[]=[],cue:THREE.Mesh|undefined,aimLine:THREE.Line,ball:THREE.Mesh|undefined;
  const lineMaterial=new THREE.LineDashedMaterial({color:'#ffe3a2',dashSize:.055,gapSize:.035,transparent:true,opacity:.8});materials.push(lineMaterial);
  aimLine=new THREE.Line(new THREE.BufferGeometry(),lineMaterial);geometries.push(aimLine.geometry);scene.add(aimLine);
  if(props.kind==='pool'){
   box(2.17,.13,1.17,wood,0,-.095,0);box(2,.018,1,felt,0,-.009,0);
   for(const z of [-.54,.54])for(const x of [-.51,.51]){box(.86,.055,.065,felt,x,.018,z);box(.88,.014,.018,brass,x,.047,z+(z>0?.035:-.035));}
   for(const x of [-1.04,1.04])box(.06,.055,.82,felt,x,.018,0);
   for(const x of [-1,0,1])for(const z of [-.5,.5]){const pocket=mesh(new THREE.CylinderGeometry(.047,.038,.045,24),dark,x,.003,z);pocket.receiveShadow=false;mesh(new THREE.TorusGeometry(.05,.006,8,24),brass,x,.018,z).rotation.x=Math.PI/2;}
   for(const x of [-.83,.83])for(const z of [-.35,.35])box(.075,.24,.075,wood,x,-.27,z);
   const floor=mesh(new THREE.PlaneGeometry(4,3),material('#14242d'),0,-.41,0);floor.rotation.x=-Math.PI/2;
   for(let id=0;id<16;id++){
    const color=BALL_COLORS[id===0?0:id===8?8:(id-1)%7+1],m=material(color,.14,.08);
    if(id){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle=id>8?'#f6f2e6':color;ctx.fillRect(0,0,256,128);if(id>8){ctx.fillStyle=color;ctx.fillRect(0,35,256,58);}for(const x of [64,192]){ctx.fillStyle='#fff6e9';ctx.beginPath();ctx.arc(x,64,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151b24';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 25px sans-serif';ctx.fillText(String(id),x,65);}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);m.map=tex;m.color.set('#ffffff');}
    const o=mesh(new THREE.SphereGeometry(.018,24,16),m);o.quaternion.setFromEuler(new THREE.Euler(.5,0,.5));balls.push(o);
   }
   cue=mesh(new THREE.CylinderGeometry(.003,.006,.8,12),material('#d9b77d',.4));cue.visible=false;
  }else{
   const laneMaterial=material('#ba8d4d',.27);box(1.12,.07,7.5,laneMaterial,0,-.04,0);
   for(const x of [-.63,.63])box(.12,.045,7.5,dark,x,-.015,0);
   for(let i=0;i<9;i++)box(.005,.001,7.5,material(i%2?'#af7b3c':'#c49a60',.35),-.5+i*.125,.002,0);
   box(1.5,.14,.35,wood,0,-.12,-3.85);box(1.5,.1,7.7,wood,0,-.16,0);
   const floor=mesh(new THREE.PlaneGeometry(5,10),material('#13212d'),0,-.22,0);floor.rotation.x=-Math.PI/2;
   const profile=[[0,0],[.025,0],[.036,.025],[.034,.075],[.025,.105],[.011,.14],[.013,.175],[.021,.19],[.018,.22],[0,.235]].map(([x,y])=>new THREE.Vector2(x,y));
   const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#fff9ed';ctx.fillRect(0,0,128,256);ctx.fillStyle='#c63d46';ctx.fillRect(0,58,128,8);ctx.fillRect(0,73,128,8);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);const pinMaterial=material('#ffffff',.22);pinMaterial.map=tex;
   for(const p of PIN_POSITIONS)pins.push(mesh(new THREE.LatheGeometry(profile,20),pinMaterial,p.x*.9,0,-2.6-p.y));
   ball=mesh(new THREE.SphereGeometry(.11,24,16),material('#7850bd',.14,.18));
   for(const x of [-.3,-.2,-.1,0,.1,.2,.3])mesh(new THREE.ConeGeometry(.017,.05,3),material('#71502e'),x,.003,.65).rotation.x=Math.PI/2;
  }
  const point=(clientX:number,clientY:number)=>{const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height*2-1)),camera);const out=new THREE.Vector3();return ray.ray.intersectPlane(plane,out);};project.current=point;
  let width=0,height=0,lastTop:boolean|undefined,frame=0,last=performance.now(),contextLost=false;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(now:number)=>{
   if(contextLost)return;const v=latest.current;const interval=document.hidden?250:v.pool?.moving||pull.current||v.shot?1000/60:100;if(now-last<interval){frame=requestAnimationFrame(draw);return;}const dt=Math.min(.1,(now-last)/1000);last=now;
   const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(w!==width||h!==height||lastTop!==v.top)){width=w;height=h;lastTop=v.top;renderer.setSize(w,h,false);const aspect=w/h;if(v.kind==='pool'){const span=2.5;camera.left=-span/2;camera.right=span/2;camera.top=span/aspect/2;camera.bottom=-span/aspect/2;camera.up.set(0,v.top?0:1,v.top?-1:0);camera.position.set(0,v.top?3:2.5,v.top ? .001 : 1.6);camera.lookAt(0,-.02,0);}else{const span=Math.max(2.1,4.4*aspect);camera.left=-span/2;camera.right=span/2;camera.top=span/aspect/2;camera.bottom=-span/aspect/2;camera.up.set(0,1,0);camera.position.set(.12,2.7,5.4);camera.lookAt(0,0,-.7);}camera.updateProjectionMatrix();}
   if(v.kind==='pool'&&v.pool){for(const b of v.pool.balls){const o=balls[b.id];if(!o)continue;o.visible=!b.potted;if(!o.visible)continue;const x=b.x*2-1,z=b.y-.5,dx=x-o.position.x,dz=z-o.position.z;const factor=Math.hypot(dx,dz)>.3||v.paused?1:1-Math.exp(-dt*25),sx=dx*factor,sz=dz*factor;if(!motion.matches&&Math.hypot(sx,sz)>.00001){const axis=new THREE.Vector3(sz,0,-sx).normalize();o.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,Math.hypot(sx,sz)/.018));}o.position.set(o.position.x+sx,.018,o.position.z+sz);}
    const p=pull.current,b=balls[0];cue!.visible=!!p&&!!v.myTurn&&!v.pool.moving&&!v.paused;aimLine.visible=cue!.visible;if(cue!.visible&&p){const dx=p.x-p.endX,dz=p.z-p.endZ,len=Math.hypot(dx,dz),dir=new THREE.Vector3(dx,0,dz).normalize();cue!.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);cue!.position.copy(b.position).addScaledVector(dir,-.45-Math.min(.25,len*.25));cue!.position.y=.028;aimLine.geometry.dispose();aimLine.geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(b.position.x,.025,b.position.z),new THREE.Vector3(b.position.x+dir.x*.65,.025,b.position.z+dir.z*.65)]);aimLine.computeLineDistances();}
   }else if(v.kind==='bowling'&&v.lane&&ball){const progress=v.progress||0,shot=v.shot;for(let i=0;i<pins.length;i++){const o=pins[i],p=PIN_POSITIONS[i],fall=shot?.pins.includes(i)?Math.max(0,Math.min(1,(progress-.85)/.15)):0;o.visible=v.lane.pins[i];o.position.set(p.x*.9+(fall*(i%2?1:-1)*.1),fall*.015,-2.6-p.y-fall*.12);o.rotation.set(fall*1.5,0,fall*(i%2?.5:-.5));}const aim=shot?.aim??v.aim??0,spin=shot?.spin??v.spin??0;ball.position.set(aim*.72+spin*.24*progress,.11,3-progress*5.6);if(!motion.matches&&shot&&!v.paused)ball.rotation.x-=dt*8;ball.visible=!shot||progress<.98;(ball.material as THREE.MeshStandardMaterial).color.set(v.color||'#7850bd');aimLine.visible=!shot;if(!shot){aimLine.geometry.dispose();aimLine.geometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:12},(_,i)=>new THREE.Vector3(aim*.72+spin*.24*i/11,.012,3-i/11*5.6)));aimLine.computeLineDistances();}}
   if(!document.hidden)renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };
  const lost=(e:Event)=>{e.preventDefault();contextLost=true;latest.current.onUnavailable();};canvas.addEventListener('webglcontextlost',lost);
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);project.current=undefined;canvas.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());aimLine.geometry.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());light.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();scene.clear();};
 },[props.kind]);
 const down=(e:React.PointerEvent<HTMLCanvasElement>)=>{const v=latest.current;if(v.kind!=='pool'||!v.myTurn||v.paused||v.pool?.moving||!e.isPrimary||e.button!==0||pull.current)return;const p=project.current?.(e.clientX,e.clientY);if(!p||Math.abs(p.x)>1.15||Math.abs(p.z)>.65)return;e.preventDefault();if(v.placing&&v.pool?.ballInHand){v.send?.({type:'game_cue',key:v.gameKey!,x:(p.x+1)/2,y:p.z+.5});v.onPlace?.();return;}pull.current={id:e.pointerId,x:p.x,z:p.z,endX:p.x,endZ:p.z,screenX:e.clientX,screenY:e.clientY,turn:v.turn};e.currentTarget.setPointerCapture(e.pointerId);};
 const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=pull.current,v=latest.current;if(!p||p.id!==e.pointerId)return;if(!v.myTurn||v.paused||v.pool?.moving||v.turn!==p.turn){pull.current=null;v.onPower?.(0);return;}const point=project.current?.(e.clientX,e.clientY);if(!point)return;p.endX=point.x;p.endZ=point.z;v.onPower?.(Math.min(1,Math.hypot(p.x-p.endX,p.z-p.endZ)/.6));};
 const cancel=()=>{pull.current=null;latest.current.onPower?.(0);};
 const up=(e:React.PointerEvent<HTMLCanvasElement>)=>{move(e);const p=pull.current,v=latest.current;if(!p)return;const distance=Math.hypot(p.x-p.endX,p.z-p.endZ),moved=Math.hypot(e.clientX-p.screenX,e.clientY-p.screenY);cancel();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(v.myTurn&&!v.paused&&!v.pool?.moving&&moved>=8)v.send?.({type:'game_shot',key:v.gameKey!,spinX:v.spinX,spinY:v.spinY,angle:Math.atan2(p.z-p.endZ,p.x-p.endX),power:Math.max(.1,Math.min(1,distance/.6))});};
 return <canvas ref={surface} data-renderer="webgl" className={'gc-sports-canvas '+(props.kind==='pool'?'gc-pool-table':'gc-bowling-lane')} tabIndex={0} role="group" aria-label={props.t(props.kind==='pool'?'ビリヤードの台':'ボウリングレーン')} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel}/>;
}
