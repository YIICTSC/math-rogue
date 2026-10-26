import{createGolferAssets}from'../gakuro-golf/golferModels';
import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {ProtagonistModel} from '../../three/protagonistModel';
import {AVATAR_COLORS,BODY_COLORS,HAIR_COLORS,type KartAvatar} from '../gakuro-kart/avatar';
import type {TennisView,Unit} from './types';
import {HALF_LENGTH,SINGLES_WIDTH,DOUBLES_WIDTH,NET,SERVICE_LENGTH} from './engine';
const cpuHeroes=['elementary-dodgeball','elementary-caretaker','high-school-warrior','elementary-assassin'];
const previewUnits:Unit[]=Array.from({length:4},(_,i)=>({id:'preview'+i,owner:null,name:'',side:i<2?0:1,x:i%2===0?-2.8:2.8,y:(i<2?-1:1)*(i%2===0?10.8:6.4),vx:0,vy:0,energy:.5,stamina:1,swing:0,shot:'topspin',shotSeq:0,buffer:0,aim:0,directionY:0,power:.5,dash:0,cpu:true}));
/** A render adapter only: court positions, hit timing and score are owned by engine.ts. */
export default function TennisCanvas({view,selfId,preview=false,avatar,suspended=false}:{view:TennisView|null;selfId:string;preview?:boolean;avatar?:KartAvatar;suspended?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),state=useRef({view,selfId,preview,avatar,suspended,at:performance.now()});state.current={view,selfId,preview,avatar,suspended,at:state.current.view===view?state.current.at:performance.now()};const[failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=canvas.current!;let renderer:T.WebGLRenderer|undefined,frame=0,disposed=false;
  const scene=new T.Scene();scene.background=new T.Color('#b9e3df');scene.fog=new T.Fog('#b9e3df',62,115);
  const owned:(T.BufferGeometry|T.Material|T.Texture)[]=[],geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
  const camera=new T.PerspectiveCamera(43,1,.1,150);
  const geo=(key:string,make:()=>T.BufferGeometry)=>{if(!geometries.has(key)){const g=make();geometries.set(key,g);owned.push(g);}return geometries.get(key)!;};
  const material=(color:string,roughness=.85)=>{const key=color+roughness;if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,roughness});materials.set(key,m);owned.push(m);}return materials.get(key)!;};
  const box=(parent:T.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>{const mesh=new T.Mesh(geo('box',()=>new T.BoxGeometry(1,1,1)),material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const sphere=(parent:T.Object3D,x:number,y:number,z:number,scale:number,color:string)=>{const mesh=new T.Mesh(geo('sphere',()=>new T.SphereGeometry(1,14,10)),material(color,.55));mesh.position.set(x,y,z);mesh.scale.setScalar(scale);parent.add(mesh);return mesh;};
  const disk=(radius:number,color:string,opacity=.5)=>{const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});owned.push(m);const mesh=new T.Mesh(geo('disk',()=>new T.CircleGeometry(1,32)),m);mesh.rotation.x=-Math.PI/2;mesh.scale.setScalar(radius);return mesh;};
  type Rig={custom:ReturnType<typeof athletes.create>;appearance:string;root:T.Group;hero:ProtagonistModel;fallback:T.Group;arm:T.Group;racket:T.Group;shadow:T.Mesh;ring:T.Mesh;label:T.Sprite;lastShot:number;swingAt:number;look:string|undefined;px:number;py:number};
  const athletes=createGolferAssets();
  const rigs=new Map<string,Rig>();
  const label=(name:string,color:string)=>{const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d')!;x.fillStyle='#102c3ae8';x.beginPath();x.roundRect(6,8,500,76,25);x.fill();x.strokeStyle=color;x.lineWidth=4;x.stroke();x.font='600 35px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff8e0';x.fillText(name.slice(0,16),256,48,460);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;owned.push(texture);const m=new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false});owned.push(m);const sprite=new T.Sprite(m);sprite.scale.set(2.7,.5,1);return sprite;};
  const createRig=(u:Unit,i:number)=>{
   const root=new T.Group(),fallback=new T.Group(),arm=new T.Group(),racket=new T.Group(),hero=new ProtagonistModel();const custom=athletes.create(u.avatar||{species:0,body:0,outfit:0,hair:0,accessory:0,hairStyle:0,kart:0,expression:0},true);root.add(hero.root,fallback,arm,custom.root);hero.root.scale.setScalar(1.05);
   const outfit=AVATAR_COLORS[u.avatar?.outfit??i%8],skin=BODY_COLORS[u.avatar?.body??0],hair=HAIR_COLORS[u.avatar?.hair??i%3];
   sphere(fallback,0,1.75,0,.45,skin);sphere(fallback,0,2.04,-.07,.44,hair);box(fallback,0,1.04,0,.67,.75,.43,outfit);box(fallback,0,.69,0,.7,.2,.45,'#f6f0da');
   for(const s of[-1,1]){box(fallback,s*.2,.35,0,.19,.64,.21,skin);box(fallback,s*.2,.07,.10,.25,.14,.43,'#ecf3ed');sphere(fallback,s*.15,1.79,.40,.055,'#253447');}
   arm.position.set(.37,1.3,.04);box(arm,.1,-.26,.08,.16,.55,.19,skin);arm.add(racket);racket.position.set(.15,-.52,.06);
   box(racket,0,.22,0,.06,.55,.06,'#162d40');const rim=new T.Mesh(geo('racket',()=>new T.TorusGeometry(.30,.035,8,28)),material(outfit,.4));rim.scale.set(.85,1.25,1);rim.position.y=.8;racket.add(rim);
   const strings:number[]=[];for(let n=-3;n<=3;n++){const a=n*.07,h=Math.sqrt(Math.max(0,.27*.27-a*a));strings.push(a,.8-h*1.25,0,a,.8+h*1.25,0,-h*.85,.8+a*1.25,0,h*.85,.8+a*1.25,0);}const stringGeo=new T.BufferGeometry();stringGeo.setAttribute('position',new T.Float32BufferAttribute(strings,3));owned.push(stringGeo);const stringMat=new T.LineBasicMaterial({color:'#e7f1ea',transparent:true,opacity:.8});owned.push(stringMat);racket.add(new T.LineSegments(stringGeo,stringMat));
   const shadow=disk(.68,'#173e3b',.2),ring=disk(.78,u.owner===state.current.selfId?'#ffe49a':u.side===0?'#5ee7da':'#ff9a7f',.38);shadow.position.y=.028;ring.position.y=.034;scene.add(root,shadow,ring);
   const name=u.owner===state.current.selfId?'◆ '+u.name:u.name;const tag=label(name,u.side===0?'#66e3d3':'#ffab92');tag.position.y=2.9;root.add(tag);
   const rig:Rig={custom,appearance:'',root,hero,fallback,arm,racket,shadow,ring,label:tag,lastShot:u.shotSeq,swingAt:-10,look:'',px:u.x,py:u.y};rigs.set(u.id,rig);return rig;
  };
  const lost=(e:Event)=>{e.preventDefault();setFailed(true);cancelAnimationFrame(frame);};
  let resize:ResizeObserver|undefined;
  try{
   renderer=new T.WebGLRenderer({canvas:el,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.8,window.devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   scene.add(new T.HemisphereLight('#f1fffa','#4e765d',2.1));const sun=new T.DirectionalLight('#fff1cb',2.7);sun.position.set(-15,30,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:25,bottom:-25,near:.1,far:70});sun.shadow.normalBias=.05;scene.add(sun);
   box(scene,0,-.3,0,110,.45,110,'#669b83');box(scene,0,-.02,0,17,.08,33,'#459e73');
   for(let n=0;n<12;n++)box(scene,0,.032,-HALF_LENGTH+(n+.5)*(HALF_LENGTH*2/12),DOUBLES_WIDTH*2,.015,HALF_LENGTH*2/12,n%2?'#61b97c':'#51a96f');
   const line=(x:number,z:number,sx:number,sz:number)=>box(scene,x,.052,z,sx,.014,sz,'#f6f0dc');
   for(const x of[-DOUBLES_WIDTH,-SINGLES_WIDTH,SINGLES_WIDTH,DOUBLES_WIDTH])line(x,0,.045,HALF_LENGTH*2);
   for(const y of[-HALF_LENGTH,HALF_LENGTH])line(0,y,DOUBLES_WIDTH*2,.045);
   for(const y of[-SERVICE_LENGTH,SERVICE_LENGTH])line(0,y,SINGLES_WIDTH*2,.045);line(0,0,.045,SERVICE_LENGTH*2);
   for(const y of[-HALF_LENGTH,HALF_LENGTH])line(0,y+Math.sign(y)*.12,.045,.24);
   const netPoints:number[]=[];for(let x=-6;x<=6;x+=.18)netPoints.push(x,.08,0,x,NET,0);for(let h=.08;h<=NET;h+=.13)netPoints.push(-6,h,0,6,h,0);const netGeo=new T.BufferGeometry();netGeo.setAttribute('position',new T.Float32BufferAttribute(netPoints,3));owned.push(netGeo);const netMaterial=new T.LineBasicMaterial({color:'#183c3b',transparent:true,opacity:.72});owned.push(netMaterial);scene.add(new T.LineSegments(netGeo,netMaterial));box(scene,0,NET+.015,0,12,.075,.055,'#fff8de');for(const x of[-6,6])box(scene,x,.56,0,.13,1.15,.13,'#254452');
   // Compact stadium, open sky and planted perimeter leave a clean silhouette around the court.
   const crowd:T.Vector3[][]=[[],[],[],[]];for(const side of[-1,1]){box(scene,side*10.8,1.1,0,2,2,29,'#244b56');for(let row=0;row<3;row++){box(scene,side*(10+row*.8),1.4+row*.42,0,.7,.35,28,'#385d66');for(let n=0;n<18;n++)crowd[(n+row)%4].push(new T.Vector3(side*(10+row*.8),1.75+row*.42,(n-8.5)*1.45));}}crowd.forEach((points,i)=>{const mesh=new T.InstancedMesh(geo('crowd',()=>new T.SphereGeometry(1,8,5)),material(['#efca79','#83c9bc','#f29c8d','#c2c9e7'][i]),points.length),matrix=new T.Matrix4();points.forEach((p,index)=>{matrix.compose(p,new T.Quaternion(),new T.Vector3(.18,.18,.18));mesh.setMatrixAt(index,matrix);});scene.add(mesh);});
   for(const z of[-17,17]){box(scene,0,.85,z,24,1.5,.35,'#284d56');for(let x=-16;x<=16;x+=4){box(scene,x,1,z+2*Math.sign(z),.28,2,.28,'#776e4d');const crown=sphere(scene,x,3,z+2*Math.sign(z),1.45,'#477f65');crown.scale.y=1.2;}}
   const ball=sphere(scene,0,1.2,0,.14,'#fff3a6');const ballShadow=disk(.19,'#123a39',.35),target=disk(.45,'#fff0aa',.22);scene.add(ballShadow,target);ballShadow.position.y=.06;target.position.y=.061;
   const trailGeo=new T.BufferGeometry(),trailPositions=new T.Float32BufferAttribute(new Float32Array(36),3),trailMat=new T.LineBasicMaterial({color:'#ffeb91',transparent:true,opacity:.6});trailPositions.setUsage(T.DynamicDrawUsage);trailGeo.setAttribute('position',trailPositions);trailGeo.setDrawRange(0,0);owned.push(trailGeo,trailMat);const trail=new T.Line(trailGeo,trailMat);trail.frustumCulled=false;scene.add(trail);
   const resizeView=()=>{if(!renderer)return;const r=el.getBoundingClientRect();renderer.shadowMap.enabled=r.width>680;renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();};resize=new ResizeObserver(resizeView);resize.observe(el);resizeView();el.addEventListener('webglcontextlost',lost);
   let last=performance.now();
   const loop=(now:number)=>{
    if(disposed)return;if(state.current.suspended){last=now;frame=requestAnimationFrame(loop);return;}if(now-last<(el.clientWidth<680?1000/30:1000/60)-1){frame=requestAnimationFrame(loop);return;}const dt=Math.min(.05,(now-last)/1000);last=now;const current=state.current,v=current.view,m=v?.match,units=m?.units||(current.avatar?previewUnits.map((u,i)=>i===0?{...u,avatar:current.avatar}:u):previewUnits),own=units.find(u=>u.owner===current.selfId),flip=own?.side===1?-1:1;
    const portrait=camera.aspect<.85,dist=current.preview?32:portrait?35:28,height=current.preview?27:portrait?28:22;camera.position.set(flip*.25,height,flip*dist);const short=portrait&&el.clientHeight<650&&!current.preview;camera.lookAt(0,0,flip*(short?3:portrait?0:3.2));camera.fov=current.preview?43:short?42:portrait?40:34;camera.updateProjectionMatrix();
    const active=new Set(units.map(u=>u.id));for(const[id,r]of rigs)if(!active.has(id)){r.hero.dispose();r.custom.dispose();scene.remove(r.root,r.shadow,r.ring);rigs.delete(id);}
    units.forEach((u,i)=>{const r=rigs.get(u.id)||createRig(u,i),heroId=u.avatar?u.avatar.protagonist:cpuHeroes[i%cpuHeroes.length];if(r.look!==heroId){r.look=heroId;r.hero.set(heroId);}
     r.root.position.x+=(u.x-r.root.position.x)*Math.min(1,dt*22);r.root.position.z+=(-u.y-r.root.position.z)*Math.min(1,dt*22);r.root.rotation.y=u.side===0?Math.PI:0;
     if(r.lastShot!==u.shotSeq){r.lastShot=u.shotSeq;r.swingAt=now;}
     const swing=Math.max(0,1-(now-r.swingAt)/420),moving=Math.hypot(u.vx,u.vy)>.2;r.hero.update(dt,moving?'Walk':'Idle');const useCustom=!!u.avatar&&!u.avatar.protagonist;r.custom.root.visible=useCustom;r.hero.root.visible=!useCustom;r.fallback.visible=!useCustom&&!r.hero.ready;if(useCustom){const key=JSON.stringify(u.avatar);if(r.appearance!==key){r.appearance=key;r.custom.update(u.avatar!);}r.custom.animateHero(dt,swing,moving);r.custom.rightArm.visible=false;r.custom.leftArm.rotation.x=moving?Math.sin(now/140)*.4:0;}
     r.hero.pose('upper_arm.R',-.7-swing*1.7,-.35-swing*.9);r.hero.pose('forearm.R',-.45-swing*.4);r.hero.pose('upper_arm.L',-.35+swing*.35,.25);r.hero.pose('spine',.06,swing*.65);
     r.root.position.y=(u.shot==='lob'&&swing>0?Math.sin(swing*Math.PI)*.25:0);r.arm.rotation.x=-.55-swing*1.4;r.arm.rotation.z=-.7-swing*.7;r.racket.rotation.y=swing*1.8;
     const bone=r.root.getObjectByName('forearmR');if(bone&&r.hero.ready){r.root.updateMatrixWorld(true);const pos=bone.localToWorld(new T.Vector3(0,.28,0));r.arm.position.copy(r.root.worldToLocal(pos));r.arm.position.x+=.35;}else r.arm.position.set(.37,1.3,.04);
     r.shadow.position.set(r.root.position.x,.028,r.root.position.z);r.ring.position.set(r.root.position.x,.034,r.root.position.z);r.ring.visible=u.owner===current.selfId||current.preview;r.label.visible=!!u.name;
    });
    if(m){const b=m.ball,extrapolate=m.phase==='rally'?Math.min(.06,Math.max(0,(now-current.at)/1000)):0;ball.position.set(b.x+b.vx*extrapolate,Math.max(.08,b.z+b.vz*extrapolate-4.9*extrapolate*extrapolate),-b.y-b.vy*extrapolate);ballShadow.position.set(b.x,.06,-b.y);ballShadow.scale.setScalar(.19+Math.max(0,b.z)*.04);ball.visible=m.phase!=='finished';
     const trailCount=Math.min(b.trail.length,trailPositions.count);for(let i=0;i<trailCount;i++){const p=b.trail[i];trailPositions.setXYZ(i,p[0],p[2],-p[1]);}trailPositions.needsUpdate=true;trailGeo.setDrawRange(0,trailCount);trail.visible=m.phase==='rally'&&trailCount>1;trailMat.color.set(m.units.filter(u=>u.side===b.lastSide).sort((a,b)=>b.shotSeq-a.shotSeq)[0]?.shot==='special'?'#ff9487':'#fff0a3');
     target.visible=m.phase==='rally'&&b.bounces===0;const t=(b.vz+Math.sqrt(Math.max(0,b.vz*b.vz+19.6*Math.max(0,b.z-.08))))/9.8;target.position.set(b.x+b.vx*t+.5*b.spin*t*t,.061,-b.y-b.vy*t);
    }else{ball.position.set(Math.sin(now/950)*2,1.5+Math.sin(now/320)*.5,Math.cos(now/950)*6);ballShadow.position.set(ball.position.x,.06,ball.position.z);target.visible=false;trail.visible=false;}
    renderer!.render(scene,camera);el.dataset.custom=String([...rigs.values()].filter(r=>r.custom.root.visible).length);el.dataset.players=String(units.length);el.dataset.heroes=String([...rigs.values()].filter(r=>r.custom.root.visible||r.hero.ready).length);frame=requestAnimationFrame(loop);
   };frame=requestAnimationFrame(loop);
  }catch{setFailed(true);}
  return()=>{disposed=true;cancelAnimationFrame(frame);resize?.disconnect();el.removeEventListener('webglcontextlost',lost);for(const r of rigs.values()){r.hero.dispose();r.custom.dispose();}athletes.dispose();owned.forEach(o=>o.dispose());renderer?.dispose();};
 },[]);
 return <div className="tennis-court-view"><canvas ref={canvas} aria-label="Tennis court" data-testid="tennis-court"/>{failed&&<CourtFallback view={view} selfId={selfId}/>}</div>;
}
/** GPU fallback keeps the same simulation and controls playable on restricted WebViews. */
function CourtFallback({view,selfId}:{view:TennisView|null;selfId:string}){const el=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=el.current!,ctx=c.getContext('2d')!;const r=c.getBoundingClientRect();c.width=Math.max(1,r.width*devicePixelRatio);c.height=Math.max(1,r.height*devicePixelRatio);ctx.scale(c.width/400,c.height/600);ctx.fillStyle='#3f9972';ctx.fillRect(0,0,400,600);ctx.strokeStyle='#fff4d8';ctx.lineWidth=2;ctx.strokeRect(54,45,292,510);ctx.strokeRect(91,45,218,510);ctx.strokeRect(91,162,218,276);ctx.beginPath();ctx.moveTo(200,162);ctx.lineTo(200,438);ctx.moveTo(40,300);ctx.lineTo(360,300);ctx.stroke();const m=view?.match,flip=m?.units.find(u=>u.owner===selfId)?.side===1?-1:1;for(const u of m?.units||previewUnits){ctx.fillStyle=u.owner===selfId?'#ffe49a':u.side===0?'#74eddf':'#ff9f8c';ctx.beginPath();ctx.arc(200+u.x*26*flip,300-u.y*21*flip,12,0,Math.PI*2);ctx.fill();}if(m){ctx.fillStyle='#fff3a6';ctx.beginPath();ctx.arc(200+m.ball.x*26*flip,300-m.ball.y*21*flip-m.ball.z*5,5,0,Math.PI*2);ctx.fill();}},[view,selfId]);return <canvas ref={el} className="tennis-fallback" aria-label="Tennis court 2D"/>;}
