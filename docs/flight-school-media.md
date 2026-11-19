# にっぽんフライトスクールの画像と音源

タイトルは高校編の9人のフライトスーツ姿を資料に、夕日の滑走路に集合する横画面用と、編隊が上空を横切る縦画面用をImageGenで制作した。

## BGM

学習ローグの既存ライブラリから、タイトルには紙飛行機の準備曲、格納庫には高校編の休息曲を使用。パラシュートには紙飛行機のバカンス曲、グライダーには星潮の航路の天空曲、ロケットベルトと空中戦には紙飛行機の戦闘曲、飛行機には高校編のマップ曲を割り当てた。技能検定の座学と合格時にはそれぞれ問題・勝利の曲が流れる。再生はアプリのBGM設定に従う。

## 効果音

素材提供は株式会社しくみデザイン「Springin’ Sound Stock」。ゲーム内の操作に合わせて長さと音量を調整し、MP3とOpus形式で収録した。[素材サイト](https://www.springin.org/sound-stock/)・[利用規約](https://www.springin.org/sound-stock/guideline/)

| ゲームでの用途 | 素材名 |
| --- | --- |
| 訓練開始 | 決定7 |
| パラシュート開傘 | ページめくり1 |
| 上昇気流 | 風 強風 |
| 飛行機の離陸 | 上空ヘリコプター1 |
| ロケット噴射・バースト | 高速移動 |
| リング通過・演習達成 | キュピーン1 |
| 接地 | ドアノック1 |
| 着水 | さざ波フェードアウト |
| 衝突・被弾・標的撃破 | 打撃2 |
| 訓練機の射撃 | ビーム発射音 |
| 演習失敗 | 短い音 ズッコケ |

## 空港間フライトの地形

関西国際―神戸、羽田―成田、松本―富山、那覇―久米島の各航路は、地理院タイルの全国ランドサットモザイク（巡航）、全国最新写真（空港周辺）、DEM10B（標高）を加工して使用している。データソース：Landsat8画像（GSI,TSIC,GEO Grid/AIST）, Landsat8画像（courtesy of the U.S. Geological Survey）, 海底地形（GEBCO）。[国土地理院のタイル一覧](https://maps.gsi.go.jp/development/ichiran.html#seamlessphoto)・[国土地理院コンテンツ利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)

滑走路の両端座標・幅・標高はOurAirportsの公開データに基づく。地形は約480 m間隔に再標本化し、滑走路付近を平坦化した。巡航の時間倍率と誘導はゲーム用に調整している。画像と標高をゲーム資材に同梱するため、プレイ時に外部の地図サービスへ接続する必要はない。[OurAirportsデータ](https://ourairports.com/data/)

画像と標高はリポジトリのルートから `python scripts/prepare-flight-routes.py` で再生成できる（Pillow、NumPyを使用）。

## 空中戦闘訓練のパイロットと機内無線

格納庫、空港間フライト、空中戦闘訓練の出発準備で高校編の9人から搭乗者を選べる。各パイロットの肖像は `public/sprites/high-school/characters/0.webp` ～ `8.webp` を衣装・髪型・顔の資料にしてImageGenで制作した。演習用フライトスーツ姿の画像は `public/sprites/flight-school/pilots/` に収録している。

無線台本は `src/mini-games/flight-school/radio-script.json` に収録している。各台詞の順序は日本語、英訳、かな表示。1行目は選択した主人公、2行目は同じエントリーの `wing` が担当する。9組それぞれに離陸、景色、索敵、交戦、増援、撃墜、帰投、着陸の8場面がある。

日本語音声はIrodori-TTS v4.1 Small MFのCPU推論。参照元は公式コード `f01c08cd40c0afa62a862439a5de12f6dcf62054`、モデルは `Aratako/Irodori-TTS-v4.1-Small-MF` の `ccc78f5d480b6e51b69b2d5042a14c4da04fea6e`。使用したQ8_0変換は `sakasegawa/Irodori-TTS-v4.1-Small-MF-GGUF` の `9db7da1bec3d1069ef8e29732e0497be60c7b047`（モデルファイルSHA-256 `2d161b0bbcd74f906f6b07e03d031075f8ae916db1b8bd4daf16cb37b451086a`）。speech.cpp v0.11.0のCPUバックエンドで推論・コーデックともCPU、2スレッド、モデル既定のMeanFlow 4ステップで生成した。[Irodori-TTS](https://github.com/Aratako/Irodori-TTS)・[モデル](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small-MF)・[CPUランタイム](https://github.com/nyosegawa/speech.cpp/releases/tag/v0.11.0)

話者参照は高校編の各本人の攻撃、召喚、パワーの各1番の既存音声を48 kHzモノラルに揃えて連結。シードは台本中の主人公順（0始まり）×100、場面順（離陸を1とする）×2、発話順（0または1）を4800に加えた値。FFmpegで260 Hzのハイパスと3350 Hzのローパス、3対1のコンプレッサー、ピーク制限を適用した。配信用は32 kHzモノラルのMP3。音量はゲーム内のボイス設定に従い、送信中はBGMを通常の55%まで下げる。
