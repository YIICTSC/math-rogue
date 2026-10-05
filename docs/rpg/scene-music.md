# RPG scene music

Outdoor exploration always uses `bgm/map.mp3` (elementary OLD), independently of the saved chapter or BGM mode. A short interaction must not restart, seek or change this music.

After feedback that scene switching was too frequent, the following keep their surrounding screen's music: settings, hero editing, crafting, social/community menus, farm and city management, fishing and gathering actions, catch results, NPC/story dialogue, journal/encyclopedias, team/world-event/goal details, and furniture game selection. Outside these remain on the map track; indoors they remain on the house track; RPG title settings remain on the RPG title track. The selected future scene candidates remain in `RPG_MUSIC`, but `resolveRpgMusicScene` deliberately groups these interactions together.

Music changes on substantial scene transitions:

| Scene | Active selection |
| --- | --- |
| Outdoor map | OLD elementary map |
| RPG title | NEW magic menu |
| Adventure setup / joining room | NEW paper plane setup |
| Entering a house | OLD elementary rest |
| Debug furniture practice room | NEW music dungeon |
| Original arcade | NEW poker shop, maintained through its result screen |
| Adventure clear | NEW magic female reward |
| Time-expired results | OLD high school game over |

Nine active furniture games keep their own `GAME_BGM` tracks pinned to NEW elementary assets inside RPG. Lobby browsing does not change the house music; starting an actual game does. Shared craft-game behavior stays unchanged. Rhythm selection, preview and play continue to silence background music so only the selected song/percussion is audible.

Reused battle, shop, rest, event, learning and dungeon screens retain their existing chapter-dependent music. Scene scopes never modify the user's saved BGM mode/theme.

`node scripts/test-rpg-scene-music.mjs` checks asset existence, actual playback URLs, uninterrupted HTML audio identity across all passive interactions in map/house/title contexts, nested scopes, exclusive rhythm silence and chapter battle restoration. Chromium HTML playback checks are not a physical iOS-device listening test.
