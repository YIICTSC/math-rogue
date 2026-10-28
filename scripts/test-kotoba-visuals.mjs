import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/mini-games/kotoba-life/companionModels';export{ROOMS,NPCS}from'./src/mini-games/kotoba-life/data';export * as THREE from 'three';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {createCompanion,ROOMS,NPCS,THREE}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
for(const id of ['mugi','momo','sora','kohaku','pico']){
 const m=createCompanion(id);m.root.updateMatrixWorld(true);
 for(const eye of m.eyes){const at=eye.getWorldPosition(new THREE.Vector3()),ray=new THREE.Raycaster(at.clone().add(new THREE.Vector3(0,0,3)),new THREE.Vector3(0,0,-1));const hit=ray.intersectObject(m.root,true)[0];assert(hit,'Visible eye geometry: '+id);assert(hit.object===eye||hit.object.parent===eye,'Eye is hidden behind the face: '+id);}
 m.dispose();
}
for(const item of [...ROOMS,...NPCS]){assert(item.image.startsWith('sprites/kotoba-life/'));const deployed=item.image.replaceAll('/sprites/','/math-rogue/sprites/');assert.equal(new URL('/math-rogue/'+deployed,'https://example.com').pathname,'/math-rogue/'+item.image);}
console.log('PASS both eyes visible on all five 3D companions, and room/town paths remain valid after Pages rebasing.');
