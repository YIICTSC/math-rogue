import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import sharp from 'sharp';

const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const plan=await read('assets/dialogue/cast.json'),generation=await read('assets/dialogue/generation.json'),layout=await read('assets/dialogue/atlas-layouts.json');
async function moduleOf(path){const r=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {DIALOGUE_PORTRAITS:portraits}=await moduleOf('src/data/dialoguePortraits.generated.ts');
const {CHRONICLE_HEROES:heroes,CHRONICLE_ROUTES:routes}=await moduleOf('src/components/school-dungeon/chronicles/story.ts');
const {starDialogue,conversationWords}=await moduleOf('src/mini-games/star-tide/conversation.ts');
const {JOURNEY_TALKS,ROOM_TALKS}=await moduleOf('src/mini-games/star-tide/quests.ts');
assert.deepEqual(plan.expressions,['neutral','joy','concern','resolve']);
assert.equal(plan.cast.length,78);assert.equal(generation.records.length,39);assert.deepEqual(generation.failures,[]);assert.equal(layout.reports.length,39);
assert.equal(new Set(plan.cast.map(a=>a.id)).size,78);
assert.deepEqual(Object.keys(portraits).sort(),plan.cast.map(a=>a.id).sort());
for(const hero of heroes)assert(portraits[hero.id],hero.id);
for(const route of routes)assert(portraits['chronicle-'+route.id.toLowerCase()],route.id);
let frames=0,bytes=0;
for(const batch of plan.batches){
 const report=layout.reports.find(r=>r.id===batch.id),source=generation.records.find(r=>r.id===batch.id);
 assert.deepEqual(source.actors,batch.actors);assert.deepEqual(report.actors,batch.actors);
 const file=await fs.readFile('public/'+report.output),raw=await fs.readFile(report.raw),meta=await sharp(file).metadata();
 assert.equal(createHash('sha256').update(file).digest('hex'),report.sha256);assert.equal(createHash('sha256').update(raw).digest('hex'),report.rawSha256);
 assert(report.output.includes(report.sha256.slice(0,10)),'art URLs are immutable');
 assert.equal(meta.width,1536);assert.equal(meta.height,1152);assert(meta.hasAlpha,'transparent portrait atlas');bytes+=file.length;
 for(const[row,id]of batch.actors.entries()){
  const actor=portraits[id];assert.equal(actor.sheet,report.output);assert.equal(actor.row,row);assert(actor.name&&actor.en&&!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(actor.en),'localized name '+id);
  const hashes=new Set();
  for(let column=0;column<4;column++){
   const image=sharp(file).extract({left:column*384,top:row*576,width:384,height:576}),{data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let opaque=0,transparent=0;for(let i=3;i<data.length;i+=info.channels){if(data[i]>40)opaque++;if(data[i]===0)transparent++;}
   assert(opaque>8000&&transparent>8000,'visible character and transparent margin '+id);hashes.add(createHash('sha256').update(data).digest('hex'));frames++;
  }
  assert.equal(hashes.size,4,'each expression has its own illustration '+id);
  const rowFrames=report.frames.filter(f=>f.row===row);assert.equal(new Set(rowFrames.map(f=>f.scale)).size,1,'one character scale across moods');assert.equal(new Set(rowFrames.map(f=>f.anchor)).size,1,'one horizontal head anchor across moods');
 }
}
assert.equal(frames,312);assert(bytes<50*1024*1024,'runtime portrait budget');
const catalog=await read('src/mini-games/star-tide/voiceCatalog.json');let talks=0;
for(let chapter=0;chapter<12;chapter++)for(const room of ['journey','room-0','room-1','room-2']){
 const id=`npc-${chapter}-${room}`,speaker=catalog[id].speaker;
 for(const en of[false,true]){
  const scene=starDialogue(chapter,id,en);assert(portraits[scene.left.id]&&portraits[scene.right.id],id);
  assert.equal(scene.left.id,'star-nagi');assert.equal(scene.active,speaker==='narrator'?'narrator':speaker==='nagi'?'left':'right');
  if(speaker!=='nagi'&&speaker!=='narrator')assert.equal(scene.right.id,'star-'+speaker);
  const raw=(room==='journey'?JOURNEY_TALKS[chapter]:ROOM_TALKS[chapter][Number(room.slice(-1))])[en?1:0],words=conversationWords(raw);
  assert(words.length>10&&raw.includes(words),'speaker prefix removal preserves the complete speech');
 }
 talks++;
}
assert.equal(talks,48);assert.equal(starDialogue(6,'npc-6-journey',false).right.echo,true);
console.log(`PASS: 78 cast members, ${frames} distinct transparent reaction frames, original art/hash integrity, stable anchors/scales, ${(bytes/1024/1024).toFixed(2)} MiB, all 48 existing NPC speakers in Japanese and English.`);
