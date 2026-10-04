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
  const mobile = await browser.newPage({locale:'ja-JP', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); mobile.on('pageerror', e => errors.push(e.message));
  mobile.setDefaultTimeout(60000); await mobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); await mobile.getByRole('button',{name:'ひとりでレース',exact:true}).tap();await mobile.getByRole('button',{name:'問題を選んでレースへ',exact:true}).tap();
  const mathCategory = mobile.getByRole('button', { name: '算数・数学' });
  const categoryBefore = await mathCategory.evaluate(button => getComputedStyle(button).backgroundColor);
  await mathCategory.tap();
  await mobile.waitForTimeout(250);
  const categoryAfter = await mathCategory.evaluate(button => getComputedStyle(button).backgroundColor);
  assert.notEqual(categoryAfter, categoryBefore, 'Selected subject should have a distinct highlight.');
  const mathUnit = mobile.getByRole('button', { name: /かずとすうじ/ });
  const unitBefore = await mathUnit.evaluate(button => getComputedStyle(button).backgroundColor);
  await mathUnit.tap();
  await mobile.waitForTimeout(250);
  const unitAfter = await mathUnit.evaluate(button => getComputedStyle(button).backgroundColor);
  assert.notEqual(unitAfter, unitBefore, 'Selected unit should have a distinct highlight.');
  await mobile.waitForFunction(() => window.kartAudio?.context?.state === 'running');
  await mobile.getByRole('button', { name: 'この条件で開始', exact: true }).tap(); await mobile.getByRole('button', { name: /レースを開始/ }).tap();
  await mobile.waitForFunction(() => window.room?.world?.phase === 'race');
  await mobile.evaluate(() => { const w = window.room.world, p = w.players.local; p.distance = 99.9; p.speed = 20; p.x = 9 - w.lesson.questions[0].correct * 6; p.slide = 0; p.steer = 0; });
  await mobile.waitForFunction(() => window.room.world.players.local.quizAnswers[0] !== -2 && window.kartCueLog?.includes(1047));
  assert(await mobile.evaluate(() => window.kartAudio.context.state === 'running' && window.kartAudio.motorGain.gain.value > 0), 'Mobile touch start should unlock audible engine audio.');
  const mobileRms = await mobile.evaluate(async () => { const a = window.kartAudio.context.createAnalyser(); window.kartAudio.master.connect(a); await new Promise(r => setTimeout(r, 200)); const data = new Float32Array(a.fftSize); a.getFloatTimeDomainData(data); window.kartAudio.master.disconnect(a); return Math.sqrt(data.reduce((n, v) => n + v * v, 0) / data.length); });
  assert(mobileRms > .001, `Silent mobile kart audio: ${mobileRms}`);
  await mobile.evaluate(() => { const w = window.room.world, p = w.players.local; p.distance = 249.9; p.speed = 20; p.x = 9 - ((w.lesson.questions[1].correct + 1) % 4) * 6; p.slide = 0; p.steer = 0; });
  await mobile.waitForFunction(() => window.room.world.players.local.quizAnswers[1] !== -2 && window.kartCueLog?.includes(165));
  await mobile.evaluate(() => { const w = window.room.world, p = w.players.local; p.boost = 0; window.kartAudio.update(w, 'local'); p.boost = 1.5; window.kartAudio.update(w, 'local'); });
  await mobile.waitForFunction(() => window.kartCueLog?.includes(660));
  await mobile.evaluate(() => { const w = window.room.world, p = w.players.local; p.steer = .5; p.drift = true; p.speed = Math.max(30, p.speed); window.kartAudio.update(w, 'local'); });
  await mobile.waitForFunction(() => window.kartSkidTargets > 0, null, { timeout: 5000 });
  await mobile.evaluate(() => { const w = window.room.world, p = w.players.local; p.crash = 0; window.kartAudio.update(w, 'local'); p.crash = 1.5; window.kartAudio.update(w, 'local'); });
  await mobile.waitForFunction(() => window.kartCueLog?.includes(70));
  await mobile.close();

  const page = await browser.newPage({locale:'ja-JP', viewport: { width: 1440, height: 960 } }); page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(60000); await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.getByRole('button',{name:'ひとりでレース',exact:true}).click();
  await page.waitForFunction(() => document.querySelector('canvas')?.width > 10);
  assert.equal(await page.locator('.gk-render-error').count(), 0);
  await page.screenshot({ path: path.join(root, 'garage-desktop.png') });
  for (const [label, course] of [['cloud', 'CLOUD GARDEN'], ['solar', 'SOLAR WORKS'], ['neon', 'NEON CAMPUS']]) {
    await page.locator('.gk-setup select').selectOption({label:course});
    await page.waitForTimeout(250); assert.equal(await page.locator('.gk-render-error').count(), 0);
    await page.screenshot({ path: path.join(root, `garage-${label}.png`) });
  }
  await page.getByRole('button',{name:'問題を選んでレースへ',exact:true}).click(); await page.screenshot({path:path.join(root,'lesson-picker.png')}); assert.equal(await page.getByRole('button',{name:'入力',exact:true}).count(),0); await page.getByRole('button', { name: 'この条件で開始', exact: true }).click(); await page.getByRole('button', { name: /レースを開始/ }).click();
  await page.waitForFunction(() => window.room?.world?.phase === 'race');
  assert.equal(await page.evaluate(() => Object.keys(window.room.world.players).length), 40);
  await page.evaluate(() => { window.room.world.players.local.x = 0; });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(300); await page.keyboard.up('ArrowRight');
  assert(await page.evaluate(() => window.room.world.players.local.x < 0), 'Right input should steer toward screen-right.');
  await page.waitForTimeout(800); await page.screenshot({ path: path.join(root, 'race-desktop.png') });
  for (const [label, width, height] of [['phone', 390, 844], ['tablet', 820, 1180], ['landscape', 844, 390]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(350);
    assert(await page.evaluate(() => document.querySelector('.gk-root').scrollWidth <= innerWidth + 1), `${label} horizontal overflow`);
    const drift = await page.getByRole('button', { name: /DRIFT/ }).boundingBox(); assert(drift && drift.y + drift.height <= height + 1, `${label} controls clipped`);
    if (label === 'phone') {
      const left = await page.getByRole('button', { name: 'Steering stick' }).boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: left.x + 24, y: left.y + left.height / 2, id: 1 }, { x: drift.x + drift.width / 2, y: drift.y + drift.height / 2, id: 2 }] });
      await page.waitForFunction(() => window.room.world.players.local.steer === 1 && window.room.world.players.local.drift);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => window.room.world.players.local.steer === 0 && !window.room.world.players.local.drift); await cdp.detach();
    }
    await page.screenshot({ path: path.join(root, `race-${label}.png`) });
  }
  const lesson = await page.evaluate(() => window.room.world.lesson);
  assert.equal(lesson.questions.length, 3);
  await page.evaluate(() => { const p=window.room.world.players.local; p.quizAnswers=[-2,-2,-2];p.quizCorrect=0;p.quizApplied=false; });
  for(let i=0;i<3;i++) {
    await page.evaluate(i=>{const w=window.room.world,p=w.players.local;p.distance=[100,250,400][i]-.1;p.speed=20;p.x=9-w.lesson.questions[i].correct*6;p.slide=0;p.steer=0;},i);
    await page.waitForFunction(i=>window.room.world.players.local.quizCorrect===i+1,i);
    await page.locator('.gk-answer-mark').filter({hasText:'〇'}).waitFor();
    if(i===0) await page.screenshot({path:path.join(root,'quiz-correct.png')});
  }
  await page.evaluate(()=>{const p=window.room.world.players.local;p.distance=449.9;p.speed=20;});
  await page.waitForFunction(()=>window.room.world.players.local.quizApplied && window.room.world.players.local.boost>0);
  await page.locator('.gk-quiz-summary').waitFor();
  await page.screenshot({path:path.join(root,'quiz-perfect.png')});
  const lapLength = await page.evaluate(async () => (await import('/src/mini-games/gakuro-kart/track.ts')).getTrack(0).length);
  await page.evaluate(distance=>{const w=window.room.world,p=w.players.local;p.distance=distance+99.9;p.speed=20;p.x=9-w.lesson.questions[0].correct*6;p.slide=0;p.steer=0;},lapLength);
  await page.waitForFunction(()=>window.room.world.players.local.quizLap===1 && window.room.world.players.local.quizAnswers[0]!==-2);
  await page.waitForFunction(()=>document.querySelector('.gk-board-top')?.textContent.includes('LAP 2'));
  assert.match(await page.locator('.gk-board-top').innerText(), /LAP 2/);
  assert(await page.evaluate(()=>window.kartAudio.context.state==='running' && window.kartAudio.motorGain.gain.value>0));
  const rms=await page.evaluate(async()=>{const a=window.kartAudio.context.createAnalyser();window.kartAudio.master.connect(a);await new Promise(r=>setTimeout(r,200));const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);window.kartAudio.master.disconnect(a);return Math.sqrt(data.reduce((n,v)=>n+v*v,0)/data.length);}); assert(rms>.001,`Silent race audio: ${rms}`);
  await page.getByRole('button',{name:'Sound toggle'}).click(); await page.waitForTimeout(250); assert(await page.evaluate(()=>window.kartAudio.master.gain.value<.001));
  await page.getByRole('button',{name:'Sound toggle'}).click();
  await page.evaluate(()=>{window.room.world.phase='result';window.room.world.revision++;});
  await page.getByRole('button',{name:'もう一度レース',exact:true}).click();
  await page.waitForFunction(()=>window.room.world.phase==='countdown' && window.room.world.players.local.quizAnswers.every(a=>a===-2));
  await page.waitForFunction(()=>window.room.world.phase==='race');
  for(let i=0;i<3;i++) {
    await page.evaluate(i=>{const w=window.room.world,p=w.players.local;p.distance=[100,250,400][i]-.1;p.speed=20;p.x=9-((w.lesson.questions[i].correct+1)%4)*6;p.slide=0;p.steer=0;},i);
    await page.waitForFunction(i=>window.room.world.players.local.quizAnswers[i]!==-2,i);
  }
  await page.evaluate(()=>{const p=window.room.world.players.local;p.distance=449.9;p.speed=20;});
  await page.waitForFunction(()=>window.room.world.players.local.crash>0);
  await page.locator('.gk-quiz-summary').filter({hasText:'クラッシュ！'}).waitFor();
  await page.waitForTimeout(200);
  await page.screenshot({path:path.join(root,'quiz-crash.png')});
  if (!process.argv.includes('--visual-only')) {
  // Two independent pages, 40 real WebRTC peers and 39 host data channels.
  await page.close();
  const hostPage = await browser.newPage(), clients = await browser.newPage();
  for (const p of [hostPage, clients]) { p.on('pageerror', e => errors.push(e.message)); await p.goto(`${url}?network`, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForFunction(() => !!window.KartRoom); }
  const code = await hostPage.evaluate(async () => { window.host = new window.KartRoom(w => { window.snapshot = w; }, m => { window.message = m; }); await window.host.create('Host', 0, 0); return window.host.code; });
  await hostPage.evaluate(lesson=>window.host.setLesson(lesson),lesson);
  await clients.evaluate(async code => {
    window.rooms = []; window.snapshots = [];
    for (let batch = 0; batch < 13; batch++) await Promise.all(Array.from({ length: 3 }, async (_, j) => {
      const i = batch * 3 + j, r = new window.KartRoom(w => { window.snapshots[i] = w; }, () => {}); window.rooms.push(r); await r.join(code, `Player ${i + 1}`, i % 3);
    }));
  }, code);
  await clients.waitForFunction(() => window.snapshots.length === 39 && window.snapshots.every(w => Object.keys(w?.players || {}).length === 40));
  assert.equal(await hostPage.evaluate(() => Object.keys(window.host.world.players).length), 40);
  assert(await clients.evaluate(()=>window.snapshots.every(w=>w.lesson?.questions.length===3)));
  const overflow = await clients.evaluate(async code => { const r = new window.KartRoom(() => {}, () => {}); try { await r.join(code, 'Overflow', 0); return false; } catch { return true; } finally { r.close(); } }, code); assert(overflow);
  await hostPage.evaluate(() => window.host.start(false));
  await clients.waitForFunction(() => window.snapshots.every(w => w.phase === 'race'));
  await clients.evaluate(() => { window.inputs = setInterval(() => window.rooms.forEach(r => r.send({ type: 'input', steer: .15, brake: false, drift: false })), 50); });
  await clients.waitForTimeout(2000);
  assert(await clients.evaluate(() => window.snapshots.every(w => w.time > 1 && Object.values(w.players).some(p => p.speed > 10))));
  const hostTime = await hostPage.evaluate(() => window.host.world.time), times = await clients.evaluate(() => window.snapshots.map(w => w.time)); assert(times.every(t => Math.abs(t - hostTime) < .5));
  const pausedAt = await hostPage.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); return window.host.world.time; });
  await clients.waitForFunction(() => window.snapshots.every(w => w.paused));
  await clients.waitForTimeout(300); assert.equal(await hostPage.evaluate(() => window.host.world.time), pausedAt);
  await hostPage.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await clients.waitForFunction(() => window.snapshots.every(w => !w.paused));
  await clients.evaluate(() => clearInterval(window.inputs));
  for(let i=0;i<3;i++) {
    await hostPage.evaluate(i=>{const w=window.host.world;for(const p of Object.values(w.players)){const lane=i<p.slot%4?w.lesson.questions[i].correct:(w.lesson.questions[i].correct+1)%4;p.distance=[100,250,400][i]-.1;p.speed=20;p.x=9-lane*6;p.slide=0;p.steer=0;}},i);
    await clients.waitForFunction(i=>window.snapshots.every(w=>Object.values(w.players).every(p=>p.quizAnswers[i]!==-2)),i);
  }
  await hostPage.evaluate(()=>{for(const p of Object.values(window.host.world.players)){p.distance=449.9;p.speed=20;}});
  await clients.waitForFunction(()=>window.snapshots.every(w=>Object.values(w.players).every(p=>p.quizApplied && p.quizCorrect===p.slot%4 && p.quizCorrectTotal===p.slot%4)));
  const networkLapLength = await hostPage.evaluate(() => import('/src/mini-games/gakuro-kart/track.ts').then(m => m.getTrack(0).length));
  await hostPage.evaluate(distance=>{const w=window.host.world;for(const p of Object.values(w.players)){p.distance=distance+99.9;p.speed=20;p.x=9-((w.lesson.questions[0].correct+1)%4)*6;p.slide=0;p.steer=0;}},networkLapLength);
  await clients.waitForFunction(()=>window.snapshots.every(w=>Object.values(w.players).every(p=>p.quizLap===1 && p.quizAnswers[0]!==-2 && p.quizCorrect===0 && p.quizCorrectTotal===p.slot%4)));
  await clients.evaluate(() => { window.rooms[0].close(); });
  await hostPage.waitForFunction(() => Object.values(window.host.world.players).filter(p => p.cpu).length === 1);
  // Drive a completed result through the real wire and verify a roster reset/rematch.
  await hostPage.evaluate(() => { window.host.world.phase = 'result'; window.host.world.revision++; });
  await clients.waitForFunction(() => window.snapshots.filter(Boolean).slice(1).every(w => w.phase === 'result'));
  await hostPage.evaluate(() => window.host.rematch());
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w.phase === 'countdown' && w.lesson.questions.length===3 && Object.values(w.players).every(p=>p.quizAnswers.every(a=>a===-2)) && Object.keys(w.players).length === 40 && Object.values(w.players).filter(p => p.cpu).length === 1));
  await hostPage.evaluate(() => window.host.close());
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w === null));
  }
  assert.deepEqual(errors, []);
  console.log(process.argv.includes('--visual-only') ? 'Mobile touch audio (engine, correct/wrong, boost, tire and crash cues), three course previews, desktop/phone/tablet/landscape rendering, keyboard and simultaneous touch controls passed.' : 'Problem selection, 3 gate answers, correct feedback, boost, crash, audio signal/mute, UI restart; responsive rendering and touch controls; lesson/effect synchronization across 40 real WebRTC peers; 41st rejection; inputs and snapshot synchronization; pause/resume; disconnect CPU takeover; result/rematch; host departure passed.');
} finally { await browser.close(); await server.close(); signaling?.close(); peerServer.emit('close'); }
// PeerServer 1.x keeps internal maintenance timers alive after HTTP close.
process.exit(0);
