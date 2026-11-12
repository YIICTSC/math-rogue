import type { audioService } from '../../services/audioService';
import type { Entry } from './catalog';
import { visualFor } from './visuals';

type Track = Exclude<Parameters<typeof audioService.playBGM>[0], 'random'>;
export const TITLE_TRACK = 'kocho_setup';

const CHAPTER_TRACKS: readonly Track[] = [
  'map', 'math', 'shop', 'paper_plane_vacation', 'dungeon_library',
  'dungeon_science', 'dungeon_gym', 'dungeon_music', 'dungeon_roof', 'event',
];
const BOSS_TRACKS: readonly Track[] = [
  'mid_boss', 'school_psyche', 'poker_play', 'paper_plane_battle', 'dungeon_boss',
  'dungeon_boss', 'kocho_battle', 'dungeon_music', 'kocho_boss', 'final_boss',
];

export function trackFor(entry: Entry): Track {
  if (entry.game.boss) return BOSS_TRACKS[entry.chapter];
  const [view, set] = visualFor(entry);
  if (entry.game.genre === 'rhythm' || set === 'rhythm') return 'dungeon_music';
  if (entry.key === 'gate/quiet-zone' || (view === 'first-person' && entry.chapter === 4)) return 'dungeon_library';
  if (entry.key === 'roof/launch-glider' || entry.key === 'roof/thermal-updraft') return 'paper_plane_battle';
  if (entry.chapter === 0 && (set === 'trail' || set === 'arena')) return 'paper_plane_vacation';
  if (entry.chapter === 2 && (set === 'queue' || set === 'orbit')) return 'poker_shop';
  if (entry.chapter === 9 && (set === 'trail' || set === 'arena')) return 'paper_plane_setup';
  return CHAPTER_TRACKS[entry.chapter];
}
