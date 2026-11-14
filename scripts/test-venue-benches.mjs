import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
const io=new NodeIO();
for(const name of ['soccer-stadium','volleyball-gym']){
 const doc=await io.read('public/models/academy-sports/'+name+'.glb');
 for(const sign of [-1,1]){
  const node=doc.getRoot().listNodes().find(n=>n.getName()===(sign<0?'BenchLeft':'BenchRight'));assert(node,'Named bench exists');
  const centers={};for(const primitive of node.getMesh().listPrimitives()){
   const material=primitive.getMaterial().getName(),pos=primitive.getAttribute('POSITION'),lo=pos.getMin([]),hi=pos.getMax([]),center=lo.map((v,i)=>(v+hi[i])/2),m=node.getWorldMatrix();
   const [x,y,z]=center;centers[material]={x:m[0]*x+m[4]*y+m[8]*z+m[12],z:m[2]*x+m[6]*y+m[10]*z+m[14]};
  }
  assert(Math.abs(centers.navy.x)>Math.abs(centers.teal.x)+.4,'Backrest lies outside the seat, facing court');assert(Math.abs(centers.navy.z-centers.teal.z)<.02,'Bench runs parallel to sideline');
 }
 console.log('PASS',name,'both Blender benches face the court');
}
