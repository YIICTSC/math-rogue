import type {GameKind} from './homeGames';

// Existing Learning Rogue tracks, selected for each game's pace and atmosphere.
export const GAME_BGM = {
  billiards: 'poker_play', darts: 'poker_shop', bowling: 'dungeon_gym',
  reversi: 'dungeon_library', connectfour: 'math', memory: 'dungeon_music',
  race: 'paper_plane_vacation', arcade: 'paper_plane_battle', reaction: 'kocho_battle',
  rhythm: null,
} as const satisfies Record<GameKind, string | null>;
