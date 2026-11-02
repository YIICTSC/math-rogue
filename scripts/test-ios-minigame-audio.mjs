import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';

// Uses real Web Audio nodes, with controllable WebKit interruption/resume ordering.
// HTML media is instrumented separately: desktop WebKit cannot reproduce an iPhone's
// native audio route or silent switch. Real-device checks are documented in docs/ios-minigame-audio.md.
const server = await createServer({ configFile:false,cacheDir:'node_modules/.vite-ios-minigame-audio',server: {host:'127.0.0.1',port:4187,strictPort:true,watch:null,hmr:false},
  logLevel:'error', optimizeDeps:{noDiscovery:true,entries:[]}, define:{'import.meta.env.VITE_APP_PLATFORM':JSON.stringify('ios')} });
await server.listen();
const browserType = process.env.AUDIO_TEST_BROWSER === 'webkit' ? webkit : chromium;
let browser;
try {
  browser = await browserType.launch({headless:true,...(browserType===chromium?{
    executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--autoplay-policy=no-user-gesture-required']}: {})});
  const page = await browser.newPage({viewport:{width:430,height:932},hasTouch:true});
  await page.route('**/__audio-check',route=>route.fulfill({contentType:'text/html',body:'<button id="unlock">Enable audio</button>'}));
  await page.goto('http://127.0.0.1:4187/__audio-check');
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.evaluate(async()=>{
    const {audioService:a}=await import('/src/services/audioService.ts');
    window.audio=a;
    window.nodes=[];window.media=[];
    const originalOsc=OscillatorNode.prototype.start,originalBuffer=AudioBufferSourceNode.prototype.start;
    OscillatorNode.prototype.start=function(...args){window.nodes.push({kind:'osc',state:this.context.state});return originalOsc.apply(this,args);};
    AudioBufferSourceNode.prototype.start=function(...args){window.nodes.push({kind:this.buffer?.length===1?'prime':'buffer',state:this.context.state});return originalBuffer.apply(this,args);};
    HTMLMediaElement.prototype.play=function(){window.media.push(this.src);setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){};
    a.init();
    document.querySelector('#unlock').onclick=()=>void a.unlockAudio();
  });
  await page.click('#unlock');
  await page.waitForFunction(()=>window.audio.ctx.state==='running');
  const results = await page.evaluate(async()=>{
    const a=window.audio,ctx=a.ctx,wait=ms=>new Promise(r=>setTimeout(r,ms));
    const {resumeGameAudio}=await import('/src/services/webAudioSession.ts');
    const {CraftSound}=await import('/src/mini-games/gakuro-craft/sound.ts');
    const {KartAudio}=await import('/src/mini-games/gakuro-kart/audio.ts');
    const {createSongScratch}=await import('/src/rpg/rhythm/songScratch.ts');
    const outcomes=[];
    const check=(name,value)=>{if(!value)throw Error(name);outcomes.push(name);};
    const audible=()=>window.nodes.filter(n=>n.kind!=='prime').length;
    // Real suspension: the original implementation discarded the first paper foley.
    await ctx.suspend();
    let before=audible();a.playCardClubSound('deal');await wait(100);
    check('card foley survives the first suspended action',audible()>before);
    check('card foley starts after resume',window.nodes.filter(n=>n.kind!=='prime').slice(-3).every(n=>n.state==='running'));

    // Delay resume to reproduce gesture -> async gameplay callback ordering.
    const interrupt=(context,delay=60,stuck=false)=>{
      let state='interrupted';const resume=context.resume.bind(context);
      Object.defineProperty(context,'state',{configurable:true,get:()=>state});
      context.resume=()=>stuck?new Promise(()=>{}):new Promise(resolve=>setTimeout(()=>{state='running';resolve();},delay));
      return {restore(){delete context.state;context.resume=resume;},state:()=>state};
    };
    for(const [name,play] of [
      ...['select','attack','jump','block','win','lose','buff','debuff','damage','explosion','finisher_slash','finisher_explosion'].map(effect=>[`common ${effect}`,()=>a.playSound(effect)]),
      ['shogi gimmick',()=>a.playShogiGimmickSound('WARP',4)],
      ['rhythm pad',()=>a.playRpgRhythmHit(0,true)],
      ['dungeon ability accent',()=>a.playDungeonsAbilitySound('fire')],
    ]){
      const simulated=interrupt(ctx);before=audible();play();await wait(110);
      check(`${name} resumes before synthesis`,audible()>before);simulated.restore();
    }
    let slow=interrupt(ctx,420);before=audible();a.playCardClubSound('deal');await wait(750);
    check('first cue survives resume taking more than 300 ms',audible()>before);slow.restore();
    // Native media remains usable with a permanently interrupted context. Check
    // first use AND an already decoded clip; neither may silently return early.
    for(const cached of [false,true]){
      if(cached)a.sfxBuffers['attack-effects/impact']=ctx.createBuffer(1,4800,48000);
      else delete a.sfxBuffers['attack-effects/impact'];
      const simulated=interrupt(ctx,0,true),beforeMedia=window.media.length;
      a.playBattleSound('attack');await wait(50);
      check(`packaged combat cue reaches native audio (${cached?'cached':'cold'})`,window.media.slice(beforeMedia).some(p=>p.includes('attack-effects/impact.mp3')));
      simulated.restore();
    }
    for(const [name,play,expected] of [
      ['golf',()=>a.playGolfSound('ob'),'golf/ob.mp3'],
      ['VR',()=>a.playVrSound('wrong'),'gakuro-vr/wrong.mp3'],
      ['hobby',()=>a.playHobbySound('dart-hit'),'rpg-games/dart-hit.mp3'],
      ['fishing',()=>a.playRpgFishingSound('miss'),'rpg-fishing/miss.mp3'],
      ['correct answer',()=>a.playSound('correct'),'sfx/correct.mp3'],
      ['wrong answer',()=>a.playSound('wrong'),'sfx/wrong.mp3'],
    ]){
      const simulated=interrupt(ctx,0,true),beforeMedia=window.media.length;play();await wait(50);
      check(`${name} has an independent native path`,window.media.slice(beforeMedia).some(p=>p.includes(expected)));simulated.restore();
    }
    const mediaPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('NotAllowedError'));
    delete a.sfxBuffers['status-effects/heal'];before=audible();a.playStatusEffectSound('heal');await wait(100);
    check('native rejection falls back to the original synth',audible()>before);
    HTMLMediaElement.prototype.play=mediaPlay;
    // A delayed background suspend must complete before ANY synth family starts.
    const suspend=ctx.suspend.bind(ctx);
    ctx.suspend=async()=>{await wait(60);return suspend();};
    a.isPlayingBGM=true;
    a.handleAppBackground();const recovery=a.handleAppForeground();
    before=audible();a.playCardClubSound('shuffle');a.playShogiGimmickSound('WARP');a.playRpgRhythmHit(0,true);a.playSound('select');
    await wait(20);check('foreground barrier prevents premature nodes',audible()===before);
    await recovery;await wait(80);check('queued foreground cues resume together',audible()>before);ctx.suspend=suspend;a.stopBGM();

    // Cancellation is checked after awaiting recovery, not just when requesting it.
    let simulated=interrupt(ctx);before=audible();a.playCardClubSound('deal');a.playSound('jump');a.toggleMute();await wait(110);
    check('muting cancels queued synth cues',audible()===before);a.toggleMute();simulated.restore();
    simulated=interrupt(ctx);before=audible();a.playCardClubSound('deal');a.playSound('jump');a.handleAppBackground();await wait(110);
    check('backgrounding cancels queued synth cues',audible()===before);simulated.restore();await a.handleAppForeground();
    before=audible();a.setSfxVolume(0);a.playCardClubSound('deal');a.playRpgRhythmHit(0,true);a.playSound('jump');await wait(30);
    check('zero SFX volume suppresses effects',audible()===before);a.setSfxVolume(.6);

    const originalMediaPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=()=>new Promise(resolve=>setTimeout(resolve,60));
    const voiceName='high-school-voice-background-test';a.sfxPlaybackGenerations.set(voiceName,1);
    a.voiceBuffers[voiceName]=ctx.createBuffer(1,4800,48000);
    before=audible();const pendingVoice=a.playVoiceFile(voiceName,['/sfx/high-school-voices/HS_MALE/attack-1.ogg'],500,false,1);
    await wait(10);a.handleAppBackground();await pendingVoice;await wait(20);
    check('background cancellation does not fall back to an audible voice',audible()===before);
    HTMLMediaElement.prototype.play=originalMediaPlay;await a.handleAppForeground();

    // Gestures prime output even if WebKit reports running but its output is locked.
    before=window.nodes.filter(n=>n.kind==='prime').length;
    window.dispatchEvent(new Event('touchend'));await wait(10);
    check('touchend primes running Web Audio',window.nodes.filter(n=>n.kind==='prime').length>before);

    const craft=new CraftSound();craft.enabled=true;craft.unlock();await wait(30);
    let craftContext=craft.context;await craftContext.resume();simulated=interrupt(craftContext);
    before=audible();craft.play('harvest');await wait(110);
    check('craft first action survives interrupted resume',audible()>before);simulated.restore();
    simulated=interrupt(craftContext);before=audible();craft.play('craft');craft.toggle();window.dispatchEvent(new Event('touchend'));await wait(110);
    check('disabled craft does not wake or replay cues',audible()===before);simulated.restore();craft.toggle();await wait(20);
    await craft.context.close();craft.unlock();await wait(20);
    check('craft replaces closed contexts',craft.context!==craftContext&&craft.context.state!=='closed');
    craftContext=craft.context;await craftContext.resume();simulated=interrupt(craftContext);before=audible();craft.play('harvest');craft.close();await wait(110);
    check('closing craft cancels pending sounds',audible()===before);simulated.restore();

    const kart=new KartAudio();await kart.unlock();const kc=kart.context;await kc.resume();
    simulated=interrupt(kc);kart.update(null,'player');await wait(110);
    check('kart game loop recovers an interrupted engine',simulated.state()==='running');simulated.restore();kart.close();

    const song=new Audio();Object.defineProperty(song,'paused',{get:()=>false});
    const scratch=createSongScratch(song);scratch.prepare();
    // Capture the scratch context from a source created by the media graph.
    const contexts=[];const Original=window.AudioContext;
    window.AudioContext=new Proxy(Original,{construct(target,args){const context=new target(...args);contexts.push(context);return context;}});
    const song2=new Audio();Object.defineProperty(song2,'paused',{get:()=>false});const scratch2=createSongScratch(song2);scratch2.prepare();
    window.AudioContext=Original;const sc=contexts[0];await sc.resume();simulated=interrupt(sc);scratch2.prepare();await wait(110);
    check('song scratch recovers interrupted (not only suspended) contexts',simulated.state()==='running');simulated.restore();scratch2.dispose();scratch.dispose();

    // Denied/hung resume is bounded, and never causes an audible stale burst later.
    simulated=interrupt(ctx,0,true);before=audible();
    const started=performance.now();check('hung resume reports failure',await resumeGameAudio(ctx)===false);
    check('hung resume has a bounded wait',performance.now()-started<1400);
    a.playSound('attack');a.playRpgRhythmHit(0,true);await wait(1100);simulated.restore();
    check('unrecoverable context does not queue stale action sounds',audible()===before);
    a.stopAllAudio();return outcomes;
  });
  const mp3Files=readdirSync('public/sfx',{recursive:true}).filter(file=>file.endsWith('.mp3'));
  assert.ok(mp3Files.length>=100,'packaged SFX assets must be checked out');
  const decodeFailures=await page.evaluate(async files=>{
    const a=window.audio,names=files.map(file=>file.replace(/\\/g,'/').replace(/\.mp3$/,''));
    await a.preloadSfx(names);return names.filter(name=>!a.sfxBuffers[name]);
  },mp3Files.map(file=>file.split(path.sep).join('/')));
  assert.deepEqual(decodeFailures,[],'all packaged MP3 effects decode successfully');
  console.log(`✓ ${mp3Files.length} packaged MP3 effects decoded`);
  assert.deepEqual(pageErrors,[],'uncaught browser errors');
  for(const result of results)console.log(`✓ ${result}`);
  console.log(`✓ ${results.length} iOS audio recovery checks (${browserType.name()})`);
} finally {
  await browser?.close();await server.close();
}
