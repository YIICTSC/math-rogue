import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const bank=await read('src/mini-games/lantern-war/battleVoiceBank.json');
const manifest=await read('src/mini-games/lantern-war/voiceManifest.json');
const plan=await read('assets/lantern-war/cross-game-battle/voice-plan.json');
const record=await read('assets/lantern-war/cross-game-battle/voice-build.json');
const review=await read('assets/lantern-war/cross-game-battle/voice-review.json');
const catalog=await read('src/point-exchange/voiceCatalog.json');
const original=new Map(Object.values(manifest).map(c=>[c.path,c]));
const sha=b=>createHash('sha256').update(b).digest('hex');
const out=await build({stdin:{contents:`export * from './src/mini-games/lantern-war/voices';export * from './src/mini-games/lantern-war/battleVoiceClips';export * from './src/mini-games/lantern-war/battleVoiceLines';export * from './src/mini-games/lantern-war/techniques';export * from './src/mini-games/lantern-war/story';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'capture-audio',setup(b){b.onResolve({filter:/services\/audioService$/},()=>({path:'audio',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`export const audioService={canPlayConversationVoice:()=>!globalThis.__muted,playLanternWarVoiceFile:(...args)=>{globalThis.__calls.push(args);return Promise.resolve(true)},stopLanternWarVoices:()=>{}};`}));}}]});
const m=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
globalThis.__calls=[];
assert.equal(Object.keys(bank).length,12);
const files=new Map();let routes=0,reused=0;
for(const[actor,kinds]of Object.entries(bank)){
 assert.deepEqual(Object.keys(kinds).sort(),[...m.BATTLE_VOICE_KINDS].sort());
 for(const[kind,c]of Object.entries(kinds)){
  assert.match(c.id,/^[a-f0-9]{20}$/);assert(c.duration>0&&c.duration<30);assert(c.text);
  assert.equal(m.battleVoiceText(actor,kind),c.text);
  assert.deepEqual(m.battleVoiceClip(actor,kind),c);
  const before=__calls.length;m.battleVoice(actor,kind,actor+kind);assert.deepEqual(__calls.at(-1),[c.id,true]);assert.equal(__calls.length,before+1);
  m.battleVoice(actor,kind,actor+kind);assert.equal(__calls.length,before+1,'Duplicate event must not speak twice');
  files.set(c.path,c);
  assert(catalog.some(v=>v.actor===actor&&v.path===c.path&&v.id===c.id&&v.text===c.text),'Theater caption/file identity '+actor+kind);
  if(c.source!=='irodori-cpu'){reused++;if(original.has(c.path))assert.equal(c.id,original.get(c.path).id,'Preserve original recording ID');}
  if(actor.startsWith('dungeons2-'))assert(c.path.startsWith('sfx/dungeons2-voices/'+actor.slice(10)+'/'));
  routes++;
 }
 for(const t of m.PERSONAL_TECHNIQUES[actor]){
  const old=manifest[actor+'\n'+t.name+'！'];assert(old,'Original technique recording');assert.deepEqual(m.battleVoiceClip(actor,'technique',undefined,t.name),old);
 }
 assert(m.battleVoiceClip(actor,'technique',undefined,'unknown'),'Missing technique still has attack fallback');
}
for(const pair of m.SUPPORTS)for(const[actor,ally]of [[pair.a,pair.b],[pair.b,pair.a]])if(bank[actor]){
 const text=m.battleVoiceText(actor,'support',ally),c=m.battleVoiceClip(actor,'support',ally);
 assert.deepEqual(c,manifest[actor+'\n'+text]||bank[actor].support,'Unrecorded pair must use generic support');
}
let before=__calls.length;globalThis.__muted=true;m.battleVoice('mio','attack','mute');assert.equal(__calls.length,before);globalThis.__muted=false;m.battleVoice('enemy-mio','attack','enemy');assert.equal(__calls.length,before);
m.beginLanternBattleVoice();m.battleVoice('mio','attack','mioattack');assert.equal(__calls.length,before+1,'New battle resets event deduplication');
for(const[path,c]of files){
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1','public/'+path],{encoding:'utf8'}));assert(Math.abs(duration-c.duration)<.03,path);
 const raw=execFileSync('ffmpeg',['-v','error','-i','public/'+path,'-ac','1','-ar','16000','-f','f32le','-'],{maxBuffer:8*1024*1024});
 const data=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);let energy=0,peak=0;for(const x of data){assert(Number.isFinite(x));energy+=x*x;peak=Math.max(peak,Math.abs(x));}assert(Math.sqrt(energy/data.length)>.003&&peak<1.01,'Audible, unclipped waveform '+path);
}
for(const job of plan.clips){
 const c=record.clips[job.actor+':'+job.kind];assert(c);assert.equal(c.sha256,sha(await fs.readFile('public/'+job.path)));assert.equal(c.reference_sha256,sha(await fs.readFile(job.reference)));assert.equal(c.model_device,'cpu');assert.equal(c.codec_device,'cpu');assert.equal(c.text,job.text);
 const checked=review[job.actor+':'+job.kind];assert.equal(checked.sha256,c.sha256,'ASR review must cover delivered bytes');assert.equal(checked.device,'cpu');assert(!checked.needs_review);assert(checked.cer<=.2,'Unclear pronunciation '+job.actor+':'+job.kind);
}
assert.equal(plan.clips.length,13);assert.equal(routes,84);assert.equal(reused,71);assert.equal(files.size,75);
console.log(`PASS ${routes} battle routes for 12 heroes, ${reused} reused routes, 13 CPU-generated lines, all 75 unique OGG files decoded, technique/pair fallbacks, overlap, mute, deduplication and theater captions.`);
