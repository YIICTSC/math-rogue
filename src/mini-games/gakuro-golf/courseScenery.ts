import * as THREE from 'three';
import type { Hole } from './course';

/** Deterministic decorative scenery; playable ground stays level with golf physics. */
export function createCourseScenery(scene:THREE.Scene,hole:Hole){
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[],textures:THREE.Texture[]=[];
 let seed=517+hole.par+hole.cup.z*37+hole.cup.x*131;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const texture=(colors:string[],repeat:number)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle=colors[0];ctx.fillRect(0,0,128,128);for(let i=0;i<2200;i++){ctx.fillStyle=colors[1+i%2];ctx.fillRect(random()*128,random()*128,1+random()*2,1+random()*3);}const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;result.wrapS=result.wrapT=THREE.RepeatWrapping;result.repeat.set(repeat,repeat);textures.push(result);return result;};
 const grass=texture(['#527d37','#608b3e','#456f30'],28),fairway=texture(['#81a94b','#89b351','#739d44'],3),green=texture(['#9abc59','#a0c260','#92b553'],4);
 const sky=document.createElement('canvas');sky.width=4;sky.height=256;const ctx=sky.getContext('2d')!,gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#438fd2');gradient.addColorStop(.55,'#9bcee5');gradient.addColorStop(1,'#dae9cd');ctx.fillStyle=gradient;ctx.fillRect(0,0,4,256);const skyTexture=new THREE.CanvasTexture(sky);skyTexture.colorSpace=THREE.SRGBColorSpace;textures.push(skyTexture);scene.background=skyTexture;
 const material=(color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:1});materials.push(m);return m;};
 const sphere=new THREE.SphereGeometry(1,9,7),trunk=new THREE.CylinderGeometry(.5,.75,1,6),ground=new THREE.PlaneGeometry(1800,1800);geometries.push(sphere,trunk,ground);
 const grassMaterial=new THREE.MeshStandardMaterial({map:grass,roughness:1});materials.push(grassMaterial);const field=new THREE.Mesh(ground,grassMaterial);field.rotation.x=-Math.PI/2;field.position.y=-.2;scene.add(field);
 const hills=new THREE.InstancedMesh(sphere,material('#708d64'),14),distant=new THREE.InstancedMesh(sphere,material('#9ab4a1'),14);const transform=new THREE.Object3D();
 for(let i=0;i<14;i++){const side=i%2?-1:1;transform.position.set(side*(145+random()*110),-5,hole.cup.z*.3+i*34);transform.scale.set(65+random()*45,20+random()*40,65+random()*40);transform.updateMatrix();hills.setMatrixAt(i,transform.matrix);transform.position.x*=1.9;transform.position.z+=100;transform.scale.y*=1.5;transform.updateMatrix();distant.setMatrixAt(i,transform.matrix);}scene.add(hills,distant);
 const treeCount=64,trunks=new THREE.InstancedMesh(trunk,material('#78583a'),treeCount),leaves=new THREE.InstancedMesh(sphere,material('#32682e'),treeCount*4),shadows=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:'#183a1a',transparent:true,opacity:.13,depthWrite:false}),treeCount);geometries.push(shadows.geometry);materials.push(shadows.material as THREE.Material);
 for(let i=0;i<treeCount;i++){const side=i%2?-1:1,x=side*(49+random()*42),z=-25+i*(hole.cup.z+100)/treeCount,height=8+random()*7;transform.rotation.set(0,0,0);transform.position.set(x,height*.3,z);transform.scale.set(1,height*.6,1);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);
  for(let branch=0;branch<4;branch++){transform.position.set(x+(branch===0?0:Math.cos(branch*2)*3),height+(branch===0?3:0),z+Math.sin(branch*2)*3);transform.scale.set(4+random()*2,3+random()*3,4+random()*2);transform.updateMatrix();leaves.setMatrixAt(i*4+branch,transform.matrix);leaves.setColorAt(i*4+branch,new THREE.Color().setHSL(.28+random()*.04,.4,.23+random()*.12));}
  transform.position.set(x+3,.002,z+2);transform.rotation.x=-Math.PI/2;transform.scale.set(8,5,1);transform.updateMatrix();shadows.setMatrixAt(i,transform.matrix);
 }
 scene.add(trunks,leaves,shadows);
 const clouds=new THREE.InstancedMesh(sphere,new THREE.MeshBasicMaterial({color:'#fffdf1',transparent:true,opacity:.75,depthWrite:false}),20);materials.push(clouds.material as THREE.Material);
 for(let i=0;i<20;i++){transform.rotation.set(0,0,0);transform.position.set(-320+i*38,85+random()*50,hole.cup.z+180+random()*160);transform.scale.set(15+random()*22,3+random()*5,8);transform.updateMatrix();clouds.setMatrixAt(i,transform.matrix);}scene.add(clouds);
 return {grass,fairway,green,dispose:()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
