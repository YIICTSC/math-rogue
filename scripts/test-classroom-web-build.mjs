import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const manifest = JSON.parse(await readFile(path.join(root, '.vite/manifest.json'), 'utf8'));
const app = Object.values(manifest).find(item => item.name === 'App' && item.isDynamicEntry).file;
const counts = new Map(), files = new Map();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ogg': 'audio/ogg' };
let rootRequests = 0;
// Limit bytes at the fixture server so worker fetches are covered as well as
// page requests. Page-only DevTools throttling can miss worker transfers.
let limitTransfers = true;
const queue = [];
const ticker = setInterval(() => {
  let budget = limitTransfers ? 12_500 : Infinity; // 625,000 bytes/s = 5 Mbps.
  while (budget > 0 && queue.length) {
    const item = queue.shift();
    if (item.res.destroyed) continue;
    const length = Math.min(budget, 4096, item.bytes.length - item.offset);
    item.res.write(item.bytes.subarray(item.offset, item.offset + length));
    item.offset += length; budget -= length;
    if (item.offset === item.bytes.length) item.res.end(); else queue.push(item);
  }
}, 20);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://test').pathname);
    if (pathname === '/') rootRequests++;
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    counts.set(relative, (counts.get(relative) || 0) + 1);
    // The worker must retry the failed game chunk without another navigation.
    if (relative === app && counts.get(relative) === 1) { res.writeHead(503); res.end('Busy'); return; }
    const zipped = /\.(?:js|css|html|json)$/.test(target);
    if (!files.has(target)) {
      const bytes = await readFile(target); files.set(target, zipped ? gzipSync(bytes) : bytes);
    }
    res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    res.setHeader('Cache-Control', relative.endsWith('.html') || relative === 'sw.js' ? 'no-cache' : 'public,max-age=31536000,immutable');
    if (zipped) res.setHeader('Content-Encoding', 'gzip');
    queue.push({ res, bytes: files.get(target), offset: 0 });
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.route(/^https:\/\//, route => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('pixel_spire_language_mode_v1', 'ENGLISH');
    localStorage.setItem('pixel_spire_student_profile_v1', JSON.stringify({ grade: '社会人', name: 'Classroom test' }));
    localStorage.setItem('learning_rogue_online_ranking_initial_prompt_declined_v1', '1');
    localStorage.setItem('classroom-save-proof', 'KEEP');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  await page.addLocatorHandler(page.getByRole('button', { name: 'Later', exact: true }), async button => { await button.click(); });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // 150 Mbps shared fairly by 30 clients is 5 Mbps each. This is a single
  // client's approximation, not a real Wi-Fi access-point load test.
  const start = Date.now(); await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  try { await page.getByRole('heading', { name: 'Learning Rogue', exact: true }).waitFor(); }
  catch (error) {
    console.error('Cold start diagnostics:', JSON.stringify({ requests: [...counts], errors, text: await page.locator('body').innerText() }));
    throw error;
  }
  console.log(`PASS: cold title at 5 Mbps with a transient 503: ${Date.now() - start} ms.`);
  assert.equal(counts.get(app), 2, 'the worker retries only the failed app transfer');
  assert.equal(rootRequests, 1, 'no automatic document reload');
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller));
  assert(![...counts.keys()].some(key => /subjectData|GeneralChallengeScreen|MiniGameRouter|DebugMenuScreen/.test(key)), 'title must not fetch unselected screens');
  await mkdir('tmp', { recursive: true }); await page.screenshot({ path: 'tmp/classroom-web-title.png' });

  // Reuse the saved shell and modules when a classroom loses connectivity.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('heading', { name: 'Learning Rogue', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('classroom-save-proof')), 'KEEP');
  assert.equal(rootRequests, 1, 'offline reload serves the saved shell');
  console.log('PASS: cached title starts offline and preserves local saves.');
  await context.setOffline(false);
  limitTransfers = false;
  const later = page.getByRole('button', { name: 'Later', exact: true });
  if (await later.isVisible()) await later.click();
  await page.getByRole('button', { name: 'Question', exact: true }).click();
  await page.getByRole('button', { name: 'Start Challenge!', exact: true }).click({ timeout: 15000 });
  await page.locator('[data-gamepad-initial-scope="math-challenge-0"]').waitFor();
  assert([...counts.keys()].some(key => /MathChallengeScreen/.test(key)));
  assert(![...counts.keys()].some(key => /subjectData/.test(key)), 'arithmetic must not download the general question bank');
  console.log('PASS: arithmetic screen loads on selection without downloading the general question bank.');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Learning Rogue', exact: true }).waitFor();
  if (await later.isVisible()) await later.click();
  await page.getByRole('button', { name: 'Question', exact: true }).click();
  await page.getByRole('button', { name: 'Life', exact: true }).click();
  const startChallenge = page.getByRole('button', { name: 'Start Challenge!', exact: true });
  if (!await startChallenge.isEnabled()) await page.locator('button').filter({ hasText: /0\/100/ }).first().click();
  await startChallenge.click({ timeout: 15000 });
  await page.locator('[data-gamepad-initial-scope="general-challenge-0"]').waitFor();
  assert([...counts.keys()].some(key => /subjectData/.test(key)));
  console.log('PASS: selecting a general subject loads its deferred question screen and bank successfully.');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
} finally { await browser.close(); clearInterval(ticker); await new Promise(resolve => server.close(resolve)); }
