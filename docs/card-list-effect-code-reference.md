# 学習ローグ カード一覧と効果コード確認表

作成日: 2026-07-04

効果文と実際に動作する効果フィールドの差異を潰すための確認表。ソース上のカード定義から生成し、名称分岐の特殊処理が検出できるものは効果コード欄に併記しています。

## 集計

- 対象カード総数: **776**
- マジック編: 51
- 高校編: 112
- 呪い: 10
- 小学生編: 548
- 小学生編/菜園: 50
- 状態異常: 5

## 見方

- `効果文`: カード定義の `description`。
- `動作している効果コード`: 汎用カード処理が読む主なフィールド、または名称/ID分岐で動く特殊処理。
- `効果フィールドなし`: 表示・状態カード・特殊カードなど、カード定義上に直接の数値効果がないもの。

|分類|ID|カード名|コスト|種別|対象|効果文|動作している効果コード|
|---|---|---|---:|---|---|---|---|
|マジック編|MAGIC_MINATO_1|アクア・リッパー|1|ATTACK|ENEMY|13ダメージ。HPを3回復。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。|damage=13; heal=3|
|マジック編|MAGIC_ELLIOT_1|アストラル・ランサー|1|ATTACK|ENEMY|20ダメージ。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。|damage=20|
|マジック編|MAGIC_SOMA_2|アブソリュート・プロトコル|1|SKILL|SELF|ブロック18。<br>専用ルール: 第二手。第一手の次に使うと計画が2段階目へ進む。先に使うとリセット。|block=18|
|マジック編|MAGIC_SAKUYA_1|エクリプス・エッジ|1|ATTACK|ENEMY|16ダメージ。ドクドク4。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。|damage=16; poison=4|
|マジック編|MAGIC_KOHARU_3|エメラルド・ウィンドベル|1|POWER|SELF|カードを2枚引く。状態異常カードを引いた時、カードを1枚引く。廃棄。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。|draw=2; exhaust=true; applyPower={id:"EVOLVE",amount:1}|
|マジック編|MAGIC_SERA_3|エンジェル・スターブート|1|POWER|SELF|カードを2枚引く。生成カードを強化する。廃棄。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。|draw=2; exhaust=true; applyPower={id:"MASTER_REALITY",amount:1}|
|マジック編|MAGIC_SAKUYA_2|オブシディアン・チェイン|1|SKILL|ALL_ENEMIES|敵全体をへろへろ2にする。ブロック9。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。|block=9; weak=2|
|マジック編|MAGIC_LEON_3|グランド・ノクターン|1|POWER|ALL_ENEMIES|敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|damage=6; exhaust=true; applyPower={id:"THOUSAND_CUTS",amount:1}|
|マジック編|MAGIC_REI_3|クリムゾン・ナイトシール|1|POWER|ALL_ENEMIES|敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。|poison=4; exhaust=true; applyPower={id:"ENVENOM",amount:1}|
|マジック編|MAGIC_YAMATO_1|クリムゾン・ナックル|1|ATTACK|ENEMY|23ダメージ。自分に2ダメージ。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。|damage=23; selfDamage=2|
|マジック編|MAGIC_SOMA_1|グレイシャル・ヴァーディクト|1|ATTACK|ENEMY|15ダメージ。びくびく2。<br>専用ルール: 第一手。最初に使うと計画が1段階進む。|damage=15; vulnerable=2|
|マジック編|MAGIC_MADOKA_1|クロック・スパークループ|1|ATTACK|ENEMY|12ダメージ。カードを2枚引く。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。|damage=12; draw=2|
|マジック編|MAGIC_RIKU_1|クロノ・アーク|1|ATTACK|ENEMY|12ダメージ。カードを2枚引く。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。|damage=12; draw=2|
|マジック編|MAGIC_REN_1|ゲイル・セイバー|1|ATTACK|ENEMY|16ダメージ。カードを1枚引く。<br>専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。|damage=16; draw=1|
|マジック編|MAGIC_KOHARU_1|ゲイル・リーフアロー|1|ATTACK|ENEMY|8ダメージを3回与える。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。|damage=8; playCopies=2|
|マジック編|MAGIC_AKARI_2|コメット・ハグシールド|1|SKILL|SELF|ブロック14。カードを1枚引く。<br>専用ルール: スキル枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。|block=14; draw=1|
|マジック編|MAGIC_REI_2|シャドウ・チャームバインド|1|SKILL|ALL_ENEMIES|敵全体をへろへろ2にする。ブロック8。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。|block=8; weak=2|
|マジック編|MAGIC_KOHARU_2|シルフィ・スキップガード|1|SKILL|SELF|ブロック12。カードを2枚引く。<br>専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。|block=12; draw=2|
|マジック編|MAGIC_AKARI_1|スターリィ・ブレイザー|1|ATTACK|ENEMY|18ダメージ。<br>専用ルール: 攻撃枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。|damage=18|
|マジック編|MAGIC_MINATO_2|セラフィック・スプリング|1|SKILL|SELF|HPを9回復。カードを1枚引く。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。|draw=1; heal=9|
|マジック編|MAGIC_SERA_1|セレスティア・ライトノヴァ|1|ATTACK|ENEMY|20ダメージ。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。|damage=20|
|マジック編|MAGIC_ELLIOT_2|セレスティアル・アーカイブ|1|SKILL|SELF|ブロック12。HPを5回復。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。|block=12; heal=5|
|マジック編|MAGIC_LEON_1|ソニック・ミラージュ|1|ATTACK|ALL_ENEMIES|敵全体に10ダメージ。へろへろ1。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|damage=10; weak=1|
|マジック編|MAGIC_MADOKA_2|タイム・キャンディリロード|1|SKILL|SELF|ブロック10。エナジー1を得る。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。|block=10; energy=1|
|マジック編|MAGIC_REN_2|テンペスト・イージス|1|SKILL|SELF|ブロック15。カードを1枚引く。<br>専用ルール: 蒼風護陣を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反撃が発動する。|block=15; draw=1|
|マジック編|MAGIC_MIRAI_1|ドリーミィ・ステージビート|1|ATTACK|ALL_ENEMIES|敵全体に9ダメージ。へろへろ1。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|damage=9; weak=1|
|マジック編|MAGIC_MADOKA_3|トワイライト・クロノコード|2|POWER|SELF|毎ターン最初のカードを2回発動する。廃棄。<br>専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。|exhaust=true; applyPower={id:"ECHO_FORM",amount:1}|
|マジック編|MAGIC_REI_1|ノワール・ルーンエッジ|1|ATTACK|ENEMY|15ダメージ。対象にドクドク5。<br>専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。|damage=15; poison=5|
|マジック編|MAGIC_HIYORI_3|ハートフル・ブルーム|2|POWER|SELF|カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。<br>専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。|draw=1; exhaust=true; applyPower={id:"DRAW_POWER",amount:1}|
|マジック編|MAGIC_TSUBASA_3|バーニング・ハートギア|2|POWER|SELF|毎ターンエナジー1を得る。廃棄。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。|exhaust=true; applyPower={id:"BERSERK_POWER",amount:1}|
|マジック編|MAGIC_MIRAI_3|ファンシー・ドリームショー|1|POWER|ALL_ENEMIES|敵全体に6ダメージ。カード使用時、敵全体に1ダメージ。廃棄。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|damage=6; exhaust=true; applyPower={id:"THOUSAND_CUTS",amount:1}|
|マジック編|MAGIC_LEON_2|ファントム・ステージ|1|SKILL|SELF|ブロック10。カードを2枚引く。<br>専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|block=10; draw=2|
|マジック編|MAGIC_MIRAI_2|プチナイトメア・アンコール|1|SKILL|SELF|カードを3枚引き、エナジー1を得る。<br>専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。|draw=3; energy=1|
|マジック編|MAGIC_HIYORI_1|ブルーム・ペタルショット|1|ATTACK|ALL_ENEMIES|敵全体に10ダメージ。<br>専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。|damage=10|
|マジック編|MAGIC_TSUBASA_2|フレア・アクセル|1|SKILL|SELF|エナジー1を得る。カードを1枚引く。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。|draw=1; energy=1|
|マジック編|MAGIC_TSUBASA_1|ブレイズ・ハンマースター|1|ATTACK|ENEMY|22ダメージ。自分に2ダメージ。<br>専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。|damage=22; selfDamage=2|
|マジック編|MAGIC_YAMATO_2|ブレイズ・ブルワーク|1|SKILL|SELF|ブロック13。ムキムキ1。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。|block=13; strength=1|
|マジック編|MAGIC_HIYORI_2|フローラル・メディカ|1|SKILL|SELF|HPを8回復。カードを1枚引く。<br>専用ルール: 命花壇を1段階進め、追加でHPを2回復する。3回目の専用カード使用後に収穫が発動する。|draw=1; heal=8|
|マジック編|MAGIC_SERA_2|ホーリー・シュガーコード|1|SKILL|SELF|ブロック10。HPを6回復。<br>専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。|block=10; heal=6|
|マジック編|MAGIC_AKARI_3|ミラクル・スターリンク|1|POWER|SELF|ブロック6。カード使用時、ブロック1を得る。廃棄。<br>専用ルール: パワー枠を埋める。攻撃・スキル・パワーが揃うと完成効果が発動する。|block=6; exhaust=true; applyPower={id:"AFTER_IMAGE",amount:1}|
|マジック編|MAGIC_SHIZUKU_2|ムーンリボン・ガード|1|SKILL|SELF|ブロック16。<br>専用ルール: 月鏡を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反射が発動する。|block=16|
|マジック編|MAGIC_RIKU_2|リワインド・ウォード|1|SKILL|SELF|ブロック11。エナジー1を得る。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。|block=11; energy=1|
|マジック編|MAGIC_SHIZUKU_1|ルナミラー・スラッシュ|1|ATTACK|ENEMY|14ダメージ。対象をびくびく2にする。<br>専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。|damage=14; vulnerable=2|
|マジック編|MAGIC_SHIZUKU_3|ルミナス・リフレクト|2|POWER|SELF|ブロック8。ターン終了時、ブロック5を得る。廃棄。<br>専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。|block=8; exhaust=true; applyPower={id:"METALLICIZE",amount:5}|
|マジック編|MAGIC_RIKU_3|運命選択・フォーチュンセレクター|2|POWER|SELF|毎ターン最初のカードを2回発動する。廃棄。<br>専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。|exhaust=true; applyPower={id:"ECHO_FORM",amount:1}|
|マジック編|MAGIC_YAMATO_3|獄炎獅子王撃|2|POWER|SELF|毎ターンエナジー1を得る。廃棄。<br>専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。|exhaust=true; applyPower={id:"BERSERK_POWER",amount:1}|
|マジック編|MAGIC_SAKUYA_3|常夜零式封印|1|POWER|ALL_ENEMIES|敵全体にドクドク4。攻撃時、ドクドク1を付与する。廃棄。<br>専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。|poison=4; exhaust=true; applyPower={id:"ENVENOM",amount:1}|
|マジック編|MAGIC_ELLIOT_3|世界門審判・ワールドゲート|1|POWER|SELF|カードを2枚引く。生成カードを強化する。廃棄。<br>専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。|draw=2; exhaust=true; applyPower={id:"MASTER_REALITY",amount:1}|
|マジック編|MAGIC_MINATO_3|蒼海神リヴァイア・グレイス|2|POWER|SELF|カードを1枚引く。ターン開始時、カードを1枚追加で引く。廃棄。<br>専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。|draw=1; exhaust=true; applyPower={id:"DRAW_POWER",amount:1}|
|マジック編|MAGIC_REN_3|蒼龍天翔破|1|POWER|SELF|ブロック6。カード使用時、ブロック1を得る。廃棄。<br>専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。|block=6; exhaust=true; applyPower={id:"AFTER_IMAGE",amount:1}|
|マジック編|MAGIC_SOMA_3|氷律絶界|2|POWER|SELF|ブロック8。ターン終了時、ブロック6を得る。廃棄。<br>専用ルール: 最終手。第二手の次に使うと完成効果が発動する。先に使うとリセット。|block=8; exhaust=true; applyPower={id:"METALLICIZE",amount:6}|
|高校編|HS_STARTER_THROW|サイドスロー|1|ATTACK|ENEMY|9ダメージ。1枚引き、1枚捨てる。|damage=9; draw=1; promptsDiscard=1|
|高校編|HS_STARTER_STEP|ステップイン|1|ATTACK|ENEMY|5ダメージ。ブロック6。|damage=5; block=6|
|高校編|HS_FAMILIAR_050|ネオン蛇ネイラの契約|1|SUMMON|SELF|HPを5消費してネオン蛇ネイラを召喚。毎ターン終了時、敵全体にびくびく3。廃棄。|exhaust=true; familiarSummon={id:"fam-50",name:"ネオン蛇ネイラ",hpCost:5,imageIndex:50,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"VULNERABLE",amount:3}}; familiarSummon={id:"fam-50",name:"ネオン蛇ネイラ",hpCost:5,imageIndex:50,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"VULNERABLE",amount:3}}|
|高校編|HS_STARTER_FAINT|フェイントレポート|0|ATTACK|ENEMY|4ダメージ。対象にへろへろ1。|damage=4; weak=1|
|高校編|HS_STARTER_EDGE|ペンブレード|1|ATTACK|ENEMY|7ダメージを与える。|damage=7|
|高校編|HS_FAMILIAR_069|雨衣ゴーストの契約|1|SUMMON|SELF|HPを3消費して雨衣ゴーストを召喚。ブロック0ならターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-69",name:"雨衣ゴースト",hpCost:3,imageIndex:69,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}; familiarSummon={id:"fam-69",name:"雨衣ゴースト",hpCost:3,imageIndex:69,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}|
|高校編|HS_FAMILIAR_092|雨狐アンブレラの契約|2|SUMMON|SELF|HPを5消費して雨狐アンブレラを召喚。2ターンに1回、敵全体にびくびく3。廃棄。|exhaust=true; familiarSummon={id:"fam-92",name:"雨狐アンブレラ",hpCost:5,imageIndex:92,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"VULNERABLE",amount:3}}; familiarSummon={id:"fam-92",name:"雨狐アンブレラ",hpCost:5,imageIndex:92,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"VULNERABLE",amount:3}}|
|高校編|HS_FAMILIAR_031|影馬ケンタウロの契約|3|SUMMON|SELF|HPを4消費して影馬ケンタウロを召喚。このターン終了時に一度だけ、HPを14回復。廃棄。|exhaust=true; familiarSummon={id:"fam-31",name:"影馬ケンタウロ",hpCost:4,imageIndex:31,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"HEAL",amount:14}}; familiarSummon={id:"fam-31",name:"影馬ケンタウロ",hpCost:4,imageIndex:31,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"HEAL",amount:14}}|
|高校編|HS_FAMILIAR_085|王虎ビャッコの契約|1|SUMMON|SELF|HPを4消費して王虎ビャッコを召喚。毎ターン終了時、敵全体に16ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-85",name:"王虎ビャッコ",hpCost:4,imageIndex:85,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_DAMAGE",amount:16}}; familiarSummon={id:"fam-85",name:"王虎ビャッコ",hpCost:4,imageIndex:85,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_DAMAGE",amount:16}}|
|高校編|HS_FAMILIAR_067|黄金仮面ゴーレムの契約|1|SUMMON|SELF|HPを4消費して黄金仮面ゴーレムを召喚。2ターンに1回、ランダムな敵に1ダメージを25回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-67",name:"黄金仮面ゴーレム",hpCost:4,imageIndex:67,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"RANDOM_HITS",amount:25}}; familiarSummon={id:"fam-67",name:"黄金仮面ゴーレム",hpCost:4,imageIndex:67,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"RANDOM_HITS",amount:25}}|
|高校編|HS_FAMILIAR_051|黄昏フェニクスの契約|3|SUMMON|SELF|HPを3消費して黄昏フェニクスを召喚。このターン終了時に一度だけ、ムキムキ+4。廃棄。|exhaust=true; familiarSummon={id:"fam-51",name:"黄昏フェニクス",hpCost:3,imageIndex:51,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"STRENGTH",amount:4}}; familiarSummon={id:"fam-51",name:"黄昏フェニクス",hpCost:3,imageIndex:51,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"STRENGTH",amount:4}}|
|高校編|HS_FAMILIAR_061|化狸ブローカーの契約|3|SUMMON|SELF|HPを4消費して化狸ブローカーを召喚。このターン終了時に一度だけ、次ターンのエナジー+4。廃棄。|exhaust=true; familiarSummon={id:"fam-61",name:"化狸ブローカー",hpCost:4,imageIndex:61,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"ENERGY_NEXT",amount:4}}; familiarSummon={id:"fam-61",name:"化狸ブローカー",hpCost:4,imageIndex:61,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"ENERGY_NEXT",amount:4}}|
|高校編|HS_FAMILIAR_018|仮面詩神ミューズの契約|1|SUMMON|SELF|HPを3消費して仮面詩神ミューズを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを2枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-18",name:"仮面詩神ミューズ",hpCost:3,imageIndex:18,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DRAW",amount:2}}; familiarSummon={id:"fam-18",name:"仮面詩神ミューズ",hpCost:3,imageIndex:18,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DRAW",amount:2}}|
|高校編|HS_FAMILIAR_087|仮面雷神ドラムの契約|1|SUMMON|SELF|HPを3消費して仮面雷神ドラムを召喚。2ターンに1回、HPを16回復。廃棄。|exhaust=true; familiarSummon={id:"fam-87",name:"仮面雷神ドラム",hpCost:3,imageIndex:87,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"HEAL",amount:16}}; familiarSummon={id:"fam-87",name:"仮面雷神ドラム",hpCost:3,imageIndex:87,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"HEAL",amount:16}}|
|高校編|HS_FAMILIAR_009|蛾天使モルフォの契約|1|SUMMON|SELF|HPを3消費して蛾天使モルフォを召喚。ブロック0ならターン終了時、ムキムキ+2。廃棄。|exhaust=true; familiarSummon={id:"fam-9",name:"蛾天使モルフォ",hpCost:3,imageIndex:9,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"STRENGTH",amount:2}}; familiarSummon={id:"fam-9",name:"蛾天使モルフォ",hpCost:3,imageIndex:9,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"STRENGTH",amount:2}}|
|高校編|HS_FAMILIAR_008|海月巫女ルミナの契約|2|SUMMON|SELF|HPを5消費して海月巫女ルミナを召喚。HPが半分以下ならターン終了時、敵全体にびくびく2。廃棄。|exhaust=true; familiarSummon={id:"fam-8",name:"海月巫女ルミナ",hpCost:5,imageIndex:8,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"VULNERABLE",amount:2}}; familiarSummon={id:"fam-8",name:"海月巫女ルミナ",hpCost:5,imageIndex:8,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"VULNERABLE",amount:2}}|
|高校編|HS_FAMILIAR_068|灰樹アッシュの契約|2|SUMMON|SELF|HPを5消費して灰樹アッシュを召喚。HPが半分以下ならターン終了時、敵全体にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-68",name:"灰樹アッシュ",hpCost:5,imageIndex:68,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"AOE_POISON",amount:8}}; familiarSummon={id:"fam-68",name:"灰樹アッシュ",hpCost:5,imageIndex:68,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"AOE_POISON",amount:8}}|
|高校編|HS_FAMILIAR_005|鬼面カグラの契約|1|SUMMON|SELF|HPを5消費して鬼面カグラを召喚。毎ターン終了時、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-5",name:"鬼面カグラ",hpCost:5,imageIndex:5,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}; familiarSummon={id:"fam-5",name:"鬼面カグラ",hpCost:5,imageIndex:5,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}|
|高校編|HS_FAMILIAR_021|鏡女王ミラの契約|3|SUMMON|SELF|HPを3消費して鏡女王ミラを召喚。このターン終了時に一度だけ、敵全体にへろへろ3。廃棄。|exhaust=true; familiarSummon={id:"fam-21",name:"鏡女王ミラ",hpCost:3,imageIndex:21,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"WEAK",amount:3}}; familiarSummon={id:"fam-21",name:"鏡女王ミラ",hpCost:3,imageIndex:21,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"WEAK",amount:3}}|
|高校編|HS_FAMILIAR_098|鏡鳥ハーピィの契約|1|SUMMON|SELF|HPを5消費して鏡鳥ハーピィを召喚。HPが半分以下ならターン終了時、ランダムな敵に30ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-98",name:"鏡鳥ハーピィ",hpCost:5,imageIndex:98,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DAMAGE",amount:30}}; familiarSummon={id:"fam-98",name:"鏡鳥ハーピィ",hpCost:5,imageIndex:98,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DAMAGE",amount:30}}|
|高校編|HS_FAMILIAR_000|暁狐アルカの契約|2|SUMMON|SELF|HPを3消費して暁狐アルカを召喚。毎ターン終了時、ランダムな敵に16ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-0",name:"暁狐アルカ",hpCost:3,imageIndex:0,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DAMAGE",amount:16}}; familiarSummon={id:"fam-0",name:"暁狐アルカ",hpCost:3,imageIndex:0,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DAMAGE",amount:16}}|
|高校編|HS_FAMILIAR_077|極光サーペントの契約|1|SUMMON|SELF|HPを5消費して極光サーペントを召喚。2ターンに1回、敵全体にへろへろ3。廃棄。|exhaust=true; familiarSummon={id:"fam-77",name:"極光サーペント",hpCost:5,imageIndex:77,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"WEAK",amount:3}}; familiarSummon={id:"fam-77",name:"極光サーペント",hpCost:5,imageIndex:77,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"WEAK",amount:3}}|
|高校編|HS_FAMILIAR_011|錦蛇コハクの契約|3|SUMMON|SELF|HPを5消費して錦蛇コハクを召喚。このターン終了時に一度だけ、ランダムな敵に1ダメージを28回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-11",name:"錦蛇コハク",hpCost:5,imageIndex:11,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"RANDOM_HITS",amount:28}}; familiarSummon={id:"fam-11",name:"錦蛇コハク",hpCost:5,imageIndex:11,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"RANDOM_HITS",amount:28}}|
|高校編|HS_STARTER_PREP|禁書の栞|1|SKILL|SELF|ブロック7。1枚引き、1枚捨てる。|block=7; draw=1; promptsDiscard=1|
|高校編|HS_FAMILIAR_097|禁書梟オウルの契約|1|SUMMON|SELF|HPを4消費して禁書梟オウルを召喚。2ターンに1回、次ターン開始時にカードを4枚引き、ムキムキ+4、次ターンのエナジー+3。廃棄。|exhaust=true; familiarSummon={id:"fam-97",name:"禁書梟オウル",hpCost:4,imageIndex:97,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"CHAOS_SURGE",amount:4}}; familiarSummon={id:"fam-97",name:"禁書梟オウル",hpCost:4,imageIndex:97,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"CHAOS_SURGE",amount:4}}|
|高校編|HS_FAMILIAR_059|銀蛾シスターの契約|1|SUMMON|SELF|HPを5消費して銀蛾シスターを召喚。ブロック0ならターン終了時、HPを13回復。廃棄。|exhaust=true; familiarSummon={id:"fam-59",name:"銀蛾シスター",hpCost:5,imageIndex:59,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"HEAL",amount:13}}; familiarSummon={id:"fam-59",name:"銀蛾シスター",hpCost:5,imageIndex:59,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"HEAL",amount:13}}|
|高校編|HS_FAMILIAR_074|銀狐モンクの契約|1|SUMMON|SELF|HPを5消費して銀狐モンクを召喚。ブロック0ならターン終了時、次ターン開始時にカードを3枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-74",name:"銀狐モンク",hpCost:5,imageIndex:74,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DRAW",amount:3}}; familiarSummon={id:"fam-74",name:"銀狐モンク",hpCost:5,imageIndex:74,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DRAW",amount:3}}|
|高校編|HS_FAMILIAR_010|九尾シグレの契約|1|SUMMON|SELF|HPを4消費して九尾シグレを召喚。毎ターン終了時、ゴールド22を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-10",name:"九尾シグレ",hpCost:4,imageIndex:10,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"GOLD",amount:22}}; familiarSummon={id:"fam-10",name:"九尾シグレ",hpCost:4,imageIndex:10,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"GOLD",amount:22}}|
|高校編|HS_FAMILIAR_088|月影ワーウルフの契約|2|SUMMON|SELF|HPを4消費して月影ワーウルフを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを3枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-88",name:"月影ワーウルフ",hpCost:4,imageIndex:88,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DRAW",amount:3}}; familiarSummon={id:"fam-88",name:"月影ワーウルフ",hpCost:4,imageIndex:88,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DRAW",amount:3}}|
|高校編|HS_FAMILIAR_004|月兎ミカヅキの契約|2|SUMMON|SELF|HPを4消費して月兎ミカヅキを召喚。ブロック0ならターン終了時、次ターン開始時にカードを2枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-4",name:"月兎ミカヅキ",hpCost:4,imageIndex:4,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DRAW",amount:2}}; familiarSummon={id:"fam-4",name:"月兎ミカヅキ",hpCost:4,imageIndex:4,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DRAW",amount:2}}|
|高校編|HS_FAMILIAR_041|月狼ルーナの契約|3|SUMMON|SELF|HPを5消費して月狼ルーナを召喚。このターン終了時に一度だけ、次ターン開始時にカードを4枚引き、ムキムキ+4、次ターンのエナジー+3。廃棄。|exhaust=true; familiarSummon={id:"fam-41",name:"月狼ルーナ",hpCost:5,imageIndex:41,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"CHAOS_SURGE",amount:4}}; familiarSummon={id:"fam-41",name:"月狼ルーナ",hpCost:5,imageIndex:41,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"CHAOS_SURGE",amount:4}}|
|高校編|HS_FAMILIAR_003|虎神ラセツの契約|1|SUMMON|SELF|HPを3消費して虎神ラセツを召喚。HPが半分以下ならターン終了時、HPを10回復。廃棄。|exhaust=true; familiarSummon={id:"fam-3",name:"虎神ラセツ",hpCost:3,imageIndex:3,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"HEAL",amount:10}}; familiarSummon={id:"fam-3",name:"虎神ラセツ",hpCost:3,imageIndex:3,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"HEAL",amount:10}}|
|高校編|HS_FAMILIAR_007|幸運猫ノワールの契約|1|SUMMON|SELF|HPを4消費して幸運猫ノワールを召喚。2ターンに1回、敵全体にへろへろ2。廃棄。|exhaust=true; familiarSummon={id:"fam-7",name:"幸運猫ノワール",hpCost:4,imageIndex:7,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"WEAK",amount:2}}; familiarSummon={id:"fam-7",name:"幸運猫ノワール",hpCost:4,imageIndex:7,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"WEAK",amount:2}}|
|高校編|HS_STARTER_BREAK|校章ブレイク|2|ATTACK|ENEMY|9ダメージ。対象にびくびく2。|damage=9; vulnerable=2|
|高校編|HS_FAMILIAR_027|紅傘アマネの契約|1|SUMMON|SELF|HPを3消費して紅傘アマネを召喚。2ターンに1回、次ターン開始時にカードを2枚引き、ムキムキ+2、次ターンのエナジー+1。廃棄。|exhaust=true; familiarSummon={id:"fam-27",name:"紅傘アマネ",hpCost:3,imageIndex:27,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"CHAOS_SURGE",amount:2}}; familiarSummon={id:"fam-27",name:"紅傘アマネ",hpCost:3,imageIndex:27,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"CHAOS_SURGE",amount:2}}|
|高校編|HS_FAMILIAR_063|紅槍ヴァルキュリアの契約|1|SUMMON|SELF|HPを3消費して紅槍ヴァルキュリアを召喚。HPが半分以下ならターン終了時、敵全体にへろへろ3。廃棄。|exhaust=true; familiarSummon={id:"fam-63",name:"紅槍ヴァルキュリア",hpCost:3,imageIndex:63,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"WEAK",amount:3}}; familiarSummon={id:"fam-63",name:"紅槍ヴァルキュリア",hpCost:3,imageIndex:63,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"WEAK",amount:3}}|
|高校編|HS_FAMILIAR_081|紅天狗バイカーの契約|3|SUMMON|SELF|HPを3消費して紅天狗バイカーを召喚。このターン終了時に一度だけ、ランダムな敵に1ダメージを43回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-81",name:"紅天狗バイカー",hpCost:3,imageIndex:81,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"RANDOM_HITS",amount:43}}; familiarSummon={id:"fam-81",name:"紅天狗バイカー",hpCost:3,imageIndex:81,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"RANDOM_HITS",amount:43}}|
|高校編|HS_FAMILIAR_055|紅蟷螂マンティスの契約|1|SUMMON|SELF|HPを4消費して紅蟷螂マンティスを召喚。毎ターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-55",name:"紅蟷螂マンティス",hpCost:4,imageIndex:55,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}; familiarSummon={id:"fam-55",name:"紅蟷螂マンティス",hpCost:4,imageIndex:55,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}|
|高校編|HS_STARTER_BIND|黒リボン拘束|1|SKILL|ALL_ENEMIES|敵全体にびくびく1。ブロック3。|block=3; vulnerable=1|
|高校編|HS_FAMILIAR_002|黒羽クロウリーの契約|1|SUMMON|SELF|HPを5消費して黒羽クロウリーを召喚。2ターンに1回、ブロック15。廃棄。|exhaust=true; familiarSummon={id:"fam-2",name:"黒羽クロウリー",hpCost:5,imageIndex:2,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"BLOCK",amount:15}}; familiarSummon={id:"fam-2",name:"黒羽クロウリー",hpCost:5,imageIndex:2,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"BLOCK",amount:15}}|
|高校編|HS_FAMILIAR_038|黒角ユニコの契約|1|SUMMON|SELF|HPを5消費して黒角ユニコを召喚。HPが半分以下ならターン終了時、ゴールド28を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-38",name:"黒角ユニコ",hpCost:5,imageIndex:38,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"GOLD",amount:28}}; familiarSummon={id:"fam-38",name:"黒角ユニコ",hpCost:5,imageIndex:38,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"GOLD",amount:28}}|
|高校編|HS_FAMILIAR_096|黒天馬ノクスの契約|3|SUMMON|SELF|HPを3消費して黒天馬ノクスを召喚。このターン終了時に一度だけ、敵全体にドクドク16。廃棄。|exhaust=true; familiarSummon={id:"fam-96",name:"黒天馬ノクス",hpCost:3,imageIndex:96,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_POISON",amount:16}}; familiarSummon={id:"fam-96",name:"黒天馬ノクス",hpCost:3,imageIndex:96,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_POISON",amount:16}}|
|高校編|HS_FAMILIAR_076|黒板クラーケンの契約|3|SUMMON|SELF|HPを4消費して黒板クラーケンを召喚。このターン終了時に一度だけ、ランダムな敵にドクドク17。廃棄。|exhaust=true; familiarSummon={id:"fam-76",name:"黒板クラーケン",hpCost:4,imageIndex:76,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"POISON",amount:17}}; familiarSummon={id:"fam-76",name:"黒板クラーケン",hpCost:4,imageIndex:76,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"POISON",amount:17}}|
|高校編|HS_FAMILIAR_071|黒曜シャークの契約|3|SUMMON|SELF|HPを5消費して黒曜シャークを召喚。このターン終了時に一度だけ、敵全体に18ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-71",name:"黒曜シャーク",hpCost:5,imageIndex:71,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_DAMAGE",amount:18}}; familiarSummon={id:"fam-71",name:"黒曜シャーク",hpCost:5,imageIndex:71,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_DAMAGE",amount:18}}|
|高校編|HS_FAMILIAR_065|黒翼ケルブの契約|1|SUMMON|SELF|HPを5消費して黒翼ケルブを召喚。毎ターン終了時、ムキムキ+3。廃棄。|exhaust=true; familiarSummon={id:"fam-65",name:"黒翼ケルブ",hpCost:5,imageIndex:65,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"STRENGTH",amount:3}}; familiarSummon={id:"fam-65",name:"黒翼ケルブ",hpCost:5,imageIndex:65,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"STRENGTH",amount:3}}|
|高校編|HS_FAMILIAR_046|黒蓮ドリアードの契約|3|SUMMON|SELF|HPを4消費して黒蓮ドリアードを召喚。このターン終了時に一度だけ、次ターン開始時にカードを4枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-46",name:"黒蓮ドリアード",hpCost:4,imageIndex:46,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"DRAW",amount:4}}; familiarSummon={id:"fam-46",name:"黒蓮ドリアード",hpCost:4,imageIndex:46,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"DRAW",amount:4}}|
|高校編|HS_FAMILIAR_028|骨琴ヴィオラの契約|2|SUMMON|SELF|HPを4消費して骨琴ヴィオラを召喚。HPが半分以下ならターン終了時、ランダムな敵に16ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-28",name:"骨琴ヴィオラ",hpCost:4,imageIndex:28,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DAMAGE",amount:16}}; familiarSummon={id:"fam-28",name:"骨琴ヴィオラ",hpCost:4,imageIndex:28,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"DAMAGE",amount:16}}|
|高校編|HS_FAMILIAR_091|骨竜スカラーの契約|3|SUMMON|SELF|HPを4消費して骨竜スカラーを召喚。このターン終了時に一度だけ、敵全体にへろへろ4。廃棄。|exhaust=true; familiarSummon={id:"fam-91",name:"骨竜スカラー",hpCost:4,imageIndex:91,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"WEAK",amount:4}}; familiarSummon={id:"fam-91",name:"骨竜スカラー",hpCost:4,imageIndex:91,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"WEAK",amount:4}}|
|高校編|HS_FAMILIAR_090|砂王スフィンクスの契約|1|SUMMON|SELF|HPを3消費して砂王スフィンクスを召喚。毎ターン終了時、ランダムな敵にドクドク12。廃棄。|exhaust=true; familiarSummon={id:"fam-90",name:"砂王スフィンクス",hpCost:3,imageIndex:90,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"POISON",amount:12}}; familiarSummon={id:"fam-90",name:"砂王スフィンクス",hpCost:3,imageIndex:90,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"POISON",amount:12}}|
|高校編|HS_FAMILIAR_089|彩小鬼キャンディの契約|1|SUMMON|SELF|HPを5消費して彩小鬼キャンディを召喚。ブロック0ならターン終了時、次ターンのエナジー+3。廃棄。|exhaust=true; familiarSummon={id:"fam-89",name:"彩小鬼キャンディ",hpCost:5,imageIndex:89,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}; familiarSummon={id:"fam-89",name:"彩小鬼キャンディ",hpCost:5,imageIndex:89,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}|
|高校編|HS_FAMILIAR_073|桜怨サクラの契約|1|SUMMON|SELF|HPを4消費して桜怨サクラを召喚。HPが半分以下ならターン終了時、HPを16回復。廃棄。|exhaust=true; familiarSummon={id:"fam-73",name:"桜怨サクラ",hpCost:4,imageIndex:73,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"HEAL",amount:16}}; familiarSummon={id:"fam-73",name:"桜怨サクラ",hpCost:4,imageIndex:73,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"HEAL",amount:16}}|
|高校編|HS_FAMILIAR_026|札式ゴーレムの契約|3|SUMMON|SELF|HPを5消費して札式ゴーレムを召喚。このターン終了時に一度だけ、敵全体にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-26",name:"札式ゴーレム",hpCost:5,imageIndex:26,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_POISON",amount:8}}; familiarSummon={id:"fam-26",name:"札式ゴーレム",hpCost:5,imageIndex:26,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_POISON",amount:8}}|
|高校編|HS_STARTER_GUARD|参考書ガード|1|SKILL|SELF|ブロック6を得る。|block=6|
|高校編|HS_FAMILIAR_012|紙影ヌエの契約|2|SUMMON|SELF|HPを3消費して紙影ヌエを召喚。2ターンに1回、敵全体にドクドク6。廃棄。|exhaust=true; familiarSummon={id:"fam-12",name:"紙影ヌエ",hpCost:3,imageIndex:12,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_POISON",amount:6}}; familiarSummon={id:"fam-12",name:"紙影ヌエ",hpCost:3,imageIndex:12,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_POISON",amount:6}}|
|高校編|HS_FAMILIAR_053|紫牛ミノスの契約|1|SUMMON|SELF|HPを5消費して紫牛ミノスを召喚。HPが半分以下ならターン終了時、ランダムな敵に1ダメージを25回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-53",name:"紫牛ミノス",hpCost:5,imageIndex:53,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"RANDOM_HITS",amount:25}}; familiarSummon={id:"fam-53",name:"紫牛ミノス",hpCost:5,imageIndex:53,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"RANDOM_HITS",amount:25}}|
|高校編|HS_FAMILIAR_020|歯車天使クロノの契約|2|SUMMON|SELF|HPを5消費して歯車天使クロノを召喚。毎ターン終了時、ランダムな敵にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-20",name:"歯車天使クロノ",hpCost:5,imageIndex:20,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"POISON",amount:8}}; familiarSummon={id:"fam-20",name:"歯車天使クロノ",hpCost:5,imageIndex:20,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"POISON",amount:8}}|
|高校編|HS_FAMILIAR_014|鹿角セフィラの契約|1|SUMMON|SELF|HPを5消費して鹿角セフィラを召喚。ブロック0ならターン終了時、ランダムな敵に16ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-14",name:"鹿角セフィラ",hpCost:5,imageIndex:14,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DAMAGE",amount:16}}; familiarSummon={id:"fam-14",name:"鹿角セフィラ",hpCost:5,imageIndex:14,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DAMAGE",amount:16}}|
|高校編|HS_STARTER_SPARK|実験スパーク|1|ATTACK|ENEMY|7ダメージ。エナジー1回復。|damage=7; energy=1|
|高校編|HS_FAMILIAR_072|実験ホムンクルスの契約|2|SUMMON|SELF|HPを3消費して実験ホムンクルスを召喚。2ターンに1回、ブロック23。廃棄。|exhaust=true; familiarSummon={id:"fam-72",name:"実験ホムンクルス",hpCost:3,imageIndex:72,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"BLOCK",amount:23}}; familiarSummon={id:"fam-72",name:"実験ホムンクルス",hpCost:3,imageIndex:72,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"BLOCK",amount:23}}|
|高校編|HS_FAMILIAR_080|曙キメラの契約|2|SUMMON|SELF|HPを5消費して曙キメラを召喚。毎ターン終了時、ゴールド34を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-80",name:"曙キメラ",hpCost:5,imageIndex:80,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"GOLD",amount:34}}; familiarSummon={id:"fam-80",name:"曙キメラ",hpCost:5,imageIndex:80,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"GOLD",amount:34}}|
|高校編|HS_FAMILIAR_045|硝子孔雀パヴォの契約|1|SUMMON|SELF|HPを3消費して硝子孔雀パヴォを召喚。毎ターン終了時、HPを13回復。廃棄。|exhaust=true; familiarSummon={id:"fam-45",name:"硝子孔雀パヴォ",hpCost:3,imageIndex:45,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"HEAL",amount:13}}; familiarSummon={id:"fam-45",name:"硝子孔雀パヴォ",hpCost:3,imageIndex:45,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"HEAL",amount:13}}|
|高校編|HS_FAMILIAR_037|笑火ジャックの契約|1|SUMMON|SELF|HPを4消費して笑火ジャックを召喚。2ターンに1回、ムキムキ+3。廃棄。|exhaust=true; familiarSummon={id:"fam-37",name:"笑火ジャック",hpCost:4,imageIndex:37,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"STRENGTH",amount:3}}; familiarSummon={id:"fam-37",name:"笑火ジャック",hpCost:4,imageIndex:37,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"STRENGTH",amount:3}}|
|高校編|HS_FAMILIAR_062|象牙バジリスクの契約|1|SUMMON|SELF|HPを5消費して象牙バジリスクを召喚。2ターンに1回、ランダムな敵にドクドク10。廃棄。|exhaust=true; familiarSummon={id:"fam-62",name:"象牙バジリスク",hpCost:5,imageIndex:62,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"POISON",amount:10}}; familiarSummon={id:"fam-62",name:"象牙バジリスク",hpCost:5,imageIndex:62,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"POISON",amount:10}}|
|高校編|HS_FAMILIAR_044|鐘天使ベルの契約|2|SUMMON|SELF|HPを5消費して鐘天使ベルを召喚。ブロック0ならターン終了時、ブロック19。廃棄。|exhaust=true; familiarSummon={id:"fam-44",name:"鐘天使ベル",hpCost:5,imageIndex:44,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"BLOCK",amount:19}}; familiarSummon={id:"fam-44",name:"鐘天使ベル",hpCost:5,imageIndex:44,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"BLOCK",amount:19}}|
|高校編|HS_FAMILIAR_093|蝕蛾クイーンの契約|1|SUMMON|SELF|HPを3消費して蝕蛾クイーンを召喚。HPが半分以下ならターン終了時、ムキムキ+3。廃棄。|exhaust=true; familiarSummon={id:"fam-93",name:"蝕蛾クイーン",hpCost:3,imageIndex:93,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"STRENGTH",amount:3}}; familiarSummon={id:"fam-93",name:"蝕蛾クイーン",hpCost:3,imageIndex:93,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"STRENGTH",amount:3}}|
|高校編|HS_FAMILIAR_060|蝕翼グリフォンの契約|2|SUMMON|SELF|HPを3消費して蝕翼グリフォンを召喚。毎ターン終了時、次ターン開始時にカードを3枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-60",name:"蝕翼グリフォン",hpCost:3,imageIndex:60,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DRAW",amount:3}}; familiarSummon={id:"fam-60",name:"蝕翼グリフォン",hpCost:3,imageIndex:60,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DRAW",amount:3}}|
|高校編|HS_FAMILIAR_086|深淵蛸ノーブルの契約|3|SUMMON|SELF|HPを5消費して深淵蛸ノーブルを召喚。このターン終了時に一度だけ、ブロック33。廃棄。|exhaust=true; familiarSummon={id:"fam-86",name:"深淵蛸ノーブル",hpCost:5,imageIndex:86,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"BLOCK",amount:33}}; familiarSummon={id:"fam-86",name:"深淵蛸ノーブル",hpCost:5,imageIndex:86,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"BLOCK",amount:33}}|
|高校編|HS_FAMILIAR_079|真夜獅子レオンの契約|1|SUMMON|SELF|HPを4消費して真夜獅子レオンを召喚。ブロック0ならターン終了時、ムキムキ+3。廃棄。|exhaust=true; familiarSummon={id:"fam-79",name:"真夜獅子レオン",hpCost:4,imageIndex:79,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"STRENGTH",amount:3}}; familiarSummon={id:"fam-79",name:"真夜獅子レオン",hpCost:4,imageIndex:79,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"STRENGTH",amount:3}}|
|高校編|HS_FAMILIAR_033|人形女王ドロシーの契約|1|SUMMON|SELF|HPを3消費して人形女王ドロシーを召喚。HPが半分以下ならターン終了時、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-33",name:"人形女王ドロシー",hpCost:3,imageIndex:33,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}; familiarSummon={id:"fam-33",name:"人形女王ドロシー",hpCost:3,imageIndex:33,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}|
|高校編|HS_FAMILIAR_052|人形託宣マネキンの契約|2|SUMMON|SELF|HPを4消費して人形託宣マネキンを召喚。2ターンに1回、ゴールド28を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-52",name:"人形託宣マネキン",hpCost:4,imageIndex:52,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"GOLD",amount:28}}; familiarSummon={id:"fam-52",name:"人形託宣マネキン",hpCost:4,imageIndex:52,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"GOLD",amount:28}}|
|高校編|HS_FAMILIAR_095|水晶鹿クリスタの契約|1|SUMMON|SELF|HPを5消費して水晶鹿クリスタを召喚。毎ターン終了時、ランダムな敵に1ダメージを38回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-95",name:"水晶鹿クリスタ",hpCost:5,imageIndex:95,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"RANDOM_HITS",amount:38}}; familiarSummon={id:"fam-95",name:"水晶鹿クリスタ",hpCost:5,imageIndex:95,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"RANDOM_HITS",amount:38}}|
|高校編|HS_FAMILIAR_030|水晶人魚セレネの契約|1|SUMMON|SELF|HPを3消費して水晶人魚セレネを召喚。毎ターン終了時、ブロック15。廃棄。|exhaust=true; familiarSummon={id:"fam-30",name:"水晶人魚セレネ",hpCost:3,imageIndex:30,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"BLOCK",amount:15}}; familiarSummon={id:"fam-30",name:"水晶人魚セレネ",hpCost:3,imageIndex:30,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"BLOCK",amount:15}}|
|高校編|HS_FAMILIAR_043|数式スフィンクスの契約|1|SUMMON|SELF|HPを4消費して数式スフィンクスを召喚。HPが半分以下ならターン終了時、敵全体に13ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-43",name:"数式スフィンクス",hpCost:4,imageIndex:43,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"AOE_DAMAGE",amount:13}}; familiarSummon={id:"fam-43",name:"数式スフィンクス",hpCost:4,imageIndex:43,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"AOE_DAMAGE",amount:13}}|
|高校編|HS_FAMILIAR_032|星麒麟ステラの契約|2|SUMMON|SELF|HPを5消費して星麒麟ステラを召喚。2ターンに1回、次ターン開始時にカードを2枚引く。廃棄。|exhaust=true; familiarSummon={id:"fam-32",name:"星麒麟ステラ",hpCost:5,imageIndex:32,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"DRAW",amount:2}}; familiarSummon={id:"fam-32",name:"星麒麟ステラ",hpCost:5,imageIndex:32,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"DRAW",amount:2}}|
|高校編|HS_FAMILIAR_013|青提灯アオイの契約|1|SUMMON|SELF|HPを4消費して青提灯アオイを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを2枚引き、ムキムキ+2、次ターンのエナジー+1。廃棄。|exhaust=true; familiarSummon={id:"fam-13",name:"青提灯アオイ",hpCost:4,imageIndex:13,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"CHAOS_SURGE",amount:2}}; familiarSummon={id:"fam-13",name:"青提灯アオイ",hpCost:4,imageIndex:13,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"CHAOS_SURGE",amount:2}}|
|高校編|HS_FAMILIAR_042|赤糸アラクネの契約|1|SUMMON|SELF|HPを3消費して赤糸アラクネを召喚。2ターンに1回、ランダムな敵に20ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-42",name:"赤糸アラクネ",hpCost:3,imageIndex:42,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"DAMAGE",amount:20}}; familiarSummon={id:"fam-42",name:"赤糸アラクネ",hpCost:3,imageIndex:42,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"DAMAGE",amount:20}}|
|高校編|HS_FAMILIAR_099|赤点大魔王アークの契約|1|SUMMON|SELF|HPを3消費して赤点大魔王アークを召喚。ブロック0ならターン終了時、敵全体に19ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-99",name:"赤点大魔王アーク",hpCost:3,imageIndex:99,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_DAMAGE",amount:19}}; familiarSummon={id:"fam-99",name:"赤点大魔王アーク",hpCost:3,imageIndex:99,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_DAMAGE",amount:19}}|
|高校編|HS_FAMILIAR_070|折鶴レギオンの契約|1|SUMMON|SELF|HPを4消費して折鶴レギオンを召喚。毎ターン終了時、ランダムな敵に20ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-70",name:"折鶴レギオン",hpCost:4,imageIndex:70,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DAMAGE",amount:20}}; familiarSummon={id:"fam-70",name:"折鶴レギオン",hpCost:4,imageIndex:70,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"DAMAGE",amount:20}}|
|高校編|HS_FAMILIAR_036|雪騎士ユキノの契約|3|SUMMON|SELF|HPを3消費して雪騎士ユキノを召喚。このターン終了時に一度だけ、敵全体にびくびく4。廃棄。|exhaust=true; familiarSummon={id:"fam-36",name:"雪騎士ユキノ",hpCost:3,imageIndex:36,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"VULNERABLE",amount:4}}; familiarSummon={id:"fam-36",name:"雪騎士ユキノ",hpCost:3,imageIndex:36,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"VULNERABLE",amount:4}}|
|高校編|HS_FAMILIAR_049|扇天狗サヤの契約|1|SUMMON|SELF|HPを4消費して扇天狗サヤを召喚。ブロック0ならターン終了時、敵全体にへろへろ3。廃棄。|exhaust=true; familiarSummon={id:"fam-49",name:"扇天狗サヤ",hpCost:4,imageIndex:49,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"WEAK",amount:3}}; familiarSummon={id:"fam-49",name:"扇天狗サヤ",hpCost:4,imageIndex:49,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"WEAK",amount:3}}|
|高校編|HS_FAMILIAR_066|蒼炎キツネの契約|3|SUMMON|SELF|HPを3消費して蒼炎キツネを召喚。このターン終了時に一度だけ、ゴールド39を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-66",name:"蒼炎キツネ",hpCost:3,imageIndex:66,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"GOLD",amount:39}}; familiarSummon={id:"fam-66",name:"蒼炎キツネ",hpCost:3,imageIndex:66,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"GOLD",amount:39}}|
|高校編|HS_FAMILIAR_039|蒼鬼ラピスの契約|1|SUMMON|SELF|HPを3消費して蒼鬼ラピスを召喚。ブロック0ならターン終了時、ランダムな敵に1ダメージを25回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-39",name:"蒼鬼ラピス",hpCost:3,imageIndex:39,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"RANDOM_HITS",amount:25}}; familiarSummon={id:"fam-39",name:"蒼鬼ラピス",hpCost:3,imageIndex:39,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"RANDOM_HITS",amount:25}}|
|高校編|HS_FAMILIAR_082|蒼鱗ラミアの契約|1|SUMMON|SELF|HPを4消費して蒼鱗ラミアを召喚。2ターンに1回、敵全体にドクドク9。廃棄。|exhaust=true; familiarSummon={id:"fam-82",name:"蒼鱗ラミア",hpCost:4,imageIndex:82,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_POISON",amount:9}}; familiarSummon={id:"fam-82",name:"蒼鱗ラミア",hpCost:4,imageIndex:82,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_POISON",amount:9}}|
|高校編|HS_FAMILIAR_040|太陽烏ヒノカの契約|2|SUMMON|SELF|HPを4消費して太陽烏ヒノカを召喚。毎ターン終了時、敵全体にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-40",name:"太陽烏ヒノカ",hpCost:4,imageIndex:40,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_POISON",amount:8}}; familiarSummon={id:"fam-40",name:"太陽烏ヒノカ",hpCost:4,imageIndex:40,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_POISON",amount:8}}|
|高校編|HS_FAMILIAR_054|淡海リヴァの契約|1|SUMMON|SELF|HPを3消費して淡海リヴァを召喚。ブロック0ならターン終了時、敵全体にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-54",name:"淡海リヴァ",hpCost:3,imageIndex:54,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_POISON",amount:8}}; familiarSummon={id:"fam-54",name:"淡海リヴァ",hpCost:3,imageIndex:54,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_POISON",amount:8}}|
|高校編|HS_FAMILIAR_006|鶴姫シラユキの契約|3|SUMMON|SELF|HPを3消費して鶴姫シラユキを召喚。このターン終了時に一度だけ、ランダムな敵にドクドク11。廃棄。|exhaust=true; familiarSummon={id:"fam-6",name:"鶴姫シラユキ",hpCost:3,imageIndex:6,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"POISON",amount:11}}; familiarSummon={id:"fam-6",name:"鶴姫シラユキ",hpCost:3,imageIndex:6,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"POISON",amount:11}}|
|高校編|HS_STARTER_HEAT|鉄板ヒート|1|ATTACK|ENEMY|8ダメージ。次ターンのエナジー+1。|damage=8; nextTurnEnergy=1|
|高校編|HS_FAMILIAR_029|電脳犬神ケンの契約|1|SUMMON|SELF|HPを5消費して電脳犬神ケンを召喚。ブロック0ならターン終了時、敵全体に10ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-29",name:"電脳犬神ケン",hpCost:5,imageIndex:29,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_DAMAGE",amount:10}}; familiarSummon={id:"fam-29",name:"電脳犬神ケン",hpCost:5,imageIndex:29,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"AOE_DAMAGE",amount:10}}|
|高校編|HS_FAMILIAR_083|陶器花嫁ゴーレムの契約|1|SUMMON|SELF|HPを5消費して陶器花嫁ゴーレムを召喚。HPが半分以下ならターン終了時、次ターン開始時にカードを3枚引き、ムキムキ+3、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-83",name:"陶器花嫁ゴーレム",hpCost:5,imageIndex:83,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}; familiarSummon={id:"fam-83",name:"陶器花嫁ゴーレム",hpCost:5,imageIndex:83,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"CHAOS_SURGE",amount:3}}|
|高校編|HS_FAMILIAR_025|白火サラマの契約|1|SUMMON|SELF|HPを4消費して白火サラマを召喚。毎ターン終了時、ランダムな敵に1ダメージを20回与える。廃棄。|exhaust=true; familiarSummon={id:"fam-25",name:"白火サラマ",hpCost:4,imageIndex:25,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"RANDOM_HITS",amount:20}}; familiarSummon={id:"fam-25",name:"白火サラマ",hpCost:4,imageIndex:25,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"RANDOM_HITS",amount:20}}|
|高校編|HS_FAMILIAR_056|白墨スピリットの契約|3|SUMMON|SELF|HPを5消費して白墨スピリットを召喚。このターン終了時に一度だけ、ランダムな敵に28ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-56",name:"白墨スピリット",hpCost:5,imageIndex:56,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"DAMAGE",amount:28}}; familiarSummon={id:"fam-56",name:"白墨スピリット",hpCost:5,imageIndex:56,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"DAMAGE",amount:28}}|
|高校編|HS_FAMILIAR_001|白竜レイヴンの契約|3|SUMMON|SELF|HPを4消費して白竜レイヴンを召喚。このターン終了時に一度だけ、敵全体に14ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-1",name:"白竜レイヴン",hpCost:4,imageIndex:1,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_DAMAGE",amount:14}}; familiarSummon={id:"fam-1",name:"白竜レイヴン",hpCost:4,imageIndex:1,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"AOE_DAMAGE",amount:14}}|
|高校編|HS_STARTER_RESONANCE|反響チューニング|1|SKILL|ALL_ENEMIES|敵全体にへろへろ1。カード1枚を引く。|draw=1; weak=1|
|高校編|HS_FAMILIAR_075|緋烏プリーストの契約|1|SUMMON|SELF|HPを3消費して緋烏プリーストを召喚。毎ターン終了時、次ターンのエナジー+3。廃棄。|exhaust=true; familiarSummon={id:"fam-75",name:"緋烏プリースト",hpCost:3,imageIndex:75,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}; familiarSummon={id:"fam-75",name:"緋烏プリースト",hpCost:3,imageIndex:75,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}|
|高校編|HS_FAMILIAR_094|緋河童ローグの契約|1|SUMMON|SELF|HPを4消費して緋河童ローグを召喚。ブロック0ならターン終了時、ゴールド34を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-94",name:"緋河童ローグ",hpCost:4,imageIndex:94,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"GOLD",amount:34}}; familiarSummon={id:"fam-94",name:"緋河童ローグ",hpCost:4,imageIndex:94,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"GOLD",amount:34}}|
|高校編|HS_FAMILIAR_023|緋爵ヴラドの契約|1|SUMMON|SELF|HPを5消費して緋爵ヴラドを召喚。HPが半分以下ならターン終了時、ムキムキ+2。廃棄。|exhaust=true; familiarSummon={id:"fam-23",name:"緋爵ヴラド",hpCost:5,imageIndex:23,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"STRENGTH",amount:2}}; familiarSummon={id:"fam-23",name:"緋爵ヴラド",hpCost:5,imageIndex:23,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"STRENGTH",amount:2}}|
|高校編|HS_STARTER_FOCUS|放課後フォーカス|1|SKILL|SELF|ブロック5。カード1枚を引く。|block=5; draw=1|
|高校編|HS_FAMILIAR_034|墨鯨オルカの契約|1|SUMMON|SELF|HPを4消費して墨鯨オルカを召喚。ブロック0ならターン終了時、ランダムな敵にドクドク8。廃棄。|exhaust=true; familiarSummon={id:"fam-34",name:"墨鯨オルカ",hpCost:4,imageIndex:34,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"POISON",amount:8}}; familiarSummon={id:"fam-34",name:"墨鯨オルカ",hpCost:4,imageIndex:34,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"POISON",amount:8}}|
|高校編|HS_FAMILIAR_019|墨魔インクスの契約|1|SUMMON|SELF|HPを4消費して墨魔インクスを召喚。ブロック0ならターン終了時、次ターンのエナジー+2。廃棄。|exhaust=true; familiarSummon={id:"fam-19",name:"墨魔インクス",hpCost:4,imageIndex:19,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}; familiarSummon={id:"fam-19",name:"墨魔インクス",hpCost:4,imageIndex:19,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"ENERGY_NEXT",amount:2}}|
|高校編|HS_FAMILIAR_024|夢喰バクシンの契約|2|SUMMON|SELF|HPを3消費して夢喰バクシンを召喚。ブロック0ならターン終了時、ゴールド22を得る。廃棄。|exhaust=true; familiarSummon={id:"fam-24",name:"夢喰バクシン",hpCost:3,imageIndex:24,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"GOLD",amount:22}}; familiarSummon={id:"fam-24",name:"夢喰バクシン",hpCost:3,imageIndex:24,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"GOLD",amount:22}}|
|高校編|HS_FAMILIAR_078|夜蝙蝠ナイトの契約|1|SUMMON|SELF|HPを3消費して夜蝙蝠ナイトを召喚。HPが半分以下ならターン終了時、敵全体にびくびく3。廃棄。|exhaust=true; familiarSummon={id:"fam-78",name:"夜蝙蝠ナイト",hpCost:3,imageIndex:78,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"VULNERABLE",amount:3}}; familiarSummon={id:"fam-78",name:"夜蝙蝠ナイト",hpCost:3,imageIndex:78,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"VULNERABLE",amount:3}}|
|高校編|HS_FAMILIAR_084|幼火フェニィの契約|2|SUMMON|SELF|HPを3消費して幼火フェニィを召喚。ブロック0ならターン終了時、ランダムな敵に25ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-84",name:"幼火フェニィ",hpCost:3,imageIndex:84,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DAMAGE",amount:25}}; familiarSummon={id:"fam-84",name:"幼火フェニィ",hpCost:3,imageIndex:84,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"DAMAGE",amount:25}}|
|高校編|HS_FAMILIAR_058|羊魔メリーの契約|1|SUMMON|SELF|HPを4消費して羊魔メリーを召喚。HPが半分以下ならターン終了時、ブロック19。廃棄。|exhaust=true; familiarSummon={id:"fam-58",name:"羊魔メリー",hpCost:4,imageIndex:58,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"BLOCK",amount:19}}; familiarSummon={id:"fam-58",name:"羊魔メリー",hpCost:4,imageIndex:58,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"BLOCK",amount:19}}|
|高校編|HS_FAMILIAR_064|螺旋カタツムリの契約|2|SUMMON|SELF|HPを4消費して螺旋カタツムリを召喚。ブロック0ならターン終了時、敵全体にびくびく3。廃棄。|exhaust=true; familiarSummon={id:"fam-64",name:"螺旋カタツムリ",hpCost:4,imageIndex:64,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"VULNERABLE",amount:3}}; familiarSummon={id:"fam-64",name:"螺旋カタツムリ",hpCost:4,imageIndex:64,duration:"BATTLE",trigger:"NO_BLOCK_END_TURN",effect:{kind:"VULNERABLE",amount:3}}|
|高校編|HS_FAMILIAR_047|雷麒麟ライカの契約|1|SUMMON|SELF|HPを5消費して雷麒麟ライカを召喚。2ターンに1回、次ターンのエナジー+3。廃棄。|exhaust=true; familiarSummon={id:"fam-47",name:"雷麒麟ライカ",hpCost:5,imageIndex:47,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}; familiarSummon={id:"fam-47",name:"雷麒麟ライカ",hpCost:5,imageIndex:47,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"ENERGY_NEXT",amount:3}}|
|高校編|HS_FAMILIAR_048|落書精ジンの契約|2|SUMMON|SELF|HPを3消費して落書精ジンを召喚。HPが半分以下ならターン終了時、ランダムな敵にドクドク10。廃棄。|exhaust=true; familiarSummon={id:"fam-48",name:"落書精ジン",hpCost:3,imageIndex:48,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"POISON",amount:10}}; familiarSummon={id:"fam-48",name:"落書精ジン",hpCost:3,imageIndex:48,duration:"BATTLE",trigger:"LOW_HP_END_TURN",effect:{kind:"POISON",amount:10}}|
|高校編|HS_FAMILIAR_022|嵐天狗ハヤテの契約|1|SUMMON|SELF|HPを4消費して嵐天狗ハヤテを召喚。2ターンに1回、敵全体にびくびく2。廃棄。|exhaust=true; familiarSummon={id:"fam-22",name:"嵐天狗ハヤテ",hpCost:4,imageIndex:22,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"VULNERABLE",amount:2}}; familiarSummon={id:"fam-22",name:"嵐天狗ハヤテ",hpCost:4,imageIndex:22,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"VULNERABLE",amount:2}}|
|高校編|HS_FAMILIAR_057|輪蛇ウロボロの契約|1|SUMMON|SELF|HPを3消費して輪蛇ウロボロを召喚。2ターンに1回、敵全体に13ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-57",name:"輪蛇ウロボロ",hpCost:3,imageIndex:57,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_DAMAGE",amount:13}}; familiarSummon={id:"fam-57",name:"輪蛇ウロボロ",hpCost:3,imageIndex:57,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"AOE_DAMAGE",amount:13}}|
|高校編|HS_FAMILIAR_017|鈴人形リンネの契約|1|SUMMON|SELF|HPを5消費して鈴人形リンネを召喚。2ターンに1回、HPを10回復。廃棄。|exhaust=true; familiarSummon={id:"fam-17",name:"鈴人形リンネ",hpCost:5,imageIndex:17,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"HEAL",amount:10}}; familiarSummon={id:"fam-17",name:"鈴人形リンネ",hpCost:5,imageIndex:17,duration:"BATTLE",trigger:"EVERY_OTHER_TURN",effect:{kind:"HEAL",amount:10}}|
|高校編|HS_FAMILIAR_035|炉心イフリートの契約|1|SUMMON|SELF|HPを5消費して炉心イフリートを召喚。毎ターン終了時、敵全体にへろへろ2。廃棄。|exhaust=true; familiarSummon={id:"fam-35",name:"炉心イフリート",hpCost:5,imageIndex:35,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"WEAK",amount:2}}; familiarSummon={id:"fam-35",name:"炉心イフリート",hpCost:5,imageIndex:35,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"WEAK",amount:2}}|
|高校編|HS_FAMILIAR_016|彗星魚コメットの契約|3|SUMMON|SELF|HPを4消費して彗星魚コメットを召喚。このターン終了時に一度だけ、ブロック21。廃棄。|exhaust=true; familiarSummon={id:"fam-16",name:"彗星魚コメット",hpCost:4,imageIndex:16,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"BLOCK",amount:21}}; familiarSummon={id:"fam-16",name:"彗星魚コメット",hpCost:4,imageIndex:16,duration:1,trigger:"ONCE_END_TURN",effect:{kind:"BLOCK",amount:21}}|
|高校編|HS_FAMILIAR_015|髑髏小鬼ボニーの契約|1|SUMMON|SELF|HPを3消費して髑髏小鬼ボニーを召喚。毎ターン終了時、敵全体に10ダメージ。廃棄。|exhaust=true; familiarSummon={id:"fam-15",name:"髑髏小鬼ボニー",hpCost:3,imageIndex:15,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_DAMAGE",amount:10}}; familiarSummon={id:"fam-15",name:"髑髏小鬼ボニー",hpCost:3,imageIndex:15,duration:"BATTLE",trigger:"END_TURN",effect:{kind:"AOE_DAMAGE",amount:10}}|
|呪い|CLUMSINESS|ドジ|0|CURSE||【手札阻害型】使用不可。廃棄。|exhaust=true; unplayable=true|
|呪い|PARASITE|寄生虫|0|CURSE||【山札汚染型】使用不可。デッキから消滅すると最大HP-3。|unplayable=true; App:名称/ID分岐|
|呪い|REGRET|後悔|0|CURSE||【山札汚染型】使用不可。ターン終了時、手札枚数分自分にダメージ。|unplayable=true; App:名称/ID分岐|
|呪い|INJURY|骨折|0|CURSE||【即時痛み型】使用不可。|unplayable=true|
|呪い|NORMALITY|退屈|0|CURSE||【手札阻害型】使用不可。手札にある間、3枚までしかカードを使えない。|unplayable=true; App:名称/ID分岐|
|呪い|SHAME|恥|0|CURSE||【山札汚染型】使用不可。ターン終了時、びくびく1を得る。|unplayable=true; App:名称/ID分岐|
|呪い|DECAY|虫歯|0|CURSE||【即時痛み型】使用不可。ターン終了時自分に2ダメージ。|unplayable=true; App:名称/ID分岐|
|呪い|WRITHE|悩み|0|CURSE||【山札汚染型】使用不可。初期手札に来る。|unplayable=true; innate=true|
|呪い|DOUBT|不安|0|CURSE||【山札汚染型】使用不可。ターン終了時、へろへろ1を得る。|unplayable=true; App:名称/ID分岐|
|呪い|PAIN|腹痛|0|CURSE||【即時痛み型】使用不可。手札にある間、カードを使うたび自分に1ダメージ。|unplayable=true; App:名称/ID分岐|
|小学生編|PE_SWIM|25mクロール|1|SKILL|SELF|ブロック6。カードを1枚引く。|block=6; draw=1|
|小学生編|PE_BASKET|3ポイントシュート|2|ATTACK|ENEMY|22ダメージ。廃棄。|damage=22; exhaust=true|
|小学生編|PE_DASH|50m走|0|SKILL|SELF|ムキムキ2を得る。|strength=2|
|小学生編|PE_SOCCER|PK戦|1|ATTACK|ENEMY|7ダメージを2回。対象をびくびく1にする。|damage=7; vulnerable=1; playCopies=1|
|小学生編|OUT_ICE_CREAM_BINGE|アイス食べ放題|1|SKILL|SELF|エナジー2を得る。自分に3ダメージ。|energy=2; selfDamage=3|
|小学生編|SCRAPE|あがく|1|ATTACK|ENEMY|7ダメージ。ドロー3、非0コス捨てる。|damage=7; draw=3; App:名称/ID分岐|
|小学生編|UPPERCUT|アッパー|2|ATTACK|ENEMY|13ダメージ。へろへろ1とびくびく1。|damage=13; vulnerable=1; weak=1|
|小学生編|OUT_ANIME_BINGE|アニメ一気見|4|POWER|SELF|ターンの開始時、手札の全コストを1下げる。|applyPower={id:"COST_REDUCTION",amount:1}|
|小学生編|RIKA_ALCOHOL|アルコールランプ|1|ATTACK|ENEMY|7ダメージ。対象にドクドク3。|damage=7; poison=3|
|小学生編|RIKA_FOSSIL|アンモナイト|1|SKILL|SELF|ブロック12。廃棄。|block=12; exhaust=true|
|小学生編|FEED|いただきます|1|ATTACK|ENEMY|10ダメージ。これでたおすと最大HP+3。|damage=10; fatalMaxHp=3|
|小学生編|GIRLS_STRAWBERRY|いちごの奇跡|1|SKILL|SELF|最大HPを3増やす。|fatalMaxHp=3|
|小学生編|OUT_GRADUATION_DAY|いつかの卒業式|6|SKILL|SELF|ムキムキ20、カチカチ20、キラキラ5を得る。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SHIV|えんぴつの削りかす|0|ATTACK|ENEMY|4ダメージ。廃棄。|damage=4; exhaust=true; App:名称/ID分岐|
|小学生編|STRIKE|えんぴつ攻撃|1|ATTACK|ENEMY|6ダメージを与える。|damage=6; App:名称/ID分岐|
|小学生編|OI_DETEKOI|おーい、でてこい|2|ATTACK|ENEMY|18ダメージ。次ターンE+1。|damage=18; nextTurnEnergy=1|
|小学生編|BOYS_OVERLOAD|オーバーロード|0|SKILL|SELF|エナジー3を得る。次のターン、エナジー0。|energy=3; nextTurnEnergy=-3|
|小学生編|OUT_GRANDPA_WISDOM|おじいちゃんの教え|2|POWER|SELF|HPを失う度、ムキムキ1を得る。|applyPower={id:"RUPTURE",amount:1}|
|小学生編|OUT_OLD_HOUSE|おじいちゃんの古民家|3|SKILL|SELF|HPを全回復。最大HP+2。使い切り。|heal=99; exhaust=true; consumedOnUse=true; fatalMaxHp=2; App:名称/ID分岐|
|小学生編|GIRLS_FAIRY_TALE|おとぎ話の扉|2|SKILL|SELF|ランダムなスペシャルカードを3枚手札に加える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_GRANDMA_CAKE|おばあちゃんの手作りケーキ|4|SKILL|SELF|HP30回復。最大HP+5。廃棄。|heal=30; exhaust=true; fatalMaxHp=5|
|小学生編|OUT_GRANDMA_GIFT|おばあちゃんの小遣い|2|SKILL|SELF|120ゴールドを得る。廃棄。|gold=120; exhaust=true|
|小学生編|OMUSUBI_KORORIN|おむすびころりん|0|SKILL|RANDOM_ENEMY|E1を得る。ランダムな敵に5ダメージ。|damage=5; energy=1|
|小学生編|BOYS_OMEGA_CANNON|オメガ・キャノン|3|ATTACK|ENEMY|40ダメージ。|damage=40|
|小学生編|GIRLS_SWEET_DREAM|おやすみスウィート|2|SKILL|ALL_ENEMIES|敵全体を2ターン行動不能にする。廃棄。|exhaust=true; App:名称/ID分岐|
|小学生編|GIRLS_SWEET_PARADE|お菓子の行進|1|ATTACK|ENEMY|4ダメージを4回。|damage=4; playCopies=3|
|小学生編|SYAKAI_CASTLE|お城の守り|2|SKILL|SELF|ブロック20。廃棄。|block=20; exhaust=true|
|小学生編|GIRLS_DOLL_HOUSE|お人形遊び|1|SKILL|SELF|手札のスキルカード1枚をコピーする。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_Kite_FLYING|お正月の凧揚げ|3|ATTACK|ALL_ENEMIES|山札の枚数×2ダメージ。|damagePerCardInDraw=2|
|小学生編|GIRLS_TEA_PARTY|お茶会の時間|2|SKILL|SELF|エナジー2を得る。カードを2枚引く。|draw=2; energy=2|
|小学生編|OUT_NEW_YEAR_GOLD|お年玉の誘惑|1|SKILL|SELF|手札のランダムなカード1枚を、その戦闘中0コストにする。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SYAKAI_BANK|お年玉貯金|1|SKILL|SELF|100ゴールドを得る。廃棄。|gold=100; cardEffectLogic:名称分岐|
|小学生編|GIRLS_PRINCESS_CALL|お姫様の呼び声|1|SKILL|SELF|デッキからランダムなスキルを1枚手札に加える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SYAKAI_COIN_BAG|お宝の袋|2|ATTACK|ENEMY|18ダメージ。ゴールドを20得る。|damage=18; gold=20|
|小学生編|CARD_ERASER|カード消しゴム|0|SKILL|SELF|戦闘中は使用不可。休憩マスでカードの不要な効果を1つ消す。1回使い切り。|unplayable=true|
|小学生編|KAIKETSU_ZORORI|かいけつゾロリ|1|SKILL|SELF|3枚引き、1枚捨てる。ブロック3。|draw=3; promptsDiscard=1; cardEffectLogic:名称分岐|
|小学生編|HEEL_HOOK|かかと落とし|1|ATTACK|ENEMY|5ダメージ。E1回復。カードを1枚引く。|damage=5; draw=1; energy=1|
|小学生編|PREDATOR|ガキ大将|2|ATTACK|ENEMY|15ダメージ。次ターン2ドロー。|damage=15; nextTurnDraw=2|
|小学生編|KAGUYA_HIME|かぐや姫|3|SKILL|SELF|3ターン「スケスケ(無敵)」になる。廃棄。|exhaust=true; applyPower={id:"INTANGIBLE",amount:3}|
|小学生編|KASA_JIZO|かさじぞう|0|SKILL|SELF|ブロック4を得る。次ターンカードを1枚引く。|block=4; nextTurnDraw=1|
|小学生編|KACHIKACHI_YAMA|かちかち山|2|ATTACK|ENEMY|12ダメージ。対象に「やけど」を与える。|damage=12; addCardToDiscard={cardName:"BURN",count:1}|
|小学生編|OUT_GACHA_LUCK|ガチャの神引き|2|SKILL|SELF|デッキからランダムなレジェンダリーカードを手札に加える。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|TURBO|カフェイン|0|SKILL|SELF|E2を得る。虚無追加。|energy=2; addCardToDraw={cardName:"VOID",count:1}|
|小学生編|OUT_BUG_CATCH|かぶとむし狩り|3|SKILL|ENEMY|対象を捕獲する。|capture=true|
|小学生編|OUT_KABUTO_WRESTLE|カぶとむし相撲|3|ATTACK|ENEMY|22ダメージ。対象にびくびく2。|damage=22; vulnerable=2|
|小学生編|GLACIER|かまくら|2|SKILL|SELF|ブロック12。|block=12|
|小学生編|GIRLS_COLORFUL_RAIN|カラフル・レインボー|2|SKILL|ALL_ENEMIES|敵全体のブロックを解除し、10ダメージ。|damage=10; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|KUMO_NO_ITO_D|カンダタの叫び|0|SKILL|SELF|E2。手札に「悩み」を加える。|energy=2; addCardToHand={cardName:"WRITHE",count:1}|
|小学生編|SUCKER_PUNCH|カンチョー|1|ATTACK|ENEMY|7ダメージ。へろへろ1を与える。|damage=7; weak=1|
|小学生編|HOLOGRAM|カンニング|1|SKILL|SELF|手札の攻撃カードを1枚コピーする。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|STRATEGIST|カンニングペーパー|0|SKILL|SELF|使用不可。捨てられた時、次のターンにE2を得る。|unplayable=true; App:名称/ID分岐|
|小学生編|KITSUNE_NO_MADO|きてんの窓|1|SKILL|SELF|手札の高コストカードを優先して1枚コピーし、0コスト化する。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|KIBI_DANGO|きびだんご|0|SKILL|SELF|ブロック5を得る。廃棄。|block=5; exhaust=true|
|小学生編|GIRLS_CANDY_WAVE|キャンディ・ポップ・ウェーブ|1|ATTACK|ALL_ENEMIES|全体に7ダメージ。全員をドクドク3にする。|damage=7; poison=3|
|小学生編|GIRLS_SPARKLE_DUST|キラキラの粉|0|SKILL|ENEMY|対象をびくびく2にする。へろへろ1を与える。|vulnerable=2; cardEffectLogic:名称分岐|
|小学生編|GIRLS_KIRAKIRA_PUNCH|キラキラパンチ|1|ATTACK|ENEMY|8ダメージ。対象にドクドク4。|damage=8; poison=4|
|小学生編|ANGER|キレる|0|ATTACK|ENEMY|6ダメージ。捨て札に「キレる」を1枚加える。|damage=6; addCardToDiscard={cardName:"ANGER",count:1}|
|小学生編|EMPTY_FIST|グーパンチ|1|ATTACK|ENEMY|9ダメージ。次のターン、エナジー1を得る。|damage=9; nextTurnEnergy=1|
|小学生編|WHIRLWIND|グルグルバット|2|ATTACK|ALL_ENEMIES|全体8ダメージを2回。|damage=8; playCopies=1|
|小学生編|OUT_ARCADE_MASTER|ゲーセンの達人|2|ATTACK|ENEMY|コンボ：今ターン使ったカード1枚につき8ダメージ。|damagePerAttackPlayed=8|
|小学生編|BLUDGEON|げんこつ|3|ATTACK|ENEMY|32ダメージを与える。|damage=32|
|小学生編|BOYS_CORE_STRIKE|コア・ストライク|1|ATTACK|ENEMY|10ダメージ。エナジー1を得る。|damage=10; energy=1|
|小学生編|KOKORO_SOSEKI|こころ|1|SKILL|ENEMY|敵の攻撃力を2下げる。廃棄。|exhaust=true; strength=-2|
|小学生編|KOKUGO_KOTOWAZA|ことわざの知恵|1|SKILL|SELF|ブロック7。カードを1枚引く。|block=7; draw=1|
|小学生編|GON_GITSUNE|ごんぎつね|1|ATTACK|ENEMY|6ダメージを2回与える。|damage=6; playCopies=1|
|小学生編|GON_KURU|ごんの栗|0|SKILL|SELF|カードを1枚引く。ムキムキ1を得る。|draw=1; strength=1|
|小学生編|SANSU_COMPASS|コンパス円舞|1|ATTACK|ALL_ENEMIES|全体に5ダメージ。ブロック5を得る。|damage=5; block=5|
|小学生編|OUT_CONVENIENCE|コンビニの買い食い|2|SKILL|SELF|HPを8回復。エナジー1を得る。廃棄。|heal=8; energy=1; exhaust=true|
|小学生編|GIRLS_CHERRY_BLOSSOM|さくらんぼのワルツ|1|ATTACK|ENEMY|6ダメージを2回。HPを3回復。|damage=6; heal=3; playCopies=1|
|小学生編|SAKURA_STORM|さくら吹雪|1|ATTACK|ALL_ENEMIES|全体10ダメージ。廃棄。|damage=10; exhaust=true|
|小学生編|CACTUS|サボテン|1|POWER||トゲトゲ4を得る。|applyPower={id:"THORNS",amount:4}|
|小学生編|OUT_JUNGLE_GYM|ジャングルジムの頂上|3|SKILL|SELF|ブロック20。次ターンのエナジー+1。|block=20; nextTurnEnergy=1|
|小学生編|LEAP|ジャンプ|1|SKILL|SELF|ブロック9を得る。|block=9|
|小学生編|GIRLS_JEWEL_SHINE|ジュエル・シャイン|2|SKILL|SELF|キラキラ1を得る。|applyPower={id:"ARTIFACT",amount:1}|
|小学生編|OUT_FLOWER_CROWN|シロツメクサの冠|1|SKILL|SELF|ブロック15を得る。|block=15|
|小学生編|GIRLS_STAR_SYMPHONY|スターライト・シンフォニー|1|SKILL|ALL_ENEMIES|敵全体をへろへろ2、びくびく2にする。|vulnerable=2; weak=2|
|小学生編|OUT_STAMP_COLLECT|スタンプラリー|1|SKILL|SELF|クエスト: この戦闘中、あと5枚カードを使う。達成でカードを2枚引き、エナジー1を得る。廃棄。|exhaust=true; App:名称/ID分岐|
|小学生編|GIRLS_FRIENDSHIP|ずっと友達だよ|2|SKILL|SELF|パートナーのHPを全回復。自分にブロック15。使い切り。|block=15; consumedOnUse=true; App:名称/ID分岐|
|小学生編|PE_CHAMPION|スポーツ王|3|POWER|SELF|ムキムキ2、カチカチ2を得る。|strength=2; applyPower={id:"DEXTERITY",amount:2}; cardEffectLogic:名称分岐|
|小学生編|SANSU_ZERO|ゼロの発見|0|SKILL|SELF|「発見」と同じくランダムなカード3枚を手札に加える。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|GAUCHE_CELLO|セロ弾きのゴーシュ|2|SKILL|SELF|ブロック10。次ターン2枚引く。|block=10; nextTurnDraw=2|
|小学生編|SANSU_SOROBAN|そろばん|1|SKILL|SELF|エナジー1を得る。手札を1枚捨てる。|energy=1; promptsDiscard=1|
|小学生編|SASH_WHIP|タオル攻撃|1|ATTACK|ENEMY|8ダメージ。へろへろ1。びくびく1。|damage=8; vulnerable=1; weak=1|
|小学生編|DAGGER_THROW|チョーク投げ|1|ATTACK|ENEMY|9ダメージ。1枚引き、1枚捨てる。|damage=9; draw=1; promptsDiscard=1|
|小学生編|BITE|つまみ食い|1|ATTACK|ENEMY|7ダメージ。HP2回復。|damage=7; heal=2|
|小学生編|GIRLS_CAKE_TOPPER|デコレーション・ケーキ|3|POWER|SELF|カードを使用する度、HPを1回復。|applyPower={id:"HEAL_ON_PLAY",amount:1}; cardEffectLogic:名称分岐|
|小学生編|ADRENALINE|テンションMAX|0|SKILL|SELF|E1を得て2枚引く。廃棄。|draw=2; energy=1; exhaust=true|
|小学生編|DOKKO_CHAN|どっこいしょ|1|SKILL|SELF|ブロック5。手札の全カードを強化する。|block=5; upgradeHand=true|
|小学生編|PE_BALL|ドッジボール投球|1|ATTACK|ENEMY|12ダメージ。|damage=12|
|小学生編|BOYS_DRAGON_BUSTER|ドラグニル・バースト|3|ATTACK|ENEMY|35ダメージ。対象にびくびく2。|damage=35; vulnerable=2|
|小学生編|GIRLS_DREAM_CATCHER|ドリーム・キャッチャー|1|SKILL|SELF|山札から好きなカードを1枚手札に加える。|App:名称/ID分岐|
|小学生編|MINE_BLAST_G|トロッコ (芥川)|1|ATTACK|ENEMY|今ターン使用したカード枚数分、ダメージを与える。|damagePerAttackPlayed=4|
|小学生編|GIRLS_RAINBOW_MAGIC|なないろマジック|1|SKILL|SELF|手札のランダムなカードのコストを0にする。|App:名称/ID分岐|
|小学生編|NEZUMI_NO_YOMEIRI|ねずみの嫁入り|1|SKILL|SELF|この戦闘中、被ダメージを1軽減する。|applyPower={id:"BUFFER",amount:1}|
|小学生編|DEFEND|ノートで防御|1|SKILL|SELF|ブロックを5得る。|block=5; App:名称/ID分岐|
|小学生編|BURST|バースト|1|SKILL|SELF|次のスキルを2回発動。|applyPower={id:"BURST",amount:1}|
|小学生編|SANSU_PERCENT|パーセント増量|1|SKILL|SELF|現在のブロック値を1.5倍にする。|blockMultiplier=1.5|
|小学生編|GIRLS_HEART_BLOOM|ハートフル・ブルーム|1|SKILL|SELF|HPを8回復。ブロック8。|block=8; heal=8|
|小学生編|SYAKAI_MARKET|バザーの掘り出し物|1|SKILL|SELF|ランダムなポーションを1つ得る。|addPotion=true; cardEffectLogic:名称分岐|
|小学生編|OFFERING|パシリ|0|SKILL|SELF|自分に6ダメージ。E2と3枚ドロー。廃棄。|draw=3; energy=2; selfDamage=6; exhaust=true|
|小学生編|OUT_CANDY_BOMB|パチパチキャンディ|2|ATTACK|ENEMY|4ダメージを7回与える。|damage=4; playCopies=6|
|小学生編|BACKFLIP|バック転|1|SKILL|SELF|ブロック5。2枚引く。|block=5; draw=2|
|小学生編|NEVERENDING_STORY|はてしない物語|3|POWER|SELF|ターンの開始時、全てのカードのコストを1下げる。|applyPower={id:"COST_REDUCTION",amount:1}|
|小学生編|MADNESS|パニック|0|SKILL|SELF|手札のランダムなカード1枚のコストを0にする。廃棄。|exhaust=true; cardEffectLogic:名称分岐|
|小学生編|RIKA_SPRING|バネの弾力|1|SKILL|SELF|ブロック5。次に使う攻撃のダメージ2倍。|block=5; App:名称/ID分岐|
|小学生編|ROSE|バラ|1|ATTACK|ENEMY|12ダメージ。ドクドク4。廃棄。|damage=12; poison=4; exhaust=true|
|小学生編|FORCE_FIELD|バリア|3|SKILL|SELF|ブロック12。|block=12|
|小学生編|SLICE|ひっかく|0|ATTACK|ENEMY|6ダメージ。|damage=6|
|小学生編|SUNFLOWER|ヒマワリ|0|SKILL||エナジー1。1枚引く。廃棄。|draw=1; energy=1; exhaust=true|
|小学生編|GIRLS_SUN_FLOWER|ひまわりスマイル|1|SKILL|SELF|ムキムキ2、カチカチ2を得る。廃棄。|exhaust=true; strength=2; applyPower={id:"DEXTERITY",amount:2}|
|小学生編|GIRLS_BUTTERFLY|ひらひら蝶々|0|SKILL|SELF|ブロック4。1枚引く。|block=4; draw=1|
|小学生編|BRILLIANCE|ひらめき|1|ATTACK|ALL_ENEMIES|12ダメージ。HP2回復。|damage=12; heal=2|
|小学生編|SUNDER|ビリビリに破る|3|ATTACK|ENEMY|24ダメージ。たおせばE3回復。|damage=24; fatalEnergy=3|
|小学生編|SWORD_BOOMERANG|ブーメラン|1|ATTACK|RANDOM_ENEMY|ランダムな敵に3ダメージを3回。エナジー1を得る。|damage=3; playCopies=2; cardEffectLogic:名称分岐|
|小学生編|PE_DANCE|フォークダンス|1|SKILL|SELF|手札を1枚コピーし、手札を1枚捨てる。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|BOYS_CYBER_BLADE|プラズマ・ブレード|1|ATTACK|ENEMY|12ダメージ。このカードは常に強化状態で生成される。|damage=12|
|小学生編|OUT_MODEL_BUILD|プラモデル製作|3|POWER|SELF|カードを使用する度、ブロック2を得る。|applyPower={id:"AFTER_IMAGE",amount:2}|
|小学生編|ALL_OUT_STRIKE|フルスイング|1|ATTACK|ALL_ENEMIES|敵全体に10ダメージ。手札1枚捨てる。|damage=10; promptsDiscard=1|
|小学生編|BOYS_ROBOT_BOOST|フルドライブ|0|SKILL|SELF|エナジー2を得る。このターン中のみムキムキ5。|energy=2; strength=5; applyPower={id:"LOSE_STRENGTH",amount:5}|
|小学生編|CHOKE|ヘッドロック|2|ATTACK|ENEMY|12ダメージ。ドクドク5を与える。|damage=12; poison=5|
|小学生編|BOKKO_CHAN|ボッコちゃん|1|SKILL|SELF|トゲトゲ4(反撃)を得る。|applyPower={id:"THORNS",amount:4}|
|小学生編|BODY_SLAM|ボディスラム|1|ATTACK|ENEMY|現在のブロック値分のダメージを与える。|damage=0; damageBasedOnBlock=true|
|小学生編|RIKA_VOLCANO|マグマの噴火|3|ATTACK|ENEMY|25ダメージ。対象にドクドク5。|damage=25; poison=5|
|小学生編|BOYS_STRENGTH_UP|マッスル・ビルド|1|SKILL|SELF|ムキムキ2を得る。|strength=2|
|小学生編|PE_GYM_MAT|マット運動|1|SKILL|SELF|ブロック10。|block=10|
|小学生編|MANDRAKE_ROOT|マンドレイク|0|SKILL|ALL_ENEMIES|敵全体をびくびく3にする。敵全体にドクドク10。廃棄。|poison=10; exhaust=true; vulnerable=3|
|小学生編|GIRLS_MAGIC_WAND|ミラクル・ステッキ|1|ATTACK|ENEMY|10ダメージ。カードを1枚引く。|damage=10; draw=1|
|小学生編|GIRLS_MOON_LIGHT|ムーンライト・ステップ|1|SKILL|SELF|ブロック12。廃棄。|block=12; exhaust=true|
|小学生編|YATSUATARI|むしゃくしゃ|1|ATTACK|ENEMY|8ダメージ。使用する度、この戦闘中ダメージ+5。|damage=8; App:名称/ID分岐|
|小学生編|MELOS_TRUST|メロスの信実|2|SKILL|SELF|ブロック12を得る。|block=12|
|小学生編|MOMO_TIME|モモ|2|POWER|SELF|余ったエナジーを次のターンに持ち越す。|applyPower={id:"ICE_CREAM",amount:1}|
|小学生編|BLOOD_FOR_BLOOD|やられたらやり返す|2|ATTACK|ENEMY|18ダメージ。自分に3ダメージ。|damage=18; selfDamage=3|
|小学生編|INFLAME|やる気スイッチ|1|POWER|SELF|ムキムキを2得る。|strength=2|
|小学生編|YGGDRASIL|ユグドラシル|3|SKILL||デッキの全カードを強化。廃棄。|exhaust=true; upgradeDeck=true|
|小学生編|YODAKA_NO_HOSHI|よだかの星|1|ATTACK|ALL_ENEMIES|自分に4ダメージ。全体に15ダメージ。|damage=15; selfDamage=4|
|小学生編|OUT_MORNING_EXERCISE|ラジオ体操皆勤賞|2|POWER|SELF|ムキムキ2、カチカチ2を得る。|strength=2; applyPower={id:"DEXTERITY",amount:2}|
|小学生編|OUT_RADIO_CONTROL|ラジコン操作|4|ATTACK|RANDOM_ENEMY|9ダメージを5回与える。|damage=9; playCopies=4|
|小学生編|BOYS_FINAL_FANTASY|ラスト・ファンタジー|3|ATTACK|ENEMY|この戦闘で使ったカード1枚につき5ダメージ。|damagePerAttackPlayed=5|
|小学生編|GIRLS_LOVELY_KISS|ラブリー・キッス|1|ATTACK|ENEMY|8ダメージ。HPを全ダメージ分回復。|damage=8; lifesteal=true|
|小学生編|CLOTHESLINE|ラリアット|2|ATTACK|ENEMY|12ダメージ。対象にへろへろ2を与える。|damage=12; weak=2|
|小学生編|BASH|ランドセルタックル|2|ATTACK|ENEMY|8ダメージ。対象にびくびく2を与える。|damage=8; vulnerable=2|
|小学生編|RIKA_LITMUS|リトマス試験紙|1|SKILL|ENEMY|対象にへろへろ2、びくびく2を付与。|vulnerable=2; weak=2|
|小学生編|BOYS_REVENGE|リベンジ・バースト|1|ATTACK|ENEMY|今ターン失ったHPの2倍のダメージを与える。|damage=0; App:名称/ID分岐|
|小学生編|BEAM_CELL|レーザーポインター|0|ATTACK|ENEMY|4ダメージ。びくびく1を与える。|damage=4; vulnerable=1|
|小学生編|OUT_ROLLER_BLADE|ローラーシューズ|2|SKILL|SELF|このターン、全手札のコストを0にする。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|ENVENOM|悪口|2|POWER|SELF|攻撃時ドクドク1付与。|applyPower={id:"ENVENOM",amount:1}|
|小学生編|BOYS_DARK_PACT|悪魔の契約|0|SKILL|SELF|自分に6ダメージ。エナジー3を得る。|energy=3; selfDamage=6|
|小学生編|GIRLS_CANDY_SHOWER|飴玉の嵐|1|ATTACK|ALL_ENEMIES|全体に3ダメージを3回。へろへろ1を与える。|damage=3; playCopies=2; cardEffectLogic:名称分岐|
|小学生編|CALM_LAVENDER|安らぎのラベンダー|1|SKILL||次ターン、エナジー2。廃棄。|exhaust=true; nextTurnEnergy=2|
|小学生編|BOYS_SHADOW_STEP|暗影の歩法|1|SKILL|SELF|ブロック8。カードを2枚引く。|block=8; draw=2|
|小学生編|BOYS_BLACK_HOLE|暗黒の特異点|3|SKILL|ALL_ENEMIES|敵全体をへろへろ3、びくびく3にする。|vulnerable=3; weak=3|
|小学生編|SANSU_CALC_SPEED|暗算|0|SKILL|SELF|カードを2枚引く。1枚捨てる。|draw=2; promptsDiscard=1|
|小学生編|NOXIOUS_FUMES|異臭騒ぎ|1|POWER|SELF|毎ターン敵全体にドクドク2。|applyPower={id:"NOXIOUS_FUMES",amount:2}|
|小学生編|MEDICINAL_ALOE|医薬のアロエ|1|SKILL||HPを20回復。廃棄。|heal=20; exhaust=true|
|小学生編|GIRLS_UNICORN_STRIKE|一角獣の突進|2|ATTACK|ENEMY|20ダメージ。対象にへろへろ2。|damage=20; weak=2|
|小学生編|ISSUN_BOSHI|一寸法師|0|ATTACK|ENEMY|3ダメージを3回与える。ブロック3。|damage=3; playCopies=2; cardEffectLogic:名称分岐|
|小学生編|MIND_BLAST|一夜漬け|2|ATTACK|ENEMY|山札の枚数分ダメージ。|damage=0; innate=true; damagePerCardInDraw=1|
|小学生編|CLOAK_AND_DAGGER|隠し芸|1|SKILL|SELF|ブロック6。えんぴつの削りかす1枚得る。|block=6; addCardToHand={cardName:"SHIV",count:1,cost0:true}|
|小学生編|SPACE_GREETING|宇宙のあいさつ|0|SKILL|ALL_ENEMIES|敵全体にびくびく1とへろへろ1。|vulnerable=1; weak=1|
|小学生編|URASHIMA_TARO|浦島太郎|2|SKILL|ALL_ENEMIES|敵全体を2ターン「へろへろ」にする。廃棄。|exhaust=true; weak=2|
|小学生編|BOYS_SHADOW_CLONE|影分身の術|2|SKILL|SELF|手札の全アタックカードをコピーする。|promptsCopy=5; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|BOYS_SHADOW_BIND|影縫いの太刀|1|ATTACK|ENEMY|8ダメージ。対象をへろへろ2にする。|damage=8; weak=2|
|小学生編|GIRLS_ETERNAL_LOVE|永遠の約束|3|POWER|SELF|敗北時、HP50%で1度だけ復活する。|applyPower={id:"LIZARD_TAIL",amount:1}|
|小学生編|SANSU_CHART|円グラフ|1|SKILL|SELF|カードを3枚引き、2枚捨てる。|draw=3; promptsDiscard=2|
|小学生編|BOYS_FLAME_DRIVE|焔の突撃|1|ATTACK|ENEMY|14ダメージ。自分に1ダメージ。|damage=14; selfDamage=1|
|小学生編|OUT_MASK_HERO|縁日のお面|2|POWER|SELF|次に受けるHPダメージを1回0にする。|applyPower={id:"BUFFER",amount:1}|
|小学生編|INFINITE_BLADES|鉛筆削り|1|POWER|SELF|毎ターン手札にえんぴつの削りかすを加える。|applyPower={id:"INFINITE_BLADES",amount:1}|
|小学生編|TWIN_STRIKE|往復ビンタ|1|ATTACK|ENEMY|5ダメージを2回与える。|damage=5; playCopies=1|
|小学生編|PE_CHEER|応援合戦|1|SKILL|SELF|ムキムキ2を得る。|strength=2|
|小学生編|GOLDEN_WHEAT|黄金の小麦|1|ATTACK|ENEMY|10ダメージ。これで倒すと最大HP+4。廃棄。|damage=10; exhaust=true; fatalMaxHp=4|
|小学生編|OUT_YAKISOBA|屋台の焼きそば|1|SKILL|SELF|ムキムキ4を得る。次ターン、エナジー-1。|strength=4; nextTurnEnergy=-1|
|小学生編|BOYS_SONIC_WAVE|音速の波動|1|ATTACK|ALL_ENEMIES|全体に8ダメージ。カードを1枚引く。|damage=8; draw=1|
|小学生編|CATALYST|化学反応|1|SKILL|ENEMY|ドクドクを2倍にする。廃棄。|exhaust=true; poisonMultiplier=2|
|小学生編|OUT_WOOD_CRAFT|夏休みの工作|4|POWER|SELF|ターン終了時、ブロック10を得る。|applyPower={id:"METALLICIZE",amount:10}|
|小学生編|OUT_FESTIVAL_FIRE|夏祭りの打ち上げ花火|4|ATTACK|ALL_ENEMIES|14ダメージ。敵全体にドクドク6。|damage=14; poison=6|
|小学生編|LIMIT_BREAK|火事場の馬鹿力|1|SKILL|SELF|ムキムキを倍にする。廃棄。|exhaust=true; doubleStrength=true|
|小学生編|HANASAKA_JIISAN|花咲かじいさん|1|SKILL|ALL_ENEMIES|敵全体に5ダメージを与え、味方全員のHPを2回復。|damage=5; heal=2|
|小学生編|GIRLS_FLOWER_GARDEN|花咲く乙女の庭|1|POWER|SELF|ターン終了時、HPを2回復する。|applyPower={id:"REGEN",amount:2}|
|小学生編|GIRLS_BALLERINA|華麗な舞|0|SKILL|SELF|ブロック6。次に使うアタックを強化。|block=6; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_MOSQUITO_WAR|蚊との死闘|2|ATTACK|ENEMY|2ダメージを8回与える。|damage=2; playCopies=7|
|小学生編|FEEL_NO_PAIN|我慢大会|1|POWER|SELF|廃棄する度ブロック3を得る。|applyPower={id:"FEEL_NO_PAIN",amount:3}|
|小学生編|FLECHETTES|画鋲投げ|1|ATTACK|ENEMY|4ダメージ。手札のスキル枚数分攻撃。|damage=4; hitsPerSkillInHand=1|
|小学生編|DEFLECT|回避|0|SKILL|SELF|ブロック4を得る。|block=4|
|小学生編|OUT_PIRATE_PLAY|海賊ごっこ|2|ATTACK|ENEMY|10ダメージ。50ゴールドを得る。|damage=10; gold=50|
|小学生編|RIKA_ECLIPSE|皆既日食|2|SKILL|ALL_ENEMIES|敵全体をへろへろ2、びくびく2にする。|vulnerable=2; weak=2|
|小学生編|OUT_STREET_PERFORM|街頭パフォーマンス|2|SKILL|ALL_ENEMIES|35ゴールドを得る。敵全体をへろへろ2にする。|gold=35; weak=2|
|小学生編|APOTHEOSIS|覚醒|2|SKILL|SELF|この戦闘中、全カードを強化。廃棄。|exhaust=true; upgradeDeck=true|
|小学生編|AWAKE_COFFEE|覚醒のコーヒー|0|SKILL||エナジー2を得る。1枚引く。HPを1失う。廃棄。|draw=1; energy=2; selfDamage=1; exhaust=true; cardEffectLogic:名称分岐|
|小学生編|SYAKAI_VOTE|学級委員選挙|1|SKILL|SELF|手札をすべて強化する。|upgradeHand=true; cardEffectLogic:名称分岐|
|小学生編|EVENT_FESTIVAL|学芸会の主役|2|POWER|SELF|カードを使用する度、ブロック1を得る。|applyPower={id:"AFTER_IMAGE",amount:1}; cardEffectLogic:名称分岐|
|小学生編|LESSON_LEARNED|学習|1|ATTACK|ENEMY|10ダメージ。たおすと最大HPが恒久的に2増加する。廃棄。|damage=10; exhaust=true; fatalMaxHp=2|
|小学生編|GENETIC_ALGORITHM|学習アルゴリズム|1|SKILL|SELF|ブロック1。この戦闘で使用すると、このカードのブロック値が恒久的に2増加する。廃棄。|block=1; exhaust=true; App:名称/ID分岐|
|小学生編|SANSU_DIVISION|割り算|1|ATTACK|ENEMY|7ダメージ。対象をびくびく1にする。|damage=7; vulnerable=1|
|小学生編|GLASS_KNIFE|割れた窓ガラス|1|ATTACK|ENEMY|8ダメージを2回。|damage=8; playCopies=1|
|小学生編|COLD_SNAP|寒いギャグ|1|ATTACK|ENEMY|6ダメージ。ブロック4を得る。|damage=6; block=4|
|小学生編|RIPE_TOMATO|完熟トマト|0|SKILL||HPを10回復する。廃棄。|heal=10; exhaust=true|
|小学生編|PERFECTED_STRIKE|完璧な回答|2|ATTACK|ENEMY|6ダメージ。デッキの「えんぴつ攻撃」1枚につき+2。|damage=6; damagePerStrike=2|
|小学生編|KOKUGO_KANJI_TEST|漢字小テスト|0|ATTACK|ENEMY|3ダメージ。カードを1枚引く。廃棄。|damage=3; draw=1; exhaust=true|
|小学生編|KOKUGO_NIKKI|観察日記|1|SKILL|SELF|次のターン、カードを2枚引く。|nextTurnDraw=2|
|小学生編|GIRLS_MIRACLE_RIBBON|奇跡のリボン|2|SKILL|SELF|エナジーを全回復。廃棄。|energy=3; exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SANSU_GEOMETRY|幾何学模様|2|POWER|SELF|被ダメージ時、ランダムな敵に5ダメージ。|applyPower={id:"STATIC_DISCHARGE",amount:1}|
|小学生編|LAYERED_CABBAGE|幾重のキャベツ|1|SKILL||ブロック10。ドクドク4を与える。廃棄。|block=10; poison=4; exhaust=true|
|小学生編|EVENT_HOME|帰りの会|1|SKILL|SELF|ブロック20を得る。廃棄。|block=20; exhaust=true|
|小学生編|GIRLS_TIARA_SHIELD|輝くティアラの守り|1|SKILL|SELF|現在のブロック値を2倍にする。|doubleBlock=true|
|小学生編|BERSERK|逆ギレ|0|POWER|SELF|自分にびくびく2を与える。毎ターンエナジー1を得る。|vulnerable=2; applyPower={id:"BERSERK_POWER",amount:1}|
|小学生編|OUT_SLEEP_IN|休日の二度寝|2|SKILL|SELF|HPを12回復。次のターンのエナジー+2、ドロー+2。廃棄。|heal=12; exhaust=true; nextTurnEnergy=2; nextTurnDraw=2; cardEffectLogic:名称分岐|
|小学生編|PIERCING_WAIL|泣き叫ぶ|1|SKILL|ALL_ENEMIES|敵全体にムキムキダウン1を与える。廃棄。|exhaust=true; strength=-6|
|小学生編|OUT_SUPER_GACHA|究極の10連ガチャ|5|SKILL|SELF|ランダムなカード10枚を手札に加える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_MUD_DUMPLING|究極の泥団子|2|ATTACK|ENEMY|20ダメージ。対象にへろへろ3。|damage=20; weak=3|
|小学生編|EVENT_LUNCH|給食の当番|1|SKILL|SELF|手札に「完熟トマト(回復)」を2枚加える。|addCardToHand={cardName:"RIPE_TOMATO",count:2,cost0:true}|
|小学生編|REAPER|給食当番|2|ATTACK|ALL_ENEMIES|全体4ダメージ。未ブロック分HP回復。|damage=4; lifesteal=true|
|小学生編|J_A_X|牛乳一気飲み|0|SKILL|SELF|ムキムキ3を得る。ターン終了時3失う。|strength=3; applyPower={id:"LOSE_STRENGTH",amount:3}|
|小学生編|BOYS_TITAN_SHIELD|巨神の盾|3|SKILL|SELF|ブロック40。|block=40|
|小学生編|GIANT_VINE|巨大なツル|2|ATTACK|ALL_ENEMIES|全体15ダメージ。敵全体をへろへろ2にする。廃棄。|damage=15; exhaust=true; weak=2|
|小学生編|OUT_SNOW_MAN|巨大雪だるま|5|SKILL|SELF|ブロック50。廃棄。|block=50; exhaust=true|
|小学生編|BOYS_VOID_SLASH|虚空の断罪|2|ATTACK|ENEMY|15ダメージを2回。廃棄。|damage=15; exhaust=true; playCopies=1|
|小学生編|BOYS_VOID_ARMOR|虚無の鎧|2|POWER|SELF|ターン終了時、ブロックが消えなくなる。|applyPower={id:"BARRICADE",amount:1}|
|小学生編|TERROR|恐怖|1|SKILL|ENEMY|びくびく3を与える。廃棄。|exhaust=true; vulnerable=3|
|小学生編|BOYS_BERSERK_MODE|狂戦士の咆哮|0|SKILL|ENEMY|ムキムキ3を得る。対象をびくびく2にする。自分に3ダメージ。|selfDamage=3; strength=3; vulnerable=2|
|小学生編|SEEING_RED|興奮|0|SKILL|SELF|エナジー2を得る。廃棄。|energy=2; exhaust=true|
|小学生編|KAGAMI_HOSHI|鏡 (星新一)|1|SKILL|SELF|手札のカード1枚をコピーして手札に加える。自分にびくびく1。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|ECHO_BLUEBELL|響き渡る鈴蘭|1|SKILL|ALL_ENEMIES|敵全体をびくびく2にする。廃棄。|exhaust=true; vulnerable=2|
|小学生編|OUT_BATH_TIME|極楽の銭湯|3|SKILL|SELF|最大HP+3。HP16回復。廃棄。|heal=16; exhaust=true; fatalMaxHp=3|
|小学生編|GOKURAKU_HASU|極楽の蓮|1|SKILL|SELF|HPを4回復。廃棄。|heal=4; exhaust=true|
|小学生編|FORBIDDEN_APPLE|禁断のリンゴ|0|SKILL||最大HP+5。廃棄。|exhaust=true; fatalMaxHp=5|
|小学生編|OUT_DOG_BARK|近所の番犬|2|SKILL|ALL_ENEMIES|敵全体をへろへろ2、びくびく2にする。|vulnerable=2; weak=2|
|小学生編|OUT_HAUNTED_HOUSE|近所の幽霊屋敷|3|SKILL|ENEMY|対象をびくびく6にする。|vulnerable=6|
|小学生編|OUT_GOLD_FISH|金魚すくい|1|SKILL|SELF|アタックを1枚選ぶ。この戦闘中、それは強化され、0コスト、+6ダメージ、廃棄を得る。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|GALAXY_EXPRESS|銀河鉄道の夜|1|SKILL|SELF|山札の上から5枚を見る。1枚選び手札に加え、残りを捨てる。|draw=1; App:名称/ID分岐|
|小学生編|SANSU_KUKU|九九の連鎖|2|ATTACK|ENEMY|9ダメージ。今ターン使用した攻撃枚数分ダメージ追加。|damage=9; damagePerAttackPlayed=2|
|小学生編|OUT_SECRET_BASE|空き地の秘密基地|3|POWER|SELF|ターン終了時、ブロック8を得る。|applyPower={id:"METALLICIZE",amount:8}|
|小学生編|CAUSTIC_WASABI|劇薬ワサビ|1|SKILL|ENEMY|ドクドクを3倍にする。廃棄。|exhaust=true; poisonMultiplier=3|
|小学生編|HOT_CHILI|激辛トウガラシ|1|POWER||ムキムキ3を得る。|strength=3|
|小学生編|RIDDLE_WITH_HOLES|穴だらけ|2|ATTACK|ENEMY|3ダメージを5回。|damage=3; playCopies=4|
|小学生編|GIRLS_MOON_SERENADE|月光のセレナーデ|1|SKILL|SELF|エナジー1を得る。2枚引く。廃棄。|draw=2; energy=1; exhaust=true|
|小学生編|OUT_PET_WALK|犬の散歩|2|ATTACK|ENEMY|14ダメージ。次ターンのエナジー+1。|damage=14; nextTurnEnergy=1|
|小学生編|SENTINEL|見張り|1|SKILL|SELF|ブロック5。|block=5|
|小学生編|RIKA_MICROSCOPE|顕微鏡|1|SKILL|ENEMY|敵をびくびく2にする。次のターン、カードを1枚引く。|vulnerable=2; cardEffectLogic:名称分岐|
|小学生編|GIRLS_CUPCAKE_BOOST|元気が出るカップケーキ|0|SKILL|SELF|ムキムキ2を得る。廃棄。|exhaust=true; strength=2|
|小学生編|BOYS_PHANTOM_EDGE|幻影の刃|0|ATTACK|ENEMY|6ダメージ。廃棄。|damage=6; exhaust=true|
|小学生編|MYSTIC_MUSHROOM|幻覚キノコ|1|SKILL||ランダムなカード2枚を手札に加える。廃棄。|exhaust=true; addCardToHand={cardName:"DISCOVERY",count:1}; App:名称/ID分岐|
|小学生編|KOKUGO_KOTONOHA|言の葉|1|SKILL|ENEMY|ドクドク5を与える。|poison=5|
|小学生編|SYAKAI_TEMPLE|古い寺院|1|SKILL|SELF|全デバフを解除する。|applyPower={id:"CLEAR_DEBUFFS",amount:1}|
|小学生編|BOYS_WOLF_PACK|孤狼の群れ|2|ATTACK|ENEMY|9ダメージ。手札のアタック1枚につき+3。|damage=9|
|小学生編|TORA_HO|虎咆|2|ATTACK|ALL_ENEMIES|全体12ダメージ。びくびく1。|damage=12; vulnerable=1|
|小学生編|KOKUGO_GOKAN|五感の表現|1|SKILL|ALL_ENEMIES|敵全体をへろへろ2にする。|weak=2|
|小学生編|KOKUGO_GOKO|五光|2|ATTACK|ENEMY|20ダメージ。キラキラ1を得る。|damage=20; applyPower={id:"ARTIFACT",amount:1}|
|小学生編|KOKUGO_HAIKU|五七五|1|ATTACK|ENEMY|6ダメージを3回与える。|damage=6; playCopies=2|
|小学生編|WAGAHAI_NEKO|吾輩は猫である|0|SKILL|SELF|ブロック3。カード1枚引く。|block=3; draw=1|
|小学生編|SYAKAI_TRADE|交換留学生|1|SKILL|SELF|手札を1枚廃棄し、カードを2枚引く。|draw=2; promptsExhaust=1|
|小学生編|RIKA_PHOTOSYNTHESIS|光合成|1|SKILL|SELF|エナジー1を得る。HP2回復。|heal=2; energy=1|
|小学生編|OUT_PARK_SWING|公園のブランコ|4|ATTACK|ALL_ENEMIES|30ダメージ。敵全体にびくびく2。|damage=30; vulnerable=2|
|小学生編|OUT_LAST_BATTLE|公園の決戦|6|ATTACK|ALL_ENEMIES|全体に30ダメージを2回。|damage=30; playCopies=1|
|小学生編|OUT_PARK_FOUNTAIN|公園の噴水|1|SKILL|SELF|HPを7回復。全デバフ解除。|heal=7; applyPower={id:"CLEAR_DEBUFFS",amount:1}|
|小学生編|CLASH|口喧嘩|0|ATTACK|ENEMY|14ダメージ。手札がアタックのみの時のみ使用可。|damage=14; playCondition="HAND_ONLY_ATTACKS"|
|小学生編|BLADE_DANCE|工作の時間|1|SKILL|SELF|手札にえんぴつの削りかす(0コス4ダメ)を3枚加える。|addCardToHand={cardName:"SHIV",count:3,cost0:true}|
|小学生編|OUT_CONSTRUCTION|工事現場の重機|4|ATTACK|ENEMY|40ダメージ。対象の攻撃力を2下げる。|damage=40; applyPower={id:"STRENGTH_DOWN",amount:2}; cardEffectLogic:名称分岐|
|小学生編|SYAKAI_LAW|校則遵守|1|SKILL|SELF|キラキラ2（デバフ無効）を得る。|applyPower={id:"ARTIFACT",amount:2}|
|小学生編|SYAKAI_NEWS|校内ニュース|1|SKILL|ALL_ENEMIES|敵全体をへろへろ2にする。|weak=2|
|小学生編|BOYS_VOLCANO_CRASH|紅蓮爆華|3|ATTACK|ALL_ENEMIES|全体に20ダメージ。自分に5ダメージ。|damage=20; selfDamage=5|
|小学生編|KOKUGO_YOMITOKI|行間を読む|1|SKILL|SELF|次のターン、エナジー1を得る。|nextTurnEnergy=1|
|小学生編|FRAGRANT_JASMINE|香華のジャスミン|1|POWER||ターン開始時に追加で2枚引く。|applyPower={id:"DRAW_POWER_2",amount:2}|
|小学生編|STURDY_BAMBOO|剛健な竹|1|SKILL||現在のブロック値を倍にする。廃棄。|exhaust=true; doubleBlock=true|
|小学生編|POWER_SHIITAKE|剛力のシイタケ|1|SKILL||ムキムキ2を得る。廃棄。|exhaust=true; strength=2|
|小学生編|KOKUGO_DICTIONARY|国語辞典|2|SKILL|SELF|手札のカードを2枚コピーする。廃棄。|exhaust=true; promptsCopy=2; cardEffectLogic:名称分岐|
|小学生編|OUT_SAND_CASTLE|砂浜の城|2|SKILL|SELF|ブロック30。次ターンのエナジー-1。|block=30; nextTurnEnergy=-1|
|小学生編|REBOOT|再起動|0|SKILL|SELF|捨て札を山札に戻し、4枚引く。廃棄。|draw=4; exhaust=true; shuffleHandToDraw=true|
|小学生編|OUT_KICKBOARD|最強のキックボード|3|ATTACK|ENEMY|30ダメージ。|damage=30|
|小学生編|OUT_TRADING_CARD|最強の激レアカード|2|ATTACK|ENEMY|デッキのカード枚数ダメージ。|damagePerCardInDraw=1|
|小学生編|OUT_PAPER_PLANE_ULTRA|最強の紙飛行機|4|ATTACK|ALL_ENEMIES|全体に20ダメージ。|damage=20|
|小学生編|OUT_SUMMER_HOMEWORK|最後の宿題|5|ATTACK|ALL_ENEMIES|全体に50ダメージ。廃棄。|damage=50; exhaust=true|
|小学生編|RIKA_BACTERIA|細菌の増殖|1|SKILL|ENEMY|ドクドクを3倍にする。廃棄。|exhaust=true; poisonMultiplier=3|
|小学生編|KOROSHIYA|殺し屋ですのよ|1|ATTACK|ENEMY|9ダメージ。たおすとエナジー2を得る。|damage=9; fatalEnergy=2|
|小学生編|CLEAVE|雑巾がけ|1|ATTACK|ALL_ENEMIES|敵全体に8ダメージ。|damage=8|
|小学生編|SANSU_TRIANGLE|三角定規|1|ATTACK|ENEMY|8ダメージ。1枚引く。|damage=8; draw=1|
|小学生編|OUT_UMBRELLA_SWORD|傘チャンバラ|4|ATTACK|ENEMY|12ダメージを3回。ブロック12。|damage=12; block=12; playCopies=2|
|小学生編|CALCULATED_GAMBLE|山勘|0|SKILL|SELF|手札を全て捨て、同じ枚数引く。|App:名称/ID分岐|
|小学生編|SANGETSUKI|山月記|2|POWER|SELF|ムキムキ2を得る。|strength=2|
|小学生編|SYAKAI_REVOLUTION|産業革命|0|SKILL|SELF|エナジー2を得る。1枚引く。次のターンにエナジー1を得る。廃棄。|energy=2; exhaust=true; cardEffectLogic:名称分岐|
|小学生編|SWORD_DAIKON|斬鉄ダイコン|2|ATTACK|ENEMY|28ダメージ。廃棄。|damage=28; exhaust=true|
|小学生編|LUCKY_CLOVER|四つ葉のクローバー|0|SKILL||キラキラ2を得る。廃棄。|exhaust=true; applyPower={id:"ARTIFACT",amount:2}|
|小学生編|KOKUGO_SYUKUGO|四字熟語|1|ATTACK|ENEMY|4ダメージを4回与える。|damage=4; playCopies=3|
|小学生編|OFFERING_BLOOD|指切りげんまん|0|SKILL|SELF|自分に4ダメージ、E2とドロー2。|draw=2; energy=2; selfDamage=4|
|小学生編|KOKUGO_SYODO|止め・跳ね・払い|1|ATTACK|ENEMY|9ダメージ。対象をびくびく1にする。|damage=9; vulnerable=1|
|小学生編|ULTIMATE_BONSAI|至高の盆栽|1|ATTACK|ENEMY|現在のブロック値分ダメージ。廃棄。|damage=0; exhaust=true; damageBasedOnBlock=true|
|小学生編|RIKA_EXPERIMENTAL|試験管の爆発|2|ATTACK|ALL_ENEMIES|全体12ダメージ。自分に2ダメージ。|damage=12; selfDamage=2|
|小学生編|BOYS_SAMURAI_SPIRIT|侍の魂|1|POWER|SELF|アタックを使う度、ブロック2を得る。|applyPower={id:"AFTER_IMAGE",amount:2}|
|小学生編|PE_MARATHON|持久走|2|POWER|SELF|毎ターン開始時、ブロック4を得る。|applyPower={id:"METALLICIZE",amount:4}|
|小学生編|TIME_THIEF|時間どろぼう|0|ATTACK|ENEMY|5ダメージ。敵の次の行動を1ターン遅らせる。廃棄。|damage=5; exhaust=true; App:名称/ID分岐|
|小学生編|BOYS_SPACE_MINE|次元地雷|1|SKILL|ENEMY|対象にドクドク15。|poison=15|
|小学生編|BOYS_SPACE_WARP|次元跳躍|2|SKILL|SELF|手札と山札の全ての状態異常・呪いを消滅させ、その数だけムキムキを永続強化する。廃棄。|exhaust=true; cardEffectLogic:名称分岐|
|小学生編|RIKA_MAGNET|磁石の力|1|SKILL|SELF|捨て札からランダムなカードを1枚手札に加える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|BOYS_DEFENCE_SYS|自動防衛システム|1|POWER|SELF|ターン終了時、ブロック6を得る。|applyPower={id:"METALLICIZE",amount:6}|
|小学生編|CREATIVE_AI|自由研究|3|POWER|SELF|毎ターンランダムなパワー生成。|applyPower={id:"CREATIVE_AI",amount:1}|
|小学生編|OUT_KIMONO_DRESS|七五三の晴れ着|3|POWER|SELF|キラキラ2を得る。|applyPower={id:"ARTIFACT",amount:2}|
|小学生編|RAINBOW_HYDRANGEA|七変化のアジサイ|1|ATTACK|ENEMY|手札の枚数x4ダメージ。廃棄。|damage=0; exhaust=true; damagePerCardInHand=4|
|小学生編|JACHI_BOGYAKU|邪智暴虐|1|SKILL|ENEMY|びくびく2を与える。カードを1枚引く。|vulnerable=2; cardEffectLogic:名称分岐|
|小学生編|SPOT_WEAKNESS|弱点発見|1|SKILL|SELF|ムキムキ+3。|strength=3|
|小学生編|KOKUGO_BUNPO|主語と述語|1|POWER|SELF|カードを使用する度、ブロック1を得る。|applyPower={id:"AFTER_IMAGE",amount:1}|
|小学生編|BOYS_KNIGHT_GUARD|守護騎士の盾|2|SKILL|SELF|ブロック15。キラキラ1を得る。|block=15; applyPower={id:"ARTIFACT",amount:1}|
|小学生編|OUT_TREASURE_MAP|手作りの宝地図|2|SKILL|SELF|ランダムなレリックを1つ入手する。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_SPARKLER|手持ち花火|2|ATTACK|ENEMY|2ダメージを10回与える。対象にドクドク4。|damage=2; poison=4; playCopies=9|
|小学生編|BUY_GLOVES|手袋を買いに|1|SKILL|SELF|カチカチ2(ブロック強化)を得る。|applyPower={id:"DEXTERITY",amount:2}|
|小学生編|SANSU_ABACUS_MASTER|珠算十段|1|ATTACK|ENEMY|12ダメージ。倒すと最大HP+2。|damage=12; fatalMaxHp=2|
|小学生編|DEVA_FORM|受験勉強|3|POWER|SELF|ターン開始時、エナジーを得る。毎ターン増加。|applyPower={id:"DEVA_FORM",amount:1}|
|小学生編|EVENT_TRIP|修学旅行の枕|1|ATTACK|ENEMY|8ダメージ。対象をへろへろ2にする。|damage=8; weak=2|
|小学生編|BOYS_BATTLE_STANCE|修羅の構え|0|SKILL|SELF|次のアタックは2回発動する。自分に2ダメージ。|selfDamage=2; App:名称/ID分岐|
|小学生編|AUTUMN_COSMOS|秋空のコスモス|0|SKILL||カードを3枚引く。廃棄。|draw=3; exhaust=true|
|小学生編|FINISHER|終わりのチャイム|1|ATTACK|ENEMY|6ダメージ。今ターン使用攻撃枚数分攻撃。|damage=6; hitsPerAttackPlayed=1|
|小学生編|BOYS_JUDGEMENT|終焉の審判|4|ATTACK|ALL_ENEMIES|全体に60ダメージ。廃棄。|damage=60; exhaust=true|
|小学生編|BATTLE_TRANCE|集中モード|0|SKILL|SELF|3枚引く。|draw=3|
|小学生編|ACCURACY|集中力|1|POWER|SELF|えんぴつの削りかすのダメージ+4。|applyPower={id:"ACCURACY",amount:4}|
|小学生編|CHARGE_BATTERY|充電|1|SKILL|SELF|ブロック7。次ターンエナジー+1。|block=7; nextTurnEnergy=1|
|小学生編|HEAVY_BLADE|重いバット|2|ATTACK|ENEMY|14ダメージ。ムキムキ効果3倍。|damage=14; strengthScaling=3|
|小学生編|BOYS_GRAVITY_PRESS|重力100倍プレス|2|ATTACK|ENEMY|現在のブロック値の2倍のダメージ。|damageBasedOnBlock=true|
|小学生編|RIKA_GRAVITY|重力の法則|2|ATTACK|ENEMY|15ダメージ。対象の攻撃力を2下げる。|damage=15; strength=-2|
|小学生編|DIE_DIE_DIE|宿題宿題|1|ATTACK|ALL_ENEMIES|全体13ダメージ。廃棄。|damage=13; exhaust=true|
|小学生編|OUT_PIZZA_PARTY|出前ピザパーティー|2|SKILL|SELF|自分とパートナーのHPを全回復。使い切り。|heal=99; exhaust=true; consumedOnUse=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|PREPARED|準備|0|SKILL|SELF|1枚引く。1枚捨てる。|draw=1; promptsDiscard=1|
|小学生編|GIRLS_PURE_HEART|純真な心|1|SKILL|SELF|全デバフを解除。カードを2枚引く。|draw=2; applyPower={id:"CLEAR_DEBUFFS",amount:1}|
|小学生編|SACRED_LILY|純白のユリ|1|POWER||次に使うスキルは2回発動する。|applyPower={id:"BURST",amount:1}|
|小学生編|OUT_SHRINE_PRAY|初詣の願い事|2|SKILL|SELF|手札の全カードのコストを0にする。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_FIRST_SUN|初日の出|5|POWER|SELF|ターン開始時にエナジー2を得る。|applyPower={id:"BERSERK_POWER",amount:2}|
|小学生編|OUT_DREAM_FUTURE|将来の夢|3|POWER|SELF|ムキムキ2を得る。毎ターンカードを1枚追加で引く。|strength=2; applyPower={id:"DRAW_POWER",amount:1}|
|小学生編|SYAKAI_COIN|小銭入れ|0|SKILL|SELF|20ゴールドを得る。廃棄。|gold=20|
|小学生編|DAGGER_SPRAY|消しゴム投げ|1|ATTACK|ALL_ENEMIES|全体4ダメージを2回。|damage=4; playCopies=1|
|小学生編|OUT_FIRE_TRUCK|消防署見学|3|SKILL|SELF|ブロック30を得る。|block=30|
|小学生編|IMMOLATE|焼却炉|2|ATTACK|ALL_ENEMIES|全体21ダメージ。自分に2ダメージ。|damage=21; selfDamage=2; App:名称/ID分岐|
|小学生編|CORPSE_EXPLOSION|衝撃のうわさ|3|SKILL|ENEMY|ドクドク6。たおすと全体に最大HPダメージ。|poison=6; applyPower={id:"CORPSE_EXPLOSION",amount:1}; App:名称/ID分岐|
|小学生編|SHOCKWAVE|衝撃波|2|SKILL|ALL_ENEMIES|敵全体にへろへろ3とびくびく3。廃棄。|exhaust=true; vulnerable=3; weak=3|
|小学生編|BOYS_SOLDIER_HUNT|賞金稼ぎ|1|ATTACK|ENEMY|9ダメージ。倒すと20ゴールド。|damage=9; gold=20|
|小学生編|CORRUPTION|賞味期限|3|POWER|SELF|スキルコスト0。使用時廃棄。|applyPower={id:"CORRUPTION",amount:1}|
|小学生編|IRON_WAVE|上履きキック|1|ATTACK|ENEMY|5ダメージ。ブロック5を得る。|damage=5; block=5|
|小学生編|BUFFER|心の壁|2|POWER|SELF|次に受けるHPダメージを0にする。|applyPower={id:"BUFFER",amount:1}|
|小学生編|OUT_GHOST_PHOTO|心霊写真|3|SKILL|ENEMY|対象にドクドク14を付与。|poison=14|
|小学生編|DEEP_BREATH|深呼吸|0|SKILL|SELF|捨て札を山札に戻す。1枚引く。廃棄。|draw=1; exhaust=true; shuffleHandToDraw=true|
|小学生編|BOYS_HERO_AWAKEN|真の勇者覚醒|3|POWER|SELF|毎ターン開始時、エナジー+1、ドロー+1。|applyPower={id:"ENERGY_DRAW_POWER",amount:1}; cardEffectLogic:名称分岐|
|小学生編|OUT_KIMODAMESHI|真夏の肝試し|2|SKILL|ALL_ENEMIES|敵全体の攻撃力を2下げる。|strength=-2; cardEffectLogic:名称分岐|
|小学生編|CRIMSON_MAPLE|真紅のモミジ|1|SKILL||手札を全て強化する。廃棄。|exhaust=true; upgradeHand=true|
|小学生編|OUT_DRAGON_GOD|神社の龍神様|5|ATTACK|ALL_ENEMIES|全体に36ダメージ。HP10回復。|damage=36; heal=10|
|小学生編|BOYS_STRIKE_GOD|神速の連撃|1|ATTACK|ENEMY|3ダメージを6回。|damage=3; playCopies=5|
|小学生編|OUT_FRIEND_FOREVER|親友との約束|4|SKILL|SELF|パートナーの最大HPを20増やし、HPを全回復する。使い切り。|consumedOnUse=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|EVOLVE|進級|1|POWER|SELF|状態異常カードを引いた時、カードを引く。|applyPower={id:"EVOLVE",amount:1}|
|小学生編|OSAMU_NIGHT|人間失格|0|POWER|SELF|使用不可。手札にある限り、毎ターン自分に3ダメージ。|unplayable=true|
|小学生編|GIRLS_MERMAID_SONG|人魚の歌声|2|ATTACK|ALL_ENEMIES|全体に10ダメージ。自分にカチカチ2。|damage=10; applyPower={id:"DEXTERITY",amount:2}|
|小学生編|RIKA_ANATOMY|人体模型|2|SKILL|SELF|スケスケ1（ダメージ1化）を得る。|applyPower={id:"INTANGIBLE",amount:1}; cardEffectLogic:名称分岐|
|小学生編|OUT_LIBRARY_SLEEP|図書室での昼寝|2|SKILL|SELF|全デバフを解除し、HPを全回復。使い切り。|exhaust=true; consumedOnUse=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_RAIN_PUDDLE|水たまりジャンプ|1|SKILL|SELF|ブロック8。次ターンのエナジー+1。|block=8; nextTurnEnergy=1; cardEffectLogic:名称分岐|
|小学生編|OUT_AQUARIUM|水族館のサメ|5|ATTACK|ENEMY|15ダメージを3回。HP5回復。|damage=15; heal=5; playCopies=2|
|小学生編|SYAKAI_HERITAGE|世界遺産登録|1|SKILL|SELF|最大HPを5増やす。廃棄。|exhaust=true; fatalMaxHp=5; cardEffectLogic:名称分岐|
|小学生編|SYAKAI_GLOBAL|世界一周|2|SKILL|SELF|カードを5枚引く。|draw=5|
|小学生編|RUPTURE|成長痛|1|POWER|SELF|HPを失う度、ムキムキ1を得る。|applyPower={id:"RUPTURE",amount:1}|
|小学生編|TOOLS_OF_THE_TRADE|整理整頓|1|POWER|SELF|毎ターン1枚引き1枚捨てる。|applyPower={id:"TOOLS_OF_THE_TRADE",amount:1}|
|小学生編|HOSHI_PRESENT|星のプレゼント|0|SKILL|SELF|ランダムなポーションを1つ得る。廃棄。|exhaust=true|
|小学生編|HOSHI_NO_OJI|星の王子さま|1|SKILL|SELF|最大HP+2。HP2回復。廃棄。|heal=2; exhaust=true; fatalMaxHp=2|
|小学生編|GIRLS_STAR_DUST|星屑のきらめき|1|SKILL|ALL_ENEMIES|対象にびくびく2。カードを1枚引く。|draw=1; vulnerable=2|
|小学生編|REFRESH_MINT|清涼のミント|0|SKILL||全デバフを解除。1枚引く。廃棄。|draw=1; exhaust=true; applyPower={id:"CLEAR_DEBUFFS",amount:1}|
|小学生編|SURVIVOR|生き残り|1|SKILL|SELF|ブロック8。手札を1枚捨てる。|block=8; promptsDiscard=1|
|小学生編|LIFE_MAINTENANCE|生活維持省|2|POWER|SELF|ターン終了時、ブロック6を得る。|applyPower={id:"METALLICIZE",amount:6}|
|小学生編|RIKA_EVOLUTION|生命の進化|2|POWER|SELF|状態異常を引く度、カードを1枚引く。|applyPower={id:"EVOLVE",amount:1}|
|小学生編|KOKUGO_SYUJI|精神統一|0|SKILL|SELF|カチカチ1を得る。自分に1ダメージ。|selfDamage=1; applyPower={id:"DEXTERITY",amount:1}|
|小学生編|SACRED_LOTUS|聖なるハス|0|SKILL||エナジー2。2枚引く。廃棄。|draw=2; energy=2; exhaust=true|
|小学生編|BALL_LIGHTNING|静電気|1|ATTACK|ENEMY|7ダメージ。エナジー1回復。|damage=7; energy=1; App:名称/ID分岐|
|小学生編|RIKA_ELECTRIC|静電気ショック|0|ATTACK|ENEMY|4ダメージ。次ターンエナジー1。|damage=4; nextTurnEnergy=1|
|小学生編|GIRLS_SNOW_FLAKE|雪の結晶|1|SKILL|ALL_ENEMIES|敵全体にへろへろ2。ブロック10。|block=10; weak=2|
|小学生編|NEUTRALIZE|先生に報告|0|ATTACK|ENEMY|3ダメージ。対象にへろへろ1を与える。|damage=3; weak=1|
|小学生編|SCRY|先読み|1|SKILL|SELF|ブロック4を得る。2枚引く。|block=4; draw=2|
|小学生編|THOUSAND_CUTS|千本ノック|2|POWER|ALL_ENEMIES|カード使用時全体1ダメージ。|applyPower={id:"THOUSAND_CUTS",amount:1}|
|小学生編|OUT_FISH_CATCH|川での魚つかみ|2|SKILL|SELF|ランダムなポーションを2つ得る。廃棄。|addPotion=true; exhaust=true; App:名称/ID分岐|
|小学生編|BOYS_SAMURAI_AURA|戦意高揚|1|POWER|SELF|毎ターン開始時、ムキムキ1、カチカチ1を得る。|strength=1; applyPower={id:"DEXTERITY",amount:1}|
|小学生編|OUT_SUPER_HERO_POSE|戦隊ヒーローのポーズ|2|POWER|SELF|ムキムキ2、キラキラ1を得る。この戦闘中、アタックは「使用後に1枚引く」を得る。|strength=2; applyPower={id:"ARTIFACT",amount:1}; App:名称/ID分岐|
|小学生編|ZENITEN_DO|銭天堂|2|SKILL|SELF|手札に「やる気スイッチ(コスト0)」を加える。|addCardToHand={cardName:"INFLAME",count:1,cost0:true}|
|小学生編|BOYS_GENESIS_RAY|創世の光線|4|ATTACK|ALL_ENEMIES|全体に40ダメージ。|damage=40|
|小学生編|CONSECRATE|掃除の時間|0|ATTACK|ALL_ENEMIES|全体5ダメージ。|damage=5|
|小学生編|EARLY_PLUM|早咲きのウメ|0|SKILL||次のターン、エナジー1を得る。廃棄。|exhaust=true; nextTurnEnergy=1|
|小学生編|EXPULSION|早退|1|SKILL|ENEMY|敵のHPが30以下ならすぐにたおす。|App:名称/ID分岐|
|小学生編|QUICK_SLASH|早弁|1|ATTACK|ENEMY|6ダメージ。カードを2枚引く。|damage=6; draw=2|
|小学生編|TOTTO_CHAN|窓ぎわのトットちゃん|1|SKILL|SELF|捨て札を全て山札に戻す。1枚引く。廃棄。|draw=1; exhaust=true; shuffleHandToDraw=true|
|小学生編|ARMAMENTS|装備点検|1|SKILL|SELF|ブロック5。手札すべて強化。|block=5; upgradeHand=true|
|小学生編|HASHIRE_MELOS|走れメロス|1|SKILL|SELF|次ターンE+1。カードを1枚引く。|draw=1; nextTurnEnergy=1|
|小学生編|GOSHI_REVENGE|走れメロス・ラストスパート|0|ATTACK|ENEMY|15ダメージ。|damage=15|
|小学生編|ACROBATICS|側転|1|SKILL|SELF|3枚引く。1枚捨てる。ブロック2。|draw=3; promptsDiscard=1; cardEffectLogic:名称分岐|
|小学生編|TRIP|足払い|0|SKILL|ALL_ENEMIES|敵全体にびくびく2を与える。ブロック3。|vulnerable=2|
|小学生編|SKIM|速読|1|SKILL|SELF|3枚引く。|draw=3|
|小学生編|GRAND_FINALE|卒業式|0|ATTACK|ALL_ENEMIES|全体50ダメージ。山札0の時のみ。|damage=50; playCondition="DRAW_PILE_EMPTY"|
|小学生編|SOLAR_ORANGE|太陽のオレンジ|2|POWER||カチカチ3を得る。|applyPower={id:"DEXTERITY",amount:3}|
|小学生編|RIKA_PLANETS|太陽系の公転|2|POWER|SELF|ターン終了時、敵全体に3ダメージ。|applyPower={id:"MERCURY_HOURGLASS",amount:3}|
|小学生編|OUT_DAGASHI_ALL|駄菓子屋の全買い|3|SKILL|SELF|60ゴールドを得る。カードを3枚引く。廃棄。|draw=3; gold=60; exhaust=true|
|小学生編|CARNAGE|袋叩き|2|ATTACK|ENEMY|20ダメージ。|damage=20|
|小学生編|RAGNAROK|台風|3|ATTACK|RANDOM_ENEMY|5ダメージを5回与える。|damage=5; playCopies=4|
|小学生編|VAULT|大ジャンプ|3|SKILL|SELF|追加ターンを得る。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|GREAT_OAK|大樹のカシ|2|SKILL||ブロック35を得る。廃棄。|block=35; exhaust=true|
|小学生編|THUNDERCLAP|大声|1|ATTACK|ALL_ENEMIES|敵全体に4ダメージとびくびく1。|damage=4; vulnerable=1|
|小学生編|FIEND_FIRE|大掃除|2|ATTACK|ENEMY|手札を全て廃棄。1枚につき7ダメージ。|damage=0; promptsExhaust=99; damagePerCardInHand=7; App:名称/ID分岐|
|小学生編|EVENT_CLEANING|大掃除のホウキ|1|ATTACK|ALL_ENEMIES|全体に7ダメージ。対象をへろへろ1にする。|damage=7; weak=1|
|小学生編|SANSU_UNIT|単位変換|1|SKILL|SELF|手札をすべて入れ替える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SYAKAI_EXPLORER|探検隊|1|ATTACK|ENEMY|8ダメージ。ゴールドを10得る。|damage=8; gold=10|
|小学生編|MELTER|炭酸ジュース|1|ATTACK|ENEMY|10ダメージ。対象のブロックを除去。|damage=10|
|小学生編|SEVER_SOUL|断捨離|2|ATTACK|ENEMY|16ダメージ。手札の非攻撃カードを全廃棄。|damage=16; promptsExhaust=99; App:名称/ID分岐|
|小学生編|SHRUG_IT_OFF|知らんぷり|1|SKILL|SELF|ブロック8。カード1枚引く。|block=8; draw=1|
|小学生編|WISDOM_GINKGO|知恵のイチョウ|1|ATTACK|ENEMY|12ダメージ。これで倒すと永続的に威力+3。廃棄。|damage=12; exhaust=true; fatalPermanentDamage=3|
|小学生編|HEMOKINESIS|知恵熱|1|ATTACK|ENEMY|自分に2ダメージ、15ダメージ。|damage=15; selfDamage=2|
|小学生編|OUT_RADIO_STATION|地元のラジオ局|4|SKILL|SELF|手札のランダムなカード3枚をコピーする。|promptsCopy=3|
|小学生編|KUMO_NO_ITO|蜘蛛の糸|1|SKILL|ENEMY|へろへろ3を与える。|weak=3|
|小学生編|MANY_ORDERS|注文の多い料理店|1|SKILL|ENEMY|びくびく2。へろへろ2。|vulnerable=2; weak=2|
|小学生編|OUT_BUG_BOX|虫かごの秘密|2|SKILL|SELF|手札にランダムな「捕獲」済みカードを加える。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|EVENT_MORNING|朝の会|1|SKILL|SELF|手札をすべて強化する。廃棄。|exhaust=true; upgradeHand=true|
|小学生編|MORNING_GLORY|朝露のアサガオ|0|SKILL|ALL_ENEMIES|敵全体をへろへろ2にする。廃棄。|exhaust=true; weak=2|
|小学生編|SYAKAI_FACTORY|町工場|1|SKILL|SELF|「定規で叩く」を2枚手札に加える。|addCardToHand={cardName:"POMMEL_STRIKE",count:2,cost0:true}|
|小学生編|OUT_PARK_SLIDE|超高速すべり台|4|ATTACK|ENEMY|35ダメージ。1枚引く。|damage=35; draw=1|
|小学生編|BOYS_HEAVY_SMASH|超重力粉砕|3|ATTACK|ENEMY|50ダメージ。廃棄。|damage=50; exhaust=true|
|小学生編|BOYS_RAILGUN|超電磁加速砲|2|ATTACK|ENEMY|24ダメージ。対象のブロックを除去。|damage=24|
|小学生編|PE_VAULTING|跳び箱10段|2|ATTACK|ENEMY|18ダメージ。|damage=18|
|小学生編|OUT_BIRD_WATCH|鳥になった気分|2|SKILL|SELF|手札のカードを2枚コピーする。廃棄。|exhaust=true; promptsCopy=2|
|小学生編|BANE|追い打ち|1|ATTACK|ENEMY|8ダメージ。ドクドク2を与える。|damage=8; poison=2|
|小学生編|TSURU_ONGAESHI|鶴の恩返し|1|SKILL|SELF|HPを6失い、2枚引く。|draw=2; selfDamage=6|
|小学生編|POMMEL_STRIKE|定規で叩く|1|ATTACK|ENEMY|9ダメージ。カード1枚引く。|damage=9; draw=1|
|小学生編|OUT_MUD_FIGHT|泥まみれの決闘|2|ATTACK|ALL_ENEMIES|10ダメージ。敵全体をへろへろ2にする。|damage=10; weak=2|
|小学生編|OUT_GAME_NIGHT|徹夜のゲーム大会|4|POWER|SELF|毎ターンエナジー1を得る。自分に1ダメージ。|selfDamage=1; applyPower={id:"BERSERK_POWER",amount:1}|
|小学生編|BOYS_IRON_BLOOD|鉄血の誓い|1|POWER|SELF|HPを失う度、ムキムキ2を得る。|applyPower={id:"RUPTURE",amount:2}|
|小学生編|IMPERVIOUS|鉄壁|2|SKILL|SELF|ブロック30を得る。廃棄。|block=30; exhaust=true|
|小学生編|IRON_PUMPKIN|鉄壁カボチャ|2|SKILL||ブロック25を得る。廃棄。|block=25; exhaust=true|
|小学生編|IRON_CYPRESS|鉄壁のヒノキ|3|POWER||ブロックがターン終了時に消えない。|applyPower={id:"BARRICADE",amount:1}|
|小学生編|BOYS_IRON_WALL|鉄壁の陣|2|SKILL|SELF|ブロック25。廃棄。|block=25; exhaust=true|
|小学生編|PE_HORIZONTAL_BAR|鉄棒の逆上がり|1|SKILL|SELF|捨て札からランダムなカードを1枚手札に戻す。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|RIKA_WEATHER|天気予報|0|SKILL|SELF|山札のトップ3枚を確認して戻すか捨てる。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|GIRLS_ANGEL_WINGS|天使の羽ばたき|0|SKILL|SELF|ブロック5。次のターンのエナジー+1。|block=5; nextTurnEnergy=1|
|小学生編|GIRLS_ANGEL_HEAL|天使の祈り|1|SKILL|SELF|最大HP+2。HP10回復。|heal=10; fatalMaxHp=2|
|小学生編|OUT_TELESCOPE|天体観測|1|SKILL|SELF|カードを2枚引く。次のターン、さらに2枚引く。|draw=2; nextTurnDraw=2; cardEffectLogic:名称分岐|
|小学生編|KOKUGO_TENREI|天礼|3|POWER|SELF|毎ターン開始時、ムキムキ2を得る。|applyPower={id:"DEMON_FORM",amount:2}|
|小学生編|OUT_PARK_HIDE|伝説のかくれんぼ|3|SKILL|SELF|スケスケ2（無敵）を得る。廃棄。|exhaust=true; applyPower={id:"INTANGIBLE",amount:2}; cardEffectLogic:名称分岐|
|小学生編|RITUAL_DAGGER|伝説の鉛筆|1|ATTACK|ENEMY|15ダメージ。敵をたおすと恒久+3強化。廃棄。|damage=15; exhaust=true; fatalPermanentDamage=3|
|小学生編|SYAKAI_CULTURE|伝統文化|1|POWER|SELF|手札に加わるカードを常に強化する。|applyPower={id:"MASTER_REALITY",amount:1}; cardEffectLogic:名称分岐|
|小学生編|OUT_SCARE_CROW|田んぼのかかし|3|SKILL|ALL_ENEMIES|敵全体を2ターン行動不能にする。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|BOYS_CYBER_SHIELD|電磁障壁|1|SKILL|SELF|ブロック10。カードを1枚引く。|block=10; draw=1|
|小学生編|BOYS_MECHA_DIVE|電脳世界へのダイブ|0|SKILL|SELF|カードを3枚引き、1枚捨てる。手札のランダムなカード1枚を0コストにする。|draw=3; promptsDiscard=1; cardEffectLogic:名称分岐|
|小学生編|PROSTRATE|土下座|0|SKILL|SELF|ブロック4。エナジー1を得る。|block=4; energy=1|
|小学生編|OUT_KOTATSU|冬のこたつ|3|POWER|SELF|毎ターン開始時、ブロック7を得る。|applyPower={id:"METALLICIZE",amount:7}|
|小学生編|RIKA_CONSTELLATION|冬の大三角形|2|ATTACK|ENEMY|6ダメージを3回与える。|damage=6; playCopies=2|
|小学生編|WINTER_CAMELLIA|冬枯れのツバキ|1|ATTACK|ENEMY|8ダメージ。HPを全ダメージ分回復。廃棄。|damage=8; exhaust=true; lifesteal=true|
|小学生編|MOMOTARO|桃太郎|1|ATTACK|ENEMY|6ダメージ。手札に「きびだんご(コスト0ブロック5)」を加える。|damage=6; addCardToHand={cardName:"KIBI_DANGO",count:1,cost0:true}|
|小学生編|PEA_SHOOTER|豆鉄砲|1|ATTACK|ENEMY|4ダメージを3回与える。廃棄。|damage=4; exhaust=true; playCopies=2|
|小学生編|APPARITION|透明人間|1|SKILL|SELF|スケスケ(被ダメ1)を得る。廃棄。|exhaust=true; applyPower={id:"INTANGIBLE",amount:1}|
|小学生編|HEADBUTT|頭突き|1|ATTACK|ENEMY|9ダメージ。次ターンの開始時にカードを1枚引く。|damage=9; nextTurnDraw=1|
|小学生編|OUT_ZOO_TRIP|動物園のライオン|5|ATTACK|ENEMY|25ダメージ。対象にびくびく5。|damage=25; vulnerable=5|
|小学生編|GIRLS_PRINCESS_DRESS|憧れのドレスアップ|2|SKILL|SELF|カチカチ3を得る。ブロック10。|block=10; applyPower={id:"DEXTERITY",amount:3}|
|小学生編|POISON_STAB|毒舌|1|ATTACK|ENEMY|6ダメージ。ドクドク3を与える。|damage=6; poison=3|
|小学生編|POISON_IVY|毒蔦アイビー|1|SKILL|ENEMY|ドクドク10を与える。廃棄。|poison=10; exhaust=true|
|小学生編|KOKUGO_RITOKU|読解力|1|SKILL|SELF|次に使うスキルは2回発動する。|applyPower={id:"BURST",amount:1}; cardEffectLogic:名称分岐|
|小学生編|KOKUGO_SAKUBUN|読書感想文|3|SKILL|SELF|手札の非攻撃カードをすべて廃棄する。|promptsExhaust=99; App:名称/ID分岐|
|小学生編|GIRLS_GOSSIP_GIRL|内緒の噂話|1|SKILL|ENEMY|対象にへろへろ3。|weak=3|
|小学生編|PE_JUMP|縄跳び|1|ATTACK|ENEMY|3ダメージを3回与える。HPを1失う。|damage=3; selfDamage=1; playCopies=2; cardEffectLogic:名称分岐|
|小学生編|PE_TEAM|二人三脚|1|SKILL|SELF|ムキムキ1、カチカチ1を得る。|strength=1|
|小学生編|RIKA_ROBOT|二足歩行ロボット|2|POWER|SELF|ターン終了時、ブロック5を得る。|applyPower={id:"METALLICIZE",amount:5}|
|小学生編|DUAL_WIELD|二刀流|1|SKILL|SELF|手札の攻撃/パワーを1枚選び、2枚コピー。|promptsCopy=1; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|RIKA_RAINBOW|虹のプリズム|1|SKILL|SELF|手札のランダムなカード2枚を強化する。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_RAINBOW_CHASE|虹を追いかけて|3|SKILL|SELF|デッキのランダムなカード5枚を強化する。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|SYAKAI_GEOGRAPHY|日本地図|1|SKILL|SELF|カードを3枚引く。|draw=3|
|小学生編|DOOM_AND_GLOOM|日曜の夜|2|ATTACK|ALL_ENEMIES|全体10ダメージ。|damage=10|
|小学生編|BOYS_NINJA_VANISH|忍法・隠れ身|2|SKILL|SELF|スケスケ1（ダメージ1化）を得る。廃棄。|exhaust=true; applyPower={id:"INTANGIBLE",amount:1}|
|小学生編|OUT_TOSHIKOSHI|年越しそば|4|SKILL|SELF|HPを15回復。最大HP+1。|heal=15; fatalMaxHp=1|
|小学生編|SANSU_MULTIPLICATION|倍々ゲーム|2|SKILL|SELF|ムキムキを倍にする。廃棄。|exhaust=true; doubleStrength=true|
|小学生編|OUT_MUSEUM_TRIP|博物館の恐竜|4|ATTACK|ENEMY|38ダメージ。|damage=38|
|小学生編|EXPLOSIVE_PEPPER|爆炎のコショウ|2|ATTACK|ALL_ENEMIES|全体20ダメージ。自分に3ダメージ。廃棄。|damage=20; selfDamage=3; exhaust=true|
|小学生編|DISCOVERY|発見|1|SKILL|SELF|ランダムなカード3枚を手札に加える。|App:名称/ID分岐|
|小学生編|DEMON_FORM|反抗期|3|POWER|SELF|ターン開始時にムキムキ2を得る。|applyPower={id:"DEMON_FORM",amount:2}; App:名称/ID分岐|
|小学生編|AFTER_IMAGE|反復横跳び|1|POWER|SELF|カード使用時ブロック1。|applyPower={id:"AFTER_IMAGE",amount:1}|
|小学生編|GIRLS_GIFT_BOX|秘密のプレゼント|1|SKILL|SELF|ランダムなポーションを2つ得る。廃棄。|addPotion=true; exhaust=true; App:名称/ID分岐|
|小学生編|OUT_SECRET_LETTER|秘密のラブレター|2|SKILL|ENEMY|対象をへろへろ4、びくびく4にする。廃棄。|exhaust=true; vulnerable=4; weak=4; cardEffectLogic:名称分岐|
|小学生編|OUT_HIDDEN_SHORTCUT|秘密の近道|1|SKILL|SELF|カードを3枚引き、1枚捨てる。山札から高コストカードを0コストで1枚手札に加える。|draw=3; promptsDiscard=1; cardEffectLogic:名称分岐|
|小学生編|BARRICADE|秘密基地|3|POWER|SELF|ブロックがターン終了時に消えない。|applyPower={id:"BARRICADE",amount:1}|
|小学生編|FLYING_KNEE|飛び膝蹴り|1|ATTACK|ENEMY|8ダメージ。ブロック3。次ターンE+1。|damage=8; block=3; nextTurnEnergy=1|
|小学生編|GIRLS_FLOWER_BOMB|百花繚乱|4|ATTACK|ALL_ENEMIES|全体に30ダメージ。HP5回復。|damage=30; heal=5|
|小学生編|MALAISE|不快感|2|SKILL|ENEMY|ムキムキ低下2とへろへろ2。廃棄。|exhaust=true; weak=2; applyPower={id:"STRENGTH_DOWN",amount:2}|
|小学生編|ETERNAL_PINE|不老長寿のマツ|2|POWER||ターン終了時、ブロック6を得る。|applyPower={id:"METALLICIZE",amount:6}|
|小学生編|DISARM|武器奪取|1|SKILL|ENEMY|敵のムキムキを2下げる。廃棄。|exhaust=true; strength=-2|
|小学生編|OUT_BALLOON_POP|風船割り|3|ATTACK|ALL_ENEMIES|全体8ダメージを3回与える。|damage=8; playCopies=2|
|小学生編|SANSU_FRACTION|分数の壁|2|POWER|SELF|次に受けるダメージを0にする。|applyPower={id:"BUFFER",amount:1}|
|小学生編|SANSU_PROTRACTOR|分度器アタック|1|ATTACK|ENEMY|10ダメージ。敵をへろへろ1にする。|damage=10; weak=1|
|小学生編|KOKUGO_MOJI|文字の嵐|0|SKILL|SELF|「えんぴつの削りかす」を2枚手札に加える。|addCardToHand={cardName:"SHIV",count:2,cost0:true}|
|小学生編|HYOJU_RIFLE|兵十の火縄銃|2|ATTACK|ENEMY|22ダメージ。廃棄。|damage=22; exhaust=true|
|小学生編|OUT_CRAYON_WALL|壁への落書き|4|POWER|ALL_ENEMIES|毎ターン敵全体にドクドク3。|applyPower={id:"NOXIOUS_FUMES",amount:3}|
|小学生編|CAPTURE_NET|捕獲網|2|ATTACK|ENEMY|10ダメージ。これでたおすと敵をカード化してデッキに加える。廃棄。|damage=10; exhaust=true; capture=true|
|小学生編|GIRLS_JEWELRY_BOX|宝石箱の魔法|2|SKILL|SELF|手札の全てのカードをアップグレードする。廃棄。|exhaust=true; upgradeHand=true|
|小学生編|SANSU_GRID|方眼紙の盾|1|SKILL|SELF|ブロック9。山札に「ケガ」を1枚加える。|block=9; addCardToDraw={cardName:"WOUND",count:1}|
|小学生編|RICH_GRAPE|芳醇なブドウ|1|ATTACK|ENEMY|10ダメージ。ムキムキの効果が3倍になる。廃棄。|damage=10; exhaust=true; strengthScaling=3|
|小学生編|SYAKAI_RICE|豊作の秋|0|SKILL|SELF|HPを5回復する。廃棄。|heal=5; exhaust=true|
|小学生編|BOUNTY_PERSIMMON|豊穣のカキ|1|SKILL||次のターン、追加で2枚引く。廃棄。|exhaust=true; nextTurnDraw=2|
|小学生編|BOTCHAN|坊っちゃん|1|ATTACK|ENEMY|8ダメージ。敵を「びくびく」状態に。|damage=8; vulnerable=1|
|小学生編|WILD_STRIKE|暴れる|1|ATTACK|ENEMY|12ダメージ。山札に「ケガ」を加える。|damage=12; addCardToDraw={cardName:"WOUND",count:1}|
|小学生編|OUT_MY_HERO|僕だけのヒーロー|7|ATTACK|ENEMY|50ダメージ。自分のHPが半分以下の時、コスト0になりダメージが2倍になる。|damage=50; cardEffectLogic:名称分岐|
|小学生編|OUT_SNOWBALL_WAR|本気の雪合戦|3|ATTACK|ENEMY|8ダメージを4回与える。|damage=8; playCopies=3|
|小学生編|GIRLS_CHOCO_VALENTINE|本命チョコ|2|ATTACK|ENEMY|15ダメージ。対象を1ターンスタンさせる。廃棄。|damage=15; exhaust=true; App:名称/ID分岐|
|小学生編|STATIC_DISCHARGE|摩擦熱|1|POWER|SELF|被ダメ時、ランダムに5ダメージ。|applyPower={id:"STATIC_DISCHARGE",amount:1}|
|小学生編|HOLY_GARLIC|魔除けのニンニク|0|SKILL||キラキラ3を得る。廃棄。|exhaust=true; applyPower={id:"ARTIFACT",amount:3}|
|小学生編|SANSU_FORMULA|魔法の方程式|1|SKILL|SELF|カードを2枚引き、エナジー1を得る。|draw=2; energy=1|
|小学生編|GIRLS_MAGIC_CIRCLE|魔法陣の展開|2|POWER|SELF|毎ターン開始時、エナジー1を得る。|applyPower={id:"BERSERK_POWER",amount:1}|
|小学生編|KOKUGO_MANYO|万葉の歌|2|POWER|SELF|ターン開始時に追加で1枚引く。|applyPower={id:"DRAW_POWER",amount:1}|
|小学生編|OUT_STARRY_SKY|満天の星空|4|POWER|SELF|毎ターンカードを1枚追加で引く。|applyPower={id:"DRAW_POWER",amount:1}|
|小学生編|KOKUGO_SYOSETSU|未完の小説|1|SKILL|SELF|捨て札をすべて山札に戻す。廃棄。|exhaust=true; shuffleHandToDraw=true; cardEffectLogic:名称分岐|
|小学生編|SYAKAI_CITY|未来都市|2|POWER|SELF|ターン開始時にエナジー1、ドロー1。|applyPower={id:"ENERGY_DRAW_POWER",amount:1}; cardEffectLogic:名称分岐|
|小学生編|SWEET_CACAO|魅惑のカカオ|0|SKILL||手札を全て捨て、同数引く。廃棄。|exhaust=true; cardEffectLogic:名称分岐|
|小学生編|TULIP_DRAW|魅惑のチューリップ|1|POWER||ターン開始時にカードを1枚引く。|applyPower={id:"DRAW_POWER",amount:1}|
|小学生編|OUT_TOY_STORE|夢のおもちゃ屋|4|SKILL|SELF|ランダムなレジェンダリーカードを1枚生成する。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|GIRLS_RIBBON_BIND|夢見るリボン・バインド|1|SKILL|ENEMY|対象の攻撃力を3下げる。|strength=-3|
|小学生編|GIRLS_MELODY_LINE|夢色メロディ|1|POWER|SELF|スキルを使う度、ブロック3を得る。|applyPower={id:"SKILL_BLOCK",amount:3}|
|小学生編|BOYS_INFINITE_BLADE|無限の剣舞|1|POWER|SELF|毎ターン「幻影の刃」を1枚手札に加える。|applyPower={id:"INFINITE_BLADES",amount:1}|
|小学生編|SANSU_INFINITY|無限大|3|POWER|SELF|ターン開始時にエナジー1を得る。|applyPower={id:"BERSERK_POWER",amount:1}; cardEffectLogic:名称分岐|
|小学生編|BOYS_BLADE_STORM|無尽蔵の剣線|2|ATTACK|RANDOM_ENEMY|5ダメージを5回。|damage=5; playCopies=4|
|小学生編|OUT_STREET_DOG|迷い犬の恩返し|4|SKILL|SELF|次の戦闘開始時、エナジー+3。廃棄。|exhaust=true; cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|OUT_CANDY_SUGAR|綿菓子の雲|1|SKILL|SELF|次のターン、カードを3枚引く。|nextTurnDraw=3|
|小学生編|FLUFFY_DANDELION|綿毛のタンポポ|0|SKILL||「えんぴつの削りかす」を3枚手札に加える。廃棄。|exhaust=true; addCardToHand={cardName:"SHIV",count:3,cost0:true}|
|小学生編|SANSU_AREA|面積計算|1|ATTACK|ENEMY|手札の枚数x3ダメージ。|damagePerCardInHand=3|
|小学生編|MASTER_REALITY|模範解答|1|POWER|SELF|カード生成時アップグレード。|applyPower={id:"MASTER_REALITY",amount:1}|
|小学生編|OUT_CLIMBING_TREE|木登り名人|2|SKILL|SELF|このターン、受けるダメージをすべて1にする。|applyPower={id:"INTANGIBLE",amount:1}|
|小学生編|HYPERBEAM|目からビーム|3|ATTACK|ALL_ENEMIES|全体26ダメージ。|damage=26|
|小学生編|BLIND|目隠し|0|SKILL|ENEMY|へろへろ2を与える。|weak=2|
|小学生編|OUT_GHOST_STORY|夜の怖い話|2|SKILL|ALL_ENEMIES|敵全体をへろへろ4にする。|weak=4|
|小学生編|CORE_SURGE|夜ふかし|1|ATTACK|ENEMY|11ダメージ。キラキラ1を得る。|damage=11; applyPower={id:"ARTIFACT",amount:1}|
|小学生編|OUT_STREET_LIGHT|夜道の街灯|2|SKILL|SELF|カチカチ4を得る。|applyPower={id:"DEXTERITY",amount:4}|
|小学生編|WILLOW_WIND|柳に風|2|SKILL||スケスケ1（無敵）を得る。廃棄。|exhaust=true; applyPower={id:"INTANGIBLE",amount:1}|
|小学生編|HEALING_GINGER|癒やしのショウガ|0|SKILL||HPを5回復。全デバフを解除。廃棄。|heal=5; exhaust=true; applyPower={id:"CLEAR_DEBUFFS",amount:1}|
|小学生編|WRAITH_FORM|幽霊部員|3|POWER|SELF|2ターン無敵(スケスケ)になる。|applyPower={id:"INTANGIBLE",amount:2}|
|小学生編|WARCRY|雄叫び|0|SKILL|SELF|2枚引き、1枚捨てる。廃棄される。|draw=2; exhaust=true; promptsDiscard=1|
|小学生編|OUT_EVENING_CHIME|夕焼けのチャイム|5|SKILL|ALL_ENEMIES|敵全体を即死させる（ボス無効）。廃棄。|exhaust=true; cardEffectLogic:名称分岐|
|小学生編|THIRD_EYE|予習|1|SKILL|SELF|ブロック7。1枚引き、1枚捨てる。|block=7; draw=1; promptsDiscard=1|
|小学生編|ECHO_FORM|予習復習|3|POWER|SELF|毎ターン、最初のカードを2回使用。|applyPower={id:"ECHO_FORM",amount:1}|
|小学生編|YOSEI_HOSHI|妖精 (星新一)|1|SKILL|SELF|HPを10回復。手札のカード1枚を廃棄する。|heal=10; promptsExhaust=1|
|小学生編|RASHOMON|羅生門|1|ATTACK|ENEMY|10ダメージ。敵をたおすと手札のカード1枚を廃棄する。|damage=10; App:名称/ID分岐|
|小学生編|BOYS_THUNDER_FIST|雷神の鉄拳|1|ATTACK|ENEMY|10ダメージ。次のアタックのコスト-1。|damage=10; App:名称/ID分岐|
|小学生編|BOYS_THUNDER_STORM|雷鳴の轟き|2|ATTACK|ALL_ENEMIES|全体に5ダメージを4回。|damage=5; playCopies=3|
|小学生編|OUT_FALL_LEAVES|落ち葉の絨毯|1|SKILL|SELF|ブロック10。カードを2枚引く。|block=10; draw=2|
|小学生編|ELECTRODYNAMICS|理科の実験|2|POWER|ALL_ENEMIES|全体8ダメージ。|damage=8|
|小学生編|OUT_BICYCLE_DASH|立ちこぎ坂道|2|ATTACK|ENEMY|24ダメージ。自分に2ダメージ。|damage=24; selfDamage=2|
|小学生編|GIRLS_STAR_RAIN|流星の願い|2|ATTACK|RANDOM_ENEMY|4ダメージを7回。|damage=4; playCopies=6|
|小学生編|BOYS_METEOR|流星の鉄槌|2|ATTACK|ENEMY|18ダメージ。倒すと最大HP+3。|damage=18; fatalMaxHp=3|
|小学生編|BOYS_DRAGON_EYE|竜の眼光|1|SKILL|ENEMY|対象をびくびく3、へろへろ3にする。|vulnerable=3; weak=3|
|小学生編|SYAKAI_HISTORY|歴史の教科書|2|POWER|SELF|ターンの開始時、手札の全コストを1下げる。|applyPower={id:"COST_REDUCTION",amount:1}; cardEffectLogic:名称分岐|
|小学生編|CUT_THROUGH|列に割り込む|1|ATTACK|ENEMY|7ダメージ。ブロック3。1ドロー。|damage=7; block=3; draw=1|
|小学生編|BOYS_BLAZING_FIST|烈火拳|1|ATTACK|ENEMY|7ダメージ。ムキムキ1を得る。|damage=7; strength=1|
|小学生編|GIRLS_MACARON_HEAL|恋するマカロン・ヒール|0|SKILL|SELF|HPを5回復。廃棄。|heal=5; exhaust=true|
|小学生編|ALCHEMIZE|錬金術|1|SKILL|SELF|ランダムなカード1枚を0コストで手札に加える。|App:名称/ID分岐|
|小学生編|OUT_SOCCER_STREET|路地のストリートサッカー|4|ATTACK|ENEMY|8ダメージを4回。1枚引く。|damage=8; draw=1; playCopies=3|
|小学生編|OUT_STRAY_CAT|路地裏の野良猫|3|SKILL|SELF|次に使うアタックを3回発動する。|cardEffectLogic:名称分岐; App:名称/ID分岐|
|小学生編|DASH|廊下ダッシュ|2|ATTACK|ENEMY|10ダメージ。ブロック10。|damage=10; block=10|
|小学生編|KOKUGO_RODOKU|朗読|1|ATTACK|ALL_ENEMIES|全体に6ダメージ。1枚引く。|damage=6; draw=1|
|小学生編|SANSU_LOGIC|論理パズル|0|SKILL|SELF|次のターン、カードを1枚追加で引く。|nextTurnDraw=1|
|小学生編|EMPTY_BODY|瞑想|1|SKILL|SELF|ブロック10。|block=10|
|小学生編/菜園|IVY_SEED|アイビーの種|1|SKILL||ブロック3。菜園に植えると「毒蔦アイビー」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="POISON_IVY"|
|小学生編/菜園|M_GLORY_SEED|アサガオの種|1|SKILL||ブロック3。菜園に植えると「朝露のアサガオ」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="MORNING_GLORY"|
|小学生編/菜園|HYDRANGEA_SEED|アジサイの種|1|SKILL||ブロック3。菜園に植えると「七変化のアジサイ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="RAINBOW_HYDRANGEA"|
|小学生編/菜園|ALOE_SEED|アロエの種|1|SKILL||ブロック3。菜園に植えると「医薬のアロエ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="MEDICINAL_ALOE"|
|小学生編/菜園|GINKGO_SEED|イチョウの種|1|SKILL||ブロック3。菜園に植えると「知恵のイチョウ」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="WISDOM_GINKGO"|
|小学生編/菜園|PLUM_SEED|ウメの種|1|SKILL||ブロック3。菜園に植えると「早咲きのウメ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="EARLY_PLUM"|
|小学生編/菜園|PEA_SEED|エンドウ豆の種|1|SKILL||ブロック3。菜園に植えると「豆鉄砲」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="PEA_SHOOTER"|
|小学生編/菜園|ORANGE_SEED|オレンジの種|1|SKILL||ブロック3。菜園に植えると「太陽のオレンジ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="SOLAR_ORANGE"|
|小学生編/菜園|CACAO_BEAN|カカオの豆|1|SKILL||ブロック3。菜園に植えると「魅惑のカカオ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="SWEET_CACAO"|
|小学生編/菜園|PERSIMMON_SEED|カキの種|1|SKILL||ブロック3。菜園に植えると「豊穣のカキ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="BOUNTY_PERSIMMON"|
|小学生編/菜園|OAK_SEED|カシの種|1|SKILL||ブロック3。菜園に植えると「大樹のカシ」に成長する。|block=3; isSeed=true; growthRequired=5; grownCardId="GREAT_OAK"|
|小学生編/菜園|PUMPKIN_SEED|カボチャの種|1|SKILL||ブロック3。菜園に植えると「鉄壁カボチャ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="IRON_PUMPKIN"|
|小学生編/菜園|MUSHROOM_SPORE|キノコの胞子|1|SKILL||ブロック3。菜園に植えると「幻覚キノコ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="MYSTIC_MUSHROOM"|
|小学生編/菜園|CABBAGE_SEED|キャベツの種|1|SKILL||ブロック3。菜園に植えると「幾重のキャベツ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="LAYERED_CABBAGE"|
|小学生編/菜園|CLOVER_SEED|クローバーの種|1|SKILL||ブロック3。菜園に植えると「四つ葉のクローバー」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="LUCKY_CLOVER"|
|小学生編/菜園|COFFEE_BEAN|コーヒーの豆|1|SKILL||ブロック3。菜園に植えると「覚醒のコーヒー」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="AWAKE_COFFEE"|
|小学生編/菜園|PEPPER_SEED|コショウの種|1|SKILL||ブロック3。菜園に植えると「爆炎のコショウ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="EXPLOSIVE_PEPPER"|
|小学生編/菜園|COSMOS_SEED|コスモスの種|1|SKILL||ブロック3。菜園に植えると「秋空のコスモス」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="AUTUMN_COSMOS"|
|小学生編/菜園|SAKURA_SEED|さくらの種|1|SKILL||ブロック3。菜園に植えると「さくら吹雪」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="SAKURA_STORM"|
|小学生編/菜園|CACTUS_SEED|サボテンの種|1|SKILL||ブロック3。菜園に植えると「サボテン」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="CACTUS"|
|小学生編/菜園|SHIITAKE_SPORE|シイタケの胞子|1|SKILL||ブロック3。菜園に植えると「剛力のシイタケ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="POWER_SHIITAKE"|
|小学生編/菜園|JASMINE_SEED|ジャスミンの種|1|SKILL||ブロック3。菜園に植えると「香華のジャスミン」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="FRAGRANT_JASMINE"|
|小学生編/菜園|GINGER_SEED|ショウガの種|1|SKILL||ブロック3。菜園に植えると「癒やしのショウガ」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="HEALING_GINGER"|
|小学生編/菜園|DAIKON_SEED|ダイコンの種|1|SKILL||ブロック3。菜園に植えると「斬鉄ダイコン」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="SWORD_DAIKON"|
|小学生編/菜園|DANDELION_SEED|タンポポの種|1|SKILL||ブロック3。菜園に植えると「綿毛のタンポポ」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="FLUFFY_DANDELION"|
|小学生編/菜園|TULIP_SEED|チューリップの種|1|SKILL||ブロック3。菜園に植えると「魅惑のチューリップ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="TULIP_DRAW"|
|小学生編/菜園|CAMELLIA_SEED|ツバキの種|1|SKILL||ブロック3。菜園に植えると「冬枯れのツバキ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="WINTER_CAMELLIA"|
|小学生編/菜園|VINE_SEED|ツルの種|1|SKILL||ブロック3。菜園に植えると「巨大なツル」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="GIANT_VINE"|
|小学生編/菜園|CHILI_SEED|トウガラシの種|1|SKILL||ブロック3。菜園に植えると「激辛トウガラシ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="HOT_CHILI"|
|小学生編/菜園|TOMATO_SEED|トマトの種|1|SKILL||ブロック3。菜園に植えると「完熟トマト」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="RIPE_TOMATO"|
|小学生編/菜園|GARLIC_SEED|ニンニクの種|1|SKILL||ブロック3。菜園に植えると「魔除けのニンニク」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="HOLY_GARLIC"|
|小学生編/菜園|LOTUS_SEED|ハスの種|1|SKILL||ブロック3。菜園に植えると「聖なるハス」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="SACRED_LOTUS"|
|小学生編/菜園|ROSE_SEED|バラの種|1|SKILL||ブロック3。菜園に植えると「バラ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="ROSE"|
|小学生編/菜園|CYPRESS_SEED|ヒノキの種|1|SKILL||ブロック3。菜園に植えると「鉄壁のヒノキ」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="IRON_CYPRESS"|
|小学生編/菜園|SUNFLOWER_SEED|ヒマワリの種|1|SKILL||ブロック3。菜園に植えると「ヒマワリ」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="SUNFLOWER"|
|小学生編/菜園|GRAPE_SEED|ブドウの種|1|SKILL||ブロック3。菜園に植えると「芳醇なブドウ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="RICH_GRAPE"|
|小学生編/菜園|BLUEBELL_SEED|ブルーベルの種|1|SKILL||ブロック3。菜園に植えると「響き渡る鈴蘭」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="ECHO_BLUEBELL"|
|小学生編/菜園|PINE_SEED|マツの種|1|SKILL||ブロック3。菜園に植えると「不老長寿のマツ」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="ETERNAL_PINE"|
|小学生編/菜園|MANDRAKE_SEED|マンドレイクの種|1|SKILL||ブロック3。菜園に植えると「マンドレイク」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="MANDRAKE_ROOT"|
|小学生編/菜園|MINT_SEED|ミントの種|1|SKILL||ブロック3。菜園に植えると「清涼のミント」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="REFRESH_MINT"|
|小学生編/菜園|MAPLE_SEED|モミジの種|1|SKILL||ブロック3。菜園に植えると「真紅のモミジ」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="CRIMSON_MAPLE"|
|小学生編/菜園|WILLOW_SEED|ヤナギの種|1|SKILL||ブロック3。菜園に植えると「柳に風」に成長する。|block=3; isSeed=true; growthRequired=5; grownCardId="WILLOW_WIND"|
|小学生編/菜園|LILY_SEED|ユリの種|1|SKILL||ブロック3。菜園に植えると「純白のユリ」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="SACRED_LILY"|
|小学生編/菜園|LAVENDER_SEED|ラベンダーの種|1|SKILL||ブロック3。菜園に植えると「安らぎのラベンダー」に成長する。|block=3; isSeed=true; growthRequired=2; grownCardId="CALM_LAVENDER"|
|小学生編/菜園|APPLE_SEED|リンゴの種|1|SKILL||ブロック3。菜園に植えると「禁断のリンゴ」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="FORBIDDEN_APPLE"|
|小学生編/菜園|WASABI_SEED|ワサビの種|1|SKILL||ブロック3。菜園に植えると「劇薬ワサビ」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="CAUSTIC_WASABI"|
|小学生編/菜園|WHEAT_SEED|小麦の種|1|SKILL||ブロック3。菜園に植えると「黄金の小麦」に成長する。|block=3; isSeed=true; growthRequired=3; grownCardId="GOLDEN_WHEAT"|
|小学生編/菜園|BONSAI_SEED|松の盆栽の種|1|SKILL||ブロック3。菜園に植えると「至高の盆栽」に成長する。|block=3; isSeed=true; growthRequired=4; grownCardId="ULTIMATE_BONSAI"|
|小学生編/菜園|WORLD_TREE_SEED|世界樹の種|1|SKILL||ブロック3。菜園に植えると「ユグドラシル」に成長する。|block=3; isSeed=true; growthRequired=6; grownCardId="YGGDRASIL"|
|小学生編/菜園|BAMBOO_SEED|竹の種|1|SKILL||ブロック3。菜園に植えると「剛健な竹」に成長する。|block=3; isSeed=true; growthRequired=1; grownCardId="STURDY_BAMBOO"|
|状態異常|WOUND|ケガ|0|STATUS||【即時痛み型】使用不可。|unplayable=true|
|状態異常|DAZED|めまい|0|STATUS||【手札阻害型】使用不可。ターン終了時廃棄。|exhaust=true; unplayable=true|
|状態異常|BURN|やけど|0|STATUS||【即時痛み型】使用不可。ターン終了時2ダメージ。|unplayable=true; App:名称/ID分岐|
|状態異常|VOID|虚無|0|STATUS||【手札阻害型】使用不可。引いた時E1失う。|unplayable=true; App:名称/ID分岐|
|状態異常|SLIMED|鼻水|1|STATUS||【即時痛み型】使用すると廃棄される。|exhaust=true|
