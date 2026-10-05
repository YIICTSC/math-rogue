# Game furniture sound credits

Source: [Springin’ Sound Stock](https://www.springin.org/sound-stock/). Terms: https://www.springin.org/sound-stock/guideline/
Checked: 2026-10-04. Game use, including commercial use and edits, is permitted. Copyright remains with the original owners. Credits retained here; sounds are used within the game, not offered as a standalone sound library.

Leading silence removed, levels matched, short fades applied. MP3 for native/Safari and Opus for Web.

| Game cue | Original title | Source URL |
| --- | --- | --- |
| start | 決定12 | https://www.springin.org/wp-content/uploads/2022/06/決定12.mp3 |
| win | 8bit勝利2 | https://www.springin.org/wp-content/uploads/2022/06/8bit勝利2.mp3 |
| lose | 8bit失敗1 | https://www.springin.org/wp-content/uploads/2022/06/8bit失敗1.mp3 |
| relic | 正解6 | https://www.springin.org/wp-content/uploads/2022/06/正解6.mp3 |
| dart-hit | ドアノック1 | https://www.springin.org/wp-content/uploads/2022/11/ドアノック1.mp3 |
| dart-bull | 正解4 | https://www.springin.org/wp-content/uploads/2022/06/正解4.mp3 |
| pool-cue | メトロノームのカチッ | https://www.springin.org/wp-content/uploads/2022/11/メトロノームのカチッ.mp3 |
| pool-hit | 小さいシングルダイス1 | https://www.springin.org/wp-content/uploads/2022/10/小さいシングルダイス1.mp3 |
| pool-rail | ドアノック2 | https://www.springin.org/wp-content/uploads/2022/11/ドアノック2.mp3 |
| pool-pocket | 卒業証書入れポンッ1 | https://www.springin.org/wp-content/uploads/2022/11/卒業証書入れポンッ1.mp3 |
| bowl-roll | えんぴつ転がし1 | https://www.springin.org/wp-content/uploads/2022/10/えんぴつ転がし1.mp3 |
| bowl-pin | 大きいダブルダイス1 | https://www.springin.org/wp-content/uploads/2022/10/大きいダブルダイス1.mp3 |
| bowl-strike | 正解8 | https://www.springin.org/wp-content/uploads/2022/06/正解8.mp3 |
| board-place | カードを置く | https://www.springin.org/wp-content/uploads/2022/07/カードを置く.mp3 |
| board-flip | カードを配る | https://www.springin.org/wp-content/uploads/2022/07/カードを配る.mp3 |
| coin-drop | お金を落とす | https://www.springin.org/wp-content/uploads/2022/07/お金を落とす.mp3 |
| card-flip | カードめくり1 | https://www.springin.org/wp-content/uploads/2022/07/カードめくり1.mp3 |
| card-match | 正解3 | https://www.springin.org/wp-content/uploads/2022/06/正解3.mp3 |
| dice | ダイス振ってから投げる1 | https://www.springin.org/wp-content/uploads/2022/10/ダイス振ってから投げる1.mp3 |
| race-move | 選択2 | https://www.springin.org/wp-content/uploads/2022/06/選択2.mp3 |
| brick-hit | 8bitショット1 | https://www.springin.org/wp-content/uploads/2022/06/8bitショット1.mp3 |
| bounce | 8bitジャンプ | https://www.springin.org/wp-content/uploads/2022/06/8bitジャンプ.mp3 |
| signal | メトロノームのチーン | https://www.springin.org/wp-content/uploads/2022/11/メトロノームのチーン.mp3 |
| react-good | 決定7 | https://www.springin.org/wp-content/uploads/2022/06/決定7.mp3 |
| miss | 8bitキャンセル1 | https://www.springin.org/wp-content/uploads/2022/06/8bitキャンセル1.mp3 |

## Rhythm pads (2026-10-05)

The four former selection-tone variants were replaced with original synthesized rhythm samples: note-0 kick, note-1 snare, note-2 hi-hat, note-3 scratch. These four sounds do not use Springin’ recordings. Reproduce the deterministic mono PCM and MP3/Opus exports with `node scripts/generate-rhythm-pad-sounds.mjs`. Short attack/release fades and a 0.55 PCM peak leave room for the song. Each accepted button/key press plays once, including empty hits; key repeat and hold releases do not double the sample. The existing effect volume and mute apply.

## Furniture BGM

Existing Learning Rogue tracks are looped during play: billiards → poker_play, darts → poker_shop, bowling → dungeon_gym, reversi → dungeon_library, connectfour → math, memory → dungeon_music, race → paper_plane_vacation, arcade → paper_plane_battle, reaction → kocho_battle. RPG homes, the debug practice room and Gakuro Craft share this selection. Leaving restores the preceding BGM unless another scene has already taken over.

Rhythm uses only the selected song. Its screen holds a scoped background-music silence during selection, preview, countdown, play, pause and results. This silences both Web Audio and HTML media using `muted`, which is reliable on iOS even when `volume` is ignored. Closing stops the song before releasing the scope. Other ducking or BGM changes cannot make background music audible while this screen is open.

Verification: `node scripts/test-home-game-bgm-browser.mjs` (nine game tracks, loop restoration, background silence), `VITE_APP_PLATFORM=ios node scripts/test-home-game-bgm-browser.mjs` (native media path in Chromium), `node scripts/test-rpg-rhythm-browser.mjs` (preview/play/pause/mute/exit and four actual pad samples), `node scripts/test-home-game-audio.mjs` (assets and authoritative cues).
