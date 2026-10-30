import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';

// Explicit user authorization: recover only the narrator from before the voice reset.
const sourceCommit='eb381b05238074b7df5626e4afee6739092498f1';
const recordPath='assets/lantern-war/restored-narration.json';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const historic=path=>execFileSync('git',['show',sourceCommit+':'+path],{maxBuffer:32*1024*1024});
const readHistoric=name=>JSON.parse(historic('assets/lantern-war/'+name+'.json'));
if(!process.argv.includes('--verify')){
 const plan=readHistoric('voice-plan'),build=readHistoric('voice-build'),review=readHistoric('voice-review');
 const clips=plan.clips.filter(c=>c.speaker==='narrator');
 const records=[];
 for(const clip of clips){
  const generated=build.clips[clip.id],checked=review.clips[clip.id];
  assert.equal(generated.speaker,'narrator');assert.equal(checked.sha256,generated.sha256);assert.equal(checked.needs_review,false);
  const bytes=historic('public/'+clip.path);assert.equal(hash(bytes),generated.sha256);
  const path='public/'+clip.path;await fs.mkdir(path.slice(0,path.lastIndexOf('/')),{recursive:true});
  const present=await fs.readFile(path).catch(()=>null);
  assert(!present||hash(present)===generated.sha256,'Refuse to overwrite different narration: '+clip.id);
  await fs.writeFile(path,bytes);records.push({clip,build:generated,review:checked});
 }
 await fs.writeFile(recordPath,JSON.stringify({sourceCommit,reference:plan.speakers.narrator,records},null,2)+'\n');
}
const restored=JSON.parse(await fs.readFile(recordPath,'utf8'));
assert.equal(restored.sourceCommit,sourceCommit);assert.equal(restored.records.length,127);
const reference=restored.reference;assert.equal(hash(await fs.readFile(reference.reference)),reference.reference_sha256);
const historicBuild=readHistoric('voice-build'),historicReview=readHistoric('voice-review');
const ids=new Set();
for(const {clip,build:generated,review} of restored.records){
 assert.equal(clip.speaker,'narrator');assert(!ids.has(clip.id));ids.add(clip.id);
 assert.deepEqual(generated,historicBuild.clips[clip.id],'Original generation provenance must remain intact');
 assert.deepEqual(review,historicReview.clips[clip.id],'Original review provenance must remain intact');
 assert.equal(generated.reference_sha256,reference.reference_sha256);assert.equal(review.sha256,generated.sha256);assert.equal(review.needs_review,false);
 assert.equal(generated.model_device,'cpu');assert.equal(generated.codec_device,'cpu');
 const file='public/'+clip.path;assert.equal(hash(await fs.readFile(file)),generated.sha256);
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file],{encoding:'utf8'}));assert(duration>.3&&duration<15.5);
}
const compiled=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/endingText';export * from './src/mini-games/lantern-war/story';export * from './src/mini-games/lantern-war/world';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const m=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const expected=new Set();
const lines=ls=>ls.forEach(l=>{if(l.who==='narrator')expected.add(l.text);});
for(const c of m.CHAPTERS){lines(c.intro);lines(c.outro);}for(let i=0;i<m.SUPPORTS.length;i++)for(let rank=0;rank<3;rank++)lines(m.supportLines(i,rank));for(const q of m.FIELD_QUESTS)lines(m.fieldLines(q.id));
for(const text of [m.endingNarration(true),m.endingNarration(false),m.endingCrown('アステル'),m.endingCrown('リュラ')])for(const part of m.narrationParts(text))expected.add(part);
assert.deepEqual(new Set(restored.records.map(r=>r.clip.text)),expected,'Restored narration must cover the current story exactly');
console.log('PASS 127 original narration recordings restored: matching historical bytes, references, review records and current story coverage.');
