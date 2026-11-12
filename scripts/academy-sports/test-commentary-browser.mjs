import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
let server,browser;
try{
 server=await createServer({configFile:false,define:{__APP_ASSET_VERSION__:JSON.stringify('commentary-test')},logLevel:'error',cacheDir:'node_modules/.vite-commentary-qa',optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','three','peerjs','lucide-react']},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'commentary-qa',configureServer(s){s.middlewares.use('/commentary-test',async(_req,res)=>{res.setHeader('content-type','text/html');res.end(await s.transformIndexHtml('/commentary-test',`<button id="play">Play</button><div id="root"></div><script type="module">
import React from 'react';
import{createRoot}from'react-dom/client';
import Presentation from '/src/mini-games/academy-sports/AcademyPresentation.tsx';
import{audioService as audio}from'/src/services/audioService.ts';
import{createMatch}from'/src/mini-games/academy-sports/engine.ts';
import{defaultConfig}from'/src/mini-games/academy-sports/core.ts';
window.audio=audio;window.played=[];window.stops=0;
window.original=audio.playAcademyBroadcastVoiceFile.bind(audio);
audio.playAcademyBroadcastVoiceFile=async id=>{played.push(id);return true;};
audio.playAcademySportsVoiceFile=async()=>true;
const originalStop=audio.stopSportsVoices.bind(audio);audio.stopSportsVoices=()=>{stops++;originalStop();};
const root=createRoot(document.querySelector('#root'));window.unmount=()=>root.unmount();
window.state=createMatch(defaultConfig('baseball'));state.clock=10;
window.paused=false;window.draw=(paused=window.paused)=>{window.paused=paused;root.render(React.createElement(Presentation,{match:{...state},paused,languageMode:'JAPANESE'}));};
window.emit=text=>{state.events.push({id:++state.serial,at:10,kind:'whistle',text,actor:-1});draw();};draw();
document.querySelector('#play').onclick=async()=>{await audio.unlockAudio();window.result=await window.original(window.clip);};
window.ready=true;
</script>`));});}}]});
 await server.listen();browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message);});page.on('console',m=>{if(m.type()==='error')console.error('BROWSER',m.text());});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/commentary-test');await page.waitForFunction(()=>window.ready);await page.waitForTimeout(200);
 await page.evaluate(()=>emit('ストライク'));await page.waitForFunction(()=>played.includes('referee/baseball.strike'));await page.waitForFunction(()=>played.includes('analyst/baseball.strike'));
 assert.deepEqual(await page.evaluate(()=>played.slice(0,3)),['referee/baseball.strike','announcer/baseball.strike','analyst/baseball.strike']);
 const before=await page.evaluate(()=>stops);await page.evaluate(()=>draw(true));await page.waitForFunction(n=>stops>n,before);
 await page.evaluate(()=>{played=[];emit('フォアボール');});await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>played),[],'Paused events are consumed without speaking');
 await page.evaluate(()=>{window.paused=false;state.events=[];state.clock=10;state.id='late-join';state.serial=100;state.events=[{id:100,at:1,text:'ストライク',kind:'whistle',actor:-1}];draw();});await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>played),[],'No historical calls on late join');
 await page.evaluate(()=>emit('ボール'));await page.waitForFunction(()=>played.includes('referee/baseball.ball'));
 const b=await page.evaluate(()=>stops);await page.evaluate(()=>audio.setVoiceVolume(0));await page.waitForFunction(n=>stops>n,b);await page.evaluate(()=>audio.setVoiceVolume(1));
 await page.evaluate(()=>{played=[];state.id='fresh-match';state.clock=0;state.serial=0;state.events=[];draw(false);});await page.waitForFunction(()=>played.includes('analyst/common.start'));assert.deepEqual(await page.evaluate(()=>played.slice(0,3)),['referee/baseball.start','announcer/common.start','analyst/common.start']);await page.evaluate(()=>draw(true));
 if(process.argv.includes('--routing-only')){assert.deepEqual(errors,[]);console.log('PASS React commentary event routing and lifecycle.');await browser.close();await server.close();process.exit(0);}
 const manifest=JSON.parse(await fs.readFile('src/mini-games/academy-sports/broadcastVoices.generated.json','utf8'));assert.equal(Object.keys(manifest).length,78,'All bank files must be finalized before audio QA');
 // Decode every actual OGG, then play one clip per role through the real shared service.
 const decoded=await page.evaluate(async entries=>{await audio.unlockAudio();const ctx=new AudioContext();let count=0;for(const c of entries){const res=await fetch('/'+c.path);if(!res.ok)throw Error(c.path);const buf=await ctx.decodeAudioData(await res.arrayBuffer());if(buf.duration<.35)throw Error('Short '+c.path);count++;}await ctx.close();return count;},Object.values(manifest));assert.equal(decoded,78);
 for(const clip of ['announcer/baseball.homerun','analyst/baseball.out','referee/baseball.strike']){await page.evaluate(clip=>{window.clip=clip;window.result=null;},clip);await page.locator('#play').click();await page.waitForFunction(()=>window.result!==null,undefined,{timeout:20000});assert.equal(await page.evaluate(()=>window.result),true);}
 await page.evaluate(()=>audio.setVoiceVolume(0));assert.equal(await page.evaluate(()=>original('referee/baseball.strike')),false);
 await page.evaluate(()=>{audio.setVoiceVolume(1);window.pendingVoice=original('announcer/baseball.homerun');});await page.waitForFunction(()=>[...audio.activeHtmlSfx.entries(),...audio.activeSfxSources.entries()].some(([k,v])=>k.startsWith('sports-voice-broadcast-')&&v.size));await page.evaluate(()=>unmount());await page.evaluate(()=>window.pendingVoice);assert.equal(await page.evaluate(()=>[...audio.activeHtmlSfx.entries(),...audio.activeSfxSources.entries()].some(([k,v])=>k.startsWith('sports-voice-broadcast-')&&v.size)),false,'Unmount stops real in-flight audio');
 assert.deepEqual(errors,[]);console.log('PASS real React event routing, referee→announcer→analyst, pause, late join, mute, all 78 OGG decode and three-role actual playback.');
}finally{await browser?.close();await server?.close();}
