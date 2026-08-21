# 放課後スクールTRPG データスキーマ・検証仕様

作成日: 2026-08-21
ステータス: 実装前のデータ契約
関連計画:

- [school-trpg-open-world-multi-ending-expansion-plan.md](./school-trpg-open-world-multi-ending-expansion-plan.md)
- [school-trpg-scenario-and-content-detail-plan.md](./school-trpg-scenario-and-content-detail-plan.md)
- [school-trpg-asset-integration-and-ui-plan.md](./school-trpg-asset-integration-and-ui-plan.md)

## 1. 目的と適用範囲

長編TRPGのマップ、イベント、戦闘、仲間、アイテム、問題、報酬、エンディングを、UIから分離したデータとして定義する。データを追加するだけで地点やイベントを増やせること、条件の矛盾や到達不能な分岐を自動検出できることを目的とする。

現行の短編実装は `TriviaMiniGameScreen.tsx` に固定シーンと判定処理がまとまっているため、移行後は次の責務を分離する。

- データ: `src/mini-games/school-trpg/data/`
- ルールと状態遷移: `src/mini-games/school-trpg/schoolTrpgEngine.ts`
- 表示: `src/mini-games/school-trpg/ui/`
- 問題接続: `src/mini-games/school-trpg/schoolTrpgQuestions.ts`
- セーブ: `src/mini-games/school-trpg/schoolTrpgSave.ts`

## 2. IDと共通値

### 2.1 ID規則

IDは翻訳せず、ファイル名や表示名から生成しない。削除したIDは再利用しない。

| 種類 | 形式 | 例 |
|---|---|---|
| ゾーン | `zone.<slug>` | `zone.central-campus` |
| 地点 | `location.<zone>.<slug>` | `location.knowledge.library` |
| イベント | `event.<chapter>-<number>` | `event.p0-01` |
| 戦闘 | `encounter.<chapter>-<number>` | `encounter.p0-05` |
| 仲間／NPC | `actor.<slug>` | `actor.library-club-president` |
| 敵 | `enemy.<slug>` | `enemy.memory-keeper` |
| アイテム | `item.<slug>` | `item.school-emblem-shard` |
| 知識タグ | `knowledge.<slug>` | `knowledge.media-literacy` |
| 問題ゲート | `question.<event-id>` | `question.event.p0-04` |
| エンディング | `ending.<slug>` | `ending.return-the-emblem` |

### 2.2 表示文

```ts
export type TrpgCopy = {
  ja: string;
  hira: string;
  en: string;
};

export type TrpgTextKey = {
  key: string;
  copy: TrpgCopy;
  properNoun?: boolean;
};
```

`properNoun: true` の名前は、ひらがな・英語の自動翻訳対象から外す。説明文、alt文、戦闘ログは別キーで管理し、固有名詞を文章全体の自動置換で変換しない。

## 3. 条件と効果

### 3.1 条件

条件はUIに直接書かず、エンジンが評価できる有限な演算子に限定する。

```ts
export type TrpgCondition =
  | { type: 'flag'; key: string; op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'; value: boolean | number | string }
  | { type: 'hasItem'; itemId: string; count?: number }
  | { type: 'hasKnowledge'; tag: string }
  | { type: 'hasActor'; actorId: string }
  | { type: 'bond'; actorId: string; axis: 'trust' | 'resonance' | 'friction'; op: 'gte' | 'lte'; value: number }
  | { type: 'time'; op: 'gte' | 'lte'; value: number }
  | { type: 'all'; conditions: TrpgCondition[] }
  | { type: 'any'; conditions: TrpgCondition[] };
```

禁止事項:

- UIの文言を条件として判定する。
- `any: []` や自己参照する条件を登録する。
- 存在しないアイテム、地点、仲間、フラグを参照する。

### 3.2 効果

```ts
export type TrpgEffect =
  | { type: 'setFlag'; key: string; value: boolean | number | string }
  | { type: 'addFlag'; key: string; delta: number; min?: number; max?: number }
  | { type: 'addItem'; itemId: string; count?: number }
  | { type: 'removeItem'; itemId: string; count?: number }
  | { type: 'addKnowledge'; tag: string }
  | { type: 'adjustStat'; stat: TrpgStat; delta: number; min?: number; max?: number }
  | { type: 'adjustBond'; actorId: string; axis: BondAxis; delta: number; min?: number; max?: number }
  | { type: 'advanceTime'; amount: number }
  | { type: 'discover'; eventId: string }
  | { type: 'unlockLocation'; locationId: string }
  | { type: 'startEncounter'; encounterId: string }
  | { type: 'openQuestionGate'; gateId: string }
  | { type: 'addLog'; logId: string };

export type TrpgStat = 'study' | 'energy' | 'friendship' | 'courage';
export type BondAxis = 'trust' | 'resonance' | 'friction';
```

効果は順番が意味を持つため、1イベント内では配列順に適用し、適用前後の差分をログへ保存する。効果適用に失敗した場合はイベント全体を中断せず、失敗理由をデバッグログへ記録する。

## 4. ワールドとマップ

```ts
export type TrpgMapNodeState = 'HIDDEN' | 'DISCOVERED' | 'REVISIT' | 'HAZARD' | 'LOCKED';

export type TrpgMapNode = {
  id: string;
  zoneId: string;
  assetId: string;
  x: number; // 0〜1
  y: number; // 0〜1
  safeArea?: { top: number; right: number; bottom: number; left: number };
  edges: string[];
  arrivalEventIds: string[];
  revisitEventIds?: string[];
  enterCost: { time: number; energy?: number };
  prerequisites?: TrpgCondition[];
};

export type TrpgZone = {
  id: string;
  name: TrpgTextKey;
  mapAssetId: string;
  nodeIds: string[];
  chapterRange: [number, number];
  fallbackZoneId?: string;
};
```

検証ルール:

- `x` と `y` は0〜1の範囲内にある。
- すべての`edges`は相互に存在するか、一方向接続として明示される。
- 開始地点から章ボスまで、少なくとも2本の到達経路がある。
- `arrivalEventIds` と `revisitEventIds` は存在するイベントだけを参照する。
- `LOCKED`地点には、プレイヤーに表示できる理由が最低1つある。

## 5. イベント、選択肢、問題

```ts
export type TrpgEvent = {
  id: string;
  chapter: number | 'PROLOGUE' | 'HIDDEN';
  zoneId: string;
  locationId: string;
  phase: 'DAY' | 'AFTER_SCHOOL' | 'NIGHT' | 'DREAM';
  title: TrpgTextKey;
  summary: TrpgTextKey;
  backgroundAssetId: string;
  foregroundAssetIds?: string[];
  actorIds?: string[];
  tags: string[];
  prerequisites?: TrpgCondition[];
  choices: TrpgChoice[];
  onEnter?: TrpgEffect[];
  onResolve?: TrpgEffect[];
  revisit?: { mode: 'DIFFERENT_EVENT' | 'REWARD_ONLY' | 'CLOSED'; eventId?: string };
};

export type TrpgChoice = {
  id: string;
  label: TrpgTextKey;
  actionTag: 'MOVE' | 'INVESTIGATE' | 'TALK' | 'CHECK' | 'COMBAT' | 'REST' | 'USE_ITEM' | 'ESCAPE';
  prerequisites?: TrpgCondition[];
  check?: { stat: TrpgStat; difficulty: number; questionGateId?: string };
  cost?: { time?: number; energy?: number; itemIds?: string[] };
  successEffects: TrpgEffect[];
  failureEffects: TrpgEffect[];
  nextEventId?: string;
  encounterId?: string;
};

export type TrpgQuestionGate = {
  id: string;
  eventId: string;
  count: 3;
  subjectTags: string[];
  difficultyBand: 'EASY' | 'NORMAL' | 'HARD';
  failRoute: 'TIME_COST' | 'STRESS' | 'ALTERNATE_CLUE';
  rewardEffects: TrpgEffect[];
};
```

問題ゲートはミッションIDと紐づけ、回答途中の再読み込みで再抽選しない。既存の`MiniGameProblemChallenge`を利用する場合も、TRPG側に`gateId`、出題済み問題ID、回答状態を保持する。

## 6. 仲間、敵、アイテム

```ts
export type TrpgActor = {
  id: string;
  name: TrpgTextKey;
  portraitAssetId: string;
  silhouetteAssetId?: string;
  role: 'PLAYER' | 'COMPANION' | 'NPC' | 'RIVAL' | 'BOSS';
  tags: string[];
  abilities: string[];
  bondAxes: BondAxis[];
};

export type TrpgItem = {
  id: string;
  name: TrpgTextKey;
  iconAssetId: string;
  category: 'KEY' | 'KNOWLEDGE' | 'CONSUMABLE' | 'EQUIPMENT' | 'CLUE';
  stackable: boolean;
  maxCount?: number;
  uses: Array<{ locationId?: string; eventTag?: string; effects: TrpgEffect[] }>;
  flavor: TrpgTextKey;
};

export type TrpgEnemy = {
  id: string;
  name: TrpgTextKey;
  illustrationAssetId: string;
  fallbackAssetId: string;
  hp: number;
  intentTableId: string;
  tags: string[];
  escapeAllowed: boolean;
};
```

仲間・NPC・敵の画像解決を別レジストリにする。敵用マニフェストに仲間画像を混在させず、表示名と画像ファイル名を分離する。

## 7. 戦闘データ

```ts
export type TrpgEncounter = {
  id: string;
  backgroundAssetId: string;
  foregroundAssetIds?: string[];
  enemyIds: string[];
  environmentTags: string[];
  mode: 'DIRECT' | 'ESCAPE' | 'DEFENSE' | 'INVESTIGATION' | 'NEGOTIATION' | 'BOSS';
  turnLimit?: number;
  victoryEffects: TrpgEffect[];
  defeatEffects: TrpgEffect[];
  escapeEffects?: TrpgEffect[];
  rewardTableId: string;
};

export type TrpgCombatAction = {
  id: string;
  actorId: string;
  label: TrpgTextKey;
  sourceCardId?: string;
  cost?: { energy?: number; itemIds?: string[] };
  targeting: 'SELF' | 'ALLY' | 'ENEMY' | 'ALL_ENEMIES' | 'ENVIRONMENT';
  effects: TrpgCombatEffect[];
  animationId: string;
  soundId: string;
};

export type TrpgCombatEffect =
  | { type: 'damage'; amount: number; status?: string }
  | { type: 'heal'; amount: number }
  | { type: 'shield'; amount: number }
  | { type: 'adjustIntent'; delta: number }
  | { type: 'addStatus'; statusId: string; stacks: number; duration?: number }
  | { type: 'removeStatus'; statusId: string };
```

カードアートや将棋駒は`sourceCardId`、`sourcePieceKind`として表示素材だけを参照し、TRPGの効果計算は`TrpgCombatAction`で行う。本編カード・将棋エンジンの効果を直接呼び出さない。

## 8. 報酬、発見、エンディング

```ts
export type TrpgRewardTable = {
  id: string;
  choices: Array<{ id: string; label: TrpgTextKey; effects: TrpgEffect[]; assetId: string }>;
  chooseCount: 1;
};

export type TrpgEnding = {
  id: string;
  title: TrpgTextKey;
  summary: TrpgTextKey;
  prerequisites: TrpgCondition[];
  priority: number;
  artAssetId: string;
  nextRunEffects?: TrpgEffect[];
};
```

同時に成立するエンディングは`priority`の高いものを採用し、採用理由をデバッグログへ出す。エンディング条件がひとつも成立しない場合は、安全なフォールバックエンディングを必ず用意する。

## 9. キャンペーン状態との境界

データ定義とランタイム状態を混在させない。

```ts
export type TrpgRuntimeState = {
  phase: 'TITLE' | 'MAP' | 'LOCATION' | 'EVENT' | 'QUESTION' | 'COMBAT' | 'REWARD' | 'LOG' | 'ENDING';
  seed: number;
  chapter: number;
  zoneId: string;
  locationId: string;
  party: string[];
  stats: Record<TrpgStat, number>;
  bonds: Record<string, Record<BondAxis, number>>;
  inventory: Record<string, number>;
  flags: Record<string, boolean | number | string>;
  discoveredEventIds: string[];
  pendingGate?: { gateId: string; missionId: string; questionIds: string[]; index: number };
  pendingReward?: { rewardTableId: string; choices: string[] };
};
```

`RuntimeState`は保存仕様で定義するエンベロープに格納し、UIは状態を直接書き換えず、`dispatch(action)`でエンジンへ渡す。

## 10. 検証とCI

### 10.1 起動時検証

開発ビルドでは次を検証し、エラーを一覧で表示する。

- 参照先IDの存在
- 必須翻訳キーの3言語存在
- アセットIDとフォールバックの存在
- 数値範囲（HP、難度、時間、座標、親密度）
- イベント・地点・エンディングの到達可能性
- 条件に存在しないフラグがないこと
- 報酬候補が空でないこと

### 10.2 静的監査

コンテンツ追加時に、最低限以下の監査を用意する。

```text
validateSchoolTrpgData()
  → validateIds()
  → validateReferences()
  → validateTranslations()
  → validateAssets()
  → validateMapConnectivity()
  → validateEndingReachability()
  → validateQuestionGates()
```

### 10.3 固定seedによる再現

乱数は`createRng(seed)`からのみ取得する。イベント、敵行動、報酬、問題の順番を同じseedで再現できるようにし、Reactの再レンダーや画面遷移で乱数を消費しない。

## 11. 最初の実装データ

最初の縦切りでは、次だけを登録する。

- `event.p0-01`〜`event.p0-06`
- 中央校舎、知識区、旧校舎入口の3地点
- 仲間1人、NPC1人、敵1体
- アイテム「校章の欠片」
- 問題ゲート1つ（3問）
- 戦闘、説得、逃走の3解決方法
- 通常、失敗、秘密保持、情報公開の4エンディング候補

この縦切りが検証を通過してから、地点・仲間・アイテム・分岐を増やす。

## 12. 完了条件

- データファイルを追加するだけで、新しいイベントがマップから選択できる。
- 存在しないID、画像、翻訳、報酬をCIで検出できる。
- 同じseedで同じイベント・敵行動・報酬結果を再現できる。
- 問題、戦闘、報酬、エンディングが共通のランタイム状態を通じて遷移する。
- UIや画像を変更しても、データ検証とエンジンのユニットテストが再利用できる。
