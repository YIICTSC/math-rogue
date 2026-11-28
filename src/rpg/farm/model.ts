import {currentVoxelRoom,roomContains,roomUsable} from '../voxelRooms';
import {irrigatedPlot} from '../voxelWorkshop';
import {roomWalkable,ROOM_WIDTH,ROOM_HEIGHT,furnishing,furnitureSize} from '../homeCatalog';
import {migrateLand,plotPosition} from './land';
import {energyOf} from '../energy';
import {farmMapTargets,type FarmQuickAction} from './mapTargets';
import {PET_TRICKS} from '../lifestyle/catalog';
import type {AnimalMoment} from '../lifestyle/animalMotion';
import { hasRareCoat } from './animalLook';
import { terrainHeight, voxelKey, voxelWater } from '../voxel';
import { sandboxAllows } from '../sandboxAccess';
import { activeBeaconAt } from '../machinery';
import type { World, Adventurer } from "../engine";
import { WIDTH, HEIGHT } from "../engine";
import { lifePlayer, canAfford, type Bag } from "../life";
import { pendingMutation } from "../activities";
import { calendar, flowerAt, hash } from "../town/model";
import {
  CROPS,
  cropById,
  LIVESTOCK,
  animalById,
  PET_SPECIES,
  petById,
  ingredientById,
  type Crop,
} from "./catalog";

export interface PantryStack {
  normal: number;
  quality: number;
}
export interface FarmPlot {
  x?:number;y?:number;
  hydroponic?:true;
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
  bornAt?:number;
  parentId?:string;
  variant?:'rare';
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
  homeDays?:number;homeId?:string;roomPos?:{x:number;y:number};wanderAt?:number;
  moment?:AnimalMoment;tricks?:Record<string,number>;lastTrick?:number;
  collar?:'teal'|'amber';
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
  spatialVersion?:2;
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
  dispatched?:Record<string,number>;
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
export type FarmAction = {type:"farm-till";dx:number;dy:number} | FarmQuickAction

  | {type:"farm-pet-trick";id:string;trick:string}
  | {type:"farm-pet-collar";id:string;color:'teal'|'amber'|null}
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

export const FAMILIAR_COST={emberstone:3,crystal_powder:2,bottled_honey:1} satisfies Bag;

function newPet(farm:FarmPlayer,player:Adventurer,kind:string,name:string):FarmPet {
  return {
    id:`pet-${++farm.sequence}`,kind,name,bond:10,hunger:80,trained:0,cares:{},
    walkBase:player.moveCount,walkDay:-1,awayUntil:0,trips:0,
  };
}

export function canSummonFamiliar(w:World,p:Adventurer) {
  const pets=w.farm?.people[p.id]?.pets??[];
  return pets.length<6&&!pets.some(pet=>pet.kind==='dragon')&&canAfford(p.life?.bag??{},FAMILIAR_COST);
}

export function summonFamiliar(w:World,p:Adventurer) {
  if(!canSummonFamiliar(w,p))return false;
  const farm=farmOf(w,p),life=lifePlayer(p);
  for(const [item,count] of Object.entries(FAMILIAR_COST) as [keyof typeof FAMILIAR_COST,number][])life.bag[item]!-=count;
  const pet=newPet(farm,p,'dragon',petById('dragon')!.name.ja);
  const home=w.life.houses.find(house=>house.id===life.homeId&&house.owner===p.id);
  if(home){pet.homeId=home.id;pet.roomPos={x:3,y:4};}
  farm.pets.push(pet);
  farm.activePet=pet.id;
  w.farm!.revision=(w.farm!.revision??0)+1;
  return true;
}
export const ownFarm = (w: World, id: string) => w.farm?.people[id];
export function farmOf(w: World, p: Adventurer): FarmPlayer {
  const s = (w.farm ??= { version: 1, people: {} });
  if (s.people[p.id]) {migrateLand(s.people[p.id]);return s.people[p.id];}
  const season = calendar(w).season;
  return (s.people[p.id] = {
    spatialVersion:2,
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
    for (const f of Object.values(w.farm.people)){
      for(const plot of f.plots){const xy=plotPosition(f,plot);if(xy)tiles.add(xy.y*WIDTH+xy.x);}
      if(f.x!==undefined&&f.y!==undefined)f.animals.forEach((_,i)=>tiles.add((f.y!+(i<6?0:5))*WIDTH+f.x!+i%6));
    }
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
export const nearFarm = (p:Adventurer,f:FarmPlayer)=>f.plots.some(plot=>{const xy=plotPosition(f,plot);return xy&&Math.abs(xy.x-p.x)+Math.abs(xy.y-p.y)<=4;})||(f.x!==undefined&&f.y!==undefined&&Math.abs(f.x-p.x)+Math.abs(f.y-p.y)<=4);
export const farmTillCost=(w:World,p:Adventurer)=>activeBeaconAt(w,p)>=2?.8:1;

export function apiaryHasFlowers(w:World,f:FarmPlayer) {
  if(f.x===undefined||f.y===undefined||!f.animals.some(animal=>animal.kind==='bees'))return false;
  for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++){
    const x=f.x+dx,z=f.y+dz;
    if(Math.abs(dx)+Math.abs(dz)>4||x<1||z<1||x>=WIDTH-1||z>=HEIGHT-1)continue;
    if(w.voxels?.edits[`${x},${terrainHeight(w,x,z)},${z}`]==='garden_bed'||flowerAt(w,z*WIDTH+x))return true;
  }
  return false;
}
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

function plant(f: FarmPlayer, plot: FarmPlot, crop: Crop, season: number) {
  if (plot.crop || plot.slot >= plotLimit(f) || !(f.seeds[crop.id]>0) ||
      (crop.season!==season && !f.upgrades.includes('greenhouse'))) return false;
  f.seeds[crop.id]--;
  Object.assign(plot,{
    crop:crop.id,growth:0,water:-1,fertilizer:false,harvests:0,
    quality:60+(plot.previousFamily>=0 && plot.previousFamily!==crop.family ? 10 : 0),
  });
  return true;
}

function fertilize(f: FarmPlayer, plot: FarmPlot) {
  if (!f.compost || plot.fertilizer) return false;
  f.compost--;
  plot.fertilizer=true;
  plot.quality=Math.min(100,plot.quality+15);
  return true;
}

function collectAnimal(f: FarmPlayer, animal: FarmAnimal) {
  const kind=animalById(animal.kind);
  if (!animal.ready || !kind) return false;
  const quality=Math.min(100,50+animal.bond/2+animal.health/10);
  const stock=f.pantry[kind.product]?.[quality>=80?'quality':'normal'] ?? 0;
  if (stock+animal.ready>999) return false;
  record(f,kind.product,animal.ready,quality);
  f.products+=animal.ready;
  f.xp+=animal.ready*8;
  animal.ready=0;
  return true;
}

function feedAnimal(w: World, f: FarmPlayer, animal: FarmAnimal, day: number) {
  if (!f.feed || animal.feed===day) return false;
  f.feed--;
  animal.health=Math.min(100,animal.health+5);
  animal.feed=day;
  animal.bond=Math.min(100,animal.bond+2);
  animal.moment={pose:'eat',until:w.life.time+7};
  return true;
}

function findFarmPlot(f: FarmPlayer, x: number, z: number) {
  return f.plots.find(plot=>{
    const site=plotPosition(f,plot);
    return site?.x===x && site.y===z;
  });
}

function hydroponicBed(w:World,owner:string,x:number,z:number){
  const height=terrainHeight(w,x,z);
  const key=voxelKey(x,height,z);
  return w.voxels?.edits[key]==='hydroponic_bed'&&w.voxels?.placedBy?.[key]===owner?height:null;
}

function hasHydroponicWater(w:World,owner:string,x:number,z:number){
  const height=hydroponicBed(w,owner,x,z);
  if(height===null)return false;
  if(irrigatedPlot(w,x,z))return true;
  return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>{
    const water=voxelWater(w,x+dx,z+dz,height);
    return !!water&&water.surface>height&&water.surface<=height+2;
  });
}

function sellProduce(w:World,f:FarmPlayer,ingredient:string,amount:number,quality:boolean){
  const item=ingredientById(ingredient),stack=item&&f.pantry[item.id];
  const grade=quality?'quality':'normal';
  if(!item||!stack||stack[grade]<amount)return false;
  stack[grade]-=amount;
  const market=w.city?.living?.projects.some(project=>project.id==='market'&&project.complete)?1.2:1;
  f.coins+=Math.round(item.value*amount*(quality?2:1)*market);
  return true;
}

export function farmMachineSignal(w: World, owner: string, x: number, z: number) {
  const farm=w.farm?.people[owner], plot=farm && findFarmPlot(farm,x,z);
  const crop=plot?.crop && cropById(plot.crop);
  return crop && plot.growth>=crop.days ? 15 : 0;
}

export type FarmMachineJob = 'harvest' | 'water' | 'fertilize' | 'ranch' | `plant:${string}` | `ship:${string}`;
export function validFarmMachineJob(value: unknown): value is FarmMachineJob {
  return typeof value==='string' && (['harvest','water','fertilize','ranch'].includes(value) ||
    value.startsWith('plant:') && !!cropById(value.slice(6)) ||
    value.startsWith('ship:') && !!ingredientById(value.slice(5)));
}

/** Equipment works on one owner-matched farm tile through the usual crop and husbandry rules. */
export function operateFarmMachine(w: World, owner: string, x: number, z: number, job: FarmMachineJob, y=terrainHeight(w,x,z)) {
  const farm=w.farm?.people[owner];
  if (!farm) return false;
  const {day,season}=calendar(w);
  if(job.startsWith('ship:')){
    const ingredient=job.slice(5),key=voxelKey(x,y,z);
    if(w.voxels?.edits[key]!=='warehouse_chest'||w.voxels.placedBy?.[key]!==owner||
      !sandboxAllows(w,owner,{x,y,z},'storage')||farm.dispatched?.[ingredient]===day)return false;
    const stack=farm.pantry[ingredient];
    if(!stack||!stack.normal||!sellProduce(w,farm,ingredient,Math.min(3,stack.normal),false))return false;
    (farm.dispatched??={})[ingredient]=day;
    return true;
  }
  if (job==='ranch') {
    if (farm.x===undefined || farm.y===undefined) return false;
    const animal=farm.animals.find((_,i)=>x===farm.x!+i%6 && z===farm.y!+(i<6?0:5));
    return !!animal && (collectAnimal(farm,animal) || feedAnimal(w,farm,animal,day));
  }
  const plot=findFarmPlot(farm,x,z);
  if (!plot) return false;
  if (job.startsWith('plant:')) {
    const crop=cropById(job.slice(6));
    return !!crop && plant(farm,plot,crop,season);
  }
  if (!plot.crop) return false;
  if (job==='harvest') {
    const crop=cropById(plot.crop);
    if (!crop) return false;
    const stack=farm.pantry[crop.id]?.[plot.quality>=80?'quality':'normal'] ?? 0;
    if (stack+crop.yield+(plot.quality>=80?1:0)>999) return false;
    return !!harvest(farm,plot);
  }
  if (job==='fertilize') return fertilize(farm,plot);
  if (job==='water' && plot.water!==day && irrigatedPlot(w,x,z)) {
    plot.water=day;
    return true;
  }
  return false;
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
    spatialVersion:2,
    coins: 100,
    xp: 30,
    done: (f: FarmPlayer) => f.products >= 10,
  },
  {
    id: "friend",
    spatialVersion:2,
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
    done: (f: FarmPlayer) => f.pets.reduce((n, p) => n + (p.homeDays??p.trips), 0) >= 10,
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
  if(a.type==='farm-till'){
    if(!lp.hoe||lp.indoors||!Number.isInteger(a.dx)||!Number.isInteger(a.dy)||Math.abs(a.dx)+Math.abs(a.dy)!==1)return false;
    const x=p.x+a.dx,y=p.y+a.dy,tile=y*WIDTH+x,plot=f.plots.find(v=>v.slot<plotLimit(f)&&!plotPosition(f,v));
    if(!plot||x<2||y<2||x>=WIDTH-2||y>=HEIGHT-2||occupiedFarmTile(w,tile)||
      w.sites.some(v=>Math.abs(v.x-x)+Math.abs(v.y-y)<=1)||w.life.houses.some(h=>Math.abs(h.x-x)+Math.abs(h.y-y)<=1)||
      w.city?.lots.some(v=>v.x===x&&v.y===y)||w.city?.roads.includes(tile))return tell('耕せる草地でクワを使ってください。');
    const surface=terrainHeight(w,x,y),hydroponic=hydroponicBed(w,p.id,x,y)!==null;
    if(!hydroponic&&(!(w.tiles[tile]==='grass'||w.tiles[tile]==='forest'&&!!w.life.nodes[tile]?.regrowAt)||
      w.voxels?.edits[voxelKey(x,0,y)]||w.voxels?.edits[voxelKey(x,surface,y)]))return tell('耕せる草地でクワを使ってください。');
    const cost=farmTillCost(w,p);
    if(energyOf(lp)<cost)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
    if(p.position3D&&p.position3D.y!==undefined&&p.position3D.y<0)return tell('農地は地上の草地で耕せます。');
    Object.assign(plot,{x,y,...(hydroponic?{hydroponic:true}:{})});lp.energy=Math.round((energyOf(lp)-cost)*100)/100;f.x??=x;f.y??=y-1;w.farm!.revision=(w.farm!.revision||0)+1;return tell('前の1マスを耕しました。種を植えられます。');
  }
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
    if (
      typeof a.quality !== "boolean" ||
      !Number.isInteger(a.amount) ||
      a.amount < 1 ||
      a.amount > 99
    )
      return false;
    return sellProduce(w,f,a.ingredient,a.amount,a.quality)&&success();
  }
  if (a.type === "farm-plant") {
    const c = cropById(a.crop),
      plot = f.plots.find((s) => s.slot === a.slot);
    if (
      !c ||
      !plot ||
      !plotPosition(f,plot)||
      Math.abs(plotPosition(f,plot)!.x-p.x)+Math.abs(plotPosition(f,plot)!.y-p.y)>2||
      !plant(f,plot,c,calendar(w).season)
    )
      return false;
    return success();
  }
  if (
    ["farm-water", "farm-fertilize", "farm-harvest", "farm-clear"].includes(
      a.type,
    )
  ) {
    const plot = f.plots.find((s) => s.slot === ("slot" in a ? a.slot : -1));
    if (!plot?.crop||!plotPosition(f,plot)||Math.abs(plotPosition(f,plot)!.x-p.x)+Math.abs(plotPosition(f,plot)!.y-p.y)>2) return false;
    if (a.type === "farm-water") {
      if (plot.water === day) return false;
      plot.water = day;
    }
    if (a.type === "farm-fertilize") {
      if (!fertilize(f,plot)) return false;
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
    const id=`animal-${++f.sequence}`;
    const rare=hasRareCoat(k.id)&&hash(`coat:${p.id}:${id}`,w.seed)%32===0;
    f.animals.push({
      id,
      kind: k.id,
      name: a.name.trim(),
      born: day,
      bornAt:w.town?.elapsed,
      variant:rare?'rare':undefined,
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
    const id=`animal-${++f.sequence}`;
    const rare=hasRareCoat(parent.kind)&&hash(`coat:${p.id}:${id}`,w.seed)%(parent.variant==='rare'?4:32)===0;
    f.animals.push({id,kind:parent.kind,name:a.name.trim(),born:day,bornAt:w.town?.elapsed,parentId:parent.id,
      variant:rare?'rare':undefined,feed:-1,brush:-1,clean:-1,bond:10,health:90,progress:0,ready:0,moment:{pose:'hop',until:w.life.time+10}});f.xp+=12;
    return tell('牧場に新しい家族が生まれました。');
  }
  if (a.type === "farm-animal-care") {
    const animal = f.animals.find((x) => x.id === a.id);
    if (!animal || !["feed", "brush", "clean", "collect", "pat"].includes(a.care))
      return false;
    if (a.care === "collect") {
      if (!collectAnimal(f,animal)) return false;
      return tell("牧場の恵みを受け取りました。食材庫を確認しましょう。");
    }
    if (animal[a.care] === day) return false;
    if (a.care === "feed") return feedAnimal(w,f,animal,day) && success();
    animal.moment={pose:a.care==="brush"?"roll":a.care==="clean"?"hop":"greet",until:w.life.time+7};
    animal[a.care] = day;
    animal.bond = Math.min(100, animal.bond + (a.care === "brush" ? 5 : 2));
    return success();
  }
  if (a.type === "farm-pet-adopt") {
    const voxelHome=currentVoxelRoom(w,p);const home=w.life.houses.find(h=>h.id===lp.indoors&&(h.owner===p.id||lp.homeId===h.id))||(voxelHome?.owner===p.id&&!voxelHome.shared&&roomUsable(w,voxelHome)?voxelHome:undefined);if(!home)return tell("ペットは自宅の中で迎えられます。");
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
    const pet=newPet(f,p,k.id,a.name.trim());
    pet.homeId=home.id;
    pet.roomPos=voxelHome?{x:voxelHome.cells[0].x,y:voxelHome.cells[0].z}:{x:3,y:4};
    f.pets.push(pet);

    return success();
  }
  if (a.type === "farm-name") {
    if (!validName(a.name)) return false;
    const target = [...f.animals, ...f.pets].find((x) => x.id === a.id);
    if (!target) return false;
    target.name = a.name.trim();
    return success();
  }
  if(a.type==='farm-pet-collar'){
    const pet=f.pets.find(candidate=>candidate.id===a.id);
    if(!pet||!petNearby(w,p,f,pet)||a.color!==null&&a.color!=='teal'&&a.color!=='amber'||pet.collar===a.color)return false;
    if(a.color===null){
      if(!pet.collar)return false;
      delete pet.collar;
    }else{
      if((lp.bag.thread??0)<2)return false;
      lp.bag.thread!-=2;
      pet.collar=a.color;
    }
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
    const atHome=!!pet.homeId&&(lp.indoors===pet.homeId||currentVoxelRoom(w,p)?.id===pet.homeId);
    if(!petNearby(w,p,f,pet))return tell('自宅か、散歩中のペットのそばでお世話できます。');
    if(a.care==='follow'){
      if(pet.hunger<20||!atHome&&!!pet.homeId)return false;
      f.activePet=pet.id;
      pet.walkBase=p.moveCount;
      return success();
    }
    if(a.care==='trip'){
      if(!atHome||pet.bond<30||pet.hunger<25||!f.feed||pet.cares.trip===day)return false;
      if(f.activePet===pet.id)delete f.activePet;
      f.feed--;pet.hunger-=15;pet.cares.trip=day;
      pet.awayUntil=w.life.time+45;
      return success();
    }
    if(a.care==='stay'){
      if(f.activePet===pet.id)delete f.activePet;
      pet.moment={pose:'sleep',until:w.life.time+12};
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
    pet.moment={pose:a.care==="pat"?"roll":a.care==="feed"?"eat":"hop",until:w.life.time+7};
    pet.cares[a.care] = day;
    pet.bond = Math.min(100, pet.bond + (a.care === "play" ? 5 : 3));
    return success();
  }
  if(a.type==='farm-pet-trick'){
    const pet=f.pets.find(v=>v.id===a.id),trick=PET_TRICKS.find(v=>v[0]===a.trick);
    if(!pet||!petNearby(w,p,f,pet)||!trick||pet.awayUntil>w.life.time||pet.hunger<15||pet.trained<trick[4]||pet.bond<10+trick[4]/2||w.life.time<(pet.lastTrick??-100)+8)return false;
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
function petNearby(w:World,p:Adventurer,farm:FarmPlayer,pet:FarmPet){
  if(pet.awayUntil>w.life.time)return false;
  if(!pet.homeId||farm.activePet===pet.id)return true;
  return p.life?.indoors===pet.homeId||currentVoxelRoom(w,p)?.id===pet.homeId;
}

export function advanceFarm(w: World) {
  if (!w.started || w.ended || !w.farm) return;
  const today = calendar(w).day;
  for (const [id, f] of Object.entries(w.farm.people)) {
    migrateLand(f);
    for (let day = f.lastDay + 1; day <= today; day++) {
      const previous = day - 1,
        season = Math.floor(previous / 7) % 4,
        rain = hash(String(previous), w.seed) % 5 === 2;
      const pollinating=f.animals.some(animal=>animal.kind==='bees'&&animal.feed===previous&&animal.health>=40)&&apiaryHasFlowers(w,f);
      for (const plot of f.plots) {
        const c = cropById(plot.crop || "");
        if (
          !c ||
          plot.growth >= c.days ||
          (c.season !== season && !f.upgrades.includes("greenhouse"))
        )
          continue;
        const pos=plotPosition(f,plot);
        if (plot.hydroponic ? pos&&hasHydroponicWater(w,id,pos.x,pos.y) :
          plot.water === previous ||
          rain ||
          f.upgrades.includes("irrigation") ||
          pos&&irrigatedPlot(w,pos.x,pos.y)
        ) {
          const visits=pollinating&&pos&&Math.abs(pos.x-f.x!)+Math.abs(pos.y-f.y!)<=5;
          plot.growth++;
          plot.quality = Math.min(100, plot.quality + (visits||plot.hydroponic?8:5));
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
                animal.ready + 1 + (animal.bond >= 80 ? 1 : 0) + (animal.kind==='bees'&&pollinating?1:0),
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
      for (const pet of f.pets){pet.hunger=Math.max(0,pet.hunger-15);if(pet.homeId)pet.homeDays=(pet.homeDays??pet.trips)+1;}
    }
    if (today > f.lastDay) {
      f.lastDay = today;
      w.revision++;
    }
    for (const pet of f.pets) {
      pet.homeId??=w.life.houses.find(h=>h.owner===id)?.id;
      const voxelHome=w.voxelRooms?.find(r=>r.id===pet.homeId);if(voxelHome&&w.life.time>=(pet.wanderAt||0)){const pos=pet.roomPos||{x:voxelHome.cells[0].x,y:voxelHome.cells[0].z},step=[[0,-1],[1,0],[0,1],[-1,0]][hash(pet.id+Math.floor(w.life.time/2),w.seed)%4],next={x:pos.x+step[0],y:pos.y+step[1]};pet.roomPos=voxelHome.cells.some(c=>c.x===next.x&&c.z===next.y)&&!voxelHome.furniture.some(f=>{const s=furnitureSize(f);return !furnishing(f.item)?.floor&&next.x>=f.x&&next.x<f.x+s.width&&next.y>=f.y&&next.y<f.y+s.height;})?next:pos;pet.wanderAt=w.life.time+2;w.revision++;}
      const home=w.life.houses.find(h=>h.id===pet.homeId);if(home?.interior&&w.life.time>=(pet.wanderAt||0)){
        const pos=pet.roomPos||{x:3,y:4},step=[[0,-1],[1,0],[0,1],[-1,0]][hash(pet.id+Math.floor(w.life.time/2),w.seed)%4],next={x:pos.x+step[0],y:pos.y+step[1]};
        pet.roomPos=roomWalkable(home.interior,next.x,next.y)&&next.y<ROOM_HEIGHT-2?next:pos;pet.wanderAt=w.life.time+1.8+(hash(pet.id,w.seed)%8)/10;w.revision++;
      }

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
        !p.life?.indoors&&
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
