import * as T from 'three';
import type { AvatarPart } from './avatarModels';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createHumanAccessories():AvatarPart[]{
  const parts:AvatarPart[]=[],sphere=new T.SphereGeometry(1,12,8),box=new RoundedBoxGeometry(1,1,1,2,.12);
  const mat=(color:string,metalness=0)=>new T.MeshStandardMaterial({color,metalness,roughness:.48});
  const ink=mat('#333344'),gold=mat('#efc566',.55),pink=mat('#ed799f'),white=mat('#fff3dd'),green=mat('#689d76');
  const lens=new T.MeshStandardMaterial({color:'#243749',transparent:true,opacity:.82,roughness:.22});
  const add=(id:number,g:T.BufferGeometry,m:T.Material,p:number[],s:number[],r=[0,0,0],color?:AvatarPart['color'])=>parts.push({geometry:g,material:m,position:p,scale:s,rotation:r,color,motion:'head',visible:a=>a.species===0&&a.accessory===id});
  const curve=(points:number[][],radius=.02)=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,radius,6,false);
  for(const id of [4,5,6]){
    for(const side of [-1,1]){
      const rim=id===4?new T.TorusGeometry(.13,.018,6,24):curve([[-.14,-.08,0],[-.14,.08,0],[.14,.08,0],[.14,-.08,0],[-.14,-.08,0]]);
      add(id,rim,id===4?gold:ink,[side*.19,1.965,.425],[1,1,1]);
      if(id===6)add(id,box,lens,[side*.19,1.965,.423],[.27,.15,.028]);
      add(id,curve([[side*.3,0,0],[side*.48,0,-.23],[side*.51,-.04,-.42]]),ink,[0,1.965,.42],[1,1,1]);
    }
    add(id,box,id===4?gold:ink,[0,1.975,.44],[.12,.025,.027]);
  }
  for(const side of [-1,1])add(7,sphere,pink,[.34+side*.115,2.30,.24],[.14,.085,.06],[0,0,side*.4]);
  add(7,sphere,gold,[.34,2.30,.285],[.045,.045,.028]);
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;add(8,sphere,pink,[-.38+Math.cos(angle)*.075,2.23+Math.sin(angle)*.075,.245],[.065,.055,.028]);}
  add(8,sphere,gold,[-.38,2.23,.275],[.04,.04,.025]);add(8,sphere,green,[-.44,2.12,.20],[.07,.028,.02],[0,0,-.6]);
  add(9,curve([[-.56,0,0],[-.48,.4,0],[0,.58,0],[.48,.4,0],[.56,0,0]],.045),ink,[0,1.9,-.11],[1,1,1]);
  for(const side of [-1,1]){add(9,sphere,ink,[side*.56,1.91,-.1],[.11,.20,.16]);add(9,sphere,gold,[side*.645,1.91,-.08],[.028,.12,.095]);}
  add(10,curve([[-.5,0,0],[-.3,.3,0],[0,.36,0],[.3,.3,0],[.5,0,0]],.027),pink,[0,2.15,-.10],[1,1,1]);
  for(const side of [-1,1]){add(10,new T.ConeGeometry(1,1,3),ink,[side*.36,2.48,-.10],[.2,.29,.12],[0,0,-side*.2]);add(10,new T.ConeGeometry(1,1,3),pink,[side*.36,2.48,.015],[.12,.18,.015],[0,0,-side*.2]);}
  add(11,sphere,ink,[.06,2.37,-.16],[.55,.18,.44],[0,0,-.16],'outfit');add(11,sphere,ink,[.21,2.55,-.16],[.04,.06,.04]);
  const star=new T.Shape();for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.038:.08;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();
  const starGeo=new T.ExtrudeGeometry(star,{depth:.022,bevelEnabled:false});
  for(const side of [-1,1]){add(12,new T.TorusGeometry(.025,.008,5,12),gold,[side*.55,1.74,.02],[1,1,1]);add(12,starGeo,gold,[side*.55,1.65,.045],[1,1,1]);}
  add(13,curve([[-.5,0,-.1],[-.35,0,.18],[0,0,.29],[.35,0,.18],[.5,0,-.1]],.045),white,[0,2.22,-.10],[1,1,1],[0,0,0],'outfit');
  add(13,sphere,green,[0,2.22,.31],[.5,.025,.28]);
  return parts;
}
