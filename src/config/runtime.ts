export const OFFLINE_DISTRIBUTABLE = import.meta.env.VITE_OFFLINE_DISTRIBUTABLE === 'true';
export const OFFLINE_NETWORK_FEATURE_MESSAGE = 'このオフライン版では通信対戦・協力・レースは利用できません。';

export type DistributionPlatform = 'web' | 'steam' | 'ios' | 'android';

const configuredPlatform = String(import.meta.env.VITE_APP_PLATFORM || 'web').trim().toLowerCase();

export const DISTRIBUTION_PLATFORM: DistributionPlatform = (
  configuredPlatform === 'steam' || configuredPlatform === 'ios' || configuredPlatform === 'android'
    ? configuredPlatform
    : 'web'
);

// Store builds are sold as paid downloads. The web build intentionally omits this flag and
// remains the time-limited free edition.
export const PAID_EDITION = import.meta.env.VITE_PAID_EDITION === 'true';
export const DAILY_PLAY_LIMIT_ENABLED = !PAID_EDITION;

// Debug routes are never available in a production bundle, including the public web build.
// Local development must opt in explicitly with `npm run dev:debug`.
export const DEBUG_FEATURES_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_FEATURES === 'true';
