import {execFileSync} from 'node:child_process';
import fs from'node:fs/promises';import assert from'node:assert/strict';const cast=JSON.parse(await fs.readFile('src/point-exchange/cast.json'));const clips=JSON.parse(await fs.readFile('src/point-exchange/voiceCatalog.json'));const ids=new Set(cast.map(c=>c.id));assert.equal(new Set(clips.map(c=>c.id)).size,clips.length);assert.equal(new Set(clips.map(c=>c.path)).size,clips.length);for(const c of clips){assert(ids.has(c.actor),c.actor);assert.match(c.id,/^[a-f0-9]{20}$/);assert(c.path.startsWith('sfx/')&&!c.path.includes('..'));assert(c.duration>0&&c.duration<=120);await fs.access('public/'+c.path);}for(const actor of cast.filter(c=>!c.id.startsWith('kotoba-')))assert(clips.some(c=>c.actor===actor.id),'Missing recorded character '+actor.id);for(const source of ['高校編','マジック編','継界戦記','帰宅ダッシュ','紙飛行機','星潮の航路','校長対決','ダンジョンズ2','ダンジョンズ・クロニクル','必殺技'])assert(clips.some(c=>c.source===source),source);assert(clips.some(c=>c.actor==='PL_TRANSFER2'));for(const actor of ['high-school-warrior','magic-akari'])assert(new Set(clips.filter(c=>c.actor===actor).map(c=>c.source)).size>=8);assert(!clips.some(c=>c.actor==='magic-leon'&&c.path.includes('/dungeons2-voices/')));console.log(`PASS ${clips.length} existing playable recordings, ${new Set(clips.map(c=>c.actor)).size} protagonists, unique stable IDs, all shipped files and game-source identity. Kotoba companions have no prerecorded dialogue.`);
const cuts=JSON.parse(await fs.readFile('src/components/school-dungeon/techniques/voiceCuts.json'));const aliases={original:'kocho-original',rebel:'high-school-warrior',akari:'magic-akari'};for(const cue of Object.values(cuts.cues)){if(!cue.actor.startsWith('kocho/'))continue;for(const part of Object.values(cue))if(part&&typeof part==='object'&&part.path)assert(clips.some(c=>c.path===part.path&&c.actor===aliases[cue.actor.split('/')[1]]),'Missing Kocho technique segment '+part.path);}console.log('PASS every Kocho technique segment maps to its original, rebel or Akari protagonist.');

// Cover every shipped war clip, including shared reply aliases, without exposing internal cue IDs.
const war=JSON.parse(await fs.readFile('src/mini-games/lantern-war/voiceManifest.json'));
const plan=JSON.parse(execFileSync('git',['show','HEAD:assets/lantern-war/banter/voice-plan.json'],{encoding:'utf8',maxBuffer:10*1024*1024}));
const spoken=new Map(plan.clips.map(c=>[c.path,c.text]));
const indexed=new Map(clips.map(c=>[c.path,c]));const banter=new Set(),speakers=new Set();
for(const[key,voice]of Object.entries(war)){
 const actor=key.split('\n')[0];if(!ids.has(actor))continue;
 const entry=indexed.get(voice.path);assert(entry,'War voice missing from theater: '+key);
 assert.equal(entry.actor,actor);assert.equal(entry.id,voice.id);
 if(voice.path.includes('/banter/')){assert(Math.abs(entry.duration-voice.duration)<.02);banter.add(voice.path);speakers.add(actor);assert.equal(entry.text,spoken.get(voice.path),'Subtitle must match the actual recording');assert.equal(entry.label,entry.text);assert(!entry.text.includes('[banter-'));}
}
assert(banter.size>600);assert.deepEqual(new Set(clips.filter(c=>c.path.includes('/banter/')).map(c=>c.actor)),speakers);
console.log(`PASS all ${banter.size} pre-battle recordings across ${speakers.size} speakers are selectable with their spoken captions and original IDs.`);
