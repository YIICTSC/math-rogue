import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, fillEnglishGeneratedUnitProblems, prompt, uniqueEnglishWordItems } from './english_utils';

const readingPassages = [
  {
    text: 'Aya gets up at six every day. She helps her mother make breakfast and then walks to school with her friend.',
    topic: 'あやの朝の生活',
    detail: 'お母さんの手伝い',
    place: '学校へ歩いて行く前',
  },
  {
    text: 'Our school library was renewed last year. Many students now use it after school to read books and study quietly.',
    topic: '学校の図書館',
    detail: '放課後に使う生徒が多い',
    place: '学校',
  },
  {
    text: 'Ken wants to be a doctor because he likes helping people. He studies science hard and reads books about the human body.',
    topic: 'けんの将来の夢',
    detail: '人を助けるのが好き',
    place: '医者になりたい理由',
  },
  {
    text: 'Last Sunday, my family went to the beach. We picked up trash there because we wanted to keep the beach clean.',
    topic: '海での家族の活動',
    detail: 'ごみを拾った',
    place: '海辺',
  },
  {
    text: 'Mika has been practicing the piano for three years. She was nervous at first, but now she enjoys playing in front of many people.',
    topic: 'みかのピアノ練習',
    detail: '人前で弾くのを楽しんでいる',
    place: 'ピアノの経験',
  },
  {
    text: 'In our town, a small festival is held every autumn. People enjoy local food, music, and a parade in the evening.',
    topic: '町の秋祭り',
    detail: '夕方にパレードがある',
    place: '町',
  },
  {
    text: 'Rina wants to improve her English, so she listens to short podcasts every day and writes down new words in a notebook.',
    topic: 'りなの英語学習',
    detail: '新しい単語をノートに書く',
    place: '英語を上達させる方法',
  },
  {
    text: 'A new sports center opened near our station this month. Many people go there to swim, run, or join dance classes.',
    topic: '新しいスポーツセンター',
    detail: '泳いだり走ったりできる',
    place: '駅の近く',
  },
  {
    text: 'Our class started a recycling project in April. We collect used paper every Friday and take it to a recycling center once a month.',
    topic: 'クラスのリサイクル活動',
    detail: '毎週金曜日に古紙を集める',
    place: '学校の活動',
  },
  {
    text: 'Mai joined the basketball team this spring. She practices three times a week and hopes to play in the next school tournament.',
    topic: 'まいのバスケットボール部活動',
    detail: '週に3回練習している',
    place: '学校の部活動',
  },
  {
    text: 'The city museum has a special exhibition about local history. Students can enter for free on Saturdays if they show their student cards.',
    topic: '市立博物館の特別展示',
    detail: '土曜日は学生証を見せると無料',
    place: '市立博物館',
  },
  {
    text: 'Takuya has used the same bicycle for five years. Last weekend, he repaired the brakes with his father instead of buying a new bicycle.',
    topic: 'たくやの自転車修理',
    detail: '父といっしょにブレーキを直した',
    place: '自転車を大切に使う話',
  },
];
const g9ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  { en: 'I have seen that movie.', jp: 'わたしは その映画を見たことがあります。', speech: 'I have seen that movie' },
  { en: 'We have been waiting here.', jp: 'わたしたちは ここでずっと待っています。', speech: 'We have been waiting here' },
  { en: 'This is the cake that my mother made.', jp: 'これは 母が作ったケーキです。', speech: 'This is the cake that my mother made' },
  { en: 'Do you know what this is?', jp: 'これが何か知っていますか。', speech: 'Do you know what this is' },
  { en: 'If I were you, I would study harder.', jp: 'もしわたしがあなたなら もっと勉強するのに。', speech: 'If I were you I would study harder' },
  { en: 'The language spoken here is English.', jp: 'ここで話されている言語は英語です。', speech: 'The language spoken here is English' },
  { en: 'This song is as popular as that one.', jp: 'この歌は あの歌と同じくらい人気です。', speech: 'This song is as popular as that one' },
  { en: 'I think it is important to study English.', jp: '英語を勉強することは大切だと思います。', speech: 'I think it is important to study English' },
  { en: 'Today, I want to talk about my hobby.', jp: '今日は わたしのしゅみについて話したいです。', speech: 'Today I want to talk about my hobby' },
  { en: 'Thank you for listening.', jp: '聞いてくれてありがとうございます。', speech: 'Thank you for listening', speechAlternates: ['Thanks for listening'] },
  { en: 'She has already finished her homework.', jp: '彼女は すでに宿題を終えています。', speech: 'She has already finished her homework' },
  { en: 'He has been practicing soccer since noon.', jp: '彼は 正午からずっとサッカーを練習しています。', speech: 'He has been practicing soccer since noon' },
  { en: 'The student who won the contest is my friend.', jp: '大会で勝った生徒は わたしの友だちです。', speech: 'The student who won the contest is my friend' },
  { en: 'Please tell me where the station is.', jp: '駅がどこにあるか教えてください。', speech: 'Please tell me where the station is' },
  { en: 'If I had more time, I would read more books.', jp: 'もっと時間があれば もっと本を読むのに。', speech: 'If I had more time I would read more books' },
  { en: 'The picture taken in Kyoto was beautiful.', jp: '京都で撮られた写真は美しかったです。', speech: 'The picture taken in Kyoto was beautiful' },
  { en: 'This computer is more useful than that one.', jp: 'このコンピュータは あれより便利です。', speech: 'This computer is more useful than that one' },
  { en: 'First, I will explain my main idea.', jp: 'まず わたしの主な考えを説明します。', speech: 'First I will explain my main idea' },
]);
const g9ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'Have you seen that movie?', promptJp: 'その映画を見たことがありますか。', answerEn: 'Yes, I have.', answerJp: 'はい、あります。', answerSpeech: 'Yes I have', answerSpeechAlternates: ['Yes, I have.'] },
  { promptEn: 'What have you been doing?', promptJp: 'ずっと 何を していましたか。', answerEn: 'We have been waiting here.', answerJp: 'わたしたちは ここでずっと待っています。', answerSpeech: 'We have been waiting here' },
  { promptEn: 'Which cake is it?', promptJp: 'どの ケーキですか。', answerEn: 'This is the cake that my mother made.', answerJp: 'これは 母が作ったケーキです。', answerSpeech: 'This is the cake that my mother made' },
  { promptEn: 'If you were me, what would you do?', promptJp: 'もし わたしだったら、どうしますか。', answerEn: 'I would study harder.', answerJp: 'もっと 勉強します。', answerSpeech: 'I would study harder' },
  { promptEn: 'What language is spoken here?', promptJp: 'ここで 話されている言語は 何ですか。', answerEn: 'English is spoken here.', answerJp: 'ここでは 英語が話されています。', answerSpeech: 'English is spoken here' },
  { promptEn: 'Please start your speech.', promptJp: 'スピーチを はじめてください。', answerEn: 'Today, I want to talk about my hobby.', answerJp: '今日は わたしのしゅみについて話したいです。', answerSpeech: 'Today I want to talk about my hobby' },
  { promptEn: 'Has she finished her homework?', promptJp: '彼女は 宿題を終えましたか。', answerEn: 'She has already finished her homework.', answerJp: '彼女は すでに宿題を終えています。', answerSpeech: 'She has already finished her homework' },
  { promptEn: 'Do you know where the station is?', promptJp: '駅がどこにあるか知っていますか。', answerEn: 'Please tell me where the station is.', answerJp: '駅がどこにあるか教えてください。', answerSpeech: 'Please tell me where the station is' },
  { promptEn: 'What would you do with more time?', promptJp: 'もっと時間があれば 何をしますか。', answerEn: 'I would read more books.', answerJp: 'もっと本を読みます。', answerSpeech: 'I would read more books' },
  { promptEn: 'Which computer is more useful?', promptJp: 'どちらのコンピュータが より便利ですか。', answerEn: 'This computer is more useful than that one.', answerJp: 'このコンピュータは あれより便利です。', answerSpeech: 'This computer is more useful than that one' },
];

const makeG9GrammarProblem = (unitId: string, n: number): GeneralProblem | null => {
  switch (unitId) {
    case 'ENGLISH_G9_U01': {
      const verbs = [
        ['see', 'seen', 'that movie'], ['read', 'read', 'this book'], ['finish', 'finished', 'my homework'], ['visit', 'visited', 'Kyoto'], ['eat', 'eaten', 'lunch'],
        ['write', 'written', 'the report'], ['do', 'done', 'the work'], ['clean', 'cleaned', 'the room'], ['make', 'made', 'dinner'], ['take', 'taken', 'many pictures'], ['buy', 'bought', 'a new bag'], ['be', 'been', 'to Osaka'],
      ] as const;
      const [base, pp, object] = verbs[Math.floor(n / 3) % verbs.length];
      const form = n % 3;
      if (form === 0) return prompt(`I have ___ ${object}.`, pp, [base, `${base}ing`, `${base}s`, `to ${base}`], 'have + 過去分詞。');
      if (form === 1) return prompt(`She has ___ ${object}.`, pp, [base, `${base}ing`, `${base}s`, `to ${base}`], 'has + 過去分詞。');
      return prompt(`Have you ___ ${object}?`, pp, [base, `${base}ing`, `${base}s`, `to ${base}`], 'Have you + 過去分詞。');
    }
    case 'ENGLISH_G9_U02': {
      const actions = [
        ['study', 'studying', 'English'], ['play', 'playing', 'soccer'], ['wait', 'waiting', 'here'], ['read', 'reading', 'this book'], ['practice', 'practicing', 'the piano'],
        ['work', 'working', 'on the project'], ['run', 'running', 'in the park'], ['write', 'writing', 'letters'], ['learn', 'learning', 'Japanese'], ['use', 'using', 'this computer'],
      ] as const;
      const periods = ['for two hours', 'since noon', 'for three days', 'since Monday', 'for a long time'];
      const [base, ing, object] = actions[Math.floor(n / 3) % actions.length];
      const period = periods[Math.floor(n / (actions.length * 3)) % periods.length];
      const form = n % 3;
      if (form === 0) return prompt(`I have been ___ ${object} ${period}.`, ing, [base, `${base}s`, `${base}ed`], 'have been + -ing。');
      if (form === 1) return prompt(`She has been ___ ${object} ${period}.`, ing, [base, `${base}s`, `${base}ed`], 'has been + -ing。');
      return prompt(`Have they been ___ ${object} ${period}?`, ing, [base, `${base}s`, `${base}ed`], '現在完了進行形の疑問文。');
    }
    case 'ENGLISH_G9_U03': {
      const people = [['girl', 'is singing'], ['boy', 'lives in Osaka'], ['student', 'won the contest'], ['teacher', 'teaches English'], ['man', 'helped me'], ['woman', 'works here'], ['player', 'scored the goal'], ['doctor', 'treated me'], ['friend', 'called me'], ['student', 'speaks French']] as const;
      const things = [['book', 'I bought yesterday'], ['cake', 'my mother made'], ['picture', 'I took in Kyoto'], ['movie', 'we saw'], ['bag', 'Tom uses'], ['song', 'everyone likes'], ['computer', 'my father bought'], ['letter', 'she wrote'], ['museum', 'we visited'], ['bike', 'Ken repaired']] as const;
      const form = n % 3;
      if (form === 0) {
        const [noun, clause] = people[Math.floor(n / 3) % people.length];
        return prompt(`The ${noun} ___ ${clause} is my friend.`, 'who', ['which', 'where', 'when'], '人を説明するときは who。');
      }
      const [noun, clause] = things[Math.floor(n / 3) % things.length];
      if (form === 1) return prompt(`This is the ${noun} ___ ${clause}.`, 'that', ['who', 'where', 'when'], '物を説明するときは that / which。');
      return prompt(`The ${noun} ___ ${clause} was interesting.`, 'that', ['who', 'where', 'when'], '先行詞が物の関係代名詞。');
    }
    case 'ENGLISH_G9_U04': {
      const clauses = [
        ['where', 'he is'], ['what', 'she wants'], ['when', 'the train leaves'], ['why', 'the bus is late'], ['how', 'he made it'], ['who', 'that man is'],
        ['where', 'she lives'], ['what', 'this word means'], ['when', 'the store opens'], ['why', 'they are here'], ['how', 'the machine works'], ['who', 'won the game'],
      ] as const;
      const [wh, clause] = clauses[Math.floor(n / 3) % clauses.length];
      const form = n % 3;
      const wrongs = ['where', 'what', 'when', 'why', 'how', 'who'].filter(x => x !== wh).slice((n % 2), (n % 2) + 3);
      if (form === 0) return prompt(`Do you know ___ ${clause}?`, wh, wrongs, '間接疑問文では疑問詞の後は平叙文の語順。');
      if (form === 1) return prompt(`Please tell me ___ ${clause}.`, wh, wrongs, '疑問詞 + 主語 + 動詞の語順。');
      return prompt(`I wonder ___ ${clause}.`, wh, wrongs, 'wonder の後の間接疑問。');
    }
    case 'ENGLISH_G9_U05': {
      const situations = [
        ['rich', 'travel abroad'], ['free', 'join the club'], ['you', 'study harder'], ['a teacher', 'help every student'], ['at home', 'cook dinner'], ['younger', 'play outside more'],
        ['good at English', 'talk with visitors'], ['in Kyoto', 'visit many temples'], ['the captain', 'practice every day'], ['a doctor', 'help sick people'],
      ] as const;
      const [condition, action] = situations[Math.floor(n / 3) % situations.length];
      const form = n % 3;
      if (form === 0) return prompt(`If I ___ ${condition}, I would ${action}.`, 'were', ['am', 'was', 'be'], '仮定法では If I were ... を使う。');
      if (form === 1) return prompt(`If she were ${condition}, she ___ ${action}.`, 'would', ['will', 'did', 'is'], '仮定法の主節は would + 動詞。');
      return prompt(`If he ___ ${condition}, he would ${action}.`, 'were', ['is', 'was', 'be'], '現実と異なる仮定を表す。');
    }
    case 'ENGLISH_G9_U06': {
      const present = [['boy', 'standing', 'by the window'], ['girl', 'running', 'in the park'], ['student', 'reading', 'a book'], ['dog', 'sleeping', 'under the table'], ['man', 'waiting', 'at the station'], ['woman', 'singing', 'on the stage'], ['child', 'playing', 'outside'], ['teacher', 'talking', 'with Ken'], ['cat', 'sitting', 'on the chair'], ['player', 'wearing', 'number ten'], ['student', 'using', 'the computer'], ['bird', 'flying', 'over the park'], ['girl', 'carrying', 'a blue bag'], ['man', 'walking', 'near the station'], ['boy', 'cooking', 'in the kitchen']] as const;
      const past = [['homework', 'give', 'given', 'by the teacher'], ['picture', 'take', 'taken', 'in Kyoto'], ['language', 'speak', 'spoken', 'here'], ['window', 'break', 'broken', 'yesterday'], ['cake', 'make', 'made', 'by my mother'], ['letter', 'write', 'written', 'in English'], ['bridge', 'build', 'built', 'last year'], ['song', 'sing', 'sung', 'by the students'], ['book', 'write', 'written', 'for children'], ['bike', 'repair', 'repaired', 'by Ken'], ['room', 'clean', 'cleaned', 'this morning'], ['meal', 'cook', 'cooked', 'by my father'], ['ball', 'use', 'used', 'in the game'], ['gift', 'send', 'sent', 'from Canada'], ['car', 'make', 'made', 'in Japan']] as const;
      const form = n % 2;
      if (form === 0) {
        const [noun, ing, rest] = present[Math.floor(n / 2) % present.length];
        return prompt(`The ${noun} ___ ${rest} is my friend.`, ing, [ing.replace(/ing$/, ''), `${ing}s`, `${ing}ed`], '現在分詞が名詞を説明する。');
      }
      const [noun, base, pp, rest] = past[Math.floor(n / 2) % past.length];
      return prompt(`The ${noun} ___ ${rest} was important.`, pp, [base, `${base}ing`, `${base}s`], '過去分詞が名詞を説明する。');
    }
    case 'ENGLISH_G9_U07': {
      const adjectives = [['difficult', 'more difficult', 'most difficult'], ['popular', 'more popular', 'most popular'], ['useful', 'more useful', 'most useful'], ['beautiful', 'more beautiful', 'most beautiful'], ['important', 'more important', 'most important'], ['interesting', 'more interesting', 'most interesting'], ['expensive', 'more expensive', 'most expensive'], ['famous', 'more famous', 'most famous']] as const;
      const [base, comparative, superlative] = adjectives[Math.floor(n / 4) % adjectives.length];
      const form = n % 4;
      const forms = [base, comparative, superlative, `very ${base}`];
      if (form === 0) return prompt(`This problem is ___ than that one.`, comparative, forms.filter(x => x !== comparative).slice(0, 3), '長い形容詞の比較級は more。');
      if (form === 1) return prompt(`This is the ___ of the three.`, superlative, forms.filter(x => x !== superlative).slice(0, 3), '最上級は the most ...。');
      if (form === 2) return prompt(`This book is as ___ as that one.`, base, forms.filter(x => x !== base).slice(0, 3), 'as ... as の間は原級。');
      return prompt(`This is one of the ___ books in the library.`, superlative, forms.filter(x => x !== superlative).slice(0, 3), 'one of the + 最上級 + 複数名詞。');
    }
    case 'ENGLISH_G9_U09': {
      const writing = [
        ['わたしは 毎日英語を勉強します。', 'I study English every day.'],
        ['彼は 昨日図書館へ行きました。', 'He went to the library yesterday.'],
        ['わたしには 犬が2ひきいます。', 'I have two dogs.'],
        ['わたしは 人を助けたいです。', 'I want to help people.'],
        ['彼女は 今本を読んでいます。', 'She is reading a book now.'],
        ['わたしたちは 来週京都を訪れる予定です。', 'We are going to visit Kyoto next week.'],
        ['英語を勉強することは大切です。', 'It is important to study English.'],
        ['この本は あの本よりおもしろいです。', 'This book is more interesting than that one.'],
        ['これは 母が作ったケーキです。', 'This is the cake that my mother made.'],
        ['わたしは その映画を見たことがあります。', 'I have seen that movie.'],
        ['雨だったので 家にいました。', 'I stayed home because it was rainy.'],
        ['もし時間があれば もっと本を読むのに。', 'If I had more time, I would read more books.'],
        ['その窓は 昨日こわされました。', 'The window was broken yesterday.'],
        ['わたしは 将来先生になりたいです。', 'I want to be a teacher in the future.'],
      ] as const;
      const [jp, en] = writing[Math.floor(n / 2) % writing.length];
      const others = writing.filter(([, candidate]) => candidate !== en).map(([, candidate]) => candidate);
      if (n % 2 === 0) return prompt(`「${jp}」に 合う英文は？`, en, [others[n % others.length], others[(n + 4) % others.length], others[(n + 8) % others.length]], '文法と語順を確認する。');
      return prompt(`次の英文の内容に 合う日本語は？\n${en}`, jp, writing.filter(([candidateJp]) => candidateJp !== jp).slice((n % 4), (n % 4) + 3).map(([candidateJp]) => candidateJp), '英文全体の意味をとらえる。');
    }
    case 'ENGLISH_G9_U10': {
      const speech = [
        ['Today, I want to talk about my hobby.', '話題を示す導入'],
        ['First, I will explain my main idea.', '最初の要点を示す'],
        ['For example, I practice every day.', '具体例を出す'],
        ['I have two reasons.', '理由の数を示す'],
        ['My first reason is that it is useful.', '1つ目の理由を述べる'],
        ['My second reason is that it is fun.', '2つ目の理由を述べる'],
        ['I learned this from my experience.', '自分の経験につなげる'],
        ['Please look at this picture.', '資料に注目してもらう'],
        ['This is important because it helps everyone.', '理由を添えて主張する'],
        ['In conclusion, I think we should try it.', '結論を述べる'],
        ['That is why I like this activity.', '理由をまとめる'],
        ['I hope you are interested in this topic.', '聞き手へ呼びかける'],
        ['Do you have any questions?', '質問を受け付ける'],
        ['Thank you for listening.', 'スピーチを終える'],
      ] as const;
      const [en, purpose] = speech[Math.floor(n / 2) % speech.length];
      const otherEnglish = speech.filter(([candidate]) => candidate !== en).map(([candidate]) => candidate);
      const otherPurposes = speech.filter(([, candidate]) => candidate !== purpose).map(([, candidate]) => candidate);
      if (n % 2 === 0) return prompt(`「${purpose}」ときに使いやすい表現は？`, en, [otherEnglish[n % otherEnglish.length], otherEnglish[(n + 4) % otherEnglish.length], otherEnglish[(n + 8) % otherEnglish.length]], 'スピーチの役割に合う表現を選ぶ。');
      return prompt(`${en}\nこの表現の役割として近いものは？`, purpose, [otherPurposes[n % otherPurposes.length], otherPurposes[(n + 3) % otherPurposes.length], otherPurposes[(n + 6) % otherPurposes.length]], '導入・理由・例・結論などを見分ける。');
    }
    default:
      return null;
  }
};

export const ENGLISH_G9_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G9_U01: cycleProblems([
    prompt('I have ___ this book before.', 'read', ['reads', 'reading', 'readed'], '現在完了。', { audioPrompt: { text: 'I have read this book before.', lang: 'en-US', autoPlay: true } }),
    prompt('She has lived here for five years. の いみは？', '彼女は 5年間ここに住んでいます。', ['彼女は 5年間ここに住んでいました。', '彼女は ここに5回住みました。', '彼女は ここに住むでしょう。'], '継続。'),
    prompt('Have you finished your homework? の こたえは？', 'Yes, I have.', ['Yes, I do.', 'Yes, I am.', 'Yes, I did.'], '現在完了の応答。'),
    prompt('「I have seen that movie.」を いってみよう。', 'I have seen that movie.', ['I have saw that movie.', 'I seen that movie.', 'I have seeing that movie.'], '現在完了を発話。', { speechPrompt: { expected: 'I have seen that movie', alternates: ['I have seen that movie.'], lang: 'en-US', buttonLabel: '現在完了を はなす' } }),
    prompt('She has just ___ lunch.', 'finished', ['finish', 'finishing', 'finishes'], '完了の表現。'),
    prompt('We have already cleaned the classroom. の いみは？', 'わたしたちは すでに教室をそうじしました。', ['わたしたちは いま教室をそうじしています。', 'わたしたちは これから教室をそうじします。', 'わたしたちは 教室に入りません。'], 'school vocabulary。'),
  ]),
  ENGLISH_G9_U02: cycleProblems([
    prompt('I have been ___ English for two hours.', 'studying', ['study', 'studied', 'to study'], '現在完了進行形。', { audioPrompt: { text: 'I have been studying English for two hours.', lang: 'en-US', autoPlay: true } }),
    prompt('He has been playing soccer since noon. の いみは？', '彼は 正午からずっと サッカーをしています。', ['彼は 正午にサッカーをしました。', '彼は 正午からサッカーができます。', '彼は 正午にサッカーをするでしょう。'], 'ずっと続いている動作。'),
    prompt('She has been ___ letters.', 'writing', ['write', 'wrote', 'written'], 'been + -ing。'),
    prompt('「We have been waiting here.」を いってみよう。', 'We have been waiting here.', ['We have waiting here.', 'We have been wait here.', 'We are been waiting here.'], '現在完了進行形を発話。', { speechPrompt: { expected: 'We have been waiting here', alternates: ['We have been waiting here.'], lang: 'en-US', buttonLabel: '継続の文を はなす' } }),
    prompt('I have been ___ this book since Monday.', 'reading', ['read', 'reads', 'reads to'], 'since とともに使う。'),
    prompt('He has been practicing the violin for years. の いみは？', '彼は 何年もバイオリンを練習しています。', ['彼は きのうバイオリンを始めました。', '彼は バイオリンを買いたいです。', '彼は バイオリンを教えました。'], '芸術語彙。'),
  ]),
  ENGLISH_G9_U03: cycleProblems([
    prompt('This is the book ___ I bought yesterday.', 'that', ['who', 'where', 'when'], '関係代名詞。', { audioPrompt: { text: 'This is the book that I bought yesterday.', lang: 'en-US', autoPlay: true } }),
    prompt('The girl who is singing is my sister. の いみは？', '歌っている女の子は わたしの姉妹です。', ['その女の子は 歌が好きです。', '歌っていた女の子は 先生です。', '歌っている女の子は わたしです。'], 'who の先行詞。'),
    prompt('I know a boy ___ lives in Osaka.', 'who', ['which', 'where', 'when'], '人を説明する。'),
    prompt('「This is the cake that my mother made.」を いってみよう。', 'This is the cake that my mother made.', ['This is the cake who my mother made.', 'This is cake that my mother made.', 'This is the cake that my mother makes.'], '関係代名詞を発話。', { speechPrompt: { expected: 'This is the cake that my mother made', alternates: ['This is the cake that my mother made.'], lang: 'en-US', buttonLabel: '関係代名詞を はなす' } }),
    prompt('The place ___ we visited was very quiet.', 'that', ['who', 'what', 'when'], '物を説明する。'),
    prompt('The student who won the contest is my friend. の いみは？', 'その大会で勝った生徒は わたしの友だちです。', ['その大会に出た生徒は 先生です。', 'その大会は 友だちが開きました。', '生徒は大会を見ていました。'], 'school/event vocabulary。'),
  ]),
  ENGLISH_G9_U04: cycleProblems([
    prompt('Do you know ___ he is? ', 'where', ['what', 'who', 'when'], '間接疑問文。', { audioPrompt: { text: 'Do you know where he is?', lang: 'en-US', autoPlay: true } }),
    prompt('I wonder what she wants. の いみは？', '彼女が 何をほしいのか わたしは知りたい。', ['彼女は 何がほしいですか。', 'わたしは 彼女に何をあげますか。', '彼女は 何を買いましたか。'], '語順に注意。'),
    prompt('Please tell me ___ you are from.', 'where', ['what', 'when', 'how'], '間接疑問。'),
    prompt('「Do you know what this is?」を いってみよう。', 'Do you know what this is?', ['Do you know what is this?', 'Do you know this is what?', 'What do you know this is?'], '疑問詞の語順。', { speechPrompt: { expected: 'Do you know what this is', alternates: ['Do you know what this is?'], lang: 'en-US', buttonLabel: '間接疑問を はなす' } }),
    prompt('Can you tell me ___ she lives?', 'where', ['what', 'which', 'who'], '間接疑問文の語順。'),
    prompt('Do you know why the train is late? の いみは？', 'なぜ電車がおくれているのか知っていますか。', ['電車はどこですか。', '電車は何時に出ますか。', '電車に乗りましたか。'], '交通語彙。'),
  ]),
  ENGLISH_G9_U05: cycleProblems([
    prompt('If I ___ rich, I would travel abroad.', 'were', ['am', 'was', 'be'], '仮定法。', { audioPrompt: { text: 'If I were rich, I would travel abroad.', lang: 'en-US', autoPlay: true } }),
    prompt('If I had more time, I would read more books. の いみは？', 'もっと時間があれば、もっと本を読むのに。', ['もっと時間があるので、本を読みます。', 'もっと本を読んだので、時間があります。', 'もっと時間があれば、本を読みました。'], '事実に反する仮定。'),
    prompt('If she were here, she ___ help us.', 'would', ['will', 'can', 'did'], 'would を使う。'),
    prompt('「If I were you, I would study harder.」を いってみよう。', 'If I were you, I would study harder.', ['If I was you, I study harder.', 'If I were you, I will study harder.', 'If I were you, I would studied harder.'], '仮定法を発話。', { speechPrompt: { expected: 'If I were you I would study harder', alternates: ['If I were you, I would study harder', 'If I were you, I would study harder.'], lang: 'en-US', buttonLabel: '仮定法を はなす' } }),
    prompt('If he were free, he ___ join us.', 'would', ['will', 'did', 'is'], '仮定法。'),
    prompt('If I had enough money, I would buy a new computer. の いみは？', 'もし十分なお金があれば 新しいコンピュータを買うのに。', ['十分なお金があるので買いました。', 'コンピュータを売りたいです。', 'コンピュータを修理しています。'], 'technology vocabulary。'),
  ]),
  ENGLISH_G9_U06: cycleProblems([
    prompt('The boy ___ by the window is my brother.', 'standing', ['stood', 'stands', 'stand'], '分詞の形容詞用法。', { audioPrompt: { text: 'The boy standing by the window is my brother.', lang: 'en-US', autoPlay: true } }),
    prompt('The homework given by the teacher was hard. の いみは？', '先生に出された宿題は むずかしかった。', ['先生が宿題を出しました。', '宿題を先生にあげました。', '先生の宿題は かんたんでした。'], '過去分詞。'),
    prompt('I saw a girl ___ in the park.', 'running', ['run', 'ran', 'runs'], '現在分詞。'),
    prompt('「The language spoken here is English.」を いってみよう。', 'The language spoken here is English.', ['The language speak here is English.', 'The language speaking here is English.', 'The language was spoken here English.'], '分詞を発話。', { speechPrompt: { expected: 'The language spoken here is English', alternates: ['The language spoken here is English.'], lang: 'en-US', buttonLabel: '分詞の文を はなす' } }),
    prompt('The girl ___ in the room is my cousin.', 'singing', ['sings', 'sang', 'sung'], '現在分詞。'),
    prompt('The picture taken in Kyoto was beautiful. の いみは？', '京都で撮られた写真は美しかった。', ['京都で写真を撮ります。', '写真は京都へ行きたいです。', '写真は美しくありません。'], 'travel vocabulary。'),
  ]),
  ENGLISH_G9_U07: cycleProblems([
    prompt('This problem is ___ than that one.', 'more difficult', ['difficulter', 'most difficult', 'difficult'], '比較の応用。', { audioPrompt: { text: 'This problem is more difficult than that one.', lang: 'en-US', autoPlay: true } }),
    prompt('He is one of the most famous players. の いみは？', '彼は もっとも有名な選手の一人です。', ['彼は 一番若い選手です。', '彼は 有名な選手ではありません。', '彼は もっとも速く走ります。'], 'one of the most。'),
    prompt('Your bag is as ___ as mine.', 'heavy', ['heavier', 'heaviest', 'more heavy'], 'as ... as。'),
    prompt('「This song is as popular as that one.」を いってみよう。', 'This song is as popular as that one.', ['This song is popular as that one.', 'This song as popular as that one.', 'This song is more popular as that one.'], '同等比較。', { speechPrompt: { expected: 'This song is as popular as that one', alternates: ['This song is as popular as that one.'], lang: 'en-US', buttonLabel: '比較の文を はなす' } }),
    prompt('This test is the ___ of the three.', 'most difficult', ['difficultest', 'more difficult', 'difficult'], '最上級の応用。'),
    prompt('This website is easier to use than that one. の いみは？', 'このウェブサイトは あれより使いやすい。', ['このウェブサイトは あれより古い。', 'このウェブサイトは あれと同じ大きさだ。', 'このウェブサイトは だれも使わない。'], 'ICT vocabulary。'),
  ]),
  ENGLISH_G9_U08: cycleProblems([
    prompt('長文で まず つかむと よいものは？', '話題', ['発音記号', '単語数', 'ページ番号'], '何についての文か。'),
    prompt('文脈から unknown word の 意味を考える とき 見るものは？', '前後の内容', ['文字の形', '行の長さ', '句読点だけ'], '前後関係。'),
    prompt('長文の 要点をつかむには？', '段落ごとの中心文', ['最後の単語', '最初の一文字', '接続詞だけ'], '読みの基本。'),
    prompt('This passage is about school lunch. を 日本語でいうと？', 'この文は 給食についてです。', ['この文は 学校へ行くことです。', 'この文は 宿題についてです。', 'この文は 部活動についてです。'], 'about の内容。', { audioPrompt: { text: 'This passage is about school lunch.', lang: 'en-US', autoPlay: true } }),
    ...readingPassages.flatMap((passage) => ([
      prompt(`つぎの文を読もう。\n${passage.text}\nこの文の 話題として もっとも近いものは？`, passage.topic, ['学校の時間割', '電車の乗り方', '買い物の値段'], 'まず全体の話題をつかむ。', { audioPrompt: { text: passage.text, lang: 'en-US', autoPlay: true } }),
      prompt(`つぎの文を読もう。\n${passage.text}\n文の内容として 正しいものは？`, passage.detail, ['朝ごはんを作らない', '一人で海へ行った', '冬に花火がある'], '本文の具体的情報。', { audioPrompt: { text: passage.text, lang: 'en-US', autoPlay: false } }),
      prompt(`つぎの文を読もう。\n${passage.text}\n内容が書かれている 場面として 合うものは？`, passage.place, ['病院の待合室', '空港の中', '山のてっぺん'], 'どこやどんな場面かを読む。'),
    ])),
  ]),
  ENGLISH_G9_U09: cycleProblems([
    prompt('「わたしは 英語を勉強することが大切だと思います。」に 合うのは？', 'I think it is important to study English.', ['I important study English.', 'I think study English important.', 'I think it important study English.'], '英作文。', { audioPrompt: { text: 'I think it is important to study English.', lang: 'en-US', autoPlay: true } }),
    prompt('「彼は 昨日図書館へ行きました。」に 合うのは？', 'He went to the library yesterday.', ['He go to the library yesterday.', 'He was go to the library yesterday.', 'He goes to the library yesterday.'], '過去形。'),
    prompt('「私は 犬を2ひき飼っています。」に 合うのは？', 'I have two dogs.', ['I am two dogs.', 'I has two dogs.', 'I have two dog.'], '名詞の複数形。'),
    prompt('「I want to help people.」を いってみよう。', 'I want to help people.', ['I want help people.', 'I want to helps people.', 'I wanting to help people.'], '英作文を音読。', { speechPrompt: { expected: 'I want to help people', alternates: ['I want to help people.'], lang: 'en-US', buttonLabel: '英文を はなす' } }),
    prompt('「私は 毎日英語を練習します。」に 合うのは？', 'I practice English every day.', ['I am practice English every day.', 'I practiced English every day.', 'I practice every day English.'], '語順。'),
    prompt('「私たちは週末にボランティア活動をします。」に 合うのは？', 'We do volunteer work on weekends.', ['We are volunteer on weekends.', 'We did volunteer works every day.', 'We do work volunteer weekend.'], '社会・学校活動の語彙。'),
    prompt('自分の好きな教科について 1文で話してみよう。', 'I like English because it is fun.', ['My favorite subject is English.', 'I enjoy studying English.', 'I like math because it is useful.'], '好きな教科と理由を入れる。', {
      speechPrompt: {
        expected: 'I like English because it is fun',
        alternates: ['My favorite subject is English because it is interesting', 'I enjoy English because it is fun'],
        keywords: ['english', 'because'],
        minKeywordHits: 2,
        lang: 'en-US',
        buttonLabel: '自由に はなす',
        freeResponse: true,
        examples: ['I like English because it is fun.', 'My favorite subject is math because it is useful.'],
      },
    }),
    prompt('将来したいことを 1文で話してみよう。', 'I want to be a teacher in the future.', ['I want to help people in the future.', 'I want to travel abroad someday.', 'I want to be a doctor in the future.'], 'I want to ... を使えるとよい。', {
      speechPrompt: {
        expected: 'I want to be a teacher in the future',
        alternates: ['I want to be a doctor in the future', 'I want to help people in the future'],
        keywords: ['i want to'],
        minKeywordHits: 1,
        lang: 'en-US',
        buttonLabel: '自由に はなす',
        freeResponse: true,
        examples: ['I want to be a doctor in the future.', 'I want to travel abroad in the future.'],
      },
    }),
  ]),
  ENGLISH_G9_U10: cycleProblems([
    prompt('スピーチの はじめに あると よいのは？', 'あいさつと 話題提示', ['結論だけ', '単語の意味', '発音記号'], '導入。'),
    prompt('I want to talk about my dream. の いみは？', 'わたしは 夢について話したいです。', ['わたしは 夢を見ました。', 'わたしは 夢を持っていません。', 'わたしは 夢について書きます。'], 'スピーチ表現。', { audioPrompt: { text: 'I want to talk about my dream.', lang: 'en-US', autoPlay: true } }),
    prompt('スピーチで 大切なのは？', '聞き手に 伝わるように話す', ['速く読む', '下だけ見る', '難しい単語だけ使う'], '発表の基本。'),
    prompt('「Thank you for listening.」を いってみよう。', 'Thank you for listening.', ['Thank you listening.', 'Thanks for listen.', 'Thank you to listening.'], '結びの表現。', { speechPrompt: { expected: 'Thank you for listening', alternates: ['Thank you for listening.', 'Thanks for listening'], lang: 'en-US', buttonLabel: 'スピーチの結びを はなす' } }),
    prompt('スピーチで 理由や例を入れる目的は？', '内容をわかりやすくするため', ['文を長くするため', '難しい単語を増やすため', '読む量を減らすため'], '聞き手に伝える。'),
    prompt('スピーチで 経験を入れるよさは？', '自分の考えが伝わりやすくなる', ['文を短くできる', '発音をなくせる', '質問を減らせる'], '内容の具体化。'),
    prompt('スピーチの書き出しを 自分の話題で言ってみよう。', 'Today, I want to talk about my hobby.', ['Today, I will talk about my dream.', 'I want to introduce my school life today.', 'Let me talk about my town today.'], 'Today, I want to talk about ... を使う。', {
      speechPrompt: {
        expected: 'Today I want to talk about my hobby',
        alternates: ['Today, I want to talk about my dream', 'Today, I want to talk about my school life'],
        keywords: ['today', 'talk about'],
        minKeywordHits: 2,
        lang: 'en-US',
        buttonLabel: '導入を はなす',
        freeResponse: true,
        examples: ['Today, I want to talk about my dream.', 'Today, I want to talk about my town.'],
      },
    }),
    prompt('スピーチの結びを 自分の表現で言ってみよう。', 'Thank you for listening.', ['Thanks for listening.', 'Thank you very much for listening.', 'That is all.'], '終わりのあいさつ。', {
      speechPrompt: {
        expected: 'Thank you for listening',
        alternates: ['Thank you for listening.', 'Thanks for listening', 'Thank you very much for listening'],
        keywords: ['thank', 'listening'],
        minKeywordHits: 2,
        lang: 'en-US',
        buttonLabel: '結びを はなす',
        freeResponse: true,
        examples: ['Thank you for listening.', 'Thanks for listening.'],
      },
    }),
  ]),
  ENGLISH_G9_U11: buildListeningReviewUnit(g9ReviewItems, '中3の 重要表現を きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G9_U12: buildSpeakingReviewUnit(g9ReviewItems, '中3の 重要表現を 英語で いってみよう。'),
  ENGLISH_G9_U13: buildRepeatReviewUnit(g9ReviewItems, '中3の 重要表現を きいて、英語を くりかえそう。'),
  ENGLISH_G9_U14: buildResponseReviewUnit(g9ResponseItems, '中3の 会話に 英語で こたえよう。'),
};

fillEnglishGeneratedUnitProblems(ENGLISH_G9_UNIT_DATA, makeG9GrammarProblem, { min: 36 });

export const ENGLISH_G9_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G9_1: Object.values(ENGLISH_G9_UNIT_DATA).flat(),
  ...ENGLISH_G9_UNIT_DATA,
};
