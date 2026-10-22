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
