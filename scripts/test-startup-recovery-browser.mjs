import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright';

const html = (await fs.readFile('index.html', 'utf8')).replace('src="/index.tsx"', 'src="/app.js"');
let fail = false;
const navigations = new Map();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://test');
  if (url.pathname === '/app.js') {
    res.setHeader('Content-Type', 'text/javascript'); res.writeHead(fail ? 503 : 200);
    res.end(fail ? 'unavailable' : 'document.getElementById("root").innerHTML="<h1>GAME READY</h1>"');
  } else if (url.pathname === '/') {
    const id = url.searchParams.get('student') || 'default';
    navigations.set(id, (navigations.get(id) || 0) + 1);
    res.setHeader('Content-Type', 'text/html'); res.end(html);
  } else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const slow = await browser.newPage(); await slow.clock.install();
  let release; const gate = new Promise(resolve => release = resolve);
  await slow.route('**/app.js', async route => { await gate; await route.continue(); });
  await slow.goto(base + '?student=slow', { waitUntil: 'commit' });
  await slow.locator('#startup-status').waitFor({ state: 'attached' });
  await slow.clock.fastForward(21000);
  assert(await slow.locator('#startup-status').isVisible());
  assert((await slow.locator('#startup-message').innerText()).includes('Still loading'));
  assert.equal(await slow.locator('#startup-retry').isVisible(), false, 'a slow download is not a failure');
  release(); await slow.getByText('GAME READY', { exact: true }).waitFor();
  assert.equal(navigations.get('slow'), 1); await slow.close();

  fail = true; const page = await browser.newPage();
  await page.goto(base + '?student=retry&invite=123456#vr');
  await page.locator('#startup-retry').waitFor({ state: 'visible' });
  await page.clock.install(); await page.clock.fastForward(21000);
  assert((await page.locator('#startup-message').innerText()).includes('Loading failed'), 'a known failure must not become a slow-loading message');
  await page.evaluate(async () => {
    localStorage.setItem('save-proof', 'KEEP');
    const cache = await caches.open('learning-rogue-runtime-v6');
    await cache.put('/kept.js', new Response('SAVED MODULE'));
  });
  assert.equal(navigations.get('retry'), 1, 'no automatic document reload');
  fail = false; await page.locator('#startup-retry').click();
  await page.getByText('GAME READY', { exact: true }).waitFor();
  assert.equal(navigations.get('retry'), 2);
  assert.equal(await page.evaluate(() => localStorage.getItem('save-proof')), 'KEEP');
  assert.equal(await page.evaluate(async () => (await caches.match('/kept.js'))?.text()), 'SAVED MODULE');
  assert(page.url().includes('invite=123456') && page.url().endsWith('#vr')); await page.close();

  fail = true;
  const contexts = await Promise.all(Array.from({ length: 30 }, () => browser.newContext()));
  try {
    for (let start = 0; start < 30; start += 5) await Promise.all(contexts.slice(start, start + 5).map(async (context, i) => {
      const p = await context.newPage(); await p.goto(base + `?student=class-${start + i}`);
      await p.locator('#startup-retry').waitFor({ state: 'visible' });
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i < 30; i++) assert.equal(navigations.get(`class-${i}`), 1);
  } finally { await Promise.all(contexts.map(context => context.close())); }
  console.log('PASS: slow loading is not failure; manual retry preserves saves, cached downloads and invites; 30 clients do not reload automatically.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
