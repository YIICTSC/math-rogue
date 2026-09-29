import { QUIZ_GATES, QUIZ_END, answerLane, laneCenter, questionSeconds, type KartLesson } from './learning';
import { FEATURES, getTrack, ROAD_WIDTH, sampleTrack } from './track';
export { COURSES } from './track';
export const MAX_RACERS = 40, LAPS = 3, RACE_LIMIT = 360;
export const HEROES = ['SPARK', 'COMET', 'NOVA'];
export const PALETTE = ['#ff657e', '#52dcff', '#ad91ff', '#ffd36b', '#58f2bf', '#ff985c'];
export const ITEMS = { nitro: 'NITRO', shield: 'AEGIS', pulse: 'PULSE', rocket: 'COMEBACK' };
export type Item = keyof typeof ITEMS;
export interface Racer {
  id: string; slot: number; name: string; hero: number; cpu: boolean;
  distance: number; x: number; speed: number; steer: number; brake: boolean; drift: boolean;
  inputAt: number; slide: number; charge: number; boost: number; shield: number; slow: number;
  quizAnswers: number[]; quizTimes: number[]; quizCorrect: number; quizFeedbackAt: number; quizApplied: boolean; crash: number;
  item: Item | null; jump: number; draft: number; finish: number; drifts: number; overtakes: number;
}
export interface Race {
  lesson: KartLesson | null;
  phase: 'lobby' | 'countdown' | 'race' | 'result'; remaining: number; time: number;
  course: number; seed: number; finishAt: number; revision: number; paused: boolean; players: Record<string, Racer>;
}
export type Command = { type: 'input'; steer: number; brake: boolean; drift: boolean } | { type: 'item' };
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function createRace(course = 0, seed = 1): Race {
  return { lesson: null, phase: 'lobby', remaining: 3, time: 0, course: clamp(Math.floor(course) || 0, 0, 2), seed, finishAt: 0, revision: 0, paused: false, players: {} };
}
export function addRacer(w: Race, id: string, name: string, hero = 0, cpu = false) {
  if (w.phase !== 'lobby' || Object.keys(w.players).length >= MAX_RACERS || w.players[id]) return false;
  const slots = new Set(Object.values(w.players).map(p => p.slot)); let slot = 0; while (slots.has(slot)) slot++;
  w.players[id] = { id, slot, name: name.trim().slice(0, 16) || 'Racer', hero: clamp(Math.floor(hero) || 0, 0, 2), cpu,
    distance: -8 - Math.floor(slot / 4) * 7, x: (slot % 4 - 1.5) * 4, speed: 0, steer: 0, brake: false, drift: false,
    quizAnswers: [-2, -2, -2], quizTimes: [0, 0, 0], quizCorrect: 0, quizFeedbackAt: 0, quizApplied: false, crash: 0,
    inputAt: 0, slide: 0, charge: 0, boost: 0, shield: 0, slow: 0, item: null, jump: 0, draft: 0, finish: 0, drifts: 0, overtakes: 0 };
  w.revision++; return true;
}
export function startRace(w: Race, fill = false) {
  if (w.phase !== 'lobby' || !Object.keys(w.players).length) return;
  if (fill) for (let i = 0; Object.keys(w.players).length < MAX_RACERS; i++) addRacer(w, `cpu-${i}`, `BOT ${String(i + 1).padStart(2, '0')}`, i % 3, true);
  w.phase = 'countdown'; w.remaining = 3; w.revision++;
}
export function command(w: Race, id: string, raw: unknown) {
  if (!raw || typeof raw !== 'object' || w.phase !== 'race') return;
  const c = raw as Command, p = w.players[id]; if (!p || p.finish) return;
  if (c.type === 'input' && Number.isFinite(c.steer) && typeof c.brake === 'boolean' && typeof c.drift === 'boolean') {
    p.steer = clamp(c.steer, -1, 1); p.brake = c.brake; p.drift = c.drift; p.inputAt = w.time;
  }
  if (c.type === 'item' && p.item && !(w.lesson && p.distance < QUIZ_END) && !p.crash) {
    if (p.item === 'nitro') p.boost = Math.max(p.boost, 2.8);
    if (p.item === 'rocket') { p.boost = Math.max(p.boost, 4.5); p.shield = Math.max(p.shield, 4.5); }
    if (p.item === 'shield') { p.shield = 6; p.slow = 0; }
    if (p.item === 'pulse') Object.values(w.players).filter(q => q.id !== id && !q.finish && q.distance > p.distance && q.distance - p.distance < 85).sort((a, b) => a.distance - b.distance).slice(0, 3).forEach(q => { if (q.shield <= 0) q.slow = 1.3; });
    p.item = null;
  }
}
export function ranking(w: Race) {
  return Object.values(w.players).sort((a, b) => a.finish && b.finish ? a.finish - b.finish || a.slot - b.slot : a.finish ? -1 : b.finish ? 1 : b.distance - a.distance || a.slot - b.slot);
}
export function tick(w: Race, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0 || w.paused || w.phase === 'lobby' || w.phase === 'result') return;
  dt = Math.min(dt, .05);
  if (w.phase === 'countdown') { w.remaining = Math.max(0, w.remaining - dt); if (!w.remaining) { w.phase = 'race'; w.revision++; } return; }
  w.time += dt;
  const racers = ranking(w), length = getTrack(w.course).length;
  const oldDistances = new Map(racers.map(p => [p.id, p.distance]));
  for (let place = 0; place < racers.length; place++) {
    const p = racers[place]; if (p.finish) continue;
    const turn = sampleTrack(p.distance, w.course).curve;
    const learning = !!w.lesson && p.distance < QUIZ_END;
    const questionIndex = p.quizAnswers.findIndex(a => a === -2);
    const question = questionIndex >= 0 ? w.lesson?.questions[questionIndex] : undefined;
    if (p.cpu) {
      const cpuLane = question ? ((p.slot * 7 + questionIndex * 3 + w.seed) % 10 < 7 ? question.correct : (question.correct + 1 + p.slot % 3) % 4) : 0;
      const target = learning ? laneCenter(cpuLane) : Math.sin(p.distance / 100 + p.slot * 2.4) * 5;
      const correction = turn * p.speed * p.speed * .15;
      p.steer = clamp((target - p.x) * .22 + correction / 17, -1, 1);
      p.drift = Math.abs(turn) > .006 && Math.abs(p.steer) > .2 && p.speed > 25;
      p.brake = Math.abs(turn) > .025 && p.speed > 44;
      if (p.item && (p.item !== 'pulse' || racers.some(q => q.distance > p.distance && q.distance - p.distance < 85))) command(w, p.id, { type: 'item' });
    } else if (w.time - p.inputAt > .5) { p.steer = 0; p.brake = false; p.drift = false; }
    p.crash = Math.max(0, p.crash - dt);
    p.boost = Math.max(0, p.boost - dt); p.shield = Math.max(0, p.shield - dt); p.slow = Math.max(0, p.slow - dt); p.jump = Math.max(0, p.jump - dt);
    const drafting = !learning && racers.some(q => q.id !== p.id && !q.finish && oldDistances.get(q.id)! - oldDistances.get(p.id)! > 5 && oldDistances.get(q.id)! - oldDistances.get(p.id)! < 35 && Math.abs(q.x - p.x) < 2.4);
    p.draft = clamp(p.draft + (drafting ? dt : -dt * 1.8), 0, 1.5);
    const drifting = !learning && !p.crash && p.drift && Math.abs(p.steer) > .12 && p.speed > 22 && !p.jump;
    if (drifting && Math.abs(turn) > .002) p.charge = Math.min(2.4, p.charge + dt);
    if (!drifting && p.charge > 0) {
      if (p.charge >= .6) { p.boost = Math.max(p.boost, p.charge >= 1.7 ? 2 : p.charge >= 1.1 ? 1.25 : .65); p.drifts++; }
      p.charge = 0;
    }
    const off = Math.abs(p.x) > ROAD_WIDTH / 2 - 1;
    const normalCap = (58 + (p.cpu ? (p.slot % 7) - 4 : 0) + (p.boost > 0 ? 23 : 0) + (p.draft > .7 ? 8 : 0)) * (off && !p.jump ? .58 : 1) * (p.slow > 0 ? .62 : 1);
    const previousGate = questionIndex > 0 ? QUIZ_GATES[questionIndex - 1] + 45 : 0;
    const quizCap = question ? Math.min(18, (QUIZ_GATES[questionIndex] - previousGate) / questionSeconds(question)) : 18;
    const cap = p.crash > 0 ? 0 : learning ? quizCap : normalCap;
    if (learning) { p.boost = 0; p.slow = 0; p.jump = 0; p.charge = 0; }
    p.speed = clamp(p.speed + (p.brake ? -44 : p.speed < cap ? 21 : -28) * dt, 0, Math.max(p.speed, cap));
    const lateral = (p.crash > 0 ? 0 : p.steer) * (drifting ? 22 : 17) - turn * p.speed * p.speed * (drifting ? .1 : .15);
    p.slide += (lateral - p.slide) * Math.min(1, dt * (drifting ? 4 : 14));
    p.x += p.slide * dt * Math.min(1, p.speed / 18);
    if (Math.abs(p.x) > ROAD_WIDTH / 2 + 2) { p.x = Math.sign(p.x) * (ROAD_WIDTH / 2 + 2); p.slide *= -.3; p.speed *= Math.exp(-dt * 1.5); }
    const old = p.distance; p.distance += p.speed * dt;
    if (w.lesson && question && old < QUIZ_GATES[questionIndex] && p.distance >= QUIZ_GATES[questionIndex]) {
      const lane = answerLane(p.x);
      p.quizAnswers[questionIndex] = lane;
      p.quizTimes[questionIndex] = Math.max(0, w.time - (questionIndex ? p.quizFeedbackAt + 2.5 : 0));
      if (lane === question.correct) p.quizCorrect++;
      p.quizFeedbackAt = w.time;
    }
    if (w.lesson && !p.quizApplied && p.distance >= QUIZ_END && p.quizAnswers.every(a => a !== -2)) {
      p.quizApplied = true;
      if (p.quizCorrect === 3) p.boost = 6;
      else if (p.quizCorrect === 1) { p.slow = 7; p.speed *= .65; }
      else if (p.quizCorrect === 0) { p.crash = 2.4; p.slow = 5; p.speed = 0; p.slide = 0; }
    }
    for (const f of FEATURES) {
      if (learning) continue;
      const next = (Math.floor((old - f.at * length) / length) + 1 + f.at) * length;
      if (next < 0 || next > p.distance || Math.abs(p.x - f.lane) > (f.type === 'jump' ? 5 : 2.8)) continue;
      if (f.type === 'boost') p.boost = Math.max(p.boost, 1.2);
      if (f.type === 'jump') { p.jump = 1.3; p.boost = Math.max(p.boost, 1.9); }
      if (f.type === 'box' && !p.item) {
        const roll = (Math.imul(Math.floor(next) + p.slot + w.seed, 1664525) >>> 0) % 10;
        p.item = place > racers.length * .55 && roll < 5 ? 'rocket' : roll < 4 ? 'nitro' : roll < 7 ? 'shield' : 'pulse';
      }
    }
    for (const q of racers) if (q.id !== p.id && !q.finish && old < oldDistances.get(q.id)! && p.distance >= q.distance) p.overtakes++;
    if (p.distance >= length * LAPS) { p.finish = w.time - (p.distance - length * LAPS) / Math.max(1, p.speed); p.distance = length * LAPS; p.speed = 0; if (!w.finishAt) w.finishAt = w.time; }
  }
  const bumps = new Map<string, number>();
  for (let i = 0; i < racers.length; i++) for (let j = i + 1; j < racers.length; j++) {
    const a = racers[i], b = racers[j];
    if ((w.lesson && (a.distance < QUIZ_END || b.distance < QUIZ_END)) || a.crash || b.crash || a.finish || b.finish || a.jump || b.jump || Math.abs(a.distance - b.distance) > 2.4 || Math.abs(a.x - b.x) > 1.65) continue;
    const sign = a.x === b.x ? (a.slot < b.slot ? -1 : 1) : Math.sign(a.x - b.x), force = sign * dt * 2;
    bumps.set(a.id, (bumps.get(a.id) || 0) + force); bumps.set(b.id, (bumps.get(b.id) || 0) - force);
  }
  for (const p of racers) p.x = clamp(p.x + (bumps.get(p.id) || 0), -14, 14);
  w.remaining = w.finishAt ? Math.max(0, 25 - (w.time - w.finishAt)) : Math.max(0, RACE_LIMIT - w.time);
  if (w.time >= RACE_LIMIT || (w.finishAt && w.time - w.finishAt >= 25) || racers.every(p => p.finish)) { w.phase = 'result'; w.revision++; }
}
