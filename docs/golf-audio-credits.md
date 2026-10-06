# Golf sound and music credits

Springin’ Sound Stock: https://www.springin.org/sound-stock/
Terms checked 2026-10-06: https://www.springin.org/sound-stock/guideline/
Copyright © Shikumi Design. Game use and editing are permitted; the samples are used only as game feedback, not as a sound library. Source titles and category pages are retained without direct links to sound files. Leading silence is removed; clips are mono MP3 with a short fade and a 0.7 peak limiter. The normal effect volume/mute applies.

| Cue | Original title | Catalog | Download SHA-256 |
| --- | --- | --- | --- |
| swing | 打撃1 | [Springin’ battle](https://www.springin.org/sound-stock/category/battle/) | f16ed87a876334d42fd9eb7a7642b47d33da7514958e3e9a168f9f3712bcf766 |
| putt | メトロノームのカチッ | [Springin’ life](https://www.springin.org/sound-stock/category/life/) | e57ca26437db3aab488aba246c24605b8ebf334d9456ec56cbdf38dc2506d534 |
| land | 小さいシングルダイス1 | [Springin’ life](https://www.springin.org/sound-stock/category/life/) | 6aae3a6cc48ad18f2995bcb0cd0c4810510218b0408df3642cd69077d4ac68ed |
| cup | 卒業証書入れポンッ1 | [Springin’ life](https://www.springin.org/sound-stock/category/life/) | 36f60b102859b5c3cb995d608022b6d79079c1097fa7b92c5d5fcd17ed86d832 |
| birdie | グロッケングリッサンド1 | [Springin’ staging](https://www.springin.org/sound-stock/category/staging/) | a8fe92e899020f64abfa55b6e809f4d54aefd743da9f9abd9d2f5ba4e5791b9e |
| water | 水を捨てる | [Springin’ life](https://www.springin.org/sound-stock/category/life/) | ffeccd216a20636bf96da8c49a33e9545efac55b57143511c30b204a1f61431e |
| ob | 短い音-ズッコケ | [Springin’ staging](https://www.springin.org/sound-stock/category/staging/) | b61df8e849f25c9b974d3998a4b90b0fdb9db2ed45bf105e7765c1c5ef2f4b74 |
| start | 決定12 | [Springin’ system](https://www.springin.org/sound-stock/category/system/) | 698dbc9cae2caf7813017f86651d7d5192a304f7e758c99c1326da7b60dcaf67 |

## Existing Learning Rogue BGM

Each hole keeps its track during questions, aiming and scoreboard inspection. Only changing holes, entering the clubhouse or finishing the round changes the selection. The user’s saved theme and music mode are preserved and restored on exit. See `src/mini-games/gakuro-golf/useGolfAudio.ts` for all 18 selections (old/new elementary, high-school and magic tracks). Clubhouse: new elementary paper_plane_setup; result: new elementary victory.

| Hole | Existing track | Set | Theme |
| --- | --- | --- | --- |
| 1 | map | OLD | elementary |
| 2 | rest | NEW | elementary |
| 3 | map | NEW | high-school |
| 4 | event | OLD | elementary |
| 5 | rest | OLD | high-school |
| 6 | map | NEW | magic-female |
| 7 | event | NEW | elementary |
| 8 | rest | NEW | magic-male |
| 9 | map | OLD | high-school |
| 10 | map | NEW | elementary |
| 11 | event | OLD | magic-female |
| 12 | rest | NEW | high-school |
| 13 | map | OLD | magic-male |
| 14 | event | NEW | high-school |
| 15 | rest | OLD | elementary |
| 16 | event | NEW | magic-female |
| 17 | rest | NEW | magic-female |
| 18 | map | OLD | magic-female |
