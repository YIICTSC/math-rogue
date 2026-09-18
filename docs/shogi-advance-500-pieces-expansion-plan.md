# ミニ将棋 Advance 駒500種 拡張計画

作成日: 2026-09-18
対象: `src/mini-games/shogi/`
目的: 現在50種のアドバンス駒を、既存50種との互換性を維持したまま **全500種** へ拡張する。

## 1. 現状

現在のミニ将棋は5×5盤で、標準駒8種とアドバンス駒50種を持つ。

- `src/mini-games/shogi/shogiPieces.ts`
  - `ShogiAdvancedKind` が50種を文字列Unionで列挙している。
  - `ShogiPattern` もアドバンス駒ごとの移動パターンを列挙している。
  - `ADVANCED_ROWS` に50種の表示・説明・Stageが定義されている。
- `src/mini-games/shogi/shogiEngine.ts`
  - `advancedVectors()` の巨大な `switch` で各駒の基本移動を実装している。
  - 特殊能力は駒IDやpatternを個別判定している箇所がある。
  - アドバンス解禁数は50で固定されている。
- `src/mini-games/shogi/shogiTranslations.ts`
  - 50種すべての英語説明を `Record<ShogiPieceKind, ...>` に直接保持している。
- `ShogiMiniGame.tsx`
  - UIに「50 UNIQUE」と固定表示がある。

50種では管理可能だが、500種まで同じ方式で増やすと、型Union・switch・翻訳・特殊処理が巨大化し、重複や実装漏れを検出しにくくなる。したがって **51〜500を追加する前にデータ駆動化する**。

## 2. 完成目標

- アドバンス駒を **500種ちょうど** 用意する。
- 既存50種のID、挙動、表示、解禁順を変更しない。
- 新規450種はすべて固有ID、固有駒字、固有名称、移動説明、制限、必要なら特殊能力を持つ。
- 500種すべてが5×5盤で実際に合法手生成できる。
- 長押し詳細、持ち駒、CPU、対面対戦、英語表示に全500種が対応する。
- 500種を追加しても `shogiEngine.ts` に450個の巨大switchを追加しない。
- 駒追加を「1件のデータ定義＋必要な能力テンプレート」で行える構造にする。

## 3. 互換性ルール

既存50種は現在のIDを永久に維持する。

例:

```text
ADV_DOUBLE_PAWN
ADV_SIDE_PAWN
...
ADV_CHRONOS
```

新規駒51〜500は、順番を追跡しやすい安定IDを使用する。

```text
ADV_051_<SLUG>
ADV_052_<SLUG>
...
ADV_500_<SLUG>
```

`<SLUG>` は英大文字＋`_`のみとし、後から表示名を変更してもIDは変更しない。

保存データや対局履歴では必ずIDを保存し、配列indexを永続IDとして使用しない。

## 4. 500種化のためのデータ構造変更

### 4.1 固定Unionからカタログ主導へ移行

500個の文字列を `ShogiAdvancedKind` に直接Union記述する方式は廃止する。

推奨構成:

```ts
export const ADVANCED_PIECE_DEFINITIONS = [
  // 既存50 + 新規450
] as const;

export type ShogiAdvancedKind = typeof ADVANCED_PIECE_DEFINITIONS[number]['kind'];
```

これにより、ID定義と型定義の二重管理をなくす。

### 4.2 移動を「レシピ」で表現する

現在の `ShogiPattern` を駒ごとに1種類ずつ増やす方式ではなく、共通の移動部品を組み合わせる。

例:

```ts
interface ShogiMovementRecipe {
  steps?: Array<{ dr: number; dc: number }>;
  jumps?: Array<{ dr: number; dc: number }>;
  slides?: Array<{ dr: number; dc: number; max?: number }>;
  forwardRelative?: boolean;
  captureOnly?: boolean;
  moveOnly?: boolean;
}
```

駒定義側は次のようにする。

```ts
{
  kind: 'ADV_051_WIND_FOX',
  name: '風狐',
  glyph: '狐',
  stage: 51,
  movement: {
    steps: [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }],
    slides: [{ dr: 0, dc: -1, max: 2 }, { dr: 0, dc: 1, max: 2 }],
    forwardRelative: true,
  },
}
```

### 4.3 特殊能力を能力ID化する

特殊能力は駒名による `if (kind === ...)` を増殖させない。

```ts
type ShogiAbilityId =
  | 'NONE'
  | 'EXTRA_MOVE_AFTER_CAPTURE'
  | 'JUMP_CAPTURE_IMMUNE'
  | 'SWAP_ALLY'
  | 'PUSH_ALLY'
  | 'PULL_ENEMY'
  | 'REVIVE_ONCE'
  | 'RETURN_PREVIOUS_SQUARE'
  | 'COPY_LAST_MOVE'
  | 'PORTAL_PAIR'
  | ...;
```

駒は複数能力を持てるようにする。

```ts
abilities: ['JUMP_CAPTURE_IMMUNE', 'PUSH_ALLY']
```

能力ごとに合法手生成、着手解決、CPU評価、説明文をまとめる。

## 5. 推奨ファイル分割

500種を1ファイルへ詰め込まない。

```text
src/mini-games/shogi/
  shogiPieces.ts
  shogiAdvancedPieces.ts
  shogiAdvancedPieces001_100.ts
  shogiAdvancedPieces101_200.ts
  shogiAdvancedPieces201_300.ts
  shogiAdvancedPieces301_400.ts
  shogiAdvancedPieces401_500.ts
  shogiMovementRecipes.ts
  shogiAbilities.ts
  shogiEngine.ts
  shogiTranslations.ts
  shogiAdvancedTranslations.ts
```

1ファイル100種程度を上限とし、レビューと差分確認を容易にする。

## 6. 500種の設計配分

単なる数値違いを500種にしない。50種ずつ10ブロックに分け、プレイ感を段階的に増やす。

| No. | Stage/駒番号 | 系統 | 主な設計テーマ |
| ---: | ---: | --- | --- |
| 1 | 1〜50 | 既存 | 現在の50種をそのまま維持 |
| 2 | 51〜100 | 基本拡張 | 1〜2マス移動、方向違い、短距離スライド |
| 3 | 101〜150 | 跳越 | 桂馬型、直交跳越、斜め跳越、条件付きジャンプ |
| 4 | 151〜200 | 長距離 | スライド、1枚跳越、途中停止制限、方向限定 |
| 5 | 201〜250 | 捕獲 | 捕獲時だけ変化、捕獲後移動、捕獲不可方向、交換 |
| 6 | 251〜300 | 味方連携 | 押す、入替、護衛、隣接強化、移動補助 |
| 7 | 301〜350 | 敵干渉 | 引寄せ、封鎖、移動制限、能力無効、進路妨害 |
| 8 | 351〜400 | 時間・履歴 | 初回限定、直前手参照、1局1回、移動履歴利用 |
| 9 | 401〜450 | ペア・編成 | 同名/異名ペア、門、橋、ポータル、連鎖型 |
| 10 | 451〜500 | 伝説級 | 複合移動＋強い制限を持つ高難度駒 |

強い駒ほど必ず制約を持たせる。5×5盤では移動範囲が広いだけで極端に強くなるため、「強移動＋使用回数」「強移動＋捕獲制限」「強能力＋狭い基本移動」の組み合わせを基本とする。

## 7. 駒ごとの必須項目

全500種について次を必須にする。

| 項目 | 必須内容 |
| --- | --- |
| `kind` | 一意な安定ID |
| `name` | 日本語名。既存と重複させない |
| `glyph` | 盤面に表示する1〜2文字 |
| `stage` | 初回解禁ステージ |
| `movement` | 基本移動レシピ |
| `abilities` | 0件以上の特殊能力ID |
| `description` | 移動説明 |
| `promotion` | 原則「成らない。」 |
| `restriction` | 禁止条件・回数制限 |
| `special` | 特殊能力がある場合の説明 |
| `cpuValue` | CPU用の基礎評価値 |
| `complexity` | 1〜5 |
| `tags` | JUMP / SLIDE / SUPPORT / CONTROL 等 |

## 8. 駒名・駒字の設計ルール

- 既存50種の駒字と重複しても視認性が悪くならない範囲にするが、可能な限り重複を避ける。
- 盤面では長い名前を表示しない。盤面表示は1〜2文字、詳細画面で正式名を表示する。
- 動物、天候、武具、地形、星、時間、植物、妖怪、機械、学用品など複数カテゴリに分散する。
- 実在の将棋駒と混同しやすい名称には、説明画面で「Advance専用駒」と明示する。
- 攻撃的な名前だけに偏らず、守備、移動補助、トリッキーな駒を同程度用意する。

## 9. 生成・設計支援

450種を手作業で直接TSへ書く前に、設計台帳を作る。

推奨:

```text
docs/shogi-advance-piece-catalog-500.md
```

列:

```text
No / ID / 駒名 / glyph / 解禁Stage / 移動 / 特殊能力 / 制限 / complexity / tags / CPU価値 / 実装状態 / テスト状態
```

台帳からTypeScript定義を生成するスクリプトを追加してもよい。

```text
scripts/generate-shogi-advanced-pieces.mjs
```

ただし、生成元となる台帳またはJSONを正本とし、同じ情報を複数箇所へ手入力しない。

## 10. CPU対応

現在のCPUは主に捕獲駒価値と特殊手フラグを用いる簡易評価である。500種では駒価値を個別に手書きせず、定義側の `cpuValue` とタグを使う。

最低評価項目:

- 王の捕獲/被捕獲回避
- 捕獲する駒の価値
- 自駒を危険マスへ置く損失
- 次手の移動可能数
- 特殊能力の即時価値
- 味方支援能力の有効対象数
- 相手移動制限の対象数
- 1局1回能力の温存価値

CPUは未認識の新規能力があってもクラッシュせず、最低限基本移動で着手できることを必須とする。

## 11. 翻訳対応

500種すべてについて、日本語の駒名・駒字は固有表記として維持し、説明文を英語化する。

`SHOGI_PIECE_ENGLISH` を1巨大Recordにするのではなく、100種単位またはカタログ同居方式へ分割する。

翻訳漏れ監査を追加する。

```text
ADVANCED_PIECES.length === 500
全kindに英語 description が存在
全kindに英語 promotion が存在
全kindに英語 restriction が存在
specialありの駒は英語specialも存在
```

## 12. 自動監査

新規スクリプト例:

```text
scripts/audit-shogi-advanced-pieces.mjs
```

必須チェック:

- アドバンス駒が500種ちょうど。
- ID重複0。
- 表示名重複0を原則とする。
- `stage` が1〜500を1件ずつカバーする。
- 既存1〜50のIDとstageが変更されていない。
- movementが空の駒0。
- 未登録ability 0。
- CPU価値未設定0。
- 説明文未設定0。
- 翻訳未設定0。
- 盤中央、四隅、端からの移動生成で例外0。
- 自駒、敵駒、空マスを混ぜた代表盤面で例外0。
- 持ち駒として打った後も同じkindを維持。
- 王を特殊能力で直接交換・押出・引寄せ・復活させない。

## 13. テスト方針

### 全500種共通スモーク

各駒について最低限:

1. 盤中央に置いて合法手計算が完了する。
2. 四隅に置いて盤外座標を返さない。
3. 味方駒を配置して禁止移動が除外される。
4. 敵駒を配置して捕獲可能性が正しく出る。
5. 相手側の駒にすると「前/後ろ」が反転する。
6. 捕獲後に持ち駒として保持できる。

### 特殊能力

特殊能力テンプレートごとに正常系・禁止系・王対象外をテストする。駒500種×全分岐を重複テストするのではなく、共通能力は能力単位で厚くテストし、各駒は「正しい能力IDが割り当てられている」ことを監査する。

## 14. 実装フェーズ

### Phase 0: 基盤整理

- 固定50/100の定数を共通設定へ移す。
- `ShogiAdvancedKind` をカタログ由来型へ変更。
- movement recipeを導入。
- ability registryを導入。
- 既存50種の挙動を新構造へ移植し、変更前後の合法手を比較する。

### Phase 1: 51〜100

- 基本移動中心の50種を追加。
- 台帳、英訳、CPU値、テストを同時追加。
- 100/500監査を通す。

### Phase 2: 101〜200

- 跳越・長距離系100種。
- 共通movement recipeを増やし、個別switch追加を避ける。

### Phase 3: 201〜300

- 捕獲・味方連携系100種。
- ability registryの着手前/着手後フックを完成させる。

### Phase 4: 301〜400

- 敵干渉・履歴系100種。
- 状態保存が必要な能力向けにpiece stateを一般化する。

### Phase 5: 401〜500

- ペア・伝説級100種。
- 全500種監査、CPU長時間テスト、UI負荷確認を行う。

## 15. パフォーマンス上の注意

500種すべてを毎ターン総当たり計算しない。対局中に必要なのは盤面・持ち駒に存在するkindだけである。

- `SHOGI_PIECE_MAP` は起動時にMap化。
- 合法手計算は盤上駒のみ。
- ステージ抽選は候補配列を毎回500件再生成せず、解禁範囲をsliceまたは事前index化。
- 駒一覧UIを追加する場合はページング/仮想化を使用し、500件を常時DOMへ展開しない。

## 16. UI変更

- `50 UNIQUE` を `500 UNIQUE` へ変更する。
- 駒図鑑を実装する場合は50件単位のページまたはカテゴリタブにする。
- 未解禁駒はシルエットまたは`???`表示を選べるようにする。
- 詳細画面に `No. 001 / 500` のような番号を表示する。
- タグ表示例: `JUMP`, `SLIDE`, `SUPPORT`, `CONTROL`, `ONCE`。
- 500種の一覧性を確保するため、名前・番号・タグ検索を可能にする。

## 17. 受け入れ条件

- [ ] `ADVANCED_PIECES.length === 500`。
- [ ] 既存50種のID、stage、挙動が変わっていない。
- [ ] 新規450種が固有IDと固有定義を持つ。
- [ ] 500種すべてに日本語説明と英語説明がある。
- [ ] 500種すべてが盤上・持ち駒の双方で使用できる。
- [ ] 500種すべての基本合法手スモークテストが通る。
- [ ] 能力registryに未登録の能力を参照する駒が0。
- [ ] 王を特殊能力で直接不正操作する駒が0。
- [ ] ID、stage、翻訳、movement、abilityの自動監査が通る。
- [ ] CPUが500種を含む盤面で合法手を選択できる。
- [ ] 対面Advanceのランダム抽選が500種解禁後も正常に動く。
- [ ] 500種対応後も5×5盤の操作性と長押し説明が維持される。

## 18. 主な変更対象

```text
src/mini-games/shogi/shogiPieces.ts
src/mini-games/shogi/shogiAdvancedPieces*.ts
src/mini-games/shogi/shogiMovementRecipes.ts
src/mini-games/shogi/shogiAbilities.ts
src/mini-games/shogi/shogiEngine.ts
src/mini-games/shogi/shogiTranslations.ts
src/mini-games/shogi/shogiAdvancedTranslations*.ts
src/mini-games/shogi/ShogiMiniGame.tsx
scripts/audit-shogi-advanced-pieces.mjs
docs/shogi-advance-piece-catalog-500.md
```

この拡張では、「50種の個別switchを500種の個別switchへ増やす」のではなく、**移動レシピ＋能力テンプレート＋500件のデータ定義**へ移行することを最優先とする。
