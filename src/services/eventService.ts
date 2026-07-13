
import React from 'react';
import { Player, GameState, GameScreen, CardType, Card, TargetType } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, CURSE_CARDS, EVENT_CARDS, STATUS_CARDS } from '../constants';
import { transEventText as trans } from '../utils/textUtils';
import { LanguageMode } from '../types';
import { getUpgradedCard } from '../utils/cardUtils';
import { ADDITIONAL_CARDS } from '../constants1';
import { getVisualThemeEventTheme, getVisualThemeEventThemeByTitle, type ThemedEventTheme, type VisualThemeId } from '../data/visualThemes';
import { getSupporterNpcEventByTitle, HIGH_SCHOOL_SUPPORTER_NPC_EVENTS, type SupporterNpcEventProfile, type SupporterNpcQuestion, type SupporterNpcReward } from '../data/supporterNpcEvents';
import { AZUKI_ENCOUNTER_FLAG } from '../data/azukiBoss';
import { DODOMEDESU_BOSS_READY_FLAG, DODOMEDESU_EVENT_STAGE_FLAG, DODOMEDESU_EVENT_STAGES } from '../data/dodomedesuBoss';

interface EventAnswerMeta {
    quickQuizProgress?: number;
}

interface EventOption {
    label: string;
    text: string;
    isCorrect?: boolean;
    action: (answerMeta?: EventAnswerMeta) => void;
}

interface GameEvent {
    title: string;
    description: string;
    options: EventOption[];
    imageKey?: string;
}

export const ELEMENTARY_EVENT_TITLES = [
    '忘れ物', '怪しい薬売り', '踊り場の鏡', '呪われた書物', '伝説の給食', '校庭の野良犬', '謎の転校生', '席替え',
    '避難訓練', 'プール開き', '修学旅行の積立金', '魔の掃除時間', '運命のテスト返却', '放送室のジャック',
    '理科室の人体模型', '図書室の静寂', '終わらない朝礼', '置き勉の誘惑', '伝説の木の下', '体育倉庫のマット',
    '秘密基地のパスワード', '職員室の呼び出し', '落とし物のリコーダー', '図工室の粘土', '家庭科室のつまみ食い',
    '体育祭の練習', '校章の輝き', '文化祭のポスター', '不気味な音楽室', '屋上の柵', '給食の残飯処理',
    '昇降口の下履き', '二宮金次郎の背負い物', '保健室の視力検査', '図書室の貸出カード', '飼育小屋の掃除',
    '先生の忘れ物', '学級文庫の漫画', '理科室のアルコールランプ', '音楽室の肖像画', '体育館の跳び箱', '水道の蛇口',
    '家庭科の包丁', '秘密の連絡帳', '校長先生の銅像', '階段の13段目', '図書室の司書さん', '屋上の貯水槽',
    '飼育室のウサギ', '学校のゴミ捨て場', '放送室から変な声', '掲示板の100点答案', '保健室のベッド',
    '給食の余りの牛乳', '廊下のワックス', '理科室の毒薬', '放課後の決闘', '秘密基地', '脱走したウサギ',
    '飼育小屋の主', '闇の掲示板', '理科室の爆発', '地獄の特訓', '校内放送ジャック', '延滞図書の督促',
    '肥沃な土壌', '新メニューのインスピレーション',
] as const;

const healPlayer = (player: Player, amount: number): Player => ({
    ...player,
    currentHp: Math.min(player.maxHp, player.currentHp + amount)
});

const getStableTextIndex = (text: string, size: number): number => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash % size;
};

const getStableShuffledIndexes = (size: number, seed: string): number[] => {
    const indexes = Array.from({ length: size }, (_, index) => index);
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index++) {
        hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
    }
    for (let i = indexes.length - 1; i > 0; i--) {
        hash ^= hash << 13;
        hash ^= hash >>> 17;
        hash ^= hash << 5;
        const j = (hash >>> 0) % (i + 1);
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    return indexes;
};

interface EventSparkResult {
    player: Player;
    message: string;
    kind: 'gold' | 'heal' | 'maxHp' | 'upgrade' | 'potion';
    subject?: string;
    amount?: number;
}

const applyEventSpark = (player: Player, seed: string): EventSparkResult => {
    const options: Array<() => EventSparkResult | null> = [
        () => ({
            player: { ...player, gold: player.gold + 16 },
            message: "落ちていた購買券を見つけた。16Gを得た。",
            kind: 'gold',
            amount: 16
        }),
        () => player.currentHp < player.maxHp
            ? {
                player: healPlayer(player, 8),
                message: "深呼吸で調子が戻った。HPが8回復した。",
                kind: 'heal',
                amount: 8
            }
            : null,
        () => ({
            player: { ...player, maxHp: player.maxHp + 1, currentHp: player.currentHp + 1 },
            message: "小さな気づきが自信になった。最大HP+1。",
            kind: 'maxHp',
            amount: 1
        }),
        () => {
            const upgradeable = player.deck.filter(card => !card.upgraded);
            if (upgradeable.length === 0) return null;
            const target = upgradeable[getStableTextIndex(seed, upgradeable.length)];
            return {
                player: {
                    ...player,
                    deck: player.deck.map(card => card.id === target.id ? getUpgradedCard(card) : card)
                },
                message: `ノートに追記したコツで「${target.name}」が強化された。`,
                kind: 'upgrade',
                subject: target.name
            };
        },
        () => {
            if (player.potions.length >= getPotionCapacity(player)) return null;
            const potions = Object.values(POTION_LIBRARY);
            const potion = potions[getStableTextIndex(seed, potions.length)];
            return {
                player: {
                    ...player,
                    potions: [...player.potions, { ...potion, id: `event-spark-${Date.now()}` }]
                },
                message: `机の奥から「${potion.name}」を見つけた。`,
                kind: 'potion',
                subject: potion.name
            };
        }
    ];

    const start = getStableTextIndex(seed, options.length);
    for (let offset = 0; offset < options.length; offset++) {
        const result = options[(start + offset) % options.length]();
        if (result) return result;
    }

    return {
        player: { ...player, gold: player.gold + 12 },
        message: "小さな貸しを作った。12Gを得た。",
        kind: 'gold',
        amount: 12
    };
};

const buildEventSparkMessage = (eventTitle: string | null, result: EventSparkResult): string => {
    const title = eventTitle ?? 'この出来事';
    switch (result.kind) {
        case 'gold':
            return `${title}で得た段取りが小さな謝礼につながった。${result.amount ?? 16}Gを得た。`;
        case 'heal':
            return `${title}の場を離れるころには呼吸が整っていた。HPが${result.amount ?? 8}回復した。`;
        case 'maxHp':
            return `${title}で腹が据わった。最大HP+${result.amount ?? 1}。`;
        case 'upgrade':
            return `${title}でつかんだコツをノートに書き込み、「${result.subject ?? 'カード'}」が強化された。`;
        case 'potion':
            return `${title}の片付け中に使えそうな「${result.subject ?? 'ポーション'}」を見つけた。`;
        default:
            return result.message;
    }
};

const addPermanentStrengthBonus = (player: Player, amount: number): Player => ({
    ...player,
    relicCounters: {
        ...player.relicCounters,
        EVENT_STRENGTH_BONUS: (player.relicCounters['EVENT_STRENGTH_BONUS'] || 0) + amount
    }
});

const getPotionCapacity = (player: Player): number => (player.relics.some(r => r.id === 'CAULDRON') ? 5 : 3);

const addCardWithEventRelics = (player: Player, card: Card): Player => {
    const nextPlayer: Player = {
        ...player,
        relicCounters: { ...player.relicCounters },
        deck: [...player.deck, { ...card, id: card.id || `event-card-${Date.now()}-${Math.random()}` }]
    };

    if (nextPlayer.relics.some(r => r.id === 'CERAMIC_FISH')) {
        nextPlayer.gold += 9;
    }

    const mirrorCharges = nextPlayer.relicCounters['DOLLYS_MIRROR_CHARGES'] || 0;
    if (mirrorCharges > 0) {
        nextPlayer.deck = [
            ...nextPlayer.deck,
            { ...card, id: `event-mirror-${Date.now()}-${Math.random()}` }
        ];
        nextPlayer.relicCounters['DOLLYS_MIRROR_CHARGES'] = mirrorCharges - 1;
    }

    return nextPlayer;
};

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
                    player: addCardWithEventRelics(prev.player, { ...card, id: `legacy-${Date.now()}` } as Card)
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
    unlockedCardNames: string[],
    preferredEventTitle?: string,
    visualTheme: VisualThemeId = 'elementary',
    currentAct = 1,
    currentFloor = 1,
    isEndless = false,
    supporterQuestionIndex?: number
): GameEvent => {
    let activeEventTitle: string | null = null;
    const finalizeEvent = (event: GameEvent): GameEvent => {
        const isCrowdfundingEvent = event.title === 'あずきとの出会い'
            || DODOMEDESU_EVENT_STAGES.some(stage => stage.title === event.title);
        const themedEvent = isCrowdfundingEvent
            ? null
            : getVisualThemeEventTheme(visualTheme, event.title, currentAct, currentFloor);
        if (themedEvent) return buildThemedEvent(themedEvent, visualTheme);
        return {
        ...event,
        options: event.options.map(option => ({
            ...option,
            text: option.text,
            action: (answerMeta?: EventAnswerMeta) => {
                activeEventTitle = event.title;
                try {
                    option.action(answerMeta);
                } catch (error) {
                    console.error(`Event action failed: ${event.title} / ${option.label}`, error);
                    setEventResultLog(trans("何も起きず、イベントは終わった。", languageMode));
                } finally {
                    activeEventTitle = null;
                }
            }
        }))
    };
    };

    const resolveMomentum = (seed: string, flavor: string, listedEffectOption = false): void => {
        const preview = applyEventSpark(player, seed);
        setGameState(prev => ({
            ...prev,
            player: applyEventSpark(prev.player, seed).player
        }));
        const resultMessage = buildEventSparkMessage(activeEventTitle, preview);
        const prefix = listedEffectOption ? '' : `${flavor}\n`;
        setEventResultLog(trans(`${prefix}${resultMessage}`, languageMode));
    };

    type HighSchoolEffect =
        | { kind: 'gold'; amount: number }
        | { kind: 'heal'; amount: number }
        | { kind: 'maxHp'; amount: number }
        | { kind: 'strength'; amount: number }
        | { kind: 'upgrade' }
        | { kind: 'skillCard' }
        | { kind: 'potion'; potionId: keyof typeof POTION_LIBRARY }
        | { kind: 'momentum' };

    const highSchoolChoices: Record<number, Array<{ label: string; text: string; result: string; effect: HighSchoolEffect }>> = {
        0: [
            { label: '残って勉強する', text: 'カードを1枚強化する', result: '静かな机で復習が進んだ。', effect: { kind: 'upgrade' } },
            { label: '少し仮眠する', text: 'HPを12回復する', result: '短い仮眠で頭が冴えた。', effect: { kind: 'heal', amount: 12 } },
            { label: '机を片付ける', text: '小さな成果を得る', result: '机まわりを整えると、次の一手も見えやすくなった。', effect: { kind: 'momentum' } },
        ],
        1: [
            { label: '深呼吸する', text: '最大HP+2', result: '冷たい風で腹が据わった。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '夕景をメモする', text: 'カードを1枚強化する', result: '考えが整理され、ノートの要点がつながった。', effect: { kind: 'upgrade' } },
            { label: 'すぐ戻る', text: '25Gを得る', result: '忘れていた小遣い袋を鞄で見つけた。', effect: { kind: 'gold', amount: 25 } },
        ],
        2: [
            { label: '答案を見直す', text: 'カードを1枚強化する', result: '間違いの癖を一つ潰した。', effect: { kind: 'upgrade' } },
            { label: '苦手だけ復習する', text: '恒久ムキムキ+1', result: '弱点を直視したぶん、次の勝負に強くなった。', effect: { kind: 'strength', amount: 1 } },
            { label: 'いったんしまう', text: 'HPを8回復する', result: '気持ちを切り替え、肩の力が抜けた。', effect: { kind: 'heal', amount: 8 } },
        ],
        3: [
            { label: '飾り付けを進める', text: '35Gを得る', result: '段取りの良さを買われ、謝礼を受け取った。', effect: { kind: 'gold', amount: 35 } },
            { label: '会計を手伝う', text: 'カードを1枚強化する', result: '数字を追ううちに、手札の扱いも洗練された。', effect: { kind: 'upgrade' } },
            { label: '休憩を入れる', text: 'HPを10回復する', result: '教室の隅で一息ついた。', effect: { kind: 'heal', amount: 10 } },
        ],
        4: [
            { label: 'ポスターを読む', text: '小さな成果を得る', result: '掲示を見比べるうちに、今の自分に必要なことが見えた。', effect: { kind: 'momentum' } },
            { label: '体験入部の紙を取る', text: 'スキルカードを1枚得る', result: '新しい活動の要領を覚えた。', effect: { kind: 'skillCard' } },
            { label: '廊下を抜ける', text: '20Gを得る', result: '落ちていた購買券を拾って届け、謝礼をもらった。', effect: { kind: 'gold', amount: 20 } },
        ],
        5: [
            { label: '換気する', text: 'HPを10回復する', result: '空気が入れ替わり、むせ返る匂いが消えた。', effect: { kind: 'heal', amount: 10 } },
            { label: '残った試料を調べる', text: 'ポーションを得る', result: '安全な分だけ小瓶に分けた。', effect: { kind: 'potion', potionId: 'STRENGTH_POTION' } },
            { label: '記録を残す', text: 'カードを1枚強化する', result: '事故の経過を整理し、使える知見に変えた。', effect: { kind: 'upgrade' } },
        ],
        6: [
            { label: '軽食を買う', text: 'HPを14回復する', result: '温かい軽食で空腹が落ち着いた。', effect: { kind: 'heal', amount: 14 } },
            { label: '栄養ドリンクを選ぶ', text: 'ポーションを得る', result: '棚から集中用の一本を選んだ。', effect: { kind: 'potion', potionId: 'ENERGY_POTION' } },
            { label: 'ポイントを使う', text: '30Gを得る', result: '貯まっていたポイントを換金した。', effect: { kind: 'gold', amount: 30 } },
        ],
        7: [
            { label: '資料を分類する', text: 'カードを1枚強化する', result: '山積みの資料を整理し、判断も速くなった。', effect: { kind: 'upgrade' } },
            { label: '予算案を読む', text: '40Gを得る', result: '無駄を一つ見つけ、協力費を受け取った。', effect: { kind: 'gold', amount: 40 } },
            { label: '会議の空気を整える', text: '最大HP+2', result: '面倒な場をさばいて、少し肝が据わった。', effect: { kind: 'maxHp', amount: 2 } },
        ],
        8: [
            { label: '雨宿りする', text: 'HPを10回復する', result: '雨脚が弱まるまで休んだ。', effect: { kind: 'heal', amount: 10 } },
            { label: '雨音を聞く', text: '小さな成果を得る', result: '単調な雨音で思考が整った。', effect: { kind: 'momentum' } },
            { label: '傘立てを整える', text: '25Gを得る', result: '落とし主から礼を受け取った。', effect: { kind: 'gold', amount: 25 } },
        ],
        9: [
            { label: 'ノートを整える', text: 'カードを1枚強化する', result: '机に向かうと、今日の学びが一本につながった。', effect: { kind: 'upgrade' } },
            { label: '窓を開ける', text: 'HPを10回復する', result: '夕方の風で、教室の空気が入れ替わった。', effect: { kind: 'heal', amount: 10 } },
            { label: '明日の準備をする', text: '小さな成果を得る', result: '先に段取りを済ませると、気持ちに余白ができた。', effect: { kind: 'momentum' } },
        ],
        10: [
            { label: '譜面を整える', text: 'カードを1枚強化する', result: 'ばらけた譜面を並べると、手順の癖も見えた。', effect: { kind: 'upgrade' } },
            { label: '一曲だけ弾く', text: '恒久ムキムキ+1', result: '指が温まり、気持ちも前へ出た。', effect: { kind: 'strength', amount: 1 } },
            { label: '静けさを味わう', text: 'HPを12回復する', result: '余韻の中で疲れがほどけた。', effect: { kind: 'heal', amount: 12 } },
        ],
        11: [
            { label: '忘れ物を届ける', text: '35Gを得る', result: '持ち主に届け、礼を受け取った。', effect: { kind: 'gold', amount: 35 } },
            { label: '軽くストレッチする', text: '最大HP+2', result: '固まっていた体がほぐれた。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '備品を整える', text: '小さな成果を得る', result: '誰も見ていない片付けが、妙に気分を整えた。', effect: { kind: 'momentum' } },
        ],
        12: [
            { label: '読みかけの本を開く', text: 'スキルカードを1枚得る', result: '一節が思わぬ発想をくれた。', effect: { kind: 'skillCard' } },
            { label: '調べ物を進める', text: 'カードを1枚強化する', result: '必要なページに辿り着いた。', effect: { kind: 'upgrade' } },
            { label: '灯りを消して帰る', text: 'HPを8回復する', result: '区切りをつけると、気持ちが軽くなった。', effect: { kind: 'heal', amount: 8 } },
        ],
        13: [
            { label: 'サドルを拭く', text: '25Gを得る', result: '困っていた生徒を手伝い、礼を受け取った。', effect: { kind: 'gold', amount: 25 } },
            { label: '雨粒を払う', text: 'HPを10回復する', result: '冷たい空気で頭がすっきりした。', effect: { kind: 'heal', amount: 10 } },
            { label: '帰り道を考える', text: '小さな成果を得る', result: '濡れた道を見ながら、次の動きが自然に整理できた。', effect: { kind: 'momentum' } },
        ],
        14: [
            { label: '少し横になる', text: 'HPを16回復する', result: '短く休んで、だいぶ持ち直した。', effect: { kind: 'heal', amount: 16 } },
            { label: '薬箱を整理する', text: 'ポーションを得る', result: '使える備品を一つ分けてもらった。', effect: { kind: 'potion', potionId: 'BLOCK_POTION' } },
            { label: '体調メモを書く', text: '最大HP+2', result: '自分の限界を把握し、無理の線引きが上手くなった。', effect: { kind: 'maxHp', amount: 2 } },
        ],
        15: [
            { label: '色を足す', text: '恒久ムキムキ+1', result: '一筆入れる覚悟が、そのまま力になった。', effect: { kind: 'strength', amount: 1 } },
            { label: '道具を洗う', text: '25Gを得る', result: '丁寧な片付けを見込まれ、材料費の残りを託された。', effect: { kind: 'gold', amount: 25 } },
            { label: 'しばらく眺める', text: '小さな成果を得る', result: '未完成の絵を見ていると、自分の次の手も浮かんだ。', effect: { kind: 'momentum' } },
        ],
        16: [
            { label: '靴を並べ直す', text: '25Gを得る', result: '落とし物の持ち主から礼を受けた。', effect: { kind: 'gold', amount: 25 } },
            { label: '風に当たる', text: 'HPを10回復する', result: '涼しい風で熱が引いた。', effect: { kind: 'heal', amount: 10 } },
            { label: '明日の予定を確認する', text: 'カードを1枚強化する', result: '明日の段取りが見え、動きが洗練された。', effect: { kind: 'upgrade' } },
        ],
        17: [
            { label: 'ベンチで待つ', text: 'HPを12回復する', result: '夜風に当たりながら、電車を待った。', effect: { kind: 'heal', amount: 12 } },
            { label: '時刻表を確認する', text: '40Gを得る', result: '乗り継ぎを見直し、余った交通費が残った。', effect: { kind: 'gold', amount: 40 } },
            { label: '考えをまとめる', text: '小さな成果を得る', result: 'ホームの静けさで、次にやることが整理できた。', effect: { kind: 'momentum' } },
        ],
        18: [
            { label: '写真を撮る', text: 'HPを10回復する', result: '春の景色を残すと、肩の力が抜けた。', effect: { kind: 'heal', amount: 10 } },
            { label: '式次第を確認する', text: 'カードを1枚強化する', result: '最初の段取りを把握し、動きが整った。', effect: { kind: 'upgrade' } },
            { label: '新入生を案内する', text: '25Gを得る', result: '迷っていた後輩を助け、礼を受けた。', effect: { kind: 'gold', amount: 25 } },
        ],
        19: [
            { label: '話を聞いて回る', text: 'スキルカードを1枚得る', result: 'いくつもの勧誘を聞き、新しい要領を覚えた。', effect: { kind: 'skillCard' } },
            { label: 'チラシ配りを手伝う', text: '35Gを得る', result: '先輩に手際を買われ、差し入れ代をもらった。', effect: { kind: 'gold', amount: 35 } },
            { label: '少し距離を置く', text: '小さな成果を得る', result: '喧騒を眺めるうち、自分に合う場所が見えてきた。', effect: { kind: 'momentum' } },
        ],
        20: [
            { label: '前列を引く', text: '最大HP+2', result: '逃げ場のない席を引き、腹が据わった。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '友人と笑う', text: 'HPを8回復する', result: 'どの席でも何とかなる気がしてきた。', effect: { kind: 'heal', amount: 8 } },
            { label: '席表を書き直す', text: 'カードを1枚強化する', result: '配置を整理しながら、自分の手も整えた。', effect: { kind: 'upgrade' } },
        ],
        21: [
            { label: '弁当を分ける', text: 'HPを14回復する', result: '笑いながら食べる昼食は、思った以上に効いた。', effect: { kind: 'heal', amount: 14 } },
            { label: '進路の話をする', text: '小さな成果を得る', result: '他人の言葉で、自分の考えも少し輪郭を持った。', effect: { kind: 'momentum' } },
            { label: '昼休みに復習する', text: 'カードを1枚強化する', result: '短い時間をうまく使えた。', effect: { kind: 'upgrade' } },
        ],
        22: [
            { label: '傘に入る', text: 'HPを10回復する', result: '雨を避けるだけで、気持ちまで少し軽くなった。', effect: { kind: 'heal', amount: 10 } },
            { label: '予備の傘を貸す', text: '25Gを得る', result: '翌日、丁寧なお礼が返ってきた。', effect: { kind: 'gold', amount: 25 } },
            { label: '雨脚を読む', text: '小さな成果を得る', result: '待つべき時を見極める感覚が磨かれた。', effect: { kind: 'momentum' } },
        ],
        23: [
            { label: '添削を読み込む', text: 'カードを1枚強化する', result: '赤字の意図がつながり、理解が深まった。', effect: { kind: 'upgrade' } },
            { label: '質問する', text: 'スキルカードを1枚得る', result: '一歩踏み込んだ問いで、新しい視点を得た。', effect: { kind: 'skillCard' } },
            { label: '礼を言う', text: '最大HP+2', result: '素直に受け取る強さが少し身についた。', effect: { kind: 'maxHp', amount: 2 } },
        ],
        24: [
            { label: '議事録を取る', text: 'カードを1枚強化する', result: '話の流れを追ううち、判断が速くなった。', effect: { kind: 'upgrade' } },
            { label: '予算を確認する', text: '40Gを得る', result: '余剰費を見つけ、協力分を受け取った。', effect: { kind: 'gold', amount: 40 } },
            { label: '意見を出す', text: '恒久ムキムキ+1', result: '場に声を置いたことで、少し前へ出られた。', effect: { kind: 'strength', amount: 1 } },
        ],
        25: [
            { label: '丁寧に掃く', text: 'HPを10回復する', result: '単調な動きで呼吸が整った。', effect: { kind: 'heal', amount: 10 } },
            { label: '落ち葉を集める', text: '25Gを得る', result: '作業を見ていた教師から差し入れ代をもらった。', effect: { kind: 'gold', amount: 25 } },
            { label: '季節を惜しむ', text: '小さな成果を得る', result: '終わるものを見送る余裕ができた。', effect: { kind: 'momentum' } },
        ],
        26: [
            { label: '差出人を探す', text: 'スキルカードを1枚得る', result: '手がかりを追ううち、観察眼が冴えた。', effect: { kind: 'skillCard' } },
            { label: '返事を書く', text: 'カードを1枚強化する', result: '言葉を選ぶ中で、自分の考えも研ぎ澄まされた。', effect: { kind: 'upgrade' } },
            { label: 'そっと戻す', text: 'HPを8回復する', result: '踏み込みすぎない選択に、心が少し静まった。', effect: { kind: 'heal', amount: 8 } },
        ],
        27: [
            { label: '全力で走る', text: '恒久ムキムキ+1', result: '最後まで脚を緩めず、体に芯が通った。', effect: { kind: 'strength', amount: 1 } },
            { label: '応援に回る', text: 'HPを10回復する', result: '声を出しているうちに、気分まで晴れた。', effect: { kind: 'heal', amount: 10 } },
            { label: 'バトンを磨く', text: 'カードを1枚強化する', result: '受け渡しを見直し、手順が洗練された。', effect: { kind: 'upgrade' } },
        ],
        28: [
            { label: '氷を削る', text: '25Gを得る', result: '手際の良さを見込まれ、売上の一部を任された。', effect: { kind: 'gold', amount: 25 } },
            { label: '味見する', text: 'HPを12回復する', result: '冷たさで一気に生き返った。', effect: { kind: 'heal', amount: 12 } },
            { label: '段取りを組む', text: '小さな成果を得る', result: '混雑を想像して、先回りの感覚を得た。', effect: { kind: 'momentum' } },
        ],
        29: [
            { label: '教え合う', text: 'スキルカードを1枚得る', result: '説明することで、自分の理解も深まった。', effect: { kind: 'skillCard' } },
            { label: '要点をまとめる', text: 'カードを1枚強化する', result: '散らばった知識が、使える形にまとまった。', effect: { kind: 'upgrade' } },
            { label: '休憩を促す', text: 'HPを10回復する', result: '全員で一息つき、集中力が戻った。', effect: { kind: 'heal', amount: 10 } },
        ],
        30: [
            { label: '風を入れる', text: 'HPを10回復する', result: '熱気が抜け、頭の中まで少し涼しくなった。', effect: { kind: 'heal', amount: 10 } },
            { label: '夏の句を考える', text: '小さな成果を得る', result: '音を言葉にするうち、思考が整った。', effect: { kind: 'momentum' } },
            { label: '短く復習する', text: 'カードを1枚強化する', result: 'だるさの中でも、一歩だけ進めた。', effect: { kind: 'upgrade' } },
        ],
        31: [
            { label: '水分を取る', text: 'HPを14回復する', result: '冷たい水が体の奥まで染みた。', effect: { kind: 'heal', amount: 14 } },
            { label: 'フォームを見直す', text: 'カードを1枚強化する', result: '無駄な動きが一つ減った。', effect: { kind: 'upgrade' } },
            { label: '後輩に教える', text: '最大HP+2', result: '人に伝えることで、自信も少し増した。', effect: { kind: 'maxHp', amount: 2 } },
        ],
        32: [
            { label: '最後まで見る', text: 'HPを12回復する', result: '夜空の光を見上げ、心がゆるんだ。', effect: { kind: 'heal', amount: 12 } },
            { label: '写真を撮る', text: '25Gを得る', result: '良い一枚が撮れ、後で譲って礼を受けた。', effect: { kind: 'gold', amount: 25 } },
            { label: '願いを決める', text: '小さな成果を得る', result: '言葉にしない目標が、少しだけ固まった。', effect: { kind: 'momentum' } },
        ],
        33: [
            { label: '譜面を読む', text: 'カードを1枚強化する', result: '全体の流れが見え、手も迷わなくなった。', effect: { kind: 'upgrade' } },
            { label: '合奏に混ざる', text: '恒久ムキムキ+1', result: '音を合わせる緊張で、背筋が伸びた。', effect: { kind: 'strength', amount: 1 } },
            { label: '片付けを手伝う', text: '25Gを得る', result: '顧問から差し入れ代を預かった。', effect: { kind: 'gold', amount: 25 } },
        ],
        34: [
            { label: '冷たい飲み物を買う', text: 'HPを12回復する', result: '喉が潤い、夕方の疲れが抜けた。', effect: { kind: 'heal', amount: 12 } },
            { label: '新商品を試す', text: 'ポーションを得る', result: '妙に効きそうな一本を見つけた。', effect: { kind: 'potion', potionId: 'ENERGY_POTION' } },
            { label: '寄り道の相談をする', text: '小さな成果を得る', result: '雑談の中で、次の予定が自然に決まった。', effect: { kind: 'momentum' } },
        ],
        35: [
            { label: '雨宿りする', text: 'HPを10回復する', result: '雨音を聞いているうち、焦りが薄れた。', effect: { kind: 'heal', amount: 10 } },
            { label: '自転車を拭く', text: '25Gを得る', result: '困っていた生徒に感謝された。', effect: { kind: 'gold', amount: 25 } },
            { label: '空模様を読む', text: '小さな成果を得る', result: '待つべき時を見極める感覚が少し冴えた。', effect: { kind: 'momentum' } },
        ],
        36: [
            { label: '大道具を組む', text: '恒久ムキムキ+1', result: '重い板を運び切り、腕に自信がついた。', effect: { kind: 'strength', amount: 1 } },
            { label: '設計を見直す', text: 'カードを1枚強化する', result: '導線を整えると、手順もすっきりした。', effect: { kind: 'upgrade' } },
            { label: '演出を考える', text: '小さな成果を得る', result: '驚かせ方を考えるうち、発想が広がった。', effect: { kind: 'momentum' } },
        ],
        37: [
            { label: '色を拾う', text: 'カードを1枚強化する', result: '葉の色を見比べ、観察が深まった。', effect: { kind: 'upgrade' } },
            { label: '静かに描く', text: 'HPを10回復する', result: '手を動かす時間で、心が落ち着いた。', effect: { kind: 'heal', amount: 10 } },
            { label: '友人の絵を見る', text: '小さな成果を得る', result: '別の見方に触れ、自分の視界も広がった。', effect: { kind: 'momentum' } },
        ],
        38: [
            { label: '志望を話す', text: '最大HP+2', result: '口に出したぶん、覚悟が少し固まった。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '資料を読む', text: 'カードを1枚強化する', result: '必要な条件が整理できた。', effect: { kind: 'upgrade' } },
            { label: '別案も聞く', text: 'スキルカードを1枚得る', result: '思いがけない選択肢を知った。', effect: { kind: 'skillCard' } },
        ],
        39: [
            { label: '荷物を運ぶ', text: '恒久ムキムキ+1', result: '重い鞄を手伝い、足腰に力が入った。', effect: { kind: 'strength', amount: 1 } },
            { label: 'しおりを確認する', text: 'カードを1枚強化する', result: '行程を頭に入れ、動きが滑らかになった。', effect: { kind: 'upgrade' } },
            { label: '売店を見る', text: '25Gを得る', result: '余った小銭をうまくやりくりできた。', effect: { kind: 'gold', amount: 25 } },
        ],
        40: [
            { label: '素振りを続ける', text: '恒久ムキムキ+1', result: '夕日が沈むまで、振りを崩さなかった。', effect: { kind: 'strength', amount: 1 } },
            { label: '球拾いを手伝う', text: '25Gを得る', result: '監督から飲み物代を渡された。', effect: { kind: 'gold', amount: 25 } },
            { label: 'フォームを観察する', text: 'カードを1枚強化する', result: '良い動きを盗み、自分の手札にも活かした。', effect: { kind: 'upgrade' } },
        ],
        41: [
            { label: '味見をする', text: 'HPを12回復する', result: '焼きたての甘さで元気が戻った。', effect: { kind: 'heal', amount: 12 } },
            { label: '分量を量る', text: 'カードを1枚強化する', result: '正確さを意識し、手順が安定した。', effect: { kind: 'upgrade' } },
            { label: '余りを売る', text: '35Gを得る', result: '好評で、材料費以上の売上になった。', effect: { kind: 'gold', amount: 35 } },
        ],
        42: [
            { label: '質問を受ける', text: '最大HP+2', result: '自分の考えを言葉にし、少し肝が据わった。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '記事を読む', text: 'スキルカードを1枚得る', result: '人の見方を知り、新しい切り口を得た。', effect: { kind: 'skillCard' } },
            { label: '写真を手伝う', text: '25Gを得る', result: '撮影補助のお礼をもらった。', effect: { kind: 'gold', amount: 25 } },
        ],
        43: [
            { label: '話を聞く', text: 'HPを10回復する', result: '友人の声で、胸のつかえが少しほどけた。', effect: { kind: 'heal', amount: 10 } },
            { label: '相談に乗る', text: '小さな成果を得る', result: '相手の考えを整理するうち、自分も整った。', effect: { kind: 'momentum' } },
            { label: '写真を撮る', text: '25Gを得る', result: '良い一枚を渡し、あとで礼を受けた。', effect: { kind: 'gold', amount: 25 } },
        ],
        44: [
            { label: '結果を読む', text: 'カードを1枚強化する', result: '数字を受け止め、次の課題が見えた。', effect: { kind: 'upgrade' } },
            { label: '友人を励ます', text: 'HPを10回復する', result: '声をかけるうち、自分も少し前向きになった。', effect: { kind: 'heal', amount: 10 } },
            { label: '次を決める', text: '最大HP+2', result: '落ち込む前に動くと、芯が少し太くなった。', effect: { kind: 'maxHp', amount: 2 } },
        ],
        45: [
            { label: '雪を踏みしめる', text: 'HPを10回復する', result: '静かな朝の冷気で、気分が澄んだ。', effect: { kind: 'heal', amount: 10 } },
            { label: '早めに登校する', text: 'カードを1枚強化する', result: '余裕を持てたぶん、準備も丁寧になった。', effect: { kind: 'upgrade' } },
            { label: '転びそうな後輩を支える', text: '25Gを得る', result: 'あとで温かい飲み物をおごってもらった。', effect: { kind: 'gold', amount: 25 } },
        ],
        46: [
            { label: '手を温める', text: 'HPを12回復する', result: '冷えた指が戻り、体も楽になった。', effect: { kind: 'heal', amount: 12 } },
            { label: '朝学習を始める', text: 'カードを1枚強化する', result: '静かな時間をうまく使えた。', effect: { kind: 'upgrade' } },
            { label: '友人を呼ぶ', text: '小さな成果を得る', result: '集まる空気の中で、少し元気が戻った。', effect: { kind: 'momentum' } },
        ],
        47: [
            { label: '募金を呼びかける', text: '最大HP+2', result: '声を張るうち、人前に立つ強さがついた。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '品物を並べる', text: '35Gを得る', result: '売上が伸び、運営から礼を受けた。', effect: { kind: 'gold', amount: 35 } },
            { label: '飾りを直す', text: '小さな成果を得る', result: '細部を整える感覚が、次にも活きそうだ。', effect: { kind: 'momentum' } },
        ],
        48: [
            { label: '願いを書く', text: 'カードを1枚強化する', result: '目標を文字にすると、手が少し迷わなくなった。', effect: { kind: 'upgrade' } },
            { label: '甘酒を飲む', text: 'HPを12回復する', result: '温かさが体に広がった。', effect: { kind: 'heal', amount: 12 } },
            { label: 'おみくじを引く', text: 'ポーションを得る', result: '妙に縁起の良い小瓶を授かった。', effect: { kind: 'potion', potionId: 'STRENGTH_POTION' } },
        ],
        49: [
            { label: '弱点を確認する', text: 'カードを1枚強化する', result: '避けていた問題に、ようやく名前をつけられた。', effect: { kind: 'upgrade' } },
            { label: '計画を立てる', text: '小さな成果を得る', result: '焦りが予定に変わり、少し呼吸が楽になった。', effect: { kind: 'momentum' } },
            { label: '助言を受ける', text: 'スキルカードを1枚得る', result: '次に使える具体策を持ち帰った。', effect: { kind: 'skillCard' } },
        ],
        50: [
            { label: '受け取る', text: 'HPを10回復する', result: '照れくささごと、甘さが疲れをほどいた。', effect: { kind: 'heal', amount: 10 } },
            { label: 'お返しを考える', text: '小さな成果を得る', result: '相手のことを考える時間が、少し自分を整えた。', effect: { kind: 'momentum' } },
            { label: '箱をしまう', text: '25Gを得る', result: '落とし物を届けた礼が、思わぬ形で返ってきた。', effect: { kind: 'gold', amount: 25 } },
        ],
        51: [
            { label: '花束を受け取る', text: 'HPを14回復する', result: '積み重ねを思い出し、胸が少し温かくなった。', effect: { kind: 'heal', amount: 14 } },
            { label: '後輩に言葉を残す', text: '最大HP+2', result: '伝える側に立つと、背筋が自然に伸びた。', effect: { kind: 'maxHp', amount: 2 } },
            { label: '写真に写る', text: '35Gを得る', result: '記念写真の手伝いで、後から礼を受けた。', effect: { kind: 'gold', amount: 35 } },
        ],
        52: [
            { label: '机をなでる', text: 'HPを12回復する', result: '静けさの中で、ようやく一息つけた。', effect: { kind: 'heal', amount: 12 } },
            { label: '黒板を消す', text: 'カードを1枚強化する', result: '最後を整えると、次へ進む準備もできた。', effect: { kind: 'upgrade' } },
            { label: '教室を見渡す', text: '小さな成果を得る', result: '終わった時間を受け止め、前を向けた。', effect: { kind: 'momentum' } },
        ],
        53: [
            { label: '問題を解き切る', text: 'カードを1枚強化する', result: '眠気の向こうで、一問だけ確かな手応えを得た。', effect: { kind: 'upgrade' } },
            { label: 'ドリンクを足す', text: 'HPを12回復する', result: '温かい飲み物で、もう少しだけ粘れそうだ。', effect: { kind: 'heal', amount: 12 } },
            { label: '互いに教える', text: 'スキルカードを1枚得る', result: '友人の説明から、新しい見方を拾った。', effect: { kind: 'skillCard' } },
        ],
    };

    const buildGenericHighSchoolChoices = (theme: ThemedEventTheme): Array<{ label: string; text: string; result: string; effect: HighSchoolEffect }> => {
        const rewards: HighSchoolEffect[] = [
            { kind: 'momentum' },
            { kind: 'heal', amount: 10 },
            { kind: 'gold', amount: 25 },
            { kind: 'upgrade' },
            { kind: 'maxHp', amount: 2 },
            { kind: 'skillCard' },
        ];
        const rewardText = (effect: HighSchoolEffect): string => {
            switch (effect.kind) {
                case 'heal': return `HPを${effect.amount}回復する`;
                case 'gold': return `${effect.amount}Gを得る`;
                case 'upgrade': return 'カードを1枚強化する';
                case 'maxHp': return `最大HP+${effect.amount}`;
                case 'skillCard': return 'スキルカードを1枚得る';
                default: return '小さな成果を得る';
            }
        };
        const first = getStableTextIndex(`${theme.title}:first`, rewards.length);
        const second = getStableTextIndex(`${theme.title}:second`, rewards.length);
        const third = getStableTextIndex(`${theme.title}:third`, rewards.length);
        return [
            {
                label: '首を突っ込む',
                text: rewardText(rewards[first]),
                result: `${theme.title}に踏み込むと、思ったより大きな手応えが残った。`,
                effect: rewards[first],
            },
            {
                label: '友人と動く',
                text: rewardText(rewards[second]),
                result: `${theme.title}を友人と切り抜け、笑い話にできるくらいには前へ進んだ。`,
                effect: rewards[second],
            },
            {
                label: '少し距離を置く',
                text: rewardText(rewards[third]),
                result: `${theme.title}から一歩引いて眺めると、見落としていたものに気づいた。`,
                effect: rewards[third],
            },
        ];
    };

    const applyHighSchoolEffect = (themeTitle: string, choice: { result: string; effect: HighSchoolEffect }) => {
        switch (choice.effect.kind) {
            case 'gold':
                setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + choice.effect.amount } }));
                setEventResultLog(trans(`${choice.result}\n${choice.effect.amount}Gを得た。`, languageMode));
                return;
            case 'heal':
                setGameState(prev => ({ ...prev, player: healPlayer(prev.player, choice.effect.amount) }));
                setEventResultLog(trans(`${choice.result}\nHPが${choice.effect.amount}回復した。`, languageMode));
                return;
            case 'maxHp':
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        maxHp: prev.player.maxHp + choice.effect.amount,
                        currentHp: prev.player.currentHp + choice.effect.amount,
                    }
                }));
                setEventResultLog(trans(`${choice.result}\n最大HP+${choice.effect.amount}。`, languageMode));
                return;
            case 'strength':
                setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, choice.effect.amount) }));
                setEventResultLog(trans(`${choice.result}\n恒久ムキムキ+${choice.effect.amount}。`, languageMode));
                return;
            case 'upgrade': {
                let upgradedName = '';
                setGameState(prev => {
                    const upgradeable = prev.player.deck.filter(card => !card.upgraded);
                    if (upgradeable.length === 0) return prev;
                    const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                    upgradedName = target.name;
                    return {
                        ...prev,
                        player: {
                            ...prev.player,
                            deck: prev.player.deck.map(card => card.id === target.id ? getUpgradedCard(card) : card),
                        }
                    };
                });
                setTimeout(() => {
                    if (upgradedName) {
                        setEventResultLog(trans(`${choice.result}\n「${upgradedName}」が強化された。`, languageMode));
                    } else {
                        resolveMomentum(themeTitle, choice.result, true);
                    }
                }, 50);
                return;
            }
            case 'skillCard': {
                const pool = Object.values(CARDS_LIBRARY).filter(card => card.type === CardType.SKILL && isCardAvailable(card, unlockedCardNames));
                const card = pool[Math.floor(Math.random() * pool.length)];
                setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...card, id: `hs-card-${Date.now()}` } as Card) }));
                setEventResultLog(trans(`${choice.result}\n「${card.name}」を得た。`, languageMode));
                return;
            }
            case 'potion': {
                const potion = { ...POTION_LIBRARY[choice.effect.potionId], id: `hs-pot-${Date.now()}` };
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        potions: [...prev.player.potions, potion].slice(0, getPotionCapacity(prev.player)),
                    }
                }));
                setEventResultLog(trans(`${choice.result}\n「${potion.name}」を得た。`, languageMode));
                return;
            }
            case 'momentum':
                resolveMomentum(themeTitle, choice.result);
        }
    };

    const buildThemedEvent = (theme: ThemedEventTheme, themeId: VisualThemeId): GameEvent => {
        const choices = highSchoolChoices[theme.imageIndex] ?? buildGenericHighSchoolChoices(theme);
        return {
            title: theme.title,
            description: theme.description,
            imageKey: `${themeId}-event-${theme.imageIndex}`,
            options: choices.map(choice => ({
                label: choice.label,
                text: choice.text,
                action: () => applyHighSchoolEffect(theme.title, choice),
            })),
        };
    };

    const supporterText = (japanese: string, english: string) => languageMode === 'ENGLISH' ? english : japanese;

    const applySupporterReward = (profile: SupporterNpcEventProfile, question: SupporterNpcQuestion, correct: boolean, quickQuizProgress?: number) => {
        const npcName = languageMode === 'ENGLISH' ? profile.npcNameEnglish : profile.npcName;
        const questionResultText = profile.id === 'tsukapon'
            ? correct
                ? supporterText('つかぽんの説明を読み取れた！', 'You understood Tsukapon\'s explanation!')
                : supporterText('つかぽんの説明を読み取れなかった。', 'You could not work out Tsukapon\'s explanation.')
            : correct
                ? supporterText(question.explanation, `${npcName} nods approvingly.`)
                : supporterText(question.explanation, `${npcName} shares a helpful note for next time.`);
        if (!correct) {
            setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 8 } }));
            setEventResultLog(supporterText(
                `${questionResultText}\n惜しい。${profile.npcName}から参加賞として8Gを受け取った。`,
                `${questionResultText}\nNot quite. ${npcName} gives you 8G as a participation prize.`
            ));
            return;
        }

        const tsukaponSpeedBonus = profile.id !== 'tsukapon'
            ? 0
            : (quickQuizProgress ?? 1) <= 0.35
                ? 50
                : (quickQuizProgress ?? 1) <= 0.7
                    ? 25
                    : 0;
        if (tsukaponSpeedBonus > 0) {
            setGameState(prev => ({
                ...prev,
                player: { ...prev.player, gold: prev.player.gold + tsukaponSpeedBonus }
            }));
        }
        const speedBonusMessage = tsukaponSpeedBonus === 50
            ? supporterText('\n先読み成功！早押し報酬として50Gを得た。', '\nYou read ahead and earned a 50G quick-answer bonus!')
            : tsukaponSpeedBonus === 25
                ? supporterText('\nひらめき成功！早押し報酬として25Gを得た。', '\nQuick thinking earned you a 25G quick-answer bonus!')
                : '';
        const resultPrefix = `${questionResultText}\n${supporterText('正解！', 'Correct!')}${speedBonusMessage}`;
        const applyFallbackUpgrade = (fallbackMessage: string, fallbackMessageEnglish: string) => {
            let upgradedName = '';
            setGameState(prev => {
                const upgradeable = prev.player.deck.filter(card => !card.upgraded);
                if (upgradeable.length === 0) return prev;
                const target = upgradeable[getStableTextIndex(`${profile.id}:${question.question}:upgrade`, upgradeable.length)];
                upgradedName = target.name;
                return {
                    ...prev,
                    player: {
                        ...prev.player,
                        deck: prev.player.deck.map(card => card.id === target.id ? getUpgradedCard(card) : card),
                    }
                };
            });
            window.setTimeout(() => {
                setEventResultLog(upgradedName
                    ? supporterText(`${resultPrefix}\n「${upgradedName}」が強化された。`, `${resultPrefix}\n${trans(upgradedName, languageMode)} was upgraded.`)
                    : supporterText(`${resultPrefix}\n${fallbackMessage}`, `${resultPrefix}\n${fallbackMessageEnglish}`));
            }, 50);
        };

        switch (profile.reward as SupporterNpcReward) {
            case 'synthesis':
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        turnFlags: {
                            ...prev.player.turnFlags,
                            EVENT_SYNTHESIS_PENDING_MODAL: true,
                        },
                    },
                }));
                setEventResultLog(supporterText(`${resultPrefix}\nつかぽんがカード合成の準備を始めた。デッキから2枚選んで合成できる。`, `${resultPrefix}\nTsukapon prepares a card synthesis. Choose two cards from your deck to combine.`));
                return;
            case 'upgrade':
                setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, EVENT_NPC_UPGRADE_PENDING_MODAL: true } } }));
                setEventResultLog(supporterText(`${resultPrefix}\nあかめが強化するカードを選ぶよう促した。`, `${resultPrefix}\nAkame asks you to choose a card to upgrade.`));
                return;
            case 'rareCard':
            case 'chaos': {
                const pool = Object.values(CARDS_LIBRARY).filter(card => card.rarity === 'RARE' && isCardAvailable(card, unlockedCardNames));
                const card = pool[getStableTextIndex(`${profile.id}:${question.question}:rare`, Math.max(1, pool.length))];
                if (!card) {
                    applyFallbackUpgrade('レアカード候補が見つからなかった。', 'No rare card was available.');
                    return;
                }
                setGameState(prev => {
                    const player = addCardWithEventRelics(prev.player, { ...card, id: `supporter-rare-${Date.now()}` } as Card);
                    return {
                        ...prev,
                        player: profile.reward === 'chaos'
                            ? { ...player, turnFlags: { ...player.turnFlags, DODOME_CHAOS_NEXT_BATTLE: true } }
                            : player
                    };
                });
                setEventResultLog(profile.reward === 'chaos'
                    ? supporterText(`${resultPrefix}\nどどめから「${card.name}」を受け取った。次の戦闘では、ランダムなカード1枚が0コストになる。`, `${resultPrefix}\nDodome gives you ${trans(card.name, languageMode)}. One random card costs 0 for your next battle.`)
                    : supporterText(`${resultPrefix}\n${profile.npcName}から「${card.name}」を受け取った。`, `${resultPrefix}\n${npcName} gives you ${trans(card.name, languageMode)}.`));
                return;
            }
            case 'duplicate':
                setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, EVENT_NPC_DUPLICATE_PENDING_MODAL: true } } }));
                setEventResultLog(supporterText(`${resultPrefix}\n木田が倉庫から同じカードをもう1枚出せると言う。`, `${resultPrefix}\nKida offers to pull out one more copy from the warehouse.`));
                return;
            case 'heal':
                setGameState(prev => ({ ...prev, player: healPlayer(prev.player, 16) }));
                setEventResultLog(supporterText(`${resultPrefix}\n${profile.npcName}の助けでHPが16回復した。`, `${resultPrefix}\n${npcName}'s help restores 16 HP.`));
                return;
            case 'community':
                setGameState(prev => ({
                    ...prev,
                    player: {
                        ...prev.player,
                        gold: prev.player.gold + 30,
                        turnFlags: { ...prev.player.turnFlags, ICHI_NEXT_SHOP_DISCOUNT: true }
                    }
                }));
                setEventResultLog(supporterText(`${resultPrefix}\nいちの地域のつながりで30Gを得た。次回ショップの価格が20%下がる。`, `${resultPrefix}\nIchi's community connections earn you 30G. Your next shop prices are 20% lower.`));
                return;
            case 'nutrition':
                setGameState(prev => ({ ...prev, player: { ...healPlayer(prev.player, 10), maxHp: prev.player.maxHp + 2, currentHp: Math.min(prev.player.maxHp + 2, prev.player.currentHp + 12) } }));
                setEventResultLog(supporterText(`${resultPrefix}\n栄養チャージ！ 最大HPが2上がり、HPが10回復した。`, `${resultPrefix}\nNutrition charge! Max HP +2 and restore 10 HP.`));
                return;
            case 'ramenBoost':
                setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, TOSHI_RAMEN_BATTLE_BOOSTS: (prev.player.turnFlags['TOSHI_RAMEN_BATTLE_BOOSTS'] || 0) + 3 } } }));
                setEventResultLog(supporterText(`${resultPrefix}\nラーメンの気合で、次の3戦の開始時エナジーが1増える。`, `${resultPrefix}\nRamen spirit! Start your next 3 battles with 1 extra Energy.`));
                return;
            case 'fanFavorite':
                setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, EVENT_NPC_FAN_FAVORITE_PENDING_MODAL: true } } }));
                setEventResultLog(supporterText(`${resultPrefix}\n愛市が、みんなに人気のキラカードを3枚並べた。推しを1枚選ぼう。`, `${resultPrefix}\nAiichi lays out three popular holographic cards. Choose your favorite.`));
                return;
            case 'gold':
                setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 45 } }));
                setEventResultLog(supporterText(`${resultPrefix}\n協力の見返りとして45Gを得た。`, `${resultPrefix}\nYou earn 45G for working together.`));
                return;
            case 'maxHp':
                setGameState(prev => ({
                    ...prev,
                    player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 }
                }));
                setEventResultLog(supporterText(`${resultPrefix}\n心が少し強くなった。最大HP+2。`, `${resultPrefix}\nYou feel a little stronger. Max HP +2.`));
                return;
            case 'organize': {
                setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, EVENT_NPC_ORGANIZE_PENDING_MODAL: true } } }));
                setEventResultLog(supporterText(`${resultPrefix}\nかずこと話して心を整理するカードを選ぶ。`, `${resultPrefix}\nNagano Kazuko asks you to choose a card to make easier to use.`));
                return;
            }
            default:
                resolveMomentum(profile.title, supporterText(`${resultPrefix}\n小さな成果を得た。`, `${resultPrefix}\nYou make a small but meaningful gain.`));
        }
    };

    const buildSupporterNpcEvent = (profile: SupporterNpcEventProfile): GameEvent => {
        const questions = languageMode === 'ENGLISH' && profile.englishQuestions?.length
            ? profile.englishQuestions
            : profile.questions;
        const questionIndex = supporterQuestionIndex === undefined
            ? getStableTextIndex(`${profile.id}:${currentAct}:${currentFloor}:${preferredEventTitle ?? 'new'}`, questions.length)
            : supporterQuestionIndex % questions.length;
        const question = questions[questionIndex];
        const optionOrderSeed = supporterQuestionIndex === undefined
            ? `${currentAct}:${currentFloor}:${preferredEventTitle ?? 'new'}`
            : `debug:${supporterQuestionIndex}`;
        const order = getStableShuffledIndexes(question.options.length, `${profile.id}:${question.question}:options:${optionOrderSeed}`);
        const correctOptionPosition = order.findIndex(index => index === question.correctIndex);
        return {
            title: profile.title,
            description: languageMode === 'ENGLISH'
                ? `${profile.descriptionEnglish}\n\nQuestion: ${question.question}`
                : `${profile.description}\n\n問題: ${question.question}`,
            imageKey: `high-school-supporter-npc/${profile.imageFile}`,
            options: order.map((optionIndex, displayIndex) => ({
                label: `${displayIndex + 1}. ${question.options[optionIndex]}`,
                text: supporterText('この答えを選ぶ', 'Choose this answer'),
                isCorrect: optionIndex === question.correctIndex,
                action: (answerMeta?: EventAnswerMeta) => applySupporterReward(profile, question, displayIndex === correctOptionPosition, answerMeta?.quickQuizProgress),
            })),
        };
    };

    const preferredSupporterEvent = getSupporterNpcEventByTitle(preferredEventTitle);
    if (preferredSupporterEvent) {
        return buildSupporterNpcEvent(preferredSupporterEvent);
    }

    const preferredDodomedesuStage = DODOMEDESU_EVENT_STAGES.findIndex(stage => stage.title === preferredEventTitle);
    const dodomedesuStage = preferredDodomedesuStage >= 0
        ? preferredDodomedesuStage
        : Number(player.turnFlags[DODOMEDESU_EVENT_STAGE_FLAG] || 0);
    const shouldShowDodomedesuEvent = visualTheme === 'high-school'
        && isEndless
        && (preferredDodomedesuStage >= 0 || !player.turnFlags[DODOMEDESU_BOSS_READY_FLAG])
        && dodomedesuStage < DODOMEDESU_EVENT_STAGES.length
        && (preferredDodomedesuStage >= 0 || Math.random() < (dodomedesuStage > 0 ? 0.35 : 0.12));
    if (shouldShowDodomedesuEvent) {
        const stage = DODOMEDESU_EVENT_STAGES[dodomedesuStage];
        const advance = (result: string, reward: 'HEAL' | 'GOLD') => {
            setGameState(prev => ({
                ...prev,
                player: {
                    ...(reward === 'HEAL' ? healPlayer(prev.player, 8) : prev.player),
                    gold: prev.player.gold + (reward === 'GOLD' ? 20 : 0),
                    turnFlags: { ...prev.player.turnFlags, [DODOMEDESU_EVENT_STAGE_FLAG]: dodomedesuStage + 1 }
                }
            }));
            setEventResultLog(result);
        };
        return finalizeEvent({
            title: stage.title,
            description: stage.description,
            imageKey: `dodomedesu-event-${dodomedesuStage + 1}`,
            options: dodomedesuStage === 4 ? [
                {
                    label: '最後のゲームを受けて立つ',
                    text: 'この階層のボスがドドメデスとゲンゾーになる',
                    action: () => {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, [DODOMEDESU_EVENT_STAGE_FLAG]: 5, [DODOMEDESU_BOSS_READY_FLAG]: true } } }));
                        setEventResultLog('ゲンゾーが高らかに宣言し、ドドメデスが巨大な姿へ覚醒した。階層の最奥で決着をつける。');
                    }
                },
                {
                    label: 'どどめに呼びかける',
                    text: 'HPを12回復し、覚醒をいったん思いとどまらせる',
                    action: () => {
                        setGameState(prev => ({ ...prev, player: healPlayer(prev.player, 12) }));
                        setEventResultLog('どどめは一瞬だけ元の笑顔を取り戻した。だが、ゲンゾーはまだ諦めていない。HPが12回復した。');
                    }
                }
            ] : [
                { label: dodomedesuStage < 2 ? '一緒に遊ぶ' : '二人の話を聞く', text: 'HPを8回復して物語を進める', action: () => advance('二人との時間を過ごし、物語が次の段階へ進んだ。HPが8回復した。', 'HEAL') },
                { label: dodomedesuStage < 2 ? 'ゲンゾーに勝負を挑む' : '危険性を指摘する', text: '20Gを得て物語を進める', action: () => advance('議論の謝礼として20Gを受け取った。二人の関係はさらに強くなっていく。', 'GOLD') }
            ]
        });
    }

    if (
        visualTheme === 'high-school'
        && isEndless
        && (preferredEventTitle === 'あずきとの出会い' || (!player.turnFlags[AZUKI_ENCOUNTER_FLAG] && Math.random() < 0.12))
    ) {
        return finalizeEvent({
            title: 'あずきとの出会い',
            description: languageMode === 'ENGLISH'
                ? 'At the school gate, a buff-colored cocker spaniel looks up at you with warm eyes. Her tail sways as if asking you to walk together.'
                : '放課後の校門で、バフカラーのコッカースパニエルがこちらを見上げている。しっぽを揺らしながら、一緒に歩こうと誘っているようだ。',
            imageKey: 'あずきとの出会い',
            options: [
                {
                    label: languageMode === 'ENGLISH' ? 'Walk together' : '一緒に歩く',
                    text: languageMode === 'ENGLISH' ? 'Azuki will appear as this act\'s boss' : 'この階層のボスがあずきになる',
                    action: () => {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, turnFlags: { ...prev.player.turnFlags, [AZUKI_ENCOUNTER_FLAG]: true } } }));
                        setEventResultLog(languageMode === 'ENGLISH'
                            ? 'Azuki happily joins your walk. You sense a big reunion waiting at the end of this act.'
                            : 'あずきは嬉しそうに並んで歩き出した。この階層の終わりで、もう一度会える気がする。');
                    }
                },
                {
                    label: languageMode === 'ENGLISH' ? 'Give a gentle pat' : 'やさしくなでる',
                    text: languageMode === 'ENGLISH' ? 'Restore 10 HP' : 'HPを10回復',
                    action: () => {
                        setGameState(prev => ({ ...prev, player: healPlayer(prev.player, 10) }));
                        setEventResultLog(languageMode === 'ENGLISH' ? 'Azuki relaxes beside you. Restore 10 HP.' : 'あずきが寄り添ってくれた。HPが10回復した。');
                    }
                }
            ]
        });
    }

    if (visualTheme === 'high-school' && isEndless && HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.length > 0 && Math.random() < 0.55) {
        const profile = HIGH_SCHOOL_SUPPORTER_NPC_EVENTS[Math.floor(Math.random() * HIGH_SCHOOL_SUPPORTER_NPC_EVENTS.length)];
        return buildSupporterNpcEvent(profile);
    }

    const charType = getCharacterType(player);
    let potentialEvents: GameEvent[] = [];

    // --- COMMON EVENTS ---
    potentialEvents.push(
        {
            title: "怪しい薬売り",
            description: "路地裏で男が声をかけてきた。「とびきりの薬、あるよ」",
            options: [
                { label: "買う", text: "20Gを払って薬を買う", action: () => {
                    if (player.gold < 20) {
                        setEventResultLog(trans("お金が足りない…。", languageMode));
                        return;
                    }
                    const pots = Object.values(POTION_LIBRARY);
                    const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `pot-${Date.now()}` };
                    setGameState(prev => ({
                        ...prev,
                        player: {
                            ...prev.player,
                            gold: prev.player.gold - 20,
                            potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player))
                        }
                    }));
                    setEventResultLog(trans(`怪しい薬(ポーション: ${pot.name})を手に入れた！
残金: ${player.gold - 20}G`, languageMode));
                }},
                { label: "無視", text: "関わらず立ち去る", action: () => {
                    resolveMomentum("怪しい男を無視して先へ進んだ。", "怪しい男を無視して先へ進んだ。");
                }},
                { label: "通報する", text: "先生を呼んで摘発を試みる", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("摘発成功！謝礼と60G入手。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("証拠不十分だった。相手は逃げた。", "証拠不十分だった。相手は逃げた。");
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("逆恨みで反撃された！HP-8。", languageMode));
                    }
                }},
                { label: "弟子入り", text: "調合を学びたいと願い出る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const pot = { ...POTION_LIBRARY['STRENGTH_POTION'], id: `pot-str-${Date.now()}` };
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player)),
                                relicCounters: {
                                    ...prev.player.relicCounters,
                                    EVENT_STRENGTH_BONUS: (prev.player.relicCounters['EVENT_STRENGTH_BONUS'] || 0) + 1
                                }
                            }
                        }));
                        setEventResultLog(trans("才能を認められた！ムキムキ永続+1とプロテインを入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 }
                        }));
                        setEventResultLog(trans("調合のコツを掴み、最大HP+3。", languageMode));
                    } else {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `drug-regret-${Date.now()}` } as Card),
                                currentHp: Math.max(1, prev.player.currentHp - 10)
                            }
                        }));
                        setEventResultLog(trans("失敗。怪しい薬でHP-10、「後悔」を入手。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "踊り場の鏡",
            description: "大きな鏡がある。映っている自分と目が合った。",
            options: [
                { label: "覗き込む", text: "鏡の奥にある真実を探る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const target = player.deck[Math.floor(Math.random() * player.deck.length)];
                        if (target) {
                            setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...target, id: `copy-${Date.now()}` } as Card) }));
                            setEventResultLog(trans(`鏡の中から「${target.name}」の複製が現れた。`, languageMode));
                        } else {
                            resolveMomentum("鏡面に自分の呼吸だけが揺れ、次に活きる手応えが残った。", "鏡面に自分の呼吸だけが揺れ、次に活きる手応えが残った。");
                        }
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 35 } }));
                        setEventResultLog(trans("鏡の縁から小銭が落ちた。35G入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("視線を奪われてくらみが走る。HP-8。", languageMode));
                    }
                }},
                { label: "割る", text: "鏡を破壊して道を開く", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.INJURY, id: `curse-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("破片の痛みと引き換えに突破した。呪い「骨折」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("恐れを断ち切り、最大HP+2。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 12) } }));
                        setEventResultLog(trans("破片を浴びて重傷。HP-12。", languageMode));
                    }
                }},
                { label: "話しかける", text: "鏡の向こう側と交渉する", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("別の自分と折り合いがつき、ムキムキ永続+1。", languageMode));
                    } else if (roll < 0.67) {
                        const p = { ...POTION_LIBRARY['ENERGY_POTION'], id: `mirror-pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, p].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("交渉成立。エナジーポーションを入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `mirror-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("言葉が逆撫でして混乱。状態異常カードを追加。", languageMode));
                    }
                }},
                { label: "立ち去る", text: "この場は深追いしない", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("慎重な判断が吉と出た。HP+8。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("足音を殺して通り抜け、次に活きる手応えを胸にしまった。", "足音を殺して通り抜け、次に活きる手応えを胸にしまった。");
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 25) } }));
                        setEventResultLog(trans("退却中に財布を落とした。25G失う。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "呪われた書物",
            description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。",
            options: [
                { label: "読む", text: "禁書の力を受け入れる", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                        setEventResultLog(trans(`禁書と契約した。(HP-10)
レリック「${book.name}」を入手。`, languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("ページの間から古い紙幣を見つけた。50G入手。", languageMode));
                    } else {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `book-regret-${Date.now()}` } as Card),
                                currentHp: Math.max(1, prev.player.currentHp - 14)
                            }
                        }));
                        setEventResultLog(trans("呪いが逆流した！HP-14、呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "封印する", text: "本を閉じて安全を優先する", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("正しい判断だった。精神が安定しHP+12。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("静かに封印を終え、次に活きる手応えが指先に残った。", "静かに封印を終え、次に活きる手応えが指先に残った。");
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 30) } }));
                        setEventResultLog(trans("封印の儀式費用を請求された。30G失った。", languageMode));
                    }
                }},
                { label: "燃やす", text: "危険物として処分する", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("恐怖を乗り越え、ムキムキ永続+1。", languageMode));
                    } else if (roll < 0.67) {
                        const ptn = { ...POTION_LIBRARY['FIRE_POTION'], id: `book-fire-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, ptn].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("炎の残滃が瓶に宿った。火炎ポーションを入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 9) } }));
                        setEventResultLog(trans("燃え上がる呪炎に巻き込まれた。HP-9。", languageMode));
                    }
                }},
                { label: "写し取る", text: "危ない部分だけ抜き書きする", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const pool = Object.values(CARDS_LIBRARY).filter(c => c.rarity === 'RARE');
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...pick, id: `book-copy-${Date.now()}` } as Card) }));
                        setEventResultLog(trans(`禁書の知識を抜き出した。「${pick.name}」を入手。`, languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("知識が自信になった。最大HP+2。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `book-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("写本中に精神を削られた。状態異常カードを1枚追加。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "伝説の給食",
            description: "今日は揚げパンの日だ！しかし、最後に一つだけ余っている。\nクラスメートとジャンケンで勝負だ。",
            options: [
                { label: "正々堂々ジャンケン", text: "真っ向勝負で揚げパンを狙う", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } }));
                        setEventResultLog(trans("見事に勝利！伝説の揚げパンで最大HP+5。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 30 } }));
                        setEventResultLog(trans("惜敗したが、給食券を譲ってもらい30G入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("連敗でしょんぼり。精神的ダメージでHP-5。", languageMode));
                    }
                }},
                { label: "半分こを提案", text: "クラスメートと分け合って食べる", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("交渉成功！仲良く半分こしてHP+12。", languageMode));
                    } else if (roll < 0.67) {
                        const ptn = { ...POTION_LIBRARY['HEALTH_POTION'], id: `lunch-heal-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, ptn].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("分けてくれたお礼にデザートをもらった。HPポーション入手。", languageMode));
                    } else {
                        setEventResultLog(trans("提案は却下。気まずい空気になった。", languageMode));
                    }
                }},
                { label: "配膳を手伝う", text: "先生に協力して別報酬を狙う", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("働きぶりを認められ、ムキムキ永続+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("給食当番ポイントで50G相当の報酬を得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("重い食缶を運んで腰を痛めた。HP-6。", languageMode));
                    }
                }},
                { label: "きっぱり譲る", text: "今回は我慢して次に備える", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("潔さが評価され、最大HP+2。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("平和な昼休みの空気を吸い込み、次に活きる手応えを得た。", "平和な昼休みの空気を吸い込み、次に活きる手応えを得た。");
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 20) } }));
                        setEventResultLog(trans("ジュースをおごる流れになり20G失った。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "校庭の野良犬",
            description: "授業中、校庭に野良犬が迷い込んできた！\n首輪はなく、お腹を空かせているようだ。",
            options: [
                { label: "保護する", text: "水と飯を用意して見守る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                        setEventResultLog(trans("犬は安心して尻尾を振った。HP全回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 45 } }));
                        setEventResultLog(trans("首輪の落し物を見つけた。45G入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 9) } }));
                        setEventResultLog(trans("警戒されて噋まれた！HP-9。", languageMode));
                    }
                }},
                { label: "じっと観察", text: "距離を保って様子を見る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("落ち着きを学び、最大HP+3。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("眠る犬の寝息に合わせて肩の力が抜け、次に活きる手応えが残った。", "眠る犬の寝息に合わせて肩の力が抜け、次に活きる手応えが残った。");
                    } else {
                        const c = { ...CURSE_CARDS.DAZED, id: `dog-dazed-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, c as Card) }));
                        setEventResultLog(trans("緊張で手が震えた。状態異常カード追加。", languageMode));
                    }
                }},
                { label: "エサで手なづけ", text: "パンをみせて信頼を得る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const ptn = { ...POTION_LIBRARY['HEALTH_POTION'], id: `dog-heal-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, ptn].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("なついてきた。お礼の薬草でHPポーション入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 20) } }));
                        setEventResultLog(trans("パンを奪われた。給食費20G消費。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("近づきすぎてひっかかれた。HP-6。", languageMode));
                    }
                }},
                { label: "通報する", text: "見回り先生を呼ぶ", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("無事保護に成功。感謝の謝礼60G。", languageMode));
                    } else if (roll < 0.67) {
                        setEventResultLog(trans("連絡が遅れ、犬はどこかに去った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("待ち時間に足をひねった。HP-5。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "謎の転校生",
            description: "「ねえ、君のそのカード、僕のと交換しない？」\n見たことのないカードを持っている。",
            options: [
                { label: "交換に応じる", text: "カードを差し出して対価を受け取る", action: () => {
                    const keys = Object.keys(CARDS_LIBRARY).filter(k => {
                        const c = CARDS_LIBRARY[k];
                        return (c.rarity === 'UNCOMMON' || c.rarity === 'RARE') && isCardAvailable(c as Card, unlockedCardNames);
                    });
                    const fallbackKeys = Object.keys(CARDS_LIBRARY).filter(k => {
                        const c = CARDS_LIBRARY[k] as Card;
                        return c.type !== CardType.CURSE && c.type !== CardType.STATUS && c.rarity !== 'SPECIAL';
                    });
                    const tradePool = keys.length > 0 ? keys : fallbackKeys;
                    const selectedKey = tradePool[Math.floor(Math.random() * tradePool.length)];
                    const newCardTemplate = selectedKey ? CARDS_LIBRARY[selectedKey] : null;
                    if (!newCardTemplate) {
                        setEventResultLog(trans("転校生はカードを見せびらかしただけで、何も交換せず去っていった。", languageMode));
                        return;
                    }
                    const roll = Math.random();
                    let removedName = 'カード';
                    setGameState(prev => {
                        if (prev.player.deck.length === 0) {
                            return {
                                ...prev,
                                player: addCardWithEventRelics(prev.player, { ...newCardTemplate, id: `trade-gift-${Date.now()}` } as Card)
                            };
                        }
                        const removeIdx = Math.floor(Math.random() * prev.player.deck.length);
                        const removed = prev.player.deck[removeIdx];
                        removedName = removed?.name || removedName;
                        const newDeck = [...prev.player.deck];
                        let newMaxHp = prev.player.maxHp;
                        if (removed && (removed.name === '寄生虫' || removed.name === 'PARASITE')) newMaxHp -= 3;
                        if (removed) newDeck.splice(removeIdx, 1, { ...newCardTemplate, id: `trade-${Date.now()}` } as Card);
                        if (roll >= 0.67) newDeck.push({ ...CURSE_CARDS.DAZED, id: `transfer-dazed-${Date.now()}` });
                        return { ...prev, player: { ...prev.player, deck: newDeck, maxHp: newMaxHp, currentHp: Math.min(prev.player.currentHp, newMaxHp) } };
                    });
                    if (roll < 0.34) {
                        setEventResultLog(trans(`交換大成功！「${removedName}」を渡し「${newCardTemplate.name}」を入手。`, languageMode));
                    } else if (roll < 0.67) {
                        setEventResultLog(trans(`交換成立。「${newCardTemplate.name}」を受け取った。`, languageMode));
                    } else {
                        setEventResultLog(trans(`交換の代償で混乱した。状態異常カードも追加された。`, languageMode));
                    }
                }},
                { label: "断る", text: "リスクを避けて静観する", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("警戒した判断が当たった。HP+10。", languageMode));
                    } else if (roll < 0.67) {
                        resolveMomentum("転校生の背中を見送り、次に活きる手応えをポケットにしまった。", "転校生の背中を見送り、次に活きる手応えをポケットにしまった。");
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 30) } }));
                        setEventResultLog(trans("去り際に財布を抜かれた。30G失った。", languageMode));
                    }
                }},
                { label: "情報を聞き出す", text: "相手の目的を探る", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const ptn = { ...POTION_LIBRARY['ENERGY_POTION'], id: `transfer-info-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, ptn].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("有益な情報と引き換えにエナジーポーションを得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 45 } }));
                        setEventResultLog(trans("秘密を売ってくれた。45G相当の価値を得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 7) } }));
                        setEventResultLog(trans("はぐらかされて疲弊。HP-7。", languageMode));
                    }
                }},
                { label: "モノマネ対決", text: "転校生の口調を完コピして笑いを取りに行く", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("大ウケ！場の主導権を握り、ムキムキ永続+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("投げ銭が飛んできた。60G入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `transfer-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("空気が凍って黒歴史化…呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "席替え",
            description: "今日は席替えの日だ。窓際の一番後ろになれるか...？\nそれとも最前列か。",
            options: [
                { label: "くじ引きに賭ける", text: "運試し（HP+4 / 35G / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4, currentHp: prev.player.currentHp + 4 } }));
                        setEventResultLog(trans("神引き！窓際の特等席を確保した。\n最大HPと現在HPが4増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 35 } }));
                        setEventResultLog(trans("悪くない席だ。机の中から封筒を見つけ、35G手に入れた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("最前列のど真ん中。緊張で胃が痛い...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "先生に相談する", text: "学習効率調整（カード2枚強化 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("配慮してもらい、集中できる席に。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("先生が優しく声をかけてくれた。\nHPが8回復した。", languageMode));
                    } else {
                        setEventResultLog(trans("相談したが、席はそのままだった。", languageMode));
                    }
                }},
                { label: "荷物を片付ける", text: "準備を整える（ポーション / 恒久ムキムキ+1 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const p = { ...POTION_LIBRARY['ENERGY_POTION'], id: `seat-energy-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, p].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("忘れ物の中にエナジーポーションを発見した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("机を運んで汗だくに。筋力がつき、恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `seat-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("古いプリントのホコリで目が回る...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "席を譲る", text: "徳を積む（50G / HP+6 / 20G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("お礼に売店券をもらった。50G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("気分が晴れて体が軽い。\nHPが6回復した。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 20) } }));
                        setEventResultLog(trans("いいことをしたはずが、財布を落とした...\n20G失った。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "避難訓練",
            description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。",
            options: [
                { label: "先頭で誘導する", text: "リーダー行動（最大HP+3 / カード1枚強化 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("落ち着いた誘導でみんなを救った。\n最大HPと現在HPが3増えた。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`避難導線を完璧に把握した。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("誘導の声が廊下に通り、次に活きる手応えが残った。", "誘導の声が廊下に通り、次に活きる手応えが残った。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("走り回って息切れした。\nHPが5減った。", languageMode));
                    }
                }},
                { label: "防災袋を点検する", text: "備えを確認（ポーション / 30G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const p = { ...POTION_LIBRARY['POWER_POTION'], id: `drill-power-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, p].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("防災袋に良い薬が入っていた。\nポーションを1つ入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 30 } }));
                        setEventResultLog(trans("備品整理の謝礼を受け取った。\n30G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `drill-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("古い非常食でお腹を壊した...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "放送に従って避難", text: "基本重視（カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`手順通りに動き、ムダが消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("手順通りの避難で呼吸が整い、次に活きる手応えを得た。", "手順通りの避難で呼吸が整い、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("混乱せず行動できた。\nHPが8回復した。", languageMode));
                    } else {
                        resolveMomentum("模範的な避難をやり切り、次に活きる手応えが足取りに残った。", "模範的な避難をやり切り、次に活きる手応えが足取りに残った。", true);
                    }
                }},
                { label: "非常ベルのモノマネ", text: "奇想天外（50G / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("完璧な再現で拍手喝采！\n余興代として50G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("全力発声で体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `drill-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("先生に止められた。気まずすぎる...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "プール開き",
            description: "待ちに待ったプール開きだ！\nしかし水は冷たそうだ。",
            options: [
                { label: "飛び込んで泳ぐ", text: "水に挑む（全回復 / HP+12 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                        setEventResultLog(trans("思い切って飛び込んだ！\n全身が目覚め、HPが全回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("冷水で気合いが入った。\nHPが12回復した。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DECAY, id: `pool-decay-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("体は冷え切り、風邪気味に...\n呪い「虫歯(腐敗)」を受けた。", languageMode));
                    }
                }},
                { label: "水中トレーニング", text: "鍛錬（恒久ムキムキ+1 / カード2枚強化 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("水の抵抗で筋力が伸びた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("泳法を研究し、技術が洗練された。\nカードを2枚強化した。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("張り切りすぎて脚をつった。\nHPが6減った。", languageMode));
                    }
                }},
                { label: "見学して作戦会議", text: "冷静判断（カード削除 / 40G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`泳がず観察し、無駄を削った。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("作戦会議で頭が整理され、次に活きる手応えを得た。", "作戦会議で頭が整理され、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 40 } }));
                        setEventResultLog(trans("監視係のバイト代をもらった。\n40G獲得。", languageMode));
                    } else {
                        resolveMomentum("安全第一で全体を見渡し、次に活きる手応えをつかんだ。", "安全第一で全体を見渡し、次に活きる手応えをつかんだ。", true);
                    }
                }},
                { label: "一人シンクロ百人分", text: "奇想天外（80G / 最大HP+5 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("伝説の演目になった。観客から80Gの投げ銭！", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } }));
                        setEventResultLog(trans("完泳して達成感MAX！\n最大HPと現在HPが5増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `pool-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("終盤で足がつり、盛大に沈んだ...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "修学旅行の積立金",
            description: "集金袋を拾った。中にはお金が入っている。",
            options: [
                { label: "職員室に届ける", text: "正攻法（レリック / 60G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MEMBERSHIP_CARD] }
                        }));
                        setEventResultLog(trans("正直者は報われる。\n先生から「図書カード」をもらった！", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("落とし主から謝礼を受け取った。\n60G獲得。", languageMode));
                    } else {
                        setEventResultLog(trans("無事に届けた。誰にも気づかれなかったが、胸は晴れた。", languageMode));
                    }
                }},
                { label: "落とし主を探す", text: "奔走する（カード1枚強化 / HP+8 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`校内を駆け回った経験が糧に。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("校内を探し回った経験が、次に活きる手応えとして残った。", "校内を探し回った経験が、次に活きる手応えとして残った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("感謝されて心が温まった。\nHPが8回復した。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("階段を走りすぎてヘトヘトに...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "ネコババする", text: "強欲ルート（150G / 90G+呪い / 30G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("誰にも見られていない。150Gを手に入れた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const gained = addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `trip-regret-${Date.now()}` } as Card);
                                return { ...gained, gold: gained.gold + 90 };
                            })()
                        }));
                        setEventResultLog(trans("大金は得たが罪悪感が残る...\n90G獲得し、呪い「後悔」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 30 } }));
                        setEventResultLog(trans("中身は思ったより少なかった。\n30Gだけ手に入った。", languageMode));
                    }
                }},
                { label: "偽名で落とし物届け", text: "奇策（カード削除 / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`身元不明の英雄として語られた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("名もなき英雄として胸を張り、次に活きる手応えを得た。", "名もなき英雄として胸を張り、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("謎の行動力で肝が据わった。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `trip-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("筆跡でバレた！\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "魔の掃除時間",
            description: "廊下のワックスがけの時間だ。\nツルツル滑る床は危険だが、滑れば速く移動できるかも？",
            options: [
                { label: "滑走ルートを開拓", text: "攻める掃除（カード強化 / 70G / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`華麗に滑ってコツを掴んだ。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("滑りながら体勢を整え、次に活きる手応えをつかんだ。", "滑りながら体勢を整え、次に活きる手応えをつかんだ。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("滑走ショーが話題に。イベント出演料70Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("勢い余って大転倒...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "黙々と磨く", text: "堅実ルート（カード削除 / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`床と一緒に迷いも磨かれた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("床を磨き切った達成感が、次に活きる手応えになった。", "床を磨き切った達成感が、次に活きる手応えになった。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("掃除後の達成感で元気が戻る。\nHPが10回復した。", languageMode));
                    } else {
                        setEventResultLog(trans("完璧に磨いた。見返りはないが気分はいい。", languageMode));
                    }
                }},
                { label: "バケツリレーを組む", text: "連携重視（恒久ムキムキ+1 / ポーション / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("連携作業で体が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        const p = { ...POTION_LIBRARY['BLOCK_POTION'], id: `clean-block-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, p].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("先生がご褒美にポーションをくれた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `clean-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("水をかぶって頭が真っ白に...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "廊下スケート大会開催", text: "奇想天外（最大HP+4 / 90G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4, currentHp: prev.player.currentHp + 4 } }));
                        setEventResultLog(trans("大会を完走！\n最大HPと現在HPが4増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("観客が集まり、参加費で90G稼いだ。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `clean-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("校長に見つかった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "運命のテスト返却",
            description: "今日は算数のテストが返却される日だ。\n自信はあるか？",
            options: [
                { label: "堂々と受け取る", text: "正面突破（100G / カード1枚強化 / HP-10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("100点満点！\nお祝いに100Gをもらった。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`結果は平凡だが学びは大きい。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("答案を見直すうちに、次に活きる手応えが見えてきた。", "答案を見直すうちに、次に活きる手応えが見えてきた。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                        setEventResultLog(trans("名前の記入漏れで0点...\n精神的ダメージでHPが10減った。", languageMode));
                    }
                }},
                { label: "再採点をお願いする", text: "交渉（カード削除 / 50G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`粘り勝ちで評価が見直された。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("交渉を通した経験が、次に活きる手応えとして残った。", "交渉を通した経験が、次に活きる手応えとして残った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("努力が認められ、特別奨励金50Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `test-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("強引すぎて先生を怒らせた...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "答案を封印する", text: "現実逃避（HP+20 / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                        setEventResultLog(trans("いったん忘れて深呼吸。気持ちが整った。\nHPが20回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("答案を握りしめる握力で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `test-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("封印は破られた。クラス中に結果が拡散...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "未来の自分に採点させる", text: "奇想天外（レリック / 120G / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.ANCIENT_TEA_SET] }
                        }));
                        setEventResultLog(trans("時空を超えた赤ペン添削！？\nレリック「放課後の水筒」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("未来の投資アドバイスが届いた。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("時間酔いでフラフラに...\nHPが8減った。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "放送室のジャック",
            description: "放送室に誰もいない。マイクの電源が入っている。\nイタズラするチャンス？",
            options: [
                { label: "校内ラジオを始める", text: "番組進行（最大HP+4 / 80G / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4, currentHp: prev.player.currentHp + 4 } }));
                        setEventResultLog(trans("神トークで人気爆発。\n最大HPと現在HPが4増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("スポンサー(購買部)がついた。\n80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("緊張で喉を痛めた...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "リクエスト曲を流す", text: "空気づくり（カード1枚強化 / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`選曲が完璧だった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("選曲の余韻が心を整え、次に活きる手応えを得た。", "選曲の余韻が心を整え、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("音楽で気持ちが整った。\nHPが10回復した。", languageMode));
                    } else {
                        resolveMomentum("無難に場をまとめ、次に活きる手応えを持ち帰った。", "無難に場をまとめ、次に活きる手応えを持ち帰った。", true);
                    }
                }},
                { label: "校長のモノマネ演説", text: "賭け（120G / 恒久ムキムキ+1 / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("大爆笑で配信収益化。\n120G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("腹式呼吸が極まり、恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `broadcast-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本人登場で終了...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "深夜ラジオ風に一人二役", text: "奇想天外（レリック / カード削除 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.SMILING_MASK] }
                        }));
                        setEventResultLog(trans("伝説回になった。\nレリック「スマイルシール」を得た。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`喋っているうちに悩みが一つ消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("勢いを声に乗せた感覚が、次に活きる手応えになった。", "勢いを声に乗せた感覚が、次に活きる手応えになった。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `broadcast-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("録音が全校配信された...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "理科室の人体模型",
            description: "夜の理科室。人体模型が動いている気がする。\n「心臓ヲ...クレ...」と聞こえた。",
            options: [
                { label: "交渉して分ける", text: "取引（レリック+HP-10 / 80G / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 10),
                                relics: [...prev.player.relics, RELIC_LIBRARY.BLOOD_VIAL]
                            }
                        }));
                        setEventResultLog(trans("血を分け与えた(HP-10)。\n礼として「保健室の飴(レリック)」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("教材費の返金袋を渡された。\n80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("握手した瞬間に冷たさで凍えた。\nHPが6減った。", languageMode));
                    }
                }},
                { label: "解剖図で論破する", text: "知識勝負（カード2枚強化 / HP+8 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("見事な説明で納得させた。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("知識が自信になった。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `model-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("用語を噛んで空気が凍った...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "全力で逃げる", text: "生存優先（カード削除 / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`恐怖で一つ記憶が飛んだ。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("全力で逃げ切り、次に活きる手応えが息の奥に残った。", "全力で逃げ切り、次に活きる手応えが息の奥に残った。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("助かった安堵で元気が戻る。\nHPが6回復。", languageMode));
                    } else {
                        resolveMomentum("見間違いかもしれない影を振り切り、次に活きる手応えを得た。", "見間違いかもしれない影を振り切り、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "模型に白衣を着せる", text: "奇想天外（恒久ムキムキ+1 / 120G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("妙に威圧感が増した模型に敬礼。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("理科準備室の映え企画として採用された。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `model-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("朝礼で犯人探しが始まった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "図書室の静寂",
            description: "放課後の図書室はとても静かだ。\n心地よい眠気が襲ってくる...",
            options: [
                { label: "机で仮眠する", text: "休息（HP+20 / 最大HP+3 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                        setEventResultLog(trans("ぐっすり眠れた。\nHPが20回復した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("深い休息で体力の器が広がった。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `library-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("寝ぼけて本棚に頭をぶつけた...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "難解な本を読む", text: "学習（先読み入手 / カード1枚強化 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.SCRY, id: `library-scry-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("新しい視点を得た。\n「先読み」を習得。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`知識が技に結びついた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("静かな学習の時間が、次に活きる手応えとして積み上がった。", "静かな学習の時間が、次に活きる手応えとして積み上がった。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("難しすぎて頭痛がした...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "返却棚を整える", text: "奉仕（カード削除 / 40G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`本を整えて心も整った。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("棚を整えたリズムが、次に活きる手応えをくれた。", "棚を整えたリズムが、次に活きる手応えをくれた。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 40 } }));
                        setEventResultLog(trans("図書委員から謝礼を受け取った。\n40G獲得。", languageMode));
                    } else {
                        resolveMomentum("静かな作業を終え、次に活きる手応えが指先に残った。", "静かな作業を終え、次に活きる手応えが指先に残った。", true);
                    }
                }},
                { label: "朗読を全力でキメる", text: "奇想天外（120G / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("演劇部にスカウトされ出演料獲得。\n120G。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("腹から声を出し続けて鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `library-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("静寂を破りすぎて司書に怒られた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "終わらない朝礼",
            description: "校長先生の話が長い...もう30分も続いている。\n貧血で倒れそうだ。",
            options: [
                { label: "直立で耐え抜く", text: "根性（最大HP+5&HP-5 / 70G / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const nextMaxHp = prev.player.maxHp + 5;
                            return { ...prev, player: { ...prev.player, maxHp: nextMaxHp, currentHp: Math.min(nextMaxHp, Math.max(1, prev.player.currentHp - 5)) } };
                        });
                        setEventResultLog(trans("耐え抜いた！精神力が鍛えられた。\n最大HP+5、HP-5。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("模範姿勢で表彰され、70Gを受け取った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("立ちくらみでフラついた...\nHPが8減った。", languageMode));
                    }
                }},
                { label: "保健室に直行", text: "安全策（HP全回復+呪い / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.CLUMSINESS, id: `assembly-clumsy-${Date.now()}` } as Card),
                                currentHp: prev.player.maxHp
                            }
                        }));
                        setEventResultLog(trans("休めてHP全回復。\nだがサボり扱いで呪い「ドジ」を受けた。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`看護師の助言で心の重荷が消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("保健室の空気で呼吸が整い、次に活きる手応えを得た。", "保健室の空気で呼吸が整い、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("保健室は満員だった。戻るしかない。", languageMode));
                    }
                }},
                { label: "メモを取り続ける", text: "集中（カード2枚強化 / HP+8 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("話の要点を掴み切った。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("姿勢を整えたら調子が戻った。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `assembly-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("メモが追いつかず不安だけが残る...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "校長の話をラップ化", text: "奇想天外（レリック / 150G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.INK_BOTTLE] }
                        }));
                        setEventResultLog(trans("韻が完璧で伝説になった。\nレリック「インク瓶」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("文化祭出演が決定し、前金150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `assembly-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("マイクが入っていた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "置き勉の誘惑",
            description: "カバンが重すぎる。教科書を学校に置いて帰ろうか...",
            options: [
                { label: "教科書を置いて帰る", text: "軽量化（カード削除 / 50G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`荷物整理で身軽になった。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("机の中を見直し、次に活きる手応えだけを持ち帰った。", "机の中を見直し、次に活きる手応えだけを持ち帰った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("ロッカー整理の手伝いで50G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `okiben-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("宿題を忘れた不安がつきまとう...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "全部持って帰る", text: "根性（頭突き入手 / 恒久ムキムキ+1 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.HEADBUTT, id: `okiben-headbutt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("重さに打ち勝った。\n「頭突き」を習得した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("毎日の負荷で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("肩が悲鳴を上げた...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "友達に分担してもらう", text: "協力（HP+10 / カード1枚強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("荷物が減って余裕ができた。\nHPが10回復。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`協力のコツを掴んだ。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("友達に声をかけた経験が、次に活きる手応えになった。", "友達に声をかけた経験が、次に活きる手応えになった。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("みんなも手一杯だった。現状維持。", languageMode));
                    }
                }},
                { label: "教科書を宅配便で送る", text: "奇想天外（120G / レリック / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: Math.max(0, prev.player.gold - 120) } }));
                        setEventResultLog(trans("送料が想像以上だった...\n120G失った。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.BAG_OF_PREPARATION] }
                        }));
                        setEventResultLog(trans("業者から記念品をもらった。\nレリック「予習かばん」を得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `okiben-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("翌日、荷物が届かず大混乱...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "伝説の木の下",
            description: "この木の下で告白すると結合されるという伝説がある。\n誰かが待っているようだ。",
            options: [
                { label: "勇気を出して行く", text: "告白勝負（レリック / 100G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.HAPPY_FLOWER] } }));
                        setEventResultLog(trans("待っていた相手から贈り物を受け取った。\nレリック「アサガオ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("告白現場は誰もいない。だが木の根元に100Gあった。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.WRITHE, id: `tree-writhe-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("イタズラ告白だった...\n呪い「悩み」を受けた。", languageMode));
                    }
                }},
                { label: "遠くから様子を見る", text: "観察（カード1枚強化 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`人間観察で洞察が磨かれた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("遠くから観察した視点が、次に活きる手応えを残した。", "遠くから観察した視点が、次に活きる手応えを残した。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("穏やかな空気に癒やされた。\nHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("静かな時間を見届け、次に活きる手応えを胸に立ち去った。", "静かな時間を見届け、次に活きる手応えを胸に立ち去った。", true);
                    }
                }},
                { label: "木に願い札を結ぶ", text: "祈願（最大HP+4 / カード削除 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4, currentHp: prev.player.currentHp + 4 } }));
                        setEventResultLog(trans("願いが届いた気がする。\n最大HPと現在HPが4増えた。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`迷いを札に託した。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("願い札だけ残して帰った。", "願い札だけ残して帰った。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("高い枝に手を伸ばして転んだ...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "木の下でプロポーズ代行業", text: "奇想天外（180G / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("代行依頼が殺到。180G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("連続の熱弁で体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `tree-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本人を間違えて告白してしまった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "体育倉庫のマット",
            description: "体育倉庫のマットの間に何かが挟まっている。\n腐った匂いもするが...",
            options: [
                { label: "勇気を出して探る", text: "探索（レアカード / 粘液 / 60G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const keys = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'RARE');
                            const card = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                            return { ...prev, player: addCardWithEventRelics(prev.player, { ...card, id: `mat-rare-${Date.now()}` } as Card) };
                        });
                        setEventResultLog(trans("隠しレアカードを発見した！", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...STATUS_CARDS.SLIMED, id: `mat-slimed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("腐ったものを掴んでしまった...\n状態異常「粘液」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("マットの隙間に60Gが挟まっていた。", languageMode));
                    }
                }},
                { label: "掃除してから探す", text: "慎重策（カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`整理整頓で視界がクリアに。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("掃除で場を整え、次に活きる手応えを得た。", "掃除で場を整え、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("ほこりを払って気分も回復。\nHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("きれいにしただけで終わった。", "きれいにしただけで終わった。", true);
                    }
                }},
                { label: "マットで筋トレ", text: "鍛錬（恒久ムキムキ+1 / 最大HP+3 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("腕立て100回達成！恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("体幹が安定した。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("勢い余って腰を打った...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "マット要塞を建設", text: "奇想天外（レリック / 120G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.ORICHALCUM] }
                        }));
                        setEventResultLog(trans("難攻不落の要塞完成。\nレリック「厚紙シールド」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("秘密基地ツアーが有料化された。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `mat-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("撤収時に全部崩れた...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "秘密基地のパスワード",
            description: "草むらに隠された合言葉。正解すればお宝が手に入るかもしれない。",
            options: [
                { label: "勘で唱える", text: "運試し（200G / HP-5 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("「開けゴマ！」で本当に開いた！\n200G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("警報が鳴り響いた！\nHPが5減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `password-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("正解か不正解か分からないまま帰る羽目に...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "暗号を解読する", text: "知性（カード2枚強化 / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("暗号理論が冴えた。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("正解目前まで迫った。\nHPが6回復。", languageMode));
                    } else {
                        setEventResultLog(trans("暗号は深すぎた。成果なし。", languageMode));
                    }
                }},
                { label: "見張りと交渉する", text: "交渉（カード削除 / 90G / HP-4）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`通行証をもらい迷いが消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("交渉の間合いを覚え、次に活きる手応えが残った。", "交渉の間合いを覚え、次に活きる手応えが残った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("見張りの副業を手伝い90G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 4) } }));
                        setEventResultLog(trans("口論になって追い返された。\nHPが4減った。", languageMode));
                    }
                }},
                { label: "秘密基地を乗っ取る", text: "奇想天外（レリック / 150G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("基地の主になった。\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("会員権販売で150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `password-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("三日で追放された...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "職員室の呼び出し",
            description: "校内放送で名前を呼ばれた。心当たりはあるか？",
            options: [
                { label: "正面から行く", text: "誠実（HP全回復+削除 / 80G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`褒められた！HP全回復。\n「${removedName || '迷い'}」を捨て去った。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("校内係の謝礼を受けた。\n80G獲得。", languageMode));
                    } else {
                        resolveMomentum("連絡ミスを確認し、次に活きる手応えを胸に職員室を出た。", "連絡ミスを確認し、次に活きる手応えを胸に職員室を出た。", true);
                    }
                }},
                { label: "廊下で待ち伏せ", text: "奇策（カード1枚強化 / HP+8 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`先手を打って評価アップ。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("先手を打つ判断が冴え、次に活きる手応えを得た。", "先手を打つ判断が冴え、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("待機中に深呼吸して落ち着いた。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("走り回って見つかり消耗...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "バックれる", text: "逃走（50G+呪い / カード削除 / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const gained = addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `staffroom-doubt-${Date.now()}` } as Card);
                                return { ...gained, gold: gained.gold + 50 };
                            })()
                        }));
                        setEventResultLog(trans("逃げた拍子に50G拾ったが、呪い「不安」を受けた。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`逃走ルート最適化で荷が軽くなった。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("逃げ切った足取りに、次に活きる手応えが宿った。", "逃げ切った足取りに、次に活きる手応えが宿った。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("毎日逃げ足を鍛えた成果。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "先生の代わりに呼び出し放送", text: "奇想天外（レリック / 140G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.POCKETWATCH] }
                        }));
                        setEventResultLog(trans("放送進行が評価された。\nレリック「チャイム時計」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 140 } }));
                        setEventResultLog(trans("校内MCの謝礼で140G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `staffroom-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("名前を噛んで大事故...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "落とし物のリコーダー",
            description: "道端に誰かのリコーダーが落ちている。名前は書いていない。",
            options: [
                { label: "試しに吹く", text: "音の運命（歌うカード / めまい / 70G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.THUNDERCLAP, id: `recorder-thunder-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("見事な音色！新しい表現を覚えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...STATUS_CARDS.DAZED, id: `recorder-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("音程が外れてくらくら...\n状態異常「めまい」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("演奏を見た人が投げ銭してくれた。\n70G獲得。", languageMode));
                    }
                }},
                { label: "洗って届ける", text: "善行（HP+10 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("きれいにして届けた。\nHPが10回復。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`感謝されて心のノイズが消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("善行のあとの清々しさが、次に活きる手応えになった。", "善行のあとの清々しさが、次に活きる手応えになった。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("職員室が留守だった。また今度届けよう。", languageMode));
                    }
                }},
                { label: "演奏会を開く", text: "挑戦（最大HP+3 / カード1枚強化 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("息遣いが安定した。\n最大HPと現在HPが3増えた。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`本番経験で技が磨かれた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("演奏の息づかいが整い、次に活きる手応えを得た。", "演奏の息づかいが整い、次に活きる手応えを得た。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("息切れでダウン...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "リコーダー探偵を名乗る", text: "奇想天外（レリック / 130G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.TINY_CHEST] }
                        }));
                        setEventResultLog(trans("落とし物事件を解決。\nレリック「小物入れ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 130 } }));
                        setEventResultLog(trans("調査協力費として130G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `recorder-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("持ち主を取り違えてしまった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "図工室の粘土",
            description: "乾燥してカチカチの粘土がある。水をかければ使えるかもしれない。",
            options: [
                { label: "丁寧にこねる", text: "造形（防御強化 / カード1枚強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                        if (success) setEventResultLog(trans("鉄壁の造形が完成！「防御」が強化された。", languageMode));
                        else resolveMomentum("防御系カードが見つからず、作品だけ残った。", "防御系カードが見つからず、作品だけ残った。", true);
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`発想が閃いた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("粘土をこねる感触が、次に活きる手応えとして残った。", "粘土をこねる感触が、次に活きる手応えとして残った。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("いい作品ができた。効果は特にない。", languageMode));
                    }
                }},
                { label: "豪快に叩く", text: "破壊（最大HP+2 / 60G / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("ストレス解放で体が軽い。\n最大HPと現在HPが2増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 60 } }));
                        setEventResultLog(trans("破片アートが売れた。\n60G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("破片で手を切った...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "先生に評価してもらう", text: "評価（カード削除 / HP+8 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`講評で課題が明確に。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("講評の言葉を噛みしめ、次に活きる手応えを得た。", "講評の言葉を噛みしめ、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("褒められて元気になった。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `clay-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("公開講評で緊張した...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "粘土で自分の分身を作る", text: "奇想天外（レリック / 恒久ムキムキ+1 / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.DOLLYS_MIRROR] }
                        }));
                        setEventResultLog(trans("分身が微笑んだ。\nレリック「合わせ鏡」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("粘土運びで鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `clay-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("完成直前で崩れた...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "家庭科室のつまみ食い",
            description: "調理実習の余りのクッキーがある。誰の物かわからない。",
            options: [
                { label: "ひとくち食べる", text: "試食（HP+15 / 呪い / 40G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 15) } }));
                        setEventResultLog(trans("サクサクで美味しい！\nHPが15回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `homeec-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("賞味期限が怪しかった...\n呪い「腹痛」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 40 } }));
                        setEventResultLog(trans("味見係として40Gをもらった。", languageMode));
                    }
                }},
                { label: "我慢する", text: "意志（カード強化 / 最大HP+3）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`誘惑に打ち勝った。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("誘惑に耐えた意志が、次に活きる手応えになった。", "誘惑に耐えた意志が、次に活きる手応えになった。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("自己管理が身についた。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        resolveMomentum("ぐっとこらえた呼吸が整い、次に活きる手応えを得た。", "ぐっとこらえた呼吸が整い、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "皆に配る", text: "共有（カード削除 / 70G / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`感謝されて心が軽くなった。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("配り終えた手際が、次に活きる手応えとして残った。", "配り終えた手際が、次に活きる手応えとして残った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("お礼のお菓子券を換金。\n70G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("運搬で疲れた...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "家庭科室にカフェを開く", text: "奇想天外（レリック / 150G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.ANCIENT_TEA_SET] }
                        }));
                        setEventResultLog(trans("臨時カフェが大盛況。\nレリック「放課後の水筒」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("売上で150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `homeec-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("食レポで盛大にむせた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "体育祭の練習",
            description: "大縄跳びの練習をしている。一緒に混ざる？",
            options: [
                { label: "跳び手として混ざる", text: "体力勝負（HP-5+40G / HP+10 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 5),
                                gold: prev.player.gold + 40
                            }
                        }));
                        setEventResultLog(trans("みんなで跳んだ！\nHP-5、40G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("リズムに乗って気分爽快。\nHPが10回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.CLUMSINESS, id: `sports-clumsy-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("足を引っかけて転倒...\n呪い「ドジ」を受けた。", languageMode));
                    }
                }},
                { label: "縄を回す", text: "支援役（グルグルバット強化 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                        if (success) setEventResultLog(trans("回転技術が向上した！「グルグルバット」が強化された。", languageMode));
                        else resolveMomentum("縄を回すリズムが体に残り、次に活きる手応えを得た。", "縄を回すリズムが体に残り、次に活きる手応えを得た。", true);
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`チーム運営で無駄が消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("運営の段取りが身につき、次に活きる手応えを得た。", "運営の段取りが身につき、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("練習は無難に終了。", languageMode));
                    }
                }},
                { label: "応援団に入る", text: "鼓舞（恒久ムキムキ+1 / 80G / HP-4）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("声出しで体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("応援演目の出演料で80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 4) } }));
                        setEventResultLog(trans("声を張りすぎて喉が痛い...\nHPが4減った。", languageMode));
                    }
                }},
                { label: "実況配信を始める", text: "奇想天外（レリック / 160G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.FROZEN_EYE] }
                        }));
                        setEventResultLog(trans("配信がバズった。\nレリック「観察メモ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 160 } }));
                        setEventResultLog(trans("投げ銭が飛んだ。\n160G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `sports-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("マイク切り忘れで炎上...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "校章の輝き",
            description: "地面に落ちているピカピカの校章。学校への愛着を試されている。",
            options: [
                { label: "丁寧に磨く", text: "敬意（金の定規+悩み / 100G / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.WRITHE, id: `crest-writhe-${Date.now()}` } as Card),
                                relics: [...prev.player.relics, RELIC_LIBRARY.VAJRA]
                            }
                        }));
                        setEventResultLog(trans("輝きが増した！レリック「金の定規」を得た。\nだが執着して呪い「悩み」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("落とし主から謝礼を受けた。\n100G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("姿勢を正したら気持ちが整った。\nHPが6回復。", languageMode));
                    }
                }},
                { label: "職員室へ届ける", text: "正道（カード削除 / カード1枚強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`誠実な行いで心が軽くなった。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("届け切った誠実さが、次に活きる手応えになった。", "届け切った誠実さが、次に活きる手応えになった。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            const newDeck = deck.map(card => card.id === target.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`評価されて自信がついた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("評価の言葉が背中を押し、次に活きる手応えを得た。", "評価の言葉が背中を押し、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("無事に届けた。見返りはない。", languageMode));
                    }
                }},
                { label: "踏んで運試し", text: "背徳（全カード強化+恥 / 恒久ムキムキ+1 / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                deck: prev.player.deck.map(c => getUpgradedCard(c)).concat({ ...CURSE_CARDS.SHAME, id: `crest-shame-${Date.now()}` })
                            }
                        }));
                        setEventResultLog(trans("背徳の快感！全カード強化。\n代償に呪い「恥」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("肝が据わった。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("先生に見つかって正座...\nHPが8減った。", languageMode));
                    }
                }},
                { label: "校章を複製して商売", text: "奇想天外（200G / レリック / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("限定グッズが完売。\n200G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MEMBERSHIP_CARD] }
                        }));
                        setEventResultLog(trans("公式に認められた。\nレリック「図書カード」を得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `crest-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("在庫を抱えて赤字...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "文化祭のポスター",
            description: "真っ白な掲示板。何か描いていく？",
            options: [
                { label: "大胆に描く", text: "創作（カード変化 / 90G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            if (deck.length === 0) return prev;
                            const idx = Math.floor(Math.random() * deck.length);
                            const keys = Object.keys(CARDS_LIBRARY).filter(k => !STATUS_CARDS[k] && !CURSE_CARDS[k]);
                            deck[idx] = { ...CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]], id: `poster-transform-${Date.now()}` } as Card;
                            return { ...prev, player: { ...prev.player, deck } };
                        });
                        setEventResultLog(trans("閃きでカードが1枚変化した！", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("作品が採用され、90G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `poster-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("絵がSNSで拡散されて赤面...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "丁寧に清掃する", text: "整頓（カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`掲示板を綺麗にした。\n「${removedName || '無駄'}」を消し去った。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("作業後の達成感でHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("清掃後の澄んだ空気が、次に活きる手応えを運んできた。", "清掃後の澄んだ空気が、次に活きる手応えを運んできた。", true);
                    }
                }},
                { label: "実行委員として調整", text: "運営（カード1枚強化 / 最大HP+3 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`采配が冴えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("運営の呼吸をつかみ、次に活きる手応えを得た。", "運営の呼吸をつかみ、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("段取り力が身についた。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("徹夜作業でへとへと...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "巨大立体ポスターを建造", text: "奇想天外（レリック / 170G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.INK_BOTTLE] }
                        }));
                        setEventResultLog(trans("作品が伝説になった。\nレリック「インク瓶」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 170 } }));
                        setEventResultLog(trans("スポンサーがついて170G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `poster-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("搬入で壊れてしまった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "不気味な音楽室",
            description: "誰もいないのにピアノの音が聞こえる。ベートーヴェンの肖像画がこっちを見ている気がする。",
            options: [
                { label: "一緒に弾く", text: "共演（反響カード / HP-15 / 120G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.ECHO_FORM, id: `music-echo-${Date.now()}` } as Card),
                                currentHp: Math.max(1, prev.player.currentHp - 15)
                            }
                        }));
                        setEventResultLog(trans("死の舞踏！HP-15。\n「予習復習(反響)」を習得した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 15), gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("幽霊オーケストラの謝礼を受け取った。\nHP-15、120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("演奏だけが残り、体力は無事だった。\n120G獲得。", languageMode));
                    }
                }},
                { label: "調律する", text: "技術（カード2枚強化 / HP+8 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("音の粒が揃った。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("和音に癒やされた。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DAZED, id: `music-dazed-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("不協和音で頭が真っ白に...\n呪いカードを1枚受け取った。", languageMode));
                    }
                }},
                { label: "逃げ出す", text: "撤退（カード削除 / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`脱兎のごとく逃げた！\n「${removedName || '記憶'}」が飛んだ。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("助かった安堵でHPが6回復。", languageMode));
                    } else {
                        resolveMomentum("何とか逃げ切り、次に活きる手応えを握りしめた。", "何とか逃げ切り、次に活きる手応えを握りしめた。", true);
                    }
                }},
                { label: "肖像画とデュオ配信", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.BIRD_FACED_URN] }
                        }));
                        setEventResultLog(trans("怪演が評価された。\nレリック「飼育小屋のえさ皿」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("配信収益で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `music-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("肖像画が無言でドン引きしていた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "屋上の柵",
            description: "屋上のフェンスが一部壊れている。外の景色がよく見える。",
            options: [
                { label: "思い切り叫ぶ", text: "解放（全回復+最大HP-5 / 120G / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const nextMaxHp = Math.max(1, prev.player.maxHp - 5);
                            return { ...prev, player: { ...prev.player, maxHp: nextMaxHp, currentHp: nextMaxHp } };
                        });
                        setEventResultLog(trans("叫んでスッキリ！\nHP全回復、最大HP-5。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("声が校庭まで届き、出演依頼が来た。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("胸のつかえが取れた。\nHPが8回復。", languageMode));
                    }
                }},
                { label: "景色を眺める", text: "静観（チャイム砂時計+後悔 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `roof-regret-${Date.now()}` } as Card),
                                relics: [...prev.player.relics, RELIC_LIBRARY.MERCURY_HOURGLASS]
                            }
                        }));
                        setEventResultLog(trans("時を忘れて佇んだ。\nレリック「チャイム砂時計」を得たが、呪い「後悔」を受けた。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`考えが整理された。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("景色を眺めただけで終わった。", "景色を眺めただけで終わった。", true);
                        }, 50);
                    } else {
                        resolveMomentum("夕焼けの光を浴び、次に活きる手応えが胸に残った。", "夕焼けの光を浴び、次に活きる手応えが胸に残った。", true);
                    }
                }},
                { label: "フェンスを直す", text: "修繕（恒久ムキムキ+1 / 最大HP+4 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("重作業で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 4, currentHp: prev.player.currentHp + 4 } }));
                        setEventResultLog(trans("達成感でみなぎる。\n最大HPと現在HPが4増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("工具を落として負傷...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "屋上ラジオ局を開設", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.TINY_HOUSE] }
                        }));
                        setEventResultLog(trans("屋上名物になった。\nレリック「ミニ校舎模型」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("スポンサー契約成立。\n180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `roof-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("放送事故で赤面...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "給食の残飯処理",
            description: "バケツ一杯の残飯。誰かが片付けなければならない。",
            options: [
                { label: "責任を持って食べる", text: "気合（HP+20+寄生虫 / 90G / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PARASITE, id: `lunch-parasite-${Date.now()}` } as Card),
                                currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20)
                            }
                        }));
                        setEventResultLog(trans("完食した！HPが20回復。\nだが呪い「寄生虫」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("給食委員の謝礼として90G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("お腹が重すぎる...\nHPが8減った。", languageMode));
                    }
                }},
                { label: "土に還す", text: "循環（再起動カード / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.REBOOT, id: `lunch-reboot-${Date.now()}` } as Card)
                        }));
                        setEventResultLog(trans("循環の尊さを学んだ。\nカード「再起動」を習得。", languageMode));
                    } else if (roll < 0.67) {
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
                            if (removedName) setEventResultLog(trans(`気持ちの整理がついた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("片付けた土の匂いが、次に活きる手応えを残した。", "片付けた土の匂いが、次に活きる手応えを残した。", true);
                        }, 50);
                    } else {
                        setEventResultLog(trans("静かに片付けが終わった。", languageMode));
                    }
                }},
                { label: "配膳計画を組み直す", text: "改善（カード1枚強化 / HP+8 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`運用改善に成功。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("計画を練った時間が、次に活きる手応えになった。", "計画を練った時間が、次に活きる手応えになった。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("混乱が減って気分が楽になった。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `lunch-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("提案が通らず気まずい...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "残飯アート展を開催", text: "奇想天外（レリック / 160G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CERAMIC_FISH] }
                        }));
                        setEventResultLog(trans("作品が芸術祭で入賞。\nレリック「図工の魚皿」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 160 } }));
                        setEventResultLog(trans("入場料で160G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `lunch-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("匂いで会場騒然...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "昇降口の下履き",
            description: "誰かの靴が散乱している。揃えてあげる？",
            options: [
                { label: "綺麗に揃える", text: "善行（角笛 / HP+8 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.HORN_CLEAT] }
                        }));
                        setEventResultLog(trans("徳を積んだ。\nレリック「上履き」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("気持ちが整った。\nHPが8回復。", languageMode));
                    } else {
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
                            if (removedName) setEventResultLog(trans(`余計な癖が一つ消えた。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("綺麗に揃えた靴先が、次に活きる手応えをくれた。", "綺麗に揃えた靴先が、次に活きる手応えをくれた。");
                        }, 50);
                    }
                }},
                { label: "靴の持ち主を探す", text: "奔走（カード1枚強化 / 80G / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`聞き込みで洞察が冴えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("探し回る視線が鍛えられ、次に活きる手応えを得た。", "探し回る視線が鍛えられ、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("お礼として80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("走り回って疲れた...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "こっそり隠す", text: "悪戯（100G+恥 / 恒久ムキムキ+1 / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const gained = addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `shoe-shame-${Date.now()}` } as Card);
                                return { ...gained, gold: gained.gold + 100 };
                            })()
                        }));
                        setEventResultLog(trans("靴から100Gを見つけた。\n呪い「恥」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("逃げ足が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `shoe-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("やりすぎたかもしれない...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "靴を並べてアート作品", text: "奇想天外（レリック / 140G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.SMILING_MASK] }
                        }));
                        setEventResultLog(trans("展示が話題に。\nレリック「スマイルシール」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 140 } }));
                        setEventResultLog(trans("観覧料で140G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `shoe-art-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("先生に怒られて公開反省...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "二宮金次郎の背負い物",
            description: "夜になると動き出すという石像。背負っている薪（まき）が重そうだ。",
            options: [
                { label: "薪運びを手伝う", text: "献身（最大HP+10 / HP-10 / 100G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const nextMaxHp = prev.player.maxHp + 10;
                            return { ...prev, player: { ...prev.player, maxHp: nextMaxHp, currentHp: Math.min(nextMaxHp, Math.max(1, prev.player.currentHp - 10)) } };
                        });
                        setEventResultLog(trans("重労働をやり切った。\n最大HP+10、HP-10。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("感謝の薪代として100G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                        setEventResultLog(trans("想像以上に重かった...\nHPが10減った。", languageMode));
                    }
                }},
                { label: "読書を教わる", text: "学び（カード2枚強化 / HP+8 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("読書の芯を掴んだ。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("心が落ち着いた。\nHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `ninomiya-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("偉人すぎて比較してしまう...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "本を借りる（無断）", text: "危険（辞書+骨折 / 120G / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.INJURY, id: `ninomiya-injury-${Date.now()}` } as Card),
                                relics: [...prev.player.relics, RELIC_LIBRARY.ENCHIRIDION]
                            }
                        }));
                        setEventResultLog(trans("分厚い辞書を手に入れた。\nだが反撃で呪い「骨折」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("古紙回収で120Gを得た。", languageMode));
                    } else {
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
                            if (removedName) setEventResultLog(trans(`大事なノートを落とした...\n「${removedName}」を失った。`, languageMode));
                            else resolveMomentum("静けさの中で集中が深まり、次に活きる手応えを得た。", "静けさの中で集中が深まり、次に活きる手応えを得た。");
                        }, 50);
                    }
                }},
                { label: "石像と深夜読書会", text: "奇想天外（レリック / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.POCKETWATCH] }
                        }));
                        setEventResultLog(trans("時を忘れる名著会だった。\nレリック「チャイム時計」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("薪運び読書会で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `ninomiya-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("巡回の先生に見つかった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "保健室の視力検査",
            description: "「C」の向きを答えてください。全問正解でお宝です。",
            options: [
                { label: "真面目に受ける", text: "検査（スネッコアイ / 虚無 / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.SNECKO_EYE] }
                        }));
                        setEventResultLog(trans("全問正解！\nレリック「ぐるぐるメガネ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...STATUS_CARDS.VOID, id: `eye-void-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("見間違いが続いた...\n状態異常「虚無」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("目薬でスッキリ。\nHPが6回復。", languageMode));
                    }
                }},
                { label: "ランドルト環を暗記する", text: "対策（カード強化 / 70G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`観察眼が鋭くなった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("対策の積み重ねが、次に活きる手応えになった。", "対策の積み重ねが、次に活きる手応えになった。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("検査補助の謝礼で70G獲得。", languageMode));
                    } else {
                        setEventResultLog(trans("ほどほどの結果で終わった。", languageMode));
                    }
                }},
                { label: "検査から逃げる", text: "回避（カード削除 / HP-5 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            if (removedName) setEventResultLog(trans(`面倒を一つ手放した。\n「${removedName}」を取り除いた。`, languageMode));
                            else resolveMomentum("逃げ切った足取りに、次に活きる手応えが残った。", "逃げ切った足取りに、次に活きる手応えが残った。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("廊下ダッシュで消耗...\nHPが5減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `eye-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("視力が気になって落ち着かない...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "Cの向き占い師になる", text: "奇想天外（レリック / 150G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.FROZEN_EYE] }
                        }));
                        setEventResultLog(trans("占いが当たりまくる。\nレリック「観察メモ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("行列ができて150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `eye-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("全部ハズして気まずい...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "図書室の貸出カード",
            description: "自分の名前が書かれた古い貸出カードを見つけた。昔の自分からのメッセージだ。",
            options: [
                { label: "読み返す", text: "回想（カード強化+HP+5 / 最大HP+3）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            nextP.currentHp = Math.min(nextP.maxHp, nextP.currentHp + 5);
                            const deck = [...nextP.deck];
                            if (deck.length === 0) return prev;
                            const target = deck[Math.floor(Math.random() * deck.length)];
                            nextP.deck = deck.map(c => c.id === target.id ? getUpgradedCard(c) : c);
                            upgradedName = target.name;
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`昔の言葉に背中を押された。\nHPが5回復し「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("読み返した記憶が整理され、次に活きる手応えを得た。", "読み返した記憶が整理され、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("初心を思い出した。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        resolveMomentum("静かにページを閉じ、次に活きる手応えを胸にしまった。", "静かにページを閉じ、次に活きる手応えを胸にしまった。", true);
                    }
                }},
                { label: "新しいメモを書き足す", text: "前進（カード2枚強化 / 80G / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("目標を書き出して頭が冴えた。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("学級文庫の手伝い報酬で80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `librarycard-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("未来を考えすぎて不安に...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "捨てる", text: "決別（カード削除 / 恒久ムキムキ+1 / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`過去を断ち切った。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("覚悟が決まった。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `librarycard-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("捨てた直後に懐かしくなった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "貸出カードをNFT化", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.TINY_CHEST] }
                        }));
                        setEventResultLog(trans("デジタル遺産として評価された。\nレリック「小物入れ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("購入希望者が現れて180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `librarycard-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("誰にも理解されず気まずい...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "飼育小屋の掃除",
            description: "ニワトリのフンがすごい。掃除をすれば何か見つかるかも？",
            options: [
                { label: "本気で掃除する", text: "労働（HP-5+ポーション / 90G / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const pots = Object.values(POTION_LIBRARY);
                        const pot = { ...pots[Math.floor(Math.random() * pots.length)], id: `hutch-pot-${Date.now()}` };
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 5),
                                potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player))
                            }
                        }));
                        setEventResultLog(trans("ぴかぴかにした！\nHP-5だがポーションを見つけた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("手当として90G獲得。", languageMode));
                    } else {
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
                            setEventResultLog(trans(`無駄を捨てる決心がついた。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    }
                }},
                { label: "ニワトリと遊ぶ", text: "交流（HP+10+後悔 / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `hutch-regret-${Date.now()}` } as Card),
                                currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10)
                            }
                        }));
                        setEventResultLog(trans("癒やされてHP+10。\nでも当番を忘れて呪い「後悔」。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("追いかけっこで鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        resolveMomentum("のんびりした時間が心をほどき、次に活きる手応えをくれた。", "のんびりした時間が心をほどき、次に活きる手応えをくれた。", true);
                    }
                }},
                { label: "餌の配合を研究", text: "研究（カード1枚強化 / 最大HP+3 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`飼育理論が応用できた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("研究の観察眼が磨かれ、次に活きる手応えを得た。", "研究の観察眼が磨かれ、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("生活リズムが整った。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `hutch-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("正解が分からなくなった...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "飼育小屋ライブ配信", text: "奇想天外（レリック / 150G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.BIRD_FACED_URN] }
                        }));
                        setEventResultLog(trans("人気企画になった。\nレリック「飼育小屋のえさ皿」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("視聴者から投げ銭で150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `hutch-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("音声が入りっぱなしだった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "先生の忘れ物",
            description: "職員室の廊下に先生の出席簿が落ちている。中には秘密のメモが...",
            options: [
                { label: "中を見る", text: "覗き見（予習セット+恥 / 120G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `notes-shame-${Date.now()}` } as Card),
                                relics: [...prev.player.relics, RELIC_LIBRARY.BAG_OF_PREP]
                            }
                        }));
                        setEventResultLog(trans("テスト範囲を把握した！\nレリック「予習セット」を得たが、呪い「恥」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("落とし物の謝礼袋を発見。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `notes-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("見なければよかった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "そのまま届ける", text: "誠実（100G / カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("正直者は報われる。\n100G獲得。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`気持ちが整った。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("感謝されて元気が出た。\nHPが8回復。", languageMode));
                    }
                }},
                { label: "先生を探して走る", text: "急行（カード1枚強化 / HP-6 / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`機転が効いた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("走り回った熱が体に残り、次に活きる手応えを得た。", "走り回った熱が体に残り、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("階段ダッシュで息切れ...\nHPが6減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("毎日の全力疾走で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "出席簿を朗読会にする", text: "奇想天外（レリック / 160G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.INK_BOTTLE] }
                        }));
                        setEventResultLog(trans("語りが評価された。\nレリック「インク瓶」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 160 } }));
                        setEventResultLog(trans("即席イベントの収益で160G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `notes2-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("関係者が来て凍りついた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "学級文庫の漫画",
            description: "ボロボロの『ジャンプ』が置いてある。続きが気になる。",
            options: [
                { label: "読む", text: "熱中（恒久ムキムキ+2&HP-5 / カード強化 / 80G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const boosted = addPermanentStrengthBonus(prev.player, 2);
                                return { ...boosted, currentHp: Math.max(1, boosted.currentHp - 5) };
                            })()
                        }));
                        setEventResultLog(trans("友情・努力・勝利！\n恒久ムキムキ+2、HP-5。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`名台詞が刺さった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("読破した余韻が、次に活きる手応えとして残った。", "読破した余韻が、次に活きる手応えとして残った。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("付録カードが売れた。\n80G獲得。", languageMode));
                    }
                }},
                { label: "寄付する", text: "奉仕（カード削除 / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`本棚に思い出を置いてきた。\n「${removedName || '無駄'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("いいことをして元気が出た。\nHPが10回復。", languageMode));
                    } else {
                        resolveMomentum("静かな寄付のあと、次に活きる手応えが胸に残った。", "静かな寄付のあと、次に活きる手応えが胸に残った。", true);
                    }
                }},
                { label: "続きの考察ノートを書く", text: "考察（カード2枚強化 / 呪い「不安」 / 最大HP+3）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("考察が冴え渡る。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `manga-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("考察沼にハマった...\n呪い「不安」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("理解が深まり器が広がる。\n最大HPと現在HPが3増えた。", languageMode));
                    }
                }},
                { label: "漫画評論チャンネル開設", text: "奇想天外（レリック / 170G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.SMILING_MASK] }
                        }));
                        setEventResultLog(trans("語りが刺さった。\nレリック「スマイルシール」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 170 } }));
                        setEventResultLog(trans("広告収益で170G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `manga-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("炎上してコメント欄が地獄...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "理科室のアルコールランプ",
            description: "火がついたまま放置されている。危ない！",
            options: [
                { label: "安全に消火する", text: "冷静（防御強化 / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                        if (success) setEventResultLog(trans("冷静な判断だ。\n防御カードが強化された。", languageMode));
                        else resolveMomentum("無事に消火した手順が、次に活きる手応えになった。", "無事に消火した手順が、次に活きる手応えになった。", true);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("緊張を乗り越えた。\nHPが6回復。", languageMode));
                    } else {
                        resolveMomentum("安全確認の指差しが決まり、次に活きる手応えを得た。", "安全確認の指差しが決まり、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "実験を手伝う", text: "挑戦（カード1枚強化 / ポーション / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`実験成功！\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("手伝った段取りが身につき、次に活きる手応えを得た。", "手伝った段取りが身につき、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        const p = { ...POTION_LIBRARY['FIRE_POTION'], id: `lamp-fire-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, p].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("実験の副産物をもらった。\nポーションを入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("火傷してしまった...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "火遊びする", text: "危険（最大HP+5+火傷3枚 / 120G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...(() => {
                                    let np: Player = { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 };
                                    np = addCardWithEventRelics(np, { ...STATUS_CARDS.BURN, id: `lamp-burn1-${Date.now()}` } as Card);
                                    np = addCardWithEventRelics(np, { ...STATUS_CARDS.BURN, id: `lamp-burn2-${Date.now()}` } as Card);
                                    np = addCardWithEventRelics(np, { ...STATUS_CARDS.BURN, id: `lamp-burn3-${Date.now()}` } as Card);
                                    return np;
                                })()
                            }
                        }));
                        setEventResultLog(trans("スリルでみなぎる。\n最大HP+5、ただし火傷カード3枚。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("実演ショーで120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `lamp-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("やりすぎて反省...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "炎の精と契約する", text: "奇想天外（レリック / 恒久ムキムキ+1 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.ORRERY] }
                        }));
                        setEventResultLog(trans("未知の知識を授かった。\nレリック「星座早見盤」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("熱気で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `lamp-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("詠唱を聞かれてしまった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "音楽室の肖像画",
            description: "バッハの目が動いた気がする。何か言いたそうだ。",
            options: [
                { label: "肖像画に向かって歌う", text: "共鳴（最大エナジー+1&HP-10 / 120G / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                maxEnergy: prev.player.maxEnergy + 1,
                                currentHp: Math.max(1, prev.player.currentHp - 10)
                            }
                        }));
                        setEventResultLog(trans("魂の歌が響いた。\n最大エナジー+1、HP-10。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("特別演奏の謝礼で120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("歌い切って気分爽快。\nHPが8回復。", languageMode));
                    }
                }},
                { label: "楽譜を読む", text: "分析（カード2枚強化 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("旋律の構造を理解した。\nカードを2枚強化した。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`雑念が一つ消えた。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("譜面の流れを読み取り、次に活きる手応えを得た。", "譜面の流れを読み取り、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "目を見返す", text: "度胸（恒久ムキムキ+1 / HP-6 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("胆力がついた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("視線が強すぎた...\nHPが6減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `portrait-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本当に動いた気がして眠れない...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "肖像画とデュエット配信", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.FROZEN_EYE] }
                        }));
                        setEventResultLog(trans("神回になった。\nレリック「観察メモ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("配信収益で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `portrait-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("コメント欄が大荒れ...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "体育館の跳び箱",
            description: "12段の跳び箱がそびえ立っている。挑戦する？",
            options: [
                { label: "正面から跳ぶ", text: "挑戦（最大HP+5 / HP-10 / 100G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 5, currentHp: prev.player.currentHp + 5 } }));
                        setEventResultLog(trans("きれいに着地！\n最大HPと現在HPが5増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                        setEventResultLog(trans("ぶつかった！\nHPが10減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("見事な演技に賞金が出た。\n100G獲得。", languageMode));
                    }
                }},
                { label: "跳び箱の中を探る", text: "探索（マトリョーシカ+悩み / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.WRITHE, id: `vault-writhe-${Date.now()}` } as Card),
                                relics: [...prev.player.relics, RELIC_LIBRARY.MATRYOSHKA]
                            }
                        }));
                        setEventResultLog(trans("隠し箱を見つけた！\nレリック獲得、ただし呪い「悩み」。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`荷物を整理した。\n「${removedName || '無駄'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("跳び箱の暗がりを探り、次に活きる手応えを持ち帰った。", "跳び箱の暗がりを探り、次に活きる手応えを持ち帰った。", true);
                    }
                }},
                { label: "助走のフォーム改善", text: "技術（カード1枚強化 / HP+8 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`フォームが固まった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("練習の踏み切りが整い、次に活きる手応えを得た。", "練習の踏み切りが整い、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("体が温まりHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `vault-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("緊張が抜けない...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "跳び箱サーカスを開催", text: "奇想天外（レリック / 170G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.HAPPY_FLOWER] }
                        }));
                        setEventResultLog(trans("演目が名物になった。\nレリック「アサガオ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 170 } }));
                        setEventResultLog(trans("チケットが売れて170G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `vault-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("着地失敗で大転倒...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "水道の蛇口",
            description: "誰かが水を出しっぱなしにしている。もったいない。",
            options: [
                { label: "蛇口を閉める", text: "節水（HP+10 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("水を大切にした。\nHPが10回復。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`心の濁りも流れた。\n「${removedName || '無駄'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("蛇口を静かに閉め、次に活きる手応えを指先に残した。", "蛇口を静かに閉め、次に活きる手応えを指先に残した。", true);
                    }
                }},
                { label: "飲んでみる", text: "直飲み（ポーション+HP-5 / HP+6 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const potion = POTION_LIBRARY['BLOCK_POTION'];
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 5),
                                potions: [...prev.player.potions, { ...potion, id: `water-block-${Date.now()}` }].slice(0, getPotionCapacity(prev.player))
                            }
                        }));
                        setEventResultLog(trans("冷たすぎる！HP-5。\nポーションを入手した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("意外とおいしくて元気が出た。\nHPが6回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `water-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("お腹が冷えすぎた...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "配管を点検する", text: "整備（カード1枚強化 / 70G / HP-4）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`手際が良くなった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("点検の目が冴え、次に活きる手応えを得た。", "点検の目が冴え、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("修理協力費で70G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 4) } }));
                        setEventResultLog(trans("工具で手を打った...\nHPが4減った。", languageMode));
                    }
                }},
                { label: "ウォーターパーク化する", text: "奇想天外（レリック / 160G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MERCURY_HOURGLASS] }
                        }));
                        setEventResultLog(trans("噴水演出が大成功。\nレリック「チャイム砂時計」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 160 } }));
                        setEventResultLog(trans("入場料で160G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `water-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("びしょ濡れで注目を浴びた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "家庭科の包丁",
            description: "研ぎ澄まされた包丁。料理の準備はできている。",
            options: [
                { label: "丁寧に研ぐ", text: "鍛錬（攻撃カードコピー / 80G / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let name = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            const atk = nextP.deck.find(c => c.type === CardType.ATTACK);
                            if (atk) {
                                nextP.deck = [...nextP.deck, { ...atk, id: `knife-copy-${Date.now()}` }];
                                name = atk.name;
                            }
                            return { ...prev, player: nextP };
                        });
                        if (name) setEventResultLog(trans(`切れ味最高！\n「${name}」をコピーした。`, languageMode));
                        else resolveMomentum("刃物の扱いに集中し、次に活きる手応えを得た。", "刃物の扱いに集中し、次に活きる手応えを得た。");
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("包丁研ぎ代で80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.INJURY, id: `knife-injury-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("手元が狂った...\n呪い「骨折」を受けた。", languageMode));
                    }
                }},
                { label: "野菜を切る", text: "料理（HP+15 / カード1枚強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 15) } }));
                        setEventResultLog(trans("おいしいサラダができた。\nHPが15回復。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`包丁さばきが冴えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("料理の手順が体に入り、次に活きる手応えを得た。", "料理の手順が体に入り、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("素直なおいしさが体に染み、次に活きる手応えを得た。", "素直なおいしさが体に染み、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "肉の解体に挑む", text: "本番（恒久ムキムキ+1 / HP-8 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("腕力がついた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("重労働で消耗...\nHPが8減った。", languageMode));
                    } else {
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
                            setEventResultLog(trans(`余計な一手を捨てた。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    }
                }},
                { label: "包丁アートパフォーマンス", text: "奇想天外（レリック / 170G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.SHURIKEN] }
                        }));
                        setEventResultLog(trans("演武が評価された。\nレリック「紙飛行機」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 170 } }));
                        setEventResultLog(trans("投げ銭で170G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `knife-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("手元をミスして赤面...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "秘密の連絡帳",
            description: "クラスの誰かの秘密が書かれている。見ちゃいけない...",
            options: [
                { label: "こっそり見る", text: "覗き見（150G / 呪い「恥」 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("秘密のメモから埋蔵金情報を得た。\n150G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `diary-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("最低な自分を知ってしまった...\n呪い「恥」を受けた。", languageMode));
                    } else {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`人の振り見て我が振り直せ。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("連絡帳の行間を読み、次に活きる手応えを得た。", "連絡帳の行間を読み、次に活きる手応えを得た。");
                        }, 50);
                    }
                }},
                { label: "そっと戻す", text: "良心（HP+8 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("良心が勝った。\nHPが8回復。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`心が軽くなった。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        setEventResultLog(trans("プライバシーは守られた。", languageMode));
                    }
                }},
                { label: "先生に報告する", text: "通報（100G / HP-5 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("誠実な対応で100G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("事情説明でぐったり...\nHPが5減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `diary-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("逆に疑われた気がする...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "秘密相談サービス開業", text: "奇想天外（レリック / 180G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.PEACE_PIPE] }
                        }));
                        setEventResultLog(trans("相談所が人気化。\nレリック「相談室の整理券」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("相談料で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `diary-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("相談内容が漏れてしまった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "校長先生の銅像",
            description: "威厳のある銅像。磨けば光るだろうか。",
            options: [
                { label: "丁寧に磨く", text: "奉仕（最大HP+2 / HP+8 / 100G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("心まで磨かれた気がする。\n最大HPと現在HPが2増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("達成感でHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("校内美化の謝礼で100G獲得。", languageMode));
                    }
                }},
                { label: "歴史を調べる", text: "学び（カード強化 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`知識が力になった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("調べた歴史が頭に残り、次に活きる手応えを得た。", "調べた歴史が頭に残り、次に活きる手応えを得た。", true);
                        }, 50);
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`価値観が整理された。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("閉まった資料室の前で考えを整理し、次に活きる手応えを得た。", "閉まった資料室の前で考えを整理し、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "落書きする", text: "背徳（150G+後悔 / 恒久ムキムキ+1 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const gained = addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `statue-regret-${Date.now()}` } as Card);
                                return { ...gained, gold: gained.gold + 150 };
                            })()
                        }));
                        setEventResultLog(trans("悪い力！150G獲得。\n呪い「後悔」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("肝が据わった。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("逃げるときに転んだ...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "銅像ライトアップショー", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("夜の校庭が映えた。\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("観覧料で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `statue-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("配線トラブルで赤面...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "階段の13段目",
            description: "夜になると増えるという伝説の階段。今、足元にあるのは13段目だ。",
            options: [
                { label: "踏み抜く", text: "異界（カード削除+HP-10 / レリック / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`別世界に吸い込まれた！\nHP-10、「${removedName || '何か'}」を置いてきた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.POCKETWATCH] }
                        }));
                        setEventResultLog(trans("時の狭間を見た。\nレリック「チャイム時計」を得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.WRITHE, id: `stairs-writhe-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("帰ってきたが胸騒ぎが残る...\n呪い「悩み」を受けた。", languageMode));
                    }
                }},
                { label: "飛び越える", text: "回避（回避カード / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.DEFLECT, id: `stairs-deflect-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("見事に飛び越えた！\n「回避」を習得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("危機を乗り越えHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("ギリギリで回避した感覚が、次に活きる手応えになった。", "ギリギリで回避した感覚が、次に活きる手応えになった。", true);
                    }
                }},
                { label: "段数を数え直す", text: "検証（カード2枚強化 / 70G / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("冷静な観察で技が研がれた。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("怪談調査の謝礼で70G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("怖くて足がすくんだ...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "13段目ツアーを企画", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.FROZEN_EYE] }
                        }));
                        setEventResultLog(trans("怪談ガイドとして名を上げた。\nレリック「観察メモ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("参加費で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `stairs-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("一人も来なくて気まずい...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "図書室の司書さん",
            description: "「お静かに. 本を読みますか？」",
            options: [
                { label: "おすすめ本を読む", text: "読書（アンコモンカード / HP+5 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const keys = Object.keys(CARDS_LIBRARY).filter(k => CARDS_LIBRARY[k].rarity === 'UNCOMMON');
                        const card = CARDS_LIBRARY[keys[Math.floor(Math.random() * keys.length)]];
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...card, id: `librarian-card-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("感動する物語だった！\nカードを1枚入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 5) } }));
                        setEventResultLog(trans("静かな時間でHPが5回復。", languageMode));
                    } else {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`一節が刺さった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("本の余韻が静かに残り、次に活きる手応えを得た。", "本の余韻が静かに残り、次に活きる手応えを得た。");
                        }, 50);
                    }
                }},
                { label: "静かに去る", text: "礼儀（HP+5 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 5) } }));
                        setEventResultLog(trans("マナーを守ってHPが5回復。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`静かな決断。\n「${removedName || 'ノイズ'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("礼儀正しく場を離れ、次に活きる手応えを持ち帰った。", "礼儀正しく場を離れ、次に活きる手応えを持ち帰った。", true);
                    }
                }},
                { label: "司書さんに質問攻め", text: "探求（カード2枚強化 / 80G / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("知識の扉が開いた。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 80 } }));
                        setEventResultLog(trans("資料整理の手伝いで80G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `librarian-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("聞きすぎて混乱...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "図書室で朗読ライブ", text: "奇想天外（レリック / 160G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.INK_BOTTLE] }
                        }));
                        setEventResultLog(trans("美しい朗読だった。\nレリック「インク瓶」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 160 } }));
                        setEventResultLog(trans("投げ銭で160G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `librarian-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("声が大きすぎた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "屋上の貯水槽",
            description: "巨大なタンク。中から音が聞こえる。",
            options: [
                { label: "覗き込む", text: "探索（ポーション / HP-10 / 120G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const pot = POTION_LIBRARY['HEALTH_POTION'];
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, potions: [...prev.player.potions, { ...pot, id: `tank-health-${Date.now()}` }].slice(0, getPotionCapacity(prev.player)) }
                        }));
                        setEventResultLog(trans("きれいな水だ！\nポーションを入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 10) } }));
                        setEventResultLog(trans("滑って落ちそうになった！\nHPが10減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("点検報酬として120G獲得。", languageMode));
                    }
                }},
                { label: "コンコン叩く", text: "反響（恒久ムキムキ+1 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("いい音だ。腕の力がついて恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`反響で集中力が高まった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("反響の違いを聞き分け、次に活きる手応えを得た。", "反響の違いを聞き分け、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("不思議な音の余韻が、次に活きる手応えとして残った。", "不思議な音の余韻が、次に活きる手応えとして残った。", true);
                    }
                }},
                { label: "配管を整備する", text: "整備（カード削除 / HP+8 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`配管と一緒に心も整った。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("整備後の達成感でHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `tank-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("異音の原因が分からない...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "貯水槽サウナを開業", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CERAMIC_FISH] }
                        }));
                        setEventResultLog(trans("謎施設が流行った。\nレリック「図工の魚皿」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("利用料で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `tank-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("温度管理をミスして大騒ぎ...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "飼育室のウサギ",
            description: "モフモフのウサギがいる。癒やされる...",
            options: [
                { label: "抱っこする", text: "癒やし（全回復+寄生虫 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PARASITE, id: `rabbit-parasite-${Date.now()}` } as Card),
                                currentHp: prev.player.maxHp
                            }
                        }));
                        setEventResultLog(trans("とても癒やされた。HP全回復。\nでも呪い「寄生虫」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("なでるだけでもHPが8回復。", languageMode));
                    } else {
                        setEventResultLog(trans("うさぎはすやすや寝ていた。", languageMode));
                    }
                }},
                { label: "観察する", text: "分析（先読み強化 / カード2枚強化 / 70G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                        if (success) setEventResultLog(trans("動きを完璧に読んだ！「先読み」が強化された。", languageMode));
                        else resolveMomentum("先読みカードは無かった。", "先読みカードは無かった。");
                    } else if (roll < 0.67) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("観察眼が冴えた。\nカードを2枚強化。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("飼育メモの謝礼で70G獲得。", languageMode));
                    }
                }},
                { label: "餌を作る", text: "世話（カード削除 / 恒久ムキムキ+1 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`生活が整った。\n「${removedName || '無駄'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("飼育作業で鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `rabbit-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("正しい餌が分からない...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "うさぎ神を召喚する", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.BLOOD_VIAL] }
                        }));
                        setEventResultLog(trans("祝福を受けた。\nレリック「保健室の飴」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("奉納金が集まり180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `rabbit-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("儀式を見られてしまった...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "学校のゴミ捨て場",
            description: "掘り出し物があるかもしれない。",
            options: [
                { label: "あさる", text: "探索（コモンレリック / 骨折 / 100G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            const allRelics = Object.values(RELIC_LIBRARY).filter(r => r.rarity === 'COMMON');
                            const relic = allRelics[Math.floor(Math.random() * allRelics.length)];
                            nextP.relics = [...nextP.relics, relic];
                            return { ...prev, player: nextP };
                        });
                        setEventResultLog(trans("掘り出し物を発見！\nコモンレリックを得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.INJURY, id: `trash-injury-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("粗大ゴミの下敷きになった...\n呪い「骨折」を受けた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("売れそうな金属を回収。\n100G獲得。", languageMode));
                    }
                }},
                { label: "掃除する", text: "整理（カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`きれいに片づけた。\n「${removedName || '過去'}」を捨てた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("空気が澄んでHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("掃除を終えた達成感が、次に活きる手応えになった。", "掃除を終えた達成感が、次に活きる手応えになった。", true);
                    }
                }},
                { label: "分別マスターになる", text: "研究（カード2枚強化 / 恒久ムキムキ+1 / HP-5）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("最適化が冴えた。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("重いもの運びで鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5) } }));
                        setEventResultLog(trans("粉塵でむせた...\nHPが5減った。", languageMode));
                    }
                }},
                { label: "宝探し配信を始める", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.TINY_CHEST] }
                        }));
                        setEventResultLog(trans("伝説の発掘回だった。\nレリック「小物入れ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("広告収益で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `trash-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("撮れ高ゼロで気まずい...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "放送室から変な声",
            description: "放送室から変な声が流れてきた。止めに行く？",
            options: [
                { label: "止めに行く", text: "制圧（大声カード / 120G / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY.THUNDERCLAP, id: `voice-thunder-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("マイクを奪取！\n「大声」を習得した。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("トラブル対応手当で120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("機材を運んで消耗...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "聞き入る", text: "傾聴（HP+10+退屈 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CURSE_CARDS.NORMALITY, id: `voice-normality-${Date.now()}` } as Card),
                                currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10)
                            }
                        }));
                        setEventResultLog(trans("不思議な歌声でHPが10回復。\nだが呪い「退屈」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`耳が鍛えられた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("最後まで耳を傾け、次に活きる手応えを得た。", "最後まで耳を傾け、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("最後まで聴いた余韻が、次に活きる手応えを残した。", "最後まで聴いた余韻が、次に活きる手応えを残した。", true);
                    }
                }},
                { label: "電源を落とす", text: "即断（カード削除 / HP+8 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`ノイズを断ち切った。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("静寂が戻ってHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `voice-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本当に止めてよかったのか...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "怪電波DJとしてデビュー", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.FROZEN_EYE] }
                        }));
                        setEventResultLog(trans("怪電波がカルト的人気に。\nレリック「観察メモ」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("投げ銭で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `voice-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("校内放送で身バレした...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "掲示板の100点答案",
            description: "誰かの100点のテストが飾られている。眩しい。",
            options: [
                { label: "写して学ぶ", text: "模倣（カード強化+恥 / 100G / HP+6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            const deck = [...nextP.deck];
                            if (deck.length === 0) return prev;
                            const target = deck[Math.floor(Math.random() * deck.length)];
                            nextP.deck = deck.map(c => c.id === target.id ? getUpgradedCard(c) : c).concat({ ...CURSE_CARDS.SHAME, id: `answer-shame-${Date.now()}` });
                            upgradedName = target.name;
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            setEventResultLog(trans(`まる写しで効率アップ。\n「${upgradedName || 'カード'}」強化、呪い「恥」を受けた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("ノート整理のバイトで100G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 6) } }));
                        setEventResultLog(trans("勉強意欲が戻った。\nHPが6回復。", languageMode));
                    }
                }},
                { label: "破る", text: "反抗（恒久ムキムキ+2+後悔 / HP-8 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const boosted = addPermanentStrengthBonus(prev.player, 2);
                                return { ...boosted, deck: [...boosted.deck, { ...CURSE_CARDS.REGRET, id: `answer-regret-${Date.now()}` }] };
                            })()
                        }));
                        setEventResultLog(trans("嫉妬の炎！\n恒久ムキムキ+2、呪い「後悔」。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("先生に追いかけられて消耗...\nHPが8減った。", languageMode));
                    } else {
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
                            setEventResultLog(trans(`古い執着を捨てた。\n「${removedName || 'ノイズ'}」を取り除いた。`, languageMode));
                        }, 50);
                    }
                }},
                { label: "自分の答案を貼る", text: "挑戦（カード2枚強化 / 最大HP+3 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("覚悟が決まった。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("自信がついた。\n最大HPと現在HPが3増えた。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `answer-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("比較して不安に...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "答案展をプロデュース", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MEMBERSHIP_CARD] }
                        }));
                        setEventResultLog(trans("教育祭で評価された。\nレリック「図書カード」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("入場料で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `answer-show-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("展示がスベって気まずい...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "保健室のベッド",
            description: "ふかふかのシーツ。今なら誰もいない。",
            options: [
                { label: "寝る", text: "休息（全回復+次戦闘E-1 / HP+12）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp, nextTurnEnergy: -1 } }));
                        setEventResultLog(trans("ぐっすり眠った。HP全回復。\nただし次戦闘の1ターン目エナジー-1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("短時間でも効いた。\nHPが12回復。", languageMode));
                    } else {
                        resolveMomentum("横になって深呼吸し、次に活きる手応えを体に戻した。", "横になって深呼吸し、次に活きる手応えを体に戻した。", true);
                    }
                }},
                { label: "飛び跳ねる", text: "遊び（最大HP+3 / HP-6 / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("ベッドでジャンプ！\n最大HPと現在HPが3増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("着地を失敗した...\nHPが6減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "シーツを整える", text: "整頓（カード削除 / カード強化 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`几帳面さが戻った。\n「${removedName || 'ノイズ'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`手際が良くなった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("ベッドを整えた手順が、次に活きる手応えになった。", "ベッドを整えた手順が、次に活きる手応えになった。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `bed-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("誰かの視線を感じる...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "保健室ホテルを開業", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.TINY_HOUSE] }
                        }));
                        setEventResultLog(trans("寝具経営が成功。\nレリック「ミニ校舎模型」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("宿泊費で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `bed-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("無断営業がバレた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "給食の余りの牛乳",
            description: "バケツに1本だけ余っている。冷たそうだ。",
            options: [
                { label: "飲む", text: "栄養（最大HP+2 / HP+10 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 2, currentHp: prev.player.currentHp + 2 } }));
                        setEventResultLog(trans("カルシウム補給！\n最大HPと現在HPが2増えた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("体が温まった。\nHPが10回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `milk-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("お腹が痛い...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "かける", text: "暴走（全カード強化+HP-5 / 120G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 5), deck: prev.player.deck.map(c => getUpgradedCard(c)) }
                        }));
                        setEventResultLog(trans("ミルクシャワー！\nHP-5、全カード強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("動画がバズって120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `milk-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("後片付けで怒られた...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "分け合う", text: "協調（カード削除 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`気持ちよく分けられた。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`連携が良くなった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("分け合った温かさが、次に活きる手応えとして残った。", "分け合った温かさが、次に活きる手応えとして残った。", true);
                        }, 50);
                    } else {
                        resolveMomentum("平和な空気を味わい、次に活きる手応えを得た。", "平和な空気を味わい、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "牛乳先物トレード", text: "奇想天外（レリック / 180G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CAULDRON] }
                        }));
                        setEventResultLog(trans("乳製品市場を制した。\nレリック「給食の大鍋」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("相場読み成功で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `milk-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("全力で外した...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "廊下のワックス",
            description: "塗りたてピカピカ. 滑るぞ。",
            options: [
                { label: "滑る", text: "滑走（上履き+HP-5 / 120G / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 5),
                                relics: [...prev.player.relics, RELIC_LIBRARY.HORN_CLEAT]
                            }
                        }));
                        setEventResultLog(trans("かっこいいスライディング！\nHP-5、レリック「上履き」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("滑走パフォーマンスがウケた。\n120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("転ばない体幹が身についた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "慎重に歩く", text: "安全（カード削除 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`丁寧に歩いて無駄を削った。\n「${removedName || '無駄'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("慎重さで疲れが減った。\nHPが8回復。", languageMode));
                    } else {
                        resolveMomentum("安全に通過した足運びが、次に活きる手応えになった。", "安全に通過した足運びが、次に活きる手応えになった。", true);
                    }
                }},
                { label: "ワックスがけを手伝う", text: "作業（カード強化 / HP-4 / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const c = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = c.name;
                            const newDeck = deck.map(card => card.id === c.id ? getUpgradedCard(card) : card);
                            return { ...prev, player: { ...prev.player, deck: newDeck } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`職人技を覚えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("手伝いの動きが身につき、次に活きる手応えを得た。", "手伝いの動きが身につき、次に活きる手応えを得た。");
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 4) } }));
                        setEventResultLog(trans("薬剤でむせた...\nHPが4減った。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `wax-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本当にこれで合ってる？\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "廊下カーリング大会", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MATRYOSHKA] }
                        }));
                        setEventResultLog(trans("大会が伝説になった。\nレリック「お道具箱」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("参加費で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `wax-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("転倒シーンが拡散された...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "理科室の毒薬",
            description: "ドクロマークの小瓶。どうする？",
            options: [
                { label: "飲む", text: "試薬（カード強化+HP-10 / 恒久ムキムキ+1 / 呪い）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                            const deck = [...nextP.deck];
                            if (deck.length === 0) return prev;
                            const targetIdx = Math.floor(Math.random() * deck.length);
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            upgradedName = deck[targetIdx].name;
                            nextP.deck = deck;
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            setEventResultLog(trans(`体が毒に慣れた！\nHP-10、「${upgradedName || 'カード'}」強化。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("猛毒に耐えて体質が変化。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `poison-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("胃が限界...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "捨てる", text: "平和（50G+HP10 / カード削除）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            nextP.currentHp = Math.min(nextP.maxHp, nextP.currentHp + 10);
                            nextP.gold += 50;
                            return { ...prev, player: nextP };
                        });
                        setEventResultLog(trans("平和主義で処理した。\nHP+10、50G獲得。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`危険を断って思考が澄んだ。\n「${removedName || 'ノイズ'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        resolveMomentum("安全に処理した手際が、次に活きる手応えになった。", "安全に処理した手際が、次に活きる手応えになった。", true);
                    }
                }},
                { label: "解毒薬を調合する", text: "研究（カード2枚強化 / HP+8 / 70G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("理論がつながった。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("安心してHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 70 } }));
                        setEventResultLog(trans("試験協力費で70G獲得。", languageMode));
                    }
                }},
                { label: "毒薬バーを開く", text: "奇想天外（レリック / 180G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CAULDRON] }
                        }));
                        setEventResultLog(trans("怪しい店が繁盛。\nレリック「給食の大鍋」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("常連客で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `poison-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("保健所に止められた...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "放課後の決闘",
            description: "隣の小学校の番長が待ち構えている。「俺と勝負しろ！」",
            options: [
                { label: "受けて立つ", text: "真剣勝負（HP-20+金の定規 / 150G / 恒久ムキムキ+2）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 20),
                                relics: [...prev.player.relics, RELIC_LIBRARY.VAJRA]
                            }
                        }));
                        setEventResultLog(trans("激闘に勝利！\nHP-20、レリック「金の定規」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 150 } }));
                        setEventResultLog(trans("引き分けの手打ち金で150G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 2) }));
                        setEventResultLog(trans("負けたが鍛えられた。\n恒久ムキムキ+2。", languageMode));
                    }
                }},
                { label: "逃げる", text: "撤退（カード削除 / HP+8 / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`逃走ルート最適化。\n「${removedName || '迷い'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("危機を回避してHPが8回復。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `duel-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("野次で心が折れた...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "言葉で和解する", text: "交渉（カード2枚強化 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("対話が通じた。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("話し合いは長引いた...\nHPが6減った。", languageMode));
                    } else {
                        resolveMomentum("言葉で場を収め、次に活きる手応えを得た。", "言葉で場を収め、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "決闘を興行化する", text: "奇想天外（レリック / 200G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.RED_SKULL] }
                        }));
                        setEventResultLog(trans("番長リーグ設立。\nレリック「赤点答案」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("観客席が埋まり200G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `duel-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("安全管理で大失敗...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "秘密基地",
            description: "森の奥に子供たちの秘密基地を見つけた。お菓子やマンガが置いてある。",
            options: [
                { label: "休む", text: "休憩（HP+30 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 30) } }));
                        setEventResultLog(trans("基地でぐっすり休めた。\nHPが30回復した。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`作戦会議がはかどった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("休憩で頭が澄み、次に活きる手応えを得た。", "休憩で頭が澄み、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("のんびりした時間が心を整え、次に活きる手応えを得た。", "のんびりした時間が心を整え、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "あさる", text: "探索（エナジー薬+30G / カード削除 / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const potion = POTION_LIBRARY['ENERGY_POTION'];
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                gold: prev.player.gold + 30,
                                potions: [...prev.player.potions, { ...potion, id: `pot-base-${Date.now()}` }].slice(0, getPotionCapacity(prev.player))
                            }
                        }));
                        setEventResultLog(trans("宝箱を発見！\n30Gとエナジーポーションを手に入れた。", languageMode));
                    } else if (roll < 0.67) {
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
                            setEventResultLog(trans(`不要品を処分した。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `base-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("誰かの私物を壊してしまった...\n呪い「後悔」を受けた。", languageMode));
                    }
                }},
                { label: "見張りをする", text: "警備（恒久ムキムキ+1 / 90G / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("警戒心が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("見張りの報酬で90G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("長時間立ちっぱなしで消耗...\nHPが8減った。", languageMode));
                    }
                }},
                { label: "基地を要塞化する", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.ORICHALCUM] }
                        }));
                        setEventResultLog(trans("秘密基地が難攻不落になった。\nレリック「厚紙シールド」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("防衛費のカンパが集まり180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `base-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("要塞化が大げさすぎて笑われた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "脱走したウサギ",
            description: "飼育小屋のウサギが逃げ出した！校庭を走り回っている。",
            options: [
                { label: "捕まえる", text: "追跡（50G / カード強化 / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 50 } }));
                        setEventResultLog(trans("見事に確保！\n先生から50Gもらった。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`追跡で集中力が上がった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("追いかけた足取りが軽くなり、次に活きる手応えを得た。", "追いかけた足取りが軽くなり、次に活きる手応えを得た。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("全力疾走でバテた...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "一緒に遊ぶ", text: "ふれあい（最大HP+3 / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, maxHp: prev.player.maxHp + 3, currentHp: prev.player.currentHp + 3 } }));
                        setEventResultLog(trans("ウサギと仲良くなった。\n最大HP+3。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("ふわふわに癒やされた。\nHPが10回復。", languageMode));
                    } else {
                        resolveMomentum("ふれあいの温かさが残り、次に活きる手応えを得た。", "ふれあいの温かさが残り、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "ニンジンで誘導", text: "作戦（ポーション / 120G / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const pot = { ...POTION_LIBRARY['HEALTH_POTION'], id: `rabbit-pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("誘導成功！\n体力ポーションを入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("飼育委員会から謝礼120Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `rabbit-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("ニンジンの位置を迷って大混乱...\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "ウサギレースを開催", text: "奇想天外（レリック / 180G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("大盛況の夜レース！\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("参加費で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `rabbit-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("運営が大混乱...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "飼育小屋の主",
            description: "飼育小屋の奥に、主と呼ばれる巨大なニワトリがいる。",
            options: [
                { label: "戦う", text: "正面突破（HP-10+カード強化 / 140G / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            nextP.currentHp = Math.max(1, nextP.currentHp - 10);
                            const deck = [...nextP.deck];
                            if (deck.length === 0) return prev;
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                            upgradedName = deck[idx].name;
                            nextP.deck = deck;
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            setEventResultLog(trans(`主との激闘に勝利した。\nHP-10、「${upgradedName || 'カード'}」が強化された。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 140 } }));
                        setEventResultLog(trans("見世物になってしまったが、賭け金で140G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("つつかれ続けて体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "卵をもらう", text: "交渉（ポーション / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const potion = POTION_LIBRARY['HEALTH_POTION'];
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, { ...potion, id: `pot-egg-${Date.now()}` }].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("新鮮な卵を分けてもらった。\n体力ポーションを入手。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("栄養たっぷりの卵料理でHPが10回復。", languageMode));
                    } else {
                        resolveMomentum("にらみ合いの間合いを覚え、次に活きる手応えを得た。", "にらみ合いの間合いを覚え、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "掃除を手伝う", text: "奉仕（カード削除 / 100G / 呪い「不安」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`誠意が伝わった。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("飼育委員会から謝礼100Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `coop-doubt-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("本当にこの掃除で合ってる？\n呪い「不安」を受けた。", languageMode));
                    }
                }},
                { label: "ニワトリ王国を建国", text: "奇想天外（レリック / 200G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CAULDRON] }
                        }));
                        setEventResultLog(trans("王国の戴冠式が始まった。\nレリック「給食の大鍋」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("観光収入で200G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `coop-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("国家運営が破綻した...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "闇の掲示板",
            description: "校舎裏の掲示板に, ターゲットの情報が書かれている。",
            options: [
                { label: "情報を売る", text: "取引（カード削除+50G / 120G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let removedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player, gold: prev.player.gold + 50 };
                            if (nextP.deck.length > 0) {
                                const idx = Math.floor(Math.random() * nextP.deck.length);
                                const removed = nextP.deck.splice(idx, 1)[0];
                                removedName = removed.name;
                                if (removedName === '寄生虫' || removedName === 'PARASITE') nextP.maxHp -= 3;
                            }
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            setEventResultLog(trans(`売買成立。\n50G獲得し、「${removedName || '不要カード'}」を処分した。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("相場が跳ね上がり120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `board-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("取引記録がバレた...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "依頼を受ける", text: "実行（HP-15+毒突き / 180G / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...addCardWithEventRelics(prev.player, { ...CARDS_LIBRARY['POISON_STAB'], id: `stab-task-${Date.now()}` } as Card),
                                currentHp: Math.max(1, prev.player.currentHp - 15)
                            }
                        }));
                        setEventResultLog(trans("危ない任務を完遂。\nHP-15、「毒突き」を習得。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("高額報酬で180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("修羅場を越えて鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "掲示板を消す", text: "鎮圧（HP+12 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("悪い噂が消えて気持ちが軽くなった。\nHPが12回復。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`迷いが消えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("掲示板を掃除した手つきが、次に活きる手応えになった。", "掲示板を掃除した手つきが、次に活きる手応えになった。", true);
                        }, 50);
                    } else {
                        resolveMomentum("静かになった掲示板を見上げ、次に活きる手応えを得た。", "静かになった掲示板を見上げ、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "有料ニュース配信", text: "奇想天外（レリック / 200G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("配信が大当たり。\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("課金が集まり200G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `board-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("炎上で謝罪会見...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "理科室の爆発",
            description: "実験中に薬品を混ぜすぎた！フラスコが光り輝いている。",
            options: [
                { label: "耐える", text: "耐久（HP-15+ポーション2個 / カード強化 / 呪い「腹痛」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const p1 = POTION_LIBRARY['FIRE_POTION'];
                        const p2 = POTION_LIBRARY['ENERGY_POTION'];
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                currentHp: Math.max(1, prev.player.currentHp - 15),
                                potions: [...prev.player.potions, { ...p1, id: `pot-exp-1-${Date.now()}` }, { ...p2, id: `pot-exp-2-${Date.now()}` }].slice(0, getPotionCapacity(prev.player))
                            }
                        }));
                        setEventResultLog(trans("爆風を耐え切った。\nHP-15、ポーションを2個入手。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`危機対応が洗練された。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("爆風に耐えた呼吸が、次に活きる手応えになった。", "爆風に耐えた呼吸が、次に活きる手応えになった。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `exp-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("有毒ガスを吸ってしまった...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "逃げる", text: "退避（HP+10 / 90G）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("無事に退避できた。\nHPが10回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("避難誘導で感謝され、90G獲得。", languageMode));
                    } else {
                        resolveMomentum("大事を取る判断が冴え、次に活きる手応えを得た。", "大事を取る判断が冴え、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "原因を解析する", text: "分析（カード2枚強化 / 恒久ムキムキ+1 / HP-8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        const deck = [...prev.player.deck];
                        for (let i = 0; i < Math.min(2, deck.length); i++) {
                            const idx = Math.floor(Math.random() * deck.length);
                            deck[idx] = getUpgradedCard(deck[idx]);
                        }
                        setGameState(prev => ({ ...prev, player: { ...prev.player, deck } }));
                        setEventResultLog(trans("分析ノートが完成した。\nカードを2枚強化。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("化学知識で自信がついた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 8) } }));
                        setEventResultLog(trans("調査中にまた小爆発...\nHPが8減った。", languageMode));
                    }
                }},
                { label: "爆発ショーを開催", text: "奇想天外（レリック / 200G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.MATRYOSHKA] }
                        }));
                        setEventResultLog(trans("危険芸が伝説になった。\nレリック「お道具箱」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("興行が当たり200G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `exp-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("派手に失敗して大恥...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "地獄の特訓",
            description: "タイヤを引いて校庭を10周！エースへの道は険しい。",
            options: [
                { label: "やる", text: "本気（HP-10+最大HP+10 / 恒久ムキムキ+2 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                maxHp: prev.player.maxHp + 10,
                                currentHp: Math.max(1, prev.player.currentHp - 10)
                            }
                        }));
                        setEventResultLog(trans("限界まで走り切った。\nHP-10、最大HP+10。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 2) }));
                        setEventResultLog(trans("地獄を越えて覚醒。\n恒久ムキムキ+2。", languageMode));
                    } else {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`フォーム改善で技が冴えた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("走り込んだ熱が残り、次に活きる手応えを得た。", "走り込んだ熱が残り、次に活きる手応えを得た。");
                        }, 50);
                    }
                }},
                { label: "サボる", text: "回避（HP全回復 / 120G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: prev.player.maxHp } }));
                        setEventResultLog(trans("木陰で回復に専念した。\nHPが全回復。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("代走の手配で120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `training-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("サボりが見つかった...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "メニューを組み直す", text: "指導（カード削除 / HP+12）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`無駄を省いた。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 12) } }));
                        setEventResultLog(trans("負荷が適正化され、HPが12回復。", languageMode));
                    } else {
                        resolveMomentum("立てた計画の輪郭が、次に活きる手応えになった。", "立てた計画の輪郭が、次に活きる手応えになった。", true);
                    }
                }},
                { label: "特訓配信でバズる", text: "奇想天外（レリック / 220G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.RED_SKULL] }
                        }));
                        setEventResultLog(trans("鬼コーチ企画がヒット。\nレリック「赤点答案」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 220 } }));
                        setEventResultLog(trans("広告収入で220G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `training-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("炎上して企画中止...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "校内放送ジャック",
            description: "お昼の放送でリサイタルを開こう！全校生徒が君の歌を待っている（？）",
            options: [
                { label: "熱唱", text: "全力ライブ（最大エナジー+1+HP-10 / 180G / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                maxEnergy: prev.player.maxEnergy + 1,
                                currentHp: Math.max(1, prev.player.currentHp - 10)
                            }
                        }));
                        setEventResultLog(trans("魂の熱唱が刺さった！\n最大エナジー+1、HP-10。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("投げ銭が飛び交い180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("腹式呼吸が身についた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "バラード", text: "癒やし系（HP+20 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 20) } }));
                        setEventResultLog(trans("しっとり歌い上げた。\nHPが20回復。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`集中が研ぎ澄まされた。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("歌声の響きが残り、次に活きる手応えを得た。", "歌声の響きが残り、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("拍手の余韻を胸に、次に活きる手応えを得た。", "拍手の余韻を胸に、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "機材を調整する", text: "裏方（カード削除 / ポーション / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`ノイズを除去した。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        const pot = { ...POTION_LIBRARY['ENERGY_POTION'], id: `broadcast-pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("余った栄養ドリンクを入手。\nエナジーポーションを得た。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("重い機材で腰を痛めた...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "学校をフェス会場にする", text: "奇想天外（レリック / 220G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("照明演出が大成功。\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 220 } }));
                        setEventResultLog(trans("チケット収入で220G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `broadcast-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("音響トラブルで大事故...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "延滞図書の督促",
            description: "「あ、あの...本返してください...」不良グループが本を返してくれない。",
            options: [
                { label: "戦う", text: "強行（HP-5+カード強化 / 120G / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const nextP = { ...prev.player };
                            nextP.currentHp = Math.max(1, nextP.currentHp - 5);
                            const deck = [...nextP.deck];
                            if (deck.length === 0) return prev;
                            const targetIdx = Math.floor(Math.random() * deck.length);
                            deck[targetIdx] = getUpgradedCard(deck[targetIdx]);
                            upgradedName = deck[targetIdx].name;
                            nextP.deck = deck;
                            return { ...prev, player: nextP };
                        });
                        setTimeout(() => {
                            setEventResultLog(trans(`勇気を出して取り返した。\nHP-5、「${upgradedName || 'カード'}」が強化された。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("示談金として120Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("度胸がついた。\n恒久ムキムキ+1。", languageMode));
                    }
                }},
                { label: "諦める", text: "撤退（呪い「不安」 / HP+10）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.DOUBT, id: `doubt-lib-${Date.now()}` } as Card)
                        }));
                        setEventResultLog(trans("言い出せずに退いた...\n呪い「不安」を受けた。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 10) } }));
                        setEventResultLog(trans("深呼吸して気持ちを立て直した。\nHPが10回復。", languageMode));
                    } else {
                        resolveMomentum("今日は見送る判断を選び、次に活きる手応えを得た。", "今日は見送る判断を選び、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "先生に相談する", text: "公的手段（カード削除 / 90G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`正式な手続きで解決。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 90 } }));
                        setEventResultLog(trans("図書委員会から謝礼90Gを獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `library-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("大事になって注目を浴びた...\n呪い「恥」を受けた。", languageMode));
                    }
                }},
                { label: "延滞者更生ラップを披露", text: "奇想天外（レリック / 200G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.LANTERN] }
                        }));
                        setEventResultLog(trans("説教ラップが学校中で話題に。\nレリック「懐中電灯」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 200 } }));
                        setEventResultLog(trans("配信収益で200G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `library-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("韻が滑って黒歴史化...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "肥沃な土壌",
            description: "とても良質な土を見つけた。種を植えるには最適だ。",
            options: [
                { label: "植える", text: "栽培（成長+2 / カード強化 / HP+8）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        let success = false;
                        setGameState(prev => {
                            const garden = [...(prev.player.garden || [])];
                            let found = false;
                            for (let i = 0; i < garden.length; i++) {
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
                        if (success) setEventResultLog(trans("土の力で作物がぐんと育った。", languageMode));
                        else resolveMomentum("畑の土を見つめ直し、次に活きる手応えを得た。", "畑の土を見つめ直し、次に活きる手応えを得た。");
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`土いじりで集中した。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("耕した土の感触が、次に活きる手応えを残した。", "耕した土の感触が、次に活きる手応えを残した。");
                        }, 50);
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.min(prev.player.maxHp, prev.player.currentHp + 8) } }));
                        setEventResultLog(trans("自然の香りで落ち着いた。\nHPが8回復。", languageMode));
                    }
                }},
                { label: "持ち帰る", text: "運搬（100G / ポーション / 呪い「腹痛」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 100 } }));
                        setEventResultLog(trans("良質な土が高く売れた。\n100G獲得。", languageMode));
                    } else if (roll < 0.67) {
                        const pot = { ...POTION_LIBRARY['HEALTH_POTION'], id: `soil-pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("栄養抽出に成功。\n体力ポーションを入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `soil-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("土埃を吸い込みすぎた...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "土壌を分析する", text: "研究（カード削除 / 恒久ムキムキ+1）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`無駄を取り除けた。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: addPermanentStrengthBonus(prev.player, 1) }));
                        setEventResultLog(trans("耕作で体幹が鍛えられた。\n恒久ムキムキ+1。", languageMode));
                    } else {
                        resolveMomentum("分析の過程で視点が増え、次に活きる手応えを得た。", "分析の過程で視点が増え、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "土で巨大プリンを作る", text: "奇想天外（レリック / 180G / 呪い「恥」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CAULDRON] }
                        }));
                        setEventResultLog(trans("謎料理がなぜか絶賛された。\nレリック「給食の大鍋」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 180 } }));
                        setEventResultLog(trans("屋台が売れて180G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.SHAME, id: `soil-shame-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("見た目が強烈すぎた...\n呪い「恥」を受けた。", languageMode));
                    }
                }}
            ]
        },
        {
            title: "新メニューのインスピレーション",
            description: "食堂の隅に古いレシピ本がある。新しいアイデアが浮かぶかも。",
            options: [
                { label: "研究する", text: "試作（カード変化 / カード強化）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            if (deck.length === 0) return prev;
                            const idx = Math.floor(Math.random() * deck.length);
                            const pool = Object.values(CARDS_LIBRARY).filter(c => c.rarity === 'UNCOMMON');
                            const pick = pool[Math.floor(Math.random() * pool.length)];
                            deck[idx] = { ...pick, id: `chef-new-${Date.now()}` } as Card;
                            return { ...prev, player: { ...prev.player, deck } };
                        });
                        setEventResultLog(trans("新しいメニューがひらめいた。\nカード1枚が別のカードに変化した。", languageMode));
                    } else if (roll < 0.67) {
                        let upgradedName = "";
                        setGameState(prev => {
                            const deck = [...prev.player.deck];
                            const upgradeable = deck.filter(c => !c.upgraded);
                            if (upgradeable.length === 0) return prev;
                            const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
                            upgradedName = target.name;
                            return { ...prev, player: { ...prev.player, deck: deck.map(card => card.id === target.id ? getUpgradedCard(card) : card) } };
                        });
                        setTimeout(() => {
                            if (upgradedName) setEventResultLog(trans(`味の調整が決まった。\n「${upgradedName}」が強化された。`, languageMode));
                            else resolveMomentum("研究のメモが増え、次に活きる手応えを得た。", "研究のメモが増え、次に活きる手応えを得た。", true);
                        }, 50);
                    } else {
                        resolveMomentum("試作の知見が増え、次に活きる手応えを得た。", "試作の知見が増え、次に活きる手応えを得た。", true);
                    }
                }},
                { label: "試食する", text: "実食（HP+15+恒久ムキムキ+1 / 120G / 呪い「腹痛」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: (() => {
                                const boosted = addPermanentStrengthBonus(prev.player, 1);
                                return {
                                    ...boosted,
                                    currentHp: Math.min(boosted.maxHp, boosted.currentHp + 15)
                                };
                            })()
                        }));
                        setEventResultLog(trans("絶品だった！\nHPが15回復し、恒久ムキムキ+1。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 120 } }));
                        setEventResultLog(trans("試食レビューがバズって120G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.PAIN, id: `menu-pain-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("食べ合わせに失敗...\n呪い「腹痛」を受けた。", languageMode));
                    }
                }},
                { label: "厨房を手伝う", text: "実務（カード削除 / ポーション / HP-6）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
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
                            setEventResultLog(trans(`段取りが洗練された。\n「${removedName || '不要カード'}」を取り除いた。`, languageMode));
                        }, 50);
                    } else if (roll < 0.67) {
                        const pot = { ...POTION_LIBRARY['ENERGY_POTION'], id: `menu-pot-${Date.now()}` };
                        setGameState(prev => ({ ...prev, player: { ...prev.player, potions: [...prev.player.potions, pot].slice(0, getPotionCapacity(prev.player)) } }));
                        setEventResultLog(trans("まかないドリンクをもらった。\nエナジーポーションを入手。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, currentHp: Math.max(1, prev.player.currentHp - 6) } }));
                        setEventResultLog(trans("慣れない火加減で消耗...\nHPが6減った。", languageMode));
                    }
                }},
                { label: "世界給食フェスを開催", text: "奇想天外（レリック / 220G / 呪い「後悔」）", action: () => {
                    const roll = Math.random();
                    if (roll < 0.34) {
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, relics: [...prev.player.relics, RELIC_LIBRARY.CAULDRON] }
                        }));
                        setEventResultLog(trans("給食の大鍋メニューが大ヒット。\nレリック「給食の大鍋」を得た。", languageMode));
                    } else if (roll < 0.67) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, gold: prev.player.gold + 220 } }));
                        setEventResultLog(trans("来場者が殺到して220G獲得。", languageMode));
                    } else {
                        setGameState(prev => ({ ...prev, player: addCardWithEventRelics(prev.player, { ...CURSE_CARDS.REGRET, id: `menu-regret-${Date.now()}` } as Card) }));
                        setEventResultLog(trans("仕込みが間に合わず大混乱...\n呪い「後悔」を受けた。", languageMode));
                    }
                }}
            ]
        }
    );

    if (preferredEventTitle) {
        if (visualTheme !== 'elementary') {
            const matchedTheme = getVisualThemeEventThemeByTitle(visualTheme, preferredEventTitle);
            if (matchedTheme) return buildThemedEvent(matchedTheme, visualTheme);
        }
        const matched = potentialEvents.find(e =>
            e.title === preferredEventTitle
        );
        if (matched) return finalizeEvent(matched);
    }

    // Pick random event from the massive pool
    return finalizeEvent(potentialEvents[Math.floor(Math.random() * potentialEvents.length)]);
};
