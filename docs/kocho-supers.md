# 校長対決の超必殺技

主人公ごとに12種類、合計36種類。3枚を同じ実行キュー内で指定の順に実行し、3枚目の攻撃が命中すると自動発動する。高校生・あかりの派生カードは、同じ系統の速攻・蓄勢・連携・解放のどれでも成立する。異なる主人公・順番違い・最後の攻撃の空振り・複数回の実行をまたいだ入力では発動しない。派生の選び方を含めた有効な順序は1,422通り。

各主人公の初期3枚だけでも1種類を使用できる。

- 赤ジャージ: 回し蹴り → チョーク投げ → 定規スラッシュ
- 高校生: 不屈のガード → 紅蓮タックル → 叛逆ナックル
- あかり: 星座シールド → スターダッシュ → 星のひかり

タイトル・戦闘画面の「超必殺技」から現在の主人公の12種類を確認できる。予約中は成立候補・次のカードを表示する。ガイドはターンを消費せず、表示中は操作による戦闘進行を止める。キーボード・ゲームパッド・タッチ、英語・ひらがな表示に対応する。

## 戦闘と演出

3枚の動作中に青い残像を残し、最後の命中後に専用イラストと技名のカットインを650ms表示する。音声の終了や読み込みを待たずに戦闘を進める。画像は主人公選択時、ボイスは3枚の予約成立時に先読みする。非表示・退出・ミュートでは既存の校長対決音声制御で停止する。勝敗の声を最優先し、通常の技・敵の声とは重ねない。動きを減らす設定ではスライドや残像の移動を抑制する。

超必殺技は3枚の通常効果の後に追加効果を与える。追加ダメージはシールドを貫通し、系統により最寄りの敵または生存敵全員を対象にする。基本ダメージ8〜12、防御系はシールド+6、回復系はHP+3（最大HPまで）、妨害系は敵の行動を2ターン遅延する。突進系は敵と重ならない隣接マスへ移動する。カード本来のクールダウン・通常効果を維持し、追加の闘志・星光消費はない。通常の3枚目だけで倒し切っても演出は発動し、追加ダメージは次の校長形態へ持ち越さない。

組み合わせ・技名・効果の正本は `assets/kocho/super-moves.json`。TSへの反映は `scripts/sync-kocho-supers.mjs`。

## 専用イラストとCPU音声

ImageGenで3人それぞれの既存立ち絵を参照し、12種類ずつ異なる攻撃構図のイラストを生成した。3列×4行のWebPアトラスを主人公別に配信する。各超必殺技は重複しない専用パネルを使う。生成記録・参照画像・SHA・パネル順は `assets/kocho/super-art-build.json`。生成元のPNGはImageGenの生成結果として保持する。

公式Irodori-TTSの最新mainを2026-10-23に確認した（`89f9d8fbd4d51ea019867ee1197725ede1df13c5`）。公開モデルv4.1-Small-MFを基本に、難しい読みはv4.1-SmallのRFで調整。モデル・codecともCPU、対応CPUでBF16、音量処理とSilentCipherはFP32。ウォーターマークを保持し、44.1kHzモノラルVorbisを配信する。3人の既存音声を参照して36本を個別生成した。

台本・読みは `assets/kocho/super-voice-lines.json`、生成履歴は `assets/kocho/super-voice-build.json`。認識結果は補助資料であり、短い叫び声や創作技名の漢字変換の差は発音の崩れと区別する。低メモリ環境では生成・認識・ビルドを順番に実行する。

```sh
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --supers --device cpu --threads 2 --cpu-autocast
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --supers --device cpu --threads 2 --cpu-autocast --model Aratako/Irodori-TTS-v4.1-Small --steps 16 --cfg-mode independent --text-guidance 4 --caption-guidance 2 --speaker-guidance 3 --seed-offset 530 --repair-list assets/kocho/super-voice-repair-keys.json --regenerate
/workspace/irodori-kocho/.venv/bin/python scripts/audit-kocho-speech.py --supers --threads 2
node scripts/sync-kocho-supers.mjs
/workspace/irodori-kocho/.venv/bin/python scripts/verify-kocho-supers.py
KOCHO_SUPER_TEST=1 CHROMIUM_PATH=/usr/bin/chromium pnpm exec node scripts/test-kocho-browser.mjs
KOCHO_SUPER_AUDIO_TEST=1 CHROMIUM_PATH=/usr/bin/chromium pnpm exec node scripts/test-kocho-browser.mjs
```

配信一覧生成と本番ビルド後、`scripts/verify-kocho-supers.py --distribution` でWeb/Android一覧と本番出力の39ファイル（画像3枚・音声36本）を照合する。
