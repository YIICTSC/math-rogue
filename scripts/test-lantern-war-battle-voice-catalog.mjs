import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {build} from 'esbuild';
const out=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/battleVoiceLines';export * from './src/mini-games/lantern-war/techniques';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});const m=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const read=async n=>JSON.parse(await fs.readFile('assets/lantern-war/'+n+'.json','utf8'));const plan=await read('voice-plan'),policy=await read('voice-policy'),audition=await read('audition-plan');
assert.deepEqual(policy.battle_speakers,['aster','lyra']);assert.equal(policy.story_voices,'discarded');assert.equal(policy.technique_media,'discarded');assert.equal(plan.clips.length,20);assert.equal(new Set(plan.clips.map(c=>c.id)).size,20);
for(const hero of policy.battle_speakers){
 const clips=plan.clips.filter(c=>c.speaker===hero);assert.equal(clips.length,10);
 const ref=plan.speakers[hero];assert.equal(ref.reference,audition.speakers[hero].reference);assert(ref.reference.endsWith('-v3.ogg'));assert.equal(createHash('sha256').update(await fs.readFile(ref.reference)).digest('hex'),ref.reference_sha256);
 for(const kind of m.BATTLE_VOICE_KINDS)assert.equal(clips.find(c=>c.kind===kind)?.text,m.battleVoiceText(hero,kind));
 for(const t of m.PERSONAL_TECHNIQUES[hero])assert(clips.some(c=>c.kind==='technique'&&c.text===m.battleVoiceText(hero,'technique',undefined,t.name)));
 for(const c of clips){assert.equal(c.id,createHash('sha256').update(hero+'\n'+c.text).digest('hex').slice(0,20));assert(c.path.startsWith('sfx/lantern-war/'+hero+'/'));assert(plan.clip_overrides[c.id].caption.startsWith(ref.caption));}
}
assert(plan.clips.every(c=>policy.battle_speakers.includes(c.speaker)&&c.kind!=='story'));
console.log('PASS 20 planned combat lines, exact event/technique coverage, approved v3 reference hashes and battle-only scope.');
