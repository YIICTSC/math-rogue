# 学習ローグ カード効果監査リスト

静的解析ベースで、**カード定義**と**実装コード**の対応を確認した一覧です（実機プレイ検証ではありません）。

- 対象カード総数: **608**
- `OK`: **594** / `要確認`: **14**

## 効果の被り（同一効果シグネチャ上位）
- 18枚: 鼻水、パニック、星のプレゼント、魅惑のカカオ、ゼロの発見、ガチャの神引き、図書室での昼寝、手作りの宝地図 …ほか10枚
- 12枚: ケガ、やけど、腹痛、後悔、不安、恥、退屈、骨折 …ほか4枚
- 6枚: 鏡 (星新一)、きてんの窓、フォークダンス、お人形遊び、カンニング、二刀流
- 5枚: 羅生門、雷神の鉄拳、カラフル・レインボー、日曜の夜、炭酸ジュース
- 4枚: 邪智暴虐、顕微鏡、キラキラの粉、足払い
- 4枚: 山月記、応援合戦、マッスル・ビルド、やる気スイッチ
- 4枚: かいけつゾロリ、秘密の近道、電脳世界へのダイブ、側転
- 4枚: 注文の多い料理店、リトマス試験紙、皆既日食、近所の番犬
- 4枚: 一寸法師、縄跳び、飴玉の嵐、ブーメラン
- 4枚: ねずみの嫁入り、分数の壁、縁日のお面、心の壁
- 3枚: めまい、虚無、ドジ
- 3枚: 透明人間、柳に風、忍法・隠れ身
- 3枚: メロスの信実、かまくら、バリア
- 3枚: 生活維持省、不老長寿のマツ、自動防衛システム
- 3枚: はてしない物語、歴史の教科書、アニメ一気見
- 3枚: 魅惑のチューリップ、万葉の歌、満天の星空
- 3枚: 真紅のモミジ、朝の会、宝石箱の魔法
- 3枚: 純白のユリ、読解力、バースト
- 3枚: 覚醒のコーヒー、産業革命、興奮
- 3枚: 鉄壁のヒノキ、虚無の鎧、秘密基地

## カード一覧
|ID|カード名|説明|実装判定|根拠|効果フィールド|
|---|---|---|---|---|---|
|`PE_SWIM`|25mクロール|ブロック6。カードを1枚引く。|OK|汎用処理で解決|`block, draw`|
|`PE_BASKET`|3ポイントシュート|22ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`PE_SOCCER`|PK戦|7ダメージを2回。対象をびくびく1にする。|OK|汎用処理で解決|`damage, playCopies, vulnerable`|
|`SCRAPE`|あがく|7ダメージ。ドロー3、非0コス捨てる。|OK|汎用処理で解決|`damage, draw`|
|`FEED`|いただきます|10ダメージ。これでたおすと最大HP+3。|OK|汎用処理で解決|`damage, fatalMaxHp`|
|`GIRLS_STRAWBERRY`|いちごの奇跡|最大HPを3増やす。|OK|汎用処理で解決|`fatalMaxHp`|
|`OUT_GRADUATION_DAY`|いつかの卒業式|ムキムキ20、カチカチ20、キラキラ5を得る。廃棄。|OK|追加ロジックあり|`exhaust`|
|`SHIV`|えんぴつの削りかす|4ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`STRIKE`|えんぴつ攻撃|6ダメージを与える。|OK|汎用処理で解決|`damage`|
|`OUT_OLD_HOUSE`|おじいちゃんの古民家|HPを全回復。最大HP+2。廃棄。|OK|汎用処理で解決|`heal, fatalMaxHp, exhaust`|
|`OUT_GRANDPA_WISDOM`|おじいちゃんの教え|HPを失う度、ムキムキ1を得る。|OK|汎用処理で解決|`applyPower`|
|`GIRLS_FAIRY_TALE`|おとぎ話の扉|ランダムなスペシャルカードを3枚手札に加える。|OK|追加ロジックあり|`-`|
|`OUT_GRANDMA_GIFT`|おばあちゃんの小遣い|120ゴールドを得る。廃棄。|OK|汎用処理で解決|`gold, exhaust`|
|`OUT_GRANDMA_CAKE`|おばあちゃんの手作りケーキ|HP30回復。最大HP+5。廃棄。|OK|汎用処理で解決|`heal, fatalMaxHp, exhaust`|
|`OMUSUBI_KORORIN`|おむすびころりん|E1を得る。ランダムな敵に5ダメージ。|OK|汎用処理で解決|`energy, damage`|
|`GIRLS_SWEET_DREAM`|おやすみスウィート|敵全体を2ターン行動不能にする。廃棄。|要確認|効果フィールド不足; 説明文と実装差分の可能性|`exhaust`|
|`OI_DETEKOI`|おーい、でてこい|18ダメージ。次ターンE+1。|OK|汎用処理で解決|`damage, nextTurnEnergy`|
|`GIRLS_DOLL_HOUSE`|お人形遊び|手札のカード1枚をコピーする。|OK|汎用処理で解決|`promptsCopy`|
|`SYAKAI_CASTLE`|お城の守り|ブロック20。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`GIRLS_PRINCESS_CALL`|お姫様の呼び声|デッキからランダムなスキルを1枚手札に加える。|OK|追加ロジックあり|`-`|
|`SYAKAI_COIN_BAG`|お宝の袋|18ダメージ。ゴールドを20得る。|OK|汎用処理で解決|`damage, gold`|
|`OUT_NEW_YEAR_GOLD`|お年玉の誘惑|手札のランダムなカード1枚を、その戦闘中0コストにする。|OK|追加ロジックあり|`-`|
|`SYAKAI_BANK`|お年玉貯金|100ゴールドを得る。廃棄。|OK|追加ロジックあり|`gold`|
|`OUT_Kite_FLYING`|お正月の凧揚げ|山札の枚数×2ダメージ。|OK|汎用処理で解決|`damagePerCardInDraw`|
|`GIRLS_TEA_PARTY`|お茶会の時間|エネルギー2を得る。カードを2枚引く。|OK|汎用処理で解決|`energy, draw`|
|`GIRLS_SWEET_PARADE`|お菓子の行進|4ダメージを4回。|OK|汎用処理で解決|`damage, playCopies`|
|`KAIKETSU_ZORORI`|かいけつゾロリ|3枚引き、1枚捨てる。|OK|汎用処理で解決|`draw, promptsDiscard`|
|`HEEL_HOOK`|かかと落とし|5ダメージ。E1回復。カードを1枚引く。|OK|汎用処理で解決|`damage, energy, draw`|
|`KAGUYA_HIME`|かぐや姫|3ターン「スケスケ(無敵)」になる。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`KASA_JIZO`|かさじぞう|ブロック4を得る。次ターンカードを1枚引く。|OK|汎用処理で解決|`block, nextTurnDraw`|
|`KACHIKACHI_YAMA`|かちかち山|12ダメージ。対象に「やけど」を与える。|OK|汎用処理で解決|`damage, addCardToDiscard`|
|`OUT_BUG_CATCH`|かぶとむし狩り|対象を捕獲する。|OK|汎用処理で解決|`capture`|
|`GLACIER`|かまくら|ブロック12。|OK|汎用処理で解決|`block`|
|`KITSUNE_NO_MADO`|きてんの窓|手札のカード 1枚をコピーする。|OK|汎用処理で解決|`promptsCopy`|
|`KIBI_DANGO`|きびだんご|ブロック5を得る。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`BLUDGEON`|げんこつ|32ダメージを与える。|OK|汎用処理で解決|`damage`|
|`KOKORO_SOSEKI`|こころ|敵の攻撃力を2下げる。廃棄。|OK|汎用処理で解決|`strength, exhaust`|
|`KOKUGO_KOTOWAZA`|ことわざの知恵|ブロック7。カードを1枚引く。|OK|汎用処理で解決|`block, draw`|
|`GON_GITSUNE`|ごんぎつね|6ダメージを2回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`GON_KURU`|ごんの栗|カードを1枚引く。ムキムキ1を得る。|OK|汎用処理で解決|`draw, strength`|
|`SAKURA_SEED`|さくらの種|ブロック3。菜園に植えると「さくら吹雪」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_CHERRY_BLOSSOM`|さくらんぼのワルツ|6ダメージを2回。HPを3回復。|OK|汎用処理で解決|`damage, playCopies, heal`|
|`SAKURA_STORM`|さくら吹雪|全体10ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`GIRLS_FRIENDSHIP`|ずっと友達だよ|パートナーのHPを全回復。自分にブロック15。|OK|汎用処理で解決|`block`|
|`SANSU_SOROBAN`|そろばん|エネルギー1を得る。手札を1枚捨てる。|OK|汎用処理で解決|`energy, promptsDiscard`|
|`BITE`|つまみ食い|7ダメージ。HP2回復。|OK|汎用処理で解決|`damage, heal`|
|`DOKKO_CHAN`|どっこいしょ|ブロック5。手札の全カードを強化する。|OK|汎用処理で解決|`block, upgradeHand`|
|`GIRLS_RAINBOW_MAGIC`|なないろマジック|手札のランダムなカードのコストを0にする。|要確認|効果フィールド不足|`-`|
|`NEZUMI_NO_YOMEIRI`|ねずみの嫁入り|この戦闘中、被ダメージを1軽減する。|OK|汎用処理で解決|`applyPower`|
|`NEVERENDING_STORY`|はてしない物語|ターンの開始時、全てのカードのコストを1下げる。|OK|汎用処理で解決|`applyPower`|
|`SLICE`|ひっかく|6ダメージ。|OK|汎用処理で解決|`damage`|
|`GIRLS_SUN_FLOWER`|ひまわりスマイル|ムキムキ2、カチカチ2を得る。廃棄。|OK|汎用処理で解決|`strength, applyPower, exhaust`|
|`GIRLS_BUTTERFLY`|ひらひら蝶々|ブロック4。1枚引く。|OK|汎用処理で解決|`block, draw`|
|`BRILLIANCE`|ひらめき|12ダメージ。HP2回復。|OK|汎用処理で解決|`damage, heal`|
|`YATSUATARI`|むしゃくしゃ|8ダメージ。使用する度、この戦闘中ダメージ+5。|OK|汎用処理で解決|`damage`|
|`DAZED`|めまい|使用不可。ターン終了時廃棄。|OK|汎用処理で解決|`unplayable, exhaust`|
|`BURN`|やけど|使用不可。ターン終了時2ダメージ。|OK|汎用処理で解決|`unplayable`|
|`BLOOD_FOR_BLOOD`|やられたらやり返す|18ダメージ。自分に3ダメージ。|OK|汎用処理で解決|`damage, selfDamage`|
|`INFLAME`|やる気スイッチ|ムキムキを2得る。|OK|汎用処理で解決|`strength`|
|`YODAKA_NO_HOSHI`|よだかの星|自分に4ダメージ。全体に15ダメージ。|OK|汎用処理で解決|`selfDamage, damage`|
|`OUT_ICE_CREAM_BINGE`|アイス食べ放題|エネルギー2を得る。自分に3ダメージ。|OK|汎用処理で解決|`energy, selfDamage`|
|`IVY_SEED`|アイビーの種|ブロック3。菜園に植えると「毒蔦アイビー」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`M_GLORY_SEED`|アサガオの種|ブロック3。菜園に植えると「朝露のアサガオ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`HYDRANGEA_SEED`|アジサイの種|ブロック3。菜園に植えると「七変化のアジサイ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`UPPERCUT`|アッパー|13ダメージ。へろへろ1とびくびく1。|OK|汎用処理で解決|`damage, weak, vulnerable`|
|`OUT_ANIME_BINGE`|アニメ一気見|ターンの開始時、手札の全コストを1下げる。|OK|汎用処理で解決|`applyPower`|
|`RIKA_ALCOHOL`|アルコールランプ|7ダメージ。対象にドクドク3。|OK|汎用処理で解決|`damage, poison`|
|`ALOE_SEED`|アロエの種|ブロック3。菜園に植えると「医薬のアロエ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`RIKA_FOSSIL`|アンモナイト|ブロック12。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`GINKGO_SEED`|イチョウの種|ブロック3。菜園に植えると「知恵のイチョウ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`PLUM_SEED`|ウメの種|ブロック3。菜園に植えると「早咲きのウメ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`PEA_SEED`|エンドウ豆の種|ブロック3。菜園に植えると「豆鉄砲」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`BOYS_OMEGA_CANNON`|オメガ・キャノン|40ダメージ。|OK|汎用処理で解決|`damage`|
|`ORANGE_SEED`|オレンジの種|ブロック3。菜園に植えると「太陽のオレンジ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`BOYS_OVERLOAD`|オーバーロード|エネルギー3を得る。次のターン、エネルギー0。|OK|汎用処理で解決|`energy, nextTurnEnergy`|
|`OUT_KABUTO_WRESTLE`|カぶとむし相撲|22ダメージ。対象にびくびく2。|OK|汎用処理で解決|`damage, vulnerable`|
|`CACAO_BEAN`|カカオの豆|ブロック3。菜園に植えると「魅惑のカカオ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`PERSIMMON_SEED`|カキの種|ブロック3。菜園に植えると「豊穣のカキ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`OAK_SEED`|カシの種|ブロック3。菜園に植えると「大樹のカシ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`TURBO`|カフェイン|E2を得る。虚無追加。|OK|汎用処理で解決|`energy, addCardToDraw`|
|`PUMPKIN_SEED`|カボチャの種|ブロック3。菜園に植えると「鉄壁カボチャ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_COLORFUL_RAIN`|カラフル・レインボー|敵全体のブロックを解除し、10ダメージ。|OK|追加ロジックあり|`damage`|
|`KUMO_NO_ITO_D`|カンダタの叫び|E2。手札に「悩み」を加える。|OK|汎用処理で解決|`energy, addCardToHand`|
|`SUCKER_PUNCH`|カンチョー|7ダメージ。へろへろ1を与える。|OK|汎用処理で解決|`damage, weak`|
|`HOLOGRAM`|カンニング|手札のカードを1枚コピーする。|OK|汎用処理で解決|`promptsCopy`|
|`STRATEGIST`|カンニングペーパー|使用不可。捨てられた時、次のターンにE2を得る。|OK|汎用処理で解決|`unplayable`|
|`PREDATOR`|ガキ大将|15ダメージ。次ターン2ドロー。|OK|汎用処理で解決|`damage, nextTurnDraw`|
|`OUT_GACHA_LUCK`|ガチャの神引き|デッキからランダムなレジェンダリーカードを手札に加える。廃棄。|OK|追加ロジックあり|`exhaust`|
|`MUSHROOM_SPORE`|キノコの胞子|ブロック3。菜園に植えると「幻覚キノコ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`CABBAGE_SEED`|キャベツの種|ブロック3。菜園に植えると「幾重のキャベツ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_CANDY_WAVE`|キャンディ・ポップ・ウェーブ|全体に7ダメージ。全員をドクドク3にする。|OK|汎用処理で解決|`damage, poison`|
|`GIRLS_SPARKLE_DUST`|キラキラの粉|対象をびくびく2にする。|OK|汎用処理で解決|`vulnerable`|
|`GIRLS_KIRAKIRA_PUNCH`|キラキラパンチ|8ダメージ。対象にドクドク4。|OK|汎用処理で解決|`damage, poison`|
|`ANGER`|キレる|6ダメージ。捨て札に「キレる」を1枚加える。|OK|汎用処理で解決|`damage, addCardToDiscard`|
|`CLOVER_SEED`|クローバーの種|ブロック3。菜園に植えると「四つ葉のクローバー」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`WHIRLWIND`|グルグルバット|全体8ダメージを2回。|OK|汎用処理で解決|`damage, playCopies`|
|`EMPTY_FIST`|グーパンチ|9ダメージ。次のターン、エネルギー1を得る。|OK|汎用処理で解決|`damage, nextTurnEnergy`|
|`WOUND`|ケガ|使用不可。|OK|汎用処理で解決|`unplayable`|
|`OUT_ARCADE_MASTER`|ゲーセンの達人|コンボ：今ターン使ったカード1枚につき8ダメージ。|OK|汎用処理で解決|`damagePerAttackPlayed`|
|`BOYS_CORE_STRIKE`|コア・ストライク|10ダメージ。エネルギー1を得る。|OK|汎用処理で解決|`damage, energy`|
|`PEPPER_SEED`|コショウの種|ブロック3。菜園に植えると「爆炎のコショウ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`COSMOS_SEED`|コスモスの種|ブロック3。菜園に植えると「秋空のコスモス」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SANSU_COMPASS`|コンパス円舞|全体に5ダメージ。ブロック5を得る。|OK|汎用処理で解決|`damage, block`|
|`OUT_CONVENIENCE`|コンビニの買い食い|HPを8回復。エネルギー1を得る。廃棄。|OK|汎用処理で解決|`heal, energy, exhaust`|
|`COFFEE_BEAN`|コーヒーの豆|ブロック3。菜園に植えると「覚醒のコーヒー」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`CACTUS`|サボテン|トゲトゲ4を得る。|OK|汎用処理で解決|`applyPower`|
|`CACTUS_SEED`|サボテンの種|ブロック3。菜園に植えると「サボテン」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SHIITAKE_SPORE`|シイタケの胞子|ブロック3。菜園に植えると「剛力のシイタケ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GINGER_SEED`|ショウガの種|ブロック3。菜園に植えると「癒やしのショウガ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`OUT_FLOWER_CROWN`|シロツメクサの冠|ブロック15を得る。|OK|汎用処理で解決|`block`|
|`JASMINE_SEED`|ジャスミンの種|ブロック3。菜園に植えると「香華のジャスミン」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`OUT_JUNGLE_GYM`|ジャングルジムの頂上|ブロック20。次ターンのエネルギー+1。|OK|汎用処理で解決|`block, nextTurnEnergy`|
|`LEAP`|ジャンプ|ブロック9を得る。|OK|汎用処理で解決|`block`|
|`GIRLS_JEWEL_SHINE`|ジュエル・シャイン|ターン開始時にキラキラ1を得る。|OK|汎用処理で解決|`applyPower`|
|`OUT_STAMP_COLLECT`|スタンプラリー|クエスト: この戦闘中、あと5枚カードを使う。達成でカードを2枚引き、エネルギー1を得る。廃棄。|要確認|効果フィールド不足|`exhaust`|
|`PE_CHAMPION`|スポーツ王|ムキムキ2、カチカチ2を得る。|OK|追加ロジックあり|`strength, applyPower`|
|`GAUCHE_CELLO`|セロ弾きのゴーシュ|ブロック10。次ターン2枚引く。|OK|汎用処理で解決|`block, nextTurnDraw`|
|`SANSU_ZERO`|ゼロの発見|「発見」と同じくランダムなカード3枚を手札に加える。廃棄。|OK|追加ロジックあり|`exhaust`|
|`SASH_WHIP`|タオル攻撃|8ダメージ。へろへろ1。びくびく1。|OK|汎用処理で解決|`damage, weak, vulnerable`|
|`DANDELION_SEED`|タンポポの種|ブロック3。菜園に植えると「綿毛のタンポポ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`DAIKON_SEED`|ダイコンの種|ブロック3。菜園に植えると「斬鉄ダイコン」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`TULIP_SEED`|チューリップの種|ブロック3。菜園に植えると「魅惑のチューリップ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`DAGGER_THROW`|チョーク投げ|9ダメージ。1枚引き、1枚捨てる。|OK|汎用処理で解決|`damage, draw, promptsDiscard`|
|`CAMELLIA_SEED`|ツバキの種|ブロック3。菜園に植えると「冬枯れのツバキ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`VINE_SEED`|ツルの種|ブロック3。菜園に植えると「巨大なツル」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`ADRENALINE`|テンションMAX|E1を得て2枚引く。廃棄。|OK|汎用処理で解決|`energy, draw, exhaust`|
|`GIRLS_CAKE_TOPPER`|デコレーション・ケーキ|カードを使用する度、HPを1回復。|OK|追加ロジックあり|`applyPower`|
|`CHILI_SEED`|トウガラシの種|ブロック3。菜園に植えると「激辛トウガラシ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`TOMATO_SEED`|トマトの種|ブロック3。菜園に植えると「完熟トマト」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`MINE_BLAST_G`|トロッコ (芥川)|今ターン使用したカード枚数分、ダメージを与える。|OK|汎用処理で解決|`damagePerAttackPlayed`|
|`CLUMSINESS`|ドジ|使用不可。廃棄。|OK|汎用処理で解決|`unplayable, exhaust`|
|`PE_BALL`|ドッジボール投球|12ダメージ。|OK|汎用処理で解決|`damage`|
|`GIRLS_DREAM_CATCHER`|ドリーム・キャッチャー|山札から好きなカードを1枚手札に加える。|要確認|効果フィールド不足|`-`|
|`GARLIC_SEED`|ニンニクの種|ブロック3。菜園に植えると「魔除けのニンニク」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`DEFEND`|ノートで防御|ブロックを5得る。|OK|汎用処理で解決|`block`|
|`SHIELD_BLOCK`|ノートで防御|ブロックを7得る。|OK|汎用処理で解決|`block`|
|`LOTUS_SEED`|ハスの種|ブロック3。菜園に植えると「聖なるハス」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_HEART_BLOOM`|ハートフル・ブルーム|HPを8回復。ブロック8。|OK|汎用処理で解決|`heal, block`|
|`SYAKAI_MARKET`|バザーの掘り出し物|ランダムなポーションを1つ得る。|OK|追加ロジックあり|`addPotion`|
|`BACKFLIP`|バック転|ブロック5。2枚引く。|OK|汎用処理で解決|`block, draw`|
|`RIKA_SPRING`|バネの弾力|ブロック5。次に使う攻撃のダメージ2倍。|OK|汎用処理で解決|`block`|
|`ROSE`|バラ|12ダメージ。ドクドク4。廃棄。|OK|汎用処理で解決|`damage, poison, exhaust`|
|`ROSE_SEED`|バラの種|ブロック3。菜園に植えると「バラ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`FORCE_FIELD`|バリア|ブロック12。|OK|汎用処理で解決|`block`|
|`BURST`|バースト|次のスキルを2回発動。|OK|汎用処理で解決|`applyPower`|
|`OFFERING`|パシリ|自分に6ダメージ。E2と3枚ドロー。廃棄。|OK|汎用処理で解決|`selfDamage, energy, draw, exhaust`|
|`OUT_CANDY_BOMB`|パチパチキャンディ|4ダメージを7回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`MADNESS`|パニック|手札のランダムなカード1枚のコストを0にする。廃棄。|要確認|効果フィールド不足|`exhaust`|
|`SANSU_PERCENT`|パーセント増量|現在のブロック値を1.5倍にする。|OK|汎用処理で解決|`blockMultiplier`|
|`CYPRESS_SEED`|ヒノキの種|ブロック3。菜園に植えると「鉄壁のヒノキ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SUNFLOWER`|ヒマワリ|エネルギー1。1枚引く。廃棄。|OK|汎用処理で解決|`energy, draw, exhaust`|
|`SUNFLOWER_SEED`|ヒマワリの種|ブロック3。菜園に植えると「ヒマワリ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SUNDER`|ビリビリに破る|24ダメージ。たおせばE3回復。|OK|汎用処理で解決|`damage, fatalEnergy`|
|`PE_DANCE`|フォークダンス|手札を1枚コピーする。|OK|汎用処理で解決|`promptsCopy`|
|`ALL_OUT_STRIKE`|フルスイング|敵全体に10ダメージ。手札1枚捨てる。|OK|汎用処理で解決|`damage, promptsDiscard`|
|`BOYS_ROBOT_BOOST`|フルドライブ|エネルギー2を得る。このターン中のみムキムキ5。|OK|汎用処理で解決|`energy, strength, applyPower`|
|`GRAPE_SEED`|ブドウの種|ブロック3。菜園に植えると「芳醇なブドウ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`BLUEBELL_SEED`|ブルーベルの種|ブロック3。菜園に植えると「響き渡る鈴蘭」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SWORD_BOOMERANG`|ブーメラン|ランダムな敵に3ダメージを3回。|OK|汎用処理で解決|`damage, playCopies`|
|`BOYS_CYBER_BLADE`|プラズマ・ブレード|12ダメージ。このカードは常に強化状態で生成される。|OK|汎用処理で解決|`damage`|
|`OUT_MODEL_BUILD`|プラモデル製作|カードを使用する度、ブロック2を得る。|OK|汎用処理で解決|`applyPower`|
|`CHOKE`|ヘッドロック|12ダメージ。ドクドク5を与える。|OK|汎用処理で解決|`damage, poison`|
|`BOKKO_CHAN`|ボッコちゃん|トゲトゲ4(反撃)を得る。|OK|汎用処理で解決|`applyPower`|
|`BODY_SLAM`|ボディスラム|現在のブロック値分のダメージを与える。|OK|汎用処理で解決|`damage, damageBasedOnBlock`|
|`RIKA_VOLCANO`|マグマの噴火|25ダメージ。対象にドクドク5。|OK|汎用処理で解決|`damage, poison`|
|`BOYS_STRENGTH_UP`|マッスル・ビルド|ムキムキ2を得る。|OK|汎用処理で解決|`strength`|
|`PE_GYM_MAT`|マット運動|ブロック10。|OK|汎用処理で解決|`block`|
|`PINE_SEED`|マツの種|ブロック3。菜園に植えると「不老長寿のマツ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`MANDRAKE_ROOT`|マンドレイク|敵全体をびくびく3にする。敵全体にドクドク10。廃棄。|OK|汎用処理で解決|`vulnerable, poison, exhaust`|
|`MANDRAKE_SEED`|マンドレイクの種|ブロック3。菜園に植えると「マンドレイク」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_MAGIC_WAND`|ミラクル・ステッキ|10ダメージ。カードを1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`MINT_SEED`|ミントの種|ブロック3。菜園に植えると「清涼のミント」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`GIRLS_MOON_LIGHT`|ムーンライト・ステップ|ブロック12。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`MELOS_TRUST`|メロスの信実|ブロック12を得る。|OK|汎用処理で解決|`block`|
|`MAPLE_SEED`|モミジの種|ブロック3。菜園に植えると「真紅のモミジ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`MOMO_TIME`|モモ|余ったエネルギーを次のターンに持ち越す。|OK|汎用処理で解決|`applyPower`|
|`WILLOW_SEED`|ヤナギの種|ブロック3。菜園に植えると「柳に風」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`YGGDRASIL`|ユグドラシル|デッキの全カードを強化。廃棄。|OK|汎用処理で解決|`upgradeDeck, exhaust`|
|`LILY_SEED`|ユリの種|ブロック3。菜園に植えると「純白のユリ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`OUT_MORNING_EXERCISE`|ラジオ体操皆勤賞|ムキムキ2、カチカチ2を得る。|OK|汎用処理で解決|`strength, applyPower`|
|`OUT_RADIO_CONTROL`|ラジコン操作|9ダメージを5回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`BOYS_FINAL_FANTASY`|ラスト・ファンタジー|この戦闘で使ったカード1枚につき5ダメージ。|OK|汎用処理で解決|`damagePerAttackPlayed`|
|`GIRLS_LOVELY_KISS`|ラブリー・キッス|8ダメージ。HPを全ダメージ分回復。|OK|汎用処理で解決|`damage, lifesteal`|
|`LAVENDER_SEED`|ラベンダーの種|ブロック3。菜園に植えると「安らぎのラベンダー」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`CLOTHESLINE`|ラリアット|12ダメージ。対象にへろへろ2を与える。|OK|汎用処理で解決|`damage, weak`|
|`BASH`|ランドセルタックル|8ダメージ。対象にびくびく2を与える。|OK|汎用処理で解決|`damage, vulnerable`|
|`RIKA_LITMUS`|リトマス試験紙|対象にへろへろ2、びくびく2を付与。|OK|汎用処理で解決|`weak, vulnerable`|
|`BOYS_REVENGE`|リベンジ・バースト|今ターン失ったHPの2倍のダメージを与える。|OK|汎用処理で解決|`damage`|
|`APPLE_SEED`|リンゴの種|ブロック3。菜園に植えると「禁断のリンゴ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`BEAM_CELL`|レーザーポインター|4ダメージ。びくびく1を与える。|OK|汎用処理で解決|`damage, vulnerable`|
|`OUT_ROLLER_BLADE`|ローラーシューズ|このターン、全手札のコストを0にする。|OK|追加ロジックあり|`-`|
|`WASABI_SEED`|ワサビの種|ブロック3。菜園に植えると「劇薬ワサビ」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`MIND_BLAST`|一夜漬け|山札の枚数分ダメージ。|OK|汎用処理で解決|`damage, damagePerCardInDraw, innate`|
|`ISSUN_BOSHI`|一寸法師|3ダメージを3回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`GIRLS_UNICORN_STRIKE`|一角獣の突進|20ダメージ。対象にへろへろ2。|OK|汎用処理で解決|`damage, weak`|
|`OUT_KIMONO_DRESS`|七五三の晴れ着|キラキラ2を得る。|OK|汎用処理で解決|`applyPower`|
|`RAINBOW_HYDRANGEA`|七変化のアジサイ|手札の枚数x4ダメージ。廃棄。|OK|汎用処理で解決|`damage, damagePerCardInHand, exhaust`|
|`KOKUGO_MANYO`|万葉の歌|ターン開始時に追加で1枚引く。|OK|汎用処理で解決|`applyPower`|
|`SANSU_TRIANGLE`|三角定規|8ダメージ。1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`IRON_WAVE`|上履きキック|5ダメージ。ブロック5を得る。|OK|汎用処理で解決|`damage, block`|
|`DOUBT`|不安|使用不可。ターン終了時、へろへろ1を得る。|OK|汎用処理で解決|`unplayable`|
|`MALAISE`|不快感|ムキムキ低下2とへろへろ2。廃棄。|OK|汎用処理で解決|`weak, applyPower, exhaust`|
|`ETERNAL_PINE`|不老長寿のマツ|ターン終了時、ブロック6を得る。|OK|汎用処理で解決|`applyPower`|
|`SYAKAI_GLOBAL`|世界一周|カードを5枚引く。|OK|汎用処理で解決|`draw`|
|`WORLD_TREE_SEED`|世界樹の種|ブロック3。菜園に植えると「ユグドラシル」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`SYAKAI_HERITAGE`|世界遺産登録|最大HPを5増やす。廃棄。|OK|追加ロジックあり|`fatalMaxHp, exhaust`|
|`KOKUGO_BUNPO`|主語と述語|カードを使用する度、ブロック1を得る。|OK|汎用処理で解決|`applyPower`|
|`SANSU_KUKU`|九九の連鎖|9ダメージ。今ターン使用した攻撃枚数分ダメージ追加。|OK|汎用処理で解決|`damage, damagePerAttackPlayed`|
|`THIRD_EYE`|予習|ブロック7。1枚引き、1枚捨てる。|OK|汎用処理で解決|`block, draw, promptsDiscard`|
|`ECHO_FORM`|予習復習|毎ターン、最初のカードを2回使用。|OK|汎用処理で解決|`applyPower`|
|`PE_TEAM`|二人三脚|ムキムキ1、カチカチ1を得る。|OK|汎用処理で解決|`strength`|
|`DUAL_WIELD`|二刀流|手札の攻撃/パワーを1枚コピー。|OK|汎用処理で解決|`promptsCopy`|
|`RIKA_ROBOT`|二足歩行ロボット|ターン終了時、ブロック5を得る。|OK|汎用処理で解決|`applyPower`|
|`KOKUGO_HAIKU`|五七五|6ダメージを3回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`KOKUGO_GOKO`|五光|20ダメージ。キラキラ1を得る。|OK|汎用処理で解決|`damage, applyPower`|
|`KOKUGO_GOKAN`|五感の表現|敵全体をへろへろ2にする。|OK|汎用処理で解決|`weak`|
|`SYAKAI_TRADE`|交換留学生|手札を1枚廃棄し、カードを2枚引く。|OK|汎用処理で解決|`promptsExhaust, draw`|
|`RIKA_ANATOMY`|人体模型|スケスケ1（ダメージ1化）を得る。|OK|追加ロジックあり|`applyPower`|
|`OSAMU_NIGHT`|人間失格|使用不可。手札にある限り、毎ターン自分に3ダメージ。|OK|汎用処理で解決|`unplayable`|
|`GIRLS_MERMAID_SONG`|人魚の歌声|全体に10ダメージ。自分にカチカチ2。|OK|汎用処理で解決|`damage, applyPower`|
|`OUT_SLEEP_IN`|休日の二度寝|HPを12回復。次のターンのエネルギー+2、ドロー+2。廃棄。|OK|追加ロジックあり|`heal, nextTurnEnergy, nextTurnDraw, exhaust`|
|`SYAKAI_CULTURE`|伝統文化|手札に加わるカードを常に強化する。|OK|追加ロジックあり|`applyPower`|
|`OUT_PARK_HIDE`|伝説のかくれんぼ|スケスケ2（無敵）を得る。廃棄。|OK|追加ロジックあり|`applyPower, exhaust`|
|`RITUAL_DAGGER`|伝説の鉛筆|15ダメージ。敵をたおすと恒久+3強化。廃棄。|OK|汎用処理で解決|`damage, fatalPermanentDamage, exhaust`|
|`BOYS_SAMURAI_SPIRIT`|侍の魂|アタックを使う度、ブロック2を得る。|OK|汎用処理で解決|`applyPower`|
|`EVENT_TRIP`|修学旅行の枕|8ダメージ。対象をへろへろ2にする。|OK|汎用処理で解決|`damage, weak`|
|`BOYS_BATTLE_STANCE`|修羅の構え|次のアタックは2回発動する。自分に2ダメージ。|OK|汎用処理で解決|`selfDamage`|
|`SANSU_MULTIPLICATION`|倍々ゲーム|ムキムキを倍にする。廃棄。|OK|汎用処理で解決|`doubleStrength, exhaust`|
|`ACROBATICS`|側転|3枚引く。1枚捨てる。|OK|汎用処理で解決|`draw, promptsDiscard`|
|`OUT_UMBRELLA_SWORD`|傘チャンバラ|12ダメージを3回。ブロック12。|OK|汎用処理で解決|`damage, playCopies, block`|
|`OUT_MY_HERO`|僕だけのヒーロー|50ダメージ。自分のHPが半分以下の時、コスト0になりダメージが2倍になる。|OK|追加ロジックあり|`damage`|
|`GIRLS_CUPCAKE_BOOST`|元気が出るカップケーキ|ムキムキ2を得る。廃棄。|OK|汎用処理で解決|`strength, exhaust`|
|`CHARGE_BATTERY`|充電|ブロック7。次ターンエナジー+1。|OK|汎用処理で解決|`block, nextTurnEnergy`|
|`NEUTRALIZE`|先生に報告|3ダメージ。対象にへろへろ1を与える。|OK|汎用処理で解決|`damage, weak`|
|`SCRY`|先読み|ブロック4を得る。2枚引く。|OK|汎用処理で解決|`block, draw`|
|`RIKA_PHOTOSYNTHESIS`|光合成|エネルギー1を得る。HP2回復。|OK|汎用処理で解決|`energy, heal`|
|`OUT_PARK_FOUNTAIN`|公園の噴水|HPを7回復。全デバフ解除。|OK|汎用処理で解決|`heal, applyPower`|
|`OUT_LAST_BATTLE`|公園の決戦|全体に30ダメージを2回。|OK|汎用処理で解決|`damage, playCopies`|
|`HYOJU_RIFLE`|兵十の火縄銃|22ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`GIRLS_GOSSIP_GIRL`|内緒の噂話|対象にへろへろ3。|OK|汎用処理で解決|`weak`|
|`SANSU_CHART`|円グラフ|カードを3枚引き、2枚捨てる。|OK|汎用処理で解決|`draw, promptsDiscard`|
|`REBOOT`|再起動|捨て札を山札に戻し、4枚引く。廃棄。|OK|汎用処理で解決|`shuffleHandToDraw, draw, exhaust`|
|`OUT_KOTATSU`|冬のこたつ|毎ターン開始時、ブロック7を得る。|OK|汎用処理で解決|`applyPower`|
|`RIKA_CONSTELLATION`|冬の大三角形|6ダメージを3回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`WINTER_CAMELLIA`|冬枯れのツバキ|8ダメージ。HPを全ダメージ分回復。廃棄。|OK|汎用処理で解決|`damage, lifesteal, exhaust`|
|`OUT_PIZZA_PARTY`|出前ピザパーティー|自分とパートナーのHPを全回復。廃棄。|OK|追加ロジックあり|`heal, exhaust`|
|`SANSU_PROTRACTOR`|分度器アタック|10ダメージ。敵をへろへろ1にする。|OK|汎用処理で解決|`damage, weak`|
|`SANSU_FRACTION`|分数の壁|次に受けるダメージを0にする。|OK|汎用処理で解決|`applyPower`|
|`CUT_THROUGH`|列に割り込む|7ダメージ。ブロック3。1ドロー。|OK|汎用処理で解決|`damage, block, draw`|
|`OUT_FIRST_SUN`|初日の出|ターン開始時にエネルギー2を得る。|OK|汎用処理で解決|`applyPower`|
|`OUT_SHRINE_PRAY`|初詣の願い事|手札の全カードのコストを0にする。廃棄。|OK|追加ロジックあり|`exhaust`|
|`STURDY_BAMBOO`|剛健な竹|現在のブロック値を倍にする。廃棄。|OK|汎用処理で解決|`doubleBlock, exhaust`|
|`POWER_SHIITAKE`|剛力のシイタケ|ムキムキ2を得る。廃棄。|OK|汎用処理で解決|`strength, exhaust`|
|`SANSU_DIVISION`|割り算|7ダメージ。対象をびくびく1にする。|OK|汎用処理で解決|`damage, vulnerable`|
|`GLASS_KNIFE`|割れた窓ガラス|8ダメージを2回。|OK|汎用処理で解決|`damage, playCopies`|
|`BOYS_GENESIS_RAY`|創世の光線|全体に40ダメージ。|OK|汎用処理で解決|`damage`|
|`CAUSTIC_WASABI`|劇薬ワサビ|ドクドクを3倍にする。廃棄。|OK|汎用処理で解決|`poisonMultiplier, exhaust`|
|`OUT_ZOO_TRIP`|動物園のライオン|25ダメージ。対象にびくびく5。|OK|汎用処理で解決|`damage, vulnerable`|
|`CATALYST`|化学反応|ドクドクを2倍にする。廃棄。|OK|汎用処理で解決|`poisonMultiplier, exhaust`|
|`MEDICINAL_ALOE`|医薬のアロエ|HPを20回復。廃棄。|OK|汎用処理で解決|`heal, exhaust`|
|`THOUSAND_CUTS`|千本ノック|カード使用時全体1ダメージ。|OK|汎用処理で解決|`applyPower`|
|`GRAND_FINALE`|卒業式|全体50ダメージ。山札0の時のみ。|OK|汎用処理で解決|`damage, playCondition`|
|`SANSU_UNIT`|単位変換|手札をすべて入れ替える。|OK|追加ロジックあり|`-`|
|`OUT_MUSEUM_TRIP`|博物館の恐竜|38ダメージ。|OK|汎用処理で解決|`damage`|
|`AFTER_IMAGE`|反復横跳び|カード使用時ブロック1。|OK|汎用処理で解決|`applyPower`|
|`DEMON_FORM`|反抗期|ターン開始時にムキムキ2を得る。|OK|汎用処理で解決|`applyPower`|
|`DEVA_FORM`|受験勉強|ターン開始時、エネルギーを得る。毎ターン増加。|OK|汎用処理で解決|`applyPower`|
|`CLASH`|口喧嘩|14ダメージ。手札がアタックのみの時のみ使用可。|OK|汎用処理で解決|`damage, playCondition`|
|`SYAKAI_TEMPLE`|古い寺院|全デバフを解除する。|要確認|説明文と実装差分の可能性|`applyPower`|
|`RAGNAROK`|台風|5ダメージを5回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`WAGAHAI_NEKO`|吾輩は猫である|ブロック3。カード1枚引く。|OK|汎用処理で解決|`block, draw`|
|`LUCKY_CLOVER`|四つ葉のクローバー|キラキラ2を得る。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`DEFLECT`|回避|ブロック4を得る。|OK|汎用処理で解決|`block`|
|`OUT_LIBRARY_SLEEP`|図書室での昼寝|全デバフを解除し、HPを全回復。廃棄。|OK|追加ロジックあり|`exhaust`|
|`KOKUGO_DICTIONARY`|国語辞典|手札のカードを2枚コピーする。廃棄。|OK|追加ロジックあり|`promptsCopy, exhaust`|
|`PROSTRATE`|土下座|ブロック4。エネルギー1を得る。|OK|汎用処理で解決|`block, energy`|
|`OUT_RADIO_STATION`|地元のラジオ局|手札のランダムなカード3枚をコピーする。|要確認|説明文と実装差分の可能性|`promptsCopy`|
|`BOTCHAN`|坊っちゃん|8ダメージ。敵を「びくびく」状態に。|OK|汎用処理で解決|`damage, vulnerable`|
|`OUT_CRAYON_WALL`|壁への落書き|毎ターン敵全体にドクドク3。|OK|汎用処理で解決|`applyPower`|
|`OUT_WOOD_CRAFT`|夏休みの工作|ターン終了時、ブロック10を得る。|OK|汎用処理で解決|`applyPower`|
|`OUT_FESTIVAL_FIRE`|夏祭りの打ち上げ花火|14ダメージ。敵全体にドクドク6。|OK|汎用処理で解決|`damage, poison`|
|`OUT_EVENING_CHIME`|夕焼けのチャイム|敵全体を即死させる（ボス無効）。廃棄。|OK|追加ロジックあり|`exhaust`|
|`OUT_GHOST_STORY`|夜の怖い話|敵全体をへろへろ4にする。|OK|汎用処理で解決|`weak`|
|`CORE_SURGE`|夜ふかし|11ダメージ。キラキラ1を得る。|OK|汎用処理で解決|`damage, exhaust, applyPower`|
|`OUT_STREET_LIGHT`|夜道の街灯|カチカチ4を得る。|OK|汎用処理で解決|`applyPower`|
|`OUT_TOY_STORE`|夢のおもちゃ屋|ランダムなレジェンダリーカードを1枚生成する。|OK|追加ロジックあり|`-`|
|`GIRLS_MELODY_LINE`|夢色メロディ|スキルを使う度、ブロック3を得る。|OK|汎用処理で解決|`applyPower`|
|`GIRLS_RIBBON_BIND`|夢見るリボン・バインド|対象の攻撃力を3下げる。|OK|汎用処理で解決|`strength`|
|`VAULT`|大ジャンプ|追加ターンを得る。廃棄。|OK|追加ロジックあり|`exhaust`|
|`THUNDERCLAP`|大声|敵全体に4ダメージとびくびく1。|OK|汎用処理で解決|`damage, vulnerable`|
|`FIEND_FIRE`|大掃除|手札を全て廃棄。1枚につき7ダメージ。|OK|追加ロジックあり|`damage, damagePerCardInHand, promptsExhaust`|
|`EVENT_CLEANING`|大掃除のホウキ|全体に7ダメージ。対象をへろへろ1にする。|OK|汎用処理で解決|`damage, weak`|
|`GREAT_OAK`|大樹のカシ|ブロック35を得る。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`OUT_TELESCOPE`|天体観測|カードを2枚引く。次のターン、さらに2枚引く。|OK|追加ロジックあり|`draw, nextTurnDraw`|
|`GIRLS_ANGEL_HEAL`|天使の祈り|最大HP+2。HP10回復。|OK|汎用処理で解決|`fatalMaxHp, heal`|
|`GIRLS_ANGEL_WINGS`|天使の羽ばたき|ブロック5。次のターンのエネルギー+1。|OK|汎用処理で解決|`block, nextTurnEnergy`|
|`RIKA_WEATHER`|天気予報|山札のトップ3枚を確認して戻すか捨てる。|OK|追加ロジックあり|`-`|
|`KOKUGO_TENREI`|天礼|毎ターン開始時、ムキムキ2を得る。|OK|汎用処理で解決|`applyPower`|
|`SOLAR_ORANGE`|太陽のオレンジ|カチカチ3を得る。|OK|汎用処理で解決|`applyPower`|
|`RIKA_PLANETS`|太陽系の公転|ターン終了時、敵全体に3ダメージ。|OK|汎用処理で解決|`applyPower`|
|`GIRLS_MIRACLE_RIBBON`|奇跡のリボン|エナジーを全回復。廃棄。|OK|追加ロジックあり|`energy, exhaust`|
|`YOSEI_HOSHI`|妖精 (星新一)|HPを10回復。手札のカード1枚を廃棄する。|OK|汎用処理で解決|`heal, promptsExhaust`|
|`BOYS_WOLF_PACK`|孤狼の群れ|9ダメージ。手札のアタック1枚につき+3。|OK|汎用処理で解決|`damage`|
|`SYAKAI_VOTE`|学級委員選挙|手札をすべて強化する。|OK|追加ロジックあり|`upgradeHand`|
|`LESSON_LEARNED`|学習|10ダメージ。たおすと最大HPが恒久的に2増加する。廃棄。|OK|汎用処理で解決|`damage, fatalMaxHp, exhaust`|
|`GENETIC_ALGORITHM`|学習アルゴリズム|ブロック1。この戦闘で使用すると、このカードのブロック値が恒久的に2増加する。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`EVENT_FESTIVAL`|学芸会の主役|カードを使用する度、ブロック1を得る。|OK|追加ロジックあり|`applyPower`|
|`SPACE_GREETING`|宇宙のあいさつ|敵全体にびくびく1とへろへろ1。|OK|汎用処理で解決|`vulnerable, weak`|
|`BOYS_KNIGHT_GUARD`|守護騎士の盾|ブロック15。キラキラ1を得る。|OK|汎用処理で解決|`block, applyPower`|
|`CALM_LAVENDER`|安らぎのラベンダー|次ターン、エネルギー2。廃棄。|OK|汎用処理で解決|`nextTurnEnergy, exhaust`|
|`RIPE_TOMATO`|完熟トマト|HPを10回復する。廃棄。|OK|汎用処理で解決|`heal, exhaust`|
|`PERFECTED_STRIKE`|完璧な回答|6ダメージ。デッキの「えんぴつ攻撃」1枚につき+2。|OK|汎用処理で解決|`damage, damagePerStrike`|
|`POMMEL_STRIKE`|定規で叩く|9ダメージ。カード1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`GIRLS_JEWELRY_BOX`|宝石箱の魔法|手札の全てのカードをアップグレードする。廃棄。|OK|汎用処理で解決|`upgradeHand, exhaust`|
|`DIE_DIE_DIE`|宿題宿題|全体13ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`PARASITE`|寄生虫|デッキから消滅すると最大HP-3。|OK|汎用処理で解決|`unplayable`|
|`COLD_SNAP`|寒いギャグ|6ダメージ。ブロック4を得る。|OK|汎用処理で解決|`damage, block`|
|`OUT_DREAM_FUTURE`|将来の夢|ムキムキ2を得る。毎ターンカードを1枚追加で引く。|OK|汎用処理で解決|`strength, applyPower`|
|`SYAKAI_COIN`|小銭入れ|20ゴールドを得る。廃棄。|OK|汎用処理で解決|`gold`|
|`WHEAT_SEED`|小麦の種|ブロック3。菜園に植えると「黄金の小麦」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`OUT_YAKISOBA`|屋台の焼きそば|ムキムキ4を得る。次ターン、エネルギー-1。|OK|汎用処理で解決|`strength, nextTurnEnergy`|
|`CALCULATED_GAMBLE`|山勘|手札を全て捨て、同じ枚数引く。|OK|追加ロジックあり|`-`|
|`SANGETSUKI`|山月記|ムキムキ2を得る。|OK|汎用処理で解決|`strength`|
|`OUT_FISH_CATCH`|川での魚つかみ|ランダムなポーションを2つ得る。廃棄。|OK|汎用処理で解決|`addPotion, exhaust`|
|`OUT_CONSTRUCTION`|工事現場の重機|40ダメージ。対象の攻撃力を2下げる。|OK|追加ロジックあり|`damage, applyPower`|
|`BLADE_DANCE`|工作の時間|手札にえんぴつの削りかす(0コス4ダメ)を3枚加える。|OK|汎用処理で解決|`addCardToHand`|
|`GIANT_VINE`|巨大なツル|全体15ダメージ。敵全体をへろへろ2にする。廃棄。|OK|汎用処理で解決|`damage, weak, exhaust`|
|`OUT_SNOW_MAN`|巨大雪だるま|ブロック50。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`BOYS_TITAN_SHIELD`|巨神の盾|ブロック40。|OK|汎用処理で解決|`block`|
|`EVENT_HOME`|帰りの会|ブロック20を得る。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`OUT_TOSHIKOSHI`|年越しそば|HPを15回復。最大HP+1。|OK|汎用処理で解決|`heal, fatalMaxHp`|
|`BOYS_PHANTOM_EDGE`|幻影の刃|6ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`MYSTIC_MUSHROOM`|幻覚キノコ|ランダムなカード2枚を手札に加える。廃棄。|OK|汎用処理で解決|`addCardToHand, exhaust`|
|`GHOSTLY_ARMOR`|幽霊部員|ブロック10。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`WRAITH_FORM`|幽霊部員|2ターン無敵(スケスケ)になる。|OK|汎用処理で解決|`applyPower`|
|`SANSU_GEOMETRY`|幾何学模様|被ダメージ時、ランダムな敵に5ダメージ。|OK|汎用処理で解決|`applyPower`|
|`LAYERED_CABBAGE`|幾重のキャベツ|ブロック10。ドクドク4を与える。廃棄。|OK|汎用処理で解決|`block, poison, exhaust`|
|`DASH`|廊下ダッシュ|10ダメージ。ブロック10。|OK|汎用処理で解決|`damage, block`|
|`SPOT_WEAKNESS`|弱点発見|ムキムキ+3。|OK|汎用処理で解決|`strength`|
|`BOYS_SHADOW_CLONE`|影分身の術|手札の全アタックカードをコピーする。|OK|追加ロジックあり|`promptsCopy`|
|`BOYS_SHADOW_BIND`|影縫いの太刀|8ダメージ。対象をへろへろ2にする。|OK|汎用処理で解決|`damage, weak`|
|`TWIN_STRIKE`|往復ビンタ|5ダメージを2回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`REGRET`|後悔|使用不可。ターン終了時、手札枚数分自分にダメージ。|OK|汎用処理で解決|`unplayable`|
|`OUT_GAME_NIGHT`|徹夜のゲーム大会|毎ターンエネルギー1を得る。自分に1ダメージ。|OK|汎用処理で解決|`applyPower, selfDamage`|
|`BUFFER`|心の壁|次に受けるHPダメージを0にする。|OK|汎用処理で解決|`applyPower`|
|`OUT_GHOST_PHOTO`|心霊写真|対象にドクドク14を付与。|OK|汎用処理で解決|`poison`|
|`BOYS_NINJA_VANISH`|忍法・隠れ身|スケスケ1（ダメージ1化）を得る。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`PE_CHEER`|応援合戦|ムキムキ2を得る。|OK|汎用処理で解決|`strength`|
|`GIRLS_MACARON_HEAL`|恋するマカロン・ヒール|HPを5回復。廃棄。|OK|汎用処理で解決|`heal, exhaust`|
|`TERROR`|恐怖|びくびく3を与える。廃棄。|OK|汎用処理で解決|`vulnerable, exhaust`|
|`SHAME`|恥|使用不可。ターン終了時、びくびく1を得る。|OK|汎用処理で解決|`unplayable`|
|`WRITHE`|悩み|使用不可。初期手札に来る。|OK|汎用処理で解決|`unplayable, innate`|
|`ENVENOM`|悪口|攻撃時ドクドク1付与。|OK|汎用処理で解決|`applyPower`|
|`BOYS_DARK_PACT`|悪魔の契約|自分に6ダメージ。エネルギー3を得る。|OK|汎用処理で解決|`selfDamage, energy`|
|`GIRLS_PRINCESS_DRESS`|憧れのドレスアップ|カチカチ3を得る。ブロック10。|OK|汎用処理で解決|`applyPower, block`|
|`RUPTURE`|成長痛|HPを失う度、ムキムキ1を得る。|OK|汎用処理で解決|`applyPower`|
|`FEEL_NO_PAIN`|我慢大会|廃棄する度ブロック3を得る。|OK|汎用処理で解決|`applyPower`|
|`BOYS_SAMURAI_AURA`|戦意高揚|毎ターン開始時、ムキムキ1、カチカチ1を得る。|OK|汎用処理で解決|`strength, applyPower`|
|`OUT_SUPER_HERO_POSE`|戦隊ヒーローのポーズ|ムキムキ2、キラキラ1を得る。この戦闘中、アタックは「使用後に1枚引く」を得る。|OK|汎用処理で解決|`strength, applyPower`|
|`OUT_TREASURE_MAP`|手作りの宝地図|ランダムなレリックを1つ入手する。廃棄。|OK|追加ロジックあり|`exhaust`|
|`OUT_SPARKLER`|手持ち花火|2ダメージを10回与える。対象にドクドク4。|OK|汎用処理で解決|`damage, playCopies, poison`|
|`BUY_GLOVES`|手袋を買いに|カチカチ2(ブロック強化)を得る。|OK|汎用処理で解決|`applyPower`|
|`PE_MARATHON`|持久走|毎ターン開始時、ブロック4を得る。|OK|汎用処理で解決|`applyPower`|
|`OFFERING_BLOOD`|指切りげんまん|自分に4ダメージ、E2とドロー2。|OK|汎用処理で解決|`selfDamage, energy, draw`|
|`CAPTURE_NET`|捕獲網|10ダメージ。これでたおすと敵をカード化してデッキに加える。廃棄。|OK|汎用処理で解決|`damage, capture, exhaust`|
|`CONSECRATE`|掃除の時間|全体5ダメージ。|OK|汎用処理で解決|`damage`|
|`SYAKAI_EXPLORER`|探検隊|8ダメージ。ゴールドを10得る。|OK|汎用処理で解決|`damage, gold`|
|`STATIC_DISCHARGE`|摩擦熱|被ダメ時、ランダムに5ダメージ。|OK|汎用処理で解決|`applyPower`|
|`TOOLS_OF_THE_TRADE`|整理整頓|毎ターン1枚引き1枚捨てる。|OK|汎用処理で解決|`applyPower`|
|`KOKUGO_MOJI`|文字の嵐|「えんぴつの削りかす」を2枚手札に加える。|OK|汎用処理で解決|`addCardToHand`|
|`SWORD_DAIKON`|斬鉄ダイコン|28ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`SEVER_SOUL`|断捨離|16ダメージ。手札の非攻撃カードを全廃棄。|OK|追加ロジックあり|`damage, promptsExhaust`|
|`SANSU_GRID`|方眼紙の盾|ブロック9。山札に「ケガ」を1枚加える。|OK|汎用処理で解決|`block, addCardToDraw`|
|`DOOM_AND_GLOOM`|日曜の夜|全体10ダメージ。|OK|汎用処理で解決|`damage`|
|`EARLY_PLUM`|早咲きのウメ|次のターン、エネルギー1を得る。廃棄。|OK|汎用処理で解決|`nextTurnEnergy, exhaust`|
|`QUICK_SLASH`|早弁|6ダメージ。カードを2枚引く。|OK|汎用処理で解決|`damage, draw`|
|`EXPULSION`|早退|敵のHPが30以下ならすぐにたおす。|要確認|効果フィールド不足; 説明文と実装差分の可能性|`-`|
|`HOSHI_PRESENT`|星のプレゼント|ランダムなポーションを1つ得る。廃棄。|要確認|効果フィールド不足|`exhaust`|
|`HOSHI_NO_OJI`|星の王子さま|最大HP+2。HP2回復。廃棄。|OK|汎用処理で解決|`fatalMaxHp, heal, exhaust`|
|`GIRLS_STAR_DUST`|星屑のきらめき|対象にびくびく2。カードを1枚引く。|OK|汎用処理で解決|`vulnerable, draw`|
|`TIME_THIEF`|時間どろぼう|5ダメージ。敵の次の行動を1ターン遅らせる。|OK|汎用処理で解決|`damage`|
|`BOYS_SHADOW_STEP`|暗影の歩法|ブロック8。カードを2枚引く。|OK|汎用処理で解決|`block, draw`|
|`BOYS_BLACK_HOLE`|暗黒の特異点|敵全体をへろへろ3、びくびく3にする。|OK|汎用処理で解決|`weak, vulnerable`|
|`WILD_STRIKE`|暴れる|12ダメージ。山札に「ケガ」を加える。|OK|汎用処理で解決|`damage, addCardToDraw`|
|`OUT_KICKBOARD`|最強のキックボード|30ダメージ。|OK|汎用処理で解決|`damage`|
|`OUT_TRADING_CARD`|最強の激レアカード|デッキのカード枚数ダメージ。|OK|汎用処理で解決|`damagePerCardInDraw`|
|`OUT_PAPER_PLANE_ULTRA`|最強の紙飛行機|全体に20ダメージ。|OK|汎用処理で解決|`damage`|
|`OUT_SUMMER_HOMEWORK`|最後の宿題|全体に50ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`GIRLS_MOON_SERENADE`|月光のセレナーデ|エネルギー1を得る。2枚引く。廃棄。|OK|汎用処理で解決|`energy, draw, exhaust`|
|`KOKUGO_RODOKU`|朗読|全体に6ダメージ。1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`EVENT_MORNING`|朝の会|手札をすべて強化する。廃棄。|OK|汎用処理で解決|`upgradeHand, exhaust`|
|`MORNING_GLORY`|朝露のアサガオ|敵全体をへろへろ2にする。廃棄。|OK|汎用処理で解決|`weak, exhaust`|
|`OUT_CLIMBING_TREE`|木登り名人|このターン、受けるダメージをすべて1にする。|OK|汎用処理で解決|`applyPower`|
|`KOKUGO_SYOSETSU`|未完の小説|捨て札をすべて山札に戻す。廃棄。|OK|追加ロジックあり|`shuffleHandToDraw, exhaust`|
|`SYAKAI_CITY`|未来都市|ターン開始時にエネルギー1、ドロー1。|OK|追加ロジックあり|`applyPower`|
|`GIRLS_CHOCO_VALENTINE`|本命チョコ|15ダメージ。対象を1ターンスタンさせる。|OK|汎用処理で解決|`damage`|
|`OUT_SNOWBALL_WAR`|本気の雪合戦|8ダメージを4回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`BONSAI_SEED`|松の盆栽の種|ブロック3。菜園に植えると「至高の盆栽」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`WILLOW_WIND`|柳に風|スケスケ1（無敵）を得る。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`SYAKAI_NEWS`|校内ニュース|敵全体をへろへろ2にする。|OK|汎用処理で解決|`weak`|
|`SYAKAI_LAW`|校則遵守|キラキラ2（デバフ無効）を得る。|OK|汎用処理で解決|`applyPower`|
|`MOMOTARO`|桃太郎|6ダメージ。手札に「きびだんご(コスト0ブロック5)」を加える。|OK|汎用処理で解決|`damage, addCardToHand`|
|`GOKURAKU_HASU`|極楽の蓮|HPを4回復。廃棄。|OK|汎用処理で解決|`heal, exhaust`|
|`OUT_BATH_TIME`|極楽の銭湯|最大HP+3。HP16回復。廃棄。|OK|汎用処理で解決|`fatalMaxHp, heal, exhaust`|
|`MASTER_REALITY`|模範解答|カード生成時アップグレード。|OK|汎用処理で解決|`applyPower`|
|`BOYS_SPACE_MINE`|次元地雷|対象にドクドク15。|OK|汎用処理で解決|`poison`|
|`BOYS_SPACE_WARP`|次元跳躍|手札と山札の全ての状態異常・呪いを消滅させ、その数だけムキムキを永続強化する。廃棄。|OK|追加ロジックあり|`exhaust`|
|`KOKUGO_SYODO`|止め・跳ね・払い|9ダメージ。対象をびくびく1にする。|OK|汎用処理で解決|`damage, vulnerable`|
|`DISARM`|武器奪取|敵のムキムキを2下げる。廃棄。|OK|汎用処理で解決|`strength, exhaust`|
|`SYAKAI_HISTORY`|歴史の教科書|ターンの開始時、手札の全コストを1下げる。|OK|追加ロジックあり|`applyPower`|
|`KOROSHIYA`|殺し屋ですのよ|9ダメージ。たおすとエネルギー2を得る。|OK|汎用処理で解決|`damage, fatalEnergy`|
|`POISON_STAB`|毒舌|6ダメージ。ドクドク3を与える。|OK|汎用処理で解決|`damage, poison`|
|`POISON_IVY`|毒蔦アイビー|ドクドク10を与える。廃棄。|OK|汎用処理で解決|`poison, exhaust`|
|`OUT_RAIN_PUDDLE`|水たまりジャンプ|ブロック8。次ターンのエネルギー+1。|OK|追加ロジックあり|`block, nextTurnEnergy`|
|`OUT_AQUARIUM`|水族館のサメ|15ダメージを3回。HP5回復。|OK|汎用処理で解決|`damage, playCopies, heal`|
|`GIRLS_ETERNAL_LOVE`|永遠の約束|敗北時、HP50%で1度だけ復活する。|OK|汎用処理で解決|`applyPower`|
|`PIERCING_WAIL`|泣き叫ぶ|敵全体にムキムキダウン1を与える。廃棄。|OK|汎用処理で解決|`strength, exhaust`|
|`OUT_MUD_FIGHT`|泥まみれの決闘|10ダメージ。敵全体をへろへろ2にする。|OK|汎用処理で解決|`damage, weak`|
|`MANY_ORDERS`|注文の多い料理店|びくびく2。へろへろ2。|OK|汎用処理で解決|`vulnerable, weak`|
|`BOYS_METEOR`|流星の鉄槌|18ダメージ。倒すと最大HP+3。|OK|汎用処理で解決|`damage, fatalMaxHp`|
|`GIRLS_STAR_RAIN`|流星の願い|4ダメージを7回。|OK|汎用処理で解決|`damage, playCopies`|
|`URASHIMA_TARO`|浦島太郎|敵全体を2ターン「へろへろ」にする。廃棄。|OK|汎用処理で解決|`weak, exhaust`|
|`OUT_PIRATE_PLAY`|海賊ごっこ|10ダメージ。50ゴールドを得る。|OK|汎用処理で解決|`damage, gold`|
|`DAGGER_SPRAY`|消しゴム投げ|全体4ダメージを2回。|OK|汎用処理で解決|`damage, playCopies`|
|`OUT_FIRE_TRUCK`|消防署見学|ブロック30を得る。|OK|汎用処理で解決|`block`|
|`DEEP_BREATH`|深呼吸|捨て札を山札に戻す。1枚引く。廃棄。|OK|汎用処理で解決|`shuffleHandToDraw, draw, exhaust`|
|`REFRESH_MINT`|清涼のミント|全デバフを解除。1枚引く。廃棄。|OK|汎用処理で解決|`draw, applyPower, exhaust`|
|`OUT_STARRY_SKY`|満天の星空|毎ターンカードを1枚追加で引く。|OK|汎用処理で解決|`applyPower`|
|`PREPARED`|準備|1枚引く。1枚捨てる。|OK|汎用処理で解決|`draw, promptsDiscard`|
|`KOKUGO_KANJI_TEST`|漢字小テスト|3ダメージ。カードを1枚引く。廃棄。|OK|汎用処理で解決|`damage, draw, exhaust`|
|`HOT_CHILI`|激辛トウガラシ|ムキムキ3を得る。|OK|汎用処理で解決|`strength`|
|`LIMIT_BREAK`|火事場の馬鹿力|ムキムキを倍にする。廃棄。|OK|汎用処理で解決|`doubleStrength, exhaust`|
|`MELTER`|炭酸ジュース|10ダメージ。対象のブロックを除去。|要確認|説明文と実装差分の可能性|`damage`|
|`BOYS_BLAZING_FIST`|烈火拳|7ダメージ。ムキムキ1を得る。|OK|汎用処理で解決|`damage, strength`|
|`BOYS_FLAME_DRIVE`|焔の突撃|14ダメージ。自分に1ダメージ。|OK|汎用処理で解決|`damage, selfDamage`|
|`BOYS_BLADE_STORM`|無尽蔵の剣線|5ダメージを5回。|OK|汎用処理で解決|`damage, playCopies`|
|`BOYS_INFINITE_BLADE`|無限の剣舞|毎ターン「幻影の刃」を1枚手札に加える。|OK|汎用処理で解決|`applyPower`|
|`SANSU_INFINITY`|無限大|ターン開始時にエネルギー1を得る。|OK|追加ロジックあり|`applyPower`|
|`IMMOLATE`|焼却炉|全体21ダメージ。自分に2ダメージ。|OK|汎用処理で解決|`damage, selfDamage`|
|`EXPLOSIVE_PEPPER`|爆炎のコショウ|全体20ダメージ。自分に3ダメージ。廃棄。|OK|汎用処理で解決|`damage, selfDamage, exhaust`|
|`J_A_X`|牛乳一気飲み|ムキムキ3を得る。ターン終了時3失う。|OK|汎用処理で解決|`strength, applyPower`|
|`OUT_PET_WALK`|犬の散歩|14ダメージ。次ターンのエネルギー+1。|OK|汎用処理で解決|`damage, nextTurnEnergy`|
|`BOYS_BERSERK_MODE`|狂戦士の咆哮|ムキムキ3を得る。対象をびくびく2にする。自分に3ダメージ。|OK|汎用処理で解決|`strength, vulnerable, selfDamage`|
|`SANSU_ABACUS_MASTER`|珠算十段|12ダメージ。倒すと最大HP+2。|OK|汎用処理で解決|`damage, fatalMaxHp`|
|`ELECTRODYNAMICS`|理科の実験|全体8ダメージ。|OK|汎用処理で解決|`damage`|
|`SURVIVOR`|生き残り|ブロック8。手札を1枚捨てる。|OK|汎用処理で解決|`block, promptsDiscard`|
|`RIKA_EVOLUTION`|生命の進化|状態異常を引く度、カードを1枚引く。|OK|汎用処理で解決|`applyPower`|
|`LIFE_MAINTENANCE`|生活維持省|ターン終了時、ブロック6を得る。|OK|汎用処理で解決|`applyPower`|
|`SYAKAI_REVOLUTION`|産業革命|エネルギー2を得る。廃棄。|OK|追加ロジックあり|`energy, exhaust`|
|`OUT_SCARE_CROW`|田んぼのかかし|敵全体を2ターン行動不能にする。廃棄。|OK|追加ロジックあり|`exhaust`|
|`SYAKAI_FACTORY`|町工場|「定規で叩く」を2枚手札に加える。|OK|汎用処理で解決|`addCardToHand`|
|`FLECHETTES`|画鋲投げ|4ダメージ。手札のスキル枚数分攻撃。|OK|汎用処理で解決|`damage, hitsPerSkillInHand`|
|`NOXIOUS_FUMES`|異臭騒ぎ|毎ターン敵全体にドクドク2。|OK|汎用処理で解決|`applyPower`|
|`HEALING_GINGER`|癒やしのショウガ|HPを5回復。全デバフを解除。廃棄。|OK|汎用処理で解決|`heal, applyPower, exhaust`|
|`DISCOVERY`|発見|ランダムなカード3枚を手札に加える。|OK|追加ロジックあり|`exhaust`|
|`GIRLS_FLOWER_BOMB`|百花繚乱|全体に30ダメージ。HP5回復。|OK|汎用処理で解決|`damage, heal`|
|`RIKA_ECLIPSE`|皆既日食|敵全体をへろへろ2、びくびく2にする。|OK|汎用処理で解決|`weak, vulnerable`|
|`HYPERBEAM`|目からビーム|全体26ダメージ。|OK|汎用処理で解決|`damage`|
|`BLIND`|目隠し|へろへろ2を与える。|OK|汎用処理で解決|`weak`|
|`BOYS_HERO_AWAKEN`|真の勇者覚醒|毎ターン開始時、エネルギー+1、ドロー+1。|OK|追加ロジックあり|`applyPower`|
|`OUT_KIMODAMESHI`|真夏の肝試し|敵全体の攻撃力を2下げる。|OK|追加ロジックあり|`strength`|
|`CRIMSON_MAPLE`|真紅のモミジ|手札を全て強化する。廃棄。|OK|汎用処理で解決|`upgradeHand, exhaust`|
|`EMPTY_BODY`|瞑想|ブロック10。|OK|汎用処理で解決|`block`|
|`SHRUG_IT_OFF`|知らんぷり|ブロック8。カード1枚引く。|OK|汎用処理で解決|`block, draw`|
|`WISDOM_GINKGO`|知恵のイチョウ|12ダメージ。これで倒すと永続的に威力+3。廃棄。|OK|汎用処理で解決|`damage, fatalPermanentDamage, exhaust`|
|`HEMOKINESIS`|知恵熱|自分に2ダメージ、15ダメージ。|OK|汎用処理で解決|`selfDamage, damage`|
|`OUT_SAND_CASTLE`|砂浜の城|ブロック30。次ターンのエネルギー-1。|OK|汎用処理で解決|`block, nextTurnEnergy`|
|`RIKA_MAGNET`|磁石の力|捨て札からランダムなカードを1枚手札に加える。|OK|追加ロジックあり|`-`|
|`OUT_DRAGON_GOD`|神社の龍神様|全体に36ダメージ。HP10回復。|OK|汎用処理で解決|`damage, heal`|
|`BOYS_STRIKE_GOD`|神速の連撃|3ダメージを6回。|OK|汎用処理で解決|`damage, playCopies`|
|`FORBIDDEN_APPLE`|禁断のリンゴ|最大HP+5。廃棄。|OK|汎用処理で解決|`fatalMaxHp, exhaust`|
|`AUTUMN_COSMOS`|秋空のコスモス|カードを3枚引く。廃棄。|OK|汎用処理で解決|`draw, exhaust`|
|`GIRLS_GIFT_BOX`|秘密のプレゼント|ランダムなポーションを2つ得る。廃棄。|OK|汎用処理で解決|`addPotion, exhaust`|
|`OUT_SECRET_LETTER`|秘密のラブレター|対象をへろへろ4、びくびく4にする。廃棄。|OK|追加ロジックあり|`weak, vulnerable, exhaust`|
|`OUT_HIDDEN_SHORTCUT`|秘密の近道|カードを3枚引き、1枚捨てる。|OK|追加ロジックあり|`draw, promptsDiscard`|
|`ENTRENCH`|秘密基地|現在のブロック値を2倍にする。|OK|汎用処理で解決|`doubleBlock`|
|`BARRICADE`|秘密基地|ブロックがターン終了時に消えない。|OK|汎用処理で解決|`applyPower`|
|`RIDDLE_WITH_HOLES`|穴だらけ|3ダメージを5回。|OK|汎用処理で解決|`damage, playCopies`|
|`OUT_SUPER_GACHA`|究極の10連ガチャ|ランダムなカード10枚を手札に加える。|OK|追加ロジックあり|`-`|
|`OUT_MUD_DUMPLING`|究極の泥団子|20ダメージ。対象にへろへろ3。|OK|汎用処理で解決|`damage, weak`|
|`OUT_SECRET_BASE`|空き地の秘密基地|ターン終了時、ブロック8を得る。|OK|汎用処理で解決|`applyPower`|
|`TOTTO_CHAN`|窓ぎわのトットちゃん|捨て札を全て山札に戻す。1枚引く。廃棄。|OK|汎用処理で解決|`shuffleHandToDraw, draw, exhaust`|
|`OUT_BICYCLE_DASH`|立ちこぎ坂道|24ダメージ。自分に2ダメージ。|OK|汎用処理で解決|`damage, selfDamage`|
|`BOYS_DRAGON_EYE`|竜の眼光|対象をびくびく3、へろへろ3にする。|OK|汎用処理で解決|`vulnerable, weak`|
|`BAMBOO_SEED`|竹の種|ブロック3。菜園に植えると「剛健な竹」に成長する。|OK|汎用処理で解決|`block, isSeed, growthRequired, grownCardId`|
|`KOKUGO_SYUJI`|精神統一|カチカチ1を得る。自分に1ダメージ。|OK|汎用処理で解決|`applyPower, selfDamage`|
|`BOYS_VOLCANO_CRASH`|紅蓮爆華|全体に20ダメージ。自分に5ダメージ。|OK|汎用処理で解決|`damage, selfDamage`|
|`SACRED_LILY`|純白のユリ|次に使うスキルは2回発動する。|OK|汎用処理で解決|`applyPower`|
|`GIRLS_PURE_HEART`|純真な心|全デバフを解除。カードを2枚引く。|OK|汎用処理で解決|`draw, applyPower`|
|`RIKA_BACTERIA`|細菌の増殖|ドクドクを3倍にする。廃棄。|OK|汎用処理で解決|`poisonMultiplier, exhaust`|
|`FINISHER`|終わりのチャイム|6ダメージ。今ターン使用攻撃枚数分攻撃。|OK|汎用処理で解決|`damage, hitsPerAttackPlayed`|
|`BOYS_JUDGEMENT`|終焉の審判|全体に60ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`EVENT_LUNCH`|給食の当番|手札に「完熟トマト(回復)」を2枚加える。|OK|汎用処理で解決|`addCardToHand`|
|`REAPER`|給食当番|全体4ダメージ。未ブロック分HP回復。|OK|汎用処理で解決|`damage, lifesteal`|
|`FLUFFY_DANDELION`|綿毛のタンポポ|「えんぴつの削りかす」を3枚手札に加える。廃棄。|OK|汎用処理で解決|`addCardToHand, exhaust`|
|`OUT_CANDY_SUGAR`|綿菓子の雲|次のターン、カードを3枚引く。|OK|汎用処理で解決|`nextTurnDraw`|
|`OUT_MASK_HERO`|縁日のお面|次に受けるHPダメージを1回0にする。|OK|汎用処理で解決|`applyPower`|
|`PE_JUMP`|縄跳び|3ダメージを3回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`RASHOMON`|羅生門|10ダメージ。敵をたおすと手札のカード1枚を廃棄する。|OK|汎用処理で解決|`damage`|
|`SACRED_LOTUS`|聖なるハス|エネルギー2。2枚引く。廃棄。|OK|汎用処理で解決|`energy, draw, exhaust`|
|`PAIN`|腹痛|使用不可。手札にある間、カードを使うたび自分に1ダメージ。|OK|汎用処理で解決|`unplayable`|
|`BOYS_DEFENCE_SYS`|自動防衛システム|ターン終了時、ブロック6を得る。|OK|汎用処理で解決|`applyPower`|
|`CREATIVE_AI`|自由研究|毎ターンランダムなパワー生成。|OK|汎用処理で解決|`applyPower`|
|`ULTIMATE_BONSAI`|至高の盆栽|現在のブロック値分ダメージ。廃棄。|OK|汎用処理で解決|`damage, damageBasedOnBlock, exhaust`|
|`SEEING_RED`|興奮|エネルギー2を得る。廃棄。|OK|汎用処理で解決|`energy, exhaust`|
|`HANASAKA_JIISAN`|花咲かじいさん|敵全体に5ダメージを与え、味方全員のHPを2回復。|OK|汎用処理で解決|`damage, heal`|
|`GIRLS_FLOWER_GARDEN`|花咲く乙女の庭|ターン終了時、HPを2回復する。|OK|汎用処理で解決|`applyPower`|
|`RICH_GRAPE`|芳醇なブドウ|10ダメージ。ムキムキの効果が3倍になる。廃棄。|OK|汎用処理で解決|`damage, strengthScaling, exhaust`|
|`GIRLS_BALLERINA`|華麗な舞|ブロック6。次に使うアタックを強化。|OK|追加ロジックあり|`block`|
|`OUT_FALL_LEAVES`|落ち葉の絨毯|ブロック10。カードを2枚引く。|OK|汎用処理で解決|`block, draw`|
|`TORA_HO`|虎咆|全体12ダメージ。びくびく1。|OK|汎用処理で解決|`damage, vulnerable`|
|`VOID`|虚無|使用不可。引いた時E1失う。|OK|汎用処理で解決|`unplayable, exhaust`|
|`BOYS_VOID_ARMOR`|虚無の鎧|ターン終了時、ブロックが消えなくなる。|OK|汎用処理で解決|`applyPower`|
|`BOYS_VOID_SLASH`|虚空の断罪|15ダメージを2回。廃棄。|OK|汎用処理で解決|`damage, playCopies, exhaust`|
|`OUT_BUG_BOX`|虫かごの秘密|手札にランダムな「捕獲」済みカードを加える。|OK|追加ロジックあり|`-`|
|`DECAY`|虫歯|使用不可。ターン終了時自分に2ダメージ。|OK|汎用処理で解決|`unplayable`|
|`RIKA_RAINBOW`|虹のプリズム|手札のランダムなカード2枚を強化する。|OK|追加ロジックあり|`-`|
|`OUT_RAINBOW_CHASE`|虹を追いかけて|デッキのランダムなカード5枚を強化する。|OK|追加ロジックあり|`-`|
|`OUT_MOSQUITO_WAR`|蚊との死闘|2ダメージを8回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`KUMO_NO_ITO`|蜘蛛の糸|へろへろ3を与える。|OK|汎用処理で解決|`weak`|
|`KOKUGO_YOMITOKI`|行間を読む|次のターン、エネルギー1を得る。|OK|汎用処理で解決|`nextTurnEnergy`|
|`OUT_STREET_PERFORM`|街頭パフォーマンス|35ゴールドを得る。敵全体をへろへろ2にする。|OK|汎用処理で解決|`gold, weak`|
|`CORPSE_EXPLOSION`|衝撃のうわさ|ドクドク6。たおすと全体に最大HPダメージ。|OK|汎用処理で解決|`poison, applyPower`|
|`SHOCKWAVE`|衝撃波|敵全体にへろへろ3とびくびく3。廃棄。|OK|汎用処理で解決|`weak, vulnerable, exhaust`|
|`CARNAGE`|袋叩き|20ダメージ。|OK|汎用処理で解決|`damage`|
|`ARMAMENTS`|装備点検|ブロック5。手札すべて強化。|OK|汎用処理で解決|`block, upgradeHand`|
|`SENTINEL`|見張り|ブロック5。|OK|汎用処理で解決|`block`|
|`APOTHEOSIS`|覚醒|この戦闘中、全カードを強化。廃棄。|OK|汎用処理で解決|`upgradeDeck, exhaust`|
|`AWAKE_COFFEE`|覚醒のコーヒー|エネルギー2を得る。廃棄。|OK|汎用処理で解決|`energy, exhaust`|
|`OUT_FRIEND_FOREVER`|親友との約束|パートナーの最大HPを20増やし、HPを全回復する。|OK|追加ロジックあり|`-`|
|`KOKUGO_NIKKI`|観察日記|次のターン、カードを2枚引く。|OK|汎用処理で解決|`nextTurnDraw`|
|`KOKUGO_KOTONOHA`|言の葉|ドクドク5を与える。|OK|汎用処理で解決|`poison`|
|`KOKUGO_SAKUBUN`|読書感想文|手札の非攻撃カードをすべて廃棄する。|OK|追加ロジックあり|`promptsExhaust`|
|`KOKUGO_RITOKU`|読解力|次に使うスキルは2回発動する。|OK|追加ロジックあり|`applyPower`|
|`SANSU_LOGIC`|論理パズル|次のターン、カードを1枚追加で引く。|OK|汎用処理で解決|`nextTurnDraw`|
|`PEA_SHOOTER`|豆鉄砲|4ダメージを3回与える。廃棄。|OK|汎用処理で解決|`damage, playCopies, exhaust`|
|`SYAKAI_RICE`|豊作の秋|HPを5回復する。廃棄。|OK|汎用処理で解決|`heal, exhaust`|
|`BOUNTY_PERSIMMON`|豊穣のカキ|次のターン、追加で2枚引く。廃棄。|OK|汎用処理で解決|`nextTurnDraw, exhaust`|
|`CORRUPTION`|賞味期限|スキルコスト0。使用時廃棄。|OK|汎用処理で解決|`applyPower`|
|`BOYS_SOLDIER_HUNT`|賞金稼ぎ|9ダメージ。倒すと20ゴールド。|OK|汎用処理で解決|`damage, gold`|
|`HASHIRE_MELOS`|走れメロス|次ターンE+1。カードを1枚引く。|OK|汎用処理で解決|`nextTurnEnergy, draw`|
|`GOSHI_REVENGE`|走れメロス・ラストスパート|15ダメージ。|OK|汎用処理で解決|`damage`|
|`BOYS_HEAVY_SMASH`|超重力粉砕|50ダメージ。廃棄。|OK|汎用処理で解決|`damage, exhaust`|
|`BOYS_RAILGUN`|超電磁加速砲|24ダメージ。対象のブロックを除去。|要確認|説明文と実装差分の可能性|`damage`|
|`OUT_PARK_SLIDE`|超高速すべり台|35ダメージ。1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`TRIP`|足払い|敵全体にびくびく2を与える。|OK|汎用処理で解決|`vulnerable`|
|`LEG_SWEEP`|足払い|へろへろ2を与える。ブロック11。|OK|汎用処理で解決|`weak, block`|
|`OUT_SOCCER_STREET`|路地のストリートサッカー|8ダメージを4回。1枚引く。|OK|汎用処理で解決|`damage, playCopies, draw`|
|`OUT_STRAY_CAT`|路地裏の野良猫|次に使うアタックを3回発動する。|OK|追加ロジックあり|`-`|
|`PE_VAULTING`|跳び箱10段|18ダメージ。|OK|汎用処理で解決|`damage`|
|`GIRLS_TIARA_SHIELD`|輝くティアラの守り|現在のブロック値を2倍にする。|OK|汎用処理で解決|`doubleBlock`|
|`OUT_HAUNTED_HOUSE`|近所の幽霊屋敷|対象をびくびく6にする。|OK|汎用処理で解決|`vulnerable`|
|`OUT_DOG_BARK`|近所の番犬|敵全体をへろへろ2、びくびく2にする。|OK|汎用処理で解決|`weak, vulnerable`|
|`OUT_STREET_DOG`|迷い犬の恩返し|次の戦闘開始時、エネルギー+3。廃棄。|OK|追加ロジックあり|`exhaust`|
|`BANE`|追い打ち|8ダメージ。ドクドク2を与える。|OK|汎用処理で解決|`damage, poison`|
|`NORMALITY`|退屈|使用不可。手札にある間、3枚までしかカードを使えない。|OK|汎用処理で解決|`unplayable`|
|`BERSERK`|逆ギレ|自分にびくびく2を与える。毎ターンエネルギー1を得る。|OK|汎用処理で解決|`applyPower, vulnerable`|
|`APPARITION`|透明人間|スケスケ(被ダメ1)を得る。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`SKIM`|速読|3枚引く。|OK|汎用処理で解決|`draw`|
|`EVOLVE`|進級|状態異常カードを引いた時、カードを引く。|OK|汎用処理で解決|`applyPower`|
|`JACHI_BOGYAKU`|邪智暴虐|びくびく2を与える。|OK|汎用処理で解決|`vulnerable`|
|`HEAVY_BLADE`|重いバット|14ダメージ。ムキムキ効果3倍。|OK|汎用処理で解決|`damage, strengthScaling`|
|`BOYS_GRAVITY_PRESS`|重力100倍プレス|現在のブロック値の2倍のダメージ。|OK|汎用処理で解決|`damageBasedOnBlock`|
|`RIKA_GRAVITY`|重力の法則|15ダメージ。対象の攻撃力を2下げる。|OK|汎用処理で解決|`damage, strength`|
|`OUT_GOLD_FISH`|金魚すくい|アタックを1枚選ぶ。この戦闘中、それは強化され、0コスト、+6ダメージ、廃棄を得る。|OK|追加ロジックあり|`-`|
|`IMPERVIOUS`|鉄壁|ブロック30を得る。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`IRON_CYPRESS`|鉄壁のヒノキ|ブロックがターン終了時に消えない。|OK|汎用処理で解決|`applyPower`|
|`BOYS_IRON_WALL`|鉄壁の陣|ブロック25。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`IRON_PUMPKIN`|鉄壁カボチャ|ブロック25を得る。廃棄。|OK|汎用処理で解決|`block, exhaust`|
|`PE_HORIZONTAL_BAR`|鉄棒の逆上がり|捨て札からランダムなカードを1枚手札に戻す。|OK|追加ロジックあり|`-`|
|`BOYS_IRON_BLOOD`|鉄血の誓い|HPを失う度、ムキムキ2を得る。|OK|汎用処理で解決|`applyPower`|
|`INFINITE_BLADES`|鉛筆削り|毎ターン手札にえんぴつの削りかすを加える。|OK|汎用処理で解決|`applyPower`|
|`GALAXY_EXPRESS`|銀河鉄道の夜|山札の上から5枚を見る。1枚選び手札に加え、残りを捨てる。|OK|汎用処理で解決|`draw`|
|`ZENITEN_DO`|銭天堂|手札に「やる気スイッチ(コスト0)」を加える。|OK|汎用処理で解決|`addCardToHand`|
|`ALCHEMIZE`|錬金術|ランダムなカード1枚を0コストで手札に加える。|要確認|効果フィールド不足|`-`|
|`KAGAMI_HOSHI`|鏡 (星新一)|手札のカード1枚をコピーして手札に加える。|OK|汎用処理で解決|`promptsCopy`|
|`CLOAK_AND_DAGGER`|隠し芸|ブロック6。えんぴつの削りかす1枚得る。|OK|汎用処理で解決|`block, addCardToHand`|
|`WARCRY`|雄叫び|2枚引き、1枚捨てる。廃棄される。|OK|汎用処理で解決|`draw, promptsDiscard, exhaust`|
|`BATTLE_TRANCE`|集中モード|3枚引く。|OK|汎用処理で解決|`draw`|
|`ACCURACY`|集中力|えんぴつの削りかすのダメージ+4。|OK|汎用処理で解決|`applyPower`|
|`CLEAVE`|雑巾がけ|敵全体に8ダメージ。|OK|汎用処理で解決|`damage`|
|`GIRLS_SNOW_FLAKE`|雪の結晶|敵全体にへろへろ2。ブロック10。|OK|汎用処理で解決|`weak, block`|
|`BOYS_THUNDER_FIST`|雷神の鉄拳|10ダメージ。次のアタックのコスト-1。|OK|汎用処理で解決|`damage`|
|`BOYS_THUNDER_STORM`|雷鳴の轟き|全体に5ダメージを4回。|OK|汎用処理で解決|`damage, playCopies`|
|`BOYS_CYBER_SHIELD`|電磁障壁|ブロック10。カードを1枚引く。|OK|汎用処理で解決|`block, draw`|
|`BOYS_MECHA_DIVE`|電脳世界へのダイブ|カードを3枚引き、1枚捨てる。|OK|汎用処理で解決|`draw, promptsDiscard`|
|`BALL_LIGHTNING`|静電気|7ダメージ。エネルギー1回復。|OK|汎用処理で解決|`damage, energy`|
|`RIKA_ELECTRIC`|静電気ショック|4ダメージ。次ターンエネルギー1。|OK|汎用処理で解決|`damage, nextTurnEnergy`|
|`SANSU_AREA`|面積計算|手札の枚数x3ダメージ。|OK|汎用処理で解決|`damagePerCardInHand`|
|`BOYS_SONIC_WAVE`|音速の波動|全体に8ダメージ。カードを1枚引く。|OK|汎用処理で解決|`damage, draw`|
|`ECHO_BLUEBELL`|響き渡る鈴蘭|敵全体をびくびく2にする。廃棄。|OK|汎用処理で解決|`vulnerable, exhaust`|
|`HEADBUTT`|頭突き|9ダメージ。次ターンの開始時にカードを1枚引く。|OK|汎用処理で解決|`damage, nextTurnDraw`|
|`RIKA_MICROSCOPE`|顕微鏡|敵をびくびく2にする。|OK|汎用処理で解決|`vulnerable`|
|`OUT_BALLOON_POP`|風船割り|全体8ダメージを3回与える。|OK|汎用処理で解決|`damage, playCopies`|
|`FLYING_KNEE`|飛び膝蹴り|8ダメージ。ブロック3。次ターンE+1。|OK|汎用処理で解決|`damage, block, nextTurnEnergy`|
|`GIRLS_CANDY_SHOWER`|飴玉の嵐|全体に3ダメージを3回。|OK|汎用処理で解決|`damage, playCopies`|
|`FRAGRANT_JASMINE`|香華のジャスミン|ターン開始時に追加で2枚引く。|OK|汎用処理で解決|`applyPower`|
|`OUT_DAGASHI_ALL`|駄菓子屋の全買い|60ゴールドを得る。カードを3枚引く。廃棄。|OK|汎用処理で解決|`gold, draw, exhaust`|
|`INJURY`|骨折|使用不可。|OK|汎用処理で解決|`unplayable`|
|`SWEET_CACAO`|魅惑のカカオ|手札を全て捨て、同数引く。廃棄。|要確認|効果フィールド不足; 説明文と実装差分の可能性|`exhaust`|
|`TULIP_DRAW`|魅惑のチューリップ|ターン開始時にカードを1枚引く。|OK|汎用処理で解決|`applyPower`|
|`SANSU_FORMULA`|魔法の方程式|カードを2枚引き、エネルギー1を得る。|OK|汎用処理で解決|`draw, energy`|
|`GIRLS_MAGIC_CIRCLE`|魔法陣の展開|毎ターン開始時、エネルギー1を得る。|OK|汎用処理で解決|`applyPower`|
|`HOLY_GARLIC`|魔除けのニンニク|キラキラ3を得る。廃棄。|OK|汎用処理で解決|`applyPower, exhaust`|
|`OUT_BIRD_WATCH`|鳥になった気分|手札のカードを2枚コピーする。廃棄。|OK|汎用処理で解決|`promptsCopy, exhaust`|
|`TSURU_ONGAESHI`|鶴の恩返し|HPを6失い、2枚引く。|OK|汎用処理で解決|`draw, selfDamage`|
|`GOLDEN_WHEAT`|黄金の小麦|10ダメージ。これで倒すと最大HP+4。廃棄。|OK|汎用処理で解決|`damage, fatalMaxHp, exhaust`|
|`SLIMED`|鼻水|使用すると廃棄される。|要確認|効果フィールド不足|`exhaust`|

## 効果アレンジ提案（被り解消）
- ダメージ単発カード群は「条件付き追加効果（状態異常時+α）」を割り振って役割分担。
- 防御カード群は「即時防御」「次ターン準備」「手札循環」の3カテゴリに再編。
- SHIV/コピー系は、生成枚数だけでなく「生成先（手札/山札/捨て札）」を分ける。
- 同一デバフ値カードは、コスト差に応じて副次効果（ドロー/自己強化）を付与。
- レジェンダリー同士は勝ち筋が重ならないよう、短期火力型と継続成長型に分離。
## 被りカードのアレンジ一覧（提案ベース）
|被りグループ|対象カード|現状の被り|アレンジ案|
|---|---|---|---|
|コスト0化・手札操作系|パニック / 魅惑のカカオ / ゼロの発見|「手札コストを下げる・手札交換」が近く、使い分けが薄い|**パニック**: ランダム1枚0コスト＋へろへろ1（自傷リスク付き） / **魅惑のカカオ**: 手札総入れ替え＋次ターン1ドロー予約 / **ゼロの発見**: そのターンのみ数学カードのコスト-1（テーマ特化）|
|コピー系（単体）|鏡 (星新一) / きてんの窓 / お人形遊び / カンニング / 二刀流 / フォークダンス|「1枚コピー」が多く、クラス差が出にくい|**鏡**: コピー＋同名カードに脆弱付与（リスク） / **きてんの窓**: コピー先をコスト2以上限定で高出力化 / **お人形遊び**: スキル限定コピー / **カンニング**: 攻撃限定コピー / **二刀流**: 攻撃/パワー2枚コピー（現行強化） / **フォークダンス**: コピー後に1枚捨てる（循環型）|
|ブロック+ドロー系|かいけつゾロリ / 側転 / 電脳世界へのダイブ / 秘密の近道|「引いて捨てる」挙動が集中|**かいけつゾロリ**: 3ドロー1捨て＋次ターンブロック3 / **側転**: 2ドロー1捨て＋回避(1回軽減) / **電脳世界へのダイブ**: 3ドロー1捨て＋ランダム1枚0コスト化 / **秘密の近道**: ドローなし、山札高コスト限定サーチ特化|
|全体多段ダメージ系|一寸法師 / 縄跳び / 飴玉の嵐 / ブーメラン|多段回数と対象違いのみで体験が似る|**一寸法師**: ヒット毎に自ブロック+1 / **縄跳び**: ヒット毎に自傷1（高火力化） / **飴玉の嵐**: ヒット毎に確率で弱体付与 / **ブーメラン**: ランダム対象だが撃破時に追加ヒット|
|びくびく(脆弱)付与系|顕微鏡 / キラキラの粉 / 足払い / 邪智暴虐|付与値中心で差分が小さい|**顕微鏡**: 単体びくびく2＋次ターン情報表示(意図可視化) / **キラキラの粉**: 全体びくびく1 / **足払い**: 全体びくびく2＋自己ブロック小 / **邪智暴虐**: びくびく付与時に追加1ドロー|
|ムキムキ獲得系|やる気スイッチ / マッスル・ビルド / 応援合戦 / 山月記|「筋力上昇」主体でデッキ内の役割競合|**やる気スイッチ**: 即時筋力+2（基本） / **マッスル・ビルド**: 筋力+1＋毎ターン+1（継続） / **応援合戦**: 自身+1＆味方(パートナー)+1 / **山月記**: 低HP時のみ追加+2（逆転札）|
|エナジー獲得系|覚醒のコーヒー / 産業革命 / 興奮|即時E増加カードが競合|**覚醒のコーヒー**: E+2だが次ターンドロー-1 / **産業革命**: E+1＋カード1枚生成（工業テーマ） / **興奮**: E+2のみ（最速）で廃棄固定|
|無敵・軽減系|柳に風 / 透明人間 / 忍法・隠れ身|被ダメ軽減の継続ターン違いだけになりがち|**柳に風**: 1ターン無敵＋1ドロー / **透明人間**: 2ターン被ダメ-1固定 / **忍法・隠れ身**: 1ターン無敵＋次攻撃2倍（奇襲）|
|パワー永続ドロー系|魅惑のチューリップ / 万葉の歌 / 満天の星空|ターン開始ドロー系が集中|**魅惑のチューリップ**: 開始時1ドロー / **万葉の歌**: 2ターン限定2ドロー / **満天の星空**: 毎ターンドロー+1だが初動コスト重め|
|ブロック大型単発系|メロスの信実 / かまくら / バリア|防御値近傍で置換されやすい|**メロスの信実**: ブロック＋次ターンE+1 / **かまくら**: ブロック値最大、廃棄 / **バリア**: ブロック中量＋状態異常1枚無効|
|状態異常カード群|ケガ / やけど / 腹痛 / 後悔 / 不安 / 恥 / 退屈 / 骨折 / 鼻水 など|デメリット差が見えづらい|状態異常を3系統に再定義：**即時痛み型**(自傷) / **手札阻害型**(コスト増・使用不可) / **山札汚染型**(ドロー阻害)。アイコン色を系統別に統一|

### 実装優先度の目安
1. **高優先**: コスト0化・コピー系・エナジー系（ゲームテンポに直結）
2. **中優先**: びくびく付与・全体多段ダメージ系（体験差に直結）
3. **低優先**: 状態異常の再ラベリング（UI改修を伴うため）


## 実装着手順（高/中/低の順で開始）
以下の順番で実装を開始する。

### 1) 高優先（今スプリントで着手）
- [x] **コスト0化・手札操作系**: `パニック / 魅惑のカカオ / ゼロの発見` の役割分離を初期実装（VS/P2P）。
- [x] **コピー系（単体）**: `鏡 (星新一) / きてんの窓 / お人形遊び / カンニング / 二刀流 / フォークダンス` のコピー対象制限を初期実装（VS/P2P）。
- [x] **エナジー獲得系**: `覚醒のコーヒー / 産業革命 / 興奮` のテンポ差を初期実装（VS/P2P、興奮は基準挙動据え置き）。

### 2) 中優先（高優先完了後）
- [x] **びくびく付与系**: `顕微鏡 / キラキラの粉 / 足払い / 邪智暴虐` の副次効果を初期実装（VS/P2P）。
- [x] **全体多段ダメージ系**: `一寸法師 / 縄跳び / 飴玉の嵐 / ブーメラン` の差別化を初期実装（VS/P2P）。
- [x] **ブロック+ドロー系**: `かいけつゾロリ / 側転 / 電脳世界へのダイブ / 秘密の近道` を初期実装（VS/P2P）。

### 3) 低優先（UI/データ整理とセットで対応）
- [x] **状態異常再ラベリング**: 即時痛み型 / 手札阻害型 / 山札汚染型をカード表示に反映（基本カテゴリ）。
- [x] 状態異常アイコン色と説明文テンプレートの統一（カテゴリ別カラー + 先頭ラベル化）。
- [x] 既存カード説明文の一括更新（低優先対象: 状態異常/呪いカードの表記統一）。

### 実装開始ルール
1. 先に**高優先3カテゴリ**のカードを実装し、対象カードの `実装判定` を `OK` に更新する。
2. 次に**中優先3カテゴリ**へ進み、各カテゴリ完了ごとにこの監査ドキュメントを更新する。
3. **低優先**は UI 文言・アイコン更新と同じPRでまとめて実施する。

### 適用モード確認
- [x] VSモード (`VSBattleScene`) に反映済み
- [x] P2P VSモード (`P2PVSBattleScene`) に反映済み
- [x] メインモード (`cardEffectLogic` の追加ロジック) に反映済み
