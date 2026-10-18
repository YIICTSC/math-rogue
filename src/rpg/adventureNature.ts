import * as T from 'three';
import type {World} from './engine';
import {WIDTH} from './engine';
import {terrainHeight,blockAt,voxelWater} from './voxel';
import {landscapeHash} from './worldLandscape';
import {adventureSurface} from './adventureStyle';
/** Decorative ground cover is seeded and batched; it never alters collision or saved tiles. */
export class AdventureNature {
 readonly group=new T.Group();private key='';private clock={value:0};
 private blade=new T.ConeGeometry(.08,.42,3).translate(0,.21,0);
 private pebble=new T.DodecahedronGeometry(.12,0);
 private grass=adventureSurface(new T.MeshStandardMaterial({color:'#91ad65',roughness:1}),true,this.clock);
 private rock=adventureSurface(new T.MeshStandardMaterial({color:'#b4aa94',roughness:1}));
 private pollen:T.Points;
 constructor(scene:T.Scene,private low:boolean){scene.add(this.group);const count=low?24:60,g=new T.BufferGeometry(),p=new Float32Array(count*3);for(let i=0;i<count;i++){p[i*3]=Math.sin(i*17)*11;p[i*3+1]=.4+i%9*.4;p[i*3+2]=Math.cos(i*13)*11;}g.setAttribute('position',new T.BufferAttribute(p,3));this.pollen=new T.Points(g,new T.PointsMaterial({color:'#fff0b1',size:.035,transparent:true,opacity:.55,depthWrite:false}));scene.add(this.pollen);}
 update(w:World,center:T.Vector3,time:number,reduced:boolean,night:boolean){
  this.clock.value=reduced?0:time;
  this.pollen.position.copy(center);this.pollen.visible=!reduced&&center.y>=0;
  this.pollen.rotation.y=reduced?0:time*.015;(this.pollen.material as T.PointsMaterial).opacity=night?.8:.35;
  const cx=Math.floor(center.x/6)*6,cz=Math.floor(center.z/6)*6,key=`${cx}:${cz}:${w.voxels?.revision||0}`;
  if(key===this.key)return;this.key=key;
  this.group.children.forEach(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.group.clear();
  const grass:T.Matrix4[]=[],rocks:T.Matrix4[]=[],d=new T.Object3D(),radius=this.low?14:22;
  for(let z=cz-radius;z<cz+radius;z++)for(let x=cx-radius;x<cx+radius;x++){
   if(x<1||z<1||x>=WIDTH-1||!['grass','forest'].includes(w.tiles[z*WIDTH+x])||voxelWater(w,x,z))continue;
   const h=terrainHeight(w,x,z);if(h>=34)continue;if(blockAt(w,x,h,z)||!blockAt(w,x,h-1,z))continue;
   const hash=landscapeHash(x,z,w.seed+83);if(hash>.6)continue;
   for(let i=0;i<(this.low?2:4);i++){
    d.position.set(x+.15+landscapeHash(x+i,z,w.seed)*.7,h,z+.15+landscapeHash(x,z+i,w.seed+1)*.7);
    d.rotation.set(0,hash*8+i,0);d.scale.setScalar(.65+hash);d.updateMatrix();grass.push(d.matrix.clone());
   }
   if(hash<.045){d.position.set(x+.8,h+.06,z+.2);d.scale.set(1.4,.6,1);d.updateMatrix();rocks.push(d.matrix.clone());}
  }
  for(const [matrices,geometry,material] of [[grass,this.blade,this.grass],[rocks,this.pebble,this.rock]] as [T.Matrix4[],T.BufferGeometry,T.Material][]){if(!matrices.length)continue;const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();mesh.receiveShadow=true;this.group.add(mesh);}
 }
 dispose(){this.group.children.forEach(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.group.removeFromParent();this.pollen.removeFromParent();this.pollen.geometry.dispose();(this.pollen.material as T.Material).dispose();this.blade.dispose();this.pebble.dispose();this.grass.dispose();this.rock.dispose();}
}
