import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';

const source = await fs.readFile('public/sw.js', 'utf8');
const themeService = await fs.readFile('src/services/webAssetCacheService.ts', 'utf8');
assert.equal(source.match(/THEME_CACHE_VERSION = '([^']+)'/)[1], themeService.match(/CACHE_VERSION = '([^']+)'/)[1]);
const origin = 'https://test';
function worker(fetcher, unavailable = false) {
  const handlers = {}, stores = new Map(), delays = [], work = [];
  const key = request => typeof request === 'string' ? request : request.url;
  const cache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    return {
      add: async () => {},
      match: async request => stores.get(name).get(key(request))?.clone(),
      put: async (request, response) => stores.get(name).set(key(request), response.clone()),
    };
  };
  vm.runInNewContext(source, {
    self: { location: { origin }, registration: { scope: `${origin}/math-rogue/` }, addEventListener: (name, handler) => handlers[name] = handler, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    URL, Response, Math,
    setTimeout: (callback, delay) => { delays.push(delay); return setTimeout(callback, Math.min(delay, 5)); }, clearTimeout,
    caches: {
      keys: async () => [...stores.keys()],
      delete: async name => stores.delete(name),
      open: async name => { if (unavailable) throw Error('QuotaExceededError'); return cache(name); },
      match: async request => {
        if (unavailable === 'busy') return new Promise(() => {});
        if (unavailable) throw Error('Cache unavailable');
        for (const store of stores.values()) { const response = store.get(key(request)); if (response) return response.clone(); }
      },
    },
    fetch: fetcher,
  });
  return {
    handlers, stores, delays, cache,
    request: async (path, mode = 'cors') => {
      let pending;
      handlers.fetch({ request: { method: 'GET', url: `${origin}${path}`, mode }, respondWith: p => pending = p, waitUntil: p => work.push(p) });
      return pending;
    },
    flush: async () => { await Promise.all(work); },
  };
}

for (const unavailable of [false, true, 'busy']) {
  const w = worker(async () => new Response('LATEST'), unavailable);
  for (const [path, mode] of [['/math-rogue/', 'navigate'], ['/math-rogue/assets/app.js', 'cors']]) assert.equal(await (await w.request(path, mode)).text(), 'LATEST');
  await w.flush();
}
const retained = worker(async () => new Response('LATEST'));
for (const name of ['learning-rogue-runtime-v7', 'learning-rogue-runtime-v6', 'learning-rogue-theme-magic-v3']) retained.cache(name);
await new Promise((resolve, reject) => retained.handlers.activate({ waitUntil: p => p.then(resolve, reject) }));
assert(retained.stores.has('learning-rogue-runtime-v7'));
assert(retained.stores.has('learning-rogue-theme-magic-v3'));
assert(!retained.stores.has('learning-rogue-runtime-v6'));
assert(!retained.stores.has('learning-rogue-shell-v8'), 'activation must not wait for shell or icon downloads');
let warmup;
retained.handlers.message({ data: { type: 'WARM_SHELL' }, waitUntil: p => warmup = p });
await warmup;
assert(retained.stores.has('learning-rogue-shell-v8'), 'the boot shell requests warming after protection is active');

let calls = 0;
const retry = worker(async () => ++calls < 3 ? new Response('Busy', { status: 503 }) : new Response('READY'));
assert.equal(await (await retry.request('/assets/app.js')).text(), 'READY');
assert.equal(calls, 3);
assert.equal(retry.delays.filter(delay => delay !== 2000).length, 2);
await retry.flush();
const cachedCalls = calls;
assert.equal(await (await retry.request('/assets/app.js')).text(), 'READY');
assert.equal(calls, cachedCalls, 'saved modules require no network');
let missingCalls = 0;
const missing = worker(async () => { missingCalls++; return new Response('Missing', { status: 404 }); });
assert.equal((await missing.request('/assets/missing.js')).status, 404);
assert.equal(missingCalls, 1, 'a removed module is not transient server congestion');
let failedCalls = 0;
const failed = worker(async () => { failedCalls++; throw Error('Network unavailable'); });
await assert.rejects(failed.request('/assets/app.js'));
assert.equal(failedCalls, 3, 'permanent failure must stop retrying');

let release, simultaneousCalls = 0;
const gate = new Promise(resolve => release = resolve);
const shared = worker(async () => { simultaneousCalls++; await gate; return new Response('SHARED'); });
const requests = Array.from({ length: 30 }, () => shared.request('/assets/shared.js'));
await new Promise(resolve => setTimeout(resolve, 0)); release();
assert((await Promise.all(requests)).every(response => response.status === 200));
assert.equal(simultaneousCalls, 1, 'same-device requests share one transfer');
await shared.flush();

let completeNetwork;
const offlineFirst = worker(() => new Promise(resolve => completeNetwork = resolve));
await offlineFirst.cache('learning-rogue-shell-v8').put(`${origin}/math-rogue/index.html`, new Response('SAVED'));
assert.equal(await (await offlineFirst.request('/math-rogue/?invite=123', 'navigate')).text(), 'SAVED');
assert(offlineFirst.delays.includes(3000));
completeNetwork(new Response('UPDATED')); await offlineFirst.flush();
assert.equal(await (await offlineFirst.cache('learning-rogue-shell-v8').match(`${origin}/math-rogue/?invite=123`)).text(), 'UPDATED');
console.log('PASS: cache failures, retained packs, bounded module retries, 30 in-flight requests, and saved-shell fallback.');
