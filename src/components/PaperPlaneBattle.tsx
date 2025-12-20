
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Wind, Trophy, Zap, Shield, Move, RefreshCw, Layers, Crosshair, Skull, Heart, ChevronsRight, ChevronsLeft, Info, Play, X, Box, Calendar, Hammer, ShoppingBag, Fuel, Palette, Star, Gift, HelpCircle, ArrowRight, Trash2, Settings, Archive, Download, Activity, Radiation, Droplets, Recycle, Repeat, User, Lock, Users, Target, UserPlus, Gauge, Swords, Dice5, Ghost } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';
import { storageService, PaperPlaneProgress } from '../services/storageService';

// --- TYPES & CONSTANTS ---

const MAX_ROWS = 5; // Battle grid height
const SHIP_HEIGHT = 3; // Player ship height (Rows)
const SHIP_WIDTH = 3; // Player ship width (Cols) -> Total 9 slots
const MAX_FUEL = 3;
const FINAL_STAGE_NORMAL = 12;

type EnergyColor = 'WHITE' | 'BLUE' | 'ORANGE';

interface EnergyCard {
    id: string;
    value: number;
    color: EnergyColor;
    isTemporary?: boolean; 
}

interface EnergySlot {
    req: EnergyColor | 'ANY';
    value: number | null;
}

interface ShipPart {
    id: string;
    type: 'CANNON' | 'ENGINE' | 'EMPTY' | 'MISSILE' | 'SHIELD' | 'AMPLIFIER'; 
    name: string;
    description?: string;
    slots: EnergySlot[]; // Multiple slots per part
    multiplier: number; // Effect multiplier per energy
    basePower: number; // Flat bonus when activated (Full slots)
    hp: number; // Part HP (Visual mainly)
    specialEffect?: 'RANK_UP' | 'HEAL' | 'RECYCLE' | 'THORNS'; 
}

interface Talent {
    id: string;
    name: string;
    description: string;
    effectType: 'PASSIVE_POWER' | 'MAX_HP' | 'FUEL' | 'SHOP_DISCOUNT' | 'START_ENERGY';
    value: number;
}

interface Pilot {
    id: string;
    name: string;
    spriteName: string;
    intrinsicTalent: Talent;
}

interface ShipState {
    yOffset: number; // 0 to MAX_ROWS - SHIP_HEIGHT
    hp: number;
    maxHp: number;
    fuel: number;
    maxFuel: number;
    durability: number; // Enemy only: Stun threshold (Defense Value)
    maxDurability: number;
    isStunned: boolean;
    parts: ShipPart[]; // Array of 9 parts (Row-major: 0,1,2 is Row0)
    
    // New Stats
    starCoins: number;
    vacationDays: number;
    passivePower: number; // From Treasures & Talents
    partInventory: ShipPart[]; 
    talents: Talent[]; // Active talents
    
    // Enemy Specific
    enemyConfig?: {
        energyPerTurn: number;
        colors: EnergyColor[];
        moveChance: number;
    };
}

interface EnemyIntent {
    row: number; // Relative to enemy ship
    type: 'ATTACK' | 'BUFF' | 'DEBUFF';
    value: number;
}

interface PoolState {
    genNumbers: number[];
    genColors: EnergyColor[];
    coolNumbers: number[];
    coolColors: EnergyColor[];
}

type GamePhase = 'TUTORIAL' | 'SETUP' | 'BATTLE' | 'REWARD_SELECT' | 'REWARD_EQUIP' | 'VACATION' | 'GAME_OVER' | 'VICTORY' | 'HANGAR';

type VacationEventType = 'REPAIR' | 'PARTS' | 'ENERGY' | 'COIN' | 'TREASURE' | 'FUEL' | 'ENHANCE' | 'UNKNOWN' | 'SHOP' | 'MODIFY' | 'TRAINING' | 'SACRIFICE' | 'GAMBLE';

interface VacationEvent {
    id: string;
    type: VacationEventType;
    name: string;
    description: string;
    cost: number; // Days
    coinCost?: number; // Star Coins (Optional)
    tier: 1 | 2 | 3; // Value tier
    value?: number; // Specific value increment (e.g. max fuel +1)
}

// Clash Animation Types
interface ClashRowData {
    row: number;
    pPower: number;
    ePower: number;
    pShield: number;
    pThorns: number;
    result: 'PLAYER_HIT' | 'ENEMY_HIT' | 'DRAW' | 'NONE';
    damage: number;
}

interface ClashState {
    active: boolean;
    phase: 'INIT' | 'CLASH' | 'IMPACT' | 'DONE';
    data: ClashRowData[];
}

interface ShipTemplate {
    id: string;
    name: string;
    unlockRank: number;
    layout: ShipPart[]; // 9 slots
    description: string;
    baseHp: number;
    color: string;
}

interface EnemyDataTemplate {
    name: string;
    hp: number;
    durability: number;
    layout: string[]; // 9 slots of part types
    energy: number;
    colors: EnergyColor[];
    moveChance: number;
}

// --- DATA ---

const GENERIC_TALENTS: Talent[] = [
    { id: 'T_HEALTH', name: '体力自慢', description: '最大HP+5', effectType: 'MAX_HP', value: 5 },
    { id: 'T_FUEL', name: '省エネ', description: '最大燃料+1', effectType: 'FUEL', value: 1 },
    { id: 'T_BARGAIN', name: '交渉術', description: 'ショップ割引(10%)', effectType: 'SHOP_DISCOUNT', value: 10 },
    { id: 'T_POWER', name: '筋トレ', description: 'パッシブ出力+1', effectType: 'PASSIVE_POWER', value: 1 },
    { id: 'T_ENERGY', name: '準備', description: '開始時エネルギーカード+1', effectType: 'START_ENERGY', value: 1 },
];

const PILOTS: Pilot[] = [
    { id: 'PL_HERO', name: '元気な転校生', spriteName: 'HERO_SIDE|赤', intrinsicTalent: { id: 'IT_GUTS', name: 'ド根性', description: '最大HP+10', effectType: 'MAX_HP', value: 10 } },
    { id: 'PL_NERD', name: 'メカニック', spriteName: 'HUMANOID|緑', intrinsicTalent: { id: 'IT_TUNE', name: 'チューニング', description: 'パッシブ出力+2', effectType: 'PASSIVE_POWER', value: 2 } },
    { id: 'PL_GIRL', name: '委員長', spriteName: 'GIRL|青', intrinsicTalent: { id: 'IT_BUDGET', name: '予算管理', description: 'ショップ割引(20%)', effectType: 'SHOP_DISCOUNT', value: 20 } },
    { id: 'PL_SPORT', name: 'エース', spriteName: 'MUSCLE|橙', intrinsicTalent: { id: 'IT_STAMINA', name: 'スタミナ', description: '最大燃料+2', effectType: 'FUEL', value: 2 } },
    { id: 'PL_SENIOR', name: '謎の上級生', spriteName: 'SENIOR|紫', intrinsicTalent: { id: 'IT_SECRET', name: '裏ルート', description: '開始時エネルギー+2', effectType: 'START_ENERGY', value: 2 } },
];

// Define Ships
const createEmptyPart = (id: string): ShipPart => ({ id, type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 });

const SHIPS: ShipTemplate[] = [
    {
        id: 'SHIP_DEFAULT',
        name: 'チラシ号',
        unlockRank: 0,
        description: 'バランスの良い標準機体。',
        baseHp: 40,
        color: 'bg-emerald-800',
        layout: [
            createEmptyPart('p0'), createEmptyPart('p1'), { id: 'p2', type: 'CANNON', name: '軽量砲', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
            { id: 'p3', type: 'ENGINE', name: '増幅炉', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' }, createEmptyPart('p4'), { id: 'p5', type: 'CANNON', name: '連装砲', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1, basePower: 2, hp: 10 },
            createEmptyPart('p6'), createEmptyPart('p7'), { id: 'p8', type: 'CANNON', name: '軽量砲', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
        ]
    },
    {
        id: 'SHIP_SPEED',
        name: 'テスト用紙号',
        unlockRank: 5,
        description: '青スロットが多い高機動型。',
        baseHp: 30,
        color: 'bg-blue-800',
        layout: [
            createEmptyPart('p0'), { id: 'p1', type: 'MISSILE', name: '誘導弾', slots: [{req:'BLUE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 }, createEmptyPart('p2'),
            { id: 'p3', type: 'ENGINE', name: '高機動', slots: [{req:'BLUE', value:null}], multiplier: 1.2, basePower: 2, hp: 10 }, createEmptyPart('p4'), { id: 'p5', type: 'ENGINE', name: '高機動', slots: [{req:'BLUE', value:null}], multiplier: 1.2, basePower: 2, hp: 10 },
            createEmptyPart('p6'), { id: 'p7', type: 'MISSILE', name: '誘導弾', slots: [{req:'BLUE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 }, createEmptyPart('p8'),
        ]
    },
    {
        id: 'SHIP_POWER',
        name: '画用紙号',
        unlockRank: 10,
        description: '橙スロットが多い重装甲型。',
        baseHp: 50,
        color: 'bg-orange-800',
        layout: [
            { id: 'p0', type: 'CANNON', name: '重砲', slots: [{req:'ORANGE', value:null}], multiplier: 2, basePower: 3, hp: 15 }, createEmptyPart('p1'), createEmptyPart('p2'),
            createEmptyPart('p3'), { id: 'p4', type: 'SHIELD', name: '装甲板', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 5, hp: 20 }, createEmptyPart('p5'),
            { id: 'p6', type: 'CANNON', name: '重砲', slots: [{req:'ORANGE', value:null}], multiplier: 2, basePower: 3, hp: 15 }, createEmptyPart('p7'), createEmptyPart('p8'),
        ]
    }
];

// Enhanced Enemy Data (3x3 Grid + AI params) - ENGINE Removed, replaced with weapons or empty
const ENEMY_DATA: EnemyDataTemplate[] = [
    { 
        name: "折り紙偵察機", hp: 40, durability: 4, 
        layout: ['EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY'], 
        energy: 2, colors: ['WHITE'], moveChance: 0.3 
    },
    { 
        name: "ノート爆撃機", hp: 60, durability: 6, 
        layout: ['CANNON', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY', 'CANNON', 'EMPTY', 'EMPTY'], 
        energy: 3, colors: ['WHITE', 'BLUE'], moveChance: 0.2 
    },
    { 
        name: "定規戦艦", hp: 90, durability: 8, 
        layout: ['CANNON', 'CANNON', 'EMPTY', 'AMPLIFIER', 'CANNON', 'EMPTY', 'CANNON', 'CANNON', 'EMPTY'], 
        energy: 4, colors: ['WHITE'], moveChance: 0.1 
    },
    { 
        name: "コンパス要塞", hp: 120, durability: 12, 
        layout: ['MISSILE', 'CANNON', 'EMPTY', 'CANNON', 'AMPLIFIER', 'CANNON', 'MISSILE', 'EMPTY', 'EMPTY'], 
        energy: 4, colors: ['WHITE', 'BLUE'], moveChance: 0.1 
    },
    { 
        name: "修正液タンク", hp: 180, durability: 20, 
        layout: ['EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'AMPLIFIER', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'], 
        energy: 3, colors: ['WHITE', 'ORANGE'], moveChance: 0.05 
    },
    { 
        name: "カッター迎撃機", hp: 70, durability: 5, 
        layout: ['MISSILE', 'EMPTY', 'MISSILE', 'CANNON', 'CANNON', 'EMPTY', 'MISSILE', 'EMPTY', 'MISSILE'], 
        energy: 5, colors: ['BLUE'], moveChance: 0.6 
    },
    { 
        name: "分度器マザー", hp: 150, durability: 10, 
        layout: ['CANNON', 'AMPLIFIER', 'CANNON', 'EMPTY', 'EMPTY', 'EMPTY', 'CANNON', 'AMPLIFIER', 'CANNON'], 
        energy: 5, colors: ['WHITE', 'BLUE'], moveChance: 0.2 
    },
    { 
        name: "彫刻刀デストロイヤー", hp: 200, durability: 15, 
        layout: ['MISSILE', 'CANNON', 'CANNON', 'AMPLIFIER', 'CANNON', 'AMPLIFIER', 'MISSILE', 'CANNON', 'CANNON'], 
        energy: 6, colors: ['ORANGE', 'WHITE'], moveChance: 0.1 
    },
    { 
        name: "暗黒文房具王", hp: 350, durability: 30, 
        layout: ['MISSILE', 'AMPLIFIER', 'MISSILE', 'AMPLIFIER', 'AMPLIFIER', 'AMPLIFIER', 'MISSILE', 'AMPLIFIER', 'MISSILE'], 
        energy: 7, colors: ['ORANGE', 'BLUE', 'WHITE'], moveChance: 0.3 
    },
];

const VACATION_EVENTS_DB: Omit<VacationEvent, 'id'>[] = [
    { type: 'REPAIR', name: '応急修理', description: 'HPを10回復する。', cost: 1, tier: 1 },
    { type: 'REPAIR', name: 'ドック入り', description: 'HPを全回復し、最大HPを+5する。', cost: 3, tier: 3 },
    { type: 'FUEL', name: '燃料補給', description: '燃料を最大まで回復。', cost: 1, tier: 1 },
    { type: 'FUEL', name: 'タンク増設', description: '最大燃料+1、燃料全回復。', cost: 3, tier: 3, value: 1 },
    { type: 'ENERGY', name: 'エネルギー採掘', description: 'エネルギー生成プールに「6」を追加。', cost: 2, tier: 2 },
    { type: 'ENERGY', name: 'リアクター調整', description: '生成プールに「オレンジ」を追加。', cost: 2, tier: 2 },
    { type: 'PARTS', name: 'パーツ回収', description: 'ランダムなパーツを1つ獲得する。', cost: 2, tier: 2 },
    { type: 'PARTS', name: '軍需物資', description: '高性能なパーツを獲得する。', cost: 4, tier: 3 },
    { type: 'COIN', name: 'アルバイト', description: 'スターコインを50獲得。', cost: 1, tier: 1 },
    { type: 'COIN', name: '臨時ボーナス', description: 'スターコインを150獲得。', cost: 2, tier: 2 },
    { type: 'TREASURE', name: '謎の宝箱', description: '永続的な攻撃力ボーナスを得る。', cost: 3, tier: 3 },
    { type: 'UNKNOWN', name: '謎のイベント', description: '何が起こるかわからない...', cost: 2, tier: 2 },
    { type: 'SHOP', name: '闇市', description: '高品質なパーツを裏ルートで入手する。', cost: 0, coinCost: 150, tier: 3 },
    { type: 'ENHANCE', name: '特別改造', description: '船体を強化。最大HP+20。', cost: 0, coinCost: 100, tier: 2 },
    { type: 'TRAINING', name: '極秘訓練', description: 'パッシブパワー(全出力)+1。', cost: 0, coinCost: 200, tier: 3 },
    { type: 'FUEL', name: 'プレミアム燃料', description: '最大燃料+2、全回復。', cost: 0, coinCost: 80, tier: 2, value: 2 },
    { type: 'SACRIFICE', name: '悪魔の契約', description: '最大燃料を1犠牲にし、全出力を+2する。', cost: 0, tier: 3, value: 2 },
    { type: 'GAMBLE', name: '裏カジノ', description: 'コインを賭ける(100G)。勝てば3倍。', cost: 1, coinCost: 100, tier: 2, value: 300 },
];

const PART_TEMPLATES: Omit<ShipPart, 'id'>[] = [
    { type: 'CANNON', name: 'バスター砲', description: '標準的な威力の大砲。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 3, hp: 10 },
    { type: 'MISSILE', name: '誘導ミサイル', description: '青エネルギーで高出力。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'エネルギー盾', description: '高い防御力を発揮。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '高機動スラスター', description: '回避率と燃料効率が高い。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 10 },
    { type: 'CANNON', name: '波動砲', description: 'オレンジ必須。超高火力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 10, hp: 10 },
    { type: 'ENGINE', name: '増幅炉', description: 'ランク+1のカードを生成する。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' },
    { type: 'CANNON', name: 'バルカン砲', description: '白エネルギーで手軽に連射。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 2, hp: 10 },
    { type: 'CANNON', name: 'レールガン', description: '青エネルギー専用。貫通力重視。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 6, hp: 10 },
    { type: 'MISSILE', name: 'ナパーム弾', description: 'オレンジ専用。広範囲高火力。', slots: [{req:'ORANGE', value:null}], multiplier: 2.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'スパイク装甲', description: '被弾時、防御出力の半分を敵に返す。', slots: [{req:'ANY', value:null}], multiplier: 1.5, basePower: 2, hp: 20, specialEffect: 'THORNS' },
    { type: 'SHIELD', name: 'リペアキット', description: '白エネルギーで効率よく防御。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 4, hp: 10 },
    { type: 'ENGINE', name: 'ソーラー帆', description: '白エネルギーを効率よく変換。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 0, hp: 5 },
    { type: 'ENGINE', name: '核融合炉', description: 'オレンジ専用。莫大な出力(シールド・燃料)。', slots: [{req:'ORANGE', value:null}], multiplier: 4.0, basePower: 6, hp: 15 },
    { type: 'CANNON', name: 'スナイパー', description: '2スロットで精密射撃。', slots: [{req:'BLUE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 10 },
    { type: 'MISSILE', name: '拡散ポッド', description: '多数の白スロットを持つ。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0.8, basePower: 3, hp: 10 },
    { type: 'SHIELD', name: 'ミラーコート', description: '青エネルギーで特殊防御。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 4, hp: 12 },
    { type: 'AMPLIFIER', name: 'エネルギー増幅器', description: '隣接するパーツの出力を強化する(要:白エネ)。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 2, hp: 8 },
    { type: 'AMPLIFIER', name: 'ハイパーブースター', description: '隣接するパーツを大幅強化(要:橙エネ)。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 5, hp: 8 },
    { type: 'AMPLIFIER', name: 'デュアルアンプ', description: '2スロットで安定した強化。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 8 },
    { type: 'CANNON', name: 'ホッチキス銃', description: '4連白スロット。数で勝負。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0.8, basePower: 4, hp: 10 },
    { type: 'CANNON', name: 'カッターナイフ', description: '近距離高火力。1スロット橙。', slots: [{req:'ORANGE', value:null}], multiplier: 4.5, basePower: 2, hp: 5 },
    { type: 'MISSILE', name: 'コンパスドリル', description: '1スロットだが貫通力が高い。', slots: [{req:'BLUE', value:null}], multiplier: 3.5, basePower: 4, hp: 10 },
    { type: 'SHIELD', name: '修正液バリア', description: '白エネルギーで堅牢な守り。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.8, basePower: 6, hp: 15 },
    { type: 'SHIELD', name: '鉄壁の筆箱', description: '3スロットで鉄壁の防御。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.5, basePower: 8, hp: 20 },
    { type: 'CANNON', name: '黒板消しキャノン', description: '粉塵爆発。白と青を使用。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.8, basePower: 5, hp: 12 },
    { type: 'MISSILE', name: '三角定規ブーメラン', description: '戻ってくる衝撃波。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 6, hp: 10 },
    { type: 'AMPLIFIER', name: '黄金比コンパス', description: '青エネルギーで隣接パーツを強化。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 4, hp: 8 },
    { type: 'AMPLIFIER', name: '下敷き静電気', description: '隣接強化。白エネルギー。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 5 },
    { type: 'CANNON', name: 'シャーペンスナイパー', description: '超遠距離精密射撃。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 2.5, basePower: 7, hp: 8 },
    { type: 'CANNON', name: '液状のりスプレー', description: '敵の動きを鈍らせる(イメージ)。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.2, basePower: 3, hp: 12 },
    { type: 'CANNON', name: '彫刻刀セット', description: '5本の刃を一斉射出。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 0.5, basePower: 10, hp: 10 },
    { type: 'CANNON', name: '放送室スピーカー', description: '音波攻撃。白エネで高出力。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '焼却炉エンジン', description: '橙エネルギー専用。爆発的推進力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 5.0, basePower: 10, hp: 20 },
    { type: 'SHIELD', name: '理科室の人体模型', description: '不気味なオーラで守る。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 8, hp: 25 },
    { type: 'MISSILE', name: '消火栓放水', description: '青エネルギー3つで超高圧放水。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 3.0, basePower: 12, hp: 18 },
    { type: 'AMPLIFIER', name: '校長先生の銅像', description: '圧倒的威圧感で隣接パーツを強化。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 6, hp: 30 },
    { type: 'CANNON', name: 'チャイム音波砲', description: 'キーンコーンカーンコーン(破壊音)。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 6, hp: 10 },
    { type: 'SHIELD', name: '自己修復ナノ', description: '起動時に船体HPを5回復する。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'HEAL' },
    { type: 'ENGINE', name: 'エネルギー吸収装置', description: '起動時、燃料を1回復する。', slots: [{req:'BLUE', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'RECYCLE' },
    { type: 'ENGINE', name: 'あしたのジョーロ', description: '水力エンジン。白のみで高効率。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.8, basePower: 1, hp: 8 },
    { type: 'SHIELD', name: '揚げパンアーマー', description: '砂糖のコーティングで衝撃吸収。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.5, basePower: 5, hp: 15 },
    { type: 'MISSILE', name: '冷凍ミカン爆弾', description: 'カチカチのミカンを投下。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 3, hp: 8 },
    { type: 'CANNON', name: '牛乳瓶キャノン', description: 'カルシウムパワーで攻撃。', slots: [{req:'WHITE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 },
    { type: 'SHIELD', name: '0点のテスト用紙', description: '紙装甲だがHPだけは無駄に高い。', slots: [{req:'WHITE', value:null}], multiplier: 0.1, basePower: 1, hp: 50 },
    { type: 'CANNON', name: 'プリズムレーザー', description: '青と橙の混合エネルギーが必要。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.5, basePower: 8, hp: 10 },
    { type: 'CANNON', name: '伝説のソード', description: '勇者が使っていた剣の切っ先。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 3.0, basePower: 20, hp: 30 },
    { type: 'MISSILE', name: 'ドラゴン花火', description: '龍の形をした花火ミサイル。', slots: [{req:'ORANGE', value:null}, {req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 2.5, basePower: 15, hp: 15 },
    { type: 'ENGINE', name: '無限の心臓', description: '永久機関。ランクアップ効果付き。', slots: [{req:'ORANGE', value:null}, {req:'BLUE', value:null}], multiplier: 2.0, basePower: 5, hp: 40, specialEffect: 'RANK_UP' },
];

// --- HELPERS ---

const getColorRank = (color: EnergyColor | 'ANY'): number => {
    switch (color) {
        case 'ORANGE': return 3;
        case 'BLUE': return 2;
        case 'WHITE': return 1;
        case 'ANY': return 0;
        default: return 0;
    }
};

const isColorCompatible = (cardColor: EnergyColor, slotReq: EnergyColor | 'ANY'): boolean => {
    return getColorRank(cardColor) >= getColorRank(slotReq);
};

const calculateBuffGrid = (parts: ShipPart[]): number[][] => {
    const grid = Array(SHIP_HEIGHT).fill(0).map(() => Array(SHIP_WIDTH).fill(0));
    parts.forEach((part, idx) => {
        if (part.type === 'AMPLIFIER') {
            const energySum = part.slots.reduce((s, slot) => s + (slot.value || 0), 0);
            const isFull = part.slots.every(s => s.value !== null) && part.slots.length > 0;
            
            // Only provide bonus if active (has energy) or no slots required
            if (energySum > 0 || (part.slots.length === 0)) { 
                let power = Math.floor(energySum * part.multiplier);
                if (isFull) power += part.basePower;
                
                const r = Math.floor(idx / SHIP_WIDTH);
                const c = idx % SHIP_WIDTH;
                
                // Apply to adjacent
                const neighbors = [{r:r-1,c}, {r:r+1,c}, {r,c:c-1}, {r,c:c+1}];
                neighbors.forEach(n => {
                    if (n.r >= 0 && n.r < SHIP_HEIGHT && n.c >= 0 && n.c < SHIP_WIDTH) {
                        grid[n.r][n.c] += power;
                    }
                });
            }
        }
    });
    return grid;
};

// --- COMPONENTS ---

const PoolView: React.FC<{ pool: PoolState, onClose: () => void }> = ({ pool, onClose }) => {
    const allNumbers = [...pool.genNumbers, ...pool.coolNumbers].sort((a,b) => a - b);
    const allColors = [...pool.genColors, ...pool.coolColors].sort((a,b) => getColorRank(b) - getColorRank(a));

    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-lg max-w-lg w-full border border-slate-600 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                <h3 className="text-xl font-bold mb-6 flex items-center text-white"><Layers className="mr-2"/> Energy Inventory</h3>
                
                <div className="mb-6">
                    <div className="text-cyan-400 font-bold mb-3 border-b border-cyan-700 pb-1">所持エネルギー数値</div>
                    <div className="flex flex-wrap gap-1 font-mono text-sm mb-3">
                        {allNumbers.length > 0 ? allNumbers.map((n, i) => <span key={i} className="bg-slate-700 px-1.5 rounded">{n}</span>) : <span className="text-gray-600">Empty</span>}
                    </div>
                </div>
                
                <div>
                    <div className="text-orange-400 font-bold mb-3 border-b border-orange-700 pb-1">所持エネルギー色</div>
                    <div className="flex flex-wrap gap-1">
                        {allColors.length > 0 ? allColors.map((c, i) => (
                            <div key={i} className={`w-6 h-6 rounded border-2 border-black/50 ${c==='ORANGE'?'bg-orange-500':c==='BLUE'?'bg-blue-500':'bg-slate-200'}`} title={c}></div>
                        )) : <span className="text-gray-600 text-xs">Empty</span>}
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-6 text-center">
                    合計: {allNumbers.length} 枚
                </div>

                <button onClick={onClose} className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">閉じる</button>
            </div>
        </div>
    );
};

const EnergyCardView: React.FC<{ card: EnergyCard, onClick?: () => void, selected?: boolean, small?: boolean }> = ({ card, onClick, selected, small }) => {
    const bgColor = card.color === 'ORANGE' ? 'bg-orange-500' : card.color === 'BLUE' ? 'bg-blue-500' : 'bg-slate-200 text-black';
    const borderColor = card.color === 'ORANGE' ? 'border-orange-700' : card.color === 'BLUE' ? 'border-blue-700' : 'border-slate-400';
    
    const sizeClasses = small 
        ? "w-8 h-10 md:w-10 md:h-12 rounded border-b-2 border-r-1 text-xs" 
        : "w-14 h-20 md:w-16 md:h-24 rounded-lg border-b-4 border-r-2 text-xl";

    const textSize = small ? "text-base font-bold" : "text-xl md:text-3xl font-black";
    const iconSize = small ? 8 : 10;
    
    return (
        <div 
            onClick={onClick}
            className={`
                ${sizeClasses} ${borderColor} ${bgColor} 
                flex flex-col items-center justify-center cursor-pointer transition-transform relative shadow-sm shrink-0
                ${selected ? '-translate-y-1 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-0.5'}
                ${card.isTemporary ? 'opacity-90 ring-1 ring-purple-400' : ''}
                select-none touch-none
            `}
            style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            <div className={`${textSize} ${card.color === 'WHITE' ? 'text-slate-800' : 'text-white'}`}>{card.value}</div>
            <div className="absolute top-0.5 right-0.5">
                {card.color === 'ORANGE' && <Zap size={iconSize} className="text-yellow-200 fill-current"/>}
                {card.color === 'BLUE' && <Wind size={iconSize} className="text-cyan-200 fill-current"/>}
            </div>
            {card.isTemporary && <div className="absolute bottom-0 right-0 text-[6px] bg-purple-600 text-white px-0.5 rounded-tl">TEMP</div>}
        </div>
    );
};

const ShipPartView: React.FC<{ 
    part: ShipPart, 
    onClick?: () => void, 
    onLongPress?: (part: ShipPart) => void,
    isEnemy?: boolean, 
    highlight?: boolean,
    pendingReplace?: boolean,
    showPower?: boolean,
    bonusPower?: number
}> = ({ part, onClick, onLongPress, isEnemy, highlight, pendingReplace, showPower = true, bonusPower = 0 }) => {
    
    const longPressTimer = useRef<any>(null);

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            if (onLongPress) onLongPress(part);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onLongPress) onLongPress(part);
    }

    let icon = <Box size={14}/>;
    let colorClass = 'bg-slate-800 border-slate-600';
    let textColor = 'text-slate-400';
    
    if (part.type === 'CANNON') { icon = <Crosshair size={14}/>; colorClass = 'bg-red-900/60 border-red-500/50'; textColor='text-red-200'; }
    if (part.type === 'ENGINE') { icon = <Move size={14}/>; colorClass = 'bg-emerald-900/60 border-emerald-500/50'; textColor='text-emerald-200'; }
    if (part.type === 'MISSILE') { icon = <Send size={14}/>; colorClass = 'bg-orange-900/60 border-orange-500/50'; textColor='text-orange-200'; }
    if (part.type === 'SHIELD') { icon = <Shield size={14}/>; colorClass = 'bg-blue-900/60 border-blue-500/50'; textColor='text-blue-200'; }
    if (part.type === 'AMPLIFIER') { icon = <Activity size={14}/>; colorClass = 'bg-purple-900/60 border-purple-500/50'; textColor='text-purple-200'; }
    
    if (part.specialEffect === 'RANK_UP') { colorClass = 'bg-purple-900/60 border-purple-500/50'; textColor='text-purple-200'; icon = <Zap size={14}/>; }
    if (part.specialEffect === 'HEAL') { colorClass = 'bg-green-900/60 border-green-500/50'; textColor='text-green-200'; icon = <Droplets size={14}/>; }
    if (part.specialEffect === 'RECYCLE') { colorClass = 'bg-teal-900/60 border-teal-500/50'; textColor='text-teal-200'; icon = <Recycle size={14}/>; }
    if (part.specialEffect === 'THORNS') { colorClass = 'bg-slate-700 border-red-500'; textColor='text-red-300'; icon = <Radiation size={14}/>; }

    if (part.type === 'EMPTY') {
        return (
            <div 
                onClick={onClick}
                className={`w-full h-full border border-dashed ${pendingReplace ? 'border-yellow-400 bg-yellow-900/30 animate-pulse' : 'border-slate-700 bg-black/20'} rounded flex items-center justify-center cursor-pointer select-none touch-none`}
                style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
            >
                {pendingReplace ? <div className="text-xs text-yellow-400 font-bold">HERE</div> : <div className="w-1 h-1 bg-slate-700 rounded-full"/>}
            </div>
        );
    }

    const loadedCount = part.slots.filter(s => s.value !== null).length;
    const isFull = loadedCount === part.slots.length && part.slots.length > 0;
    
    let totalPower = 0;
    const energySum = part.slots.reduce((sum, s) => sum + (s.value || 0), 0);
    
    if (energySum > 0 || (part.slots.length === 0)) { 
        totalPower = Math.floor(energySum * part.multiplier);
        if (isFull) totalPower += part.basePower;
    }
    
    const displayPower = totalPower + bonusPower;

    return (
        <div 
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            className={`
                relative w-full h-full border rounded flex flex-col justify-between p-1 transition-all overflow-hidden
                ${colorClass} ${highlight ? 'ring-2 ring-yellow-400 brightness-125' : ''}
                ${isFull ? 'brightness-110 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]' : ''}
                ${pendingReplace ? 'ring-2 ring-green-400 animate-pulse opacity-80' : ''}
                cursor-pointer hover:bg-opacity-80
                select-none touch-none
            `}
            style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            <div className="flex justify-between items-center">
                <div className={`${textColor}`}>{icon}</div>
                {((totalPower > 0) || (bonusPower > 0)) && showPower && part.type !== 'AMPLIFIER' && (
                    <div className="text-[10px] font-bold text-white shadow-black drop-shadow-md flex items-center">
                        {displayPower}
                        {bonusPower > 0 && <span className="text-[8px] text-green-400 ml-0.5">+{bonusPower}</span>}
                    </div>
                )}
                {part.type === 'AMPLIFIER' && isFull && <div className="text-[8px] font-bold text-yellow-300">UP!</div>}
                {part.specialEffect === 'HEAL' && isFull && <div className="text-[8px] font-bold text-green-300">HEAL</div>}
            </div>

            <div className="flex gap-0.5 justify-center mt-1">
                {part.slots.map((slot, i) => {
                    let slotColor = 'bg-slate-900 border-slate-600';
                    if (slot.value !== null) {
                        slotColor = 'bg-white border-white animate-pulse'; 
                    } else if (slot.req === 'ORANGE') {
                        slotColor = 'bg-orange-900 border-orange-600';
                    } else if (slot.req === 'BLUE') {
                        slotColor = 'bg-blue-900 border-blue-600';
                    } else if (slot.req === 'WHITE') {
                        slotColor = 'bg-slate-200 border-slate-400';
                    }
                    
                    return (
                        <div key={i} className={`w-3 h-4 md:w-4 md:h-5 border rounded-sm flex items-center justify-center text-[8px] font-bold ${slotColor} text-black`}>
                            {slot.value}
                        </div>
                    );
                })}
            </div>
            
            <div className="text-[8px] text-center text-gray-400 truncate w-full mt-auto">{part.name}</div>
        </div>
    );
};

// --- CLASH ANIMATION OVERLAY ---
const ClashOverlay: React.FC<{ clashState: ClashState }> = ({ clashState }) => {
    if (!clashState.active) return null;

    return (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center py-4">
            {[0, 1, 2, 3, 4].map((rowIdx) => {
                const clash = clashState.data.find(d => d.row === rowIdx);
                if (!clash) return <div key={rowIdx} className="h-20 md:h-24"></div>;

                let pWidth = 50;
                let eWidth = 50;
                let opacity = 1;

                if (clashState.phase === 'INIT') {
                    pWidth = 0; eWidth = 0;
                } else if (clashState.phase === 'CLASH') {
                    pWidth = 50; eWidth = 50; 
                } else if (clashState.phase === 'IMPACT') {
                    if (clash.result === 'ENEMY_HIT') {
                        pWidth = 100; eWidth = 0;
                    } else if (clash.result === 'PLAYER_HIT') {
                        pWidth = 0; eWidth = 100;
                    } else if (clash.result === 'DRAW') {
                        pWidth = 50; eWidth = 50; 
                    } else {
                        if (clash.pPower > 0) {
                            pWidth = 100; eWidth = 0; 
                        } else if (clash.ePower > 0) {
                            pWidth = 0; eWidth = 100; 
                        } else {
                            opacity = 0; 
                        }
                    }
                } else {
                    opacity = 0;
                }

                const pShieldVis = clash.pShield > 0 && (clash.result === 'PLAYER_HIT' || clash.result === 'DRAW');
                const pThornVis = clash.pThorns > 0 && clash.result === 'PLAYER_HIT';

                return (
                    <div key={rowIdx} className="h-20 md:h-24 relative flex items-center transition-all duration-300" style={{ opacity }}>
                        {clash.pPower > 0 && (
                            <div 
                                className="absolute left-0 h-4 md:h-6 bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_15px_cyan] rounded-r-full transition-all duration-500 ease-out"
                                style={{ width: `${pWidth}%`, left: 0 }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full blur-md opacity-80"></div>
                            </div>
                        )}
                        
                        {clash.ePower > 0 && (
                            <div 
                                className="absolute right-0 h-4 md:h-6 bg-gradient-to-l from-red-600 via-purple-500 to-white shadow-[0_0_15px_red] rounded-l-full transition-all duration-500 ease-out"
                                style={{ width: `${eWidth}%`, right: 0 }}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full blur-md opacity-80"></div>
                            </div>
                        )}

                        {clashState.phase === 'IMPACT' && (
                            <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none">
                                {clash.result === 'DRAW' && (
                                    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full animate-ping z-40"></div>
                                )}
                                {clash.result === 'ENEMY_HIT' && (
                                    <div className="absolute right-0 translate-x-1/2 w-24 h-24 bg-orange-400 rounded-full animate-ping z-40 shadow-[0_0_30px_orange]"></div>
                                )}
                                {clash.result === 'PLAYER_HIT' && (
                                    <div className="absolute left-0 -translate-x-1/2 w-24 h-24 bg-red-500 rounded-full animate-ping z-40 shadow-[0_0_30px_red]"></div>
                                )}
                            </div>
                        )}
                        
                        {pShieldVis && (
                            <div className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 z-40 animate-pulse text-blue-400">
                                <Shield size={48} className="fill-blue-900/50 stroke-2"/>
                            </div>
                        )}

                        {pThornVis && (
                             <div className="absolute left-10 md:left-20 top-1/2 -translate-y-1/2 z-50 text-red-500 font-bold animate-ping flex items-center">
                                 <Radiation size={32} /> THORNS!
                             </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const loadInitialState = () => {
    return storageService.loadPaperPlaneState();
};

const loadProgress = () => {
    return storageService.loadPaperPlaneProgress();
};

const PaperPlaneBattle: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const savedData = loadInitialState();
    const [progress, setProgress] = useState<PaperPlaneProgress>(loadProgress());

    const [phase, setPhase] = useState<GamePhase>(savedData?.phase || 'SETUP');
    const [stage, setStage] = useState(savedData?.stage || 1); 
    const [turn, setTurn] = useState(savedData?.turn || 1);
    const [isEndless, setIsEndless] = useState(savedData?.isEndless || false);
    
    // --- SETUP PHASE STATES ---
    const [setupStep, setSetupStep] = useState<'SHIP'|'PILOT'|'MISSION'>('SHIP');
    const [selectedShipId, setSelectedShipId] = useState<string>('SHIP_DEFAULT');
    const [pilotOptions, setPilotOptions] = useState<Pilot[]>([]);
    const [selectedPilotIndex, setSelectedPilotIndex] = useState<number>(-1);
    const [pinnedPilotIndex, setPinnedPilotIndex] = useState<number | null>(null);
    const [randomTalents, setRandomTalents] = useState<Talent[]>([]);
    const [selectedMissionLevel, setSelectedMissionLevel] = useState<number>(savedData?.selectedMissionLevel || 0);

    const [pool, setPool] = useState<PoolState>(savedData?.pool || {
        genNumbers: [1,2,3,4,5,6,3,4,5], 
        genColors: ['WHITE','WHITE','WHITE','BLUE','BLUE','ORANGE','ORANGE'], 
        coolNumbers: [],
        coolColors: []
    });

    const [hand, setHand] = useState<EnergyCard[]>(savedData?.hand || []);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    const [player, setPlayer] = useState<ShipState>(savedData?.player || {
        yOffset: 1, 
        hp: 40, maxHp: 40, fuel: MAX_FUEL, maxFuel: MAX_FUEL, durability: 0, maxDurability: 0, isStunned: false,
        parts: [], // Set in init
        starCoins: 0,
        vacationDays: 0,
        passivePower: 0,
        partInventory: [],
        talents: []
    });

    const [enemy, setEnemy] = useState<ShipState>(savedData?.enemy || {
        yOffset: 1,
        hp: 20, maxHp: 20, fuel: 3, maxFuel: 3, durability: 3, maxDurability: 3, isStunned: false,
        parts: [], 
        starCoins: 0, vacationDays: 0, passivePower: 0,
        partInventory: [],
        talents: [],
        enemyConfig: { energyPerTurn: 2, colors: ['WHITE'], moveChance: 0.2 }
    });

    const [enemyIntents, setEnemyIntents] = useState<EnemyIntent[]>(savedData?.enemyIntents || []);
    const [logs, setLogs] = useState<string[]>([]);
    const [showPool, setShowPool] = useState(false);
    const [showHandHelp, setShowHandHelp] = useState(false);
    const [showGameHelp, setShowGameHelp] = useState(false); // Added Game Help State
    const [animating, setAnimating] = useState(false);
    const [tooltipPart, setTooltipPart] = useState<ShipPart | null>(null);
    
    const [clashState, setClashState] = useState<ClashState>({ active: false, phase: 'INIT', data: [] });
    
    const [vacationEvents, setVacationEvents] = useState<VacationEvent[]>(savedData?.vacationEvents || []);
    const [vacationLog, setVacationLog] = useState<string>(savedData?.vacationLog || "休暇を楽しんでください。");
    const [pendingPart, setPendingPart] = useState<ShipPart | null>(savedData?.pendingPart || null); 
    const [hangarSelection, setHangarSelection] = useState<{loc: 'SHIP'|'INV', idx: number}|null>(null);

    const [rewardOptions, setRewardOptions] = useState<ShipPart[]>(savedData?.rewardOptions || []);
    const [earnedCoins, setEarnedCoins] = useState(savedData?.earnedCoins || 0);

    // --- AUTO SAVE ---
    const saveDebounceRef = useRef<any>(null);

    useEffect(() => {
        if (phase === 'GAME_OVER') {
            storageService.clearPaperPlaneState();
        } else if (phase !== 'TUTORIAL' && phase !== 'SETUP') {
            if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
            saveDebounceRef.current = setTimeout(() => {
                const stateToSave = {
                    phase, stage, turn, pool, hand, player, enemy, enemyIntents, isEndless,
                    vacationEvents, vacationLog, pendingPart, rewardOptions, earnedCoins, selectedMissionLevel
                };
                storageService.savePaperPlaneState(stateToSave);
            }, 1000); 
        }
    }, [phase, stage, turn, pool, hand, player, enemy, enemyIntents, vacationEvents, vacationLog, pendingPart, rewardOptions, earnedCoins, isEndless, selectedMissionLevel]);

    // --- SCORE SAVING ---
    const scoreSavedRef = useRef(false);
    useEffect(() => {
        if (phase === 'VICTORY' || phase === 'GAME_OVER') {
            if (scoreSavedRef.current) return;
            scoreSavedRef.current = true;
            
            const calculatedScore = (stage * 100) + player.starCoins + (player.hp * 10) + (selectedMissionLevel * 500);
            storageService.savePaperPlaneScore({
                id: `plane-${Date.now()}`,
                date: Date.now(),
                stage: stage,
                rank: selectedMissionLevel,
                score: Math.floor(calculatedScore)
            });
            
            if (phase === 'VICTORY') {
                storageService.clearPaperPlaneState();
            }
        } else {
            scoreSavedRef.current = false;
        }
    }, [phase, stage, player.starCoins, player.hp, selectedMissionLevel]);

    useEffect(() => {
        // Initial BGM check based on loaded phase
        if (phase === 'BATTLE') audioService.playBGM('paper_plane_battle');
        else if (['VACATION', 'SHOP', 'HANGAR', 'REWARD_SELECT', 'REWARD_EQUIP', 'UPGRADE_EVENT'].includes(phase)) audioService.playBGM('paper_plane_vacation');
        else audioService.playBGM('paper_plane_setup');

        if (phase === 'SETUP') {
             initPilotRoll();
        }
    }, []);

    // --- SETUP LOGIC ---
    const initPilotRoll = () => {
        const slots: Pilot[] = [];
        for (let i=0; i<3; i++) {
             slots.push(PILOTS[Math.floor(Math.random() * PILOTS.length)]);
        }
        setPilotOptions(slots);
        setSelectedPilotIndex(-1); // Reset selection
        
        // Random Talents for higher ranks
        const talents: Talent[] = [];
        if (progress.rank >= 5) {
            talents.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
        }
        if (progress.rank >= 10) {
             talents.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
        }
        setRandomTalents(talents);
    };

    const handleRerollPilots = () => {
        if (progress.rerollCount <= 0) {
            audioService.playSound('wrong');
            return;
        }
        
        // Update Progress
        const newProgress = { ...progress, rerollCount: progress.rerollCount - 1 };
        setProgress(newProgress);
        storageService.savePaperPlaneProgress(newProgress);
        
        // Roll Pilots
        const newOpts = [...pilotOptions];
        for (let i=0; i<3; i++) {
            if (pinnedPilotIndex === i) continue;
            newOpts[i] = PILOTS[Math.floor(Math.random() * PILOTS.length)];
        }
        setPilotOptions(newOpts);
        setSelectedPilotIndex(-1); // Reset on reroll too? Maybe keep if pinned? No reset is safer.

        // Roll Random Talents
        const newTalents: Talent[] = [];
        if (progress.rank >= 5) newTalents.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
        if (progress.rank >= 10) newTalents.push(GENERIC_TALENTS[Math.floor(Math.random() * GENERIC_TALENTS.length)]);
        setRandomTalents(newTalents);
        
        audioService.playSound('select');
    };
    
    const confirmSetup = () => {
        if (selectedPilotIndex === -1) {
            audioService.playSound('wrong');
            return;
        }
        
        audioService.playSound('win');
        
        // Init Game Data
        const shipTemplate = SHIPS.find(s => s.id === selectedShipId)!;
        const pilot = pilotOptions[selectedPilotIndex];
        
        // Apply Modifiers
        let pMaxHp = shipTemplate.baseHp;
        let pPassivePower = 0;
        let pMaxFuel = MAX_FUEL;
        let pStartMoney = 0;
        
        // Apply Talents
        const allTalents = [pilot.intrinsicTalent, ...randomTalents];
        allTalents.forEach(t => {
            if (t.effectType === 'MAX_HP') pMaxHp += t.value;
            if (t.effectType === 'PASSIVE_POWER') pPassivePower += t.value;
            if (t.effectType === 'FUEL') pMaxFuel += t.value;
        });

        // Apply Ascension Modifiers (simplified)
        // Lvl 1: -
        if (selectedMissionLevel >= 2) pMaxHp -= 5;
        // ... more can be added

        setPlayer({
            yOffset: 1,
            hp: pMaxHp, maxHp: pMaxHp,
            fuel: pMaxFuel, maxFuel: pMaxFuel,
            durability: 0, maxDurability: 0, isStunned: false,
            parts: JSON.parse(JSON.stringify(shipTemplate.layout)),
            starCoins: pStartMoney,
            vacationDays: 0,
            passivePower: pPassivePower,
            partInventory: [],
            talents: allTalents
        });
        
        setStage(1);
        setIsEndless(false);
        initBattle(1);
        audioService.playBGM('paper_plane_battle'); // Switch BGM
    };
    
    const returnToSetup = () => {
        setPhase('SETUP');
        setSetupStep('SHIP');
        setStage(1);
        setIsEndless(false);
        initPilotRoll(); // Ensure pilots are rerolled/reset
        audioService.playSound('select');
        audioService.playBGM('paper_plane_setup');
    };

    // --- GAME LOGIC ---

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 4)]);

    const initBattle = (stageNum: number) => {
        let enemyIdx;
        let template;

        if (stageNum <= 4) {
            enemyIdx = Math.min(ENEMY_DATA.length - 1, Math.floor((stageNum - 1) / 1.5));
            enemyIdx = Math.max(0, Math.min(enemyIdx, ENEMY_DATA.length - 1));
            template = ENEMY_DATA[enemyIdx];
        } else {
            enemyIdx = Math.floor(Math.random() * ENEMY_DATA.length);
            template = ENEMY_DATA[enemyIdx];
        }

        // Difficulty Scaling with Ascension
        let hp = template.hp + (stageNum * 8);
        let dur = template.durability + Math.floor(stageNum / 2);
        
        // Ascension Scaling
        if (selectedMissionLevel >= 1) { /* Enemy Dmg Up handled in calculation */ }
        if (selectedMissionLevel >= 3) hp = Math.floor(hp * 1.1);
        if (selectedMissionLevel >= 5) dur += 2;
        if (selectedMissionLevel >= 7) hp = Math.floor(hp * 1.2);

        if (isEndless) {
             const loop = Math.max(1, stageNum - FINAL_STAGE_NORMAL);
             hp += loop * 30;
             dur += loop * 2;
        }

        const eParts: ShipPart[] = template.layout.map((t, i) => {
            const type = t as any;
            let partTemplate = PART_TEMPLATES.find(pt => pt.type === type);
            // Default template if specific not found or generic needed
            if (!partTemplate || type === 'EMPTY') {
                 partTemplate = { 
                     type: type, 
                     name: type==='EMPTY'?'空き':(type==='CANNON'?'敵砲台':'敵パーツ'), 
                     description:'', slots: [], multiplier: 1, basePower: 0, hp: 10 
                 };
            }
            
            // Adjust enemy parts based on type
            let slots: EnergySlot[] = [];
            let basePower = 0;
            let multiplier = 1;

            if (type === 'CANNON') {
                 slots = [{req:'ANY', value:null}]; 
                 basePower = 2 + Math.floor(stageNum/3);
                 multiplier = 1.0;
            } else if (type === 'MISSILE') {
                 slots = [{req:'ANY', value:null}];
                 basePower = 3 + Math.floor(stageNum/2);
                 multiplier = 1.5;
            } else if (type === 'AMPLIFIER') {
                 slots = [{req:'ANY', value:null}];
                 basePower = 2 + Math.floor(stageNum/4);
                 multiplier = 0;
            }

            return {
                id: `ep_${i}`,
                type: type,
                name: partTemplate.name,
                slots: slots,
                multiplier: multiplier,
                basePower: basePower,
                hp: 10
            };
        });

        // Initial Player Setup (Correct position)
        setPlayer(prev => ({
            ...prev,
            yOffset: 1,
            parts: prev.parts.map(p => ({ ...p, slots: p.slots.map(s => ({...s, value: null})) })),
            // Ascension 4: Start damaged
            hp: selectedMissionLevel >= 4 ? Math.floor(prev.hp * 0.8) : prev.hp
        }));

        // Determine initial enemy fuel based on stage (more fuel later)
        const initialFuel = 3 + Math.floor(stageNum / 2);

        const initialEnemy = {
            yOffset: 1,
            hp: hp, maxHp: hp,
            durability: dur, maxDurability: dur,
            fuel: initialFuel, maxFuel: initialFuel, isStunned: false,
            parts: eParts,
            starCoins: 0, vacationDays: 0, passivePower: 0,
            partInventory: [],
            talents: [],
            enemyConfig: {
                energyPerTurn: template.energy,
                colors: template.colors,
                moveChance: template.moveChance
            }
        };

        // Important: Pass current player state to AI logic for initial intent generation
        const { nextEnemy, intents } = updateEnemyState(initialEnemy, stageNum, { ...player, yOffset: 1 });
        setEnemy(nextEnemy);
        setEnemyIntents(intents);

        setTurn(1);
        
        let allNumbers = [...pool.genNumbers, ...pool.coolNumbers, ...hand.map(c => c.value)];
        let allColors = [...pool.genColors, ...pool.coolColors, ...hand.map(c => c.color)];

        const initialHand: EnergyCard[] = [];
        const drawCount = 5;

        allNumbers.sort(() => Math.random() - 0.5);
        allColors.sort(() => Math.random() - 0.5);

        for (let i = 0; i < drawCount; i++) {
            if (allNumbers.length > 0 && allColors.length > 0) {
                const val = allNumbers.pop()!;
                const col = allColors.pop()!;
                initialHand.push({ id: `e_init_${Date.now()}_${i}`, value: val, color: col });
            }
        }
        
        // Talent: Start Energy
        player.talents.forEach(t => {
             if (t.effectType === 'START_ENERGY') {
                 for(let k=0; k<t.value; k++) {
                     // Add extra white energy
                     initialHand.push({ id: `e_talent_${Date.now()}_${k}`, value: 3, color: 'WHITE' });
                 }
             }
        });

        setPool({
            genNumbers: allNumbers,
            genColors: allColors,
            coolNumbers: [],
            coolColors: []
        });
        setHand(initialHand);

        setPhase('BATTLE');
        addLog(`バトル開始！ 敵: ${template.name}`);
        audioService.playBGM('paper_plane_battle'); // Ensure correct BGM
    };

    // --- ENEMY AI LOGIC ---

    const updateEnemyState = (currentEnemy: ShipState, currentStage: number, currentPlayer: ShipState): { nextEnemy: ShipState, intents: EnemyIntent[] } => {
        let nextEnemy = { ...currentEnemy };
        const intents: EnemyIntent[] = [];
        const config = nextEnemy.enemyConfig || { energyPerTurn: 2, colors: ['WHITE'], moveChance: 0.2 };

        // 1. Charge Energy
        let energyBudget = config.energyPerTurn;
        
        for (let i = 0; i < nextEnemy.parts.length; i++) {
            if (energyBudget <= 0) break;
            const part = nextEnemy.parts[i];
            if (part.type === 'EMPTY') continue;

            const emptySlots = part.slots.map((s, idx) => ({s, idx})).filter(item => item.s.value === null);
            
            for (const slotItem of emptySlots) {
                if (energyBudget > 0) {
                    const val = 3 + Math.floor(currentStage / 3); 
                    const newSlots = [...part.slots];
                    newSlots[slotItem.idx] = { ...slotItem.s, value: val };
                    nextEnemy.parts[i] = { ...part, slots: newSlots };
                    energyBudget--;
                }
            }
        }

        // 2. AI Movement Logic (Aiming)
        // Only move if we have fuel
        if (nextEnemy.fuel > 0) {
            const currentY = nextEnemy.yOffset;
            const playerY = currentPlayer.yOffset;
            const playerBodyRows = [playerY, playerY + 1, playerY + 2]; // Player occupies these rows on grid

            let bestY = currentY;
            let maxScore = -9999;
            let bestMoveDir = 0;

            // Try moves: -1 (Up), 0 (Stay), +1 (Down)
            // Note: In this grid, -1 yOffset means moving visually UP (index decreases)
            const moves = [0, -1, 1];

            moves.forEach(dir => {
                const testY = currentY + dir;
                // Check Bounds (Ship height is 3, Grid is 5, so valid offsets are 0, 1, 2)
                if (testY < 0 || testY > MAX_ROWS - SHIP_HEIGHT) return;

                let score = 0;

                // 1. Offensive Score: Align loaded weapons with player body
                nextEnemy.parts.forEach((p, idx) => {
                    const row = Math.floor(idx / SHIP_WIDTH); // 0, 1, 2 relative to ship
                    const absRow = testY + row; // Absolute grid row

                    // Check if part is loaded weapon
                    const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                    if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                        if (playerBodyRows.includes(absRow)) {
                            score += 10 * p.multiplier; // High priority to hit
                        }
                    }
                });

                // 2. Center Bias (To avoid getting stuck at edges if no clear target)
                if (score === 0) {
                     // 1 is the center for a size 3 ship in a size 5 grid
                     score -= Math.abs(testY - 1);
                }
                
                // Add penalty for moving (cost fuel) to encourage staying put if score is equal
                if (dir !== 0) score -= 0.1;

                if (score > maxScore) {
                    maxScore = score;
                    bestMoveDir = dir;
                    bestY = testY;
                }
            });

            if (bestMoveDir !== 0) {
                // If aggressive move (attacking), commit
                // If defensive/positioning only, use randomness to be unpredictable
                const isAggressive = maxScore >= 5; 
                
                if (isAggressive || Math.random() < config.moveChance) {
                    nextEnemy.yOffset = bestY;
                    nextEnemy.fuel -= 1; // Consume Fuel
                }
            }
        }

        // 3. Generate Intents based on loaded parts
        const buffGrid = calculateBuffGrid(nextEnemy.parts);
        const rowDamageMap: Record<number, number> = {};

        nextEnemy.parts.forEach((p, idx) => {
            const r = Math.floor(idx / SHIP_WIDTH);
            const c = idx % SHIP_WIDTH;
            const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
            
            if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                 let output = Math.floor(energySum * p.multiplier);
                 const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                 if(isFull) output += p.basePower;
                 
                 output += buffGrid[r][c];
                 if (selectedMissionLevel >= 1) output += 1;
                 if (selectedMissionLevel >= 6) output += 1;

                 rowDamageMap[r] = (rowDamageMap[r] || 0) + output;
            } 
        });

        Object.entries(rowDamageMap).forEach(([rStr, val]) => {
            const r = parseInt(rStr, 10);
            if (val > 0) {
                intents.push({ row: r, type: 'ATTACK', value: val });
            }
        });

        return { nextEnemy, intents };
    };

    const drawEnergy = (count: number) => {
        setPool(current => {
            let nextGenNums = [...current.genNumbers];
            let nextGenCols = [...current.genColors];
            let nextCoolNums = [...current.coolNumbers];
            let nextCoolCols = [...current.coolColors];
            
            const newCards: EnergyCard[] = [];

            for(let i=0; i<count; i++) {
                if (nextGenNums.length === 0) { nextGenNums = [...nextCoolNums]; nextCoolNums = []; }
                if (nextGenCols.length === 0) { nextGenCols = [...nextCoolCols]; nextCoolCols = []; }
                
                if (current.genNumbers.length === 0) nextGenNums.sort(() => Math.random() - 0.5);
                if (current.genColors.length === 0) nextGenCols.sort(() => Math.random() - 0.5);

                if (nextGenNums.length > 0 && nextGenCols.length > 0) {
                    const valIdx = Math.floor(Math.random() * nextGenNums.length);
                    const val = nextGenNums[valIdx];
                    nextGenNums.splice(valIdx, 1);
                    
                    const colIdx = Math.floor(Math.random() * nextGenCols.length);
                    const col = nextGenCols[colIdx];
                    nextGenCols.splice(colIdx, 1);

                    newCards.push({ id: `e_${Date.now()}_${i}`, value: val, color: col });
                }
            }
            
            setHand(prev => [...prev, ...newCards]);
            return { genNumbers: nextGenNums, genColors: nextGenCols, coolNumbers: nextCoolNums, coolColors: nextCoolCols };
        });
        audioService.playSound('select');
    };

    const recycleCard = (card: EnergyCard) => {
        if (card.isTemporary) return;

        setPool(prev => ({
            ...prev,
            coolNumbers: [...prev.coolNumbers, card.value],
            coolColors: [...prev.coolColors, card.color]
        }));
    };

    const handleCardSelect = (id: string) => {
        if (selectedCardId === id) setSelectedCardId(null);
        else {
            setSelectedCardId(id);
            audioService.playSound('select');
        }
    };

    const handlePartClick = (partIndex: number) => {
        if (phase === 'VACATION' || phase === 'REWARD_EQUIP') {
            handlePartEquip(partIndex);
            return;
        }

        if (!selectedCardId) return;
        const cardIndex = hand.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) return;

        const card = hand[cardIndex];
        const part = player.parts[partIndex];

        if (part.type === 'EMPTY') { addLog("そこには何もありません"); return; }
        
        let slotIdx = -1;
        let bestRank = -1;

        part.slots.forEach((s, idx) => {
            if (s.value === null && isColorCompatible(card.color, s.req)) {
                const rank = getColorRank(s.req);
                if (rank > bestRank) {
                    bestRank = rank;
                    slotIdx = idx;
                }
            }
        });
        
        if (slotIdx === -1) {
            if (part.slots.every(s => s.value !== null)) addLog("エネルギー充填完了しています");
            else addLog("色が合いません！");
            return;
        }

        let currentHandList = [...hand];

        if (part.specialEffect === 'RANK_UP') {
            const newValue = card.value + 1;
            const newCard: EnergyCard = {
                id: `e_gen_${Date.now()}`,
                value: newValue,
                color: card.color,
                isTemporary: true 
            };
            currentHandList.push(newCard); 
            addLog(`増幅！ランク${newValue}のカードを生成！(一時的)`);
            audioService.playSound('buff');
        }

        const newParts = [...player.parts];
        const newSlots = [...part.slots];
        newSlots[slotIdx] = { ...newSlots[slotIdx], value: card.value };
        newParts[partIndex] = { ...part, slots: newSlots };
        
        setPlayer(prev => ({ ...prev, parts: newParts }));
        currentHandList.splice(cardIndex, 1);
        
        setHand(currentHandList);
        recycleCard(card);
        setSelectedCardId(null);
        if (part.specialEffect !== 'RANK_UP') audioService.playSound('buff');
    };

    const handleMove = (dir: -1 | 1) => {
        if (player.fuel <= 0) { addLog("燃料切れです！"); audioService.playSound('wrong'); return; }
        
        const nextY = player.yOffset + dir;
        if (nextY < 0 || nextY > MAX_ROWS - SHIP_HEIGHT) { addLog("これ以上移動できません"); return; }

        setPlayer(prev => ({ ...prev, yOffset: nextY, fuel: prev.fuel - 1 }));
        audioService.playSound('select');
    };

    const resolveCombat = async () => {
        setAnimating(true);
        setSelectedCardId(null);
        
        const clashData: ClashRowData[] = [];
        let tempEnemyHp = enemy.hp;
        let tempPlayerHp = player.hp;
        let tempFuel = player.fuel;
        let enemyStunDmg = 0;

        const buffGrid = calculateBuffGrid(player.parts);
        const enemyBuffGrid = calculateBuffGrid(enemy.parts); // Calculate enemy buffs

        // CLASH LOGIC
        for (let r = 0; r < MAX_ROWS; r++) {
            const pRelIdx = r - player.yOffset;
            let pPower = 0;
            let pShield = 0;
            let pEngine = 0;
            let pThorns = 0;

            let isPlayerHitbox = false;
            
            if (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) {
                const startIdx = pRelIdx * SHIP_WIDTH;
                const rowParts = player.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                isPlayerHitbox = rowParts.some(p => p.type !== 'EMPTY');

                rowParts.forEach((p, colIdx) => {
                    if (p.type === 'EMPTY' || p.type === 'AMPLIFIER') return;

                    const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                    if (energySum > 0) {
                        let output = Math.floor(energySum * p.multiplier);
                        const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                        if (isFull) {
                            output += p.basePower;
                            if (p.specialEffect === 'HEAL') tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 5);
                            if (p.specialEffect === 'RECYCLE') tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                        }
                        
                        output += buffGrid[pRelIdx][colIdx];
                        output += player.passivePower; 

                        if (p.type === 'CANNON' || p.type === 'MISSILE') pPower += output;
                        if (p.type === 'SHIELD') {
                            pShield += output;
                            if (p.specialEffect === 'THORNS') pThorns += Math.ceil(output / 2);
                        }
                        if (p.type === 'ENGINE') pEngine += output;
                    }
                });
            }

            if (pEngine > 0) {
                pShield += pEngine;
                let fuelRecovered = Math.ceil(pEngine / 2); 
                tempFuel = Math.min(player.maxFuel, tempFuel + fuelRecovered);
            }

            // ENEMY CALCULATION (Updated to use actual parts)
            const eRelIdx = r - enemy.yOffset;
            let ePower = 0;
            let eShield = 0; // Enemy shield logic if needed
            let isEnemyHitbox = false;

            if (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) {
                 const startIdx = eRelIdx * SHIP_WIDTH;
                 const rowParts = enemy.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                 isEnemyHitbox = rowParts.some(p => p.type !== 'EMPTY');

                 if (!enemy.isStunned) {
                     rowParts.forEach((p, colIdx) => {
                         if (p.type === 'EMPTY' || p.type === 'AMPLIFIER') return;
                         const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                         
                         if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                             let output = Math.floor(energySum * p.multiplier);
                             const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                             if(isFull) output += p.basePower;
                             output += enemyBuffGrid[eRelIdx][colIdx];
                             // Ascension Scaling
                             if (selectedMissionLevel >= 1) output += 1;
                             if (selectedMissionLevel >= 6) output += 1;
                             ePower += output;
                         }
                     });
                 }
            }

            let result: ClashRowData['result'] = 'NONE';
            let damage = 0;

            if (pPower > 0 || ePower > 0) {
                if (pPower > ePower) {
                    if (isEnemyHitbox) {
                        result = 'ENEMY_HIT';
                        damage = pPower - ePower;
                    } else {
                        result = 'NONE'; 
                    }
                } else if (ePower > pPower) {
                    if (isPlayerHitbox) {
                        result = 'PLAYER_HIT';
                        let rawDmg = ePower - pPower;
                        damage = rawDmg; 
                    } else {
                        result = 'NONE'; 
                    }
                } else {
                    result = 'DRAW';
                }
            }

            if (pPower > 0 || ePower > 0 || pShield > 0) {
                clashData.push({ row: r, pPower, ePower, pShield, pThorns, result, damage });
            }
        }

        setClashState({ active: true, phase: 'INIT', data: clashData });
        
        audioService.playSound('buff'); 
        setTimeout(() => setClashState(prev => ({ ...prev, phase: 'CLASH' })), 100);
        
        await new Promise(r => setTimeout(r, 600)); 
        setClashState(prev => ({ ...prev, phase: 'IMPACT' }));
        audioService.playSound('attack'); 
        
        let playerHit = false;
        let enemyHit = false;
        clashData.forEach(c => {
             if (c.result === 'PLAYER_HIT') playerHit = true;
             if (c.result === 'ENEMY_HIT') enemyHit = true;
             if (c.result === 'DRAW') audioService.playSound('block');
        });
        if (playerHit) { audioService.playSound('lose'); }
        if (enemyHit) { audioService.playSound('attack'); }

        await new Promise(r => setTimeout(r, 400)); 
        
        clashData.forEach(c => {
            if (c.result === 'ENEMY_HIT') {
                tempEnemyHp = Math.max(0, tempEnemyHp - c.damage);
                enemyStunDmg++;
            } else if (c.result === 'PLAYER_HIT') {
                const blocked = Math.min(c.damage, c.pShield);
                const finalDmg = c.damage - blocked;
                if (finalDmg > 0) tempPlayerHp = Math.max(0, tempPlayerHp - finalDmg);
                
                if (c.pThorns > 0) {
                    tempEnemyHp = Math.max(0, tempEnemyHp - c.pThorns);
                    addLog(`【反撃】スパイク装甲！敵に${c.pThorns}ダメージ！`);
                }
            }
        });

        setClashState({ active: false, phase: 'DONE', data: [] });

        setEnemy(prev => ({...prev, hp: tempEnemyHp}));
        setPlayer(prev => ({...prev, hp: tempPlayerHp, fuel: tempFuel}));

        let nextIsStunned = enemy.isStunned;
        let nextDurability = enemy.durability;

        if (tempEnemyHp > 0) {
            if (enemyStunDmg > 0) {
                if (!enemy.isStunned) {
                    nextDurability = Math.max(0, nextDurability - enemyStunDmg);
                    if (nextDurability === 0) {
                        nextIsStunned = true;
                        addLog("敵の防御値を削りきった！スタン！");
                        audioService.playSound('win');
                    } else {
                        addLog(`敵の防御値を${enemyStunDmg}削った！`);
                    }
                } else {
                    addLog("スタン中の敵を追撃！");
                }
            }

            if (enemy.isStunned) {
                nextIsStunned = false;
                nextDurability = enemy.maxDurability;
                addLog("敵システム再起動！防御値全快！");
                audioService.playSound('buff');
            }
            
            // Clear Enemy Energy after Attack
            const clearedParts = enemy.parts.map(p => {
                 // Clear slots if it attacked (had energy)
                 const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                 if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                     return { ...p, slots: p.slots.map(s => ({...s, value: null})) };
                 }
                 return p;
            });

            setEnemy(prev => ({
                ...prev,
                hp: tempEnemyHp,
                durability: nextDurability,
                isStunned: nextIsStunned,
                parts: clearedParts
            }));
        }

        setPlayer(prev => ({ 
            ...prev, 
            parts: prev.parts.map(p => ({...p, slots: p.slots.map(s => ({...s, value: null})) })) 
        }));
        
        setAnimating(false);

        if (tempPlayerHp <= 0) {
            setPhase('GAME_OVER');
            audioService.playSound('lose');
        } else if (tempEnemyHp <= 0) {
            audioService.playSound('win');
            if (stage === FINAL_STAGE_NORMAL && !isEndless) {
                setPhase('VICTORY');
                handlePhaseComplete(true); 
            } else {
                setupRewardPhase();
            }
        } else {
            setTurn(prev => prev + 1);
            
            // Update Enemy State (Move & Charge & Intent)
            // Pass the current player state so the AI can target intelligently
            // (tempPlayerHp and tempFuel are just scalars, yOffset is inside player.yOffset)
            setEnemy(prev => {
                if (!nextIsStunned) {
                    const { nextEnemy, intents } = updateEnemyState(prev, stage, { ...player, hp: tempPlayerHp });
                    setEnemyIntents(intents);
                    return nextEnemy;
                } else {
                    setEnemyIntents([]);
                    return prev;
                }
            });

            drawEnergy(5);
        }
    };

    const setupRewardPhase = () => {
        const coins = 50 + (stage * 10) + Math.floor(Math.random() * 20);
        setEarnedCoins(coins);
        setPlayer(p => ({...p, starCoins: p.starCoins + coins}));
        
        const persistentHand = hand.filter(c => !c.isTemporary);

        setPool(current => ({
            ...current,
            coolNumbers: [...current.coolNumbers, ...persistentHand.map(c => c.value)],
            coolColors: [...current.coolColors, ...persistentHand.map(c => c.color)]
        }));
        setHand([]);

        const opts: ShipPart[] = [];
        const pool = [...PART_TEMPLATES]; 

        for(let i=0; i<2; i++){
            if (pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            const template = pool[idx];
            
            pool.splice(idx, 1);
            
            let quality = Math.random() < 0.2 ? 1.5 : 1.0;
            const newPart: ShipPart = {
                id: `rew_p_${Date.now()}_${i}`,
                type: template.type,
                name: template.name + (quality > 1 ? '+' : ''),
                description: template.description,
                slots: template.slots,
                multiplier: template.multiplier * quality,
                basePower: Math.floor(template.basePower * quality),
                hp: 10,
                specialEffect: template.specialEffect
            };
            opts.push(newPart);
        }
        setRewardOptions(opts);
        setPhase('REWARD_SELECT');
        audioService.playBGM('paper_plane_vacation'); // Switch to vacation theme for reward
        audioService.playSound('win');
    };

    const handleRewardSelect = (part: ShipPart) => {
        setPendingPart(part);
        setPhase('REWARD_EQUIP');
        audioService.playSound('select');
    };

    const handleDiscardReward = () => {
        setPendingPart(null);
        startVacation();
        audioService.playSound('select');
    };
    
    const handleRerollRewards = () => {
        if (player.starCoins < 50) {
            audioService.playSound('wrong');
            return;
        }
        setPlayer(p => ({...p, starCoins: p.starCoins - 50}));
        
        const opts: ShipPart[] = [];
        const pool = [...PART_TEMPLATES];

        for(let i=0; i<2; i++){
            if (pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            const template = pool[idx];
            pool.splice(idx, 1);
            let quality = Math.random() < 0.2 ? 1.5 : 1.0;
            const newPart: ShipPart = {
                id: `rew_p_${Date.now()}_reroll_${i}`,
                type: template.type,
                name: template.name + (quality > 1 ? '+' : ''),
                description: template.description,
                slots: template.slots,
                multiplier: template.multiplier * quality,
                basePower: Math.floor(template.basePower * quality),
                hp: 10,
                specialEffect: template.specialEffect
            };
            opts.push(newPart);
        }
        setRewardOptions(opts);
        audioService.playSound('select');
    };

    const handleStorePart = () => {
        if (!pendingPart) return;
        setPlayer(prev => ({
            ...prev,
            partInventory: [...prev.partInventory, pendingPart]
        }));
        setPendingPart(null);
        audioService.playSound('select');
        
        if (phase === 'REWARD_EQUIP') {
             startVacation();
        } else {
             setVacationLog(`パーツを「${pendingPart.name}」を格納庫へ送りました。`);
        }
    };

    const generateVacationEvents = () => {
        const events: VacationEvent[] = [];
        const count = 3 + Math.floor(Math.random() * 2); 
        
        for (let i = 0; i < count; i++) {
            const template = VACATION_EVENTS_DB[Math.floor(Math.random() * VACATION_EVENTS_DB.length)];
            events.push({
                ...template,
                id: `vac_${Date.now()}_${i}`
            });
        }
        setVacationEvents(events);
    };

    const startVacation = () => {
        const days = 4 + Math.floor(Math.random() * 3); 
        setPlayer(prev => ({ ...prev, vacationDays: days }));
        setVacationLog("戦闘お疲れ様！休暇を楽しんでください。");
        generateVacationEvents();
        setPhase('VACATION');
        audioService.playBGM('paper_plane_vacation'); // Already set but good for re-entry
    };

    const executeVacationEvent = (event: VacationEvent) => {
        if (event.coinCost && event.coinCost > 0) {
            if (player.starCoins < event.coinCost) {
                setVacationLog(`スターコインが足りません！ (${event.coinCost}必要)`);
                audioService.playSound('wrong');
                return;
            }
        }
        
        if (player.vacationDays < event.cost) {
            setVacationLog("休暇日数が足りません！");
            audioService.playSound('wrong');
            return;
        }

        let discount = 1;
        player.talents.forEach(t => { if(t.effectType==='SHOP_DISCOUNT') discount -= (t.value/100); });
        discount = Math.max(0.1, discount);
        const finalCoinCost = event.coinCost ? Math.floor(event.coinCost * discount) : 0;

        setPlayer(prev => ({ 
            ...prev, 
            vacationDays: prev.vacationDays - event.cost,
            starCoins: prev.starCoins - finalCoinCost
        }));
        
        let resultMsg = "";
        
        switch (event.type) {
            case 'REPAIR':
                setPlayer(prev => {
                    let newMax = prev.maxHp;
                    const heal = event.tier === 1 ? 10 : 999;
                    if (event.tier === 3) newMax += 5;
                    return { ...prev, maxHp: newMax, hp: Math.min(newMax, prev.hp + heal) };
                });
                resultMsg = "機体を修理しました。リフレッシュ！";
                audioService.playSound('buff');
                break;
            case 'FUEL':
                setPlayer(prev => {
                    let newMax = prev.maxFuel;
                    const fuel = MAX_FUEL; 
                    if (event.value) newMax += event.value;
                    return { ...prev, maxFuel: newMax, fuel: Math.min(newMax, prev.fuel + fuel) };
                });
                resultMsg = "燃料タンクを満タンにしました！" + (event.value ? ` (上限+${event.value})` : "");
                audioService.playSound('buff');
                break;
            case 'COIN':
                const coin = event.tier * 50;
                setPlayer(p => ({ ...p, starCoins: p.starCoins + coin }));
                resultMsg = `スターコインを ${coin} 獲得！`;
                audioService.playSound('select');
                break;
            case 'ENERGY':
                setPool(prev => ({
                    ...prev,
                    genNumbers: [...prev.genNumbers, event.tier === 2 ? 6 : 5],
                    genColors: [...prev.genColors, event.tier === 2 ? 'ORANGE' : 'BLUE']
                }));
                resultMsg = "エネルギー生成プールを強化しました！";
                audioService.playSound('buff');
                break;
            case 'TREASURE':
                setPlayer(p => ({ ...p, passivePower: p.passivePower + 1 }));
                resultMsg = "謎の宝物により、全パーツの出力が+1されました！";
                audioService.playSound('win');
                break;
            case 'PARTS':
            case 'SHOP': 
                const template = PART_TEMPLATES[Math.floor(Math.random() * PART_TEMPLATES.length)];
                let quality = event.tier === 3 ? 1.5 : 1.0;
                if (event.type === 'SHOP') quality = 1.3; 
                const newPart: ShipPart = {
                    id: `new_p_${Date.now()}`,
                    type: template.type,
                    name: template.name + (quality > 1 ? '+' : ''),
                    description: template.description,
                    slots: template.slots,
                    multiplier: template.multiplier * quality,
                    basePower: Math.floor(template.basePower * quality),
                    hp: 10,
                    specialEffect: template.specialEffect
                };
                setPendingPart(newPart);
                resultMsg = `「${newPart.name}」を入手！交換するスロットを選んでください。`;
                audioService.playSound('select');
                break;
            case 'ENHANCE':
                setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + 20 })); 
                resultMsg = "特別改造完了！HP上限+20";
                audioService.playSound('buff');
                break;
            case 'TRAINING':
                setPlayer(prev => ({ ...prev, passivePower: prev.passivePower + 1 }));
                resultMsg = "厳しい訓練の成果！全出力+1";
                audioService.playSound('buff');
                break;
            case 'SACRIFICE':
                if (player.maxFuel <= 1) {
                     setVacationLog("これ以上燃料を減らせません！");
                     audioService.playSound('wrong');
                     return; // Don't consume event
                }
                setPlayer(prev => ({
                    ...prev,
                    maxFuel: prev.maxFuel - 1,
                    fuel: Math.min(prev.maxFuel - 1, prev.fuel),
                    passivePower: prev.passivePower + (event.value || 1)
                }));
                resultMsg = "燃料タンクを代償に、禁断の力を得た...";
                audioService.playSound('debuff'); // Use debuff sound for sacrifice feel
                break;
            case 'GAMBLE':
                if (Math.random() < 0.5) {
                     const reward = event.value || 100;
                     setPlayer(p => ({ ...p, starCoins: p.starCoins + reward }));
                     resultMsg = `大勝利！コインを${reward}獲得！`;
                     audioService.playSound('win');
                } else {
                     resultMsg = "賭けに負けた... 何も得られなかった。";
                     audioService.playSound('lose');
                }
                break;
            case 'UNKNOWN':
                if (Math.random() < 0.5) {
                    setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + 20)}));
                    resultMsg = "温泉を見つけた！HP回復。";
                } else {
                    setPlayer(p => ({...p, starCoins: p.starCoins + 100}));
                    resultMsg = "埋蔵金を発掘！100コイン。";
                }
                audioService.playSound('select');
                break;
            default:
                resultMsg = "リフレッシュしました。";
                break;
        }

        setVacationLog(resultMsg);
        setVacationEvents(prev => prev.filter(e => e.id !== event.id));
    };

    const handlePartEquip = (slotIdx: number) => {
        if (!pendingPart) return;
        
        const newParts = [...player.parts];
        newParts[slotIdx] = { ...pendingPart, id: `p_${Date.now()}_${slotIdx}` }; 
        
        setPlayer(prev => ({ ...prev, parts: newParts }));
        setPendingPart(null);
        audioService.playSound('buff');

        if (phase === 'REWARD_EQUIP') {
             startVacation();
        } else {
             setVacationLog(`パーツを「${pendingPart.name}」に換装しました！`);
        }
    };

    const handleHangarAction = (loc: 'SHIP' | 'INV', idx: number) => {
        if (!hangarSelection) {
            setHangarSelection({ loc, idx });
            audioService.playSound('select');
            return;
        }

        if (hangarSelection.loc === loc && hangarSelection.idx === idx) {
            setHangarSelection(null);
            return;
        }

        const newPlayer = { ...player };
        const parts = [...newPlayer.parts];
        const inventory = [...newPlayer.partInventory];

        const sourcePart = hangarSelection.loc === 'SHIP' ? parts[hangarSelection.idx] : inventory[hangarSelection.idx];
        const targetPart = loc === 'SHIP' ? parts[idx] : inventory[idx];

        if (hangarSelection.loc === 'SHIP' && loc === 'SHIP') {
            parts[hangarSelection.idx] = targetPart;
            parts[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'INV') {
            inventory[hangarSelection.idx] = targetPart;
            inventory[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'SHIP') {
            parts[idx] = sourcePart;
            
            if (targetPart.type === 'EMPTY') {
                inventory.splice(hangarSelection.idx, 1);
            } else {
                inventory[hangarSelection.idx] = targetPart;
            }
        } else if (hangarSelection.loc === 'SHIP' && loc === 'INV') {
            if (sourcePart.type === 'EMPTY') {
                setHangarSelection(null);
                return;
            }
            parts[hangarSelection.idx] = targetPart;
            inventory[idx] = sourcePart;
        }
        
        setPlayer({ ...newPlayer, parts, partInventory: inventory });
        setHangarSelection(null);
        audioService.playSound('buff');
    };

    const handleUnequip = () => {
        if (hangarSelection && hangarSelection.loc === 'SHIP') {
            const newPlayer = { ...player };
            const part = newPlayer.parts[hangarSelection.idx];
            if (part.type !== 'EMPTY') {
                newPlayer.parts[hangarSelection.idx] = createEmptyPart(`empty_${Date.now()}`);
                newPlayer.partInventory.push(part);
                setPlayer(newPlayer);
                audioService.playSound('select');
            }
            setHangarSelection(null);
        }
    };

    const endVacation = () => {
        if (pendingPart) {
            setVacationLog("パーツ交換を完了するかキャンセルしてください！");
            return;
        }
        setStage(s => s + 1);
        initBattle(stage + 1);
    };

    const handlePhaseComplete = (isVictory: boolean = false) => {
        if (isVictory) {
            const persistentHand = hand.filter(c => !c.isTemporary);
            setPool(current => ({
                ...current,
                coolNumbers: [...current.coolNumbers, ...persistentHand.map(c => c.value)],
                coolColors: [...current.coolColors, ...persistentHand.map(c => c.color)]
            }));
            setHand([]);
            
            // Re-load progress to ensure consistency
            const currentProgress = loadProgress();
            const newProgress = { ...currentProgress };
            newProgress.rank = (newProgress.rank || 1) + 1;
            
            // Record Max Level
            const shipId = selectedShipId;
            const currentMax = newProgress.maxClearedLevel[shipId] ?? -1; 
            
            if (selectedMissionLevel > currentMax) {
                newProgress.maxClearedLevel[shipId] = selectedMissionLevel;
                // Award Rerolls for high level clear
                if (selectedMissionLevel >= 1) newProgress.rerollCount += 1;
                if (selectedMissionLevel >= 5) newProgress.rerollCount += 2;
            }
            
            setProgress(newProgress);
            storageService.savePaperPlaneProgress(newProgress);
        }
    };

    const activateEndlessMode = () => {
        setIsEndless(true);
        setPhase('REWARD_SELECT');
        setupRewardPhase();
    };

    // --- RENDER HELPERS ---

    const RenderTooltip = () => {
        if (!tooltipPart) return null;
        
        const getTypeDescription = (part: ShipPart) => {
            if (part.specialEffect === 'RANK_UP') {
                 return 'エネルギーを消費して「カード」を生成します。\nシールドや攻撃力は発生しません。';
            }
            if (part.specialEffect === 'HEAL') {
                return '出力は「シールド」になります。\nさらに、スロットが埋まると船体のHPを回復します。';
            }

            switch(part.type) {
                case 'CANNON': return '出力は「攻撃力」になります。\n敵の耐久値を削り、HPにダメージを与えます。';
                case 'MISSILE': return '出力は「攻撃力」になります。\nキャノンと同様ですが、青/橙エネルギーを使う高火力なものが多いです。';
                case 'SHIELD': return '出力は「シールド」になります。\n敵の攻撃ダメージを軽減します。';
                case 'ENGINE': return '出力は「シールド」に変換され、さらに出力の50%分「燃料」を回復します。\n回避と防御を両立する重要パーツです。';
                case 'AMPLIFIER': return '隣接するパーツ(上下左右)の出力を強化します。\nこれ自体は攻撃や防御を行いません。';
                default: return '';
            }
        };

        return (
            <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setTooltipPart(null)}>
                <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setTooltipPart(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                    
                    <div className="mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            tooltipPart.type === 'CANNON' ? 'bg-red-900 text-red-200' :
                            tooltipPart.type === 'MISSILE' ? 'bg-orange-900 text-orange-200' :
                            tooltipPart.type === 'SHIELD' ? 'bg-blue-900 text-blue-200' :
                            tooltipPart.type === 'ENGINE' ? 'bg-emerald-900 text-emerald-200' :
                            'bg-purple-900 text-purple-200'
                        }`}>
                            {tooltipPart.type} TYPE
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{tooltipPart.name}</h3>
                    
                    <div className="text-sm text-gray-300 mb-4 min-h-[3em]">{tooltipPart.description || "詳細なし"}</div>
                    
                    <div className="bg-slate-700/50 p-2 rounded mb-4 text-xs text-white whitespace-pre-wrap border-l-2 border-yellow-500">
                        {getTypeDescription(tooltipPart)}
                    </div>

                    <div className="bg-black/40 p-2 rounded text-xs text-cyan-300 font-mono">
                        {tooltipPart.specialEffect === 'RANK_UP' ? (
                             <>
                                <div>生成ランク補正: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    投入したカードを消費せず、<br/>ランクを上げて手札に加えます(一時的)。
                                </div>
                             </>
                        ) : tooltipPart.type !== 'AMPLIFIER' ? (
                            <>
                                <div>倍率: x{tooltipPart.multiplier}</div>
                                <div>起動ボーナス: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    Output = (Energy * {tooltipPart.multiplier}) + {tooltipPart.basePower}(if full)
                                    {player.passivePower > 0 && <div className="text-purple-400">+ {player.passivePower} (Passive)</div>}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>強化ボーナス: +{tooltipPart.basePower}</div>
                                <div className="mt-2 text-gray-500">
                                    隣接するパーツ(上下左右)の出力を加算します。<br/>
                                    ※エネルギー充填時のみ有効
                                </div>
                            </>
                        )}
                        {tooltipPart.specialEffect === 'HEAL' && <div className="text-green-400 mt-2 font-bold">HP自動回復機能付き</div>}
                        {tooltipPart.specialEffect === 'RECYCLE' && <div className="text-teal-400 mt-2 font-bold">エネルギー回収機能付き</div>}
                        {tooltipPart.specialEffect === 'THORNS' && <div className="text-red-400 mt-2 font-bold">反撃ダメージ (被弾時、防御出力の半分を敵に返す)</div>}
                    </div>
                </div>
            </div>
        );
    };

    const renderGridRow = (rowIndex: number) => {
        const pRelIdx = rowIndex - player.yOffset;
        const inShip = pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT;
        const partsToRender = inShip ? player.parts.slice(pRelIdx * 3, pRelIdx * 3 + 3) : [];
        const eRelIdx = rowIndex - enemy.yOffset;
        
        // Enemy is also 3x3 now
        const eInShip = eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT;
        const ePartsToRender = eInShip ? enemy.parts.slice(eRelIdx * 3, eRelIdx * 3 + 3) : [];

        const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === rowIndex);
        
        let prediction = null;
        let pPower = 0;
        
        const buffGrid = calculateBuffGrid(player.parts);
        const enemyBuffGrid = calculateBuffGrid(enemy.parts); // Calculate enemy buffs

        partsToRender.forEach((p, colIdx) => {
             const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
             if (energySum > 0 && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                 let output = Math.floor(energySum * p.multiplier);
                 const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                 if(isFull) output += p.basePower;
                 output += player.passivePower; 
                 output += buffGrid[pRelIdx][colIdx];
                 pPower += output;
             }
        });

        let ePower = 0;
        if (intent && intent.type === 'ATTACK' && !enemy.isStunned) ePower = intent.value;
        
        if (pPower > 0 || ePower > 0) {
            if (pPower > ePower) {
                prediction = <div className="text-cyan-400 font-bold flex items-center animate-pulse"><span className="text-xl">{pPower - ePower}</span> <ChevronsRight size={24}/></div>;
            } else if (ePower > pPower) {
                prediction = <div className="text-red-500 font-bold flex items-center animate-pulse"><ChevronsLeft size={24}/> <span className="text-xl">{ePower - pPower}</span></div>;
            } else {
                prediction = <div className="text-gray-400 font-bold text-xl">X</div>;
            }
        }

        // Calculate Ascension Bonus
        let ascensionBonus = 0;
        if (selectedMissionLevel >= 1) ascensionBonus += 1;
        if (selectedMissionLevel >= 6) ascensionBonus += 1;

        return (
            <div key={rowIndex} className="flex items-center h-20 md:h-24 border-b border-white/10 relative">
                <div className="w-1/2 flex justify-end pr-2 border-r border-dashed border-white/20 relative">
                    {inShip ? (
                        <div className="flex gap-1 w-full justify-end">
                            {partsToRender.map((part, i) => (
                                <div key={part.id} className="w-1/3 max-w-[80px]">
                                    <ShipPartView 
                                        part={part} 
                                        onClick={() => handlePartClick((pRelIdx * 3) + i)} 
                                        onLongPress={(p) => setTooltipPart(p)}
                                        highlight={!!selectedCardId}
                                        pendingReplace={!!pendingPart}
                                        bonusPower={buffGrid[pRelIdx][i] + player.passivePower} // Include passive power for player too
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>
                <div className="w-16 md:w-24 relative flex items-center justify-center shrink-0">
                    {prediction ? prediction : (enemy.isStunned && eInShip ? <div className="text-yellow-500 font-bold text-xs">STUNNED</div> : null)}
                </div>
                <div className="w-1/2 pl-2 border-l border-dashed border-white/20">
                    {eInShip ? (
                        <div className="flex gap-1 w-full justify-start">
                            {ePartsToRender.map((part, i) => {
                                // Only apply ascension bonus to offensive parts
                                const isOffensive = part.type === 'CANNON' || part.type === 'MISSILE';
                                const totalBonus = enemyBuffGrid[eRelIdx][i] + (isOffensive ? ascensionBonus : 0);
                                
                                return (
                                    <div key={part.id} className="w-1/3 max-w-[80px] opacity-90">
                                        <ShipPartView 
                                            part={part} 
                                            isEnemy={true}
                                            showPower={true} 
                                            bonusPower={totalBonus}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    
    if (phase === 'SETUP') {
        const unlockedShips = SHIPS.filter(s => progress.rank >= s.unlockRank);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-4 flex flex-col font-mono overflow-y-auto">
                <div className="flex items-center mb-6">
                     <button onClick={onBack} className="text-gray-400 hover:text-white mr-4"><ArrowLeft/></button>
                     <h2 className="text-2xl font-bold text-cyan-400">MISSION BRIEFING</h2>
                     <div className="ml-auto text-sm bg-indigo-900 px-3 py-1 rounded-full border border-indigo-500 flex items-center">
                         <Star size={14} className="mr-1 text-yellow-400"/> ランク: {progress.rank}
                     </div>
                </div>

                <div className="flex justify-center mb-8 gap-4 border-b border-gray-700 pb-2">
                     <button onClick={() => setSetupStep('SHIP')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='SHIP'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>機体</button>
                     <button onClick={() => setSetupStep('PILOT')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='PILOT'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>パイロット</button>
                     <button onClick={() => setSetupStep('MISSION')} className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${setupStep==='MISSION'?'bg-cyan-700 text-white':'bg-slate-800 text-gray-500'}`}>任務</button>
                </div>

                <div className="flex-1 max-w-4xl mx-auto w-full">
                    {setupStep === 'SHIP' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {SHIPS.map(ship => {
                                 const isUnlocked = progress.rank >= ship.unlockRank;
                                 return (
                                     <div 
                                        key={ship.id} 
                                        onClick={() => isUnlocked && setSelectedShipId(ship.id)}
                                        className={`border-2 p-6 rounded-xl flex flex-col items-center cursor-pointer transition-all relative overflow-hidden ${selectedShipId === ship.id ? 'border-cyan-400 bg-slate-800 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-slate-600 bg-slate-900 hover:bg-slate-800'} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                                     >
                                         <div className={`w-full h-32 ${ship.color} mb-4 rounded-lg flex items-center justify-center relative`}>
                                             <Send size={48} className="text-white"/>
                                             {!isUnlocked && <Lock size={32} className="absolute text-gray-300"/>}
                                         </div>
                                         <h3 className="text-xl font-bold mb-2">{ship.name}</h3>
                                         <p className="text-sm text-gray-400 text-center mb-4 min-h-[3em]">{ship.description}</p>
                                         {!isUnlocked ? (
                                             <div className="text-red-400 text-xs font-bold">ランク {ship.unlockRank} で解放</div>
                                         ) : (
                                             <div className="text-green-400 text-xs font-bold">選択可能</div>
                                         )}
                                     </div>
                                 )
                             })}
                             <div className="col-span-full text-center mt-4">
                                <button onClick={() => setSetupStep('PILOT')} className="bg-cyan-600 hover:bg-cyan-500 px-12 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">次へ</button>
                             </div>
                         </div>
                    )}

                    {setupStep === 'PILOT' && (
                        <div className="flex flex-col items-center">
                            <div className="flex justify-between w-full mb-4 px-4 bg-slate-800 p-2 rounded">
                                <span className="text-sm text-gray-400">現在のリロール回数</span>
                                <span className="font-bold text-yellow-400 flex items-center"><RefreshCw size={14} className="mr-1"/> {progress.rerollCount}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
                                {pilotOptions.map((pilot, i) => (
                                    <div 
                                        key={i}
                                        className={`relative border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedPilotIndex === i ? 'border-yellow-400 bg-slate-800 shadow-lg scale-105' : 'border-slate-600 bg-slate-900 hover:border-slate-400'}`}
                                        onClick={() => setSelectedPilotIndex(i)}
                                    >
                                        <div className="absolute top-2 right-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPinnedPilotIndex(pinnedPilotIndex === i ? null : i); }}
                                                className={`p-1.5 rounded-full ${pinnedPilotIndex === i ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-gray-400 hover:text-white'}`}
                                                title="固定する"
                                            >
                                                <User size={14}/>
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-center mb-4">
                                            <div className="w-16 h-16 mb-2">
                                                 <PixelSprite seed={pilot.id} name={pilot.spriteName} className="w-full h-full"/>
                                            </div>
                                            <div className="font-bold">{pilot.name}</div>
                                        </div>
                                        
                                        <div className="text-xs bg-black/40 p-2 rounded mb-2">
                                            <div className="font-bold text-yellow-300 mb-1">得意科目: {pilot.intrinsicTalent.name}</div>
                                            <div className="text-gray-400">{pilot.intrinsicTalent.description}</div>
                                        </div>
                                        
                                        {randomTalents.length > 0 && (
                                            <div className="text-xs bg-indigo-900/40 p-2 rounded">
                                                <div className="font-bold text-indigo-300 mb-1">委員会スキル</div>
                                                {randomTalents.map((t, idx) => (
                                                    <div key={idx} className="mb-1 last:mb-0">
                                                        <span className="text-white">{t.name}</span>: <span className="text-gray-400">{t.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={handleRerollPilots} 
                                    disabled={progress.rerollCount <= 0}
                                    className={`bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold flex items-center ${progress.rerollCount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <RefreshCw className="mr-2"/> 呼び直す
                                </button>
                                <button 
                                    onClick={() => setSetupStep('MISSION')} 
                                    disabled={selectedPilotIndex === -1}
                                    className={`bg-cyan-600 hover:bg-cyan-500 px-12 py-3 rounded-lg font-bold text-lg shadow-lg ${selectedPilotIndex === -1 ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
                                >
                                    次へ
                                </button>
                            </div>
                        </div>
                    )}

                    {setupStep === 'MISSION' && (
                        <div className="flex flex-col items-center max-w-lg mx-auto">
                            <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-600 text-center mb-8">
                                <h3 className="text-xl font-bold text-red-400 mb-2">難易度設定</h3>
                                <div className="flex items-center justify-center gap-6 my-6">
                                    <button 
                                        onClick={() => setSelectedMissionLevel(l => Math.max(0, l - 1))}
                                        className="bg-slate-700 p-3 rounded-full hover:bg-slate-600"
                                    >
                                        <ChevronsLeft/>
                                    </button>
                                    <div className="text-6xl font-black text-white w-20">{selectedMissionLevel}</div>
                                    <button 
                                        onClick={() => {
                                            const shipMax = progress.maxClearedLevel[selectedShipId] ?? -1;
                                            // Can select up to Max Cleared + 1
                                            if (selectedMissionLevel <= shipMax) {
                                                setSelectedMissionLevel(l => Math.min(9, l + 1));
                                            } else {
                                                audioService.playSound('wrong');
                                            }
                                        }}
                                        className={`bg-slate-700 p-3 rounded-full hover:bg-slate-600 ${(selectedMissionLevel > (progress.maxClearedLevel[selectedShipId] ?? -1)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <ChevronsRight/>
                                    </button>
                                </div>
                                <div className="text-sm text-gray-400 mb-4">
                                    {(progress.maxClearedLevel[selectedShipId] ?? -1) < selectedMissionLevel ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-red-500 font-bold mb-1">未クリア (挑戦中)</span>
                                            {selectedMissionLevel === (progress.maxClearedLevel[selectedShipId] ?? -1) + 1 && (
                                                <span className="text-xs text-yellow-400 animate-pulse">
                                                    このランクをクリアすると Lv{selectedMissionLevel + 1} が解放されます！
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-green-500 font-bold">クリア済み</span>
                                    )}
                                </div>
                                
                                <div className="bg-black/40 p-4 rounded text-left text-sm space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-400">敵攻撃力:</span> <span className="text-red-400">+{selectedMissionLevel >= 1 ? (selectedMissionLevel >= 6 ? '2' : '1') : '0'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">開始HP:</span> <span className="text-red-400">{selectedMissionLevel >= 2 ? (selectedMissionLevel >= 4 ? '-20%' : '-5') : '通常'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">敵耐久:</span> <span className="text-red-400">+{selectedMissionLevel >= 5 ? '強化' : '通常'}</span></div>
                                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold"><span className="text-yellow-400">クリア報酬:</span> <span className="text-white">リロール +{selectedMissionLevel >= 5 ? '2' : (selectedMissionLevel >= 1 ? '1' : '0')}</span></div>
                                </div>
                            </div>
                            
                            <button onClick={confirmSetup} className="bg-red-600 hover:bg-red-500 text-white w-full py-4 rounded-xl font-bold text-2xl shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse flex items-center justify-center">
                                <Target className="mr-2"/> 出撃開始
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (phase === 'TUTORIAL') {
        return (
            <div className="w-full h-full bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-mono">
                <Send size={64} className="text-cyan-400 mb-4 animate-bounce"/>
                <h1 className="text-4xl font-bold mb-4">紙飛行機バトル v3.0</h1>
                <div className="max-w-md text-sm text-gray-300 space-y-2 mb-8 bg-slate-800 p-4 rounded border border-slate-600">
                    <p>・機体は3x3のモジュールで構成されています。</p>
                    <p>・エネルギーの色には相性があります。</p>
                    <p className="text-yellow-400 font-bold">・オレンジ &gt; 青 &gt; 白 (白スロットには何色でもOK！)</p>
                    <p>・エネルギーを入れるだけで出力が出ます。</p>
                    <p>・全スロットを埋めると起動ボーナスが加算されます！</p>
                    <p className="text-purple-400 font-bold">・パイロットの才能で戦略が変わる！</p>
                    <p>・モジュール長押しで詳細を確認できます。</p>
                    <p className="text-green-400 font-bold">・戦闘後は「休暇」で機体を強化しよう！</p>
                    <p className="text-blue-400 font-bold mt-2">※オートセーブ機能搭載！</p>
                </div>
                <button onClick={() => { setPhase('SETUP'); initPilotRoll(); }} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-lg animate-pulse flex items-center">
                    <Play className="mr-2"/> 出撃準備
                </button>
                <button onClick={onBack} className="mt-4 text-gray-500 hover:text-white underline text-xs">戻る</button>
            </div>
        );
    }

    if (phase === 'REWARD_SELECT') {
         return (
             <div className="w-full h-full bg-black/90 text-white p-4 flex flex-col items-center justify-start md:justify-center font-mono z-50 relative overflow-y-auto py-8">
                 <RenderTooltip />
                 <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                 <h2 className="text-4xl font-bold mb-4 text-white">VICTORY!</h2>
                 <div className="text-yellow-300 text-2xl font-bold mb-4 flex items-center bg-black/50 px-6 py-2 rounded-full border border-yellow-500">
                     <Star size={24} className="mr-2 fill-current"/> +{earnedCoins}
                 </div>
                 
                 <div className="flex gap-4 mb-8">
                     <button 
                        onClick={handleRerollRewards} 
                        disabled={player.starCoins < 50} 
                        className={`bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center transition-colors border border-indigo-400 ${player.starCoins < 50 ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                         <RefreshCw className="mr-2" size={16}/> リロール (50 Coin)
                     </button>
                 </div>
                 
                 <p className="text-gray-300 mb-4">戦利品を選択してください (長押しで詳細)</p>
                 
                 <div className="flex flex-wrap gap-4 md:gap-8 justify-center mb-8 shrink-0">
                     {rewardOptions.map((part, i) => (
                         <div 
                            key={i} 
                            onClick={() => handleRewardSelect(part)}
                            className="bg-slate-800 border-2 border-cyan-500 p-4 rounded-xl w-32 md:w-48 flex flex-col items-center cursor-pointer hover:scale-105 hover:bg-slate-700 transition-all shadow-lg group"
                         >
                             <div className="w-16 h-16 mb-2">
                                 <ShipPartView part={part} onLongPress={(p) => setTooltipPart(p)} />
                             </div>
                             <div className="font-bold text-cyan-300 mb-1 text-sm md:text-base">{part.name}</div>
                             <div className="text-[10px] text-gray-400 text-center h-10 overflow-hidden leading-tight">{part.description}</div>
                             <button className="mt-2 bg-cyan-600 px-4 py-1 rounded text-xs font-bold group-hover:bg-cyan-500">獲得</button>
                         </div>
                     ))}
                 </div>
             </div>
         );
    }

    if (phase === 'REWARD_EQUIP') {
         const buffGrid = calculateBuffGrid(player.parts);

         return (
             <div className="w-full h-full bg-slate-900 text-white p-4 font-mono flex flex-col items-center relative overflow-y-auto">
                 <RenderTooltip />
                 <div className="text-center mb-6 mt-4">
                     <h2 className="text-2xl font-bold text-green-400 mb-2">パーツ換装</h2>
                     <p className="text-sm text-gray-300">新しいパーツをセットする場所を選んでください (長押しで詳細)</p>
                 </div>

                 {pendingPart && (
                     <div className="flex items-center gap-4 mb-8 bg-slate-800 p-3 rounded-lg border border-slate-600">
                         <div className="text-xs text-gray-400">NEW:</div>
                         <div className="w-16 h-16 md:w-20 md:h-20">
                             <ShipPartView part={pendingPart} onLongPress={(p) => setTooltipPart(p)} />
                         </div>
                         <div className="text-left">
                             <div className="font-bold text-white">{pendingPart.name}</div>
                             <div className="text-xs text-gray-400">{pendingPart.description}</div>
                         </div>
                     </div>
                 )}

                 <div className="bg-black/40 p-4 rounded-xl border-2 border-slate-700 mb-8 shrink-0">
                     <div className="grid grid-cols-3 gap-2">
                         {player.parts.map((p, i) => {
                             const r = Math.floor(i / SHIP_WIDTH);
                             const c = i % SHIP_WIDTH;
                             return (
                                 <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                     <ShipPartView 
                                         part={p} 
                                         pendingReplace={true} 
                                         onLongPress={(p) => setTooltipPart(p)} 
                                         bonusPower={buffGrid[r][c] + player.passivePower} 
                                     />
                                 </div>
                             );
                         })}
                     </div>
                 </div>

                 <div className="flex gap-4 shrink-0 pb-8">
                     <button onClick={handleStorePart} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center">
                         <Archive size={20} className="mr-2"/> 格納庫に保管
                     </button>
                     <button onClick={handleDiscardReward} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center">
                         <Trash2 size={20} className="mr-2"/> 破棄して進む
                     </button>
                 </div>
             </div>
         );
    }

    if (phase === 'HANGAR') {
        const buffGrid = calculateBuffGrid(player.parts);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-4 font-mono flex flex-col items-center relative overflow-hidden">
                <RenderTooltip />
                <div className="text-center mb-4 mt-2 shrink-0">
                    <h2 className="text-2xl font-bold text-orange-400 mb-2 flex items-center justify-center"><Settings className="mr-2"/> 機体改造 (Hangar)</h2>
                    <p className="text-sm text-gray-300">船と格納庫のパーツを入れ替えます</p>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-5xl overflow-hidden min-h-0">
                    {/* Ship Grid */}
                    <div className="flex-shrink-0 md:flex-1 flex flex-col items-center bg-black/40 p-2 md:p-4 rounded-xl border-2 border-slate-700 overflow-y-auto md:overflow-visible">
                        <div className="text-cyan-300 font-bold mb-4 flex items-center"><Send className="mr-2"/> SHIP</div>
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                            {player.parts.map((p, i) => {
                                const r = Math.floor(i / SHIP_WIDTH);
                                const c = i % SHIP_WIDTH;
                                return (
                                    <div key={i} className="w-16 h-16 md:w-24 md:h-24 relative">
                                        <ShipPartView 
                                            part={p} 
                                            onClick={() => handleHangarAction('SHIP', i)} 
                                            onLongPress={(p) => setTooltipPart(p)}
                                            highlight={hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i}
                                            bonusPower={buffGrid[r][c] + player.passivePower}
                                        />
                                        {hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i && (
                                            <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse pointer-events-none rounded"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {hangarSelection?.loc === 'SHIP' && player.parts[hangarSelection.idx].type !== 'EMPTY' && (
                             <button onClick={handleUnequip} className="mt-6 bg-red-800 hover:bg-red-700 text-white px-6 py-2 rounded font-bold text-sm border border-red-500 flex items-center">
                                 <Download className="mr-2" size={16}/> 外す (Unequip)
                             </button>
                        )}
                    </div>

                    {/* Inventory */}
                    <div className="flex-1 flex flex-col items-center bg-black/40 p-2 md:p-4 rounded-xl border-2 border-slate-700 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="text-orange-300 font-bold mb-4 flex items-center"><Archive className="mr-2"/> INVENTORY</div>
                        {player.partInventory.length === 0 ? (
                            <div className="text-gray-500 italic mt-8">Empty</div>
                        ) : (
                            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                                {player.partInventory.map((p, i) => (
                                    <div key={i} className="w-16 h-16 md:w-24 md:h-24 relative">
                                        <ShipPartView 
                                            part={p} 
                                            onClick={() => handleHangarAction('INV', i)} 
                                            onLongPress={(p) => setTooltipPart(p)}
                                            highlight={hangarSelection?.loc === 'INV' && hangarSelection.idx === i}
                                        />
                                        {hangarSelection?.loc === 'INV' && hangarSelection.idx === i && (
                                            <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse pointer-events-none rounded"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={() => { setPhase('VACATION'); setHangarSelection(null); }} className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center mt-4 shrink-0">
                    <ArrowLeft size={20} className="mr-2"/> 休暇に戻る
                </button>
            </div>
        );
    }

    if (phase === 'VACATION') {
        const buffGrid = calculateBuffGrid(player.parts);

        return (
            <div className="w-full h-full bg-slate-900 text-white p-2 md:p-4 font-mono relative overflow-hidden flex flex-col">
                <RenderTooltip />
                {/* Pool Overlay */}
                {showPool && <PoolView pool={pool} onClose={() => setShowPool(false)} />}
                
                <div className="flex justify-between items-center mb-2 bg-slate-800 p-3 rounded-lg shadow-lg shrink-0">
                    <h2 className="text-lg md:text-2xl font-bold flex items-center text-cyan-300"><Calendar className="mr-2" size={20}/> <span className="hidden md:inline">休暇モード</span><span className="md:hidden">休暇</span></h2>
                    <div className="flex gap-2 md:gap-4 text-sm">
                        <button onClick={() => setShowPool(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-xs border border-indigo-400 transition-colors shadow-sm font-bold">
                            <Layers size={14} /> <span className="hidden md:inline">POOL</span>
                        </button>
                        <div className="flex items-center text-yellow-400 font-bold"><Star className="mr-1" size={16}/> {player.starCoins}</div>
                        <div className="flex items-center text-orange-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-orange-500/50">残{player.vacationDays}日</div>
                    </div>
                </div>

                {/* Status Strip */}
                <div className="bg-black/40 p-2 rounded-lg border border-slate-700 text-xs md:text-sm flex justify-around mb-2 shrink-0 shadow-inner">
                    <div className="flex items-center gap-1"><span>HP:</span> <span className="text-green-400 font-bold">{player.hp}/{player.maxHp}</span></div>
                    <div className="flex items-center gap-1"><span>燃料:</span> <span className="text-orange-400 font-bold">{player.fuel}/{player.maxFuel}</span></div>
                    <div className="flex items-center gap-1"><span>Pwr:</span> <span className="text-purple-400 font-bold">+{player.passivePower}</span></div>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
                    {/* Event Selection Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/20 rounded-lg p-2 border border-slate-800/50">
                        {pendingPart ? (
                            <div className="bg-slate-800 border-2 border-green-500 p-4 rounded-lg animate-in zoom-in flex flex-col items-center justify-center min-h-full">
                                <div className="text-center font-bold text-green-400 mb-2 text-lg">NEW PARTS!</div>
                                <div className="w-24 h-24 mb-4">
                                    <ShipPartView part={pendingPart} onLongPress={(p) => setTooltipPart(p)} />
                                </div>
                                <div className="text-sm text-center mb-4">入れ替えるスロットを選択してください</div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-black/50 rounded border border-slate-600">
                                    {player.parts.map((p, i) => {
                                        const r = Math.floor(i / SHIP_WIDTH);
                                        const c = i % SHIP_WIDTH;
                                        return (
                                            <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                                <ShipPartView part={p} pendingReplace={true} onLongPress={(p) => setTooltipPart(p)} bonusPower={buffGrid[r][c] + player.passivePower}/>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="flex gap-4">
                                    <button onClick={handleStorePart} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center">
                                        <Archive size={20} className="mr-2"/> 保管
                                    </button>
                                    <button onClick={() => setPendingPart(null)} className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-500 font-bold flex items-center justify-center shadow-lg">
                                        <Trash2 size={20} className="mr-2"/> 破棄
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-20">
                                {vacationEvents.map(event => (
                                    <button 
                                        key={event.id}
                                        onClick={() => executeVacationEvent(event)}
                                        disabled={player.vacationDays < event.cost || (event.coinCost ? player.starCoins < event.coinCost : false)}
                                        className={`
                                            bg-slate-800 border-2 rounded-xl p-3 flex flex-col items-center text-center relative group transition-all min-h-[120px] justify-between
                                            ${(player.vacationDays < event.cost || (event.coinCost ? player.starCoins < event.coinCost : false)) ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-slate-600 hover:border-cyan-400 hover:bg-slate-700 hover:-translate-y-1 shadow-lg'}
                                        `}
                                    >
                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                            {event.cost > 0 && (
                                                <div className="text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded text-orange-300 border border-orange-500/30">
                                                    {event.cost}日
                                                </div>
                                            )}
                                            {event.coinCost && event.coinCost > 0 && (
                                                <div className="text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                                                    <Star size={8} fill="currentColor"/> {event.coinCost}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 mb-2 p-2 bg-black/30 rounded-full border border-slate-600">
                                            {event.type === 'REPAIR' && <Hammer size={20} className="text-green-400"/>}
                                            {event.type === 'FUEL' && <Fuel size={20} className="text-orange-400"/>}
                                            {event.type === 'ENERGY' && <Zap size={20} className="text-yellow-400"/>}
                                            {event.type === 'PARTS' && <Box size={20} className="text-cyan-400"/>}
                                            {event.type === 'COIN' && <Star size={20} className="text-yellow-200"/>}
                                            {event.type === 'TREASURE' && <Gift size={20} className="text-purple-400"/>}
                                            {event.type === 'UNKNOWN' && <HelpCircle size={20} className="text-gray-400"/>}
                                            {event.type === 'ENHANCE' && <RefreshCw size={20} className="text-pink-400"/>}
                                            {event.type === 'SHOP' && <ShoppingBag size={20} className="text-blue-400"/>}
                                            {event.type === 'MODIFY' && <Palette size={20} className="text-indigo-400"/>}
                                            {event.type === 'TRAINING' && <Activity size={20} className="text-red-400"/>}
                                            {event.type === 'SACRIFICE' && <Skull size={20} className="text-red-600"/>}
                                            {event.type === 'GAMBLE' && <Dice5 size={20} className="text-violet-400"/>}
                                        </div>
                                        <div className="w-full">
                                            <div className="font-bold text-sm mb-1 truncate text-cyan-100">{event.name}</div>
                                            <div className="text-[10px] text-gray-400 leading-tight line-clamp-2 min-h-[2.5em]">{event.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="md:w-80 flex flex-col gap-2 shrink-0">
                        <button 
                            onClick={() => { setPhase('HANGAR'); setHangarSelection(null); }} 
                            disabled={!!pendingPart}
                            className={`w-full py-3 rounded-lg font-bold text-md shadow-lg flex items-center justify-center border-2 border-orange-700/50 ${!!pendingPart ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-orange-300'}`}
                        >
                            <Settings className="mr-2" size={18}/> 機体改造 (Hangar)
                        </button>

                        <div className="bg-slate-900 border border-slate-700 p-2 rounded h-20 md:h-24 overflow-y-auto text-xs text-cyan-200 font-mono custom-scrollbar shadow-inner">
                            {vacationLog}
                        </div>

                        <button onClick={endVacation} disabled={!!pendingPart} className={`w-full py-3 md:py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center border-b-4 border-black/20 active:border-0 active:translate-y-1 transition-all ${!!pendingPart ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white animate-pulse'}`}>
                            出発する <ArrowRight className="ml-2"/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#101018] text-white flex flex-col font-mono relative overflow-hidden">
            <RenderTooltip />
            {/* Pool Overlay */}
            {showPool && <PoolView pool={pool} onClose={() => setShowPool(false)} />}
            
            {/* Game Help Modal */}
            {showGameHelp && (
                 <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setShowGameHelp(false)}>
                    <div className="bg-slate-800 border-2 border-yellow-500 p-6 rounded-lg max-w-lg w-full shadow-2xl relative text-sm max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowGameHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center"><HelpCircle className="mr-2"/> ゲームマニュアル</h2>
                        
                        <div className="space-y-6 text-gray-300">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Settings className="mr-2 text-cyan-400"/> 機体構築</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>機体は<strong>3x3</strong>のグリッドで構成されます。</li>
                                    <li>パーツには<strong>スロット</strong>があり、手札のエネルギーカードをはめることで起動します。</li>
                                    <li><strong>色相性:</strong> <span className="text-orange-400 font-bold">橙</span> &gt; <span className="text-blue-400 font-bold">青</span> &gt; <span className="text-slate-200 font-bold">白</span>。上位の色は下位のスロットにも使えます。</li>
                                    <li>スロットを全て埋めると<strong>起動ボーナス</strong>が発生します。</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><Swords className="mr-2 text-red-400"/> 戦闘システム</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>クラッシュバトル:</strong> 自機と敵機の同じ行(Row)同士がぶつかり合います。</li>
                                    <li>出力の高い方が、差分をダメージとして相手に与えます。</li>
                                    <li><strong>FIREボタン:</strong> 攻撃を実行し、ターンを進めます。</li>
                                    <li><strong>移動:</strong> 上下に移動して敵の攻撃を避けたり、有利な位置を取りましょう（燃料消費）。</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-600 pb-1 flex items-center"><ShoppingBag className="mr-2 text-green-400"/> 休暇パート</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>ステージクリア後は休暇パートに入ります。</li>
                                    <li><strong>日数</strong>を消費して修理や強化を行います。</li>
                                    <li><strong>ショップ:</strong> スターコインを使って強力なパーツを購入できます。</li>
                                    <li><strong>格納庫:</strong> パーツの配置換えや保管ができます。</li>
                                </ul>
                            </section>
                        </div>
                        
                        <button onClick={() => setShowGameHelp(false)} className="mt-8 w-full bg-cyan-700 hover:bg-cyan-600 py-3 rounded text-white font-bold">閉じる</button>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="h-12 bg-black border-b border-cyan-900 flex justify-between items-center px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-green-400 font-bold"><Heart size={16} className="mr-1"/> {player.hp}/{player.maxHp}</div>
                    <div className="flex items-center text-orange-400 font-bold"><Wind size={16} className="mr-1"/> {player.fuel}/{player.maxFuel}</div>
                </div>
                <div className="text-cyan-200 font-bold tracking-widest text-sm flex items-center">
                    STAGE {stage}
                    {isEndless && <span className="ml-2 text-purple-400 text-xs border border-purple-500 px-1 rounded">ENDLESS</span>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowGameHelp(true)} className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-700 flex items-center"><HelpCircle size={14} className="mr-1"/> HELP</button>
                    <button onClick={() => setShowPool(!showPool)} className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-700">POOL</button>
                </div>
            </div>

            {/* Battle Grid */}
            <div className="flex-1 relative bg-[#1a1a24] overflow-y-auto custom-scrollbar">
                {/* Clash Overlay */}
                <ClashOverlay clashState={clashState} />

                <div className="absolute inset-0 flex flex-col justify-center py-4 min-h-[400px]">
                    {[0,1,2,3,4].map(row => renderGridRow(row))}
                </div>

                {/* Enemy Status Float */}
                <div className="absolute top-2 right-2 bg-red-900/50 p-2 rounded border border-red-500/50 text-right z-20">
                    <div className="text-xs text-red-200">{enemy.isStunned ? "STUNNED" : "ENEMY"}</div>
                    <div className="text-lg font-bold">{enemy.hp} HP</div>
                    <div className="text-xs flex justify-end items-center gap-1 text-blue-300">
                        <Shield size={12}/> Def: {enemy.durability}/{enemy.maxDurability}
                    </div>
                    {/* Fuel Display */}
                    <div className="text-xs flex justify-end items-center gap-1 text-orange-300 mt-1">
                        <Fuel size={12}/> Fuel: {enemy.fuel}
                    </div>
                </div>

                {/* Logs */}
                <div className="absolute bottom-2 right-2 w-48 pointer-events-none opacity-70 z-20">
                    {logs.map((l, i) => <div key={i} className="text-[10px] text-right bg-black/50 mb-0.5 px-1 rounded">{l}</div>)}
                </div>
            </div>
            
            {/* Hand Help Tooltip */}
            {showHandHelp && (
                 <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowHandHelp(false)}>
                    <div className="bg-slate-800 border-2 border-cyan-500 p-6 rounded-lg max-w-sm w-full shadow-2xl relative text-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center"><Info className="mr-2"/> エネルギーカードの仕組み</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-300">
                            <li><span className="text-white font-bold">数値</span>: スロットに入れた時の出力パワーになります。</li>
                            <li><span className="text-white font-bold">色</span>: スロットの要求色に合わせる必要があります。</li>
                            <li><span className="text-orange-400 font-bold">オレンジ</span> &gt; <span className="text-blue-400 font-bold">青</span> &gt; <span className="text-slate-200 font-bold">白</span> の順でランクが高く、上位色は下位のスロットにも使用可能です。</li>
                        </ul>
                        <button onClick={() => setShowHandHelp(false)} className="mt-6 w-full bg-cyan-700 py-2 rounded text-white font-bold">閉じる</button>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="h-44 md:h-52 bg-[#0a0a10] border-t border-cyan-900 p-2 flex gap-2 shrink-0 z-20">
                {/* Movement Controls */}
                <div className="flex flex-col gap-2 justify-center w-14 md:w-16 shrink-0">
                    <button onClick={() => handleMove(-1)} className="flex-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:bg-cyan-900 flex items-center justify-center text-cyan-400 shadow-inner">
                        ▲
                    </button>
                    <button onClick={() => handleMove(1)} className="flex-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:bg-cyan-900 flex items-center justify-center text-cyan-400 shadow-inner">
                        ▼
                    </button>
                </div>

                {/* Hand */}
                <div className="flex-1 relative flex flex-col bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                    <div className="absolute top-1 right-1 z-20">
                         <button onClick={() => setShowHandHelp(true)} className="text-gray-500 hover:text-white"><HelpCircle size={14}/></button>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto px-2 py-1 custom-scrollbar">
                        {hand.map(card => (
                            <EnergyCardView 
                                key={card.id} 
                                card={card} 
                                onClick={() => handleCardSelect(card.id)} 
                                selected={selectedCardId === card.id}
                                small={true}
                            />
                        ))}
                        {hand.length === 0 && <div className="text-gray-600 text-xs w-full text-center mt-8">NO ENERGY</div>}
                    </div>
                </div>

                {/* End Turn */}
                <button 
                    onClick={resolveCombat} 
                    disabled={animating}
                    className="w-16 md:w-20 bg-red-900 hover:bg-red-800 border-2 border-red-600 rounded-lg flex flex-col items-center justify-center text-red-100 font-bold shadow-lg active:translate-y-1 transition-all"
                >
                    <RefreshCw size={24} className={animating ? "animate-spin" : ""}/>
                    <span className="text-[10px] mt-1">FIRE</span>
                </button>
            </div>

            {(phase === 'VICTORY' || phase === 'GAME_OVER') && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-slate-800 p-8 rounded-xl border-4 border-slate-600 text-center shadow-2xl">
                        {phase === 'VICTORY' && (
                            <>
                                <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce"/>
                                <h2 className="text-4xl font-bold text-white mb-2">MISSION COMPLETE</h2>
                                <p className="text-gray-400 mb-6">全ステージクリアおめでとう！</p>
                                <div className="flex flex-col gap-4">
                                    <button onClick={activateEndlessMode} className="bg-purple-600 px-8 py-3 rounded text-xl font-bold hover:bg-purple-500 border-2 border-purple-400 flex items-center justify-center animate-pulse">
                                        <Repeat className="mr-2" /> エンドレスモードへ
                                    </button>
                                    <button 
                                        onClick={returnToSetup} 
                                        className="bg-green-600 px-8 py-3 rounded text-xl font-bold hover:bg-green-500 border-2 border-green-400 flex items-center justify-center"
                                    >
                                        <Settings className="mr-2"/> 機体選択へ
                                    </button>
                                    <button onClick={onBack} className="bg-cyan-600 px-8 py-3 rounded text-xl font-bold border-2 border-cyan-400">タイトルへ戻る</button>
                                </div>
                            </>
                        )}
                        {phase === 'GAME_OVER' && (
                            <>
                                <Skull size={64} className="text-red-500 mx-auto mb-4"/>
                                <h2 className="text-4xl font-bold text-red-500 mb-2">DESTROYED</h2>
                                <p className="text-gray-400 mb-6">Stage {stage}</p>
                                <div className="flex flex-col gap-4">
                                    <button 
                                        onClick={returnToSetup}
                                        className="bg-green-600 px-8 py-3 rounded text-xl font-bold hover:bg-green-500 border-2 border-green-400 flex items-center justify-center"
                                    >
                                        <Settings className="mr-2"/> 機体選択へ
                                    </button>
                                    <button onClick={onBack} className="mt-2 bg-gray-600 px-8 py-3 rounded text-xl font-bold">タイトルへ戻る</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaperPlaneBattle;
