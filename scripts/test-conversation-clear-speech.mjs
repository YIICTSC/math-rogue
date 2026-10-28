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
assert.equal(api.conversationDevicePlan('こんにちは、きょうははれ。',{...voice,style:'playful'}).length,1);
assert.equal(voice.engine,'auto');assert(api.validConversationVoice(voice));assert.equal(api.selectConversationDeviceVoice([en], 'JAPANESE',0),undefined);
assert.equal(api.selectConversationDeviceVoice([en,ja,{...ja,name:'Remote',localService:false}],'JAPANESE',1),ja);
for(const pitch of [.5,2])for(const rate of [.6,1.6]){const p=api.conversationDevicePlan('こんにちは！',{...voice,pitch,rate})[0];assert(p.pitch>=.85&&p.pitch<=1.25);assert(p.rate>=.82&&p.rate<=1.08);}
// Asynchronous voice discovery must wait for the proper locale, then play just once.
const delayed=api.speakConversation('こんにちは。',voice,'JAPANESE');assert.equal(calls.length,0);synth.voices=[en,ja];synth.dispatchEvent(new Event('voiceschanged'));assert.equal(await delayed,true);assert.equal(calls.length,1);assert.equal(calls[0].voice,ja);assert.equal(buffers,0);
synth.voices=[];const cancelled=api.speakConversation('またね。',voice,'JAPANESE');api.stopConversationSpeech();synth.voices=[ja];synth.dispatchEvent(new Event('voiceschanged'));assert.equal(await cancelled,false);assert.equal(calls.length,1);assert.equal(buffers,0);
// A native failure before the first sound uses one fallback, retaining cancellation ownership.
mode='error';assert.equal(await api.speakConversation('おはよう。',voice,'JAPANESE'),true);assert.equal(buffers,1);
mode='hold';const interrupted=api.speakConversation('こんにちは。',voice,'JAPANESE');await Promise.resolve();const current=calls.at(-1);current.onerror?.();assert.equal(await interrupted,false);assert.equal(buffers,1,'Never repeat a phrase after it already started');
mode='complete';synth.voices=[en];assert.equal(await api.speakConversation('あいうえお',voice,'JAPANESE'),true);assert.equal(buffers,2);assert(calls.every(u=>u.voice===ja),'No English voice for Japanese');
mode='hold';synth.voices=[ja];const muted=api.speakConversation('げんき？',voice,'JAPANESE');allowed=false;assert.equal(await muted,false);allowed=true;
assert.equal(api.residentVoiceMoras('コーヒー')[0].duration>.2,true,'Long vowels are sustained, not re-articulated');
console.log('PASS recommended locale selection, bounded pitch/rate, delayed voice discovery, cancellation, one-time fallback, no repeated partial phrase, mute and sustained long vowels.');
