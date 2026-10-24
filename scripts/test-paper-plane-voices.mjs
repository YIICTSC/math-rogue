import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
await build({entryPoints:['src/data/paperPlaneBridge.ts'],outfile:'tmp/paper-plane-voice-index.mjs',bundle:true,platform:'node',format:'esm'});
const {PAPER_VOICE_MS,paperBridgeVoice,PAPER_BRIDGE_LINES,PAPER_RIVALS,PAPER_DEPUTY_ENGLISH}=await import('../tmp/paper-plane-voice-index.mjs');
const plan=JSON.parse(fs.readFileSync('assets/paper-plane/bridge-voice-plan.json')),record=JSON.parse(fs.readFileSync('assets/paper-plane/bridge-voice-build.json')),qa=JSON.parse(fs.readFileSync('assets/paper-plane/voice-speech-qa.json'));
assert.equal(Object.keys(PAPER_VOICE_MS).length,plan.total_clips);assert.deepEqual(Object.keys(PAPER_DEPUTY_ENGLISH).sort(),plan.characters.filter(c=>c.role==='deputy').map(c=>c.id).sort());assert.deepEqual(Object.keys(PAPER_BRIDGE_LINES).sort(),plan.characters.map(c=>c.id).sort());assert.deepEqual(PAPER_RIVALS.map(r=>r.id),plan.characters.filter(c=>c.role==='rival').map(c=>c.id));assert.equal(Object.keys(record.clips).length,plan.total_clips);assert.equal(Object.keys(qa.clips).length,plan.total_clips);
const playback=JSON.parse(fs.readFileSync('assets/paper-plane/voice-playback-qa.json'));assert.deepEqual(Object.keys(playback.clips).sort(),Object.keys(record.clips).sort());
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hashes=new Set();
const expected=plan.characters.flatMap(c=>Object.keys(c.lines).map(key=>c.id+'/'+key+'.ogg')).sort();const actual=fs.readdirSync('public/sfx/paper-plane-voices',{recursive:true}).filter(p=>fs.statSync('public/sfx/paper-plane-voices/'+p).isFile()).map(p=>p.replaceAll('\\','/')).sort();assert.deepEqual(actual,expected,'No missing or temporary deliverables');
for(const c of plan.characters){assert.equal(sha(c.reference),c.reference_sha256);for(const [key,text]of Object.entries(c.lines)){
 const id=c.id+'/'+key,clip=record.clips[id],sound=paperBridgeVoice(c.id,key),proof=qa.clips[id];assert(sound,id);assert.equal(clip.output,'public/'+sound.path);assert.equal(sha('public/'+sound.path),clip.sha256);assert(!hashes.has(clip.sha256),id);hashes.add(clip.sha256);assert.equal(clip.text,text);assert.equal(PAPER_BRIDGE_LINES[c.id][key],text);assert.equal(clip.reference_sha256,c.reference_sha256);assert.equal(clip.model_device,'cpu');assert.equal(clip.codec_device,'cpu');assert(clip.silentcipher_watermark);assert.equal(clip.irodori_revision,plan.latest_code_checked);assert.equal(clip.checkpoint_sha256,record.models[clip.model].checkpoint_sha256);assert.equal(clip.sha256,proof.sha256);assert(proof.similarity>=.85,id);assert.equal(playback.clips[id].sha256,clip.sha256,id);assert.equal(PAPER_VOICE_MS[id],playback.clips[id].browser_ms,id);assert(Math.abs(PAPER_VOICE_MS[id]-clip.seconds*1000)<250,id);assert.equal(sound.maxDurationMs,PAPER_VOICE_MS[id]+500);
}}
const phrases=JSON.parse(fs.readFileSync('assets/paper-plane/voice-keyphrase-qa.json'));
assert.deepEqual(phrases.failed,[],'Every requested catchphrase must be clear');
const phraseKeys=plan.characters.flatMap(c=>Object.entries(c.lines).filter(([,text])=>/迂闊な|撃ち方|左舷ブラスター|回避|通さん/.test(text)).map(([key])=>c.id+'/'+key)).sort();
assert.deepEqual(Object.keys(phrases.clips).sort(),phraseKeys);
for(const id of phraseKeys){const proof=phrases.clips[id];assert.equal(proof.sha256,record.clips[id].sha256,id);assert.deepEqual(proof.missing,[],id);assert(proof.required_readings.length>0,id);for(const reading of proof.required_readings)assert(proof.normalized.includes(reading),id);}
assert.equal(paperBridgeVoice('../unknown','fire'),null);assert.equal(paperBridgeVoice('high-school-warrior','../fire'),null);
console.log(JSON.stringify({characters:56,voiceClips:hashes.size,cpuOnly:true,watermark:true,speechQA:true,keyphraseClips:phraseKeys.length,measuredDurations:true}));
