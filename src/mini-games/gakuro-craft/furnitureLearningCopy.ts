const rows=[
 ['空島ランドセル','Sky Backpack','そらじまらんどせる'],['アドベンチャー','Adventure','あどべんちゃー'],
 ['ゲームの合間に3問','Three-question learning break','げーむのあいまに3もん'],
 ['3ステージ達成！学習して次の冒険へ。','Three stages cleared! Learn before your next adventure.','3すてーじたっせい！がくしゅうしてつぎのぼうけんへ。'],
 ['3ゲーム終了！学習して次の対戦へ。','Three games finished! Learn before your next match.','3げーむしゅうりょう！がくしゅうしてつぎのたいせんへ。'],
 ['選択した範囲から問題を準備できませんでした。','Could not prepare questions from the selected range.','せんたくしたはんいからもんだいをじゅんびできませんでした。'],
 ['問題を準備中','Preparing questions','もんだいをじゅんびちゅう'],
 ['3問の学習が完了しました。','All three questions completed.','3もんのがくしゅうがかんりょうしました。'],
 ['ゲームに戻る','Return to the game','げーむにもどる'],['答えを確認しよう。','Review the answer.','こたえをかくにんしよう。'],
 ['30ステージを踏破！','All 30 stages cleared!','30すてーじをとうは！'],
 ['30ステージの空島を冒険！3ステージごとに3問。','Explore 30 sky stages! Answer three questions every three stages.','30すてーじのそらじまをぼうけん！3すてーじごとに3もん。'],
 ['3ゲームごとに3問。RPGで選んだ学習範囲から出題します。','Three questions after every three games, from your RPG learning range.','3げーむごとに3もん。RPGでえらんだがくしゅうはんいからしゅつだいします。'],
 ['雲の回廊','Cloud Corridor','くものかいろう'],['歯車の空中庭園','Clockwork Sky Garden','はぐるまのくうちゅうていえん'],['水辺の浮島','Waterside Islands','みずべのうきしま'],['氷の天空路','Icy Skyway','こおりのてんくうろ'],['ベルト工房','Conveyor Workshop','べるとこうぼう'],['消える星橋','Vanishing Star Bridge','きえるほしばし'],['風車の頂','Windmill Summit','ふうしゃのいただき'],
] as const;
export const FURNITURE_LEARNING_ENGLISH=Object.fromEntries(rows.map(([jp,en])=>[jp,en]));
export const FURNITURE_LEARNING_HIRAGANA=Object.fromEntries(rows.map(([jp,,hi])=>[jp,hi]));
