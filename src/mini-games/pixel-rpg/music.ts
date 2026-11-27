// Prefer the original elementary campaign cues. Borrow from the wider library
// for places and story beats with no corresponding cue in that soundtrack.
export const PIXEL_RPG_MUSIC = {
  'pixel-rpg-title': 'bgm/menu.mp3',
  'pixel-rpg-main': 'bgm/event.mp3',
  'pixel-rpg-opening': 'bgm/relic_select.mp3',
  'pixel-rpg-world': 'bgm/map.mp3',
  'pixel-rpg-village': 'bgm/rest.mp3',
  'pixel-rpg-city': 'bgm/shop.mp3',
  'pixel-rpg-castle': 'bgm/dungeon_library.mp3',
  'pixel-rpg-forest': 'bgm/magic-female/map.mp3',
  'pixel-rpg-cave': 'bgm/dungeon_music.mp3',
  'pixel-rpg-academy': 'bgm/magic-female/event.mp3',
  'pixel-rpg-sea': 'bgm-new/star-tide/map.mp3',
  'pixel-rpg-underwater': 'bgm-new/magic-female/map.mp3',
  'pixel-rpg-airship': 'bgm/paper_plane_vacation.mp3',
  'pixel-rpg-sky': 'bgm-new/star-tide/star_tide_sky.mp3',
  'pixel-rpg-battle': 'bgm/battle.mp3',
  'pixel-rpg-strong': 'bgm/mid_boss.mp3',
  'pixel-rpg-boss': 'bgm/boss.mp3',
  'pixel-rpg-final': 'bgm/final_boss.mp3',
  'pixel-rpg-victory': 'bgm/victory.mp3',
  'pixel-rpg-job': 'bgm/math.mp3',
  'pixel-rpg-treasure': 'bgm/relic_select.mp3',
  'pixel-rpg-defeat': 'bgm/game_over.mp3',
  'pixel-rpg-sorrow': 'bgm/magic-male/rest.mp3',
  'pixel-rpg-reunion': 'bgm/reward.mp3',
  'pixel-rpg-ending': 'bgm-new/star-tide/reward.mp3',
  'pixel-rpg-post': 'bgm/dungeon_roof.mp3',
} as const;

export type PixelRpgTrack = keyof typeof PIXEL_RPG_MUSIC;

// Android's basic offline download includes the shared audio pack.
export const PIXEL_RPG_MUSIC_FALLBACKS: Partial<Record<PixelRpgTrack, string>> = {
  'pixel-rpg-forest': 'bgm/dungeon_roof.mp3',
  'pixel-rpg-academy': 'bgm/event.mp3',
  'pixel-rpg-underwater': 'bgm/dungeon_music.mp3',
  'pixel-rpg-sorrow': 'bgm/game_over.mp3',
};
