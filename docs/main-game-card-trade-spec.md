# 学習ローグ本編カードトレード機能仕様

## 1. 目的

学習ローグ本編で永続的に所有しているカードを、プレイヤー同士がルームコードで接続し、P2P通信で安全に交換できる機能を追加する。

本仕様の対象は **Placement TCG ではなく学習ローグ本編のカード** とする。

既存実装では `p2pService` が PeerJS を利用したP2P通信を持ち、6桁ルームコード、接続監視、Heartbeat、送受信イベントをすでに備えている。そのため、トレード専用の通信基盤をゼロから作らず、既存 `p2pService` を拡張する方針を基本とする。

また本編では、永続カードに関して次の2系統が存在する。

- `storageService.getRewardCardAlbum()` : 実体の `Card[]` を保存する「ご褒美カード帳」
- `storageService.getUnlockedCards()` : カード名の `string[]` を保存するアンロック情報

トレードは「アンロック状態」ではなく「所有しているカード個体」を移動させる必要があるため、初期実装では **永続所有カードを個体管理する仕組みを新設し、ご褒美カード帳のカードをその第一対象とする**。

---

## 2. 基本方針

### 2.1 採用方式

初期版は次の構成とする。

1. プレイヤーAがトレードルームを作成する。
2. 6桁のトレードコードを発行する。
3. プレイヤーBがコードを入力する。
4. PeerJS / WebRTC DataChannel でP2P接続する。
5. 双方が交換カードを提示する。
6. 双方が READY すると提示内容をロックする。
7. 双方が FINAL TRADE を承認する。
8. 交換内容をローカル保存へ反映する。
9. 取引履歴と取引IDを双方へ保存する。
10. 交換完了演出を表示する。

### 2.2 P2Pの位置づけ

P2Pで以下を行う。

- ルーム接続
- プレイヤー情報交換
- 提示カード同期
- READY状態同期
- 最終確認同期
- トランザクション状態同期
- トレード結果同期

ただし、完全P2Pかつローカルセーブのみでは、意図的なセーブ巻き戻しやセーブコピーによるカード複製を完全には防止できない。

そのため、初期版は「友達同士のカジュアルトレード」を前提とし、将来的に不正耐性を強化する場合は **P2P通信 + 中央所有権台帳** に移行できる設計にする。

---

## 3. 対象カード

### 3.1 初期版でトレード可能にするカード

トレード対象は「永続所有カード」とする。

初期対応では、現行の「ご褒美カード帳」に保存されるカードを中心にする。

- 課題達成でもらったカード
- ランキング報酬カード
- その他 `rewardCard: true` の永続カード
- 今後追加する永続収集カード

### 3.2 初期版ではトレード対象外とするもの

- 冒険中の一時デッキにだけ存在するカード
- 山札・手札・捨て札など戦闘中のカード
- `getUnlockedCards()` にだけ記録されているアンロック権
- 呪いなど一時的なラン用カード
- チュートリアル進行に必須のカード
- ストーリー進行フラグを兼ねるカード
- トレード中としてロックされているカード

### 3.3 オリジナルカード

`rewardSource: 'ORIGINAL_BUILDER'` のカードは、初期版では原則トレード不可とする。

理由は以下。

- `customImageData` のデータサイズが大きくなりやすい
- ユーザー生成画像を相手端末へ送信することになる
- 不正な巨大データや壊れたカード定義の検証が必要
- エフェクト定義の互換性チェックが必要

将来対応する場合は、画像サイズ上限、カード効果ホワイトリスト、スキーマ検証を導入したうえで解禁する。

### 3.4 カードごとの交換可否

カード個体に次の属性を持たせる。

```ts
type TradableState = 'TRADABLE' | 'LOCKED' | 'NON_TRADABLE';
```

カードごとの交換可否は、カード種類ではなく所有個体側のメタデータで管理する。

---

## 4. 永続所有カードのデータ構造

### 4.1 新しい所有カードモデル

既存 `Card.id` はラン中や表示上の識別にも使用されているため、トレード所有権用のIDを別に持たせる。

```ts
interface OwnedMainGameCard {
  instanceId: string;
  card: Card;
  acquiredAt: string;
  acquiredFrom:
    | 'ASSIGNMENT'
    | 'RANKING'
    | 'ORIGINAL_BUILDER'
    | 'EVENT'
    | 'TRADE'
    | 'OTHER';
  tradable: boolean;
  lockedTradeId?: string;
  receivedFromTradeId?: string;
}
```

### 4.2 `instanceId`

`instanceId` はカード個体を一意に識別するIDとし、原則 `crypto.randomUUID()` を使う。

同じカード名・同じ効果のカードを複数持っていても、個体としては別管理する。

例:

```text
炎の一撃 / instanceId: 8d8f...
炎の一撃 / instanceId: 72a1...
炎の一撃 / instanceId: b904...
```

### 4.3 現行データからの移行

初回起動時に `getRewardCardAlbum()` の `Card[]` を読み込み、所有カードストレージがまだ存在しない場合のみ `OwnedMainGameCard[]` へ移行する。

既存データを破壊しないため、移行完了フラグを保存する。

### 4.4 アンロック情報との分離

`getUnlockedCards()` は「図鑑・利用権として解放済みか」を表す情報として維持する。

トレードでカードを相手へ渡しても、原則としてアンロック実績までは失わせない。

つまり以下を分離する。

```text
アンロック済み = 一度入手・解放したことがある
所有中         = 現在カード帳にカード個体を持っている
```

この分離により、交換した結果、図鑑が未発見状態へ戻る問題を防ぐ。

---

## 5. 交換ルール

### 5.1 初期版の基本ルール

- 2人専用
- 1回の交換で双方1〜3枚まで
- 初期版では双方の提示枚数を同数にする
- 同じカードを複数提示可能
- READY後はカード変更不可
- どちらかが提示内容を変更すると双方のREADYを解除
- FINAL TRADE後は通常キャンセル不可
- 通信切断時は、確定前なら自動キャンセル
- トレード中のカードは他のトレードで使用不可

初期版で同数交換にする理由は、児童利用を考慮して一方的な大量譲渡や誤操作を減らすためである。

将来的に「2枚対1枚」などの不等価交換を解禁できるよう、通信データ上は枚数が異なっても表現可能な設計にする。

### 5.2 トレード開始可能な場所

トレードは以下から開始できるようにする。

- タイトル画面
- ご褒美カード帳

冒険進行中、戦闘中、イベント中、COOP中、RACE中は開始不可とする。

これにより、現在のランデッキと永続所有カードの整合性問題を避ける。

### 5.3 交換可能判定

カードは以下をすべて満たす場合のみ提示可能とする。

```text
owned === true
tradable === true
lockedTradeId === undefined
instanceId が重複していない
Cardデータが現在のスキーマ検証を通過する
```

---

## 6. P2P方式

### 6.1 既存 `p2pService` を再利用

現行 `p2pService` は PeerJS を利用しており、以下をすでに持つ。

- ホスト作成
- ゲスト接続
- 6桁コード
- 複数接続管理
- `send` / `sendTo`
- Heartbeat
- RTT / 接続劣化検出
- `onConnect`
- `onData`
- `onClose`
- `onError`

トレード機能ではこれを再利用する。

### 6.2 トレード専用Peer ID

現在の `lr-battle-${code}` と衝突しないようにトレード専用名前空間を使う。

```text
lr-trade-123456
```

実装案:

```ts
initHost(roomCode?, namespace = 'battle')
connect(roomCode, namespace = 'battle')
```

またはトレード専用メソッドを用意する。

```ts
initTradeHost()
connectTrade(code)
```

### 6.3 ルーム人数

トレードルームは最大2名とする。

3人目以降が接続した場合は拒否イベントを返す。

### 6.4 送信する情報

相手に全カード帳を送らない。

送信するのは以下のみ。

- プレイヤー表示名
- 一時的なPeer ID
- プロトコルバージョン
- 提示中のカード
- READY状態
- トランザクション状態
- 完了レシート

相手の全所持カード一覧は公開しない。

---

## 7. P2Pイベント仕様

`P2PEvent` に以下を追加する。

```ts
type TradeP2PEvent =
  | {
      type: 'TRADE_HELLO';
      protocolVersion: number;
      playerName: string;
      sessionNonce: string;
    }
  | {
      type: 'TRADE_OFFER_UPDATE';
      tradeId: string;
      revision: number;
      cards: TradeCardPayload[];
      offerHash: string;
    }
  | {
      type: 'TRADE_READY';
      tradeId: string;
      revision: number;
      offerHash: string;
    }
  | {
      type: 'TRADE_READY_RESET';
      tradeId: string;
      revision: number;
    }
  | {
      type: 'TRADE_LOCK';
      tradeId: string;
      revision: number;
      localOfferHash: string;
      remoteOfferHash: string;
    }
  | {
      type: 'TRADE_PREPARE';
      tradeId: string;
      revision: number;
      transactionHash: string;
    }
  | {
      type: 'TRADE_PREPARED';
      tradeId: string;
      transactionHash: string;
    }
  | {
      type: 'TRADE_COMMIT';
      tradeId: string;
      transactionHash: string;
    }
  | {
      type: 'TRADE_COMMIT_ACK';
      tradeId: string;
      transactionHash: string;
      receiptHash: string;
    }
  | {
      type: 'TRADE_CANCEL';
      tradeId: string;
      reason: string;
    };
```

### 7.1 `revision`

提示内容を変更するたびに `revision` を1増やす。

古いrevisionのメッセージは破棄する。

これにより通信遅延で古い提示内容が後から届いて上書きされることを防ぐ。

### 7.2 `offerHash`

提示内容を決まった順番でシリアライズし、SHA-256を計算する。

READY後にカード内容が書き換えられていないことを双方で確認する。

---

## 8. トレード状態遷移

```text
IDLE
 ↓
CONNECTING
 ↓
SELECTING
 ↓
LOCAL_READY / REMOTE_READY
 ↓
BOTH_READY
 ↓
LOCKED
 ↓
PREPARING
 ↓
COMMITTING
 ↓
COMPLETED
```

途中キャンセル時:

```text
SELECTING / READY / LOCKED
 ↓
CANCELLED
```

### 8.1 状態例

```ts
type TradePhase =
  | 'IDLE'
  | 'CONNECTING'
  | 'SELECTING'
  | 'LOCKED'
  | 'PREPARING'
  | 'COMMITTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RECOVERY_REQUIRED';
```

---

## 9. 交換確定プロトコル

完全P2PではDBトランザクションを共有できないため、事故を減らす目的で簡易2フェーズコミットを使う。

### 9.1 Phase A: OFFER

1. 双方がカードを選択。
2. `TRADE_OFFER_UPDATE` を交換。
3. どちらかが変更するたび双方READY解除。

### 9.2 Phase B: READY / LOCK

1. 双方がREADY。
2. offerHashとrevisionが一致することを確認。
3. 双方の提示カードを `lockedTradeId` でロック。
4. 交換内容を画面上で固定。

### 9.3 Phase C: PREPARE

各端末が以下を確認する。

- 提示カードをまだ所有している
- `instanceId` が重複していない
- `lockedTradeId` が現在の `tradeId` と一致
- 受信カードがスキーマ検証を通る
- transactionHashが一致する

確認後、`TRADE_PREPARED` を送信する。

### 9.4 Phase D: COMMIT

双方PREPAREDになったらホストが `TRADE_COMMIT` を送る。

受信側は同じ `tradeId + transactionHash` を二度適用しない。

ローカル保存では以下を1回の更新処理として構築する。

```text
自分の提示カードを削除
+ 相手から受け取るカードを追加
+ トレード履歴を追加
+ pendingTrade を完了状態へ変更
```

### 9.5 ACK

保存後に `TRADE_COMMIT_ACK` を送る。

双方ACKを確認した時点で完了演出へ進む。

---

## 10. セーブデータ仕様

### 10.1 所有カードストレージ

```ts
interface MainCardInventorySave {
  version: 1;
  cards: OwnedMainGameCard[];
  pendingTrade?: PendingTradeRecord;
  recentTrades: TradeReceipt[];
}
```

所有カード、進行中トレード、直近のトレード履歴は、可能なら同一のルートオブジェクトとして1つの `localStorage` キーに保存する。

理由は、複数キーを別々に更新した途中で終了して状態が分裂するのを減らすため。

### 10.2 Pending Trade

```ts
interface PendingTradeRecord {
  tradeId: string;
  transactionHash: string;
  phase: 'LOCKED' | 'PREPARED' | 'COMMITTED';
  localCardIds: string[];
  remoteCards: OwnedMainGameCard[];
  peerId: string;
  updatedAt: number;
}
```

### 10.3 取引履歴

```ts
interface TradeReceipt {
  tradeId: string;
  transactionHash: string;
  sentCardIds: string[];
  receivedCardIds: string[];
  completedAt: number;
  peerDisplayName?: string;
}
```

直近100件程度を保持する。

### 10.4 冪等性

保存済み `tradeId` は再適用しない。

同じCOMMITが再送されても、カードがもう一度追加されないようにする。

---

## 11. 切断・復旧仕様

### 11.1 SELECTING中の切断

- 即キャンセル
- カードロックなし
- 再接続不要

### 11.2 READY後・COMMIT前の切断

- トレードを一時保留
- `lockedTradeId` を維持
- 対象カードは別トレードへ出せない
- 再接続時に `tradeId` とtransactionHashを照合して再開

### 11.3 COMMIT受信後の切断

- ローカルでCOMMIT済みなら絶対に再適用しない
- 完了レシートを保持
- 相手が再接続したらACKを再送

### 11.4 自動解除

COMMIT前の `LOCKED` 状態を単純なタイムアウトだけで自動解除すると、相手だけCOMMIT済みだった場合に不整合が生じる可能性がある。

そのため、`PREPARED` 以降は安易に自動キャンセルせず `RECOVERY_REQUIRED` として再接続確認を優先する。

---

## 12. 不正対策

### 12.1 P2Pだけで実施できる対策

- `instanceId` を全カードに付与
- tradeIdをUUID化
- sessionNonceを毎回生成
- revisionで古いイベントを拒否
- offerHashで提示内容改ざん検知
- transactionHashで最終内容固定
- READY後の変更禁止
- 変更時READY自動解除
- トレード中カードをロック
- 同じtradeIdを再適用しない
- 同じinstanceIdを同一インベントリへ二重登録しない
- 受信Cardをスキーマ検証
- 不明なeffect / typeを拒否
- 受信件数・文字列長・画像サイズに上限
- 相手の全カード帳を送信しない
- HTMLを直接描画しない
- 自由テキストチャットを設けない

### 12.2 P2Pだけでは完全に防げない不正

以下はローカルセーブだけでは完全防止できない。

- トレード前のセーブデータをバックアップ
- 正常交換後に古いセーブへ戻す
- ローカルストレージを直接改変
- 同じカード個体を別セーブから複数人へ二重譲渡
- 改造クライアントによる所有情報偽装

これは実装ミスではなく、中央の所有権台帳がないP2P所有権交換の構造的な制約である。

### 12.3 将来の強固な不正対策

カード価値を本格的に守る必要が出た場合は、通信UIはP2Pのまま、最終確定のみサーバーを使う。

```text
P2Pでカード選択
 ↓
双方READY
 ↓
FINAL TRADE
 ↓
サーバーへtradeIdを送信
 ↓
サーバーが所有権を検証
 ↓
A→B / B→A を1トランザクションで更新
 ↓
双方へ確定結果
```

この方式ならカード複製・二重譲渡を大幅に防げる。

---

## 13. 画面遷移

### 13.1 エントリーポイント

```text
タイトル
 ├─ ご褒美カード帳
 │   └─ カードをトレード
 │
 └─ カードトレード
```

### 13.2 トレード開始画面

```text
┌────────────────────────────┐
│       CARD TRADE           │
│                            │
│ [ トレードルームを作る ]   │
│                            │
│ [ 6桁コードで参加する ]     │
│                            │
│ [ 戻る ]                   │
└────────────────────────────┘
```

### 13.3 ホスト待機画面

```text
┌────────────────────────────┐
│ トレードコード             │
│                            │
│       381 942              │
│                            │
│ 相手の参加を待っています…   │
│                            │
│ [ キャンセル ]             │
└────────────────────────────┘
```

将来的にQRコードも同時表示する。

### 13.4 メイントレード画面

```text
┌──────────────────────────────────────────┐
│ CARD TRADE                 接続: 良好    │
├──────────────────┬───────────────────────┤
│ あなた            │ 相手                  │
│                   │                       │
│ [カード] [カード] │ [カード] [カード]     │
│                   │                       │
│ READY ✓           │ READY ✓               │
├──────────────────┴───────────────────────┤
│                                          │
│ あなたのカード帳                         │
│ [カード][カード][カード][カード]...      │
│                                          │
├──────────────────────────────────────────┤
│ [交換をやめる]          [最終確認へ]      │
└──────────────────────────────────────────┘
```

### 13.5 最終確認

カードを大きく並べ、以下を必ず表示する。

```text
あなたが渡すカード
  A / B / C

受け取るカード
  X / Y / Z

この交換は確定後に元へ戻せません。

[ 戻る ]   [ FINAL TRADE ]
```

双方がFINAL TRADEを押したら確定処理へ進む。

### 13.6 完了演出

1. 双方のカードを画面中央へ移動
2. カード同士が光る
3. 交換先方向へ飛んでいく
4. 受け取ったカードを1枚ずつ表示
5. RARE / LEGENDARY は追加エフェクト
6. `TRADE COMPLETE!` を表示

学習ローグ本編のカードレアリティには `RARE` / `LEGENDARY` が存在するため、レアリティに応じて演出を変える。

---

## 14. 操作ミス・児童利用への対策

- 自由テキストチャットは実装しない
- 必要なら定型スタンプだけにする
- カード変更でREADYを必ず解除
- READY後にカード欄を暗転・ロック
- FINAL TRADE前に大きな最終確認を入れる
- レアカードを出す場合は追加確認を表示
- LEGENDARYを出す場合は長押しまたは2回確認を検討
- 枚数が違う交換は初期版では禁止
- 相手の本名やメールアドレスは表示しない
- 表示名はゲーム内名のみ
- ルームコードは一時的なものとする

---

## 15. 接続エラー時の表示

既存Heartbeatを利用して状態を表示する。

```text
● 接続良好
● 通信が不安定
● 再接続中
● 相手との接続が切れました
```

学校や家庭のネットワークによってはWebRTCが遮断される場合がある。

初期版は接続失敗を明確に表示し、将来的に必要ならTURNリレーをフォールバックとして導入する。

---

## 16. 実装時の主要モジュール案

```text
src/components/MainCardTradeScreen.tsx
src/components/MainCardTradeSetupScreen.tsx
src/services/mainCardTradeService.ts
src/services/p2pService.ts
src/services/storageService.ts
src/types.ts
```

### 16.1 `mainCardTradeService.ts`

責務:

- トレード状態機械
- offer revision管理
- hash生成
- READY管理
- カードロック
- PREPARE / COMMIT
- 保存処理
- 復旧処理
- 入力データ検証

UIに取引ロジックを直接書き込まない。

---

## 17. 実装フェーズ

### Phase 1: 所有カード基盤

- `OwnedMainGameCard` 導入
- `instanceId` 付与
- ご褒美カード帳から移行
- tradable判定
- 所有カード保存API

### Phase 2: ローカル疑似トレード

- 1画面上でA/Bを模擬
- READY
- FINAL TRADE
- 交換処理
- 交換演出
- 履歴保存

通信を入れる前に交換ロジックを完成させる。

### Phase 3: P2P接続

- `lr-trade-${code}`
- トレード専用イベント
- offer同期
- READY同期
- 接続切断対応

### Phase 4: 2フェーズ確定

- LOCK
- PREPARE
- COMMIT
- ACK
- 冪等性
- pendingTrade復旧

### Phase 5: UX強化

- QRコード
- レアリティ別演出
- 交換履歴画面
- 定型スタンプ
- コントローラー操作
- モバイル最適化

### Phase 6: 必要に応じて中央所有権台帳

- アカウント識別
- カード所有権DB
- トランザクションAPI
- 二重譲渡防止
- セーブ巻き戻し対策

---

## 18. 初期版の完成条件

以下をすべて満たした時点で初期版完成とする。

- 本編カード帳からトレード画面へ入れる
- 6桁コードで2人接続できる
- 双方最大3枚を提示できる
- 提示内容がリアルタイム同期される
- カード変更でREADYが解除される
- 双方READYまで最終確定できない
- 双方FINAL TRADEまで所有権を変更しない
- 同じtradeIdを二重適用しない
- 交換後に双方のカード帳が正しく更新される
- 切断時にカードが消失しない
- COMMIT済み取引を再接続時に再適用しない
- 交換履歴が残る
- RARE / LEGENDARYを含む交換で演出が強化される
- Placement TCGのカードデータには影響しない

---

## 19. 推奨する最終方針

学習ローグ本編では、次の構成を推奨する。

```text
既存PeerJS P2P
      ＋
本編専用OwnedMainGameCard
      ＋
tradeId / instanceId / revision / hash
      ＋
READY → LOCK → PREPARE → COMMIT → ACK
```

初期版ではカジュアルなP2P交換として成立させる。

将来カードに希少価値やランキング価値を強く持たせる場合のみ、最終確定部分を中央サーバー管理へ差し替える。

これにより、現在の学習ローグのP2P資産を最大限再利用しつつ、本編カードとPlacement TCGを完全に分離したトレード機能にできる。
