import { BIOME_IDS, GOODS, type Good } from './content';
import { borrowedCreature } from './fieldTactics';
import { changeStanding, FACTIONS, residentFaction, standing } from './factions';
import {
  BLEND_BASES,
  BLEND_SPICES,
  DEVICES,
  DEVICE_IDS,
  DEVICE_MODS,
  EQUIPMENT_SOCKETS,
  FIELD_SKILLS,
  FOLLOWER_ORDERS,
  GIFTS,
  LIQUIDS,
  RECIPES_LAB,
  TERRAIN,
  type BlendBase,
  type BlendSpice,
  type Device,
  type DeviceMod,
  type FieldSkill,
  type FollowerOrder,
  type Gift,
  type LabMeal,
  type Liquid,
  type Socket,
} from './frontierContent';
import {
  decodeFieldRules,
  deviceCapacity,
  deviceCost,
  deviceEquipped,
  fieldSkill,
  alertLevel,
  hasAuxiliaryMount,
  totalLiquid,
  twoHanded,
  vesselCapacity,
  validFieldRules,
  type DeviceItem,
  type FrontierRules,
} from './frontierState';
import {
  dig,
  fieldFloor,
  glancingSight,
  liquidMix,
  neighbors,
  pourAt,
  surveySite,
  terrainAt,
} from './frontierWorld';
import { marketPrice } from './life';
import {
  MAX_LIGHT,
  MAX_PARTY_SIZE,
  advance,
  awardExperience,
  awardInspiration,
  equipped,
  maxHp,
  nextRandom,
  note,
  recover,
  rollCheck,
  spendGoods,
  succeeded,
  type Adventure,
} from './state';
import {
  addressKey,
  floorKey,
  hash,
  neighbor,
  residentPresent,
  residentsAt,
  sameAddress,
  type Address,
} from './world';

export type DeviceVerb = 'identify' | 'dismantle' | 'fit' | 'remove' | 'recharge' | 'use';
export type FieldOperation =
  | { kind: 'rules'; rules: FrontierRules }
  | { kind: 'import'; code: string }
  | { kind: 'skill'; id: FieldSkill; mentor?: string }
  | { kind: 'gift'; id: Gift }
  | { kind: 'invoke'; id: Gift; target?: number }
  | { kind: 'fill' | 'drink' | 'draw'; id: Liquid }
  | { kind: 'well' }
  | { kind: 'treat' | 'survey' | 'construct' | 'checkpoint' | 'reorient' }
  | { kind: 'mix'; a: Liquid; b: Liquid }
  | { kind: 'pour'; id: Liquid; cell: number }
  | { kind: 'cook'; id: LabMeal }
  | { kind: 'blend'; base: BlendBase; spice: BlendSpice }
  | { kind: 'barter'; good: Good }
  | { kind: 'device'; serial: number; verb: DeviceVerb; socket?: Socket }
  | { kind: 'design'; id: Device }
  | { kind: 'modify'; serial: number; mod: DeviceMod }
  | { kind: 'book'; key: string; verb: 'read' | 'donate' }
  | { kind: 'site'; method: 'check' | 'supplies' | 'lore' }
  | { kind: 'mark'; place: Address; label: string }
  | { kind: 'pact'; id: string }
  | { kind: 'order'; id: string; order: FollowerOrder | null }
  | { kind: 'lend'; id: string; gear: string | null }
  | { kind: 'offhand'; id: string | null }
  | { kind: 'resolve'; choice: 'signal' | 'shelter' };

const inCombat = (s: Adventure) => Boolean(s.delve?.encounter);
const inTown = (s: Adventure) => !s.delve;
const itemFor = (s: Adventure, serial: number) =>
  s.frontier.devices.find((item) => item.serial === serial);

export function addDevice(s: Adventure, id: Device, known = false) {
  if (s.frontier.devices.length >= 32) return false;
  s.frontier.devices.push({ serial: s.frontier.nextDevice++, id, known, charge: known ? 3 : 1 });
  if (known) s.frontier.discovered[id] = true;
  return true;
}

export function findDevice(s: Adventure, seed: string, chance: number) {
  if (hash(seed + '/artifact') % 100 >= chance) return;
  const id = DEVICE_IDS[hash(seed + '/model') % DEVICE_IDS.length];
  if (addDevice(s, id))
    note(s, ['用途のわからない古機具を手に入れた。', 'You find an unidentified device.'], 'good');
}

export function deviceSocketAvailable(s: Adventure, item: DeviceItem, socket: Socket) {
  return (
    Object.hasOwn(EQUIPMENT_SOCKETS, socket) &&
    (socket === DEVICES[item.id].socket || (socket === 'support' && hasAuxiliaryMount(s)))
  );
}

export const canStudy = (s: Adventure, id: FieldSkill) =>
  !s.frontier.skills[id] &&
  s.talent > 0 &&
  s.character.stats[FIELD_SKILLS[id].stat] >= FIELD_SKILLS[id].minimum;
export const learningCost = (s: Adventure, id: Gift) =>
  (s.frontier.gifts[id] ?? 0) > 0 ? 1 : s.frontier.discipline === 'resonant' ? 1 : 2;
export const giftReady = (s: Adventure, id: Gift) =>
  Boolean(
    s.frontier.gifts[id] &&
      s.focus >= 2 &&
      (s.frontier.used[id] === undefined || s.frontier.used[id]! + GIFTS[id].cooldown <= s.time),
  );

function usePower(s: Adventure, power: Gift | 'lamp' | 'spray', rank: number, target?: number) {
  const d = s.delve;
  switch (power) {
    case 'chisel':
      if (!dig(s)) return false;
      break;
    case 'echo': {
      if (!d || inCombat(s)) return false;
      const floor = fieldFloor(s);
      const record = s.floors[floorKey(s.location, d.floor)];
      if (!record) return false;
      const scan = new Set([d.cell]);
      for (let i = 0; i <= rank; i++)
        for (const cell of [...scan])
          for (const next of neighbors(cell)) if (floor.open.has(next)) scan.add(next);
      record.seen = [...new Set([...record.seen, ...scan])];
      break;
    }
    case 'roots':
      recover(s, 4 + 3 * rank, 0);
      delete s.frontier.conditions.spore;
      s.frontier.injuries = {};
      break;
    case 'lamp':
      if (!d || d.light >= MAX_LIGHT) return false;
      d.light = Math.min(MAX_LIGHT, d.light + 8);
      break;
    case 'spray': {
      if (!d) return false;
      const target = d.cell;
      if (!pourAt(s, target, 'water')) return false;
      delete s.frontier.conditions.burn;
      delete s.frontier.conditions.spore;
      break;
    }
    case 'stagger': {
      const battle = d?.encounter;
      if (!d || !battle) return false;
      const floor = battle.tactics ? fieldFloor(s) : undefined;
      const enemies = battle.enemies.filter(
        (enemy, index) =>
          enemy.hp > 0 &&
          (!floor || glancingSight(floor, d.cell, battle.tactics!.cells[index], 1 + rank)),
      );
      if (!enemies.length) return false;
      for (const enemy of enemies) enemy.stagger = true;
      break;
    }
    case 'clock': {
      s.frontier.conditions.foresight = s.time + 6 + rank;
      const sample = 1 + nextRandom({ rng: s.rng }, 20);
      note(
        s,
        [
          '次の出目は ' + sample + '。判定ではもう一つの出目と比べられる。',
          'The next die shows ' + sample + '. You can compare it with a second roll.',
        ],
        'good',
      );
      return true;
    }
    case 'guide': {
      const battle = d?.encounter;
      const board = battle?.tactics;
      if (
        !d ||
        !battle ||
        !board ||
        battle.guardian ||
        borrowedCreature(battle) >= 0 ||
        target === undefined ||
        !(battle.enemies[target]?.hp > 0) ||
        !glancingSight(fieldFloor(s), d.cell, board.cells[target], 3 + rank)
      )
        return false;
      board.linked = { foe: target, until: battle.turn + 2 + rank };
      break;
    }
    case 'phase': {
      if (!d || inCombat(s)) return false;
      const wall = neighbor(d.cell, d.direction);
      const other = wall < 0 ? -1 : neighbor(wall, d.direction);
      const floor = fieldFloor(s);
      if (wall < 0 || floor.open.has(wall) || !floor.open.has(other) || floor.features[other])
        return false;
      d.previous = d.cell;
      d.cell = other;
      const record = s.floors[floorKey(s.location, d.floor)];
      if (record && !record.seen.includes(other)) record.seen.push(other);
      s.frontier.conditions.phase = s.time + 4 + rank;
      break;
    }
    default:
      s.frontier.conditions[power === 'veil' ? 'ward' : power] = s.time + 3 + rank * 2;
  }
  const copy =
    power === 'lamp'
      ? DEVICES.wick.name
      : power === 'spray'
        ? DEVICES.spray.name
        : GIFTS[power].name;
  note(s, [copy[0] + 'が役に立った。', copy[1] + ' takes effect.'], 'good');
  return true;
}

function deviceAction(s: Adventure, operation: Extract<FieldOperation, { kind: 'device' }>) {
  const item = itemFor(s, operation.serial);
  if (!item || (inCombat(s) && operation.verb !== 'use')) return false;
  const spec = DEVICES[item.id];
  if (operation.verb === 'identify') {
    if (item.known) return false;
    const safe = fieldSkill(s, 'appraisal') || s.frontier.discipline === 'artificer';
    const check = safe ? undefined : rollCheck(s, 'insight', 12);
    advance(s, 1);
    if (check && !succeeded(check) && check.outcome !== 'partial') {
      note(
        s,
        [
          '機具の用途がつかめなかった。工房で鑑定を学ぶと確実にわかる。',
          'The purpose of the device remains unclear. Appraisal training can identify it safely.',
        ],
        'risk',
        check,
      );
      return true;
    }
    item.known = true;
    s.frontier.discovered[item.id] = true;
    note(
      s,
      ['用途が判明した。' + spec.name[0] + 'だ。', 'Identified: ' + spec.name[1] + '.'],
      'good',
      check,
    );
    return true;
  }
  if (!item.known) return false;
  const worn = deviceEquipped(s, item.serial);
  switch (operation.verb) {
    case 'dismantle':
      if (worn) return false;
      s.frontier.devices = s.frontier.devices.filter((other) => other.serial !== item.serial);
      s.frontier.parts += 2 + Number(fieldSkill(s, 'salvage')) * 2;
      s.frontier.discovered[item.id] = true;
      return true;
    case 'fit': {
      const socket = operation.socket ?? spec.socket;
      if (!deviceSocketAvailable(s, item, socket) || s.frontier.sockets[socket] === item.serial)
        return false;
      for (const key of Object.keys(s.frontier.sockets) as Socket[])
        if (s.frontier.sockets[key] === item.serial) delete s.frontier.sockets[key];
      s.frontier.sockets[socket] = item.serial;
      return true;
    }
    case 'remove':
      if (!worn) return false;
      for (const key of Object.keys(s.frontier.sockets) as Socket[])
        if (s.frontier.sockets[key] === item.serial) delete s.frontier.sockets[key];
      return true;
    case 'recharge':
      if (item.charge >= deviceCapacity(item)) return false;
      if (inTown(s) && s.frontier.parts > 0) s.frontier.parts--;
      else if (s.frontier.liquids.oil > 0) s.frontier.liquids.oil--;
      else return false;
      item.charge = Math.min(deviceCapacity(item), item.charge + 2);
      return true;
    case 'use': {
      const cost = deviceCost(item);
      if (!worn || item.charge < cost || !usePower(s, spec.power, 1)) return false;
      item.charge -= cost;
      if (!inCombat(s)) advance(s, 1);
      return true;
    }
  }
}

function fluidAction(
  s: Adventure,
  operation: Extract<FieldOperation, { kind: 'fill' | 'drink' | 'draw' | 'well' | 'mix' | 'pour' }>,
) {
  const fluids = s.frontier.liquids;
  if (operation.kind === 'well') {
    if (!inTown(s) || s.frontier.hydration === s.time) return false;
    s.frontier.hydration = s.time;
    return true;
  }
  if (operation.kind === 'mix') {
    if (
      inCombat(s) ||
      !Object.hasOwn(LIQUIDS, operation.a) ||
      !Object.hasOwn(LIQUIDS, operation.b) ||
      operation.a === operation.b ||
      !fluids[operation.a] ||
      !fluids[operation.b]
    )
      return false;
    const result = liquidMix(operation.a, operation.b);
    if (!result) return false;
    fluids[operation.a]--;
    fluids[operation.b]--;
    fluids[result] += 2;
    note(
      s,
      [LIQUIDS[result].name[0] + 'を調合した。', 'Mixed ' + LIQUIDS[result].name[1] + '.'],
      'good',
    );
    return true;
  }
  const id = operation.id;
  if (!Object.hasOwn(LIQUIDS, id)) return false;
  if (operation.kind === 'fill' || operation.kind === 'draw') {
    const space = vesselCapacity(s) - totalLiquid(s);
    if (inCombat(s) || space < 1) return false;
    if (operation.kind === 'fill') {
      if (!inTown(s) || id === 'resin' || s.gold < (id === 'water' ? 2 : 4)) return false;
      s.gold -= id === 'water' ? 2 : 4;
    } else {
      if (!s.delve) return false;
      const available = { puddle: 'water', resin: 'sap', oil: 'oil', ice: 'brine', moss: 'sap' }[
        terrainAt(s, s.delve.cell, s.delve.floor)
      ];
      if (id !== available) return false;
      advance(s, 1);
    }
    fluids[id]++;
    return true;
  }
  if (!fluids[id]) return false;
  if (operation.kind === 'pour') {
    if (!s.delve || !pourAt(s, operation.cell, id)) return false;
    fluids[id]--;
    const newTerrain = terrainAt(s, operation.cell, s.delve.floor);
    note(s, [
      '足元が' + TERRAIN[newTerrain].name[0] + 'に変わった。',
      'The surface becomes ' + TERRAIN[newTerrain].name[1].toLowerCase() + '.',
    ]);
    return true;
  }
  if (id !== 'water' && id !== 'brine' && id !== 'sap') return false;
  fluids[id]--;
  if (id === 'water') {
    s.frontier.hydration = s.time;
    delete s.frontier.conditions.spore;
    delete s.frontier.conditions.burn;
  } else if (id === 'sap') recover(s, 4 + Number(fieldSkill(s, 'herbalism')) * 3, 1);
  else s.fatigue = Math.min(9, s.fatigue + 2);
  note(s, [
    LIQUIDS[id].name[0] + 'を飲んだ。',
    'You drink ' + LIQUIDS[id].name[1].toLowerCase() + '.',
  ]);
  return true;
}

const residentHere = (s: Adventure, id: string) =>
  residentsAt(s.location).find(
    (person) =>
      person.id === id && (s.followers.includes(person.id) || residentPresent(person, s.time)),
  );

function pact(s: Adventure, id: string) {
  const resident = inTown(s) && residentHere(s, id);
  if (!resident || Object.hasOwn(s.frontier.pacts, id) || s.frontier.liquids.water < 2)
    return false;
  const faction = residentFaction(s.location, resident);
  if (standing(s, faction) <= -3) return false;
  s.frontier.pacts[id] = true;
  s.frontier.liquids.water -= 2;
  changeStanding(s, faction, 2);
  changeStanding(s, FACTIONS[faction].rival, -1);
  const next = surveySite(s.location).sequel;
  s.frontier.rumors[addressKey(next)] = next;
  note(
    s,
    [
      resident.name[0] + 'と水を分け合い、次の史跡を教わった。',
      'You share water with ' + resident.name[1] + ' and learn about another site.',
    ],
    'good',
  );
  return true;
}

export function siteRequirement(s: Adventure, method: 'check' | 'supplies' | 'lore') {
  const site = s.frontier.sites[addressKey(s.location)];
  const location = surveySite(s.location);
  if (!inTown(s) || !site || site.resolved) return false;
  if (method === 'supplies') return s.goods[location.material] > 0;
  if (method === 'lore') return site.read || standing(s, location.biome) >= 5;
  return true;
}

function siteAction(s: Adventure, method: 'check' | 'supplies' | 'lore') {
  if (!siteRequirement(s, method)) return false;
  const site = surveySite(s.location);
  if (method === 'supplies') spendGoods(s, { [site.material]: 1 });
  const stat = { repair: 'might', deal: 'presence', trace: 'insight', gather: 'finesse' } as const;
  const check = method === 'check' ? rollCheck(s, stat[site.task], 11 + site.quality) : undefined;
  advance(s, 2);
  if (check && !succeeded(check)) {
    note(
      s,
      [
        '史跡の調査を続けるには、別の手掛かりが必要だ。',
        'The site investigation needs another lead.',
      ],
      'risk',
      check,
    );
    return true;
  }
  s.frontier.sites[addressKey(s.location)].resolved = true;
  s.frontier.chapters[site.biome] = true;
  s.frontier.parts += site.quality;
  s.goods.relic++;
  awardExperience(s, 12 + 4 * site.quality);
  findDevice(s, addressKey(s.location) + '/site', 65);
  note(
    s,
    [
      site.title[0] + 'の調査を終え、土地の記録を持ち帰った。',
      'Completed the investigation at ' + site.title[1] + ' and recovered its records.',
    ],
    'good',
    check,
  );
  return true;
}

export const fieldChapterCount = (s: Adventure) =>
  BIOME_IDS.filter((id) => s.frontier.chapters[id]).length;
export const PAPER_SENTINEL = 'handmade-paper-sentinel';

export function applyField(s: Adventure, operation: FieldOperation): boolean {
  if (
    inCombat(s) &&
    !(
      operation.kind === 'invoke' ||
      operation.kind === 'drink' ||
      operation.kind === 'pour' ||
      operation.kind === 'treat' ||
      (operation.kind === 'device' && operation.verb === 'use')
    )
  )
    return false;
  switch (operation.kind) {
    case 'rules':
    case 'import': {
      const next = operation.kind === 'rules' ? operation.rules : decodeFieldRules(operation.code);
      if (!inTown(s) || !validFieldRules(next)) return false;
      if (next.weather && !s.frontier.rules.weather) s.frontier.hydration = s.time;
      s.frontier.rules = { ...next };
      return true;
    }
    case 'skill': {
      const { id } = operation;
      if (!inTown(s) || !Object.hasOwn(FIELD_SKILLS, id) || fieldSkill(s, id)) return false;
      if (operation.mentor) {
        const person = residentHere(s, operation.mentor);
        if (
          !person ||
          !s.frontier.pacts[person.id] ||
          !s.frontier.sites[addressKey(s.location)]?.read ||
          standing(s, residentFaction(s.location, person)) < 3 ||
          s.frontier.parts < 2
        )
          return false;
        s.frontier.parts -= 2;
      } else {
        if (!canStudy(s, id)) return false;
        s.talent--;
      }
      s.frontier.skills[id] = true;
      return true;
    }
    case 'gift': {
      const id = operation.id;
      if (
        !inTown(s) ||
        !Object.hasOwn(GIFTS, id) ||
        (s.frontier.gifts[id] ?? 0) >= 3 ||
        s.talent < learningCost(s, id)
      )
        return false;
      s.talent -= learningCost(s, id);
      s.frontier.gifts[id] = ((s.frontier.gifts[id] ?? 0) + 1) as 1 | 2 | 3;
      return true;
    }
    case 'invoke': {
      const id = operation.id;
      if (
        !Object.hasOwn(GIFTS, id) ||
        !giftReady(s, id) ||
        !usePower(s, id, s.frontier.gifts[id]!, operation.target)
      )
        return false;
      s.focus -= 2;
      s.frontier.used[id] = s.time;
      if (['clock', 'echo', 'chorus', 'stagger', 'guide'].includes(id))
        s.frontier.alert = { time: s.time, value: Math.min(24, alertLevel(s) + 3) };
      if (!inCombat(s)) advance(s, 1);
      return true;
    }
    case 'device':
      return deviceAction(s, operation);
    case 'design': {
      const id = operation.id;
      if (
        !inTown(s) ||
        !Object.hasOwn(DEVICES, id) ||
        !s.frontier.discovered[id] ||
        (!fieldSkill(s, 'salvage') && s.frontier.discipline !== 'artificer') ||
        s.frontier.devices.length >= 32
      )
        return false;
      const spec = DEVICES[id];
      if (s.frontier.parts < spec.parts || !spendGoods(s, { [spec.material]: 1 })) return false;
      s.frontier.parts -= spec.parts;
      addDevice(s, id, true);
      s.counters.crafted++;
      advance(s, 2);
      return true;
    }
    case 'modify': {
      const item = itemFor(s, operation.serial);
      if (
        !inTown(s) ||
        !item?.known ||
        item.mod === operation.mod ||
        !Object.hasOwn(DEVICE_MODS, operation.mod) ||
        !fieldSkill(s, 'salvage') ||
        s.frontier.parts < 3
      )
        return false;
      s.frontier.parts -= 3;
      item.mod = operation.mod;
      item.charge = Math.min(item.charge, deviceCapacity(item));
      return true;
    }
    case 'drink':
    case 'draw':
    case 'fill':
    case 'well':
    case 'mix':
    case 'pour':
      return fluidAction(s, operation);
    case 'treat': {
      if (
        (!Object.values(s.frontier.injuries).some((until) => until > s.time) &&
          !s.frontier.conditions.spore &&
          s.hp >= maxHp(s)) ||
        !spendGoods(s, { herb: 1 })
      )
        return false;
      delete s.frontier.conditions.spore;
      if (fieldSkill(s, 'medicine')) {
        delete s.frontier.conditions.burn;
        delete s.frontier.conditions.chill;
        s.frontier.injuries = {};
      } else {
        const wound = Object.entries(s.frontier.injuries).find(([, until]) => until > s.time)?.[0];
        if (wound) delete s.frontier.injuries[wound];
      }
      recover(s, 5 + Number(fieldSkill(s, 'herbalism')) * 3, 1);
      return true;
    }
    case 'cook':
    case 'blend': {
      if (!inTown(s) && !s.goods.fieldKit) return false;
      const until = s.time + (fieldSkill(s, 'cookery') ? 30 : 18);
      if (operation.kind === 'cook') {
        if (
          !Object.hasOwn(RECIPES_LAB, operation.id) ||
          !spendGoods(s, RECIPES_LAB[operation.id].cost)
        )
          return false;
        s.frontier.recipe = { id: operation.id, until };
      } else {
        const { base, spice } = operation;
        if (
          !Object.hasOwn(BLEND_BASES, base) ||
          !Object.hasOwn(BLEND_SPICES, spice) ||
          (spice === 'sap' && !s.frontier.liquids.sap)
        )
          return false;
        if (!spendGoods(s, spice === 'sap' ? { [base]: 1 } : { [base]: 1, [spice]: 1 }))
          return false;
        if (spice === 'sap') s.frontier.liquids.sap--;
        s.frontier.recipe = { id: 'blend', base, spice, until };
      }
      s.lastMealAt = s.time;
      recover(s, 5, 2);
      s.counters.crafted++;
      advance(s, 1);
      note(
        s,
        operation.kind === 'cook'
          ? [
              RECIPES_LAB[operation.id].name[0] + 'を作って食べた。',
              'Prepared and ate ' + RECIPES_LAB[operation.id].name[1] + '.',
            ]
          : [
              GOODS[operation.base].name[0] +
                'に' +
                BLEND_SPICES[operation.spice].name[0] +
                'を合わせて食べた。',
              'You eat ' +
                GOODS[operation.base].name[1].toLowerCase() +
                ' seasoned with ' +
                BLEND_SPICES[operation.spice].name[1].toLowerCase() +
                '.',
            ],
        'good',
      );
      return true;
    }
    case 'barter': {
      if (!inTown(s) || !Object.hasOwn(GOODS, operation.good)) return false;
      const units = Math.max(1, Math.ceil(marketPrice(s, operation.good, false) / 2));
      if (s.frontier.liquids.water < units) return false;
      s.frontier.liquids.water -= units;
      s.goods[operation.good]++;
      s.counters.trades++;
      return true;
    }
    case 'checkpoint': {
      if (
        !inTown(s) ||
        s.character.deathRule === 'permadeath' ||
        (s.frontier.checkpoint && sameAddress(s.location, s.frontier.anchor))
      )
        return false;
      s.frontier.anchor = { ...s.location };
      s.frontier.checkpoint = true;
      note(s, ['この町を旅の再開地点にした。', 'This town is now your recovery point.']);
      return true;
    }
    case 'reorient': {
      if (!s.frontier.conditions.lost || s.frontier.conditions.lost <= s.time) return false;
      const check = rollCheck(s, 'insight', 10, false, fieldSkill(s, 'wayfinding') ? 3 : 0);
      if (succeeded(check)) delete s.frontier.conditions.lost;
      advance(s, 1);
      note(
        s,
        succeeded(check)
          ? [
              '地図と目印を照合し、方角を取り戻した。',
              'You read the landmarks and regain your bearings.',
            ]
          : ['地図をもう一度見直そう。', 'You still need to find a landmark.'],
        succeeded(check) ? 'good' : 'risk',
        check,
      );
      return true;
    }
    case 'survey': {
      if (!inTown(s)) return false;
      const key = addressKey(s.location);
      if (Object.hasOwn(s.frontier.sites, key)) return false;
      s.frontier.sites[key] = {
        place: { ...s.location },
        read: false,
        donated: false,
        resolved: false,
      };
      advance(s, 2);
      note(
        s,
        ['史跡を訪れ、紀行誌を見つけた。', 'You visit the old site and find a travel book.'],
        'story',
      );
      return true;
    }
    case 'book': {
      if (!inTown(s) || !Object.hasOwn(s.frontier.sites, operation.key)) return false;
      const record = s.frontier.sites[operation.key];
      const found = surveySite(record.place);
      if (operation.verb === 'read' && !record.read) {
        record.read = true;
        s.frontier.rumors[addressKey(found.sequel)] = found.sequel;
        delete s.frontier.conditions.lost;
        note(s, found.tale);
        return true;
      }
      if (operation.verb !== 'donate' || !record.read || record.donated) return false;
      record.donated = true;
      awardExperience(s, 8 + found.quality * 3 + Number(fieldSkill(s, 'appraisal')) * 4);
      changeStanding(s, 'academy', 1);
      return true;
    }
    case 'site':
      return siteAction(s, operation.method);
    case 'mark': {
      if (
        !inTown(s) ||
        operation.place.world !== s.location.world ||
        !Number.isSafeInteger(operation.place.x) ||
        !Number.isSafeInteger(operation.place.y)
      )
        return false;
      const key = addressKey(operation.place);
      if (!Object.hasOwn(s.knownTowns, key) && !Object.hasOwn(s.frontier.rumors, key)) return false;
      const label = operation.label.trim().slice(0, 42);
      if (label) s.frontier.marks[key] = { place: { ...operation.place }, label };
      else if (Object.hasOwn(s.frontier.marks, key)) delete s.frontier.marks[key];
      else return false;
      return true;
    }
    case 'pact':
      return pact(s, operation.id);
    case 'order': {
      if (!s.followers.includes(operation.id) || inCombat(s)) return false;
      if (operation.order === null) {
        if (!Object.hasOwn(s.frontier.orders, operation.id)) return false;
        delete s.frontier.orders[operation.id];
      } else {
        if (!Object.hasOwn(FOLLOWER_ORDERS, operation.order)) return false;
        s.frontier.orders[operation.id] = operation.order;
      }
      return true;
    }
    case 'lend': {
      if (!s.followers.includes(operation.id) || inCombat(s)) return false;
      if (operation.gear === null) {
        if (!Object.hasOwn(s.frontier.lent, operation.id)) return false;
        delete s.frontier.lent[operation.id];
      } else {
        if (
          Object.values(s.equipment).includes(operation.gear) ||
          s.frontier.offhand === operation.gear ||
          Object.values(s.frontier.lent).includes(operation.gear) ||
          !s.gear.some((gear) => gear.id === operation.gear)
        )
          return false;
        s.frontier.lent[operation.id] = operation.gear;
      }
      return true;
    }
    case 'offhand': {
      if (!inTown(s) || operation.id === s.frontier.offhand) return false;
      if (operation.id !== null) {
        const item = s.gear.find((gear) => gear.id === operation.id);
        if (
          item?.slot !== 'weapon' ||
          !item.weapon ||
          twoHanded(item.weapon) ||
          twoHanded(equipped(s, 'weapon')?.weapon) ||
          Object.values(s.equipment).includes(item.id) ||
          Object.values(s.frontier.lent).includes(item.id)
        )
          return false;
      }
      s.frontier.offhand = operation.id;
      return true;
    }
    case 'construct': {
      if (
        !inTown(s) ||
        fieldChapterCount(s) < 3 ||
        s.followers.length >= MAX_PARTY_SIZE - 1 ||
        s.followers.includes(PAPER_SENTINEL) ||
        s.frontier.parts < 6
      )
        return false;
      s.frontier.parts -= 6;
      s.friends[PAPER_SENTINEL] = {
        resident: {
          id: PAPER_SENTINEL,
          role: 'keeper',
          name: ['紙灯の見張り鳥', 'Paper lantern sentinel'],
          art: 0,
          site: ['工房', 'Workshop'],
          shift: 'all',
        },
        trust: 7,
        offeredDay: 0,
        visitedDay: 0,
      };
      s.followers.push(PAPER_SENTINEL);
      return true;
    }
    case 'resolve': {
      if (
        !inTown(s) ||
        s.frontier.ending ||
        fieldChapterCount(s) !== 6 ||
        !['signal', 'shelter'].includes(operation.choice)
      )
        return false;
      s.frontier.ending = operation.choice;
      if (operation.choice === 'signal') for (const biome of BIOME_IDS) changeStanding(s, biome, 2);
      else {
        s.gold += 60;
        s.goods.fieldKit += 4;
      }
      awardExperience(s, 65);
      awardInspiration(s);
      note(
        s,
        operation.choice === 'signal'
          ? [
              '六つの灯りがつながり、遠い町へ同じ合図が届いた。',
              'The six lights join, and distant towns hear the same signal.',
            ]
          : [
              '六つの記録を避難所へ分け、街道のどこでも旅人を迎えられるようにした。',
              'You distribute the six records among refuges, so every road can welcome travelers.',
            ],
        'good',
      );
      return true;
    }
  }
}
