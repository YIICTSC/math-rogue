# ミニ将棋 Advance ステージ拡張計画

作成日: 2026-09-18
対象: `src/mini-games/shogi/`
現状: アドバンス駒50種 / 全100ステージ
初期拡張目標: **全1000ステージ**。将来1000超へ増やせる構造にする。

## 1. 目的

アドバンス駒500種化に合わせ、現在100で固定されているAdvanceステージを拡張する。

1000ステージを初期目標とする理由:

- Stage 1〜500で500種を1種ずつ紹介・解禁できる。
- Stage 501〜1000を、解禁済み駒を組み合わせる高難度・再学習区間にできる。
- 「新しい駒を知る期間」と「組み合わせを攻略する期間」を同数確保できる。
- 実装上は上限値を定数化し、将来1500、2000へ伸ばせる。

## 2. 現在の固定値

現行実装には50と100が直接埋め込まれている。

### `ShogiMiniGame.tsx`

- `highestStage` を最大100へclamp。
- `unlocked` を最大100へclamp。
- 「ユニーク駒50種 // 100ステージ」。
- `Array.from({ length: 100 })` で100個のステージボタンを生成。
- `50 UNIQUE` / `100 STAGES`。
- 対面Advance開始時にstage=100を渡す。
- 次ステージ上限が100。
- 勝利時進行保存上限が100。
- 対局中表示 `/ 100`。
- Stage 100未満のみ「次のステージへ」を表示。

### `shogiEngine.ts`

- 解禁駒数を最大50へclamp。
- Stage 1〜50だけ「そのステージの新駒」を必須登場させる。
- 51〜100は複数駒構成。
- `stageUniqueCount()` が100ステージ専用の閾値になっている。

これらを先に除去しなければ、100超のステージ追加はUI・保存・生成で不整合になる。

## 3. 共通定数

固定値を1か所へ集約する。

推奨新規ファイル:

```text
src/mini-games/shogi/shogiAdvanceConfig.ts
```

例:

```ts
export const SHOGI_ADVANCED_PIECE_COUNT = 500;
export const SHOGI_ADVANCE_STAGE_COUNT = 1000;
export const SHOGI_ADVANCE_INTRO_STAGE_COUNT = 500;
export const SHOGI_ADVANCE_CHAPTER_SIZE = 50;
export const SHOGI_ADVANCE_CHAPTER_COUNT = 20;
```

可能なら駒数はハードコードせず、`ADVANCED_PIECES.length` を正とする。

## 4. ステージ構成

### 4.1 Stage 1〜500: 新駒紹介・解禁

1ステージにつき1種類の新駒を必ず登場させる。

```text
Stage 1   -> Advanced Piece No.001
Stage 50  -> Advanced Piece No.050
Stage 51  -> Advanced Piece No.051
...
Stage 500 -> Advanced Piece No.500
```

既存Stage 1〜50の対応関係は変更しない。

新駒は両陣営に同じ種類を与え、初期配置運だけで勝敗が偏らない現在の対称配置方針を維持する。

紹介ステージでも、後半は過去に解禁した駒を補助枠として混ぜる。ただし **そのステージの新駒は必ず `activeAdvancedKinds` に含める**。

### 4.2 Stage 501〜1000: マスタリー区間

新規解禁は行わず、500種から複数種類を組み合わせる。

| Stage | Active Advance種数 | 主目的 |
| ---: | ---: | --- |
| 501〜600 | 2 | 2駒の相性理解 |
| 601〜700 | 3 | 三すくみ・連携 |
| 701〜800 | 4 | 中盤の選択肢増加 |
| 801〜900 | 5 | 高密度Advance対局 |
| 901〜950 | 6 | 高難度複合能力 |
| 951〜999 | 7 | 終盤級チャレンジ |
| 1000 | 8 | 最終マスターステージ |

5×5盤では片側初期配置領域が10マスなので、王1＋Advance最大8種＋標準1種 = 10枚を上限とする。

## 5. 章構成

1000個のボタンを1画面へ直接並べない。50ステージを1章とし、全20章へ分ける。

| Chapter | Stage | 内容 |
| ---: | ---: | --- |
| 1 | 1〜50 | 現行50駒 |
| 2 | 51〜100 | 基本拡張 |
| 3 | 101〜150 | 跳越I |
| 4 | 151〜200 | 跳越II / 長距離 |
| 5 | 201〜250 | 捕獲I |
| 6 | 251〜300 | 味方連携 |
| 7 | 301〜350 | 敵干渉 |
| 8 | 351〜400 | 履歴・時間 |
| 9 | 401〜450 | ペア・編成 |
| 10 | 451〜500 | 伝説級 / 全500解禁 |
| 11 | 501〜550 | 2種連携I |
| 12 | 551〜600 | 2種連携II |
| 13 | 601〜650 | 3種連携I |
| 14 | 651〜700 | 3種連携II |
| 15 | 701〜750 | 4種連携I |
| 16 | 751〜800 | 4種連携II |
| 17 | 801〜850 | 5種連携I |
| 18 | 851〜900 | 5種連携II |
| 19 | 901〜950 | 6種チャレンジ |
| 20 | 951〜1000 | Master 7〜8種 |

## 6. ステージ仕様を関数化する

現在の `stageUniqueCount(stage)` だけでは、1000ステージの内容を制御しにくい。ステージごとに仕様を返す関数へ置き換える。

```ts
export interface ShogiAdvanceStageSpec {
  stage: number;
  chapter: number;
  featuredPieceIndex?: number;
  unlockedPieceCount: number;
  activeUniqueCount: number;
  minComplexity?: number;
  maxComplexity?: number;
  requiredTags?: string[];
  excludedTags?: string[];
  difficulty: number;
}

export const getShogiAdvanceStageSpec = (stage: number): ShogiAdvanceStageSpec => {
  // pure function
};
```

盤面生成はこのspecだけを見る。

## 7. 解禁数の計算

ステージ番号をそのまま解禁駒数として扱うのはStage 500までに限定する。

```ts
const unlockedPieceCount = Math.min(stage, ADVANCED_PIECES.length);
```

- Stage 1 -> 1種解禁
- Stage 50 -> 50種解禁
- Stage 500 -> 500種解禁
- Stage 501〜1000 -> 500種のまま

対面Advanceは、端末で到達済みの最高ステージから解禁駒数を計算する。`stage=1000` を解禁数の代用品として渡さない。

## 8. CPUステージ生成

### Stage 1〜500

```text
featured = ADVANCED_PIECES[stage - 1]
```

featuredは必ず登場させる。

補助駒は `ADVANCED_PIECES.slice(0, unlockedPieceCount)` から抽選する。

### Stage 501〜1000

500種すべてが抽選候補。ただし完全ランダムだけにすると難易度の振れ幅が大きいため、次をstage specで制御する。

- complexity範囲
- 能力タグ
- 同時登場禁止組み合わせ
- 必須連携タグ
- 駒価値合計
- 初期合法手数
- 王への初期攻撃禁止

## 9. ステージごとの差別化

1000ステージを単なるseed違いにしない。

最低限、各ステージに次のいずれか1つ以上の「テーマ」を持たせる。

- FEATURE: 新駒紹介
- JUMP: 跳越主体
- SLIDE: スライド主体
- SUPPORT: 味方連携主体
- CONTROL: 相手移動制限主体
- CAPTURE: 捕獲能力主体
- HISTORY: 手数/履歴能力主体
- PAIR: 2種の相互作用
- MIXED: 複合
- MASTER: 高難度

同じseedを再現した場合は、同じstage specと同じ配置になることを保証する。

## 10. 固定チャレンジとランダム性

通常ステージはランダム配置を維持するが、節目ステージは「固定ルール＋seed候補セット」を導入できる。

推奨節目:

```text
50, 100, 150, ... 500
600, 700, 800, 900
950
1000
```

節目では:

- 登場Advance駒の種類を固定。
- 配置は複数の安全seedから抽選。
- 通常よりCPU評価を強化。
- クリア表示にCHAPTER CLEAR / MASTER CLEARを追加。

完全固定盤面にすると再挑戦が暗記になるため、複数seedを用意する。

## 11. UI変更

### 11.1 ステージ選択

1000ボタンを同時表示しない。

推奨UI:

```text
[Chapter 01] [Chapter 02] ... [Chapter 20]

現在章: Chapter 07 / Stage 301-350
[301][302][303] ... [350]
```

- 初期表示は最高到達ステージを含む章。
- 前章/次章ボタンを用意。
- Chapter一覧はゲームパッドで操作可能にする。
- クリア済み、選択中、未解禁を色＋形で区別。
- `aria-label` にStage番号と状態を含める。

### 11.2 表示文言

固定文言を定数参照へ変更する。

```text
500 UNIQUE
1000 STAGES
STAGE 0573 / 1000
573 / 1000 解禁
```

ただし「解禁」の分子はステージ数ではなく、画面によって「到達Stage」と「解禁駒数」を分けて表示する。

例:

```text
到達: STAGE 573 / 1000
駒解禁: 500 / 500
```

## 12. 進行保存

現在の保存キーは `learning_rogue_shogi_progress_v2`。

1000ステージ対応では `v3` への移行を推奨する。

```ts
interface ShogiProgressV3 {
  version: 3;
  highestStage: number;
  completedStages: number[];
  standardWins: number;
  bestMovesByStage?: Record<number, number>;
  chapterClearFlags?: number[];
}
```

### v2 -> v3移行

- `highestStage` はそのまま引き継ぐ。
- 旧上限100で切り捨てない。
- `completedStages` もそのまま引き継ぐ。
- 既存ユーザーのStage 1〜100クリア状況を失わない。
- 読み込み時clampは `SHOGI_ADVANCE_STAGE_COUNT` を使う。

## 13. 進行ルール

- 未クリアでも到達済みステージは再挑戦可能。
- CPU Advance勝利時のみ次Stageを解禁。
- 対面対戦はStage進行を増やさない。
- Stage 1000クリア後は1000を最高到達として保持する。
- Stage 1000クリア後も「新しい盤面で再戦」は可能。
- 最終クリア後にフリーAdvanceや対面Advanceで全500種を抽選可能にする。

## 14. 難易度設計

ステージ番号だけでCPUを強くし続けない。盤面複雑度とCPU探索を分ける。

推奨:

| Stage | CPU | 盤面複雑度 |
| ---: | --- | --- |
| 1〜100 | 入門 | 低 |
| 101〜300 | 基本 | 低〜中 |
| 301〜500 | 標準 | 中 |
| 501〜700 | 標準+ | 中〜高 |
| 701〜900 | 上級 | 高 |
| 901〜999 | 上級+ | 高 |
| 1000 | Master | 最高 |

CPUが強すぎて新駒学習を妨げないよう、Stage 1〜500は「新駒の動きを理解する」ことを優先する。

## 15. 盤面生成の安全条件

1000ステージすべてで現在の安全条件を維持する。

- 両陣営に王が1枚。
- 初期王手なし。
- 両陣営に合法手がある。
- 同じAdvance駒セットを両陣営へ与える。
- 5×5盤の初期配置領域10マスを超えない。
- 新駒紹介Stageではfeatured駒が盤上に存在する。
- 特殊能力だけで開始直後に王を捕獲できる配置を除外。
- 強能力の組み合わせによる実質詰み配置を可能な範囲で監査する。

安全盤面生成に64回失敗した場合は、そのまま危険盤面を返さず、フォールバック配置を使用する設計へ改善する。

## 16. 自動監査

新規:

```text
scripts/audit-shogi-advance-stages.mjs
```

確認内容:

- Stage 1〜1000のspec生成で例外0。
- 1〜500は各StageのfeaturedPieceが一意。
- 500ステージ終了時に500種すべてが1回以上featuredになっている。
- 501〜600は2種。
- 601〜700は3種。
- 701〜800は4種。
- 801〜900は5種。
- 901〜950は6種。
- 951〜999は7種。
- 1000は8種。
- 1000を超えるstage入力はclampまたは明示エラーになる。
- `activeUniqueCount <= 8`。
- `unlockedPieceCount <= 500`。
- 既存Stage 1〜100の進行データを読み込める。

## 17. 大量生成テスト

全Stageについて最低10seed、合計10,000局以上を生成して確認する。

```text
1000 stages x 10 seeds = 10,000 positions
```

チェック:

- 生成例外0。
- 王欠落0。
- 初期王手0。
- featured駒欠落0。
- 盤外配置0。
- 同一マス重複0。
- 両陣営のAdvance種類不一致0。
- 生成無限ループ0。

さらにStage 500、501、600、700、800、900、950、999、1000は100seed以上で重点確認する。

## 18. 実装フェーズ

### Phase 0: 固定100の除去

- `shogiAdvanceConfig.ts` を追加。
- UIとengine内の50/100直書きを共通定数へ置換。
- 既存100ステージで挙動が変わらないことを確認。

### Phase 1: 101〜250

- 追加駒の導入Stageを増やす。
- Chapter UIを導入。
- v3保存移行を実装。

### Phase 2: 251〜500

- 500種すべての紹介Stageを完成。
- Stage 500で全500種解禁を確認。

### Phase 3: 501〜750

- 2〜4種のマスタリー構成。
- タグ相性を使うステージspecを導入。

### Phase 4: 751〜999

- 4〜7種の高難度構成。
- CPU評価と盤面生成負荷を調整。

### Phase 5: Stage 1000

- 8種構成の最終Masterステージ。
- 最終クリア表示と全駒解禁状態を確認。

## 19. 受け入れ条件

- [ ] `SHOGI_ADVANCE_STAGE_COUNT === 1000`。
- [ ] Stage 1〜100の既存進行が壊れていない。
- [ ] Stage 1〜500で500種を1種ずつ紹介できる。
- [ ] Stage 500クリア時点で500種すべてが解禁される。
- [ ] Stage 501〜1000は解禁済み駒の複合ステージとして動作する。
- [ ] 1000ステージを1画面に全DOM展開しない。
- [ ] Chapter選択とStage選択がタッチ、マウス、キーボード、コントローラーで可能。
- [ ] v2保存からv3へ進行を失わず移行できる。
- [ ] 対面AdvanceがStage進行と独立して解禁済み500種を使える。
- [ ] 全1000Stageのspec自動監査が通る。
- [ ] 10,000盤面以上の生成テストで例外・不正初期盤面0。
- [ ] Stage 1000クリア後も再戦・ステージ選択・対面対戦が正常に行える。

## 20. 主な変更対象

```text
src/mini-games/shogi/shogiAdvanceConfig.ts
src/mini-games/shogi/shogiAdvanceStages.ts
src/mini-games/shogi/shogiPieces.ts
src/mini-games/shogi/shogiEngine.ts
src/mini-games/shogi/ShogiMiniGame.tsx
src/mini-games/shogi/shogiTranslations.ts
scripts/audit-shogi-advance-stages.mjs
```

この拡張では、現在の「100までの数字を各所へ直接書く」構造をやめ、**駒数500・初期ステージ数1000を共通設定とstage specで管理し、将来さらに増やせる構造へ移行する**。
