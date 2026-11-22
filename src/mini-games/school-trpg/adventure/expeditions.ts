import { GOODS, type Good, type Text } from './content';
import { hasImprovement } from './building';
import { changeStanding } from './factions';
import { ROUTES, ROUTE_BY_ID, type RouteSpec } from './journeyContent';
import { maxExpeditionRank, regionalMastery, type Expedition } from './journeyState';
import { advance, awardExperience, note, rollCheck, spendGoods, succeeded, type Action, type Adventure } from './state';
import { addressKey, atOffset, dayAt, floorKey, hash, sameAddress, townAt } from './world';

export type ExpeditionAction =
  | { type: 'expedition-start'; id: string; rank: number }
  | { type: 'expedition-scout'; approach: 'supply' | 'test' }
  | { type: 'expedition-finish' | 'expedition-abandon' }
  | { type: 'equip-relic'; biome: RouteSpec['biome'] | null };

export const localRoutes = (s: Adventure) => ROUTES.filter((route) => route.biome === townAt(s.location).biome);
export const scoutCost = (e: Expedition) => (e.rank >= 8 ? 2 : 1);
export const objectiveCost = (e: Expedition) => 2 + Math.min(10, e.rank);
export const atStation = (s: Adventure, e: Expedition) => !s.delve && sameAddress(s.location, e.station);
export const atSource = (s: Adventure, e: Expedition) => sameAddress(s.location, e.source);

function requirement(route: RouteSpec, rank: number) {
  if (route.objective === 'warden' || route.objective === 'supply') return 1;
  return Math.min(6, 1 + Math.floor((rank - 1) / 2));
}

export function expeditionDone(s: Adventure, e: Expedition) {
  if (e.stage !== 'task') return false;
  const route = ROUTE_BY_ID[e.id];
  if (route.objective === 'warden') return (s.deepest[addressKey(e.source)] ?? 0) >= e.floor;
  if (route.objective === 'supply') return s.goods[route.material] >= objectiveCost(e);
  return e.progress >= e.target;
}

export const canReportExpedition = (s: Adventure, e: Expedition) =>
  !s.delve && atSource(s, e) && expeditionDone(s, e);

export function expeditionThreat(s: Adventure) {
  const e = s.journey.expedition;
  if (!e || e.stage !== 'task' || !atSource(s, e)) return 0;
  const objective = ROUTE_BY_ID[e.id].objective;
  return ['hunt', 'accord', 'runes', 'warden'].includes(objective)
    ? Math.min(30, Math.floor((e.rank - 1) / 2))
    : 0;
}

export function observeExpedition(before: Adventure, after: Adventure, action: Action) {
  const e = after.journey.expedition;
  if (!e || e.stage !== 'task' || before.journey.expedition?.stage !== 'task' ||
    !atSource(before, e) || !atSource(after, e) || e.progress >= e.target) return;
  const route = ROUTE_BY_ID[e.id];
  let progress = 0;
  switch (route.objective) {
    case 'hunt':
      progress = after.counters.combats - before.counters.combats;
      break;
    case 'accord':
      progress = after.counters.pacified - before.counters.pacified;
      break;
    case 'runes':
      if (action.type === 'inspect-circuit') progress = 1;
      else if (before.delve && after.delve && action.type === 'feature' && action.verb === 'inspect') {
        const key = floorKey(before.location, before.delve.floor);
        progress = (after.floors[key]?.inspected.length ?? 0) - (before.floors[key]?.inspected.length ?? 0);
      }
      break;
    case 'fieldwork':
      progress = Number(action.type === 'life' && ['gather', 'fish', 'forage'].includes(action.activity));
      break;
    case 'craft':
      progress = after.counters.crafted - before.counters.crafted;
      break;
  }
  if (progress > 0) e.progress = Math.min(e.target, e.progress + progress);
}

function accept(s: Adventure, id: string, rank: number) {
  if (s.journey.expedition || !Object.hasOwn(ROUTE_BY_ID, id) ||
      !Number.isInteger(rank) || rank < 1 || rank > maxExpeditionRank(s)) return false;
  const route = ROUTE_BY_ID[id];
  if (route.biome !== townAt(s.location).biome) return false;
  const index = hash(addressKey(s.location) + id + rank + Math.floor((dayAt(s.time) - 1) / 7)) % 4;
  const station = atOffset(s.location, index);
  if (!Number.isSafeInteger(station.x) || !Number.isSafeInteger(station.y)) return false;
  const deepest = s.deepest[addressKey(s.location)] ?? 0;
  s.journey.expedition = {
    id, rank, source: { ...s.location }, station, stage: 'scout', approach: null,
    advantage: false, progress: 0, target: requirement(route, rank),
    floor: Math.max(1, deepest + 1),
  };
  const destination = townAt(station).name;
  note(s, [route.name[0] + 'を引き受けた。手掛かりは' + destination[0] + 'にある。',
    'Accepted ' + route.name[1] + '. The first clue is in ' + destination[1] + '.'], 'story');
  return true;
}

function scout(s: Adventure, e: Expedition, approach: 'supply' | 'test') {
  if (e.stage !== 'scout' || !atStation(s, e)) return false;
  const route = ROUTE_BY_ID[e.id];
  if (approach !== 'supply' && approach !== 'test') return false;
  const check = approach === 'test'
    ? rollCheck(s, route.stat, 11 + Math.min(11, e.rank), false, hasImprovement(s, 'mapRoom') ? 2 : 0)
    : undefined;
  if (approach === 'supply' && !spendGoods(s, { [route.material]: scoutCost(e) })) return false;
  e.advantage = approach === 'supply' || Boolean(check && succeeded(check));
  e.approach = approach;
  e.stage = 'task';
  advance(s, approach === 'supply' ? 1 : 2);
  note(s, route.discovery, e.advantage ? 'good' : 'story', check);
  return true;
}

function report(s: Adventure, e: Expedition) {
  if (!canReportExpedition(s, e)) return false;
  const route = ROUTE_BY_ID[e.id];
  if (route.objective === 'supply' && !spendGoods(s, { [route.material]: objectiveCost(e) })) return false;
  const record = s.journey.expeditions[e.id] ??= { clears: 0, best: 0 };
  const first = record.clears === 0;
  record.clears++;
  record.best = Math.max(record.best, e.rank);
  s.journey.expedition = null;
  const coins = 14 + e.rank * 5 + Number(e.advantage) * (5 + e.rank) + Number(first) * 10;
  s.gold += coins;
  s.goods.relic += 1 + Number(first);
  const food: Good = route.biome === 'coast' ? 'fish' : route.biome === 'grove' ? 'herb' : 'grain';
  s.goods[food] += 2 + Math.floor(e.rank / 4);
  awardExperience(s, 12 + e.rank * 4 + Number(e.advantage) * 6);
  if (!s.journey.relic) s.journey.relic = route.biome;
  if (first) changeStanding(s, route.biome, 2);
  note(s, [route.reward[0] + ' 報酬 ' + coins + ' G・' + GOODS[food].name[0] + '。',
    route.reward[1] + ' Reward: ' + coins + ' G and ' + GOODS[food].name[1] + '.'], 'good');
  return true;
}

export function applyExpeditionAction(s: Adventure, action: ExpeditionAction) {
  if (s.delve) return false;
  if (action.type === 'equip-relic') {
    if (action.biome !== null && regionalMastery(s, action.biome) === 0) return false;
    if (s.journey.relic === action.biome) return false;
    s.journey.relic = action.biome;
    return true;
  }
  if (action.type === 'expedition-start') return accept(s, action.id, action.rank);
  const e = s.journey.expedition;
  if (!e) return false;
  if (action.type === 'expedition-scout') return scout(s, e, action.approach);
  if (action.type === 'expedition-finish') return report(s, e);
  s.journey.expedition = null;
  note(s, ['遠征を取り下げた。', 'You return the expedition notice to the board.', 'えんせいを とりさげた。']);
  return true;
}

export const expeditionStageCopy = {
  scout: ['街道の手掛かりを探す', 'Find the road clue', 'かいどうの てがかりを さがす'],
  task: ['目的を達成する', 'Complete the objective', 'もくてきを たっせいする'],
  report: ['依頼を受けた町で報告', 'Report in the commissioning town', 'いらいを うけた まちで ほうこく'],
} satisfies Record<string, Text>;
