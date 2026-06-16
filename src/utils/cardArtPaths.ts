import type { Card } from '../types';
import { assetUrl } from './assetPaths';

export const getMagicCardArtUrl = (card: Card): string | null => {
  const usesRuleCardArt = card.magicRuleCardArt
    || (card.magicRuleCardIndex !== undefined && card.id.startsWith('start-MAGIC_'));

  if (usesRuleCardArt && card.magicHeroId && card.magicRuleCardIndex !== undefined) {
    return assetUrl(`sprites/magic/rule-cards/${card.magicHeroId}/${card.magicRuleCardIndex}.webp`);
  }

  if (card.magicBasicCardArt && card.magicHeroId) {
    return assetUrl(`sprites/magic/basic-cards/${card.magicHeroId}/${card.magicBasicCardArt}.webp`);
  }

  if (card.magicCardArtIndex !== undefined) {
    return assetUrl(`sprites/magic/cards/${card.magicCardArtIndex}.webp`);
  }

  return null;
};
