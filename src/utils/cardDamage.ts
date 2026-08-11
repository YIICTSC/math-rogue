import { Card } from '../types';

export interface CardDamageContext {
  /** Energy actually spent to play an X-cost card. */
  energySpent?: number;
  block?: number;
  hpLostThisTurn?: number;
  handCountExcludingSelf?: number;
  attackCountInHand?: number;
  attacksPlayedThisTurn?: number;
  cardsPlayedThisTurn?: number;
  cardsPlayedThisBattle?: number;
  strikeCount?: number;
  deckCount?: number;
  drawPileCount?: number;
}

/** Keep variable-damage effects in one place so card data and the battle loop stay in sync. */
export const getCardDamage = (card: Pick<Card, 'damage' | 'xCost' | 'damageBasedOnBlock' | 'damageBasedOnBlockMultiplier' | 'damageBasedOnHpLostThisTurn' | 'damagePerCardInHand' | 'damagePerAttackInHand' | 'damagePerAttackPlayed' | 'damagePerCardPlayed' | 'damagePerCardPlayedBattle' | 'damagePerCardInDeck' | 'damagePerStrike' | 'damagePerCardInDraw'>, context: CardDamageContext): number => {
  let damage = card.damage || 0;
  if (card.damageBasedOnBlock) damage += (context.block || 0) * (card.damageBasedOnBlockMultiplier || 1);
  if (card.damageBasedOnHpLostThisTurn) damage += (context.hpLostThisTurn || 0) * card.damageBasedOnHpLostThisTurn;
  if (card.damagePerCardInHand) damage += (context.handCountExcludingSelf || 0) * card.damagePerCardInHand;
  if (card.damagePerAttackInHand) damage += (context.attackCountInHand || 0) * card.damagePerAttackInHand;
  if (card.damagePerAttackPlayed) damage += (context.attacksPlayedThisTurn || 0) * card.damagePerAttackPlayed;
  if (card.damagePerCardPlayed) damage += (context.cardsPlayedThisTurn || 0) * card.damagePerCardPlayed;
  if (card.damagePerCardPlayedBattle) damage += (context.cardsPlayedThisBattle || 0) * card.damagePerCardPlayedBattle;
  if (card.damagePerCardInDeck) damage += (context.deckCount || 0) * card.damagePerCardInDeck;
  if (card.damagePerStrike) damage += (context.strikeCount || 0) * card.damagePerStrike;
  if (card.damagePerCardInDraw) damage += (context.drawPileCount || 0) * card.damagePerCardInDraw;
  // X-cost cards scale their declared damage with the amount of Energy they
  // actually consume. Callers without a battle cost context (for example,
  // difficulty estimation) use X=1 as the neutral preview value.
  return card.xCost ? damage * Math.max(0, context.energySpent ?? 1) : damage;
};

export const getCardPlayCost = (card: Pick<Card, 'cost' | 'xCost'>, availableEnergy: number): number => {
  return card.xCost ? Math.max(0, availableEnergy) : Math.max(0, card.cost);
};
