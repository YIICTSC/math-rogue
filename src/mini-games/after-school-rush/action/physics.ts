import { clamp, type Clock, type Mechanic, type State } from '../originals/model';
import type { ActionControl, ActionSpec, Point, World } from './types';

export const S = {
  T: 0, X: 1, Y: 2, VX: 3, VY: 4, AX: 5, AY: 6, HP: 7, SCORE: 8, SEED: 9, LEVEL: 10,
  MASK: 11, A: 12, B: 13, READY_A: 14, READY_B: 15, FACING: 16, BOX_X: 17, BOX_Y: 18,
  BALL_X: 19, BALL_Y: 20, BALL_VX: 21, BALL_VY: 22, CARRIED: 23, LEAN: 24, ANGLE: 25,
  POWER: 26, INVULN: 27, LAST_GROUND: 28, GROUND_X: 29, RESULT: 30, MOVED: 31,
  LAST_HIT: 32, CYCLE: 33, AMMO: 34, STOP: 35, NOTE: 36, QUEUED_JUMP: 37, DAMAGE: 38,
} as const;
export const FLOOR = 520, RADIUS = 28, BODY = 70;
const side = new Set(['run', 'climb', 'hurdles', 'push', 'duel']);
export const sideView = (spec: ActionSpec) => side.has(spec.family);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (s: State) => ({ x: s[S.X], y: s[S.Y] - 35 });
const fractional = (value: number, max: number) => ((value % max) + max) % max;
const reverse = (spec: ActionSpec) => spec.variant % 2 === 1;
const mirror = (spec: ActionSpec, x: number) => reverse(spec) ? 1000 - x : x;
export const survivalTime = (spec: ActionSpec) => spec.boss ? 7800 : spec.family === 'hurdles' || spec.family === 'flap' ? 5700 : 4700;
export const nextBeat = (s: State) => 1250 + s[S.NOTE] * 800;
export const noteLane = (s: State, index: number) => ((s[S.SEED] >>> (index % 16)) + index) % 2;
export const timingX = (s: State) => 500 + Math.sin(s[S.ANGLE]) * 330;
export const timingGoal = (spec: ActionSpec) => 420 + spec.variant % 3 * 80;

export function initialAction(spec: ActionSpec, seed: number, level: number): State {
  const s = Array(39).fill(0);
  s[S.X] = sideView(spec) ? mirror(spec, 120) : 150;
  s[S.Y] = sideView(spec) ? FLOOR : spec.family === 'flap' ? 290 : 350;
  s[S.SEED] = seed >>> 0; s[S.LEVEL] = level; s[S.HP] = spec.boss ? 3 : 2;
  s[S.FACING] = reverse(spec) ? -1 : 1; s[S.BOX_X] = mirror(spec, 420); s[S.BOX_Y] = FLOOR;
  s[S.BALL_X] = -1; s[S.ANGLE] = spec.family === 'throw' ? 37 : (seed % 24) / 10;
  s[S.POWER] = 1040; s[S.LAST_GROUND] = 0; s[S.GROUND_X] = s[S.X];
  s[S.AMMO] = 4; s[S.STOP] = -1; s[S.CYCLE] = -1;
  s[S.LAST_HIT] = -9999; s[S.DAMAGE] = -9999;
  if (spec.family === 'hurdles') s[S.X] = 210;
  if (spec.family === 'catch') s[S.Y] = FLOOR;
  if (spec.family === 'aim') { s[S.X] = 500; s[S.Y] = 330; }
  if (spec.family === 'balance') { s[S.X] = 500; s[S.Y] = 460; }
  if (spec.family === 'brake') { s[S.X] = 120; s[S.Y] = 380; }
  return s;
}

/** Rendering and collision use exactly the same geometry, including gaps and moving targets. */
export function actionWorld(spec: ActionSpec, s: State): World {
  const t = s[S.T], v = spec.variant, phase = (s[S.SEED] % 13) / 13;
  const world: World = { platforms: [], hazards: [], targets: [], goal: { x: mirror(spec, 910), y: FLOOR } };
  if (sideView(spec)) world.platforms = [{ x: 0, y: FLOOR, w: 1000 }];
  const toSide = (x: number, w: number) => reverse(spec) ? 1000 - x - w : x;
  switch (spec.family) {
    case 'run': {
      const gap = 330 + v % 3 * 35, width = 100 + (v % 2) * 20;
      world.platforms = [{ x: toSide(0, gap), y: FLOOR, w: gap }, { x: toSide(gap + width, 1000 - gap - width), y: FLOOR, w: 1000 - gap - width }];
      world.hazards = [{ x: mirror(spec, 670), y: FLOOR, radius: 30, width: 54, height: 48 }]; break;
    }
    case 'climb':
      world.platforms = [0, 1, 2, 3].map(i => ({ x: toSide(i * 250, i === 0 ? 230 : 210), y: FLOOR - i * 80, w: i === 0 ? 230 : 210 }));
      world.goal = { x: mirror(spec, 900), y: FLOOR - 240 }; break;
    case 'hurdles':
      world.hazards = Array.from({ length: spec.boss ? 5 : 3 }, (_, i) => ({ x: 980 + i * 430 - t * .31, y: (i + v) % 2 ? 480 : FLOOR,
        radius: 35, width: 68, height: (i + v) % 2 ? 105 : 48, high: !!((i + v) % 2) })); break;
    case 'collect': case 'sweep':
      world.targets = [{ x: 260, y: 180 }, { x: 590, y: 390 }, { x: 820, y: 170 }, { x: 780, y: 460 }, { x: 350, y: 420 }]
        .slice(0, spec.goal).map((p, i) => ({ x: v % 2 ? 1000 - p.x : p.x, y: clamp(p.y + Math.sin(v + i) * 22, 110, 480) }));
      world.hazards = spec.family === 'collect' ? [{ x: 490 + Math.sin(t / 600 + phase) * 60, y: 270, radius: 37 }]
        : [{ x: 500, y: 170 + v % 3 * 100, radius: 33 }]; break;
    case 'dodge':
      world.hazards = Array.from({ length: spec.boss ? 5 : 3 }, (_, i) => ({
        x: 100 + fractional(t * (.16 + i * .015) + i * 290 + v * 47, 800),
        y: 260 + Math.sin(t / (610 + i * 120) + i * 2 + phase) * 170, radius: 33 + (i % 2) * 5,
      })); break;
    case 'catch':
      world.targets = Array.from({ length: spec.goal + 1 }, (_, i) => ({ x: 200 + ((s[S.SEED] + i * 2 + v) % 3) * 300,
        y: -100 + (t - 400 - i * 1150) * .25 })); break;
    case 'aim':
      world.targets = [{ x: 610 + Math.sin(t / (900 - v % 3 * 100) + s[S.SCORE] * 2) * 170,
        y: 250 + Math.cos(t / 1000 + s[S.SCORE]) * (80 + v % 2 * 30) }]; break;
    case 'balance': break;
    case 'timing': world.goal = { x: timingGoal(spec), y: 280 }; world.targets = [{ x: timingX(s), y: 265 }]; break;
    case 'push': world.goal = { x: mirror(spec, 890), y: FLOOR }; break;
    case 'flap':
      world.gateGap = 252 - Math.min(35, s[S.LEVEL] * 5 + v % 3 * 8);
      world.hazards = Array.from({ length: spec.boss ? 4 : 3 }, (_, i) => ({ x: 1000 + i * 470 - t * .29,
        y: 285 + Math.sin(i * 1.8 + v) * 90, radius: 36, width: 72 })); break;
    case 'duel':
      world.enemy = { x: mirror(spec, 700 - Math.min(280, t * .065) + Math.sin(t / 850) * 25), y: FLOOR };
      break;
    case 'throw': world.goal = { x: 770 + v % 3 * 25, y: 305 + Math.sin(t / 1300 + v) * (v > 1 ? 26 : 0) }; break;
    case 'chase': world.enemy = { x: 600 + Math.sin(t / 1700 + v + s[S.SCORE]) * 180, y: 280 + Math.sin(t / 1300 + phase) * 130 }; break;
    case 'brake': world.goal = { x: 710 + v % 3 * 30, y: 380 }; world.hazards = [{ x: 410, y: 380, radius: 45 }]; break;
    case 'carry':
      world.goal = { x: 870, y: 300 };
      world.hazards = [{ x: 490, y: 310 + Math.sin(t / 900 + v) * 110, radius: 48 }];
      if (spec.boss) world.hazards.push({ x: 680, y: 220 + Math.cos(t / 850) * 110, radius: 42 }); break;
    case 'rhythm': break;
  }
  return world;
}

function hurt(s: number[], now: number) {
  if (now < s[S.INVULN]) return;
  s[S.HP]--; s[S.INVULN] = now + 950; s[S.DAMAGE] = now;
  if (s[S.HP] <= 0) s[S.RESULT] = -1;
}
function win(s: number[]) { if (s[S.HP] > 0) s[S.RESULT] = 1; }
function nearEnemy(spec: ActionSpec, s: State, reach: number) {
  const enemy = actionWorld(spec, s).enemy;
  return enemy && distance(center(s), { x: enemy.x, y: enemy.y - (spec.family === 'duel' ? 35 : 0) }) < reach;
}
export function actionInput(spec: ActionSpec, state: State, event: ActionControl, clock: Clock): State {
  const s = [...state], t = clock.now;
  if (s[S.RESULT]) return s;
  if (event.kind === 'stick') {
    const length = Math.max(1, Math.hypot(event.x, event.y));
    s[S.AX] = clamp(event.x / length, -1, 1); s[S.AY] = clamp(event.y / length, -1, 1);
    if (Math.abs(s[S.AX]) > .1) s[S.FACING] = Math.sign(s[S.AX]);
    return s;
  }
  const a = event.button === 'a', ready = a ? S.READY_A : S.READY_B;
  if (t < s[ready]) return s;
  s[ready] = t + 170; s[a ? S.A : S.B] = t + 400; s[S.MOVED] += 10;
  const w = actionWorld(spec, s);
  switch (spec.family) {
    case 'run': case 'climb': case 'hurdles':
      if (a) s[S.QUEUED_JUMP] = t + 150;
      else if (spec.family !== 'hurdles') { s[S.B] = t + 240; s[S.READY_B] = t + 700; }
      else s[S.B] = t + 650;
      break;
    case 'collect': case 'dodge': case 'chase':
      if (a && spec.family === 'chase') { if (nearEnemy(spec, s, 150)) { s[S.SCORE]++; s[S.LAST_HIT] = t; } }
      else if (a) { s[S.A] = t + 260; s[S.INVULN] = Math.max(s[S.INVULN], t + 380); s[S.READY_A] = t + 650; }
      else if (spec.family === 'chase') { s[S.B] = t + 260; s[S.READY_B] = t + 650; }
      else { s[S.B] = t + 550; s[S.INVULN] = Math.max(s[S.INVULN], t + 550); s[S.READY_B] = t + 1000; }
      break;
    case 'catch':
      if (a) { s[S.A] = t + 600; s[S.READY_A] = t + 260; }
      else { s[S.B] = t + 260; s[S.READY_B] = t + 650; }
      break;
    case 'aim':
      if (a) { if (distance({ x: s[S.X], y: s[S.Y] }, w.targets[0]) <= 100) { s[S.SCORE]++; s[S.LAST_HIT] = t; }
        else hurt(s, t); }
      else { const target = w.targets[0]; if (distance({ x: s[S.X], y: s[S.Y] }, target) < 220) { s[S.X] += (target.x - s[S.X]) * .5; s[S.Y] += (target.y - s[S.Y]) * .5; } s[S.B] = t + 850; }
      break;
    case 'timing':
      if (a) { s[S.READY_A] = t + 500; if (Math.abs(timingX(s) - timingGoal(spec)) < 105) { s[S.SCORE]++; s[S.LAST_HIT] = t; s[S.ANGLE] += 1.2; } else hurt(s, t); }
      else { s[S.B] = t + 750; s[S.READY_B] = t + 1300; }
      break;
    case 'balance':
      if (a) { s[S.LEAN] *= .68; s[S.READY_A] = t + 650; }
      else { s[S.B] = t + 700; s[S.READY_B] = t + 1300; }
      break;
    case 'push': {
      const toward = reverse(spec) ? -1 : 1;
      if (Math.abs(s[S.X] - s[S.BOX_X]) < 155) {
        s[S.BOX_X] = clamp(s[S.BOX_X] + toward * (a ? 88 : -65), 70, 930);
        if (a) s[S.X] += toward * 70;
      }
      break;
    }
    case 'flap': s[S.VY] = a ? -270 : 230; break;
    case 'duel': {
      const phase = fractional(t, 1600);
      if (a) { if (nearEnemy(spec, s, 180) && (!spec.boss || phase > 900 || phase < 250)) { s[S.SCORE]++; s[S.LAST_HIT] = t; } s[S.READY_A] = t + 350; }
      else { s[S.B] = t + 650; s[S.INVULN] = Math.max(s[S.INVULN], t + 650); s[S.READY_B] = t + 750; }
      break;
    }
    case 'throw':
      if (!a) { s[S.BALL_X] = -1; break; }
      if (s[S.BALL_X] >= 0) break;
      s[S.BALL_X] = 120; s[S.BALL_Y] = 455; s[S.BALL_VX] = Math.cos(s[S.ANGLE] * Math.PI / 180) * s[S.POWER];
      s[S.BALL_VY] = -Math.sin(s[S.ANGLE] * Math.PI / 180) * s[S.POWER]; s[S.AMMO] = 0;
      break;
    case 'rhythm': {
      const note = s[S.NOTE];
      if (note >= spec.goal) break;
      if (Math.abs(t - nextBeat(s)) <= 240) {
        if (Number(!a) === noteLane(s, note)) { s[S.SCORE]++; s[S.MASK] |= 1 << note; s[S.LAST_HIT] = t; }
        else hurt(s, t);
        s[S.NOTE]++;
      }
      break;
    }
    case 'brake': s[S.CARRIED] = a ? 0 : 1; s[S.A] = a ? t + 700 : 0; break;
    case 'sweep':
      for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i)) && distance(center(s), w.targets[i]) < (a ? 140 : 200)) {
        s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t;
      }
      if (!a) s[S.READY_B] = t + 1000;
      if (w.hazards.some(h => distance(center(s), h) < (a ? 75 : 110))) hurt(s, t);
      break;
    case 'carry': {
      const egg = s[S.MASK] ? { x: s[S.BOX_X], y: s[S.BOX_Y] } : { x: 150, y: 300 };
      if (a && !s[S.CARRIED] && distance(center(s), egg) < 110) s[S.CARRIED] = 1;
      if (a && s[S.CARRIED] && distance(center(s), w.goal) < 110) win(s);
      if (!a) s[S.B] = t + 900;
      break;
    }
  }
  if (['collect', 'catch', 'aim', 'timing', 'duel', 'chase', 'sweep'].includes(spec.family) && s[S.SCORE] >= spec.goal) win(s);
  return s;
}

function integrate(spec: ActionSpec, s: number[], dt: number, t: number) {
  s[S.T] = t;
  if (s[S.RESULT]) return;
  const oldX = s[S.X], oldY = s[S.Y], w = actionWorld(spec, s), boost = t < s[S.B] ? 1.7 : 1;
  if (sideView(spec)) {
    const ground = w.platforms.find(p => oldX >= p.x - 10 && oldX <= p.x + p.w + 10 && Math.abs(oldY - p.y) < 3 && s[S.VY] >= 0);
    if (ground) { s[S.LAST_GROUND] = t; s[S.GROUND_X] = oldX; }
    if (s[S.QUEUED_JUMP] > t && t - s[S.LAST_GROUND] < 110) { s[S.VY] = -650; s[S.QUEUED_JUMP] = 0; s[S.LAST_GROUND] = -1000; }
    s[S.VX] = s[S.AX] * 360 * (spec.family === 'hurdles' ? 1 : boost);
    s[S.X] = clamp(oldX + s[S.VX] * dt, 40, 960);
    s[S.VY] += 1700 * dt; s[S.Y] += s[S.VY] * dt;
    if (s[S.VY] >= 0) for (const p of w.platforms) if (s[S.X] >= p.x - 10 && s[S.X] <= p.x + p.w + 10 && oldY <= p.y + 2 && s[S.Y] >= p.y) { s[S.Y] = p.y; s[S.VY] = 0; break; }
    if (s[S.Y] > 690) { hurt(s, t); s[S.X] = s[S.GROUND_X]; s[S.Y] = Math.min(FLOOR, oldY); s[S.Y] = w.platforms.find(p => s[S.X] >= p.x && s[S.X] <= p.x + p.w)?.y ?? FLOOR; s[S.VY] = 0; }
    if (spec.family === 'push') {
      const direction = reverse(spec) ? -1 : 1;
      if (Math.abs(s[S.X] - s[S.BOX_X]) < 80 && s[S.Y] > FLOOR - 75) s[S.X] = s[S.BOX_X] - direction * 80;
      if (Math.abs(s[S.BOX_X] - w.goal.x) < 85) win(s);
    }
    const height = spec.family === 'hurdles' && t < s[S.B] ? 30 : BODY;
    for (const h of w.hazards) if (Math.abs(s[S.X] - h.x) < (h.width ?? 60) / 2 + RADIUS && s[S.Y] > h.y - (h.height ?? 50) && s[S.Y] - height < h.y) hurt(s, t);
    if (['run', 'climb'].includes(spec.family) && distance({ x: s[S.X], y: s[S.Y] }, w.goal) < 85) win(s);
    if (spec.family === 'hurdles' && t >= survivalTime(spec) && s[S.MOVED] > 10) win(s);
    if (spec.family === 'duel') {
      const cycle = Math.floor(t / 1600), phase = fractional(t, 1600);
      if (phase > 700 && phase < 1000 && s[S.CYCLE] !== cycle) {
        s[S.CYCLE] = cycle;
        if (nearEnemy(spec, s, 195) && t >= s[S.B]) hurt(s, t);
      }
    }
  } else if (spec.family === 'flap') {
    s[S.X] = clamp(oldX + s[S.AX] * 170 * dt, 130, 400);
    s[S.VY] += (480 + s[S.AY] * 350) * dt; s[S.VY] = clamp(s[S.VY], -330, 350); s[S.Y] += s[S.VY] * dt;
    if (s[S.Y] < 60 || s[S.Y] > 565) { hurt(s, t); s[S.Y] = clamp(s[S.Y], 85, 535); s[S.VY] = 0; }
    for (const gate of w.hazards) if (Math.abs(s[S.X] - gate.x) < 65 && (s[S.Y] - 45 < gate.y - w.gateGap! / 2 || s[S.Y] > gate.y + w.gateGap! / 2)) hurt(s, t);
    if (t >= survivalTime(spec)) win(s);
  } else if (spec.family === 'balance') {
    const wind = (.23 + Math.sin(t / 900 + spec.variant) * .08) * (reverse(spec) ? -1 : 1);
    s[S.LEAN] += (wind * (t < s[S.B] ? .22 : 1) + s[S.AX] * .85) * dt;
    s[S.X] = 500 + s[S.LEAN] * 100;
    s[S.Y] = 460 + Math.sin(s[S.LEAN] * .47) * s[S.LEAN] * 100;
    if (Math.abs(s[S.LEAN]) > 1) s[S.RESULT] = -1;
    else if (t >= survivalTime(spec) && s[S.MOVED] > 20) win(s);
  } else if (spec.family === 'timing') {
    s[S.ANGLE] += dt * (t < s[S.B] ? .7 : 2.7 + spec.variant % 3 * .15);
  } else if (spec.family === 'throw') {
    s[S.ANGLE] = clamp(s[S.ANGLE] + s[S.AX] * dt * 40, 18, 75);
    s[S.POWER] = clamp(s[S.POWER] - s[S.AY] * dt * 400, 650, 1250);
    if (s[S.BALL_X] >= 0) {
      const previous = { x: s[S.BALL_X], y: s[S.BALL_Y] };
      s[S.BALL_X] += s[S.BALL_VX] * dt; s[S.BALL_VY] += 900 * dt; s[S.BALL_Y] += s[S.BALL_VY] * dt;
      if (distance({ x: s[S.BALL_X], y: s[S.BALL_Y] }, w.goal) < 80 || distance(previous, w.goal) < 80) { s[S.SCORE]++; s[S.BALL_X] = -1; s[S.LAST_HIT] = t; if (s[S.SCORE] >= spec.goal) win(s); }
      else if (s[S.BALL_Y] > 510 && s[S.BALL_VY] > 0 && s[S.AMMO] === 0) { s[S.BALL_Y] = 510; s[S.BALL_VY] *= -.65; s[S.AMMO] = 1; }
      else if (s[S.BALL_X] > 1100 || s[S.BALL_Y] > 620) s[S.BALL_X] = -1;
    }
  } else if (spec.family === 'rhythm') {
    if (s[S.NOTE] < spec.goal && t > nextBeat(s) + 290) { hurt(s, t); s[S.NOTE]++; }
    if (s[S.NOTE] >= spec.goal) { if (s[S.SCORE] >= spec.goal - 1) win(s); else s[S.RESULT] = -1; }
  } else if (spec.family === 'brake') {
    s[S.VX] = s[S.CARRIED] ? s[S.AX] * 90 : (t < s[S.A] ? 390 : 230) + s[S.AX] * 70;
    s[S.X] += s[S.VX] * dt; s[S.Y] = clamp(oldY + s[S.AY] * 290 * dt, 180, 520);
    if (s[S.X] > 1020) { hurt(s, t); s[S.X] = 120; }
    if (w.hazards.some(h => distance(center(s), h) < h.radius + 26)) hurt(s, t);
    if (Math.abs(s[S.X] - w.goal.x) < 100 && s[S.CARRIED] && Math.abs(s[S.VX]) < 20) {
      if (s[S.STOP] < 0) s[S.STOP] = t;
      if (t - s[S.STOP] >= 380) win(s);
    } else s[S.STOP] = -1;
  } else {
    const speed = spec.family === 'catch' ? 580 * boost : spec.family === 'aim' ? t < s[S.B] ? 240 : 460
      : spec.family === 'collect' || spec.family === 'dodge' ? 360 * (t < s[S.A] ? 1.8 : 1)
        : spec.family === 'chase' ? 360 * boost : spec.family === 'carry' && t < s[S.B] ? 225 : 360;
    s[S.X] = clamp(oldX + s[S.AX] * speed * dt, 55, 945);
    s[S.Y] = spec.family === 'catch' ? FLOOR : clamp(oldY + s[S.AY] * speed * dt, 125, 535);
    const p = center(s);
    if (spec.family === 'collect') for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i)) && distance(p, w.targets[i]) < 78) { s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t; }
    if (spec.family === 'catch') for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i))) {
      const item = w.targets[i];
      if (item.y > 400 && item.y < 545 && Math.abs(item.x - s[S.X]) < 110 && t < s[S.A]) { s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t; }
      else if (item.y > 565) { s[S.MASK] |= 1 << i; hurt(s, t); }
    }
    if (['collect', 'dodge', 'carry'].includes(spec.family)) for (const h of w.hazards) if (distance(p, h) < h.radius + 24) {
      const hp = s[S.HP]; hurt(s, t);
      if (spec.family === 'carry' && hp !== s[S.HP] && s[S.CARRIED]) { s[S.CARRIED] = 0; s[S.MASK] = 1; s[S.BOX_X] = s[S.X]; s[S.BOX_Y] = s[S.Y] - 50; }
    }
    if (spec.family === 'carry' && s[S.CARRIED] && distance(p, w.goal) < 105) win(s);
    if (spec.family === 'dodge' && t >= survivalTime(spec) && s[S.MOVED] > 120) win(s);
    if (['collect', 'catch'].includes(spec.family) && s[S.SCORE] >= spec.goal) win(s);
  }
  s[S.MOVED] += Math.hypot(s[S.X] - oldX, s[S.Y] - oldY) + (spec.family === 'balance' ? Math.abs(s[S.AX]) * dt * 100 : 0);
}

export function actionTick(spec: ActionSpec, state: State, clock: Clock): State {
  const s = [...state];
  let from = clock.before;
  // Fixed maximum steps keep platform and projectile collisions reliable after a slow frame.
  while (from < clock.now && !s[S.RESULT]) { const end = Math.min(clock.now, from + 12); integrate(spec, s, (end - from) / 1000, end); from = end; }
  return s;
}
export function makeActionMechanic(spec: ActionSpec): Mechanic {
  return {
    layout: 'track', initial: initialAction(spec, 1, 0), initialFor: (seed, level) => initialAction(spec, seed, level),
    display: () => ({ buttons: ['←', '→', '↑', '↓', spec.a, spec.b].map(text => ({ text: typeof text === 'string' ? [text, text, text] : text })) }),
    tap: (s, index, clock) => actionInput(spec, s, index < 4 ? { kind: 'stick', x: index === 0 ? -1 : index === 1 ? 1 : 0, y: index === 2 ? -1 : index === 3 ? 1 : 0 }
      : { kind: 'button', button: index === 4 ? 'a' : 'b' }, clock),
    control: (s, input, clock) => actionInput(spec, s, input, clock),
    tick: (s, clock) => actionTick(spec, s, clock),
    result: s => s[S.RESULT] > 0 ? 'clear' : s[S.RESULT] < 0 ? 'mistake' : undefined,
  };
}
