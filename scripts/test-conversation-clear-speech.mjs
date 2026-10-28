import assert from 'node:assert/strict';
import {build} from 'esbuild';
let volume=.6,allowed=true,mode='complete',buffers=0;
const calls=[],sources=[];
globalThis.__voiceAudio={canPlayConversationVoice:()=>allowed,getVoiceVolume:()=>volume};
class Context{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}createBuffer(c,n,rate){buffers++;return{duration:n/rate,getChannelData:()=>new Float32Array(n)};}createGain(){return{gain:{value:0,setTargetAtTime(){}},connect(){},disconnect(){}};}createBufferSource(){const s={connect(){},disconnect(){},start(){sources.push(s);queueMicrotask(()=>s.onended?.());},stop(){}};return s;}}
class Synth extends EventTarget{voices=[];getVoices(){return this.voices;}speak(u){calls.push(u);queueMicrotask(()=>{if(mode==='error')u.onerror?.();else{u.onstart?.();if(mode==='complete')u.onend?.();}});}cancel(){} }
const synth=new Synth();globalThis.window={AudioContext:Context,speechSynthesis:synth};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
const built=await build({stdin:{contents:"export * from './src/rpg/conversationVoice';export * from './src/rpg/conversationSpeech';export * from './src/rpg/residentVoiceSynth';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'audio',setup(b){b.onResolve({filter:/services\/audioService$/},()=>({path:'audio',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const audioService=globalThis.__voiceAudio;'}));}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const voice=api.DEFAULT_CONVERSATION_VOICE,ja={name:'Kyoko Enhanced',lang:'ja-JP',localService:true,default:false},en={name:'English',lang:'en-US',localService:true};

assert.equal(voice.engine,'original');assert(api.validConversationVoice(voice));
globalThis.localStorage={getItem:()=>JSON.stringify({previous:{...voice,engine:'auto'},manual:{...voice,engine:'device'}})};
assert.equal(api.loadConversationVoice('previous').engine,'original');assert.equal(api.loadConversationVoice('manual').engine,'device');
assert.equal(api.selectConversationDeviceVoice([en], 'JAPANESE',0),undefined);
synth.voices=[en,ja];
assert.equal(await api.speakConversation('こんにちは。',voice,'JAPANESE'),true);
assert.equal(buffers,1);assert.equal(calls.length,0,'Never prefer device speech over original kana synthesis');
assert.equal(await api.speakConversation('げんき？',{...voice,engine:'auto'},'JAPANESE'),true);
assert.equal(buffers,2);assert.equal(calls.length,0,'Previous auto settings now use original voices too');
api.unlockConversationSpeech();assert.equal(calls.length,0,'No native speech priming in original mode');
// Device speech remains an explicit, optional alternative.
const device={...voice,engine:'device'};synth.voices=[];
const delayed=api.speakConversation('こんにちは。',device,'JAPANESE');synth.voices=[en,ja];synth.dispatchEvent(new Event('voiceschanged'));assert.equal(await delayed,true);assert.equal(calls.length,1);assert.equal(calls[0].voice,ja);
synth.voices=[];const cancelled=api.speakConversation('またね。',device,'JAPANESE');api.stopConversationSpeech();synth.voices=[ja];synth.dispatchEvent(new Event('voiceschanged'));assert.equal(await cancelled,false);assert.equal(calls.length,1);
mode='error';assert.equal(await api.speakConversation('おはよう。',device,'JAPANESE'),false);assert.equal(buffers,2);
assert.equal(api.residentVoiceMoras('コーヒー')[0].duration>.2,true);
const moras=api.residentVoiceMoras('きゃくがりんごをたべる。げんき？');
const signatures=new Set();
for(const style of ['smooth','bouncy','warm','calm','playful','robot'])for(const timbre of [0,1,2,3]){
 const pcm=api.renderResidentVoice(moras,{...voice,style,timbre});assert(pcm.every(n=>Number.isFinite(n)&&Math.abs(n)<=.85));assert(pcm.some(n=>Math.abs(n)>.05));signatures.add(Buffer.from(pcm.buffer).toString('base64'));
}
assert.equal(signatures.size,24,'Every style/timbre pair has a different voice');
assert.deepEqual(api.residentVoiceMoras('こんにちは'),api.residentVoiceMoras('こんにちわ'));
assert.notDeepEqual(api.renderResidentVoice(moras,{...voice,style:'robot',intonation:0}),api.renderResidentVoice(moras,{...voice,style:'playful',intonation:1}));
console.log('PASS original-first routing including legacy auto, no native priming, explicit-device compatibility, sustained vowels and 24 finite/distinct character styles.');
