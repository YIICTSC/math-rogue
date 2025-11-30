


import { Card, CardType, TargetType, Relic, Potion, Character } from './types';

export const INITIAL_HP = 75;
export const INITIAL_ENERGY = 3;
export const HAND_SIZE = 5;

// --- SVG DATA URIS FOR CHARACTERS (24x24 Pixel Art) ---

// 1. Elementary School Kid (Red Cap) - The Warrior
const WARRIOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 2h8v2H8z" fill="#f44336"/>
  <path d="M7 4h10v2H7z" fill="#d32f2f"/>
  <path d="M7 6h2v1H7z" fill="#f44336"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 10h8v6H8z" fill="#ffffff"/>
  <path d="M10 12h4v1h-4z" fill="#e0e0e0"/>
  <path d="M8 10h1v4H8zM15 10h1v4h-1z" fill="#d32f2f"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#ffccbc"/>
  <path d="M8 16h8v3H8z" fill="#1565c0"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#ffffff"/>
</svg>`;

// 2. Transfer Student (Mysterious) - The Assassin
const ASSASSIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v3h-1v1h-6v-1H8z" fill="#212121"/>
  <path d="M9 6h6v4H9z" fill="#ffe0b2"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M9 8h6v1H9z" fill="#4caf50" opacity="0.3"/>
  <path d="M8 10h8v6H8z" fill="#424242"/>
  <path d="M10 11h4v4h-4z" fill="#616161"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#424242"/>
  <path d="M8 16h8v3H8z" fill="#263238"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffe0b2"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#212121"/>
</svg>`;

// 3. Science Club Kid (Glasses) - The Mage
const MAGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v2H8z" fill="#5d4037"/>
  <path d="M9 5h6v4H9z" fill="#ffccbc"/>
  <path d="M9 6h2v1H9zM13 6h2v1h-2z" fill="#212121"/>
  <path d="M11 6h2v1h-2z" fill="#bdbdbd"/>
  <path d="M7 9h10v9H7z" fill="#ffffff"/>
  <path d="M11 9h2v9h-2z" fill="#e3f2fd"/>
  <path d="M18 12h2v3h-2z" fill="#4caf50"/>
  <path d="M9 18h2v4H9zM13 18h2v4h-2z" fill="#455a64"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#37474f"/>
</svg>`;

// 4. Broadcasting Club (Mic) - The Bard
const BARD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 3h8v3H8z" fill="#ec407a"/>
  <path d="M6 4h2v4H6zM16 4h2v4h-2z" fill="#ec407a"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M13 11h3v3h-3z" fill="#212121"/>
  <path d="M14 14h1v2h-1z" fill="#bdbdbd"/>
  <path d="M8 10h8v6H8z" fill="#fff9c4"/>
  <path d="M10 10h4v2h-4z" fill="#f44336"/>
  <path d="M7 16h10v3H7z" fill="#ad1457"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M9 21h2v1H9zM13 21h2v1h-2z" fill="#fff"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#5d4037"/>
</svg>`;

// 5. Dodgeball Ace (Replaces Rogue) - Sporty
const DODGEBALL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M7 3h10v3H7z" fill="#ff9800"/>
  <path d="M7 6h2v1H7z" fill="#ff9800"/>
  <path d="M9 6h6v4H9z" fill="#ffccbc"/>
  <path d="M10 7h1v1h-1zM13 7h1v1h-1z" fill="#3e2723"/>
  <path d="M8 10h8v6H8z" fill="#33691e"/>
  <path d="M10 11h4v4h-4z" fill="#558b2f"/>
  <path d="M6 10h2v4H6zM16 10h2v4h-2z" fill="#33691e"/>
  <path d="M8 16h8v3H8z" fill="#1b5e20"/>
  <path d="M9 19h2v3H9zM13 19h2v3h-2z" fill="#ffccbc"/>
  <path d="M8 22h3v2H8zM13 22h3v2h-3z" fill="#1b5e20"/>
</svg>`;

export const HERO_IMAGE_DATA = `data:image/svg+xml;base64,${btoa(WARRIOR_SVG)}`;

// --- RELICS ---
export const RELIC_LIBRARY: Record<string, Relic> = {
    BURNING_BLOOD: { id: 'BURNING_BLOOD', name: '燃える血', description: '戦闘終了時、HPを6回復する。', rarity: 'STARTER' },
    SNAKE_RING: { id: 'SNAKE_RING', name: '蛇の指輪', description: '戦闘開始時、追加で2枚カードを引く。', rarity: 'STARTER' },
    HOLY_WATER: { id: 'HOLY_WATER', name: '聖水', description: '戦闘開始時、エネルギーを1得る。', rarity: 'STARTER' },
    
    // Character Specific Starters
    CRACKED_CORE: { id: 'CRACKED_CORE', name: 'ひび割れたコア', description: '戦闘開始時、ライトニングを1つ生成する（実装中）。', rarity: 'STARTER' }, // Placeholder for mage
    PURE_WATER: { id: 'PURE_WATER', name: '純水', description: '戦闘開始時、「奇跡」を1枚手札に加える（実装中）。', rarity: 'STARTER' },
    
    VAJRA: { id: 'VAJRA', name: '金剛杵', description: '戦闘開始時、筋力1を得る。', rarity: 'COMMON', price: 150 },
    ANCHOR: { id: 'ANCHOR', name: '錨', description: '1ターン目の開始時、ブロック10を得る。', rarity: 'COMMON', price: 150 },
    BAG_OF_PREP: { id: 'BAG_OF_PREP', name: '準備万端', description: '戦闘開始時、追加で2枚引く。', rarity: 'COMMON', price: 150 },
    BLOOD_VIAL: { id: 'BLOOD_VIAL', name: '血の瓶', description: '戦闘開始時、HPを2回復する。', rarity: 'COMMON', price: 150 },
    
    PENTOGRAPH: { id: 'PENTOGRAPH', name: 'ペン先', description: 'ボス戦開始時、HPを25回復する。', rarity: 'RARE', price: 250 },
    BRONZE_SCALES: { id: 'BRONZE_SCALES', name: '銅の鱗', description: '戦闘開始時、トゲ3(反撃)を得る。', rarity: 'RARE', price: 200 },
    
    MEMBERSHIP_CARD: { id: 'MEMBERSHIP_CARD', name: '会員カード', description: 'ショップの商品が安くなる。', rarity: 'SHOP', price: 100 },
    WAFFLE: { id: 'WAFFLE', name: 'ワッフル', description: '最大HP+7。HP全回復。', rarity: 'SHOP', price: 300 },
    
    SOZU: { id: 'SOZU', name: 'ポーション禁止令', description: '毎ターンE+1。ポーション獲得不可。', rarity: 'BOSS' },
    CURSED_KEY: { id: 'CURSED_KEY', name: '呪いの鍵', description: '毎ターンE+1。宝箱から呪い出現。', rarity: 'BOSS' },
    PHILOSOPHER_STONE: { id: 'PHILOSOPHER_STONE', name: '賢者の石', description: '毎ターンE+1。敵の筋力+1。', rarity: 'BOSS' },
    SNECKO_EYE: { id: 'SNECKO_EYE', name: 'スネッコアイ', description: '毎ターン追加で2枚引く。戦闘開始時に混乱状態になる。', rarity: 'BOSS' },
    LIZARD_TAIL: { id: 'LIZARD_TAIL', name: 'トカゲのしっぽ', description: '死亡時、HP50%で復活する（1回のみ）。', rarity: 'BOSS' },
    VELVET_CHOKER: { id: 'VELVET_CHOKER', name: 'ベルベットチョーカー', description: '毎ターンE+1。1ターンに6枚までしかカードを使えない。', rarity: 'BOSS' },

    // Event Relics
    GOLDEN_IDOL: { id: 'GOLDEN_IDOL', name: '黄金の偶像', description: '敵が落とすゴールドが25%増える。', rarity: 'RARE' },
    MUTAGENIC_STRENGTH: { id: 'MUTAGENIC_STRENGTH', name: '変異性筋力', description: '戦闘開始時、筋力3を得る。ターン終了時失う。', rarity: 'RARE' },
    WARPED_TONGS: { id: 'WARPED_TONGS', name: '歪んだトング', description: 'ターン開始時、手札のランダムなカードを強化する。', rarity: 'RARE' },
    RED_MASK: { id: 'RED_MASK', name: '赤仮面', description: '戦闘開始時、敵全体に弱体1を与える。', rarity: 'RARE' },
    NECRONOMICON: { id: 'NECRONOMICON', name: 'ネクロノミコン', description: 'コスト2以上の攻撃を1ターン1回2度発動。', rarity: 'RARE' },
    ENCHIRIDION: { id: 'ENCHIRIDION', name: 'エンキリディオン', description: '戦闘開始時、ランダムなパワーカードを手札に加える。', rarity: 'RARE' },
    NILRYS_CODEX: { id: 'NILRYS_CODEX', name: 'ニオーのコーデックス', description: 'ターン終了時、ランダムな3枚から1枚を選んで手札に加える。', rarity: 'RARE' },
    SPIRIT_POOP: { id: 'SPIRIT_POOP', name: '精霊のフン', description: 'スコア計算時に1点減点される。', rarity: 'COMMON' },
    
    // New Relics
    MEGAPHONE: { id: 'MEGAPHONE', name: 'メガホン', description: '戦闘開始時、敵全体に脆弱1を与える。', rarity: 'COMMON', price: 150 },
    HACHIMAKI: { id: 'HACHIMAKI', name: 'ハチマキ', description: '戦闘開始時、敏捷性1を得る。', rarity: 'COMMON', price: 150 },
    BIG_LADLE: { id: 'BIG_LADLE', name: 'お玉', description: '戦闘終了時、HPを4回復し、最大HPを4増やす。', rarity: 'RARE', price: 280 },
    WHISTLE: { id: 'WHISTLE', name: '笛', description: '戦闘開始時、ランダムな攻撃カード1枚をコスト0で手札に加える。', rarity: 'UNCOMMON', price: 180 },
    SEED_PACK: { id: 'SEED_PACK', name: '種の袋', description: '戦闘開始時、トゲ3を得る。', rarity: 'UNCOMMON', price: 160 },
    LANTERN: { id: 'LANTERN', name: 'ランタン', description: '戦闘開始時、エネルギーを1得る。', rarity: 'COMMON', price: 160 },
    MERCURY_HOURGLASS: { id: 'MERCURY_HOURGLASS', name: '水銀の砂時計', description: 'ターン開始時、敵全体に3ダメージ。', rarity: 'UNCOMMON', price: 180 },
    HORN_CLEAT: { id: 'HORN_CLEAT', name: '角のクリート', description: '2ターン目の開始時、ブロック14を得る。', rarity: 'UNCOMMON', price: 160 },
    HAPPY_FLOWER: { id: 'HAPPY_FLOWER', name: 'ハッピーフラワー', description: '3ターンごとにエネルギー1を得る。', rarity: 'COMMON', price: 150 },
    ICE_CREAM: { id: 'ICE_CREAM', name: 'アイスクリーム', description: '余ったエネルギーを次のターンに持ち越す。', rarity: 'RARE', price: 250 },
    OLD_COIN: { id: 'OLD_COIN', name: '古のコイン', description: '獲得時、300ゴールドを得る。', rarity: 'RARE', price: 300 },
    MEAT_ON_THE_BONE: { id: 'MEAT_ON_THE_BONE', name: '肉付きの骨', description: '戦闘終了時、HPが50%以下ならHP12回復。', rarity: 'UNCOMMON', price: 180 },
    BOOKMARK: { id: 'BOOKMARK', name: 'しおり', description: 'ターン終了時、手札をランダムに1枚保留する。', rarity: 'COMMON', price: 140 },
    
    // Ninja
    SHURIKEN: { id: 'SHURIKEN', name: '手裏剣', description: '1ターンに攻撃を3回プレイする度、筋力1を得る。', rarity: 'UNCOMMON', price: 220 },
    KUNAI: { id: 'KUNAI', name: 'クナイ', description: '1ターンに攻撃を3回プレイする度、敏捷性1を得る。', rarity: 'UNCOMMON', price: 220 },
    ORNAMENTAL_FAN: { id: 'ORNAMENTAL_FAN', name: '飾り扇子', description: '1ターンに攻撃を3回プレイする度、ブロック4を得る。', rarity: 'UNCOMMON', price: 200 },
    PEN_NIB: { id: 'PEN_NIB', name: 'ペン先', description: '攻撃を10回プレイする度、次の攻撃ダメージが2倍になる。', rarity: 'COMMON', price: 180 },
};

// --- POTIONS ---
export const POTION_LIBRARY: Record<string, Omit<Potion, 'id'>> = {
    FIRE_POTION: { templateId: 'FIRE_POTION', name: '火のポーション', description: '敵1体に20ダメージを与える。', rarity: 'COMMON', color: '#f87171', price: 50 },
    BLOCK_POTION: { templateId: 'BLOCK_POTION', name: 'ブロックポーション', description: 'ブロック12を得る。', rarity: 'COMMON', color: '#60a5fa', price: 50 },
    STRENGTH_POTION: { templateId: 'STRENGTH_POTION', name: '筋力ポーション', description: '筋力2を得る。', rarity: 'COMMON', color: '#ef4444', price: 75 },
    ENERGY_POTION: { templateId: 'ENERGY_POTION', name: 'エナジーポーション', description: 'エネルギー2を得る。', rarity: 'COMMON', color: '#fbbf24', price: 50 },
    WEAK_POTION: { templateId: 'WEAK_POTION', name: '弱体ポーション', description: '敵1体に弱体3を与える。(アーティファクト除去)', rarity: 'COMMON', color: '#9ca3af', price: 40 },
    POISON_POTION: { templateId: 'POISON_POTION', name: '毒ポーション', description: '敵1体に毒6を与える。', rarity: 'COMMON', color: '#4ade80', price: 50 },
    HEALTH_POTION: { templateId: 'HEALTH_POTION', name: '回復ポーション', description: 'HPを15回復する。', rarity: 'RARE', color: '#86efac', price: 100 },
    LIQUID_BRONZE: { templateId: 'LIQUID_BRONZE', name: '液体ブロンズ', description: 'トゲ3を得る。', rarity: 'UNCOMMON', color: '#d97706', price: 60 },
    GAMBLERS_BREW: { templateId: 'GAMBLERS_BREW', name: 'ギャンブラーの酒', description: '手札を全て捨て、同じ枚数引く。', rarity: 'RARE', color: '#a855f7', price: 70 },
    GHOST_IN_JAR: { templateId: 'GHOST_IN_JAR', name: '瓶詰めの妖精', description: '死亡時、HP10%で復活する。(自動使用)', rarity: 'RARE', color: '#e0f2fe', price: 200 },
};

// --- CHARACTERS ---
export const CHARACTERS: Character[] = [
    {
        id: 'WARRIOR',
        name: '熱血小学生',
        description: 'バランス型。攻撃と防御の基本カードで戦う。',
        maxHp: 80,
        gold: 99,
        startingRelicId: 'BURNING_BLOOD',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'BASH'],
        color: 'red',
        imageData: `data:image/svg+xml;base64,${btoa(WARRIOR_SVG)}`
    },
    {
        id: 'ASSASSIN',
        name: '謎の転校生',
        description: '手数型。0コスト攻撃や毒を駆使するテクニカルな戦い方。',
        maxHp: 70,
        gold: 99,
        startingRelicId: 'SNAKE_RING',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'NEUTRALIZE', 'SURVIVOR'],
        color: 'green',
        imageData: `data:image/svg+xml;base64,${btoa(ASSASSIN_SVG)}`
    },
    {
        id: 'MAGE',
        name: '科学部員',
        description: 'オーブ型。特殊な効果を持つオーブを生成して戦う（開発中）。',
        maxHp: 75,
        gold: 99,
        startingRelicId: 'CRACKED_CORE', // Changed to Cracked Core
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'ZAP', 'DUALCAST'],
        color: 'blue',
        imageData: `data:image/svg+xml;base64,${btoa(MAGE_SVG)}`
    },
    {
        id: 'BARD',
        name: '放送委員',
        description: '支援型。スタンスを切り替えて戦う（開発中）。',
        maxHp: 72,
        gold: 99,
        startingRelicId: 'PURE_WATER', // Changed to Pure Water
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND', 'ERUPTION', 'VIGILANCE'],
        color: 'purple',
        imageData: `data:image/svg+xml;base64,${btoa(BARD_SVG)}`
    },
    {
        id: 'DODGEBALL',
        name: 'ドッジボール部',
        description: '攻撃特化。HPを犠牲にして高火力を叩き出す。',
        maxHp: 90,
        gold: 50,
        startingRelicId: 'VAJRA',
        deckTemplate: ['STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'DEFEND', 'DEFEND', 'DEFEND', 'BASH', 'ANGER'],
        color: 'orange',
        imageData: `data:image/svg+xml;base64,${btoa(DODGEBALL_SVG)}`
    }
];

export const TRUE_BOSS = {
    id: 'THE_HEART',
    name: '堕落の心臓',
    maxHp: 500,
    nextIntent: { type: 'BUFF', value: 0 }
};

// --- CARDS ---

// Special Status Cards
export const STATUS_CARDS: Record<string, Omit<Card, 'id'>> = {
    WOUND: { name: '負傷', cost: 0, type: CardType.STATUS, description: '使用不可。', unplayable: true, rarity: 'SPECIAL' },
    DAZED: { name: 'めまい', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
    VOID: { name: '虚無', cost: 0, type: CardType.STATUS, description: '使用不可。引いた時E1失う。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
    BURN: { name: 'やけど', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    SLIMED: { name: '粘液', cost: 1, type: CardType.STATUS, description: '使用すると廃棄される。', exhaust: true, rarity: 'SPECIAL' }
};

// Curse Cards
export const CURSE_CARDS: Record<string, Omit<Card, 'id'>> = {
    PAIN: { name: '痛み', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、カードを使うたび1ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    REGRET: { name: '後悔', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、手札枚数分ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    DOUBT: { name: '不安', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、へろへろ1を得る。', unplayable: true, rarity: 'SPECIAL' },
    SHAME: { name: '恥', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、びくびく1を得る。', unplayable: true, rarity: 'SPECIAL' },
    WRITHE: { name: '苦悩', cost: 0, type: CardType.CURSE, description: '使用不可。初期手札に来る。', unplayable: true, innate: true, rarity: 'SPECIAL' },
    NORMALITY: { name: '凡庸', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、3枚までしかカードを使えない。', unplayable: true, rarity: 'SPECIAL' },
    INJURY: { name: '怪我', cost: 0, type: CardType.CURSE, description: '使用不可。', unplayable: true, rarity: 'SPECIAL' },
    PARASITE: { name: '寄生', cost: 0, type: CardType.CURSE, description: '使用不可。デッキから消滅すると最大HP-3。', unplayable: true, rarity: 'SPECIAL' },
    DECAY: { name: '虫歯', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    CLUMSINESS: { name: '不器用', cost: 0, type: CardType.CURSE, description: '使用不可。廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
};

// Event Specific Cards
export const EVENT_CARDS: Record<string, Omit<Card, 'id'>> = {
    BITE: { name: '噛みつき', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。HP2回復。', damage: 7, heal: 2, rarity: 'SPECIAL' },
    APPARITION: { name: '霊体化', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'スケスケ(被ダメ1)を得る。廃棄。', applyPower: { id: 'INTANGIBLE', amount: 1 }, exhaust: true, rarity: 'SPECIAL' },
    J_A_X: { name: 'J.A.X.', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ムキムキ3を得る。ターン終了時3失う。', strength: 3, applyPower: { id: 'LOSE_STRENGTH', amount: 3 }, rarity: 'SPECIAL' },
    MADNESS: { name: '狂気', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札のランダムなカード1枚のコストを0にする。廃棄。', exhaust: true, rarity: 'SPECIAL' },
    RITUAL_DAGGER: { name: '儀式の短剣', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。敵を倒すと恒久+3強化。廃棄。', damage: 15, fatalPermanentDamage: 3, exhaust: true, rarity: 'RARE' },
};

export const CARDS_LIBRARY: Record<string, Omit<Card, 'id'>> = {
  ...STATUS_CARDS,
  ...CURSE_CARDS,
  ...EVENT_CARDS,
  // STARTER SET
  STRIKE: { name: 'ストライク', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージを与える。', damage: 6, rarity: 'COMMON' },
  DEFEND: { name: '防御', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを5得る。', block: 5, rarity: 'COMMON' },
  BASH: { name: '強打', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。対象にびくびく2を与える。', damage: 8, vulnerable: 2, rarity: 'COMMON' },
  NEUTRALIZE: { name: '無力化', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '3ダメージ。対象にへろへろ1を与える。', damage: 3, weak: 1, rarity: 'COMMON' },
  // Defect / Watcher placeholders
  ZAP: { name: 'ザップ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ライトニングを1つ生成する（仮:5ダメ）。', damage: 5, rarity: 'COMMON' },
  DUALCAST: { name: 'デュアルキャスト', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '一番前のオーブを2回発動する（仮:8ダメ）。', damage: 8, rarity: 'COMMON' },
  ERUPTION: { name: '憤怒', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。憤怒スタンスになる（仮:E1回復）。', damage: 9, energy: 1, rarity: 'COMMON' },
  VIGILANCE: { name: '警戒', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。平穏スタンスになる（仮:B8）。', block: 8, rarity: 'COMMON' },

  // COMMON ATTACKS
  IRON_WAVE: { name: '鉄の波', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。ブロック5を得る。', damage: 5, block: 5, rarity: 'COMMON' },
  HEADBUTT: { name: 'ヘッドバット', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。自傷2ダメージ。', damage: 9, selfDamage: 2, rarity: 'COMMON' },
  CLOTHESLINE: { name: 'ラリアット', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。対象にへろへろ2を与える。', damage: 12, weak: 2, rarity: 'COMMON' },
  DAGGER_THROW: { name: '短剣投げ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カードを1枚引く。', damage: 9, draw: 1, rarity: 'COMMON' },
  THUNDERCLAP: { name: '雷鳴', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に4ダメージとびくびく1。', damage: 4, vulnerable: 1, rarity: 'COMMON' },
  TWIN_STRIKE: { name: '双撃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '2回攻撃(5x2=10ダメージ)。', damage: 5, playCopies: 1, rarity: 'COMMON' },
  POMMEL_STRIKE: { name: '柄打ち', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カード1枚引く。', damage: 9, draw: 1, rarity: 'COMMON' },
  CLEAVE: { name: '薙ぎ払い', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に8ダメージ。', damage: 8, rarity: 'COMMON' },
  POISON_STAB: { name: '毒突き', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。ドクドク3を与える。', damage: 6, poison: 3, rarity: 'COMMON' },
  QUICK_SLASH: { name: '早業', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。カード1枚引く。', damage: 8, draw: 1, rarity: 'COMMON' },
  SLICE: { name: 'スライス', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。', damage: 5, rarity: 'COMMON' },
  BEAM_CELL: { name: 'ビーム', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。びくびく1を与える。', damage: 4, vulnerable: 1, rarity: 'COMMON' },
  COLD_SNAP: { name: '寒波', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。ブロック4を得る。', damage: 6, block: 4, rarity: 'COMMON' },
  BALL_LIGHTNING: { name: 'ボールライト', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。エネルギー1回復。', damage: 7, energy: 1, rarity: 'COMMON' },
  SWORD_BOOMERANG: { name: 'ブーメラン', cost: 1, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: 'ランダムな敵に3ダメージを3回。', damage: 3, playCopies: 2, rarity: 'COMMON' },
  BODY_SLAM: { name: 'ボディスラム', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '現在のブロック値分のダメージを与える。', damage: 0, damageBasedOnBlock: true, rarity: 'COMMON' },
  WILD_STRIKE: { name: '乱打', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。山札に「負傷」を加える。', damage: 12, addCardToDraw: { cardName: 'WOUND', count: 1 }, rarity: 'COMMON' },
  PERFECTED_STRIKE: { name: '完全な打撃', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。デッキの「ストライク」1枚につき+2。', damage: 6, damagePerStrike: 2, rarity: 'COMMON' },
  ANGER: { name: '怒り', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。捨て札に「怒り」を1枚加える。', damage: 6, addCardToHand: { cardName: 'ANGER', count: 1 }, rarity: 'COMMON' },
  FLYING_KNEE: { name: '飛び膝蹴り', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。次ターンE+1。', damage: 8, nextTurnEnergy: 1, rarity: 'COMMON' },
  EMPTY_FIST: { name: '無の拳', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。', damage: 9, rarity: 'COMMON' },
  CONSECRATE: { name: '聖別', cost: 0, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体5ダメージ。', damage: 5, rarity: 'COMMON' },
  CUT_THROUGH: { name: '切り開く', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。1ドロー。', damage: 7, draw: 1, rarity: 'COMMON' },
  SASH_WHIP: { name: '帯叩き', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。へろへろ1。', damage: 8, weak: 1, rarity: 'COMMON' },
  CLASH: { name: '口喧嘩', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。手札が全て攻撃でないと使えない。', damage: 14, rarity: 'COMMON' },

  // COMMON SKILLS
  SHIELD_BLOCK: { name: '盾構え', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを7得る。', block: 7, rarity: 'COMMON' },
  SURVIVOR: { name: '生存者', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。手札を1枚捨てる。', block: 8, promptsDiscard: 1, rarity: 'COMMON' },
  WARCRY: { name: '雄叫び', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'カード1枚引く。廃棄される。', draw: 1, exhaust: true, rarity: 'COMMON' },
  SHRUG_IT_OFF: { name: '受け流し', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。カード1枚引く。', block: 8, draw: 1, rarity: 'COMMON' },
  DEFLECT: { name: '回避', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4を得る。', block: 4, rarity: 'COMMON' },
  PIERCING_WAIL: { name: '金切り声', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にへろへろ1を与える。廃棄。', weak: 1, exhaust: true, rarity: 'COMMON' },
  CHARGE_BATTERY: { name: '充電', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。次ターンエナジー+1。', block: 7, nextTurnEnergy: 1, rarity: 'COMMON' },
  LEAP: { name: '跳躍', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック9を得る。', block: 9, rarity: 'COMMON' },
  ARMAMENTS: { name: '武装', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。手札全て強化。', block: 5, upgradeHand: true, rarity: 'COMMON' },
  ACROBATICS: { name: 'アクロバット', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON' },
  BACKFLIP: { name: 'バックフリップ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。2枚引く。', block: 5, draw: 2, rarity: 'COMMON' },
  PREPARED: { name: '準備', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '1枚引く。1枚捨てる。', draw: 1, promptsDiscard: 1, rarity: 'COMMON' },
  HOLOGRAM: { name: 'ホログラム', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック3。手札に捨て札から1枚戻す（実装簡略:3ブロック）。', block: 3, rarity: 'COMMON' },
  THIRD_EYE: { name: '第三の目', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。2枚ドロー。', block: 7, draw: 2, rarity: 'COMMON' },
  EMPTY_BODY: { name: '無の型', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。', block: 10, rarity: 'COMMON' },
  PROSTRATE: { name: '平伏', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4。エネルギー1を得る。', block: 4, energy: 1, rarity: 'COMMON' },
  SCRY: { name: '予見', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON' },
  SKIM: { name: 'スキミング', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'COMMON' },
  TURBO: { name: 'ターボ', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E2を得る。虚無追加。', energy: 2, addCardToDraw: { cardName: 'VOID', count: 1 }, rarity: 'COMMON' },
  HAVOC: { name: '大混乱', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '山札の一番上のカードを使用し、廃棄する（実装簡略:1ドロー）。', draw: 1, exhaust: true, rarity: 'COMMON' },
  TRUE_GRIT: { name: '不屈の闘志', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。手札を1枚廃棄する。', block: 7, promptsExhaust: 1, rarity: 'COMMON' },

  // RARE / UNCOMMON ATTACKS
  MIND_BLAST: { name: '精神衝撃', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '山札枚数(0)ダメージ。', damage: 0, damagePerCardInDraw: 1, rarity: 'UNCOMMON' },
  UPPERCUT: { name: 'アッパー', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '13ダメージ。へろへろ1とびくびく1。', damage: 13, weak: 1, vulnerable: 1, rarity: 'RARE' },
  BLUDGEON: { name: '大虐殺', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '32ダメージを与える。', damage: 32, rarity: 'RARE' },
  REAPER: { name: '死神', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体4ダメージ。未ブロック分HP回復。', damage: 4, lifesteal: true, rarity: 'RARE' },
  FEED: { name: '捕食', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。これで倒すと最大HP+3。', damage: 10, fatalMaxHp: 3, rarity: 'RARE' },
  IMMOLATE: { name: '焼身', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体21ダメージ。自傷2。', damage: 21, selfDamage: 2, rarity: 'RARE' },
  HEAVY_BLADE: { name: '重打', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。ムキムキ効果3倍。', damage: 14, strengthScaling: 3, rarity: 'RARE' },
  DIE_DIE_DIE: { name: '死死死', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体13ダメージ。廃棄。', damage: 13, exhaust: true, rarity: 'RARE' },
  GLASS_KNIFE: { name: '硝子の刃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE' },
  DASH: { name: '突進', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。ブロック10。', damage: 10, block: 10, rarity: 'RARE' },
  HYPERBEAM: { name: '破壊光線', cost: 3, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体26ダメージ。', damage: 26, rarity: 'RARE' },
  SUNDER: { name: '切断', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '24ダメージ。倒せばE3回復。', damage: 24, fatalEnergy: 3, rarity: 'RARE' },
  DOOM_AND_GLOOM: { name: '運命と暗黒', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体10ダメージ。', damage: 10, rarity: 'RARE' },
  CORE_SURGE: { name: 'コアサージ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '11ダメージ。キラキラ1を得る。', damage: 11, exhaust: true, applyPower: { id: 'ARTIFACT', amount: 1 }, rarity: 'RARE' },
  RAGNAROK: { name: 'ラグナロク', cost: 3, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: '5ダメージを5回与える。', damage: 5, playCopies: 4, rarity: 'RARE' },
  LESSON_LEARNED: { name: '教訓', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。倒すとランダムなカード強化。', damage: 10, fatalPermanentDamage: 3, rarity: 'RARE' },
  BRILLIANCE: { name: '光輝', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '12ダメージ。HP2回復。', damage: 12, heal: 2, rarity: 'RARE' },
  CARNAGE: { name: '殺戮', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '20ダメージ。', damage: 20, rarity: 'RARE' },
  PREDATOR: { name: 'プレデター', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。次ターン2ドロー。', damage: 15, nextTurnDraw: 2, rarity: 'RARE' },
  BLOOD_FOR_BLOOD: { name: '血には血を', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '18ダメージ。自傷1。', damage: 18, selfDamage: 1, rarity: 'RARE' },
  SEVER_SOUL: { name: '断捨離', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。手札の非攻撃カードを全廃棄。', damage: 16, promptsExhaust: 99, rarity: 'RARE' },
  WHIRLWIND: { name: '旋風刃', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE' },
  FIEND_FIRE: { name: '焚き火', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '手札を全て廃棄。1枚につき7ダメージ。', damage: 0, damagePerCardInHand: 7, rarity: 'RARE' },
  CHOKE: { name: '絞殺', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。', damage: 12, rarity: 'RARE' },
  ALL_OUT_STRIKE: { name: 'フルスイング', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。手札1枚捨てる。', damage: 10, promptsDiscard: 1, rarity: 'RARE' },
  HEEL_HOOK: { name: '踵落とし', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。E1回復。', damage: 5, energy: 1, rarity: 'RARE' },
  FINISHER: { name: 'フィニッシャー', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。今ターン使用攻撃枚数分攻撃。', damage: 6, damagePerAttackPlayed: 6, rarity: 'RARE' },
  MELTER: { name: '溶解', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。対象のブロックを除去（実装簡略:10ダメ）。', damage: 10, rarity: 'RARE' },
  SCRAPE: { name: 'スクレイプ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。ドロー3、非0コス捨てる（実装簡略:3ドロー）。', damage: 7, draw: 3, rarity: 'RARE' },
  HEMOKINESIS: { name: '血液沸騰', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: 'HP2失い、15ダメージ。', selfDamage: 2, damage: 15, rarity: 'RARE' },
  GRAND_FINALE: { name: '卒業式', cost: 0, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '山札が0枚の時のみ使用可。全体50ダメージ。', damage: 50, rarity: 'RARE' },
  DROPKICK: { name: 'ドロップキック', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。敵がびくびくならE1と1ドロー。', damage: 5, rarity: 'UNCOMMON' }, // Conditional logic omitted for brevity in types, handled as simple attack here or needs new logic. Leaving basic.

  // RARE / UNCOMMON SKILLS
  ENTRENCH: { name: 'バリケード', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: '現在のブロック値を2倍にする。', doubleBlock: true, rarity: 'RARE' },
  SHOCKWAVE: { name: '衝撃波', cost: 2, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体にへろへろ3とびくびく3。廃棄。', weak: 3, vulnerable: 3, exhaust: true, rarity: 'RARE' },
  IMPERVIOUS: { name: '鉄壁', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック30を得る。廃棄。', block: 30, exhaust: true, rarity: 'RARE' },
  OFFERING: { name: '供物', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP6消費。E2と3枚ドロー。廃棄。', selfDamage: 6, energy: 2, draw: 3, exhaust: true, rarity: 'RARE' },
  SEEING_RED: { name: '激昂', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'エネルギー2を得る。廃棄。', energy: 2, exhaust: true, rarity: 'RARE' },
  ADRENALINE: { name: 'アドレナリン', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E1を得て2枚引く。廃棄。', energy: 1, draw: 2, exhaust: true, rarity: 'RARE' },
  GHOSTLY_ARMOR: { name: '霊体化', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。廃棄。', block: 10, exhaust: true, rarity: 'RARE' },
  LEG_SWEEP: { name: '足払い', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: 'へろへろ2を与える。ブロック11。', weak: 2, block: 11, rarity: 'RARE' },
  GLACIER: { name: '氷河', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE' },
  REBOOT: { name: '再起動', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札を全て山札に戻し4枚引く。', shuffleHandToDraw: true, draw: 4, rarity: 'RARE' },
  GENETIC_ALGORITHM: { name: '遺伝的算法', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック1。使う度強くなる。廃棄。', block: 1, exhaust: true, rarity: 'RARE' },
  FORCE_FIELD: { name: '力場', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE' },
  SPOT_WEAKNESS: { name: '弱点発見', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ムキムキ+3。', strength: 3, rarity: 'RARE' },
  DISARM: { name: '武装解除', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '敵の筋力を2下げる。廃棄。', strength: -2, exhaust: true, rarity: 'RARE' },
  DUAL_WIELD: { name: '二刀流', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札の攻撃/パワーを1枚コピー。', promptsCopy: 1, rarity: 'RARE' },
  SENTINEL: { name: '歩哨', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。', block: 5, rarity: 'RARE' },
  LIMIT_BREAK: { name: '限界突破', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ムキムキを倍にする。廃棄。', doubleStrength: true, exhaust: true, rarity: 'RARE' },
  BATTLE_TRANCE: { name: 'バトルトランス', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'RARE' },
  TERROR: { name: '恐怖', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'びくびく3を与える。廃棄。', vulnerable: 3, exhaust: true, rarity: 'RARE' },
  CORPSE_EXPLOSION: { name: '死体爆破', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ドクドク6。倒すと全体に最大HPダメ。', poison: 6, applyPower: { id: 'CORPSE_EXPLOSION', amount: 1 }, rarity: 'LEGENDARY' },
  MALAISE: { name: '不快感', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: '筋力低下2とへろへろ2。廃棄。', weak: 2, applyPower: { id: 'STRENGTH_DOWN', amount: 2 }, exhaust: true, rarity: 'RARE' },
  BURST: { name: 'バースト', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '次のスキルを2回発動。', applyPower: { id: 'BURST', amount: 2 }, rarity: 'RARE' },
  ALCHEMIZE: { name: '錬金術', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ランダムなポーションを得る。', exhaust: true, rarity: 'RARE' }, // Potion logic is complex, simplify or omit effect for now.
  VAULT: { name: '跳躍', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: '追加ターンを得る。廃棄。', draw: 5, block: 20, exhaust: true, rarity: 'LEGENDARY' },
  OFFERING_BLOOD: { name: '血の契約', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP4失い、E2とドロー2。', selfDamage: 4, energy: 2, draw: 2, rarity: 'RARE' },
  CATALYST: { name: '触媒', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: 'ドクドクを2倍にする。廃棄。', poisonMultiplier: 2, exhaust: true, rarity: 'UNCOMMON' },
  APOTHEOSIS: { name: '神格化', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'この戦闘中、全カードを強化する。廃棄。', upgradeDeck: true, exhaust: true, rarity: 'RARE' },
  CALCULATED_GAMBLE: { name: '計算', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札を全て捨て、同じ枚数引く。', promptsExhaust: 99, rarity: 'UNCOMMON' }, // Reusing promptsExhaust 99 logic with specialized handler in App for Gamble

  // POWERS
  INFLAME: { name: '発火', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ムキムキを2得る。', strength: 2, rarity: 'RARE' },
  DEMON_FORM: { name: '悪魔化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ターン開始時にムキムキ2を得る。', applyPower: { id: 'DEMON_FORM', amount: 2 }, rarity: 'LEGENDARY' },
  WRAITH_FORM: { name: '死霊化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '2ターン無敵(スケスケ)になる。', applyPower: { id: 'INTANGIBLE', amount: 2 }, rarity: 'LEGENDARY' },
  ECHO_FORM: { name: '反響', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン、最初のカードを2回使用。', applyPower: { id: 'ECHO_FORM', amount: 1 }, rarity: 'LEGENDARY' },
  ELECTRODYNAMICS: { name: '電気力学', cost: 2, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '全体8ダメージ。', damage: 8, rarity: 'LEGENDARY' },
  BARRICADE: { name: 'バリケード', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ブロックがターン終了時に消えない。', applyPower: { id: 'BARRICADE', amount: 1 }, rarity: 'LEGENDARY' },
  CORRUPTION: { name: '堕落', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'スキルコスト0。使用時廃棄。', applyPower: { id: 'CORRUPTION', amount: 1 }, rarity: 'LEGENDARY' },
  FEEL_NO_PAIN: { name: '無痛', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '廃棄する度ブロック3を得る。', applyPower: { id: 'FEEL_NO_PAIN', amount: 3 }, rarity: 'RARE' },
  RUPTURE: { name: '破裂', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'HPを失う度、ムキムキ1を得る。', applyPower: { id: 'RUPTURE', amount: 1 }, rarity: 'RARE' },
  EVOLVE: { name: '進化', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '状態異常引く度1ドロー。', applyPower: { id: 'EVOLVE', amount: 1 }, rarity: 'RARE' },
  NOXIOUS_FUMES: { name: '有毒ガス', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン敵全体にドクドク2。', applyPower: { id: 'NOXIOUS_FUMES', amount: 2 }, rarity: 'RARE' },
  AFTER_IMAGE: { name: '残像', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時ブロック1。', applyPower: { id: 'AFTER_IMAGE', amount: 1 }, rarity: 'RARE' },
  THOUSAND_CUTS: { name: '千切れ', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時全体1ダメ。', applyPower: { id: 'THOUSAND_CUTS', amount: 1 }, rarity: 'RARE' },
  TOOLS_OF_THE_TRADE: { name: '商売道具', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン1枚引き1枚捨てる。', applyPower: { id: 'TOOLS_OF_THE_TRADE', amount: 1 }, rarity: 'RARE' },
  ENVENOM: { name: '猛毒', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '攻撃時ドクドク1付与。', applyPower: { id: 'ENVENOM', amount: 1 }, rarity: 'RARE' },
  STATIC_DISCHARGE: { name: '静電放電', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '被ダメ時、ランダムに5ダメ。', applyPower: { id: 'STATIC_DISCHARGE', amount: 5 }, rarity: 'RARE' },
  BUFFER: { name: 'バッファー', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '次に受けるHPダメを0にする。', applyPower: { id: 'BUFFER', amount: 1 }, rarity: 'RARE' },
  CREATIVE_AI: { name: '創造的AI', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンランダムなパワー生成。', applyPower: { id: 'CREATIVE_AI', amount: 1 }, rarity: 'LEGENDARY' },
  DEVA_FORM: { name: 'デバ化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンE+1ずつ増加。', applyPower: { id: 'DEVA_FORM', amount: 1 }, rarity: 'LEGENDARY' },
  MASTER_REALITY: { name: '真なる理', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード生成時アップグレード。', applyPower: { id: 'MASTER_REALITY', amount: 1 }, rarity: 'RARE' },
  BERSERK: { name: 'ベルセルク', cost: 0, type: CardType.POWER, target: TargetType.SELF, description: 'びくびく2を受け、エネルギー1を得る。', energy: 1, vulnerable: 2, rarity: 'RARE' },
  INFINITE_BLADES: { name: '無限の刃', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン、手札に「ナイフ」を加える。', applyPower: { id: 'INFINITE_BLADES', amount: 1 }, rarity: 'UNCOMMON' },
  ACCURACY: { name: '精度上昇', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'ナイフのダメージ+4。', applyPower: { id: 'ACCURACY', amount: 4 }, rarity: 'UNCOMMON' },
  SHIV: { name: 'ナイフ', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。廃棄。', damage: 4, exhaust: true, rarity: 'SPECIAL' },
};

// Enemy Definitions for Bestiary
export interface EnemyDef {
    name: string;
    tier: number;
    description: string;
}

export const ENEMY_LIBRARY: Record<string, EnemyDef> = {
    "スライム": { name: "スライム", tier: 1, description: "弱い魔物。分裂することもある。" },
    "穢れたゴブリン": { name: "穢れたゴブリン", tier: 1, description: "小賢しい攻撃を仕掛けてくる。" },
    "彷徨う骸骨": { name: "彷徨う骸骨", tier: 1, description: "生前の未練を残している。" },
    "闇の司祭": { name: "闇の司祭", tier: 2, description: "怪しい儀式で強化してくる。" },
    "オークの戦士": { name: "オークの戦士", tier: 2, description: "高い攻撃力を持つ。" },
    "マッドゴーレム": { name: "マッドゴーレム", tier: 3, description: "硬い装甲を持つ。" },
    "黒い霧": { name: "黒い霧", tier: 2, description: "実体がなく攻撃しづらい。" },
    "吸血コウモリ": { name: "吸血コウモリ", tier: 1, description: "集団で現れることが多い。" },
    "呪われた鎧": { name: "呪われた鎧", tier: 2, description: "防御力が高い。" },
    "影の暗殺者": { name: "影の暗殺者", tier: 2, description: "手痛い一撃に注意。" },
    "狂気の魔道士": { name: "狂気の魔道士", tier: 3, description: "様々な呪文を使う。" },
    "人食い植物": { name: "人食い植物", tier: 2, description: "動きを封じてくる。" },
    "石像ガーゴイル": { name: "石像ガーゴイル", tier: 3, description: "普段は動かないが..." },
    "亡霊騎士": { name: "亡霊騎士", tier: 3, description: "強力な剣技を使う。" },
    "洞窟蜘蛛": { name: "洞窟蜘蛛", tier: 1, description: "毒を持っている。" },
    "リザードマン": { name: "リザードマン", tier: 2, description: "素早い動きで翻弄する。" },
    "さまよう魂": { name: "さまよう魂", tier: 1, description: "悲しげな声を上げる。" },
    "鉄の処女": { name: "鉄の処女", tier: 3, description: "近づくと危険だ。" },
    "キメラ": { name: "キメラ", tier: 3, description: "複数の生物が混ざっている。" },
};

export const STARTING_DECK_TEMPLATE = [
  'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE',
  'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND',
  'BASH', 'IRON_WAVE'
];