# 協力モード戦闘フローと実処理

この文書は、協力モードの戦闘がどの状態とP2Pイベントで進むかを、現行実装に沿って整理したものです。主な実装箇所は `src/App.tsx` と `src/services/p2pService.ts` です。

## 前提

- 協力モードの戦闘処理はホスト権威です。
- ゲストはカード使用、ポーション使用、ターン開始、ターン終了などの意思決定をP2Pイベントとしてホストへ送ります。
- ホストは受信イベントを検証してローカルの戦闘処理を実行し、`COOP_BATTLE_SYNC` で全員へ同期します。
- 各プレイヤーの戦闘中状態は `CoopBattleState.players[]` に保持されます。
- 画面表示上の `gameState.player` は自分自身のプレイヤー状態で、協力戦闘全体の正は `gameState.coopBattleState` です。

## 中心となる状態

### `CoopBattleState`

`gameState.coopBattleState` に入る戦闘同期用の状態です。

- `battleKey`: 戦闘単位のID。戦闘中は固定。
- `battleMode`: `TURN_BASED` または `REALTIME`。
- `players`: 各参加者の `peerId`, `name`, `player`, `selectedEnemyId`, `isDown`。
- `turnQueue`: 行動順キュー。
- `turnCursor`: 現在のキュー位置。
- `enemyTurnCursor`: 敵行動フェーズの進行カウンタ。
- `roundEndedPeerIds`: リアルタイムモードで「ターン終了」を押したプレイヤーID一覧。

### `coopSession`

協力セッション全体の参加者、ホスト判定、戦闘モード、意思決定者などを持ちます。戦闘中の細かいカードゾーンは `coopBattleState.players[].player` 側が中心です。

## 戦闘開始時の初期化

ホストのみが `gameState.screen === BATTLE` に入った時、`CoopBattleState` を作成します。

1. `battleKey` を作成または既存値を維持する。
2. 参加者からプレイヤースロットを作る。
3. 戦闘モードに応じて `turnQueue` を作る。
4. 各参加者の `Player` を準備する。
5. `setCoopBattleState(nextBattleState)` でローカル反映する。
6. `broadcastCoopBattleState(nextBattleState)` でゲストへ `COOP_BATTLE_SYNC` を送る。

ターンキューは次の形です。

- ターンベース: `参加者をランダム順に並べる -> 敵`
- リアルタイム: `全員 -> 敵`

## 同期の基本形

### ホストからゲスト

ホストは `broadcastCoopBattleState()` で `COOP_BATTLE_SYNC` を送ります。

含まれる主な同期内容:

- `battleState`
- `activeEffects`
- `enemies`
- `selectedEnemyId`
- `combatLog`
- `turnLog`
- `actingEnemyId`
- `finisherCutinCard`

ゲストは `COOP_BATTLE_SYNC` を受けると、自分の `peerId` に対応する `players[]` の `player` を `gameState.player` に反映します。ただし、敵行動中や一部の同一戦闘同期では、手札・山札・捨て札をローカル側から保持する処理があります。

### ゲストからホスト

ゲストは直接戦闘状態を確定せず、次のイベントをホストへ送ります。

- `COOP_BATTLE_SELECT_ENEMY`
- `COOP_BATTLE_PLAY_CARD`
- `COOP_BATTLE_USE_POTION`
- `COOP_BATTLE_TURN_START`
- `COOP_BATTLE_SELECTION_STATE`
- `COOP_BATTLE_MODAL_RESOLVE`
- `COOP_BATTLE_CODEX_SELECT`
- `COOP_END_TURN`

カード使用やポーション使用は `queueCoopBattleEvent()` を経由し、`actionId`, `battleKey`, `turnCursor`, `enemyTurnCursor` を付けて送信されます。

## ターン開始処理

ターン開始の実処理は `startPlayerTurn(coopActorPeerId?)` です。

### ゲスト側

ゲストが自分のターン開始を必要とする場合、直接手札補充はせず `COOP_BATTLE_TURN_START` をホストへ送ります。

ホストからの `COOP_BATTLE_SYNC` で、補充済みの状態が返ってきます。

### ホスト側

ホストは次のどちらかとして `startPlayerTurn()` を実行します。

- ホスト自身のターン: `startPlayerTurn()`
- ゲストのターン: `startPlayerTurn(peerId)`

`coopActorPeerId` がある場合、`coopBattleState.players[]` 内の該当プレイヤーを取り出して処理します。処理後は `updateCoopBattleStateForPeer()` でそのプレイヤー状態だけ更新します。

### 手札補充の実処理

`startPlayerTurn()` 内の補充処理は通常戦闘と同じロジックです。

1. ターン開始時パワーやレリックを処理する。
2. エナジーを `maxEnergy + nextTurnEnergy + ボーナス` にする。
3. 現在の手札を捨て札へ移す。
4. `HAND_SIZE + 追加ドロー + nextTurnDraw` 枚を引く。
5. 山札が空なら捨て札をシャッフルして山札に戻す。
6. `codexBuffer`, `CREATIVE_AI`, `INFINITE_BLADES` などの追加生成を処理する。
7. `hand`, `drawPile`, `discardPile`, `cardsPlayedThisTurn` などを更新する。

重要: 協力モードではゲストが直接この処理を確定せず、ホストが一度だけ実行して同期する設計です。

## カード使用

### ゲストのカード使用

1. ゲストがカードを選ぶ。
2. `queueCoopBattleEvent({ type: 'COOP_BATTLE_PLAY_CARD', cardId, playedCard })` を呼ぶ。
3. `coopPendingHostActionRef` に未確定アクションを記録する。
4. P2Pでホストへ送信する。
5. ホスト同期が返るまで追加操作は抑止されます。

### ホストの受信処理

ホストは `COOP_BATTLE_PLAY_CARD` を受けると次を確認します。

- 現在のターンが敵ではない。
- ターンベースなら `activeTurn.peerId === fromPeerId`。
- リアルタイムなら現在が全員行動フェーズ。
- `battleKey`, `turnCursor`, `enemyTurnCursor` が一致する。
- `actionId` が処理済みではない。
- 該当カードが送信元プレイヤーの手札にある。

検証後、`handlePlayCard(requestedCard, fromPeerId)` を実行します。

## ターン終了

ユーザー操作の入口は `handleEndTurnClick()` です。

### ゲスト側

ゲストは `COOP_END_TURN` をホストへ送ります。

送信内容:

- `actionId`
- `battleKey`
- `turnCursor`
- `enemyTurnCursor`
- `selectedEnemyId`

同じターン終了を複数送らないため、次のキーで保留中終了を管理します。

```text
battleKey:turnCursor:enemyTurnCursor:peerId
```

同一キーが `coopPendingEndTurnKeyRef` にある場合、追加送信しません。

リアルタイムモードでは通信ロス対策として一定間隔で再送します。ただし、ターンが進むか自分が `roundEndedPeerIds` に入ったら再送を止めます。

### ホスト側

ホストは `COOP_END_TURN` を受けると次を確認します。

- 現在の `stateRef.current.coopBattleState` がある。
- `battleKey`, `turnCursor`, `enemyTurnCursor` が一致する。
- 同一終了キーが `coopProcessedEndTurnKeysRef` にない。

処理済みキーは次です。

```text
battleKey:turnCursor:enemyTurnCursor:fromPeerId
```

未処理なら `applyHostCoopBattleSnapshot(fromPeerId, data, { advanceTurn: true })` を呼びます。

リアルタイムモードで重複終了を受けた場合は、ターン遷移を再実行せず、現在の `battleState` を再ブロードキャストします。これは再送の信頼性を残しつつ、二重遷移を防ぐためです。

## ターン遷移

ターン遷移の中心は `executeQueuedTurnTransition()` です。

### ターンベース

1. 現在のプレイヤーが `COOP_END_TURN` を送る。
2. ホストが `executeQueuedTurnTransition()` を実行する。
3. `executeEndTurn(coopBattlePlan.enemyActions)` で終了時処理・敵行動を処理する。
4. `turnCursor` を次のスロットへ進める。
5. `enemyTurnCursor` を敵行動数ぶん進める。
6. 次のプレイヤーのターン開始は `startPlayerTurn()` で補充される。
7. ホストが `COOP_BATTLE_SYNC` を送る。

### リアルタイム

1. `turnQueue` は `全員 -> 敵`。
2. 各プレイヤーが自由に行動する。
3. 各プレイヤーが `COOP_END_TURN` を送る。
4. ホストは `roundEndedPeerIds` に終了者を追加する。
5. 全員終了、または自動進行条件を満たすと敵フェーズへ入る。
6. 敵行動後、次の全員フェーズへ戻る。

リアルタイムの自動進行は `COOP_REALTIME_AUTO_ADVANCE_MS` によって、終了者がいるが全員ではない場合にも一定時間後に進むことがあります。

## 敵行動

敵行動は `executeEndTurn(enemyActionCountOverride?)` 内で処理されます。

主な処理:

- プレイヤー側のターン終了効果
- 状態異常カードのダメージ
- 敵の攻撃、防御、バフ、デバフ
- 協力モードでは `coopBattleState.players[]` 内の全生存者へ攻撃やデバフを適用する場合がある
- 敵の次行動決定
- 戦闘ログとVFX更新

通常モードでは `executeEndTurn()` の最後に `startPlayerTurn()` を呼びます。協力モードでは直接呼ばず、`executeQueuedTurnTransition()` が次のキュー位置を決めてからターン開始を制御します。

## 支援・蘇生系

協力支援カードは `coopSupportCards` と `COOP_SUPPORT_USE` を使います。

代表的な支援効果:

- 味方回復
- ブロック付与
- 次ターンエナジー付与
- 味方ドロー
- 攻撃強化
- ダメージ無効
- 全体回復・状態軽減
- 戦闘不能者の蘇生

ターンキュー上の味方支援としては `resolveCoopAllySupport()` もあります。これはAI的な支援処理で、回復・ブロック・援護攻撃のいずれかを行います。

## 重複防止の仕組み

協力戦闘ではP2P再送、Reactの再描画、ボタン連打により同じ操作が複数回来る可能性があります。そのため複数のキーで冪等性を担保しています。

### `actionId`

カード使用、ポーション使用、モーダル解決などは `actionId` を持ちます。

ホストは `coopProcessedHostActionIdsRef` で処理済みか確認します。

### ターン開始キー

ホスト側ターン開始は次のようなキーで管理します。

```text
battleKey:turnCursor:enemyTurnCursor:slotId:host-start:peerId
```

`coopHostStartedTurnKeysRef` により、同一ターン開始で手札補充が複数回走らないようにします。

### ターン終了キー

ターン終了は次のキーで管理します。

```text
battleKey:turnCursor:enemyTurnCursor:peerId
```

- ゲスト側: `coopPendingEndTurnKeyRef` で同一終了の再送開始を抑止。
- ホスト側: `coopProcessedEndTurnKeysRef` で同一終了による二重ターン遷移を抑止。

## 今回の手札補充重複不具合の原因と対策

不具合は、協力モードのターンベースでターン終了イベントが複数回ホストへ届いた場合、ホストが複数回ターン遷移を実行し、結果として次ターン開始の手札補充が何度も発生する可能性があったことです。

対策:

- ゲストが同じターン終了キーを保留中なら追加送信しない。
- ホストが同じターン終了キーを処理済みならターン遷移しない。
- リアルタイムの再送は残しつつ、重複受信時は状態再同期だけ行う。
- 戦闘画面を離れたら処理済みキーと保留キーをクリアする。

## 注意点

- `applyHostCoopBattleSnapshot()` はホスト側で送信元プレイヤーのカード・ポーション存在やターン整合性を確認する防波堤です。
- `COOP_BATTLE_SYNC` 受信時、ゲストは自分のカードゾーンを保持する場合があります。敵行動中などにローカル表示の手札が巻き戻らないようにするためです。
- リアルタイムモードでは `roundEndedPeerIds` がターン終了状態の正です。
- ターンベースでは `turnCursor` が現在の行動者を表します。
- 協力モード中の勝敗・報酬・イベント・休憩・ショップなどもホスト主導で同期されますが、この文書では戦闘中のターン進行に絞っています。

