# 継界戦記 ボイス制作・再生成手順

ユーザーの最新指示により確認スケジュールは停止し、同じ作業で生成・検品・組み込み・mainへのアップロードまで行う。

## 原稿と声の統一

- `scripts/lantern-war/catalog.mjs` が本編18章、寄り道、支援会話、エンディング、全主人公の必殺・支援・相手の名前を呼ぶ掛け声を収集する。
- `prepare-voices.py` は既存音声を再利用できない通常攻撃・被ダメージ・回復・勝利・敗北を補う。既存の高校編・マジック編・ダンジョンズ2の通常バトル音声は流用する。
- `voice-plan.json` に41話者（40主人公とナレーター）の参照音声・caption・ハッシュを保持する。アステル／リュラは新しくデザインした参照音声を使用し、他の話者は既存の参照を使用する。
- 新規音声は最新公式IrodoriのCPU推論。使用したコード・モデルrevisionは `voice-build.json` に記録する。モデルとcodecの両方をCPUへ固定し、BF16、通常4steps、SilentCipherあり。参照音声は全台詞で固定する。

人物名の読みは既存のひらがな設定を使う。章の地名は `pronunciations.json` の `locations` に読みを固定する。検品辞書の変更だけでは音声を再生成しないため、実際の発音を変更する際は対応する `voice-corrections.json` の原稿も更新する。

## 生成と検品

1. 生成プロセスが動いていないことを確認してから `node scripts/lantern-war/catalog.mjs` と `python scripts/lantern-war/prepare-voices.py` を実行する。生成中に計画を変更しない。
2. Irodori仮想環境で `python scripts/lantern-war/generate-voices.py` を実行する。生成済みファイルとrecipe/SHAが一致すれば再生成しない。停止後も同じコマンドで再開できる。公式の `synthesize_batch` で互換性のある2件をまとめ、参照音声やstepsが異なる組み合わせは分ける。`--batch-size 1` で単独処理もでき、生成記録には同時生成したIDを残す。
3. 同環境で `python scripts/lantern-war/review-voices.py --follow` を起動すると、完成した音声をCPU Whisper・波形・SHAで順次確認する。通常はsmall/int8/1thread/beam1。`--follow`なしでは現在の完成分のみを検品する。
4. 要確認音声は `--only <IDまたは話者、カンマ区切り可> --recheck --model medium --beam-size 3` で再確認する。固有名詞が一般語へ誤認識される場合は `--name-context` で名前の語彙だけを認識器へ渡せる。期待する台詞そのものは渡さず、使用した文脈は検品記録に残す。
5. 発音不良は `assets/lantern-war/voice-corrections.json` に `spoken_text`（読みや掛け声の演技用原稿を明示）、`seconds`、`steps`、`seed_offset` を記録する。生成が停止してからprepareを再実行し、同じ生成コマンドで修正分だけ作り直す。`--retakes <ID配列JSON>` で対象も指定できる。
6. 再生成されたファイルはSHAが変わるため自動的に再検品される。異なる検品プロセスの保存はファイルロックで保護する。
7. `python scripts/lantern-war/voice_review_rules.py` で、既存のひらがな設定に基づく人物名・技名と、同じ読みの漢字表記を再照合する。名前呼びは相手の名前を確認する。続けて `node scripts/lantern-war/verify-voices.mjs` で全計画音声の存在、CPU設定、参照の一致、波形、最新SHAの検品記録、未解決の発音問題がないことを確認する。
8. `node scripts/lantern-war/finalize-voices.mjs` で既存音声と専用音声をランタイムへ登録する。検証が失敗した状態で専用音声を登録しない。

## ゲーム内の確認

- `node scripts/test-lantern-war-audio-browser.mjs`：実OGGの読み込み・割り込み・消音・読み込み中止・自然終了。
- `node scripts/test-lantern-war-voice-controls.mjs`：再生の停止、優先制御、名前呼び、同じイベントの重複抑制、再挑戦時の再生、消音。
- `node scripts/test-lantern-war-browser.mjs`：本編の操作、スマホ縦横、全18章、背景の接地、旧セーブ補正。
- `node scripts/test-lantern-war-guides-browser.mjs`：戦闘とキャンプ各項目の初回チュートリアル、再表示、英語、フォーカス。
- `node scripts/test-lantern-war-scenes.mjs` と `test-lantern-war-terrain-browser.mjs`：地理、背景、BGM、地形の連結、橋の取り付け部、4500問解放の順番。
- 素材と地形の仕様は `scenes-and-terrain.md` を参照。

## 配信前

アセット一覧を更新し、`pnpm run build` と `pnpm run server:build` を確認する。既存の未コミット変更を混ぜず、mainへpushする。GitHub Actionsの監視やRenderへのデプロイは、この依頼には含めない。
