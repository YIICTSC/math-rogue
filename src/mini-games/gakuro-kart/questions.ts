import { GameMode, type AssignmentPayload } from '../../types';
import { SUBJECT_DATA, type GeneralProblem } from '../../data/subjectData';
import { KANJI_DATA, KANKEN_DATA, HARD_KANJI_DATA } from '../../data/kanjiData';
import { ENGLISH_DATA } from '../../data/englishData';
import { assignmentFilterForMode, matchesAssignmentRangeFilter, matchesKanjiAssignmentRangeFilter } from '../../utils/assignmentRangeFilters';
import { arithmeticPool } from './arithmetic';
import { validLesson, type KartLesson, type KartQuestion } from './learning';
export interface LessonSelection { mode: GameMode; modes?: string[]; assignment?: AssignmentPayload; title?: string }
type Candidate = GeneralProblem & { mode: string; problemId?: string };
const arithmeticModes: string[] = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION, GameMode.MIXED, GameMode.ADD_1DIGIT, GameMode.ADD_1DIGIT_CARRY, GameMode.SUB_1DIGIT, GameMode.SUB_1DIGIT_BORROW];
function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function fourOptions(correct: string, supplied: string[], peers: string[] = []): [string, string, string, string] {
  const values = new Set([correct.trim(), ...supplied.map(String).map(s => s.trim()).filter(Boolean)]);
  if (Number.isFinite(Number(correct)) && correct.trim()) for (const delta of [1, -1, 2, -2, 5]) { if (values.size >= 4) break; values.add(String(Number(correct) + delta)); }
  for (const p of shuffle(peers)) { if (values.size >= 4) break; if (p.trim()) values.add(p.trim()); }
  // Text-only custom questions without distractors still have four distinct choices.
  for (let n = 1; values.size < 4; n++) values.add(`${correct} (${n})`);
  return shuffle([...values].slice(0, 4)) as [string, string, string, string];
}
export function buildLesson(selection: LessonSelection, count = 3, history: string[] = []): KartLesson {
  const assignment = selection.assignment;
  const modes = assignment ? [...new Set(assignment.units.flatMap(u => u.modes))] : selection.modes?.length ? selection.modes : [selection.mode];
  const pool: Candidate[] = [];
  for (const mode of modes) {
    const filter = assignmentFilterForMode(assignment?.units, mode);
    let source: GeneralProblem[] = [];
    const kanji = mode === GameMode.KANJI_MIXED ? Object.values(KANJI_DATA).flat() : mode === GameMode.KANKEN_MIXED ? Object.values(KANKEN_DATA).flat() : mode === GameMode.HARD_KANJI_MIXED ? Object.values(HARD_KANJI_DATA).flat() : KANJI_DATA[mode] || KANKEN_DATA[mode] || HARD_KANJI_DATA[mode];
    if (kanji) source = kanji.filter(p => matchesKanjiAssignmentRangeFilter(p, filter));
    else if (arithmeticModes.includes(mode)) {
      source = arithmeticPool(mode as GameMode, filter).map(p => ({ question: p.question, answer: String(p.answer), options: [String(p.answer), ...p.options.map(String)] }));
      if (filter?.kind === 'division' && filter.values.includes('remainder_with')) source = source.map(p => { const nums = p.question.match(/\d+/g)!.map(Number); const answer = `${Math.floor(nums[0] / nums[1])} あまり ${nums[0] % nums[1]}`; return { ...p, answer, options: [answer, ...[1, 2, 3].map(n => `${Math.floor(nums[0] / nums[1]) + n} あまり ${nums[0] % nums[1]}`)] }; });
      source = source.filter(p => matchesAssignmentRangeFilter(p, filter));
    } else {
      source = SUBJECT_DATA[mode] || (mode === GameMode.ENGLISH_MIXED ? Object.values(ENGLISH_DATA).flat() : ENGLISH_DATA[mode]) || [];
      if (filter?.kind === 'english_words' && filter.values.includes('japanese_to_english') && ENGLISH_DATA[mode]) source = source.map((p, i, all) => ({ ...p, question: p.options[0], options: [p.question, ...[1, 2, 3].map(n => all[(i + n) % all.length].question)], answer: p.question }));
      if (filter?.kind === 'english_words' && filter.values.includes('listening') && ENGLISH_DATA[mode]) source = source.map(p => ({ ...p, audioPrompt: { text: p.question, lang: 'en-US' } }));
      source = source.filter(p => matchesAssignmentRangeFilter(p, filter));
    }
    pool.push(...source.map(p => ({ ...p, mode })));
  }
  for (const p of assignment?.customProblems || []) pool.push({ question: p.question, answer: p.answer, options: [p.answer, ...p.options], mode: 'ASSIGNMENT_CUSTOM', problemId: p.id });
  const key = (p: Candidate) => JSON.stringify([p.question.trim(),p.passage||'',p.options[0].trim()]);
  const usable = shuffle([...new Map(pool.filter(p => p.question?.trim() && p.options?.[0]?.trim()).map(p => [key(p),p])).values()]);
  if (!usable.length) throw new Error('この範囲には出題できる問題がありません。');
  const questions: KartQuestion[] = Array.from({ length: count }, (_, i) => {
    let remaining = usable.filter(p => !history.includes(key(p)));
    if (!remaining.length) { history.length = 0; remaining = usable; }
    const p = remaining[0]; history.push(key(p));
    const correct = p.options[0].trim();
    const options = fourOptions(correct, p.options, usable.filter(q => q.mode === p.mode).map(q => q.options[0]));
    return { id: `${i}:${p.mode}:${p.problemId || p.question}`.slice(0, 300), mode: p.mode, question: p.question, options, correct: options.indexOf(correct), passage: p.passage, visual: p.visual, audioPrompt: p.audioPrompt, problemId: p.problemId, unitName: assignment?.units.find(u => u.modes.includes(p.mode))?.name };
  });
  const lesson = { title: (assignment?.title || selection.title || modes.join(' / ')).slice(0, 160), questions };
  if (!validLesson(lesson) || JSON.stringify(lesson).length > 100000 * (count / 3)) throw new Error('問題データが大きすぎます。別の範囲を選んでください。');
  return lesson;
}
