import { GameMode, GameScreen } from './types';

/** 雑学内のゲーム系カテゴリと、そこから開くゲームの対応表。 */
export const CATEGORY_MINI_GAME_SCREEN: Partial<Record<GameMode, GameScreen>> = {
  [GameMode.HOBBY_BOARD_GAMES]: GameScreen.MINI_GAME_STONE_GLOW,
  [GameMode.HOBBY_TRPG]: GameScreen.MINI_GAME_SCHOOL_TRPG,
  [GameMode.HOBBY_CARD_GAMES]: GameScreen.MINI_GAME_LEARNING_TCG,
  [GameMode.HOBBY_SHOGI]: GameScreen.MINI_GAME_SHOGI,
  [GameMode.HOBBY_GO]: GameScreen.MINI_GAME_GO,
  [GameMode.HOBBY_CHESS]: GameScreen.MINI_GAME_CHESS,
  [GameMode.HOBBY_MAHJONG]: GameScreen.MINI_GAME_MAHJONG,
};

export const getCategoryMiniGameScreen = (mode: GameMode): GameScreen | null =>
  CATEGORY_MINI_GAME_SCREEN[mode] || null;

export const CATEGORY_MINI_GAME_LABELS: Partial<Record<GameMode, string>> = {
  [GameMode.HOBBY_BOARD_GAMES]: '石ころの煌めき',
  [GameMode.HOBBY_TRPG]: '放課後スクールTRPG',
  [GameMode.HOBBY_CARD_GAMES]: '学習ローグTCG',
  [GameMode.HOBBY_SHOGI]: 'ミニ将棋',
  [GameMode.HOBBY_GO]: '九路盤 囲碁',
  [GameMode.HOBBY_CHESS]: 'スクールチェス',
  [GameMode.HOBBY_MAHJONG]: 'まなび麻雀',
};
