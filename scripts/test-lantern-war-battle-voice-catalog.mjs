import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const out=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/battleVoiceLines';export * from './src/mini-games/lantern-war/techniques';export * from './src/mini-games/lantern-war/roster';export * from './src/mini-games/lantern-war/story';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const m=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const read=async n=>JSON.parse(await fs.readFile('assets/lantern-war/'+n+'.json','utf8'));
const plan=await read('voice-plan'),policy=await read('voice-policy'),audition=await read('audition-plan');
assert.equal(policy.generated_voices,'story-and-techniques');assert.equal(policy.story_voices,'enabled');
assert.equal(new Set(plan.clips.map(c=>c.id)).size,plan.clips.length);
for(const hero of ['aster','lyra']){
 const ref=plan.speakers[hero];assert.equal(ref.reference,audition.speakers[hero].reference);assert(ref.reference.endsWith('-v3.ogg'));
 assert.equal(createHash('sha256').update(await fs.readFile(ref.reference)).digest('hex'),ref.reference_sha256);
 for(const kind of m.BATTLE_VOICE_KINDS)assert(plan.clips.some(c=>c.speaker===hero&&c.kind===kind&&c.text===m.battleVoiceText(hero,kind)));
}
assert.equal(plan.speakers['magic-minato'].reference,'public/sfx/magic-voices/MINATO/attack-1.ogg');
for(const chapter of m.CHAPTERS.slice(0,2)){const line=chapter.intro[3];assert.equal(line.who,'$hero','Opening resolve line belongs to selected commander');for(const hero of ['aster','lyra'])assert(plan.clips.some(c=>c.speaker===hero&&c.text===(hero==='lyra'?line.text.replaceAll('僕','私'):line.text)),'Selected commander recording '+hero);assert(!plan.clips.some(c=>c.speaker===chapter.intro[1].who&&c.text===line.text),'Do not record the commander line with the companion voice');}
const crownLine=m.CHAPTERS.at(-1).outro[1];assert.equal(crownLine.who,'$hero','Crown decision belongs to selected commander');for(const hero of ['aster','lyra'])assert(plan.clips.some(c=>c.speaker===hero&&c.text===crownLine.text),'Crown decision recording '+hero);assert(!plan.clips.some(c=>c.speaker==='magic-akari'&&c.text===crownLine.text));
const names=new Set();
for(const h of m.HEROES){
 assert(plan.clips.some(c=>c.speaker===h.id&&c.text===h.motto),'Ending motto '+h.id);
 if(h.id.startsWith('high-school-')||h.id.startsWith('magic-')&&h.id!=='magic-minato')assert(plan.speakers[h.id].reference.endsWith('/endless-true-1.ogg'),'Use canonical story reference '+h.id);
 const kit=m.PERSONAL_TECHNIQUES[h.id];assert.deepEqual(kit.map(t=>t.level),[3,6,12]);
 for(const t of kit){
  assert(/^[ァ-ヺー・]+$/u.test(t.name),t.name);assert(!names.has(t.name));names.add(t.name);
  const c=plan.clips.find(c=>c.speaker===h.id&&c.text===m.battleVoiceText(h.id,'technique',undefined,t.name));assert(c,'Missing technique '+t.name);
  assert.equal(c.id,createHash('sha256').update(h.id+'\n'+c.text).digest('hex').slice(0,20));
  assert(/叫ぶ|叫び/u.test(plan.clip_overrides[c.id].caption));assert(plan.clip_overrides[c.id].steps>=16);
 }
}
assert.equal(names.size,120);assert.equal(policy.narration_voices,'restored-from-history');assert(!plan.clips.some(c=>c.speaker==='narrator'),'Narration uses restored historical recordings, not new generation');assert.equal(plan.clips.filter(c=>c.kind==='story').length,299);
for(const [id,ref]of Object.entries(plan.speakers))assert.equal(createHash('sha256').update(await fs.readFile(ref.reference)).digest('hex'),ref.reference_sha256,id);
console.log('PASS 120 unique katakana techniques, level gates, shouted direction, complete story/ending coverage, preserved adult and Minato battle references.');
