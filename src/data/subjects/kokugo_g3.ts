import { GeneralProblem, d } from './utils';

export const KOKUGO_G3_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G3_U01: [], // 三年生の漢字
  KOKUGO_G3_U02: [], // 国語辞典の使い方
  KOKUGO_G3_U03: [], // 段落
  KOKUGO_G3_U04: [], // 物語を読む
  KOKUGO_G3_U05: [], // 説明文を読む
  KOKUGO_G3_U06: [], // 要点をまとめる
  KOKUGO_G3_U07: [], // 日記・作文
  KOKUGO_G3_U08: [], // 手紙を書く
  KOKUGO_G3_U09: [], // 話し合い
};

const choices = (answer: string, pool: string[], index: number): string[] => {
  const rotated = [...pool.slice(index + 1), ...pool.slice(0, index + 1), '書かれていない', 'どれでもない'];
  return d(answer, ...[...new Set(rotated)].filter((value) => value !== answer).slice(0, 3));
};

const kanjiRows = [
  { word: '安全', reading: 'あんぜん', sentence: '左右を見て、安全に道をわたる。', meaning: 'あぶなくないこと', opposite: '危険' },
  { word: '植物', reading: 'しょくぶつ', sentence: '校庭の植物をかんさつする。', meaning: '草や木のなかま', opposite: '動物' },
  { word: '運動', reading: 'うんどう', sentence: '朝に運動をすると体が温まる。', meaning: '体を動かすこと', opposite: '休息' },
  { word: '発見', reading: 'はっけん', sentence: '葉のうらで小さな卵を発見した。', meaning: '見つけ出すこと', opposite: '見落とし' },
  { word: '研究', reading: 'けんきゅう', sentence: 'こん虫の育ち方を研究する。', meaning: 'くわしく調べること', opposite: '放置' },
  { word: '温度', reading: 'おんど', sentence: '一日の温度をはかって記録する。', meaning: 'あたたかさの度合い', opposite: '長さ' },
  { word: '道路', reading: 'どうろ', sentence: '道路では車に気をつける。', meaning: '人や車が通る道', opposite: '建物' },
  { word: '農家', reading: 'のうか', sentence: '農家の人が野菜を育てる。', meaning: '作物などを育てる家や人', opposite: '商店' },
  { word: '昔話', reading: 'むかしばなし', sentence: '地域に伝わる昔話を聞いた。', meaning: '昔から伝わる物語', opposite: 'ニュース' },
  { word: '急行', reading: 'きゅうこう', sentence: '急行電車は次の駅を通過した。', meaning: '止まる所が少なく速く進むもの', opposite: '各駅停車' },
];

const dictionaryRows = [
  { word: '案内', head: 'あ', meaning: '場所や方法を知らせること', example: '校内を案内する', before: '合図' },
  { word: 'いきおい', head: 'い', meaning: '動きや力の強さ', example: '水がいきおいよく流れる', before: '生き物' },
  { word: 'うなずく', head: 'う', meaning: '分かった気持ちで首をたてに動かす', example: '話を聞いてうなずく', before: 'うつす' },
  { word: 'えだ', head: 'え', meaning: '木の幹から分かれてのびる部分', example: 'えだに鳥がとまる', before: '絵本' },
  { word: 'おだやか', head: 'お', meaning: 'しずかで落ち着いているようす', example: 'おだやかな海', before: '大通り' },
  { word: '観察', head: 'か', meaning: 'ようすを注意深く見ること', example: 'アリを観察する', before: '感想' },
  { word: 'くふう', head: 'く', meaning: 'よくなるよう考えること', example: '読み方をくふうする', before: '草原' },
  { word: 'けしき', head: 'け', meaning: '目に見える自然や町のようす', example: '山のけしきを見る', before: '計画' },
  { word: 'こえる', head: 'こ', meaning: 'ある場所や量の上を通りすぎる', example: '山をこえる', before: '声' },
  { word: 'さかん', head: 'さ', meaning: '活動が元気でよく行われるようす', example: '野菜作りがさかんだ', before: '最後' },
];

const paragraphRows = [
  { title: 'アサガオの種', first: 'アサガオの種をまきました。', second: '毎朝、水をやりました。', third: '一週間後、二まいの葉が出ました。', topic: 'アサガオの成長', order: '種まき・水やり・発芽' },
  { title: '図書館見学', first: '図書館には多くの本があります。', second: '本は種類ごとにならんでいます。', third: '係の人がさがし方を教えてくれました。', topic: '図書館の本のさがし方', order: '本の多さ・ならび方・さがし方' },
  { title: '朝の公園', first: '朝の公園へ行きました。', second: '木の上で鳥が鳴いていました。', third: '池ではカモがゆっくり泳いでいました。', topic: '朝の公園の生き物', order: '公園・鳥・カモ' },
  { title: '町たんけん', first: '駅前から町たんけんを始めました。', second: '商店街で店の人に話を聞きました。', third: '最後に気づいたことを地図へ書きました。', topic: '町たんけんで調べたこと', order: '駅前・商店街・地図' },
  { title: '雨の日', first: '朝から雨がふっていました。', second: '校庭には大きな水たまりができました。', third: '休み時間は教室で読書をしました。', topic: '雨の日の学校', order: '雨・水たまり・読書' },
  { title: '大豆のへんしん', first: '大豆はさまざまな食品になります。', second: 'とうふやみそにも使われます。', third: '作り方によって形や味が変わります。', topic: '大豆からできる食品', order: '大豆・食品例・作り方' },
  { title: '遠足のじゅんび', first: '遠足の前日に持ち物をそろえました。', second: '水とうと雨具をかばんへ入れました。', third: '早くねるため、九時に電気を消しました。', topic: '遠足前日のじゅんび', order: '持ち物・かばん・就寝' },
  { title: 'そうじの時間', first: 'まず、いすを机の上へ上げました。', second: '次に、床をほうきではきました。', third: '最後に、ぞうきんで床をふきました。', topic: '教室そうじの順序', order: 'いす・ほうき・ぞうきん' },
  { title: '風の強い日', first: '昼すぎから風が強くなりました。', second: '校庭の木のえだが大きくゆれました。', third: '先生は外へ出ないように言いました。', topic: '強風の日のようす', order: '強風・木・安全' },
  { title: '音楽会', first: '音楽会へ向けて練習を続けました。', second: '友だちの音を聞くと合いやすくなりました。', third: '本番ではみんなの音が一つになりました。', topic: '音楽会までの変化', order: '練習・聞き合い・本番' },
];

const storyRows = [
  { text: 'ゆうたは育てていたホウセンカの葉がしおれているのを見つけました。土にさわるとかわいていたので、ゆっくり水をやりました。夕方、葉が元気になり、ゆうたはほっとしました。', who: 'ゆうた', action: 'ホウセンカへ水をやった', reason: '土がかわいていたから', change: '心配から安心へ変わった', title: '元気になったホウセンカ' },
  { text: 'みさきはリレーの練習でバトンを落としてしまいました。友だちとわたし方を何度も練習すると、次はうまくつながりました。みさきは友だちと顔を見合わせて笑いました。', who: 'みさき', action: 'バトンのわたし方を練習した', reason: 'バトンを落としたから', change: 'くやしさから喜びへ変わった', title: 'つながったバトン' },
  { text: 'そうまは道ばたで地図を見ている人に会いました。駅をさがしていると聞き、近くの交番までいっしょに歩きました。お礼を言われ、そうまの足どりは軽くなりました。', who: 'そうま', action: '交番まで案内した', reason: '相手が駅をさがしていたから', change: '心配からうれしい気持ちへ変わった', title: '小さな道案内' },
  { text: 'あかりは図工で作った船を水にうかべましたが、すぐにかたむきました。底を広く作り直すと、船はまっすぐ進みました。あかりはもっと試したくなりました。', who: 'あかり', action: '船の底を広く作り直した', reason: '船がかたむいたから', change: 'ざんねんから意欲へ変わった', title: 'まっすぐ進む船' },
  { text: 'けんは転校してきた子が一人で本を読んでいるのを見ました。好きな本をたずねると、同じシリーズだと分かりました。二人は次に読む本の話で夢中になりました。', who: 'けん', action: '好きな本をたずねた', reason: '転校生が一人でいたから', change: '気がかりから親しみへ変わった', title: '同じ本が好き' },
  { text: 'りなは朝、空の色がいつもより暗いことに気づきました。洗たく物を取りこむと、すぐに大つぶの雨がふりました。ぬれずにすみ、りなは胸をなで下ろしました。', who: 'りな', action: '洗たく物を取りこんだ', reason: '空が暗かったから', change: '急ぐ気持ちから安心へ変わった', title: '雨の前の空' },
  { text: 'だいちは虫かごの中のカブトムシが動かないので心配しました。図かんで調べ、夜に活動することを知りました。夜になると動き出し、だいちは目を丸くしました。', who: 'だいち', action: '図かんでカブトムシを調べた', reason: 'カブトムシが動かなかったから', change: '心配からおどろきへ変わった', title: '夜に動くカブトムシ' },
  { text: 'なおは発表の前に声がふるえました。深く息をして、練習した最初の文をゆっくり話しました。友だちがうなずくのを見て、最後まで話せました。', who: 'なお', action: '深呼吸してゆっくり話した', reason: '発表で緊張していたから', change: '不安から自信へ変わった', title: '最初の一文' },
  { text: 'ほのかは公園で片方だけの手ぶくろを見つけました。目立つ場所へ置くか迷いましたが、交番へとどけました。帰り道、持ち主が見つかるといいなと思いました。', who: 'ほのか', action: '手ぶくろを交番へとどけた', reason: '落とし物だと思ったから', change: '迷いから願う気持ちへ変わった', title: '片方の手ぶくろ' },
  { text: 'こうきはなわとびで二重とびが一回もできませんでした。毎日少しずつ練習すると、金曜日に初めて一回とべました。こうきは回数をノートへ大きく書きました。', who: 'こうき', action: '毎日二重とびを練習した', reason: '一回もできなかったから', change: 'くやしさから達成感へ変わった', title: 'はじめての一回' },
];

const explanationRows = [
  { text: 'モンシロチョウは、たまご、よう虫、さなぎ、成虫の順に育ちます。体の形を大きく変えながら成長するのです。', topic: 'モンシロチョウの育ち方', fact: '四つの段階を通る', reason: '体の形を変えながら成長するから', connector: '順に', summary: 'モンシロチョウは四段階で姿を変えて育つ。' },
  { text: '方位じしんの赤いはりは北をさします。そのため、赤いはりを北に合わせると、ほかの方角も分かります。', topic: '方位じしんの使い方', fact: '赤いはりは北をさす', reason: '北を基準にほかの方角を知るため', connector: 'そのため', summary: '赤いはりを北へ合わせて方角を調べる。' },
  { text: '日なたの地面は、日かげより早く温まります。太陽の光が直接当たるからです。', topic: '日なたの地面の温度', fact: '日なたは早く温まる', reason: '太陽光が直接当たるから', connector: 'から', summary: '日なたは太陽光で日かげより早く温まる。' },
  { text: '図書館の本は、内容ごとに分けてならべられています。分類番号を見ると、読みたい本をさがしやすくなります。', topic: '図書館の本の分類', fact: '本は内容ごとに分かれる', reason: '読みたい本をさがしやすくするため', connector: 'と', summary: '分類番号を使うと図書館の本をさがしやすい。' },
  { text: '大豆を水につけてやわらかくし、すりつぶしてにると豆乳ができます。豆乳を固めたものがとうふです。', topic: 'とうふの作り方', fact: 'とうふは豆乳を固めて作る', reason: '大豆から豆乳を作って固めるから', connector: 'と', summary: '大豆から豆乳を作り、それを固めるととうふになる。' },
  { text: '雨水は高い所から低い所へ流れます。地面のかたむきにそって動くため、水たまりは低い場所にできます。', topic: '雨水の流れ', fact: '雨水は低い方へ流れる', reason: '地面にかたむきがあるため', connector: 'ため', summary: '雨水は地面のかたむきにそって低い場所へ集まる。' },
  { text: '磁石にはN極とS極があります。同じ極どうしはしりぞけ合い、ちがう極どうしは引き合います。', topic: '磁石の極の性質', fact: '同じ極はしりぞけ合う', reason: '磁石の極には決まった性質があるから', connector: '同じ', summary: '磁石は同極がしりぞけ合い異極が引き合う。' },
  { text: '消防署では、火事の通報を受けると場所やようすを確かめます。そして、必要な消防車や救急車を出動させます。', topic: '消防署の出動', fact: '通報内容を確かめて車両を出す', reason: '必要な対応を選ぶため', connector: 'そして', summary: '消防署は通報を確認し必要な車両を出動させる。' },
  { text: '太陽は東の空からのぼり、南の空を通って西へしずみます。そのため、かげの向きも時間とともに変わります。', topic: '太陽とかげの動き', fact: 'かげの向きは変わる', reason: '太陽の位置が変わるため', connector: 'そのため', summary: '太陽の位置が動くとかげの向きも変わる。' },
  { text: 'ごみを種類ごとに分けると、まだ使える材料を集められます。たとえば、古紙は新しい紙の材料になります。', topic: 'ごみの分別', fact: '古紙は紙の材料になる', reason: '使える材料を集めるため', connector: 'たとえば', summary: 'ごみを分別すると材料を再利用できる。' },
];

const summaryRows = [
  { text: '学校の池にはメダカがいます。春になると水草へ卵を産みます。卵からかえった子メダカは小さな生き物を食べて育ちます。', key: 'メダカは春に卵を産み、子メダカが育つ。', topic: 'メダカの成長', detail: '池にいる', omit: '学校の' },
  { text: '町のパン屋では、朝早くからパンを焼きます。生地をこね、発酵させ、形を作ってから焼きます。', key: 'パン屋は生地をこねて発酵させ、形を作って焼く。', topic: 'パン作りの順序', detail: '朝早くから作る', omit: '町の' },
  { text: '竹は地下のくきから芽を出します。春にはたけのこが急速にのび、やがて竹になります。', key: '竹は地下茎から芽を出し、たけのこから竹へ育つ。', topic: '竹の育ち方', detail: '春に急速にのびる', omit: 'やがて' },
  { text: '市のバスは駅と住宅地を結んでいます。車を運転しない人も病院や店へ行けるように走っています。', key: '市バスは駅と住宅地を結び、人々の移動を支える。', topic: '市バスの役割', detail: '病院や店へ行ける', omit: '市の' },
  { text: '雪の多い地方では、家の屋根を急な形にすることがあります。雪が屋根にたまりにくくするためです。', key: '雪国では雪を落とすため急な屋根にすることがある。', topic: '雪国の屋根の工夫', detail: '雪が多い', omit: 'ことがあります' },
  { text: 'ミツバチは花のみつを集めます。花から花へ移る時、体についた花粉を運び、実ができるのを助けます。', key: 'ミツバチはみつを集めながら花粉を運ぶ。', topic: 'ミツバチの働き', detail: '実ができるのを助ける', omit: '体についた' },
  { text: '地域の祭りでは、住民が協力して準備します。祭りは昔からの文化を伝え、人々の交流の場にもなります。', key: '地域の祭りは文化を伝え、人々の交流を生む。', topic: '地域の祭りの役割', detail: '住民が協力する', omit: '昔からの' },
  { text: '森林の土は雨水をたくわえます。たくわえられた水は少しずつ川へ流れ、急な増水をやわらげます。', key: '森林の土は雨水をたくわえ、川の急な増水をやわらげる。', topic: '森林の保水作用', detail: '水が少しずつ川へ流れる', omit: '雨水' },
  { text: '点字は指でさわって読む文字です。六つの点の組み合わせで、かなや数字を表します。', key: '点字は六点の組み合わせを指で読んで文字や数字を表す。', topic: '点字の仕組み', detail: '指でさわる', omit: 'かなや' },
  { text: '地いきの市場には近くでとれた野菜が集まります。運ぶ距離が短く、生産者の名前が分かる品もあります。', key: '地域市場では近くの生産者の野菜が売られる。', topic: '地域市場の特徴', detail: '運ぶ距離が短い', omit: '地いきの' },
];

const compositionRows = [
  { title: '初めての係活動', event: '図書係で本をならべた', detail: '背表紙の番号を見て順番を直した', feeling: '本が見つけやすくなってうれしかった', opening: '今週、初めて図書係の仕事をしました。', ending: '次はおすすめの本もしょうかいしたいです。' },
  { title: '風で動く車', event: '理科で風の力を使う車を作った', detail: '帆を大きくすると遠くまで進んだ', feeling: '予想が当たっておどろいた', opening: '理科の時間に、風で動く車を作りました。', ending: '帆の形も変えて試したいです。' },
  { title: '町たんけん', event: '商店街で店の人に話を聞いた', detail: '朝早くから品物をならべると分かった', feeling: '町を支える仕事が分かった', opening: '木曜日に商店街をたんけんしました。', ending: '家の近くの店も調べたいです。' },
  { title: '雨の日の発見', event: '校庭の雨水の流れを見た', detail: '低い場所へ水が集まっていた', feeling: '地面の高さが関係すると気づいた', opening: '雨の日、ろう下から校庭を見ました。', ending: '晴れた日にも地面を調べたいです。' },
  { title: '音読発表', event: '物語の音読を発表した', detail: '人物の気持ちに合わせて声を変えた', feeling: '聞きやすかったと言われて安心した', opening: '国語の時間に音読発表をしました。', ending: '次は間の取り方もくふうします。' },
  { title: '大豆を調べた日', event: '大豆からできる食品を調べた', detail: 'みそやとうふにもなると知った', feeling: '一つの豆が変身してすごいと思った', opening: '総合の時間に大豆を調べました。', ending: '家の食品表示も見てみます。' },
  { title: '二重とびの練習', event: '休み時間に二重とびを練習した', detail: '手首を速く回すと一回とべた', feeling: '続けてよかったと思った', opening: '今週は毎日、二重とびを練習しました。', ending: '今度は三回続けるのが目標です。' },
  { title: '公園のそうじ', event: '地域の人と公園をそうじした', detail: '落ち葉を集めてごみを分別した', feeling: '公園が明るく見えて気持ちよかった', opening: '日曜日に公園のそうじへ参加しました。', ending: 'これからもごみを見つけたら拾います。' },
  { title: '星を見た夜', event: '家族と冬の星を観察した', detail: '三つならんだ星を見つけた', feeling: '本の写真と同じで感動した', opening: '夜、家族と空を見上げました。', ending: '別の星座もさがしてみたいです。' },
  { title: '一年生への読み聞かせ', event: '一年生に絵本を読んだ', detail: '絵が見えるよう本をゆっくり動かした', feeling: '笑ってくれてうれしかった', opening: '金曜日、一年生へ読み聞かせをしました。', ending: 'また別の本も読んであげたいです。' },
];

const letterRows = [
  { to: '農家の佐藤さんへ', purpose: '畑見学のお礼', body: '野菜を朝早く収穫すると教えてくださり、ありがとうございました。', detail: '新鮮なまま店へ運ぶ工夫が分かりました。', closing: 'これから野菜を大切に食べます。', from: '三年一組より' },
  { to: '図書館のみなさんへ', purpose: '図書館見学のお礼', body: '本の分類や返却の仕事を教えてくださり、ありがとうございました。', detail: '分類番号で本をさがせると分かりました。', closing: '今度は家族と本を借りに行きます。', from: '三年二組より' },
  { to: '転校したまなさんへ', purpose: '近況を知らせる', body: '新しい学校にはなれましたか。こちらでは音楽会の練習が始まりました。', detail: '今年はリコーダーで春の曲をふきます。', closing: 'また手紙をください。', from: 'あいより' },
  { to: '一年生のみなさんへ', purpose: '行事へ招待する', body: '来週の水曜日に、体育館でおもちゃ祭りを開きます。', detail: '魚つりとまと当ての店があります。', closing: 'ぜひ遊びに来てください。', from: '三年三組より' },
  { to: '未来の自分へ', purpose: '今の目標を残す', body: '今は動物のくらしを調べることが好きです。', detail: '図かんで調べたことをノートへまとめています。', closing: '六年生になったら、この手紙を読んでください。', from: '三年生のはるとより' },
  { to: 'おばあちゃんへ', purpose: '旅行の予定を伝える', body: '夏休みに会いに行けることになりました。', detail: 'いっしょに川辺を散歩したいです。', closing: '暑いので体に気をつけてください。', from: 'みおより' },
  { to: '消防署のみなさんへ', purpose: '見学のお礼', body: '消防車の道具を見せてくださり、ありがとうございました。', detail: '毎日の点検が命を守ると知りました。', closing: '学んだことを家族にも話します。', from: '三年生一同より' },
  { to: '山田先生へ', purpose: '欠席中の連絡へのお礼', body: '休んだ日の学習を知らせてくださり、ありがとうございました。', detail: '教えていただいたページまで読みました。', closing: '明日は元気に登校します。', from: 'けいたより' },
  { to: '公園を使うみなさんへ', purpose: 'ごみ持ち帰りをお願いする', body: '公園に空きかんや紙くずが落ちています。', detail: 'ごみ箱がない時は家まで持ち帰ってください。', closing: 'みんなで気持ちよく使える公園にしましょう。', from: '子ども会より' },
  { to: '読書会のみなさんへ', purpose: '日程変更を知らせる', body: '土曜日の読書会は、雨のため日曜日へ変わりました。', detail: '時間は午前十時、場所は図書室です。', closing: '来られない場合は金曜日までに知らせてください。', from: '図書委員より' },
];

const discussionRows = [
  { topic: '学級文庫に入れる本', claim: '物語と科学の本を半分ずつ選ぶ', reason: 'いろいろな読みたい気持ちに応えられるから', question: '希望が多い本をどう決めますか', response: '貸出記録とアンケートを使おう' },
  { topic: '雨の日の休み時間', claim: '教室でできる遊びの表を作る', reason: '安全に楽しく過ごせるから', question: '道具が少ない遊びはありますか', response: '読書や言葉遊びも入れよう' },
  { topic: 'お楽しみ会の内容', claim: '全員が一つずつ案を出して投票する', reason: 'みんなの意見を集められるから', question: '同じ票になったらどうしますか', response: '準備時間を比べて決めよう' },
  { topic: '教室の節電', claim: '使わない照明を当番が確認する', reason: 'むだな電気を減らせるから', question: '暗い日はどうしますか', response: '必要な場所は安全のため点灯しよう' },
  { topic: '給食の残りを減らす', claim: '食べられる量を最初に伝える', reason: '無理なく食べきりやすいから', question: '後で足りなくなったらどうしますか', response: '残りがあれば追加できるようにしよう' },
  { topic: '係活動の分担', claim: '得意なことと挑戦したいことを聞く', reason: '意欲を持って活動できるから', question: '希望が重なったらどうしますか', response: '交代制やじゃんけんの基準を決めよう' },
  { topic: '校庭の使い方', claim: '曜日ごとに使う場所を分ける', reason: 'ボール遊びと鬼ごっこがぶつからないから', question: '使う人が少ない日はどうしますか', response: '安全を確認して場所を共有しよう' },
  { topic: '町たんけんの発表', claim: '地図と写真を組み合わせる', reason: '場所と気づきを一緒に伝えられるから', question: '写真がない場所はどうしますか', response: '絵や文章でようすを補おう' },
  { topic: '学級目標', claim: '相手の話を最後まで聞くを入れる', reason: '安心して意見を言える学級になるから', question: '守れたかどう確かめますか', response: '週末にみんなで振り返ろう' },
  { topic: '校内の安全', claim: 'ろう下を歩くことをポスターで伝える', reason: '走ってぶつかる事故を減らせるから', question: 'ポスター以外の方法はありますか', response: '放送や学級での声かけも使おう' },
];

const makeRefinedProblem = (unitId: string, n: number): GeneralProblem => {
  const variant = n % 5;
  const index = Math.floor(n / 5) % 10;
  if (unitId === 'KOKUGO_G3_U01') {
    const x = kanjiRows[index];
    if (variant === 0) return { question: `「${x.word}」の読みは？`, answer: x.reading, options: choices(x.reading, kanjiRows.map(v => v.reading), index), hint: '文の中での読みを考えよう。' };
    if (variant === 1) return { question: `「${x.reading}」を漢字で書くと？`, answer: x.word, options: choices(x.word, kanjiRows.map(v => v.word), index), hint: '読みと漢字を結びつけよう。' };
    if (variant === 2) return { question: `「${x.sentence}」で使われている三年生の漢字の言葉は？`, answer: x.word, options: choices(x.word, kanjiRows.map(v => v.word), index), hint: '文の意味に合う言葉を選ぼう。' };
    if (variant === 3) return { question: `「${x.word}」に近い意味は？`, answer: x.meaning, options: choices(x.meaning, kanjiRows.map(v => v.meaning), index), hint: '言葉の意味を考えよう。' };
    return { question: `音を聞いて、${index + 1}番の漢字を選ぼう。`, answer: x.word, options: choices(x.word, kanjiRows.map(v => v.word), index), hint: '聞こえた読みと漢字を結びつけよう。', audioPrompt: { text: x.reading, lang: 'ja-JP', autoPlay: true } };
  }
  if (unitId === 'KOKUGO_G3_U02') {
    const x = dictionaryRows[index];
    if (variant === 0) return { question: `国語辞典で「${x.word}」を引く時、最初に見る文字は？`, answer: x.head, options: choices(x.head, dictionaryRows.map(v => v.head), index), hint: '最初の音を確かめよう。' };
    if (variant === 1) return { question: `「${x.word}」の意味は？`, answer: x.meaning, options: choices(x.meaning, dictionaryRows.map(v => v.meaning), index), hint: '辞典の意味に合うものを選ぼう。' };
    if (variant === 2) return { question: `「${x.word}」を正しく使った文は？`, answer: x.example, options: choices(x.example, dictionaryRows.map(v => v.example), index), hint: '意味に合う使い方を考えよう。' };
    if (variant === 3) return { question: `辞典で「${x.word}」の近くをさがす時、前にありそうな言葉は？`, answer: x.before, options: choices(x.before, dictionaryRows.map(v => v.before), index), hint: '五十音順を使おう。' };
    return { question: `「${x.word}」を辞典で調べると、読みと意味のほかに何を確かめられる？`, answer: '使い方の例', options: d('使い方の例', '明日の天気', '書いた人の体重', '商品の値段'), hint: '辞典の見出し語の説明を思い出そう。' };
  }
  if (unitId === 'KOKUGO_G3_U03') {
    const x = paragraphRows[index]; const text = `${x.first}${x.second}${x.third}`;
    if (variant === 0) return { question: `文章「${text}」の中心となる話題は？`, answer: x.topic, options: choices(x.topic, paragraphRows.map(v => v.topic), index), hint: '三つの文に共通する内容を考えよう。' };
    if (variant === 1) return { question: `「${x.title}」の段落で、最初の文は？`, answer: x.first, options: choices(x.first, paragraphRows.map(v => v.first), index), hint: '段落の始まりを確かめよう。' };
    if (variant === 2) return { question: `「${x.title}」の段落で、二番目の内容は？`, answer: x.second, options: choices(x.second, paragraphRows.map(v => v.second), index), hint: '文の順序を追おう。' };
    if (variant === 3) return { question: `「${x.title}」の段落の内容を順に並べたものは？`, answer: x.order, options: choices(x.order, paragraphRows.map(v => v.order), index), hint: '最初・次・最後を整理しよう。' };
    return { question: `「${x.title}」の次に別の話題を書く時は？`, answer: '段落を変えて一字下げる', options: d('段落を変えて一字下げる', '同じ行へ続ける', '句点を全部消す', '題名だけ変える'), hint: '話題のまとまりで段落を分ける。' };
  }
  if (unitId === 'KOKUGO_G3_U04') {
    const x = storyRows[index];
    if (variant === 0) return { question: `物語「${x.text}」の中心人物は？`, answer: x.who, options: choices(x.who, storyRows.map(v => v.who), index), hint: '行動の中心となる人物を見よう。' };
    if (variant === 1) return { question: `物語「${x.text}」で、${x.who}は何をした？`, answer: x.action, options: choices(x.action, storyRows.map(v => v.action), index), hint: '人物の行動を読み取ろう。' };
    if (variant === 2) return { question: `物語「${x.text}」で、その行動をしたわけは？`, answer: x.reason, options: choices(x.reason, storyRows.map(v => v.reason), index), hint: '出来事と行動を結びつけよう。' };
    if (variant === 3) return { question: `物語「${x.text}」の気持ちの変化は？`, answer: x.change, options: choices(x.change, storyRows.map(v => v.change), index), hint: '初めと終わりをくらべよう。' };
    return { question: `物語「${x.text}」に合う題名は？`, answer: x.title, options: choices(x.title, storyRows.map(v => v.title), index), hint: '中心の出来事が分かる題名を選ぼう。' };
  }
  if (unitId === 'KOKUGO_G3_U05') {
    const x = explanationRows[index];
    if (variant === 0) return { question: `説明「${x.text}」の話題は？`, answer: x.topic, options: choices(x.topic, explanationRows.map(v => v.topic), index), hint: '何を説明しているか考えよう。' };
    if (variant === 1) return { question: `説明「${x.text}」から分かる事実は？`, answer: x.fact, options: choices(x.fact, explanationRows.map(v => v.fact), index), hint: '本文に書かれたことを選ぼう。' };
    if (variant === 2) return { question: `説明「${x.text}」で示された理由は？`, answer: x.reason, options: choices(x.reason, explanationRows.map(v => v.reason), index), hint: 'なぜそうなるかを読み取ろう。' };
    if (variant === 3) return { question: `説明「${x.text}」で、文の関係を示す言葉は？`, answer: x.connector, options: choices(x.connector, explanationRows.map(v => v.connector), index), hint: '順序・理由・例を表す言葉を見よう。' };
    return { question: `説明「${x.text}」を一文でまとめると？`, answer: x.summary, options: choices(x.summary, explanationRows.map(v => v.summary), index), hint: '話題と大事な内容を残そう。' };
  }
  if (unitId === 'KOKUGO_G3_U06') {
    const x = summaryRows[index];
    if (variant === 0) return { question: `文章「${x.text}」の要点は？`, answer: x.key, options: choices(x.key, summaryRows.map(v => v.key), index), hint: '大事な内容を短くまとめよう。' };
    if (variant === 1) return { question: `文章「${x.text}」の中心話題は？`, answer: x.topic, options: choices(x.topic, summaryRows.map(v => v.topic), index), hint: '何についての文章か考えよう。' };
    if (variant === 2) return { question: `文章「${x.text}」で、要点を支える大事な事実は？`, answer: x.detail, options: choices(x.detail, summaryRows.map(v => v.detail), index), hint: '中心内容に関係する事実を選ぼう。' };
    if (variant === 3) return { question: `「${x.key}」は何をして作った文？`, answer: '大事な内容を残して短くした', options: d('大事な内容を残して短くした', '感想だけを加えた', '本文を逆の意味にした', '例をすべて増やした'), hint: '要約の作り方を考えよう。' };
    return { question: `文章「${x.text}」を要約する時、なくしても中心が変わりにくい言葉は？`, answer: x.omit, options: choices(x.omit, summaryRows.map(v => v.omit), index), hint: '中心内容に必要か確かめよう。' };
  }
  if (unitId === 'KOKUGO_G3_U07') {
    const x = compositionRows[index]; const text = `${x.opening}${x.event}。${x.detail}。${x.feeling}。${x.ending}`;
    if (variant === 0) return { question: `作文「${text}」に合う題名は？`, answer: x.title, options: choices(x.title, compositionRows.map(v => v.title), index), hint: '中心の出来事を表す題名にしよう。' };
    if (variant === 1) return { question: `作文「${text}」の書き出しは？`, answer: x.opening, options: choices(x.opening, compositionRows.map(v => v.opening), index), hint: 'いつ何をしたか分かる文を見よう。' };
    if (variant === 2) return { question: `作文「${text}」の中心の出来事は？`, answer: x.event, options: choices(x.event, compositionRows.map(v => v.event), index), hint: '何をした作文か考えよう。' };
    if (variant === 3) return { question: `作文「${text}」で、出来事をくわしくする文は？`, answer: x.detail, options: choices(x.detail, compositionRows.map(v => v.detail), index), hint: '行動や様子を具体的にした文を選ぼう。' };
    return { question: `作文「${text}」の終わりに書かれた今後の考えは？`, answer: x.ending, options: choices(x.ending, compositionRows.map(v => v.ending), index), hint: '最後の文を確かめよう。' };
  }
  if (unitId === 'KOKUGO_G3_U08') {
    const x = letterRows[index]; const text = `${x.to} ${x.body}${x.detail}${x.closing} ${x.from}`;
    if (variant === 0) return { question: `手紙「${text}」の相手は？`, answer: x.to, options: choices(x.to, letterRows.map(v => v.to), index), hint: '手紙の初めの宛名を見よう。' };
    if (variant === 1) return { question: `手紙「${text}」を書いた目的は？`, answer: x.purpose, options: choices(x.purpose, letterRows.map(v => v.purpose), index), hint: '一番伝えたい用件を考えよう。' };
    if (variant === 2) return { question: `手紙「${text}」の中心となる用件は？`, answer: x.body, options: choices(x.body, letterRows.map(v => v.body), index), hint: '相手へ伝えたい中心文を選ぼう。' };
    if (variant === 3) return { question: `手紙「${text}」で、用件をくわしくする文は？`, answer: x.detail, options: choices(x.detail, letterRows.map(v => v.detail), index), hint: '具体的な内容を加えた文を選ぼう。' };
    return { question: `手紙「${text}」の終わりの言葉は？`, answer: x.closing, options: choices(x.closing, letterRows.map(v => v.closing), index), hint: '差出人の前の文を見よう。' };
  }
  const x = discussionRows[index];
  if (variant === 0) return { question: `話し合い「${x.topic}」で出された意見は？`, answer: x.claim, options: choices(x.claim, discussionRows.map(v => v.claim), index), hint: '提案された内容を聞き取ろう。' };
  if (variant === 1) return { question: `「${x.claim}」という意見の理由は？`, answer: x.reason, options: choices(x.reason, discussionRows.map(v => v.reason), index), hint: '意見と理由を結びつけよう。' };
  if (variant === 2) return { question: `「${x.topic}」の話し合いで、確かめる質問は？`, answer: x.question, options: choices(x.question, discussionRows.map(v => v.question), index), hint: '決めるために必要な情報を問おう。' };
  if (variant === 3) return { question: `質問「${x.question}」への建設的な答えは？`, answer: x.response, options: choices(x.response, discussionRows.map(v => v.response), index), hint: '相手の疑問に答え、案を良くしよう。' };
  return { question: `「${x.topic}」の話し合いを進めるために大切なことは？`, answer: '意見・理由・質問をつなげて聞く', options: d('意見・理由・質問をつなげて聞く', '一人だけが話し続ける', '理由を言わず多数決する', '話題と関係ない話をする'), hint: '意見を比べ、理由を確かめよう。' };
};

(Object.keys(KOKUGO_G3_UNIT_DATA) as Array<keyof typeof KOKUGO_G3_UNIT_DATA>).forEach((unitId) => {
  KOKUGO_G3_UNIT_DATA[unitId] = Array.from({ length: 50 }, (_, n) => {
    const problem=makeRefinedProblem(unitId,n);
    if(unitId!=='KOKUGO_G3_U04')return problem;
    const storyIndex=Math.floor(n/5)%storyRows.length;
    const text=storyRows[storyIndex].text;
    const title=storyRows[storyIndex].title;
    return{...problem,question:problem.question.replace(`物語「${text}」`,`物語「${title}」`),passage:text,passageTitle:`物語「${title}」本文`};
  });
});

export const KOKUGO_G3_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G3_1: Object.values(KOKUGO_G3_UNIT_DATA).flat(),
  ...KOKUGO_G3_UNIT_DATA,
};
