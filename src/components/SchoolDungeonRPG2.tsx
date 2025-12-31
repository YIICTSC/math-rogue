import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, Circle, Menu, X, Check, Search, LogOut, Shield, Sword, Target, Trash2, Hammer, FlaskConical, Info, Zap, Skull, Ghost, Award, RotateCcw, Send, Edit3, HelpCircle, Umbrella, Crosshair, FastForward, Coins, ShoppingBag, DollarSign, Map as MapIcon, User, Watch, Sparkles, BookOpen, Layers, Move, Minimize2, Maximize2, Volume2, ShieldAlert, ArrowUpCircle, Plus, Magnet, Moon, Snowflake, Activity, Eye, Dna, Dice5 } from 'lucide-react';
import { audioService } from '../services/audioService';
import { createPixelSpriteCanvas } from './PixelSprite';
import { storageService } from '../services/storageService';
import MathChallengeScreen from './MathChallengeScreen';
import { GameMode } from '../types';

interface SchoolDungeonRPG2Props {
  onBack: () => void;
}

// --- GBC PALETTE (Dynamic based on Floor) ---
const PALETTE_DEFAULT = { C0: '#0f380f', C1: '#306230', C2: '#8bac0f', C3: '#9bbc0f' };
const PALETTE_GYM = { C0: '#2d1b0e', C1: '#56341a', C2: '#af7846', C3: '#dfb783' }; // Brown/Wood
const PALETTE_SCIENCE = { C0: '#0b1e2d', C1: '#1b4a6e', C2: '#4a90b8', C3: '#9cd1e8' }; // Cyan/Blue
const PALETTE_MUSIC = { C0: '#2d0b26', C1: '#6e1b5c', C2: '#b84a9e', C3: '#e89ccf' }; // Purple/Pink
const PALETTE_LIBRARY = { C0: '#3e2723', C1: '#5d4037', C2: '#a1887f', C3: '#d7ccc8' }; // Sepia
const PALETTE_ROOF = { C0: '#050a14', C1: '#122442', C2: '#3b5a8c', C3: '#7aa3cc' }; // Dark Blue/Night
const PALETTE_BOSS = { C0: '#290000', C1: '#630000', C2: '#b57b00', C3: '#ffdb4d' }; // Red/Gold

interface ThemeConfig {
    name: string;
    colors: { C0: string, C1: string, C2: string, C3: string };
    bgm: 'school_psyche' | 'dungeon_gym' | 'dungeon_science' | 'dungeon_music' | 'dungeon_library' | 'dungeon_roof' | 'dungeon_boss';
}

const getTheme = (floor: number): ThemeConfig => {
    if (floor >= 20) return { name: "校長室", colors: PALETTE_BOSS, bgm: 'dungeon_boss' };
    if (floor >= 16) return { name: "屋上", colors: PALETTE_ROOF, bgm: 'dungeon_roof' };
    if (floor >= 13) return { name: "図書室", colors: PALETTE_LIBRARY, bgm: 'dungeon_library' };
    if (floor >= 10) return { name: "音楽室", colors: PALETTE_MUSIC, bgm: 'dungeon_music' };
    if (floor >= 7) return { name: "理科室", colors: PALETTE_SCIENCE, bgm: 'dungeon_science' };
    if (floor >= 4) return { name: "体育館", colors: PALETTE_GYM, bgm: 'dungeon_gym' };
    return { name: "一般教室", colors: PALETTE_DEFAULT, bgm: 'school_psyche' };
};

// --- CONSTANTS ---
const MAP_W = 40; 
const MAP_H = 40; 
const VIEW_W = 11; 
const VIEW_H = 9;
const TILE_SIZE = 16; 
const SCALE = 3; 
const MAX_INVENTORY = 20;

const HUNGER_INTERVAL = 10;
const REGEN_INTERVAL = 5;
const ENEMY_SPAWN_RATE = 25;

const UNIDENTIFIED_NAMES = [
    "赤い傘", "青い傘", "黄色い傘", "ビニール傘", "黒い傘", "壊れた傘", 
    "高級な傘", "水玉の傘", "花柄の傘", "透明な傘", "和傘", "レースの傘"
];

// --- TYPES ---
type TileType = 'WALL' | 'FLOOR' | 'STAIRS' | 'HALLWAY';
type Direction = { x: 0 | 1 | -1, y: 0 | 1 | -1 };
type ItemCategory = 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH' | 'STAFF' | 'ACCESSORY' | 'DECK_CARD';
type EnemyType = 'SLIME' | 'GHOST' | 'DRAIN' | 'DRAGON' | 'METAL' | 'FLOATING' | 'THIEF' | 'BAT' | 'BOSS' | 'MANDRAKE' | 'GOLEM' | 'NINJA' | 'MAGE' | 'SHOPKEEPER';
type VisualEffectType = 'SLASH' | 'THUNDER' | 'EXPLOSION' | 'TEXT' | 'FLASH' | 'PROJECTILE' | 'WARP' | 'BEAM' | 'MAGIC_PROJ';
type TrapType = 'BOMB' | 'SLEEP' | 'POISON' | 'WARP' | 'RUST' | 'SUMMON';

// --- NEW DECK TYPES ---
type DungeonCardType = 'ATTACK' | 'DEFENSE' | 'BUFF' | 'SPECIAL';
interface DungeonCard {
    id: string; // Unique ID per instance
    templateId: string;
    name: string;
    type: DungeonCardType;
    description: string;
    power: number;
    icon: React.ReactNode;
}

interface VisualEffect {
  id: number;
  type: VisualEffectType;
  x: number; 
  y: number; 
  duration: number;
  maxDuration: number;
  value?: string;
  color?: string;
  dir?: Direction;
  scale?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
}

interface Item {
  id: string;
  category: ItemCategory;
  type: string; 
  name: string;
  desc: string;
  value?: number; // Base price / effect value
  power?: number; 
  range?: number;
  count?: number; 
  plus?: number;
  charges?: number; 
  maxCharges?: number;
  price?: number; // Calculated price for shop
}

interface EquipmentSlots {
  weapon: Item | null;
  armor: Item | null;
  ranged: Item | null;
  accessory: Item | null;
}

interface Entity {
  id: number;
  type: 'PLAYER' | 'ENEMY' | 'ITEM' | 'GOLD' | 'TRAP';
  x: number;
  y: number;
  char: string;
  name: string;
  
  hp: number;
  maxHp: number;
  baseAttack: number; 
  baseDefense: number;
  attack: number;     
  defense: number;
  
  xp: number;
  gold?: number; // For GOLD entities or Player gold
  dir: Direction;
  
  status: {
      sleep: number;
      confused: number;
      frozen: number;
      blind: number;
      speed: number;
      defenseBuff?: number; // Temporary Defense Buff from cards
      attackBuff?: number; // Temporary Attack Buff
      poison?: number; // Poison DoT duration
      trapSight?: number; // Trap visibility duration
  };
  
  dead?: boolean;
  offset?: { x: number, y: number }; 
  itemData?: Item; 
  equipment?: EquipmentSlots;
  enemyType?: EnemyType;
  shopItems?: Item[]; // For Shopkeeper
  
  // Trap specific
  trapType?: TrapType;
  visible?: boolean;
}

interface Log {
  message: string;
  color?: string;
  id: number;
}

interface RoomRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// --- ITEM DATABASE ---
const ITEM_DB: Record<string, Omit<Item, 'id'>> = {
    // WEAPONS
    'PENCIL_SWORD': { category: 'WEAPON', type: 'PENCIL_SWORD', name: 'えんぴつソード', desc: '削りたて。攻撃+4', power: 4, value: 200 },
    'METAL_BAT': { category: 'WEAPON', type: 'METAL_BAT', name: '金属バット', desc: 'どうたぬき級。攻撃+8', power: 8, value: 500 },
    'PROTRACTOR_EDGE': { category: 'WEAPON', type: 'PROTRACTOR_EDGE', name: '分度器エッジ', desc: '前方3方向を攻撃できる。攻撃+3', power: 3, value: 400 },
    'OFUDA_RULER': { category: 'WEAPON', type: 'OFUDA_RULER', name: 'お札定規', desc: 'ゴースト系に大ダメージ。攻撃+4', power: 4, value: 350 },
    'VITAMIN_INJECT': { category: 'WEAPON', type: 'VITAMIN_INJECT', name: 'ビタミン注射', desc: 'ドレイン系に大ダメージ。攻撃+5', power: 5, value: 350 },
    'LADLE': { category: 'WEAPON', type: 'LADLE', name: '給食のおたま', desc: '敵を肉(回復)に変えることがある。攻撃+2', power: 2, value: 600 },
    'STAINLESS_PEN': { category: 'WEAPON', type: 'STAINLESS_PEN', name: 'ステンレスペン', desc: 'サビの罠にかからない。攻撃+6', power: 6, value: 450 },
    'RICH_WATCH': { category: 'WEAPON', type: 'RICH_WATCH', name: '金持ちの時計', desc: 'お金を消費して大ダメージ。攻撃+10', power: 10, value: 800 },

    // ARMOR
    'GYM_CLOTHES': { category: 'ARMOR', type: 'GYM_CLOTHES', name: '体操服', desc: '動きやすい。回避率UP。防御+3', power: 3, value: 200 },
    'RANDO_SERU': { category: 'ARMOR', type: 'RANDO_SERU', name: 'ランドセル', desc: '硬いが重い。腹減りが早まる。防御+12', power: 12, value: 500 },
    'PRINCIPAL_SHIELD': { category: 'ARMOR', type: 'PRINCIPAL_SHIELD', name: '校長の盾', desc: '最強の盾。防御+15', power: 15, value: 1000 },
    'VINYL_APRON': { category: 'ARMOR', type: 'VINYL_APRON', name: 'ビニールエプロン', desc: 'サビや汚れを防ぐ。防御+4', power: 4, value: 300 },
    'NAME_TAG': { category: 'ARMOR', type: 'NAME_TAG', name: '名札', desc: '盗難を防ぐ。防御+5', power: 5, value: 250 },
    'DISASTER_HOOD': { category: 'ARMOR', type: 'DISASTER_HOOD', name: '防災頭巾', desc: '爆発ダメージ減少。防御+6', power: 6, value: 350 },
    'FIREFIGHTER': { category: 'ARMOR', type: 'FIREFIGHTER', name: '防火ヘルメット', desc: '炎ダメージ減少。防御+7', power: 7, value: 400 },
    'GOLD_BADGE': { category: 'ARMOR', type: 'GOLD_BADGE', name: '純金の校章', desc: 'サビない。防御+8', power: 8, value: 600 },

    // ACCESSORIES (BRACELETS)
    'RING_POWER': { category: 'ACCESSORY', type: 'RING_POWER', name: 'ちからの腕輪', desc: '攻撃力が上がる。攻撃+3', power: 3, value: 500 },
    'RING_GUARD': { category: 'ACCESSORY', type: 'RING_GUARD', name: 'まもりの腕輪', desc: '防御力が上がる。防御+3', power: 3, value: 500 },
    'RING_HUNGER': { category: 'ACCESSORY', type: 'RING_HUNGER', name: 'ハラヘラズの腕輪', desc: 'お腹が減りにくくなる。', value: 800 },
    'RING_HEAL': { category: 'ACCESSORY', type: 'RING_HEAL', name: '回復の腕輪', desc: 'HPの回復が早くなるが、お腹も減る。', value: 800 },
    'RING_SIGHT': { category: 'ACCESSORY', type: 'RING_SIGHT', name: '透視の腕輪', desc: '敵とアイテムの位置がわかる。', value: 1000 },
    'RING_TRAP': { category: 'ACCESSORY', type: 'RING_TRAP', name: 'ワナ師の腕輪', desc: '罠が見えるようになる。', value: 800 },

    // RANGED
    'CHALK': { category: 'RANGED', type: 'CHALK', name: 'チョーク', desc: '普通の飛び道具。', power: 3, range: 5, count: 8, value: 100 },
    'STONES': { category: 'RANGED', type: 'STONES', name: '石ころ', desc: '必中。範囲攻撃。', power: 2, range: 4, count: 5, value: 80 },
    'SHADOW_PIN': { category: 'RANGED', type: 'SHADOW_PIN', name: '影縫いの画鋲', desc: '当たると移動不可にする。', power: 1, range: 5, count: 3, value: 150 },

    // STAFF (UMBRELLAS) - Requires ID
    'UMB_FIRE': { category: 'STAFF', type: 'UMB_FIRE', name: '火炎放射傘', desc: '振ると前方に炎を放つ。', maxCharges: 5, value: 400 },
    'UMB_THUNDER': { category: 'STAFF', type: 'UMB_THUNDER', name: '避雷針の傘', desc: '振ると前方の敵に雷ダメージ。', maxCharges: 5, value: 400 },
    'UMB_SLEEP': { category: 'STAFF', type: 'UMB_SLEEP', name: '子守唄の傘', desc: '振ると前方の敵を眠らせる。', maxCharges: 5, value: 400 },
    'UMB_BLOW': { category: 'STAFF', type: 'UMB_BLOW', name: '突風の傘', desc: '振ると敵を吹き飛ばす。', maxCharges: 6, value: 350 },
    'UMB_WARP': { category: 'STAFF', type: 'UMB_WARP', name: '早退の傘', desc: '振ると敵をどこかへワープさせる。', maxCharges: 5, value: 350 },
    'UMB_CHANGE': { category: 'STAFF', type: 'UMB_CHANGE', name: '席替えの傘', desc: '振ると敵と場所を入れ替わる。', maxCharges: 6, value: 350 },
    'UMB_BIND': { category: 'STAFF', type: 'UMB_BIND', name: '金縛りの傘', desc: '振ると敵を動けなくする。', maxCharges: 5, value: 400 },
    'UMB_HEAL': { category: 'STAFF', type: 'UMB_HEAL', name: '回復の傘', desc: '振るとHPを回復する(敵に当てると敵が回復)。', maxCharges: 5, value: 500 },

    // CONSUMABLE (Notebooks)
    'SCROLL_SLEEP': { category: 'CONSUMABLE', type: 'SCROLL_SLEEP', name: '居眠りノート', desc: '部屋の敵が眠る。', value: 300 },
    'SCROLL_THUNDER': { category: 'CONSUMABLE', type: 'SCROLL_THUNDER', name: '理科の実験ノート', desc: 'フロア全体の敵に雷ダメージ。', value: 400 },
    'SCROLL_CRISIS': { category: 'CONSUMABLE', type: 'SCROLL_CRISIS', name: '先生への反省文', desc: '困った時の神頼み(全回復等)。', value: 500 },
    'SCROLL_BERSERK': { category: 'CONSUMABLE', type: 'SCROLL_BERSERK', name: '学級崩壊ノート', desc: '敵が暴走する。', value: 200 },
    'SCROLL_MAP': { category: 'CONSUMABLE', type: 'SCROLL_MAP', name: '学校の案内図', desc: 'フロア構造がわかる。', value: 300 },
    'SCROLL_UP_W': { category: 'CONSUMABLE', type: 'SCROLL_UP_W', name: '表彰状(武)', desc: '武器を強化する(+1)。', value: 400 },
    'SCROLL_UP_A': { category: 'CONSUMABLE', type: 'SCROLL_UP_A', name: '表彰状(防)', desc: '防具を強化する(+1)。', value: 400 },
    'SCROLL_BLANK': { category: 'CONSUMABLE', type: 'SCROLL_BLANK', name: '白紙のノート', desc: '一度読んだノートの効果を書き込める。', value: 800 },
    'SCROLL_WARP': { category: 'CONSUMABLE', type: 'SCROLL_WARP', name: '早退届', desc: 'フロアのどこかへワープする。', value: 100 },
    'SCROLL_CONFUSE': { category: 'CONSUMABLE', type: 'SCROLL_CONFUSE', name: '学級閉鎖ノート', desc: '部屋の敵が混乱する。', value: 300 },
    'SCROLL_IDENTIFY': { category: 'CONSUMABLE', type: 'SCROLL_IDENTIFY', name: '解法のノート', desc: '所持しているアイテムを全て識別する。', value: 300 },

    // FOOD/OTHERS
    'FOOD_ONIGIRI': { category: 'CONSUMABLE', type: 'FOOD_ONIGIRI', name: 'おにぎり', desc: 'お腹が50回復。', value: 50 },
    'FOOD_MEAT': { category: 'CONSUMABLE', type: 'FOOD_MEAT', name: '謎の肉', desc: 'お腹100、HP50回復。', value: 100 },
    'GRASS_HEAL': { category: 'CONSUMABLE', type: 'GRASS_HEAL', name: '給食の残り', desc: 'HP100回復。', value: 100 },
    'GRASS_LIFE': { category: 'CONSUMABLE', type: 'GRASS_LIFE', name: '命の野菜', desc: '最大HP+5。HP5回復。', value: 500 },
    'GRASS_SPEED': { category: 'CONSUMABLE', type: 'GRASS_SPEED', name: 'エナドリ', desc: '20ターンの間、倍速になる。', value: 200 },
    'GRASS_EYE': { category: 'CONSUMABLE', type: 'GRASS_EYE', name: '目薬', desc: '罠が見えるようになる。', value: 200 },
    'GRASS_POISON': { category: 'CONSUMABLE', type: 'GRASS_POISON', name: '腐ったパン', desc: '毒を受ける/敵に投げると毒。', value: 50 },
    'POT_GLUE': { category: 'SYNTH', type: 'POT_GLUE', name: '工作のり', desc: '装備を合成する。', value: 500 },
    'POT_CHANGE': { category: 'CONSUMABLE', type: 'POT_CHANGE', name: 'びっくり箱', desc: '中身を別のアイテムに変化させる。', value: 400 },
    'BOMB': { category: 'CONSUMABLE', type: 'BOMB', name: '爆弾', desc: '周囲を爆破する。', value: 200 },
};

// --- DUNGEON CARD DATABASE ---
const DUNGEON_CARD_DB: Omit<DungeonCard, 'id'>[] = [
    // BASIC
    { templateId: 'THRUST', name: 'えんぴつ突き', type: 'ATTACK', power: 3, description: '前方2マスの敵を貫通攻撃', icon: <Sword size={16}/> },
    { templateId: 'SPIN', name: 'コンパス回転', type: 'ATTACK', power: 2, description: '周囲8マスの敵にダメージ', icon: <RotateCcw size={16}/> },
    { templateId: 'HEAL', name: '給食休憩', type: 'BUFF', power: 30, description: 'HPを回復する', icon: <FlaskConical size={16}/> },
    { templateId: 'GUARD', name: 'ノート盾', type: 'DEFENSE', power: 10, description: '防御力を一時的に上げる', icon: <Shield size={16}/> },
    
    // UTILITY
    { templateId: 'JUMP', name: '幅跳び', type: 'SPECIAL', power: 0, description: '前方2マス先へジャンプ移動', icon: <Move size={16}/> },
    { templateId: 'SWAP', name: '場所替え', type: 'SPECIAL', power: 0, description: '目の前の敵と入れ替わる', icon: <RotateCcw size={16}/> },
    { templateId: 'PULL', name: '引き寄せ', type: 'SPECIAL', power: 0, description: '遠くの敵を目の前に引き寄せる', icon: <Minimize2 size={16}/> },
    { templateId: 'PUSH', name: '吹き飛ばし', type: 'ATTACK', power: 2, description: '敵を5マス吹き飛ばす', icon: <Maximize2 size={16}/> },
    { templateId: 'DIG', name: '穴掘り', type: 'SPECIAL', power: 0, description: '目の前の壁を掘って進む', icon: <Hammer size={16}/> },
    { templateId: 'TELEPORT', name: '早退', type: 'SPECIAL', power: 0, description: 'フロアのどこかへワープ', icon: <Ghost size={16}/> },
    
    // ATTACK
    { templateId: 'FIRE', name: '理科実験', type: 'SPECIAL', power: 15, description: '遠距離の敵に炎ダメージ', icon: <Zap size={16}/> },
    { templateId: 'EXPLOSION', name: '化学爆発', type: 'ATTACK', power: 20, description: '周囲8マスの敵に大ダメージ', icon: <Sparkles size={16}/> },
    { templateId: 'ROOM_ATK', name: '全校放送', type: 'ATTACK', power: 8, description: '部屋全体の敵にダメージ', icon: <Volume2 size={16}/> },
    { templateId: 'WAVE', name: '定規なぎ払い', type: 'ATTACK', power: 4, description: '前方3方向にダメージ', icon: <Move size={16}/> },
    { templateId: 'SNIPE', name: '狙い撃ち', type: 'ATTACK', power: 10, description: '遠くの敵1体に大ダメージ', icon: <Crosshair size={16}/> },
    { templateId: 'PIERCE', name: '貫通弾', type: 'ATTACK', power: 6, description: '直線上の敵すべてにダメージ', icon: <ArrowUpCircle size={16}/> },
    
    // BUFF
    { templateId: 'DASH', name: '廊下ダッシュ', type: 'BUFF', power: 0, description: '倍速状態になる', icon: <FastForward size={16}/> },
    { templateId: 'RAGE', name: '逆ギレ', type: 'BUFF', power: 5, description: '攻撃力を一時的に上げる', icon: <Sword size={16}/> },
    { templateId: 'INVINCIBLE', name: '無敵スター', type: 'BUFF', power: 99, description: '一時的に防御力極大アップ', icon: <ShieldAlert size={16}/> },
    { templateId: 'DISARM', name: '武器奪取', type: 'SPECIAL', power: 0, description: '周囲の敵の攻撃力を下げる', icon: <X size={16}/> },

    // NEW CARDS
    { templateId: 'CROSS', name: '十字定規', type: 'ATTACK', power: 5, description: '前後左右4マスの敵を攻撃', icon: <Plus size={16}/> },
    { templateId: 'X_ATK', name: 'バッテン', type: 'ATTACK', power: 5, description: '斜め4方向の敵を攻撃', icon: <X size={16}/> },
    { templateId: 'DRAIN', name: '給食当番', type: 'ATTACK', power: 4, description: '敵にダメージを与え、半分回復', icon: <Dna size={16}/> },
    { templateId: 'POISON', name: '毒舌', type: 'SPECIAL', power: 0, description: '目の前の敵を猛毒にする(継続ダメ)', icon: <Skull size={16}/> },
    { templateId: 'SLEEP', name: '校長の話', type: 'SPECIAL', power: 0, description: '部屋全体の敵を眠らせる', icon: <Moon size={16}/> },
    { templateId: 'FREEZE', name: '寒いギャグ', type: 'ATTACK', power: 2, description: '目の前の敵を凍らせる', icon: <Snowflake size={16}/> },
    { templateId: 'MAGNET', name: '落とし物', type: 'SPECIAL', power: 0, description: 'フロア中のアイテムを引き寄せる', icon: <Magnet size={16}/> },
    { templateId: 'MAP', name: 'カンニング', type: 'SPECIAL', power: 0, description: 'フロアのマップ構造をあばく', icon: <Eye size={16}/> },
    { templateId: 'EARTHQUAKE', name: '貧乏ゆすり', type: 'ATTACK', power: 5, description: '部屋全体の敵にダメージ', icon: <Activity size={16}/> },
    { templateId: 'GAMBLE', name: '運試し', type: 'SPECIAL', power: 0, description: '所持金増加か、ダメージか', icon: <Dice5 size={16}/> },
];

// --- DIJKSTRA PATHFINDING HELPER ---
const computeDijkstraMap = (map: TileType[][], targetX: number, targetY: number): number[][] => {
    const dMap = Array(MAP_H).fill(0).map(() => Array(MAP_W).fill(9999));
    const queue: {x: number, y: number}[] = [{x: targetX, y: targetY}];
    dMap[targetY][targetX] = 0;

    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        const dist = dMap[y][x];

        // 8 Neighbors (Cardinal + Diagonal)
        const neighbors = [
            {x:x, y:y-1}, {x:x, y:y+1}, {x:x-1, y:y}, {x:x+1, y:y},
            {x:x-1, y:y-1}, {x:x+1, y:y-1}, {x:x-1, y:y+1}, {x:x+1, y:y+1}
        ];

        for(const n of neighbors) {
            if(n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H) {
                // Treat Walls as impassable
                if (map[n.y][n.x] !== 'WALL') {
                    // --- CORNER CUTTING CHECK (DIJKSTRA) ---
                    const dx = n.x - x;
                    const dy = n.y - y;
                    if (dx !== 0 && dy !== 0) {
                        if (map[y][x + dx] === 'WALL' || map[y + dy][x] === 'WALL') {
                            continue; // Blocked by corner
                        }
                    }
                    // ---------------------------------------

                    if (dMap[n.y][n.x] > dist + 1) {
                        dMap[n.y][n.x] = dist + 1;
                        queue.push(n);
                    }
                }
            }
        }
    }
    return dMap;
};

const SchoolDungeonRPG2: React.FC<SchoolDungeonRPG2Props> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [map, setMap] = useState<TileType[][]>([]);
  const [visitedMap, setVisitedMap] = useState<boolean[][]>([]); // Fog of War state
  const [floorMapRevealed, setFloorMapRevealed] = useState(false); // Map Scroll effect
  const roomsRef = useRef<RoomRect[]>([]); // Keep track of rooms for logic
  const spriteCache = useRef<Record<string, HTMLCanvasElement>>({});
  
  const [player, setPlayer] = useState<Entity>({
    id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
    hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
    equipment: { weapon: null, armor: null, ranged: null, accessory: null },
    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
    offset: { x: 0, y: 0 }
  });

  // Deck System State
  const [dungeonDeck, setDungeonDeck] = useState<DungeonCard[]>([]);
  const [dungeonHand, setDungeonHand] = useState<DungeonCard[]>([]);
  const [dungeonDiscard, setDungeonDiscard] = useState<DungeonCard[]>([]);

  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [floorItems, setFloorItems] = useState<Entity[]>([]);
  const [traps, setTraps] = useState<Entity[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  
  // Game Status
  const [floor, setFloor] = useState(1);
  const [level, setLevel] = useState(1);
  const [belly, setBelly] = useState(100);
  const [maxBelly, setMaxBelly] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameClear, setGameClear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false); 
  const [showHelp, setShowHelp] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showDeck, setShowDeck] = useState(false); // New: Deck View
  const turnCounter = useRef(0);
  const [isEndless, setIsEndless] = useState(false);
  const saveDebounceRef = useRef<any>(null);
  const [shopRemovedThisFloor, setShopRemovedThisFloor] = useState(false); // New: Track shop removal
  
  const currentTheme = useMemo(() => getTheme(floor), [floor]);

  // Shop State
  const [shopState, setShopState] = useState<{ active: boolean, merchantId: number | null, mode: 'BUY' | 'SELL' }>({ active: false, merchantId: null, mode: 'BUY' });
  const [deckViewMode, setDeckViewMode] = useState<'VIEW' | 'REMOVE'>('VIEW');

  // VFX State
  const visualEffects = useRef<VisualEffect[]>([]);
  const shake = useRef<{x: number, y: number, duration: number}>({x: 0, y: 0, duration: 0});
  
  // Synthesis/Change/Blank State
  const [synthState, setSynthState] = useState<{ 
      active: boolean, 
      mode: 'SYNTH' | 'CHANGE' | 'BLANK',
      step: 'SELECT_BASE' | 'SELECT_MAT' | 'SELECT_TARGET' | 'SELECT_EFFECT', 
      baseIndex: number | null 
  }>({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null });

  // Identification State
  const [idMap, setIdMap] = useState<Record<string, string>>({}); // RealType -> RandomName
  const [identifiedTypes, setIdentifiedTypes] = useState<Set<string>>(new Set());

  // Menu Navigation
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [blankScrollSelectionIndex, setBlankScrollSelectionIndex] = useState(0);
  const menuListRef = useRef<HTMLDivElement>(null);
  const lastInputType = useRef<'KEY' | 'MOUSE'>('KEY');

  // Inspection
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const longPressTimer = useRef<any>(null);
  
  // Fast Forward State
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const fastForwardInterval = useRef<any>(null);

  // Math Challenge State
  const [showMathChallenge, setShowMathChallenge] = useState(false);

  // --- GAME OVER DETECTION ---
  useEffect(() => {
    if (player.hp <= 0 && !gameOver && !gameClear) {
        setGameOver(true);
        audioService.playSound('lose');
        saveDungeonScore("HP 0");
        storageService.clearDungeonState2();
    }
  }, [player.hp, gameOver, gameClear]);

  // Init
  useEffect(() => {
    // Generate Sprites
    spriteCache.current['PLAYER_FRONT'] = createPixelSpriteCanvas('P_FRONT', 'HERO_FRONT|赤'); 
    spriteCache.current['PLAYER_SIDE'] = createPixelSpriteCanvas('P_SIDE', 'HERO_SIDE|赤'); 
    spriteCache.current['PLAYER_BACK'] = createPixelSpriteCanvas('P_BACK', 'HERO_BACK|赤');
    spriteCache.current['SLIME'] = createPixelSpriteCanvas('SLIME', 'SLIME|#1565C0'); 
    spriteCache.current['GHOST'] = createPixelSpriteCanvas('GHOST', 'GHOST|#a5f3fc'); 
    spriteCache.current['BAT'] = createPixelSpriteCanvas('BAT', 'BAT|#212121'); 
    spriteCache.current['DRAIN'] = createPixelSpriteCanvas('DRAIN', 'GHOST|#6A1B9A'); 
    spriteCache.current['DRAGON'] = createPixelSpriteCanvas('DRAGON', 'BEAST|#ef4444'); 
    spriteCache.current['METAL'] = createPixelSpriteCanvas('METAL', 'SLIME|#FFD700'); 
    spriteCache.current['THIEF'] = createPixelSpriteCanvas('THIEF', 'FLIER|#5D4037'); 
    spriteCache.current['BOSS'] = createPixelSpriteCanvas('BOSS', 'BOSS|#FFD700'); 
    spriteCache.current['WEAPON'] = createPixelSpriteCanvas('WPN', 'SWORD');
    spriteCache.current['ARMOR'] = createPixelSpriteCanvas('ARM', 'SHIELD');
    spriteCache.current['RANGED'] = createPixelSpriteCanvas('RNG', 'POTION'); 
    spriteCache.current['CONSUMABLE'] = createPixelSpriteCanvas('CON', 'NOTEBOOK');
    spriteCache.current['SYNTH'] = createPixelSpriteCanvas('SYNTH', 'POTION|#FFFFFF'); 
    spriteCache.current['STAFF'] = createPixelSpriteCanvas('STAFF', 'UMBRELLA|#00BCD4'); 
    spriteCache.current['MANDRAKE'] = createPixelSpriteCanvas('MANDRAKE', 'PLANT|#33691e');
    spriteCache.current['GOLEM'] = createPixelSpriteCanvas('GOLEM', 'SKELETON|#b0bec5');
    spriteCache.current['NINJA'] = createPixelSpriteCanvas('NINJA', 'FLIER|#1a237e');
    spriteCache.current['MAGE'] = createPixelSpriteCanvas('MAGE', 'WIZARD|#7b1fa2');
    
    // New Sprites
    spriteCache.current['COIN'] = createPixelSpriteCanvas('COIN', 'GEM|#FFD700');
    spriteCache.current['SHOPKEEPER'] = createPixelSpriteCanvas('SHOPKEEPER', 'HUMANOID|#33691e'); 
    spriteCache.current['GOLD_BAG'] = createPixelSpriteCanvas('GOLD_BAG', 'GOLD_BAG|#FFD700');
    spriteCache.current['MAGIC_BULLET'] = createPixelSpriteCanvas('MAGIC_BULLET', 'MAGIC_BULLET|#00BCD4');
    spriteCache.current['TRAP'] = createPixelSpriteCanvas('TRAP', 'CROSS|#0f380f'); // Black cross trap
    spriteCache.current['ACCESSORY'] = createPixelSpriteCanvas('ACCESSORY', 'SHIELD|#FFD700'); // Bracelet/Ring
    
    spriteCache.current['DECK_CARD'] = createPixelSpriteCanvas('DECK_CARD', 'NOTEBOOK|#FFFFFF|SKILL'); // New: Card Sprite

    // Load Game State
    const savedState = storageService.loadDungeonState2();
    if (savedState) {
        restoreState(savedState);
    } else {
        startNewGame();
    }
    
    return () => {
        audioService.stopBGM();
    };
  }, []);

  // Update BGM when theme changes
  useEffect(() => {
      audioService.playBGM(currentTheme.bgm);
  }, [currentTheme.bgm]);

  const restoreState = (save: any) => {
      setMap(save.map);
      setVisitedMap(save.visitedMap || Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false))); // Fallback for old saves
      setFloorMapRevealed(save.floorMapRevealed || false);
      roomsRef.current = save.rooms || []; // Restore rooms meta
      setPlayer(save.player);
      setEnemies(save.enemies);
      setFloorItems(save.floorItems);
      setTraps(save.traps || []);
      setInventory(save.inventory);
      setFloor(save.floor);
      setLevel(save.level);
      setBelly(save.belly);
      setMaxBelly(save.maxBelly);
      setIdMap(save.idMap);
      setIdentifiedTypes(new Set(save.identifiedTypes || [])); // Safe fallback
      setIsEndless(save.isEndless);
      turnCounter.current = Number(save.turnCounter || 0);
      
      // Restore Deck State with Icon Hydration (React Nodes don't survive JSON serialization)
      if (save.dungeonDeck) {
          const hydrateCards = (cards: any[]) => cards.map(c => {
              const template = DUNGEON_CARD_DB.find(t => t.templateId === c.templateId);
              return { 
                  ...c, 
                  icon: template ? template.icon : <HelpCircle size={16}/> 
              };
          });

          setDungeonDeck(hydrateCards(save.dungeonDeck));
          setDungeonHand(hydrateCards(save.dungeonHand));
          setDungeonDiscard(hydrateCards(save.dungeonDiscard));
      } else {
          // If loading old save without deck, init deck
          initDeck();
      }
      addLog("冒険を再開した。", currentTheme.colors.C2);
  };

  const saveData = useCallback(() => {
      if (gameOver) return;
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      
      saveDebounceRef.current = setTimeout(() => {
          const stateToSave = {
              map, visitedMap, floorMapRevealed, 
              rooms: roomsRef.current, // Save rooms
              player, enemies, floorItems, traps, inventory,
              floor, level, belly, maxBelly,
              idMap, identifiedTypes: Array.from(identifiedTypes),
              isEndless, turnCounter: turnCounter.current,
              dungeonDeck, dungeonHand, dungeonDiscard // Save Deck
          };
          storageService.saveDungeonState2(stateToSave);
      }, 500); // 500ms debounce
  }, [map, visitedMap, floorMapRevealed, player, enemies, floorItems, traps, inventory, floor, level, belly, maxBelly, idMap, identifiedTypes, isEndless, gameOver, dungeonDeck, dungeonHand, dungeonDiscard]);

  // Update Visited Map when player moves
  useEffect(() => {
      setVisitedMap(prev => {
          const next = prev.map(row => [...row]);
          let changed = false;
          
          const startX = player.x - Math.floor(VIEW_W/2);
          const startY = player.y - Math.floor(VIEW_H/2);
          
          for (let y = 0; y < VIEW_H; y++) {
              for (let x = 0; x < VIEW_W; x++) {
                  const mx = startX + x;
                  const my = startY + y;
                  if (mx >= 0 && mx < MAP_W && my >= 0 && my < MAP_H) {
                      if (!next[my][mx]) {
                          next[my][mx] = true;
                          changed = true;
                      }
                  }
              }
          }
          return changed ? next : prev;
      });
  }, [player.x, player.y]);

  // Auto-save effect on key state changes
  useEffect(() => {
      if (!gameOver && !gameClear) {
          saveData();
      }
  }, [player, inventory, floor, level, belly, enemies, floorItems, traps, gameOver, gameClear, saveData]);

  // Update Stats
  useEffect(() => {
      setPlayer(p => {
          const wItem = p.equipment?.weapon;
          const aItem = p.equipment?.armor;
          const accItem = p.equipment?.accessory;
          const wPow = (wItem?.power || 0) + (wItem?.plus || 0);
          const aPow = (aItem?.power || 0) + (aItem?.plus || 0);
          const accPow = (accItem?.type === 'RING_POWER' ? (accItem.power || 0) : 0);
          const accDef = (accItem?.type === 'RING_GUARD' ? (accItem.power || 0) : 0);
          
          // Defense buff from cards
          const buffDef = p.status.defenseBuff || 0;
          // Attack buff from cards
          const buffAtk = p.status.attackBuff || 0;

          return {
              ...p,
              attack: p.baseAttack + wPow + accPow + buffAtk,
              defense: p.baseDefense + aPow + accDef + buffDef
          };
      });
  }, [player.equipment, player.status.defenseBuff, player.status.attackBuff]);

  const addVisualEffect = (type: VisualEffectType, x: number, y: number, options: Partial<VisualEffect> = {}) => {
      visualEffects.current.push({
          id: Date.now() + Math.random(),
          type, x, y,
          duration: type === 'TEXT' ? 30 : 15,
          maxDuration: type === 'TEXT' ? 30 : 15,
          ...options
      });
  };

  const triggerShake = (duration: number) => {
      shake.current.duration = duration;
  };

  const addLog = (msg: string, color?: string) => {
    setLogs(prev => {
        const nextLogs = [...prev, { message: msg, color, id: Date.now() + Math.random() }];
        if (nextLogs.length > 20) return nextLogs.slice(nextLogs.length - 20);
        return nextLogs;
    });
  };

  const saveDungeonScore = (reason: string) => {
      const score = floor * 100 + level * 50 + (inventory.length * 10) + (player.gold || 0);
      storageService.saveDungeonScore2({
          id: `dungeon-${Date.now()}`,
          date: Date.now(),
          floor: floor,
          level: level,
          score: score,
          reason: reason
      });
  };

  const initDeck = () => {
      const newDeck: DungeonCard[] = [];
      
      // 6x Pencil Thrust
      const thrustTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'THRUST')!;
      for(let i=0; i<6; i++) {
          newDeck.push({
              ...thrustTemplate,
              id: `card-init-thrust-${Date.now()}-${i}-${Math.random()}`
          });
      }
      
      // 1x Compass Spin
      const spinTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'SPIN')!;
      newDeck.push({
          ...spinTemplate,
          id: `card-init-spin-${Date.now()}-${Math.random()}`
      });

      // 1x Notebook Shield
      const guardTemplate = DUNGEON_CARD_DB.find(t => t.templateId === 'GUARD')!;
      newDeck.push({
          ...guardTemplate,
          id: `card-init-guard-${Date.now()}-${Math.random()}`
      });
      
      // Shuffle
      newDeck.sort(() => Math.random() - 0.5);
      
      // Draw 3
      const hand = newDeck.splice(0, 3);
      setDungeonHand(hand);
      setDungeonDeck(newDeck);
      setDungeonDiscard([]);
  };

  const startNewGame = () => {
    setFloor(1);
    setLevel(1);
    setBelly(100);
    setMaxBelly(100);
    setGameOver(false);
    setGameClear(false);
    setMenuOpen(false);
    setShopState({ active: false, merchantId: null, mode: 'BUY' });
    setIsEndless(false);
    turnCounter.current = 0;
    visualEffects.current = [];
    setIsFastForwarding(false);
    roomsRef.current = []; // Reset rooms
    
    const shuffledNames = [...UNIDENTIFIED_NAMES].sort(() => Math.random() - 0.5);
    const staffTypes = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].category === 'STAFF');
    const newIdMap: Record<string, string> = {};
    staffTypes.forEach((t, i) => {
        newIdMap[t] = shuffledNames[i] || "謎の傘";
    });
    setIdMap(newIdMap);
    setIdentifiedTypes(new Set());

    const initItem: Item = { ...ITEM_DB['FOOD_ONIGIRI'], id: `start-${Date.now()}` };
    const initWeapon: Item = { ...ITEM_DB['PENCIL_SWORD'], id: `start-w-${Date.now()}` };
    setInventory([initItem, initWeapon]);
    
    setPlayer({
        id: 0, type: 'PLAYER', x: 1, y: 1, char: '@', name: 'わんぱく小学生', 
        hp: 50, maxHp: 50, baseAttack: 3, baseDefense: 0, attack: 3, defense: 0, xp: 0, gold: 0, dir: {x:0, y:1},
        equipment: { weapon: null, armor: null, ranged: null, accessory: null },
        status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
        offset: { x: 0, y: 0 }
    });

    initDeck();
    setLogs([]);
    generateFloor(1);
    addLog("風来の旅が始まった！");
  };

  const handleRestart = () => {
      storageService.clearDungeonState2();
      startNewGame();
  };

  const handleQuit = () => {
      saveData();
      onBack();
  };

  const isPointInRoom = (x: number, y: number) => {
      return roomsRef.current.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  };

  const spawnEnemy = (x: number, y: number, floorLevel: number): Entity => {
      const r = Math.random();
      let t: EnemyType = 'SLIME';
      let name="敵", hp=10, atk=2, xp=5, def=0;
      const scaling = Math.floor((floorLevel - 1) * 2); 
      const hpScale = Math.floor(floorLevel * 3);
      const xpScale = Math.floor(floorLevel * 1.5);

      if (floorLevel === 1) {
          if (r < 0.6) { t = 'SLIME'; name="スライム"; hp=10; atk=3; xp=5; }
          else { t = 'BAT'; name="コウモリ"; hp=8; atk=4; xp=6; }
      } else {
          if (r < 0.20) { t = 'SLIME'; name="スライム"; hp=10+hpScale; atk=3+scaling; xp=5+xpScale; }
          else if (r < 0.35) { t = 'BAT'; name="コウモリ"; hp=8+hpScale; atk=5+scaling; xp=7+xpScale; }
          else if (r < 0.45 && floorLevel > 2) { t = 'MANDRAKE'; name="人食い植物"; hp=20+hpScale; atk=5+scaling; xp=12+xpScale; }
          else if (r < 0.60) { t = 'GHOST'; name="浮遊霊"; hp=15+hpScale; atk=4+scaling; xp=10+xpScale; def=2+Math.floor(floorLevel/2); }
          else if (r < 0.70) { t = 'THIEF'; name="トド"; hp=20+hpScale; atk=2+scaling; xp=15+xpScale; }
          else if (r < 0.80) { t = 'DRAIN'; name="くさった死体"; hp=30+hpScale; atk=6+scaling; xp=20+xpScale; }
          else if (r < 0.85 && floorLevel > 5) { t = 'NINJA'; name="忍者ごっこ"; hp=25+hpScale; atk=8+scaling; xp=25+xpScale; }
          else if (r < 0.90 && floorLevel > 7) { t = 'GOLEM'; name="人体模型"; hp=60+hpScale*1.5; atk=12+scaling; xp=40+xpScale; def=5; }
          else if (r < 0.95 && floorLevel > 10) { t = 'MAGE'; name="魔法使い"; hp=30+hpScale; atk=10+scaling; xp=35+xpScale; }
          else if (r < 0.98 && floorLevel > 4) { t = 'DRAGON'; name="ドラゴン"; hp=50+hpScale*2; atk=10+scaling*1.5; xp=50+xpScale*2; }
          else if (floorLevel > 6) { t = 'METAL'; name="メタル生徒"; hp=4+Math.floor(floorLevel/5); atk=1+scaling; xp=100+xpScale*3; def=999; }
      }

      return {
          id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: t[0], 
          name, hp, maxHp: hp, baseAttack: Math.floor(atk), baseDefense: Math.floor(def), attack: Math.floor(atk), defense: Math.floor(def), xp: Math.floor(xp), dir: {x:0, y:0}, enemyType: t,
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
          offset: { x: 0, y: 0 }
      };
  };

  const createShopkeeper = (x: number, y: number): Entity => {
      const shopItems: Item[] = [];
      for(let i=0; i<5; i++) {
          const keys = Object.keys(ITEM_DB);
          const key = keys[Math.floor(Math.random() * keys.length)];
          const template = ITEM_DB[key];
          const price = (template.value || 100) * (Math.random() * 0.5 + 0.8);
          shopItems.push({ 
              ...template, 
              id: `shop-${Date.now()}-${i}`, 
              price: Math.floor(price),
              plus: 0, charges: template.maxCharges
          });
      }

      return {
          id: Date.now() + Math.random(), type: 'ENEMY', x, y, char: 'S', 
          name: "購買部員", hp: 1000, maxHp: 1000, baseAttack: 50, baseDefense: 20, attack: 50, defense: 20, xp: 0, dir: {x:0, y:0}, enemyType: 'SHOPKEEPER',
          status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
          offset: { x: 0, y: 0 },
          shopItems
      };
  };

  const generateFloor = (f: number) => {
    const newMap: TileType[][] = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill('WALL'));
    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    
    let attempts = 0;
    while(rooms.length < 8 && attempts < 200) {
        attempts++;
        const w = Math.floor(Math.random() * 4) + 4;
        const h = Math.floor(Math.random() * 4) + 4;
        const x = Math.floor(Math.random() * (MAP_W - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_H - h - 2)) + 1;
        const overlap = rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if(!overlap) {
            rooms.push({x, y, w, h});
            for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) newMap[ry][rx] = 'FLOOR'; }
        }
    }
    rooms.sort((a,b) => (a.x + a.y) - (b.x + b.y));
    roomsRef.current = rooms; 

    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i]; const r2 = rooms[i+1];
        let cx = Math.floor(r1.x + r1.w/2); let cy = Math.floor(r1.y + r1.h/2);
        const tx = Math.floor(r2.x + r2.w/2); const ty = Math.floor(r2.y + r2.h/2);
        while(cx !== tx) { newMap[cy][cx] = 'FLOOR'; cx += (tx > cx) ? 1 : -1; }
        while(cy !== ty) { newMap[cy][cx] = 'FLOOR'; cy += (ty > cy) ? 1 : -1; }
    }

    const startRoom = rooms[0];
    const px = Math.floor(startRoom.x + startRoom.w/2);
    const py = Math.floor(startRoom.y + startRoom.h/2);
    setPlayer(prev => ({ ...prev, x: px, y: py }));

    const newEnemies: Entity[] = [];
    const newItems: Entity[] = [];
    const newTraps: Entity[] = [];
    const lastRoom = rooms[rooms.length - 1];
    const sx = Math.floor(lastRoom.x + lastRoom.w/2);
    const sy = Math.floor(lastRoom.y + lastRoom.h/2);

    if (f === 20 && !isEndless) {
        addLog("強烈な殺気を感じる...", "red");
        triggerShake(20);
        newEnemies.push({
            id: Date.now(), type: 'ENEMY', x: sx, y: sy, char: 'B',
            name: "校長先生(真)", hp: 500, maxHp: 500, baseAttack: 30, baseDefense: 10, attack: 30, defense: 10, xp: 5000, 
            dir: {x:0, y:0}, enemyType: 'BOSS',
            status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
            offset: { x: 0, y: 0 }
        });
    } else {
        newMap[sy][sx] = 'STAIRS';
    }
    
    const candidates: {x: number, y: number}[] = [];
    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            if (newMap[y][x] === 'FLOOR' && (x !== px || y !== py) && (x !== sx || y !== sy)) {
                candidates.push({x, y});
            }
        }
    }
    candidates.sort(() => Math.random() - 0.5);

    if (f >= 2 && !isEndless && Math.random() < 0.25) {
        const shopRoomOptions = rooms.filter(r => 
            !(px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) &&
            !(sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h)
        );
        if (shopRoomOptions.length > 0) {
            const shopRoom = shopRoomOptions[Math.floor(Math.random() * shopRoomOptions.length)];
            let shopX = -1, shopY = -1;
            for(let ry = shopRoom.y + 1; ry < shopRoom.y + shopRoom.h - 1; ry++) {
                for(let rx = shopRoom.x + 1; rx < shopRoom.x + shopRoom.w - 1; rx++) {
                    const neighbors = [{x:rx, y:ry-1}, {x:rx, y:ry+1}, {x:rx-1, y:ry}, {x:rx+1, y:ry}];
                    if (neighbors.every(n => newMap[n.y][n.x] === 'FLOOR')) { shopX = rx; shopY = ry; break; }
                }
                if (shopX !== -1) break;
            }
            if (shopX !== -1) {
                newEnemies.push(createShopkeeper(shopX, shopY));
                const cIdx = candidates.findIndex(c => c.x === shopX && c.y === shopY);
                if (cIdx !== -1) candidates.splice(cIdx, 1);
            }
        }
    }

    const enemyCount = Math.floor(candidates.length * 0.05);
    for (let i = 0; i < enemyCount; i++) {
        const t = candidates.pop();
        if (t) newEnemies.push(spawnEnemy(t.x, t.y, f));
    }

    const itemCount = Math.floor(Math.random() * 4) + 6; 
    for (let i = 0; i < itemCount; i++) {
        const t = candidates.pop();
        if (t) {
            const r = Math.random();
            if (r < 0.2) {
                newItems.push({
                    id: Date.now() + Math.random(), type: 'GOLD', x: t.x, y: t.y, char: '$', name: 'お金',
                    hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
                    gold: Math.floor(Math.random() * 50 + 10 * f)
                });
            } else if (r < 0.35) { // New: Deck Card drop
                const cardTemplate = DUNGEON_CARD_DB[Math.floor(Math.random() * DUNGEON_CARD_DB.length)];
                const cardItem: Item = {
                    id: `card-item-${Date.now()}-${Math.random()}`,
                    category: 'DECK_CARD',
                    type: cardTemplate.templateId,
                    name: cardTemplate.name,
                    desc: cardTemplate.description,
                    power: cardTemplate.power,
                    value: 200, price: 100
                };
                newItems.push({
                    id: Date.now() + Math.random(), type: 'ITEM', x: t.x, y: t.y, char: '!', name: cardItem.name,
                    hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
                    itemData: cardItem
                });
            } else {
                const keys = Object.keys(ITEM_DB);
                const key = keys[Math.floor(Math.random() * keys.length)];
                const template = ITEM_DB[key];
                let plus = 0; let charges = template.maxCharges || 0;
                if ((template.category === 'WEAPON' || template.category === 'ARMOR') && Math.random() < 0.2) plus = Math.floor(Math.random() * 2) + 1;
                if (template.category === 'STAFF') charges = Math.floor(Math.random() * 4) + 2;
                newItems.push({
                    id: Date.now() + Math.random(), type: 'ITEM', x: t.x, y: t.y, char: '!', name: template.name, 
                    hp:0, maxHp:0, baseAttack:0, baseDefense:0, attack:0, defense:0, xp:0, dir:{x:0,y:0},
                    status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
                    itemData: { ...template, id: `item-${Date.now()}-${Math.random()}`, plus, charges, name: plus > 0 ? `${template.name}+${plus}` : template.name, price: Math.floor((template.value || 100) * 0.5) }
                });
            }
        }
    }

    const roomCandidates = candidates.filter(c => isPointInRoom(c.x, c.y));
    const trapCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < trapCount; i++) {
        const t = roomCandidates.pop();
        if (t) {
            const trapTypes: TrapType[] = ['BOMB', 'SLEEP', 'POISON', 'WARP', 'RUST', 'SUMMON'];
            const tType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
            newTraps.push({
                id: Date.now() + Math.random(), type: 'TRAP', x: t.x, y: t.y, char: 'X', name: '罠',
                hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: {x:0, y:0},
                status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 },
                trapType: tType, visible: false
            });
        }
    }

    setMap(newMap);
    setVisitedMap(Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false)));
    setFloorMapRevealed(false);
    setShopRemovedThisFloor(false);
    setEnemies(newEnemies);
    setFloorItems(newItems);
    setTraps(newTraps);
    setShowMap(false);
    addVisualEffect('FLASH', 0, 0, {duration: 10, maxDuration: 10});
  };

  const gainXp = (amount: number) => {
      let nextXp = player.xp + amount; let nextLv = level; let nextMaxHp = player.maxHp; let nextAtk = player.baseAttack;
      const needed = nextLv * 10;
      if (nextXp >= needed) {
          nextXp -= needed; nextLv++; nextMaxHp += 5; nextAtk += 1;
          setPlayer(p => ({ ...p, hp: nextMaxHp, baseAttack: nextAtk, maxHp: nextMaxHp })); 
          addLog(`レベルが${nextLv}に上がった！`); audioService.playSound('buff');
          addVisualEffect('FLASH', 0, 0); addVisualEffect('TEXT', player.x, player.y, { value: 'LEVEL UP!', color: currentTheme.colors.C3 });
      }
      setPlayer(p => ({ ...p, xp: nextXp }));
      setLevel(nextLv);
  };

  const processTurn = (px: number, py: number, overrides?: { belly?: number, hp?: number }) => {
      turnCounter.current = Number(turnCounter.current) + 1;
      const aType = player.equipment?.armor?.type;
      const heavy = aType === 'RANDO_SERU';
      const accType = player.equipment?.accessory?.type;
      const isHungerResist = accType === 'RING_HUNGER';
      const isHealRing = accType === 'RING_HEAL';
      let hungerRate = heavy ? 0.5 : 1; if (isHungerResist) hungerRate *= 0.5; if (isHealRing) hungerRate *= 2; 
      const interval = Math.floor(HUNGER_INTERVAL / hungerRate);
      const isHungerTurn = turnCounter.current % Math.max(1, interval) === 0;
      const regenSpeed = isHealRing ? Math.floor(REGEN_INTERVAL / 2) : REGEN_INTERVAL;
      const isRegenTurn = turnCounter.current % regenSpeed === 0;
      let currentBelly = overrides?.belly !== undefined ? overrides.belly : belly;
      if (isHungerTurn) currentBelly -= 1;
      let starveDamage = 0; if (currentBelly <= 0) { currentBelly = 0; starveDamage = 1; }
      setBelly(currentBelly);

      setPlayer(prevPlayer => {
          let currentHp = overrides?.hp !== undefined ? overrides.hp : prevPlayer.hp;
          let nextStatus = { ...prevPlayer.status };
          if (nextStatus.defenseBuff && nextStatus.defenseBuff > 0) nextStatus.defenseBuff = Math.max(0, nextStatus.defenseBuff - 2);
          if (nextStatus.attackBuff && nextStatus.attackBuff > 0) nextStatus.attackBuff = Math.max(0, nextStatus.attackBuff - 1);
          if (nextStatus.trapSight && nextStatus.trapSight > 0) { nextStatus.trapSight--; if (nextStatus.trapSight === 0) addLog("目が元に戻った。"); }
          if (nextStatus.poison && nextStatus.poison > 0) {
              const poisonDmg = 5; currentHp -= poisonDmg; nextStatus.poison--;
              addVisualEffect('TEXT', px, py, { value: `${poisonDmg}`, color: 'purple' });
              if (nextStatus.poison === 0) addLog("毒が消えた。");
          }
          if (starveDamage > 0) {
              currentHp -= 1;
              if (turnCounter.current % 5 === 0) addLog("お腹が空いて倒れそうだ...", "red");
          } else if (isRegenTurn && currentHp < prevPlayer.maxHp && currentHp > 0) currentHp += 1;
          if (nextStatus.sleep > 0) { nextStatus.sleep--; if (nextStatus.sleep<=0) addLog("目が覚めた！"); }
          if (nextStatus.confused > 0) nextStatus.confused--; if (nextStatus.blind > 0) nextStatus.blind--;
          if (nextStatus.frozen > 0) nextStatus.frozen--; if (nextStatus.speed > 0) nextStatus.speed--;
          return { ...prevPlayer, hp: Math.min(prevPlayer.maxHp, currentHp), status: nextStatus };
      });

      if (turnCounter.current % ENEMY_SPAWN_RATE === 0) {
          for(let i=0; i<5; i++){
              const rx = Math.floor(Math.random() * MAP_W); const ry = Math.floor(Math.random() * MAP_H);
              if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry) && (rx !== px || ry !== py)) { setEnemies(prev => [...prev, spawnEnemy(rx, ry, floor)]); break; }
          }
      }

      const dMap = computeDijkstraMap(map, px, py);
      setEnemies(prevEnemies => {
          const nextEnemies: Entity[] = []; const occupied = new Set<string>(); occupied.add(`${px},${py}`);
          const attackingEnemyIds: number[] = [];
          for (const e of prevEnemies) {
              if (e.enemyType === 'SHOPKEEPER') { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); continue; }
              if (e.status.sleep > 0) { e.status.sleep--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); addVisualEffect('TEXT', e.x, e.y, {value:'Zzz', color:currentTheme.colors.C3}); continue; }
              if (e.status.frozen > 0) { e.status.frozen--; nextEnemies.push(e); occupied.add(`${e.x},${e.y}`); continue; }
              const dx = px - e.x; const dy = py - e.y; const dist = Math.abs(dx) + Math.abs(dy);
              if (e.enemyType === 'DRAGON' && dist <= 2 && dist > 0 && Math.random() < 0.3) {
                  addLog(`${e.name}の炎！`, "red"); let dmg = 15;
                  if (player.equipment?.armor?.type === 'FIREFIGHTER') dmg = Math.floor(dmg / 2);
                  setPlayer(p => ({...p, hp: p.hp - dmg}));
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); addVisualEffect('EXPLOSION', px, py); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  continue;
              }
              if (e.enemyType === 'MAGE' && dist <= 4 && dist > 0 && Math.random() < 0.2) {
                  addLog(`${e.name}の魔法！混乱した！`, "yellow"); setPlayer(p => ({ ...p, status: { ...p.status, confused: 5 } }));
                  occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); addVisualEffect('FLASH', px, py);
                  continue;
              }
              let tx = e.x; let ty = e.y; let moved = false;
              if (e.status.confused > 0) { e.status.confused--; const dirs = [[0,1], [0,-1], [1,0], [-1,0]]; const r = dirs[Math.floor(Math.random()*4)]; tx = e.x + r[0]; ty = e.y + r[1]; moved = true; } 
              else if (dist <= 15) {
                  const neighbors = [{x:e.x, y:e.y-1}, {x:e.x, y:e.y+1}, {x:e.x-1, y:e.y}, {x:e.x+1, y:e.y}, {x:e.x-1, y:e.y-1}, {x:e.x+1, y:e.y-1}, {x:e.x-1, y:e.y+1}, {x:e.x+1, y:e.y+1}];
                  let bestDist = dMap[e.y][e.x]; let bestMove = null;
                  for (const n of neighbors) {
                      if (n.x >= 0 && n.x < MAP_W && n.y >= 0 && n.y < MAP_H && map[n.y][n.x] !== 'WALL') {
                          const edx = n.x - e.x; const edy = n.y - e.y;
                          if (edx !== 0 && edy !== 0 && (map[e.y][e.x + edx] === 'WALL' || map[e.y + edy][e.x] === 'WALL')) continue; 
                          if (!occupied.has(`${n.x},${n.y}`) || (n.x === px && n.y === py)) { if (dMap[n.y][n.x] < bestDist) { bestDist = dMap[n.y][n.x]; bestMove = n; } }
                      }
                  }
                  if (bestMove) { tx = bestMove.x; ty = bestMove.y; moved = true; }
              }
              if (tx === px && ty === py) {
                  let dmg = Math.max(1, e.attack - player.defense);
                  if (player.equipment?.armor?.type === 'GYM_CLOTHES' && Math.random() < 0.3) { addLog("身をかわした！"); dmg = 0; addVisualEffect('TEXT', px, py, { value: 'MISS' }); }
                  if (dmg > 0) {
                      addLog(`${e.name}の攻撃！${dmg}ダメージ！`, "red"); setPlayer(p => ({ ...p, hp: p.hp - dmg }));
                      nextEnemies.push({ ...e, offset: { x: (tx - e.x) * 6, y: (ty - e.y) * 6 } }); attackingEnemyIds.push(e.id); triggerShake(5); addVisualEffect('TEXT', px, py, { value: `${dmg}`, color: 'red' });
                  } else nextEnemies.push(e);
                  occupied.add(`${e.x},${e.y}`);
              } else if (moved) {
                  if (!map[ty][tx] || map[ty][tx] === 'WALL' || occupied.has(`${tx},${ty}`) || prevEnemies.some(o => o.id !== e.id && o.x === tx && o.y === ty)) { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); } 
                  else { occupied.add(`${tx},${ty}`); nextEnemies.push({ ...e, x: tx, y: ty }); }
              } else { occupied.add(`${e.x},${e.y}`); nextEnemies.push(e); }
          }
          if (attackingEnemyIds.length > 0) setTimeout(() => setEnemies(curr => curr.map(en => attackingEnemyIds.includes(en.id) ? { ...en, offset: { x: 0, y: 0 } } : en)), 150);
          return nextEnemies;
      });
  };

  const handleMathComplete = (correctCount: number) => {
      setShowMathChallenge(false); const nextFloor = floor + 1;
      if (correctCount >= 3) { const recovery = 10; setBelly(prev => Math.min(maxBelly, prev + recovery)); addLog(`計算正解！満腹度回復！`, "green"); audioService.playSound('buff'); }
      setFloor(nextFloor); generateFloor(nextFloor);
      const nextTheme = getTheme(nextFloor); audioService.playBGM(nextTheme.bgm);
  };

  const movePlayer = (dx: 0|1|-1, dy: 0|1|-1) => {
      if(gameOver || gameClear) return;
      if (shopState.active) {
          if (dy !== 0) {
              const shopkeeper = enemies.find(e => e.id === shopState.merchantId);
              const listLength = shopState.mode === 'BUY' ? (shopkeeper?.shopItems?.length || 0) : inventory.length;
              setSelectedItemIndex(prev => Math.max(0, Math.min(listLength - 1, prev + dy))); audioService.playSound('select');
          }
          return;
      }
      if (menuOpen) {
          if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
              const known = Array.from(identifiedTypes); if (known.length === 0) return;
              if (dy !== 0) { setBlankScrollSelectionIndex(prev => Math.max(0, Math.min(known.length - 1, prev + dy))); audioService.playSound('select'); }
          } else if (dy !== 0) { setSelectedItemIndex(prev => Math.max(0, Math.min(inventory.length - 1, prev + dy))); audioService.playSound('select'); }
          return;
      }
      if(dx === 0 && dy === 0) { addLog("足踏みした。"); processTurn(player.x, player.y); return; }
      setPlayer(p => ({ ...p, dir: {x: dx, y: dy} }));
      let tx = player.x + dx; let ty = player.y + dy;
      if (player.status.confused > 0 && Math.random() < 0.5) { const dirs = [[0,1], [0,-1], [1,0], [-1,0]]; const r = dirs[Math.floor(Math.random()*4)]; tx = player.x + r[0]; ty = player.y + r[1]; addLog("混乱した！", "yellow"); }
      const rdx = tx - player.x; const rdy = ty - player.y;
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || map[ty][tx] === 'WALL') return;
      if (rdx !== 0 && rdy !== 0 && (map[player.y][player.x + rdx] === 'WALL' || map[player.y + rdy][player.x] === 'WALL')) return;
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          if (target.enemyType === 'SHOPKEEPER') { addLog("「へいらっしゃい！」"); setShopState({ active: true, merchantId: target.id, mode: 'BUY' }); setSelectedItemIndex(0); audioService.playSound('select'); } 
          else { attackEnemy(target); processTurn(player.x, player.y); }
          return;
      }
      setPlayer(p => ({ ...p, x: tx, y: ty }));
      const trap = traps.find(t => t.x === tx && t.y === ty);
      if (trap) { trap.visible = true; addLog(`${trap.name}だ！`, "red"); activateTrap(trap); }
      const itemIdx = floorItems.findIndex(i => i.x === tx && i.y === ty);
      if (itemIdx !== -1) {
          const itemEntity = floorItems[itemIdx];
          if (itemEntity.type === 'GOLD') { setPlayer(p => ({ ...p, gold: (p.gold || 0) + (itemEntity.gold || 0) })); addLog(`${itemEntity.gold}円拾った！`, "yellow"); setFloorItems(prev => prev.filter((_, i) => i !== itemIdx)); audioService.playSound('select'); } 
          else if (itemEntity.itemData) {
              const item = itemEntity.itemData;
              if (inventory.length < MAX_INVENTORY) { setInventory(prev => [...prev, item]); addLog(`${getItemName(item)}を拾った！`); setFloorItems(prev => prev.filter((_, i) => i !== itemIdx)); audioService.playSound('select'); } 
              else addLog("持ち物がいっぱいで拾えない！", "red");
          }
      }
      if (map[ty][tx] === 'STAIRS') addLog("階段がある。");
      processTurn(tx, ty);
  };

  const handleActionBtnClick = () => {
      if (gameOver) { handleRestart(); return; }
      if (gameClear) return;
      if (menuOpen) {
          if (synthState.active) handleSynthesisStep();
          else if (inventory.length > 0) handleItemAction(selectedItemIndex);
          return;
      }
      if (shopState.active) { handleShopAction(); return; }
      if (map[player.y][player.x] === 'STAIRS') { addLog("階段を降りる..."); audioService.playSound('select'); setShowMathChallenge(true); return; }
      const tx = player.x + player.dir.x; const ty = player.y + player.dir.y;
      const target = enemies.find(e => e.x === tx && e.y === ty);
      if (target) {
          if (target.enemyType === 'SHOPKEEPER') { addLog("「何か買うかい？」"); setShopState({ active: true, merchantId: target.id, mode: 'BUY' }); setSelectedItemIndex(0); audioService.playSound('select'); } 
          else { attackEnemy(target); processTurn(player.x, player.y); }
          return;
      }
      triggerPlayerAttackAnim(player.dir); addVisualEffect('SLASH', tx, ty, { dir: player.dir }); addLog("素振りをした。"); audioService.playSound('select'); processTurn(player.x, player.y);
  };

  const activateTrap = (trap: Entity) => {
      audioService.playSound('wrong'); const t = trap.trapType;
      if (t === 'BOMB') { addLog("爆発した！", "red"); addVisualEffect('EXPLOSION', player.x, player.y); let dmg = 20; if (player.equipment?.armor?.type === 'DISASTER_HOOD') dmg = Math.floor(dmg / 2); setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - dmg) })); } 
      else if (t === 'SLEEP') { addLog("眠ってしまった...", "blue"); setPlayer(p => ({ ...p, status: { ...p.status, sleep: 5 } })); addVisualEffect('TEXT', player.x, player.y, { value: 'Zzz', color: 'blue' }); } 
      else if (t === 'POISON') { addLog("毒を受けた！", "purple"); setBelly(prev => Math.max(0, prev - 20)); setPlayer(p => ({ ...p, status: { ...p.status, poison: (p.status.poison || 0) + 10 } })); } 
      else if (t === 'WARP') { addLog("ワープした！", "yellow"); addVisualEffect('WARP', player.x, player.y); for(let i=0; i<20; i++) { const rx = Math.floor(Math.random()*MAP_W); const ry = Math.floor(Math.random()*MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) { setPlayer(p => ({ ...p, x: rx, y: ry })); break; } } } 
      else if (t === 'RUST') { addLog("サビた！", "red"); setPlayer(p => { const eq = { ...p.equipment }; if (eq.weapon && eq.weapon.type !== 'STAINLESS_PEN') { const newPlus = Math.max(-3, (eq.weapon.plus || 0) - 1); eq.weapon = { ...eq.weapon, plus: newPlus, name: eq.weapon.name.split('+')[0] + (newPlus!==0?`+${newPlus}`:'') }; } if (eq.armor && eq.armor.type !== 'GOLD_BADGE') { const newPlus = Math.max(-3, (eq.armor.plus || 0) - 1); eq.armor = { ...eq.armor, plus: newPlus, name: eq.armor.name.split('+')[0] + (newPlus!==0?`+${newPlus}`:'') }; } return { ...p, equipment: eq }; }); } 
      else if (t === 'SUMMON') { addLog("魔物召喚！", "red"); const newEnemies = []; for (let i=0; i<3; i++) { for(let k=0; k<10; k++){ const rx = player.x + Math.floor(Math.random()*5-2); const ry = player.y + Math.floor(Math.random()*5-2); if (rx>=0 && rx<MAP_W && ry>=0 && ry<MAP_H && map[ry][rx] === 'FLOOR' && !enemies.find(e=>e.x===rx&&e.y===ry)) { newEnemies.push(spawnEnemy(rx, ry, floor)); break; } } } setEnemies(prev => [...prev, ...newEnemies]); }
  };

  const getItemName = (item: Item) => { if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'RANGED' || item.category === 'SYNTH' || item.category === 'CONSUMABLE' || item.category === 'ACCESSORY' || item.category === 'DECK_CARD') return item.name; if (identifiedTypes.has(item.type)) return item.name; return idMap[item.type] || item.name; };

  const fireRangedWeapon = () => {
      if (menuOpen || shopState.active) return; const rangedItem = player.equipment?.ranged;
      if (!rangedItem) { addLog("飛び道具がない。"); return; }
      if ((rangedItem.count || 0) <= 0) { addLog(`${rangedItem.name}がない。`); setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: null } })); return; }
      const newRanged = { ...rangedItem, count: (rangedItem.count || 0) - 1 }; setPlayer(p => ({ ...p, equipment: { ...p.equipment!, ranged: newRanged } }));
      const { x: dx, y: dy } = player.dir; let lx = player.x, ly = player.y; let hitEntity: Entity | null = null;
      for (let i=1; i<=8; i++) { const tx = player.x + dx * i; const ty = player.y + dy * i; lx = tx; ly = ty; if (map[ty][tx] === 'WALL') break; const target = enemies.find(e => e.x === tx && e.y === ty); if (target) { hitEntity = target; break; } }
      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 }); triggerPlayerAttackAnim(player.dir);
      if (hitEntity) { let dmg = 5 + (newRanged.power || 0); const newEnemies = enemies.map(e => { if (e.id === hitEntity!.id) { const nhp = e.hp - dmg; return { ...e, hp: nhp }; } return e; }); const dead = newEnemies.find(e => e.id === hitEntity!.id && e.hp <= 0); if(dead) { gainXp(dead.xp); addLog(`${dead.name}を倒した！`); } else { addLog(`${hitEntity.name}に${dmg}ダメ！`); addVisualEffect('TEXT', hitEntity.x, hitEntity.y, {value:`${dmg}`}); } setEnemies(newEnemies.filter(e => e.hp > 0)); audioService.playSound('attack'); } else addLog("外した！");
      processTurn(player.x, player.y);
  };

  const handleShopAction = (indexOverride?: number) => {
      const shopkeeper = enemies.find(e => e.id === shopState.merchantId); if (!shopkeeper) { setShopState(prev => ({ ...prev, active: false })); return; }
      const idx = indexOverride !== undefined ? indexOverride : selectedItemIndex;
      if (shopState.mode === 'BUY') {
          const item = shopkeeper.shopItems![idx]; if (!item) return;
          if ((player.gold || 0) >= (item.price || 0)) {
              if (inventory.length < MAX_INVENTORY) { setPlayer(p => ({ ...p, gold: (p.gold || 0) - (item.price || 0) })); setInventory(prev => [...prev, item]); if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) { setIdentifiedTypes(prev => new Set(prev).add(item.type)); addLog(`${idMap[item.type]}は${item.name}だった！`, "yellow"); } const newShopItems = shopkeeper.shopItems!.filter((_, i) => i !== idx); setEnemies(prev => prev.map(e => e.id === shopkeeper.id ? { ...e, shopItems: newShopItems } : e)); addLog(`${getItemName(item)}を買った！`); audioService.playSound('buff'); if (newShopItems.length === 0) setShopState(prev => ({ ...prev, active: false })); else setSelectedItemIndex(prev => Math.min(prev, newShopItems.length - 1)); } else addLog("いっぱい！");
          } else addLog("お金が足りない！");
      } else {
          const item = inventory[idx]; if (!item) return;
          if (player.equipment?.weapon === item || player.equipment?.armor === item || player.equipment?.ranged === item || player.equipment?.accessory === item) { addLog("装備中は売れません。"); return; }
          const sellPrice = Math.max(1, Math.floor((item.value || 100) / 2)); setPlayer(p => ({ ...p, gold: (p.gold || 0) + sellPrice })); setInventory(prev => prev.filter((_, i) => i !== idx)); addLog(`${getItemName(item)}を売った。`); audioService.playSound('select'); setSelectedItemIndex(prev => Math.max(0, Math.min(prev, inventory.length - 2)));
      }
  };

  const triggerPlayerAttackAnim = (dir: Direction) => { setPlayer(p => ({ ...p, offset: { x: dir.x * 6, y: dir.y * 6 } })); setTimeout(() => setPlayer(p => ({ ...p, offset: { x: 0, y: 0 } })), 100); };

  const attackEnemy = (target: Entity) => {
      triggerPlayerAttackAnim(player.dir); const targets = [target]; addVisualEffect('SLASH', target.x, target.y, { dir: player.dir });
      if (player.equipment?.weapon?.type === 'PROTRACTOR_EDGE') { const {x: dx, y: dy} = player.dir; const offsets = dx===0? [{x:-1,y:dy},{x:1,y:dy}] : [{x:dx,y:-1},{x:dx,y:1}]; offsets.forEach(o => { const tx = player.x + o.x; const ty = player.y + o.y; addVisualEffect('SLASH', tx, ty, { dir: o as Direction }); const t = enemies.find(e => e.x === tx && e.y === ty); if (t) targets.push(t); }); }
      let newEnemies = [...enemies];
      targets.forEach(t => { let dmg = Math.max(1, player.attack - t.defense); newEnemies = newEnemies.map(e => { if (e.id === t.id) { const nhp = e.hp - dmg; addLog(`${e.name}に${dmg}ダメ！`); addVisualEffect('TEXT', e.x, e.y, { value: `${dmg}`, color: 'white' }); return { ...e, hp: nhp }; } return e; }); });
      const deads = newEnemies.filter(e => e.hp <= 0); deads.forEach(d => { if (d.enemyType === 'BOSS') { setGameClear(true); audioService.playSound('win'); saveDungeonScore("Cleared"); storageService.clearDungeonState2(); } else { addLog(`${d.name}撃破！`); gainXp(d.xp); } });
      setEnemies(newEnemies.filter(e => e.hp > 0)); audioService.playSound('attack');
  };

  const handlePressStart = () => { if (menuOpen || shopState.active || gameOver || gameClear) return; fastForwardInterval.current = setTimeout(() => setIsFastForwarding(true), 400); };
  const handlePressEnd = (e?: React.TouchEvent | React.MouseEvent) => { if (e) e.preventDefault(); if (fastForwardInterval.current) { clearTimeout(fastForwardInterval.current); fastForwardInterval.current = null; } if (!isFastForwarding) handleActionBtnClick(); else setIsFastForwarding(false); };

  useEffect(() => {
      let interval: any = null;
      if (isFastForwarding && !gameOver && !gameClear && !menuOpen && !shopState.active) { interval = setInterval(() => { if (enemies.some(e => Math.abs(e.x - player.x) <= 2 && Math.abs(e.y - player.y) <= 2) || belly <= 0 || player.hp === player.maxHp) { setIsFastForwarding(false); return; } processTurn(player.x, player.y); }, 50); }
      return () => { if (interval) clearInterval(interval); };
  }, [isFastForwarding, enemies, player.hp, belly, gameOver, gameClear]);

  const toggleMenu = () => { if (shopState.active) { setShopState(prev => ({ ...prev, active: false })); return; } if (menuOpen) { setMenuOpen(false); setSynthState({ active: false, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); } else { setMenuOpen(true); setSelectedItemIndex(0); } audioService.playSound('select'); };
  const startEndlessMode = () => { setIsEndless(true); setGameClear(false); setFloor(f => f + 1); generateFloor(floor + 1); addLog("エンドレス開始！"); };

  const handleSynthesisStep = () => {
      const idx = synthState.mode === 'BLANK' ? blankScrollSelectionIndex : selectedItemIndex; const item = inventory[idx];
      if (synthState.mode === 'BLANK' && synthState.step === 'SELECT_EFFECT') {
          const knownTypes = Array.from(identifiedTypes).filter((t: any) => (t as string).startsWith('SCROLL')) as string[];
          const targetType = knownTypes[idx]; const template = ITEM_DB[targetType];
          if (template) { const blankIdx = synthState.baseIndex!; const newItem = { ...template, id: `scribed-${Date.now()}` }; const newInv = [...inventory]; newInv[blankIdx] = newItem; setInventory(newInv); addLog("名前を書き込んだ！"); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y); }
          return;
      }
      if (synthState.step === 'SELECT_BASE') {
          if (synthState.mode === 'SYNTH') { if (['WEAPON', 'ARMOR'].includes(item.category)) { setSynthState({ ...synthState, step: 'SELECT_MAT', baseIndex: idx }); addLog("素材を選んでね"); audioService.playSound('select'); } else addLog("ベース不可"); } 
          else if (synthState.mode === 'CHANGE') { setSynthState({ ...synthState, step: 'SELECT_TARGET', baseIndex: idx }); addLog("変えるアイテムを選んでね"); }
      } else if (synthState.step === 'SELECT_MAT') {
          const baseIdx = synthState.baseIndex!; const matItem = item; if (inventory[baseIdx].category !== matItem.category) { addLog("種類不一致"); return; }
          const newPlus = (inventory[baseIdx].plus || 0) + (matItem.plus || 0) + 1; const newItem = { ...inventory[baseIdx], plus: newPlus, name: `${inventory[baseIdx].name.split('+')[0]}+${newPlus}` };
          const glueIdx = inventory.findIndex(i => i.type === 'POT_GLUE'); let newInv = inventory.map((it, i) => i === baseIdx ? newItem : it).filter((_, i) => i !== idx && i !== glueIdx);
          setInventory(newInv); addLog(`合成！${newItem.name}！`); audioService.playSound('buff'); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y);
      } else if (synthState.step === 'SELECT_TARGET') {
          const potIdx = synthState.baseIndex!; const keys = Object.keys(ITEM_DB); const key = keys[Math.floor(Math.random() * keys.length)]; const template = ITEM_DB[key]; const newItem = { ...template, id: `changed-${Date.now()}`, plus: 0 };
          let newInv = inventory.map((it, i) => i === idx ? newItem : it).filter((_, i) => i !== potIdx);
          setInventory(newInv); addLog(`変化！${newItem.name}！`); audioService.playSound('buff'); setSynthState({ ...synthState, active: false }); setMenuOpen(false); processTurn(player.x, player.y);
      }
  };

  const executeStaffEffect = (item: Item, target: Entity | null, x: number, y: number): { hit: boolean, msg?: string } => {
      let hit = false; let msg = ""; addVisualEffect('MAGIC_PROJ', 0, 0, { startX: player.x, startY: player.y, targetX: target ? target.x : x, targetY: target ? target.y : y, duration: 5, maxDuration: 5 });
      if (item.type === 'UMB_FIRE') { addVisualEffect('BEAM', x, y, { color: 'red' }); if (target) { const dmg = 20; target.hp -= dmg; if (target.hp <= 0) { gainXp(target.xp); msg = `${target.name}を焼却！`; } else msg = `${target.name}に${dmg}ダメ！`; hit = true; } } 
      else if (item.type === 'UMB_THUNDER') { addVisualEffect('THUNDER', x, y); if (target) { const dmg = 25; target.hp -= dmg; if (target.hp <= 0) { gainXp(target.xp); msg = `${target.name}に落雷！`; } else msg = `${target.name}に${dmg}ダメ！`; hit = true; } } 
      else if (item.type === 'UMB_SLEEP') { if (target) { target.status.sleep = 10; msg = `${target.name}は眠った。`; hit = true; } } 
      else if (item.type === 'UMB_WARP') { if (target) { for(let i=0; i<20; i++) { const rx = Math.floor(Math.random()*MAP_W); const ry = Math.floor(Math.random()*MAP_H); if (map[ry][rx] === 'FLOOR' && !enemies.find(e => e.x === rx && e.y === ry)) { target.x = rx; target.y = ry; msg = `${target.name}は消えた。`; hit = true; break; } } } }
      else if (item.type === 'UMB_HEAL') { if (target) { target.hp = target.maxHp; msg = `${target.name}が全快！`; hit = true; } }
      setEnemies(prev => prev.filter(e => e.hp > 0)); return { hit, msg };
  };

  const handleThrowItem = (index: number) => {
      const item = inventory[index]; if (!item) return; const { x: dx, y: dy } = player.dir; let lx = player.x, ly = player.y; let hitEntity: Entity | null = null;
      for (let i=1; i<=10; i++) { const tx = player.x + dx * i; const ty = player.y + dy * i; lx = tx; ly = ty; if (map[ty][tx] === 'WALL') break; const target = enemies.find(e => e.x === tx && e.y === ty); if (target) { hitEntity = target; break; } }
      addVisualEffect('PROJECTILE', lx, ly, { dir: player.dir, duration: 10 }); setInventory(prev => prev.filter((_, i) => i !== index));
      if (hitEntity) { if (item.category === 'STAFF') { const res = executeStaffEffect(item, hitEntity, hitEntity.x, hitEntity.y); if (res.msg) addLog(res.msg); } else { let dmg = 10 + (item.power || 0); hitEntity.hp -= dmg; if(hitEntity.hp <= 0) { gainXp(hitEntity.xp); addLog(`${hitEntity.name}撃破！`); } else addLog(`${hitEntity.name}に${dmg}ダメ！`); } setEnemies(prev => prev.filter(e => e.hp > 0)); audioService.playSound('attack'); } 
      else if (map[ly][lx] !== 'WALL' && !floorItems.find(i=>i.x===lx && i.y===ly)) setFloorItems(prev => [...prev, { id: Date.now()+Math.random(), type: 'ITEM', x: lx, y: ly, char: '!', name: item.name, hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 }, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: item }]);
      setMenuOpen(false); processTurn(player.x, player.y);
  };

  const handleDropItem = (index: number) => {
      const item = inventory[index]; if (!item) return; const newInv = inventory.filter((_, i) => i !== index); setInventory(newInv);
      setFloorItems(prev => [...prev, { id: Date.now()+Math.random(), type: 'ITEM', x: player.x, y: player.y, char: '!', name: item.name, hp: 0, maxHp: 0, baseAttack: 0, baseDefense: 0, attack: 0, defense: 0, xp: 0, dir: { x: 0, y: 0 }, status: { sleep: 0, confused: 0, frozen: 0, blind: 0, speed: 0, poison: 0, trapSight: 0 }, itemData: item }]);
      addLog(`${item.name}を置いた。`); audioService.playSound('select'); setMenuOpen(false);
  };

  const handleUnequip = (slot: 'weapon'|'armor'|'ranged'|'accessory') => {
      const item = player.equipment?.[slot]; if (item) { if (inventory.length < MAX_INVENTORY) { setPlayer(p => ({ ...p, equipment: { ...p.equipment!, [slot]: null } })); setInventory(prev => [...prev, item]); addLog(`${item.name}を外した。`); processTurn(player.x, player.y); } else addLog("いっぱい！"); }
  };

  const handleItemAction = (index: number) => {
      const item = inventory[index]; if (!item) return;
      if (item.category === 'DECK_CARD') { const cardTemplate = DUNGEON_CARD_DB.find(t => t.templateId === item.type); if (cardTemplate) { setDungeonDeck(prev => [...prev, { ...cardTemplate, id: `card-${Date.now()}` }]); setInventory(prev => prev.filter((_, i) => i !== index)); addLog(`${item.name}をデッキに加えた！`); setMenuOpen(false); processTurn(player.x, player.y); audioService.playSound('buff'); } return; }
      if (item.category === 'STAFF') { 
          const {x:dx,y:dy} = player.dir; let target=null; let tx=player.x, ty=player.y; for(let i=1; i<=10; i++){ tx+=dx; ty+=dy; if(map[ty][tx]==='WALL') break; const e=enemies.find(en=>en.x===tx&&en.y===ty); if(e){ target=e; break; } }
          if((item.charges||0)>0){ const res=executeStaffEffect(item, target, tx, ty); if(res.msg) addLog(res.msg); const newItem={...item, charges: (item.charges||0)-1}; setInventory(prev => prev.map((it, i) => i === index ? newItem : it)); if(!identifiedTypes.has(item.type)){ setIdentifiedTypes(prev => new Set(prev).add(item.type)); addLog(`${idMap[item.type]}は${item.name}だった！`); } audioService.playSound('buff'); setMenuOpen(false); processTurn(player.x, player.y); } return;
      }
      if (item.type === 'POT_GLUE') { setSynthState({ active: true, mode: 'SYNTH', step: 'SELECT_BASE', baseIndex: null }); addLog("ベース装備を選択"); return; }
      if (item.category === 'WEAPON' || item.category === 'ARMOR' || item.category === 'ACCESSORY') { setPlayer(p => { let slot: keyof EquipmentSlots = 'weapon'; if(item.category==='ARMOR') slot='armor'; if(item.category==='ACCESSORY') slot='accessory'; const current = p.equipment![slot]; const newInv = inventory.filter((_, i) => i !== index); if(current) newInv.push(current); setInventory(newInv); addLog(`${item.name}装備。`); return { ...p, equipment: { ...p.equipment!, [slot]: item } }; }); setMenuOpen(false); processTurn(player.x, player.y); audioService.playSound('select'); return; }
      if (item.category === 'CONSUMABLE') {
          if (item.type.includes('ONIGIRI')) { setBelly(prev => Math.min(maxBelly, prev+50)); setInventory(prev => prev.filter((_, i) => i !== index)); addLog("おにぎり美味い！"); setMenuOpen(false); processTurn(player.x, player.y); return; }
          if (item.type === 'GRASS_HEAL') { setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp+50)})); setInventory(prev => prev.filter((_, i) => i !== index)); addLog("HP回復。"); setMenuOpen(false); processTurn(player.x, player.y); return; }
          addLog(`${item.name}を使った。`); setInventory(prev => prev.filter((_, i) => i !== index)); setMenuOpen(false); processTurn(player.x, player.y);
      }
  };

  const handleCardRemoval = (cardId: string) => {
      if (player.gold < 100) { addLog("お金が足りません！"); return; }
      setDungeonDeck(prev => prev.filter(c => c.id !== cardId)); setPlayer(p => ({ ...p, gold: p.gold - 100 }));
      setShopRemovedThisFloor(true); addLog("カードを除外しました。"); setShowDeck(false); setDeckViewMode('VIEW');
  };

  const handleCardUse = (index: number) => {
      if (menuOpen || shopState.active || gameOver || gameClear) return;
      const card = dungeonHand[index]; if (!card) return;
      const { x: dx, y: dy } = player.dir;
      addLog(`${card.name}！`);
      if (card.templateId === 'THRUST') {
          for(let i=1; i<=2; i++) {
              const tx = player.x + dx*i; const ty = player.y + dy*i; if(map[ty][tx]==='WALL') break;
              addVisualEffect('SLASH', tx, ty, { dir: player.dir });
              const target = enemies.find(e => e.x === tx && e.y === ty);
              if (target) { target.hp -= (card.power + player.attack); if(target.hp<=0) gainXp(target.xp); addVisualEffect('TEXT', tx, ty, {value: card.power+player.attack}); }
          }
      } else if (card.templateId === 'SPIN') {
          for(let ry=-1; ry<=1; ry++) { for(let rx=-1; rx<=1; rx++) { if(rx===0&&ry===0)continue; const tx=player.x+rx, ty=player.y+ry; addVisualEffect('SLASH', tx, ty); const target=enemies.find(e=>e.x===tx&&e.y===ty); if(target) { target.hp -= (card.power+player.attack); if(target.hp<=0) gainXp(target.xp); addVisualEffect('TEXT', tx, ty, {value: card.power+player.attack}); } } }
      } else if (card.templateId === 'GUARD') {
          setPlayer(p => ({ ...p, status: { ...p.status, defenseBuff: (p.status.defenseBuff || 0) + card.power } }));
          addVisualEffect('TEXT', player.x, player.y, { value: `GUARD+${card.power}`, color: 'blue' });
      }
      setEnemies(prev => prev.filter(e => e.hp > 0));
      const nextHand = dungeonHand.filter((_, i) => i !== index); const nextDiscard = [...dungeonDiscard, card];
      if (nextHand.length === 0) { 
          const shuffled = [...dungeonDeck, ...nextDiscard].sort(() => Math.random()-0.5);
          setDungeonHand(shuffled.splice(0, 3)); setDungeonDeck(shuffled); setDungeonDiscard([]);
      } else setDungeonHand(nextHand); setDungeonDiscard(nextDiscard);
      audioService.playSound('attack'); processTurn(player.x, player.y);
  };

  const handleMoveInputManual = (dx: 0|1|-1, dy: 0|1|-1) => { movePlayer(dx, dy); };

  const getInspectedDescription = (item: Item) => { if (item.category === 'STAFF' && !identifiedTypes.has(item.type)) return "振ってみるまで分からない。"; return item.desc; };

  const renderGame = () => {
      const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx || !map.length) return;
      const ts = TILE_SIZE * SCALE; const { C0, C1, C2, C3 } = currentTheme.colors;
      ctx.fillStyle = C0; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (shake.current.duration > 0) { ctx.translate((Math.random()-0.5)*4, (Math.random()-0.5)*4); shake.current.duration--; }
      const startX = player.x - Math.floor(VIEW_W/2); const startY = player.y - Math.floor(VIEW_H/2);
      const hasSight = player.equipment?.accessory?.type === 'RING_SIGHT'; const hasTrapSight = (player.equipment?.accessory?.type === 'RING_TRAP') || (player.status.trapSight && player.status.trapSight > 0);
      for (let y = 0; y < VIEW_H; y++) {
          for (let x = 0; x < VIEW_W; x++) {
              const mx = startX + x; const my = startY + y; const sx = x * ts; const sy = y * ts;
              if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) continue;
              const isRevealed = floorMapRevealed || (visitedMap[my] && visitedMap[my][mx]);
              if (isRevealed) {
                  if (map[my][mx] === 'WALL') { ctx.fillStyle = C1; ctx.fillRect(sx, sy, ts, ts); ctx.fillStyle = C0; ctx.fillRect(sx+ts/4, sy+ts/4, ts/2, ts/2); } 
                  else { ctx.fillStyle = C3; ctx.fillRect(sx, sy, ts, ts); if (map[my][mx] === 'STAIRS') { ctx.fillStyle = C1; for(let i=0; i<3; i++) ctx.fillRect(sx, sy + i*(ts/3), ts, 2); } }
                  const trap = traps.find(t => t.x === mx && t.y === my); if (trap && (trap.visible || hasTrapSight)) { const spr = spriteCache.current['TRAP']; if (spr) ctx.drawImage(spr, sx, sy, ts, ts); }
              }
              if (isRevealed || hasSight) {
                  const itm = floorItems.find(i => i.x === mx && i.y === my);
                  if (itm) { let sk = 'CONSUMABLE'; if (itm.type === 'GOLD') sk = 'GOLD_BAG'; else if (itm.itemData) { const cat = itm.itemData.category; if (cat === 'WEAPON') sk = 'WEAPON'; if (cat === 'ARMOR') sk = 'ARMOR'; if (cat === 'RANGED') sk = 'RANGED'; if (cat === 'STAFF') sk = 'STAFF'; if (cat === 'ACCESSORY') sk = 'ACCESSORY'; if (cat === 'DECK_CARD') sk = 'DECK_CARD'; } const spr = spriteCache.current[sk]; if (spr) ctx.drawImage(spr, sx, sy, ts, ts); }
                  const en = enemies.find(e => e.x === mx && e.y === my);
                  if (en) { const spr = spriteCache.current[en.enemyType || 'SLIME']; if (spr) { if (en.status.sleep > 0) ctx.globalAlpha = 0.5; ctx.drawImage(spr, sx+(en.offset?.x||0)*SCALE, sy+(en.offset?.y||0)*SCALE, ts, ts); ctx.globalAlpha = 1.0; } }
              }
              if (mx === player.x && my === player.y) { let sk = 'PLAYER_FRONT'; if (player.dir.y === -1) sk = 'PLAYER_BACK'; else if (player.dir.x !== 0) sk = 'PLAYER_SIDE'; const spr = spriteCache.current[sk]; if (spr) { if (player.dir.x === -1) { ctx.save(); ctx.translate(sx + ts + (player.offset?.x||0)*SCALE, sy + (player.offset?.y||0)*SCALE); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0, ts, ts); ctx.restore(); } else ctx.drawImage(spr, sx + (player.offset?.x||0)*SCALE, sy + (player.offset?.y||0)*SCALE, ts, ts); } }
          }
      }
      visualEffects.current.forEach(fx => {
          fx.duration--; const sx = (fx.x - startX) * ts; const sy = (fx.y - startY) * ts;
          if (fx.type === 'FLASH') { ctx.fillStyle = 'white'; ctx.globalAlpha = fx.duration/15; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.globalAlpha=1; }
          else if (fx.type === 'SLASH') { ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.beginPath(); const d = fx.dir || {x:1, y:0}; const cx = sx+ts/2; const cy = sy+ts/2; ctx.moveTo(cx-d.y*10-d.x*10, cy-d.x*10+d.y*10); ctx.lineTo(cx+d.y*10+d.x*10, cy+d.x*10-d.y*10); ctx.stroke(); }
          else if (fx.type === 'TEXT') { ctx.fillStyle = fx.color || 'white'; ctx.font = 'bold 16px monospace'; ctx.strokeText(fx.value||'', sx+ts/2, sy+ts-fx.duration); ctx.fillText(fx.value||'', sx+ts/2, sy+ts-fx.duration); }
      });
      visualEffects.current = visualEffects.current.filter(fx => fx.duration > 0); ctx.restore();
  };

  useEffect(() => { const loop = setInterval(renderGame, 50); return () => clearInterval(loop); }, [map, player, enemies, floorItems, traps, menuOpen, visitedMap, floorMapRevealed, currentTheme]);

  const { C0, C1, C2, C3 } = currentTheme.colors;

  return (
    <div className="w-full h-full bg-[#101010] flex flex-col md:flex-row items-center md:items-stretch justify-center font-mono select-none overflow-hidden touch-none relative p-2 md:p-4 gap-2 md:gap-4">
        {inspectedItem && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setInspectedItem(null)}>
                <div className="w-full max-w-xs border-4 p-4 shadow-xl" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-2 border-b-2 pb-1" style={{ borderColor: C1 }}>
                        <h3 className="font-bold text-lg">{getItemName(inspectedItem)} {inspectedItem.plus ? `+${inspectedItem.plus}` : ''} {inspectedItem.count ? `(${inspectedItem.count})` : ''} {inspectedItem.category === 'STAFF' ? `[${inspectedItem.charges}]` : ''}</h3>
                        <button onClick={(e) => { e.stopPropagation(); setInspectedItem(null); }}><X size={20}/></button>
                    </div>
                    <div className="text-sm mb-4 min-h-[3rem]">{getInspectedDescription(inspectedItem)}</div>
                    <div className="text-xs font-bold grid grid-cols-2 gap-2">
                        <div>分類: {inspectedItem.category}</div>
                        {inspectedItem.power && ( <div> {inspectedItem.category === 'ARMOR' ? '防御' : '威力'}: {inspectedItem.power + (inspectedItem.plus || 0)} {inspectedItem.plus ? <span className="text-[9px] font-normal ml-1">({inspectedItem.power}+{inspectedItem.plus})</span> : ''} </div> )}
                        {inspectedItem.value && <div>効果: {inspectedItem.value}</div>}
                    </div>
                </div>
            </div>
        )}
        {showMathChallenge && ( <div className="fixed inset-0 z-[100] w-full h-full pointer-events-auto"> <MathChallengeScreen mode={GameMode.MIXED} onComplete={handleMathComplete} /> </div> )}
        {showDeck && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => { setShowDeck(false); setDeckViewMode('VIEW'); }}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}>
                        <h2 className="font-bold text-xl flex items-center"><Layers className="mr-2"/> デッキ一覧 ({dungeonDeck.length})</h2>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeck(false); setDeckViewMode('VIEW'); }}><X size={24}/></button>
                    </div>
                    {deckViewMode === 'REMOVE' && ( <div className="bg-red-900/50 p-2 mb-4 text-center border-2 border-red-500 rounded text-red-200 font-bold"> 除外するカードを選択してください </div> )}
                    <div className="space-y-2">
                        {dungeonDeck.length === 0 ? ( <div className="text-center text-sm py-4 opacity-50">デッキは空です</div> ) : ( dungeonDeck.map((card) => ( <div key={card.id} className={`border p-2 rounded flex items-center gap-3 ${deckViewMode === 'REMOVE' ? 'cursor-pointer hover:bg-red-500 hover:text-white' : ''}`} style={{ borderColor: C1 }} onClick={(e) => { e.stopPropagation(); deckViewMode === 'REMOVE' && handleCardRemoval(card.id); }} > <div className="bg-black/10 p-2 rounded-full border border-current">{card.icon}</div> <div className="flex-grow"> <div className="font-bold flex justify-between"> <span>{card.name}</span> <span className="text-xs opacity-70 font-normal">{card.type}</span> </div> <div className="text-xs opacity-80">{card.description} {card.power > 0 && `(Pow:${card.power})`}</div> </div> {deckViewMode === 'REMOVE' && <Trash2 size={16} />} </div> )) )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeck(false); setDeckViewMode('VIEW'); }} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}
        {showStatus && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: `${C0}F2` }} onClick={() => setShowStatus(false)}>
                <div className="w-full max-w-md border-4 p-6 shadow-xl overflow-y-auto max-h-[80vh] custom-scrollbar" style={{ backgroundColor: C3, borderColor: C1, color: C0 }} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: C1 }}>
                        <h2 className="font-bold text-xl flex items-center"><User className="mr-2"/> ステータス</h2>
                        <button onClick={(e) => { e.stopPropagation(); setShowStatus(false); }}><X size={24}/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><span style={{ color: C1 }} className="font-bold">名前:</span> {player.name}</div>
                            <div><span style={{ color: C1 }} className="font-bold">Lv:</span> {level}</div>
                            <div><span style={{ color: C1 }} className="font-bold">HP:</span> {player.hp}/{player.maxHp}</div>
                            <div><span style={{ color: C1 }} className="font-bold">満腹度:</span> {belly}/{maxBelly}</div>
                            <div><span style={{ color: C1 }} className="font-bold">攻撃力:</span> {player.attack}</div>
                            <div><span style={{ color: C1 }} className="font-bold">防御力:</span> {player.defense}</div>
                            <div><span style={{ color: C1 }} className="font-bold">所持金:</span> {player.gold} G</div>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowStatus(false); }} className="mt-6 w-full py-2 font-bold rounded" style={{ backgroundColor: C1, color: C3 }}>閉じる</button>
                </div>
            </div>
        )}
        <div className="hidden md:flex w-64 flex-col items-center justify-center p-4 bg-[#1a1a2a] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0">
            <div className="w-48 h-48 relative flex items-center justify-center">
                <div className="w-16 h-16 bg-[#333] z-10 rounded-sm"></div>
                <div className="absolute top-0 w-16 h-20 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-30" onClick={(e) => handleMoveInputManual(0, -1)}><ArrowUp className="text-[#666]" size={28}/></div>
                <div className="absolute bottom-0 w-16 h-20 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-30" onClick={(e) => handleMoveInputManual(0, 1)}><ArrowDown className="text-[#666]" size={28}/></div>
                <div className="absolute left-0 w-20 h-16 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-30" onClick={(e) => handleMoveInputManual(-1, 0)}><ArrowLeft className="text-[#666]" size={28}/></div>
                <div className="absolute right-0 w-20 h-16 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-30" onClick={(e) => handleMoveInputManual(1, 0)}><ArrowRight className="text-[#666]" size={28}/></div>
                
                {/* Diagonals */}
                <div className="absolute top-2 left-2 w-12 h-12 bg-[#2a2a2a] rounded-tl-xl border-t border-l border-[#333] active:bg-[#111] cursor-pointer z-30" onClick={() => handleMoveInputManual(-1, -1)}></div>
                <div className="absolute top-2 right-2 w-12 h-12 bg-[#2a2a2a] rounded-tr-xl border-t border-r border-[#333] active:bg-[#111] cursor-pointer z-30" onClick={() => handleMoveInputManual(1, -1)}></div>
                <div className="absolute bottom-2 left-2 w-12 h-12 bg-[#2a2a2a] rounded-bl-xl border-b border-l border-[#333] active:bg-[#111] cursor-pointer z-30" onClick={() => handleMoveInputManual(-1, 1)}></div>
                <div className="absolute bottom-2 right-2 w-12 h-12 bg-[#2a2a2a] rounded-br-xl border-b border-r border-[#333] active:bg-[#111] cursor-pointer z-30" onClick={() => handleMoveInputManual(1, 1)}></div>
                
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 min-h-0">
            <div className="w-full aspect-[11/9] md:aspect-auto md:flex-1 relative shrink-0">
                <div className="w-full h-full border-4 relative overflow-hidden shadow-lg rounded-sm" style={{ backgroundColor: C3, borderColor: C0 }}>
                    <div className="absolute top-0 left-0 w-full h-8 flex justify-between items-center px-2 text-[10px] z-10 border-b" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>
                        <span className="font-bold tracking-widest">{currentTheme.name}</span>
                        <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><MapIcon size={10}/> Map</button>
                            <button onClick={(e) => { e.stopPropagation(); setShowStatus(true); }} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><User size={10}/> Sts</button>
                            <button onClick={(e) => { e.stopPropagation(); setDeckViewMode('VIEW'); setShowDeck(true); }} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><Layers size={10}/> Deck</button>
                            <button onClick={(e) => { e.stopPropagation(); setShowHelp(true); }} className="flex items-center gap-1 hover:text-white border px-1 rounded" style={{ borderColor: C3 }}><HelpCircle size={10}/> Help</button>
                        </div>
                    </div>
                    <div className="absolute top-8 left-0 w-full h-5 flex justify-between items-center px-2 text-xs font-bold z-10" style={{ backgroundColor: C1, color: C3 }}>
                        <span>{floor}F</span> <span>Lv{level}</span> <span>HP{player.hp}/{player.maxHp}</span> <span>A{player.attack}D{player.defense}</span> <span className="flex items-center"><Coins size={10} className="mr-0.5"/>{player.gold}</span> <span>🍙{belly}%</span>
                    </div>
                    <canvas ref={canvasRef} width={VIEW_W * TILE_SIZE * SCALE} height={VIEW_H * TILE_SIZE * SCALE} className="w-full h-full object-contain pixel-art mt-6" style={{ imageRendering: 'pixelated' }} />
                    {shopState.active && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                            <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}> <h3 className="font-bold flex items-center"><ShoppingBag size={12} className="mr-1"/> 購買部</h3> <button onClick={(e) => { e.stopPropagation(); setShopState(prev => ({...prev, active: false})); }}><X size={12}/></button> </div>
                            <div className="flex gap-2 mb-2"> <button className={`flex-1 py-1 text-center border`} style={{ borderColor: C3, backgroundColor: shopState.mode === 'BUY' ? C3 : 'transparent', color: shopState.mode === 'BUY' ? C0 : C3 }} onClick={(e) => { e.stopPropagation(); setShopState(prev => ({ ...prev, mode: 'BUY' })); setSelectedItemIndex(0); }} > 買う </button> <button className={`flex-1 py-1 text-center border`} style={{ borderColor: C3, backgroundColor: shopState.mode === 'SELL' ? C3 : 'transparent', color: shopState.mode === 'SELL' ? C0 : C3 }} onClick={(e) => { e.stopPropagation(); setShopState(prev => ({ ...prev, mode: 'SELL' })); setSelectedItemIndex(0); }} > 売る </button> </div>
                            <div className="flex justify-end mb-2 border-b pb-1" style={{ borderColor: C1 }}> <span className="flex items-center"><Coins size={10} className="mr-1"/> {player.gold} G</span> </div>
                            <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                {shopState.mode === 'BUY' ? (
                                    enemies.find(e => e.id === shopState.merchantId)?.shopItems?.map((item, i) => (
                                        <div key={i} className="flex items-center border" style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onPointerDown={(e) => { e.stopPropagation(); setSelectedItemIndex(i); }}>
                                            <button className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center" onClick={(e) => { e.stopPropagation(); handleShopAction(i); }}>
                                                <span>{getItemName(item)}</span> <span>{item.price} G</span>
                                            </button>
                                            <button className="px-2 py-1 border-l" style={{ borderColor: C1 }} onPointerDown={(e) => { e.stopPropagation(); setInspectedItem(item); }}><Info size={10} /></button>
                                        </div>
                                    ))
                                ) : (
                                    inventory.map((item, i) => (
                                        <div key={i} className="flex items-center border" style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onPointerDown={(e) => { e.stopPropagation(); setSelectedItemIndex(i); }}>
                                            <button className="flex-grow text-left px-2 py-1 cursor-pointer flex justify-between items-center" onClick={(e) => { e.stopPropagation(); handleShopAction(i); }}>
                                                <span>{getItemName(item)}</span> <span>{Math.floor((item.price || (item.value || 100)) / 2)} G</span>
                                            </button>
                                            <button className="px-2 py-1 border-l" style={{ borderColor: C1 }} onPointerDown={(e) => { e.stopPropagation(); setInspectedItem(item); }}><Info size={10} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    {menuOpen && (
                        <div className="absolute right-0 top-0 bottom-0 w-3/4 border-l-2 z-30 p-2 text-xs flex flex-col" style={{ backgroundColor: C0, borderColor: C3, color: C3 }}>
                            <div className="flex justify-between items-center border-b mb-2 pb-1" style={{ borderColor: C3 }}> <h3 className="font-bold"> {synthState.active ? '選択してね' : `MOCHIMONO (${inventory.length}/${MAX_INVENTORY})` } </h3> <button onClick={(e) => { e.stopPropagation(); toggleMenu(); }}><X size={12}/></button> </div>
                            <div ref={menuListRef} className="flex flex-col gap-1 overflow-y-auto flex-grow custom-scrollbar relative">
                                {inventory.map((item, i) => (
                                    <div key={i} className={`flex items-center border`} style={{ borderColor: selectedItemIndex === i ? C3 : 'transparent', backgroundColor: selectedItemIndex === i ? C2 : 'transparent', color: selectedItemIndex === i ? C0 : C3 }} onPointerDown={(e) => { e.stopPropagation(); setSelectedItemIndex(i); }}>
                                        <button className="flex-grow text-left px-2 py-2 cursor-pointer flex justify-between items-center min-h-[32px]" onClick={(e) => { e.stopPropagation(); if(synthState.active) handleSynthesisStep(); else handleItemAction(i); }}>
                                            <span>{getItemName(item)} {item.plus ? `+${item.plus}` : ''}</span>
                                            <span className="text-[9px]" style={{ color: selectedItemIndex === i ? C0 : C2 }}>{synthState.active ? '選択' : '使う'}</span>
                                        </button>
                                        {!synthState.active && (
                                            <>
                                                <button className="p-2 border-l" style={{ borderColor: C1 }} onPointerDown={(e) => { e.stopPropagation(); handleThrowItem(i); }}><Send size={12} /></button>
                                                <button className="p-2 border-l" style={{ borderColor: C1 }} onPointerDown={(e) => { e.stopPropagation(); handleDropItem(i); }}><ArrowDown size={12} /></button>
                                            </>
                                        )}
                                        <button className="p-2 border-l" style={{ borderColor: C1 }} onPointerDown={(e) => { e.stopPropagation(); setInspectedItem(item); }}><Info size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full h-24 p-1 text-[10px] md:text-[12px] md:h-32 mb-2 rounded border-2 font-mono leading-tight flex flex-col justify-end shrink-0 shadow-inner overflow-hidden" style={{ backgroundColor: C0, color: C3, borderColor: C1 }}>
                {logs.slice(-6).map((l) => ( <div key={l.id} style={{ color: l.color || C3 }}>{l.message}</div> ))}
            </div>
        </div>
        <div className="hidden md:flex w-72 flex-col items-center justify-between p-4 bg-[#1a1a2a] border-2 border-[#333] rounded-xl shadow-2xl relative shrink-0 overflow-hidden">
            <div className="flex flex-col items-center gap-8 w-full mt-2">
                <div className="flex flex-col items-center group"> <button className="w-12 h-12 bg-[#333] rounded-full shadow-[0_4px_0_#111] active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" onClick={(e) => { e.stopPropagation(); fireRangedWeapon(); }} > <Crosshair size={24}/> </button> </div>
                <div className="flex flex-col items-center group"> <button className="w-16 h-16 bg-[#8b0000] rounded-full shadow-[0_6px_0_#500000] active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000] text-2xl" onClick={(e) => { e.stopPropagation(); toggleMenu(); }}>B</button> </div>
                <div className="flex flex-col items-center group"> <button className="w-16 h-16 bg-[#ff0000] rounded-full shadow-[0_6px_0_#8b0000] active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000] text-2xl" onPointerDown={handlePressStart} onPointerUp={handlePressEnd} > A </button> </div>
            </div>
            <div className="w-full flex flex-col gap-1.5 mt-4 p-2 bg-black/40 rounded-lg border border-[#333]">
                <div className="text-[10px] text-gray-500 font-bold mb-1 flex items-center justify-between"> <span>CARDS HAND</span> <span className="text-gray-600">Deck:{dungeonDeck.length}</span> </div>
                <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-48 custom-scrollbar p-1">
                    {dungeonHand.map((card, i) => ( <button key={card.id} className="h-20 bg-[#2a2a2a] border-2 border-[#555] rounded flex flex-col items-center justify-start text-white shadow-lg hover:bg-[#333] p-1 overflow-hidden" onClick={(e) => { e.stopPropagation(); handleCardUse(i); }} > <div className={`w-full text-[6px] font-bold px-1 rounded-t mb-0.5 text-center ${card.type === 'ATTACK' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}> {card.type[0]} </div> <div className="mb-0.5 scale-75">{card.icon}</div> <div className="text-[7px] font-bold text-center leading-tight truncate w-full">{card.name}</div> </button> ))}
                </div>
            </div>
            <button onClick={handleQuit} className="w-full text-[#555] border border-[#333] py-2 rounded bg-[#222] text-xs font-bold"> <LogOut size={14} className="inline mr-2"/> QUIT GAME </button>
        </div>
        <div className="md:hidden w-full max-w-md h-[240px] relative rounded-t-xl border-t-2 border-[#333] bg-[#1a1a2a] shrink-0">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center">
                <div className="w-10 h-10 bg-[#333] z-10"></div>
                <div className="absolute top-0 w-10 h-16 bg-[#333] rounded-t-md border-t border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center pt-2 z-30" onClick={(e) => handleMoveInputManual(0, -1)}><ArrowUp className="text-[#666]" size={20}/></div>
                <div className="absolute bottom-0 w-10 h-16 bg-[#333] rounded-b-md border-b border-l border-r border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex justify-center items-end pb-2 z-30" onClick={(e) => handleMoveInputManual(0, 1)}><ArrowDown className="text-[#666]" size={20}/></div>
                <div className="absolute left-0 w-16 h-10 bg-[#333] rounded-l-md border-l border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center pl-2 z-30" onClick={(e) => handleMoveInputManual(-1, 0)}><ArrowLeft className="text-[#666]" size={20}/></div>
                <div className="absolute right-0 w-16 h-10 bg-[#333] rounded-r-md border-r border-t border-b border-[#444] shadow-lg active:bg-[#222] cursor-pointer flex items-center justify-end pr-2 z-30" onClick={(e) => handleMoveInputManual(1, 0)}><ArrowRight className="text-[#666]" size={20}/></div>
                
                {/* Diagonals */}
                <div className="absolute top-0 left-0 w-10 h-10 bg-[#333] rounded-tl-xl border-t border-l border-[#444] active:bg-[#222] cursor-pointer z-30" onClick={() => handleMoveInputManual(-1, -1)}></div>
                <div className="absolute top-0 right-0 w-10 h-10 bg-[#333] rounded-tr-xl border-t border-r border-[#444] active:bg-[#222] cursor-pointer z-30" onClick={() => handleMoveInputManual(1, -1)}></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#333] rounded-bl-xl border-b border-l border-[#444] active:bg-[#222] cursor-pointer z-30" onClick={() => handleMoveInputManual(-1, 1)}></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#333] rounded-br-xl border-b border-r border-[#444] active:bg-[#222] cursor-pointer z-30" onClick={() => handleMoveInputManual(1, 1)}></div>
                
                <div className="absolute w-8 h-8 bg-[#2a2a2a] rounded-full z-20 shadow-inner"></div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 flex flex-col items-center justify-end pb-3 pr-2 gap-2">
                <div className="self-end mr-4 mb-2"> <button className="w-10 h-10 bg-[#333] rounded-full shadow-[0_2px_0_#111] active:translate-y-1 transition-all flex items-center justify-center text-white border border-[#555]" onClick={(e) => { e.stopPropagation(); fireRangedWeapon(); }}><Crosshair size={18}/></button> </div>
                <div className="flex gap-4 transform -rotate-6 mb-1 scale-95">
                    <div className="flex flex-col items-center group"> <button className="w-14 h-14 bg-[#8b0000] rounded-full shadow-[0_4px_0_#500000] active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#a00000]" onClick={(e) => { e.preventDefault(); toggleMenu(); }}>B</button> <span className="text-[#666] text-[10px] font-bold mt-1">MENU</span> </div>
                    <div className="flex flex-col items-center group"> <button className="w-14 h-14 bg-[#ff0000] rounded-full shadow-[0_4px_0_#8b0000] active:translate-y-1 transition-all flex items-center justify-center text-[#ffaaaa] font-bold border-2 border-[#cc0000]" onPointerDown={handlePressStart} onPointerUp={handlePressEnd} > A </button> <span className="text-[#666] text-[10px] font-bold mt-1">ACT</span> </div>
                </div>
                <div className="w-full flex items-center justify-center gap-1 overflow-x-auto pb-1">
                    {dungeonHand.map((card, i) => ( <button key={card.id} className="w-11 h-15 bg-[#2a2a2a] border-2 border-[#555] rounded-lg flex flex-col items-center justify-start text-white relative shadow-lg active:scale-95 transition-all p-0.5 overflow-hidden flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleCardUse(i); }} > <div className={`w-full text-[5px] font-bold px-1 rounded-t mb-0.5 text-center ${card.type === 'ATTACK' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}> {card.type[0]} </div> <div className="mb-0.5 p-0.5 bg-black/50 rounded-full scale-[0.6]">{card.icon}</div> <div className="text-[6px] font-bold text-center leading-tight w-full break-words px-0.5">{card.name}</div> </button> ))}
                </div>
            </div>
            <div className="absolute bottom-2 left-4"> <button onClick={handleQuit} className="text-[#555] text-[9px] font-bold border border-[#333] px-2 py-0.5 rounded bg-[#222]">QUIT</button> </div>
        </div>
        {gameOver && ( <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-[80] pointer-events-auto"> <Skull size={80} className="text-red-500 mb-6 animate-bounce" /> <h2 className="text-6xl font-black text-white mb-4 italic">GAME OVER</h2> <button onClick={handleRestart} className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xl hover:bg-gray-200 transition-all" > RETRY </button> </div> )}
    </div>
  );
};

export default SchoolDungeonRPG2;