import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const read=async p=>JSON.parse(await fs.readFile(p)),hash=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const scenes=await read('src/mini-games/kocho/story/scenes.json'),catalog=await read('assets/kocho/story/voice-lines.json'),art=await read('assets/kocho/story/art-build.json'),build=await read('assets/kocho/story/voice-build.json'),prior=await read('assets/kocho/story/retired-v1/voice-build.json');
assert.equal(scenes.length,24);const voices=new Map(),guests=new Set();
for(const hero of ['original','rebel','akari'])assert.deepEqual(scenes.filter(s=>s.hero===hero).map(s=>s.stage),[1,2,3,4,5,6,7,8]);
for(const s of scenes){
 assert.equal(s.lines.length,4);assert.equal(s.lines[0].speaker,'narrator');assert.equal(s.lines.filter(l=>l.speaker===s.hero).length,2);
 assert.match(s.guest,/^(high-school|magic)-/);assert.equal(s.lines[2].speaker,s.guest);assert.deepEqual(s.cast,[s.hero,s.guest]);guests.add(s.guest);
 for(const l of s.lines){assert(l.text&&l.english&&l.hiragana);const speaker=catalog.heroes.find(h=>h.id===l.speaker);assert.equal(speaker.lines[l.voiceId],l.text);assert.equal(l.audio,`sfx/kocho-story/${l.speaker}/${l.voiceId}.ogg`);voices.set(l.voiceId,l);}
 const a=art.find(a=>a.id===s.id);assert.equal(await hash('public/'+s.image),a.sha256);assert.deepEqual(a.cast,s.cast);assert.equal(a.guest,s.guest);assert.equal(await hash(a.referenceArt),a.referenceSha256);
}
assert.equal(guests.size,24);assert.equal(voices.size,80);assert.equal(catalog.heroes.flatMap(h=>Object.keys(h.lines)).length,80);assert(!catalog.heroes.some(h=>['aster','lyra'].includes(h.id)));
let preserved=0;for(const [key,clip]of Object.entries(prior.clips)){if(!/^(original|rebel|akari|narrator)\//.test(key))continue;assert.equal(build.clips[key].sha256,clip.sha256);assert.equal(await hash('public/sfx/kocho-story/'+key+'.ogg'),clip.sha256);preserved++;}assert.equal(preserved,56);
for(const h of catalog.heroes.filter(h=>guests.has(h.id))){assert(h.references.length);assert(h.references[0].startsWith('public/sfx/'));assert(!h.references.some(r=>r.includes('lantern-war')));}
assert.equal(catalog.heroes.find(h=>h.id==='magic-minato').references[0],'public/sfx/magic-voices/MINATO/attack-1.ogg');
console.log('PASS 24 unique school/magic guests, 24 cast-matched CGs, 96 subtitles, 80 recordings, original 56 clips preserved and original-character voice references.');
