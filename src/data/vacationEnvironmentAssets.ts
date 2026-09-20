import type { CharacterAppearanceMode } from '../types';
import type { VisualThemeId } from './visualThemes';
import { assetUrl } from '../utils/assetPaths';

/** Screens which have a dedicated Vacation environment art direction. */
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

const STANDARD_ENVIRONMENT_PATHS: Record<'high-school' | 'magic', EnvironmentPathTable> = {
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

const VACATION_ENVIRONMENT_PATHS: Record<'high-school' | 'magic', EnvironmentPathTable> = {
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
): visualTheme is 'high-school' | 'magic' => (
  appearanceMode === 'VACATION' && (visualTheme === 'high-school' || visualTheme === 'magic')
);

const getEnvironmentTheme = (visualTheme: VisualThemeId): 'high-school' | 'magic' | null => (
  visualTheme === 'magic' || visualTheme === 'high-school' ? visualTheme : null
);

/** Returns the preferred asset path, keeping STANDARD completely unchanged. */
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

/**
 * CSS background values can contain a fallback layer. This keeps a missing
 * optional Vacation file from making a screen blank while preserving the
 * standard asset for normal runs.
 */
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

export const getVacationEnvironmentCopy = (
  visualTheme: VisualThemeId,
  appearanceMode: CharacterAppearanceMode = 'STANDARD',
) => {
  if (!isVacationRun(visualTheme, appearanceMode)) return null;
  if (visualTheme === 'high-school') {
    return {
      shopTitle: '海辺の臨時売店',
      shopDescription: '旅先で必要なもの、だいたい揃ってるよ！',
      treasureClosedTitle: '浜辺に流れ着いた宝箱を発見！',
      treasureOpenedTitle: '海辺の戦利品を獲得！',
      treasureDescription: '海辺に残された、旅の手がかりが眠っている。',
      restHub: '海の見える休憩所だ。どこで体力を整えよう？',
      rest: '海の見える休憩所でひと息ついた。HPが回復した。',
      rewardTitle: '海辺の戦利品',
      rewardDescription: '夏の旅で手に入れたものを選んでください。',
      startTitle: '夏休みの旅支度',
      startDescription: '海辺の旅を支える護符（レリック）を1つ選んでください。',
    } as const;
  }
  return {
    shopTitle: '星砂の魔法露店',
    shopDescription: '海辺用の護符も、星砂の魔法薬も揃ってるよ',
    treasureClosedTitle: '星砂に眠る封印宝珠を発見！',
    treasureOpenedTitle: '星海リゾートの魔力を獲得！',
    treasureDescription: '星砂の奥で、まだ名前のない魔力が脈打っている。',
    restHub: '魔法リゾート休息所だ。どの結界で魔力を整えよう？',
    rest: '星砂の休息結界でひと息ついた。HPが回復した。',
    rewardTitle: '星海リゾートの報酬',
    rewardDescription: '波打ち際の魔法陣に残った力を選んでください。',
    startTitle: '星海バカンスの旅支度',
    startDescription: '星砂の旅を支える護符（レリック）を1つ選んでください。',
  } as const;
};
