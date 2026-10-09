import type { GeneralProblem } from '../../data/subjectData';
export interface KartQuestion {
  id: string; mode: string; question: string; options: [string, string, string, string]; correct: number;
  passage?: string; visual?: GeneralProblem['visual']; audioPrompt?: GeneralProblem['audioPrompt'];
  problemId?: string; unitName?: string;
}
export interface KartLesson { title: string; questions: KartQuestion[] }
// Lane numbers run left to right on screen; track-space runs in the opposite direction.
export const QUIZ_APPROACH_SPEED = 20;
export const QUIZ_FEEDBACK_SECONDS = 2.5;
// Each next question appears after the previous answer feedback (2.5s at
// 20m/s), then has a full five seconds to reach its choice gate.
export const QUIZ_GATES = [100, 250, 400];
export const QUIZ_END = 450;
export const quizDistance = (distance: number, trackLength: number) => {
  const progress = Math.max(0, distance);
  return trackLength > 0 ? progress % trackLength : 0;
};
export const LANE_COLORS = ['#53e0ff', '#ffce5b', '#ff82bf', '#98ef82'];
export const laneCenter = (lane: number) => 9 - lane * 6;
export const answerLane = (x: number) => Math.abs(x) <= 12 ? Math.min(3, Math.max(0, Math.floor((12 - x) / 6))) : -1;
export function validLesson(value: unknown,maxQuestions=15): value is KartLesson {
  if (!value || typeof value !== 'object') return false;
  const lesson = value as KartLesson;
  return typeof lesson.title === 'string' && lesson.title.length <= 160 && Array.isArray(lesson.questions) && lesson.questions.length >= 3 && lesson.questions.length <= maxQuestions && lesson.questions.length % 3 === 0 && lesson.questions.every(q =>
    q && typeof q.id === 'string' && q.id.length <= 300 && typeof q.mode === 'string' && q.mode.length <= 120 &&
    typeof q.question === 'string' && q.question.length > 0 && q.question.length <= 12000 &&
    Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string' && o.trim().length > 0 && o.length <= 3000) && new Set(q.options).size === 4 &&
    Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4 &&
    (q.passage === undefined || (typeof q.passage === 'string' && q.passage.length <= 16000)) &&
    (q.visual === undefined || (!!q.visual && typeof q.visual === 'object' && typeof q.visual.kind === 'string')) &&
    (q.audioPrompt === undefined || (!!q.audioPrompt && typeof q.audioPrompt.text === 'string' && q.audioPrompt.text.length <= 12000 && (q.audioPrompt.lang === undefined || typeof q.audioPrompt.lang === 'string'))));
}

export const lapQuestion = (lesson: KartLesson | null, lap: number, index: number) => lesson?.questions[(lap * 3 + index) % lesson.questions.length];
