import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const catalog=await fs.readFile('src/three/protagonistCatalog.ts','utf8');
const ids=[...catalog.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
const expected=ids.flatMap(id=>id.startsWith('magic-')?[id,id+'-transformed']:[id]).sort();
const build=JSON.parse(await fs.readFile('assets/dungeons1/hero-actions-build.json','utf8'));
const partial=process.argv.includes('--partial');
assert.equal(ids.length,35);assert.equal(expected.length,52);
if(partial){assert(build.assets.length>0);for(const asset of build.assets)assert(expected.includes(asset.key));}
else assert.deepEqual(build.assets.map(a=>a.key).sort(),expected);
assert.equal(build.frameCount,build.assets.length*64);assert.equal(build.cell,96);
assert.deepEqual(build.columns,['S','N','E','W','SE','SW','NE','NW']);
const web=JSON.parse(await fs.readFile('public/web-asset-manifest.json','utf8'));
const android=JSON.parse(await fs.readFile('public/android-asset-pack-manifest.json','utf8'));
const atlasHashes=new Set();let frames=0;
for(const asset of build.assets){
 const bytes=await fs.readFile(asset.output);
 assert.equal(sha(bytes),asset.sha256,asset.key+': atlas hash');
 assert(!atlasHashes.has(asset.sha256),asset.key+': reused another character atlas');atlasHashes.add(asset.sha256);
 assert.equal(sha(await fs.readFile(asset.reference)),asset.referenceSha256,asset.key+': wrong reference');
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,768);assert.equal(info.height,768);
 const hashes=[];
 for(let row=0;row<8;row++)for(let dir=0;dir<8;dir++){
  let visible=0;const frame=Buffer.alloc(96*96*4);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const index=((row*96+y)*768+dir*96+x)*4;
   data.copy(frame,(y*96+x)*4,index,index+4);
   if(data[index+3]>80){visible++;assert(x>0&&x<95&&y>0&&y<95,`${asset.key}: clipping at ${row}/${dir}`);}
  }
  assert(visible>60,`${asset.key}: empty ${row}/${dir}`);hashes.push(sha(frame));frames++;
 }
 for(let dir=0;dir<8;dir++){
  assert.notEqual(hashes[dir],hashes[8+dir],`${asset.key}: identical footsteps ${dir}`);
  assert(new Set(hashes.filter((_,i)=>i%8===dir)).size>=7,`${asset.key}: missing distinct actions ${dir}`);
 }
 for(const manifest of [web,android]){
  const matches=Object.values(manifest.packs).flatMap(p=>p.files).filter(f=>f.path===asset.output.slice(7));
  assert.equal(matches.length,1,asset.key+': missing or duplicate asset pack entry');
  assert.equal(matches[0].size,bytes.length);if(matches[0].sha256)assert.equal(matches[0].sha256,asset.sha256);
 }
}
console.log(`PASS: ${new Set(build.assets.map(a=>a.heroId)).size} individual heroes, ${build.assets.filter(a=>a.transformed).length} transformed forms, ${frames} painted frames; unique identities, footsteps, action poses, references, no clipping and matching Web/Android packs.`);
