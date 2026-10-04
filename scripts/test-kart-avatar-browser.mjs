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
  const page = await browser.newPage({locale:'ja-JP',viewport:{width:1440,height:960}}); page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('button',{name:'ひとりでレース',exact:true}).click();await page.getByRole('button',{name:'キャラクタークリエイト',exact:true}).click();
  for (let i=0;i<8;i++) {
    await page.locator('.gk-avatar-species button').nth(i).click();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.gk-avatar-species button').nth(i).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.gk-render-error').count(),0);
  }
  await page.locator('.gk-avatar-species button').nth(0).click();
  for(let i=0;i<8;i++) {
    await page.locator('.gk-expressions button').nth(i).click();
    assert.equal(await page.locator('.gk-expressions button').nth(i).getAttribute('aria-pressed'),'true');
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.gk-render-error').count(),0);
    if([0,2,6].includes(i)) await page.locator('.gk-preview').screenshot({path:path.join(root,`expression-${i}.png`)});
  }
  await page.locator('.gk-expressions button').nth(6).click();
  for (let i=0;i<12;i++) {
    await page.locator('.gk-hairstyles').locator('button').nth(i).click();
    assert.equal(await page.locator('.gk-hairstyles').locator('button').nth(i).getAttribute('aria-pressed'),'true');
  }
  await page.locator('.gk-hairstyles').locator('button').nth(8).click();
  for (let i=0;i<8;i++) {
    await page.locator('.gk-kart-shapes button').nth(i).click();
    assert.equal(await page.locator('.gk-kart-shapes button').nth(i).getAttribute('aria-pressed'),'true');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.gk-render-error').count(),0);
    if ([1,2,5,6,7].includes(i)) await page.locator('.gk-preview').screenshot({path:path.join(root,`kart-shape-${i}.png`)});
  }
  await page.locator('.gk-avatar-accessories button').nth(3).click();
  await page.reload(); await page.getByRole('button',{name:'ひとりでレース',exact:true}).click();await page.getByRole('button',{name:'キャラクタークリエイト',exact:true}).click();await page.locator('.gk-avatar-editor').waitFor();
  assert.equal(await page.locator('.gk-avatar-species button').nth(0).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.gk-avatar-accessories button').nth(3).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.gk-expressions button').nth(6).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.gk-kart-shapes button').nth(7).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.gk-hairstyles').locator('button').nth(8).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(root,'avatar-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.querySelector('.gk-root').scrollWidth<=innerWidth+1));
  await page.locator('.gk-kart-shapes button').nth(6).click();
  const previewBox=await page.locator('.gk-preview').boundingBox();
  assert(previewBox && previewBox.y>=-1 && previewBox.y+previewBox.height<=844,'Mobile editor preview should stay visible while choosing a kart.');
  await page.locator('.gk-avatar-editor').screenshot({path:path.join(root,'avatar-phone.png')});
  await page.getByRole('button',{name:'戻る',exact:true}).click();await page.getByRole('button',{name:'問題を選んでレースへ',exact:true}).click();
  await page.getByRole('button',{name:'この条件で開始',exact:true}).click();
  await page.locator('.gk-ready-card summary').filter({hasText:'キャラクタークリエイト'}).click();await page.locator('.gk-ready-card .gk-avatar-species button').nth(3).click();await page.locator('.gk-ready-card summary').filter({hasText:'キャラクタークリエイト'}).click();
  assert.equal(await page.evaluate(()=>window.room.world.players.local.avatar.species),3);
  assert.equal(await page.evaluate(()=>window.room.world.players.local.avatar.expression),6);
  await page.screenshot({path:path.join(root,'avatar-lobby-phone.png')});
  await page.getByRole('button',{name:/レースを開始/}).click();
  assert.equal(await page.evaluate(()=>window.room.world.players.local.avatar.species),3);
  assert.equal(await page.evaluate(()=>window.room.world.players.local.avatar.expression),6);
  await page.close();
  if (!process.argv.includes('--ui-only')) {
  const hostPage = await browser.newPage(), clients = await browser.newPage();
  for (const p of [hostPage, clients]) { p.on('pageerror', e => errors.push(e.message)); await p.goto(`${url}?network`, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForFunction(() => !!window.KartRoom); }
  const code = await hostPage.evaluate(async () => { window.host = new window.KartRoom(w => { window.snapshot = w; }, m => { window.message = m; }); await window.host.create('Host', 0, 0); return window.host.code; });

  await clients.evaluate(async code => {
    window.rooms = []; window.snapshots = [];
    for (let batch = 0; batch < 13; batch++) await Promise.all(Array.from({ length: 3 }, async (_, j) => {
      const i = batch * 3 + j, r = new window.KartRoom(w => { window.snapshots[i] = w; }, () => {}); window.rooms.push(r); await r.join(code, `Player ${i + 1}`, i % 3, {species:i%8,body:i%8,outfit:i%8,hair:i%6,accessory:i%4,hairStyle:i%12,kart:i%8,expression:i%8});
    }));
  }, code);
  await clients.waitForFunction(() => window.snapshots.length === 39 && window.snapshots.every(w => Object.keys(w?.players || {}).length === 40));
  assert.equal(await hostPage.evaluate(() => Object.keys(window.host.world.players).length), 40);
  assert.equal(await clients.evaluate(()=>new Set(Object.values(window.snapshots[0].players).map(p=>p.avatar.species)).size),8);
  const overflow = await clients.evaluate(async code => { const r = new window.KartRoom(() => {}, () => {}); try { await r.join(code, 'Overflow', 0); return false; } catch { return true; } finally { r.close(); } }, code); assert(overflow);
  const custom = {species:4,body:4,outfit:2,hair:1,accessory:3,hairStyle:8,kart:6,expression:6};
  const driver = await clients.evaluate(custom => { const r = window.rooms[0]; r.setAvatar(custom); return r.selfId; }, custom);
  await hostPage.waitForFunction(({driver,custom}) => JSON.stringify(window.host.world.players[driver]?.avatar) === JSON.stringify(custom), {driver,custom});
  await clients.waitForFunction(({driver,custom}) => window.snapshots.every(w => JSON.stringify(w.players[driver]?.avatar) === JSON.stringify(custom)), {driver,custom});
  await hostPage.evaluate(() => window.host.start(false));
  await clients.evaluate(() => window.rooms[0].setAvatar({species:7,body:0,outfit:0,hair:0,accessory:0,hairStyle:0,kart:0,expression:0}));
  assert.deepEqual(await hostPage.evaluate(driver => window.host.world.players[driver].avatar, driver), custom);
  await clients.waitForFunction(() => window.snapshots.every(w => w.phase === 'race'));
  // Drive a completed result through the real wire and verify a roster reset/rematch.
  await hostPage.evaluate(() => { window.host.world.phase = 'result'; window.host.world.revision++; });
  await clients.waitForFunction(() => window.snapshots.every(w => w.phase === 'result'));
  await hostPage.evaluate(() => window.host.rematch());
  assert.deepEqual(await hostPage.evaluate(driver => window.host.world.players[driver].avatar, driver), custom);
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w.phase === 'countdown' && Object.values(w.players).every(p=>p.quizAnswers.every(a=>a===-2)) && Object.keys(w.players).length === 40 && Object.values(w.players).filter(p => p.cpu).length === 0));
  await hostPage.evaluate(() => window.host.close());
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w === null));
  }
  assert.deepEqual(errors,[]);
  console.log(process.argv.includes('--ui-only') ? 'Twelve hairstyles, eight kart shapes, persistence and mobile preview passed.' : 'Eight 3D avatars, twelve hairstyles, eight kart shapes, mobile/desktop editor, persistence, lobby changes, 40-peer avatar synchronization, race lock and rematch passed.');
} finally { await browser.close(); await server.close(); signaling?.close(); peerServer.emit('close'); }
process.exit(0);
