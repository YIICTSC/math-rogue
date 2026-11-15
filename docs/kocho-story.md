# 校長対決：主人公別ストーリー制作

対象は赤ジャージの勇者・叛逆の高校生・星宮あかりの3人。通常編7章に合わせ、開始時、次章前6回、エンディングの8場面を各主人公に用意する。計24場面・各4発話。ナレーションとゲスト台詞を共有し、録音は64本。字幕・英訳・ひらがなは `src/mini-games/kocho/story/scenes.json`。

放課後禁止令への異議をきっかけに、購買のパンや応援旗をめぐる軽い掛け合い、校長の昔の思い出、仲間の居場所を守る決意を描く。継界戦記のアステルとリュラがゲスト参加。主人公別に台詞と一枚絵を分け、各エンディングは勝利だけでなく校長も交えた祝勝会にする。

一枚絵はImageGenで各場面を個別生成。生成元PNGを `assets/kocho/story/originals/` に保持し、ゲームでは1536px以下のWebPを使用。`art-sources.json` と `art-build.json` に生成元、配置先、SHA-256を保持する。加工は `node scripts/prepare-kocho-story-art.mjs`。

音声は公式Irodori-TTS v4.1 Small MF。2026-11-15に公式HEAD `382205679ebc32295b7d1bfb329327d04c8f4eed` と公開モデルrevision `ccc78f5d480b6e51b69b2d5042a14c4da04fea6e` を確認。モデル・codecともCPU、bf16、2スレッド、基本4-stepで生成。読みの疑いがある4本は読み指定と8-stepで個別再生成。既存の校長対決3主人公ボイス、および承認済み成人v3のアステル・リュラ参照を使用。ナレーションのみ新しい架空の語り手を設計し、同じ参照を使い回す。既存の戦闘音声は変更しない。

環境の通常ディスクでは3.1GBのモデル取得に失敗したため、空きのある `/tmp/kocho-model-cache` を使用。生成・ASR・ビルドを同時に実行するとメモリー上限に達するため、音声生成後に検査とビルドを順に行う。再実行は完了済みのレシピとハッシュが一致する音源を保持する。

```sh
HF_HUB_CACHE=/tmp/kocho-model-cache /workspace/Irodori-TTS/.venv/bin/python scripts/generate-kocho-story-voices.py --irodori-root /workspace/Irodori-TTS --device cpu --threads 2 --cpu-autocast
/workspace/Irodori-TTS/.venv/bin/python scripts/audit-kocho-story-speech.py --batch-size 6 --threads 1
node scripts/finalize-kocho-story.mjs
```

自動読み検査は補助指標。低一致の音源は読み・認識結果を確認し、必要なら再生成する。未解決の音源がある場合は公開しない。`ready.json` は初期状態で無効。24画像と64音源のハッシュ・デコード・CPU指定・読み検査が合格した後にのみ有効化する。

ストーリー画面には自動再生、音声ON/OFF、戻る・次へ・スキップを用意。終了・場面変更・画面離脱で再生を停止する。読込失敗でも次へ・スキップが使える。見終えた場面は挑戦内の `storySeen` に保存し、報酬やショップを往復しても再生を繰り返さない。エンドレスには割り込ませない。新しい挑戦では再度再生する。

公開前に全画像・全音源検査、スマホ縦横・キーボード・自動/手動送り・ミュート/スキップ・復帰、既存校長対決の回帰、型チェック・英語gate・Web/サーバービルド、Web/Android素材一覧の更新を行う。

## 最終検証記録（2026-11-15）

- 24枚の個別ImageGen画像、64本の音源、96字幕の参照を照合。全音源が44.1kHzモノラルでデコードでき、無音・音割れ・参照ハッシュの異常なし。
- 小型ASRで疑いの出た4本を8-stepで再生成。うち2本をmediumでも再検査し、どちらも読みが一致。音声認識・波形検査による確認であり、全音源を人が試聴したという記録ではない。
- ブラウザで全24場面のCGと96字幕・音声パス、320×568、390×844、568×320、844×390、1280×720の操作ボタンを確認。自動／手動送り、戻る、スキップ、ミュート、キーボード、画面非表示からの復帰、英語字幕が通過。
- 実OGGの再生と自然終了時の送り、異なる台詞の個別読み込み、ミュート／スキップによる停止が通過。実ゲームの全24接続、会話中の背後入力停止、既読管理、エンドレス除外が通過。

再確認コマンド：

```sh
node scripts/test-kocho-story.mjs
node scripts/test-kocho-story-browser.mjs
node scripts/test-kocho-story-transitions.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/test-kocho-browser.mjs
```

既存戦闘の160固有カード・432特殊行動配置・旧セーブ復元・解放条件・レスポンシブ表示の回帰テストも成功。型チェック、英語gate（実行時監査を含む）、Web build、server:build、Web起動量チェックが成功。Android素材一覧は既存全項目を保持し、画像24・音源64の88項目のみ追加。Web素材一覧も同じ範囲で更新。
