# 協力モード 同期精査メモ 2026-07-09

## 目的

協力モードにおけるホスト・参加者同期を、マップ、イベント、戦闘、カード効果の観点で精査する。特にターン制で「捨てる」選択を伴うカードを使った後、参加者側が選択状態から進めなくなる不具合を起点に、リアルタイムモードでも同種の同期欠落が起きないか確認する。

このメモは静的確認ベース。ユーザー指定により、完成までビルド確認とブラウザ確認は不要。

## 同期モデル

| 領域 | 主なイベント | 基本方針 | 現状評価 |
| --- | --- | --- | --- |
| 全体状態 | `COOP_STATE_SYNC` | ホストが画面、マップ、敵、ログ、選択状態、戦闘状態をまとめて送る | 画面遷移や非戦闘の再同期には有効 |
| マップ | `COOP_NODE_SELECT` | 参加者のノード選択要求をホストが検証し、`handleNodeSelect` で進行 | 選択可能ノード検証あり。進行後は全体同期依存 |
| イベント | `COOP_EVENT_OPTION`, `COOP_EVENT_RESULT` | 参加者の選択をホストが個別解決し、対象参加者へ結果を返す | 個別プレイヤー更新として妥当。全員共通イベント演出は薄い |
| 戦闘 | `COOP_BATTLE_SYNC` | 戦闘中は軽量な戦闘同期を高頻度に送る | 今回、`selectionState` 欠落が詰まり原因 |
| カード使用 | `COOP_BATTLE_PLAY_CARD` | 参加者はカードIDを送信し、ホストがカード効果を実行 | ホスト権威で妥当。選択UI系効果は追加同期が必要 |
| 手札選択 | `COOP_BATTLE_SELECTION_STATE` | 参加者が選んだカードIDをホストへ送り、ホストが効果を確定 | 確定後の選択解除同期が不足していた |
| ターン終了 | `COOP_END_TURN` | ターン制は即進行、リアルタイムは全員終了を待つ | 重複キー処理あり。リアルタイムの自動進行もあり |

## 今回の不具合

### 症状

ターン制の協力モードで、`promptsDiscard` を持つカードを参加者が使用すると、捨てるカードの選択後に参加者側UIが選択状態のまま残り、以降の操作が進まなくなることがある。

### 原因

`COOP_STATE_SYNC` には `selectionState` が含まれている一方、戦闘中に主に使われる `COOP_BATTLE_SYNC` には `selectionState` が含まれていなかった。

カード使用後にホスト側では以下が起きる。

1. 参加者が `COOP_BATTLE_PLAY_CARD` を送る。
2. ホストが `handlePlayCard(card, fromPeerId)` を実行する。
3. `promptsDiscard` により `selectionState.active = true` になる。
4. 参加者が `COOP_BATTLE_SELECTION_STATE` を送る。
5. ホストが `handleHandSelection(selectedCard, fromPeerId)` を実行し、`selectionState.active = false` に戻す。
6. 戦闘状態は `COOP_BATTLE_SYNC` で送られるが、`selectionState` が送られないため、参加者側の選択UIだけ解除されない。

### 修正方針

`COOP_BATTLE_SYNC` の送受信契約に `selectionState` を追加し、戦闘中の軽量同期でも選択UI状態を反映する。

実装済み:

- `src/App.tsx`
  - `broadcastCoopBattleState()` のペイロードに `selectionState` を追加。
  - 古いクロージャ値ではなく `stateRef.current` から最新の戦闘状態、敵、ログ、選択状態を送るよう調整。
  - `COOP_BATTLE_SYNC` 受信時に `selectionState` を反映。
- `src/services/p2pService.ts`
  - `COOP_BATTLE_SYNC` の型に `selectionState` を追加。

## リアルタイムモードへの影響確認

リアルタイムモードもカード使用、手札選択、戦闘同期は同じ `COOP_BATTLE_PLAY_CARD`、`COOP_BATTLE_SELECTION_STATE`、`COOP_BATTLE_SYNC` 系列を使う。

そのため今回の修正はターン制だけでなく、リアルタイムモードで `promptsDiscard`、`promptsCopy`、`promptsExhaust` などの選択UIが残る事象にも効く。

注意点:

- リアルタイムでは複数プレイヤーが同じラウンド中に行動できるため、`selectionState` がグローバル1個である設計は競合余地がある。
- 現状は参加者ごとの同時選択UIを表現できないため、将来的には `selectionStateByPeerId` のようなプレイヤー単位状態へ分離するのが安全。
- ただし今回の詰まり修正としては、ホスト確定後の解除状態を全員へ配ることで実害を抑えられる。

## カード効果別の同期注意点

| 効果系 | 例 | 同期観点 | 優先度 |
| --- | --- | --- | --- |
| 手札選択 | `promptsDiscard`, `promptsCopy`, `promptsExhaust` | `selectionState` と対象プレイヤーの手札更新が同時に届く必要あり | 高 |
| 山札モーダル | `天気予報`, `銀河鉄道の夜`, `金魚すくい`, `ドリーム・キャッチャー` | 専用 `COOP_BATTLE_MODAL_RESOLVE` がある。モーダル閉鎖と手札・山札更新の同期確認が必要 | 高 |
| 対象選択 | 敵選択、支援カード対象 | `selectedEnemyId` / 対象peerの更新が必要 | 中 |
| 生成カード | 手札・山札・捨て札へカード追加 | ホストで生成したIDを参加者へ配る必要あり | 中 |
| ランダム効果 | ランダム回収、ランダム生成、ランダム敵 | 参加者側で再計算せず、ホスト結果を受け取る必要あり | 高 |
| VFX/ログ | 攻撃演出、連携ログ | 進行には不要だが、見た目の差異が起きやすい | 低 |

## 追加で見るべき改善候補

1. `selectionState` をグローバルからプレイヤー単位へ分離する。 **対応済み**
   - リアルタイム同時行動で、Aの捨てる選択がBのUIに見える、または上書きするリスクを減らす。

2. `COOP_BATTLE_SYNC` と `COOP_STATE_SYNC` のペイロード差分表を型で管理する。 **一部対応済み**
   - 今回のように全体同期にはあるが戦闘同期にはない、という欠落を防ぐ。

3. 戦闘中カード効果の同期テスト観点を固定化する。 **対応済み**
   - `promptsDiscard`
   - `promptsCopy`
   - `promptsExhaust`
   - 山札確認モーダル
   - ランダム生成カード
   - リアルタイム同時行動

4. ホスト側でリモート操作を処理した直後、必ず同期が発火する保証を強める。
   - 現状は `coopBattleState` 変更に反応する effect と個別 broadcast が混在している。
   - 選択解除のように `selectionState` だけ変わるケースは特に漏れやすい。

## 作業ログ

- 2026-07-09
  - `COOP_BATTLE_SYNC` に `selectionState` を追加。
  - `broadcastCoopBattleState()` が最新の `stateRef.current` を参照するよう修正。
  - 参加者側 `COOP_BATTLE_SYNC` 受信時に `selectionState` を反映するよう修正。
  - `p2pService.ts` の協力戦闘同期型に `selectionState` を追加。
  - ホスト戦闘中は `selectionState` だけが変わる場合も `COOP_BATTLE_SYNC` を送るよう修正。
  - `CoopBattleState.selectionStateByPeerId` を追加し、協力戦闘中の手札選択状態をプレイヤー単位で管理するよう修正。
  - カード使用、手札選択、キャンセル、コピー系ポーション、ターン開始時選択効果で対象peerの選択状態だけを更新するよう修正。
  - `BattleScene` へ渡す選択状態を自分のpeerIdのものに切り替え、リアルタイム同時行動で他プレイヤーの選択UIが自分をロックしにくい構造へ変更。
  - `p2pService.ts` の戦闘系イベントが重複定義していた `battleState` 構造を `CoopBattleState` 型参照へ寄せ、フィールド追加時の同期型ずれを減らした。
  - 戦闘中カード効果の同期確認チェックリストを追加。

## 同期確認チェックリスト

協力戦闘のカード効果を修正・追加した場合は、少なくとも以下を確認する。

| 観点 | ターン制 | リアルタイム | 確認内容 |
| --- | --- | --- | --- |
| `promptsDiscard` | 必須 | 必須 | 使用者だけに捨てる選択が表示され、選択後に全端末で解除される |
| `promptsCopy` | 必須 | 必須 | 使用者だけにコピー選択が表示され、コピー先の手札だけが更新される |
| `promptsExhaust` | 必須 | 必須 | 使用者だけに廃棄選択が表示され、廃棄後に選択状態が残らない |
| 山札確認モーダル | 必須 | 必須 | モーダル操作結果がホスト結果として山札・捨て札へ反映される |
| ランダム生成・回収 | 必須 | 必須 | 参加者側で再抽選せず、ホストが確定したカードIDとゾーンが同期される |
| 同時行動 | 対象外 | 必須 | Aの選択中にBの手札UIがロックされない |
| ターン終了 | 必須 | 必須 | 選択状態が残ったままターン終了・敵行動へ進まない |
