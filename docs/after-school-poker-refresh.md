# 放課後ポーカーとタッチ操作の改修

## 主人公と本編の進行

- ポーカーは専用タイトルから新規開始・再開を選択。高校編9人、マジック編17人から主人公を選ぶ。
- 全員に専用サポーターを1つ用意。効果は通常の得点計算に組み込み、通常のサポーター枠を1つ使用する。売却も可能。通常のショップ抽選には混ぜない。
- `protagonistUnlocks.ts` は本編と同じ「編ごとのクリア回数 + 最初の2人」の判定を使用。マジック編の男女は本編と同じ別々の選択順で判定する。
- サバイバー・ダンジョンズ1・RPG・ポーカーの新規選択に適用。ダンジョンズ2固有の主人公と解放条件はそのまま使用する。
- 進行中の旧ポーカーセーブを再開できる。旧セーブにサポーターを追加したり、所持ポイントを初期化したりしない。新規セーブでは専用サポーターの関数をカタログから復元する。
- 購入済みパックの内容も保存し、開封中に終了しても再購入なしで再開できる。

## イラスト・演出

ImageGenで専用タイトル、26人×6表情、専用サポーター26種と装飾4種を制作。本編の高校編・マジック編キャラクター画像を表情生成の参照に使用した。参照元と生成ファイル名は `assets/after-school-poker/illustration-sources.json` に記録している。

```sh
node scripts/prepare-poker-illustrations.mjs /path/to/generated_images
```

生成元PNGは保持し、配信用WebPだけをリポジトリで管理する。表情は無表情・集中・自信・喜び・心配・敗北の6種類。主人公の状況と残り手数に応じて切り替える。

カードの提示、得点カードの跳ね上がり・加点、サポーター発動、基礎点と倍率、目標への得点加算を段階的に表示。商店のパックは封をした状態から開封し、内容を順番に公開する。取得・消費アイテムには光と粒子の演出を用意。横画面では得点パネルを縮め、HUDを覆わない配置にする。動きを減らす設定にも対応。

## 音声

主人公は学習ローグ／ダンジョンズと同じ高校編・マジック編の既存ボイスを使用。役の成立、勝利、敗北で再生する。

敵60人に出現・ダメージ・勝利・敗北の4イベント、合計240本の専用音声を用意。台本は `assets/after-school-poker/rival-voice-lines.json`。公式の最新v4.1系モデル `Aratako/Irodori-TTS-v4.1-Small-MF` と公式コードをクラウド環境で実行する。最初の出現音声をその敵の参照音声として使用し、以降の3本も同じ声で生成する。参照潜在をキャッシュし、モデルも1回だけ読み込む。

```sh
git clone https://github.com/Aratako/Irodori-TTS ../Irodori-TTS
cd ../Irodori-TTS
uv sync --extra cpu
cd ../math-rogue-fix
ONEDNN_PRIMITIVE_CACHE_CAPACITY=64 LRU_CACHE_CAPACITY=16 \
  OMP_NUM_THREADS=2 MKL_NUM_THREADS=2 \
  ../Irodori-TTS/.venv/bin/python scripts/generate-poker-rival-voices-irodori.py
```

AVX512 BF16対応CPUでは `--cpu-autocast` を追加できる。ニューラルネット部分をBF16で実行し、ラウドネス処理とSilentCipher透かしはFP32のまま保持する。CUDA環境では `--device cuda` を使用できる。`--only <敵ID>` で1人分の生成にも対応する。完成済みクリップは上書きせず、途中から再開できる。

音声は44.1kHzモノラルOGGとして配信し、ラウドネスを揃える。モデルのチェックサム・公式コードのリビジョン・音声ごとの台詞・シード・時間・チェックサムを `rival-voice-build.json` に記録。終了時には再生中の音声と予約された勝敗ボイスを停止する。敵の勝敗ボイスの長さに合わせて主人公ボイスを開始する。

## タッチ操作

サバイバーの回避・バースト、GP、VR、ゴルフ、RPGのアクション操作は、移動中の2本目の指を受け付ける。単発アクションはクリックを待たずタッチ開始時に実行し、後から発生する互換クリックによる二重実行を防ぐ。長押しやスティックは指のIDを管理し、別の指の解放で移動を止めない。マウス・キーボード・ゲームパッド操作も維持する。

## 確認

```sh
pnpm run test:touch:browser
pnpm run test:touch:screens
pnpm run test:protagonists:browser
pnpm run test:poker:browser
pnpm run test:survivor:browser
node scripts/test-golf-meter-browser.mjs
pnpm run build
pnpm run server:build
node scripts/verify-poker-rival-voices.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
node scripts/verify-android-asset-manifest.mjs
```

同時タッチはCDPの実タッチイベントで確認する。ポーカーは得点、勝敗、学習報酬、旧セーブ、新規主人公26人の保存復元、パック再開、スマートフォン縦横画面を確認する。スクリーンショットは `tmp/poker-club-qa/` と `tmp/schoolyard-survivor/` に出力する。
