# 野球・サッカー・バレーの実況音声

## 演出

オリジナルの3役を共通の実況席として使用する。実況は熱く明瞭な30代男性、解説は落ち着いた低い声の50代男性で、プレーに軽く突っ込みながら次の改善点を返す。審判は簡潔な判定コール。実在の実況者を模倣しない。プレイヤーの人格や能力をけなす表現は使わない。

台本は `assets/academy-sports/broadcast-plan.json`。実況・解説27組54本と、各競技の審判24本で計78本。通常の掛け合いは11秒以上間隔を空け、ホームランやゴールなど重要な場面を優先する。同じ重要演出の連続重複も抑制する。審判はゲームが実際に判定したイベントに対応する。選手の既存ボイスと共通の発話キューを使い、審判が優先して割り込む。画面移動、問題出題、非表示、ミュートで再生と待ち行列を破棄する。オンライン途中参加時に過去の判定は読み上げない。運動会には流用しない。

バレーの最終得点でも反則・得点理由を先に通知し、試合終了だけで判定が消えないようにする。競技ルールや得点計算は変更しない。

## 制作と検査

公式Irodori-TTS revisionとモデルのSHA256、台本、参照SHA256、seed、時間、生成機器を `broadcast-build.json` に保存。新しい参照はv4.1 Small RF40、量産はv4.1 Small MF4。読みが不明瞭な音源は同じ参照を使いSmall RF40で再生成する。モデルとcodecの両方をCPUに固定する。AVX512-BF16環境でモデルのみBF16 autocast、codec・loudness・watermarkはFP32。短い審判コールは長さを明示し、余計な発話を防ぐ。音量は-18 LUFS、true peak -1.5 dBを基準に整える。

```sh
python scripts/academy-sports/generate-broadcast.py --references
python scripts/academy-sports/review-broadcast.py --references
python scripts/academy-sports/generate-broadcast.py
python scripts/academy-sports/review-broadcast.py
node scripts/academy-sports/finalize-broadcast.mjs
node scripts/test-academy-broadcast.mjs
```

生成とビルド・ブラウザ検査・ASR検査はメモリ使用量が大きいため、順番に実行する。

上記のPythonはIrodori-TTSのCPU依存関係とfaster-whisper、pykakasi、rapidfuzzのある環境を使用する。ASRはCPU Whisper Smallで読みを照合し、読みの一致率は実況・解説90%以上、審判95%以上を基準にし、波形の有限性・ピーク・RMS・尺・実ファイルhashも確認する。判定が怪しい音声は個別に再生成する。`--only=referee/baseball.strike` と `--seed-offset=100` で限定再生成できる。一つの音源の失敗は他の生成を妨げず、失敗記録が残る。合格していない音声はfinalizeで有効化できない。余計な冒頭だけを除く場合は `trim-broadcast-call.py --id=referee/soccer.penalty --word=PK` でCPU ASRの単語時刻を使って切り出せる。元音源は配信対象外の制作フォルダ `assets/academy-sports/review-sources/` に保持し、元hash・開始終了時刻を制作記録へ保存する。切り出した音声も再検査が必要。これは自動検査であり、人間による声色・演技の評価を代替するものではない。

生成済み参照・本番音声がある状態で台本や声色設定を変更する場合は、該当する音声を再生成・再検査する。端末読み上げへの置き換えは行わない。アプリの既存音声再生基盤を通じてWeb/iOS/Androidの音声設定・停止処理を共有する。

## 2026-11-12の検証記録

main `79f5db5c` を反映。78音源すべてのASR・波形・参照/音源hash検査を通過。Chromiumで全78 OGGのデコード、3役の実再生、Reactの判定→実況→解説、開始コール、問題中の停止、途中参加、ミュート、アンマウント時の実音声停止を確認。既存のAndroid素材エントリーが欠けず、78本だけ追加されたことも照合した。

型チェック・英語UI監査・Webビルド・server:buildは成功。素材を限定取得した環境なので、Webビルドは `pnpm --config.enablePrePostScripts=false run build` で既存の生成済み索引を保持して実行。新音声の素材一覧はfinalizeで更新した。初回検証時点ではGitHubへのpush・デプロイは行っていない。

## mainアップロード前の統合検証

ユーザーのアップロード指示を受け、最新main `d93a7f79` を取り込んだ。追加されたクイズ番組の変更を保持し、78音源の整合性検査とChromiumでの実再生・停止検査を再実施。結合後の型チェック、英語UI監査、Webビルド、server:buildが成功した。Webビルドは上記と同じ生成済み索引を使用。RenderデプロイやGitHub Actions監視は対象外。
