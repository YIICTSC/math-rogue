# 学習ローグ 1.0.7 リリースノート

更新日: 2026-09-11
対象: GitHub `main` の `1cd166f5..92844b99`（52コミット）
iOS: Version `1.0.7` / Build `58`

## 変更点

- エンドレスモードを全50章、1章15Fの構成へ拡張し、累計750F相当を進行できるようにした。
- 章クリア結果、章ごとの深層記録、共通特殊イベント、5章ごとのボスと固有ギミックを追加した。
- エンドレスの章マップ、敵スケーリング、ボス出現、章移行、50章クリア後の真エンドレス遷移を整理した。
- エンドレスの導入・真エンディングの進行条件、表示文、テーマ別の画像レイアウト、英語・ひらがな翻訳を修正した。
- 小学生編・高校編・マジック編のエンドレス背景、エンディング画像、マジック編男性主人公イベント素材を追加・更新した。
- 主人公別のエンディング音声とマジック編エンドレスイベント音声を追加し、再生処理を修正した。
- 課題・招待からの冒険再開、適用済み設定の復元、メインセーブとの分離、起動ロック中の安全な再開を改善した。
- 将棋Advanceの固有駒、移動ルール、局面生成、対面プレイの検証を拡張した。
- エンドレスボスの特殊行動と報酬選択を追加・改善し、ボス報酬の進行を安定化した。
- バカンスモードの解禁演出、衣装、専用の攻撃・被弾・待機アニメーションを追加した。
- バカンスモードの戦闘演出、キャラクター表示、画像透明度、WebP資産の読み込みを改善した。
- 高校編バカンスキャラクターのクロマキー用アニメーションシートを再生成し、攻撃・被弾・待機・特殊待機・低HP・スキル時の表示品質を改善した。
- オリジナルカードビルダーを解禁し、学習問題からオリジナルカードを作成できるようにした。
- ランキング参加の案内、協力プレイ、対象が必要なカードの判定、スマートフォン横画面の解禁表示を改善した。

## 主な実装箇所

- `src/App.tsx`
- `src/data/endlessMode.ts`
- `src/data/endlessChapterResults.ts`
- `src/data/endlessEndingSequences.ts`
- `src/data/magicEndlessEvents.ts`
- `src/components/EndlessClearScreen.tsx`
- `src/components/EndlessGimmickGlossary.tsx`
- `src/components/OriginalCardBuilderScreen.tsx`
- `src/components/OriginalCardBuilderUnlockModal.tsx`
- `src/components/BattleScene.tsx`
- `src/services/storageService.ts`
- `src/services/mapGenerator.ts`
- `src/mini-games/shogi/shogiEngine.ts`
- `src/services/audioService.ts`
- `public/event-illustrations/`、`public/sprites/`

## 検証

- GitHub `main` を取得し、上記コミット範囲の差分を確認した。
- XcodeプロジェクトのVersion/Buildを1.0.7/58へ更新した。
