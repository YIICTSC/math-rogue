import assert from 'node:assert/strict';import fs from 'node:fs/promises';import sharp from 'sharp';import crypto from 'node:crypto';import {build} from 'esbuild';
const b=await build({entryPoints:['src/components/school-dungeon/dungeons2/mapMaterials.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env':'{}'}}),m=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile('assets/dungeons-map-materials/build.json','utf8'));assert.equal(manifest.records.length,22);assert.deepEqual(manifest.records.map(r=>r.route),[...m.MAP_MATERIAL_ROUTES]);
const masks=await sharp('public/sprites/dungeons2/world/walls.webp').ensureAlpha().raw().toBuffer(),hashes=new Set();
for(const r of manifest.records){for(const[path,hash]of[[r.source,r.sourceSha256],[r.output,r.sha256],[r.wallOutput,r.wallSha256]])assert.equal(sha(await fs.readFile(path)),hash);assert(!hashes.has(r.sha256));hashes.add(r.sha256);const meta=await sharp(r.output).metadata();assert.equal(meta.width,512);assert.equal(meta.height,512);
 const raw=await sharp(r.output).ensureAlpha().raw().toBuffer(),cells=new Set();for(let i=0;i<64;i++){const buf=await sharp(r.output).extract({left:i%8*64,top:Math.floor(i/8)*64,width:64,height:64}).raw().toBuffer();cells.add(sha(buf));}assert.equal(cells.size,64,r.route+' unique authored cells');
 const wall=await sharp(r.wallOutput).ensureAlpha().raw().toBuffer();for(let v=0;v<24;v++)for(let mask=0;mask<16;mask++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)assert.equal(wall[((v*32+y)*512+mask*32+x)*4+3],masks[((Math.floor(mask/4)*32+y)*128+mask%4*32+x)*4+3],r.route+' wall collision silhouette changed');
 assert.equal(m.materialRoute({mode:r.route}),r.route);assert.equal(m.materialRoute({mode:r.route,town:true}),undefined);assert.equal(m.materialRoute({mode:r.route,scene:0}),undefined);
}
const floors=new Set(),walls=new Set();for(let f=1;f<=64;f++){
 const floor=m.floorMaterialIndex(0,0,f),wall=m.wallMaterialVariant(0,0,f);
 floors.add(floor);walls.add(wall);
 for(let y=0;y<40;y++)for(let x=0;x<40;x++){
  assert.equal(m.floorMaterialIndex(x,y,f),floor,'adjacent floor tiles share the same material');
  assert.equal(m.wallMaterialVariant(x,y,f,false),wall,'wall tiles share the same material');
  assert.equal(m.wallMaterialVariant(x,y,f,true),wall,'exposed wall faces retain the floor palette');
 }
}
assert.equal(floors.size,4);assert.equal(walls.size,8);assert.equal(m.materialRoute({mode:'unknown'}),undefined);
console.log('PASS: 22 dedicated atlases, 1408 distinct authored cells, source/delivery hashes, consistent floor and wall materials across each floor, and 8,448 derived wall silhouettes preserve original corner alpha.');
