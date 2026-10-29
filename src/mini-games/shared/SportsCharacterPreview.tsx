import React,{useEffect,useRef,useState}from'react';
import*as T from'three';
import{createGolferAssets}from'../gakuro-golf/golferModels';
import {avatarHero} from '../../three/sportsWardrobe';
import type{KartAvatar}from'../gakuro-kart/avatar';
import{assetUrl}from'../../utils/assetPaths';
export type PracticeSport='tennis'|'dodgeball'|'basketball';
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** A sport-specific practice swing, shared by custom avatars and protagonist skeletons. */
export default function SportsCharacterPreview({sport,avatar,label}:{sport:PracticeSport;avatar:KartAvatar;label:string}){
 const canvas=useRef<HTMLCanvasElement>(null),appearance=useRef(avatar);appearance.current=avatar;
 const[failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=canvas.current!,assets=createGolferAssets(),rig=assets.create(appearance.current,true,sport),scene=new T.Scene();
  const owned:(T.BufferGeometry|T.Material)[]=[],equipment=new T.Group(),camera=new T.PerspectiveCamera(38,1,.1,40);
  let renderer:T.WebGLRenderer|undefined,frame=0,dead=false,observer:ResizeObserver|undefined;
  const geo=<G extends T.BufferGeometry>(g:G)=>{owned.push(g);return g;};
  const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:.55});owned.push(m);return m;};
  const mesh=(g:T.BufferGeometry,m:T.Material,parent:T.Object3D=scene)=>{const o=new T.Mesh(g,m);parent.add(o);return o;};
  scene.background=new T.Color('#294955');scene.add(new T.HemisphereLight('#fff4da','#5b8792',2.3));
  const light=new T.DirectionalLight('#fff4da',3);light.position.set(3,6,5);scene.add(light,rig.root,equipment);
  const floor=mesh(geo(new T.CircleGeometry(2,48)),mat(sport==='tennis'?'#388879':'#b47b58'));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;
  const line=mesh(geo(new T.BoxGeometry(3.6,.015,.025)),mat('#e5edce'));line.position.z=1.05;
  const ball=mesh(geo(new T.SphereGeometry(sport==='tennis'?.10:.23,20,16)),mat(sport==='tennis'?'#d9ed61':sport==='basketball'?'#e88736':'#fff0cf'));
  if(sport==='tennis'){
   const handle=mesh(geo(new T.CylinderGeometry(.035,.045,.52,12)),mat('#172b38'),equipment);handle.position.y=.21;
   const rim=mesh(geo(new T.TorusGeometry(.31,.035,10,40)),mat('#e8ba6a'),equipment);rim.scale.set(.85,1.25,1);rim.position.y=.82;
   const positions:number[]=[];for(let i=-3;i<=3;i++){const a=i*.07,h=Math.sqrt(.27*.27-a*a);positions.push(a,.82-h*1.25,0,a,.82+h*1.25,0,-h*.85,.82+a*1.25,0,h*.85,.82+a*1.25,0);}
   const strings=geo(new T.BufferGeometry());strings.setAttribute('position',new T.Float32BufferAttribute(positions,3));const material=new T.LineBasicMaterial({color:'#eff7e5'});owned.push(material);equipment.add(new T.LineSegments(strings,material));equipment.scale.setScalar(.85);
  }else{
   const stripe=mesh(geo(new T.TorusGeometry(.231,.018,8,32)),mat(sport==='basketball'?'#423629':'#dd7b64'),ball);stripe.rotation.x=Math.PI/2;
  }
  const release=new T.Vector3(),handPosition=new T.Vector3();let released=false,age=0,previous=performance.now(),key=JSON.stringify(appearance.current);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const lost=(e:Event)=>{e.preventDefault();dead=true;setFailed(true);cancelAnimationFrame(frame);};
  try{
   renderer=new T.WebGLRenderer({canvas:el,antialias:true});renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;
   const resize=()=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer!.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const distance=Math.max(5.5,3.5/(2*Math.tan(19*Math.PI/180)*camera.aspect));camera.position.set(distance*(avatarHero(appearance.current)?-.45:.35),1.6+distance*.15,distance);camera.lookAt(0,1.3,0);};
   observer=new ResizeObserver(resize);observer.observe(el);resize();el.addEventListener('webglcontextlost',lost);
   const draw=(now:number)=>{
    if(dead)return;if(now-previous<1000/30-1){frame=requestAnimationFrame(draw);return;}const dt=Math.min(.08,(now-previous)/1000);previous=now;if(!document.hidden)age+=dt;
    const nextKey=JSON.stringify(appearance.current);if(nextKey!==key){key=nextKey;rig.update(appearance.current);resize();}
    const t=reduced.matches?.85:age%3.2,wind=smooth(t/.9),hit=smooth((t-1.0)/.35),recover=smooth((t-2.0)/.8);
    const rx=(sport==='tennis'?-.55-wind*.4-hit*.45:sport==='basketball'?-1.1-wind*.8-hit*.9:-.45-wind*1.9+hit*.95)*(1-recover)+(-.45)*recover;
    const rz=(sport==='tennis'?-.3-wind*.8+hit*2:-.3-wind*.2+hit*.9)*(1-recover)-.3*recover;
    const elbow=(sport==='tennis'?-.6-wind*.3+hit*.65:-.7-wind*.9+hit*1.4)*(1-recover)-.6*recover;
    const twist=(-wind*.45+hit*.95)*(1-recover);
    rig.animateHero(dt,0);rig.root.rotation.y=avatarHero(appearance.current)?.2:-.3;rig.root.position.y=hit*(1-recover)*.035;rig.torso.rotation.y=twist;
    rig.rightArm.rotation.set(rx+.3,0,rz);rig.leftArm.rotation.set(-.35-wind*.3*(1-recover),0,.3);rig.club.visible=false;
    rig.hero.pose('upper_arm.R',rx,rz);rig.hero.pose('forearm.R',elbow);rig.hero.pose('upper_arm.L',sport==='basketball'?-1.3-wind*.6-hit*.5: -.6,.4);rig.hero.pose('forearm.L',-.5);rig.hero.pose('spine',.06,twist);
    rig.root.updateMatrixWorld(true);
    const bone=rig.hero.root.getObjectByName('forearmR'),hand=rig.hero.ready&&bone?bone:rig.rightArm.children.at(-1)!;
    handPosition.set(0,rig.hero.ready?.24:0,0);hand.localToWorld(handPosition);
    const named=!!avatarHero(appearance.current),tilt=named?.5+hit*.9:.5-hit*1.2;
    equipment.visible=sport==='tennis';equipment.position.copy(handPosition);equipment.rotation.set(-.18,(named?-.25:.25)+twist*.2,tilt*(1-recover)+.5*recover);
    if(sport!=='tennis'){
     if(t>=1.3&&t<2.15&&!reduced.matches){if(!released){release.copy(handPosition);released=true;}const flight=t-1.3;ball.position.copy(release).add(new T.Vector3(-.8*flight,(sport==='basketball'?4:1.5)*flight-1.4*flight*flight,(sport==='basketball'?2.5:4)*flight));}
     else{released=false;ball.position.copy(handPosition);}
     ball.visible=t<2.15||t>2.7;ball.rotation.x=age*4;
    }else{ball.position.set(-1.1, .15+Math.abs(Math.sin(t*3))*.15,.8);}
    el.dataset.sport=sport;el.dataset.practicePhase=t<1?'backswing':t<1.4?'strike':t<2.0?'follow-through':'recover';el.dataset.protagonistReady=String(rig.hero.ready);el.dataset.armPose=rx.toFixed(3);el.dataset.equipment=sport==='tennis'?'racket':'ball';
    if(!document.hidden)renderer!.render(scene,camera);frame=requestAnimationFrame(draw);
   };frame=requestAnimationFrame(draw);
  }catch{setFailed(true);}
  return()=>{dead=true;cancelAnimationFrame(frame);observer?.disconnect();el.removeEventListener('webglcontextlost',lost);rig.dispose();assets.dispose();owned.forEach(o=>o.dispose());renderer?.dispose();};
 },[sport]);
 return <div className="sports-practice-preview"><canvas ref={canvas} aria-label={label}/>{failed&&<div className="sports-practice-fallback">{avatar.protagonist?<img src={assetUrl(`models/protagonists/${avatar.protagonist}.png`)} alt=""/>:<span>🧑</span>}<b>{sport==='tennis'?'🎾':'🏐'}</b></div>}</div>;
}
