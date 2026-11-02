import assert from 'node:assert/strict';import fs from 'node:fs/promises';import{createServer}from'vite';import{chromium}from'playwright';
const entry=`.d1-voice-test-${process.pid}.ts`;let server,browser;
try{
 await fs.writeFile(entry,`import {audioService as a} from './src/services/audioService';import{techniqueVoiceParts as parts}from'./src/components/school-dungeon/techniques/voiceParts';Object.assign(window,{__audio:a,__parts:parts});document.getElementById('start')!.onclick=()=>{a.setVoiceVolume(.31);(window as any).__playing=a.playDungeons1TechniqueVoice('elementary-warrior','fist-1','finisher');};`);
 server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error',plugins:[{name:'d1-voice-fixture',configureServer(s){s.middlewares.use('/__voice',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__voice',`<html><body><button id="start">Start</button><script type="module" src="/${entry}"></script></body></html>`));});}}]});
 await server.listen();browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__voice`);await page.waitForFunction(()=>window.__audio);await page.click('#start');
 await page.waitForFunction(()=>[...window.__audio.activeHtmlSfx.keys(),...window.__audio.activeSfxSources.keys()].some(k=>k.startsWith('dungeon-chronicle-voice-part-')));
 assert.equal(await page.evaluate(()=>window.__audio.getHtmlSfxVolume('dungeon-chronicle-voice-part-test')),.31);
 await page.evaluate(()=>{window.__second=window.__audio.playDungeons1TechniqueVoice('elementary-warrior','fist-2','finisher');});
 assert(await page.evaluate(()=>Promise.race([window.__playing.then(()=>true),new Promise(r=>setTimeout(()=>r(false),1000))])),'interrupted clip resolves');
 await page.evaluate(()=>window.__audio.stopDungeonChronicleVoices(true));
 assert(await page.evaluate(()=>Promise.race([window.__second.then(()=>true),new Promise(r=>setTimeout(()=>r(false),1000))])),'pause stops pending names too');
 const epoch=await page.evaluate(()=>window.__audio.dungeonTechniqueSequence);await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>window.__audio.dungeonTechniqueSequence),epoch);
 assert.equal(await page.evaluate(()=>[...window.__audio.activeSfxSources.keys()].filter(k=>k.startsWith('dungeon-chronicle-voice-part-')).length),0);
 await page.evaluate(()=>{window.__muted=window.__audio.playDungeons1TechniqueVoice('elementary-warrior','fist-1','finisher');window.__audio.setVoiceVolume(0);});assert(await page.evaluate(()=>Promise.race([window.__muted.then(()=>true),new Promise(r=>setTimeout(()=>r(false),1000))])));
 await page.evaluate(()=>{const a=window.__audio;a.setVoiceVolume(.31);window.__trace=[];const original=a.playVoiceFile.bind(a);a.playVoiceFile=(...args)=>{window.__trace.push(args[1][0]);return original(...args);};});
 assert.equal(await page.evaluate(()=>window.__audio.playDungeons1TechniqueVoice('dungeons2-lyria','sword-1')),true);
 assert.equal(await page.evaluate(()=>window.__trace.length),1);assert(await page.evaluate(()=>window.__trace[0].includes('d2-lyria-intro-')),'new D2 glimmer uses its own generated shout only');
 await page.evaluate(()=>window.__trace=[]);assert.equal(await page.evaluate(()=>window.__audio.playDungeons2VoiceFile('lyria','ultimate-3')),true);assert.equal(await page.evaluate(()=>window.__trace.length),2);assert(await page.evaluate(()=>window.__trace[0].includes('d2-lyria-intro-')&&window.__trace[1].includes('dungeons2-voices/lyria/ultimate-3.ogg')),'native finisher keeps its original name with its own prelude');
 assert.equal(await page.evaluate(()=>window.__audio.playDungeons1TechniqueVoice('unknown','fist-1')),false);assert.deepEqual(errors,[]);console.log('PASS: actual cut playback, voice volume, interruption, pause, pending-name cancellation and mute.');
}finally{await browser?.close();await server?.close();await fs.rm(entry,{force:true});}
