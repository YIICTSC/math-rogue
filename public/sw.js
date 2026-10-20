// Bump the shell/runtime generation when the deployed app contains UI fixes.
// This prevents an older Pages service worker from re-serving the pre-fix bundle.
const SHELL_CACHE = 'learning-rogue-shell-v8';
const RUNTIME_CACHE = 'learning-rogue-runtime-v8';
const PREVIOUS_RUNTIME_CACHE = 'learning-rogue-runtime-v7';
const THEME_CACHE_PREFIX = 'learning-rogue-theme-';
// Must match webAssetCacheService.ts. Previously v4 deleted saved v3 packs.
const THEME_CACHE_VERSION = 'v3';
const inFlightAssets = new Map();
let shellWarmup;
const NAVIGATION_WAIT_MS = 3000;

const cachedResponse = async (request) => {
  let timer;
  try {
    return await Promise.race([
      caches.match(request),
      new Promise(resolve => { timer = setTimeout(() => resolve(undefined), 2000); }),
    ]);
  } catch { return undefined; } finally { clearTimeout(timer); }
};
const storeResponse = async (cacheName, request, response) => {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch { /* Storage quota must never block a successful download. */ }
};

const downloadAsset = async (request) => {
  const retryable = request.destination === 'script' || request.destination === 'style'
    || /\.(?:m?js|css|woff2?)(?:\?|$)/i.test(request.url);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(request, attempt ? {cache: 'reload'} : undefined);
      if (!retryable || attempt >= 2 || ![408, 429, 500, 502, 503, 504].includes(response.status)) return response;
      // Release an unsuccessful body before requesting the resource again.
      await response.body?.cancel();
    } catch (error) {
      if (!retryable || attempt >= 2 || request.signal?.aborted) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 750 * 2 ** attempt + Math.random() * 1000));
  }
};

const isSameOrigin = (url) => url.origin === self.location.origin;
const isNavigationRequest = (request) => request.mode === 'navigate';
const isCacheableAsset = (url) => {
  if (url.pathname.endsWith('/web-asset-manifest.json')) return false;
  const isAudioPath = /\/(?:bgm|bgm-new|sfx)\//i.test(url.pathname);
  if (isAudioPath) return /\.ogg$/i.test(url.pathname);
  return /\.(?:css|js|mjs|png|jpe?g|svg|webp|gif|woff2?|ttf|otf)$/i.test(url.pathname)
    || /\/(?:sprites|card-illustrations|enemy-illustrations|event-illustrations|ui|fonts)\//i.test(url.pathname);
};

const warmShell = async () => {
    try {
      const cache = await caches.open(SHELL_CACHE);
      const scopeUrl = new URL(self.registration.scope);
      const shellUrls = [
        new URL('./', scopeUrl).href,
        new URL('index.html', scopeUrl).href,
        new URL('manifest.webmanifest', scopeUrl).href,
        new URL('pwa-icon-192.png', scopeUrl).href,
        new URL('pwa-icon-512.png', scopeUrl).href,
      ];
      // Save one canonical HTML shell, rather than downloading both root and
      // index.html while the first screen is also loading.
      await Promise.all(shellUrls.slice(1).map((url) => cache.add(url).catch(() => undefined)));
      const html = await cache.match(shellUrls[1]);
      if (html) {
        // These small entry files may have loaded before the first worker
        // claimed the page. Save them too so a later offline start is usable.
        const markup = await html.text();
        const tags = markup.match(/<(?:script|link)\b[^>]*>/gi) || [];
        const bootUrls = tags.filter(tag => /(?:type=["']module["']|rel=["'](?:stylesheet|modulepreload)["'])/i.test(tag))
          .map(tag => tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1])
          .filter(Boolean).map(path => new URL(path, shellUrls[1]))
          .filter(url => isSameOrigin(url));
        await Promise.all(bootUrls.map(url => cache.add(url.href).catch(() => undefined)));
      }
    } catch { /* Install the recovery worker even if offline storage is unavailable. */ }
};

self.addEventListener('install', (event) => {
  // Protect the first game download before warming optional shell files.
  // Waiting for icon downloads here could leave the first import unprotected
  // on a busy network.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames
        .filter((name) => (
          name.startsWith('learning-rogue-shell-')
          || name.startsWith('learning-rogue-runtime-')
          || name.startsWith(THEME_CACHE_PREFIX)
        ))
        .filter((name) => (
          name !== SHELL_CACHE
          && name !== RUNTIME_CACHE
          && name !== PREVIOUS_RUNTIME_CACHE
          && !name.endsWith(`-${THEME_CACHE_VERSION}`)
        ))
        .map((name) => caches.delete(name)));
    } catch { /* Cache cleanup must not prevent activation. */ }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
  if (event.data?.type === 'WARM_SHELL') {
    // A message can keep downloads alive without holding installation or
    // activation open; fetch events can already recover the game's modules.
    shellWarmup ||= warmShell();
    event.waitUntil(shellWarmup);
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.headers?.has('range')) return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith((async () => {
      const scope = new URL(self.registration.scope);
      const saved = (await cachedResponse(request))
        || (await cachedResponse(new URL('index.html', scope).href))
        || (await cachedResponse(new URL('./', scope).href));
      const network = (async () => {
        try {
          const response = await fetch(request, { cache: 'no-store' });
          if (response.ok) {
            event.waitUntil(storeResponse(SHELL_CACHE, request, response.clone()));
            return response;
          }
          return saved || response;
        } catch {
          return saved || new Response('Offline. Please reconnect and reload.', { status: 503 });
        }
      })();
      if (!saved) return network;
      // A congested network should not strand a previously usable classroom
      // device. Refresh in the background while serving its saved HTML.
      event.waitUntil(network.then(() => undefined));
      let timer;
      const timeout = new Promise(resolve => { timer = setTimeout(() => resolve(saved), NAVIGATION_WAIT_MS); });
      try { return await Promise.race([network, timeout]); }
      finally { clearTimeout(timer); }
    })());
    return;
  }

  if (!isCacheableAsset(url)) return;
  event.respondWith((async () => {
    const cached = await cachedResponse(request);
    if (cached) return cached;
    let pending = inFlightAssets.get(request.url);
    if (!pending) {
      pending = downloadAsset(request).then(response => {
        if (response.ok) event.waitUntil(storeResponse(RUNTIME_CACHE, request, response.clone()));
        return response;
      });
      inFlightAssets.set(request.url, pending);
      const clear = () => inFlightAssets.delete(request.url);
      pending.then(clear, clear);
    }
    return (await pending).clone();
  })());
});
