# 家のゲームクラブと冒険モード

ゲーム家具10種すべてが最大4人に対応します。家に設置した家具の「ミニゲーム」から同じ台に参加します。リバーシ・四目並べは2〜4人、他は1〜4人です。先頭の参加者がルールと開始を選びます。

## アレンジルール

- ダーツ: 3投×5ラウンドの総得点対戦。
- ビリヤード: 個人戦。全ての色の球が1点、8番が3点。ファウルは1点減点。全球を沈めると終了。
- ブロック崩し: 同時に別のコートで対戦。2回当てる装甲ブロックを追加。
- リバーシ: 2〜4色の個人戦。他の色を挟んで取る。置けない色は自動パス。
- 四目並べ: 2〜4色の個人戦。自分の色を4つつなげる。
- 神経衰弱: 連続ペアで獲得点が2、3、4、5点へ上昇。不一致でリセット。
- すごろく: 安全な2〜4のサイコロ／大胆な1〜8のサイコロを選択。
- ボウリング: 本格的なストライク・スペア計算を保った5フレーム対戦。最終フレームは追加投球あり。
- ライトリアクション: 16ラウンド、合図後1.4秒。連続成功で最大30点を追加。
- 学ロリズム: 143曲と3難易度の同じ譜面を最大4人で演奏。冒険でも判定窓は変更しません。

一戦対戦では通常ルールへ戻せます。ゲーム中は専用画面を広く使い、Escapeまたは退出ボタンで退出できます。

## 5階層の冒険

各階層で選んだ家具のゲームを1試合遊びます。サーバーが成績をゲーム別の尺度に換算し、レリックの効果を加えた「冒険点」の平均を目標と比較します。共有ライフは3。未達成で1減り、0になると終了。5階層を生き抜くと踏破です。個人順位は全階層の総冒険点で決まります。

階層ごとに「静かな階層」「急ぐ階層」「試練の階層」を抽選。急ぐ階層は手番を12秒短縮、試練の階層は目標を100点増やして手番を6秒短縮します。冒険では長引く試合も最大4分、ボウリングは10分で成績を確定。音ゲーは楽曲の終わりまで演奏します。

階層の間は参加者ごとに異なる3択からレリックを1つ選択。全員が選択してから次の階層を開始できます。

- 時の砂時計: 手番+8秒、冒険点+5%。
- 勝負師の紋章: 冒険点+20%。
- 守りの羽: ライフ減少を一度防ぐ。その際に消費。
- 癒しの灯: 選択時に共有ライフ+1（上限3）。
- 連勝の王冠: その階層の勝者なら冒険点+30%。
- 星読みの羅針盤: 毎階層に120冒険点を追加。

レリックはその冒険中のみ持ち越し、再挑戦時に初期化。選択・成績・ライフ・階層はサーバーで管理し、重複した選択や古い階層からの入力を拒否します。音ゲー以外は参加者が退出した場合に冒険を再編し、1階層から再開。音ゲーは残った参加者で継続します。

## ImageGen素材

戦略・スポーツ・アーケードの専用背景3点と、6種類のレリックをImageGenで制作し、WebPとして `public/sprites/rpg/game-room/` に導入。ゲーム選択カード・各対戦画面・レリック選択で使用します。文字、盤面、入力判定は画像に焼き込まず、操作可能なUIとして表示します。

## 3D sports and game sounds

Billiards and bowling lazily load a Three.js WebGL scene. Billiards offers angled and overhead views, lit numbered balls, rolling animation, rail/pocket meshes, cue and aim preview. Pointer coordinates are projected onto the physical table plane before submitting the existing authoritative shot or hand-placement commands. Bowling adds a wood lane, rotating ball and animated falling pins; authoritative scoring remains unchanged. Either game can switch to 2D. WebGL initialization failure or context loss selects the existing 2D view automatically. Static scenes render at 10 FPS, moving scenes at up to 60 FPS, resolution and shadow textures are capped, hidden tabs skip drawing and leaving disposes GPU resources.

All ten games use 29 short cues adapted from Springin’ Sound Stock. Web uses Opus with MP3 fallback; native uses MP3. Sound events follow actions and state transitions, without repeating on world timer/revision updates. Local arcade impacts and reaction results do not mirror other players' private actions. Rhythm lanes use four quiet pitched click variants while song playback and judgement timing remain unchanged. Sounds respect global SFX volume, mute and application visibility; game exit stops active cues and pending delayed sounds. See [sound credits](rpg/game-furniture-sound-credits.md) for provenance.

Additional validation: `node scripts/test-home-game-audio.mjs` checks authoritative sound events and all 58 encoded assets; `node scripts/test-home-sports-browser.mjs` verifies actual decoded playback, volume/cleanup, 3D projection, placement, pause cancellation and 2D fallback. The four-client party browser test exercises synchronized 3D billiards and bowling alongside the other furniture games.
