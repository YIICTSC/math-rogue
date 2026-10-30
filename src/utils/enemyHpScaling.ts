import { CardType, TargetType, type Card as ICard } from '../types';
import { getCardDamage } from './cardDamage';

export const estimateBossScalingSingleCardDamage = (deck: ICard[], effectMultiplier = 1): number => {
    const strikeCount = deck.filter(c => c.name === 'えんぴつ攻撃' || c.originalNames?.includes('えんぴつ攻撃')).length;
    const attackCount = deck.filter(c => c.type === CardType.ATTACK).length;
    const skillCount = deck.filter(c => c.type === CardType.SKILL).length;
    const deckSize = deck.length;

    const assumedHand = Math.min(5, Math.max(1, deckSize));
    const assumedDrawPile = Math.max(0, deckSize - assumedHand);
    const assumedBlock = 12;
    const assumedPriorAttacks = Math.max(0, Math.min(2, attackCount - 1));
    const assumedSkillsInHand = Math.max(0, Math.min(4, skillCount));

    const damageCards = deck.filter(card =>
        card.target !== TargetType.SELF &&
        (
            (card.poison || 0) > 0 ||
            card.damage !== undefined ||
            card.damageBasedOnBlock ||
            card.damageBasedOnHpLostThisTurn ||
            card.damagePerCardInHand ||
            card.damagePerAttackInHand ||
            card.damagePerAttackPlayed ||
            card.damagePerCardPlayed ||
            card.damagePerCardPlayedBattle ||
            card.damagePerCardInDeck ||
            card.damagePerStrike ||
            card.damagePerCardInDraw
        )
    );

    return Math.max(0, ...damageCards.map(card => {
        const perHit = getCardDamage(card, {
            energySpent: card.xCost ? 1 : undefined,
            block: assumedBlock,
            handCountExcludingSelf: Math.max(0, assumedHand - 1),
            attackCountInHand: Math.max(0, assumedHand - 1) * (attackCount / Math.max(1, deckSize)),
            attacksPlayedThisTurn: assumedPriorAttacks,
            cardsPlayedThisTurn: assumedPriorAttacks,
            cardsPlayedThisBattle: assumedPriorAttacks,
            strikeCount,
            deckCount: deckSize,
            drawPileCount: assumedDrawPile,
        });

        let hits = 1 + (card.playCopies || 0);
        if (card.hitsPerSkillInHand) hits = Math.max(1, assumedSkillsInHand);
        if (card.hitsPerAttackPlayed) hits = Math.max(1, assumedPriorAttacks);

        // Count the first end-of-turn tick, not speculative lifetime poison damage.
        const poisonDamage = Math.max(0, card.poison || 0);
        return Math.max(0, (perHit + poisonDamage) * Math.min(hits, 100) * effectMultiplier);
    }));
};
