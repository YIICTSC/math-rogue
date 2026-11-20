import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const base = './src/mini-games/flight-school/';
const { outputFiles } = await build({
  stdin: {
    contents: ['courses', 'simulation', 'logbook', 'combat', 'routes', 'patrol', 'instruments', 'scenery','licenses','advancedMissions']
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
  if (s.instruments) {
    s.instruments.armed = true;
    sim.selectPanel(s, 'attitude');
  }
  while (!s.result) {
    if (s.instruments && s.airborne) {
      if (!s.instruments.cruiseChecked) {
        sim.selectPanel(s, 'systems');
        sim.configure(s, 'cruise');
      }
      if (s.nextGate > 0 && !s.instruments.fixLogged) {
        sim.selectPanel(s, 'navigation');
        sim.logFix(s);
      }
      if (s.nextGate === lesson.gates.length) {
        sim.selectPanel(s, 'systems');
        sim.configure(s, 'landing');
      }
      sim.selectPanel(s, 'attitude');
    }
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
    if (s.instruments && lesson.aircraft === 'plane' && s.airborne && input.brake) {
      const targetThrottle = s.instruments.configuration === 'landing' ? 0.24 : 0.15;
      input.brake = s.instruments.throttle > targetThrottle + 0.01;
      input.primary = s.instruments.throttle < targetThrottle - 0.01;
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

for (const airport of AIRPORTS)
  for (const d of DISCIPLINES) {
    const flight = fly(makeLesson(airport, d.id, 'exam', true));
    assert.equal(
      flight.result.reason,
      'landed',
      [airport.code, d.id, flight.result.reason, flight.nextGate].join('/'),
    );
    assert(flight.result.medal);
  }
const checkride = beginFlight(makeLesson(AIRPORTS[0], 'plane', 'exam', true));
const powerUp = { ...sim.neutralInput(), primary: true };
sim.selectPanel(checkride, 'attitude');
stepFlight(checkride, powerUp);
assert.equal(checkride.elapsed, 0, 'The simulation waits for an instrument power check.');
sim.selectPanel(checkride, 'systems');
checkride.instruments.armed = true;
stepFlight(checkride, powerUp);
assert.equal(checkride.elapsed, 0);
sim.selectPanel(checkride, 'attitude');
stepFlight(checkride, powerUp);
assert(checkride.elapsed > 0 && checkride.instruments.throttle > 0);
const throttle = checkride.instruments.throttle;
stepFlight(checkride, sim.neutralInput());
assert.equal(
  checkride.instruments.throttle,
  throttle,
  'Releasing power holds the throttle setting',
);
sim.selectPanel(checkride, 'systems');
sim.configure(checkride, 'cruise');
assert.equal(checkride.instruments.cruiseChecked, false);
sim.selectPanel(checkride, 'navigation');
sim.logFix(checkride);
assert.equal(checkride.instruments.fixLogged, false);
Object.assign(checkride, {
  airborne: true,
  y: 0.001,
  x: 0,
  z: 0,
  vertical: -2,
  speed: 22,
  nextGate: checkride.lesson.gates.length,
});
stepFlight(checkride, sim.neutralInput());
assert.equal(checkride.result?.reason, 'systems');
assert.equal(checkride.result.medal, null);
const masterEntries = Object.fromEntries(
  AIRPORTS.flatMap((a) =>
    DISCIPLINES.map((d) => [[a.code, d.id, 'exam'].join('/'), { score: 62, medal: 'bronze' }]),
  ),
);
const lastKey = Object.keys(masterEntries).pop();
const before = { ...masterEntries };
delete before[lastKey];
before[lastKey.replace('/exam', '/practice')] = masterEntries[lastKey];
assert.equal(sim.journalCount(before, 'exam'), sim.journalTotal - 1);
assert.equal(sim.journalCount(masterEntries, 'exam'), sim.journalTotal);
assert.equal(sim.journalCount(masterEntries, 'master'), 0);
assert.equal(sim.flightKey(checkride.lesson), AIRPORTS[0].code + '/plane/master');
assert.equal(sim.newPatrol(sim.MISSIONS[0], 'exam').assist, false);
console.log('PASS 32 master checkrides with in-flight configuration, navigation and landing.');
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
store.set(sim.FLIGHT_ROUTE_LOG_KEY, JSON.stringify({'HND-NRT':95,'NRT-HND':60,invalid:90,'HND-MMJ':85}));
store.set(sim.FLIGHT_COMBAT_LOG_KEY, JSON.stringify({'CTS/duel/exam':82,'HND/duel/exam':90,'CTS/escort/exam':77,'fake/base/exam':99,'CTS/sprint/exam':-1}));
assert.deepEqual(sim.readLicenses(),{route:2,sorties:2,routeTotal:8,combatTotal:6});
assert.equal(sim.longHaulRequirement('hnd-mmj'),2);
assert.equal(sim.longHaulRequirement('hnd-kix'),4);
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
function aimAtTarget(s) {
  const target = s.targets.find((t) => t.hp > 0 && !sim.shielded(s, t));
  const warning = s.warnings.find((w) => w.life < 0.55 && Math.hypot(s.x - w.x, s.y - w.y) < 0.25);
  const x = warning ? (warning.x > 0 ? -0.94 : 0.94) : target.x;
  const y = warning ? (warning.y > 0 ? -0.82 : 0.86) : target.y;
  return {
    x: clamp((x - s.x) * 30),
    y: clamp((y - s.y) * 30),
    fire: sim.underSight(s, target),
    burst: s.energy === 5,
  };
}
for (const mission of sim.MISSIONS) {
  for (const mode of ['practice', 'exam']) {
    const flight = sim.newSortie(mission, mode);
    while (!flight.finished) {
      sim.stepSortie(flight, aimAtTarget(flight), STEP);
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

for (const region of sim.ROUTES) {
  for (const reverse of [false, true]) {
    const lesson = sim.makeRouteLesson(region, reverse, true),
      s = sim.beginFlight(lesson);
    while (!s.result && s.elapsed < 600) {
      sim.stepFlight(s, { turn: 0, pitch: s.airborne ? 0 : 1, primary: !s.airborne, brake: false });
    }
    assert.equal(
      s.result?.reason,
      'landed',
      JSON.stringify([
        region.key,
        reverse,
        s.nextGate,
        s.elapsed,
        s.x,
        s.y,
        s.z,
        s.speed,
        s.vertical,
        s.result,
      ]),
    );
    assert.equal(s.nextGate, lesson.gates.length);
    assert(s.result.score > 60);
  }
}
console.log('PASS eight airport routes from takeoff through touchdown on actual terrain.');

for (const region of sim.ADVANCED_ROUTES) for (const reverse of [false,true]) {
  const flight=beginFlight(sim.makeRouteLesson(region,reverse,true));
  while(!flight.result && flight.elapsed<1200) stepFlight(flight,{turn:0,pitch:flight.airborne?0:1,primary:!flight.airborne,brake:false});
  assert.equal(flight.result?.reason,'landed',JSON.stringify([region.key,reverse,flight.nextGate,flight.elapsed,flight.result]));
}
for(const mission of sim.ADVANCED_MISSIONS) {
  const flight=beginFlight(sim.advancedLesson(mission,true)), p=sim.newPatrol(mission,'exam',true,true,true);
  let top=0, fired=false;
  while(!flight.result && !p.failed && flight.elapsed<1200) {
    const input=sim.neutralInput();
    if(!flight.airborne){input.primary=true;input.pitch=1}
    if(p.phase==='fight'){
      const a=aimAtTarget(p.sortie);
      Object.assign(input,{turn:a.x,pitch:a.y,primary:fired && a.fire,brake:fired && a.burst,missile:true});
    }
    sim.stepPatrol(flight,p,input,()=>{});
    top=Math.max(top,flight.y); fired ||= p.sortie.missiles<4;
  }
  assert.equal(flight.result?.reason,'landed',JSON.stringify([mission.id,flight.x,flight.y,flight.z,p.phase,flight.nextGate,flight.result]));
  assert.equal(p.sortie.finished,'clear');
  assert(fired);
  if(mission.id==='ceiling') assert(top>11500);
}
console.log('PASS four long-haul directions, deck takeoff, valley chase, stratosphere flight and homing shots.');
const manual = sim.makeRouteLesson(sim.ROUTES[0], false, false);
const departure = sim.beginFlight(manual);
const stationary = { x: departure.x, z: departure.z };
for (let i = 0; i < 120; i++) sim.stepFlight(departure, sim.neutralInput());
assert.equal(departure.x, stationary.x);
assert.equal(departure.z, stationary.z);
while (!departure.airborne)
  sim.stepFlight(departure, { turn: 0, pitch: 1, primary: true, brake: false });
const originalHeading = departure.heading;
for (let i = 0; i < 60; i++)
  sim.stepFlight(departure, { turn: 1, pitch: 1, primary: true, brake: false });
assert(departure.heading > originalHeading && sim.altitude(departure) > 0);

function routeContact(strip, cross, speed) {
  const s = sim.beginFlight(manual);
  Object.assign(s, {
    airborne: true,
    x: strip.x + strip.ux * 300 + strip.uz * cross,
    z: strip.z + strip.uz * 300 - strip.ux * cross,
    y: strip.elevation,
    heading: Math.atan2(strip.ux, -strip.uz),
    speed,
    vertical: -2,
  });
  sim.stepFlight(s, sim.neutralInput());
  return s.result?.reason;
}
assert.equal(routeContact(manual.route.to, 0, 25), 'landed');
assert.equal(routeContact(manual.route.from, 0, 25), 'impact');
assert.equal(routeContact(manual.route.to, 80, 25), 'runway');
assert.equal(routeContact(manual.route.to, 0, 60), 'impact');
console.log('PASS manual controls, destination-only landing, missed runway and unsafe touchdown.');

// Fly a complete patrol with exactly the controls available to keyboard, touch and gamepad.
for (const mission of sim.MISSIONS) {
  for (const mode of ['practice', 'exam']) {
    const lessons = [
      ...AIRPORTS.map((a) => makeLesson(a, 'plane', mode)),
      ...sim.ROUTES.flatMap((r) =>
        [false, true].map((reverse) => sim.makeRouteLesson(r, reverse, true)),
      ),
    ];
    for (const lesson of lessons) {
      const flight = beginFlight(lesson),
        p = sim.newPatrol(mission, mode, true),
        events = [];
      while (!flight.result && !p.failed && flight.elapsed < 640) {
        const i = sim.neutralInput(),
          b = p.sortie;
        if (!flight.airborne) {
          i.pitch = 1;
          i.primary = true;
        }
        if (p.phase === 'fight') {
          const { x, y, fire, burst } = aimAtTarget(b);
          Object.assign(i, { turn: x, pitch: y, primary: fire, brake: burst });
        }
        sim.stepPatrol(flight, p, i, (e) => events.push(e));
      }
      const label = [
        lesson.route?.from.code ?? lesson.airport.code,
        mission.id,
        mode,
        flight.result?.reason,
        flight.nextGate,
        p.phase,
        Math.round(flight.elapsed),
      ];
      assert.equal(flight.result?.reason, 'landed', JSON.stringify(label));
      assert.equal(p.sortie.finished, 'clear');
      assert.deepEqual(
        events.filter((e) => !['wave', 'down'].includes(e)),
        ['lift', 'vista', 'search', 'engage', 'home', 'land'],
      );
      assert(events.includes('down') && events.includes('wave'));
    }
  }
}
console.log(
  'PASS 192 complete patrols across eight circuits, eight route directions and six missions.',
);

const parked = sim.beginFlight(makeLesson(AIRPORTS[0], 'plane', 'practice'));
const unattended = sim.newPatrol(sim.MISSIONS[0], 'practice', true);
const calls = [];
for (let i = 0; i < 1800; i++)
  sim.stepPatrol(parked, unattended, sim.neutralInput(), (e) => calls.push(e));
assert.equal(unattended.phase, 'launch');
assert.equal(unattended.sortie.time, 0);
assert.deepEqual(calls, []);
while (!unattended.failed && !parked.result && parked.elapsed < 250) {
  const input = sim.neutralInput();
  if (!parked.airborne) {
    input.pitch = 1;
    input.primary = true;
  }
  sim.stepPatrol(parked, unattended, input, (e) => calls.push(e));
}
assert(unattended.failed);
assert(!calls.includes('home') && !calls.includes('land'));

const scripts = JSON.parse(await readFile(base + 'radio-script.json', 'utf8'));
assert.equal(Object.keys(scripts).length, 9);
let clips = 0;
for (const [lead, entry] of Object.entries(scripts)) {
  assert(lead !== entry.wing && Object.hasOwn(scripts, entry.wing));
  assert(
    (await stat('public/sprites/flight-school/pilots/' + lead.toLowerCase() + '.webp')).size > 0,
  );
  for (const event of ['lift', 'vista', 'search', 'engage', 'wave', 'down', 'home', 'land']) {
    const lines = entry[event];
    assert.equal(lines.length, event === 'lift' || event === 'land' ? 1 : 2);
    for (const [i, line] of lines.entries()) {
      assert(line.length === 3 && line.every((t) => typeof t === 'string' && t.trim()));
      assert(
        (
          await stat(
            'public/sfx/flight-radio/' + lead.toLowerCase() + '/' + event + '-' + i + '.mp3',
          )
        ).size > 0,
      );
      clips++;
    }
  }
}
assert.equal(clips, 126);
console.log('PASS grounded and failed patrols, nine pilot portraits and 126 voiced radio lines.');

// Sea dialogue must follow the current scenery, including inland route departures.
for (const airport of AIRPORTS) {
  const s = beginFlight(makeLesson(airport, 'plane', 'checkride'));
  s.y = 150;
  assert.equal(sim.seaNearby(s), ['coast', 'bay', 'port', 'island', 'reef'].includes(airport.region), airport.code);
}
for (const region of sim.ROUTES) {
  const s = beginFlight(sim.makeRouteLesson(region, false, false));
  s.y += 300;
  assert.equal(sim.seaNearby(s), region.key !== 'mmj-toy', region.key);
}
console.log('PASS scenery radio excludes inland airports and mountain-route departures.');
