declare const __APP_ASSET_VERSION__: string | undefined;

const APP_ASSET_VERSION = typeof __APP_ASSET_VERSION__ === 'string' ? __APP_ASSET_VERSION__ : 'dev';

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
  const normalizedPath = path.replace(/^\/+/, '');
  const url = `${getAssetBaseUrl()}${normalizedPath}`;
  if (!shouldVersionAsset(normalizedPath)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(APP_ASSET_VERSION)}`;
};
