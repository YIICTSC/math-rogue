# 帰宅ダッシュ：ループと3Dスカイウェイ

既存の主人公・学習・育成・背景ルートを引き継ぐ追加区間。横走り、360度ループ、奥へ走る3レーンのスカイウェイを同じ固定60Hzの進行で接続する。

- 最初のループは内部距離2200、最初のスカイウェイは8400。その後6200ごとに交互に登場する。表示のDISTANCEは内部距離の1/10。
- ループは実際の走路に沿って主人公の足と向きが一周する。頂点付近でジャンプ入力するとエアトリック。背景やカメラ全体は回転させない。
- スカイウェイは左右キー・A/D・コントローラーの左右・専用タッチ矢印で移動。障害物はジャンプ、頭上のバーはスライド、穴は跳び越える。各波に必ず空きレーンを残す。通常のHP・シールド・育成効果も適用する。
- 収集・回避でMOMENTUMが育ち、最高速度は18内部単位/フレーム。通常区間でスライドを24フレーム以上長押しして離すとスピンダッシュ。クールダウンは360フレーム。空中で前方の敵の近くでもう一度ジャンプするとホーミング攻撃をつなげられる。
- シールド・身代わりボードの確定配置を撤去。最初の12000内部距離では出さず、その後もシード抽選と14000以上の配置間隔を両方満たす場合だけ出す。モンテカルロ試験では16000区間中812個。フィーバーや選択して得る強化カードとは別の設定。
- 主人公の囲み線・リボン状の軌跡・矩形の残像をやめ、発光と光粒へ変更。動きを抑える設定ではオーラの揺れとカメラの傾きを止める。
- 一時停止・学習中・フォーカスを失った間は走行の時間も止まる。WebGLが使えない場合やコンテキストを失った場合も、同じレーン・当たり判定をCanvasで表示して続行する。
- スマホ縦画面の通常走行・ループは俯瞰と拡大の2画面。奥行き区間だけ縦1画面へ切り替え、終了すると2画面へ戻る。縦横・画面比率に合わせて実際のCanvas描画領域を更新し、走路を画面端まで表示する。
- ジャンプ・ダッシュ・スライド・左右移動・一時停止は、ImageGenで作成した6種類のアクションイラストで表示する。ラベルと読み上げ名も保持する。

## 素材と再生成

Blenderの編集用データは `assets/go-home-dash/rush/rush-course.blend`。道路、アーチ、樹木、高層建築、浮島、障害物、頭上バー、コイン、スター、ループ走路の10種類を、8個の共有マテリアル・テクスチャなしのGLBへ書き出す。

```sh
blender -b --factory-startup --python scripts/build-home-dash-rush.py
node scripts/optimize-home-dash-rush.mjs
```

glTF Transformによる重複除去・頂点統合・不要データ削除の後に配信する。Three.jsの描画アダプタは `rushRenderer.ts` に隔離し、当たり判定・報酬・入力・コース進行は `rush.ts` が所有する。

全26主人公の背面ランは、各主人公の元画像をImageGenで参照し、4フレームのストリップ全体を一度に生成する。原画を `assets/go-home-dash/rush/rear-sources/` に保持。正規化は各ストリップ共通の拡大率と接地基準を使い、各128×160、横4枚のWebPにする。参照・原画・出力のSHA256、切り出し範囲、スケールと基準位置を `rear-build.json` に記録する。

アクションアイコンの原画は `assets/go-home-dash/rush/action-icons-source.png`。3列×2行を保って768×512へ縮小した `public/sprites/go-home-dash/rush/action-icons.webp` を利用する。

```sh
node scripts/prepare-home-dash-rear.mjs
node scripts/verify-home-dash-rush.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs --update-prefix sprites/go-home-dash/rush/
node scripts/generate-android-asset-manifest.mjs --update-prefix sprites/go-home-dash/guide/
```

## 検証

- `pnpm run test:home-dash:rush`：360度の軌跡、頂点入力、報酬の重複防止、100シードの安全レーン、ジャンプ・スライド・穴の当たり判定、加速上限、保護アイテムの頻度。
- `node scripts/test-home-dash-rush-browser.mjs`：Blender GLBの実描画、タッチ・キーボード・ゲームパッド、停止、8画面サイズ×3区間の表示、奥行き区間の前後での2画面／1画面切り替え、全主人公の背面アニメ、WebGL喪失時の継続。
- `DASH_RUSH_CAPTURE=1 node scripts/test-home-dash-rush-browser.mjs`：追加2項目のアクション図鑑を実プレイ画面で更新。
- `node scripts/test-home-dash-browser.mjs`：従来の飛行・障害物・強化・学習・再挑戦。既存ギミックを単独検証する配置フィクスチャでは新しいコース切り替えを止め、新規ブラウザ試験で混在時の操作を検証する。

## 奥行き区間のジャンプとスライド

全26主人公について `rush/actions/<id>.webp` に4列×2行の専用アトラスを追加。上段は離陸・上昇・頂点・着地、下段は姿勢を低くする・滑走2コマ・立ち上がり。ImageGen原画は `assets/go-home-dash/rush/action-sources/` に保存する。`node scripts/prepare-home-dash-actions.mjs` で512×320へ正規化し、全8コマを同じ倍率・足元基準で配置する。走行との切り替えは跳躍の高さ・上下速度・スライド残時間で決め、WebGLとCanvasの両方へ適用する。
