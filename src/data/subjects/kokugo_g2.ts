import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G2_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G2_U01: [], // かたかなのことば
  KOKUGO_G2_U02: [], // 主語 と 述語
  KOKUGO_G2_U03: [], // 文のきまり
  KOKUGO_G2_U04: [], // 日記を書く
  KOKUGO_G2_U05: [], // せつめい文を読む
  KOKUGO_G2_U06: [], // 物語を読む
  KOKUGO_G2_U07: [], // 大事なことを見つける
  KOKUGO_G2_U08: [], // 手紙を書く
  KOKUGO_G2_U09: [], // 作文を書く
  KOKUGO_G2_U10: [], // 話を聞く
  KOKUGO_G2_U11: [], // 順序よく話す
};

const katakanaWords = ['パン', 'ノート', 'ボール', 'テレビ', 'ジュース', 'バス', 'ペン', 'ソファ', 'ゲーム', 'ジャム', 'ギョーザ', 'ピアノ', 'チョコ', 'キャンプ', 'シャツ', 'ニュース', 'ギャラリー', 'ジャケット', 'ビャクヤ', 'ピューマ', 'ギョウザ', 'ジュラルミン'];
const subjects = ['わたし', 'ねこ', 'たろう', 'せんせい', 'でんしゃ'];
const predicates = ['はしる', 'わらう', 'よむ', 'たべる', 'きた'];
const diaryActions = ['こうえんで あそびました', '本を よみました', 'ともだちと はなしました', 'えを かきました'];
const storyHeroes = ['たろう', '花子', 'きつね', 'うさぎ'];
const storyPlaces = ['森', '公園', '学校', '川べり'];
const storyActions = ['はしりました', '見つけました', 'わらいました', 'ひろいました'];
const letterOpenings = ['○○さんへ', 'おばあさんへ', '先生へ', 'ともだちへ'];
const orderWords = ['はじめに', 'つぎに', 'それから', 'さいごに'];
const readingPassages = [
  { text: 'たろうは 森で どんぐりを 見つけました。', subject: 'たろう', place: '森', action: 'どんぐりを 見つけました' },
  { text: '花子は 学校で 友だちと わらいました。', subject: '花子', place: '学校', action: '友だちと わらいました' },
  { text: 'うさぎは 川べりで はしりました。', subject: 'うさぎ', place: '川べり', action: 'はしりました' },
  { text: 'きつねは 公園で はっぱを ひろいました。', subject: 'きつね', place: '公園', action: 'はっぱを ひろいました' },
];
const explanatoryPassages = [
  { text: 'まず えんぴつを もちます。 つぎに ノートに かきます。', answer: 'じゅんじょ' },
  { text: '手を あらってから、 ハンカチで ふきます。', answer: 'やり方' },
  { text: 'あさ、 まどを あけます。 それから くうきを いれかえます。', answer: '手じゅん' },
];

const g2Choices = (answer: string, values: string[], index: number): string[] => {
  const rotated = [...values.slice(index + 1), ...values.slice(0, index + 1), '書いていない', 'わからない', 'べつのこと'];
  return d(answer, ...[...new Set(rotated)].filter((value) => value !== answer).slice(0, 3));
};

const refinedKatakanaWords = [
  { word: 'パン', reading: 'ぱん', group: '食べもの' }, { word: 'ノート', reading: 'のーと', group: '学用品' },
  { word: 'ボール', reading: 'ぼーる', group: '遊びのどうぐ' }, { word: 'テレビ', reading: 'てれび', group: '家で使うもの' },
  { word: 'ジュース', reading: 'じゅーす', group: '飲みもの' }, { word: 'バス', reading: 'ばす', group: '乗りもの' },
  { word: 'ペン', reading: 'ぺん', group: '学用品' }, { word: 'ソファ', reading: 'そふぁ', group: '家で使うもの' },
  { word: 'ゲーム', reading: 'げーむ', group: '遊び' }, { word: 'ジャム', reading: 'じゃむ', group: '食べもの' },
  { word: 'ピアノ', reading: 'ぴあの', group: '楽き' }, { word: 'チョコレート', reading: 'ちょこれーと', group: '食べもの' },
  { word: 'キャンプ', reading: 'きゃんぷ', group: '外ですること' }, { word: 'シャツ', reading: 'しゃつ', group: '着るもの' },
  { word: 'ニュース', reading: 'にゅーす', group: '知らせ' }, { word: 'ロボット', reading: 'ろぼっと', group: 'きかい' },
  { word: 'カメラ', reading: 'かめら', group: '写真をとるどうぐ' }, { word: 'タオル', reading: 'たおる', group: '体をふくもの' },
  { word: 'スプーン', reading: 'すぷーん', group: '食事のどうぐ' }, { word: 'カレンダー', reading: 'かれんだー', group: '日づけを見るもの' },
  { word: 'エレベーター', reading: 'えれべーたー', group: '上下に動く乗りもの' }, { word: 'コンピューター', reading: 'こんぴゅーたー', group: 'きかい' },
];

const refinedSentenceRows = [
  { text: '小鳥が 空を とびます。', subject: '小鳥が', predicate: 'とびます', detail: '空を', question: '小鳥は どこを とびますか？' },
  { text: '弟は 牛にゅうを 飲みます。', subject: '弟は', predicate: '飲みます', detail: '牛にゅうを', question: '弟は 何を 飲みますか？' },
  { text: '赤い 花が さきました。', subject: '赤い 花が', predicate: 'さきました', detail: '赤い', question: '何が さきましたか？' },
  { text: 'わたしは 図書かんで 本を 読みます。', subject: 'わたしは', predicate: '読みます', detail: '図書かんで', question: 'わたしは どこで 本を 読みますか？' },
  { text: '大きな ふねが 海を 進みます。', subject: '大きな ふねが', predicate: '進みます', detail: '海を', question: 'ふねは どこを 進みますか？' },
  { text: '先生が 黒ばんに 字を 書きます。', subject: '先生が', predicate: '書きます', detail: '黒ばんに', question: '先生は どこに 字を 書きますか？' },
  { text: 'ねこが いすの 下で ねています。', subject: 'ねこが', predicate: 'ねています', detail: 'いすの 下で', question: 'ねこは どこで ねていますか？' },
  { text: '雨が しずかに ふっています。', subject: '雨が', predicate: 'ふっています', detail: 'しずかに', question: '雨は どのように ふっていますか？' },
  { text: '友だちと 公園で なわとびを しました。', subject: 'わたしは', predicate: 'しました', detail: '友だちと 公園で', question: 'だれと どこで なわとびを しましたか？' },
  { text: '朝、つばめが 電線に とまりました。', subject: 'つばめが', predicate: 'とまりました', detail: '朝、電線に', question: 'つばめは いつ どこに とまりましたか？' },
];

const refinedDiaries = [
  { day: '五月十日', event: '学校の はたけに ミニトマトを うえました', feeling: '大きく そだつと いいなと 思いました', title: 'ミニトマトを うえた日', detail: '土を やさしく かけました' },
  { day: '六月三日', event: '雨上がりに にじを 見つけました', feeling: '七つの 色が きれいで うれしかったです', title: '大きな にじ', detail: '校しゃの 上まで のびていました' },
  { day: '七月十五日', event: 'プールで 二十五メートル およぎました', feeling: 'さいごまで およげて 自しんが つきました', title: 'はじめての 二十五メートル', detail: '先生が はげまして くれました' },
  { day: '九月八日', event: '虫とりで 大きな ばったを つかまえました', feeling: '足の 力が 強くて おどろきました', title: '元気な ばった', detail: '見たあとで 草むらに かえしました' },
  { day: '十月二十日', event: '図書かんで 星の 本を かりました', feeling: '夜に 読むのが 楽しみです', title: '星の 本', detail: 'きれいな 写真が のっていました' },
  { day: '十一月五日', event: '学年で 音楽会の れんしゅうを しました', feeling: '音が そろって うれしかったです', title: '音が そろったよ', detail: 'けんばんハーモニカを ひきました' },
  { day: '十二月十二日', event: '家で クッキーを 作りました', feeling: 'あまい においが して わくわくしました', title: '星の クッキー', detail: '星の 形に ぬきました' },
  { day: '一月十八日', event: '校ていに 雪が つもりました', feeling: '友だちと 遊べて 楽しかったです', title: '雪の 校てい', detail: '小さな 雪だるまを 作りました' },
  { day: '二月九日', event: 'なわとびで 二十回 とべました', feeling: '毎日 れんしゅうして よかったです', title: '二十回 とべた', detail: '前とびを れんしゅうしました' },
  { day: '三月一日', event: '一年生に 学校を あんないしました', feeling: 'やさしく 話せて ほっとしました', title: '学校あんない', detail: '図書室と ほけん室を しょうかいしました' },
];

const refinedExplanations = [
  { text: 'まず はちに 土を 入れます。つぎに たねを まき、うすく 土を かけます。さいごに 水を あげます。', topic: 'たねの まき方', first: 'はちに 土を 入れる', next: 'たねを まく', last: '水を あげる', reason: 'たねを そだてるため' },
  { text: '手を 水で ぬらし、せっけんを つけます。手の ひらや 指の 間を あらってから、水で ながします。', topic: '手の あらい方', first: '手を 水で ぬらす', next: 'せっけんで あらう', last: '水で ながす', reason: '手の よごれを おとすため' },
  { text: '図書かんでは 小さな 声で 話します。本を 読みおわったら、もとの 場所へ もどします。', topic: '図書かんの きまり', first: '小さな 声で 話す', next: '本を 読む', last: '本を もどす', reason: 'みんなが 気もちよく 使うため' },
  { text: '紙を 半分に おります。つぎに ひらき、まん中の 線に 合わせて りょうはしを おります。', topic: '紙の おり方', first: '紙を 半分に おる', next: '紙を ひらく', last: 'りょうはしを おる', reason: '形を きれいに 作るため' },
  { text: '道を わたる前に 右と 左を 見ます。車が 来ないことを たしかめてから、手を 上げて わたります。', topic: '道の わたり方', first: '右と 左を 見る', next: '車が 来ないか たしかめる', last: '手を 上げて わたる', reason: 'あんぜんに 道を わたるため' },
  { text: 'ぞうきんを 水で ぬらして、かたく しぼります。つくえの はしから じゅんに ふきます。', topic: 'つくえの ふき方', first: 'ぞうきんを ぬらす', next: 'ぞうきんを しぼる', last: 'つくえを ふく', reason: 'つくえを きれいに するため' },
  { text: 'はじめに えんぴつで 下書きを します。色を ぬったあと、さいごに 名前を 書きます。', topic: '絵の しあげ方', first: '下書きを する', next: '色を ぬる', last: '名前を 書く', reason: '絵を じゅんに しあげるため' },
  { text: '朝おきたら カーテンを あけます。顔を あらい、朝ごはんを 食べてから、学校の じゅんびを します。', topic: '朝の じゅんび', first: 'カーテンを あける', next: '顔を あらう', last: '学校の じゅんびを する', reason: '学校へ 行く じゅんびを するため' },
  { text: 'はさみを わたすときは、はを とじます。持ち手を 相手に むけて、ゆっくり わたします。', topic: 'はさみの わたし方', first: 'はを とじる', next: '持ち手を 相手に むける', last: 'ゆっくり わたす', reason: 'けがを ふせぐため' },
  { text: 'きゅう食の 前に つくえを ふき、手を あらいます。はいぜんが すんだら、しずかに まちます。', topic: 'きゅう食の じゅんび', first: 'つくえを ふく', next: '手を あらう', last: 'しずかに まつ', reason: '気もちよく きゅう食を 食べるため' },
];

const refinedStories = [
  { text: 'ゆうきは 雨上がりの 校ていで、動けない ちょうを 見つけました。そっと 葉の 上へ のせると、ちょうは 羽を ひらきました。', who: 'ゆうき', place: '雨上がりの 校てい', action: 'ちょうを 葉に のせた', reason: 'ちょうが 動けなかったから', feeling: '元気に なってほしい' },
  { text: 'みほは 図書室で 本を さがしていました。上の たなに とどかないと、そばの 友だちが とって くれました。', who: 'みほ', place: '図書室', action: '本を さがした', reason: '読みたい 本が あったから', feeling: '友だちに ありがとうと 思った' },
  { text: 'こうたは 公園で 赤い 手ぶくろを ひろいました。交番へ とどけると、もち主が 見つかりました。', who: 'こうた', place: '公園', action: '手ぶくろを 交番へ とどけた', reason: 'おとし物だと 思ったから', feeling: 'もち主が 見つかって うれしい' },
  { text: 'さきは 朝、あさがおの 花が さいているのを 見つけました。家の 人を よんで、いっしょに 数えました。', who: 'さき', place: '家の にわ', action: '花を 家の 人と 数えた', reason: '花が さいたから', feeling: '花が さいで うれしい' },
  { text: 'りくは 川原で 形の おもしろい 石を 見つけました。弟への おみやげに しようと、ふくろへ 入れました。', who: 'りく', place: '川原', action: '石を ふくろへ 入れた', reason: '弟に あげたいから', feeling: '弟が よろこぶと いいな' },
  { text: 'ななは 音楽会の れんしゅうで、音を まちがえて しまいました。休み時間にも れんしゅうし、つぎは 正しく ひけました。', who: 'なな', place: '音楽室', action: '休み時間にも れんしゅうした', reason: '正しく ひきたいから', feeling: 'できるように なって うれしい' },
  { text: 'そうたは 雪の日に、小さな 雪だるまを 作りました。つぎの 朝、少し 小さく なっていて びっくりしました。', who: 'そうた', place: '雪の つもった にわ', action: '雪だるまを 作った', reason: '雪が つもったから', feeling: '小さく なって おどろいた' },
  { text: 'えまは かいだんで 重そうな にもつを 持つ 先生に 会いました。いっしょに 持つと、先生が わらいました。', who: 'えま', place: 'かいだん', action: '先生の にもつを 持った', reason: '先生が 重そうだったから', feeling: '手つだえて よかった' },
  { text: 'はるは 遠足で おべんとうを あけました。にが手な やさいも 一口 食べると、思ったより あまくて おどろきました。', who: 'はる', place: '遠足の 休けい場所', action: 'やさいを 一口 食べた', reason: '食べてみようと 思ったから', feeling: 'あまくて おどろいた' },
  { text: 'あおいは 帰り道で 黒い 雲を 見ました。いそいで 家に 入ると、すぐに 大つぶの 雨が ふり出しました。', who: 'あおい', place: '家までの 帰り道', action: 'いそいで 家に 入った', reason: '黒い 雲を 見たから', feeling: 'ぬれなくて ほっとした' },
];

const refinedLetters = [
  { to: 'おばあちゃんへ', opening: 'お元気ですか', message: '学校で ミニトマトを そだてています', detail: '赤い 実が 二つ できました', closing: 'こんど 写真を 見せます', from: 'ゆいより' },
  { to: '山田先生へ', opening: 'いつも ありがとうございます', message: 'かして いただいた 本を 読みおわりました', detail: '主人公が 友だちを たすける ところが すきです', closing: '明日 本を お返しします', from: 'たくみより' },
  { to: 'けんたさんへ', opening: 'おたん生日 おめでとう', message: '日曜日の 会を 楽しみに しています', detail: 'いっしょに ゲームを したいです', closing: '元気に 会いましょう', from: 'そうたより' },
  { to: '一年生のみなさんへ', opening: '学校たんけんに 来てください', message: '図書室を あんないします', detail: 'おもしろい 本を しょうかいします', closing: '火曜日に まっています', from: '二年一組より' },
  { to: '公園を そうじしてくださった方へ', opening: 'きれいに してくださり ありがとうございます', message: '気もちよく 遊ぶことが できました', detail: 'ごみを 見つけたら わたしも ひろいます', closing: 'これからも 大切に 使います', from: 'みなみより' },
  { to: 'お父さんへ', opening: '出ちょう おつかれさまです', message: '家では みんな 元気です', detail: 'ぼくは なわとびを れんしゅうしています', closing: '土曜日に 帰るのを まっています', from: 'りょうより' },
  { to: '図書いいんのみなさんへ', opening: '読み聞かせを ありがとうございました', message: 'きょうりゅうの お話が おもしろかったです', detail: '大きな 声で 読んでいて 聞きやすかったです', closing: 'つぎの 会も 楽しみです', from: '二年二組より' },
  { to: 'となりの クラスのみなさんへ', opening: 'お知らせが あります', message: '金曜日に おもちゃまつりを ひらきます', detail: '体育かんに お店を ならべます', closing: 'ぜひ 遊びに 来てください', from: '二年三組より' },
  { to: 'まいさんへ', opening: 'この前は ありがとう', message: '休んだ日の プリントを とどけてくれて 助かりました', detail: 'もう 元気に なりました', closing: '明日 学校で 会いましょう', from: 'あかりより' },
  { to: '未来の わたしへ', opening: '二年生の わたしから 手紙を 書きます', message: '今は 虫の かんさつが 大すきです', detail: 'とくに てんとう虫を よく 見ています', closing: '大きく なっても 好きだと いいな', from: '二年生の こうより' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G2_U01': {
      const word = katakanaWords[n % katakanaWords.length];
      if (n % 3 === 0) {
        return { question: `カタカナで かく ことばは どれ？`, answer: word, options: d(word, 'いぬ', 'やま', 'かわ'), hint: '外来語や ものの 名前に 多い。' };
      }
      if (n % 3 === 1) {
        return { question: `「${word}」の はじめの もじは？`, answer: word.charAt(0), options: d(word.charAt(0), word.charAt(1) || 'ン', 'ア', 'ラ'), hint: 'はじめの もじを みよう。' };
      }
      return {
        question: 'おとを きいて、どの ことばか えらぼう。',
        answer: word,
        options: d(word, katakanaWords[(n + 1) % katakanaWords.length], katakanaWords[(n + 2) % katakanaWords.length], katakanaWords[(n + 3) % katakanaWords.length]),
        hint: 'カタカナの ことばを ききとる。',
        audioPrompt: { text: word, lang: 'ja-JP', autoPlay: true },
      };
    }
    case 'KOKUGO_G2_U02': {
      const s = subjects[n % subjects.length];
      const p = predicates[n % predicates.length];
      if (n % 4 === 0) {
        return { question: `「${s}が ${p}。」の 主語は？`, answer: s, options: d(s, p, '。', 'が'), hint: 'だれ・なにが。' };
      }
      if (n % 4 === 1) {
        return { question: `「${s}が ${p}。」の 述語は？`, answer: p, options: d(p, s, 'が', '。'), hint: 'どうした。' };
      }
      if (n % 4 === 2) {
        return { question: `主語を あらわす ことばは どれ？`, answer: 'だれ・なにが', options: d('だれ・なにが', 'どうした', 'いつ', 'どこで'), hint: '文の はじめの もと。' };
      }
      return { question: `述語を あらわす ことばは どれ？`, answer: 'どうした', options: d('どうした', 'だれが', 'どこで', 'いつ'), hint: 'しめす うごきや ようす。' };
    }
    case 'KOKUGO_G2_U03': {
      const s = subjects[n % subjects.length];
      const p = predicates[n % predicates.length];
      if (n % 4 === 0) {
        return { question: `ただしい 文は どれ？`, answer: `${s}が ${p}。`, options: d(`${s}が ${p}。`, `${s} ${p}`, `。${s}が ${p}`, `${p}が ${s}。`), hint: '文の おわりに「。」を つける。' };
      }
      if (n % 4 === 1) {
        return { question: `文の おわりに つける きごうは？`, answer: '。', options: d('。', '、', '？', 'っ'), hint: '文の きまり。' };
      }
      if (n % 4 === 2) {
        return { question: '文に するとき ひつような ことは？', answer: 'ことばの じゅんを ととのえる', options: d('ことばの じゅんを ととのえる', 'もじを へらす', '「。」を つけない', '一もじだけに する'), hint: '読みやすい 文の 形。' };
      }
      return { question: '「、」を つかうと よいのは どんな とき？', answer: 'よみやすく くぎる とき', options: d('よみやすく くぎる とき', '文を おわる とき', 'もじを けす とき', '音を のばす とき'), hint: 'くとうてんの つかい方。' };
    }
    case 'KOKUGO_G2_U04': {
      const action = diaryActions[n % diaryActions.length];
      if (n % 4 === 0) {
        return { question: '日記に 入れると よいのは？', answer: 'したこと と 思ったこと', options: d('したこと と 思ったこと', 'むずかしい 漢字だけ', '同じ 文を くりかえす', 'あいさつ だけ'), hint: `たとえば「きょう、${action}。たのしかったです。」` };
      }
      if (n % 4 === 1) {
        return { question: '日記の はじめに かくことが 多いのは？', answer: 'いつの ことか', options: d('いつの ことか', 'さいごの まとめ', 'あいての 名前', 'ねだん'), hint: 'きょう・きのう など。' };
      }
      if (n % 4 === 2) {
        return { question: `「${action}。」の つぎに あると よいのは？`, answer: 'おもったこと', options: d('おもったこと', 'ひらがなひょう', 'なまえだけ', 'きごうだけ'), hint: 'たのしかった・うれしかった など。' };
      }
      return { question: '日記で つたわりやすいのは？', answer: 'じゅんに かく', options: d('じゅんに かく', 'さいごから かく', 'ことばを ぬく', '一文だけに する'), hint: 'できごとの 順。' };
    }
    case 'KOKUGO_G2_U05': {
      const passage = explanatoryPassages[n % explanatoryPassages.length];
      if (n % 4 === 0) {
        return { question: `「${passage.text}」のような ぶんで だいじなのは？`, answer: 'じゅんじょ', options: d('じゅんじょ', 'とうじょうじんぶつ', 'おもしろい せりふ', '気もち'), hint: 'どうするかが 順に書かれる。' };
      }
      if (n % 4 === 1) {
        return { question: `「${passage.text}」で たしかめると よいのは？`, answer: 'なにを どうするか', options: d('なにを どうするか', 'だれが 泣いたか', 'どこが おもしろいか', 'どの えが すきか'), hint: '手じゅんや わけ。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      if (n % 4 === 2) {
        return { question: '「まず」「つぎに」が 出てきやすいのは？', answer: 'せつめい文', options: d('せつめい文', '物語', '日記', 'しりとり'), hint: '手じゅんを あらわす ことば。' };
      }
      return { question: 'せつめい文で よみとることが 多いのは？', answer: 'やり方や わけ', options: d('やり方や わけ', '登場人物の 気もち', '会話の 長さ', 'おもしろい せりふ'), hint: 'せつめいの 中心。' };
    }
    case 'KOKUGO_G2_U06': {
      const story = readingPassages[n % readingPassages.length];
      const hero = story.subject;
      const place = story.place;
      const action = story.action;
      if (n % 4 === 0) {
        return { question: `「${story.text}」 しゅじんこうは だれ？`, answer: hero, options: d(hero, place, 'みち', 'ともだち'), hint: 'ものがたりの 中心。', audioPrompt: { text: story.text, lang: 'ja-JP', autoPlay: true } };
      }
      if (n % 4 === 1) {
        return { question: `「${story.text}」 どこで した？`, answer: place, options: d(place, hero, 'いえ', 'そら'), hint: 'ばしょを たしかめる。' };
      }
      if (n % 4 === 2) {
        return { question: `「${story.text}」 どうした？`, answer: action, options: d(action, 'ねました', 'およぎました', 'うたいました'), hint: 'したことを みつける。' };
      }
      return { question: '物語を よむ とき まず みると よいのは？', answer: 'だれが 出てくるか', options: d('だれが 出てくるか', 'ねだん', '時間わり', '答え'), hint: 'しゅじんこうを つかむ。' };
    }
    case 'KOKUGO_G2_U07': {
      if (n % 4 === 0) {
        return { question: 'ぶんしょうで 大事なことを 見つけるには？', answer: 'くりかえし 出る ことばを みる', options: d('くりかえし 出る ことばを みる', 'さいごだけ よむ', 'えだけ みる', '声を 出さない'), hint: '何ども 出ることばに ちゅうもく。' };
      }
      if (n % 4 === 1) {
        return { question: '大事なことに なりやすいのは？', answer: 'いちばん つたえたいこと', options: d('いちばん つたえたいこと', 'もじの 数', '本の あつさ', '字の 大きさ'), hint: '中心になる 内容。' };
      }
      if (n % 4 === 2) {
        return { question: '大事なことを さがす とき、 よく 見るのは？', answer: 'はじめや さいごの 文', options: d('はじめや さいごの 文', 'ページの 色', '本の 名まえだけ', 'えの 大きさ'), hint: 'まとまりの 目立つ ぶぶん。' };
      }
      return { question: '「いちばん いいたいこと」を 別の いい方で いうと？', answer: '大事なこと', options: d('大事なこと', 'かきじゅん', '字の 形', '音の のばし方'), hint: '文の 中心。' };
    }
    case 'KOKUGO_G2_U08': {
      const opening = letterOpenings[n % letterOpenings.length];
      if (n % 4 === 0) {
        return { question: '手紙の はじめに かくことが 多いのは？', answer: 'あいての 名まえ', options: d('あいての 名まえ', 'さようなら', 'じぶんの しゅみ だけ', '絵 だけ'), hint: 'だれに あてたか。' };
      }
      if (n % 4 === 1) {
        return { question: '手紙の さいごに かくことが 多いのは？', answer: 'かいた 人の 名まえ', options: d('かいた 人の 名まえ', 'あいての 名まえ', 'だい名 だけ', 'きせつの 名まえ'), hint: 'だれが かいたか。' };
      }
      if (n % 4 === 2) {
        return { question: `「${opening}」で はじまる 文は 何を あらわす？`, answer: 'だれに あてたか', options: d('だれに あてたか', 'どこで 書いたか', '何まい 書いたか', '何時に 書いたか'), hint: 'あて名。' };
      }
      return { question: '手紙に あると よいのは？', answer: 'つたえたい こと', options: d('つたえたい こと', 'もじの かずだけ', 'えだけ', '答えだけ'), hint: 'ようけんを 書く。' };
    }
    case 'KOKUGO_G2_U09': {
      if (n % 4 === 0) {
        return { question: '作文を かく とき、 だいじなのは？', answer: 'はじめ・中・おわりを かんがえる', options: d('はじめ・中・おわりを かんがえる', '1文だけ かく', '同じ ことばだけ つかう', '句読点を つけない'), hint: 'じゅんに かくと つたわりやすい。' };
      }
      if (n % 4 === 1) {
        return { question: '作文で つたわりやすいのは？', answer: 'じゅんに できごとを 書く', options: d('じゅんに できごとを 書く', '思いついた ところだけ 書く', '句点を つけない', '一つの 言葉だけ 書く'), hint: 'まとまりを 作る。' };
      }
      if (n % 4 === 2) {
        return { question: '作文に 入れると よいのは？', answer: '思ったこと', options: d('思ったこと', '字の 数だけ', '絵の 説明だけ', 'あいさつだけ'), hint: '気もちも 大切。' };
      }
      return { question: '作文の さいごに あると よいのは？', answer: 'まとめ', options: d('まとめ', 'あて名', 'ねだん', '時こく'), hint: 'しめくくりを 書く。' };
    }
    case 'KOKUGO_G2_U10': {
      if (n % 4 === 0) {
        return { question: '話を 聞く とき よい しせいは？', answer: 'はなす人を 見る', options: d('はなす人を 見る', 'よそ見を する', '歩きまわる', '話を さえぎる'), hint: 'よく きく たいど。' };
      }
      if (n % 4 === 1) {
        return { question: '話を 聞いて わからない ときは？', answer: '聞きなおす', options: d('聞きなおす', 'そのままに する', 'ほかの 話を する', '下を 向く'), hint: 'たしかめることが 大切。' };
      }
      if (n % 4 === 2) {
        return { question: '話を 聞く とき、 しては いけないことは？', answer: 'とちゅうで さえぎる', options: d('とちゅうで さえぎる', 'うなずく', 'さいごまで 聞く', 'しずかに する'), hint: '話し手の 話を さいごまで。' };
      }
      return { question: 'よく 聞けたか たしかめるには？', answer: '聞いたことを 思い出す', options: d('聞いたことを 思い出す', 'すぐ わすれる', 'べつの 話を する', '立って あるく'), hint: '内容を つかむ。' };
    }
    case 'KOKUGO_G2_U11': {
      const first = orderWords[0];
      const second = orderWords[1];
      const third = orderWords[2];
      const last = orderWords[3];
      if (n % 4 === 0) {
        return { question: '順序よく 話す とき、 1ばん はじめに つかう ことばは？', answer: first, options: d(first, second, last, third), hint: 'いちばん 先を あらわす。' };
      }
      if (n % 4 === 1) {
        return { question: '順序よく 話す とき、 おわりに ちかい ことばは？', answer: last, options: d(last, first, second, 'でも'), hint: 'まとめの 前に 使う。' };
      }
      if (n % 4 === 2) {
        return { question: '「つぎに」の あとに つかうと よい ことばは？', answer: third, options: d(third, first, last, 'でも'), hint: '順に ならべる。' };
      }
      return { question: '順序よく 話す と どうなる？', answer: 'わかりやすい', options: d('わかりやすい', 'むずかしく なる', 'みじかく なるだけ', '音が 大きく なる'), hint: '聞く人に 伝わる。' };
    }
    default:
      return { question: 'ただしい 文は どれ？', answer: 'わたしは げんきです。', options: d('わたしは げんきです。', 'わたし げんき', '。わたしは げんき', 'げんきです わたし'), hint: '文の きまり。' };
  }
};

const makeRefinedG2Problem = (unitId: string, n: number): GeneralProblem => {
  if (unitId === 'KOKUGO_G2_U01') {
    const variant = n % 3;
    const index = Math.floor(n / 3) % refinedKatakanaWords.length;
    const item = refinedKatakanaWords[index];
    const otherGroups = refinedKatakanaWords.filter((row) => row.group !== item.group);
    if (variant === 0) return { question: `ひらがなの「${item.reading}」を カタカナで 書いたものは？`, answer: item.word, options: g2Choices(item.word, otherGroups.map((row) => row.word), index), hint: `「${item.reading}」は「${item.word}」と 書く。` };
    if (variant === 1) return { question: `「${item.word}」の はじめの カタカナは？`, answer: [...item.word][0], options: g2Choices([...item.word][0], refinedKatakanaWords.map((row) => [...row.word][0]), index), hint: 'いちばん はじめの 文字を 見よう。' };
    return { question: `${item.group}を あらわす カタカナの ことばは？`, answer: item.word, options: g2Choices(item.word, otherGroups.map((row) => row.word), index), hint: `「${item.word}」は ${item.group}を あらわす。` };
  }

  const variant = n % 5;
  const index = Math.floor(n / 5) % 10;
  if (unitId === 'KOKUGO_G2_U02') {
    const item = refinedSentenceRows[index];
    if (variant === 0) return { question: `「${item.text}」の 主語は？`, answer: item.subject, options: g2Choices(item.subject, refinedSentenceRows.map((row) => row.subject), index), hint: 'だれが、または 何がに あたる まとまり。' };
    if (variant === 1) return { question: `「${item.text}」の 述語は？`, answer: item.predicate, options: g2Choices(item.predicate, refinedSentenceRows.map((row) => row.predicate), index), hint: 'どうする、どんなだに あたる まとまり。' };
    if (variant === 2) return { question: `「${item.text}」で、くわしく せつ明する ことばは？`, answer: item.detail, options: g2Choices(item.detail, refinedSentenceRows.map((row) => row.detail), index), hint: 'いつ、どこで、どのようにを くわしくする。' };
    if (variant === 3) return { question: `「${item.text}」の 主語と 述語の 組み合わせは？`, answer: `${item.subject}・${item.predicate}`, options: g2Choices(`${item.subject}・${item.predicate}`, refinedSentenceRows.map((row) => `${row.subject}・${row.predicate}`), index), hint: 'だれが、どうするを つなげよう。' };
    return { question: `「${item.text}」について たずねる 文は？`, answer: item.question, options: g2Choices(item.question, refinedSentenceRows.map((row) => row.question), index), hint: 'もとの 文に 合う たずね方を えらぼう。' };
  }
  if (unitId === 'KOKUGO_G2_U03') {
    const item = refinedSentenceRows[index];
    const noPeriod = item.text.replace(/。$/, '');
    if (variant === 0) return { question: `文の きまりに 合う 書き方は？「${noPeriod}」`, answer: item.text, options: d(item.text, noPeriod, `。${noPeriod}`, `${noPeriod}、`), hint: '文の おわりには「。」を つける。' };
    if (variant === 1) return { question: `「${item.text}」の おわりに ある しるしは？`, answer: '。', options: d('。', '、', '？', '「'), hint: '言い切る 文の おわりは 句点。' };
    if (variant === 2) return { question: `「${item.question}」の おわりに 合う しるしは？`, answer: '？', options: d('？', '。', '、', 'ー'), hint: 'たずねる 文には「？」を 使える。' };
    if (variant === 3) return { question: `「${item.text}」を とちゅうで 読みやすく くぎる しるしは？`, answer: '、', options: d('、', '。', '？', '「'), hint: '文の とちゅうの くぎりには 読点を 使う。' };
    return { question: `「${item.text}」が 文として まとまっている わけは？`, answer: '主語と 述語が つながっている', options: d('主語と 述語が つながっている', '文字が 一つだけだから', 'おわりから 読むから', '同じ 言葉だけだから'), hint: 'だれが、どうするが つながると 文になる。' };
  }
  if (unitId === 'KOKUGO_G2_U04') {
    const item = refinedDiaries[index];
    const text = `${item.day}。${item.event}。${item.detail}。${item.feeling}。`;
    if (variant === 0) return { question: `日記「${text}」いつの こと？`, answer: item.day, options: g2Choices(item.day, refinedDiaries.map((row) => row.day), index), hint: '日づけを たしかめよう。' };
    if (variant === 1) return { question: `日記「${text}」何を した？`, answer: item.event, options: g2Choices(item.event, refinedDiaries.map((row) => row.event), index), hint: 'できごとを 書いた 文を 見よう。' };
    if (variant === 2) return { question: `日記「${text}」できごとを くわしくした 文は？`, answer: item.detail, options: g2Choices(item.detail, refinedDiaries.map((row) => row.detail), index), hint: '見たことや したことを くわしく 書く。' };
    if (variant === 3) return { question: `日記「${text}」思ったことは？`, answer: item.feeling, options: g2Choices(item.feeling, refinedDiaries.map((row) => row.feeling), index), hint: '気もちや 考えを 書いた 文。' };
    return { question: `日記「${text}」に 合う だいは？`, answer: item.title, options: g2Choices(item.title, refinedDiaries.map((row) => row.title), index), hint: '心に のこった できごとが わかる だいを えらぼう。' };
  }
  if (unitId === 'KOKUGO_G2_U05') {
    const item = refinedExplanations[index];
    if (variant === 0) return { question: `せつ明「${item.text}」何の せつ明？`, answer: item.topic, options: g2Choices(item.topic, refinedExplanations.map((row) => row.topic), index), hint: '文しょう 全体で せつ明していること。' };
    if (variant === 1) return { question: `せつ明「${item.text}」はじめに することは？`, answer: item.first, options: g2Choices(item.first, refinedExplanations.map((row) => row.first), index), hint: '手じゅんの はじめを 見よう。' };
    if (variant === 2) return { question: `せつ明「${item.text}」つぎに することは？`, answer: item.next, options: g2Choices(item.next, refinedExplanations.map((row) => row.next), index), hint: '手じゅんを じゅんに たどろう。' };
    if (variant === 3) return { question: `せつ明「${item.text}」さいごに することは？`, answer: item.last, options: g2Choices(item.last, refinedExplanations.map((row) => row.last), index), hint: 'せつ明の おわりを 見よう。' };
    return { question: `せつ明「${item.text}」この 手じゅんの もくてきは？`, answer: item.reason, options: g2Choices(item.reason, refinedExplanations.map((row) => row.reason), index), hint: '何の ための 手じゅんかを 考えよう。' };
  }
  if (unitId === 'KOKUGO_G2_U06') {
    const item = refinedStories[index];
    if (variant === 0) return { question: `物語「${item.text}」中心の 人物は？`, answer: item.who, options: g2Choices(item.who, refinedStories.map((row) => row.who), index), hint: 'だれの できごとかを 見よう。' };
    if (variant === 1) return { question: `物語「${item.text}」できごとの 場所は？`, answer: item.place, options: g2Choices(item.place, refinedStories.map((row) => row.place), index), hint: 'どこで おきたかを 見よう。' };
    if (variant === 2) return { question: `物語「${item.text}」中心の 人物が したことは？`, answer: item.action, options: g2Choices(item.action, refinedStories.map((row) => row.action), index), hint: '人物の 行動を たしかめよう。' };
    if (variant === 3) return { question: `物語「${item.text}」その 行動を した わけは？`, answer: item.reason, options: g2Choices(item.reason, refinedStories.map((row) => row.reason), index), hint: '前の できごとと 行動を つなげよう。' };
    return { question: `物語「${item.text}」人物の 気もちは？`, answer: item.feeling, options: g2Choices(item.feeling, refinedStories.map((row) => row.feeling), index), hint: '行動や できごとから 気もちを 考えよう。' };
  }
  if (unitId === 'KOKUGO_G2_U07') {
    const item = refinedExplanations[index];
    if (variant === 0) return { question: `「${item.text}」いちばん 大事な ことは？`, answer: item.topic, options: g2Choices(item.topic, refinedExplanations.map((row) => row.topic), index), hint: '何を せつ明しているかを まとめよう。' };
    if (variant === 1) return { question: `「${item.text}」大事な はじめの 手じゅんは？`, answer: item.first, options: g2Choices(item.first, refinedExplanations.map((row) => row.first), index), hint: 'はじめに 必要な 行動を えらぼう。' };
    if (variant === 2) return { question: `「${item.text}」大事な さいごの 手じゅんは？`, answer: item.last, options: g2Choices(item.last, refinedExplanations.map((row) => row.last), index), hint: 'しあげの 行動を えらぼう。' };
    if (variant === 3) return { question: `「${item.text}」この 文しょうの もくてきは？`, answer: item.reason, options: g2Choices(item.reason, refinedExplanations.map((row) => row.reason), index), hint: '何の ために するのかを まとめよう。' };
    return { question: `「${item.text}」を 読んだ 人が できるように なることは？`, answer: item.topic, options: g2Choices(item.topic, refinedExplanations.map((row) => row.topic), index), hint: '文しょうから わかる やり方や きまり。' };
  }
  if (unitId === 'KOKUGO_G2_U08') {
    const item = refinedLetters[index];
    const text = `${item.to} ${item.opening}。${item.message}。${item.detail}。${item.closing}。${item.from}`;
    if (variant === 0) return { question: `手紙「${text}」だれに 書いた？`, answer: item.to, options: g2Choices(item.to, refinedLetters.map((row) => row.to), index), hint: '手紙の はじめの あて名を 見よう。' };
    if (variant === 1) return { question: `手紙「${text}」はじめの あいさつは？`, answer: item.opening, options: g2Choices(item.opening, refinedLetters.map((row) => row.opening), index), hint: 'あて名の つぎの 文を 見よう。' };
    if (variant === 2) return { question: `手紙「${text}」いちばん つたえたいことは？`, answer: item.message, options: g2Choices(item.message, refinedLetters.map((row) => row.message), index), hint: '手紙を 書いた もくてきを 考えよう。' };
    if (variant === 3) return { question: `手紙「${text}」おわりに つたえたことは？`, answer: item.closing, options: g2Choices(item.closing, refinedLetters.map((row) => row.closing), index), hint: '名まえの 前の 文を 見よう。' };
    return { question: `手紙「${text}」だれが 書いた？`, answer: item.from, options: g2Choices(item.from, refinedLetters.map((row) => row.from), index), hint: '手紙の さいごの 名まえを 見よう。' };
  }
  if (unitId === 'KOKUGO_G2_U09') {
    const item = refinedDiaries[index];
    const text = `${item.event}。${item.detail}。${item.feeling}。`;
    if (variant === 0) return { question: `作文「${text}」に 合う だいは？`, answer: item.title, options: g2Choices(item.title, refinedDiaries.map((row) => row.title), index), hint: '中心の できごとが わかる だい。' };
    if (variant === 1) return { question: `作文「${text}」はじめの できごとは？`, answer: item.event, options: g2Choices(item.event, refinedDiaries.map((row) => row.event), index), hint: '作文の はじめを 見よう。' };
    if (variant === 2) return { question: `作文「${text}」中の くわしい せつ明は？`, answer: item.detail, options: g2Choices(item.detail, refinedDiaries.map((row) => row.detail), index), hint: 'できごとの ようすを くわしくした 文。' };
    if (variant === 3) return { question: `作文「${text}」おわりの 気もちは？`, answer: item.feeling, options: g2Choices(item.feeling, refinedDiaries.map((row) => row.feeling), index), hint: '作文の おわりを 見よう。' };
    return { question: `作文「${text}」文の ならび方で よいものは？`, answer: 'できごと・くわしいこと・気もち', options: d('できごと・くわしいこと・気もち', '気もち・だい・あて名', 'おわり・はじめ・中', '名まえ・ねだん・時こく'), hint: 'はじめ、中、おわりの つながりを 見よう。' };
  }
  if (unitId === 'KOKUGO_G2_U10') {
    const item = refinedStories[index];
    if (variant === 0) return { question: `話「${item.text}」だれの 話？`, answer: item.who, options: g2Choices(item.who, refinedStories.map((row) => row.who), index), hint: '話の 中心の 人物を 聞き取ろう。' };
    if (variant === 1) return { question: `話「${item.text}」何を した？`, answer: item.action, options: g2Choices(item.action, refinedStories.map((row) => row.action), index), hint: '人物の 行動を 聞き取ろう。' };
    if (variant === 2) return { question: `話「${item.text}」どうして そうした？`, answer: item.reason, options: g2Choices(item.reason, refinedStories.map((row) => row.reason), index), hint: 'できごとと 行動の わけを つなげよう。' };
    if (variant === 3) return { question: `話「${item.text}」さいごの 気もちは？`, answer: item.feeling, options: g2Choices(item.feeling, refinedStories.map((row) => row.feeling), index), hint: '話の おわりまで 聞いて 考えよう。' };
    return { question: `話「${item.text}」聞いた ことを たしかめる 質問は？`, answer: `「${item.action}」で いいですか`, options: g2Choices(`「${item.action}」で いいですか`, refinedStories.map((row) => `「${row.action}」で いいですか`), index), hint: '大事な 行動を くり返して たしかめよう。' };
  }
  if (unitId === 'KOKUGO_G2_U11') {
    const item = refinedExplanations[index];
    if (variant === 0) return { question: `「${item.text}」順序よく 話すとき、はじめは？`, answer: item.first, options: g2Choices(item.first, refinedExplanations.map((row) => row.first), index), hint: 'はじめの 手じゅんを えらぼう。' };
    if (variant === 1) return { question: `「${item.text}」二ばん目は？`, answer: item.next, options: g2Choices(item.next, refinedExplanations.map((row) => row.next), index), hint: 'はじめの つぎを えらぼう。' };
    if (variant === 2) return { question: `「${item.text}」さいごは？`, answer: item.last, options: g2Choices(item.last, refinedExplanations.map((row) => row.last), index), hint: '手じゅんの おわりを えらぼう。' };
    if (variant === 3) return { question: `「${item.text}」この 話の だいは？`, answer: item.topic, options: g2Choices(item.topic, refinedExplanations.map((row) => row.topic), index), hint: '何の 順序を 話しているかを まとめよう。' };
    return { question: `「${item.text}」順序を つたえるのに 役立つ ことばは？`, answer: 'はじめに・つぎに・さいごに', options: d('はじめに・つぎに・さいごに', 'だれ・どこ・いくら', '赤・青・黄色', '大きい・小さい・長い'), hint: '手じゅんを あらわす ことばを 使おう。' };
  }
  return makeUnitProblem(unitId, n);
};

KOKUGO_G2_UNIT_DATA.KOKUGO_G2_U01 = Array.from({ length: 66 }, (_, n) => makeRefinedG2Problem('KOKUGO_G2_U01', n));
(['KOKUGO_G2_U02', 'KOKUGO_G2_U03', 'KOKUGO_G2_U04', 'KOKUGO_G2_U05', 'KOKUGO_G2_U06', 'KOKUGO_G2_U07', 'KOKUGO_G2_U08', 'KOKUGO_G2_U09', 'KOKUGO_G2_U10', 'KOKUGO_G2_U11'] as const).forEach((unitId) => {
  KOKUGO_G2_UNIT_DATA[unitId] = Array.from({ length: 50 }, (_, n) => makeRefinedG2Problem(unitId, n));
});

export const KOKUGO_G2_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G2_1: Object.values(KOKUGO_G2_UNIT_DATA).flat(),
  ...KOKUGO_G2_UNIT_DATA,
};
