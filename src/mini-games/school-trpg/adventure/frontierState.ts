import { BIOMES, type Biome, type Stat, type Text } from './content';
import {
  BLEND_BASES,
  BLEND_SPICES,
  BODY_ZONES,
  CONDITIONS,
  DEVICES,
  DEVICE_MODS,
  DISCIPLINES,
  ENCOUNTER_RULES,
  EQUIPMENT_SOCKETS,
  FIELD_SKILLS,
  FOLLOWER_ORDERS,
  GIFTS,
  LIQUID_IDS,
  RECIPES_LAB,
  TERRAIN,
  type BlendBase,
  type BlendSpice,
  type BodyZone,
  type Condition,
  type Device,
  type DeviceMod,
  type Discipline,
  type FieldSkill,
  type FollowerOrder,
  type Gift,
  type LabMeal,
  type Liquid,
  type MealTrigger,
  type RunKind,
  type Socket,
  type Terrain,
} from './frontierContent';
import type { Adventure } from './state';
import { addressKey, floorKey, SIDE, type Address } from './world';

export const FRONTIER_RULES = ['weather', 'tactical', 'safeWalk'] as const;
export type FrontierRule = (typeof FRONTIER_RULES)[number];
export type FrontierRules = Record<FrontierRule, boolean>;
export type DeviceItem = {
  serial: number;
  id: Device;
  known: boolean;
  charge: number;
  mod?: DeviceMod;
};
export type SiteRecord = { place: Address; read: boolean; donated: boolean; resolved: boolean };
export type FieldPatch = { terrain: Terrain; until: number | null };
export type AlteredFloor = { dug: number[]; patches: Record<string, FieldPatch> };
export type Alert = { value: number; time: number };
export type FieldMeal =
  | { id: LabMeal; until: number }
  | { id: 'blend'; base: BlendBase; spice: BlendSpice; until: number };
export type Frontier = {
  discipline: Discipline;
  rules: FrontierRules;
  run: RunKind;
  anchor: Address;
  checkpoint: boolean;
  hydration: number;
  parts: number;
  conditions: Partial<Record<Condition, number>>;
  injuries: Partial<Record<BodyZone, number>>;
  skills: Partial<Record<FieldSkill, true>>;
  gifts: Partial<Record<Gift, 1 | 2 | 3>>;
  used: Partial<Record<Gift, number>>;
  alert: Alert;
  devices: DeviceItem[];
  discovered: Partial<Record<Device, true>>;
  sockets: Partial<Record<Socket, number>>;
  nextDevice: number;
  liquids: Record<Liquid, number>;
  recipe: FieldMeal | null;
  sites: Record<string, SiteRecord>;
  rumors: Record<string, Address>;
  alterations: Record<string, AlteredFloor>;
  marks: Record<string, { place: Address; label: string }>;
  pacts: Record<string, true>;
  orders: Record<string, FollowerOrder>;
  lent: Record<string, string>;
  offhand: string | null;
  chapters: Partial<Record<Biome, true>>;
  ending: 'signal' | 'shelter' | null;
};

export const standardRules = (): FrontierRules => ({
  weather: false,
  tactical: false,
  safeWalk: true,
});
export function newFrontier(
  place: Address,
  time: number,
  discipline: Discipline = 'explorer',
  run: RunKind = 'classic',
  rules = standardRules(),
): Frontier {
  return {
    discipline,
    run,
    rules: { ...rules },
    anchor: { ...place },
    checkpoint: false,
    hydration: time,
    parts: 0,
    conditions: {},
    injuries: {},
    skills: {},
    gifts: discipline === 'resonant' ? { echo: 1 } : {},
    used: {},
    alert: { value: 0, time },
    devices: discipline === 'artificer' ? [{ serial: 1, id: 'wick', known: true, charge: 3 }] : [],
    discovered: discipline === 'artificer' ? { wick: true } : {},
    sockets: discipline === 'artificer' ? { pack: 1 } : {},
    nextDevice: discipline === 'artificer' ? 2 : 1,
    liquids: { water: 5, brine: 0, oil: 0, sap: 0, chalk: 0, resin: 0 },
    recipe: null,
    sites: {},
    rumors: {},
    alterations: {},
    marks: {},
    pacts: {},
    orders: {},
    lent: {},
    offhand: null,
    chapters: {},
    ending: null,
  };
}

export const fieldCondition = (s: Adventure, id: Condition) =>
  (s.frontier.conditions[id] ?? 0) > s.time;
export const bodyInjured = (s: Adventure, id: BodyZone) => (s.frontier.injuries[id] ?? 0) > s.time;
export const fieldSkill = (s: Adventure, id: FieldSkill) => Boolean(s.frontier.skills[id]);
export const alertLevel = (s: Adventure) =>
  Math.max(0, s.frontier.alert.value - Math.floor((s.time - s.frontier.alert.time) / 5));
export const hasAuxiliaryMount = (s: Adventure) =>
  s.level >= 4 && (fieldSkill(s, 'salvage') || (s.frontier.gifts.chorus ?? 0) > 0);
export const totalLiquid = (s: Adventure) =>
  LIQUID_IDS.reduce((sum, id) => sum + s.frontier.liquids[id], 0);
export const vesselCapacity = (s: Adventure) => (s.frontier.discipline === 'explorer' ? 18 : 14);
export const carriedWeight = (s: Adventure) =>
  Math.ceil(Object.values(s.goods).reduce((sum, n) => sum + n, 0) / 3) +
  s.gear.length * 2 +
  s.frontier.devices.length * 2 +
  totalLiquid(s);
export const carryCapacity = (s: Adventure) =>
  44 + s.character.stats.might * 6 + (s.frontier.discipline === 'explorer' ? 12 : 0);
export const thirst = (s: Adventure) =>
  s.frontier.rules.weather ? Math.max(0, s.time - s.frontier.hydration) : 0;
export const travelLoad = (s: Adventure) =>
  s.frontier.rules.weather
    ? Math.min(3, Math.max(0, Math.ceil((carriedWeight(s) - carryCapacity(s)) / 16)))
    : 0;
export const thirstPenalty = (s: Adventure) => Math.floor(Math.min(36, thirst(s)) / 12);
export const deviceCapacity = (item: DeviceItem) => 3 + (item.mod === 'reservoir' ? 2 : 0);
export const deviceCost = (item: DeviceItem) =>
  Math.max(1, DEVICES[item.id].charge - Number(item.mod === 'focus'));
export const deviceEquipped = (s: Adventure, serial: number) =>
  Object.values(s.frontier.sockets).includes(serial);
export const twoHanded = (weapon?: string) =>
  weapon === 'hammer' || weapon === 'staff' || weapon === 'bow';
export const alterationAt = (s: Adventure, depth: number) =>
  s.frontier.alterations[floorKey(s.location, depth)];
export const fieldRecipe = (s: Adventure) =>
  s.frontier.recipe && s.frontier.recipe.until > s.time ? s.frontier.recipe : null;
export const mealTrigger = (dish: FieldMeal) =>
  dish.id === 'blend' ? BLEND_BASES[dish.base].trigger : RECIPES_LAB[dish.id].trigger;
export const fieldRecipeBonus = (s: Adventure, trigger: MealTrigger) => {
  const recipe = fieldRecipe(s);
  return Boolean(recipe && mealTrigger(recipe) === trigger);
};

export function fieldCheck(s: Adventure, stat: Stat) {
  let modifier = -thirstPenalty(s);
  if (stat === 'finesse')
    modifier -=
      Number(fieldCondition(s, 'chill')) +
      Number(bodyInjured(s, 'feet') && !fieldSkill(s, 'stance'));
  if (stat === 'might')
    modifier -= Number(bodyInjured(s, 'grip')) + Number(fieldCondition(s, 'burn'));
  if (stat === 'insight')
    modifier -= Number(fieldCondition(s, 'static')) + Number(bodyInjured(s, 'head'));
  if (stat === 'presence') modifier += Number(fieldSkill(s, 'diplomacy')) * 2;
  return modifier;
}

export function runSeed(run: RunKind, now = Date.now()) {
  const day = Math.floor(now / 86_400_000);
  return run === 'daily'
    ? 'day-' + day
    : run === 'weekly'
      ? 'week-' + Math.floor((day + 3) / 7)
      : null;
}

export const RULE_LABELS = {
  weather: ['渇きと地形の影響', 'Thirst and terrain effects', 'かわきと ちけいの えいきょう'],
  tactical: ['手動の戦術戦闘', 'Manual tactical combat', 'しゅどうの せんじゅつせんとう'],
  safeWalk: [
    '探索中は危険で止まる',
    'Stop auto-exploring at hazards',
    'きけんで たんさくを とめる',
  ],
} satisfies Record<FrontierRule, Text>;

export function encodeFieldRules(rules: FrontierRules) {
  return 'bell-' + FRONTIER_RULES.map((id) => (rules[id] ? '1' : '0')).join('');
}
export function decodeFieldRules(input: string): FrontierRules | null {
  const match = /^bell-([01])([01])([01])$/i.exec(input.trim());
  return match
    ? { weather: match[1] === '1', tactical: match[2] === '1', safeWalk: match[3] === '1' }
    : null;
}

export const validFieldRules = (rules: FrontierRules | null | undefined) =>
  Boolean(rules && FRONTIER_RULES.every((id) => typeof rules[id] === 'boolean'));

const integer = (value: unknown, lo = 0, hi = Number.MAX_SAFE_INTEGER) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= lo && value <= hi;
const entriesMatch = (
  value: Record<string, unknown>,
  test: (id: string, item: unknown) => boolean,
) =>
  Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.entries(value).every(([id, item]) => test(id, item)),
  );
const keysOf = (value: Record<string, unknown>, keys: object, check: (v: unknown) => boolean) =>
  entriesMatch(value, (id, item) => Object.hasOwn(keys, id) && check(item));
const tile = (value: unknown) => integer(value, 0, SIDE * SIDE - 1);

export function validFrontier(
  f: Frontier,
  time: number,
  validAddress: (address: Address) => boolean,
  gearIds: string[],
  followers: string[],
) {
  if (
    !f ||
    !Object.hasOwn(DISCIPLINES, f.discipline) ||
    !Object.hasOwn(ENCOUNTER_RULES, f.run) ||
    !validFieldRules(f.rules) ||
    !validAddress(f.anchor) ||
    typeof f.checkpoint !== 'boolean' ||
    !integer(f.hydration, 0, time) ||
    !integer(f.parts) ||
    !integer(f.nextDevice, 1) ||
    !f.alert ||
    !integer(f.alert.value, 0, 24) ||
    !integer(f.alert.time, 0, time)
  )
    return false;
  if (
    !Array.isArray(f.devices) ||
    f.devices.length > 32 ||
    new Set(f.devices.map((item) => item?.serial)).size !== f.devices.length ||
    !f.devices.every(
      (v) =>
        v &&
        integer(v.serial, 1, f.nextDevice - 1) &&
        Object.hasOwn(DEVICES, v.id) &&
        typeof v.known === 'boolean' &&
        (v.mod === undefined || Object.hasOwn(DEVICE_MODS, v.mod)) &&
        integer(v.charge, 0, deviceCapacity(v)),
    ) ||
    !keysOf(f.sockets, EQUIPMENT_SOCKETS, (serial) =>
      f.devices.some((item) => item.serial === serial && item.known),
    ) ||
    new Set(Object.values(f.sockets)).size !== Object.values(f.sockets).length ||
    !keysOf(f.discovered, DEVICES, (value) => value === true) ||
    !keysOf(f.skills, FIELD_SKILLS, (value) => value === true) ||
    !keysOf(f.gifts, GIFTS, (value) => integer(value, 1, 3)) ||
    !keysOf(f.used, GIFTS, (value) => integer(value, 0, time)) ||
    !keysOf(f.conditions, CONDITIONS, (value) => integer(value, 0, time + 72)) ||
    !keysOf(f.injuries, BODY_ZONES, (value) => integer(value, 0, time + 48)) ||
    !keysOf(f.chapters, BIOMES, (value) => value === true) ||
    !f.liquids ||
    !LIQUID_IDS.every((id) => integer(f.liquids[id], 0, 18)) ||
    LIQUID_IDS.reduce((sum, id) => sum + f.liquids[id], 0) > 18 ||
    (f.recipe !== null &&
      (!f.recipe ||
        !integer(f.recipe.until, 1, time + 36) ||
        (f.recipe.id === 'blend'
          ? !Object.hasOwn(BLEND_BASES, f.recipe.base) ||
            !Object.hasOwn(BLEND_SPICES, f.recipe.spice)
          : !Object.hasOwn(RECIPES_LAB, f.recipe.id)))) ||
    ![null, 'signal', 'shelter'].includes(f.ending)
  )
    return false;
  if (
    !entriesMatch(f.sites, (key, value) => {
      const site = value as SiteRecord;
      return Boolean(
        site &&
          validAddress(site.place) &&
          key === addressKey(site.place) &&
          [site.read, site.donated, site.resolved].every((flag) => typeof flag === 'boolean') &&
          (!site.donated || site.read),
      );
    }) ||
    !entriesMatch(
      f.rumors,
      (key, value) => validAddress(value as Address) && key === addressKey(value as Address),
    ) ||
    !entriesMatch(f.marks, (key, value) => {
      const mark = value as Frontier['marks'][string];
      return Boolean(
        mark &&
          validAddress(mark.place) &&
          key === addressKey(mark.place) &&
          typeof mark.label === 'string' &&
          mark.label.length <= 42,
      );
    }) ||
    !entriesMatch(f.alterations, (key, value) => {
      const floor = value as AlteredFloor;
      return Boolean(
        key.length <= 90 &&
          floor &&
          Array.isArray(floor.dug) &&
          floor.dug.length < SIDE * SIDE &&
          floor.dug.every(tile) &&
          entriesMatch(floor.patches, (id, value) => {
            const patch = value as FieldPatch;
            return (
              /^\d+$/.test(id) &&
              tile(Number(id)) &&
              Boolean(
                patch &&
                  Object.hasOwn(TERRAIN, patch.terrain) &&
                  (patch.until === null || integer(patch.until, 0, time + 24)),
              )
            );
          }),
      );
    })
  )
    return false;
  return (
    (f.offhand === null ||
      (gearIds.includes(f.offhand) && !Object.values(f.lent).includes(f.offhand))) &&
    entriesMatch(f.pacts, (id, value) => id.length <= 110 && value === true) &&
    entriesMatch(
      f.orders,
      (id, value) =>
        followers.includes(id) &&
        typeof value === 'string' &&
        Object.hasOwn(FOLLOWER_ORDERS, value),
    ) &&
    entriesMatch(
      f.lent,
      (id, value) => followers.includes(id) && typeof value === 'string' && gearIds.includes(value),
    ) &&
    new Set(Object.values(f.lent)).size === Object.values(f.lent).length
  );
}
