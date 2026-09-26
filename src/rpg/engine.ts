export const WIDTH = 64,
  HEIGHT = 44,
  CAPACITY = 40;
export type Tile = "grass" | "forest" | "water" | "road" | "stone";
export type SiteKind =
  | "town"
  | "rest"
  | "event"
  | "treasure"
  | "enemy"
  | "guardian"
  | "boss";
export interface Site {
  id: string;
  x: number;
  y: number;
  kind: SiteKind;
  name: string;
  hp: number;
  maxHp: number;
  cleared: boolean;
  raidSize?: number;
  nativeInitialized?: boolean;
}
export interface NativeProfile {
  hp: number;
  maxHp: number;
  gold: number;
  character: string;
  image: string;
  deckSize: number;
}
export interface NativeScene {
  token: string;
  siteId: string;
  damage: number;
  sequence: number;
  teamPower: number;
}
export interface Adventurer {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  hp: number;
  maxHp: number;
  gold: number;
  team: string | null;
  claimed: string[];
  message: string;
  lastMove: number;
  profile?: NativeProfile;
  completedBattles: number;
  siteUses: Record<string, number>;
  nativeScene?: NativeScene;
}
export interface World {
  nativeMode: true;
  seed: number;
  tiles: Tile[];
  sites: Site[];
  players: Record<string, Adventurer>;
  logs: string[];
  won: boolean;
  revision: number;
}
export type Action =
  | { type: "move"; dx: number; dy: number }
  | { type: "team"; target: string | null }
  | { type: "native-enter"; siteId: string }
  | { type: "native-ready"; token: string; maxHp: number }
  | { type: "native-damage"; token: string; total: number; sequence: number }
  | {
      type: "native-finish";
      token: string;
      outcome: "complete" | "victory" | "defeat";
      profile: NativeProfile;
    }
  | { type: "native-profile"; profile: NativeProfile };
export function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const isBattleSite = (s: Site) =>
  ["enemy", "guardian", "boss"].includes(s.kind);
export const isSharedSite = (s: Site) =>
  s.kind === "guardian" || s.kind === "boss";
export function siteUnavailable(
  w: World,
  p: Adventurer,
  s: Site,
): string | null {
  if (p.nativeScene) return "現在のシーンを完了してください。";
  if (w.won) return "校長を倒しました！";
  if (s.cleared) return "討伐済みです。";
  if (s.kind === "treasure" && p.claimed.includes(s.id))
    return "この宝箱は開封済みです。";
  if (["town", "rest", "event"].includes(s.kind)) {
    const remaining =
      3 - ((p.completedBattles || 0) - (p.siteUses?.[s.id] || 0));
    if (remaining > 0)
      return `利用まであと${remaining}回、戦闘に勝利してください。`;
  }
  if (
    s.kind === "boss" &&
    w.sites.some((q) => q.kind === "guardian" && !q.cleared)
  )
    return "3体の試験官を倒すと校長の結界が解除されます。";
  return null;
}
function validProfile(profile: NativeProfile): boolean {
  return (
    !!profile &&
    [profile.hp, profile.maxHp, profile.gold, profile.deckSize].every(
      Number.isFinite,
    ) &&
    profile.maxHp > 0 &&
    profile.hp >= 0 &&
    profile.hp <= profile.maxHp &&
    profile.gold >= 0 &&
    typeof profile.character === "string" &&
    typeof profile.image === "string"
  );
}
function applyNativeAction(
  w: World,
  p: Adventurer,
  action: Action,
  tell: (message: string) => boolean,
): boolean {
  if (action.type === "native-profile") {
    if (p.nativeScene || !validProfile(action.profile)) return false;
    p.profile = action.profile;
    p.hp = action.profile.hp;
    p.maxHp = action.profile.maxHp;
    p.gold = action.profile.gold;
    w.revision++;
    return true;
  }
  if (action.type === "native-enter") {
    const site = w.sites.find((s) => s.id === action.siteId);
    if (!site || distance(site, p) > 2) return false;
    const reason = siteUnavailable(w, p, site);
    if (reason) return tell(reason);
    if (["town", "rest", "event"].includes(site.kind))
      p.siteUses = { ...p.siteUses, [site.id]: p.completedBattles || 0 };
    if (site.kind === "treasure") p.claimed.push(site.id);
    if (site.kind === "boss" && !site.raidSize)
      site.raidSize = Object.keys(w.players).length;
    const teamPower = p.team
      ? 2 *
        Object.values(w.players).filter(
          (q) => q.id !== p.id && q.team === p.team && distance(p, q) <= 5,
        ).length
      : 0;
    p.nativeScene = {
      token: `${p.id}:${w.revision}:${site.id}`,
      siteId: site.id,
      damage: 0,
      sequence: 0,
      teamPower,
    };
    return tell("本編のシーンをプレイ中です。");
  }
  if (!("token" in action) || action.token !== p.nativeScene?.token)
    return false;
  const scene = p.nativeScene;
  const site = w.sites.find((s) => s.id === scene.siteId)!;
  if (action.type === "native-ready") {
    if (
      !isSharedSite(site) ||
      !Number.isFinite(action.maxHp) ||
      action.maxHp <= 0
    )
      return false;
    if (!site.nativeInitialized) {
      site.hp = site.maxHp = Math.ceil(
        action.maxHp *
          (site.kind === "boss" ? Math.max(1, site.raidSize || 1) : 1),
      );
      site.nativeInitialized = true;
    }
    w.revision++;
    return true;
  }
  if (action.type === "native-damage") {
    if (
      !site.nativeInitialized ||
      !isSharedSite(site) ||
      site.cleared ||
      !Number.isFinite(action.total) ||
      !Number.isSafeInteger(action.sequence) ||
      action.sequence <= scene.sequence
    )
      return false;
    const delta = action.total - scene.damage;
    scene.damage = action.total;
    scene.sequence = action.sequence;
    site.hp = Math.max(0, Math.min(site.maxHp, site.hp - delta));
    if (site.hp === 0) {
      site.cleared = true;
      log(w, `${site.name}を討伐！`);
      if (site.kind === "boss") w.won = true;
    }
    w.revision++;
    return true;
  }
  if (action.type === "native-finish") {
    if (
      !validProfile(action.profile) ||
      !["complete", "victory", "defeat"].includes(action.outcome)
    )
      return false;
    if (
      action.outcome === "victory" &&
      (isBattleSite(site) || site.kind === "event")
    ) {
      if (isSharedSite(site) && !site.cleared) return false;
      p.completedBattles = (p.completedBattles || 0) + 1;
    }
    if (action.outcome === "defeat") {
      p.x = 10;
      p.y = 32;
    }
    p.profile = action.profile;
    p.hp = action.profile.hp;
    p.maxHp = action.profile.maxHp;
    p.gold = action.profile.gold;
    delete p.nativeScene;
    return tell(
      action.outcome === "defeat" ? "町に戻りました。" : "探索を続けよう。",
    );
  }
  return false;
}
export function createWorld(seed: number): World {
  const rng = random(seed),
    tiles: Tile[] = [];
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const river = 30 + Math.round(Math.sin(y / 6) * 4);
      tiles.push(
        x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1
          ? "forest"
          : Math.abs(x - river) < 2
            ? "water"
            : rng() < 0.24
              ? "forest"
              : "grass",
      );
    }
  const sites: Site[] = [];
  function add(kind: SiteKind, name: string, x: number, y: number, hp = 0) {
    sites.push({
      id: `site-${sites.length}`,
      kind,
      name,
      x,
      y,
      hp,
      maxHp: hp,
      cleared: false,
    });
  }
  add("town", "木漏れ日の町", 10, 32);
  add("rest", "旅人の焚き火", 21, 27);
  add("town", "星見の宿場", 44, 16);
  add("guardian", "森の試験官", 12 + Math.floor(rng() * 5), 9);
  add("guardian", "水辺の試験官", 39, 32 + Math.floor(rng() * 4));
  add("guardian", "遺跡の試験官", 51, 9 + Math.floor(rng() * 4));
  add("boss", "校長の時計塔", 55, 5);
  const names = {
    enemy: ["チョークの精", "さまよう上履き", "実験失敗スライム"],
    event: ["？イベント"],
    treasure: ["忘れられた宝箱"],
  };
  for (let i = 0; i < 23; i++) {
    const kind = i % 5 === 0 ? "treasure" : i % 4 === 0 ? "event" : "enemy";
    let x = 0,
      y = 0;
    do {
      x = 4 + Math.floor(rng() * 55);
      y = 5 + Math.floor(rng() * 35);
    } while (sites.some((s) => distance(s, { x, y }) < 5));
    add(kind, names[kind][i % names[kind].length], x, y, 0);
  }
  // A connected spanning tree gives landmarks shorter, varied paths instead
  // of parallel corridors radiating from the starting town.
  for (const [index, s] of sites.entries()) {
    const source =
      index === 0
        ? s
        : [...sites.slice(0, index)].sort(
            (a, b) => distance(a, s) - distance(b, s),
          )[0];
    let x = source.x,
      y = source.y;
    const horizontalFirst = rng() > 0.5;
    while (x !== s.x || y !== s.y) {
      tiles[y * WIDTH + x] = "road";
      if (x !== s.x && (horizontalFirst || y === s.y)) x += Math.sign(s.x - x);
      else y += Math.sign(s.y - y);
    }
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        tiles[(s.y + dy) * WIDTH + s.x + dx] =
          s.kind === "boss" ? "stone" : "grass";
    tiles[s.y * WIDTH + s.x] = "road";
  }
  return {
    nativeMode: true,
    seed,
    tiles,
    sites,
    players: {},
    logs: ["冒険のはじまり。3体の試験官を倒し、校長の結界を解こう。"],
    won: false,
    revision: 0,
  };
}
export function addPlayer(w: World, id: string, name: string) {
  if (w.players[id] || Object.keys(w.players).length >= CAPACITY) return false;
  w.players[id] = {
    id,
    name: name.trim().slice(0, 16) || "冒険者",
    x: 9 + (Object.keys(w.players).length % 3),
    y: 32 + (Math.floor(Object.keys(w.players).length / 3) % 2),
    color: Object.keys(w.players).length % 6,
    hp: 75,
    maxHp: 75,
    gold: 0,
    team: null,
    claimed: [],
    completedBattles: 0,
    siteUses: {},
    message: "町で準備を整え、道に沿って探索しよう。",
    lastMove: 0,
  };
  log(w, `${w.players[id].name}が冒険に参加。`);
  w.revision++;
  return true;
}
export function removePlayer(w: World, id: string) {
  if (!w.players[id]) return;
  log(w, `${w.players[id].name}が退出。`);
  delete w.players[id];
  for (const p of Object.values(w.players))
    if (
      p.team &&
      !Object.values(w.players).some((q) => q.id !== p.id && q.team === p.team)
    )
      p.team = null;
  w.revision++;
}
function log(w: World, message: string) {
  w.logs = [message, ...w.logs].slice(0, 8);
}
export function applyAction(
  w: World,
  id: string,
  action: Action,
  now = Date.now(),
): boolean {
  const p = w.players[id];
  if (
    !p ||
    !action ||
    typeof action !== "object" ||
    typeof action.type !== "string"
  )
    return false;
  const tell = (text: string) => {
    p.message = text;
    w.revision++;
    return true;
  };
  if (action.type.startsWith("native-"))
    return applyNativeAction(w, p, action, tell);
  if (w.won || p.nativeScene) return false;
  if (action.type === "move") {
    if (
      !Number.isInteger(action.dx) ||
      !Number.isInteger(action.dy) ||
      Math.abs(action.dx) + Math.abs(action.dy) !== 1 ||
      now - p.lastMove < 100
    )
      return false;
    const x = p.x + action.dx,
      y = p.y + action.dy,
      tile = w.tiles[y * WIDTH + x];
    if (
      x < 1 ||
      x >= WIDTH - 1 ||
      y < 1 ||
      y >= HEIGHT - 1 ||
      tile === "water" ||
      tile === "forest"
    )
      return false;
    p.x = x;
    p.y = y;
    p.lastMove = now;
    w.revision++;
    return true;
  }
  if (action.type === "team") {
    if (action.target === null) {
      p.team = null;
      for (const q of Object.values(w.players))
        if (
          q.team &&
          !Object.values(w.players).some(
            (r) => r.id !== q.id && r.team === q.team,
          )
        )
          q.team = null;
      return tell("チームを離れ、自由探索に戻りました。");
    }
    if (action.target === id) {
      p.team = p.team || id;
      return tell(
        "チームを公開しました。参加は仲間が自由に選べます（最大4人）。",
      );
    }
    const target = w.players[action.target];
    if (!target?.team) return false;
    if (
      Object.values(w.players).filter((q) => q.team === target.team).length >= 4
    )
      return tell("そのチームは満員です。");
    p.team = target.team;
    return tell(`${target.name}のチームに参加しました。`);
  }
  return false;
}
