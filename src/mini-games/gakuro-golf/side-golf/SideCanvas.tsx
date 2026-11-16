import React,{useEffect,useRef,useState,type MutableRefObject} from 'react';
import * as T from 'three';
import {createGolferAssets} from '../golferModels';
import type {PublicGolfer} from '../engine';
import type {SportsReaction} from '../../shared/SportsPresentation';
import type {KartAvatar} from '../../gakuro-kart/avatar';
import {SIDE_COURSES,solidPoints,type Power} from './courses';
import {type SideState} from './physics';
export default function SideCanvas({game,angle,power,shot,correct,avatar,overview,paused,players=[],selfId='',reaction=null}:{players?:PublicGolfer[];selfId?:string;reaction?:SportsReaction|null;game:MutableRefObject<SideState>;angle:number;power:number;shot:Power|'special';correct:number;avatar:KartAvatar;overview:boolean;paused:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),current=useRef({angle,power,shot,correct,avatar,overview,paused,players,selfId,reaction});current.current={angle,power,shot,correct,avatar,overview,paused,players,selfId,reaction};
 const drag=useRef<{id:number;x:number;y:number}|null>(null),pan=useRef({x:0,y:0}),[failed,setFailed]=useState(false),courseId=game.current.courseId;
 useEffect(()=>{
  pan.current={x:0,y:0};const el=canvas.current!,c=SIDE_COURSES[courseId],scene=new T.Scene();scene.background=new T.Color(c.theme.sky);
  const resources:(T.BufferGeometry|T.Material)[]=[],assets=createGolferAssets(),rig=assets.create(current.current.avatar);rig.root.scale.setScalar(6.8);scene.add(rig.root);
  let renderer:T.WebGLRenderer|undefined,frame=0,disposed=false,observer:ResizeObserver|undefined;
  const camera=new T.OrthographicCamera(-180,180,110,-110,.1,700);camera.position.set(c.width/2,c.height/2,180);camera.lookAt(c.width/2,c.height/2,0);
  const mat=(color:string,opacity=1)=>{const m=new T.MeshStandardMaterial({color,roughness:.85,transparent:opacity<1,opacity,depthWrite:opacity>=1});resources.push(m);return m;};
  const basic=(color:string,opacity=1)=>{const m=new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1});resources.push(m);return m;};
  const mesh=(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,parent:T.Object3D=scene)=>{resources.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
  const box=(x:number,y:number,w:number,h:number,color:string,z=0,opacity=1,parent:T.Object3D=scene)=>mesh(new T.BoxGeometry(w,h,2),mat(color,opacity),x+w/2,y+h/2,z,parent);
  const circle=(x:number,y:number,r:number,color:string,z=1)=>mesh(new T.CircleGeometry(r,32),basic(color),x,y,z);
  const line=(points:T.Vector3[],color:string,parent:T.Object3D=scene)=>{const g=new T.BufferGeometry().setFromPoints(points),m=new T.LineBasicMaterial({color});resources.push(g,m);const o=new T.Line(g,m);parent.add(o);return o;};
  const solids:T.Group[]=[],deviceMeshes:T.Object3D[]=[],coins:T.Mesh[]=[];
  scene.add(new T.HemisphereLight('#fff9e3','#535c88',2.4));const light=new T.DirectionalLight('#ffefd9',3);light.position.set(-20,150,170);scene.add(light);
  // Low contrast background stays behind the sharply outlined playable terrain.
  for(let i=0;i<12;i++){const shape=new T.Shape();shape.moveTo(i*52-100,-80);shape.lineTo(i*52-35,55+(i%3)*25);shape.lineTo(i*52+25,-80);mesh(new T.ShapeGeometry(shape),basic(c.theme.rock,.22),0,0,-35);}
  for(let i=0;i<25;i++){const star=circle((i*73)%420-30,140+(i*37)%100,i%3===0?1.1:.45,'#fff9dd',-20);star.material=basic('#fff9dd',.4);}
  c.solids.forEach(s=>{const group=new T.Group();solids.push(group);scene.add(group);const shape=new T.Shape();s.points.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
   const color=s.material==='ice'?'#72cbd8':s.material==='sand'?'#bea16c':s.material==='sticky'?'#758bca':s.material==='fragile'?'#a77d9e':c.theme.rock;
   mesh(new T.ExtrudeGeometry(shape,{depth:7,bevelEnabled:false}),mat(color),0,0,-6,group);
   line([...s.points,s.points[0]].map(p=>new T.Vector3(p.x,p.y,1.3)),c.theme.turf,group);
   for(let i=0;i<s.points.length;i++){const a=s.points[i],b=s.points[(i+1)%s.points.length];if(b.x<a.x){const edge=box(Math.min(a.x,b.x),(a.y+b.y)/2-.5,Math.abs(b.x-a.x),1,c.theme.turf,1.5,1,group);if(a.y!==b.y)edge.visible=false;}}
   for(let i=0;i<8;i++){const px=s.points[0].x+((i*31+17)%Math.max(1,Math.abs(s.points[1].x-s.points[0].x))),py=s.points[0].y+3+(i%3)*3;const layer=box(px,py,3+(i%2)*2,.6,c.theme.turf,1.1,.1,group);if(s.points.length!==4||py>s.points[2].y-3)layer.visible=false;}
   if(s.material==='fragile'){const center=s.points.reduce((a,p)=>({x:a.x+p.x/s.points.length,y:a.y+p.y/s.points.length}),{x:0,y:0});line([new T.Vector3(center.x-4,center.y+9,3),new T.Vector3(center.x+2,center.y+2,3),new T.Vector3(center.x-2,center.y-4,3),new T.Vector3(center.x+4,center.y-10,3)],'#f5d2e0',group);}
  });
  c.devices.forEach(d=>{const group=new T.Group();scene.add(group);deviceMeshes.push(group);
   if(d.kind==='portal'){const ring=mesh(new T.TorusGeometry(d.w*.47,1.5,8,40),mat(c.theme.accent),d.x+d.w/2,d.y+d.h/2,4,group);ring.scale.y=d.h/d.w;mesh(new T.CircleGeometry(d.w*.42,32),basic('#6b67e7',.6),d.x+d.w/2,d.y+d.h/2,3,group);}
   else if(d.kind==='bumper'){mesh(new T.SphereGeometry(d.w/2,20,12),mat('#ffc89e'),d.x+d.w/2,d.y+d.h/2,2,group);mesh(new T.TorusGeometry(d.w/2,.8,8,32),mat('#fff0c9'),d.x+d.w/2,d.y+d.h/2,8,group);}
   else if(d.kind==='spring'){box(d.x,d.y,d.w,d.h,'#ffd980',3,1,group);for(let i=0;i<4;i++)line([new T.Vector3(d.x+i*d.w/4,d.y,5),new T.Vector3(d.x+(i+.5)*d.w/4,d.y-3,5),new T.Vector3(d.x+(i+1)*d.w/4,d.y,5)],'#fcf6d6',group);}
   else {const color=d.kind==='lava'?'#ff8559':d.kind==='water'?'#67d4e3':d.kind==='gravity'?'#c2a0ff':'#adffdc';box(d.x,d.y,d.w,d.h,color,2,d.kind==='water'||d.kind==='lava'?.82:.14,group);if(d.kind==='fan'||d.kind==='gravity')for(let i=0;i<4;i++){const x=d.x+d.w/2,y=d.y+10+i*(d.h-14)/4;line([new T.Vector3(x-3,y-3,4),new T.Vector3(x,y+1,4),new T.Vector3(x+3,y-3,4)],color,group);}}
  });
  c.coins.forEach(p=>coins.push(mesh(new T.OctahedronGeometry(2.6),mat('#ffe48b'),p.x,p.y,4)));
  const cup=circle(c.cup.x,c.cup.y+.1,2.6,'#27334a',4);cup.scale.y=.3;
  box(c.cup.x,c.cup.y, .6,18,'#fff3d3',3);const flag=new T.Shape();flag.moveTo(0,0);flag.lineTo(10,-2.4);flag.lineTo(0,-6);flag.closePath();mesh(new T.ShapeGeometry(flag),basic('#ffe79c'),c.cup.x,c.cup.y+18,4);
  const ball=mesh(new T.SphereGeometry(1.45,16,12),mat('#fffbea'),0,0,5),halo=mesh(new T.TorusGeometry(3,.28,6,32),basic(c.theme.accent,.8),0,0,3);
  const aimGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),aimMat=new T.LineBasicMaterial({color:'#fff3bd',depthTest:false});resources.push(aimGeo,aimMat);const path=new T.Line(aimGeo,aimMat);scene.add(path);const arrow=mesh(new T.ConeGeometry(1.1,3,12),basic('#fff3bd'),0,0,7);
  const rubble=new Map<number,T.Group>(),otherBalls=new Map<string,T.Mesh>(),displayBall=new T.Vector3(game.current.ball.x,game.current.ball.y,6);
  const comet=Array.from({length:6},(_,i)=>mesh(new T.SphereGeometry(1.6-i*.16,12,8),basic(i%2?'#ffb54c':'#fff0a1',1-i*.12),0,0,5));
  const trails:T.Vector3[]=[];
  let snapCamera=true,lastOverview=current.current.overview,serial=game.current.serial,swingAt=-999,burstAt=-999,reactionAt=-999,reactionKey='',lastShot=current.current.players.find(v=>v.id===selfId)?.shotId,previous=performance.now(),appearance=JSON.stringify(current.current.avatar),width=600,height=400;
  const burst=mesh(new T.TorusGeometry(1,.15,8,32),basic('#fff4bf',.8),0,0,6);burst.visible=false;
  try{renderer=new T.WebGLRenderer({canvas:el,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.7,devicePixelRatio));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
   observer=new ResizeObserver(()=>{const r=el.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);snapCamera=true;renderer?.setSize(width,height,false);});observer.observe(el);
   const draw=(now:number)=>{if(disposed)return;const dt=Math.min(.05,(now-previous)/1000);previous=now;const s=game.current,p=current.current,b=s.ball;
    if(s.serial!==serial){serial=s.serial;if(s.event==='shot')swingAt=now;if(['water','warp'].includes(s.event))displayBall.set(b.x,b.y,6);if(['land','goal','coin','spring','break','warp','brake'].includes(s.event)){burstAt=now;burst.position.set(b.x,b.y,6);}}
    const active=p.players.find(v=>v.id===p.selfId);if(active?.shotId!==lastShot){if(lastShot!==undefined&&s.phase==='flight'&&active?.phase==='moving')swingAt=now;lastShot=active?.shotId;}
    if(p.reaction&&p.reaction.key!==reactionKey){reactionKey=p.reaction.key;reactionAt=now;}
    solids.forEach((group,i)=>{const solid=c.solids[i],points=solidPoints(solid,s.time);group.position.set(points[0].x-solid.points[0].x,points[0].y-solid.points[0].y,0);group.visible=!s.broken.includes(i);});
    for(const f of s.fragments){let group=rubble.get(f.id);if(!group){group=new T.Group();const shape=new T.Shape();f.points.forEach((v,i)=>i?shape.lineTo(v.x,v.y):shape.moveTo(v.x,v.y));shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth:7,bevelEnabled:false}),mat(c.theme.rock),0,0,-6,group);line([...f.points,f.points[0]].map(v=>new T.Vector3(v.x,v.y,1.5)),c.theme.turf,group);scene.add(group);rubble.set(f.id,group);}group.position.set(f.x,f.y,0);group.rotation.z=f.angle;group.visible=f.y>-65;}
    otherBalls.forEach(o=>{o.visible=false;});for(const player of p.players){if(player.id===p.selfId||player.spectator||!player.connected||player.hole!==active?.hole)continue;let o=otherBalls.get(player.id);if(!o){o=mesh(new T.SphereGeometry(1.3,12,8),mat(['#8cdcff','#ffacd6','#e9df88','#b4a3ff'][player.slot%4],.7),player.x,player.y,8);otherBalls.set(player.id,o);}o.visible=true;o.position.lerp(new T.Vector3(player.x,player.y,8),Math.min(1,dt*22));}
    coins.forEach((o,i)=>{o.visible=!s.coins.includes(i);o.rotation.y=now/600;o.position.y=c.coins[i].y+Math.sin(now/600+i)*1.3;});
    deviceMeshes.forEach((o,i)=>{const d=c.devices[i];if(d.kind==='water'&&s.frozen.includes(i))o.traverse(m=>{if(m instanceof T.Mesh)(m.material as T.MeshStandardMaterial).color?.set('#d1faff');});});
    const k=JSON.stringify(p.avatar);if(k!==appearance){appearance=k;rig.update(p.avatar);}
    const swing=Math.max(0,1-(now-swingAt)/750);rig.animateHero(dt,swing);const origin=s.phase==='flight'?s.origin:b;rig.root.position.set(origin.x-6,origin.y-1.45,4);rig.root.rotation.set(0,.08,0);rig.torso.rotation.set(0,0,0);rig.leftArm.rotation.set(0,0,0);rig.rightArm.rotation.set(0,0,0);rig.arms.rotation.z=-Math.sin(swing*Math.PI)*1.8;rig.club.visible=true;
    if(rig.hero.ready){rig.hero.pose('upper_arm.L',-.65-swing*.7,.65);rig.hero.pose('upper_arm.R',-.8-swing*1.5,-.6);rig.hero.pose('forearm.L',-.7,.1);rig.hero.pose('forearm.R',-.8+swing*.5,-.15);rig.hero.pose('spine',.08,Math.sin(swing*Math.PI)*.42);rig.hero.grip(rig.club);}else{rig.club.rotation.y=-.85;rig.club.rotation.z=Math.sin(swing*Math.PI)*1.2;}
    el.dataset.heroFacing='front';
    const reactionAge=(now-reactionAt)/1000,mood=s.phase==='holed'&&!s.conceded?'cheer':reactionAge<2?p.reaction?.kind:undefined;
    rig.setExpression(mood==='cheer'?2:mood==='pickup'?1:mood==='recover'?7:undefined);el.dataset.reaction=mood||'idle';el.dataset.action=swing>0?'swing':mood||'idle';
    if(mood&&s.phase!=='flight'&&swing===0){
     const beat=Math.sin(reactionAge*8),lift=mood==='cheer'?1.9:mood==='pickup'?1.15:mood==='equip'?.8:0;
     rig.club.visible=false;rig.arms.rotation.z=0;rig.leftArm.rotation.z=mood==='cheer'?-lift:-.15;rig.rightArm.rotation.z=lift;rig.torso.rotation.x=mood==='recover'?.26:0;
     rig.hero.pose('upper_arm.L',mood==='recover'?.2:-.2,mood==='cheer'?-lift:-.1);rig.hero.pose('upper_arm.R',-.2,lift);rig.hero.pose('forearm.R',-.5);rig.hero.pose('spine',mood==='recover'?.25:Math.sin(reactionAge*5)*.08,0);rig.hero.pose('head',mood==='pickup'||mood==='equip'?Math.sin(reactionAge*7)*.1:0,0,mood==='recover'?Math.sin(reactionAge*8)*.25:0);
     if(mood==='cheer')rig.root.position.y+=Math.abs(beat)*2;
    }
    displayBall.lerp(new T.Vector3(b.x,b.y,6),Math.min(1,dt*28));ball.position.copy(displayBall);halo.position.copy(ball.position);halo.scale.setScalar(1+Math.sin(now/180)*.1);halo.visible=s.phase==='aim';
    const heroScreen=rig.root.position.clone().project(camera);el.dataset.heroScreenX=String((heroScreen.x+1)*width/2);
    const a=p.angle*Math.PI/180,positions=aimGeo.getAttribute('position') as T.BufferAttribute;positions.setXYZ(0,b.x,b.y,7);positions.setXYZ(1,b.x+Math.cos(a)*13,b.y+Math.sin(a)*13,7);positions.needsUpdate=true;aimGeo.computeBoundingSphere();arrow.position.set(b.x+Math.cos(a)*14,b.y+Math.sin(a)*14,7);arrow.rotation.z=a-Math.PI/2;path.visible=arrow.visible=s.phase==='aim'&&!p.paused;
    const special=s.phase==='flight'&&s.shot==='special'&&s.flight<3.5;trails.unshift(displayBall.clone());if(trails.length>18)trails.pop();comet.forEach((o,i)=>{o.visible=special;if(trails[i*2])o.position.copy(trails[i*2]);});(ball.material as T.MeshStandardMaterial).emissive.set(special?'#ffb329':'#000000');
    const life=(now-burstAt)/500;burst.visible=life<1;burst.scale.setScalar(2+life*12);(burst.material as T.MeshBasicMaterial).opacity=Math.max(0,1-life);
    const span=p.overview?c.width+28:width/height>1.2?c.width+20:180,viewHeight=p.overview?Math.max(120,span*height/width):width/height<.85?Math.min(235,Math.max(180,span*height/width)):Math.max(120,span*height/width),viewWidth=viewHeight*width/height;
    camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
    const cx=p.overview?c.width/2:Math.max(viewWidth/2-12,Math.min(c.width-viewWidth/2+12,b.x+viewWidth*.17)),cy=p.overview?c.height/2:Math.max(viewHeight*.44,Math.min(c.height-20,b.y+25));
    if(snapCamera||lastOverview!==p.overview){camera.position.x=cx+pan.current.x;camera.position.y=cy+pan.current.y;snapCamera=false;lastOverview=p.overview;}
    camera.position.x+=(cx+pan.current.x-camera.position.x)*Math.min(1,dt*5);camera.position.y+=(cy+pan.current.y-camera.position.y)*Math.min(1,dt*4);camera.lookAt(camera.position.x,camera.position.y,0);
    el.dataset.aimGuide='angle-only';el.dataset.fragmentCount=String(s.fragments.length);el.dataset.sideCourse=String(s.courseId);el.dataset.phase=s.phase;el.dataset.characterReady=String(rig.hero.ready);el.dataset.ballX=b.x.toFixed(2);el.dataset.ballY=b.y.toFixed(2);renderer!.render(scene,camera);frame=requestAnimationFrame(draw);
   };frame=requestAnimationFrame(draw);
  }catch{setFailed(true);}
  return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();rig.dispose();assets.dispose();resources.forEach(o=>o.dispose());renderer?.dispose();};
 },[courseId]);
 return <><canvas ref={canvas} className="sg-canvas" aria-label="2D golf course" onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};}} onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;const scale=(overview?388:180)/Math.max(1,e.currentTarget.clientWidth);pan.current.x=Math.max(-220,Math.min(220,pan.current.x-(e.clientX-d.x)*scale));pan.current.y=Math.max(-120,Math.min(120,pan.current.y+(e.clientY-d.y)*scale));d.x=e.clientX;d.y=e.clientY;}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onDoubleClick={()=>{pan.current={x:0,y:0};}}/>{failed&&<div className="sg-error" role="alert">WebGL rendering unavailable. Reload with WebGL enabled.</div>}</>;
}
