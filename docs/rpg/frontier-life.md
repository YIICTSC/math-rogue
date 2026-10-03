# RPG frontier life

- Six biome climate fields have warped, blended borders. Vegetation samples the same mixture; terrain density also blends. Main river and tributary remain crossed by the existing road network.
- Click a tree, rock or river to approach it, then click again nearby or open **採取・クラフト**. E opens nearby sites/houses or gathering. Resources are usable within two Manhattan tiles.
- Gathering has a timed tool swing (perfect hits do double work). Fishing requires waiting for a bite. Resource damage/depletion is shared; nodes regrow after three minutes, with regrowth delayed while someone occupies the tile.
- Planks and bricks use 学ロクラフト's shared recipes. Weapons become battle cards; crafted relics use the existing battle-start relic effects. Equipment can be made once per player per adventure.
- Houses cost six planks and two bricks. Build on grass away from landmarks, roads and water. Craft game furniture inside your own house, then invite everyone. The house directory shows owners and visitors and offers walking directions.
- Indoor games reuse 学ロクラフト's authoritative `homeGames` engine and `HobbyGamesPanel`. Up to four players join each game; separate furniture and houses have separate sessions. Leaving or disconnecting removes a player from their game.
- Materials, houses and games belong to the active room, not a cross-session save. Houses remain usable when their owner leaves while the room remains open.
- Life actions, distances, costs, timing and rewards are handled by the authority (server or peer host). Harvesting never mutates terrain tiles, so incremental peer snapshots can represent depletion correctly.
- `public/sprites/rpg/frontier-atlas.webp` contains 24 ImageGen illustrations in a 6×4 atlas; it is converted losslessly from the generated PNG. Rows: woodland/wetland plants, desert/snow resources, ruins/minerals/plants, cottages/fishing/crafting/relic.

## Walkable homes and illustrated crafting

- Craft a house building kit (six planks and two bricks), then build it on valid grass. Building opens the room; walking onto an existing house's entrance tile also opens it. Exiting through the indoor doorway returns the player to an adjacent outdoor tile.
- Each room is 18×14 tiles. Indoor arrow keys, WASD, touch controls and tap-to-walk use authoritative grid movement. The bottom doorway is the exit; its approach cannot be furnished. “入口へ向かう” walks to this exit rather than teleporting.
- The homeowner crafts furniture inside the house. Furniture enters the room inventory, then can be placed, rotated, packed away and placed elsewhere. Visitors can walk and join games but cannot edit the room. Rugs can sit underneath other furniture. Occupied tiles and the route to the exit must stay clear.
- The catalog has 60 furnishings, including 13 plush toys, three complete rugs, kitchen cabinets, lighting, mirrors, instruments, treasure displays and nine playable game furnishings.
- Game furniture becomes playable when placed; players join from within two tiles of its footprint. An active game cannot be packed away or rotated. Exiting removes the participant from the game.
- Old houses receive their default workbench/table layout and retain old game furniture when entered. Room positions, furniture inventory/layout and games synchronize through the same authority snapshots as the outdoor map.
- ImageGen assets: `craft-items.webp` (4×3 square-cell atlas, 12 crafted items) and `home-interiors.webp` (6×4 atlas, 24 furnishings/plush toys). PNG originals are retained in the generation workspace; shipped WebP conversion is lossless with alpha preserved.

## Isolated furniture illustrations and four-player games

- Furniture uses 60 separate ImageGen illustrations under `sprites/rpg/furniture/`. All are 320×320 lossless WebP with at least 24 transparent pixels around the entire artwork. Extraction boundaries follow the empty gutters in the generated sheet, including the complete left/right fringes of rugs. The canvas draws the whole image; cards use `object-fit: contain`, so no equal-grid slicing is used for furniture.
- Original generation sources and per-object extraction rectangles are recorded in `furniture-art.json`. PNG originals remain in the generation workspace.
- Darts 301, 8-ball and brick breaker remain available. Six new games share the same authoritative room engine and are also playable from the craft game: Reversi, Four in a Row, Treasure Memory, Star Dice Race, Tenpin Bowling and Light Reaction.
- Reversi and Four in a Row require two or four players. Seats 1/3 and 2/4 form teams. Reversi validates captures, highlights legal moves, passes automatically and scores discs; Four in a Row applies gravity and detects horizontal, vertical and diagonal wins.
- Memory has 12 shuffled pairs, a timed mismatch reveal, extra turns for matches and final rankings. Dice Race has 40 spaces, forward/backward spaces, extra-turn spaces and a shared authority-generated die.
- Bowling has ten frames, adjustable aim/power/curve, a visible rolling ball and pins, per-player scorecards, strikes/spares and bonus rolls in frame ten. Pin impacts are calculated by the authority using a deterministic lane model. The scoring engine supports the full 300-point perfect game.
- Reaction uses 12 rounds, an unpredictable delay, four buttons, per-player reaction times, time-based scores and false-start/wrong-button penalties. Reaction timing uses receipt time at the authority, so network latency contributes to the score.
- All six games cap sessions at four players, reject other seats and stale turns, support rematches and return to the lobby when someone exits/disconnects. Timed turns keep play moving. Board results remain visible after the game.
- Tests: `node scripts/test-home-party-games.mjs`, `node scripts/test-home-furniture-art.mjs`, `node scripts/test-home-party-browser.mjs`, plus the existing RPG homes/resources tests. The browser test uses four independent pages with a shared authoritative fixture to verify UI commands and synchronized state; it does not substitute for a live Render connection check.

## スマホの探索画面

幅900px以下、または高さ600px以下のタッチ端末では、探索画面を画面全体に表示する。上部はHP・残り時間・人数、下部は採取・全体マップ・仲間・イベント・手帳・詳細の操作に絞る。カードの内容は対応するボタンから開く詳細パネル内で確認する。縦画面は下から広いパネル、横画面は右側のパネルに表示する。PCの通常表示は従来のサイドバーを維持する。

詳細表示中は移動を止め、閉じるボタン・背景タップ・Escapeでマップに戻る。矢印は押し続けると移動を繰り返し、離すと停止する。トレードやダンジョンの参加確認は詳細パネルを閉じていても表示する。画面回転時にキャンバスを追従させ、高さの低い横画面では地図の表示倍率を調整する。

検証: `node scripts/test-rpg-mobile-browser.mjs`（縦390×844/360×640、横844×390/915×412、PC1440×900）。
