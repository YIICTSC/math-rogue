import assert from 'node:assert/strict';import {build} from 'esbuild';
const r=await build({entryPoints:['src/mini-games/go-home-dash/rushTrack.ts'],bundle:true,write:false,platform:'node',format:'esm'});const {trackDepth}=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
for(const [spacing,count,near]of [[24,7,24],[30,5,30],[20,9,30],[22,9,30]]){
 const period=spacing*count;
 for(let i=0;i<count;i++){
  let passedHero=false,passedCamera=false,wraps=0,last=trackDepth(i,spacing,count,0,near);
  for(let phase=.25;phase<=period;phase+=.25){const z=trackDepth(i,spacing,count,phase,near);passedHero||=z>2;passedCamera||=z>11;if(z<last){wraps++;assert(last>11,'Recycle only behind camera');}else assert(Math.abs(z-last-.25)<1e-6,'Continuous motion');last=z;}
  assert(passedHero&&passedCamera);assert.equal(wraps,1,'One wrap per complete track cycle');assert.equal(last,trackDepth(i,spacing,count,0,near));
 }
 const positions=Array.from({length:count},(_,i)=>trackDepth(i,spacing,count,51.5,near)).sort((a,b)=>a-b);for(let i=1;i<count;i++)assert.equal(positions[i]-positions[i-1],spacing,'No missing road segment');
}
console.log('PASS every road, arch, roadside prop and island reaches the foreground continuously before recycling; spacing remains seamless');
