import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
const build=JSON.parse(await fs.readFile('assets/go-home-dash/visual-build.json','utf8'));
const heroSource=await fs.readFile('src/mini-games/go-home-dash/heroes.ts','utf8');
const ids=[...heroSource.matchAll(/"([\w-]+)":/g)].map(m=>m[1]);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(build.generator,'ImageGen');assert.equal(build.records.length,29);
assert.deepEqual(build.records.filter(r=>r.kind==='slide').map(r=>r.id).sort(),ids.sort());
const unique=new Set();let checked=0;
for(const record of build.records){
 const bytes=await fs.readFile(record.output);assert.equal(hash(bytes),record.output_sha256,record.id);
 const meta=await sharp(bytes).metadata();assert.equal(meta.hasAlpha,true);
 const slide=record.kind==='slide',cols=slide?2:4,rows=slide?1:4,w=slide?160:256,h=slide?80:256;
 assert.equal(meta.width,w*cols);assert.equal(meta.height,h*rows);
 if(slide)assert.equal(hash(await fs.readFile(record.reference)),record.reference_sha256);
 for(let i=0;i<cols*rows;i++){
  const data=await sharp(bytes).extract({left:i%cols*w,top:Math.floor(i/cols)*h,width:w,height:h}).ensureAlpha().raw().toBuffer();
  let opaque=0,x0=w,x1=-1,y0=h,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>48){opaque++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  assert.ok(opaque>180,record.id+' empty frame');assert.ok(x0>0&&x1<w-1&&y0>0&&y1<h-1,record.id+' clipped frame');
  if(slide){assert.ok(y1>=71&&y1<=74,record.id+' inconsistent feet anchor');assert.ok(y1-y0<=46,record.id+' slide too tall');}
  const sha=hash(data);assert.ok(!unique.has(sha),record.id+' duplicate frame');unique.add(sha);checked++;
 }
}
console.log(`Verified ${checked} unique transparent frames: 26 two-frame slides and 48 enemy/item/hazard sprites, source references and output hashes.`);
