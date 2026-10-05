import {farmMapTargets,type FarmQuickAction} from './mapTargets';
import {PET_TRICKS} from '../lifestyle/catalog';
import type {AnimalMoment} from '../lifestyle/animalMotion';
import type { World, Adventurer } from "../engine";
import { WIDTH, HEIGHT } from "../engine";
import { lifePlayer, canAfford } from "../life";
import { pendingMutation } from "../activities";
import { calendar, hash } from "../town/model";
import {
  CROPS,
  cropById,
  LIVESTOCK,
  animalById,
  PET_SPECIES,
  petById,
  ingredientById,
} from "./catalog";

export interface PantryStack {
  normal: number;
  quality: number;
}
export interface FarmPlot {
  slot: number;
  crop?: string;
  growth: number;
  water: number;
  fertilizer: boolean;
  quality: number;
  previousFamily: number;
  harvests: number;
}
export interface FarmAnimal {
  moment?:AnimalMoment;pat?:number;bredDay?:number;
  id: string;
  kind: string;
  name: string;
  born: number;
  feed: number;
  brush: number;
  clean: number;
  bond: number;
  health: number;
  progress: number;
  ready: number;
}
export interface FarmPet {
  moment?:AnimalMoment;tricks?:Record<string,number>;lastTrick?:number;
  id: string;
  kind: string;
  name: string;
  bond: number;
  hunger: number;
  trained: number;
  cares: Record<string, number>;
  walkBase: number;
  walkDay: number;
  awayUntil: number;
  trips: number;
}
export interface FarmPlayer {
  x?: number;
  y?: number;
  coins: number;
  xp: number;
  seeds: Record<string, number>;
  pantry: Record<string, PantryStack>;
  book: Record<string, { count: number; best: number }>;
  plots: FarmPlot[];
  animals: FarmAnimal[];
  pets: FarmPet[];
  activePet?: string;
  feed: number;
  compost: number;
  upgrades: string[];
  lastDay: number;
  harvested: number;
  products: number;
  claimed: string[];
  sequence: number;
  log: string[];
}
export interface FarmState {
  revision?: number;
  version: 1;
  people: Record<string, FarmPlayer>;
}
export type FarmAction = FarmQuickAction

  | {type:"farm-pet-trick";id:string;trick:string}
  | {type:"farm-animal-breed";id:string;name:string}
  | { type: "farm-start" }
  | { type: "farm-establish"; x: number; y: number }
  | { type: "farm-seed"; crop: string; amount: number }
  | { type: "farm-plant"; crop: string; slot: number }
  | {
      type: "farm-water" | "farm-fertilize" | "farm-harvest" | "farm-clear";
      slot: number;
    }
  | {
      type:
        | "farm-water-all"
        | "farm-harvest-all"
        | "farm-feed-buy"
        | "farm-compost";
    }
  | { type: "farm-sell"; ingredient: string; amount: number; quality: boolean }
  | { type: "farm-animal-buy"; kind: string; name: string }
  | {
      type: "farm-animal-care";
      id: string;
      care: "feed" | "brush" | "clean" | "collect" | "pat";
    }
  | { type: "farm-pet-adopt"; kind: string; name: string }
  | {
      type: "farm-pet-care";
      id: string;
      care: "feed" | "pat" | "play" | "train" | "follow" | "stay" | "trip";
    }
  | { type: "farm-name"; id: string; name: string }
  | { type: "farm-upgrade"; upgrade: string }
  | { type: "farm-reward"; id: string };
export const farmLevel = (f: FarmPlayer) =>
  Math.min(7, 1 + Math.floor(Math.sqrt(f.xp / 40)));
export const plotLimit = (f: FarmPlayer) =>
  farmLevel(f) >= 4 ? 24 : farmLevel(f) >= 2 ? 18 : 12;
export const animalLimit = (f: FarmPlayer) =>
  f.upgrades.includes("barn") ? 12 : 4;
export const ownFarm = (w: World, id: string) => w.farm?.people[id];
export function farmOf(w: World, p: Adventurer): FarmPlayer {
  const s = (w.farm ??= { version: 1, people: {} });
  if (s.people[p.id]) return s.people[p.id];
  const season = calendar(w).season;
  return (s.people[p.id] = {
    coins: 100,
    xp: 0,
    seeds: Object.fromEntries(
      CROPS.filter((c) => c.season === season).map((c) => [c.id, 3]),
    ),
    pantry: {},
    book: {},
    plots: Array.from({ length: 24 }, (_, slot) => ({
      slot,
      growth: 0,
      water: -1,
      fertilizer: false,
      quality: 60,
      previousFamily: -1,
      harvests: 0,
    })),
    animals: [],
    pets: [],
    feed: 12,
    compost: 3,
    upgrades: [],
    lastDay: calendar(w).day,
    harvested: 0,
    products: 0,
    claimed: [],
    sequence: 0,
    log: [],
  });
}
const occupiedCache = new WeakMap<
  World,
  { state: FarmState; revision: number; tiles: Set<number> }
>();
export function occupiedFarmTile(w: World, tile: number) {
  if (!w.farm) return false;
  let cache = occupiedCache.get(w);
  if (
    !cache ||
    cache.state !== w.farm ||
    cache.revision !== (w.farm.revision || 0)
  ) {
    const tiles = new Set<number>();
    for (const f of Object.values(w.farm.people))
      if (f.x !== undefined && f.y !== undefined)
        for (let dy = 0; dy < 7; dy++)
          for (let dx = 0; dx < 7; dx++)
            tiles.add((f.y + dy) * WIDTH + f.x + dx);
    cache = { state: w.farm, revision: w.farm.revision || 0, tiles };
    occupiedCache.set(w, cache);
  }
  return cache.tiles.has(tile);
}
export function validFarmSpot(w: World, x: number, y: number) {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 2 ||
    y < 2 ||
    x + 7 >= WIDTH - 2 ||
    y + 7 >= HEIGHT - 2
  )
    return false;
  for (let dy = 0; dy < 7; dy++)
    for (let dx = 0; dx < 7; dx++) {
      const tx = x + dx,
        ty = y + dy,
        tile = ty * WIDTH + tx;
      if (
        ["water", "road"].includes(w.tiles[tile]) ||
        occupiedFarmTile(w, tile) ||
        (w.city &&
          (w.city.roads.includes(tile) ||
            w.city.lots.some((l) => l.x === tx && l.y === ty))) ||
        w.sites.some((s) => Math.abs(s.x - tx) + Math.abs(s.y - ty) < 3) ||
        w.life.houses.some(
          (h) => Math.abs(h.x - tx) <= 3 && ty >= h.y - 3 && ty <= h.y + 4,
        ) ||
        w.town?.customResidents?.some((r) => r.x === tx && r.y === ty)
      )
        return false;
    }
  return true;
}
export function farmSpots(w: World, p: Adventurer) {
  const spots: Array<{ x: number; y: number }> = [];
  for (let radius = 0; radius <= 10; radius++)
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = p.x + dx,
          y = p.y + dy;
        if (
          validFarmSpot(w, x, y) &&
          spots.every((s) => Math.abs(s.x - x) + Math.abs(s.y - y) > 5)
        )
          spots.push({ x, y });
        if (spots.length >= 6) return spots;
      }
  return spots;
}
export const nearFarm = (p: Adventurer, f: FarmPlayer) =>
  f.x !== undefined &&
  f.y !== undefined &&
  p.x >= f.x - 4 &&
  p.x <= f.x + 10 &&
  p.y >= f.y - 4 &&
  p.y <= f.y + 10;
export function farmBusy(w: World, p: Adventurer) {
  return !!(
    p.spectator ||
    p.nativeScene ||
    p.life?.work ||
    p.duelId ||
    p.dungeonId ||
    p.arcadePending ||
    pendingMutation(p) ||
    w.town?.cooking[p.id] ||
    (w.town?.dreams[p.id] && !w.town.dreams[p.id].finished) ||
    w.activities.trades.some((t) => t.from === p.id || t.to === p.id) ||
    Object.values(w.life.games).some(
      (g) => g.phase === "playing" && g.players.includes(p.id),
    )
  );
}
export const farmAfford = (
  w: World,
  id: string,
  cost?: Record<string, number>,
) =>
  !cost ||
  Object.entries(cost).every(([key, n]) => {
    const stack = ownFarm(w, id)?.pantry[key];
    return (stack?.normal || 0) + (stack?.quality || 0) >= n;
  });
export function consumeFarm(
  w: World,
  id: string,
  cost?: Record<string, number>,
) {
  if (!farmAfford(w, id, cost)) return false;
  const f = ownFarm(w, id);
  for (const [key, n] of Object.entries(cost || {})) {
    const s = f!.pantry[key],
      normal = Math.min(s.normal, n);
    s.normal -= normal;
    s.quality -= n - normal;
  }
  return true;
}
function record(f: FarmPlayer, id: string, n: number, quality: number) {
  const s = (f.pantry[id] ??= { normal: 0, quality: 0 });
  if (quality >= 80) s.quality = Math.min(999, s.quality + n);
  else s.normal = Math.min(999, s.normal + n);
  const b = (f.book[id] ??= { count: 0, best: 0 });
  b.count += n;
  b.best = Math.max(b.best, quality);
}
function log(f: FarmPlayer, text: string) {
  f.log.push(text);
  f.log = f.log.slice(-12);
}
function harvest(f: FarmPlayer, plot: FarmPlot) {
  const c = cropById(plot.crop || "");
  if (!c || plot.growth < c.days) return 0;
  const amount = c.yield + (plot.quality >= 80 ? 1 : 0);
  record(f, c.id, amount, plot.quality);
  f.harvested += amount;
  f.xp += 8 + amount;
  plot.harvests++;
  plot.previousFamily = c.family;
  plot.growth = c.regrow ? c.days - c.regrow : 0;
  plot.fertilizer = false;
  plot.quality = 60;
  plot.water = -1;
  if (!c.regrow) delete plot.crop;
  return amount;
}
export const FARM_UPGRADES = [
  { id: "irrigation", level: 2, coins: 120, cost: { wood: 8, ore: 2 } },
  { id: "greenhouse", level: 3, coins: 220, cost: { wood: 12, crystal: 3 } },
  { id: "barn", level: 2, coins: 120, cost: { wood: 10, stone: 5 } },
] as const;
export const FARM_GOALS = [
  { id: "first", coins: 50, xp: 15, done: (f: FarmPlayer) => f.harvested >= 3 },
  {
    id: "variety",
    coins: 80,
    xp: 30,
    done: (f: FarmPlayer) => CROPS.filter((c) => f.book[c.id]).length >= 8,
  },
  {
    id: "harvest",
    coins: 120,
    xp: 40,
    done: (f: FarmPlayer) => f.harvested >= 100,
  },
  {
    id: "ranch",
    coins: 100,
    xp: 30,
    done: (f: FarmPlayer) => f.products >= 10,
  },
  {
    id: "friend",
    coins: 100,
    xp: 30,
    done: (f: FarmPlayer) => f.pets.some((p) => p.bond >= 60),
  },
  {
    id: "chef",
    coins: 150,
    xp: 45,
    done: (f: FarmPlayer, w?: World, id?: string) =>
      Object.keys(w?.town?.people[id || ""]?.cooked || {}).filter((k) =>
        k.startsWith("farm-dish-"),
      ).length >= 8,
  },
  {
    id: "master",
    coins: 300,
    xp: 100,
    done: (f: FarmPlayer) => CROPS.every((c) => f.book[c.id]),
  },
  {
    id: "quality",
    coins: 180,
    xp: 50,
    done: (f: FarmPlayer) =>
      CROPS.filter((c) => (f.book[c.id]?.best || 0) >= 80).length >= 12,
  },
  {
    id: "animals",
    coins: 200,
    xp: 70,
    done: (f: FarmPlayer) =>
      LIVESTOCK.every((k) => f.animals.some((a) => a.kind === k.id)),
  },
  {
    id: "journey",
    coins: 180,
    xp: 50,
    done: (f: FarmPlayer) => f.pets.reduce((n, p) => n + p.trips, 0) >= 10,
  },
];
const validName = (s: unknown) =>
  typeof s === "string" &&
  !!s.trim() &&
  s.length <= 16 &&
  !/[\u0000-\u001f]/.test(s);
export function applyFarm(w: World, p: Adventurer, a: FarmAction): boolean {
  if (!w.started || w.ended || farmBusy(w, p)) return false;
  if(a.type==='farm-quick'){
    if(typeof a.id!=='string'||typeof a.operation!=='string'||!farmMapTargets(w,p).some(t=>t.kind===a.kind&&t.id===a.id))return false;
    if(a.kind==='plot'&&['plant','water','fertilize','harvest','clear'].includes(a.operation)){
      const slot=Number(a.id);if(!Number.isInteger(slot)||slot<0||slot>23)return false;
      if(a.operation==='plant')return typeof a.crop==='string'&&applyFarm(w,p,{type:'farm-plant',slot,crop:a.crop});
      return applyFarm(w,p,{type:('farm-'+a.operation) as 'farm-water'|'farm-fertilize'|'farm-harvest'|'farm-clear',slot});
    }
    if(a.kind==='animal'&&['feed','brush','clean','collect','pat'].includes(a.operation))return applyFarm(w,p,{type:'farm-animal-care',id:a.id,care:a.operation as 'feed'|'brush'|'clean'|'collect'|'pat'});
    if(a.kind==='pet'){
      if(a.operation==='trick')return typeof a.trick==='string'&&applyFarm(w,p,{type:'farm-pet-trick',id:a.id,trick:a.trick});
      if(['feed','pat','play','train'].includes(a.operation))return applyFarm(w,p,{type:'farm-pet-care',id:a.id,care:a.operation as 'feed'|'pat'|'play'|'train'});
    }
    return false;
  }
  const hadFarm = !!ownFarm(w, p.id),
    f = farmOf(w, p),
    day = calendar(w).day,
    lp = lifePlayer(p);
  if (a.type === "farm-start") {
    if (hadFarm) return false;
    w.revision++;
    return true;
  }
  const tell = (text: string) => {
    p.message = text;
    w.revision++;
    return true;
  };
  const success = () => {
    w.revision++;
    return true;
  };
  const tending = [
    "farm-plant",
    "farm-water",
    "farm-water-all",
    "farm-fertilize",
    "farm-harvest",
    "farm-harvest-all",
    "farm-clear",
    "farm-animal-buy",
    "farm-animal-breed",
    "farm-animal-care",
    "farm-upgrade",
  ];
  if (tending.includes(a.type) && (!nearFarm(p, f) || lp.indoors))
    return tell("農園の近くで作業してください。");
  if (a.type === "farm-establish") {
    if (
      f.x !== undefined ||
      Math.abs(a.x - p.x) > 10 ||
      Math.abs(a.y - p.y) > 10 ||
      !validFarmSpot(w, a.x, a.y) ||
      !canAfford(lp.bag, { wood: 4, stone: 2 })
    )
      return false;
    lp.bag.wood = (lp.bag.wood || 0) - 4;
    lp.bag.stone = (lp.bag.stone || 0) - 2;
    f.x = a.x;
    f.y = a.y;
    w.farm!.revision = (w.farm!.revision || 0) + 1;
    return tell("農園ができました。季節の種と飼料を用意しました。");
  }
  if (a.type === "farm-seed") {
    const c = cropById(a.crop);
    if (
      !c ||
      !Number.isInteger(a.amount) ||
      a.amount < 1 ||
      a.amount > 10 ||
      f.coins < c.price * a.amount ||
      (f.seeds[c.id] || 0) + a.amount > 999
    )
      return false;
    f.coins -= c.price * a.amount;
    f.seeds[c.id] = (f.seeds[c.id] || 0) + a.amount;
    return success();
  }
  if (a.type === "farm-feed-buy") {
    if (f.coins < 10 || f.feed > 990) return false;
    f.coins -= 10;
    f.feed += 10;
    return success();
  }
  if (a.type === "farm-compost") {
    if ((lp.bag.herb || 0) < 1 || f.compost >= 99) return false;
    lp.bag.herb!--;
    f.compost += 3;
    return success();
  }
  if (a.type === "farm-sell") {
    const i = ingredientById(a.ingredient),
      s = i && f.pantry[i.id],
      key = a.quality ? "quality" : "normal";
    if (
      !i ||
      !s ||
      typeof a.quality !== "boolean" ||
      !Number.isInteger(a.amount) ||
      a.amount < 1 ||
      a.amount > 99 ||
      s[key] < a.amount
    )
      return false;
    s[key] -= a.amount;
    f.coins += Math.round(i.value * a.amount * (a.quality ? 2 : 1) * (w.city?.living?.projects.some(p=>p.id==='market'&&p.complete)?1.2:1));
    return success();
  }
  if (a.type === "farm-plant") {
    const c = cropById(a.crop),
      plot = f.plots.find((s) => s.slot === a.slot);
    if (
      !c ||
      !plot ||
      a.slot >= plotLimit(f) ||
      plot.crop ||
      !(f.seeds[c.id] > 0) ||
      (c.season !== calendar(w).season && !f.upgrades.includes("greenhouse"))
    )
      return false;
    f.seeds[c.id]--;
    Object.assign(plot, {
      crop: c.id,
      growth: 0,
      water: -1,
      fertilizer: false,
      quality:
        60 +
        (plot.previousFamily >= 0 && plot.previousFamily !== c.family ? 10 : 0),
      harvests: 0,
    });
    return success();
  }
  if (
    ["farm-water", "farm-fertilize", "farm-harvest", "farm-clear"].includes(
      a.type,
    )
  ) {
    const plot = f.plots.find((s) => s.slot === ("slot" in a ? a.slot : -1));
    if (!plot?.crop) return false;
    if (a.type === "farm-water") {
      if (plot.water === day) return false;
      plot.water = day;
    }
    if (a.type === "farm-fertilize") {
      if (!f.compost || plot.fertilizer) return false;
      f.compost--;
      plot.fertilizer = true;
      plot.quality = Math.min(100, plot.quality + 15);
    }
    if (a.type === "farm-harvest") {
      const amount = harvest(f, plot);
      if (!amount) return false;
      return tell("収穫しました。食材庫から料理や出荷に使えます。");
    }
    if (a.type === "farm-clear") {
      if (cropById(plot.crop)!.days <= plot.growth) return false;
      plot.previousFamily = cropById(plot.crop)!.family;
      delete plot.crop;
    }
    return success();
  }
  if (a.type === "farm-water-all") {
    let n = 0;
    for (const plot of f.plots)
      if (plot.crop && plot.water !== day) {
        plot.water = day;
        n++;
      }
    return n > 0 && success();
  }
  if (a.type === "farm-harvest-all") {
    let n = 0;
    for (const plot of f.plots) n += harvest(f, plot);
    return n > 0 && tell("収穫しました。食材庫から料理や出荷に使えます。");
  }
  if (a.type === "farm-upgrade") {
    const u = FARM_UPGRADES.find((x) => x.id === a.upgrade);
    if (
      !u ||
      f.upgrades.includes(u.id) ||
      farmLevel(f) < u.level ||
      f.coins < u.coins ||
      !canAfford(lp.bag, u.cost)
    )
      return false;
    f.coins -= u.coins;
    for (const [key, n] of Object.entries(u.cost))
      lp.bag[key as keyof typeof lp.bag] =
        (lp.bag[key as keyof typeof lp.bag] || 0) - n;
    f.upgrades.push(u.id);
    return success();
  }
  if (a.type === "farm-animal-buy") {
    const k = animalById(a.kind);
    if (
      !k ||
      !validName(a.name) ||
      f.coins < k.price ||
      f.animals.length >= animalLimit(f)
    )
      return false;
    f.coins -= k.price;
    f.animals.push({
      id: `animal-${++f.sequence}`,
      kind: k.id,
      name: a.name.trim(),
      born: day,
      feed: -1,
      brush: -1,
      clean: -1,
      bond: 20,
      health: 85,
      progress: 0,
      ready: 0,
    });
    return success();
  }
  if(a.type==='farm-animal-breed'){
    const parent=f.animals.find(v=>v.id===a.id),kind=parent&&animalById(parent.kind);
    if(!parent||!kind||!validName(a.name)||parent.bond<50||parent.health<80||day-parent.born<2||day-(parent.bredDay??-100)<7||f.animals.length>=animalLimit(f)||f.feed<8||f.coins<Math.ceil(kind.price/2))return false;
    f.feed-=8;f.coins-=Math.ceil(kind.price/2);parent.bredDay=day;parent.moment={pose:'greet',until:w.life.time+10};
    f.animals.push({id:`animal-${++f.sequence}`,kind:parent.kind,name:a.name.trim(),born:day,feed:-1,brush:-1,clean:-1,bond:10,health:90,progress:0,ready:0,moment:{pose:'hop',until:w.life.time+10}});f.xp+=12;
    return tell('牧場に新しい家族が生まれました。');
  }
  if (a.type === "farm-animal-care") {
    const animal = f.animals.find((x) => x.id === a.id);
    if (!animal || !["feed", "brush", "clean", "collect", "pat"].includes(a.care))
      return false;
    if (a.care === "collect") {
      if (!animal.ready) return false;
      const n = animal.ready;
      record(
        f,
        animalById(animal.kind)!.product,
        n,
        Math.min(100, 50 + animal.bond / 2 + animal.health / 10),
      );
      f.products += n;
      f.xp += n * 8;
      animal.ready = 0;
      return tell("牧場の恵みを受け取りました。食材庫を確認しましょう。");
    }
    if (animal[a.care] === day) return false;
    if (a.care === "feed") {
      if (!f.feed) return false;
      f.feed--;
      animal.health = Math.min(100, animal.health + 5);
    }
    animal.moment={pose:a.care==="brush"?"roll":a.care==="clean"?"hop":"greet",until:w.life.time+7};
    animal[a.care] = day;
    animal.bond = Math.min(100, animal.bond + (a.care === "brush" ? 5 : 2));
    return success();
  }
  if (a.type === "farm-pet-adopt") {
    const k = petById(a.kind);
    if (
      !k ||
      !validName(a.name) ||
      f.coins < k.price ||
      f.pets.length >= 6 ||
      (k.id === "dragon" && farmLevel(f) < 5)
    )
      return false;
    f.coins -= k.price;
    const pet: FarmPet = {
      id: `pet-${++f.sequence}`,
      kind: k.id,
      name: a.name.trim(),
      bond: 10,
      hunger: 80,
      trained: 0,
      cares: {},
      walkBase: p.moveCount,
      walkDay: -1,
      awayUntil: 0,
      trips: 0,
    };
    f.pets.push(pet);
    if (!f.activePet) f.activePet = pet.id;
    return success();
  }
  if (a.type === "farm-name") {
    if (!validName(a.name)) return false;
    const target = [...f.animals, ...f.pets].find((x) => x.id === a.id);
    if (!target) return false;
    target.name = a.name.trim();
    return success();
  }
  if (a.type === "farm-pet-care") {
    const pet = f.pets.find((x) => x.id === a.id);
    if (
      !pet ||
      pet.awayUntil > w.life.time ||
      !["feed", "pat", "play", "train", "follow", "stay", "trip"].includes(
        a.care,
      )
    )
      return false;
    if (a.care === "follow") {
      f.activePet = pet.id;
      pet.walkBase = p.moveCount;
      return success();
    }
    if (a.care === "stay") {
      if (f.activePet === pet.id) delete f.activePet;
      return success();
    }
    if (a.care === "trip") {
      if (pet.bond < 20 || pet.hunger < 40) return false;
      pet.awayUntil = w.life.time + 180;
      pet.hunger -= 15;
      if (f.activePet === pet.id) delete f.activePet;
      return success();
    }
    if (pet.cares[a.care] === day) return false;
    if (a.care === "feed") {
      if (!f.feed) return false;
      f.feed--;
      pet.hunger = Math.min(100, pet.hunger + 30);
    } else if (pet.hunger < 20) return false;
    if (a.care === "train") {
      pet.trained = Math.min(100, pet.trained + 5);
      f.xp += 3;
    }
    pet.moment={pose:a.care==="pat"?"roll":a.care==="feed"?"greet":"hop",until:w.life.time+7};
    pet.cares[a.care] = day;
    pet.bond = Math.min(100, pet.bond + (a.care === "play" ? 5 : 3));
    return success();
  }
  if(a.type==='farm-pet-trick'){
    const pet=f.pets.find(v=>v.id===a.id),trick=PET_TRICKS.find(v=>v[0]===a.trick);
    if(!pet||!trick||pet.awayUntil>w.life.time||pet.hunger<15||pet.trained<trick[4]||pet.bond<10+trick[4]/2||w.life.time<(pet.lastTrick??-100)+8)return false;
    pet.lastTrick=w.life.time;pet.hunger-=2;pet.moment={pose:trick[5],until:w.life.time+8};
    const first=(pet.tricks??={})[trick[0]]!==day;pet.tricks[trick[0]]=day;
    if(first){f.xp+=3;pet.bond=Math.min(100,pet.bond+1);}
    return tell('かわいい芸を披露してくれました。');
  }
  if (a.type === "farm-reward") {
    const goal = FARM_GOALS.find((g) => g.id === a.id);
    if (!goal || f.claimed.includes(goal.id) || !goal.done(f, w, p.id))
      return false;
    f.claimed.push(goal.id);
    f.coins += goal.coins;
    f.xp += goal.xp;
    return success();
  }
  return false;
}
export function advanceFarm(w: World) {
  if (!w.started || w.ended || !w.farm) return;
  const today = calendar(w).day;
  for (const [id, f] of Object.entries(w.farm.people)) {
    for (let day = f.lastDay + 1; day <= today; day++) {
      const previous = day - 1,
        season = Math.floor(previous / 7) % 4,
        rain = hash(String(previous), w.seed) % 5 === 2;
      for (const plot of f.plots) {
        const c = cropById(plot.crop || "");
        if (
          !c ||
          plot.growth >= c.days ||
          (c.season !== season && !f.upgrades.includes("greenhouse"))
        )
          continue;
        if (
          plot.water === previous ||
          rain ||
          f.upgrades.includes("irrigation")
        ) {
          plot.growth++;
          plot.quality = Math.min(100, plot.quality + 5);
        } else plot.quality = Math.max(40, plot.quality - 5);
      }
      for (const animal of f.animals) {
        const k = animalById(animal.kind)!;
        if (animal.feed === previous) {
          animal.health = Math.min(100, animal.health + 2);
          if (day - animal.born >= k.days && animal.health >= 40) {
            animal.progress++;
            if (animal.progress >= k.days) {
              animal.progress = 0;
              animal.ready = Math.min(
                5,
                animal.ready + 1 + (animal.bond >= 80 ? 1 : 0),
              );
            }
          }
        } else {
          animal.health = Math.max(10, animal.health - 8);
          animal.bond = Math.max(0, animal.bond - 2);
        }
        if (animal.clean !== previous)
          animal.health = Math.max(10, animal.health - 3);
      }
      for (const pet of f.pets) pet.hunger = Math.max(0, pet.hunger - 15);
    }
    if (today > f.lastDay) {
      f.lastDay = today;
      w.revision++;
    }
    for (const pet of f.pets) {
      if (pet.awayUntil > 0 && pet.awayUntil <= w.life.time) {
        pet.awayUntil = 0;
        pet.trips++;
        pet.bond = Math.min(100, pet.bond + 3);
        const kind = petById(pet.kind)!;
        if (kind.talent === "herbs") {
          const p = w.players[id];
          if (p) {
            const lp = lifePlayer(p);
            lp.bag.herb = Math.min(999, (lp.bag.herb || 0) + 2);
          }
        } else if (kind.talent === "coins")
          f.coins += 15 + Math.floor(pet.trained / 5);
        else {
          const crop =
            CROPS[
              calendar(w).season * 8 +
                (hash(`${pet.id}:${pet.trips}`, w.seed) % 8)
            ];
          f.seeds[crop.id] = Math.min(999, (f.seeds[crop.id] || 0) + 2);
        }
        f.xp += 5;
        log(f, pet.name);
        w.revision++;
      }
      const p = w.players[id];
      if (
        p &&
        f.activePet === pet.id &&
        pet.walkDay !== today &&
        p.moveCount - pet.walkBase >= 20 &&
        pet.hunger >= 20
      ) {
        pet.walkDay = today;
        pet.walkBase = p.moveCount;
        pet.bond = Math.min(100, pet.bond + 4);
        f.xp += 4;
        w.revision++;
      }
    }
  }
}
