
import React from 'react';
import { Player, GameState, GameScreen, CardType, Card, TargetType } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, CURSE_CARDS, EVENT_CARDS, STATUS_CARDS } from '../constants';
import { trans } from '../utils/textUtils';
import { LanguageMode } from '../types';
import { getUpgradedCard } from '../utils/cardUtils';
import { ADDITIONAL_CARDS } from '../constants1';

interface EventOption {
    label: string;
    text: string;
    action: () => void;
}

interface GameEvent {
    title: string;
    description: string;
    options: EventOption[];
}

// Helper to check if a card is available based on unlock status
const isCardAvailable = (card: Card, unlockedNames: string[]) => {
    const additionalCardNames = Object.values(ADDITIONAL_CARDS).map(ac => ac.name);
    if (additionalCardNames.includes(card.name)) {
        return unlockedNames.includes(card.name);
    }
    return true; 
};

// Helper to identify character based on starting relic
const getCharacterType = (player: Player): string | null => {
    const relics = player.relics.map(r => r.id);
    if (relics.includes('BURNING_BLOOD')) return 'WARRIOR';
    if (relics.includes('WHISTLE')) return 'CARETAKER';
    if (relics.includes('SNAKE_RING')) return 'ASSASSIN';
    if (relics.includes('HOLY_WATER')) return 'MAGE';
    if (relics.includes('HACHIMAKI')) return 'DODGEBALL';
    if (relics.includes('MEGAPHONE')) return 'BARD';
    if (relics.includes('BOOKMARK')) return 'LIBRARIAN';
    if (relics.includes('BIG_LADLE')) return 'CHEF';
    if (relics.includes('SEED_PACK')) return 'GARDENER';
    return null;
};

/**
 * 前回のプレイから引き継いだカードを取得するための特別なイベント
 */
export const generateLegacyEvent = (
    card: Card,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    setEventResultLog: (log: string | null) => void,
    languageMode: LanguageMode
): GameEvent => ({
    title: "忘れ物",
    description: `校庭の隅に、誰かが落としたと思われるカード「${trans(card.name, languageMode)}」が落ちている。\nこれは以前ここを冒険した生徒の持ち物かもしれない...。`,
    options: [
        {
            label: "ひろう",
            text: "カードをデッキに加える",
            action: () => {
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, deck: [...prev.player.deck, { ...card, id: `legacy-${Date.now()}` }] }
                }));
                setEventResultLog(trans(`「${card.name}」を拾い、大切にランドセルにしまった。`, languageMode));
            }
        },
        {
            label: "そのままにする",
            text: "ひろわずに進む",
            action: () => {
                setEventResultLog(trans("自分には必要ないと判断し、そのまま通り過ぎた。またいつか誰かが拾うだろう。", languageMode));
            }
        }
    ]
});

export const generateEvent = (
    player: Player,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    handleNodeComplete: () => void,
    setEventResultLog: (log: string | null) => void,
    languageMode: LanguageMode,
    unlockedCardNames: string[]
): GameEvent => {
    
    const charType = getCharacterType(player);
    let potentialEvents: GameEvent[] = [];

    // --- COMMON EVENTS ---
    potentialEvents.push(
        {
            title: "怪しい薬売り",
            description: "路地裏で男が声をかけてきた。「とびきりの薬、あるよ」",
            options: [
                { label: "買う", text: "20G支払って試す", action: () => {
                    if (player.gold >= 20) {
                        const pots = Object.values(POTION_LIBRARY);
                        const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                        setGameState(prev => {
                            const newP = { ...prev.player };
                            newP.gold -= 20;
                            newP.potions = [...newP.potions, pot].slice(0, 3);
                            return { ...prev, player: newP };
                        });
                        setEventResultLog(trans(`怪しい薬(ポーション: ${pot.name})を手に入れた！\n残金: ${player.gold - 20}G`, languageMode));
                    } else {
                        setEventResultLog(trans("お金が足りなかった... 男は舌打ちをして去っていった。", languageMode));
                    }
                }},
                { label: "無視", text: "何もせず立ち去る", action: () => { setEventResultLog(trans("怪しい男を無視して先へ進んだ。", languageMode)); } }
            ]
        },
        {
            title: "踊り場の鏡",
            description: "大きな鏡がある。映っている自分と目が合った。",
            options: [
                { label: "見つめる", text: "じっと見つめる...", action: () => {
                    const target = player.deck[Math.floor(Math.random() * player.deck.length)];
                    if (target) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...target, id: `copy-${Date.now()}` }] } }));
                        setEventResultLog(trans(`鏡の中の自分が何かを手渡してきた。\n「${target.name}」の複製を入手。`, languageMode));
                    } else {
                        setEventResultLog(trans("何も起こらなかった。", languageMode));
                    }
                }},
                { label: "割る", text: "鏡を叩き割る！", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: { ...prev.player, deck: [...prev.player.deck, { ...CURSE_CARDS.INJURY, id: `curse-${Date.now()}` }] }
                    }));
                    setEventResultLog(trans("破片が飛び散った！\n呪い「骨折」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "呪われた書物",
            description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。",
            options: [
                { label: "読む", text: "勇気を出して読む", action: () => {
                    const books = [RELIC_LIBRARY.NECRONOMICON, RELIC_LIBRARY.ENCHIRIDION, RELIC_LIBRARY.NILRYS_CODEX];
                    const book = books[Math.floor(Math.random() * books.length)];
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 10),
                            relics: [...prev.player.relics, book]
                        }
                    }));
                    setEventResultLog(trans(`ページをめくると激痛が走った！(HP-10)\nレリック「${book.name}」を入手。`, languageMode));
                }},
                { label: "立ち去る", text: "危険を避ける", action: () => setEventResultLog(trans("危険を避けて立ち去った。", languageMode)) }
            ]
        },
        {
            title: "伝説の給食",
            description: "今日は揚げパンの日だ！しかし、最後に一つだけ余っている。\nクラスメートとジャンケンで勝負だ。",
            options: [
                { label: "グー", text: "力強く出す！", action: () => {
                    if (Math.random() < 0.5) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } }));
                        setEventResultLog(trans("勝った！揚げパンをゲット！\n最大HPが5上がった。", languageMode));
                    } else {
                        setEventResultLog(trans("負けた... \n悲しみに包まれた。", languageMode));
                    }
                }},
                { label: "パー", text: "大きく広げる！", action: () => {
                    if (Math.random() < 0.5) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("勝った！譲ってあげたらお礼に50Gもらった。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("負けた上、指を突き指した。(HP-5)", languageMode));
                    }
                }},
                { label: "チョキ", text: "鋭く出す！", action: () => {
                    const potion = POTION_LIBRARY['STRENGTH_POTION'];
                    if (Math.random() < 0.5) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...potion, id: `pot-${Date.now()}` }].slice(0, 3) } }));
                        setEventResultLog(trans("勝った！揚げパンの代わりにプロテインをもらった。", languageMode));
                    } else {
                        setEventResultLog(trans("負けた... みんな美味しそうに食べている。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "校庭の野良犬",
            description: "授業中、校庭に野良犬が迷い込んできた！\n首輪はなく、お腹を空かせているようだ。",
            options: [
                { label: "なでる", text: "優しく近づく", action: () => {
                    if (Math.random() < 0.7) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                        setEventResultLog(trans("犬は嬉しそうに尻尾を振って去っていった。\n心が癒やされた。(HP全回復)", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                        setEventResultLog(trans("ガブッ！噛まれた！(HP-10)\n犬は走り去った。", languageMode));
                    }
                }},
                { label: "餌をやる", text: "何かあげる", action: () => {
                    if (player.gold >= 30) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                gold: prev.player.gold - 30,
                                relics: [...prev.player.relics, RELIC_LIBRARY.SPIRIT_POOP]
                            }
                        }));
                        setEventResultLog(trans("パンを買ってあげた(30G消費)。\nお礼に「犬のフン(レリック)」を置いていった...いらない。", languageMode));
                    } else {
                        setEventResultLog(trans("あげるものがなかった。\n犬は悲しそうな目で去っていった。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "謎の転校生",
            description: "「ねえ、君のそのカード、僕のと交換しない？」\n見たことのないカードを持っている。",
            options: [
                { label: "交換", text: "ランダムに交換する", action: () => {
                    const removeIdx = Math.floor(Math.random() * player.deck.length);
                    const removed = player.deck[removeIdx];
                    const keys = Object.keys(CARDS_LIBRARY).filter(k => {
                        const c = CARDS_LIBRARY[k];
                        return (c.rarity === 'UNCOMMON' || c.rarity === 'RARE') && isCardAvailable(c as Card, unlockedCardNames);
                    });
                    const newCardTemplate = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                    
                    setGameState(prev => {
                        const newDeck = [...prev.player.deck];
                        let newMaxHp = prev.player.maxHp;
                        if (removed.name === '寄生虫' || removed.name === 'PARASITE') {
                            newMaxHp -= 3;
                        }
                        newDeck.splice(removeIdx, 1, { ...newCardTemplate, id: `trade-${Date.now()}` } as Card);
                        return {
                            ...prev,
                            player: {
                                ...prev.player,
                                deck: newDeck,
                                maxHp: newMaxHp,
                                currentHp: Math.min(prev.player.currentHp, newMaxHp)
                            }
                        };
                    });
                    setEventResultLog(trans(`「${removed.name}」を渡して、「${newCardTemplate.name}」をもらった！\n転校生はニヤリと笑った。`, languageMode));
                }},
                { label: "断る", text: "自分のカードが大事", action: () => setEventResultLog(trans("断った。転校生はつまらなそうに去った。", languageMode)) }
            ]
        },
        {
            title: "席替え",
            description: "今日は席替えの日だ。窓際の一番後ろになれるか...？\nそれとも最前列か。",
            options: [
                { label: "くじを引く", text: "手札(デッキ)が変わる予感...", action: () => {
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        for(let i=0; i<3; i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            const keys = Object.keys(CARDS_LIBRARY).filter(k => {
                                const c = CARDS_LIBRARY[k];
                                return !STATUS_CARDS[k] && !CURSE_CARDS[k] && isCardAvailable(c as Card, unlockedCardNames);
                            });
                            const newCard = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                            deck[idx] = { ...newCard, id: `seat-${Date.now()}-${i}` } as Card;
                        }
                        return { ...prev, player: { ...prev.player, deck } };
                    });
                    setEventResultLog(trans("席替えの結果、付き合う友達(デッキ)が変わった！\nカードが3枚変化した。", languageMode));
                }},
                { label: "祈る", text: "今の席を維持したい...", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 5) } }));
                    setEventResultLog(trans("なんとか今の席をキープできた。\n安心してHPが5回復した。", languageMode));
                }}
            ]
        },
        {
            title: "避難訓練",
            description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。",
            options: [
                { label: "走る", text: "カードを1枚削除(逃げる)", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { 
                            ...prev, 
                            player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } 
                        };
                    });
                    setTimeout(() => {
                        if (removedName) setEventResultLog(trans(`一目散に逃げ出した！\n不要な「${removedName}」を置いてきた。`, languageMode));
                        else setEventResultLog(trans("逃げ出したものの、何も失わなかった。", languageMode));
                    }, 50);
                }},
                { label: "隠れる", text: "HP回復", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 15) } }));
                    setEventResultLog(trans("机の下に隠れてやり過ごした。\nHPが15回復した。", languageMode));
                }}
            ]
        },
        {
            title: "プール開き",
            description: "待ちに待ったプール開きだ！\nしかし水は冷たそうだ。",
            options: [
                { label: "泳ぐ", text: "全回復するが、風邪を引くかも", action: () => {
                    const getCurse = Math.random() < 0.4;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = nextP.maxHp;
                        if (getCurse) nextP.deck = [...nextP.deck, { ...CURSE_CARDS.DECAY, id: `decay-${Date.now()}` }];
                        return { ...prev, player: nextP };
                    });
                    if (getCurse) {
                        setEventResultLog(trans("最高に気持ちいい！HP全回復！\n...しかし風邪を引いてしまった。呪い「虫歯(腐敗)」を入手。", languageMode));
                    } else {
                        setEventResultLog(trans("最高に気持ちいい！HP全回復！\n体も丈夫になった気がする。", languageMode));
                    }
                }},
                { label: "見学", text: "カードを1枚強化", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const upgradeable = deck.filter(c => !c.upgraded);
                        if (upgradeable.length > 0) {
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            upgradedName = c.name;
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        }
                        return prev;
                    });
                    setTimeout(() => {
                        if (upgradedName) setEventResultLog(trans(`プールサイドでイメトレをした。\n「${upgradedName}」が強化された！`, languageMode));
                        else setEventResultLog(trans("見学していたが、特に何も起きなかった。", languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "修学旅行の積立金",
            description: "集金袋を拾った。中にはお金が入っている。",
            options: [
                { label: "ネコババ", text: "150G入手。呪い「後悔」を得る。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: { 
                            ...prev.player, 
                            gold: prev.player.gold + 150,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("150Gを手に入れた！\nしかし良心が痛む...呪い「後悔」を入手。", languageMode));
                }},
                { label: "届ける", text: "職員室に届ける", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MEMBERSHIP_CARD] }
                    }));
                    setEventResultLog(trans("正直者は報われる。\n先生から「図書カード」をもらった！", languageMode));
                }}
            ]
        },
        {
            title: "魔の掃除時間",
            description: "廊下のワックスがけの時間だ。\nツルツル滑る床は危険だが、滑れば速く移動できるかも？",
            options: [
                { label: "滑る", text: "カード強化。HP-5。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.max(1, nextP.currentHp - 5);
                        const upgradeable = nextP.deck.filter(c => !c.upgraded);
                        if (upgradeable.length > 0) {
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            nextP.deck = nextP.deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            upgradedName = c.name;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        if (upgradedName) setEventResultLog(trans(`スライディング！(HP-5)\n「${upgradedName}」の扱いが上手くなった！`, languageMode));
                        else setEventResultLog(trans("派手に転んだ！痛い！(HP-5)", languageMode));
                    }, 50);
                }},
                { label: "磨く", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { ...prev, player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } };
                    });
                    setTimeout(() => {
                        if (removedName) setEventResultLog(trans(`心を込めて磨いたら、心が洗われた。\n「${removedName}」が取り除かれた。`, languageMode));
                        else setEventResultLog(trans("磨き上げたが、何も変わらなかった。", languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "運命のテスト返却",
            description: "今日は算数のテストが返却される日だ。\n自信はあるか？",
            options: [
                { label: "自信あり", text: "確率で100GかHP-10。", action: () => {
                    const win = Math.random() < 0.5;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) nextP.gold += 100;
                        else nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans("100点満点だ！\nお祝いに100Gをもらった！", languageMode));
                    else setEventResultLog(trans("名前を書き忘れていた！0点だ！\n精神的ダメージを受けた。(HP-10)", languageMode));
                }},
                { label: "隠す", text: "呪い「恥」を得る。HP20回復。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: { 
                            ...prev.player, 
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20),
                            deck: [...prev.player.deck, { ...CURSE_CARDS.SHAME, id: `shame-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("親に見つからないように隠した。\n安心したが、良心が痛む...呪い「恥」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "放送室のジャック",
            description: "放送室に誰もいない。マイクの電源が入っている。\nイタズラするチャンス？",
            options: [
                { label: "歌う", text: "最大HP+4。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            maxHp: prev.player.maxHp + 4,
                            currentHp: prev.player.currentHp + 4 
                        } 
                    }));
                    setEventResultLog(trans("生徒たちに大ウケだ！人気者になった。\n最大HP+4。", languageMode));
                }},
                { label: "告白", text: "呪い「後悔」を得る。HP回復。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10),
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-bc-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("好きな人の名前を叫ぶ...！\n校長先生の名前を叫んでしまった。呪い「後悔」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "理科室の人体模型",
            description: "夜の理科室。人体模型が動いている気がする。\n「心臓ヲ...クレ...」と聞こえた。",
            options: [
                { label: "あげる", text: "HP-10。レリック「保健室の飴」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 10),
                            relics: [...prev.player.relics, RELIC_LIBRARY.BLOOD_VIAL]
                        }
                    }));
                    setEventResultLog(trans("自分の血を分け与えた(HP-10)\nお礼に「保健室の飴(レリック)」を貰った。", languageMode));
                }},
                { label: "逃げる", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { ...prev, player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } };
                    });
                    setTimeout(() => {
                        if (removedName) setEventResultLog(trans(`なんとか逃げ切った。怖かった...\n恐怖で「${removedName}」を忘れてしまった。`, languageMode));
                        else setEventResultLog(trans("必死に逃げた！足が速くなった気がする。", languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "図書室の静寂",
            description: "放課後の図書室はとても静かだ。\n心地よい眠気が襲ってくる...",
            options: [
                { label: "寝る", text: "HP20回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                    setEventResultLog(trans("ぐっすり眠れた。HPが20回復した。\nよだれで本が少し濡れた。", languageMode));
                }},
                { label: "勉強", text: "「先読み」カード入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CARDS_LIBRARY.SCRY, id: `scry-${Date.now()}` } as Card] } }));
                    setEventResultLog(trans("集中して勉強した。\n「先読み」のカードを習得した。", languageMode));
                }}
            ]
        },
        {
            title: "終わらない朝礼",
            description: "校長先生の話が長い...もう30分も続いている。\n貧血で倒れそうだ。",
            options: [
                { label: "耐える", text: "最大HP+5, HP-5。", action: () => {
                    setGameState(prev => {
                        const nextMaxHp = prev.player.maxHp + 5;
                        return { 
                            ...prev, 
                            player: { 
                                ...prev.player, 
                                maxHp: nextMaxHp, 
                                currentHp: Math.min(nextMaxHp, Math.max(1, prev.player.currentHp - 5)) 
                            } 
                        };
                    });
                    setEventResultLog(trans("なんとか耐え抜いた！精神力が鍛えられた。\n最大HP+5, HP-5。", languageMode));
                }},
                { label: "座る", text: "HP全回復。呪い「ドジ」入手。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            currentHp: prev.player.maxHp,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.CLUMSINESS, id: `clumsy-${Date.now()}` }]
                        } 
                    }));
                    setEventResultLog(trans("こっそり座って休んだ。HP全回復。\n先生に見つかって怒られた。呪い「ドジ」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "置き勉の誘惑",
            description: "カバンが重すぎる。教科書を学校に置いて帰ろうか...",
            options: [
                { label: "置く", text: "ランダムなカード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { ...prev, player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } };
                    });
                    setTimeout(() => {
                        if (removedName) setEventResultLog(trans(`教科書(カード: ${removedName})を机の中に隠した。\n体が軽くなった！`, languageMode));
                        else setEventResultLog(trans("カバンの中は空っぽだった。", languageMode));
                    }, 50);
                }},
                { label: "持つ", text: "「頭突き」カード入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CARDS_LIBRARY.HEADBUTT, id: `headbutt-${Date.now()}` } as Card] } }));
                    setEventResultLog(trans("重いカバンで足腰が鍛えられた。\n「頭突き」を習得した。", languageMode));
                }}
            ]
        },
        {
            title: "伝説の木の下",
            description: "この木の下で告白すると結合されるという伝説がある。\n誰かが待っているようだ。",
            options: [
                { label: "行く", text: "ランダム(レリック/カード/呪い)。", action: () => {
                    const r = Math.random();
                    if (r < 0.3) {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.HAPPY_FLOWER] } }));
                         setEventResultLog(trans("なんと！告白の代わりに「アサガオ(おたから)」をもらえた！", languageMode));
                    } else if (r < 0.6) {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CURSE_CARDS.WRITHE, id: `writhe-${Date.now()}` }] } }));
                         setEventResultLog(trans("誰もいなかった... イタズラだったようだ。\n胸が痛む。呪い「悩み」を入手。", languageMode));
                    } else {
                         setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                         setEventResultLog(trans("ラッキー！誰かのへそくり100Gを見つけた！", languageMode));
                    }
                }},
                { label: "興味ない", text: "何もなし。", action: () => setEventResultLog(trans("恋愛より冒険だ。\n通り過ぎた。", languageMode)) }
            ]
        },
        {
            title: "体育倉庫のマット",
            description: "体育倉庫のマットの間に何かが挟まっている。\n腐った匂いもするが...",
            options: [
                { label: "探る", text: "ランダムカード入手。", action: () => {
                    const bad = Math.random() < 0.5;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (bad) {
                            nextP.deck = [...nextP.deck, { ...STATUS_CARDS.SLIMED, id: `slime-mat-${Date.now()}` }];
                        } else {
                            const keys = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'RARE');
                            const card = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                            nextP.deck = [...nextP.deck, { ...card, id: `rare-mat-${Date.now()}` } as Card];
                        }
                        return { ...prev, player: nextP };
                    });
                    if (bad) setEventResultLog(trans("うわっ！腐ったバナナを掴んでしまった。\n「鼻水(粘液)」カードがデッキに入った。", languageMode));
                    else setEventResultLog(trans(`なんと！隠されていた強力なカードを見つけた！`, languageMode));
                }},
                { label: "放置", text: "何もなし。", action: () => setEventResultLog(trans("賢明な判断だ。", languageMode)) }
            ]
        },
        {
            title: "秘密基地のパスワード",
            description: "草むらに隠された合言葉。正解すればお宝が手に入るかもしれない。",
            options: [
                { label: "適当に言う", text: "運任せ", action: () => {
                    const win = Math.random() < 0.2;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) nextP.gold += 200;
                        else nextP.currentHp = Math.max(1, nextP.currentHp - 5);
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans("「開けゴマ！」...なんと扉が開いた！200G入手。", languageMode));
                    else setEventResultLog(trans("「バナナ！」...警報が鳴り響いた！(HP-5)", languageMode));
                }},
                { label: "逃げる", text: "関わらない", action: () => setEventResultLog(trans("怪しい扉には近づかないことにした。", languageMode)) }
            ]
        },
        {
            title: "職員室の呼び出し",
            description: "校内放送で名前を呼ばれた。心当たりはあるか？",
            options: [
                { label: "行く", text: "HP全回復。カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = nextP.maxHp;
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`褒められた！HP全回復。自信がついて「${removedName || '迷い'}」を捨て去った。`, languageMode));
                    }, 50);
                }},
                { label: "バックれる", text: "呪い「不安」入手. 50G入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            gold: prev.player.gold + 50,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.DOUBT, id: `doubt-sr-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("逃げ出した拍子に50G拾った。しかし先生の視線が怖い...呪い「不安」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "落とし物のリコーダー",
            description: "道端に誰かのリコーダーが落ちている。名前は書いていない。",
            options: [
                { label: "吹く", text: "カード「歌う」か「めまい」入手。", action: () => {
                    const sing = Math.random() < 0.5;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (sing) nextP.deck = [...nextP.deck, { ...CARDS_LIBRARY.THUNDERCLAP, id: `sing-${Date.now()}` } as Card];
                        else nextP.deck = [...nextP.deck, { ...STATUS_CARDS.DAZED, id: `dazed-rec-${Date.now()}` }];
                        return { ...prev, player: nextP };
                    });
                    if (sing) setEventResultLog(trans("素晴らしい音色だ！新しい表現を覚えた。", languageMode));
                    else setEventResultLog(trans("ひどい音だ...頭がくらくらする。状態異常「めまい」入手。", languageMode));
                }},
                { label: "洗う", text: "HP10回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                    setEventResultLog(trans("きれいに洗って届けた。良いことをしてHP10回復。", languageMode));
                }}
            ]
        },
        {
            title: "図工室の粘土",
            description: "乾燥してカチカチの粘土がある。水をかければ使えるかもしれない。",
            options: [
                { label: "こねる", text: "カード「防御」強化。", action: () => {
                    let success = false;
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const targetIdx = deck.findIndex(c => c.name.includes("防御") && !c.upgraded);
                        if (targetIdx !== -1) {
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            success = true;
                            return { ...prev, player: { ...prev.player, deck } };
                        }
                        return prev;
                    });
                    if (success) setEventResultLog(trans(`鉄壁の造形が完成した！「防御」が強化された。`, languageMode));
                    else setEventResultLog(trans("粘土細工を楽しんだが、何も起きなかった。", languageMode));
                }},
                { label: "壊す", text: "ストレス解消。最大HP+2。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                    setEventResultLog(trans("力いっぱい叩き潰した！スッキリして最大HP+2。", languageMode));
                }}
            ]
        },
        {
            title: "家庭科室のつまみ食い",
            description: "調理実習の余りのクッキーがある。誰の物かわからない。",
            options: [
                { label: "食べる", text: "HP15回復か呪い「腹痛」。", action: () => {
                    const safety = Math.random() < 0.7;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (safety) nextP.currentHp = Math.min(nextP.maxHp, nextP.currentHp + 15);
                        else nextP.deck = [...nextP.deck, { ...CURSE_CARDS.PAIN, id: `pain-eat-${Date.now()}` }];
                        return { ...prev, player: nextP };
                    });
                    if (safety) setEventResultLog(trans("サクサクで美味しい！HP15回復。", languageMode));
                    else setEventResultLog(trans("賞味期限切れだった...。呪い「腹痛」入手。", languageMode));
                }},
                { label: "我慢する", text: "意志の力。カードを1枚強化。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const upgradeable = deck.filter(c => !c.upgraded);
                        if (upgradeable.length > 0) {
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            upgradedName = c.name;
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        }
                        return prev;
                    });
                    setTimeout(() => {
                        if (upgradedName) setEventResultLog(trans(`誘惑に打ち勝った！精神が鍛えられ「${upgradedName}」が強化された。`, languageMode));
                        else setEventResultLog(trans("誘惑に打ち勝った！特に何も起きなかった。", languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "体育祭の練習",
            description: "大縄跳びの練習をしている。一緒に混ざる？",
            options: [
                { label: "混ざる", text: "HP-5。ゴールド入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 5),
                            gold: prev.player.gold + 40
                        }
                    }));
                    setEventResultLog(trans("みんなで跳んだ！楽しかったが疲れた。(HP-5, 40G入手)", languageMode));
                }},
                { label: "回す", text: "カード「大掃除(旋回)」強化。", action: () => {
                    let success = false;
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const targetIdx = deck.findIndex(c => (c.name === 'グルグルバット' || c.name === 'WHIRLWIND') && !c.upgraded);
                        if (targetIdx !== -1) {
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            success = true;
                            return { ...prev, player: { ...prev.player, deck } };
                        }
                        return prev;
                    });
                    if (success) setEventResultLog(trans(`回す技術が向上した！「グルグルバット」が強化された。`, languageMode));
                    else setEventResultLog(trans("縄を回し続けたが、誰も来なかった。", languageMode));
                }}
            ]
        },
        {
            title: "校章の輝き",
            description: "地面に落ちているピカピカの校章。学校への愛着を試されている。",
            options: [
                { label: "磨く", text: "レリック「純金の校章(金剛杵)」入手. 呪い「悩み」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.VAJRA],
                            deck: [...prev.player.deck, { ...CURSE_CARDS.WRITHE, id: `writhe-crest-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("まばゆい輝きだ！レリック「金剛杵」を入手。しかし独り占めして心が痛む...呪い「悩み」入手。", languageMode));
                }},
                { label: "踏む", text: "呪い「恥」入手。全カード強化。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            deck: prev.player.deck.map(c => getUpgradedCard(c)).concat({ ...CURSE_CARDS.SHAME, id: `shame-crest-${Date.now()}` }) 
                        } 
                    }));
                    setEventResultLog(trans("背徳の快感！全カードが強化された。しかし名声は地に落ちた...呪い「恥」入手。", languageMode));
                }}
            ]
        },
        {
            title: "文化祭のポスター",
            description: "真っ白な掲示板。何か描いていく？",
            options: [
                { label: "落書き", text: "カード1枚変化。", action: () => {
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k]);
                        deck[idx] = { ...CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]], id: `scribble-${Date.now()}` } as Card;
                        return { ...prev, player: { ...prev.player, deck } };
                    });
                    setEventResultLog(trans("適当に描いたら、カードが1枚変化した！", languageMode));
                }},
                { label: "掃除", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { ...prev, player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`掲示板を綺麗にした。「${removedName || '無駄'}」を消し去った。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "不気味な音楽室",
            description: "誰もいないのにピアノの音が聞こえる。ベートーヴェンの肖像画がこっちを見ている気がする。",
            options: [
                { label: "一緒に弾く", text: "カード「反響(エコーフォーム)」入手。HP-15。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 15),
                            deck: [...prev.player.deck, { ...CARDS_LIBRARY.ECHO_FORM, id: `echo-mus-${Date.now()}` } as Card]
                        }
                    }));
                    setEventResultLog(trans("死の舞踏！(HP-15)「予習復習(反響)」を習得した。", languageMode));
                }},
                { label: "逃げ出す", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const removed = deck.splice(idx, 1)[0];
                        removedName = removed.name;
                        let nextMaxHp = prev.player.maxHp;
                        if (removedName === '寄生虫' || removedName === 'PARASITE') nextMaxHp -= 3;
                        return { ...prev, player: { ...prev.player, deck, maxHp: nextMaxHp, currentHp: Math.min(prev.player.currentHp, nextMaxHp) } };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`脱兎のごとく逃げた！恐怖で「${removedName || '記憶'}」が飛んだ。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "屋上の柵",
            description: "屋上のフェンスが一部壊れている。外の景色がよく見える。",
            options: [
                { label: "叫ぶ", text: "HP全回復。最大HP-5。", action: () => {
                    setGameState(prev => {
                        const nextMaxHp = prev.player.maxHp - 5;
                        return { 
                            ...prev, 
                            player: { 
                                ...prev.player, 
                                maxHp: nextMaxHp,
                                currentHp: nextMaxHp 
                            } 
                        };
                    });
                    setEventResultLog(trans("「しゅくだいなんて だいきらいだー！」...スッキリした。HP ぜんかいふく。さいだいHP-5。", languageMode));
                }},
                { label: "黄昏れる", text: "レリック「砂時計」入手。呪い「後悔」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.MERCURY_HOURGLASS],
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-roof-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("じかんを わすれていた... おたから「すなどけい」を ゲット. でも じかんを ムダにした...のろい「こうかい」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "給食の残飯処理",
            description: "バケツ一杯の残飯。誰かが片付けなければならない。",
            options: [
                { label: "食べる", text: "HP20回復。呪い「寄生虫」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20),
                            deck: [...prev.player.deck, { ...CURSE_CARDS.PARASITE, id: `parasite-eat-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("もったいない おばけ！HPを 20 かいふく. でも なにかが おなかに...。のろい「きせいちゅう」を ゲット。", languageMode));
                }},
                { label: "埋める", text: "カード「再起動」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            deck: [...prev.player.deck, { ...CARDS_LIBRARY.REBOOT, id: `reboot-bury-${Date.now()}` } as Card]
                        }
                    }));
                    setEventResultLog(trans("つちに かえした。あたらしい いのちの じゅんかん「さいきどう」を おぼえた。", languageMode));
                }}
            ]
        },
        {
            title: "昇降口の下履き",
            description: "誰かの靴が散乱している。揃えてあげる？",
            options: [
                { label: "揃える", text: "レリック「上履き(角笛)」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.HORN_CLEAT]
                        }
                    }));
                    setEventResultLog(trans("よいことを した！ かみさまから「うわばき」を もらった。", languageMode));
                }},
                { label: "隠す", text: "100G入手。呪い「恥」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            gold: prev.player.gold + 100,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.SHAME, id: `shame-shoe-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("くつの なかに 100えん あった！ こっそり もらった。のろい「はじ」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "二宮金次郎の背負い物",
            description: "夜になると動き出すという石像。背負っている薪（まき）が重そうだ。",
            options: [
                { label: "手伝う", text: "最大HP+10。HP-10。", action: () => {
                    setGameState(prev => {
                        const nextMaxHp = prev.player.maxHp + 10;
                        return {
                            ...prev,
                            player: {
                                ...prev.player,
                                maxHp: nextMaxHp,
                                currentHp: Math.max(1, Math.min(nextMaxHp, prev.player.currentHp))
                            }
                        }
                    });
                    setEventResultLog(trans("かわりに もってあげた！(HPが 10 ヘル) ちからが ついて さいだいHP+10。", languageMode));
                }},
                { label: "本を盗む", text: "レリック「分厚い辞書」入手。呪い「骨折」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.ENCHIRIDION],
                            deck: [...prev.player.deck, { ...CURSE_CARDS.INJURY, id: `injury-book-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("ほんを うばった！ おたから「ぶあついじしょ」を ゲット. でも なぐられた！のろい「こっせつ」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "保健室の視力検査",
            description: "「C」の向きを答えてください。全問正解でお宝です。",
            options: [
                { label: "右！", text: "確率でお宝。", action: () => {
                    const win = Math.random() < 0.5;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) nextP.relics = [...nextP.relics, RELIC_LIBRARY.SNECKO_EYE];
                        else nextP.deck = [...nextP.deck, { ...STATUS_CARDS.VOID, id: `void-eye-${Date.now()}` }];
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans("せいかい！ おたから「ぐるぐるメガネ」を ゲット. せかいが ちがって みえる。", languageMode));
                    else setEventResultLog(trans("はずれ。まっくらに なった. のろい「きょむ」を ゲット。", languageMode));
                }},
                { label: "逃げる", text: "検査拒否。", action: () => setEventResultLog(trans("めは だいじに しよう。", languageMode)) }
            ]
        },
        {
            title: "図書室の貸出カード",
            description: "自分の名前が書かれた古い貸出カードを見つけた。昔の自分からのメッセージだ。",
            options: [
                { label: "読む", text: "カード1枚強化。HP5回復。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.min(nextP.maxHp, nextP.currentHp + 5);
                        const deck = [...nextP.deck];
                        const target = deck[Math.floor(Math.random() * deck.length)];
                        nextP.deck = deck.map(c => c.id === target.id ? getUpgradedCard(c) : c);
                        upgradedName = target.name;
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`「がんばれ」と かいてあった。HPを 5 かいふく。 カードが つよくなった。`, languageMode));
                    }, 50);
                }},
                { label: "捨てる", text: "過去は振り返らない。カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`ポイすて した。 カードを かこに おいてきた。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "飼育小屋の掃除",
            description: "ニワトリのフンがすごい。掃除をすれば何か見つかるかも？",
            options: [
                { label: "頑張る", text: "HP-5。ポーション入手。", action: () => {
                    const pots = Object.values(POTION_LIBRARY);
                    const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-clean-${Date.now()}` };
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 5),
                            potions: [...prev.player.potions, pot].slice(0, 3)
                        }
                    }));
                    setEventResultLog(trans("ぴかぴかに した！(HPが 5 ヘル) すみに おちていた くすりを ゲット。", languageMode));
                }},
                { label: "サボる", text: "HP10回復。呪い「後悔」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10),
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-hutch-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("ひるねを した. HPを 10 かいふく. でも とうばんを わすれていた...のろい「こうかい」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "先生の忘れ物",
            description: "職員室の廊下に先生の出席簿が落ちている。中には秘密のメモが...",
            options: [
                { label: "盗み見る", text: "レリック「予習セット」入手. 呪い「恥」入手。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.BAG_OF_PREP],
                            deck: [...prev.player.deck, { ...CURSE_CARDS.SHAME, id: `shame-notes-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("テストの はんいが わかった！ おたから「よしゅうセット」を ゲット. でも こころが いたむ...のろい「はじ」を ゲット。", languageMode));
                }},
                { label: "届ける", text: "100G入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                    setEventResultLog(trans("しょうじきものは よいことが ある. せんせいから 100えん もらった。", languageMode));
                }}
            ]
        },
        {
            title: "学級文庫の漫画",
            description: "ボロボロの『ジャンプ』が置いてある。続きが気になる。",
            options: [
                { label: "読む", text: "ムキムキ+2。HP-5。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            strength: prev.player.strength + 2,
                            currentHp: Math.max(1, prev.player.currentHp - 5)
                        } 
                    }));
                    setEventResultLog(trans("ゆうじょう・どりょく・しょうり！(HPが 5 ヘル) ゆうきが わいて ムキムキ+2。", languageMode));
                }},
                { label: "寄付する", text: "自分のカードを1枚デッキから削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`じぶんの ほんを ほんだなに おいた。 カードが なくなった。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "理科室のアルコールランプ",
            description: "火がついたまま放置されている。危ない！",
            options: [
                { label: "消す", text: "カード「防御」強化。", action: () => {
                    let success = false;
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const targetIdx = deck.findIndex(c => c.name.includes("防御") && !c.upgraded);
                        if (targetIdx !== -1) {
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            success = true;
                            return { ...prev, player: { ...prev.player, deck } };
                        }
                        return prev;
                    });
                    if (success) setEventResultLog(trans(`れいせいな はんだんだ。 カードが つよくなった。`, languageMode));
                    else setEventResultLog(trans("無事に消火した。何も起きなかった。", languageMode));
                }},
                { label: "遊ぶ", text: "カード「やほど」3枚入手. 最大HP+5。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            maxHp: prev.player.maxHp + 5, 
                            currentHp: prev.player.currentHp + 5,
                            deck: [...prev.player.deck, { ...STATUS_CARDS.BURN, id: `burn1-${Date.now()}` }, { ...STATUS_CARDS.BURN, id: `burn2-${Date.now()}` }, { ...STATUS_CARDS.BURN, id: `burn3-${Date.now()}` }]
                        } 
                    }));
                    setEventResultLog(trans("ひあそびは たのしい！ さいだいHP+5. でも やほど した...カードを 3まい ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "音楽室の肖像画",
            description: "バッハの目が動いた気がする。何か言いたそうだ。",
            options: [
                { label: "歌う", text: "エナジー+1。HP-10。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            maxEnergy: prev.player.maxEnergy + 1,
                            currentHp: Math.max(1, prev.player.currentHp - 10)
                        }
                    }));
                    setEventResultLog(trans("たましいの うた！(HPが 10 ヘル) ほめられて さいだいエナジー+1。", languageMode));
                }},
                { label: "逃げる", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`ぜんりょくで にげた！ こわくて カードを わすれた。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "体育館の跳び箱",
            description: "12段の跳び箱がそびえ立っている。挑戦する？",
            options: [
                { label: "跳ぶ", text: "成功で最大HP+5、失敗でHP-10。", action: () => {
                    const success = Math.random() < 0.4;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (success) { nextP.maxHp += 5; nextP.currentHp += 5; }
                        else { nextP.currentHp = Math.max(1, nextP.currentHp - 10); }
                        return { ...prev, player: nextP };
                    });
                    if (success) setEventResultLog(trans("きれいに ちゃくち！ みんなに ほめられた. さいだいHP+5。", languageMode));
                    else setEventResultLog(trans("ぶつかった！ はなぢが でた。(HPが 10 ヘル)", languageMode));
                }},
                { label: "潜る", text: "レリック「お道具箱(マトリョーシカ)」入手. 呪い「悩み」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            relics: [...prev.player.relics, RELIC_LIBRARY.MATRYOSHKA],
                            deck: [...prev.player.deck, { ...CURSE_CARDS.WRITHE, id: `writhe-vlt-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("なかに かくれていた おたらたを みつけた！おたからを ゲット. でも こころが いたむ...のろい「なやみ」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "水道の蛇口",
            description: "誰かが水を出しっぱなしにしている。もったいない。",
            options: [
                { label: "閉める", text: "HP10回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                    setEventResultLog(trans("みずを たいせつに. こころが きれいになって HPを 10 かいふくした。", languageMode));
                }},
                { label: "飲む", text: "ポーション入手. HP-5。", action: () => {
                    const potion = POTION_LIBRARY['BLOCK_POTION'];
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 5),
                            potions: [...prev.player.potions, { ...potion, id: `water-${Date.now()}` }].slice(0, 3)
                        }
                    }));
                    setEventResultLog(trans("キンキンに ひえている！(HPが 5 ヘル) からだが かたまった。くすりを ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "家庭科の包丁",
            description: "研ぎ澄まされた包丁。料理の準備はできている。",
            options: [
                { label: "研ぐ", text: "カード「攻撃」1枚を2枚に増やす。", action: () => {
                    let name = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        const atk = nextP.deck.find(c => c.type === CardType.ATTACK);
                        if (atk) {
                            nextP.deck = [...nextP.deck, { ...atk, id: `cutlery-${Date.now()}` }];
                            name = atk.name;
                        }
                        return { ...prev, player: nextP };
                    });
                    if (name) setEventResultLog(trans(`きれあじ さいこう！ カードを コピーした。`, languageMode));
                    else setEventResultLog(trans("何も研ぐものがなかった。", languageMode));
                }},
                { label: "野菜を切る", text: "HP15回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 15) } }));
                    setEventResultLog(trans("おいしい サラダが できた！ HPを 15 かいふく。", languageMode));
                }}
            ]
        },
        {
            title: "秘密の連絡帳",
            description: "クラスの誰かの秘密が書かれている。見ちゃいけない...",
            options: [
                { label: "見る", text: "お宝か呪い。", action: () => {
                    const win = Math.random() < 0.6;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) nextP.gold += 150;
                        else nextP.deck = [...nextP.deck, { ...CURSE_CARDS.SHAME, id: `shame-diary-${Date.now()}` }];
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans("おとしだまの ばしょを みつけた！ 150えん ゲット。", languageMode));
                    else setEventResultLog(trans("さいていな じぶんを しってしまった. のろい「はじ」を ゲット。", languageMode));
                }},
                { label: "戻す", text: "何もなし。", action: () => setEventResultLog(trans("プライバシーは守られた。", languageMode)) }
            ]
        },
        {
            title: "校長先生の銅像",
            description: "威厳のある銅像。磨けば光るだろうか。",
            options: [
                { label: "磨く", text: "最大HP+2。HP2回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                    setEventResultLog(trans("こころまで みがかれた きがする. さいだいHP+2。", languageMode));
                }},
                { label: "落書き", text: "呪い「後悔」入手. 150G入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            gold: prev.player.gold + 150,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-statue-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("わるい ちから！ 150えん ゲット. でも あとで めちゃくちゃ おこられた...のろい「こうかい」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "階段の13段目",
            description: "夜になると増えるという伝説の階段。今、足元にあるのは13段目だ。",
            options: [
                { label: "踏み抜く", text: "カード1枚削除. HP-10。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`べつの せかいに すいこまれた！(HPが 10 ヘル) カードを おいてきた。`, languageMode));
                    }, 50);
                }},
                { label: "飛び越える", text: "カード「回避」入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CARDS_LIBRARY.DEFLECT, id: `deflect-stairs-${Date.now()}` } as Card] } }));
                    setEventResultLog(trans("すごい ジャンプだ！ 「かいひ」を おぼえた。", languageMode));
                }}
            ]
        },
        {
            title: "図書室の司書さん",
            description: "「お静かに. 本を読みますか？」",
            options: [
                { label: "物語を読む", text: "ランダムなカードを1枚入手。", action: () => {
                    const keys = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'UNCOMMON');
                    const card = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...card, id: `story-card-${Date.now()}` } as Card] } }));
                    setEventResultLog(trans(`かんどうする おはなしだ！ カードを デッキに いれた。`, languageMode));
                }},
                { label: "静かに去る", text: "HP5回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 5) } }));
                    setEventResultLog(trans("マナーを まもって HPを 5 かいふく。", languageMode));
                }}
            ]
        },
        {
            title: "屋上の貯水槽",
            description: "巨大なタンク。中から音が聞こえる。",
            options: [
                { label: "覗く", text: "ポーション入手かHP-10。", action: () => {
                    const win = Math.random() < 0.5;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) {
                            const pot = POTION_LIBRARY['HEALTH_POTION'];
                            nextP.potions = [...nextP.potions, { ...pot, id: `water-tank-${Date.now()}` }].slice(0, 3);
                        } else { nextP.currentHp = Math.max(1, nextP.currentHp - 10); }
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans("きれいな みずだ！くすりを ゲット。", languageMode));
                    else setEventResultLog(trans("すべって おちそうになった！ あぶない！(HPが 10 ヘル)", languageMode));
                }},
                { label: "叩く", text: "響く音. ムキムキ+1。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, strength: prev.player.strength + 1 } }));
                    setEventResultLog(trans("いいおとが した！ うでの ちからが ついて ムキムキ+1。", languageMode));
                }}
            ]
        },
        {
            title: "飼育室のウサギ",
            description: "モフモフのウサギがいる。癒やされる...",
            options: [
                { label: "抱っこ", text: "HP全回復. 呪い「寄生虫」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: prev.player.maxHp,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.PARASITE, id: `parasite-rabbit-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("とっても いやされた！ HP ぜんかいふく. でも むしに さされたみたい...のろい「きせいちゅう」を ゲット。", languageMode));
                }},
                { label: "観察する", text: "カード「先読み」強化。", action: () => {
                    let success = false;
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        const targetIdx = deck.findIndex(c => (c.name === '先読み' || c.name === 'SCRY') && !c.upgraded);
                        if (targetIdx !== -1) {
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            success = true;
                            return { ...prev, player: { ...prev.player, deck } };
                        }
                        return prev;
                    });
                    if (success) setEventResultLog(trans(`うごきを かんぺきに わかった！ カードが つよくなった。`, languageMode));
                    else setEventResultLog(trans("ウサギは寝ていた。", languageMode));
                }}
            ]
        },
        {
            title: "学校のゴミ捨て場",
            description: "掘り出し物があるかもしれない。",
            options: [
                { label: "あさる", text: "レリック入手か呪い「骨折」。", action: () => {
                    const win = Math.random() < 0.4;
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (win) {
                            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
                            const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
                            nextP.relics = [...nextP.relics, relic];
                        } else { nextP.deck = [...nextP.deck, { ...CURSE_CARDS.INJURY, id: `injury-trash-${Date.now()}` }]; }
                        return { ...prev, player: nextP };
                    });
                    if (win) setEventResultLog(trans(`おたから を ゲットか、のろい「こっせつ」か。`, languageMode));
                    else setEventResultLog(trans("粗大ゴミの下敷きになった！のろい「こっせつ」を ゲット。", languageMode));
                }},
                { label: "掃除する", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`きれいに かたづけた。かこを すてた。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "放送室から変な声",
            description: "放送室から変な声が流れてきた。止めに行く？",
            options: [
                { label: "止める", text: "カード「大声」入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...CARDS_LIBRARY.THUNDERCLAP, id: `clap-bc-${Date.now()}` } as Card] } }));
                    setEventResultLog(trans("マイクを うばった！「おおごえ」を おぼえた。", languageMode));
                }},
                { label: "聞き入る", text: "呪い「退屈」入手. HP回復。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10),
                            deck: [...prev.player.deck, { ...CURSE_CARDS.NORMALITY, id: `norm-bc-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("ふしぎな うたごえ...HPを 10 かいふく. でも あたまが ボーッとした. のろい「たいくつ」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "掲示板の100点答案",
            description: "誰かの100点のテストが飾られている。眩しい。",
            options: [
                { label: "盗む", text: "カード1枚強化. 呪い「恥」入手。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        const deck = [...nextP.deck];
                        const target = deck[Math.floor(Math.random() * deck.length)];
                        nextP.deck = deck.map(c => c.id === target.id ? getUpgradedCard(c) : c).concat({ ...CURSE_CARDS.SHAME, id: `shame-steal-${Date.now()}` });
                        upgradedName = target.name;
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`こたえを まるうつし した！ カードを つよくした. でも バレるのが こわい...のろい「はじ」を ゲット。`, languageMode));
                    }, 50);
                }},
                { label: "破る", text: "ムキムキ+2. 呪い「後悔」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            strength: prev.player.strength + 2,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.REGRET, id: `regret-tear-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("しっとの ほのお！ ムキムキ+2. でも こころが いたむ...のろい「こうかい」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "保健室のベッド",
            description: "ふかふかのシーツ。今なら誰もいない。",
            options: [
                { label: "寝る", text: "HP全回復. 次戦闘の1ターン目E-1。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp, nextTurnEnergy: -1 } }));
                    setEventResultLog(trans("ぐっすり...HP ぜんかいふく. でも ねぼけて つぎの バトルの さいしょの エナジーが 1 ヘル。", languageMode));
                }},
                { label: "飛び跳ねる", text: "最大HP+3。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                    setEventResultLog(trans("ベッドで ジャンプ！ たのしかった. さいだいHP+3。", languageMode));
                }}
            ]
        },
        {
            title: "給食の余りの牛乳",
            description: "バケツに1本だけ余っている。冷たそうだ。",
            options: [
                { label: "飲む", text: "最大HP+2. HP2回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                    setEventResultLog(trans("カルシウム ゲット！ さいだいHP+2。", languageMode));
                }},
                { label: "かける", text: "全カード強化. 自分にダメージ。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            currentHp: Math.max(1, prev.player.currentHp - 5),
                            deck: prev.player.deck.map(c => getUpgradedCard(c)) 
                        } 
                    }));
                    setEventResultLog(trans("ミルクシャワー！(HPが 5 ヘル) からだが つよくなって(？) カードが ぜんぶ つよくなった！", languageMode));
                }}
            ]
        },
        {
            title: "廊下のワックス",
            description: "塗りたてピカピカ. 滑るぞ。",
            options: [
                { label: "滑る", text: "レリック「上履き」入手. HP-5。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 5),
                            relics: [...prev.player.relics, RELIC_LIBRARY.HORN_CLEAT]
                        }
                    }));
                    setEventResultLog(trans("かっこいい スライディング！(HPが 5 ヘル) おたから「うわばき」を ゲット。", languageMode));
                }},
                { label: "歩く", text: "カード1枚削除。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`きをつけて あるいた。むだな うごきを なくした。`, languageMode));
                    }, 50);
                }}
            ]
        },
        {
            title: "理科室の毒薬",
            description: "ドクロマークの小瓶。どうする？",
            options: [
                { label: "飲む", text: "カード1枚強化. HP-10。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                        const deck = [...nextP.deck];
                        const targetIdx = Math.floor(Math.random() * deck.length);
                        deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                        upgradedName = deck[targetIdx].name;
                        nextP.deck = deck;
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        if (upgradedName) setEventResultLog(trans(`からだが どくに なれた！(HPが 10 ヘル) カードが つよくなった。`, languageMode));
                        else setEventResultLog(trans("ただの どくだった！(HPが 10 ヘル)", languageMode));
                    }, 50);
                }},
                { label: "捨てる", text: "50G入手. HP10回復。", action: () => {
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.min(nextP.maxHp, nextP.currentHp + 10);
                        nextP.gold += 50;
                        return { ...prev, player: nextP };
                    });
                    setEventResultLog(trans("へいわしゅぎ。こころが スッキリして、HPが 10 かいふくした。びんを うって 50えん ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "放課後の決闘",
            description: "河川敷で隣の小学校の番長が待ち構えている。「俺と勝負しろ！」",
            options: [
                { label: "受けて立つ", text: "HP-20. レリック「金剛杵」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 20),
                            relics: [...prev.player.relics, RELIC_LIBRARY.VAJRA]
                        }
                    }));
                    setEventResultLog(trans("すごい たたかいに かった！(HPが 20 ヘル) おたからを ゲットした！", languageMode));
                }},
                { label: "逃げる", text: "何も得られない。", action: () => setEventResultLog(trans("ダッシュで にげかえった。「よわむしー！」という こえが きこえる。", languageMode)) }
            ]
        },
        {
            title: "秘密基地",
            description: "森の奥に子供たちの秘密基地を見つけた。お菓子やマンガが置いてある。",
            options: [
                { label: "休む", text: "HP30回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 30) } }));
                    setEventResultLog(trans("まんがを よんで ゆっくり した. HPが 30 かいふくした。", languageMode));
                }},
                { label: "あさる", text: "ポーションとゴールド入手。", action: () => {
                    const potion = POTION_LIBRARY['ENERGY_POTION'];
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            gold: prev.player.gold + 30,
                            potions: [...prev.player.potions, { ...potion, id: `pot-base-${Date.now()}` }].slice(0, 3) 
                        } 
                    }));
                    setEventResultLog(trans("30えん と エナジーくすりを みつけた！", languageMode));
                }}
            ]
        },
        {
            title: "脱走したウサギ",
            description: "飼育小屋のウサギが逃げ出した！校庭を走り回っている。",
            options: [
                { label: "捕まえる", text: "50G入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                    setEventResultLog(trans("じょうずに つかまえた！ せんせいから 50えん もらった。", languageMode));
                }},
                { label: "一緒に遊ぶ", text: "最大HP+3。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                    setEventResultLog(trans("ウサギと おいかけっこ した。からだが つよくなった！(さいだいHP+3)", languageMode));
                }}
            ]
        },
        {
            title: "飼育小屋の主",
            description: "飼育小屋の奥に、主と呼ばれる巨大なニワトリがいる。",
            options: [
                { label: "戦う", text: "HP-10。カード強化。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                        const deck = [...nextP.deck];
                        const targetIdx = Math.floor(Math.random() * deck.length);
                        deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                        upgradedName = deck[targetIdx].name;
                        nextP.deck = deck;
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`つつかれた！(HPが 10 ヘル) はんげきで カードが つよくなった！`, languageMode));
                    }, 50);
                }},
                { label: "卵をもらう", text: "ポーション入手。", action: () => {
                    const potion = POTION_LIBRARY['HEALTH_POTION'];
                    setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...potion, id: `pot-egg-${Date.now()}` }].slice(0, 3) } }));
                    setEventResultLog(trans("しんせんな たまご(くすり)を ゲット！", languageMode));
                }}
            ]
        },
        {
            title: "闇の掲示板",
            description: "校舎裏の掲示板に, ターゲットの情報が書かれている。",
            options: [
                { label: "情報を売る", text: "カードを1枚削除. 50G入手。", action: () => {
                    let removedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.gold += 50;
                        if (nextP.deck.length > 0) {
                            const idx = Math.floor(Math.random() * nextP.deck.length);
                            const removed = nextP.deck.splice(idx, 1)[0];
                            removedName = removed.name;
                            if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                        }
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`じょうほうを うった. 50えんを てに いれた。`, languageMode));
                    }, 50);
                }},
                { label: "依頼を受ける", text: "HP-15。カード「毒突き」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 15),
                            deck: [...prev.player.deck, { ...CARDS_LIBRARY['POISON_STAB'], id: `stab-task-${Date.now()}` } as Card]
                        }
                    }));
                    setEventResultLog(trans("うらの おしごとを した。(HPが 15 ヘル) 「どくぜつ」を おぼえた。", languageMode));
                }}
            ]
        },
        {
            title: "理科室の爆発",
            description: "実験中に薬品を混ぜすぎた！フラスコが光り輝いている。",
            options: [
                { label: "耐える", text: "HP-15. ポーション2個入手。", action: () => {
                    const p1 = POTION_LIBRARY['FIRE_POTION'];
                    const p2 = POTION_LIBRARY['ENERGY_POTION'];
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            currentHp: Math.max(1, prev.player.currentHp - 15),
                            potions: [...prev.player.potions, { ...p1, id: `pot-exp-1-${Date.now()}` }, { ...p2, id: `pot-exp-2-${Date.now()}` }].slice(0, 3)
                        }
                    }));
                    setEventResultLog(trans("だいばくはつ！(HPが 15 ヘル) けむりの なかから くすりが 2つ でてきた。", languageMode));
                }},
                { label: "逃げる", text: "何もなし。", action: () => setEventResultLog(trans("じっけんを やめて にげだした。", languageMode)) }
            ]
        },
        {
            title: "地獄の特訓",
            description: "タイヤを引いて校庭を10周！エースへの道は険しい。",
            options: [
                { label: "やる", text: "HP-10。最大HP+10。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            maxHp: prev.player.maxHp + 10, 
                            currentHp: Math.max(1, prev.player.currentHp - 10)
                        } 
                    }));
                    setEventResultLog(trans("たおれそうに なりながら はしりきった。(HPが 10 ヘル) からだが すごく つよくなった！(さいだいHP+10)", languageMode));
                }},
                { label: "サボる", text: "HP全回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                    setEventResultLog(trans("きかげで やすんでいた。HP ぜんかいふく。", languageMode));
                }}
            ]
        },
        {
            title: "校内放送ジャック",
            description: "お昼の放送でリサイタルを開こう！全校生徒が君の歌を待っている（？）",
            options: [
                { label: "熱唱", text: "最大エナジー+1. HP-10。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            maxEnergy: prev.player.maxEnergy + 1,
                            currentHp: Math.max(1, prev.player.currentHp - 10)
                        }
                    }));
                    setEventResultLog(trans("こころの さけびが とどいた！(エナジー+1) のどを いためた...(HPが 10 ヘル)", languageMode));
                }},
                { label: "バラード", text: "HP20回復。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                    setEventResultLog(trans("やさしい うたごえで じぶんも いやされた。HPを 20 かいふく。", languageMode));
                }}
            ]
        },
        {
            title: "延滞図書の督促",
            description: "「あ、あの...本返してください...」不良グループが本を返してくれない。",
            options: [
                { label: "戦う", text: "HP-5. カード強化。", action: () => {
                    let upgradedName = "";
                    setGameState(prev => {
                        const nextP = { ...prev.player };
                        nextP.currentHp = Math.max(1, nextP.currentHp - 5);
                        const deck = [...nextP.deck];
                        const targetIdx = Math.floor(Math.random() * deck.length);
                        deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                        upgradedName = deck[targetIdx].name;
                        nextP.deck = deck;
                        return { ...prev, player: nextP };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`ゆうきを だして とりかえした！(HPが 5 ヘル) べんきょうに なって カードが つよくなった。`, languageMode));
                    }, 50);
                }},
                { label: "諦める", text: "呪い「不安」入手。", action: () => {
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            deck: [...prev.player.deck, { ...CURSE_CARDS.DOUBT, id: `doubt-lib-${Date.now()}` }]
                        }
                    }));
                    setEventResultLog(trans("こわくて いえなかった... のろい「ふあん」を ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "肥沃な土壌",
            description: "とても良質な土を見つけた。種を植えるには最適だ。",
            options: [
                { label: "植える", text: "カード「種」を1段階成長させる。", action: () => {
                    let success = false;
                    setGameState(prev => {
                        const garden = [...(prev.player.garden || [])];
                        let found = false;
                        for (let i=0; i<garden.length; i++) {
                            if (garden[i].plantedCard) {
                                garden[i].growth = Math.min(garden[i].maxGrowth, garden[i].growth + 2);
                                found = true;
                            }
                        }
                        if (found) {
                            success = true;
                            return { ...prev, player: { ...prev.player, garden } };
                        }
                        return prev;
                    });
                    if (success) setEventResultLog(trans("つちの ちからで しょくぶつが すくすく そだった！", languageMode));
                    else setEventResultLog(trans("種を植えていなかったので、何も起きなかった。", languageMode));
                }},
                { label: "持ち帰る", text: "100G入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                    setEventResultLog(trans("ボランティアを がんばった。 100えん ゲット。", languageMode));
                }}
            ]
        },
        {
            title: "新メニューのインスピレーション",
            description: "食堂の隅に古いレシピ本がある。新しいアイデアが浮かぶかも。",
            options: [
                { label: "研究する", text: "ランダムなカードを1枚変化。", action: () => {
                    let newName = "";
                    setGameState(prev => {
                        const deck = [...prev.player.deck];
                        if (deck.length === 0) return prev;
                        const idx = Math.floor(Math.random() * deck.length);
                        const pool = Object.values(CARDS_LIBRARY).filter(c => c.rarity === 'UNCOMMON');
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        deck[idx] = { ...pick, id: `chef-new-${Date.now()}` } as Card;
                        newName = pick.name;
                        return { ...prev, player: { ...prev.player, deck } };
                    });
                    setTimeout(() => {
                        setEventResultLog(trans(`あたらしい メニューを おもいついた！ カードが 1まい かわった。`, languageMode));
                    }, 50);
                }},
                { label: "試食する", text: "HP15回復. ムキムキ+1。", action: () => {
                    setGameState(prev => ({ 
                        ...prev, 
                        player: { 
                            ...prev.player, 
                            currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 15),
                            strength: prev.player.strength + 1
                        } 
                    }));
                    setEventResultLog(trans("とっても おいしい！ HPを 15 かいふく. さらに ムキムキ+1。", languageMode));
                }}
            ]
        }
    );

    // Pick random event from the massive pool
    return potentialEvents[Math.floor(Math.random() * potentialEvents.length)];
};
