import { newSortie, stepSortie, type Sortie } from './combat';
import type { Training } from './courses';
import {
  aimPoint,
  bearingTo,
  neutralInput,
  STEP,
  stepFlight,
  windAt,
  type Flight,
  type FlightInput,
} from './simulation';
import type { TowerCue } from './towerRadio';
import type script from './radio-script.json';

export type RadioEvent = Exclude<keyof typeof script.WARRIOR, 'wing'> | TowerCue;
export function newPatrol(
  mission: Sortie['mission'],
  mode: Training,
  assist = false,
  guided = false,
  tomcat = false,
) {
  return {
    assist,
    tomcat,
    sortie: newSortie(mission, mode, guided),
    phase: 'launch' as 'launch' | 'climb' | 'vista' | 'search' | 'fight' | 'home',
    liftedAt: 0,
    searchedAt: 0,
    orbit: { x: 0, z: 0, y: 0 },
    failed: false,
  };
}
export type Patrol = ReturnType<typeof newPatrol>;
const steer = (v: number) => Math.max(-1, Math.min(1, v));

function circuitControls(s: Flight, i: FlightInput): FlightInput {
  const gate = s.lesson.gates[s.nextGate],
    target = aimPoint(s),
    wind = windAt(s);
  const dist = Math.hypot(target.x - s.x, target.z - s.z);
  const lead = Math.min(dist / Math.max(4, s.speed), 6);
  const aim =
    !gate && (dist < 12 || s.z < target.z)
      ? { x: -wind.x * 3, z: s.z - 65 }
      : { x: target.x - wind.x * lead, z: target.z - wind.z * lead };
  const climb = gate
    ? (target.y - s.y) * 0.16 + 1.1
    : Math.max(-3.7, Math.min(-1.3, -s.y * 0.16)) + 0.65;
  const cruise = !!gate && s.nextGate < 4;
  return {
    turn: i.turn || steer(bearingTo(s, aim) * 2.7),
    pitch: i.pitch || steer(climb / (s.speed * 0.31)),
    primary: i.primary || (!i.brake && cruise),
    brake: i.brake || (!i.primary && !cruise),
  };
}

export function stepPatrol(s: Flight, p: Patrol, i: FlightInput, cue: (event: RadioEvent) => void) {
  if (p.failed || s.result) return;
  const b = p.sortie;
  if (p.phase === 'fight') {
    const controls = neutralInput();
    if (!s.lesson.route) {
      const angle = Math.atan2(s.z - p.orbit.z, s.x - p.orbit.x) + 0.55;
      controls.turn = steer(
        bearingTo(s, {
          x: p.orbit.x + 100 * Math.cos(angle),
          z: p.orbit.z + 100 * Math.sin(angle),
        }) * 2.7,
      );
      controls.pitch = steer(((p.orbit.y - s.y) * 0.25 + 0.65) / (s.speed * 0.31));
    }
    stepFlight(s, controls, STEP, {
      paceLimit: b.mission.region ? 7 : 1,
      extraTime: b.time,
      formationHold: true,
    });
    if (s.result) return;
    const kills = b.kills,
      wave = b.wave;
    stepSortie(
      b,
      { x: i.turn, y: i.pitch, fire: i.primary, burst: i.brake, missile: i.missile },
      STEP,
    );
    if (b.finished === 'clear') {
      p.phase = 'home';
      cue('home');
    } else if (b.finished) p.failed = true;
    else if (b.kills > kills && kills === 0) cue('down');
    if (!b.finished && wave === 0 && b.wave > wave) cue('wave');
    return;
  }
  const controls = p.assist && s.airborne && !s.lesson.route ? circuitControls(s, i) : i;
  stepFlight(s, controls, STEP, { extraTime: b.time });
  if (s.result) {
    if (p.phase === 'home' && s.result.reason === 'landed') cue('land');
    return;
  }
  if (!s.airborne) return;
  const elapsed = s.elapsed - p.liftedAt;
  const encounterGate = Math.max(1, Math.floor(s.lesson.gates.length / 3));
  const enRoute = !s.lesson.route || s.nextGate >= encounterGate;
  if (p.phase === 'launch') {
    p.liftedAt = s.elapsed;
    p.phase = 'climb';
    cue(s.lesson.carrier ? 'deck' : 'lift');
  } else if (p.phase === 'climb' && elapsed >= 4) {
    p.phase = 'vista';
    cue('vista');
  } else if (
    p.phase === 'vista' &&
    elapsed >= 12 &&
    enRoute &&
    (b.mission.id !== 'ceiling' || s.y >= 11500)
  ) {
    p.phase = 'search';
    p.searchedAt = s.elapsed;
    cue('search');
  } else if (p.phase === 'search' && s.elapsed - p.searchedAt >= 8 && enRoute) {
    p.phase = 'fight';
    p.orbit = {
      x: s.x + Math.cos(s.heading) * 100,
      z: s.z + Math.sin(s.heading) * 100,
      y: Math.max(85, s.y),
    };
    cue(b.mission.id === 'valley' ? 'valley' : b.mission.id === 'ceiling' ? 'ceiling' : 'engage');
  }
}
