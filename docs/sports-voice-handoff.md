# スポーツ専用ボイス生成 引き継ぎ

2026-10-27更新。引き継ぎ依頼後、ユーザーからボイスを含めて続行する指示があり、担当を戻して全310本を生成した。再生成・保守用の手順を以下に保持する。作業場所は `/workspace/math-rogue`。

## 依頼の範囲

ゴルフ・テニス・バスケ・ドッジボールの高校編9人、マジック編17人の全26主人公に、各競技の通常アクションと必殺技の専用音声を用意する。汎用主人公は男性4種類・女性4種類をキャラクタークリエイトで選べるようにする。競技の実際の判定に応じた審判音声も追加する。キャラクターの年齢感・声色の特徴を保ち、制作参照と読み方を計画に記録する。

## 確定した生成状況

- 計画の **310ファイルを生成済み**。未生成ID一覧は空。
- 汎用男女8声×9本＝72本、名前付き26人×8本＝208本、審判の参照用試聴1本＋競技コール29本＝30本。
- 正本計画：`assets/sports-performances/voice-plan.json`。
- 生成記録・SHA256・秒数・設定：`assets/sports-performances/voice-build.json`。
- 未生成ID一覧：`assets/sports-performances/voice-pending.json`。
- 出力：`public/sfx/sports/<speaker>/<sport>/<action|special>.ogg`。汎用声の試聴は `<speaker>/preview.ogg`。
- 聞き取り・波形の確認記録：`assets/sports-performances/voice-asr-review.json`。再生成後はSHAが変わるため再確認する。

## 使用した生成環境

リポジトリの `AGENTS.md` に従い、モデル・codecともCPU固定。GPUへ切り替えない。

- 公式コード：`/workspace/Irodori-TTS`
- 確認・更新済みrevision：`59be938c99d48b5653ca5aa3fdd0cddaa56940e5`
- モデル：`Aratako/Irodori-TTS-v4.1-Small-MF`
- モデルrevision：`ccc78f5d480b6e51b69b2d5042a14c4da04fea6e`
- Python：`/workspace/Irodori-TTS/.venv/bin/python`
- CPU BF16 autocast、2スレッド、MeanFlow 4 stepsを基本に、個別リテイクで8 steps。MFは公開モデルの蒸留済みCFGを使い、入力したjoint guidance [3,3,3]は推論時には無効。
- codec：Semantic-DACVAE Japanese、CPU BF16。SilentCipher透かしを有効にしたまま生成。
- loudnorm -18 LUFS、末尾35msフェード＋120msパディング、44.1kHz mono Vorbis。
- 汎用8声はそれぞれVoiceDesignで参照声を新規生成し、その声を同じ人物として残りの台詞に利用。
- 名前付き主人公は計画内の参照ファイルとSHAを使用。高校編ASSASSINは、落ち着いた中性的な中低音を保ちつつ子音を明瞭にするため、スポーツ専用VoiceDesign参照音声を制作して使用する。制作参照は `assets/sports-performances/references`、設定は生成記録の `reference_designs` に保存。必殺名の読みは `readings` に明記。
- 最新4.1系のMFを採用。v4-Largeも公開状況を確認したが、FP32で13GB超となり、この9.7GB CPU環境には不適合と判断。選定理由は計画と生成記録にも保存。
- 初期23本は自動尺。それ以降はpykakasiの読みを基に明示尺を指定し、時間予測の重複計算を削減。短い掛け声のリテイクでは0.8秒以上の必要な尺を用い、8 stepsも利用する。個別の採用設定は計画の `clip_overrides` に保存し、通常再開で採用済みリテイクが元に戻らないようにする。

別環境で再開する際も、公式コード・モデルの最新版を再確認し、変更したrevisionを記録する。必要パッケージは公式CPU環境に加えて `pykakasi`、レビューには `faster-whisper`。キャッシュと中間WAV／参照latentは `tmp/sports-voices` にある。

## 再開コマンド

リポジトリ直下で実行する。通常再開は既存の正常なファイルをSHA・レシピで確認してスキップする。

```bash
OMP_NUM_THREADS=2 MKL_NUM_THREADS=2 /workspace/Irodori-TTS/.venv/bin/python scripts/sports-performances/generate-voices.py --device cpu --threads 2
```

個別の話者だけ処理する場合：

```bash
/workspace/Irodori-TTS/.venv/bin/python scripts/sports-performances/generate-voices.py --device cpu --threads 2 --only high-school-warrior
```

`--regenerate` は対象話者の既存音声も作り直すため、通常再開では指定しない。`--limit` は新規生成件数を制限する。審判は `--only referee`。個別の修正はID文字列のJSON配列を `--retakes <path>` で指定し、`--seed-offset` と `--seconds`／`--extra-seconds` で読みと尺を調整する。汎用声のpreviewを作り直す場合は、その話者の他の8本も再生成して声色を揃える。専用制作参照が欠けている場合の初回制作は `--only high-school-assassin --design-reference high-school-assassin --design-reference-only`。参照の本文を確認後、`--only high-school-assassin` で競技別の8本を制作する。既存参照があれば再利用し、採用済みの声色を維持する。

生成完了後のASR・波形チェック：

```bash
OMP_NUM_THREADS=1 /workspace/Irodori-TTS/.venv/bin/python scripts/sports-performances/review-voices.py
node scripts/sports-performances/build-catalog.mjs
```

ASRモデルは既定small、CPU int8、ローカルキャッシュ必須。再確認は `--model medium --recheck-flagged`。別の記録へ出す場合は `--output <path>`。`needs_review` は再確認候補であり、固有名詞の表記揺れもある。実際の読み落とし・不自然さと区別して試聴し、必要なものを再生成する。台詞を初期プロンプトに直接与えて正解扱いする検証はしない。

生成後は310件の存在・SHA一致・無音／破損・尺・台詞を確認し、最新記録からカタログと秒数を再生成する。カタログは310件分に更新済み。未生成ID一覧は空。

## 審判の注意点

- テニス：フォルト／ダブルフォルト／レット／アウト、デュース、アドバンテージサーバー／レシーバー、ゲーム／セット。長いデュースでも単なる点数4ではなく両者の得点差と現在のサーバーで判定。タイブレークでアドバンテージコールをしない。
- ゴルフ：ナイス／パーフェクト、ホールインワン、アルバトロス、イーグル、バーディー、パー、ボギー、ダブルボギー、それ以上はホールアウト。OB・池は1打罰。パターにナイスショットを誤適用しない。
- バスケ：このゲームの実装に合わせて2点／3点、ショットクロック違反、試合終了。
- ドッジ：キャッチ／ジャストキャッチ、実際に外野へ移るアウト、試合終了。

## 音声以外の現在の実装

以下を実装。構成と再生成手順は `docs/sports-performances.md` を参照。

- `sportsEvents.ts`：ホスト／サーバーが発行する最大12件の演出イベント。4競技のエンジン・型・受信検証へ接続済み。
- `SportsVoicePicker.tsx`：汎用8声の選択と試聴。avatarの `sportsVoice` は8種のIDだけを許可。名前付き主人公は専用声を優先。
- `SportsPresentation.tsx`／`sportsVoiceQueue.ts`：音声の重複防止、重複パケットの再生防止、離脱・非表示・ミュート時の停止、固有カットイン。
- AudioServiceにスポーツ音声用再生・停止・ボイス音量連動を追加。BGMは変更しない。
- ImageGenで26人×4競技＝104ポーズを7枚の透過アトラスに生成済み。元画像・プロンプト・ハッシュは `assets/sports-performances/cutin-build.json`、実行画像は `public/sprites/sports-cutins`。
- Blenderで4競技別GLBと16フレームの透過エフェクトを生成・glTF Transformで最適化済み。ソース `.blend` と生成スクリプトを保持。GLBは約27～45KB、各3アニメーション。`effect-build.json` 参照。
- 4競技の3DレンダラーへBlenderエフェクトを接続済み。
- ゴルフに正解で蓄積するスターゲージと必殺ショットを追加。サーバーでゲージ消費を検証し、水平初速を8%増やす。予測表示も同じ倍率を適用する。

## 保守時の検証

```bash
node scripts/test-sports-performances.mjs
node scripts/sports-performances/verify-assets.mjs --complete
node scripts/test-sports-performances-browser.mjs
pnpm run build
pnpm run server:build
```

実画面テストは4競技の縦横、必殺技ボタン、専用カットイン、GLB読込、音声選択と試聴、ミュート・一時停止・イベント重複を確認する。生成・再生成後は全件ASR記録のSHAも確認する。

Web／Androidのアセット一覧は音声・イラスト・GLBの変更後に再生成する。Renderは明示依頼時だけ手動デプロイ。4競技のサーバー側イベントとゴルフ機能も変更しているため、mainへのプッシュだけでは専用サーバーに反映されない。
