import { clamp, type Clock, type Mechanic, type State } from '../originals/model';
import type { ActionControl, ActionSpec, Point, World } from './types';

export const S = {
  T: 0, X: 1, Y: 2, VX: 3, VY: 4, AX: 5, AY: 6, HP: 7, SCORE: 8, SEED: 9, LEVEL: 10,
  MASK: 11, A: 12, B: 13, READY_A: 14, READY_B: 15, FACING: 16, BOX_X: 17, BOX_Y: 18,
  BALL_X: 19, BALL_Y: 20, BALL_VX: 21, BALL_VY: 22, CARRIED: 23, LEAN: 24, ANGLE: 25,
  POWER: 26, INVULN: 27, LAST_GROUND: 28, GROUND_X: 29, RESULT: 30, MOVED: 31,
  LAST_HIT: 32, CYCLE: 33, AMMO: 34, STOP: 35, NOTE: 36, QUEUED_JUMP: 37, DAMAGE: 38,
  PHASE: 39, PROGRESS: 40, TENSION: 41, EVENT: 42, TARGET: 43, COMBO: 44,
} as const;
export const FLOOR = 520, RADIUS = 28, BODY = 70;
const side = new Set(['run', 'climb', 'hurdles', 'push', 'duel', 'parry', 'grapple']);
export const sideView = (spec: ActionSpec) => side.has(spec.family);
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (s: State) => ({ x: s[S.X], y: s[S.Y] - 35 });
const fractional = (value: number, max: number) => ((value % max) + max) % max;
const reverse = (spec: ActionSpec) => spec.variant % 2 === 1;
const mirror = (spec: ActionSpec, x: number) => reverse(spec) ? 1000 - x : x;
export const survivalTime = (spec: ActionSpec) => spec.boss ? 7800 : spec.family === 'hurdles' || spec.family === 'flap' ? 5700 : 4700;
export const beatTime = (s: State, note: number) => 1250 - s[S.LEVEL] * 25 + note * (800 - s[S.LEVEL] * 35);
export const nextBeat = (s: State) => beatTime(s, s[S.NOTE]);
export const tierOf = (spec: ActionSpec) => spec.tier ?? 0;
export const aimRadius = (spec: ActionSpec) => 100 - tierOf(spec) * 7;
export const timingWindow = (spec: ActionSpec) => 105 - tierOf(spec) * 5;
export const duelPeriod = (spec: ActionSpec) => 1600 - tierOf(spec) * 70;
export const duelPhase = (spec: ActionSpec, t: number) => (t % duelPeriod(spec)) / duelPeriod(spec) * 1600;
export const parryPeriod = (spec: ActionSpec) => 1500 - tierOf(spec) * 65;
export const parryPhase = (spec: ActionSpec, t: number) => (t % parryPeriod(spec)) / parryPeriod(spec) * 1500;
export const parryWindow = (spec: ActionSpec) => [420 + tierOf(spec) * 22, 1000 - tierOf(spec) * 35];
export const fishingWindow = (spec: ActionSpec) => 150 - tierOf(spec) * 15;
export const soccerGoalHalfHeight = (spec: ActionSpec) => 105 - tierOf(spec) * 10;
export const parkingHalfWidth = (spec: ActionSpec) => 100 - tierOf(spec) * 10;
export const pitchPeriod = (s: State) => 1600 - s[S.LEVEL] * 80;
const offset = (spec: ActionSpec, s: State, salt: number, range: number) => {
  const hash = (Math.imul(s[S.SEED] ^ spec.variant ^ salt, 1103515245) + 12345) >>> 0;
  return ((hash % 2001) / 1000 - 1) * range * tierOf(spec) / 4;
};
export const noteLane = (s: State, index: number) => ((s[S.SEED] >>> (index % 16)) + index) % 2;
export const timingX = (s: State) => 500 + Math.sin(s[S.ANGLE]) * 330;
export const timingGoal = (spec: ActionSpec) => 420 + spec.variant % 3 * 80 + tierOf(spec) * 8;

export function initialAction(spec: ActionSpec, seed: number, level: number): State {
  const s = Array(45).fill(0);
  s[S.X] = sideView(spec) ? mirror(spec, 120) : 150;
  s[S.Y] = sideView(spec) ? FLOOR : spec.family === 'flap' ? 290 : 350;
  s[S.SEED] = seed >>> 0; s[S.LEVEL] = spec.tier ?? level; s[S.HP] = spec.boss ? 3 : 2;
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
  if (['bat', 'rally', 'volley', 'fishing', 'kart'].includes(spec.family)) { s[S.X] = 500; s[S.Y] = 520; }
  if (spec.family === 'soccer') { s[S.X] = 130; s[S.Y] = 330; s[S.CARRIED] = 1; s[S.BALL_X] = 165; s[S.BALL_Y] = 295; }
  if (spec.family === 'golf') { s[S.X] = 120; s[S.Y] = 520; s[S.ANGLE] = 300; }
  if (spec.family === 'parry') { s[S.X] = 360; s[S.Y] = FLOOR; }
  if (spec.family === 'grapple') { s[S.X] = 120; s[S.Y] = FLOOR; }
  if (spec.family === 'volley') { s[S.BALL_X] = 450 + spec.variant % 3 * 50; s[S.BALL_Y] = 100; }
  if (spec.family === 'mining') s[S.AMMO] = 0;
  const tier = tierOf(spec);
  if (tier) {
    if (spec.family === 'balance') { s[S.BOX_X] = 500 + offset(spec, s, 11, 90); s[S.X] = s[S.BOX_X]; s[S.LEAN] = offset(spec, s, 12, .18); }
    if (spec.family === 'push') s[S.BOX_X] = mirror(spec, 420 + offset(spec, s, 13, 55));
    if (spec.family === 'carry') { s[S.MASK] = 1; s[S.BOX_X] = 150 + offset(spec, s, 14, 55); s[S.BOX_Y] = 300 + offset(spec, s, 15, 40); }
    if (spec.family === 'soccer') { s[S.Y] += offset(spec, s, 16, 45); s[S.BALL_Y] = s[S.Y] - 35; }
    if (spec.family === 'volley') s[S.BALL_X] += offset(spec, s, 17, 65);
  }
  s[S.EVENT] = -1;
  return s;
}

export const CROSSOVER_FAMILIES = new Set(['bat', 'rally', 'soccer', 'golf', 'kart', 'parry', 'grapple', 'fishing', 'mining', 'volley']);
export const fishX = (s: State, spec: ActionSpec) => 500 + Math.sin(s[S.T] / (1000 + spec.variant % 3 * 150 - tierOf(spec) * 60) + spec.variant) * (260 + tierOf(spec) * 12);
export const pitchBall = (s: State, spec: ActionSpec): Point => {
  const period = pitchPeriod(s), cycle = Math.floor(s[S.T] / period), phase = fractional(s[S.T], period);
  const x = 500 + Math.sin(cycle * 2.1 + spec.variant) * (230 + s[S.LEVEL] * 5);
  return s[S.CYCLE] === cycle ? { x: x + (phase - s[S.LAST_HIT] % period) * .28, y: 430 - (phase - s[S.LAST_HIT] % period) * (spec.family === 'bat' && s[S.TARGET] ? .18 : s[S.TARGET] ? .9 : .65) }
    : { x, y: 50 + phase * .38 * 1600 / period };
};
export const golfMeter = (s: State) => s[S.PHASE] === 1 ? 1 - Math.abs(1 - fractional((s[S.T] - s[S.STOP]) / (850 - s[S.LEVEL] * 55), 2))
  : s[S.PHASE] === 2 ? (Math.sin((s[S.T] - s[S.STOP]) / (180 - s[S.LEVEL] * 15)) + 1) / 2 : 0;

/** Rendering and collision use exactly the same geometry, including gaps and moving targets. */
export function actionWorld(spec: ActionSpec, s: State): World {
  const t = s[S.T], v = spec.variant, level = tierOf(spec), phase = (s[S.SEED] % 13) / 13;
  const shift = (salt: number, range: number) => offset(spec, s, salt, range);
  const world: World = { platforms: [], hazards: [], targets: [], goal: { x: mirror(spec, 910), y: FLOOR } };
  if (sideView(spec)) world.platforms = [{ x: 0, y: FLOOR, w: 1000 }];
  const toSide = (x: number, w: number) => reverse(spec) ? 1000 - x - w : x;
  const pickups = (points: Point[]) => points.slice(0, spec.goal).map((p, i) => ({
    x: clamp((v % 2 ? 1000 - p.x : p.x) + shift(40 + i, 42), 100, 900),
    y: clamp(p.y + Math.sin(v + i) * 22 + shift(50 + i, 30), 120, 480),
  }));
  switch (spec.family) {
    case 'run': {
      const gap = 330 + v % 3 * 35 + shift(1, 22), width = 100 + (v % 2) * 20 + level * 8;
      world.platforms = [{ x: toSide(0, gap), y: FLOOR, w: gap }, { x: toSide(gap + width, 1000 - gap - width), y: FLOOR, w: 1000 - gap - width }];
      world.hazards = [{ x: mirror(spec, 670 + shift(2, 32)), y: FLOOR, radius: 30, width: 54 + level * 3, height: 48 + level * 3 }]; break;
    }
    case 'climb':
      world.platforms = [0, 1, 2, 3].map(i => { const width = (i === 0 ? 230 : 210) - level * 5; return { x: toSide(i * 250, width), y: FLOOR - i * (80 + level * 4), w: width }; });
      world.goal = { x: mirror(spec, 900), y: FLOOR - 3 * (80 + level * 4) }; break;
    case 'hurdles':
      world.hazards = Array.from({ length: (spec.boss ? 5 : 3) + Number(level >= 2) }, (_, i) => ({ x: 980 - level * 28 + i * (430 - level * 22) - t * (.31 + level * .012), y: (i + v) % 2 ? 480 : FLOOR,
        radius: 35, width: 68 + level * 2, height: (i + v) % 2 ? 105 : 48, high: !!((i + v) % 2) })); break;
    case 'collect': case 'sweep':
      world.targets = pickups([{ x: 260, y: 180 }, { x: 590, y: 390 }, { x: 820, y: 170 }, { x: 780, y: 460 }, { x: 350, y: 420 }, {x:150,y:450}]);
      world.hazards = spec.family === 'collect' ? [{ x: 490 + Math.sin(t / (600 - level * 35) + phase) * (60 + level * 8), y: 270 + shift(3, 35), radius: 37 + level * 2 }]
        : [{ x: 500 + shift(4, 35), y: 170 + v % 3 * 100, radius: 33 + level * 2 }]; break;
    case 'dodge':
      world.hazards = Array.from({ length: (spec.boss ? 5 : 3) + Math.floor(level / 2) }, (_, i) => ({
        x: 100 + fractional(t * (.16 + i * .015 + level * .012) + i * 290 + v * 47, 800),
        y: 250 + Math.sin(t / (610 + i * 120 - level * 30) + i * 2 + phase) * 170, radius: 33 + (i % 2) * 5 + level * 1.5,
      })); break;
    case 'catch':
      world.targets = Array.from({ length: spec.goal + 1 }, (_, i) => ({ x: 200 + ((s[S.SEED] + i * 2 + v) % 3) * 300 + shift(60 + i, 50),
        y: -100 + (t - 400 - i * (1150 - level * 40)) * (.25 + level * .008) })); break;
    case 'aim':
      world.targets = [{ x: 610 + shift(5, 28) + Math.sin(t / (900 - v % 3 * 100 - level * 35) + s[S.SCORE] * 2) * 170,
        y: 250 + Math.cos(t / (1000 - level * 45) + s[S.SCORE]) * (80 + v % 2 * 30 + level * 6) }]; break;
    case 'balance': world.goal = { x: level ? s[S.BOX_X] : 500, y: 460 }; break;
    case 'timing': world.goal = { x: timingGoal(spec), y: 280 }; world.targets = [{ x: timingX(s), y: 265 }]; break;
    case 'push': world.goal = { x: mirror(spec, 890 + shift(6, 25)), y: FLOOR }; break;
    case 'flap':
      world.gateGap = 252 - level * 13 - v % 3 * 8;
      world.hazards = Array.from({ length: spec.boss ? 4 : 3 }, (_, i) => ({ x: 1000 + i * (470 - level * 12) - t * (.29 + level * .008),
        y: 285 + Math.sin(i * 1.8 + v) * (90 + level * 5), radius: 36, width: 72 })); break;
    case 'duel':
      world.enemy = { x: mirror(spec, 700 + shift(7, 30) - Math.min(280, t * (.065 + level * .008)) + Math.sin(t / 850) * 25), y: FLOOR }; break;
    case 'throw': world.goal = { x: 770 + v % 3 * 25 + shift(8, 18), y: 305 + Math.sin(t / (1300 - level * 80) + v) * (v > 1 ? 26 : 0) }; break;
    case 'chase': world.enemy = { x: 600 + shift(9, 25) + Math.sin(t / (1700 - level * 70) + v + s[S.SCORE]) * (180 + level * 10), y: 280 + Math.sin(t / (1300 - level * 60) + phase) * (130 + level * 5) }; break;
    case 'brake': world.goal = { x: 710 + v % 3 * 30 + shift(10, 35), y: 380 }; world.hazards = [{ x: 410 + shift(11, 45), y: 380 + Math.sin(t / 800) * level * 8, radius: 45 + level * 3 }]; break;
    case 'carry':
      world.goal = { x: 870 + shift(12, 30), y: 300 + shift(13, 45) };
      world.hazards = [{ x: 490, y: 310 + Math.sin(t / (900 - level * 55) + v) * 110, radius: 48 + level * 2 }];
      if (spec.boss || level >= 3) world.hazards.push({ x: 680, y: 300 + Math.cos(t / 850) * 95, radius: 42 + level * 2 }); break;
    case 'rhythm': world.targets = [{ x: 350 + level * 12, y: 470 }, { x: 650 - level * 12, y: 470 }]; break;
    case 'bat': case 'rally': world.targets = [pitchBall(s, spec)]; world.goal = { x: s[S.X], y: 465 }; break;
    case 'soccer':
      world.goal = { x: 935, y: 220 + v % 3 * 80 + shift(14, 25) };
      world.enemy = { x: 850, y: world.goal.y + Math.sin(t / (650 - level * 45) + v) * 95 };
      world.hazards = [{ x: 500 + shift(15, 35), y: 300 + Math.sin(t / (700 - level * 40) + v) * 140, radius: 40 + level * 2 }];
      if (level >= 3) world.hazards.push({x:650,y:360+Math.sin(t/900)*60,radius:35}); break;
    case 'golf': world.goal = { x: 850 + shift(16, 30), y: 250 + v % 3 * 50 + shift(17, 25) }; break;
    case 'kart':
      world.goal = { x: 500, y: 50 };
      world.hazards = Array.from({ length: 5 + Math.floor(level / 2) }, (_, i) => ({ x: 230 + ((i + v) % 3) * 270 + shift(70 + i, 25), y: -300 + i * (300 - level * 20) + fractional(s[S.PROGRESS], 1500), radius: 48 + level * 2.5 })); break;
    case 'parry': world.enemy = { x: 650 + shift(18, 45), y: FLOOR }; break;
    case 'grapple':
      world.platforms = [{ x: 0, y: FLOOR, w: 220 - level * 10 }, { x: 830 + level * 5, y: FLOOR, w: 170 - level * 5 }];
      world.targets = [{ x: 330 + shift(19, 20), y: 150 + Math.abs(shift(20, 25)) }, { x: 610 + shift(21, 35), y: 130 + v % 3 * 25 + shift(22, 25) }, { x: 900, y: 160 + shift(23, 30) }];
      world.goal = { x: 900, y: FLOOR }; break;
    case 'fishing': world.targets = [{ x: fishX(s, spec), y: 310 }]; world.goal = { x: s[S.X], y: 310 }; break;
    case 'mining':
      world.targets = pickups([{ x: 260, y: 200 }, { x: 600, y: 400 }, { x: 820, y: 180 }, { x: 780, y: 460 }, {x:350,y:430}]);
      world.hazards = [{ x: 490 + Math.sin(t / (800 - level * 40)) * 70, y: 300, radius: 37 + level * 2.5 }]; break;
    case 'volley': world.targets = [{ x: s[S.BALL_X], y: s[S.BALL_Y] }]; world.goal = { x: 500, y: 160 }; break;
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
  const s = [...state], t = clock.now, level = tierOf(spec);
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
  if (CROSSOVER_FAMILIES.has(spec.family)) return crossoverInput(spec, s, a, t, w);
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
      if (a) { if (distance({ x: s[S.X], y: s[S.Y] }, w.targets[0]) <= aimRadius(spec)) { s[S.SCORE]++; s[S.LAST_HIT] = t; }
        else hurt(s, t); }
      else { const target = w.targets[0]; if (distance({ x: s[S.X], y: s[S.Y] }, target) < 220) { s[S.X] += (target.x - s[S.X]) * .5; s[S.Y] += (target.y - s[S.Y]) * .5; } s[S.B] = t + 850; }
      break;
    case 'timing':
      if (a) { s[S.READY_A] = t + 500; if (Math.abs(timingX(s) - timingGoal(spec)) < timingWindow(spec)) { s[S.SCORE]++; s[S.LAST_HIT] = t; s[S.ANGLE] += 1.2; } else hurt(s, t); }
      else { s[S.B] = t + 750; s[S.READY_B] = t + 1300; }
      break;
    case 'balance':
      if (a) { s[S.LEAN] *= .68; s[S.READY_A] = t + 650; }
      else { s[S.B] = t + 700; s[S.READY_B] = t + 1300; }
      break;
    case 'push': {
      const toward = reverse(spec) ? -1 : 1;
      if (Math.abs(s[S.X] - s[S.BOX_X]) < 155) {
        s[S.BOX_X] = clamp(s[S.BOX_X] + toward * (a ? 88 - level * 5 : -65), 70, 930);
        if (a) s[S.X] += toward * (70 - level * 4);
      }
      break;
    }
    case 'flap': s[S.VY] = a ? -270 : 230; break;
    case 'duel': {
      const phase = duelPhase(spec, t);
      if (a) { if (nearEnemy(spec, s, 180 - level * 8) && (!spec.boss || phase > 900 || phase < 250)) { s[S.SCORE]++; s[S.LAST_HIT] = t; } s[S.READY_A] = t + 350; }
      else { s[S.B] = t + 650 - level * 50; s[S.INVULN] = Math.max(s[S.INVULN], s[S.B]); s[S.READY_B] = t + 750; }
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
      if (Math.abs(t - nextBeat(s)) <= 240 - level * 22) {
        if (Number(!a) === noteLane(s, note)) { s[S.SCORE]++; s[S.MASK] |= 1 << note; s[S.LAST_HIT] = t; }
        else hurt(s, t);
        s[S.NOTE]++;
      }
      break;
    }
    case 'brake': s[S.CARRIED] = a ? 0 : 1; s[S.A] = a ? t + 700 : 0; break;
    case 'sweep':
      for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i)) && distance(center(s), w.targets[i]) < (a ? 140 - level * 5 : 200 - level * 8)) {
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

function crossoverInput(spec: ActionSpec, s: number[], a: boolean, t: number, w: World): State {
  const level = tierOf(spec);
  switch (spec.family) {
    case 'bat': case 'rally': {
      const cycle = Math.floor(t / pitchPeriod(s)), ball = pitchBall(s, spec);
      s[a ? S.READY_A : S.READY_B] = t + 360;
      if (s[S.CYCLE] !== cycle && ball.y > (a ? 385 + level * 10 : 345 + level * 7) && ball.y < 560 - level * 7 && Math.abs(ball.x - s[S.X]) < (a ? 150 - level * 10 : 210 - level * 15)) {
        s[S.CYCLE] = cycle; s[S.SCORE]++; s[S.LAST_HIT] = t; s[S.TARGET] = a ? 0 : 1;
      }
      break;
    }
    case 'soccer':
      if (a && s[S.CARRIED]) { s[S.CARRIED] = 0; s[S.STOP] = t; s[S.BALL_X] = s[S.X] + 35; s[S.BALL_Y] = s[S.Y] - 35; s[S.BALL_VX] = 850; s[S.BALL_VY] = s[S.AY] * 250; }
      else if (!a) { s[S.B] = t + 320; s[S.READY_B] = t + 700; }
      break;
    case 'golf':
      if (!a) { s[S.PHASE] = 0; s[S.BALL_X] = -1; break; }
      if (s[S.PHASE] === 0) { s[S.PHASE] = 1; s[S.STOP] = t; }
      else if (s[S.PHASE] === 1) { s[S.POWER] = golfMeter(s); s[S.PHASE] = 2; s[S.STOP] = t; }
      else if (s[S.PHASE] === 2) { s[S.AMMO] = golfMeter(s); s[S.PHASE] = 3; s[S.BALL_X] = 140; s[S.BALL_Y] = 470; s[S.PROGRESS] = 0; s[S.LAST_HIT] = t; }
      break;
    case 'kart':
      s[a ? S.A : S.B] = t + (a ? 650 : 500); s[a ? S.READY_A : S.READY_B] = t + (a ? 950 : 170); break;
    case 'parry': {
      const phase = parryPhase(spec, t), [from, until] = parryWindow(spec);
      if (!a) { s[S.B] = t + 500 - level * 40; s[S.READY_B] = t + 650; if (phase > from && phase < until) { s[S.COMBO] = t + 1100 - level * 100; s[S.INVULN] = t + 800; s[S.LAST_HIT] = t; } }
      else if (Math.abs(s[S.X] - w.enemy!.x) < 220 - level * 12 && s[S.COMBO] > t) { s[S.SCORE]++; s[S.COMBO] = 0; s[S.LAST_HIT] = t; s[S.READY_A] = t + 450; }
      break;
    }
    case 'grapple': {
      if (!a) { s[S.PHASE] = 0; s[S.VY] = -280; s[S.VX] = 400; break; }
      const target = w.targets.find(p => p.x > s[S.X] + 65 && distance(p, { x: s[S.X], y: s[S.Y] - 70 }) < 520 - level * 25);
      if (target) { s[S.BALL_X] = target.x; s[S.BALL_Y] = target.y; s[S.PHASE] = 1; s[S.READY_A] = t + 300; }
      break;
    }
    case 'fishing':
      if (!a) { s[S.TENSION] = Math.max(0, s[S.TENSION] - .55); s[S.READY_B] = t + 350; }
      else { s[S.READY_A] = t + 380; s[S.TENSION] += Math.abs(s[S.X] - fishX(s, spec)) < fishingWindow(spec) ? .27 + level * .018 : .42;
        if (Math.abs(s[S.X] - fishX(s, spec)) < fishingWindow(spec)) { s[S.PROGRESS] += .23 - level * .015; s[S.LAST_HIT] = t; }
        if (s[S.TENSION] > 1) { hurt(s, t); s[S.TENSION] = .35; }
        if (s[S.PROGRESS] >= 1) win(s); }
      break;
    case 'mining':
      for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & 1 << i) && distance(center(s), w.targets[i]) < (a ? 155 - level * 8 : 220 - level * 15)) {
        if (!a || s[S.AMMO] & 1 << i) { s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t; }
        else s[S.AMMO] |= 1 << i;
      }
      s[a ? S.READY_A : S.READY_B] = t + (a ? 220 : 950); break;
    case 'volley':
      if (a && s[S.PHASE] === 0 && s[S.BALL_Y] > 335 + level * 10 && s[S.BALL_Y] < 560 - level * 6 && Math.abs(s[S.BALL_X] - s[S.X]) < 165 - level * 10) {
        s[S.PHASE] = 1; s[S.BALL_VY] = -620; s[S.LAST_HIT] = t; s[S.VY] = -310;
      } else if (!a && s[S.PHASE] === 1 && s[S.BALL_Y] < 365 - level * 15) { s[S.SCORE]++; s[S.PHASE] = 2; s[S.STOP] = t; s[S.BALL_VY] = -500; s[S.LAST_HIT] = t; }
      break;
  }
  if (['bat', 'rally', 'soccer', 'parry', 'mining'].includes(spec.family) && s[S.SCORE] >= spec.goal) win(s);
  return s;
}
function integrateCrossover(spec: ActionSpec, s: number[], dt: number, t: number, w: World) {
  const f = spec.family, level = tierOf(spec);
  if (['bat', 'rally', 'volley', 'fishing', 'kart'].includes(f)) s[S.X] = clamp(s[S.X] + s[S.AX] * (f === 'kart' ? 560 : 650) * dt, 100, 900);
  if (f === 'bat' || f === 'rally') {
    const cycle = Math.floor(t / pitchPeriod(s));
    if (fractional(t, pitchPeriod(s)) > pitchPeriod(s) - 140 && s[S.CYCLE] !== cycle && s[S.EVENT] !== cycle) { s[S.EVENT] = cycle; hurt(s, t); }
  } else if (f === 'soccer' || f === 'mining') {
    const boost = f === 'soccer' && t < s[S.B] ? 1.8 : 1;
    s[S.X] = clamp(s[S.X] + s[S.AX] * 390 * boost * dt, 60, 880); s[S.Y] = clamp(s[S.Y] + s[S.AY] * 390 * boost * dt, 130, 535);
    for (const h of w.hazards) if (distance(center(s), h) < h.radius + 23) hurt(s, t);
    if (f === 'soccer') {
      if (s[S.CARRIED]) { s[S.BALL_X] = s[S.X] + 35; s[S.BALL_Y] = s[S.Y] - 35; }
      else { s[S.BALL_X] += s[S.BALL_VX] * dt; s[S.BALL_Y] += s[S.BALL_VY] * dt;
        if (distance({ x: s[S.BALL_X], y: s[S.BALL_Y] }, w.enemy!) < 65 + level * 3) { s[S.BALL_VX] = -250; s[S.BALL_VY] = 80; }
        if (s[S.BALL_X] > 910) { if (Math.abs(s[S.BALL_Y] - w.goal.y) < soccerGoalHalfHeight(spec)) { s[S.SCORE]++; s[S.LAST_HIT] = t; if (s[S.SCORE] >= spec.goal) win(s); } s[S.CARRIED] = 1; }
        else if (s[S.BALL_X] < 40 || s[S.BALL_Y] < 50 || s[S.BALL_Y] > 570 || t - s[S.STOP] > 300 && distance(center(s), { x: s[S.BALL_X], y: s[S.BALL_Y] }) < 75) s[S.CARRIED] = 1;
      }
    }
  } else if (f === 'golf') {
    s[S.ANGLE] = clamp(s[S.ANGLE] + s[S.AX] * 190 * dt, 130, 480);
    if (s[S.PHASE] === 3) {
      s[S.PROGRESS] = Math.min(1, s[S.PROGRESS] + dt * 1.25);
      const p = s[S.PROGRESS], landingX = 140 + s[S.POWER] * 1000;
      s[S.BALL_X] = 140 + (landingX - 140) * p; s[S.BALL_Y] = 470 + (s[S.ANGLE] - 470) * p - Math.sin(p * Math.PI) * 240;
      if (p >= 1) { if (Math.abs(landingX - w.goal.x) < 145 - level * 16 && Math.abs(s[S.ANGLE] - w.goal.y) < 95 - level * 10 && Math.abs(s[S.AMMO] - .5) < .3 - level * .035) win(s);
        else { hurt(s, t); s[S.PHASE] = 0; s[S.BALL_X] = -1; } }
    }
  } else if (f === 'kart') {
    if (s[S.MOVED] > 10) s[S.PROGRESS] += dt * (t < s[S.B] ? 120 : t < s[S.A] ? 620 : 310);
    for (const h of w.hazards) if (distance({ x: s[S.X], y: 465 }, h) < h.radius + 37) hurt(s, t);
    if (s[S.PROGRESS] >= 1500 * spec.goal) win(s);
  } else if (f === 'parry') {
    s[S.X] = clamp(s[S.X] + s[S.AX] * 380 * dt, 100, 700);
    const cycle = Math.floor(t / parryPeriod(spec)), phase = parryPhase(spec, t);
    if (phase > 900 && phase < 1120 && s[S.EVENT] !== cycle) { s[S.EVENT] = cycle; if (Math.abs(s[S.X] - w.enemy!.x) < 250 && t > s[S.B]) hurt(s, t); }
  } else if (f === 'grapple') {
    if (s[S.PHASE] === 1) { const dx = s[S.BALL_X] - s[S.X], dy = s[S.BALL_Y] + 100 - s[S.Y], len = Math.hypot(dx, dy); const amount = Math.min(len, 700 * dt);
      s[S.X] += dx / Math.max(1, len) * amount; s[S.Y] += dy / Math.max(1, len) * amount; s[S.VY] = 0;
      if (len < 12 && s[S.BALL_X] > 830) s[S.PHASE] = 0;
    } else {
      const oldY = s[S.Y]; s[S.X] = clamp(s[S.X] + (s[S.AX] * 340 + s[S.VX] * .4) * dt, 50, 950); s[S.VX] *= Math.max(0, 1 - dt * 3); s[S.VY] += 1300 * dt; s[S.Y] += s[S.VY] * dt;
      if (s[S.VY] >= 0) for (const p of w.platforms) if (s[S.X] >= p.x && s[S.X] <= p.x + p.w && oldY <= p.y + 2 && s[S.Y] >= p.y) { s[S.Y] = p.y; s[S.VY] = 0; }
      if (s[S.Y] > 690) { hurt(s, t); s[S.X] = 120; s[S.Y] = FLOOR; s[S.VY] = 0; }
      if (s[S.X] > 850 && Math.abs(s[S.Y] - FLOOR) < 5) win(s);
    }
  } else if (f === 'fishing') s[S.TENSION] = Math.max(0, s[S.TENSION] - dt * .035);
  else if (f === 'volley') {
    if (s[S.PHASE] === 2 && s[S.SCORE] >= spec.goal && t - s[S.STOP] > 350) { win(s); return; }
    if (s[S.PHASE] === 2 && t - s[S.STOP] > 550) { s[S.PHASE] = 0; s[S.BALL_X] = 300 + ((s[S.SCORE] + spec.variant) % 3) * 200 + offset(spec, s, 80 + s[S.SCORE], 45); s[S.BALL_Y] = 90; s[S.BALL_VY] = 0; }
    s[S.BALL_VY] += dt * (s[S.PHASE] === 2 ? 0 : 530 + level * 30); s[S.BALL_Y] += s[S.BALL_VY] * dt;
    if (s[S.BALL_Y] > 590) { hurt(s, t); s[S.PHASE] = 0; s[S.BALL_Y] = 100; s[S.BALL_VY] = 0; }
    if (s[S.Y] < FLOOR || s[S.VY] < 0) { s[S.VY] += dt * 1000; s[S.Y] = Math.min(FLOOR, s[S.Y] + s[S.VY] * dt); }
  }
}

function integrate(spec: ActionSpec, s: number[], dt: number, t: number) {
  s[S.T] = t;
  if (s[S.RESULT]) return;
  const level = tierOf(spec), oldX = s[S.X], oldY = s[S.Y], w = actionWorld(spec, s), boost = t < s[S.B] ? 1.7 : 1;
  if (CROSSOVER_FAMILIES.has(spec.family)) { integrateCrossover(spec, s, dt, t, w); s[S.MOVED] += Math.hypot(s[S.X] - oldX, s[S.Y] - oldY); return; }
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
      const cycle = Math.floor(t / duelPeriod(spec)), phase = duelPhase(spec, t);
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
    const wind = (.23 + level * .025 + Math.sin(t / (900 - level * 40) + spec.variant) * (.08 + level * .01)) * (reverse(spec) ? -1 : 1);
    s[S.LEAN] += (wind * (t < s[S.B] ? .22 : 1) + s[S.AX] * .85) * dt;
    s[S.X] = w.goal.x + s[S.LEAN] * 100;
    s[S.Y] = 460 + Math.sin(s[S.LEAN] * .47) * s[S.LEAN] * 100;
    if (Math.abs(s[S.LEAN]) > 1 - level * .06) s[S.RESULT] = -1;
    else if (t >= survivalTime(spec) && s[S.MOVED] > 20) win(s);
  } else if (spec.family === 'timing') {
    s[S.ANGLE] += dt * (t < s[S.B] ? .7 : 2.7 + spec.variant % 3 * .15 + level * .18);
  } else if (spec.family === 'throw') {
    s[S.ANGLE] = clamp(s[S.ANGLE] + s[S.AX] * dt * 40, 18, 75);
    s[S.POWER] = clamp(s[S.POWER] - s[S.AY] * dt * 400, 650, 1250);
    if (s[S.BALL_X] >= 0) {
      const previous = { x: s[S.BALL_X], y: s[S.BALL_Y] };
      s[S.BALL_X] += s[S.BALL_VX] * dt; s[S.BALL_VY] += 900 * dt; s[S.BALL_Y] += s[S.BALL_VY] * dt;
      if (distance({ x: s[S.BALL_X], y: s[S.BALL_Y] }, w.goal) < 80 - level * 6 || distance(previous, w.goal) < 80 - level * 6) { s[S.SCORE]++; s[S.BALL_X] = -1; s[S.LAST_HIT] = t; if (s[S.SCORE] >= spec.goal) win(s); }
      else if (s[S.BALL_Y] > 510 && s[S.BALL_VY] > 0 && s[S.AMMO] === 0) { s[S.BALL_Y] = 510; s[S.BALL_VY] *= -.65; s[S.AMMO] = 1; }
      else if (s[S.BALL_X] > 1100 || s[S.BALL_Y] > 620) s[S.BALL_X] = -1;
    }
  } else if (spec.family === 'rhythm') {
    if (s[S.NOTE] < spec.goal && t > nextBeat(s) + 290 - level * 22) { hurt(s, t); s[S.NOTE]++; }
    if (s[S.NOTE] >= spec.goal) { if (s[S.SCORE] >= spec.goal - 1) win(s); else s[S.RESULT] = -1; }
  } else if (spec.family === 'brake') {
    s[S.VX] = s[S.CARRIED] ? s[S.AX] * 90 : (t < s[S.A] ? 390 : 230) + s[S.AX] * 70;
    s[S.X] += s[S.VX] * dt; s[S.Y] = clamp(oldY + s[S.AY] * 290 * dt, 180, 520);
    if (s[S.X] > 1020) { hurt(s, t); s[S.X] = 120; }
    if (w.hazards.some(h => distance(center(s), h) < h.radius + 26)) hurt(s, t);
    if (Math.abs(s[S.X] - w.goal.x) < parkingHalfWidth(spec) && s[S.CARRIED] && Math.abs(s[S.VX]) < 20) {
      if (s[S.STOP] < 0) s[S.STOP] = t;
      if (t - s[S.STOP] >= 380 + level * 30) win(s);
    } else s[S.STOP] = -1;
  } else {
    const speed = spec.family === 'catch' ? 580 * boost : spec.family === 'aim' ? t < s[S.B] ? 240 : 460
      : spec.family === 'collect' || spec.family === 'dodge' ? 360 * (t < s[S.A] ? 1.8 : 1)
        : spec.family === 'chase' ? 360 * boost : spec.family === 'carry' && t < s[S.B] ? 225 : 360;
    s[S.X] = clamp(oldX + s[S.AX] * speed * dt, 55, 945);
    s[S.Y] = spec.family === 'catch' ? FLOOR : clamp(oldY + s[S.AY] * speed * dt, 125, 535);
    const p = center(s);
    if (spec.family === 'collect') for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i)) && distance(p, w.targets[i]) < 78 - level * 4) { s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t; }
    if (spec.family === 'catch') for (let i = 0; i < w.targets.length; i++) if (!(s[S.MASK] & (1 << i))) {
      const item = w.targets[i];
      if (item.y > 400 && item.y < 545 && Math.abs(item.x - s[S.X]) < 110 - level * 5 && t < s[S.A]) { s[S.MASK] |= 1 << i; s[S.SCORE]++; s[S.LAST_HIT] = t; }
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
