import assert from 'node:assert/strict';import{build}from'esbuild';
const compiled=await build({stdin:{contents:"export * from './src/mini-games/kotoba-life/model';export * from './src/mini-games/kotoba-life/voice';export * from './src/mini-games/kotoba-life/dialogueCorpus';export * from './src/rpg/residentVoiceSynth';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let s=api.freshState();assert.equal(s.energy,6);s=api.selectCharacter(s,'mugi');
assert.equal(api.teachWord(s,'宇宙','thing').status,'reading-required');
s=api.teachWord(s,'宇宙','thing','うちゅう').state;assert.equal(s.energy,5);
assert.equal(api.teachWord(s,'宇宙','thing','うちゅう').status,'duplicate');
const observed=new Set(),unreadable=[];
for(let i=0;i<600;i++){const r=api.talk(s);s=r.state;observed.add(r.dialogue.lines.map(l=>l.text.ja).join(''));for(const l of r.dialogue.lines){const k=api.kotobaReading(l.text.ja,s.companions.mugi.words);if(!k||!api.residentVoiceMoras(k))unreadable.push(l.text.ja);}}
assert(observed.size>=144);assert.equal(s.energy,5);assert.equal(api.parseState(s).companions.mugi.talkCount,600);assert.deepEqual(api.parseState(s).companions,s.companions);
for(const id of ['bakery','florist','station'])for(let i=0;i<30;i++){const r=api.visitTown(s,id);s=r.state;for(const l of r.dialogue.lines){if(l.speaker==='narrator')continue;const k=api.kotobaReading(l.text.ja,s.companions.mugi.words);if(!k||!api.residentVoiceMoras(k))unreadable.push(l.text.ja);}}
assert.deepEqual([...new Set(unreadable)],[],'All generated Japanese dialogue has original-synth kana');
for(const id of ['mugi','momo','sora','kohaku','pico']){s=api.selectCharacter(s,id);s=api.care(s,'pet').state;assert.equal(s.energy,5);for(let i=0;i<144;i++){const r=api.talk(s);s=r.state;for(const l of r.dialogue.lines){const k=api.kotobaReading(l.text.ja,s.companions[id].words);assert(k&&api.residentVoiceMoras(k),'Kana for '+id+': '+l.text.ja);}}}
assert.equal(api.ROOM_TOPICS.length,144);
for(const id of ['mugi','momo','sora','kohaku','pico']){let fresh=api.selectCharacter(api.freshState(),id);const learn=api.teachWord(fresh,'星空','thing','ほしぞら');fresh=learn.state;const dialogs=[api.initialDialogue(fresh),learn.dialogue,...['feed','pet','play','rest'].map(a=>api.care(fresh,a).dialogue)];for(const d of dialogs)for(const l of d.lines){const k=api.kotobaReading(l.text.ja,fresh.companions[id].words);assert(k&&api.residentVoiceMoras(k),'Complete voiced line: '+l.text.ja);}}
assert.equal(api.rechargeEnergy(s,0).energy,5);assert.equal(api.rechargeEnergy(s,2).energy,6);
assert.equal(api.parseState({version:1,energy:-100}).energy,0);
for(const voice of Object.values(api.VOICES)){assert.equal(voice.engine,'original','All Kotoba Days voices use the original character engine');const pcm=api.renderResidentVoice(api.residentVoiceMoras('こんにちは'),voice);assert(pcm.some(n=>Math.abs(n)>.01));assert(pcm.every(Number.isFinite));}
console.log('PASS: energy, duplicate/reading guards, free care, persistence, '+observed.size+' distinct conversations, town speech kana and eight original voice profiles.');
