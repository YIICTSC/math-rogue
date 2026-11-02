import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import{build}from'esbuild';
const r=await build({entryPoints:['src/components/school-dungeon/techniques/voiceParts.ts'],bundle:true,write:false,platform:'node',format:'esm'}),V=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const bank=JSON.parse(fs.readFileSync('src/components/school-dungeon/techniques/voiceCuts.json')),audit=JSON.parse(fs.readFileSync('assets/technique-cuts/build.json'));
for(const [key,c]of Object.entries(bank.cues)){
 const name=V.techniqueVoiceParts(key,'combo',()=>0),first=V.techniqueVoiceParts(key,'combo-first',()=>0),end=V.techniqueVoiceParts(key,'finisher',()=>0),normal=V.techniqueVoiceParts(key,'normal',()=>0);
 assert(normal.length<=1);assert.deepEqual(first,end);if(c.name){assert.equal(name[0].path,c.name.path);assert.equal(end.at(-1).path,c.name.path);}for(const p of [...name,...first,...normal])assert(fs.existsSync('public/'+p.path),key+' missing file');
}
for(const [key,c]of Object.entries(bank.cues).filter(([k])=>k.startsWith('d2/'))){assert(c.name.path.includes(key.split('/')[1]));}
for(const [id,sha]of Object.entries(audit.hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`public/sfx/technique-cuts/${id}.ogg`)).digest('hex'),sha);
for(const row of audit.audit)if(row.source)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/'+row.source)).digest('hex'),row.source_sha256,'original recording remains unchanged');
assert.deepEqual(V.techniqueVoiceParts('d1/not-an-actor/fist-1'),[]);
const d2=JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-build.json')),review=JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-review.json'));
assert.equal(Object.keys(d2.clips).length,27);
for(const actor of new Set(Object.values(d2.clips).map(c=>c.actor))){assert.equal(bank.prefixes[actor].length,3);for(const mode of ['normal','combo-first','combo','finisher']){const parts=V.techniqueVoiceParts(`${actor}/sword-1`,mode,()=>0);assert.equal(parts.length,1);assert(parts[0].path.includes('d2-'+actor.slice(3)+'-intro-'));}}
for(const [id,c]of Object.entries(d2.clips)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/'+c.path)).digest('hex'),c.sha256);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(c.reference)).digest('hex'),c.reference_sha256);assert.equal(review[id]?.sha256,c.sha256);assert.equal(c.device,'cpu');assert.equal(c.codec_device,'cpu');assert(review[id].peak>.01&&review[id].clipped_fraction<.001);}
assert.deepEqual(V.techniqueVoiceParts('d2/lyria/not-a-technique'),[]);
console.log(`PASS: ${Object.keys(bank.cues).length} cues, all cut hashes, original sources unchanged, mode selection and actor boundaries.`);
