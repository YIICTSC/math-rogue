import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
let server,browser;
try{
 server=await createServer({configFile:false,logLevel:'error',cacheDir:'node_modules/.vite-academy-audio',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'sports-audio',configureServer(s){s.middlewares.use('/audio-test',async(_req,res)=>{res.setHeader('content-type','text/html');res.end(await s.transformIndexHtml('/audio-test',`<button id="play">Play</button><script type="module">import{audioService as audio}from'/src/services/audioService.ts';window.audio=audio;document.querySelector('#play').onclick=async()=>{await audio.unlockAudio();audio.playAcademySportsSound(window.sport,window.cue);};</script>`));});}}]});
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/audio-test');await page.waitForFunction(()=>window.audio);
 for(const sport of ['baseball','soccer','volleyball','festival'])for(const cue of ['hit','catch','whistle','cheer','special','bounce','score','hurt']){
  await page.evaluate(({sport,cue})=>Object.assign(window,{sport,cue}),{sport,cue});const response=page.waitForResponse(r=>r.url().includes('/sfx/academy-sports/'+sport+'/'+cue+'.')&&r.status()>=200&&r.status()<300,{timeout:20000});await page.locator('#play').click();
  try{await response;await page.waitForFunction(key=>!!window.audio.sfxBuffers[key],'academy-sports/'+sport+'/'+cue,{timeout:20000});}
  catch(error){console.error(await page.evaluate(()=>({muted:audio.isMuted,active:audio.appIsActive,volume:audio.sfxVolume,state:audio.ctx?.state,hidden:document.hidden})));throw error;}
 }
 assert.deepEqual(errors,[]);console.log('PASS all 32 sports SFX play through the shared service and decode to AudioBuffers after real pointer unlock.');
}finally{await browser?.close();await server?.close();}
