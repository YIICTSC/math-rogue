import {
  addPoints,
  nextSeat,
  random,
  settle,
  teamOf,
  type TableAction,
  type TableBase,
} from './model';

export type Shot = Extract<TableAction, { type: 'shot' }>;
export type Disc = { id: number; seat: number; x: number; y: number };
type MovingDisc = Disc & { vx: number; vy: number; off: boolean; twenty: boolean };
export type ShotReplay = { before: Disc[]; shot: Shot; seat: number; discId: number };
export interface CrokinoleState extends TableBase {
  kind: 'crokinole';
  game: 'crokinole';
  discs: Disc[];
  remaining: number[];
  sunk: number[];
  lastShot: ShotReplay | null;
  boardPoints: number[];
}
export const DISC_R = 0.045;
export const PEG_R = 0.019;
export const PEGS = Array.from({ length: 8 }, (_, i) => ({
  x: Math.cos(Math.PI * (i / 4 + 1 / 8)) / 3,
  y: Math.sin(Math.PI * (i / 4 + 1 / 8)) / 3,
}));
const length = (x: number, y: number) => Math.hypot(x, y);

export function newCrokinoleRound(s: CrokinoleState) {
  s.turn = s.dealer;
  s.discs = [];
  s.remaining = s.players.map(() => (s.players.length === 4 ? 6 : 12));
  s.sunk = s.players.map(() => 0);
  s.boardPoints = s.players.map(() => 0);
  s.lastShot = null;
}

export function shotOrigin(seat: number, n: number, angle: number) {
  const rad = Math.PI * (0.5 + (n === 2 ? seat : seat * 0.5) + angle * 0.235);
  return { x: Math.cos(rad) * (1 - DISC_R * 0.6), y: Math.sin(rad) * (1 - DISC_R * 0.6) };
}
export function aimAt(seat: number, n: number, angle: number, x: number, y: number) {
  const start = shotOrigin(seat, n, angle);
  const center = Math.atan2(-start.y, -start.x);
  const desired = Math.atan2(y - start.y, x - start.x);
  return Math.max(
    -1,
    Math.min(1, Math.atan2(Math.sin(desired - center), Math.cos(desired - center)) / 1.48),
  );
}
export function shotVector(seat: number, n: number, shot: Shot) {
  const start = shotOrigin(seat, n, shot.angle);
  const heading = Math.atan2(-start.y, -start.x) + shot.aim * 1.48;
  const speed = 0.2 + shot.power * 2.15;
  return { ...start, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed };
}
export function discPoints(d: Disc) {
  const dist = length(d.x, d.y) + DISC_R;
  return dist < 1 / 3 ? 15 : dist < 2 / 3 ? 10 : dist < 1 ? 5 : 0;
}
const inside = (d: MovingDisc) => !d.off && !d.twenty;
const position = (d: MovingDisc): Disc => ({ id: d.id, seat: d.seat, x: d.x, y: d.y });

// All clients replay the same shot from the host's frozen starting board.
// Fixed integration steps keep collisions independent of frame rate.
export function resolveShot(
  before: Disc[],
  seat: number,
  players: number,
  shot: Shot,
  id: number,
  replay = false,
) {
  const fired: MovingDisc = {
    ...shotVector(seat, players, shot),
    id,
    seat,
    off: false,
    twenty: false,
  };
  const discs: MovingDisc[] = [
    ...before.map((d) => ({ ...d, vx: 0, vy: 0, off: false, twenty: false })),
    fired,
  ];
  const touched = new Set([id]),
    activeTeam = (other: number) => (players === 4 ? other % 2 : other);
  const hadEnemy = before.some((d) => activeTeam(seat) !== activeTeam(d.seat));
  let enemyHit = false;
  const frames: Disc[][] = [];
  const dt = 1 / 150;
  for (let f = 0; f < 640; f++) {
    let moving = false;
    for (const d of discs) {
      if (!inside(d)) continue;
      const speed = length(d.vx, d.vy);
      if (speed < 0.0001) continue;
      moving = true;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const factor = Math.max(0, 1 - (0.94 * dt) / speed);
      d.vx *= factor;
      d.vy *= factor;
      const dist = length(d.x, d.y);
      if (dist > 1 + DISC_R * 0.5) {
        d.off = true;
        continue;
      }
      if (dist < 0.026 && speed < 0.53) {
        d.twenty = true;
        continue;
      }
      for (const peg of PEGS) {
        const dx = d.x - peg.x,
          dy = d.y - peg.y,
          r = length(dx, dy),
          radius = DISC_R + PEG_R;
        if (r < radius && r > 0.000001) {
          const nx = dx / r,
            ny = dy / r,
            impulse = d.vx * nx + d.vy * ny;
          d.x = peg.x + nx * radius;
          d.y = peg.y + ny * radius;
          if (impulse < 0) {
            d.vx -= 1.72 * impulse * nx;
            d.vy -= 1.72 * impulse * ny;
          }
        }
      }
    }
    for (let i = 0; i < discs.length; i++)
      for (let k = i + 1; k < discs.length; k++) {
        const a = discs[i],
          b = discs[k];
        if (!inside(a) || !inside(b)) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = length(dx, dy);
        if (d >= 2 * DISC_R || d < 0.000001) continue;
        const nx = dx / d,
          ny = dy / d,
          overlap = DISC_R - d / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const speed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (speed <= 0) continue;
        touched.add(a.id);
        touched.add(b.id);
        if (activeTeam(a.seat) !== activeTeam(b.seat)) enemyHit = true;
        const impulse = speed * 0.94;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
    if (replay && f % 8 === 0) frames.push(discs.filter(inside).map(position));
    if (!moving) break;
  }
  const allied = (d: MovingDisc) => activeTeam(d.seat) === activeTeam(seat);
  const valid = hadEnemy
    ? enemyHit
    : discs.some(
        (d) =>
          allied(d) &&
          touched.has(d.id) &&
          (d.twenty || (!d.off && length(d.x, d.y) - DISC_R <= 1 / 3)),
      );
  const saved = discs.filter((d) => valid || !allied(d) || !touched.has(d.id));
  const board = saved.filter((d) => inside(d) && discPoints(d) > 0).map(position);
  const sunk = saved.filter((d) => d.twenty).map((d) => d.seat);
  if (replay) frames.push(board);
  return { board, sunk, valid, frames };
}

const validShot = (a: Shot) =>
  [a.angle, a.aim, a.power].every(Number.isFinite) &&
  Math.abs(a.angle) <= 1 &&
  Math.abs(a.aim) <= 1 &&
  a.power >= 0.05 &&
  a.power <= 1;

export function applyCrokinole(s: CrokinoleState, seat: number, a: TableAction) {
  if (a.type !== 'shot' || s.turn !== seat || !s.remaining[seat] || !validShot(a)) return false;
  const shot = { type: 'shot', angle: a.angle, aim: a.aim, power: a.power } as const;
  const discId = s.revision;
  const resolution = resolveShot(s.discs, seat, s.players.length, shot, discId);
  s.lastShot = { shot, seat, before: s.discs, discId };
  s.discs = resolution.board;
  s.remaining[seat]--;
  for (const member of resolution.sunk) s.sunk[member]++;
  s.event = {
    key: resolution.sunk.includes(seat) ? 'twenty' : resolution.valid ? 'shot' : 'foul',
    seat,
  };
  s.boardPoints = s.sunk.map(
    (count, i) =>
      count * 20 + s.discs.filter((d) => d.seat === i).reduce((n, d) => n + discPoints(d), 0),
  );
  if (s.remaining.every((n) => !n)) {
    const blue = s.boardPoints[0] + (s.teams ? s.boardPoints[2] : 0);
    const red = s.boardPoints[1] + (s.teams ? s.boardPoints[3] : 0);
    if (blue === red) {
      addPoints(s, 0, 1);
      addPoints(s, 1, 1);
    } else addPoints(s, blue > red ? 0 : 1, 2);
    settle(s, s.round >= 4 && s.scores[0] !== s.scores[1]);
  } else s.turn = nextSeat(s, seat);
  return true;
}

export function crokinoleCpu(s: CrokinoleState, seat: number): Shot {
  const opposing = s.discs.filter((d) => teamOf(s, d.seat) !== teamOf(s, seat));
  const targets = opposing.length ? opposing : [{ x: 0, y: 0 }];
  let best: Shot = { type: 'shot', angle: 0, aim: 0, power: 0.55 },
    max = -Infinity;
  for (const angle of [-0.8, -0.4, 0, 0.4, 0.8])
    for (const target of targets.slice(0, 6)) {
      const aim = aimAt(seat, s.players.length, angle, target.x, target.y);
      for (const power of [0.52, 0.57, 0.67, 0.79, 0.93]) {
        const trial: Shot = { type: 'shot', angle, aim, power };
        const r = resolveShot(s.discs, seat, s.players.length, trial, s.revision);
        const side = (p: number) => (teamOf(s, p) === teamOf(s, seat) ? 1 : -1);
        const score =
          r.board.reduce((n, d) => n + side(d.seat) * discPoints(d), 0) +
          r.sunk.reduce((n, p) => n + side(p) * 20, 0) +
          (r.valid ? 1 : 0);
        if (score > max) {
          max = score;
          best = trial;
        }
      }
    }
  // CPU shots have small, seeded placement and pace variation.
  const paceError = (random(s) - 0.5) * 0.082;
  const aimError = (random(s) - 0.5) * 0.045;
  return {
    ...best,
    power: Math.min(1, Math.max(0.05, best.power + paceError)),
    aim: Math.min(1, Math.max(-1, best.aim + aimError)),
  };
}
