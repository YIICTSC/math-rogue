# マジック編 恋愛イベント画像 残制作計画

## 現在の状態

イベントデータは最終仕様の452枚ぶんを作成済み。

| 種別 | 枚数 | 状態 |
| --- | ---: | --- |
| 共通 `?マス` イベント | 20 | 完成 |
| 推奨相性18ルート `r1-r5` | 90 | 完成 |
| P1-01 AKARI追加6ルート `r1-r5` | 30 | 完成 |
| P1-02 SHIZUKU追加6ルート `r1-r5` | 30 | 完成 |
| P1-03 HIYORI追加6ルート `r1-r5` | 30 | 完成 |
| P1-04 TSUBASA追加6ルート `r1-r5` | 30 | 完成 |
| P1-05 REI追加6ルート `r1-r5` | 30 | 完成 |
| P1-06 MADOKA追加6ルート `r1-r5` | 30 | 完成 |
| P1-07 KOHARU追加6ルート `r1-r5` | 30 | 完成 |
| P1-08 MIRAI追加6ルート `r1-r5` | 30 | 完成 |
| P1-09 SERA追加6ルート `r1-r5` | 30 | 完成 |
| P2-01 エンディング `r6` | 9 | 完成 |
| P2-02 エンディング `r6` | 9 | 完成 |
| P2-03 エンディング `r6` | 9 | 完成 |
| P2-04 エンディング `r6` | 9 | 完成 |
| P2-05 エンディング `r6` | 9 | 完成 |
| P2-06 エンディング `r6` | 9 | 完成 |
| P2-07 エンディング `r6` | 9 | 完成 |
| P2-08 エンディング `r6` | 9 | 完成 |
| 合計 | 452 | 452完成 / 0未制作 |

データ参照:

```text
src/data/romanceEvents.ts
```

画像出力先:

```text
public/sprites/magic/events/romance/{heroId}/{targetId}/r1.webp
...
public/sprites/magic/events/romance/{heroId}/{targetId}/r6.webp
```

## 残制作枚数

| 制作対象 | 枚数 | 3x3シート数 |
| --- | ---: | ---: |
| 残りルート | 0 | 0 |
| 合計 | 0 | 0 |

## Phase 1: 残り54ルート `r1-r5`

主人公ごとに、未制作の6対象 x 5段階 = 30枚を作る。

| batch | 主人公 | 未制作対象 | 枚数 | 3x3シート |
| --- | --- | --- | ---: | ---: |
| P1-01 | AKARI | SOMA, MINATO, RIKU, LEON, ELLIOT, SAKUYA | 30 | 完成 |
| P1-02 | SHIZUKU | REN, MINATO, YAMATO, LEON, ELLIOT, SAKUYA | 30 | 完成 |
| P1-03 | HIYORI | SOMA, RIKU, YAMATO, LEON, ELLIOT, SAKUYA | 30 | 完成 |
| P1-04 | TSUBASA | REN, SOMA, MINATO, RIKU, ELLIOT, SAKUYA | 30 | 完成 |
| P1-05 | REI | REN, MINATO, RIKU, YAMATO, LEON, ELLIOT | 30 | 完成 |
| P1-06 | MADOKA | REN, SOMA, MINATO, YAMATO, LEON, SAKUYA | 30 | 完成 |
| P1-07 | KOHARU | SOMA, MINATO, RIKU, YAMATO, LEON, ELLIOT | 30 | 完成 |
| P1-08 | MIRAI | REN, SOMA, MINATO, YAMATO, ELLIOT, SAKUYA | 30 | 完成 |
| P1-09 | SERA | REN, SOMA, RIKU, YAMATO, LEON, SAKUYA | 30 | 完成 |

各batchは30枚なので、3x3シート3枚 + 3セル使用の1枚で作る。

## Phase 2: 全72ルート `r6` エンド

`r6` は `?マス` 抽選ではなく、4章ボス撃破後または真恋愛条件達成時に表示する。

エンディング用イラストは、各主人公・各恋愛対象で構図を変える。全員を同じ正面ツーショットにせず、卒業後の帰路、最終決戦後の光景、異世界の門、教室の窓辺、舞台袖、時計塔、温室、海辺、街灯下など、ルートの性格に合わせてカメラ距離・人物配置・背景を変える。

| batch | 内容 | 枚数 | 3x3シート |
| --- | --- | ---: | ---: |
| P2-01 | AKARI 8対象 + SHIZUKU/REN | 9 | 完成 |
| P2-02 | SHIZUKU 残り7対象 + HIYORI/REN + HIYORI/SOMA | 9 | 完成 |
| P2-03 | HIYORI 残り6対象 + TSUBASA/REN + TSUBASA/SOMA + TSUBASA/MINATO | 9 | 完成 |
| P2-04 | TSUBASA 残り5対象 + REI/REN + REI/SOMA + REI/MINATO + REI/RIKU | 9 | 完成 |
| P2-05 | REI 残り4対象 + MADOKA/REN + MADOKA/SOMA + MADOKA/MINATO + MADOKA/RIKU + MADOKA/YAMATO | 9 | 完成 |
| P2-06 | MADOKA 残り3対象 + KOHARU/REN + KOHARU/SOMA + KOHARU/MINATO + KOHARU/RIKU + KOHARU/YAMATO + KOHARU/LEON | 9 | 完成 |
| P2-07 | KOHARU 残り2対象 + MIRAI 7対象 | 9 | 完成 |
| P2-08 | MIRAI 残り1対象 + SERA 8対象 | 9 | 完成 |

## 生成ルール

- すべて3x3正方形スプライトシートで作成する。
- 未使用セルは完全な `#00ff00`。
- 生成元シートは以下に保存する。

```text
public/sprites/magic/events/romance-sheets/
```

- 個別画像はルート別フォルダへ切り出す。
- 切り出しは固定座標ではなく、セルごとの非クロマキー領域検出で行う。
- 人物、髪、手、武器、小物を切らない。
- 作画固定が甘い場合は同じbatch内でリテイクする。

## データ更新ルール

画像を追加したら、`src/data/romanceEvents.ts` の `assetStatus` 判定を更新し、該当イベントを `planned` から `ready` に進める。

現在完成扱い:

- 共通イベント20枚
- `MAGIC_INITIAL_ROMANCE_ROUTE_IDS` の `r1-r5`

今後の制作で完成扱いにする単位:

- Phase 1は主人公batch単位で `r1-r5` を `ready` にする。
- Phase 2は `r6` batch単位で `ready` にする。

## 次に行う作業

イベント画像生成は完了。次はゲーム内表示、解放条件、回想ギャラリー連携の確認へ進む。
