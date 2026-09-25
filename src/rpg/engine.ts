import { CARDS_LIBRARY } from "../constants";
import { SCIENCE_G5_DATA } from "../data/subjects/science_g5";

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
}
export interface Quiz {
  question: string;
  options: string[];
  answer: number;
  hint: string;
}
export interface Battle {
  siteId: string;
  hp: number;
  maxHp: number;
  turn: number;
  phase: "quiz" | "cards";
  quiz: Quiz;
  hand: string[];
  draw: string[];
  discard: string[];
  energy: number;
  block: number;
  vulnerable: number;
  weak: number;
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
  level: number;
  xp: number;
  team: string | null;
  deck: string[];
  upgrades: string[];
  claimed: string[];
  battle: Battle | null;
  correct: number;
  answers: number;
  message: string;
  lastMove: number;
}
export interface World {
  seed: number;
  tiles: Tile[];
  sites: Site[];
  players: Record<string, Adventurer>;
  logs: string[];
  won: boolean;
  subject: "math" | "science";
  revision: number;
}
export type Action =
  | { type: "move"; dx: number; dy: number }
  | { type: "interact"; siteId: string }
  | { type: "answer"; index: number }
  | { type: "card"; index: number }
  | { type: "end" }
  | { type: "flee" }
  | { type: "town"; choice: "rest" | "upgrade" | "buy"; card?: string }
  | { type: "team"; target: string | null }
  | { type: "support" };
export const CARD_KEYS = [
  "STRIKE",
  "DEFEND",
  "BASH",
  "IRON_WAVE",
  "POMMEL_STRIKE",
  "SHRUG_IT_OFF",
];
export const card = (key: string) => CARDS_LIBRARY[key];
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
function shuffled<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function createWorld(
  seed: number,
  subject: World["subject"] = "math",
): World {
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
  add("guardian", "森の試験官", 12 + Math.floor(rng() * 5), 9, 100);
  add("guardian", "水辺の試験官", 39, 32 + Math.floor(rng() * 4), 100);
  add("guardian", "遺跡の試験官", 51, 9 + Math.floor(rng() * 4), 100);
  add("boss", "校長の時計塔", 55, 5, 600);
  const names = {
    enemy: ["チョークの精", "さまよう上履き", "実験失敗スライム"],
    event: ["旅する図書委員", "古い学習石碑"],
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
    add(
      kind,
      names[kind][i % names[kind].length],
      x,
      y,
      kind === "enemy" ? 32 + (i % 3) * 8 : 0,
    );
  }
  // A connected spanning tree gives landmarks shorter, varied paths instead
  // of parallel corridors radiating from the starting town.
  for (const [index, s] of sites.entries()) {
    const source = index === 0 ? s : [...sites.slice(0, index)].sort((a,b) => distance(a,s)-distance(b,s))[0];
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
    seed,
    tiles,
    sites,
    players: {},
    logs: ["冒険のはじまり。3体の試験官を倒し、校長の結界を解こう。"],
    won: false,
    subject,
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
    gold: 30,
    level: 1,
    xp: 0,
    team: null,
    deck: [
      "STRIKE",
      "STRIKE",
      "STRIKE",
      "STRIKE",
      "DEFEND",
      "DEFEND",
      "DEFEND",
      "BASH",
      "IRON_WAVE",
      "POMMEL_STRIKE",
    ],
    upgrades: [],
    claimed: [],
    battle: null,
    correct: 0,
    answers: 0,
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
function quiz(w: World, p: Adventurer, turn: number): Quiz {
  const rng = random(w.seed + p.answers * 7919 + turn * 17 + p.color * 101);
  if (w.subject === "science") {
    const pool = Object.values(SCIENCE_G5_DATA)
      .flat()
      .filter((q) => q.options?.includes(q.answer));
    const q = pool[Math.floor(rng() * pool.length)],
      options = shuffled(q.options!, rng);
    return {
      question: q.question,
      options,
      answer: options.indexOf(q.answer),
      hint: q.hint || q.answer,
    };
  }
  const a = 2 + Math.floor(rng() * 10),
    b = 2 + Math.floor(rng() * 9),
    multiply = rng() > 0.4;
  const result = multiply ? a * b : a + b;
  const options = shuffled(
    [result, result + 1, result - 2, result + 5].map(String),
    rng,
  );
  return {
    question: `${a} ${multiply ? "×" : "＋"} ${b} = ?`,
    options,
    answer: options.indexOf(String(result)),
    hint: multiply
      ? `${a} を ${b} 回たすと ${result}。`
      : `${a} に ${b} をたすと ${result}。`,
  };
}
function draw(w: World, p: Adventurer, count: number) {
  const b = p.battle!;
  for (let i = 0; i < count; i++) {
    if (!b.draw.length) {
      b.draw = shuffled(b.discard, random(w.seed + p.answers + b.turn));
      b.discard = [];
    }
    const c = b.draw.pop();
    if (c) b.hand.push(c);
  }
}
function startBattle(w: World, p: Adventurer, s: Site) {
  if (s.kind === 'boss' && !s.raidSize) {
    s.raidSize = Object.keys(w.players).length;
    s.hp = s.maxHp = Math.max(600, s.raidSize * 80);
  }
  p.battle = {
    siteId: s.id,
    hp: s.hp,
    maxHp: s.maxHp,
    turn: 1,
    phase: "quiz",
    quiz: quiz(w, p, 1),
    hand: [],
    draw: shuffled(p.deck, random(w.seed + p.answers + p.color)),
    discard: [],
    energy: 0,
    block: 0,
    vulnerable: 0,
    weak: 0,
  };
  draw(w, p, 5);
}
function reward(w: World, p: Adventurer, s: Site) {
  if (s.kind !== "enemy" && p.claimed.includes(s.id)) return;
  p.claimed.push(s.id);
  p.gold += s.kind === "boss" ? 150 : 25;
  p.xp += s.kind === "enemy" ? 1 : 3;
  if (p.xp >= 3) {
    p.xp -= 3;
    p.level++;
    p.maxHp += 8;
    p.hp = Math.min(p.maxHp, p.hp + 20);
  }
  if (s.kind === "enemy") p.deck.push(CARD_KEYS[3 + (p.answers % 3)]);
  p.battle = null;
  p.message = `${s.name}に勝利！ コインと経験値${s.kind === "enemy" ? "、カードを獲得。" : "を獲得。"}`;
}
function defeat(w: World, p: Adventurer) {
  p.hp = Math.ceil(p.maxHp * 0.6);
  p.x = 10;
  p.y = 32;
  p.battle = null;
  p.gold = Math.max(0, p.gold - 10);
  p.message =
    "町の保健室で復活。コインを10失いました。仲間や防御カードを活用しよう。";
}
export function applyAction(
  w: World,
  id: string,
  action: Action,
  now = Date.now(),
): boolean {
  const p = w.players[id];
  if (!p || !action || typeof action !== "object") return false;
  const tell = (text: string) => {
    p.message = text;
    w.revision++;
    return true;
  };
  if (w.won) return false;
  if (action.type === "move") {
    if (
      p.battle ||
      !Number.isInteger(action.dx) ||
      !Number.isInteger(action.dy) ||
      Math.abs(action.dx) + Math.abs(action.dy) !== 1 ||
      now - p.lastMove < 100
    )
      return false;
    const x = p.x + action.dx,
      y = p.y + action.dy,
      t = w.tiles[y * WIDTH + x];
    if (
      x < 1 ||
      x >= WIDTH - 1 ||
      y < 1 ||
      y >= HEIGHT - 1 ||
      t === "water" ||
      t === "forest"
    )
      return false;
    p.x = x;
    p.y = y;
    p.lastMove = now;
    w.revision++;
    return true;
  }
  if (action.type === "team") {
    if (p.battle) return false;
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
    // Only join an explicitly opened team; invitations cannot force another player in.
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
  if (action.type === "support") {
    if (p.battle || !p.team || p.gold < 10) return false;
    const allies = Object.values(w.players).filter(
      (q) => q.team === p.team && distance(p, q) <= 5 && q.hp < q.maxHp,
    );
    if (!allies.length) return tell("5マス以内に回復が必要な仲間がいません。");
    p.gold -= 10;
    allies.forEach((q) => {
      q.hp = Math.min(q.maxHp, q.hp + 15);
    });
    return tell("応援エール！ 近くのチームメンバーのHPを15回復。");
  }
  if (action.type === "town") {
    if (
      p.battle ||
      !w.sites.some(
        (s) => (s.kind === "town" || s.kind === "rest") && distance(s, p) <= 2,
      )
    )
      return false;
    if (action.choice === "rest") {
      p.hp = p.maxHp;
      return tell("休憩してHPが全回復しました。");
    }
    if (
      action.choice === "upgrade" &&
      typeof action.card === "string" &&
      p.deck.includes(action.card) &&
      !p.upgrades.includes(action.card) &&
      p.gold >= 30
    ) {
      p.gold -= 30;
      p.upgrades.push(action.card);
      return tell(
        `${card(action.card).name}を強化！ 同名カードのダメージ・ブロック+3。`,
      );
    }
    if (
      action.choice === "buy" &&
      CARD_KEYS.includes(action.card!) &&
      p.gold >= 25
    ) {
      p.gold -= 25;
      p.deck.push(action.card!);
      return tell("カードを購入してデッキに追加しました。");
    }
    return false;
  }
  if (action.type === "interact") {
    if (p.battle) return false;
    const s = w.sites.find((s) => s.id === action.siteId);
    if (!s || distance(s, p) > 2) return false;
    if (s.kind === "town" || s.kind === "rest")
      return tell("休憩は無料。カード強化は30コイン、購入は25コインです。");
    if (s.cleared || p.claimed.includes(s.id))
      return tell("この場所は探索済みです。");
    if (s.kind === "event") {
      p.claimed.push(s.id);
      p.maxHp += 10;
      p.hp = Math.min(p.maxHp, p.hp + 20);
      p.deck.push("SHRUG_IT_OFF");
      return tell("図書委員と学びの交換。最大HP+10、「知らんぷり」を獲得！");
    }
    if (s.kind === "treasure") {
      p.claimed.push(s.id);
      p.gold += 40;
      p.deck.push("IRON_WAVE");
      return tell("宝箱から40コインと「上履きキック」を獲得！");
    }
    if (
      s.kind === "boss" &&
      w.sites.some((s) => s.kind === "guardian" && !s.cleared)
    )
      return tell("3体の試験官を倒すと校長の結界が解除されます。");
    startBattle(w, p, s);
    return tell(`${s.name}との戦闘！ 学習問題に答えてエナジーを得よう。`);
  }
  const b = p.battle;
  if (!b) return false;
  const s = w.sites.find((s) => s.id === b.siteId)!;
  if (action.type === "flee") {
    p.battle = null;
    p.hp = Math.max(1, p.hp - 5);
    return tell("HPを5消費して離脱しました。");
  }
  if (action.type === "answer") {
    if (
      b.phase !== "quiz" ||
      !Number.isInteger(action.index) ||
      action.index < 0 ||
      action.index >= b.quiz.options.length
    )
      return false;
    const correct = action.index === b.quiz.answer;
    p.answers++;
    if (correct) p.correct++;
    b.energy = correct ? 3 : 1;
    b.phase = "cards";
    return tell(
      correct
        ? "正解！ エナジーを3獲得。カードを選ぼう。"
        : `もう一度覚えよう：${b.quiz.options[b.quiz.answer]}。${b.quiz.hint} エナジーを1獲得。`,
    );
  }
  if (action.type === "card") {
    if (b.phase !== "cards" || !Number.isInteger(action.index)) return false;
    const key = b.hand[action.index];
    if (!key || !CARD_KEYS.includes(key)) return false;
    const c = card(key);
    if (b.energy < c.cost) return false;
    b.energy -= c.cost;
    b.hand.splice(action.index, 1);
    b.discard.push(key);
    const bonus = p.upgrades.includes(key) ? 3 : 0;
    const allies = p.team
      ? Object.values(w.players).filter(
          (q) =>
            q.id !== p.id &&
            q.team === p.team &&
            distance(p, q) <= 5 &&
            q.battle?.siteId === s.id,
        ).length
      : 0;
    const damage = c.damage
      ? Math.floor(
          (c.damage + bonus + p.level - 1 + allies * 2) *
            (b.vulnerable > 0 ? 1.5 : 1),
        )
      : 0;
    if (s.kind === "guardian" || s.kind === "boss") {
      s.hp = Math.max(0, s.hp - damage);
      for (const q of Object.values(w.players))
        if (q.battle?.siteId === s.id) q.battle.hp = s.hp;
    } else b.hp = Math.max(0, b.hp - damage);
    b.block += (c.block || 0) + (c.block ? bonus : 0);
    b.vulnerable += c.vulnerable || 0;
    b.weak += c.weak || 0;
    if (c.draw) draw(w, p, c.draw);
    if (b.hp <= 0) {
      if (s.kind === "enemy") reward(w, p, s);
      else {
        s.cleared = true;
        for (const q of Object.values(w.players))
          if (q.battle?.siteId === s.id) reward(w, q, s);
        log(w, `${s.name}を撃破！ みんなの力が結界を崩す。`);
        if (s.kind === "boss") {
          w.won = true;
          Object.values(w.players).forEach((q) => (q.battle = null));
          log(w, "校長を撃破！ 冒険者全員の勝利！");
        }
      }
      w.revision++;
      return true;
    }
    return tell(
      `${c.name}${bonus ? "＋" : ""}！ ${damage ? `${damage}ダメージ。` : ""}${c.block ? `ブロック${c.block + bonus}。` : ""}${allies ? "チーム連携中！" : ""}`,
    );
  }
  if (action.type === "end") {
    if (b.phase !== "cards") return false;
    const attack = s.kind === "boss" ? 18 : s.kind === "guardian" ? 12 : 8;
    p.hp -= Math.max(0, Math.floor(attack * (b.weak ? 0.75 : 1)) - b.block);
    if (p.hp <= 0) {
      defeat(w, p);
      w.revision++;
      return true;
    }
    b.turn++;
    b.block = 0;
    b.energy = 0;
    b.vulnerable = Math.max(0, b.vulnerable - 1);
    b.weak = Math.max(0, b.weak - 1);
    b.discard.push(...b.hand);
    b.hand = [];
    draw(w, p, 5);
    b.phase = "quiz";
    b.quiz = quiz(w, p, b.turn);
    return tell("敵が行動しました。次の問題に答えて反撃しよう。");
  }
  return false;
}
