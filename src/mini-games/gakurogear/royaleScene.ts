import * as T from 'three';
import type { Mission, Point } from './engine';
import type { RoyaleState } from './royale';

/** View-only arena dressing and replicated combat effects. Rules live in royale.ts. */
export function createRoyaleView(scene:T.Scene,mission:Mission,host:HTMLElement) {
  const root=new T.Group();scene.add(root);
  const material=(color:number,opacity=1)=>new T.MeshLambertMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:number)=>{
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);root.add(mesh);return mesh;
  };
  const size=mission.size??24;
  // Crossed paths and four court colors make rotations legible at every camera angle.
  box(0,-.025,0,size*2,.02,3.4,0xc5bc99);box(0,-.022,0,3.4,.02,size*2,0xc5bc99);
  const districts=[[-1,-1,0x7eaaa3],[1,-1,0xc3aa77],[-1,1,0x7da775],[1,1,0x9697b6]];
  for(const [x,z,color] of districts)box(x*size*.48,-.04,z*size*.48,size*.58,.02,size*.58,color);
  const ring=new T.Mesh(new T.RingGeometry(3.9,4.2,64),new T.MeshBasicMaterial({color:0xffedb7,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;root.add(ring);
  // Decorative skyline is outside the playable boundary, never an invisible collider.
  for(let i=0;i<36;i++){
    const a=i/36*Math.PI*2,r=size*1.49,x=Math.sin(a)*r,z=Math.cos(a)*r;
    box(x,1.2,z,.4,2.4,.4,0x776849);
    const crown=new T.Mesh(new T.IcosahedronGeometry(1.8+(i%3)*.3,0),material([0x426c4e,0x557d50,0x668c57][i%3]));crown.position.set(x,3.4,z);root.add(crown);
  }
  const stormWall=new T.Mesh(new T.CylinderGeometry(1,1,10,96,1,true),new T.MeshBasicMaterial({color:0x8f74ff,side:T.DoubleSide,transparent:true,opacity:.17,depthWrite:false}));stormWall.position.y=5;root.add(stormWall);
  const nextRing=new T.Mesh(new T.RingGeometry(.991,1,96),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,transparent:true,opacity:.65}));nextRing.rotation.x=-Math.PI/2;nextRing.position.y=.025;root.add(nextRing);
  const covers=new Map<number,T.Group>(),traces=new Map<number,T.Group>();
  const reticle=document.createElement('div');reticle.className='gear-royale-reticle';reticle.setAttribute('aria-hidden','true');host.appendChild(reticle);
  const free=(g:T.Object3D)=>{g.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();for(const m of [o.material].flat())m.dispose();}});g.removeFromParent();};
  function draw(state:RoyaleState|undefined,time:number,radius:number,next:number,camera:T.Camera,aim:Point,visible:boolean,owner?:string) {
    stormWall.scale.set(radius,1,radius);nextRing.scale.setScalar(next);nextRing.visible=next<radius-.1;
    const point=new T.Vector3(aim.x,.85,aim.z).project(camera);
    reticle.hidden=!visible||point.z>1||point.z< -1||Math.abs(point.x)>1||Math.abs(point.y)>1;
    reticle.dataset.hit=String(!!state?.traces.some(t=>t.owner===owner&&t.hit&&time-t.at<.35));
    reticle.style.left=`${(point.x+1)*50}%`;reticle.style.top=`${(1-point.y)*50}%`;
    for(const [id,g] of covers)if(!state?.covers.some(c=>c.id===id&&c.hp>0)){free(g);covers.delete(id);}
    for(const c of state?.covers??[]){
      if(c.hp<=0)continue;
      let g=covers.get(c.id);
      if(!g){g=new T.Group();const panel=new T.Mesh(new T.BoxGeometry(c.w,c.h,c.d),material(0x52a6ce,.85));panel.position.y=c.h/2;g.add(panel);
        const edges=new T.LineSegments(new T.EdgesGeometry(panel.geometry),new T.LineBasicMaterial({color:0xd2f8ff}));edges.position.y=c.h/2;g.add(edges);root.add(g);covers.set(c.id,g);}
      g.position.set(c.x,0,c.z);(g.children[0] as T.Mesh<T.BoxGeometry,T.MeshLambertMaterial>).material.color.setHex(c.hp===1?0xf0bc71:0x52a6ce);
    }
    for(const [id,g] of traces)if(!state?.traces.some(t=>t.id===id)){free(g);traces.delete(id);}
    for(const t of state?.traces??[]){
      let g=traces.get(t.id);const age=time-t.at;
      if(!g){g=new T.Group();const from=new T.Vector3(t.from.x,.85,t.from.z),to=new T.Vector3(t.to.x,.85,t.to.z),d=to.clone().sub(from),color=t.shield?0x7deaff:t.hit?0xffe891:0xcdf7ff;
        const beam=new T.Mesh(new T.CylinderGeometry(.022,.022,Math.max(.01,d.length()),6),new T.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false}));beam.position.copy(from).lerp(to,.5);beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());g.add(beam);
        const impact=new T.Mesh(new T.IcosahedronGeometry(.12,1),new T.MeshBasicMaterial({color,transparent:true,opacity:.9,wireframe:true}));impact.position.copy(to);g.add(impact);root.add(g);traces.set(t.id,g);}
      const beam=g.children[0] as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>,impact=g.children[1] as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
      beam.material.opacity=Math.max(0,1-age/.3);impact.material.opacity=Math.max(0,1-age/.6);impact.scale.setScalar(1+age*5);
    }
  }
  return {draw,dispose(){reticle.remove();for(const g of [...covers.values(),...traces.values()])free(g);free(root);}};
}
