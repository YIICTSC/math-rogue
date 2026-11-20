import { newInstruments, type Instruments } from './instruments';
import { cruiseRate, onStrip, runwayOffset, surfaceHeight, type Route } from './routes';
import { RUNWAY, type Lesson, type Point, type Position } from './courses';
import { clamp, groundHeight, hitsBuilding, SEA_LEVEL } from './terrain';

export interface FlightInput {
  missile?: boolean;
  turn: number;
  pitch: number;
  primary: boolean;
  brake: boolean;
}
export const neutralInput = (): FlightInput => ({
  turn: 0,
  pitch: 0,
  primary: false,
  brake: false,
});
export type FinishReason =
  | 'systems'
  | 'landed'
  | 'water'
  | 'impact'
  | 'boundary'
  | 'timeout'
  | 'runway'
  | 'target'
  | 'route';
export type Medal = 'gold' | 'silver' | 'bronze';
export interface Report {
  reason: FinishReason;
  medal: Medal | null;
  score: number;
  rings: number;
  precision: number;
  handling: number;
  distance: number;
  sink: number;
  time: number;
}
export interface Flight extends Position {
  instruments?: Instruments;
  lesson: Lesson;
  heading: number;
  bank: number;
  pitch: number;
  speed: number;
  vertical: number;
  elapsed: number;
  airborne: boolean;
  canopy: boolean;
  reserve: boolean;
  fuel: number;
  nextGate: number;
  dwell: number;
  thermalTime: number;
  inThermal: boolean;
  lastCueTime: number;
  lastAction: 'launch' | 'canopy' | 'reserve' | 'gate' | 'thermal' | null;
  serial: number;
  result: Report | null;
}
export const STEP = 1 / 60;
const approach = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));
const angleDifference = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function cue(s: Flight, event: Flight['lastAction']) {
  s.lastAction = event;
  s.lastCueTime = s.elapsed;
  s.serial++;
}
export function beginFlight(lesson: Lesson): Flight {
  const airborne = lesson.aircraft === 'glider' || lesson.aircraft === 'parachute';
  return {
    lesson,
    instruments: lesson.expert ? newInstruments() : undefined,
    ...lesson.start,
    heading: lesson.route ? Math.atan2(lesson.route.from.ux, -lesson.route.from.uz) : 0,
    bank: 0,
    pitch: 0,
    speed: lesson.aircraft === 'glider' ? 20 : lesson.aircraft === 'parachute' ? 12 : 0,
    vertical: lesson.aircraft === 'parachute' ? -13 : 0,
    elapsed: 0,
    airborne,
    canopy: false,
    reserve: false,
    fuel: 100,
    nextGate: 0,
    dwell: 0,
    thermalTime: 0,
    inThermal: false,
    lastCueTime: -5,
    lastAction: null,
    serial: 0,
    result: null,
  };
}
export function aimPoint(s: Flight): Position {
  const gate = s.lesson.gates[s.nextGate];
  if (gate) return gate;
  const r = s.lesson.route;
  if (r) {
    const lead = Math.max(0, runwayOffset(r.to, s).along + 260);
    return { x: r.to.x + r.to.ux * lead, z: r.to.z + r.to.uz * lead, y: r.to.elevation };
  }
  return { ...s.lesson.target, y: 0 };
}
export function bearingTo(s: Flight, target: Point) {
  return angleDifference(Math.atan2(target.x - s.x, s.z - target.z), s.heading);
}
export function altitude(s: Flight) {
  if (s.lesson.route) return Math.max(0, s.y - surfaceHeight(s.lesson.route, s.x, s.z));
  return Math.max(0, s.y - Math.max(SEA_LEVEL, groundHeight(s.lesson.airport, s.x, s.z)));
}
export function windAt(s: Flight): Point {
  const w = s.lesson.airport.wind;
  // Repeatable gusts make retries comparable. Ground contact stops all drift.
  const strength =
    (s.lesson.mode === 'practice' ? 0.58 : 1) *
    (1 + 0.16 * Math.sin(s.elapsed * 0.23 + s.z * 0.002));
  return { x: w.x * strength, z: w.z * strength };
}

function grade(s: Flight, reason: FinishReason) {
  const { aircraft, target, gates, mode } = s.lesson;
  const dx = s.x - target.x,
    dz = s.z - target.z,
    isPlane = aircraft === 'plane';
  const distance = isPlane ? Math.hypot(dx, dz * 0.13) : Math.hypot(dx, dz);
  const forgiveness = mode === 'practice' ? 1.25 : 1;
  const targetRadius =
    (aircraft === 'jetpack' ? 22 : aircraft === 'parachute' ? 48 : 70) * forgiveness;
  const sink = Math.abs(s.vertical);
  const maxSink = { plane: 5.6, glider: 5.4, parachute: 6.8, jetpack: 5.1 }[aircraft] * forgiveness;
  const directionError = Math.min(
    Math.abs(angleDifference(s.heading, 0)),
    Math.abs(angleDifference(s.heading, Math.PI)),
  );
  if (reason === 'landed') {
    if (isPlane && (Math.abs(s.x) > RUNWAY.halfWidth || Math.abs(s.z) > RUNWAY.halfLength))
      reason = 'runway';
    else if (
      sink > maxSink ||
      (isPlane &&
        (s.speed > 32 * forgiveness ||
          directionError > 0.65 * forgiveness ||
          Math.abs(s.bank) > 0.55))
    )
      reason = 'impact';
    else if (!isPlane && distance > targetRadius) reason = 'target';
    else if (
      mode === 'exam' &&
      (s.nextGate < gates.length || (aircraft === 'glider' && s.thermalTime < 1))
    )
      reason = 'route';
  }
  const rings = Math.round((40 * s.nextGate) / gates.length);
  const precision = Math.round(
    35 * clamp(1 - distance / (isPlane ? 65 : targetRadius * 1.35), 0, 1),
  );
  const handling = Math.round(
    clamp(
      25 - (12 * sink) / maxSink - (s.reserve ? 6 : 0) - (isPlane ? directionError * 10 : 0),
      0,
      25,
    ),
  );
  if (
    reason === 'landed' &&
    s.instruments &&
    (!s.instruments.cruiseChecked ||
      !s.instruments.fixLogged ||
      s.instruments.configuration !== 'landing')
  )
    reason = 'systems';
  const passed = reason === 'landed';
  const score = passed ? rings + precision + handling : rings;
  const medal = passed ? (score >= 85 ? 'gold' : score >= 65 ? 'silver' : 'bronze') : null;
  s.result = {
    reason,
    medal,
    score,
    rings,
    precision: passed ? precision : 0,
    handling: passed ? handling : 0,
    distance,
    sink,
    time: s.elapsed,
  };
}
function parachute(s: Flight, i: FlightInput, dt: number) {
  if (!s.canopy && (i.primary || s.y < 65)) {
    s.canopy = true;
    s.reserve = !i.primary;
    cue(s, s.reserve ? 'reserve' : 'canopy');
  }
  if (s.canopy) {
    const braking =
      (i.brake ? 1 : Math.max(0, -i.pitch)) *
      (s.instruments?.configuration === 'cruise' ? 0.78 : 1);
    s.speed = approach(s.speed, 11 + 4 * Math.max(0, i.pitch) - 9 * braking, 2, dt);
    s.vertical = approach(s.vertical, -3.8 + 0.9 * braking - 0.45 * Math.max(0, i.pitch), 2.5, dt);
    s.heading += i.turn * 1.02 * dt;
  } else {
    s.speed = approach(s.speed, 15 + 4 * i.pitch, 1.4, dt);
    s.vertical = approach(s.vertical, -33, 1.1, dt);
    s.heading += i.turn * 0.82 * dt;
  }
  s.bank = approach(s.bank, -i.turn * 0.26, 3, dt);
  s.pitch = approach(s.pitch, s.canopy ? 0 : -0.66, 4, dt);
}
function glider(s: Flight, i: FlightInput, dt: number) {
  const center = s.lesson.thermal,
    radius = Math.hypot(s.x - center.x, s.z - center.z);
  const lift = clamp(1 - radius / 71, 0, 1) * 9;
  if (!s.inThermal && lift > 3 && !s.thermalTime) cue(s, 'thermal');
  s.inThermal = lift > 3;
  if (s.inThermal) s.thermalTime += dt;
  s.bank = approach(s.bank, -i.turn * 0.85, 2.4, dt);
  s.heading -= s.bank * 0.95 * dt;
  s.pitch = approach(s.pitch, i.pitch * 0.33, 2.7, dt);
  const trimSpeed =
    s.instruments?.configuration === 'cruise'
      ? 1.2
      : s.instruments?.configuration === 'landing'
        ? -1
        : 0;
  const speedGoal = (i.brake ? 10 : i.primary && i.pitch <= 0 ? 32 : 21) - i.pitch * 6 + trimSpeed;
  s.speed = approach(s.speed, speedGoal, 1.1, dt);
  // Pulling up exchanges airspeed for a brief climb; sustained lift comes from thermals.
  const energyLift = i.pitch > 0 ? i.pitch * Math.max(0, s.speed - 17) * 0.45 : i.pitch * 5.6;
  const sink = i.brake ? -1.15 : -2.05 - Math.abs(s.bank) * 0.72;
  s.vertical = approach(s.vertical, Math.min(7.8, sink + energyLift + lift), 2.1, dt);
}
function jetpack(s: Flight, i: FlightInput, dt: number) {
  const powered = s.fuel > 0,
    hover = i.brake && powered,
    thrust = i.primary && powered && !hover;
  s.heading += i.turn * 1.7 * dt;
  if (!s.airborne) {
    if (!thrust) return;
    s.airborne = true;
    cue(s, 'launch');
  }
  s.speed = approach(s.speed, hover ? 0 : i.pitch * 17, hover ? 6 : 2.1, dt);
  s.bank = approach(s.bank, -i.turn * 0.19, 3, dt);
  s.pitch = approach(s.pitch, -i.pitch * 0.25, 3, dt);
  s.vertical = approach(
    s.vertical,
    thrust
      ? s.instruments?.configuration === 'landing'
        ? 6.7
        : 8.8
      : hover
        ? 0
        : powered
          ? -3.1
          : -7,
    hover ? 6 : 2,
    dt,
  );
  if (thrust || hover) s.fuel = Math.max(0, s.fuel - dt * (thrust ? 1.05 : 0.7));
}
function plane(s: Flight, i: FlightInput, dt: number) {
  if (!s.airborne) {
    s.speed = approach(
      s.speed,
      s.instruments ? 43 * s.instruments.throttle : i.primary && !i.brake ? 43 : 0,
      i.brake ? 1.8 : 0.26,
      dt,
    );
    s.heading += i.turn * 0.45 * dt * clamp(s.speed / 12, 0, 1);
    if (s.speed >= 20.5 && i.pitch > 0.2) {
      s.airborne = true;
      s.vertical = 3;
      s.y = (s.lesson.route?.from.elevation ?? 0) + 0.2;
      cue(s, 'launch');
    }
    return;
  }
  const panel = s.instruments;
  const drag =
    panel?.configuration === 'landing' ? 3 : panel?.configuration === 'departure' ? 1 : 0;
  const speedGoal = panel ? 17 + 29 * panel.throttle - drag : i.brake ? 21 : i.primary ? 45 : 31;
  s.speed = approach(s.speed, speedGoal - i.pitch * 3.6, 0.9, dt);
  s.pitch = approach(s.pitch, i.pitch * 0.32, 2.5, dt);
  s.bank = approach(s.bank, -i.turn * 0.93, 2.65, dt);
  s.heading -= s.bank * 0.78 * dt;
  s.vertical = approach(
    s.vertical,
    Math.sin(s.pitch) * s.speed - 0.65 - Math.abs(s.bank) * 0.4,
    2.8,
    dt,
  );
}

function collectGate(s: Flight, dt: number) {
  const gate = s.lesson.gates[s.nextGate];
  if (!gate || !s.airborne) return;
  const near = Math.hypot(s.x - gate.x, s.z - gate.z, s.y - gate.y) <= gate.radius;
  if (s.lesson.aircraft === 'jetpack') {
    s.dwell = near && Math.abs(s.speed) < 5 && Math.abs(s.vertical) < 3 ? s.dwell + dt : 0;
    if (s.dwell < 0.65) return;
  } else if (!near) return;
  s.nextGate++;
  s.dwell = 0;
  cue(s, 'gate');
}

function stepRoute(
  s: Flight,
  i: FlightInput,
  dt: number,
  r: Route,
  paceLimit: number,
  formationHold: boolean,
) {
  const { from, to, region } = r,
    target = aimPoint(s),
    gate = s.lesson.gates[s.nextGate];
  const rate = Math.min(paceLimit, cruiseRate(s, r));
  if ((r.assist || formationHold) && s.airborne) {
    // Correct the desired ground track for crosswind, including the final runway approach.
    const wind = windAt(s);
    const lead = Math.min(12, Math.hypot(target.x - s.x, target.z - s.z) / Math.max(1, s.speed));
    const bearing = bearingTo(s, { x: target.x - wind.x * lead, z: target.z - wind.z * lead });
    const landing = !gate;
    const remain = runwayOffset(to, s.lesson.target).along - runwayOffset(to, s).along;
    const desired = landing ? to.elevation + Math.max(0, remain - 40) * 0.056 : target.y;
    if (!i.turn) i.turn = clamp(bearing * 2.4, -1, 1);
    if (!i.pitch) {
      const ahead = Math.min(2200, s.speed * rate * 1.6);
      const terrain = surfaceHeight(
        r,
        s.x + Math.sin(s.heading) * ahead,
        s.z - Math.cos(s.heading) * ahead,
      );
      const clearance = landing ? desired : Math.max(desired, terrain + 160);
      const climb =
        landing && remain < 70 ? -1.5 : ((clearance - s.y) * 0.55) / Math.max(1, rate * 0.42);
      i.pitch = clamp((climb + 0.65) / (Math.max(20, s.speed) * 0.31), -1, 1);
    }
    if (!i.primary && !i.brake) {
      if (landing) i.brake = true;
      else i.primary = true;
    }
  }
  plane(s, i, dt);
  const w = s.airborne ? windAt(s) : { x: 0, z: 0 };
  s.x += (Math.sin(s.heading) * s.speed + w.x) * dt * rate;
  s.z += (-Math.cos(s.heading) * s.speed + w.z) * dt * rate;
  s.y += s.airborne ? s.vertical * dt * rate : 0;
  if (gate && s.airborne && Math.hypot(gate.x - s.x, gate.z - s.z) < gate.radius) {
    s.nextGate++;
    cue(s, 'gate');
  }
  const ground = surfaceHeight(r, s.x, s.z);
  let reason: FinishReason | undefined;
  const offset = runwayOffset(to, s);
  const sink = Math.abs(s.vertical);
  const angle = Math.abs(angleDifference(s.heading, Math.atan2(to.ux, -to.uz)));
  if (Math.abs(s.x) > region.width / 2 || Math.abs(s.z) > region.height / 2) reason = 'boundary';
  else if (!s.airborne && !onStrip(from, s)) reason = 'runway';
  else if (s.airborne && s.y <= ground) {
    s.y = ground;
    reason = !onStrip(to, s)
      ? ground <= 0
        ? 'water'
        : Math.abs(offset.cross) < 300 && Math.abs(offset.along) < to.length + 500
          ? 'runway'
          : 'impact'
      : sink > 6 || s.speed > 37 || Math.abs(s.bank) > 0.58 || angle > 0.64
        ? 'impact'
        : 'landed';
  }
  if (!reason) return;
  const landed = reason === 'landed',
    rings = landed ? 40 : Math.round((30 * s.nextGate) / s.lesson.gates.length);
  const precision = landed
    ? Math.round(35 * clamp(1 - Math.abs(offset.cross) / to.width, 0, 1))
    : 0;
  const handling = landed ? Math.round(25 * clamp(1 - sink / 10 - angle * 0.28, 0, 1)) : 0;
  const score = rings + precision + handling;
  s.result = {
    reason,
    rings,
    precision,
    handling,
    score,
    medal: landed ? (score >= 85 ? 'gold' : score >= 65 ? 'silver' : 'bronze') : null,
    distance: Math.abs(offset.cross),
    sink,
    time: s.elapsed,
  };
}

/** All movement runs at a fixed step; the UI, camera and scoring share this state. */
export function stepFlight(
  s: Flight,
  control: FlightInput,
  dt = STEP,
  {
    paceLimit = Infinity,
    extraTime = 0,
    formationHold = false,
  }: { paceLimit?: number; extraTime?: number; formationHold?: boolean } = {},
) {
  if (s.result || !Number.isFinite(dt) || dt <= 0 || dt > 0.05) return;
  const cockpit = s.instruments;
  if (cockpit && !cockpit.started) return;
  if (cockpit && s.lesson.aircraft === 'plane') {
    cockpit.throttle = clamp(
      cockpit.throttle + (Number(control.primary) - Number(control.brake)) * 0.45 * dt,
      0,
      1,
    );
  }
  s.elapsed += dt;
  const i = {
    ...control,
    turn: clamp(control.turn, -1, 1),
    pitch: clamp(control.pitch + (cockpit?.trim ?? 0) * 0.055, -1, 1),
  };
  if (s.lesson.route) {
    stepRoute(s, i, dt, s.lesson.route, paceLimit, formationHold);
    return;
  }
  const aircraft = s.lesson.aircraft;
  if (aircraft === 'plane') plane(s, i, dt);
  else if (aircraft === 'jetpack') jetpack(s, i, dt);
  else if (aircraft === 'glider') glider(s, i, dt);
  else parachute(s, i, dt);
  const wind = s.airborne ? windAt(s) : { x: 0, z: 0 };
  const drift = aircraft === 'jetpack' && i.brake && s.fuel > 0 ? 0.12 : 1;
  s.x += (Math.sin(s.heading) * s.speed + wind.x * drift) * dt;
  s.z += (-Math.cos(s.heading) * s.speed + wind.z * drift) * dt;
  s.y += s.airborne ? s.vertical * dt : 0;
  collectGate(s, dt);
  const ground = groundHeight(s.lesson.airport, s.x, s.z);
  if (Math.max(Math.abs(s.x), Math.abs(s.z)) > 1230 || s.y > 660) {
    grade(s, 'boundary');
    return;
  }
  if (s.elapsed > 210 + extraTime) {
    grade(s, 'timeout');
    return;
  }
  if (hitsBuilding(s.x, s.y, s.z)) {
    grade(s, 'impact');
    return;
  }
  if (!s.airborne) {
    if (
      aircraft === 'plane' &&
      (Math.abs(s.x) > RUNWAY.halfWidth || Math.abs(s.z) > RUNWAY.halfLength)
    )
      grade(s, 'runway');
    return;
  }
  if (s.y <= Math.max(ground, SEA_LEVEL)) {
    s.y = Math.max(ground, SEA_LEVEL);
    grade(s, ground < SEA_LEVEL ? 'water' : 'landed');
  }
}
