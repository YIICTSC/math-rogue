# 校長対決：主人公別ストーリー

赤ジャージの勇者・叛逆の高校生・星宮あかりの各8場面（開始、次章前6回、エンディング）、計24場面・96字幕。放課後禁止令、購買のパン、応援旗、校長の昔の思い出、仲間の居場所を守る決意と祝勝会を描く。

## 解禁順に合うゲストへの変更（2026-11-15）

継界戦記が未解禁の段階で登場するため、アステル・リュラの掛け合いを高校編8人・マジック編16人へ置き換えた。24場面それぞれ別のゲストが登場し、字幕、声、ImageGenの一枚絵で同じ人物を参照する。具体的な配役・台詞・参照画像・音声は `assets/kocho/story/cast-revision.json`。ゲームデータは `scenes.json`、話者の三言語名は `speakers.json`。

| 主人公 | 開始→エンディングのゲスト |
| --- | --- |
| 赤ジャージの勇者 | 化学研究会長、まどか、学食の料理長、放送部ディレクター、文芸部書記、セラ、バスケ部エース、ひより |
| 叛逆の高校生 | れい、みらい、蓮、つばさ、レオン、理玖、大和、園芸部部長 |
| 星宮あかり | 謎めく転入生、しずく、颯真、こはる、エリオット、生物部の先輩、朔夜、湊 |

元の主人公48本・ナレーション8本は音源ハッシュまで保持。ゲスト24本を新規生成し、計80本を使用する。戦闘ボイスや技は変更しない。旧8本のゲスト音源と旧24枚の実行用画像・メタデータは `assets/kocho/story/retired-v1/` に保管し、ゲームの素材一覧には載せない。旧生成元PNGも保持している。

一枚絵24枚は旧場面の主人公と新ゲストの正規立ち絵を参照してImageGenで再生成。新生成元PNGは `originals-v2/`、実行用WebPは `public/sprites/kocho/story/*-v2.webp`。`art-build.json` に場面、出演者、参照画像とSHA-256を記録。加工は `node scripts/prepare-kocho-story-art.mjs`。

## あかりの原画への統一（2026-11-17）

あかりの開始・各章間・エンディングの8枚をImageGenで再生成した。マジック編の正規立ち絵 `public/sprites/magic/characters/heroine-01-before.webp` を主参照とし、顔立ち、赤いサイドポニーテール、小さな星の髪飾り、白い縁取りの紺の制服と赤いリボンを合わせた。大きく拳を上げる姿を控え、明るさと素直さが伝わる自然なポーズへ変更。各場面の正規ゲストも参照し、台詞96件と既存音声80本の割り当ては保持した。

生成設定・台本上の場面・3点の参照は `assets/kocho/story/art-generation-v3.json`、元PNGは `originals-v3/`、実行用画像は `public/sprites/kocho/story/akari-*-v3.webp`。`art-build.json` に主人公・ゲストの参照ハッシュと生成元・実行用画像のハッシュを記録し、`art-review.json` に視覚確認を記録した。旧版と他の主人公16枚は保管。準備スクリプトの `--hero akari` で8枚だけ更新できる。

## 音声制作と検査

公式Irodori-TTSのHEAD `382205679ebc32295b7d1bfb329327d04c8f4eed` と、公開モデル `Aratako/Irodori-TTS-v4.1-Small-MF` revision `ccc78f5d480b6e51b69b2d5042a14c4da04fea6e` を2026-11-15に確認。新ゲストは8-step、bf16、2スレッド、モデル・codecともCPU。

高校編・マジック編の既存 `endless-true-1.ogg` を各人物の参照にする。湊のみ承認済みの `magic-voices/MINATO/attack-1.ogg` を使う。継界戦記で声色の違ったストーリー音声は参照しない。各参照のSHA-256を録音ごとに保持する。

生成24本をsmall ASRで検査し、低一致のまどか・しずくをmediumで再検査（0.86／0.94）。全80本の44.1kHzモノラル音声についてデコード、無音、音割れ、参照・出力ハッシュを検査し異常なし。ASRと波形による検査であり、全音源を人が聴いたという記録ではない。`finalize-kocho-story.mjs` は全画像・音源・出演者対応が合格した場合だけ `ready.json` を有効化する。

生成、medium ASR、重いビルドは順に実行する。CPU推論でも一時モデルキャッシュとブラウザを同時に保持するとメモリー上限に達するため、検査時は使い終わった一時キャッシュを解放する。

```sh
python scripts/generate-kocho-story-voices.py --device cpu --threads 2 --cpu-autocast --repair-list assets/kocho/story/guest-keys.json --steps 8
python scripts/audit-kocho-story-speech.py --keys assets/kocho/story/guest-keys.json --threads 1 --batch-size 6
python scripts/verify-kocho-story-audio.py
node scripts/finalize-kocho-story.mjs
node scripts/test-kocho-story.mjs
node scripts/test-kocho-story-browser.mjs
node scripts/test-kocho-story-transitions.mjs
CHROMIUM_PATH=/usr/bin/chromium KOCHO_REWARD_TEST=1 node scripts/test-kocho-browser.mjs
```

## 画面と進行

自動再生、音声ON/OFF、戻る、次へ、スキップを用意。場面変更・画面離脱・スキップで音声を停止する。読み込み失敗でも先へ進める。挑戦内の既読状態を保持し、報酬との往復で再表示せず、エンドレスには割り込ませない。

報酬画面は残りの高さに合わせてカードを縮める。各カード全体を一つのネイティブボタンとし、選択表示をカード内下部へ配置する。狭い画面や長文は内側をスクロールできるため、画面下へ選択操作が切れない。主人公別の2枚／3枚報酬と縦横表示を検査する。

## 検証結果

24場面・96字幕と音源の対応、80音源の波形／ハッシュ／デコード、新ゲスト24本の実OGG再生と停止が通過。既存の自然終了送り、ミュート、スキップ、画面離脱、五つの画面サイズ、英語表示も通過した。実ゲームの全24接続、既読処理、背後入力の抑止、エンドレスの除外を確認。3人の報酬カードを五つの縦横サイズでタッチし、獲得が一度だけ行われること、長文・キーボード操作を確認した。

型チェック、英語UI監査（通常タイトルの実行時監査を含む）、Webビルド、server:buildも通過。Android素材一覧の無関係な22,269項目を保持し、今回の画像・音声・サッカー会場だけを更新した。
