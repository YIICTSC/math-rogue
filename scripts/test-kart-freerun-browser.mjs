import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { PeerServer } from 'peer';
import { chromium } from 'playwright';

const root = path.resolve('tmp/kart-apex-qa'); await fs.mkdir(root, { recursive: true });
await fs.writeFile(path.join(root, 'index.html'), '<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0"><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await fs.writeFile(path.join(root, 'fixture.tsx'), `import '/src/styles.css';import React from 'react';import{KartAudio}from'/src/mini-games/gakuro-kart/audio.ts';const unlock=KartAudio.prototype.unlock;KartAudio.prototype.unlock=function(){window.kartAudio=this;return unlock.apply(this)};const audioPrototype=KartAudio.prototype as any;const note=audioPrototype.note;audioPrototype.note=function(...args:any[]){window.kartCueLog??=[];window.kartCueLog.push(args[0]);return note.apply(this,args)};const setTarget=AudioParam.prototype.setTargetAtTime;AudioParam.prototype.setTargetAtTime=function(value,...args){if(value===.09){const w=window as any;w.kartSkidTargets=(w.kartSkidTargets||0)+1}return setTarget.call(this,value,...args)};import{createRoot}from'react-dom/client';import GakuroKart from '/src/mini-games/gakuro-kart/GakuroKart.tsx';import{KartRoom}from'/src/mini-games/gakuro-kart/network.ts';window.KartRoom=KartRoom;const practice=KartRoom.prototype.practice;KartRoom.prototype.practice=function(...args){window.room=this;return practice.apply(this,args)};if(!location.search.includes('network'))createRoot(document.getElementById('root')).render(<GakuroKart onClose={()=>{window.exited=true}}/>);`);
let signaling;
const peerServer = PeerServer({ port: 9017, path: '/kart', host: '127.0.0.1', proxied: false }, s => { signaling = s; });
const server = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-kart-apex-qa', optimizeDeps: { entries: ['tmp/kart-apex-qa/index.html'] }, plugins: [react()], logLevel: 'error',
  define: { 'import.meta.env.VITE_RPG_PEER_HOST': '"127.0.0.1"', 'import.meta.env.VITE_RPG_PEER_PORT': '"9017"', 'import.meta.env.VITE_RPG_PEER_PATH': '"/kart"', 'import.meta.env.VITE_RPG_PEER_SECURE': '"false"', 'import.meta.env.VITE_KART_ICE_SERVERS': JSON.stringify('[]') },
  server: { host: '127.0.0.1', port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const url = 'http://127.0.0.1:5198/tmp/kart-apex-qa/index.html', errors = [];
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('.gk-actions .gk-primary').click();
  await page.getByRole('button',{name:'この条件で開始',exact:true}).click();
  await page.locator('.gk-ready-card .gk-primary').click();
  await page.waitForFunction(()=>window.room?.world?.phase==='race');
  await page.evaluate(async()=>{
    const w=window.room.world,p=w.players.local,t=await import('/src/mini-games/gakuro-kart/track.ts');
    p.distance=t.getTrack(w.course).length*3-.1;p.speed=58;p.x=0;p.slide=0;p.quizLap=2;p.quizAnswers=[0,0,0];p.quizApplied=true;
  });
  await page.locator('.gk-finished').waitFor();
  assert.match(await page.locator('.gk-finished').innerText(),/FREE RUN/);
  assert.equal(await page.getByRole('button',{name:'Steer right'}).isEnabled(),true);
  assert.equal(await page.locator('.gk-quiz-board').count(),0);
  const result=await page.evaluate(()=>({finish:window.room.world.players.local.finish,distance:window.room.world.players.local.distance}));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');
  assert(await page.evaluate(()=>window.room.world.players.local.x<0));
  assert(await page.evaluate(distance=>window.room.world.players.local.distance>distance,result.distance));
  assert.equal(await page.evaluate(()=>window.room.world.players.local.finish),result.finish);
  assert(await page.evaluate(()=>window.kartAudio.context.state==='running'&&window.kartAudio.motorGain.gain.value>0));
  await page.evaluate(()=>{window.room.world.players.local.item='nitro'});
  await page.locator('.gk-item').waitFor({state:'visible'});await page.waitForTimeout(150);await page.locator('.gk-item').click();
  await page.waitForFunction(()=>window.room.world.players.local.boost>0);
  for(const [label,width,height] of [['desktop',1280,800],['phone',390,844]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(200);
    const banner=await page.locator('.gk-finished').boundingBox();assert(banner&&banner.height<140,'Free-run banner must not cover the race');
    await page.screenshot({path:path.join(root,`freerun-${label}.png`)});
  }
  await page.evaluate(()=>{for(const p of Object.values(window.room.world.players))if(!p.finish)p.finish=window.room.world.time;});
  await page.waitForFunction(()=>window.room.world.phase==='result');
  assert.equal(await page.evaluate(()=>window.room.world.players.local.finish),result.finish);
  assert.deepEqual(errors,[]);
  console.log('Post-finish controls, nitro, engine audio, frozen time, compact desktop/mobile banner and result transition passed.');
} finally {await browser.close();await server.close();signaling?.close();peerServer.emit('close');}
process.exit(0);
