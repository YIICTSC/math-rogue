import type { KartQuestion } from '../gakuro-kart/learning';

export const SIZE = 40, CAPACITY = 40, MAX_ENERGY = 100, QUIZ_ENERGY = 30, GROW_SECONDS = 90;
export const MATERIALS = ['wood', 'stone', 'seed', 'crop', 'fish', 'plank', 'brick', 'flower', 'lamp', 'bench'] as const;
export type Material = typeof MATERIALS[number];
export const BUILDINGS = ['plank', 'brick', 'flower', 'lamp', 'bench'] as const;
export type Building = typeof BUILDINGS[number];
export const RECIPES: Record<Building, Partial<Record<Material, number>>> = { plank: { wood: 2 }, brick: { stone: 2 }, flower: { crop: 1 }, lamp: { wood: 2, stone: 1 }, bench: { plank: 2 } };
export type Inventory = Record<Material, number>;
export type Tile = { ground: 'grass' | 'sand' | 'water'; nature: 'tree' | 'rock' | null; blocks: Building[]; owner: string; crop: number | null; watered: boolean; regrow: number; regrowKind?: 'tree' | 'rock'; revision: number };
export type Player = { id: string; name: string; color: number; x: number; z: number; energy: number; bag: Inventory; correct: number; actions: number; dx: number; dz: number; inputAt: number; actionAt: number };
export type World = { seed: number; time: number; revision: number; tiles: Tile[]; players: Record<string, Player>; donated: number; harvested: number; built: number; paused: boolean };
export type Tool = 'gather' | 'plant' | 'water' | 'harvest' | 'fish' | 'remove' | 'build';
export type Command = { type: 'move'; dx: number; dz: number } | { type: 'act'; tool: Tool; tile: number; building?: Building } | { type: 'craft'; material: Building } | { type: 'donate' } | { type: 'quiz' } | { type: 'answer'; token: string; option: number };
export type PublicQuestion = Omit<KartQuestion, 'correct'>;
export type Reply = { type: 'notice'; text: string } | { type: 'quiz'; token: string; question: PublicQuestion } | { type: 'answer'; token: string; correct: boolean; answer: string; energy: number; elapsedMs: number; question: PublicQuestion; selected: string };
export const indexOf = (x: number, z: number) => Math.floor(z) * SIZE + Math.floor(x);
export const inside = (x: number, z: number) => x >= 0 && z >= 0 && x < SIZE && z < SIZE;
const random = (seed: number, i: number) => ((Math.imul(seed ^ i, 1664525) + 1013904223) >>> 0) / 4294967296;
export function createWorld(seed = 1): World {
  const tiles: Tile[] = [];
  for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
    const i = z * SIZE + x, distance = Math.hypot(x - 20, z - 20), coast = 16 + Math.sin(x * .6) * 1.8 + Math.cos(z * .7);
    const water = distance > coast || (x > 25 && x < 29 && z > 9 && z < 25);
    const r = random(seed, Math.imul(i + 17, 374761393));
    const nature = !water && distance > 4 && r < .19 ? 'tree' : !water && distance > 4 && r < .27 ? 'rock' : null;
    tiles.push({ ground: water ? 'water' : distance > coast - 1.7 ? 'sand' : 'grass', nature, blocks: [], owner: '', crop: null, watered: false, regrow: 0, revision: 0 });
  }
  return { seed, time: 0, revision: 0, tiles, players: {}, donated: 0, harvested: 0, built: 0, paused: false };
}
export function addPlayer(w: World, id: string, name: string, color = 0) {
  if (Object.keys(w.players).length >= CAPACITY || w.players[id] || !id || id.length > 100) return false;
  const n = Object.keys(w.players).length;
  w.players[id] = { id, name: name.trim().slice(0, 16) || 'Guest', color: Number.isInteger(color) ? Math.max(0, Math.min(5, color)) : 0, x: 18.5 + n % 4, z: 18.5 + Math.floor(n / 4) % 4,
    energy: MAX_ENERGY, bag: { wood: 12, stone: 8, seed: 6, crop: 0, fish: 0, plank: 4, brick: 0, flower: 0, lamp: 1, bench: 0 }, correct: 0, actions: 0, dx: 0, dz: 0, inputAt: 0, actionAt: -1 };
  return true;
}
export const walkable = (w: World, x: number, z: number) => {
  if (!inside(x, z)) return false;
  const t = w.tiles[indexOf(x, z)]; return (!t.nature && t.blocks.length < 2 && (t.ground !== 'water' || t.blocks[0] === 'plank'));
};
export const mature = (w: World, t: Tile) => t.crop !== null && w.time - t.crop >= (t.watered ? GROW_SECONDS / 2 : GROW_SECONDS);
const notice = (text: string): Reply => ({ type: 'notice', text });
function touch(w: World, t: Tile) { t.revision = ++w.revision; }
export function applyCommand(w: World, id: string, raw: unknown): Reply | undefined {
  const p = w.players[id]; if (!p || !raw || typeof raw !== 'object') return;
  const c = raw as Command;
  if (c.type === 'move') {
    if (!Number.isFinite(c.dx) || !Number.isFinite(c.dz) || Math.abs(c.dx) > 1 || Math.abs(c.dz) > 1) return;
    const n = Math.max(1, Math.hypot(c.dx, c.dz)); p.dx = c.dx / n; p.dz = c.dz / n; p.inputAt = w.time; return;
  }
  if (w.paused) return notice('ホストが戻るまで一時停止中です。');
  if (w.time - p.actionAt < .35) return;
  if (c.type === 'craft') {
    if (!BUILDINGS.includes(c.material)) return;
    const recipe = RECIPES[c.material];
    if (Object.entries(recipe).some(([k, n]) => p.bag[k as Material] < n!)) return notice('材料が足りません。');
    if (p.energy < 3) return notice('問題に正解してエネルギーを回復しましょう。');
    for (const [k, n] of Object.entries(recipe)) p.bag[k as Material] -= n!;
    p.bag[c.material]++; p.energy -= 3; p.actionAt = w.time; p.actions++; return notice('クラフトしました！');
  }
  if (c.type === 'donate') {
    if (Math.hypot(p.x - 20, p.z - 20) > 4) return notice('島の中央の広場で納品できます。');
    if (p.bag.crop + p.bag.fish < 1) return notice('作物か魚を納品しましょう。');
    if (p.bag.crop) p.bag.crop--; else p.bag.fish--;
    w.donated++; p.actionAt = w.time; p.bag.seed += 2; return notice('納品ありがとう！種を2個受け取りました。');
  }
  if (c.type !== 'act' || !Number.isInteger(c.tile) || c.tile < 0 || c.tile >= w.tiles.length) return;
  const x = c.tile % SIZE + .5, z = Math.floor(c.tile / SIZE) + .5, t = w.tiles[c.tile];
  if (Math.hypot(x - p.x, z - p.z) > 2.9) return notice('もう少し近づいてください。');
  const cost = c.tool === 'fish' ? 8 : c.tool === 'gather' ? 5 : 3;
  if (p.energy < cost) return notice('問題に正解してエネルギーを回復しましょう。');
  let message = '';
  if (c.tool === 'gather' && t.nature) {
    p.bag[t.nature === 'tree' ? 'wood' : 'stone'] += 3; if (t.nature === 'tree') p.bag.seed++;
    t.regrowKind = t.nature; t.nature = null; t.regrow = w.time + 180; message = '素材を集めました！';
  } else if (c.tool === 'plant' && t.ground === 'grass' && !t.nature && !t.blocks.length && t.crop === null) {
    if (!p.bag.seed) return notice('種が足りません。木を採集するか、広場へ納品しましょう。');
    p.bag.seed--; t.crop = w.time; t.watered = false; t.owner = id; t.regrow = 0; message = '種をまきました。水やりで早く育ちます。';
  } else if (c.tool === 'water' && t.crop !== null && !t.watered) { t.watered = true; message = '水をあげました！';
  } else if (c.tool === 'harvest' && mature(w, t)) {
    p.bag.crop += 2; p.bag.seed += 2; w.harvested++; t.crop = null; t.watered = false; t.owner = ''; message = '収穫しました！';
  } else if (c.tool === 'fish' && t.ground === 'water' && !t.blocks.length) {
    if (w.time - p.actionAt < 3) return notice('釣りは3秒おきにできます。');
    p.bag.fish++; message = '魚が釣れました！';
  } else if (c.tool === 'build' && c.building && BUILDINGS.includes(c.building) && !t.nature && t.crop === null && t.blocks.length < 4) {
    if (t.owner && t.owner !== id) return notice('ほかの人の建築は変更できません。');
    if (Math.hypot(x - 20, z - 20) < 3) return notice('中央の広場は空けておきましょう。');
    if (t.ground === 'water' && !t.blocks.length && c.building !== 'plank') return notice('水の上には木の床で橋を架けられます。');
    if (t.blocks.length && ['flower', 'lamp', 'bench'].includes(t.blocks[t.blocks.length - 1])) return notice('飾りの上には積めません。');
    if (Object.values(w.players).some(q => indexOf(q.x, q.z) === c.tile)) return notice('人がいる場所には置けません。');
    if (!p.bag[c.building]) return notice('材料が足りません。');
    p.bag[c.building]--; t.blocks.push(c.building); t.owner = id; t.regrow = 0; w.built++; message = '建築しました！';
  } else if (c.tool === 'remove' && t.blocks.length) {
    if (t.owner !== id) return notice('ほかの人の建築は変更できません。');
    if (Object.values(w.players).some(q => indexOf(q.x, q.z) === c.tile)) return notice('人がいる場所は片づけられません。');
    p.bag[t.blocks.pop()!]++; if (!t.blocks.length) t.owner = ''; message = '片づけました。素材が戻りました。';
  } else return notice('この場所ではその作業はできません。');
  p.energy -= cost; p.actionAt = w.time; p.actions++; touch(w, t); return notice(message);
}
export function tick(w: World, seconds: number) {
  if (w.paused || !Number.isFinite(seconds) || seconds <= 0) return;
  const dt = Math.min(.1, seconds); w.time += dt;
  for (const p of Object.values(w.players)) {
    if (w.time - p.inputAt > .5 || p.energy <= 0) { p.dx = p.dz = 0; continue; }
    const speed = 3.2, oldX = p.x, oldZ = p.z;
    const step = Math.min(speed * dt, p.energy / .7);
    if (walkable(w, p.x + p.dx * step, p.z)) p.x += p.dx * step;
    if (walkable(w, p.x, p.z + p.dz * step)) p.z += p.dz * step;
    p.energy = Math.max(0, p.energy - Math.hypot(p.x - oldX, p.z - oldZ) * .7);
  }
  for (let i = 0; i < w.tiles.length; i++) { const t = w.tiles[i]; if (t.regrow && w.time >= t.regrow && !t.blocks.length && t.crop === null) {
    if (!Object.values(w.players).some(p => indexOf(p.x, p.z) === i)) { t.nature = t.regrowKind || 'tree'; t.regrow = 0; touch(w, t); }
  }
  }
}
export class QuizBank {
  private pending = new Map<string, { token: string; q: KartQuestion; at: number }>();
  private serial = 0; private cursors = new Map<string, number>();
  constructor(private questions: KartQuestion[]) { if (!questions.length) throw new Error('No questions'); }
  forget(id: string) { this.pending.delete(id); this.cursors.delete(id); }
  ask(w: World, id: string): Reply | undefined {
    const p = w.players[id]; if (!p) return;
    p.dx = p.dz = 0;
    let pending = this.pending.get(id);
    if (!pending) { const index = this.cursors.get(id) || 0; pending = { token: `${w.seed}:${++this.serial}`, q: this.questions[index % this.questions.length], at: w.time }; this.cursors.set(id, index + 1); this.pending.set(id, pending); }
    const { correct: _correct, ...question } = pending.q;
    return { type: 'quiz', token: pending.token, question };
  }
  answer(w: World, id: string, token: unknown, option: unknown): Reply | undefined {
    const p = w.players[id], pending = this.pending.get(id);
    if (!p || !pending || token !== pending.token || !Number.isInteger(option) || (option as number) < 0 || (option as number) > 3 || w.paused) return;
    this.pending.delete(id); const { correct: answerIndex, ...question } = pending.q, correct = option === answerIndex;
    if (correct) { p.energy = Math.min(MAX_ENERGY, p.energy + QUIZ_ENERGY); p.correct++; }
    return { type: 'answer', token: pending.token, correct, answer: pending.q.options[answerIndex], question, selected: pending.q.options[option as number], energy: p.energy, elapsedMs: Math.max(0, (w.time - pending.at) * 1000) };
  }
}
