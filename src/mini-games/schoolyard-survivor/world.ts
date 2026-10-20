import { PROTAGONISTS } from "../../three/protagonistCatalog";
import type { LanguageMode } from "../../types";
export const localize = (
  mode: LanguageMode,
  ja: string,
  en: string,
  hira = ja,
) => (mode === "ENGLISH" ? en : mode === "HIRAGANA" ? hira : ja);
const STARTERS = [
  "PENCIL",
  "CLAY",
  "CUTTER",
  "BASKETBALL",
  "RECORDER",
  "DICTIONARY",
  "CURRY",
  "TROWEL",
  "FLASK",
];
const ROLES = [
  "warrior",
  "caretaker",
  "assassin",
  "dodgeball",
  "bard",
  "librarian",
  "chef",
  "gardener",
  "mage",
];
export const HEROES = PROTAGONISTS.map((hero, i) => {
  const chapter = i < 9 ? 0 : i < 18 ? 1 : 2;
  const role =
    chapter === 2
      ? [0, 1, 2, 8, 3, 4, 5, 6, 7][(i - 18) % 9]
      : Math.max(
          0,
          ROLES.indexOf(hero.id.replace(/^(elementary|high-school)-/, "")),
        );
  return {
    ...hero,
    chapter,
    starter: STARTERS[role],
    hp: role === 1 || role === 6 ? 130 : 100,
    speed: role === 2 || role === 3 ? 4.5 : 4,
    might: chapter === 1 ? 1.18 : 1,
    area: chapter === 2 ? 1.2 : 1,
    magnet: role === 5 || role === 7 ? 45 : 0,
  };
});
export type SurvivorHero = (typeof HEROES)[number];
export const FIELDS = [
  {
    id: "schoolyard",
    name: ["夕映えの校庭", "Sunset schoolyard", "ゆうばえの こうてい"],
    desc: [
      "木々とベンチを抜け、群れを迎え撃つ。",
      "Weave through trees and benches to face the swarm.",
      "きぎと ベンチをぬけ むれと たたかう。",
    ],
    ground: "#294d49",
    tile: "#305951",
    line: "#e9c79b",
    accent: "#ffc477",
    props: ["TREE", "BENCH", "CRATES"],
    enemies: ["ENEMY_17", "ENEMY_21", "ENEMY_18"],
  },
  {
    id: "rooftop",
    name: ["蒼風の屋上", "Skyline rooftop", "あおかぜの おくじょう"],
    desc: [
      "通風口の間を駆け、時計兵の弾幕をかわす。",
      "Dodge clockwork volleys between rooftop vents.",
      "つうふうこうをぬけ とけいの たまを よける。",
    ],
    ground: "#273c59",
    tile: "#304967",
    line: "#6688a3",
    accent: "#84deff",
    props: ["VENT", "BENCH", "CRATES"],
    enemies: ["ENEMY_19", "ENEMY_17", "ENEMY_20"],
  },
  {
    id: "laboratory",
    name: ["深緑の実験棟", "Overgrown laboratory", "しんりょくの じっけんとう"],
    desc: [
      "実験柱と暴走植物が入り組む危険地帯。",
      "Navigate reactor pillars and rampaging plants.",
      "じっけんの はしらと あばれる しょくぶつ。",
    ],
    ground: "#203d45",
    tile: "#274b50",
    line: "#46786d",
    accent: "#91f2ba",
    props: ["LAB_PILLAR", "TREE", "CRATES"],
    enemies: ["ENEMY_21", "ENEMY_18", "ENEMY_17"],
  },
  {
    id: "astral",
    name: ["星渡りの庭", "Astral garden", "ほしわたりの にわ"],
    desc: [
      "結晶の迷路に、異界の騎士が押し寄せる。",
      "Prism knights flood a maze of astral crystals.",
      "けっしょうの めいろに いせかいの きし。",
    ],
    ground: "#302c50",
    tile: "#39325c",
    line: "#6c5993",
    accent: "#d7a9ff",
    props: ["CRYSTAL", "LAB_PILLAR", "BENCH"],
    enemies: ["ENEMY_20", "ENEMY_18", "ENEMY_19"],
  },
] as const;
export type Field = (typeof FIELDS)[number];
export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: string;
}
export function createObstacles(field: Field): Obstacle[] {
  const result: Obstacle[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 6; col++) {
      const x = 220 + col * 310 + (row % 2) * 65,
        y = 220 + row * 310;
      if (Math.hypot(x - 1000, y - 1000) < 240) continue;
      const kind = field.props[(row * 5 + col) % 3];
      result.push({
        x,
        y,
        w: kind === "BENCH" ? 100 : kind === "TREE" ? 58 : 76,
        h: kind === "BENCH" ? 34 : kind === "TREE" ? 44 : 62,
        kind,
      });
    }
  return result;
}
/** Circle/rectangle collision with sliding, shared by players, monsters and spawn placement. */
export function moveActor(
  actor: { x: number; y: number },
  dx: number,
  dy: number,
  radius: number,
  obstacles: readonly Obstacle[],
) {
  const free = (x: number, y: number) =>
    !obstacles.some(
      (o) =>
        Math.hypot(
          x - Math.max(o.x - o.w / 2, Math.min(o.x + o.w / 2, x)),
          y - Math.max(o.y - o.h / 2, Math.min(o.y + o.h / 2, y)),
        ) < radius,
    );
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(dx, dy) / Math.max(4, radius)),
  );
  for (let i = 0; i < steps; i++) {
    const x = Math.max(radius, Math.min(2000 - radius, actor.x + dx / steps));
    if (free(x, actor.y)) actor.x = x;
    const y = Math.max(radius, Math.min(2000 - radius, actor.y + dy / steps));
    if (free(actor.x, y)) actor.y = y;
  }
}
export function spawnPoint(
  x: number,
  y: number,
  angle: number,
  distance: number,
  obstacles: readonly Obstacle[],
) {
  for (let i = 0; i < 32; i++) {
    const a = angle + i * 0.39,
      p = {
        x: Math.max(30, Math.min(1970, x + Math.cos(a) * distance)),
        y: Math.max(30, Math.min(1970, y + Math.sin(a) * distance)),
      };
    if (Math.hypot(p.x - x, p.y - y) < distance * 0.65) continue;
    if (
      !obstacles.some(
        (o) =>
          Math.abs(p.x - o.x) < o.w / 2 + 40 &&
          Math.abs(p.y - o.y) < o.h / 2 + 40,
      )
    )
      return p;
  }
  return null;
}
export function createFieldCanvas(field: Field) {
  const c = document.createElement("canvas");
  c.width = 2000;
  c.height = 2000;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.fillStyle = field.ground;
  ctx.fillRect(0, 0, 2000, 2000);
  ctx.globalAlpha = 0.22;
  for (let y = 0; y < 2000; y += 100)
    for (let x = 0; x < 2000; x += 100) {
      ctx.fillStyle = (x + y) % 200 === 0 ? field.tile : field.ground;
      ctx.fillRect(x, y, 99, 99);
    }
  ctx.globalAlpha = 1;
  // Deterministic surface detail is baked once, never generated in the render loop.
  let seed = 481;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 2600; i++) {
    const x = rand() * 2000,
      y = rand() * 2000;
    ctx.fillStyle = field.id === "astral" ? "#c9beee" : field.line;
    ctx.globalAlpha =
      field.id === "astral" ? 0.12 + rand() * 0.2 : 0.045 + rand() * 0.06;
    ctx.fillRect(
      x,
      y,
      field.id === "schoolyard" ? 2 + rand() * 3 : 1,
      field.id === "schoolyard" ? 1 : 2,
    );
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = field.line;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 120, 1760, 1760);
  ctx.strokeRect(350, 350, 1300, 1300);
  ctx.beginPath();
  ctx.arc(1000, 1000, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(120, 1000);
  ctx.lineTo(1880, 1000);
  ctx.stroke();
  if (field.id === "schoolyard") {
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(1000, 1000, 720 + i * 45, 530 + i * 45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 1;
    for (let i = 0; i < 2000; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 2000);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(2000, i);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}
export const SCENERY_KEYS = [
  "ENEMY_17",
  "ENEMY_18",
  "ENEMY_19",
  "ENEMY_20",
  "ENEMY_21",
  "ENEMY_22",
  "BENCH",
  "TREE",
  "CRATES",
  "CRYSTAL",
  "LAB_PILLAR",
  "VENT",
];
export const FX_KEYS = [
  "NOVA",
  "SLASH",
  "RUNE",
  "SPARK",
  "LIGHTNING",
  "PORTAL",
].flatMap((k) => Array.from({ length: 8 }, (_, i) => `${k}_${i}`));
