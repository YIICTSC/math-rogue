// Bump the shell/runtime generation when the deployed app contains UI fixes.
// This prevents an older Pages service worker from re-serving the pre-fix bundle.
const SHELL_CACHE = 'learning-rogue-shell-v6';
const RUNTIME_CACHE = 'learning-rogue-runtime-v6';
const THEME_CACHE_PREFIX = 'learning-rogue-theme-';
const THEME_CACHE_VERSION = 'v4';

const isSameOrigin = (url) => url.origin === self.location.origin;
const isNavigationRequest = (request) => request.mode === 'navigate';
const isCacheableAsset = (url) => {
  if (url.pathname.endsWith('/web-asset-manifest.json')) return false;
  const isAudioPath = /\/(?:bgm|bgm-new|sfx)\//i.test(url.pathname);
  if (isAudioPath) return /\.ogg$/i.test(url.pathname);
  return /\.(?:css|js|mjs|png|jpe?g|svg|webp|gif|woff2?|ttf|otf)$/i.test(url.pathname)
    || /\/(?:sprites|card-illustrations|enemy-illustrations|event-illustrations|ui|fonts)\//i.test(url.pathname);
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
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
      await Promise.all(shellUrls.map((url) => cache.add(url).catch(() => undefined)));
    } catch { /* Install the recovery worker even if offline storage is unavailable. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
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
          && !name.endsWith(`-${THEME_CACHE_VERSION}`)
        ))
        .map((name) => caches.delete(name)));
    } catch { /* Cache cleanup must not prevent activation. */ }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
          // Storage quota/cache failures must never hide a successful network page.
          try {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(request, response.clone());
          } catch { /* Online navigation remains available without offline storage. */ }
        }
        return response;
      } catch {
        return (await caches.match(request))
          || (await caches.match(new URL('index.html', new URL(self.registration.scope)).href))
          || (await caches.match(new URL('./', new URL(self.registration.scope)).href));
      }
    })());
    return;
  }

  if (!isCacheableAsset(url)) return;
  event.respondWith((async () => {
    try {
      const cached = await caches.match(request);
      if (cached) return cached;
    } catch { /* A broken or disabled cache must fall back to the network. */ }

    try {
      const response = await fetch(request);
      if (response.ok) {
        try {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, response.clone());
        } catch { /* Return the downloaded asset even when the cache is full. */ }
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
