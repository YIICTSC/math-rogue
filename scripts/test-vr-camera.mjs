import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
import * as T from 'three';
await mkdir('tmp',{recursive:true});
for(const [name,entry] of [['camera','camera'],['world','onlineEngine']])await build({entryPoints:[`src/mini-games/gakurogear/${entry}.ts`],outfile:`tmp/vr-view-${name}.mjs`,bundle:true,platform:'node',format:'esm',packages:'external'});
const {frameArena,followArena,collisionSafeCamera,cameraBlend}=await import('../tmp/vr-view-camera.mjs');
const {createWorld,addPlayer,startWorld}=await import('../tmp/vr-view-world.mjs');
const lesson={title:'Test',questions:[{id:'1',mode:'ADDITION',question:'1+1',options:['2','3'],correct:0}]};
const visible=(camera,p)=>new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).containsPoint(p);
let spawns=0,corners=0;
for(const mode of ['coop','royale','bomb'])for(const count of [2,10,20,40]){
 const w=createWorld(mode,1,lesson);for(let i=0;i<count;i++)assert(addPlayer(w,String(i),'P'+i));assert(startWorld(w,20261014));
 for(const {width,height} of [{width:1280,height:587},{width:390,height:638},{width:844,height:346}]){
  const camera=new T.OrthographicCamera(),aspect=width/height,half=w.bombArena?w.bombArena.side*1.8/2:(w.mission.size??8)+.6,tilt=mode==='bomb'?20/65:.625;
  frameArena(camera,half,aspect,3,tilt);
  for(const x of [-half,half])for(const y of [0,3])for(const z of [-half,half]){assert(visible(camera,new T.Vector3(x,y,z)),`${mode}/${count}: full-map corner cropped ${width}x${height}`);corners++;}
  for(const p of Object.values(w.players)){
   const focus=new T.Vector3(p.run.player.x,0,p.run.player.z);
   assert(visible(camera,focus),`${mode}/${count}: spawn outside overview`);
   followArena(camera,focus,aspect,10,tilt,half);
   assert(visible(camera,focus.clone().add(new T.Vector3(0,1.6,0))),`${mode}/${count}: followed player invisible`);spawns++;
   frameArena(camera,half,aspect,3,tilt);
  }
 }
}
// Original 40-player royale spawn (0,0,86) was behind its fixed camera.
const c=new T.OrthographicCamera();followArena(c,new T.Vector3(0,0,86),1.5);assert(visible(c,new T.Vector3(0,1,86)));
const focus=new T.Vector3(0,1.38,0),desired=new T.Vector3(0,2.88,-3.8);
const safe=collisionSafeCamera(focus,desired,p=>p.z<=-1);assert(safe.z>-1&&safe.z<-.8,'Chase camera must stop before wall');
assert(collisionSafeCamera(focus,desired,()=>false).equals(desired));
assert.equal(cameraBlend(.016,true),1);assert(cameraBlend(.016,false)>0&&cameraBlend(.016,false)<1);
console.log(`PASS: ${spawns} player-spawn checks, ${corners} full-map wall corners across three aspect ratios, camera collision, reduced motion.`);
