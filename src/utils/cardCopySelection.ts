import { Card as ICard, CardType, SelectionState } from '../types';

const cardMatchesAnyKey = (card: ICard, keys: readonly string[]): boolean => {
    const identities = [card.name, ...(card.originalNames ?? []), card.id].filter(Boolean);
    return keys.some(key => identities.some(identity => identity === key || identity.includes(key)));
};

const UNRESTRICTED_COPY_KEYS = [
    '国語辞典',
    'KOKUGO_DICTIONARY',
    '鳥になった気分',
    'OUT_BIRD_WATCH',
    '地元のラジオ局',
    'OUT_RADIO_STATION',
    'フォークダンス',
    'PE_DANCE',
    '鏡 (星新一)',
    'KAGAMI_HOSHI',
    'きてんの窓',
    'KITSUNE_NO_MADO',
] as const;

const ATTACK_COPY_KEYS = ['カンニング', 'HOLOGRAM', '影分身の術', 'BOYS_SHADOW_CLONE'] as const;
const SKILL_COPY_KEYS = ['お人形遊び', 'GIRLS_DOLL_HOUSE'] as const;
const ATTACK_OR_POWER_COPY_KEYS = ['二本鉛筆', '二刀流', 'DUAL_WIELD'] as const;
const REPEAT_SELECTED_TARGET_KEYS = ['二本鉛筆', '二刀流', 'DUAL_WIELD', '影分身の術', 'BOYS_SHADOW_CLONE'] as const;
const COPY_THEN_DISCARD_KEYS = ['フォークダンス', 'PE_DANCE'] as const;
const COPY_WITH_VULNERABLE_KEYS = ['鏡 (星新一)', 'KAGAMI_HOSHI'] as const;
const ZERO_COST_COPY_KEYS = ['きてんの窓', 'KITSUNE_NO_MADO'] as const;

export const isCardEligibleForCopySelection = (
    card: ICard,
    selectionState: SelectionState,
    hand: ICard[],
): boolean => {
    if (selectionState.type !== 'COPY') return true;

    const allowedTypes = selectionState.copyTargetTypes;
    if (allowedTypes?.length && !allowedTypes.includes(card.type)) return false;

    const minCost = selectionState.copyTargetMinCost;
    if (minCost === undefined) return true;
    if (card.cost >= minCost) return true;
    if (!selectionState.copyTargetFallbackToAny) return false;

    return !hand.some(candidate => {
        const typeAllowed = !allowedTypes?.length || allowedTypes.includes(candidate.type);
        return typeAllowed && candidate.cost >= minCost;
    });
};

export const createCardCopySelectionState = (card: ICard, hand: ICard[]): SelectionState => {
    const requestedCopies = Math.max(1, Math.floor(card.promptsCopy || 1));
    const hasUnrestrictedCopyEffect = cardMatchesAnyKey(card, UNRESTRICTED_COPY_KEYS);
    const repeatSelectedTarget = !hasUnrestrictedCopyEffect && cardMatchesAnyKey(card, REPEAT_SELECTED_TARGET_KEYS);
    const targetTypes = new Set<CardType>();

    if (!hasUnrestrictedCopyEffect) {
        if (cardMatchesAnyKey(card, ATTACK_COPY_KEYS)) targetTypes.add(CardType.ATTACK);
        if (cardMatchesAnyKey(card, SKILL_COPY_KEYS)) targetTypes.add(CardType.SKILL);
        if (cardMatchesAnyKey(card, ATTACK_OR_POWER_COPY_KEYS)) {
            targetTypes.add(CardType.ATTACK);
            targetTypes.add(CardType.POWER);
        }
    }

    const selectionState: SelectionState = {
        active: true,
        type: 'COPY',
        amount: repeatSelectedTarget ? 1 : requestedCopies,
        originCardId: card.id,
        copyTargetTypes: targetTypes.size > 0 ? Array.from(targetTypes) : undefined,
        copyTargetMinCost: cardMatchesAnyKey(card, ZERO_COST_COPY_KEYS) ? 2 : undefined,
        copyTargetFallbackToAny: cardMatchesAnyKey(card, ZERO_COST_COPY_KEYS) || undefined,
        copiesPerSelection: repeatSelectedTarget ? requestedCopies : 1,
        copiedCardCost: cardMatchesAnyKey(card, ZERO_COST_COPY_KEYS) ? 0 : undefined,
        copyThenDiscardAmount: Math.max(
            card.promptsDiscard || 0,
            cardMatchesAnyKey(card, COPY_THEN_DISCARD_KEYS) ? 1 : 0,
        ) || undefined,
        copySelfVulnerableOnResolve: cardMatchesAnyKey(card, COPY_WITH_VULNERABLE_KEYS) ? 1 : undefined,
    };

    if (!hand.some(candidate => isCardEligibleForCopySelection(candidate, selectionState, hand))) {
        selectionState.active = false;
        selectionState.amount = 0;
    }

    return selectionState;
};
