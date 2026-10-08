import { validLesson, type KartLesson, type KartQuestion } from '../gakuro-kart/learning';
import { HOLES, distance, surface, type Point } from './course';
import { defaultAvatar, validAvatar, type KartAvatar } from '../gakuro-kart/avatar';
export const MAX_PLAYERS = 40;
export const MAX_STROKES = 12;
export const CLUBS = {
  driver: { speed: 44, loft: 38, name: 'ドライバー' },
  iron: { speed: 30, loft: 48, name: 'アイアン' },
  wedge: { speed: 18, loft: 58, name: 'ウェッジ' },
  putter: { speed: 10, loft: 0, name: 'パター' },
} as const;
export const shotQuality = (impact: number) => Math.abs(impact) <= .25 ? 'nice' : Math.abs(impact) <= .65 ? 'good' : 'miss';
export type Club = keyof typeof CLUBS;
export const benefits = (correct: number) => ({ power: [.55, .7, .85, 1][correct] ?? .55, spread: [9, 6, 3, .7][correct] ?? 9 });
export type PlayerPhase = 'ready' | 'quiz' | 'aim' | 'moving' | 'holed' | 'finished';
export interface Golfer {
  id: string; name: string; slot: number; connected: boolean; spectator?: boolean; hole: number; strokes: number; scores: number[];
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  phase: PlayerPhase; shotsLeft: number; correct: number; totalCorrect: number; shotId: number;
  questionHistory?: string[]; lesson: KartLesson | null; answers: number[]; feedback: number | null;
  origin: Point; flightTime: number; penalty: boolean; penaltyKind: 'water' | 'ob' | null; capped: boolean;
  avatar: KartAvatar; shotClub: Club; shotAngle: number; shotSpin: number; shotImpact: number; shotQuality: 'nice' | 'good' | 'miss'; spinApplied: boolean;
}
export interface GolfWorld { phase: 'lobby' | 'playing' | 'result'; players: Record<string, Golfer>; seed: number; title: string; paused: boolean; holeCount: number }
export type GolfCommand =
  | { type: 'avatar'; avatar: KartAvatar }
  | { type: 'quiz' }
  | { type: 'answer'; shotId: number; index: number; option: number }
  | { type: 'continue'; shotId: number; index: number }
  | { type: 'shot'; shotId: number; club: Club; angle: number; power: number; impact?: number; spin?: number }
  | { type: 'next' };
export type PublicGolfer = Pick<Golfer, 'id' | 'name' | 'slot' | 'connected' | 'spectator' | 'hole' | 'strokes' | 'scores' | 'x' | 'y' | 'z' | 'phase' | 'correct' | 'totalCorrect' | 'shotId' | 'shotsLeft' | 'penalty' | 'penaltyKind' | 'capped'> & Partial<Pick<Golfer, 'vx' | 'vy' | 'vz' | 'origin' | 'flightTime' | 'avatar' | 'shotClub' | 'shotAngle' | 'shotSpin' | 'shotImpact' | 'shotQuality'>>;
export interface GolfView {
  observedId?: string | null; phase: GolfWorld['phase']; title: string; paused: boolean; holeCount: number; players: PublicGolfer[];
  quiz: null | { shotId: number; index: number; question: Omit<KartQuestion, 'correct'>; selected: number | null; answer: number | null };
}
export const createGolf = (seed = 1): GolfWorld => ({ phase: 'lobby', players: Object.create(null), seed: seed >>> 0 || 1, title: '', paused: false, holeCount: 18 });
export function addPlayer(w: GolfWorld, id: string, name: string) {
  if (w.phase === 'result' || Object.keys(w.players).length >= MAX_PLAYERS || Object.hasOwn(w.players, id) || !id || id.length > 100 || ['__proto__', 'constructor', 'prototype'].includes(id)) return false;
  const slots = new Set(Object.values(w.players).map(p => p.slot)); let slot = 0; while (slots.has(slot)) slot++;
  w.players[id] = { id, name: name.trim().slice(0, 16) || 'Player', slot, connected: true, hole: 0, strokes: 0, scores: [], x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, phase: 'ready', shotsLeft: 0, correct: 0, totalCorrect: 0, shotId: 0, lesson: null, answers: [], feedback: null, origin: { x: 0, z: 0 }, flightTime: 0, penalty: false, penaltyKind: null, capped: false, avatar: defaultAvatar(slot), shotClub: 'driver', shotAngle: 0, shotSpin: 0, shotImpact: 0, shotQuality: 'nice', spinApplied: false }; return true;
}
export function setSpectator(w: GolfWorld, id: string, enabled: boolean) {
  const p = w.players[id];
  if (w.phase !== 'lobby' || !p || typeof enabled !== 'boolean') return false;
  p.spectator = enabled; return true;
}
export function setHoleCount(w: GolfWorld, count: number) {
  if (w.phase !== 'lobby' || !Number.isInteger(count) || count < 1 || count > HOLES.length) return false;
  w.holeCount = count; return true;
}
export function startGolf(w: GolfWorld, title: string) {
  if (w.phase !== 'lobby' || !title || !Object.values(w.players).some(p => p.connected && !p.spectator)) return false;
  w.title = title.slice(0, 160); w.phase = 'playing'; return true;
}
function finishCheck(w: GolfWorld) {
  if (w.phase === 'playing' && Object.values(w.players).every(p => p.spectator || !p.connected || p.phase === 'finished')) w.phase = 'result';
}
export function disconnectPlayer(w: GolfWorld, id: string) {
  if (!w.players[id]) return;
  if (w.phase === 'lobby') delete w.players[id]; else w.players[id].connected = false;
  finishCheck(w);
}
function completeHole(p: Golfer) { p.phase = 'holed'; p.scores[p.hole] = p.strokes; p.vx = p.vy = p.vz = 0; }
function settle(p: Golfer) {
  p.vx = p.vy = p.vz = p.y = 0;
  if (p.strokes >= MAX_STROKES) { p.capped = true; completeHole(p); } else p.phase = p.shotsLeft > 0 ? 'aim' : 'ready';
}
function random(w: GolfWorld) { w.seed ^= w.seed << 13; w.seed ^= w.seed >>> 17; w.seed ^= w.seed << 5; return (w.seed >>> 0) / 4294967296; }
export function command(w: GolfWorld, id: string, raw: unknown, makeLesson?: (history: string[]) => KartLesson): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as GolfCommand, p = w.players[id]; if (!p?.connected) return false;
  if (c.type === 'avatar') {
    if (!validAvatar(c.avatar)) return false;
    p.avatar = { ...c.avatar }; return true;
  }
  if (p.spectator || w.phase !== 'playing' || w.paused) return false;
  if (c.type === 'quiz' && p.phase === 'ready' && makeLesson) {
    const lesson = makeLesson(p.questionHistory ||= []); if (!validLesson(lesson) || lesson.questions.length !== 3) return false;
    p.lesson = lesson; p.answers = []; p.feedback = null; p.correct = 0; p.shotId++; p.phase = 'quiz'; return true;
  }
  if (c.type === 'answer' && p.phase === 'quiz' && p.lesson && p.feedback === null && c.shotId === p.shotId && c.index === p.answers.length && Number.isInteger(c.option) && c.option >= 0 && c.option < 4) {
    const q = p.lesson.questions[c.index]; if (!q) return false;
    p.answers.push(c.option); p.feedback = q.correct;
    if (c.option === q.correct) { p.correct++; p.totalCorrect++; } return true;
  }
  if (c.type === 'continue' && p.phase === 'quiz' && p.feedback !== null && c.shotId === p.shotId && c.index === p.answers.length - 1) {
    p.feedback = null; if (p.answers.length === 3) { p.phase = 'aim'; p.shotsLeft = 3; p.lesson = null; } return true;
  }
  if (c.type === 'shot' && p.phase === 'aim' && c.shotId === p.shotId && Object.hasOwn(CLUBS, c.club) && Number.isFinite(c.angle) && Math.abs(c.angle) <= Math.PI && Number.isFinite(c.power) && c.power >= .05 && c.power <= 1 && (c.impact === undefined || Number.isFinite(c.impact) && Math.abs(c.impact) <= 1) && (c.spin === undefined || Number.isFinite(c.spin) && Math.abs(c.spin) <= 1)) {
    const bonus = benefits(p.correct), impact = c.impact ?? 0, spin = c.club === 'putter' ? 0 : c.spin ?? 0;
    const angle = c.angle + impact * 12 * Math.PI / 180 + (random(w) * 2 - 1) * bonus.spread * Math.PI / 180;
    Object.assign(p, shotVelocity(p, c.club, angle, c.power, spin, impact));
    p.origin = { x: p.x, z: p.z }; p.shotClub = c.club; p.shotAngle = angle; p.shotSpin = spin; p.shotImpact = impact; p.shotQuality = shotQuality(impact); p.spinApplied = false;
    p.strokes++; p.shotsLeft--; p.shotId++; p.phase = 'moving'; p.flightTime = 0; p.penalty = false; p.penaltyKind = null; return true;
  }
  if (c.type === 'next' && p.phase === 'holed') {
    if (p.hole === w.holeCount - 1) p.phase = 'finished';
    else { p.hole++; p.strokes = 0; p.x = p.y = p.z = 0; p.phase = p.shotsLeft > 0 ? 'aim' : 'ready'; p.penalty = p.capped = false; p.penaltyKind = null; }
    finishCheck(w); return true;
  }
  return false;
}
/** Shared by authoritative shots and the visual preview; the preview omits random aim spread. */
export function shotVelocity(p: Pick<PublicGolfer, 'x' | 'z' | 'hole' | 'correct'>, club: Club, angle: number, power: number, spin = 0, impact = 0) {
  const spec = CLUBS[club], lie = surface(HOLES[p.hole], p);
  const speed = spec.speed * Math.sqrt(power * benefits(p.correct).power * (1 - Math.abs(impact) * .2)) * (lie === 'sand' ? .65 : lie === 'rough' ? .82 : 1);
  const loft = (spec.loft - (club === 'putter' ? 0 : spin * 9)) * Math.PI / 180;
  return { vx: Math.sin(angle) * speed * Math.cos(loft), vz: Math.cos(angle) * speed * Math.cos(loft), vy: Math.sin(loft) * speed };
}
export function tick(w: GolfWorld, dt: number) {
  if (w.phase !== 'playing' || w.paused || !Number.isFinite(dt) || dt <= 0 || dt > .1) return;
  for (const p of Object.values(w.players)) {
    if (p.spectator || p.phase !== 'moving' || !p.connected) continue;
    const hole = HOLES[p.hole], previous = { x: p.x, z: p.z };
    p.flightTime += dt;
    if (p.y > 0 || p.vy > 0) { p.vy -= 9.8 * dt; p.vx += hole.wind.x * dt; p.vz += hole.wind.z * dt; }
    p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt;
    if (p.y <= 0) {
      p.y = 0;
      const lie = surface(hole, p);
      if (lie === 'water' || lie === 'ob') { p.x = p.origin.x; p.z = p.origin.z; p.strokes++; p.penalty = true; p.penaltyKind = lie; settle(p); continue; }
      if (!p.spinApplied && p.shotClub !== 'putter') {
        p.spinApplied = true;
        const grip = lie === 'green' ? 1 : lie === 'fairway' ? .6 : lie === 'rough' ? .25 : .1;
        const impulse = p.shotSpin * (p.shotClub === 'wedge' ? 8 : 6) * grip;
        p.vx += Math.sin(p.shotAngle) * impulse; p.vz += Math.cos(p.shotAngle) * impulse;
      }
      const speed = Math.hypot(p.vx, p.vz), dx = p.x - previous.x, dz = p.z - previous.z;
      const t = Math.max(0, Math.min(1, ((hole.cup.x - previous.x) * dx + (hole.cup.z - previous.z) * dz) / (dx * dx + dz * dz || 1)));
      const near = distance(hole.cup, { x: previous.x + dx * t, z: previous.z + dz * t });
      if (near < .9 && speed < 9 && Math.abs(p.vy) < 5) { p.x = hole.cup.x; p.z = hole.cup.z; completeHole(p); continue; }
      if (p.vy < -2) { p.vy *= -.25; p.vx *= .72; p.vz *= .72; } else {
        p.vy = 0; const friction = lie === 'green' ? 1.2 : lie === 'sand' ? 8 : lie === 'rough' ? 6 : 3;
        const ratio = Math.max(0, speed - friction * dt) / (speed || 1); p.vx *= ratio; p.vz *= ratio;
        if (speed < .15) settle(p);
      }
    }
    if (p.flightTime > 30) settle(p);
  }
}
export function viewFor(w: GolfWorld, id: string, target?: string): GolfView {
  const watched = w.players[id]?.spectator && target && w.players[target]?.connected && !w.players[target]?.spectator ? target : id;
  const p = w.players[watched]; let quiz: GolfView['quiz'] = null;
  if (p?.phase === 'quiz' && p.lesson) {
    const index = p.feedback === null ? p.answers.length : p.answers.length - 1;
    const { correct: _secret, ...question } = p.lesson.questions[index];
    quiz = { shotId: p.shotId, index, question, selected: p.feedback === null ? null : p.answers[index], answer: p.feedback };
  }
  return { phase: w.phase, title: w.title, paused: w.paused, holeCount: w.holeCount, quiz, observedId: watched === id ? null : watched, players: Object.values(w.players).map(({ id, name, slot, connected, spectator, hole, strokes, scores, x, y, z, vx, vy, vz, origin, flightTime, avatar, shotClub, shotAngle, shotSpin, shotImpact, shotQuality, phase, correct, totalCorrect, shotId, shotsLeft, penalty, penaltyKind, capped }) => ({ id, name, slot, connected, spectator, hole, strokes, scores: [...scores], x, y, z, vx, vy, vz, origin: { ...origin }, flightTime, avatar: { ...avatar }, shotClub, shotAngle, shotSpin, shotImpact, shotQuality, phase, correct, totalCorrect, shotId, shotsLeft, penalty, penaltyKind, capped })) };
}

export function rematchGolf(w:GolfWorld,count=w.holeCount){
 if(w.phase!=='result'||!Number.isInteger(count)||count<1||count>HOLES.length)return false;
 const next=createGolf(w.seed+1);next.title=w.title;next.holeCount=count;
 for(const p of Object.values(w.players)){if(!p.connected)continue;addPlayer(next,p.id,p.name);Object.assign(next.players[p.id],{avatar:{...p.avatar},spectator:p.spectator,questionHistory:p.questionHistory,shotId:p.shotId+1});}
 Object.assign(w,next);return true;
}
