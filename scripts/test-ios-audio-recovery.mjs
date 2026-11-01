import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
let server,browser;
const entry='.ios-audio-recovery.ts';
try {
 await fs.writeFile(entry,`import {audioService} from './src/services/audioService';import {KartAudio} from './src/mini-games/gakuro-kart/audio';import * as speech from './src/rpg/conversationSpeech';import * as synth from './src/rpg/residentVoiceSynth';import {DEFAULT_CONVERSATION_VOICE} from './src/rpg/conversationVoice';import * as recovery from './src/services/webAudioSession';Object.assign(window,{service:audioService,KartAudio,speech,synth,voice:DEFAULT_CONVERSATION_VOICE,recovery,ready:true});`);
 server=await createServer({configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[]},define:{'import.meta.env.VITE_APP_PLATFORM':JSON.stringify('ios')},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'audio-recovery-fixture',configureServer(s){s.middlewares.use('/__audio',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__audio',`<button id="wake">Wake audio</button><script type="module" src="/${entry}"></script>`));});}}]});await server.listen();
 browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.requests=[];window.playing=new Set();Object.defineProperty(navigator,'audioSession',{value:{type:'auto'},configurable:true});
  HTMLMediaElement.prototype.play=function(){window.playing.add(this);return new Promise((resolve,reject)=>window.requests.push({audio:this,resolve,reject,ended:this.onended}));};
  HTMLMediaElement.prototype.pause=function(){window.playing.delete(this);};HTMLMediaElement.prototype.load=function(){};
  Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return !window.playing.has(this);},configurable:true});
 });
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__audio');await page.waitForFunction(()=>window.ready);
 // A play promise can still be pending while iOS emits the old track.
 await page.evaluate(()=>{service.init();window.first=service.playBGM('map',false);});await page.waitForFunction(()=>requests.length===1);
 assert.equal(await page.evaluate(()=>playing.size),1);
 await page.evaluate(()=>{window.second=service.playBGM('shop');});await page.waitForFunction(()=>requests.length===2);
 assert.equal(await page.evaluate(()=>playing.has(requests[0].audio)),false,'Old pending native BGM must stop immediately');
 await page.evaluate(async()=>{requests[1].resolve();await second;requests[0].resolve();await first;requests[0].ended?.();});
 assert.equal(await page.evaluate(()=>playing.size),1);assert.equal(await page.evaluate(()=>service.getCurrentBgmType()),'shop');assert.equal(await page.evaluate(()=>requests.length),2,'Late old onended must not advance the new track');
 await page.evaluate(()=>{window.third=service.playBGM('rest');});await page.waitForFunction(()=>requests.length===3);
 await page.evaluate(async()=>{service.stopBGM();requests[2].reject(new Error('old play rejected'));await third;});
 assert.equal(await page.evaluate(()=>requests.length),3,'Canceled URL fallback must not start another old track');assert.equal(await page.evaluate(()=>playing.size),0);
 // A late resume from an old screen must not play the next screen's element.
 await page.evaluate(async()=>{window.old=service.playBGM('map');requests.at(-1).resolve();await old;await service.pauseBGM();window.realResume=service.resumeAudioContext;let resumeCalls=0;service.resumeAudioContext=()=>++resumeCalls===1?new Promise(r=>window.finishResume=r):Promise.resolve(true);window.resume=service.resumeBGM();service.stopBGM();window.next=service.playBGM('battle');requests.at(-1).resolve();await next;finishResume(true);await resume;service.resumeAudioContext=realResume;});
 assert.equal(await page.evaluate(()=>playing.size),1);assert.equal(await page.evaluate(()=>service.getCurrentBgmType()),'battle');
 await page.evaluate(async()=>{await service.ctx.close();window.reopened=service.playBGM('shop');});
 assert.equal(await page.evaluate(()=>playing.size),1,'Closing Web Audio must not orphan native BGM');
 await page.evaluate(async()=>{requests.at(-1).resolve();await reopened;});
 await page.evaluate(()=>service.stopBGM());
 // Simulate iOS interrupted state and a first acknowledged-but-ineffective resume.
 const recovered=await page.evaluate(async()=>{
  let state='interrupted',calls=0,primed=0;
  const fake={get state(){return state;},sampleRate:44100,destination:{},createBuffer(){return {};},createBufferSource(){return {connect(){},disconnect(){},start(){primed++;}};},resume(){calls++;if(calls>=2)state='running';return Promise.resolve();}};
  const ok=await recovery.resumeGameAudio(fake);const unregister=recovery.registerGameAudio(fake);state='interrupted';window.dispatchEvent(new Event('pointerdown'));await new Promise(r=>setTimeout(r,20));unregister();const count=calls;state='interrupted';window.dispatchEvent(new Event('pointerdown'));return {ok,calls,count,primed,state,type:navigator.audioSession.type};
 });assert.equal(recovered.ok,true);assert.ok(recovered.primed>0);assert.equal(recovered.calls,recovered.count);assert.equal(recovered.state,'interrupted');assert.equal(recovered.type,'playback');
 await page.locator('#wake').click();
 // Exercise real engine nodes and original PCM voice playback, not device speech.
 await page.evaluate(async()=>{window.kart=new KartAudio();await kart.unlock();kart.update({seed:7,phase:'race',paused:false,players:{p:{speed:80,crash:0,quizAnswers:[],quizLap:0,slow:0,jump:0,boost:0}},lesson:null},'p');});
 await page.waitForFunction(()=>kart.motorGain.gain.value>.02);assert.ok(await page.evaluate(()=>kart.motor.frequency.value>52));assert.equal(await page.evaluate(()=>kart.context.state),'running');
 await page.evaluate(async()=>{service.setVoiceVolume(1);window.resident=synth.unlockResidentVoice();await recovery.resumeGameAudio(resident);window.voiceResult=speech.speakConversation('こんにちは。きかせてね。',{...voice,engine:'original',enabled:true},'JAPANESE');});
 assert.equal(await page.evaluate(()=>voiceResult),true);assert.equal(await page.evaluate(()=>resident.state),'running');
 const afterClose=await page.evaluate(async()=>{kart.close();const before=kart.context;window.dispatchEvent(new Event('pointerdown'));await new Promise(r=>setTimeout(r,10));return {before,after:kart.context};});assert.deepEqual(afterClose,{before:null,after:null});
 assert.deepEqual(errors,[]);console.log('PASS iOS BGM pending-play/late rejection/resume cancellation, interrupted AudioContext recovery, native playback session, GP synthesis and original resident voice playback.');
} finally {await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
