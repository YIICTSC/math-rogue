# Coin Dozer replaces bowling

Bowling is no longer craftable or joinable. Existing RPG furniture and stored bowling pieces migrate to `coindozer` without consuming materials or losing placement. A bowling game that was in progress is retired; join the replaced cabinet to start a new run. The cabinet retains the old 2×3 footprint. The shared craft game's legacy home items are also normalized on joining/ticking. Legacy bowling code remains only for historical types/assets, not as a selectable activity.

## Actual Blender assets

`scripts/blender/create-coin-dozer.py` builds an original cabinet with a metallic playfield, animated pusher node, side rails, neon lamps, lettering, buttons and reward tray. Blender exports:

- `public/models/rpg/coin-dozer.glb` (cabinet)
- `public/models/rpg/coin-token.glb` (beveled, embossed gold token)
- Blender's transparent render becomes `public/sprites/rpg/furniture/coindozer.webp`.

The generated cabinet source is preserved at `/workspace/generated_models/coin-dozer.blend`; the rendered PNG stays there too. Run Blender in background with the included script to reproduce the models. Cycles denoising is disabled for builds without OpenImageDenoise.

The game loads these GLB assets through Three.js. Separate instanced meshes for each Blender coin primitive render the active coins and falling reward animations. The pusher follows the host's simulation clock. The renderer releases resources on leaving; WebGL failure has a playable board fallback. Controls work with touch and keyboard and remain outside the canvas.

## Run structure

1–4 players each own a separate run, sharing the leaderboard and game clock. Runs have five stages, starting with 40 spendable coins. The host advances disk contacts, insertion gravity, pusher motion, friction, crosswinds and collection. The playfield caps at 150 coins per player, with snapshots rounded to four decimals. A 15-minute limit bounds inactive multiplayer games.

- Stage goals: 8, 12, 17, 22, 32 value, with the vault route adding 4.
- Coin types: ordinary, gold, gem, supply, curse and final-stage crown.
- Each completed nonfinal stage grants three randomly drawn relic options. 24 relics support supply, twins, gem value, refunds, combos, side protection, pusher speed/reach, pulse power, shop discounts, curse protection and recovery.
- Relics generally stack to level 3. Curse cleansing and the recovery bank are single acquisitions.
- Three routes: garden grants extra supply; vault adds gems and raises the goal; storm adds crosswinds and 30% score.
- Six named encounters appear after stages 2 and 4, offering safe supply or a four-coin sacrifice for a random relic and vault rewards.
- Stage 3 offers a shop: choose one relic, restock 10 coins or skip. Purchases use the run's vault, never the RPG player's gold.
- Two pulse charges per stage, increased by relics, let the player target a band of coins.
- Timed combos, gold/gem multipliers and route/relic combinations increase scores. The final-stage crown is an oversized high-value target.
- Empty coin stock gets ten seconds for pending recovery before failure; the recovery bank allows one ten-coin restart.
- Clearing all five stages grants score bonuses. When all players clear/fail, the highest score wins. All players can watch each other's board.

Commands verify membership, presence, phase, stage, resources, coordinates and cooldown on the authority. Pausing freezes simulation and commands. Repeated audio comes only from new input/collection/relic changes, not from rendering the same state. Furniture games continue to use the existing game audio priority.

The server implementation is included in main. Server transport requires the updated Render service to be manually deployed when authorized. Peer-to-peer clients require RPG protocol 25; shared craft rooms use protocol 10.

## コイン表示と筐体の見せ方

- 筐体は正面中央から見下ろし、左右対称の構図で押し出し台と手前の回収口を表示する。
- Blenderコインの本体・縁・刻印の各GLTFプリミティブを個別にインスタンス描画する。グループを持たないジオメトリに材質配列を渡さない。
- 通常コインは銀色、特別コインは金色などで区別する。開始前にもコインを敷き詰めたプレビューを表示する。
- 実際に盤面から落ちたコインは時間差で回転しながら回収口へ落下し、跳ねて積もる。横から失ったコインは回収口に積まない。描画上のコインの山は最大65枚に制限し、得点や手持ち枚数は変更しない。

## 爽快感とタッチ操作の調整

- 盤面タッチは位置指定と同時に1枚投入する。他プレイヤーを観戦中・停止中・選択画面では投入しない。押し続ける投入ボタンは190ms間隔。
- 初期盤面は110枚を出口近くまで密に配置し、コインの半径・押し板のストローク・接触解決回数を増加。落下の着地で周囲のコインに押し出し力が伝わる。
- 初期手持ちは40枚。通常回収の65%で手持ち1枚を補給（還元レリックで最大95%）。6枚投入ごとに金貨3枚のシャワーと手持ち1枚の補給。
- 一度に3枚以上回収すると盤面へ追加5枚が降り、次の連鎖につながる。8コンボ以上でフィーバー表示。
- 階層目標は28／42／56／72／100。初回は最低3回投入後に階層が完了する。押し出しスキルも強化。
