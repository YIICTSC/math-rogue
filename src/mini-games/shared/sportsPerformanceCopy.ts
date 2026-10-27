const copy:Record<string,[string,string]>={
 'スポーツボイス':['Sports voice','すぽーつぼいす'],
 '声のタイプ':['Voice type','こえの たいぷ'],
 'ボイスを試聴':['Preview voice','ぼいすを しちょう'],
 '4種目共通の8種類から選べます。':['Choose from eight voices shared by all four sports.','4しゅもく きょうつうの 8しゅるいから えらべます。'],
 '主人公専用のスポーツボイスを使用します。':['Uses this protagonist’s dedicated sports voice.','しゅじんこう せんようの すぽーつぼいすを しようします。'],
 'スターショット準備':['Prepare star shot','すたーしょっと じゅんび'],
 'スターショット選択中':['Star shot selected','すたーしょっと せんたくちゅう'],
 '正解でスターゲージ回復。満タンで飛距離アップ。':['Correct answers fill the star gauge. A full gauge unlocks extra distance.','せいかいで すたーげーじ かいふく。まんたんで ひきょり あっぷ。'],
 '必殺プレー':['Signature play','ひっさつぷれー'],
 'スターゲージ':['Star energy','すたーげーじ'],
};
export const SPORTS_PERFORMANCE_ENGLISH=Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[0]]));
export const SPORTS_PERFORMANCE_HIRAGANA=Object.fromEntries(Object.entries(copy).map(([k,v])=>[k,v[1]]));
