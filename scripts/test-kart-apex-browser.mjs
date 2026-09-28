import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { PeerServer } from 'peer';
import { chromium } from 'playwright';

const root = path.resolve('tmp/kart-apex-qa'); await fs.mkdir(root, { recursive: true });
await fs.writeFile(path.join(root, 'index.html'), '<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0"><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await fs.writeFile(path.join(root, 'fixture.tsx'), `import React from 'react';import{createRoot}from'react-dom/client';import GakuroKart from '/src/mini-games/gakuro-kart/GakuroKart.tsx';import{KartRoom}from'/src/mini-games/gakuro-kart/network.ts';window.KartRoom=KartRoom;const practice=KartRoom.prototype.practice;KartRoom.prototype.practice=function(...args){window.room=this;return practice.apply(this,args)};if(!location.search.includes('network'))createRoot(document.getElementById('root')).render(<GakuroKart onClose={()=>{window.exited=true}}/>);`);
let signaling;
const peerServer = PeerServer({ port: 9017, path: '/kart', host: '127.0.0.1', proxied: false }, s => { signaling = s; });
const server = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-kart-apex-qa', optimizeDeps: { entries: ['tmp/kart-apex-qa/index.html'] }, plugins: [react()], logLevel: 'error',
  define: { 'import.meta.env.VITE_RPG_PEER_HOST': '"127.0.0.1"', 'import.meta.env.VITE_RPG_PEER_PORT': '"9017"', 'import.meta.env.VITE_RPG_PEER_PATH': '"/kart"', 'import.meta.env.VITE_RPG_PEER_SECURE': '"false"', 'import.meta.env.VITE_KART_ICE_SERVERS': JSON.stringify('[]') },
  server: { host: '127.0.0.1', port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const url = 'http://127.0.0.1:5198/tmp/kart-apex-qa/index.html', errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }); page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.getByRole('button', { name: /40台でレース/ }).waitFor();
  await page.waitForFunction(() => document.querySelector('canvas')?.width > 10);
  assert.equal(await page.locator('.gk-render-error').count(), 0);
  await page.screenshot({ path: path.join(root, 'garage-desktop.png') });
  for (const [label, course] of [['cloud', 'CLOUD GARDEN'], ['solar', 'SOLAR WORKS'], ['neon', 'NEON CAMPUS']]) {
    await page.locator('.gk-courses').getByRole('button', { name: new RegExp(course) }).click();
    await page.waitForTimeout(250); assert.equal(await page.locator('.gk-render-error').count(), 0);
    await page.screenshot({ path: path.join(root, `garage-${label}.png`) });
  }
  await page.getByRole('button', { name: /40台でレース/ }).click(); await page.getByRole('button', { name: /レースを開始/ }).click();
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
      const left = await page.getByRole('button', { name: 'Steer left' }).boundingBox();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: left.x + left.width / 2, y: left.y + left.height / 2, id: 1 }, { x: drift.x + drift.width / 2, y: drift.y + drift.height / 2, id: 2 }] });
      await page.waitForFunction(() => window.room.world.players.local.steer === 1 && window.room.world.players.local.drift);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => window.room.world.players.local.steer === 0 && !window.room.world.players.local.drift); await cdp.detach();
    }
    await page.screenshot({ path: path.join(root, `race-${label}.png`) });
  }
  if (!process.argv.includes('--visual-only')) {
  // Two independent pages, 40 real WebRTC peers and 39 host data channels.
  await page.close();
  const hostPage = await browser.newPage(), clients = await browser.newPage();
  for (const p of [hostPage, clients]) { p.on('pageerror', e => errors.push(e.message)); await p.goto(`${url}?network`); await p.waitForFunction(() => !!window.KartRoom); }
  const code = await hostPage.evaluate(async () => { window.host = new window.KartRoom(w => { window.snapshot = w; }, m => { window.message = m; }); await window.host.create('Host', 0, 0); return window.host.code; });
  await clients.evaluate(async code => {
    window.rooms = []; window.snapshots = [];
    for (let batch = 0; batch < 13; batch++) await Promise.all(Array.from({ length: 3 }, async (_, j) => {
      const i = batch * 3 + j, r = new window.KartRoom(w => { window.snapshots[i] = w; }, () => {}); window.rooms.push(r); await r.join(code, `Player ${i + 1}`, i % 3);
    }));
  }, code);
  await clients.waitForFunction(() => window.snapshots.length === 39 && window.snapshots.every(w => Object.keys(w?.players || {}).length === 40));
  assert.equal(await hostPage.evaluate(() => Object.keys(window.host.world.players).length), 40);
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
  await clients.evaluate(() => { clearInterval(window.inputs); window.rooms[0].close(); });
  await hostPage.waitForFunction(() => Object.values(window.host.world.players).filter(p => p.cpu).length === 1);
  // Drive a completed result through the real wire and verify a roster reset/rematch.
  await hostPage.evaluate(() => { window.host.world.phase = 'result'; window.host.world.revision++; });
  await clients.waitForFunction(() => window.snapshots.filter(Boolean).slice(1).every(w => w.phase === 'result'));
  await hostPage.evaluate(() => window.host.rematch());
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w.phase === 'countdown' && Object.keys(w.players).length === 40 && Object.values(w.players).filter(p => p.cpu).length === 1));
  await hostPage.evaluate(() => window.host.close());
  await clients.waitForFunction(() => window.snapshots.slice(1).every(w => w === null));
  }
  assert.deepEqual(errors, []);
  console.log(process.argv.includes('--visual-only') ? 'Three course previews, desktop/phone/tablet/landscape rendering, keyboard and simultaneous touch controls passed.' : 'Responsive rendering and touch controls; 40 real WebRTC peers; 41st rejection; inputs and snapshot synchronization; pause/resume; disconnect CPU takeover; result/rematch; host departure passed.');
} finally { await browser.close(); await server.close(); signaling?.close(); peerServer.emit('close'); }
// PeerServer 1.x keeps internal maintenance timers alive after HTTP close.
process.exit(0);
