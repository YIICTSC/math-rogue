import type { GeneralProblem } from '../data/subjects/utils';

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function normalizeNotation(value: string): string {
  // Convert exponents before NFKC so that x² stays different from x2.
  return value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (power) =>
    '^' + Array.from(power, (char) => char === '⁻' ? '-' : char === '⁺' ? '+' : SUPERSCRIPT_DIGITS.indexOf(char)).join(''),
  )
    .normalize('NFKC')
    .trim()
    .replace(/[−‐‑‒–—―]/g, '-')
    .replace(/^ー(?=[\d.])/, '-')
    .replace(/≦|<=/g, '≤')
    .replace(/≧|>=/g, '≥')
    .replace(/×/g, '*')
    .replace(/÷|⁄/g, '/')
    .replace(/、/g, ',')
    .replace(/(\d\s*)(cm|mm|km|m)([23])(?![a-z\d])/gi, '$1$2^$3');
}

/** Decimal text stays exact even when it has more digits than a JS number can represent. */
export function normalizeSchoolNumber(value: string): string | null {
  const match = /^([+-]?)(?:(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?|\.(\d+))$/.exec(normalizeNotation(value));
  if (!match) return null;
  const whole = (match[2] ?? '0').replaceAll(',', '').replace(/^0+(?=\d)/, '');
  const fraction = (match[3] ?? match[4] ?? '').replace(/0+$/, '');
  const sign = match[1] === '-' && (whole !== '0' || fraction) ? '-' : '';
  return sign + whole + (fraction ? '.' + fraction : '');
}

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "they're": 'they are', "i've": 'i have', "we've": 'we have', "they've": 'they have',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot',
  "won't": 'will not', "wouldn't": 'would not',
};

function normalizeSchoolText(value: string): string {
  return normalizeNotation(value)
    .replace(/’/g, "'")
    .replace(/\s+/gu, ' ')
    .replace(/ *(?:[+\-*=<>≤≥≠^/,:;(){}\[\]]) */gu, (token) => token.trim())
    .replace(/(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]) \s*| (?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu, '')
    .replace(/(\d) (?=(?:km|cm|mm|m|kg|mg|g|ml|dl|l|%|°c|°)(?:\^[23])?$)/iu, '$1')
    .trim();
}

interface SchoolAnswerOptions {
  exactNotation?: boolean;
  caseSensitive?: boolean;
}

export function schoolAnswerOptions(mode: string, question: string): SchoolAnswerOptions {
  return {
    exactNotation: /文の\s*きまり|「。」|句読点|句点|くとうてん|くてん|小数.*(?:そろ|どう書)|短縮形|大文字|小文字/u.test(question),
    caseSensitive: /^(?:NATIVE_)?(?:MATH|SCIENCE)_/.test(mode) || /大文字|小文字/u.test(question),
  };
}

export function matchesSchoolAnswer(submitted: string, expected: string, options: SchoolAnswerOptions = {}): boolean {
  const number = options.exactNotation ? null : normalizeSchoolNumber(expected);
  if (number !== null) return normalizeSchoolNumber(submitted) === number;
  const text = (value: string) => {
    const normalized = normalizeSchoolText(value);
    const spelling = options.caseSensitive ? normalized : normalized.toLowerCase();
    if (options.exactNotation) return spelling;
    return spelling
      .replace(/\b[a-z]+'[a-z]+\b/g, (word) => CONTRACTIONS[word] ?? word)
      .replace(/(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[a-z]{2})[。.!?]+$/iu, '');
  };
  const correct = text(expected);
  return correct !== '' && text(submitted) === correct;
}

const spokenUnits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const spokenTens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const spokenNumbers = new RegExp(
  `\\b(?:(${spokenTens.join('|')})(?:[ -](${spokenUnits.slice(1, 10).join('|')}))?|(${spokenUnits.join('|')}))\\b`,
  'g',
);

function normalizeSpeech(value: string): string {
  return normalizeSchoolText(value).toLowerCase()
    .replace(/\b[a-z]+'[a-z]+\b/g, (word) => CONTRACTIONS[word] ?? word)
    .replace(/["“”]/g, '')
    .replace(/,(?=[a-z])/g, ' ')
    .replace(/\bo(?:'| )clock\b/g, "o'clock")
    .replace(spokenNumbers, (_, tens, unit, small) => String(small
      ? spokenUnits.indexOf(small)
      : (spokenTens.indexOf(tens) + 2) * 10 + (unit ? spokenUnits.indexOf(unit) : 0)))
    .replace(/\bhalf past ([1-9]|1[0-2])\b/g, '$1:30')
    .replace(/\b([1-9]|1[0-2]) o'clock\b/g, '$1:00')
    .replace(/\bit is ([1-9]|1[0-2]) ([0-5]\d)\b/g, 'it is $1:$2')
    .replace(/[,.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSchoolSpeech(transcript: string, prompt: NonNullable<GeneralProblem['speechPrompt']>): boolean {
  const normalized = normalizeSpeech(transcript);
  if (!normalized) return false;
  if ([prompt.expected, ...(prompt.alternates ?? [])].some(answer => normalizeSpeech(answer) === normalized)) return true;
  if (!prompt.freeResponse || !prompt.keywords?.length) return false;
  const words = ' ' + normalized + ' ';
  const hits = prompt.keywords.filter(keyword => words.includes(' ' + normalizeSpeech(keyword) + ' ')).length;
  return hits >= (prompt.minKeywordHits ?? prompt.keywords.length);
}

export function schoolQuestionPromptKey(problem: Pick<GeneralProblem, 'question' | 'passage' | 'visual' | 'audioPrompt'>): string {
  return JSON.stringify([problem.question, problem.passage, problem.visual, problem.audioPrompt?.text]);
}

export function schoolQuestionNeedsChoices(question: string): boolean {
  return /(?:次のうち|つぎのうち|次に(?:示|しめ)す|以下のうち|したのなか|選択肢|どれ(?:ですか|かな|[？?])|(?:選|えら)(?:べ|ぼう|びましょう|びなさい)|\bwhich (?:of|one)\b|\b(?:choose|pick) (?:the|a|one|from)\b)/iu.test(question);
}
