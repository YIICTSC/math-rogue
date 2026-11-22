import { TALES, type Boon } from './tales';
import { HOUSE_MATERIALS, MAX_HOME_LEVEL, buildImprovement, fabricate, hasImprovement } from './building';
import { relicPower, regionalMastery } from './journeyState';
import { seasonAt } from './journeyContent';
import { FOOD_GOODS, MEALS, mealEffect, mealRecipe, type MealId } from './provisions';
import { BOND_STORIES } from './bondStories';
import { alliesWith, changeStanding, standing } from './factions';
import { fieldCondition, fieldRecipeBonus, fieldSkill, travelLoad, twoHanded } from './frontierState';
import { surveySite } from './frontierWorld';
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
  MAX_LIGHT,
  MAX_PARTY_SIZE,
  missedMeals,
  awardExperience,
  awardInspiration,
  consumeFieldRecipe,
  equipped,
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
  roadBetween,
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
export const INN_MEAL_PRICE = 5;
export const activityHours = (s: Adventure, base: number) => base + Math.min(2, missedMeals(s));
export const ownDwelling = (s: Adventure) => s.workshop[addressKey(s.location)];
export const homePrice = (s: Adventure) => 45 + BIOMES[townAt(s.location).biome].risk * 7;
export const nextHarvest = (s: Adventure) =>
  ownDwelling(s)?.planted.filter((time) => s.time >= time).length ?? 0;

export function marketPrice(s: Adventure, good: Good, sell: boolean) {
  const region = townAt(s.location).biome;
  const biome = BIOMES[region];
  const favor = standing(s, region);
  const base =
    GOODS[good].price +
    (biome.local === good ? -2 : 0) +
    (FOOD_GOODS.includes(good) ? seasonAt(s.time).food : 0) +
    (hash(addressKey(s.location) + good + dayAt(s.time)) % 3);
  const tradeFriend = residentsAt(s.location).find((r) => r.role === 'broker');
  const discount = tradeFriend && (s.friends[tradeFriend.id]?.trust ?? 0) >= 4 ? 1 : 0;
  const buy = Math.max(2, base - discount - (localBoon(s) === 'trade' ? 2 : 0) -
    Number(favor >= 3) - Number(favor >= 7) + Number(favor <= -3));
  return sell ? Math.max(1, Math.min(buy - 1, Math.floor(base * 0.57))) : buy;
}

export function travelHours(s: Adventure, to: Address) {
  const road = roadBetween(s.location, to);
  return Math.max(1, activityHours(s,
    2 + road.hours + Number(isNight(s.time)) +
    seasonAt(s.time).travel -
    relicPower(s, 'coast') - mealEffect(s, 'travel') +
    Number(weatherIndexAt(to, s.time) === 1) -
    Number(localBoon(s) === 'roads') -
    Number(hasImprovement(s, 'watchtower')) - Number(alliesWith(s, townAt(s.location).biome)) + travelLoad(s) -
    Number(fieldSkill(s, 'wayfinding')) - Number(fieldCondition(s, 'wing')) - Number(fieldRecipeBonus(s, 'road')) * 2 + Number(fieldCondition(s, 'lost')) * 2));
}

function arrive(s: Adventure, to: Address, time: number, material?: Good) {
  const key = addressKey(to);
  const visited = Object.hasOwn(s.knownTowns, key);
  if (!visited && material) {
    s.goods[material]++;
    note(s, ['街道で' + GOODS[material].name[0] + 'を拾った。', 'You find ' + GOODS[material].name[1] + ' along the road.'], 'good');
  }
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
  advance(s, activityHours(s, hours));
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
    const season = seasonAt(s.time);
    const amount = 1 + Number(success) + Number(excellent) + Number(localBoon(s) === 'garden') +
      (activity === 'fish' ? season.fish : season.gather) + relicPower(s, 'grove') + mealEffect(s, 'gather') +
      Number(equipped(s, 'coat')?.masterwork === 'groveVest');
    s.goods[good] += amount;
    const extra = activity === 'gather' ? good === 'ore' ? 'timber' :
      hash(addressKey(s.location) + '/supply/' + dayAt(s.time)) % 2 ? 'timber' : 'ore' : undefined;
    if (extra) s.goods[extra] += 1 + Number(success);
    if (s.character.calling === 'naturalist') s.goods.herb++;
    if (activity === 'forage' && fieldSkill(s, 'herbalism')) s.goods.herb++;
    s.lastGather = { location: addressKey(s.location), time: s.time };
    note(
      s,
      [
        `${GOODS[good].name[0]}を${amount}手に入れた。${extra ? ' ' + GOODS[extra].name[0] + ' ×' + (1 + Number(success)) : ''}`,
        `Collected ${amount} × ${GOODS[good].name[1]}.${extra ? ' ' + GOODS[extra].name[1] + ' ×' + (1 + Number(success)) : ''}`,
      ],
      tone,
      check,
    );
  } else if (activity === 'survey') {
    const landmark = town.landmark;
    if (success) {
      s.exploredLandmarks[addressKey(s.location)] = true;
      s.counters.landmarks++;
      if (fieldSkill(s, 'wayfinding')) {
        const next = surveySite(s.location).sequel;
        s.frontier.rumors[addressKey(next)] = next;
      }
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
    ...previous,
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

export function residentStory(s: Adventure, resident: Resident) {
  const friend = s.friends[resident.id];
  const index = friend?.memories ?? 0;
  if (!friend || friend.trust < (index === 0 ? 2 : 5)) return undefined;
  return BOND_STORIES[resident.role][index];
}

function resolveBond(s: Adventure, action: Extract<Action, { type: 'bond' }>) {
  const resident = residentsAt(s.location).find((person) => person.id === action.id);
  if (!resident || (!s.followers.includes(resident.id) && !residentPresent(resident, s.time))) return false;
  const scene = residentStory(s, resident);
  const friend = s.friends[resident.id];
  const day = dayAt(s.time);
  if (!scene || friend.bondDay === day || !['give', 'talk'].includes(action.approach)) return false;
  if (action.approach === 'give' && !spendGoods(s, { [scene.item]: 1 })) return false;
  const check = action.approach === 'talk' ? rollCheck(s, scene.stat, 12 + (friend.memories ?? 0) * 2) : undefined;
  friend.bondDay = day;
  advance(s, 2);
  if (check && !succeeded(check) && check.outcome !== 'partial') {
    note(s, ['今日は答えを急がず、また会う約束をした。', 'You leave the question open and agree to meet again.'], 'story', check);
    return true;
  }
  friend.memories = (friend.memories ?? 0) + 1;
  addTrust(s, resident, 1);
  s.goods[scene.gift]++;
  awardExperience(s, 10);
  note(s, scene.ending, 'good', check);
  return true;
}

function interact(s: Adventure, action: Extract<Action, { type: 'social' }>) {
  const id = action.id;
  if (action.verb === 'dismiss') {
    if (!s.followers.includes(id)) return false;
    s.followers = s.followers.filter((member) => member !== id);
    delete s.frontier.orders[id];
    delete s.frontier.lent[id];
    note(s, ['仲間は町で待つことになった。', 'Your companion will wait in town.']);
    return true;
  }
  const resident = residentsAt(s.location).find((person) => person.id === id);
  if (!resident || (!s.followers.includes(id) && !residentPresent(resident, s.time))) return false;
  const role = RESIDENT_ROLES[resident.role],
    day = dayAt(s.time),
    friend = s.friends[id];
  if (action.verb === 'recruit') {
    if ((friend?.trust ?? 0) < 4 || s.followers.includes(id) || s.followers.length >= MAX_PARTY_SIZE - 1)
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
  changeStanding(s, townAt(mission.from).biome, 1);
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
  if (mode === 'buy' || mode === 'raise') {
    if (home) return false;
    if (mode === 'buy') {
      const price = homePrice(s);
      if (s.gold < price) return false;
      s.gold -= price;
    } else {
      if (!spendGoods(s, HOUSE_MATERIALS)) return false;
      advance(s, 5);
    }
    s.workshop[addressKey(s.location)] = { level: 1, planted: [] };
    note(
      s,
      [
        '庭付きの住まいができた。道具を備え、旅の拠点にしよう。',
        'You have a home with a garden. Equip it with useful facilities for your travels.',
      ],
      'good',
    );
  } else {
    if (!home) return false;
    if (mode === 'upgrade') {
      if (
        home.level >= MAX_HOME_LEVEL ||
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
      home.planted.push(s.time + (hasImprovement(s, 'greenhouse') ? 13 : 20));
      advance(s, 1);
      note(s, ['種をまいた。旅の間にも育つ。', 'You plant a seed. It grows while you travel.']);
    } else {
      const amount = nextHarvest(s);
      if (!amount) return false;
      home.planted = home.planted.filter((time) => time > s.time);
      s.goods.grain += amount * (home.level + 1 + Number(localBoon(s) === 'garden') + Number(hasImprovement(s, 'greenhouse')));
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
    s.goods[entry.good] += 1 + Number(entry.good === 'ration' && hasImprovement(s, 'larder'));
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

export const canEat = (s: Adventure) =>
  s.time - s.lastMealAt >= 8 || s.fatigue > 0 || s.hp < maxHp(s) || s.focus < maxFocus(s);

function eatMeal(s: Adventure, inn: boolean) {
  s.lastMealAt = s.time;
  s.fatigue = Math.max(0, s.fatigue - (inn ? 5 : 3));
  recover(s, inn ? 10 : 5, inn ? 6 : 4);
  note(s, inn
    ? ['宿で温かい食事を取った。', 'You eat a hot meal at the inn.', 'やどで あたたかい しょくじを とった。']
    : ['弁当を食べた。', 'You eat a packed meal.', 'べんとうを たべた。'], 'good');
}

export const knowsMeal = (s: Adventure, id: MealId) =>
  Object.hasOwn(MEALS, id) &&
  (townAt(s.location).biome === mealRecipe(id).biome || regionalMastery(s, mealRecipe(id).biome) > 0);

function cookDish(s: Adventure, id: MealId) {
  const count = s.journey.meals[id] ?? 0;
  if (!knowsMeal(s, id) || count >= 20 || !spendGoods(s, mealRecipe(id).cost)) return false;
  const recipe = mealRecipe(id);
  const portions = Math.min(20 - count, 1 + Number(hasImprovement(s, 'kitchen')) + Number(hasImprovement(s, 'smokehouse')));
  s.journey.meals[id] = count + portions;
  s.counters.crafted++;
  advance(s, 1);
  note(s, [recipe.name[0] + 'を' + portions + '食作った。', 'Prepared ' + portions + ' portions of ' + recipe.name[1] + '.'], 'good');
  return true;
}

export function eatDish(s: Adventure, id: MealId) {
  if (!Object.hasOwn(MEALS, id) || !(s.journey.meals[id] > 0) || !canEat(s)) return false;
  const recipe = mealRecipe(id);
  s.journey.meals[id]--;
  if (!s.journey.tasted.includes(id)) s.journey.tasted.push(id);
  s.journey.meal = { id, until: s.time + recipe.hours };
  eatMeal(s, false);
  note(s, [recipe.name[0] + 'を食べた。' + recipe.benefit[0] + '。', 'Ate ' + recipe.name[1] + '. ' + recipe.benefit[1] + '.'], 'good');
  return true;
}

export function useSupply(s: Adventure, good: Extract<Action, { type: 'use' }>['good']) {
  if (!(s.goods[good] > 0)) return false;
  const delve = s.delve;
  if (good === 'ration') {
    if (!canEat(s)) return false;
    s.goods.ration--;
    eatMeal(s, false);
    return true;
  }
  if (good === 'tonic' || good === 'strongTonic') {
    if (missedMeals(s) >= 2 || (s.hp >= maxHp(s) && (good === 'tonic' || s.focus >= maxFocus(s)))) return false;
    recover(s, (good === 'tonic' ? 14 : 24) + s.level, good === 'tonic' ? 0 : 5);
  } else if (good === 'lantern') {
    if (!delve || delve.light >= 14) return false;
    delve.light = Math.min(MAX_LIGHT, delve.light + 12);
  } else if (good === 'fieldKit') {
    if (!delve || delve.encounter || missedMeals(s) >= 2) return false;
    advance(s, 1);
    delve.light = Math.min(MAX_LIGHT, delve.light + 3);
    recover(s, 10, 5);
    s.fatigue = Math.max(0, s.fatigue - 3);
  } else return false;
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
    case 'cook-dish':
      return cookDish(s, action.id);
    case 'eat-dish':
      return eatDish(s, action.id);
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
      const time = travelHours(s, to);
      consumeFieldRecipe(s, 'road');
      const poorVisibility = s.frontier.rules.weather && isNight(s.time) && weatherIndexAt(to, s.time) === 1 && !fieldSkill(s, 'wayfinding');
      arrive(s, to, time, roadBetween(s.location, to).material);
      if (poorVisibility && s.hp > 0) {
        s.frontier.conditions.lost = s.time + 6;
        note(s, ['夜の雨で目印を見失った。方角を確かめられる。', 'The rain hides the landmarks. You can reorient yourself.'], 'risk');
      }
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
    case 'inn-meal':
      if (s.gold < INN_MEAL_PRICE || !canEat(s)) return false;
      s.gold -= INN_MEAL_PRICE;
      eatMeal(s, true);
      advance(s, 1);
      return true;
    case 'rest': {
      const rest = action.rest;
      if ((rest === 'home' && !ownDwelling(s)) || (rest === 'inn' && s.gold < 7)) return false;
      if (rest === 'inn') s.gold -= 7;
      if (rest !== 'bench') {
        advance(s, 8);
        s.frontier.hydration = s.time;
        s.frontier.injuries = {};
        delete s.frontier.conditions.spore;
        s.fatigue = 0;
        recover(s, maxHp(s), maxFocus(s));
        if ((rest === 'home' && hasImprovement(s, 'shrine')) || (s.character.calling === 'bard' && s.followers.length > 0)) awardInspiration(s);
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
    case 'bond':
      return resolveBond(s, action);
    case 'build':
      return build(s, action.mode);
    case 'craft':
      return craft(s, action.recipe);
    case 'fabricate':
      return fabricate(s, action.recipe);
    case 'build-improvement':
      return buildImprovement(s, action.improvement);
    case 'equip':
    case 'salvage':
    case 'sell-gear': {
      const gear = s.gear.find((item) => item.id === action.id);
      if (!gear || Object.values(s.frontier.lent).includes(gear.id)) return false;
      if (action.type === 'equip') {
        if (gear.slot === 'weapon' && (s.frontier.offhand === gear.id || twoHanded(gear.weapon))) s.frontier.offhand = null;
        s.equipment[gear.slot] = gear.id;
        adjustGearCaps(s);
      } else {
        if (s.equipment[gear.slot] === gear.id || s.frontier.offhand === gear.id) return false;
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
