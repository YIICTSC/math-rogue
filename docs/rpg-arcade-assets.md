# RPG町のゲームセンター

町の本編休憩画面にある「ゲームセンター」カードから専用モーダルを開く。マップ上の直接プレイボタンは廃止。カードを選ぶと町のシーンを完了し、同じ場所にとどまってゲームを選択する。通常の町の利用間隔は維持する。

- カードめくり：3枚から1枚を選ぶ。当たりはカードと20コイン。
- ルーレット：赤・青・緑から予想する。当たりは20コインと最大HPの20％回復。
- スロット：問題挑戦後に3つのリールを順に止める。星3つで50コイン。停止タイミングは抽選結果を変更しない。
- 全ゲーム共通：参加料10コイン、正解1問以上で景品獲得資格、正解3問以上で10コインの追加報酬。従来の利用回数・当選確率を維持。
- 参加料と抽選結果はホストが確定。結果演出の再表示で報酬は発生しない。モーダル表示中は移動を止め、タイムアップ時はランキングへ移行する。

## ImageGen資材

2026-10-02、組み込みImageGenで新規生成。各画像1回、修正生成なし。生成PNG原本を保持し、実装用に幅1200px・品質88のWebPに変換した。

実装が参照する場所：`public/images/rpg-arcade/{town,slots,roulette,cards}.webp`。

### town

Create a polished 16-bit Japanese fantasy RPG pixel-art illustration for a cheerful woodland town arcade, SNES-era inspired original art. Wide landscape composition: a welcoming tiny wooden arcade interior, three attractions clearly visible: brass three-reel slot machine with star gem bell icons, a red blue green roulette table, and a table with three magical face-down cards. Warm golden lamps, emerald forest visible through windows, festive bunting, sparkling coins, cozy welcoming mood. No people, no lettering, no words, no text, no UI. Crisp pixel clusters and beautiful limited palette with teal shadows and warm amber highlights. Artwork will be used as a hero banner and selection-card illustration for an educational RPG mini-game modal. Keep important objects centered with generous space at edges.

### slots / roulette / cards

共通プロンプトの `{subject}` をそれぞれ次の被写体に置き換えて独立生成：

- slots: a brass three-reel slot machine showing luminous star gem bell symbols
- roulette: a luxurious red blue green roulette wheel and gold pointer on a wooden table
- cards: three magical face-down collectible cards on a velvet teal table, their backs have golden star emblems

Original SNES-inspired polished 16-bit pixel art game illustration, {subject}, centered large close-up, cozy woodland town arcade interior, warm golden lamp light, teal shadows, jewel tones, festive sparkles, charming educational fantasy RPG. Landscape composition, clear readable silhouette, no people, no letters, no numbers, no text, no UI. This is a separate game selection illustration matching a cheerful woodland arcade.
