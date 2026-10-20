import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright';

const markup = (await fs.readFile('index.html', 'utf8')).replace('<script type="module" src="/index.tsx"></script>', '');
const code = `/*${'download '.repeat(16000)}*/\ndocument.getElementById('root').innerHTML='<h1>GAME READY</h1>';window.dispatchEvent(new Event('learning-rogue-ready'));`;
const navigations = new Map(), requests = new Map();
let failing = false, slowRelease, slowStarted;
const slowGate = new Promise(resolve => slowRelease = resolve);
const started = new Promise(resolve => slowStarted = resolve);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://test'), id = url.searchParams.get('student') || 'default';
  if (/\.js$/.test(url.pathname)) {
    requests.set(id, (requests.get(id) || 0) + 1);
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Cache-Control', 'public,max-age=31536000,immutable');
    if (failing || (id === 'retry' && requests.get(id) <= 4)) { res.writeHead(503); res.end('Busy'); return; }
    if (url.pathname === '/old.js') { res.writeHead(404); res.end('Removed build'); return; }
    res.setHeader('Content-Length', Buffer.byteLength(code));
    if (id === 'slow') {
      res.write(code.slice(0, 40000)); slowStarted(); await slowGate;
      if (!res.destroyed) res.end(code.slice(40000));
    } else res.end(code);
  } else if (/\.css$/.test(url.pathname)) {
    res.setHeader('Content-Type', 'text/css');
    if (url.pathname === '/old.css') { res.writeHead(404); res.end('Removed stylesheet'); }
    else res.end('body{background:#020617}');
  } else if (url.pathname === '/') {
    if (req.headers['sec-fetch-mode'] === 'navigate') navigations.set(id, (navigations.get(id) || 0) + 1);
    const stale = id === 'stale' && req.headers['sec-fetch-mode'] === 'navigate';
    const file = stale ? 'old.js' : 'app.js';
    const config = { worker: false, entry: `./${file}?student=${id}`, resources: [{url:`./${file}?student=${id}`,bytes:Buffer.byteLength(code),style:false}] };
    if (id === 'css-stale') config.resources.push({url: stale ? './old.css' : req.headers['sec-fetch-mode'] === 'navigate' ? './old.css' : './new.css',bytes:23,style:true});
    res.setHeader('Content-Type', 'text/html'); res.end(markup.replace('</head>', `<script type="application/json" id="startup-config">${JSON.stringify(config)}</script></head>`));
  } else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.progressHistory = [];
    new MutationObserver(() => {
      const value = document.getElementById('startup-progress')?.value;
      if (value !== undefined) window.progressHistory.push(value);
    }).observe(document, {subtree:true, attributes:true, childList:true});
  });
  await page.goto(base + '?student=slow', {waitUntil:'domcontentloaded'}); await started;
  await page.waitForFunction(() => document.getElementById('startup-progress').value > 0);
  assert(await page.locator('#startup-status').isVisible());
  assert.equal(await page.locator('#root').innerText(), '');
  await fs.mkdir('tmp', {recursive:true}); await page.screenshot({path:'tmp/startup-progress-slow.png'});
  const partial = await page.locator('#startup-progress').evaluate(node => node.value);
  assert(partial > 0 && partial < 95, 'the gauge must track bytes during an unfinished transfer');
  await page.clock.install(); await page.clock.fastForward(21000);
  assert(await page.locator('#startup-status').isVisible(), 'a long download must retain its progress screen');
  assert.equal(await page.getByRole('button').count(), 0, 'startup has no failure or reload buttons');
  slowRelease(); await page.getByText('GAME READY', {exact:true}).waitFor();
  await page.clock.runFor(500); await page.locator('#startup-status').waitFor({state:'detached'});
  const history = await page.evaluate(() => window.progressHistory);
  assert(history.every((value, index) => index === 0 || value >= history[index - 1]));
  assert(history.includes(100), '100% is reported only when the application signals readiness');
  assert.equal(navigations.get('slow'), 1); await page.close();

  failing = true;
  const retry = await browser.newPage();
  await retry.goto(base + '?student=retry&invite=123456#vr');
  await retry.waitForFunction(() => document.getElementById('startup-message').textContent.includes('通信を待って'));
  await retry.evaluate(() => localStorage.setItem('save-proof', 'KEEP'));
  assert.equal(await retry.getByRole('button').count(), 0);
  failing = false;
  await retry.getByText('GAME READY', {exact:true}).waitFor();
  assert.equal(await retry.evaluate(() => localStorage.getItem('save-proof')), 'KEEP');
  assert.equal(navigations.get('retry'), 1);
  assert(requests.get('retry') >= 5, 'temporary failures continue beyond the previous retry limit');
  assert(retry.url().includes('invite=123456') && retry.url().endsWith('#vr'));
  await retry.close();

  const stale = await browser.newPage();
  await stale.goto(base + '?student=stale');
  await stale.getByText('GAME READY', {exact:true}).waitFor();
  assert.equal(navigations.get('stale'), 1, 'a removed chunk switches to the new graph without a document reload');
  await stale.close();

  const cssStale = await browser.newPage(); await cssStale.goto(base + '?student=css-stale');
  await cssStale.getByText('GAME READY', {exact:true}).waitFor();
  assert.equal(navigations.get('css-stale'), 1, 'recover a stylesheet-only deployment even when the JS entry URL is unchanged');
  await cssStale.close();

  const corrupt = await browser.newPage();
  await corrupt.goto(base + '?student=cache-seed');
  await corrupt.getByText('GAME READY', {exact:true}).waitFor();
  await corrupt.evaluate(async () => {
    const cache = await caches.open('learning-rogue-startup-v1');
    await cache.put(new URL('./app.js?student=corrupt', location.href), new Response('<html>Bad cached response</html>', {headers:{'content-type':'text/html'}}));
  });
  await corrupt.goto(base + '?student=corrupt');
  await corrupt.getByText('GAME READY', {exact:true}).waitFor();
  assert.equal(navigations.get('corrupt'), 1, 'replace an invalid cached response without reloading');
  await corrupt.close();

  const storage = await browser.newContext();
  await storage.addInitScript(() => { Object.defineProperty(window, 'caches', {get() { throw Error('Storage unavailable'); }}); });
  const noCache = await storage.newPage();
  await noCache.goto(base + '?student=no-cache');
  await noCache.getByText('GAME READY', {exact:true}).waitFor(); await storage.close();

  const busyStorage = await browser.newContext();
  await busyStorage.addInitScript(() => {
    Object.defineProperty(window, 'caches', {value: {
      match: () => new Promise(() => {}), open: () => new Promise(() => {}), keys: () => new Promise(() => {}),
    }});
  });
  const busy = await busyStorage.newPage(); await busy.goto(base + '?student=busy-storage');
  await busy.getByText('GAME READY', {exact:true}).waitFor(); await busyStorage.close();

  failing = true;
  const contexts = await Promise.all(Array.from({length:30}, () => browser.newContext()));
  try {
    const pages = await Promise.all(contexts.map(context => context.newPage()));
    await Promise.all(pages.map((p, i) => p.goto(base + `?student=class-${i}`)));
    await Promise.all(pages.map(p => p.waitForFunction(() => document.getElementById('startup-message').textContent.includes('通信を待って'))));
    failing = false;
    await Promise.all(pages.map(p => p.getByText('GAME READY', {exact:true}).waitFor({timeout:20000})));
    for (let i=0;i<30;i++) assert.equal(navigations.get(`class-${i}`), 1);
  } finally { await Promise.all(contexts.map(context => context.close())); }
  assert.deepEqual(errors, []);
  console.log('PASS: real byte progress, long waits, automatic recovery, stale build recovery, unavailable storage, saves/invites, and 30 clients without reloads.');
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
