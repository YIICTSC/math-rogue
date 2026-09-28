export const TRACK_LENGTH = 3600;
const TRACK_CURVES = [
  [
    { start: 550, end: 830, offset: 190, strength: 1 },
    { start: 1200, end: 1490, offset: -190, strength: -1 },
    { start: 2040, end: 2320, offset: 240, strength: 1.2 },
    { start: 2810, end: 3100, offset: -240, strength: -1.2 },
  ],
  [
    { start: 340, end: 620, offset: -190, strength: -1 },
    { start: 1030, end: 1300, offset: 190, strength: 1 },
    { start: 1780, end: 2110, offset: -220, strength: -1.15 },
    { start: 2610, end: 2940, offset: 220, strength: 1.15 },
  ],
  [
    { start: 460, end: 800, offset: 220, strength: 1.1 },
    { start: 1130, end: 1490, offset: -220, strength: -1.1 },
    { start: 1960, end: 2260, offset: 270, strength: 1.35 },
    { start: 2790, end: 3180, offset: -270, strength: -1.35 },
  ],
];
export const HEROES = ['小学生の主人公', '高校生の主人公', '魔法学園の主人公'];
export const COURSES = [
  { name: '放課後スクールサーキット', subtitle: '校庭 → 校舎 → 桜並木', sky: '#a8deed', ground: '#79a765', road: '#beaa83', turn: 1 },
  { name: '図書館ブックウェイ', subtitle: '本棚のあいだを駆け抜けよう', sky: '#ead9b3', ground: '#705547', road: '#b68860', turn: 1.25 },
  { name: '夕焼け理科ラボ', subtitle: '実験棟のテクニカルコース', sky: '#f0aa97', ground: '#647e91', road: '#8595aa', turn: 1.5 },
];
export type Subject = 'arithmetic' | 'multiply';
export type Item = 'milk' | 'ruler' | 'chalk';
export const ITEMS: Record<Item, string> = { milk: '給食ミルク', ruler: '定規バリア', chalk: 'チョークスモーク' };
export interface Question { text: string; options: number[]; answer: number; }
export interface Racer {
  id: string; name: string; hero: number; cpu: boolean; distance: number; x: number; speed: number;
  steer: number; brake: boolean; inputAt: number; cap: number; correct: number; answered: number;
  quizTimes: number[]; quizCorrect: number; quizIndex: number; questionAt: number;
  feedback: string; item: Item | null; nextBox: number; boost: number; shield: number; slow: number;
}
export interface Race {
  phase: 'lobby' | 'countdown' | 'race' | 'quiz' | 'result'; remaining: number;
  time: number; driveTime: number; nextQuiz: number; round: number; seed: number;
  course: number; subject: Subject; players: Record<string, Racer>; questions: Question[];
}
export type Command = { type: 'input'; steer: number; brake: boolean } | { type: 'answer'; index: number; choice: number; round: number } | { type: 'item' };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function createRace(course = 0, subject: Subject = 'arithmetic', seed = 1): Race {
  return { phase: 'lobby', remaining: 0, time: 0, driveTime: 0, nextQuiz: 25, round: 0, seed, course: clamp(Math.floor(course), 0, 2), subject, players: {}, questions: [] };
}
export function addRacer(w: Race, id: string, name: string, hero = 0, cpu = false) {
  if (w.phase !== 'lobby' || Object.keys(w.players).length >= 8 || w.players[id]) return false;
  w.players[id] = { id, name: name.trim().slice(0, 16) || 'レーサー', hero: clamp(Math.floor(hero) || 0, 0, 2), cpu,
    distance: 0, x: (Object.keys(w.players).length % 3 - 1) * .4, speed: 0, steer: 0, brake: false, inputAt: 0,
    cap: 105, correct: 0, answered: 0, quizTimes: [], quizCorrect: 0, quizIndex: 0, questionAt: 0, feedback: '',
    item: null, nextBox: 160, boost: 0, shield: 0, slow: 0 };
  return true;
}
export function startRace(w: Race) {
  if (w.phase !== 'lobby' || !Object.keys(w.players).length) return;
  w.phase = 'countdown'; w.remaining = 3;
}
export function curvature(distance: number, course: number) {
  const position = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  const curves = TRACK_CURVES[clamp(Math.floor(course), 0, TRACK_CURVES.length - 1)];
  for (const curve of curves) {
    if (position < curve.start || position > curve.end) continue;
    const progress = (position - curve.start) / (curve.end - curve.start);
    return Math.sin(Math.PI * progress) * curve.strength * COURSES[clamp(Math.floor(course), 0, COURSES.length - 1)].turn;
  }
  return 0;
}
export function roadOffset(distance: number, course: number) {
  const position = ((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  const curves = TRACK_CURVES[clamp(Math.floor(course), 0, TRACK_CURVES.length - 1)];
  return curves.reduce((offset, curve) => {
    if (position <= curve.start) return offset;
    const progress = clamp((position - curve.start) / (curve.end - curve.start), 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    return offset + curve.offset * eased;
  }, 0);
}
export function speedCap(correct: number, times: number[]) {
  const speedBonus = times.reduce((sum, t) => sum + clamp(1 - t / 10, 0, 1), 0);
  return Math.round(85 + clamp(correct, 0, 3) * 15 + speedBonus * 8);
}
export function makeQuestions(seed: number, round: number, subject: Subject): Question[] {
  let n = (seed + round * 997) >>> 0;
  const random = (max: number) => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n % max; };
  return Array.from({ length: 3 }, () => {
    const a = random(subject === 'multiply' ? 9 : 40) + 1, b = random(subject === 'multiply' ? 9 : 40) + 1;
    const subtract = subject !== 'multiply' && random(2) === 0;
    const answer = subject === 'multiply' ? a * b : subtract ? Math.max(a, b) - Math.min(a, b) : a + b;
    const options = [answer, answer + 1, answer + 3, answer === 0 ? 5 : answer - 1];
    for (let i = 3; i > 0; i--) { const j = random(i + 1); [options[i], options[j]] = [options[j], options[i]]; }
    return { text: subject === 'multiply' ? `${a} × ${b} = ?` : subtract ? `${Math.max(a, b)} − ${Math.min(a, b)} = ?` : `${a} + ${b} = ?`, options, answer };
  });
}
function answer(w: Race, p: Racer, choice: number) {
  const q = w.questions[p.quizIndex];
  if (!q) return;
  const elapsed = w.time - p.questionAt;
  const correct = elapsed < 10 && q.options[choice] === q.answer;
  p.answered++; p.quizIndex++;
  if (correct) { p.correct++; p.quizCorrect++; p.quizTimes.push(elapsed); }
  p.feedback = correct ? '正解！' : `正解は ${q.answer}`;
  p.questionAt = w.time;
  if (p.quizIndex === 3) p.cap = speedCap(p.quizCorrect, p.quizTimes);
}
export function command(w: Race, id: string, raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const c = raw as Command, p = w.players[id];
  if (!p) return;
  if (c.type === 'input' && w.phase === 'race' && Number.isFinite(c.steer) && typeof c.brake === 'boolean') {
    p.steer = clamp(c.steer, -1, 1); p.brake = c.brake; p.inputAt = w.time;
  }
  if (c.type === 'answer' && w.phase === 'quiz' && c.round === w.round && c.index === p.quizIndex && Number.isInteger(c.choice) && c.choice >= 0 && c.choice < 4) answer(w, p, c.choice);
  if (c.type === 'item' && w.phase === 'race' && p.item) {
    if (p.item === 'milk') p.boost = 4;
    if (p.item === 'ruler') p.shield = 7;
    if (p.item === 'chalk') Object.values(w.players).forEach(other => {
      if (other.id !== id && Math.abs(other.distance - p.distance) < 180 && other.shield <= 0) other.slow = 3;
    });
    p.item = null;
  }
}
export function tick(w: Race, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0 || w.phase === 'lobby' || w.phase === 'result') return;
  dt = Math.min(dt, .1); w.time += dt;
  if (w.phase === 'countdown') { w.remaining -= dt; if (w.remaining <= 0) w.phase = 'race'; return; }
  if (w.phase === 'quiz') {
    w.remaining = Math.max(0, w.remaining - dt);
    for (const p of Object.values(w.players)) {
      if (p.quizIndex >= 3) continue;
      if (p.cpu && w.time - p.questionAt >= 3 + p.hero) answer(w, p, w.questions[p.quizIndex].options.indexOf(w.questions[p.quizIndex].answer));
      else if (w.time - p.questionAt >= 10) answer(w, p, -1);
    }
    if (w.remaining <= 0 || Object.values(w.players).every(p => p.quizIndex >= 3)) {
      for (const p of Object.values(w.players)) while (p.quizIndex < 3) answer(w, p, -1);
      w.phase = 'countdown'; w.remaining = 3;
      Object.values(w.players).forEach(p => { p.steer = 0; p.brake = false; });
    }
    return;
  }
  w.driveTime += dt;
  for (const p of Object.values(w.players)) {
    const turn = curvature(p.distance, w.course);
    if (p.cpu) { p.steer = clamp(turn * (p.speed / 100) ** 2 * .9 - p.x * 1.8, -1, 1); p.brake = Math.abs(turn) > .8 && p.speed > 90; if (p.item) command(w, p.id, { type: 'item' }); }
    else if (w.time - p.inputAt > .6) { p.steer = 0; p.brake = false; }
    p.boost = Math.max(0, p.boost - dt); p.shield = Math.max(0, p.shield - dt); p.slow = Math.max(0, p.slow - dt);
    const off = Math.abs(p.x) > .93;
    const cap = (p.cap + (p.boost > 0 ? 35 : 0)) * (p.slow > 0 ? .65 : 1) * (off && p.shield <= 0 ? .45 : 1);
    p.speed = clamp(p.speed + (p.brake ? -100 : p.speed < cap ? 32 : -65) * dt, 0, Math.max(cap, p.speed));
    p.x = clamp(p.x + (p.steer * (p.brake ? 1.5 : 1.1) - turn * (p.speed / 100) ** 2) * dt * Math.min(1, p.speed / 25), -1.45, 1.45);
    p.distance += p.speed * dt;
    if (p.distance >= p.nextBox) {
      if (Math.abs(p.x) < .65 && !p.item) p.item = (['milk', 'ruler', 'chalk'] as Item[])[(Math.floor(p.nextBox / 240) + p.hero) % 3];
      p.nextBox += 240;
    }
  }
  if (w.driveTime >= 90) { w.phase = 'result'; return; }
  if (w.driveTime >= w.nextQuiz) {
    w.nextQuiz += 25; w.round++; w.phase = 'quiz'; w.remaining = 30;
    w.questions = makeQuestions(w.seed, w.round, w.subject);
    Object.values(w.players).forEach(p => { p.quizIndex = 0; p.quizCorrect = 0; p.quizTimes = []; p.questionAt = w.time; p.feedback = ''; p.speed = 0; });
  }
}
export function ranking(w: Race) { return Object.values(w.players).sort((a, b) => b.distance - a.distance || a.id.localeCompare(b.id)); }
