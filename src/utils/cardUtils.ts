
import { Card, CardType, TargetType } from '../types';
import { CARDS_LIBRARY } from '../constants';

const MAX_ILLUSTRATION_REFS = 8;
const ILLUSTRATION_REF_PREFIXES = [
    'enemy:',
    'card:',
    'pixel:',
    'familiar:',
    'asset:',
    'magic-rule:',
    'magic-basic:',
    'magic-card:',
] as const;

export const normalizeIllustrationRefToken = (token: string): string => (
    ILLUSTRATION_REF_PREFIXES.some(prefix => token.startsWith(prefix)) ? token : `card:${token}`
);
const uniqueStrings = (values: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
        if (!value || seen.has(value)) return;
        seen.add(value);
        result.push(value);
    });
    return result;
};

const safeDecodeURIComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch (e) {
        return value;
    }
};

export const createEnemyIllustrationRef = (card: Card, name: string): string => {
    const parts = [`enemy:${encodeURIComponent(name)}`];
    if (card.visualTheme) parts.push(`theme:${card.visualTheme}`);
    if (card.enemyIllustrationEnemyType) parts.push(`type:${encodeURIComponent(card.enemyIllustrationEnemyType)}`);
    if (card.enemyIllustrationPhase !== undefined) parts.push(`phase:${card.enemyIllustrationPhase}`);
    return parts.join('|');
};

export const parseEnemyIllustrationRef = (refToken: string): {
    name: string;
    visualTheme?: Card['visualTheme'];
    enemyType?: string;
    phase?: number;
} | null => {
    if (!refToken.startsWith('enemy:')) return null;
    const [namePart, ...metaParts] = refToken.substring('enemy:'.length).split('|');
    const parsed: {
        name: string;
        visualTheme?: Card['visualTheme'];
        enemyType?: string;
        phase?: number;
    } = { name: safeDecodeURIComponent(namePart) };

    metaParts.forEach((part) => {
        const separatorIndex = part.indexOf(':');
        if (separatorIndex <= 0) return;
        const key = part.substring(0, separatorIndex);
        const value = part.substring(separatorIndex + 1);
        if (key === 'theme' && (value === 'elementary' || value === 'high-school' || value === 'magic')) {
            parsed.visualTheme = value;
        } else if (key === 'type') {
            parsed.enemyType = safeDecodeURIComponent(value);
        } else if (key === 'phase') {
            const phase = Number(value);
            if (Number.isFinite(phase)) parsed.phase = phase;
        }
    });

    return parsed;
};

const toIllustrationRefs = (card: Card): string[] => {
    if (card.illustrationRefs && card.illustrationRefs.length > 0) {
        return card.illustrationRefs.filter(Boolean).slice(0, MAX_ILLUSTRATION_REFS);
    }

    if (card.magicRuleCardArt && card.magicHeroId && card.magicRuleCardIndex !== undefined) {
        return [`magic-rule:${card.magicHeroId}:${card.magicRuleCardIndex}`];
    }

    if (card.magicBasicCardArt && card.magicHeroId) {
        return [`magic-basic:${card.magicHeroId}:${card.magicBasicCardArt}`];
    }

    if (card.magicCardArtIndex !== undefined) {
        return [`magic-card:${card.magicCardArtIndex}`];
    }

    const enemyNames = [
        ...(card.enemyIllustrationNames || []),
        ...(card.enemyIllustrationName ? [card.enemyIllustrationName] : [])
    ].filter(Boolean) as string[];
    if (enemyNames.length > 0) {
        return [createEnemyIllustrationRef(card, enemyNames[0])];
    }

    if (card.capture && card.textureRef && !card.textureRef.includes('|')) {
        return [createEnemyIllustrationRef(card, card.textureRef)];
    }

    if (card.name) {
        return [`card:${card.name}`];
    }

    if (card.textureRef) {
        return [`pixel:${card.textureRef}`];
    }

    return [];
};

const mergeIllustrationRefsCircular = (c1: Card, c2: Card, c3?: Card): { refs: string[]; writeIndex: number } => {
    const refs = [...toIllustrationRefs(c1)];
    let writeIndex = c1.illustrationRefWriteIndex || 0;
    if (refs.length < MAX_ILLUSTRATION_REFS) {
        writeIndex = refs.length % MAX_ILLUSTRATION_REFS;
    }

    const append = (token: string) => {
        if (refs.length < MAX_ILLUSTRATION_REFS) {
            refs.push(token);
            writeIndex = refs.length % MAX_ILLUSTRATION_REFS;
            return;
        }
        refs[writeIndex] = token;
        writeIndex = (writeIndex + 1) % MAX_ILLUSTRATION_REFS;
    };

    toIllustrationRefs(c2).forEach(append);
    if (c3) toIllustrationRefs(c3).forEach(append);

    return { refs, writeIndex };
};

const STATUS_PAIN_IDS = new Set(['BURN', 'INJURY', 'SLIMED', 'WOUND', 'PAIN', 'DECAY']);
const STATUS_HAND_LOCK_IDS = new Set(['DAZED', 'NORMALITY', 'VOID', 'CLUMSINESS']);
const STATUS_DECK_POLLUTION_IDS = new Set(['REGRET', 'SHAME', 'DOUBT', 'WRITHE', 'PARASITE']);
const HOLOGRAPHIC_VARIANT_BY_CARD_TYPE: Partial<Record<CardType, NonNullable<Card['holographicVariant']>>> = {
    [CardType.ATTACK]: 'red',
    [CardType.POWER]: 'yellow',
    [CardType.SKILL]: 'blue',
    [CardType.SUMMON]: 'purple',
};

export type StatusCategoryKey = 'PAIN' | 'HAND_LOCK' | 'DECK_POLLUTION';

export const getStatusCategoryKey = (card: Card): StatusCategoryKey | null => {
    const id = card.id || '';
    if (STATUS_PAIN_IDS.has(id)) return 'PAIN';
    if (STATUS_HAND_LOCK_IDS.has(id)) return 'HAND_LOCK';
    if (STATUS_DECK_POLLUTION_IDS.has(id)) return 'DECK_POLLUTION';
    return null;
};

export const getStatusCategoryLabel = (card: Card): string | null => {
    const key = getStatusCategoryKey(card);
    if (key === 'PAIN') return '即時痛み型';
    if (key === 'HAND_LOCK') return '手札阻害型';
    if (key === 'DECK_POLLUTION') return '山札汚染型';
    return null;
};

export const getStatusCategoryClass = (card: Card): string => {
    const key = getStatusCategoryKey(card);
    if (key === 'PAIN') return 'border-red-300/40 bg-red-900/50 text-red-100';
    if (key === 'HAND_LOCK') return 'border-yellow-300/40 bg-yellow-900/50 text-yellow-100';
    if (key === 'DECK_POLLUTION') return 'border-purple-300/40 bg-purple-900/50 text-purple-100';
    return '';
};

// Helper to determine the visual shape of a card for synthesis
export const getShapeFromCard = (card: Card): string => {
    if (card.textureRef) return card.textureRef.split('|')[0];

    const n = card.name;
    if (n.includes('薬') || n.includes('ポーション')) return 'POTION';
    if (n.includes('靴') || n.includes('足') || n.includes('ステップ') || n.includes('ダッシュ') || n.includes('ジャンプ')) return 'SHOE';
    if (n.includes('本') || n.includes('書') || n.includes('研究') || n.includes('学習')) return 'NOTEBOOK';
    if (n.includes('拳') || n.includes('パンチ') || n.includes('打') || n.includes('頭突き')) return 'FIST';
    if (n.includes('火') || n.includes('炎') || n.includes('熱')) return 'FLAME';
    if (n.includes('雷') || n.includes('電')) return 'LIGHTNING';
    if (n.includes('目') || n.includes('視') || n.includes('予見')) return 'EYE';

    if (card.type === CardType.ATTACK) return 'SWORD';
    if (card.type === CardType.SKILL) return 'SHIELD';
    if (card.type === CardType.POWER) return 'FLAME';
    if (card.type === CardType.SUMMON) return 'FAMILIAR';
    return 'NOTEBOOK';
};

export const getUpgradedCard = (card: Card): Card => {
    if (card.upgraded) return card; // Prevent double upgrade

    const newCard = { ...card, upgraded: true };
    const hasCardIdentity = (...names: string[]) => (
        names.includes(card.name) || names.some(name => card.originalNames?.includes(name))
    );

    const hasDamage = (card.damage !== undefined && card.damage > 0);
    const hasBlock = (card.block !== undefined && card.block > 0);

    if (hasDamage) {
        newCard.damage = Math.floor(card.damage! * 1.3) + 2;
    }
    if (hasBlock) {
        newCard.block = Math.floor(card.block! * 1.3) + 2;
    }

    // Power / Effect scaling
    // if (newCard.magicNumber) newCard.magicNumber += 1; // Generic hook if added later

    if (newCard.strength) newCard.strength += 1;
    if (newCard.draw) newCard.draw += 1;
    if (newCard.energy) newCard.energy += 1;
    if (newCard.vulnerable) newCard.vulnerable += 1;
    if (newCard.weak) newCard.weak += 1;
    if (newCard.poison) newCard.poison += 2;
    if (newCard.poisonMultiplier) newCard.poisonMultiplier += 1;

    if (newCard.applyPower) {
        newCard.applyPower = { ...newCard.applyPower, amount: newCard.applyPower.amount + 1 };
    }
    if (newCard.addCardToHand) {
        newCard.addCardToHand = { ...newCard.addCardToHand, count: newCard.addCardToHand.count + 1 };
    }

    if (!hasDamage && !hasBlock && card.cost > 0) {
        newCard.cost = Math.max(0, card.cost - 1);
    }

    // Specific Card Upgrade Logic overrides
    if (hasCardIdentity('防具ごと体当たり', 'BODY_SLAM')) newCard.cost = 0;
    if (hasCardIdentity('限界突破', 'LIMIT_BREAK')) newCard.exhaust = false;
    if (hasCardIdentity('触媒', 'CATALYST')) newCard.poisonMultiplier = 3;

    // Keep description values in sync with upgraded stats.
    let syncedDesc = newCard.description;
    const replaceOnce = (pattern: RegExp, formatter: (...args: any[]) => string) => {
        syncedDesc = syncedDesc.replace(pattern, (...args) => formatter(...args));
    };

    if (card.damage !== undefined && newCard.damage !== undefined && card.damage !== newCard.damage) {
        replaceOnce(/(\d+)(ダメージ)/, (_m, _n, label) => `${newCard.damage}${label}`);
    }
    if (card.block !== undefined && newCard.block !== undefined && card.block !== newCard.block) {
        replaceOnce(/(ブロック(?:を)?)(\d+)/, (_m, label) => `${label}${newCard.block}`);
        replaceOnce(/(\d+)(ブロック)/, (_m, _n, label) => `${newCard.block}${label}`);
    }
    if (card.draw !== undefined && newCard.draw !== undefined && card.draw !== newCard.draw) {
        replaceOnce(/(\d+)(枚引く)/, (_m, _n, label) => `${newCard.draw}${label}`);
        replaceOnce(/(カードを?)(\d+)(枚引く)/, (_m, prefix, _n, suffix) => `${prefix}${newCard.draw}${suffix}`);
    }
    if (card.energy !== undefined && newCard.energy !== undefined && card.energy !== newCard.energy) {
        replaceOnce(/(E)(\d+)(を得る)/, (_m, prefix, _n, suffix) => `${prefix}${newCard.energy}${suffix}`);
        replaceOnce(/(エナジー|エネルギー)(\d+)(を得る)/, (_m, prefix, _n, suffix) => `${prefix}${newCard.energy}${suffix}`);
    }
    if (card.poison !== undefined && newCard.poison !== undefined && card.poison !== newCard.poison) {
        replaceOnce(/(ドクドク)(\d+)/, (_m, label) => `${label}${newCard.poison}`);
    }
    if (card.weak !== undefined && newCard.weak !== undefined && card.weak !== newCard.weak) {
        replaceOnce(/(へろへろ)(\d+)/, (_m, label) => `${label}${newCard.weak}`);
    }
    if (card.vulnerable !== undefined && newCard.vulnerable !== undefined && card.vulnerable !== newCard.vulnerable) {
        replaceOnce(/(びくびく)(\d+)/, (_m, label) => `${label}${newCard.vulnerable}`);
    }
    if (card.strength !== undefined && newCard.strength !== undefined && card.strength !== newCard.strength) {
        replaceOnce(/(ムキムキ)(\d+)/, (_m, label) => `${label}${newCard.strength}`);
    }
    if (card.poisonMultiplier !== undefined && newCard.poisonMultiplier !== undefined && card.poisonMultiplier !== newCard.poisonMultiplier) {
        replaceOnce(/(毒を)(\d+)(倍)/, (_m, prefix, _n, suffix) => `${prefix}${newCard.poisonMultiplier}${suffix}`);
    }
    if (card.addCardToHand && newCard.addCardToHand && card.addCardToHand.count !== newCard.addCardToHand.count) {
        replaceOnce(/(\d+)(枚手札に加える)/, (_m, _n, label) => `${newCard.addCardToHand.count}${label}`);
        replaceOnce(/(」を)(\d+)(枚手札に加える)/, (_m, prefix, _n, suffix) => `${prefix}${newCard.addCardToHand.count}${suffix}`);
    }

    newCard.description = syncedDesc;

    return newCard;
};

const getHolographicVariantForCard = (card: Card): NonNullable<Card['holographicVariant']> => {
    return HOLOGRAPHIC_VARIANT_BY_CARD_TYPE[card.type] || card.holographicVariant || 'blue';
};

const boostHolographicValue = (value: number, minimum = 1): number => {
    return value + Math.max(minimum, Math.ceil(value * 0.25));
};

const boostHolographicDecimal = (value: number): number => {
    return Math.round((value + Math.max(0.25, value * 0.15)) * 100) / 100;
};

const syncHolographicNumber = (description: string, oldValue: number | undefined, newValue: number | undefined, patterns: RegExp[]): string => {
    if (oldValue === undefined || newValue === undefined || oldValue === newValue) return description;
    const escapedOldValue = String(oldValue).replace('.', '\\.');
    let synced = description;
    for (const pattern of patterns) {
        const next = synced.replace(pattern, (...args) => args[0].replace(new RegExp(escapedOldValue), String(newValue)));
        if (next !== synced) return next;
    }
    return synced;
};

const applyHolographicBonus = (card: Card): Card => {
    const base = { ...card };
    const next: Card = { ...card };

    if (next.heal !== undefined && next.heal > 0) next.heal = boostHolographicValue(next.heal, 2);
    if (next.gold !== undefined && next.gold > 0) next.gold = boostHolographicValue(next.gold, 5);
    if (next.blockMultiplier !== undefined && next.blockMultiplier > 0) next.blockMultiplier = boostHolographicDecimal(next.blockMultiplier);
    if (next.strengthScaling !== undefined && next.strengthScaling > 0) next.strengthScaling = boostHolographicValue(next.strengthScaling);
    if (next.fatalEnergy !== undefined && next.fatalEnergy > 0) next.fatalEnergy = boostHolographicValue(next.fatalEnergy);
    if (next.fatalPermanentDamage !== undefined && next.fatalPermanentDamage > 0) next.fatalPermanentDamage = boostHolographicValue(next.fatalPermanentDamage);
    if (next.fatalMaxHp !== undefined && next.fatalMaxHp > 0) next.fatalMaxHp = boostHolographicValue(next.fatalMaxHp);
    if (next.nextTurnEnergy !== undefined && next.nextTurnEnergy > 0) next.nextTurnEnergy = boostHolographicValue(next.nextTurnEnergy);
    if (next.nextTurnDraw !== undefined && next.nextTurnDraw > 0) next.nextTurnDraw = boostHolographicValue(next.nextTurnDraw);
    if (next.promptsCopy !== undefined && next.promptsCopy > 0) next.promptsCopy = boostHolographicValue(next.promptsCopy);
    if (next.damagePerAttackPlayed !== undefined && next.damagePerAttackPlayed > 0) next.damagePerAttackPlayed = boostHolographicValue(next.damagePerAttackPlayed);
    if (next.damagePerCardInHand !== undefined && next.damagePerCardInHand > 0) next.damagePerCardInHand = boostHolographicValue(next.damagePerCardInHand);
    if (next.damagePerStrike !== undefined && next.damagePerStrike > 0) next.damagePerStrike = boostHolographicValue(next.damagePerStrike);
    if (next.damagePerCardInDraw !== undefined && next.damagePerCardInDraw > 0) next.damagePerCardInDraw = boostHolographicValue(next.damagePerCardInDraw);
    if (next.playCopies !== undefined && next.playCopies > 0) next.playCopies = boostHolographicValue(next.playCopies);
    if (next.hitsPerSkillInHand !== undefined && next.hitsPerSkillInHand > 0) next.hitsPerSkillInHand = boostHolographicValue(next.hitsPerSkillInHand);
    if (next.hitsPerAttackPlayed !== undefined && next.hitsPerAttackPlayed > 0) next.hitsPerAttackPlayed = boostHolographicValue(next.hitsPerAttackPlayed);
    if (next.addCardToHand) next.addCardToHand = { ...next.addCardToHand, count: boostHolographicValue(next.addCardToHand.count) };
    if (next.addCardToDraw) next.addCardToDraw = { ...next.addCardToDraw, count: boostHolographicValue(next.addCardToDraw.count) };
    if (next.addCardToDiscard) next.addCardToDiscard = { ...next.addCardToDiscard, count: boostHolographicValue(next.addCardToDiscard.count) };

    let syncedDesc = next.description;
    syncedDesc = syncHolographicNumber(syncedDesc, base.heal, next.heal, [/HPを?\d+回復/, /HP\d+回復/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.gold, next.gold, [/\d+ゴールド/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.blockMultiplier, next.blockMultiplier, [/ブロックを\d+(?:\.\d+)?倍/, /ブロック\d+(?:\.\d+)?倍/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.fatalEnergy, next.fatalEnergy, [/倒すとE\d+/, /撃破時.*?E\d+/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.fatalPermanentDamage, next.fatalPermanentDamage, [/永久に\d+ダメージ/, /撃破時.*?\d+ダメージ/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.fatalMaxHp, next.fatalMaxHp, [/最大HP[+＋]\d+/, /最大HPを?\d+増/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.nextTurnEnergy, next.nextTurnEnergy, [/次(?:の)?ターン.*?(?:E|エナジー|エネルギー)[+＋]?\d+/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.nextTurnDraw, next.nextTurnDraw, [/次(?:の)?ターン.*?\d+枚引く/, /次(?:の)?ターン.*?ドロー[+＋]?\d+/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.promptsCopy, next.promptsCopy, [/\d+枚コピー/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.damagePerAttackPlayed, next.damagePerAttackPlayed, [/攻撃.*?\d+ダメージ/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.damagePerCardInHand, next.damagePerCardInHand, [/手札.*?\d+ダメージ/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.damagePerStrike, next.damagePerStrike, [/ストライク.*?\d+ダメージ/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.damagePerCardInDraw, next.damagePerCardInDraw, [/山札.*?\d+ダメージ/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.addCardToHand?.count, next.addCardToHand?.count, [/\d+枚手札に加える/, /」を\d+枚手札に加える/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.addCardToDraw?.count, next.addCardToDraw?.count, [/\d+枚山札に加える/, /」を\d+枚山札に加える/]);
    syncedDesc = syncHolographicNumber(syncedDesc, base.addCardToDiscard?.count, next.addCardToDiscard?.count, [/\d+枚捨て札に加える/, /」を\d+枚捨て札に加える/]);
    next.description = syncedDesc;

    return next;
};

export const createHolographicCard = (card: Card): Card => {
    if (card.holographic) return card;
    const boostedCard = applyHolographicBonus(getUpgradedCard({
        ...card,
        upgraded: false,
        holographic: false,
    }));

    return {
        ...boostedCard,
        upgraded: false,
        holographic: true,
        holographicVariant: getHolographicVariantForCard(boostedCard),
    };
};

const appendSentence = (description: string, sentence: string): string => {
    const trimmed = description.trim();
    if (trimmed.includes(sentence)) return trimmed;
    return `${trimmed}${trimmed.endsWith('。') ? '' : '。'}${sentence}`;
};

const getDisplayCardName = (cardName: string): string => CARDS_LIBRARY[cardName]?.name || cardName;

const roundSynthDecimal = (value: number): number => Math.round(value * 100) / 100;

const mergeCardGeneration = <T extends { cardName: string; count: number; cost0?: boolean }>(values: Array<T | undefined>): T | undefined => {
    const adds = values.filter((value): value is T => value !== undefined);
    if (adds.length === 0) return undefined;
    const firstCardName = adds[0].cardName;
    if (!adds.every(add => add.cardName === firstCardName)) return adds[0];
    const totalCount = adds.reduce((acc, add) => acc + add.count, 0);
    return { ...adds[0], count: totalCount };
};

const describeSynthPower = (id: string | undefined, amount: number): string => {
    switch (id) {
        case 'DEXTERITY': return `カチカチ${amount}`;
        case 'ARTIFACT': return `キラキラ${amount}`;
        case 'INTANGIBLE': return `スケスケ${amount}`;
        case 'METALLICIZE': return `金属化${amount}`;
        case 'REGEN': return `じわじわ回復${amount}`;
        case 'THORNS': return `トゲトゲ${amount}`;
        case 'ICE_CREAM': return '余ったエナジーを持ち越し';
        case 'DEMON_FORM': return `毎ターンムキムキ+${amount}`;
        case 'DRAW_POWER':
        case 'DRAW_POWER_2':
            return `毎ターンドロー+${amount}`;
        case 'BERSERK_POWER':
        case 'DEVA_FORM':
            return `毎ターンエナジー+${amount}`;
        case 'ENERGY_DRAW_POWER':
            return `毎ターンエナジー+${amount}/ドロー+${amount}`;
        case 'AFTER_IMAGE': return `使用時ブロック+${amount}`;
        case 'THOUSAND_CUTS': return `使用時全体${amount}ダメージ`;
        case 'ENVENOM': return `攻撃時ドクドク${amount}`;
        case 'ECHO_FORM': return `毎ターン初回${amount + 1}回発動`;
        case 'EVOLVE': return `状態異常でドロー+${amount}`;
        case 'MASTER_REALITY': return '生成カード強化';
        case 'STATIC_DISCHARGE': return `被弾時ランダム${5 * amount}ダメージ`;
        case 'BUFFER': return `HPダメージ無効${amount}回`;
        case 'BARRICADE': return 'ブロック持ち越し';
        case 'COST_REDUCTION': return `毎ターン全コスト-${amount}`;
        case 'CLEAR_DEBUFFS': return '全デバフ解除';
        case 'NOXIOUS_FUMES': return `毎ターン全体ドクドク${amount}`;
        case 'INFINITE_BLADES': return `毎ターン削りかす${amount}枚`;
        case 'ACCURACY': return `削りかす威力+${amount}`;
        case 'CORRUPTION': return 'スキル0コスト/廃棄';
        case 'FEEL_NO_PAIN': return `廃棄時ブロック+${amount}`;
        case 'RUPTURE': return `HP減少時ムキムキ+${amount}`;
        case 'CREATIVE_AI': return '毎ターンパワー生成';
        case 'BURST': return `次スキル${amount + 1}回発動`;
        case 'HEAL_ON_PLAY': return `使用時HP${amount}回復`;
        case 'LIZARD_TAIL': return '一度だけ復活';
        case 'LOSE_STRENGTH': return `ターン終了時ムキムキ-${amount}`;
        case 'SKILL_BLOCK': return `スキル時ブロック+${amount}`;
        case 'STRENGTH_DOWN': return `ターン終了時ムキムキ-${amount}`;
        case 'MERCURY_HOURGLASS': return `ターン終了時全体${amount}ダメージ`;
        default: return id ? `${id}${amount}` : '';
    }
};

const getTripleBoostedCard = (card: Card): Card => {
    let boosted = { ...card, upgraded: false, holographic: false };
    for (let i = 0; i < 3; i += 1) {
        boosted = getUpgradedCard({ ...boosted, upgraded: false });
    }
    return boosted;
};

export const createAssignmentRewardCard = (
    card: Card,
    options: { id?: string; variant?: number } = {},
): Card => {
    const boostedCard = applyHolographicBonus(getTripleBoostedCard(card));
    const variant = options.variant === undefined
        ? Math.floor(Math.random() * 6)
        : Math.max(0, Math.min(5, Math.floor(options.variant)));
    const next: Card = {
        ...boostedCard,
        id: options.id || `assignment-reward-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        upgraded: false,
        holographic: true,
        holographicVariant: getHolographicVariantForCard(boostedCard),
        rewardCard: true,
        rarity: 'SPECIAL',
    };

    switch (variant) {
        case 0:
            next.exhaust = true;
            next.description = appendSentence(next.description, '廃棄。');
            break;
        case 1:
            next.selfDamage = (next.selfDamage || 0) + 2;
            next.description = appendSentence(next.description, '自分に2ダメージ。');
            break;
        case 2:
            next.cost = Math.max(0, next.cost + 1);
            next.description = appendSentence(next.description, 'コストが1重い。');
            break;
        case 3:
            next.promptsDiscard = (next.promptsDiscard || 0) + 1;
            next.description = appendSentence(next.description, '手札を1枚捨てる。');
            break;
        case 4:
            next.innate = true;
            next.exhaust = true;
            next.description = appendSentence(appendSentence(next.description, '最初から手札に入る。'), '廃棄。');
            break;
        default:
            next.selfDamage = (next.selfDamage || 0) + 1;
            next.description = appendSentence(next.description, '自分に1ダメージ。');
            break;
    }

    return next;
};

export const synthesizeCards = (c1: Card, c2: Card, c3?: Card): Card => {
    // 1. Name Synthesis
    const len1 = Math.floor(Math.random() * 3) + 2;
    const len2 = Math.floor(Math.random() * 3) + 2;
    const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));

    let newName = "";
    if (c3) {
        const part2 = c2.name.substring(Math.floor(c2.name.length / 3), Math.floor(2 * c2.name.length / 3) + 1);
        const part3 = c3.name.substring(Math.max(0, c3.name.length - len2));
        newName = part1 + part2 + part3;
        // Trim if too long
        if (newName.length > 10) newName = newName.substring(0, 10);
    } else {
        const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
        newName = part1 + part2;
    }

    // 2. Cost Logic (Max of all)
    const newCost = Math.max(c1.cost, c2.cost, c3?.cost || 0);

    // 3. Helper for Summation
    const sum = (k: keyof Card) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0) + ((c3?.[k] as number) || 0);
    const sourceCards = [c1, c2, c3].filter(Boolean) as Card[];

    // Basic Stats
    const newDamage = sum('damage');
    const newBlock = sum('block');
    const newDraw = sum('draw');
    const newEnergy = sum('energy');
    const newHeal = sum('heal');
    const newPoison = sum('poison');
    const newWeak = sum('weak');
    const newVulnerable = sum('vulnerable');
    const newStrength = sum('strength');
    const newSelfDamage = sum('selfDamage');
    const newPoisonMultiplier = sum('poisonMultiplier');
    const newGold = sum('gold');
    const newBattleBonusDrawOnPlay = sum('battleBonusDrawOnPlay');
    const newHitsPerSkillInHand = sum('hitsPerSkillInHand');
    const newHitsPerAttackPlayed = sum('hitsPerAttackPlayed');
    const blockMultipliers = sourceCards
        .map(card => card.blockMultiplier)
        .filter((value): value is number => value !== undefined && value > 0);
    const newBlockMultiplier = blockMultipliers.length > 0
        ? roundSynthDecimal(blockMultipliers.reduce((acc, value) => acc * value, 1))
        : undefined;

    // Advanced Logic Summation/Max
    const s1 = c1.strengthScaling || 1;
    const s2 = c2.strengthScaling || 1;
    const s3 = c3?.strengthScaling || 1;
    const newStrengthScaling = (s1 - 1) + (s2 - 1) + (s3 - 1) + 1;

    const newFatalEnergy = sum('fatalEnergy');
    const newFatalPermanentDamage = sum('fatalPermanentDamage');
    const newFatalMaxHp = sum('fatalMaxHp');

    // Scaling Damages
    const newDamagePerStrike = sum('damagePerStrike');
    const newDamagePerCardInHand = sum('damagePerCardInHand');
    const newDamagePerAttackPlayed = sum('damagePerAttackPlayed');
    const newDamagePerCardInDraw = sum('damagePerCardInDraw');

    // Next Turn Effects
    const newNextTurnEnergy = sum('nextTurnEnergy');
    const newNextTurnDraw = sum('nextTurnDraw');

    // Prompts
    const newPromptsDiscard = sum('promptsDiscard');
    const newPromptsCopy = sum('promptsCopy');
    // promptsExhaust is special (99 = hand). If any is 99, result is 99. Else sum.
    const newPromptsExhaust = (c1.promptsExhaust === 99 || c2.promptsExhaust === 99 || c3?.promptsExhaust === 99) ? 99 : sum('promptsExhaust');

    // 4. Boolean/Flag Merging (OR)
    const newExhaust = c1.exhaust || c2.exhaust || c3?.exhaust;
    const newInnate = c1.innate || c2.innate || c3?.innate;
    const newEthereal = c1.unplayable || c2.unplayable || c3?.unplayable;
    const newLifesteal = c1.lifesteal || c2.lifesteal || c3?.lifesteal;
    const newUpgradeHand = c1.upgradeHand || c2.upgradeHand || c3?.upgradeHand;
    const newUpgradeDeck = c1.upgradeDeck || c2.upgradeDeck || c3?.upgradeDeck;
    const newDoubleBlock = c1.doubleBlock || c2.doubleBlock || c3?.doubleBlock;
    const newDoubleStrength = c1.doubleStrength || c2.doubleStrength || c3?.doubleStrength;
    const newCapture = c1.capture || c2.capture || c3?.capture;
    const newDamageBasedOnBlock = c1.damageBasedOnBlock || c2.damageBasedOnBlock || c3?.damageBasedOnBlock;
    const newShuffleHandToDraw = c1.shuffleHandToDraw || c2.shuffleHandToDraw || c3?.shuffleHandToDraw;
    const newAddPotion = c1.addPotion || c2.addPotion || c3?.addPotion;
    const newConsumedOnUse = c1.consumedOnUse || c2.consumedOnUse || c3?.consumedOnUse;
    const newEraserOnly = c1.eraserOnly || c2.eraserOnly || c3?.eraserOnly;
    const seedSource = sourceCards.find(card => card.isSeed);
    const familiarSource = sourceCards.find(card => card.familiarSummon);

    // 5. Multi-hit Logic (Additive)
    const extraHits1 = c1.playCopies || 0;
    const extraHits2 = c2.playCopies || 0;
    const extraHits3 = c3?.playCopies || 0;
    const newExtraHits = extraHits1 + extraHits2 + extraHits3;
    const newTotalHits = 1 + newExtraHits;

    // 6. Object Merging (Power, Card Gen)
    // applyPower: Sum amounts if IDs match. If different, try to preserve stronger or combine?
    // Simplified: Just pick one with priority (Power > Others), or sum if same ID.
    let newApplyPower = undefined;
    const powers = [c1.applyPower, c2.applyPower, c3?.applyPower].filter(p => p !== undefined);

    if (powers.length > 0) {
        // If all same ID, sum
        const firstId = powers[0]!.id;
        if (powers.every(p => p!.id === firstId)) {
            const totalAmount = powers.reduce((acc, p) => acc + p!.amount, 0);
            newApplyPower = { id: firstId, amount: totalAmount };
        } else {
            // Conflict. Prioritize POWER card type's power.
            const powerCard = [c1, c2, c3].find(c => c && c.type === CardType.POWER && c.applyPower);
            if (powerCard && powerCard.applyPower) {
                newApplyPower = powerCard.applyPower;
            } else {
                // Fallback to first
                newApplyPower = powers[0];
            }
        }
    }

    const newAddCardToHand = mergeCardGeneration([c1.addCardToHand, c2.addCardToHand, c3?.addCardToHand]);
    const newAddCardToDraw = mergeCardGeneration([c1.addCardToDraw, c2.addCardToDraw, c3?.addCardToDraw]);
    const newAddCardToDiscard = mergeCardGeneration([c1.addCardToDiscard, c2.addCardToDiscard, c3?.addCardToDiscard]);
    const holographicSource = sourceCards.find(c => c.holographic);
    const magicSource = sourceCards.find(c => c.magicHeroId && ((c.magicRuleCardIndices?.length ?? 0) > 0 || c.magicRuleCardIndex !== undefined));
    const magicRuleCardIndices = sourceCards.flatMap(c => {
        if (c.magicHeroId && c.magicHeroId !== magicSource?.magicHeroId) return [];
        if (c.magicRuleCardIndices?.length) return c.magicRuleCardIndices;
        return c.magicRuleCardIndex !== undefined ? [c.magicRuleCardIndex] : [];
    });
    const hasMagicSource = sourceCards.some(c =>
        c.visualTheme === 'magic' ||
        c.magicHeroId ||
        c.magicCardArtIndex !== undefined ||
        c.magicRuleCardIndex !== undefined ||
        c.magicBasicCardArt
    );

    // Play Condition
    let newPlayCondition = undefined;
    if ([c1, c2, c3].some(c => c?.playCondition === 'DRAW_PILE_EMPTY')) {
        newPlayCondition = 'DRAW_PILE_EMPTY';
    } else {
        newPlayCondition = c1.playCondition || c2.playCondition || c3?.playCondition;
    }

    // 7. Type & Target Logic
    let newType = c1.type;
    // Priority: Attack > Power > Skill > Status > Curse
    if (newDamage > 0) newType = CardType.ATTACK;
    else if (c1.type === CardType.POWER || c2.type === CardType.POWER || c3?.type === CardType.POWER) newType = CardType.POWER;
    else newType = CardType.SKILL;

    let newTarget = TargetType.ENEMY;
    // Priority: All Enemies > Random > Enemy > Self
    const allTargets = [c1.target, c2.target, c3?.target];
    if (allTargets.includes(TargetType.ALL_ENEMIES)) newTarget = TargetType.ALL_ENEMIES;
    else if (allTargets.includes(TargetType.RANDOM_ENEMY)) newTarget = TargetType.RANDOM_ENEMY;
    else if (allTargets.includes(TargetType.ENEMY)) newTarget = TargetType.ENEMY;
    else newTarget = TargetType.SELF;

    // Override target if damage/debuff exists but was originally self-targeting
    if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
        newTarget = TargetType.ENEMY;
    }

    // 8. Dynamic Description Generation
    const parts: string[] = [];

    if (newDamage > 0) {
        let text = `${newDamage}ダメージ`;
        if (newTarget === TargetType.ALL_ENEMIES) text = `全体${newDamage}ダメージ`;
        else if (newTarget === TargetType.RANDOM_ENEMY) text = `ランダム${newDamage}ダメージ`;
        else if (newTarget === TargetType.SELF) text = `自分に${text}`;

        if (newTotalHits > 1) {
            text += `x${newTotalHits}`;
        }
        if (newStrengthScaling > 1) text += `/ムキムキx${newStrengthScaling}`;
        parts.push(text);
    }

    if (newBlock > 0) parts.push(`ブロック${newBlock}`);
    if (newPoison > 0) parts.push(`${newTarget === TargetType.ALL_ENEMIES ? '全体' : ''}ドクドク${newPoison}`);
    if (newWeak > 0) parts.push(`${newTarget === TargetType.ALL_ENEMIES ? '全体' : ''}へろへろ${newWeak}`);
    if (newVulnerable > 0) parts.push(`${newTarget === TargetType.ALL_ENEMIES ? '全体' : ''}びくびく${newVulnerable}`);
    if (newStrength > 0) parts.push(`ムキムキ${newStrength}`);
    if (newStrength < 0) parts.push(`敵ムキムキ${newStrength}`);
    if (newPoisonMultiplier > 0) parts.push(`ドクドクx${newPoisonMultiplier}`);
    if (newDraw > 0) parts.push(`${newDraw}枚引く`);
    if (newEnergy > 0) parts.push(`エナジー+${newEnergy}`);
    if (newHeal > 0) parts.push(`HP${newHeal}回復`);
    if (newGold > 0) parts.push(`${newGold}G`);
    if (newAddPotion) parts.push("ポーション入手");
    if (newSelfDamage > 0) parts.push(`自分に${newSelfDamage}ダメージ`);
    if (newBlockMultiplier !== undefined) parts.push(`ブロックx${newBlockMultiplier}`);
    if (newShuffleHandToDraw) parts.push("捨て札を山札");

    // Advanced Logic Descriptions
    if (newDamageBasedOnBlock) parts.push("ブロック値分のダメージ");
    if (newDamagePerStrike > 0) parts.push(`攻撃枚数x${newDamagePerStrike}追加`);
    if (newDamagePerCardInHand > 0) parts.push(`手札枚数x${newDamagePerCardInHand}`);
    if (newDamagePerAttackPlayed > 0) parts.push(`使用攻撃x${newDamagePerAttackPlayed}追加`);
    if (newDamagePerCardInDraw > 0) parts.push(`山札枚数x${newDamagePerCardInDraw}`);
    if (newHitsPerSkillInHand > 0) parts.push("手札スキル数ヒット");
    if (newHitsPerAttackPlayed > 0) parts.push("使用攻撃数ヒット");
    if (newBattleBonusDrawOnPlay > 0) parts.push(`使用後ドロー+${newBattleBonusDrawOnPlay}`);

    if (newLifesteal) parts.push("HP吸収");
    if (newDoubleBlock) parts.push("ブロック2倍");
    if (newDoubleStrength) parts.push("ムキムキ2倍");
    if (newCapture) parts.push("捕獲");
    if (newUpgradeHand) parts.push("手札全強化");
    if (newUpgradeDeck) parts.push("デッキ全強化");

    // Generation / Actions
    if (newAddCardToHand) parts.push(`${getDisplayCardName(newAddCardToHand.cardName)}${newAddCardToHand.count}枚を手札`);
    if (newAddCardToDraw) parts.push(`${getDisplayCardName(newAddCardToDraw.cardName)}${newAddCardToDraw.count}枚を山札`);
    if (newAddCardToDiscard) parts.push(`${getDisplayCardName(newAddCardToDiscard.cardName)}${newAddCardToDiscard.count}枚を捨て札`);

    if (newPromptsDiscard > 0) parts.push(`手札を${newPromptsDiscard}枚捨てる`);
    if (newPromptsExhaust > 0) parts.push(newPromptsExhaust === 99 ? "手札全廃棄" : `手札を${newPromptsExhaust}枚廃棄`);
    if (newPromptsCopy > 0) parts.push(`${newPromptsCopy}枚コピー`);

    // Fatal Effects
    if (newFatalEnergy > 0) parts.push(`撃破時エナジー+${newFatalEnergy}`);
    if (newFatalPermanentDamage > 0) parts.push(`撃破時威力+${newFatalPermanentDamage}`);
    if (newFatalMaxHp > 0) parts.push(`撃破時最大HP+${newFatalMaxHp}`);

    // Next Turn
    if (newNextTurnEnergy > 0) parts.push(`次ターンエナジー+${newNextTurnEnergy}`);
    if (newNextTurnDraw > 0) parts.push(`次ターンドロー+${newNextTurnDraw}`);

    // Power
    if (newApplyPower) {
        const powerText = describeSynthPower(newApplyPower.id, newApplyPower.amount);
        if (powerText) parts.push(powerText);
    }

    if (newPlayCondition === 'DRAW_PILE_EMPTY') parts.push("山札0の時のみ");
    if (newPlayCondition === 'HAND_ONLY_ATTACKS') parts.push("手札が攻撃のみの時");

    if (newExhaust) parts.push("廃棄");
    if (newInnate) parts.push("天賦");
    if (newEthereal) parts.push("使用不可");
    if (newConsumedOnUse) parts.push("使い切り");
    if (newEraserOnly) parts.push("効果消し");
    if (seedSource?.grownCardId) parts.push(`${getDisplayCardName(seedSource.grownCardId)}に成長`);
    if (familiarSource?.familiarSummon) parts.push(`${familiarSource.familiarSummon.name}召喚`);

    // Special Logic Descriptions (Manual map for effects not covered by stats)
    const specialDescMap: Record<string, string> = {
        '発見': 'ランダムなカードを3枚生成', 'DISCOVERY': 'ランダムなカードを3枚生成',
        '国語辞典': '特殊演出',
        'ゼロの発見': 'ランダムなカードを3枚生成', 'SANSU_ZERO': 'ランダムなカードを3枚生成',
        '読解力': '次のスキル2回発動',
        '未完の小説': '捨て札を山札に戻す',
        '無限大': '特殊演出',
        '理科室の調合': '0コストのカードを1枚生成', '錬金術': '0コストのカードを1枚生成', 'ALCHEMIZE': '0コストのカードを1枚生成',
        '山勘': '手札を全捨て＆ドロー', 'CALCULATED_GAMBLE': '手札を全捨て＆ドロー',
        '単位変換': '手札を全入れ替え', 'SANSU_UNIT': '手札を全入れ替え',
        'パニック': '手札1枚を0コスト',
        '魅惑のカカオ': '手札を全入れ替え',
        'あがく': '0コスト以外を捨てる', 'SCRAPE': '0コスト以外を捨てる',
        '早退': 'HP30以下を消滅', 'EXPULSION': 'HP30以下を消滅',
        '大ジャンプ': '追加ターン', 'VAULT': '追加ターン',
        '次元跳躍': '状態異常を消滅してムキムキ',
        '断捨離': '非攻撃を廃棄', 'SEVER_SOUL': '非攻撃を廃棄',
        '読書感想文': '非攻撃を廃棄', 'KOKUGO_BOOK_REPORT': '非攻撃を廃棄',
        '大掃除': '手札廃棄数x7ダメ', 'FIEND_FIRE': '手札廃棄数x7ダメ',
        'むしゃくしゃ': 'プレイ時威力+5', 'YATSUATARI': 'プレイ時威力+5',
        '磁石の力': '捨て札から1枚回収', 'RIKA_MAGNET': '捨て札から1枚回収',
        '鉄棒の逆上がり': '捨て札から1枚回収', 'PE_HORIZONTAL_BAR': '捨て札から1枚回収',
        '虹のプリズム': '手札2枚強化', 'RIKA_RAINBOW': '手札2枚強化',
        '学習アルゴリズム': '永続ブロック増加', 'GENETIC_ALGORITHM': '永続ブロック増加',
        '人体模型': 'スケスケ1',
        'バザーの掘り出し物': '特殊演出',
        '学級委員選挙': '特殊演出',
        '伝統文化': '生成カード強化',
        '歴史の教科書': '毎ターン全コスト-1',
        '未来都市': '毎ターンエナジー+1/ドロー+1',
        'お年玉貯金': '100G',
        '産業革命': '今/次ターンエナジー+1/1枚引く',
        '覚醒のコーヒー': '1枚引く/自分に1ダメージ',
        '世界遺産登録': '最大HP+5',
        '学芸会の主役': '使用時ブロック+1',
        'カンニング': '手札の攻撃をコピー',
        'お人形遊び': '手札のスキルをコピー',
        '二本鉛筆': '手札1枚を2枚コピー', '二刀流': '手札1枚を2枚コピー',
        'フォークダンス': '手札1枚コピー/1枚捨てる',
        '鏡 (星新一)': '手札1枚コピー/自分にびくびく1',
        'きてんの窓': '高コスト優先コピーを0コスト',
        'スポーツ王': 'カチカチ2',
        '顕微鏡': '次ターンドロー+1',
        'キラキラの粉': '敵全体へろへろ1',
        '邪智暴虐': '1枚引く',
        '一寸法師': '連撃後ブロック3',
        '縄跳び': '自分に1ダメージ',
        '飴玉の嵐': '敵全体へろへろ1',
        'ブーメラン': 'エナジー+1',
        'かいけつゾロリ': 'ブロック3',
        '側転': 'ブロック2',
        '電脳世界へのダイブ': '手札1枚を0コスト',
        'スタンプラリー': '5枚使用でエナジー+1/2ドロー', 'OUT_STAMP_COLLECT': '5枚使用でエナジー+1/2ドロー',
        '戦隊ヒーローのポーズ': '攻撃に使用後ドロー付与', 'OUT_SUPER_HERO_POSE': '攻撃に使用後ドロー付与',
        '秘密のプレゼント': 'ポーション2個入手', 'GIRLS_GIFT_BOX': 'ポーション2個入手',
        '天気予報': '山札を確認して並べ替え', 'RIKA_WEATHER': '山札を確認して並べ替え',
        '金魚すくい': '手札1枚を強化して0コスト', 'OUT_GOLD_FISH': '手札1枚を強化して0コスト',
        '夢のおもちゃ屋': 'レジェンダリーを1枚生成', 'OUT_TOY_STORE': 'レジェンダリーを1枚生成',
        '幻覚キノコ': 'ランダムカードを複数生成', 'MYSTIC_MUSHROOM': 'ランダムカードを複数生成',
        'お年玉の誘惑': '手札1枚を0コスト', 'OUT_NEW_YEAR_GOLD': '手札1枚を0コスト',
        'ガチャの神引き': 'デッキのレジェンダリーをコピー', 'OUT_GACHA_LUCK': 'デッキのレジェンダリーをコピー',
        '図書室での昼寝': 'HP全回復/デバフ解除', 'OUT_LIBRARY_SLEEP': 'HP全回復/デバフ解除',
        '手作りの宝地図': 'ランダムなレリック入手', 'OUT_TREASURE_MAP': 'ランダムなレリック入手',
        '初詣の願い事': '手札を全て0コスト', 'OUT_SHRINE_PRAY': '手札を全て0コスト',
        'ローラーシューズ': '手札を全て0コスト', 'OUT_ROLLER_BLADE': '手札を全て0コスト',
        '虫かごの秘密': '捕獲カードを手札に加える', 'OUT_BUG_BOX': '捕獲カードを手札に加える',
        '出前ピザパーティー': '自分とパートナーを全回復', 'OUT_PIZZA_PARTY': '自分とパートナーを全回復',
        '虹を追いかけて': 'デッキ5枚を強化', 'OUT_RAINBOW_CHASE': 'デッキ5枚を強化',
        '迷い犬の恩返し': '次戦闘開始時エナジー+3', 'OUT_STREET_DOG': '次戦闘開始時エナジー+3',
        '究極の10連ガチャ': 'ランダムカード10枚生成', 'OUT_SUPER_GACHA': 'ランダムカード10枚生成',
        'いつかの卒業式': 'ムキムキ20/カチカチ20/キラキラ5', 'OUT_GRADUATION_DAY': 'ムキムキ20/カチカチ20/キラキラ5',
        '田んぼのかかし': '敵全体を眠らせる', 'OUT_SCARE_CROW': '敵全体を眠らせる',
        'おやすみスウィート': '敵全体を眠らせる', 'GIRLS_SWEET_DREAM': '敵全体を眠らせる',
        'ドリーム・キャッチャー': '山札から1枚選ぶ', 'GIRLS_DREAM_CATCHER': '山札から1枚選ぶ',
        'なないろマジック': '手札1枚を0コスト', 'GIRLS_RAINBOW_MAGIC': '手札1枚を0コスト',
        'お姫様の呼び声': '山札からスキルを手札へ', 'GIRLS_PRINCESS_CALL': '山札からスキルを手札へ',
        'おとぎ話の扉': 'スペシャルカード3枚生成', 'GIRLS_FAIRY_TALE': 'スペシャルカード3枚生成',
        '影分身の術': '手札の攻撃を全コピー', 'BOYS_SHADOW_CLONE': '手札の攻撃を全コピー',
        '真の勇者覚醒': '毎ターンエナジー+1/ドロー+1/ムキムキ2',
        '秘密のラブレター': '非ボス敵を逃がす',
        '真夏の肝試し': '敵全体ムキムキ-3',
        '秘密の近道': '山札から高コスト優先で0コスト化',
        '天体観測': '特殊演出',
        '親友との約束': 'パートナー最大HP+20', 'OUT_FRIEND_FOREVER': 'パートナー最大HP+20',
        'ずっと友達だよ': 'パートナー連携強化', 'GIRLS_FRIENDSHIP': 'パートナー連携強化',
        '雷神の鉄拳': '追加の雷ダメージ', 'BOYS_THUNDER_FIST': '追加の雷ダメージ',
        'リベンジ・バースト': 'HP低下時に追加ダメージ', 'BOYS_REVENGE': 'HP低下時に追加ダメージ',
        '修羅の構え': '攻撃性能を強化', 'BOYS_BATTLE_STANCE': '攻撃性能を強化',
        '路地裏の野良猫': '次の攻撃が3回発動', 'OUT_STRAY_CAT': '次の攻撃が3回発動',
        'バネの弾力': 'ブロックと反撃準備', 'RIKA_SPRING': 'ブロックと反撃準備',
        '華麗な舞': 'ムキムキ+2', 'GIRLS_BALLERINA': 'ムキムキ+2',
        '本命チョコ': 'HP回復と強化', 'GIRLS_CHOCO_VALENTINE': 'HP回復と強化',
        'カラフル・レインボー': '敵全体のブロック解除', 'GIRLS_COLORFUL_RAIN': '敵全体のブロック解除',
        '川での魚つかみ': 'ランダムな魚効果', 'OUT_FISH_CATCH': 'ランダムな魚効果',
        '奇跡のリボン': 'エナジー全回復', 'GIRLS_MIRACLE_RIBBON': 'エナジー全回復',
        'おじいちゃんの古民家': 'HP全回復', 'OUT_OLD_HOUSE': 'HP全回復',
        '夕焼けのチャイム': '非ボス敵を帰宅させる',
        '伝説のかくれんぼ': 'スケスケ2',
        '二度寝の誘惑に勝てない...。': 'HP15回復/次ターンエナジー+2/ドロー+2',
        '休日の二度寝': 'HP15回復/次ターンエナジー+2/ドロー+2',
        '水たまりジャンプ': '使用時エナジー回復',
        '工事現場の重機': '敵全体のブロック解除',
        '僕だけのヒーロー': '特殊演出',
        'デコレーション・ケーキ': '使用時HP回復',
        '戦略家': '捨てられた時E+2', 'STRATEGIST': '捨てられた時E+2',
        'カンニングペーパー': '捨てられた時E+2',
        '羅生門': '撃破時に手札1枚廃棄', 'RASHOMON': '撃破時に手札1枚廃棄',
        '時間どろぼう': '敵行動を1ターン遅延', 'TIME_THIEF': '敵行動を1ターン遅延',
        '空虚': 'E-1', 'VOID': 'E-1'
    };

    const addedSpecialDescs = new Set<string>();
    const checkAndAddSpecialDesc = (c: Card) => {
        const checkName = (n: string) => {
            if (specialDescMap[n]) addedSpecialDescs.add(specialDescMap[n]);
        };
        checkName(c.name);
        c.originalNames?.forEach(checkName);
    };

    sourceCards.forEach(checkAndAddSpecialDesc);

    parts.push(...Array.from(addedSpecialDescs));
    if (magicSource?.magicHeroId && magicRuleCardIndices.length > 0) {
        const stepLabels = magicRuleCardIndices.map(index => `${index + 1}枚目`).join('→');
        parts.push(`専用ルールを素材順に進める(${stepLabels}扱い)`);
    }

    let description = parts.join("。") + (parts.length > 0 ? "。" : "");
    if (parts.length === 0) description = "効果なし。";

    // 9. Visual Synthesis (Texture Ref)
    const shapeSource = c1.textureRef ? c1.textureRef.split('|')[0] : getShapeFromCard(c1);
    const colorSource = c2.textureRef ? (c2.textureRef.split('|')[1] || c2.textureRef.split('|')[0]) : c2.name;
    // Mix type from c3 if present for color variation, or just newType
    const typeSource = c3 ? (c3.textureRef ? (c3.textureRef.split('|')[2] || c3.type) : c3.type) : newType;

    const newTextureRef = `${shapeSource}|${colorSource}|${typeSource}`;

    const { refs: mergedIllustrationRefs, writeIndex: illustrationRefWriteIndex } = mergeIllustrationRefsCircular(c1, c2, c3);

    // 10. Inherit Original Names for Special Logic
    const originalNameCandidates: string[] = [];
    const addOriginals = (c: Card) => {
        if (c.originalNames && c.originalNames.length > 0) {
            originalNameCandidates.push(...c.originalNames);
        } else {
            originalNameCandidates.push(c.name);
        }
    };
    addOriginals(c1);
    addOriginals(c2);
    if (c3) addOriginals(c3);
    const originalNames = uniqueStrings(originalNameCandidates);

    return {
        id: `synth-${Date.now()}-${Math.random()}`,
        name: newName,
        cost: newCost,
        type: newType,
        target: newTarget,
        description: description,
        rarity: 'SPECIAL',

        originalNames: originalNames, // Add this

        // Basic
        damage: newDamage || undefined,
        block: newBlock || undefined,
        draw: newDraw || undefined,
        energy: newEnergy || undefined,
        heal: newHeal || undefined,
        gold: newGold || undefined,
        addPotion: newAddPotion || undefined,
        blockMultiplier: newBlockMultiplier,
        poison: newPoison || undefined,
        weak: newWeak || undefined,
        vulnerable: newVulnerable || undefined,
        strength: newStrength || undefined,
        poisonMultiplier: newPoisonMultiplier || undefined,
        selfDamage: newSelfDamage || undefined,
        playCopies: newExtraHits > 0 ? newExtraHits : undefined,

        // Flags
        exhaust: newExhaust,
        consumedOnUse: newConsumedOnUse,
        innate: newInnate,
        unplayable: newEthereal,
        playCondition: newPlayCondition as any,

        // Advanced props
        strengthScaling: newStrengthScaling > 1 ? newStrengthScaling : undefined,
        lifesteal: newLifesteal,
        upgradeHand: newUpgradeHand,
        upgradeDeck: newUpgradeDeck,
        doubleBlock: newDoubleBlock,
        doubleStrength: newDoubleStrength,
        capture: newCapture,
        damageBasedOnBlock: newDamageBasedOnBlock,
        shuffleHandToDraw: newShuffleHandToDraw,
        applyPower: newApplyPower,
        battleBonusDrawOnPlay: newBattleBonusDrawOnPlay || undefined,
        eraserOnly: newEraserOnly,
        familiarSummon: familiarSource?.familiarSummon ? { ...familiarSource.familiarSummon } : undefined,
        isSeed: seedSource?.isSeed,
        growthRequired: seedSource?.growthRequired,
        grownCardId: seedSource?.grownCardId,

        // Generation
        addCardToHand: newAddCardToHand,
        addCardToDraw: newAddCardToDraw,
        addCardToDiscard: newAddCardToDiscard,

        // Complex / Fatal
        fatalEnergy: newFatalEnergy || undefined,
        fatalPermanentDamage: newFatalPermanentDamage || undefined,
        fatalMaxHp: newFatalMaxHp || undefined,
        damagePerStrike: newDamagePerStrike || undefined,
        damagePerCardInHand: newDamagePerCardInHand || undefined,
        damagePerAttackPlayed: newDamagePerAttackPlayed || undefined,
        damagePerCardInDraw: newDamagePerCardInDraw || undefined,
        hitsPerSkillInHand: newHitsPerSkillInHand || undefined,
        hitsPerAttackPlayed: newHitsPerAttackPlayed || undefined,

        // Prompts
        promptsDiscard: newPromptsDiscard || undefined,
        promptsCopy: newPromptsCopy || undefined,
        promptsExhaust: newPromptsExhaust || undefined,

        // Next Turn
        nextTurnEnergy: newNextTurnEnergy || undefined,
        nextTurnDraw: newNextTurnDraw || undefined,

        textureRef: newTextureRef,
        illustrationRefs: mergedIllustrationRefs,
        illustrationRefWriteIndex,
        holographic: !!holographicSource,
        holographicVariant: holographicSource
            ? (holographicSource.holographicVariant || getHolographicVariantForCard({ ...holographicSource, type: newType }))
            : undefined,
        visualTheme: hasMagicSource ? 'magic' : c1.visualTheme,
        magicHeroId: magicSource?.magicHeroId,
        magicRuleCardIndex: magicRuleCardIndices[0],
        magicRuleCardIndices: magicRuleCardIndices.length > 0 ? magicRuleCardIndices : undefined,
        magicRuleCardArt: magicSource ? false : undefined
    };
};
