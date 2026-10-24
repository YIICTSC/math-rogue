import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const games = [
  ['card-club', 'CARD_CLUB'], ['kocho', 'KOCHO'], ['poker', 'POKER'], ['survivor', 'SURVIVOR'],
  ['dungeons', 'DUNGEON'], ['dungeons2', 'DUNGEON_2'], ['paper-plane', 'PAPER_PLANE'],
  ['go-home', 'GO_HOME'], ['shogi', 'SHOGI'], ['go', 'GO'], ['chess', 'CHESS'],
  ['mahjong', 'MAHJONG'], ['stone-glow', 'STONE_GLOW'], ['school-trpg', 'SCHOOL_TRPG'],
  ['learning-tcg', 'LEARNING_TCG'], ['vr', 'GAKUROGEAR'], ['crane', 'CRANE'],
  ['kart', 'KART'], ['golf', 'GOLF'],
];
const selectedGames = games.filter(([art]) => !process.env.TITLE_ART_GAMES || process.env.TITLE_ART_GAMES.split(',').includes(art));
const fixture = `.mini-game-title-art-qa-${process.pid}.tsx`;
const out = 'tmp/mini-game-title-art-qa';
let server, browser;
try {
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(fixture, `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import MiniGameRouter from './src/components/MiniGameRouter';
    const GakuroKart=React.lazy(()=>import('./src/mini-games/gakuro-kart/GakuroKart'));
    const GakuroGolf=React.lazy(()=>import('./src/mini-games/gakuro-golf/GakuroGolf'));
    import {GameMode} from './src/types';import {audioService} from './src/services/audioService';
    import './src/styles.css';
    audioService.playBGM=async()=>{};audioService.stopBGM=()=>{};audioService.setVoiceVolume(0);
    const params=new URLSearchParams(location.search);
    const exit=()=>{document.body.dataset.exited='true';};
    const screen=params.get('screen');
    createRoot(document.getElementById('root')).render(<React.Suspense fallback={null}>{screen==='MINI_GAME_KART'?<GakuroKart languageMode="JAPANESE" onClose={exit}/>:screen==='MINI_GAME_GOLF'?<GakuroGolf languageMode="JAPANESE" onClose={exit}/>:<MiniGameRouter screen={params.get('screen')}
      problemMode={GameMode.MIXED} languageMode="JAPANESE" onBack={()=>{document.body.dataset.exited='true';}}/>}</React.Suspense>);
  `);
  server = await createServer({ logLevel: 'error', cacheDir: 'node_modules/.vite-title-art-qa',
    optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client', 'react/jsx-runtime', 'peerjs', 'three', 'katex'] }, server: { host: '127.0.0.1', port: 0, hmr: false },
    plugins: [{ name: 'title-art-qa', configureServer(s) {
      s.middlewares.use('/title-art-qa', async (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(await s.transformIndexHtml(req.url, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="icon" href="data:,"/></head><body style="margin:0"><div id="root" style="height:100dvh;position:relative;overflow:hidden"></div><script type="module" src="/${fixture}"></script></body></html>`));
      });
    }}],
  });
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(90000);
  await page.addInitScript(() => localStorage.clear());
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  page.on('requestfailed', r => console.error('REQUEST FAILED', r.url(), r.failure()?.errorText));
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGEERROR', e.message); });
  page.on('response', r => { if (r.url().includes('/mini-game-titles/') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/title-art-qa`;
  for (const [art, screen] of selectedGames) {
    await page.goto(`${base}?screen=MINI_GAME_${screen}`);
    const image = page.locator(`[data-title-art="${art}"] img`);
    try { await image.waitFor({ state: 'visible' }); } catch (error) {
      await page.screenshot({ path: `${out}/${art}-failure.png` });
      console.error((await page.locator('body').innerText()).slice(0, 2000));throw error;
    }
    for (const [width, height] of [[1280, 800], [390, 844], [844, 390]]) {
      await page.setViewportSize({ width, height });
      const orientation = height > width ? 'portrait' : 'landscape';
      await page.waitForFunction(({ art, orientation }) => {
        const img = document.querySelector(`[data-title-art="${art}"] img`);
        return img?.complete && img.naturalWidth > 0 && img.currentSrc.includes(`${art}-${orientation}-v1.webp`);
      }, { art, orientation });
      await image.evaluate(img => img.decode());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${art}: horizontal overflow at ${width}x${height}`);
      const box = await image.boundingBox();
      assert(box && box.width >= width - 1 && box.height >= height - 1, `${art}: artwork must fill the title viewport at ${width}x${height}`);
      await page.screenshot({ path: `${out}/${art}-${width}x${height}.png` });
    }
    const entry = page.locator('.illustrated-mini-entry');
    if (await entry.count()) {
      await entry.locator('nav button').first().click();
      await entry.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0 && !document.querySelector('.illustrated-mini-entry'));
    }
    console.log(`PASS ${art}: dedicated portrait/landscape assets and orientation changes`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${selectedGames.length} games, ${selectedGames.length * 3} viewport checks, no missing title assets or runtime errors`);
} finally {
  await browser?.close();
  server?.httpServer?.closeAllConnections();
  await server?.close();
  await fs.rm(fixture, { force: true });
}
