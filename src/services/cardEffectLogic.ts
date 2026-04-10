
import { Player, Enemy, Card as ICard, CardType, TargetType, VisualEffectInstance, EnemyIntentType, LanguageMode } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY } from '../constants';
import { trans } from '../utils/textUtils';
import { getUpgradedCard } from '../utils/cardUtils';

// ヘルパー関数: デバフの付与
const applyDebuff = (enemy: Enemy, type: 'WEAK' | 'VULNERABLE' | 'POISON', amount: number) => {
    if (enemy.artifact > 0 && type !== 'POISON') {
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
    nextActiveEffects: VisualEffectInstance[]
): { player: Player; enemies: Enemy[] } => {
    const p = { ...player };
    const e_list = [...enemies];

    const addCardToHand = (template: any, cost0 = true) => {
        let newC = { ...template, id: `gen-${Date.now()}-${Math.random()}` } as ICard;
        if (cost0) newC.cost = 0;
        if (p.powers['MASTER_REALITY']) {
            newC = getUpgradedCard(newC);
        }
        if (p.hand.length < 10) {
            p.hand.push(newC);
        } else {
            p.discardPile.push(newC);
        }
        return newC;
    };

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
                    if (p.drawPile.length === 0) {
                        if (p.discardPile.length === 0) break;
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const drawn = p.drawPile.pop();
                    if (drawn) p.hand.push(drawn);
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
                    if (p.drawPile.length === 0) {
                        if (p.discardPile.length === 0) break;
                        p.drawPile = shuffle(p.discardPile);
                        p.discardPile = [];
                    }
                    const drawn = p.drawPile.pop();
                    if (drawn) p.hand.push(drawn);
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
                if (p.drawPile.length === 0 && p.discardPile.length > 0) {
                    p.drawPile = shuffle(p.discardPile);
                    p.discardPile = [];
                }
                const drawn = p.drawPile.pop();
                if (drawn) p.hand.push(drawn);
                currentLogs.push(trans("産業革命：Eを今/次ターンに分割し、1枚引いた！", languageMode));
                nextActiveEffects.push({ id: `vfx-rev-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '覚醒のコーヒー': {
                if (p.drawPile.length === 0 && p.discardPile.length > 0) {
                    p.drawPile = shuffle(p.discardPile);
                    p.discardPile = [];
                }
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
            case 'カンニング': {
                const pool = p.hand.filter(c => c.id !== card.id && c.type === CardType.ATTACK);
                if (pool.length > 0) {
                    addCardToHand(pool[Math.floor(Math.random() * pool.length)], false);
                    currentLogs.push(trans("カンニング：攻撃カードをコピーした", languageMode));
                }
                break;
            }
            case 'お人形遊び': {
                const pool = p.hand.filter(c => c.id !== card.id && c.type === CardType.SKILL);
                if (pool.length > 0) {
                    addCardToHand(pool[Math.floor(Math.random() * pool.length)], false);
                    currentLogs.push(trans("お人形遊び：スキルカードをコピーした", languageMode));
                }
                break;
            }
            case '二刀流': {
                const pool = p.hand.filter(c => c.id !== card.id && (c.type === CardType.ATTACK || c.type === CardType.POWER));
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    addCardToHand(pick, false);
                    addCardToHand(pick, false);
                    currentLogs.push(trans("二刀流：カードを2枚コピーした", languageMode));
                }
                break;
            }
            case 'フォークダンス': {
                const pool = p.hand.filter(c => c.id !== card.id);
                if (pool.length > 0) {
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    addCardToHand(pick, false);
                    const tossPool = p.hand.filter(c => c.id !== pick.id && c.id !== card.id);
                    if (tossPool.length > 0) {
                        const toss = tossPool[Math.floor(Math.random() * tossPool.length)];
                        p.hand = p.hand.filter(c => c.id !== toss.id);
                        p.discardPile.push(toss);
                    }
                    currentLogs.push(trans("フォークダンス：コピーして1枚捨てた", languageMode));
                }
                break;
            }
            case '鏡 (星新一)': {
                const pool = p.hand.filter(c => c.id !== card.id);
                if (pool.length > 0) {
                    addCardToHand(pool[Math.floor(Math.random() * pool.length)], false);
                    p.powers['VULNERABLE'] = (p.powers['VULNERABLE'] || 0) + 1;
                    currentLogs.push(trans("鏡：コピーしたが、自分がびくびく1", languageMode));
                }
                break;
            }
            case 'きてんの窓': {
                const highCost = p.hand.filter(c => c.id !== card.id && c.cost >= 2);
                const pool = highCost.length > 0 ? highCost : p.hand.filter(c => c.id !== card.id);
                if (pool.length > 0) {
                    const copied = addCardToHand(pool[Math.floor(Math.random() * pool.length)], false);
                    copied.cost = 0;
                    currentLogs.push(trans("きてんの窓：高コスト優先コピーを0コスト化", languageMode));
                }
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
                if (p.drawPile.length === 0 && p.discardPile.length > 0) {
                    p.drawPile = shuffle(p.discardPile);
                    p.discardPile = [];
                }
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
                currentLogs.push(trans("ブーメラン：エネルギー+1", languageMode));
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
                if (card.name === '次元跳躍') {
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
                const attacks = p.hand.filter(c => c.type === CardType.ATTACK && c.id !== card.id);
                attacks.forEach(atk => {
                    const clone = { ...atk, id: `clone-${Date.now()}-${Math.random()}` };
                    if (p.hand.length < 10) p.hand.push(clone);
                });
                currentLogs.push(trans("影分身の術：手札の攻撃をすべて複製した！", languageMode));
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
                const specials = Object.values(CARDS_LIBRARY).filter(c => c.rarity === 'SPECIAL' && !c.isSeed);
                for (let i = 0; i < 3; i++) {
                    const pick = specials[Math.floor(Math.random() * specials.length)];
                    addCardToHand(pick);
                }
                currentLogs.push(trans("おとぎ話の扉：特別なカードを3枚生成した", languageMode));
                nextActiveEffects.push({ id: `vfx-fairy-${Date.now()}`, type: 'BUFF', targetId: 'player' });
                break;
            }
            case '奇跡のリボン': {
                p.currentEnergy = p.maxEnergy;
                currentLogs.push(trans("奇跡のリボン：エネルギーを全回復！", languageMode));
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
                currentLogs.push(trans(`恩返しで次のターン、エネルギー+3！`, languageMode));
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
