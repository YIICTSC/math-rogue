import type { Card, Player } from '../types';

/**
 * Returns the number of cards that can be selected for a discard prompt after
 * this card is played. The played card leaves the hand first, and only cards
 * that are actually available in the draw pile are counted as new targets.
 */
export const getDiscardableCardCountAfterPlay = (
    player: Pick<Player, 'hand' | 'drawPile' | 'magicTransformed'>,
    card: Pick<Card, 'id' | 'draw' | 'familiarSummon'>,
): number => {
    const discardableHandCount = player.hand.filter(handCard => handCard.id !== card.id).length;
    const immediateDrawCount = card.familiarSummon
        ? 0
        : Math.max(0, Math.floor((card.draw || 0) * (player.magicTransformed ? 2 : 1)));
    const drawableCardCount = Math.min(immediateDrawCount, player.drawPile.length);

    return discardableHandCount + drawableCardCount;
};
