import type { World, Adventurer } from "../engine";
import { WIDTH, HEIGHT } from "../engine";
import { BIOMES, biomeAt } from "../biomes";
import { lifeWalkable } from "../life";
import { residentsOf } from "./residents";
import { getRoamingNpcEvent } from "../roamingNpcs";
export interface ResidentWalker {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  goalX: number;
  goalY: number;
  next: number;
  step: number;
  activity: "walk" | "rest" | "look";
  siteId?: string;
}
export interface ResidentEncounter {
  target: string;
  until: number;
}
const hash = (s: string) => {
  let n = 2166136261;
  for (const ch of s) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
  return n >>> 0;
};
function safe(w: World, x: number, y: number) {
  return (
    lifeWalkable(w, x, y) &&
    !w.life.houses.some((h) => h.x === x && h.y === y) &&
    !w.sites.some((s) => s.kind !== "npc" && s.x === x && s.y === y)
  );
}
export function initialResidentPosition(
  w: World,
  id: string,
): { x: number; y: number; siteId?: string } {
  const custom = w.town?.customResidents?.find((r) => r.id === id),
    r = residentsOf(w).find((r) => r.id === id);
  if (custom) return { x: custom.x, y: custom.y };
  const site = w.sites.find(
    (s) =>
      s.kind === "npc" &&
      getRoamingNpcEvent(s.npcEventId)?.portrait === r?.portrait,
  );
  if (site) return { x: site.x, y: site.y, siteId: site.id };
  const biome = BIOMES.find((b) => b.id === r?.biome) || BIOMES[0];
  const home =
    w.sites
      .filter((s) => s.kind === "town")
      .sort(
        (a, b) =>
          Math.hypot(a.x - biome.x, a.y - biome.y) -
          Math.hypot(b.x - biome.x, b.y - biome.y),
      )[0] || biome;
  for (let radius = 2; radius <= 18; radius++)
    for (let i = 0; i < radius * 8; i++) {
      const side = radius * 2,
        dx =
          i < side
            ? i - radius
            : i < side * 2
              ? radius
              : i < side * 3
                ? radius - (i - side * 2)
                : -radius,
        dy =
          i < side
            ? -radius
            : i < side * 2
              ? i - side - radius
              : i < side * 3
                ? radius
                : radius - (i - side * 3);
      const x = home.x + dx,
        y = home.y + dy;
      if (safe(w, x, y) && hash(`${id}:${x}:${y}`) % 3 === 0) return { x, y };
    }
  return { x: home.x, y: home.y + 1 };
}
export function residentPosition(w: World, id: string) {
  return w.town?.walkers?.[id] || initialResidentPosition(w, id);
}
export function residentNear(w: World, p: Adventurer, id: string) {
  if (!residentsOf(w).some((r) => r.id === id) || p.spectator) return false;
  if (p.life?.indoors)
    return !!w.town?.bonds.some(
      (b) =>
        b.people.includes(p.id) &&
        b.people.includes(id) &&
        (b.houseId === p.life?.indoors ||
          (b.visitHouse?.id === p.life?.indoors &&
            b.visitHouse.day === w.town?.day)),
    );
  const r = residentPosition(w, id);
  return Math.abs(r.x - p.x) + Math.abs(r.y - p.y) <= 2;
}
export function nearbyResidents(w: World, p: Adventurer) {
  return residentsOf(w)
    .filter((r) => residentNear(w, p, r.id))
    .sort((a, b) => {
      const x = residentPosition(w, a.id),
        y = residentPosition(w, b.id);
      return (
        Math.abs(x.x - p.x) +
        Math.abs(x.y - p.y) -
        Math.abs(y.x - p.x) -
        Math.abs(y.y - p.y)
      );
    });
}
export function advanceResidents(w: World) {
  const town = w.town;
  if (!town || !w.started || w.ended) return;
  const walkers = (town.walkers ??= {}),
    time = w.life.time;
  town.encounters ??= {};
  for (const [id, e] of Object.entries(town.encounters))
    if (
      !w.players[id] ||
      e.until < time ||
      !residentNear(w, w.players[id], e.target)
    )
      delete town.encounters[id];
  const residents = residentsOf(w),
    linked = new Set<string>();
  const entities: Array<{ id: string; x: number; y: number; siteId?: string }> =
    residents.map((r) => {
      const pos = initialResidentPosition(w, r.id);
      if (pos.siteId) linked.add(pos.siteId);
      return { id: r.id, ...pos };
    });
  for (const s of w.sites)
    if (s.kind === "npc" && !linked.has(s.id))
      entities.push({ id: "npc:" + s.id, x: s.x, y: s.y, siteId: s.id });
  let changed = false;
  const occupied = new Set(
    entities.map((e) => {
      const p = walkers[e.id] || e;
      return `${p.x}:${p.y}`;
    }),
  );
  for (const entity of entities) {
    let r = walkers[entity.id];
    if (
      !r ||
      !Number.isInteger(r.x) ||
      !Number.isInteger(r.y) ||
      r.x < 1 ||
      r.y < 1 ||
      r.x >= WIDTH - 1 ||
      r.y >= HEIGHT - 1
    ) {
      r = walkers[entity.id] = {
        ...entity,
        homeX: entity.x,
        homeY: entity.y,
        goalX: entity.x,
        goalY: entity.y,
        next: time + 1 + (hash(entity.id) % 4),
        step: 0,
        activity: "look",
      };
      changed = true;
    }
    if (r.siteId) {
      const site = w.sites.find((s) => s.id === r.siteId);
      if (site) {
        site.x = r.x;
        site.y = r.y;
      }
    }
    const held =
      Object.values(town.encounters).some(
        (e) => e.target === entity.id && e.until >= time,
      ) ||
      Object.values(w.players).some(
        (p) =>
          !p.spectator &&
          !p.life?.indoors &&
          Math.abs(p.x - r.x) + Math.abs(p.y - r.y) <= 2,
      );
    if (held) {
      r.next = time + 2;
      r.activity = "look";
      continue;
    }
    if (time < r.next) continue;
    r.step++;
    const n = hash(`${w.seed}:${entity.id}:${r.step}`);
    r.next = time + 1.7 + (n % 10) / 10;
    if ((r.x === r.goalX && r.y === r.goalY) || !safe(w, r.goalX, r.goalY)) {
      if (n % 4 === 0) {
        r.activity = "rest";
        r.next = time + 4 + (n % 5);
        changed = true;
        continue;
      }
      const bond = town.bonds.find(
          (b) => b.people.includes(entity.id) && b.houseId,
        ),
        home = w.life.houses.find((h) => h.id === bond?.houseId);
      if (home) {
        r.homeX = home.x;
        r.homeY = home.y + 1;
      }
      r.goalX = r.homeX + (n % 17) - 8;
      r.goalY = r.homeY + ((n >>> 8) % 17) - 8;
      if (!safe(w, r.goalX, r.goalY)) {
        r.goalX = r.x;
        r.goalY = r.y;
        continue;
      }
    }
    // Bounded breadth-first search follows actual walkable paths around water and trees.
    const queue = [{ x: r.x, y: r.y, dx: 0, dy: 0 }],
      seen = new Set([`${r.x}:${r.y}`]);
    let next: (typeof queue)[number] | undefined;
    for (let i = 0; i < queue.length && i < 240; i++) {
      const at = queue[i];
      if (at.x === r.goalX && at.y === r.goalY) {
        next = at;
        break;
      }
      for (const [dx, dy] of [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ]) {
        const x = at.x + dx,
          y = at.y + dy,
          key = `${x}:${y}`;
        if (
          seen.has(key) ||
          !safe(w, x, y) ||
          Math.abs(x - r.homeX) > 12 ||
          Math.abs(y - r.homeY) > 12 ||
          occupied.has(key) ||
          Object.values(w.players).some(
            (p) => !p.spectator && !p.life?.indoors && p.x === x && p.y === y,
          )
        )
          continue;
        seen.add(key);
        queue.push({
          x,
          y,
          dx: at.dx || at.dy ? at.dx : dx,
          dy: at.dx || at.dy ? at.dy : dy,
        });
      }
    }
    if (next && (next.dx || next.dy)) {
      occupied.delete(`${r.x}:${r.y}`);
      r.x += next.dx;
      r.y += next.dy;
      occupied.add(`${r.x}:${r.y}`);
      r.activity = "walk";
      changed = true;
    } else {
      r.goalX = r.x;
      r.goalY = r.y;
      r.activity = "look";
    }
    if (r.siteId) {
      const site = w.sites.find((s) => s.id === r.siteId);
      if (site) {
        site.x = r.x;
        site.y = r.y;
      }
    }
  }
  if (changed) w.revision++;
}
