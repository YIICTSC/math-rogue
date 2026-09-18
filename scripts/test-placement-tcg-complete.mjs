import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

const makeUnit = (card, uid, overrides = {}) => ({
  uid,
  cardId: card.id,
  health: card.health || 1,
  attackBonus: 0,
  healthBonus: 0,
  shield: 0,
  ready: true,
  stunned: false,
  ...overrides,
});

const makeSupport = (card, uid, overrides = {}) => ({
  uid,
  cardId: card.id,
  durability: card.durability || 2,
  ...overrides,
});

const blankBoard = () => Array.from({ length: 3 }, () => ({ unit: null, support: null }));

try {
  const cardsModule = await server.ssrLoadModule('/src/mini-games/placement-tcg/placementTcgCards.ts');
  const engine = await server.ssrLoadModule('/src/mini-games/placement-tcg/placementTcgEngine.ts');
  const {
    PLACEMENT_TCG_CARDS,
    PLACEMENT_TCG_CARD_MAP,
    PLACEMENT_TCG_EDITION_DECKS,
    PLACEMENT_TCG_REWARD_POOL,
  } = cardsModule;
  const {
    PLACEMENT_TCG_LIFE,
    attackPlacementLane,
    createPlacementBattle,
    endPlayerTurn,
    getUnitAttack,
    playPlacementCard,
    runCpuTurn,
  } = engine;

  assert.equal(PLACEMENT_TCG_CARDS.length, 584, 'TCG catalog must contain 584 cards');
  assert.equal(new Set(PLACEMENT_TCG_CARDS.map(card => card.id)).size, 584, 'TCG card IDs must be unique');
  assert.equal(new Set(PLACEMENT_TCG_CARDS.map(card => card.effectProgram.normalizedSignature)).size, 584, 'Current effect-program signatures must stay unique during migration');
  assert.equal(PLACEMENT_TCG_REWARD_POOL.length, 584, 'Reward pool must expose the whole catalog');

  const expectedCounts = {
    ELEMENTARY: { UNIT: 128, SUPPORT: 33, EVENT: 34 },
    HIGH_SCHOOL: { UNIT: 121, SUPPORT: 33, EVENT: 33 },
    MAGIC: { UNIT: 135, SUPPORT: 34, EVENT: 33 },
  };
  for (const [edition, kinds] of Object.entries(expectedCounts)) {
    for (const [kind, count] of Object.entries(kinds)) {
      assert.equal(
        PLACEMENT_TCG_CARDS.filter(card => card.edition === edition && card.kind === kind).length,
        count,
        `${edition} ${kind} count must remain stable`,
      );
    }
    assert.equal(PLACEMENT_TCG_EDITION_DECKS[edition].length, 20, `${edition} starter deck must contain 20 cards`);
  }

  const vacationCards = PLACEMENT_TCG_CARDS.filter(card =>
    card.id.endsWith('_VACATION') || card.id.endsWith('_VACATION_AFTER'),
  );
  assert.equal(vacationCards.length, 43, 'Vacation protagonist set must contain 43 cards');
  assert.equal(vacationCards.filter(card => card.edition === 'HIGH_SCHOOL').length, 9, 'High School vacation set must contain 9 protagonists');
  assert.equal(vacationCards.filter(card => card.edition === 'MAGIC').length, 34, 'Magic vacation set must contain 34 protagonists');
  assert(vacationCards.every(card => card.kind === 'UNIT'), 'Vacation protagonist cards must all be Units');
  assert(vacationCards.every(card => card.artSourceType === 'CHARACTER_ART' && card.artAsset?.includes('/vacation-')), 'Vacation protagonist cards must use vacation character artwork');
  assert(vacationCards.every(card => card.effectProgram.id.startsWith('DSL_') && card.effectProgram.identityNote.includes('バカンス')), 'Vacation protagonist cards must all use explicit themed effect programs');
  assert.equal(
    PLACEMENT_TCG_CARDS.filter(card => card.kind === 'SUPPORT' && card.effectProgram.trigger === 'DEFEAT').length,
    0,
    'Support cards must not use the Unit-only DEFEAT trigger',
  );
  assert(
    PLACEMENT_TCG_CARDS.some(card => card.kind === 'SUPPORT' && card.effectProgram.trigger === 'ALLY_DEFEATED'),
    'Support catalog must expose ALLY_DEFEATED effects',
  );

  const starter = PLACEMENT_TCG_EDITION_DECKS.ELEMENTARY;
  const initial = createPlacementBattle(starter, 0, 20260918);
  assert.equal(initial.player.life, PLACEMENT_TCG_LIFE);
  assert.equal(initial.cpu.life, PLACEMENT_TCG_LIFE);
  assert.equal(initial.player.hand.length, 5);
  assert.equal(initial.cpu.hand.length, 5);

  // KILL_DRAW says once per turn. Two kills by the same unit in one turn may only draw once.
  const killer = PLACEMENT_TCG_CARDS.find(card =>
    card.kind === 'UNIT'
    && card.effect === 'KILL_DRAW'
    && !['ATTACK', 'DEFEAT', 'DAMAGED'].includes(card.effectProgram.trigger),
  );
  const passiveAttacker = PLACEMENT_TCG_CARDS.find(card =>
    card.kind === 'UNIT'
    && card.effect !== 'THORNS'
    && !['ATTACK', 'DIRECT_ATTACK', 'DEFEAT', 'DAMAGED'].includes(card.effectProgram.trigger),
  );
  const defender = PLACEMENT_TCG_CARDS.find(card => card.kind === 'UNIT' && card.id !== killer?.id && card.id !== passiveAttacker?.id);
  assert(killer && passiveAttacker && defender, 'Regression fixtures must exist in the TCG catalog');

  let battle = createPlacementBattle(starter, 0, 11);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.lanes[0].unit = makeUnit(killer, 'killer', { health: 999, ready: true });
  battle.cpu.lanes[0].unit = makeUnit(defender, 'target-1', {
    health: 1,
    attackBonus: -(defender.attack || 0),
    ready: false,
  });
  battle.player.hand = [];
  battle.player.deck = [passiveAttacker.id, passiveAttacker.id, passiveAttacker.id];
  let result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'First KILL_DRAW attack must resolve');
  assert.equal(result.battle.player.hand.length, 1, 'First kill in a turn must draw one card');
  battle = result.battle;
  battle.player.lanes[0].unit.ready = true;
  battle.cpu.lanes[0].unit = makeUnit(defender, 'target-2', {
    health: 1,
    attackBonus: -(defender.attack || 0),
    ready: false,
  });
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'Second KILL_DRAW attack must resolve');
  assert.equal(result.battle.player.hand.length, 1, 'KILL_DRAW must not draw twice in the same turn');

  // THORNS must only reflect when real combat damage reaches health.
  const thorns = PLACEMENT_TCG_CARDS.find(card => card.kind === 'UNIT' && card.effect === 'THORNS' && card.effectProgram.trigger !== 'DAMAGED');
  assert(thorns, 'THORNS regression fixture must exist');
  battle = createPlacementBattle(starter, 0, 12);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.lanes[0].unit = makeUnit(passiveAttacker, 'shield-attacker', { health: 50, ready: true });
  battle.cpu.lanes[0].unit = makeUnit(thorns, 'shield-thorns', {
    health: 50,
    shield: 99,
    attackBonus: -(thorns.attack || 0),
    ready: false,
  });
  const attackerHealthBefore = battle.player.lanes[0].unit.health;
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'Shielded THORNS combat must resolve');
  assert.equal(result.battle.player.lanes[0].unit.health, attackerHealthBefore, 'THORNS must not reflect when shield absorbs all combat damage');

  // Once-per-turn reactive effects must not recursively re-enter while their first resolution is still in flight.
  const reactive = PLACEMENT_TCG_CARD_MAP.get('MTCG_ELEMENTARY_ENEMY_003');
  assert(reactive?.effectProgram.trigger === 'DAMAGED' && reactive.effectProgram.resetRule === 'ONCE_PER_TURN');
  battle = createPlacementBattle(starter, 0, 121);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.lanes[0].unit = makeUnit(reactive, 'reactive-player', { health: 99, ready: true });
  battle.cpu.lanes[0].unit = makeUnit(reactive, 'reactive-cpu', {
    health: 99,
    attackBonus: -(reactive.attack || 0),
    ready: false,
  });
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'Reactive mirror combat must resolve');
  assert.equal(result.battle.player.lanes[0].unit.health, 98, 'Reactive once-per-turn effect may counter once without recursive re-entry');

  // A ward only protects during the opponent's active turn, not against reactions that happen during its owner's turn.
  const wardForReaction = PLACEMENT_TCG_CARDS.find(card => card.kind === 'SUPPORT' && card.effect === 'DAMAGE_WARD');
  assert(wardForReaction);
  battle = createPlacementBattle(starter, 0, 122);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.lanes[0].unit = makeUnit(passiveAttacker, 'ward-reaction-attacker', { health: 99, ready: true });
  battle.player.lanes[0].support = makeSupport(wardForReaction, 'ward-reaction-support', { durability: 3 });
  battle.cpu.lanes[0].unit = makeUnit(reactive, 'ward-reaction-defender', {
    health: 99,
    attackBonus: -(reactive.attack || 0),
    ready: false,
  });
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'Reactive damage into a ward must resolve');
  assert.equal(result.battle.player.lanes[0].support?.durability, 3, 'DAMAGE_WARD must not spend durability during its owner turn');

  // Timed buffs expire before the owner's next turn begins.
  battle = createPlacementBattle(starter, 0, 120);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.cpu.hand = [];
  battle.cpu.deck = [];
  battle.cpu.discard = [];
  battle.player.lanes[0].unit = makeUnit(passiveAttacker, 'timed-buff-unit', {
    timedAttackBonuses: [{ amount: 3, expiresAtTurn: battle.turnNumber + 1 }],
  });
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), (passiveAttacker.attack || 0) + 3, 'Timed Attack bonus must apply before expiry');
  battle = endPlayerTurn(battle);
  battle = runCpuTurn(battle);
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), passiveAttacker.attack || 0, 'Timed Attack bonus must expire before the next player turn');

  // A one-turn Attack buff created at TURN_END must survive into the owner's next attack window.
  const scienceLeader = PLACEMENT_TCG_CARD_MAP.get('MTCG_ELEMENTARY_HERO_MAGE');
  assert(scienceLeader?.effectProgram.trigger === 'TURN_END');
  battle = createPlacementBattle(starter, 0, 123);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.cpu.hand = [];
  battle.cpu.deck = [];
  battle.cpu.discard = [];
  battle.player.lanes[0].unit = makeUnit(scienceLeader, 'science-leader', { health: 99, ready: true });
  const scienceBaseAttack = getUnitAttack(battle.player.lanes[0], 0);
  battle = endPlayerTurn(battle);
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), scienceBaseAttack + 1, 'TURN_END timed Attack buff must apply immediately');
  battle = runCpuTurn(battle);
  assert.equal(battle.turn, 'PLAYER');
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), scienceBaseAttack + 1, 'TURN_END timed Attack buff must survive into the next player turn');

  // A one-turn reactive buff created during the opponent turn must last for
  // exactly the next owner turn, not two owner turns.
  const dodgeAce = PLACEMENT_TCG_CARD_MAP.get('MTCG_ELEMENTARY_HERO_DODGEBALL');
  assert(dodgeAce?.effectProgram.trigger === 'DAMAGED');
  battle = createPlacementBattle(starter, 0, 124);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.hand = [];
  battle.player.deck = [];
  battle.player.discard = [];
  battle.cpu.hand = [];
  battle.cpu.deck = [];
  battle.cpu.discard = [];
  battle.turn = 'CPU';
  battle.player.lanes[0].unit = makeUnit(dodgeAce, 'reactive-buff-target', { health: 99, ready: false });
  battle.cpu.lanes[0].unit = makeUnit(passiveAttacker, 'reactive-buff-source', {
    health: 99,
    attackBonus: 1 - (passiveAttacker.attack || 0),
    ready: true,
  });
  const dodgeBaseAttack = getUnitAttack(battle.player.lanes[0], 0);
  result = attackPlacementLane(battle, 'cpu', 0);
  assert(result.ok, 'Opponent-turn reactive buff combat must resolve');
  assert.equal(getUnitAttack(result.battle.player.lanes[0], 0), dodgeBaseAttack + 1, 'Reactive timed Attack buff must apply immediately');
  battle = runCpuTurn(result.battle);
  assert.equal(battle.turn, 'PLAYER');
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), dodgeBaseAttack + 1, 'Reactive timed Attack buff must survive through the next owner turn');
  battle.cpu.lanes[0].unit = null;
  battle = endPlayerTurn(battle);
  battle = runCpuTurn(battle);
  assert.equal(battle.turn, 'PLAYER');
  assert.equal(getUnitAttack(battle.player.lanes[0], 0), dodgeBaseAttack, 'Reactive timed Attack buff must expire before the following owner turn');

  // DAMAGE_WARD is the first damage of each opposing turn, not every hit while durability remains.
  const ward = PLACEMENT_TCG_CARDS.find(card => card.kind === 'SUPPORT' && card.effect === 'DAMAGE_WARD');
  assert(ward, 'DAMAGE_WARD regression fixture must exist');
  battle = createPlacementBattle(starter, 0, 13);
  battle.player.lanes = blankBoard();
  battle.cpu.lanes = blankBoard();
  battle.player.lanes[0].unit = makeUnit(passiveAttacker, 'ward-attacker', { health: 99, ready: true });
  battle.cpu.lanes[0].unit = makeUnit(defender, 'ward-defender', {
    health: 99,
    attackBonus: -(defender.attack || 0),
    ready: false,
  });
  battle.cpu.lanes[0].support = makeSupport(ward, 'ward-support', { durability: Math.max(2, ward.durability || 2) });
  const attackValue = passiveAttacker.attack || 0;
  const firstHealth = battle.cpu.lanes[0].unit.health;
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'First DAMAGE_WARD combat must resolve');
  const afterFirst = result.battle.cpu.lanes[0].unit.health;
  assert.equal(firstHealth - afterFirst, Math.max(0, attackValue - ward.amount), 'DAMAGE_WARD must reduce the first damage');
  battle = result.battle;
  battle.player.lanes[0].unit.ready = true;
  result = attackPlacementLane(battle, 'player', 0);
  assert(result.ok, 'Second DAMAGE_WARD combat must resolve');
  assert.equal(afterFirst - result.battle.cpu.lanes[0].unit.health, attackValue, 'DAMAGE_WARD must not reduce the second damage in the same opposing turn');

  // A failed once-per-turn condition must not consume the trigger for later in that turn.
  const onceCard = passiveAttacker;
  const originalOnceProgram = onceCard.effectProgram;
  onceCard.effectProgram = {
    id: 'TEST_ONCE_CONDITION',
    trigger: 'ATTACK',
    resetRule: 'ONCE_PER_TURN',
    memoryKey: 'test:once-condition',
    steps: [{ action: 'BUFF_ATTACK', target: 'SELF', condition: 'SP_LEAD', amount: 5, duration: 0, label: 'test' }],
    legacyEffect: onceCard.effect,
    identityNote: 'Regression fixture',
    normalizedSignature: 'TEST_ONCE_CONDITION',
    tags: ['TEST'],
    edition: onceCard.edition,
    kind: onceCard.kind,
  };
  try {
    battle = createPlacementBattle(starter, 0, 14);
    battle.player.lanes = blankBoard();
    battle.cpu.lanes = blankBoard();
    battle.player.lanes[0].unit = makeUnit(onceCard, 'once-attacker', { health: 99, ready: true });
    battle.cpu.lanes[0].unit = makeUnit(defender, 'once-defender', {
      health: 99,
      attackBonus: -(defender.attack || 0),
      ready: false,
    });
    battle.player.sp = 0;
    battle.cpu.sp = 8;
    result = attackPlacementLane(battle, 'player', 0);
    assert(result.ok);
    assert.equal(result.battle.player.lanes[0].unit.attackBonus, 0, 'Failed condition must not apply the effect');
    battle = result.battle;
    battle.player.lanes[0].unit.ready = true;
    battle.player.sp = 8;
    battle.cpu.sp = 0;
    result = attackPlacementLane(battle, 'player', 0);
    assert(result.ok);
    assert.equal(result.battle.player.lanes[0].unit.attackBonus, 5, 'Failed condition must not consume ONCE_PER_TURN');
  } finally {
    onceCard.effectProgram = originalOnceProgram;
  }

  // EVENT ONCE_PER_BATTLE belongs to the card effect, not each play instance.
  const onceEvent = PLACEMENT_TCG_CARDS.find(card => card.kind === 'EVENT');
  assert(onceEvent, 'EVENT regression fixture must exist');
  const originalEvent = {
    spCost: onceEvent.spCost,
    effect: onceEvent.effect,
    amount: onceEvent.amount,
    effectProgram: onceEvent.effectProgram,
  };
  onceEvent.spCost = 0;
  onceEvent.effect = 'EVENT_DRAW';
  onceEvent.amount = 1;
  onceEvent.effectProgram = {
    id: 'TEST_EVENT_ONCE',
    trigger: 'EVENT_PLAY',
    resetRule: 'ONCE_PER_BATTLE',
    memoryKey: 'test:event-once',
    steps: [{ action: 'GAIN_SP', target: 'SELF', condition: 'ALWAYS', amount: 1, duration: 0, label: 'test' }],
    legacyEffect: 'EVENT_DRAW',
    identityNote: 'Regression fixture',
    normalizedSignature: 'TEST_EVENT_ONCE',
    tags: ['TEST'],
    edition: onceEvent.edition,
    kind: onceEvent.kind,
  };
  try {
    battle = createPlacementBattle(starter, 0, 15);
    battle.player.lanes = blankBoard();
    battle.cpu.lanes = blankBoard();
    battle.player.sp = 0;
    battle.player.hand = [onceEvent.id];
    battle.player.deck = [];
    battle.player.discard = [];
    result = playPlacementCard(battle, 'player', 0, 0);
    assert(result.ok);
    assert.equal(result.battle.player.sp, 1, 'First EVENT play must resolve its once-per-battle effect');
    battle = result.battle;
    battle.player.hand = [onceEvent.id];
    result = playPlacementCard(battle, 'player', 0, 0);
    assert(result.ok);
    assert.equal(result.battle.player.sp, 1, 'Second copy must share the same ONCE_PER_BATTLE slot');
  } finally {
    onceEvent.spCost = originalEvent.spCost;
    onceEvent.effect = originalEvent.effect;
    onceEvent.amount = originalEvent.amount;
    onceEvent.effectProgram = originalEvent.effectProgram;
  }

  // BREAK_SUPPORT ENEMY_ANY must find a lane that has Support even when it has no Unit.
  const breakEvent = PLACEMENT_TCG_CARDS.find(card => card.kind === 'EVENT');
  const supportTarget = PLACEMENT_TCG_CARDS.find(card => card.kind === 'SUPPORT');
  assert(breakEvent && supportTarget);
  const originalBreakEvent = {
    spCost: breakEvent.spCost,
    effect: breakEvent.effect,
    amount: breakEvent.amount,
    effectProgram: breakEvent.effectProgram,
  };
  breakEvent.spCost = 0;
  breakEvent.effect = 'EVENT_DRAW';
  breakEvent.amount = 1;
  breakEvent.effectProgram = {
    id: 'TEST_BREAK_SUPPORT',
    trigger: 'EVENT_PLAY',
    resetRule: 'EVERY_TRIGGER',
    memoryKey: 'test:break-support',
    steps: [{ action: 'BREAK_SUPPORT', target: 'ENEMY_ANY', condition: 'ALWAYS', amount: 1, duration: 0, label: 'test' }],
    legacyEffect: 'EVENT_DRAW',
    identityNote: 'Regression fixture',
    normalizedSignature: 'TEST_BREAK_SUPPORT',
    tags: ['TEST'],
    edition: breakEvent.edition,
    kind: breakEvent.kind,
  };
  try {
    battle = createPlacementBattle(starter, 0, 16);
    battle.player.lanes = blankBoard();
    battle.cpu.lanes = blankBoard();
    battle.player.sp = 0;
    battle.player.hand = [breakEvent.id];
    battle.player.deck = [];
    battle.player.discard = [];
    battle.cpu.lanes[2].support = makeSupport(supportTarget, 'support-only', { durability: 3 });
    result = playPlacementCard(battle, 'player', 0, 0);
    assert(result.ok);
    assert.equal(result.battle.cpu.lanes[2].support?.durability, 2, 'BREAK_SUPPORT ENEMY_ANY must hit a Support-only lane');
  } finally {
    breakEvent.spCost = originalBreakEvent.spCost;
    breakEvent.effect = originalBreakEvent.effect;
    breakEvent.amount = originalBreakEvent.amount;
    breakEvent.effectProgram = originalBreakEvent.effectProgram;
  }

  // ALLY_DEFEATED must fire from Support after the allied Unit leaves the lane.
  const allyDefeatSupport = PLACEMENT_TCG_CARDS.find(card => card.kind === 'SUPPORT');
  assert(allyDefeatSupport);
  const originalAllyDefeatSupport = {
    effect: allyDefeatSupport.effect,
    effectProgram: allyDefeatSupport.effectProgram,
  };
  allyDefeatSupport.effect = 'ATTACK_AURA';
  allyDefeatSupport.effectProgram = {
    id: 'TEST_ALLY_DEFEATED',
    trigger: 'ALLY_DEFEATED',
    resetRule: 'ONCE_PER_TURN',
    memoryKey: 'test:ally-defeated',
    steps: [{ action: 'DRAW', target: 'SELF', condition: 'ALWAYS', amount: 1, duration: 0, label: 'test' }],
    legacyEffect: 'ATTACK_AURA',
    identityNote: 'Regression fixture',
    normalizedSignature: 'TEST_ALLY_DEFEATED',
    tags: ['TEST'],
    edition: allyDefeatSupport.edition,
    kind: allyDefeatSupport.kind,
  };
  try {
    battle = createPlacementBattle(starter, 0, 17);
    battle.turn = 'CPU';
    battle.player.lanes = blankBoard();
    battle.cpu.lanes = blankBoard();
    battle.player.hand = [];
    battle.player.deck = [passiveAttacker.id];
    battle.player.discard = [];
    battle.player.lanes[0].unit = makeUnit(defender, 'ally-defeat-target', { health: 1, ready: false });
    battle.player.lanes[0].support = makeSupport(allyDefeatSupport, 'ally-defeat-support');
    battle.cpu.lanes[0].unit = makeUnit(passiveAttacker, 'ally-defeat-attacker', { health: 99, ready: true });
    result = attackPlacementLane(battle, 'cpu', 0);
    assert(result.ok);
    assert.equal(result.battle.player.lanes[0].unit, null, 'Fixture Unit must be defeated');
    assert.equal(result.battle.player.hand.length, 1, 'ALLY_DEFEATED Support effect must resolve after the Unit leaves play');
  } finally {
    allyDefeatSupport.effect = originalAllyDefeatSupport.effect;
    allyDefeatSupport.effectProgram = originalAllyDefeatSupport.effectProgram;
  }

  // Remote Event damage must not credit a same-lane KILL_DRAW Unit as the killer.
  const remoteEvent = PLACEMENT_TCG_CARDS.find(card => card.kind === 'EVENT');
  assert(remoteEvent && killer);
  const originalRemoteEvent = {
    spCost: remoteEvent.spCost,
    effect: remoteEvent.effect,
    amount: remoteEvent.amount,
    effectProgram: remoteEvent.effectProgram,
  };
  remoteEvent.spCost = 0;
  remoteEvent.effect = 'EVENT_DAMAGE';
  remoteEvent.amount = 1;
  remoteEvent.effectProgram = {
    id: 'TEST_REMOTE_KILL',
    trigger: 'EVENT_PLAY',
    resetRule: 'EVERY_TRIGGER',
    memoryKey: 'test:remote-kill',
    steps: [{ action: 'GAIN_SP', target: 'SELF', condition: 'ALWAYS', amount: 1, duration: 0, label: 'test' }],
    legacyEffect: 'EVENT_DAMAGE',
    identityNote: 'Regression fixture',
    normalizedSignature: 'TEST_REMOTE_KILL',
    tags: ['TEST'],
    edition: remoteEvent.edition,
    kind: remoteEvent.kind,
  };
  try {
    battle = createPlacementBattle(starter, 0, 18);
    battle.player.lanes = blankBoard();
    battle.cpu.lanes = blankBoard();
    battle.player.sp = 0;
    battle.player.hand = [remoteEvent.id];
    battle.player.deck = [passiveAttacker.id];
    battle.player.discard = [];
    battle.player.lanes[0].unit = makeUnit(killer, 'remote-kill-bystander', { health: 99, ready: false });
    battle.cpu.lanes[0].unit = makeUnit(defender, 'remote-kill-target', { health: 1, ready: false });
    result = playPlacementCard(battle, 'player', 0, 0);
    assert(result.ok);
    assert.equal(result.battle.cpu.lanes[0].unit, null, 'Remote Event must defeat the target Unit');
    assert.equal(result.battle.player.hand.length, 0, 'Remote Event kill must not trigger KILL_DRAW on a bystander Unit');
  } finally {
    remoteEvent.spCost = originalRemoteEvent.spCost;
    remoteEvent.effect = originalRemoteEvent.effect;
    remoteEvent.amount = originalRemoteEvent.amount;
    remoteEvent.effectProgram = originalRemoteEvent.effectProgram;
  }

  assert.equal(PLACEMENT_TCG_CARD_MAP.size, 584);
  console.log('Placement TCG regression suite passed: catalog, decks, and Phase 0 effect semantics.');
} finally {
  await server.close();
}
