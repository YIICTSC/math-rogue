import * as T from 'three';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import {assetUrl}from'../../utils/assetPaths';
import {ProtagonistModel}from'../../three/protagonistModel';
import {defaultAvatar,type KartAvatar}from'../gakuro-kart/avatar';
import {type Athlete,type Motion,type Vec}from'./core';
import {type Match}from'./engine';
import {groundHeight}from'./festival';
const COLORS=['#34b9af','#e8a256','#b9c865','#dc7d90'];
const VENUES={baseball:'baseball-stadium',soccer:'soccer-stadium',volleyball:'volleyball-gym'};
const FESTIVAL=['festival-campus','festival-rooms','festival-target','festival-roof','festival-awards'];
type Rig={hero:ProtagonistModel;root:T.Group;marker:T.Mesh;shadow:T.Mesh;equipment:T.Object3D[];look:string;kit:boolean;};
export interface RenderStatus {ready:boolean;players:number;total:number;failed:boolean;drawCalls:number;triangles:number;}
/** Existing skinned protagonists, dedicated Blender venues, and procedural sport-specific bone poses. */
export function createAcademyRenderer(canvas:HTMLCanvasElement,onStatus:(status:RenderStatus)=>void){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.08,350),loader=new GLTFLoader();
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
 const owned=new Set<T.BufferGeometry|T.Material|T.Texture>(),bank=new Map<string,T.Object3D>(),rigs=new Map<number,Rig>(),props=new Map<string,T.Object3D>();
 const environment=new T.Group(),dynamic=new T.Group();scene.add(environment,dynamic);let disposed=false,venue='',venueReady=false,kitReady=false,failed=false,request=0,lastStatus='',lastSize='',lastAt=0,draws=0,visualClock=0,avatar:KartAvatar|undefined;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const own=<X extends T.BufferGeometry|T.Material|T.Texture>(r:X)=>{owned.add(r);return r;};
 const material=(color:string,transparent=false)=>own(new T.MeshStandardMaterial({color,roughness:.65,transparent,opacity:transparent?.38:1}));
 const sky=document.createElement('canvas');sky.width=2;sky.height=256;const ctx=sky.getContext('2d')!,gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#2d6479');gradient.addColorStop(.65,'#b6d6ce');gradient.addColorStop(1,'#f9e8b6');ctx.fillStyle=gradient;ctx.fillRect(0,0,2,256);scene.background=own(new T.CanvasTexture(sky));scene.fog=new T.Fog('#bbd6cf',95,245);
 const night=document.createElement('canvas');night.width=2;night.height=256;const nx=night.getContext('2d')!,ng=nx.createLinearGradient(0,0,0,256);ng.addColorStop(0,'#061327');ng.addColorStop(1,'#38536d');nx.fillStyle=ng;nx.fillRect(0,0,2,256);const nightSky=own(new T.CanvasTexture(night));const daySky=scene.background;
 const hemi=new T.HemisphereLight('#fff6dc','#547a73',2.2),sun=new T.DirectionalLight('#fff4da',3.2);sun.position.set(-20,40,30);scene.add(hemi,sun);const fill=new T.DirectionalLight('#a8d9e6',.8);fill.position.set(20,15,-10);scene.add(fill);
 const ringGeo=own(new T.RingGeometry(.47,.59,28)),shadowGeo=own(new T.CircleGeometry(.48,24));const shadowMat=own(new T.MeshBasicMaterial({color:'#153c39',transparent:true,opacity:.25,depthWrite:false}));
 const cursor=new T.Mesh(ringGeo,own(new T.MeshBasicMaterial({color:'#ffe5a0',side:T.DoubleSide,depthTest:false,transparent:true,opacity:.9})));scene.add(cursor);cursor.renderOrder=20;
 const ballRoot=new T.Group();dynamic.add(ballRoot);let ballVisual:T.Object3D|undefined,ballKind='';
 const trailGeo=own(new T.BufferGeometry()),trailPositions=new Float32Array(24*3),trailHistory:T.Vector3[]=[];trailGeo.setAttribute('position',new T.BufferAttribute(trailPositions,3));const trail=new T.Points(trailGeo,own(new T.PointsMaterial({color:'#ffe7a0',size:.16,transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending})));scene.add(trail);
 const ballShadow=new T.Mesh(shadowGeo,shadowMat);ballShadow.rotation.x=-Math.PI/2;ballShadow.scale.setScalar(.35);scene.add(ballShadow);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=1024;labelCanvas.height=256;const labelCtx=labelCanvas.getContext('2d')!,labelMap=own(new T.CanvasTexture(labelCanvas)),labelMat=own(new T.SpriteMaterial({map:labelMap,transparent:true,depthWrite:false})),board=new T.Sprite(labelMat);board.scale.set(15,3.75,1);scene.add(board);let boardText='';
 const nets:T.LineSegments[]=[];
 function collect(object:T.Object3D){object.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){own(o.geometry);for(const m of[ o.material].flat()){own(m);for(const v of Object.values(m))if(v instanceof T.Texture)own(v);}}});}
 function clone(name:string,color?:string){const template=bank.get(name);if(!template)return new T.Group();const result=template.clone(true);result.traverse(o=>{if(o instanceof T.Mesh&&color){o.material=Array.isArray(o.material)?o.material.map(m=>{const c=m.clone();if(m.name==='TeamCloth')(c as T.MeshStandardMaterial).color.set(color);own(c);return c;}):(()=>{const c=o.material.clone();if(o.material.name==='TeamCloth')(c as T.MeshStandardMaterial).color.set(color);own(c);return c;})();}});return result;}
 loader.load(assetUrl('models/academy-sports/equipment.glb'),g=>{collect(g.scene);if(disposed){owned.forEach(o=>o.dispose());return;}for(const name of['Baseball','SoccerBall','VolleyBall','Bat','Glove','Helmet','CatcherGear','BaseballJersey','SoccerJersey','VolleyJersey','FestivalJersey','KneePad','Hurdle','MovingGate','FloorTile','RollingBall','Target','Trophy','Boost','Medkit','ThrowBall','ShockStar']){const o=g.scene.getObjectByName(name);if(o)bank.set(name,o);}kitReady=true;},undefined,()=>{failed=true;});
 function releaseObject(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){o.geometry.dispose();owned.delete(o.geometry);for(const m of[o.material].flat()){m.dispose();owned.delete(m);}}});}
 function loadVenue(name:string){if(venue===name)return;venue=name;venueReady=false;const token=++request;for(const child of [...environment.children])releaseObject(child);environment.clear();nets.length=0;
  loader.load(assetUrl(`models/academy-sports/${name}.glb`),g=>{collect(g.scene);if(disposed||token!==request){releaseObject(g.scene);return;}environment.add(g.scene);venueReady=true;
   if(name==='soccer-stadium')for(const sign of[-1,1]){const positions:number[]=[];for(let i=0;i<=28;i++){const x=-4.2+i*.3;positions.push(x,0,sign*35,x,2.2,sign*35,x,2.2,sign*35,x,2.8,sign*33);}for(let i=0;i<=8;i++){const y=i*.275;positions.push(-4.2,y,sign*35,4.2,y,sign*35);}const geometry=own(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));const mesh=new T.LineSegments(geometry,own(new T.LineBasicMaterial({color:'#f7f5d7',transparent:true,opacity:.6})));mesh.userData.sign=sign;mesh.userData.original=new Float32Array(positions);environment.add(mesh);nets.push(mesh);}
  },undefined,()=>{failed=true;});
 }
 function prop(key:string,name:string,color?:string){let o=props.get(key);if(!o){o=clone(name,color);props.set(key,o);dynamic.add(o);}o.visible=true;return o;}
 function setupRig(p:Athlete,s:Match){const hero=new ProtagonistModel(),root=new T.Group();root.add(hero.root);scene.add(root);root.userData.athlete=p.id;hero.root.scale.setScalar(1.3);
  const marker=new T.Mesh(ringGeo,own(new T.MeshBasicMaterial({color:COLORS[p.team],side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false})));marker.rotation.x=-Math.PI/2;scene.add(marker);const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const rig:Rig={hero,root,marker,shadow,equipment:[],look:'',kit:false};rigs.set(p.id,rig);return rig;
 }
 function attach(r:Rig,s:Match,p:Athlete){if(r.kit||!r.hero.ready||!kitReady)return;const bone=(name:string)=>r.hero.root.getObjectByName(T.PropertyBinding.sanitizeNodeName(name));const color=COLORS[p.team];const add=(name:string,parent:T.Object3D|undefined,position:number[],scale=1)=>{if(!parent)return;const o=clone(name,color);o.position.fromArray(position);o.scale.setScalar(scale);parent.add(o);r.equipment.push(o);return o;};
  const jersey=s.sport==='baseball'?'BaseballJersey':s.sport==='soccer'?'SoccerJersey':s.sport==='volleyball'?'VolleyJersey':'FestivalJersey';add(jersey,bone('spine'),[0,.075,0]);
  if(s.sport==='baseball'){const glove=add('Glove',bone('forearm.L'),[0,.24,.06]);if(glove)glove.userData.glove=true;const bat=add('Bat',bone('forearm.R'),[0,.24,.05]);if(bat){bat.rotation.z=.2;bat.userData.bat=true;}const helmet=add('Helmet',bone('head'),[0,.53,0],.9);if(helmet)helmet.userData.helmet=true;if(p.role==='C')add('CatcherGear',bone('spine'),[0,.07,.20]);}
  if(s.sport==='volleyball')for(const side of['L','R'])add('KneePad',bone('shin.'+side),[0,.03,.01]);r.kit=true;
 }
 function animate(r:Rig,p:Athlete,motion:Motion,action:number,dt:number){r.hero.update(dt,motion==='run'?'Walk':motion==='jump'?'Jump':motion==='idle'?'Idle':'Attack',reduced);const wave=Math.sin(Math.min(1,action/.6)*Math.PI),pose=(bone:string,x:number,z=0)=>r.hero.pose(bone,x,z);
  if(['swing','kick','punch','throw','pitch'].includes(motion)){pose('spine',motion==='swing'?.1:.17,motion==='swing'?Math.sin(action*9)*.7:0);pose('upper_arm.R',motion==='pitch'?-1.8+wave*2:motion==='throw'?-1.4+wave:motion==='swing'?-1.1:-.5,motion==='swing'?-.55:0);pose('forearm.R',-.6-wave*.6);pose('upper_arm.L',motion==='swing'?-1.2:-.4,motion==='swing'?.5:0);if(motion==='kick')pose('thigh.R',-1.4*wave);}
  if(['serve','spike','set','block','catch'].includes(motion)){const angle=motion==='set'||motion==='block'?-2.8:motion==='spike'?-2.8+wave*1.8:motion==='serve'?-1.8+wave:-1.5;pose('upper_arm.L',motion==='spike'?-.4:angle,.18);pose('upper_arm.R',angle,-.18);pose('forearm.L',motion==='block'?-.1:-.65);pose('forearm.R',motion==='block'?-.1:-.6);}
  if(motion==='receive'){pose('spine',.35);pose('upper_arm.L',-1.1,.2);pose('upper_arm.R',-1.1,-.2);pose('forearm.L',-.1);pose('forearm.R',-.1);pose('thigh.L',-.45);pose('thigh.R',-.45);}
  if(motion==='tackle'||motion==='hurt'){pose('spine',motion==='hurt'?-.6:.7);pose('thigh.R',-1);pose('shin.R',.5);}
  if(motion==='guard'){pose('upper_arm.L',-1.5,.4);pose('upper_arm.R',-1.5,-.4);pose('forearm.L',-1.4);pose('forearm.R',-1.4);}
  if(motion==='celebrate'){pose('upper_arm.L',-2.8,.3);pose('upper_arm.R',-2.8,-.3);pose('spine',0,reduced?0:Math.sin(performance.now()*.004)*.08);}
 }
 function draw(s:Match,dt:number,playerAvatar?:KartAvatar){if(disposed)return;avatar=playerAvatar;const w=canvas.clientWidth||800,h=canvas.clientHeight||500,size=w+':'+h;if(size!==lastSize){lastSize=size;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const venueName=s.sport==='festival'?FESTIVAL[s.phase==='finished'?4:s.contest]:VENUES[s.sport];loadVenue(venueName);
  const now=performance.now();if(lastAt&&now-lastAt>35&&++draws>120){renderer.setPixelRatio(1);draws=0;}lastAt=now;
  for(const o of props.values())o.visible=false;
  const preview=s.phase==='ready',replaying=s.phase==='replay'&&s.replay.length>1;const frame=replaying?s.replay[Math.min(s.replay.length-1,Math.floor(s.replayTime*15*.65))]:undefined;
  visualClock+=dt;let ready=0,total=0;
  const active=s.sport==='festival'?s.players.filter(p=>s.active.includes(p.id)):s.players;
  for(const p of s.players){let r=rigs.get(p.id);if(!active.includes(p)&&s.phase!=='finished'){if(r){r.root.visible=false;r.marker.visible=false;r.shadow.visible=false;}continue;}total++;
   if(!r)r=setupRig(p,s);const look=JSON.stringify([p.hero,p.team,s.sport,p.id===s.config.team*100?avatar:undefined]);if(look!==r.look){r.look=look;r.kit=false;for(const equipment of r.equipment){equipment.traverse(o=>{if(o instanceof T.Mesh)for(const m of[o.material].flat()){m.dispose();owned.delete(m);}});equipment.removeFromParent();}r.equipment=[];const base=p.id===s.config.team*100&&avatar?{...avatar,protagonist:p.hero,wardrobe:'sport' as const,originalColors:false,outfit:p.team,bottom:7}:{...defaultAvatar(p.team),protagonist:p.hero,wardrobe:'sport' as const,originalColors:false,bottom:7};void r.hero.setAvatar(base,s.sport==='baseball'?'golf':s.sport==='volleyball'?'basketball':'dodgeball');}
   attach(r,s,p);if(r.hero.root.userData.failed)failed=true;if(r.hero.ready)ready++;const recorded=frame?.players.find(q=>q.id===p.id),position=recorded?.p??p.p,motion=recorded?.motion??p.motion,face=recorded?.face??p.face;let x=position.x,y=position.y,z=position.z;
   if(s.sport==='festival'&&s.phase==='finished'){const order=[0,1,2,3].sort((a,b)=>s.score[b]-s.score[a]);const rank=order.indexOf(p.team);x=rank===0?-3:rank===1?0:rank===2?3:6;y=rank===0?1.3:rank===1?.8:rank===2?.5:0;z=p.slot?2:0;}
   r.root.visible=r.hero.ready;r.root.position.set(x,y,z);r.root.rotation.y=face;r.root.scale.setScalar(.92+p.skills.jump*.1);r.marker.visible=r.hero.ready&&s.phase!=='finished';r.marker.position.set(x,.12+(s.sport==='festival'?groundHeight(s,x,z):s.sport==='baseball'&&Math.hypot(x,z)<1.5?.12:0),z);r.marker.scale.setScalar(p.id===s.selected?1.4:1);r.shadow.visible=r.hero.ready;r.shadow.position.set(x,.095+(s.sport==='festival'?groundHeight(s,x,z):s.sport==='baseball'&&Math.hypot(x,z)<1.5?.12:0),z);r.shadow.scale.setScalar(Math.max(.5,1-y*.04));
   animate(r,p,s.phase==='finished'&&p.team===s.winner?'celebrate':motion,recorded?.action??p.action,dt);for(const eq of r.equipment){if(eq.userData.bat)eq.visible=s.sport==='baseball'&&p.id===s.bat;if(eq.userData.glove)eq.visible=s.sport==='baseball'&&p.team!==s.half;if(eq.userData.helmet)eq.visible=s.sport==='baseball'&&p.team===s.half;}
  }
  if(s.sport!=='festival'&&kitReady){const kind=s.sport==='baseball'?'Baseball':s.sport==='soccer'?'SoccerBall':'VolleyBall';if(kind!==ballKind){ballRoot.clear();ballVisual=clone(kind);ballRoot.add(ballVisual);ballKind=kind;}const b=frame?.ball??s.ball;ballRoot.visible=true;ballRoot.position.set(b.x,b.y,b.z);if(ballVisual){ballVisual.rotation.x+=dt*s.ball.vz*2;ballVisual.rotation.z-=dt*s.ball.vx*2;}ballShadow.visible=true;ballShadow.position.set(b.x,.085,b.z);ballShadow.scale.setScalar(Math.max(.12,.45-b.y*.02));}
  else {ballRoot.visible=false;ballShadow.visible=false;}
  const point=frame?.ball??s.ball;trail.visible=!reduced&&s.sport!=='festival'&&s.ball.owner<0&&Math.hypot(s.ball.vx,s.ball.vz)>6;if(trail.visible){trailHistory.unshift(new T.Vector3(point.x,point.y,point.z));if(trailHistory.length>24)trailHistory.pop();for(let i=0;i<24;i++){const p=trailHistory[Math.min(i,trailHistory.length-1)];trailPositions[i*3]=p.x;trailPositions[i*3+1]=p.y;trailPositions[i*3+2]=p.z;}trailGeo.attributes.position.needsUpdate=true;trailGeo.computeBoundingSphere();}else trailHistory.length=0;
  cursor.visible=false;
  if(s.sport==='baseball'&&['pitch','set','meter','windup'].includes(s.stage)){cursor.visible=true;cursor.rotation.set(0,0,0);cursor.scale.setScalar(.7);const aim=s.half===s.config.team?s.aim:s.pitchAim;cursor.position.set(aim.x,aim.y,18.12);}
  if(s.sport==='volleyball'&&s.stage==='rally'){cursor.visible=true;cursor.rotation.x=-Math.PI/2;cursor.scale.setScalar(.85);cursor.position.set(s.landing.x,.1,s.landing.z);}
  if(s.sport==='soccer')for(const net of nets){const a=net.geometry.attributes.position as T.BufferAttribute,source=net.userData.original as Float32Array,sign=net.userData.sign as number,goalSign=Math.sign(s.replay.at(-1)?.ball.z??1),deform=s.goalFlash>0&&sign===goalSign&&!reduced?Math.sin(s.clock*18)*.16:0;for(let i=0;i<a.count;i++)a.setZ(i,source[i*3+2]+deform*Math.sin(source[i*3]*2));a.needsUpdate=true;}
  if(s.sport==='festival'&&kitReady){
   if(s.contest===2&&s.phase!=='finished')for(let i=0;i<8;i++){const platform=environment.getObjectByName('TargetPlatform'+i);if(platform)platform.position.y=i%2?Math.sin(s.clock*1.3+i)*.45:0;}
   if(s.contest<2&&s.phase!=='finished'){
    for(const o of s.obstacles){const mesh=prop('obstacle-'+s.contest+'-'+o.id,o.kind==='hurdle'?'Hurdle':o.kind==='rolling'?'RollingBall':o.kind==='spring'||o.kind==='platform'?'FloorTile':'MovingGate',o.kind==='gap'?'#102b38':o.kind==='ice'?'#91d4e1':undefined);mesh.position.set(o.kind==='moving'||o.kind==='rolling'?Math.sin(s.clock*(o.kind==='rolling'?2:1.5)+o.id)*3:o.x,0,o.z);const base=groundHeight(s,mesh.position.x,o.z);mesh.position.y=base;mesh.scale.set(1,1,1);if(['moving','wall','crusher','switch'].includes(o.kind))mesh.scale.set(o.width/7,o.height/2.8,o.depth/.5);if(o.kind==='hurdle')mesh.scale.set(o.width/2.2,o.height/1.3,1);if(o.kind==='rolling'){mesh.scale.setScalar(o.height/2);mesh.position.y=base+o.height/2;}
     if(o.kind==='gap'){mesh.position.y=base+.08;mesh.scale.set(o.width/7,.025,o.depth*2);}else if(o.kind==='ice'){mesh.position.y=base+.08;mesh.scale.set(o.width/7,.025,o.depth*2);}else if(o.kind==='platform'){mesh.position.y=base+o.height/2+Math.sin(s.clock*1.5)*.15;mesh.scale.set(o.width/3,o.height/.24,o.depth/2);}if(o.kind==='gap'||o.kind==='ice')mesh.traverse(child=>{if(child instanceof T.Mesh)for(const mat of[child.material].flat())(mat as T.MeshStandardMaterial).color.set(o.kind==='gap'?'#102b38':'#91d4e1');});else if(o.kind==='crusher')mesh.scale.y=Math.max(.2,1.4+Math.sin(s.clock*2)*1.8)/2.8;else if(o.kind==='switch'){mesh.scale.set(.2,.3,.4);const gate=prop('door-'+o.id,'MovingGate');gate.position.set(0,base+.07,o.z-1);gate.scale.x=11/7;gate.visible=!s.doors[s.config.team][o.room];}
    }
   }
   if(s.contest===2&&s.phase!=='finished')for(let t=0;t<4;t++){const target=prop('target-'+t,'Target',COLORS[t]);target.position.set(Math.sin(t*Math.PI/2)*.9,7.3,Math.cos(t*Math.PI/2)*.9);target.scale.setScalar(.6+s.targetHP[t]/180);target.visible=s.targetHP[t]>0;}
   if(s.phase!=='finished')for(const i of s.items){const o=prop('item-'+i.id,i.kind==='boost'?'Boost':i.kind==='heal'?'Medkit':'ThrowBall');o.position.set(i.x,.6+Math.sin(s.clock*3+i.id)*.12,i.z);o.rotation.y=s.clock;o.visible=!i.taken;}
   for(let i=0;i<s.projectiles.length;i++){const ball=s.projectiles[i],o=prop('thrown-'+i,'ThrowBall');o.position.set(ball.p.x,ball.p.y,ball.p.z);}
   if(s.phase==='finished'){const trophy=prop('trophy','Trophy');trophy.position.set(-3,2,0);trophy.rotation.y=reduced?0:visualClock*.5;for(let i=0;i<30;i++){const star=prop('confetti-'+i,'ShockStar');star.scale.setScalar(.3);star.position.set(Math.sin(i*2.4)*8,2+(i*.3+visualClock*.8)%6,Math.cos(i*2.4)*5);star.rotation.set(i,visualClock,i*.4);}}
  }
  const lastEvent=s.events.at(-1);if(lastEvent&&s.clock-lastEvent.at<.8&&kitReady&&!reduced)for(let i=0;i<7;i++){const star=prop('fx-'+i,'ShockStar');const actor=s.players.find(p=>p.id===lastEvent.actor),p=actor?.p??point,age=s.clock-lastEvent.at;star.position.set(p.x+Math.sin(i*2.4)*age*2,p.y+1+age*2,p.z+Math.cos(i*2.4)*age*2);star.scale.setScalar(.25*(1-age));star.rotation.y=age*4;}
  const targetPosition=new T.Vector3(),look=new T.Vector3();let fov=48;
  if(s.sport==='baseball'){
   if(['set','meter','windup','pitch'].includes(s.stage)){const batting=s.half===s.config.team;targetPosition.set(batting?0:.1,batting?4.4:4.8,batting?21.8:-10);look.set(0,1.1,batting?14:17);fov=batting?50:56;}
   else {targetPosition.set(point.x*.25+18,29,point.z*.2+35);look.set(point.x*.35,0,point.z*.45);fov=58;}
  }else if(s.sport==='soccer'){
   targetPosition.set(point.x*.35,33,point.z*.6+32);look.set(point.x*.35,0,point.z*.6);fov=55;
   if(s.cinema>0&&s.pendingShot&&!reduced){const p=s.players.find(p=>p.id===s.pendingShot!.actor)!;targetPosition.set(p.p.x+4,3.5,p.p.z+5);look.set(p.p.x,1.4,p.p.z);fov=43;}
  }else if(s.sport==='volleyball'){targetPosition.set(9,16,24);look.set(0,1.5,0);fov=44;}
  else if(s.phase==='finished'){targetPosition.set(9,8,17);look.set(0,1.4,0);fov=45;}
  else if(s.contest<2){const p=s.players.find(p=>p.id===s.selected)!;targetPosition.set(p.p.x*.4,7+p.p.y,p.p.z+13);look.set(p.p.x*.4,1,p.p.z-6);fov=56;}
  else {targetPosition.set(0,s.contest===2?17:21,25);look.set(0,s.contest===2?3:0,0);fov=48;}
  if(camera.aspect<1)fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(fov/2))/Math.max(.55,camera.aspect)));
  camera.fov=Math.min(100,fov);camera.updateProjectionMatrix();const smooth=reduced?1:Math.min(1,(dt||.05)*7);if(draws===0&&camera.position.length()===0)camera.position.copy(targetPosition);else camera.position.lerp(targetPosition,smooth);camera.lookAt(look);
  if(s.config.night){scene.background=nightSky;(scene.fog as T.Fog).color.set('#243d58');hemi.intensity=1.1;sun.intensity=2.1;}else{scene.background=daySky;(scene.fog as T.Fog).color.set('#bbd6cf');hemi.intensity=2.2;sun.intensity=3.2;}
  const text=s.score.map((n,i)=>`TEAM ${i+1}  ${n}`).join('     ');if(boardText!==text){boardText=text;labelCtx.clearRect(0,0,1024,256);labelCtx.fillStyle='#113c4dec';labelCtx.fillRect(0,0,1024,256);labelCtx.fillStyle='#ffebae';labelCtx.font='bold 70px system-ui';labelCtx.textAlign='center';labelCtx.fillText(text,512,150,980);labelMap.needsUpdate=true;}
  board.visible=s.sport!=='festival';board.position.set(0,s.sport==='baseball'?8:s.sport==='soccer'?9:5,s.sport==='baseball'?-52:s.sport==='soccer'?-40:-15);board.scale.set(s.sport==='volleyball'?9:15,s.sport==='volleyball'?2.25:3.75,1);
  renderer.render(scene,camera);if(cursor.visible){const projected=cursor.position.clone().project(camera);canvas.dataset.aimX=String(projected.x);canvas.dataset.aimY=String(projected.y);}else{delete canvas.dataset.aimX;delete canvas.dataset.aimY;}canvas.dataset.players=String(ready);canvas.dataset.total=String(total);canvas.dataset.venue=venue;canvas.dataset.renderer='three';
  const status:RenderStatus={ready:venueReady&&kitReady&&ready===total,players:ready,total,failed,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};const signature=JSON.stringify([status.ready,ready,total,failed]);if(signature!==lastStatus){lastStatus=signature;onStatus(status);}
 }
 const lost=(e:Event)=>{e.preventDefault();onStatus({ready:false,players:0,total:0,failed:true,drawCalls:0,triangles:0});};canvas.addEventListener('webglcontextlost',lost);
 return{draw,dispose(loseContext=true){disposed=true;++request;canvas.removeEventListener('webglcontextlost',lost);for(const r of rigs.values())r.hero.dispose();rigs.clear();owned.forEach(o=>o.dispose());owned.clear();renderer.dispose();if(loseContext)renderer.forceContextLoss();scene.clear();},get info(){return renderer.info;}};
}
