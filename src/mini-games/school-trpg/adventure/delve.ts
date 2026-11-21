import {
  BIOMES,
  FOES,
  WEAPONS,
  type DamageType,
  type Intent,
  type Stat,
  type Text,
} from './content';
import { enemyName, forgeGear } from './inventory';
import { useSupply } from './life';
import {
  advance,
  armor,
  awardExperience,
  awardInspiration,
  equipped,
  maxFocus,
  maxHp,
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
  generateFloor,
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

export const COMBAT_MOVES = {
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
  retreat: {
    name: ['入口へ退く', 'Retreat to entrance'],
    hint: [
      '地下の入口に撤退。3ターン目からは確実に離脱。',
      'Fall back to the entrance. Guaranteed on turn three or later.',
    ],
    cost: 0,
  },
} satisfies Record<CombatMove, { name: Text; hint: Text; cost: number }>;

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
const currentFloor = (s: Adventure) => generateFloor(s.location, s.delve!.floor);
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
    light: 16,
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
    enemy.theme === biome && index < FOES.length - 1 ? [index] : [],
  );
  const tier = squareRootTier(d.floor);
  const risk = BIOMES[biome].risk;
  const count = guardian ? 1 : bound && d.floor >= 3 ? 1 + nextRandom(s, d.floor >= 9 ? 3 : 2) : 1;
  const enemies = Array.from({ length: count }, (_, i): Enemy => {
    const template = guardian ? FOES.length - 1 : options[nextRandom(s, options.length)];
    const base = FOES[template];
    const scale = tier * (guardian ? 8 : 5);
    const hp = base.hp + scale + risk * (guardian ? 3 : 2);
    return {
      template,
      hp,
      max: hp,
      power: base.attack + tier + Math.floor(risk / 2),
      pattern: guardian ? 0 : (i + nextRandom(s, base.pattern.length)) % base.pattern.length,
      stagger: false,
      known: false,
    };
  });
  d.encounter = {
    guardian,
    bound,
    cell: d.cell,
    turn: 1,
    enemies,
    combo: 0,
    guard: false,
    surprise: !bound,
  };
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
function rescue(s: Adventure) {
  if (s.hp > 0) return false;
  const fee = Math.min(s.gold, 4 + Math.ceil(s.gold * 0.17));
  s.gold -= fee;
  s.delve = null;
  advance(s, 7);
  s.fatigue = 4;
  s.hp = Math.ceil(maxHp(s) * 0.6);
  s.focus = Math.ceil(maxFocus(s) * 0.5);
  note(
    s,
    [
      `町へ救助された。救助に${fee} Gを支払った。`,
      `You are rescued and brought to town. The rescue costs ${fee} G.`,
    ],
    'risk',
  );
  return true;
}
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
  if (s.character.calling !== 'scout' || d.threat % 2 === 0) d.light = Math.max(0, d.light - 1);
  if (d.threat % 3 === 0) advance(s, 1);
  if (d.threat % 7 === 0) s.fatigue = Math.min(9, s.fatigue + 1);
  const feature = floor.features[next];
  if (
    d.light === 0 &&
    d.threat % 9 === 0 &&
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
  s.gold += coins;
  s.goods.relic++;
  if (nextRandom(s, 100) < 80 || check?.outcome === 'critical')
    forgeGear(s, d.floor, check?.outcome === 'critical' ? 2 : 0);
  else s.goods.lantern++;
  awardExperience(s, 6);
  note(
    s,
    [`宝箱から${coins} Gと遺物片を得た。`, `The chest held ${coins} G and a relic shard.`],
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
    recover(s, 11, 6);
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
      rescue(s);
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
    type === 'trap' ? 11 + squareRootTier(d.floor) : 12 + squareRootTier(d.floor),
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
    rescue(s);
  }
  return true;
}

function completeEncounter(s: Adventure, method: 'fight' | 'parley' | 'bypass', check?: Check) {
  const d = s.delve!,
    battle = d.encounter!;
  if (battle.bound) clearFeature(s, battle.cell);
  if (method === 'fight') s.counters.combats++;
  if (method === 'parley') s.counters.pacified++;
  if (battle.guardian) {
    const key = addressKey(s.location);
    if ((s.deepest[key] ?? 0) < d.floor) {
      s.deepest[key] = d.floor;
      s.counters.guardians++;
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
  note(s, [`${phrases[0]} ${coins} G`, `${phrases[1]} ${coins} G`], 'good', check);
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
function enemyRound(s: Adventure, d: Delve, battle: Encounter) {
  let damageTaken = 0;
  let counterDamage = 0;
  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.stagger) {
      enemy.stagger = false;
      continue;
    }
    const intent = foeIntent(battle, enemy);
    if (intent === 'mend') {
      enemy.hp = Math.min(enemy.max, enemy.hp + 3 + Math.floor(enemy.power / 4));
      continue;
    }
    if (intent === 'brace') continue;
    if (intent === 'hex' && !battle.guard) s.focus = Math.max(0, s.focus - 2);
    if (intent === 'drain') d.light = Math.max(0, d.light - (battle.guard ? 1 : 3));
    const companionWards = s.followers.filter((id) =>
      ['smith', 'keeper'].includes(s.friends[id]?.resident.role),
    ).length;
    const protection = armor(s) + (battle.guard ? 3 : 0) + companionWards;
    const attack =
      enemy.power +
      (intent === 'heavy' ? 4 : 0) -
      (intent === 'strike' ? 0 : 1) +
      Number(battle.surprise && battle.turn === 1);
    const damage = Math.max(1, attack - protection);
    takeHit(s, damage);
    damageTaken += damage;
    if (intent === 'heavy' && battle.guard) {
      const strength = 2 + scoreFor(s, 'might') + (s.character.calling === 'vanguard' ? 3 : 0);
      enemy.hp = Math.max(0, enemy.hp - strength);
      counterDamage += strength;
    }
    if (s.hp <= 0) break;
  }
  if (damageTaken) {
    const counter = counterDamage
      ? [` 反撃 ${counterDamage}。`, ` Countered for ${counterDamage}.`]
      : ['', ''];
    note(
      s,
      [
        `敵の反撃で${damageTaken}ダメージ。${counter[0]}`,
        `Enemy response deals ${damageTaken} damage.${counter[1]}`,
      ],
      'risk',
    );
  }
  if (rescue(s)) return;
  if (
    battle.turn % 3 === 0 &&
    s.followers.some(
      (id) => s.friends[id]?.resident.role === 'grower' || s.friends[id]?.resident.role === 'host',
    )
  )
    recover(s, 4, 1);
  if (battle.enemies.every((enemy) => enemy.hp <= 0)) completeEncounter(s, 'fight');
  else {
    battle.turn++;
    battle.guard = false;
    advance(s, 1);
  }
}

function attack(
  s: Adventure,
  battle: Encounter,
  enemy: Enemy,
  move: 'strike' | 'heavy' | 'quick' | 'spark',
) {
  const weapon = equipped(s, 'weapon');
  const tool = WEAPONS[weapon?.weapon ?? 'knife'];
  const damageType = move === 'spark' ? 'arcane' : move === 'quick' ? 'wind' : tool.style;
  const stat =
    move === 'spark'
      ? 'insight'
      : move === 'quick'
        ? 'finesse'
        : move === 'heavy'
          ? 'might'
          : tool.stat;
  const template = FOES[enemy.template];
  const intent = foeIntent(battle, enemy);
  const darkness = s.delve!.light <= 0 ? -2 : 0;
  const check = rollCheck(
    s,
    stat,
    8 + Math.min(8, squareRootTier(s.delve!.floor)),
    false,
    darkness,
  );
  const weakness = template.weak === damageType;
  const resistance = template.resist === damageType;
  const base = (weapon?.power ?? 0) + scoreFor(s, stat) + Math.floor(s.level / 3);
  const factor = succeeded(check) ? 1 : check.outcome === 'partial' ? 0.65 : 0.38;
  const edge =
    Number(tool.effect === 'edge' && move === 'strike' && check.outcome === 'critical') * 3;
  const raw =
    base +
    edge +
    (move === 'heavy' ? 4 + battle.combo * 2 : move === 'spark' ? 3 : 1) +
    (check.outcome === 'critical' ? 4 : 0);
  const damage = Math.max(
    1,
    Math.round(raw * factor * (weakness ? 1.55 : resistance ? 0.65 : 1)) -
      (intent === 'brace' && move !== 'heavy' && move !== 'spark' ? 3 : 0),
  );
  enemy.hp = Math.max(0, enemy.hp - damage);
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
  if (tool.effect === 'spark' && move === 'strike' && weakness) recover(s, 0, 1);
  const label = enemyName(enemy.template, battle.guardian);
  note(
    s,
    [
      `${label[0]}に${damage}ダメージ。${weakness ? '弱点を突いた。' : ''}`,
      `${damage} damage to ${label[1]}.${weakness ? ' Weakness struck.' : ''}`,
    ],
    'good',
    check,
  );
}
function combat(s: Adventure, action: Extract<Action, { type: 'combat' }>) {
  const d = s.delve!,
    battle = d.encounter!;
  const move = action.move;
  if (!Object.hasOwn(COMBAT_MOVES, move) || s.focus < COMBAT_MOVES[move].cost) return false;
  s.focus -= COMBAT_MOVES[move].cost;
  if (move === 'guard') {
    battle.guard = true;
    battle.combo = Math.min(4, battle.combo + 1);
    recover(s, 0, 2);
    note(s, ['構えを固め、敵を待った。', 'You brace for the incoming attack.']);
  } else if (move === 'study') {
    battle.enemies.forEach((enemy) => {
      enemy.known = true;
    });
    battle.guard = true;
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
  } else if (move === 'parley') {
    const known = battle.enemies.every((enemy) => enemy.hp <= 0 || enemy.known);
    const check = rollCheck(
      s,
      'presence',
      (battle.guardian ? 17 : 13) + Math.min(7, squareRootTier(d.floor)),
      false,
      known ? 3 : 0,
    );
    if (succeeded(check)) {
      completeEncounter(s, 'parley', check);
      return true;
    }
    battle.guard = check.outcome === 'partial';
    note(s, ['相手はまだ道を譲らない。', 'They are not ready to let you pass.'], 'risk', check);
  } else {
    const enemy = battle.enemies[action.target];
    if (!enemy || enemy.hp <= 0) return false;
    attack(s, battle, enemy, move);
  }
  if (battle.enemies.every((enemy) => enemy.hp <= 0)) completeEncounter(s, 'fight');
  else enemyRound(s, d, battle);
  return true;
}

export function declarationDifficulty(s: Adventure, stat: Stat) {
  const d = s.delve;
  if (!d) return 11 + BIOMES[townAt(s.location).biome].risk;
  const tier = Math.min(8, squareRootTier(d.floor));
  const isKeeper = d.encounter?.guardian || currentFloor(s).features[d.cell] === 'guardian';
  return (
    (isKeeper ? 17 : 12) +
    tier +
    (d.light <= 0 ? 2 : 0) -
    Number(stat === 'insight' && d.encounter !== null)
  );
}
function declareInDelve(s: Adventure, action: Extract<Action, { type: 'declare' }>) {
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
      const enemy =
        battle.enemies[action.target ?? 0]?.hp > 0
          ? battle.enemies[action.target ?? 0]
          : battle.enemies.find((foe) => foe.hp > 0)!;
      const damage = 5 + scoreFor(s, 'might') * 2 + (check.outcome === 'critical' ? 4 : 0);
      enemy.hp = Math.max(0, enemy.hp - damage);
      enemy.stagger = true;
      note(
        s,
        [`工夫した攻撃で${damage}ダメージ。`, `Your improvised attack deals ${damage} damage.`],
        'good',
      );
    }
    if (check.outcome === 'partial') battle.guard = true;
    if (battle.enemies.every((enemy) => enemy.hp <= 0)) completeEncounter(s, 'fight', check);
    else enemyRound(s, d, battle);
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
      rescue(s);
    }
  }
  advance(s, 1);
  if (s.delve) s.delve.light = Math.max(0, s.delve.light - 1);
  return true;
}

export function applyDelveAction(s: Adventure, action: Action): boolean {
  if (action.type === 'enter') return enter(s, action.floor);
  const d = s.delve;
  if (!d) return false;
  if (action.type === 'declare') return declareInDelve(s, action);
  if (action.type === 'use') {
    if (!useSupply(s, action.good)) return false;
    if (d.encounter) enemyRound(s, d, d.encounter);
    return true;
  }
  if (d.encounter) return action.type === 'combat' && combat(s, action);
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
