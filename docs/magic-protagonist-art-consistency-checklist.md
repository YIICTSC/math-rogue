# マジック編 主人公立ち絵・イベント絵の特徴整合性チェック一覧

更新日: 2026-09-24

## 監査結果

| 対象 | 確認した表示絵 | 結果 | 再生成 |
|---|---:|---|---:|
| バカンス恋愛イベント | 72ルート × 9段階 = 648枚 | 648/648 合格 | 0枚 |
| エンドレス／真エンドレスイベント | MGE 90件 + MGEM 90件 = 180コマ | 180/180 合格 | 0枚 |

全画像で、主人公・相手役の髪色、髪型、瞳色、顔周辺の識別要素と立ち絵の対応を確認した。不一致は見つからなかったため、既存絵は変更せず、再生成も行っていない。衣装・表情・ポーズ・属性エフェクトの変化は、各モードの場面表現として許容した。

## 判定基準と立ち絵参照

以下の立ち絵参照パスは `public/sprites/magic/` を基準とする。

| 性別 | ID | 照合する主な特徴 | バカンス立ち絵 / 通常立ち絵 |
|---|---|---|---|
| 女性 | `AKARI` | 赤い高ポニーテール・星飾り・赤金の星意匠 | `vacation-characters/heroine-01-before.webp` / `characters/heroine-01-before.webp` |
| 女性 | `SHIZUKU` | 濃紺ロング・眼鏡・青銀の月意匠 | `vacation-characters/heroine-02-before.webp` / `characters/heroine-02-before.webp` |
| 女性 | `HIYORI` | 桃色ロング・柔らかな顔立ち・花の飾り | `vacation-characters/heroine-03-before.webp` / `characters/heroine-03-before.webp` |
| 女性 | `TSUBASA` | 短い橙髪・スポーティーな輪郭・炎色 | `vacation-characters/heroine-04-before.webp` / `characters/heroine-04-before.webp` |
| 女性 | `REI` | 長い黒髪・赤い瞳・深紅の差し色 | `vacation-characters/heroine-05-before.webp` / `characters/heroine-05-before.webp` |
| 女性 | `MADOKA` | ミント色のツインお団子・丸眼鏡 | `vacation-characters/heroine-06-before.webp` / `characters/heroine-06-before.webp` |
| 女性 | `KOHARU` | 長い緑の編み髪・琥珀色の瞳 | `vacation-characters/heroine-07-before.webp` / `characters/heroine-07-before.webp` |
| 女性 | `MIRAI` | 紫のウェーブ髪・サイドポニー・舞台系の飾り | `vacation-characters/heroine-08-before.webp` / `characters/heroine-08-before.webp` |
| 女性 | `SERA` | 銀白髪・金色の瞳・星界モチーフ | `vacation-characters/heroine-09-before.webp` / `characters/heroine-09-before.webp` |
| 男性 | `REN` | 灰茶の短髪・青緑の瞳・風の意匠 | `vacation-male-characters/ren-before.webp` / `male-characters/ren-before.webp` |
| 男性 | `SOMA` | 銀青の整った髪・青系の瞳・白紺の秩序／氷意匠 | `vacation-male-characters/soma-before.webp` / `male-characters/soma-before.webp` |
| 男性 | `MINATO` | 淡い水色の短髪・青系の瞳・白い首元のタオル／マフラー | `vacation-male-characters/minato-before.webp` / `male-characters/minato-before.webp` |
| 男性 | `RIKU` | ラベンダーグレーの低い結び髪・懐中時計の意匠 | `vacation-male-characters/riku-before.webp` / `male-characters/riku-before.webp` |
| 男性 | `YAMATO` | 黒髪と赤い毛先・頬の絆創膏・赤い上着 | `vacation-male-characters/yamato-before.webp` / `male-characters/yamato-before.webp` |
| 男性 | `LEON` | 金髪のウェーブ・紫の瞳・音楽／黒紫の意匠 | `vacation-male-characters/leon-before.webp` / `male-characters/leon-before.webp` |
| 男性 | `ELLIOT` | 白金髪・金色の瞳・星界の白紺意匠 | `vacation-male-characters/elliot-before.webp` / `male-characters/elliot-before.webp` |
| 男性 | `SAKUYA` | 長い黒髪と深紅の差し色・赤い瞳・黒赤の封印意匠 | `vacation-male-characters/sakuya-before.webp` / `male-characters/sakuya-before.webp` |

- バカンス恋愛イベントはバカンス用立ち絵、エンドレスイベントは通常立ち絵を基準に照合。
- 髪型・髪色・瞳色と、星飾り、眼鏡、編み髪、懐中時計、赤い毛先など見分けの軸を優先して確認。
- 画角に入らない小物は減点しない。服装・魔法演出の差だけでは不一致にしない。
- 9コマシートの表示順は左上から右へ、上段から下段。バカンスシートは個別画像との対応も照合済み。

## バカンス恋愛イベント 72ルート

画像パスは `public/sprites/magic/events/romance/vacation/` を基準とする。各ルートの表示画像9枚を確認。段階は `r1.webp`～`r5.webp`、`r6.webp`、`r6-bond.webp`、`r6-special.webp`、`r6-true.webp`。

元シートのセル対応: 1～5 = `r1`～`r5`、6 = `r6-bond`、7 = `r6-special`、8 = `r6`、9 = `r6-true`。`SERA × LEON` は元シートの切り出しではなく、9枚の個別画像を直接確認した（各 `1280×720`）。他71ルートの個別絵は元シート対応セルとの一致を確認した（各 `418×418`）。

| 女性主人公 × 男性相手役 | 確認元 | 個別表示画像の格納先 | 判定 |
|---|---|---|---|---|
| AKARI × REN | `generated-sheets/AKARI-REN.webp` | `AKARI/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × SOMA | `generated-sheets/AKARI-SOMA.webp` | `AKARI/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × MINATO | `generated-sheets/AKARI-MINATO.webp` | `AKARI/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × RIKU | `generated-sheets/AKARI-RIKU.webp` | `AKARI/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × YAMATO | `generated-sheets/AKARI-YAMATO.webp` | `AKARI/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × LEON | `generated-sheets/AKARI-LEON.webp` | `AKARI/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × ELLIOT | `generated-sheets/AKARI-ELLIOT.webp` | `AKARI/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| AKARI × SAKUYA | `generated-sheets/AKARI-SAKUYA.webp` | `AKARI/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × REN | `generated-sheets/SHIZUKU-REN.webp` | `SHIZUKU/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × SOMA | `generated-sheets/SHIZUKU-SOMA.webp` | `SHIZUKU/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × MINATO | `generated-sheets/SHIZUKU-MINATO.webp` | `SHIZUKU/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × RIKU | `generated-sheets/SHIZUKU-RIKU.webp` | `SHIZUKU/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × YAMATO | `generated-sheets/SHIZUKU-YAMATO.webp` | `SHIZUKU/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × LEON | `generated-sheets/SHIZUKU-LEON.webp` | `SHIZUKU/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × ELLIOT | `generated-sheets/SHIZUKU-ELLIOT.webp` | `SHIZUKU/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SHIZUKU × SAKUYA | `generated-sheets/SHIZUKU-SAKUYA.webp` | `SHIZUKU/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × REN | `generated-sheets/HIYORI-REN.webp` | `HIYORI/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × SOMA | `generated-sheets/HIYORI-SOMA.webp` | `HIYORI/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × MINATO | `generated-sheets/HIYORI-MINATO.webp` | `HIYORI/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × RIKU | `generated-sheets/HIYORI-RIKU.webp` | `HIYORI/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × YAMATO | `generated-sheets/HIYORI-YAMATO.webp` | `HIYORI/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × LEON | `generated-sheets/HIYORI-LEON.webp` | `HIYORI/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × ELLIOT | `generated-sheets/HIYORI-ELLIOT.webp` | `HIYORI/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| HIYORI × SAKUYA | `generated-sheets/HIYORI-SAKUYA.webp` | `HIYORI/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × REN | `generated-sheets/TSUBASA-REN.webp` | `TSUBASA/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × SOMA | `generated-sheets/TSUBASA-SOMA.webp` | `TSUBASA/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × MINATO | `generated-sheets/TSUBASA-MINATO.webp` | `TSUBASA/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × RIKU | `generated-sheets/TSUBASA-RIKU.webp` | `TSUBASA/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × YAMATO | `generated-sheets/TSUBASA-YAMATO.webp` | `TSUBASA/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × LEON | `generated-sheets/TSUBASA-LEON.webp` | `TSUBASA/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × ELLIOT | `generated-sheets/TSUBASA-ELLIOT.webp` | `TSUBASA/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| TSUBASA × SAKUYA | `generated-sheets/TSUBASA-SAKUYA.webp` | `TSUBASA/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × REN | `generated-sheets/REI-REN.webp` | `REI/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × SOMA | `generated-sheets/REI-SOMA.webp` | `REI/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × MINATO | `generated-sheets/REI-MINATO.webp` | `REI/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × RIKU | `generated-sheets/REI-RIKU.webp` | `REI/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × YAMATO | `generated-sheets/REI-YAMATO.webp` | `REI/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × LEON | `generated-sheets/REI-LEON.webp` | `REI/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × ELLIOT | `generated-sheets/REI-ELLIOT.webp` | `REI/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| REI × SAKUYA | `generated-sheets/REI-SAKUYA.webp` | `REI/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × REN | `generated-sheets/MADOKA-REN.webp` | `MADOKA/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × SOMA | `generated-sheets/MADOKA-SOMA.webp` | `MADOKA/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × MINATO | `generated-sheets/MADOKA-MINATO.webp` | `MADOKA/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × RIKU | `generated-sheets/MADOKA-RIKU.webp` | `MADOKA/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × YAMATO | `generated-sheets/MADOKA-YAMATO.webp` | `MADOKA/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × LEON | `generated-sheets/MADOKA-LEON.webp` | `MADOKA/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × ELLIOT | `generated-sheets/MADOKA-ELLIOT.webp` | `MADOKA/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MADOKA × SAKUYA | `generated-sheets/MADOKA-SAKUYA.webp` | `MADOKA/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × REN | `generated-sheets/KOHARU-REN.webp` | `KOHARU/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × SOMA | `generated-sheets/KOHARU-SOMA.webp` | `KOHARU/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × MINATO | `generated-sheets/KOHARU-MINATO.webp` | `KOHARU/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × RIKU | `generated-sheets/KOHARU-RIKU.webp` | `KOHARU/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × YAMATO | `generated-sheets/KOHARU-YAMATO.webp` | `KOHARU/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × LEON | `generated-sheets/KOHARU-LEON.webp` | `KOHARU/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × ELLIOT | `generated-sheets/KOHARU-ELLIOT.webp` | `KOHARU/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| KOHARU × SAKUYA | `generated-sheets/KOHARU-SAKUYA.webp` | `KOHARU/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × REN | `generated-sheets/MIRAI-REN.webp` | `MIRAI/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × SOMA | `generated-sheets/MIRAI-SOMA.webp` | `MIRAI/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × MINATO | `generated-sheets/MIRAI-MINATO.webp` | `MIRAI/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × RIKU | `generated-sheets/MIRAI-RIKU.webp` | `MIRAI/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × YAMATO | `generated-sheets/MIRAI-YAMATO.webp` | `MIRAI/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × LEON | `generated-sheets/MIRAI-LEON.webp` | `MIRAI/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × ELLIOT | `generated-sheets/MIRAI-ELLIOT.webp` | `MIRAI/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| MIRAI × SAKUYA | `generated-sheets/MIRAI-SAKUYA.webp` | `MIRAI/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × REN | `generated-sheets/SERA-REN.webp` | `SERA/REN/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × SOMA | `generated-sheets/SERA-SOMA.webp` | `SERA/SOMA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × MINATO | `generated-sheets/SERA-MINATO.webp` | `SERA/MINATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × RIKU | `generated-sheets/SERA-RIKU.webp` | `SERA/RIKU/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × YAMATO | `generated-sheets/SERA-YAMATO.webp` | `SERA/YAMATO/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × LEON | 個別画像を直接確認 | `SERA/LEON/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格・個別生成画像 |
| SERA × ELLIOT | `generated-sheets/SERA-ELLIOT.webp` | `SERA/ELLIOT/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |
| SERA × SAKUYA | `generated-sheets/SERA-SAKUYA.webp` | `SERA/SAKUYA/` (`r1.webp`, `r2.webp`, `r3.webp`, `r4.webp`, `r5.webp`, `r6.webp`, `r6-bond.webp`, `r6-special.webp`, `r6-true.webp`) | 9/9 合格 |

## エンドレス／真エンドレス 180イベント

画像パスは `public/sprites/magic/events/endless/` を基準とする。`MGE` は女性主人公用、`MGEM` は男性主人公用。各行のシートとセルにあるイベント絵を、そのイベントの中心人物および立ち絵の識別特徴と照合した。

| イベントID | 中心人物 | タイトル | 画像シート・セル | 判定 |
|---|---|---|---|---|
| `MGE-001` | あかり・しずく | 魔法予定表の空欄 | `character-sheets/MGE-001-009.webp`・左上 | ☑ 合格 |
| `MGE-002` | しずく・まどか | 月光の朝練メモ | `character-sheets/MGE-001-009.webp`・上中央 | ☑ 合格 |
| `MGE-003` | ひより・こはる | 花壇からの出席返事 | `character-sheets/MGE-001-009.webp`・右上 | ☑ 合格 |
| `MGE-004` | つばさ・ひより | 炎で焼けた朝食 | `character-sheets/MGE-001-009.webp`・左中央 | ☑ 合格 |
| `MGE-005` | れい・みらい | 黒板のいたずら文字 | `character-sheets/MGE-001-009.webp`・中央 | ☑ 合格 |
| `MGE-006` | まどか・しずく | 五分早いチャイム | `character-sheets/MGE-001-009.webp`・右中央 | ☑ 合格 |
| `MGE-007` | こはる・あかり | 風で飛ぶプリント | `character-sheets/MGE-001-009.webp`・左下 | ☑ 合格 |
| `MGE-008` | みらい・セラ | 舞台袖の昼休み | `character-sheets/MGE-001-009.webp`・下中央 | ☑ 合格 |
| `MGE-009` | セラ・れい | 異世界語の宿題 | `character-sheets/MGE-001-009.webp`・右下 | ☑ 合格 |
| `MGE-010` | あかり・ひより | 制服に残る魔法汚れ | `character-sheets/MGE-010-018.webp`・左上 | ☑ 合格 |
| `MGE-011` | ひより・つばさ | 透明な給食スープ | `character-sheets/MGE-010-018.webp`・上中央 | ☑ 合格 |
| `MGE-012` | あかり・セラ | 屋上の小さな星座 | `character-sheets/MGE-010-018.webp`・右上 | ☑ 合格 |
| `MGE-013` | れい・しずく | 図書室の返却魔法 | `character-sheets/MGE-010-018.webp`・左中央 | ☑ 合格 |
| `MGE-014` | こはる・まどか | 寮の洗濯物結界 | `character-sheets/MGE-010-018.webp`・中央 | ☑ 合格 |
| `MGE-015` | みらい・セラ | 消灯後の魔法ラジオ | `character-sheets/MGE-010-018.webp`・右中央 | ☑ 合格 |
| `MGE-016` | つばさ・まどか | 購買部の魔法雑貨 | `character-sheets/MGE-010-018.webp`・左下 | ☑ 合格 |
| `MGE-017` | ひより・こはる | 迷子の鍵チャーム | `character-sheets/MGE-010-018.webp`・下中央 | ☑ 合格 |
| `MGE-018` | まどか・しずく | 校門の逆さ時計 | `character-sheets/MGE-010-018.webp`・右下 | ☑ 合格 |
| `MGE-019` | しずく・ひより | 実技室の水たまり | `character-sheets/MGE-019-027.webp`・左上 | ☑ 合格 |
| `MGE-020` | あかり・つばさ | 花火のような消しゴム | `character-sheets/MGE-019-027.webp`・上中央 | ☑ 合格 |
| `MGE-021` | れい・セラ | 禁書しおりの返事 | `character-sheets/MGE-019-027.webp`・右上 | ☑ 合格 |
| `MGE-022` | セラ・あかり | 魔法陣の落とし物 | `character-sheets/MGE-019-027.webp`・左中央 | ☑ 合格 |
| `MGE-023` | こはる・しずく | 風のエレベーター | `character-sheets/MGE-019-027.webp`・中央 | ☑ 合格 |
| `MGE-024` | みらい・まどか | 夢を映す自販機 | `character-sheets/MGE-019-027.webp`・右中央 | ☑ 合格 |
| `MGE-025` | ひより・しずく | 屋上菜園の月野菜 | `character-sheets/MGE-019-027.webp`・左下 | ☑ 合格 |
| `MGE-026` | みらい・こはる | 校内放送の妖精 | `character-sheets/MGE-019-027.webp`・下中央 | ☑ 合格 |
| `MGE-027` | みらい・つばさ | 旧校舎の音楽階段 | `character-sheets/MGE-019-027.webp`・右下 | ☑ 合格 |
| `MGE-028` | あかり・みらい | 魔法写真部の一枚 | `character-sheets/MGE-028-036.webp`・左上 | ☑ 合格 |
| `MGE-029` | セラ・しずく | 星座観測会の雲 | `character-sheets/MGE-028-036.webp`・上中央 | ☑ 合格 |
| `MGE-030` | れい・まどか | 先生の魔法印鑑 | `character-sheets/MGE-028-036.webp`・右上 | ☑ 合格 |
| `MGE-031` | あかり | 星光リンクの試運転 | `character-sheets/MGE-028-036.webp`・左中央 | ☑ 合格 |
| `MGE-032` | しずく | 月鏡の水面筆記 | `character-sheets/MGE-028-036.webp`・中央 | ☑ 合格 |
| `MGE-033` | ひより | 花の治癒温室 | `character-sheets/MGE-028-036.webp`・右中央 | ☑ 合格 |
| `MGE-034` | つばさ | 炎の温度テスト | `character-sheets/MGE-028-036.webp`・左下 | ☑ 合格 |
| `MGE-035` | れい | 影札の名前付け | `character-sheets/MGE-028-036.webp`・下中央 | ☑ 合格 |
| `MGE-036` | まどか | 時環の五分間 | `character-sheets/MGE-028-036.webp`・右下 | ☑ 合格 |
| `MGE-037` | こはる | 風精霊の迷子 | `character-sheets/MGE-037-045.webp`・左上 | ☑ 合格 |
| `MGE-038` | みらい | 夢の舞台稽古 | `character-sheets/MGE-037-045.webp`・上中央 | ☑ 合格 |
| `MGE-039` | セラ | 光術の発音練習 | `character-sheets/MGE-037-045.webp`・右上 | ☑ 合格 |
| `MGE-040` | 9人全員 | 九属性合同実技 | `character-sheets/MGE-037-045.webp`・左中央 | ☑ 合格 |
| `MGE-041` | あかり・つばさ | 変身後の靴ひも | `character-sheets/MGE-037-045.webp`・中央 | ☑ 合格 |
| `MGE-042` | しずく・まどか | 魔法カードの手触り | `character-sheets/MGE-037-045.webp`・右中央 | ☑ 合格 |
| `MGE-043` | ひより・れい | 結界の穴を縫う | `character-sheets/MGE-037-045.webp`・左下 | ☑ 合格 |
| `MGE-044` | セラ・こはる | 敵の残響を聞く | `character-sheets/MGE-037-045.webp`・下中央 | ☑ 合格 |
| `MGE-045` | 主人公・全員 | 魔力切れの帰り道 | `character-sheets/MGE-037-045.webp`・右下 | ☑ 合格 |
| `MGE-046` | ひより・こはる | 使い魔の朝食会 | `character-sheets/MGE-046-054.webp`・左上 | ☑ 合格 |
| `MGE-047` | あかり・みらい | 使い魔の名札迷子 | `character-sheets/MGE-046-054.webp`・上中央 | ☑ 合格 |
| `MGE-048` | れい・まどか | 使い魔の交換日誌 | `character-sheets/MGE-046-054.webp`・右上 | ☑ 合格 |
| `MGE-049` | こはる・セラ | 精霊樹の落ち葉便り | `character-sheets/MGE-046-054.webp`・左中央 | ☑ 合格 |
| `MGE-050` | みらい・つばさ | 変身ポーズ投票 | `character-sheets/MGE-046-054.webp`・中央 | ☑ 合格 |
| `MGE-051` | つばさ・しずく | 魔法商店街の値札 | `character-sheets/MGE-046-054.webp`・右中央 | ☑ 合格 |
| `MGE-052` | あかり・ひより | 星菓子店の試食 | `character-sheets/MGE-046-054.webp`・左下 | ☑ 合格 |
| `MGE-053` | しずく・セラ | 月灯りの路面電車 | `character-sheets/MGE-046-054.webp`・下中央 | ☑ 合格 |
| `MGE-054` | みらい・れい | 夢映画館の予告編 | `character-sheets/MGE-046-054.webp`・右下 | ☑ 合格 |
| `MGE-055` | こはる・まどか | 雨宿りの結界傘 | `character-sheets/MGE-055-063.webp`・左上 | ☑ 合格 |
| `MGE-056` | つばさ・あかり | 夏祭りの術式屋台 | `character-sheets/MGE-055-063.webp`・上中央 | ☑ 合格 |
| `MGE-057` | セラ・れい | 学園新聞の一面 | `character-sheets/MGE-055-063.webp`・右上 | ☑ 合格 |
| `MGE-058` | れい・ひより | 休日の魔法図書交換 | `character-sheets/MGE-055-063.webp`・左中央 | ☑ 合格 |
| `MGE-059` | こはる・つばさ | 雪だるまの魔力核 | `character-sheets/MGE-055-063.webp`・中央 | ☑ 合格 |
| `MGE-060` | セラ・まどか | 伝言を運ぶ星鳥 | `character-sheets/MGE-055-063.webp`・右中央 | ☑ 合格 |
| `MGE-061` | まどか・あかり | 反復する朝のチャイム | `character-sheets/MGE-055-063.webp`・左下 | ☑ 合格 |
| `MGE-062` | れい・セラ | 黒帳の落書き | `character-sheets/MGE-055-063.webp`・下中央 | ☑ 合格 |
| `MGE-063` | しずく・まどか | 消えない答案の赤線 | `character-sheets/MGE-055-063.webp`・右下 | ☑ 合格 |
| `MGE-064` | ひより・こはる | 使われていない教室 | `character-sheets/MGE-064-072.webp`・左上 | ☑ 合格 |
| `MGE-065` | あかり・れい | 名前を忘れた魔法陣 | `character-sheets/MGE-064-072.webp`・上中央 | ☑ 合格 |
| `MGE-066` | みらい・セラ | ノイズの混じる校内放送 | `character-sheets/MGE-064-072.webp`・右上 | ☑ 合格 |
| `MGE-067` | しずく・こはる | 逆さに流れる噴水 | `character-sheets/MGE-064-072.webp`・左中央 | ☑ 合格 |
| `MGE-068` | セラ・あかり | 廊下の向こうの星界窓 | `character-sheets/MGE-064-072.webp`・中央 | ☑ 合格 |
| `MGE-069` | れい・つばさ | 影だけ遅れる | `character-sheets/MGE-064-072.webp`・右中央 | ☑ 合格 |
| `MGE-070` | みらい・ひより | 夢の中の非常階段 | `character-sheets/MGE-064-072.webp`・左下 | ☑ 合格 |
| `MGE-071` | あかり・れい | 黒帳機関の配達票 | `character-sheets/MGE-064-072.webp`・下中央 | ☑ 合格 |
| `MGE-072` | まどか・9人全員 | 破れた変身記録 | `character-sheets/MGE-064-072.webp`・右下 | ☑ 合格 |
| `MGE-073` | しずく・ひより | 封じられた学習机 | `character-sheets/MGE-073-081.webp`・左上 | ☑ 合格 |
| `MGE-074` | れい・セラ | 深層図書館の返却期限 | `character-sheets/MGE-073-081.webp`・上中央 | ☑ 合格 |
| `MGE-075` | 9人全員 | もう一度だけの放課後 | `character-sheets/MGE-073-081.webp`・右上 | ☑ 合格 |
| `MGE-076` | あかり | 51回目の朝 | `character-sheets/MGE-073-081.webp`・左中央 | ☑ 合格 |
| `MGE-077` | まどか・しずく | 章のない時間割 | `character-sheets/MGE-073-081.webp`・中央 | ☑ 合格 |
| `MGE-078` | こはる・セラ | 空に浮く学園の影 | `character-sheets/MGE-073-081.webp`・右中央 | ☑ 合格 |
| `MGE-079` | セラ・あかり | 逆向きの星座 | `character-sheets/MGE-073-081.webp`・左下 | ☑ 合格 |
| `MGE-080` | 9人全員 | 全員分の空席 | `character-sheets/MGE-073-081.webp`・下中央 | ☑ 合格 |
| `MGE-081` | つばさ・ひより | 魔法のない一分間 | `character-sheets/MGE-073-081.webp`・右下 | ☑ 合格 |
| `MGE-082` | れい・セラ | 黒帳の観測者 | `character-sheets/MGE-082-090.webp`・左上 | ☑ 合格 |
| `MGE-083` | みらい | 夢の中の真エンドロール | `character-sheets/MGE-082-090.webp`・上中央 | ☑ 合格 |
| `MGE-084` | 9属性全員 | 消えた属性色 | `character-sheets/MGE-082-090.webp`・右上 | ☑ 合格 |
| `MGE-085` | セラ | 星界からの返事 | `character-sheets/MGE-082-090.webp`・左中央 | ☑ 合格 |
| `MGE-086` | あかり・まどか | ループの外の購買部 | `character-sheets/MGE-082-090.webp`・中央 | ☑ 合格 |
| `MGE-087` | こはる・れい | 学園地下の未登録扉 | `character-sheets/MGE-082-090.webp`・右中央 | ☑ 合格 |
| `MGE-088` | 9人全員 | 九人の魔法陣 | `character-sheets/MGE-082-090.webp`・左下 | ☑ 合格 |
| `MGE-089` | 9人全員 | ノクスの記録片 | `character-sheets/MGE-082-090.webp`・下中央 | ☑ 合格 |
| `MGE-090` | 9人全員 | 明日を選ぶ鐘 | `character-sheets/MGE-082-090.webp`・右下 | ☑ 合格 |
| `MGEM-001` | 蓮 | 風でほどける靴ひも | `character-sheets/MGEM-001-009.webp`・左上 | ☑ 合格 |
| `MGEM-002` | 颯真 | 生徒会長室の凍った印 | `character-sheets/MGEM-001-009.webp`・上中央 | ☑ 合格 |
| `MGEM-003` | 湊 | 水槽の居残り魚 | `character-sheets/MGEM-001-009.webp`・右上 | ☑ 合格 |
| `MGEM-004` | 理玖 | 一年遅れの部活動申請 | `character-sheets/MGEM-001-009.webp`・左中央 | ☑ 合格 |
| `MGEM-005` | 大和 | 壊れたロッカーの拳跡 | `character-sheets/MGEM-001-009.webp`・中央 | ☑ 合格 |
| `MGEM-006` | レオン | 音楽室の勝負宣言 | `character-sheets/MGEM-001-009.webp`・右中央 | ☑ 合格 |
| `MGEM-007` | エリオット | 転校届のない席 | `character-sheets/MGEM-001-009.webp`・左下 | ☑ 合格 |
| `MGEM-008` | 朔夜 | 放課後の封印清掃 | `character-sheets/MGEM-001-009.webp`・下中央 | ☑ 合格 |
| `MGEM-009` | 蓮・あかり | 幼なじみの交換日記 | `character-sheets/MGEM-001-009.webp`・右下 | ☑ 合格 |
| `MGEM-010` | 颯真・しずく | 生徒会議の二重議事録 | `character-sheets/MGEM-010-018.webp`・左上 | ☑ 合格 |
| `MGEM-011` | 湊・ひより | 保健室前の水滴 | `character-sheets/MGEM-010-018.webp`・上中央 | ☑ 合格 |
| `MGEM-012` | 理玖・まどか | 先輩の置き時計 | `character-sheets/MGEM-010-018.webp`・右上 | ☑ 合格 |
| `MGEM-013` | 大和・つばさ | 体育倉庫の炎球 | `character-sheets/MGEM-010-018.webp`・左中央 | ☑ 合格 |
| `MGEM-014` | レオン・みらい | 音のない発表会 | `character-sheets/MGEM-010-018.webp`・中央 | ☑ 合格 |
| `MGEM-015` | エリオット・セラ | 星界式の出欠 | `character-sheets/MGEM-010-018.webp`・右中央 | ☑ 合格 |
| `MGEM-016` | 蓮・こはる | 風の通学路 | `character-sheets/MGEM-010-018.webp`・左下 | ☑ 合格 |
| `MGEM-017` | 颯真・セラ | 校則を書き換える雪 | `character-sheets/MGEM-010-018.webp`・下中央 | ☑ 合格 |
| `MGEM-018` | 湊・ひより | 水路の迷子 | `character-sheets/MGEM-010-018.webp`・右下 | ☑ 合格 |
| `MGEM-019` | 理玖・みらい | 夕方が来ない中庭 | `character-sheets/MGEM-019-027.webp`・左上 | ☑ 合格 |
| `MGEM-020` | 大和・つばさ | 購買部の焦げたパン | `character-sheets/MGEM-019-027.webp`・上中央 | ☑ 合格 |
| `MGEM-021` | レオン・しずく | 音程を測る月鏡 | `character-sheets/MGEM-019-027.webp`・右上 | ☑ 合格 |
| `MGEM-022` | エリオット・れい | 図書室の返却鍵 | `character-sheets/MGEM-019-027.webp`・左中央 | ☑ 合格 |
| `MGEM-023` | 朔夜・れい | 旧礼拝堂の二重封印 | `character-sheets/MGEM-019-027.webp`・中央 | ☑ 合格 |
| `MGEM-024` | 蓮・あかり・こはる | 風の応援旗 | `character-sheets/MGEM-019-027.webp`・右中央 | ☑ 合格 |
| `MGEM-025` | 颯真・まどか | 生徒会倉庫の停止時計 | `character-sheets/MGEM-019-027.webp`・左下 | ☑ 合格 |
| `MGEM-026` | 湊・セラ | 水面に映る別校舎 | `character-sheets/MGEM-019-027.webp`・下中央 | ☑ 合格 |
| `MGEM-027` | 理玖・しずく | 講義室の空席番号 | `character-sheets/MGEM-019-027.webp`・右下 | ☑ 合格 |
| `MGEM-028` | 大和・ひより | 屋上の保護柵 | `character-sheets/MGEM-028-036.webp`・左上 | ☑ 合格 |
| `MGEM-029` | レオン・みらい | 文化祭の無音舞台 | `character-sheets/MGEM-028-036.webp`・上中央 | ☑ 合格 |
| `MGEM-030` | エリオット・セラ | 図工室の星砂 | `character-sheets/MGEM-028-036.webp`・右上 | ☑ 合格 |
| `MGEM-031` | 蓮 | 風壁の守備訓練 | `character-sheets/MGEM-028-036.webp`・左中央 | ☑ 合格 |
| `MGEM-032` | 颯真 | 氷律の行列 | `character-sheets/MGEM-028-036.webp`・中央 | ☑ 合格 |
| `MGEM-033` | 湊 | 水治癒のタイムリミット | `character-sheets/MGEM-028-036.webp`・右中央 | ☑ 合格 |
| `MGEM-034` | 理玖 | 未来を観測する黒板 | `character-sheets/MGEM-028-036.webp`・左下 | ☑ 合格 |
| `MGEM-035` | 大和 | 炎拳の力加減 | `character-sheets/MGEM-028-036.webp`・下中央 | ☑ 合格 |
| `MGEM-036` | レオン | 幻奏の二重詠唱 | `character-sheets/MGEM-028-036.webp`・右下 | ☑ 合格 |
| `MGEM-037` | エリオット | 星界座標の誤差 | `character-sheets/MGEM-037-045.webp`・左上 | ☑ 合格 |
| `MGEM-038` | 朔夜 | 封印の余白 | `character-sheets/MGEM-037-045.webp`・上中央 | ☑ 合格 |
| `MGEM-039` | 蓮・つばさ | 風と炎の合同走 | `character-sheets/MGEM-037-045.webp`・右上 | ☑ 合格 |
| `MGEM-040` | 颯真・しずく | 月氷の反射試験 | `character-sheets/MGEM-037-045.webp`・左中央 | ☑ 合格 |
| `MGEM-041` | 湊・ひより | 治癒水の分配 | `character-sheets/MGEM-037-045.webp`・中央 | ☑ 合格 |
| `MGEM-042` | 理玖・まどか | ずれる秒針の実験 | `character-sheets/MGEM-037-045.webp`・右中央 | ☑ 合格 |
| `MGEM-043` | 大和・あかり | 星火の連携 | `character-sheets/MGEM-037-045.webp`・左下 | ☑ 合格 |
| `MGEM-044` | レオン・みらい | 幻舞台の観客 | `character-sheets/MGEM-037-045.webp`・下中央 | ☑ 合格 |
| `MGEM-045` | 朔夜・れい | 影札の裏面 | `character-sheets/MGEM-037-045.webp`・右下 | ☑ 合格 |
| `MGEM-046` | 蓮・こはる | 精霊犬の散歩 | `character-sheets/MGEM-046-054.webp`・左上 | ☑ 合格 |
| `MGEM-047` | 颯真・しずく | 氷菓の保存魔法 | `character-sheets/MGEM-046-054.webp`・上中央 | ☑ 合格 |
| `MGEM-048` | 湊・ひより | 水辺の使い魔診療 | `character-sheets/MGEM-046-054.webp`・右上 | ☑ 合格 |
| `MGEM-049` | 理玖・まどか | 古時計店の一分 | `character-sheets/MGEM-046-054.webp`・左中央 | ☑ 合格 |
| `MGEM-050` | 大和・つばさ | 魔法街の腕相撲 | `character-sheets/MGEM-046-054.webp`・中央 | ☑ 合格 |
| `MGEM-051` | レオン・みらい | 幻術映画館 | `character-sheets/MGEM-046-054.webp`・右中央 | ☑ 合格 |
| `MGEM-052` | エリオット・セラ | 星界市場の切符 | `character-sheets/MGEM-046-054.webp`・左下 | ☑ 合格 |
| `MGEM-053` | 朔夜・れい | 夜市の封印札 | `character-sheets/MGEM-046-054.webp`・下中央 | ☑ 合格 |
| `MGEM-054` | 蓮・あかり | 雨宿りの風屋根 | `character-sheets/MGEM-046-054.webp`・右下 | ☑ 合格 |
| `MGEM-055` | 颯真・生徒会 | 大掃除の雪像 | `character-sheets/MGEM-055-063.webp`・左上 | ☑ 合格 |
| `MGEM-056` | 湊・こはる | 夏の水路 | `character-sheets/MGEM-055-063.webp`・上中央 | ☑ 合格 |
| `MGEM-057` | 理玖・セラ | 流星の届く商店街 | `character-sheets/MGEM-055-063.webp`・右上 | ☑ 合格 |
| `MGEM-058` | 大和・ひより | 秋祭りの火守り | `character-sheets/MGEM-055-063.webp`・左中央 | ☑ 合格 |
| `MGEM-059` | レオン・セラ | 冬の音符灯 | `character-sheets/MGEM-055-063.webp`・中央 | ☑ 合格 |
| `MGEM-060` | エリオット・朔夜 | 季節外れの星門 | `character-sheets/MGEM-055-063.webp`・右中央 | ☑ 合格 |
| `MGEM-061` | 蓮・颯真 | 二つの出席簿 | `character-sheets/MGEM-055-063.webp`・左下 | ☑ 合格 |
| `MGEM-062` | 颯真・理玖 | 生徒会の存在しない議事室 | `character-sheets/MGEM-055-063.webp`・下中央 | ☑ 合格 |
| `MGEM-063` | 湊・エリオット | 水底の校章 | `character-sheets/MGEM-055-063.webp`・右下 | ☑ 合格 |
| `MGEM-064` | 理玖・まどか | 進まない五分 | `character-sheets/MGEM-064-072.webp`・左上 | ☑ 合格 |
| `MGEM-065` | 大和・朔夜 | 破れた訓練標 | `character-sheets/MGEM-064-072.webp`・上中央 | ☑ 合格 |
| `MGEM-066` | レオン・れい | 誰もいない合唱室 | `character-sheets/MGEM-064-072.webp`・右上 | ☑ 合格 |
| `MGEM-067` | エリオット・セラ | 星界から逆流する校内地図 | `character-sheets/MGEM-064-072.webp`・左中央 | ☑ 合格 |
| `MGEM-068` | 朔夜・れい | 黒帳の空白名簿 | `character-sheets/MGEM-064-072.webp`・中央 | ☑ 合格 |
| `MGEM-069` | 蓮・こはる | 風のない地下庭 | `character-sheets/MGEM-064-072.webp`・右中央 | ☑ 合格 |
| `MGEM-070` | 颯真・しずく | 氷壁の向こうの解答 | `character-sheets/MGEM-064-072.webp`・左下 | ☑ 合格 |
| `MGEM-071` | 湊・ひより | 治癒水に残る声 | `character-sheets/MGEM-064-072.webp`・下中央 | ☑ 合格 |
| `MGEM-072` | 理玖・みらい | 眠らない夢時計 | `character-sheets/MGEM-064-072.webp`・右下 | ☑ 合格 |
| `MGEM-073` | 大和・つばさ | 消えない炎拳の跡 | `character-sheets/MGEM-073-081.webp`・左上 | ☑ 合格 |
| `MGEM-074` | レオン・みらい | 無観客の最終公演 | `character-sheets/MGEM-073-081.webp`・上中央 | ☑ 合格 |
| `MGEM-075` | エリオット・朔夜 | 転校生と敵幹部の記録 | `character-sheets/MGEM-073-081.webp`・右上 | ☑ 合格 |
| `MGEM-076` | 蓮・あかり | 51回目の通学路 | `character-sheets/MGEM-073-081.webp`・左中央 | ☑ 合格 |
| `MGEM-077` | 颯真・しずく | 章番号のない議会 | `character-sheets/MGEM-073-081.webp`・中央 | ☑ 合格 |
| `MGEM-078` | 湊・ひより | 海のない水曜日 | `character-sheets/MGEM-073-081.webp`・右中央 | ☑ 合格 |
| `MGEM-079` | 理玖・まどか | 時計塔の外側 | `character-sheets/MGEM-073-081.webp`・左下 | ☑ 合格 |
| `MGEM-080` | 大和・つばさ | 明日のない勝負場 | `character-sheets/MGEM-073-081.webp`・下中央 | ☑ 合格 |
| `MGEM-081` | レオン・みらい | 夢の観客席からの拍手 | `character-sheets/MGEM-073-081.webp`・右下 | ☑ 合格 |
| `MGEM-082` | エリオット・セラ | 星界の返送便 | `character-sheets/MGEM-082-090.webp`・左上 | ☑ 合格 |
| `MGEM-083` | 朔夜・れい | 黒帳の観測窓 | `character-sheets/MGEM-082-090.webp`・上中央 | ☑ 合格 |
| `MGEM-084` | 男子8人 | 男子寮にない部屋 | `character-sheets/MGEM-082-090.webp`・右上 | ☑ 合格 |
| `MGEM-085` | 湊・大和 | 属性のない魔力試合 | `character-sheets/MGEM-082-090.webp`・左中央 | ☑ 合格 |
| `MGEM-086` | 理玖・エリオット | 記録者の名前の空欄 | `character-sheets/MGEM-082-090.webp`・中央 | ☑ 合格 |
| `MGEM-087` | レオン・朔夜 | 真逆の詠唱 | `character-sheets/MGEM-082-090.webp`・右中央 | ☑ 合格 |
| `MGEM-088` | 男子8人 | 男子8人の無音結界 | `character-sheets/MGEM-082-090.webp`・左下 | ☑ 合格 |
| `MGEM-089` | 男子8人 | ノクスの記録片 | `character-sheets/MGEM-082-090.webp`・下中央 | ☑ 合格 |
| `MGEM-090` | 男子8人 | 男子寮の明日を選ぶ鐘 | `character-sheets/MGEM-082-090.webp`・右下 | ☑ 合格 |

## 素材点検

- バカンス恋愛: 72ルート・648枚の表示画像が存在。72枚の生成元シートも確認（SERA×LEONのみ個別生成画像を正とし、シートを切り出し元として扱わない）。
- エンドレス: `MGE` 10枚・`MGEM` 10枚の計20枚のシートを確認。すべて `1254×1254` で、各シート9コマのID順は一覧のセル位置に一致。
- この監査で追加・再生成した画像: 0枚。不一致がないため差し替えなし。
