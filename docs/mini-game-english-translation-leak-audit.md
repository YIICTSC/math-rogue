# ミニゲーム英訳漏れ再監査メモ

作成日: 2026-07-08

## 目的

ミニゲーム各種について、英語モードで日本語が画面に残る箇所を再精査し、実表示に出る漏れを修正する。

## 対象

- `src/miniGameConfig.ts`
- `src/components/MiniGameSelectScreen.tsx`
- `src/components/MiniGameProblemChallenge.tsx`
- `src/components/GoHomeDash.tsx`
- `src/components/SchoolyardSurvivorScreen.tsx`
- `src/components/PokerGameScreen.tsx`
- `src/components/SchoolDungeonRPG.tsx`
- `src/components/SchoolDungeonRPG2.tsx`
- `src/components/KochoShowdown.tsx`
- `src/components/PaperPlaneBattle.tsx`
- `src/utils/textUtils.ts`

## 監査方針

1. `rg -n "[ぁ-んァ-ヶ一-龠]"` で残存日本語を拾う。
2. コメント、データ定義、翻訳キー、日本語モード用文言を除外する。
3. JSX直書き、`title` / `aria-label` / `placeholder`、ログ/説明/名前の表示経路を優先して確認する。
4. 内部IDや保存データ値は変更せず、描画時に `trans()` / `tr()` / `t()` を通す。
5. 辞書不足は `src/utils/textUtils.ts` に追加する。

## 初回メモ

- `MiniGameProblemChallenge` のカスタム課題名 `オリジナル問題` は英語モードでも表示される可能性がある。
- `PokerGameScreen` はスコア内訳ラベルに日本語生成文が残る可能性がある。
- `KochoShowdown` / `SchoolDungeonRPG` / `SchoolDungeonRPG2` はログ文の日本語が残りやすい。
- 大量データ定義は日本語原文をキーとして残すため、表示経路が翻訳関数を通っているかで判定する。

## 修正メモ

- `MiniGameProblemChallenge` のカスタム課題名を英語モードで `Original Problems` に切り替え。
- `PokerGameScreen` のスコア内訳ラベルを `t()` 経由に変更。
- `SchoolDungeonRPG` / `SchoolDungeonRPG2` のログ入口、装備メニュー、item title、装備略称、詳細ラベルを `tr()` 経由に変更。
- `KochoShowdown` のログ入口、直接 `logs.unshift`、難易度名、エンドレス撃破表示、特殊行動 title を `tr()` 経由に変更。
- `PaperPlaneBattle` のログ入口、休暇ログ表示、エネルギープール説明、パーツ詳細ツールチップ、報酬画面、マニュアルを `t()` 経由に変更。
- `src/utils/textUtils.ts` に上記表示・ログ用の英語辞書を追加。

## チェックリスト

- [x] 共通ミニゲーム選択画面
- [x] 問題チャレンジ共通入口
- [x] 帰宅ダッシュ
- [x] 校庭サバイバー
- [x] 放課後ポーカー
- [x] 風来の小学生
- [x] 風来の小学生2
- [x] 校長対決
- [x] 紙飛行機バトル
- [x] 辞書追加
- [x] 軽量TS/TSXチェック
- [x] `git diff --check`

## 検証

- `git diff --check -- docs\mini-game-english-translation-leak-audit.md src\components\MiniGameProblemChallenge.tsx src\components\PokerGameScreen.tsx src\components\SchoolDungeonRPG.tsx src\components\SchoolDungeonRPG2.tsx src\components\KochoShowdown.tsx src\components\PaperPlaneBattle.tsx src\utils\textUtils.ts`
- `npm run build`
