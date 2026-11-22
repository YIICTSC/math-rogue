# 『Caves of Qud』と「鐘灯の自由冒険」の機能比較

2026年11月22日時点の『Caves of Qud』本編の公開資料と、「鐘灯の自由冒険」の `47dcc0e4` を照合した。地形を生成する冒険、町での生活、飢え、最大6人の自動戦闘、装備製作、勢力、遠征、手記、敗北時の再開ルールは既にあった。以下はそこから追加した遊びと、方式や規模に差が残る項目。 [公式サイト](https://www.cavesofqud.com/) · [Steamの機能一覧](https://store.steampowered.com/app/333640/Caves_of_Qud/) · [ゲーム概念](https://wiki.cavesofqud.com/wiki/Game_Concepts) · [仕組みの索引](https://wiki.cavesofqud.com/wiki/Mechanics)

| 比較項目 | 変更前 | 鐘灯で遊べるようにしたこと | 残る差・参照資料 |
| --- | --- | --- | --- |
| 位置で変わる戦闘 | 通路の探索と自動戦闘が別画面 | 遺跡の実際の床で手番制戦闘。移動、遮蔽物、射線、武器別射程、待機、照準、回避、貫通が判定に影響。手動戦闘は設定で選択 | 仲間に個別のマスを割り当てる操作、個別弾薬と装填、原作と同じ行動速度・貫通計算は対象外。[Combat](https://wiki.cavesofqud.com/wiki/Combat) |
| 特殊攻撃と弱点 | 弱点、予告、仲間の陣形あり | 戦術戦闘では壁・湯気・踏ん張りによる回避、遠距離からの集中や灯りへの攻撃、敵が射程外から回り込む動きを追加 | 精神攻撃には鐘灯の集中を使用。原作の精神防御値と攻撃の全分類には未対応。[Combat](https://wiki.cavesofqud.com/wiki/Combat) |
| 能力の成長と技能系統 | 能力値、職分、成長点あり | 3流派と9技能。能力値と成長点で学ぶほか、土地の本、水の誓い、信用がそろえば地元で教わる | 職業・出自・前提技能の組み合わせは鐘灯独自。[Attributes](https://wiki.cavesofqud.com/wiki/Attributes) · [Mechanics](https://wiki.cavesofqud.com/wiki/Mechanics) |
| 変異に相当する力 | 能力の消費で行うアクションが中心 | 10種類、各3段階の「響き」。壁掘り、滑空、反響探知、結界、芽による治療、分身、反響打、先見、影渡し、薄い壁の通過 | 先見は次の出目を見て振り直す力。時間全体の巻き戻しや原作の変異全種類には未対応。[Game Concepts](https://wiki.cavesofqud.com/wiki/Game_Concepts) · [Effects](https://wiki.cavesofqud.com/wiki/Effects) |
| 精神能力の代償と他者の操作 | 専用の仕組みなし | 響きを繰り返すと残響がたまり、遺跡で番人を呼び寄せる。影渡しで視界内の魔物から短時間、移動・攻撃を行う | 操作対象は戦闘中の対象魔物。恒久的な体の交換や全NPCの操作には未対応。[Glimmer](https://wiki.cavesofqud.com/wiki/Glimmer) · [Effects](https://wiki.cavesofqud.com/wiki/Effects) |
| 部位・複数の手 | 武器、服、護符の装備枠 | 頭、手・腕、足の負傷とその影響、逆手の武器と両手武器の排他、条件付きで使える補助腕 | 任意の体形・手足の切断や再生、全身の義体化には未対応。[Combat](https://wiki.cavesofqud.com/wiki/Combat) · [Game Concepts](https://wiki.cavesofqud.com/wiki/Game_Concepts) |
| 古い道具の鑑定 | 素性のわかる装備を拾う・作る | 史跡や宝箱から用途不明の機具を入手。判定や技能で鑑定し、起動方法と設計を覚える | 鑑定対象は専用イラストのある8機具から選ばれる。[Artifact](https://wiki.cavesofqud.com/wiki/Artifact) |
| 義装・電荷・改造 | 武器、防具、装飾品の製作あり | 部位に機具を装着。分解した部品で復元・充電。灯油で現地充電。予備電槽、絶縁、消費電力を減らす調整 | 個別の電池アイテムの装着交換や多段階の工作ツリーには未対応。[Energy cell](https://wiki.cavesofqud.com/wiki/Energy_cell) · [Tinkering](https://wiki.cavesofqud.com/wiki/Tinkering) |
| 渇き・携行品の重さ | 一日一食と疲労あり | 水筒容量、飲水、脱水、積載量が街道移動や判定に影響する設定。町では井戸と購入、現地では地形から補給 | 水と金は用途が分かれ、物資を水で交換できる。[Liquid](https://wiki.cavesofqud.com/wiki/Liquid) · [Water ritual](https://wiki.cavesofqud.com/wiki/Water_ritual) |
| 液体と環境の反応 | 資材は個数管理が中心 | 6種の液体と10種の足場。熱を水で冷ます、灯油に引火させる、塩水で隣の水たまりに通電させる、樹脂を調合して足止めする。敵も火や電気の影響を受ける | 全種類を任意の比率で混ぜる方式や連続的な温度計算には未対応。[Liquid](https://wiki.cavesofqud.com/wiki/Liquid) |
| 状態、感染、環境負荷 | 飢え、疲労、天候表示あり | 冷え、熱傷、濡れ、帯電、胞子感染、道迷い、部位負傷。症状ごとに水、薬、技能、結界で対応。濡れた状態での感電は被害が増す | 病気はこの遊びに登場する系統まで。原作の疾病や別生物への変化には未対応。[Effects](https://wiki.cavesofqud.com/wiki/Effects) · [Fungal infections](https://wiki.cavesofqud.com/wiki/Fungal_Infections) |
| 素材を組み合わせる料理 | 固定の献立と一定時間の強化あり | 4種の献立に加え、主材料と仕上げの材料で12通りの組み合わせを作れる。危険な足元、被弾、旅、交渉をきっかけに一度だけ発動し、仕上げの材料で体力、集中、疲労への効果が変わる | 配合できる素材は、鐘灯で手に入る食材と樹液から選ぶ。[Cooking](https://wiki.cavesofqud.com/wiki/Cooking) |
| 水の誓いと勢力の交渉 | 勢力の評判、贈り物と住人の信頼あり | 住人と水を分け、相手の勢力と対立勢力に評判が反映される。次の史跡を教わり、関係次第で技能を学べる | 交渉の相手と取引は鐘灯の勢力・住人・技能に対応。[Water ritual](https://wiki.cavesofqud.com/wiki/Water_ritual) |
| 名付きの敵、仲間、制作 | 住人を同行させ、最大6人で戦闘 | 名付きの魔物などを交渉で勧誘。前衛・援護・待機を指示し、控えの装備を貸せる。史跡を進めると紙灯の見張り鳥を製作可能 | 仲間専用の経験値、全NPCに一般化されたAI・行動命令、仲間の個別フィールド移動には未対応。[Followers](https://wiki.cavesofqud.com/wiki/Followers) |
| 歴史から場所を探す | 町単位の手記と調査録あり | 町に紐づく史跡に紀行誌、別の町への道筋、固有の記録。各史跡の課題は地域とシードに応じて変わり、判定・素材・知識や信用のいずれからも解決できる | 固有の事件が連鎖する年代記・文化生成や原作の集落全種類には未対応。[Historic sites](https://wiki.cavesofqud.com/wiki/Historic_sites) · [Villages](https://wiki.cavesofqud.com/wiki/Villages) · [Sultans](https://wiki.cavesofqud.com/wiki/Sultans) |
| 本と記録の報酬 | 出来事を記録する日誌あり | 紀行誌の内容と次の探索先をシードから生成。読了後に地図へ反映し、寄贈で経験値と評判を得る | 自由生成の長編や作者別図書館には未対応。[Book](https://wiki.cavesofqud.com/wiki/Book) |
| 一連の旅と結末 | 独立した各地の遠征あり | 六地方の記録をつなぐ章を追加。各地方に導入と調査後の話があり、すべて集めると共通の合図を広めるか、避難所に記録を託すか選べる | 公開されている原作のクエストや結末とは別に、鐘灯の六地方の物語として展開する。[Quests](https://wiki.cavesofqud.com/wiki/Quests) · [Endgame](https://wiki.cavesofqud.com/wiki/Endgame) |
| 地図注記・自動探索 | 自動で記録する見取り図あり | 紀行誌の目印と自由記入を地図に表示。安全な移動先を自動でたどり、未解決の罠や魔物、階段の手前で止まる | 自動探索は遺跡のフロア内。街道の移動は従来どおり地図から行う。[Controls](https://wiki.cavesofqud.com/wiki/Controls) |
| 地形を変える探索 | 遺跡の回路で近道を開通 | 壁を掘って通路を増やし、薄い壁を一時的な能力で越える。地形の変更は階ごとに保存 | 地形の完全破壊、水理・大気の連続シミュレーション、原作の規模での縦穴と地表の接続には未対応。[World](https://wiki.cavesofqud.com/wiki/World) |
| 遊び方、定期シード、途中再開 | パーマデスと町への帰還を選択 | 自由・日替わり・週替わり・探訪の旅。日・週と同じ出身で世界と出目を共有。探訪は暗闇の不意打ちを避け、再開地点を町で登録。主人公の呼ばれ方も選択 | 定期ランキング、共有リプレイ、原作の全アクセシビリティ設定には未対応。[Steamの機能一覧](https://store.steampowered.com/app/333640/Caves_of_Qud/) · [Options](https://wiki.cavesofqud.com/wiki/Options) |
| カスタマイズ、実績、拡張 | ローカル実績と複数セーブあり | 戦闘・環境・安全探索の組み合わせを短い設定コードで共有できる | ゲーム内で任意のコードやデータを読み込むMOD、Workshop連携、プラットフォーム実績とランキングには未対応。[Modding](https://wiki.cavesofqud.com/wiki/Modding) · [Achievements](https://wiki.cavesofqud.com/wiki/Achievements) |

## ゲーム内での入口

- **探索 → 史跡へ行く**で、紀行誌、地図の目印、六地方の記録をたどる。初めて訪れたとき、その土地の課題が野外手帳に記録される。
- **旅日誌 → 野外手帳**で、技能と響き、古機具、水と料理、ゲームルールを管理する。遺跡に入ってからは**野営の道具と能力**を開くと、覚えた能力・装着した機具・水筒を使える。
- 手動戦闘や渇きを有効にするには、主人公を作るときの**流派と旅の設定**か、野外手帳の**補給と設定**を開く。既存のセーブでは初回の読み込み時に自動戦闘を選択した状態から始まる。
