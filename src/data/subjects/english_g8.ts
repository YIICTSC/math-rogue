import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, fillEnglishGeneratedUnitProblems, prompt, uniqueEnglishWordItems } from './english_utils';

const readingPassagesG8: GeneralProblem[] = [
  prompt(
    'つぎの文を読もう。\nYuki was doing her homework when her friend called her. After that, she finished the homework and went to the park.\n最初に 起きたことは？',
    '友だちから電話が来た',
    ['公園へ行った', '宿題を全部終えた', '夕食を作った'],
    '出来事の順序を読む。',
    { audioPrompt: { text: 'Yuki was doing her homework when her friend called her. After that, she finished the homework and went to the park.', lang: 'en-US', autoPlay: true } },
  ),
  prompt(
    'つぎの文を読もう。\nIt will be rainy tomorrow, so our class is going to visit the museum instead of the park.\nクラスは 明日どこへ行く予定ですか？',
    '博物館',
    ['公園', '図書館', '動物園'],
    '未来表現と so に注目。',
    { audioPrompt: { text: 'It will be rainy tomorrow, so our class is going to visit the museum instead of the park.', lang: 'en-US', autoPlay: true } },
  ),
  prompt(
    'つぎの文を読もう。\nThis bag is lighter than mine, but it is more expensive.\n本文の内容として 正しいものは？',
    'そのかばんは私のものより軽い',
    ['そのかばんは私のものより安い', 'そのかばんは私のものより重い', 'そのかばんは無料だ'],
    '比較表現を読む。',
  ),
  prompt(
    'つぎの文を読もう。\nThe room was cleaned by the students after the party. They were tired, but they looked happy.\n生徒たちの様子として 合うのは？',
    'つかれていたがうれしそうだった',
    ['まだパーティー中だった', '先生だけがそうじした', '悲しくて泣いていた'],
    '受動態と気持ちの表現。',
    { audioPrompt: { text: 'The room was cleaned by the students after the party. They were tired, but they looked happy.', lang: 'en-US', autoPlay: false } },
  ),
];
const g8ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  { en: 'I went to the park yesterday.', jp: 'わたしは きのう公園へ行きました。', speech: 'I went to the park yesterday' },
  { en: 'We were eating lunch.', jp: 'わたしたちは 昼食を食べていました。', speech: 'We were eating lunch' },
  { en: 'I will help you.', jp: 'わたしは あなたを助けます。', speech: 'I will help you', speechAlternates: ["I'll help you"] },
  { en: 'You have to wash your hands.', jp: 'あなたは 手を洗わなければなりません。', speech: 'You have to wash your hands' },
  { en: 'I want to be a teacher.', jp: 'わたしは 先生になりたいです。', speech: 'I want to be a teacher' },
  { en: 'Playing soccer is exciting.', jp: 'サッカーをすることは わくわくします。', speech: 'Playing soccer is exciting' },
  { en: 'I was hungry, so I ate lunch.', jp: 'わたしは おなかがすいたので昼食を食べました。', speech: 'I was hungry so I ate lunch' },
  { en: 'Ken is taller than Tom.', jp: 'けんは トムより背が高いです。', speech: 'Ken is taller than Tom' },
  { en: 'The window was broken.', jp: '窓は こわされました。', speech: 'The window was broken' },
  { en: 'The room was cleaned by the students.', jp: 'その部屋は 生徒たちによって そうじされました。', speech: 'The room was cleaned by the students' },
  { en: 'She visited Kyoto last year.', jp: '彼女は 去年京都を訪れました。', speech: 'She visited Kyoto last year' },
  { en: 'They were studying at seven.', jp: '彼らは 7時に勉強していました。', speech: 'They were studying at seven' },
  { en: 'We are going to visit the museum.', jp: 'わたしたちは 博物館を訪れる予定です。', speech: 'We are going to visit the museum' },
  { en: 'You must wear a helmet.', jp: 'あなたは ヘルメットをかぶらなければなりません。', speech: 'You must wear a helmet' },
  { en: 'I went to the library to study.', jp: 'わたしは 勉強するために図書館へ行きました。', speech: 'I went to the library to study' },
  { en: 'Reading books is interesting.', jp: '本を読むことは おもしろいです。', speech: 'Reading books is interesting' },
  { en: 'It was cold, so I wore a coat.', jp: '寒かったので コートを着ました。', speech: 'It was cold so I wore a coat' },
  { en: 'This river is longer than that one.', jp: 'この川は あの川より長いです。', speech: 'This river is longer than that one' },
]);
const g8ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'What did you do yesterday?', promptJp: 'きのう 何を しましたか。', answerEn: 'I went to the park yesterday.', answerJp: 'わたしは きのう公園へ行きました。', answerSpeech: 'I went to the park yesterday' },
  { promptEn: 'What were you doing then?', promptJp: 'そのとき 何を していましたか。', answerEn: 'We were eating lunch.', answerJp: 'わたしたちは 昼食を食べていました。', answerSpeech: 'We were eating lunch' },
  { promptEn: 'What will you do tomorrow?', promptJp: 'あした 何を しますか。', answerEn: 'I will help you.', answerJp: 'わたしは あなたを助けます。', answerSpeech: 'I will help you', answerSpeechAlternates: ["I'll help you"] },
  { promptEn: 'What do you have to do?', promptJp: '何を しなければなりませんか。', answerEn: 'I have to wash my hands.', answerJp: '手を洗わなければなりません。', answerSpeech: 'I have to wash my hands' },
  { promptEn: 'What do you want to be?', promptJp: '何に なりたいですか。', answerEn: 'I want to be a teacher.', answerJp: 'わたしは 先生になりたいです。', answerSpeech: 'I want to be a teacher' },
  { promptEn: 'Which is taller, Ken or Tom?', promptJp: 'けんとトムでは どちらが 背が高いですか。', answerEn: 'Ken is taller than Tom.', answerJp: 'けんは トムより背が高いです。', answerSpeech: 'Ken is taller than Tom' },
  { promptEn: 'Where did she go last year?', promptJp: '彼女は 去年どこへ行きましたか。', answerEn: 'She visited Kyoto last year.', answerJp: '彼女は 去年京都を訪れました。', answerSpeech: 'She visited Kyoto last year' },
  { promptEn: 'What are you going to do?', promptJp: '何をする予定ですか。', answerEn: 'We are going to visit the museum.', answerJp: 'わたしたちは 博物館を訪れる予定です。', answerSpeech: 'We are going to visit the museum' },
  { promptEn: 'Why did you go to the library?', promptJp: 'なぜ図書館へ行きましたか。', answerEn: 'I went to the library to study.', answerJp: '勉強するために図書館へ行きました。', answerSpeech: 'I went to the library to study' },
  { promptEn: 'Why did you wear a coat?', promptJp: 'なぜコートを着ましたか。', answerEn: 'It was cold, so I wore a coat.', answerJp: '寒かったので コートを着ました。', answerSpeech: 'It was cold so I wore a coat' },
];

const makeG8GrammarProblem = (unitId: string, n: number): GeneralProblem | null => {
  switch (unitId) {
    case 'ENGLISH_G8_U01': {
      const verbs = [
        ['go', 'went', 'to the park'], ['play', 'played', 'tennis'], ['watch', 'watched', 'TV'], ['visit', 'visited', 'Kyoto'],
        ['help', 'helped', 'my grandmother'], ['study', 'studied', 'English'], ['eat', 'ate', 'lunch'], ['see', 'saw', 'a movie'],
        ['buy', 'bought', 'a book'], ['make', 'made', 'dinner'], ['take', 'took', 'a picture'], ['write', 'wrote', 'a letter'],
      ] as const;
      const form = n % 3;
      const [base, past, object] = verbs[Math.floor(n / 3) % verbs.length];
      const subject = ['I', 'She', 'He', 'We', 'They'][Math.floor(n / (verbs.length * 3)) % 5];
      if (form === 0) return prompt(`${subject} ___ ${object} yesterday.`, past, [base, `${base}s`, `${base}ing`], 'yesterday に合う過去形。');
      if (form === 1) return prompt(`${subject} did not ___ ${object} yesterday.`, base, [past, `${base}s`, `${base}ing`], 'did not の後は動詞の原形。');
      return prompt(`Did ${subject === 'I' ? 'I' : subject.toLowerCase()} ___ ${object} yesterday?`, base, [past, `${base}s`, `${base}ing`], 'Did の後は動詞の原形。');
    }
    case 'ENGLISH_G8_U02': {
      const subjects = [['I', 'was'], ['He', 'was'], ['She', 'was'], ['We', 'were'], ['They', 'were']] as const;
      const actions = [['study', 'studying', 'English'], ['play', 'playing', 'soccer'], ['read', 'reading', 'a book'], ['eat', 'eating', 'lunch'], ['run', 'running', 'in the park'], ['write', 'writing', 'a letter'], ['cook', 'cooking', 'dinner'], ['watch', 'watching', 'TV']] as const;
      const [subject, be] = subjects[n % subjects.length];
      const [base, ing, object] = actions[Math.floor(n / subjects.length) % actions.length];
      if (n % 2 === 0) return prompt(`${subject} ${be} ___ ${object} then.`, ing, [base, `${base}s`, `to ${base}`], '過去進行形は was/were + -ing。');
      return prompt(`${subject} ___ ${ing} ${object} at seven yesterday.`, be, ['am', 'is', 'are'], '主語に合う was / were。');
    }
    case 'ENGLISH_G8_U03': {
      const actions = [['visit', 'my grandmother'], ['play', 'tennis'], ['read', 'a book'], ['help', 'my friend'], ['study', 'English'], ['clean', 'my room'], ['cook', 'dinner'], ['go', 'to the museum']] as const;
      const subjects = [['I', 'am'], ['You', 'are'], ['He', 'is'], ['She', 'is'], ['We', 'are'], ['They', 'are']] as const;
      const [subject, be] = subjects[n % subjects.length];
      const [verb, object] = actions[Math.floor(n / subjects.length) % actions.length];
      if (n % 3 === 0) return prompt(`${subject} ___ ${verb} ${object} tomorrow.`, 'will', ['did', 'was', 'does'], 'will + 動詞の原形。');
      if (n % 3 === 1) return prompt(`${subject} ${be} going to ___ ${object} tomorrow.`, verb, [`${verb}s`, `${verb}ing`, `${verb}ed`], 'be going to + 動詞の原形。');
      return prompt(`___ ${subject === 'I' ? 'I' : subject.toLowerCase()} going to ${verb} ${object}?`, be[0].toUpperCase() + be.slice(1), [...['Am', 'Is', 'Are'].filter(x => x !== be[0].toUpperCase() + be.slice(1)), 'Do'], 'be going to の疑問文。');
    }
    case 'ENGLISH_G8_U04': {
      const duties = [['do', 'your homework'], ['wash', 'your hands'], ['wear', 'a helmet'], ['follow', 'the rules'], ['study', 'for the test'], ['help', 'your family'], ['be', 'quiet'], ['finish', 'the report'], ['bring', 'your notebook'], ['clean', 'your desk']] as const;
      const [verb, object] = duties[Math.floor(n / 3) % duties.length];
      const form = n % 3;
      if (form === 0) return prompt(`You ___ ${verb} ${object}.`, 'must', ['are', 'do', 'will'], 'must は義務を表す。');
      if (form === 1) return prompt(`You have to ___ ${object}.`, verb, [`${verb}s`, `${verb}ing`, `to ${verb}`], 'have to の後は動詞の原形。');
      return prompt(`___ I ${verb} ${object}?`, 'May', ['Must', 'Have', 'Am'], 'May I ...? は許可を求める表現。');
    }
    case 'ENGLISH_G8_U05': {
      const actions = [['study', 'English'], ['read', 'this book'], ['help', 'people'], ['visit', 'Kyoto'], ['buy', 'milk'], ['finish', 'the report'], ['learn', 'Japanese'], ['see', 'my friend'], ['use', 'a computer'], ['play', 'soccer']] as const;
      const [verb, object] = actions[Math.floor(n / 3) % actions.length];
      const form = n % 3;
      if (form === 0) return prompt(`I want ___ ${object}.`, `to ${verb}`, [verb, `${verb}ing`, `${verb}s`], 'want to + 動詞の原形。');
      if (form === 1) return prompt(`I went there ___ ${object}.`, `to ${verb}`, [verb, `${verb}ing`, `${verb}s`], '目的を表す to + 動詞。');
      return prompt(`It is important ___ ${object}.`, `to ${verb}`, [verb, `${verb}ing`, `${verb}s`], 'It is ... to ～ の形。');
    }
    case 'ENGLISH_G8_U06': {
      const actions = [['listen to', 'listening to', 'music'], ['read', 'reading', 'books'], ['play', 'playing', 'soccer'], ['cook', 'cooking', 'dinner'], ['swim', 'swimming', 'in the pool'], ['talk', 'talking', 'with friends'], ['study', 'studying', 'English'], ['walk', 'walking', 'in the park'], ['take', 'taking', 'pictures'], ['travel', 'traveling', 'abroad']] as const;
      const [base, ing, object] = actions[Math.floor(n / 3) % actions.length];
      const form = n % 3;
      if (form === 0) return prompt(`I enjoy ___ ${object}.`, ing, [base, `to ${base}`, `${base}s`], 'enjoy の後は動名詞。');
      if (form === 1) return prompt(`She likes ___ ${object}.`, ing, [base, `${base}s`, `${base}ed`], '動名詞で「〜すること」。');
      return prompt(`___ ${object} is fun.`, ing[0].toUpperCase() + ing.slice(1), [base[0].toUpperCase() + base.slice(1), `To ${base}`, `${base}s`], '動名詞を主語にできる。');
    }
    case 'ENGLISH_G8_U07': {
      const sentences = [
        ['I was tired, ___ I went to bed early.', 'so'], ['I stayed home ___ it was rainy.', 'because'], ['I like dogs, ___ my sister likes cats.', 'but'], ['I opened the window ___ the room was hot.', 'because'],
        ['It was cold, ___ I wore a coat.', 'so'], ['Ken is young, ___ he is very good at tennis.', 'but'], ['I finished my homework ___ watched TV.', 'and'], ['She studied hard, ___ she passed the test.', 'so'],
        ['We did not go out ___ it was snowing.', 'because'], ['Tom likes math, ___ he does not like science.', 'but'], ['I got up early ___ ate breakfast.', 'and'], ['The bus was late, ___ I walked to school.', 'so'],
      ] as const;
      const [sentence, answer] = sentences[Math.floor(n / 3) % sentences.length];
      const form = n % 3;
      if (form === 0) return prompt(sentence, answer, ['and', 'but', 'because', 'so'].filter(x => x !== answer).slice(0, 3), '前後の意味に合う接続詞を選ぶ。');
      if (form === 1) return prompt(`文を完成させよう。 ${sentence}`, answer, ['and', 'but', 'because', 'so'].filter(x => x !== answer).reverse().slice(0, 3), '理由・結果・対比・並列を見分ける。');
      return prompt(`接続詞として最も自然なのは？ ${sentence}`, answer, ['and', 'but', 'because', 'so'].filter(x => x !== answer).slice(0, 3), '文全体のつながりを考える。');
    }
    case 'ENGLISH_G8_U08': {
      const adjectives = [['tall', 'taller', 'tallest'], ['big', 'bigger', 'biggest'], ['small', 'smaller', 'smallest'], ['fast', 'faster', 'fastest'], ['long', 'longer', 'longest'], ['young', 'younger', 'youngest'], ['easy', 'easier', 'easiest'], ['interesting', 'more interesting', 'most interesting'], ['useful', 'more useful', 'most useful'], ['beautiful', 'more beautiful', 'most beautiful']] as const;
      const [base, comparative, superlative] = adjectives[Math.floor(n / 3) % adjectives.length];
      const form = n % 3;
      const forms = [base, comparative, superlative, `very ${base}`];
      if (form === 0) return prompt(`A is ___ than B. (${base})`, comparative, forms.filter(x => x !== comparative).slice(0, 3), 'than があると比較級。');
      if (form === 1) return prompt(`A is the ___ of the three. (${base})`, superlative, forms.filter(x => x !== superlative).slice(0, 3), 'the と3つ以上の比較は最上級。');
      return prompt(`A is as ___ as B.`, base, forms.filter(x => x !== base).slice(0, 3), 'as ... as の間は原級。');
    }
    case 'ENGLISH_G8_U09': {
      const passives = [['book', 'write', 'written'], ['room', 'clean', 'cleaned'], ['window', 'break', 'broken'], ['cookies', 'make', 'made'], ['song', 'love', 'loved'], ['picture', 'take', 'taken'], ['letter', 'send', 'sent'], ['bridge', 'build', 'built'], ['English', 'speak', 'spoken'], ['car', 'wash', 'washed']] as const;
      const [thing, base, pp] = passives[Math.floor(n / 3) % passives.length];
      const plural = thing === 'cookies';
      const form = n % 3;
      if (form === 0) return prompt(`The ${thing} ___ yesterday.`, `${plural ? 'were' : 'was'} ${pp}`, [base, pp, `${plural ? 'were' : 'was'} ${base}`], 'be動詞 + 過去分詞。');
      if (form === 1) return prompt(`The ${thing} is ___ every day.`, pp, [base, `${base}ing`, `${base}s`], '現在の受動態。');
      return prompt(`The ${thing} was ___ by the students.`, pp, [base, `${base}ing`, `${base}s`], 'by の前は受動態の過去分詞。');
    }
    default:
      return null;
  }
};

export const ENGLISH_G8_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G8_U01: cycleProblems([
    prompt('I ___ to the park yesterday.', 'went', ['go', 'goes', 'going'], '過去形。', { audioPrompt: { text: 'I went to the park yesterday.', lang: 'en-US', autoPlay: true } }),
    prompt('She played tennis. の いみは？', '彼女は テニスをしました。', ['彼女は テニスをします。', '彼女は テニスをしています。', '彼女は テニスができます。'], '過去形の文。'),
    prompt('They ___ TV last night.', 'watched', ['watch', 'watches', 'watching'], 'last night に注目。'),
    prompt('「I visited Kyoto.」を よんでみよう。', 'I visited Kyoto.', ['I visit Kyoto.', 'I am visited Kyoto.', 'I visiting Kyoto.'], '過去の出来事。', { speechPrompt: { expected: 'I visited Kyoto', alternates: ['I visited Kyoto.'], lang: 'en-US', buttonLabel: '過去形を はなす' } }),
    prompt('He ___ his grandmother last Sunday.', 'helped', ['helps', 'help', 'helping'], '過去の文。'),
    prompt('We enjoyed the school festival yesterday. の いみは？', 'わたしたちは きのう学校祭を楽しみました。', ['わたしたちは 毎日学校祭を開きます。', 'わたしたちは 学校祭で勉強しています。', 'わたしたちは 学校祭を計画しています。'], '学校行事の語彙。'),
  ]),
  ENGLISH_G8_U02: cycleProblems([
    prompt('I ___ studying then.', 'was', ['is', 'are', 'were'], '過去進行形。', { audioPrompt: { text: 'I was studying then.', lang: 'en-US', autoPlay: true } }),
    prompt('They were playing soccer. の いみは？', '彼らは サッカーをしていました。', ['彼らは サッカーをします。', '彼らは サッカーをしました。', '彼らは サッカーができます。'], 'were + -ing。'),
    prompt('She ___ reading at seven.', 'was', ['were', 'is', 'be'], 'she に合う形。'),
    prompt('「We were eating lunch.」を いってみよう。', 'We were eating lunch.', ['We are eating lunch.', 'We eating lunch.', 'We were eat lunch.'], '過去進行形を発話。', { speechPrompt: { expected: 'We were eating lunch', alternates: ['We were eating lunch.'], lang: 'en-US', buttonLabel: '過去進行形を はなす' } }),
    prompt('At six yesterday, I ___ my homework.', 'was doing', ['did', 'am doing', 'were doing'], '過去のその時。'),
    prompt('My father was driving then. の いみは？', 'そのとき父は運転していました。', ['そのとき父は運転します。', 'そのとき父は歩いていました。', 'そのとき父は運転したいです。'], '生活語彙。'),
  ]),
  ENGLISH_G8_U03: cycleProblems([
    prompt('I ___ visit my grandmother tomorrow.', 'will', ['am', 'do', 'did'], '未来。', { audioPrompt: { text: 'I will visit my grandmother tomorrow.', lang: 'en-US', autoPlay: true } }),
    prompt('I am going to play tennis. の いみは？', 'わたしは テニスをする予定です。', ['わたしは テニスをしています。', 'わたしは テニスをしました。', 'わたしは テニスができます。'], 'be going to。'),
    prompt('She is going to ___ a book.', 'read', ['reads', 'reading', 'reads to'], '未来表現。'),
    prompt('「I will help you.」を よんでみよう。', 'I will help you.', ['I helping you.', 'I do help you.', 'I will helps you.'], 'will + 動詞。', { speechPrompt: { expected: 'I will help you', alternates: ["I'll help you", 'I will help you.'], lang: 'en-US', buttonLabel: '未来の文を はなす' } }),
    prompt('We are going to ___ soccer tomorrow.', 'play', ['plays', 'playing', 'played'], 'be going to。'),
    prompt('I will visit my cousin next week. の いみは？', 'わたしは 来週いとこをたずねます。', ['わたしは 先週いとこをたずねました。', 'わたしは 毎日いとこを見ます。', 'わたしは いとこになりたいです。'], '家族語彙。'),
  ]),
  ENGLISH_G8_U04: cycleProblems([
    prompt('You ___ do your homework.', 'must', ['can', 'will', 'are'], '義務。'),
    prompt('I have to get up early. の いみは？', 'わたしは 早く起きなければなりません。', ['わたしは 早く起きたいです。', 'わたしは 早く起きています。', 'わたしは 早く起きました。'], 'have to。'),
    prompt('May I use this pen? に 合う こたえは？', 'Yes, you may.', ['Yes, you do.', 'Yes, you are.', 'Yes, you must.'], '許可の表現。'),
    prompt('「I must study tonight.」を いってみよう。', 'I must study tonight.', ['I must studies tonight.', 'I am must study tonight.', 'I study must tonight.'], '助動詞の文。', { speechPrompt: { expected: 'I must study tonight', alternates: ['I must study tonight.'], lang: 'en-US', buttonLabel: '助動詞の文を はなす' } }),
    prompt('You ___ wash your hands before lunch.', 'have to', ['must to', 'can', 'are'], '義務の表現。'),
    prompt('We must protect the environment. の いみは？', 'わたしたちは 環境を守らなければなりません。', ['わたしたちは 環境を作れます。', 'わたしたちは 環境を見に行きます。', 'わたしたちは 環境を失いました。'], '教科書でよく出る語彙。'),
  ]),
  ENGLISH_G8_U05: cycleProblems([
    prompt('I want ___ English.', 'to study', ['study', 'studies', 'studying'], '不定詞。', { audioPrompt: { text: 'I want to study English.', lang: 'en-US', autoPlay: true } }),
    prompt('He went to the store to buy milk. の いみは？', '彼は 牛乳を買うために 店へ行きました。', ['彼は 牛乳を買って 店へ行きました。', '彼は 店で 牛乳を飲みました。', '彼は 店へ行きたいです。'], 'to + 動詞。'),
    prompt('It is easy ___ this book.', 'to read', ['read', 'reading', 'reads'], 'it is ... to。'),
    prompt('「I want to be a teacher.」を いってみよう。', 'I want to be a teacher.', ['I want be a teacher.', 'I wanting to be a teacher.', 'I want to am a teacher.'], '不定詞を発話。', { speechPrompt: { expected: 'I want to be a teacher', alternates: ['I want to be a teacher.'], lang: 'en-US', buttonLabel: '不定詞の文を はなす' } }),
    prompt('She went to the library to ___ books.', 'read', ['reads', 'reading', 'reads to'], '目的を表す不定詞。'),
    prompt('I need some time to finish the report. の いみは？', 'わたしは レポートを終えるための時間が必要です。', ['わたしは レポートを読むのが好きです。', 'わたしは レポートをすでに終えました。', 'わたしは レポートを書きません。'], 'school/work 系語彙。'),
  ]),
  ENGLISH_G8_U06: cycleProblems([
    prompt('I enjoy ___ music.', 'listening to', ['listen', 'to listen', 'listens'], '動名詞。', { audioPrompt: { text: 'I enjoy listening to music.', lang: 'en-US', autoPlay: true } }),
    prompt('Swimming is fun. の いみは？', '泳ぐことは 楽しい。', ['泳いでいます。', '泳げます。', '泳ぎました。'], '動名詞が主語。'),
    prompt('She likes ___ books.', 'reading', ['read', 'to read', 'reads'], 'like + 動名詞。'),
    prompt('「Playing soccer is exciting.」を いってみよう。', 'Playing soccer is exciting.', ['Play soccer is exciting.', 'Playing soccer exciting.', 'Playing soccer are exciting.'], '動名詞を発話。', { speechPrompt: { expected: 'Playing soccer is exciting', alternates: ['Playing soccer is exciting.'], lang: 'en-US', buttonLabel: '動名詞の文を はなす' } }),
    prompt('I like ___ with my friends.', 'talking', ['talk', 'to talk', 'talks'], '動名詞。'),
    prompt('Cooking dinner is fun. の いみは？', '夕食を作ることは楽しい。', ['夕食はもうできています。', '夕食を食べるつもりです。', '夕食を作れません。'], '生活語彙。'),
  ]),
  ENGLISH_G8_U07: cycleProblems([
    prompt('I was tired, ___ I went to bed early.', 'so', ['and', 'but', 'because'], '接続詞。'),
    prompt('Because it was rainy, we stayed home. の いみは？', '雨だったので、わたしたちは 家にいました。', ['雨だったけれど、出かけました。', '雨なので、学校へ行きました。', '雨だったので、走りました。'], 'because。'),
    prompt('I like dogs, ___ my sister likes cats.', 'but', ['so', 'because', 'if'], '対比。'),
    prompt('「I was hungry, so I ate lunch.」を いってみよう。', 'I was hungry, so I ate lunch.', ['I was hungry, but I ate lunch.', 'I hungry so ate lunch.', 'I was hungry, so I eat lunch.'], '接続詞を発話。', { speechPrompt: { expected: 'I was hungry so I ate lunch', alternates: ['I was hungry, so I ate lunch', 'I was hungry so I ate lunch.'], lang: 'en-US', buttonLabel: '接続詞の文を はなす' } }),
    prompt('I stayed home ___ it was snowy.', 'because', ['but', 'so', 'and'], '理由を表す。'),
    prompt('We were tired, but we finished the game. の いみは？', 'わたしたちは つかれていたが 試合を終えた。', ['わたしたちは つかれたので寝た。', 'わたしたちは 試合を始めた。', 'わたしたちは 試合を見ていた。'], '部活動語彙。'),
  ]),
  ENGLISH_G8_U08: cycleProblems([
    prompt('Ken is ___ than Tom.', 'taller', ['tall', 'tallest', 'more tall'], '比較級。', { audioPrompt: { text: 'Ken is taller than Tom.', lang: 'en-US', autoPlay: true } }),
    prompt('This is the most interesting book. の いみは？', 'これは いちばん おもしろい本です。', ['これは おもしろい本です。', 'これは もっとも新しい本です。', 'これは 本よりおもしろいです。'], '最上級。'),
    prompt('Mt. Fuji is the ___ mountain in Japan.', 'highest', ['higher', 'high', 'highly'], '最上級。'),
    prompt('「My bag is bigger than yours.」を いってみよう。', 'My bag is bigger than yours.', ['My bag is biggest than yours.', 'My bag bigger yours.', 'My bag is big than yours.'], '比較級を発話。', { speechPrompt: { expected: 'My bag is bigger than yours', alternates: ['My bag is bigger than yours.'], lang: 'en-US', buttonLabel: '比較文を はなす' } }),
    prompt('This river is the ___ in the city.', 'longest', ['longer', 'long', 'most long'], '最上級。'),
    prompt('This smartphone is more useful than that one. の いみは？', 'このスマートフォンは あれより便利です。', ['このスマートフォンは あれより小さいです。', 'このスマートフォンは あれと同じです。', 'このスマートフォンは 古いです。'], '現代的な語彙。'),
  ]),
  ENGLISH_G8_U09: cycleProblems([
    prompt('This book ___ by my father.', 'was written', ['wrote', 'is writing', 'was write'], '受動態。', { audioPrompt: { text: 'This book was written by my father.', lang: 'en-US', autoPlay: true } }),
    prompt('English is spoken in many countries. の いみは？', '英語は 多くの国で 話されています。', ['英語は 多くの国で 話します。', '英語は 多くの国で 話されました。', '英語は 多くの国で 話せます。'], 'be + 過去分詞。'),
    prompt('The room ___ cleaned every day.', 'is', ['are', 'was', 'be'], '受動態の be動詞。'),
    prompt('「The window was broken.」を いってみよう。', 'The window was broken.', ['The window broke.', 'The window was break.', 'The window is broken yesterday.'], '受動態を発話。', { speechPrompt: { expected: 'The window was broken', alternates: ['The window was broken.'], lang: 'en-US', buttonLabel: '受動態を はなす' } }),
    prompt('These cookies ___ by my sister.', 'were made', ['made', 'was made', 'were make'], '受動態の複数。'),
    prompt('The song was loved by many students. の いみは？', 'その歌は 多くの生徒に愛されていた。', ['その歌は 多くの生徒が作った。', 'その歌は 多くの生徒が歌っただけだ。', 'その歌は 生徒を愛していた。'], '学校・文化語彙。'),
  ]),
  ENGLISH_G8_U10: buildListeningReviewUnit(g8ReviewItems, '中2の 重要表現を きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G8_U11: buildSpeakingReviewUnit(g8ReviewItems, '中2の 重要表現を 英語で いってみよう。'),
  ENGLISH_G8_U12: buildRepeatReviewUnit(g8ReviewItems, '中2の 重要表現を きいて、英語を くりかえそう。'),
  ENGLISH_G8_U13: buildResponseReviewUnit(g8ResponseItems, '中2の 会話に 英語で こたえよう。'),
};

fillEnglishGeneratedUnitProblems(ENGLISH_G8_UNIT_DATA, makeG8GrammarProblem, { min: 36 });

export const ENGLISH_G8_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G8_1: [...Object.values(ENGLISH_G8_UNIT_DATA).flat(), ...readingPassagesG8],
  ...ENGLISH_G8_UNIT_DATA,
};
