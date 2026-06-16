# マジック編 初期恋愛イベント制作バッチ

## 対象

初期制作では、推奨相性18ルートの `R1` から `R5` を制作する。

合計:

- 18ルート x 5段階 = 90枚
- 3x3スプライトシート = 10枚

## 出力先

```text
public/sprites/magic/events/romance/{heroId}/{targetId}/r1.webp
public/sprites/magic/events/romance/{heroId}/{targetId}/r2.webp
public/sprites/magic/events/romance/{heroId}/{targetId}/r3.webp
public/sprites/magic/events/romance/{heroId}/{targetId}/r4.webp
public/sprites/magic/events/romance/{heroId}/{targetId}/r5.webp
```

生成元シート:

```text
public/sprites/magic/events/romance-sheets/magic-romance-initial-sheet-01.png
...
public/sprites/magic/events/romance-sheets/magic-romance-initial-sheet-10.png
```

## ルート順

| No | heroId | 主人公 | targetId | 恋愛対象 |
| ---: | --- | --- | --- | --- |
| 1 | AKARI | 星宮あかり | REN | 朝霧 蓮 |
| 2 | AKARI | 星宮あかり | YAMATO | 黒瀬 大和 |
| 3 | SHIZUKU | 水城しずく | SOMA | 御影 颯真 |
| 4 | SHIZUKU | 水城しずく | RIKU | 天音 理玖 |
| 5 | HIYORI | 花咲ひより | MINATO | 白石 湊 |
| 6 | HIYORI | 花咲ひより | REN | 朝霧 蓮 |
| 7 | TSUBASA | 火神つばさ | YAMATO | 黒瀬 大和 |
| 8 | TSUBASA | 火神つばさ | LEON | 神代 レオン |
| 9 | REI | 黒羽れい | SAKUYA | 九条 朔夜 |
| 10 | REI | 黒羽れい | SOMA | 御影 颯真 |
| 11 | MADOKA | 翠川まどか | RIKU | 天音 理玖 |
| 12 | MADOKA | 翠川まどか | ELLIOT | エリオット・ノクス |
| 13 | KOHARU | 風森こはる | REN | 朝霧 蓮 |
| 14 | KOHARU | 風森こはる | SAKUYA | 九条 朔夜 |
| 15 | MIRAI | 紫藤みらい | LEON | 神代 レオン |
| 16 | MIRAI | 紫藤みらい | RIKU | 天音 理玖 |
| 17 | SERA | 白峰セラ | ELLIOT | エリオット・ノクス |
| 18 | SERA | 白峰セラ | MINATO | 白石 湊 |

## 段階

| stage | 好感度目安 | 画像内容 |
| --- | ---: | --- |
| r1 | 0 | 出会い。相手の役割と第一印象を示す。 |
| r2 | 20 | 信頼。学習・学園生活で小さく協力する。 |
| r3 | 40 | 接近。放課後、休日、秘密共有で距離が縮まる。 |
| r4 | 60 | 危機。魔法少女としての危機を二人で越える。 |
| r5 | 80 | 告白/約束。恋心、使命、進路の約束を確認する。 |

## シート割り当て

| sheet | セル内容 |
| --- | --- |
| 01 | AKARI/REN r1-r5, AKARI/YAMATO r1-r4 |
| 02 | AKARI/YAMATO r5, SHIZUKU/SOMA r1-r5, SHIZUKU/RIKU r1-r3 |
| 03 | SHIZUKU/RIKU r4-r5, HIYORI/MINATO r1-r5, HIYORI/REN r1-r2 |
| 04 | HIYORI/REN r3-r5, TSUBASA/YAMATO r1-r5, TSUBASA/LEON r1 |
| 05 | TSUBASA/LEON r2-r5, REI/SAKUYA r1-r5 |
| 06 | REI/SOMA r1-r5, MADOKA/RIKU r1-r4 |
| 07 | MADOKA/RIKU r5, MADOKA/ELLIOT r1-r5, KOHARU/REN r1-r3 |
| 08 | KOHARU/REN r4-r5, KOHARU/SAKUYA r1-r5, MIRAI/LEON r1-r2 |
| 09 | MIRAI/LEON r3-r5, MIRAI/RIKU r1-r5, SERA/ELLIOT r1 |
| 10 | SERA/ELLIOT r2-r5, SERA/MINATO r1-r5 |
