# バカンス専用エンディング音声

対象は `assets/ending-expansion/voice-plan.json` の197台詞。バカンス真EDは高校9人＋マジック17人の3ページずつで78本、夏専用友情EDは34ルートの本人／相手の2台詞ずつで68本、マジック主人公別後日談は17人の3ページずつで51本。通常版の声を上書きせず、専用の `vacation-*` IDと本人の既存音声参照で生成する。

公式mainと公開モデルを2026-10-23に再確認した。CPU対応v4.1-Small-MFの4-stepを基本とし、読みの難しい箇所は手書きの読みで23本を補正し、さらに7本を同v4.1-SmallのRF（16-step、independent CFG）で再調整した。最新Large／量子化版も確認し、8GiBの作業環境とCPUカーネル対応を踏まえてv4.1系を選んだ。確認結果は `assets/ending-expansion/voice-runtime-check.json`。推論モデル・codecともCPU、対応CPUではBF16、音量処理とSilentCipherはFP32。ウォーターマークを保持する。

生成は中断・再開可能。出力SHA・本人参照SHA・元台詞・実際の入力・読み・seed・モデルsnapshot・設定・公式コードrevisionを `voice-build.json` に保存する。WAV原音と参照latentは無視対象の `tmp/summer-ending-voice-source` に残し、配信は44.1kHzモノラルOGGのみ。固定秒数で台詞を切らず、無音・デコード・末尾・全197本の独立音声認識を検証した。45本は別の認識モデルでも照合した。全文が明瞭な1本のみ、末尾50msのフェードと120msの余韻で波形の段差を整えた。処理と元WAVのSHAは生成履歴に残す。認識の弱い箇所は別モデルでも照合し、漢字変換だけの違いと発音の崩れを分けて扱う。

```sh
# 正本の台詞／参照SHAを再出力
node scripts/export-summer-ending-voices.mjs
/workspace/irodori-kocho/.venv/bin/python scripts/generate-summer-ending-voices-irodori.py --device cpu --threads 2 --cpu-autocast
/workspace/irodori-kocho/.venv/bin/python scripts/audit-summer-ending-speech.py --threads 2
# 全件QAを満たしてから有効化と実測再生時間を反映
/workspace/irodori-kocho/.venv/bin/python scripts/verify-summer-ending-voices.py --enable
node scripts/test-summer-endings.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/test-summer-endings-browser.mjs --smoke --audio
# マニフェスト更新・本番ビルド後
/workspace/irodori-kocho/.venv/bin/python scripts/verify-summer-ending-voices.py --distribution
```

`SUMMER_ENDING_VOICES_READY` は全197本のQA完了後に有効化する。実測時間の `summerEndingVoiceDurations.ts` により長い台詞を再生制限で切らない。真ED・友情ED・後日談の各画面と図鑑から同じ専用IDを再生する。次ページ・閉じる・退出では既存の音声停止処理を使い、ボイス終了を待たずに進められる。保存済みの夏EDにも音声IDがあるため、再解放は不要。
