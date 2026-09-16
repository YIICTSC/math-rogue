import type { UnitBoardSummary, UnitBoardSummaryPage } from './unitBoardSummaries';

export type UnitBoardSubject = 'math' | 'english' | 'science' | 'social' | 'language' | 'life' | 'other';

export interface UnitBoardTeachingContent {
  subject: UnitBoardSubject;
  thinkingSteps: string[];
  ruleLines: string[];
  workedExampleSteps: string[];
}

type TeachingSource = Pick<UnitBoardSummaryPage, 'goal' | 'points' | 'mistakes' | 'example'>;

export const unitBoardSubjectFor = (id: string): UnitBoardSubject => {
  if (/^(MATH|ADD|SUB|MULT|DIV|MIXED|UPPER_MATH)/.test(id)) return 'math';
  if (/^(ENGLISH|UPPER_ENGLISH|NATIVE_)/.test(id)) return 'english';
  if (/^(SCIENCE|UPPER_SCIENCE)/.test(id)) return 'science';
  if (/^(SOCIAL|MAP_|PREF_|PREFECTURES|UPPER_SOCIETY)/.test(id) || /(GEOGRAPHY|HISTORY|CIVICS)/.test(id)) return 'social';
  if (/^(KOKUGO|KANJI|KANKEN|HARD_KANJI|UPPER_MODERN|UPPER_CLASSICS)/.test(id)) return 'language';
  if (/^LIFE/.test(id)) return 'life';
  return 'other';
};

const compact = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const normalizeMathNotation = (value: string) => value
  .replace(/\s+x\s+/g, ' × ')
  .replace(/\^2/g, '²')
  .replace(/(cm|mm|km|m)2\b/g, '$1²')
  .replace(/(cm|mm|km|m)3\b/g, '$1³');

const pointSource = (summary: UnitBoardSummary, page: TeachingSource) =>
  `${summary.title} ${summary.subtitle} ${page.goal} ${page.points.join(' ')}`;

const mathFormulaPattern = /(?:=|＝|\+|＋|−|-|×|÷|\bx\b|\by\b|公式|通分|約分|比例|反比例|割合|平均|速さ|面積|面せき|体積|角度|合同|相似|確率|平方根|方程式|関数|倍)/i;
const englishPattern = /(?:[A-Za-z]+|be動詞|一般動詞|動詞の原形|語順|疑問文|否定文|過去形|現在完了|関係代名詞|不定詞|動名詞|分詞|受動態|助動詞|比較|三人称|複数形|代名詞)/i;

const mathFallbackRules: Array<[RegExp, string[]]> = [
  [/平均/, ['平均 = 合計 ÷ 個数']],
  [/単位量/, ['単位量あたりの大きさ = 全体の量 ÷ いくつ分']],
  [/速さ/, ['速さ = 道のり ÷ 時間', '道のり = 速さ × 時間', '時間 = 道のり ÷ 速さ']],
  [/割合/, ['割合 = 比べる量 ÷ もとにする量', '比べる量 = もとにする量 × 割合']],
  [/円の面積|円.*面せき/, ['円の面積 = 半径 × 半径 × 3.14']],
  [/角柱.*体積|円柱.*体積/, ['体積 = 底面積 × 高さ']],
  [/直方体.*体積|体積.*直方体/, ['直方体の体積 = たて × 横 × 高さ']],
  [/分数のかけ算/, ['分子どうし、分母どうしをかける。', '計算の途中で約分できるときは先に約分する。']],
  [/分数のわり算/, ['わる数を逆数にして、かけ算に直す。']],
  [/分数のたし算|分数のひき算/, ['分母が違うときは通分し、分母をそろえてから分子を計算する。']],
  [/一次関数/, ['y = ax + b', 'a は変化の割合、b は y切片。']],
  [/比例と反比例|比例/, ['比例：y = ax', '反比例：y = a ÷ x']],
  [/一次方程式/, ['等式の両辺に同じ数を足す・引く・かける・割ると等式は保たれる。']],
  [/連立方程式/, ['2つの式を使い、2つの未知数を同時に求める。']],
  [/二次方程式/, ['ax² + bx + c = 0 の形に整理して解く。']],
  [/y=ax\^2|y=ax²|二乗に比例/, ['y = ax²']],
  [/三平方/, ['直角三角形では a² + b² = c²（c は斜辺）。']],
  [/確率/, ['確率 = 条件に合う場合の数 ÷ 全体の場合の数']],
  [/展開|因数分解/, ['展開と因数分解は逆向きの計算。']],
  [/平方根/, ['a の平方根は、2乗すると a になる数。']],
];

const englishFallbackRules: Array<[RegExp, string[]]> = [
  [/be動詞/, ['I am / you are / he・she・it is', '疑問文：be動詞 + 主語 ... ?　否定文：be動詞 + not']],
  [/一般動詞/, ['肯定文：主語 + 一般動詞 + ...', '疑問文：Do / Does + 主語 + 動詞の原形 ... ?']],
  [/疑問文/, ['be動詞は主語の前へ。一般動詞は Do / Does を文頭に置く。']],
  [/否定文/, ['be動詞の後に not。一般動詞は do not / does not + 動詞の原形。']],
  [/命令文/, ['動詞の原形から始める。否定は Don’t + 動詞の原形。']],
  [/\bcan\b/i, ['can + 動詞の原形', '疑問文：Can + 主語 + 動詞の原形 ... ?']],
  [/現在進行形/, ['be動詞 + 動詞ing']],
  [/三人称単数/, ['he / she / it などが主語の現在形では、一般動詞に s / es を付ける。', 'does を使う文では一般動詞を原形に戻す。']],
  [/過去進行形/, ['was / were + 動詞ing']],
  [/過去形/, ['過去の文では動詞を過去形にする。', '疑問・否定では did + 動詞の原形。']],
  [/未来表現/, ['will + 動詞の原形 / be going to + 動詞の原形']],
  [/助動詞/, ['助動詞 + 動詞の原形']],
  [/不定詞/, ['to + 動詞の原形']],
  [/動名詞/, ['動詞ing を「〜すること」という名詞の働きで使う。']],
  [/接続詞/, ['接続詞で、文と文の意味の関係をつなぐ。']],
  [/比較/, ['比較級 + than ... / the + 最上級 ...', 'as + 原級 + as ...']],
  [/受動態/, ['be動詞 + 過去分詞']],
  [/現在完了進行形/, ['have / has been + 動詞ing']],
  [/現在完了/, ['have / has + 過去分詞']],
  [/関係代名詞/, ['先行詞 + who / which / that + ...']],
  [/間接疑問文/, ['疑問詞 + 主語 + 動詞（肯定文の語順）']],
  [/仮定法/, ['If + 主語 + 過去形, 主語 + would + 動詞の原形 ...']],
  [/分詞/, ['現在分詞：〜している / 過去分詞：〜された・〜した状態']],
];

const firstMatchingRules = (source: string, templates: Array<[RegExp, string[]]>) => {
  for (const [pattern, rules] of templates) {
    if (pattern.test(source)) return rules;
  }
  return [];
};

const mathRules = (summary: UnitBoardSummary, page: TeachingSource) => {
  const fromPoints = page.points.filter((point) => mathFormulaPattern.test(point));
  if (fromPoints.length > 0) return compact(fromPoints).slice(0, 3);
  const fallback = firstMatchingRules(pointSource(summary, page), mathFallbackRules);
  return fallback.length > 0 ? fallback : page.points.slice(0, 2);
};

const englishRules = (summary: UnitBoardSummary, page: TeachingSource) => {
  const fallback = firstMatchingRules(pointSource(summary, page), englishFallbackRules);
  if (fallback.length > 0) return fallback;
  const fromPoints = page.points.filter((point) => englishPattern.test(point));
  return compact(fromPoints.length > 0 ? fromPoints : page.points).slice(0, 2);
};

const mathThinkingTemplates: Array<[RegExp, string[]]> = [
  [/平均/, ['全部の値を合計する。', 'データの個数を数える。0のデータも1個として数える。', '合計 ÷ 個数で平均を求め、もとの値とかけ離れていないか確かめる。']],
  [/単位量/, ['比べたい2つの量を確認する。', 'どちらの量を「1あたり」にするか決める。', '全体の量 ÷ いくつ分で1あたりを求め、同じ基準で比べる。']],
  [/速さ/, ['何を求めるか（速さ・道のり・時間）を確認する。', 'kmとm、時間と分など、単位をそろえる。', '求める量に合う公式を選び、数をあてはめて計算する。']],
  [/割合/, ['「もとにする量」と「比べる量」を問題文から見つける。', '何を求めるか（割合・比べる量・もとにする量）を決める。', '小数・百分率・歩合を必要に応じて直し、公式にあてはめる。']],
  [/分数のたし算|分数のひき算/, ['分母が同じか確認する。', '分母が違えば最小公倍数などを使って通分する。', '分子を計算し、最後に約分できるか確かめる。']],
  [/分数のかけ算/, ['帯分数は仮分数に直す。', '分子どうし・分母どうしをかける前に、約分できる組を探す。', 'かけ算をして、答えを必要なら約分・帯分数に直す。']],
  [/分数のわり算/, ['帯分数は仮分数に直す。', 'わる数の分子と分母を入れ替えて逆数にする。', 'かけ算に直して計算し、答えを約分する。']],
  [/小数のかけ算/, ['まず小数点を気にせず整数のかけ算として計算する。', 'かける数とかけられる数の小数部分の桁数を数える。', '桁数の合計だけ、答えの右から小数点を移す。']],
  [/小数のわり算/, ['わる数が整数になるまで、わる数とわられる数の小数点を同じだけ右へ動かす。', '整数のわり算と同じように計算する。', '商の小数点の位置と、あまりの表し方を確かめる。']],
  [/一次方程式の利用|連立方程式の利用|二次方程式の利用/, ['わからない量を文字で置く。', '問題文の数量関係を式にする。', '方程式を解き、得られた解が問題の条件に合うか確かめる。']],
  [/一次方程式/, ['文字を含む項と数だけの項を整理する。', '等式の性質を使って、文字の項を片方に集める。', 'x = ... の形まで解き、元の式に代入して確かめる。']],
  [/連立方程式/, ['どちらかの文字を消しやすい形にそろえる。', '加減法または代入法で1つの文字を消す。', '求めた値を元の式に代入して、もう1つの文字を求める。']],
  [/比例と反比例|一次関数|関数 y=ax\^2|関数 y=ax²/, ['表でxとyの対応を確認する。', '式の係数が何を表すかを読む。', '式・表・グラフを行き来して、変化のしかたを確かめる。']],
  [/確率/, ['起こりうるすべての場合を、表や樹形図でもれなく出す。', 'その中から条件に合う場合を数える。', '条件に合う場合の数 ÷ 全体の場合の数で確率を求める。']],
  [/場合の数/, ['何を選ぶか、順番を区別するかを確認する。', '表・樹形図・図を使って、もれや重なりなく並べる。', '同じ数え方を重ねていないか確かめて合計する。']],
  [/合同|相似/, ['対応する頂点・辺・角をそろえて見る。', '使える条件を図に書き込み、必要な辺や角を選ぶ。', '条件を順に示して、合同・相似である理由を説明する。']],
  [/三平方/, ['直角の向かい側にある斜辺を確認する。', '2つの辺の長さを a² + b² = c² に対応させる。', '平方根を使って長さを求め、正の値を答える。']],
  [/角|平面図形|三角形|四角形|円の性質/, ['図に分かっている角度や条件を書き込む。', '平行線・三角形・円など、使える性質を選ぶ。', 'どの性質を使ったかを示しながら、未知の角や長さを求める。']],
  [/面積|面せき|体積/, ['どの図形として求められるかを見分ける。', '必要な長さを図から読み、単位をそろえる。', '対応する公式に数をあてはめ、面積・体積の単位を付ける。']],
  [/表|グラフ|資料|データ|標本調査/, ['表やグラフの題名・軸・単位を先に確認する。', '比べる値や変化している部分を読み取る。', '読み取った数を根拠にして、言えることだけを答える。']],
];

const englishThinkingTemplates: Array<[RegExp, string[]]> = [
  [/be動詞/, ['まず主語が I / you / he・she・it / 複数のどれかを確認する。', '主語に合う am / are / is を選ぶ。', '疑問文ならbe動詞を前へ、否定文ならbe動詞の後に not を置く。']],
  [/一般動詞/, ['主語と「すること」を表す動詞を見つける。', '肯定文では主語の後に一般動詞を置く。', '疑問・否定では do / does を使い、一般動詞を原形にする。']],
  [/疑問文/, ['何をたずねる文かを確認する。', 'be動詞の文か、一般動詞の文かを見分ける。', 'be動詞または Do / Does を主語の前に置き、? で終える。']],
  [/否定文/, ['元の文がbe動詞か一般動詞かを見分ける。', 'be動詞なら直後に not、一般動詞なら do not / does not を使う。', 'does not の後などは一般動詞を原形に戻す。']],
  [/現在進行形|過去進行形/, ['「今・その時している途中」の動作かを確認する。', '主語と時制に合うbe動詞を選ぶ。', '動詞を ing 形にして be動詞 + 動詞ing の形にする。']],
  [/三人称単数/, ['主語が he / she / it / 1人・1つの名前か確認する。', '現在の肯定文では一般動詞に s / es を付ける。', '疑問・否定で does を使ったら、一般動詞は原形に戻す。']],
  [/過去形/, ['yesterday / last ... など過去を示す語に注目する。', '肯定文では動詞を過去形にする。', '疑問・否定では did を使い、動詞は原形に戻す。']],
  [/未来表現/, ['これからの予定・意思・予測のどれを表すか考える。', 'will または be going to を選ぶ。', 'その後には動詞の原形を置く。']],
  [/不定詞/, ['to + 動詞の原形のまとまりを見つける。', '文の中で「〜すること」「〜するために」「〜するための」のどの働きか考える。', '前後の語と結びつけて文全体の意味を確認する。']],
  [/動名詞/, ['動詞ing が名詞の働きをしている場所を見つける。', '主語・目的語など、文中での役割を確認する。', 'enjoy / finish など、後ろに動名詞を取る語とセットで覚える。']],
  [/比較/, ['2つを比べるのか、3つ以上で最も〜と言うのかを確認する。', '比較級・最上級・as ... as の形を選ぶ。', 'than / the / as など必要な語を含めて文を完成させる。']],
  [/受動態/, ['「だれがする」より「何がされる」を中心にした文か確認する。', '主語と時制に合うbe動詞を置く。', '動詞を過去分詞にして be動詞 + 過去分詞 の形にする。']],
  [/現在完了進行形/, ['過去から今まで続いている動作かを確認する。', '主語に合わせて have / has been を選ぶ。', '動詞ingを続け、for / since があれば期間・起点も確認する。']],
  [/現在完了/, ['経験・継続・完了のどの用法かを文脈から考える。', '主語に合わせて have / has を選ぶ。', '動詞を過去分詞にし、ever / since / already などの語も手がかりにする。']],
  [/関係代名詞/, ['説明したい名詞（先行詞）を見つける。', '人なら who、物なら which、どちらにも that が使える場合がある。', '関係代名詞から後ろを、先行詞を説明するまとまりとして読む。']],
  [/間接疑問文/, ['文の中に入る疑問詞を見つける。', '疑問詞の後ろは疑問文の語順ではなく、主語 + 動詞の語順にする。', '文全体の時制や意味が自然か確かめる。']],
  [/仮定法/, ['現実とは違う仮定・願いを表しているか確認する。', 'if節では過去形を使う。', '主節では would + 動詞の原形を使い、現実との違いを読む。']],
  [/長文読解/, ['先に設問を見て、何を探しながら読むか決める。', '各段落の中心文と接続語に印を付ける。', '指示語・理由・対比を本文の根拠に戻って確かめる。']],
  [/英作文/, ['日本語で伝えたい内容を短い意味のまとまりに分ける。', '主語と動詞を先に決め、時制・単数複数をそろえる。', '無理に長文にせず、正しい短文をつないで見直す。']],
  [/スピーチ/, ['最初に伝えたい結論・テーマを決める。', '理由や具体例を順序よく並べる。', 'つなぎ言葉を使い、声・間・視線も意識して伝える。']],
  [/リスニング/, ['先に選択肢や問いを見て、聞き取る内容を決める。', '数字・時刻・場所・疑問詞など、答えにつながる語を拾う。', '全部を訳そうとせず、聞こえた根拠から答えを選ぶ。']],
  [/発声|復唱/, ['文を意味のまとまりで短く区切る。', '強く読む語・リズム・語尾を聞いてまねる。', '一度に全部言えなくても、まとまりをつないで最後まで言う。']],
  [/応答/, ['最初の疑問詞や助動詞を聞いて、何を聞かれているか判断する。', 'Yes / No、場所、時刻、理由など答えの型を選ぶ。', '聞かれた内容に合う短い文で答える。']],
];

const chooseThinkingSteps = (summary: UnitBoardSummary, page: TeachingSource, subject: UnitBoardSubject) => {
  if ((summary.grade ?? 99) <= 2) return page.points;
  const source = pointSource(summary, page);
  if (subject === 'math') {
    const matched = firstMatchingRules(source, mathThinkingTemplates);
    if (matched.length > 0) return matched;
  }
  if (subject === 'english') {
    const matched = firstMatchingRules(source, englishThinkingTemplates);
    if (matched.length > 0) return matched;
  }
  if (subject === 'science' && page.points.length >= 3) {
    return [
      `何を調べる単元か確認する。めあて：${page.goal}`,
      `観察・実験では、結果につながる条件を見る。ポイント：${page.points[0]}`,
      `結果をしくみと結びつける。${page.points[1]} → ${page.points[2]}`,
    ];
  }
  if (subject === 'social' && page.points.length >= 3) {
    const isHistory = /時代|歴史|文明|古代|中世|近世|近代|維新|世界大戦|戦争|縄文|弥生|古墳|奈良|平安|鎌倉|室町|江戸|明治|大正|昭和/.test(source);
    return isHistory
      ? [
        `時代・地域・中心となる出来事を押さえる。中心事項：${page.points[0]}`,
        `なぜその変化が起きたか、背景をつなげる。手がかり：${page.points[1]}`,
        `その後の社会への影響まで整理する。結果・影響：${page.points[2]}`,
      ]
      : [
        `場所・制度・資料など、何についての話かを押さえる。中心事項：${page.points[0]}`,
        `その理由やしくみを考える。手がかり：${page.points[1]}`,
        `人々のくらしや社会への影響までつなげる。結果・影響：${page.points[2]}`,
      ];
  }
  if (subject === 'language' && page.points.length >= 3) {
    const title = summary.title;
    const isWriting = /書く|作文|意見文|報告文|提案文|論説文|日記|手紙|卒業文集|卒業論文|文をかく/.test(title);
    const isSpeaking = /話す|話し合い|討論|発表|スピーチ|聞く|はなす|はなしをきく/.test(title);
    const isReading = /読む|読み|物語|説明文|詩|短歌|俳句|古文|漢文|要約|要旨|おはなし|せつめいぶん/.test(title);
    if (isWriting) {
      return [
        `だれに何を伝える文章か決める。ポイント：${page.points[0]}`,
        `材料を順番に並べ、段落や文の役割を考える。組み立て：${page.points[1]}`,
        `書いた後に、伝わり方や表記を見直す。確認：${page.points[2]}`,
      ];
    }
    if (isSpeaking) {
      return [
        `何を伝えるか、聞き取るかを先に決める。ポイント：${page.points[0]}`,
        `相手や目的に合わせて順序を整える。組み立て：${page.points[1]}`,
        `相手の反応や根拠を確かめながら伝える。確認：${page.points[2]}`,
      ];
    }
    if (isReading) {
      return [
        `題名・問いを先に見て、何を読み取るか決める。`,
        `本文ではここに注目する。ポイント：${page.points[0]} / ${page.points[1]}`,
        `答えは本文の言葉を根拠にしてまとめる。確認：${page.points[2]}`,
      ];
    }
  }
  return page.points;
};

const splitSentences = (value?: string) => {
  if (!value) return [];
  return (value.match(/[^。！？!?]+[。！？!?]?/g) ?? [value]).map((part) => part.trim()).filter(Boolean);
};

const mathWorkedExample = (summary: UnitBoardSummary, page: TeachingSource, rules: string[]) => {
  if (!page.example) return [];
  const normalized = page.example.replace(/[。．.]$/, '').trim();
  if ((summary.grade ?? 99) <= 2) {
    return compact([
      `れい：${page.example}`,
      rules[0] ? `つかうきまり：${rules[0]}` : '',
      'こたえが もんだいに あっているか たしかめる。',
    ]);
  }
  if (/速さ/.test(pointSource(summary, page))) {
    const match = normalized.match(/([\d.]+)\s*km.*?([\d.]+)\s*時間.*?時速\s*([\d.]+)\s*km/);
    if (match) {
      return [
        `わかっている数：道のり ${match[1]}km、時間 ${match[2]}時間`,
        `式：${match[1]} ÷ ${match[2]} = ${match[3]}`,
        `答え：時速 ${match[3]}km`,
      ];
    }
  }
  if (/平均/.test(pointSource(summary, page))) {
    const match = normalized.match(/^([\d.]+)、([\d.]+)、([\d.]+)の平均は([\d.]+)/);
    if (match) {
      const values = match.slice(1, 4).map(Number);
      const total = values.reduce((sum, value) => sum + value, 0);
      return [
        `合計：${values.join(' + ')} = ${total}`,
        `個数：${values.length}個`,
        `平均：${total} ÷ ${values.length} = ${match[4]}`,
      ];
    }
  }
  if (/単位量/.test(pointSource(summary, page))) {
    const match = normalized.match(/([\d.]+)個で([\d.]+)円.*?1個([\d.]+)円/);
    if (match) {
      return [
        `全体：${match[1]}個で ${match[2]}円`,
        `1個あたり：${match[2]} ÷ ${match[1]} = ${match[3]}`,
        `答え：1個 ${match[3]}円`,
      ];
    }
  }
  if (/三平方/.test(pointSource(summary, page))) {
    const match = normalized.match(/([\d.]+)、([\d.]+)、([\d.]+)は直角三角形/);
    if (match) {
      const [a, b, c] = match.slice(1, 4);
      return [
        `短い2辺：${a}, ${b}　斜辺：${c}`,
        `確認：${a}² + ${b}² = ${c}²`,
        `左辺と右辺が等しい → 直角三角形になる。`,
      ];
    }
  }
  const equationParts = normalized.split(/\s*[=＝]\s*/).map((part) => part.trim()).filter(Boolean);
  if (equationParts.length >= 2) {
    return equationParts.map((part, index) => {
      if (index === 0) return `式・はじめ：${part}`;
      if (index === equationParts.length - 1) return `答え：${part}`;
      return `途中：${part}`;
    });
  }
  return compact([
    `例題：${page.example}`,
    rules[0] ? `使うきまり：${rules[0]}` : '',
    `確認：答えが「${page.goal}」というめあてに合っているか確かめる。`,
  ]);
};

const englishWorkedExample = (summary: UnitBoardSummary, page: TeachingSource, rules: string[]) => {
  if (!page.example) return [];
  const source = pointSource(summary, page);
  if (/リスニング/.test(source)) {
    return compact([
      `聞き取り例：${page.example}`,
      rules[0] ? `聞くポイント：${rules[0]}` : '',
      '全部を訳さず、質問に必要な語を聞き取れたか確かめる。',
    ]);
  }
  if (/発声|復唱/.test(source)) {
    return compact([
      `声に出す例：${page.example}`,
      rules[0] ? `音のポイント：${rules[0]}` : '',
      '強く読む語・リズム・語尾をまねて、まとまりで言う。',
    ]);
  }
  if (/応答/.test(source)) {
    return compact([
      `会話例：${page.example}`,
      rules[0] ? `答え方の型：${rules[0]}` : '',
      '何を聞かれたかに合う短い答えになっているか確かめる。',
    ]);
  }
  const isGrammar = /be動詞|一般動詞|疑問文|否定文|命令文|\bcan\b|進行形|三人称|過去形|未来表現|助動詞|不定詞|動名詞|接続詞|比較|受動態|現在完了|関係代名詞|間接疑問文|仮定法|分詞|長文読解|英作文|スピーチ/i.test(source);
  if (!isGrammar) {
    return compact([
      `例：${page.example}`,
      rules[0] ? `覚える形・ことば：${rules[0]}` : '',
      '英語の音・意味・場面をセットにして確かめる。',
    ]);
  }
  return compact([
    `例文：${page.example}`,
    rules[0] ? `文の形：${rules[0]}` : '',
    '確認：主語・動詞・時制（いつのことか）が合っているかを見る。',
  ]);
};

const subjectWorkedExample = (summary: UnitBoardSummary, page: TeachingSource, subject: UnitBoardSubject, rules: string[]) => {
  if (!page.example) return [];
  const example = splitSentences(page.example).join(' ');
  const firstRule = rules[0];
  if (subject === 'science') {
    return compact([`具体例：${example}`, firstRule ? `結びつける知識：${firstRule}` : '', '観察・実験の事実と、なぜそうなるかを分けて説明する。']);
  }
  if (subject === 'social') {
    return compact([`具体例：${example}`, firstRule ? `結びつける知識：${firstRule}` : '', '人物・用語だけで終わらず、背景と結果・影響までつなげる。']);
  }
  if (subject === 'language') {
    const title = summary.title;
    const isWriting = /書く|作文|意見文|報告文|提案文|論説文|日記|手紙|卒業文集|卒業論文|文をかく/.test(title);
    const isSpeaking = /話す|話し合い|討論|発表|スピーチ|聞く|はなす|はなしをきく/.test(title);
    const isReading = /読む|読み|物語|説明文|詩|短歌|俳句|古文|漢文|要約|要旨|おはなし|せつめいぶん/.test(title);
    if (isWriting) return compact([`書き方の例：${example}`, firstRule ? `組み立てのポイント：${firstRule}` : '', '書いた後は、内容の順序・言葉・表記を読み返して直す。']);
    if (isSpeaking) return compact([`伝え方の例：${example}`, firstRule ? `伝えるポイント：${firstRule}` : '', '聞き手に伝わる順序・声・根拠になっているか確かめる。']);
    if (isReading) return compact([`具体例：${example}`, firstRule ? `見るポイント：${firstRule}` : '', '答えは本文の言葉や表現に戻って、根拠を確かめる。']);
    return compact([`具体例：${example}`, firstRule ? `きまり・手がかり：${firstRule}` : '', '同じきまりを別の語や文でも使えるか確かめる。']);
  }
  if (subject === 'life') {
    return compact([`たとえば：${example}`, firstRule ? `みるところ：${firstRule}` : '', 'みつけたことを、ことば・え・うごきでたしかめる。']);
  }
  return splitSentences(page.example);
};

export const buildUnitBoardTeachingContent = (
  summary: UnitBoardSummary,
  page: TeachingSource,
): UnitBoardTeachingContent => {
  const subject = unitBoardSubjectFor(summary.id);
  const ruleLines = (() => {
    if (subject === 'math') return mathRules(summary, page).map(normalizeMathNotation);
    if (subject === 'english') return englishRules(summary, page);
    return page.points.slice(0, 2);
  })();
  const thinkingSteps = compact(chooseThinkingSteps(summary, page, subject)).map((step) => subject === 'math' ? normalizeMathNotation(step) : step);
  const closingStep: Record<UnitBoardSubject, string> = {
    math: '答えをもとの条件に当てはめ、単位や符号まで確かめる。',
    english: '同じ文の形で語を入れ替えて、意味と語順を確かめる。',
    science: '観察・実験の結果と、単元のしくみを結びつけて説明する。',
    social: '資料・時代・地域などの根拠に戻って、説明がつながるか確かめる。',
    language: '本文や語句に戻り、答えの根拠になる言葉を確かめる。',
    life: 'みつけたことを、ことば・え・うごきでふりかえる。',
    other: 'もとの条件に戻って、答えや説明が合っているか確かめる。',
  };
  const workedExampleSteps = subject === 'math'
    ? mathWorkedExample(summary, page, ruleLines).map(normalizeMathNotation)
    : subject === 'english'
      ? englishWorkedExample(summary, page, ruleLines)
      : subjectWorkedExample(summary, page, subject, ruleLines);

  return {
    subject,
    thinkingSteps: thinkingSteps.length >= 3
      ? thinkingSteps
      : compact([...thinkingSteps, ...page.points, page.goal, closingStep[subject]]).slice(0, 3),
    ruleLines: compact(ruleLines).slice(0, 3),
    workedExampleSteps,
  };
};
