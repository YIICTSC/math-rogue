import assert from 'node:assert/strict';import{build}from'esbuild';
const module=async path=>{const b=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));};
const {createStudentAudio}=await module('src/components/school-dungeon/student/audio.ts'),{chronicleVoicePath}=await module('src/components/school-dungeon/chronicles/voices.ts');
let now=0,allow=true,resolve;const calls=[];const port={playDungeonChronicleVoiceFile:(actor,action)=>{calls.push([actor,action]);return new Promise(r=>resolve=r);},canPlayConversationVoice:()=>allow,playDungeons2VoiceFile:()=>Promise.resolve(true),playDungeonsAbilitySound(){},playAttackEffectSound(){},playStatusEffectSound(){},playBattleSound(){},playHighSchoolVoiceFile(){},playMagicVoiceFile(){}};
const c=createStudentAudio(port,()=>now,()=>0);
for(const action of ['walk','throw','swing','read','use','shoot','pickup','equip','stairs','trap','damage','heal','win','defeat','talk','ultimate','transform']){
 now+=5000;c.play('elementary-warrior',action);assert.equal(calls.at(-1)[1],action);const n=calls.length;now+=5000;c.play('dungeons2-lyria','read');assert.equal(calls.length,n,'pending speech must not overlap');resolve(true);await new Promise(r=>setImmediate(r));
}
allow=false;const count=calls.length;now+=5000;c.play('elementary-warrior','read');assert.equal(calls.length,count);
assert.equal(chronicleVoicePath('npc-story','reveal'),'sfx/dungeons-chronicles/npc-story/reveal.ogg');assert.equal(chronicleVoicePath('../private','read'),undefined);assert.equal(chronicleVoicePath('dungeons2-lyria','../secret'),undefined);assert.equal(chronicleVoicePath('npc-story','attack'),undefined);
console.log('PASS: 17 action-specific elementary voices, speech/mute gates, no overlap, NPC speech routing and strict path validation.');
