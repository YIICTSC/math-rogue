# ダンジョンズ2・星潮の航路の戦闘ボイス

2026-11-13、main `52a78ace` を基点に元ゲームの録音・戦記の再生経路を調査。
元ゲームに適切な録音がある場合はパス参照で流用し、音声ファイルを複製・上書きしない。

## 収録と割り当て

対象はダンジョンズ2のリリア・セリス・フローラ・ノクティア・オーレネ・イグニス・レオン・オリオン・リーフ、星潮の航路のナギ・ミオ・セナ。

| 対象 | 通常攻撃・被弾・回復・援護・勝利・敗北・必殺 |
| --- | --- |
| ダンジョンズ2の9人 | 各人の `attack / damage / heal / heal / finish / defeat / ultimate-3.ogg` を流用。援護には回復・励ましの台詞を使用 |
| ナギ | 元ゲームの弓攻撃・被弾・感謝・防御・クエスト達成音声を流用。敗北のみ新規。必殺は戦記の既存録音 |
| ミオ・セナ | 元ゲームは長いイベント会話が中心のため、通常戦闘用の各6本を新規。必殺は戦記の既存録音 |

計84の割り当てのうち71は既存録音、13は新規生成。重複する回復・援護を除くと75ファイル（既存62、新規13）。
ダンジョンズ2には既に通常攻撃等の汎用台詞から元ゲームへの別名参照があった。今回、実際の発話に合う字幕と7種の明示的な割り当てを整え、援護相手の専用録音がない場合にも本人の汎用援護を再生できるようにした。

`src/mini-games/lantern-war/battleVoiceBank.json` が追加割り当ての正本。元の `voiceManifest.json` と既存技ボイス・イベント会話は変更しない。既存ファイルのIDも維持する。追加音声はボイスシアターでも選べる。

## 声の維持・生成環境

- ミオ・セナとも、元ゲームの女性の声を参照。別ゲームの同名人物や、声質が異なる掛け合いの録音を参照しない。
- 参照はナギ `action-heal-1.ogg`、ミオ `npc-1-room-0.ogg`、セナ `npc-3-room-0.ogg`。実ファイルのSHA-256を `voice-build.json` に記録。
- 公式 Irodori-TTS 最新コード確認時の revision: `382205679ebc32295b7d1bfb329327d04c8f4eed`。
- 使用モデル: `Aratako/Irodori-TTS-v4.1-Small`、revision `2b28324dc263ed5e6638b3cf3dd94c82ead07b4b`。
- Codec: `Aratako/Semantic-DACVAE-Japanese-32dim`、revision `47376ee24834d7a05a48ebabfe3cde29b3c5e214`。
- 推論・codecともCPU固定、2スレッド、bf16。CPUのbf16はPyTorchで処理し、公式CLIのGPU/XPU限定の型検査には生成スクリプト内の互換処理を使用。GPUへ切り替えない。
- メモリ節約のため公式fp32重みをストリームでbf16へ変換して読み込む。学習や重みの追加は行わない。SilentCipherの埋め込み処理はCPU fp32で有効。
- 乱数seed・ステップ数・発話用かな・秒数は `voice-plan.json` と `voice-build.json` に記録。4ステップを基本とし、不明瞭な台詞は12ステップで再収録。
- 配信用はmono / 44.1 kHz / Vorbis q4、loudnorm `I=-18:TP=-1.5:LRA=7`。

## 再生成

各環境で公式リポジトリを取得し、`uv sync --extra cpu --no-dev` で依存を用意する。作業ごとに最新コード・公開モデルを再確認する（既存記録の再現時には上記revisionを使用）。モデル・参照音声の配置は任意で、特定端末の絶対パスには依存しない。

1. 公式モデルと同梱 `tokenizer/` を取得する。必要なら `prepare-cpu-voice-checkpoint.py --source <公式model.safetensors> --output <新規CPU用model.safetensors>` で省メモリ用重みを作る。出力の隣にも同じ `tokenizer/` を置く。
2. `python scripts/lantern-war/generate-cross-game-battle-voices.py --irodori-root <公式コードの場所> --checkpoint <CPU用重み>`。生成済みで記録のハッシュと一致する音声は再生成しない。再収録は計画を更新し `--only mio:attack` のように指定する。
3. `python scripts/lantern-war/finalize-cross-game-battle-voices.py --verify`。
4. `python scripts/lantern-war/review-cross-game-battle-voices.py --model <faster-whisper-smallの場所>`。台詞の事前ヒントなしでCPU int8認識し、波形・発話とハッシュを保存する。誤認識もあり得るため、不明瞭な箇所は台詞単位で再収録して再検査する。
5. `node scripts/build-theater-voices.mjs`、Web・Androidアセット一覧を更新する。疎なチェックアウトでは各生成器の `--update-prefix sfx/lantern-war/battle/` を使い、他資材の一覧を保持する。

## 検証

- `node scripts/test-lantern-cross-game-voices.mjs`: 12人×7種、既存技・援護相手のフォールバック、重複抑止、音量オフ、実ファイルのデコード・波形・長さ・生成記録・シアター字幕。
- `node scripts/test-lantern-cross-game-audio-browser.mjs`: Chromiumで全75ファイルをWebAudioデコードし、通常攻撃と新規反応の23経路を実再生。必殺技と次の反応の重なり再生、WebAudioフォールバック、ミュートを確認。
- `node scripts/test-lantern-war-voice-controls.mjs`、`node scripts/test-theater-voices.mjs`: 既存の音声制御とシアターへの回帰検査。
- `pnpm run build`（型検査・英語UI監査含む）、`pnpm run server:build`。
