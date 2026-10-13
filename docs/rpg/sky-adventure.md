# 空島ランドセルアドベンチャー

RPGのゲーム家具に追加したThree.jsの三人称3Dアクション。game-studioの構成指針に沿い、サーバーで動くシミュレーションと、Reactに組み込んだThree.js描画・DOM操作画面を分離した。既存の家具ゲームと同じ通信、参加人数上限、ホスト開始、一時停止、退出処理を使用する。

## ゲームから遊ぶ

1. RPGの自宅で「家具を作る」→「ゲーム家具」→「空島アドベンチャー筐体」を作成する。必要素材は板材5・鉱石3・水晶4。
2. 持ち物から筐体を配置し、近くで「ここで遊ぶ」を選ぶ。3D建築の部屋の家具画面からも作成・配置できる。
3. ホストが「ゲーム開始」を押す。1〜4人がそれぞれの星・コイン・冒険点を持って遊ぶ。同じステージにいる参加者が画面に表示される。

## ルール

- 10種類の床配置を3段階の高さ・幅・移動速度で変化させた30ステージ。全体のプレイ時間は30分で、学習中は家具ゲームのタイマーを延長する。
- 各島でコイン8枚、スイッチ、頂上の3つの星を集めると、頂上の門から次へ進める。
- ジグザグ・左右への折り返しなどの配置、移動床、上下リフト、氷の床、ベルト床、周期的に消える床、風の上昇気流、ジャンプ台、脇道、巡回おばけを配置。ジャンプ・2段ジャンプ・ダッシュ・踏みつけ・アタック・急降下が使用可能。
- 旗がチェックポイント。落下でハートと30点を失って旗から再開。ハートを使い切ると、その島の星・コインを集め直す。
- 島のクリアごとに3択の強化を選ぶ。ブーツは移動速度、羽はジャンプ高度、磁石はコイン取得範囲、おまもりは被弾後の無敵時間、袋はコインの得点を強化する。
- 全員の30ステージクリア、または時間切れで結果画面。冒険点が最も高い参加者が優勝。
- 3ステージごとに、RPGで選択した単元・課題範囲から3問出題する。他の家具ミニゲーム10種類では合計3ゲーム終了ごとに3問。3問への回答が終わるまで次の冒険・対戦には進めない。学習状態と回数は `life.furnitureLearning` に保持し、途中退出でも未回答分を保持する。選択範囲に問題がない場合はエラーを表示し、無断で別の単元には切り替えない。家具ゲームの状態は既存の `life.games` に格納する。

## 操作

WASD／方向キー：移動、Space：ジャンプ、Shift：ダッシュ、J／X：アタック、C：急降下。画面ドラッグ／Q・Eでカメラを回転。Escapeで退出。タッチ画面ではスティックと4つのアクションボタンを使用する。

## 実装

- `src/mini-games/gakuro-craft/sky-adventure/simulation.ts`：直列化できるゲーム状態、入力検証、足場衝突、星・敵・強化・勝敗。
- `level.ts`：足場、移動床、収集物、生物、3つの配色。
- `Scene.tsx`：描画専用の追従カメラ、ランドセル主人公の歩行・アタック表現、光源・影。Three.jsはこの画面を開いたときに遅延ロードする。
- `Panel.tsx`／`sky.css`：タイトル、HUD、タッチ入力、カメラ、WebGL失敗時の再試行。
- `copy.ts`：日本語・英語・ひらがなの表示文言。
- `public/sprites/rpg/furniture/skyadventure.webp`／`public/sprites/rpg/game-room/titles/skyadventure.webp`：ImageGenで生成した筐体・専用タイトル画像。WebPでゲームに組み込む。
- `furnitureLearning.ts`／`FurnitureLearningPanel.tsx`：全家具ゲーム共通の3問学習、回答順序・重複検証、課題回答履歴への記録。開発用fixtureでは実際の学習履歴を記録しない。
- 既存の「paper_plane_vacation」BGMと、コイン・ジャンプ・星・ダメージ用効果音を使用する。

各足場は軸に沿った衝突形状を持つ。ゲーム判定は最大1/60秒の小ステップ、入力は20Hz。入力が途絶えると0.35秒後に移動を止める。描画はピクセル比上限1.5、4スレッド以下では影を省略し、終了時にGPU資源とイベントを解放する。

## 確認

開発用の独立画面：`http://127.0.0.1:5173/scripts/fixtures/furniture-room.html?kind=skyadventure`。ユーザーのセーブは書き換えない。

`node scripts/test-sky-adventure.mjs` で、通常の入力コマンドによる30ステージの踏破と10回の3問出題、星の収集、2段ジャンプ、強化選択、不正入力、一時停止、チェックポイント落下復帰、4人の状態分離、ホスト開始、入力切断、退出を確認する。家具ゲームの既存進行テスト、コイン音声テスト、英語UI監査、Webビルド、サーバービルドも成功。

ブラウザで実際のWebGL起動、キーボード移動・ジャンプ・コイン収集と、1366×768／390×844の表示を確認した。実サーバーに4端末を接続した通信遅延の確認と、学校用の実機での速度計測は未実施。

ソース対象の型チェックでは既存の他機能のエラーが残る。追加した空島モジュールにエラーは検出されていない。GitHub mainへの反映はユーザーの指示に従って行う。Renderは手動デプロイのため、この変更のpushではデプロイを開始しない。

## ImageGen制作記録

組み込みのImageGenを使用。原画像はCodexの generated_images に保持し、ゲームで参照するWebPをリポジトリへ保存した。

筐体プロンプト：

> Use case: stylized-concept. Game furniture asset: original Sky Backpack Adventure arcade cabinet for a school fantasy RPG. One full upright arcade cabinet, three-quarter front view, centered, isolated on genuinely transparent background. Polished teal and navy cabinet with gold trim, rounded corners, joystick and colorful buttons, star and red school-backpack motifs. Screen shows a cute dark-haired school adventurer with red backpack jumping between lush floating islands and golden stars. Attractive high quality stylized 3D game-art render, crisp silhouette, readable at small size. No lettering, no trademark characters, no floor or cast shadow outside object, no watermark.

タイトルプロンプト：

> Use case: stylized-concept. Dedicated title background for original Japanese school fantasy 3D platform adventure, landscape 16:9. A charming chibi school adventurer with spiky dark blue hair, turquoise jacket and red randoseru backpack jumps toward a glowing golden star over a spectacular chain of floating islands. Varied islands contain clockwork moving platforms, crystal bridges, waterfalls, spring pads, icy terraces and wind turbines, faraway original school observatory towers. Premium colorful stylized console game key art, soft cinematic light, blue sky and cream clouds, readable joyous adventure silhouettes. Compose hero and action on right two thirds; calmer sky on left and lower quarter for live title text and buttons. Absolutely no text, lettering, UI, logos, famous game characters, watermarks.

筐体の背景処理プロンプト：

> Background extraction edit. Preserve this exact complete arcade cabinet design, proportions, decorations, colorful screen, buttons and surface shading. Remove every part of the gold glow, studio backdrop and black background surrounding the cabinet, leaving genuinely transparent alpha outside the cabinet silhouette. No floor, no outside shadow, no new objects, no text. The whole cabinet should fit centered with a small transparent margin.
