/** Publish only a complete, independently checked bank; preserve unrelated asset entries. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const plan=await read('assets/academy-sports/broadcast-plan.json');
const build=await read('assets/academy-sports/broadcast-build.json');
const review=await read('assets/academy-sports/broadcast-review.json');
const runtime=await read('src/mini-games/academy-sports/broadcastPlan.json');
assert.deepEqual(runtime.exchanges,plan.exchanges);
assert.deepEqual(runtime.lines.map(({id,role,text})=>({id,role,text})),plan.lines.map(({id,role,text})=>({id,role,text})));
const manifest={};const files=[];
for(const [role] of Object.entries(plan.speakers)){
 const ref=build.references[role];assert(ref&&review.references[role]?.accepted&&review.references[role].kana_similarity>=95,`Unreviewed reference: ${role}`);
 assert.equal(ref.text,plan.speakers[role].referenceText);assert.equal(ref.caption,plan.speakers[role].caption);
 assert.equal(sha(await fs.readFile(ref.path)),ref.sha256);assert.equal(review.references[role].sha256,ref.sha256);
}
for(const line of plan.lines){
 const c=build.clips[line.id],r=review.clips[line.id];assert(c&&r?.accepted&&r.kana_similarity>=(line.role==='referee'?95:90),`Unreviewed clip: ${line.id}`);
 assert(!build.failures[line.id],`Unresolved generation failure: ${line.id}`);
 assert.equal(c.text,line.text);assert.equal(c.caption,plan.speakers[line.role].caption);assert([plan.model,plan.referenceModel].includes(c.model));assert.equal(c.reference_sha256,build.references[line.role].sha256);
 assert.equal(c.model_device,'cpu');assert.equal(c.codec_device,'cpu');assert.equal(r.sha256,c.sha256);
 if(c.trim){assert.equal(sha(await fs.readFile(c.trim.source)),c.trim.source_sha256);assert(c.trim.end_seconds>c.trim.start_seconds);}
 const buffer=await fs.readFile(c.path);assert.equal(sha(buffer),c.sha256);
 assert.equal(c.path,`public/sfx/academy-broadcast/${line.id}.ogg`);
 manifest[line.id]={path:c.path.slice(7),seconds:r.seconds};
 files.push({path:c.path.slice(7),size:buffer.length,revision:c.sha256});
}
assert.equal(Object.keys(manifest).length,78);
if(process.argv.includes('--check')){assert.deepEqual(await read('src/mini-games/academy-sports/broadcastVoices.generated.json'),manifest);console.log('PASS all 78 released audio/reference hashes, CPU provenance and review records.');process.exit(0);}
await fs.writeFile('src/mini-games/academy-sports/broadcastVoices.generated.json',JSON.stringify(manifest,null,2)+'\n');
// Web manifest is generated/ignored. Merge this bank without dropping files absent
// from a sparse checkout. Hash matches generate-web-asset-manifest.mjs exactly.
try{
 const web=await read('public/web-asset-manifest.json');
 for(const pack of Object.values(web.packs))pack.files=pack.files.filter(f=>!f.path.startsWith('sfx/academy-broadcast/'));
 web.packs.common.files.push(...files);
 const hash=createHash('sha256');
 for(const pack of Object.values(web.packs)){
  pack.files.sort((a,b)=>a.path.localeCompare(b.path,'en'));pack.totalBytes=pack.files.reduce((n,f)=>n+f.size,0);
  hash.update(`${pack.id}:${pack.totalBytes}\n`);for(const f of pack.files)hash.update(`${f.path}\0${f.size}\0${f.revision}\n`);
 }
 web.contentVersion=hash.digest('hex').slice(0,16);await fs.writeFile('public/web-asset-manifest.json',JSON.stringify(web)+'\n');
}catch(e){if(e.code!=='ENOENT')throw e;}
const android=spawnSync(process.execPath,['scripts/generate-android-asset-manifest.mjs','--update-prefix','sfx/academy-broadcast/'],{stdio:'inherit'});assert.equal(android.status,0);
console.log(`Activated ${files.length} reviewed original sports broadcast clips.`);
