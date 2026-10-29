# VRオンラインバトル改修・引継ぎ

## 目的と範囲

ユーザーの「VRオンラインバトルをフォートナイト風にブラッシュアップする」依頼。既存の独自キャラクター・学校の訓練用装備・学習問題の補給を生かす。mainへのpush成功まで進め、確認後は「VRオンラインバトルの改修を再開」自動タスクを停止する。GitHub Actions・Renderの監視/デプロイは行わない。

## 状態（2026-10-30）

実装・全検証は完了。開始時・再開時のmainは`cf7e47cd`で一致し、他の作業エージェント・同じ処理の実行はなかった。今回の変更はこの作業で作成したもの。過去のカットイン・ことば日和は完了済みで再実装しない。

詳細仕様と検証コマンドは [vr-royale-upgrade.md](vr-royale-upgrade.md)。新規実装の中心は以下。

- `royale.ts`: ダッシュ/走力、シールド、資材/設置カバー、3段階ストーム、撃破・着弾イベント。
- `royaleScene.ts`/`scene.ts`: 明るい屋外訓練場、射線・着弾・パネル・ストーム、三人称、縦画面のカメラ中心、移動補間。
- `RoyaleHud.tsx`/`royale.css`: 端にまとめたHUD、武器ごとの弾数、スマホ縦横、右下2列操作。短い縦画面は装備を左側へ移す。
- `OnlineGame.tsx`: 押し続け射撃、攻撃ボタンのドラッグで旋回、ダッシュ/設置操作。一時停止メニューからのキャラクター編集。
- `roomCommands.ts`: 描画と分離した50ms入力送信と合わせ、未処理の短い操作や装備変更を次のシミュレーションまで保持。高負荷時の入力取りこぼしを修正。
- `onlineEngine.ts`/`onlineRules.ts`/`soloBots.ts`: 武器別弾数、最低42個の補給、CPU対応、脱落後の勝敗干渉防止。
- `VR_PROTOCOL_VERSION=7`: クライアント・Peer部屋名・サーバーで共有。旧クライアント混在を防ぐ。サーバー反映には既存方針どおり別途手動デプロイが必要で、この作業では実施しない。
- `viewCopy.ts`を通じて英語・ひらがなexact辞書にも新規文言を登録。

## 検証記録

通過済み:

- test-vr-online、test-vr-royale、test-vr-gameplay-polish、test-vr-solo-battle、test-vr-camera。
- test-vr-server-40: 40人の実WebSocket、41人目拒否、爆弾同期、ホスト引継ぎ。
- test-vr-royale-server: **40人の実WebSocket**でカバーの設置/破壊、射撃、走力、問題補給、ホスト引継ぎ、旧版拒否。直近ログ `/tmp/vr-upgrade-server-play-final.log`。
- test-vr-royale-browser: 1440x900、390x844、844x390、667x375、320x568。操作と装備欄の重なり、長押し解除、ダッシュ、カバー、視点、英語UI。直近通過ログ `/tmp/vr-upgrade-browser-final.log`。
- test-vr-royale-online-browser: 実ブラウザーのホスト/ゲストで作成・参加・開始・カバー同期・長押し射撃・ドラッグ照準・ダッシュ。`/tmp/vr-upgrade-online-browser-final.log`。
- test-vr-solo-browser: 最新タイトルの「バトルトレーニング」から両モード、問題選択、CPU、移動、補給、編集時一時停止、再戦、退室、アプリWebSocket未使用。`/tmp/vr-upgrade-solo-browser-final.log`。
- 最後のホスト用表示調整を含め、typecheck、audit:english:gate、build、server:buildはすべて通過済み。残りはcommit/push成功の確認と自動タスク停止のみ。

最終確認の結果:

- `/tmp/vr-upgrade-browser-verified.log`: 短い縦画面配置・命中表示の最終確認。
- `/tmp/vr-upgrade-online-browser-verified.log`: 入力保持修正後の実ブラウザー通信。
- `/tmp/vr-upgrade-verified-build.log` / `vr-upgrade-verified-server.log`: 最新版のbuild/server:build。
- スクリーンショット: `tmp/vr-royale-browser/`、`tmp/vr-royale-online-browser/`。

## 最後の手順

1. 上記最終確認はすべて通過済み。build/server:buildを連続実行した終了コード0を確認。実ブラウザーのホストでは対戦中に無効な観戦ボタンがレーダーを隠さないことも確認。
2. buildが作った無関係なUnicode正規化差分は、開始時にクリーンだった`src/data/cardIllustrationManifest.ts`と`src/data/enemyIllustrationManifest.ts`だけを戻し済み。
3. 差分・最新mainを確認し、今回分を`Polish VR royale combat, cover and mobile controls`というコミットでmainへpush。実際のpush成功とHEAD/origin/main一致を確認。同名コミットがorigin/mainに存在すれば再実装しない。
4. push成功を確認できたら、この作業の自動タスクを停止しユーザーへ報告。完了コミットがmainにあれば再実装しない。

既存stash `kotoba-main-sync` / `star-tide-story-in-progress`は保持する。作業場所は会話指定の`/workspace/math-rogue`。新規エージェントは起動しない。
