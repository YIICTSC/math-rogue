import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temporary = await mkdtemp(join(tmpdir(), 'school-questions-'));
const bundle = join(temporary, 'questions.mjs');
const { SUBJECT_DATA, ENGLISH_DATA, GameMode, arithmeticPool, buildLesson, matchesSchoolAnswer, matchesSchoolSpeech, normalizeSchoolNumber, schoolAnswerOptions, schoolQuestionPromptKey } = await (async () => {
  try {
    await build({
      stdin: {
        contents: [
          "export { SUBJECT_DATA } from './src/data/subjectData';",
          "export { ENGLISH_DATA } from './src/data/englishData';",
          "export { GameMode } from './src/types';",
          "export * from './src/utils/schoolAnswer';",
          "export { arithmeticPool } from './src/mini-games/gakuro-kart/arithmetic';",
          "export { buildLesson } from './src/mini-games/gakuro-kart/questions';",
        ].join('\n'),
        resolveDir: process.cwd(),
      },
      define: { 'import.meta.env': '{}' },
      bundle: true, outfile: bundle, platform: 'node', format: 'esm',
    });
    return await import(pathToFileURL(bundle).href);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
})();

const rejects = [
  ['5', '-5'], ['−12', '12'], ['3.5', '-3.5'], ['18', '1.8'], ['1.5dL', '15dL'],
  ['(2, 1)', '(1, 2)'], ['(4, -5)', '(4, 5)'], ['-8 > -3', '-8 < -3'],
  ['1, 2, 3', '3, 2, 1'], ['4, 8, 12', '4812'], ['1,2', '12'], ['1 2', '12'],
  ['x2', 'x²'], ['-2^2', '(-2)^2'], ['5', '5!'], ['730', '7:30'], ['0x10', '16'],
  ['9007199254740993', '9007199254740992'], ['I like cats.', 'I do not like cats.'],
];
for (const [input, answer] of rejects) assert.equal(matchesSchoolAnswer(input, answer), false, input + ' must differ from ' + answer);
const accepts = [
  ['－３．５０', '-3.5'], ['−５', '-5'], ['＋００５', '5'], ['１２，３４５', '12345'],
  ['（１、２）', '(1, 2)'], ['－８ ＜ －３', '-8 < -3'], ['x^2', 'x²'], ['１２ｃｍ³', '12cm3'],
  ["I’m ready", 'I am ready.'], ['ＡＰＰＬＥ', 'apple'], ['り ん ご', 'りんご'],
];
for (const [input, answer] of accepts) assert(matchesSchoolAnswer(input, answer), input + ' must match ' + answer);
assert(!matchesSchoolAnswer('AA', 'aa', schoolAnswerOptions('SCIENCE_9_U02', '劣性の形質の遺伝子型は？')));
assert(!matchesSchoolAnswer('ねこがねます', 'ねこがねます。', schoolAnswerOptions('KOKUGO_G1_U11', 'おわりに「。」をつけた文は？')));
assert(!matchesSchoolAnswer('0.7', '0.70', schoolAnswerOptions('MATH_G4_U07', '小数の筆算で位をそろえると？')));
assert(matchesSchoolSpeech('It is 11:45.', { expected: 'It is eleven forty-five' }));
assert(!matchesSchoolSpeech('one two', { expected: 'twelve' }));
assert(!matchesSchoolSpeech('twenty twenty', { expected: 'forty' }));
assert(!matchesSchoolSpeech('I have -5 books.', { expected: 'I have five books.' }));
assert(!matchesSchoolSpeech('I am 5', { expected: 'I am fifteen' }));
assert(!matchesSchoolSpeech('Thanksgiving and listening', { expected: 'Thank you for listening.', freeResponse: true, keywords: ['thank', 'listening'] }));

const schoolMode = /^(?:(?:(?:MATH|KOKUGO|KANJI|LIFE|SCIENCE|SOCIAL|ENGLISH)|NATIVE_(?:MATH|ELA|SCIENCE|SOCIAL|JAPANESE))_G[1-9](?:_|$)|(?:LIFE|SCIENCE|SOCIAL|KANJI)_[1-9](?:_|$)|ENGLISH_(?:ES|J[1-3]|CONV_[1-5])$|MAP_|PREF_|PREFECTURES_|IT_)/;
const banks = Object.entries({ ...SUBJECT_DATA, ...ENGLISH_DATA }).filter(([mode]) => schoolMode.test(mode));
const problemsByMode = new Map(banks);
for (const mode of Object.values(GameMode).filter(mode => schoolMode.test(mode))) {
  assert(problemsByMode.get(mode)?.length, 'Missing school problems for ' + mode);
}

const numberToken = '[+-]?(?:\\d+(?:\\.\\d+)?|\\d+/\\d+)';
const operand = '(?:' + numberToken + '|\\(\\s*' + numberToken + '\\s*\\))';
const equation = new RegExp('^\\s*(' + operand + ')\\s*([+\\-×÷])\\s*(' + operand + ')\\s*=\\s*\\?$', 'u');
const comparison = new RegExp('^(' + numberToken + ')\\s*と\\s*(' + numberToken + ')\\s*(?:を比べて|では)?[、,。]?\\s*(?:どちらが)?(大きい|小さい|おおきい|ちいさい)(?:数は|のは(?:どちら)?)?\\?$', 'u');
const statistics = /(?:^|。)\s*(-?\d+(?:\.\d+)?(?:\s*[,、]\s*-?\d+(?:\.\d+)?)+)\s*の\s*(平均値?|中央値|範囲|最大値|最小値)(?:\([^)]*\))?\s*は\?$/u;

function valueOf(operandText) {
  const s = operandText.replace(/[()\s]/g, '');
  if (/^[+-]?\d+\/[1-9]\d*$/.test(s)) {
    const [numerator, denominator] = s.split('/').map(Number);
    return numerator / denominator;
  }
  const number = normalizeSchoolNumber(s);
  return number === null ? NaN : Number(number);
}

function independentValue(question) {
  const clean = question.normalize('NFKC').replace(/[−]/g, '-').replace(/[「」]/g, '');
  const calculation = equation.exec(clean);
  if (calculation) {
    const [, first, operator, second] = calculation;
    const a = valueOf(first), b = valueOf(second);
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
    }
  }
  const ordering = comparison.exec(clean);
  if (ordering) return /大きい|おおきい/.test(ordering[3])
    ? Math.max(valueOf(ordering[1]), valueOf(ordering[2]))
    : Math.min(valueOf(ordering[1]), valueOf(ordering[2]));
  const data = statistics.exec(clean);
  if (data) {
    const values = data[1].split(/[,、]/).map(Number).sort((a, b) => a - b);
    const low = values[0], high = values.at(-1);
    switch (data[2]) {
      case '平均':
      case '平均値': return values.reduce((total, value) => total + value, 0) / values.length;
      case '中央値': return (values[Math.floor((values.length - 1) / 2)] + values[Math.floor(values.length / 2)]) / 2;
      case '範囲': return high - low;
      case '最大値': return high;
      case '最小値': return low;
    }
  }
  return NaN;
}

let total = 0, recomputed = 0;
const failures = [];
for (const [mode, problems] of banks) {
  assert(problems.length, mode + ' is empty');
  const choicesSeen = new Map();
  for (const problem of problems) {
    total++;
    const { question, answer, options } = problem;
    const [correct, ...distractors] = options;
    const rules = schoolAnswerOptions(mode, question);
    const label = mode + ' ' + question;
    if (!question.trim() || !answer.trim() || options.some(option => !option.trim()) || options.length !== 4 || new Set(options).size !== options.length) failures.push('Missing or duplicate content ' + label);
    if (/^(?:きみ|君|あなた)の\s*(?:答え|こたえ)$/.test(answer)) failures.push('Subjective response graded ' + label);
    const conflict = distractors.find(option => matchesSchoolAnswer(option, correct, rules) || matchesSchoolAnswer(option, answer, rules));
    if (conflict) failures.push('Two answers grade as correct ' + label + ' [' + correct + ' | ' + conflict + ']');
    if (problem.speechPrompt && !problem.speechPrompt.freeResponse) {
      const spokenConflict = distractors.find(option => matchesSchoolSpeech(option, problem.speechPrompt));
      if (spokenConflict) failures.push('Speech accepts a distractor ' + label + ' [' + spokenConflict + ']');
    }
    const key = JSON.stringify([schoolQuestionPromptKey(problem), options.slice().sort()]);
    const prior = choicesSeen.get(key);
    if (prior !== undefined && prior !== correct) failures.push('Conflicting answer keys for identical choices ' + label);
    choicesSeen.set(key, correct);

    if (/^(?:NATIVE_)?MATH_/.test(mode)) {
      const expected = independentValue(question);
      const correctValue = valueOf(correct);
      if (Number.isFinite(expected) && Number.isFinite(correctValue)) {
        recomputed++;
        if (Math.abs(correctValue - expected) > 1e-10) failures.push('Independent arithmetic disagrees ' + label + ' [' + correct + ' -> ' + expected + ']');
        if (distractors.some(option => Math.abs(valueOf(option) - expected) < 1e-10)) failures.push('Equivalent numerical choice ' + label);
      }
    }
  }

  for (const distributed of buildLesson({ mode }).questions) {
    const answer = distributed.options[distributed.correct];
    const questions = [distributed.question];
    if (/^KANJI_[1-9]$/.test(mode)) questions.push(`「${distributed.question}」の読みは？`);
    if (!problems.some(problem => questions.includes(problem.question) && problem.options[0].trim() === answer)) {
      failures.push('Mini-game answer key changed during import ' + mode + ' ' + distributed.question);
    }
  }
}

for (const mode of [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION, GameMode.MIXED, GameMode.ADD_1DIGIT, GameMode.ADD_1DIGIT_CARRY, GameMode.SUB_1DIGIT, GameMode.SUB_1DIGIT_BORROW]) {
  const filters = mode === GameMode.DIVISION ? [null, { kind: 'division', values: ['remainder_with'] }] : [null];
  for (const filter of filters) {
    for (const problem of arithmeticPool(mode, filter)) {
      assert(problem.options.includes(problem.answer) && new Set(problem.options).size === 4);
      const expected = independentValue(problem.question);
      assert(Number.isFinite(expected));
      if (filter) {
        const [numerator, denominator] = problem.question.match(/\d+/g).map(Number);
        assert.equal(problem.answer, Math.floor(expected));
        assert.equal(problem.remainder, numerator % denominator);
        assert(problem.remainder > 0 && problem.remainder < denominator);
      } else {
        assert.equal(problem.answer, expected);
      }
      if (mode === GameMode.SUB_1DIGIT_BORROW) {
        const [first, second] = problem.question.match(/\d+/g).map(Number);
        assert(first >= 10 && first % 10 < second && problem.answer < 10, problem.question);
      }
    }
  }
}
assert(failures.length === 0, failures.length + ' school audit issues\n' + failures.slice(0, 34).join('\n'));
console.log('PASS ' + banks.length + ' school question pools, ' + total + ' graded rows, ' + recomputed + ' independently recomputed calculations/comparisons and every lesson import.');
console.log('PASS sign, decimal point, brackets, order, notation, full-width input, case and generated arithmetic regressions.');
