import { build } from 'esbuild';
import assert from 'node:assert/strict';
const base = './src/mini-games/flight-school/';
const { outputFiles } = await build({
  stdin: {
    contents: ['courses', 'simulation', 'logbook', 'combat']
      .map((n) => 'export * from ' + JSON.stringify(base + n))
      .join('\n'),
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const sim = await import(
  'data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64')
);
const {
  AIRPORTS,
  DISCIPLINES,
  makeLesson,
  beginFlight,
  aimPoint,
  windAt,
  stepFlight,
  bearingTo,
  STEP,
} = sim;
const clamp = (v, low = -1, high = 1) => Math.min(high, Math.max(low, v));
function fly(lesson) {
  const s = beginFlight(lesson);
  while (!s.result) {
    const target = aimPoint(s),
      gate = lesson.gates[s.nextGate],
      dx = target.x - s.x,
      dz = target.z - s.z;
    const dist = Math.hypot(dx, dz),
      dy = target.y - s.y,
      wind = windAt(s);
    const lead = Math.min(dist / Math.max(4, s.speed), 6);
    const look = { x: target.x - wind.x * lead, z: target.z - wind.z * lead };
    const bearing = bearingTo(s, look);
    const input = { turn: clamp(bearing * 2.7), pitch: 0, primary: false, brake: false };
    if (lesson.aircraft === 'parachute') {
      input.primary = s.y < 118;
      if (s.canopy) {
        const speed = (dist * 3.6) / Math.max(1, -dy);
        input.pitch = clamp((speed - 11) / (speed > 11 ? 4 : 9));
        if (!gate && dist < 7) input.brake = true;
      }
    }
    if (lesson.aircraft === 'glider') {
      if (gate) {
        input.pitch = clamp((dy * 0.086 + 2.2 - (s.inThermal ? 4 : 0)) / 5.5);
      } else {
        input.pitch = clamp(((dy * Math.max(11, s.speed)) / Math.max(9, dist) + 1.9) / 5.6);
        input.brake = s.y < 3.8 || dist < 18;
      }
    }
    if (lesson.aircraft === 'jetpack') {
      input.primary = s.y < target.y + 1 && !!gate;
      input.pitch = dist > 2 ? clamp(dist / 14, 0, 1) * Math.max(0, Math.cos(bearing)) : 0;
      input.brake = Boolean(gate && dist < gate.radius * 0.78 && Math.abs(dy) < gate.radius * 0.72);
    }
    if (lesson.aircraft === 'plane') {
      if (!s.airborne) {
        input.primary = true;
        input.pitch = 1;
        input.turn = 0;
      } else {
        input.brake = !gate || s.nextGate >= 4;
        input.primary = !!gate && s.nextGate < 4;
        input.pitch = gate
          ? clamp((dy * 0.16 + 1.1) / (s.speed * 0.31))
          : clamp((clamp(-s.y * 0.16, -3.7, -1.3) + 0.65) / (s.speed * 0.31));
        if (!gate && (dist < 12 || s.z < target.z))
          input.turn = clamp(bearingTo(s, { x: -wind.x * 3, z: s.z - 65 }) * 2.6);
      }
    }
    stepFlight(s, input);
  }
  return s;
}
// Drive the same four controls exposed to a player, starting from the actual spawn.
// A misplaced ring, unreachable approach, bad crosswind or premature touchdown breaks this test.
for (const airport of AIRPORTS)
  for (const discipline of DISCIPLINES)
    for (const mode of ['practice', 'exam']) {
      const lesson = makeLesson(airport, discipline.id, mode);
      const s = fly(lesson);
      assert.equal(
        s.result.reason,
        'landed',
        [airport.code, discipline.id, mode, s.result.reason].join('/'),
      );
      assert.equal(s.nextGate, lesson.gates.length);
      assert(s.result.medal && s.result.score <= 100);
      assert.equal(s.result.score, s.result.rings + s.result.precision + s.result.handling);
      if (discipline.id === 'glider') assert(s.thermalTime >= 1);
    }

const belt = beginFlight(makeLesson(AIRPORTS[0], 'jetpack', 'practice'));
for (let i = 0; i < 180; i++) stepFlight(belt, { turn: 0, pitch: 1, primary: false, brake: false });
assert.equal(belt.z, belt.lesson.start.z);
assert.equal(belt.vertical, 0, 'Waiting on the pad cannot accumulate downward speed');
for (let i = 0; i < 75; i++) stepFlight(belt, { turn: 0, pitch: 1, primary: true, brake: false });
assert.equal(belt.result, null);
assert(belt.y > 5 && belt.z < belt.lesson.start.z);

const lesson = makeLesson(AIRPORTS[0], 'parachute', 'exam');
const idle = beginFlight(lesson);
while (!idle.result) stepFlight(idle, sim.neutralInput());
assert(idle.canopy && idle.reserve);
assert.equal(idle.result.medal, null);
const time = idle.elapsed;
stepFlight(idle, sim.neutralInput());
assert.equal(idle.elapsed, time, 'A completed flight never advances twice');

const airborne = beginFlight(makeLesson(AIRPORTS[0], 'glider', 'exam'));
Object.assign(airborne, { x: 0, y: 190, z: 50 });
while (airborne.elapsed < 5)
  stepFlight(airborne, { turn: 0, pitch: 1, primary: true, brake: false });
assert(airborne.vertical < 0, 'A glider cannot climb indefinitely outside a thermal');

const touchdown = (aircraft, x, z, overrides = {}) => {
  const s = beginFlight(makeLesson(AIRPORTS[1], aircraft, 'exam'));
  Object.assign(
    s,
    { x, z, y: 0.01, airborne: true, canopy: true, vertical: -3, speed: 5 },
    overrides,
  );
  stepFlight(s, sim.neutralInput());
  return s.result;
};
assert.equal(touchdown('plane', -55, 9).reason, 'runway');
assert.equal(touchdown('glider', 117, -108).reason, 'impact');
assert.equal(touchdown('parachute', -91, lesson.target.z).reason, 'route');
assert.equal(touchdown('plane', 0, 10, { vertical: -20 }).reason, 'impact');

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
};
store.set(sim.FLIGHT_LOG_KEY, '{malformed');
assert.deepEqual(sim.readLog(), {});
const report = fly(lesson).result;
sim.recordFlight(lesson, report);
sim.recordFlight(lesson, { ...report, score: report.score - 1 });
sim.recordFlight(lesson, idle.result);
assert.deepEqual(sim.readLog()[sim.flightKey(lesson)], {
  score: report.score,
  medal: report.medal,
});
assert.equal(Object.keys(sim.readLog()).length, 1);
console.log(
  'PASS 64 full flights, all landing disciplines, failure scoring, reserve, energy and logbook persistence.',
);

const neutral = { x: 0, y: 0, fire: false, burst: false };
for (const mission of sim.MISSIONS) {
  for (const mode of ['practice', 'exam']) {
    const flight = sim.newSortie(mission, mode);
    while (!flight.finished) {
      const target = flight.targets.find((t) => t.hp > 0 && !sim.shielded(flight, t));
      const warning = flight.warnings.find(
        (w) => w.life < 0.55 && Math.hypot(flight.x - w.x, flight.y - w.y) < 0.25,
      );
      const x = warning ? (warning.x > 0 ? -0.94 : 0.94) : target.x;
      const y = warning ? (warning.y > 0 ? -0.82 : 0.86) : target.y;
      sim.stepSortie(
        flight,
        {
          x: clamp((x - flight.x) * 30),
          y: clamp((y - flight.y) * 30),
          fire: sim.underSight(flight, target),
          burst: flight.energy === 5,
        },
        1 / 60,
      );
    }
    assert.equal(flight.finished, 'clear', mission.id + '/' + mode);
    assert.equal(flight.kills, mission.waves.flat().length);
    assert(sim.scoreSortie(flight) > 0 && sim.scoreSortie(flight) <= 100);
  }
}
const escort = sim.newSortie(
  sim.MISSIONS.find((m) => m.escort),
  'exam',
);
escort.hull = 100;
while (!escort.finished) sim.stepSortie(escort, neutral, 1 / 60);
assert.equal(escort.finished, 'escort');
const failed = sim.newSortie(sim.MISSIONS[0], 'exam');
while (!failed.finished) sim.stepSortie(failed, neutral, 1 / 60);
assert.equal(failed.finished, 'shield');
const expired = sim.newSortie(sim.MISSIONS[0], 'exam');
expired.time = expired.mission.seconds;
sim.stepSortie(expired, neutral, 1 / 60);
assert.equal(expired.finished, 'time');
const baseMission = sim.MISSIONS.find((m) => m.id === 'base');
const baseDefense = sim.newSortie({ ...baseMission, waves: [['fort', 'relay']] }, 'exam');
const [fort, relay] = baseDefense.targets;
baseDefense.x = fort.x;
baseDefense.y = fort.y;
sim.stepSortie(baseDefense, { ...neutral, fire: true }, 1 / 60);
assert.equal(fort.hp, 7);
baseDefense.energy = 5;
sim.stepSortie(baseDefense, { ...neutral, burst: true }, 1 / 60);
assert.equal(relay.hp, 0);
assert.equal(fort.hp, 7);
assert.equal(sim.shielded(baseDefense, fort), false);
console.log(
  'PASS 12 complete combat sorties, relay shields, burst, hull, escort and timeout outcomes.',
);
