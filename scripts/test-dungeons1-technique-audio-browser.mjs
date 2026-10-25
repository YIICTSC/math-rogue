import assert from 'node:assert/strict';import fs from 'node:fs/promises';import{createServer}from'vite';import{chromium}from'playwright';
const entry=`.d1-voice-test-${process.pid}.ts`;let server,browser;
try{
 await fs.writeFile(entry,`import {audioService as a} from './src/services/audioService';Object.assign(window,{__audio:a});document.getElementById('start')!.onclick=()=>{a.setVoiceVolume(.31);(window as any).__playing=a.playDungeons1TechniqueVoice('elementary-warrior','fist-1');};`);
 server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'d1-voice-fixture',configureServer(s){s.middlewares.use('/__voice',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__voice',`<html><body><button id="start">Start</button><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__voice`);await page.waitForFunction(()=>window.__audio);await page.click('#start');
 await page.waitForFunction(()=>window.__audio.activeHtmlSfx.size>0||window.__audio.activeSfxSources.size>0);
 assert.equal(await page.evaluate(()=>window.__audio.getHtmlSfxVolume('dungeon-chronicle-voice-technique-elementary-warrior-fist-1')),.31);
 await page.evaluate(()=>{window.__second=window.__audio.playDungeons1TechniqueVoice('elementary-warrior','fist-2');});
 await page.waitForFunction(()=>[...window.__audio.activeHtmlSfx.keys(),...window.__audio.activeSfxSources.keys()].some(k=>k.endsWith('fist-2')));
 assert.equal(await page.evaluate(()=>[...window.__audio.activeHtmlSfx.keys(),...window.__audio.activeSfxSources.keys()].filter(k=>k.startsWith('dungeon-chronicle-voice-technique-')).length),1,'only the newest technique is playing');
 assert(await page.evaluate(()=>Promise.race([window.__playing.then(()=>true),new Promise(r=>setTimeout(()=>r(false),1000))])),'interrupted clip resolves');
 await page.evaluate(()=>window.__audio.stopDungeonChronicleVoices(true));
 assert(await page.evaluate(()=>Promise.race([window.__second.then(()=>true),new Promise(r=>setTimeout(()=>r(false),1000))])),'pause stops technique speech');
 assert.equal(await page.evaluate(async()=>{window.__audio.setVoiceVolume(0);return window.__audio.playDungeons1TechniqueVoice('elementary-warrior','fist-1');}),false);
 assert.equal(await page.evaluate(()=>window.__audio.playDungeons1TechniqueVoice('unknown','fist-1')),false);assert.deepEqual(errors,[]);
 console.log('PASS: real generated OGG playback, voice volume, one technique at a time, interruption and pause settle playback, mute and unknown-ID gates, zero browser errors.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
