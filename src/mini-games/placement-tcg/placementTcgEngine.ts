import {
  PLACEMENT_TCG_CARD_MAP,
  PLACEMENT_TCG_CARDS,
  PLACEMENT_TCG_EDITION_DECKS,
  PLACEMENT_TCG_REWARD_POOL,
  PLACEMENT_TCG_STARTER_DECK,
  normalizePlacementTcgCardId,
  type PlacementCardDefinition,
  type PlacementEffectKey,
  type PlacementTcgEdition,
} from './placementTcgCards';
import type {
  PlacementEffectAction,
  PlacementEffectCondition,
  PlacementEffectProgram,
  PlacementEffectTarget,
  PlacementEffectTrigger,
} from './placementTcgEffectDsl';
import {
  createPlacementTcgOpponents,
  createSeededRandom,
  getPlacementTcgEndlessOpponent,
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

export type PlacementActionCue = {
  id: number;
  type: 'DEPLOY' | 'ATTACK';
  side: PlacementSideKey;
  laneIndex: number;
  cardId: string;
  effect: PlacementEffectKey;
  amount: number;
  direct?: boolean;
  defeatedCardIds?: string[];
};

export interface PlacementBattle {
  turn: PlacementTurn;
  turnNumber: number;
  player: PlacementSide;
  cpu: PlacementSide;
  winner: PlacementSideKey | null;
  log: string[];
  serial: number;
  lastAction: PlacementActionCue | null;
  /** Per-battle memory slots used by the effect DSL. */
  effectMemory: Record<string, number>;
  effectDepth: number;
}

export interface PlacementRun {
  version: 2;
  seed: number;
  battleIndex: number;
  wins: number;
  deck: string[];
  opponentIds: string[];
  rewardHistory: string[];
  edition: PlacementTcgEdition;
  mode: 'GAUNTLET' | 'ENDLESS';
  endlessFloor: number;
}

export interface PlacementTcgCollection {
  version: 1;
  unlockedCardIds: string[];
  decks: Record<PlacementTcgEdition, string[]>;
  highestEndlessFloor: number;
}

export interface PlacementPlayResult {
  battle: PlacementBattle;
  ok: boolean;
  message?: string;
}

export const PLACEMENT_TCG_SAVE_KEY = 'learning_rogue_placement_tcg_run_v2';
const LEGACY_PLACEMENT_TCG_SAVE_KEY = 'learning_rogue_placement_tcg_run_v1';
export const PLACEMENT_TCG_COLLECTION_KEY = 'learning_rogue_placement_tcg_collection_v1';
export const PLACEMENT_TCG_LANE_COUNT = 3;
export const PLACEMENT_TCG_LIFE = 20;
const HAND_LIMIT = 9;

const emptyLanes = (): PlacementLane[] =>
  Array.from({ length: PLACEMENT_TCG_LANE_COUNT }, () => ({ unit: null, support: null }));

const cloneBattle = (battle: PlacementBattle): PlacementBattle => {
  const cloned = JSON.parse(JSON.stringify(battle)) as PlacementBattle;
  // Runs created before the DSL was introduced do not have memory fields.
  // Normalising here keeps old local saves playable without a migration step.
  cloned.effectMemory = cloned.effectMemory || {};
  cloned.effectDepth = cloned.effectDepth || 0;
  return cloned;
};

const cardOf = (cardId: string): PlacementCardDefinition | null =>
  PLACEMENT_TCG_CARD_MAP.get(cardId) || null;

const appendLog = (battle: PlacementBattle, message: string) => {
  battle.log = [message, ...battle.log].slice(0, 8);
};

const hasEnemyUnit = (battle: PlacementBattle, sideKey: PlacementSideKey, laneIndex?: number) => (
  laneIndex === undefined
    ? battle[sideKey === 'player' ? 'cpu' : 'player'].lanes.some(lane => Boolean(lane.unit))
    : Boolean(battle[sideKey === 'player' ? 'cpu' : 'player'].lanes[laneIndex]?.unit)
);

const hasOwnUnit = (battle: PlacementBattle, sideKey: PlacementSideKey, laneIndex?: number) => (
  laneIndex === undefined
    ? battle[sideKey].lanes.some(lane => Boolean(lane.unit))
    : Boolean(battle[sideKey].lanes[laneIndex]?.unit)
);

const conditionPasses = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  condition: PlacementEffectCondition,
  memoryKey: string,
): boolean => {
  const side = battle[sideKey];
  switch (condition) {
    case 'HAS_ENEMY': return hasEnemyUnit(battle, sideKey, laneIndex) || hasEnemyUnit(battle, sideKey);
    case 'HAS_OWN_UNIT': return hasOwnUnit(battle, sideKey, laneIndex) || hasOwnUnit(battle, sideKey);
    case 'LIFE_BELOW_HALF': return side.life <= PLACEMENT_TCG_LIFE / 2;
    case 'SP_LEAD': return side.sp > battle[sideKey === 'player' ? 'cpu' : 'player'].sp;
    case 'CENTER_LANE': return laneIndex === 1;
    case 'AFTER_MARK': return (battle.effectMemory[`${memoryKey}:mark`] || 0) > 0;
    case 'ODD_TURN': return battle.turnNumber % 2 === 1;
    case 'EMPTY_LANE': return side.lanes.some(lane => !lane.unit);
    default: return true;
  }
};

const laneTargets = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  target: PlacementEffectTarget,
): number[] => {
  const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
  const own = battle[sideKey].lanes;
  const enemy = battle[enemyKey].lanes;
  switch (target) {
    case 'SELF':
    case 'OWN_SAME_LANE':
    case 'ENEMY_SAME_LANE':
    case 'SUPPORT_SAME_LANE':
      return [laneIndex];
    case 'OWN_ANY': {
      const index = own.findIndex(lane => Boolean(lane.unit));
      return index >= 0 ? [index] : [];
    }
    case 'OWN_ALL': return own.map((lane, index) => lane.unit ? index : -1).filter(index => index >= 0);
    case 'ENEMY_ANY': {
      const index = enemy.findIndex(lane => Boolean(lane.unit));
      return index >= 0 ? [index] : [];
    }
    case 'ENEMY_ALL': return enemy.map((lane, index) => lane.unit ? index : -1).filter(index => index >= 0);
    case 'ADJACENT_EMPTY': return [laneIndex - 1, laneIndex + 1].filter(index => index >= 0 && index < PLACEMENT_TCG_LANE_COUNT && !own[index].unit);
    case 'ENEMY_LIFE': return [];
    default: return [];
  }
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
  if (support) runEffectProgram(battle, sideKey, laneIndex, support, 'DEFEAT');
  if (support?.effect === 'DRAW_ON_DEFEAT' && lane.support) {
    drawOne(battle, sideKey);
    lane.support.durability -= 1;
  }
  if (defeatedBy) {
    const enemyKey: PlacementSideKey = sideKey === 'player' ? 'cpu' : 'player';
    const attacker = battle[enemyKey].lanes[laneIndex].unit;
    if (attacker) {
      const attackerCard = unitCard(attacker);
      if (attackerCard?.effect === 'KILL_DRAW') drawOne(battle, defeatedBy);
      if (attackerCard) runEffectProgram(battle, enemyKey, laneIndex, attackerCard, 'DEFEAT');
    }
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
  if (damagedCard && battle[sideKey].lanes[laneIndex]?.unit) {
    runEffectProgram(battle, sideKey, laneIndex, damagedCard, 'DAMAGED');
  }
  return damage;
};

const enemyOf = (sideKey: PlacementSideKey): PlacementSideKey => sideKey === 'player' ? 'cpu' : 'player';

const targetSideFor = (sideKey: PlacementSideKey, target: PlacementEffectTarget): PlacementSideKey => (
  target.startsWith('ENEMY') ? enemyOf(sideKey) : sideKey
);

const applyEffectStep = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  runtimeMemoryKey: string,
  step: {
    action: PlacementEffectAction;
    target: PlacementEffectTarget;
    amount: number;
  },
): boolean => {
  const amount = Math.max(1, step.amount);
  const enemyKey = enemyOf(sideKey);
  const targetSide = targetSideFor(sideKey, step.target);
  const targetLanes = laneTargets(battle, sideKey, laneIndex, step.target);
  const unitTargets = targetLanes.filter(index => Boolean(battle[targetSide].lanes[index]?.unit));

  switch (step.action) {
    case 'DAMAGE': {
      if (step.target === 'ENEMY_LIFE') {
        battle[enemyKey].life = Math.max(0, battle[enemyKey].life - amount);
        return true;
      }
      let changed = false;
      unitTargets.forEach(index => {
        changed = damageUnit(battle, targetSide, index, amount, sideKey) > 0 || changed;
      });
      return changed;
    }
    case 'HEAL': {
      if (step.target === 'ENEMY_LIFE') {
        battle[enemyKey].life = Math.min(PLACEMENT_TCG_LIFE, battle[enemyKey].life + amount);
        return true;
      }
      let changed = false;
      if (step.target === 'SELF' && !battle[sideKey].lanes[laneIndex]?.unit) {
        battle[sideKey].life = Math.min(PLACEMENT_TCG_LIFE, battle[sideKey].life + amount);
        return true;
      }
      unitTargets.forEach(index => {
        const unit = battle[targetSide].lanes[index].unit;
        if (!unit) return;
        const before = unit.health;
        healUnit(battle[targetSide].lanes[index], index, amount);
        changed = unit.health > before || changed;
      });
      return changed;
    }
    case 'DRAW': {
      let changed = false;
      for (let index = 0; index < amount; index += 1) changed = Boolean(drawOne(battle, sideKey)) || changed;
      return changed;
    }
    case 'GAIN_SP': {
      const before = battle[sideKey].sp;
      battle[sideKey].sp = Math.min(8, battle[sideKey].sp + amount);
      return battle[sideKey].sp > before;
    }
    case 'BUFF_ATTACK': {
      let changed = false;
      unitTargets.forEach(index => {
        const unit = battle[targetSide].lanes[index].unit;
        if (!unit) return;
        unit.attackBonus += amount;
        changed = true;
      });
      return changed;
    }
    case 'BUFF_HEALTH': {
      let changed = false;
      unitTargets.forEach(index => {
        const unit = battle[targetSide].lanes[index].unit;
        if (!unit) return;
        unit.healthBonus += amount;
        unit.health += amount;
        changed = true;
      });
      return changed;
    }
    case 'SHIELD': {
      let changed = false;
      unitTargets.forEach(index => {
        const unit = battle[targetSide].lanes[index].unit;
        if (!unit) return;
        unit.shield += amount;
        changed = true;
      });
      return changed;
    }
    case 'STUN': {
      let changed = false;
      unitTargets.forEach(index => {
        const unit = battle[targetSide].lanes[index].unit;
        if (!unit) return;
        unit.stunned = true;
        unit.ready = false;
        changed = true;
      });
      return changed;
    }
    case 'MOVE': {
      const own = battle[sideKey].lanes;
      const sources = step.target === 'ADJACENT_EMPTY'
        ? [laneIndex]
        : targetLanes.filter(index => Boolean(own[index]?.unit));
      for (const sourceIndex of sources) {
        const destination = [sourceIndex - 1, sourceIndex + 1]
          .find(index => index >= 0 && index < PLACEMENT_TCG_LANE_COUNT && !own[index].unit);
        if (destination === undefined || !own[sourceIndex].unit) continue;
        own[destination].unit = own[sourceIndex].unit;
        own[destination].unit!.ready = true;
        own[sourceIndex].unit = null;
        return true;
      }
      return false;
    }
    case 'BREAK_SUPPORT': {
      const supportSide = step.target.startsWith('ENEMY') ? enemyKey : sideKey;
      const indices = step.target === 'SUPPORT_SAME_LANE' ? [laneIndex] : targetLanes;
      for (const index of indices) {
        const lane = battle[supportSide].lanes[index];
        if (!lane.support) continue;
        lane.support.durability -= amount;
        if (lane.support.durability <= 0) {
          battle[supportSide].discard.push(lane.support.cardId);
          lane.support = null;
        }
        return true;
      }
      return false;
    }
    case 'LIFE_DRAIN': {
      const beforeLife = battle[enemyKey].life;
      let changed = false;
      if (step.target === 'ENEMY_LIFE') {
        battle[enemyKey].life = Math.max(0, battle[enemyKey].life - amount);
      } else {
        unitTargets.forEach(index => {
          changed = damageUnit(battle, enemyKey, index, amount, sideKey) > 0 || changed;
        });
      }
      if (battle[enemyKey].life < beforeLife) {
        battle[sideKey].life = Math.min(PLACEMENT_TCG_LIFE, battle[sideKey].life + amount);
        changed = true;
      }
      if (changed && battle[enemyKey].life === beforeLife) {
        battle[sideKey].life = Math.min(PLACEMENT_TCG_LIFE, battle[sideKey].life + amount);
      }
      return changed;
    }
    case 'MARK': {
      const markKey = `${runtimeMemoryKey}:mark`;
      battle.effectMemory[markKey] = (battle.effectMemory[markKey] || 0) + amount;
      return true;
    }
    case 'REORDER_HAND': {
      const hand = battle[sideKey].hand;
      if (hand.length < 2) return false;
      const shift = amount % hand.length;
      battle[sideKey].hand = [...hand.slice(shift), ...hand.slice(0, shift)];
      return true;
    }
    case 'DISCARD': {
      const hand = battle[sideKey].hand;
      if (!hand.length) return false;
      const count = Math.min(amount, hand.length);
      battle[sideKey].discard.push(...hand.splice(hand.length - count, count));
      return count > 0;
    }
    default:
      return false;
  }
};

/** Execute the typed effect program for a single trigger. */
const runEffectProgram = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  card: PlacementCardDefinition,
  trigger: PlacementEffectTrigger,
): boolean => {
  const program = card.effectProgram;
  // A single trigger chain may contain reactive effects (damage -> thorns ->
  // damage). Keep the documented 32-step guard while still allowing a full
  // card's two-step program and nested defeat reactions to resolve.
  if (!program || program.trigger !== trigger || battle.effectDepth >= 32) return false;
  const lane = battle[sideKey].lanes[laneIndex];
  const instanceId = lane?.unit?.cardId === card.id
    ? lane.unit.uid
    : lane?.support?.cardId === card.id
      ? lane.support.uid
      : `play-${battle.serial}`;
  // A copied card gets an independent once-per-turn/battle slot. The program
  // key remains card-unique for audits, while this runtime suffix identifies
  // the physical card instance in the current battle.
  const runtimeMemoryKey = `${program.memoryKey}:${sideKey}:${instanceId}`;
  const usedKey = `${runtimeMemoryKey}:used`;
  const turnKey = `${runtimeMemoryKey}:turn`;
  if (program.resetRule === 'ONCE_PER_BATTLE' && battle.effectMemory[usedKey]) return false;
  if (program.resetRule === 'ONCE_PER_TURN' && battle.effectMemory[turnKey] === battle.turnNumber) return false;
  if (program.resetRule === 'ONCE_PER_BATTLE') battle.effectMemory[usedKey] = 1;
  if (program.resetRule === 'ONCE_PER_TURN') battle.effectMemory[turnKey] = battle.turnNumber;
  battle.effectDepth += 1;
  let changed = false;
  try {
    for (const step of program.steps) {
      if (!conditionPasses(battle, sideKey, laneIndex, step.condition, runtimeMemoryKey)) continue;
      changed = applyEffectStep(battle, sideKey, laneIndex, runtimeMemoryKey, step) || changed;
    }
    if (changed) appendLog(battle, `${card.name}：固有効果`);
    checkWinner(battle);
    return changed;
  } finally {
    battle.effectDepth = Math.max(0, battle.effectDepth - 1);
  }
};

const runFinishEffect = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  laneIndex: number,
  card: PlacementCardDefinition | null,
) => {
  if (card && battle.winner === sideKey) runEffectProgram(battle, sideKey, laneIndex, card, 'FINISH');
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

type CpuDeckArchetype = 'BALANCED' | 'RUSH' | 'CONTROL' | 'FORTRESS' | 'TRICKSTER';

interface CpuDeckDifficultyProfile {
  archetype: CpuDeckArchetype;
  unitSlots: number;
  maxSpCost: number;
  maxTier: number;
  powerCap: number;
  targetPower: number;
}

const CPU_TIER_RANK: Record<PlacementCardDefinition['tier'], number> = {
  STARTER: 0,
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
};

// The first two battles deliberately use low-cost, common cards. Each later
// battle unlocks one more cost/tier band and changes the rival's archetype, so
// opponents have different decks without creating an abrupt opening spike.
const CPU_GAUNTLET_PROFILES: CpuDeckDifficultyProfile[] = [
  { archetype: 'BALANCED', unitSlots: 13, maxSpCost: 2, maxTier: 1, powerCap: 9, targetPower: 6 },
  { archetype: 'RUSH', unitSlots: 15, maxSpCost: 2, maxTier: 1, powerCap: 10, targetPower: 7 },
  { archetype: 'CONTROL', unitSlots: 10, maxSpCost: 3, maxTier: 2, powerCap: 13, targetPower: 9 },
  { archetype: 'FORTRESS', unitSlots: 11, maxSpCost: 3, maxTier: 2, powerCap: 15, targetPower: 10 },
  { archetype: 'TRICKSTER', unitSlots: 12, maxSpCost: 4, maxTier: 2, powerCap: 17, targetPower: 12 },
  { archetype: 'BALANCED', unitSlots: 12, maxSpCost: 4, maxTier: 2, powerCap: 19, targetPower: 14 },
  { archetype: 'RUSH', unitSlots: 14, maxSpCost: 5, maxTier: 3, powerCap: 21, targetPower: 16 },
  { archetype: 'CONTROL', unitSlots: 10, maxSpCost: 5, maxTier: 3, powerCap: 23, targetPower: 18 },
  { archetype: 'FORTRESS', unitSlots: 11, maxSpCost: 5, maxTier: 3, powerCap: 25, targetPower: 20 },
  { archetype: 'TRICKSTER', unitSlots: 12, maxSpCost: 5, maxTier: 3, powerCap: 27, targetPower: 22 },
];

const cpuEndlessProfile = (battleIndex: number): CpuDeckDifficultyProfile => {
  const floor = Math.max(0, battleIndex - CPU_GAUNTLET_PROFILES.length);
  return {
    archetype: CPU_GAUNTLET_PROFILES[floor % CPU_GAUNTLET_PROFILES.length].archetype,
    unitSlots: 10 + (floor % 3),
    maxSpCost: 5,
    maxTier: 3,
    powerCap: Math.min(36, 28 + Math.floor(floor / 2)),
    targetPower: Math.min(32, 23 + floor),
  };
};

const cpuCardPower = (card: PlacementCardDefinition): number => (
  card.spCost * 2 + (card.attack || 0) + (card.health || 0) + (card.durability || 0) + card.amount
);

const cpuArchetypeBias = (card: PlacementCardDefinition, archetype: CpuDeckArchetype): number => {
  if (archetype === 'RUSH') return card.kind === 'UNIT' && card.spCost <= 2 ? 4 : card.kind === 'UNIT' ? 1 : 0;
  if (archetype === 'CONTROL') return card.kind === 'EVENT' ? 4 : card.kind === 'SUPPORT' ? 2 : 0;
  if (archetype === 'FORTRESS') return card.kind === 'SUPPORT' ? 4 : card.kind === 'UNIT' && (card.health || 0) >= 6 ? 2 : 0;
  if (archetype === 'TRICKSTER') return card.kind === 'EVENT' || card.effectProgram.trigger === 'EVENT_PLAY' ? 3 : 0;
  return card.kind === 'UNIT' ? 2 : 1;
};

const pickCpuCards = (
  cards: PlacementCardDefinition[],
  count: number,
  profile: CpuDeckDifficultyProfile,
  seed: number,
): PlacementCardDefinition[] => {
  const eligible = cards.filter(card => (
    card.spCost <= profile.maxSpCost
    && CPU_TIER_RANK[card.tier] <= profile.maxTier
    && cpuCardPower(card) <= profile.powerCap
  ));
  const relaxed = cards.filter(card => card.spCost <= profile.maxSpCost && CPU_TIER_RANK[card.tier] <= profile.maxTier);
  const source = eligible.length >= count ? eligible : relaxed;
  return seededShuffle(source, seed)
    .sort((left, right) => {
      const leftPriority = cpuArchetypeBias(left, profile.archetype);
      const rightPriority = cpuArchetypeBias(right, profile.archetype);
      if (leftPriority !== rightPriority) return rightPriority - leftPriority;
      const leftDistance = Math.abs(cpuCardPower(left) - profile.targetPower);
      const rightDistance = Math.abs(cpuCardPower(right) - profile.targetPower);
      return leftDistance - rightDistance;
    })
    .slice(0, count);
};

export const createCpuDeck = (battleIndex: number, seed: number): string[] => {
  const index = Math.max(0, battleIndex);
  const profile = CPU_GAUNTLET_PROFILES[index] || cpuEndlessProfile(index);
  const unitPool = PLACEMENT_TCG_CARDS.filter(card => card.kind === 'UNIT');
  const tacticPool = PLACEMENT_TCG_CARDS.filter(card => card.kind !== 'UNIT');
  const units = pickCpuCards(unitPool, profile.unitSlots, profile, seed + index * 101);
  const tactics = pickCpuCards(tacticPool, 20 - profile.unitSlots, profile, seed + index * 211);
  const selected = seededShuffle([...units, ...tactics].map(card => card.id), seed + index * 307);
  return selected.length >= 20 ? selected.slice(0, 20) : [...PLACEMENT_TCG_STARTER_DECK];
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
    lastAction: null,
    effectMemory: {},
    effectDepth: 0,
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

const resolveSignature = (
  battle: PlacementBattle,
  sideKey: PlacementSideKey,
  playedLaneIndex: number,
  card: PlacementCardDefinition,
) => {
  const trigger: PlacementEffectTrigger = card.kind === 'EVENT' ? 'EVENT_PLAY' : 'DEPLOY';
  runEffectProgram(battle, sideKey, playedLaneIndex, card, trigger);
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
  resolveSignature(battle, sideKey, laneIndex, card);
  appendLog(battle, (sideKey === 'player' ? 'あなた' : 'CPU') + '：' + card.name + 'を使用');
  battle.lastAction = {
    id: battle.serial++,
    type: 'DEPLOY',
    side: sideKey,
    laneIndex,
    cardId: card.id,
    effect: card.effect,
    amount: card.amount,
  };
  checkWinner(battle);
  runFinishEffect(battle, sideKey, laneIndex, card);
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
  const attackerCardId = ownLane.unit.cardId;
  const attack = getUnitAttack(ownLane, laneIndex);
  const hadDefender = Boolean(enemyLane.unit);
  const defenderCardId = enemyLane.unit?.cardId;
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
  if (attackerCard) {
    runEffectProgram(battle, sideKey, laneIndex, attackerCard, hadDefender ? 'ATTACK' : 'DIRECT_ATTACK');
  }
  appendLog(battle, (attackerCard?.name || 'ユニット') + 'がレーン' + (laneIndex + 1) + 'を攻撃');
  battle.lastAction = {
    id: battle.serial++,
    type: 'ATTACK',
    side: sideKey,
    laneIndex,
    cardId: attackerCard?.id || '',
    effect: attackerCard?.effect || 'PIERCE',
    amount: attack,
    direct: !hadDefender,
    defeatedCardIds: [
      defenderCardId && !battle[enemyKey].lanes[laneIndex].unit ? defenderCardId : null,
      attackerCardId && !battle[sideKey].lanes[laneIndex].unit ? attackerCardId : null,
    ].filter((cardId): cardId is string => Boolean(cardId)),
  };
  checkWinner(battle);
  runFinishEffect(battle, sideKey, laneIndex, attackerCard);
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
    const activeUnit = unitCard(lane.unit);
    if (activeUnit) runEffectProgram(battle, sideKey, laneIndex, activeUnit, 'TURN_START');
    if (support) runEffectProgram(battle, sideKey, laneIndex, support, 'TURN_START');
  });
  drawOne(battle, sideKey);
};

const finishTurnEffects = (battle: PlacementBattle, sideKey: PlacementSideKey) => {
  battle[sideKey].lanes.forEach((lane, laneIndex) => {
    const card = unitCard(lane.unit);
    if (card?.effect === 'REGEN') healUnit(lane, laneIndex, card.amount);
    if (card) runEffectProgram(battle, sideKey, laneIndex, card, 'TURN_END');
    const support = supportCard(lane.support);
    if (support) runEffectProgram(battle, sideKey, laneIndex, support, 'TURN_END');
  });
};

const CPU_ACTION_VALUE: Record<PlacementEffectAction, number> = {
  DAMAGE: 7,
  HEAL: 5,
  DRAW: 4,
  GAIN_SP: 4,
  BUFF_ATTACK: 6,
  BUFF_HEALTH: 5,
  SHIELD: 5,
  STUN: 8,
  MOVE: 3,
  BREAK_SUPPORT: 6,
  LIFE_DRAIN: 9,
  MARK: 2,
  REORDER_HAND: 2,
  DISCARD: 3,
};

const cpuEffectScore = (card: PlacementCardDefinition, battle: PlacementBattle): number => {
  const program = card.effectProgram;
  const triggerValue = program.trigger === 'DEPLOY' || program.trigger === 'EVENT_PLAY' ? 8
    : program.trigger === 'FINISH' ? 6 : 3;
  const resetValue = program.resetRule === 'EVERY_TRIGGER' ? 2 : program.resetRule === 'ONCE_PER_TURN' ? 1 : 0;
  const conditionalValue = program.steps.filter(step => conditionPasses(
    battle, 'cpu', 1, step.condition, program.memoryKey,
  )).length * 2;
  const actionValue = program.steps.reduce((sum, step) => sum + CPU_ACTION_VALUE[step.action], 0);
  return triggerValue + resetValue + conditionalValue + actionValue - card.spCost;
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
      .sort((left, right) => cpuEffectScore(right.card!, battle) - cpuEffectScore(left.card!, battle));
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

export const createNewPlacementRun = (
  editionOrSeed: PlacementTcgEdition | number = 'ELEMENTARY',
  requestedSeed = Date.now(),
  customDeck?: string[],
): PlacementRun => {
  const edition: PlacementTcgEdition = typeof editionOrSeed === 'number' ? 'ELEMENTARY' : editionOrSeed;
  const seed = typeof editionOrSeed === 'number' ? editionOrSeed : requestedSeed;
  const collection = loadPlacementTcgCollection();
  const configuredDeck = customDeck || collection.decks[edition] || PLACEMENT_TCG_EDITION_DECKS[edition];
  const validDeck = configuredDeck
    .map(normalizePlacementTcgCardId)
    .filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId));
  return ({
  version: 2,
  seed,
  battleIndex: 0,
  wins: 0,
  deck: [...(validDeck.length >= 20 ? validDeck : PLACEMENT_TCG_EDITION_DECKS[edition])],
  opponentIds: createPlacementTcgOpponents(seed).map(opponent => opponent.id),
  rewardHistory: [],
  edition,
  mode: 'GAUNTLET',
  endlessFloor: 0,
  });
};

export const getCurrentOpponent = (run: PlacementRun): PlacementTcgOpponent =>
  run.mode === 'ENDLESS'
    ? getPlacementTcgEndlessOpponent(run.seed, Math.max(1, run.endlessFloor))
    : getPlacementTcgOpponent(run.opponentIds[run.battleIndex]) ||
      createPlacementTcgOpponents(run.seed)[Math.min(9, run.battleIndex)];

export const createRewardChoices = (run: PlacementRun): string[] => {
  // Rewards are cards the player does not already own in the shared
  // collection, not merely cards absent from the current run deck. This
  // keeps the three-card offer meaningful when switching between editions.
  const owned = new Set([...run.deck, ...loadPlacementTcgCollection().unlockedCardIds]);
  const pool = PLACEMENT_TCG_REWARD_POOL.filter(cardId => !owned.has(cardId));
  const fallback = pool.length >= 3 ? pool : PLACEMENT_TCG_REWARD_POOL;
  return seededShuffle(fallback, run.seed + run.wins * 7919).slice(0, 3);
};

export const addRewardAndAdvance = (run: PlacementRun, cardId: string): PlacementRun => {
  unlockPlacementTcgCard(cardId);
  const next = {
    ...run,
    battleIndex: run.battleIndex + 1,
    wins: run.wins + 1,
    deck: [...run.deck, cardId],
    rewardHistory: [...run.rewardHistory, cardId],
    endlessFloor: run.mode === 'ENDLESS' ? run.endlessFloor + 1 : run.endlessFloor,
  };
  if (next.mode === 'ENDLESS') recordEndlessFloor(next.endlessFloor);
  return next;
};

export const enterPlacementTcgEndless = (run: PlacementRun): PlacementRun => {
  const next: PlacementRun = {
    ...run,
    mode: 'ENDLESS',
    battleIndex: Math.max(10, run.battleIndex + 1),
    endlessFloor: 1,
  };
  recordEndlessFloor(1);
  return next;
};

const defaultPlacementCollection = (): PlacementTcgCollection => ({
  version: 1,
  unlockedCardIds: Array.from(new Set(Object.values(PLACEMENT_TCG_EDITION_DECKS).flat())),
  decks: {
    ELEMENTARY: [...PLACEMENT_TCG_EDITION_DECKS.ELEMENTARY],
    HIGH_SCHOOL: [...PLACEMENT_TCG_EDITION_DECKS.HIGH_SCHOOL],
    MAGIC: [...PLACEMENT_TCG_EDITION_DECKS.MAGIC],
  },
  highestEndlessFloor: 0,
});

export const loadPlacementTcgCollection = (): PlacementTcgCollection => {
  const fallback = defaultPlacementCollection();
  try {
    const raw = localStorage.getItem(PLACEMENT_TCG_COLLECTION_KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw) as Partial<PlacementTcgCollection>;
    const unlocked = Array.isArray(value.unlockedCardIds)
      ? value.unlockedCardIds.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId))
      : [];
    return {
      ...fallback,
      unlockedCardIds: Array.from(new Set([...fallback.unlockedCardIds, ...unlocked])),
      decks: {
        ELEMENTARY: value.decks?.ELEMENTARY?.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId)) || fallback.decks.ELEMENTARY,
        HIGH_SCHOOL: value.decks?.HIGH_SCHOOL?.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId)) || fallback.decks.HIGH_SCHOOL,
        MAGIC: value.decks?.MAGIC?.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId)) || fallback.decks.MAGIC,
      },
      highestEndlessFloor: Math.max(0, Number(value.highestEndlessFloor) || 0),
    };
  } catch {
    return fallback;
  }
};

export const savePlacementTcgCollection = (collection: PlacementTcgCollection) => {
  try {
    localStorage.setItem(PLACEMENT_TCG_COLLECTION_KEY, JSON.stringify(collection));
  } catch {
    // Storage can be unavailable in preview/webview contexts.
  }
};

export const savePlacementTcgDeck = (edition: PlacementTcgEdition, deck: string[]): boolean => {
  const collection = loadPlacementTcgCollection();
  const unlocked = new Set(collection.unlockedCardIds);
  const valid = deck.map(normalizePlacementTcgCardId).filter(cardId => unlocked.has(cardId) && PLACEMENT_TCG_CARD_MAP.has(cardId));
  const counts = new Map<string, number>();
  const capped = valid.filter(cardId => {
    const count = (counts.get(cardId) || 0) + 1;
    counts.set(cardId, count);
    return count <= 3;
  });
  if (capped.length < 20 || capped.length > 30) return false;
  collection.decks[edition] = capped;
  savePlacementTcgCollection(collection);
  return true;
};

export const unlockPlacementTcgCard = (cardId: string) => {
  if (!PLACEMENT_TCG_CARD_MAP.has(cardId)) return;
  const collection = loadPlacementTcgCollection();
  if (collection.unlockedCardIds.includes(cardId)) return;
  collection.unlockedCardIds.push(cardId);
  savePlacementTcgCollection(collection);
};

const recordEndlessFloor = (floor: number) => {
  const collection = loadPlacementTcgCollection();
  if (floor <= collection.highestEndlessFloor) return;
  collection.highestEndlessFloor = floor;
  savePlacementTcgCollection(collection);
};

export const loadPlacementRun = (): PlacementRun | null => {
  try {
    const raw = localStorage.getItem(PLACEMENT_TCG_SAVE_KEY) || localStorage.getItem(LEGACY_PLACEMENT_TCG_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PlacementRun & { version?: number };
    if (!Array.isArray(value.deck) || !Array.isArray(value.opponentIds)) return null;
    if (value.version === 2) {
      const edition = value.edition || 'ELEMENTARY';
      const validDeck = value.deck.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId));
      return {
        ...value,
        edition,
        deck: validDeck.length >= 20 ? validDeck : [...PLACEMENT_TCG_EDITION_DECKS[edition]],
        mode: value.mode || 'GAUNTLET',
        endlessFloor: Math.max(0, value.endlessFloor || 0),
      };
    }
    const migratedDeck = value.deck.map(normalizePlacementTcgCardId).filter(cardId => PLACEMENT_TCG_CARD_MAP.has(cardId));
    return {
      ...value,
      version: 2,
      deck: migratedDeck.length >= 20 ? migratedDeck : [...PLACEMENT_TCG_STARTER_DECK],
      edition: 'ELEMENTARY',
      mode: 'GAUNTLET',
      endlessFloor: 0,
    };
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
    localStorage.removeItem(LEGACY_PLACEMENT_TCG_SAVE_KEY);
  } catch {
    // Storage can be unavailable in preview/webview contexts.
  }
};

export const samplePlacementCard = (
  random: ReturnType<typeof createSeededRandom>,
): PlacementCardDefinition =>
  PLACEMENT_TCG_CARDS[Math.floor(random() * PLACEMENT_TCG_CARDS.length)];
