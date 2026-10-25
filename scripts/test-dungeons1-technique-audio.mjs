import assert from 'node:assert/strict';import{build}from'esbuild';
async function load(path){const b=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));}
const {createStudentAudio}=await load('src/components/school-dungeon/student/audio.ts'),{techniqueVoicePath}=await load('src/components/school-dungeon/dungeons1/techniqueVoices.ts');
let now=0,allowed=true;const calls=[],resolvers=[];
const port={canPlayConversationVoice:()=>allowed,playDungeons1TechniqueVoice:(hero,id)=>{calls.push(['technique',hero,id]);return new Promise(r=>resolvers.push(r));},playDungeonChronicleVoiceFile:(hero,id)=>{calls.push(['generic',hero,id]);return Promise.resolve(true);},playDungeons2VoiceFile:()=>Promise.resolve(true),playHighSchoolVoiceFile:()=>Promise.resolve(true),playMagicVoiceFile:()=>Promise.resolve(true),playDungeonsAbilitySound(){},playAttackEffectSound(){},playStatusEffectSound(){},playBattleSound(){}};
const c=createStudentAudio(port,()=>now,()=>0);
c.playTechnique('elementary-warrior','sword-1');assert.deepEqual(calls[0],['technique','elementary-warrior','sword-1']);
c.playTechnique('elementary-warrior','sword-1');assert.equal(calls.length,1,'repeated attacks must let the current technique call finish instead of restarting its first syllable');
now=5000;c.play('elementary-warrior','damage');assert.equal(calls.length,1,'generic speech does not overlap the dedicated call');
c.playTechnique('elementary-warrior','fist-1');assert.equal(calls.length,2);resolvers[0](true);await new Promise(r=>setImmediate(r));now+=5000;c.play('elementary-warrior','attack');assert.equal(calls.length,2,'an old promise cannot release a newer technique lock');
resolvers[1](true);await new Promise(r=>setImmediate(r));now+=5000;c.play('elementary-warrior','attack');assert.equal(calls.at(-1)[0],'generic');
allowed=false;const n=calls.length;c.playTechnique('elementary-warrior','sword-2');assert.equal(calls.length,n,'voice mute is honored');
assert.equal(techniqueVoicePath('magic-akari','ultimate-heart'),'sfx/dungeons1-techniques/magic-akari/ultimate-heart.ogg');
for(const [hero,id]of [['../secret','sword-1'],['elementary-warrior','../secret'],['dungeons2-lyria','sword-1'],['unknown','sword-1'],['elementary-warrior','sword-99']])assert.equal(techniqueVoicePath(hero,id),undefined);
console.log('PASS: dedicated technique voices, no competing generic speech, interruption generation guard, voice mute and strict hero/technique routing.');
