# 学習ローグ カード効果 日本語／英語一覧・翻訳監査

> 生成日: 2026-08-27

## 対象と件数

| 対象 | 枚数 |
|---|---:|
| 通常戦闘・図鑑カード（状態異常、呪い、イベント、司書、菜園、高校編、拡張を含む） | 949 |
| 魔法カード | 51 |
| 協力サポートカード | 10 |
| 合計 | 1010 |

図鑑・戦闘で参照されるカード定義を対象にしています。配置TCGは別ゲームのカード体系（別ルール・別表示経路）のため、この一覧から除外しています。

## 監査結果

- 抽出・英訳を確認したカード: 1010枚
- カード固有文を明示英訳で補ったカード: 161枚
- 機械監査で要確認になったカード: 0枚

監査は、英訳が実際の `buildEnglishCardDescription`／`trans(..., ENGLISH)` の表示経路から生成されていること、日本語中の数値が英訳に残っていること、英訳に日本語が残っていないことを確認します。熟知者の発動間隔「2ターンに1回」は “every other turn” として意味が保たれるため、数値比較から除外しています。

## 今回の修正ポイント

- 「銀河鉄道の夜」: 山札の上5枚を見る、1枚を選ぶ、残りを捨てる、の全工程を英訳。
- 状態異常・呪い: 即時痛み／手札阻害／山札汚染の分類と、引いた時・ターン終了時・手札中などの条件を補完。
- 菜園の種: ブロック効果だけでなく、菜園に植えることと成長先・必要ターンを補完。
- 固有カード: 追加ドロー、対象、条件付き廃棄、敵の行動遅延、コスト変更、使い切り、倍率などを補完。
- 共通生成: `damagePerStrike`、`REGEN`、負の次ターンエナジー、`CHAOS_SURGE` のエナジー量、使い切りを反映。

## カード別一覧

## 状態異常

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| WOUND | ケガ | 【即時痛み型】使用不可。 | [Immediate Pain] Unplayable. | OK (explicit card text) |
| DAZED | めまい | 【手札阻害型】使用不可。ターン終了時廃棄。 | [Hand Disruption] Unplayable. Exhaust at the end of your turn. | OK (explicit card text) |
| VOID | 虚無 | 【手札阻害型】使用不可。引いた時E1失う。 | [Hand Disruption] Unplayable. Lose 1 Energy when drawn. | OK (explicit card text) |
| BURN | やけど | 【即時痛み型】使用不可。ターン終了時2ダメージ。 | [Immediate Pain] Unplayable. Take 2 damage at the end of your turn. | OK (explicit card text) |
| SLIMED | 鼻水 | 【即時痛み型】使用すると廃棄される。 | [Immediate Pain] Exhaust when used. | OK (explicit card text) |
| KIBI_DANGO | きびだんご | ブロック5を得る。廃棄。 | Gain 5 Block. Exhaust. | OK |

## 呪い

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| PAIN | 腹痛 | 【即時痛み型】使用不可。手札にある間、カードを使うたび自分に1ダメージ。 | [Immediate Pain] Unplayable. While in your hand, take 1 damage whenever you play a card. | OK (explicit card text) |
| REGRET | 後悔 | 【山札汚染型】使用不可。ターン終了時、手札枚数分自分にダメージ。 | [Draw Pile Contamination] Unplayable. At the end of your turn, take damage equal to the number of cards in your hand. | OK (explicit card text) |
| DOUBT | 不安 | 【山札汚染型】使用不可。ターン終了時、へろへろ1を得る。 | [Draw Pile Contamination] Unplayable. Gain 1 Weak at the end of your turn. | OK (explicit card text) |
| SHAME | 恥 | 【山札汚染型】使用不可。ターン終了時、びくびく1を得る。 | [Draw Pile Contamination] Unplayable. Gain 1 Vulnerable at the end of your turn. | OK (explicit card text) |
| WRITHE | 悩み | 【山札汚染型】使用不可。初期手札に来る。 | [Draw Pile Contamination] Unplayable. Innate. | OK (explicit card text) |
| NORMALITY | 退屈 | 【手札阻害型】使用不可。手札にある間、3枚までしかカードを使えない。 | [Hand Disruption] Unplayable. While in your hand, you can play only up to 3 cards each turn. | OK (explicit card text) |
| INJURY | 骨折 | 【即時痛み型】使用不可。 | [Immediate Pain] Unplayable. | OK (explicit card text) |
| PARASITE | 寄生虫 | 【山札汚染型】使用不可。デッキから消滅すると最大HP-3。 | [Draw Pile Contamination] Unplayable. Lose 3 max HP when removed from your deck. | OK (explicit card text) |
| DECAY | 虫歯 | 【即時痛み型】使用不可。ターン終了時自分に2ダメージ。 | [Immediate Pain] Unplayable. Take 2 damage at the end of your turn. | OK (explicit card text) |
| CLUMSINESS | ドジ | 【手札阻害型】使用不可。廃棄。 | [Hand Disruption] Unplayable. Exhaust. | OK (explicit card text) |

## イベント

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| BITE | つまみ食い | 7ダメージ。HP2回復。 | Deal 7 damage. Heal 2 HP. | OK |
| APPARITION | 透明人間 | スケスケ(被ダメ1)を得る。廃棄。 | Become Intangible for 1 turn. Exhaust. | OK |
| J_A_X | 牛乳一気飲み | ムキムキ3を得る。ターン終了時3失う。 | Gain 3 Strength. Lose 3 Strength at the end of this turn. | OK |
| MADNESS | パニック | 手札のランダムなカード1枚のコストを0にする。廃棄。 | Make 1 random card in your hand cost 0. Exhaust. | OK (explicit card text) |

## 司書

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| GON_GITSUNE | ごんぎつね | 6ダメージを2回与える。 | Deal 6 damage 2 times. | OK |
| GON_KURU | ごんの栗 | カードを1枚引く。ムキムキ1を得る。 | Draw 1 card. Gain 1 Strength. | OK |
| HYOJU_RIFLE | 兵十の火縄銃 | 22ダメージ。廃棄。 | Deal 22 damage. Exhaust. | OK |
| HASHIRE_MELOS | 走れメロス | 次ターンE+1。カードを1枚引く。 | Draw 1 card. Gain 1 Energy next turn. | OK |
| JACHI_BOGYAKU | 邪智暴虐 | びくびく2を与える。カードを1枚引く。 | Apply 2 Vulnerable. Draw 1 card. | OK (explicit card text) |
| MELOS_TRUST | メロスの信実 | ブロック12を得る。 | Gain 12 Block. | OK |
| KUMO_NO_ITO | 蜘蛛の糸 | へろへろ3を与える。 | Apply 3 Weak. | OK |
| GOKURAKU_HASU | 極楽の蓮 | HPを4回復。廃棄。 | Heal 4 HP. Exhaust. | OK |
| SANGETSUKI | 山月記 | ムキムキ2を得る。 | Gain 2 Strength. | OK |
| TORA_HO | 虎咆 | 全体12ダメージ。びくびく1。 | Deal 12 damage to all enemies. Apply 1 Vulnerable to all enemies. | OK |
| BOKKO_CHAN | ボッコちゃん | トゲトゲ4(反撃)を得る。 | Gain 4 Thorns. | OK |
| OI_DETEKOI | おーい、でてこい | 18ダメージ。次ターンE+1。 | Deal 18 damage. Gain 1 Energy next turn. | OK |
| KOROSHIYA | 殺し屋ですのよ | 9ダメージ。たおすとエナジー2を得る。 | Deal 9 damage. If this defeats an enemy, gain 2 Energy. | OK |
| HOSHI_PRESENT | 星のプレゼント | ランダムなポーションを1つ得る。廃棄。 | Gain 1 random Potion. Exhaust. | OK (explicit card text) |
| KAGAMI_HOSHI | 鏡 (星新一) | 手札のカード1枚をコピーして手札に加える。自分にびくびく1。 | Copy 1 card from your hand into your hand. Gain 1 Vulnerable. | OK (explicit card text) |
| YOSEI_HOSHI | 妖精 (星新一) | HPを10回復。手札のカード1枚を廃棄する。 | Heal 10 HP. Exhaust 1 card from your hand. | OK (explicit card text) |
| LIFE_MAINTENANCE | 生活維持省 | ターン終了時、ブロック6を得る。 | Gain 6 Block at the end of your turn. | OK |
| SPACE_GREETING | 宇宙のあいさつ | 敵全体にびくびく1とへろへろ1。 | Apply 1 Weak to all enemies. Apply 1 Vulnerable to all enemies. | OK |
| KAIKETSU_ZORORI | かいけつゾロリ | 3枚引き、1枚捨てる。ブロック3。 | Draw 3 cards. Discard 1 card. Gain 3 Block. | OK (explicit card text) |
| ZENITEN_DO | 銭天堂 | 手札に「やる気スイッチ(コスト0)」を加える。 | Add 1 Motivation Switch to your hand at 0 cost. | OK (explicit card text) |
| HOSHI_NO_OJI | 星の王子さま | 最大HP+2。HP2回復。廃棄。 | Heal 2 HP. If this defeats an enemy or resolves, increase max HP by 2. Exhaust. | OK |
| MOMO_TIME | モモ | 余ったエナジーを次のターンに持ち越す。 | Save unused Energy for the next turn. | OK |
| TIME_THIEF | 時間どろぼう | 5ダメージ。敵の次の行動を1ターン遅らせる。廃棄。 | Deal 5 damage. Delay the target’s next action by 1 turn. Exhaust. | OK (explicit card text) |
| NEVERENDING_STORY | はてしない物語 | ターンの開始時、全てのカードのコストを1下げる。 | At the start of each turn, reduce all card costs by 1. | OK |
| TOTTO_CHAN | 窓ぎわのトットちゃん | 捨て札を全て山札に戻す。1枚引く。廃棄。 | Draw 1 card. Shuffle your discard pile into your draw pile. Exhaust. | OK |
| GALAXY_EXPRESS | 銀河鉄道の夜 | 山札の上から5枚を見る。1枚選び手札に加え、残りを捨てる。 | Look at the top 5 cards of your draw pile. Choose 1 card to add to your hand and discard the rest. | OK (explicit card text) |
| YODAKA_NO_HOSHI | よだかの星 | 自分に4ダメージ。全体に15ダメージ。 | Deal 15 damage to all enemies. Lose 4 HP. | OK |
| MANY_ORDERS | 注文の多い料理店 | びくびく2。へろへろ2。 | Apply 2 Weak. Apply 2 Vulnerable. | OK |
| BUY_GLOVES | 手袋を買いに | カチカチ2(ブロック強化)を得る。 | Gain 2 Dexterity. | OK |
| GAUCHE_CELLO | セロ弾きのゴーシュ | ブロック10。次ターン2枚引く。 | Gain 10 Block. Draw 2 extra cards next turn. | OK |
| MINE_BLAST_G | トロッコ (芥川) | 今ターン使用したカード1枚につき4ダメージ。 | Deal 4 extra damage for each card played this turn. | OK |
| RASHOMON | 羅生門 | 10ダメージ。敵をたおすと手札のカード1枚を廃棄する。 | Deal 10 damage. If this defeats an enemy, Exhaust 1 card from your hand. | OK (explicit card text) |
| KUMO_NO_ITO_D | カンダタの叫び | E2。手札に「悩み」を加える。 | Gain 2 Energy. Add 1 Worry to your hand. | OK |
| OSAMU_NIGHT | 人間失格 | 使用不可。手札にある限り、毎ターン自分に3ダメージ。 | Unplayable. While in your hand, take 3 damage at the end of each turn. | OK (explicit card text) |
| GOSHI_REVENGE | 走れメロス・ラストスパート | 15ダメージ。 | Deal 15 damage. | OK |
| KOKORO_SOSEKI | こころ | 敵の攻撃力を2下げる。廃棄。 | Reduce the target's Strength by 2. Exhaust. | OK |
| BOTCHAN | 坊っちゃん | 8ダメージ。敵を「びくびく」状態に。 | Deal 8 damage. Apply 1 Vulnerable. | OK |
| WAGAHAI_NEKO | 吾輩は猫である | ブロック3。カード1枚引く。 | Gain 3 Block. Draw 1 card. | OK |
| DOKKO_CHAN | どっこいしょ | ブロック5。手札の全カードを強化する。 | Gain 5 Block. Upgrade all cards in your hand. | OK |
| KITSUNE_NO_MADO | きてんの窓 | 手札の高コストカードを1枚選んでコピーし、0コスト化する。対象がなければ他のカードを選ぶ。 | Choose 1 high-cost card in your hand, copy it, and make the copy cost 0. If there is no high-cost card, choose another card instead. | OK (explicit card text) |
| KACHIKACHI_YAMA | かちかち山 | 12ダメージ。対象に「やけど」を与える。 | Deal 12 damage. Apply Burn to the target. | OK (explicit card text) |
| URASHIMA_TARO | 浦島太郎 | 敵全体を2ターン「へろへろ」にする。廃棄。 | Apply 2 Weak to all enemies. Exhaust. | OK |
| MOMOTARO | 桃太郎 | 6ダメージ。手札に「きびだんご(コスト0ブロック5)」を加える。 | Deal 6 damage. Add 1 Millet Dumpling to your hand at 0 cost; it provides 5 Block. | OK (explicit card text) |
| KAGUYA_HIME | かぐや姫 | 3ターン「スケスケ(無敵)」になる。廃棄。 | Become Intangible for 3 turns. Exhaust. | OK |
| HANASAKA_JIISAN | 花咲かじいさん | 敵全体に5ダメージを与え、味方全員のHPを2回復。 | Deal 5 damage to all enemies. Heal 2 HP. | OK |
| KASA_JIZO | かさじぞう | ブロック4を得る。次ターンカードを1枚引く。 | Gain 4 Block. Draw 1 extra card next turn. | OK |
| ISSUN_BOSHI | 一寸法師 | 3ダメージを3回与える。ブロック3。 | Deal 3 damage 3 times. Gain 3 Block. | OK (explicit card text) |
| TSURU_ONGAESHI | 鶴の恩返し | HPを6失い、2枚引く。 | Draw 2 cards. Lose 6 HP. | OK |
| OMUSUBI_KORORIN | おむすびころりん | E1を得る。ランダムな敵に5ダメージ。 | Deal 5 damage to a random enemy. Gain 1 Energy. | OK |
| NEZUMI_NO_YOMEIRI | ねずみの嫁入り | この戦闘中、被ダメージを1軽減する。 | Reduce all damage you take by 1 for this combat. | OK (explicit card text) |

## 菜園の種

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| SUNFLOWER_SEED | ヒマワリの種 | ブロック3。菜園に植えると「ヒマワリ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sunflower after 1 turn. | OK (explicit card text) |
| CACTUS_SEED | サボテンの種 | ブロック3。菜園に植えると「サボテン」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Cactus after 2 turns. | OK (explicit card text) |
| ROSE_SEED | バラの種 | ブロック3。菜園に植えると「バラ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Rose after 2 turns. | OK (explicit card text) |
| VINE_SEED | ツルの種 | ブロック3。菜園に植えると「巨大なツル」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Giant Vine after 3 turns. | OK (explicit card text) |
| MANDRAKE_SEED | マンドレイクの種 | ブロック3。菜園に植えると「マンドレイク」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Mandrake Root after 4 turns. | OK (explicit card text) |
| PEA_SEED | エンドウ豆の種 | ブロック3。菜園に植えると「豆鉄砲」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Pea Shooter after 1 turn. | OK (explicit card text) |
| TOMATO_SEED | トマトの種 | ブロック3。菜園に植えると「完熟トマト」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Ripe Tomato after 2 turns. | OK (explicit card text) |
| PUMPKIN_SEED | カボチャの種 | ブロック3。菜園に植えると「鉄壁カボチャ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Iron Pumpkin after 3 turns. | OK (explicit card text) |
| CHILI_SEED | トウガラシの種 | ブロック3。菜園に植えると「激辛トウガラシ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Hot Chili after 2 turns. | OK (explicit card text) |
| WHEAT_SEED | 小麦の種 | ブロック3。菜園に植えると「黄金の小麦」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Golden Wheat after 3 turns. | OK (explicit card text) |
| LOTUS_SEED | ハスの種 | ブロック3。菜園に植えると「聖なるハス」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sacred Lotus after 4 turns. | OK (explicit card text) |
| CLOVER_SEED | クローバーの種 | ブロック3。菜園に植えると「四つ葉のクローバー」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Lucky Clover after 2 turns. | OK (explicit card text) |
| IVY_SEED | アイビーの種 | ブロック3。菜園に植えると「毒蔦アイビー」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Poison Ivy after 2 turns. | OK (explicit card text) |
| TULIP_SEED | チューリップの種 | ブロック3。菜園に植えると「魅惑のチューリップ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Tulip Draw after 2 turns. | OK (explicit card text) |
| BAMBOO_SEED | 竹の種 | ブロック3。菜園に植えると「剛健な竹」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sturdy Bamboo after 1 turn. | OK (explicit card text) |
| SAKURA_SEED | さくらの種 | ブロック3。菜園に植えると「さくら吹雪」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sakura Storm after 3 turns. | OK (explicit card text) |
| PINE_SEED | マツの種 | ブロック3。菜園に植えると「不老長寿のマツ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Eternal Pine after 4 turns. | OK (explicit card text) |
| MAPLE_SEED | モミジの種 | ブロック3。菜園に植えると「真紅のモミジ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Crimson Maple after 2 turns. | OK (explicit card text) |
| GARLIC_SEED | ニンニクの種 | ブロック3。菜園に植えると「魔除けのニンニク」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Holy Garlic after 2 turns. | OK (explicit card text) |
| GINGER_SEED | ショウガの種 | ブロック3。菜園に植えると「癒やしのショウガ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Healing Ginger after 1 turn. | OK (explicit card text) |
| LAVENDER_SEED | ラベンダーの種 | ブロック3。菜園に植えると「安らぎのラベンダー」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Calm Lavender after 2 turns. | OK (explicit card text) |
| OAK_SEED | カシの種 | ブロック3。菜園に植えると「大樹のカシ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Great Oak after 5 turns. | OK (explicit card text) |
| M_GLORY_SEED | アサガオの種 | ブロック3。菜園に植えると「朝露のアサガオ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Morning Glory after 1 turn. | OK (explicit card text) |
| HYDRANGEA_SEED | アジサイの種 | ブロック3。菜園に植えると「七変化のアジサイ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Rainbow Hydrangea after 3 turns. | OK (explicit card text) |
| BLUEBELL_SEED | ブルーベルの種 | ブロック3。菜園に植えると「響き渡る鈴蘭」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Echo Bluebell after 2 turns. | OK (explicit card text) |
| APPLE_SEED | リンゴの種 | ブロック3。菜園に植えると「禁断のリンゴ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Forbidden Apple after 4 turns. | OK (explicit card text) |
| ORANGE_SEED | オレンジの種 | ブロック3。菜園に植えると「太陽のオレンジ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Solar Orange after 3 turns. | OK (explicit card text) |
| GRAPE_SEED | ブドウの種 | ブロック3。菜園に植えると「芳醇なブドウ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Rich Grape after 3 turns. | OK (explicit card text) |
| CABBAGE_SEED | キャベツの種 | ブロック3。菜園に植えると「幾重のキャベツ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Layered Cabbage after 2 turns. | OK (explicit card text) |
| DAIKON_SEED | ダイコンの種 | ブロック3。菜園に植えると「斬鉄ダイコン」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sword Daikon after 2 turns. | OK (explicit card text) |
| MUSHROOM_SPORE | キノコの胞子 | ブロック3。菜園に植えると「幻覚キノコ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Mystic Mushroom after 3 turns. | OK (explicit card text) |
| LILY_SEED | ユリの種 | ブロック3。菜園に植えると「純白のユリ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sacred Lily after 4 turns. | OK (explicit card text) |
| CAMELLIA_SEED | ツバキの種 | ブロック3。菜園に植えると「冬枯れのツバキ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Winter Camellia after 3 turns. | OK (explicit card text) |
| COSMOS_SEED | コスモスの種 | ブロック3。菜園に植えると「秋空のコスモス」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Autumn Cosmos after 1 turn. | OK (explicit card text) |
| DANDELION_SEED | タンポポの種 | ブロック3。菜園に植えると「綿毛のタンポポ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Fluffy Dandelion after 1 turn. | OK (explicit card text) |
| GINKGO_SEED | イチョウの種 | ブロック3。菜園に植えると「知恵のイチョウ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Wisdom Ginkgo after 4 turns. | OK (explicit card text) |
| WASABI_SEED | ワサビの種 | ブロック3。菜園に植えると「劇薬ワサビ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Medicinal Wasabi after 3 turns. | OK (explicit card text) |
| SHIITAKE_SPORE | シイタケの胞子 | ブロック3。菜園に植えると「剛力のシイタケ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Mighty Shiitake after 2 turns. | OK (explicit card text) |
| PERSIMMON_SEED | カキの種 | ブロック3。菜園に植えると「豊穣のカキ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Bountiful Persimmon after 2 turns. | OK (explicit card text) |
| PLUM_SEED | ウメの種 | ブロック3。菜園に植えると「早咲きのウメ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Early Plum after 2 turns. | OK (explicit card text) |
| COFFEE_BEAN | コーヒーの豆 | ブロック3。菜園に植えると「覚醒のコーヒー」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Awake Coffee after 2 turns. | OK (explicit card text) |
| CACAO_BEAN | カカオの豆 | ブロック3。菜園に植えると「魅惑のカカオ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Sweet Cacao after 3 turns. | OK (explicit card text) |
| PEPPER_SEED | コショウの種 | ブロック3。菜園に植えると「爆炎のコショウ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Explosive Pepper after 2 turns. | OK (explicit card text) |
| WILLOW_SEED | ヤナギの種 | ブロック3。菜園に植えると「柳に風」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Willow Wind after 5 turns. | OK (explicit card text) |
| CYPRESS_SEED | ヒノキの種 | ブロック3。菜園に植えると「鉄壁のヒノキ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Iron Cypress after 4 turns. | OK (explicit card text) |
| ALOE_SEED | アロエの種 | ブロック3。菜園に植えると「医薬のアロエ」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Medicinal Aloe after 2 turns. | OK (explicit card text) |
| MINT_SEED | ミントの種 | ブロック3。菜園に植えると「清涼のミント」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Refresh Mint after 1 turn. | OK (explicit card text) |
| JASMINE_SEED | ジャスミンの種 | ブロック3。菜園に植えると「香華のジャスミン」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Fragrant Jasmine after 2 turns. | OK (explicit card text) |
| BONSAI_SEED | 松の盆栽の種 | ブロック3。菜園に植えると「至高の盆栽」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Ultimate Bonsai after 4 turns. | OK (explicit card text) |
| WORLD_TREE_SEED | 世界樹の種 | ブロック3。菜園に植えると「ユグドラシル」に成長する。 | Gain 3 Block. Plant this seed in the garden to grow into Yggdrasil after 6 turns. | OK (explicit card text) |

## 成長した植物

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| SUNFLOWER | ヒマワリ | エナジー1。1枚引く。廃棄。 | Draw 1 card. Gain 1 Energy. Exhaust. | OK |
| CACTUS | サボテン | トゲトゲ4を得る。 | Gain 4 Thorns. | OK |
| ROSE | バラ | 12ダメージ。ドクドク4。廃棄。 | Deal 12 damage. Apply 4 Poison. Exhaust. | OK |
| GIANT_VINE | 巨大なツル | 全体15ダメージ。敵全体をへろへろ2にする。廃棄。 | Deal 15 damage to all enemies. Apply 2 Weak to all enemies. Exhaust. | OK |
| MANDRAKE_ROOT | マンドレイク | 敵全体をびくびく3にする。敵全体にドクドク10。廃棄。 | Apply 3 Vulnerable to all enemies. Apply 10 Poison to all enemies. Exhaust. | OK |
| PEA_SHOOTER | 豆鉄砲 | 4ダメージを3回与える。廃棄。 | Deal 4 damage 3 times. Exhaust. | OK |
| RIPE_TOMATO | 完熟トマト | HPを10回復する。廃棄。 | Heal 10 HP. Exhaust. | OK |
| IRON_PUMPKIN | 鉄壁カボチャ | ブロック25を得る。廃棄。 | Gain 25 Block. Exhaust. | OK |
| HOT_CHILI | 激辛トウガラシ | ムキムキ3を得る。 | Gain 3 Strength. | OK |
| GOLDEN_WHEAT | 黄金の小麦 | 10ダメージ。これで倒すと最大HP+4。廃棄。 | Deal 10 damage. If this defeats an enemy or resolves, increase max HP by 4. Exhaust. | OK |
| SACRED_LOTUS | 聖なるハス | エナジー2。2枚引く。廃棄。 | Draw 2 cards. Gain 2 Energy. Exhaust. | OK |
| LUCKY_CLOVER | 四つ葉のクローバー | キラキラ2を得る。廃棄。 | Gain 2 Artifact. Exhaust. | OK |
| POISON_IVY | 毒蔦アイビー | ドクドク10を与える。廃棄。 | Apply 10 Poison. Exhaust. | OK |
| TULIP_DRAW | 魅惑のチューリップ | ターン開始時にカードを1枚引く。 | Draw 1 extra card at the start of each turn. | OK |
| STURDY_BAMBOO | 剛健な竹 | 現在のブロック値を倍にする。廃棄。 | Double your current Block. Exhaust. | OK |
| SAKURA_STORM | さくら吹雪 | 全体10ダメージ。廃棄。 | Deal 10 damage to all enemies. Exhaust. | OK |
| ETERNAL_PINE | 不老長寿のマツ | ターン終了時、ブロック6を得る。 | Gain 6 Block at the end of your turn. | OK |
| CRIMSON_MAPLE | 真紅のモミジ | 手札を全て強化する。廃棄。 | Upgrade all cards in your hand. Exhaust. | OK |
| HOLY_GARLIC | 魔除けのニンニク | キラキラ3を得る。廃棄。 | Gain 3 Artifact. Exhaust. | OK |
| HEALING_GINGER | 癒やしのショウガ | HPを5回復。全デバフを解除。廃棄。 | Heal 5 HP. Remove all debuffs. Exhaust. | OK |
| CALM_LAVENDER | 安らぎのラベンダー | 次ターン、エナジー2。廃棄。 | Gain 2 Energy next turn. Exhaust. | OK |
| GREAT_OAK | 大樹のカシ | ブロック35を得る。廃棄。 | Gain 35 Block. Exhaust. | OK |
| MORNING_GLORY | 朝露のアサガオ | 敵全体をへろへろ2にする。廃棄。 | Apply 2 Weak to all enemies. Exhaust. | OK |
| RAINBOW_HYDRANGEA | 七変化のアジサイ | 手札の枚数x4ダメージ。廃棄。 | Deal 4 damage for each card in your hand. Exhaust. | OK (explicit card text) |
| ECHO_BLUEBELL | 響き渡る鈴蘭 | 敵全体をびくびく2にする。廃棄。 | Apply 2 Vulnerable to all enemies. Exhaust. | OK |
| FORBIDDEN_APPLE | 禁断のリンゴ | 最大HP+5。廃棄。 | If this defeats an enemy or resolves, increase max HP by 5. Exhaust. | OK |
| SOLAR_ORANGE | 太陽のオレンジ | カチカチ3を得る。 | Gain 3 Dexterity. | OK |
| RICH_GRAPE | 芳醇なブドウ | 10ダメージ。ムキムキの効果が3倍になる。廃棄。 | Deal 10 damage. Triple the effect of Strength. Exhaust. | OK (explicit card text) |
| LAYERED_CABBAGE | 幾重のキャベツ | ブロック10。ドクドク4を与える。廃棄。 | Gain 10 Block. Apply 4 Poison. Exhaust. | OK |
| SWORD_DAIKON | 斬鉄ダイコン | 28ダメージ。廃棄。 | Deal 28 damage. Exhaust. | OK |
| MYSTIC_MUSHROOM | 幻覚キノコ | ランダムなカード2枚を手札に加える。廃棄。 | Add 2 random cards to your hand. Exhaust. | OK (explicit card text) |
| SACRED_LILY | 純白のユリ | 次に使うスキルは2回発動する。 | Your next Skill is played 2 times. | OK |
| WINTER_CAMELLIA | 冬枯れのツバキ | 8ダメージ。HPを全ダメージ分回復。廃棄。 | Deal 8 damage. Heal HP equal to unblocked damage dealt. Exhaust. | OK |
| AUTUMN_COSMOS | 秋空のコスモス | カードを3枚引く。廃棄。 | Draw 3 cards. Exhaust. | OK |
| FLUFFY_DANDELION | 綿毛のタンポポ | 「えんぴつの削りかす」を3枚手札に加える。廃棄。 | Add 3 Pencil Shavings to your hand at 0 cost. Exhaust. | OK |
| WISDOM_GINKGO | 知恵のイチョウ | 12ダメージ。これで倒すと永続的に威力+3。廃棄。 | Deal 12 damage. If this defeats an enemy, permanently increase this card's damage by 3. Exhaust. | OK |
| CAUSTIC_WASABI | 劇薬ワサビ | ドクドクを3倍にする。廃棄。 | Multiply the target's Poison by 3. Exhaust. | OK |
| POWER_SHIITAKE | 剛力のシイタケ | ムキムキ2を得る。廃棄。 | Gain 2 Strength. Exhaust. | OK |
| BOUNTY_PERSIMMON | 豊穣のカキ | 次のターン、追加で2枚引く。廃棄。 | Draw 2 extra cards next turn. Exhaust. | OK |
| EARLY_PLUM | 早咲きのウメ | 次のターン、エナジー1を得る。廃棄。 | Gain 1 Energy next turn. Exhaust. | OK |
| AWAKE_COFFEE | 覚醒のコーヒー | エナジー2を得る。1枚引く。HPを1失う。廃棄。 | Draw 1 card. Gain 2 Energy. Lose 1 HP. Exhaust. | OK |
| SWEET_CACAO | 魅惑のカカオ | 手札を全て捨て、同数引く。廃棄。 | Discard your hand, then draw the same number of cards. Exhaust. | OK (explicit card text) |
| EXPLOSIVE_PEPPER | 爆炎のコショウ | 全体20ダメージ。自分に3ダメージ。廃棄。 | Deal 20 damage to all enemies. Lose 3 HP. Exhaust. | OK |
| WILLOW_WIND | 柳に風 | スケスケ1（無敵）を得る。廃棄。 | Become Intangible for 1 turn. Exhaust. | OK |
| IRON_CYPRESS | 鉄壁のヒノキ | ブロックがターン終了時に消えない。 | Block is not removed at the end of your turn. | OK |
| MEDICINAL_ALOE | 医薬のアロエ | HPを20回復。廃棄。 | Heal 20 HP. Exhaust. | OK |
| REFRESH_MINT | 清涼のミント | 全デバフを解除。1枚引く。廃棄。 | Draw 1 card. Remove all debuffs. Exhaust. | OK |
| FRAGRANT_JASMINE | 香華のジャスミン | ターン開始時に追加で2枚引く。 | Draw 2 extra cards at the start of each turn. | OK |
| ULTIMATE_BONSAI | 至高の盆栽 | 現在のブロック値分ダメージ。廃棄。 | Deal damage equal to your current Block. Exhaust. | OK |
| YGGDRASIL | ユグドラシル | デッキの全カードを強化。廃棄。 | Upgrade all cards for this combat. Exhaust. | OK |

## 拡張カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| EXP_ELEM_JP_01 | 音読リズム | 5ダメージ。手札の左端から使用した時、カードを1枚引く。 | Deal 5 damage. When played from the leftmost position in your hand, draw 1 card. | OK |
| EXP_ELEM_JP_02 | 要点マーカー | ブロック6。手札の左端から使用した時、ブロック5を得る。 | Gain 6 Block. When played from the leftmost position in your hand, gain 5 Block. | OK |
| EXP_ELEM_JP_03 | 段落構成 | ブロック7。手札の左端から使用した時、エナジー1を得る。 | Gain 7 Block. When played from the leftmost position in your hand, gain 1 Energy. | OK |
| EXP_ELEM_JP_04 | 推敲タイム | ブロック8。手札の左端から使用した時、HPを3回復する。 | Gain 8 Block. When played from the leftmost position in your hand, heal 3 HP. | OK |
| EXP_ELEM_JP_05 | 主述ライン | 9ダメージ。手札の左端から使用した時、次ターンのドロー+1。 | Deal 9 damage. When played from the leftmost position in your hand, draw 1 extra card next turn. | OK |
| EXP_ELEM_JP_06 | ことばの貯金箱 | ブロック10。手札の左端から使用した時、次ターンのエナジー+1。 | Gain 10 Block. When played from the leftmost position in your hand, gain 1 Energy next turn. | OK |
| EXP_ELEM_JP_07 | 百字要約 | ブロック11。手札の左端から使用した時、ムキムキ1を得る。 | Gain 11 Block. When played from the leftmost position in your hand, gain 1 Strength. | OK |
| EXP_ELEM_MATH_01 | 暗算ウォームアップ | ブロック5。手札の左端から使用した時、カチカチ1を得る。 | Gain 5 Block. When played from the leftmost position in your hand, gain 1 Dexterity. | OK |
| EXP_ELEM_MATH_02 | ひっ算の列 | 6ダメージ。手札の左端から使用した時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When played from the leftmost position in your hand, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_MATH_03 | 分度器ガード | ブロック7。手札の左端から使用した時、敵全体にへろへろ1を与える。 | Gain 7 Block. When played from the leftmost position in your hand, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_MATH_04 | 公倍数コンボ | 8ダメージ。手札の左端から使用した時、捨て札から1枚を手札へ戻す。 | Deal 8 damage. When played from the leftmost position in your hand, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_MATH_05 | ぴったりゼロ | ブロック9。手札の左端から使用した時、手札の別カード1枚を強化する。 | Gain 9 Block. When played from the leftmost position in your hand, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_MATH_06 | 面積展開 | 10ダメージ。手札の左端から使用した時、手札の別カード1枚のコストを1下げる。 | Deal 10 damage. When played from the leftmost position in your hand, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_MATH_07 | 無限小数 | ブロック11。手札の左端から使用した時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When played from the leftmost position in your hand, gain Block equal to your hand size before playing this card. | OK |
| EXP_ELEM_SCI_01 | 試験管シェイク | 5ダメージ。手札の右端から使用した時、カードを1枚引く。 | Deal 5 damage. When played from the rightmost position in your hand, draw 1 card. | OK |
| EXP_ELEM_SCI_02 | 観察記録カード | ブロック6。手札の右端から使用した時、ブロック5を得る。 | Gain 6 Block. When played from the rightmost position in your hand, gain 5 Block. | OK |
| EXP_ELEM_SCI_03 | 静電気トラップ | ブロック7。手札の右端から使用した時、エナジー1を得る。 | Gain 7 Block. When played from the rightmost position in your hand, gain 1 Energy. | OK |
| EXP_ELEM_SCI_04 | 温度変化 | ブロック8。手札の右端から使用した時、HPを3回復する。 | Gain 8 Block. When played from the rightmost position in your hand, heal 3 HP. | OK |
| EXP_ELEM_SCI_05 | 発芽カウント | ブロック9。手札の右端から使用した時、次ターンのドロー+1。 | Gain 9 Block. When played from the rightmost position in your hand, draw 1 extra card next turn. | OK |
| EXP_ELEM_SCI_06 | てこの一点 | 10ダメージ。手札の右端から使用した時、次ターンのエナジー+1。 | Deal 10 damage. When played from the rightmost position in your hand, gain 1 Energy next turn. | OK |
| EXP_ELEM_SCI_07 | 自由研究の完成 | ブロック11。手札の右端から使用した時、ムキムキ1を得る。 | Gain 11 Block. When played from the rightmost position in your hand, gain 1 Strength. | OK |
| EXP_ELEM_SOC_01 | 地図記号サーチ | ブロック5。手札の右端から使用した時、カチカチ1を得る。 | Gain 5 Block. When played from the rightmost position in your hand, gain 1 Dexterity. | OK |
| EXP_ELEM_SOC_02 | 県境ライン | ブロック6。手札の右端から使用した時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When played from the rightmost position in your hand, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_SOC_03 | 資料読み取り | ブロック7。手札の右端から使用した時、敵全体にへろへろ1を与える。 | Gain 7 Block. When played from the rightmost position in your hand, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_SOC_04 | 交易ルート | ブロック8。手札の右端から使用した時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When played from the rightmost position in your hand, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_SOC_05 | 人口グラフ | 9ダメージ。手札の右端から使用した時、手札の別カード1枚を強化する。 | Deal 9 damage. When played from the rightmost position in your hand, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_SOC_06 | 歴史年表 | ブロック10。手札の右端から使用した時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When played from the rightmost position in your hand, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_SOC_07 | 世界一周ノート | ブロック11。手札の右端から使用した時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When played from the rightmost position in your hand, gain Block equal to your hand size before playing this card. | OK |
| EXP_ELEM_ENG_01 | リピート・アフター・ミー | ブロック5。使用前の手札枚数が偶数の時、カードを1枚引く。 | Gain 5 Block. When your hand size before playing this card is even, draw 1 card. | OK |
| EXP_ELEM_ENG_02 | スペルショット | 6ダメージ。使用前の手札枚数が偶数の時、ブロック5を得る。 | Deal 6 damage. When your hand size before playing this card is even, gain 5 Block. | OK |
| EXP_ELEM_ENG_03 | クエスチョンタイム | ブロック7。使用前の手札枚数が偶数の時、エナジー1を得る。 | Gain 7 Block. When your hand size before playing this card is even, gain 1 Energy. | OK |
| EXP_ELEM_ENG_04 | ペアトーク | ブロック8。使用前の手札枚数が偶数の時、HPを3回復する。 | Gain 8 Block. When your hand size before playing this card is even, heal 3 HP. | OK |
| EXP_ELEM_ENG_05 | サイトワード連打 | 9ダメージ。使用前の手札枚数が偶数の時、次ターンのドロー+1。 | Deal 9 damage. When your hand size before playing this card is even, draw 1 extra card next turn. | OK |
| EXP_ELEM_ENG_06 | スピーチメモ | ブロック10。使用前の手札枚数が偶数の時、次ターンのエナジー+1。 | Gain 10 Block. When your hand size before playing this card is even, gain 1 Energy next turn. | OK |
| EXP_ELEM_ENG_07 | ワールド・コール | ブロック11。使用前の手札枚数が偶数の時、ムキムキ1を得る。 | Gain 11 Block. When your hand size before playing this card is even, gain 1 Strength. | OK |
| EXP_ELEM_PE_01 | 準備体操 | ブロック5。使用前の手札枚数が偶数の時、カチカチ1を得る。 | Gain 5 Block. When your hand size before playing this card is even, gain 1 Dexterity. | OK |
| EXP_ELEM_PE_02 | サイドステップ連続 | 6ダメージ。使用前の手札枚数が偶数の時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When your hand size before playing this card is even, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_PE_03 | ラインぎわセーブ | ブロック7。使用前の手札枚数が偶数の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your hand size before playing this card is even, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_PE_04 | バトンパス | ブロック8。使用前の手札枚数が偶数の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your hand size before playing this card is even, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_PE_05 | ラストスパート | 9ダメージ。使用前の手札枚数が偶数の時、手札の別カード1枚を強化する。 | Deal 9 damage. When your hand size before playing this card is even, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_PE_06 | 持久力メーター | ブロック10。使用前の手札枚数が偶数の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When your hand size before playing this card is even, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_PE_07 | 全力リレー | 11×Xダメージ。使用前の手札枚数が偶数の時、使用前の手札枚数と同じブロックを得る。 | Deal 11 damage per Energy spent. When your hand size before playing this card is even, gain Block equal to your hand size before playing this card. | OK |
| EXP_ELEM_ART_01 | 四分音符ステップ | 5ダメージ。使用前の手札枚数が奇数の時、カードを1枚引く。 | Deal 5 damage. When your hand size before playing this card is odd, draw 1 card. | OK |
| EXP_ELEM_ART_02 | 色まぜパレット | ブロック6。使用前の手札枚数が奇数の時、ブロック5を得る。 | Gain 6 Block. When your hand size before playing this card is odd, gain 5 Block. | OK |
| EXP_ELEM_ART_03 | 消しゴムデッサン | ブロック7。使用前の手札枚数が奇数の時、エナジー1を得る。 | Gain 7 Block. When your hand size before playing this card is odd, gain 1 Energy. | OK |
| EXP_ELEM_ART_04 | クレッシェンド | ブロック8。使用前の手札枚数が奇数の時、HPを3回復する。 | Gain 8 Block. When your hand size before playing this card is odd, heal 3 HP. | OK |
| EXP_ELEM_ART_05 | 版画リピート | 9ダメージ。使用前の手札枚数が奇数の時、次ターンのドロー+1。 | Deal 9 damage. When your hand size before playing this card is odd, draw 1 extra card next turn. | OK |
| EXP_ELEM_ART_06 | 乾くまで待つ絵 | ブロック10。使用前の手札枚数が奇数の時、次ターンのエナジー+1。 | Gain 10 Block. When your hand size before playing this card is odd, gain 1 Energy next turn. | OK |
| EXP_ELEM_ART_07 | 完成作品 | ブロック11。使用前の手札枚数が奇数の時、ムキムキ1を得る。 | Gain 11 Block. When your hand size before playing this card is odd, gain 1 Strength. | OK |
| EXP_ELEM_HOME_01 | 朝ごはんチャージ | ブロック5。使用前の手札枚数が奇数の時、カチカチ1を得る。 | Gain 5 Block. When your hand size before playing this card is odd, gain 1 Dexterity. | OK |
| EXP_ELEM_HOME_02 | 整理整頓ボックス | ブロック6。使用前の手札枚数が奇数の時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When your hand size before playing this card is odd, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_HOME_03 | 洗濯ばさみガード | ブロック7。使用前の手札枚数が奇数の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your hand size before playing this card is odd, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_HOME_04 | 味見スプーン | ブロック8。使用前の手札枚数が奇数の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your hand size before playing this card is odd, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_HOME_05 | お手伝いスタンプ | ブロック9。使用前の手札枚数が奇数の時、手札の別カード1枚を強化する。 | Gain 9 Block. When your hand size before playing this card is odd, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_HOME_06 | 作り置きおかず | ブロック10。使用前の手札枚数が奇数の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When your hand size before playing this card is odd, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_HOME_07 | 家族会議 | ブロック11。使用前の手札枚数が奇数の時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When your hand size before playing this card is odd, gain Block equal to your hand size before playing this card. | OK |
| EXP_ELEM_IT_01 | ショートカットキー | ブロック5。使用後のエナジーが0になる時、カードを1枚引く。 | Gain 5 Block. When playing this card leaves you with 0 Energy, draw 1 card. | OK |
| EXP_ELEM_IT_02 | フォルダ整理 | ブロック6。使用後のエナジーが0になる時、ブロック5を得る。 | Gain 6 Block. When playing this card leaves you with 0 Energy, gain 5 Block. | OK |
| EXP_ELEM_IT_03 | パスワード更新 | ブロック7。使用後のエナジーが0になる時、エナジー1を得る。 | Gain 7 Block. When playing this card leaves you with 0 Energy, gain 1 Energy. | OK |
| EXP_ELEM_IT_04 | バックアップ保存 | ブロック8。使用後のエナジーが0になる時、HPを3回復する。 | Gain 8 Block. When playing this card leaves you with 0 Energy, heal 3 HP. | OK |
| EXP_ELEM_IT_05 | デバッグ実行 | ブロック9。使用後のエナジーが0になる時、次ターンのドロー+1。 | Gain 9 Block. When playing this card leaves you with 0 Energy, draw 1 extra card next turn. | OK |
| EXP_ELEM_IT_06 | クラウド同期 | ブロック10。使用後のエナジーが0になる時、次ターンのエナジー+1。 | Gain 10 Block. When playing this card leaves you with 0 Energy, gain 1 Energy next turn. | OK |
| EXP_ELEM_IT_07 | 無限ループ警報 | ブロック11。使用後のエナジーが0になる時、ムキムキ1を得る。 | Gain 11 Block. When playing this card leaves you with 0 Energy, gain 1 Strength. | OK |
| EXP_ELEM_SCHOOL_01 | 朝のあいさつ当番 | ブロック5。使用後のエナジーが0になる時、カチカチ1を得る。 | Gain 5 Block. When playing this card leaves you with 0 Energy, gain 1 Dexterity. | OK |
| EXP_ELEM_SCHOOL_02 | 係活動の連携 | ブロック6。使用後のエナジーが0になる時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When playing this card leaves you with 0 Energy, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_SCHOOL_03 | 席替えくじ | ブロック7。使用後のエナジーが0になる時、敵全体にへろへろ1を与える。 | Gain 7 Block. When playing this card leaves you with 0 Energy, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_SCHOOL_04 | 応援メッセージ | ブロック8。使用後のエナジーが0になる時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When playing this card leaves you with 0 Energy, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_SCHOOL_05 | 学級目標 | ブロック9。使用後のエナジーが0になる時、手札の別カード1枚を強化する。 | Gain 9 Block. When playing this card leaves you with 0 Energy, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_SCHOOL_06 | 文化祭準備日 | ブロック10。使用後のエナジーが0になる時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When playing this card leaves you with 0 Energy, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_SCHOOL_07 | 全校集会の拍手 | ブロック11。使用後のエナジーが0になる時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When playing this card leaves you with 0 Energy, gain Block equal to your hand size before playing this card. | OK |
| EXP_ELEM_SEASON_01 | 春風ダッシュ | 5ダメージ。使用後のエナジーが偶数になる時、カードを1枚引く。 | Deal 5 damage. When your remaining Energy after playing this card is even, draw 1 card. | OK |
| EXP_ELEM_SEASON_02 | 雨宿りベンチ | ブロック6。使用後のエナジーが偶数になる時、ブロック5を得る。 | Gain 6 Block. When your remaining Energy after playing this card is even, gain 5 Block. | OK |
| EXP_ELEM_SEASON_03 | 夏雲スケッチ | ブロック7。使用後のエナジーが偶数になる時、エナジー1を得る。 | Gain 7 Block. When your remaining Energy after playing this card is even, gain 1 Energy. | OK |
| EXP_ELEM_SEASON_04 | 落ち葉トラップ | ブロック8。使用後のエナジーが偶数になる時、HPを3回復する。 | Gain 8 Block. When your remaining Energy after playing this card is even, heal 3 HP. | OK |
| EXP_ELEM_SEASON_05 | 雪玉ストック | 9ダメージ。使用後のエナジーが偶数になる時、次ターンのドロー+1。 | Deal 9 damage. When your remaining Energy after playing this card is even, draw 1 extra card next turn. | OK |
| EXP_ELEM_SEASON_06 | 星空キャンプ | ブロック10。使用後のエナジーが偶数になる時、次ターンのエナジー+1。 | Gain 10 Block. When your remaining Energy after playing this card is even, gain 1 Energy next turn. | OK |
| EXP_ELEM_SEASON_07 | 四季一巡 | ブロック11。使用後のエナジーが偶数になる時、ムキムキ1を得る。 | Gain 11 Block. When your remaining Energy after playing this card is even, gain 1 Strength. | OK |
| EXP_ELEM_BOOK_01 | しおりを挟む | ブロック5。使用後のエナジーが偶数になる時、カチカチ1を得る。 | Gain 5 Block. When your remaining Energy after playing this card is even, gain 1 Dexterity. | OK |
| EXP_ELEM_BOOK_02 | 冒険の第一章 | 6ダメージ。使用後のエナジーが偶数になる時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When your remaining Energy after playing this card is even, apply 3 Poison to a random living enemy. | OK |
| EXP_ELEM_BOOK_03 | 伏線メモ | ブロック7。使用後のエナジーが偶数になる時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your remaining Energy after playing this card is even, apply 1 Weak to all living enemies. | OK |
| EXP_ELEM_BOOK_04 | ページを戻る | ブロック8。使用後のエナジーが偶数になる時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your remaining Energy after playing this card is even, return 1 card from your discard pile to your hand. | OK |
| EXP_ELEM_BOOK_05 | どんでん返し | 9ダメージ。使用後のエナジーが偶数になる時、手札の別カード1枚を強化する。 | Deal 9 damage. When your remaining Energy after playing this card is even, upgrade 1 other card in your hand. | OK |
| EXP_ELEM_BOOK_06 | 語り継ぐ本棚 | ブロック10。使用後のエナジーが偶数になる時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When your remaining Energy after playing this card is even, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_ELEM_BOOK_07 | 物語の最終ページ | ブロック11。使用後のエナジーが偶数になる時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When your remaining Energy after playing this card is even, gain Block equal to your hand size before playing this card. | OK |
| EXP_HS_SCI_01 | 滴定ポイント | 5ダメージ。使用時のブロックが0の時、カードを1枚引く。 | Deal 5 damage. When played while you have 0 Block, draw 1 card. | OK |
| EXP_HS_SCI_02 | 安全眼鏡 | ブロック6。使用時のブロックが0の時、ブロック5を得る。 | Gain 6 Block. When played while you have 0 Block, gain 5 Block. | OK |
| EXP_HS_SCI_03 | 対照実験 | ブロック7。使用時のブロックが0の時、エナジー1を得る。 | Gain 7 Block. When played while you have 0 Block, gain 1 Energy. | OK |
| EXP_HS_SCI_04 | 触媒投入 | ブロック8。使用時のブロックが0の時、HPを3回復する。 | Gain 8 Block. When played while you have 0 Block, heal 3 HP. | OK |
| EXP_HS_SCI_05 | 反応速度式 | ブロック9。使用時のブロックが0の時、次ターンのドロー+1。 | Gain 9 Block. When played while you have 0 Block, draw 1 extra card next turn. | OK |
| EXP_HS_SCI_06 | 臨界点突破 | 10×Xダメージ。使用時のブロックが0の時、次ターンのエナジー+1。 | Deal 10 damage per Energy spent. When played while you have 0 Block, gain 1 Energy next turn. | OK |
| EXP_HS_SCI_07 | 研究発表・再現成功 | ブロック11。使用時のブロックが0の時、ムキムキ1を得る。 | Gain 11 Block. When played while you have 0 Block, gain 1 Strength. | OK |
| EXP_HS_SPORT_01 | スタートダッシュ | 5ダメージ。使用時のブロックが0の時、カチカチ1を得る。 | Deal 5 damage. When played while you have 0 Block, gain 1 Dexterity. | OK |
| EXP_HS_SPORT_02 | ゾーンディフェンス | ブロック6。使用時のブロックが0の時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When played while you have 0 Block, apply 3 Poison to a random living enemy. | OK |
| EXP_HS_SPORT_03 | カウンタープレス | 7ダメージ。使用時のブロックが0の時、敵全体にへろへろ1を与える。 | Deal 7 damage. When played while you have 0 Block, apply 1 Weak to all living enemies. | OK |
| EXP_HS_SPORT_04 | タイムアウト指示 | ブロック8。使用時のブロックが0の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When played while you have 0 Block, return 1 card from your discard pile to your hand. | OK |
| EXP_HS_SPORT_05 | エースへのパス | ブロック9。使用時のブロックが0の時、手札の別カード1枚を強化する。 | Gain 9 Block. When played while you have 0 Block, upgrade 1 other card in your hand. | OK |
| EXP_HS_SPORT_06 | 延長戦の集中 | ブロック10。使用時のブロックが0の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When played while you have 0 Block, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_HS_SPORT_07 | 逆転のブザービーター | 11ダメージ。使用時のブロックが0の時、使用前の手札枚数と同じブロックを得る。 | Deal 11 damage. When played while you have 0 Block, gain Block equal to your hand size before playing this card. | OK |
| EXP_HS_HUM_01 | 論点整理 | ブロック5。HPが半分以下の時、カードを1枚引く。 | Gain 5 Block. When your HP is half or lower, draw 1 card. | OK |
| EXP_HS_HUM_02 | 史料批判 | 6ダメージ。HPが半分以下の時、ブロック5を得る。 | Deal 6 damage. When your HP is half or lower, gain 5 Block. | OK |
| EXP_HS_HUM_03 | 反証の一文 | ブロック7。HPが半分以下の時、エナジー1を得る。 | Gain 7 Block. When your HP is half or lower, gain 1 Energy. | OK |
| EXP_HS_HUM_04 | 引用カード | ブロック8。HPが半分以下の時、HPを3回復する。 | Gain 8 Block. When your HP is half or lower, heal 3 HP. | OK |
| EXP_HS_HUM_05 | 比較文化レポート | ブロック9。HPが半分以下の時、次ターンのドロー+1。 | Gain 9 Block. When your HP is half or lower, draw 1 extra card next turn. | OK |
| EXP_HS_HUM_06 | 未解決の問い | ブロック10。HPが半分以下の時、次ターンのエナジー+1。 | Gain 10 Block. When your HP is half or lower, gain 1 Energy next turn. | OK |
| EXP_HS_HUM_07 | 卒業論文の結論 | 11ダメージ。HPが半分以下の時、ムキムキ1を得る。 | Deal 11 damage. When your HP is half or lower, gain 1 Strength. | OK |
| EXP_HS_COUNCIL_01 | 議事録確認 | ブロック5。HPが半分以下の時、カチカチ1を得る。 | Gain 5 Block. When your HP is half or lower, gain 1 Dexterity. | OK |
| EXP_HS_COUNCIL_02 | 予算再配分 | ブロック6。HPが半分以下の時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When your HP is half or lower, apply 3 Poison to a random living enemy. | OK |
| EXP_HS_COUNCIL_03 | 校則の見直し | ブロック7。HPが半分以下の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your HP is half or lower, apply 1 Weak to all living enemies. | OK |
| EXP_HS_COUNCIL_04 | 多数決 | ブロック8。HPが半分以下の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your HP is half or lower, return 1 card from your discard pile to your hand. | OK |
| EXP_HS_COUNCIL_05 | 緊急動議 | ブロック9。HPが半分以下の時、手札の別カード1枚を強化する。 | Gain 9 Block. When your HP is half or lower, upgrade 1 other card in your hand. | OK |
| EXP_HS_COUNCIL_06 | 執行部の連携 | ブロック10。HPが半分以下の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When your HP is half or lower, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_HS_COUNCIL_07 | 全校改革プラン | ブロック11。HPが半分以下の時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When your HP is half or lower, gain Block equal to your hand size before playing this card. | OK |
| EXP_HS_TECH_01 | センサー照準 | ブロック5。生存中の敵が攻撃予定の時、カードを1枚引く。 | Gain 5 Block. When any living enemy intends to attack, draw 1 card. | OK |
| EXP_HS_TECH_02 | 並列処理 | ブロック6。生存中の敵が攻撃予定の時、ブロック5を得る。 | Gain 6 Block. When any living enemy intends to attack, gain 5 Block. | OK |
| EXP_HS_TECH_03 | 例外処理 | ブロック7。生存中の敵が攻撃予定の時、エナジー1を得る。 | Gain 7 Block. When any living enemy intends to attack, gain 1 Energy. | OK |
| EXP_HS_TECH_04 | オーバークロック | ブロック8。生存中の敵が攻撃予定の時、HPを3回復する。 | Gain 8 Block. When any living enemy intends to attack, heal 3 HP. | OK |
| EXP_HS_TECH_05 | ドローン追撃 | 9ダメージ。生存中の敵が攻撃予定の時、次ターンのドロー+1。 | Deal 9 damage. When any living enemy intends to attack, draw 1 extra card next turn. | OK |
| EXP_HS_TECH_06 | ロールバック | ブロック10。生存中の敵が攻撃予定の時、次ターンのエナジー+1。 | Gain 10 Block. When any living enemy intends to attack, gain 1 Energy next turn. | OK |
| EXP_HS_TECH_07 | 自律学習コア | ブロック11。生存中の敵が攻撃予定の時、ムキムキ1を得る。 | Gain 11 Block. When any living enemy intends to attack, gain 1 Strength. | OK |
| EXP_HS_STAGE_01 | リハーサルテイク | ブロック5。生存中の敵が攻撃予定の時、カチカチ1を得る。 | Gain 5 Block. When any living enemy intends to attack, gain 1 Dexterity. | OK |
| EXP_HS_STAGE_02 | スポットライト | 6ダメージ。生存中の敵が攻撃予定の時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When any living enemy intends to attack, apply 3 Poison to a random living enemy. | OK |
| EXP_HS_STAGE_03 | ハモリパート | ブロック7。生存中の敵が攻撃予定の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When any living enemy intends to attack, apply 1 Weak to all living enemies. | OK |
| EXP_HS_STAGE_04 | 舞台転換 | ブロック8。生存中の敵が攻撃予定の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When any living enemy intends to attack, return 1 card from your discard pile to your hand. | OK |
| EXP_HS_STAGE_05 | 即興ソロ | 9×Xダメージ。生存中の敵が攻撃予定の時、手札の別カード1枚を強化する。 | Deal 9 damage per Energy spent. When any living enemy intends to attack, upgrade 1 other card in your hand. | OK |
| EXP_HS_STAGE_06 | アンコール予約 | ブロック10。生存中の敵が攻撃予定の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When any living enemy intends to attack, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_HS_STAGE_07 | 満員御礼フィナーレ | 11ダメージ。生存中の敵が攻撃予定の時、使用前の手札枚数と同じブロックを得る。 | Deal 11 damage. When any living enemy intends to attack, gain Block equal to your hand size before playing this card. | OK |
| EXP_HS_LIFE_01 | 栄養バランス | ブロック5。生存中の敵が全員攻撃予定でない時、カードを1枚引く。 | Gain 5 Block. When no living enemy intends to attack, draw 1 card. | OK |
| EXP_HS_LIFE_02 | 下ごしらえ | ブロック6。生存中の敵が全員攻撃予定でない時、ブロック5を得る。 | Gain 6 Block. When no living enemy intends to attack, gain 5 Block. | OK |
| EXP_HS_LIFE_03 | 火加減調整 | ブロック7。生存中の敵が全員攻撃予定でない時、エナジー1を得る。 | Gain 7 Block. When no living enemy intends to attack, gain 1 Energy. | OK |
| EXP_HS_LIFE_04 | 発酵待ち | ブロック8。生存中の敵が全員攻撃予定でない時、HPを3回復する。 | Gain 8 Block. When no living enemy intends to attack, heal 3 HP. | OK |
| EXP_HS_LIFE_05 | 食品ロス削減 | ブロック9。生存中の敵が全員攻撃予定でない時、次ターンのドロー+1。 | Gain 9 Block. When no living enemy intends to attack, draw 1 extra card next turn. | OK |
| EXP_HS_LIFE_06 | 献立ローテーション | ブロック10。生存中の敵が全員攻撃予定でない時、次ターンのエナジー+1。 | Gain 10 Block. When no living enemy intends to attack, gain 1 Energy next turn. | OK |
| EXP_HS_LIFE_07 | 祝宴のフルコース | ブロック11。生存中の敵が全員攻撃予定でない時、ムキムキ1を得る。 | Gain 11 Block. When no living enemy intends to attack, gain 1 Strength. | OK |
| EXP_HS_CAREER_01 | 過去問チェック | ブロック5。生存中の敵が全員攻撃予定でない時、カチカチ1を得る。 | Gain 5 Block. When no living enemy intends to attack, gain 1 Dexterity. | OK |
| EXP_HS_CAREER_02 | 模試の手応え | 6ダメージ。生存中の敵が全員攻撃予定でない時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When no living enemy intends to attack, apply 3 Poison to a random living enemy. | OK |
| EXP_HS_CAREER_03 | 弱点分析シート | ブロック7。生存中の敵が全員攻撃予定でない時、敵全体にへろへろ1を与える。 | Gain 7 Block. When no living enemy intends to attack, apply 1 Weak to all living enemies. | OK |
| EXP_HS_CAREER_04 | 学習計画の修正 | ブロック8。生存中の敵が全員攻撃予定でない時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When no living enemy intends to attack, return 1 card from your discard pile to your hand. | OK |
| EXP_HS_CAREER_05 | 志望理由書 | ブロック9。生存中の敵が全員攻撃予定でない時、手札の別カード1枚を強化する。 | Gain 9 Block. When no living enemy intends to attack, upgrade 1 other card in your hand. | OK |
| EXP_HS_CAREER_06 | 判定アップ | ブロック10。生存中の敵が全員攻撃予定でない時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When no living enemy intends to attack, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_HS_CAREER_07 | 合格発表 | ブロック11。生存中の敵が全員攻撃予定でない時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When no living enemy intends to attack, gain Block equal to your hand size before playing this card. | OK |
| EXP_CROSS_PRESENT_01 | 要点をつかむ発表 | 5ダメージ。山札の枚数が偶数の時、カードを1枚引く。 | Deal 5 damage. When your draw pile size is even, draw 1 card. | OK |
| EXP_CROSS_PRESENT_02 | 選択式ブレインストーム | ブロック6。山札の枚数が偶数の時、ブロック5を得る。 | Gain 6 Block. When your draw pile size is even, gain 5 Block. | OK |
| EXP_CROSS_PRESENT_03 | 三部構成スライド | ブロック7。山札の枚数が偶数の時、エナジー1を得る。 | Gain 7 Block. When your draw pile size is even, gain 1 Energy. | OK |
| EXP_CROSS_PRESENT_04 | 最終プレゼンテーション | 8ダメージ。山札の枚数が偶数の時、HPを3回復する。 | Deal 8 damage. When your draw pile size is even, heal 3 HP. | OK |
| EXP_CROSS_ASTRONOMY_01 | 月齢スケッチ | 9ダメージ。山札の枚数が偶数の時、次ターンのドロー+1。 | Deal 9 damage. When your draw pile size is even, draw 1 extra card next turn. | OK |
| EXP_CROSS_ASTRONOMY_02 | 天球座標計算 | ブロック10。山札の枚数が偶数の時、次ターンのエナジー+1。 | Gain 10 Block. When your draw pile size is even, gain 1 Energy next turn. | OK |
| EXP_CROSS_ASTRONOMY_03 | 反射望遠鏡 | ブロック11。山札の枚数が偶数の時、ムキムキ1を得る。 | Gain 11 Block. When your draw pile size is even, gain 1 Strength. | OK |
| EXP_CROSS_ASTRONOMY_04 | 皆既月食レポート | ブロック5。山札の枚数が偶数の時、カチカチ1を得る。 | Gain 5 Block. When your draw pile size is even, gain 1 Dexterity. | OK |
| EXP_CROSS_GROWING_01 | 花粉サンプル | 6ダメージ。山札の枚数が偶数の時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When your draw pile size is even, apply 3 Poison to a random living enemy. | OK |
| EXP_CROSS_GROWING_02 | ハーブ標本 | ブロック7。山札の枚数が偶数の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your draw pile size is even, apply 1 Weak to all living enemies. | OK |
| EXP_CROSS_GROWING_03 | 生育温室 | ブロック8。山札の枚数が偶数の時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your draw pile size is even, return 1 card from your discard pile to your hand. | OK |
| EXP_CROSS_GROWING_04 | 長期再生計画 | ブロック9。山札の枚数が偶数の時、手札の別カード1枚を強化する。 | Gain 9 Block. When your draw pile size is even, upgrade 1 other card in your hand. | OK |
| EXP_CROSS_CRAFT_01 | 熱処理テスト | 10ダメージ。山札の枚数が偶数の時、手札の別カード1枚のコストを1下げる。 | Deal 10 damage. When your draw pile size is even, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_CROSS_CRAFT_02 | 加工方法セレクト | ブロック11。山札の枚数が偶数の時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When your draw pile size is even, gain Block equal to your hand size before playing this card. | OK |
| EXP_CROSS_CRAFT_03 | 製作温度計 | ブロック5。捨て札の枚数が奇数の時、カードを1枚引く。 | Gain 5 Block. When your discard pile size is odd, draw 1 card. | OK |
| EXP_CROSS_CRAFT_04 | 大型作品の完成 | 6×Xダメージ。捨て札の枚数が奇数の時、ブロック5を得る。 | Deal 6 damage per Energy spent. When your discard pile size is odd, gain 5 Block. | OK |
| EXP_CROSS_HISTORY_01 | 史料の封印 | 7ダメージ。捨て札の枚数が奇数の時、エナジー1を得る。 | Deal 7 damage. When your discard pile size is odd, gain 1 Energy. | OK |
| EXP_CROSS_HISTORY_02 | 古文書の返却 | ブロック8。捨て札の枚数が奇数の時、HPを3回復する。 | Gain 8 Block. When your discard pile size is odd, heal 3 HP. | OK |
| EXP_CROSS_HISTORY_03 | 資料庫の番人 | ブロック9。捨て札の枚数が奇数の時、次ターンのドロー+1。 | Gain 9 Block. When your discard pile size is odd, draw 1 extra card next turn. | OK |
| EXP_CROSS_HISTORY_04 | 史料批判の総括 | ブロック10。捨て札の枚数が奇数の時、次ターンのエナジー+1。 | Gain 10 Block. When your discard pile size is odd, gain 1 Energy next turn. | OK |
| EXP_CROSS_LABLOG_01 | 再試行ログ | 11ダメージ。捨て札の枚数が奇数の時、ムキムキ1を得る。 | Deal 11 damage. When your discard pile size is odd, gain 1 Strength. | OK |
| EXP_CROSS_LABLOG_02 | 試料タイムカプセル | ブロック5。捨て札の枚数が奇数の時、カチカチ1を得る。 | Gain 5 Block. When your discard pile size is odd, gain 1 Dexterity. | OK |
| EXP_CROSS_LABLOG_03 | 並行実験ノート | ブロック6。捨て札の枚数が奇数の時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When your discard pile size is odd, apply 3 Poison to a random living enemy. | OK |
| EXP_CROSS_LABLOG_04 | 再現実験の確定 | ブロック7。捨て札の枚数が奇数の時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your discard pile size is odd, apply 1 Weak to all living enemies. | OK |
| EXP_CROSS_ENVIRONMENT_01 | 葉脈モデル | 8ダメージ。捨て札の枚数が奇数の時、捨て札から1枚を手札へ戻す。 | Deal 8 damage. When your discard pile size is odd, return 1 card from your discard pile to your hand. | OK |
| EXP_CROSS_ENVIRONMENT_02 | 環境ルート調査 | ブロック9。捨て札の枚数が奇数の時、手札の別カード1枚を強化する。 | Gain 9 Block. When your discard pile size is odd, upgrade 1 other card in your hand. | OK |
| EXP_CROSS_ENVIRONMENT_03 | 防風林計画 | ブロック10。捨て札の枚数が奇数の時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When your discard pile size is odd, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_CROSS_ENVIRONMENT_04 | 大気循環モデル | ブロック11。捨て札の枚数が奇数の時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When your discard pile size is odd, gain Block equal to your hand size before playing this card. | OK |
| EXP_CROSS_THEATER_01 | プリズム演出 | 5ダメージ。このターンにまだ攻撃していない時、カードを1枚引く。 | Deal 5 damage. When you have not played an Attack this turn, draw 1 card. | OK |
| EXP_CROSS_THEATER_02 | 衣装転換 | ブロック6。このターンにまだ攻撃していない時、ブロック5を得る。 | Gain 6 Block. When you have not played an Attack this turn, gain 5 Block. | OK |
| EXP_CROSS_THEATER_03 | 失敗の演出化 | ブロック7。このターンにまだ攻撃していない時、エナジー1を得る。 | Gain 7 Block. When you have not played an Attack this turn, gain 1 Energy. | OK |
| EXP_CROSS_THEATER_04 | カーテンコール | ブロック8。このターンにまだ攻撃していない時、HPを3回復する。 | Gain 8 Block. When you have not played an Attack this turn, heal 3 HP. | OK |
| EXP_CROSS_TRANSLATION_01 | 例文ハイライト | 9ダメージ。このターンにまだ攻撃していない時、次ターンのドロー+1。 | Deal 9 damage. When you have not played an Attack this turn, draw 1 extra card next turn. | OK |
| EXP_CROSS_TRANSLATION_02 | 二言語コード | ブロック10。このターンにまだ攻撃していない時、次ターンのエナジー+1。 | Gain 10 Block. When you have not played an Attack this turn, gain 1 Energy next turn. | OK |
| EXP_CROSS_TRANSLATION_03 | 対訳ライブラリ | ブロック11。このターンにまだ攻撃していない時、ムキムキ1を得る。 | Gain 11 Block. When you have not played an Attack this turn, gain 1 Strength. | OK |
| EXP_CROSS_TRANSLATION_04 | 最終校正 | 5ダメージ。このターンにまだ攻撃していない時、カチカチ1を得る。 | Deal 5 damage. When you have not played an Attack this turn, gain 1 Dexterity. | OK |
| EXP_CROSS_READING_01 | 句読点リズム | 6ダメージ。このターンにまだ攻撃していない時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When you have not played an Attack this turn, apply 3 Poison to a random living enemy. | OK |
| EXP_CROSS_READING_02 | 文脈バリア | ブロック7。このターンにまだ攻撃していない時、敵全体にへろへろ1を与える。 | Gain 7 Block. When you have not played an Attack this turn, apply 1 Weak to all living enemies. | OK |
| EXP_CROSS_READING_03 | 行間の手がかり | ブロック8。このターンにまだ攻撃していない時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When you have not played an Attack this turn, return 1 card from your discard pile to your hand. | OK |
| EXP_CROSS_READING_04 | 構成の総仕上げ | 9ダメージ。このターンにまだ攻撃していない時、手札の別カード1枚を強化する。 | Deal 9 damage. When you have not played an Attack this turn, upgrade 1 other card in your hand. | OK |
| EXP_CROSS_PROOF_01 | 等差数列 | 10ダメージ。このターンにまだ攻撃していない時、手札の別カード1枚のコストを1下げる。 | Deal 10 damage. When you have not played an Attack this turn, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_CROSS_PROOF_02 | 最適解の選別 | ブロック11。このターンにまだ攻撃していない時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When you have not played an Attack this turn, gain Block equal to your hand size before playing this card. | OK |
| EXP_CROSS_PROOF_03 | 証明プロトコル | ブロック5。このターン3枚目以降に使用した時、カードを1枚引く。 | Gain 5 Block. When played as your third or later card this turn, draw 1 card. | OK |
| EXP_CROSS_PROOF_04 | 証明完了 | ブロック6。このターン3枚目以降に使用した時、ブロック5を得る。 | Gain 6 Block. When played as your third or later card this turn, gain 5 Block. | OK |
| EXP_CROSS_CARE_01 | 細胞修復 | 7ダメージ。このターン3枚目以降に使用した時、エナジー1を得る。 | Deal 7 damage. When played as your third or later card this turn, gain 1 Energy. | OK |
| EXP_CROSS_CARE_02 | 生体バランス | ブロック8。このターン3枚目以降に使用した時、HPを3回復する。 | Gain 8 Block. When played as your third or later card this turn, heal 3 HP. | OK |
| EXP_CROSS_CARE_03 | ケア循環 | ブロック9。このターン3枚目以降に使用した時、次ターンのドロー+1。 | Gain 9 Block. When played as your third or later card this turn, draw 1 extra card next turn. | OK |
| EXP_CROSS_CARE_04 | 総合リカバリー | ブロック10。このターン3枚目以降に使用した時、次ターンのエナジー+1。 | Gain 10 Block. When played as your third or later card this turn, gain 1 Energy next turn. | OK |
| EXP_CROSS_FORECAST_01 | 先読み計算 | 11ダメージ。このターン3枚目以降に使用した時、ムキムキ1を得る。 | Deal 11 damage. When played as your third or later card this turn, gain 1 Strength. | OK |
| EXP_CROSS_FORECAST_02 | 分岐予測ノート | ブロック5。このターン3枚目以降に使用した時、カチカチ1を得る。 | Gain 5 Block. When played as your third or later card this turn, gain 1 Dexterity. | OK |
| EXP_CROSS_FORECAST_03 | 復元ポイント | ブロック6。このターン3枚目以降に使用した時、ランダムな敵にドクドク3を与える。 | Gain 6 Block. When played as your third or later card this turn, apply 3 Poison to a random living enemy. | OK |
| EXP_CROSS_FORECAST_04 | 予測の巻き戻し | ブロック7。このターン3枚目以降に使用した時、敵全体にへろへろ1を与える。 | Gain 7 Block. When played as your third or later card this turn, apply 1 Weak to all living enemies. | OK |
| EXP_CROSS_CONDITION_01 | 根性トレーニング | 8ダメージ。このターン3枚目以降に使用した時、捨て札から1枚を手札へ戻す。 | Deal 8 damage. When played as your third or later card this turn, return 1 card from your discard pile to your hand. | OK |
| EXP_CROSS_CONDITION_02 | 負荷分散ガード | ブロック9。このターン3枚目以降に使用した時、手札の別カード1枚を強化する。 | Gain 9 Block. When played as your third or later card this turn, upgrade 1 other card in your hand. | OK |
| EXP_CROSS_CONDITION_03 | 体調記録 | ブロック10。このターン3枚目以降に使用した時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When played as your third or later card this turn, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_CROSS_CONDITION_04 | 限界突破テスト | 11×Xダメージ。このターン3枚目以降に使用した時、使用前の手札枚数と同じブロックを得る。 | Deal 11 damage per Energy spent. When played as your third or later card this turn, gain Block equal to your hand size before playing this card. | OK |
| EXP_CROSS_AUDIO_01 | リズムフェイント | 5ダメージ。手札に攻撃カードがある時、カードを1枚引く。 | Deal 5 damage. When your hand contains an Attack card, draw 1 card. | OK |
| EXP_CROSS_AUDIO_02 | パートチェンジ | ブロック6。手札にスキルカードがある時、ブロック5を得る。 | Gain 6 Block. When your hand contains a Skill card, gain 5 Block. | OK |
| EXP_CROSS_AUDIO_03 | テンポ管理 | ブロック7。手札にパワーカードがある時、エナジー1を得る。 | Gain 7 Block. When your hand contains a Power card, gain 1 Energy. | OK |
| EXP_CROSS_AUDIO_04 | フィナーレ | 8ダメージ。手札に攻撃カードがある時、HPを3回復する。 | Deal 8 damage. When your hand contains an Attack card, heal 3 HP. | OK |
| EXP_CROSS_RESEARCH_01 | 調査キーワード | 9ダメージ。手札に攻撃カードがある時、次ターンのドロー+1。 | Deal 9 damage. When your hand contains an Attack card, draw 1 extra card next turn. | OK |
| EXP_CROSS_RESEARCH_02 | 辞書の索引 | ブロック10。手札にスキルカードがある時、次ターンのエナジー+1。 | Gain 10 Block. When your hand contains a Skill card, gain 1 Energy next turn. | OK |
| EXP_CROSS_RESEARCH_03 | 資料翻訳 | ブロック11。手札にパワーカードがある時、ムキムキ1を得る。 | Gain 11 Block. When your hand contains a Power card, gain 1 Strength. | OK |
| EXP_CROSS_RESEARCH_04 | 研究発表 | ブロック5。手札にスキルカードがある時、カチカチ1を得る。 | Gain 5 Block. When your hand contains a Skill card, gain 1 Dexterity. | OK |
| EXP_CROSS_CIVICS_01 | 法令マーキング | 6ダメージ。手札に攻撃カードがある時、ランダムな敵にドクドク3を与える。 | Deal 6 damage. When your hand contains an Attack card, apply 3 Poison to a random living enemy. | OK |
| EXP_CROSS_CIVICS_02 | 契約の封蝋 | ブロック7。手札にスキルカードがある時、敵全体にへろへろ1を与える。 | Gain 7 Block. When your hand contains a Skill card, apply 1 Weak to all living enemies. | OK |
| EXP_CROSS_CIVICS_03 | 公開ルール | ブロック8。手札にパワーカードがある時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When your hand contains a Power card, return 1 card from your discard pile to your hand. | OK |
| EXP_CROSS_CIVICS_04 | 契約の終章 | ブロック9。手札にスキルカードがある時、手札の別カード1枚を強化する。 | Gain 9 Block. When your hand contains a Skill card, upgrade 1 other card in your hand. | OK |
| EXP_STATUS_SLEEPY | 眠気 | 手札に状態カードがある時、手札の別カード1枚のコストを1下げる。 | Exhaust. When your hand contains a Status card, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_STATUS_WET_NOTE | ぬれたノート | 手札に状態カードがある時、使用前の手札枚数と同じブロックを得る。 | Exhaust. When your hand contains a Status card, gain Block equal to your hand size before playing this card. | OK |
| EXP_STATUS_NOISE | ノイズ混線 | 手札内で最高コストの時、カードを1枚引く。 | Exhaust. When this card is tied for the highest cost in your hand, draw 1 card. | OK |
| EXP_STATUS_HUNGER | 空腹 | 手札内で最高コストの時、ブロック5を得る。 | Exhaust. When this card is tied for the highest cost in your hand, gain 5 Block. | OK |
| EXP_STATUS_PRESSURE | 重圧 | 手札内で最高コストの時、エナジー1を得る。 | Exhaust. When this card is tied for the highest cost in your hand, gain 1 Energy. | OK |
| EXP_STATUS_LATE_SLIP | 遅刻届 | 手札内で最高コストの時、HPを3回復する。 | Exhaust. When this card is tied for the highest cost in your hand, heal 3 HP. | OK |
| EXP_CURSE_PROCRASTINATION | 先延ばし | 手札内で最高コストの時、次ターンのドロー+1。 | Exhaust. When this card is tied for the highest cost in your hand, draw 1 extra card next turn. | OK |
| EXP_CURSE_COMPARISON | 比べすぎ | 手札内で最高コストの時、次ターンのエナジー+1。 | Exhaust. When this card is tied for the highest cost in your hand, gain 1 Energy next turn. | OK |
| EXP_CURSE_PERFECTION | 完璧主義 | 手札内で最高コストの時、ムキムキ1を得る。 | Exhaust. When this card is tied for the highest cost in your hand, gain 1 Strength. | OK |
| EXP_CURSE_MISINFO | 誤情報 | 手札内で最高コストの時、カチカチ1を得る。 | Exhaust. When this card is tied for the highest cost in your hand, gain 1 Dexterity. | OK |
| EXP_CURSE_OVERCOMMIT | 抱え込み | 手札内で最高コストの時、ランダムな敵にドクドク3を与える。 | Exhaust. When this card is tied for the highest cost in your hand, apply 3 Poison to a random living enemy. | OK |
| EXP_CURSE_FORGOTTEN_PROMISE | 忘れた約束 | 手札内で最高コストの時、敵全体にへろへろ1を与える。 | Exhaust. When this card is tied for the highest cost in your hand, apply 1 Weak to all living enemies. | OK |
| EXP_EVENT_SECOND_CHANCE | やり直し券 | ブロック8。手札内で最高コストの時、捨て札から1枚を手札へ戻す。 | Gain 8 Block. When this card is tied for the highest cost in your hand, return 1 card from your discard pile to your hand. | OK |
| EXP_EVENT_TEAM_NOTE | みんなの寄せ書き | ブロック9。手札内で最高コストの時、手札の別カード1枚を強化する。 | Gain 9 Block. When this card is tied for the highest cost in your hand, upgrade 1 other card in your hand. | OK |
| EXP_EVENT_MYSTERY_KEY | 旧校舎の鍵 | ブロック10。手札内で最高コストの時、手札の別カード1枚のコストを1下げる。 | Gain 10 Block. When this card is tied for the highest cost in your hand, reduce the cost of 1 other card in your hand by 1. | OK |
| EXP_EVENT_GRADUATION_ALBUM | 卒業アルバム | ブロック11。手札内で最高コストの時、使用前の手札枚数と同じブロックを得る。 | Gain 11 Block. When this card is tied for the highest cost in your hand, gain Block equal to your hand size before playing this card. | OK |

## 追加学習カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| KOKUGO_SYUKUGO | 四字熟語 | 4ダメージを4回与える。 | Deal 4 damage 4 times. | OK |
| KOKUGO_KOTOWAZA | ことわざの知恵 | ブロック7。カードを1枚引く。 | Gain 7 Block. Draw 1 card. | OK |
| KOKUGO_GOKAN | 五感の表現 | 敵全体をへろへろ2にする。 | Apply 2 Weak to all enemies. | OK |
| KOKUGO_KANJI_TEST | 漢字小テスト | 3ダメージ。カードを1枚引く。廃棄。 | Deal 3 damage. Draw 1 card. Exhaust. | OK |
| KOKUGO_MANYO | 万葉の歌 | ターン開始時に追加で1枚引く。 | Draw 1 extra card at the start of each turn. | OK |
| KOKUGO_NIKKI | 観察日記 | 次のターン、カードを2枚引く。 | Draw 2 extra cards next turn. | OK |
| KOKUGO_SYODO | 止め・跳ね・払い | 9ダメージ。対象をびくびく1にする。 | Deal 9 damage. Apply 1 Vulnerable. | OK |
| KOKUGO_DICTIONARY | 国語辞典 | 手札のカードを2枚コピーする。廃棄。 | Copy 2 cards. Exhaust. | OK |
| KOKUGO_SYOSETSU | 未完の小説 | 捨て札をすべて山札に戻す。廃棄。 | Shuffle your discard pile into your draw pile. Exhaust. | OK |
| KOKUGO_SYUJI | 精神統一 | カチカチ1を得る。自分に1ダメージ。 | Lose 1 HP. Gain 1 Dexterity. | OK |
| KOKUGO_KOTONOHA | 言の葉 | ドクドク5を与える。 | Apply 5 Poison. | OK |
| KOKUGO_HAIKU | 五七五 | 6ダメージを3回与える。 | Deal 6 damage 3 times. | OK |
| KOKUGO_RITOKU | 読解力 | 次に使うスキルは2回発動する。 | Your next Skill is played 2 times. | OK |
| KOKUGO_BUNPO | 主語と述語 | カードを使用する度、ブロック1を得る。 | Gain 1 Block whenever you play a card. | OK |
| KOKUGO_RODOKU | 朗読 | 全体に6ダメージ。1枚引く。 | Deal 6 damage to all enemies. Draw 1 card. | OK |
| KOKUGO_GOKO | 五光 | 20ダメージ。キラキラ1を得る。 | Deal 20 damage. Gain 1 Artifact. | OK |
| KOKUGO_SAKUBUN | 読書感想文 | 手札の非攻撃カードをすべて廃棄する。 | Exhaust all matching cards from your hand. | OK |
| KOKUGO_MOJI | 文字の嵐 | 「えんぴつの削りかす」を2枚手札に加える。 | Add 2 Pencil Shavings to your hand at 0 cost. | OK |
| KOKUGO_YOMITOKI | 行間を読む | 次のターン、エナジー1を得る。 | Gain 1 Energy next turn. | OK |
| KOKUGO_TENREI | 天礼 | 毎ターン開始時、ムキムキ2を得る。 | Gain 2 Strength at the start of each turn. | OK |
| SANSU_CALC_SPEED | 暗算 | カードを2枚引く。1枚捨てる。 | Draw 2 cards. Discard 1 card. | OK |
| SANSU_TRIANGLE | 三角定規 | 8ダメージ。1枚引く。 | Deal 8 damage. Draw 1 card. | OK |
| SANSU_COMPASS | コンパス円舞 | 全体に5ダメージ。ブロック5を得る。 | Deal 5 damage to all enemies. Gain 5 Block. | OK |
| SANSU_PROTRACTOR | 分度器アタック | 10ダメージ。敵をへろへろ1にする。 | Deal 10 damage. Apply 1 Weak. | OK |
| SANSU_KUKU | 九九の連鎖 | 9ダメージ。今ターン使用した攻撃1枚につき2ダメージ追加。 | Deal 9 damage. Deal 2 extra damage for each Attack played this turn. | OK |
| SANSU_SOROBAN | そろばん | エナジー1を得る。手札を1枚捨てる。 | Discard 1 card. Gain 1 Energy. | OK |
| SANSU_DIVISION | 割り算 | 7ダメージ。対象をびくびく1にする。 | Deal 7 damage. Apply 1 Vulnerable. | OK |
| SANSU_MULTIPLICATION | 倍々ゲーム | ムキムキを倍にする。廃棄。 | Double your Strength. Exhaust. | OK |
| SANSU_ZERO | ゼロの発見 | 「発見」と同じくランダムなカード3枚を手札に加える。廃棄。 | Add 3 random cards to your hand, as with Discovery. Exhaust. | OK (explicit card text) |
| SANSU_INFINITY | 無限大 | ターン開始時にエナジー1を得る。 | Gain 1 Energy at the start of each turn. | OK |
| SANSU_PERCENT | パーセント増量 | 現在のブロック値を1.5倍にする。 | Multiply your current Block by 1.5. | OK |
| SANSU_GEOMETRY | 幾何学模様 | 被ダメージ時、ランダムな敵に5ダメージ。 | When you take damage, deal 5 damage to a random enemy. | OK |
| SANSU_AREA | 面積計算 | 手札の枚数x3ダメージ。 | Deal 3 damage for each card in your hand. | OK |
| SANSU_CHART | 円グラフ | カードを3枚引き、2枚捨てる。 | Draw 3 cards. Discard 2 cards. | OK |
| SANSU_UNIT | 単位変換 | 手札をすべて入れ替える。 | Replace your entire hand with the same number of newly drawn cards. | OK |
| SANSU_FORMULA | 魔法の方程式 | カードを2枚引き、エナジー1を得る。 | Draw 2 cards. Gain 1 Energy. | OK |
| SANSU_GRID | 方眼紙の盾 | ブロック9。山札に「ケガ」を1枚加える。 | Gain 9 Block. Add 1 Injury to your draw pile. | OK |
| SANSU_LOGIC | 論理パズル | 次のターン、カードを1枚追加で引く。 | Draw 1 extra card next turn. | OK |
| SANSU_FRACTION | 分数の壁 | 次に受けるダメージを0にする。 | Prevent the next instance of damage. | OK (explicit card text) |
| SANSU_ABACUS_MASTER | 珠算十段 | 12ダメージ。倒すと最大HP+2。 | Deal 12 damage. If this defeats an enemy or resolves, increase max HP by 2. | OK |
| RIKA_EXPERIMENTAL | 試験管の爆発 | 全体12ダメージ。自分に2ダメージ。 | Deal 12 damage to all enemies. Lose 2 HP. | OK |
| RIKA_MICROSCOPE | 顕微鏡 | 敵をびくびく2にする。次のターン、カードを1枚引く。 | Apply 2 Vulnerable to the target. Draw 1 extra card next turn. | OK (explicit card text) |
| RIKA_MAGNET | 磁石の力 | 捨て札からランダムなカードを1枚手札に加える。 | Return 1 random card from your discard pile to your hand. | OK |
| RIKA_PHOTOSYNTHESIS | 光合成 | エナジー1を得る。HP2回復。 | Gain 1 Energy. Heal 2 HP. | OK |
| RIKA_PLANETS | 太陽系の公転 | ターン終了時、敵全体に3ダメージ。 | Deal 3 damage to all enemies at the end of your turn. | OK |
| RIKA_VOLCANO | マグマの噴火 | 25ダメージ。対象にドクドク5。 | Deal 25 damage. Apply 5 Poison. | OK |
| RIKA_LITMUS | リトマス試験紙 | 対象にへろへろ2、びくびく2を付与。 | Apply 2 Weak. Apply 2 Vulnerable. | OK |
| RIKA_ELECTRIC | 静電気ショック | 4ダメージ。次ターンエナジー1。 | Deal 4 damage. Gain 1 Energy next turn. | OK |
| RIKA_ECLIPSE | 皆既日食 | 敵全体をへろへろ2、びくびく2にする。 | Apply 2 Weak to all enemies. Apply 2 Vulnerable to all enemies. | OK |
| RIKA_EVOLUTION | 生命の進化 | 状態異常を引く度、カードを1枚引く。 | Draw 1 card whenever you draw a status card. | OK |
| RIKA_BACTERIA | 細菌の増殖 | ドクドクを3倍にする。廃棄。 | Multiply the target's Poison by 3. Exhaust. | OK |
| RIKA_RAINBOW | 虹のプリズム | 手札のランダムなカード2枚を強化する。 | Upgrade 2 random cards in your hand. | OK |
| RIKA_GRAVITY | 重力の法則 | 15ダメージ。対象の攻撃力を2下げる。 | Deal 15 damage. Reduce the target's Strength by 2. | OK |
| RIKA_FOSSIL | アンモナイト | ブロック12。廃棄。 | Gain 12 Block. Exhaust. | OK |
| RIKA_ANATOMY | 人体模型 | スケスケ1（ダメージ1化）を得る。 | Become Intangible for 1 turn. | OK |
| RIKA_SPRING | バネの弾力 | ブロック5。次に使う攻撃のダメージ2倍。 | Gain 5 Block. Your next Attack deals double damage. | OK (explicit card text) |
| RIKA_WEATHER | 天気予報 | 山札のトップ3枚を確認して戻すか捨てる。 | Look at the top 3 cards of your draw pile; return or discard them. | OK (explicit card text) |
| RIKA_ALCOHOL | アルコールランプ | 7ダメージ。対象にドクドク3。 | Deal 7 damage. Apply 3 Poison. | OK |
| RIKA_CONSTELLATION | 冬の大三角形 | 6ダメージを3回与える。 | Deal 6 damage 3 times. | OK |
| RIKA_ROBOT | 二足歩行ロボット | ターン終了時、ブロック5を得る。 | Gain 5 Block at the end of your turn. | OK |
| SYAKAI_GEOGRAPHY | 日本地図 | カードを3枚引く。 | Draw 3 cards. | OK |
| SYAKAI_HISTORY | 歴史の教科書 | ターンの開始時、手札の全コストを1下げる。 | At the start of each turn, reduce all card costs by 1. | OK |
| SYAKAI_COIN | 小銭入れ | 20ゴールドを得る。廃棄。 | Gain 20 Gold. Exhaust. | OK |
| SYAKAI_LAW | 校則遵守 | キラキラ2（デバフ無効）を得る。 | Gain 2 Artifact. | OK |
| SYAKAI_MARKET | バザーの掘り出し物 | ランダムなポーションを1つ得る。 | Gain 1 random Potion. | OK (explicit card text) |
| SYAKAI_CITY | 未来都市 | ターン開始時にエナジー1、ドロー1。 | Gain 1 Energy and draw 1 card at the start of each turn. | OK |
| SYAKAI_TRADE | 交換留学生 | 手札を1枚廃棄し、カードを2枚引く。 | Draw 2 cards. Exhaust 1 card from your hand. | OK |
| SYAKAI_VOTE | 学級委員選挙 | 手札をすべて強化する。 | Upgrade all cards in your hand. | OK |
| SYAKAI_FACTORY | 町工場 | 「定規で叩く」を2枚手札に加える。 | Add 2 POMMEL_STRIKE to your hand at 0 cost. | OK |
| SYAKAI_TEMPLE | 古い寺院 | 全デバフを解除する。 | Remove all debuffs. | OK |
| SYAKAI_RICE | 豊作の秋 | HPを5回復する。廃棄。 | Heal 5 HP. Exhaust. | OK |
| SYAKAI_EXPLORER | 探検隊 | 8ダメージ。ゴールドを10得る。 | Deal 8 damage. Gain 10 Gold. | OK |
| SYAKAI_CASTLE | お城の守り | ブロック20。廃棄。 | Gain 20 Block. Exhaust. | OK |
| SYAKAI_NEWS | 校内ニュース | 敵全体をへろへろ2にする。 | Apply 2 Weak to all enemies. | OK |
| SYAKAI_BANK | お年玉貯金 | 100ゴールドを得る。廃棄。 | Gain 100 Gold. | OK |
| SYAKAI_REVOLUTION | 産業革命 | エナジー2を得る。1枚引く。次のターンにエナジー1を得る。廃棄。 | Gain 2 Energy. Draw 1 card. Gain 1 Energy next turn. Exhaust. | OK (explicit card text) |
| SYAKAI_GLOBAL | 世界一周 | カードを5枚引く。 | Draw 5 cards. | OK |
| SYAKAI_CULTURE | 伝統文化 | 手札に加わるカードを常に強化する。 | Cards you create are upgraded. | OK |
| SYAKAI_COIN_BAG | お宝の袋 | 18ダメージ。ゴールドを20得る。 | Deal 18 damage. Gain 20 Gold. | OK |
| SYAKAI_HERITAGE | 世界遺産登録 | 最大HPを5増やす。廃棄。 | If this defeats an enemy or resolves, increase max HP by 5. Exhaust. | OK |
| PE_DASH | 50m走 | ムキムキ2を得る。 | Gain 2 Strength. | OK |
| PE_JUMP | 縄跳び | 3ダメージを3回与える。HPを1失う。 | Deal 3 damage 3 times. Lose 1 HP. | OK |
| PE_BALL | ドッジボール投球 | 12ダメージ。 | Deal 12 damage. | OK |
| PE_SWIM | 25mクロール | ブロック6。カードを1枚引く。 | Gain 6 Block. Draw 1 card. | OK |
| PE_TEAM | 二人三脚 | ムキムキ1、カチカチ1を得る。 | Gain 1 Strength. | OK |
| PE_CHEER | 応援合戦 | ムキムキ2を得る。 | Gain 2 Strength. | OK |
| PE_GYM_MAT | マット運動 | ブロック10。 | Gain 10 Block. | OK |
| EVENT_CLEANING | 大掃除のホウキ | 全体に7ダメージ。対象をへろへろ1にする。 | Deal 7 damage to all enemies. Apply 1 Weak to all enemies. | OK |
| EVENT_LUNCH | 給食の当番 | 手札に「完熟トマト(回復)」を2枚加える。 | Add 2 RIPE_TOMATO to your hand at 0 cost. | OK |
| EVENT_FESTIVAL | 学芸会の主役 | カードを使用する度、ブロック1を得る。 | Gain 1 Block whenever you play a card. | OK |
| PE_HORIZONTAL_BAR | 鉄棒の逆上がり | 捨て札からランダムなカードを1枚手札に戻す。 | Return 1 random card from your discard pile to your hand. | OK |
| PE_VAULTING | 跳び箱10段 | 18ダメージ。 | Deal 18 damage. | OK |
| PE_SOCCER | PK戦 | 7ダメージを2回。対象をびくびく1にする。 | Deal 7 damage 2 times. Apply 1 Vulnerable. | OK |
| PE_MARATHON | 持久走 | 毎ターン開始時、ブロック4を得る。 | Gain 4 Block at the start of each turn. | OK (explicit card text) |
| PE_DANCE | フォークダンス | 手札を1枚コピーし、手札を1枚捨てる。 | Copy 1 card from your hand, then discard 1 card from your hand. | OK (explicit card text) |
| EVENT_MORNING | 朝の会 | 手札をすべて強化する。廃棄。 | Upgrade all cards in your hand. Exhaust. | OK |
| EVENT_HOME | 帰りの会 | ブロック20を得る。廃棄。 | Gain 20 Block. Exhaust. | OK |
| EVENT_TRIP | 修学旅行の枕 | 8ダメージ。対象をへろへろ2にする。 | Deal 8 damage. Apply 2 Weak. | OK |
| PE_BASKET | 3ポイントシュート | 22ダメージ。廃棄。 | Deal 22 damage. Exhaust. | OK |
| PE_CHAMPION | スポーツ王 | ムキムキ2、カチカチ2を得る。 | Gain 2 Strength. Gain 2 Dexterity. | OK |

## 課外活動カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| OUT_PARK_SWING | 公園のブランコ | 30ダメージ。敵全体にびくびく2。 | Deal 30 damage to all enemies. Apply 2 Vulnerable to all enemies. | OK |
| OUT_PARK_SLIDE | 超高速すべり台 | 35ダメージ。1枚引く。 | Deal 35 damage. Draw 1 card. | OK |
| OUT_SECRET_BASE | 空き地の秘密基地 | ターン終了時、ブロック8を得る。 | Gain 8 Block at the end of your turn. | OK |
| OUT_GAME_NIGHT | 徹夜のゲーム大会 | 毎ターンエナジー1を得る。自分に1ダメージ。 | Lose 1 HP. Gain 1 Energy at the start of each turn. | OK |
| OUT_CONVENIENCE | コンビニの買い食い | HPを8回復。エナジー1を得る。廃棄。 | Gain 1 Energy. Heal 8 HP. Exhaust. | OK |
| OUT_DAGASHI_ALL | 駄菓子屋の全買い | 60ゴールドを得る。カードを3枚引く。廃棄。 | Draw 3 cards. Gain 60 Gold. Exhaust. | OK |
| OUT_BICYCLE_DASH | 立ちこぎ坂道 | 24ダメージ。自分に2ダメージ。 | Deal 24 damage. Lose 2 HP. | OK |
| OUT_DOG_BARK | 近所の番犬 | 敵全体をへろへろ2、びくびく2にする。 | Apply 2 Weak to all enemies. Apply 2 Vulnerable to all enemies. | OK |
| OUT_GRANDMA_GIFT | おばあちゃんの小遣い | 120ゴールドを得る。廃棄。 | Gain 120 Gold. Exhaust. | OK |
| OUT_FESTIVAL_FIRE | 夏祭りの打ち上げ花火 | 14ダメージ。敵全体にドクドク6。 | Deal 14 damage to all enemies. Apply 6 Poison to all enemies. | OK |
| OUT_SNOWBALL_WAR | 本気の雪合戦 | 8ダメージを4回与える。 | Deal 8 damage 4 times. | OK |
| OUT_KICKBOARD | 最強のキックボード | 30ダメージ。 | Deal 30 damage. | OK |
| OUT_BUG_CATCH | かぶとむし狩り | 対象を捕獲する。 | Capture the target as a card. | OK (explicit card text) |
| OUT_STRAY_CAT | 路地裏の野良猫 | 次に使うアタックを3回発動する。 | Play your next Attack three times. | OK |
| OUT_ANIME_BINGE | アニメ一気見 | ターンの開始時、手札の全コストを1下げる。 | At the start of each turn, reduce all card costs by 1. | OK |
| OUT_NEW_YEAR_GOLD | お年玉の誘惑 | 手札のランダムなカード1枚を、その戦闘中0コストにする。 | Make 1 random card in your hand cost 0 for this battle. | OK |
| OUT_PARK_HIDE | 伝説のかくれんぼ | スケスケ2（無敵）を得る。廃棄。 | Become Intangible for 2 turns. Exhaust. | OK |
| OUT_GACHA_LUCK | ガチャの神引き | デッキからランダムなレジェンダリーカードを手札に加える。廃棄。 | Add a random Legendary card from your deck to your hand. Exhaust. | OK (explicit card text) |
| OUT_MUD_FIGHT | 泥まみれの決闘 | 10ダメージ。敵全体をへろへろ2にする。 | Deal 10 damage to all enemies. Apply 2 Weak to all enemies. | OK |
| OUT_LIBRARY_SLEEP | 図書室での昼寝 | 全デバフを解除し、HPを全回復。使い切り。 | Remove all debuffs and fully restore HP. Single use. | OK (explicit card text) |
| OUT_ARCADE_MASTER | ゲーセンの達人 | コンボ：今ターン使ったカード1枚につき8ダメージ。 | Combo: Deal 8 damage for each card played this turn. | OK (explicit card text) |
| OUT_MODEL_BUILD | プラモデル製作 | カードを使用する度、ブロック2を得る。 | Gain 2 Block whenever you play a card. | OK |
| OUT_BATH_TIME | 極楽の銭湯 | 最大HP+3。HP16回復。廃棄。 | Increase max HP by 3. Heal 16 HP. Exhaust. | OK (explicit card text) |
| OUT_STARRY_SKY | 満天の星空 | 毎ターンカードを1枚追加で引く。 | Draw 1 extra card at the start of each turn. | OK |
| OUT_MOSQUITO_WAR | 蚊との死闘 | 2ダメージを8回与える。 | Deal 2 damage 8 times. | OK |
| OUT_SUMMER_HOMEWORK | 最後の宿題 | 全体に50ダメージ。廃棄。 | Deal 50 damage to all enemies. Exhaust. | OK |
| OUT_MORNING_EXERCISE | ラジオ体操皆勤賞 | ムキムキ2、カチカチ2を得る。 | Gain 2 Strength. Gain 2 Dexterity. | OK |
| OUT_JUNGLE_GYM | ジャングルジムの頂上 | ブロック20。次ターンのエナジー+1。 | Gain 20 Block. Gain 1 Energy next turn. | OK |
| OUT_PIZZA_PARTY | 出前ピザパーティー | 自分とパートナーのHPを全回復。使い切り。 | Fully restore your HP and your partner’s HP. Single use. | OK (explicit card text) |
| OUT_HAUNTED_HOUSE | 近所の幽霊屋敷 | 対象をびくびく6にする。 | Apply 6 Vulnerable. | OK |
| OUT_TRADING_CARD | 最強の激レアカード | デッキのカード枚数分ダメージ。 | Deal 1 damage for each card in your deck. | OK |
| OUT_RAIN_PUDDLE | 水たまりジャンプ | ブロック8。次ターンのエナジー+1。 | Gain 8 Block. Gain 1 Energy next turn. | OK |
| OUT_Kite_FLYING | お正月の凧揚げ | 山札の枚数×2ダメージ。 | Deal damage equal to 2 times the number of cards in your draw pile. | OK (explicit card text) |
| OUT_FIRE_TRUCK | 消防署見学 | ブロック30を得る。 | Gain 30 Block. | OK |
| OUT_CONSTRUCTION | 工事現場の重機 | 40ダメージ。対象の攻撃力を2下げる。 | Deal 40 damage. Reduce the target's Strength by 2. | OK |
| OUT_GHOST_STORY | 夜の怖い話 | 敵全体をへろへろ4にする。 | Apply 4 Weak to all enemies. | OK |
| OUT_TREASURE_MAP | 手作りの宝地図 | ランダムなレリックを1つ入手する。廃棄。 | Gain 1 random Relic. Exhaust. | OK (explicit card text) |
| OUT_GRANDPA_WISDOM | おじいちゃんの教え | HPを失う度、ムキムキ1を得る。 | Gain 1 Strength whenever you lose HP. | OK |
| OUT_KABUTO_WRESTLE | カぶとむし相撲 | 22ダメージ。対象にびくびく2。 | Deal 22 damage. Apply 2 Vulnerable. | OK |
| OUT_CANDY_SUGAR | 綿菓子の雲 | 次のターン、カードを3枚引く。 | Draw 3 extra cards next turn. | OK |
| OUT_BALLOON_POP | 風船割り | 全体8ダメージを3回与える。 | Deal 8 damage to all enemies 3 times. | OK |
| OUT_SHRINE_PRAY | 初詣の願い事 | 手札の全カードのコストを0にする。廃棄。 | Set the cost of every card in your hand to 0. Exhaust. | OK (explicit card text) |
| OUT_CRAYON_WALL | 壁への落書き | 毎ターン敵全体にドクドク3。 | Apply 3 Poison to all enemies each turn. | OK |
| OUT_BIRD_WATCH | 鳥になった気分 | 手札のカードを2枚コピーする。廃棄。 | Copy 2 cards. Exhaust. | OK |
| OUT_RADIO_CONTROL | ラジコン操作 | 9ダメージを5回与える。 | Deal 9 damage to a random enemy 5 times. | OK |
| OUT_ICE_CREAM_BINGE | アイス食べ放題 | エナジー2を得る。自分に3ダメージ。 | Gain 2 Energy. Lose 3 HP. | OK |
| OUT_STREET_PERFORM | 街頭パフォーマンス | 35ゴールドを得る。敵全体をへろへろ2にする。 | Gain 35 Gold. Apply 2 Weak to all enemies. | OK |
| OUT_SUPER_HERO_POSE | 戦隊ヒーローのポーズ | ムキムキ2、キラキラ1を得る。この戦闘中、アタックは「使用後に1枚引く」を得る。 | Gain 2 Strength and 1 Artifact. For this combat, Attacks gain “Draw 1 card after use.” | OK (explicit card text) |
| OUT_PET_WALK | 犬の散歩 | 14ダメージ。次ターンのエナジー+1。 | Deal 14 damage. Gain 1 Energy next turn. | OK |
| OUT_FISH_CATCH | 川での魚つかみ | ランダムなポーションを2つ得る。廃棄。 | Gain 2 random Potions. Exhaust. | OK (explicit card text) |
| OUT_HIDDEN_SHORTCUT | 秘密の近道 | カードを3枚引き、1枚捨てる。山札から高コストカードを0コストで1枚手札に加える。 | Draw 3 cards and discard 1. Add 1 high-cost card from your draw pile to your hand at 0 cost. | OK (explicit card text) |
| OUT_DREAM_FUTURE | 将来の夢 | ムキムキ2を得る。毎ターンカードを1枚追加で引く。 | Gain 2 Strength. Draw 1 extra card at the start of each turn. | OK |
| OUT_WOOD_CRAFT | 夏休みの工作 | ターン終了時、ブロック10を得る。 | Gain 10 Block at the end of your turn. | OK |
| OUT_STAMP_COLLECT | スタンプラリー | クエスト: この戦闘中、あと5枚カードを使う。達成でカードを2枚引き、エナジー1を得る。廃棄。 | Quest: Play 5 more cards this combat. On completion, draw 2 cards and gain 1 Energy. Exhaust. | OK (explicit card text) |
| OUT_GHOST_PHOTO | 心霊写真 | 対象にドクドク14を付与。 | Apply 14 Poison. | OK |
| OUT_PARK_FOUNTAIN | 公園の噴水 | HPを7回復。全デバフ解除。 | Heal 7 HP. Remove all debuffs. | OK |
| OUT_ROLLER_BLADE | ローラーシューズ | このターン、全手札のコストを0にする。 | Set the cost of every card in your hand to 0 this turn. | OK |
| OUT_KIMONO_DRESS | 七五三の晴れ着 | キラキラ2を得る。 | Gain 2 Artifact. | OK |
| OUT_FLOWER_CROWN | シロツメクサの冠 | ブロック15を得る。 | Gain 15 Block. | OK |
| OUT_TELESCOPE | 天体観測 | カードを2枚引く。次のターン、さらに2枚引く。 | Draw 2 cards. Draw 2 extra cards next turn. | OK |
| OUT_PAPER_PLANE_ULTRA | 最強の紙飛行機 | 全体に20ダメージ。 | Deal 20 damage to all enemies. | OK |
| OUT_BUG_BOX | 虫かごの秘密 | 手札にランダムな「捕獲」済みカードを加える。 | Add 1 random captured card to your hand. | OK |
| OUT_STREET_LIGHT | 夜道の街灯 | カチカチ4を得る。 | Gain 4 Dexterity. | OK |
| OUT_OLD_HOUSE | おじいちゃんの古民家 | HPを全回復。最大HP+2。使い切り。 | Fully restore HP. Increase max HP by 2. Single use. | OK (explicit card text) |
| OUT_CANDY_BOMB | パチパチキャンディ | 4ダメージを7回与える。 | Deal 4 damage 7 times. | OK |
| OUT_MUD_DUMPLING | 究極の泥団子 | 20ダメージ。対象にへろへろ3。 | Deal 20 damage. Apply 3 Weak. | OK |
| OUT_SECRET_LETTER | 秘密のラブレター | 対象をへろへろ4、びくびく4にする。廃棄。 | Apply 4 Weak. Apply 4 Vulnerable. Exhaust. | OK |
| OUT_PIRATE_PLAY | 海賊ごっこ | 10ダメージ。50ゴールドを得る。 | Deal 10 damage. Gain 50 Gold. | OK |
| OUT_SAND_CASTLE | 砂浜の城 | ブロック30。次ターンのエナジー-1。 | Gain 30 Block. Reduce next turn’s Energy by 1. | OK (explicit card text) |
| OUT_RAINBOW_CHASE | 虹を追いかけて | デッキのランダムなカード5枚を強化する。 | Upgrade 5 random cards in your deck. | OK |
| OUT_CLIMBING_TREE | 木登り名人 | このターン、受けるダメージをすべて1にする。 | For this turn, all damage you take becomes 1. | OK (explicit card text) |
| OUT_DRAGON_GOD | 神社の龍神様 | 全体に36ダメージ。HP10回復。 | Deal 36 damage to all enemies. Heal 10 HP. | OK |
| OUT_YAKISOBA | 屋台の焼きそば | ムキムキ4を得る。次ターン、エナジー-1。 | Gain 4 Strength. Reduce next turn’s Energy by 1. | OK (explicit card text) |
| OUT_GOLD_FISH | 金魚すくい | アタックを1枚選ぶ。この戦闘中、それは強化され、0コスト、+6ダメージ、廃棄を得る。 | Choose 1 Attack. For this battle, upgrade it and give it 0 cost, +6 damage, and Exhaust. | OK |
| OUT_MASK_HERO | 縁日のお面 | 次に受けるHPダメージを1回0にする。 | Prevent the next instance of HP damage. | OK (explicit card text) |
| OUT_SCARE_CROW | 田んぼのかかし | 敵全体を2ターン行動不能にする。廃棄。 | Prevent all enemies from acting for 2 turns. Exhaust. | OK (explicit card text) |
| OUT_SPARKLER | 手持ち花火 | 2ダメージを10回与える。対象にドクドク4。 | Deal 2 damage 10 times. Apply 4 Poison. | OK |
| OUT_SLEEP_IN | 休日の二度寝 | HPを12回復。次のターンのエナジー+2、ドロー+2。廃棄。 | Gain 2 Energy next turn. Draw 2 extra cards next turn. Heal 12 HP. Exhaust. | OK |
| OUT_MUSEUM_TRIP | 博物館の恐竜 | 38ダメージ。 | Deal 38 damage. | OK |
| OUT_KIMODAMESHI | 真夏の肝試し | 敵全体の攻撃力を2下げる。 | Reduce the Strength of all enemies by 2. | OK (explicit card text) |
| OUT_FALL_LEAVES | 落ち葉の絨毯 | ブロック10。カードを2枚引く。 | Gain 10 Block. Draw 2 cards. | OK |
| OUT_KOTATSU | 冬のこたつ | 毎ターン開始時、ブロック7を得る。 | Gain 7 Block at the end of your turn. | OK |
| OUT_TOSHIKOSHI | 年越しそば | HPを15回復。最大HP+1。 | Heal 15 HP. Increase max HP by 1. | OK (explicit card text) |
| OUT_FIRST_SUN | 初日の出 | ターン開始時にエナジー2を得る。 | Gain 2 Energy at the start of each turn. | OK |
| OUT_SNOW_MAN | 巨大雪だるま | ブロック50。廃棄。 | Gain 50 Block. Exhaust. | OK |
| OUT_SOCCER_STREET | 路地のストリートサッカー | 8ダメージを4回。1枚引く。 | Deal 8 damage 4 times. Draw 1 card. | OK |
| OUT_RADIO_STATION | 地元のラジオ局 | 手札のカードを3枚選び、それぞれコピーする。 | Choose 3 cards in your hand and copy each of them. | OK (explicit card text) |
| OUT_ZOO_TRIP | 動物園のライオン | 25ダメージ。対象にびくびく5。 | Deal 25 damage. Apply 5 Vulnerable. | OK |
| OUT_AQUARIUM | 水族館のサメ | 15ダメージを3回。HP5回復。 | Deal 15 damage 3 times. Heal 5 HP. | OK |
| OUT_TOY_STORE | 夢のおもちゃ屋 | ランダムなレジェンダリーカードを1枚生成する。 | Create 1 random Legendary card. | OK |
| OUT_STREET_DOG | 迷い犬の恩返し | 次の戦闘開始時、エナジー+3。廃棄。 | At the start of the next battle, gain 3 Energy. Exhaust. | OK (explicit card text) |
| OUT_UMBRELLA_SWORD | 傘チャンバラ | 12ダメージを3回。ブロック12。 | Deal 12 damage 3 times. Gain 12 Block. | OK |
| OUT_EVENING_CHIME | 夕焼けのチャイム | 敵全体を即死させる（ボス無効）。廃棄。 | Instantly defeat all enemies (does not affect bosses). Exhaust. | OK (explicit card text) |
| OUT_MY_HERO | 僕だけのヒーロー | 50ダメージ。自分のHPが半分以下の時、コスト0になりダメージが2倍になる。 | Deal 50 damage. When your HP is half or lower, this costs 0 and deals double damage. | OK (explicit card text) |
| OUT_FRIEND_FOREVER | 親友との約束 | パートナーの最大HPを20増やし、HPを全回復する。使い切り。 | Increase your partner’s max HP by 20 and fully restore their HP. Single use. | OK (explicit card text) |
| OUT_GRANDMA_CAKE | おばあちゃんの手作りケーキ | HP30回復。最大HP+5。廃棄。 | Heal 30 HP. Increase max HP by 5. Exhaust. | OK (explicit card text) |
| OUT_SUPER_GACHA | 究極の10連ガチャ | ランダムなカード10枚を手札に加える。 | Add 10 random cards to your hand. | OK |
| OUT_LAST_BATTLE | 公園の決戦 | 全体に30ダメージを2回。 | Deal 30 damage to all enemies 2 times. | OK |
| OUT_GRADUATION_DAY | いつかの卒業式 | ムキムキ20、カチカチ20、キラキラ5を得る。廃棄。 | Gain 20 Strength, 20 Dexterity, and 5 Artifact. Exhaust. | OK (explicit card text) |

## 高校編・固有カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| BOYS_DRAGON_BUSTER | ドラグニル・バースト | 35ダメージ。対象にびくびく2。 | Deal 35 damage. Apply 2 Vulnerable. | OK |
| BOYS_VOID_SLASH | 虚空の断罪 | 15ダメージを2回。廃棄。 | Deal 15 damage 2 times. Exhaust. | OK |
| BOYS_THUNDER_FIST | 雷神の鉄拳 | 10ダメージ。次のアタックのコスト-1。 | Deal 10 damage. Reduce the cost of your next Attack by 1. | OK (explicit card text) |
| BOYS_GRAVITY_PRESS | 重力100倍プレス | 現在のブロック値の2倍のダメージ。 | Deal damage equal to 2 times your current Block. | OK |
| BOYS_SHADOW_BIND | 影縫いの太刀 | 8ダメージ。対象をへろへろ2にする。 | Deal 8 damage. Apply 2 Weak. | OK |
| BOYS_MECHA_DIVE | 電脳世界へのダイブ | カードを3枚引き、1枚捨てる。手札のランダムなカード1枚を0コストにする。 | Draw 3 cards and discard 1. Make 1 random card in your hand cost 0. | OK (explicit card text) |
| BOYS_BLACK_HOLE | 暗黒の特異点 | 敵全体をへろへろ3、びくびく3にする。 | Apply 3 Weak to all enemies. Apply 3 Vulnerable to all enemies. | OK |
| BOYS_SAMURAI_SPIRIT | 侍の魂 | アタックを使う度、ブロック2を得る。 | Gain 2 Block whenever you play an Attack. | OK (explicit card text) |
| BOYS_NINJA_VANISH | 忍法・隠れ身 | スケスケ1（ダメージ1化）を得る。廃棄。 | Become Intangible for 1 turn. Exhaust. | OK |
| BOYS_ROBOT_BOOST | フルドライブ | エナジー2を得る。このターン中のみムキムキ5。 | Gain 2 Energy. Gain 5 Strength. Lose 5 Strength at the end of this turn. | OK |
| BOYS_BLADE_STORM | 無尽蔵の剣線 | 5ダメージを5回。 | Deal 5 damage to a random enemy 5 times. | OK |
| BOYS_VOLCANO_CRASH | 紅蓮爆華 | 全体に20ダメージ。自分に5ダメージ。 | Deal 20 damage to all enemies. Lose 5 HP. | OK |
| BOYS_CYBER_SHIELD | 電磁障壁 | ブロック10。カードを1枚引く。 | Gain 10 Block. Draw 1 card. | OK |
| BOYS_GENESIS_RAY | 創世の光線 | 全体に40ダメージ。 | Deal 40 damage to all enemies. | OK |
| BOYS_IRON_BLOOD | 鉄血の誓い | HPを失う度、ムキムキ2を得る。 | Gain 2 Strength whenever you lose HP. | OK |
| BOYS_RAILGUN | 超電磁加速砲 | 24ダメージ。対象のブロックを除去。 | Deal 24 damage. Remove the target's Block. | OK |
| BOYS_DARK_PACT | 悪魔の契約 | 自分に6ダメージ。エナジー3を得る。 | Gain 3 Energy. Lose 6 HP. | OK |
| BOYS_KNIGHT_GUARD | 守護騎士の盾 | ブロック15。キラキラ1を得る。 | Gain 15 Block. Gain 1 Artifact. | OK |
| BOYS_STRIKE_GOD | 神速の連撃 | 3ダメージを6回。 | Deal 3 damage 6 times. | OK |
| BOYS_SPACE_WARP | 次元跳躍 | 手札と山札の全ての状態異常・呪いを消滅させ、その数だけムキムキを永続強化する。廃棄。 | Remove all statuses and curses from your hand and draw pile, then permanently increase Strength by that number. Exhaust. | OK (explicit card text) |
| BOYS_SAMURAI_AURA | 戦意高揚 | 毎ターン開始時、ムキムキ1、カチカチ1を得る。 | Gain 1 Strength. Gain 1 Dexterity. | OK |
| BOYS_METEOR | 流星の鉄槌 | 18ダメージ。倒すと最大HP+3。 | Deal 18 damage. If this defeats an enemy, increase max HP by 3. | OK (explicit card text) |
| BOYS_REVENGE | リベンジ・バースト | 今ターン失ったHPの2倍のダメージを与える。 | Deal 2 times the HP you lost this turn as damage. | OK |
| BOYS_SHADOW_CLONE | 影分身の術 | 手札のアタックカードを1枚選び、5枚コピーする。 | Choose 1 Attack card in your hand and add 5 copies of it to your hand. | OK (explicit card text) |
| BOYS_BATTLE_STANCE | 修羅の構え | 次のアタックは2回発動する。自分に2ダメージ。 | Your next Attack triggers twice. Lose 2 HP. | OK (explicit card text) |
| BOYS_HEAVY_SMASH | 超重力粉砕 | 50ダメージ。廃棄。 | Deal 50 damage. Exhaust. | OK |
| BOYS_CYBER_BLADE | プラズマ・ブレード | 12ダメージ。このカードは常に強化状態で生成される。 | Deal 12 damage. This card is always created upgraded. | OK (explicit card text) |
| BOYS_DRAGON_EYE | 竜の眼光 | 対象をびくびく3、へろへろ3にする。 | Apply 3 Weak. Apply 3 Vulnerable. | OK |
| BOYS_VOID_ARMOR | 虚無の鎧 | ターン終了時、ブロックが消えなくなる。 | Block is not removed at the end of your turn. | OK |
| BOYS_THUNDER_STORM | 雷鳴の轟き | 全体に5ダメージを4回。 | Deal 5 damage to all enemies 4 times. | OK |
| BOYS_SOLDIER_HUNT | 賞金稼ぎ | 9ダメージ。倒すと20ゴールド。 | Deal 9 damage. If this defeats an enemy, gain 20 Gold. | OK (explicit card text) |
| BOYS_IRON_WALL | 鉄壁の陣 | ブロック25。廃棄。 | Gain 25 Block. Exhaust. | OK |
| BOYS_FLAME_DRIVE | 焔の突撃 | 14ダメージ。自分に1ダメージ。 | Deal 14 damage. Lose 1 HP. | OK |
| BOYS_SPACE_MINE | 次元地雷 | 対象にドクドク15。 | Apply 15 Poison. | OK |
| BOYS_HERO_AWAKEN | 真の勇者覚醒 | 毎ターン開始時、エナジー+1、ドロー+1。 | Gain 1 Energy and draw 1 card at the start of each turn. | OK |
| BOYS_OMEGA_CANNON | オメガ・キャノン | 40ダメージ。 | Deal 40 damage. | OK |
| BOYS_SHADOW_STEP | 暗影の歩法 | ブロック8。カードを2枚引く。 | Gain 8 Block. Draw 2 cards. | OK |
| BOYS_BLAZING_FIST | 烈火拳 | 7ダメージ。ムキムキ1を得る。 | Deal 7 damage. Gain 1 Strength. | OK |
| BOYS_SONIC_WAVE | 音速の波動 | 全体に8ダメージ。カードを1枚引く。 | Deal 8 damage to all enemies. Draw 1 card. | OK |
| BOYS_TITAN_SHIELD | 巨神の盾 | ブロック40。 | Gain 40 Block. | OK |
| BOYS_BERSERK_MODE | 狂戦士の咆哮 | ムキムキ3を得る。対象をびくびく2にする。自分に3ダメージ。 | Lose 3 HP. Gain 3 Strength. Apply 2 Vulnerable. | OK |
| BOYS_JUDGEMENT | 終焉の審判 | 全体に60ダメージ。廃棄。 | Deal 60 damage to all enemies. Exhaust. | OK |
| BOYS_PHANTOM_EDGE | 幻影の刃 | 6ダメージ。廃棄。 | Deal 6 damage. Exhaust. | OK |
| BOYS_CORE_STRIKE | コア・ストライク | 10ダメージ。エナジー1を得る。 | Deal 10 damage. Gain 1 Energy. | OK |
| BOYS_DEFENCE_SYS | 自動防衛システム | ターン終了時、ブロック6を得る。 | Gain 6 Block at the end of your turn. | OK |
| BOYS_INFINITE_BLADE | 無限の剣舞 | 毎ターン「幻影の刃」を1枚手札に加える。 | Add 1 Phantom Edge to your hand each turn. | OK (explicit card text) |
| BOYS_STRENGTH_UP | マッスル・ビルド | ムキムキ2を得る。 | Gain 2 Strength. | OK |
| BOYS_WOLF_PACK | 孤狼の群れ | 9ダメージ。手札のアタック1枚につき+3。 | Deal 9 damage. Deal 3 extra damage for each Attack in your hand. | OK |
| BOYS_OVERLOAD | オーバーロード | エナジー3を得る。次のターン、エナジー0。 | Gain 3 Energy. Set next turn's Energy to 0. | OK |
| BOYS_FINAL_FANTASY | ラスト・ファンタジー | この戦闘で使ったカード1枚につき5ダメージ。 | Deal 5 damage for each card played this battle. | OK |
| GIRLS_STAR_SYMPHONY | スターライト・シンフォニー | 敵全体をへろへろ2、びくびく2にする。 | Apply 2 Weak to all enemies. Apply 2 Vulnerable to all enemies. | OK |
| GIRLS_HEART_BLOOM | ピンク・ペタルガード | HPを8回復。ブロック8。 | Gain 8 Block. Heal 8 HP. | OK |
| GIRLS_MACARON_HEAL | 恋するマカロン・ヒール | HPを5回復。廃棄。 | Heal 5 HP. Exhaust. | OK |
| GIRLS_MAGIC_WAND | ミラクル・ステッキ | 10ダメージ。カードを1枚引く。 | Deal 10 damage. Draw 1 card. | OK |
| GIRLS_RIBBON_BIND | 夢見るリボン・バインド | 対象の攻撃力を3下げる。 | Reduce the target's Strength by 3. | OK |
| GIRLS_SWEET_DREAM | おやすみスウィート | 敵全体を2ターン行動不能にする。廃棄。 | Prevent all enemies from acting for 2 turns. Exhaust. | OK (explicit card text) |
| GIRLS_JEWEL_SHINE | ジュエル・シャイン | キラキラ1を得る。 | Gain 1 Artifact. | OK |
| GIRLS_FLOWER_GARDEN | 花咲く乙女の庭 | ターン終了時、HPを2回復する。 | Heal 2 HP at the end of each turn. | OK |
| GIRLS_PRINCESS_DRESS | 憧れのドレスアップ | カチカチ3を得る。ブロック10。 | Gain 10 Block. Gain 3 Dexterity. | OK |
| GIRLS_CANDY_WAVE | キャンディ・ポップ・ウェーブ | 全体に7ダメージ。全員をドクドク3にする。 | Deal 7 damage to all enemies. Apply 3 Poison to all enemies. | OK |
| GIRLS_MOON_SERENADE | 月光のセレナーデ | エナジー1を得る。2枚引く。廃棄。 | Draw 2 cards. Gain 1 Energy. Exhaust. | OK |
| GIRLS_ANGEL_WINGS | 天使の羽ばたき | ブロック5。次のターンのエナジー+1。 | Gain 5 Block. Gain 1 Energy next turn. | OK |
| GIRLS_CHERRY_BLOSSOM | さくらんぼのワルツ | 6ダメージを2回。HPを3回復。 | Deal 6 damage 2 times. Heal 3 HP. | OK |
| GIRLS_SPARKLE_DUST | キラキラの粉 | 対象をびくびく2にする。へろへろ1を与える。 | Apply 2 Vulnerable and 1 Weak to the target. | OK (explicit card text) |
| GIRLS_DREAM_CATCHER | ドリーム・キャッチャー | 山札から好きなカードを1枚手札に加える。 | Choose 1 card from your draw pile and add it to your hand. | OK |
| GIRLS_UNICORN_STRIKE | 一角獣の突進 | 20ダメージ。対象にへろへろ2。 | Deal 20 damage. Apply 2 Weak. | OK |
| GIRLS_RAINBOW_MAGIC | なないろマジック | 手札のランダムなカードのコストを0にする。 | Make 1 random card in your hand cost 0. | OK |
| GIRLS_CAKE_TOPPER | デコレーション・ケーキ | カードを使用する度、HPを1回復。 | Heal 1 HP whenever you play a card. | OK |
| GIRLS_FAIRY_TALE | おとぎ話の扉 | ランダムなスペシャルカードを3枚手札に加える。 | Add 3 random Special cards to your hand. | OK |
| GIRLS_TIARA_SHIELD | 輝くティアラの守り | 現在のブロック値を2倍にする。 | Double your current Block. | OK |
| GIRLS_CUPCAKE_BOOST | 元気が出るカップケーキ | ムキムキ2を得る。廃棄。 | Gain 2 Strength. Exhaust. | OK |
| GIRLS_STAR_RAIN | 流星の願い | 4ダメージを7回。 | Deal 4 damage to a random enemy 7 times. | OK |
| GIRLS_TEA_PARTY | お茶会の時間 | エナジー2を得る。カードを2枚引く。 | Draw 2 cards. Gain 2 Energy. | OK |
| GIRLS_KIRAKIRA_PUNCH | キラキラパンチ | 8ダメージ。対象にドクドク4。 | Deal 8 damage. Apply 4 Poison. | OK |
| GIRLS_GOSSIP_GIRL | 内緒の噂話 | 対象にへろへろ3。 | Apply 3 Weak. | OK |
| GIRLS_DOLL_HOUSE | お人形遊び | 手札のスキルカード1枚をコピーする。 | Copy 1 Skill card from your hand. | OK (explicit card text) |
| GIRLS_CHOCO_VALENTINE | 本命チョコ | 15ダメージ。対象を1ターンスタンさせる。廃棄。 | Deal 15 damage. Stun the target for 1 turn. Exhaust. | OK (explicit card text) |
| GIRLS_MELODY_LINE | 夢色メロディ | スキルを使う度、ブロック3を得る。 | Gain 3 Block whenever you play a Skill. | OK |
| GIRLS_BUTTERFLY | ひらひら蝶々 | ブロック4。1枚引く。 | Gain 4 Block. Draw 1 card. | OK |
| GIRLS_SNOW_FLAKE | 雪の結晶 | 敵全体にへろへろ2。ブロック10。 | Gain 10 Block. Apply 2 Weak to all enemies. | OK |
| GIRLS_GIFT_BOX | 秘密のプレゼント | ランダムなポーションを2つ得る。廃棄。 | Gain 2 random Potions. Exhaust. | OK (explicit card text) |
| GIRLS_MERMAID_SONG | 人魚の歌声 | 全体に10ダメージ。自分にカチカチ2。 | Deal 10 damage to all enemies. Gain 2 Dexterity. | OK |
| GIRLS_SUN_FLOWER | ひまわりスマイル | ムキムキ2、カチカチ2を得る。廃棄。 | Gain 2 Strength. Gain 2 Dexterity. Exhaust. | OK |
| GIRLS_JEWELRY_BOX | 宝石箱の魔法 | 手札の全てのカードをアップグレードする。廃棄。 | Upgrade all cards in your hand. Exhaust. | OK |
| GIRLS_LOVELY_KISS | ラブリー・キッス | 8ダメージ。HPを全ダメージ分回復。 | Deal 8 damage. Heal HP equal to unblocked damage dealt. | OK |
| GIRLS_SWEET_PARADE | お菓子の行進 | 4ダメージを4回。 | Deal 4 damage 4 times. | OK |
| GIRLS_MOON_LIGHT | ムーンライト・ステップ | ブロック12。廃棄。 | Gain 12 Block. Exhaust. | OK |
| GIRLS_COLORFUL_RAIN | カラフル・レインボー | 敵全体のブロックを解除し、10ダメージ。 | Remove all enemies’ Block and deal 10 damage to all enemies. | OK (explicit card text) |
| GIRLS_ANGEL_HEAL | 天使の祈り | 最大HP+2。HP10回復。 | Increase max HP by 2. Heal 10 HP. | OK (explicit card text) |
| GIRLS_FRIENDSHIP | ずっと友達だよ | パートナーのHPを全回復。自分にブロック15。使い切り。 | Fully restore your partner’s HP. Gain 15 Block. Single use. | OK (explicit card text) |
| GIRLS_PURE_HEART | 純真な心 | 全デバフを解除。カードを2枚引く。 | Draw 2 cards. Remove all debuffs. | OK |
| GIRLS_BALLERINA | 華麗な舞 | ブロック6。次に使うアタックを強化。 | Gain 6 Block. Upgrade your next Attack. | OK (explicit card text) |
| GIRLS_STRAWBERRY | いちごの奇跡 | 最大HPを3増やす。 | Increase max HP by 3. | OK (explicit card text) |
| GIRLS_CANDY_SHOWER | 飴玉の嵐 | 全体に3ダメージを3回。へろへろ1を与える。 | Deal 3 damage to all enemies 3 times. Apply 1 Weak to all enemies. | OK (explicit card text) |
| GIRLS_MIRACLE_RIBBON | 奇跡のリボン | エナジーを全回復。廃棄。 | Fully restore your Energy. Exhaust. | OK (explicit card text) |
| GIRLS_STAR_DUST | 星屑のきらめき | 対象にびくびく2。カードを1枚引く。 | Apply 2 Vulnerable to the target. Draw 1 card. | OK (explicit card text) |
| GIRLS_MAGIC_CIRCLE | 魔法陣の展開 | 毎ターン開始時、エナジー1を得る。 | Gain 1 Energy at the start of each turn. | OK |
| GIRLS_PRINCESS_CALL | お姫様の呼び声 | デッキからランダムなスキルを1枚手札に加える。 | Add 1 random Skill from your deck to your hand. | OK |
| GIRLS_ETERNAL_LOVE | 永遠の約束 | 敗北時、HP50%で1度だけ復活する。 | Revive once at 50% HP when defeated. | OK |
| GIRLS_FLOWER_BOMB | 百花繚乱 | 全体に30ダメージ。HP5回復。 | Deal 30 damage to all enemies. Heal 5 HP. | OK |

## 高校編

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| HS_STARTER_EDGE | ペンブレード | 7ダメージを与える。 | Deal 7 damage. | OK |
| HS_STARTER_GUARD | 参考書ガード | ブロック6を得る。 | Gain 6 Block. | OK |
| HS_STARTER_BREAK | 校章ブレイク | 9ダメージ。対象にびくびく2。 | Deal 9 damage. Apply 2 Vulnerable. | OK |
| HS_STARTER_FOCUS | 放課後フォーカス | ブロック5。カード1枚を引く。 | Gain 5 Block. Draw 1 card. | OK |
| HS_STARTER_BIND | 黒リボン拘束 | 敵全体にびくびく1。ブロック3。 | Gain 3 Block. Apply 1 Vulnerable to all enemies. | OK |
| HS_STARTER_FAINT | フェイントレポート | 4ダメージ。対象にへろへろ1。 | Deal 4 damage. Apply 1 Weak. | OK |
| HS_STARTER_SPARK | 実験スパーク | 7ダメージ。エナジー1回復。 | Deal 7 damage. Gain 1 Energy. | OK |
| HS_STARTER_THROW | サイドスロー | 9ダメージ。1枚引き、1枚捨てる。 | Deal 9 damage. Draw 1 card. Discard 1 card. | OK |
| HS_STARTER_STEP | ステップイン | 5ダメージ。ブロック6。 | Deal 5 damage. Gain 6 Block. | OK |
| HS_STARTER_RESONANCE | 反響チューニング | 敵全体にへろへろ1。カード1枚を引く。 | Draw 1 card. Apply 1 Weak to all enemies. | OK |
| HS_STARTER_PREP | 禁書の栞 | ブロック7。1枚引き、1枚捨てる。 | Gain 7 Block. Draw 1 card. Discard 1 card. | OK |
| HS_STARTER_HEAT | 鉄板ヒート | 8ダメージ。次ターンのエナジー+1。 | Deal 8 damage. Gain 1 Energy next turn. | OK |
| HS_FAMILIAR_000 | 暁狐アルカの契約 | HPを3消費して暁狐アルカを召喚。毎ターン終了時、ランダムな敵に16ダメージ。廃棄。 | Lose 3 HP to summon Aruka. Its effect triggers at the end of every turn. Deal 16 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_001 | 白竜レイヴンの契約 | HPを4消費して白竜レイヴンを召喚。このターン終了時に一度だけ、敵全体に14ダメージ。廃棄。 | Lose 4 HP to summon Reivn. Its effect triggers once at the end of this turn. Deal 14 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_002 | 黒羽クロウリーの契約 | HPを5消費して黒羽クロウリーを召喚。2ターンに1回、ブロック15。廃棄。 | Lose 5 HP to summon Kurourii. Its effect triggers every other turn. Gain 15 Block. Exhaust. | OK |
| HS_FAMILIAR_003 | 虎神ラセツの契約 | HPを3消費して虎神ラセツを召喚。HPが半分以下ならターン終了時、HPを10回復。廃棄。 | Lose 3 HP to summon Rasetsu. Its effect triggers at end of turn while HP is half or lower. Heal 10 HP. Exhaust. | OK |
| HS_FAMILIAR_004 | 月兎ミカヅキの契約 | HPを4消費して月兎ミカヅキを召喚。ブロック0ならターン終了時、次ターン開始時にカードを2枚引く。廃棄。 | Lose 4 HP to summon Mikazuki. Its effect triggers at end of turn if you have 0 Block. Draw 2 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_005 | 鬼面カグラの契約 | HPを5消費して鬼面カグラを召喚。毎ターン終了時、次ターンのエナジー+2。廃棄。 | Lose 5 HP to summon Kagura. Its effect triggers at the end of every turn. Gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_006 | 鶴姫シラユキの契約 | HPを3消費して鶴姫シラユキを召喚。このターン終了時に一度だけ、ランダムな敵にドクドク11。廃棄。 | Lose 3 HP to summon Shirayuki. Its effect triggers once at the end of this turn. Apply 11 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_007 | 幸運猫ノワールの契約 | HPを4消費して幸運猫ノワールを召喚。2ターンに1回、敵全体にへろへろ2。廃棄。 | Lose 4 HP to summon Nowaaru. Its effect triggers every other turn. Apply 2 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_008 | 海月巫女ルミナの契約 | HPを5消費して海月巫女ルミナを召喚。HPが半分以下ならターン終了時、敵全体にびくびく2。廃棄。 | Lose 5 HP to summon Rumina. Its effect triggers at end of turn while HP is half or lower. Apply 2 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_009 | 蛾天使モルフォの契約 | HPを3消費して蛾天使モルフォを召喚。ブロック0ならターン終了時、ムキムキ+2。廃棄。 | Lose 3 HP to summon Morufuo. Its effect triggers at end of turn if you have 0 Block. Gain 2 Strength. Exhaust. | OK |
| HS_FAMILIAR_010 | 九尾シグレの契約 | HPを4消費して九尾シグレを召喚。毎ターン終了時、ゴールド22を得る。廃棄。 | Lose 4 HP to summon Shigure. Its effect triggers at the end of every turn. Gain 22 Gold. Exhaust. | OK |
| HS_FAMILIAR_011 | 錦蛇コハクの契約 | HPを5消費して錦蛇コハクを召喚。このターン終了時に一度だけ、ランダムな敵に1ダメージを28回与える。廃棄。 | Lose 5 HP to summon Kohaku. Its effect triggers once at the end of this turn. Deal 1 damage to random enemies 28 times. Exhaust. | OK |
| HS_FAMILIAR_012 | 紙影ヌエの契約 | HPを3消費して紙影ヌエを召喚。2ターンに1回、敵全体にドクドク6。廃棄。 | Lose 3 HP to summon Nue. Its effect triggers every other turn. Apply 6 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_013 | 青提灯アオイの契約 | HPを4消費して青提灯アオイを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを2枚引き、ムキムキ+2、次ターンのエナジー+1。廃棄。 | Lose 4 HP to summon Aoi. Its effect triggers at end of turn while HP is half or lower. Draw 2 cards at the start of next turn, gain 2 Strength, and gain 1 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_014 | 鹿角セフィラの契約 | HPを5消費して鹿角セフィラを召喚。ブロック0ならターン終了時、ランダムな敵に16ダメージ。廃棄。 | Lose 5 HP to summon Sefuira. Its effect triggers at end of turn if you have 0 Block. Deal 16 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_015 | 髑髏小鬼ボニーの契約 | HPを3消費して髑髏小鬼ボニーを召喚。毎ターン終了時、敵全体に10ダメージ。廃棄。 | Lose 3 HP to summon Bonii. Its effect triggers at the end of every turn. Deal 10 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_016 | 彗星魚コメットの契約 | HPを4消費して彗星魚コメットを召喚。このターン終了時に一度だけ、ブロック21。廃棄。 | Lose 4 HP to summon Kometo. Its effect triggers once at the end of this turn. Gain 21 Block. Exhaust. | OK |
| HS_FAMILIAR_017 | 鈴人形リンネの契約 | HPを5消費して鈴人形リンネを召喚。2ターンに1回、HPを10回復。廃棄。 | Lose 5 HP to summon Rinne. Its effect triggers every other turn. Heal 10 HP. Exhaust. | OK |
| HS_FAMILIAR_018 | 仮面詩神ミューズの契約 | HPを3消費して仮面詩神ミューズを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを2枚引く。廃棄。 | Lose 3 HP to summon Miizu. Its effect triggers at end of turn while HP is half or lower. Draw 2 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_019 | 墨魔インクスの契約 | HPを4消費して墨魔インクスを召喚。ブロック0ならターン終了時、次ターンのエナジー+2。廃棄。 | Lose 4 HP to summon Inkusu. Its effect triggers at end of turn if you have 0 Block. Gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_020 | 歯車天使クロノの契約 | HPを5消費して歯車天使クロノを召喚。毎ターン終了時、ランダムな敵にドクドク8。廃棄。 | Lose 5 HP to summon Kurono. Its effect triggers at the end of every turn. Apply 8 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_021 | 鏡女王ミラの契約 | HPを3消費して鏡女王ミラを召喚。このターン終了時に一度だけ、敵全体にへろへろ3。廃棄。 | Lose 3 HP to summon Mira. Its effect triggers once at the end of this turn. Apply 3 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_022 | 嵐天狗ハヤテの契約 | HPを4消費して嵐天狗ハヤテを召喚。2ターンに1回、敵全体にびくびく2。廃棄。 | Lose 4 HP to summon Hayate. Its effect triggers every other turn. Apply 2 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_023 | 緋爵ヴラドの契約 | HPを5消費して緋爵ヴラドを召喚。HPが半分以下ならターン終了時、ムキムキ+2。廃棄。 | Lose 5 HP to summon Vrado. Its effect triggers at end of turn while HP is half or lower. Gain 2 Strength. Exhaust. | OK |
| HS_FAMILIAR_024 | 夢喰バクシンの契約 | HPを3消費して夢喰バクシンを召喚。ブロック0ならターン終了時、ゴールド22を得る。廃棄。 | Lose 3 HP to summon Bakushin. Its effect triggers at end of turn if you have 0 Block. Gain 22 Gold. Exhaust. | OK |
| HS_FAMILIAR_025 | 白火サラマの契約 | HPを4消費して白火サラマを召喚。毎ターン終了時、ランダムな敵に1ダメージを20回与える。廃棄。 | Lose 4 HP to summon Sarama. Its effect triggers at the end of every turn. Deal 1 damage to random enemies 20 times. Exhaust. | OK |
| HS_FAMILIAR_026 | 札式ゴーレムの契約 | HPを5消費して札式ゴーレムを召喚。このターン終了時に一度だけ、敵全体にドクドク8。廃棄。 | Lose 5 HP to summon Gooremu. Its effect triggers once at the end of this turn. Apply 8 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_027 | 紅傘アマネの契約 | HPを3消費して紅傘アマネを召喚。2ターンに1回、次ターン開始時にカードを2枚引き、ムキムキ+2、次ターンのエナジー+1。廃棄。 | Lose 3 HP to summon Amane. Its effect triggers every other turn. Draw 2 cards at the start of next turn, gain 2 Strength, and gain 1 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_028 | 骨琴ヴィオラの契約 | HPを4消費して骨琴ヴィオラを召喚。HPが半分以下ならターン終了時、ランダムな敵に16ダメージ。廃棄。 | Lose 4 HP to summon Viora. Its effect triggers at end of turn while HP is half or lower. Deal 16 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_029 | 電脳犬神ケンの契約 | HPを5消費して電脳犬神ケンを召喚。ブロック0ならターン終了時、敵全体に10ダメージ。廃棄。 | Lose 5 HP to summon Ken. Its effect triggers at end of turn if you have 0 Block. Deal 10 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_030 | 水晶人魚セレネの契約 | HPを3消費して水晶人魚セレネを召喚。毎ターン終了時、ブロック15。廃棄。 | Lose 3 HP to summon Serene. Its effect triggers at the end of every turn. Gain 15 Block. Exhaust. | OK |
| HS_FAMILIAR_031 | 影馬ケンタウロの契約 | HPを4消費して影馬ケンタウロを召喚。このターン終了時に一度だけ、HPを14回復。廃棄。 | Lose 4 HP to summon Kentauro. Its effect triggers once at the end of this turn. Heal 14 HP. Exhaust. | OK |
| HS_FAMILIAR_032 | 星麒麟ステラの契約 | HPを5消費して星麒麟ステラを召喚。2ターンに1回、次ターン開始時にカードを2枚引く。廃棄。 | Lose 5 HP to summon Sutera. Its effect triggers every other turn. Draw 2 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_033 | 人形女王ドロシーの契約 | HPを3消費して人形女王ドロシーを召喚。HPが半分以下ならターン終了時、次ターンのエナジー+2。廃棄。 | Lose 3 HP to summon Doroshii. Its effect triggers at end of turn while HP is half or lower. Gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_034 | 墨鯨オルカの契約 | HPを4消費して墨鯨オルカを召喚。ブロック0ならターン終了時、ランダムな敵にドクドク8。廃棄。 | Lose 4 HP to summon Oruka. Its effect triggers at end of turn if you have 0 Block. Apply 8 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_035 | 炉心イフリートの契約 | HPを5消費して炉心イフリートを召喚。毎ターン終了時、敵全体にへろへろ2。廃棄。 | Lose 5 HP to summon Ifuriito. Its effect triggers at the end of every turn. Apply 2 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_036 | 雪騎士ユキノの契約 | HPを3消費して雪騎士ユキノを召喚。このターン終了時に一度だけ、敵全体にびくびく4。廃棄。 | Lose 3 HP to summon Yukino. Its effect triggers once at the end of this turn. Apply 4 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_037 | 笑火ジャックの契約 | HPを4消費して笑火ジャックを召喚。2ターンに1回、ムキムキ+3。廃棄。 | Lose 4 HP to summon Jiku. Its effect triggers every other turn. Gain 3 Strength. Exhaust. | OK |
| HS_FAMILIAR_038 | 黒角ユニコの契約 | HPを5消費して黒角ユニコを召喚。HPが半分以下ならターン終了時、ゴールド28を得る。廃棄。 | Lose 5 HP to summon Yuniko. Its effect triggers at end of turn while HP is half or lower. Gain 28 Gold. Exhaust. | OK |
| HS_FAMILIAR_039 | 蒼鬼ラピスの契約 | HPを3消費して蒼鬼ラピスを召喚。ブロック0ならターン終了時、ランダムな敵に1ダメージを25回与える。廃棄。 | Lose 3 HP to summon Rapisu. Its effect triggers at end of turn if you have 0 Block. Deal 1 damage to random enemies 25 times. Exhaust. | OK |
| HS_FAMILIAR_040 | 太陽烏ヒノカの契約 | HPを4消費して太陽烏ヒノカを召喚。毎ターン終了時、敵全体にドクドク8。廃棄。 | Lose 4 HP to summon Hinoka. Its effect triggers at the end of every turn. Apply 8 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_041 | 月狼ルーナの契約 | HPを5消費して月狼ルーナを召喚。このターン終了時に一度だけ、次ターン開始時にカードを4枚引き、ムキムキ+4、次ターンのエナジー+3。廃棄。 | Lose 5 HP to summon Ruuna. Its effect triggers once at the end of this turn. Draw 4 cards at the start of next turn, gain 4 Strength, and gain 3 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_042 | 赤糸アラクネの契約 | HPを3消費して赤糸アラクネを召喚。2ターンに1回、ランダムな敵に20ダメージ。廃棄。 | Lose 3 HP to summon Arakune. Its effect triggers every other turn. Deal 20 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_043 | 数式スフィンクスの契約 | HPを4消費して数式スフィンクスを召喚。HPが半分以下ならターン終了時、敵全体に13ダメージ。廃棄。 | Lose 4 HP to summon Sufuinkusu. Its effect triggers at end of turn while HP is half or lower. Deal 13 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_044 | 鐘天使ベルの契約 | HPを5消費して鐘天使ベルを召喚。ブロック0ならターン終了時、ブロック19。廃棄。 | Lose 5 HP to summon Beru. Its effect triggers at end of turn if you have 0 Block. Gain 19 Block. Exhaust. | OK |
| HS_FAMILIAR_045 | 硝子孔雀パヴォの契約 | HPを3消費して硝子孔雀パヴォを召喚。毎ターン終了時、HPを13回復。廃棄。 | Lose 3 HP to summon Pavo. Its effect triggers at the end of every turn. Heal 13 HP. Exhaust. | OK |
| HS_FAMILIAR_046 | 黒蓮ドリアードの契約 | HPを4消費して黒蓮ドリアードを召喚。このターン終了時に一度だけ、次ターン開始時にカードを4枚引く。廃棄。 | Lose 4 HP to summon Doriaado. Its effect triggers once at the end of this turn. Draw 4 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_047 | 雷麒麟ライカの契約 | HPを5消費して雷麒麟ライカを召喚。2ターンに1回、次ターンのエナジー+3。廃棄。 | Lose 5 HP to summon Raika. Its effect triggers every other turn. Gain 3 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_048 | 落書精ジンの契約 | HPを3消費して落書精ジンを召喚。HPが半分以下ならターン終了時、ランダムな敵にドクドク10。廃棄。 | Lose 3 HP to summon Jin. Its effect triggers at end of turn while HP is half or lower. Apply 10 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_049 | 扇天狗サヤの契約 | HPを4消費して扇天狗サヤを召喚。ブロック0ならターン終了時、敵全体にへろへろ3。廃棄。 | Lose 4 HP to summon Saya. Its effect triggers at end of turn if you have 0 Block. Apply 3 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_050 | ネオン蛇ネイラの契約 | HPを5消費してネオン蛇ネイラを召喚。毎ターン終了時、敵全体にびくびく3。廃棄。 | Lose 5 HP to summon Neira. Its effect triggers at the end of every turn. Apply 3 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_051 | 黄昏フェニクスの契約 | HPを3消費して黄昏フェニクスを召喚。このターン終了時に一度だけ、ムキムキ+4。廃棄。 | Lose 3 HP to summon Fuenikusu. Its effect triggers once at the end of this turn. Gain 4 Strength. Exhaust. | OK |
| HS_FAMILIAR_052 | 人形託宣マネキンの契約 | HPを4消費して人形託宣マネキンを召喚。2ターンに1回、ゴールド28を得る。廃棄。 | Lose 4 HP to summon Manekin. Its effect triggers every other turn. Gain 28 Gold. Exhaust. | OK |
| HS_FAMILIAR_053 | 紫牛ミノスの契約 | HPを5消費して紫牛ミノスを召喚。HPが半分以下ならターン終了時、ランダムな敵に1ダメージを25回与える。廃棄。 | Lose 5 HP to summon Minosu. Its effect triggers at end of turn while HP is half or lower. Deal 1 damage to random enemies 25 times. Exhaust. | OK |
| HS_FAMILIAR_054 | 淡海リヴァの契約 | HPを3消費して淡海リヴァを召喚。ブロック0ならターン終了時、敵全体にドクドク8。廃棄。 | Lose 3 HP to summon Riva. Its effect triggers at end of turn if you have 0 Block. Apply 8 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_055 | 紅蟷螂マンティスの契約 | HPを4消費して紅蟷螂マンティスを召喚。毎ターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。 | Lose 4 HP to summon Manteisu. Its effect triggers at the end of every turn. Draw 3 cards at the start of next turn, gain 3 Strength, and gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_056 | 白墨スピリットの契約 | HPを5消費して白墨スピリットを召喚。このターン終了時に一度だけ、ランダムな敵に28ダメージ。廃棄。 | Lose 5 HP to summon Supirito. Its effect triggers once at the end of this turn. Deal 28 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_057 | 輪蛇ウロボロの契約 | HPを3消費して輪蛇ウロボロを召喚。2ターンに1回、敵全体に13ダメージ。廃棄。 | Lose 3 HP to summon Uroboro. Its effect triggers every other turn. Deal 13 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_058 | 羊魔メリーの契約 | HPを4消費して羊魔メリーを召喚。HPが半分以下ならターン終了時、ブロック19。廃棄。 | Lose 4 HP to summon Merii. Its effect triggers at end of turn while HP is half or lower. Gain 19 Block. Exhaust. | OK |
| HS_FAMILIAR_059 | 銀蛾シスターの契約 | HPを5消費して銀蛾シスターを召喚。ブロック0ならターン終了時、HPを13回復。廃棄。 | Lose 5 HP to summon Shisutaa. Its effect triggers at end of turn if you have 0 Block. Heal 13 HP. Exhaust. | OK |
| HS_FAMILIAR_060 | 蝕翼グリフォンの契約 | HPを3消費して蝕翼グリフォンを召喚。毎ターン終了時、次ターン開始時にカードを3枚引く。廃棄。 | Lose 3 HP to summon Gurifuon. Its effect triggers at the end of every turn. Draw 3 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_061 | 化狸ブローカーの契約 | HPを4消費して化狸ブローカーを召喚。このターン終了時に一度だけ、次ターンのエナジー+4。廃棄。 | Lose 4 HP to summon Burookaa. Its effect triggers once at the end of this turn. Gain 4 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_062 | 象牙バジリスクの契約 | HPを5消費して象牙バジリスクを召喚。2ターンに1回、ランダムな敵にドクドク10。廃棄。 | Lose 5 HP to summon Bajirisuku. Its effect triggers every other turn. Apply 10 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_063 | 紅槍ヴァルキュリアの契約 | HPを3消費して紅槍ヴァルキュリアを召喚。HPが半分以下ならターン終了時、敵全体にへろへろ3。廃棄。 | Lose 3 HP to summon Varukiria. Its effect triggers at end of turn while HP is half or lower. Apply 3 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_064 | 螺旋カタツムリの契約 | HPを4消費して螺旋カタツムリを召喚。ブロック0ならターン終了時、敵全体にびくびく3。廃棄。 | Lose 4 HP to summon Katatsumuri. Its effect triggers at end of turn if you have 0 Block. Apply 3 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_065 | 黒翼ケルブの契約 | HPを5消費して黒翼ケルブを召喚。毎ターン終了時、ムキムキ+3。廃棄。 | Lose 5 HP to summon Kerubu. Its effect triggers at the end of every turn. Gain 3 Strength. Exhaust. | OK |
| HS_FAMILIAR_066 | 蒼炎キツネの契約 | HPを3消費して蒼炎キツネを召喚。このターン終了時に一度だけ、ゴールド39を得る。廃棄。 | Lose 3 HP to summon Kitsune. Its effect triggers once at the end of this turn. Gain 39 Gold. Exhaust. | OK |
| HS_FAMILIAR_067 | 黄金仮面ゴーレムの契約 | HPを4消費して黄金仮面ゴーレムを召喚。2ターンに1回、ランダムな敵に1ダメージを25回与える。廃棄。 | Lose 4 HP to summon Gooremu. Its effect triggers every other turn. Deal 1 damage to random enemies 25 times. Exhaust. | OK |
| HS_FAMILIAR_068 | 灰樹アッシュの契約 | HPを5消費して灰樹アッシュを召喚。HPが半分以下ならターン終了時、敵全体にドクドク8。廃棄。 | Lose 5 HP to summon Ashi. Its effect triggers at end of turn while HP is half or lower. Apply 8 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_069 | 雨衣ゴーストの契約 | HPを3消費して雨衣ゴーストを召喚。ブロック0ならターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。 | Lose 3 HP to summon Goosuto. Its effect triggers at end of turn if you have 0 Block. Draw 3 cards at the start of next turn, gain 3 Strength, and gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_070 | 折鶴レギオンの契約 | HPを4消費して折鶴レギオンを召喚。毎ターン終了時、ランダムな敵に20ダメージ。廃棄。 | Lose 4 HP to summon Region. Its effect triggers at the end of every turn. Deal 20 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_071 | 黒曜シャークの契約 | HPを5消費して黒曜シャークを召喚。このターン終了時に一度だけ、敵全体に18ダメージ。廃棄。 | Lose 5 HP to summon Shiiku. Its effect triggers once at the end of this turn. Deal 18 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_072 | 実験ホムンクルスの契約 | HPを3消費して実験ホムンクルスを召喚。2ターンに1回、ブロック23。廃棄。 | Lose 3 HP to summon Homunkurusu. Its effect triggers every other turn. Gain 23 Block. Exhaust. | OK |
| HS_FAMILIAR_073 | 桜怨サクラの契約 | HPを4消費して桜怨サクラを召喚。HPが半分以下ならターン終了時、HPを16回復。廃棄。 | Lose 4 HP to summon Sakura. Its effect triggers at end of turn while HP is half or lower. Heal 16 HP. Exhaust. | OK |
| HS_FAMILIAR_074 | 銀狐モンクの契約 | HPを5消費して銀狐モンクを召喚。ブロック0ならターン終了時、次ターン開始時にカードを3枚引く。廃棄。 | Lose 5 HP to summon Monku. Its effect triggers at end of turn if you have 0 Block. Draw 3 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_075 | 緋烏プリーストの契約 | HPを3消費して緋烏プリーストを召喚。毎ターン終了時、次ターンのエナジー+3。廃棄。 | Lose 3 HP to summon Puriisuto. Its effect triggers at the end of every turn. Gain 3 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_076 | 黒板クラーケンの契約 | HPを4消費して黒板クラーケンを召喚。このターン終了時に一度だけ、ランダムな敵にドクドク17。廃棄。 | Lose 4 HP to summon Kuraaken. Its effect triggers once at the end of this turn. Apply 17 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_077 | 極光サーペントの契約 | HPを5消費して極光サーペントを召喚。2ターンに1回、敵全体にへろへろ3。廃棄。 | Lose 5 HP to summon Saapento. Its effect triggers every other turn. Apply 3 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_078 | 夜蝙蝠ナイトの契約 | HPを3消費して夜蝙蝠ナイトを召喚。HPが半分以下ならターン終了時、敵全体にびくびく3。廃棄。 | Lose 3 HP to summon Naito. Its effect triggers at end of turn while HP is half or lower. Apply 3 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_079 | 真夜獅子レオンの契約 | HPを4消費して真夜獅子レオンを召喚。ブロック0ならターン終了時、ムキムキ+3。廃棄。 | Lose 4 HP to summon Reon. Its effect triggers at end of turn if you have 0 Block. Gain 3 Strength. Exhaust. | OK |
| HS_FAMILIAR_080 | 曙キメラの契約 | HPを5消費して曙キメラを召喚。毎ターン終了時、ゴールド34を得る。廃棄。 | Lose 5 HP to summon Kimera. Its effect triggers at the end of every turn. Gain 34 Gold. Exhaust. | OK |
| HS_FAMILIAR_081 | 紅天狗バイカーの契約 | HPを3消費して紅天狗バイカーを召喚。このターン終了時に一度だけ、ランダムな敵に1ダメージを43回与える。廃棄。 | Lose 3 HP to summon Baikaa. Its effect triggers once at the end of this turn. Deal 1 damage to random enemies 43 times. Exhaust. | OK |
| HS_FAMILIAR_082 | 蒼鱗ラミアの契約 | HPを4消費して蒼鱗ラミアを召喚。2ターンに1回、敵全体にドクドク9。廃棄。 | Lose 4 HP to summon Ramia. Its effect triggers every other turn. Apply 9 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_083 | 陶器花嫁ゴーレムの契約 | HPを5消費して陶器花嫁ゴーレムを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。 | Lose 5 HP to summon Gooremu. Its effect triggers at end of turn while HP is half or lower. Draw 3 cards at the start of next turn, gain 3 Strength, and gain 2 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_084 | 幼火フェニィの契約 | HPを3消費して幼火フェニィを召喚。ブロック0ならターン終了時、ランダムな敵に25ダメージ。廃棄。 | Lose 3 HP to summon Fuenii. Its effect triggers at end of turn if you have 0 Block. Deal 25 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_085 | 王虎ビャッコの契約 | HPを4消費して王虎ビャッコを召喚。毎ターン終了時、敵全体に16ダメージ。廃棄。 | Lose 4 HP to summon Biko. Its effect triggers at the end of every turn. Deal 16 damage to all enemies. Exhaust. | OK |
| HS_FAMILIAR_086 | 深淵蛸ノーブルの契約 | HPを5消費して深淵蛸ノーブルを召喚。このターン終了時に一度だけ、ブロック33。廃棄。 | Lose 5 HP to summon Nooburu. Its effect triggers once at the end of this turn. Gain 33 Block. Exhaust. | OK |
| HS_FAMILIAR_087 | 仮面雷神ドラムの契約 | HPを3消費して仮面雷神ドラムを召喚。2ターンに1回、HPを16回復。廃棄。 | Lose 3 HP to summon Doramu. Its effect triggers every other turn. Heal 16 HP. Exhaust. | OK |
| HS_FAMILIAR_088 | 月影ワーウルフの契約 | HPを4消費して月影ワーウルフを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを3枚引く。廃棄。 | Lose 4 HP to summon Waaurufu. Its effect triggers at end of turn while HP is half or lower. Draw 3 cards at the start of next turn. Exhaust. | OK |
| HS_FAMILIAR_089 | 彩小鬼キャンディの契約 | HPを5消費して彩小鬼キャンディを召喚。ブロック0ならターン終了時、次ターンのエナジー+3。廃棄。 | Lose 5 HP to summon Kindei. Its effect triggers at end of turn if you have 0 Block. Gain 3 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_090 | 砂王スフィンクスの契約 | HPを3消費して砂王スフィンクスを召喚。毎ターン終了時、ランダムな敵にドクドク12。廃棄。 | Lose 3 HP to summon Sufuinkusu. Its effect triggers at the end of every turn. Apply 12 Poison to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_091 | 骨竜スカラーの契約 | HPを4消費して骨竜スカラーを召喚。このターン終了時に一度だけ、敵全体にへろへろ4。廃棄。 | Lose 4 HP to summon Sukaraa. Its effect triggers once at the end of this turn. Apply 4 Weak to all enemies. Exhaust. | OK |
| HS_FAMILIAR_092 | 雨狐アンブレラの契約 | HPを5消費して雨狐アンブレラを召喚。2ターンに1回、敵全体にびくびく3。廃棄。 | Lose 5 HP to summon Anburera. Its effect triggers every other turn. Apply 3 Vulnerable to all enemies. Exhaust. | OK |
| HS_FAMILIAR_093 | 蝕蛾クイーンの契約 | HPを3消費して蝕蛾クイーンを召喚。HPが半分以下ならターン終了時、ムキムキ+3。廃棄。 | Lose 3 HP to summon Kuiin. Its effect triggers at end of turn while HP is half or lower. Gain 3 Strength. Exhaust. | OK |
| HS_FAMILIAR_094 | 緋河童ローグの契約 | HPを4消費して緋河童ローグを召喚。ブロック0ならターン終了時、ゴールド34を得る。廃棄。 | Lose 4 HP to summon Roogu. Its effect triggers at end of turn if you have 0 Block. Gain 34 Gold. Exhaust. | OK |
| HS_FAMILIAR_095 | 水晶鹿クリスタの契約 | HPを5消費して水晶鹿クリスタを召喚。毎ターン終了時、ランダムな敵に1ダメージを38回与える。廃棄。 | Lose 5 HP to summon Kurisuta. Its effect triggers at the end of every turn. Deal 1 damage to random enemies 38 times. Exhaust. | OK |
| HS_FAMILIAR_096 | 黒天馬ノクスの契約 | HPを3消費して黒天馬ノクスを召喚。このターン終了時に一度だけ、敵全体にドクドク16。廃棄。 | Lose 3 HP to summon Nokusu. Its effect triggers once at the end of this turn. Apply 16 Poison to all enemies. Exhaust. | OK |
| HS_FAMILIAR_097 | 禁書梟オウルの契約 | HPを4消費して禁書梟オウルを召喚。2ターンに1回、次ターン開始時にカードを4枚引き、ムキムキ+4、次ターンのエナジー+3。廃棄。 | Lose 4 HP to summon Ouru. Its effect triggers every other turn. Draw 4 cards at the start of next turn, gain 4 Strength, and gain 3 Energy next turn. Exhaust. | OK |
| HS_FAMILIAR_098 | 鏡鳥ハーピィの契約 | HPを5消費して鏡鳥ハーピィを召喚。HPが半分以下ならターン終了時、ランダムな敵に30ダメージ。廃棄。 | Lose 5 HP to summon Haapii. Its effect triggers at end of turn while HP is half or lower. Deal 30 damage to a random enemy. Exhaust. | OK |
| HS_FAMILIAR_099 | 赤点大魔王アークの契約 | HPを3消費して赤点大魔王アークを召喚。ブロック0ならターン終了時、敵全体に19ダメージ。廃棄。 | Lose 3 HP to summon Aaku. Its effect triggers at end of turn if you have 0 Block. Deal 19 damage to all enemies. Exhaust. | OK |

## 基本・特殊カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| YATSUATARI | むしゃくしゃ | 8ダメージ。使用する度、この戦闘中ダメージ+5。 | Deal 8 damage. Each time you use this card, increase its damage by 5 for this combat. | OK (explicit card text) |
| EXPULSION | 早退 | 敵のHPが30以下ならすぐにたおす。 | Defeat the target immediately if it has 30 HP or less. | OK |
| SHIV | えんぴつの削りかす | 4ダメージ。廃棄。 | Deal 4 damage. Exhaust. | OK |
| CAPTURE_NET | 捕獲網 | 10ダメージ。これでたおすと敵をカード化してデッキに加える。廃棄。 | Deal 10 damage. If this defeats an enemy, capture it as a card. Exhaust. | OK |
| STRIKE | えんぴつ攻撃 | 6ダメージを与える。 | Deal 6 damage. | OK |
| DEFEND | ノートで防御 | ブロックを5得る。 | Gain 5 Block. | OK |
| BASH | ランドセルタックル | 8ダメージ。対象にびくびく2を与える。 | Deal 8 damage. Apply 2 Vulnerable. | OK |
| NEUTRALIZE | 先生に報告 | 3ダメージ。対象にへろへろ1を与える。 | Deal 3 damage. Apply 1 Weak. | OK |
| IRON_WAVE | 上履きキック | 5ダメージ。ブロック5を得る。 | Deal 5 damage. Gain 5 Block. | OK |
| HEADBUTT | 頭突き | 9ダメージ。次ターンの開始時にカードを1枚引く。 | Deal 9 damage. Draw 1 extra card next turn. | OK |
| CLOTHESLINE | 腕ぐるぐるアタック | 12ダメージ。対象にへろへろ2を与える。 | Deal 12 damage. Apply 2 Weak. | OK |
| DAGGER_THROW | チョーク投げ | 9ダメージ。1枚引き、1枚捨てる。 | Deal 9 damage. Draw 1 card. Discard 1 card. | OK |
| THUNDERCLAP | 大声 | 敵全体に4ダメージとびくびく1。 | Deal 4 damage to all enemies. Apply 1 Vulnerable to all enemies. | OK |
| TWIN_STRIKE | 往復ビンタ | 5ダメージを2回与える。 | Deal 5 damage 2 times. | OK |
| POMMEL_STRIKE | 定規で叩く | 9ダメージ。カード1枚引く。 | Deal 9 damage. Draw 1 card. | OK |
| CLEAVE | 雑巾がけ | 敵全体に8ダメージ。 | Deal 8 damage to all enemies. | OK |
| POISON_STAB | 毒舌 | 6ダメージ。ドクドク3を与える。 | Deal 6 damage. Apply 3 Poison. | OK |
| QUICK_SLASH | 早弁 | 6ダメージ。カードを2枚引く。 | Deal 6 damage. Draw 2 cards. | OK |
| SLICE | ひっかく | 6ダメージ。 | Deal 6 damage. | OK |
| BEAM_CELL | レーザーポインター | 4ダメージ。びくびく1を与える。 | Deal 4 damage. Apply 1 Vulnerable. | OK |
| COLD_SNAP | 寒いギャグ | 6ダメージ。ブロック4を得る。 | Deal 6 damage. Gain 4 Block. | OK |
| BALL_LIGHTNING | 静電気 | 7ダメージ。エナジー1回復。 | Deal 7 damage. Gain 1 Energy. | OK |
| SWORD_BOOMERANG | ブーメラン | ランダムな敵に3ダメージを3回。 | Deal 3 damage to a random enemy 3 times. | OK |
| BODY_SLAM | 防具ごと体当たり | 現在のブロック値分のダメージを与える。 | Deal damage equal to your current Block. | OK |
| WILD_STRIKE | 暴れる | 12ダメージ。山札に「ケガ」を加える。 | Deal 12 damage. Add 1 Injury to your draw pile. | OK |
| PERFECTED_STRIKE | 完璧な回答 | 6ダメージ。デッキの「えんぴつ攻撃」1枚につき+2。 | Deal 6 damage, plus 2 for each Pencil Attack in your deck. | OK (explicit card text) |
| ANGER | キレる | 6ダメージ。捨て札に「キレる」を1枚加える。 | Deal 6 damage. Add 1 ANGER to your discard pile. | OK |
| FLYING_KNEE | 跳び膝アタック | 8ダメージ。ブロック3。次ターンE+1。 | Deal 8 damage. Gain 3 Block. Gain 1 Energy next turn. | OK |
| EMPTY_FIST | グーパンチ | 9ダメージ。次のターン、エナジー1を得る。 | Deal 9 damage. Gain 1 Energy next turn. | OK |
| CONSECRATE | 掃除の時間 | 全体5ダメージ。 | Deal 5 damage to all enemies. | OK |
| CUT_THROUGH | 列に割り込む | 7ダメージ。ブロック3。1ドロー。 | Deal 7 damage. Gain 3 Block. Draw 1 card. | OK |
| SASH_WHIP | タオル攻撃 | 8ダメージ。へろへろ1。びくびく1。 | Deal 8 damage. Apply 1 Weak. Apply 1 Vulnerable. | OK |
| CLASH | 口喧嘩 | 14ダメージ。手札がアタックのみの時のみ使用可。 | Deal 14 damage. Can only be played when your hand contains only Attacks. | OK |
| DAGGER_SPRAY | 消しゴム投げ | 全体4ダメージを2回。 | Deal 4 damage to all enemies 2 times. | OK |
| SUCKER_PUNCH | カンチョー | 7ダメージ。へろへろ1を与える。 | Deal 7 damage. Apply 1 Weak. | OK |
| BANE | 追い打ち | 8ダメージ。ドクドク2を与える。 | Deal 8 damage. Apply 2 Poison. | OK |
| SURVIVOR | 生き残り | ブロック8。手札を1枚捨てる。 | Gain 8 Block. Discard 1 card. | OK |
| WARCRY | 気合いの掛け声 | 2枚引き、1枚捨てる。廃棄される。 | Draw 2 cards. Discard 1 card. Exhaust. | OK |
| SHRUG_IT_OFF | 知らんぷり | ブロック8。カード1枚引く。 | Gain 8 Block. Draw 1 card. | OK |
| DEFLECT | 回避 | ブロック4を得る。 | Gain 4 Block. | OK |
| PIERCING_WAIL | 泣き叫ぶ | 敵全体にムキムキダウン1を与える。廃棄。 | Apply 1 Strength Down to all enemies. Exhaust. | OK (explicit card text) |
| CHARGE_BATTERY | 充電 | ブロック7。次ターンエナジー+1。 | Gain 7 Block. Gain 1 Energy next turn. | OK |
| LEAP | ジャンプ | ブロック9を得る。 | Gain 9 Block. | OK |
| ARMAMENTS | 装備点検 | ブロック5。手札すべて強化。 | Gain 5 Block. Upgrade all cards in your hand. | OK |
| ACROBATICS | 側転 | 3枚引く。1枚捨てる。ブロック2。 | Draw 3 cards. Discard 1 card. Gain 2 Block. | OK (explicit card text) |
| BACKFLIP | バック転 | ブロック5。2枚引く。 | Gain 5 Block. Draw 2 cards. | OK |
| PREPARED | 準備 | 1枚引く。1枚捨てる。 | Draw 1 card. Discard 1 card. | OK |
| HOLOGRAM | カンニング | 手札の攻撃カードを1枚コピーする。 | Copy 1 Attack card from your hand. | OK (explicit card text) |
| THIRD_EYE | 予習 | ブロック7。1枚引き、1枚捨てる。 | Gain 7 Block. Draw 1 card. Discard 1 card. | OK |
| EMPTY_BODY | 瞑想 | ブロック10。 | Gain 10 Block. | OK |
| PROSTRATE | 土下座 | ブロック4。エナジー1を得る。 | Gain 4 Block. Gain 1 Energy. | OK |
| SCRY | 先読み | ブロック4を得る。2枚引く。 | Gain 4 Block. Draw 2 cards. | OK |
| SKIM | 速読 | 3枚引く。 | Draw 3 cards. | OK |
| TURBO | カフェイン | E2を得る。虚無追加。 | Gain 2 Energy. Add 1 Void to your draw pile. | OK |
| BLIND | 目隠し | へろへろ2を与える。 | Apply 2 Weak. | OK |
| TRIP | つまずかせる | 敵全体にびくびく2を与える。ブロック3。 | Gain 3 Block. Apply 2 Vulnerable to all enemies. | OK |
| DEEP_BREATH | 深呼吸 | 捨て札を山札に戻す。1枚引く。廃棄。 | Draw 1 card. Shuffle your discard pile into your draw pile. Exhaust. | OK |
| UPPERCUT | アッパー | 13ダメージ。へろへろ1とびくびく1。 | Deal 13 damage. Apply 1 Weak. Apply 1 Vulnerable. | OK |
| BLUDGEON | げんこつ | 32ダメージを与える。 | Deal 32 damage. | OK |
| REAPER | 給食当番 | 全体4ダメージ。未ブロック分HP回復。 | Deal 4 damage to all enemies. Heal HP equal to unblocked damage dealt. | OK |
| FEED | いただきます | 10ダメージ。これでたおすと最大HP+3。 | Deal 10 damage. If this defeats an enemy or resolves, increase max HP by 3. | OK |
| IMMOLATE | 焼却炉 | 全体21ダメージ。自分に2ダメージ。 | Deal 21 damage to all enemies. Lose 2 HP. | OK |
| HEAVY_BLADE | 重いバット | 14ダメージ。ムキムキ効果3倍。 | Deal 14 damage. Triple the effect of Strength. | OK (explicit card text) |
| DIE_DIE_DIE | 宿題宿題 | 全体13ダメージ。廃棄。 | Deal 13 damage to all enemies. Exhaust. | OK |
| GLASS_KNIFE | 割れた窓ガラス | 8ダメージを2回。 | Deal 8 damage 2 times. | OK |
| DASH | 廊下ダッシュ | 10ダメージ。ブロック10。 | Deal 10 damage. Gain 10 Block. | OK |
| HYPERBEAM | 目からビーム | 全体26ダメージ。 | Deal 26 damage to all enemies. | OK |
| SUNDER | ビリビリに破る | 24ダメージ。たおせばE3回復。 | Deal 24 damage. If this defeats an enemy, gain 3 Energy. | OK |
| DOOM_AND_GLOOM | 日曜の夜 | 全体10ダメージ。 | Deal 10 damage to all enemies. | OK |
| CORE_SURGE | 夜ふかし | 11ダメージ。キラキラ1を得る。 | Deal 11 damage. Gain 1 Artifact. | OK |
| RAGNAROK | 台風 | 5ダメージを5回与える。 | Deal 5 damage to a random enemy 5 times. | OK |
| LESSON_LEARNED | 学習 | 10ダメージ。たおすと最大HPが恒久的に2増加する。廃棄。 | Deal 10 damage. If this defeats an enemy or resolves, increase max HP by 2. Exhaust. | OK |
| BRILLIANCE | ひらめき | 12ダメージ。HP2回復。 | Deal 12 damage to all enemies. Heal 2 HP. | OK |
| CARNAGE | 袋叩き | 20ダメージ。 | Deal 20 damage. | OK |
| PREDATOR | ガキ大将 | 15ダメージ。次ターン2ドロー。 | Deal 15 damage. Draw 2 extra cards next turn. | OK |
| BLOOD_FOR_BLOOD | やられたらやり返す | 18ダメージ。自分に3ダメージ。 | Deal 18 damage. Lose 3 HP. | OK |
| SEVER_SOUL | 断捨離 | 16ダメージ。手札の非攻撃カードを全廃棄。 | Deal 16 damage. Exhaust all non-Attack cards from your hand. | OK (explicit card text) |
| WHIRLWIND | グルグルバット | 全体8ダメージを2回。 | Deal 8 damage to all enemies 2 times. | OK |
| FIEND_FIRE | 大掃除 | 手札を全て廃棄。1枚につき7ダメージ。 | Exhaust your hand. Deal 7 damage for each card Exhausted. | OK (explicit card text) |
| CHOKE | ヘッドロック | 12ダメージ。ドクドク5を与える。 | Deal 12 damage. Apply 5 Poison. | OK |
| ALL_OUT_STRIKE | フルスイング | 敵全体に10ダメージ。手札1枚捨てる。 | Deal 10 damage to all enemies. Discard 1 card. | OK |
| HEEL_HOOK | かかと落とし | 5ダメージ。E1回復。カードを1枚引く。 | Deal 5 damage. Draw 1 card. Gain 1 Energy. | OK |
| FINISHER | 終わりのチャイム | 6ダメージ。今ターン使用攻撃枚数分攻撃。 | Deal 6 damage. Hit once for each Attack played this turn. | OK |
| MELTER | 炭酸ジュース | 10ダメージ。対象のブロックを除去。 | Deal 10 damage. Remove the target's Block. | OK |
| SCRAPE | あがく | 7ダメージ。ドロー3、非0コス捨てる。 | Deal 7 damage. Draw 3 cards, then discard all non-0-cost cards. | OK (explicit card text) |
| RITUAL_DAGGER | 伝説の鉛筆 | 15ダメージ。敵をたおすと恒久+3強化。廃棄。 | Deal 15 damage. If this defeats an enemy, permanently increase this card's damage by 3. Exhaust. | OK |
| HEMOKINESIS | 知恵熱 | 自分に2ダメージ、15ダメージ。 | Deal 15 damage. Lose 2 HP. | OK |
| FLECHETTES | 画鋲投げ | 4ダメージ。手札のスキル枚数分攻撃。 | Deal 4 damage. Hit once for each Skill in your hand. | OK |
| RIDDLE_WITH_HOLES | 穴だらけ | 3ダメージを5回。 | Deal 3 damage 5 times. | OK |
| GRAND_FINALE | 卒業式 | 全体50ダメージ。山札0の時のみ。 | Deal 50 damage to all enemies. Can only be played when your draw pile is empty. | OK |
| CARD_ERASER | カード消しゴム | 戦闘中は使用不可。休憩マスでカードの不要な効果を1つ消す。1回使い切り。 | Unplayable during combat. At rest sites, remove 1 unwanted card effect from a card. Single use. | OK (explicit card text) |
| MIND_BLAST | 一夜漬け | 山札の枚数分ダメージ。 | Deal damage for each card in your draw pile. Innate. | OK |
| SHOCKWAVE | 教室を揺らす一撃 | 敵全体にへろへろ3とびくびく3。廃棄。 | Apply 3 Weak to all enemies. Apply 3 Vulnerable to all enemies. Exhaust. | OK |
| IMPERVIOUS | 鉄壁 | ブロック30を得る。廃棄。 | Gain 30 Block. Exhaust. | OK |
| OFFERING | パシリ | 自分に6ダメージ。E2と3枚ドロー。廃棄。 | Draw 3 cards. Gain 2 Energy. Lose 6 HP. Exhaust. | OK |
| SEEING_RED | 興奮 | エナジー2を得る。廃棄。 | Gain 2 Energy. Exhaust. | OK |
| ADRENALINE | テンションMAX | E1を得て2枚引く。廃棄。 | Draw 2 cards. Gain 1 Energy. Exhaust. | OK |
| GLACIER | かまくら | ブロック12。 | Gain 12 Block. | OK |
| REBOOT | 再起動 | 捨て札を山札に戻し、4枚引く。廃棄。 | Draw 4 cards. Shuffle your discard pile into your draw pile. Exhaust. | OK |
| GENETIC_ALGORITHM | 学習アルゴリズム | ブロック1。この戦闘で使用すると、このカードのブロック値が恒久的に2増加する。廃棄。 | Gain 1 Block. Each time you use this card in this combat, permanently increase its Block by 2. Exhaust. | OK (explicit card text) |
| FORCE_FIELD | バリア | ブロック12。 | Gain 12 Block. | OK |
| SPOT_WEAKNESS | 弱点発見 | ムキムキ+3。 | Gain 3 Strength. | OK |
| DISARM | 武器奪取 | 敵のムキムキを2下げる。廃棄。 | Reduce the target's Strength by 2. Exhaust. | OK |
| DUAL_WIELD | 二本鉛筆 | 手札の攻撃/パワーを1枚選び、2枚コピー。 | Choose 1 Attack or Power card in your hand and add 2 copies of it to your hand. | OK (explicit card text) |
| SENTINEL | 見張り | ブロック5。 | Gain 5 Block. | OK |
| LIMIT_BREAK | 火事場の馬鹿力 | ムキムキを倍にする。廃棄。 | Double your Strength. Exhaust. | OK |
| BATTLE_TRANCE | 集中モード | 3枚引く。 | Draw 3 cards. | OK |
| TERROR | 恐怖 | びくびく3を与える。廃棄。 | Apply 3 Vulnerable. Exhaust. | OK |
| CORPSE_EXPLOSION | 衝撃のうわさ | ドクドク6。たおすと全体に最大HPダメージ。 | Apply 6 Poison. When the target dies, deal its max HP as damage to all enemies. | OK |
| MALAISE | 不快感 | ムキムキ低下2とへろへろ2。廃棄。 | Apply 2 Weak. Reduce the target's Strength by 2. Exhaust. | OK |
| BURST | スキル二度押し | 次のスキルを2回発動。 | Your next Skill is played 2 times. | OK |
| ALCHEMIZE | 理科室の調合 | ランダムなカード1枚を0コストで手札に加える。 | Add 1 random card to your hand at 0 cost. | OK |
| VAULT | 大ジャンプ | 追加ターンを得る。廃棄。 | Exhaust. | OK |
| OFFERING_BLOOD | 指切りげんまん | 自分に4ダメージ、E2とドロー2。 | Draw 2 cards. Gain 2 Energy. Lose 4 HP. | OK |
| BLADE_DANCE | 工作の時間 | 手札にえんぴつの削りかす(0コス4ダメ)を3枚加える。 | Add 3 Pencil Shavings to your hand at 0 cost; each deals 4 damage. Exhaust. | OK (explicit card text) |
| CLOAK_AND_DAGGER | 隠し芸 | ブロック6。えんぴつの削りかす1枚得る。 | Gain 6 Block. Add 1 Pencil Shavings to your hand at 0 cost. | OK |
| CALCULATED_GAMBLE | 山勘 | 手札を全て捨て、同じ枚数引く。 | Discard your hand, then draw the same number of cards. | OK |
| CATALYST | 化学反応 | ドクドクを2倍にする。廃棄。 | Multiply the target's Poison by 2. Exhaust. | OK |
| DISCOVERY | 発見 | ランダムなカード3枚を手札に加える。 | Add 3 random cards to your hand. | OK |
| STRATEGIST | カンニングペーパー | 使用不可。捨てられた時、次のターンにE2を得る。 | Unplayable. When discarded, gain 2 Energy next turn. | OK (explicit card text) |
| APOTHEOSIS | 覚醒 | この戦闘中、全カードを強化。廃棄。 | Upgrade all cards for this combat. Exhaust. | OK |
| INFLAME | やる気スイッチ | ムキムキを2得る。 | Gain 2 Strength. | OK |
| DEMON_FORM | 反抗期 | ターン開始時にムキムキ2を得る。 | Gain 2 Strength at the start of each turn. | OK |
| WRAITH_FORM | 幽霊部員 | 2ターン無敵(スケスケ)になる。 | Become Intangible for 2 turns. | OK |
| ECHO_FORM | 予習復習 | 毎ターン、最初のカードを2回使用。 | Play the first card you use each turn 2 times. | OK |
| ELECTRODYNAMICS | 理科の実験 | 全体8ダメージ。 | Deal 8 damage to all enemies. | OK |
| BARRICADE | 秘密基地 | ブロックがターン終了時に消えない。 | Block is not removed at the end of your turn. | OK |
| CORRUPTION | 賞味期限 | スキルコスト0。使用時廃棄。 | Skills cost 0 and Exhaust when played. | OK |
| FEEL_NO_PAIN | 我慢大会 | 廃棄する度ブロック3を得る。 | Gain 3 Block whenever a card is Exhausted. | OK |
| RUPTURE | 成長痛 | HPを失う度、ムキムキ1を得る。 | Gain 1 Strength whenever you lose HP. | OK |
| EVOLVE | 進級 | 状態異常カードを引いた時、カードを引く。 | Draw 1 card whenever you draw a status card. | OK |
| NOXIOUS_FUMES | 異臭騒ぎ | 毎ターン敵全体にドクドク2。 | Apply 2 Poison to all enemies each turn. | OK |
| AFTER_IMAGE | 反復横跳び | カード使用時ブロック1。 | Gain 1 Block whenever you play a card. | OK |
| THOUSAND_CUTS | 千本ノック | カード使用時全体1ダメージ。 | Deal 1 damage to all enemies whenever you play a card. | OK |
| TOOLS_OF_THE_TRADE | 整理整頓 | 毎ターン1枚引き1枚捨てる。 | At the start of each turn, draw 1 card and discard 1 card. | OK |
| ENVENOM | 悪口 | 攻撃時ドクドク1付与。 | Whenever an attack deals unblocked damage, apply 1 Poison. | OK |
| STATIC_DISCHARGE | 摩擦熱 | 被ダメ時、ランダムに5ダメージ。 | When you take damage, deal 5 damage to a random enemy. | OK |
| BUFFER | 心の壁 | 次に受けるHPダメージを0にする。 | Prevent the next instance of HP damage. | OK (explicit card text) |
| CREATIVE_AI | 自由研究 | 毎ターンランダムなパワー生成。 | Create a random Power card each turn. | OK |
| DEVA_FORM | 受験勉強 | ターン開始時、エナジーを得る。毎ターン増加。 | Gain increasing Energy at the start of each turn. | OK |
| MASTER_REALITY | 模範解答 | カード生成時アップグレード。 | Cards you create are upgraded. | OK |
| BERSERK | 逆ギレ | 自分にびくびく2を与える。毎ターンエナジー1を得る。 | Apply 2 Vulnerable. Gain 1 Energy at the start of each turn. | OK |
| INFINITE_BLADES | 鉛筆削り | 毎ターン手札にえんぴつの削りかすを加える。 | Add 1 Pencil Shavings to your hand at the start of each turn. | OK (explicit card text) |
| ACCURACY | 集中力 | えんぴつの削りかすのダメージ+4。 | Shivs deal +4 damage. | OK |

## 魔法カード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| MAGIC_AKARI_1 | スターリィ・ブレイザー | 18ダメージ。<br>専用ルール: 攻撃枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。 | Deal 18 damage.<br>Unique rule: Fills the Attack slot. If that slot is already filled, the constellation does not advance. | OK |
| MAGIC_AKARI_2 | コメット・ハグシールド | ブロック14。カードを1枚引く。<br>専用ルール: スキル枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。 | Gain 14 Block. Draw 1 card.<br>Unique rule: Fills the Skill slot. If that slot is already filled, the constellation does not advance. | OK |
| MAGIC_AKARI_3 | ミラクル・スターリンク | ブロック6。カード使用時、ブロック1を得る。廃棄。<br>専用ルール: パワー枠を埋める。攻撃・スキル・パワーが揃うと完成効果が発動する。 | Gain 6 Block. Gain 1 Block whenever you play a card. Exhaust.<br>Unique rule: Fills the Power slot. Filling the Attack, Skill, and Power slots triggers the completion effect. | OK |
| MAGIC_SHIZUKU_1 | ルナミラー・スラッシュ | 14ダメージ。対象をびくびく2にする。<br>専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。 | Deal 14 damage. Apply 2 Vulnerable.<br>Unique rule: Advance Moon Mirror by 1 stage. Reflection triggers after the third exclusive card resolves. | OK |
| MAGIC_SHIZUKU_2 | ムーンリボン・ガード | ブロック16。<br>専用ルール: 月鏡を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反射が発動する。 | Gain 16 Block.<br>Unique rule: Advance Moon Mirror by 1 stage and gain 4 extra Block. Reflection triggers after the third exclusive card resolves. | OK |
| MAGIC_SHIZUKU_3 | ルミナス・リフレクト | ブロック8。ターン終了時、ブロック5を得る。廃棄。<br>専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。 | Gain 8 Block. Gain 5 Block at the end of your turn. Exhaust.<br>Unique rule: Advance Moon Mirror by 1 stage. Reflection triggers after the third exclusive card resolves. | OK |
| MAGIC_HIYORI_1 | ブルーム・ペタルショット | 敵全体に10ダメージ。<br>専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。 | Deal 10 damage to all enemies.<br>Unique rule: Advance Life Flowerbed by 1 stage. Harvest triggers after the third exclusive card resolves. | OK |
| MAGIC_HIYORI_2 | フローラル・メディカ | HPを8回復。カードを1枚引く。<br>専用ルール: 命花壇を1段階進め、追加でHPを2回復する。3回目の専用カード使用後に収穫が発動する。 | Draw 1 card. Heal 8 HP.<br>Unique rule: Advance Life Flowerbed by 1 stage and heal 2 extra HP. Harvest triggers after the third exclusive card resolves. | OK |
| MAGIC_HIYORI_3 | ハートフル・ブルーム | カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。<br>専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。 | Draw 1 card. Draw 1 extra card at the start of each turn. Exhaust.<br>Unique rule: Advance Life Flowerbed by 1 stage. Harvest triggers after the third exclusive card resolves. | OK |
| MAGIC_TSUBASA_1 | ブレイズ・ハンマースター | 22ダメージ。自分に2ダメージ。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。 | Deal 22 damage. Lose 2 HP.<br>Unique rule: Advance Divine Forge by 1 stage. Forge Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_TSUBASA_2 | フレア・アクセル | エナジー1を得る。カードを1枚引く。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。 | Draw 1 card. Gain 1 Energy.<br>Unique rule: Advance Divine Forge by 1 stage. Forge Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_TSUBASA_3 | バーニング・ハートギア | 毎ターンエナジー1を得る。廃棄。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。 | Gain 1 Energy at the start of each turn. Exhaust.<br>Unique rule: Advance Divine Forge by 1 stage. Forge Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_REI_1 | ノワール・ルーンエッジ | 15ダメージ。対象にドクドク5。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。 | Deal 15 damage. Apply 5 Poison.<br>Unique rule: Advance Forbidden Talisman Array by 1 stage. Seal Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_REI_2 | シャドウ・チャームバインド | 敵全体をへろへろ2にする。ブロック8。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。 | Gain 8 Block. Apply 2 Weak to all enemies.<br>Unique rule: Advance Forbidden Talisman Array by 1 stage. Seal Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_REI_3 | クリムゾン・ナイトシール | 敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。 | Apply 4 Poison to all enemies. Whenever an attack deals unblocked damage, apply 1 Poison. Exhaust.<br>Unique rule: Advance Forbidden Talisman Array by 1 stage. Seal Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_MADOKA_1 | クロック・スパークループ | 12ダメージ。カードを2枚引く。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。 | Deal 12 damage. Draw 2 cards.<br>Unique rule: Advance Time Ring Record by 1 stage. Replay triggers after the third exclusive card resolves. | OK |
| MAGIC_MADOKA_2 | タイム・キャンディリロード | ブロック10。エナジー1を得る。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。 | Gain 10 Block. Gain 1 Energy.<br>Unique rule: Advance Time Ring Record by 1 stage. Replay triggers after the third exclusive card resolves. | OK |
| MAGIC_MADOKA_3 | トワイライト・クロノコード | 毎ターン最初のカードを2回発動する。廃棄。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。 | Play the first card you use each turn 2 times. Exhaust.<br>Unique rule: Advance Time Ring Record by 1 stage. Replay triggers after the third exclusive card resolves. | OK |
| MAGIC_KOHARU_1 | ゲイル・リーフアロー | 8ダメージを3回与える。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。 | Deal 8 damage 3 times.<br>Unique rule: Advance Spirit Tree by 1 stage. Contract Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_KOHARU_2 | シルフィ・スキップガード | ブロック12。カードを2枚引く。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。 | Gain 12 Block. Draw 2 cards.<br>Unique rule: Advance Spirit Tree by 1 stage. Contract Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_KOHARU_3 | エメラルド・ウィンドベル | カードを2枚引く。状態異常カードを引いた時、カードを1枚引く。廃棄。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。 | Draw 2 cards. Draw 1 card whenever you draw a status card. Exhaust.<br>Unique rule: Advance Spirit Tree by 1 stage. Contract Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_MIRAI_1 | ドリーミィ・ステージビート | 敵全体に9ダメージ。へろへろ1。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Deal 9 damage to all enemies. Apply 1 Weak to all enemies.<br>Unique rule: Advance Dream Stage by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_MIRAI_2 | プチナイトメア・アンコール | カードを3枚引き、エナジー1を得る。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Draw 3 cards. Gain 1 Energy.<br>Unique rule: Advance Dream Stage by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_MIRAI_3 | ファンシー・ドリームショー | 敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Deal 6 damage to all enemies. Deal 1 damage to all enemies whenever you play a card. Exhaust.<br>Unique rule: Advance Dream Stage by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_SERA_1 | セレスティア・ライトノヴァ | 20ダメージ。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。 | Deal 20 damage.<br>Unique rule: Advance Astral Record by 1 stage. Analysis Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_SERA_2 | ホーリー・シュガーコード | ブロック10。HPを6回復。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。 | Gain 10 Block. Heal 6 HP.<br>Unique rule: Advance Astral Record by 1 stage. Analysis Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_SERA_3 | エンジェル・スターブート | カードを2枚引く。生成カードを強化する。廃棄。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。 | Draw 2 cards. Cards you create are upgraded. Exhaust.<br>Unique rule: Advance Astral Record by 1 stage. Analysis Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_REN_1 | ゲイル・セイバー | 16ダメージ。カードを1枚引く。<br>専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。 | Deal 16 damage. Draw 1 card.<br>Unique rule: Advance Azure Wind Ward by 1 stage. Counterattack triggers after the third exclusive card resolves. | OK |
| MAGIC_REN_2 | テンペスト・イージス | ブロック15。カードを1枚引く。<br>専用ルール: 蒼風護陣を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反撃が発動する。 | Gain 15 Block. Draw 1 card.<br>Unique rule: Advance Azure Wind Ward by 1 stage and gain 4 extra Block. Counterattack triggers after the third exclusive card resolves. | OK |
| MAGIC_REN_3 | 蒼龍天翔破 | ブロック6。カード使用時、ブロック1を得る。廃棄。<br>専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。 | Gain 6 Block. Gain 1 Block whenever you play a card. Exhaust.<br>Unique rule: Advance Azure Wind Ward by 1 stage. Counterattack triggers after the third exclusive card resolves. | OK |
| MAGIC_SOMA_1 | グレイシャル・ヴァーディクト | 15ダメージ。びくびく2。<br>専用ルール: 第一手。最初に使うと計画が1段階進む。 | Deal 15 damage. Apply 2 Vulnerable.<br>Unique rule: First Move. Play it first to advance the plan to stage 1. | OK |
| MAGIC_SOMA_2 | アブソリュート・プロトコル | ブロック18。<br>専用ルール: 第二手。第一手の次に使うと計画が2段階目へ進む。先に使うとリセット。 | Gain 18 Block.<br>Unique rule: Second Move. Play it after First Move to advance the plan to stage 2. Playing it early resets the plan. | OK |
| MAGIC_SOMA_3 | 氷律絶界 | ブロック8。ターン終了時、ブロック6を得る。廃棄。<br>専用ルール: 最終手。第二手の次に使うと完成効果が発動する。先に使うとリセット。 | Gain 8 Block. Gain 6 Block at the end of your turn. Exhaust.<br>Unique rule: Final Move. Play it after Second Move to trigger the completion effect. Playing it early resets the plan. | OK |
| MAGIC_MINATO_1 | アクア・リッパー | 13ダメージ。HPを3回復。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。 | Deal 13 damage. Heal 3 HP.<br>Unique rule: Advance Clear Stream Blend by 1 stage. Blend Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_MINATO_2 | セラフィック・スプリング | HPを9回復。カードを1枚引く。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。 | Draw 1 card. Heal 9 HP.<br>Unique rule: Advance Clear Stream Blend by 1 stage. Blend Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_MINATO_3 | 蒼海神リヴァイア・グレイス | カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。 | Draw 1 card. Draw 1 extra card at the start of each turn. Exhaust.<br>Unique rule: Advance Clear Stream Blend by 1 stage. Blend Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_RIKU_1 | クロノ・アーク | 12ダメージ。カードを2枚引く。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。 | Deal 12 damage. Draw 2 cards.<br>Unique rule: Advance Branching Board by 1 stage. Observation Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_RIKU_2 | リワインド・ウォード | ブロック11。エナジー1を得る。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。 | Gain 11 Block. Gain 1 Energy.<br>Unique rule: Advance Branching Board by 1 stage. Observation Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_RIKU_3 | 運命選択・フォーチュンセレクター | 毎ターン最初のカードを2回発動する。廃棄。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。 | Play the first card you use each turn 2 times. Exhaust.<br>Unique rule: Advance Branching Board by 1 stage. Observation Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_YAMATO_1 | クリムゾン・ナックル | 23ダメージ。自分に2ダメージ。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。 | Deal 23 damage. Lose 2 HP.<br>Unique rule: Advance Crimson Duel by 1 stage. Finishing Blow triggers after the third exclusive card resolves. | OK |
| MAGIC_YAMATO_2 | ブレイズ・ブルワーク | ブロック13。ムキムキ1。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。 | Gain 13 Block. Gain 1 Strength.<br>Unique rule: Advance Crimson Duel by 1 stage. Finishing Blow triggers after the third exclusive card resolves. | OK |
| MAGIC_YAMATO_3 | 獄炎獅子王撃 | 毎ターンエナジー1を得る。廃棄。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。 | Gain 1 Energy at the start of each turn. Exhaust.<br>Unique rule: Advance Crimson Duel by 1 stage. Finishing Blow triggers after the third exclusive card resolves. | OK |
| MAGIC_LEON_1 | ソニック・ミラージュ | 敵全体に10ダメージ。へろへろ1。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Deal 10 damage to all enemies. Apply 1 Weak to all enemies.<br>Unique rule: Advance Illusion Score by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_LEON_2 | ファントム・ステージ | ブロック10。カードを2枚引く。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Gain 10 Block. Draw 2 cards.<br>Unique rule: Advance Illusion Score by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_LEON_3 | グランド・ノクターン | 敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。 | Deal 6 damage to all enemies. Deal 1 damage to all enemies whenever you play a card. Exhaust.<br>Unique rule: Advance Illusion Score by 1 stage. Finale triggers after the third exclusive card resolves. | OK |
| MAGIC_ELLIOT_1 | アストラル・ランサー | 20ダメージ。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。 | Deal 20 damage.<br>Unique rule: Advance Astral Gate by 1 stage. Gate Opening triggers after the third exclusive card resolves. | OK |
| MAGIC_ELLIOT_2 | セレスティアル・アーカイブ | ブロック12。HPを5回復。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。 | Gain 12 Block. Heal 5 HP.<br>Unique rule: Advance Astral Gate by 1 stage. Gate Opening triggers after the third exclusive card resolves. | OK |
| MAGIC_ELLIOT_3 | 世界門審判・ワールドゲート | カードを2枚引く。生成カードを強化する。廃棄。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。 | Draw 2 cards. Cards you create are upgraded. Exhaust.<br>Unique rule: Advance Astral Gate by 1 stage. Gate Opening triggers after the third exclusive card resolves. | OK |
| MAGIC_SAKUYA_1 | エクリプス・エッジ | 16ダメージ。ドクドク4。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。 | Deal 16 damage. Apply 4 Poison.<br>Unique rule: Advance Eternal Night Pact by 1 stage and pay 1 extra HP. Pact Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_SAKUYA_2 | オブシディアン・チェイン | 敵全体をへろへろ2にする。ブロック9。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。 | Gain 9 Block. Apply 2 Weak to all enemies.<br>Unique rule: Advance Eternal Night Pact by 1 stage and pay 1 extra HP. Pact Completion triggers after the third exclusive card resolves. | OK |
| MAGIC_SAKUYA_3 | 常夜零式封印 | 敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。 | Apply 4 Poison to all enemies. Whenever an attack deals unblocked damage, apply 1 Poison. Exhaust.<br>Unique rule: Advance Eternal Night Pact by 1 stage and pay 1 extra HP. Pact Completion triggers after the third exclusive card resolves. | OK |

## 協力サポートカード

| ID | カード名 | 日本語効果 | English effect | 監査 |
|---|---|---|---|---|
| coop-cheer | 応援エール | 味方1人のHPを10回復する。 | Heal 10 HP for 1 ally. | OK |
| coop-iron-wall | 鉄壁サポート | 味方1人にブロック20を与える。 | Give 20 Block to 1 ally. | OK |
| coop-energy-drink | 元気ドリンク | 味方1人の次のターンのエナジーを1増やす。 | Increase 1 ally’s Energy next turn by 1. | OK |
| coop-inspiration-note | ひらめきメモ | 味方1人がカードを2枚引く。 | Have 1 ally draw 2 cards. | OK |
| coop-brave-baton | 勇気のバトン | 味方1人の次の攻撃ダメージを強化する。 | Strengthen 1 ally’s next Attack damage. | OK |
| coop-lucky-charm | ラッキーお守り | 味方1人が次に受けるダメージを0にする。 | Prevent the next damage 1 ally would take. | OK |
| coop-deep-breath | みんなで深呼吸 | 味方全体の弱体・脆弱・毒をそれぞれ1軽減する。 | Reduce Weak, Vulnerable, and Poison on all allies by 1 each. | OK |
| coop-school-lunch | チーム給食 | 味方全体のHPを5回復する。 | Heal all allies for 5 HP. | OK |
| coop-bandage | 救急ばんそうこう | 戦闘不能の味方1人をHP15で復活させる。 | Revive 1 defeated ally with 15 HP. | OK |
| coop-miracle | 保健室の奇跡 | 戦闘不能の味方1人を最大HPの25%で復活し、ブロック10を与える。 | Revive 1 defeated ally with 25% of their max HP and give them 10 Block. | OK |
