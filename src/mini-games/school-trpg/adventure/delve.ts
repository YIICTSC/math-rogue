import {
  BIOMES,
  FOES,
  GOODS,
  WEAPONS,
  regionalWardenIndex,
  type DamageType,
  type Good,
  type Intent,
  type Stat,
  type Text,
  type Weapon,
} from './content';
import { foePoint, heroPoint, hurtFoe, partyPoint, type BattleArt, type BattleEvent } from './battleFeedback';
import { actingPoint, applyManeuvers } from './battleManeuvers';
import { TECHNIQUES, techniqueFor, techniqueReady, trainWeapon, type TechniqueId } from './battleTechniques';
import { forgeGear } from './inventory';
import { eatDish, useSupply } from './life';
import { companionParameters, companionTurn, formParty, targetOfEnemy } from './party';
import { expeditionThreat } from './expeditions';
import { changeStanding, standing } from './factions';
import { applyField, findDevice } from './frontierActions';
import type { BodyZone } from './frontierContent';
import { alertLevel, fieldCondition, fieldSkill } from './frontierState';
import { fieldFloor, fieldHazard, plannedWalk, surveySite, terrainAt } from './frontierWorld';
import {
  approachParty, borrowedCreature, canTacticalStep, coverBonus, enemyCanHit, partyAt,
  partyPositions, startTactics, tacticalTarget,
} from './fieldTactics';
import { bestiaryRecord, relicPower } from './journeyState';
import { mealEffect } from './provisions';
import { ruinCondition } from './ruinConditions';
import { applyRuinAction, circuitEffects } from './ruinSystems';
import {
  advance,
  armor,
  consumeFieldRecipe,
  awardExperience,
  awardInspiration,
  equipped,
  finishDefeat,
  MAX_LIGHT,
  MAX_PARTY_SIZE,
  maxHp,
  missedMeals,
  nextRandom,
  note,
  recover,
  rollCheck,
  scoreFor,
  succeeded,
  type Action,
  type Adventure,
  type Check,
  type CombatMove,
  type Delve,
  type DungeonRecord,
  type Encounter,
  type Enemy,
} from './state';
import {
  ENTRY_CELL,
  addressKey,
  floorKey,
  hash,
  neighbor,
  townAt,
  type Feature,
  type Floor,
} from './world';

export const RUNES: readonly Text[] = [
  ['月', 'Moon'],
  ['星', 'Star'],
  ['灯火', 'Flame'],
];
const RUNE_CLUES: Text[] = [
  ['欠けても、また丸くなる。', 'Though I wane, I become whole again.'],
  ['夜の空で、方角を教える。', 'I guide travelers from the night sky.'],
  ['息を送ると明るく踊る。', 'Give me breath and I dance brighter.'],
];

const CORE_MOVES = {
  strike: {
    name: ['通常攻撃', 'Strike', 'こうげき'],
    hint: [
      '装備した武器で攻撃。集中は使わない。',
      'Attack with your weapon without spending Focus.',
    ],
    cost: 0,
  },
  heavy: {
    name: ['崩しの一撃', 'Break guard'],
    hint: [
      '守りを崩す大技。連携を消費して威力を上げる。',
      'Crack a guard and spend your combo for bonus damage.',
    ],
    cost: 2,
  },
  quick: {
    name: ['風切り', 'Windcut'],
    hint: ['風属性の先制技。大技を止める。', 'A wind attack that can interrupt a windup.'],
    cost: 1,
  },
  spark: {
    name: ['星灯の術', 'Starlight'],
    hint: ['術属性。鋼に強い敵に有効。', 'Arcane damage against steel-resistant foes.'],
    cost: 2,
  },
  guard: {
    name: ['防御・反撃', 'Guard and counter'],
    hint: [
      '被ダメージを抑え、大技に反撃。集中も回復。',
      'Reduce incoming damage, counter heavy attacks, and restore Focus.',
    ],
    cost: 0,
  },
  study: {
    name: ['弱点を見抜く', 'Read weakness'],
    hint: [
      '弱点を公開し、次の交渉を有利にする。',
      'Reveal weaknesses and improve your next parley.',
    ],
    cost: 0,
  },
  parley: {
    name: ['交渉する', 'Parley'],
    hint: [
      '相手のことを知るほど有利。通してもらえれば戦闘を終える。',
      'Knowledge helps. If they agree, the conflict ends.',
    ],
    cost: 0,
  },
  befriend: {
    name: ['水を分けて勧誘', 'Offer water and recruit', 'みずを わけて さそう'],
    hint: ['名のある魔物に澄み水を2つ渡し、仲間になるよう提案する。', 'Offer two units of clear water to invite a named creature.'],
    cost: 0,
  },
  retreat: {
    name: ['入口へ退く', 'Retreat to entrance'],
    hint: [
      '地下の入口に撤退。3ターン目からは確実に離脱。',
      'Fall back to the entrance. Guaranteed on turn three or later.',
    ],
    cost: 0,
  },
} satisfies Record<Exclude<CombatMove, TechniqueId>, { name: Text; hint: Text; cost: number }>;

export const COMBAT_MOVES = { ...CORE_MOVES, ...TECHNIQUES };

const WEAPON_ART: Record<Weapon, BattleArt> = {
  sabre: 'slash', knife: 'thrust', wand: 'arcane', hammer: 'crush',
  spear: 'thrust', bow: 'arrow', staff: 'arcane',
};
const INTENT_ART = { strike: 'slash', heavy: 'crush', hex: 'arcane', drain: 'shock' } as const;

export const damageNames = {
  steel: ['鋼', 'Steel'],
  arcane: ['術', 'Arcane'],
  wind: ['風', 'Wind'],
} satisfies Record<DamageType, Text>;
export const foeIntent = (encounter: Encounter, enemy: Enemy): Intent => {
  const moves = FOES[enemy.template].pattern;
  return moves[(encounter.turn - 1 + enemy.pattern) % moves.length];
};

export function recordFor(s: Adventure, depth: number): DungeonRecord {
  return s.floors[floorKey(s.location, depth)] ?? { seen: [], cleared: [], inspected: [] };
}
const currentFloor = (s: Adventure) => fieldFloor(s);
const currentRecord = (s: Adventure) => recordFor(s, s.delve!.floor);
export const runeClue = (floor: Floor) => RUNE_CLUES[floor.answer];
function mapCell(s: Adventure) {
  const d = s.delve!;
  const key = floorKey(s.location, d.floor);
  const record = (s.floors[key] ??= { seen: [], cleared: [], inspected: [] });
  if (!record.seen.includes(d.cell)) record.seen.push(d.cell);
  return record;
}
const secured = (s: Adventure, cell: number) => currentRecord(s).cleared.includes(cell);
function clearFeature(s: Adventure, cell = s.delve!.cell) {
  const record = currentRecord(s);
  if (!record.cleared.includes(cell)) record.cleared.push(cell);
}
const squareRootTier = (floor: number) => Math.floor(Math.sqrt(floor - 1));
function setFloor(s: Adventure, floor: number) {
  const d = s.delve!;
  d.floor = floor;
  d.cell = ENTRY_CELL;
  d.previous = null;
  d.direction = 1;
  d.encounter = null;
  mapCell(s);
}
function enter(s: Adventure, floor = 1) {
  const last = s.deepest[addressKey(s.location)] ?? 0;
  if (!Number.isSafeInteger(floor) || floor < 1 || floor > last + 1 || s.delve) return false;
  s.delve = {
    floor,
    cell: ENTRY_CELL,
    previous: null,
    direction: 1,
    light: Math.min(MAX_LIGHT, 16 + relicPower(s, 'sky') * 2 + mealEffect(s, 'light')),
    threat: 0,
    encounter: null,
  };
  mapCell(s);
  note(s, [`灯りを持って地下${floor}階へ入った。`, `You enter floor ${floor} with your lamp lit.`]);
  return true;
}
export function delveDestination(s: Adventure, floor: Floor, backwards = false) {
  const d = s.delve!;
  const next = neighbor(d.cell, (d.direction + (backwards ? 2 : 0)) % 4);
  if (!floor.open.has(next)) return -1;
  const feature = floor.features[d.cell];
  if ((feature === 'runes' || feature === 'trap') && !secured(s, d.cell) && next !== d.previous)
    return -1;
  return next;
}
function startEncounter(s: Adventure, guardian: boolean, bound: boolean) {
  const d = s.delve!;
  const biome = townAt(s.location).biome;
  const options = FOES.flatMap((enemy, index) =>
    enemy.theme === biome && !enemy.warden && (!enemy.artKey || d.floor >= 2 || s.level >= 3)
      ? [index] : [],
  );
  const tier = squareRootTier(d.floor);
  const risk = BIOMES[biome].risk;
  const threat = expeditionThreat(s);
  const patrol = ruinCondition(s.location, d.floor).patrol + (circuitEffects(s).patrol ?? 0);
  const resonance = alertLevel(s);
  const baseCount = bound && (d.floor >= 3 || s.followers.length >= 3)
    ? 1 + nextRandom(s, d.floor >= 9 || s.followers.length >= 4 ? 3 : 2)
    : 1;
  const count = guardian ? 1 : Math.max(1, Math.min(4, baseCount + patrol + Number(threat >= 4) + Number(resonance >= 8)));
  const enemies = Array.from({ length: count }, (_, i): Enemy => {
    const template = guardian ? regionalWardenIndex(biome) : options[nextRandom(s, options.length)];
    const base = FOES[template];
    const scale = tier * (guardian ? 8 : 5) + threat * 2;
    const hp = base.hp + scale + risk * (guardian ? 3 : 2);
    const named = !guardian && i === 0 && (resonance >= 8 || (d.floor >= 2 && hash(floorKey(s.location, d.floor) + '/' + d.cell) % 4 === 0));
    bestiaryRecord(s, template).encounters++;
    return {
      template,
      hp,
      max: hp,
      power: base.attack + tier + Math.floor(risk / 2) + Math.floor(threat / 2),
      pattern: guardian ? 0 : (i + nextRandom(s, base.pattern.length)) % base.pattern.length,
      stagger: false,
      known: (s.journey.bestiary[template]?.victories ?? 0) + (s.journey.bestiary[template]?.accords ?? 0) >= 3,
      ...(named ? { epithets: [`${base.name[0]}・灯影の導き手`, `${base.name[1]}, guide of the dim light`] as Text } : {}),
    };
  });
  d.encounter = {
    guardian,
    bound,
    cell: d.cell,
    turn: 1,
    enemies,
    allies: formParty(s),
    combo: 0,
    guard: false,
    surprise: !bound,
    ...(s.frontier.rules.tactical ? { tactics: startTactics(s, enemies.length) } : {}),
  };
  if (d.encounter.tactics) d.encounter.tactics.party = partyPositions(s, d.encounter);
  note(
    s,
    [
      guardian
        ? '境界の守護者が道をふさいだ。'
        : bound
          ? '魔物と対峙した。'
          : '闇の中から魔物が飛び出した。',
      guardian
        ? 'A warden bars the passage.'
        : bound
          ? 'You face the creatures.'
          : 'A creature leaps out of the darkness.',
    ],
    'risk',
  );
}
const takeHit = (s: Adventure, damage: number) => {
  s.hp = Math.max(0, s.hp - damage);
};
function step(s: Adventure, d: Delve, direction: Extract<Action, { type: 'move' }>['direction']) {
  if (direction === 'left' || direction === 'right') {
    d.direction = (d.direction + (direction === 'left' ? 3 : 1)) % 4;
    return true;
  }
  const floor = currentFloor(s);
  const next = delveDestination(s, floor, direction === 'backward');
  if (next < 0) return false;
  const record = currentRecord(s);
  const explored = record.seen.includes(next);
  d.previous = d.cell;
  d.cell = next;
  mapCell(s);
  d.threat++;
  const effects = circuitEffects(s);
  if (s.character.calling !== 'scout' || d.threat % 2 === 0) {
    const oil = Math.max(0, 1 + ruinCondition(s.location, d.floor).light + (effects.light ?? 0));
    d.light = Math.max(0, d.light - oil);
  }
  const exposure = fieldHazard(s, next, d.floor, floor);
  if (exposure) note(s, exposure, 'risk');
  if (d.threat % (missedMeals(s) >= 2 ? 2 : 3) === 0) advance(s, 1);
  if (finishDefeat(s)) return true;
  if (d.threat % 7 === 0) s.fatigue = Math.min(9, s.fatigue + 1);
  const feature = floor.features[next];
  if (
    (alertLevel(s) >= 8 || (d.light === 0 && s.frontier.run !== 'wander')) &&
    d.threat % (alertLevel(s) >= 8 ? 6 : 9 - (effects.patrol ?? 0) * 2) === 0 &&
    next !== ENTRY_CELL &&
    (!feature || secured(s, next))
  ) {
    startEncounter(s, false, false);
  } else if (feature && !explored && !secured(s, next)) {
    note(s, ['足を止め、周囲を確かめた。', 'You pause to look around.']);
  }
  return true;
}

function findTreasure(s: Adventure, d: Delve, check?: Check) {
  const coins = 6 + squareRootTier(d.floor) * 3 + nextRandom(s, 7);
  const shards = Math.max(0, 1 + ruinCondition(s.location, d.floor).caches + (circuitEffects(s).shards ?? 0));
  s.gold += coins;
  s.goods.relic += shards;
  findDevice(s, floorKey(s.location, d.floor) + '/chest/' + d.cell, 45);
  if (nextRandom(s, 100) < 80 || check?.outcome === 'critical')
    forgeGear(s, d.floor, check?.outcome === 'critical' ? 2 : 0);
  else s.goods.lantern++;
  awardExperience(s, 6);
  note(
    s,
    [`宝箱から${coins} Gと遺物片×${shards}を得た。`, `The chest held ${coins} G and ${shards} relic shards.`],
    'good',
    check,
  );
}
function succeedRoom(s: Adventure, feature: Feature, check: Check) {
  clearFeature(s);
  if (feature === 'cache') findTreasure(s, s.delve!, check);
  else if (feature === 'vein') {
    s.goods.ore += 2;
    s.goods[BIOMES[townAt(s.location).biome].local]++;
    note(
      s,
      [
        '採取場の奥から素材を持ち帰った。',
        'You recover materials from the deepest part of the vein.',
      ],
      'good',
      check,
    );
  } else if (feature === 'pack' || feature === 'guardian') {
    startEncounter(s, feature === 'guardian', true);
    completeEncounter(
      s,
      feature === 'guardian' && check.stat === 'presence' ? 'parley' : 'bypass',
      check,
    );
  } else {
    awardExperience(s, 6);
    note(
      s,
      ['目の前の障害を切り抜けた。', 'You clear the obstacle in front of you.'],
      'good',
      check,
    );
  }
}
function featureAction(s: Adventure, d: Delve, action: Extract<Action, { type: 'feature' }>) {
  const floor = currentFloor(s);
  const type = floor.features[d.cell];
  if (action.verb === 'ascend') {
    if (d.cell !== ENTRY_CELL || d.floor <= 1) return false;
    setFloor(s, d.floor - 1);
    return true;
  }
  if (!type) return false;
  if (action.verb === 'descend') {
    if (type !== 'stairs' || !secured(s, floor.seal)) return false;
    setFloor(s, d.floor + 1);
    awardInspiration(s);
    return true;
  }
  if (secured(s, d.cell)) return false;
  if (action.verb === 'confront' && (type === 'pack' || type === 'guardian')) {
    startEncounter(s, type === 'guardian', true);
    return true;
  }
  if (action.verb === 'inspect') {
    const record = currentRecord(s);
    if (record.inspected.includes(d.cell)) return false;
    record.inspected.push(d.cell);
    if (type === 'runes') note(s, runeClue(floor));
    else
      note(s, [
        '足跡や小さな傷を見つけた。次の判定に手がかりを使える。',
        'You study tracks and scratches. The clues improve your next check here.',
      ]);
    return true;
  }
  if (action.verb === 'meditate' && type === 'sanctum') {
    recover(s, 11 + ruinCondition(s.location, d.floor).rest, 6);
    awardInspiration(s);
    advance(s, 2);
    clearFeature(s);
    note(s, ['祭壇でひと息ついた。', 'You take a moment to recover at the altar.'], 'good');
    return true;
  }
  if (action.verb === 'harvest' && type === 'vein') {
    s.goods[BIOMES[townAt(s.location).biome].local] += 2;
    s.goods.ore++;
    clearFeature(s);
    awardExperience(s, 4);
    note(s, ['探索に役立つ素材を採った。', 'Collected useful crafting materials.'], 'good');
    return true;
  }
  if (action.verb === 'open' && type === 'cache') {
    clearFeature(s);
    findTreasure(s, d);
    return true;
  }
  if (action.verb === 'open' && type === 'runes' && action.symbol !== undefined) {
    if (!Number.isInteger(action.symbol) || action.symbol < 0 || action.symbol >= RUNES.length)
      return false;
    if (action.symbol === floor.answer) {
      clearFeature(s);
      awardExperience(s, 8);
      awardInspiration(s);
      note(s, ['紋章が光り、扉が開いた。', 'The rune lights up and the door opens.'], 'good');
    } else {
      takeHit(s, 3);
      note(
        s,
        [
          '違う紋章だった。扉の閃光で3ダメージ。',
          'Wrong rune. A flash from the door deals 3 damage.',
        ],
        'risk',
      );
      finishDefeat(s);
    }
    return true;
  }
  const stat: Stat = action.verb === 'force' ? 'might' : 'finesse';
  const canPass =
    ((action.verb === 'pick' || action.verb === 'force') &&
      (type === 'runes' || type === 'trap')) ||
    (action.verb === 'sneak' && type === 'pack');
  if (!canPass) return false;
  const check = rollCheck(
    s,
    stat,
    (type === 'trap' ? 11 : 12) + squareRootTier(d.floor) + ruinCondition(s.location, d.floor).checks + (circuitEffects(s).checks ?? 0),
    false,
    currentRecord(s).inspected.includes(d.cell) ? 2 : 0,
  );
  if (succeeded(check)) succeedRoom(s, type, check);
  else if (type === 'pack') {
    note(
      s,
      ['足音を聞かれて魔物に気づかれた。', 'The creatures hear your footsteps.'],
      'risk',
      check,
    );
    startEncounter(s, false, true);
  } else {
    takeHit(s, check.outcome === 'partial' ? 1 : 4);
    if (type === 'trap') clearFeature(s);
    note(
      s,
      [
        type === 'trap'
          ? '仕掛けが作動し、体力を失った。'
          : '扉は開かなかった。衝撃で体力を失った。',
        type === 'trap'
          ? 'The trap goes off and you lose HP.'
          : 'The door holds. The jolt costs you HP.',
      ],
      'risk',
      check,
    );
    finishDefeat(s);
  }
  return true;
}

function completeEncounter(s: Adventure, method: 'fight' | 'parley' | 'bypass', check?: Check) {
  const d = s.delve!,
    battle = d.encounter!;
  if (battle.bound) clearFeature(s, battle.cell);
  let loot: Text | undefined;
  if (method === 'fight') {
    s.counters.combats++;
    const weapon = equipped(s, 'weapon')?.weapon;
    if (weapon) trainWeapon(s, weapon, 2);
    const material = ({ academy: 'thread', grove: 'timber', coast: 'ore', alpine: 'ore', ember: 'ore', sky: 'thread' } as const)[townAt(s.location).biome];
    const food: Good = townAt(s.location).biome === 'coast' ? 'fish' : 'meat';
    const amount = battle.enemies.length;
    s.goods[food] += amount;
    s.goods[material] += amount + Number(battle.guardian);
    const bonusFinds = new Map<Good, number>();
    for (const enemy of battle.enemies) {
      const good = FOES[enemy.template].harvest;
      if (good) {
        s.goods[good]++;
        bonusFinds.set(good, (bonusFinds.get(good) ?? 0) + 1);
      }
    }
    const materialCount = amount + Number(battle.guardian);
    loot = [
      GOODS[food].name[0] + ' ×' + amount + '、' + GOODS[material].name[0] + ' ×' + materialCount +
        [...bonusFinds].map(([good, count]) => '、' + GOODS[good].name[0] + ' ×' + count).join(''),
      GOODS[food].name[1] + ' ×' + amount + ', ' + GOODS[material].name[1] + ' ×' + materialCount +
        [...bonusFinds].map(([good, count]) => ', ' + GOODS[good].name[1] + ' ×' + count).join(''),
    ];
  }
  if (method === 'parley') s.counters.pacified++;
  if (battle.enemies.some((enemy) => enemy.epithets) && method !== 'bypass') {
    const group = townAt(s.location).biome;
    changeStanding(s, group, method === 'parley' ? 1 : -1);
    if (method === 'parley') {
      const next = surveySite(s.location).sequel;
      s.frontier.rumors[addressKey(next)] = next;
    }
  }
  if (method !== 'bypass') for (const enemy of battle.enemies) {
    const record = bestiaryRecord(s, enemy.template);
    if (method === 'fight') record.victories++;
    else record.accords++;
    // A saved encounter can predate the bestiary.
    record.encounters = Math.max(record.encounters, record.victories + record.accords);
  }
  if (battle.guardian) {
    const key = addressKey(s.location);
    if ((s.deepest[key] ?? 0) < d.floor) {
      s.deepest[key] = d.floor;
      s.counters.guardians++;
      if (method !== 'bypass') changeStanding(s, townAt(s.location).biome, method === 'parley' ? 2 : -1);
    }
    if (s.character.ideal === 'ambition') awardInspiration(s);
    s.goods.relic += 2;
  }
  const scale = squareRootTier(d.floor);
  const coins =
    (battle.guardian ? 22 : 6) + 4 * scale + battle.enemies.length * (method === 'bypass' ? 0 : 3);
  s.gold += coins;
  if (battle.guardian || (method === 'fight' && nextRandom(s, 100) < (battle.bound ? 70 : 22))) {
    forgeGear(s, d.floor, battle.guardian ? (method === 'fight' ? 2 : 1) : 0);
  }
  s.goods.herb += Number(method === 'parley');
  recover(s, 0, 2);
  const phrases =
    method === 'fight'
      ? ['敵を退けた。', 'You defeat the enemies.']
      : method === 'parley'
        ? [
            '交渉がまとまり、道を譲ってもらった。',
            'You reach an agreement and are allowed through.',
          ]
        : ['気づかれずに危険を抜けた。', 'You slip past the danger.'];
  note(s, [
    phrases[0] + ' ' + coins + ' G' + (loot ? ' · ' + loot[0] : ''),
    phrases[1] + ' ' + coins + ' G' + (loot ? ' · ' + loot[1] : ''),
  ], 'good', check);
  awardExperience(s, battle.guardian ? 21 + scale * 2 : 8 + battle.enemies.length * 3);
  d.encounter = null;
}

function escape(s: Adventure) {
  const d = s.delve!;
  setFloor(s, d.floor);
  advance(s, 2);
  note(s, [
    '階段の前まで退いた。調査した場所は見取り図に残っている。',
    'You retreat to the stairwell. Your map still shows where you explored.',
  ]);
}
function enemyRound(s: Adventure, d: Delve, battle: Encounter, events?: BattleEvent[]) {
  let damageTaken = 0;
  let allyDamage = 0;
  let counterDamage = 0;
  const floor = battle.tactics ? currentFloor(s) : null;
  const linked = borrowedCreature(battle);
  for (const [index, enemy] of battle.enemies.entries()) {
    if (enemy.hp <= 0) continue;
    if (floor && battle.tactics) {
      const terrain = terrainAt(s, battle.tactics.cells[index], d.floor, floor);
      const hazard = terrain === 'fire' ? 5 : terrain === 'wire' ? 3 : terrain === 'heat' ? 2 : 0;
      if (hazard) {
        const lost = hurtFoe(battle, index, hazard, terrain === 'wire' ? 'shock' : 'fire', foePoint(battle, index), events);
        note(s, ['足元の危険で魔物に' + lost + 'ダメージ。', 'A terrain hazard deals ' + lost + ' damage to the creature.'], 'good');
      }
      if (terrain === 'wire' && battle.turn % 2 === 1) enemy.stagger = true;
    }
    if (enemy.hp <= 0 || linked === index) continue;
    if (enemy.stagger) {
      enemy.stagger = false;
      continue;
    }
    const intent = foeIntent(battle, enemy);
    const from = foePoint(battle, index);
    if (intent === 'mend') {
      const before = enemy.hp;
      enemy.hp = Math.min(enemy.max, enemy.hp + 3 + Math.floor(enemy.power / 4));
      if (enemy.hp > before) events?.push({ art: 'heal', from, to: from, outcome: 'power', hp: enemy.hp - before });
      continue;
    }
    if (intent === 'brace') continue;
    const heroInReach = !floor || enemyCanHit(battle, index, intent, d.cell, floor);
    const ally = targetOfEnemy(s, battle, (id) => {
      const cell = battle.tactics?.party?.[id];
      return !floor || (cell !== undefined && enemyCanHit(battle, index, intent, cell, floor));
    }, heroInReach);
    if (floor && !heroInReach && !ally) {
      approachParty(s, battle, index, floor);
      const to = foePoint(battle, index);
      if (to.cell !== from.cell) events?.push({ art: 'wind', from, to, outcome: 'move' });
      continue;
    }
    if (floor && !ally && nextRandom(s, 20) + Math.floor(enemy.power / 3) < 2 + coverBonus(s, floor)) {
      note(s, ['物陰で攻撃をかわした。', 'Cover helps you evade the attack.']);
      events?.push({ art: INTENT_ART[intent], from, to: heroPoint(s), outcome: 'miss' });
      continue;
    }
    const guarded = battle.guard || battle.tideWard || Boolean(ally?.braced);
    if (!ally && intent === 'hex' && !guarded) s.focus = Math.max(0, s.focus - 2);
    if (intent === 'drain') d.light = Math.max(0, d.light - (guarded ? 1 : 3));
    const frostguard = !ally && intent === 'heavy' && equipped(s, 'coat')?.masterwork === 'rimeCoat';
    const protection = (ally
      ? companionParameters(s, ally.id, s.friends[ally.id].resident.role).defense
      : armor(s)) + (battle.tideWard ? 5 : battle.guard ? 3 : 0) + (ally?.braced ? 2 : 0) + (frostguard ? 3 : 0);
    const attack =
      enemy.power +
      (intent === 'heavy' ? 4 : 0) -
      (intent === 'strike' ? 0 : 1) +
      Number(battle.surprise && battle.turn === 1);
    const formation = s.journey.formation === 'rush' ? 2 : s.journey.formation === 'shelter' ? -2 : 0;
    const damage = Math.max(1, attack - protection + formation);
    const lost = Math.min(ally?.hp ?? s.hp, damage);
    events?.push({
      art: INTENT_ART[intent], from, to: ally ? partyPoint(battle, ally.id) : heroPoint(s),
      outcome: guarded ? 'block' : 'hit', hp: -lost,
    });
    if (ally) {
      ally.hp -= lost;
      allyDamage += lost;
    } else {
      takeHit(s, damage);
      damageTaken += lost;
      if (floor && !guarded && damage >= 4 && (intent === 'heavy' || intent === 'hex')) {
        const zone: BodyZone = intent === 'hex' ? 'head' : (battle.turn + index) % 2 ? 'grip' : 'feet';
        s.frontier.injuries[zone] = Math.max(s.frontier.injuries[zone] ?? 0, s.time + 8);
      }
    }
    if (!ally && battle.riposte && s.hp > 0) {
      battle.riposte = false;
      counterDamage += hurtFoe(battle, index, 3 + scoreFor(s, 'finesse'), 'riposte', heroPoint(s), events);
    } else if (intent === 'heavy' && battle.guard && s.journey.formation !== 'envoy') {
      const strength = 2 + scoreFor(s, 'might') + (s.character.calling === 'vanguard' ? 3 : 0);
      counterDamage += hurtFoe(battle, index, strength, 'crush', heroPoint(s), events);
    }
    if (s.hp <= 0) break;
  }
  if (damageTaken > 0 && consumeFieldRecipe(s, 'hit')) recover(s, 7, 2);
  if (damageTaken || allyDamage) {
    const counter = counterDamage
      ? [` 反撃 ${counterDamage}。`, ` Countered for ${counterDamage}.`]
      : ['', ''];
    note(
      s,
      [
        '敵の反撃。主人公 ' + damageTaken + '、仲間 ' + allyDamage + ' ダメージ。' + counter[0],
        'Enemy response: hero ' + damageTaken + ', allies ' + allyDamage + ' damage.' + counter[1],
      ],
      'risk',
    );
  }
  if (finishDefeat(s)) return;
  if (battle.enemies.every((enemy) => enemy.hp <= 0)) completeEncounter(s, 'fight');
  else {
    battle.turn++;
    battle.guard = false;
    delete battle.riposte;
    delete battle.tideWard;
    for (const ally of battle.allies ?? []) delete ally.braced;
    advance(s, 1);
  }
}

function finishTurn(s: Adventure, d: Delve, battle: Encounter, events?: BattleEvent[], negotiate = false) {
  companionTurn(s, battle, events, negotiate);
  if (battle.enemies.every((foe) => foe.hp <= 0)) completeEncounter(s, 'fight');
  else enemyRound(s, d, battle, events);
}

function attack(
  s: Adventure,
  battle: Encounter,
  index: number,
  move: CombatMove,
  events?: BattleEvent[],
) {
  const enemy = battle.enemies[index];
  const weapon = equipped(s, 'weapon');
  const weaponId = weapon?.weapon ?? 'knife';
  const tool = WEAPONS[weaponId];
  const technique = techniqueFor(move);
  const template = FOES[enemy.template];
  const damageType = move === 'scholarSeal' || technique?.attack?.weaknessStyle ? template.weak
    : technique?.attack?.style ?? (move === 'spark' ? 'arcane' : move === 'quick' ? 'wind' : tool.style);
  const art = technique?.art ?? (
    move === 'spark' ? 'arcane' : move === 'quick' ? 'wind' : WEAPON_ART[weaponId]
  );
  const from = actingPoint(s, battle);
  const stat =
    technique?.attack?.stat ?? (move === 'spark'
      ? 'insight'
      : move === 'quick'
        ? 'finesse'
        : move === 'heavy'
          ? 'might'
          : tool.stat);
  const intent = foeIntent(battle, enemy);
  const darkness = s.delve!.light <= 0 ? -2 : 0;
  const aimed = battle.tactics?.aim === index ? 3 : 0;
  if (battle.tactics) battle.tactics.aim = null;
  const check = rollCheck(
    s,
    stat,
    8 + Math.min(8, squareRootTier(s.delve!.floor)),
    false,
    darkness + aimed + (tool === WEAPONS.bow && fieldSkill(s, 'marksman') ? 2 : 0),
  );
  if (battle.tactics && (check.natural === 1 || (check.outcome === 'fail' && check.total <= check.target - 4))) {
    note(s, ['狙いが外れた。', 'Your attack misses.'], 'risk', check);
    events?.push({ art, from, to: foePoint(battle, index), outcome: 'miss' });
    return 0;
  }
  const weakness = template.weak === damageType;
  const resistance = template.resist === damageType;
  const base = (weapon?.power ?? 0) + scoreFor(s, stat) + Math.floor(s.level / 3);
  const factor = succeeded(check) ? 1 : check.outcome === 'partial' ? 0.65 : 0.38;
  const edge =
    Number(tool.effect === 'edge' && move === 'strike' && check.outcome === 'critical') * 3;
  const offhand = move === 'strike' && check.natural >= 13 ? s.gear.find((item) => item.id === s.frontier.offhand) : undefined;
  const masteryDamage =
    (weapon?.masterwork === 'archiveWand' && damageType === 'arcane' ? 2 : 0) +
    (weapon?.masterwork === 'kilnHammer' && move === 'heavy' ? 3 : 0) +
    (weapon?.masterwork === 'skyPike' && intent === 'brace' ? 3 : 0);
  const raw =
    base +
    relicPower(s, 'ember') + mealEffect(s, 'damage') + (s.journey.formation === 'rush' ? 3 : 0) +
    edge + masteryDamage + (offhand ? Math.min(4, offhand.power) : 0) +
    (technique?.attack?.power ?? (move === 'heavy' ? 4 + battle.combo * 2 : move === 'spark' ? 3 : 1)) +
    (check.outcome === 'critical' ? 4 : 0);
  const penetrations = battle.tactics ? Math.min(2, Math.floor(Math.max(0, check.total - check.target) / 5)) : 0;
  const marked = (enemy.markedUntil ?? 0) >= battle.turn;
  if (marked) delete enemy.markedUntil;
  const damage = Math.max(
    1,
    Math.round(raw * factor * (weakness ? 1.55 : resistance ? 0.65 : 1) * (1 + penetrations * .24)) -
      (intent === 'brace' && move !== 'heavy' && move !== 'spark' && !technique?.attack?.ignoreBrace ? 3 : 0),
  ) + (marked ? 3 : 0);
  const lost = hurtFoe(battle, index, damage, art, from, events);
  if (weapon?.weapon && lost > 0 && (
    move === 'strike' || move === 'heavy' || technique?.weapon === weapon.weapon ||
    (technique?.unlock?.kind === 'equipment' && weapon.masterwork === technique.unlock.item)
  )) trainWeapon(s, weapon.weapon);
  enemy.known ||= weakness;
  enemy.stagger ||=
    (move === 'quick' && intent === 'heavy') ||
    (move === 'heavy' && (intent === 'brace' || tool.effect === 'break')) ||
    check.outcome === 'critical';
  battle.combo =
    move === 'heavy'
      ? 0
      : Math.min(
          4,
          battle.combo +
            Number(weakness || move === 'quick' || (move === 'strike' && tool.effect === 'quick')),
        );
  if (weakness && ((tool.effect === 'spark' && move === 'strike') || technique?.attack?.weaknessFocus)) recover(s, 0, 1);
  const label = enemy.epithets ?? template.name;
  note(
    s,
    [
      `${label[0]}に${lost}ダメージ。${weakness ? '弱点を突いた。' : ''}${marked ? '目印が追加ダメージを生んだ。' : ''}`,
      `${lost} damage to ${label[1]}.${weakness ? ' Weakness struck.' : ''}${marked ? ' The mark adds damage.' : ''}`,
    ],
    'good',
    check,
  );
  return lost;
}

export function canCombatMove(s: Adventure, move: CombatMove, index: number, floor?: Floor) {
  const d = s.delve;
  const battle = d?.encounter;
  if (!battle || !Object.hasOwn(COMBAT_MOVES, move) || s.focus < COMBAT_MOVES[move].cost) return false;
  const technique = techniqueFor(move);
  if (technique && !techniqueReady(s, move as TechniqueId, index)) return false;
  if (move === 'guard' || move === 'retreat' || technique?.range === 0) return true;
  if (move === 'study')
    return battle.enemies.some((_, target) => tacticalTarget(s, move, target, floor));
  if (!(battle.enemies[index]?.hp > 0) || !tacticalTarget(s, move, index, floor)) return false;
  if (move !== 'befriend') return true;
  const guest = battle.enemies[index];
  return !battle.guardian && Boolean(guest.epithets || fieldSkill(s, 'diplomacy')) &&
    s.followers.length < MAX_PARTY_SIZE - 1 && s.frontier.liquids.water >= 2 &&
    !s.followers.includes(floorKey(s.location, d.floor) + '/guest/' + battle.cell);
}

function combat(s: Adventure, action: Extract<Action, { type: 'combat' }>, events?: BattleEvent[]) {
  const d = s.delve!,
    battle = d.encounter!;
  const move = action.move;
  const floor = battle.tactics ? currentFloor(s) : undefined;
  if (!canCombatMove(s, move, action.target, floor)) return false;
  s.focus -= COMBAT_MOVES[move].cost;
  let hit = 0;
  const technique = techniqueFor(move);
  if (move === 'guard') {
    battle.guard = true;
    battle.combo = Math.min(4, battle.combo + 1);
    recover(s, 0, 2);
    const point = heroPoint(s);
    events?.push({ art: 'guard', from: point, to: point, outcome: 'power' });
    note(s, ['構えを固め、敵を待った。', 'You brace for the incoming attack.']);
  } else if (move === 'study') {
    battle.enemies.forEach((enemy, index) => {
      if (tacticalTarget(s, 'study', index, floor)) enemy.known = true;
    });
    battle.guard = true;
    const point = heroPoint(s);
    events?.push({ art: 'guard', from: point, to: point, outcome: 'power' });
    note(s, [
      '動きと弱点を見抜いた。交渉の手がかりも見つけた。',
      'You read their movements and weaknesses. You also find a lead for parley.',
    ]);
  } else if (move === 'retreat') {
    const check = rollCheck(s, 'finesse', 10);
    if (succeeded(check) || battle.turn >= 3) {
      escape(s);
      return true;
    }
    battle.guard = true;
    note(s, ['退路を阻まれた。', 'The retreat is cut off.'], 'risk', check);
  } else if (move === 'parley' || move === 'befriend') {
    const guest = move === 'befriend' ? battle.enemies[action.target] : null;
    const pactId = floorKey(s.location, d.floor) + '/guest/' + battle.cell;
    if (guest) s.frontier.liquids.water -= 2;
    const known = battle.enemies.every((enemy) => enemy.hp <= 0 || enemy.known);
    const favor = battle.guardian ? standing(s, townAt(s.location).biome) : 0;
    const check = rollCheck(
      s,
      'presence',
      (battle.guardian ? 17 : 13) + Math.min(7, squareRootTier(d.floor)),
      false,
      (known ? 3 : 0) + (equipped(s, 'charm')?.masterwork === 'lowTideCharm' ? 2 : 0) +
      (favor >= 7 ? 3 : favor >= 3 ? 1 : favor <= -3 ? -2 : 0) + Number(consumeFieldRecipe(s, 'talk')) * 4 + Number(Boolean(guest)) * 2,
    );
    if (succeeded(check)) {
      if (guest) {
        s.friends[pactId] = { resident: { id: pactId, name: guest.epithets ?? FOES[guest.template].name, role: 'keeper', art: 0, site: ['遺跡', 'Ruins'], shift: 'all' }, creature: guest.template, trust: 6, visitedDay: 0, offeredDay: 0 };
        s.followers.push(pactId);
      }
      completeEncounter(s, 'parley', check);
      return true;
    }
    battle.guard = check.outcome === 'partial';
    note(s, ['相手はまだ道を譲らない。', 'They are not ready to let you pass.'], 'risk', check);
  } else {
    const index = action.target;
    const heavyWindup = technique?.effects.includes('interrupt') && foeIntent(battle, battle.enemies[index]) === 'heavy';
    if (!technique || technique.attack) hit = attack(s, battle, index, move, events);
    if (technique && (hit > 0 || !technique.attack || move === 'vanguardBash'))
      applyManeuvers(s, battle, index, move as TechniqueId, hit, Boolean(heavyWindup), floor, events);
  }
  if (hit > 0 && fieldCondition(s, 'chorus') && battle.enemies[action.target]?.hp > 0)
    hurtFoe(battle, action.target, 2 + (s.frontier.gifts.chorus ?? 1), 'wind', actingPoint(s, battle), events);
  const negotiate = s.journey.formation === 'envoy' && ['parley', 'befriend', 'study'].includes(move);
  finishTurn(s, d, battle, events, negotiate);
  return true;
}

function autoCombat(s: Adventure, requested: number, events?: BattleEvent[]) {
  const battle = s.delve!.encounter!;
  if (battle.tactics) return false;
  const target = battle.enemies[requested]?.hp > 0
    ? requested
    : battle.enemies.findIndex((foe) => foe.hp > 0);
  if (target < 0) return false;
  const enemy = battle.enemies[target];
  const weapon = WEAPONS[equipped(s, 'weapon')?.weapon ?? 'knife'];
  const intent = foeIntent(battle, enemy);
  const weak = enemy.known ? FOES[enemy.template].weak : undefined;
  const formation = s.journey.formation;
  let move: CombatMove = 'strike';
  if ((formation === 'survey' || formation === 'envoy') && battle.enemies.some((foe) => foe.hp > 0 && !foe.known)) move = 'study';
  else if (formation === 'envoy') move = 'parley';
  else if (formation === 'shelter' && intent === 'heavy' && s.hp * 2 < maxHp(s)) move = 'guard';
  else if (s.focus >= COMBAT_MOVES.quick.cost && (intent === 'heavy' || (weak === 'wind' && weapon.style !== 'wind'))) move = 'quick';
  else if (s.focus >= COMBAT_MOVES.spark.cost && weak === 'arcane' && weapon.style !== 'arcane') move = 'spark';
  else if (s.focus >= COMBAT_MOVES.heavy.cost && (battle.combo >= 2 || intent === 'brace' || formation === 'rush')) move = 'heavy';
  return combat(s, { type: 'combat', move, target }, events);
}

export function declarationDifficulty(s: Adventure, stat: Stat) {
  const d = s.delve;
  if (!d) return 11 + BIOMES[townAt(s.location).biome].risk;
  const tier = Math.min(8, squareRootTier(d.floor));
  const isKeeper = d.encounter?.guardian || currentFloor(s).features[d.cell] === 'guardian';
  return (
    (isKeeper ? 17 : 12) +
    tier +
    (d.encounter ? 0 : ruinCondition(s.location, d.floor).checks + (circuitEffects(s).checks ?? 0)) +
    (d.light <= 0 ? 2 : 0) -
    Number(stat === 'insight' && d.encounter !== null)
  );
}
function declareInDelve(s: Adventure, action: Extract<Action, { type: 'declare' }>, events?: BattleEvent[]) {
  const d = s.delve!;
  const battle = d.encounter;
  const type = currentFloor(s).features[d.cell];
  const check = rollCheck(
    s,
    action.stat,
    declarationDifficulty(s, action.stat),
    action.inspiration,
    type && currentRecord(s).inspected.includes(d.cell) ? 2 : 0,
  );
  const success = succeeded(check);
  const effect: Text = !success
    ? ['思いどおりにはいかなかった。', 'The attempt falls short.']
    : action.stat === 'presence'
      ? ['語りかけに相手が応じた。', 'Someone answers your appeal.']
      : action.stat === 'insight'
        ? ['見落としていた手がかりが見つかった。', 'You uncover a clue you overlooked.']
        : action.stat === 'finesse'
          ? ['うまく足場を選べた。', 'You find a way through.']
          : ['思い切った動きで流れを変えた。', 'A decisive move changes the situation.'];
  note(
    s,
    [`「${action.statement}」。${effect[0]}`, `“${action.statement}” — ${effect[1]}`],
    success ? 'good' : 'risk',
    check,
  );
  if (battle) {
    if (success && (action.stat === 'presence' || action.stat === 'finesse')) {
      completeEncounter(s, action.stat === 'presence' ? 'parley' : 'bypass', check);
      return true;
    }
    if (action.stat === 'insight' && check.outcome !== 'fail') {
      battle.enemies.forEach((enemy) => {
        enemy.known = true;
      });
      battle.guard = true;
    }
    if (action.stat === 'might' && success) {
      const index =
        battle.enemies[action.target ?? 0]?.hp > 0
          ? action.target ?? 0
          : battle.enemies.findIndex((foe) => foe.hp > 0);
      const damage = 5 + scoreFor(s, 'might') * 2 + (check.outcome === 'critical' ? 4 : 0);
      const lost = hurtFoe(battle, index, damage, 'crush', actingPoint(s, battle), events);
      battle.enemies[index].stagger = true;
      note(
        s,
        [`工夫した攻撃で${lost}ダメージ。`, `Your improvised attack deals ${lost} damage.`],
        'good',
      );
    }
    if (check.outcome === 'partial') battle.guard = true;
    if (battle.enemies.every((enemy) => enemy.hp <= 0)) completeEncounter(s, 'fight', check);
    else finishTurn(s, d, battle, events);
    return true;
  }
  const live = type && !secured(s, d.cell);
  if (success && live) {
    if (
      (type === 'guardian' || type === 'pack') &&
      (action.stat === 'insight' || action.stat === 'might')
    ) {
      startEncounter(s, type === 'guardian', true);
      const enemy = s.delve!.encounter!.enemies[0];
      if (action.stat === 'insight') enemy.known = true;
      else {
        enemy.stagger = true;
        enemy.hp = Math.max(1, enemy.hp - 5);
      }
    } else if (type !== 'stairs' && type !== 'sanctum') succeedRoom(s, type, check);
    else if (type === 'sanctum') {
      recover(s, 8, 4);
      clearFeature(s);
    }
  } else if (success && !live && action.stat === 'insight') {
    const record = currentRecord(s);
    if (!record.inspected.includes(d.cell)) {
      record.inspected.push(d.cell);
      const floor = currentFloor(s);
      for (let dir = 0; dir < 4; dir++) {
        const next = neighbor(d.cell, dir);
        if (floor.open.has(next) && !record.seen.includes(next)) record.seen.push(next);
      }
      awardExperience(s, 3);
    }
  } else if (!success && live) {
    if (type === 'pack' || type === 'guardian') startEncounter(s, type === 'guardian', true);
    else if (type === 'trap' || type === 'runes') {
      takeHit(s, check.outcome === 'partial' ? 1 : 4);
      if (type === 'trap') clearFeature(s);
      finishDefeat(s);
    }
  }
  advance(s, 1);
  if (s.delve) s.delve.light = Math.max(0, s.delve.light - 1);
  return true;
}

export function applyDelveAction(s: Adventure, action: Action, events?: BattleEvent[]): boolean {
  if (action.type === 'enter') return enter(s, action.floor);
  const d = s.delve;
  if (!d) return false;
  if (d.encounter?.tactics) d.encounter.tactics.party ??= partyPositions(s, d.encounter);
  if (action.type === 'field') {
    const before = s.hp;
    if (!applyField(s, action.operation)) return false;
    if (d.encounter) {
      if (s.hp > before) {
        const point = heroPoint(s);
        events?.push({ art: 'heal', from: point, to: point, outcome: 'power', hp: s.hp - before });
      }
      finishTurn(s, d, d.encounter, events);
    }
    return true;
  }
  if (action.type === 'declare') return declareInDelve(s, action, events);
  if (action.type === 'use' || action.type === 'eat-dish') {
    const before = s.hp;
    if (!(action.type === 'use' ? useSupply(s, action.good) : eatDish(s, action.id))) return false;
    if (d.encounter) {
      if (s.hp > before) {
        const point = heroPoint(s);
        events?.push({ art: 'heal', from: point, to: point, outcome: 'power', hp: s.hp - before });
      }
      finishTurn(s, d, d.encounter, events);
    }
    return true;
  }
  if (d.encounter) {
    if (action.type === 'tactical-step' && canTacticalStep(s, action.cell)) {
      const battle = d.encounter;
      const from = actingPoint(s, battle);
      const positions = battle.tactics!.party!;
      const swap = partyAt(battle, positions, action.cell);
      const linked = borrowedCreature(battle);
      const to = { ...from, cell: action.cell };
      events?.push({ art: 'wind', from, to, outcome: 'move' });
      if (swap && from.cell !== undefined) {
        const allyFrom = partyPoint(battle, swap);
        positions[swap] = from.cell;
        events?.push({ art: 'wind', from: allyFrom, to: partyPoint(battle, swap), outcome: 'move', sharedStep: true });
      }
      if (linked >= 0) {
        d.encounter.tactics!.cells[linked] = action.cell;
        d.encounter.tactics!.aim = null;
        finishTurn(s, d, d.encounter, events);
        return true;
      }
      const floor = currentFloor(s);
      d.previous = d.cell;
      d.direction = [0, 1, 2, 3].find((direction) => neighbor(d.cell, direction) === action.cell) ?? d.direction;
      d.cell = action.cell;
      d.encounter.tactics!.aim = null;
      mapCell(s);
      const before = s.hp;
      const hazard = fieldHazard(s, d.cell, d.floor, floor);
      if (hazard) note(s, hazard, 'risk');
      if (s.hp < before) {
        const point = heroPoint(s);
        const art = terrainAt(s, d.cell, d.floor, floor) === 'wire' ? 'shock' : 'fire';
        events?.push({ art, from: point, to: point, outcome: 'hit', hp: s.hp - before });
      }
      if (!finishDefeat(s)) finishTurn(s, d, d.encounter, events);
      return true;
    }
    if (action.type === 'tactical-aim' && d.encounter.tactics && tacticalTarget(s, 'spark', action.target)) {
      if (d.encounter.tactics.aim === action.target) return false;
      d.encounter.tactics.aim = action.target;
      note(s, ['次の攻撃に向けて狙いを定めた。', 'You steady your aim for the next attack.']);
      const point = heroPoint(s);
      events?.push({ art: 'guard', from: point, to: point, outcome: 'power' });
      finishTurn(s, d, d.encounter, events);
      return true;
    }
    if (action.type === 'auto-combat') return autoCombat(s, action.target, events);
    return action.type === 'combat' && combat(s, action, events);
  }
  if (action.type === 'auto-walk') {
    const path = plannedWalk(s, action.target);
    if (!path.length) return false;
    let moved = false;
    for (const cell of path) {
      const direction = [0, 1, 2, 3].find((dir) => neighbor(d.cell, dir) === cell);
      if (direction === undefined) break;
      d.direction = direction;
      const previousHp = s.hp;
      if (!step(s, d, 'forward')) break;
      moved = true;
      if (!s.delve || d.encounter || s.hp < previousHp) break;
    }
    return moved;
  }
  if (action.type === 'inspect-circuit' || action.type === 'set-circuit' || action.type === 'read-inscription')
    return applyRuinAction(s, action);
  if (action.type === 'move') return step(s, d, action.direction);
  if (action.type === 'feature') return featureAction(s, d, action);
  if (action.type === 'leave-delve') {
    s.delve = null;
    advance(s, 2);
    note(s, [
      '地上へ戻った。採った物と見取り図を持ち帰った。',
      'You return to the surface with your finds and map.',
    ]);
    return true;
  }
  return false;
}
