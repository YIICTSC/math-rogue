import { ANDROID_ASSET_PACK_VERSIONS } from '../generated/androidAssetPackVersions';

declare const __APP_ASSET_VERSION__: string | undefined;

const APP_ASSET_VERSION = typeof __APP_ASSET_VERSION__ === 'string' ? __APP_ASSET_VERSION__ : 'dev';
export const ANDROID_ASSET_PACK_ROOT = 'asset-packs/v1';
export const ANDROID_ASSET_PACK_STATE_KEY = 'learning_rogue_android_asset_packs_v1';
export type AndroidAssetPackId = keyof typeof ANDROID_ASSET_PACK_VERSIONS;

export type AndroidAssetPackInstallState = {
  rootUrl: string;
  installedVersions: Partial<Record<AndroidAssetPackId, string>>;
};

const isAndroidBuild = String(import.meta.env.VITE_APP_PLATFORM || '').trim().toLowerCase() === 'android';

export const getAndroidAssetPackId = (path: string): AndroidAssetPackId => {
  const normalizedPath = path.normalize('NFC').replace(/^\/+/, '').toLowerCase();
  const isAudio = normalizedPath.startsWith('bgm/')
    || normalizedPath.startsWith('bgm-new/')
    || normalizedPath.startsWith('sfx/');
  const theme = normalizedPath.includes('magic')
    ? 'magic'
    : normalizedPath.includes('high-school')
      ? 'high-school'
      : 'elementary';
  if (isAudio) return (theme === 'elementary' ? 'audio-common' : `audio-${theme}`) as AndroidAssetPackId;
  return `visual-${theme}` as AndroidAssetPackId;
};

export const getAndroidAssetLocalFileName = (path: string): string => {
  const normalizedPath = path.normalize('NFC').replace(/^\/+/, '');
  let first = 2166136261;
  let second = 2246822507;
  for (let index = 0; index < normalizedPath.length; index += 1) {
    const code = normalizedPath.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619) >>> 0;
    second = Math.imul(second ^ code, 3266489909) >>> 0;
  }
  const extensionMatch = normalizedPath.match(/(\.[a-z0-9]+)$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() || '';
  return `${first.toString(36)}${second.toString(36)}${extension}`;
};

export const readAndroidAssetPackInstallState = (): AndroidAssetPackInstallState => {
  if (typeof window === 'undefined') return { rootUrl: '', installedVersions: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ANDROID_ASSET_PACK_STATE_KEY) || '{}') as Partial<AndroidAssetPackInstallState>;
    return {
      rootUrl: typeof parsed.rootUrl === 'string' ? parsed.rootUrl.replace(/\/$/, '') : '',
      installedVersions: parsed.installedVersions && typeof parsed.installedVersions === 'object'
        ? parsed.installedVersions
        : {},
    };
  } catch {
    return { rootUrl: '', installedVersions: {} };
  }
};

export const resolveDownloadedAndroidAssetUrl = (path: string): string | null => {
  if (!isAndroidBuild || typeof window === 'undefined') return null;
  const normalizedPath = path.normalize('NFC').replace(/^\/+/, '');
  if (!normalizedPath.includes('/')) return null;
  const packId = getAndroidAssetPackId(normalizedPath);
  const state = readAndroidAssetPackInstallState();
  if (!state.rootUrl || state.installedVersions[packId] !== ANDROID_ASSET_PACK_VERSIONS[packId]) return null;
  return `${state.rootUrl}/${packId}/${getAndroidAssetLocalFileName(normalizedPath)}`;
};

export const getAssetBaseUrl = (): string => {
  const configuredBase = import.meta.env.VITE_LARGE_ASSET_BASE_URL?.trim();
  const baseUrl = configuredBase || import.meta.env.BASE_URL || '/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
};

const shouldVersionAsset = (path: string): boolean =>
  path.startsWith('sprites/magic/') ||
  path.startsWith('sprites/high-school/events/') ||
  path.startsWith('sprites/backgrounds/learning-rogue/magic') ||
  path.startsWith('event-illustrations/magic-') ||
  path.startsWith('ui/magic/') ||
  path.startsWith('bgm/magic');

export const assetUrl = (path: string): string => {
  if (/^(data:|blob:|https?:)/.test(path)) return path;
  const normalizedPath = path.normalize('NFC').replace(/^\/+/, '');
  const downloadedUrl = resolveDownloadedAndroidAssetUrl(normalizedPath);
  if (downloadedUrl) return downloadedUrl;
  const url = `${getAssetBaseUrl()}${normalizedPath}`;
  if (!shouldVersionAsset(normalizedPath)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(APP_ASSET_VERSION)}`;
};
