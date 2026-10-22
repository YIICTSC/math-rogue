import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const build=JSON.parse(await fs.readFile('assets/go-home-dash/parallax-build.json','utf8'));
assert.equal(build.records.length,14);assert.equal(new Set(build.records.map(r=>r.route)).size,7);
assert.equal(hash(await fs.readFile(build.script)),build.script_sha256);
assert.equal((await fs.readFile(build.editableScene)).subarray(0,7).toString(),'BLENDER');
const unique=new Set();
for(const record of build.records){
 const bytes=await fs.readFile(record.output);assert.equal(hash(bytes),record.sha256);assert.ok(!unique.has(record.sha256));unique.add(record.sha256);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1280);assert.equal(info.height,640);
 let opaque=0,transparent=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const alpha=data[(y*info.width+x)*4+3];if(alpha>128)opaque++;if(alpha===0)transparent++;
  if(x<2||x>=info.width-2)assert.equal(alpha,0,record.output+' clipped repeat edge');
 }
 assert.ok(opaque>1500&&transparent>info.width*info.height*.45,record.output+' invalid transparency');
}
console.log('Verified 14 distinct transparent Blender layers, seven routes, clear repeat edges, source hash and editable Blender scene.');
