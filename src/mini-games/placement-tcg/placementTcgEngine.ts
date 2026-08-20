import {
  PLACEMENT_TCG_CARD_MAP,
  PLACEMENT_TCG_CARDS,
  PLACEMENT_TCG_REWARD_POOL,
  PLACEMENT_TCG_STARTER_DECK,
  type PlacementCardDefinition,
} from './placementTcgCards';
import {
  createPlacementTcgOpponents,
  createSeededRandom,
  getPlacementTcgOpponent,
  seededShuffle,
  type PlacementTcgOpponent,
} from './placementTcgOpponents';

export type PlacementSideKey = 'player' | 'cpu';
export type PlacementTurn = 'PLAYER' | 'CPU';

export interface PlacementUnit {
  uid: string;
  cardId: string;
  health: number;
  attackBonus: number;
  healthBonus: number;
  shield: number;
  ready: boolean;
  stunned: boolean;
}

export interface PlacementSupport {
  uid: string;
  cardId: string;
  durability: number;
}

export interface PlacementLane {
  unit: PlacementUnit | null;
  support: PlacementSupport | null;
}

export interface PlacementSide {
  life: number;
  maxSp: number;
  sp: number;
  deck: string[];
  hand: string[];
  discard: string[];
  lanes: PlacementLane[];
}

export interface PlacementBattle {
  turn: PlacementTurn;
  turnNumber: number;
  player: PlacementSide;
  cpu: PlacementSide;
  winner: PlacementSideKey | null;
  log: string[];
  serial: number;
}

export interface PlacementRun {
  version: 1;
  seed: number;
  battleIndex: number;
  wins: number;
  deck: string[];
  opponentIds: string[];
  rewardHistory: string[];
}

export interface PlacementPlayResult {
  battle: PlacementBattle;
  ok: boolean;
  message?: string;
}

export const PLACEMENT_TCG_SAVE_KEY = 'learning_rogue_placement_tcg_run_v1';
export const PLACEMENT_TCG_LANE_COUNT = 3;
export const PLACEMENT_TCG_LIFE = 20;
const HAND_LIMIT = 9;

const emptyLanes = (): PlacementLane[] =>
  Array.from({ length: PLACEMENT_TCG_LANE_COUNT }, () => ({ unit: null, support: null }));

const cloneBattle = (battle: PlacementBattle): PlacementBattle =>
  JSON.parse(JSON.stringify(battle)) as PlacementBattle;

const cardOf = (cardId: string): PlacementCardDefinition | null =>
  PLACEMENT_TCG_CARD_MAP.get(cardId) || null;

const appendLog = (battle: PlacementBattle, message: string) => {
  battle.log = [message, ...battle.log].slice(0, 8);
};

const shuffleWithSeed = (items: string[], seed: number): string[] =>
  seededShuffle(items, seed);

const drawOne = (battle: PlacementBattle, sideKey: PlacementSideKey): string | null => {
  const side = battle[sideKey];
  if (side.hand.length >= HAND_LIMIT) return null;
  if (side.deck.length === 0 && side.discard.length > 0) {
    side.deck = shuffleWithSeed(side.discard, battle.serial * 97 + battle.turnNumber * 17);
    side.discard = [];
  }
  const cardId = side.deck.shift() || null;
  if (cardId) side.hand.push(cardId);
  return cardId;
};

const drawCards = (battle: PlacementBattle, sideKey: PlacementSideKey, count: number) => {
  for (let index = 0; index < count; index += 1) drawOne(battle, sideKey);
};

const unitCard = (unit: PlacementUnit | null): PlacementCardDefinition | null =>
  unit ? cardOf(unit.cardId) : null;

const supportCard = (support: PlacementSupport | null): PlacementCardDefinition | null =>
  support ? cardOf(support.cardId) : null;

export const getUnitAttack = (lane: PlacementLane, laneIndex: number): number => {
  if (!lane.unit) return 0;
  const card = unitCard(lane.unit);
  if (!card) return 0;
  let attack = (card.attack || 0) + lane.unit.attackBonus;
  const support = supportCard(lane.support);
  if (support?.effect === 'ATTACK_AURA') attack += support.amount;
  if (card.effect === 'SUPPORT_BOND' && lane.support) attack += card.amount;
  if (card.effect === 'CENTER_POWER' && laneIndex === 1) attack += card.amount;
  return Math.max(0, attack);
};

export const getUnitMaxHealth = (lane: PlacementLane, laneIndex: number): number => {
  if (!lane.unit) return 0;
  const card = unitCard(lane.unit);
  if (!card) return 0;
  let health = (card.health || 1) + lane.unit.healthBonus;
  const support = supportCard(lane.support);
  if (support?.effect === 'HEALTH_AURA') health += support.amount;
  if (card.effect === 'CENTER_POWER' && laneIndex === 1) health += card.amount;
  return Math.max(1, health);
};

const healUnit = (lane: PlacementLane, laneIndex: number, amount: number) => {
  if (!lane.unit) return;
  lane.unit.health = Math.min(getUnitMaxHealth(lane, laneIndex), lane.unit.health + amount);
};

const clearDefeated = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  defeatedBy: PlacementSideKey | null,
) => {
  const side = battle[sideKey];
  const lane = side.lanes[laneIndex];
  if (!lane.unit || lane.unit.health > 0) return;
  const defeated = cardOf(lane.unit.cardId);
  side.discard.push(lane.unit.cardId);
  lane.unit = null;
  appendLog(battle, (defeated?.name || 'ユニット') + 'が退場');
  const support = supportCard(lane.support);
  if (support?.effect === 'DRAW_ON_DEFEAT' && lane.support) {
    drawOne(battle, sideKey);
    lane.support.durability -= 1;
  }
  if (defeatedBy) {
    const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
    const attacker = battle[enemyKey].lanes[laneIndex].unit;
    if (attacker && unitCard(attacker)?.effect === 'KILL_DRAW') drawOne(battle, defeatedBy);
  }
  if (lane.support && lane.support.durability <= 0) {
    side.discard.push(lane.support.cardId);
    lane.support = null;
  }
};

const damageUnit = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  amount: number,
  sourceSide: PlacementSideKey | null,
  combat = false,
): number => {
  const lane = battle[sideKey].lanes[laneIndex];
  if (!lane.unit) return 0;
  let damage = Math.max(0, amount);
  if (lane.unit.shield > 0) {
    const absorbed = Math.min(lane.unit.shield, damage);
    lane.unit.shield -= absorbed;
    damage -= absorbed;
  }
  const support = supportCard(lane.support);
  if (support?.effect === 'DAMAGE_WARD' && lane.support && lane.support.durability > 0) {
    damage = Math.max(0, damage - support.amount);
    lane.support.durability -= 1;
  }
  lane.unit.health -= damage;
  const damagedCard = unitCard(lane.unit);
  if (combat && sourceSide && damagedCard?.effect === 'THORNS') {
    const sourceLane = battle[sourceSide].lanes[laneIndex];
    if (sourceLane.unit) {
      sourceLane.unit.health -= damagedCard.amount;
      clearDefeated(battle, sourceSide, laneIndex, sideKey);
    }
  }
  clearDefeated(battle, sideKey, laneIndex, sourceSide);
  return damage;
};

const checkWinner = (battle: PlacementBattle) => {
  if (battle.cpu.life <= 0) battle.winner = 'player';
  if (battle.player.life <= 0) battle.winner = 'cpu';
};

const createSide = (deck: string[], seed: number): PlacementSide => ({
  life: PLACEMENT_TCG_LIFE,
  maxSp: 1,
  sp: 1,
  deck: shuffleWithSeed(deck, seed),
  hand: [],
  discard: [],
  lanes: emptyLanes(),
});

export const createCpuDeck = (battleIndex: number, seed: number): string[] => {
  const start = Math.min(155, 20 + battleIndex * 14);
  const pool = PLACEMENT_TCG_CARDS.slice(0, start + 25).map(card => card.id);
  const selected = seededShuffle(pool, seed + battleIndex * 101).slice(0, 20 + Math.min(8, battleIndex));
  return selected.length >= 20 ? selected : [...PLACEMENT_TCG_STARTER_DECK];
};

export const createPlacementBattle = (
  playerDeck: string[],
  battleIndex: number,
  seed: number,
): PlacementBattle => {
  const battle: PlacementBattle = {
    turn: 'PLAYER',
    turnNumber: 1,
    player: createSide(playerDeck, seed + 11),
    cpu: createSide(createCpuDeck(battleIndex, seed + 29), seed + 47),
    winner: null,
    log: ['デュエル開始。カードを選び、配置先のレーンを選択。'],
    serial: 1,
  };
  drawCards(battle, 'player', 5);
  drawCards(battle, 'cpu', 5);
  return battle;
};

const makeUnit = (battle: PlacementBattle, card: PlacementCardDefinition): PlacementUnit => ({
  uid: 'unit-' + battle.serial++,
  cardId: card.id,
  health: card.health || 1,
  attackBonus: 0,
  healthBonus: 0,
  shield: 0,
  ready: card.effect === 'RUSH',
  stunned: false,
});

const makeSupport = (battle: PlacementBattle, card: PlacementCardDefinition): PlacementSupport => ({
  uid: 'support-' + battle.serial++,
  cardId: card.id,
  durability: card.durability || 2,
});

const resolveDeploy = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  card: PlacementCardDefinition,
) => {
  const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
  if (card.effect === 'DEPLOY_DAMAGE') damageUnit(battle, enemyKey, laneIndex, card.amount, sideKey);
  if (card.effect === 'DEPLOY_HEAL') {
    const side = battle[sideKey];
    const targetIndex = side.lanes.findIndex(lane => lane.unit && lane !== side.lanes[laneIndex]);
    healUnit(side.lanes[targetIndex >= 0 ? targetIndex : laneIndex], targetIndex >= 0 ? targetIndex : laneIndex, card.amount);
  }
};

const resolveEvent = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  card: PlacementCardDefinition,
): boolean => {
  const side = battle[sideKey];
  const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
  const enemy = battle[enemyKey];
  const ownLane = side.lanes[laneIndex];
  const enemyLane = enemy.lanes[laneIndex];
  if (card.effect === 'EVENT_DAMAGE') {
    if (!enemyLane.unit) return false;
    damageUnit(battle, enemyKey, laneIndex, card.amount + 1, sideKey);
  } else if (card.effect === 'EVENT_DRAW') {
    drawCards(battle, sideKey, Math.min(2, card.amount));
  } else if (card.effect === 'EVENT_HEAL') {
    if (!ownLane.unit) return false;
    healUnit(ownLane, laneIndex, card.amount + 2);
  } else if (card.effect === 'EVENT_BUFF') {
    if (!ownLane.unit) return false;
    ownLane.unit.attackBonus += card.amount;
    ownLane.unit.healthBonus += card.amount;
    ownLane.unit.health += card.amount;
  } else if (card.effect === 'EVENT_MOVE') {
    if (!ownLane.unit) return false;
    const targetIndex = [laneIndex - 1, laneIndex + 1].find(
      index => index >= 0 && index < PLACEMENT_TCG_LANE_COUNT && !side.lanes[index].unit,
    );
    if (targetIndex === undefined) return false;
    side.lanes[targetIndex].unit = ownLane.unit;
    side.lanes[targetIndex].unit!.ready = true;
    ownLane.unit = null;
  } else if (card.effect === 'EVENT_STUN') {
    if (!enemyLane.unit) return false;
    enemyLane.unit.stunned = true;
  } else if (card.effect === 'EVENT_BREAK') {
    if (!enemyLane.support) return false;
    enemyLane.support.durability -= card.amount;
    if (enemyLane.support.durability <= 0) {
      enemy.discard.push(enemyLane.support.cardId);
      enemyLane.support = null;
    }
  } else if (card.effect === 'EVENT_BOUNCE') {
    if (!enemyLane.unit) return false;
    const targetCard = unitCard(enemyLane.unit);
    if (!targetCard || targetCard.spCost > 3 || enemy.hand.length >= HAND_LIMIT) return false;
    enemy.hand.push(enemyLane.unit.cardId);
    enemyLane.unit = null;
  } else if (card.effect === 'EVENT_ENERGY') {
    side.sp = Math.min(8, side.sp + card.amount);
  } else if (card.effect === 'EVENT_SHIELD') {
    if (!ownLane.unit) return false;
    ownLane.unit.shield += card.amount + 1;
  }
  return true;
};

export const playPlacementCard = (
  source: PlacementBattle,
  sideKey: PlacementSideKey,
  handIndex: number,
  laneIndex: number,
): PlacementPlayResult => {
  const battle = cloneBattle(source);
  if (battle.winner) return { battle: source, ok: false, message: '勝敗が決まっています。' };
  if ((sideKey === 'player' && battle.turn !== 'PLAYER') || (sideKey === 'cpu' && battle.turn !== 'CPU')) {
    return { battle: source, ok: false, message: '相手のターンです。' };
  }
  const side = battle[sideKey];
  const cardId = side.hand[handIndex];
  const card = cardId ? cardOf(cardId) : null;
  if (!card || laneIndex < 0 || laneIndex >= PLACEMENT_TCG_LANE_COUNT) {
    return { battle: source, ok: false, message: 'カードかレーンを選び直してください。' };
  }
  if (card.spCost > side.sp) return { battle: source, ok: false, message: 'SPが足りません。' };
  const lane = side.lanes[laneIndex];
  if (card.kind === 'UNIT' && lane.unit) return { battle: source, ok: false, message: 'ユニット枠が埋まっています。' };
  if (card.kind === 'SUPPORT' && lane.support) return { battle: source, ok: false, message: 'サポート枠が埋まっています。' };
  side.sp -= card.spCost;
  side.hand.splice(handIndex, 1);
  if (card.kind === 'UNIT') {
    lane.unit = makeUnit(battle, card);
    resolveDeploy(battle, sideKey, laneIndex, card);
  } else if (card.kind === 'SUPPORT') {
    lane.support = makeSupport(battle, card);
  } else {
    if (!resolveEvent(battle, sideKey, laneIndex, card)) {
      return { battle: source, ok: false, message: 'この効果の対象がいません。' };
    }
    side.discard.push(card.id);
  }
  appendLog(battle, (sideKey === 'player' ? 'あなた' : 'CPU') + '：' + card.name + 'を使用');
  checkWinner(battle);
  return { battle, ok: true };
};

export const attackPlacementLane = (
  source: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
): PlacementPlayResult => {
  const battle = cloneBattle(source);
  const turnMatches = (sideKey === 'player' && battle.turn === 'PLAYER') || (sideKey === 'cpu' && battle.turn === 'CPU');
  const ownLane = battle[sideKey].lanes[laneIndex];
  if (!turnMatches || battle.winner || !ownLane?.unit || !ownLane.unit.ready || ownLane.unit.stunned) {
    return { battle: source, ok: false, message: 'このユニットは攻撃できません。' };
  }
  const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
  const enemyLane = battle[enemyKey].lanes[laneIndex];
  const attackerCard = unitCard(ownLane.unit);
  const attack = getUnitAttack(ownLane, laneIndex);
  ownLane.unit.ready = false;
  if (enemyLane.unit) {
    const defenderAttack = getUnitAttack(enemyLane, laneIndex);
    const defenderHealthBefore = enemyLane.unit.health + enemyLane.unit.shield;
    damageUnit(battle, enemyKey, laneIndex, attack, sideKey, true);
    if (ownLane.unit) damageUnit(battle, sideKey, laneIndex, defenderAttack, enemyKey, true);
    if (attackerCard?.effect === 'PIERCE' && attack > defenderHealthBefore) {
      battle[enemyKey].life -= Math.min(attackerCard.amount, attack - defenderHealthBefore);
    }
  } else {
    battle[enemyKey].life -= attack;
    if (attackerCard?.effect === 'DIRECT_HEAL') {
      battle[sideKey].life = Math.min(PLACEMENT_TCG_LIFE, battle[sideKey].life + attackerCard.amount);
    }
  }
  appendLog(battle, (attackerCard?.name || 'ユニット') + 'がレーン' + (laneIndex + 1) + 'を攻撃');
  checkWinner(battle);
  return { battle, ok: true };
};

const prepareTurn = (battle: PlacementBattle, sideKey: PlacementSideKey) => {
  const side = battle[sideKey];
  side.maxSp = Math.min(8, side.maxSp + 1);
  side.sp = side.maxSp;
  side.lanes.forEach((lane, laneIndex) => {
    if (lane.unit) {
      if (lane.unit.stunned) {
        lane.unit.stunned = false;
        lane.unit.ready = false;
      } else {
        lane.unit.ready = true;
      }
    }
    const support = supportCard(lane.support);
    if (support?.effect === 'TURN_HEAL') healUnit(lane, laneIndex, support.amount);
  });
  drawOne(battle, sideKey);
};

const finishTurnEffects = (battle: PlacementBattle, sideKey: PlacementSideKey) => {
  battle[sideKey].lanes.forEach((lane, laneIndex) => {
    const card = unitCard(lane.unit);
    if (card?.effect === 'REGEN') healUnit(lane, laneIndex, card.amount);
  });
};

export const endPlayerTurn = (source: PlacementBattle): PlacementBattle => {
  if (source.turn !== 'PLAYER' || source.winner) return source;
  const battle = cloneBattle(source);
  finishTurnEffects(battle, 'player');
  battle.turn = 'CPU';
  prepareTurn(battle, 'cpu');
  appendLog(battle, 'CPU TURN');
  return battle;
};

export const runCpuTurn = (source: PlacementBattle): PlacementBattle => {
  if (source.turn !== 'CPU' || source.winner) return source;
  let battle = cloneBattle(source);
  for (let move = 0; move < 6; move += 1) {
    const affordable = battle.cpu.hand
      .map((cardId, index) => ({ card: cardOf(cardId), index }))
      .filter(item => item.card && item.card.spCost <= battle.cpu.sp)
      .sort((left, right) => (right.card?.spCost || 0) - (left.card?.spCost || 0));
    let played = false;
    for (const item of affordable) {
      const lanes = [0, 1, 2].sort((left, right) => {
        const leftPressure = battle.player.lanes[left].unit ? 2 : 0;
        const rightPressure = battle.player.lanes[right].unit ? 2 : 0;
        return rightPressure - leftPressure;
      });
      for (const laneIndex of lanes) {
        const result = playPlacementCard(battle, 'cpu', item.index, laneIndex);
        if (result.ok) {
          battle = result.battle;
          played = true;
          break;
        }
      }
      if (played) break;
    }
    if (!played || battle.winner) break;
  }
  for (let laneIndex = 0; laneIndex < PLACEMENT_TCG_LANE_COUNT; laneIndex += 1) {
    const result = attackPlacementLane(battle, 'cpu', laneIndex);
    if (result.ok) battle = result.battle;
    if (battle.winner) break;
  }
  if (!battle.winner) {
    finishTurnEffects(battle, 'cpu');
    battle.turn = 'PLAYER';
    battle.turnNumber += 1;
    prepareTurn(battle, 'player');
    appendLog(battle, 'PLAYER TURN');
  }
  return battle;
};

export const createNewPlacementRun = (seed = Date.now()): PlacementRun => ({
  version: 1,
  seed,
  battleIndex: 0,
  wins: 0,
  deck: [...PLACEMENT_TCG_STARTER_DECK],
  opponentIds: createPlacementTcgOpponents(seed).map(opponent => opponent.id),
  rewardHistory: [],
});

export const getCurrentOpponent = (run: PlacementRun): PlacementTcgOpponent =>
  getPlacementTcgOpponent(run.opponentIds[run.battleIndex]) ||
  createPlacementTcgOpponents(run.seed)[Math.min(9, run.battleIndex)];

export const createRewardChoices = (run: PlacementRun): string[] => {
  const owned = new Set(run.deck);
  const pool = PLACEMENT_TCG_REWARD_POOL.filter(cardId => !owned.has(cardId));
  const fallback = pool.length >= 3 ? pool : PLACEMENT_TCG_REWARD_POOL;
  return seededShuffle(fallback, run.seed + run.wins * 7919).slice(0, 3);
};

export const addRewardAndAdvance = (run: PlacementRun, cardId: string): PlacementRun => ({
  ...run,
  battleIndex: Math.min(10, run.battleIndex + 1),
  wins: run.wins + 1,
  deck: [...run.deck, cardId],
  rewardHistory: [...run.rewardHistory, cardId],
});

export const loadPlacementRun = (): PlacementRun | null => {
  try {
    const raw = localStorage.getItem(PLACEMENT_TCG_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PlacementRun;
    if (value.version !== 1 || !Array.isArray(value.deck) || !Array.isArray(value.opponentIds)) return null;
    return value;
  } catch {
    return null;
  }
};

export const savePlacementRun = (run: PlacementRun) => {
  try {
    localStorage.setItem(PLACEMENT_TCG_SAVE_KEY, JSON.stringify(run));
  } catch {
    // Storage can be unavailable in preview/webview contexts.
  }
};

export const clearPlacementRun = () => {
  try {
    localStorage.removeItem(PLACEMENT_TCG_SAVE_KEY);
  } catch {
    // Storage can be unavailable in preview/webview contexts.
  }
};

export const samplePlacementCard = (
  random: ReturnType<typeof createSeededRandom>,
): PlacementCardDefinition =>
  PLACEMENT_TCG_CARDS[Math.floor(random() * PLACEMENT_TCG_CARDS.length)];
