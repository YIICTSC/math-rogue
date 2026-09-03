import type { Card, Player } from '../types';
import { CardType } from '../types';
import { CARDS_LIBRARY } from '../constants';
import { getUpgradedCard } from './cardUtils';

export interface MagicEndlessEventEffectResult {
  player: Player;
  messages: string[];
}

const parseAmount = (effect: string): number => Number(effect.match(/(\d+)$/)?.[1] || 0);

const clonePlayerForEvent = (player: Player): Player => ({
  ...player,
  deck: [...player.deck],
  hand: [...player.hand],
  drawPile: [...player.drawPile],
  discardPile: [...player.discardPile],
  relicCounters: { ...player.relicCounters },
  turnFlags: { ...player.turnFlags },
});

const addEventCard = (player: Player): boolean => {
  const templates = Object.values(CARDS_LIBRARY).filter(card => card.type !== CardType.CURSE && !card.unplayable);
  if (templates.length === 0) return false;
  const template = templates[Math.floor(Math.random() * templates.length)];
  player.deck.push({ ...template, id: `magic-endless-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } as Card);
  return true;
};

const upgradeEventCard = (player: Player): boolean => {
  const zones = [player.deck, player.hand, player.drawPile, player.discardPile];
  for (const zone of zones) {
    const index = zone.findIndex(card => !card.upgraded && !card.unplayable && card.type !== CardType.CURSE);
    if (index >= 0) {
      zone[index] = getUpgradedCard(zone[index]);
      return true;
    }
  }
  return false;
};

const removeEventCurse = (player: Player): boolean => {
  const zones = [player.deck, player.hand, player.drawPile, player.discardPile];
  for (const zone of zones) {
    const index = zone.findIndex(card => card.type === CardType.CURSE || (card.unplayable && card.rarity === 'SPECIAL'));
    if (index >= 0) {
      zone.splice(index, 1);
      return true;
    }
  }
  return false;
};

/** Apply the compact effect notation authored in the 90-event design docs. */
export const applyMagicEndlessEventEffects = (player: Player, effects: string[]): MagicEndlessEventEffectResult => {
  const next = clonePlayerForEvent(player);
  const messages: string[] = [];
  effects.forEach(effect => {
    const amount = parseAmount(effect);
    if (effect.startsWith('HEAL+')) {
      next.currentHp = Math.min(next.maxHp, next.currentHp + amount);
      messages.push(`HPが${amount}回復した`);
    } else if (effect.startsWith('GOLD+')) {
      next.gold += amount;
      messages.push(`${amount}Gを得た`);
    } else if (effect.startsWith('CARD+')) {
      if (addEventCard(next)) messages.push('カードを1枚得た');
    } else if (effect.startsWith('UPGRADE+')) {
      if (upgradeEventCard(next)) messages.push('カードを1枚強化した');
    } else if (effect.startsWith('REMOVE_CURSE+')) {
      if (removeEventCurse(next)) messages.push('呪いカードを1枚除去した');
    } else if (effect.startsWith('DRAW+')) {
      next.nextTurnDraw += amount;
      messages.push(`次のターンのドローが${amount}枚増える`);
    } else if (effect.startsWith('MAX_HP+')) {
      next.maxHp += amount;
      next.currentHp += amount;
      messages.push(`最大HPが${amount}増えた`);
    } else if (effect.startsWith('MAGIC_TRACE+')) {
      next.relicCounters.MAGIC_TRACE = (next.relicCounters.MAGIC_TRACE || 0) + amount;
      messages.push(`魔法の痕跡が${amount}増えた`);
    } else if (effect.startsWith('TEAM+')) {
      next.relicCounters.MAGIC_ENDLESS_TEAM = (next.relicCounters.MAGIC_ENDLESS_TEAM || 0) + amount;
      messages.push(`仲間との連携が${amount}進んだ`);
    } else if (effect === 'RISK:CORRUPTION+1') {
      next.turnFlags.MAGIC_ENDLESS_CORRUPTION = true;
      messages.push('腐蝕が1段階進んだ');
    } else if (effect.startsWith('RISK:HP-')) {
      next.currentHp = Math.max(1, next.currentHp - amount);
      messages.push(`HPを${amount}失った`);
    }
  });
  return { player: next, messages };
};
