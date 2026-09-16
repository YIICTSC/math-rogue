import fs from 'node:fs';
import path from 'node:path';
import KuroshiroPackage from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { createServer } from 'vite';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'src/data/unitBoardHiragana.generated.ts');
const JAPANESE_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff々〆ヵヶ]/;
const KANJI = /[\u3400-\u9fff々〆ヵヶ]/;

// Curriculum terms whose reading is ambiguous to a general-purpose tokenizer.
// Replacing the term before Kuroshiro runs keeps the generated board reading
// deterministic without weakening the global hiragana translator.
const BOARD_READING_PARTIALS = [
  ['くり上がり', 'くりあがり'],
  ['くり上げる', 'くりあげる'],
  ['くり下がり', 'くりさがり'],
  ['くり下げる', 'くりさげる'],
  ['上方置換', 'じょうほうちかん'],
  ['下方置換', 'かほうちかん'],
  ['水上置換', 'すいじょうちかん'],
  ['口分田', 'くぶんでん'],
  ['割る', 'わる'],
];

const KNOWN_MALFORMED_BOARD_READINGS = [
  ['くりうえあがり', 'くりあがり'],
  ['くりうえがり', 'くりあがり'],
  ['くりうえげる', 'くりあげる'],
];

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
  '1 / 1ページ',
  'くり上がり',
  'くり上げる',
  'くり下がり',
  'くり下げる',
];

const katakanaToHiragana = (value) => value.replace(/[ァ-ヶ]/g, (char) => (
  String.fromCharCode(char.charCodeAt(0) - 0x60)
));

const strings = new Set(STATIC_BOARD_COPY);
let translateHiragana = null;
const add = (value) => {
  if (typeof value === 'string' && value.trim()) strings.add(value);
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getUnitBoardSummary } = await server.ssrLoadModule('/src/data/unitBoardSummaries.ts');
  const { buildUnitBoardTeachingContent } = await server.ssrLoadModule('/src/data/unitBoardTeaching.ts');
  const { trans } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  translateHiragana = (value) => trans(value, 'HIRAGANA');

  for (const [mode, problems] of Object.entries(SUBJECT_DATA)) {
    for (const problem of problems ?? []) add(problem?.unitLabel);

    const summary = getUnitBoardSummary(mode);
    if (!summary) continue;

    add(summary.title);
    const pages = [
      {
        id: 'main',
        label: '基本',
        goal: summary.goal,
        points: summary.points,
        mistakes: summary.mistakes,
        example: summary.example,
        sectionLabels: undefined,
      },
      ...(summary.pages ?? []),
    ];

    for (const page of pages) {
      add(page.label);
      add(page.goal);
      for (const point of page.points ?? []) add(point);
      for (const mistake of page.mistakes ?? []) add(mistake);
      add(page.example);
      add(page.sectionLabels?.goal);
      add(page.sectionLabels?.points);
      add(page.sectionLabels?.mistakes);
      add(page.sectionLabels?.example);

      const teaching = buildUnitBoardTeachingContent(summary, page);
      for (const step of teaching.thinkingSteps) add(step);
      for (const rule of teaching.ruleLines) add(rule);
      for (const line of teaching.workedExampleSteps) add(line);
    }
  }
} finally {
  await server.close();
}

const Kuroshiro = KuroshiroPackage.default;
const kuroshiro = new Kuroshiro();
const analyzer = new KuromojiAnalyzer();
await kuroshiro.init(analyzer);

const readingSets = new Map();
for (const source of [...strings].sort((a, b) => a.localeCompare(b, 'ja'))) {
  if (!JAPANESE_SCRIPT.test(source)) continue;
  for (const token of await analyzer.parse(source)) {
    const surface = token?.surface_form;
    if (!surface || !KANJI.test(surface) || !token?.reading) continue;
    const reading = katakanaToHiragana(token.reading);
    const readings = readingSets.get(surface) ?? new Set();
    readings.add(reading);
    readingSets.set(surface, readings);
  }
}

const correctionMap = new Map();
const addCorrection = (source, reading) => {
  if (!source || !reading || source === reading) return;
  correctionMap.set(source, reading);
};

for (const [surface, readings] of readingSets) {
  // Single kanji are intentionally excluded. They are highly context-dependent
  // (上 can be うえ / じょう, 日 can be ひ / にち, etc.) and were the source of
  // the broken board readings we are protecting against.
  if (surface.length <= 1 || readings.size !== 1) continue;
  const reading = [...readings][0];
  const malformed = translateHiragana?.(surface);
  if (!malformed || malformed === surface || malformed === reading) continue;
  addCorrection(surface, reading);
}

// Explicit curriculum readings must win over the tokenizer's generic reading.
for (const [source, reading] of BOARD_READING_PARTIALS) addCorrection(source, reading);
for (const [source, reading] of KNOWN_MALFORMED_BOARD_READINGS) addCorrection(source, reading);

const correctionEntries = [...correctionMap.entries()]
  .sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0], 'ja'));
const correctionBody = correctionEntries
  .map(([source, reading]) => `  [${JSON.stringify(source)}, ${JSON.stringify(reading)}],`)
  .join('\n');
const output = `// Generated by scripts/generate-unit-board-hiragana.mjs.\n`
  + `// These are corrections only: ordinary board copy keeps its curated grade-level kanji.\n`
  + `export const UNIT_BOARD_HIRAGANA_CORRECTIONS: ReadonlyArray<readonly [string, string]> = Object.freeze([\n${correctionBody}\n]);\n\n`
  + `export const normalizeUnitBoardHiragana = (value: string): string => {\n`
  + `  let result = value;\n`
  + `  for (const [source, reading] of UNIT_BOARD_HIRAGANA_CORRECTIONS) {\n`
  + `    if (result.includes(source)) result = result.replaceAll(source, reading);\n`
  + `  }\n`
  + `  return result;\n`
  + `};\n\n`
  + `export const repairUnitBoardHiraganaArtifacts = (value: string): string => {\n`
  + `  let result = value;\n`
  + `  const repairs: ReadonlyArray<readonly [string, string]> = ${JSON.stringify(KNOWN_MALFORMED_BOARD_READINGS)};\n`
  + `  for (const [source, reading] of repairs) {\n`
  + `    if (result.includes(source)) result = result.replaceAll(source, reading);\n`
  + `  }\n`
  + `  return result;\n`
  + `};\n`;

fs.writeFileSync(OUTPUT, output);
console.log(`Generated ${correctionEntries.length} unit-board hiragana reading corrections at ${path.relative(ROOT, OUTPUT)}.`);
