import assert from 'node:assert/strict';import fs from 'node:fs/promises';import sharp from 'sharp';import {build} from 'esbuild';
const result=await build({stdin:{contents:"export {HEROES} from './src/mini-games/lantern-war/roster';export {PERSONAL_TECHNIQUES} from './src/mini-games/lantern-war/techniques';export {cutin} from './src/mini-games/lantern-war/art';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',define:{'import.meta.env':'{}'}});
const {HEROES,PERSONAL_TECHNIQUES,cutin}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const images=new Set(),digests=new Set();const manifest=JSON.parse(await fs.readFile('assets/lantern-war/technique-cutins.json','utf8'));assert.equal(manifest.length,HEROES.length);
for(const hero of HEROES){const entry=manifest.find(e=>e.id===hero.id);assert(entry);assert(Object.values(entry.gutters).every(n=>n>=8),'Source cells must have a genuinely empty gutter');const skills=[...PERSONAL_TECHNIQUES[hero.id],{id:'ultimate',name:hero.skill}];
 for(const [i,skill] of skills.entries()){
  const path=cutin(hero.id,skill.name);assert.equal(path,`sprites/lantern-war/cutins/${hero.id}-${skill.id}.webp`);assert(!images.has(path));images.add(path);assert.equal(entry.frames[i].file,'public/'+path);assert(!digests.has(entry.frames[i].sha256));digests.add(entry.frames[i].sha256);
  const {data,info}=await sharp('public/'+path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let count=0,margin=24,x0=816,y0=816,x1=0,y1=0;
  assert.equal(info.width,816);assert.equal(info.height,816);assert.equal(entry.frames[i].visibleLongEdgeTarget,720);assert(entry.frames[i].normalizationScale<=2.5);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const alpha=data[(y*info.width+x)*4+3];if(alpha>32){count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);assert(x>=margin&&x<info.width-margin&&y>=margin&&y<info.height-margin,`${path}: VFX must fit inside safe area`);}}
  const visibleLongEdge=Math.max(x1-x0+1,y1-y0+1);assert(visibleLongEdge>=704&&visibleLongEdge<=730,`${path}: inconsistent visible illustration size ${visibleLongEdge}`);
  assert(count>5000,path+' must contain visible illustration');
 }
}
assert.equal(images.size,160);assert.equal(cutin('enemy-1','裂界の奥義'),null);console.log('PASS 40 heroes, 120 personal techniques + 40 signature ultimates: unique image routing, visible RGBA art, safe transparent margins.');
