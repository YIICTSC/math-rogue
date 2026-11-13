import type { audioService, BgmPlaybackOptions } from '../../services/audioService';
import type { Entry } from './catalog';
import { visualFor } from './visuals';

type Track = Exclude<Parameters<typeof audioService.playBGM>[0], 'random'>;
export type RushMusic = { type: Track; options: BgmPlaybackOptions };
export const TITLE_TRACK = 'kocho_setup';

const CHAPTER_TRACKS: readonly Track[] = [
  'map', 'math', 'shop', 'paper_plane_vacation', 'dungeon_library',
  'dungeon_science', 'dungeon_gym', 'dungeon_music', 'dungeon_roof', 'event',
];
const BOSS_TRACKS: readonly Track[] = [
  'mid_boss', 'school_psyche', 'poker_play', 'paper_plane_battle', 'dungeon_boss',
  'dungeon_boss', 'kocho_battle', 'dungeon_music', 'kocho_boss', 'final_boss',
];

const song = (type: Track, theme: BgmPlaybackOptions['theme'] = 'high-school', mode: 'NEW' | 'OLD' = 'NEW'): RushMusic => ({ type, options: { theme, mode } });
const CROSSOVER_TRACKS: Readonly<Partial<Record<string, RushMusic>>> = {
  bat: song('dungeon_gym'), rally: song('dungeon_gym'), soccer: song('paper_plane_battle'), volley: song('dungeon_gym'),
  golf: song('paper_plane_vacation'), kart: song('battle'), parry: song('dungeon_boss'),
  grapple: song('star_tide_sky', 'star-tide'), fishing: song('rest', 'magic-male', 'OLD'), mining: song('dungeon_science'),
};
const RUSH_PLAYLIST = [song('paper_plane_battle'), song('survivor_metal', 'high-school', 'OLD'),
  song('kocho_battle'), song('battle', 'star-tide'), song('paper_plane_battle', 'high-school', 'OLD')];

/** Rush changes songs once per eight-round block, so a seven-second game never
 * restarts the soundtrack. Story and practice borrow the source game's mood. */
export function musicFor(entry: Entry, rushBlock?: number): RushMusic {
  if (entry.game.boss) return song(BOSS_TRACKS[entry.chapter]);
  if (rushBlock !== undefined) return RUSH_PLAYLIST[Math.max(0, Math.floor(rushBlock)) % RUSH_PLAYLIST.length];
  return CROSSOVER_TRACKS[entry.game.action?.family ?? ''] ?? song(trackFor(entry));
}

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
