export type Point = { x: number; z: number; y?: number };
export type Terrain = Point & { w: number; d: number; height: number };
export type Obstacle = Point & { w: number; d: number; h: number; clearance?: number; switchId?: number; kind: 'wall' | 'desk' | 'shelf' | 'planter' | 'crawl' | 'door' };
export type Mission = { size?: number; terrain?: Terrain[]; theme?: number; targetKinds?: ('file' | 'rescue' | 'relay')[]; requireSwitches?: boolean; defend?: Point & { seconds: number }; switches?: Point[]; sensors?: (Point & { w: number; d: number; period: number })[]; difficulty: number; ammo: number; sleepDuration: number; guardSpeed: number; sightRange: number; detectionRate: number; requiredHolds: number; requiredShots: number; id: number; name: string; en: string; hint: string; hintEn: string; par: number; limit: number; spawn: Point; exit: Point; targets: Point[]; obstacles: Obstacle[]; routes: Point[][]; cameras: (Point & { angle: number })[] };
const p = (x: number, z: number): Point => ({ x, z });
const box = (x: number, z: number, w: number, d: number, h = 2.5, kind: Obstacle['kind'] = 'wall'): Obstacle => ({ x, z, w, d, h, kind });
const desks = [-4, 0, 4].flatMap(x => [-2, 2].map(z => box(x, z, 2, 1.2, 1, 'desk')));
type Layout = Omit<Mission, 'difficulty' | 'ammo' | 'sleepDuration' | 'guardSpeed' | 'sightRange' | 'detectionRate' | 'requiredHolds' | 'requiredShots'>;
const BASE: Layout[] = [
  { id: 1, name: '放課後の廊下', en: 'After-school corridor', hint: '青い資料を回収して緑の出口へ。棚で視線を切り、巡回の背後を通ろう。', hintEn: 'Collect the blue file, then reach the green exit. Shelves block sight. Pass behind the patrol.', par: 45, limit: 180, spawn: p(-7, 6), exit: p(7, -6), targets: [p(-6, -5)], obstacles: [box(-3, 1, 2, 4, 2, 'shelf'), box(3, -2, 2, 4, 2, 'shelf')], routes: [[p(0, 4), p(0, -4)]], cameras: [] },
  { id: 2, name: '教室の忘れ物', en: 'Classroom retrieval', hint: '机はしゃがむと隠れられる。Cで切り替え、資料のそばでEを長押し。', hintEn: 'Crouch behind desks with C. Hold E beside each file to collect it.', par: 65, limit: 200, spawn: p(-7, 6), exit: p(7, 6), targets: [p(-6, -5), p(6, -5)], obstacles: desks, routes: [[p(-6, -4), p(6, -4), p(6, 4), p(-6, 4)]], cameras: [] },
  { id: 3, name: '図書室の静寂', en: 'Silent library', hint: '走る音は近くの見回りに届く。しゃがんで本棚の間を進もう。', hintEn: 'Nearby patrols hear footsteps. Crouch silently between the shelves.', par: 80, limit: 220, spawn: p(-7, 6), exit: p(7, -6), targets: [p(-6, -5), p(0, 0), p(6, 5)], obstacles: [-4, 4].flatMap(x => [-3, 3].map(z => box(x, z, 1.4, 4, 2.6, 'shelf'))), routes: [[p(0, -5), p(0, 5)], [p(6, -5), p(6, 4)]], cameras: [] },
  { id: 4, name: '監視カメラの校庭', en: 'Courtyard surveillance', hint: 'カメラの扇形を避けよう。花壇はしゃがむと視線を遮る。', hintEn: 'Avoid the sweeping camera cones. Crouch behind planters for cover.', par: 75, limit: 220, spawn: p(-7, 6), exit: p(7, -6), targets: [p(-6, -5), p(6, 4)], obstacles: [box(-3, -2, 3, 2, 1, 'planter'), box(3, 2, 3, 2, 1, 'planter'), box(0, -5, 2, 1, 2)], routes: [[p(-5, 0), p(5, 0)]], cameras: [{ ...p(7, -4), angle: -Math.PI / 2 }, { ...p(-7, 1), angle: Math.PI / 2 }] },
  { id: 5, name: '職員室への潜入', en: 'Staff-room infiltration', hint: 'Qで向いている先に音のデコイを投げる（3個）。見回りを誘導して通過。', hintEn: 'Press Q to throw a sound decoy ahead (3 charges). Lure patrols away from your route.', par: 90, limit: 240, spawn: p(-7, 6), exit: p(7, 6), targets: [p(-6, -5), p(6, -5), p(0, -5)], obstacles: [box(-3, 0, 1, 8), box(3, 0, 1, 8), box(0, 2, 2, 1.4, 1, 'desk')], routes: [[p(-6, -4), p(-6, 3)], [p(6, 3), p(6, -4)]], cameras: [{ ...p(0, -7), angle: 0 }] },
  { id: 6, name: '最終試験・夜の校舎', en: 'Final exam: night school', hint: 'すべての技能を使って3つの資料を回収。発見されても遮蔽物で警戒を下げられる。', hintEn: 'Use every skill to recover three files. Break line of sight to reduce suspicion.', par: 100, limit: 260, spawn: p(-7, 6), exit: p(7, -6), targets: [p(-6, -5), p(0, 0), p(6, 5)], obstacles: [box(-3, -3, 2, 4, 2, 'shelf'), box(3, 3, 2, 4, 2, 'shelf'), box(-3, 3, 2, 1.4, 1, 'desk'), box(3, -3, 2, 1.4, 1, 'desk')], routes: [[p(-6, -4), p(-6, 4), p(0, 4), p(0, -4)], [p(6, 4), p(6, -4)]], cameras: [{ ...p(0, -7), angle: 0 }] },
];
export const DIFFICULTIES = [
  { ja: '入門', en: 'INTRO' }, { ja: '初級', en: 'EASY' }, { ja: '中級', en: 'NORMAL' }, { ja: '上級', en: 'HARD' }, { ja: '達人', en: 'EXPERT' },
];
const extra = [
  { name: '体育館・ホールド練習', en: 'Gym: sleep hold', obstacles: [box(-3, 0, 2, 3, 1, 'desk'), box(3, 0, 2, 3, 1, 'desk')], routes: [[p(-6, 3), p(-6, -4)], [p(5, -4), p(5, 4)]] },
  { name: '理科室・シャボン実験', en: 'Science lab: bubble practice', obstacles: [box(-3, -2, 2, 2, 1, 'desk'), box(3, 2, 2, 2, 1, 'desk'), box(0, 0, 1, 2, 2, 'shelf')], routes: [[p(-6, 3), p(-6, -4)], [p(6, -4), p(6, 4)]] },
  { name: '保健室・おやすみ作戦', en: 'Nurse room: nap operation', obstacles: [box(-3, 2, 2, 3, 1, 'desk'), box(3, -2, 2, 3, 1, 'desk'), box(0, 0, 1, 2)], routes: [[p(-6, 3), p(-6, -4)], [p(6, -4), p(6, 4)]] },
  { name: '文化祭・総合演習', en: 'School festival: field exam', obstacles: [box(-3, -3, 2, 2, 2, 'shelf'), box(3, 3, 2, 2, 2, 'shelf'), box(-3, 3, 2, 2, 1, 'planter'), box(3, -3, 2, 2, 1, 'planter')], routes: [[p(-6, 3), p(-6, -4)], [p(6, -4), p(6, 4)]] },
];
extra.forEach((e, i) => BASE.push({ ...BASE[0], ...e, id: i + 7, spawn: p(-6, 6), targets: [p(-6, -5), p(6, 5)], exit: p(7, -6), par: 100, limit: 260, hint: '背後でFを長押ししてホールド。向きを合わせてRでシャボン発射。課題を達成して脱出しよう。', hintEn: 'Hold F behind a patrol for a sleep hold. Face a target and press R to fire a bubble. Complete the objectives and extract.' }));
// Ten school layouts, each with five authored difficulty configurations. Rotation,
// additional patrols/cameras, recovery times and equipment change the route strategy.
export const MISSIONS: Mission[] = Array.from({ length: 50 }, (_, index) => {
  const tier = Math.floor(index / 10), slot = index % 10, base = BASE[slot];
  const rotation = tier % 4;
  const rotate = (q: Point): Point => { let r = { ...q }; for (let i = 0; i < rotation; i++) r = { x: -r.z, z: r.x }; return r; };
  const obstacles = base.obstacles.map(b => ({ ...b, ...rotate(b), w: rotation % 2 ? b.d : b.w, d: rotation % 2 ? b.w : b.d }));
  const switches: Point[] = [];
  if ([0, 2, 5, 9].includes(slot)) obstacles.push({ ...box(-6.6, 3, 2.2, 1.2, 2.5, 'crawl'), ...rotate(p(-6.6, 3)), w: rotation % 2 ? 1.2 : 2.2, d: rotation % 2 ? 2.2 : 1.2, clearance: .95 });
  if ([1, 4, 8, 9].includes(slot)) {
    switches.push(rotate(p(-6, -.5)));
    obstacles.push({ ...box(-6, -2, 2.5, .4, 2.5, 'door'), ...rotate(p(-6, -2)), w: rotation % 2 ? .4 : 2.5, d: rotation % 2 ? 2.5 : .4, switchId: 0 });
  }
  const sensors = [3, 5, 8, 9].includes(slot) ? [{ ...rotate(p(-6, 1)), w: rotation % 2 ? .22 : 2.7, d: rotation % 2 ? 2.7 : .22, period: 5 - tier * .4 }] : [];
  const routes = base.routes.map(r => r.map(rotate));
  if (tier >= 2) routes.push([p(7, 5), p(7, -5)].map(rotate));
  if (tier >= 4) routes.push([p(-5, -7), p(5, -7)].map(rotate));
  const cameras = [...base.cameras];
  if (tier >= 1 && slot % 2 === 0) cameras.push({ ...p(0, -7), angle: 0 });
  if (tier >= 3) cameras.push({ ...p(7, 0), angle: -Math.PI / 2 });
  const targets = [...base.targets];
  if (tier >= 2 && !targets.some(q => q.x === 5 && q.z === -6)) targets.push(p(5, -6));
  const requiredHolds = slot === 6 || slot === 8 || slot === 9 ? 1 : 0;
  const requiredShots = slot === 7 || slot === 8 || slot === 9 ? 1 : 0;
  return { ...base, id: index + 1, name: tier ? `${DIFFICULTIES[tier].ja}・${base.name}` : base.name, en: tier ? `${DIFFICULTIES[tier].en}: ${base.en}` : base.en,
    difficulty: tier, ammo: [6, 5, 4, 3, 2][tier], sleepDuration: [22, 19, 16, 13, 10][tier], guardSpeed: [1.05, 1.15, 1.3, 1.45, 1.6][tier], sightRange: [5.8, 6, 6.3, 6.6, 7][tier], detectionRate: [1, 1.05, 1.15, 1.3, 1.45][tier], requiredHolds, requiredShots,
    par: base.par + tier * 8, limit: Math.max(150, base.limit + tier * 10), spawn: rotate(base.spawn), exit: rotate(base.exit), targets: targets.map(rotate), obstacles, routes, switches, sensors,
    cameras: cameras.map(c => ({ ...rotate(c), angle: c.angle - rotation * Math.PI / 2 })),
  };
});
// Keep IDs 1–50 stable so existing records and invitations remain valid.
const AREAS = [
 ['屋上庭園','Rooftop garden'], ['港の倉庫','Harbor depot'], ['山岳研究所','Mountain lab'],
 ['地下基地','Underground base'], ['都市の広場','City plaza'], ['森林キャンプ','Forest camp'],
 ['空中回廊','Sky corridor'], ['雪の観測所','Snow observatory'], ['砂漠の遺跡','Desert ruins'], ['宇宙訓練基地','Space academy'],
];
for (let n = 0; n < 250; n++) {
 const tier = Math.floor(n / 50), variant = n % 50, area = variant % 10, layout = Math.floor(variant / 10);
 const size = [8, 11, 15, 19, 24][(area + layout) % 5];
 const sx = (size - 1) / 7, sz = sx * [1, .75, .9, 1, .65][layout];
 const source = MISSIONS[tier * 10 + (area + layout * 3) % 10];
 const scale = (q: Point): Point => ({ x: q.x * sx, z: q.z * sz });
 const terrain: Terrain[] = layout === 0 ? [] : [{ x: 0, z: 0, w: size * 2, d: size * 2, height: [0, 2, 4, 6, 3][layout] }];
 const targets = source.targets.map(scale);
 const switches = (source.switches ?? []).map(scale);
 const defend = layout >= 3 ? { ...scale(p(0, 6)), seconds: 3 + tier } : undefined;
 MISSIONS.push({ ...source, id: n + 51, size, terrain, theme: area,
 name: `${DIFFICULTIES[tier].ja}・${AREAS[area][0]} ${layout + 1}`, en: `${DIFFICULTIES[tier].en}: ${AREAS[area][1]} ${layout + 1}`,
 spawn: scale(source.spawn), exit: scale(source.exit), targets,
 targetKinds: targets.map((_, i) => ['file', 'rescue', 'relay'][(i + layout) % 3] as 'file' | 'rescue' | 'relay'),
 switches, requireSwitches: switches.length > 0, defend,
 obstacles: source.obstacles.map(b => ({ ...b, ...scale(b), w: b.w * sx, d: b.d * sz })),
 routes: source.routes.map(r => r.map(scale)), cameras: source.cameras.map(c => ({ ...c, ...scale(c) })),
 sensors: (source.sensors ?? []).map(b => ({ ...b, ...scale(b), w: b.w * sx, d: b.d * sz })),
 ammo: 12 + tier * 2, par: Math.round(source.par * sx + (defend?.seconds ?? 0)), limit: Math.round(source.limit * sx + 60),
 hint: '資料回収・救助・端末操作は近くで回収を長押し。坂を登り、扉のスイッチと黄色い防衛地点も確認。武器スロットで射程を選び、アイテムを使って全目標達成後に出口へ。',
 hintEn: 'Hold Collect near files, rescues and relays. Climb slopes, activate door switches and hold the yellow defense zone. Select weapon range and use items; finish every objective before extraction.',
 });
}
// Continuous terraced terrain: every elevation is accessible from either side.
export function floorHeight(m: Mission, q: Point): number {
 return Math.max(0, ...(m.terrain ?? []).map(t => Math.abs(q.x - t.x) <= t.w / 2 && Math.abs(q.z - t.z) <= t.d / 2 ? t.height * Math.max(0, Math.min(1, (q.x-t.x+t.w/2)/t.w*3, (t.x+t.w/2-q.x)/t.w*3)) * Math.max(0,Math.min(1,(t.d/2-Math.abs(q.z-t.z))/3)) : 0));
}
export const WEAPONS = [
 { ja: 'シャボン銃', en: 'Bubble pistol', icon: '◉', range: 6, cooldown: .65, spread: .4, cost: 1, melee: false },
 { ja: '訓練ライフル', en: 'Training rifle', icon: '⌖', range: 12, cooldown: 1.1, spread: .25, cost: 2, melee: false },
 { ja: 'フォーム散弾銃', en: 'Foam shotgun', icon: '⋔', range: 4, cooldown: 1.4, spread: .9, cost: 2, melee: false },
 { ja: '連射ブラスター', en: 'Rapid blaster', icon: '»', range: 7, cooldown: .25, spread: .3, cost: 1, melee: false },
 { ja: 'スポンジバトン', en: 'Foam baton', icon: '⚒', range: 1.6, cooldown: .55, spread: .65, cost: 0, melee: true },
 { ja: '訓練ハンマー', en: 'Training hammer', icon: '◆', range: 2, cooldown: 1.2, spread: 1, cost: 0, melee: true },
];
export const ITEMS = [
 { ja: '音のデコイ', en: 'Sound decoy', icon: '♪' }, { ja: '弾薬パック', en: 'Ammo pack', icon: '▣' },
 { ja: '光学マント', en: 'Stealth cloak', icon: '◌' }, { ja: 'スピード靴', en: 'Speed boots', icon: '↗' },
];
export const WEAPON_UNLOCKS = [1, 61, 111, 171, 31, 231];
export const ITEM_UNLOCKS = [1, 41, 121, 201];
export function equip(m: Mission, s: Run, input: Input) {
 if (Number.isInteger(input.weapon) && WEAPON_UNLOCKS[input.weapon!] <= m.id) s.weapon=input.weapon!;
 if (Number.isInteger(input.item) && ITEM_UNLOCKS[input.item!] <= m.id) s.item=input.item!;
 if (!(WEAPON_UNLOCKS[s.weapon] <= m.id)) s.weapon=0;
 if (!(ITEM_UNLOCKS[s.item] <= m.id)) s.item=0;
}
export type Guard = Point & { angle: number; waypoint: number; investigate: Point | null; search: number; sleep: number; heldOnce: boolean; shotOnce: boolean; detour?: Point[] };
export type Run = { weapon: number; item: number; items: number[]; stealth: number; boost: number; meleeHits: number; defended: number; switches: boolean[]; switchProgress: number; ammo: number; shotCooldown: number; holdTarget: number; holdProgress: number; holds: number; shots: number; bubble: (Point & { end: Point; life: number; hit: boolean }) | null; player: Point & { angle: number }; guards: Guard[]; collected: boolean[]; time: number; detection: number; peak: number; crouch: boolean; interact: number; status: 'playing' | 'clear' | 'caught' | 'timeout'; decoys: number; cooldown: number; noise: (Point & { life: number }) | null };
export type Input = { x: number; z: number; interact: boolean; crouch: boolean; decoy: boolean; weapon?: number; item?: number; useItem?: boolean; hold?: boolean; shoot?: boolean; facing?: number };
export function createRun(m: Mission): Run { return { weapon: 0, item: 0, items: ITEM_UNLOCKS.map((level,i)=>m.id>=level?(i===0?3:2):0), stealth: 0, boost: 0, meleeHits: 0, defended: 0, switches: (m.switches ?? []).map(() => false), switchProgress: 0, ammo: m.ammo, shotCooldown: 0, holdTarget: -1, holdProgress: 0, holds: 0, shots: 0, bubble: null, player: { ...m.spawn, angle: Math.PI }, guards: m.routes.map(r => ({ ...r[0], angle: Math.atan2(r[1].x - r[0].x, r[1].z - r[0].z), waypoint: 1, investigate: null, search: 0, sleep: 0, heldOnce: false, shotOnce: false })), collected: m.targets.map(() => false), time: 0, detection: 0, peak: 0, crouch: false, interact: 0, status: 'playing', decoys: 3, cooldown: 0, noise: null }; }
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z, (a.y ?? 0) - (b.y ?? 0));
export function activeObstacles(m: Mission, s?: Pick<Run, 'switches'>): Obstacle[] { return m.obstacles.filter(b => b.kind !== 'door' || !s?.switches[b.switchId ?? 0]); }
export function blocked(m: Mission, p: Point, radius = .27, crouch = false, s?: Pick<Run, 'switches'>): boolean {
  return Math.abs(p.x) > (m.size ?? 7.75) - radius || Math.abs(p.z) > (m.size ?? 7.75) - radius || activeObstacles(m, s).some(b => !(crouch && (b.clearance ?? 0) >= .85) && Math.abs(p.x - b.x) < b.w / 2 + radius && Math.abs(p.z - b.z) < b.d / 2 + radius);
}
export function cameraBlocked(m: Mission, s: Run, p: Point, y: number): boolean {
  return Math.abs(p.x) > (m.size ?? 7.75) - .05 || Math.abs(p.z) > (m.size ?? 7.75) - .05 || activeObstacles(m, s).some(b => y > floorHeight(m, b) + (b.clearance ?? 0) - .1 && y < floorHeight(m, b) + b.h + .1 && Math.abs(p.x - b.x) < b.w / 2 + .12 && Math.abs(p.z - b.z) < b.d / 2 + .12);
}
export function underPassage(m: Mission, p: Point): boolean { return m.obstacles.some(b => !!b.clearance && Math.abs(p.x - b.x) < b.w / 2 + .27 && Math.abs(p.z - b.z) < b.d / 2 + .27); }
export const sensorActive = (period: number, time: number) => time % period < period * .58;
export function nearbySwitch(m: Mission, s: Run): number { return (m.switches ?? []).findIndex((p, i) => !s.switches[i] && distance({ ...p, y: floorHeight(m, p) }, s.player) < 1.25 && clearSight(m, s.player, p, true, s)); }
export function clearSight(m: Mission, from: Point, to: Point, crouch: boolean, s?: Pick<Run, 'switches'>): boolean {
  for (const b of activeObstacles(m, s)) {
    if (floorHeight(m, b) + b.h < floorHeight(m, from) + (crouch ? .7 : 1.4) || (b.clearance ?? 0) > (crouch ? .7 : 1.4)) continue;
    let near = 0, far = 1;
    for (const axis of ['x', 'z'] as const) {
      const extent = (axis === 'x' ? b.w : b.d) / 2, delta = to[axis] - from[axis];
      if (Math.abs(delta) < .00001) { if (Math.abs(from[axis] - b[axis]) >= extent) { near = 2; break; } }
      else { const a = (b[axis] - extent - from[axis]) / delta, c = (b[axis] + extent - from[axis]) / delta; near = Math.max(near, Math.min(a, c)); far = Math.min(far, Math.max(a, c)); }
    }
    if (near < far && far > 0 && near < 1) return false;
  }
  return true;
}
// Short grid detours keep guards from sticking to furniture after investigating a sound.
export function findPath(m: Mission, from: Point, to: Point, s?: Pick<Run, 'switches'>): Point[] {
  const cell = (p: Point) => ({ x: Math.round(p.x * 2), z: Math.round(p.z * 2) });
  const a = cell(from), b = cell(to), key = (p: Point) => `${p.x},${p.z}`;
  const queue = [a], parents = new Map<string, Point | null>([[key(a), null]]); let found: Point | null = null;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]; if (p.x === b.x && p.z === b.z) { found = p; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = { x: p.x + dx, z: p.z + dz }; if (!parents.has(key(n)) && !blocked(m, { x: n.x / 2, z: n.z / 2 }, .3, false, s)) { parents.set(key(n), p); queue.push(n); } }
  }
  if (!found) return [];
  const path: Point[] = []; for (let p: Point | null = found; p && parents.get(key(p)); p = parents.get(key(p))!) path.unshift({ x: p.x / 2, z: p.z / 2 }); return path;
}
export function visible(m: Mission, from: Point, angle: number, to: Point, crouch: boolean, range = 5.8, s?: Pick<Run, 'switches'>): boolean {
  const d = distance(from, to); if (d > range) return false;
  const delta = Math.atan2(Math.sin(Math.atan2(to.x - from.x, to.z - from.z) - angle), Math.cos(Math.atan2(to.x - from.x, to.z - from.z) - angle));
  return Math.abs(delta) < .6 && clearSight(m, from, to, crouch, s);
}
export const cameraAngle = (m: Mission, index: number, time: number) => m.cameras[index].angle + Math.sin(time * .65 + index) * .65;
export function holdCandidate(m: Mission, s: Run): number {
  return s.guards.findIndex(g => {
    const d = distance(g, s.player);
    const behind = ((s.player.x - g.x) * Math.sin(g.angle) + (s.player.z - g.z) * Math.cos(g.angle)) / Math.max(.01, d);
    return g.sleep <= 0 && d <= 1.15 && d > .1 && behind < -.55 && clearSight(m, g, s.player, true, s);
  });
}
export const objectivesComplete = (m: Mission, s: Run) => s.collected.every(Boolean) && s.holds >= m.requiredHolds && s.shots >= m.requiredShots && (!m.requireSwitches || s.switches.every(Boolean)) && s.defended >= (m.defend?.seconds ?? 0);
function sleepGuard(m: Mission, s: Run, index: number, method: 'hold' | 'shot' | 'melee') {
  const g = s.guards[index]; g.sleep = m.sleepDuration; g.investigate = null; g.detour = undefined;
  if (method === 'melee') s.meleeHits++;
  if (method === 'hold' && !g.heldOnce) { g.heldOnce = true; s.holds++; }
  if (method === 'shot' && !g.shotOnce) { g.shotOnce = true; s.shots++; }
}
export function step(m: Mission, s: Run, input: Input, dt: number) {
  if (s.status !== 'playing') return;
  dt = Math.min(Math.max(dt, 0), .05);
  equip(m,s,input);
  s.stealth = Math.max(0, s.stealth - dt); s.boost = Math.max(0, s.boost - dt);
  if (input.useItem && s.cooldown === 0 && s.items[s.item] > 0) {
   s.items[s.item]--; s.cooldown = 1;
   if (s.item === 0) { s.cooldown = 0; input = { ...input, decoy: true }; }
   if (s.item === 1) s.ammo += 8;
   if (s.item === 2) s.stealth = 6;
   if (s.item === 3) s.boost = 8;
  }
  s.player.y = floorHeight(m, s.player); s.guards.forEach(g => { g.y = floorHeight(m, g); });
  const weapon = WEAPONS[s.weapon]; s.time += dt; s.crouch = input.crouch || underPassage(m, s.player);
  if (input.facing !== undefined) s.player.angle = input.facing; s.cooldown = Math.max(0, s.cooldown - dt);
  if (s.noise) { s.noise.life -= dt; if (s.noise.life <= 0) s.noise = null; }
  s.shotCooldown = Math.max(0, s.shotCooldown - dt);
  if (s.bubble) { s.bubble.life -= dt; if (s.bubble.life <= 0) s.bubble = null; }
  const candidate = input.hold ? holdCandidate(m, s) : -1;
  if (candidate >= 0 && Math.hypot(input.x, input.z) < .1) {
    if (s.holdTarget !== candidate) s.holdProgress = 0;
    s.holdTarget = candidate; s.holdProgress += dt;
    s.player.angle = s.guards[candidate].angle;
    if (s.holdProgress >= .9) { sleepGuard(m, s, candidate, 'hold'); s.holdTarget = -1; s.holdProgress = 0; }
  } else { s.holdTarget = -1; s.holdProgress = 0; }
  if (input.shoot && s.ammo >= weapon.cost && s.shotCooldown === 0 && s.holdTarget < 0) {
    s.ammo -= weapon.cost; s.shotCooldown = weapon.cooldown;
    const candidates = s.guards.map((g, i) => {
      const dx = g.x - s.player.x, dz = g.z - s.player.z;
      return { g, i, along: dx * Math.sin(s.player.angle) + dz * Math.cos(s.player.angle), side: Math.abs(dx * Math.cos(s.player.angle) - dz * Math.sin(s.player.angle)) };
    }).filter(c => c.g.sleep <= 0 && c.along > 0 && c.along <= weapon.range && c.side < weapon.spread && Math.abs((c.g.y ?? 0) - (s.player.y ?? 0)) < 1.2 && clearSight(m, s.player, c.g, true, s)).sort((a, b) => a.along - b.along);
    const hits = s.weapon === 2 || s.weapon === 5 ? candidates : candidates.slice(0, 1);
    hits.forEach(c => sleepGuard(m, s, c.i, weapon.melee ? 'melee' : 'shot'));
    let end: Point = { ...s.player };
    for (let r = .2; r <= weapon.range; r += .08) {
      const q = { x: s.player.x + Math.sin(s.player.angle) * r, z: s.player.z + Math.cos(s.player.angle) * r };
      if (blocked(m, q, .04, s.crouch, s)) break; end = q;
      if (hits.length && distance(q, hits[0].g) < .4) break;
    }
    s.bubble = { ...s.player, end, life: .4, hit: hits.length > 0 };
  }
  const len = Math.hypot(input.x, input.z), speed = (s.crouch ? 1.65 : 3.3) * (s.boost > 0 ? 1.6 : 1);
  if (len > .1) {
    const dx = input.x / Math.max(1, len) * speed * dt, dz = input.z / Math.max(1, len) * speed * dt;
    if (input.facing === undefined) s.player.angle = Math.atan2(input.x, input.z);
    if (!blocked(m, { x: s.player.x + dx, z: s.player.z }, .27, s.crouch, s)) s.player.x += dx;
    if (!blocked(m, { x: s.player.x, z: s.player.z + dz }, .27, s.crouch, s)) s.player.z += dz;
  }
  s.player.y = floorHeight(m, s.player);
  if (input.decoy && s.decoys > 0 && s.cooldown === 0) {
    let target: Point = { ...s.player };
    for (let d = .3; d < 4; d += .2) { const next = { x: s.player.x + Math.sin(s.player.angle) * d, z: s.player.z + Math.cos(s.player.angle) * d }; if (blocked(m, next, .1, s.crouch, s)) break; target = next; }
    s.noise = { ...target, life: 3 }; s.decoys--; s.items[0]=s.decoys; s.cooldown = 1;
    s.guards.forEach(g => { if (g.sleep <= 0 && distance(g, target) < 8) { g.investigate = { ...target }; g.search = 4; g.detour = undefined; } });
  }
  let seen = false;
  s.guards.forEach((g, i) => {
    if (g.sleep > 0) { g.sleep = Math.max(0, g.sleep - dt); return; }
    if (s.holdTarget === i) return;
    if (!s.crouch && len > .1 && distance(g, s.player) < 2.5 && clearSight(m, g, s.player, false, s)) { g.investigate = { ...s.player }; g.search = 2; g.detour = undefined; }
    const route = m.routes[i], destination = g.investigate ?? route[g.waypoint];
    if (g.detour?.length && distance(g, g.detour[0]) < .15) g.detour.shift();
    const target = g.detour?.[0] ?? destination;
    const d = distance(g, target);
    if (d > .12) {
      g.angle = Math.atan2(target.x - g.x, target.z - g.z);
      const stride = Math.min(d, dt * (g.investigate ? m.guardSpeed * 1.4 : m.guardSpeed));
      const next = { x: g.x + Math.sin(g.angle) * stride, z: g.z + Math.cos(g.angle) * stride };
      if (!blocked(m, next, .18, false, s)) { g.x = next.x; g.z = next.z; }
      else { g.detour = findPath(m, g, destination, s); if (!g.detour.length && g.investigate) { g.search -= dt; if (g.search <= 0) g.investigate = null; } }
    } else if (g.investigate) { g.search -= dt; g.angle += dt * .8; if (g.search <= 0) g.investigate = null; }
    else g.waypoint = (g.waypoint + 1) % route.length;
    if (visible(m, g, g.angle, s.player, s.crouch, m.sightRange, s) || distance(g, s.player) < .5) seen = true;
  });
  m.cameras.forEach((c, i) => { if (visible(m, c, cameraAngle(m, i, s.time), s.player, s.crouch, 6.3, s)) seen = true; });
  if (!s.crouch && (m.sensors ?? []).some(b => sensorActive(b.period, s.time) && Math.abs(s.player.x - b.x) < b.w / 2 + .25 && Math.abs(s.player.z - b.z) < b.d / 2 + .25)) seen = true;
  if (s.stealth > 0) seen = false;
  if (m.defend && distance(s.player, { ...m.defend, y: floorHeight(m, m.defend) }) < 1.4 && !seen) s.defended = Math.min(m.defend.seconds, s.defended + dt);
  s.detection = Math.max(0, Math.min(100, s.detection + dt * (seen ? (s.crouch ? 48 : 70) * m.detectionRate : -32))); s.peak = Math.max(s.peak, s.detection);
  if (s.detection >= 100) { s.status = 'caught'; return; }
  if (s.time >= m.limit) { s.status = 'timeout'; return; }
  const switchIndex = nearbySwitch(m, s);
  if (input.interact && switchIndex >= 0 && len < .1) {
    s.switchProgress += dt;
    if (s.switchProgress >= .65) { s.switches[switchIndex] = true; s.switchProgress = 0; s.guards.forEach(g => { g.detour = undefined; }); }
  } else s.switchProgress = 0;
  const target = m.targets.findIndex((p, i) => !s.collected[i] && distance(s.player, { ...p, y: floorHeight(m, p) }) < 1.2);
  if (input.interact && switchIndex < 0 && target >= 0 && len < .1) { s.interact += dt; if (s.interact >= (m.targetKinds?.[target]==='relay'?1.5:m.targetKinds?.[target]==='rescue'?1.2:.8)) { s.collected[target] = true; s.interact = 0; } } else s.interact = 0;
  if (objectivesComplete(m, s) && distance(s.player, { ...m.exit, y: floorHeight(m, m.exit) }) < .9) s.status = 'clear';
}
export function rank(m: Mission, s: Run) { return s.time <= m.par && s.peak < 1 ? 'S' : s.time <= m.par * 1.5 && s.peak < 50 ? 'A' : 'B'; }
export const SAVE_KEY = 'gakurogear-vr-v1';
export type Records = Record<number, { time: number; rank: string }>;
export function readRecords(): Records { try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return Object.fromEntries(Object.entries(raw).filter(([key, v]: [string, any]) => MISSIONS.some(m => m.id === Number(key)) && v && Number.isFinite(v.time) && v.time > 0 && ['S', 'A', 'B'].includes(v.rank))); } catch { return {}; } }
