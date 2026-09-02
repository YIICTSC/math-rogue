# エンドレスモード 導入序章・真エンディング 画像／本文 整合性確認票

確認日: 2026-09-02
対象: エンドレスモードの導入時エピローグ（`OPENING`）と50階到達後のエンディング（`TRUE`）
目的: 各編・各主人公について、表示される文章、主人公、場面、小道具、画像ファイルの対応を継続的に確認・修正する。

本文の修正案（全主人公分）: [`endless-ending-copy-revision.md`](./endless-ending-copy-revision.md)

## 判定記号

- `OK`: 確認済み。文章と画像の主題・主人公・場面が一致している。
- `△`: 一部一致。主題は合っているが、小道具・年齢・テーマ・ページ展開に確認または修正が必要。
- `要修正`: 不一致を確認済み。本文または画像の修正が必要。
- `未確認`: 画像を開いてのページ単位の目視確認が未完了。
- `機械OK`: ファイルの存在・枚数・画像形式・サイズのみ確認済み。内容の一致を保証しない。

## 修正前実装の確認結果（履歴）

### 機械的な確認

- [x] `OPENING` と `TRUE` は、それぞれ3ページで構成されている。
- [x] 日本語・ひらがな・英語のタイトルと本文フィールドが定義されている。
- [x] 3編・35主人公枠に対して、導入3枚＋真エンディング3枚の合計210枚が存在する。
- [x] 210枚すべてがWebP、1280×720である。
- [x] 現在の想定パスに対する欠落ファイルは0枚である。
- [ ] 210枚すべての画像を開き、文章の具体的な主語・小道具・場所・行動と照合する。

### 重要な実装上の注意

修正前の `getEndlessEndingSequence` は、本文を `characterId`（9種類の役割ID）から取得し、`theme` によって主に画像パスだけを切り替えていた。以下の指摘は、その時点の履歴である。

そのため、以下は現時点で確認済みの要修正候補である。

| ID | 判定 | 対象 | 内容 | 対応方針 |
|---|---|---|---|---|
| E-01 | `△` | 高校編 WARRIOR | `opening-1` は高校生が校門を走る絵だが、本文は「赤い帽子」を明示している。 | 高校編用の本文では赤い帽子を使わない、または画像側に対応する帽子を追加する。 |
| E-02 | `△` | 高校編 BARD | `opening-1` は屋上アンテナを調整する場面だが、本文は黄色いマイクを明示している。 | 「アンテナ」「電波」「放送設備」など画像にある要素へ本文を合わせる。 |
| E-03 | `要修正` | マジック編 女性主人公9人 | 画像は魔法属性ごとの主人公だが、本文は赤い帽子、動物小屋、黒いスカーフ、オレンジのボールなど学園役割テンプレートのままである。 | マジック主人公ID・属性・固有能力を参照する本文へ分離する。 |
| E-04 | `要修正` | マジック編 男性主人公8人 | 例: RENの魔法衣装・水流の画像に対し、本文はWARRIORの「赤い帽子」文を表示する。 | 男性主人公ごとの本文を追加し、ベース役割文をフォールバック専用にする。 |
| E-05 | `要修正` | CARETAKER ひらがな | `観察ノート` がタイトル・本文で `かんさつのおと` になっており、「音」と読める。 | `かんさつノート` またはプロジェクトの表記規則に合わせた正しい読みへ修正する。 |

## 修正後の実装確認（2026-09-02）

- [x] `src/data/endlessEndingCopyRevision.ts` に35主人公×6場面＝210場面の本文と固有セリフを登録した。
- [x] `theme` と `magicProtagonistId` で、小学生編・高校編・マジック編女性／男性の本文と画像キーを分離した。
- [x] 固有セリフを本文とは別表示し、主人公名を付けて表示する。
- [x] マジック編女性主人公のIDを導入・エンディング画面へ渡すようにした。
- [x] E-01〜E-05の本文側の不一致を修正案へ反映した。
- [ ] 210枚すべての画像を開き、各本文・固有セリフとの最終目視照合を完了する。

### 文章と画像のスポット確認

- `public/sprites/endless-endings/warrior/opening-1.webp`: 小学生の赤い帽子・校門が本文と一致する。`OK` の基準例。
- `public/sprites/endless-endings/high-school/warrior/opening-1.webp`: 高校生・校門は一致するが、赤い帽子は見当たらない。`E-01` の例。
- `public/sprites/endless-endings/high-school/caretaker/opening-1.webp`: 鳥・飼育道具・観察の場面は本文と概ね一致する。
- `public/sprites/endless-endings/high-school/dodgeball/opening-1.webp`: バスケットボールの画像であり、本文の「オレンジのボール」は競技種目の差を含めて確認が必要。
- `public/sprites/endless-endings/magic/warrior/opening-1.webp`: 星属性の魔法少女と杖の画像で、WARRIOR本文の赤い帽子とは一致しない。
- `public/sprites/endless-endings/magic/male/ren/opening-1.webp`: 男性魔法主人公と風・水系の演出で、WARRIOR本文の赤い帽子とは一致しない。

## 本文の基準となる役割モチーフ

以下は現在の `HERO_ENDING_COPY` と `HERO_LINES` が想定している文章モチーフである。画像確認時は、各ページでこのモチーフが実際に描かれているかを確認する。

| 本文ID | `OPENING` の主な要素 | `TRUE` の主な要素 |
|---|---|---|
| `WARRIOR` | 校門、赤い帽子、教室、終わらない道、先頭を走る | 海辺の作戦会議、かき氷、仲間、再出発 |
| `CARETAKER` | 飼育小屋、羽根、動物、観察ノート、命の記録 | 海辺の保護区、助かった命、観察ノート、帰宅 |
| `ASSASSIN` | 静かなホーム、黒いスカーフ、影、列車、自分で選ぶ道 | カフェ、カメラ、秘密ではない日常、夕暮れの光 |
| `DODGEBALL` | 体育館、オレンジのボール、走る、階段、ブザー | 浜辺のコート、パス、仲間、次の一球 |
| `BARD` | 放送室、黄色いマイク、声、校内放送、オンエア | 海辺のラジオ局、マイク、番組、仲間の声 |
| `LIBRARIAN` | 図書室、本、しおり、記録、次の一冊 | 海風、ページ、書店カフェ、物語の続き |
| `CHEF` | 厨房、ピンクのおたま、鍋、湯気、仕込み | 浜辺のバーベキュー、市場、食材、みんなで食べる |
| `GARDENER` | 温室、若葉、種、芽、土、階段 | ひまわりの丘、森、種、次の季節を育てる |
| `MAGE` | 実験室、青いフラスコ、反応式、星型の火花、仮説 | 観測所、流星、フラスコ、好奇心、自由な学び |

## 主人公対応表

`characterId` は共通のベース役割、マジック編の名前は実際に表示される主人公名を示す。

| ベースID | 小学生編 | 高校編 | マジック編 女性 | マジック編 男性 |
|---|---|---|---|---|
| `WARRIOR` | わんぱく小学生 | 反逆の高校生 | `AKARI` 星宮あかり | `REN` 朝霧 蓮 |
| `CARETAKER` | 飼育委員 | 生物部の先輩 | `SHIZUKU` 水城しずく | `SOMA` 御影 颯真 |
| `ASSASSIN` | 転校生 | 謎めく転入生 | `HIYORI` 花咲ひより | `MINATO` 白石 湊 |
| `DODGEBALL` | ドッジボールのエース | バスケ部エース | `REI` 黒羽れい | `YAMATO` 黒瀬 大和 |
| `BARD` | 放送委員 | 放送部ディレクター | `MADOKA` 翠川まどか | `LEON` 神代 レオン |
| `LIBRARIAN` | 図書委員 | 文芸部書記 | `KOHARU` 風森こはる | `ELLIOT` エリオット・ノクス |
| `CHEF` | 給食当番リーダー | 学食の料理長 | `MIRAI` 紫藤みらい | `SAKUYA` 九条 朔夜 |
| `GARDENER` | 園芸委員 | 園芸部部長 | `SERA` 白峰セラ | —（男性選択肢なし） |
| `MAGE` | 理科クラブ部長 | 化学研究会長 | `TSUBASA` 火神つばさ | `RIKU` 天音 理玖 |

### 対応確認項目

- [ ] ベースIDと画面上の主人公名が一致している。
- [ ] 画像内の髪型・髪色・衣装・年齢感が選択中の主人公と一致している。
- [ ] マジック編は属性、武器・道具、固有能力が本文と一致している。
- [ ] 男性主人公は女性主人公用の役割文を流用していない。
- [ ] 主人公の性別を限定する一人称・呼称が、実際の主人公と一致している。

## ページ別画像確認一覧

各セルの `O1`〜`O3` は導入序章の1〜3ページ、`T1`〜`T3` は真エンディングの1〜3ページを示す。画像リンクを開いて、本文と照合した後に `□` を `✅`、`△`、`❌` のいずれかへ置き換える。

### 小学生編

画像ルート: `public/sprites/endless-endings/{role}/`

| 主人公 | 本文ID | O1 | O2 | O3 | T1 | T2 | T3 | 初期判定 |
|---|---|---|---|---|---|---|---|---|
| わんぱく小学生 | `WARRIOR` | □ [O1](../public/sprites/endless-endings/warrior/opening-1.webp) | □ [O2](../public/sprites/endless-endings/warrior/opening-2.webp) | □ [O3](../public/sprites/endless-endings/warrior/opening-3.webp) | □ [T1](../public/sprites/endless-endings/warrior/true-1.webp) | □ [T2](../public/sprites/endless-endings/warrior/true-2.webp) | □ [T3](../public/sprites/endless-endings/warrior/true-3.webp) | 機械OK / 内容未確認 |
| 飼育委員 | `CARETAKER` | □ [O1](../public/sprites/endless-endings/caretaker/opening-1.webp) | □ [O2](../public/sprites/endless-endings/caretaker/opening-2.webp) | □ [O3](../public/sprites/endless-endings/caretaker/opening-3.webp) | □ [T1](../public/sprites/endless-endings/caretaker/true-1.webp) | □ [T2](../public/sprites/endless-endings/caretaker/true-2.webp) | □ [T3](../public/sprites/endless-endings/caretaker/true-3.webp) | 機械OK / 内容未確認 |
| 転校生 | `ASSASSIN` | □ [O1](../public/sprites/endless-endings/assassin/opening-1.webp) | □ [O2](../public/sprites/endless-endings/assassin/opening-2.webp) | □ [O3](../public/sprites/endless-endings/assassin/opening-3.webp) | □ [T1](../public/sprites/endless-endings/assassin/true-1.webp) | □ [T2](../public/sprites/endless-endings/assassin/true-2.webp) | □ [T3](../public/sprites/endless-endings/assassin/true-3.webp) | 機械OK / 内容未確認 |
| ドッジボールのエース | `DODGEBALL` | □ [O1](../public/sprites/endless-endings/dodgeball/opening-1.webp) | □ [O2](../public/sprites/endless-endings/dodgeball/opening-2.webp) | □ [O3](../public/sprites/endless-endings/dodgeball/opening-3.webp) | □ [T1](../public/sprites/endless-endings/dodgeball/true-1.webp) | □ [T2](../public/sprites/endless-endings/dodgeball/true-2.webp) | □ [T3](../public/sprites/endless-endings/dodgeball/true-3.webp) | 機械OK / 内容未確認 |
| 放送委員 | `BARD` | □ [O1](../public/sprites/endless-endings/bard/opening-1.webp) | □ [O2](../public/sprites/endless-endings/bard/opening-2.webp) | □ [O3](../public/sprites/endless-endings/bard/opening-3.webp) | □ [T1](../public/sprites/endless-endings/bard/true-1.webp) | □ [T2](../public/sprites/endless-endings/bard/true-2.webp) | □ [T3](../public/sprites/endless-endings/bard/true-3.webp) | 機械OK / 内容未確認 |
| 図書委員 | `LIBRARIAN` | □ [O1](../public/sprites/endless-endings/librarian/opening-1.webp) | □ [O2](../public/sprites/endless-endings/librarian/opening-2.webp) | □ [O3](../public/sprites/endless-endings/librarian/opening-3.webp) | □ [T1](../public/sprites/endless-endings/librarian/true-1.webp) | □ [T2](../public/sprites/endless-endings/librarian/true-2.webp) | □ [T3](../public/sprites/endless-endings/librarian/true-3.webp) | 機械OK / 内容未確認 |
| 給食当番リーダー | `CHEF` | □ [O1](../public/sprites/endless-endings/chef/opening-1.webp) | □ [O2](../public/sprites/endless-endings/chef/opening-2.webp) | □ [O3](../public/sprites/endless-endings/chef/opening-3.webp) | □ [T1](../public/sprites/endless-endings/chef/true-1.webp) | □ [T2](../public/sprites/endless-endings/chef/true-2.webp) | □ [T3](../public/sprites/endless-endings/chef/true-3.webp) | 機械OK / 内容未確認 |
| 園芸委員 | `GARDENER` | □ [O1](../public/sprites/endless-endings/gardener/opening-1.webp) | □ [O2](../public/sprites/endless-endings/gardener/opening-2.webp) | □ [O3](../public/sprites/endless-endings/gardener/opening-3.webp) | □ [T1](../public/sprites/endless-endings/gardener/true-1.webp) | □ [T2](../public/sprites/endless-endings/gardener/true-2.webp) | □ [T3](../public/sprites/endless-endings/gardener/true-3.webp) | 機械OK / 内容未確認 |
| 理科クラブ部長 | `MAGE` | □ [O1](../public/sprites/endless-endings/mage/opening-1.webp) | □ [O2](../public/sprites/endless-endings/mage/opening-2.webp) | □ [O3](../public/sprites/endless-endings/mage/opening-3.webp) | □ [T1](../public/sprites/endless-endings/mage/true-1.webp) | □ [T2](../public/sprites/endless-endings/mage/true-2.webp) | □ [T3](../public/sprites/endless-endings/mage/true-3.webp) | 機械OK / 内容未確認 |

### 高校編

画像ルート: `public/sprites/endless-endings/high-school/{role}/`

| 主人公 | 本文ID | O1 | O2 | O3 | T1 | T2 | T3 | 初期判定 |
|---|---|---|---|---|---|---|---|---|
| 反逆の高校生 | `WARRIOR` | □ [O1](../public/sprites/endless-endings/high-school/warrior/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/warrior/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/warrior/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/warrior/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/warrior/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/warrior/true-3.webp) | △ E-01 / 内容要確認 |
| 生物部の先輩 | `CARETAKER` | □ [O1](../public/sprites/endless-endings/high-school/caretaker/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/caretaker/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/caretaker/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/caretaker/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/caretaker/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/caretaker/true-3.webp) | 機械OK / 内容未確認 |
| 謎めく転入生 | `ASSASSIN` | □ [O1](../public/sprites/endless-endings/high-school/assassin/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/assassin/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/assassin/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/assassin/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/assassin/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/assassin/true-3.webp) | 機械OK / 内容未確認 |
| バスケ部エース | `DODGEBALL` | □ [O1](../public/sprites/endless-endings/high-school/dodgeball/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/dodgeball/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/dodgeball/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/dodgeball/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/dodgeball/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/dodgeball/true-3.webp) | △ 種目・道具を要確認 |
| 放送部ディレクター | `BARD` | □ [O1](../public/sprites/endless-endings/high-school/bard/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/bard/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/bard/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/bard/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/bard/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/bard/true-3.webp) | △ E-02 / 内容要確認 |
| 文芸部書記 | `LIBRARIAN` | □ [O1](../public/sprites/endless-endings/high-school/librarian/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/librarian/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/librarian/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/librarian/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/librarian/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/librarian/true-3.webp) | 機械OK / 内容未確認 |
| 学食の料理長 | `CHEF` | □ [O1](../public/sprites/endless-endings/high-school/chef/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/chef/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/chef/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/chef/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/chef/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/chef/true-3.webp) | 機械OK / 内容未確認 |
| 園芸部部長 | `GARDENER` | □ [O1](../public/sprites/endless-endings/high-school/gardener/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/gardener/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/gardener/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/gardener/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/gardener/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/gardener/true-3.webp) | 機械OK / 内容未確認 |
| 化学研究会長 | `MAGE` | □ [O1](../public/sprites/endless-endings/high-school/mage/opening-1.webp) | □ [O2](../public/sprites/endless-endings/high-school/mage/opening-2.webp) | □ [O3](../public/sprites/endless-endings/high-school/mage/opening-3.webp) | □ [T1](../public/sprites/endless-endings/high-school/mage/true-1.webp) | □ [T2](../public/sprites/endless-endings/high-school/mage/true-2.webp) | □ [T3](../public/sprites/endless-endings/high-school/mage/true-3.webp) | 機械OK / 内容未確認 |

### マジック編・女性主人公

画像ルート: `public/sprites/endless-endings/magic/{role}/`

| 主人公 | ベースID | O1 | O2 | O3 | T1 | T2 | T3 | 初期判定 |
|---|---|---|---|---|---|---|---|---|
| 星宮あかり (`AKARI`) | `WARRIOR` | □ [O1](../public/sprites/endless-endings/magic/warrior/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/warrior/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/warrior/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/warrior/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/warrior/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/warrior/true-3.webp) | 要修正 E-03 |
| 水城しずく (`SHIZUKU`) | `CARETAKER` | □ [O1](../public/sprites/endless-endings/magic/caretaker/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/caretaker/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/caretaker/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/caretaker/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/caretaker/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/caretaker/true-3.webp) | 要修正 E-03 |
| 花咲ひより (`HIYORI`) | `ASSASSIN` | □ [O1](../public/sprites/endless-endings/magic/assassin/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/assassin/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/assassin/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/assassin/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/assassin/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/assassin/true-3.webp) | 要修正 E-03 |
| 黒羽れい (`REI`) | `DODGEBALL` | □ [O1](../public/sprites/endless-endings/magic/dodgeball/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/dodgeball/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/dodgeball/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/dodgeball/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/dodgeball/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/dodgeball/true-3.webp) | 要修正 E-03 |
| 翠川まどか (`MADOKA`) | `BARD` | □ [O1](../public/sprites/endless-endings/magic/bard/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/bard/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/bard/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/bard/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/bard/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/bard/true-3.webp) | 要修正 E-03 |
| 風森こはる (`KOHARU`) | `LIBRARIAN` | □ [O1](../public/sprites/endless-endings/magic/librarian/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/librarian/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/librarian/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/librarian/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/librarian/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/librarian/true-3.webp) | 要修正 E-03 |
| 紫藤みらい (`MIRAI`) | `CHEF` | □ [O1](../public/sprites/endless-endings/magic/chef/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/chef/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/chef/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/chef/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/chef/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/chef/true-3.webp) | 要修正 E-03 |
| 白峰セラ (`SERA`) | `GARDENER` | □ [O1](../public/sprites/endless-endings/magic/gardener/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/gardener/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/gardener/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/gardener/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/gardener/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/gardener/true-3.webp) | 要修正 E-03 |
| 火神つばさ (`TSUBASA`) | `MAGE` | □ [O1](../public/sprites/endless-endings/magic/mage/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/mage/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/mage/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/mage/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/mage/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/mage/true-3.webp) | 要修正 E-03 |

### マジック編・男性主人公

画像ルート: `public/sprites/endless-endings/magic/male/{assetId}/`

| 主人公 | ベースID | O1 | O2 | O3 | T1 | T2 | T3 | 初期判定 |
|---|---|---|---|---|---|---|---|---|
| 朝霧 蓮 (`REN`) | `WARRIOR` | □ [O1](../public/sprites/endless-endings/magic/male/ren/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/ren/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/ren/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/ren/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/ren/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/ren/true-3.webp) | 要修正 E-04 |
| 御影 颯真 (`SOMA`) | `CARETAKER` | □ [O1](../public/sprites/endless-endings/magic/male/soma/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/soma/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/soma/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/soma/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/soma/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/soma/true-3.webp) | 要修正 E-04 |
| 白石 湊 (`MINATO`) | `ASSASSIN` | □ [O1](../public/sprites/endless-endings/magic/male/minato/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/minato/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/minato/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/minato/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/minato/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/minato/true-3.webp) | 要修正 E-04 |
| 天音 理玖 (`RIKU`) | `MAGE` | □ [O1](../public/sprites/endless-endings/magic/male/riku/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/riku/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/riku/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/riku/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/riku/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/riku/true-3.webp) | 要修正 E-04 |
| 黒瀬 大和 (`YAMATO`) | `DODGEBALL` | □ [O1](../public/sprites/endless-endings/magic/male/yamato/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/yamato/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/yamato/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/yamato/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/yamato/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/yamato/true-3.webp) | 要修正 E-04 |
| 神代 レオン (`LEON`) | `BARD` | □ [O1](../public/sprites/endless-endings/magic/male/leon/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/leon/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/leon/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/leon/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/leon/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/leon/true-3.webp) | 要修正 E-04 |
| エリオット・ノクス (`ELLIOT`) | `LIBRARIAN` | □ [O1](../public/sprites/endless-endings/magic/male/elliot/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/elliot/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/elliot/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/elliot/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/elliot/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/elliot/true-3.webp) | 要修正 E-04 |
| 九条 朔夜 (`SAKUYA`) | `CHEF` | □ [O1](../public/sprites/endless-endings/magic/male/sakuya/opening-1.webp) | □ [O2](../public/sprites/endless-endings/magic/male/sakuya/opening-2.webp) | □ [O3](../public/sprites/endless-endings/magic/male/sakuya/opening-3.webp) | □ [T1](../public/sprites/endless-endings/magic/male/sakuya/true-1.webp) | □ [T2](../public/sprites/endless-endings/magic/male/sakuya/true-2.webp) | □ [T3](../public/sprites/endless-endings/magic/male/sakuya/true-3.webp) | 要修正 E-04 |

## ページを判定するときの確認項目

各画像について、次の順番で確認する。

1. **主人公**: 選択中の主人公本人か。髪型・髪色・衣装・性別・年齢感に誤りがないか。
2. **場所**: 本文に出る校門、体育館、放送室、図書室、厨房、温室、実験室、海辺などが画像にあるか。
3. **小道具**: 本文に明示された帽子、羽根、スカーフ、ボール、マイク、本、しおり、おたま、種、フラスコなどが描かれているか。
4. **行動**: 「待つ」「走る」「記録する」「放送する」「料理する」「育てる」など、本文の動作と画像のポーズが一致するか。
5. **ページの流れ**: O1→O2→O3 が導入からエンドレス開始へ、T1→T2→T3 が深層クリアから次の生活・未来へ自然につながるか。
6. **テーマ**: 小学生編・高校編・マジック編の世界観、制服・私服・魔法衣装、背景の時代感が混ざっていないか。
7. **翻訳**: 日本語、ひらがな、英語で主語・小道具・ニュアンスが欠落または変化していないか。

## 本文修正の優先順位

1. マジック編の女性・男性主人公を、実際の魔法属性・固有能力・人物設定に合わせた本文へ分離する。
2. 高校編の本文を、高校生の服装・活動・場面に合わせて確認し、赤い帽子など小学生固有の要素を除去する。
3. CARETAKERのひらがな誤記を修正する。
4. 各ページの目視確認後、上の一覧の初期判定をページ単位の判定へ更新する。
5. 修正後に、日本語・ひらがな・英語の3言語を同じ意味で更新する。
6. 画像差し替えが必要な場合は、本文修正で解決できない不一致だけを対象にする。

## 参照元

- 本文・画像パス: [`src/data/endlessEndingSequences.ts`](../src/data/endlessEndingSequences.ts)
- 導入・真エンディング画面: [`src/components/EndlessEndingSequenceScreen.tsx`](../src/components/EndlessEndingSequenceScreen.tsx)
- 画面遷移と表示条件: [`src/App.tsx`](../src/App.tsx)
- 編ごとの主人公対応: [`src/data/visualThemes.ts`](../src/data/visualThemes.ts)
- マジック編主人公一覧: [`src/data/magicHeroes.ts`](../src/data/magicHeroes.ts)
- 既存の通常エンディング確認資料: [`docs/ending-image-text-review.md`](./ending-image-text-review.md)

## 次回更新欄

| 更新日 | 対象 | 変更内容 | 判定者 |
|---|---|---|---|
| 2026-09-02 | 初版 | 画像210枚の存在・形式・サイズを確認。本文と画像の不一致候補を記録。 | Codex |
|  |  |  |  |
