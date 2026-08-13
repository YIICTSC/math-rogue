import { CardType, type Card, type Enemy, type Player } from '../types';
import { createMagicRuleState, getMagicRuleConfig } from '../data/magicLoadouts';

interface MagicRuleResult {
  player: Player;
  enemies: Enemy[];
}

const damageEnemy = (enemy: Enemy, amount: number) => {
  const blocked = Math.min(enemy.block, amount);
  enemy.block -= blocked;
  enemy.currentHp = Math.max(0, enemy.currentHp - (amount - blocked));
};

const damageAll = (enemies: Enemy[], amount: number) => {
  enemies.filter((enemy) => enemy.currentHp > 0).forEach((enemy) => damageEnemy(enemy, amount));
};

const heal = (player: Player, amount: number) => {
  player.currentHp = Math.min(player.maxHp, player.currentHp + amount);
};

const drawFromPile = (player: Player, count: number) => {
  for (let index = 0; index < count; index++) {
    const drawn = player.drawPile.pop();
    if (!drawn) break;
    player.hand.push(drawn);
  }
};

const completeRule = (
  heroId: string,
  player: Player,
  enemies: Enemy[],
  logs: string[],
) => {
  const target = enemies.find((enemy) => enemy.currentHp > 0);
  switch (heroId) {
    case 'AKARI':
      damageAll(enemies, 10);
      player.block += 10;
      break;
    case 'SHIZUKU':
      if (target) {
        damageEnemy(target, 18);
        target.vulnerable += 1;
      }
      player.block += 12;
      break;
    case 'HIYORI':
      damageAll(enemies, 8);
      heal(player, 10);
      break;
    case 'TSUBASA':
      player.strength += 2;
      player.currentEnergy += 1;
      player.hand = player.hand.map((card) => card.upgraded ? card : { ...card, upgraded: true });
      break;
    case 'REI':
      enemies.filter((enemy) => enemy.currentHp > 0).forEach((enemy) => {
        enemy.weak += 2;
        enemy.poison += 6;
      });
      player.block += 8;
      break;
    case 'MADOKA':
      drawFromPile(player, 2);
      player.currentEnergy += 1;
      player.block += 8;
      break;
    case 'KOHARU':
      damageAll(enemies, 7);
      player.block += 12;
      drawFromPile(player, 1);
      break;
    case 'MIRAI':
      damageAll(enemies, 12);
      enemies.filter((enemy) => enemy.currentHp > 0).forEach((enemy) => { enemy.weak += 1; });
      player.currentEnergy += 1;
      break;
    case 'SERA':
      drawFromPile(player, 2);
      player.block += 10;
      player.strength += 1;
      break;
    case 'REN':
      if (target) damageEnemy(target, 20);
      player.block += 12;
      break;
    case 'SOMA':
      damageAll(enemies, 9);
      enemies.filter((enemy) => enemy.currentHp > 0).forEach((enemy) => {
        enemy.weak += 1;
        enemy.vulnerable += 1;
      });
      player.block += 10;
      break;
    case 'MINATO':
      heal(player, 12);
      player.block += 12;
      if (target) damageEnemy(target, 10);
      break;
    case 'RIKU':
      drawFromPile(player, 3);
      player.currentEnergy += 1;
      player.block += 6;
      break;
    case 'YAMATO':
      if (target) damageEnemy(target, 30);
      player.strength += 1;
      break;
    case 'LEON':
      damageAll(enemies, 13);
      drawFromPile(player, 1);
      break;
    case 'ELLIOT':
      heal(player, 6);
      player.block += 16;
      player.strength += 1;
      break;
    case 'SAKUYA':
      player.currentHp = Math.max(1, player.currentHp - 3);
      enemies.filter((enemy) => enemy.currentHp > 0).forEach((enemy) => {
        enemy.poison += 9;
        enemy.weak += 2;
      });
      break;
  }
  logs.push(`${getMagicRuleConfig(heroId).name}が完成した！`);
};

export const applyMagicRuleOnCardPlay = (
  heroId: string,
  card: Card,
  sourcePlayer: Player,
  sourceEnemies: Enemy[],
  logs: string[],
): MagicRuleResult => {
  const player = sourcePlayer;
  const enemies = sourceEnemies;
  const state = player.magicRuleState ?? createMagicRuleState(heroId);
  const nextState = {
    ...state,
    sequence: [...state.sequence],
    slots: [...state.slots],
  };
  const ruleCardIndices = card.magicRuleCardIndices?.length
    ? card.magicRuleCardIndices
    : card.magicRuleCardIndex !== undefined
      ? [card.magicRuleCardIndex]
      : [];
  const ruleSteps = heroId === 'AKARI'
    ? [undefined]
    : ruleCardIndices;

  ruleSteps.forEach((ruleCardIndex) => {
    const slotName = ruleCardIndex !== undefined && ruleSteps.length > 1
      ? `${card.name}(${ruleCardIndex + 1})`
      : card.name;

    if (heroId === 'AKARI') {
      if (!nextState.sequence.includes(card.type)) nextState.sequence.push(card.type);
      nextState.slots = nextState.sequence.map((type) => type);
      nextState.value = nextState.sequence.length;
    } else if (heroId === 'SOMA' && ruleCardIndex !== undefined) {
      const expected = nextState.value;
      if (ruleCardIndex === expected) {
        nextState.value += 1;
        nextState.slots.push(slotName);
      } else {
        nextState.value = ruleCardIndex === 0 ? 1 : 0;
        nextState.slots = ruleCardIndex === 0 ? [slotName] : [];
        logs.push('行動計画を最初から組み直した。');
      }
    } else if (ruleCardIndex !== undefined) {
      nextState.value = Math.min(3, nextState.value + 1);
      nextState.secondaryValue = ruleCardIndex;
      nextState.slots.push(slotName);
    }

    if (heroId === 'SHIZUKU' && ruleCardIndex === 1) {
      nextState.secondaryValue += 1;
      player.block += 4;
      logs.push('月鏡へ敵の動きを記録した。');
    } else if (heroId === 'HIYORI' && ruleCardIndex === 1) {
      heal(player, 2);
    } else if (heroId === 'REN' && ruleCardIndex === 1) {
      player.block += 4;
    } else if (heroId === 'SAKUYA' && ruleCardIndex !== undefined) {
      player.currentHp = Math.max(1, player.currentHp - 1);
      logs.push('禁術契約の代償としてHPを1支払った。');
    }

    if (nextState.value >= 3) {
      completeRule(heroId, player, enemies, logs);
      nextState.value = 0;
      nextState.secondaryValue = 0;
      nextState.sequence = [];
      nextState.slots = [];
    }
  });

  player.magicRuleState = nextState;
  return { player, enemies };
};
