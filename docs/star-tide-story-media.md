# 星潮の航路：物語・音声素材

- 開幕7節のプロローグは「止まった海」「消えた十二の星灯」「島の人々と次の航路を選ぶ旅」を紹介する。途中で閉じても同じ節から再開できる。既存の航海記録は維持し、新しい航海でプロローグを開始する。
- 全12章の選択場面に専用のイベント一枚絵を表示する。開幕用を合わせて13枚。ナギの既存イラスト、トワのNPC、ミオ・セナの既存スプライトを人物資料としてImageGenで生成。原本は `assets-source/star-tide/events/`、配信用は `public/sprites/star-tide/events/`。来歴とハッシュは `assets/star-tide/event-art.json`。
- 日本語音声151本：物語・NPC等77本とアクション74本。語り、ナギ、トワ、ミオ、ルカ、セナ、ユイ、オル、リト、エマ、もう一人の航海士で声を分ける。英語表示時も日本語音声を利用する。
- 物語は1節ずつ読み上げ、台詞送りで前の音声を止める。再生ボタンで聞き直せる。NPCは全12章×4地点に対応。帆の覚醒と両エンディングも読み上げる。
- アクションは8武器、回避、被弾、救助、回復、滑空、着地、拾得、仕掛け、星灯、依頼、料理に複数の台詞を用意。実際の発動・成功を見て再生し、連続再生の間隔を設ける。通常歩行には声を付けない。物語の読み上げ中にはアクション音声を重ねない。
- 音声は共通AudioServiceのボイス音量で制御する。効果音を消しても音声は再生でき、ボイス音量0・全体ミュート・画面離脱・バックグラウンド移行で止まる。

## 音声の再生成

公式 `Aratako/Irodori-TTS` の最新コードとモデルを作業開始時に確認。モデル・codecともCPUで推論し、使用したrevision、8ステップ、guidance、各ファイルの精度、音量調整、出力のハッシュと波形情報を `assets/star-tide/voice-build.json` に記録する。声の元は今回のために生成したオリジナル音声で、人物ごとの参照WAVを保持する。

台本は `assets/star-tide/voice-plan.json`。`text` が表示文、`spokenText` は「星灯→ほしあかり」など読みを明示した入力文。表示用カタログは `src/mini-games/star-tide/voiceCatalog.json`。

公式ランタイムのCPU環境で、ルートから次を実行する。`IRODORI_ROOT` を公式リポジトリのチェックアウトに設定し、その仮想環境のPythonを使う。

```sh
PYTHONPATH="$IRODORI_ROOT" "$IRODORI_ROOT/.venv/bin/python" scripts/star-tide/generate-voices.py
node scripts/star-tide/pack-event-art.mjs
node scripts/star-tide/finalize-media.mjs
node scripts/generate-web-asset-manifest.mjs
node scripts/generate-android-asset-manifest.mjs
node scripts/test-star-tide-story-assets.mjs
node scripts/test-star-tide-story-browser.mjs
```

生成済みファイルは台本とハッシュを確認して再利用する。台詞・演技を変更する場合は、該当IDの生成記録を除いて再生成する。人物の基準声を変える場合は、その人物の参照WAVと全台詞を一緒に再生成する。

CPUの作業メモリを抑えるため、後半の生成には `STAR_TIDE_CPU_BF16=1` を使用した。公式ランタイムをCPUでロードした後、PyTorchでモデルをbfloat16へ変換し、codecもCPUのまま推論する。既存のfp32生成分とともに各ファイルへ精度を記録する。通常のfp32生成ではautocastのキャッシュを無効にし、CPU専用環境でも大きな一時メモリを抱えない。

読み上げ検査は `review-voices.py`（faster-whisper small / CPU）、短い掛け声の補助検査は `review-voices-secondary.py`（medium / CPU）で行う。文字起こしの同音異字と、非言語の被弾リアクションは自動的な不良音声判定にしない。レビュー記録は出力ファイルのハッシュと対応させる。
