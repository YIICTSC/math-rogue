import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';

// Exercise the shipped React scene, lights and materials, not a separate showcase renderer.
const directory = 'tmp/kotoba-plush';
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/index.html`, '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#ede7dc}#stage{position:fixed;inset:0}button{position:fixed;z-index:2;bottom:10px}</style><div id="root"></div><script type="module" src="./entry.tsx"></script></html>');
await writeFile(`${directory}/entry.tsx`, `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import Scene from '/src/mini-games/kotoba-life/CompanionScene';
function App(){const [s,set]=useState({characterId:'mugi',reaction:'idle',reactionKey:0,reducedMotion:true,speaking:false});window.setPlush=set;return <div id="stage"><Scene {...s} onPet={()=>window.pets=(window.pets||0)+1}/></div>;}createRoot(document.getElementById('root')).render(<App/>);`);
await writeFile(`${directory}/game.html`, '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><div id="root"></div><script type="module" src="./game.tsx"></script></html>');
await writeFile(`${directory}/game.tsx`, `import React from 'react';import{createRoot}from'react-dom/client';import KotobaLife from '/src/mini-games/kotoba-life/KotobaLife';import '/src/styles.css';createRoot(document.getElementById('root')).render(<KotobaLife onBack={()=>{}} languageMode="JAPANESE"/>);`);
const server = await createServer({ configFile: false, plugins: [react()], define: { __APP_ASSET_VERSION__: JSON.stringify('kotoba-plush-test') }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 740 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text()); });
await page.addInitScript(() => {
  window.plushFrames = 0;
  const render = WebGL2RenderingContext.prototype.clear;
  WebGL2RenderingContext.prototype.clear = function (...args) { window.plushFrames++; return render.apply(this, args); };
});
const shot = async name => { await page.screenshot({ path: `${directory}/${name}.png` }); console.log('Screenshot:', name); };
const show = async (characterId, reaction = 'idle', extra = {}) => {
  const before = await page.evaluate(() => window.plushFrames);
  await page.evaluate(s => window.setPlush(s), { characterId, reaction, reactionKey: Date.now(), reducedMotion: true, speaking: false, ...extra });
  await page.locator(`[data-character="${characterId}"][data-renderer="webgl"] canvas`).waitFor();
  await page.waitForFunction(n => window.plushFrames > n + 6, before);
};
try {
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/${directory}/index.html`);
  await page.waitForFunction(() => typeof window.setPlush === 'function');
  await page.locator('[data-renderer="webgl"] canvas').waitFor();
  await page.evaluate(() => { window.firstCanvas = document.querySelector('canvas'); });
  for (const id of ['mugi', 'momo', 'sora', 'kohaku', 'pico']) {
    await show(id); await shot(`${id}-idle`);
    await show(id, 'wave'); await shot(`${id}-wave`);
    await show(id, 'eat'); await shot(`${id}-eat`);
    await show(id, 'joy', { speaking: true }); await shot(`${id}-speaking`);
    // Switching friends frees model resources while retaining the warm GL renderer.
    assert.equal(await page.locator('canvas').count(), 1);
    assert(await page.evaluate(() => document.querySelector('canvas') === window.firstCanvas));
  }
  await show('mugi');
  await page.mouse.click(320, 300);
  await page.waitForFunction(() => window.pets > 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await show('momo'); await shot('momo-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await show('kohaku'); await shot('kohaku-landscape');
  // WebGL recovery must rebuild the new texture/fiber resources as well as the base model.
  await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    window.loss = gl.getExtension('WEBGL_lose_context'); window.loss.loseContext();
  });
  await page.locator('[data-renderer="fallback"]').waitFor();
  await page.evaluate(() => window.loss.restoreContext());
  await page.locator('[data-renderer="webgl"] canvas').waitFor();
  await show('pico'); await shot('pico-restored');
  // Final visual evidence in the real game, with its room, dialogue and action dock.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/${directory}/game.html`);
  const button = name => page.getByRole('button', { name, exact: true });
  await button('小さな暮らしをはじめる').click();
  await button('この暮らしをはじめる').click();
  await page.locator('.kl-living').waitFor();
  for (const [id, name] of [['mugi','むぎ'],['momo','もも'],['sora','そら'],['kohaku','こはく'],['pico','ぴこ']]) {
    await button('ともだち・おへやを選ぶ').click();
    await page.getByRole('tab', { name: 'ともだち', exact: true }).click();
    await page.locator('.kl-friend-choices').getByRole('button', { name, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click();
    await page.locator(`.kl-character-stage [data-character="${id}"][data-renderer="webgl"] canvas`).waitFor();
    const before = await page.evaluate(() => window.plushFrames);
    await page.waitForFunction(n => window.plushFrames > n + 6, before);
    await shot(`game-${id}`);
  }
  for (const [width, height] of [[390,844], [844,390]]) {
    await page.setViewportSize({ width, height });
    const before = await page.evaluate(() => window.plushFrames);
    await page.waitForFunction(n => window.plushFrames > n + 6, before);
    await shot(`game-${width}`);
    assert(await page.evaluate(() => document.querySelector('.kl-root').scrollWidth <= innerWidth + 1));
    for (const box of await page.locator('.kl-action-dock button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()))) {
      assert(box.x >= 0 && box.y >= 0 && box.right <= width && box.bottom <= height, 'Actions stay in the viewport');
    }
  }
  assert.deepEqual(errors, [], 'No shader, GL or React errors');
  console.log('PASS: all five plush models, expressions, pet hit target, responsive sizing and WebGL context recovery.');
} finally { await browser.close(); await server.close(); }
