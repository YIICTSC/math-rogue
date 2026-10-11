import assert from 'node:assert/strict';
import { build } from 'esbuild';

const sources = [], gains = [];
let active = true, volume = .6;
globalThis.__voiceAudio = {canPlayConversationVoice:()=>active,getVoiceVolume:()=>volume};
class Context {
  state = 'running'; currentTime = 0; destination = {};
  resume() {this.state='running';return Promise.resolve();}
  createBuffer(channels,length,sampleRate) {const data=new Float32Array(length);return {duration:length/sampleRate,getChannelData:()=>data};}
  createBufferSource() {const s={connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;}
  createGain() {const g={gain:{value:0,setTargetAtTime(v){this.value=v;}},connect(){},disconnect(){this.disconnected=true;}};gains.push(g);return g;}
}
globalThis.window = {AudioContext:Context};
const compiled=await build({stdin:{contents:`export * from './src/rpg/residentVoiceSynth'; export * from './src/rpg/conversationVoice'; export * from './src/rpg/conversationSpeech';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'audio-stub',setup(b){b.onResolve({filter:/services\/audioService$/},()=>({path:'audio',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const audioService = globalThis.__voiceAudio;'}));}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const voice=api.DEFAULT_CONVERSATION_VOICE;
assert.ok(api.validConversationVoice(voice));
assert.ok(api.validConversationVoice({...voice,engine:undefined}));
assert.equal(api.validConversationVoice({...voice,engine:'invalid'}),false);
assert.deepEqual(api.residentVoiceMoras('キャット'),api.residentVoiceMoras('きゃっと'));
assert.equal(api.residentVoiceMoras('漢字'),null);
assert.equal(api.residentVoiceMoras('Hello'),null);
assert.equal(api.residentVoiceMoras('？！'),null);
assert.equal(api.residentVoiceMoras('きゃ').length,1);
assert.equal(api.residentVoiceMoras('あ'.repeat(1000)).length,240);
const moras=api.residentVoiceMoras('こんにちは！げんき？');
const pcm=api.renderResidentVoice(moras,voice);
assert.ok(pcm.length>22050);
assert.ok(pcm.every(n=>Number.isFinite(n)&&Math.abs(n)<=.85));
assert.ok(pcm.some(n=>Math.abs(n)>.05));
assert.deepEqual(pcm,api.renderResidentVoice(moras,voice));
assert.notDeepEqual(pcm,api.renderResidentVoice(moras,{...voice,timbre:3}));
assert.notDeepEqual(pcm,api.renderResidentVoice(moras,{...voice,pitch:.6}));
assert.ok(api.renderResidentVoice(moras,{...voice,rate:1.6}).length < pcm.length);
const first=api.speakConversation('こんにちは',voice,'JAPANESE');
assert.equal(sources.length,1);assert.equal(sources[0].started,true);
assert.equal(gains[0].gain.value,.6);
volume=.2;await new Promise(r=>setTimeout(r,90));assert.equal(gains[0].gain.value,.2);
const second=api.speakConversation('げんき？',voice,'JAPANESE');
assert.equal(await first,false);assert.equal(sources[0].stopped,true);
sources[1].onended();assert.equal(await second,true);assert.equal(gains[1].disconnected,true);
const muted=api.speakConversation('おはよう',voice,'JAPANESE');
active=false;assert.equal(await muted,false);assert.equal(sources[2].stopped,true);
assert.equal(await api.speakConversation('こんにちは',voice,'JAPANESE'),false);
active=true;
assert.equal(await api.speakConversation('こんにちは',{...voice,enabled:false},'JAPANESE'),false);
assert.equal(await api.speakConversation('漢字',voice,'JAPANESE'),false);
const cancel=api.speakConversation('またね',voice,'JAPANESE');api.stopConversationSpeech();assert.equal(await cancel,false);
console.log('Resident voice passed: kana, bounds, deterministic PCM, voice controls, completion, replacement, volume, mute, cancellation and missing-device fallback.');

// Exercise native Web Audio scheduling as well as the deterministic lifecycle mock.
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try {
  const page=await browser.newPage();
  const results=await page.evaluate(async code=>{
    let audible=true;
    globalThis.__voiceAudio={canPlayConversationVoice:()=>audible,getVoiceVolume:()=>.5};
    const api=await import('data:text/javascript;base64,'+code);
    const voice=api.DEFAULT_CONVERSATION_VOICE;
    const completed=await api.speakConversation('あいうえお',voice,'JAPANESE');
    const cancelled=api.speakConversation('こんにちは',voice,'JAPANESE');
    api.stopConversationSpeech();
    const stopped=await cancelled;
    const muted=api.speakConversation('げんき？',voice,'JAPANESE');
    audible=false;
    return [completed,stopped,await muted];
  },Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.deepEqual(results,[true,false,false]);
  console.log('Chromium native Web Audio passed: playback completion, immediate cancellation and mute.');
} finally {await browser.close();}
