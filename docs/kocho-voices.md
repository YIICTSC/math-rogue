# 校長対決の専用ボイス

赤ジャージの勇者、高校編の叛逆の高校生、マジック編の星宮あかりを対象にする。技名を含む掛け声はカード1種類につき1本、主人公ごとに生成する。同じ共通技でも3人の音声は別ファイルとする。

- 赤ジャージの勇者: 共通77技 + 11アクション = 88本
- 叛逆の高校生: 共通77技 + 専用80技 + 11アクション = 168本
- 星宮あかり: 共通77技 + 専用80技 + 11アクション = 168本
- 合計424本。派生技・解放技・最終奥義にも固有の技名入り音声を持つ。

アクションは開始、前進、後退、振り向き、待機、固有移動、被ダメージ、Wave突破、勝利、敗北、道具使用。移動失敗・クールダウン中には成功時の声を出さない。連続技は各掛け声の終了まで次のカードを待つ。音声OFFでは待ち時間を追加しない。読み込み不調時は音声の長さ+5秒を上限として待機を解除する。短い間隔の移動では掛け声を重ねない。音声付きコンボの実行中は実行直前の再開可能な状態を保持し、途中のEXECUTING状態で上書きしない。移動や被ダメージの声は技の声を遮らず、勝敗を優先する。タイトル再挑戦・退出・非表示で再生と読み込み待ちを無効化する。

## 公式最新版の確認とCPU生成

公式: https://github.com/Aratako/Irodori-TTS

確認したmain: `89f9d8fbd4d51ea019867ee1197725ede1df13c5`。v4-Large対応・MeanFlow蒸留を含む。実際に公開済みの日本語モデルとして [Aratako/Irodori-TTS-v4.1-Small-MF](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small-MF) を基本に使用（4ステップ・発話時間の自動推定）。発音の難しい候補は通常のv4.1-Smallによる再生成も比較する。

公式ランタイムを `uv sync --frozen --extra cpu` で導入し、モデル・DACVAE codecともCPUで実行。BF16対応CPU上でニューラル演算にBF16、音量正規化とSilentCipherにFP32を使用する。SilentCipherウォーターマークを保持し、44.1kHzモノラルOGGを配信する。

高校生とあかりは本編の既存キャラクター音声を参照。赤ジャージは既存の専用音声がないため、Irodoriの説明文による架空の声を生成し、その同一参照から全技を生成する。

台本・読み: `assets/kocho/voice-lines.json`。生成履歴: `assets/kocho/voice-build.json`（公式revision、チェックポイントSHA、CPU、参照SHA、seed、設定、各音声SHA）。ライセンスは `assets/kocho/Irodori-LICENSE.txt`。

```sh
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --device cpu --threads 2 --cpu-autocast
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --device cpu --threads 2 --cpu-autocast --model Aratako/Irodori-TTS-v4.1-Small --steps 16 --cfg-mode independent --speaker-guidance 5 --seed-offset 530 --repair-list assets/kocho/voice-repair-keys.json --regenerate
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --device cpu --threads 2 --cpu-autocast --model Aratako/Irodori-TTS-v4.1-Small --steps 32 --cfg-mode independent --text-guidance 4 --caption-guidance 2 --speaker-guidance 3 --seed-offset 1060 --repair-list assets/kocho/voice-final-refinement-keys.json --regenerate
/workspace/irodori-kocho/.venv/bin/python scripts/audit-kocho-speech.py
/workspace/irodori-kocho/.venv/bin/python scripts/verify-kocho-voices.py
node scripts/sync-kocho-voice-catalog.mjs
KOCHO_VOICE_TEST=1 CHROMIUM_PATH=/usr/bin/chromium pnpm exec node scripts/test-kocho-browser.mjs
```

ASRの読み一致率は短い叫び声や造語の補助指標であり、品質の保証値ではない。独立した日本語認識で候補を抽出し、別のlarge-v3-turbo認識でも再確認してから読みや生成設定を修正する。連濁や「雷」の別読み、技名の辞書分割による差も考慮する。部分生成のTSカタログは `--allow-partial` で作成できるが、提出前は全424本の存在・デコード・ハッシュとカタログを検証する。

## 敵の専用ボイス

通常・ボス・校長3形態・エンドレス限定を含む35種類に、登場・通常攻撃・被ダメージ・撃破を各1本、特殊行動を持つ19種類には技の掛け声も追加し、合計159本を生成する。真・校長の召喚にも専用音声を持つ。台本は `assets/kocho/enemy-voice-lines.json`、CPU生成履歴は `assets/kocho/enemy-voice-build.json`、音声は `public/sfx/kocho-enemy-voices/`。既存の架空の高校編敵音声から、役柄・性別に合う声を参照して専用台詞を新規生成する。校長と激怒校長は同じ声の参照を使い、形態に応じた台詞を分ける。

確定したゲーム状態の変化から1回につき最も優先度の高い1件を選び、Reactの再描画や状態更新の再評価で台詞を繰り返さない。変身は変身後の登場台詞を再生する。敵の技・攻撃は主人公の軽い被ダメージより優先し、主人公の技・勝敗台詞を遮らない。技の間に抑制した被ダメージ・撃破の反応は最も強い1件だけ保持し、技が終わって500ms後にも空きがあれば再生する。次の技・敵攻撃・画面移動などでは古い反応を破棄する。主人公と共通の1音声制御で、音声OFF・非表示・退出時の停止も共通化する。途中セーブからの再開では既にいる敵の登場台詞を繰り返さない。

```sh
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --enemies --device cpu --threads 2 --cpu-autocast
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --enemies --device cpu --threads 2 --cpu-autocast --model Aratako/Irodori-TTS-v4.1-Small --steps 16 --cfg-mode independent --text-guidance 4 --caption-guidance 2 --speaker-guidance 3 --seed-offset 530 --repair-list assets/kocho/enemy-voice-repair-keys.json --regenerate
/workspace/irodori-kocho/.venv/bin/python scripts/generate-kocho-voices-irodori.py --enemies --device cpu --threads 2 --cpu-autocast --model Aratako/Irodori-TTS-v4.1-Small --steps 32 --cfg-mode independent --text-guidance 4 --caption-guidance 2 --speaker-guidance 3 --seed-offset 1060 --repair-list assets/kocho/enemy-voice-final-refinement-keys.json --regenerate
/workspace/irodori-kocho/.venv/bin/python scripts/audit-kocho-speech.py --enemies --threads 2
/workspace/irodori-kocho/.venv/bin/python scripts/verify-kocho-enemy-voices.py
node scripts/sync-kocho-enemy-voices.mjs
KOCHO_ENEMY_VOICE_TEST=1 CHROMIUM_PATH=/usr/bin/chromium pnpm exec node scripts/test-kocho-browser.mjs
```

敵音声も独立した認識で不明瞭な候補を選び、通常版RFによる選択的な再生成を行う。短すぎる退場台詞には自然な一言を補い、予測された発話時間内の余分な発話を抑える。生成と認識は低メモリ環境では順番に実行する。配信マニフェスト生成と本番ビルド後は `scripts/verify-kocho-enemy-voices.py --distribution` でWeb/Android一覧・本番コピーの一致も確認できる。

今回の159本はMF 4ステップ136本、RF 16ステップ21本、RF 32ステップ2本。全159本の認識結果と、追加確認した45本の認識結果は、配信OGGの最新SHAに対応する。
