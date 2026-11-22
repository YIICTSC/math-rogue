import { BIOMES, FOES, type Biome, type Text } from './content';
import { ROUTE_BY_ID } from './journeyContent';
import { MEALS, type MealId } from './provisions';
import type { Adventure } from './state';
import type { Address } from './world';

export const FORMATIONS = {
  adaptive: { name: ['均衡', 'Balanced', 'きんこう'], hint: ['構えに合わせて技を使う', 'Respond to enemy intent', 'かまえに あわせる'] },
  rush: { name: ['強襲', 'Rush', 'きょうしゅう'], hint: ['攻撃が強まるが、敵に狙われると受ける傷が深い', 'Higher damage dealt and taken', 'こうげきも うける きずも つよくなる'] },
  shelter: { name: ['護衛', 'Escort', 'ごえい'], hint: ['受ける傷が浅く、仲間が負傷者を優先して手当てする', 'Reduces incoming damage and prioritizes healing', 'きずが あさく、てあてを ゆうせん'] },
  survey: { name: ['観察', 'Observe', 'かんさつ'], hint: ['初手で弱点を調べ、以後は弱点を狙う', 'Study weaknesses on turn one, then exploit them', 'さいしょに よわてんを しらべる'] },
  envoy: { name: ['和解', 'Negotiate', 'わかい'], hint: ['相手を観察してから交渉を続け、味方は手当てと防御に回る', 'Study the enemy and attempt parley while companions heal and defend', 'まものを しらべて はなしあう。なかまは てあてと ぼうぎょ'] },
} satisfies Record<string, { name: Text; hint: Text }>;
export type Formation = keyof typeof FORMATIONS;
export const FORMATION_IDS = Object.keys(FORMATIONS) as Formation[];
export const EXPEDITION_MAX_RANK = 99;

export type Expedition = {
  id: string;
  rank: number;
  source: Address;
  station: Address;
  stage: 'scout' | 'task';
  approach: 'supply' | 'test' | null;
  advantage: boolean;
  progress: number;
  target: number;
  floor: number;
};

export type Journey = {
  expeditions: Record<string, { clears: number; best: number }>;
  expedition: Expedition | null;
  relic: Biome | null;
  formation: Formation;
  bestiary: Record<string, { encounters: number; victories: number; accords: number }>;
  meals: Partial<Record<MealId, number>>;
  tasted: MealId[];
  meal: { id: MealId; until: number } | null;
};

export const newJourney = (): Journey => ({
  expeditions: {}, expedition: null, relic: null,
  formation: 'adaptive', bestiary: {}, meals: {}, tasted: [], meal: null,
});

export const routeClears = (s: Adventure, id: string) => s.journey.expeditions[id]?.clears ?? 0;
export function regionalMastery(s: Adventure, biome: Biome) {
  return Object.keys(s.journey.expeditions).filter((id) =>
    Object.hasOwn(ROUTE_BY_ID, id) && ROUTE_BY_ID[id].biome === biome && routeClears(s, id) > 0,
  ).length;
}
export const relicPower = (s: Adventure, biome: Biome) =>
  s.journey.relic === biome ? 1 + Number(regionalMastery(s, biome) >= 3) : 0;
export const totalRoutes = (s: Adventure) =>
  Object.values(s.journey.expeditions).reduce((total, route) => total + route.clears, 0);
export const maxExpeditionRank = (s: Adventure) =>
  Math.min(EXPEDITION_MAX_RANK, 1 + Math.floor(totalRoutes(s) / 3));

export function bestiaryRecord(s: Adventure, index: number) {
  return s.journey.bestiary[index] ??= { encounters: 0, victories: 0, accords: 0 };
}

const integer = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max;
export function validJourney(
  journey: Journey, time: number, validAddress: (address: Address) => boolean,
) {
  if (!journey || !journey.expeditions || !journey.bestiary || !journey.meals || !Array.isArray(journey.tasted)) return false;
  const e = journey.expedition;
  const meal = journey.meal;
  return (e === null || Boolean(e && Object.hasOwn(ROUTE_BY_ID, e.id) &&
    integer(e.rank, 1, EXPEDITION_MAX_RANK) && validAddress(e.source) && validAddress(e.station) &&
    e.source.world === e.station.world &&
    Math.abs(e.source.x - e.station.x) + Math.abs(e.source.y - e.station.y) === 1 &&
    (e.stage === 'scout' || e.stage === 'task') &&
    (e.stage === 'scout' ? e.approach === null : e.approach === 'supply' || e.approach === 'test') &&
    typeof e.advantage === 'boolean' && integer(e.target, 1, 6) && integer(e.progress, 0, e.target) &&
    integer(e.floor, 1))) &&
    (journey.relic === null || Object.hasOwn(BIOMES, journey.relic)) &&
    Object.hasOwn(FORMATIONS, journey.formation) &&
    Object.entries(journey.expeditions).every(([id, entry]) => Object.hasOwn(ROUTE_BY_ID, id) &&
      entry && integer(entry.clears, 1) && integer(entry.best, 1, EXPEDITION_MAX_RANK)) &&
    Object.entries(journey.bestiary).every(([key, entry]) => /^\d+$/.test(key) && integer(Number(key), 0, FOES.length - 1) &&
      entry && integer(entry.encounters) && integer(entry.victories) && integer(entry.accords) &&
      entry.victories + entry.accords <= entry.encounters) &&
    Object.entries(journey.meals).every(([key, value]) => Object.hasOwn(MEALS, key) && integer(value, 0, 20)) &&
    new Set(journey.tasted).size === journey.tasted.length &&
    journey.tasted.every((id) => Object.hasOwn(MEALS, id)) &&
    (meal === null || Boolean(meal && Object.hasOwn(MEALS, meal.id) && integer(meal.until, 1, time + 24)));
}
