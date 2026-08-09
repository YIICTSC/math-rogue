import { DISTRIBUTION_PLATFORM, OFFLINE_DISTRIBUTABLE } from '../config/runtime';
import type { VisualThemeId } from '../data/visualThemes';
import { assetUrl } from '../utils/assetPaths';

export type WebAssetManifestFile = {
  path: string;
  size: number;
};

export type WebAssetPackId = 'common' | VisualThemeId;

export type WebAssetPackManifest = {
  id: WebAssetPackId;
  totalBytes: number;
  files: WebAssetManifestFile[];
};

export type WebAssetManifest = {
  schemaVersion: number;
  contentVersion: string;
  packs: Record<WebAssetPackId, WebAssetPackManifest>;
};

export type WebThemeCacheStats = {
  cachedFiles: number;
  totalFiles: number;
  cachedBytes: number;
  totalBytes: number;
};

export type WebStorageEstimate = {
  usage: number;
  quota: number;
};

export type WebThemeDownloadProgress = WebThemeCacheStats & {
  activePath?: string;
};

const CACHE_PREFIX = 'learning-rogue-theme-';
const CACHE_VERSION = 'v3';
const LEGACY_CACHE_VERSIONS = ['v2', 'v1'];
const MANIFEST_PATH = 'web-asset-manifest.json';
const MAX_CONCURRENT_DOWNLOADS = 4;

const isBrowser = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';

export const isWebAssetCacheAvailable = () => (
  DISTRIBUTION_PLATFORM === 'web'
  && !OFFLINE_DISTRIBUTABLE
  && isBrowser()
  && 'caches' in window
);

const getPackCacheName = (packId: WebAssetPackId) => `${CACHE_PREFIX}${packId}-${CACHE_VERSION}`;
const getLegacyCacheNames = (packId: WebAssetPackId) => (
  LEGACY_CACHE_VERSIONS.map(version => `${CACHE_PREFIX}${packId}-${version}`)
);

const formatError = (reason: unknown) => (
  reason instanceof Error ? reason.message : '素材の保存に失敗しました。通信状態と空き容量を確認してください。'
);

let manifestPromise: Promise<WebAssetManifest> | null = null;

export const getWebAssetManifest = async (): Promise<WebAssetManifest> => {
  if (!manifestPromise) {
    manifestPromise = fetch(assetUrl(MANIFEST_PATH), { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('素材一覧を取得できません');
        const manifest = await response.json() as WebAssetManifest;
        if (manifest.schemaVersion !== 2) throw new Error('素材一覧の形式が対応外です。');
        return manifest;
      })
      .catch(reason => {
        manifestPromise = null;
        throw reason;
      });
  }
  return manifestPromise;
};

const getCache = async (packId: WebAssetPackId) => {
  if (!isWebAssetCacheAvailable()) throw new Error('Web版の保存領域を利用できません。');
  await Promise.all(getLegacyCacheNames(packId).map(cacheName => window.caches.delete(cacheName)));
  return window.caches.open(getPackCacheName(packId));
};

const getFileRequest = (file: WebAssetManifestFile) => new Request(assetUrl(file.path), { credentials: 'same-origin' });

export const getAssetPackCacheStats = async (packId: WebAssetPackId): Promise<WebThemeCacheStats> => {
  const manifest = await getWebAssetManifest();
  const pack = manifest.packs[packId];
  if (!pack) throw new Error('素材パックが見つかりません。');
  const cache = await getCache(packId);
  let cachedFiles = 0;
  let cachedBytes = 0;
  for (const file of pack.files) {
    if (await cache.match(getFileRequest(file))) {
      cachedFiles += 1;
      cachedBytes += file.size;
    }
  }
  return {
    cachedFiles,
    totalFiles: pack.files.length,
    cachedBytes,
    totalBytes: pack.totalBytes,
  };
};

export const getWebStorageEstimate = async (): Promise<WebStorageEstimate | null> => {
  if (!isBrowser() || !navigator.storage?.estimate) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
  } catch {
    return null;
  }
};

export const requestPersistentWebStorage = async (): Promise<boolean> => {
  if (!isBrowser() || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export const isPersistentWebStorage = async (): Promise<boolean | null> => {
  if (!isBrowser() || !navigator.storage?.persisted) return null;
  try {
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
};

export const downloadAssetPack = async (
  packId: WebAssetPackId,
  onProgress?: (progress: WebThemeDownloadProgress) => void,
  signal?: AbortSignal,
): Promise<WebThemeCacheStats> => {
  const manifest = await getWebAssetManifest();
  const pack = manifest.packs[packId];
  if (!pack) throw new Error('素材パックが見つかりません。');
  const cache = await getCache(packId);
  const progress: WebThemeDownloadProgress = {
    cachedFiles: 0,
    totalFiles: pack.files.length,
    cachedBytes: 0,
    totalBytes: pack.totalBytes,
  };
  const pendingFiles: WebAssetManifestFile[] = [];

  for (const file of pack.files) {
    if (await cache.match(getFileRequest(file))) {
      progress.cachedFiles += 1;
      progress.cachedBytes += file.size;
    } else {
      pendingFiles.push(file);
    }
  }
  onProgress?.(progress);

  let cursor = 0;
  const downloadNext = async () => {
    while (cursor < pendingFiles.length) {
      if (signal?.aborted) throw new DOMException('Download aborted', 'AbortError');
      const file = pendingFiles[cursor++];
      const request = getFileRequest(file);
      const response = await fetch(request, { cache: 'reload', signal });
      if (!response.ok) throw new Error(`${file.path}: HTTP ${response.status}`);
      await cache.put(request, response.clone());
      progress.cachedFiles += 1;
      progress.cachedBytes += file.size;
      progress.activePath = file.path;
      onProgress?.({ ...progress });
    }
  };

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_DOWNLOADS, Math.max(1, pendingFiles.length)) },
    () => downloadNext(),
  );
  const results = await Promise.allSettled(workers);
  const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failure) throw new Error(formatError(failure.reason));
  const completed = await getAssetPackCacheStats(packId);
  onProgress?.(completed);
  return completed;
};

export const deleteAssetPack = async (packId: WebAssetPackId) => {
  if (!isWebAssetCacheAvailable()) return;
  await window.caches.delete(getPackCacheName(packId));
  await Promise.all(getLegacyCacheNames(packId).map(cacheName => window.caches.delete(cacheName)));
};

export const registerWebServiceWorker = async () => {
  if (
    DISTRIBUTION_PLATFORM !== 'web'
    || OFFLINE_DISTRIBUTABLE
    || !isBrowser()
    || !import.meta.env.PROD
    || !('serviceWorker' in navigator)
  ) return;
  try {
    const serviceWorkerUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.href);
    await navigator.serviceWorker.register(serviceWorkerUrl);
  } catch (reason) {
    console.warn('[learning-rogue] Web offline cache is unavailable.', reason);
  }
};
