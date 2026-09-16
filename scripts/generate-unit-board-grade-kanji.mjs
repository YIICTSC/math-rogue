import fs from 'node:fs';
import path from 'node:path';
import KuroshiroPackage from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { createServer } from 'vite';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'src/data/unitBoardGradeKanji.generated.ts');
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

const EXTRA_GRADED_MODES = [
  'ADD_1DIGIT',
  'ADD_1DIGIT_CARRY',
  'SUB_1DIGIT',
  'SUB_1DIGIT_BORROW',
  'ADDITION',
  'SUBTRACTION',
  'MULTIPLICATION',
  'DIVISION',
  'MIXED',
  'KANJI_1',
  'KANJI_2',
  'KANJI_3',
  'KANJI_4',
  'KANJI_5',
  'KANJI_6',
  'KANJI_7',
  'KANJI_8',
  'KANJI_9',
];

// Text owned by UnitBoardModal rather than an individual summary.
const STATIC_BOARD_COPY = [
  '板書',
  'ばんしょ',
  '基本',
  'めあて',
  '考える順番',
  'かんがえるじゅんばん',
  'ここに注意',
  'ここにちゅうい',
  '例題・たしかめ',
  'れいだい・たしかめ',
  '公式・きまり',
  '文の形・きまり',
  'しくみ・きまり',
  '大事なつながり',
  '読み方・書き方のコツ',
  '見つけるポイント',
  '大事なポイント',
  'たいせつなきまり',
  '問題にもどる',
  'もんだいにもどる',
  '板書を閉じる',
  '前ページ',
  '次ページ',
];

const katakanaToHiragana = (value) => value.replace(/[ァ-ヶ]/g, (char) => (
  String.fromCharCode(char.charCodeAt(0) - 0x60)
));

const Kuroshiro = KuroshiroPackage.default;
const kuroshiro = new Kuroshiro();
const analyzer = new KuromojiAnalyzer();
await kuroshiro.init(analyzer);

const globalStringsByGrade = Object.fromEntries(
  Array.from({ length: 9 }, (_, index) => [index + 1, new Set(STATIC_BOARD_COPY)]),
);
const unitRecords = new Map();
const allowedByGrade = {};
let readingCorrections = new Map();

const GENERIC_RULE_NOUNS = new Set([
  '基本', '問題', '答え', '確認', '具体例', '例', '条件', '結果', '理由', '意味', '内容', '単元',
  '順番', '根拠', '資料', '方法', '注意', '説明', '知識', '場面', '言葉', '文章', '文', '語',
  '数', '式', '形', '人', '物', 'もの', 'こと', '時', '場所', '目的', '影響', '関係', 'ポイント',
]);

const GRADE_READING_OVERRIDES = new Map([
  ['語', 'ことば'],
  ['次', 'つぎ'],
  ['前', 'まえ'],
]);

const hasKanji = (value) => /[\u3400-\u4DBF\u4E00-\u9FFF]/.test(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addGlobal = (grade, value) => {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return;
  if (typeof value === 'string' && value.trim()) globalStringsByGrade[grade].add(value);
};

const ensureUnitRecord = (mode, grade) => {
  if (!unitRecords.has(mode)) {
    unitRecords.set(mode, {
      mode,
      grade,
      strings: new Set(),
      titleSeeds: new Set(),
      contentSeeds: new Set(),
      ruleSeeds: new Set(),
      explicitTerms: new Set(),
    });
  }
  return unitRecords.get(mode);
};

const captureExplicitTerms = (record, value) => {
  if (typeof value !== 'string') return;
  for (const match of value.matchAll(/【([^】]+)】/g)) {
    const term = match[1]?.trim();
    if (term && hasKanji(term)) record.explicitTerms.add(term);
  }
  const unitList = value.match(/この単元では「([^」]+)」/);
  if (unitList?.[1]) {
    for (const term of unitList[1].split('・').map((item) => item.trim()).filter(Boolean)) {
      if (hasKanji(term)) record.explicitTerms.add(term);
    }
  }
};

const addUnit = (record, value) => {
  if (typeof value !== 'string' || !value.trim()) return;
  record.strings.add(value);
  captureExplicitTerms(record, value);
};

const addPage = (record, summary, page, buildUnitBoardTeachingContent) => {
  addUnit(record, page.label);
  addUnit(record, page.goal);
  if (typeof page.goal === 'string' && page.goal.trim()) record.contentSeeds.add(page.goal);
  for (const point of page.points ?? []) addUnit(record, point);
  for (const point of page.points ?? []) {
    if (typeof point === 'string' && point.trim()) record.contentSeeds.add(point);
  }
  for (const mistake of page.mistakes ?? []) addUnit(record, mistake);
  addUnit(record, page.example);
  addUnit(record, page.sectionLabels?.goal);
  addUnit(record, page.sectionLabels?.points);
  addUnit(record, page.sectionLabels?.mistakes);
  addUnit(record, page.sectionLabels?.example);

  const teaching = buildUnitBoardTeachingContent(summary, page);
  for (const step of teaching.thinkingSteps) addUnit(record, step);
  for (const rule of teaching.ruleLines) {
    addUnit(record, rule);
    record.ruleSeeds.add(rule);
  }
  for (const line of teaching.workedExampleSteps) addUnit(record, line);
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getUnitBoardSummary } = await server.ssrLoadModule('/src/data/unitBoardSummaries.ts');
  const { buildUnitBoardTeachingContent } = await server.ssrLoadModule('/src/data/unitBoardTeaching.ts');
  const { KANKEN_OFFICIAL_LEVEL_KANJI_SETS } = await server.ssrLoadModule('/src/data/kankenLevelKanji.ts');
  const { UNIT_BOARD_HIRAGANA_CORRECTIONS } = await server.ssrLoadModule('/src/data/unitBoardHiragana.generated.ts');
  readingCorrections = new Map(UNIT_BOARD_HIRAGANA_CORRECTIONS);

  const cumulative = new Set();
  for (let grade = 1; grade <= 9; grade += 1) {
    for (const character of KANKEN_OFFICIAL_LEVEL_KANJI_SETS[GRADE_LEVEL[grade]]) cumulative.add(character);
    allowedByGrade[grade] = new Set(cumulative);
  }

  const modes = new Set([...Object.keys(SUBJECT_DATA), ...EXTRA_GRADED_MODES]);
  for (const mode of modes) {
    const summary = getUnitBoardSummary(mode);
    const grade = summary?.grade;
    if (!summary || !Number.isInteger(grade) || grade < 1 || grade > 9) continue;
    const record = ensureUnitRecord(mode, grade);

    addUnit(record, summary.title);
    addUnit(record, summary.subtitle);
    record.titleSeeds.add(summary.title);
    addPage(record, summary, {
      id: 'main',
      label: '基本',
      goal: summary.goal,
      points: summary.points,
      mistakes: summary.mistakes,
      example: summary.example,
      sectionLabels: undefined,
    }, buildUnitBoardTeachingContent);
    for (const page of summary.pages ?? []) addPage(record, summary, page, buildUnitBoardTeachingContent);

    // A challenge can replace only the title with a problem's unitLabel.
    for (const problem of SUBJECT_DATA[mode] ?? []) {
      addUnit(record, problem?.unitLabel);
      if (typeof problem?.unitLabel === 'string' && problem.unitLabel.trim()) record.titleSeeds.add(problem.unitLabel);
    }
  }
} finally {
  await server.close();
}

const containsAboveGradeKanji = (value, allowed) => (
  (value.match(KANJI) ?? []).some((character) => !allowed.has(character))
);

const nounTermsFrom = async (value, minimumLength = 1) => {
  const terms = [];
  let nounRun = [];
  const flushNounRun = () => {
    if (nounRun.length >= 2) {
      const compound = nounRun.join('');
      if (compound.length >= minimumLength && compound.length <= 16 && hasKanji(compound)) terms.push(compound);
    }
    nounRun = [];
  };
  for (const token of await analyzer.parse(value)) {
    const surface = token?.surface_form?.trim();
    if (!surface) continue;
    if ((token?.pos === '名詞' || token?.pos === '接頭詞') && hasKanji(surface)) {
      nounRun.push(surface);
      if (token?.pos === '名詞' && surface.length >= minimumLength) terms.push(surface);
    } else {
      flushNounRun();
    }
  }
  flushNounRun();
  return terms;
};

const protectedTermsForRecord = async (record) => {
  const terms = new Set(record.explicitTerms);
  for (const explicitTerm of record.explicitTerms) {
    for (const term of await nounTermsFrom(explicitTerm)) terms.add(term);
  }
  for (const seed of record.titleSeeds) {
    if (hasKanji(seed) && seed.length <= 24) terms.add(seed);
    for (const term of await nounTermsFrom(seed)) terms.add(term);
  }
  for (const seed of record.contentSeeds) {
    for (const term of await nounTermsFrom(seed, 2)) {
      if (!GENERIC_RULE_NOUNS.has(term)) terms.add(term);
    }
  }
  for (const seed of record.ruleSeeds) {
    for (const term of await nounTermsFrom(seed, 2)) {
      if (!GENERIC_RULE_NOUNS.has(term)) terms.add(term);
    }
  }
  return [...terms].sort((a, b) => b.length - a.length || a.localeCompare(b, 'ja'));
};

const protectedRegex = (terms) => {
  const usable = terms.filter((term) => term && hasKanji(term));
  return usable.length > 0 ? new RegExp(usable.map(escapeRegex).join('|'), 'g') : null;
};

const removeProtectedTerms = (value, terms) => {
  const regex = protectedRegex(terms);
  return regex ? value.replace(regex, '') : value;
};

const convertSegment = async (source, allowed) => {
  if (!source || !containsAboveGradeKanji(source, allowed)) return source;

  const tokens = await analyzer.parse(source);
  let cursor = 0;
  let result = '';
  for (const token of tokens) {
    const surface = token?.surface_form ?? '';
    if (!surface) continue;
    const position = source.indexOf(surface, cursor);
    if (position < 0) continue;
    result += source.slice(cursor, position);

    const tokenKanji = surface.match(KANJI) ?? [];
    if (tokenKanji.some((character) => !allowed.has(character))) {
      let reading = GRADE_READING_OVERRIDES.get(surface) ?? readingCorrections.get(surface);
      if (!reading && token?.reading) reading = katakanaToHiragana(token.reading);
      if (!reading) reading = await kuroshiro.convert(surface, { to: 'hiragana', mode: 'normal' });
      result += reading;
    } else {
      result += surface;
    }
    cursor = position + surface.length;
  }
  result += source.slice(cursor);
  return result;
};

const gradeSafeText = async (source, allowed, protectedTerms = []) => {
  if (!containsAboveGradeKanji(removeProtectedTerms(source, protectedTerms), allowed)) return source;

  const regex = protectedRegex(protectedTerms);
  if (!regex) {
    const converted = await convertSegment(source, allowed);
    if (containsAboveGradeKanji(converted, allowed)) {
      throw new Error(`Could not remove above-grade kanji: ${JSON.stringify(source)} -> ${JSON.stringify(converted)}`);
    }
    return converted;
  }

  let cursor = 0;
  let result = '';
  for (const match of source.matchAll(regex)) {
    const index = match.index ?? cursor;
    result += await convertSegment(source.slice(cursor, index), allowed);
    result += match[0];
    cursor = index + match[0].length;
  }
  result += await convertSegment(source.slice(cursor), allowed);

  if (containsAboveGradeKanji(removeProtectedTerms(result, protectedTerms), allowed)) {
    throw new Error(`Could not remove above-grade kanji: ${JSON.stringify(source)} -> ${JSON.stringify(result)}`);
  }
  return result;
};

const globalMappings = {};
const unitMappings = {};
const protectedTermsByUnit = {};
let checkedStrings = 0;
let changedStrings = 0;
for (let grade = 1; grade <= 9; grade += 1) {
  const entries = [];
  for (const source of [...globalStringsByGrade[grade]].sort((a, b) => a.localeCompare(b, 'ja'))) {
    checkedStrings += 1;
    const safe = await gradeSafeText(source, allowedByGrade[grade]);
    if (safe !== source) {
      entries.push([source, safe]);
      changedStrings += 1;
    }
  }
  globalMappings[grade] = entries;
}

for (const [mode, record] of [...unitRecords.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const protectedTerms = await protectedTermsForRecord(record);
  const entries = [];
  for (const source of [...record.strings].sort((a, b) => a.localeCompare(b, 'ja'))) {
    checkedStrings += 1;
    const safe = await gradeSafeText(source, allowedByGrade[record.grade], protectedTerms);
    if (safe !== source) {
      entries.push([source, safe]);
      changedStrings += 1;
    }
  }
  unitMappings[mode] = entries;
  protectedTermsByUnit[mode] = protectedTerms;
}

const globalBlocks = Object.entries(globalMappings).map(([grade, entries]) => {
  const body = entries
    .map(([source, safe]) => `    ${JSON.stringify(source)}: ${JSON.stringify(safe)},`)
    .join('\n');
  return `  ${grade}: Object.freeze({\n${body}\n  }),`;
}).join('\n');

const unitBlocks = Object.entries(unitMappings).map(([mode, entries]) => {
  const body = entries
    .map(([source, safe]) => `    ${JSON.stringify(source)}: ${JSON.stringify(safe)},`)
    .join('\n');
  return `  ${JSON.stringify(mode)}: Object.freeze({\n${body}\n  }),`;
}).join('\n');

const protectedBlocks = Object.entries(protectedTermsByUnit)
  .map(([mode, terms]) => `  ${JSON.stringify(mode)}: Object.freeze(${JSON.stringify(terms)}),`)
  .join('\n');

const output = `// Generated by scripts/generate-unit-board-grade-kanji.mjs.\n`
  + `// Explanatory copy is limited to grade-appropriate kanji; terms taught by the unit stay in kanji.\n`
  + `export const UNIT_BOARD_GRADE_SAFE_GLOBAL: Readonly<Record<number, Readonly<Record<string, string>>>> = Object.freeze({\n${globalBlocks}\n});\n\n`
  + `export const UNIT_BOARD_GRADE_SAFE_BY_UNIT: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({\n${unitBlocks}\n});\n\n`
  + `export const UNIT_BOARD_PROTECTED_TERMS_BY_UNIT: Readonly<Record<string, readonly string[]>> = Object.freeze({\n${protectedBlocks}\n});\n\n`
  + `export const limitUnitBoardKanjiByGrade = (value: string, grade?: number, unitId?: string): string => {\n`
  + `  if (!grade || grade < 1 || grade > 9) return value;\n`
  + `  const baseUnitId = unitId?.split(':')[0] ?? '';\n`
  + `  return UNIT_BOARD_GRADE_SAFE_BY_UNIT[baseUnitId]?.[value]\n`
  + `    ?? UNIT_BOARD_GRADE_SAFE_GLOBAL[grade]?.[value]\n`
  + `    ?? value;\n`
  + `};\n`;

fs.writeFileSync(OUTPUT, output);
console.log(`Generated grade-safe board text for ${checkedStrings} strings (${changedStrings} changed; ${unitRecords.size} units) at ${path.relative(ROOT, OUTPUT)}.`);
