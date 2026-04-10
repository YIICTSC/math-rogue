# 協力モード 画面別挙動整理（ホスト/参加者）

最終確認日: 2026-04-08（UTC）
対象コード: `src/App.tsx`, `src/components/CoopSetupScreen.tsx`, `src/types.ts`

## 1. 画面一覧（協力モードで実際に関与する主要画面）

- `COOP_SETUP`
- `MODE_SELECTION`
- `CHARACTER_SELECTION`
- `RELIC_SELECTION`
- `MAP`
- `BATTLE`
- `MATH_CHALLENGE` / `KANJI_CHALLENGE` / `ENGLISH_CHALLENGE` / `GENERAL_CHALLENGE`
- `EVENT`
- `REST`
- `SHOP`
- `REWARD`
- `TREASURE`
- `GAME_OVER` / `ENDING` / `FLOOR_RESULT`

> 補足: 協力モードでは上記以外の画面も存在しますが、同期・進行制御の中心はこの範囲です。

## 2. 画面別の挙動（ホスト側 / 参加者側）

### COOP_SETUP（協力ルーム作成・参加）
- ホスト:
  - ルーム作成後、自分を参加者リストに登録。
  - `COOP_JOIN` を受け取ると参加者に追加し、全員へ `COOP_PARTICIPANTS` を配信。
  - 人数上限（4人）超過時は参加を反映せず既存リストを返す。
  - `COOP_START` を送信して開始。
- 参加者:
  - 6桁コードで接続し、接続完了後に `COOP_JOIN` を送信。
  - `COOP_PARTICIPANTS` で一覧更新。
  - `COOP_START` を受信したらゲーム開始。

### MODE_SELECTION
- ホスト:
  - モード選択可。
  - 選択内容を `COOP_MODE_SET` で参加者へ通知。
- 参加者:
  - モード選択操作は無効（return）。
  - ホストからの `COOP_MODE_SET` 受信で画面遷移。

### CHARACTER_SELECTION
- ホスト:
  - 自分のキャラ確定をローカル反映。
  - 参加者の `COOP_CHARACTER_SELECT` を受信し、参加者情報更新＋再配信。
- 参加者:
  - 自分のキャラ確定時、`COOP_CHARACTER_SELECT` を送信。

### RELIC_SELECTION
- ホスト:
  - 通常進行。状態同期配信元。
- 参加者:
  - ホストの `COOP_STATE_SYNC` で状態を追従。
  - 初回マップ同期待ち (`coopAwaitingMapSync`) を解除する分岐あり。

### MAP
- ホスト:
  - 決定役 (`decisionOwnerIndex`) のみが進行ノードを確定可能。
  - 参加者からの `COOP_NODE_SELECT` は妥当経路なら採用。
- 参加者:
  - ノード選択時はローカル確定せず、`COOP_NODE_SELECT` を送信。
  - 採否はホスト側判定。

### BATTLE
- ホスト:
  - 行動キュー・ターン進行・敵行動を主導。
  - 参加者からの戦闘イベント（カード・ポーション・ターン開始・終了など）を受理し反映。
  - `COOP_BATTLE_SYNC` / `COOP_BATTLE_FINISH` を配信。
- 参加者:
  - 自ターン以外は `coopCanAct=false` で操作不可。
  - 行動はイベント送信ベースでホスト反映待ち。
  - 支援カード使用は `COOP_SUPPORT_USE` 送信。

### 各種クイズ画面（MATH/KANJI/ENGLISH/GENERAL）
- ホスト:
  - 参加者の `COOP_QUIZ_RESULT` を受けて参加者状態更新。
- 参加者:
  - 完了後に正答数を送信。

### EVENT
- ホスト:
  - `COOP_EVENT_OPTION` を受理し、対象プレイヤー状態を計算。
  - 参加者には `COOP_EVENT_RESULT` を返信。
- 参加者:
  - 選択送信し、結果を受信して自分の状態へ適用。

### REST
- ホスト:
  - 全員 `restResolved=true` で次へ進行。
- 参加者:
  - 休憩/強化時に `COOP_REST_ACTION` を送信。
  - 離脱時 `restResolved` を送信。

### SHOP
- ホスト:
  - 参加者の `COOP_SHOP_ACTION` を受け、売り切れ反映（カード/遺物/ポーションを在庫から除外）。
  - 全員 `shopResolved=true` で次へ進行。
- 参加者:
  - 購入・除去操作は要求送信。
  - 離脱時 `shopResolved` を送信。

### REWARD
- ホスト:
  - 参加者ごとの報酬セットを管理。
  - `COOP_REWARD_SELECT` を処理して個別付与（通常報酬 or 支援カード）。
  - 全員 `rewardResolved=true` かつ報酬空で次へ進行。
- 参加者:
  - `COOP_REWARD_SYNC` 受信まで待機するケースあり。
  - 選択時は `COOP_REWARD_SELECT` を送信。
  - 付与結果は `COOP_REWARD_GRANT` / `COOP_SUPPORT_GRANT` で受信。

### TREASURE
- ホスト:
  - プール請求 `COOP_TREASURE_CLAIM` を処理。
  - 全員 `treasureResolved=true` で次へ進行。
- 参加者:
  - プール請求送信。
  - 付与は `COOP_TREASURE_GRANT` で受信。

## 3. 共通UI/進行制御

- 画面右上に決定役HUD（`COOP_DECISION_HUD_SCREEN_SET` 対象）
- 画面左上にパーティHUD（解決状態: 報酬/休憩/買い物/イベント/宝箱/クイズ）
- 決定役ローテーションは `decisionOwnerIndex` を進める設計
- 参加者は基本的にホスト配信 (`COOP_STATE_SYNC`) へ追従

## 4. 不備・要確認ポイントへの対応方針（結論）

1. `COOP_REST_ACTION`（ホスト側 no-op）
   - **方針**: 仕様を「REST は各プレイヤーのローカル処理、同期対象は `restResolved` のみ」に明文化する。
   - **実装対応**: no-op 分岐にコメントを追加し、将来拡張時（他者に見える効果を入れる場合）の TODO を残す。
   - **理由**: 現状要件では結果同期だけで十分で、過剰同期を避けられるため。

2. 参加者の MAP 選択UX（押せるが即確定しない）
   - **方針**: 挙動は維持しつつ、UIで「申請中」を明示する。
   - **実装対応**: 参加者がノード選択後に短時間の pending 表示（例: 「ホスト承認待ち...」）を出す。
   - **理由**: 権限モデル（ホスト確定）を崩さず、誤操作感だけを下げられるため。

3. REWARD/REST/SHOP で `interactionDisabled=false` 固定
   - **方針**: **この3画面は全員同時操作を正仕様とする**（決定役制は MAP/EVENT 等に限定）。
   - **実装対応**: ドキュメントとUI文言に「各自で完了→全員完了で進行」を明記する。
   - **理由**: 待機時間を減らし、協力モードのテンポを維持できるため。

## 5. 優先度つき実施計画（進捗）

- **P1（完了 / 2026-04-10 UTC確認）**
  1) MAP の申請中UI追加（「ホスト承認待ち...」表示）
  2) REST no-op の意図コメント追加
- **P2（完了 / 2026-04-10 UTC確認）**
  3) 画面ごとの権限ルールをヘルプへ追記（決定役: MAP、同時操作: EVENT/REST/SHOP/REWARD）
  4) HUD対象画面の整合調整（パーティHUDにTREASURE追加、決定役HUDをMAP限定）

## 6. 監査結論（更新）

- 現状は「動作不備」というより **仕様の見え方不足** が中心。
- よって優先は、ロジック大変更ではなく「方針明文化 + 最小限UI補強」。
- 上記P1/P2を実施済み。現時点では、重大な仕様ギャップは解消済み。
