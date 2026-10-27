import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {createGolferAssets} from '../gakuro-golf/golferModels';
import {defaultAvatar,type KartAvatar} from '../gakuro-kart/avatar';
import type {BasketView,Unit} from './types';
import {COURT,ROLES,clamp,shotChance} from './rules';
import BasketFallback from './BasketFallback';
const heroes=['elementary-dodgeball','high-school-warrior','magic-akari','elementary-caretaker','magic-mirai','elementary-assassin'];
const preview=Array.from({length:6},(_,i)=>({id:'preview'+i,owner:null,name:'',side:(i<3?0:1) as 0|1,role:(['PG','SF','C'] as const)[i%3],x:[-4,0,3,-3,0,3][i],y:[-.5,-3,3.2,1,1.5,4.4][i],vx:0,vy:0,charging:false,charge:0,motion:'idle' as const,action:0,jump:0,screen:0,dodge:0,catch:0,buff:0,release:0}));
/** The same simulation drives the GPU scene and the fallback; meshes never decide game outcomes. */
export default function BasketCanvas({view,selfId,avatar,suspended=false}:{view:BasketView|null;selfId:string;avatar?:KartAvatar;suspended?:boolean;aim?:number}){
 const canvas=useRef<HTMLCanvasElement>(null),current=useRef({view,selfId,avatar,suspended,at:performance.now()});current.current={view,selfId,avatar,suspended,at:current.current.view===view?current.current.at:performance.now()};
 const[failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=canvas.current!,scene=new T.Scene(),camera=new T.OrthographicCamera(-12,12,10,-10,.1,140),athletes=createGolferAssets();
  const owned:(T.BufferGeometry|T.Material|T.Texture)[]=[],materials=new Map<string,T.MeshStandardMaterial>();
  type Rig={rig:ReturnType<typeof athletes.create>;appearance:string;ring:T.Mesh;shadow:T.Mesh;label:T.Sprite;labelMap:T.CanvasTexture;labelMat:T.SpriteMaterial;lastName:string;};
  const rigs=new Map<string,Rig>();let renderer:T.WebGLRenderer|undefined,observer:ResizeObserver|undefined,frame=0,dead=false;
  const geometry=<G extends T.BufferGeometry>(g:G)=>{owned.push(g);return g;};
  const material=(color:string,roughness=.75)=>{const key=color+roughness;if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,roughness});materials.set(key,m);owned.push(m);}return materials.get(key)!;};
  const cube=geometry(new T.BoxGeometry(1,1,1)),sphere=geometry(new T.SphereGeometry(1,18,12)),ringGeo=geometry(new T.RingGeometry(.62,.72,40)),shadowGeo=geometry(new T.CircleGeometry(.6,24));
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{const mesh=new T.Mesh(cube,material(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);scene.add(mesh);return mesh;};
  const texture=(c:HTMLCanvasElement)=>{const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;owned.push(map);return map;};
  const textBoard=(text:string,width:number,height:number,background:string,color:string)=>{const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,1024,256);ctx.strokeStyle=color;ctx.lineWidth=10;ctx.strokeRect(14,14,996,228);ctx.font='700 66px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,128,930);const mat=new T.MeshBasicMaterial({map:texture(c)});owned.push(mat);const board=new T.Mesh(geometry(new T.PlaneGeometry(width,height)),mat);scene.add(board);return board;};
  const floorTexture=()=>{
   const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d')!;
   for(let row=0;row<32;row++){x.fillStyle=['#c79760','#ce9f68','#d7ad76','#d0a36a'][row%4];x.fillRect(0,row*32,1024,32);x.strokeStyle='#9b724a50';x.lineWidth=1;x.beginPath();x.moveTo(0,row*32);x.lineTo(1024,row*32);x.stroke();for(let col=0;col<6;col++){const px=col*200+(row%2)*100;x.strokeStyle='#a37b5050';x.beginPath();x.moveTo(px,row*32);x.lineTo(px,row*32+32);x.stroke();}for(let grain=0;grain<7;grain++){x.strokeStyle='#eed3a624';x.beginPath();x.moveTo(0,row*32+grain*4);x.lineTo(1024,row*32+grain*4+2);x.stroke();}}
   const px=(v:number)=>(v+COURT.width)/(COURT.width*2)*1024,py=(v:number)=>(COURT.back-v)/(COURT.back-COURT.front)*1024;
   x.fillStyle='#426c6845';x.fillRect(px(-2.5),py(8),px(2.5)-px(-2.5),py(2.4)-py(8));x.strokeStyle='#fff5dc';x.lineWidth=4;x.strokeRect(7,7,1010,1010);
   const path=(points:number[][])=>{x.beginPath();points.forEach(([a,b],i)=>{if(i)x.lineTo(px(a),py(b));else x.moveTo(px(a),py(b));});x.stroke();};
   path([[-2.5,8],[-2.5,2.4],[2.5,2.4],[2.5,8]]);
   for(const[cy,r]of [[COURT.hoopY,COURT.three],[COURT.hoopY,1.25],[2.4,2.5]]){x.beginPath();x.ellipse(px(0),py(cy),r/(COURT.width*2)*1024,r/(COURT.back-COURT.front)*1024,0,0,Math.PI*2);x.stroke();}
   x.fillStyle='#214e5466';x.font='800 27px system-ui';x.textAlign='center';x.fillText('GAKURO ACADEMY',512,py(-5.5));x.font='600 13px system-ui';x.fillText('PLAY  ·  LEARN  ·  TOGETHER',512,py(-6.1));return texture(c);
  };
  const label=(name:string,role:string,color:string)=>{const c=document.createElement('canvas');c.width=384;c.height=80;const ctx=c.getContext('2d')!;ctx.fillStyle='#0c293be0';ctx.beginPath();ctx.roundRect(5,8,374,60,24);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=color;ctx.font='800 22px system-ui';ctx.fillText(role,20,47);ctx.fillStyle='#fff7de';ctx.font='600 22px system-ui';ctx.fillText(name.slice(0,12),70,47,280);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const mat=new T.SpriteMaterial({map,depthWrite:false,transparent:true});const sprite=new T.Sprite(mat);sprite.scale.set(2.5,.52,1);return {sprite,map,mat};};
  const dropRig=(r:Rig)=>{r.rig.dispose();r.labelMap.dispose();r.labelMat.dispose();scene.remove(r.rig.root,r.ring,r.shadow);};
  try{
   renderer=new T.WebGLRenderer({canvas:el,antialias:true});renderer.setPixelRatio(Math.min(1.8,devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
   scene.background=new T.Color('#b0a78f');scene.fog=new T.Fog('#b4a68d',49,85);scene.add(new T.HemisphereLight('#fff4da','#748c8c',2.2));const sun=new T.DirectionalLight('#fff1d7',2.8);sun.position.set(-8,20,13);scene.add(sun);const fill=new T.DirectionalLight('#d3f5fa',1.1);fill.position.set(12,8,-4);scene.add(fill);
   box(0,-.18,0,23,.3,22,'#b18b5c');const floorMat=new T.MeshStandardMaterial({map:floorTexture(),roughness:.48,metalness:.035});owned.push(floorMat);const floor=new T.Mesh(geometry(new T.PlaneGeometry(15,15.5)),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,.01,-.25);scene.add(floor);
   box(0,5,-10.6,32,10,.4,'#e1cf9f');box(0,1.2,-10.35,32,2.4,.25,'#6e8878');box(0,.25,-10.1,32,.5,.3,'#95754a');box(0,8.5,-10.25,32,.15,.25,'#c4b487');
   for(const side of[-1,1]){box(side*10.5,5,-10.15,2.3,9,.4,'#754344');for(let i=0;i<8;i++)box(side*10.5-1+i*.29,5,-9.88,.15,9,.12,i%2?'#99494a':'#8a3f43');box(side*12,5.2,-10.1,.18,9,.25,'#a49069');box(side*9.5,.6,-1,1.1,.2,9,'#416a6e');box(side*9.8,.9,-1,.2,.7,9,'#2e555b');for(const z of[-4,0,3])box(side*9.5,.25,z,.75,.7,.12,'#355b60');
    for(let row=0;row<3;row++){const x=side*(5+row*1.5);box(x,6.7,-10.1,1.25,2.8,.12,'#c4e1db');for(const y of[5.3,6.7,8.1])box(x,y,-10,1.25,.06,.15,'#839b91');box(x,6.7,-10,.055,2.8,.15,'#839b91');}}
   const banner=textBoard('GAKURO  ·  ATHLETICS',9,1.7,'#204b55','#f5dfaa');banner.position.set(0,7.7,-10.29);
   const scoreBoard=textBoard('3 × 3     /     ONE TEAM',5.3,1.1,'#183c48','#f4deb4');scoreBoard.position.set(0,5.4,-10.28);
   for(const side of[-1,1]){const board=textBoard(side<0?'PLAY TOGETHER':'LEARN TOGETHER',3.3,.85,'#f1ddaf','#456e73');board.position.set(side*6.3,3.1,-10.18);}
   const hoopZ=-COURT.hoopY;box(0,1.65,hoopZ-1.2,.17,3.3,.17,'#557a81');box(0,3.5,hoopZ-.68,.17,.15,1.2,'#557a81');
   const boardMat=new T.MeshPhysicalMaterial({color:'#ecf7eb',roughness:.25,transparent:true,opacity:.72,metalness:.05});owned.push(boardMat);const backboard=new T.Mesh(cube,boardMat);backboard.position.set(0,3.95,hoopZ-.65);backboard.scale.set(2.6,1.6,.11);scene.add(backboard);
   for(const x of[-1.3,1.3])box(x,3.95,hoopZ-.55,.045,1.64,.05,'#f7f2da');for(const y of[3.15,4.75])box(0,y,hoopZ-.55,2.62,.045,.05,'#f7f2da');
   for(const x of[-.46,.46])box(x,3.58,hoopZ-.53,.035,.65,.05,'#f7f2da');for(const y of[3.25,3.9])box(0,y,hoopZ-.53,.94,.035,.05,'#f7f2da');
   const hoop=new T.Mesh(geometry(new T.TorusGeometry(.47,.055,10,40)),material('#e5793f',.35));hoop.rotation.x=Math.PI/2;hoop.position.set(0,3.1,hoopZ);scene.add(hoop);
   const netMat=new T.MeshBasicMaterial({color:'#fff9df',wireframe:true,transparent:true,opacity:.7});owned.push(netMat);const net=new T.Mesh(geometry(new T.CylinderGeometry(.45,.27,.6,14,3,true)),netMat);net.position.set(0,2.8,hoopZ);scene.add(net);
   const ball=new T.Mesh(sphere,material('#db7634',.55));ball.scale.setScalar(.25);scene.add(ball);const seamMat=material('#663b2a');for(const rot of[0,Math.PI/2]){const seam=new T.Mesh(geometry(new T.TorusGeometry(1.005,.035,5,28)),seamMat);seam.rotation.y=rot;ball.add(seam);}
   const ballShadowMat=new T.MeshBasicMaterial({color:'#333b35',transparent:true,opacity:.23,depthWrite:false});owned.push(ballShadowMat);const ballShadow=new T.Mesh(shadowGeo,ballShadowMat);ballShadow.rotation.x=-Math.PI/2;ballShadow.scale.setScalar(.45);scene.add(ballShadow);
   const markerMat=new T.MeshBasicMaterial({color:'#ffe87b',side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false});owned.push(markerMat);const target=new T.Mesh(geometry(new T.RingGeometry(.7,.85,40)),markerMat);target.rotation.x=-Math.PI/2;scene.add(target);
   const reboundMat=new T.MeshBasicMaterial({color:'#9af5ee',side:T.DoubleSide,transparent:true,opacity:.5,depthWrite:false});owned.push(reboundMat);const reboundTarget=new T.Mesh(ringGeo,reboundMat);reboundTarget.rotation.x=-Math.PI/2;scene.add(reboundTarget);
   const arrow=new T.Mesh(geometry(new T.ConeGeometry(.28,.55,3)),new T.MeshBasicMaterial({color:'#55e9ed',depthWrite:false}));owned.push(arrow.material as T.Material);arrow.rotation.z=Math.PI;scene.add(arrow);
   const fanMat=new T.MeshBasicMaterial({color:'#72e2b5',side:T.DoubleSide,transparent:true,opacity:.22,depthWrite:false});owned.push(fanMat);const fanGeo=geometry(new T.BufferGeometry().setFromPoints([new T.Vector3(0,.05,0),new T.Vector3(-1.1,.05,2.4),new T.Vector3(1.1,.05,2.4)]));fanGeo.computeVertexNormals();const fan=new T.Mesh(fanGeo,fanMat);scene.add(fan);
   const trailGeo=geometry(new T.BufferGeometry()),trailPos=new T.Float32BufferAttribute(new Float32Array(36),3),trailMat=new T.LineBasicMaterial({color:'#ffe3a1',transparent:true,opacity:.7});trailGeo.setAttribute('position',trailPos);trailGeo.setDrawRange(0,0);owned.push(trailMat);const trail=new T.Line(trailGeo,trailMat);trail.frustumCulled=false;scene.add(trail);
   const resize=()=>{if(!renderer)return;const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight),a=w/h,portrait=a<.85,short=w>h&&h<600,height=portrait?17.6/a:short?16.5:15;
    renderer.setSize(w,h,false);camera.left=-height*a/2;camera.right=height*a/2;camera.top=height*(portrait?.43:short?.58:.5);camera.bottom=-height*(portrait?.57:short?.42:.5);camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(el);resize();let last=performance.now();const cameraFocus=new T.Vector3(0,.6,-.8);
   const render=(now:number)=>{
    if(dead)return;frame=requestAnimationFrame(render);const state=current.current;if(state.suspended||document.hidden){last=now;return;}if(now-last<(el.clientWidth<680?1000/30:1000/60)-1)return;
    const dt=Math.min(.06,(now-last)/1000);last=now;const m=state.view?.match,own=m?.units.find(u=>u.owner===state.selfId),lead=m?.phase==='play'&&!state.view?.paused?Math.min(.06,(now-state.at)/1000):0;
    cameraFocus.lerp(new T.Vector3((own?.x||0)*.08,.6,-.8-(own?.y||0)*.025),1-Math.exp(-dt*4));camera.position.set(cameraFocus.x,17,24);camera.lookAt(cameraFocus);
    const units:Partial<Unit>[]=m?.units||preview.map((u,i)=>({...u,avatar:i===0&&state.avatar?state.avatar:{...defaultAvatar(i),protagonist:heroes[i]}}));
    const ids=new Set(units.map(u=>u.id));for(const[id,r]of rigs)if(!ids.has(id)){dropRig(r);rigs.delete(id);}
    for(const[i,u]of units.entries()){
     const appearance=u.avatar||{...defaultAvatar(i),protagonist:heroes[i%6]},key=JSON.stringify(appearance),isOwn=u.owner===state.selfId,color=isOwn?'#70eff2':u.side===0?'#6ad5f0':'#ff9f7e';let r=rigs.get(u.id!);
     if(!r){const rig=athletes.create(appearance,true,'basketball');rig.root.scale.setScalar(1.04);const ringMat=new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:.9});owned.push(ringMat);const ring=new T.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;const shadowMat=new T.MeshBasicMaterial({color:'#243a3a',transparent:true,opacity:.23,depthWrite:false});owned.push(shadowMat);const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;const l=label(u.name||'',u.role||'SF',color);rig.root.add(l.sprite);l.sprite.position.y=2.5;l.sprite.visible=!!u.name;rig.root.position.set(u.x||0,0,-(u.y||0));scene.add(rig.root,ring,shadow);r={rig,appearance:key,ring,shadow,label:l.sprite,labelMap:l.map,labelMat:l.mat,lastName:u.name||''};rigs.set(u.id!,r);}
     if(r.appearance!==key){r.appearance=key;r.rig.update(appearance);}const moving=Math.hypot(u.vx||0,u.vy||0)>.15,held=m?.ball.holder===u.id,action=u.action||0,motion=u.motion||'idle',charging=!!u.charging;
     r.rig.animateHero(dt,action,moving);const up=['shot','dunk','block','rebound'].includes(motion),raise=up?-2.65:motion==='pass'?-1.45:motion==='steal'?-1.25:motion==='screen'?-.25:charging?-1.7:held?-.85:-.6,spread=motion==='screen'?1.0:motion==='block'?.7:.42;
     for(const side of['L','R']){r.rig.hero.pose('upper_arm.'+side,raise,side==='L'?spread:-spread);r.rig.hero.pose('forearm.'+side,up?-.2:motion==='pass'?-.15:-.7);}r.rig.hero.pose('spine',motion==='drive'?.38:charging?-.1:moving?.15:.08,motion==='pass'?action*.6:0);
     if(!moving){r.rig.hero.pose('thigh.L',charging?-.35:-.14,.1);r.rig.hero.pose('thigh.R',charging?-.35:-.14,-.1);r.rig.hero.pose('shin.L',charging?.55:.3);r.rig.hero.pose('shin.R',charging?.55:.3);}
     r.rig.leftArm.rotation.set(raise,0,spread*.7);r.rig.rightArm.rotation.set(held&&!charging?-.85+Math.sin(now/100)*.35:raise,0,-spread*.7);r.rig.club.visible=false;
     const follow=1-Math.exp(-dt*24);r.rig.root.position.x+=((u.x||0)+(u.vx||0)*lead*.3-r.rig.root.position.x)*follow;r.rig.root.position.z+=(-(u.y||0)-(u.vy||0)*lead*.3-r.rig.root.position.z)*follow;
     const jumping=(u.jump||0)>0?Math.sin((.68-(u.jump||0))/.68*Math.PI)*(motion==='dunk'?1.45:1.1):0;r.rig.root.position.y=Math.max(0,jumping);
     const holder=m?.units.find(v=>v.id===m.ball.holder),look=motion==='pass'&&m?.ball.flight?{x:m.ball.vx,y:m.ball.vy}:moving?{x:u.vx||0,y:u.vy||0}:holder&&holder.side!==u.side?{x:holder.x-(u.x||0),y:holder.y-(u.y||0)}:{x:-(u.x||0),y:COURT.hoopY-(u.y||0)};
     r.rig.root.rotation.y=Math.atan2(look.x,-look.y);r.ring.position.set(r.rig.root.position.x,.055,r.rig.root.position.z);r.ring.scale.setScalar(isOwn?1.12:u.buff?1.15:1);(r.ring.material as T.MeshBasicMaterial).color.set(u.buff?'#e6c6ff':color);r.shadow.position.set(r.rig.root.position.x,.035,r.rig.root.position.z);r.shadow.scale.setScalar(1-jumping*.12);
    }
    if(m){const b=m.ball,holder=rigs.get(b.holder||'');if(holder){const unit=m.units.find(u=>u.id===b.holder)!;ball.position.set(holder.rig.root.position.x+.32,unit.charging?1.7+unit.charge*.3:.35+Math.abs(Math.sin((state.view!.clock+lead)*11))*.95,holder.rig.root.position.z+.13);}else ball.position.set(b.x+b.vx*lead,Math.max(.22,b.z+b.vz*lead-4.9*lead*lead),-b.y-b.vy*lead);
     ball.visible=true;trail.visible=!!b.flight;const n=Math.min(12,b.trail.length);for(let i=0;i<n;i++)trailPos.setXYZ(i,b.trail[i][0],b.trail[i][2],-b.trail[i][1]);trailPos.needsUpdate=true;trailGeo.setDrawRange(0,n);trailMat.color.set(b.special?'#dbadff':'#ffe09c');
     const falling=Math.max(0,(b.vz+Math.sqrt(Math.max(0,b.vz*b.vz+19.6*Math.max(0,b.z-.24))))/9.8);reboundTarget.visible=!b.holder&&(!b.flight||!b.pass&&b.age>b.lock*.65)&&m.inbound===0;reboundTarget.position.set(clamp(b.x+b.vx*falling,-7,7),.06,-clamp(b.y+b.vy*falling,-7,7.5));
    }else{ball.position.set(-2,1.1,1);trail.visible=false;reboundTarget.visible=false;}
    ball.rotation.x=now/400;ball.rotation.z=now/650;ballShadow.position.set(ball.position.x,.04,ball.position.z);ballShadow.scale.setScalar(.45+ball.position.y*.05);
    arrow.visible=!!own;if(own){const rig=rigs.get(own.id)!;arrow.position.set(rig.rig.root.position.x,3.35+rig.rig.root.position.y,rig.rig.root.position.z);fan.visible=m?.ball.holder===own.id&&!m.mustClear&&!own.charging;fan.position.set(own.x,.05,-own.y);fan.rotation.y=Math.atan2(-own.x,-(COURT.hoopY-own.y));fanMat.color.set(m&&shotChance(m,own,.75)>.72?'#68e7b5':'#efb568');}else fan.visible=false;
    const tutorial=m?.tutorial;target.visible=!!tutorial&&['move','shoot','steal'].includes(tutorial.stage)||!!m?.mustClear&&!!own&&m.possession===own.side;
    if(tutorial&&own){target.position.set(tutorial.stage==='move'?tutorial.startX+2.3:tutorial.stage==='shoot'?0:m!.ball.x,.08,-(tutorial.stage==='move'?tutorial.startY:tutorial.stage==='shoot'?COURT.hoopY-2.3:m!.ball.y));}
    else if(m?.mustClear&&own){const d=Math.max(.1,Math.hypot(own.x,own.y-COURT.hoopY));target.position.set(clamp(own.x/d*(COURT.clear+.5),-7,7),.08,-clamp(COURT.hoopY+(own.y-COURT.hoopY)/d*(COURT.clear+.5),-7,7));}
    renderer!.render(scene,camera);el.dataset.players=String(units.length);el.dataset.models=String([...rigs.values()].filter(r=>r.rig.root.userData.protagonistReady).length);el.dataset.custom=String([...rigs.values()].filter(r=>!r.rig.root.userData.protagonistReady).length);el.dataset.court='half';
   };frame=requestAnimationFrame(render);
  }catch{setFailed(true);}
  const lost=(event:Event)=>{event.preventDefault();dead=true;cancelAnimationFrame(frame);setFailed(true);};el.addEventListener('webglcontextlost',lost);
  return()=>{dead=true;cancelAnimationFrame(frame);observer?.disconnect();el.removeEventListener('webglcontextlost',lost);for(const r of rigs.values())dropRig(r);athletes.dispose();owned.forEach(o=>o.dispose());renderer?.dispose();};
 },[]);
 return <div className="bk-canvas">{failed?<BasketFallback view={view} selfId={selfId} avatar={avatar}/>:<canvas ref={canvas} aria-label="Basketball court 3D" data-testid="basketball-court"/>}</div>;
}
