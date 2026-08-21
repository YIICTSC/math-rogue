# 放課後スクールTRPG セーブ・移行・復旧仕様

作成日: 2026-08-21
ステータス: 実装前の永続化設計
関連計画:

- [school-trpg-open-world-multi-ending-expansion-plan.md](./school-trpg-open-world-multi-ending-expansion-plan.md)
- [school-trpg-data-schema.md](./school-trpg-data-schema.md)
- [mini-game-mission-quiz-insertion-plan.md](./mini-game-mission-quiz-insertion-plan.md)

## 1. 目的

長編キャンペーンで、移動、イベント、問題、戦闘、報酬、エンディングを中断しても安全に再開できるようにする。画像asset packの状態や言語設定に依存せず、ゲーム進行だけを保存する。

現行の短編TRPGは`useState`で状態を保持しており、ページ更新やアプリ終了で進行が失われる。新実装では、エンジンが変更をまとめて保存し、UIは保存処理を直接呼び出さない。

## 2. 保存キーとスロット

```text
learning_rogue_school_trpg_campaign_v1_<slot>
learning_rogue_school_trpg_autosave_v1_<slot>
learning_rogue_school_trpg_pending_v1_<slot>
```

初期版は3スロットを用意する。

- `slot-1`〜`slot-3`: プレイヤーが選ぶキャンペーン
- `autosave`: 最後に安全に再開できる自動保存
- `pending`: 問題または報酬選択の途中状態

セーブキーは既存の将棋、TCG、ポーカーのキーと共有しない。タイトル画面の「続きから」「新しく始める」「セーブ削除」はTRPGのスロットだけを対象にする。

## 3. セーブエンベロープ

```ts
export type SchoolTrpgSaveEnvelope = {
  schema: 'school-trpg-campaign';
  version: 1;
  saveId: string;
  slotId: 'slot-1' | 'slot-2' | 'slot-3';
  updatedAt: string;
  checksum: string;
  campaign: SchoolTrpgCampaignState;
  runtime?: SchoolTrpgRuntimeSnapshot;
};

export type SchoolTrpgCampaignState = {
  seed: number;
  chapter: number;
  zoneId: string;
  locationId: string;
  time: number;
  party: string[];
  stats: Record<string, number>;
  bonds: Record<string, Record<string, number>>;
  inventory: Record<string, number>;
  knowledgeTags: string[];
  flags: Record<string, boolean | number | string>;
  discoveredEventIds: string[];
  unlockedLocationIds: string[];
  endingIds: string[];
  log: string[];
};

export type SchoolTrpgRuntimeSnapshot = {
  phase: string;
  encounterId?: string;
  combatTurn?: number;
  questionGateId?: string;
  questionIds?: string[];
  questionIndex?: number;
  rewardTableId?: string;
  rewardChoices?: string[];
};
```

セーブに画像URL、DOM、翻訳済み表示文、BGM状態、asset packのローカルパスを保存しない。これらは起動時に現在のレジストリと設定から再構築する。

## 4. 保存タイミング

| タイミング | 保存先 | 目的 |
|---|---|---|
| キャンペーン開始 | campaign + autosave | seed、初期パーティーを確定 |
| 地点移動確定後 | campaign + autosave | 移動コストと現在地を確定 |
| イベント選択を解決した後 | campaign + autosave | 効果、ログ、分岐を保存 |
| 戦闘のターン開始時 | campaign + autosave | 再開可能な安全地点を作る |
| 戦闘終了後 | campaign + autosave | 勝利、敗北、逃走、報酬を保存 |
| 問題開始前 | pending | 問題IDと報酬候補を固定 |
| 問題3問完了後 | campaign + autosave、pending削除 | 問題報酬を1回だけ適用 |
| 報酬選択前 | pending | 候補3枚を固定 |
| 報酬選択後 | campaign + autosave、pending削除 | 選択結果を確定 |
| 章終了・エンディング確定 | campaign + autosave | 次周引き継ぎ情報を保存 |

戦闘中の各アニメーションフレームでは保存しない。行動解決後に1回だけ保存し、連打や二重適用を防ぐ。

## 5. トランザクションと二重適用防止

### 5.1 問題ゲート

1. `openQuestionGate`で問題IDをseedから固定する。
2. `pending`へ`gateId`、問題ID、現在番号、報酬効果を保存する。
3. 回答中は問題IDを再抽選しない。
4. 3問完了時に`pending`の状態を検証する。
5. `rewardApplied`フラグを設定してから、キャンペーンへ効果を適用する。
6. 成功した後に`pending`を削除する。

同じゲートを再度開いた場合は、すでに`rewardApplied`なら報酬を適用せず、完了済み画面へ遷移する。

### 5.2 TCG報酬

配置型TCGは、勝利したバトルの報酬候補3枚と問題ゲートを同じ`pending`状態で管理する。問題完了前に報酬カードをデッキへ追加しない。アプリ終了後も、問題完了→報酬選択→次バトルの順番を維持する。

### 5.3 戦闘

戦闘行動には`actionId`と`turn`を持たせ、同じ`actionId`を二度解決しない。保存復帰時に、未確定の演出だけを再生せず、確定済みの数値・ログから表示を再構築する。

## 6. 書き込み方式

`localStorage`は書き込み途中の破損を完全には防げないため、次の順番で更新する。

```text
serialize(state)
  → validate(state)
  → checksumを付与
  → pending write keyへ保存
  → 読み戻しとchecksum検証
  → 本キーへ保存
  → pending write keyを削除
```

読み込み時は、本キーとpending write keyのうち、checksumが正しく更新日時が新しい方を採用する。どちらも壊れている場合は、最後の正常なautosaveへ戻す。

## 7. バージョン移行

### 7.1 バージョン番号

| バージョン | 内容 | 移行 |
|---:|---|---|
| `0` | 現行の5固定シーン状態、保存なし | 初回起動時は新規キャンペーンとして開始 |
| `1` | マップ、イベント、仲間、アイテム、問題ゲート | 現行版 |
| `2`以降 | 将来のスキーマ変更 | `migrateV1ToV2`を追加 |

現行の短編はページ更新時に保存されないため、存在しないデータを推測して移行しない。将来、短編の結果を引き継ぐ場合だけ、次の明示的なフラグへ変換する。

```text
短編の勝利 → knowledge.school-mystery-intro
手がかり3以上 → flag.prologue-clue-complete = true
```

### 7.2 移行の原則

- 旧データを上書きする前にバックアップキーへコピーする。
- 移行後に全データ検証を実行する。
- 移行できないフィールドは初期値に戻し、プレイヤーへ説明する。
- 移行失敗でタイトル画面が止まらない。
- 移行前後のバージョンと結果をデバッグログへ残す。

## 8. 破損・欠落・競合への対応

| 状況 | 表示 | 対応 |
|---|---|---|
| JSONが壊れている | セーブを読み込めない | autosaveまたは新規開始 |
| checksum不一致 | セーブが破損している | 新しい正常スナップショットを採用 |
| 参照先イベントが削除された | コンテンツ更新を検出 | 最後の安全地点へ戻す |
| asset pack未導入 | 素材を準備中 | テキストとフォールバック画像で継続 |
| 2タブから同時更新 | 新しいセーブがある | 更新日時が新しい方を採用し再読込を促す |
| 容量超過 | 保存できない | ログの古いサムネイルを削除し再試行 |

エラー表示は英語・ひらがなを含む専用辞書で用意し、保存データの固有名詞を翻訳処理しない。

## 9. セーブ削除とプライバシー

- セーブ削除は対象スロット、autosave、pending、移行バックアップだけを削除する。
- 本編の学習履歴、カード図鑑、将棋の進行、設定は削除しない。
- 削除前にスロット名、章、最終保存時刻を確認表示する。
- セーブには氏名、メールアドレス、端末IDなどを保存しない。
- エラー診断情報を送る場合は、seedやスロットIDを匿名化する。

## 10. 実装順序

1. `schoolTrpgSave.ts`に型、キー、checksum、読み書きを実装する。
2. `schoolTrpgEngine.ts`の状態遷移を保存アダプタ経由にする。
3. 問題ゲートとTCG報酬のpending処理を実装する。
4. バージョン1の検証と、破損時の復旧画面を実装する。
5. iPhone Safari、Android WebView、通常ブラウザで再読み込み・終了・復帰を確認する。

## 11. 完了条件

- 地点移動、イベント、戦闘、問題、報酬、エンディングを再読み込み後も続行できる。
- 同じ問題ゲート、報酬候補、戦闘行動が二重に適用されない。
- 壊れたセーブがあっても、autosaveまたは新規開始へ安全に戻れる。
- 現行ミニゲームのセーブや本編データを削除・上書きしない。
- 言語、画面向き、asset packの有無を変えても進行状態が壊れない。
