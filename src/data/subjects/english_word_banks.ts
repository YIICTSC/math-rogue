import { GeneralProblem } from './utils';
import {
  buildRepeatReviewUnit,
  buildWordUnit,
  cycleProblems,
  EnglishWordItem,
  uniqueEnglishWordItems,
} from './english_utils';

const word = (
  en: string,
  jp: string,
  scene: string,
  exampleEn?: string,
  exampleJp?: string,
  choiceGroup?: string,
  allowAutoExample = true,
): EnglishWordItem => ({
  en,
  jp,
  hint: scene,
  exampleEn,
  exampleJp,
  choiceGroup,
  allowAutoExample,
});

const words = (scene: string, entries: Array<[string, string]>): EnglishWordItem[] =>
  entries.map(([en, jp]) => word(en, jp, scene));

const IRREGULAR_PLURALS: Record<string, string> = {
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  foot: 'feet',
  tooth: 'teeth',
  mouse: 'mice',
  goose: 'geese',
  life: 'lives',
};

const pluralize = (en: string) => {
  if (IRREGULAR_PLURALS[en]) return IRREGULAR_PLURALS[en];
  if (/(s|x|z|ch|sh)$/.test(en)) return `${en}es`;
  if (/[^aeiou]y$/.test(en)) return `${en.slice(0, -1)}ies`;
  if (en.endsWith('f')) return `${en.slice(0, -1)}ves`;
  if (en.endsWith('fe')) return `${en.slice(0, -2)}ves`;
  return `${en}s`;
};

const IRREGULAR_PAST_TENSES: Record<string, string> = {
  be: 'was',
  become: 'became',
  begin: 'began',
  bring: 'brought',
  build: 'built',
  buy: 'bought',
  catch: 'caught',
  choose: 'chose',
  come: 'came',
  cut: 'cut',
  do: 'did',
  drink: 'drank',
  eat: 'ate',
  fall: 'fell',
  feel: 'felt',
  find: 'found',
  fly: 'flew',
  forget: 'forgot',
  get: 'got',
  give: 'gave',
  go: 'went',
  grow: 'grew',
  have: 'had',
  hear: 'heard',
  hold: 'held',
  know: 'knew',
  leave: 'left',
  lend: 'lent',
  lose: 'lost',
  make: 'made',
  mean: 'meant',
  meet: 'met',
  put: 'put',
  read: 'read',
  receive: 'received',
  run: 'ran',
  say: 'said',
  see: 'saw',
  sell: 'sold',
  send: 'sent',
  sit: 'sat',
  speak: 'spoke',
  spend: 'spent',
  swim: 'swam',
  take: 'took',
  teach: 'taught',
  tell: 'told',
  think: 'thought',
  throw: 'threw',
  understand: 'understood',
  wear: 'wore',
  win: 'won',
  write: 'wrote',
};

const IRREGULAR_ING_FORMS: Record<string, string> = {
  be: 'being',
  begin: 'beginning',
  control: 'controlling',
  cut: 'cutting',
  get: 'getting',
  plan: 'planning',
  put: 'putting',
  run: 'running',
  sit: 'sitting',
  swim: 'swimming',
};

const DOUBLE_FINAL_PAST_TENSES: Record<string, string> = {
  control: 'controlled',
  plan: 'planned',
};

const applyToVerbHead = (en: string, transform: (head: string) => string) => {
  const [head, ...rest] = en.split(' ');
  return [transform(head), ...rest].join(' ');
};

const pastTense = (en: string) => {
  return applyToVerbHead(en, (head) => {
    if (IRREGULAR_PAST_TENSES[head]) return IRREGULAR_PAST_TENSES[head];
    if (DOUBLE_FINAL_PAST_TENSES[head]) return DOUBLE_FINAL_PAST_TENSES[head];
    if (head.endsWith('e')) return `${head}d`;
    if (/[^aeiou]y$/.test(head)) return `${head.slice(0, -1)}ied`;
    return `${head}ed`;
  });
};

const ingForm = (en: string) => {
  return applyToVerbHead(en, (head) => {
    if (IRREGULAR_ING_FORMS[head]) return IRREGULAR_ING_FORMS[head];
    if (head.endsWith('ie')) return `${head.slice(0, -2)}ying`;
    if (head.endsWith('e') && !head.endsWith('ee')) return `${head.slice(0, -1)}ing`;
    return `${head}ing`;
  });
};

const IRREGULAR_COMPARATIVES: Record<string, string> = {
  good: 'better',
  well: 'better',
  bad: 'worse',
  little: 'less',
  many: 'more',
  much: 'more',
};

const IRREGULAR_SUPERLATIVES: Record<string, string> = {
  good: 'best',
  well: 'best',
  bad: 'worst',
  little: 'least',
  many: 'most',
  much: 'most',
};

const comparative = (en: string) => {
  if (IRREGULAR_COMPARATIVES[en]) return IRREGULAR_COMPARATIVES[en];
  if (en.endsWith('y')) return `${en.slice(0, -1)}ier`;
  if (en.endsWith('e')) return `${en}r`;
  if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(en) && !/[wxy]$/.test(en)) return `${en}${en.slice(-1)}er`;
  if (en.length <= 5) return `${en}er`;
  return `more ${en}`;
};

const superlative = (en: string) => {
  if (IRREGULAR_SUPERLATIVES[en]) return IRREGULAR_SUPERLATIVES[en];
  if (en.endsWith('y')) return `${en.slice(0, -1)}iest`;
  if (en.endsWith('e')) return `${en}st`;
  if (/^[a-z]*[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(en) && !/[wxy]$/.test(en)) return `${en}${en.slice(-1)}est`;
  if (en.length <= 5) return `${en}est`;
  return `the most ${en}`;
};

const JP_VERB_FORMS: Record<string, { past: string; ing: string }> = {
  '持っている': { past: '持っていた', ing: '持っている' },
  '知っている': { past: '知っていた', ing: '知っている' },
  '大好きである': { past: '大好きだった', ing: '大好きである' },
  '来る': { past: '来た', ing: '来ている' },
  '行く': { past: '行った', ing: '行っている' },
  '買う': { past: '買った', ing: '買っている' },
  '会う': { past: '会った', ing: '会っている' },
  '思う': { past: '思った', ing: '思っている' },
  '取る': { past: '取った', ing: '取っている' },
  '去る': { past: '去った', ing: '去っている' },
  '選ぶ': { past: '選んだ', ing: '選んでいる' },
  '貸す': { past: '貸した', ing: '貸している' },
  '失う': { past: '失った', ing: '失っている' },
  '身につける': { past: '身につけた', ing: '身につけている' },
  '勝つ': { past: '勝った', ing: '勝っている' },
  '捕まえる': { past: '捕まえた', ing: '捕まえている' },
  '閉める': { past: '閉めた', ing: '閉めている' },
  '切る': { past: '切った', ing: '切っている' },
  '飲む': { past: '飲んだ', ing: '飲んでいる' },
  '食べる': { past: '食べた', ing: '食べている' },
  '見つける': { past: '見つけた', ing: '見つけている' },
  '飛ぶ': { past: '飛んだ', ing: '飛んでいる' },
  '与える': { past: '与えた', ing: '与えている' },
  '持つ': { past: '持った', ing: '持っている' },
  '聞こえる': { past: '聞こえた', ing: '聞こえている' },
  '置く': { past: '置いた', ing: '置いている' },
  '見る': { past: '見た', ing: '見ている' },
  '売る': { past: '売った', ing: '売っている' },
  '投げる': { past: '投げた', ing: '投げている' },
  '欲しい': { past: '欲しかった', ing: '欲しがっている' },
  '始まる': { past: '始まった', ing: '始まっている' },
  '建てる': { past: '建てた', ing: '建てている' },
  '育つ': { past: '育った', ing: '育っている' },
  '出発する': { past: '出発した', ing: '出発している' },
  '読む': { past: '読んだ', ing: '読んでいる' },
  '借りる': { past: '借りた', ing: '借りている' },
  '教える': { past: '教えた', ing: '教えている' },
};

const japaneseVerbForms = (jp: string) => {
  if (JP_VERB_FORMS[jp]) return JP_VERB_FORMS[jp];
  if (jp.endsWith('する')) return { past: `${jp.slice(0, -2)}した`, ing: `${jp.slice(0, -2)}している` };
  if (jp.endsWith('である')) return { past: `${jp.slice(0, -3)}だった`, ing: jp };
  if (/(える|ける|げる|せる|てる|ねる|べる|める|れる)$/.test(jp)) return { past: `${jp.slice(0, -1)}た`, ing: `${jp.slice(0, -1)}ている` };
  if (jp.endsWith('く')) return { past: `${jp.slice(0, -1)}いた`, ing: `${jp.slice(0, -1)}いている` };
  if (jp.endsWith('ぐ')) return { past: `${jp.slice(0, -1)}いだ`, ing: `${jp.slice(0, -1)}いでいる` };
  if (jp.endsWith('す')) return { past: `${jp.slice(0, -1)}した`, ing: `${jp.slice(0, -1)}している` };
  if (/[むぶぬ]$/.test(jp)) return { past: `${jp.slice(0, -1)}んだ`, ing: `${jp.slice(0, -1)}んでいる` };
  if (/[うつる]$/.test(jp)) return { past: `${jp.slice(0, -1)}った`, ing: `${jp.slice(0, -1)}っている` };
  return { past: `${jp}（過去）`, ing: `${jp}（進行中）` };
};

const nounForms = (scene: string, entries: Array<[string, string]>): EnglishWordItem[] =>
  entries.flatMap(([en, jp]) => [
    word(en, jp, scene, undefined, undefined, `${scene}:noun:singular`),
    word(pluralize(en), `複数の${jp}`, scene, undefined, undefined, `${scene}:noun:plural`, false),
  ]);

const verbForms = (scene: string, entries: Array<[string, string]>): EnglishWordItem[] =>
  entries.flatMap(([en, jp]) => {
    const jpForms = japaneseVerbForms(jp);
    return [
      word(en, jp, scene, undefined, undefined, `${scene}:verb:base`, false),
      word(pastTense(en), jpForms.past, scene, undefined, undefined, `${scene}:verb:past`, false),
      word(ingForm(en), jpForms.ing, scene, undefined, undefined, `${scene}:verb:ing`, false),
    ];
  });

const adjectiveForms = (scene: string, entries: Array<[string, string]>): EnglishWordItem[] =>
  entries.flatMap(([en, jp]) => [
    word(en, jp, scene, undefined, undefined, `${scene}:adjective:base`),
    word(comparative(en), `より${jp}`, scene, undefined, undefined, `${scene}:adjective:comparative`, false),
    word(superlative(en), `最も${jp}`, scene, undefined, undefined, `${scene}:adjective:superlative`, false),
  ]);

const numberWords = (start: number, end: number, scene: string): EnglishWordItem[] => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens: Record<number, string> = {
    10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen',
    15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen',
  };
  const tens: Record<number, string> = {
    20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
    60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety',
  };
  const spell = (n: number) => {
    if (n === 100) return 'one hundred';
    if (n > 100 && n < 1000) {
      const h = Math.floor(n / 100);
      const r = n % 100;
      return r === 0 ? `${ones[h]} hundred` : `${ones[h]} hundred ${spell(r)}`;
    }
    if (n < 10) return ones[n];
    if (n < 20) return teens[n];
    const t = Math.floor(n / 10) * 10;
    const o = n % 10;
    return o === 0 ? tens[t] : `${tens[t]}-${ones[o]}`;
  };
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const n = start + i;
    return word(spell(n), `${n}`, scene);
  });
};

const buildVocabularyUnit = (items: EnglishWordItem[], label: string): GeneralProblem[] => {
  const words = uniqueEnglishWordItems(items).filter((item) => item.en && item.jp);
  return cycleProblems([
    ...buildWordUnit(words, {
      listeningPrompt: `${label}を聞いて、英語または意味を選ぼう。`,
      speakingPrompt: `${label}を英語で発話しよう。`,
      enableListening: true,
      enableSpeaking: true,
      enableSentenceExamples: true,
    }),
    ...buildRepeatReviewUnit(words, `${label}を聞き取り、英語でくりかえそう。`),
  ]);
};

const G3_WORDS: EnglishWordItem[] = [
  word('hello', 'こんにちは', '小3 あいさつ', 'Hello, Ken.', 'こんにちは、ケン。'),
  word('goodbye', 'さようなら', '小3 あいさつ', 'Goodbye, everyone.', 'みなさん、さようなら。'),
  word('thank you', 'ありがとう', '小3 あいさつ', 'Thank you very much.', 'どうもありがとう。'),
  word('yes', 'はい', '小3 返事', 'Yes, I do.', 'はい、そうです。'),
  word('no', 'いいえ', '小3 返事', 'No, I do not.', 'いいえ、ちがいます。'),
  word('red', '赤', '小3 色', 'I like red.', '私は赤が好きです。'),
  word('blue', '青', '小3 色', 'The sky is blue.', '空は青いです。'),
  word('yellow', '黄色', '小3 色', 'This flower is yellow.', 'この花は黄色です。'),
  word('green', '緑', '小3 色', 'The leaf is green.', '葉は緑です。'),
  word('black', '黒', '小3 色', 'The cat is black.', 'そのネコは黒いです。'),
  word('white', '白', '小3 色', 'I have a white bag.', '私は白いかばんを持っています。'),
  word('one', '1', '小3 数', 'I have one pencil.', '私はえんぴつを1本持っています。'),
  word('two', '2', '小3 数', 'I have two books.', '私は本を2冊持っています。'),
  word('three', '3', '小3 数', 'There are three cats.', 'ネコが3匹います。'),
  word('four', '4', '小3 数', 'Four birds are flying.', '4羽の鳥が飛んでいます。'),
  word('five', '5', '小3 数', 'I am five years old.', '私は5才です。'),
  word('six', '6', '小3 数', 'Six students are here.', '6人の児童がここにいます。'),
  word('seven', '7', '小3 数', 'Seven apples are on the table.', '7個のリンゴがテーブルにあります。'),
  word('eight', '8', '小3 数', 'I can count to eight.', '私は8まで数えられます。'),
  word('nine', '9', '小3 数', 'Nine balls are in the box.', '9個のボールが箱にあります。'),
  word('ten', '10', '小3 数', 'Ten minutes, please.', '10分ください。'),
  word('dog', '犬', '小3 動物', 'The dog is cute.', 'その犬はかわいいです。'),
  word('cat', 'ネコ', '小3 動物', 'The cat is small.', 'そのネコは小さいです。'),
  word('rabbit', 'ウサギ', '小3 動物', 'A rabbit can jump.', 'ウサギは跳ぶことができます。'),
  word('bird', '鳥', '小3 動物', 'The bird can sing.', 'その鳥は歌えます。'),
  word('fish', '魚', '小3 動物', 'I see a fish.', '魚が見えます。'),
  word('apple', 'リンゴ', '小3 食べ物', 'I like apples.', '私はリンゴが好きです。'),
  word('banana', 'バナナ', '小3 食べ物', 'This banana is yellow.', 'このバナナは黄色です。'),
  word('milk', '牛乳', '小3 食べ物', 'I drink milk.', '私は牛乳を飲みます。'),
  word('bread', 'パン', '小3 食べ物', 'I eat bread.', '私はパンを食べます。'),
  word('happy', 'うれしい', '小3 気持ち', 'I am happy.', '私はうれしいです。'),
  word('sad', '悲しい', '小3 気持ち', 'She is sad.', '彼女は悲しいです。'),
  word('hungry', 'おなかがすいた', '小3 気持ち', 'I am hungry.', '私はおなかがすいています。'),
  word('sleepy', 'ねむい', '小3 気持ち', 'He is sleepy.', '彼はねむいです。'),
  word('head', '頭', '小3 体', 'Touch your head.', '頭をさわって。'),
  word('eye', '目', '小3 体', 'Close your eyes.', '目を閉じて。'),
  word('hand', '手', '小3 体', 'Raise your hand.', '手をあげて。'),
  word('foot', '足先', '小3 体', 'My foot hurts.', '足先が痛いです。'),
];

const G4_WORDS: EnglishWordItem[] = [
  word('morning', '朝', '小4 生活', 'I study in the morning.', '私は朝に勉強します。'),
  word('afternoon', '午後', '小4 生活', 'We play in the afternoon.', '私たちは午後に遊びます。'),
  word('evening', '夕方', '小4 生活', 'I read in the evening.', '私は夕方に読みます。'),
  word('breakfast', '朝食', '小4 生活', 'I eat breakfast at seven.', '私は7時に朝食を食べます。'),
  word('lunch', '昼食', '小4 生活', 'Lunch is ready.', '昼食の準備ができました。'),
  word('dinner', '夕食', '小4 生活', 'We have dinner together.', '私たちは一緒に夕食を食べます。'),
  word('sunny', '晴れ', '小4 天気', 'It is sunny today.', '今日は晴れです。'),
  word('cloudy', 'くもり', '小4 天気', 'It is cloudy now.', '今はくもりです。'),
  word('rainy', '雨の', '小4 天気', 'It is rainy in June.', '6月は雨が多いです。'),
  word('snowy', '雪の', '小4 天気', 'It is snowy in winter.', '冬は雪です。'),
  word('hot', '暑い', '小4 天気', 'It is hot today.', '今日は暑いです。'),
  word('cold', '寒い', '小4 天気', 'It is cold outside.', '外は寒いです。'),
  word('math', '算数', '小4 教科', 'I like math.', '私は算数が好きです。'),
  word('science', '理科', '小4 教科', 'Science is fun.', '理科は楽しいです。'),
  word('music', '音楽', '小4 教科', 'Music is my favorite subject.', '音楽は私の好きな教科です。'),
  word('art', '図工', '小4 教科', 'I have art today.', '今日は図工があります。'),
  word('pencil', 'えんぴつ', '小4 文ぼう具', 'This is my pencil.', 'これは私のえんぴつです。'),
  word('eraser', '消しゴム', '小4 文ぼう具', 'I need an eraser.', '消しゴムが必要です。'),
  word('ruler', 'ものさし', '小4 文ぼう具', 'Use a ruler.', 'ものさしを使って。'),
  word('notebook', 'ノート', '小4 文ぼう具', 'Open your notebook.', 'ノートを開いて。'),
  word('classroom', '教室', '小4 学校', 'This is our classroom.', 'ここは私たちの教室です。'),
  word('library', '図書室', '小4 学校', 'The library is quiet.', '図書室は静かです。'),
  word('gym', '体育館', '小4 学校', 'We play in the gym.', '私たちは体育館で遊びます。'),
  word('park', '公園', '小4 場所', 'I go to the park.', '私は公園へ行きます。'),
  word('station', '駅', '小4 場所', 'The station is near.', '駅は近いです。'),
  word('hospital', '病院', '小4 場所', 'The hospital is big.', '病院は大きいです。'),
  word('rice', 'ごはん', '小4 食べ物', 'I eat rice every day.', '私は毎日ごはんを食べます。'),
  word('soup', 'スープ', '小4 食べ物', 'This soup is hot.', 'このスープは熱いです。'),
  word('salad', 'サラダ', '小4 食べ物', 'I like salad.', '私はサラダが好きです。'),
  word('tea', 'お茶', '小4 食べ物', 'Would you like tea?', 'お茶はいかがですか。'),
  word('festival', '祭り', '小4 文化', 'The festival is in summer.', 'その祭りは夏にあります。'),
  word('kimono', '着物', '小4 文化', 'This is a kimono.', 'これは着物です。'),
  word('temple', '寺', '小4 文化', 'We visit a temple.', '私たちは寺を訪れます。'),
  word('shrine', '神社', '小4 文化', 'The shrine is old.', 'その神社は古いです。'),
];

const G5_WORDS: EnglishWordItem[] = [
  word('January', '1月', '小5 月', 'My birthday is in January.', '私の誕生日は1月です。'),
  word('February', '2月', '小5 月', 'February is cold.', '2月は寒いです。'),
  word('March', '3月', '小5 月', 'School ends in March.', '学校は3月に終わります。'),
  word('April', '4月', '小5 月', 'School starts in April.', '学校は4月に始まります。'),
  word('May', '5月', '小5 月', 'May is warm.', '5月は暖かいです。'),
  word('June', '6月', '小5 月', 'It rains in June.', '6月は雨が降ります。'),
  word('July', '7月', '小5 月', 'July is hot.', '7月は暑いです。'),
  word('August', '8月', '小5 月', 'August is summer.', '8月は夏です。'),
  word('September', '9月', '小5 月', 'September is busy.', '9月は忙しいです。'),
  word('October', '10月', '小5 月', 'Halloween is in October.', 'ハロウィンは10月です。'),
  word('November', '11月', '小5 月', 'November is cool.', '11月は涼しいです。'),
  word('December', '12月', '小5 月', 'December is the last month.', '12月は最後の月です。'),
  word('Monday', '月曜日', '小5 曜日', 'I study English on Monday.', '私は月曜日に英語を勉強します。'),
  word('Tuesday', '火曜日', '小5 曜日', 'We have music on Tuesday.', '火曜日に音楽があります。'),
  word('Wednesday', '水曜日', '小5 曜日', 'I play soccer on Wednesday.', '私は水曜日にサッカーをします。'),
  word('Thursday', '木曜日', '小5 曜日', 'Thursday is busy.', '木曜日は忙しいです。'),
  word('Friday', '金曜日', '小5 曜日', 'Today is Friday.', '今日は金曜日です。'),
  word('Saturday', '土曜日', '小5 曜日', 'I go shopping on Saturday.', '私は土曜日に買い物へ行きます。'),
  word('Sunday', '日曜日', '小5 曜日', 'Sunday is my day off.', '日曜日は休みの日です。'),
  word('birthday', '誕生日', '小5 行事', 'When is your birthday?', 'あなたの誕生日はいつですか。'),
  word('soccer', 'サッカー', '小5 スポーツ', 'I can play soccer.', '私はサッカーができます。'),
  word('baseball', '野球', '小5 スポーツ', 'He likes baseball.', '彼は野球が好きです。'),
  word('basketball', 'バスケットボール', '小5 スポーツ', 'She can play basketball.', '彼女はバスケットボールができます。'),
  word('swim', '泳ぐ', '小5 can', 'I can swim.', '私は泳げます。'),
  word('run', '走る', '小5 can', 'I can run fast.', '私は速く走れます。'),
  word('jump', '跳ぶ', '小5 can', 'Can you jump high?', '高く跳べますか。'),
  word('cook', '料理する', '小5 can', 'I can cook curry.', '私はカレーを作れます。'),
  word('sing', '歌う', '小5 can', 'She can sing well.', '彼女は上手に歌えます。'),
  word('dance', 'おどる', '小5 can', 'We can dance.', '私たちはおどれます。'),
  word('read', '読む', '小5 動作', 'I read books.', '私は本を読みます。'),
  word('write', '書く', '小5 動作', 'Write your name.', '名前を書いて。'),
  word('speak', '話す', '小5 動作', 'I speak English.', '私は英語を話します。'),
  word('country', '国', '小5 場所', 'Japan is my country.', '日本は私の国です。'),
  word('Australia', 'オーストラリア', '小5 国名', 'I want to go to Australia.', '私はオーストラリアへ行きたいです。'),
  word('Canada', 'カナダ', '小5 国名', 'Canada is large.', 'カナダは広いです。'),
  word('France', 'フランス', '小5 国名', 'France is famous for art.', 'フランスは芸術で有名です。'),
  word('Brazil', 'ブラジル', '小5 国名', 'Brazil has a big festival.', 'ブラジルには大きな祭りがあります。'),
];

const G6_WORDS: EnglishWordItem[] = [
  word('teacher', '先生', '小6 職業', 'I want to be a teacher.', '私は先生になりたいです。'),
  word('doctor', '医者', '小6 職業', 'My aunt is a doctor.', '私のおばは医者です。'),
  word('nurse', '看護師', '小6 職業', 'A nurse helps patients.', '看護師は患者を助けます。'),
  word('chef', '料理人', '小6 職業', 'The chef makes dinner.', 'その料理人は夕食を作ります。'),
  word('engineer', '技術者', '小6 職業', 'My brother is an engineer.', '私の兄は技術者です。'),
  word('artist', '芸術家', '小6 職業', 'She wants to be an artist.', '彼女は芸術家になりたいです。'),
  word('pilot', 'パイロット', '小6 職業', 'A pilot flies a plane.', 'パイロットは飛行機を操縦します。'),
  word('police officer', '警察官', '小6 職業', 'A police officer works for safety.', '警察官は安全のために働きます。'),
  word('dream', '夢', '小6 将来', 'My dream is big.', '私の夢は大きいです。'),
  word('future', '未来', '小6 将来', 'Think about your future.', '自分の未来について考えよう。'),
  word('plan', '計画', '小6 将来', 'I have a plan.', '私は計画があります。'),
  word('practice', '練習する', '小6 学校生活', 'I practice the piano.', '私はピアノを練習します。'),
  word('study', '勉強する', '小6 学校生活', 'We study English.', '私たちは英語を勉強します。'),
  word('homework', '宿題', '小6 学校生活', 'I do my homework.', '私は宿題をします。'),
  word('club', 'クラブ', '小6 学校生活', 'I am in the science club.', '私は理科クラブに入っています。'),
  word('memory', '思い出', '小6 思い出', 'This is a good memory.', 'これはよい思い出です。'),
  word('trip', '旅行', '小6 思い出', 'We enjoyed the school trip.', '私たちは修学旅行を楽しみました。'),
  word('museum', '博物館', '小6 場所', 'We visited a museum.', '私たちは博物館を訪れました。'),
  word('aquarium', '水族館', '小6 場所', 'The aquarium has many fish.', '水族館にはたくさんの魚がいます。'),
  word('stadium', '競技場', '小6 場所', 'The stadium is full.', '競技場は満員です。'),
  word('world', '世界', '小6 国際', 'I want to see the world.', '私は世界を見たいです。'),
  word('language', '言語', '小6 国際', 'English is a language.', '英語は言語です。'),
  word('culture', '文化', '小6 国際', 'We learn about culture.', '私たちは文化について学びます。'),
  word('history', '歴史', '小6 国際', 'History is interesting.', '歴史はおもしろいです。'),
  word('traditional', '伝統的な', '小6 文化', 'This is a traditional dance.', 'これは伝統的なおどりです。'),
  word('famous', '有名な', '小6 文化', 'Kyoto is famous.', '京都は有名です。'),
  word('beautiful', '美しい', '小6 形容詞', 'The lake is beautiful.', 'その湖は美しいです。'),
  word('difficult', '難しい', '小6 形容詞', 'This question is difficult.', 'この問題は難しいです。'),
  word('important', '大切な', '小6 形容詞', 'Friends are important.', '友だちは大切です。'),
  word('interesting', 'おもしろい', '小6 形容詞', 'This book is interesting.', 'この本はおもしろいです。'),
  word('yesterday', '昨日', '小6 過去', 'I played soccer yesterday.', '私は昨日サッカーをしました。'),
  word('tomorrow', '明日', '小6 未来', 'I will study tomorrow.', '私は明日勉強します。'),
  word('enjoy', '楽しむ', '小6 動詞', 'Enjoy your lunch.', '昼食を楽しんで。'),
  word('visit', '訪れる', '小6 動詞', 'We visit Nara.', '私たちは奈良を訪れます。'),
  word('learn', '学ぶ', '小6 動詞', 'I learn English.', '私は英語を学びます。'),
  word('help', '助ける', '小6 動詞', 'I help my mother.', '私は母を手伝います。'),
];

const G7_WORDS: EnglishWordItem[] = [
  word('student', '生徒', '中1 人', 'I am a junior high school student.', '私は中学生です。'),
  word('classmate', '同級生', '中1 人', 'My classmate plays tennis.', '私の同級生はテニスをします。'),
  word('friend', '友人', '中1 人', 'My friend lives near here.', '私の友人はこの近くに住んでいます。'),
  word('family', '家族', '中1 人', 'My family likes music.', '私の家族は音楽が好きです。'),
  word('favorite', 'お気に入りの', '中1 形容詞', 'What is your favorite sport?', 'あなたのお気に入りのスポーツは何ですか。'),
  word('usually', 'たいてい', '中1 頻度', 'I usually walk to school.', '私はたいてい歩いて学校へ行きます。'),
  word('always', 'いつも', '中1 頻度', 'She always studies hard.', '彼女はいつも一生懸命勉強します。'),
  word('sometimes', '時々', '中1 頻度', 'He sometimes plays games.', '彼は時々ゲームをします。'),
  word('never', '決してない', '中1 頻度', 'I never eat breakfast late.', '私は朝食を遅く食べることは決してありません。'),
  word('watch', '見る', '中1 一般動詞', 'I watch TV after dinner.', '私は夕食後にテレビを見ます。'),
  word('listen', '聞く', '中1 一般動詞', 'Listen to the teacher.', '先生の話を聞きなさい。'),
  word('open', '開ける', '中1 命令文', 'Open the window.', '窓を開けなさい。'),
  word('close', '閉める', '中1 命令文', 'Close the door.', 'ドアを閉めなさい。'),
  word('stand', '立つ', '中1 命令文', 'Stand up, please.', '立ってください。'),
  word('sit', '座る', '中1 命令文', 'Sit down, please.', '座ってください。'),
  word('under', '下に', '中1 前置詞', 'The ball is under the desk.', 'ボールは机の下にあります。'),
  word('behind', '後ろに', '中1 前置詞', 'The dog is behind the tree.', '犬は木の後ろにいます。'),
  word('between', '間に', '中1 前置詞', 'The library is between the bank and the station.', '図書館は銀行と駅の間にあります。'),
  word('near', '近くに', '中1 前置詞', 'My house is near the park.', '私の家は公園の近くにあります。'),
  word('because', 'なぜなら', '中1 接続詞', 'I like winter because I can ski.', 'スキーができるので冬が好きです。'),
  word('when', 'いつ', '中1 疑問詞', 'When do you study?', 'あなたはいつ勉強しますか。'),
  word('where', 'どこで', '中1 疑問詞', 'Where do you live?', 'あなたはどこに住んでいますか。'),
  word('which', 'どちら', '中1 疑問詞', 'Which do you like?', 'あなたはどちらが好きですか。'),
  word('whose', 'だれの', '中1 疑問詞', 'Whose bag is this?', 'これはだれのかばんですか。'),
  word('mine', '私のもの', '中1 代名詞', 'This book is mine.', 'この本は私のものです。'),
  word('yours', 'あなたのもの', '中1 代名詞', 'Is this pen yours?', 'このペンはあなたのものですか。'),
  word('hers', '彼女のもの', '中1 代名詞', 'The red bag is hers.', '赤いかばんは彼女のものです。'),
  word('theirs', '彼らのもの', '中1 代名詞', 'The bikes are theirs.', 'その自転車は彼らのものです。'),
  word('early', '早く', '中1 副詞', 'I get up early.', '私は早く起きます。'),
  word('late', '遅く', '中1 副詞', 'He comes home late.', '彼は遅く帰宅します。'),
  word('quietly', '静かに', '中1 副詞', 'Please speak quietly.', '静かに話してください。'),
  word('quickly', 'すばやく', '中1 副詞', 'She runs quickly.', '彼女はすばやく走ります。'),
];

const G8_WORDS: EnglishWordItem[] = [
  word('ago', '前に', '中2 過去', 'I met him two years ago.', '私は2年前に彼に会いました。'),
  word('last', 'この前の', '中2 過去', 'I went there last Sunday.', '私はこの前の日曜日にそこへ行きました。'),
  word('during', '間に', '中2 前置詞', 'I read a book during lunch.', '私は昼食の間に本を読みました。'),
  word('while', 'する間に', '中2 接続詞', 'I listened to music while I studied.', '勉強している間、音楽を聞きました。'),
  word('future', '将来', '中2 未来', 'I will think about my future.', '私は将来について考えます。'),
  word('promise', '約束する', '中2 未来', 'I promise to call you.', '私はあなたに電話すると約束します。'),
  word('decide', '決める', '中2 不定詞', 'I decided to join the club.', '私はそのクラブに入ることを決めました。'),
  word('hope', '望む', '中2 不定詞', 'I hope to see you soon.', 'すぐに会えることを望んでいます。'),
  word('need', '必要とする', '中2 不定詞', 'We need to practice.', '私たちは練習する必要があります。'),
  word('finish', '終える', '中2 動名詞', 'I finished reading the book.', '私はその本を読み終えました。'),
  word('enjoy', '楽しむ', '中2 動名詞', 'She enjoys playing tennis.', '彼女はテニスをすることを楽しみます。'),
  word('mind', '嫌がる', '中2 動名詞', 'Do you mind opening the window?', '窓を開けてもらってもよいですか。'),
  word('if', 'もし', '中2 接続詞', 'If it rains, I will stay home.', 'もし雨が降ったら家にいます。'),
  word('although', 'けれども', '中2 接続詞', 'Although it was cold, we played outside.', '寒かったけれども、外で遊びました。'),
  word('than', 'よりも', '中2 比較', 'This book is easier than that one.', 'この本はあの本より簡単です。'),
  word('most', '最も', '中2 比較', 'This is the most important point.', 'これが最も大切な点です。'),
  word('better', 'よりよい', '中2 比較', 'This plan is better.', 'この計画のほうがよいです。'),
  word('best', '最もよい', '中2 比較', 'She is my best friend.', '彼女は私の親友です。'),
  word('made', '作られた', '中2 受動態', 'This desk is made of wood.', 'この机は木で作られています。'),
  word('built', '建てられた', '中2 受動態', 'The castle was built long ago.', 'その城は昔建てられました。'),
  word('known', '知られている', '中2 受動態', 'He is known to many people.', '彼は多くの人に知られています。'),
  word('spoken', '話されている', '中2 受動態', 'English is spoken in many countries.', '英語は多くの国で話されています。'),
  word('environment', '環境', '中2 社会', 'We should protect the environment.', '私たちは環境を守るべきです。'),
  word('recycle', 'リサイクルする', '中2 社会', 'We recycle paper.', '私たちは紙をリサイクルします。'),
  word('volunteer', 'ボランティア', '中2 社会', 'I joined a volunteer group.', '私はボランティア団体に参加しました。'),
  word('experience', '経験', '中2 表現', 'This was a good experience.', 'これはよい経験でした。'),
  word('opinion', '意見', '中2 表現', 'Please tell me your opinion.', 'あなたの意見を教えてください。'),
  word('reason', '理由', '中2 表現', 'What is the reason?', '理由は何ですか。'),
  word('example', '例', '中2 表現', 'Give me an example.', '例を一つください。'),
  word('message', '伝言', '中2 表現', 'I got your message.', 'あなたの伝言を受け取りました。'),
  word('information', '情報', '中2 表現', 'This information is useful.', 'この情報は役に立ちます。'),
  word('communication', '意思疎通', '中2 表現', 'Communication is important.', '意思疎通は大切です。'),
];

const G9_WORDS: EnglishWordItem[] = [
  word('already', 'すでに', '中3 現在完了', 'I have already finished lunch.', '私はすでに昼食を終えました。'),
  word('yet', 'まだ', '中3 現在完了', 'I have not finished it yet.', '私はまだそれを終えていません。'),
  word('ever', '今までに', '中3 現在完了', 'Have you ever been to Kyoto?', '今までに京都へ行ったことがありますか。'),
  word('since', '以来', '中3 現在完了', 'I have lived here since 2020.', '私は2020年以来ここに住んでいます。'),
  word('for', 'の間', '中3 現在完了', 'I have studied for two hours.', '私は2時間勉強しています。'),
  word('who', 'する人', '中3 関係代名詞', 'I know a girl who plays the guitar.', '私はギターを弾く女の子を知っています。'),
  word('which', 'するもの', '中3 関係代名詞', 'This is a book which I bought yesterday.', 'これは私が昨日買った本です。'),
  word('that', 'する人・もの', '中3 関係代名詞', 'The song that I like is popular.', '私が好きな歌は人気です。'),
  word('what', 'こと', '中3 間接疑問', 'I know what you mean.', 'あなたの言いたいことがわかります。'),
  word('whether', 'かどうか', '中3 間接疑問', 'I wonder whether he will come.', '彼が来るかどうかと思います。'),
  word('wish', '願う', '中3 仮定法', 'I wish I could fly.', '飛べたらいいのにと思います。'),
  word('imagine', '想像する', '中3 仮定法', 'Imagine a world without war.', '戦争のない世界を想像してください。'),
  word('global', '世界的な', '中3 長文', 'Global issues are complex.', '世界的な問題は複雑です。'),
  word('local', '地域の', '中3 長文', 'Local people joined the event.', '地域の人々が行事に参加しました。'),
  word('technology', '技術', '中3 長文', 'Technology changes our lives.', '技術は私たちの生活を変えます。'),
  word('society', '社会', '中3 長文', 'Society needs new ideas.', '社会には新しい考えが必要です。'),
  word('education', '教育', '中3 長文', 'Education opens doors.', '教育は可能性を開きます。'),
  word('population', '人口', '中3 長文', 'The population is increasing.', '人口は増えています。'),
  word('resource', '資源', '中3 長文', 'Water is an important resource.', '水は大切な資源です。'),
  word('climate', '気候', '中3 長文', 'The climate is changing.', '気候は変化しています。'),
  word('solution', '解決策', '中3 英作文', 'We need a better solution.', '私たちはよりよい解決策が必要です。'),
  word('advantage', '利点', '中3 英作文', 'This plan has an advantage.', 'この計画には利点があります。'),
  word('disadvantage', '欠点', '中3 英作文', 'Every idea has a disadvantage.', 'どの考えにも欠点があります。'),
  word('opportunity', '機会', '中3 英作文', 'This is a good opportunity.', 'これはよい機会です。'),
  word('challenge', '課題', '中3 英作文', 'This challenge is difficult.', 'この課題は難しいです。'),
  word('communicate', '伝え合う', '中3 スピーチ', 'We communicate in many ways.', '私たちは多くの方法で伝え合います。'),
  word('explain', '説明する', '中3 スピーチ', 'Please explain your idea.', 'あなたの考えを説明してください。'),
  word('introduce', '紹介する', '中3 スピーチ', 'I will introduce my town.', '私は自分の町を紹介します。'),
  word('compare', '比較する', '中3 スピーチ', 'Compare these two pictures.', 'この2枚の写真を比較してください。'),
  word('suggest', '提案する', '中3 スピーチ', 'I suggest a new rule.', '私は新しいルールを提案します。'),
  word('improve', '改善する', '中3 スピーチ', 'We can improve our school.', '私たちは学校を改善できます。'),
  word('respect', '尊重する', '中3 スピーチ', 'We should respect each other.', '私たちは互いを尊重すべきです。'),
];

const G3_REQUIRED_SUPPLEMENT = [
  ...words('小3 必修相当 あいさつ・教室', [
    ['good morning', 'おはよう'], ['good afternoon', 'こんにちは'], ['good night', 'おやすみ'],
    ['please', 'どうぞ'], ['sorry', 'ごめんなさい'], ['okay', 'だいじょうぶ'], ['nice', 'すてきな'],
    ['name', '名前'], ['teacher', '先生'], ['student', '児童'], ['school', '学校'], ['class', '授業'],
  ]),
  ...words('小3 必修相当 色・形・身近な物', [
    ['pink', 'ピンク'], ['orange', 'オレンジ色'], ['brown', '茶色'], ['purple', '紫'],
    ['circle', '円'], ['triangle', '三角形'], ['square', '正方形'], ['star', '星'],
    ['book', '本'], ['bag', 'かばん'], ['desk', '机'], ['chair', 'いす'], ['box', '箱'],
  ]),
  ...words('小3 必修相当 動物・食べ物・体', [
    ['lion', 'ライオン'], ['tiger', 'トラ'], ['elephant', 'ゾウ'], ['monkey', 'サル'],
    ['horse', '馬'], ['cow', '牛'], ['pig', 'ブタ'], ['chicken', 'ニワトリ'],
    ['mandarin orange', 'ミカン'], ['grape', 'ブドウ'], ['peach', 'モモ'], ['water', '水'],
    ['mouth', '口'], ['nose', '鼻'], ['ear', '耳'], ['leg', '脚'], ['arm', '腕'],
  ]),
  ...words('小3 必修相当 数・動作', [
    ['eleven', '11'], ['twelve', '12'], ['thirteen', '13'], ['fourteen', '14'], ['fifteen', '15'],
    ['sixteen', '16'], ['seventeen', '17'], ['eighteen', '18'], ['nineteen', '19'], ['twenty', '20'],
    ['walk', '歩く'], ['stop', '止まる'], ['look', '見る'], ['touch', 'さわる'], ['clap', '手をたたく'],
  ]),
];

const G4_REQUIRED_SUPPLEMENT = [
  ...words('小4 必修相当 生活・時刻', [
    ['today', '今日'], ['tomorrow', '明日'], ['yesterday', '昨日'], ['time', '時刻'],
    ['hour', '時間'], ['minute', '分'], ["o'clock", 'ちょうどの時刻'], ['wake up', '起きる'],
    ['go home', '家に帰る'], ['take a bath', '風呂に入る'], ['sleep', '眠る'],
  ]),
  ...words('小4 必修相当 教科・学校', [
    ['English', '英語'], ['Japanese', '国語'], ['social studies', '社会'], ['P.E.', '体育'],
    ['home economics', '家庭科'], ['calligraphy', '書写'], ['computer', 'コンピューター'],
    ['playground', '校庭'], ['schoolyard', '運動場'], ['music room', '音楽室'], ['science room', '理科室'],
  ]),
  ...words('小4 必修相当 場所・町', [
    ['store', '店'], ['restaurant', 'レストラン'], ['post office', '郵便局'], ['bank', '銀行'],
    ['police box', '交番'], ['bus stop', 'バス停'], ['zoo', '動物園'], ['pool', 'プール'],
  ]),
  ...words('小4 必修相当 食べ物・文化', [
    ['curry', 'カレー'], ['noodle', 'めん'], ['egg', '卵'], ['meat', '肉'], ['grilled fish', '焼き魚'],
    ['vegetable', '野菜'], ['cake', 'ケーキ'], ['ice cream', 'アイスクリーム'], ['juice', 'ジュース'],
    ['chopsticks', 'はし'], ['drum', '太鼓'], ['fireworks', '花火'], ['tea ceremony', '茶道'],
  ]),
];

const G5_REQUIRED_SUPPLEMENT = [
  ...words('小5 必修相当 家族・人物', [
    ['father', '父'], ['mother', '母'], ['brother', '兄弟'], ['sister', '姉妹'],
    ['grandfather', '祖父'], ['grandmother', '祖母'], ['uncle', 'おじ'], ['aunt', 'おば'],
    ['cousin', 'いとこ'], ['neighbor', '近所の人'],
  ]),
  ...words('小5 必修相当 学校生活・持ち物', [
    ['subject', '教科'], ['test', 'テスト'], ['question', '質問'], ['answer', '答え'],
    ['lesson', '授業'], ['schedule', '予定'], ['calendar', 'カレンダー'], ['marker', 'マーカー'],
    ['scissors', 'はさみ'], ['glue', 'のり'], ['dictionary', '辞書'], ['map', '地図'],
  ]),
  ...words('小5 必修相当 動作・能力', [
    ['ride', '乗る'], ['skate', 'スケートをする'], ['ski', 'スキーをする'], ['draw', '描く'],
    ['paint', '絵の具で描く'], ['make', '作る'], ['use', '使う'], ['clean', '掃除する'],
    ['wash', '洗う'], ['carry', '運ぶ'], ['try', '試す'], ['practice', '練習する'],
  ]),
  ...words('小5 必修相当 国・地域', [
    ['America', 'アメリカ'], ['China', '中国'], ['Korea', '韓国'], ['India', 'インド'],
    ['Italy', 'イタリア'], ['Spain', 'スペイン'], ['Germany', 'ドイツ'], ['the United Kingdom', 'イギリス'],
  ]),
];

const G6_REQUIRED_SUPPLEMENT = [
  ...words('小6 必修相当 職業・将来', [
    ['dentist', '歯医者'], ['farmer', '農家'], ['firefighter', '消防士'], ['florist', '花屋'],
    ['singer', '歌手'], ['writer', '作家'], ['carpenter', '大工'], ['scientist', '科学者'],
    ['athlete', '運動選手'], ['astronaut', '宇宙飛行士'], ['designer', 'デザイナー'], ['programmer', 'プログラマー'],
  ]),
  ...words('小6 必修相当 行事・思い出', [
    ['ceremony', '式'], ['graduation', '卒業'], ['entrance ceremony', '入学式'], ['sports day', '運動会'],
    ['school festival', '文化祭'], ['concert', '演奏会'], ['contest', 'コンテスト'], ['speech', 'スピーチ'],
    ['photo', '写真'], ['album', 'アルバム'], ['team', 'チーム'], ['winner', '勝者'],
  ]),
  ...words('小6 必修相当 世界・文化', [
    ['foreign', '外国の'], ['international', '国際的な'], ['traditional food', '伝統料理'], ['heritage', '遺産'],
    ['capital', '首都'], ['island', '島'], ['mountain', '山'], ['river', '川'],
    ['lake', '湖'], ['ocean', '海洋'], ['season', '季節'], ['holiday', '休日'],
  ]),
  ...words('小6 必修相当 形容詞・動詞', [
    ['popular', '人気のある'], ['useful', '役に立つ'], ['kind', '親切な'], ['friendly', '友好的な'],
    ['exciting', 'わくわくする'], ['wonderful', 'すばらしい'], ['remember', '覚えている'], ['forget', '忘れる'],
    ['invite', '招待する'], ['join', '参加する'], ['send', '送る'], ['receive', '受け取る'],
  ]),
];

const G7_REQUIRED_SUPPLEMENT = [
  ...words('中1 必修相当 基本名詞', [
    ['thing', 'もの'], ['place', '場所'], ['people', '人々'], ['city', '市'], ['town', '町'],
    ['village', '村'], ['street', '通り'], ['room', '部屋'], ['window', '窓'], ['door', 'ドア'],
    ['picture', '絵'], ['letter', '手紙'], ['email', 'メール'], ['phone', '電話'], ['movie', '映画'],
    ['song', '歌'], ['sport', 'スポーツ'], ['game', '試合'], ['season', '季節'], ['weekend', '週末'],
  ]),
  ...words('中1 必修相当 基本動詞', [
    ['have', '持っている'], ['want', '欲しい'], ['like', '好む'], ['love', '大好きである'],
    ['know', '知っている'], ['think', '思う'], ['come', '来る'], ['go', '行く'], ['take', '取る'],
    ['give', '与える'], ['buy', '買う'], ['meet', '会う'], ['live', '住む'], ['work', '働く'],
    ['start', '始める'], ['end', '終わる'], ['ask', '尋ねる'], ['tell', '伝える'], ['call', '呼ぶ'],
  ]),
  ...words('中1 必修相当 形容詞・副詞', [
    ['big', '大きい'], ['small', '小さい'], ['long', '長い'], ['short', '短い'],
    ['new', '新しい'], ['old', '古い'], ['young', '若い'], ['high', '高い'], ['low', '低い'],
    ['fast', '速い'], ['slow', '遅い'], ['easy', '簡単な'], ['hard', '難しい'], ['busy', '忙しい'],
    ['free', 'ひまな'], ['again', '再び'], ['together', '一緒に'], ['here', 'ここに'], ['there', 'そこに'],
  ]),
  ...words('中1 必修相当 機能語', [
    ['and', 'そして'], ['or', 'または'], ['but', 'しかし'], ['with', '一緒に'], ['from', 'から'],
    ['about', 'について'], ['before', '前に'], ['after', '後に'], ['in front of', '前に'], ['next to', '隣に'],
  ]),
];

const G8_REQUIRED_SUPPLEMENT = [
  ...words('中2 必修相当 動詞・熟語', [
    ['arrive', '到着する'], ['leave', '去る'], ['bring', '持ってくる'], ['borrow', '借りる'], ['lend', '貸す'],
    ['choose', '選ぶ'], ['collect', '集める'], ['continue', '続ける'], ['follow', '従う'], ['happen', '起こる'],
    ['invite', '招待する'], ['lose', '失う'], ['move', '動く'], ['return', '戻る'], ['save', '救う'],
    ['share', '共有する'], ['spend', '費やす'], ['teach', '教える'], ['wear', '身につける'], ['win', '勝つ'],
  ]),
  ...words('中2 必修相当 社会・自然', [
    ['nature', '自然'], ['energy', 'エネルギー'], ['earth', '地球'], ['plant', '植物'], ['animal', '動物'],
    ['forest', '森林'], ['desert', '砂漠'], ['air', '空気'], ['light', '光'], ['sound', '音'],
    ['peace', '平和'], ['war', '戦争'], ['rule', '規則'], ['law', '法律'], ['service', 'サービス'],
    ['news', 'ニュース'], ['article', '記事'], ['Internet', 'インターネット'], ['website', 'ウェブサイト'], ['robot', 'ロボット'],
  ]),
  ...words('中2 必修相当 表現・程度', [
    ['almost', 'ほとんど'], ['enough', '十分な'], ['perhaps', 'おそらく'], ['probably', 'たぶん'],
    ['especially', '特に'], ['finally', 'ついに'], ['suddenly', '突然'], ['carefully', '注意深く'],
    ['clearly', '明確に'], ['strongly', '強く'], ['weak', '弱い'], ['rich', '豊かな'], ['poor', '貧しい'],
    ['safe', '安全な'], ['dangerous', '危険な'], ['necessary', '必要な'],
  ]),
];

const G9_REQUIRED_SUPPLEMENT = [
  ...words('中3 必修相当 抽象語・論理', [
    ['fact', '事実'], ['truth', '真実'], ['idea', '考え'], ['thought', '考え'], ['view', '見方'],
    ['point', '要点'], ['purpose', '目的'], ['goal', '目標'], ['result', '結果'], ['effect', '影響'],
    ['cause', '原因'], ['case', '場合'], ['problem', '問題'], ['issue', '論点'], ['topic', '話題'],
    ['choice', '選択'], ['change', '変化'], ['difference', '違い'], ['similarity', '類似点'], ['relationship', '関係'],
  ]),
  ...words('中3 必修相当 社会・環境', [
    ['culture shock', 'カルチャーショック'], ['generation', '世代'], ['government', '政府'], ['industry', '産業'],
    ['medicine', '医学'], ['pollution', '汚染'], ['plastic', 'プラスチック'], ['waste', '廃棄物'],
    ['reduction', '削減'], ['disaster', '災害'], ['earthquake', '地震'], ['flood', '洪水'],
    ['refugee', '難民'], ['poverty', '貧困'], ['hunger', '飢餓'], ['healthcare', '医療'],
  ]),
  ...words('中3 必修相当 発信・読解', [
    ['argue', '主張する'], ['agree', '賛成する'], ['disagree', '反対する'], ['describe', '描写する'],
    ['discuss', '議論する'], ['express', '表現する'], ['include', '含む'], ['mean', '意味する'],
    ['produce', '生産する'], ['provide', '提供する'], ['realize', '気づく'], ['reduce', '減らす'],
    ['support', '支える'], ['understand', '理解する'], ['wonder', '疑問に思う'], ['achieve', '達成する'],
  ]),
  ...words('中3 必修相当 形容詞・副詞', [
    ['active', '積極的な'], ['common', '共通の'], ['complete', '完全な'], ['correct', '正しい'],
    ['different', '異なる'], ['modern', '現代の'], ['natural', '自然な'], ['personal', '個人的な'],
    ['possible', '可能な'], ['public', '公共の'], ['special', '特別な'], ['serious', '深刻な'],
  ]),
];

const G7_MEXT_SCALE_SUPPLEMENT = [
  ...numberWords(21, 100, '中1 指導語数補填 数'),
  ...nounForms('中1 指導語数補填 身近な名詞', [
    ['airport', '空港'], ['animal', '動物'], ['answer', '答え'], ['area', '地域'], ['beach', '浜辺'],
    ['bicycle', '自転車'], ['bridge', '橋'], ['building', '建物'], ['camera', 'カメラ'], ['camp', 'キャンプ'],
    ['card', 'カード'], ['case', '入れ物'], ['center', '中心'], ['chance', '機会'], ['child', '子ども'],
    ['church', '教会'], ['circle', '輪'], ['college', '大学'], ['corner', '角'], ['country', '国'],
    ['course', '課程'], ['cup', 'カップ'], ['dictionary', '辞書'], ['dish', '皿'], ['dream', '夢'],
    ['event', '行事'], ['farm', '農場'], ['field', '野原'], ['floor', '床'], ['garden', '庭'],
    ['gate', '門'], ['group', '集団'], ['guest', '客'], ['hall', 'ホール'], ['homework', '宿題'],
    ['hotel', 'ホテル'], ['island', '島'], ['key', '鍵'], ['kitchen', '台所'], ['lake', '湖'],
    ['market', '市場'], ['member', '一員'], ['mountain', '山'], ['newspaper', '新聞'], ['office', '事務所'],
    ['page', 'ページ'], ['paper', '紙'], ['parent', '親'], ['party', 'パーティー'], ['person', '人'],
    ['postcard', 'はがき'], ['present', '贈り物'], ['road', '道路'], ['shop', '店'], ['team', 'チーム'],
    ['ticket', '切符'], ['tree', '木'], ['uniform', '制服'], ['village', '村'], ['wall', '壁'],
  ]),
  ...verbForms('中1 指導語数補填 基本動詞', [
    ['answer', '答える'], ['arrive', '到着する'], ['believe', '信じる'], ['brush', '磨く'], ['change', '変える'],
    ['clean', '掃除する'], ['climb', '登る'], ['cook', '料理する'], ['count', '数える'], ['dance', '踊る'],
    ['enjoy', '楽しむ'], ['enter', '入る'], ['help', '助ける'], ['hope', '望む'], ['join', '加わる'],
    ['jump', '跳ぶ'], ['learn', '学ぶ'], ['like', '好む'], ['listen', '聞く'], ['look', '見る'],
    ['love', '大好きである'], ['need', '必要とする'], ['open', '開ける'], ['paint', '絵を描く'], ['plant', '植える'],
    ['play', '遊ぶ'], ['practice', '練習する'], ['remember', '覚えている'], ['return', '戻る'], ['save', '救う'],
    ['show', '見せる'], ['skate', 'スケートする'], ['ski', 'スキーする'], ['smile', 'ほほえむ'], ['start', '始める'],
    ['stay', '滞在する'], ['study', '勉強する'], ['talk', '話す'], ['travel', '旅行する'], ['try', '試す'],
    ['turn', '回す'], ['use', '使う'], ['visit', '訪れる'], ['wait', '待つ'], ['walk', '歩く'],
    ['want', '欲しがる'], ['wash', '洗う'], ['watch', '見る'], ['welcome', '歓迎する'], ['work', '働く'],
    ['worry', '心配する'], ['carry', '運ぶ'], ['copy', '写す'], ['dry', '乾かす'], ['enjoy', '楽しむ'],
  ]),
  ...adjectiveForms('中1 指導語数補填 基本形容詞', [
    ['bright', '明るい'], ['clean', '清潔な'], ['clear', '明らかな'], ['close', '近い'], ['dark', '暗い'],
    ['deep', '深い'], ['early', '早い'], ['fine', '元気な'], ['fresh', '新鮮な'], ['full', 'いっぱいの'],
    ['glad', 'うれしい'], ['heavy', '重い'], ['large', '大きい'], ['light', '軽い'], ['little', '小さい'],
    ['loud', '大きな音の'], ['nice', 'よい'], ['quiet', '静かな'], ['ready', '準備ができた'], ['short', '短い'],
    ['slow', 'ゆっくりした'], ['soft', 'やわらかい'], ['strong', '強い'], ['sweet', '甘い'], ['tall', '背が高い'],
    ['warm', '暖かい'], ['weak', '弱い'], ['wide', '幅が広い'], ['young', '若い'], ['busy', '忙しい'],
    ['easy', '簡単な'], ['friendly', '親しみやすい'], ['healthy', '健康な'], ['pretty', 'かわいい'], ['sunny', '晴れた'],
  ]),
  ...words('中1 指導語数補填 機能語・頻度語', [
    ['a', '1つの'], ['an', '1つの'], ['the', 'その'], ['this', 'これ'], ['that', 'あれ'],
    ['these', 'これら'], ['those', 'あれら'], ['all', 'すべて'], ['any', 'どれか'], ['both', '両方'],
    ['each', 'それぞれ'], ['every', 'すべての'], ['many', '多くの'], ['much', '多くの'], ['some', 'いくつかの'],
    ['few', '少しの'], ['first', '最初の'], ['second', '2番目の'], ['third', '3番目の'], ['next', '次の'],
    ['last', '最後の'], ['up', '上へ'], ['down', '下へ'], ['inside', '内側に'], ['outside', '外側に'],
    ['away', '離れて'], ['back', '戻って'], ['very', 'とても'], ['too', 'あまりに'], ['also', 'また'],
    ['just', 'ちょうど'], ['now', '今'], ['soon', 'すぐに'], ['then', 'その時'], ['well', '上手に'],
    ['often', 'しばしば'], ['usually', 'たいてい'], ['sometimes', '時々'], ['never', '決してない'], ['maybe', 'たぶん'],
  ]),
];

const G8_MEXT_SCALE_SUPPLEMENT = [
  ...numberWords(101, 200, '中2 指導語数補填 大きな数'),
  ...nounForms('中2 指導語数補填 社会・自然名詞', [
    ['accident', '事故'], ['activity', '活動'], ['address', '住所'], ['advice', '助言'], ['age', '年齢'],
    ['article', '記事'], ['attention', '注意'], ['battery', '電池'], ['business', '仕事'], ['calendar', 'カレンダー'],
    ['capital', '首都'], ['character', '登場人物'], ['community', '地域社会'], ['competition', '競争'], ['conversation', '会話'],
    ['custom', '習慣'], ['danger', '危険'], ['decision', '決定'], ['degree', '程度'], ['direction', '方向'],
    ['earth', '地球'], ['energy', 'エネルギー'], ['environment', '環境'], ['experience', '経験'], ['factory', '工場'],
    ['festival', '祭り'], ['future', '未来'], ['habit', '習慣'], ['history', '歴史'], ['hospital', '病院'],
    ['industry', '産業'], ['information', '情報'], ['language', '言語'], ['machine', '機械'], ['medicine', '薬'],
    ['message', '伝言'], ['museum', '博物館'], ['nature', '自然'], ['opinion', '意見'], ['planet', '惑星'],
    ['problem', '問題'], ['program', '番組'], ['reason', '理由'], ['record', '記録'], ['rule', '規則'],
    ['science', '科学'], ['service', 'サービス'], ['space', '宇宙'], ['station', '駅'], ['subject', '教科'],
    ['temperature', '温度'], ['tradition', '伝統'], ['traffic', '交通'], ['training', '訓練'], ['volunteer', 'ボランティア'],
  ]),
  ...verbForms('中2 指導語数補填 一般動詞', [
    ['accept', '受け入れる'], ['add', '加える'], ['appear', '現れる'], ['borrow', '借りる'], ['check', '確認する'],
    ['collect', '集める'], ['communicate', '伝え合う'], ['compare', '比較する'], ['complete', '完成させる'], ['connect', 'つなぐ'],
    ['continue', '続ける'], ['control', '制御する'], ['cover', '覆う'], ['create', '創造する'], ['decide', '決める'],
    ['describe', '描写する'], ['discover', '発見する'], ['discuss', '議論する'], ['encourage', '励ます'], ['explain', '説明する'],
    ['follow', '従う'], ['happen', '起こる'], ['imagine', '想像する'], ['improve', '改善する'], ['include', '含む'],
    ['introduce', '紹介する'], ['invite', '招待する'], ['miss', '逃す'], ['notice', '気づく'], ['order', '注文する'],
    ['prepare', '準備する'], ['protect', '守る'], ['provide', '提供する'], ['receive', '受け取る'], ['record', '記録する'],
    ['recycle', 'リサイクルする'], ['reduce', '減らす'], ['refuse', '断る'], ['repair', '修理する'], ['report', '報告する'],
    ['respect', '尊重する'], ['search', '探す'], ['share', '共有する'], ['solve', '解決する'], ['support', '支援する'],
    ['surprise', '驚かせる'], ['train', '訓練する'], ['translate', '翻訳する'], ['travel', '旅行する'], ['volunteer', '志願する'],
    ['wonder', '疑問に思う'], ['change', '変化する'], ['hope', '望む'], ['plan', '計画する'], ['reach', '到着する'],
  ]),
  ...adjectiveForms('中2 指導語数補填 形容詞', [
    ['afraid', '恐れている'], ['alone', '一人の'], ['amazing', '驚くべき'], ['careful', '注意深い'], ['colorful', '色鮮やかな'],
    ['common', '共通の'], ['cool', '涼しい'], ['dangerous', '危険な'], ['delicious', 'おいしい'], ['different', '異なる'],
    ['exciting', 'わくわくする'], ['expensive', '高価な'], ['famous', '有名な'], ['foreign', '外国の'], ['important', '重要な'],
    ['interested', '興味がある'], ['interesting', 'おもしろい'], ['kind', '親切な'], ['local', '地元の'], ['main', '主な'],
    ['natural', '自然の'], ['necessary', '必要な'], ['popular', '人気のある'], ['possible', '可能な'], ['safe', '安全な'],
    ['similar', '似ている'], ['special', '特別な'], ['traditional', '伝統的な'], ['useful', '役に立つ'], ['wonderful', 'すばらしい'],
  ]),
  ...words('中2 指導語数補填 副詞・接続表現', [
    ['actually', '実際に'], ['almost', 'ほとんど'], ['already', 'すでに'], ['carefully', '注意深く'], ['clearly', '明確に'],
    ['easily', '簡単に'], ['finally', 'ついに'], ['hardly', 'ほとんどない'], ['probably', 'おそらく'], ['quickly', 'すばやく'],
    ['really', '本当に'], ['recently', '最近'], ['safely', '安全に'], ['slowly', 'ゆっくりと'], ['suddenly', '突然'],
    ['without', 'なしで'], ['within', '以内に'], ['through', '通って'], ['across', '横切って'], ['among', 'の間で'],
    ['during', 'の間に'], ['until', 'まで'], ['although', 'けれども'], ['while', 'する間に'], ['if', 'もし'],
    ['because of', 'のために'], ['such as', 'のような'], ['for example', '例えば'], ['at first', '最初は'], ['at last', 'ついに'],
    ['one day', 'ある日'], ['these days', '近ごろ'], ['some day', 'いつか'], ['right now', '今すぐ'], ['of course', 'もちろん'],
  ]),
];

const G9_MEXT_SCALE_SUPPLEMENT = [
  ...numberWords(201, 300, '中3 指導語数補填 大きな数'),
  ...nounForms('中3 指導語数補填 抽象・社会名詞', [
    ['ability', '能力'], ['advantage', '利点'], ['agreement', '合意'], ['article', '論説'], ['attitude', '態度'],
    ['behavior', '行動'], ['cause', '原因'], ['challenge', '課題'], ['choice', '選択'], ['climate', '気候'],
    ['communication', '意思疎通'], ['condition', '状態'], ['culture', '文化'], ['development', '発展'], ['difference', '違い'],
    ['difficulty', '困難'], ['disadvantage', '欠点'], ['education', '教育'], ['effort', '努力'], ['effect', '効果'],
    ['example', '例'], ['government', '政府'], ['health', '健康'], ['human', '人間'], ['increase', '増加'],
    ['influence', '影響'], ['knowledge', '知識'], ['level', '水準'], ['life', '生活'], ['meaning', '意味'],
    ['method', '方法'], ['mind', '心'], ['peace', '平和'], ['pollution', '汚染'], ['population', '人口'],
    ['purpose', '目的'], ['relationship', '関係'], ['resource', '資源'], ['responsibility', '責任'], ['result', '結果'],
    ['right', '権利'], ['society', '社会'], ['solution', '解決策'], ['technology', '技術'], ['value', '価値'],
  ]),
  ...verbForms('中3 指導語数補填 発信・読解動詞', [
    ['achieve', '達成する'], ['affect', '影響する'], ['agree', '賛成する'], ['allow', '許す'], ['argue', '主張する'],
    ['avoid', '避ける'], ['consider', 'よく考える'], ['continue', '継続する'], ['depend', '依存する'], ['develop', '発展させる'],
    ['educate', '教育する'], ['exist', '存在する'], ['express', '表現する'], ['increase', '増加する'], ['influence', '影響を与える'],
    ['mention', '言及する'], ['organize', '組織する'], ['produce', '生産する'], ['realize', '気づく'], ['recognize', '認識する'],
    ['relate', '関連する'], ['remain', '残る'], ['require', '必要とする'], ['respond', '応答する'], ['result', '結果として起こる'],
    ['separate', '分ける'], ['solve', '解く'], ['suppose', '仮定する'], ['treat', '扱う'], ['unite', '団結させる'],
    ['compare', '比較する'], ['conclude', '結論づける'], ['define', '定義する'], ['estimate', '見積もる'], ['examine', '調べる'],
    ['imagine', '想像する'], ['improve', '改善する'], ['include', '含む'], ['protect', '保護する'], ['support', '支持する'],
    ['suggest', '提案する'], ['reduce', '削減する'], ['respect', '尊重する'], ['discuss', '議論する'], ['explain', '説明する'],
  ]),
  ...adjectiveForms('中3 指導語数補填 論説形容詞', [
    ['active', '積極的な'], ['basic', '基本的な'], ['central', '中心的な'], ['certain', '確かな'], ['complete', '完全な'],
    ['correct', '正しい'], ['cultural', '文化的な'], ['direct', '直接の'], ['economic', '経済の'], ['educational', '教育の'],
    ['environmental', '環境の'], ['equal', '等しい'], ['general', '一般的な'], ['global', '地球規模の'], ['individual', '個々の'],
    ['international', '国際的な'], ['major', '主要な'], ['modern', '現代の'], ['national', '国の'], ['personal', '個人的な'],
    ['political', '政治の'], ['positive', '前向きな'], ['public', '公共の'], ['recent', '最近の'], ['serious', '深刻な'],
    ['social', '社会の'], ['successful', '成功した'], ['sustainable', '持続可能な'], ['valuable', '価値ある'], ['various', 'さまざまな'],
  ]),
  ...words('中3 指導語数補填 論理・談話表現', [
    ['according to', 'によれば'], ['as a result', '結果として'], ['at the same time', '同時に'], ['both A and B', 'AもBも'],
    ['either A or B', 'AかBのどちらか'], ['neither A nor B', 'AもBもない'], ['not only A but also B', 'AだけでなくBも'],
    ['in order to', 'するために'], ['so that', 'するように'], ['even if', 'たとえしても'], ['even though', 'にもかかわらず'],
    ['as soon as', 'するとすぐに'], ['as long as', 'する限り'], ['in addition', '加えて'], ['in fact', '実際には'],
    ['in my opinion', '私の意見では'], ['on the other hand', '一方で'], ['for this reason', 'この理由で'],
    ['to begin with', 'まず初めに'], ['to sum up', '要約すると'], ['however', 'しかしながら'], ['therefore', 'したがって'],
    ['moreover', 'さらに'], ['besides', 'そのうえ'], ['instead', 'その代わりに'], ['otherwise', 'さもなければ'],
    ['especially', '特に'], ['generally', '一般的に'], ['personally', '個人的には'], ['seriously', '真剣に'],
    ['fortunately', '幸運にも'], ['unfortunately', '残念ながら'], ['gradually', '徐々に'], ['completely', '完全に'],
    ['correctly', '正しく'], ['directly', '直接に'], ['effectively', '効果的に'], ['mainly', '主に'],
    ['nearly', 'ほとんど'], ['simply', '単に'], ['there', 'そこで'], ['whether', 'かどうか'],
  ]),
];

const G5_MEXT_SCALE_SUPPLEMENT = [
  ...numberWords(21, 30, '小5 指導語数補填 数'),
  ...nounForms('小5 指導語数補填 身近な名詞', [
    ['ball', 'ボール'], ['bat', 'バット'], ['bed', 'ベッド'], ['bench', 'ベンチ'], ['bike', '自転車'],
    ['boat', 'ボート'], ['bus', 'バス'], ['car', '車'], ['clock', '時計'], ['coin', '硬貨'],
    ['cup', 'カップ'], ['door', 'ドア'], ['drum', '太鼓'], ['flower', '花'], ['gift', '贈り物'],
    ['glass', 'コップ'], ['hat', '帽子'], ['house', '家'], ['key', '鍵'], ['letter', '手紙'],
    ['light', '明かり'], ['line', '線'], ['mail', '郵便'], ['pen', 'ペン'], ['photo', '写真'],
    ['plane', '飛行機'], ['plate', '皿'], ['river', '川'], ['rock', '岩'], ['room', '部屋'],
  ]),
  ...verbForms('小5 指導語数補填 基本動作', [
    ['catch', '捕まえる'], ['close', '閉める'], ['cut', '切る'], ['drink', '飲む'], ['eat', '食べる'],
    ['find', '見つける'], ['fly', '飛ぶ'], ['give', '与える'], ['go', '行く'], ['have', '持つ'],
    ['hear', '聞こえる'], ['hold', '持つ'], ['kick', 'ける'], ['meet', '会う'], ['put', '置く'],
    ['see', '見る'], ['sell', '売る'], ['take', '取る'], ['throw', '投げる'], ['want', '欲しい'],
  ]),
  ...adjectiveForms('小5 指導語数補填 基本形容詞', [
    ['bad', '悪い'], ['big', '大きい'], ['cold', '冷たい'], ['fast', '速い'], ['good', 'よい'],
    ['great', 'すばらしい'], ['hard', 'かたい'], ['high', '高い'], ['hot', '熱い'], ['long', '長い'],
    ['new', '新しい'], ['old', '古い'], ['rich', '豊かな'], ['small', '小さい'], ['young', '若い'],
  ]),
];

const G6_MEXT_SCALE_SUPPLEMENT = [
  ...nounForms('小6 指導語数補填 学校・地域・自然', [
    ['airport', '空港'], ['bank', '銀行'], ['bridge', '橋'], ['castle', '城'], ['city', '市'],
    ['club member', 'クラブ員'], ['coast', '海岸'], ['country', '国'], ['factory', '工場'], ['forest', '森'],
    ['guide', '案内人'], ['harbor', '港'], ['hill', '丘'], ['hotel', 'ホテル'], ['library card', '図書カード'],
    ['market', '市場'], ['monument', '記念碑'], ['palace', '宮殿'], ['passport', '旅券'], ['path', '小道'],
    ['port', '港'], ['program', '番組'], ['schedule', '予定表'], ['shopkeeper', '店員'], ['stadium', '競技場'],
    ['theater', '劇場'], ['tower', '塔'], ['train', '電車'], ['visitor', '訪問者'], ['volunteer', 'ボランティア'],
  ]),
  ...verbForms('小6 指導語数補填 生活・交流動詞', [
    ['arrive', '到着する'], ['begin', '始まる'], ['build', '建てる'], ['call', '電話する'], ['choose', '選ぶ'],
    ['collect', '集める'], ['come', '来る'], ['decide', '決める'], ['finish', '終える'], ['follow', '従う'],
    ['grow', '育つ'], ['guide', '案内する'], ['hope', '望む'], ['leave', '出発する'], ['listen', '聞く'],
    ['look for', '探す'], ['move', '動く'], ['need', '必要とする'], ['open', '開く'], ['plan', '計画する'],
    ['read', '読む'], ['show', '見せる'], ['stay', '滞在する'], ['talk', '話す'], ['work', '働く'],
  ]),
  ...adjectiveForms('小6 指導語数補填 表現形容詞', [
    ['careful', '注意深い'], ['colorful', '色鮮やかな'], ['cool', '涼しい'], ['different', '異なる'],
    ['early', '早い'], ['easy', '簡単な'], ['famous', '有名な'], ['favorite', 'お気に入りの'],
    ['foreign', '外国の'], ['important', '重要な'], ['large', '大きい'], ['local', '地元の'],
    ['necessary', '必要な'], ['popular', '人気のある'], ['special', '特別な'], ['useful', '役に立つ'],
  ]),
  ...words('小6 指導語数補填 時・順序・表現', [
    ['after school', '放課後'], ['at home', '家で'], ['by bus', 'バスで'], ['every day', '毎日'],
    ['for example', '例えば'], ['from Japan', '日本から'], ['in summer', '夏に'], ['in the future', '将来'],
    ['last year', '昨年'], ['next week', '来週'], ['on foot', '徒歩で'], ['this morning', '今朝'],
    ['three times', '3回'], ['with friends', '友だちと'], ['would like', 'したい'],
  ]),
];

const G3_REQUIRED_WORDS = [...G3_WORDS, ...G3_REQUIRED_SUPPLEMENT];
const G4_REQUIRED_WORDS = [...G4_WORDS, ...G4_REQUIRED_SUPPLEMENT];
const G5_REQUIRED_WORDS = [...G5_WORDS, ...G5_REQUIRED_SUPPLEMENT, ...G5_MEXT_SCALE_SUPPLEMENT];
const G6_REQUIRED_WORDS = [...G6_WORDS, ...G6_REQUIRED_SUPPLEMENT, ...G6_MEXT_SCALE_SUPPLEMENT];
const G7_REQUIRED_WORDS = [...G7_WORDS, ...G7_REQUIRED_SUPPLEMENT, ...G7_MEXT_SCALE_SUPPLEMENT];
const G8_REQUIRED_WORDS = [...G8_WORDS, ...G8_REQUIRED_SUPPLEMENT, ...G8_MEXT_SCALE_SUPPLEMENT];
const G9_REQUIRED_WORDS = [...G9_WORDS, ...G9_REQUIRED_SUPPLEMENT, ...G9_MEXT_SCALE_SUPPLEMENT];

const upper = (items: EnglishWordItem[], category: string, level: string, scene: string): EnglishWordItem[] =>
  items.map((item) => ({ ...item, hint: `カテゴリ: ${category} / 難易度: ${level} / 活用場面: ${scene}` }));

const UPPER_ACADEMIC = upper([
  word('analyze', '分析する', '', 'Analyze the data carefully.', 'データを注意深く分析しなさい。'),
  word('assume', '仮定する', '', 'Do not assume the answer too quickly.', '答えを早く仮定しすぎないで。'),
  word('concept', '概念', '', 'This concept is important.', 'この概念は重要です。'),
  word('context', '文脈', '', 'Read the sentence in context.', '文を文脈の中で読みなさい。'),
  word('evidence', '証拠', '', 'The writer gives strong evidence.', '筆者は強い証拠を示しています。'),
  word('hypothesis', '仮説', '', 'We tested the hypothesis.', '私たちは仮説を検証しました。'),
  word('interpret', '解釈する', '', 'Interpret the graph.', 'グラフを解釈しなさい。'),
  word('perspective', '観点', '', 'Look at the issue from another perspective.', '別の観点からその問題を見なさい。'),
  word('principle', '原理', '', 'This principle explains the result.', 'この原理は結果を説明します。'),
  word('significant', '重要な', '', 'There is a significant difference.', '重要な違いがあります。'),
  word('structure', '構造', '', 'Understand the structure of the argument.', '議論の構造を理解しなさい。'),
  word('theory', '理論', '', 'The theory is widely accepted.', 'その理論は広く受け入れられています。'),
], '学術・論説', '標準〜発展', '長文読解・小論文');

const UPPER_DAILY = upper([
  word('appointment', '予約', '', 'I have a dentist appointment.', '歯医者の予約があります。'),
  word('commute', '通勤する', '', 'Many people commute by train.', '多くの人が電車で通勤します。'),
  word('household', '家庭', '', 'Household expenses increased.', '家庭の支出が増えました。'),
  word('appliance', '家電', '', 'This appliance saves energy.', 'この家電は省エネです。'),
  word('receipt', 'レシート', '', 'Keep the receipt.', 'レシートを保管してください。'),
  word('refund', '返金', '', 'I asked for a refund.', '返金を求めました。'),
  word('subscription', '定期契約', '', 'Cancel the subscription online.', 'オンラインで定期契約を解約しなさい。'),
  word('budget', '予算', '', 'Set a monthly budget.', '月ごとの予算を決めなさい。'),
  word('nutrition', '栄養', '', 'Nutrition affects health.', '栄養は健康に影響します。'),
  word('symptom', '症状', '', 'Tell the doctor your symptoms.', '医師に症状を伝えなさい。'),
], '生活実用', '基礎〜標準', '買い物・健康・暮らし');

const UPPER_BUSINESS = upper([
  word('agenda', '議題', '', 'The agenda has five items.', '議題は5項目です。'),
  word('client', '顧客', '', 'The client needs a new proposal.', '顧客は新しい提案を必要としています。'),
  word('deadline', '締め切り', '', 'The deadline is tomorrow.', '締め切りは明日です。'),
  word('negotiate', '交渉する', '', 'They negotiate the price.', '彼らは価格を交渉します。'),
  word('proposal', '提案書', '', 'She wrote a proposal.', '彼女は提案書を書きました。'),
  word('revenue', '収益', '', 'Revenue increased this year.', '今年は収益が増えました。'),
  word('strategy', '戦略', '', 'We need a better strategy.', '私たちはよりよい戦略が必要です。'),
  word('presentation', '発表', '', 'The presentation was clear.', '発表は明確でした。'),
  word('career', '進路', '', 'Think about your career.', '進路について考えなさい。'),
  word('interview', '面接', '', 'Prepare for the interview.', '面接の準備をしなさい。'),
], 'ビジネス・進路', '標準', '面接・発表・仕事');

const UPPER_SCIENCE = upper([
  word('atom', '原子', '', 'An atom is very small.', '原子はとても小さいです。'),
  word('molecule', '分子', '', 'Water is a molecule.', '水は分子です。'),
  word('gravity', '重力', '', 'Gravity pulls objects downward.', '重力は物体を下へ引きます。'),
  word('friction', '摩擦', '', 'Friction slows the box.', '摩擦が箱を遅くします。'),
  word('organism', '生物', '', 'Every organism needs energy.', 'すべての生物はエネルギーを必要とします。'),
  word('evolution', '進化', '', 'Evolution takes a long time.', '進化には長い時間がかかります。'),
  word('ecosystem', '生態系', '', 'The ecosystem is fragile.', 'その生態系は壊れやすいです。'),
  word('radiation', '放射線', '', 'Radiation can be measured.', '放射線は測定できます。'),
  word('experiment', '実験', '', 'The experiment was successful.', '実験は成功しました。'),
  word('observation', '観察', '', 'Observation is the first step.', '観察が最初の段階です。'),
], '科学', '標準〜発展', '理科・科学記事');

const UPPER_TECH = upper([
  word('algorithm', 'アルゴリズム', '', 'The algorithm sorts data.', 'アルゴリズムはデータを並べ替えます。'),
  word('database', 'データベース', '', 'The database stores records.', 'データベースは記録を保存します。'),
  word('encryption', '暗号化', '', 'Encryption protects information.', '暗号化は情報を守ります。'),
  word('interface', '操作画面', '', 'The interface is easy to use.', '操作画面は使いやすいです。'),
  word('network', 'ネットワーク', '', 'The network is stable.', 'ネットワークは安定しています。'),
  word('privacy', 'プライバシー', '', 'Privacy matters online.', 'オンラインではプライバシーが重要です。'),
  word('security', '安全対策', '', 'Security prevents attacks.', '安全対策は攻撃を防ぎます。'),
  word('device', '機器', '', 'This device is small.', 'この機器は小さいです。'),
  word('software', 'ソフトウェア', '', 'Software needs updates.', 'ソフトウェアには更新が必要です。'),
  word('artificial intelligence', '人工知能', '', 'Artificial intelligence supports translation.', '人工知能は翻訳を支えます。'),
], 'IT・テクノロジー', '標準〜発展', '情報・ニュース');

const UPPER_EXAM = upper([
  word('therefore', 'したがって', '', 'Therefore, the claim is reasonable.', 'したがって、その主張は妥当です。'),
  word('however', 'しかしながら', '', 'However, the result was different.', 'しかしながら、結果は異なりました。'),
  word('moreover', 'さらに', '', 'Moreover, the method is simple.', 'さらに、その方法は簡単です。'),
  word('nevertheless', 'それにもかかわらず', '', 'Nevertheless, they continued.', 'それにもかかわらず、彼らは続けました。'),
  word('whereas', '一方で', '', 'Some agree, whereas others disagree.', '賛成する人もいれば、一方で反対する人もいます。'),
  word('consequently', 'その結果', '', 'Consequently, costs fell.', 'その結果、費用は下がりました。'),
  word('in contrast', '対照的に', '', 'In contrast, this case is simple.', '対照的に、この場合は簡単です。'),
  word('for instance', '例えば', '', 'For instance, solar power is clean.', '例えば、太陽光発電はクリーンです。'),
  word('in addition', '加えて', '', 'In addition, the plan saves time.', '加えて、その計画は時間を節約します。'),
  word('as a result', '結果として', '', 'As a result, the team won.', '結果として、そのチームは勝ちました。'),
], '入試・論理表現', '基礎〜発展', '長文の接続表現');

const UPPER_SOCIAL = upper([
  word('democracy', '民主主義', '', 'Democracy requires participation.', '民主主義には参加が必要です。'),
  word('inequality', '不平等', '', 'Inequality is a serious issue.', '不平等は深刻な問題です。'),
  word('migration', '移住', '', 'Migration changes communities.', '移住は地域社会を変えます。'),
  word('diversity', '多様性', '', 'Diversity makes society stronger.', '多様性は社会を強くします。'),
  word('citizen', '市民', '', 'Every citizen has rights.', 'すべての市民には権利があります。'),
  word('policy', '政策', '', 'The policy affects families.', 'その政策は家庭に影響します。'),
  word('economy', '経済', '', 'The economy is recovering.', '経済は回復しています。'),
  word('community', '地域社会', '', 'The community helped students.', '地域社会が生徒を助けました。'),
  word('human rights', '人権', '', 'Human rights must be protected.', '人権は守られなければなりません。'),
  word('sustainable', '持続可能な', '', 'We need sustainable energy.', '持続可能なエネルギーが必要です。'),
], '社会・国際', '標準〜発展', '国際問題・公民');

const UPPER_TRAVEL = upper([
  word('itinerary', '旅程', '', 'Check the itinerary before leaving.', '出発前に旅程を確認しなさい。'),
  word('accommodation', '宿泊施設', '', 'The accommodation was comfortable.', '宿泊施設は快適でした。'),
  word('customs', '税関', '', 'We went through customs.', '私たちは税関を通りました。'),
  word('passport', '旅券', '', 'Do not forget your passport.', '旅券を忘れないで。'),
  word('reservation', '予約', '', 'I made a reservation.', '私は予約をしました。'),
  word('destination', '目的地', '', 'Our destination is London.', '私たちの目的地はロンドンです。'),
  word('souvenir', '土産', '', 'I bought a souvenir.', '私は土産を買いました。'),
  word('currency', '通貨', '', 'Exchange currency at the airport.', '空港で通貨を両替しなさい。'),
  word('landmark', '名所', '', 'The tower is a famous landmark.', 'その塔は有名な名所です。'),
  word('local cuisine', '郷土料理', '', 'Try the local cuisine.', '郷土料理を試しなさい。'),
], '旅行・文化', '基礎〜標準', '旅行会話・異文化理解');

const UPPER_MEXT_SCALE_SUPPLEMENT = [
  ...nounForms('高校以上 指導語数補填 学術・論説名詞', [
    ['analysis', '分析'], ['approach', '手法'], ['argument', '議論'], ['assumption', '仮定'], ['background', '背景'],
    ['benefit', '利益'], ['bias', '偏り'], ['capacity', '能力'], ['circumstance', '状況'], ['claim', '主張'],
    ['conclusion', '結論'], ['conflict', '対立'], ['consequence', '結果'], ['context', '文脈'], ['criticism', '批判'],
    ['data', 'データ'], ['debate', '討論'], ['definition', '定義'], ['demand', '需要'], ['detail', '詳細'],
    ['evidence', '証拠'], ['factor', '要因'], ['feature', '特徴'], ['framework', '枠組み'], ['function', '機能'],
    ['impact', '影響'], ['inference', '推論'], ['insight', '洞察'], ['interaction', '相互作用'], ['interpretation', '解釈'],
    ['issue', '論点'], ['limitation', '限界'], ['measure', '手段'], ['outcome', '結果'], ['perspective', '観点'],
    ['phenomenon', '現象'], ['principle', '原理'], ['process', '過程'], ['proposal', '提案'], ['purpose', '目的'],
    ['reaction', '反応'], ['reference', '参照'], ['response', '反応'], ['role', '役割'], ['source', '情報源'],
    ['strategy', '戦略'], ['structure', '構造'], ['tendency', '傾向'], ['theory', '理論'], ['trend', '傾向'],
  ]),
  ...verbForms('高校以上 指導語数補填 読解・表現動詞', [
    ['analyze', '分析する'], ['assess', '評価する'], ['assume', '仮定する'], ['clarify', '明確にする'], ['classify', '分類する'],
    ['compare', '比較する'], ['conclude', '結論づける'], ['confirm', '確認する'], ['construct', '構築する'], ['criticize', '批判する'],
    ['define', '定義する'], ['demonstrate', '示す'], ['derive', '導き出す'], ['determine', '決定する'], ['emphasize', '強調する'],
    ['evaluate', '評価する'], ['examine', '調べる'], ['expand', '拡大する'], ['identify', '特定する'], ['illustrate', '説明する'],
    ['imply', '暗示する'], ['indicate', '示す'], ['infer', '推論する'], ['interpret', '解釈する'], ['investigate', '調査する'],
    ['justify', '正当化する'], ['maintain', '維持する'], ['obtain', '得る'], ['predict', '予測する'], ['propose', '提案する'],
    ['refer', '言及する'], ['reflect', '反映する'], ['reject', '拒否する'], ['reveal', '明らかにする'], ['summarize', '要約する'],
  ]),
  ...adjectiveForms('高校以上 指導語数補填 論説形容詞', [
    ['abstract', '抽象的な'], ['accurate', '正確な'], ['appropriate', '適切な'], ['available', '利用可能な'], ['beneficial', '有益な'],
    ['complex', '複雑な'], ['consistent', '一貫した'], ['critical', '批判的な'], ['current', '現在の'], ['effective', '効果的な'],
    ['efficient', '効率的な'], ['essential', '不可欠な'], ['evident', '明白な'], ['flexible', '柔軟な'], ['fundamental', '根本的な'],
    ['independent', '独立した'], ['logical', '論理的な'], ['objective', '客観的な'], ['potential', '潜在的な'], ['practical', '実用的な'],
    ['previous', '以前の'], ['relevant', '関連した'], ['reliable', '信頼できる'], ['significant', '重要な'], ['specific', '具体的な'],
  ]),
  ...words('高校以上 指導語数補填 社会・科学・IT・生活', [
    ['biodiversity', '生物多様性'], ['carbon dioxide', '二酸化炭素'], ['climate change', '気候変動'], ['conservation', '保全'],
    ['emission', '排出'], ['fossil fuel', '化石燃料'], ['renewable energy', '再生可能エネルギー'], ['sustainability', '持続可能性'],
    ['artificial intelligence', '人工知能'], ['automation', '自動化'], ['cybersecurity', 'サイバーセキュリティ'], ['digital divide', 'デジタル格差'],
    ['innovation', '革新'], ['machine learning', '機械学習'], ['online platform', 'オンライン基盤'], ['privacy policy', '個人情報方針'],
    ['democracy', '民主主義'], ['diplomacy', '外交'], ['diversity', '多様性'], ['globalization', 'グローバル化'],
    ['human rights', '人権'], ['inequality', '不平等'], ['migration', '移住'], ['public opinion', '世論'],
    ['application form', '申込書'], ['appointment', '予約'], ['budgeting', '予算管理'], ['contract', '契約'],
    ['insurance', '保険'], ['invoice', '請求書'], ['scholarship', '奨学金'], ['workplace', '職場'],
    ['academic essay', '学術的作文'], ['career path', '進路'], ['entrance examination', '入学試験'], ['field research', '現地調査'],
    ['presentation skill', '発表技能'], ['research question', '研究課題'], ['source material', '資料'], ['survey result', '調査結果'],
  ]),
  ...words('高校以上 指導語数補填 論理接続・慣用表現', [
    ['above all', 'とりわけ'], ['as a consequence', '結果として'], ['as opposed to', 'とは対照的に'],
    ['by contrast', '対照的に'], ['due to', 'が原因で'], ['even so', 'それでも'], ['in accordance with', 'に従って'],
    ['in comparison with', 'と比較して'], ['in terms of', 'の観点から'], ['in the long run', '長期的には'],
    ['on behalf of', 'を代表して'], ['regardless of', 'に関係なく'], ['so as to', 'するために'], ['to some extent', 'ある程度'],
    ['with regard to', 'に関して'],
  ]),
  ...words('高校以上 指導語数補填 探究・研究', [
    ['peer review', '査読'], ['statistical significance', '統計的有意性'],
  ]),
];

export const ENGLISH_GRADE_WORD_BANKS: Record<number, EnglishWordItem[]> = {
  3: G3_REQUIRED_WORDS,
  4: G4_REQUIRED_WORDS,
  5: G5_REQUIRED_WORDS,
  6: G6_REQUIRED_WORDS,
  7: G7_REQUIRED_WORDS,
  8: G8_REQUIRED_WORDS,
  9: G9_REQUIRED_WORDS,
};

export const ENGLISH_GRADE_WORD_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G3_WORDS: buildVocabularyUnit(G3_REQUIRED_WORDS, '小3英単語'),
  ENGLISH_G4_WORDS: buildVocabularyUnit(G4_REQUIRED_WORDS, '小4英単語'),
  ENGLISH_G5_WORDS: buildVocabularyUnit(G5_REQUIRED_WORDS, '小5英単語'),
  ENGLISH_G6_WORDS: buildVocabularyUnit(G6_REQUIRED_WORDS, '小6英単語'),
  ENGLISH_G7_WORDS: buildVocabularyUnit(G7_REQUIRED_WORDS, '中1英単語'),
  ENGLISH_G8_WORDS: buildVocabularyUnit(G8_REQUIRED_WORDS, '中2英単語'),
  ENGLISH_G9_WORDS: buildVocabularyUnit(G9_REQUIRED_WORDS, '中3英単語'),
};

const UPPER_ALL_WORDS = uniqueEnglishWordItems([
  ...UPPER_ACADEMIC,
  ...UPPER_DAILY,
  ...UPPER_BUSINESS,
  ...UPPER_SCIENCE,
  ...UPPER_TECH,
  ...UPPER_EXAM,
  ...UPPER_SOCIAL,
  ...UPPER_TRAVEL,
  ...UPPER_MEXT_SCALE_SUPPLEMENT,
]);

export const UPPER_ENGLISH_WORD_UNIT_DATA: Record<string, GeneralProblem[]> = {
  UPPER_ENGLISH_WORDS: buildVocabularyUnit(UPPER_ALL_WORDS, '高校以上英単語総合'),
  UPPER_ENGLISH_ACADEMIC: buildVocabularyUnit(UPPER_ACADEMIC, '学術・論説英単語'),
  UPPER_ENGLISH_DAILY: buildVocabularyUnit(UPPER_DAILY, '生活実用英単語'),
  UPPER_ENGLISH_BUSINESS: buildVocabularyUnit(UPPER_BUSINESS, 'ビジネス・進路英単語'),
  UPPER_ENGLISH_SCIENCE: buildVocabularyUnit(UPPER_SCIENCE, '科学英単語'),
  UPPER_ENGLISH_TECH: buildVocabularyUnit(UPPER_TECH, 'IT・テクノロジー英単語'),
  UPPER_ENGLISH_EXAM: buildVocabularyUnit(UPPER_EXAM, '入試・論理表現英単語'),
  UPPER_ENGLISH_SOCIAL: buildVocabularyUnit(UPPER_SOCIAL, '社会・国際英単語'),
  UPPER_ENGLISH_TRAVEL: buildVocabularyUnit(UPPER_TRAVEL, '旅行・文化英単語'),
};
