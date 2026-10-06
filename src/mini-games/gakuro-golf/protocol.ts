import { MAX_PLAYERS, type GolfView } from './engine';
import { validLesson } from '../gakuro-kart/learning';
import { HOLES } from './course';
import { validAvatar } from '../gakuro-kart/avatar';
export const GOLF_PROTOCOL = 3;
const phases = ['ready', 'quiz', 'aim', 'moving', 'holed', 'finished'];
export function validView(v: any): v is GolfView {
  if (!v || !['lobby', 'playing', 'result'].includes(v.phase) || typeof v.title !== 'string' || v.title.length > 160 || typeof v.paused !== 'boolean' || !Number.isInteger(v.holeCount) || v.holeCount < 1 || v.holeCount > HOLES.length || !Array.isArray(v.players) || v.players.length < 1 || v.players.length > MAX_PLAYERS) return false;
  const ids = new Set(), slots = new Set();
  for (const p of v.players) {
    if (!p || typeof p.id !== 'string' || p.id.length > 100 || ids.has(p.id) || !Number.isInteger(p.slot) || p.slot < 0 || p.slot >= MAX_PLAYERS || slots.has(p.slot) || typeof p.name !== 'string' || p.name.length > 16 || typeof p.connected !== 'boolean' || (p.spectator !== undefined && typeof p.spectator !== 'boolean') || !phases.includes(p.phase) || !Number.isInteger(p.hole) || p.hole < 0 || p.hole >= v.holeCount || !Number.isInteger(p.strokes) || p.strokes < 0 || p.strokes > 13 || !Array.isArray(p.scores) || p.scores.length > v.holeCount || p.scores.some((s: unknown) => !Number.isInteger(s) || Number(s) < 1 || Number(s) > 13) || ![p.x, p.y, p.z].every(n => Number.isFinite(n) && Math.abs(n) < 10000) || !Number.isInteger(p.correct) || p.correct < 0 || p.correct > 3 || !Number.isInteger(p.totalCorrect) || p.totalCorrect < 0 || !Number.isInteger(p.shotId) || p.shotId < 0 || !Number.isInteger(p.shotsLeft) || p.shotsLeft < 0 || p.shotsLeft > 3 || typeof p.penalty !== 'boolean' || ![null,'water','ob'].includes(p.penaltyKind) || typeof p.capped !== 'boolean') return false;
    ids.add(p.id); slots.add(p.slot);
    if (p.avatar !== undefined && !validAvatar(p.avatar)) return false;
    if ([p.vx, p.vy, p.vz, p.flightTime, p.shotAngle].some(n => n !== undefined && (!Number.isFinite(n) || Math.abs(n) > 10000))) return false;
    if ([p.shotSpin,p.shotImpact].some(n => n !== undefined && (!Number.isFinite(n) || Math.abs(n) > 1))) return false;
    if (p.shotQuality !== undefined && !['nice','good','miss'].includes(p.shotQuality)) return false;
    if (p.shotClub !== undefined && !['driver','iron','wedge','putter'].includes(p.shotClub)) return false;
    if (p.origin !== undefined && (!p.origin || ![p.origin.x,p.origin.z].every(n=>Number.isFinite(n)&&Math.abs(n)<10000))) return false;
  }
  if (v.observedId != null && (typeof v.observedId !== 'string' || !ids.has(v.observedId))) return false;
  if (v.quiz !== null) {
    const q = v.quiz;
    if (!q || !Number.isInteger(q.shotId) || q.shotId < 1 || !Number.isInteger(q.index) || q.index < 0 || q.index > 2 || !q.question || Object.hasOwn(q.question, 'correct')) return false;
    if (![q.selected, q.answer].every(n => n === null || (Number.isInteger(n) && n >= 0 && n < 4)) || ((q.selected === null) !== (q.answer === null))) return false;
    if (!validLesson({ title: '', questions: Array(3).fill({ ...q.question, correct: 0 }) })) return false;
  }
  return true;
}
