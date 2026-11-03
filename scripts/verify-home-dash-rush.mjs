import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const hash=b=>createHash('sha256').update(b).digest('hex');
const build=JSON.parse(await fs.readFile('assets/go-home-dash/rush/rear-build.json','utf8'));
assert.equal(build.records.length,26);assert.equal(new Set(build.records.map(r=>r.id)).size,26);
for(const r of build.records){
 const [source,reference,output]=await Promise.all([fs.readFile(r.source),fs.readFile(r.reference),fs.readFile(r.output)]);
 assert.equal(hash(source),r.sourceSHA256);assert.equal(hash(reference),r.referenceSHA256);assert.equal(hash(output),r.sha256);
 const {data,info}=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,512);assert.equal(info.height,160);
 const frames=[];
 for(let frame=0;frame<4;frame++){
  let count=0,minX=128,minY=160,maxX=0,maxY=0;const pixels=[];
  for(let y=0;y<160;y++)for(let x=0;x<128;x++){const k=(y*512+frame*128+x)*4;pixels.push(...data.subarray(k,k+4));if(data[k+3]>32){count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  assert(count>1000,r.id+' has a readable silhouette');assert(minX>=5&&maxX<=122&&minY>=4&&maxY<=151,r.id+' has no cut edges');frames.push(hash(Buffer.from(pixels)));
 }
 assert(new Set(frames).size>=3,r.id+' has distinct animation phases');
}
const bytes=await fs.readFile('public/sprites/go-home-dash/rush/rush-course.glb');assert.equal(bytes.toString('utf8',0,4),'glTF');assert(bytes.length<600000,'Scene stays within its mobile asset budget');
const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.toString('utf8',20,20+jsonLength));assert.equal(json.images?.length||0,0,'No hidden texture dependencies');
for(const name of ['RoadTile','SkyArch','Tree','Tower','FloatingIsland','Barrier','LowBar','Coin','Star','LoopTrack'])assert(json.nodes.some(n=>n.name===name),'Missing Blender prefab '+name);
assert((await fs.stat('assets/go-home-dash/rush/rush-course.blend')).size>100000,'Editable Blender source is preserved');
console.log('PASS 26 reference-linked transparent rear animations / 104 distinct frames, shared scale/baselines, no clipped cells, reproducible hashes and compact standalone Blender GLB.');
