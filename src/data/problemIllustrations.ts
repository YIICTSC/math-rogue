import { assetUrl } from '../utils/assetPaths';
import { GeneralProblem } from './subjects/utils';

type IllustrationRule = {
  asset: string;
  modes: RegExp;
  keywords: RegExp;
  skipAudio?: boolean;
};

export const PROBLEM_ILLUSTRATION_ASSETS = [
  { asset: 'problem-illustrations/science-butterfly.webp', label: '小3理科：チョウ・昆虫' },
  { asset: 'problem-illustrations/science-plant.webp', label: '小3理科：植物' },
  { asset: 'problem-illustrations/science-circuit.webp', label: '小3理科：電気回路' },
  { asset: 'problem-illustrations/science-human-body.webp', label: '理科：人体・骨格' },
  { asset: 'problem-illustrations/science-molecule.webp', label: '中2理科：原子・分子' },
  { asset: 'problem-illustrations/science-solar-system.webp', label: '中3理科：太陽系' },
  { asset: 'problem-illustrations/english-dog.webp', label: '小3英語：dog' },
  { asset: 'problem-illustrations/english-apple.webp', label: '小3英語：apple' },
  { asset: 'problem-illustrations/english-classroom.webp', label: '小4英語：classroom' },
  { asset: 'problem-illustrations/english-weather.webp', label: '小4英語：weather' },
] as const;

const PROBLEM_ILLUSTRATION_RULES: IllustrationRule[] = [
  {
    asset: 'problem-illustrations/science-butterfly.webp',
    modes: /^SCIENCE_3_(?:1|U02)$/,
    keywords: /チョウ|蝶|モンシロ|幼虫|よう虫|さなぎ|成虫/,
  },
  {
    asset: 'problem-illustrations/science-plant.webp',
    modes: /^SCIENCE_3_(?:1|U03)$/,
    keywords: /植物|しょくぶつ|発芽|子葉|葉|茎|くき|花|ひまわり|ホウセンカ/,
  },
  {
    asset: 'problem-illustrations/science-circuit.webp',
    modes: /^SCIENCE_3_(?:3|U08)$/,
    keywords: /豆電球|まめでんきゅう|乾電池|かんでんち|導線|どうせん|回路|かいろ|電気の通り道|電気の 通り道/,
  },
  {
    asset: 'problem-illustrations/science-human-body.webp',
    modes: /^SCIENCE_(?:4_(?:1|U02)|8_(?:2|U03))$/,
    keywords: /骨|ほね|骨格|関節|せぼね|脊椎|筋肉|腱|ひざ|ひじ|肩/,
  },
  {
    asset: 'problem-illustrations/science-molecule.webp',
    modes: /^SCIENCE_8_(?:1|U05)$/,
    keywords: /原子|分子|粒子|元素|化学式|原子核|電子/,
  },
  {
    asset: 'problem-illustrations/science-solar-system.webp',
    modes: /^SCIENCE_9_(?:3|U10|U11|U12)$/,
    keywords: /太陽系|惑星|恒星|衛星|公転|地球|太陽|水星|金星|火星|木星|土星|天王星|海王星/,
  },
  {
    asset: 'problem-illustrations/english-dog.webp',
    modes: /^ENGLISH_G3_/,
    keywords: /\b(?:dog|dogs)\b|いぬ|犬/i,
    skipAudio: true,
  },
  {
    asset: 'problem-illustrations/english-apple.webp',
    modes: /^ENGLISH_G3_/,
    keywords: /\b(?:apple|apples)\b|りんご/i,
    skipAudio: true,
  },
  {
    asset: 'problem-illustrations/english-classroom.webp',
    modes: /^ENGLISH_G4_/,
    keywords: /\bclassroom\b|教室/i,
    skipAudio: true,
  },
  {
    asset: 'problem-illustrations/english-weather.webp',
    modes: /^ENGLISH_G4_(?:1|U04)$/,
    keywords: /\b(?:sunny|cloudy|rainy)\b|はれ|くもり|あめ|天気|てんき/i,
    skipAudio: true,
  },
];

const problemSearchText = (problem: GeneralProblem): string => [
  problem.question,
  problem.answer,
  problem.hint,
  problem.unitLabel,
].filter(Boolean).join(' ');

/**
 * Adds a generated teaching illustration only when it is safe to do so.
 * Precise Canvas/SVG visuals (clock, geometry, graphs, etc.) always win.
 */
export const attachProblemIllustration = (mode: string, problem: GeneralProblem): GeneralProblem => {
  if (problem.imageUrl || problem.visual) return problem;

  const text = problemSearchText(problem);
  const rule = PROBLEM_ILLUSTRATION_RULES.find((candidate) => {
    if (!candidate.modes.test(mode) || !candidate.keywords.test(text)) return false;
    if (candidate.skipAudio && (problem.audioPrompt || problem.speechPrompt)) return false;
    return true;
  });

  return rule
    ? { ...problem, imageUrl: assetUrl(rule.asset) }
    : problem;
};
