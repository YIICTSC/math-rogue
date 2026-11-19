import type { Aircraft } from './courses';
import type { Flight } from './simulation';

export type Panel = 'attitude' | 'navigation' | 'systems';
export type Configuration = 'departure' | 'cruise' | 'landing';
export function newInstruments() {
  return {
    panel: 'systems' as Panel,
    armed: false,
    started: false,
    configuration: 'departure' as Configuration,
    cruiseChecked: false,
    fixLogged: false,
    throttle: 0,
    trim: 0,
  };
}
export type Instruments = ReturnType<typeof newInstruments>;
export function selectPanel(s: Flight, panel: Panel) {
  const c = s.instruments;
  if (!c) return;
  c.panel = panel;
  if (c.armed && panel === 'attitude') c.started = true;
}
export function configure(s: Flight, setting: Configuration) {
  const c = s.instruments;
  if (!c?.armed) return;
  c.configuration = setting;
  if (setting === 'cruise' && s.airborne && c.started) c.cruiseChecked = true;
}
export function logFix(s: Flight) {
  if (s.instruments?.panel === 'navigation' && s.airborne && s.nextGate > 0)
    s.instruments.fixLogged = true;
}
export function adjustTrim(c: Instruments, change: number) {
  c.trim = Math.max(-3, Math.min(3, c.trim + change));
}
export const instrumentNames: Record<Aircraft, [string, string, string]> = {
  plane: ['フラップ', 'Flaps', 'フラップ'],
  glider: ['翼のトリム', 'Wing trim', 'つばさの トリム'],
  parachute: ['ブレーキトグル', 'Brake toggles', 'ブレーキトグル'],
  jetpack: ['噴射弁', 'Thrust valve', 'ふんしゃべん'],
};
