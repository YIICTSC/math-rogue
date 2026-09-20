import type { CharacterAppearanceMode } from '../types';
import type { VisualThemeId } from './visualThemes';
import { assetUrl } from '../utils/assetPaths';

export type VacationEnvironmentKey =
  | 'shop'
  | 'treasure'
  | 'rest'
  | 'reward'
  | 'event'
  | 'actClear'
  | 'finalBridge'
  | 'challengeSelect'
  | 'challenge'
  | 'start';

type EnvironmentPathTable = Record<VacationEnvironmentKey, string>;
type VacationTheme = 'high-school' | 'magic';

const STANDARD_ENVIRONMENT_PATHS: Record<VacationTheme, EnvironmentPathTable> = {
  'high-school': {
    shop: 'sprites/backgrounds/learning-rogue/shop-store.webp',
    treasure: 'sprites/backgrounds/learning-rogue/treasure-storage.webp',
    rest: 'sprites/backgrounds/learning-rogue/rest-infirmary.webp',
    reward: 'sprites/backgrounds/learning-rogue/reward-rooftop.webp',
    event: 'sprites/backgrounds/learning-rogue/event-hallway.webp',
    actClear: 'sprites/backgrounds/learning-rogue/reward-rooftop.webp',
    finalBridge: 'sprites/backgrounds/learning-rogue/event-hallway.webp',
    challengeSelect: 'sprites/backgrounds/learning-rogue/selection-entrance.webp',
    challenge: 'sprites/backgrounds/learning-rogue/compendium-library.webp',
    start: 'sprites/backgrounds/learning-rogue/selection-entrance.webp',
  },
  magic: {
    shop: 'sprites/backgrounds/learning-rogue/magic-shop-store.webp',
    treasure: 'sprites/backgrounds/learning-rogue/magic-treasure-vault.webp',
    rest: 'sprites/backgrounds/learning-rogue/magic-rest-infirmary.webp',
    reward: 'sprites/backgrounds/learning-rogue/magic-reward-sanctuary.webp',
    event: 'sprites/backgrounds/learning-rogue/magic-event-hallway.webp',
    actClear: 'sprites/backgrounds/learning-rogue/magic-act-clear.webp',
    finalBridge: 'sprites/backgrounds/learning-rogue/magic-final-bridge.webp',
    challengeSelect: 'sprites/backgrounds/learning-rogue/magic-selection-entrance.webp',
    challenge: 'sprites/backgrounds/learning-rogue/magic-compendium-library.webp',
    start: 'sprites/backgrounds/learning-rogue/magic-selection-entrance.webp',
  },
};

const VACATION_ENVIRONMENT_PATHS: Record<VacationTheme, EnvironmentPathTable> = {
  'high-school': {
    shop: 'sprites/backgrounds/learning-rogue/high-school-vacation-shop.webp',
    treasure: 'sprites/backgrounds/learning-rogue/high-school-vacation-treasure.webp',
    rest: 'sprites/backgrounds/learning-rogue/high-school-vacation-rest.webp',
    reward: 'sprites/backgrounds/learning-rogue/high-school-vacation-reward.webp',
    event: 'sprites/backgrounds/learning-rogue/high-school-vacation-event-base.webp',
    actClear: 'sprites/backgrounds/learning-rogue/high-school-vacation-act-clear.webp',
    finalBridge: 'sprites/backgrounds/learning-rogue/high-school-vacation-final-approach.webp',
    challengeSelect: 'sprites/backgrounds/learning-rogue/high-school-vacation-challenge-select.webp',
    challenge: 'sprites/backgrounds/learning-rogue/high-school-vacation-challenge.webp',
    start: 'sprites/backgrounds/learning-rogue/high-school-vacation-start.webp',
  },
  magic: {
    shop: 'sprites/backgrounds/learning-rogue/magic-vacation-shop.webp',
    treasure: 'sprites/backgrounds/learning-rogue/magic-vacation-treasure.webp',
    rest: 'sprites/backgrounds/learning-rogue/magic-vacation-rest.webp',
    reward: 'sprites/backgrounds/learning-rogue/magic-vacation-reward.webp',
    event: 'sprites/backgrounds/learning-rogue/magic-vacation-event-base.webp',
    actClear: 'sprites/backgrounds/learning-rogue/magic-vacation-act-clear.webp',
    finalBridge: 'sprites/backgrounds/learning-rogue/magic-vacation-final-bridge.webp',
    challengeSelect: 'sprites/backgrounds/learning-rogue/magic-vacation-challenge-select.webp',
    challenge: 'sprites/backgrounds/learning-rogue/magic-vacation-challenge.webp',
    start: 'sprites/backgrounds/learning-rogue/magic-vacation-start.webp',
  },
};

export const VACATION_ENVIRONMENT_ASSET_PATHS = Object.values(VACATION_ENVIRONMENT_PATHS)
  .flatMap(table => Object.values(table));

export const isVacationRun = (
  visualTheme: VisualThemeId | undefined,
  appearanceMode: CharacterAppearanceMode | undefined,
): visualTheme is VacationTheme => (
  appearanceMode === 'VACATION' && (visualTheme === 'high-school' || visualTheme === 'magic')
);

const getEnvironmentTheme = (visualTheme: VisualThemeId): VacationTheme | null => (
  visualTheme === 'magic' || visualTheme === 'high-school' ? visualTheme : null
);

export const getEnvironmentBackgroundPath = (
  visualTheme: VisualThemeId,
  key: VacationEnvironmentKey,
  appearanceMode: CharacterAppearanceMode = 'STANDARD',
): string => {
  const theme = getEnvironmentTheme(visualTheme);
  if (!theme) return STANDARD_ENVIRONMENT_PATHS['high-school'][key];
  return isVacationRun(visualTheme, appearanceMode)
    ? VACATION_ENVIRONMENT_PATHS[theme][key]
    : STANDARD_ENVIRONMENT_PATHS[theme][key];
};

export const getEnvironmentBackgroundCss = (
  visualTheme: VisualThemeId,
  key: VacationEnvironmentKey,
  appearanceMode: CharacterAppearanceMode = 'STANDARD',
): string => {
  const theme = getEnvironmentTheme(visualTheme);
  const standardPath = theme
    ? STANDARD_ENVIRONMENT_PATHS[theme][key]
    : STANDARD_ENVIRONMENT_PATHS['high-school'][key];
  const path = getEnvironmentBackgroundPath(visualTheme, key, appearanceMode);
  if (path === standardPath) return `url("${assetUrl(standardPath)}")`;
  return `url("${assetUrl(path)}"), url("${assetUrl(standardPath)}")`;
};
