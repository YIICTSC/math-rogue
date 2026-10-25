import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { build } from 'esbuild';
const load = async path => { const result = await build({ entryPoints: [path], bundle: true, write: false, format: 'esm', platform: 'node' });return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')); };
const { createStudentAudio } = await load('src/components/school-dungeon/student/audio.ts');
const { dungeons1BattleVoice, dungeons2BattleVoice, mainBattleVoiceIdentity } = await load('src/components/school-dungeon/student/battleVoicePolicy.ts');
const { PROTAGONISTS } = await load('src/three/protagonistCatalog.ts');
const heroes = PROTAGONISTS.filter(hero => mainBattleVoiceIdentity(hero.id));
const quiet = ['walk', 'pickup', 'equip', 'stairs', 'talk'];
const actions = ['attack', 'throw', 'shoot', 'projectile', 'skill', 'swing', 'ultimate', 'transform', 'trap', 'damage', 'win', 'defeat', 'heal', 'item', 'use', 'read', ...quiet];
let checked = 0;
for (const hero of heroes) for (const action of actions) for (const finish of [false, true]) for (const rng of [0, .5, .999]) {
  const voice = dungeons1BattleVoice(hero.id, action, finish, () => rng);
  if (quiet.includes(action) || hero.id.startsWith('magic-') && ['heal', 'item', 'use', 'read'].includes(action)) assert.equal(voice, null);
  else { assert(voice);await fs.access(`public/sfx/${voice.theme}-voices/${voice.id}/${voice.file}.ogg`); }
  checked++;
}
let now = 0;
const calls = [], effect = (...args) => calls.push(['effect', ...args]);
const port = { canPlayConversationVoice: () => true,
  playDungeonChronicleVoiceFile: (...args) => { calls.push(['chronicle', ...args]);return Promise.resolve(true); },
  playHighSchoolVoiceFile: (...args) => { calls.push(['high-school', ...args]);return Promise.resolve(true); },
  playMagicVoiceFile: (...args) => { calls.push(['magic', ...args]);return Promise.resolve(true); },
  playDungeons2VoiceFile: (...args) => { calls.push(['dungeons2', ...args]);return Promise.resolve(true); },
  playDungeonsAbilitySound: effect, playAttackEffectSound: effect, playStatusEffectSound: effect, playBattleSound: effect };
const tick = async () => { now += 5000;await new Promise(resolve => setImmediate(resolve)); };
for (const hero of PROTAGONISTS) {
  const controller = createStudentAudio(port, () => now, () => 0, 'dungeons1');
  calls.length = 0;
  for (let step = 0; step < 100; step++) { await tick();controller.play(hero.id, 'walk', true); }
  assert.deepEqual(calls, [], `${hero.id}: walking must never create speech or selection clicks`);
}
for (const hero of heroes) {
  const controller = createStudentAudio(port, () => now, () => 0, 'dungeons1');calls.length = 0;
  for (const action of actions) { await tick();controller.play(hero.id, action); }
  assert(!calls.some(call => call[0] === 'chronicle'), `${hero.id}: unreferenced bank was used`);
  assert(calls.some(call => call[0] === (hero.id.startsWith('magic-') ? 'magic' : 'high-school')));
}
const legacy = createStudentAudio(port, () => now, () => 0);calls.length = 0;
await tick();legacy.play('dungeons2-lyria', 'read');assert(calls.some(call => call[0] === 'chronicle' && call[1] === 'dungeons2-lyria'));
assert.equal(mainBattleVoiceIdentity('high-school-invalid'), null);
console.log(`PASS: ${checked} routing cases, 3,500 silent walking events, all 26 main-battle identities, no unreferenced fallback, Dungeons 2 voices preserved.`);

const { ABYSS_HEROES } = await load('src/components/school-dungeon/dungeons2/roster.ts');
for(const hero of ABYSS_HEROES){
 const controller=createStudentAudio(port,()=>now,()=>0,'dungeons2');calls.length=0;
 for(let n=0;n<100;n++){await tick();controller.play(hero.id,'walk',true);}
 assert.deepEqual(calls,[]);
 for(const action of ['read','use','item','skill','swing','pickup','equip','stairs','talk'])assert.equal(dungeons2BattleVoice(hero.id,action,false,()=>0),null);
 assert.equal(dungeons2BattleVoice(hero.id,'ultimate',false,()=>0,'unknown'),null);
 for(const [index,ability]of [...hero.skills,hero.card].entries())for(const random of [0,.5,.999]){
  const voice=dungeons2BattleVoice(hero.id,'ultimate',false,()=>random,ability.en);
  assert.equal(voice.file.replace(/-alt-[12]$/,''),index===3?'card':`ultimate-${index+1}`);
  await fs.access(`public/sfx/dungeons2-voices/${voice.id}/${voice.file}.ogg`);
 }
 for(const action of actions){await tick();controller.play(hero.id,action);}
 assert(!calls.some(call=>call[0]==='chronicle'));
}
console.log('PASS: all 9 Dungeons 2 speakers, 900 silent steps, exact named skills, no unrelated item/skill dialogue.');
// Retired walking speech must remain silent even for old/default callers.
const {chronicleVoicePath}=await load('src/components/school-dungeon/chronicles/voices.ts');
for(const hero of [...PROTAGONISTS,...ABYSS_HEROES]){
 assert.equal(chronicleVoicePath(hero.id,'walk'),undefined);
 await assert.rejects(fs.access(`public/sfx/dungeons-chronicles/${hero.id}/walk.ogg`),{code:'ENOENT'});
 for(const profile of ['default','dungeons1','dungeons2']){
  const controller=createStudentAudio(port,()=>now,()=>0,profile);calls.length=0;
  await tick();controller.play(hero.id,'walk',true);assert.deepEqual(calls,[]);
 }
}
console.log('PASS: all 44 walking files removed; no voice or effect from any audio profile; walking paths rejected.');
