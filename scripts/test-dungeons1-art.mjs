import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const build=JSON.parse(await fs.readFile('assets/dungeons1/hero-actions.json','utf8'));
const data=await fs.readFile(build.output);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),build.sha256);
const {data:raw,info}=await sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,768);assert.equal(info.height,768);
const cells=[];
for(let i=0;i<64;i++){
 const frame=await sharp(data).extract({left:i%8*96,top:Math.floor(i/8)*96,width:96,height:96}).ensureAlpha().raw().toBuffer();let visible=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(frame[(y*96+x)*4+3]>80){visible++;assert(x>0&&x<95&&y>0&&y<95,'clipped '+i);}
 assert(visible>100,'empty '+i);cells.push(frame);
}
for(let dir=0;dir<8;dir++)assert(!cells[dir].equals(cells[dir+8]),'identical footstep '+dir);
const web=JSON.parse(await fs.readFile('public/web-asset-manifest.json','utf8')),android=JSON.parse(await fs.readFile('public/android-asset-pack-manifest.json','utf8'));
for(const manifest of [web,android]){const entry=Object.values(manifest.packs).flatMap(p=>p.files).find(f=>f.path===build.output.slice(7));assert(entry,'new atlas missing from asset pack');assert.equal(entry.size,data.length);if(entry.sha256)assert.equal(entry.sha256,build.sha256);}
console.log('PASS: 64 painted action frames, unique footsteps, no clipping, matching Web/Android asset packs.');
