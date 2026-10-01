import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Use the actual game components and network clients. Only the curriculum
// picker is replaced with a fixed lesson, keeping this test focused on hosting.
const port = 10106;
await mkdir('tmp/host-spectator-ui', { recursive: true });
await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';
import RpgOnline from './src/rpg/RpgOnline';import GakuroKart from './src/mini-games/gakuro-kart/GakuroKart';
import GakuroCraft from './src/mini-games/gakuro-craft/GakuroCraft';import GakuroGolf from './src/mini-games/gakuro-golf/GakuroGolf';
import{RpgRoom}from'./src/rpg/network';import{KartRoom}from'./src/mini-games/gakuro-kart/network';
import{CraftRoom}from'./src/mini-games/gakuro-craft/network';import{GolfRoom}from'./src/mini-games/gakuro-golf/network';
const classes={rpg:RpgRoom,kart:KartRoom,craft:CraftRoom,golf:GolfRoom};
for(const Room of Object.values(classes)){const create=Room.prototype.create;Room.prototype.create=async function(...args){window.hostRoom=this;return create.apply(this,args);};}
window.guestRooms=[];window.guestViews=[];window.root=createRoot(document.getElementById('root'));
window.mountGame=game=>{const Component={kart:GakuroKart,craft:GakuroCraft,golf:GakuroGolf}[game];window.root.render(game==='rpg'?<RpgOnline player={{id:'WARRIOR',currentHp:100,maxHp:100,gold:0,deck:[]}} active languageMode="JAPANESE" adventureSetup={{visualTheme:'elementary',mode:'ADDITION',answerMode:'CHOICE',difficultyLevel:1}} onRoom={()=>{}} onSnapshot={()=>{}} onSetup={()=>{}} onClose={()=>{}}/>:<Component onClose={()=>{}} languageMode="JAPANESE" allowHost/>);};
window.joinGuests=async game=>{for(let i=0;i<2;i++){const Room=classes[game];const update=w=>window.guestViews[i]=w;const r=game==='craft'?new Room(update,()=>{},()=>{}):new Room(update,()=>{});window.guestRooms.push(r);await r.join(window.hostRoom.code,'Student '+(i+1),0);}};
window.cleanup=()=>{window.hostRoom?.close();window.guestRooms.forEach(r=>r.close());window.root.unmount();};`, loader: 'tsx', resolveDir: process.cwd() },
  outfile: 'tmp/host-spectator-ui/browser.js', bundle: true, format: 'esm',
  loader: { '.webp': 'file', '.png': 'file', '.jpg': 'file', '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file' },
  define: { 'import.meta.env': JSON.stringify({ VITE_ONLINE_SERVER_URL: `http://127.0.0.1:${port}` }) },
  plugins: [{ name: 'fixed-lesson', setup(b) { b.onLoad({ filter: /gakuro-(kart|craft|golf)\/LessonPicker\.tsx$/ }, () => ({ contents: `import React from 'react';export default function Picker({onSelect}){return <button onClick={()=>onSelect({mode:'ADDITION'})}>Use test lesson</button>;}`, loader: 'tsx' })); } }] });

const backend = spawn(process.execPath, ['server/dist/index.mjs'], { env: { ...process.env, PORT: String(port), ALLOWED_ORIGINS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
backend.stderr.on('data', d => process.stderr.write(d));
const web = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { res.end('<html><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/browser.css"></head><body><div id="root"></div><script type="module" src="/browser.js"></script></body></html>'); return; }
  const ext = pathname.split('.').pop();
  const type = { js: 'text/javascript', css: 'text/css', webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', mp3: 'audio/mpeg' }[ext];
  if (type) res.setHeader('Content-Type', type);
  try { res.end(await readFile(`tmp/host-spectator-ui${pathname}`)); }
  catch { try { res.end(await readFile(`public${pathname}`)); } catch { res.writeHead(404); res.end(); } }
});
let browser;
try {
  await new Promise((resolve, reject) => { backend.stdout.once('data', resolve); backend.once('exit', c => reject(Error(`Server exited ${c}`))); });
  await new Promise(r => web.listen(0, '127.0.0.1', r));
  browser = await chromium.launch({ headless: true });
  for (const game of (process.env.TEST_GAMES || 'rpg,kart,craft,golf').split(',')) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error(game, e.message); });
    await page.goto(`http://127.0.0.1:${web.address().port}`); await page.waitForFunction(() => window.mountGame);
    await page.evaluate(game => window.mountGame(game), game);
    const createLabel = { rpg: '部屋を作る', kart: /オンラインの部屋を作る/, craft: 'みんなの島を開く', golf: '問題を選んで部屋を作る' }[game];
    await page.getByRole('button', { name: createLabel, exact: typeof createLabel === 'string' }).click();
    if (game !== 'rpg') await page.getByRole('button', { name: 'Use test lesson' }).click();
    if (game !== 'craft') await page.locator('.host-spectator').waitFor();
    if (game === 'craft') await page.getByRole('button', { name: '閉じる', exact: true }).click();
    await page.getByRole('button', { name: '観戦モードにする', exact: true }).click();
    await page.getByText('参加プレイヤーを待っています。', { exact: true }).waitFor();
    await page.evaluate(game => window.joinGuests(game), game);
    await page.locator('.host-spectator strong').filter({ hasText: /Student/ }).waitFor();
    const before = await page.locator('.host-spectator strong').innerText();
    await page.getByRole('button', { name: '次のプレイヤー', exact: true }).click();
    await page.waitForFunction(before => document.querySelector('.host-spectator strong').textContent !== before, before);
    if (game !== 'craft') {
      const startLabel = { rpg: 'ゲーム開始', kart: /レースを開始/, golf: 'ラウンド開始' }[game];
      await page.getByRole('button', { name: startLabel }).click();
      if (game === 'rpg') { await page.locator('.rpg-map-container').waitFor(); assert.equal(await page.locator('.rpg-dpad').count(), 0); }
      if (game === 'kart') { await page.waitForFunction(() => window.hostRoom.world.phase === 'race'); assert.equal(await page.locator('.gk-controls').count(), 0); }
      if (game === 'golf') { await page.locator('.gg-hud').waitFor(); assert.equal(await page.getByRole('button', { name: '3問に挑戦', exact: true }).count(), 0); }
    } else {
      assert.equal(await page.locator('.gc-pad,.gc-study,.gc-toolbar').count(), 0);
    }
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('e');
    await page.screenshot({ path: `tmp/host-spectator-ui/${game}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '次のプレイヤー', exact: true }).click();
    await page.screenshot({ path: `tmp/host-spectator-ui/${game}-mobile.png` });
    assert.deepEqual(errors, [], `${game} runtime errors`);
    await page.evaluate(() => window.cleanup()); await page.close();
    console.log(`PASS ${game} actual host UI: mode, view switching, hidden controls and desktop/mobile layout.`);
  }
} finally { await browser?.close(); await new Promise(r => web.close(r)); backend.kill(); }
