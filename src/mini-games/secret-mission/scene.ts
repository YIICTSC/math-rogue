import * as T from 'three';
import { AVATAR_COLORS, defaultAvatar } from '../gakuro-kart/avatar';
import { createVrCharacter } from '../gakurogear/character';
import type { Facility, MissionMap, Point, Rect } from './maps';
import type { Actor, View } from './rules';
import { EMOTES } from './rules';

type Look={root:T.Group; rig:T.Group; label:HTMLElement; avatar:string; state:Actor; body:boolean; x:number; z:number};
const floorSize=22;
const flat=(width:number,depth:number,color:T.Material,y:number,x:number,z:number)=>{
  const mesh=new T.Mesh(new T.PlaneGeometry(width,depth),color);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);return mesh;
};
function release(root:T.Object3D){
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
  root.traverse(o=>{
    const mesh=o as T.Mesh;
    if(mesh.geometry)geometries.add(mesh.geometry);
    if(mesh.material)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(m);
  });
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
  root.removeFromParent();
}

export function createMissionScene(host:HTMLElement,map:MissionMap,en:boolean,preview:boolean,quality:boolean){
  const renderer=new T.WebGLRenderer({alpha:false,antialias:quality,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,quality?1.65:1));
  renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(), stage=new T.Group();
  scene.add(stage);
  scene.background=new T.Color('#121f2a');
  const ambient=new T.HemisphereLight(map.light,'#485779',1.6);
  const sun=new T.DirectionalLight('#fff1d5',2.45);
  sun.position.set(-10,19,-13);scene.add(ambient,sun);
  const camera=new T.OrthographicCamera(-12,12,8,-8,.1,120);
  const mat=(color:string|number)=>new T.MeshStandardMaterial({color,roughness:.84});
  const solid=(w:number,h:number,d:number,x:number,y:number,z:number,material:T.Material,parent:T.Object3D=stage)=>{
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);parent.add(m);return m;
  };
  const base=mat(map.hall),border=mat('#203349'),rim=mat('#ecac69'),floorMat=mat(map.floor), dark=mat('#213645'), wood=mat('#955a42');
  const painted=mat('#e9dfbe'),glass=mat('#8be3cd'), green=mat('#427b68'),brick=mat('#774d52'),nav=mat('#537a8a');
  const bright=new T.MeshBasicMaterial({color:'#9effdb'}), amber=new T.MeshBasicMaterial({color:'#ffcb75'});
  const marker=new T.MeshBasicMaterial({color:'#aed2f8',transparent:true,opacity:.76});
  const labels=document.createElement('div');labels.className='sm-world-labels';labels.setAttribute('aria-hidden','true');host.append(renderer.domElement,labels);
  renderer.domElement.setAttribute('aria-hidden','true');
  solid(map.w+.7,.6,map.d+.7,map.w/2,-.32,map.d/2,border);
  stage.add(flat(map.w,map.d,base,.01,map.w/2,map.d/2));
  for(let i=1;i<map.w/3;i++)stage.add(flat(.021,map.d-.8,nav,.013,i*3,map.d/2));
  for(let i=1;i<map.d/3;i++)stage.add(flat(map.w-.8,.021,nav,.013,map.w/2,i*3));
  const wallNodes=map.walls.map((wall,i)=>({
    wall, mesh:solid(wall.w,i<4?1.52:wall.w===.66?1.56:1.47,wall.d,wall.x,i<4?.76:.73,wall.z,mat(i<4?'#23354a':wall.w===.66?'#563d41':map.light)),
  }));
  const door=new T.Mesh(new T.BoxGeometry(1,1,1),rim);scene.add(door);door.visible=false;
  const stationNames:{point:T.Vector3;label:HTMLElement;id:number}[]=[];
  const terminalMarkers=new Map<number,T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>>();
  function ring<M extends T.Material>(x:number,z:number,r:number,material:M,y=.05,parent:T.Object3D=stage){
    const m=new T.Mesh(new T.RingGeometry(r*.84,r,24),material);
    m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;
  }
  const props=(f:Facility)=>{
    const x=f.x-1.9,z=f.z+1.6;
    const desk=(x:number,z:number,table=wood)=>{
      solid(.95,.58,.58,x,.31,z,table);solid(1.12,.15,.72,x,.65,z,painted);
    };
    const machine=(x:number,z:number,color:T.Material)=>{
      solid(.8,.9,.8,x,.45,z,dark);solid(.58,.37,.58,x,.98,z,color);solid(.38,.09,.22,x,1.19,z+.09,bright);
    };
    if(f.kind==='desk'||f.kind==='lab'||f.kind==='clinic'){
      desk(x,z,f.kind==='lab'?dark:wood);desk(x,z-1.2);
      solid(1.38,.72,.2,f.x+.65,.74,f.z+f.d/2-.21,f.kind==='clinic'?glass:dark);
      if(f.kind!=='desk')machine(f.x+.9,f.z+1.8,f.kind==='lab'?glass:painted);
    }else if(f.kind==='books'||f.kind==='forge'){
      for(let i=0;i<3;i++)solid(.8,.25,.66,f.x+1.9,.37+i*.4,f.z+.36,wood);
      for(let i=0;i<3;i++)solid(.14,.32,.37,f.x+1.66+i*.15,.65,f.z+.36,i===1?glass:brick);
      if(f.kind==='forge')machine(x,z,rim);
    }else if(f.kind==='portal'){
      ring(f.x,f.z+.65,2.25,marker);
      for(const a of [-1,1]){
        solid(.53,1.7,.53,f.x+a*1.7,.83,f.z+1.1,brick);
        const top=new T.Mesh(new T.OctahedronGeometry(.37),glass);top.position.set(f.x+a*1.7,1.86,f.z+1.1);stage.add(top);
      }
    }else if(f.kind==='garden'){
      stage.add(flat(1.7,2.4,green,.034,x,z-.35));
      for(let i=0;i<3;i++){
        const tree=new T.Mesh(new T.IcosahedronGeometry(.66,0),green);tree.position.set(x-.18,.92,z-i*.76);stage.add(tree);
      }
    }else if(f.kind==='court'){
      stage.add(flat(5.2,3.6,nav,.035,f.x,f.z));ring(f.x,f.z,1.19,marker);
      for(const z of [-1.8,1.8])stage.add(flat(5.2,.07,painted,.04,f.x,f.z+z));
    }else {
      for(const d of [-1.1,0,1.1])machine(x+d*.28,z+d*.35,d===0?glass:nav);
    }
  };
  for(const f of map.facilities){
    stage.add(flat(f.w-.15,f.d-.15,floorMat,.025,f.x,f.z));
    props(f);
    const post=solid(.48,.64,.43,f.x,.34,f.z-.17,dark);
    const screen=solid(.58,.22,.43,f.x,.7,f.z-.17,glass);screen.rotation.x=-.28;post.name='Terminal';
    terminalMarkers.set(f.id,ring(f.x,f.z,1.06,marker.clone()));
    if(!preview){
      const label=document.createElement('span');label.className='sm-station-label';label.textContent=en?f.en:f.ja;labels.append(label);
      stationNames.push({point:new T.Vector3(f.x,.04,f.z+.85),label,id:f.id});
    }
  }
  ring(map.meeting.x,map.meeting.z,1.32,amber);
  solid(1.14,.42,1.14,map.meeting.x,.23,map.meeting.z,border);
  solid(.83,.16,.74,map.meeting.x,.54,map.meeting.z,rim);
  for(const p of map.tunnels){
    solid(.92,.1,.79,p.x,.081,p.z,dark);
    for(let i=-2;i<=2;i++)solid(.7,.014,.045,p.x,.142,p.z+i*.12,nav);
  }
  for(const p of map.cameras) {
    solid(.19,1.23,.19,p.x,.61,p.z,dark);solid(.46,.29,.27,p.x,1.3,p.z,nav);ring(p.x,p.z,.65,marker);
  }

  const people=new Map<string,Look>();
  const cameraPoint=new T.Vector3(map.meeting.x+(preview?3:0),0,map.meeting.z);
  const previewActors:Actor[]=preview?[[-1.5,-1.4],[1.15,1.4],[-1.4,1.75],[1.7,-1.1]].map(([x,z],i)=>({
    x:map.meeting.x+x,z:map.meeting.z+z,id:'display-'+i,name:'',face:i%2?.65:-.45,
    avatar:{...defaultAvatar([3,4,1,2][i]),hairStyle:i+1,accessory:[11,3,13,0][i],species:[0,3,7,0][i]},
    presence:'active',animation:i===2?'emote':'idle',
  })):[];
  let width=0,height=0;
  const resize=()=>{
    width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);
    renderer.setSize(width,height,false);
    const ratio=width/height;
    const worldWidth=preview?Math.min(map.w*.79,ratio*24):Math.max(15,Math.min(29,floorSize*ratio/1.5));
    const vertical=worldWidth/ratio;
    const horizontal=preview?vertical*ratio:worldWidth;
    camera.left=-horizontal/2;camera.right=horizontal/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const target=new T.Vector3(), projected=new T.Vector3(), tempo=performance.now();
  let lastEvent=0, frozenUntil=0;
  const project=(point:T.Vector3,element:HTMLElement)=>{
    projected.copy(point).project(camera);
    const on=Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1.1;
    element.hidden=!on;
    if(on)element.style.transform='translate('+((projected.x+1)*width/2).toFixed(0)+'px,'+((1-projected.y)*height/2).toFixed(0)+'px) translate(-50%,-100%)';
  };
  function addActor(actor:Actor,body:boolean,self:boolean){
    const avatar=JSON.stringify(actor.avatar),root=new T.Group();
    const rig=createVrCharacter(actor.avatar);root.add(rig);stage.add(root);
    const disc=ring(0,0,.63,new T.MeshBasicMaterial({color:self?'#b5f8c6':AVATAR_COLORS[actor.avatar.outfit],side:T.DoubleSide,transparent:true,opacity:.87}),.06,root);
    disc.scale.setScalar(self?1.12:1);
    if(body){rig.rotation.z=-Math.PI/2;rig.position.y=.24;}
    const label=document.createElement('strong');label.className='sm-actor-label'+(self?' is-self':'')+(body?' is-body':'');labels.append(label);
    const show={root,rig,label,avatar,state:actor,body,x:actor.x,z:actor.z};people.set(actor.id,show);return show;
  }
  function removeActor(id:string,look:Look){
    look.rig.userData.protagonistModel?.dispose();
    release(look.root);look.label.remove();people.delete(id);
  }
  function draw(view:View|undefined,now:number){
    const focus=view?.camera===undefined?view?.self:map.cameras[view.camera];
    const isObserver=!!view?.observer, motion=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1;
    if(view?.event&&lastEvent!==view.event.serial){
      lastEvent=view.event.serial;
      if(view.event.kind==='stunned'||view.event.kind==='block')frozenUntil=now+120*motion;
    }
    if(preview)target.set(map.meeting.x+3.4,0,map.meeting.z+1);
    else if(isObserver)target.set(map.w*.49,0,map.d*.5);
    else if(focus)target.set(focus.x,0,focus.z-.65);
    else target.set(map.meeting.x,0,map.meeting.z);
    if(now>=frozenUntil)cameraPoint.lerp(target,preview?.035:.15);
    const elevation=isObserver?30:preview?16:22, trailing=preview?17:12.5;
    const zoom=isObserver?Math.min(.55,26/map.w):1;
    if(camera.zoom!==zoom){camera.zoom=zoom;camera.updateProjectionMatrix();}
    camera.position.set(cameraPoint.x+(preview?7:0),elevation,cameraPoint.z+trailing);
    camera.lookAt(cameraPoint);camera.updateMatrixWorld();
    const dim=view?.alarm?.kind==='lights'&&!view.allies.length&&view.role&&!['shade','mimic','hacker','shadow'].includes(view.role);
    ambient.intensity=dim?.75:1.6;sun.intensity=dim?.52:2.45;
    for(const {mesh,wall} of wallNodes){
      const opacity=focus&&wall.z>focus.z+.19&&wall.z<focus.z+3.7&&Math.abs(wall.x-focus.x)<wall.w/2+.58?.29:1;
      mesh.material.transparent=opacity<1;mesh.material.opacity=opacity;mesh.material.depthWrite=opacity===1;
    }
    const gate=view?.alarm?.kind==='doors'&&map.doors[view.alarm.door??-1];
    door.visible=!!gate;
    if(gate){door.position.set(gate.x,.71,gate.z);door.scale.set(gate.w,1.4,gate.d+.08);}
    const actors=view?[...(view.self?[view.self]:[]),...view.actors]:previewActors;
    const seen=new Set<string>();
    for(const a of actors){
      seen.add(a.id);
      let look=people.get(a.id);
      if(look&&look.avatar!==JSON.stringify(a.avatar)){removeActor(a.id,look);look=undefined;}
      look??=addActor(a,false,a.id===view?.who);look.state=a;
    }
    for(const b of view?.bodies??[]){
      const id='stunned-'+b.id;seen.add(id);
      if(!people.has(id))addActor({...b,id,avatar:defaultAvatar(view?.roster.find(p=>p.id===b.id)?.color),face:Math.PI,animation:'stunned',presence:'active'},true,false);
    }
    for(const [id,look] of people){
      if(!seen.has(id)){removeActor(id,look);continue;}
      const a=look.state;
      const lerp=id===view?.who&&now<frozenUntil?0:quality?.28:.35;
      look.x+= (a.x-look.x)*lerp;look.z+=(a.z-look.z)*lerp;
      look.root.position.set(look.x,.025,look.z);
      look.root.rotation.y=a.face;
      const cycle=(now-tempo)*.001, walking=a.animation==='walk'||a.animation==='run';
      const pace=a.animation==='run'?22:15;
      const rise=walking?Math.abs(Math.sin(cycle*pace))*.145:0;
      const floating=a.presence==='ghost'?.25+Math.sin(cycle*3.6)*.09:0;
      look.rig.position.y=look.body?.22:(rise+floating+(a.animation==='win'||a.animation==='rescue'?Math.abs(Math.sin(cycle*12))*.27:0))*motion;
      look.rig.rotation.x=a.animation==='task'?-.16:walking?-.12:0;
      look.rig.rotation.z=look.body?-1.52:a.animation==='stunned'?-.82:walking?Math.sin(cycle*pace)*.11*motion:a.animation==='emote'?.16*Math.sin(cycle*17)*motion:0;
      look.rig.scale.setScalar(a.presence==='ghost'?.7:1);
      look.rig.userData.protagonistUpdate?.();
      const caption=(look.body?'✦ ':a.shield?'◇ ':'')+a.name+(a.emote?' '+EMOTES[a.emote]:'');
      if(look.label.textContent!==caption)look.label.textContent=caption;
      if(preview)look.label.hidden=true;
      else project(target.set(look.x,look.body?.65:1.62,look.z),look.label);
    }
    const taskIndices=new Set(view?.assigned.filter(n=>!view.completed.includes(n)));
    const targetIndices=new Set(view?.alarm?.stations.filter(n=>!view.alarm?.repaired.includes(n)));
    for(const [id,node] of terminalMarkers){
      const repair=targetIndices.has(id),active=taskIndices.has(id)&&view?.alarm?.kind!=='signal';
      node.material.color.set(repair?'#ff995e':active?'#a0ffb0':'#abc7d4');node.material.opacity=repair||active?.94:.32;
      node.scale.setScalar(repair||active?1+Math.sin(now*.006)*.09*motion:1);
    }
    for(const s of stationNames){
      const nearFocus=!focus||Math.hypot(s.point.x-focus.x,s.point.z-focus.z)<8.5;
      if(nearFocus)project(s.point,s.label);
      else s.label.hidden=true;
      s.label.dataset.task=targetIndices.has(s.id)?'repair':taskIndices.has(s.id)&&view?.alarm?.kind!=='signal'?'study':'';
    }
    renderer.render(scene,camera);
  }
  return {draw,dispose(){
    observer.disconnect();
    for(const [id,p] of people)removeActor(id,p);
    release(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();labels.remove();
  }};
}
