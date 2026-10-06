import { addPlayer, createGolf, shotVelocity, tick, type Club, type PublicGolfer } from './engine';

type Sample = { at: number; player: PublicGolfer };
export const BALL_RENDER_DELAY = 220;
/** Render between received snapshots instead of chasing each new 5 Hz position. */
export class BallMotion {
  private samples: Sample[] = [];
  push(player: PublicGolfer, at: number) {
    const last = this.samples.at(-1);
    if (last && (last.player.hole !== player.hole ||
      (player.penalty && !last.player.penalty && Math.hypot(player.x - last.player.x, player.z - last.player.z) > 4))) this.samples = [];
    this.samples.push({ at, player });
    if (this.samples.length > 10) this.samples.shift();
  }
  sample(now: number) {
    const samples = this.samples;
    if (!samples.length) return { x: 0, y: 0, z: 0 };
    const at = now - BALL_RENDER_DELAY;
    if (at <= samples[0].at) return this.position(samples[0].player);
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      if (at > b.at) continue;
      const duration = (b.at - a.at) / 1000;
      if (duration <= 0) return this.position(b.player);
      const t = (at - a.at) / (b.at - a.at), t2 = t * t, t3 = t2 * t;
      const out = { x: 0, y: 0, z: 0 };
      for (const axis of ['x', 'y', 'z'] as const) {
        const velocity = `v${axis}` as 'vx' | 'vy' | 'vz';
        const delta = b.player[axis] - a.player[axis];
        // Older servers omit velocities: surrounding positions still provide smooth tangents.
        const prev = samples[Math.max(0, i - 2)], next = samples[Math.min(samples.length - 1, i + 1)];
        const va = a.player[velocity] ?? (b.player[axis] - prev.player[axis]) / Math.max(.001, (b.at - prev.at) / 1000);
        const vb = b.player[velocity] ?? (next.player[axis] - a.player[axis]) / Math.max(.001, (next.at - a.at) / 1000);
        // Ground bounces and stopped balls must not overshoot or sink into the course.
        out[axis] = Math.abs(delta) < .00001 ? a.player[axis] :
          (2 * t3 - 3 * t2 + 1) * a.player[axis] + (t3 - 2 * t2 + t) * duration * va +
          (-2 * t3 + 3 * t2) * b.player[axis] + (t3 - t2) * duration * vb;
      }
      out.y = Math.max(0, out.y);
      return out;
    }
    // Freeze when packets stop; never simulate an unconfirmed landing or penalty.
    return this.position(samples.at(-1)!.player);
  }
  private position(p: PublicGolfer) { return { x: p.x, y: p.y, z: p.z }; }
}

/** Trace the same 30 Hz physics used by the server, including wind, bounce and roll. */
export function predictShot(player: PublicGolfer, club: Club, angle: number, power: number, spin = 0, impact = 0) {
  const world = createGolf(); addPlayer(world, 'preview', 'Preview'); world.phase = 'playing';
  const p = world.players.preview; angle += impact * 12 * Math.PI / 180;
  Object.assign(p, { hole: player.hole, correct: player.correct, x: player.x, y: 0, z: player.z,
    phase: 'moving', shotClub: club, shotAngle: angle, shotSpin: club === 'putter' ? 0 : spin, spinApplied: false, origin: { x: player.x, z: player.z }, ...shotVelocity(player, club, angle, power, spin, impact) });
  const points = [{ x: p.x, y: .55, z: p.z }];
  for (let i = 0; i < 900 && p.phase === 'moving'; i++) {
    const previous = { x: p.x, y: p.y + .55, z: p.z };
    tick(world, 1 / 30);
    if (p.penalty) { points.push(previous); break; }
    if (i % 3 === 0 || p.phase !== 'moving') points.push({ x: p.x, y: p.y + .55, z: p.z });
  }
  return points;
}
