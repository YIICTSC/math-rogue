import { createServer } from 'vite';

const SCHOOL_UNIT_MODE = /^(?:(?:MATH|KOKUGO|ENGLISH)_G\d+|(?:SCIENCE|SOCIAL|LIFE)_\d+)_U\d+$/;
const KANJI = /[\u3400-\u4DBF\u4E00-\u9FFF]/g;
const GRADE_LEVEL = {
  1: 'KANKEN_10',
  2: 'KANKEN_9',
  3: 'KANKEN_8',
  4: 'KANKEN_7',
  5: 'KANKEN_6',
  6: 'KANKEN_5',
  7: 'KANKEN_4',
  8: 'KANKEN_3',
  9: 'KANKEN_PRE2',
};
const failures = [];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getUnitBoardSummary } = await server.ssrLoadModule('/src/data/unitBoardSummaries.ts');
  const { buildUnitBoardTeachingContent } = await server.ssrLoadModule('/src/data/unitBoardTeaching.ts');
  const {
    limitUnitBoardKanjiByGrade,
    UNIT_BOARD_PROTECTED_TERMS_BY_UNIT,
  } = await server.ssrLoadModule('/src/data/unitBoardGradeKanji.generated.ts');
  const { normalizeUnitBoardHiragana, UNIT_BOARD_HIRAGANA_CORRECTIONS } = await server.ssrLoadModule('/src/data/unitBoardHiragana.generated.ts');
  const { KANKEN_OFFICIAL_LEVEL_KANJI_SETS } = await server.ssrLoadModule('/src/data/kankenLevelKanji.ts');
  const { trans } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const modes = Object.keys(SUBJECT_DATA).filter((mode) => SCHOOL_UNIT_MODE.test(mode)).sort();
  const subjectCounts = {};
  const correctedTerms = new Set();
  const allowedKanjiByGrade = {};
  let checkedHiraganaStrings = 0;
  let checkedGradeStrings = 0;

  const cumulativeKanji = new Set();
  for (let grade = 1; grade <= 9; grade += 1) {
    for (const character of KANKEN_OFFICIAL_LEVEL_KANJI_SETS[GRADE_LEVEL[grade]]) cumulativeKanji.add(character);
    allowedKanjiByGrade[grade] = new Set(cumulativeKanji);
  }

  const inspectGradeKanji = (mode, grade, location, value) => {
    if (typeof value !== 'string' || !value.trim() || !Number.isInteger(grade) || grade < 1 || grade > 9) return;
    checkedGradeStrings += 1;
    const localized = limitUnitBoardKanjiByGrade(value, grade, mode);
    const baseMode = mode.split(':')[0];
    const protectedTerms = [...(UNIT_BOARD_PROTECTED_TERMS_BY_UNIT[baseMode] ?? [])]
      .sort((a, b) => b.length - a.length);
    let ordinaryCopy = localized;
    for (const term of protectedTerms) ordinaryCopy = ordinaryCopy.replaceAll(term, '');
    const invalid = Array.from(new Set(ordinaryCopy.match(KANJI) ?? []))
      .filter((character) => !allowedKanjiByGrade[grade].has(character));
    if (invalid.length > 0) {
      failures.push(`${mode}/${location}: above-grade kanji remain outside unit terms [${invalid.join('')}] (${localized})`);
    }
  };

  const inspectHiragana = (mode, location, value) => {
    if (typeof value !== 'string' || !value.trim()) return;
    checkedHiraganaStrings += 1;
    const normalized = trans(normalizeUnitBoardHiragana(value), 'HIRAGANA');
    for (const [source] of UNIT_BOARD_HIRAGANA_CORRECTIONS) {
      if (value.includes(source)) correctedTerms.add(source);
    }
    if (/くりうえ(?:あ)?がり|くりうえげる/.test(normalized)) {
      failures.push(`${mode}/${location}: malformed carry reading remains (${normalized})`);
    }
  };

  for (const mode of modes) {
    const summary = getUnitBoardSummary(mode);
    if (!summary) {
      failures.push(`${mode}: board summary is missing`);
      continue;
    }
    if (summary.id !== mode) failures.push(`${mode}: generic board fallback is being used (${summary.id})`);
    if (!summary.title?.trim()) failures.push(`${mode}: title is empty`);
    if (!summary.goal?.trim()) failures.push(`${mode}: goal is empty`);
    if (!Array.isArray(summary.points) || summary.points.length < 3) failures.push(`${mode}: fewer than 3 thinking points`);
    if (!Array.isArray(summary.mistakes) || summary.mistakes.length < 1) failures.push(`${mode}: no caution point`);
    if (!summary.example?.trim()) failures.push(`${mode}: worked example is missing`);

    const mainPage = {
      goal: summary.goal,
      points: summary.points,
      mistakes: summary.mistakes,
      example: summary.example,
    };
    const teaching = buildUnitBoardTeachingContent(summary, mainPage);
    subjectCounts[teaching.subject] = (subjectCounts[teaching.subject] ?? 0) + 1;
    if (teaching.thinkingSteps.length < 3) failures.push(`${mode}: teacher-board thinking flow has fewer than 3 steps`);
    if (teaching.ruleLines.length < 1) failures.push(`${mode}: teacher-board rule box is empty`);
    if (teaching.workedExampleSteps.length < 2) failures.push(`${mode}: teacher-board worked example has fewer than 2 steps`);
    const mainDisplayStrings = [
      ['board-label', summary.grade && summary.grade <= 2 ? 'ばんしょ' : '板書'],
      ['main-label', '基本'],
      ['goal-label', 'めあて'],
      ['thinking-label', summary.grade && summary.grade <= 1 ? 'かんがえるじゅんばん' : '考える順番'],
      ['mistakes-label', summary.grade && summary.grade <= 2 ? 'ここにちゅうい' : 'ここに注意'],
      ['example-label', summary.grade && summary.grade <= 2 ? 'れいだい・たしかめ' : '例題・たしかめ'],
      ['close-label', summary.grade && summary.grade <= 2 ? 'もんだいにもどる' : '問題にもどる'],
      ['close-aria', '板書を閉じる'],
      ['title', summary.title],
      ['subtitle', summary.subtitle],
      ['goal', summary.goal],
      ...summary.points.map((value, index) => [`point-${index + 1}`, value]),
      ...summary.mistakes.map((value, index) => [`mistake-${index + 1}`, value]),
      ['example', summary.example],
      ...teaching.thinkingSteps.map((value, index) => [`thinking-${index + 1}`, value]),
      ...teaching.ruleLines.map((value, index) => [`rule-${index + 1}`, value]),
      ...teaching.workedExampleSteps.map((value, index) => [`worked-${index + 1}`, value]),
    ];
    mainDisplayStrings.forEach(([location, value]) => {
      inspectHiragana(mode, location, value);
      inspectGradeKanji(mode, summary.grade, location, value);
    });

    const ruleLabel = (() => {
      if (summary.grade && summary.grade <= 1) return 'たいせつなきまり';
      switch (teaching.subject) {
        case 'math': return '公式・きまり';
        case 'english': return '文の形・きまり';
        case 'science': return 'しくみ・きまり';
        case 'social': return '大事なつながり';
        case 'language': return '読み方・書き方のコツ';
        case 'life': return '見つけるポイント';
        default: return '大事なポイント';
      }
    })();
    inspectGradeKanji(mode, summary.grade, 'rule-label', ruleLabel);

    for (const unitLabel of new Set((SUBJECT_DATA[mode] ?? []).map((problem) => problem?.unitLabel).filter(Boolean))) {
      inspectGradeKanji(mode, summary.grade, 'unit-label', unitLabel);
    }

    for (const page of summary.pages ?? []) {
      const pageTeaching = buildUnitBoardTeachingContent(summary, page);
      if (pageTeaching.thinkingSteps.length < 3) failures.push(`${mode}/${page.id}: thinking flow has fewer than 3 steps`);
      if (pageTeaching.ruleLines.length < 1) failures.push(`${mode}/${page.id}: rule box is empty`);
      const pageDisplayStrings = [
        ['label', page.label],
        ['goal', page.goal],
        ...page.points.map((value, index) => [`point-${index + 1}`, value]),
        ...page.mistakes.map((value, index) => [`mistake-${index + 1}`, value]),
        ['example', page.example],
        ['section-goal', page.sectionLabels?.goal],
        ['section-points', page.sectionLabels?.points],
        ['section-mistakes', page.sectionLabels?.mistakes],
        ['section-example', page.sectionLabels?.example],
        ...pageTeaching.thinkingSteps.map((value, index) => [`thinking-${index + 1}`, value]),
        ...pageTeaching.ruleLines.map((value, index) => [`rule-${index + 1}`, value]),
        ...pageTeaching.workedExampleSteps.map((value, index) => [`worked-${index + 1}`, value]),
      ];
      pageDisplayStrings.forEach(([location, value]) => {
        inspectHiragana(mode, `${page.id}-${location}`, value);
        inspectGradeKanji(mode, summary.grade, `${page.id}-${location}`, value);
      });
    }
  }

  const readingRegressions = [
    ['くり上がり', 'くりあがり'],
    ['くり上げる', 'くりあげる'],
    ['くり下がり', 'くりさがり'],
    ['くり下げる', 'くりさげる'],
    ['くりうえあがり', 'くりあがり'],
    ['最上級', 'さいじょうきゅう'],
    ['上昇', 'じょうしょう'],
    ['温度', 'おんど'],
    ['分かる', 'わかる'],
    ['持ち上げる', 'もちあげる'],
    ['読み上げる', 'よみあげる'],
    ['上方置換', 'じょうほうちかん'],
    ['水上置換', 'すいじょうちかん'],
  ];
  for (const [source, expected] of readingRegressions) {
    const actual = trans(normalizeUnitBoardHiragana(source), 'HIRAGANA');
    if (actual !== expected) failures.push(`hiragana regression: ${source} => ${actual} (expected ${expected})`);
  }

  const gradeKanjiRegressions = [
    {
      mode: 'ADD_1DIGIT_CARRY',
      grade: 1,
      source: 'しきのこたえがもんだいのばめんと合っているか見なおす。',
      mustInclude: ['あっている'],
      mustExclude: ['合っている'],
    },
    {
      mode: 'KOKUGO_G2_U02',
      grade: 2,
      source: '文の中の主語と述語を見つける。',
      mustInclude: ['主語', '述語'],
      mustExclude: [],
    },
    {
      mode: 'MATH_G7_U03',
      grade: 7,
      source: '負の数が偶数個なら正、奇数個なら負。',
      mustInclude: ['偶数', '奇数'],
      mustExclude: [],
    },
    {
      mode: 'KOKUGO_G8_U03',
      grade: 8,
      source: '詩は比喩、反復、倒置に注目する。',
      mustInclude: ['比喩'],
      mustExclude: [],
    },
    {
      mode: 'SOCIAL_6_U05',
      grade: 6,
      source: '【元寇】元が二度にわたり日本へ攻めてきたできごと。',
      mustInclude: ['元寇'],
      mustExclude: [],
    },
    {
      mode: 'SOCIAL_6_U05',
      grade: 6,
      source: '御恩と奉公の関係を見る。',
      mustInclude: ['御恩と奉公'],
      mustExclude: ['お恩'],
    },
  ];
  for (const regression of gradeKanjiRegressions) {
    const actual = limitUnitBoardKanjiByGrade(regression.source, regression.grade, regression.mode);
    for (const expected of regression.mustInclude) {
      if (!actual.includes(expected)) {
        failures.push(`grade-kanji regression: ${regression.mode} lost unit term ${expected} (${actual})`);
      }
    }
    for (const forbidden of regression.mustExclude) {
      if (actual.includes(forbidden)) {
        failures.push(`grade-kanji regression: ${regression.mode} kept forbidden explanatory form ${forbidden} (${actual})`);
      }
    }
  }

  console.log(`UNIT_BOARD_SCHOOL_UNITS ${modes.length}`);
  console.log(`UNIT_BOARD_SUBJECT_COUNTS ${JSON.stringify(subjectCounts)}`);
  console.log(`UNIT_BOARD_HIRAGANA_STRINGS ${checkedHiraganaStrings}`);
  console.log(`UNIT_BOARD_HIRAGANA_CORRECTED_TERMS ${correctedTerms.size}`);
  console.log(`UNIT_BOARD_GRADE_KANJI_STRINGS ${checkedGradeStrings}`);
  console.log(`UNIT_BOARD_FAILURES ${failures.length}`);
  if (failures.length > 0) console.error(failures.join('\n'));
} finally {
  await server.close();
}

if (failures.length > 0) process.exit(1);
