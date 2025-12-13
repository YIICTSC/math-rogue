
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Wind, Trophy, Zap, Shield, Move, RefreshCw, Layers, Crosshair, Skull, Heart, ChevronsRight, ChevronsLeft, Info, Play, X, Box, Calendar, Hammer, ShoppingBag, Fuel, Palette, Star, Gift, HelpCircle, ArrowRight, Trash2, Settings, Archive, Download, Activity, Radiation, Droplets, Recycle } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES & CONSTANTS ---

const MAX_ROWS = 5; // Battle grid height
const SHIP_HEIGHT = 3; // Player ship height (Rows)
const SHIP_WIDTH = 3; // Player ship width (Cols) -> Total 9 slots
const MAX_FUEL = 3;

type EnergyColor = 'WHITE' | 'BLUE' | 'ORANGE';

interface EnergyCard {
    id: string;
    value: number;
    color: EnergyColor;
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
    specialEffect?: 'RANK_UP' | 'HEAL' | 'RECYCLE' | 'THORNS'; // New special effect types
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
    passivePower: number; // From Treasures
    partInventory: ShipPart[]; // New: Inventory
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

type VacationEventType = 'REPAIR' | 'PARTS' | 'ENERGY' | 'COIN' | 'TREASURE' | 'FUEL' | 'ENHANCE' | 'UNKNOWN' | 'SHOP' | 'MODIFY';

interface VacationEvent {
    id: string;
    type: VacationEventType;
    name: string;
    description: string;
    cost: number; // Days
    tier: 1 | 2 | 3; // Value tier
}

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

// --- DATABASE ---

const createEmptyPart = (id: string): ShipPart => ({
    id, type: 'EMPTY', name: '空きスロット', slots: [], multiplier: 0, basePower: 0, hp: 0
});

const STARTING_PARTS_LAYOUT: ShipPart[] = [
    // Row 0 (Top)
    { id: 'p0', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p1', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p2', type: 'CANNON', name: '軽量砲', description: '前方。白エネルギー1つで稼働。', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
    
    // Row 1 (Center)
    { id: 'p3', type: 'ENGINE', name: '増幅炉', description: '青以上のエネルギーで稼働。ランク+1のカードを即生成する。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' },
    { id: 'p4', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p5', type: 'CANNON', name: '連装砲', description: '前方。白エネルギー2つで稼働。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1, basePower: 2, hp: 10 },
    
    // Row 2 (Bottom)
    { id: 'p6', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p7', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p8', type: 'CANNON', name: '軽量砲', description: '前方。白エネルギー1つで稼働。', slots: [{req:'WHITE', value:null}], multiplier: 1, basePower: 1, hp: 10 },
];

const ENEMY_DATA = [
    { name: "折り紙偵察機", hp: 30, durability: 4, parts: ['CANNON', 'EMPTY', 'CANNON'] }, // Simple 3-row mapping for enemy
    { name: "ノート爆撃機", hp: 45, durability: 5, parts: ['CANNON', 'CANNON', 'EMPTY'] },
    { name: "定規戦艦", hp: 70, durability: 6, parts: ['CANNON', 'CANNON', 'CANNON'] }, 
    { name: "コンパス要塞", hp: 100, durability: 10, parts: ['CANNON', 'MISSILE', 'CANNON'] }, 
];

const VACATION_EVENTS_DB: Omit<VacationEvent, 'id'>[] = [
    { type: 'REPAIR', name: '応急修理', description: 'HPを10回復する。', cost: 1, tier: 1 },
    { type: 'REPAIR', name: 'ドック入り', description: 'HPを全回復し、最大HPを+5する。', cost: 3, tier: 3 },
    { type: 'FUEL', name: '燃料補給', description: '燃料を最大まで回復。', cost: 1, tier: 1 },
    { type: 'FUEL', name: 'タンク増設', description: '最大燃料+1、燃料全回復。', cost: 3, tier: 3 },
    { type: 'ENERGY', name: 'エネルギー採掘', description: 'エネルギー生成プールに「6」を追加。', cost: 2, tier: 2 },
    { type: 'ENERGY', name: 'リアクター調整', description: '生成プールに「オレンジ」を追加。', cost: 2, tier: 2 },
    { type: 'PARTS', name: 'パーツ回収', description: 'ランダムなパーツを1つ獲得する。', cost: 2, tier: 2 },
    { type: 'PARTS', name: '軍需物資', description: '高性能なパーツを獲得する。', cost: 4, tier: 3 },
    { type: 'COIN', name: 'アルバイト', description: 'スターコインを50獲得。', cost: 1, tier: 1 },
    { type: 'COIN', name: '臨時ボーナス', description: 'スターコインを150獲得。', cost: 2, tier: 2 },
    { type: 'TREASURE', name: '謎の宝箱', description: '永続的な攻撃力ボーナスを得る。', cost: 3, tier: 3 },
    { type: 'ENHANCE', name: 'チューニング', description: 'HP上限+10。', cost: 2, tier: 2 },
    { type: 'UNKNOWN', name: '謎のイベント', description: '何が起こるかわからない...', cost: 2, tier: 2 },
];

const PART_TEMPLATES: Omit<ShipPart, 'id'>[] = [
    // --- BASIC ---
    { type: 'CANNON', name: 'バスター砲', description: '標準的な威力の大砲。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 3, hp: 10 },
    { type: 'MISSILE', name: '誘導ミサイル', description: '青エネルギーで高出力。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'エネルギー盾', description: '高い防御力を発揮。', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '高機動スラスター', description: '回避率と燃料効率が高い。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.2, basePower: 2, hp: 10 },
    
    // --- ADVANCED ---
    { type: 'CANNON', name: '波動砲', description: 'オレンジ必須。超高火力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 10, hp: 10 },
    { type: 'ENGINE', name: '増幅炉', description: 'ランク+1のカードを生成する。', slots: [{req:'BLUE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'RANK_UP' },
    { type: 'CANNON', name: 'バルカン砲', description: '白エネルギーで手軽に連射。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.0, basePower: 2, hp: 10 },
    { type: 'CANNON', name: 'レールガン', description: '青エネルギー専用。貫通力重視。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 6, hp: 10 },
    { type: 'MISSILE', name: 'ナパーム弾', description: 'オレンジ専用。広範囲高火力。', slots: [{req:'ORANGE', value:null}], multiplier: 2.5, basePower: 5, hp: 10 },
    { type: 'SHIELD', name: 'スパイク装甲', description: '防御と同時に反撃(イメージ)。', slots: [{req:'ANY', value:null}], multiplier: 1.5, basePower: 2, hp: 20, specialEffect: 'THORNS' },
    { type: 'SHIELD', name: 'リペアキット', description: '白エネルギーで効率よく防御。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 4, hp: 10 },
    
    // --- ENGINES ---
    { type: 'ENGINE', name: 'ソーラー帆', description: '白エネルギーを効率よく変換。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.5, basePower: 0, hp: 5 },
    { type: 'ENGINE', name: '核融合炉', description: 'オレンジ専用。莫大な出力。', slots: [{req:'ORANGE', value:null}], multiplier: 4.0, basePower: 6, hp: 15 },
    
    // --- SPECIALIZED ---
    { type: 'CANNON', name: 'スナイパー', description: '2スロットで精密射撃。', slots: [{req:'BLUE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 10 },
    { type: 'MISSILE', name: '拡散ポッド', description: '多数の白スロットを持つ。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0.8, basePower: 3, hp: 10 },
    { type: 'SHIELD', name: 'ミラーコート', description: '青エネルギーで特殊防御。', slots: [{req:'BLUE', value:null}, {req:'ANY', value:null}], multiplier: 1.3, basePower: 4, hp: 12 },

    // --- AMPLIFIERS ---
    { type: 'AMPLIFIER', name: 'エネルギー増幅器', description: '隣接するパーツの出力を強化する(要:白エネ)。', slots: [{req:'WHITE', value:null}], multiplier: 0, basePower: 2, hp: 8 },
    { type: 'AMPLIFIER', name: 'ハイパーブースター', description: '隣接するパーツを大幅強化(要:橙エネ)。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 5, hp: 8 },
    { type: 'AMPLIFIER', name: 'デュアルアンプ', description: '2スロットで安定した強化。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 0, basePower: 3, hp: 8 },

    // --- STATIONERY ARSENAL (文房具シリーズ) ---
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

    // --- SCHOOL EQUIPMENT (学校設備) ---
    { type: 'CANNON', name: '放送室スピーカー', description: '音波攻撃。白エネで高出力。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 2.0, basePower: 5, hp: 15 },
    { type: 'ENGINE', name: '焼却炉エンジン', description: '橙エネルギー専用。爆発的推進力。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 5.0, basePower: 10, hp: 20 },
    { type: 'SHIELD', name: '理科室の人体模型', description: '不気味なオーラで守る。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.0, basePower: 8, hp: 25 },
    { type: 'MISSILE', name: '消火栓放水', description: '青エネルギー3つで超高圧放水。', slots: [{req:'BLUE', value:null}, {req:'BLUE', value:null}, {req:'BLUE', value:null}], multiplier: 3.0, basePower: 12, hp: 18 },
    { type: 'AMPLIFIER', name: '校長先生の銅像', description: '圧倒的威圧感で隣接パーツを強化。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 6, hp: 30 },
    { type: 'CANNON', name: 'チャイム音波砲', description: 'キーンコーンカーンコーン(破壊音)。', slots: [{req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 1.5, basePower: 6, hp: 10 },

    // --- LUNCH & SURVIVAL (給食・サバイバル) ---
    { type: 'SHIELD', name: '自己修復ナノ', description: '起動時に船体HPを5回復する。', slots: [{req:'ORANGE', value:null}], multiplier: 0, basePower: 0, hp: 10, specialEffect: 'HEAL' },
    { type: 'ENGINE', name: 'エネルギー吸収装置', description: '起動時、燃料を1回復する。', slots: [{req:'BLUE', value:null}], multiplier: 1.0, basePower: 2, hp: 10, specialEffect: 'RECYCLE' },
    { type: 'ENGINE', name: 'あしたのジョーロ', description: '水力エンジン。白のみで高効率。', slots: [{req:'WHITE', value:null}, {req:'WHITE', value:null}], multiplier: 1.8, basePower: 1, hp: 8 },
    { type: 'SHIELD', name: '揚げパンアーマー', description: '砂糖のコーティングで衝撃吸収。', slots: [{req:'WHITE', value:null}, {req:'ORANGE', value:null}], multiplier: 1.5, basePower: 5, hp: 15 },
    { type: 'MISSILE', name: '冷凍ミカン爆弾', description: 'カチカチのミカンを投下。', slots: [{req:'BLUE', value:null}], multiplier: 3.0, basePower: 3, hp: 8 },
    { type: 'CANNON', name: '牛乳瓶キャノン', description: 'カルシウムパワーで攻撃。', slots: [{req:'WHITE', value:null}], multiplier: 1.5, basePower: 2, hp: 10 },
    { type: 'SHIELD', name: '0点のテスト用紙', description: '紙装甲だがHPだけは無駄に高い。', slots: [{req:'WHITE', value:null}], multiplier: 0.1, basePower: 1, hp: 50 },

    // --- LEGENDARY (伝説) ---
    { type: 'CANNON', name: 'プリズムレーザー', description: '青と橙の混合エネルギーが必要。', slots: [{req:'BLUE', value:null}, {req:'ORANGE', value:null}], multiplier: 2.5, basePower: 8, hp: 10 },
    { type: 'CANNON', name: '伝説のソード', description: '勇者が使っていた剣の切っ先。', slots: [{req:'ORANGE', value:null}, {req:'ORANGE', value:null}, {req:'ORANGE', value:null}], multiplier: 3.0, basePower: 20, hp: 30 },
    { type: 'MISSILE', name: 'ドラゴン花火', description: '龍の形をした花火ミサイル。', slots: [{req:'ORANGE', value:null}, {req:'WHITE', value:null}, {req:'BLUE', value:null}], multiplier: 2.5, basePower: 15, hp: 15 },
    { type: 'ENGINE', name: '無限の心臓', description: '永久機関。ランクアップ効果付き。', slots: [{req:'ORANGE', value:null}, {req:'BLUE', value:null}], multiplier: 2.0, basePower: 5, hp: 40, specialEffect: 'RANK_UP' },
];

// --- COMPONENTS ---

const EnergyCardView: React.FC<{ card: EnergyCard, onClick?: () => void, selected?: boolean }> = ({ card, onClick, selected }) => {
    const bgColor = card.color === 'ORANGE' ? 'bg-orange-500' : card.color === 'BLUE' ? 'bg-blue-500' : 'bg-slate-200 text-black';
    const borderColor = card.color === 'ORANGE' ? 'border-orange-700' : card.color === 'BLUE' ? 'border-blue-700' : 'border-slate-400';
    
    return (
        <div 
            onClick={onClick}
            className={`
                w-14 h-20 md:w-16 md:h-24 rounded-lg border-b-4 border-r-2 ${borderColor} ${bgColor} 
                flex flex-col items-center justify-center cursor-pointer transition-transform relative shadow-md shrink-0
                ${selected ? '-translate-y-4 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-1'}
                select-none touch-none
            `}
            style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            <div className={`text-xl md:text-3xl font-black ${card.color === 'WHITE' ? 'text-slate-800' : 'text-white'}`}>{card.value}</div>
            {/* Color Icon */}
            <div className="absolute top-1 right-1">
                {card.color === 'ORANGE' && <Zap size={10} className="text-yellow-200 fill-current"/>}
                {card.color === 'BLUE' && <Wind size={10} className="text-cyan-200 fill-current"/>}
            </div>
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
    showPower?: boolean
}> = ({ part, onClick, onLongPress, isEnemy, highlight, pendingReplace, showPower = true }) => {
    
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
    
    // Special highlight for generator / healer
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

    // Calculate Power (Visual Only)
    const loadedCount = part.slots.filter(s => s.value !== null).length;
    const isFull = loadedCount === part.slots.length && part.slots.length > 0;
    
    let totalPower = 0;
    const energySum = part.slots.reduce((sum, s) => sum + (s.value || 0), 0);
    
    if (energySum > 0) {
        totalPower = Math.floor(energySum * part.multiplier);
        if (isFull) totalPower += part.basePower;
    }

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
                {totalPower > 0 && showPower && part.type !== 'AMPLIFIER' && <div className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{totalPower}</div>}
                {part.type === 'AMPLIFIER' && isFull && <div className="text-[8px] font-bold text-yellow-300">UP!</div>}
                {part.specialEffect === 'HEAL' && isFull && <div className="text-[8px] font-bold text-green-300">HEAL</div>}
            </div>

            <div className="flex gap-0.5 justify-center mt-1">
                {part.slots.map((slot, i) => {
                    let slotColor = 'bg-slate-900 border-slate-600';
                    if (slot.value !== null) {
                        slotColor = 'bg-white border-white animate-pulse'; // Loaded
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

const PaperPlaneBattle: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- STATE ---
    const [phase, setPhase] = useState<GamePhase>('TUTORIAL');
    const [stage, setStage] = useState(1); 
    const [turn, setTurn] = useState(1);
    
    // Pools
    const [pool, setPool] = useState<PoolState>({
        genNumbers: [1,2,3,4,5,6,3,4,5], 
        genColors: ['WHITE','WHITE','WHITE','BLUE','BLUE','ORANGE','ORANGE'], 
        coolNumbers: [],
        coolColors: []
    });

    const [hand, setHand] = useState<EnergyCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Ships
    const [player, setPlayer] = useState<ShipState>({
        yOffset: 1, // Start middle
        hp: 40, maxHp: 40, fuel: MAX_FUEL, maxFuel: MAX_FUEL, durability: 0, maxDurability: 0, isStunned: false,
        parts: JSON.parse(JSON.stringify(STARTING_PARTS_LAYOUT)),
        starCoins: 0,
        vacationDays: 0,
        passivePower: 0,
        partInventory: []
    });

    const [enemy, setEnemy] = useState<ShipState>({
        yOffset: 1,
        hp: 20, maxHp: 20, fuel: 0, maxFuel: 0, durability: 3, maxDurability: 3, isStunned: false,
        parts: [], // Enemy parts are simplified (1 per row usually)
        starCoins: 0, vacationDays: 0, passivePower: 0,
        partInventory: []
    });

    const [enemyIntents, setEnemyIntents] = useState<EnemyIntent[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [showPool, setShowPool] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [tooltipPart, setTooltipPart] = useState<ShipPart | null>(null);
    
    // Vacation State
    const [vacationEvents, setVacationEvents] = useState<VacationEvent[]>([]);
    const [vacationLog, setVacationLog] = useState<string>("休暇を楽しんでください。");
    const [pendingPart, setPendingPart] = useState<ShipPart | null>(null); // Part waiting to be equipped
    const [hangarSelection, setHangarSelection] = useState<{loc: 'SHIP'|'INV', idx: number}|null>(null);

    // Reward State
    const [rewardOptions, setRewardOptions] = useState<ShipPart[]>([]);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // --- GAME LOGIC ---

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 4)]);

    const initBattle = (stageNum: number) => {
        // Enemy Gen
        const enemyIdx = Math.min(ENEMY_DATA.length - 1, Math.floor((stageNum - 1) / 3));
        const template = ENEMY_DATA[enemyIdx];
        
        // Enemy Parts (Simplified: Just assign to 3 rows)
        const eParts: ShipPart[] = template.parts.map((t, i) => ({
            id: `ep_${i}`,
            type: t as any,
            name: t === 'CANNON' ? '敵砲台' : t === 'MISSILE' ? 'ミサイル' : '空き',
            slots: [], multiplier: 1, basePower: 0, hp: 10
        }));

        setEnemy({
            yOffset: 1,
            hp: template.hp + (stageNum * 5), maxHp: template.hp + (stageNum * 5),
            durability: template.durability + Math.floor(stageNum/2), maxDurability: template.durability + Math.floor(stageNum/2),
            fuel: 0, maxFuel: 0, isStunned: false,
            parts: eParts,
            starCoins: 0, vacationDays: 0, passivePower: 0,
            partInventory: []
        });

        // Reset Player Parts Loaded Values
        setPlayer(prev => ({
            ...prev,
            yOffset: 1,
            parts: prev.parts.map(p => ({ ...p, slots: p.slots.map(s => ({...s, value: null})) }))
        }));

        setTurn(1);
        setHand([]);
        generateEnemyIntents(1, eParts); 
        drawEnergy(5); // Initial draw
        setPhase('BATTLE');
        addLog(`バトル開始！ 敵: ${template.name}`);
        audioService.playBGM('battle');
    };

    const generateEnemyIntents = (turnNum: number, parts: ShipPart[]) => {
        const intents: EnemyIntent[] = [];
        parts.forEach((p, idx) => {
            if (p.type === 'CANNON' || p.type === 'MISSILE') {
                if (Math.random() < 0.7) {
                    const val = 3 + Math.floor(turnNum/2) + Math.floor(stage/2);
                    intents.push({ row: idx, type: 'ATTACK', value: val });
                }
            }
        });
        setEnemyIntents(intents);
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
        
        // Find first empty COMPATIBLE slot
        const slotIdx = part.slots.findIndex(s => s.value === null && isColorCompatible(card.color, s.req));
        
        if (slotIdx === -1) {
            if (part.slots.every(s => s.value !== null)) addLog("エネルギー充填完了しています");
            else addLog("色が合いません！");
            return;
        }

        // Prepare new hand state locally
        let currentHandList = [...hand];

        // Special Effect: RANK_UP
        if (part.specialEffect === 'RANK_UP') {
            const newValue = card.value + 1;
            const newCard: EnergyCard = {
                id: `e_gen_${Date.now()}`,
                value: newValue,
                color: card.color 
            };
            currentHandList.push(newCard); 
            addLog(`増幅！ランク${newValue}のカードを生成！`);
            audioService.playSound('buff');
        }

        // Load
        const newParts = [...player.parts];
        const newSlots = [...part.slots];
        newSlots[slotIdx] = { ...newSlots[slotIdx], value: card.value };
        newParts[partIndex] = { ...part, slots: newSlots };
        
        setPlayer(prev => ({ ...prev, parts: newParts }));
        
        // Remove original card from hand
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
        
        // Discard remaining hand
        hand.forEach(c => recycleCard(c));
        setHand([]);

        let enemyStunDmg = 0; 
        let tempEnemyHp = enemy.hp;
        let tempPlayerHp = player.hp;
        let tempFuel = player.fuel;
        
        // PASS 1: Calculate Amplifier Buffs
        const buffGrid = Array(SHIP_HEIGHT).fill(0).map(() => Array(SHIP_WIDTH).fill(0));
        player.parts.forEach((part, idx) => {
            if (part.type === 'AMPLIFIER') {
                const energySum = part.slots.reduce((s, slot) => s + (slot.value || 0), 0);
                const isFull = part.slots.every(s => s.value !== null) && part.slots.length > 0;
                
                // Only provide bonus if active (has energy)
                if (energySum > 0 || (part.slots.length === 0)) { 
                    // Amplifiers usually have slots. If no slots, always active?
                    let power = Math.floor(energySum * part.multiplier);
                    if (isFull) power += part.basePower;
                    
                    const r = Math.floor(idx / SHIP_WIDTH);
                    const c = idx % SHIP_WIDTH;
                    
                    // Apply to adjacent
                    const neighbors = [{r:r-1,c}, {r:r+1,c}, {r,c:c-1}, {r,c:c+1}];
                    neighbors.forEach(n => {
                        if (n.r >= 0 && n.r < SHIP_HEIGHT && n.c >= 0 && n.c < SHIP_WIDTH) {
                            buffGrid[n.r][n.c] += power;
                        }
                    });
                }
            }
        });

        // Iterate Rows for Combat
        for (let r = 0; r < MAX_ROWS; r++) {
            if (tempEnemyHp <= 0) break;

            const pRelIdx = r - player.yOffset;
            let pPower = 0;
            let pShield = 0;
            let pEngine = 0;
            let pThorns = 0;
            
            if (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) {
                const startIdx = pRelIdx * SHIP_WIDTH;
                const rowParts = player.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                
                rowParts.forEach((p, colIdx) => {
                    // Skip Empty or Amplifier (Amplifiers don't fire themselves usually, just buff)
                    if (p.type === 'EMPTY' || p.type === 'AMPLIFIER') return;

                    const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                    if (energySum > 0) {
                        let output = Math.floor(energySum * p.multiplier);
                        const isFull = p.slots.every(s => s.value !== null) && p.slots.length > 0;
                        if (isFull) {
                            output += p.basePower;
                            // Special Effect: HEAL
                            if (p.specialEffect === 'HEAL') {
                                tempPlayerHp = Math.min(player.maxHp, tempPlayerHp + 5);
                            }
                            // Special Effect: RECYCLE
                            if (p.specialEffect === 'RECYCLE') {
                                tempFuel = Math.min(player.maxFuel, tempFuel + 1);
                            }
                        }
                        
                        // Add Buffs
                        output += buffGrid[pRelIdx][colIdx];
                        output += player.passivePower; 

                        // Route Output
                        if (p.type === 'CANNON' || p.type === 'MISSILE') pPower += output;
                        if (p.type === 'SHIELD') {
                            pShield += output;
                            if (p.specialEffect === 'THORNS') {
                                pThorns += p.basePower; // Thorns deals base damage back?
                                // Let's scale thorns with output? 
                                // Actually let's just add output to thorns if it's thorns type?
                                // Shield usually adds to Defense.
                                // Let's say Thorns deals half of Shield value as damage?
                                // Or just basePower. Let's use basePower + buff for simplicity.
                                // Actually, use output.
                                pThorns += Math.ceil(output / 2);
                            }
                        }
                        if (p.type === 'ENGINE') pEngine += output;
                    }
                });
            }

            // Engine Output: Recover Fuel / Add Shield (Evasion)
            if (pEngine > 0) {
                pShield += pEngine;
                let fuelRecovered = Math.ceil(pEngine / 2); 
                tempFuel = Math.min(player.maxFuel, tempFuel + fuelRecovered);
            }

            const eRelIdx = r - enemy.yOffset;
            const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === r);
            let ePower = 0;
            
            if (intent && intent.type === 'ATTACK' && !enemy.isStunned) {
                ePower = intent.value;
            }

            // Combat Resolution for this Row
            if (pPower > 0 || ePower > 0 || pThorns > 0) {
                // Player Attack
                if (pPower > ePower) {
                    const diff = pPower - ePower;
                    tempEnemyHp = Math.max(0, tempEnemyHp - diff);
                    enemyStunDmg++;
                } 
                
                // Enemy Attack
                if (ePower > pPower) {
                    let diff = ePower - pPower;
                    // Apply Shield
                    const blocked = Math.min(diff, pShield);
                    diff -= blocked;
                    
                    if (diff > 0) {
                        tempPlayerHp = Math.max(0, tempPlayerHp - diff);
                    }
                    
                    // Thorns Damage (if player was attacked)
                    if (pThorns > 0) {
                        tempEnemyHp = Math.max(0, tempEnemyHp - pThorns);
                    }
                }
            }

            setEnemy(prev => ({...prev, hp: tempEnemyHp}));
            setPlayer(prev => ({...prev, hp: tempPlayerHp, fuel: tempFuel}));
            await new Promise(r => setTimeout(r, 200));
        }

        // Stun Logic
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
            
            setEnemy(prev => ({
                ...prev,
                hp: tempEnemyHp,
                durability: nextDurability,
                isStunned: nextIsStunned
            }));
        }

        // Cleanup
        setPlayer(prev => ({ 
            ...prev, 
            parts: prev.parts.map(p => ({...p, slots: p.slots.map(s => ({...s, value: null})) })) 
        }));
        
        await new Promise(r => setTimeout(r, 500));
        setAnimating(false);

        if (tempPlayerHp <= 0) {
            setPhase('GAME_OVER');
            audioService.playSound('lose');
        } else if (tempEnemyHp <= 0) {
            audioService.playSound('win');
            if (stage === 12) {
                setPhase('VICTORY');
            } else {
                setupRewardPhase();
            }
        } else {
            setTurn(prev => prev + 1);
            if (!nextIsStunned) {
                generateEnemyIntents(turn + 1, enemy.parts);
            } else {
                setEnemyIntents([]);
            }
            drawEnergy(5);
        }
    };

    // --- REWARD LOGIC ---
    const setupRewardPhase = () => {
        const coins = 50 + (stage * 10) + Math.floor(Math.random() * 20);
        setEarnedCoins(coins);
        setPlayer(p => ({...p, starCoins: p.starCoins + coins}));
        
        const opts: ShipPart[] = [];
        const pool = [...PART_TEMPLATES]; // Copy to allow splicing for unique selection

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

    // --- VACATION LOGIC ---

    const generateVacationEvents = () => {
        const events: VacationEvent[] = [];
        const count = 3 + Math.floor(Math.random() * 2); // 3-4 events
        
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
        const days = 4 + Math.floor(Math.random() * 3); // 4-6 days
        setPlayer(prev => ({ ...prev, vacationDays: days }));
        setVacationLog("戦闘お疲れ様！休暇を楽しんでください。");
        generateVacationEvents();
        setPhase('VACATION');
    };

    const executeVacationEvent = (event: VacationEvent) => {
        if (player.vacationDays < event.cost) {
            setVacationLog("休暇日数が足りません！");
            audioService.playSound('wrong');
            return;
        }

        setPlayer(prev => ({ ...prev, vacationDays: prev.vacationDays - event.cost }));
        let resultMsg = "";
        
        // Logic Switch
        switch (event.type) {
            case 'REPAIR':
                const heal = event.tier === 1 ? 10 : 999;
                if (event.tier === 3) setPlayer(p => ({ ...p, maxHp: p.maxHp + 5 }));
                setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + heal) }));
                resultMsg = "機体を修理しました。リフレッシュ！";
                audioService.playSound('buff');
                break;
            case 'FUEL':
                const fuel = event.tier === 1 ? MAX_FUEL : MAX_FUEL;
                if (event.tier === 3) setPlayer(p => ({ ...p, maxFuel: p.maxFuel + 1 }));
                setPlayer(p => ({ ...p, fuel: Math.min(p.maxFuel, p.fuel + fuel) }));
                resultMsg = "燃料タンクを満タンにしました！";
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
                const template = PART_TEMPLATES[Math.floor(Math.random() * PART_TEMPLATES.length)];
                let quality = event.tier === 3 ? 1.5 : 1.0;
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
                resultMsg = `「${newPart.name}」を獲得！交換するスロットを選んでください。`;
                audioService.playSound('select');
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
        newParts[slotIdx] = { ...pendingPart, id: `p_${Date.now()}_${slotIdx}` }; // Reset ID to ensure uniqueness in slot
        
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

        // If clicking same slot, deselect
        if (hangarSelection.loc === loc && hangarSelection.idx === idx) {
            setHangarSelection(null);
            return;
        }

        const newPlayer = { ...player };
        const parts = [...newPlayer.parts];
        const inventory = [...newPlayer.partInventory];

        const sourcePart = hangarSelection.loc === 'SHIP' ? parts[hangarSelection.idx] : inventory[hangarSelection.idx];
        const targetPart = loc === 'SHIP' ? parts[idx] : inventory[idx];

        // Swap Logic
        if (hangarSelection.loc === 'SHIP' && loc === 'SHIP') {
            // Ship <-> Ship
            parts[hangarSelection.idx] = targetPart;
            parts[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'INV') {
            // Inv <-> Inv
            inventory[hangarSelection.idx] = targetPart;
            inventory[idx] = sourcePart;
        } else if (hangarSelection.loc === 'INV' && loc === 'SHIP') {
            // Equip: Inv -> Ship
            parts[idx] = sourcePart;
            
            if (targetPart.type === 'EMPTY') {
                inventory.splice(hangarSelection.idx, 1);
            } else {
                inventory[hangarSelection.idx] = targetPart;
            }
        } else if (hangarSelection.loc === 'SHIP' && loc === 'INV') {
            // Unequip/Swap: Ship -> Inv
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

    // --- RENDER HELPERS ---

    const renderGridRow = (rowIndex: number) => {
        // --- Player Parts in this relative row ---
        const pRelIdx = rowIndex - player.yOffset;
        const inShip = pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT;
        const partsToRender = inShip ? player.parts.slice(pRelIdx * 3, pRelIdx * 3 + 3) : [];
        const eRelIdx = rowIndex - enemy.yOffset;
        const ePart = (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) ? enemy.parts[eRelIdx] : null;
        const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === rowIndex);
        
        let prediction = null;
        let pPower = 0;
        
        // Pass 1: Calc Amps for Prediction
        const buffGrid = Array(SHIP_HEIGHT).fill(0).map(() => Array(SHIP_WIDTH).fill(0));
        if (inShip) {
             player.parts.forEach((part, idx) => {
                if (part.type === 'AMPLIFIER') {
                    const energySum = part.slots.reduce((s, slot) => s + (slot.value || 0), 0);
                    const isFull = part.slots.every(s => s.value !== null) && part.slots.length > 0;
                    if (energySum > 0 || part.slots.length === 0) { 
                        let power = Math.floor(energySum * part.multiplier);
                        if (isFull) power += part.basePower;
                        const r = Math.floor(idx / SHIP_WIDTH);
                        const c = idx % SHIP_WIDTH;
                        const neighbors = [{r:r-1,c}, {r:r+1,c}, {r,c:c-1}, {r,c:c+1}];
                        neighbors.forEach(n => {
                            if (n.r >= 0 && n.r < SHIP_HEIGHT && n.c >= 0 && n.c < SHIP_WIDTH) {
                                buffGrid[n.r][n.c] += power;
                            }
                        });
                    }
                }
            });
        }
        
        // Pass 2: Calc output
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
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>
                <div className="w-16 md:w-24 relative flex items-center justify-center shrink-0">
                    {prediction ? prediction : (enemy.isStunned && ePart ? <div className="text-yellow-500 font-bold text-xs">STUNNED</div> : null)}
                </div>
                <div className="w-1/3 pl-2 border-l border-dashed border-white/20">
                    {ePart && <div className="w-full opacity-80"><ShipPartView part={ePart} isEnemy={true} /></div>}
                </div>
            </div>
        );
    };

    const RenderTooltip = () => {
        if (!tooltipPart) return null;
        return (
            <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setTooltipPart(null)}>
                <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setTooltipPart(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                    <h3 className="text-xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{tooltipPart.name}</h3>
                    <div className="text-sm text-gray-300 mb-4">{tooltipPart.description || "詳細なし"}</div>
                    <div className="bg-black/40 p-2 rounded text-xs text-cyan-300 font-mono">
                        {tooltipPart.type !== 'AMPLIFIER' ? (
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
                        {tooltipPart.specialEffect === 'THORNS' && <div className="text-red-400 mt-2 font-bold">反撃ダメージ (Thorns)</div>}
                    </div>
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---

    if (phase === 'TUTORIAL') {
        return (
            <div className="w-full h-full bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-mono">
                <Send size={64} className="text-cyan-400 mb-4 animate-bounce"/>
                <h1 className="text-4xl font-bold mb-4">紙飛行機バトル v2.5</h1>
                <div className="max-w-md text-sm text-gray-300 space-y-2 mb-8 bg-slate-800 p-4 rounded border border-slate-600">
                    <p>・機体は3x3のモジュールで構成されています。</p>
                    <p>・エネルギーの色には相性があります。</p>
                    <p className="text-yellow-400 font-bold">・オレンジ &gt; 青 &gt; 白 (白スロットには何色でもOK！)</p>
                    <p>・エネルギーを入れるだけで出力が出ます。</p>
                    <p>・全スロットを埋めると起動ボーナスが加算されます！</p>
                    <p className="text-purple-400 font-bold">・新パーツ多数！回復機能や増幅器を使いこなせ！</p>
                    <p>・モジュール長押しで詳細を確認できます。</p>
                    <p className="text-green-400 font-bold">・戦闘後は「休暇」で機体を強化しよう！</p>
                </div>
                <button onClick={() => initBattle(1)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-lg animate-pulse flex items-center">
                    <Play className="mr-2"/> 出撃
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
                 <div className="text-yellow-300 text-2xl font-bold mb-8 flex items-center bg-black/50 px-6 py-2 rounded-full border border-yellow-500">
                     <Star size={24} className="mr-2 fill-current"/> +{earnedCoins}
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
                         {player.parts.map((p, i) => (
                             <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                 <ShipPartView part={p} pendingReplace={true} onLongPress={(p) => setTooltipPart(p)} />
                             </div>
                         ))}
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
                            {player.parts.map((p, i) => (
                                <div key={i} className="w-16 h-16 md:w-24 md:h-24 relative">
                                    <ShipPartView 
                                        part={p} 
                                        onClick={() => handleHangarAction('SHIP', i)} 
                                        onLongPress={(p) => setTooltipPart(p)}
                                        highlight={hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i}
                                    />
                                    {hangarSelection?.loc === 'SHIP' && hangarSelection.idx === i && (
                                        <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse pointer-events-none rounded"></div>
                                    )}
                                </div>
                            ))}
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
        return (
            <div className="w-full h-full bg-slate-900 text-white p-2 md:p-4 font-mono relative overflow-hidden flex flex-col">
                <RenderTooltip />
                <div className="flex justify-between items-center mb-2 bg-slate-800 p-3 rounded-lg shadow-lg shrink-0">
                    <h2 className="text-lg md:text-2xl font-bold flex items-center text-cyan-300"><Calendar className="mr-2" size={20}/> <span className="hidden md:inline">休暇モード</span><span className="md:hidden">休暇</span></h2>
                    <div className="flex gap-2 md:gap-4 text-sm">
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
                                    {player.parts.map((p, i) => (
                                        <div key={i} className="w-16 h-16 md:w-20 md:h-20" onClick={() => handlePartEquip(i)}>
                                            <ShipPartView part={p} pendingReplace={true} onLongPress={(p) => setTooltipPart(p)} />
                                        </div>
                                    ))}
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
                                        disabled={player.vacationDays < event.cost}
                                        className={`
                                            bg-slate-800 border-2 rounded-xl p-3 flex flex-col items-center text-center relative group transition-all min-h-[120px] justify-between
                                            ${player.vacationDays < event.cost ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-slate-600 hover:border-cyan-400 hover:bg-slate-700 hover:-translate-y-1 shadow-lg'}
                                        `}
                                    >
                                        <div className="absolute top-2 right-2 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded text-orange-300 border border-orange-500/30">{event.cost}日</div>
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
            
            {/* Header */}
            <div className="h-12 bg-black border-b border-cyan-900 flex justify-between items-center px-4 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center text-green-400 font-bold"><Heart size={16} className="mr-1"/> {player.hp}/{player.maxHp}</div>
                    <div className="flex items-center text-orange-400 font-bold"><Wind size={16} className="mr-1"/> {player.fuel}/{player.maxFuel}</div>
                </div>
                <div className="text-cyan-200 font-bold tracking-widest text-sm">STAGE {stage}-1</div>
                <button onClick={() => setShowPool(!showPool)} className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-700">POOL</button>
            </div>

            {/* Battle Grid */}
            <div className="flex-1 relative bg-[#1a1a24] overflow-y-auto custom-scrollbar">
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
                </div>

                {/* Logs */}
                <div className="absolute bottom-2 right-2 w-48 pointer-events-none opacity-70 z-20">
                    {logs.map((l, i) => <div key={i} className="text-[10px] text-right bg-black/50 mb-0.5 px-1 rounded">{l}</div>)}
                </div>
            </div>

            {/* Tooltip Overlay */}
            {tooltipPart && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setTooltipPart(null)}>
                    <div className="bg-slate-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setTooltipPart(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X size={24}/></button>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2">{tooltipPart.name}</h3>
                        <div className="text-sm text-gray-300 mb-4">{tooltipPart.description || "詳細なし"}</div>
                        <div className="bg-black/40 p-2 rounded text-xs text-cyan-300 font-mono">
                            {tooltipPart.type !== 'AMPLIFIER' ? (
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
                            {tooltipPart.specialEffect === 'THORNS' && <div className="text-red-400 mt-2 font-bold">反撃ダメージ (Thorns)</div>}
                        </div>
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
                <div className="flex-1 flex gap-2 overflow-x-auto items-center px-2 custom-scrollbar bg-black/20 rounded-lg border border-white/5">
                    {hand.map(card => (
                        <EnergyCardView 
                            key={card.id} 
                            card={card} 
                            onClick={() => handleCardSelect(card.id)} 
                            selected={selectedCardId === card.id}
                        />
                    ))}
                    {hand.length === 0 && <div className="text-gray-600 text-xs w-full text-center">NO ENERGY</div>}
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

            {/* Pool Overlay */}
            {showPool && (
                <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={() => setShowPool(false)}>
                    <div className="bg-slate-800 p-6 rounded-lg max-w-lg w-full border border-slate-600" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 flex items-center"><Layers className="mr-2"/> Energy Pools</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-cyan-400 font-bold mb-2 border-b border-cyan-700 pb-1">Generating</div>
                                <div className="text-xs text-gray-400 mb-2">Nums: {pool.genNumbers.join(', ')}</div>
                                <div className="text-xs text-gray-400">Cols: {pool.genColors.map(c => c[0]).join('')}</div>
                            </div>
                            <div>
                                <div className="text-orange-400 font-bold mb-2 border-b border-orange-700 pb-1">Cooling</div>
                                <div className="text-xs text-gray-400 mb-2">Nums: {pool.coolNumbers.join(', ')}</div>
                                <div className="text-xs text-gray-400">Cols: {pool.coolColors.map(c => c[0]).join('')}</div>
                            </div>
                        </div>
                        <button onClick={() => setShowPool(false)} className="mt-6 w-full bg-slate-700 py-2 rounded text-sm">Close</button>
                    </div>
                </div>
            )}

            {(phase === 'VICTORY' || phase === 'GAME_OVER') && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-slate-800 p-8 rounded-xl border-4 border-slate-600 text-center shadow-2xl">
                        {phase === 'VICTORY' && (
                            <>
                                <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce"/>
                                <h2 className="text-4xl font-bold text-white mb-2">MISSION COMPLETE</h2>
                                <button onClick={onBack} className="mt-8 bg-cyan-600 px-8 py-3 rounded text-xl font-bold">Return</button>
                            </>
                        )}
                        {phase === 'GAME_OVER' && (
                            <>
                                <Skull size={64} className="text-red-500 mx-auto mb-4"/>
                                <h2 className="text-4xl font-bold text-red-500 mb-2">DESTROYED</h2>
                                <p className="text-gray-400">Stage {stage}</p>
                                <button onClick={onBack} className="mt-8 bg-gray-600 px-8 py-3 rounded text-xl font-bold">Return</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaperPlaneBattle;
