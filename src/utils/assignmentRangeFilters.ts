import type { AssignmentRangeFilter, AssignmentUnit } from '../types';
import type { GeneralProblem } from '../data/subjectData';
import type { KanjiProblem } from '../data/kanjiData';

type FilterableProblem = Pick<GeneralProblem, 'question' | 'answer' | 'options' | 'visual' | 'audioPrompt'>;

export const assignmentFilterForMode = (units: AssignmentUnit[] | undefined, mode: string): AssignmentRangeFilter | null =>
  units?.find((unit) => unit.id === mode || unit.modes.includes(mode))?.filters || null;

const expression = (text: string) => {
  const match = text.replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*([+＋\-−×xX*÷/])\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return { left: Number(match[1]), operator: match[2], right: Number(match[3]) };
};

const decimalPlaces = (value: string) => {
  const decimals = value.match(/-?\d+\.(\d+)/g) || [];
  return Math.max(0, ...decimals.map((item) => item.split('.')[1]?.length || 0));
};

const fractionParts = (problem: FilterableProblem) => {
  if (problem.visual?.kind === 'fraction') return [{ numerator: problem.visual.numerator, denominator: problem.visual.denominator }];
  if (problem.visual?.kind === 'fraction_operation') return [
    { numerator: problem.visual.left.n, denominator: problem.visual.left.d },
    { numerator: problem.visual.right.n, denominator: problem.visual.right.d },
  ];
  return Array.from(`${problem.question} ${problem.answer}`.matchAll(/(\d+)\s*[/／]\s*(\d+)/g)).map((match) => ({ numerator: Number(match[1]), denominator: Number(match[2]) }));
};

const PREFECTURE_REGIONS: Record<string, string> = {
  北海道: '北海道', 青森県: '東北', 岩手県: '東北', 宮城県: '東北', 秋田県: '東北', 山形県: '東北', 福島県: '東北',
  茨城県: '関東', 栃木県: '関東', 群馬県: '関東', 埼玉県: '関東', 千葉県: '関東', 東京都: '関東', 神奈川県: '関東',
  新潟県: '中部', 富山県: '中部', 石川県: '中部', 福井県: '中部', 山梨県: '中部', 長野県: '中部', 岐阜県: '中部', 静岡県: '中部', 愛知県: '中部',
  三重県: '近畿', 滋賀県: '近畿', 京都府: '近畿', 大阪府: '近畿', 兵庫県: '近畿', 奈良県: '近畿', 和歌山県: '近畿',
  鳥取県: '中国', 島根県: '中国', 岡山県: '中国', 広島県: '中国', 山口県: '中国',
  徳島県: '四国', 香川県: '四国', 愛媛県: '四国', 高知県: '四国',
  福岡県: '九州・沖縄', 佐賀県: '九州・沖縄', 長崎県: '九州・沖縄', 熊本県: '九州・沖縄', 大分県: '九州・沖縄', 宮崎県: '九州・沖縄', 鹿児島県: '九州・沖縄', 沖縄県: '九州・沖縄',
};

const historyCategory = (text: string) => {
  if (/天皇|将軍|人物|だれ|誰|氏|皇子|上皇|大名|総理|首相|幕府を開|卑弥呼|聖徳|中大兄|藤原|平清盛|源頼朝|北条|足利|織田|豊臣|徳川|西郷|大久保|伊藤|板垣|福沢|坂本|ペリー/.test(text)) return 'people';
  if (/文化|仏像|寺|文学|作品|くらし|暮らし|建築|絵|宗教|農具|土器/.test(text)) return 'culture';
  return 'events';
};

export const matchesAssignmentRangeFilter = (problem: FilterableProblem, filter: AssignmentRangeFilter | null | undefined) => {
  if (!filter || filter.values.length === 0) return true;
  const values = new Set(filter.values);
  const text = `${problem.question} ${problem.answer} ${(problem.options || []).join(' ')}`;
  const expr = expression(problem.question);

  if (filter.kind === 'multiplication_table') return Boolean(expr && /[×xX*]/.test(expr.operator) && values.has(String(expr.left)));
  if (filter.kind === 'division') {
    if (!expr || !/[÷/]/.test(expr.operator) || expr.right === 0) return false;
    if (values.has('divisor_2_5')) return expr.right >= 2 && expr.right <= 5;
    if (values.has('divisor_6_9')) return expr.right >= 6 && expr.right <= 9;
    if (values.has('remainder_none')) return expr.left % expr.right === 0;
    if (values.has('remainder_with')) return expr.left % expr.right !== 0;
  }
  if (filter.kind === 'addition_subtraction') {
    if (!expr || !/[+＋\-−]/.test(expr.operator)) return false;
    const isAdd = /[+＋]/.test(expr.operator);
    const result = isAdd ? expr.left + expr.right : expr.left - expr.right;
    if (values.has('within_10')) return result >= 0 && result <= 10;
    if (values.has('within_20')) return result >= 0 && result <= 20;
    if (values.has('two_digit')) return Math.abs(expr.left) >= 10 && Math.abs(expr.left) <= 99 && Math.abs(expr.right) >= 10 && Math.abs(expr.right) <= 99;
    const carryBorrow = isAdd ? Math.abs(expr.left % 10) + Math.abs(expr.right % 10) >= 10 : Math.abs(expr.left % 10) < Math.abs(expr.right % 10);
    if (values.has('carry_borrow')) return carryBorrow;
    if (values.has('no_carry_borrow')) return !carryBorrow;
  }
  if (filter.kind === 'time') {
    const minute = problem.visual?.kind === 'clock' ? problem.visual.minute : Number(text.match(/(\d+)分/)?.[1] || 0);
    if (values.has('exact_hour')) return minute === 0 && !/あと|まえ|後|前|経過|時間/.test(text);
    if (values.has('half_hour')) return [0, 30].includes(minute) && !/あと|まえ|後|前|経過/.test(text);
    if (values.has('five_minutes')) return minute % 5 === 0 && !/あと|まえ|後|前|経過/.test(text);
    if (values.has('elapsed')) return /あと|まえ|後|前|経過|何分|時間/.test(text);
  }
  if (filter.kind === 'decimal') {
    const places = decimalPlaces(text);
    if (values.has('tenths')) return places === 1;
    if (values.has('hundredths')) return places > 0 && places <= 2;
    if (values.has('add_sub')) return Boolean(expr && /[+＋\-−]/.test(expr.operator));
    if (values.has('mul_div')) return Boolean(expr && /[×xX*÷/]/.test(expr.operator));
  }
  if (filter.kind === 'fraction') {
    const parts = fractionParts(problem);
    if (values.has('denominator_2_5')) return parts.length > 0 && parts.every((part) => part.denominator >= 2 && part.denominator <= 5);
    if (values.has('same_denominator')) return parts.length >= 2 && parts.every((part) => part.denominator === parts[0].denominator);
    if (values.has('add_sub')) return /[+＋\-−]|たし算|ひき算/.test(text);
    if (values.has('mul_div')) return /[×xX*÷]|かけ算|わり算/.test(text);
  }
  if (filter.kind === 'english_words') {
    const answer = problem.options?.[0] || problem.answer;
    const questionHasLatin = /[A-Za-z]/.test(problem.question);
    const answerHasLatin = /[A-Za-z]/.test(answer || '');
    if (values.has('english_to_japanese')) return questionHasLatin && !answerHasLatin;
    if (values.has('japanese_to_english')) return !questionHasLatin && answerHasLatin;
    if (values.has('listening')) return Boolean(problem.audioPrompt);
    if (values.has('reading')) return !problem.audioPrompt;
  }
  if (filter.kind === 'prefectures') {
    const answer = problem.options?.[0] || problem.answer;
    const prefecture = Object.keys(PREFECTURE_REGIONS).find((name) => String(answer).includes(name));
    return Boolean(prefecture && values.has(PREFECTURE_REGIONS[prefecture]));
  }
  if (filter.kind === 'history') return values.has(historyCategory(text));
  return true;
};

export const matchesKanjiAssignmentRangeFilter = (problem: KanjiProblem, filter: AssignmentRangeFilter | null | undefined) => {
  if (!filter || filter.kind !== 'kanji' || filter.values.length === 0) return true;
  const text = `${problem.question} ${problem.hint || ''}`;
  // 管理ポータルの漢字指定は、選択した漢字を values にそのまま格納する。
  // 旧仕様の出題種別（reading / writing など）も引き続き解釈する。
  const legacyKinds = new Set(['reading', 'writing', 'meaning', 'idiom']);
  const selectedCharacters = filter.values.filter((value) => (
    !legacyKinds.has(value) && Array.from(value).some((character) => /[一-龯々]/.test(character))
  ));
  if (selectedCharacters.length > 0) {
    return selectedCharacters.some((character) => problem.question.includes(character));
  }
  if (filter.values.includes('reading')) return /読み|よみ|なんと|何と読む|ふりがな/.test(text);
  if (filter.values.includes('writing')) return /漢字|かんじ|書|どの字/.test(text) && !/意味/.test(text);
  if (filter.values.includes('meaning')) return /意味|使い分け|使い方|文に合う/.test(text);
  if (filter.values.includes('idiom')) return /熟語|四字|ことわざ|慣用/.test(text);
  return true;
};
