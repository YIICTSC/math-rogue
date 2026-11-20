import type { Phrase, Training } from './courses';
import { clamp } from './terrain';

type Kind = 'drone' | 'ace' | 'relay' | 'fort' | 'carrier';
export type Mission = {
  required?: number;
  region?: string;
  id: string;
  name: Phrase;
  brief: Phrase;
  waves: Kind[][];
  escort?: boolean;
  seconds: number;
};
export const MISSIONS: Mission[] = [
  {
    id: 'intercept',
    name: ['群青の迎撃線', 'Blue intercept', 'ぐんじょうの げいげきせん'],
    brief: [
      '接近する無人機を3編隊迎撃。',
      'Intercept three drone formations.',
      'せっきんする むじんきを 3へんたい げいげき。',
    ],
    waves: [
      ['drone', 'drone'],
      ['drone', 'drone', 'drone'],
      ['ace', 'drone'],
    ],
    seconds: 100,
  },
  {
    id: 'duel',
    name: ['紅翼のエース', 'Crimson ace', 'こうよくの エース'],
    brief: [
      '左右に切り返すエース機との連戦。',
      'Track the weaving aces in successive duels.',
      'さゆうに きりかえす エースきと れんせん。',
    ],
    waves: [['ace'], ['ace', 'ace']],
    seconds: 80,
  },
  {
    id: 'base',
    name: ['雲海の浮遊基地', 'Cloud citadel', 'うんかいの ふゆうきち'],
    brief: [
      '紫の中継球を壊し、シールドが消えた基地を破壊。',
      'Break the violet relays, then destroy the exposed sky base.',
      'むらさきの ちゅうけいきゅうを こわし、きちの シールドを はずそう。',
    ],
    waves: [
      ['drone', 'relay'],
      ['relay', 'fort', 'relay'],
    ],
    seconds: 105,
  },
  {
    id: 'escort',
    name: ['夜明けの輸送隊', 'Dawn convoy', 'よあけの ゆそうたい'],
    brief: [
      '敵を後方へ通さず、青い輸送艇を護衛。',
      'Protect the blue transport by intercepting incoming drones before they pass.',
      'てきを こうほうへ とおさず、あおい ゆそうていを ごえい。',
    ],
    escort: true,
    waves: [
      ['drone', 'drone'],
      ['drone', 'ace', 'drone'],
      ['drone', 'drone', 'ace'],
    ],
    seconds: 100,
  },
  {
    id: 'sprint',
    name: ['閃光タイムラリー', 'Flash sprint', 'せんこう タイムラリー'],
    brief: [
      '短い制限時間で4波を突破。命中でためたバーストを活用。',
      'Clear four waves against a short clock. Charge bursts by landing hits.',
      'みじかい じかんで 4はを とっぱ。めいちゅうで バーストを ためよう。',
    ],
    waves: [['drone'], ['drone', 'drone'], ['ace'], ['relay', 'fort']],
    seconds: 52,
  },
  {
    id: 'flagship',
    name: ['天頂の旗艦', 'Zenith flagship', 'てんちょうの きかん'],
    brief: [
      '護衛編隊と中継球を突破し、大型旗艦に挑む総合演習。',
      'Break the escorts and shield relays, then face the flagship.',
      'ごえいへんたいと ちゅうけいきゅうを とっぱし、おおがたきかんに いどもう。',
    ],
    waves: [
      ['ace', 'drone'],
      ['relay', 'fort'],
      ['relay', 'carrier', 'ace', 'relay'],
    ],
    seconds: 135,
  },
];
export type CombatTarget = {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  depth: number;
  hp: number;
  origin: number;
  age: number;
  flash: number;
};
// Keep the warning markers aligned with the aircraft in the chase camera.
export function aircraftScreen(x: number, y: number) {
  return { x: x * 0.78, y: y * 0.68 - 0.3 };
}
export type CombatResult = 'clear' | 'shield' | 'escort' | 'time';
export function newSortie(mission: Mission, mode: Training, guided = false) {
  const state = {
    mission,
    mode,
    x: 0,
    y: 0,
    time: 0,
    wave: 0,
    hull: mode === 'practice' ? 6 : 4,
    convoy: 3,
    energy: 0,
    guided,
    missiles: 4,
    lock: null as number | null,
    lockTime: 0,
    missile: null as { target: number; x: number; y: number; age: number } | null,
    kills: 0,
    shots: 0,
    hits: 0,
    targets: [] as CombatTarget[],
    warnings: [] as { x: number; y: number; life: number }[],
    nextAttack: 3,
    cooldown: 0,
    beam: 0,
    burst: 0,
    hurt: 0,
    sound: null as 'pulse' | 'hit' | 'thrust' | null,
    finished: null as CombatResult | null,
  };
  spawn(state);
  return state;
}
export type Sortie = ReturnType<typeof newSortie>;
function spawn(s: Sortie) {
  const wave = s.mission.waves[s.wave];
  s.targets = wave.map((kind, i) => ({
    id: s.wave * 10 + i,
    kind,
    hp: { drone: 2, ace: 5, relay: 2, fort: 7, carrier: 12 }[kind],
    origin: (i - (wave.length - 1) / 2) * 0.39,
    x: (i - (wave.length - 1) / 2) * 0.39,
    y: 0.14,
    age: 0,
    depth: 0.08,
    flash: 0,
  }));
  s.warnings = [];
  s.nextAttack = s.time + 3;
}
export const shielded = (s: Sortie, t: CombatTarget) =>
  (t.kind === 'fort' || t.kind === 'carrier') &&
  s.targets.some((other) => other.kind === 'relay' && other.hp > 0);
export function underSight(s: Sortie, t: CombatTarget) {
  const radius =
    (t.kind === 'carrier' || t.kind === 'fort' ? 0.24 : 0.14) * (s.mode === 'practice' ? 1.3 : 1);
  return Math.hypot(s.x - t.x, s.y - t.y) < radius;
}
export function scoreSortie(s: Sortie) {
  const total = s.mission.waves.flat().length;
  return Math.round(
    (55 * s.kills) / total +
      (s.finished === 'clear'
        ? (25 * s.hits) / Math.max(1, s.shots) + (20 * s.hull) / (s.mode === 'practice' ? 6 : 4)
        : 0),
  );
}
export function stepSortie(
  s: Sortie,
  input: { x: number; y: number; fire: boolean; burst: boolean; missile?: boolean },
  dt: number,
) {
  if (s.finished || dt <= 0 || dt > 0.05) return;
  s.sound = null;
  s.time += dt;
  s.cooldown -= dt;
  s.beam = Math.max(0, s.beam - dt);
  s.burst = Math.max(0, s.burst - dt);
  s.hurt = Math.max(0, s.hurt - dt);
  s.x = clamp(s.x + input.x * dt * 1.22, -0.94, 0.94);
  s.y = clamp(s.y + input.y * dt * 1.22, -0.82, 0.86);
  for (const t of s.targets) {
    if (t.hp <= 0) continue;
    t.age += dt;
    t.flash = Math.max(0, t.flash - dt);
    const moving = t.kind === 'drone' || t.kind === 'ace',
      phase = t.age * (t.kind === 'ace' ? 1.4 : 0.68) + t.id * 1.8;
    t.x = t.origin + Math.sin(phase) * (moving ? (t.kind === 'ace' ? 0.3 : 0.14) : 0.035);
    t.y = 0.12 + Math.sin(phase * 0.87 + t.id) * (moving ? 0.27 : 0.12);
    t.depth = Math.min(0.8, t.depth + dt * (moving ? 0.045 : 0.026));
    if (moving && t.age > (s.mode === 'practice' ? 21 : 16)) {
      t.age = 0;
      t.depth = 0.06;
      if (s.mission.escort) s.convoy--;
      else s.hull--;
      s.hurt = 0.35;
    }
  }
  if (s.guided) {
    const target = s.targets
      .filter((t) => t.hp > 0 && !shielded(s, t))
      .map((t) => ({ t, d: Math.hypot(s.x - t.x, s.y - t.y) }))
      .filter((p) => p.d < 0.32)
      .sort((a, b) => a.d - b.d)[0]?.t;
    if (s.lock !== (target?.id ?? null)) s.lockTime = 0;
    s.lock = target?.id ?? null;
    if (target) s.lockTime = Math.min(0.4, s.lockTime + dt);
    if (target && input.missile && s.lockTime >= 0.4 && !s.missile && s.missiles > 0) {
      s.missile = { target: target.id, ...aircraftScreen(s.x, s.y), age: 0 };
      s.missiles--;
      s.shots++;
      s.sound = 'thrust';
    }
    const shot = s.missile;
    if (shot) {
      const t = s.targets.find((t) => t.id === shot.target && t.hp > 0);
      if (!t || shielded(s, t)) s.missile = null;
      else {
        shot.age += dt;
        shot.x += (t.x - shot.x) * Math.min(1, dt * 7);
        shot.y += (t.y - shot.y) * Math.min(1, dt * 7);
        if (shot.age >= 0.55) {
          t.hp = Math.max(0, t.hp - 4);
          t.flash = 0.28;
          s.hits++;
          if (!t.hp) s.kills++;
          s.sound = 'hit';
          s.missile = null;
          s.lockTime = 0;
        }
      }
    }
  }
  if (input.burst && s.energy >= 5) {
    s.burst = 0.48;
    s.energy = 0;
    s.sound = 'thrust';
    const exposed = s.targets.filter((t) => t.hp > 0 && !shielded(s, t));
    for (const t of exposed) {
      t.hp = Math.max(0, t.hp - 3);
      t.flash = 0.22;
      if (!t.hp) s.kills++;
    }
  }
  if (input.fire && s.cooldown <= 0) {
    s.cooldown = 0.23;
    s.shots++;
    s.beam = 0.13;
    s.sound = 'pulse';
    const target = s.targets
      .filter((t) => t.hp > 0 && underSight(s, t) && !shielded(s, t))
      .sort((a, b) => b.depth - a.depth)[0];
    if (target) {
      target.hp--;
      target.flash = 0.16;
      s.hits++;
      s.energy = Math.min(5, s.energy + 1);
      if (!target.hp) {
        s.kills++;
        s.sound = 'hit';
      }
    }
  }
  if (s.time >= s.nextAttack) {
    s.warnings.push({ x: s.x, y: s.y, life: s.mode === 'practice' ? 1.65 : 1.08 });
    s.nextAttack = s.time + (s.mode === 'practice' ? 4 : 3);
  }
  for (const w of s.warnings) {
    w.life -= dt;
    if (w.life <= 0 && Math.hypot(s.x - w.x, s.y - w.y) < 0.2 && s.burst <= 0) {
      s.hull--;
      s.hurt = 0.45;
      s.sound = 'hit';
    }
  }
  s.warnings = s.warnings.filter((w) => w.life > 0);
  if (s.hull <= 0) s.finished = 'shield';
  else if (s.convoy <= 0) s.finished = 'escort';
  else if (s.time >= s.mission.seconds * (s.mode === 'practice' ? 1.35 : 1)) s.finished = 'time';
  else if (s.targets.every((t) => t.hp <= 0)) {
    if (s.wave + 1 >= s.mission.waves.length) s.finished = 'clear';
    else {
      s.wave++;
      spawn(s);
    }
  }
}
