import assert from'node:assert/strict';import{build}from'esbuild';
const built=await build({stdin:{contents:"export * from './src/rpg/residentVoiceProsody';export * from './src/rpg/residentVoiceSynth';export{DEFAULT_CONVERSATION_VOICE}from'./src/rpg/conversationVoice';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const voice=api.DEFAULT_CONVERSATION_VOICE,plain=api.planResidentPhrases(api.residentVoiceMoras('あなたのおはなしをきかせてね。')),question=api.planResidentPhrases(api.residentVoiceMoras('あなたのおはなしをきかせてね？'));
const p=plain[0],q=question[0],pitch=(phrase,t,v=voice)=>api.residentPitchSemitones(phrase,t,v);
assert(pitch(p,p.duration)<pitch(p,.3),'Statements settle at the end');assert(pitch(q,q.duration)>pitch(q,q.duration-.2),'Questions rise near the ending');
for(const m of plain){if(!m.duration)continue;const t=m.offset;assert(Math.abs(pitch(m,t+.00001)-pitch(m,t-.00001))<.001,'No pitch jump at a mora boundary');}
const geminate=api.planResidentPhrases(api.residentVoiceMoras('がっこう。'));assert(geminate[2].offset>geminate[1].offset,'A geminate closure does not restart intonation');
const split=api.planResidentPhrases(api.residentVoiceMoras('そうだね、ありがとう。'));assert(split.some((m,i)=>i>0&&m.duration&&m.offset===0),'Punctuation starts the next phrase');
for(let t=0;t<p.duration;t+=.01){assert.equal(pitch(p,t,{...voice,style:'robot'}),0);assert.equal(pitch(p,t,{...voice,intonation:0}),0);assert(Math.abs(pitch(p,t))<3,'Restrained phrase contour');}
assert(pitch(q,q.duration,{...voice,intonation:1})>pitch(q,q.duration,{...voice,intonation:.3}));
console.log('PASS continuous phrase contours, statement/question endings, connected geminates, pauses and intonation controls.');
