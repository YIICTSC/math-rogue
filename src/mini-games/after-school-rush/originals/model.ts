import type { Copy, Prop } from '../rules';

export type Local = readonly [ja: string, en: string, hira?: string];
export type Layout = 'grid' | 'track' | 'machine' | 'counter' | 'orbit' | 'score' | 'story' | 'stack';
export type Genre =
  | 'reflex'
  | 'logic'
  | 'craft'
  | 'motion'
  | 'memory'
  | 'strategy'
  | 'rhythm'
  | 'simulation'
  | 'language'
  | 'math'
  | 'boss';

export const GENRES: Record<Genre, Copy> = {
  reflex: ['反射', 'Reflex', 'はんしゃ'],
  logic: ['推理', 'Logic', 'すいり'],
  craft: ['工作', 'Craft', 'こうさく'],
  motion: ['アクション', 'Action', 'アクション'],
  memory: ['記憶', 'Memory', 'きおく'],
  strategy: ['戦略', 'Strategy', 'せんりゃく'],
  rhythm: ['リズム', 'Rhythm', 'リズム'],
  simulation: ['シミュレーション', 'Simulation', 'シミュレーション'],
  language: ['ことば', 'Words', 'ことば'],
  math: ['計算', 'Numbers', 'けいさん'],
  boss: ['ボス', 'Boss', 'ボス'],
};

export type State = readonly number[];
export type Mark = 'good' | 'warn' | 'hot' | 'cool' | 'muted';
export type Piece = { text?: Local; art?: Prop; mark?: Mark; disabled?: boolean; key?: string };
type RawPiece = string | Local | Piece;
export type Display = {
  buttons: Piece[];
  props?: Piece[];
  note?: Local;
  meter?: number;
  marker?: number;
  zone?: [number, number];
};
export type Clock = { now: number; before: number; dt: number };
export type Change = State | 'clear' | 'mistake' | undefined;
export type Mechanic = {
  layout: Layout;
  direct?: boolean;
  initial: State;
  display: (state: State, time: Clock) => Display;
  tap: (state: State, index: number, time: Clock) => Change;
  tick?: (state: State, time: Clock) => Change;
};
export type Original = {
  id: string;
  title: Local;
  cue: Local;
  genre: Genre;
  icon: Prop;
  mechanic: Mechanic;
  seconds?: number;
  boss?: true;
};

export const loc = (ja: string, en: string, hira?: string): Local => [ja, en, hira];
export const n = (value: number | string): Local => loc(String(value), String(value));
export const sprite = (art: Prop, mark?: Mark, text?: Local): Piece => ({ art, mark, text });
export const piece = (text: Local, mark?: Mark, disabled?: boolean): Piece => ({ text, mark, disabled });
export const raw = (value: RawPiece): Piece =>
  typeof value === 'string' ? piece(n(value)) : Array.isArray(value) ? piece(value as Local) : (value as Piece);
export const set = (state: State, index: number, value: number): State =>
  state.map((item, i) => (i === index ? value : item));
export const swap = (state: State, a: number, b: number): State =>
  state.map((v, i) => (i === a ? state[b] : i === b ? state[a] : v));
export const sum = (values: State) => values.reduce((acc, v) => acc + v, 0);
export const equal = (a: State, b: State) => a.length === b.length && a.every((v, i) => v === b[i]);
export const clamp = (v: number, low = 0, high = 1) => Math.max(low, Math.min(high, v));
export const triangle = (ms: number, period: number) => 1 - Math.abs(2 * ((ms % period) / period) - 1);
export const slot = (ms: number, period: number, count: number) => Math.floor(ms / period) % count;
export const pulse = (clock: Clock, at: number) => clock.before < at && clock.now >= at;

// Integrate using both sides of a phase boundary, independent of frame rate.
export function phaseIntegral(clock: Clock, width: number, count: number, rate: (phase: number) => number) {
  let value = 0;
  let from = clock.before;
  while (from < clock.now) {
    const phase = Math.floor(from / width);
    const to = Math.min(clock.now, (phase + 1) * width);
    value += (to - from) * rate(phase % count);
    from = to;
  }
  return value;
}

export function original(
  id: string,
  ja: string,
  en: string,
  cue: Local,
  genre: Genre,
  icon: Prop,
  mechanic: Mechanic,
  seconds?: number,
): Original {
  return { id, title: loc(ja, en), cue, genre, icon, mechanic, seconds };
}
export function boss(id: string, cue: Local, icon: Prop, mechanic: Mechanic): Original {
  return { id, title: loc('', ''), cue, genre: 'boss', icon, mechanic, boss: true, seconds: 15 };
}

export function field(
  layout: Layout,
  initial: State,
  display: (s: State, t: Clock) => Omit<Display, 'buttons'> & { buttons: RawPiece[] },
  tap: Mechanic['tap'],
  tick?: Mechanic['tick'],
  direct = layout === 'grid',
): Mechanic {
  return {
    layout,
    direct,
    initial,
    display: (s, t) => {
      const frame = display(s, t);
      return { ...frame, buttons: frame.buttons.map(raw) };
    },
    tap,
    tick,
  };
}

export function choice(
  layout: Layout,
  note: Local,
  options: RawPiece[],
  answer: number,
  props?: Piece[],
): Mechanic {
  return field(
    layout,
    [],
    () => ({ note, buttons: options, props }),
    (_s, i) => (i === answer ? 'clear' : 'mistake'),
    undefined,
    true,
  );
}

export function collect(layout: Layout, tiles: Piece[], targets: number[], note?: Local): Mechanic {
  return field(
    layout,
    [],
    (picked) => ({
      note,
      buttons: tiles.map((tile, i) => (picked.includes(i) ? { ...tile, mark: 'good', disabled: true } : tile)),
      meter: picked.length / targets.length,
    }),
    (picked, i) => {
      if (picked.includes(i)) return;
      if (!targets.includes(i)) return 'mistake';
      return picked.length + 1 === targets.length ? 'clear' : [...picked, i];
    },
    undefined,
    true,
  );
}

export function sequence(
  layout: Layout,
  tiles: RawPiece[],
  order: number[],
  note: Local,
  visible?: (state: State, t: Clock) => Piece[],
  strict = true,
): Mechanic {
  return field(
    layout,
    [0],
    (s, t) => ({
      note,
      buttons: tiles,
      props: visible?.(s, t),
      meter: s[0] / order.length,
    }),
    (s, i) =>
      i === order[s[0]] ? (s[0] + 1 === order.length ? 'clear' : [s[0] + 1]) : strict ? 'mistake' : [0],
  );
}

export function operate(
  layout: Layout,
  initial: State,
  controls: RawPiece[],
  read: (s: State, t: Clock) => Omit<Display, 'buttons'>,
  apply: Mechanic['tap'],
  tick?: Mechanic['tick'],
): Mechanic {
  return field(layout, initial, (s, t) => ({ ...read(s, t), buttons: controls }), apply, tick);
}

export function edit(
  layout: Layout,
  initial: State,
  render: (value: number, i: number, s: State, t: Clock) => RawPiece,
  update: (s: State, i: number, t: Clock) => Change,
  goal: (s: State) => boolean,
  note?: Local,
): Mechanic {
  return field(
    layout,
    initial,
    (s, t) => ({ note, buttons: s.map((v, i) => render(v, i, s, t)) }),
    (s, i, t) => {
      const next = update(s, i, t);
      return next && typeof next !== 'string' && goal(next) ? 'clear' : next;
    },
    undefined,
    true,
  );
}

export function timed(
  layout: Layout,
  note: Local,
  controls: RawPiece[],
  pace: number,
  track: (position: number, now: number) => { props?: Piece[]; marker?: number; zone?: [number, number] },
  hit: (i: number, position: number, now: number) => boolean,
  hits = 1,
): Mechanic {
  const at = (time: Clock) => triangle(time.now, pace);
  return operate(
    layout,
    [0, -1],
    controls,
    (s, t) => ({
      ...track(at(t), t.now),
      note,
      meter: s[0] / hits,
    }),
    (s, i, t) => {
      const pass = Math.floor(t.now / (pace / 2));
      if (s[1] === pass) return;
      if (!hit(i, at(t), t.now)) return 'mistake';
      return s[0] + 1 === hits ? 'clear' : [s[0] + 1, pass];
    },
  );
}
