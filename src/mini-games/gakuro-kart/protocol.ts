import { validLesson, type KartLesson } from './learning';
import { createRace, MAX_RACERS, type Race, type Racer, type Item } from './engine';
export const PROTOCOL = 3;
const phases: Race['phase'][] = ['lobby', 'countdown', 'race', 'result'];
const items: (Item | null)[] = [null, 'nitro', 'shield', 'pulse', 'rocket'];
const HEADER = 32, STRIDE = 56;
export type Roster = { type: 'roster'; lesson: KartLesson | null; version: number; revision: number; course: number; seed: number; players: Pick<Racer, 'id' | 'slot' | 'name' | 'hero' | 'cpu'>[] };
export function roster(w: Race): Roster {
  return { type: 'roster', lesson: w.lesson, version: PROTOCOL, revision: w.revision, course: w.course, seed: w.seed, players: Object.values(w.players).map(({ id, slot, name, hero, cpu }) => ({ id, slot, name, hero, cpu })) };
}
export function acceptRoster(r: Roster, previous: Race | null): Race | null {
  if (r.version !== PROTOCOL || !Number.isInteger(r.revision) || r.revision < 0 || !Number.isInteger(r.course) || r.course < 0 || r.course > 2 || !Array.isArray(r.players) || r.players.length > MAX_RACERS) return null;
  if (r.lesson !== null && !validLesson(r.lesson)) return null;
  const slots = new Set<number>(), ids = new Set<string>();
  for (const p of r.players) {
    if (!p || typeof p.id !== 'string' || p.id.length > 100 || typeof p.name !== 'string' || p.name.length > 16 || !Number.isInteger(p.slot) || p.slot < 0 || p.slot >= MAX_RACERS || slots.has(p.slot) || ids.has(p.id) || !Number.isInteger(p.hero) || p.hero < 0 || p.hero > 2 || typeof p.cpu !== 'boolean') return null;
    slots.add(p.slot); ids.add(p.id);
  }
  if (previous && r.revision < previous.revision) return null;
  const w = previous ? { ...previous, players: {} } : createRace(r.course, r.seed);
  w.lesson = r.lesson; w.course = r.course; w.seed = r.seed; w.revision = r.revision;
  for (const p of r.players) w.players[p.id] = { quizAnswers: [-2, -2, -2], quizTimes: [0, 0, 0], quizCorrect: 0, quizFeedbackAt: 0, quizApplied: false, crash: 0, distance: 0, x: 0, speed: 0, steer: 0, brake: false, drift: false, inputAt: 0, slide: 0, charge: 0, boost: 0, shield: 0, slow: 0, item: null, jump: 0, draft: 0, finish: 0, drifts: 0, overtakes: 0, ...previous?.players[p.id], ...p };
  return w;
}
/** One 2,272-byte packet for 40 racers; names are only sent when the roster changes. */
export function encodeSnapshot(w: Race, sequence: number): ArrayBuffer {
  const players = Object.values(w.players), buffer = new ArrayBuffer(HEADER + players.length * STRIDE), d = new DataView(buffer);
  d.setUint32(0, 0x474b3430); d.setUint8(4, PROTOCOL); d.setUint8(5, phases.indexOf(w.phase)); d.setUint8(6, players.length); d.setUint8(7, Number(w.paused));
  d.setUint32(8, sequence); d.setFloat32(12, w.time); d.setFloat32(16, w.remaining); d.setFloat32(20, w.finishAt); d.setUint32(24, w.revision);
  players.forEach((p, i) => {
    const o = HEADER + i * STRIDE;
    d.setUint8(o, p.slot); d.setUint8(o + 1, Number(p.brake) | Number(p.drift) << 1); d.setUint8(o + 2, items.indexOf(p.item)); d.setUint8(o + 3, Math.round(p.charge * 100));
    d.setFloat32(o + 4, p.distance); d.setFloat32(o + 8, p.x); d.setUint16(o + 12, Math.round(p.speed * 100)); d.setInt8(o + 14, Math.round(p.steer * 100)); d.setInt8(o + 15, Math.round(p.slide * 4));
    [p.boost, p.shield, p.slow, p.jump, p.draft].forEach((v, j) => d.setUint8(o + 16 + j, Math.round(v * 20)));
    p.quizAnswers.forEach((v, j) => d.setInt8(o + 32 + j, v));
    d.setUint8(o + 35, p.quizCorrect); d.setFloat32(o + 36, p.quizFeedbackAt);
    d.setUint8(o + 40, Math.round(p.crash * 20)); d.setUint8(o + 41, Number(p.quizApplied));
    p.quizTimes.forEach((v, j) => d.setFloat32(o + 44 + j * 4, v));
    d.setUint16(o + 22, p.drifts); d.setFloat32(o + 24, p.finish); d.setUint16(o + 28, p.overtakes);
  }); return buffer;
}
export function decodeSnapshot(buffer: ArrayBuffer, w: Race, lastSequence: number): { world: Race; sequence: number } | null {
  if (buffer.byteLength < HEADER) return null;
  const d = new DataView(buffer), count = d.getUint8(6), sequence = d.getUint32(8);
  if (d.getUint32(0) !== 0x474b3430 || d.getUint8(4) !== PROTOCOL || !phases[d.getUint8(5)] || sequence <= lastSequence || count > MAX_RACERS || buffer.byteLength !== HEADER + count * STRIDE || d.getUint32(24) !== w.revision) return null;
  const next = { ...w, players: { ...w.players }, paused: !!d.getUint8(7), phase: phases[d.getUint8(5)], time: d.getFloat32(12), remaining: d.getFloat32(16), finishAt: d.getFloat32(20) };
  if (![next.time, next.remaining, next.finishAt].every(Number.isFinite)) return null;
  const slots = new Map(Object.values(w.players).map(p => [p.slot, p])); const seen = new Set<number>();
  if (count !== slots.size) return null;
  for (let i = 0; i < count; i++) {
    const o = HEADER + i * STRIDE, slot = d.getUint8(o), p = slots.get(slot);
    if (!p || seen.has(slot) || d.getUint8(o + 2) >= items.length) return null;
    seen.add(slot);
    const q = { ...p, quizAnswers: [0, 1, 2].map(j => d.getInt8(o + 32 + j)), quizTimes: [0, 1, 2].map(j => d.getFloat32(o + 44 + j * 4)),
      quizCorrect: d.getUint8(o + 35), quizFeedbackAt: d.getFloat32(o + 36), crash: d.getUint8(o + 40) / 20, quizApplied: !!d.getUint8(o + 41), brake: !!(d.getUint8(o + 1) & 1), drift: !!(d.getUint8(o + 1) & 2), item: items[d.getUint8(o + 2)], charge: d.getUint8(o + 3) / 100,
      distance: d.getFloat32(o + 4), x: d.getFloat32(o + 8), speed: d.getUint16(o + 12) / 100, steer: d.getInt8(o + 14) / 100, slide: d.getInt8(o + 15) / 4,
      boost: d.getUint8(o + 16) / 20, shield: d.getUint8(o + 17) / 20, slow: d.getUint8(o + 18) / 20, jump: d.getUint8(o + 19) / 20, draft: d.getUint8(o + 20) / 20, drifts: d.getUint16(o + 22), finish: d.getFloat32(o + 24), overtakes: d.getUint16(o + 28) };
    if (![q.distance, q.x, q.finish].every(Number.isFinite) || Math.abs(q.x) > 15 || q.speed > 100) return null;
    if (q.quizCorrect > 3 || !Number.isFinite(q.quizFeedbackAt) || q.quizAnswers.some(a => a < -2 || a > 3) || q.quizTimes.some(v => !Number.isFinite(v) || v < 0)) return null;
    next.players[q.id] = q;
  } return { world: next, sequence };
}
