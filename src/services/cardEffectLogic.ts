
import { Player, Enemy, Card as ICard, CardType, TargetType, VisualEffectInstance, EnemyIntentType, LanguageMode } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY } from '../constants';
import { ADDITIONAL_CARDS } from '../constants1';
import { trans } from '../utils/textUtils';
import { getUpgradedCard } from '../utils/cardUtils';
import { storageService } from './storageService';

// ヘルパー関数: デバフの付与
const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
    if (enemy.artifact > 0) {
        enemy.artifact--;
        return;
    }
    if (type === 'WEAK') enemy.weak += amount;
    if (type === 'VULNERABLE') enemy.vulnerable += amount;
    if (type === 'POISON') enemy.poison += amount;
};

// ヘルパー関数: シャッフル
const shuffle = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
};

const APP_CANONICAL_CARD_LOGIC_KEY_LIST = [
    '単位変換',
    'SANSU_UNIT',
    '磁石の力',
    'RIKA_MAGNET',
    '虹のプリズム',
    'RIKA_RAINBOW',
    '天気予報',
    'RIKA_WEATHER',
    'おとぎ話の扉',
    'GIRLS_FAIRY_TALE',
    'お姫様の呼び声',
    'GIRLS_PRINCESS_CALL',
    '夢のおもちゃ屋',
    'OUT_TOY_STORE',
    '究極の10連ガチャ',
    'OUT_SUPER_GACHA',
    '虫かごの秘密',
    'OUT_BUG_BOX',
    'お年玉の誘惑',
    'OUT_NEW_YEAR_GOLD',
    '路地裏の野良猫',
    'OUT_STRAY_CAT',
    '金魚すくい',
    'OUT_GOLD_FISH',
    'ローラーシューズ',
    'OUT_ROLLER_BLADE',
    '虹を追いかけて',
    'OUT_RAINBOW_CHASE',
];
const APP_CANONICAL_CARD_LOGIC_KEYS = new Set(APP_CANONICAL_CARD_LOGIC_KEY_LIST);
const ADDITIONAL_CARD_NAMES = new Set(Object.values(ADDITIONAL_CARDS).map(card => card.name.trim()));

const getAvailableSpecialCards = () => {
    const unlockedCardNames = new Set(storageService.getUnlockedCards().map(name => name.trim()));
    return Object.values(CARDS_LIBRARY).filter(card =>
        card.rarity === 'SPECIAL' &&
        !card.isSeed &&
        (!ADDITIONAL_CARD_NAMES.has(card.name.trim()) || unlockedCardNames.has(card.name.trim()))
    );
};

const isHandledByAppCardLogic = (card: ICard): boolean => {
    const keys = [card.name, ...(card.originalNames ?? [])].filter(Boolean);
    return keys.some(key => APP_CANONICAL_CARD_LOGIC_KEYS.has(key))
        || APP_CANONICAL_CARD_LOGIC_KEY_LIST.some(key => card.id?.includes(key));
};

/**
 * constants1.ts で追加されたカードの中で、
 * 標準的なパラメータ (damage, block, draw, etc) だけでは実現できない特殊ロジックを処理します。
 */
export const applyAdditionalCardLogic = (
    card: ICard,
    player: Player,
    enemies: Enemy[],
    languageMode: LanguageMode,
    currentLogs: string[],
    nextActiveEffects: VisualEffectInstance[],
    effectiveCost: number = card.cost
): { player: Player; enemies: Enemy[] } => {
    const p = { ...player };
    const e_list = [...enemies];

    if (isHandledByAppCardLogic(card)) {
        return { player: p, enemies: e_list };
    }

    const addCardToHand = (template: any, cost0 = true) => {
        let newC = { ...template, id: `gen-${Date.now()}-${Math.random()}` } as ICard;
        if (cost0) newC.cost = 0;
        if (p.powers['MASTER_REALITY']) {
            newC = getUpgradedCard(newC);
        }
        p.hand.push(newC);
        return newC;
    };

    const expansionEffects = card.expansionEffects?.length
        ? card.expansionEffects
        : card.expansionEffect
            ? [card.expansionEffect]
            : [];
    if (expansionEffects.length > 0) {
        const handIndex = p.hand.findIndex(c => c.id === card.id);
        const otherCards = p.hand.filter(c => c.id !== card.id);
        const handCountAtPlay = p.hand.length;
        const energyAfter = Math.max(0, p.currentEnergy - effectiveCost);
        const livingEnemies = e_list.filter(enemy => enemy.currentHp > 0);
        const attackIntentTypes = new Set([
            EnemyIntentType.ATTACK,
            EnemyIntentType.ATTACK_DEBUFF,
            EnemyIntentType.ATTACK_DEFEND,
            EnemyIntentType.PIERCE_ATTACK,
        ]);
        const conditionMet = (expansion: NonNullable<ICard['expansionEffect']>) => {
            switch (expansion.condition) {
                case 'LEFTMOST': return handIndex === 0;
                case 'RIGHTMOST': return handIndex === handCountAtPlay - 1;
                case 'HAND_EVEN': return handCountAtPlay % 2 === 0;
                case 'HAND_ODD': return handCountAtPlay % 2 === 1;
                case 'ENERGY_ZERO_AFTER': return energyAfter === 0;
                case 'ENERGY_EVEN_AFTER': return energyAfter % 2 === 0;
                case 'NO_BLOCK': return p.block === 0;
                case 'LOW_HP': return p.currentHp * 2 <= p.maxHp;
                case 'ENEMY_ATTACKING': return livingEnemies.some(enemy => attackIntentTypes.has(enemy.nextIntent.type));
                case 'ENEMY_NOT_ATTACKING': return livingEnemies.length > 0 && livingEnemies.every(enemy => !attackIntentTypes.has(enemy.nextIntent.type));
                case 'DRAW_EVEN': return p.drawPile.length % 2 === 0;
                case 'DISCARD_ODD': return p.discardPile.length % 2 === 1;
                case 'NO_ATTACK_PLAYED': return p.attacksPlayedThisTurn === 0;
                case 'THIRD_OR_LATER': return p.cardsPlayedThisTurn >= 2;
                case 'SAME_TYPE_IN_HAND': return otherCards.some(other => other.type === card.type);
                case 'HIGHEST_COST_IN_HAND': return p.hand.every(other => other.cost <= card.cost);
                default: return false;
            }
        };

        const drawOne = () => {
            // A draw effect may use only the cards currently in the draw pile.
            // The discard pile is rebuilt at the start of the next turn; it is
            // not an implicit source for in-turn draws.
            const drawn = p.drawPile.pop();
            if (drawn) p.hand.push(drawn);
        };

        expansionEffects.forEach((expansion) => {
            if (conditionMet(expansion)) {
                switch (expansion.reward) {
                case 'DRAW': drawOne(); break;
                case 'BLOCK': p.block += 5; break;
                case 'ENERGY': p.currentEnergy += 1; break;
                case 'HEAL': p.currentHp = Math.min(p.maxHp, p.currentHp + 3); break;
                case 'NEXT_DRAW': p.nextTurnDraw += 1; break;
                case 'NEXT_ENERGY': p.nextTurnEnergy += 1; break;
                case 'STRENGTH': p.strength += 1; break;
                case 'DEXTERITY': p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 1; break;
                case 'POISON_RANDOM': {
                    if (livingEnemies.length > 0) {
                        const enemy = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                        applyDebuff(enemy, 'POISON', 3);
                    }
                    break;
                }
                case 'WEAK_ALL': livingEnemies.forEach(enemy => applyDebuff(enemy, 'WEAK', 1)); break;
                case 'RECOVER_DISCARD': {
                    const recovered = p.discardPile.pop();
                    if (recovered) p.hand.push(recovered);
                    break;
                }
                case 'UPGRADE_HAND': {
                    const index = p.hand.findIndex(other => other.id !== card.id && !other.upgraded);
                    if (index >= 0) p.hand[index] = getUpgradedCard(p.hand[index]);
                    break;
                }
                case 'DISCOUNT_HAND': {
                    const target = otherCards.reduce<ICard | null>((best, other) => !best || other.cost > best.cost ? other : best, null);
                    if (target) {
                        const targetIndex = p.hand.findIndex(other => other.id === target.id);
                        if (targetIndex >= 0) p.hand[targetIndex] = { ...p.hand[targetIndex], cost: Math.max(0, p.hand[targetIndex].cost - 1) };
                    }
                    break;
                }
                case 'HAND_COUNT_BLOCK': p.block += handCountAtPlay; break;
                }
                currentLogs.push(trans(`固有共鳴${String(expansion.serial).padStart(3, '0')}が発動！`, languageMode));
                nextActiveEffects.push({ id: `vfx-expansion-${expansion.serial}-${Date.now()}`, type: 'BUFF', targetId: 'player' });
            } else {
                currentLogs.push(trans(`固有共鳴${String(expansion.serial).padStart(3, '0')}は条件未達`, languageMode));
            }
        });
    }
    // カード名に基づいた特殊ロジックの分岐 (合成カード対応)
    const targetNames = (card.originalNames && card.originalNames.length > 0) ? card.originalNames : [card.name];

    targetNames.forEach(targetName => {
        switch (targetName) {
            // --- 国語系 ---
            case '国語辞典': {
                nextActiveEffects.push({ id: `vfx-dic-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '読解力': {
                p.powers['BURST'] = (p.powers['BURST'] || 0) + 1;
                currentLogs.push(trans("読解力：次のスキルは2回発動する！", languageMode));
                break;
            }
            case '未完の小説': {
                p.drawPile = shuffle([...p.drawPile, ...p.discardPile]);
                p.discardPile = [];
                currentLogs.push(trans("未完の小説：捨て札をすべて山札に戻した", languageMode));
                nextActiveEffects.push({ id: `vfx-novel-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            // --- 算数系 ---
            case 'ゼロの発見': {
                nextActiveEffects.push({ id: `vfx-zero-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '無限大': {
                nextActiveEffects.push({ id: `vfx-inf-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '単位変換': {
                const count = p.hand.filter(c => c.id !== card.id).length;
                p.hand.filter(c => c.id !== card.id).forEach(c => p.discardPile.push(c));
                p.hand = p.hand.filter(c => c.id === card.id);
                for (let i = 0; i < count; i++) {
                    const drawn = p.drawPile.pop();
                    if (!drawn) break;
                    p.hand.push(drawn);
                }
                currentLogs.push(trans("単位変換：手札をすべて入れ替えた", languageMode));
                nextActiveEffects.push({ id: `vfx-unit-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case 'パニック': {
                const pool = p.hand.filter(c => c.id !== card.id);
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    pick.cost = 0;
                    pick.xCost = false;
                    currentLogs.push(trans(`パニック：「${pick.name}」が0コストになった`, languageMode));
                    nextActiveEffects.push({ id: `vfx-panic-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }
            case '魅惑のカカオ': {
                const handToReplace = p.hand.filter(c => c.id !== card.id);
                p.hand = p.hand.filter(c => c.id === card.id);
                handToReplace.forEach(c => p.discardPile.push(c));
                for (let i = 0; i < handToReplace.length; i++) {
                    const drawn = p.drawPile.pop();
                    if (!drawn) break;
                    p.hand.push(drawn);
                }
                currentLogs.push(trans(`魅惑のカカオ：手札を${handToReplace.length}枚入れ替えた`, languageMode));
                nextActiveEffects.push({ id: `vfx-cacao-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            // --- 理科系 ---
            case '磁石の力': {
                nextActiveEffects.push({ id: `vfx-mag-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '虹のプリズム': {
                nextActiveEffects.push({ id: `vfx-prism-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '天気予報': {
                currentLogs.push(trans("天気予報：明日の運勢を占った（山札並び替え）", languageMode));
                break;
            }
            case '人体模型': {
                p.powers['INTANGIBLE'] = (p.powers['INTANGIBLE'] || 0) + 1;
                currentLogs.push(trans("人体模型：スケスケ状態になった！", languageMode));
                nextActiveEffects.push({ id: `vfx-anat-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            // --- 社会系 ---
            case 'バザーの掘り出し物': {
                nextActiveEffects.push({ id: `vfx-market-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '学級委員選挙': {
                nextActiveEffects.push({ id: `vfx-vote-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '伝統文化': {
                p.powers['MASTER_REALITY'] = (p.powers['MASTER_REALITY'] || 0) + 1;
                currentLogs.push(trans("伝統文化：生成されるカードが常に強化される！", languageMode));
                break;
            }
            case '歴史の教科書': {
                p.powers['COST_REDUCTION'] = (p.powers['COST_REDUCTION'] || 0) + 1;
                currentLogs.push(trans("歴史の教科書：コスト軽減の力を得た", languageMode));
                nextActiveEffects.push({ id: `vfx-hist-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '未来都市': {
                p.powers['ENERGY_DRAW_POWER'] = (p.powers['ENERGY_DRAW_POWER'] || 0) + 1;
                currentLogs.push(trans("未来都市：毎ターンエナジーとドローが強化された", languageMode));
                nextActiveEffects.push({ id: `vfx-city-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case 'お年玉貯金': {
                p.gold += 100;
                currentLogs.push(trans("お年玉貯金：100ゴールド獲得！", languageMode));
                nextActiveEffects.push({ id: `vfx-bank-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '産業革命': {
                p.currentEnergy += 1;
                p.nextTurnEnergy += 1;
                const drawn = p.drawPile.pop();
                if (drawn) p.hand.push(drawn);
                currentLogs.push(trans("産業革命：Eを今/次ターンに分割し、1枚引いた！", languageMode));
                nextActiveEffects.push({ id: `vfx-rev-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '覚醒のコーヒー': {
                const drawn = p.drawPile.pop();
                if (drawn) p.hand.push(drawn);
                p.currentHp = Math.max(0, p.currentHp - 1);
                currentLogs.push(trans("覚醒のコーヒー：1枚引いた（反動でHP-1）", languageMode));
                break;
            }
            case '世界遺産登録': {
                p.maxHp += 5;
                p.currentHp += 5;
                currentLogs.push(trans("世界遺産登録：最大HP+5", languageMode));
                nextActiveEffects.push({ id: `vfx-heritage-${Date.now()}`, type: 'HEAL', targetId: 'player' });
                break;
            }

            // --- 体育・行事・生活系 ---
            case '学芸会の主役': {
                p.powers['AFTER_IMAGE'] = (p.powers['AFTER_IMAGE'] || 0) + 1;
                currentLogs.push(trans("学芸会の主役：カードを使う度ブロック獲得！", languageMode));
                break;
            }
            case 'カンニング':
            case 'お人形遊び':
            case '二刀流':
            case '二本鉛筆':
            case 'フォークダンス':
            case '鏡 (星新一)':
            case 'きてんの窓': {
                // Copy resolution is handled by the shared hand-selection flow.
                break;
            }
            case 'スポーツ王': {
                p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 2;
                nextActiveEffects.push({ id: `vfx-champ-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '鉄棒の逆上がり': {
                if (p.discardPile.length > 0) {
                    const pick = p.discardPile[Math.floor(Math.random() * p.discardPile.length)];
                    p.discardPile = p.discardPile.filter(c => c.id !== pick.id);
                    p.hand.push(pick);
                    currentLogs.push(trans(`鉄棒の逆上がり：捨て札から「${pick.name}」を回収した！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-pe-bar-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }
            case '顕微鏡': {
                p.nextTurnDraw += 1;
                currentLogs.push(trans("顕微鏡：次ターン1ドロー", languageMode));
                break;
            }
            case 'キラキラの粉': {
                e_list.forEach(enemy => applyDebuff(enemy, 'WEAK', 1));
                currentLogs.push(trans("キラキラの粉：敵をへろへろ1にした", languageMode));
                break;
            }
            case '邪智暴虐': {
                const drawn = p.drawPile.pop();
                if (drawn) p.hand.push(drawn);
                currentLogs.push(trans("邪智暴虐：1ドロー", languageMode));
                break;
            }
            case '一寸法師': {
                p.block += 3;
                currentLogs.push(trans("一寸法師：連撃後にブロック3", languageMode));
                break;
            }
            case '縄跳び': {
                p.currentHp = Math.max(0, p.currentHp - 1);
                currentLogs.push(trans("縄跳び：反動でHP-1", languageMode));
                break;
            }
            case '飴玉の嵐': {
                e_list.forEach(enemy => applyDebuff(enemy, 'WEAK', 1));
                currentLogs.push(trans("飴玉の嵐：敵全体へろへろ1", languageMode));
                break;
            }
            case 'ブーメラン': {
                p.currentEnergy += 1;
                currentLogs.push(trans("ブーメラン：エナジー+1", languageMode));
                break;
            }
            case 'かいけつゾロリ': {
                p.block += 3;
                currentLogs.push(trans("かいけつゾロリ：ブロック3", languageMode));
                break;
            }
            case '側転': {
                p.block += 2;
                currentLogs.push(trans("側転：ブロック2", languageMode));
                break;
            }
            case '電脳世界へのダイブ': {
                const pool = p.hand.filter(c => c.id !== card.id);
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    pick.cost = 0;
                    currentLogs.push(trans(`電脳世界へのダイブ：「${pick.name}」を0コスト化`, languageMode));
                }
                break;
            }

            // --- カッコいいカード (BOYS) ---
            case '大ジャンプ':
            case 'VAULT':
            case '次元跳躍': {
                if (targetName === '次元跳躍') {
                    const badCards = p.hand.filter(c => c.type === CardType.STATUS || c.type === CardType.CURSE);
                    const count = badCards.length;
                    badCards.forEach(c => {
                        p.hand = p.hand.filter(hc => hc.id !== c.id);
                    });
                    p.strength += count;
                    currentLogs.push(trans(`次元跳躍：悪いカードを${count}枚消滅させ、ムキムキになった！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-warp-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    p.turnFlags['VAULT_EXTRA_TURN'] = true;
                    currentLogs.push(trans(`${card.name}：追加ターンを獲得！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-warp-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }
            case '影分身の術': {
                nextActiveEffects.push({ id: `vfx-clone-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '真の勇者覚醒': {
                p.powers['ENERGY_DRAW_POWER'] = (p.powers['ENERGY_DRAW_POWER'] || 0) + 1;
                p.strength += 2;
                currentLogs.push(trans("真の勇者覚醒：すべての力がみなぎる！", languageMode));
                nextActiveEffects.push({ id: `vfx-hero-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            // --- 可愛いカード (GIRLS) ---
            case 'おとぎ話の扉': {
                const specials = getAvailableSpecialCards();
                for (let i = 0; i < 3; i++) {
                    const pick = specials[Math.floor(Math.random() * specials.length)];
                    if (pick) addCardToHand(pick);
                }
                currentLogs.push(trans("おとぎ話の扉：特別なカードを3枚生成した", languageMode));
                nextActiveEffects.push({ id: `vfx-fairy-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '奇跡のリボン': {
                p.currentEnergy = p.maxEnergy;
                currentLogs.push(trans("奇跡のリボン：エナジーを全回復！", languageMode));
                nextActiveEffects.push({ id: `vfx-ribbon-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case 'お姫様の呼び声': {
                const skillPool = p.drawPile.filter(c => c.type === CardType.SKILL);
                if (skillPool.length > 0) {
                    const pick = skillPool[Math.floor(Math.random() * skillPool.length)];
                    p.drawPile = p.drawPile.filter(c => c.id !== pick.id);
                    p.hand.push(pick);
                    currentLogs.push(trans(`お姫様の呼び声：山札から「${pick.name}」を引き寄せた`, languageMode));
                    nextActiveEffects.push({ id: `vfx-call-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }

            // --- 校外ライフ ---
            case 'ガチャの神引き': {
                const legendariesInDeck = p.deck.filter(c => c.rarity === 'LEGENDARY');
                if (legendariesInDeck.length > 0) {
                    const pick = legendariesInDeck[Math.floor(Math.random() * legendariesInDeck.length)];
                    addCardToHand(pick);
                    currentLogs.push(trans(`ガチャ成功！デッキの「${pick.name}」をコピーした！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-gacha-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    currentLogs.push(trans(`デッキにレジェンダリーがなかったので、ガチャは外れた...`, languageMode));
                }
                break;
            }

            case '夢のおもちゃ屋': {
                const legendaries = Object.values(CARDS_LIBRARY).filter(c => c.rarity === 'LEGENDARY');
                const pick = legendaries[Math.floor(Math.random() * legendaries.length)];
                const newC = addCardToHand(pick);
                currentLogs.push(trans(`おもちゃ屋で「${newC.name}」を見つけた！`, languageMode));
                nextActiveEffects.push({ id: `vfx-toy-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case 'いつかの卒業式': {
                p.strength += 20;
                p.powers['DEXTERITY'] = (p.powers['DEXTERITY'] || 0) + 20;
                p.powers['ARTIFACT'] = (p.powers['ARTIFACT'] || 0) + 5;
                currentLogs.push(trans(`卒業の時が来た。すべてが思い出に変わる。`, languageMode));
                nextActiveEffects.push({ id: `vfx-grad-flash`, type: 'FLASH', targetId: 'player' });
                break;
            }

            case '究極の10連ガチャ': {
                const allCards = Object.values(CARDS_LIBRARY).filter(c => c.rarity !== 'SPECIAL');
                for (let i = 0; i < 10; i++) {
                    const pick = allCards[Math.floor(Math.random() * allCards.length)];
                    addCardToHand(pick, false);
                }
                currentLogs.push(trans(`究極の10連ガチャを実行！手札が溢れそうだ！`, languageMode));
                nextActiveEffects.push({ id: `vfx-gacha-super-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '秘密のラブレター': {
                e_list.forEach(enemy => {
                    if (enemy.enemyType !== 'GUARDIAN' && enemy.enemyType !== 'THE_HEART') {
                        enemy.currentHp = 0;
                        currentLogs.push(trans(`${enemy.name}は恥ずかしくて逃げ出した！`, languageMode));
                        nextActiveEffects.push({ id: `vfx-love-${enemy.id}`, type: 'EXPLOSION', targetId: enemy.id });
                    }
                });
                break;
            }

            case '真夏の肝試し': {
                e_list.forEach(enemy => {
                    enemy.strength -= 3;
                    currentLogs.push(trans(`${enemy.name}は恐怖で震えている（筋力-3）`, languageMode));
                    nextActiveEffects.push({ id: `vfx-ghost-${enemy.id}`, type: 'DEBUFF', targetId: enemy.id });
                });
                break;
            }

            case '田んぼのかかし': {
                e_list.forEach(enemy => {
                    enemy.nextIntent = { type: EnemyIntentType.SLEEP, value: 0 };
                    currentLogs.push(trans(`${enemy.name}はかかしに見惚れている...`, languageMode));
                    nextActiveEffects.push({ id: `vfx-scare-${enemy.id}`, type: 'DEBUFF', targetId: enemy.id });
                });
                break;
            }

            case '迷い犬の恩返し': {
                p.nextTurnEnergy += 3;
                currentLogs.push(trans(`恩返しで次のターン、エナジー+3！`, languageMode));
                nextActiveEffects.push({ id: `vfx-dog-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '秘密の近道': {
                if (p.drawPile.length > 0) {
                    const highCostCards = p.drawPile.filter(c => c.cost >= 2);
                    const pool = highCostCards.length > 0 ? highCostCards : p.drawPile;
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    p.drawPile = p.drawPile.filter(c => c.id !== pick.id);
                    p.hand.push({ ...pick, cost: 0 });
                    currentLogs.push(trans(`山札から「${pick.name}」を0コストで引き寄せた！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-shortcut-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }

            case '天体観測': {
                nextActiveEffects.push({ id: `vfx-stars-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '虫かごの秘密': {
                const captured = p.deck.filter(c => c.rarity === 'SPECIAL' && c.textureRef && !c.isSeed);
                if (captured.length > 0) {
                    const pick = captured[Math.floor(Math.random() * captured.length)];
                    addCardToHand(pick);
                    currentLogs.push(trans(`虫かごから「${pick.name}」が飛び出した！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-bug-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    currentLogs.push(trans(`虫かごは空っぽだった...`, languageMode));
                }
                break;
            }

            case '手作りの宝地図': {
                const allRelics = Object.values(RELIC_LIBRARY).filter(r =>
                    !p.relics.some(owned => owned.id === r.id) && r.rarity !== 'STARTER'
                );
                if (allRelics.length > 0) {
                    const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
                    p.relics.push(relic);
                    if (relic.id === 'OLD_COIN') p.gold += 300;
                    if (relic.id === 'WAFFLE') { p.maxHp += 7; p.currentHp = p.maxHp; }
                    if (['SOZU', 'CURSED_KEY', 'PHILOSOPHER_STONE', 'VELVET_CHOKER'].includes(relic.id)) p.maxEnergy += 1;
                    if (relic.id === 'PREPAID_CARD') { p.gold += 150; p.relicCounters['PREPAID_CARD_NO_SKIP'] = 1; }
                    if (relic.id === 'MATRYOSHKA') p.relicCounters['MATRYOSHKA'] = 2;
                    if (relic.id === 'HAPPY_FLOWER') p.relicCounters['HAPPY_FLOWER'] = 0;
                    currentLogs.push(trans(`地図の通りにお宝「${relic.name}」を発見！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-map-relic-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }

            case '夕焼けのチャイム': {
                e_list.forEach(enemy => {
                    if (enemy.enemyType !== 'GUARDIAN' && enemy.enemyType !== 'THE_HEART') {
                        enemy.currentHp = 0;
                        nextActiveEffects.push({ id: `vfx-chime-${enemy.id}`, type: 'EXPLOSION', targetId: enemy.id });
                    }
                });
                currentLogs.push(trans(`夕焼けのチャイムが鳴り響き、敵が帰宅した。`, languageMode));
                break;
            }

            case '図書室での昼寝': {
                p.currentHp = p.maxHp;
                p.powers = {};
                currentLogs.push(trans(`最高の昼寝だった。体力が全回復し、心も晴れやかになった！`, languageMode));
                nextActiveEffects.push({ id: `vfx-sleep-heal-${Date.now()}`, type: 'HEAL', targetId: 'player' });
                break;
            }

            case '親友との約束': {
                if (p.partner) {
                    p.partner.maxHp += 20;
                    p.partner.currentHp = p.partner.maxHp;
                    currentLogs.push(trans(`親友との絆が深まった！`, languageMode));
                    nextActiveEffects.push({ id: `vfx-friend-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                } else {
                    currentLogs.push(trans(`親友がいないので、サビしい気持ちになった...`, languageMode));
                }
                break;
            }

            case '出前ピザパーティー': {
                p.currentHp = p.maxHp;
                if (p.partner) {
                    p.partner.currentHp = p.partner.maxHp;
                    currentLogs.push(trans(`ピザの香りでパートナーも元気になった！`, languageMode));
                }
                nextActiveEffects.push({ id: `vfx-pizza-p-${Date.now()}`, type: 'HEAL', targetId: 'player' });
                break;
            }

            case '伝説のかくれんぼ': {
                p.powers['INTANGIBLE'] = (p.powers['INTANGIBLE'] || 0) + 2;
                currentLogs.push(trans(`完璧に気配を消した。2ターンの間、ダメージを1にする。`, languageMode));
                nextActiveEffects.push({ id: `vfx-hide-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case 'お年玉の誘惑': {
                if (p.hand.length > 0) {
                    const pool = p.hand.filter(h => h.id !== card.id);
                    if (pool.length > 0) {
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        pick.cost = 0;
                        currentLogs.push(trans(`お年玉で「${pick.name}」のコストが0になった！`, languageMode));
                        nextActiveEffects.push({ id: `vfx-otoshidama-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                    }
                }
                break;
            }

            case '路地裏の野良猫': {
                p.echoes = (p.echoes || 0) + 2;
                currentLogs.push(trans(`野良猫が味方してくれた！次の攻撃が3回発動する！`, languageMode));
                nextActiveEffects.push({ id: `vfx-cat-echo-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '初詣の願い事': {
                p.hand = p.hand.map(c => ({ ...c, cost: 0 }));
                currentLogs.push(trans(`願いが通じた！手札のコストがすべて0になった。`, languageMode));
                nextActiveEffects.push({ id: `vfx-pray-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '金魚すくい': {
                const pool = p.hand.filter(h => h.id !== card.id);
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    const upgraded = getUpgradedCard(pick);
                    Object.assign(pick, upgraded);
                    pick.cost = 0;
                    currentLogs.push(trans(`金魚すくい成功！「${pick.name}」を強化して0コストにした。`, languageMode));
                    nextActiveEffects.push({ id: `vfx-goldfish-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                }
                break;
            }

            case 'ローラーシューズ': {
                p.hand = p.hand.map(c => ({ ...c, cost: 0 }));
                currentLogs.push(trans(`ローラーシューズでスイスイ！全手札のコストが0になった！`, languageMode));
                nextActiveEffects.push({ id: `vfx-roller-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '虹を追いかけて': {
                const deckIndices = Array.from({ length: p.deck.length }, (_, i) => i);
                const shuffledIndices = deckIndices.sort(() => Math.random() - 0.5).slice(0, 5);
                p.deck = p.deck.map((c, i) => shuffledIndices.includes(i) ? getUpgradedCard(c) : c);

                const upgradedIds = p.deck.filter((_, i) => shuffledIndices.includes(i)).map(c => c.id);
                const syncUpgrade = (c: ICard) => upgradedIds.includes(c.id) ? getUpgradedCard(c) : c;

                p.hand = p.hand.map(syncUpgrade);
                p.drawPile = p.drawPile.map(syncUpgrade);
                p.discardPile = p.discardPile.map(syncUpgrade);

                currentLogs.push(trans(`虹の彼方に答えがあった。デッキの5枚を強化した！`, languageMode));
                nextActiveEffects.push({ id: `vfx-rainbow-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '二度寝の誘惑に勝てない...。':
            case '休日の二度寝': {
                p.currentHp = Math.min(p.maxHp, p.currentHp + 15);
                p.nextTurnEnergy += 2;
                p.nextTurnDraw += 2;
                currentLogs.push(trans(`休日の二度寝：HP回復と次のターンの準備を整えた！`, languageMode));
                nextActiveEffects.push({ id: `vfx-sleep-2-${Date.now()}`, type: 'HEAL', targetId: 'player' });
                break;
            }

            case '水たまりジャンプ': {
                p.powers['DASH_BOOST'] = (p.powers['DASH_BOOST'] || 0) + 1;
                currentLogs.push(trans(`水たまりジャンプ：軽快なステップ！プレイの度にエナジー回復状態になった。`, languageMode));
                nextActiveEffects.push({ id: `vfx-puddle-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case '工事現場の重機': {
                e_list.forEach(enemy => {
                    if (enemy.currentHp > 0) {
                        enemy.block = 0;
                        nextActiveEffects.push({ id: `vfx-crush-${enemy.id}`, type: 'BLOCK', targetId: enemy.id });
                    }
                });
                currentLogs.push(trans(`重機のパワー！敵全員のブロックを粉砕した！`, languageMode));
                break;
            }

            case '僕だけのヒーロー': {
                currentLogs.push(trans(`自分を信じる心が、ヒーローを呼び寄せた！`, languageMode));
                nextActiveEffects.push({ id: `vfx-hero-flash`, type: 'FLASH', targetId: 'player' });
                nextActiveEffects.push({ id: `vfx-hero-impact`, type: 'CRITICAL', targetId: 'player' });
                break;
            }

            case 'デコレーション・ケーキ': {
                p.powers['HEAL_ON_PLAY'] = (p.powers['HEAL_ON_PLAY'] || 0) + 1;
                currentLogs.push(trans("デコレーション・ケーキ：カードを使う度HP回復！", languageMode));
                break;
            }

            case '華麗な舞': {
                p.strength += 2;
                currentLogs.push(trans("華麗な舞：ムキムキ+2！", languageMode));
                nextActiveEffects.push({ id: `vfx-dance-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }

            case 'カラフル・レインボー': {
                e_list.forEach(enemy => {
                    if (enemy.currentHp > 0) {
                        enemy.block = 0;
                        nextActiveEffects.push({ id: `vfx-rainbow-atk-${enemy.id}`, type: 'LIGHTNING', targetId: enemy.id });
                    }
                });
                currentLogs.push(trans("カラフル・レインボー：敵全員のブロックを解除！", languageMode));
                break;
            }
        }
    });

    return { player: p, enemies: e_list };
};
