# RPG scene music

RPG outdoor exploration always uses `bgm/map.mp3` (elementary OLD). Scene scopes override playback requests only while an original RPG screen is active; they never change the user's mode or chapter preference. Reused battle, shop, rest, event and learning screens leave the scope and retain chapter music. Dungeon exploration also retains its existing chapter behavior.

Selection is curated from the complete existing OLD/NEW catalog, rather than limited to the selected protagonist chapter. `src/rpg/music.ts` is the authoritative scene table.

| Scene | Selection |
| --- | --- |
| Title | NEW magic menu |
| Adventure setup / room | NEW paper plane setup |
| Settings | OLD high school rest |
| Original hero builder | NEW magic female relic selection |
| House / interiors | OLD elementary rest |
| Crafting / furniture creation | NEW high school shop |
| Social / community | NEW magic female event |
| Farming / animals / pets | OLD paper plane vacation |
| City management | NEW high school map |
| Fishing | OLD magic male rest |
| Catch presentation | NEW magic female reward |
| Gathering / mining | NEW science dungeon |
| Original story / wandering NPC dialogue | OLD magic male event |
| Journal / encyclopedia / character details | OLD library dungeon |
| Team / multiplayer activity invitation | NEW principal setup |
| World event details | NEW high school event |
| Adventure goals | NEW rooftop dungeon |
| Original arcade | NEW poker shop |
| Adventure clear / time expired | NEW magic female reward / OLD high school game over |
| Furniture lobby / debug practice room | NEW music dungeon |

Nine furniture games retain their individual `GAME_BGM` selections, pinned to NEW elementary assets inside RPG. The shared craft game retains its existing user-selected theme behavior. Active furniture music takes precedence over room/lobby music. The rhythm game continues to silence all background music throughout its selection, preview and play screens, playing only its selected song and percussion.

Checks: `node scripts/test-rpg-scene-music.mjs` verifies all 22 selections against actual audio assets and browser playback, map reassertion after an ordinary shop request, nested furniture scopes, rhythm silence release and chapter battle restoration. `scripts/test-home-game-bgm-browser.mjs` covers the existing shared furniture playback behavior. HTML playback is tested in Chromium; this is not a physical iOS-device listening test.
