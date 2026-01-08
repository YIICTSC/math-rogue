
import { Player, GameState, GameScreen, CardType } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, CURSE_CARDS, EVENT_CARDS, STATUS_CARDS } from '../constants';
import { trans } from '../utils/textUtils';
import { LanguageMode } from '../types';

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

export const generateEvent = (
    player: Player,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    handleNodeComplete: () => void,
    setEventResultLog: (log: string | null) => void,
    languageMode: LanguageMode
): GameEvent => {
    
    // Common Helper Actions
    const healPlayer = (amount: number) => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + amount) } }));
    };
    
    const damagePlayer = (amount: number) => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - amount) } }));
    };

    const gainGold = (amount: number) => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + amount } }));
    };

    const loseGold = (amount: number) => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - amount) } }));
    };

    const addCard = (cardTemplate: any, idPrefix: string = 'evt') => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...cardTemplate, id: `${idPrefix}-${Date.now()}` }] } }));
    };

    const removeCard = () => {
        // Random removal for event context
        const deck = [...player.deck];
        const idx = Math.floor(Math.random() * deck.length);
        const removed = deck[idx];
        deck.splice(idx, 1);
        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
        return removed;
    };

    const addRelic = (relic: any) => {
        setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, relic] } }));
    };

    const charType = getCharacterType(player);
    let potentialEvents: GameEvent[] = [];

    // --- COMMON EVENTS (EXISTING & NEW) ---
    potentialEvents.push(
        {
            title: "怪しい薬売り",
            description: "路地裏で男が声をかけてきた。「とびきりの薬, あるよ」",
            options: [
                { label: "買う", text: "20G支払って試す", action: () => {
                    if (player.gold >= 20) {
                        const pots = Object.values(POTION_LIBRARY);
                        const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold - 20, potions: [...prev.player.potions, pot].slice(0, 3) } }));
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
                    const deck = [...player.deck];
                    const target = deck[Math.floor(Math.random() * deck.length)];
                    if (target) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: [...prev.player.deck, { ...target, id: `copy-${Date.now()}` }] } }));
                        setEventResultLog(trans(`鏡の中の自分が何かを手渡してきた。\n「${target.name}」の複製を入手。`, languageMode));
                    } else {
                        setEventResultLog(trans("何も起こらなかった。", languageMode));
                    }
                }},
                { label: "割る", text: "鏡を叩き割る！", action: () => {
                    addCard(CURSE_CARDS.INJURY);
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
                    damagePlayer(10);
                    addRelic(book);
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
                        gainGold(50);
                        setEventResultLog(trans("勝った！譲ってあげたらお礼に50Gもらった。", languageMode));
                    } else {
                        damagePlayer(5);
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
                        setEventResultLog(trans("犬は嬉しそうに尻尾を振って去っていった。\n心が癒やされた。(HP全回復)", languageMode));
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                    } else {
                        setEventResultLog(trans("ガブッ！噛まれた！(HP-10)\n犬は走り去った。", languageMode));
                        damagePlayer(10);
                    }
                }},
                { label: "餌をやる", text: "何かあげる", action: () => {
                    if (player.gold >= 30) {
                        loseGold(30);
                        addRelic(RELIC_LIBRARY.SPIRIT_POOP);
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
                { label: "交換", text: "ランダムな交換する", action: () => {
                    const removeIdx = Math.floor(Math.random() * player.deck.length);
                    const removed = player.deck[removeIdx];
                    const newCardKey = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'UNCOMMON' || CARDS_LIBRARY[k].rarity === 'RARE')[Math.floor(Math.random() * 5)];
                    const newCard = CARDS_LIBRARY[newCardKey];
                    
                    let newMaxHp = player.maxHp;
                    let curseMsg = "";
                    if (removed.name === '寄生虫' || removed.name === 'PARASITE') {
                        newMaxHp -= 3;
                        curseMsg = "\n(寄生虫の効果で最大HP-3)";
                    }

                    const newDeck = [...player.deck];
                    newDeck.splice(removeIdx, 1, { ...newCard, id: `trade-${Date.now()}` });
                    
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: newDeck, maxHp: newMaxHp, currentHp: Math.min(prev.player.currentHp, newMaxHp) } }));
                    setEventResultLog(trans(`「${removed.name}」を渡して、「${newCard.name}」をもらった！${curseMsg}\n転校生はニヤリと笑った。`, languageMode));
                }},
                { label: "断る", text: "自分のカードが大事", action: () => setEventResultLog(trans("断った。転校生はつまらなそうに去った。", languageMode)) }
            ]
        },
        // --- NEW SCHOOL EVENTS ---
        {
            title: "席替え",
            description: "今日は席替えの日だ。窓際の一番後ろになれるか...？\nそれとも最前列か。",
            options: [
                { label: "くじを引く", text: "手札(デッキ)が変わる予感...", action: () => {
                    const deck = [...player.deck];
                    // Shuffle 3 cards into random other cards
                    for(let i=0; i<3; i++) {
                        const idx = Math.floor(Math.random() * deck.length);
                        const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k]);
                        const newCard = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                        deck[idx] = { ...newCard, id: `seat-${Date.now()}-${i}` };
                    }
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                    setEventResultLog(trans("席替えの結果、付き合う友達(デッキ)が変わった！\nカードが3枚変化した。", languageMode));
                }},
                { label: "祈る", text: "今の席を維持したい...", action: () => {
                    healPlayer(5);
                    setEventResultLog(trans("なんとか今の席をキープできた。\n安心してHPが5回復した。", languageMode));
                }}
            ]
        },
        {
            title: "避難訓練",
            description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。",
            options: [
                { label: "走る", text: "カードを1枚削除(逃げる)", action: () => {
                    const removed = removeCard();
                    setEventResultLog(trans(`一目散に逃げ出した！\n不要な「${removed.name}」を置いてきた。`, languageMode));
                }},
                { label: "隠れる", text: "HP回復", action: () => {
                    healPlayer(15);
                    setEventResultLog(trans("机の下に隠れてやり過ごした。\nHPが15回復した。", languageMode));
                }}
            ]
        },
        {
            title: "プール開き",
            description: "待ちに待ったプール開きだ！\nしかし水は冷たそうだ。",
            options: [
                { label: "泳ぐ", text: "全回復するが、風邪を引くかも", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                    if (Math.random() < 0.4) {
                        addCard(CURSE_CARDS.DECAY); // 腐敗 (Rot/Decay -> Cold?)
                        setEventResultLog(trans("最高に気持ちいい！HP全回復！\n...しかし風邪を引いてしまった。呪い「腐敗」を入手。", languageMode));
                    } else {
                        setEventResultLog(trans("最高に気持ちいい！HP全回復！\n体も丈夫になった気がする。", languageMode));
                    }
                }},
                { label: "見学", text: "カードを1枚強化", action: () => {
                    const deck = [...player.deck];
                    const upgradeable = deck.filter(c => !c.upgraded);
                    if (upgradeable.length > 0) {
                        // Random upgrade logic simulation
                        // In real implementation we'd use the util, but here we just flag it upgraded
                        const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                        const newDeck = deck.map(card => card.id === c.id ? { ...card, upgraded: true, damage: card.damage ? Math.floor(card.damage*1.3)+2 : undefined, block: card.block ? Math.floor(card.block*1.3)+2 : undefined } : card);
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: newDeck } }));
                        setEventResultLog(trans(`プールサイドでイメトレをした。\n「${c.name}」が強化された！`, languageMode));
                    } else {
                        setEventResultLog(trans("見学していたが、特に何も起きなかった。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "修学旅行の積立金",
            description: "集金袋を拾った。中にはお金が入っている。",
            options: [
                { label: "ネコババ", text: "150G入手。呪い「罪悪感(後悔)」を得る。", action: () => {
                    gainGold(150);
                    addCard(CURSE_CARDS.REGRET);
                    setEventResultLog(trans("150Gを手に入れた！\nしかし良心が痛む...呪い「後悔」を入手。", languageMode));
                }},
                { label: "届ける", text: "職員室に届ける", action: () => {
                    addRelic(RELIC_LIBRARY.MEMBERSHIP_CARD); // Honor student reward
                    setEventResultLog(trans("正直者は報われる。\n先生から「会員カード」をもらった！", languageMode));
                }}
            ]
        },
        {
            title: "魔の掃除時間",
            description: "廊下のワックスがけの時間だ。\nツルツル滑る床は危険だが, 滑れば速く移動できるかも？",
            options: [
                { label: "滑る", text: "カード強化。HP-5。", action: () => {
                    damagePlayer(5);
                    const deck = [...player.deck];
                    const upgradeable = deck.filter(c => !c.upgraded);
                    if (upgradeable.length > 0) {
                        const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                        const newDeck = deck.map(card => card.id === c.id ? { ...card, upgraded: true, damage: card.damage ? Math.floor(card.damage*1.3)+2 : undefined } : card);
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: newDeck } }));
                        setEventResultLog(trans(`スライディング！(HP-5)\n「${c.name}」の扱いが上手くなった！`, languageMode));
                    } else {
                        setEventResultLog(trans("派手に転んだ！痛い！(HP-5)", languageMode));
                    }
                }},
                { label: "磨く", text: "カード1枚削除。", action: () => {
                    const removed = removeCard();
                    setEventResultLog(trans(`心を込めて磨いたら、心が洗われた。\n「${removed.name}」が取り除かれた。`, languageMode));
                }}
            ]
        },
        {
            title: "運命のテスト返却",
            description: "今日は算数のテストが返却される日だ。\n自信はあるか？",
            options: [
                { label: "自信あり", text: "確率で100GかHP-10。", action: () => {
                    if (Math.random() < 0.5) {
                        gainGold(100);
                        setEventResultLog(trans("100点満点だ！\nお祝いに100Gをもらった！", languageMode));
                    } else {
                        damagePlayer(10);
                        setEventResultLog(trans("名前を書き忘れていた！0点だ！\n精神的ダメージを受けた。(HP-5)", languageMode));
                    }
                }},
                { label: "隠す", text: "呪い「恥」を得る。HP20回復。", action: () => {
                    addCard(CURSE_CARDS.SHAME);
                    healPlayer(20);
                    setEventResultLog(trans("親に見つからないように隠した。\n安心したが、良心が痛む...呪い「恥」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "放送室のジャック",
            description: "放送室に誰もいない。マイクの電源が入っている。\nイタズラするチャンス？",
            options: [
                { label: "歌う", text: "最大HP+4。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4 } }));
                    setEventResultLog(trans("生徒たちに大ウケだ！人気者になった。\n最大HP+4。", languageMode));
                }},
                { label: "告白", text: "呪い「後悔」を得る。HP回復。", action: () => {
                    healPlayer(10);
                    addCard(CURSE_CARDS.REGRET);
                    setEventResultLog(trans("好きな人の名前を叫ぶ...！\n校長先生の名前を叫んでしまった。呪い「後悔」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "理科室の人体模型",
            description: "夜の理科室。人体模型が動いている気がする。\n「心臓ヲ...クレ...」と聞こえた。",
            options: [
                { label: "あげる", text: "HP-10。レリック「血の瓶」入手。", action: () => {
                    damagePlayer(10);
                    addRelic(RELIC_LIBRARY.BLOOD_VIAL);
                    setEventResultLog(trans("自分の血を分け与えた(HP-10)\nお礼に「保健室の飴(レリック)」を貰った。", languageMode));
                }},
                { label: "逃げる", text: "カード1枚削除。", action: () => {
                    const removed = removeCard();
                    setEventResultLog(trans(`なんとか逃げ切った。怖かった...\n恐怖で「${removed.name}」を忘れてしまった。`, languageMode));
                }}
            ]
        },
        {
            title: "図書室の静寂",
            description: "放課後の図書室はとても静かだ。\n心地よい眠気が襲ってくる...",
            options: [
                { label: "寝る", text: "HP20回復。", action: () => {
                    healPlayer(20);
                    setEventResultLog(trans("ぐっすり眠れた。HPが20回復した。\nよだれで本が少し濡れた。", languageMode));
                }},
                { label: "勉強", text: "「先読み」カード入手。", action: () => {
                    addCard(CARDS_LIBRARY.SCRY);
                    setEventResultLog(trans("集中して勉強した。\n「先読み」のカードを習得した。", languageMode));
                }}
            ]
        },
        {
            title: "終わらない朝礼",
            description: "校長先生の話が長い...もう30分も続いている。\n貧血で倒れそうだ。",
            options: [
                { label: "耐える", text: "最大HP+5, HP-5。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                    setEventResultLog(trans("なんとか耐え抜いた！精神力が鍛えられた。\n最大HP+5, HP-5。", languageMode));
                }},
                { label: "座る", text: "HP全回復。呪い「ドジ」入手。", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                    addCard(CURSE_CARDS.CLUMSINESS);
                    setEventResultLog(trans("こっそり座って休んだ。HP全回復。\n先生に見つかって怒られた。呪い「ドジ」を入手。", languageMode));
                }}
            ]
        },
        {
            title: "置き勉の誘惑",
            description: "カバンが重すぎる。教科書を学校に置いて帰ろうか...",
            options: [
                { label: "置く", text: "ランダムなカード1枚削除。", action: () => {
                    const removed = removeCard();
                    setEventResultLog(trans(`教科書(カード: ${removed.name})を机の中に隠した。\n体が軽くなった！`, languageMode));
                }},
                { label: "持つ", text: "「頭突き」カード入手。", action: () => {
                    addCard(CARDS_LIBRARY.HEADBUTT);
                    setEventResultLog(trans("重いカバンで足腰が鍛えられた。\n「頭突き」を習得した。", languageMode));
                }}
            ]
        },
        {
            title: "伝説の木の下",
            description: "この木の下で告白すると結ばれるという伝説がある。\n誰かが待っているようだ。",
            options: [
                { label: "行く", text: "ランダム(レリック/カード/呪い)。", action: () => {
                    const r = Math.random();
                    if (r < 0.3) {
                         addRelic(RELIC_LIBRARY.HAPPY_FLOWER);
                         setEventResultLog(trans("なんと！欲しかったレアカード「アサガオ(レリック)」をもらえた！\nこれは愛の告白...？", languageMode));
                    } else if (r < 0.6) {
                         addCard(CURSE_CARDS.WRITHE); // Fallback to writhe
                         setEventResultLog(trans("誰もいなかった... イタズラだったようだ。\n胸が痛む。呪い「苦悩」を入手。", languageMode));
                    } else {
                         gainGold(100);
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
                    if (Math.random() < 0.5) {
                        addCard(STATUS_CARDS.SLIMED);
                        setEventResultLog(trans("うわっ！腐ったバナナを掴んでしまった。\n「鼻水(粘液)」カードがデッキに入った。", languageMode));
                    } else {
                        const keys = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'RARE');
                        const card = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                        addCard(card);
                        setEventResultLog(trans(`なんと！隠されていた「${card.name}」を見つけた！`, languageMode));
                    }
                }},
                { label: "放置", text: "何もなし。", action: () => setEventResultLog(trans("賢明な判断だ。", languageMode)) }
            ]
        }
    );

    // --- CHARACTER SPECIFIC EVENTS ---

    if (charType === 'WARRIOR') {
        potentialEvents.push({
            title: "放課後の決闘",
            description: "河川敷で隣の小学校の番長が待ち構えている。\n「俺と勝負しろ！」",
            options: [
                { label: "受けて立つ", text: "HP-20。レアレリック入手。", action: () => {
                    damagePlayer(20);
                    addRelic(RELIC_LIBRARY.VAJRA); // Fallback
                    setEventResultLog(trans("激闘の末、勝利した！(HP-20)\n番長の証「金剛杵」を奪い取った！", languageMode));
                }},
                { label: "逃げる", text: "何も得られない", action: () => setEventResultLog(trans("ダッシュで逃げ帰った。\n「弱虫ー！」という声が聞こえる。", languageMode)) }
            ]
        });
        potentialEvents.push({
            title: "秘密基地",
            description: "森の奥に子供たちの秘密基地を見つけた。\nお菓子やマンガが置いてある。",
            options: [
                { label: "休む", text: "HP30回復", action: () => {
                    healPlayer(30);
                    setEventResultLog(trans("マンガを読んでリラックスした。\nHPが30回復した。", languageMode));
                }},
                { label: "あさる", text: "ポーションとゴールド入手", action: () => {
                    gainGold(30);
                    const potion = POTION_LIBRARY['ENERGY_POTION'];
                    setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...potion, id: `pot-${Date.now()}` }].slice(0, 3) } }));
                    setEventResultLog(trans("30Gとエナジーポーションを見つけた！", languageMode));
                }}
            ]
        });
    }

    if (charType === 'CARETAKER') {
        potentialEvents.push({
            title: "脱走したウサギ",
            description: "飼育小屋のウサギが逃げ出した！\n校庭を走り回っている。",
            options: [
                { label: "捕まえる", text: "50G入手", action: () => {
                    gainGold(50);
                    setEventResultLog(trans("見事な手際で捕まえた！\n先生からお小遣い50Gをもらった。", languageMode));
                }},
                { label: "一緒に遊ぶ", text: "最大HP+3", action: () => {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                    setEventResultLog(trans("ウサギと追いかけっこをした。\n体が丈夫になった！(最大HP+3)", languageMode));
                }}
            ]
        });
        potentialEvents.push({
            title: "飼育小屋の主",
            description: "飼育小屋の奥に, 主と呼ばれる巨大なニワトリがいる。",
            options: [
                { label: "戦う", text: "HP-10。カード強化。", action: () => {
                    damagePlayer(10);
                    const deck = [...player.deck];
                    const target = deck.find(c => c.type === CardType.ATTACK && !c.upgraded);
                    if (target) {
                        const newDeck = deck.map(c => c.id === target.id ? { ...c, upgraded: true, damage: c.damage ? Math.floor(c.damage*1.3)+2 : undefined } : c);
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck: newDeck } }));
                        setEventResultLog(trans(`つつかれた！(HP-10)\n反撃で「${target.name}」の腕が上がった！`, languageMode));
                    } else {
                        setEventResultLog(trans("つつかれただけで終わった...(HP-10)", languageMode));
                    }
                }},
                { label: "卵をもらう", text: "ポーション入手", action: () => {
                    const potion = POTION_LIBRARY['HEALTH_POTION'];
                    setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...potion, id: `pot-${Date.now()}` }].slice(0, 3) } }));
                    setEventResultLog(trans("新鮮な卵(回復ポーション)を手に入れた！", languageMode));
                }}
            ]
        });
    }

    if (charType === 'ASSASSIN') {
        potentialEvents.push({
            title: "闇の掲示板",
            description: "校舎裏の掲示板に, ターゲットの情報が書かれている。",
            options: [
                { label: "情報を売る", text: "カードを1枚削除。50G入手。", action: () => {
                    const removed = removeCard();
                    gainGold(50);
                    setEventResultLog(trans(`「${removed.name}」の情報を売った。\n50Gを手に入れた。`, languageMode));
                }},
                { label: "依頼を受ける", text: "エリート敵と戦闘(報酬2倍)", action: () => {
                    // Start Elite combat immediately would be complex here, so simulate reward
                    // Instead, grant a powerful card but take damage
                    damagePlayer(15);
                    addCard(CARDS_LIBRARY['POISON_STAB']); 
                    setEventResultLog(trans("裏の仕事をこなした。(HP-15)\n「毒突き」の技術を習得した。", languageMode));
                }}
            ]
        });
    }

    if (charType === 'MAGE') {
        potentialEvents.push({
            title: "理科室の爆発",
            description: "実験中に薬品を混ぜすぎた！\nフラスコが光り輝いている。",
            options: [
                { label: "耐える", text: "HP-15。ポーション2個入手。", action: () => {
                    damagePlayer(15);
                    const p1 = POTION_LIBRARY['FIRE_POTION'];
                    const p2 = POTION_LIBRARY['ENTROPIC_BREW'] || POTION_LIBRARY['ENERGY_POTION'];
                    setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...p1, id: `p1-${Date.now()}` }, { ...p2, id: `p2-${Date.now()}` }].slice(0, 3) } }));
                    setEventResultLog(trans("大爆発！(HP-15)\n煙の中からポーションが2つ生成された。", languageMode));
                }},
                { label: "逃げる", text: "何もなし", action: () => setEventResultLog(trans("実験を中止して逃げ出した。", languageMode)) }
            ]
        });
    }

    if (charType === 'DODGEBALL') {
        potentialEvents.push({
            title: "地獄の特訓",
            description: "タイヤを引いて校庭を10周！\nエースへの道は険しい。",
            options: [
                { label: "やる", text: "HP-10。最大HP+10。", action: () => {
                    damagePlayer(10);
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 10 } }));
                    setEventResultLog(trans("倒れそうになりながら完走した。(HP-10)\n体力が大幅に向上した！(MaxHP+10)", languageMode));
                }},
                { label: "サボる", text: "HP全回復", action: () => {
                    healPlayer(999);
                    setEventResultLog(trans("木陰で休んでいた。HP全回復。", languageMode));
                }}
            ]
        });
    }

    if (charType === 'BARD') {
        potentialEvents.push({
            title: "校内放送ジャック",
            description: "お昼の放送でリサイタルを開こう！\n全校生徒が君の歌を待っている（？）",
            options: [
                { label: "熱唱", text: "最大エナジー+1。HP-10。", action: () => {
                    damagePlayer(10);
                    setGameState(prev => ({ ...prev, player: { ...prev.player, maxEnergy: prev.player.maxEnergy + 1 } }));
                    setEventResultLog(trans("魂の叫びが届いた！(エナジー+1)\n喉を痛めた...(HP-10)", languageMode));
                }},
                { label: "バラード", text: "HP20回復。", action: () => {
                    healPlayer(20);
                    setEventResultLog(trans("優しい歌声で自分も癒やされた。\nHP20回復。", languageMode));
                }}
            ]
        });
    }

    if (charType === 'LIBRARIAN') {
        potentialEvents.push({
            title: "延滞図書の督促",
            description: "「あ, あの...本返してください...」\n不良グループが本を返してくれない。",
            options: [
                { label: "戦う", text: "HP-5。カード強化。", action: () => {
                    damagePlayer(5);
                    // Upgrade random card
                    const deck = [...player.deck];
                    const c = deck[Math.floor(Math.random() * deck.length)];
                    const newDeck = deck.map(card => card.id === c.id ? { ...card, upgraded: true, damage: card.damage ? Math.floor(card.damage*1.3)+2 : undefined } : card);
                    setGameState(prev => ({ ...prev, player: { ...prev.player, deck: newDeck } }));
                    setEventResultLog(trans(`勇気を出して取り返した！(HP-5)\n経験値を得て「${c.name}」が強化された。`, languageMode));
                }},
                { label: "諦める", text: "呪い「弱気(不安)」を得る。", action: () => {
                    addCard(CURSE_CARDS.DOUBT);
                    setEventResultLog(trans("怖くて言えなかった...\n呪い「不安」を入手。", languageMode));
                }}
            ]
        });
    }

    // Pick random event
    return potentialEvents[Math.floor(Math.random() * potentialEvents.length)];
};
