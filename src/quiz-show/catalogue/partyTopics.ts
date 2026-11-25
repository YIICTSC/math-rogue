import type { LanguageMode } from '../../types';
import { QUIZ_AUDIENCES, supportsLearningUnits, type RecommendedAudience, type ShowMode, type ShowQuestion } from '../types';
import subjects from './subjects.json';
import drawingMotifs from './drawingMotifs.json';
import nightPrompts from './nightPrompts.json';
import triviaPrompts from './triviaPrompts.json';
import numberPrompts from './numberPrompts.json';
import partySituations from './partySituations.json';
import { keptNumericPrompts, numberSituations } from './numberSituations';

export const VARIETY_LEVELS = ['EASY', 'NORMAL', 'HARD'] as const;
export type Level = typeof VARIETY_LEVELS[number];
export type Category = Exclude<NonNullable<ShowQuestion['category']>, 'ALL'>;
type Text = readonly string[];
type Topic = readonly [name: Text, clue: Text];
type Group = readonly [label: Text, entries: readonly Topic[]];
type WrittenCard = readonly [theme: string, prompt: Text, options: readonly Text[]];
type NumberCard = readonly [theme: string, prompt: Text, options: readonly string[]];
type Situation = {
  id: string;
  level: Level;
  audiences?: readonly RecommendedAudience[];
  text: Text;
} & (
  | { kind: 'OPINION' | 'VOTE' | 'DISCUSSION'; options: readonly Text[] }
  | { kind: 'NEAREST' }
  | { kind: 'DRAW'; aliases: readonly Text[] }
  | { kind: 'TRIVIA'; options: readonly Text[]; answer: Text }
);
const original = subjects as unknown as Record<Category, readonly Group[]>;
const recent = triviaPrompts as unknown as Record<Category, readonly Topic[]>;
const party = nightPrompts as unknown as Partial<Record<Category, readonly WrittenCard[]>>;
const numbers = numberPrompts as unknown as Partial<Record<Category, readonly NumberCard[]>>;
const drawings: Record<Category, readonly Text[]> = drawingMotifs;
const situations = partySituations as unknown as Record<Category, readonly Situation[]>;
const situationKind: Record<ShowMode, Situation['kind']> = {
  STANDARD: 'TRIVIA', BUZZER: 'TRIVIA', SURVIVAL: 'TRIVIA', TEAMS: 'TRIVIA',
  CONSENSUS: 'OPINION', MAJORITY: 'OPINION', WOLF: 'OPINION', VOTE: 'VOTE', NEAREST: 'NEAREST', DRAW: 'DRAW',
};
const allAudiences = QUIZ_AUDIENCES.filter(audience => audience !== 'ALL');

export interface ThemedQuestion {
  theme: string;
  question: ShowQuestion;
}

export const topicKey = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');

const languageIndex = (lang: LanguageMode) => lang === 'ENGLISH' ? 1 : lang === 'HIRAGANA' ? 2 : 0;
const drawingPrompt = (answer: string, locale: number) => [`絵で伝えよう：${answer}`, `Draw: ${answer}`, `えでつたえよう：${answer}`][locale];

function objectiveChoices(pool: readonly Topic[], index: number, locale: number) {
  const answer = pool[index][0][locale];
  // In the supplemental deck the source puts related entries next to one another.
  // A compact four-item window keeps the alternatives in the same subject area.
  const start = Math.min(index - index % 4, pool.length - 4);
  const choices = [...new Set(pool.slice(start, start + 4).map(entry => entry[0][locale]))];
  if (choices.length < 4) {
    for (const [name] of pool) {
      if (!choices.includes(name[locale])) choices.push(name[locale]);
      if (choices.length === 4) break;
    }
  }
  const offset = (Math.floor(index / 4) + index * 2) % choices.length;
  return { answer, options: choices.slice(offset).concat(choices.slice(0, offset)) };
}

function card(mode: ShowMode, category: Category, theme: string, id: string, prompt: string, options: string[] = [], answer = '', aliases: string[] = []): ThemedQuestion {
  return { theme: topicKey(theme), question: {
    id: `party-${id}-${category}`, category, prompt, options, answer, aliases, party: true,
    opinion: !supportsLearningUnits(mode) && mode !== 'DRAW',
    format: mode === 'DRAW' ? 'FLIP' : 'TEXT',
    seconds: mode === 'DRAW' || mode === 'VOTE' ? 90 : mode === 'NEAREST' ? 60 : mode === 'BUZZER' ? 25 : 40,
    points: 100,
  } };
}

export function situationQuestions(mode: ShowMode, lang: LanguageMode, category: Category) {
  const locale = languageIndex(lang);
  const kind = situationKind[mode];
  const authored = situations[category].filter(situation => situation.kind === kind ||
    (situation.kind === 'DISCUSSION' && (kind === 'OPINION' || kind === 'VOTE'))).map(situation => {
    const text = situation.text[locale];
    const isDrawing = situation.kind === 'DRAW';
    const answer = isDrawing ? text : situation.kind === 'TRIVIA' ? situation.answer[locale] : '';
    const options = 'options' in situation ? situation.options.map(choice => choice[locale]) : [];
    const alternateAnswers = isDrawing ? [...situation.text, ...situation.aliases.flat()] : situation.kind === 'TRIVIA' ? situation.answer : [];
    const aliases = [...new Set(alternateAnswers)].filter(alias => alias !== answer);
    const { theme, question } = card(mode, category, isDrawing ? situation.text[0] : situation.id, `situation-${situation.id}`,
      isDrawing ? drawingPrompt(text, locale) : text, options, answer, aliases);
    return { theme, question: { ...question, difficulty: situation.level, audiences: situation.audiences ?? allAudiences } };
  });
  if (mode !== 'NEAREST') return authored;
  return [...authored, ...numberSituations(category, locale).map(({ id, text, level, audiences }) => {
    const { theme, question } = card(mode, category, id, id, text);
    return { theme, question: { ...question, difficulty: level, audiences: audiences ?? allAudiences } };
  })];
}

/** Each topic appears at most once in a mode. Difficulty is assigned to that single card. */
export function themedQuestions(mode: ShowMode, lang: LanguageMode, category: Category): ThemedQuestion[] {
  const locale = languageIndex(lang);
  const extras = recent[category] ?? [];
  const core = original[category].flatMap(([, rows]) => rows);
  if (supportsLearningUnits(mode)) {
    const make = (pool: readonly Topic[], prefix: string) => pool.map(([name, clue], i) => {
      const {answer, options} = objectiveChoices(pool, i, locale);
      const question = prefix === 'trivia' ? clue[locale] : [
        `「${clue[locale]}」。何のこと？`, `What fits this clue? “${clue[locale]}”`, `「${clue[locale]}」。なんのこと？`,
      ][locale];
      return card(mode, category, name[0], `${prefix}-${i}`, question, options, answer,
        [...new Set(name.filter(term => term !== answer))]);
    });
    return [...make(extras, 'trivia'), ...make(core, 'clue')];
  }
  if (mode === 'DRAW') {
    const make = (name: Text, id: string) => {
      const answer = name[locale];
      return card(mode, category, name[0], id, drawingPrompt(answer, locale), [], answer,
        [...new Set(name.filter(term => term !== answer))]);
    };
    return [
      ...drawings[category].map((name, i) => make(name, `sketch-${i}`)),
      ...extras.map(([name], i) => make(name, `sketch-topic-${i}`)),
      ...core.map(([name], i) => make(name, `sketch-clue-${i}`)),
    ];
  }
  const numericRows = numbers[category] ?? [];
  if (mode === 'NEAREST') {
    return keptNumericPrompts[category].map(i => {
      const [theme, text] = numericRows[i];
      return card(mode, category, theme, `estimate-${i}`, text[locale]);
    });
  }
  return [
    ...(party[category] ?? []).map(([theme, text, options], i) =>
      card(mode, category, theme, `night-${i}`, text[locale], options.map(choice => choice[locale]))),
    ...numericRows.map(([theme, text, options], i) => card(mode, category, theme, `estimate-${i}`, text[locale], [...options])),
  ];
}
