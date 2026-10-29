import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/mini-games/kotoba-life/companionModels';export{ROOMS,NPCS}from'./src/mini-games/kotoba-life/data';export * as THREE from 'three';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {createCompanion,animateCompanion,ROOMS,NPCS,THREE}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
for(const id of ['mugi','momo','sora','kohaku','pico']){
 const m=createCompanion(id);m.root.updateMatrixWorld(true);
 for(const eye of m.eyes){const at=eye.getWorldPosition(new THREE.Vector3()),ray=new THREE.Raycaster(at.clone().add(new THREE.Vector3(0,0,3)),new THREE.Vector3(0,0,-1));const hit=ray.intersectObject(m.root,true)[0];assert(hit,'Visible eye geometry: '+id);assert(hit.object===eye||hit.object.parent===eye,'Eye is hidden behind the face: '+id);}
 let triangles=0,meshes=0;const geometries=new Set(),materials=new Set(),textures=new Set();
 m.root.traverse(object=>{if(!object.isMesh)return;meshes++;const g=object.geometry;geometries.add(g);triangles+=(g.index?.count??g.attributes.position.count)/3;
  for(const key of ['position','normal'])if(g.attributes[key])for(const value of g.attributes[key].array)assert(Number.isFinite(value),id+': finite '+key);
  for(const mat of [object.material].flat()){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}
 });
 assert(triangles<210000,id+': bounded single-character triangle budget');assert(meshes<125,id+': batched fibers avoid a draw call per hair');
 assert(textures.size===3,id+': only three small procedural material maps');
 assert.equal(new Set([...textures].map(t=>t.source)).size,3,id+': albedo must not overwrite the fur height map');
 for(const reaction of ['idle','wave','eat','joy','dance','think','sleep','shy','walk','surprise']){
  for(const reduced of [true,false]){animateCompanion(m,2.4,reaction,1.2,reduced);m.root.updateMatrixWorld(true);m.root.traverse(object=>assert(object.matrixWorld.elements.every(Number.isFinite),id+': valid '+reaction+' pose'));}
 }
 animateCompanion(m,2.4,'idle',9,false);for(const eye of m.eyes)assert(eye.scale.y>.01,id+': eyes reopen after sleep');
 const resources=[...geometries,...materials,...textures],disposed=new Set();for(const resource of resources)resource.addEventListener('dispose',()=>disposed.add(resource));
 m.dispose();assert.equal(disposed.size,resources.length,id+': all model geometry, materials and maps disposed');
 console.log(id+': '+meshes+' meshes, '+triangles+' triangles, '+textures.size+' material maps');
}
for(const item of [...ROOMS,...NPCS]){assert(item.image.startsWith('sprites/kotoba-life/'));const deployed=item.image.replaceAll('/sprites/','/math-rogue/sprites/');assert.equal(new URL('/math-rogue/'+deployed,'https://example.com').pathname,'/math-rogue/'+item.image);}
console.log('PASS both eyes visible on all five 3D companions, and room/town paths remain valid after Pages rebasing.');
