import * as T from 'three';
import {groundHeight,surface,type Hole} from './course';
/** Grid vertices and playable collision both use groundHeight. Sky gaps have no triangles. */
export function terrainGeometry(hole:Hole,x:number,z:number,width:number,length:number,step=3,lift=0){
 const nx=Math.max(1,Math.ceil(width/step)),nz=Math.max(1,Math.ceil(length/step));
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const px=x-width/2+width*i/nx,pz=z-length/2+length*j/nz;positions.push(px,groundHeight(hole,{x:px,z:pz})+lift,pz);uv.push(i/nx,j/nz);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const px=x-width/2+width*(i+.5)/nx,pz=z-length/2+length*(j+.5)/nz;
  if(hole.terrain?.islands&&surface(hole,{x:px,z:pz})==='ob')continue;
  const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
