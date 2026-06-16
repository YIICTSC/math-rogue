# マジック編 背景制作リスト

## 共通仕様

- 25枚、1920x1080、16:9
- 人物、文字、ロゴ、UIなし
- 立ち絵を左右または中央へ配置できる余白を確保
- ゲーム参照形式はWebP、品質80前後
- 保存先: `public/backgrounds/magic`

共通プロンプト:

```text
Background art for a polished Japanese anime magical academy visual novel and RPG,
16:9 landscape, 1920x1080, detailed but readable, cinematic lighting,
clear foreground/midground/background separation, usable space for character sprites,
no people, no text, no logo, no watermark, no UI. Final delivery as WebP.
```

## 学園・日常背景

| ID・ファイル | 必要素材 | 解放条件 | 登場人物 | イベント概要 | AI画像生成プロンプト追加文 |
| --- | --- | --- | --- | --- | --- |
| BG01 `BG_MAGIC_01_GATE.webp` | 学園紋章、桜、時計塔 | 初期 | 全員 | 登校、入学式、待ち合わせ | `grand magical academy front gate in modern Japan, cherry trees, distant clock tower, morning light, welcoming and mysterious` |
| BG02 `BG_MAGIC_02_HALLWAY.webp` | 魔法灯、掲示板、窓 | 初期 | 生徒全般 | 移動、偶発会話 | `bright academy hallway, tall windows, subtle floating magic lamps, polished floor, long perspective` |
| BG03 `BG_MAGIC_03_CLASSROOM.webp` | 黒板、机、魔法教材 | 初期 | 主人公、同級生 | 授業、学習問題 | `Japanese high school classroom blended with magical study tools, afternoon sunlight, clean desks, empty blackboard` |
| BG04 `BG_MAGIC_04_LIBRARY.webp` | 高書架、禁書扉 | 第1章 | しずく、理玖、敵 | 調査、勉強、深淵への入口 | `vast magical academy library, spiral shelves, floating books, sealed forbidden archive door, warm lamps` |
| BG05 `BG_MAGIC_05_COUNCIL.webp` | 長机、校章、書類 | 第1章 | 颯真、れい | 生徒会、規律イベント | `elegant student council room, dark wood, academy crest, organized documents, evening window light` |
| BG06 `BG_MAGIC_06_GYM.webp` | コート、観客席、魔法障壁 | 初期 | つばさ、大和 | 体育、模擬戦 | `large school gymnasium with discreet magical barrier pylons, polished court, high windows, empty stands` |
| BG07 `BG_MAGIC_07_ROOFTOP.webp` | フェンス、ベンチ、空 | 第1章 | 恋愛対象、主人公 | 昼休み、告白候補 | `school rooftop, safety fence, bench, expansive blue sky, gentle wind, private emotional atmosphere` |
| BG08 `BG_MAGIC_08_COURTYARD.webp` | 噴水、精霊樹、花壇 | 初期 | こはる、全員 | 昼休み、友情 | `academy courtyard with luminous spirit tree, fountain, flower beds, covered walkways, soft noon light` |
| BG09 `BG_MAGIC_09_INFIRMARY.webp` | ベッド、薬棚、カーテン | 初期 | ひより、湊 | 治療、相談 | `clean school infirmary, white curtains, beds, herbal magic cabinet, calm afternoon light` |
| BG10 `BG_MAGIC_10_FESTIVAL.webp` | 模擬店、舞台、装飾 | 文化祭 | みらい、全員 | 文化祭、舞台 | `magical academy cultural festival courtyard, colorful stalls, stage, handmade star decorations, evening lanterns, no people` |
| BG11 `BG_MAGIC_11_TRAINING.webp` | 魔法陣、標的、結界 | 第1章 | 主人公9人 | 変身訓練、戦闘導入 | `circular underground magic training arena, nine elemental emblems, target constructs, protective barrier, dramatic clean lighting` |
| BG12 `BG_MAGIC_12_DORM.webp` | 共用室、暖炉、ソファ | 第1章 | 主人公9人 | 夜会話、SNS、友情 | `cozy girls academy dormitory common room, sofas, fireplace, study tables, moonlit windows, magical ornaments` |
| BG13 `BG_MAGIC_13_SHOPPING.webp` | 商店、カフェ、雑貨 | 第2章 | 恋愛対象 | 放課後、プレゼント | `lively Japanese shopping street with magical accessory shops and cafe fronts, late afternoon, no crowds` |
| BG14 `BG_MAGIC_14_AQUARIUM.webp` | 大水槽、青い光 | デート解放 | 恋愛対象 | 水族館デート | `modern aquarium tunnel and enormous blue tank, rays and glowing fish, romantic quiet lighting, no visitors` |
| BG15 `BG_MAGIC_15_AMUSEMENT.webp` | 観覧車、遊具 | デート解放 | 恋愛対象 | 遊園地デート | `Japanese amusement park, ferris wheel, carousel, magical light decorations, clear sunset, no visitors` |
| BG16 `BG_MAGIC_16_SUMMER.webp` | 神社、屋台、提灯 | 夏イベント | 全員 | 夏祭り | `summer shrine festival grounds, lanterns, food stalls, stone path, fireworks preparation, no people` |
| BG17 `BG_MAGIC_17_CHRISTMAS.webp` | イルミネーション、雪 | 冬イベント | 全員 | クリスマス | `Japanese city street at Christmas, tasteful illuminations, light snow, shop windows, magical academy students' meeting spot, no people` |

## ダンジョン背景

| ID・ファイル | 必要素材 | 解放条件 | 登場人物 | イベント概要 | AI画像生成プロンプト追加文 |
| --- | --- | --- | --- | --- | --- |
| BG18 `BG_MAGIC_18_STAR_TEMPLE.webp` | 星座柱、祭壇、宇宙空 | 第1ダンジョン | あかり、セラ | 星属性試練 | `ancient star temple floating in a cosmic sky, constellation pillars, luminous altar, traversable RPG arena` |
| BG19 `BG_MAGIC_19_FLOWER_MAZE.webp` | 巨大花、蔦、鏡池 | 第2ダンジョン | ひより、こはる | 癒やしと執着の試練 | `enchanted flower labyrinth, giant blossoms, thorn arches, mirror pools, beautiful but dangerous` |
| BG20 `BG_MAGIC_20_MOON_GARDEN.webp` | 月、白庭園、水路 | 第3ダンジョン | しずく、れい | 月と封印の試練 | `moonlit white stone garden, silver waterways, crescent gates, deep blue night, elegant battle space` |
| BG21 `BG_MAGIC_21_CLOCK_TOWER.webp` | 巨大歯車、時計盤 | 第4ダンジョン | まどか、理玖 | 時間事故 | `interior of impossible clock tower, enormous gears, suspended clock faces, golden time particles, dangerous platforms` |
| BG22 `BG_MAGIC_22_ABYSS_LIBRARY.webp` | 無限書架、落下本、闇 | 第5ダンジョン | しずく、朔夜 | 禁書探索 | `endless abyssal library, floating shelves over darkness, chained grimoires, violet lamps, central combat platform` |
| BG23 `BG_MAGIC_23_DARK_THEATER.webp` | 舞台、仮面、赤幕 | 第6ダンジョン | みらい、レオン | 夢と偽りの試練 | `abandoned magical theater, red curtains, floating masks, cracked stage, purple dream light, dramatic arena` |
| BG24 `BG_MAGIC_24_DEMON_CASTLE.webp` | 黒城、玉座、魔法嵐 | 最終章 | 全員、ボス | ボス最終決戦 | `grand black-violet sorceress castle throne hall, floating grimoires, broken academy crest, magical storm outside` |
| BG25 `BG_MAGIC_25_TRUE_WORLD.webp` | 浮遊島、二世界、光の道 | 真ルート | 全員、真ボス | 真エンド異世界 | `surreal astral world joining modern city and magical realm, floating islands, shattered moon, luminous path, apocalyptic yet hopeful` |

## 生成・変換手順

1. 共通プロンプトと各行の追加文でPNGマスターを生成
2. 人物や文字が混入していないか確認
3. 1920x1080へ統一
4. WebP品質80前後へ変換
5. 立ち絵を仮配置して可読性を確認
6. `ASSET_CHECKLIST.md` を更新

## 完了条件

- 25枚すべてがWebP
- ファイル名とIDが一致
- 日常17枚、ダンジョン8枚
- CG一覧の全シーンがいずれかの背景に紐づく
- 背景完成後にのみCG本制作へ進む

