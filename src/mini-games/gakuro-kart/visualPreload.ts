import { GP_VISUAL_BYTES, GP_VISUAL_FILES } from '../../generated/kartVisualAssets';
import { assetSourceUrl } from '../../utils/assetPaths';
import { isVisualPrepared, registerPreparedVisual } from '../../utils/preparedVisualAssets';

export const GP_VISUAL_CACHE = 'learning-rogue-gp-visual-v1';
export type GpVisualProgress = {
  stage: 'checking' | 'downloading' | 'preparing';
  completedFiles: number; totalFiles: number; readyBytes: number; totalBytes: number;
};
type VisualFile = typeof GP_VISUAL_FILES[number];
const aborted = () => new DOMException('GP preparation cancelled', 'AbortError');
const check = (signal: AbortSignal) => { if (signal.aborted) throw aborted(); };

// Safari/private storage can reject or stall. Storage is optional, playing is not.
async function storage<T>(work: () => Promise<T>, unavailable: () => void): Promise<T | undefined> {
  let timer: number | undefined;
  try {
    return await Promise.race([Promise.resolve().then(work), new Promise<undefined>(resolve => { timer = window.setTimeout(() => { unavailable(); resolve(undefined); }, 2000); })]);
  } catch { unavailable(); return undefined; }
  finally { window.clearTimeout(timer); }
}

export function gpVisualCacheKey(file: Pick<VisualFile, 'path' | 'sha256'>) {
  const base = new URL(import.meta.env.BASE_URL || '/', window.location.href);
  return new URL(`__gp_visuals__/${file.sha256}/${file.path}`, base).href;
}

async function valid(bytes: ArrayBuffer, file: VisualFile) {
  if (bytes.byteLength !== file.bytes) return false;
  if (!globalThis.crypto?.subtle) return true;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map(n => n.toString(16).padStart(2, '0')).join('') === file.sha256;
}

async function download(file: VisualFile, parent: AbortSignal, progress: (bytes: number) => void) {
  const controller = new AbortController(), cancel = () => controller.abort();
  parent.addEventListener('abort', cancel, { once: true });
  let timer: number | undefined;
  const heartbeat = () => { window.clearTimeout(timer); timer = window.setTimeout(cancel, 30_000); };
  try {
    check(parent); heartbeat();
    const url = new URL(assetSourceUrl(file.path), window.location.href);
    if (url.protocol === 'https:' || url.protocol === 'http:') url.searchParams.set('gpv', file.sha256);
    const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin' });
    if (!response.ok) { await response.body?.cancel(); throw new Error('GP visual download failed'); }
    if (!response.body) { const bytes = await response.arrayBuffer(); progress(bytes.byteLength); return bytes; }
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        heartbeat(); chunks.push(part.value); length += part.value.byteLength; progress(length);
        if (length > file.bytes) { await reader.cancel(); throw new Error('Unexpected GP visual size'); }
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes.buffer;
  } finally { window.clearTimeout(timer); parent.removeEventListener('abort', cancel); }
}

/** Download before a renderer or online room is created. Keep completed files on retry. */
export async function prepareGpVisuals(onProgress: (progress: GpVisualProgress) => void, signal: AbortSignal) {
  check(signal);
  const operation = new AbortController(), cancel = () => operation.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const active = operation.signal;
  const loaded = new Map<string, number>();
  let next = 0, completedFiles = 0, stage: GpVisualProgress['stage'] = 'checking', lastReport = 0;
  const report = (force = false) => {
    const now = performance.now();
    if (!active.aborted && (force || now - lastReport >= 80)) {
      lastReport = now;
      onProgress({ stage, completedFiles, totalFiles: GP_VISUAL_FILES.length, readyBytes: [...loaded.values()].reduce((a, b) => a + b, 0), totalBytes: GP_VISUAL_BYTES });
    }
  };
  let failure: unknown;
  let storageAvailable = typeof caches !== 'undefined';
  const access = <T>(work: () => Promise<T>) => storageAvailable ? storage(work, () => { storageAvailable = false; }) : Promise.resolve(undefined);
  try {
    report(true);
    if (GP_VISUAL_FILES.every(file => isVisualPrepared(file.path, file.sha256))) {
      for (const file of GP_VISUAL_FILES) loaded.set(file.path, file.bytes);
      completedFiles = GP_VISUAL_FILES.length; stage = 'preparing'; report(true); return;
    }
    const cache = await access(() => caches.open(GP_VISUAL_CACHE));
    const worker = async () => {
      try {
        while (next < GP_VISUAL_FILES.length) {
          check(active);
          const file = GP_VISUAL_FILES[next++], key = gpVisualCacheKey(file);
          if (!isVisualPrepared(file.path, file.sha256)) {
            let response = cache ? await access(() => cache.match(key)) : undefined;
            let ownCacheHit = !!response;
            // Reuse already downloaded theme/native-browser assets when available.
            response ||= cache ? await access(() => caches.match(assetSourceUrl(file.path))) : undefined;
            check(active);
            let bytes = response ? await access(() => response!.arrayBuffer()) : undefined;
            if (bytes && !await valid(bytes, file)) {
              bytes = undefined;
              ownCacheHit = false;
              if (cache) await access(() => cache.delete(key));
            }
            if (!bytes) {
              ownCacheHit = false;
              stage = 'downloading'; report(true);
              bytes = await download(file, active, count => { loaded.set(file.path, Math.min(count, file.bytes)); report(); });
              if (!await valid(bytes, file)) throw new Error('Invalid GP visual content');
            }
            check(active);
            const blob = new Blob([bytes], { type: file.path.endsWith('.glb') ? 'model/gltf-binary' : 'image/webp' });
            // Resolve real renderer requests to these bytes, even without a service worker.
            registerPreparedVisual(file.path, file.sha256, blob);
            if (cache && !ownCacheHit) await access(() => cache.put(key, new Response(blob)));
          }
          check(active); loaded.set(file.path, file.bytes); completedFiles++; report(true);
        }
      } catch (error) { failure ??= error; operation.abort(); throw error; }
    };
    await Promise.allSettled(Array.from({ length: 3 }, worker));
    if (failure) throw failure;
    check(active); stage = 'preparing'; report(true);
    if (cache) {
      const keep = new Set(GP_VISUAL_FILES.map(file => gpVisualCacheKey(file)));
      const keys = await access(() => cache.keys());
      if (keys) await Promise.all(keys.filter(key => !keep.has(key.url)).map(key => access(() => cache.delete(key))));
    }
  } finally { signal.removeEventListener('abort', cancel); }
}
