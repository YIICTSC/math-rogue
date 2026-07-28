
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, X, RotateCcw, Swords, Shield, RefreshCw, Zap, Skull, ChevronsRight, ChevronLeft, ChevronRight, Clock, Ghost, ArrowRightLeft, Gift, ShoppingBag, Hammer, Coins, Plus, Crosshair, Heart, Move, AlertTriangle, Hourglass, Maximize2, Minimize2, Wind, Anchor, Flame, Activity, ArrowUp, Dna, Shuffle, Star, HelpCircle, Book, AlertCircle, Flag, Music, Mic, Milk, Battery, ShieldCheck, Bomb, Utensils, PenTool, Circle, ArrowRight, Target, Package } from 'lucide-react';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { AnswerMode, AssignmentAnswerResult, AssignmentPayload, GameMode, LanguageMode, MiniGameDebugPreview } from '../types';
import MiniGameProblemChallenge from './MiniGameProblemChallenge';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left
type GamePhase = 'SETUP' | 'BATTLE' | 'REWARD' | 'UPGRADE_EVENT' | 'SHOP' | 'VICTORY' | 'GAME_OVER' | 'MATH';
type CardEffectType = 'NORMAL' | 'COUNTER' | 'PUSH' | 'PULL' | 'RECOIL' | 'DASH_ATTACK' | 'FURTHEST' | 'PIERCE' | 'TELEPORT' | 'STUN' | 'HEAL' | 'DRAIN' | 'PIERCE_DASH';

interface KCard {
    id: string;
    name: string;
    type: 'ATTACK' | 'MOVE' | 'UTILITY';
    range: number[]; // Relative range, e.g. [1, 2] means 1 and 2 tiles in front
    damage: number;
    shield?: number;
    cooldown: number; 
    currentCooldown: number; // Runtime state
    color: string;
    icon: React.ReactNode;
    description: string;
    energyCost: number; 
    
    // Upgrade System
    maxSlots: number; // Max upgrade capacity
    usedSlots: number; // Current upgrades count
    effectType?: CardEffectType;
}

interface KConsumable {
    id: string;
    type: 'HEAL' | 'BARRIER' | 'CD_REDUCE' | 'BOMB' | 'STRENGTH';
    name: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    value: number;
}

interface KFieldItem {
    id: string;
    pos: number;
    data: KConsumable;
}

interface KEntity {
    id: string;
    type: 'PLAYER' | 'ENEMY';
    name: string;
    pos: number; // 0-6
    facing: Facing;
    maxHp: number;
    hp: number;
    spriteName: string;
    
    // Enemy AI
    intent?: {
        type: 'ATTACK' | 'MOVE' | 'WAIT' | 'SUMMON' | 'SPECIAL';
        damage?: number;
        range?: number[];
        targetPos?: number;
        timer: number; // Turns until execution
        summonTarget?: string; // Name of enemy to summon
        specialName?: string; // Name of special ability
    };
    
    // Status
    shield: number;
    barrier: number; // New: Perfect Guard counts
    strength: number; // New: Temporary Strength buff
    bossPhase?: number; // For Final Boss (1, 2, 3)
    specialCD?: number; // For Boss Special Abilities
}

interface KRelic {
    id: string;
    name: string;
    desc: string;
    price: number;
}

interface KochoVFX {
    id: string;
    type: 'SLASH' | 'BLAST' | 'TEXT' | 'BLOCK' | 'HEAL' | 'BUFF' | 'COUNTER' | 'IMPACT' | 'WARP' | 'EVOLVE' | 'SUMMON' | 'BARRIER' | 'STUN' | 'PUSH' | 'PULL' | 'AFTERIMAGE';
    pos: number;
    text?: string | number;
    color?: string;
    direction?: Facing;
    durationMs?: number;
    sourceCardName?: string;
}

interface KochoAnnouncement {
    id: string;
    title: string;
    subtitle?: string;
    tone: 'battle' | 'danger' | 'phase' | 'special';
}

type UpgradeType = 'DMG_1' | 'DMG_1_CD_1' | 'DMG_2_CD_3' | 'CD_MINUS_1' | 'CD_MINUS_2' | 'CD_MINUS_4_DMG_MINUS_1' | 'SLOT_1' | 'SLOT_1_CD_MINUS_1' | 'SACRIFICE' | 'GAMBLE';

interface UpgradeOffer {
    type: UpgradeType;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface KochoGameState {
    phase: GamePhase;
    pendingPhase: GamePhase | null; // For Math intermission
    battleStage: number; // 1 to 7
    battleSequence: number; // 0: 1st Mob Wave, 1: 2nd Mob Wave, 2: MidBoss (Used for Stage 2+)
    wave: number;
    maxWaves: number;
    turn: number; // Total turns in current battle
    totalTurns: number; // New: Total turns across the run
    gridSize: number;
    player: KEntity;
    enemies: KEntity[];
    hand: KCard[];
    queue: KCard[]; // Max 3
    consumables: KConsumable[]; // Max 3
    fieldItems: KFieldItem[]; // Items on the ground
    status: 'PLAYING' | 'EXECUTING' | 'GAME_OVER' | 'VICTORY' | 'WAVE_CLEAR' | 'STAGE_CLEAR';
    logs: string[];
    specialActionCooldown: number;
    money: number;
    relics: KRelic[];
    shopUpgradeUsed: boolean; // Tracks if upgrade was used in current shop/event
    currentUpgradeOffer: UpgradeOffer | null; // Persist current upgrade offer
    shopInventory: KRelic[]; // New: Store specific relics for the shop
    nextWaveMessage?: string; // Message to display at start of next wave
    difficultyLevel: number;
    isEndless: boolean;
    endlessFloor: number;
    endlessKills: number;
    endlessScore: number;
}

type KochoSheetKey = 'characters' | 'effects' | 'backgrounds';

const KOCHO_SPRITE_SHEETS: Record<KochoSheetKey, string> = {
    characters: assetUrl('sprites/kocho-hero-actions-01.webp'),
    effects: assetUrl('sprites/kocho-effects-01.webp'),
    backgrounds: assetUrl('sprites/kocho-backgrounds-5x5.webp'),
};

const KOCHO_HERO_ACTION_SHEETS = [
    assetUrl('sprites/kocho-hero-actions-01.webp'),
    assetUrl('sprites/kocho-hero-actions-02.webp'),
    assetUrl('sprites/kocho-hero-actions-03.webp'),
    assetUrl('sprites/kocho-hero-actions-04.webp'),
];

const KOCHO_ENEMY_SHEETS = [
    assetUrl('sprites/kocho-enemies-01.webp'),
    assetUrl('sprites/high-school/sheets/enemy-supplement-1.webp'),
    assetUrl('sprites/high-school/sheets/enemy-supplement-2.webp'),
    assetUrl('sprites/high-school/sheets/enemy-supplement-3.webp'),
    assetUrl('sprites/high-school/sheets/enemy-supplement-4.webp'),
    assetUrl('sprites/high-school/sheets/humanoid-enemy-supplement-1.webp'),
    assetUrl('sprites/high-school/sheets/humanoid-enemy-supplement-2.webp'),
    assetUrl('sprites/high-school/sheets/humanoid-enemy-supplement-3.webp'),
    assetUrl('sprites/high-school/sheets/female-humanoid-enemy-supplement-a-idle.webp'),
    assetUrl('sprites/high-school/sheets/female-humanoid-enemy-supplement-b-idle.webp'),
    assetUrl('sprites/high-school/sheets/principal-final-boss-3x2-chromakey.webp'),
];

const KOCHO_EFFECT_SHEETS = [
    assetUrl('sprites/kocho-effects-01.webp'),
    assetUrl('sprites/kocho-effects-02.webp'),
    assetUrl('sprites/kocho-effects-03.webp'),
];

const sheetPosition = (cell: number, columns = 5, rows = 5) => {
    const col = cell % columns;
    const row = Math.floor(cell / columns);
    const x = columns <= 1 ? 0 : (col * 100) / (columns - 1);
    const y = rows <= 1 ? 0 : (row * 100) / (rows - 1);
    return `${x}% ${y}%`;
};

const KochoSheetSprite: React.FC<{
    sheet: KochoSheetKey;
    cell: number;
    className?: string;
    flipX?: boolean;
    title?: string;
    src?: string;
    columns?: number;
    rows?: number;
}> = ({ sheet, cell, className = '', flipX = false, title, src, columns = 5, rows = 5 }) => (
    <div
        title={title}
        className={`kocho-sheet-sprite ${className}`}
        style={{
            backgroundImage: `url(${src || KOCHO_SPRITE_SHEETS[sheet]})`,
            backgroundPosition: sheetPosition(cell, columns, rows),
            backgroundSize: `${columns * 100}% ${rows * 100}%`,
            transform: flipX ? 'scaleX(-1)' : undefined,
        }}
    />
);

const KOCHO_ACTION_CARD_NAMES = [
    '定規スラッシュ', 'コンパス突き', 'ダッシュ', 'バックステップ', '大声',
    'お辞儀', '回し蹴り', 'チョーク投げ', 'スライディング', '教科書ガード',
    '竹刀', '金属バット', 'カウンター定規', '張り手', '後ろ蹴り',
    '釣り竿', '消火器', 'タックル', '雷', '回転モップ',
    '竹箒', '絶対防御', 'リコーダー', '三角定規',
    'バレーボール', '吸血', '雑巾がけ', '赤ペン連打', '連絡帳スマッシュ',
    'メガホン指導', '保健室の包帯', '跳び箱ダッシュ', '黒板消し投げ', '竹ぼうきスイープ',
    '笛の合図', '鉄パイプ', '防犯シールド', '号令ラッシュ', '釣り針フック',
    '教鞭ビンタ', '教鞭ショック', '体育倉庫前進', 'タイヤ引き', '救急箱',
    '防災頭巾', 'チョーク連射', 'バケツ返し', '花壇ジャンプ', '朝礼アタック',
    'ランドセル投げ', '校旗突き', 'ラジカセ爆音', '授業参観ガード', '雑誌投げ',
    '水筒チャージ', 'スポドリ補給', '非常階段ダッシュ', '竹馬ストライド', 'ホイッスルバースト',
    '校内放送', '裏門回り込み', '旋風脚', 'たすき掛け', '箱馬タックル',
    'フロアモップ', '金管アラーム', '絆創膏ケア', '校章ブーメラン', '清掃ワゴン',
    '鉄扇', 'ドア反撃', '生徒会バッジ', '非常口スライド', 'ロープウェイ',
    '校歌斉唱', '救護スプレー', '金庫破り',
];

const getKochoHeroActionAsset = (cardName?: string | null) => {
    if (!cardName) return { src: KOCHO_HERO_ACTION_SHEETS[0], cell: 0 };
    const index = KOCHO_ACTION_CARD_NAMES.indexOf(cardName);
    if (index < 0) return { src: KOCHO_HERO_ACTION_SHEETS[0], cell: 0 };
    if (index < 24) return { src: KOCHO_HERO_ACTION_SHEETS[0], cell: index + 1 };
    if (index < 49) return { src: KOCHO_HERO_ACTION_SHEETS[1], cell: index - 24 };
    if (index < 74) return { src: KOCHO_HERO_ACTION_SHEETS[2], cell: index - 49 };
    return { src: KOCHO_HERO_ACTION_SHEETS[3], cell: index - 74 };
};

const shouldFlipKochoHeroAction = (cardName?: string | null) => cardName === '定規スラッシュ';

const getKochoHeroDamageAsset = (kind: 'light' | 'heavy' | 'break' | 'stun' | 'low' | 'down') => {
    const cells = { light: 3, heavy: 4, break: 5, stun: 6, low: 8, down: 9 };
    return { src: KOCHO_HERO_ACTION_SHEETS[3], cell: cells[kind] };
};

const getKochoEffectAssetForCard = (cardName?: string) => {
    const index = cardName ? KOCHO_ACTION_CARD_NAMES.indexOf(cardName) : -1;
    if (index < 0) return { src: KOCHO_EFFECT_SHEETS[0], cell: 11 };
    if (index < 25) return { src: KOCHO_EFFECT_SHEETS[0], cell: index };
    if (index < 50) return { src: KOCHO_EFFECT_SHEETS[1], cell: index - 25 };
    if (index < 74) return { src: KOCHO_EFFECT_SHEETS[2], cell: index - 50 };
    if (cardName === '校歌斉唱') return { src: KOCHO_EFFECT_SHEETS[2], cell: 9 };
    if (cardName === '救護スプレー') return { src: KOCHO_EFFECT_SHEETS[2], cell: 16 };
    if (cardName === '金庫破り') return { src: KOCHO_EFFECT_SHEETS[2], cell: 13 };
    return { src: KOCHO_EFFECT_SHEETS[2], cell: 24 };
};

const KochoCardActionArt: React.FC<{
    card: Pick<KCard, 'name'>;
    className?: string;
}> = ({ card, className = '' }) => {
    const asset = getKochoHeroActionAsset(card.name);
    return (
        <KochoSheetSprite
            sheet="characters"
            src={asset.src}
            cell={asset.cell}
            flipX={shouldFlipKochoHeroAction(card.name)}
            className={className}
            title={card.name}
        />
    );
};

const getKochoItemImageSrc = (item: Pick<KConsumable, 'id'>) => {
    const version = '20260508-item-redraw';
    const files: Record<string, string> = {
        C_MILK: 'kocho-item-milk.webp',
        C_BARRIER: 'kocho-item-barrier.webp',
        C_BATTERY: 'kocho-item-battery.webp',
        C_CURRY: 'kocho-item-curry.webp',
        C_DRINK: 'kocho-item-drink.webp',
    };
    return `${assetUrl(`sprites/${files[item.id] || 'kocho-item-generic.webp'}`)}?v=${version}`;
};

const KochoItemImage: React.FC<{
    item: Pick<KConsumable, 'id' | 'name'>;
    className?: string;
}> = ({ item, className = '' }) => (
    <img
        src={getKochoItemImageSrc(item)}
        alt=""
        title={item.name}
        className={`object-contain ${className}`}
        draggable={false}
    />
);

const getKochoRelicImageSrc = (relic: Pick<KRelic, 'id'>) => {
    const version = '20260508-relic-redraw';
    const files: Record<string, string> = {
        R_SHIELD: 'kocho-relic-shield.webp',
        R_DISCOUNT: 'kocho-relic-discount.webp',
        R_THORN: 'kocho-relic-thorn.webp',
        R_BOOTS: 'kocho-relic-boots.webp',
        R_RECYCLE: 'kocho-relic-recycle.webp',
        R_FANG: 'kocho-relic-fang.webp',
        R_GLOVES: 'kocho-relic-gloves.webp',
        R_POTION: 'kocho-relic-potion.webp',
    };
    return `${assetUrl(`sprites/${files[relic.id] || 'kocho-relic-seal.webp'}`)}?v=${version}`;
};

const KochoRelicImage: React.FC<{
    relic: Pick<KRelic, 'id' | 'name'>;
    className?: string;
}> = ({ relic, className = '' }) => (
    <img
        src={getKochoRelicImageSrc(relic)}
        alt=""
        title={relic.name}
        className={`object-contain ${className}`}
        draggable={false}
    />
);

// --- DATA ---
const BASE_CARD_DB: Omit<KCard, 'id' | 'currentCooldown' | 'usedSlots'>[] = [
    // Standard Set
    { name: '定規スラッシュ', type: 'ATTACK', range: [1], damage: 3, cooldown: 2, color: 'bg-red-600', icon: <Swords size={16}/>, description: '目の前の敵を斬る', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'コンパス突き', type: 'ATTACK', range: [2], damage: 2, cooldown: 2, color: 'bg-orange-600', icon: <Zap size={16}/>, description: '2マス先を攻撃(間を無視)', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'ダッシュ', type: 'MOVE', range: [1, 2], damage: 0, cooldown: 3, color: 'bg-blue-600', icon: <ChevronsRight size={16}/>, description: '敵にぶつかるまで移動', energyCost: 1, maxSlots: 2 },
    { name: 'バックステップ', type: 'UTILITY', range: [-1], damage: 0, cooldown: 2, color: 'bg-gray-600', icon: <RotateCcw size={16}/>, description: '1マス下がる', energyCost: 1, maxSlots: 2 },
    { name: '大声', type: 'ATTACK', range: [1, 2, 3], damage: 1, cooldown: 4, color: 'bg-yellow-600', icon: <Zap size={16}/>, description: '前方3マスに音波攻撃(貫通)', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: 'お辞儀', type: 'UTILITY', range: [0], damage: 0, shield: 2, cooldown: 3, color: 'bg-green-600', icon: <Shield size={16}/>, description: '待機してシールド+2', energyCost: 1, maxSlots: 3 },
    { name: '回し蹴り', type: 'ATTACK', range: [-1, 1], damage: 3, cooldown: 2, color: 'bg-purple-600', icon: <RefreshCw size={16}/>, description: '前後1マスを攻撃', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' }, // Multi-target implicitly via range logic update
    { name: 'チョーク投げ', type: 'ATTACK', range: [1, 2, 3, 4], damage: 2, cooldown: 3, color: 'bg-cyan-600', icon: <Zap size={16}/>, description: '遠距離攻撃(単体)', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'スライディング', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 3, color: 'bg-indigo-600', icon: <ChevronsRight size={16}/>, description: '敵1体をすり抜けて攻撃', energyCost: 1, maxSlots: 3, effectType: 'PIERCE_DASH' },
    { name: '教科書ガード', type: 'UTILITY', range: [0], damage: 0, shield: 4, cooldown: 4, color: 'bg-slate-600', icon: <Book size={16}/>, description: 'シールド+4', energyCost: 1, maxSlots: 2 },

    // Expanded Weapons / Actions
    { name: '竹刀', type: 'ATTACK', range: [1], damage: 2, cooldown: 0, color: 'bg-emerald-600', icon: <Swords size={16}/>, description: 'CD0。隙のない連撃', energyCost: 0, maxSlots: 1, effectType: 'NORMAL' },
    { name: '金属バット', type: 'ATTACK', range: [1], damage: 5, cooldown: 4, color: 'bg-stone-600', icon: <Hammer size={16}/>, description: '重い一撃(高威力)', energyCost: 1, maxSlots: 2, effectType: 'NORMAL' },
    { name: 'カウンター定規', type: 'ATTACK', range: [1], damage: 2, cooldown: 3, color: 'bg-rose-700', icon: <Swords size={16}/>, description: '敵が攻撃態勢なら3倍ダメ', energyCost: 1, effectType: 'COUNTER', maxSlots: 3 },
    { name: '張り手', type: 'ATTACK', range: [1], damage: 1, cooldown: 3, color: 'bg-orange-700', icon: <Maximize2 size={16}/>, description: '敵を2マス吹き飛ばす', energyCost: 1, effectType: 'PUSH', maxSlots: 3 },
    { name: '後ろ蹴り', type: 'ATTACK', range: [-1], damage: 3, cooldown: 3, color: 'bg-violet-700', icon: <ArrowLeft size={16}/>, description: '背後の敵を攻撃', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: '釣り竿', type: 'ATTACK', range: [2, 3, 4], damage: 1, cooldown: 4, color: 'bg-sky-600', icon: <Minimize2 size={16}/>, description: '敵を目の前に引き寄せる', energyCost: 1, effectType: 'PULL', maxSlots: 3 },
    { name: '消火器', type: 'ATTACK', range: [1, 2], damage: 4, cooldown: 5, color: 'bg-red-500', icon: <Wind size={16}/>, description: '高威力だが反動で下がる', energyCost: 1, effectType: 'RECOIL', maxSlots: 2 },
    { name: 'タックル', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 3, color: 'bg-amber-600', icon: <Activity size={16}/>, description: '敵にぶつかるまで突進攻撃', energyCost: 1, effectType: 'DASH_ATTACK', maxSlots: 3 },
    { name: '雷', type: 'ATTACK', range: [1,2,3,4,5,6], damage: 2, cooldown: 4, color: 'bg-yellow-500 text-black', icon: <Zap size={16}/>, description: '一番遠くの敵を狙い撃つ', energyCost: 1, effectType: 'FURTHEST', maxSlots: 2 },
    { name: '回転モップ', type: 'ATTACK', range: [-1, 1], damage: 2, cooldown: 2, color: 'bg-cyan-700', icon: <RefreshCw size={16}/>, description: '前後を同時に攻撃', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: '竹箒', type: 'ATTACK', range: [1, 2], damage: 2, cooldown: 3, color: 'bg-amber-700', icon: <Move size={16}/>, description: '前方2マスを貫通攻撃', energyCost: 1, effectType: 'PIERCE', maxSlots: 3 },
    { name: '絶対防御', type: 'UTILITY', range: [0], damage: 0, shield: 6, cooldown: 5, color: 'bg-yellow-500 text-black', icon: <Shield size={16}/>, description: 'シールド+6', energyCost: 1, maxSlots: 1 },

    // New Additions
    { name: 'リコーダー', type: 'ATTACK', range: [1, 2], damage: 1, cooldown: 4, color: 'bg-pink-400', icon: <Music size={16}/>, description: '敵をスタン(Wait+1)', energyCost: 1, effectType: 'STUN', maxSlots: 2 },
    { name: '三角定規', type: 'ATTACK', range: [1], damage: 4, cooldown: 2, color: 'bg-teal-600', icon: <PenTool size={16}/>, description: '鋭い一撃(単体)', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'バレーボール', type: 'ATTACK', range: [3, 4, 5, 6], damage: 3, cooldown: 3, color: 'bg-white text-black', icon: <Circle size={16}/>, description: '超遠距離スパイク(貫通)', energyCost: 1, effectType: 'PIERCE', maxSlots: 3 },
    { name: '吸血', type: 'ATTACK', range: [1], damage: 2, cooldown: 4, color: 'bg-red-900', icon: <Dna size={16}/>, description: 'ダメージ分HP回復', energyCost: 1, effectType: 'DRAIN', maxSlots: 2 },
    { name: '雑巾がけ', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 3, color: 'bg-gray-400 text-black', icon: <ChevronsRight size={16}/>, description: 'ダッシュ攻撃', energyCost: 1, effectType: 'DASH_ATTACK', maxSlots: 2 },
];

const KOCHO_UNLOCKABLE_CARD_DB: Omit<KCard, 'id' | 'currentCooldown' | 'usedSlots'>[] = [
    { name: '赤ペン連打', type: 'ATTACK', range: [1], damage: 2, cooldown: 1, color: 'bg-red-700', icon: <PenTool size={16}/>, description: '隙の少ない速打', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: '連絡帳スマッシュ', type: 'ATTACK', range: [1], damage: 4, cooldown: 3, color: 'bg-slate-700', icon: <Book size={16}/>, description: '分厚い一撃', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'メガホン指導', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 4, color: 'bg-yellow-500 text-black', icon: <Mic size={16}/>, description: '前方3マスを貫通攻撃', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: '保健室の包帯', type: 'UTILITY', range: [0], damage: 0, cooldown: 3, color: 'bg-green-500', icon: <Heart size={16}/>, description: 'HPを回復する', energyCost: 1, maxSlots: 2, effectType: 'HEAL' },
    { name: '跳び箱ダッシュ', type: 'MOVE', range: [1, 2, 3], damage: 0, cooldown: 2, color: 'bg-blue-500', icon: <ChevronsRight size={16}/>, description: '3マスまで前進', energyCost: 1, maxSlots: 2 },
    { name: '黒板消し投げ', type: 'ATTACK', range: [2, 3, 4], damage: 3, cooldown: 3, color: 'bg-stone-500', icon: <Package size={16}/>, description: '中距離の一撃', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: '竹ぼうきスイープ', type: 'ATTACK', range: [1, 2], damage: 2, cooldown: 3, color: 'bg-amber-600', icon: <Move size={16}/>, description: '前方2マスを払う', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: '笛の合図', type: 'ATTACK', range: [1, 2], damage: 1, cooldown: 4, color: 'bg-pink-500', icon: <Music size={16}/>, description: '敵をスタンさせる', energyCost: 1, maxSlots: 2, effectType: 'STUN' },
    { name: '鉄パイプ', type: 'ATTACK', range: [1], damage: 6, cooldown: 5, color: 'bg-zinc-700', icon: <Hammer size={16}/>, description: '超重量の一撃', energyCost: 1, maxSlots: 2, effectType: 'NORMAL' },
    { name: '防犯シールド', type: 'UTILITY', range: [0], damage: 0, shield: 5, cooldown: 4, color: 'bg-sky-700', icon: <ShieldCheck size={16}/>, description: 'シールド+5', energyCost: 1, maxSlots: 2 },

    { name: '号令ラッシュ', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 3, color: 'bg-red-500', icon: <Flag size={16}/>, description: '突進して敵を叩く', energyCost: 1, maxSlots: 3, effectType: 'DASH_ATTACK' },
    { name: '釣り針フック', type: 'ATTACK', range: [2, 3, 4], damage: 2, cooldown: 4, color: 'bg-cyan-500', icon: <Anchor size={16}/>, description: '敵を手前に引き寄せる', energyCost: 1, maxSlots: 3, effectType: 'PULL' },
    { name: '教鞭ビンタ', type: 'ATTACK', range: [1], damage: 2, cooldown: 2, color: 'bg-orange-700', icon: <PenTool size={16}/>, description: '敵を押し込む', energyCost: 1, maxSlots: 3, effectType: 'PUSH' },
    { name: '教鞭ショック', type: 'ATTACK', range: [1], damage: 1, cooldown: 3, color: 'bg-yellow-400 text-black', icon: <AlertTriangle size={16}/>, description: '近距離スタン', energyCost: 1, maxSlots: 2, effectType: 'STUN' },
    { name: '体育倉庫前進', type: 'MOVE', range: [1, 2, 3, 4], damage: 0, cooldown: 3, color: 'bg-indigo-500', icon: <Move size={16}/>, description: '4マスまで前進', energyCost: 1, maxSlots: 2 },
    { name: 'タイヤ引き', type: 'ATTACK', range: [1, 2, 3], damage: 3, cooldown: 4, color: 'bg-amber-700', icon: <Activity size={16}/>, description: '重い体当たり', energyCost: 1, maxSlots: 3, effectType: 'DASH_ATTACK' },
    { name: '救急箱', type: 'UTILITY', range: [0], damage: 0, cooldown: 4, color: 'bg-green-600', icon: <Heart size={16}/>, description: 'HPを回復する', energyCost: 1, maxSlots: 2, effectType: 'HEAL' },
    { name: '防災頭巾', type: 'UTILITY', range: [0], damage: 0, shield: 7, cooldown: 5, color: 'bg-slate-700', icon: <Shield size={16}/>, description: 'シールド+7', energyCost: 1, maxSlots: 1 },
    { name: 'チョーク連射', type: 'ATTACK', range: [1, 2, 3, 4], damage: 1, cooldown: 1, color: 'bg-cyan-500', icon: <Zap size={16}/>, description: 'CDの短い牽制射撃', energyCost: 1, maxSlots: 2, effectType: 'NORMAL' },
    { name: 'バケツ返し', type: 'ATTACK', range: [1, 2], damage: 4, cooldown: 5, color: 'bg-blue-700', icon: <Package size={16}/>, description: '反動付きの重打', energyCost: 1, maxSlots: 2, effectType: 'RECOIL' },

    { name: '花壇ジャンプ', type: 'MOVE', range: [1, 2], damage: 0, cooldown: 1, color: 'bg-green-700', icon: <ArrowUp size={16}/>, description: '2マスまで軽快に移動', energyCost: 1, maxSlots: 2 },
    { name: '朝礼アタック', type: 'ATTACK', range: [1], damage: 3, cooldown: 0, color: 'bg-red-800', icon: <Swords size={16}/>, description: '即応性の高い一撃', energyCost: 0, maxSlots: 1, effectType: 'NORMAL' },
    { name: 'ランドセル投げ', type: 'ATTACK', range: [2, 3], damage: 4, cooldown: 4, color: 'bg-indigo-700', icon: <Package size={16}/>, description: '重たい遠投', energyCost: 1, maxSlots: 2, effectType: 'NORMAL' },
    { name: '校旗突き', type: 'ATTACK', range: [2], damage: 3, cooldown: 2, color: 'bg-rose-700', icon: <Flag size={16}/>, description: '2マス先を正確に突く', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'ラジカセ爆音', type: 'ATTACK', range: [1, 2, 3, 4], damage: 2, cooldown: 5, color: 'bg-purple-600', icon: <Music size={16}/>, description: '前方を轟音で貫く', energyCost: 1, maxSlots: 2, effectType: 'PIERCE' },
    { name: '授業参観ガード', type: 'UTILITY', range: [0], damage: 0, shield: 3, cooldown: 2, color: 'bg-teal-700', icon: <Shield size={16}/>, description: '軽めの防御姿勢', energyCost: 1, maxSlots: 3 },
    { name: '雑誌投げ', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 2, color: 'bg-gray-600', icon: <Book size={16}/>, description: '扱いやすい中距離攻撃', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: '水筒チャージ', type: 'UTILITY', range: [0], damage: 0, shield: 2, cooldown: 1, color: 'bg-blue-400 text-black', icon: <Battery size={16}/>, description: 'すぐ使える小盾', energyCost: 1, maxSlots: 3 },
    { name: 'スポドリ補給', type: 'UTILITY', range: [0], damage: 0, cooldown: 5, color: 'bg-lime-500 text-black', icon: <Battery size={16}/>, description: 'HPを回復する', energyCost: 1, maxSlots: 1, effectType: 'HEAL' },
    { name: '非常階段ダッシュ', type: 'MOVE', range: [1, 2, 3, 4, 5], damage: 0, cooldown: 4, color: 'bg-gray-700', icon: <ChevronsRight size={16}/>, description: '5マスまで一気に進む', energyCost: 1, maxSlots: 2 },

    { name: '竹馬ストライド', type: 'MOVE', range: [1, 2, 3], damage: 0, cooldown: 2, color: 'bg-violet-600', icon: <Move size={16}/>, description: '安定した3マス移動', energyCost: 1, maxSlots: 2 },
    { name: 'ホイッスルバースト', type: 'ATTACK', range: [1, 2, 3, 4, 5], damage: 3, cooldown: 4, color: 'bg-white text-black', icon: <Mic size={16}/>, description: '最も遠い敵を狙う', energyCost: 1, maxSlots: 2, effectType: 'FURTHEST' },
    { name: '校内放送', type: 'ATTACK', range: [1, 2, 3, 4, 5, 6], damage: 2, cooldown: 5, color: 'bg-yellow-600', icon: <Mic size={16}/>, description: '前方すべてに届く音圧', energyCost: 1, maxSlots: 2, effectType: 'PIERCE' },
    { name: '裏門回り込み', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 4, color: 'bg-indigo-600', icon: <ChevronsRight size={16}/>, description: 'すり抜けて背後を取る', energyCost: 1, maxSlots: 2, effectType: 'PIERCE_DASH' },
    { name: '旋風脚', type: 'ATTACK', range: [-1, 1], damage: 3, cooldown: 3, color: 'bg-purple-700', icon: <RefreshCw size={16}/>, description: '前後を薙ぐ蹴り', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: 'たすき掛け', type: 'ATTACK', range: [1], damage: 2, cooldown: 3, color: 'bg-rose-600', icon: <ArrowRightLeft size={16}/>, description: '反撃特化の一打', energyCost: 1, maxSlots: 3, effectType: 'COUNTER' },
    { name: '箱馬タックル', type: 'ATTACK', range: [1, 2, 3], damage: 3, cooldown: 4, color: 'bg-orange-500', icon: <Activity size={16}/>, description: '勢いを乗せてぶつかる', energyCost: 1, maxSlots: 2, effectType: 'DASH_ATTACK' },
    { name: 'フロアモップ', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 4, color: 'bg-cyan-800', icon: <Wind size={16}/>, description: '反動つきの掃討', energyCost: 1, maxSlots: 2, effectType: 'RECOIL' },
    { name: '金管アラーム', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 4, color: 'bg-orange-500', icon: <AlertCircle size={16}/>, description: '3マスを一斉攻撃', energyCost: 1, maxSlots: 2, effectType: 'PIERCE' },
    { name: '絆創膏ケア', type: 'UTILITY', range: [0], damage: 0, cooldown: 2, color: 'bg-green-400 text-black', icon: <Heart size={16}/>, description: '小回りの利く回復', energyCost: 1, maxSlots: 3, effectType: 'HEAL' },

    { name: '校章ブーメラン', type: 'ATTACK', range: [1, 2, 3], damage: 3, cooldown: 3, color: 'bg-yellow-500 text-black', icon: <Shuffle size={16}/>, description: '前方をまとめて薙ぐ', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: '清掃ワゴン', type: 'ATTACK', range: [1, 2], damage: 2, cooldown: 3, color: 'bg-slate-500', icon: <Package size={16}/>, description: '押し込みながら攻撃', energyCost: 1, maxSlots: 3, effectType: 'PUSH' },
    { name: '鉄扇', type: 'ATTACK', range: [1], damage: 4, cooldown: 2, color: 'bg-sky-800', icon: <Wind size={16}/>, description: '切れ味の鋭い一閃', energyCost: 1, maxSlots: 3, effectType: 'NORMAL' },
    { name: 'ドア反撃', type: 'ATTACK', range: [1], damage: 2, cooldown: 3, color: 'bg-gray-800', icon: <Shield size={16}/>, description: '敵の攻撃に合わせて強い', energyCost: 1, maxSlots: 3, effectType: 'COUNTER' },
    { name: '生徒会バッジ', type: 'UTILITY', range: [0], damage: 0, shield: 4, cooldown: 3, color: 'bg-yellow-700', icon: <Star size={16}/>, description: 'シールド+4', energyCost: 1, maxSlots: 2 },
    { name: '非常口スライド', type: 'ATTACK', range: [1, 2, 3, 4], damage: 2, cooldown: 3, color: 'bg-emerald-600', icon: <ChevronsRight size={16}/>, description: '長距離すり抜け攻撃', energyCost: 1, maxSlots: 2, effectType: 'PIERCE_DASH' },
    { name: 'ロープウェイ', type: 'MOVE', range: [1, 2, 3, 4], damage: 0, cooldown: 2, color: 'bg-sky-600', icon: <Minimize2 size={16}/>, description: '4マスまで一気に移動', energyCost: 1, maxSlots: 2 },
    { name: '校歌斉唱', type: 'ATTACK', range: [1, 2, 3, 4, 5], damage: 2, cooldown: 4, color: 'bg-pink-600', icon: <Music size={16}/>, description: '遠くまで届く歌声', energyCost: 1, maxSlots: 3, effectType: 'PIERCE' },
    { name: '救護スプレー', type: 'UTILITY', range: [0], damage: 0, cooldown: 4, color: 'bg-emerald-500', icon: <Heart size={16}/>, description: 'HPを回復する', energyCost: 1, maxSlots: 2, effectType: 'HEAL' },
    { name: '金庫破り', type: 'ATTACK', range: [1], damage: 5, cooldown: 4, color: 'bg-stone-800', icon: <Coins size={16}/>, description: '強打しつつ回復する', energyCost: 1, maxSlots: 2, effectType: 'DRAIN' },
];

const ALL_KOCHO_CARD_DB = [...BASE_CARD_DB, ...KOCHO_UNLOCKABLE_CARD_DB];
const KOCHO_UNLOCKABLE_CARD_TOTAL = KOCHO_UNLOCKABLE_CARD_DB.length;

const getUnlockedKochoCardTemplates = () => {
    const unlocked = new Set(storageService.getUnlockedKochoCards());
    return [...BASE_CARD_DB, ...KOCHO_UNLOCKABLE_CARD_DB.filter(card => unlocked.has(card.name))];
};

const getKochoCardTemplateByName = (cardName: string) => ALL_KOCHO_CARD_DB.find(card => card.name === cardName);

const CONSUMABLE_DB: KConsumable[] = [
    { id: 'C_MILK', type: 'HEAL', name: '給食の牛乳', desc: 'HPを5回復', value: 5, icon: <Milk size={16}/>, color: 'text-white' },
    { id: 'C_BARRIER', type: 'BARRIER', name: 'ATフィールド', desc: '1回だけダメージ無効', value: 1, icon: <ShieldCheck size={16}/>, color: 'text-yellow-400' },
    { id: 'C_BATTERY', type: 'CD_REDUCE', name: '予備電池', desc: '手札のCDを2短縮', value: 2, icon: <Battery size={16}/>, color: 'text-green-400' },
    { id: 'C_CURRY', type: 'STRENGTH', name: '激辛カレー', desc: '次の攻撃ダメージ+3', value: 3, icon: <Flame size={16}/>, color: 'text-orange-500' },
    { id: 'C_DRINK', type: 'CD_REDUCE', name: 'エナドリ', desc: '手札のCDを全解消', value: 99, icon: <Zap size={16}/>, color: 'text-blue-400' },
];

const SHOP_RELICS: KRelic[] = [
    { id: 'R_BOOTS', name: '瞬足の靴', desc: '移動系カードのCD-1', price: 60 },
    { id: 'R_GLOVES', name: 'パワー手袋', desc: '攻撃ダメージ+1', price: 120 },
    { id: 'R_SHIELD', name: '安全ピン', desc: '戦闘開始時、シールド+4', price: 100 },
    { id: 'R_POTION', name: '回復セット', desc: 'HPを全回復', price: 50 },
    { id: 'R_FANG', name: '吸血の牙', desc: '敵を倒すとHP1回復', price: 150 },
    { id: 'R_THORN', name: 'トゲトゲ肩パッド', desc: '被ダメ時、敵に1ダメージ', price: 90 },
    { id: 'R_DISCOUNT', name: 'クーポン券', desc: 'ショップの商品が30%OFF', price: 80 },
    { id: 'R_RECYCLE', name: 'リサイクル箱', desc: 'アイテム使用時20%で消費しない', price: 110 },
];

const UPGRADE_POOLS: UpgradeOffer[] = [
    { type: 'DMG_1', description: 'ダメージ +1', icon: <Swords size={32}/>, color: 'text-red-400' },
    { type: 'DMG_1_CD_1', description: 'ダメージ +1 / CD +1', icon: <Swords size={32}/>, color: 'text-orange-400' },
    { type: 'DMG_2_CD_3', description: 'ダメージ +2 / CD +3', icon: <Hammer size={32}/>, color: 'text-red-500' },
    { type: 'CD_MINUS_1', description: 'クールダウン -1', icon: <Clock size={32}/>, color: 'text-blue-400' },
    { type: 'CD_MINUS_2', description: 'クールダウン -2', icon: <Clock size={32}/>, color: 'text-cyan-400' },
    { type: 'CD_MINUS_4_DMG_MINUS_1', description: 'CD -4 / ダメージ -1', icon: <Wind size={32}/>, color: 'text-sky-300' },
    { type: 'SLOT_1', description: 'スロット +1 (上限突破)', icon: <Plus size={32}/>, color: 'text-green-400' },
    { type: 'SLOT_1_CD_MINUS_1', description: 'スロット +1 / CD -1', icon: <Plus size={32}/>, color: 'text-emerald-400' },
    { type: 'SACRIFICE', description: 'カード売却 (+40G)', icon: <Skull size={32}/>, color: 'text-gray-400' },
    { type: 'GAMBLE', description: '即興アレンジ（ランダム変化）', icon: <Shuffle size={32}/>, color: 'text-purple-400' },
];

const getInitialDeck = (): KCard[] => {
    // Initial Deck: Roundhouse Kick & Chalk Throw ONLY
    const roundhouse = BASE_CARD_DB.find(c => c.name === '回し蹴り')!;
    const chalk = BASE_CARD_DB.find(c => c.name === 'チョーク投げ')!;
    const ruler = BASE_CARD_DB.find(c => c.name === '定規スラッシュ')!;

    return [
        { ...roundhouse, id: 'c1', currentCooldown: 0, usedSlots: 0 },
        { ...chalk, id: 'c2', currentCooldown: 0, usedSlots: 0 },
        { ...ruler, id: 'c3', currentCooldown: 0, usedSlots: 0 },
    ];
};

interface EnemyTemplate {
    name: string;
    maxHp: number;
    sprite: string;
    attackDmg: number;
    range: number[];
    speed: number;
    attackCooldown: number;
    special?: 'LECTURE' | 'EXPLOSION' | 'SHIELD' | 'LULLABY' | 'CONFISCATE'; // Boss abilities
}

const ENEMY_TYPES: EnemyTemplate[] = [
    { name: '不良生徒', maxHp: 3, sprite: 'SENIOR|#a855f7', attackDmg: 2, range: [1], speed: 3, attackCooldown: 1 }, 
    { name: '熱血教師', maxHp: 6, sprite: 'TEACHER|#ef4444', attackDmg: 4, range: [1], speed: 4, attackCooldown: 2 },
    { name: '用務員', maxHp: 5, sprite: 'HUMANOID|#3e2723', attackDmg: 3, range: [1, 2], speed: 5, attackCooldown: 1 },
    { name: 'ガリ勉', maxHp: 3, sprite: 'HUMANOID|#4caf50', attackDmg: 2, range: [3, 4], speed: 3, attackCooldown: 2 },
    
    // Bosses
    { name: '教頭', maxHp: 12, sprite: 'TEACHER|#1565c0', attackDmg: 3, range: [1, 2, 3], speed: 5, attackCooldown: 2, special: 'LECTURE' },
    { name: '理科の先生', maxHp: 15, sprite: 'WIZARD|#00bcd4', attackDmg: 3, range: [1, 2, 3], speed: 5, attackCooldown: 2, special: 'EXPLOSION' },
    { name: '体育の先生', maxHp: 18, sprite: 'MUSCLE|#c62828', attackDmg: 6, range: [1], speed: 7, attackCooldown: 1, special: 'SHIELD' },
    { name: '音楽の先生', maxHp: 14, sprite: 'GIRL|#e91e63', attackDmg: 2, range: [1,2,3,4], speed: 4, attackCooldown: 2, special: 'LULLABY' },
    { name: '生活指導', maxHp: 20, sprite: 'TEACHER|#212121', attackDmg: 5, range: [1, 2], speed: 6, attackCooldown: 1, special: 'CONFISCATE' },

    // Final Boss Phases
    { name: '校長', maxHp: 25, sprite: 'BOSS|#FFD700', attackDmg: 5, range: [1, 2], speed: 4, attackCooldown: 2 },
    { name: '激怒校長', maxHp: 30, sprite: 'BOSS|#d32f2f', attackDmg: 8, range: [1, 2, 3], speed: 6, attackCooldown: 1 },
    { name: '真・校長', maxHp: 50, sprite: 'BOSS|#212121', attackDmg: 10, range: [1, 2, 3, 4], speed: 5, attackCooldown: 2 },

    // Additional illustrated enemies
    { name: '図書委員長', maxHp: 7, sprite: 'BOOK_OPEN|#7c3aed', attackDmg: 3, range: [2, 3], speed: 4, attackCooldown: 2 },
    { name: '保健室の先生', maxHp: 9, sprite: 'TEACHER|#22c55e', attackDmg: 2, range: [1, 2], speed: 4, attackCooldown: 2, special: 'SHIELD' },
    { name: '放送部の怪人', maxHp: 8, sprite: 'RADIO_TOWER|#f59e0b', attackDmg: 3, range: [2, 3, 4], speed: 5, attackCooldown: 2, special: 'LULLABY' },
    { name: '美術教師', maxHp: 10, sprite: 'ART_PALETTE|#ec4899', attackDmg: 4, range: [1, 2], speed: 5, attackCooldown: 2 },
    { name: '給食番長', maxHp: 11, sprite: 'LUNCH_TRAY|#f97316', attackDmg: 5, range: [1], speed: 5, attackCooldown: 1 },
    { name: '校庭ランナー', maxHp: 6, sprite: 'SHOE|#38bdf8', attackDmg: 3, range: [1], speed: 7, attackCooldown: 1 },
    { name: '守衛ロボ', maxHp: 12, sprite: 'ROBOT|#94a3b8', attackDmg: 4, range: [1, 2], speed: 4, attackCooldown: 2, special: 'SHIELD' },
    { name: '旧校舎の影', maxHp: 9, sprite: 'GHOST|#111827', attackDmg: 4, range: [1, 2, 3], speed: 6, attackCooldown: 2 },
    { name: 'テストの化身', maxHp: 13, sprite: 'TEST_MONSTER|#ef4444', attackDmg: 5, range: [1, 2], speed: 5, attackCooldown: 2, special: 'LECTURE' },
    { name: 'PTAの圧', maxHp: 10, sprite: 'BOSS|#facc15', attackDmg: 3, range: [1, 2, 3], speed: 4, attackCooldown: 2, special: 'CONFISCATE' },
    { name: '飼育小屋番', maxHp: 8, sprite: 'DOG|#84cc16', attackDmg: 3, range: [1], speed: 5, attackCooldown: 1 },
    { name: '文化祭実行委員', maxHp: 11, sprite: 'FLAG|#06b6d4', attackDmg: 4, range: [1, 2], speed: 5, attackCooldown: 2 },
    { name: '卒業式の亡霊', maxHp: 14, sprite: 'GHOST|#e5e7eb', attackDmg: 5, range: [1, 2, 3], speed: 5, attackCooldown: 2, special: 'LULLABY' },

    // Endless-only illustrated enemies
    { name: '放課後の見回り', maxHp: 12, sprite: 'HUMANOID|#64748b', attackDmg: 4, range: [1, 2], speed: 5, attackCooldown: 2 },
    { name: '答案の亡霊', maxHp: 10, sprite: 'GHOST|#94a3b8', attackDmg: 3, range: [2, 3, 4], speed: 5, attackCooldown: 2, special: 'LULLABY' },
    { name: '購買部の圧', maxHp: 16, sprite: 'LUNCH_TRAY|#f59e0b', attackDmg: 6, range: [1], speed: 4, attackCooldown: 1 },
    { name: '補習監督', maxHp: 18, sprite: 'TEACHER|#7c2d12', attackDmg: 5, range: [1, 2], speed: 5, attackCooldown: 2, special: 'LECTURE' },
    { name: '風紀委員長', maxHp: 14, sprite: 'FLAG|#2563eb', attackDmg: 4, range: [1, 2, 3], speed: 6, attackCooldown: 2, special: 'CONFISCATE' },
    { name: '図書室監査員', maxHp: 17, sprite: 'BOOK_OPEN|#4c1d95', attackDmg: 5, range: [2, 3], speed: 4, attackCooldown: 2, special: 'SHIELD' },
    { name: '放送委員の刺客', maxHp: 13, sprite: 'RADIO_TOWER|#db2777', attackDmg: 4, range: [2, 3, 4], speed: 6, attackCooldown: 1 },
    { name: '生徒会監査', maxHp: 20, sprite: 'BOSS|#0f766e', attackDmg: 5, range: [1, 2, 3], speed: 5, attackCooldown: 2, special: 'CONFISCATE' },
    { name: '校則執行官', maxHp: 24, sprite: 'TEACHER|#991b1b', attackDmg: 7, range: [1, 2], speed: 6, attackCooldown: 1, special: 'LECTURE' },
    { name: '深夜校長', maxHp: 38, sprite: 'BOSS|#111827', attackDmg: 8, range: [1, 2, 3, 4], speed: 6, attackCooldown: 1, special: 'LULLABY' },
];

const GRID_SIZE = 7;
const FINAL_STAGE = 7;
const MAX_CONSUMABLES = 3;

const KOCHO_DIFFICULTIES = [
    { level: 1, name: '通常授業', hpMultiplier: 1.0, damageBonus: 0, dropMultiplier: 1.0, scoreMultiplier: 1.0 },
    { level: 2, name: '小テスト', hpMultiplier: 1.1, damageBonus: 0, dropMultiplier: 1.0, scoreMultiplier: 1.1 },
    { level: 3, name: '抜き打ちテスト', hpMultiplier: 1.18, damageBonus: 1, dropMultiplier: 0.95, scoreMultiplier: 1.2 },
    { level: 4, name: '赤点回避', hpMultiplier: 1.28, damageBonus: 1, dropMultiplier: 0.9, scoreMultiplier: 1.35 },
    { level: 5, name: '居残り', hpMultiplier: 1.4, damageBonus: 2, dropMultiplier: 0.82, scoreMultiplier: 1.5 },
    { level: 6, name: '追試', hpMultiplier: 1.55, damageBonus: 2, dropMultiplier: 0.75, scoreMultiplier: 1.75 },
    { level: 7, name: '補習地獄', hpMultiplier: 1.72, damageBonus: 3, dropMultiplier: 0.68, scoreMultiplier: 2.0 },
    { level: 8, name: '職員室召喚', hpMultiplier: 1.92, damageBonus: 3, dropMultiplier: 0.6, scoreMultiplier: 2.4 },
    { level: 9, name: '全校集会処刑台', hpMultiplier: 2.15, damageBonus: 4, dropMultiplier: 0.5, scoreMultiplier: 2.8 },
    { level: 10, name: '校長最終通告', hpMultiplier: 2.45, damageBonus: 5, dropMultiplier: 0.4, scoreMultiplier: 3.5 },
];

const getKochoDifficulty = (level: number) => KOCHO_DIFFICULTIES[Math.max(0, Math.min(KOCHO_DIFFICULTIES.length - 1, Math.floor(level || 1) - 1))];

// --- HELPER: Hydrate/Restore State ---
const hydrateState = (state: any): KochoGameState => {
    // Restore React Nodes for Cards (Icons)
    const restoreCards = (cards: any[]) => cards.map(c => {
        const template = getKochoCardTemplateByName(c.name);
        return { 
            ...c, 
            icon: template ? template.icon : <HelpCircle size={16}/> 
        };
    });

    // Restore Consumables Icons
    const restoreConsumables = (items: any[]) => items ? items.map(i => {
        const template = CONSUMABLE_DB.find(t => t.id === i.id) || i;
        return { ...i, icon: template.icon, color: template.color };
    }) : [];

    const restoreFieldItems = (items: any[]) => items ? items.map(i => {
        const template = CONSUMABLE_DB.find(t => t.id === i.data.id) || i.data;
        return { ...i, data: { ...i.data, icon: template.icon, color: template.color } };
    }) : [];

    // Restore Upgrade Offer (Icon restoration)
    let restoredOffer = null;
    if (state.currentUpgradeOffer) {
        const template = UPGRADE_POOLS.find(p => p.type === state.currentUpgradeOffer.type);
        if (template) restoredOffer = template;
    }
    
    return {
        ...state,
        hand: restoreCards(state.hand),
        queue: restoreCards(state.queue),
        consumables: restoreConsumables(state.consumables || []),
        fieldItems: restoreFieldItems(state.fieldItems || []),
        player: { ...state.player, barrier: state.player.barrier || 0, strength: state.player.strength || 0 }, // Legacy support
        currentUpgradeOffer: restoredOffer,
        shopInventory: state.shopInventory || [],
        totalTurns: state.totalTurns || 0, // Restore Total Turns
        pendingPhase: state.pendingPhase || null,
        nextWaveMessage: state.nextWaveMessage || undefined, // New field
        difficultyLevel: state.difficultyLevel || 1,
        isEndless: Boolean(state.isEndless),
        endlessFloor: state.endlessFloor || 0,
        endlessKills: state.endlessKills || 0,
        endlessScore: state.endlessScore || 0,
    };
};

const getInitialState = (): KochoGameState => ({
    phase: 'SETUP',
    pendingPhase: null,
    battleStage: 1,
    battleSequence: 0,
    wave: 1,
    maxWaves: 3,
    turn: 1,
    totalTurns: 0, // Init
    gridSize: GRID_SIZE,
    player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 10, hp: 10, spriteName: 'HERO_SIDE|赤', shield: 0, barrier: 0, strength: 0 },
    enemies: [],
    hand: getInitialDeck(),
    queue: [],
    consumables: [],
    fieldItems: [],
    status: 'PLAYING',
    logs: ['校長室への道が開かれた...'],
    specialActionCooldown: 0,
    money: 0,
    relics: [],
    shopUpgradeUsed: false,
    currentUpgradeOffer: null,
    shopInventory: [],
    nextWaveMessage: undefined,
    difficultyLevel: 1,
    isEndless: false,
    endlessFloor: 0,
    endlessKills: 0,
    endlessScore: 0
});

const createKochoDebugPreviewState = (debugPreview: MiniGameDebugPreview | undefined, initial: KochoGameState): KochoGameState => {
    if (debugPreview === 'GAME_OVER') return { ...initial, phase: 'GAME_OVER', status: 'GAME_OVER', pendingPhase: null };
    if (debugPreview === 'ENDING') return { ...initial, phase: 'VICTORY', status: 'VICTORY', battleStage: FINAL_STAGE, pendingPhase: null };
    if (debugPreview === 'KOCHO_REWARD') return { ...initial, phase: 'REWARD', status: 'PLAYING', money: 80, pendingPhase: null };
    if (debugPreview === 'KOCHO_UPGRADE') return { ...initial, phase: 'UPGRADE_EVENT', status: 'PLAYING', money: 80, currentUpgradeOffer: UPGRADE_POOLS[0], pendingPhase: null };
    if (debugPreview === 'KOCHO_SHOP') {
        return {
            ...initial,
            phase: 'SHOP',
            status: 'PLAYING',
            money: 180,
            currentUpgradeOffer: UPGRADE_POOLS[1],
            shopInventory: SHOP_RELICS.slice(0, 4),
            pendingPhase: null,
        };
    }
    return initial;
};

// --- COMPONENT ---
const KochoShowdown: React.FC<{
    onBack: () => void;
    problemMode?: GameMode;
    problemModePool?: string[];
    answerMode?: AnswerMode;
    assignment?: AssignmentPayload | null;
    onAnswerResult?: (result: AssignmentAnswerResult) => void;
    languageMode?: LanguageMode;
    debugPreview?: MiniGameDebugPreview;
}> = ({ onBack, problemMode = GameMode.MIXED, problemModePool, answerMode = 'CHOICE', assignment, onAnswerResult, languageMode = 'JAPANESE', debugPreview }) => {
    const tr = (text: string) => trans(text, languageMode);
    
    // State
    const [gameState, setGameState] = useState<KochoGameState>(() => {
        const saved = storageService.loadKochoState();
        const initial = saved ? hydrateState(saved) : getInitialState();
        return createKochoDebugPreviewState(debugPreview, initial);
    });

    const [vfxList, setVfxList] = useState<KochoVFX[]>([]);
    const [hitStopActive, setHitStopActive] = useState(false);
    const [announcement, setAnnouncement] = useState<KochoAnnouncement | null>(null);
    
    // Ref to hold current state for async loops (avoiding stale closures)
    const stateRef = useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const [animating, setAnimating] = useState(false);
    const [activeActionCardName, setActiveActionCardName] = useState<string | null>(null);
    const activeActionCardNameRef = useRef<string | null>(null);
    const [rewardCards, setRewardCards] = useState<KCard[]>(() =>
        debugPreview === 'KOCHO_REWARD'
            ? getUnlockedKochoCardTemplates().slice(0, 3).map((card, index) => ({ ...card, id: `debug_reward_${index}`, currentCooldown: 0, usedSlots: 0 }))
            : []
    );
    const [newlyUnlockedCard, setNewlyUnlockedCard] = useState<(typeof KOCHO_UNLOCKABLE_CARD_DB)[number] | null>(
        debugPreview === 'ENDING' ? KOCHO_UNLOCKABLE_CARD_DB[0] ?? null : null
    );
    const [kochoUnlockedCount, setKochoUnlockedCount] = useState(() => storageService.getUnlockedKochoCards().length);
    const [maxUnlockedDifficulty, setMaxUnlockedDifficulty] = useState(() =>
        debugPreview ? KOCHO_DIFFICULTIES.length : storageService.getMaxUnlockedKochoDifficulty()
    );
    
    // UI State
    const [showRelicModal, setShowRelicModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false); // Help Modal
    const [showItemModal, setShowItemModal] = useState(false); // Item Modal
    const [activeIntentTooltipEnemyId, setActiveIntentTooltipEnemyId] = useState<string | null>(null);
    const hitStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const announcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-Save Effect
    const saveDebounceRef = useRef<any>(null);
    useEffect(() => {
        return () => {
            if (hitStopTimeoutRef.current) clearTimeout(hitStopTimeoutRef.current);
            if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY') {
            if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
            saveDebounceRef.current = setTimeout(() => {
                const stateToSave = { ...gameState };
                storageService.saveKochoState(stateToSave);
            }, 500);
        }
    }, [gameState]);

    // Initialization (Only if starting fresh or reset)
    useEffect(() => {
        if (gameState.phase === 'BATTLE' && gameState.wave === 1 && gameState.enemies.length === 0 && gameState.status === 'PLAYING' && gameState.battleStage === 1 && gameState.turn === 1) {
            startWave(1, 0, 1);
        }
    }, []);

    const initGame = () => {
        const initialState = getInitialState();
        setGameState(initialState);
        stateRef.current = initialState;
        setNewlyUnlockedCard(null);
        storageService.saveKochoState(initialState);
        // 「再挑戦」は同一画面内の状態リセットなので、画面遷移側のBGM effectは
        // 再実行されない。ユーザー操作のクリック中に再生を開始し、iOSの
        // media-element autoplay制限にも確実に通す。
        audioService.stopBGM();
        void audioService.playBGM('kocho_setup');
    };

    const startKochoRun = (difficultyLevel: number) => {
        const difficulty = getKochoDifficulty(difficultyLevel);
        if (!debugPreview && difficulty.level > maxUnlockedDifficulty) return;
        const initialState: KochoGameState = {
            ...getInitialState(),
            phase: 'BATTLE',
            difficultyLevel: difficulty.level,
            logs: [`${tr('難易度')} ${difficulty.level}: ${tr(difficulty.name)}`]
        };
        setGameState(initialState);
        stateRef.current = initialState;
        setNewlyUnlockedCard(null);
        storageService.saveKochoState(initialState);
        startWave(1, 0, 1);
    };
    const handleQuit = () => {
        // Save handled by effect, ensure cleared if needed or just save current state
        onBack();
    };

    const startEndlessRun = () => {
        const nextState: KochoGameState = {
            ...stateRef.current,
            phase: 'BATTLE',
            pendingPhase: null,
            battleStage: FINAL_STAGE + 1,
            battleSequence: 0,
            wave: 1,
            maxWaves: 1,
            turn: 1,
            status: 'PLAYING',
            queue: [],
            enemies: [],
            fieldItems: [],
            isEndless: true,
            endlessFloor: 1,
            endlessKills: 0,
            endlessScore: 0,
            logs: ['放課後エンドレスが始まった...'],
            nextWaveMessage: '校長室の奥に、終わらない補習棟が現れた。'
        };
        setNewlyUnlockedCard(null);
        setGameState(nextState);
        stateRef.current = nextState;
        storageService.saveKochoState(nextState);
        startWave(FINAL_STAGE + 1, 0, 1);
    };
    
    const unlockRandomKochoCard = useCallback(() => {
        const unlocked = new Set(storageService.getUnlockedKochoCards());
        const lockedCards = KOCHO_UNLOCKABLE_CARD_DB.filter(card => !unlocked.has(card.name));
        if (lockedCards.length === 0) {
            return null;
        }
        const unlockedCard = lockedCards[Math.floor(Math.random() * lockedCards.length)];
        storageService.saveUnlockedKochoCard(unlockedCard.name);
        return unlockedCard;
    }, []);

    // --- Save Score on End Game ---
    useEffect(() => {
        if (debugPreview) return;
        if (gameState.status === 'VICTORY' || gameState.status === 'GAME_OVER') {
            storageService.saveKochoScore({
                id: `kocho-${Date.now()}`,
                date: Date.now(),
                stage: gameState.battleStage,
                victory: gameState.status === 'VICTORY',
                turns: gameState.totalTurns,
                difficultyLevel: gameState.difficultyLevel,
                isEndless: gameState.isEndless,
                endlessFloor: gameState.endlessFloor,
                endlessKills: gameState.endlessKills,
                endlessScore: gameState.endlessScore
            });
            if (gameState.status === 'VICTORY' && !gameState.isEndless) {
                const nextDifficulty = Math.min(KOCHO_DIFFICULTIES.length, gameState.difficultyLevel + 1);
                storageService.unlockKochoDifficulty(nextDifficulty);
                setMaxUnlockedDifficulty(storageService.getMaxUnlockedKochoDifficulty());
                const unlockedCard = unlockRandomKochoCard();
                setNewlyUnlockedCard(unlockedCard);
                setKochoUnlockedCount(storageService.getUnlockedKochoCards().length);
            }
            storageService.clearKochoState();
        }
    }, [gameState.status, gameState.battleStage, gameState.totalTurns, gameState.difficultyLevel, gameState.isEndless, gameState.endlessFloor, gameState.endlessKills, gameState.endlessScore, unlockRandomKochoCard, debugPreview]);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [tr(msg), ...prev.logs.slice(0, 4)] }));
    };

    const addVfx = (type: KochoVFX['type'], pos: number, options: Partial<KochoVFX> = {}) => {
        const id = options.id || Math.random().toString(36).substr(2, 9);
        const sourceCardName = options.sourceCardName ?? activeActionCardNameRef.current ?? undefined;
        setVfxList(prev => [...prev, { ...options, sourceCardName, id, type, pos }]);
        setTimeout(() => {
            setVfxList(prev => prev.filter(v => v.id !== id));
        }, options.durationMs ?? 800); // Effect duration
    };

    const triggerHitStop = useCallback((duration = 110) => {
        setHitStopActive(true);
        if (hitStopTimeoutRef.current) clearTimeout(hitStopTimeoutRef.current);
        hitStopTimeoutRef.current = setTimeout(() => setHitStopActive(false), duration);
    }, []);

    const showAnnouncement = useCallback((title: string, subtitle = '', tone: KochoAnnouncement['tone'] = 'battle', duration = 1300) => {
        const id = `ann_${Date.now()}_${Math.random()}`;
        setAnnouncement({ id, title, subtitle, tone });
        if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
        announcementTimeoutRef.current = setTimeout(() => {
            setAnnouncement(current => current?.id === id ? null : current);
        }, duration);
    }, []);

    const getRandomOffer = () => UPGRADE_POOLS[Math.floor(Math.random() * UPGRADE_POOLS.length)];

    const getShopPrice = (price: number) => {
        if (gameState.relics.some(r => r.id === 'R_DISCOUNT')) {
            return Math.floor(price * 0.7);
        }
        return price;
    };

    // Initialize upgrade offer on phase change
    useEffect(() => {
        if ((gameState.phase === 'SHOP' || gameState.phase === 'UPGRADE_EVENT') && !gameState.currentUpgradeOffer) {
             setGameState(prev => ({ ...prev, currentUpgradeOffer: getRandomOffer() }));
        }
    }, [gameState.phase]);

    const spawnConsumable = (pos: number) => {
        // 15% chance or if Recycle relic procs
        let dropChance = 0.15 * getKochoDifficulty(stateRef.current.difficultyLevel).dropMultiplier;
        if (stateRef.current.relics.some(r => r.id === 'R_FANG')) dropChance = 0; // Fang consumes chance? No, Fang heals.
        
        if (Math.random() > dropChance) return;
        
        const template = CONSUMABLE_DB[Math.floor(Math.random() * CONSUMABLE_DB.length)];
        const newItem: KFieldItem = {
            id: `drop_${Date.now()}`,
            pos,
            data: template
        };
        
        setGameState(prev => ({
            ...prev,
            fieldItems: [...prev.fieldItems, newItem]
        }));
    };

    const startWave = (stage: number, sequence: number, wave: number) => {
        let newEnemies: KEntity[] = [];
        let logMsg = "";
        let bgmId: any = 'kocho_battle';
        let maxW = 3;

        // Keep track of occupied positions (starting with player)
        const occupiedPositions = new Set<number>();
        occupiedPositions.add(stateRef.current.player.pos);

        // Helper to find a safe spawn position
        const getSafeSpawnPos = (preferredPos: number): number => {
            if (!occupiedPositions.has(preferredPos)) {
                occupiedPositions.add(preferredPos);
                return preferredPos;
            }
            // Search outward for free spot
            // Prioritize further from player if possible, but simplicity: check all
            for (let i = 0; i < GRID_SIZE; i++) {
                if (!occupiedPositions.has(i)) {
                    occupiedPositions.add(i);
                    return i;
                }
            }
            // If grid is totally full (should be rare), fallback to original (will overlap but better than crash)
            return preferredPos; 
        };

        const createEnemySafe = (template: EnemyTemplate, index: number, bossPhase?: number) => {
             const pPos = stateRef.current.player.pos;
             let pos = index === 0 ? (pPos > 3 ? 0 : 6) : (pPos > 3 ? 1 + index : 5 - index);
             pos = Math.max(0, Math.min(GRID_SIZE - 1, pos));
             
             const safePos = getSafeSpawnPos(pos);
             return createEnemy(template, safePos, bossPhase);
        };

        // Stage Logic
        if (stateRef.current.isEndless || stage > FINAL_STAGE) {
            maxW = 1;
            const floor = Math.max(1, stateRef.current.endlessFloor || wave || 1);
            const endlessMobNames = [
                '放課後の見回り', '答案の亡霊', '購買部の圧',
                ...(floor >= 3 ? ['補習監督', '風紀委員長', '図書室監査員'] : []),
                ...(floor >= 6 ? ['放送委員の刺客', '生徒会監査'] : []),
                ...(floor >= 10 ? ['校則執行官'] : []),
            ];
            const endlessMobPool = endlessMobNames
                .map(name => ENEMY_TYPES.find(e => e.name === name))
                .filter((enemy): enemy is EnemyTemplate => Boolean(enemy));

            if (floor % 5 === 0) {
                const bossName = floor >= 15 ? '深夜校長' : floor >= 10 ? '校則執行官' : '生徒会監査';
                const boss = ENEMY_TYPES.find(e => e.name === bossName) || ENEMY_TYPES[0];
                newEnemies.push(createEnemySafe(boss, 0));
                const minion = endlessMobPool[Math.floor(Math.random() * endlessMobPool.length)] || ENEMY_TYPES[0];
                newEnemies.push(createEnemySafe(minion, 1));
                logMsg = `放課後エンドレス 補習${floor}限目 - ${boss.name}`;
                bgmId = 'kocho_boss';
            } else {
                const count = Math.min(4, 2 + Math.floor(floor / 4));
                for (let i = 0; i < count; i++) {
                    const template = endlessMobPool[Math.floor(Math.random() * endlessMobPool.length)] || ENEMY_TYPES[0];
                    newEnemies.push(createEnemySafe(template, i));
                }
                if (floor % 3 === 0) {
                    const enforcer = ENEMY_TYPES.find(e => e.name === '校則執行官');
                    if (enforcer && newEnemies.length < 4) newEnemies.push(createEnemySafe(enforcer, newEnemies.length));
                }
                logMsg = `放課後エンドレス 補習${floor}限目`;
                bgmId = floor % 3 === 0 ? 'kocho_boss' : 'kocho_battle';
            }
        } else if (stage === FINAL_STAGE) {
            // Final Boss (Sequence doesn't really matter here, but let's keep it clean)
            const boss = ENEMY_TYPES.find(e => e.name === '校長')!;
            newEnemies.push(createEnemySafe(boss, 0, 1)); // Phase 1
            logMsg = "最終決戦！校長室";
            bgmId = 'kocho_boss';
            maxW = 1;
        } else if (stage === 1) {
            // Tutorial Stage: Simple 3 waves -> Reward -> Next
            maxW = 3;
            // Standard Mobs
            const count = Math.min(3, Math.floor(wave / 2) + 1);
            for(let i=0; i<count; i++) {
                newEnemies.push(createEnemySafe(ENEMY_TYPES[0], i)); // Senior
            }
            logMsg = `Tutorial - Wave ${wave}/${maxW}`;
            bgmId = 'kocho_battle';
        } else {
            // Complex Stages (2-6)
            // Sequence 0: First Mobs (3-5 waves)
            // Sequence 1: Second Mobs (3-5 waves)
            // Sequence 2: Mid Boss (1 wave)

            if (sequence === 0 || sequence === 1) {
                if (wave === 1) {
                    // Randomize max waves for this sequence
                    maxW = Math.floor(Math.random() * 3) + 3; // 3 to 5
                } else {
                    maxW = stateRef.current.maxWaves;
                }

                const diff = stage + (sequence * 2) + Math.floor(wave / 2);
                const count = Math.min(4, Math.floor(diff / 2) + 1);
                const mobPoolNames = [
                    '不良生徒', '熱血教師', '用務員', 'ガリ勉',
                    ...(stage >= 3 ? ['図書委員長', '校庭ランナー', '飼育小屋番'] : []),
                    ...(stage >= 4 ? ['保健室の先生', '美術教師', '給食番長', '守衛ロボ'] : []),
                    ...(stage >= 5 ? ['放送部の怪人', '旧校舎の影', 'テストの化身'] : []),
                    ...(stage >= 6 ? ['PTAの圧', '文化祭実行委員', '卒業式の亡霊'] : []),
                ];
                const mobPool = mobPoolNames
                    .map(name => ENEMY_TYPES.find(e => e.name === name))
                    .filter((enemy): enemy is EnemyTemplate => Boolean(enemy));
                
                for(let i=0; i<count; i++) {
                    const template = mobPool[Math.floor(Math.random() * mobPool.length)] || ENEMY_TYPES[0];
                    newEnemies.push(createEnemySafe(template, i));
                }
                logMsg = `Stage ${stage}-${sequence+1} Wave ${wave}/${maxW}`;
                
                bgmId = 'kocho_battle';

            } else if (sequence === 2) {
                // Mid Boss
                maxW = 1;
                
                // Cycle bosses based on stage to ensure variety
                let midBossName = '教頭'; // Stage 2
                if (stage === 3) midBossName = '理科の先生';
                if (stage === 4) midBossName = '体育の先生';
                if (stage === 5) midBossName = '音楽の先生';
                if (stage === 6) midBossName = '生活指導';
                
                const mb = ENEMY_TYPES.find(e => e.name === midBossName) || ENEMY_TYPES[1];
                newEnemies.push(createEnemySafe(mb, 0));
                
                // Minion
                const minionName = stage > 4 ? '熱血教師' : '不良生徒';
                const minion = ENEMY_TYPES.find(e => e.name === minionName) || ENEMY_TYPES[0];
                newEnemies.push(createEnemySafe(minion, 1));

                logMsg = `強敵 ${mb.name} が現れた！`;
                bgmId = 'kocho_boss';
            }
        }

        // Reset Card Cooldowns at start of a new battle sequence/wave 1
        const isBattleStart = wave === 1;
        const currentHand = isBattleStart ? stateRef.current.hand.map(c => ({...c, currentCooldown: 0})) : stateRef.current.hand;

        const extraLog = stateRef.current.nextWaveMessage;

        setGameState(prev => ({
            ...prev,
            phase: 'BATTLE',
            pendingPhase: null,
            battleStage: stage,
            battleSequence: sequence,
            wave: wave,
            maxWaves: maxW,
            turn: 1,
            player: { 
                ...prev.player, 
                shield: prev.relics.some(r => r.id === 'R_SHIELD') ? 4 : 0,
                // Do not reset HP/Barrier
            }, 
            enemies: newEnemies,
            hand: currentHand,
            queue: [],
            status: 'PLAYING',
            logs: extraLog ? [logMsg, extraLog] : [logMsg],
            nextWaveMessage: undefined, // Clear message
            specialActionCooldown: 0,
            shopUpgradeUsed: false,
            fieldItems: prev.fieldItems
        }));

        audioService.playBGM(bgmId);
        if (stateRef.current.isEndless || stage > FINAL_STAGE) {
            const floor = Math.max(1, stateRef.current.endlessFloor || wave || 1);
            const isBossFloor = floor % 5 === 0;
            showAnnouncement(isBossFloor ? '補習監査' : `補習 ${floor}限目`, isBossFloor ? '放課後エンドレス強敵' : '放課後エンドレス', isBossFloor ? 'danger' : 'special', isBossFloor ? 1500 : 1100);
        } else if (stage === FINAL_STAGE) {
            showAnnouncement('最終決戦', '校長室', 'danger', 1700);
        } else if (sequence === 2) {
            const eliteName = newEnemies[0]?.name || '強敵';
            showAnnouncement('強敵出現', eliteName, 'danger', 1500);
        } else {
            const stageLabel = stage === 1 ? 'Tutorial' : `Stage ${stage}-${sequence + 1}`;
            showAnnouncement(`WAVE ${wave}/${maxW}`, stageLabel, 'battle', 1100);
        }
    };

    // Modified createEnemy to accept explicit pos instead of calculating internally based on index 
    // (Calculation moved to createEnemySafe in startWave)
    const createEnemy = (template: EnemyTemplate, pos: number, bossPhase?: number): KEntity => {
        const endlessFloor = stateRef.current.isEndless ? Math.max(1, stateRef.current.endlessFloor) : 0;
        const hpBonus = endlessFloor > 0 ? Math.floor(endlessFloor * 1.8) : 0;
        const maxHp = Math.ceil((template.maxHp + hpBonus) * getKochoDifficulty(stateRef.current.difficultyLevel).hpMultiplier);
        return {
            id: `e_${Date.now()}_${pos}`,
            type: 'ENEMY',
            name: template.name,
            pos: pos,
            facing: pos < 3 ? 1 : -1,
            maxHp,
            hp: maxHp,
            spriteName: template.sprite,
            shield: 0,
            barrier: 0,
            strength: 0,
            bossPhase: bossPhase,
            specialCD: template.special ? 5 : undefined, // Initialize Boss Special CD to 5 (Delay initial special)
            intent: {
                type: 'WAIT',
                timer: Math.floor(Math.random() * 2) + 1, // Staggered start
            }
        };
    };

    // --- GAME LOGIC ---

    const handlePickup = (pos: number, currentState: KochoGameState): KochoGameState => {
        const itemIdx = currentState.fieldItems.findIndex(i => i.pos === pos);
        if (itemIdx === -1) return currentState;
        
        const item = currentState.fieldItems[itemIdx];
        
        if (currentState.consumables.length < MAX_CONSUMABLES) {
            audioService.playSound('buff');
            addLog(`${item.data.name}を獲得！`);
            return {
                ...currentState,
                consumables: [...currentState.consumables, item.data],
                fieldItems: currentState.fieldItems.filter((_, i) => i !== itemIdx)
            };
        } else {
            // Full inventory, leave it
            return currentState;
        }
    };

    const tickCooldowns = (state: KochoGameState): KochoGameState => {
        // Relic: Boots (Move CD -1)
        const hasBoots = state.relics.some(r => r.id === 'R_BOOTS');

        return {
            ...state,
            hand: state.hand.map(c => ({
                ...c,
                currentCooldown: Math.max(0, c.currentCooldown - (c.type === 'MOVE' && hasBoots ? 2 : 1))
            })),
            specialActionCooldown: Math.max(0, state.specialActionCooldown - 1),
            totalTurns: state.totalTurns + 1 // Increment Total Turn Count
        };
    };

    const resolveEnemyTurn = (current: KochoGameState): { nextState: KochoGameState, vfx: KochoVFX[] } => {
        let nextState = { ...current };
        let enemies = [...nextState.enemies];
        let player = { ...nextState.player };
        let hand = [...nextState.hand];
        let logs = [...nextState.logs];
        let status = nextState.status;
        const generatedVfx: KochoVFX[] = [];

        // Relic: Thorn
        const hasThornRelic = current.relics.some(r => r.id === 'R_THORN');

        // 1. Decrement Enemy Timers & Special CD
        enemies = enemies.map(e => ({ 
            ...e, 
            intent: e.intent ? { ...e.intent, timer: Math.max(0, e.intent.timer - 1) } : undefined,
            specialCD: e.specialCD !== undefined ? Math.max(0, e.specialCD - 1) : undefined
        }));

        // 2. Resolve Actions
        for (let i = 0; i < enemies.length; i++) {
            let e = { ...enemies[i] };
            if (e.hp <= 0) continue;

            if (e.intent && e.intent.timer === 0) {
                if (e.intent.type === 'ATTACK') {
                    const attackTiles: number[] = [];
                    const range = e.intent.range || [];
                    range.forEach(r => {
                        const tile = e.pos + (r * e.facing);
                        if (tile >= 0 && tile < GRID_SIZE) attackTiles.push(tile);
                    });

                    let hitSomething = false;

                    // Effect fixes: Always show slash on targeted tiles with correct direction
                    attackTiles.forEach(tile => {
                        generatedVfx.push({ id: `v_atk_tile_${tile}_${Date.now()}_${Math.random()}`, type: 'SLASH', pos: tile, direction: e.facing });
                    });

                    // Hit Player
                    if (attackTiles.includes(player.pos)) {
                        const dmg = e.intent.damage || 0;
                        
                        // Check Barrier
                        if (player.barrier > 0) {
                            player.barrier--;
                            logs = [`${e.name}の攻撃を無効化！(バリア)`, ...logs];
                            generatedVfx.push({ id: `v_bar_${Date.now()}`, type: 'BARRIER', pos: player.pos });
                            triggerHitStop(90);
                            hitSomething = true;
                        } else {
                            const blocked = Math.min(dmg, player.shield);
                            const finalDmg = dmg - blocked;
                            
                            player.hp = Math.max(0, player.hp - finalDmg);
                            player.shield -= blocked;
                            
                            logs = [`${e.name}の攻撃！ ${finalDmg}ダメージ！`, ...logs];
                            
                            if (blocked > 0) generatedVfx.push({ id: `v_blk_p_${Date.now()}_${Math.random()}`, type: 'BLOCK', pos: player.pos });
                            if (finalDmg > 0) generatedVfx.push({ id: `v_dmg_p_${Date.now()}_${Math.random()}`, type: 'TEXT', pos: player.pos, text: finalDmg, color: 'text-red-500' });
                            triggerHitStop(finalDmg > 0 ? 120 : 90);

                            // Thorn Relic Effect
                            if (hasThornRelic) {
                                e.hp = Math.max(0, e.hp - 1);
                                generatedVfx.push({ id: `v_thn_${Date.now()}`, type: 'TEXT', pos: e.pos, text: 1, color: 'text-orange-500' });
                            }

                            if (player.hp <= 0) {
                                status = 'GAME_OVER';
                                audioService.playSound('lose'); // Play distinct lose sound only on death
                            } else {
                                audioService.playBattleSound('damage'); // Play less harsh damage sound
                            }
                            hitSomething = true;
                        }
                    }

                    // Hit Other Enemies (Friendly Fire)
                    for (let j = 0; j < enemies.length; j++) {
                        if (i === j) continue; // Don't hit self
                        let target = { ...enemies[j] }; // Copy target
                        if (target.hp <= 0) continue;

                        if (attackTiles.includes(target.pos)) {
                            const dmg = e.intent.damage || 0;
                            const blocked = Math.min(dmg, target.shield); 
                            const finalDmg = dmg - blocked;

                            target.hp = Math.max(0, target.hp - finalDmg);
                            target.shield = Math.max(0, target.shield - blocked);

                            logs = [`${e.name}の流れ弾が${target.name}にヒット！ ${finalDmg}ダメージ！`, ...logs];
                            
                            if (finalDmg > 0) generatedVfx.push({ id: `v_dmg_e_${Date.now()}_${Math.random()}`, type: 'TEXT', pos: target.pos, text: finalDmg, color: 'text-yellow-400' });
                            triggerHitStop(90);

                            hitSomething = true;
                            enemies[j] = target;
                        }
                    }

                    if (!hitSomething) {
                        logs = [`${e.name}の攻撃は空を切った。`, ...logs];
                        generatedVfx.push({ id: `v_miss_${Date.now()}_${Math.random()}`, type: 'TEXT', pos: player.pos, text: '回避', color: 'text-slate-200' });
                    }
                    
                    // Trigger Cooldown
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    e.intent = { type: 'WAIT', timer: template.attackCooldown || 1 };

                } else if (e.intent.type === 'SPECIAL') {
                    // Boss Special Execution
                    const sName = e.intent.specialName;
                    
                    if (sName === 'LECTURE') { // Vice Principal
                        logs = [`${e.name}の長話！(CD+1)`, ...logs];
                        hand = hand.map(c => ({ ...c, currentCooldown: c.currentCooldown + 1 }));
                        generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'TEXT', pos: e.pos, text: 'Lecture!', color: 'text-purple-400' });
                        generatedVfx.push({ id: `v_spec_cd_${Date.now()}`, type: 'TEXT', pos: player.pos, text: 'CD+1', color: 'text-purple-300' });
                        audioService.playSound('wrong');
                    } else if (sName === 'EXPLOSION') { // Science Teacher
                        logs = [`${e.name}の実験失敗！大爆発！`, ...logs];
                        // Damage player if in range (simple: just hit player)
                        const dmg = 3;
                        if (player.barrier > 0) {
                             player.barrier--;
                             generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'BARRIER', pos: player.pos });
                        } else {
                            player.hp = Math.max(0, player.hp - dmg);
                            generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'BLAST', pos: player.pos });
                            generatedVfx.push({ id: `v_dmg_${Date.now()}`, type: 'TEXT', pos: player.pos, text: dmg, color: 'text-red-500' });
                            if (player.hp <= 0) {
                                status = 'GAME_OVER';
                                audioService.playSound('lose');
                            } else {
                                audioService.playBattleSound('damage');
                            }
                        }
                    } else if (sName === 'SHIELD') { // PE Teacher
                        logs = [`${e.name}が号令をかけた！(Shield+5)`, ...logs];
                        e.shield += 5;
                        generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'BLOCK', pos: e.pos });
                        audioService.playBattleSound('block');
                    } else if (sName === 'LULLABY') { // Music Teacher
                        logs = [`${e.name}の子守唄... (Action CD+2)`, ...logs];
                        nextState.specialActionCooldown += 2;
                        generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'TEXT', pos: player.pos, text: 'Zzz...', color: 'text-blue-400' });
                        generatedVfx.push({ id: `v_spec_cd2_${Date.now()}`, type: 'TEXT', pos: player.pos, text: 'CD+2', color: 'text-blue-300' });
                    } else if (sName === 'CONFISCATE') { // Guidance Counselor
                        logs = [`${e.name}に10G没収された！`, ...logs];
                        nextState.money = Math.max(0, nextState.money - 10);
                        generatedVfx.push({ id: `v_spec_${Date.now()}`, type: 'TEXT', pos: player.pos, text: '-10G', color: 'text-yellow-500' });
                    }
                    
                    e.specialCD = 6; // Reset Special CD to 6 (forcing normal attacks)
                    e.intent = { type: 'WAIT', timer: 2 };

                } else if (e.intent.type === 'SUMMON') {
                    // Summon Logic
                    const emptyPos = [0,1,2,3,4,5,6].filter(p => !enemies.some(en => en.pos === p && en.hp > 0) && p !== player.pos);
                    if (emptyPos.length > 0) {
                        emptyPos.sort((a,b) => Math.abs(b - player.pos) - Math.abs(a - player.pos));
                        const spawnPos = emptyPos[0];
                        const minionName = e.intent.summonTarget || 'スライム'; // Fallback
                        const minionTemplate = ENEMY_TYPES.find(t => t.name === minionName) || ENEMY_TYPES[0];
                        const newMinion = {
                            id: `e_${Date.now()}_minion`,
                            type: 'ENEMY',
                            name: minionTemplate.name,
                            pos: spawnPos,
                            facing: spawnPos < 3 ? 1 : -1,
                            maxHp: minionTemplate.maxHp,
                            hp: minionTemplate.maxHp,
                            spriteName: minionTemplate.sprite,
                            shield: 0,
                            strength: 0,
                            intent: { type: 'WAIT', timer: 1 }
                        } as KEntity;
                        
                        enemies.push(newMinion);
                        generatedVfx.push({ id: `v_sum_${Date.now()}`, type: 'SUMMON', pos: spawnPos });
                        logs = [`${e.name}が${minionName}を呼び出した！`, ...logs];
                    }
                    e.intent = { type: 'WAIT', timer: 2 };
                    
                } else {
                    // AI Decision Phase (MOVE or WAIT ended)
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    const validRanges = template.range;

                    const distToPlayer = e.pos - player.pos;
                    const absDist = Math.abs(distToPlayer);
                    const inRange = validRanges.includes(absDist);
                    const neededFacing = distToPlayer < 0 ? 1 : -1;
                    const facingCorrect = e.facing === neededFacing;

                    // Boss Special Logic Check
                    let isSpecial = false;
                    if (template.special && e.specialCD !== undefined && e.specialCD <= 0) {
                        e.intent = { type: 'SPECIAL', timer: 1, specialName: template.special };
                        isSpecial = true;
                    }

                    // Boss Phase 3 Special Logic: Chance to Summon
                    if (!isSpecial && e.bossPhase === 3 && Math.random() < 0.3) {
                         e.intent = { type: 'SUMMON', timer: 1, summonTarget: '教頭' };
                         isSpecial = true;
                    }

                    if (!isSpecial) {
                        if (inRange && facingCorrect) {
                            const endlessAttackBonus = current.isEndless ? Math.floor(Math.max(1, current.endlessFloor) / 5) : 0;
                            const difficultyAttackBonus = getKochoDifficulty(current.difficultyLevel).damageBonus;
                            e.intent = {
                                type: 'ATTACK',
                                damage: template.attackDmg + endlessAttackBonus + difficultyAttackBonus,
                                range: template.range,
                                timer: 1
                            };
                        } else {
                            let bestTargetPos = e.pos;
                            let minCost = 999;

                            for (const r of validRanges) {
                                const t1_candidate = player.pos - r;
                                if (t1_candidate >= 0 && t1_candidate < GRID_SIZE) {
                                    const cost = Math.abs(e.pos - t1_candidate);
                                    if (cost < minCost) { minCost = cost; bestTargetPos = t1_candidate; }
                                }
                                const t2_candidate = player.pos + r;
                                if (t2_candidate >= 0 && t2_candidate < GRID_SIZE) {
                                    const cost = Math.abs(e.pos - t2_candidate);
                                    if (cost < minCost) { minCost = cost; bestTargetPos = t2_candidate; }
                                }
                            }

                            let moveDir = 0;
                            if (bestTargetPos > e.pos) moveDir = 1;
                            else if (bestTargetPos < e.pos) moveDir = -1;

                            if (moveDir !== 0) {
                                const nextPos = e.pos + moveDir;
                                const blocked = enemies.some((other, idx) => idx !== i && other.pos === nextPos && other.hp > 0) || player.pos === nextPos;
                                if (!blocked) {
                                    e.pos = nextPos;
                                }
                                e.facing = moveDir as Facing;
                            } else {
                                e.facing = neededFacing as Facing; 
                            }
                            e.intent = { type: 'MOVE', timer: 1 };
                        }
                    }
                }
            }
            enemies[i] = e;
            if (status === 'GAME_OVER') break;
        }

        // BOSS EVOLUTION CHECK
        for (let i = 0; i < enemies.length; i++) {
             const e = enemies[i];
             if (e.hp <= 0 && e.bossPhase !== undefined) {
                 if (e.bossPhase < 3) {
                     // Evolve!
                     const nextPhase = e.bossPhase + 1;
                     const nextName = nextPhase === 2 ? '激怒校長' : '真・校長';
                     const template = ENEMY_TYPES.find(t => t.name === nextName)!;
                     
                     enemies[i] = {
                         ...e,
                         name: template.name,
                         spriteName: template.sprite,
                         maxHp: template.maxHp,
                         hp: template.maxHp,
                         bossPhase: nextPhase,
                         shield: 10, // Evolution bonus shield
                         intent: { type: 'WAIT', timer: 1 } // Pause a bit
                     };
                     
                     generatedVfx.push({ id: `v_evo_${Date.now()}`, type: 'EVOLVE', pos: e.pos });
                     generatedVfx.push({ id: `v_txt_evo_${Date.now()}`, type: 'TEXT', pos: e.pos, text: 'EVOLUTION!', color: 'text-purple-400' });
                     logs = [`${e.name}が真の姿を現した！`, ...logs];
                     showAnnouncement(`PHASE ${nextPhase}`, template.name, 'phase', 1500);
                     audioService.playSound('buff');
                 }
             }
        }
        
        return { nextState: { ...nextState, enemies, player, hand, logs: logs.slice(0, 4), status }, vfx: generatedVfx };
    };

    // --- ACTION HANDLERS ---
    
    const useConsumable = (index: number) => {
        if (animating) return;
        const state = stateRef.current;
        const item = state.consumables[index];
        if (!item) return;

        let used = false;
        let p = { ...state.player };
        let hand = [...state.hand];
        let enemies = [...state.enemies];
        let logs = [...state.logs];

        // Relic: Recycler (20% chance to not consume)
        const hasRecycler = state.relics.some(r => r.id === 'R_RECYCLE');
        const recycled = hasRecycler && Math.random() < 0.2;

        if (item.type === 'HEAL') {
            p.hp = Math.min(p.maxHp, p.hp + item.value);
            addVfx('HEAL', p.pos);
            logs.unshift(tr(`HPを${item.value}回復！`));
            used = true;
        } else if (item.type === 'BARRIER') {
            p.barrier += item.value;
            addVfx('BARRIER', p.pos);
            logs.unshift(tr(`バリアを展開！`));
            used = true;
        } else if (item.type === 'CD_REDUCE') {
            const reduceVal = item.value === 99 ? 99 : item.value;
            hand = hand.map(c => ({ ...c, currentCooldown: Math.max(0, c.currentCooldown - reduceVal) }));
            addVfx('BUFF', p.pos);
            addVfx('TEXT', p.pos, { text: item.value === 99 ? 'CD全快' : `CD-${item.value}`, color: 'text-cyan-300', durationMs: 900 });
            logs.unshift(tr(`手札のCDを${item.value === 99 ? '全' : item.value}短縮！`));
            used = true;
        } else if (item.type === 'BOMB') {
            enemies.forEach(e => {
                if (e.hp > 0) {
                    e.hp = Math.max(0, e.hp - item.value);
                    addVfx('BLAST', e.pos);
                }
            });
            logs.unshift(tr(`手榴弾！全体に${item.value}ダメージ！`));
            used = true;
        } else if (item.type === 'STRENGTH') {
            p.strength += 3;
            addVfx('BUFF', p.pos);
            logs.unshift(tr(`激辛カレー！次の攻撃力+3！`));
            used = true;
        }

        if (used) {
            audioService.playSound('buff');
            let newConsumables = state.consumables;
            if (!recycled) {
                newConsumables = state.consumables.filter((_, i) => i !== index);
            } else {
                logs.unshift(tr("リサイクル成功！消費しなかった！"));
            }
            
            setGameState({
                ...state,
                player: p,
                hand: hand,
                enemies: enemies,
                logs: logs,
                consumables: newConsumables
            });
        }
    };

    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);

        const current = stateRef.current;
        const newPos = current.player.pos + dir;
        
        if (newPos >= 0 && newPos < GRID_SIZE && !current.enemies.some(e => e.pos === newPos && e.hp > 0)) {
            // 1. Move Player
            let intermediateState = {
                ...current,
                player: { ...current.player, pos: newPos }
            };

            // CHECK ITEM PICKUP
            intermediateState = handlePickup(newPos, intermediateState);
            
            setGameState(intermediateState);
            audioService.playSound('select');
            
            const anyEnemyActing = current.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
            const delay = anyEnemyActing ? 250 : 30;

            await new Promise(r => setTimeout(r, delay)); 
            
            const { nextState, vfx } = resolveEnemyTurn(intermediateState);
            vfx.forEach(v => addVfx(v.type, v.pos, v));
            let finalState = tickCooldowns(nextState);
            setGameState(finalState);
        } else {
            audioService.playSound('wrong');
        }
        setAnimating(false);
    };

    const handleTurn = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        
        let current = stateRef.current;
        const intermediateState = { ...current, player: { ...current.player, facing: (current.player.facing * -1) as Facing } };
        
        setGameState(intermediateState);
        audioService.playSound('select');
        addLog("向きを変えた。");

        const anyEnemyActing = current.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
        const delay = anyEnemyActing ? 250 : 30;

        await new Promise(r => setTimeout(r, delay));
        const { nextState, vfx } = resolveEnemyTurn(intermediateState);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        let finalState = tickCooldowns(nextState);
        
        setGameState(finalState);
        setAnimating(false);
    };

    const handleWait = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        addLog("待機した。");
        audioService.playSound('select');
        
        const anyEnemyActing = stateRef.current.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
        const delay = anyEnemyActing ? 250 : 30;

        await new Promise(r => setTimeout(r, delay));
        
        const { nextState, vfx } = resolveEnemyTurn(stateRef.current);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        let finalState = tickCooldowns(nextState);
        setGameState(finalState);
        setAnimating(false);
    };

    const handleSwapPosition = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        
        const current = stateRef.current;
        if (current.specialActionCooldown > 0) {
            audioService.playSound('wrong');
            addLog("位置交換: クールダウン中");
            return;
        }

        const p = current.player;
        const targetPos = p.pos + p.facing;
        const enemyInFront = current.enemies.find(e => e.pos === targetPos && e.hp > 0);
        
        if (!enemyInFront) {
            addLog("目の前に敵がいません");
            audioService.playSound('wrong');
            return;
        }

        setAnimating(true);
        addLog("位置交換！");
        audioService.playSound('select');
        addVfx('WARP', p.pos);
        addVfx('WARP', targetPos);
        
        const newEnemies = current.enemies.map(e => 
            e.id === enemyInFront.id ? { ...e, pos: p.pos } : e
        );

        // 1. Player Action
        let intermediateState = {
            ...current,
            player: { ...current.player, pos: targetPos },
            enemies: newEnemies,
            specialActionCooldown: 3 + 1
        };
        // Check Item Pickup at new pos
        intermediateState = handlePickup(targetPos, intermediateState);
        
        setGameState(intermediateState);

        // 2. Enemy Reaction
        const anyEnemyActing = current.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
        const delay = anyEnemyActing ? 250 : 30;

        await new Promise(r => setTimeout(r, delay)); 
        const { nextState, vfx } = resolveEnemyTurn(intermediateState);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        let finalState = tickCooldowns(nextState);
        
        setGameState(finalState);
        setAnimating(false);
    };

    const handleQueueCard = async (card: KCard, idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        if (card.currentCooldown > 0) {
            audioService.playSound('wrong');
            addLog("クールダウン中！");
            return;
        }
        if (stateRef.current.queue.length >= 3) {
            addLog("キューが一杯です！");
            return;
        }
        
        setAnimating(true);
        audioService.playSound('select');

        // 1. Queue Card (Player Action)
        let current = stateRef.current;
        const newHand = [...current.hand];
        newHand.splice(idx, 1);
        
        const intermediateState = {
            ...current,
            hand: newHand,
            queue: [...current.queue, card]
        };
        setGameState(intermediateState);

        // 2. Enemy Reaction (Planning consumes a turn)
        const anyEnemyActing = current.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
        const delay = anyEnemyActing ? 250 : 30;

        await new Promise(r => setTimeout(r, delay));
        const { nextState, vfx } = resolveEnemyTurn(intermediateState);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        let finalState = tickCooldowns(nextState);

        setGameState(finalState);
        setAnimating(false);
    };

    const handleUnqueueCard = (idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        
        const card = stateRef.current.queue[idx];
        const newQueue = [...stateRef.current.queue];
        newQueue.splice(idx, 1);
        
        setGameState(prev => ({
            ...prev,
            queue: newQueue,
            hand: [...prev.hand, card]
        }));
    };

    const executeQueue = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating || stateRef.current.queue.length === 0) return;
        setAnimating(true);
        setGameState(prev => ({ ...prev, status: 'EXECUTING' }));

        const queue = [...stateRef.current.queue];
        const cardsReturningToHand: KCard[] = [];
        
        let currentState = { ...stateRef.current };

        // Execute all player cards
        for (const card of queue) {
            if (currentState.status === 'GAME_OVER') break;
            
            activeActionCardNameRef.current = card.name;
            setActiveActionCardName(card.name);
            addLog(`${card.name}！`);
            
            const p = currentState.player;
            const pPos = p.pos;
            let nextPlayer = { ...p };
            let nextEnemies = currentState.enemies.map(e => ({...e}));
            let nextFieldItems = [...currentState.fieldItems];
            
            let hit = false;
            let dmgBonus = 0;
            if (currentState.relics.some(r => r.id === 'R_GLOVES')) dmgBonus += 1;
            dmgBonus += p.strength;

            let targets: number[] = [];
            if (card.effectType === 'FURTHEST') {
                let furthestDist = -1;
                let targetPos = -1;
                nextEnemies.forEach(e => {
                    if (e.hp > 0) {
                        const dist = Math.abs(e.pos - pPos);
                        if (dist > furthestDist) { furthestDist = dist; targetPos = e.pos; }
                    }
                });
                if (targetPos !== -1) targets = [targetPos];
            } else if (card.effectType === 'PIERCE') {
                // All enemies in range
                card.range.forEach(r => {
                    const tPos = pPos + (r * p.facing);
                    if (tPos >= 0 && tPos < GRID_SIZE) targets.push(tPos);
                });
            } else if (card.type === 'ATTACK' && card.effectType !== 'DASH_ATTACK' && card.effectType !== 'PIERCE_DASH') {
                // Standard or Push/Pull etc.
                // If NORMAL, only target the FIRST valid enemy in range
                if (card.effectType === 'NORMAL' || !card.effectType || card.effectType === 'COUNTER' || card.effectType === 'PUSH' || card.effectType === 'PULL' || card.effectType === 'RECOIL' || card.effectType === 'STUN' || card.effectType === 'DRAIN') {
                    // Sort ranges by distance from player
                    const sortedRange = [...card.range].sort((a,b) => a - b);
                    for (const r of sortedRange) {
                        const tPos = pPos + (r * p.facing);
                        if (tPos >= 0 && tPos < GRID_SIZE) {
                            if (nextEnemies.some(e => e.pos === tPos && e.hp > 0)) {
                                targets = [tPos];
                                break; // Hit first only
                            }
                        }
                    }
                } else {
                    // Fallback (e.g. area specific)
                    targets = card.range.map(r => pPos + (r * p.facing));
                }
            } else if (card.effectType !== 'DASH_ATTACK' && card.effectType !== 'PIERCE_DASH') {
                 targets = card.range.map(r => pPos + (r * p.facing));
            }

            if (card.type === 'ATTACK') {
                if (card.effectType === 'DASH_ATTACK') {
                    // Dash Attack (Tackle): Move until hitting enemy
                    let finalPos = pPos;
                    let pathBlocked = false;
                    for (let i = 1; i <= Math.max(...card.range); i++) {
                        const checkPos = pPos + (i * p.facing);
                        if (checkPos < 0 || checkPos >= GRID_SIZE) break;
                        
                        // Visual effect for movement
                        addVfx('WARP', checkPos, { color: 'text-cyan-500' });
                        addVfx('AFTERIMAGE', checkPos, { color: 'text-cyan-300', direction: p.facing, durationMs: 340 });

                        const hitEnemy = nextEnemies.find(e => e.pos === checkPos && e.hp > 0);
                        if (hitEnemy) { 
                            targets = [checkPos]; 
                            pathBlocked = true;
                            // Stop *before* enemy
                            const stopPos = checkPos - p.facing;
                            // Ensure stopPos is valid and not player start pos (if i=1, stopPos = pPos, which is fine)
                            if (stopPos >= 0 && stopPos < GRID_SIZE && stopPos !== pPos) {
                                finalPos = stopPos;
                            }
                            break; 
                        }
                        finalPos = checkPos; // Keep moving if empty
                    }
                    nextPlayer.pos = finalPos;
                    currentState = handlePickup(finalPos, currentState); 
                }
                
                if (card.effectType === 'PIERCE_DASH') {
                    // Sliding: Move through first enemy, hit them, land behind, possibly hit second
                    let firstEnemyFound = false;
                    let finalPos = pPos;

                    for (let i = 1; i <= Math.max(...card.range); i++) {
                        const checkPos = pPos + (i * p.facing);
                        if (checkPos < 0 || checkPos >= GRID_SIZE) break;
                        
                        addVfx('WARP', checkPos, { color: 'text-indigo-400' }); // Trail
                        addVfx('AFTERIMAGE', checkPos, { color: 'text-indigo-300', direction: p.facing, durationMs: 360 });

                        const hitEnemy = nextEnemies.find(e => e.pos === checkPos && e.hp > 0);
                        
                        if (!firstEnemyFound) {
                            if (hitEnemy) {
                                // Hit first enemy
                                targets.push(checkPos);
                                firstEnemyFound = true;
                                // Try to land BEHIND them
                                const landPos = checkPos + p.facing;
                                if (landPos >= 0 && landPos < GRID_SIZE) {
                                    // Move to landPos regardless of enemy? 
                                    // If landPos has enemy, we hit them too and stop there.
                                    finalPos = landPos;
                                    const secondEnemy = nextEnemies.find(e => e.pos === landPos && e.hp > 0);
                                    if (secondEnemy) {
                                        targets.push(landPos);
                                        // Stop after hitting second
                                    }
                                } else {
                                    // Can't move past, stop at enemy? No, sliding stops *before* if blocked by wall?
                                    // Or stops at enemy tile (collision)? Let's assume stops before if can't pierce.
                                    // Fallback: stay at checkPos - facing
                                    finalPos = checkPos - p.facing; 
                                }
                                break; // Sequence end
                            } else {
                                finalPos = checkPos; // Empty space, continue sliding
                            }
                        }
                    }
                    
                    // PUSH MECHANIC (New)
                    const overlappingEnemy = nextEnemies.find(e => e.pos === finalPos && e.hp > 0);
                    if (overlappingEnemy) {
                        // Try push same direction
                        let pushPos = finalPos + p.facing;
                        let pushed = false;
                            if (pushPos >= 0 && pushPos < GRID_SIZE && !nextEnemies.some(e => e.pos === pushPos && e.hp > 0) && pushPos !== pPos) {
                                 overlappingEnemy.pos = pushPos;
                                 addLog(`${overlappingEnemy.name}を押し出した！`);
                                 addVfx('IMPACT', pushPos);
                                 addVfx('PUSH', pushPos, { direction: p.facing, durationMs: 520 });
                                 pushed = true;
                        } 
                        
                        if (!pushed) {
                            // Try push opposite
                            pushPos = finalPos - p.facing;
                            if (pushPos >= 0 && pushPos < GRID_SIZE && !nextEnemies.some(e => e.pos === pushPos && e.hp > 0) && pushPos !== pPos) {
                                overlappingEnemy.pos = pushPos;
                                addLog(`${overlappingEnemy.name}を背後に押し出した！`);
                                addVfx('IMPACT', pushPos);
                                addVfx('PUSH', pushPos, { direction: (-p.facing) as Facing, durationMs: 520 });
                                pushed = true;
                            }
                        }

                        if (!pushed) {
                            // Failed to push, player steps back
                            finalPos = finalPos - p.facing;
                            // Ensure bounds
                            finalPos = Math.max(0, Math.min(GRID_SIZE - 1, finalPos));
                        }
                    }

                    nextPlayer.pos = finalPos;
                    currentState = handlePickup(finalPos, currentState);
                }

                // Filter for enemies hit based on targets calculated above
                let hits = nextEnemies.filter(e => targets.includes(e.pos) && e.hp > 0);

                const isRanged = card.range.some(r => r > 1);
                // Visual blast on empty tiles if missed or ranged area effect
                if (isRanged && hits.length === 0) {
                     if (card.effectType === 'NORMAL') {
                         const maxR = Math.max(...card.range);
                         const tPos = pPos + (maxR * p.facing);
                         if (tPos >= 0 && tPos < GRID_SIZE) addVfx('BLAST', tPos, { color: 'text-gray-500' });
                     } else {
                         targets.forEach(t => { if (t >= 0 && t < GRID_SIZE) addVfx('BLAST', t, { color: 'text-gray-500' }); });
                     }
                }

                if (hits.length > 0) {
                    hit = true;
                    // Consume strength after first successful hit
                    if (nextPlayer.strength > 0) {
                        nextPlayer.strength = 0;
                    }

                    hits.forEach(e => {
                        let finalDmg = card.damage + dmgBonus;
                        if (card.effectType === 'COUNTER') {
                            if (e.intent && (e.intent.type === 'ATTACK' || e.intent.timer <= 1)) {
                                finalDmg *= 3;
                                addLog("カウンター成功！");
                                addVfx('COUNTER', e.pos);
                            }
                        }

                        e.hp -= finalDmg;
                        addLog(`${e.name} に ${finalDmg} ダメージ！`);
                        addVfx(isRanged ? 'BLAST' : 'SLASH', e.pos, { direction: card.range[0] < 0 ? (-p.facing) as Facing : p.facing });
                        addVfx('TEXT', e.pos, { text: finalDmg, color: 'text-yellow-400' });
                        triggerHitStop(isRanged ? 95 : 120);

                        // DRAIN Effect
                        if (card.effectType === 'DRAIN') {
                            nextPlayer.hp = Math.min(nextPlayer.maxHp, nextPlayer.hp + 1);
                            addVfx('HEAL', nextPlayer.pos);
                        }

                        // STUN Effect
                        if (card.effectType === 'STUN') {
                            if (e.intent) {
                                e.intent.timer += 1;
                                addVfx('STUN', e.pos);
                                addVfx('TEXT', e.pos, { text: 'スタン', color: 'text-yellow-300', durationMs: 900 });
                                addLog(`${e.name}をスタンさせた！`);
                            }
                        }

                        if (e.hp <= 0) {
                            spawnConsumable(e.pos); // Drop item
                            // Relic: Vampire Fang
                            if (currentState.relics.some(r => r.id === 'R_FANG')) {
                                nextPlayer.hp = Math.min(nextPlayer.maxHp, nextPlayer.hp + 1);
                                addVfx('HEAL', nextPlayer.pos);
                            }
                        }

                        if (card.effectType === 'PUSH') {
                            const pushDir = p.facing;
                            let targetPos = e.pos;
                            for(let k=0; k<2; k++) {
                                const next = targetPos + pushDir;
                                const isBlocked = nextEnemies.some(o => o.pos === next && o.hp > 0) || nextPlayer.pos === next || next < 0 || next >= GRID_SIZE;
                                if (!isBlocked) targetPos = next; else break;
                            }
                            if (targetPos !== e.pos) {
                                e.pos = targetPos;
                                addLog(`${e.name}を吹き飛ばした！`);
                                addVfx('IMPACT', e.pos);
                                addVfx('PUSH', e.pos, { direction: pushDir as Facing, durationMs: 520 });
                            }
                        }

                        if (card.effectType === 'PULL') {
                            const dest = p.pos + p.facing; 
                            const isBlocked = nextEnemies.some(o => o.pos === dest && o.id !== e.id && o.hp > 0) || nextPlayer.pos === dest;
                            if (!isBlocked && dest >= 0 && dest < GRID_SIZE) {
                                e.pos = dest;
                                addLog(`${e.name}を引き寄せた！`);
                                addVfx('IMPACT', e.pos);
                                addVfx('PULL', e.pos, { direction: p.facing, durationMs: 520 });
                            }
                        }
                    });
                    
                    if (card.effectType === 'RECOIL') {
                        const recoilPos = p.pos - p.facing;
                        const isBlocked = nextEnemies.some(e => e.pos === recoilPos && e.hp > 0) || recoilPos < 0 || recoilPos >= GRID_SIZE;
                        if (!isBlocked) { 
                            nextPlayer.pos = recoilPos; 
                            addLog("反動で後退！"); 
                            addVfx('AFTERIMAGE', recoilPos, { color: 'text-orange-300', direction: p.facing, durationMs: 320 });
                        }
                    }

                    if (card.shield && card.shield > 0) {
                        nextPlayer.shield += card.shield;
                        addLog(`シールド +${card.shield}`);
                        addVfx('BLOCK', p.pos);
                    }
                    audioService.playBattleSound('attack');
                } else {
                    addLog("空振り...");
                    audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                // Modified MOVE logic: Slide until blocked
                let finalPos = pPos;
                const dist = Math.max(...card.range);
                
                for (let i = 1; i <= dist; i++) {
                    const checkPos = pPos + (i * p.facing);
                    if (checkPos < 0 || checkPos >= GRID_SIZE) break;
                    
                    addVfx('WARP', checkPos, { color: 'text-blue-500' }); // Trail

                    const isBlocked = nextEnemies.some(e => e.pos === checkPos && e.hp > 0);
                    if (isBlocked) break;
                    
                    finalPos = checkPos;
                }
                
                if (finalPos !== pPos) {
                    nextPlayer.pos = finalPos;
                    audioService.playSound('select');
                    // Check Pickup
                    currentState = handlePickup(finalPos, currentState);
                } else {
                    addLog("移動できない！");
                }
            } else if (card.type === 'UTILITY') {
                if (card.effectType === 'HEAL') {
                    nextPlayer.hp = Math.min(nextPlayer.maxHp, nextPlayer.hp + 3);
                    addVfx('HEAL', nextPlayer.pos);
                    addLog("HP回復！");
                } else if (card.name === 'バックステップ') {
                    const target = pPos - p.facing;
                    if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target && e.hp > 0)) {
                        nextPlayer.pos = target;
                        audioService.playSound('select');
                    }
                } else if (card.shield && card.shield > 0) {
                    nextPlayer.shield += card.shield;
                    addVfx('BLOCK', p.pos);
                    audioService.playBattleSound('block');
                }
            }

            // Sync intermediate state
            currentState = { ...currentState, player: nextPlayer, enemies: nextEnemies }; 
            cardsReturningToHand.push({ ...card, currentCooldown: card.cooldown });
            
            setGameState(prev => {
                 return { ...prev, player: nextPlayer, enemies: nextEnemies };
            });
            if (hit) {
                await new Promise(r => setTimeout(r, 90));
            }
            await new Promise(r => setTimeout(r, 400));
            activeActionCardNameRef.current = null;
            setActiveActionCardName(null);
            
            // Check pickup after move
            setGameState(prev => handlePickup(prev.player.pos, prev));
        }

        activeActionCardNameRef.current = null;
        setActiveActionCardName(null);

        // Enemy Turn after combo
        if (currentState.status !== 'GAME_OVER' && currentState.enemies.some(e => e.hp > 0)) {
             const anyEnemyActing = currentState.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
             const delay = anyEnemyActing ? 250 : 30;
             await new Promise(r => setTimeout(r, delay));
             
             // Refresh state from ref before enemy turn
             const freshState = stateRef.current;
             const { nextState, vfx } = resolveEnemyTurn(freshState);
             vfx.forEach(v => addVfx(v.type, v.pos, v));
             currentState = tickCooldowns(nextState);
             setGameState(currentState);
             
             if (anyEnemyActing) {
                 await new Promise(r => setTimeout(r, 400));
             }
        }

        // Cleanup
        setGameState(prev => {
            if (prev.status === 'GAME_OVER') {
                 // The useEffect hook will catch status change and save score
                 return prev;
            }
            
            const aliveEnemies = prev.enemies.filter(e => e.hp > 0);
            let newHand = [...prev.hand, ...cardsReturningToHand];
            
            if (aliveEnemies.length === 0) {
                const rewardMoney = 10 + prev.battleStage * 5;
                const defeatedCount = prev.enemies.length;
                const endlessScoreGain = Math.floor((defeatedCount * 100 + Math.max(1, prev.endlessFloor) * 25) * getKochoDifficulty(prev.difficultyLevel).scoreMultiplier);
                setTimeout(() => handlePhaseComplete(), 1000);
                return {
                    ...prev,
                    status: 'WAVE_CLEAR',
                    queue: [],
                    hand: newHand,
                    money: prev.money + rewardMoney,
                    logs: [...prev.logs, `Wave Clear! +${rewardMoney}G`],
                    enemies: aliveEnemies,
                    endlessKills: prev.isEndless ? prev.endlessKills + defeatedCount : prev.endlessKills,
                    endlessScore: prev.isEndless ? prev.endlessScore + endlessScoreGain : prev.endlessScore
                };
            }

            return { ...prev, status: 'PLAYING', queue: [], hand: newHand, enemies: aliveEnemies };
        });

        setAnimating(false);
    };

    const handlePhaseComplete = () => {
        const current = stateRef.current;
        let nextPhase = current.phase;
        let nextWave = current.wave + 1;
        let nextStageVal = current.battleStage;
        let nextSequence = current.battleSequence;

        if (current.isEndless) {
            if (current.phase === 'BATTLE') {
                if (current.endlessFloor % 5 === 0) {
                    nextPhase = 'SHOP';
                } else if (current.endlessFloor % 3 === 0) {
                    nextPhase = 'UPGRADE_EVENT';
                } else {
                    nextPhase = 'REWARD';
                }
            } else {
                const nextFloor = current.endlessFloor + 1;
                nextStageVal = FINAL_STAGE + nextFloor;
                nextSequence = nextFloor % 5;
                nextWave = 1;
                nextPhase = 'BATTLE';
            }
        }
        // Stage 1: Tutorial (Linear)
        else if (current.battleStage === 1) {
            if (nextWave > current.maxWaves) {
                if (current.phase === 'BATTLE') nextPhase = 'REWARD';
                else if (current.phase === 'REWARD') { nextStageVal++; nextSequence = 0; nextWave = 1; nextPhase = 'BATTLE'; }
            } else {
                nextPhase = 'BATTLE';
            }
        } 
        // Stage 7: Final Boss (Linear)
        else if (current.battleStage === FINAL_STAGE) {
            if (nextWave > current.maxWaves) {
                nextPhase = 'VICTORY';
            } else {
                nextPhase = 'BATTLE';
            }
        }
        // Stages 2-6: Complex Loop
        else {
             if (current.phase === 'BATTLE') {
                 if (nextWave > current.maxWaves) {
                     // End of Current Sequence's Waves
                     if (current.battleSequence === 0) {
                         nextPhase = 'REWARD';
                     } else if (current.battleSequence === 1) {
                         nextPhase = 'UPGRADE_EVENT';
                     } else if (current.battleSequence === 2) {
                         nextPhase = 'SHOP';
                     }
                 } else {
                     // Continue waves
                     nextPhase = 'BATTLE';
                 }
             } else if (current.phase === 'REWARD') {
                 // Reward -> Battle Sequence 1 (2nd Mob Wave)
                 nextSequence = 1;
                 nextWave = 1;
                 nextPhase = 'BATTLE';
             } else if (current.phase === 'UPGRADE_EVENT') {
                 // Upgrade -> Battle Sequence 2 (MidBoss)
                 nextSequence = 2;
                 nextWave = 1;
                 nextPhase = 'BATTLE';
             } else if (current.phase === 'SHOP') {
                 // Shop -> Next Stage
                 nextStageVal++;
                 nextSequence = 0;
                 nextWave = 1;
                 nextPhase = 'BATTLE';
             }
        }

        // Check for Intermission
        const isIntermission = ['REWARD', 'SHOP', 'UPGRADE_EVENT'].includes(nextPhase);

        if (isIntermission) {
             setGameState(prev => ({
                 ...prev,
                 battleStage: nextStageVal,
                 battleSequence: nextSequence,
                 wave: nextWave,
                 phase: 'MATH',
                 pendingPhase: nextPhase as GamePhase, 
                 status: 'PLAYING'
             }));
             audioService.playBGM('math');
        } else {
             // Direct transition
             if (nextPhase === 'VICTORY') {
                  setGameState(prev => ({ ...prev, status: 'VICTORY', pendingPhase: null }));
                  audioService.playSound('win');
              } else if (nextPhase === 'BATTLE') {
                  if (stateRef.current.isEndless) {
                      const nextFloor = Math.max(1, nextStageVal - FINAL_STAGE);
                      const nextState = {
                          ...stateRef.current,
                          endlessFloor: nextFloor,
                          battleStage: FINAL_STAGE + nextFloor,
                          battleSequence: nextFloor % 5,
                          wave: 1
                      };
                      stateRef.current = nextState;
                      setGameState(nextState);
                      startWave(FINAL_STAGE + nextFloor, nextFloor % 5, 1);
                  } else {
                      startWave(nextStageVal, nextSequence, nextWave);
                  }
              }
        }
    };

    const handleMathComplete = (correctCount: number) => {
        const targetPhase = stateRef.current.pendingPhase;
        if (!targetPhase) return; 

        const isMaxCorrect = correctCount >= 3;
        const bonusMsg = isMaxCorrect ? "全問正解！HP+1" : "";
        
        if (isMaxCorrect) {
             addVfx('HEAL', stateRef.current.player.pos);
             audioService.playSound('buff');
        }

        // Side effects for transitions that don't depend on gameState setter
        if (targetPhase === 'REWARD') {
             generateRewards();
             audioService.playSound('win');
        } else if (targetPhase === 'SHOP' || targetPhase === 'UPGRADE_EVENT') {
             audioService.playBGM('kocho_setup');
        } else if (targetPhase === 'VICTORY') {
             audioService.playSound('win');
        }

        setGameState(prev => {
            let nextState = { ...prev, pendingPhase: null };

            // Apply Phase Transition
            if (targetPhase === 'REWARD') {
                nextState.phase = 'REWARD';
                nextState.status = 'PLAYING';
            } else if (targetPhase === 'SHOP' || targetPhase === 'UPGRADE_EVENT') {
                let newInventory: KRelic[] = [];
                if (targetPhase === 'SHOP') {
                    const available = SHOP_RELICS.filter(r => !prev.relics.some(owned => owned.id === r.id));
                    for (let i = 0; i < 2; i++) {
                        if (available.length === 0) break;
                        const idx = Math.floor(Math.random() * available.length);
                        newInventory.push(available[idx]);
                        available.splice(idx, 1);
                    }
                }
                
                nextState.phase = targetPhase;
                nextState.status = 'PLAYING';
                nextState.shopUpgradeUsed = false;
                nextState.currentUpgradeOffer = getRandomOffer();
                nextState.shopInventory = newInventory;
            } else if (targetPhase === 'VICTORY') {
                nextState.status = 'VICTORY';
            }

            // Apply Bonus & Log
            if (isMaxCorrect) {
                nextState.player = { 
                    ...nextState.player, 
                    hp: Math.min(nextState.player.maxHp, nextState.player.hp + 1) 
                };
                const msg = "計算ボーナス: HP+1";
                nextState.logs = [msg, ...nextState.logs.slice(0, 4)];
                nextState.nextWaveMessage = msg; // Save for next wave log
            }

            return nextState;
        });
    };

    const nextStage = () => {
        // Just trigger phase completion logic which handles stage increment
        handlePhaseComplete();
    };

    const generateRewards = () => {
        const unlockedPool = getUnlockedKochoCardTemplates();
        const uniquePool = unlockedPool.filter(c => !stateRef.current.hand.some(h => h.name === c.name));
        const pool = uniquePool.length > 0 ? [...uniquePool] : [...unlockedPool];
        const options: KCard[] = [];
        for (let i = 0; i < 2; i++) {
            if (pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            const template = pool.splice(idx, 1)[0];
            options.push({ ...template, id: `rew_${Date.now()}_${i}`, currentCooldown: 0, usedSlots: 0 });
        }
        setRewardCards(options);
    };

    const selectReward = (card: KCard) => {
        setGameState(prev => ({
            ...prev,
            hand: [...prev.hand, card],
            status: 'PLAYING'
        }));
        setTimeout(() => handlePhaseComplete(), 100);
    };

    const buyShopItem = (item: KRelic) => {
        const finalPrice = getShopPrice(item.price);
        if (gameState.money >= finalPrice) {
            if (item.id === 'R_POTION') {
                setGameState(prev => ({
                    ...prev,
                    money: prev.money - finalPrice,
                    player: { ...prev.player, hp: Math.min(prev.player.maxHp, prev.player.hp + 10) }
                }));
                audioService.playSound('buff');
                addLog("HPが回復した！");
            } else {
                if (gameState.relics.some(r => r.id === item.id)) return;
                setGameState(prev => ({
                    ...prev,
                    money: prev.money - finalPrice,
                    relics: [...prev.relics, item]
                }));
                audioService.playSound('select');
                addLog(`${item.name}を購入！`);
            }
        } else {
            audioService.playSound('wrong');
        }
    };

    // --- UPGRADE SYSTEM LOGIC ---
    
    // Reroll the current offer
    const handleRerollUpgrade = () => {
        if (gameState.money < 10) { 
            audioService.playSound('wrong'); 
            return; 
        }
        
        const newOffer = getRandomOffer();
        setGameState(prev => ({ 
            ...prev, 
            money: prev.money - 10,
            currentUpgradeOffer: newOffer
        }));
        audioService.playSound('select');
    };

    // Apply the active upgrade to a selected card
    const handleApplyUpgrade = (cardIndex: number) => {
        const offer = gameState.currentUpgradeOffer;
        if (gameState.shopUpgradeUsed) {
            addLog("強化は1回までです。");
            audioService.playSound('wrong');
            return;
        }
        
        if (!offer) return;

        let newHand = [...gameState.hand];
        const card = { ...newHand[cardIndex] };
        
        const isSlotUpgrade = offer.type.startsWith('SLOT');
        const isSpecial = ['SACRIFICE', 'GAMBLE'].includes(offer.type);

        // Check slots limit
        if (!isSlotUpgrade && !isSpecial && card.usedSlots >= card.maxSlots) {
            audioService.playSound('wrong');
            addLog("スロットが一杯です！");
            return;
        }

        let msg = "強化完了！";

        switch (offer.type) {
            case 'DMG_1': card.damage += 1; break;
            case 'DMG_1_CD_1': card.damage += 1; card.cooldown += 1; break;
            case 'DMG_2_CD_3': card.damage += 2; card.cooldown += 3; break;
            case 'CD_MINUS_1': card.cooldown = Math.max(0, card.cooldown - 1); break;
            case 'CD_MINUS_2': card.cooldown = Math.max(0, card.cooldown - 2); break;
            case 'CD_MINUS_4_DMG_MINUS_1': card.cooldown = Math.max(0, card.cooldown - 4); card.damage = Math.max(0, card.damage - 1); break;
            case 'SLOT_1': card.maxSlots += 1; msg = "スロット拡張！"; break;
            case 'SLOT_1_CD_MINUS_1': card.maxSlots += 1; card.cooldown = Math.max(0, card.cooldown - 1); msg = "スロット拡張＆CD短縮！"; break;
            case 'SACRIFICE': newHand.splice(cardIndex, 1); setGameState(prev => ({ ...prev, money: prev.money + 40 })); msg = "カードを犠牲にした..."; break;
            case 'GAMBLE':
                const pool = getUnlockedKochoCardTemplates().filter(c => c.name !== card.name);
                const randomCard = pool[Math.floor(Math.random() * pool.length)];
                // Reset slots for new card
                newHand[cardIndex] = { ...randomCard, id: card.id, currentCooldown: 0, usedSlots: 0 };
                msg = `カードが${randomCard.name}に変化した！`;
                break;
        }

        if (!isSpecial) {
             if (!isSlotUpgrade) {
                 card.usedSlots++;
             }
             newHand[cardIndex] = card;
        }

        setGameState(prev => ({ ...prev, hand: newHand, shopUpgradeUsed: true }));
        audioService.playSound('buff');
        addLog(msg);
    };

    const finishShopOrEvent = () => {
        handlePhaseComplete();
    };

    const getIntentTooltip = (enemy: KEntity): { title: string; detail: string } | null => {
        if (!enemy.intent) return null;

        if (enemy.intent.type === 'ATTACK') {
            const hitIn = Math.max(0, enemy.intent.timer - 1);
            return {
                title: '攻撃予告',
                detail: `あと${hitIn}ターンで攻撃`,
            };
        }
        if (enemy.intent.type === 'WAIT') {
            return {
                title: '待機',
                detail: `行動まで残り${enemy.intent.timer}ターン`,
            };
        }
        if (enemy.intent.type === 'SUMMON') {
            return {
                title: '召喚予告',
                detail: enemy.intent.summonTarget ? `${enemy.intent.summonTarget}を呼び出す` : '仲間を呼び出す',
            };
        }
        if (enemy.intent.type === 'SPECIAL') {
            return {
                title: '特殊行動予告',
                detail: enemy.intent.specialName ? enemy.intent.specialName : 'ボススキル',
            };
        }
        return null;
    };

    // --- RENDER HELPERS ---
    const getKochoPlayerAsset = () => {
        if (activeActionCardName) return getKochoHeroActionAsset(activeActionCardName);
        const playerVfx = vfxList.find(v => v.pos === gameState.player.pos);
        if (!playerVfx) return getKochoHeroActionAsset(null);
        if (playerVfx.type === 'STUN') return getKochoHeroDamageAsset('stun');
        if (playerVfx.type === 'BLOCK' || playerVfx.type === 'BARRIER') return getKochoHeroDamageAsset('break');
        if (playerVfx.type === 'TEXT' && playerVfx.color?.includes('red')) return getKochoHeroDamageAsset('heavy');
        if (playerVfx.type === 'BLAST' || playerVfx.type === 'IMPACT' || playerVfx.type === 'SLASH') return getKochoHeroDamageAsset('light');
        if (gameState.player.hp <= Math.max(2, Math.floor(gameState.player.maxHp * 0.25))) return getKochoHeroDamageAsset('low');
        return getKochoHeroActionAsset(null);
    };

    const getKochoEnemyAsset = (enemy: KEntity) => {
        const endlessNameCells: Array<[string, number, number]> = [
            ['放課後の見回り', 1, 0],
            ['答案の亡霊', 2, 4],
            ['購買部の圧', 3, 8],
            ['補習監督', 4, 12],
            ['風紀委員長', 5, 1],
            ['図書室監査員', 6, 5],
            ['放送委員の刺客', 7, 9],
            ['生徒会監査', 8, 13],
            ['校則執行官', 9, 17],
            ['深夜校長', 10, 0],
        ];
        const endlessMatch = endlessNameCells.find(([name]) => enemy.name.includes(name));
        if (endlessMatch) {
            const isPrincipalSheet = endlessMatch[1] === 10;
            return { src: KOCHO_ENEMY_SHEETS[endlessMatch[1]], cell: endlessMatch[2], columns: isPrincipalSheet ? 3 : 5, rows: isPrincipalSheet ? 2 : 5 };
        }
        const nameCells: Array<[string, number]> = [
            ['不良生徒', 0], ['熱血教師', 1], ['用務員', 2], ['ガリ勉', 3], ['教頭', 4],
            ['理科の先生', 5], ['体育の先生', 6], ['音楽の先生', 7], ['生活指導', 8],
            ['真・校長', 11], ['激怒校長', 10], ['校長', 9],
            ['図書委員長', 12], ['保健室の先生', 13], ['放送部の怪人', 14], ['美術教師', 15],
            ['給食番長', 16], ['校庭ランナー', 17], ['守衛ロボ', 18], ['旧校舎の影', 19],
            ['テストの化身', 20], ['PTAの圧', 21], ['飼育小屋番', 22], ['文化祭実行委員', 23],
            ['卒業式の亡霊', 24],
        ];
        const match = nameCells.find(([name]) => enemy.name.includes(name));
        return { src: KOCHO_ENEMY_SHEETS[0], cell: match ? match[1] : 0, columns: 5, rows: 5 };
    };

    const getKochoEffectAsset = (vfx: KochoVFX) => {
        if (vfx.sourceCardName) return getKochoEffectAssetForCard(vfx.sourceCardName);
        const cells: Record<KochoVFX['type'], number> = {
            SLASH: 0,
            BLAST: 1,
            TEXT: 1,
            BLOCK: 7,
            HEAL: 8,
            BUFF: 9,
            COUNTER: 6,
            IMPACT: 1,
            WARP: 13,
            EVOLVE: 14,
            SUMMON: 15,
            BARRIER: 16,
            STUN: 10,
            PUSH: 11,
            PULL: 12,
            AFTERIMAGE: 5,
        };
        return { src: KOCHO_EFFECT_SHEETS[0], cell: cells[vfx.type] ?? 1 };
    };

    const getKochoBackgroundCell = () => {
        if (gameState.phase === 'REWARD') return 22;
        if (gameState.phase === 'SHOP') return 23;
        if (gameState.phase === 'UPGRADE_EVENT' || gameState.phase === 'MATH') return 24;
        if (gameState.isEndless) {
            const endlessCells = [9, 12, 16, 18, 21, 2];
            return endlessCells[Math.max(0, gameState.endlessFloor - 1) % endlessCells.length];
        }
        if (gameState.status === 'VICTORY' || gameState.battleStage === FINAL_STAGE) return 2;
        const stageCells = [0, 1, 4, 5, 6, 7, 9];
        return stageCells[Math.max(0, Math.min(stageCells.length - 1, gameState.battleStage - 1))];
    };

    const getGridContent = (idx: number) => {
        const p = gameState.player;
        const e = gameState.enemies.find(en => en.pos === idx && en.hp > 0);
        const cellVfx = vfxList.filter(v => v.pos === idx);
        const groundItem = gameState.fieldItems.find(i => i.pos === idx);
        
        return (
            <div className="relative w-full h-full flex items-end justify-center transition-colors duration-200">
                {/* VFX */}
                {cellVfx.map(v => (
                    <div key={v.id} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        {(() => {
                            const effectAsset = getKochoEffectAsset(v);
                            return v.type !== 'TEXT' && v.type !== 'AFTERIMAGE' ? (
                                <KochoSheetSprite
                                    sheet="effects"
                                    src={effectAsset.src}
                                    cell={effectAsset.cell}
                                    flipX={v.direction === -1}
                                    className="absolute inset-1 opacity-90 animate-pulse"
                                />
                            ) : null;
                        })()}
                        {v.type === 'TEXT' && <div className={`text-xl font-bold animate-bounce ${v.color || 'text-white'} drop-shadow-md`}>{v.text}</div>}
                        {v.type === 'AFTERIMAGE' && (
                            <div className={`opacity-25 blur-[1px] ${v.direction === -1 ? 'scale-x-[-1]' : ''}`}>
                                <KochoSheetSprite
                                    sheet="characters"
                                    src={getKochoHeroActionAsset(activeActionCardNameRef.current).src}
                                    cell={getKochoHeroActionAsset(activeActionCardNameRef.current).cell}
                                    flipX={shouldFlipKochoHeroAction(activeActionCardNameRef.current)}
                                    className={`h-16 w-16 md:h-32 md:w-32 ${v.color || 'text-white'}`}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {/* Field Item */}
                {groundItem && (
                    <div className="absolute bottom-1 z-10 animate-bounce">
                        <div className={`h-9 w-9 bg-black/60 rounded-full border ${groundItem.data.color}`}>
                            <KochoItemImage item={groundItem.data} className="h-full w-full rounded-full" />
                        </div>
                    </div>
                )}
                
                {p.pos === idx && (
                    <div className="relative w-full h-full flex items-end justify-center z-20">
                        <div className={`transition-transform duration-200 ${p.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                            {(() => {
                                const asset = getKochoPlayerAsset();
                                return (
                                    <KochoSheetSprite
                                        sheet="characters"
                                        src={asset.src}
                                        cell={asset.cell}
                                        flipX={shouldFlipKochoHeroAction(activeActionCardName)}
                                        className="h-20 w-20 md:h-36 md:w-36"
                                    />
                                );
                            })()}
                        </div>
                        {p.barrier > 0 && <div className="absolute inset-0 border-2 border-yellow-400 rounded-full animate-pulse opacity-50"></div>}
                        {p.shield > 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded border border-white">{p.shield}</div>}
                        <div className="absolute -bottom-6 w-20 text-center bg-black/50 text-white text-xs rounded border border-green-500">HP {p.hp}/{p.maxHp}</div>
                    </div>
                )}
                {e && (
                    <div className="relative w-full h-full flex items-end justify-center z-20">
                        <div className="relative flex items-end justify-center">
                            <div className={`transition-transform duration-200 ${e.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                                {(() => {
                                    const asset = getKochoEnemyAsset(e);
                                    return <KochoSheetSprite sheet="characters" src={asset.src} cell={asset.cell} columns={asset.columns} rows={asset.rows} className="h-20 w-20 md:h-36 md:w-36" />;
                                })()}
                            </div>
                            {e.intent && (
                                <div
                                    className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 group"
                                    onMouseEnter={() => setActiveIntentTooltipEnemyId(e.id)}
                                    onMouseLeave={() => setActiveIntentTooltipEnemyId(prev => (prev === e.id ? null : prev))}
                                    onTouchStart={(event) => {
                                        event.preventDefault();
                                        setActiveIntentTooltipEnemyId(prev => (prev === e.id ? null : e.id));
                                    }}
                                >
                                    {e.intent.type === 'ATTACK' && e.intent.timer === 1 && (
                                        <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center animate-bounce">
                                            <Swords size={12} className="mr-1"/> !
                                        </div>
                                    )}
                                    {e.intent.type === 'WAIT' && (
                                        <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                            <Hourglass size={12} className="mr-1"/> {e.intent.timer}
                                        </div>
                                    )}
                                    {e.intent.type === 'SUMMON' && (
                                        <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                            <Ghost size={12} className="mr-1"/> !
                                        </div>
                                    )}
                                    {e.intent.type === 'SPECIAL' && (
                                        <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center animate-pulse">
                                            <AlertTriangle size={12} className="mr-1"/> SP!
                                        </div>
                                    )}
                                    {getIntentTooltip(e) && (
                                        <div
                                            className={`pointer-events-none absolute left-1/2 top-[-56px] w-max -translate-x-1/2 rounded border border-cyan-300/60 bg-slate-900/95 px-2 py-1 text-[10px] text-cyan-100 shadow-lg transition-opacity duration-150 ${activeIntentTooltipEnemyId === e.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <div className="font-bold leading-tight">{getIntentTooltip(e)?.title}</div>
                                            <div className="leading-tight text-cyan-200/90">{getIntentTooltip(e)?.detail}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-6 w-16 text-center bg-black/50 text-white text-xs rounded border border-red-500">{e.hp}/{e.maxHp}</div>
                        {e.bossPhase && <div className="absolute top-0 left-0 bg-yellow-600 text-black text-[10px] px-1 rounded font-bold">P{e.bossPhase}</div>}
                    </div>
                )}
            </div>
        );
    };

    const isDangerZone = (idx: number) => {
        return gameState.enemies.some(e => {
            if (e.hp > 0 && e.intent?.type === 'ATTACK' && e.intent.timer === 1) {
                const range = e.intent.range || [];
                const targets = range.map(r => e.pos + (r * e.facing));
                return targets.includes(idx);
            }
            return false;
        });
    };

    // Component for rendering the active upgrade offer
    const UpgradeOfferDisplay = () => {
        const offer = gameState.currentUpgradeOffer;
        if (!offer) return null;
        return (
            <div className="bg-slate-800 border-2 border-indigo-500 p-4 rounded-xl text-center mb-6 w-full max-w-sm mx-auto shadow-lg relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow">{tr('Active Technique')}</div>
                <div className={`text-5xl mb-2 flex justify-center ${offer.color} mt-2`}>
                    {offer.icon}
                </div>
                <div className="text-lg font-bold mb-1">{tr(offer.description)}</div>
                <div className="text-gray-400 text-xs mb-4">{tr('Click a card below to apply')}</div>
                
                <button 
                    onClick={handleRerollUpgrade} 
                    disabled={gameState.money < 10} 
                    className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg flex items-center justify-center shadow transition-colors text-sm ${gameState.money < 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <RefreshCw className="mr-2" size={14}/> Reroll (10G)
                </button>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div data-gamepad-navigation-root data-gamepad-initial-scope={`kocho-${gameState.phase}-${gameState.status}`} className="ios-edge-to-edge kocho-showdown-root flex flex-col h-full w-full bg-[#1a1a2e] text-white font-mono relative overflow-hidden">
            {/* Math Challenge Overlay */}
            {gameState.phase === 'MATH' && (
                 <div className="absolute inset-0 z-[100] w-full h-full pointer-events-auto">
                     <MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode} assignment={assignment} onAnswerResult={onAnswerResult} onComplete={handleMathComplete} rewardHint={languageMode === 'ENGLISH' ? 'Perfect score: HP +1' : '全問正解でHP+1'} languageMode={languageMode} />
                 </div>
            )}

            {/* Header */}
            <div className="ios-safe-ui-x ios-safe-ui-header kocho-header flex justify-between items-center p-2 md:p-4 bg-black/40 border-b border-indigo-500/30 shrink-0">
                <button onClick={handleQuit} className="kocho-header-quit flex items-center text-gray-400 hover:text-white"><ArrowLeft className="kocho-header-quit-icon mr-2"/> <span className="kocho-header-label hidden md:inline">Quit</span></button>
                <div className="kocho-header-status hidden md:flex items-center min-w-0">
                    <h2 className="kocho-header-title text-sm md:text-xl font-bold text-indigo-100 tracking-widest">
                        <span>{tr('校長対決')}</span>
                        <span className="kocho-header-stage text-xs text-pink-400">{gameState.phase === 'SETUP' ? tr('難易度選択') : gameState.isEndless ? `${tr('補習')} ${gameState.endlessFloor}${tr('限目')}` : `${tr('ステージ')} ${gameState.battleStage}`}</span>
                    </h2>
                    {gameState.phase !== 'SETUP' && (
                        <div className="kocho-header-difficulty text-xs md:text-sm font-bold text-indigo-200 items-center gap-1 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/40">
                            <span>Lv.{gameState.difficultyLevel}</span>
                            <span>{tr(getKochoDifficulty(gameState.difficultyLevel).name)}</span>
                        </div>
                    )}
                </div>
                <div className="kocho-header-actions flex items-center gap-2 md:gap-4">
                    {gameState.isEndless && (
                        <div className="kocho-header-endless text-xs md:text-sm font-bold text-pink-200 flex items-center gap-2 bg-pink-950/50 px-2 py-1 rounded border border-pink-500/50">
                            <Skull size={14}/> {tr('撃破')} {gameState.endlessKills} / {gameState.endlessScore}{tr('点')}
                        </div>
                    )}
                    <button onClick={() => setShowHelpModal(true)} className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors text-xs md:text-sm font-bold border border-indigo-500/30 px-2 py-1 rounded bg-black/20">
                        <HelpCircle size={14}/> <span className="kocho-header-label hidden md:inline">Help</span>
                    </button>
                    <button onClick={() => setShowRelicModal(true)} className="flex items-center gap-2 text-yellow-200 hover:text-white transition-colors text-xs md:text-sm font-bold border border-yellow-500/30 px-2 py-1 rounded bg-black/20">
                        <Gift size={14}/> <span className="kocho-header-label hidden md:inline">Relics</span> ({gameState.relics.length})
                    </button>
                    <button onClick={() => setShowItemModal(true)} className="flex items-center gap-2 text-green-200 hover:text-white transition-colors text-xs md:text-sm font-bold border border-green-500/30 px-2 py-1 rounded bg-black/20">
                        <Package size={14}/> <span className="kocho-header-label hidden md:inline">Items</span> ({gameState.consumables.length})
                    </button>
                    <div className="kocho-header-money text-xs md:text-sm font-bold text-yellow-400 flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-yellow-500/50">
                        <Coins size={14}/> {gameState.money} G
                    </div>
                </div>
            </div>

            {gameState.phase === 'SETUP' && (
                <div data-gamepad-modal data-gamepad-initial-scope="kocho-difficulty" className="kocho-difficulty-overlay absolute inset-0 z-40 flex items-center justify-center bg-[#111827]/95 p-4">
                    <div className="kocho-difficulty-panel w-full max-w-5xl rounded-xl border-2 border-indigo-500/60 bg-slate-950 p-5 shadow-2xl">
                        <div className="kocho-difficulty-header mb-5 text-center">
                            <div className="kocho-difficulty-eyebrow text-[11px] font-black uppercase tracking-[0.35em] text-pink-300">Kocho Showdown</div>
                            <h2 className="kocho-difficulty-heading mt-2 text-3xl font-black text-white">{tr('難易度選択')}</h2>
                            <p className="kocho-difficulty-description mt-2 text-sm text-slate-400">{tr('Lv.1から開始し、クリアするたびに次のレベルが1つ解禁されます。上げるほど敵HP・攻撃力が増え、アイテムドロップが減ります。')}</p>
                        </div>
                        <div className="kocho-difficulty-grid grid grid-cols-1 gap-2 md:grid-cols-2">
                            {KOCHO_DIFFICULTIES.map(difficulty => {
                                const locked = difficulty.level > maxUnlockedDifficulty;
                                return (
                                    <button
                                        key={difficulty.level}
                                        data-gamepad-initial-choice={!locked ? true : undefined}
                                        onClick={() => startKochoRun(difficulty.level)}
                                        disabled={locked}
                                        className={`kocho-difficulty-button flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                                            locked
                                                ? 'cursor-not-allowed border-slate-800 bg-slate-900/55 opacity-55'
                                                : 'border-slate-700 bg-slate-900 hover:border-pink-400 hover:bg-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className={`kocho-difficulty-title text-base font-black ${locked ? 'text-slate-500' : 'text-white'}`}>Lv.{difficulty.level} {tr(difficulty.name)}</div>
                                            <div className="kocho-difficulty-meta mt-1 text-xs text-slate-400">HP x{difficulty.hpMultiplier.toFixed(2)} / {tr('攻撃')} +{difficulty.damageBonus} / SCORE x{difficulty.scoreMultiplier.toFixed(1)}</div>
                                            {locked && <div className="kocho-difficulty-lock mt-1 text-[11px] font-bold text-pink-300">{tr('前のレベルをクリアすると解禁')}</div>}
                                        </div>
                                        {locked ? <ShieldCheck size={18} className="text-slate-500" /> : <Play size={18} className="text-pink-300" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowHelpModal(false)}>
                    <div className="bg-slate-800 border-4 border-indigo-500 rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center"><Book className="mr-2"/> {tr('校長対決の遊び方')}</h2>
                        
                        <div className="space-y-6 text-sm text-gray-300">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Flag className="mr-2 text-yellow-400"/> {tr('基本ルール')}</h3>
                                <p>{tr('7つのステージを攻略し、最深部の校長先生を倒すことが目的です。')}<br/>{tr('HPが0になるとゲームオーバーです。')}</p>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Swords className="mr-2 text-red-400"/> {tr('バトルシステム')}</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>{tr('移動・待機・向き変更')}:</strong> {tr('ボタンを押すと即座に実行され、ターンが経過します。')}</li>
                                    <li><strong>{tr('カード攻撃')}:</strong> {tr('手札のカードを選んで予約します（最大3枚）。')}<br/>{tr('「EXEC」ボタンで予約したカードを連続発動します。')}</li>
                                    <li><strong>{tr('クールダウン(CD)')}:</strong> {tr('使用したカードはCDが発生し、一時的に使えなくなります。')}<br/>{tr('移動やアクションを行うとCDが減少します。')}</li>
                                    <li><strong>{tr('消耗品')}:</strong> {tr('敵が落とすアイテムを拾って使用できます（最大3つ）。')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><AlertCircle className="mr-2 text-red-500"/> {tr('敵の行動予測')}</h3>
                                <p className="mb-2">{tr('敵の頭上のアイコンで次の行動がわかります。')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 bg-black/30 p-2 rounded"><Swords className="text-red-500" size={16}/> <span className="text-red-400">{tr('攻撃')}</span> ({tr('カウント0で発動')})</div>
                                    <div className="flex items-center gap-2 bg-black/30 p-2 rounded"><Hourglass className="text-gray-400" size={16}/> <span className="text-gray-300">{tr('待機')}</span> ({tr('数字は残りターン')})</div>
                                    <div className="flex items-center gap-2 bg-black/30 p-2 rounded"><Ghost className="text-purple-400" size={16}/> <span className="text-purple-300">{tr('召喚')}</span></div>
                                    <div className="flex items-center gap-2 bg-black/30 p-2 rounded"><AlertTriangle className="text-orange-500" size={16}/> <span className="text-orange-400">{tr('特殊行動')}</span> ({tr('ボススキル')})</div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Hammer className="mr-2 text-emerald-400"/> {tr('強化 (Upgrade)')}</h3>
                                <p>{tr('ステージクリア後やショップでカードを強化できます。')}<br/>{tr('スロット拡張、威力アップ、CD短縮などを組み合わせて最強のデッキを作りましょう。')}</p>
                            </section>
                        </div>
                        
                        <button onClick={() => setShowHelpModal(false)} className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors border border-indigo-400">{tr('閉じる')}</button>
                    </div>
                </div>
            )}
            
            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowItemModal(false)}>
                    <div className="bg-slate-800 border-4 border-green-500 rounded-lg p-6 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowItemModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center"><Package className="mr-2"/> {tr('アイテム一覧')} ({gameState.consumables.length}/{MAX_CONSUMABLES})</h2>
                        
                        {gameState.consumables.length === 0 ? (
                            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">{tr('アイテムを持っていません')}</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {gameState.consumables.map((item, i) => (
                                    <div key={i} className="bg-slate-900 border border-slate-600 p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center ${item.color}`}>
                                                <KochoItemImage item={item} className="h-full w-full rounded-full" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-lg">{tr(item.name)}</div>
                                                <div className="text-sm text-gray-400">{tr(item.desc)}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { useConsumable(i); setShowItemModal(false); }}
                                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors shadow-lg"
                                        >
                                            {tr('使う')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button onClick={() => setShowItemModal(false)} className="mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors border border-slate-500">{tr('閉じる')}</button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="kocho-showdown-main flex-grow flex flex-col md:flex-row overflow-hidden relative">

                {/* Game Field */}
                <div className="kocho-battle-field flex-1 relative bg-[#1a1a2e] flex flex-col items-center justify-center p-4 overflow-hidden">
                    <KochoSheetSprite
                        sheet="backgrounds"
                        cell={getKochoBackgroundCell()}
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-45 blur-[0.2px]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-[#111827]/35 to-black/70" />
                    {/* Status Overlay */}
                    {(gameState.status === 'VICTORY' || gameState.status === 'GAME_OVER' || gameState.phase === 'REWARD' || gameState.phase === 'SHOP' || gameState.phase === 'UPGRADE_EVENT') && (
                        <div data-gamepad-modal data-gamepad-initial-scope={`kocho-result-${gameState.phase}-${gameState.status}`} className="absolute inset-0 bg-black/75 z-40 flex flex-col items-center justify-center p-4 backdrop-blur-[1px]">
                            
                            {/* REWARD UI */}
                            {gameState.phase === 'REWARD' && (
                                <div className="text-center w-full">
                                    <h2 className="text-3xl font-bold text-yellow-400 mb-8 flex items-center justify-center"><Gift className="mr-2"/> {tr('Card Reward')}</h2>
                                    <div className="flex gap-4 md:gap-8 justify-center flex-wrap">
                                        {rewardCards.map((card, i) => (
                                            <div key={i} data-gamepad-initial-choice={i === 0 ? true : undefined} role="button" tabIndex={0} className="w-32 md:w-40 bg-slate-800 border-4 border-yellow-500 rounded-xl p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => selectReward(card)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectReward(card); } }}>
                                                <KochoCardActionArt card={card} className="mb-2 h-16 w-16 rounded-lg border border-indigo-400/40 bg-black/40" />
                                                <div className="font-bold text-white mb-1 text-center text-sm md:text-base leading-tight">{tr(card.name)}</div>
                                                
                                                {/* ADDED STATS DISPLAY */}
                                                <div className="flex gap-1 text-[10px] my-1 justify-center w-full">
                                                    {card.damage > 0 && <span className="text-red-300 bg-red-900/50 px-1.5 py-0.5 rounded font-bold border border-red-500/50">ATK {card.damage}</span>}
                                                    <span className="text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded font-bold border border-blue-500/50">CD {card.cooldown}</span>
                                                </div>

                                                <div className="text-[10px] text-gray-400 text-center leading-tight h-8 overflow-hidden flex items-center justify-center">{tr(card.description)}</div>
                                                
                                                <div className="flex gap-0.5 justify-center mt-2">
                                                    {[...Array(card.maxSlots)].map((_, idx) => (
                                                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-gray-600 border border-gray-400" />
                                                    ))}
                                                </div>
                                                <button className="mt-4 bg-yellow-600 text-black font-bold px-4 py-1 rounded-full text-xs hover:bg-yellow-500">{tr('Select')}</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* UPGRADE EVENT UI */}
                            {gameState.phase === 'UPGRADE_EVENT' && (
                                <div className="kocho-upgrade-event-panel w-full h-full flex flex-col items-center justify-center p-4 relative">

                                    <div className="kocho-upgrade-event-summary flex flex-col items-center">
                                        <h2 className="text-3xl font-bold text-emerald-400 mb-4 flex items-center animate-pulse"><Hammer className="mr-2"/> Maintenance</h2>

                                        <UpgradeOfferDisplay />
                                    </div>

                                    <div className="kocho-upgrade-card-list bg-slate-900 border border-slate-600 rounded-lg p-4 w-full max-w-2xl overflow-y-auto custom-scrollbar mb-8">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {gameState.hand.map((card, i) => (
                                                <div key={i} className={`kocho-upgrade-target-card bg-slate-800 p-3 rounded border relative transition-all ${gameState.shopUpgradeUsed ? 'opacity-50 cursor-not-allowed border-slate-600' : 'hover:border-yellow-400 cursor-pointer border-slate-600'}`} onClick={() => handleApplyUpgrade(i)}>
                                                    <KochoCardActionArt card={card} className="mb-2 h-10 w-10 rounded border border-slate-600 bg-black/40" />
                                                    <div className="font-bold text-sm text-white mb-1">{tr(card.name)}</div>
                                                    <div className="text-xs text-gray-400 mb-2">{tr(card.description)}</div>
                                                    <div className="flex gap-2 text-[10px] mb-1">
                                                        {card.damage > 0 && <span className="text-red-400 bg-red-900/30 px-1 rounded">ATK:{card.damage}</span>}
                                                        <span className="text-blue-400 bg-blue-900/30 px-1 rounded">CD:{card.cooldown}</span>
                                                    </div>
                                                    {/* Slots Visual */}
                                                    <div className="flex gap-1">
                                                        {[...Array(card.maxSlots)].map((_, idx) => (
                                                            <div key={idx} className={`w-2 h-2 rounded-full border border-gray-500 ${idx < card.usedSlots ? 'bg-yellow-400' : 'bg-black/50'}`} />
                                                        ))}
                                                    </div>
                                                    {!gameState.shopUpgradeUsed && <div className="absolute top-2 right-2 text-yellow-500"><Plus size={16}/></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={finishShopOrEvent} className="kocho-upgrade-next-button bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center border-2 border-red-400">{tr('次へ進む')} <ArrowUp className="ml-2"/></button>
                                </div>
                            )}

                            {/* SHOP UI */}
                            {gameState.phase === 'SHOP' && (
                                <div className="kocho-shop-panel w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto relative">
                                    <h2 className="text-3xl font-bold text-indigo-400 mb-6 flex items-center shrink-0"><ShoppingBag className="mr-2"/> {tr('Shop')}</h2>
                                    <div className="kocho-shop-columns flex flex-col md:flex-row gap-8 flex-grow">
                                        <div className="kocho-shop-upgrade-column flex-1 bg-slate-900 border border-slate-600 rounded-lg p-4 overflow-y-auto custom-scrollbar flex flex-col">
                                            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between"><span className="flex items-center"><Hammer className="mr-2 text-red-400"/> {tr('Deck Upgrade')}</span><span className={`text-xs ${gameState.shopUpgradeUsed ? 'text-red-500' : 'text-green-400'}`}>{gameState.shopUpgradeUsed ? tr('(済)') : tr('(1回のみ)')}</span></h3>
                                            
                                            <UpgradeOfferDisplay />

                                            <div className="kocho-shop-upgrade-card-grid grid grid-cols-2 gap-4">
                                                {gameState.hand.map((card, i) => (
                                                    <div key={i} className={`kocho-upgrade-target-card bg-slate-800 p-3 rounded border relative transition-all ${gameState.shopUpgradeUsed ? 'opacity-50 cursor-not-allowed border-slate-600' : 'hover:border-yellow-400 cursor-pointer border-slate-600'}`} onClick={() => handleApplyUpgrade(i)}>
                                                        <KochoCardActionArt card={card} className="mb-2 h-10 w-10 rounded border border-slate-600 bg-black/40" />
                                                        <div className="font-bold text-sm text-white mb-1">{tr(card.name)}</div>
                                                        <div className="text-xs text-gray-400 mb-2">{tr(card.description)}</div>
                                                        <div className="flex gap-2 text-[10px] mb-1">{card.damage > 0 && <span className="text-red-400 bg-red-900/30 px-1 rounded">ATK:{card.damage}</span>}<span className="text-blue-400 bg-blue-900/30 px-1 rounded">CD:{card.cooldown}</span></div>
                                                        {/* Slots Visual */}
                                                        <div className="flex gap-1">
                                                            {[...Array(card.maxSlots)].map((_, idx) => (
                                                                <div key={idx} className={`w-2 h-2 rounded-full border border-gray-500 ${idx < card.usedSlots ? 'bg-yellow-400' : 'bg-black/50'}`} />
                                                            ))}
                                                        </div>
                                                        {!gameState.shopUpgradeUsed && <div className="absolute top-2 right-2 text-yellow-500"><Plus size={16}/></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="kocho-shop-relic-column w-full md:w-96 bg-slate-900 border border-slate-600 rounded-lg p-4 shrink-0">
                                            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Gift className="mr-2 text-yellow-400"/> {tr('Relics (2 Random)')}</h3>
                                            <div className="kocho-shop-relic-list space-y-4">
                                                {gameState.shopInventory.map(item => {
                                                    const owned = gameState.relics.some(r => r.id === item.id) && item.id !== 'R_POTION';
                                                    const finalPrice = getShopPrice(item.price);
                                                    return (
                                                        <div key={item.id} className={`bg-slate-800 p-3 rounded border flex items-center gap-3 ${owned ? 'opacity-50 border-gray-700' : 'border-slate-500'}`}>
                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                <div className="h-12 w-12 shrink-0 rounded-md border border-yellow-500/30 bg-black/40 p-0.5">
                                                                    <KochoRelicImage relic={item} className="h-full w-full rounded-sm" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-bold text-sm text-yellow-200 leading-tight">{tr(item.name)}</div>
                                                                    <div className="text-xs text-gray-400 leading-tight break-words">{tr(item.desc)}</div>
                                                                </div>
                                                            </div>
                                                            <button disabled={owned} onClick={() => buyShopItem(item)} className={`shrink-0 px-3 py-1 rounded text-sm font-bold ${owned ? 'bg-gray-600 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}>{owned ? tr('Sold') : `${finalPrice}G`}</button>
                                                        </div>
                                                    );
                                                })}
                                                {gameState.shopInventory.length === 0 && <div className="text-gray-500 text-center py-4">{tr('売り切れ')}</div>}
                                            </div>
                                            <button onClick={finishShopOrEvent} className="kocho-shop-next-button mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg text-xl flex items-center justify-center animate-pulse border-2 border-red-400">{tr('次へ進む')} <ArrowUp className="ml-2"/></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VICTORY UI */}
                            {gameState.status === 'VICTORY' && (
                                <div className="kocho-victory-panel text-center animate-in zoom-in">
                                    <div className="kocho-victory-unlock-area">
                                        {newlyUnlockedCard ? (
                                        <div className="kocho-victory-card mx-auto mb-8 w-64 rounded-2xl border-4 border-yellow-500 bg-slate-900 p-5 shadow-xl">
                                            <div className="mb-2 text-xs font-black tracking-[0.2em] text-yellow-300">{tr('新カード解禁')}</div>
                                            <KochoCardActionArt card={newlyUnlockedCard} className="mx-auto mb-3 h-16 w-16 rounded-full border border-yellow-400/50 bg-black/40" />
                                            <div className="text-lg font-bold text-white">{tr(newlyUnlockedCard.name)}</div>
                                            <div className="mt-2 flex justify-center gap-2 text-[11px]">
                                                {newlyUnlockedCard.damage > 0 && <span className="rounded bg-red-900/40 px-2 py-1 font-bold text-red-300">{tr('攻撃')} {newlyUnlockedCard.damage}</span>}
                                                <span className="rounded bg-blue-900/40 px-2 py-1 font-bold text-blue-300">{tr('待機')} {newlyUnlockedCard.cooldown}</span>
                                            </div>
                                            <div className="mt-3 text-xs leading-relaxed text-gray-300">{tr(newlyUnlockedCard.description)}</div>
                                            <div className="mt-4 text-[11px] font-bold text-emerald-300">{tr('以降の校長対決の報酬に登場します')}</div>
                                        </div>
                                        ) : (
                                        <div className="kocho-victory-card mb-8 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-5 py-4 text-sm font-bold text-emerald-200">
                                            {tr('追加カードはすべて解放済みです')}
                                        </div>
                                        )}
                                    </div>
                                    <div className="kocho-victory-text-area flex flex-col items-center justify-center">
                                        <h2 className="text-4xl font-bold text-white mb-4">{tr('校長説得完了！')}</h2>
                                        <p className="text-gray-300 mb-8">{tr('校長先生との最終対決に勝利しました。')}</p>
                                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-950/40 px-4 py-2 text-sm font-bold text-yellow-200">
                                            <Gift size={16}/>
                                            {tr('追加カード解放')} {kochoUnlockedCount}/{KOCHO_UNLOCKABLE_CARD_TOTAL}
                                        </div>
                                        <div className="flex flex-col gap-3 md:flex-row">
                                            <button onClick={startEndlessRun} className="bg-pink-600 px-8 py-3 rounded text-xl font-bold hover:bg-pink-500 border border-pink-300">{tr('放課後エンドレスへ')}</button>
                                            <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded text-xl font-bold hover:bg-indigo-500">{tr('職員室に戻る')}</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GAME OVER UI */}
                            {gameState.status === 'GAME_OVER' && (
                                <div className="text-center animate-in zoom-in">
                                    <Skull size={64} className="text-red-500 mb-4 mx-auto"/>
                                    <h2 className="text-4xl font-bold text-red-500 mb-4">{tr('校長室送り')}</h2>
                                    <p className="text-gray-400 mb-2">{gameState.isEndless ? `補習 ${gameState.endlessFloor}限目 / ${gameState.endlessScore}点` : `ステージ ${gameState.battleStage}`}</p>
                                    {gameState.isEndless && <p className="text-sm text-pink-300 mb-4">{tr('撃破数')} {gameState.endlessKills}</p>}
                                    <button onClick={() => initGame()} className="bg-white text-black px-8 py-3 rounded text-xl font-bold hover:bg-gray-200">{tr('再挑戦')}</button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* RELIC MODAL (FULL SCREEN) */}
                    {showRelicModal && (
                        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowRelicModal(false)}>
                            <div className="w-full h-full max-w-4xl flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-6 border-b border-indigo-500 pb-4">
                                    <h2 className="text-3xl font-bold text-yellow-400 flex items-center"><Gift className="mr-3" size={32}/> {tr('所持レリック一覧')}</h2>
                                    <button onClick={() => setShowRelicModal(false)} className="text-gray-400 hover:text-white p-2 border-2 border-transparent hover:border-white rounded-full transition-colors"><X size={32}/></button>
                                </div>
                                
                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                                    {gameState.relics.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                                            <Gift size={48} className="mb-4 opacity-50"/>
                                            <p className="text-xl">{tr('レリックを持っていません。')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {gameState.relics.map((relic, i) => (
                                                <div key={i} className="bg-slate-900 p-6 rounded-xl border-2 border-slate-600 flex items-start gap-4 shadow-lg hover:border-yellow-500 transition-colors">
                                                    <div className="w-16 h-16 bg-slate-800 rounded-lg border-4 border-yellow-600 flex items-center justify-center shrink-0 p-1 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                                        <KochoRelicImage relic={relic} className="h-full w-full rounded-sm" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-xl mb-2">{tr(relic.name)}</div>
                                                        <div className="text-sm text-gray-300 leading-relaxed">{tr(relic.desc)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <button onClick={() => setShowRelicModal(false)} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg text-xl transition-colors border-2 border-indigo-400 shadow-lg">{tr('閉じる')}</button>
                            </div>
                        </div>
                    )}

                    {/* Standard Gameplay View */}
                    {gameState.phase === 'BATTLE' && (
                        <>
                            {announcement && (
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                                    <div className={`min-w-[220px] rounded-2xl border px-5 py-3 text-center shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${
                                        announcement.tone === 'danger'
                                            ? 'border-red-400/80 bg-red-950/80'
                                            : announcement.tone === 'phase'
                                                ? 'border-yellow-400/80 bg-yellow-950/80'
                                                : announcement.tone === 'special'
                                                    ? 'border-purple-400/80 bg-purple-950/80'
                                                    : 'border-cyan-400/70 bg-slate-950/80'
                                    }`}>
                                        <div className="text-[10px] font-black tracking-[0.35em] uppercase text-slate-300">Kocho Showdown</div>
                                        <div className="mt-1 text-xl md:text-2xl font-black text-white">{announcement.title}</div>
                                        {announcement.subtitle && <div className="mt-1 text-xs md:text-sm font-bold text-slate-200">{announcement.subtitle}</div>}
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg text-center pointer-events-none z-10">
                                {gameState.logs.map((log, i) => (
                                    <div key={i} className={`text-sm ${i===0 ? 'text-white font-bold text-shadow-md' : 'text-gray-500'} transition-opacity duration-500`}>{log}</div>
                                ))}
                            </div>

                            <div className={`grid grid-cols-7 gap-1 md:gap-2 w-full max-w-full md:max-w-5xl px-2 mb-4 shrink-0 max-h-full aspect-[7/2] md:aspect-auto transition-transform duration-100 ${hitStopActive ? 'scale-[0.982]' : 'scale-100'}`}>
                                {[...Array(GRID_SIZE)].map((_, i) => (
                                    <div key={i} className={`aspect-[1/2] md:aspect-[3/4] border-2 ${isDangerZone(i) ? 'border-red-500 bg-red-900/20' : 'border-indigo-800 bg-black/30'} rounded-lg flex items-end justify-center relative`}>
                                        {getGridContent(i)}
                                        <div className="absolute bottom-1 right-1 text-[8px] md:text-[10px] text-gray-700">{i}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Controls (Sidebar) */}
                {gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY' && gameState.phase === 'BATTLE' && (
                    <div className="kocho-control-panel w-full md:w-80 bg-[#0f0f1b] border-t md:border-t-0 md:border-l border-indigo-900 p-2 md:p-4 shrink-0 flex flex-col gap-2 md:h-full md:overflow-y-auto custom-scrollbar">
                        
                        {/* Queue Display */}
                        <div className="kocho-queue-panel flex justify-between items-center gap-2 bg-black/30 p-2 rounded-lg border border-indigo-900/30 shrink-0">
                            <div className="flex gap-1 justify-center items-center flex-grow">
                                {[...Array(3)].map((_, i) => {
                                    const card = gameState.queue[i];
                                    return card ? (
                                        <div key={i} className="w-12 h-16 md:w-16 md:h-20 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-center relative group cursor-pointer hover:border-red-400 shrink-0" onClick={() => handleUnqueueCard(i)}>
                                            <div className={`w-full h-1 ${card.color} absolute top-0`}></div>
                                            <div className="text-[9px] md:text-xs text-center font-bold px-1 overflow-hidden whitespace-nowrap text-ellipsis w-full">{tr(card.name)}</div>
                                            <KochoCardActionArt card={card} className="kocho-queue-card-art h-7 w-7 rounded bg-black/40" />
                                            <X size={12} className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100"/>
                                        </div>
                                    ) : (
                                        <div key={`empty-${i}`} className="w-12 h-16 md:w-16 md:h-20 border border-dashed border-gray-700 rounded flex items-center justify-center text-gray-700 text-[9px] shrink-0">Empty</div>
                                    );
                                })}
                            </div>
                            <button data-gamepad-zone="kocho-queue" data-gamepad-order={3} data-gamepad-shortcut="Y" aria-keyshortcuts="Y" onClick={executeQueue} disabled={gameState.queue.length === 0 || animating} className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shadow-lg transition-all shrink-0 ${gameState.queue.length > 0 ? 'bg-indigo-600 border-indigo-400 text-white hover:scale-105 active:scale-95 cursor-pointer animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}`}>
                                <Play size={20} className="fill-current mb-1"/> EXEC
                            </button>
                        </div>

                        {/* Hand Cards */}
                        <div className="kocho-hand-card-strip flex gap-2 overflow-x-auto overflow-y-hidden pb-2 px-1 custom-scrollbar min-h-[9.5rem] md:min-h-[10.5rem] shrink-0 items-stretch snap-x snap-mandatory">
                            {gameState.hand.map((card, i) => (
                                <div
                                    key={card.id}
                                    data-gamepad-initial-choice
                                    data-gamepad-zone="kocho-hand"
                                    data-gamepad-order={i}
                                    role="button"
                                    tabIndex={0}
                                    className={`kocho-hand-card w-28 h-36 md:w-32 md:h-40 bg-slate-800 border-2 rounded-xl flex flex-col justify-between p-2 cursor-pointer transition-transform relative shadow-lg shrink-0 snap-start ${card.usedSlots > 0 ? 'border-yellow-400' : 'border-slate-600'} ${card.currentCooldown > 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-1'}`}
                                    onClick={() => handleQueueCard(card, i)}
                                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleQueueCard(card, i); } }}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${card.color} rounded-t-lg`}></div>
                                    
                                    {/* Icon Badge for Effect Type */}
                                    <div className="absolute top-1 right-1 text-[8px] bg-black/60 px-1 rounded text-white font-mono">
                                        {(card.effectType === 'PIERCE' || card.effectType === 'FURTHEST') ? '>>>' : (card.type === 'MOVE' ? 'MOVE' : (card.effectType === 'PIERCE_DASH' ? 'THRU' : '>|'))}
                                    </div>

                                    <div className="flex flex-col h-full w-full pt-2">
                                        <div className="text-[11px] md:text-xs font-bold text-center leading-tight truncate px-3">{tr(card.name)}</div>
                                        <KochoCardActionArt card={card} className="kocho-hand-card-art mx-auto my-1 h-12 w-12 md:h-14 md:w-14 rounded-lg bg-black/40 border border-slate-700" />
                                        <div className="text-[9px] md:text-[10px] text-gray-300 text-center leading-tight min-h-[2.4em] max-h-[2.4em] overflow-hidden">{tr(card.description)}</div>
                                        <div className="flex justify-center gap-1 mt-1">
                                            {[...Array(card.maxSlots)].map((_, idx) => (
                                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx < card.usedSlots ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] md:text-[10px] text-gray-500 mt-auto font-mono w-full">
                                            <span>CD:{card.cooldown}</span>
                                            {card.damage > 0 ? <span className="text-red-400 font-bold flex items-center"><Swords size={10} className="mr-0.5"/>{card.damage}</span> : <span className="opacity-70">{card.type}</span>}
                                        </div>
                                    </div>
                                    <div className="hidden">
                                        <KochoCardActionArt card={card} className="h-9 w-9 shrink-0 rounded bg-black/40" />
                                        <div className="flex-grow min-w-0">
                                            <div className="text-xs font-bold truncate">{tr(card.name)}</div>
                                            <div className="text-[10px] text-gray-400 truncate">{tr(card.description)}</div>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {[...Array(card.maxSlots)].map((_, idx) => (
                                                    <div key={idx} className={`w-1 h-1 rounded-full ${idx < card.usedSlots ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end text-[10px] font-mono shrink-0">
                                            <span className="text-gray-500">CD:{card.cooldown}</span>
                                            {card.damage > 0 && <span className="text-red-400 font-bold flex items-center"><Swords size={10} className="mr-0.5"/>{card.damage}</span>}
                                        </div>
                                    </div>
                                    {card.currentCooldown > 0 && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10"><Clock size={20} className="text-gray-400 mb-1"/><span className="text-xl font-bold text-white">{card.currentCooldown}</span></div>}
                                </div>
                            ))}
                        </div>

                        {/* Movement Controls */}
                        <div className="kocho-movement-controls flex justify-center items-center gap-4 py-2 border-t border-indigo-900/30 relative shrink-0">
                            <button onClick={() => handleMove(-1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-full border border-slate-500 active:bg-slate-800 transition-colors shadow-lg"><ChevronLeft size={24}/></button>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-1">
                                    <button onClick={handleTurn} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg border border-slate-500 text-sm font-bold flex items-center justify-center active:bg-slate-800 transition-colors w-16">TURN</button>
                                    <button onClick={handleSwapPosition} className={`px-2 py-2 rounded-lg border flex items-center justify-center transition-colors w-12 ${gameState.specialActionCooldown > 0 ? 'bg-gray-800 border-gray-600 text-gray-500' : 'bg-cyan-700 border-cyan-400 text-cyan-100 hover:bg-cyan-600 active:scale-95'}`} title={tr('位置交換 (CD: 3)')}>{gameState.specialActionCooldown > 0 ? <span className="text-xs font-bold">{gameState.specialActionCooldown}</span> : <RefreshCw size={16} />}</button>
                                </div>
                                <button onClick={handleWait} className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg border border-gray-600 text-xs flex items-center justify-center active:bg-gray-900 transition-colors w-28 text-gray-400"><Clock size={12} className="mr-1"/> WAIT</button>
                            </div>
                            <button onClick={() => handleMove(1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-full border border-slate-500 active:bg-slate-800 transition-colors shadow-lg"><ChevronRight size={24}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KochoShowdown;
