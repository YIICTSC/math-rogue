import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const server = await createServer({ logLevel: 'error', cacheDir: 'node_modules/.vite-gp-preload',
  optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'three', 'peerjs', 'lucide-react'] },
  server: { watch: null, host: '127.0.0.1', port: 0, hmr: false },
  plugins: [{ name: 'gp-preload-qa', enforce: 'pre', transform(code, id) {
    // SwiftShader shares two CPU cores with the browser. Control capture cadence,
    // keeping the real high-resolution renderer, models, shadows and antialiasing.
    if (id.endsWith('/gakuro-kart/KartCanvas.tsx')) return code.replace('1000/kartRenderProfile(quality).fps-1', '750');
  }, configureServer(s) {
    s.middlewares.use('/gp-preload', async (req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end(await s.transformIndexHtml('/gp-preload', '<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/scripts/fixtures/kart-preload.tsx"></script>'));
    });
  } }],
});
let browser;
const releases = [];
try {
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}/gp-preload`;
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  await mkdir('tmp/gp-preload-qa', { recursive: true });
  const errors = [];
  const visual = url => /\/(?:models\/(?:protagonists|storybook)\/[^/]+\.glb|sprites\/(?:mini-game-titles\/kart-[^/]+\.webp|online-titles\/gp-logo\.webp))(?:\?|$)/.test(url);
  const boot = async (context, query = '') => {
    const page = await context.newPage(); page.setDefaultTimeout(120_000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('crash', () => console.error('GP browser page crashed.'));
    page.gpRequests = [];
    page.on('request', r => { if (visual(r.url())) page.gpRequests.push(r.url()); });
    await page.goto(base + query, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.getByRole('button', { name: 'Play GP', exact: true }).waitFor();
    return page;
  };
  const enter = async page => { await page.getByRole('button', { name: 'Play GP', exact: true }).click(); await page.locator('[data-game-title="kart"]').waitFor(); };
  const closeTitle = async page => { await page.locator('.game-launch-back').click(); await page.getByRole('button', { name: 'Play GP', exact: true }).waitFor(); };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('gakuro-gp-quality-v1', 'auto');
    localStorage.setItem('gakuro-kart-avatar-v1', JSON.stringify({ protagonist: 'elementary-warrior', species: 0, body: 0, outfit: 0, hair: 0, accessory: 0, hairStyle: 0, kart: 0, expression: 0 }));
    Object.defineProperty(navigator, 'connection', { configurable: true, value: Object.assign(new EventTarget(), { downlink: .5, rtt: 600, saveData: true, effectiveType: '2g' }) });
  });
  const page = await boot(context), requests = page.gpRequests;
  assert.equal(requests.length, 0, 'Opening the app must not download GP visuals');
  let release;
  const held = new Promise(resolve => { release = resolve; });
  releases.push(release);
  await page.route('**/models/storybook/storybook-v1.glb?*', async route => { await held; await route.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Play GP', exact: true }).click();
  await page.locator('[data-gp-preparation]').waitFor();
  await page.waitForFunction(() => document.querySelector('.gp-prepare progress')?.value > 0);
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const bounds = await page.locator('.gp-prepare header button,.gp-prepare progress').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().toJSON()));
    for (const box of bounds) assert(box.x >= 0 && box.y >= 0 && box.right <= width + 1 && box.bottom <= height + 1);
    await page.screenshot({ path: `tmp/gp-preload-qa/preparation-${width}.png` });
  }
  release();
  await page.locator('[data-game-title="kart"]').waitFor();
  console.log('GP visuals downloaded; actual title is ready.');
  const files = await page.evaluate(() => window.files);
  assert.equal(requests.length, files.length, 'StrictMode must not duplicate completed visual downloads');
  assert.deepEqual(new Set(requests.map(url => new URL(url).pathname.slice(1))), new Set(files.map(f => f.path)));
  assert(await page.locator('.game-launch-logo img').evaluate(img => img.src.startsWith('blob:')));
  await page.locator('.game-launch-menu button').first().click();
  console.log('Opening the actual high-quality course preview.');
  // The city is procedural; the garden course also exercises imported scenery GLBs.
  await page.locator('.online-entry-fields>label select').selectOption('1');
  await page.waitForFunction(() => Number(document.querySelector('canvas.gk-canvas')?.dataset.blenderModels) > 0);
  assert.equal(await page.locator('canvas.gk-canvas').getAttribute('data-quality'), 'high', 'Legacy auto and slow connection hints must preserve high quality');
  await page.screenshot({ path: 'tmp/gp-preload-qa/ready-high-quality.png' });
  assert.equal(requests.length, files.length, 'The real renderer must consume prepared data, without a second network download');
  await page.locator('.online-entry-header button').click(); await closeTitle(page);
  await enter(page); assert.equal(requests.length, files.length, 'Re-entry must reuse memory'); await closeTitle(page);

  // A new page has no in-memory Blobs. Its persisted pack must work with every GP request blocked.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('button', { name: 'Play GP', exact: true }).waitFor();
  let blocked = 0;
  await page.route('**/*', route => { if (visual(route.request().url())) { blocked++; return route.abort(); } return route.continue(); });
  await enter(page); assert.equal(blocked, 0, 'Saved GP visuals must survive a page restart'); await closeTitle(page);
  console.log('PASS: on-demand GP-only pack, StrictMode, real GLB/Blob rendering, mobile/landscape preparation, and memory/persistent reuse.');

  // Invalidate a same-size entry: the content digest, rather than size alone, must catch it.
  await page.evaluate(async () => {
    const file = window.files[0], cache = await caches.open(window.cacheName);
    await cache.put(window.cacheKey(file), new Response(new Uint8Array(file.bytes)));
  });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('button', { name: 'Play GP', exact: true }).waitFor();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  const repairs = [];
  await page.route('**/*', route => {
    const url = route.request().url();
    if (visual(url)) { repairs.push(new URL(url).pathname.slice(1)); return route.continue(); }
    return route.continue();
  });
  await enter(page); assert.deepEqual(repairs, [files[0].path]); await closeTitle(page);

  // A visual already saved by the theme downloader must be reused as well.
  await page.evaluate(async () => {
    const file = window.files[1], own = await caches.open(window.cacheName), response = await own.match(window.cacheKey(file));
    const theme = await caches.open('learning-rogue-theme-common-v3');
    await theme.put(window.sourceUrl(file.path), response); await own.delete(window.cacheKey(file));
  });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('button', { name: 'Play GP', exact: true }).waitFor();
  const beforeTheme = repairs.length; await enter(page); assert.equal(repairs.length, beforeTheme); await closeTitle(page);
  console.log('PASS: same-size corrupt-cache repair downloads one file; previously saved theme assets are reused.');
  await context.close();

  const retryContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const retry = await boot(retryContext), counts = new Map(); let fail = true;
  await retry.route('**/*', route => {
    const url = route.request().url();
    if (visual(url)) {
      const path = new URL(url).pathname; counts.set(path, (counts.get(path) || 0) + 1);
      if (fail && path.endsWith('/gp-logo.webp')) return route.fulfill({ status: 503, body: 'Retry' });
    }
    return route.continue();
  });
  await retry.getByRole('button', { name: 'Play GP', exact: true }).click();
  await retry.locator('.gp-prepare-retry').waitFor(); assert.equal(await retry.locator('[data-game-title="kart"]').count(), 0);
  fail = false; await retry.locator('.gp-prepare-retry').click(); await retry.locator('[data-game-title="kart"]').waitFor();
  assert.equal(counts.get('/sprites/online-titles/gp-logo.webp'), 2); await closeTitle(retry);
  await retryContext.close();

  const cancelContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cancelPage = await boot(cancelContext); let started = false, releaseCancel;
  const cancelledHold = new Promise(resolve => { releaseCancel = resolve; });
  releases.push(releaseCancel);
  await cancelPage.route('**/models/storybook/storybook-v1.glb?*', async route => { started = true; await cancelledHold; await route.continue().catch(() => {}); });
  await cancelPage.getByRole('button', { name: 'Play GP', exact: true }).click();
  while (!started) await cancelPage.waitForTimeout(50);
  await cancelPage.locator('.gp-prepare header button').click(); await cancelPage.getByRole('button', { name: 'Play GP', exact: true }).waitFor();
  releaseCancel(); await cancelPage.unrouteAll({ behavior: 'ignoreErrors' });
  await enter(cancelPage); await closeTitle(cancelPage); await cancelContext.close();
  console.log('PASS: failed download retry and cancellation/re-entry recover without opening an incomplete GP session.');

  // Storage failure must not force low quality or prevent play. The same page still reuses bytes.
  const memoryContext = await browser.newContext();
  await memoryContext.addInitScript(() => Object.defineProperty(window, 'caches', { configurable: true, value: { open: () => Promise.reject(new DOMException('Storage unavailable', 'QuotaExceededError')) } }));
  const memory = await boot(memoryContext); let memoryRequests = 0;
  memory.on('request', r => { if (visual(r.url())) memoryRequests++; });
  await enter(memory); await closeTitle(memory); const fetched = memoryRequests;
  await enter(memory); assert.equal(memoryRequests, fetched); await closeTitle(memory); await memoryContext.close();

  const scriptContext = await browser.newContext(), scriptPage = await boot(scriptContext); let denyModule = true;
  await scriptPage.route('**/GakuroKart.tsx*', route => denyModule ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue());
  await scriptPage.getByRole('button', { name: 'Play GP', exact: true }).click();
  await scriptPage.getByRole('button', { name: 'Reload', exact: true }).waitFor();
  denyModule = false; await scriptPage.getByRole('button', { name: 'Reload', exact: true }).click();
  await scriptPage.getByRole('button', { name: 'Play GP', exact: true }).waitFor(); await enter(scriptPage); await scriptContext.close();
  assert.deepEqual(errors, []);
  console.log('PASS: unavailable storage uses session memory; a failed game-code import offers a working reload; no page errors.');
} catch (error) { console.error(error); throw error; }
finally { releases.forEach(release => release()); await browser?.close(); await server.close(); }
