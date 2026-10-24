# ミニゲームの縦・横タイトルイラスト

2026-10-24。ImageGenで縦9:16・横16:9を別々の構図として制作。
`public/sprites/mini-game-titles/*-{portrait,landscape}-v1.webp` を使用する。
旧イラストは上書きせず保持。文字・ロゴ・ボタンは画像に焼き込まず、既存UIで表示する。

`ResponsiveTitleArt` の `picture/source` で画面の向きに応じた1枚を読み込む。
画像パスは既存の `assetUrl` を通し、相対配信・Androidのダウンロード済みアセットにも対応する。
元のタイトルがあるゲームはそのUIを維持し、盤面へ直接進むゲームなどにはイラスト付きの入口を追加。
クレーンのイベント内起動、デバッグ・UIプレビューでは新しい入口を挟まない。

## 実装とイラストの参照

| ゲーム | 実装で確認した特徴・主人公 | 主な参照元 |
| --- | --- | --- |
| ダンジョンズ2 | リリア、セリス、フローラ、ノクティア、オーレネ、イグニス、レオン、オリオン、リーフ。結晶、迷宮、旅人の街 | `school-dungeon/dungeons2/roster.ts`、`public/sprites/dungeons2/*-before.webp`、`world/town-backdrop.webp` |
| 校長対決 | 赤ジャージの勇者、叛逆の高校生、星宮あかり。カード・移動の戦術バトル | `kocho/guests.ts`、`kocho/original-portrait.webp`、`high-school/characters/0.webp`、`magic/characters/heroine-01-before.webp` |
| トランプ集 | 高校編・マジック編の主人公、世界のトランプ、友人との卓 | `card-club/session.ts`、`catalog.ts` |
| 放課後ポーカー | 高校編・マジック編の主人公、役作りとチップ | `after-school-poker/heroes.ts` |
| 校庭サバイバー | 小学生編・高校編・マジック編。鉛筆、バスケットボール、リコーダーなどの学用品 | `schoolyard-survivor/world.ts` |
| ダンジョンズ | 小学生編・高校編・マジック編。迷宮・旅人の街・星図 | `school-dungeon/student/content.ts`、`student/sprites.ts` |
| 紙飛行機バトル | 高校編・マジック編の艦長。折り紙の艦隊と航空機 | `PaperPlaneBridge.tsx`、艦長選択・艦隊表示 |
| 帰宅ダッシュ | 高校編・マジック編の主人公。夕暮れの帰り道、ジャンプと疾走 | `go-home-dash/Lobby.tsx`、`heroes.ts` |
| ミニ将棋 | 5×5盤、成り・持ち駒。主人公選択なし | `shogi/shogiEngine.ts` |
| 九路盤囲碁 | 九路盤と白黒の石。主人公選択なし | `TriviaMiniGameScreen.tsx` |
| スクールチェス | 8×8のチェス盤。主人公選択なし | `TriviaMiniGameScreen.tsx` |
| 麻雀 | 四人打ち・牌の旅。主人公選択なし | `mahjong/MahjongGame.tsx` |
| 石ころの煌めき | 赤・青・緑・黄の4色、ワイルド、カード購入 | `TriviaMiniGameScreen.tsx`、`stone-glow/stoneGlowRules.ts` |
| スクールTRPG | 学校の謎、d6判定、手帳・校章・星図。固定の主人公立ち絵選択なし | `school-trpg/schoolTrpgData.ts` |
| 学習ローグTCG | 3レーン、ユニットとサポート、小学生・高校・マジックのデッキ | `placement-tcg/PlacementTcgGame.tsx` |
| VR | 主人公アバター、学校を舞台にした訓練 | `gakurogear/character.ts`、`VrTitle.tsx` |
| クレーン | 三本爪、レッサーパンダ・ドラゴン・ひよこ・猫・主人公のぬいぐるみ、カプセル | `crane-game/craneGameEngine.ts`、実際の景品スプライト |

| GPレース | 主人公アバター、小型カート、学校のコース、加速 | `gakuro-kart/GakuroKart.tsx`、`avatar.ts` |
| ゴルフ | 主人公アバター、18ホール、グリーン・バンカー・池 | `gakuro-golf/GakuroGolf.tsx` |

高校・マジックの共通参照には、反逆の高校生、生物部の先輩、あかり、しずく、レン、ミナトの既存立ち絵を使用。
人物を描くゲームは選択可能な主人公の中から代表的な人物を描き、髪型・衣装・色を参照する。
主人公選択のない盤面ゲームには新しい主人公を創作せず、実際の道具・盤面・舞台を描く。

## 検証

`node scripts/test-mini-game-title-art.mjs` で実際の `MiniGameRouter` とGP・ゴルフのタイトルを開き、
19ゲームについてPC・スマホ縦・スマホ横の画像読込、回転時のソース切替、スクリーンショット、
横方向のはみ出し、新しい入口からの遷移を確認する。
証跡は `tmp/mini-game-title-art-qa/`。生成履歴は `assets-source/mini-game-titles/provenance.json`。

2026-10-24の検証結果: 19ゲーム・57ケースが通過。最後の縦レイアウト調整後にも
ポーカー・サバイバーの6ケース、GP・ゴルフ・VRの9ケースを再確認した。
型チェック、英語表示監査、Web本番ビルド、サーバービルド、Androidアセット一覧の検証も実施。
