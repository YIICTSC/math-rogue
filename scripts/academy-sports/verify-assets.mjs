import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';

const meshReport=JSON.parse(await fs.readFile('assets/academy-sports/asset-build.json','utf8'));
const soundReport=JSON.parse(await fs.readFile('assets/academy-sports/sound-build.json','utf8'));
const web=JSON.parse(await fs.readFile('public/web-asset-manifest.json','utf8'));
const android=JSON.parse(await fs.readFile('public/android-asset-pack-manifest.json','utf8'));
const webFiles=new Map(Object.values(web.packs).flatMap(p=>p.files).map(f=>[f.path,f]));
const androidFiles=new Map(Object.values(android.packs).flatMap(p=>p.files).map(f=>[f.path,f]));
assert.equal(meshReport.files.length,9);
assert.equal(soundReport.files.length,64);
const io=new NodeIO();let total=0;
for(const entry of [...meshReport.files,...soundReport.files]){
 const bytes=await fs.readFile(entry.path),digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(bytes.length,entry.bytes,entry.path+' byte count');
 assert.equal(digest,entry.sha256,entry.path+' SHA-256');
 const relative=entry.path.slice('public/'.length);
 assert.equal(webFiles.get(relative)?.revision,digest,relative+' web registration');
 if(!relative.startsWith('web-audio/'))assert.equal(androidFiles.get(relative)?.sha256,digest,relative+' Android registration');
 if(relative.endsWith('.glb')){
  assert(bytes.length<5*1024*1024,relative+' mobile download budget');
  const doc=await io.read(entry.path),root=doc.getRoot();let triangles=0;
  for(const mesh of root.listMeshes())for(const primitive of mesh.listPrimitives()){
   const count=primitive.getIndices()?.getCount()??primitive.getAttribute('POSITION').getCount();
   triangles+=count/3;
  }
  assert(triangles>100&&triangles<150000,relative+' useful bounded geometry');
  const names=new Set(root.listNodes().map(n=>n.getName()));
  if(relative.endsWith('/equipment.glb'))for(const name of ['Baseball','SoccerBall','VolleyBall','Bat','Glove','Helmet','CatcherGear','BaseballJersey','SoccerJersey','VolleyJersey','FestivalJersey','KneePad','Hurdle','MovingGate','FloorTile','RollingBall','Target','Trophy','Boost','Medkit','ThrowBall','ShockStar'])assert(names.has(name),'Used equipment '+name);
  if(relative.endsWith('/festival-target.glb'))for(let i=0;i<8;i++)assert(names.has('TargetPlatform'+i),'Independently animated platform');
 }else{
  assert(entry.duration>0&&entry.duration<2,'Short, bounded SFX');
  assert(bytes.length>500,'Non-empty encoded audio');
  if(relative.endsWith('.ogg'))assert.equal(bytes.subarray(0,4).toString(),'OggS');
 }
 total+=bytes.length;
}
console.log(`PASS 9 original GLBs + 32 MP3/Opus SFX pairs, hashes, named runtime equipment, geometry budgets and Web/Android registration (${(total/1024/1024).toFixed(1)} MiB).`);
