import {CITY_PROJECTS,DISTRICT_PLANS} from '../lifestyle/catalog';
import {cityLiving,projectBenefits,districtPlan,advanceCityLiving,cityRequests,type CityLiving,type CityLivingAction} from '../lifestyle/cityLiving';
import {occupiedFarmTile} from '../farm/model';
import type { World, Adventurer } from "../engine";
import { WIDTH, HEIGHT } from "../engine";
import { cityBuilding, CITY_SERVICES } from "./catalog";
export interface CityLot {
  district?:string;
  id: string;
  owner: string;
  kind: string;
  x: number;
  y: number;
  level: number;
  people: number;
  happiness: number;
  connected: boolean;
  damage: number;
}
export interface CityState {
  living?:CityLiving;
  unlocked: true;
  treasury: number;
  debt: number;
  aidMonth: number;
  roads: number[];
  lots: CityLot[];
  tax: number;
  budgets: Record<string, number>;
  policies: boolean[];
  month: number;
  lastTime: number;
  accumulator: number;
  population: number;
  happiness: number;
  jobs: number;
  traffic: number;
  pollution: number;
  income: number;
  expenses: number;
  level: number;
  services: Record<string, number>;
  history: Array<{
    month: number;
    population: number;
    happiness: number;
    net: number;
  }>;
  news: Array<{ month: number; kind: string; lot?: string }>;
  challenge: number;
  challengeRound: number;
  claimed: number;
  origin: { x: number; y: number };
  revision: number;
}
export type CityAction = CityLivingAction
  | { type: "city-continue" }
  | { type: "city-build"; kind: string; x: number; y: number }
  | { type: "city-road" | "city-road-remove"; tiles: number[] }
  | { type: "city-demolish" | "city-upgrade" | "city-repair"; id: string }
  | { type: "city-tax"; tax: number }
  | { type: "city-budget"; service: string; amount: number }
  | { type: "city-policy"; index: number; enabled: boolean }
  | { type: "city-challenge" }
  | { type: "city-loan"; amount: number }
  | { type: "city-repay" }
  | { type: "city-aid" };
export const validCityTile = (w: World, x: number, y: number) =>
  Number.isInteger(x) &&
  Number.isInteger(y) &&
  x > 1 &&
  y > 1 &&
  x < WIDTH - 2 &&
  y < HEIGHT - 2 &&
  w.tiles[y * WIDTH + x] !== "water" &&
  !occupiedFarmTile(w,y*WIDTH+x) &&
  !w.sites.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 2) &&
  !w.life.houses.some((h) => Math.abs(h.x - x) + Math.abs(h.y - y) < 2);
const neighbors = (tile: number) =>
  [tile - WIDTH, tile + WIDTH, tile - 1, tile + 1].filter(
    (n) =>
      n >= 0 &&
      n < WIDTH * HEIGHT &&
      Math.abs((n % WIDTH) - (tile % WIDTH)) +
        Math.abs(Math.floor(n / WIDTH) - Math.floor(tile / WIDTH)) ===
        1,
  );
export function roadConnections(w: World) {
  const s = w.city;
  if (!s) return new Set<number>();
  const roads = new Set(s.roads),
    connected = new Set<number>(),
    queue: number[] = [];
  for (const tile of roads)
    if (
      w.tiles[tile] === "road" ||
      neighbors(tile).some((n) => w.tiles[n] === "road")
    ) {
      connected.add(tile);
      queue.push(tile);
    }
  for (let i = 0; i < queue.length; i++)
    for (const tile of neighbors(queue[i]))
      if (roads.has(tile) && !connected.has(tile)) {
        connected.add(tile);
        queue.push(tile);
      }
  return connected;
}
export function cityStats(w: World, grow = false) {
  const s = w.city;
  if (!s) return;
  const connected = roadConnections(w),
    live = s.lots.filter((l) => !l.damage);
  for (const lot of s.lots)
    lot.connected = neighbors(lot.y * WIDTH + lot.x).some(
      (t) => connected.has(t) || w.tiles[t] === "road",
    );
  const serviceLots = live.filter((l) => l.connected);
  const benefits=projectBenefits(s);
  let pollution = serviceLots.reduce(
    (n, l) => n + cityBuilding(l.kind)!.pollution,
    0,
  );
  pollution = Math.max(
    0,
    pollution -
      serviceLots.filter((l) => ["park", "sports"].includes(l.kind)).length *
        7 -
      (s.policies[0] ? 15 : 0) - benefits.pollution - serviceLots.reduce((n,l)=>n+districtPlan(l).green,0),
  );
  const jobs = serviceLots.reduce(
      (n, l) => n + Math.max(0,cityBuilding(l.kind)!.jobs+districtPlan(l).jobs) * l.level,
      0,
    ),
    homes = s.lots.filter((l) => cityBuilding(l.kind)!.capacity),
    population = homes.reduce((n, l) => n + l.people, 0),
    transit = serviceLots.filter((l) => l.kind === "bus").length;
  const traffic = Math.min(
    100,
    Math.max(
      0,
      population / 3 +
        serviceLots.filter((l) => l.kind === "workshop").length * 7 -
        transit * (s.policies[2] ? 28 : 18) -
        s.roads.length * 0.25,
    ),
  );
  s.services = Object.fromEntries(CITY_SERVICES.map(([key]) => [key, 0]));
  let sum = 0;
  for (const lot of homes) {
    const coverage: Record<string, boolean> = {};
    for (const [key] of CITY_SERVICES) {
      const providers = serviceLots.filter(
          (l) => cityBuilding(l.kind)!.service === key,
        ),
        capacity = providers.reduce(
          (n, l) =>
            n +
            ((["power", "water", "sewage"].includes(key) ? 120 : 80) *
              l.level *
              (s.budgets[key] || 100)) /
              100,
          0,
        ),
        demand = homes.reduce((n, l) => n + Math.max(1, l.people), 0);
      coverage[key] =
        lot.connected &&
        capacity >= demand &&
        providers.some((l) => {
          const b = cityBuilding(l.kind)!;
          return (
            b.service === key &&
            Math.abs(l.x - lot.x) + Math.abs(l.y - lot.y) <=
              (b.range * (s.budgets[key] || 100)) / 100
          );
        });
      if (coverage[key]) s.services[key]++;
    }
    const environmental =
      ((s.policies[0] ? 0.6 : 1) *
        live.reduce(
          (n, l) =>
            n +
            Math.max(0, 10 - Math.abs(l.x - lot.x) - Math.abs(l.y - lot.y)) *
              cityBuilding(l.kind)!.pollution,
          0,
        )) /
      8;
    lot.happiness = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          18 + Math.min(20,benefits.happiness) + districtPlan(lot).happiness +
            Object.values(coverage).filter(Boolean).length * 7 +
            (jobs >= population * 0.45 ? 10 : 0) +
            (s.policies[1] ? 4 : 0) +
            (s.policies[3] ? 3 : 0) -
            Math.max(0, s.tax - 9) * 3 -
            traffic * 0.12 -
            environmental -
            (lot.damage ? 30 : 0),
        ),
      ),
    );
    if (!lot.connected || !coverage.power || !coverage.water)
      lot.happiness = Math.min(25, lot.happiness);
    if (grow) {
      const capacity = cityBuilding(lot.kind)!.capacity * lot.level;
      lot.people = Math.max(
        0,
        Math.min(
          capacity,
          lot.people +
            (lot.happiness >= 45
              ? Math.max(1, Math.round(capacity * 0.08))
              : lot.happiness < 25
                ? -Math.max(1, Math.ceil(lot.people * 0.08))
                : 0),
        ),
      );
    }
    sum += lot.happiness;
  }
  s.population = homes.reduce((n, l) => n + l.people, 0);
  s.happiness = homes.length ? Math.round(sum / homes.length) : 0;
  s.jobs = jobs;
  s.traffic = Math.round(traffic);
  s.pollution = Math.round(pollution);
  s.income = Math.floor(
    s.population * s.tax * 0.32 +
      serviceLots
        .filter((l) => ["market", "workshop", "farm"].includes(l.kind))
        .reduce((n, l) => n + cityBuilding(l.kind)!.jobs * l.level * 0.9, 0),
  );
  s.expenses = Math.ceil(
    live.reduce((n, l) => {
      const b = cityBuilding(l.kind)!;
      return (
        n +
        b.upkeep *
          l.level *
          (b.service ? (s.budgets[b.service] || 100) / 100 : 1)
      );
    }, 0) +
      s.roads.length * 0.18 +
      s.policies.filter(Boolean).length * 12 +
      Math.ceil((s.debt || 0) * 0.015),
  );
  const level = Math.min(5, Math.floor(s.population / 50));
  if (level > s.level) {
    s.treasury += 500 * (level - s.level);
    s.level = level;
    s.news.push({ month: s.month, kind: "milestone" });
  }
  for (const key of Object.keys(s.services))
    s.services[key] = homes.length
      ? Math.round((s.services[key] / homes.length) * 100)
      : 0;
}
export function applyCity(w: World, p: Adventurer, a: CityAction, now: number) {
  if (
    p.spectator ||
    p.nativeScene ||
    p.life?.work ||
    p.duelId ||
    p.dungeonId ||
    p.life?.indoors ||
    p.arcadePending ||
    w.town?.cooking[p.id] ||
    (w.town?.dreams[p.id] && !w.town.dreams[p.id].finished) ||
    w.activities.trades.some((t) => t.from === p.id || t.to === p.id)
  )
    return false;
  if (a.type === "city-continue") {
    if (
      !w.ended ||
      w.endReason !== "clear" ||
      now < (w.rewardAt || 0) ||
      !Object.keys(w.rankingAwards).length ||
      Object.values(w.players).some((p) => p.nativeScene)
    )
      return false;
    if (!w.city)
      w.city = {
        unlocked: true,
        treasury: 3000,
        debt: 0,
        aidMonth: -6,
        roads: [],
        lots: [],
        tax: 9,
        budgets: Object.fromEntries(CITY_SERVICES.map(([k]) => [k, 100])),
        policies: [false, false, false, false],
        month: 0,
        lastTime: w.life.time,
        accumulator: 0,
        population: 0,
        happiness: 0,
        jobs: 0,
        traffic: 0,
        pollution: 0,
        income: 0,
        expenses: 0,
        level: 0,
        services: {},
        history: [],
        news: [{ month: 0, kind: "unlock" }],
        challenge: 0,
        challengeRound: 0,
        claimed: 0,
        origin: { x: p.x, y: p.y },
        revision: 0,
      };
    w.ended = false;
    w.deadlineAt = 0;
    w.timeLimitMinutes = 0;
    w.revision++;
    return true;
  }
  const s = w.city;
  if (s) {
    s.debt ??= 0;
    s.aidMonth ??= -6;
  }
  if (!s || !w.started || w.ended) return false;
  let changed = false;
  if (a.type === "city-build") {
    const b = cityBuilding(a.kind);
    if (
      !b ||
      (b.id === "hall" && s.lots.some((l) => l.kind === "hall")) ||
      b.level > s.level ||
      s.treasury < b.cost ||
      !validCityTile(w, a.x, a.y) ||
      s.lots.length >= 512 ||
      s.roads.includes(a.y * WIDTH + a.x) ||
      s.lots.some((l) => l.x === a.x && l.y === a.y)
    )
      return false;
    s.treasury -= b.cost;
    s.lots.push({
      id: `city-${++s.revision}`,
      owner: p.id,
      kind: b.id,
      x: a.x,
      y: a.y,
      level: 1,
      people: 0,
      happiness: 0,
      connected: false,
      damage: 0,
    });
    changed = true;
  }
  if (a.type === "city-road-remove") {
    if (
      !Array.isArray(a.tiles) ||
      a.tiles.length > 64 ||
      !a.tiles.every(Number.isInteger)
    )
      return false;
    const set = new Set(a.tiles);
    s.roads = s.roads.filter((t) => !set.has(t));
    changed = true;
  }
  if (a.type === "city-road") {
    if (
      !Array.isArray(a.tiles) ||
      !a.tiles.length ||
      a.tiles.length > 64 ||
      !a.tiles.every(
        (t) =>
          Number.isInteger(t) &&
          validCityTile(w, t % WIDTH, Math.floor(t / WIDTH)) &&
          !s.lots.some(
            (l) => l.x === t % WIDTH && l.y === Math.floor(t / WIDTH),
          ),
      )
    )
      return false;
    const fresh = [...new Set(a.tiles)].filter((t) => !s.roads.includes(t));
    if (s.roads.length + fresh.length > 4096 || s.treasury < fresh.length * 8)
      return false;
    s.treasury -= fresh.length * 8;
    s.roads.push(...fresh);
    changed = !!fresh.length;
  }
  if (["city-demolish", "city-upgrade", "city-repair"].includes(a.type)) {
    const lot = s.lots.find((l) => l.id === (a as { id: string }).id);
    if (!lot || lot.owner !== p.id) return false;
    const b = cityBuilding(lot.kind)!;
    if (a.type === "city-demolish") {
      s.lots = s.lots.filter((l) => l !== lot);
      s.treasury += Math.floor(b.cost * 0.35);
    } else if (a.type === "city-upgrade") {
      const cost = b.cost * lot.level;
      if (lot.level >= 3 || s.level < lot.level || s.treasury < cost)
        return false;
      s.treasury -= cost;
      lot.level++;
    } else {
      const cost = Math.floor(b.cost * 0.3);
      if (!lot.damage || s.treasury < cost) return false;
      s.treasury -= cost;
      lot.damage = 0;
    }
    changed = true;
  }
  if(a.type==='city-district'){
    const lot=s.lots.find(l=>l.id===a.id),plan=DISTRICT_PLANS.find(v=>v.id===a.plan);
    if(!lot||lot.owner!==p.id||!plan||s.treasury<30||lot.district===a.plan)return false;
    s.treasury-=30;lot.district=a.plan;changed=true;
  }
  if(a.type==='city-project'){
    const d=CITY_PROJECTS.find(v=>v.id===a.project),living=cityLiving(s);
    if(!d||living.projects.some(v=>v.id===d.id)||s.treasury<d.cost)return false;
    s.treasury-=d.cost;living.projects.push({id:d.id,started:s.month,complete:false});changed=true;
  }
  if(a.type==='city-request'){
    const q=cityRequests(w).find(q=>q.id===a.id),living=cityLiving(s);
    if(!q||!q.ready||living.claimed.includes(q.id))return false;
    living.claimed.push(q.id);living.claimed=living.claimed.slice(-120);s.treasury+=q.reward;changed=true;
  }
  if (a.type === "city-loan") {
    if (![500, 1000].includes(a.amount) || s.debt + a.amount > 5000)
      return false;
    s.debt += a.amount;
    s.treasury += a.amount;
    changed = true;
  }
  if (a.type === "city-repay") {
    const paid = Math.min(s.debt, Math.floor(s.treasury));
    if (!paid) return false;
    s.debt -= paid;
    s.treasury -= paid;
    changed = true;
  }
  if (a.type === "city-aid") {
    if (s.treasury >= 100 || s.month - s.aidMonth < 6) return false;
    s.aidMonth = s.month;
    s.treasury += 500;
    changed = true;
  }
  if (a.type === "city-tax") {
    if (!Number.isInteger(a.tax) || a.tax < 3 || a.tax > 20) return false;
    s.tax = a.tax;
    changed = true;
  }
  if (a.type === "city-budget") {
    if (
      !CITY_SERVICES.some(([k]) => k === a.service) ||
      ![50, 75, 100, 125, 150].includes(a.amount)
    )
      return false;
    s.budgets[a.service] = a.amount;
    changed = true;
  }
  if (a.type === "city-policy") {
    if (
      !Number.isInteger(a.index) ||
      a.index < 0 ||
      a.index > 3 ||
      typeof a.enabled !== "boolean"
    )
      return false;
    s.policies[a.index] = a.enabled;
    changed = true;
  }
  if (a.type === "city-challenge") {
    const goals = [
      s.population >= 25 + 25 * s.challengeRound,
      s.happiness >= 65,
      s.lots.filter((l) => l.kind === "park").length >= 2 + s.challengeRound,
      s.jobs >= 30 + 20 * s.challengeRound,
      s.lots.length >= 8 && s.lots.every((l) => l.connected),
      Object.values(s.services).filter((v) => v >= 75).length >= 6,
    ];
    if (!goals[s.challenge] || s.month <= s.claimed) return false;
    s.treasury += 250 + 75 * s.challengeRound;
    s.claimed = s.month;
    s.challenge = (s.challenge + 1) % 6;
    if (!s.challenge) s.challengeRound++;
    s.news.push({ month: s.month, kind: "challenge" });
    changed = true;
  }
  if (changed) {
    cityStats(w);
    s.revision++;
    w.revision++;
    return true;
  }
  return false;
}
export function advanceCity(w: World) {
  const s = w.city;
  if (!s || w.ended || !w.started) return;
  const dt = Math.max(0, Math.min(1, w.life.time - s.lastTime));
  s.lastTime = w.life.time;
  s.accumulator += dt;
  if (s.accumulator < 30) return;
  s.accumulator -= 30;
  s.month++;advanceCityLiving(s);
  cityStats(w, true);
  s.treasury += s.income - s.expenses;
  if (s.treasury < 0) {
    s.treasury = 0;
    s.news.push({ month: s.month, kind: "deficit" });
  }
  if (s.month % 9 === 0 && s.lots.length) {
    const lot = s.lots[(w.seed + s.month) % s.lots.length],
      safe = s.services.fire >= 75 || s.policies[3];
    if (!safe) {
      lot.damage = 1;
      s.news.push({ month: s.month, kind: "fire", lot: lot.id });
    }
  }
  if (s.month % 6 === 0)
    s.news.push({
      month: s.month,
      kind: s.happiness >= 65 ? "festival" : "request",
    });
  s.history.push({
    month: s.month,
    population: s.population,
    happiness: s.happiness,
    net: s.income - s.expenses,
  });
  s.history = s.history.slice(-48);
  s.news = s.news.slice(-60);
  s.revision++;
  w.revision++;
}

const occupancy = new WeakMap<
  CityState,
  { revision: number; tiles: Set<number> }
>();
export function occupiedCityTile(w: World, tile: number) {
  const s = w.city;
  if (!s) return false;
  let entry = occupancy.get(s);
  if (!entry || entry.revision !== s.revision) {
    entry = {
      revision: s.revision,
      tiles: new Set([...s.roads, ...s.lots.map((l) => l.y * WIDTH + l.x)]),
    };
    occupancy.set(s, entry);
  }
  return entry.tiles.has(tile);
}
