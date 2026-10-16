# スマートフォン横画面・Safe Area 改修

## 原因と変更

背景の描画領域と操作UIの安全領域を分離した。

- `src/rpg/landscapeViewport.css`（新規）: 横向き・高さ600px以下・幅1100px以下のRPGを対象に、ルートのSafe Area余白と上下のレイアウト占有を解除。マップを画面全体へ絶対配置し、HUD・下部メニュー・移動・カメラ・建築操作だけにSafe Areaを適用した。短い画面では配置を組み替え、建築操作は縦画面と同じ順序（状態→素材→工房・回転→配置操作）を幅228pxのパネルにまとめ、短い画面ではパネル内をスクロール。下部メニューには縦画面と同じ不透明な背景色を適用。移動操作は左右・スティック・十字キーに対応。ダイアログと詳細パネルは安全領域内でスクロールする。
- `src/mini-games/shared/onlineSafeArea.css`: カートの横画面でも、ルートの左右余白を背景から取り除き、HUD・運転操作へ安全余白を移動。
- `src/rpg/RpgOnline.tsx`: 上記CSSの読み込み。
- `src/rpg/WorldCanvas.tsx`: 横画面の端末判定を描画領域の高さから端末の表示領域へ補正。描画領域の拡張によってスマホのズームが2倍から3倍に変わる問題を防止し、縦横同倍率で地形の表示範囲を広げた。
- `src/styles.css`: 共通Safe Area変数を定義。横向きのアプリ外枠の余白を解除し、背景から独立したUIへ安全余白を適用。学習画面・選択画面・結果画面・モーダル、ダンジョン手札、校長対決の難易度、紙飛行機の格納庫・結果、将棋の開始操作などを調整。短い画面のタイトルメニューは安全領域内のスクロールとし、下端のバージョン操作も44pxのタップ領域を確保。タイトルはPC横画面同様にロゴを左・操作ボタンを右へ分け、iOS告知バナーを左下のプレイ時間表示の直上へ配置。バナーが横並びレイアウトの3列目としてボタンを中央へ押し込む問題を解消。Androidでも同じ安全領域を利用する。
- `src/components/MagicEventSimulationScreen.tsx`: 主人公選択の背景とスクロール領域を分離し、ホームインジケーターの上でスクロールが完結するようにした。

既存の `viewport-fit=cover` は維持。WebGLは既存のResizeObserverと実描画サイズによるcamera.aspect更新を利用し、固定アスペクト比や非等方拡大は追加していない。PC・タブレット・縦画面は新しい横画面CSSの対象外。

## 描画領域の比較

単位はCSS px。修正前は `67633d4` の実コンポーネントをブラウザーで測定した。

| 端末表示領域 | 修正前のRPGマップ | 修正後 |
| --- | --- | --- |
| iPhone 844×390 / 左右44・下21 | 756×268 | 844×390 |
| iPhone 667×375 / 左右44・下21 | 579×253 | 667×375 |
| iPhone 932×430 / 左59・右0・下21 | 873×308 | 932×430 |
| ブラウザーUIあり 812×320 / 左右44・下21 | 724×198 | 812×320 |
| Android 740×360 / 左30・右0・下16 | 710×243 | 740×360 |
| 小型 568×320 / insetなし | 568×219 | 568×320 |
| 縦画面 390×844 | 390×645 | 変更なし |
| タブレット 1024×768 | 1024×626 | 変更なし |
| PC 1440×900 | 1440×778 | 変更なし |

## 検証方法

- `scripts/test-rpg-edge-to-edge-browser.mjs`（新規）: 実RPGの2D/3Dを9サイズで表示。ChromiumのSafe Areaエミュレーションを使用し、回転・リサイズ、Canvas実サイズと縦横比、操作の安全領域・重なり、2D端の地形ピクセル・ズーム、移動入力、設定・採取・農園・詳細パネルを検証。追加で3Dの左右操作・スティック・十字キーを確認する。
- `scripts/audit-landscape-screens-browser.mjs`（新規）: 実Appの既存プレビューに加え、未収録画面をテスト専用の入口から表示。112画面状態（63種のGameScreenと各種モーダル・結果状態）をスクリーンショットで精査。RPG_ONLINEは専用テストで検証し、旧遷移専用のVICTORYと廃止済みGAKURO_CRAFTは表示対象外。画面全体のスクロール・実行エラー・Safe Area外の操作候補を記録する。安全な内部スクロールで一部表示された項目は区別する。
- `scripts/test-online-safe-area-browser.mjs`（拡張）: 実アプリ外枠でオンライン4種のタイトル・準備・VR操作を確認し、カート・ゴルフの実プレイも横画面の全幅描画を検証する。

検証はブラウザー上の端末サイズ・Safe Areaエミュレーションであり、iPhone実機・WKWebView固有の挙動を実機確認したものではない。画面精査は初期表示と記載の操作が対象で、全ゲームの全進行経路を網羅するものではない。

## 検証結果

- RPG 2D: 9サイズで全幅描画・縦横比・Safe Area・ボタン重なりの検証に合格。
- RPG 3D: 同じ9サイズと、667×375 / 568×320での左右×スティック/十字キーの8通りに合格。地形ピクセル、実移動入力、各種パネルの検証も合格。実行時エラー0件。
- 全画面: 112状態を確認。画面全体の不要なスクロールと実行時エラー0件。修正箇所を再検証して統合した最終結果でもSafe Area外の操作候補0件。

- Android 740×360: 代表9画面を確認し、タイトル修正後の再確認を含めて実行時エラー・不要な全体スクロール・Safe Area外の操作候補0件。
- タイトル配置: iPhone 844×390、Android 740×360、小型568×320で、右側のボタン列、左側の告知バナー、時間表示との上下関係を自動検証。Safe Area外の操作候補0件。短い画面では右側のメニュー内をスクロールできる。
- オンライン4種: タイトル・準備、RPG/本編の問題選択3サイズ、カート・ゴルフの実プレイ、VRバトル・爆弾を確認。横画面のカート/ゴルフは描画幅844px、操作は左右44px・下21pxの安全領域内。

- ビルド: `pnpm run build`（型チェック・英語UI監査を含む）と `pnpm run server:build` が成功。

再実行例（リポジトリ直下）:

```sh
RPG_EDGE_VIEW=2D node scripts/test-rpg-edge-to-edge-browser.mjs
RPG_EDGE_VIEW=3D node scripts/test-rpg-edge-to-edge-browser.mjs
node scripts/audit-landscape-screens-browser.mjs
node scripts/test-online-safe-area-browser.mjs
pnpm run build
pnpm run server:build
```

今回のスクリーンショット・計測JSONは作業環境の `/workspace/artifacts/` に保存。`rpg-edge-before` が修正前2D、`rpg-edge-after` が修正後2D、`rpg-edge-3d` が修正後3D。全画面精査は `landscape-audit-final` / `landscape-audit-followup` / `landscape-audit-targeted` / `landscape-audit-start-ios` を順に適用し、`landscape-audit-merged.json` に112状態の最新結果を統合した。タイトル追加確認は `landscape-audit-start-android` / `landscape-audit-start-small`、オンライン実プレイは `online-safe-area-final` に保存。

## RPG操作パネル・下部バーの追補

横画面の下部用途バーは縦画面と同じ `#162c30` の不透明な背景へ変更した。マップ自体は従来どおり画面全体へ描画する。

建築操作パネルは最大520pxの横長2列構成から、最大228px・縦画面と同じ行順へ変更。素材は4列、工房・回転は2列、配置操作は4列を維持する。44px以上のボタン高さを確保し、画面が短いときはSafe Area内に高さを制限してパネル内でスクロールする。パネルとボタンには `touch-action: pan-y` を指定し、タッチでも上下スクロールできるようにした。右利き設定では従来どおり左側へ反転する。

ブラウザーテストに背景色、パネル幅・行順、短い画面で配置操作までスクロールできること、タッチスクロールを許可するCSSの検証を追加した。568×320ではブラウザーへ実際にtouchStart / touchMove / touchEndを送り、パネルがスクロールすることも確認。変更はスマホ横画面のRPG用CSSとその検証・説明に限定している。

追補の検証: 3Dの9サイズと左右×スティック/十字キーの追加8通りが通過。最終状態は844×390・568×320の2D/3Dでも再確認し、バー背景色、縦並び・幅制限、タッチスクロール、移動入力、設定・採取・農園・詳細パネルを確認した。`pnpm run build`（型チェック・英語UI監査を含む）と `pnpm run server:build` も成功。スクリーンショットは `/workspace/artifacts/rpg-portrait-panel-final-3d` と `/workspace/artifacts/rpg-portrait-panel-final-2d` に保存。
