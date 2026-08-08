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

// Store and public builds keep debug routes disabled. Local QA can opt in
// explicitly without changing the production source state.
export const DEBUG_FEATURES_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_FEATURES === 'true';

// GitHub Pages can opt into a network-friendly loading path without changing
// the native store builds or the offline desktop distribution.
export const WEB_PERFORMANCE_MODE = import.meta.env.VITE_WEB_PERFORMANCE_MODE === 'true';

// The Pages deployment can disable explicit asset warmups for loading
// comparisons. The default keeps existing local and native builds unchanged.
export const WEB_PRELOAD_ENABLED = import.meta.env.VITE_WEB_PRELOAD_ENABLED !== 'false';
