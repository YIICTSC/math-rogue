# ミニゲーム英語翻訳対応 作業メモ

作成日: 2026-07-08

## 目的

`学習ローグ` のミニゲーム各種を、英語モード (`LanguageMode.ENGLISH`) で自然な英語表示に対応させる。

既存の本体UIは `trans(text, languageMode)` を中心に翻訳しているため、ミニゲームも同じ経路に寄せる。個別ゲーム内の長いチュートリアルや大量のゲーム内データは、必要に応じてゲーム別辞書または `textUtils.ts` の `ENGLISH_DICTIONARY` に追加する。

## 現状

- `MiniGameRouter` は各ミニゲームへ `languageMode` を渡している。
- `MiniGameSelectScreen` は `trans()` を使っているが、`miniGameConfig.ts` 側の名称・説明の英語辞書登録が必要。
- `PokerGameScreen` はチュートリアルだけ `POKER_TUTORIAL_STEPS_EN` / `POKER_TUTORIAL_LABELS_EN` がある。
- `GoHomeDash` は props の `languageMode` ではなく、内部で `getInitialLanguageMode(storageService.getLanguageMode())` を読んでいる。Routerから渡る値に統一した方がよい。
- `MiniGameProblemChallenge` には `languageMode` props がなく、各 ChallengeScreen へも渡していない。報酬ヒント (`rewardHint`) も日本語直書きが渡っている。

## 作業状況

- `MiniGameProblemChallenge` に `languageMode` を追加し、各 ChallengeScreen へ渡すようにした。
- `GoHomeDash` は Router から渡る `languageMode` を優先し、主要UIとアップグレード表示を `trans()` 経由にした。
- `SchoolyardSurvivorScreen` は問題チャレンジ、レベルアップ、進化、シナジー、結果画面の主要表示を翻訳対象にした。
- `PokerGameScreen` は結果、ショップ、パック、ルール、ライバル表示、問題チャレンジの主要UIを翻訳対象にした。
- `SchoolDungeonRPG` / `SchoolDungeonRPG2` はステータス、ヘルプ、デッキ/ショップ系、問題チャレンジの主要UIを翻訳対象にした。
- `KochoShowdown` は難易度、ヘルプ、ショップ、報酬、カード/アイテム/レリック表示、勝敗画面の主要UIを翻訳対象にした。
- `PaperPlaneBattle` はセットアップ、パイロット、パーツ、休暇、格納庫、報酬、結果画面の主要UIを翻訳対象にした。
- `src/utils/textUtils.ts` に各ミニゲーム向けの英語辞書を追加した。
- 今回の指示に従い、ビルドとブラウザ確認は未実施。

## 対象ファイル

| ファイル | 役割 | 日本語直書き行数の目安 | 優先度 |
|---|---|---:|---|
| `src/miniGameConfig.ts` | ミニゲーム選択画面の名称・説明 | 16 | 高 |
| `src/components/MiniGameSelectScreen.tsx` | ミニゲーム選択画面 | 9 | 高 |
| `src/components/MiniGameRouter.tsx` | 各ミニゲームへの props 受け渡し | 0 | 高 |
| `src/components/MiniGameProblemChallenge.tsx` | ミニゲーム内の問題チャレンジ共通入口 | 1 | 高 |
| `src/components/GoHomeDash.tsx` | 帰宅ダッシュ | 53 | 高 |
| `src/components/SchoolyardSurvivorScreen.tsx` | 校庭サバイバー | 95 | 高 |
| `src/components/PokerGameScreen.tsx` | 放課後ポーカー | 144 | 中 |
| `src/components/SchoolDungeonRPG.tsx` | 風来の小学生 | 302 | 中 |
| `src/components/SchoolDungeonRPG2.tsx` | 風来の小学生2 | 316 | 中 |
| `src/components/KochoShowdown.tsx` | 校長対決 | 329 | 中 |
| `src/components/PaperPlaneBattle.tsx` | 紙飛行機バトル | 671 | 中 |

行数は `rg -n "[ぁ-んァ-ヶ一-龠]"` の概算。コメントや内部データ名も含む。

## 実装方針

1. `languageMode` の受け渡しを揃える
   - 全ミニゲームは `MiniGameComponentProps.languageMode` を受け取り、表示テキストはその値で決める。
   - `GoHomeDash` のような内部取得は、props 優先に変更する。
   - `MiniGameProblemChallenge` にも `languageMode?: LanguageMode` を追加し、必要な ChallengeScreen へ渡す。

2. 短いUI文言は `trans()` に寄せる
   - ボタン、見出し、ステータス、報酬ヒント、確認ダイアログは `trans('原文', languageMode)` に統一する。
   - `src/utils/textUtils.ts` の `ENGLISH_DICTIONARY` にミニゲーム文言を追加する。

3. ゲーム内データは ID を維持し、表示名だけ翻訳する
   - 武器、パッシブ、パーツ、敵、イベント名などは既存IDを変更しない。
   - `name` / `desc` / `evolvedName` / `evolvedDesc` など、表示に出るフィールドだけ翻訳対象にする。
   - 保存データに `name` を入れている場合は、保存値を英語に変えず、描画時に翻訳する。

4. 長文ヘルプはゲーム別に分ける
   - `PaperPlaneBattle` のマニュアルや `PokerGameScreen` のチュートリアルは、既存のポーカー方式に合わせて `*_JA` / `*_EN` 定義にしてもよい。
   - 短文が多い箇所は `trans()`、段落単位の説明は英語配列を使う。

5. 翻訳キーは日本語原文を残す
   - 既存の `trans()` は日本語原文をキーにする設計なので、翻訳キー用の別IDは作らない。
   - ただし同じ日本語が文脈で別訳になる場合は、ゲーム別表示関数で処理する。

## ゲーム別チェックリスト

### 共通

- [ ] `MiniGameRouter` から渡る `languageMode` が全ゲームで利用される。
- [x] `MiniGameProblemChallenge` に `languageMode` を追加する。
- [x] `rewardHint` を呼び出し元で `trans()` するか、`MiniGameProblemChallenge` 内で翻訳する。
- [ ] `miniGameConfig.ts` の `name` / `description` / `typeLabel` を英語表示できる。
- [x] `ENGLISH_DICTIONARY` に共通文言を追加する。
- [ ] 英語モードでミニゲーム選択、開始、終了、戻る、セーブ削除が英語になる。

### 帰宅ダッシュ (`GoHomeDash.tsx`)

- [x] 内部の `languageMode` 初期化を props 優先に変更する。
- [x] アップグレード名・説明を翻訳する。
- [x] クリア、ゲームオーバー、レベルアップ、チュートリアル、ボタン文言を翻訳する。
- [x] 問題チャレンジの報酬ヒント `全問正解で...` を英語化する。

### 校庭サバイバー (`SchoolyardSurvivorScreen.tsx`)

- [x] `WEAPONS` の `name` / `desc` / `evolvedName` / `evolvedDesc` を翻訳する。
- [x] `PASSIVES` の `name` / `desc` を翻訳する。
- [x] レベルアップ選択、シナジー、進化、回復、結果画面を翻訳する。
- [x] 問題チャレンジの報酬ヒント `全問正解でHP15回復` を英語化する。

### 放課後ポーカー (`PokerGameScreen.tsx`)

- [x] 既存の英語チュートリアル以外のUI文言を洗い出す。
- [x] 役名、アイテム、ショップ、戦闘ログ、結果画面を翻訳する。
- [ ] 保存データやスコア計算に使う識別子を翻訳で壊さない。

### 風来の小学生 (`SchoolDungeonRPG.tsx`)

- [ ] アイテム名、装備名、敵名、罠名、ログ、メニューを翻訳する。
- [x] ショップ、合成、階層移動、ゲームオーバー、クリア表示を翻訳する。
- [ ] 保存データ内の名前を表示時翻訳にする。

### 風来の小学生2 (`SchoolDungeonRPG2.tsx`)

- [ ] `SchoolDungeonRPG.tsx` と同じカテゴリで翻訳する。
- [ ] 2専用のカード、階層、イベント、ログ文言を追加確認する。
- [x] 1と共通化できる辞書は `textUtils.ts` 側へ寄せる。

### 校長対決 (`KochoShowdown.tsx`)

- [x] 行動カード、敵行動、状態異常、予約UI、ログを翻訳する。
- [x] 勝敗、再挑戦、チュートリアル、ヘルプ文を翻訳する。
- [ ] 戦略用語は短く、ボタン内で折り返しても読める英語にする。

### 紙飛行機バトル (`PaperPlaneBattle.tsx`)

- [x] 機体、パーツ、パイロット、任務、休暇、格納庫、報酬のUIを翻訳する。
- [x] パーツ効果説明と特殊効果説明を翻訳する。
- [ ] ゲームマニュアル、エネルギーカード説明、結果画面を英語配列または `trans()` で対応する。
- [ ] 文量が多いため、最初に表示関数を作ってデータ定義への直接変更を抑える。

## 翻訳追加候補

まず `src/utils/textUtils.ts` の `ENGLISH_DICTIONARY` に追加する候補。

| 日本語 | 英語案 |
|---|---|
| 帰宅ダッシュ | Home Dash |
| 障害物をよけて帰宅せよ！レベルアップで教科を強化。 | Dodge obstacles and race home. Level up to strengthen your school skills. |
| 校庭サバイバー | Schoolyard Survivor |
| 迫りくる敵の大群から生き残れ！ヴァンサバ風アクション。 | Survive waves of enemies in a survivor-style action game. |
| 放課後ポーカー | After-School Poker |
| 役を作ってスコアを稼げ！アイテムを駆使するローグライク。 | Build hands, score points, and use items in a roguelike poker game. |
| 風来の小学生 | Wandering Student |
| 1000回遊べるランダムダンジョン。GB風ローグライクRPG。 | A replayable random dungeon in a retro roguelike RPG style. |
| 校長対決 | Principal Showdown |
| ターン制戦略バトル。行動を予約して敵を倒せ！ | A turn-based strategy battle. Queue actions and defeat the enemy. |
| 紙飛行機バトル | Paper Plane Battle |
| パーツを組み合わせて機体をビルド。3x3マスの戦略オートバトル。 | Build a plane from parts and fight in a 3x3 strategy auto-battle. |
| 風来の小学生2 | Wandering Student 2 |
| 更なる深淵へ...進化したローグライクRPG。 | Go deeper in an evolved roguelike RPG. |
| あと | Need |
| 問 | questions |
| セーブデータを削除しますか？ | Delete save data? |
| 削除する | Delete |
| キャンセル | Cancel |
| ※ボタン長押しでセーブデータを削除できます | Hold a button to delete save data. |

## 確認手順

1. `npm run build` (今回は未実施)
2. 英語モードでミニゲーム選択画面を開く。
3. 各ミニゲームを1回起動し、初期画面・プレイ中HUD・問題チャレンジ・勝敗画面を確認する。
4. 保存データ削除ダイアログを英語モードで確認する。
5. `rg -n "[ぁ-んァ-ヶ一-龠]"` で対象ファイルを再確認し、残っている日本語がコメント・日本語モード用定義・翻訳キーとして妥当か判定する。

## 完了条件

- 英語モードでミニゲーム選択画面と全ミニゲームの主要UIが英語表示になる。
- 日本語モードの表示が変わらない。
- 保存データ互換性を壊さない。
- `npm run build` が通る。
