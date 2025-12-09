
import { Card, CardType, TargetType, Relic, Potion } from './types';

export const INITIAL_HP = 75;
export const INITIAL_ENERGY = 3;
export const HAND_SIZE = 5;

// SVG Data URI for a cool 8-bit Fantasy Hero (Knight)
const HERO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M4 11h2v2H4zM2 13h2v8H2zM4 19h2v2H4zM16 11h2v8h-2z" fill="#8b0000"/>
  <path d="M4 13h2v6H4zM16 13h2v4h-2z" fill="#b71c1c"/>
  <path d="M8 9h8v2H8zM6 11h12v7H6z" fill="#37474f"/>
  <path d="M8 11h8v6H8z" fill="#546e7a"/>
  <path d="M10 11h4v4h-4z" fill="#78909c"/>
  <path d="M8 18h3v4H8zM13 18h3v4h-3z" fill="#263238"/>
  <path d="M9 2h1v2H9z M10 1h2v3h-2z M13 1h1v3h-1z M14 2h1v2h-1z" fill="#FFD700"/>
  <path d="M8 3h8v2H8z" fill="#FFD700"/>
  <path d="M8 5h1v3H8z M15 5h1v3h-1z" fill="#FFD700"/>
  <path d="M9 5h6v3H9z" fill="#ffccbc"/>
  <path d="M10 8h4v1h-4z" fill="#ffccbc"/> 
  <path d="M10 6h1v1h-1z M13 6h1v1h-1z" fill="#1565C0"/> 
  <path d="M6 11h2v1H6zM16 11h2v1h-2zM8 14h8v1H8z" fill="#FFD700"/>
  <path d="M19 2h2v10h-2z" fill="#cfd8dc"/>
  <path d="M19 2h1v10h-1z" fill="#eceff1"/>
  <path d="M17 12h6v2h-6z" fill="#ffb300"/>
  <path d="M19 14h2v3h-2z" fill="#5d4037"/>
  <path d="M6 13h2v4H6z" fill="#455a64"/>
</svg>
`;

export const HERO_IMAGE_DATA = `data:image/svg+xml;base64,${btoa(HERO_SVG)}`;

// --- RELICS ---
export const RELIC_LIBRARY: Record<string, Relic> = {
    BURNING_BLOOD: { id: 'BURNING_BLOOD', name: '給食の余り', description: '戦闘終了時、HPを6回復する。', rarity: 'STARTER' },
    SNAKE_RING: { id: 'SNAKE_RING', name: '秘密のメモ帳', description: '戦闘開始時、追加で2枚カードを引く。', rarity: 'STARTER' },
    HOLY_WATER: { id: 'HOLY_WATER', name: 'スポーツドリンク', description: '戦闘開始時、エネルギーを1得る。', rarity: 'STARTER' },
    
    VAJRA: { id: 'VAJRA', name: '金の定規', description: '戦闘開始時、筋力1を得る。', rarity: 'COMMON', price: 150 },
    ANCHOR: { id: 'ANCHOR', name: '重いランドセル', description: '1ターン目の開始時、ブロック10を得る。', rarity: 'COMMON', price: 150 },
    BAG_OF_PREP: { id: 'BAG_OF_PREP', name: '予習セット', description: '戦闘開始時、追加で2枚引く。', rarity: 'COMMON', price: 150 },
    BLOOD_VIAL: { id: 'BLOOD_VIAL', name: '保健室の飴', description: '戦闘開始時、HPを2回復する。', rarity: 'COMMON', price: 150 },
    
    PENTOGRAPH: { id: 'PENTOGRAPH', name: '習字セット', description: 'ボス戦開始時、HPを25回復する。', rarity: 'RARE', price: 250 },
    BRONZE_SCALES: { id: 'BRONZE_SCALES', name: '画鋲', description: '戦闘開始時、トゲ3(反撃)を得る。', rarity: 'RARE', price: 200 },
    
    MEMBERSHIP_CARD: { id: 'MEMBERSHIP_CARD', name: '図書カード', description: 'ショップの商品が安くなる。', rarity: 'SHOP', price: 100 },
    WAFFLE: { id: 'WAFFLE', name: '揚げパン', description: '最大HP+7。HP全回復。', rarity: 'SHOP', price: 300 },
    
    SOZU: { id: 'SOZU', name: '持ち込み禁止令', description: '毎ターンE+1。ポーション使用不可。', rarity: 'BOSS' },
    CURSED_KEY: { id: 'CURSED_KEY', name: '理科室の鍵', description: '毎ターンE+1。宝箱から呪い出現。', rarity: 'BOSS' },
    PHILOSOPHER_STONE: { id: 'PHILOSOPHER_STONE', name: '謎の石', description: '毎ターンE+1。敵の筋力+1。', rarity: 'BOSS' },

    // Event Relics
    GOLDEN_IDOL: { id: 'GOLDEN_IDOL', name: '金色の像', description: '敵が落とすゴールドが25%増える。', rarity: 'RARE' },
    MUTAGENIC_STRENGTH: { id: 'MUTAGENIC_STRENGTH', name: '成長期', description: '戦闘開始時、筋力3を得る。ターン終了時失う。', rarity: 'RARE' },
    WARPED_TONGS: { id: 'WARPED_TONGS', name: 'ゆがんだフォーク', description: 'ターン開始時、手札のランダムなカードを強化する。', rarity: 'RARE' },
    RED_MASK: { id: 'RED_MASK', name: '戦隊のお面', description: '戦闘開始時、敵全体に弱体1を与える。', rarity: 'RARE' },
    NECRONOMICON: { id: 'NECRONOMICON', name: '禁断の参考書', description: 'コスト2以上の攻撃を1ターン1回2度発動。', rarity: 'RARE' },
    ENCHIRIDION: { id: 'ENCHIRIDION', name: '分厚い辞書', description: '戦闘開始時、ランダムなパワーカードを手札に加える。', rarity: 'RARE' },
    NILRYS_CODEX: { id: 'NILRYS_CODEX', name: '秘密の攻略本', description: 'ターン終了時、ランダムな3枚から1枚を選んで手札に加える。', rarity: 'RARE' },
    SPIRIT_POOP: { id: 'SPIRIT_POOP', name: '犬のフン', description: 'スコア計算時に1点減点される。', rarity: 'COMMON' }
};

// --- POTIONS ---
export const POTION_LIBRARY: Record<string, Omit<Potion, 'id'>> = {
    FIRE_POTION: { templateId: 'FIRE_POTION', name: 'コーラ', description: '敵1体に20ダメージを与える。', rarity: 'COMMON', color: '#f87171', price: 50 },
    BLOCK_POTION: { templateId: 'BLOCK_POTION', name: '牛乳', description: 'ブロック12を得る。', rarity: 'COMMON', color: '#60a5fa', price: 50 },
    STRENGTH_POTION: { templateId: 'STRENGTH_POTION', name: 'プロテイン', description: '筋力2を得る。', rarity: 'COMMON', color: '#ef4444', price: 75 },
    ENERGY_POTION: { templateId: 'ENERGY_POTION', name: 'エナジードリンク', description: 'エネルギー2を得る。', rarity: 'COMMON', color: '#fbbf24', price: 50 },
    WEAK_POTION: { templateId: 'WEAK_POTION', name: '変なジュース', description: '敵1体に弱体3を与える。', rarity: 'COMMON', color: '#9ca3af', price: 40 },
    HEALTH_POTION: { templateId: 'HEALTH_POTION', name: 'フルーツポンチ', description: 'HPを15回復する。', rarity: 'RARE', color: '#4ade80', price: 100 },
};

export const TRUE_BOSS = {
    id: 'THE_HEART',
    name: '校長先生',
    maxHp: 500,
    nextIntent: { type: 'BUFF', value: 0 }
};

// --- CARDS ---

// Special Status Cards
export const STATUS_CARDS: Record<string, Omit<Card, 'id'>> = {
    WOUND: { name: '負傷', cost: 0, type: CardType.STATUS, description: '使用不可。', unplayable: true, rarity: 'SPECIAL' },
    DAZED: { name: 'めまい', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
    VOID: { name: '虚無', cost: 0, type: CardType.STATUS, description: '使用不可。引いた時E1失う。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
    BURN: { name: 'やほど', cost: 0, type: CardType.STATUS, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    SLIMED: { name: '鼻水', cost: 1, type: CardType.STATUS, description: '使用すると廃棄される。', exhaust: true, rarity: 'SPECIAL' }
};

// Curse Cards
export const CURSE_CARDS: Record<string, Omit<Card, 'id'>> = {
    PAIN: { name: '腹痛', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、カードを使うたび1ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    REGRET: { name: '後悔', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、手札枚数分ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    DOUBT: { name: '不安', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、弱体1を得る。', unplayable: true, rarity: 'SPECIAL' },
    SHAME: { name: '恥', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時、脆弱1を得る。', unplayable: true, rarity: 'SPECIAL' },
    WRITHE: { name: '悩み', cost: 0, type: CardType.CURSE, description: '使用不可。初期手札に来る。', unplayable: true, innate: true, rarity: 'SPECIAL' },
    NORMALITY: { name: '退屈', cost: 0, type: CardType.CURSE, description: '使用不可。手札にある間、3枚までしかカードを使えない。', unplayable: true, rarity: 'SPECIAL' },
    INJURY: { name: '骨折', cost: 0, type: CardType.CURSE, description: '使用不可。', unplayable: true, rarity: 'SPECIAL' },
    PARASITE: { name: '寄生虫', cost: 0, type: CardType.CURSE, description: '使用不可。デッキから消滅すると最大HP-3。', unplayable: true, rarity: 'SPECIAL' },
    DECAY: { name: '腐敗', cost: 0, type: CardType.CURSE, description: '使用不可。ターン終了時2ダメージ。', unplayable: true, rarity: 'SPECIAL' },
    CLUMSINESS: { name: 'ドジ', cost: 0, type: CardType.CURSE, description: '使用不可。廃棄。', unplayable: true, exhaust: true, rarity: 'SPECIAL' },
};

// Event Specific Cards
export const EVENT_CARDS: Record<string, Omit<Card, 'id'>> = {
    BITE: { name: 'つまみ食い', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。HP2回復。', damage: 7, heal: 2, rarity: 'SPECIAL' },
    APPARITION: { name: 'ドロン', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'スケスケ(被ダメ1)を得る。廃棄。', applyPower: { id: 'INTANGIBLE', amount: 1 }, exhaust: true, rarity: 'SPECIAL' },
    J_A_X: { name: '筋肉注射', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '筋力3を得る。ターン終了時3失う。', strength: 3, applyPower: { id: 'LOSE_STRENGTH', amount: 3 }, rarity: 'SPECIAL' },
    MADNESS: { name: 'パニック', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札のランダムなカード1枚のコストを0にする。廃棄。', exhaust: true, rarity: 'SPECIAL' },
};

export const CARDS_LIBRARY: Record<string, Omit<Card, 'id'>> = {
  ...STATUS_CARDS,
  ...CURSE_CARDS,
  ...EVENT_CARDS,
  // STARTER SET
  STRIKE: { name: 'えんぴつ攻撃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージを与える。', damage: 6, rarity: 'COMMON' },
  DEFEND: { name: 'ノートで防御', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを5得る。', block: 5, rarity: 'COMMON' },
  BASH: { name: 'ランドセルタックル', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。対象に脆弱2を与える。', damage: 8, vulnerable: 2, rarity: 'COMMON' },
  NEUTRALIZE: { name: '先生にチクる', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '3ダメージ。対象に弱体1を与える。', damage: 3, weak: 1, rarity: 'COMMON' },

  // COMMON ATTACKS
  IRON_WAVE: { name: '上履きキック', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。ブロック5を得る。', damage: 5, block: 5, rarity: 'COMMON' },
  HEADBUTT: { name: '頭突き', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。自傷2ダメージ。', damage: 9, selfDamage: 2, rarity: 'COMMON' },
  CLOTHESLINE: { name: 'ラリアット', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。対象に弱体2を与える。', damage: 12, weak: 2, rarity: 'COMMON' },
  DAGGER_THROW: { name: 'チョーク投げ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カードを1枚引く。', damage: 9, draw: 1, rarity: 'COMMON' },
  THUNDERCLAP: { name: '大声', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に4ダメージと脆弱1。', damage: 4, vulnerable: 1, rarity: 'COMMON' },
  TWIN_STRIKE: { name: '往復ビンタ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '2回攻撃(5x2=10ダメージ)。', damage: 5, playCopies: 1, rarity: 'COMMON' },
  POMMEL_STRIKE: { name: '定規で叩く', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。カード1枚引く。', damage: 9, draw: 1, rarity: 'COMMON' },
  CLEAVE: { name: '雑巾がけ', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '敵全体に8ダメージ。', damage: 8, rarity: 'COMMON' },
  POISON_STAB: { name: '毒舌', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。毒3を与える。', damage: 6, poison: 3, rarity: 'COMMON' },
  QUICK_SLASH: { name: '早弁', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。カード1枚引く。', damage: 8, draw: 1, rarity: 'COMMON' },
  SLICE: { name: 'ひっかく', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。', damage: 5, rarity: 'COMMON' },
  BEAM_CELL: { name: 'レーザーポインター', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '4ダメージ。脆弱1を与える。', damage: 4, vulnerable: 1, rarity: 'COMMON' },
  COLD_SNAP: { name: '寒いギャグ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。ブロック4を得る。', damage: 6, block: 4, rarity: 'COMMON' },
  BALL_LIGHTNING: { name: '静電気', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。エネルギー1回復。', damage: 7, energy: 1, rarity: 'COMMON' },
  SWORD_BOOMERANG: { name: 'ブーメラン', cost: 1, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: 'ランダムな敵に3ダメージを3回。', damage: 3, playCopies: 2, rarity: 'COMMON' },
  BODY_SLAM: { name: 'ボディスラム', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '現在のブロック値分のダメージを与える。', damage: 0, damageBasedOnBlock: true, rarity: 'COMMON' },
  WILD_STRIKE: { name: '暴れる', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。山札に「負傷」を加える。', damage: 12, addCardToDraw: { cardName: 'WOUND', count: 1 }, rarity: 'COMMON' },
  PERFECTED_STRIKE: { name: '完璧な回答', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。デッキの「えんぴつ攻撃」1枚につき+2。', damage: 6, damagePerStrike: 2, rarity: 'COMMON' },
  ANGER: { name: 'キレる', cost: 0, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。捨て札に「キレる」を1枚加える。', damage: 6, addCardToHand: { cardName: 'ANGER', count: 1 }, rarity: 'COMMON' },
  FLYING_KNEE: { name: '飛び膝蹴り', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。次ターンE+1。', damage: 8, energy: 1, rarity: 'COMMON' },
  EMPTY_FIST: { name: 'グーパンチ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '9ダメージ。', damage: 9, rarity: 'COMMON' },
  CONSECRATE: { name: '掃除の時間', cost: 0, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体5ダメージ。', damage: 5, rarity: 'COMMON' },
  CUT_THROUGH: { name: '列に割り込む', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。1ドロー。', damage: 7, draw: 1, rarity: 'COMMON' },
  SASH_WHIP: { name: 'タオル攻撃', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージ。弱体1。', damage: 8, weak: 1, rarity: 'COMMON' },

  // COMMON SKILLS
  SHIELD_BLOCK: { name: 'ノートで防御', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロックを7得る。', block: 7, rarity: 'COMMON' },
  SURVIVOR: { name: '生き残り', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。手札を1枚捨てる。', block: 8, promptsDiscard: 1, rarity: 'COMMON' },
  WARCRY: { name: '雄叫び', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'カード1枚引く。廃棄される。', draw: 1, exhaust: true, rarity: 'COMMON' },
  SHRUG_IT_OFF: { name: '知らんぷり', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック8。カード1枚引く。', block: 8, draw: 1, rarity: 'COMMON' },
  DEFLECT: { name: '回避', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4を得る。', block: 4, rarity: 'COMMON' },
  PIERCING_WAIL: { name: '泣き叫ぶ', cost: 1, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体に弱体1を与える。廃棄。', weak: 1, exhaust: true, rarity: 'COMMON' },
  CHARGE_BATTERY: { name: '充電', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。次ターンエナジー+1。', block: 7, energy: 1, rarity: 'COMMON' },
  LEAP: { name: 'ジャンプ', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック9を得る。', block: 9, rarity: 'COMMON' },
  ARMAMENTS: { name: '装備点検', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。手札全て強化。', block: 5, upgradeHand: true, rarity: 'COMMON' },
  ACROBATICS: { name: '側転', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON' },
  BACKFLIP: { name: 'バック転', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。2枚引く。', block: 5, draw: 2, rarity: 'COMMON' },
  PREPARED: { name: '準備', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '1枚引く。1枚捨てる。', draw: 1, promptsDiscard: 1, rarity: 'COMMON' },
  HOLOGRAM: { name: 'カンニング', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック3。手札に捨て札から1枚戻す。', block: 3, rarity: 'COMMON' },
  THIRD_EYE: { name: '予習', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック7。2枚ドロー。', block: 7, draw: 2, rarity: 'COMMON' },
  EMPTY_BODY: { name: '瞑想', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。', block: 10, rarity: 'COMMON' },
  PROSTRATE: { name: '土下座', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック4。エネルギー1を得る。', block: 4, energy: 1, rarity: 'COMMON' },
  SCRY: { name: '先読み', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。1枚捨てる。', draw: 3, promptsDiscard: 1, rarity: 'COMMON' },
  SKIM: { name: '速読', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'COMMON' },
  TURBO: { name: 'カフェイン', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E2を得る。虚無追加。', energy: 2, addCardToDraw: { cardName: 'VOID', count: 1 }, rarity: 'COMMON' },

  // RARE / UNCOMMON ATTACKS
  UPPERCUT: { name: 'アッパー', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '13ダメージ。弱体1と脆弱1。', damage: 13, weak: 1, vulnerable: 1, rarity: 'RARE' },
  BLUDGEON: { name: '大打撃', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '32ダメージを与える。', damage: 32, rarity: 'RARE' },
  REAPER: { name: '給食当番', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体4ダメージ。未ブロック分HP回復。', damage: 4, lifesteal: true, rarity: 'RARE' },
  FEED: { name: 'いただきます', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。これで倒すと最大HP+3。', damage: 10, fatalMaxHp: 3, rarity: 'RARE' },
  IMMOLATE: { name: '焼却炉', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体21ダメージ。自傷2。', damage: 21, selfDamage: 2, rarity: 'RARE' },
  HEAVY_BLADE: { name: '重いバット', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '14ダメージ。筋力効果3倍。', damage: 14, strengthScaling: 3, rarity: 'RARE' },
  DIE_DIE_DIE: { name: '宿題宿題', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体13ダメージ。廃棄。', damage: 13, exhaust: true, rarity: 'RARE' },
  GLASS_KNIFE: { name: '硝子のカケラ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE' },
  DASH: { name: 'ダッシュ', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。ブロック10。', damage: 10, block: 10, rarity: 'RARE' },
  HYPERBEAM: { name: '目からビーム', cost: 3, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体26ダメージ。', damage: 26, rarity: 'RARE' },
  SUNDER: { name: '破る', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '24ダメージ。倒せばE3回復。', damage: 24, fatalEnergy: 3, rarity: 'RARE' },
  DOOM_AND_GLOOM: { name: '絶望と暗黒', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体10ダメージ。', damage: 10, rarity: 'RARE' },
  CORE_SURGE: { name: '暴走', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '11ダメージ。アーティファクト1を得る。', damage: 11, exhaust: true, applyPower: { id: 'ARTIFACT', amount: 1 }, rarity: 'RARE' },
  RAGNAROK: { name: '大暴れ', cost: 3, type: CardType.ATTACK, target: TargetType.RANDOM_ENEMY, description: '5ダメージを5回与える。', damage: 5, playCopies: 4, rarity: 'RARE' },
  LESSON_LEARNED: { name: '学習', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。倒すとランダムなカード強化。', damage: 10, fatalPermanentDamage: 3, rarity: 'RARE' },
  BRILLIANCE: { name: 'ひらめき', cost: 1, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '12ダメージ。HP2回復。', damage: 12, heal: 2, rarity: 'RARE' },
  CARNAGE: { name: '滅多打ち', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '20ダメージ。', damage: 20, rarity: 'RARE' },
  PREDATOR: { name: '捕食者', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。2ドロー。', damage: 15, draw: 2, rarity: 'RARE' },
  BLOOD_FOR_BLOOD: { name: 'やられたらやり返す', cost: 3, type: CardType.ATTACK, target: TargetType.ENEMY, description: '18ダメージ。自傷1。', damage: 18, selfDamage: 1, rarity: 'RARE' },
  SEVER_SOUL: { name: '断捨離', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '16ダメージ。手札の非攻撃カードを全廃棄。', damage: 16, promptsExhaust: 99, rarity: 'RARE' },
  WHIRLWIND: { name: '大回転', cost: 2, type: CardType.ATTACK, target: TargetType.ALL_ENEMIES, description: '全体8ダメージを2回。', damage: 8, playCopies: 1, rarity: 'RARE' },
  FIEND_FIRE: { name: '焚き火', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '手札を全て廃棄。1枚につき7ダメージ。', damage: 0, damagePerCardInHand: 7, rarity: 'RARE' },
  CHOKE: { name: '締め技', cost: 2, type: CardType.ATTACK, target: TargetType.ENEMY, description: '12ダメージ。', damage: 12, rarity: 'RARE' },
  ALL_OUT_STRIKE: { name: 'フルスイング', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。手札1枚捨てる。', damage: 10, promptsDiscard: 1, rarity: 'RARE' },
  HEEL_HOOK: { name: 'かかと落とし', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '5ダメージ。E1回復。', damage: 5, energy: 1, rarity: 'RARE' },
  FINISHER: { name: 'とどめ', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '6ダメージ。今ターン使用攻撃枚数分攻撃。', damage: 6, damagePerAttackPlayed: 6, rarity: 'RARE' },
  MELTER: { name: '溶解液', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '10ダメージ。対象のブロックを除去。', damage: 10, rarity: 'RARE' },
  SCRAPE: { name: '引っかく', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '7ダメージ。ドロー3、非0コス捨てる。', damage: 7, draw: 3, rarity: 'RARE' },
  RITUAL_DAGGER: { name: '儀式の短剣', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: '15ダメージ。敵を倒すと恒久+3強化。廃棄。', damage: 15, fatalPermanentDamage: 3, exhaust: true, rarity: 'RARE' },
  HEMOKINESIS: { name: '血祭り', cost: 1, type: CardType.ATTACK, target: TargetType.ENEMY, description: 'HP2失い、15ダメージ。', selfDamage: 2, damage: 15, rarity: 'RARE' },

  // RARE / UNCOMMON SKILLS
  ENTRENCH: { name: 'バリケード', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: '現在のブロック値を2倍にする。', doubleBlock: true, rarity: 'RARE' },
  SHOCKWAVE: { name: '衝撃波', cost: 2, type: CardType.SKILL, target: TargetType.ALL_ENEMIES, description: '敵全体に弱体3と脆弱3。廃棄。', weak: 3, vulnerable: 3, exhaust: true, rarity: 'RARE' },
  IMPERVIOUS: { name: '鉄壁', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック30を得る。廃棄。', block: 30, exhaust: true, rarity: 'RARE' },
  OFFERING: { name: 'お供え', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP6消費。E2と3枚ドロー。廃棄。', selfDamage: 6, energy: 2, draw: 3, exhaust: true, rarity: 'RARE' },
  SEEING_RED: { name: '激昂', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'エネルギー2を得る。廃棄。', energy: 2, exhaust: true, rarity: 'RARE' },
  ADRENALINE: { name: 'アドレナリン', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'E1を得て2枚引く。廃棄。', energy: 1, draw: 2, exhaust: true, rarity: 'RARE' },
  GHOSTLY_ARMOR: { name: '幽霊の鎧', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック10。廃棄。', block: 10, exhaust: true, rarity: 'RARE' },
  LEG_SWEEP: { name: '足払い', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: '弱体2を与える。ブロック11。', weak: 2, block: 11, rarity: 'RARE' },
  GLACIER: { name: 'かまくら', cost: 2, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE' },
  REBOOT: { name: '再起動', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '手札を全て山札に戻し4枚引く。', shuffleHandToDraw: true, draw: 4, rarity: 'RARE' },
  GENETIC_ALGORITHM: { name: '学習アルゴリズム', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック1。使う度強くなる。廃棄。', block: 1, exhaust: true, rarity: 'RARE' },
  FORCE_FIELD: { name: 'バリア', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック12。', block: 12, rarity: 'RARE' },
  SPOT_WEAKNESS: { name: '弱点発見', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '筋力+3。', strength: 3, rarity: 'RARE' },
  DISARM: { name: '武器奪取', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '敵の筋力を2下げる。廃棄。', strength: -2, exhaust: true, rarity: 'RARE' },
  DUAL_WIELD: { name: '二刀流', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札の攻撃/パワーを1枚コピー。', promptsCopy: 1, rarity: 'RARE' },
  SENTINEL: { name: '見張り', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: 'ブロック5。', block: 5, rarity: 'RARE' },
  LIMIT_BREAK: { name: '限界突破', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '筋力を倍にする。廃棄。', doubleStrength: true, exhaust: true, rarity: 'RARE' },
  BATTLE_TRANCE: { name: '集中モード', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: '3枚引く。', draw: 3, rarity: 'RARE' },
  TERROR: { name: '恐怖', cost: 1, type: CardType.SKILL, target: TargetType.ENEMY, description: '脆弱3を与える。廃棄。', vulnerable: 3, exhaust: true, rarity: 'RARE' },
  CORPSE_EXPLOSION: { name: '死体爆破', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: '毒6。倒すと全体に最大HPダメ。', poison: 6, applyPower: { id: 'CORPSE_EXPLOSION', amount: 1 }, rarity: 'LEGENDARY' },
  MALAISE: { name: '不快感', cost: 2, type: CardType.SKILL, target: TargetType.ENEMY, description: '筋力低下2と弱体2。廃棄。', weak: 2, applyPower: { id: 'STRENGTH_DOWN', amount: 2 }, exhaust: true, rarity: 'RARE' },
  BURST: { name: 'バースト', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '次のスキルを2回発動。', applyPower: { id: 'BURST', amount: 2 }, rarity: 'RARE' },
  ALCHEMIZE: { name: '錬金術', cost: 1, type: CardType.SKILL, target: TargetType.SELF, description: '手札にランダムなカードを加える。', addCardToHand: { cardName: 'BASH', count: 1 }, exhaust: true, rarity: 'RARE' },
  VAULT: { name: '大ジャンプ', cost: 3, type: CardType.SKILL, target: TargetType.SELF, description: '追加ターンを得る。廃棄。', draw: 5, block: 20, exhaust: true, rarity: 'LEGENDARY' },
  OFFERING_BLOOD: { name: '血の契約', cost: 0, type: CardType.SKILL, target: TargetType.SELF, description: 'HP4失い、E2とドロー2。', selfDamage: 4, energy: 2, draw: 2, rarity: 'RARE' },

  // POWERS
  INFLAME: { name: '発火', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '筋力を2得る。', strength: 2, rarity: 'RARE' },
  DEMON_FORM: { name: '悪魔化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ターン開始時に筋力2を得る。', applyPower: { id: 'DEMON_FORM', amount: 2 }, rarity: 'LEGENDARY' },
  WRAITH_FORM: { name: '死霊化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '2ターン無敵(被ダメ1)になる。', applyPower: { id: 'INTANGIBLE', amount: 2 }, rarity: 'LEGENDARY' },
  ECHO_FORM: { name: '反響', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン、最初のカードを2回使用。', applyPower: { id: 'ECHO_FORM', amount: 1 }, rarity: 'LEGENDARY' },
  ELECTRODYNAMICS: { name: '電気ショック', cost: 2, type: CardType.POWER, target: TargetType.ALL_ENEMIES, description: '全体8ダメージ。', damage: 8, rarity: 'LEGENDARY' },
  BARRICADE: { name: 'バリケード', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'ブロックがターン終了時に消えない。', applyPower: { id: 'BARRICADE', amount: 1 }, rarity: 'LEGENDARY' },
  CORRUPTION: { name: '堕落', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: 'スキルコスト0。使用時廃棄。', applyPower: { id: 'CORRUPTION', amount: 1 }, rarity: 'LEGENDARY' },
  FEEL_NO_PAIN: { name: '無痛', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '廃棄する度ブロック3を得る。', applyPower: { id: 'FEEL_NO_PAIN', amount: 3 }, rarity: 'RARE' },
  RUPTURE: { name: '破裂', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'HPを失う度、筋力1を得る。', applyPower: { id: 'RUPTURE', amount: 1 }, rarity: 'RARE' },
  EVOLVE: { name: '進化', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '状態異常引く度1ドロー。', applyPower: { id: 'EVOLVE', amount: 1 }, rarity: 'RARE' },
  NOXIOUS_FUMES: { name: '有毒ガス', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン敵全体に毒2。', applyPower: { id: 'NOXIOUS_FUMES', amount: 2 }, rarity: 'RARE' },
  AFTER_IMAGE: { name: '残像', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時ブロック1。', applyPower: { id: 'AFTER_IMAGE', amount: 1 }, rarity: 'RARE' },
  THOUSAND_CUTS: { name: 'あばれる', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: 'カード使用時全体1ダメ。', applyPower: { id: 'THOUSAND_CUTS', amount: 1 }, rarity: 'RARE' },
  TOOLS_OF_THE_TRADE: { name: '商売道具', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '毎ターン1枚引き1枚捨てる。', applyPower: { id: 'TOOLS_OF_THE_TRADE', amount: 1 }, rarity: 'RARE' },
  ENVENOM: { name: '猛毒', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '攻撃時毒1付与。', applyPower: { id: 'ENVENOM', amount: 1 }, rarity: 'RARE' },
  STATIC_DISCHARGE: { name: '静電放電', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: '被ダメ時、ランダムに5ダメ。', applyPower: { id: 'STATIC_DISCHARGE', amount: 1 }, rarity: 'RARE' },
  BUFFER: { name: 'バッファー', cost: 2, type: CardType.POWER, target: TargetType.SELF, description: '次に受けるHPダメを0にする。', applyPower: { id: 'BUFFER', amount: 1 }, rarity: 'RARE' },
  CREATIVE_AI: { name: '創造的AI', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンランダムなパワー生成。', applyPower: { id: 'CREATIVE_AI', amount: 1 }, rarity: 'LEGENDARY' },
  DEVA_FORM: { name: 'デバ化', cost: 3, type: CardType.POWER, target: TargetType.SELF, description: '毎ターンE+1ずつ増加。', applyPower: { id: 'DEVA_FORM', amount: 1 }, rarity: 'LEGENDARY' },
  MASTER_REALITY: { name: '真なる理', cost: 1, type: CardType.POWER, target: TargetType.SELF, description: 'カード生成時アップグレード。', applyPower: { id: 'MASTER_REALITY', amount: 1 }, rarity: 'RARE' },
  BERSERK: { name: 'バーサク', cost: 0, type: CardType.POWER, target: TargetType.SELF, description: '脆弱2を受け、エネルギー1を得る。', energy: 1, vulnerable: 2, rarity: 'RARE' }
};

export const STARTING_DECK_TEMPLATE = [
  'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE',
  'DEFEND', 'DEFEND', 'DEFEND', 'DEFEND',
  'BASH', 'IRON_WAVE'
];
