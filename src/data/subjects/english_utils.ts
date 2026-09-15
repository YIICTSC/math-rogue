import { GeneralProblem, d } from './utils';

export interface EnglishWordItem {
  en: string;
  jp: string;
  /** 問題文だけで意味を区別したい場合の表示用ラベル。正解値や音声は en/jp を使う。 */
  promptEn?: string;
  promptJp?: string;
  hint?: string;
  choiceGroup?: string;
  speech?: string;
  speechAlternates?: string[];
  exampleEn?: string;
  exampleJp?: string;
  allowAutoExample?: boolean;
}

export interface EnglishResponseItem {
  promptEn: string;
  promptJp: string;
  answerEn: string;
  answerJp: string;
  promptSpeech?: string;
  answerSpeech?: string;
  answerSpeechAlternates?: string[];
}

export const cycleProblems = (problems: GeneralProblem[]) => {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = JSON.stringify({
      question: problem.question,
      answer: problem.answer,
      options: problem.options,
      audio: problem.audioPrompt?.text,
      speech: problem.speechPrompt?.expected,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const englishProblemSignature = (problem: GeneralProblem) => JSON.stringify({
  question: problem.question,
  answer: problem.answer,
  options: problem.options,
  audio: problem.audioPrompt?.text,
  speech: problem.speechPrompt?.expected,
});

/**
 * 文法単元の問題数を、同一問題のコピーではなく生成問題で補う。
 * makeProblem は n に応じて主語・語彙・文型を変え、同じ表示問題を返さないことを前提にする。
 */
export const fillEnglishGeneratedUnitProblems = (
  unitData: Record<string, GeneralProblem[]>,
  makeProblem: (unitId: string, n: number) => GeneralProblem | null,
  options: { min?: number; maxAttempts?: number } = {},
): void => {
  const min = options.min ?? 36;
  const maxAttempts = options.maxAttempts ?? 180;
  Object.keys(unitData).forEach((unitId) => {
    const problems = unitData[unitId];
    const seen = new Set(problems.map(englishProblemSignature));
    for (let n = 0; problems.length < min && n < maxAttempts; n += 1) {
      const problem = makeProblem(unitId, n);
      if (!problem) break;
      const signature = englishProblemSignature(problem);
      if (seen.has(signature)) continue;
      seen.add(signature);
      problems.push(problem);
    }
  });
};

export const uniqueEnglishWordItems = (items: EnglishWordItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.en}__${item.jp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const pickDistinct = (pool: string[], answer: string, start: number, count: number) => {
  const uniques = Array.from(new Set(pool.filter((item) => item !== answer)));
  if (uniques.length === 0) return [];
  const picked: string[] = [];
  for (let i = 0; picked.length < count && i < uniques.length * 2; i += 1) {
    const candidate = uniques[(start + i) % uniques.length];
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked;
};

export const buildWordUnit = (
  items: EnglishWordItem[],
  options: { enableListening?: boolean; enableSpeaking?: boolean; listeningPrompt?: string; speakingPrompt?: string; enableSentenceExamples?: boolean } = {},
): GeneralProblem[] => {
  const enableListening = options.enableListening !== false;
  const enableSpeaking = options.enableSpeaking === true;
  const enableSentenceExamples = options.enableSentenceExamples !== false;
  const poolFor = (item: EnglishWordItem) => {
    if (!item.choiceGroup) return items;
    const grouped = items.filter((candidate) => candidate.choiceGroup === item.choiceGroup);
    return grouped.length >= 4 ? grouped : items;
  };
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  const problems: GeneralProblem[] = [];
  const buildExampleSentence = (item: EnglishWordItem) => {
    if (item.allowAutoExample === false) return null;
    if (item.exampleEn && item.exampleJp) return { en: item.exampleEn, jp: item.exampleJp };
    const trimmed = item.en.replace(/[.!?]/g, '');
    if (/^(hello|good morning|goodbye|thank you|see you|nice to meet you|good afternoon|good night|see you tomorrow|you are welcome)$/i.test(trimmed)) {
      const withName = /^(hello|good morning|good afternoon)$/i.test(trimmed);
      return { en: withName ? `${trimmed}, Ken.` : `${trimmed}.`, jp: `${item.jp} という あいさつです。` };
    }
    if (/^\d+$/.test(item.jp)) {
      const bookNoun = item.jp === '1' ? 'book' : 'books';
      return { en: `I have ${trimmed} ${bookNoun}.`, jp: `わたしは ${item.jp}さつの 本を もっています。` };
    }
    if (trimmed.includes("o'clock") || trimmed.includes('half past') || trimmed.startsWith('It is ')) {
      return { en: trimmed.startsWith('It is ') ? trimmed : `It is ${trimmed}.`, jp: `${item.jp} を あらわす 文。` };
    }
    if (/^(happy|sad|sleepy|hungry|fine|tired|angry|great|hot|cold|warm|cool|sunny|cloudy|rainy|snowy|windy)$/i.test(trimmed)) {
      return { en: `I am ${trimmed}.`, jp: `わたしは ${item.jp}です。` };
    }
    if (/^(get up|eat breakfast|go to school|study|play|go to bed|brush my teeth|do homework)$/i.test(trimmed)) {
      return { en: `I ${trimmed} every day.`, jp: `わたしは 毎日 ${item.jp}。` };
    }
    if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(trimmed)) {
      return { en: `Today is ${trimmed}.`, jp: `きょうは ${item.jp}です。` };
    }
    if (/^(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(trimmed)) {
      return { en: `My birthday is in ${trimmed}.`, jp: `わたしの たんじょうびは ${item.jp}です。` };
    }
    if (/^(father|mother|brother|sister|grandfather|grandmother|family|friend)$/i.test(trimmed)) {
      return { en: `This is my ${trimmed}.`, jp: `こちらは わたしの ${item.jp}です。` };
    }
    if (/^(red|blue|yellow|green|black|white|pink|orange|brown|purple)$/i.test(trimmed) && /^(赤|青|黄色|緑|黒|白|ピンク|オレンジ|茶色|むらさき)$/.test(item.jp)) {
      return { en: `This is ${trimmed}.`, jp: `これは ${item.jp}です。` };
    }
    if (/^(English|Japanese|math|science|music|art|P E|PE)$/i.test(trimmed)) {
      return { en: `I study ${trimmed.replace(/^P E$/i, 'P.E.')}.`, jp: `わたしは ${item.jp}を べんきょうします。` };
    }
    if (/^(I|You|He|She|It|We|They|My|This|These|That|Those|What|How|Where|When|Who|Whose|Which|Do|Does|Did|Can|Could|Are|Is|Am|Please|Let|Go|Turn|Stand|Sit|Open|Close|Give|Take|Touch|Kimono|Origami|Tea|Cherry)$/i.test(trimmed.split(/\s+/)[0])) {
      return null;
    }
    if (trimmed.includes(' ')) {
      return null;
    }
    if (/^[a-z][a-z ]+$/i.test(trimmed) && !trimmed.includes('I ') && !trimmed.includes('My ') && !trimmed.includes('This ') && !trimmed.includes('We ')) {
      if (/^(milk|rice|juice|water|bread|tea|music|soccer|baseball|basketball|tennis|sushi|curry|ramen|salad|spaghetti)$/i.test(trimmed)) {
        return { en: `I like ${trimmed}.`, jp: `わたしは ${item.jp}が すきです。` };
      }
      const article = /^[aeiou]/i.test(trimmed) ? 'an' : 'a';
      return { en: `This is ${article} ${trimmed}.`, jp: `これは ${item.jp}です。` };
    }
    return null;
  };

  items.forEach((item, index) => {
    const itemPool = poolFor(item);
    const jpPool = itemPool.filter((candidate) => candidate.en !== item.en).map((candidate) => candidate.jp);
    const enPool = itemPool.filter((candidate) => candidate.jp !== item.jp).map((candidate) => candidate.en);
    const displayEn = item.promptEn || item.en;
    const displayJp = item.promptJp || item.jp;
    problems.push({
        question: `「${displayEn}」は 日本語で なんという？`,
        answer: item.jp,
        options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 1, 3)),
        hint: item.hint || '英語の意味を考えよう。',
      });
    problems.push({
        question: `「${displayJp}」は 英語で なんという？`,
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 2, 3)),
        hint: item.hint || '英語を選ぼう。',
      });
    if (enableListening) {
      problems.push({
        question: options.listeningPrompt || 'おとを きいて、あてはまる 英語を えらぼう。',
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
        hint: '発音を聞き取ろう。',
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      });
      problems.push({
        question: 'おとを きいて、あてはまる 日本語を えらぼう。',
        answer: item.jp,
        options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 4, 3)),
        hint: '英語の音から意味を考える。',
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      });
    }
    if (enableSpeaking) {
      problems.push({
        question: options.speakingPrompt || `「${displayJp}」を 英語で いってみよう。`,
        answer: item.en,
        options: d(item.en, ...pickDistinct(enPool, item.en, index + 5, 3)),
        hint: 'マイク対応ブラウザなら発話判定もできる。',
        speechPrompt: { expected: item.speech || item.en, alternates: makeSpeechAlternates(item), lang: 'en-US', buttonLabel: 'えいごで はなす' },
        audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
      });
    }
    if (enableSentenceExamples) {
      const example = buildExampleSentence(item);
      if (example) {
        problems.push({
          question: `つぎの文の「${displayEn}」は 日本語で なんという？\n${example.en}`,
          answer: item.jp,
          options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 6, 3)),
          hint: '文の中の英語と日本語を結びつけよう。',
          audioPrompt: { text: example.en, lang: 'en-US', autoPlay: false },
        });
      }
    }
  });
  return problems;
};

export const buildFixedChoiceUnit = (
  items: EnglishWordItem[],
  unitTitle: string,
): GeneralProblem[] => {
  if (items.length === 0) return [];
  const fixed: GeneralProblem[] = [];

  items.forEach((item, index) => {
    const displayEn = item.promptEn || item.en;
    const displayJp = item.promptJp || item.jp;
    const safeJpPool = items.filter((candidate) => candidate.en !== item.en).map((candidate) => candidate.jp);
    const safeEnPool = items.filter((candidate) => candidate.jp !== item.jp).map((candidate) => candidate.en);
    fixed.push({
      question: `「${displayEn}」の意味として正しいものを1つ選ぼう。`,
      answer: item.jp,
      options: d(item.jp, ...pickDistinct(safeJpPool, item.jp, index + 1, 3)),
      hint: '単語の意味を確認しよう。',
    });
    fixed.push({
      question: `「${displayJp}」を英語で表すとどれ？`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(safeEnPool, item.en, index + 2, 3)),
      hint: '英語表現を選ぼう。',
    });
  });

  // 同じ設問を50問まで複製せず、各語につき別形式を1問だけ追加する。
  items.forEach((item, index) => {
    const displayJp = item.promptJp || item.jp;
    const safeEnPool = items.filter((candidate) => candidate.jp !== item.jp).map((candidate) => candidate.en);
    fixed.push({
      question: `${displayJp} に当てはまる英語は？`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(safeEnPool, item.en, index + 3, 3)),
      hint: '4つの選択肢から選ぼう。',
    });
  });

  return fixed;
};

export const buildListeningReviewUnit = (items: EnglishWordItem[], promptText = '学年の ことばを きいて、あてはまる 英語を えらぼう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const jpPool = items.map((item) => item.jp);
  return cycleProblems(items.flatMap((item, index) => {
    const sameSoundMeanings = new Set(
      items.filter((candidate) => candidate.en === item.en).map((candidate) => candidate.jp),
    );
    const problems: GeneralProblem[] = [{
      question: promptText,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 1, 3)),
      hint: '学年でならった表現を聞き取ろう。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    }];
    // 同じ音・表記に複数の日本語訳がある語（orange / library など）は、
    // 音声だけでは意味を一意に決められないため日本語選択問題を作らない。
    if (sameSoundMeanings.size === 1) problems.push({
      question: '学年の ことばを きいて、あてはまる 日本語を えらぼう。',
      answer: item.jp,
      options: d(item.jp, ...pickDistinct(jpPool, item.jp, index + 2, 3)),
      hint: '意味までセットで思い出そう。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    });
    return problems;
  }));
};

export const buildSpeakingReviewUnit = (items: EnglishWordItem[], promptText = '学年の ことばを 英語で いってみよう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  return cycleProblems(items.flatMap((item, index) => ([
    {
      question: `${promptText}\n「${item.promptJp || item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
      hint: 'マイクで発音して確認。',
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'えいごで はなす',
      },
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
    },
    {
      question: `おとを きいて、同じ 英語を いってみよう。\n「${item.promptJp || item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 5, 3)),
      hint: '音を聞いてから、同じ表現を発音する。',
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'きいて はなす',
      },
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    },
  ])));
};

export const buildRepeatReviewUnit = (items: EnglishWordItem[], promptText = 'おとを きいて、そのまま 英語で くりかえそう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.en);
  const makeSpeechAlternates = (item: EnglishWordItem) => {
    const base = item.speech || item.en;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      base,
      ...(item.speechAlternates || []),
    ]));
  };

  return cycleProblems(items.flatMap((item, index) => ([
    {
      question: `${promptText}\n「${item.promptJp || item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 1, 3)),
      hint: '聞いた 英語を そのまま くりかえす。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'くりかえす',
      },
    },
    {
      question: 'おとを きいて、同じ 英語を えらぼう。',
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 2, 3)),
      hint: '聞こえた 英語の ならびを たしかめる。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: true },
    },
    {
      question: `つぎの 日本語を 英語で くりかえそう。\n「${item.promptJp || item.jp}」`,
      answer: item.en,
      options: d(item.en, ...pickDistinct(enPool, item.en, index + 3, 3)),
      hint: '例の音を まねして はっきり言う。',
      audioPrompt: { text: item.speech || item.en, lang: 'en-US', autoPlay: false },
      speechPrompt: {
        expected: item.speech || item.en,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: '英語を くりかえす',
      },
    },
  ])));
};

export const buildResponseReviewUnit = (items: EnglishResponseItem[], promptText = '聞かれたことに 英語で こたえよう。'): GeneralProblem[] => {
  const enPool = items.map((item) => item.answerEn);
  const jpPool = items.map((item) => item.answerJp);
  const makeSpeechAlternates = (item: EnglishResponseItem) => {
    const base = item.answerSpeech || item.answerEn;
    const normalized = base.replace(/[.!?]/g, '');
    return Array.from(new Set([
      normalized,
      normalized.toLowerCase(),
      item.answerEn,
      ...(item.answerSpeechAlternates || []),
    ]));
  };

  return cycleProblems(items.flatMap((item, index) => ([
    {
      question: `${promptText}\n${item.promptEn}`,
      answer: item.answerEn,
      options: d(item.answerEn, ...pickDistinct(enPool, item.answerEn, index + 1, 3)),
      hint: '質問や 呼びかけに 合う 返事を えらぶ。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: true },
    },
    {
      question: `「${item.promptJp}」への へんじとして 合う 日本語は？`,
      answer: item.answerJp,
      options: d(item.answerJp, ...pickDistinct(jpPool, item.answerJp, index + 2, 3)),
      hint: '返事の いみも あわせて おぼえる。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: false },
    },
    {
      question: `${item.promptEn}\nえいごで こたえよう。`,
      answer: item.answerEn,
      options: d(item.answerEn, ...pickDistinct(enPool, item.answerEn, index + 3, 3)),
      hint: 'みじかく はっきり へんじする。',
      audioPrompt: { text: item.promptSpeech || item.promptEn, lang: 'en-US', autoPlay: false },
      speechPrompt: {
        expected: item.answerSpeech || item.answerEn,
        alternates: makeSpeechAlternates(item),
        lang: 'en-US',
        buttonLabel: 'へんじを はなす',
      },
    },
  ])));
};

export const prompt = (
  question: string,
  answer: string,
  others: string[],
  hint?: string,
  extras: Partial<GeneralProblem> = {},
): GeneralProblem => ({
  question,
  answer,
  options: d(answer, ...others.filter((item) => item !== answer).slice(0, 3)),
  hint,
  ...extras,
});
