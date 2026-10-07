import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
// PeerServer owns recurring maintenance timers; isolate it so teardown clears every timer.
const signaling = spawn(process.execPath, ['--input-type=module', '-e', `import { PeerServer } from 'peer'; PeerServer({ host: '127.0.0.1', port: 9014, path: '/golf' }, () => process.send('ready'));`], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
await new Promise((resolve, reject) => { const timeout = setTimeout(() => { signaling.kill(); reject(new Error('Signaling server did not start')); }, 10000); signaling.once('message', () => { clearTimeout(timeout); resolve(); }); signaling.once('error', error => { clearTimeout(timeout); reject(error); }); });
const server = await createServer({
  cacheDir: 'node_modules/.vite-golf-test', optimizeDeps: { entries: ['index.html'] },
  define: { 'import.meta.env.VITE_ONLINE_SERVER_URL': '""', 'import.meta.env.VITE_ENABLE_DEBUG_FEATURES': '"false"', 'import.meta.env.VITE_RPG_PEER_HOST': '"127.0.0.1"', 'import.meta.env.VITE_RPG_PEER_PORT': '"9014"', 'import.meta.env.VITE_RPG_PEER_PATH': '"/golf"', 'import.meta.env.VITE_RPG_PEER_SECURE': '"false"', 'import.meta.env.VITE_GOLF_ICE_SERVERS': '"[]"' },
  server: { host: '127.0.0.1', port: 5194, strictPort: true, watch: null, hmr: false },
  plugins: [{ name: 'golf-test-only', enforce: 'pre', async load(id) {
    if (id.endsWith('/src/App.tsx')) { const code = await readFile(id, 'utf8'); const at = code.lastIndexOf('\n    return ('); return code.slice(0, at) + '\n window.__golfApp = { debug: (v) => setIsDebugMode(v), screen: gameState.screen, setScreen: (screen) => setGameState(s => ({...s, screen})), language: setLanguageMode };\n' + code.slice(at); }
    if (id.endsWith('/gakuro-golf/GakuroGolf.tsx')) { const code = await readFile(id, 'utf8'); return code.replace('  return <TranslatedUiTree', '  window.__golf = { room: room.current, view, selectLesson };\n  return <TranslatedUiTree'); }
  }, configureServer(s) { s.middlewares.use('/__golf-network', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<html><body><script type="module">import {GolfRoom, validView} from "/src/mini-games/gakuro-golf/network.ts"; window.GolfRoom=GolfRoom; window.validView=validView;</script></body></html>'); }); } }],
});
await server.listen();
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(45000);
await page.addInitScript(() => localStorage.setItem('pixel_spire_language_mode_v1', 'JAPANESE'));
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await mkdir('tmp/golf-qa', { recursive: true });
  await page.goto('http://127.0.0.1:5194/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button', { name: '小学5年生', exact: true }).click();
  await page.getByRole('button', { name: 'あとで決める', exact: true }).last().click();
  await page.waitForFunction(() => !!window.__golfApp);

  assert.equal(await page.locator('.start-menu-online-games').count(), 0);
  const logo=page.locator('h1.start-menu-title');
  await logo.click(); await logo.click();
  assert.equal(await page.locator('.start-menu-online-games').count(), 0);
  await logo.click();
  assert.equal(await page.locator('.start-menu-online-games button').count(), 3);
  assert.equal(await page.locator('.start-menu-online-games').innerText().then(s=>s.includes('クラフト')), false);
  await page.locator('.start-menu-online-games button').last().click();
  const later=page.getByRole('button',{name:'あとで',exact:true});
  await Promise.race([later.waitFor(),page.locator('[data-game-title="golf"]').waitFor()]);
  if(await later.isVisible()) { await later.click(); if(!await page.locator('[data-game-title="golf"]').count()) await page.locator('.start-menu-online-games button').last().click(); }
  await page.locator('[data-game-title="golf"]').waitFor();
  await page.goto('http://127.0.0.1:5194/__golf-network');
  await page.waitForFunction(()=>!!window.GolfRoom);
  await page.evaluate(async()=>{
    window.hostView=null; window.guestView=null; window.netErrors=[];
    window.host=new window.GolfRoom(v=>window.hostView=v,m=>window.netErrors.push(m));
    await window.host.create('Host');
    window.guest=new window.GolfRoom(v=>window.guestView=v,m=>window.netErrors.push(m));
    window.guest.transport='server';
    await window.guest.join('H-'+window.host.code,'Guest');
  });
  await page.waitForFunction(()=>window.hostView?.players.length===2&&window.guestView?.players.length===2);
  assert.equal(await page.evaluate(()=>window.guest.transport),'host');
  assert.deepEqual(await page.evaluate(()=>window.netErrors),[]);
  await page.evaluate(()=>{window.guest.close();window.host.close();});
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: production title hides online games until exactly three logo taps, exposes only RPG/kart/golf and opens golf without debug.');
} finally { await browser.close(); await server.close(); signaling.kill(); }
