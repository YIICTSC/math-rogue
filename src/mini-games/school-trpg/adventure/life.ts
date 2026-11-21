import { TALES, type Boon } from './tales';
import {
  BIOMES,
  GOODS,
  RECIPES,
  RESIDENT_ROLES,
  STAT_IDS,
  type Good,
  type Slot,
  type Stat,
  type Text,
} from './content';
import { adjustGearCaps, forgeGear, gearName, gearValue, SLOT_IDS } from './inventory';
import {
  advance,
  awardExperience,
  awardInspiration,
  maxFocus,
  maxHp,
  note,
  recover,
  rollCheck,
  spendGoods,
  succeeded,
  worldCode,
  type Action,
  type ActiveMission,
  type Adventure,
  type LifeActivity,
} from './state';
import {
  addressKey,
  atOffset,
  dayAt,
  floorKey,
  hash,
  hourAt,
  isNight,
  missionsAt,
  residentPresent,
  residentsAt,
  sameAddress,
  townAt,
  weatherIndexAt,
  type Address,
  type Resident,
} from './world';

export const ACTIVITIES: Record<LifeActivity, { name: Text; stat: Stat; hours: number }> = {
  work: { name: ['町で働く', 'Work a shift', 'まちで はたらく'], stat: 'might', hours: 4 },
  gather: { name: ['採集する', 'Gather materials', 'さいしゅうする'], stat: 'finesse', hours: 2 },
  fish: { name: ['釣りをする', 'Go fishing', 'つりをする'], stat: 'finesse', hours: 2 },
  practice: {
    name: ['研究・修練', 'Research and train', 'けんきゅう・しゅうれん'],
    stat: 'insight',
    hours: 3,
  },
  survey: {
    name: ['名所を調べる', 'Survey a landmark', 'めいしょを しらべる'],
    stat: 'insight',
    hours: 2,
  },
  performance: {
    name: ['広場で演奏', 'Perform in the square', 'ひろばで えんそう'],
    stat: 'presence',
    hours: 3,
  },
  forage: {
    name: ['野辺で食材探し', 'Forage for food', 'しょくざいを さがす'],
    stat: 'insight',
    hours: 2,
  },
};
export const localBoon = (s: Adventure): Boon | undefined =>
  s.townTales[addressKey(s.location)]?.boon;
export const ownDwelling = (s: Adventure) => s.workshop[addressKey(s.location)];
export const homePrice = (s: Adventure) => 45 + BIOMES[townAt(s.location).biome].risk * 7;
export const nextHarvest = (s: Adventure) =>
  ownDwelling(s)?.planted.filter((time) => s.time >= time).length ?? 0;

export function marketPrice(s: Adventure, good: Good, sell: boolean) {
  const biome = BIOMES[townAt(s.location).biome];
  const base =
    GOODS[good].price +
    (biome.local === good ? -2 : 0) +
    (hash(addressKey(s.location) + good + dayAt(s.time)) % 3);
  const tradeFriend = residentsAt(s.location).find((r) => r.role === 'broker');
  const discount = tradeFriend && (s.friends[tradeFriend.id]?.trust ?? 0) >= 4 ? 1 : 0;
  return sell
    ? Math.max(1, Math.floor(base * 0.57))
    : Math.max(2, base - discount - (localBoon(s) === 'trade' ? 2 : 0));
}

function arrive(s: Adventure, to: Address, time: number) {
  const key = addressKey(to);
  const visited = Object.hasOwn(s.knownTowns, key);
  s.location = to;
  s.knownTowns[key] = to;
  advance(s, time);
  s.fatigue = Math.min(9, s.fatigue + 1);
  const town = townAt(to);
  note(s, [`${town.name[0]}に到着した。`, `You arrive in ${town.name[1]}.`]);
  if (!visited) {
    if (s.character.ideal === 'discovery') awardInspiration(s);
    awardExperience(s, 2);
  }
}
function workCount(s: Adventure, count = 1) {
  const key = addressKey(s.location);
  s.townWork[key] = (s.townWork[key] ?? 0) + count;
  s.counters.jobs += count;
}
export function canActivity(s: Adventure, activity: LifeActivity) {
  return activity === 'survey'
    ? !s.exploredLandmarks[addressKey(s.location)]
    : activity === 'gather' || activity === 'forage' || activity === 'fish'
      ? s.lastGather?.location !== addressKey(s.location) || s.time - s.lastGather.time >= 4
      : true;
}
function life(s: Adventure, activity: LifeActivity) {
  if (!Object.hasOwn(ACTIVITIES, activity) || !canActivity(s, activity)) return false;
  const town = townAt(s.location);
  const biome = BIOMES[town.biome];
  const { stat, hours } = ACTIVITIES[activity];
  const outside = ['gather', 'fish', 'forage', 'survey'].includes(activity);
  const dc =
    9 +
    biome.risk +
    Number(isNight(s.time) && activity !== 'performance') +
    (outside && weatherIndexAt(s.location, s.time) === 1 ? 2 : 0);
  const check = rollCheck(s, stat, dc);
  const success = succeeded(check);
  const excellent = check.outcome === 'critical';
  const tone = success ? 'good' : 'risk';
  advance(s, hours);
  s.fatigue = Math.min(9, s.fatigue + (activity === 'work' ? 2 : 1));
  if (activity === 'gather' || activity === 'fish' || activity === 'forage') {
    const good =
      activity === 'fish'
        ? 'fish'
        : activity === 'forage'
          ? biome.local === 'fish'
            ? 'fish'
            : 'grain'
          : biome.local;
    const amount = 1 + Number(success) + Number(excellent) + Number(localBoon(s) === 'garden');
    s.goods[good] += amount;
    if (s.character.calling === 'naturalist') s.goods.herb++;
    s.lastGather = { location: addressKey(s.location), time: s.time };
    note(
      s,
      [
        `${GOODS[good].name[0]}を${amount}手に入れた。`,
        `Collected ${amount} × ${GOODS[good].name[1]}.`,
      ],
      tone,
      check,
    );
  } else if (activity === 'survey') {
    const landmark = town.landmark;
    if (success) {
      s.exploredLandmarks[addressKey(s.location)] = true;
      s.counters.landmarks++;
      s.goods.relic += 1 + Number(excellent);
      awardInspiration(s);
      note(
        s,
        [
          `${landmark[0]}で忘れられた記録を見つけた。`,
          `You find a forgotten record at ${landmark[1]}.`,
        ],
        'good',
        check,
      );
    } else {
      note(
        s,
        [
          `${landmark[0]}の痕跡は薄い。時間を改めて再調査できる。`,
          `The trace at ${landmark[1]} is faint. Come back for another look.`,
        ],
        'risk',
        check,
      );
    }
  } else if (activity === 'practice') {
    if (success) awardInspiration(s);
    note(
      s,
      ['読み書きと修練に時間を使った。', 'You spend time studying and training.'],
      tone,
      check,
    );
  } else {
    const money = (activity === 'work' ? 10 : 7) + (success ? 9 : 0) + (excellent ? 6 : 0);
    s.gold += money;
    workCount(s);
    if (activity === 'performance' && success) {
      const listener = residentsAt(s.location).find((resident) =>
        residentPresent(resident, s.time),
      );
      if (listener) addTrust(s, listener, 1);
    }
    note(s, [`${money} Gを稼いだ。`, `Earned ${money} G.`], tone, check);
  }
  awardExperience(
    s,
    (activity === 'practice' ? (localBoon(s) === 'study' ? 12 : 7) : 4) + (success ? 3 : 0),
  );
  return true;
}

function addTrust(s: Adventure, resident: Resident, amount: number) {
  const previous = s.friends[resident.id];
  const before = previous?.trust ?? 0;
  const trust = Math.max(0, Math.min(8, before + amount));
  s.friends[resident.id] = {
    resident,
    trust,
    visitedDay: previous?.visitedDay ?? 0,
    offeredDay: previous?.offeredDay ?? 0,
  };
  if (before < 4 && trust >= 4) {
    if (s.character.ideal === 'kindness') awardInspiration(s);
    note(
      s,
      [`${resident.name[0]}と友達になった。`, `You and ${resident.name[1]} become friends.`],
      'good',
    );
  }
}

function interact(s: Adventure, action: Extract<Action, { type: 'social' }>) {
  const id = action.id;
  if (action.verb === 'dismiss') {
    if (!s.followers.includes(id)) return false;
    s.followers = s.followers.filter((member) => member !== id);
    note(s, ['仲間は町で待つことになった。', 'Your companion will wait in town.']);
    return true;
  }
  const resident = residentsAt(s.location).find((person) => person.id === id);
  if (!resident || !residentPresent(resident, s.time)) return false;
  const role = RESIDENT_ROLES[resident.role],
    day = dayAt(s.time),
    friend = s.friends[id];
  if (action.verb === 'recruit') {
    if ((friend?.trust ?? 0) < 4 || s.followers.includes(id) || s.followers.length >= 2)
      return false;
    s.followers.push(id);
    note(
      s,
      [
        `${resident.name[0]}と一緒に旅をすることになった。`,
        `${resident.name[1]} joins your travels.`,
      ],
      'good',
    );
    return true;
  }
  if (action.verb === 'talk') {
    if (friend?.visitedDay === day) return false;
    addTrust(
      s,
      resident,
      1 + Number(s.character.calling === 'envoy') + Number(localBoon(s) === 'trust'),
    );
    s.friends[id].visitedDay = day;
    note(s, role.lines[Math.min(2, Math.floor(s.friends[id].trust / 3))]);
    advance(s, 1);
    return true;
  }
  if (friend?.offeredDay === day) return false;
  if (action.verb === 'gift') {
    if (!spendGoods(s, { [role.gift]: 1 })) return false;
    addTrust(s, resident, 2);
    note(
      s,
      [`${resident.name[0]}が贈り物を受け取った。`, `${resident.name[1]} accepts your gift.`],
      'good',
    );
    advance(s, 1);
  } else if (action.verb === 'assist') {
    const check = rollCheck(s, role.stat, 12);
    const amount = succeeded(check) ? 2 + Number(s.character.calling === 'envoy') : 1;
    addTrust(s, resident, amount);
    s.gold += 5 + (succeeded(check) ? 7 : 0);
    workCount(s);
    awardExperience(s, 6);
    note(
      s,
      [`${resident.name[0]}の仕事を手伝った。`, `You lend ${resident.name[1]} a hand.`],
      'good',
      check,
    );
    advance(s, 3);
  } else return false;
  s.friends[id].offeredDay = dayAt(s.time);
  return true;
}

export function missionProgress(s: Adventure, mission: ActiveMission) {
  switch (mission.kind) {
    case 'supply':
    case 'craft':
      return mission.good ? s.goods[mission.good] : 0;
    case 'delivery':
      return Number(sameAddress(mission.target, s.location));
    case 'service':
      return (s.townWork[addressKey(mission.from)] ?? 0) - mission.baseline;
    case 'guardian':
      return Number((s.deepest[addressKey(mission.from)] ?? 0) >= (mission.depth ?? 1));
    case 'survey':
      return s.floors[floorKey(mission.from, 1)]?.seen.length ?? 0;
  }
}
export const canClaimMission = (s: Adventure, mission: ActiveMission) =>
  sameAddress(mission.target, s.location) && missionProgress(s, mission) >= mission.goal;

export function claimMission(s: Adventure) {
  const mission = s.mission;
  if (!mission || !canClaimMission(s, mission)) return false;
  if (mission.good && !spendGoods(s, { [mission.good]: mission.goal })) return false;
  const coins =
    mission.reward + (s.character.calling === 'captain' && mission.kind === 'delivery' ? 10 : 0);
  s.gold += coins;
  s.counters.contracts++;
  s.fulfilled.unshift(mission.id);
  // The board only offers today's jobs, so completed jobs from past days need not be retained.
  s.fulfilled = s.fulfilled.filter((id) => id.includes('/board/' + dayAt(s.time) + '/'));
  s.mission = null;
  awardExperience(s, 12);
  awardInspiration(s);
  note(
    s,
    [`依頼を果たして${coins} Gを受け取った。`, `Commission complete. Earned ${coins} G.`],
    'good',
  );
  return true;
}

function build(s: Adventure, mode: Extract<Action, { type: 'build' }>['mode']) {
  const home = ownDwelling(s);
  if (mode === 'buy') {
    const price = homePrice(s);
    if (home || s.gold < price) return false;
    s.gold -= price;
    s.workshop[addressKey(s.location)] = { level: 1, planted: [] };
    note(
      s,
      [
        '庭付きの住まいを手に入れた。ゆっくり休める場所ができた。',
        'You buy a home with a garden. You have somewhere to settle and rest.',
      ],
      'good',
    );
  } else {
    if (!home) return false;
    if (mode === 'upgrade') {
      if (
        home.level >= 3 ||
        s.gold < home.level * 24 ||
        !spendGoods(s, { timber: home.level * 2, ore: 1 })
      )
        return false;
      s.gold -= home.level * 24;
      home.level++;
      advance(s, 3);
      note(s, ['作業場と庭を広げた。', 'You expand your garden and workshop.'], 'good');
    } else if (mode === 'plant') {
      if (home.planted.length >= home.level * 2 || !spendGoods(s, { seed: 1 })) return false;
      home.planted.push(s.time + 20);
      advance(s, 1);
      note(s, ['種をまいた。旅の間にも育つ。', 'You plant a seed. It grows while you travel.']);
    } else {
      const amount = nextHarvest(s);
      if (!amount) return false;
      home.planted = home.planted.filter((time) => time > s.time);
      s.goods.grain += amount * (home.level + 1 + Number(localBoon(s) === 'garden'));
      s.goods.herb += amount;
      s.goods.seed += amount;
      s.counters.harvests += amount;
      advance(s, 1);
      awardExperience(s, 3 * amount);
      note(s, [`${amount}区画を収穫した。`, `You harvest ${amount} garden plots.`], 'good');
    }
  }
  return true;
}

export function equipmentCost(s: Adventure, slot: Slot) {
  const ore = 3 - Number(s.character.calling === 'artisan') - Number(localBoon(s) === 'forge');
  return slot === 'weapon'
    ? { ore, timber: 1 }
    : slot === 'coat'
      ? { ore, thread: 2 }
      : { ore: ore - 1, relic: 1 };
}
function craft(s: Adventure, recipe: Good | Slot) {
  if (SLOT_IDS.some((slot) => slot === recipe)) {
    const slot = recipe as Slot;
    if (!spendGoods(s, equipmentCost(s, slot))) return false;
    advance(s, 3);
    forgeGear(
      s,
      s.level + (ownDwelling(s)?.level ?? 0),
      (ownDwelling(s)?.level ?? 0) >= 3 ? 2 : 1,
      slot,
    );
  } else {
    if (!Object.hasOwn(RECIPES, recipe)) return false;
    const entry = RECIPES[recipe as keyof typeof RECIPES];
    if (!spendGoods(s, entry.cost)) return false;
    s.goods[entry.good]++;
    advance(s, 1);
    note(
      s,
      [`${GOODS[entry.good].name[0]}を作った。`, `Made ${GOODS[entry.good].name[1]}.`],
      'good',
    );
  }
  s.counters.crafted++;
  awardExperience(s, 5);
  return true;
}

export function useSupply(s: Adventure, good: 'tonic' | 'lantern' | 'ration') {
  if (!(s.goods[good] > 0)) return false;
  const delve = s.delve;
  if (good === 'tonic') {
    if (s.hp >= maxHp(s)) return false;
    recover(s, 14 + s.level, 0);
  } else if (good === 'lantern') {
    if (!delve || delve.light >= 14) return false;
    delve.light = Math.min(18, delve.light + 12);
  } else {
    if (s.fatigue === 0 && s.focus === maxFocus(s) && s.hp === maxHp(s)) return false;
    s.fatigue = Math.max(0, s.fatigue - 3);
    recover(s, 5, 4);
  }
  s.goods[good]--;
  note(s, [`${GOODS[good].name[0]}を使った。`, `Used ${GOODS[good].name[1]}.`], 'good');
  return true;
}

export function declareInTown(s: Adventure, action: Extract<Action, { type: 'declare' }>) {
  const check = rollCheck(
    s,
    action.stat,
    11 + BIOMES[townAt(s.location).biome].risk,
    action.inspiration,
  );
  const success = succeeded(check);
  const money = success
    ? 11 + Number(check.outcome === 'critical') * 5
    : check.outcome === 'partial'
      ? 6
      : 2;
  const town = townAt(s.location);
  advance(s, 3);
  workCount(s);
  s.fatigue = Math.min(9, s.fatigue + 1);
  s.gold += money;
  if (success && action.stat === 'presence') {
    const listener = residentsAt(s.location).find(
      (resident) => resident.role === 'broker' && residentPresent(resident, s.time),
    );
    if (listener) addTrust(s, listener, 2);
  } else if (success && action.stat === 'insight') {
    s.goods.relic++;
  } else if (success && action.stat === 'finesse') {
    s.goods[BIOMES[town.biome].local]++;
  } else if (success) {
    s.goods.timber++;
  }
  awardExperience(s, success ? 8 : 4);
  note(
    s,
    [
      `「${action.statement}」を試みた。${money} Gの報酬を得た。`,
      `You attempt “${action.statement}” and earn ${money} G.`,
    ],
    success ? 'good' : 'risk',
    check,
  );
  return true;
}

export function applyTownAction(s: Adventure, action: Action): boolean {
  switch (action.type) {
    case 'tale': {
      const key = addressKey(s.location),
        day = dayAt(s.time);
      const previous = s.townTales[key];
      if (previous?.boon || previous?.day === day) return false;
      const option = TALES[townAt(s.location).biome].options[action.option];
      if (!option) return false;
      const check = rollCheck(
        s,
        option.stat,
        13 + BIOMES[townAt(s.location).biome].risk,
        false,
        s.exploredLandmarks[key] ? 2 : 0,
      );
      const signed = succeeded(check) || check.outcome === 'partial';
      s.townTales[key] = { day, ...(signed ? { boon: option.boon } : {}) };
      advance(s, 3);
      if (signed) {
        awardExperience(s, 14);
        note(s, option.resolution, 'good', check);
      } else {
        s.goods.herb++;
        note(
          s,
          [
            '今日は決着がつかなかった。次の日に別の案を試せる。',
            'The matter remains open. Try another approach tomorrow.',
          ],
          'risk',
          check,
        );
      }
      return true;
    }
    case 'travel': {
      if (!Number.isInteger(action.direction) || action.direction < 0 || action.direction >= 4)
        return false;
      const to = atOffset(s.location, action.direction);
      if (!Number.isSafeInteger(to.x) || !Number.isSafeInteger(to.y)) return false;
      const travel =
        2 +
        Number(isNight(s.time)) +
        Math.floor(BIOMES[townAt(to).biome].risk / 2) +
        Number(weatherIndexAt(to, s.time) === 1) -
        Number(localBoon(s) === 'roads');
      arrive(s, to, travel);
      return true;
    }
    case 'gate': {
      const world = worldCode(action.world);
      if (!world || world === s.location.world || world === '__proto__') return false;
      const found = Object.hasOwn(s.gates, world);
      const to = found ? s.gates[world] : { world, x: 0, y: 0 };
      s.gates[s.location.world] = s.location;
      s.gates[world] = to;
      if (s.character.ideal === 'freedom' && !found) awardInspiration(s);
      arrive(s, to, 4);
      return true;
    }
    case 'set-home':
      if (!ownDwelling(s) || sameAddress(s.homeGate, s.location)) return false;
      s.homeGate = s.location;
      note(s, ['この住まいを本拠地にした。', 'You make this dwelling your home base.'], 'good');
      return true;
    case 'return-home': {
      if (sameAddress(s.homeGate, s.location)) return false;
      const crossing = s.location.world !== s.homeGate.world;
      const distance =
        Math.abs(s.location.x - s.homeGate.x) + Math.abs(s.location.y - s.homeGate.y);
      if (crossing) s.gates[s.location.world] = s.location;
      arrive(s, s.homeGate, crossing ? 6 : Math.max(2, Math.min(12, distance + 1)));
      return true;
    }
    case 'life':
      return life(s, action.activity);
    case 'rest': {
      const rest = action.rest;
      if ((rest === 'home' && !ownDwelling(s)) || (rest === 'inn' && s.gold < 7)) return false;
      if (rest === 'inn') s.gold -= 7;
      if (rest !== 'bench') {
        advance(s, 8);
        s.fatigue = 0;
        recover(s, maxHp(s), maxFocus(s));
        if (s.character.calling === 'bard' && s.followers.length > 0) awardInspiration(s);
      } else {
        const hours = [2, 4, 8].includes(action.hours ?? 2) ? (action.hours ?? 2) : 2;
        advance(s, hours);
        s.fatigue = Math.max(0, s.fatigue - Math.ceil(hours / 2));
        recover(s, Math.ceil(hours * 1.5), Math.floor(hours / 2));
      }
      note(s, [`${hourAt(s.time)}時まで休んだ。`, `You rest until ${hourAt(s.time)}:00.`]);
      return true;
    }
    case 'trade': {
      if (!Object.hasOwn(GOODS, action.good)) return false;
      const price = marketPrice(s, action.good, action.sell);
      if (action.sell ? s.goods[action.good] <= 0 : s.gold < price) return false;
      s.gold += action.sell ? price : -price;
      s.goods[action.good] += action.sell ? -1 : 1;
      s.counters.trades++;
      const item = GOODS[action.good].name;
      note(s, [
        `${item[0]}を${price} Gで${action.sell ? '売った' : '買った'}。`,
        `${action.sell ? 'Sold' : 'Bought'} ${item[1]} for ${price} G.`,
      ]);
      return true;
    }
    case 'social':
      return interact(s, action);
    case 'build':
      return build(s, action.mode);
    case 'craft':
      return craft(s, action.recipe);
    case 'equip':
    case 'salvage':
    case 'sell-gear': {
      const gear = s.gear.find((item) => item.id === action.id);
      if (!gear) return false;
      if (action.type === 'equip') {
        s.equipment[gear.slot] = gear.id;
        adjustGearCaps(s);
      } else {
        if (s.equipment[gear.slot] === gear.id) return false;
        s.gear = s.gear.filter((item) => item.id !== gear.id);
        if (action.type === 'salvage') s.goods.ore += Math.ceil(gear.power / 2);
        else s.gold += gearValue(gear);
      }
      const name = gearName(gear);
      const words =
        action.type === 'equip'
          ? ['装備', 'Equipped']
          : action.type === 'salvage'
            ? ['分解', 'Salvaged']
            : ['売却', 'Sold'];
      note(s, [`${name[0]}を${words[0]}した。`, `${words[1]} ${name[1]}.`]);
      return true;
    }
    case 'train':
      if (!STAT_IDS.includes(action.stat) || s.talent <= 0 || s.character.stats[action.stat] >= 12)
        return false;
      s.talent--;
      s.character.stats[action.stat]++;
      return true;
    case 'use':
      return useSupply(s, action.good);
    case 'lesson':
      if (s.inspirationLessonDay === dayAt(s.time)) return false;
      s.inspirationLessonDay = dayAt(s.time);
      s.counters.lessons++;
      advance(s, 1);
      if (action.correct > 0) {
        awardInspiration(s);
        awardExperience(s, 8);
        note(
          s,
          ['学園の復習でひらめきを得た。', 'Reviewing your lessons gave you Inspiration.'],
          'good',
        );
      } else {
        awardExperience(s, 3);
        note(s, ['授業の復習をした。', 'You review your lessons.']);
      }
      return true;
    case 'mission': {
      if (s.mission || s.fulfilled.includes(action.id)) return false;
      const order = missionsAt(s.location, s.time).find((mission) => mission.id === action.id);
      if (!order) return false;
      s.mission = { ...order, baseline: s.townWork[addressKey(order.from)] ?? 0 };
      note(s, [`「${order.title[0]}」を引き受けた。`, `Accepted “${order.title[1]}”.`]);
      return true;
    }
    case 'claim-mission':
      return claimMission(s);
    case 'cancel-mission':
      if (!s.mission) return false;
      s.mission = null;
      return true;
    default:
      return false;
  }
}
