
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, X, RotateCcw, Swords, Shield, RefreshCw, Zap, Trophy, Skull, ChevronsRight, ChevronLeft, ChevronRight, Clock, Ghost, ArrowRightLeft, Gift, ShoppingBag, Hammer, Coins, Plus, Crosshair, Heart, Move, AlertTriangle, Hourglass, Maximize2, Minimize2, Wind, Anchor, Flame, Activity, ArrowUp, Dna, Shuffle, Star, Crown } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left
type SubPhase = 'TUTORIAL' | 'PART_1' | 'REWARD' | 'PART_2' | 'CAMPFIRE' | 'MID_BOSS' | 'SHOP' | 'FINAL_BOSS';
type CardEffectType = 'NORMAL' | 'COUNTER' | 'PUSH' | 'PULL' | 'RECOIL' | 'DASH_ATTACK' | 'FURTHEST' | 'PIERCE' | 'TELEPORT';

interface KCard {
    id: string;
    name: string;
    type: 'ATTACK' | 'MOVE' | 'UTILITY';
    range: number[]; 
    damage: number;
    shield?: number;
    cooldown: number; 
    currentCooldown: number; 
    color: string;
    icon: React.ReactNode;
    description: string;
    energyCost: number; 
    upgraded?: boolean;
    effectType?: CardEffectType;
    slots?: number; 
}

interface KEntity {
    id: string;
    type: 'PLAYER' | 'ENEMY' | 'BOSS' | 'MID_BOSS';
    name: string;
    pos: number; // 0-6
    facing: Facing;
    maxHp: number;
    hp: number;
    spriteName: string;
    
    // Enemy AI
    intent?: {
        type: 'ATTACK' | 'MOVE' | 'WAIT' | 'SUMMON';
        damage?: number;
        range?: number[];
        targetPos?: number;
        timer: number; 
    };
    
    // Status
    shield: number;
    bossPhase?: number; // For multi-phase bosses
}

interface KRelic {
    id: string;
    name: string;
    desc: string;
    price: number;
}

interface KochoVFX {
    id: string;
    type: 'SLASH' | 'BLAST' | 'TEXT' | 'BLOCK' | 'HEAL' | 'BUFF' | 'COUNTER' | 'IMPACT' | 'WARP' | 'SUMMON';
    pos: number;
    text?: string | number;
    color?: string;
}

interface KochoGameState {
    stage: number; // 1-7
    subPhase: SubPhase;
    wave: number;
    maxWaves: number;
    turn: number;
    gridSize: number;
    player: KEntity;
    enemies: KEntity[];
    hand: KCard[];
    queue: KCard[];
    deck: KCard[];
    discard: KCard[];
    status: 'PLAYING' | 'EXECUTING' | 'GAME_OVER' | 'VICTORY' | 'WAVE_CLEAR' | 'PHASE_CLEAR';
    logs: string[];
    specialActionCooldown: number;
    money: number;
    relics: KRelic[];
    shopUpgradeUsed: boolean;
    campfireUsed: boolean; // Track campfire usage
}

type UpgradeType = 'DMG_1' | 'DMG_1_CD_1' | 'DMG_2_CD_3' | 'CD_MINUS_1' | 'CD_MINUS_2' | 'CD_MINUS_4_DMG_MINUS_1' | 'SLOT_1' | 'SLOT_1_CD_MINUS_1' | 'SACRIFICE' | 'GAMBLE';

interface UpgradeOffer {
    type: UpgradeType;
    description: string;
    icon: React.ReactNode;
    color: string;
}

// --- DATA ---
const CARD_DB: Omit<KCard, 'id' | 'currentCooldown'>[] = [
    // Standard Set
    { name: '定規スラッシュ', type: 'ATTACK', range: [1], damage: 3, cooldown: 2, color: 'bg-red-600', icon: <Swords size={16}/>, description: '目の前の敵を斬る', energyCost: 1 },
    { name: 'コンパス突き', type: 'ATTACK', range: [2], damage: 2, cooldown: 2, color: 'bg-orange-600', icon: <Zap size={16}/>, description: '2マス先を攻撃', energyCost: 1 },
    { name: 'ダッシュ', type: 'MOVE', range: [2], damage: 0, cooldown: 3, color: 'bg-blue-600', icon: <ChevronsRight size={16}/>, description: '前方に2マス移動', energyCost: 1 },
    { name: 'バックステップ', type: 'UTILITY', range: [-1], damage: 0, cooldown: 2, color: 'bg-gray-600', icon: <RotateCcw size={16}/>, description: '1マス下がる', energyCost: 1 },
    { name: '大声', type: 'ATTACK', range: [1, 2, 3], damage: 1, cooldown: 4, color: 'bg-yellow-600', icon: <Zap size={16}/>, description: '前方3マスに音波攻撃', energyCost: 1 },
    { name: 'お辞儀', type: 'UTILITY', range: [0], damage: 0, shield: 2, cooldown: 3, color: 'bg-green-600', icon: <Shield size={16}/>, description: '待機してシールド+2', energyCost: 1 },
    { name: '回し蹴り', type: 'ATTACK', range: [-1, 1], damage: 3, cooldown: 2, color: 'bg-purple-600', icon: <RefreshCw size={16}/>, description: '前後1マスを攻撃', energyCost: 1 },
    { name: 'チョーク投げ', type: 'ATTACK', range: [1, 2, 3, 4], damage: 2, cooldown: 3, color: 'bg-cyan-600', icon: <Zap size={16}/>, description: '遠距離攻撃', energyCost: 1 },
    { name: 'スライディング', type: 'ATTACK', range: [1, 2], damage: 2, cooldown: 3, color: 'bg-indigo-600', icon: <ChevronsRight size={16}/>, description: '移動しながら攻撃', energyCost: 1 },
    { name: '教科書ガード', type: 'UTILITY', range: [0], damage: 0, shield: 4, cooldown: 4, color: 'bg-slate-600', icon: <Shield size={16}/>, description: 'シールド+4', energyCost: 1 },

    // New Weapons / Actions
    { name: '竹刀', type: 'ATTACK', range: [1], damage: 2, cooldown: 0, color: 'bg-emerald-600', icon: <Swords size={16}/>, description: 'CD0。隙のない連撃', energyCost: 0 },
    { name: '金属バット', type: 'ATTACK', range: [1], damage: 5, cooldown: 4, color: 'bg-stone-600', icon: <Hammer size={16}/>, description: '重い一撃(高威力)', energyCost: 1 },
    { name: 'カウンター定規', type: 'ATTACK', range: [1], damage: 2, cooldown: 3, color: 'bg-rose-700', icon: <Swords size={16}/>, description: '敵が攻撃態勢なら3倍ダメ', energyCost: 1, effectType: 'COUNTER' },
    { name: '張り手', type: 'ATTACK', range: [1], damage: 1, cooldown: 3, color: 'bg-orange-700', icon: <Maximize2 size={16}/>, description: '敵を2マス吹き飛ばす', energyCost: 1, effectType: 'PUSH' },
    { name: '後ろ蹴り', type: 'ATTACK', range: [-1], damage: 3, cooldown: 3, color: 'bg-violet-700', icon: <ArrowLeft size={16}/>, description: '背後の敵を攻撃', energyCost: 1 },
    { name: '釣り竿', type: 'ATTACK', range: [2, 3, 4], damage: 1, cooldown: 4, color: 'bg-sky-600', icon: <Minimize2 size={16}/>, description: '敵を目の前に引き寄せる', energyCost: 1, effectType: 'PULL' },
    { name: '消火器', type: 'ATTACK', range: [1, 2], damage: 4, cooldown: 5, color: 'bg-red-500', icon: <Wind size={16}/>, description: '高威力だが反動で下がる', energyCost: 1, effectType: 'RECOIL' },
    { name: 'タックル', type: 'ATTACK', range: [1, 2, 3], damage: 2, cooldown: 3, color: 'bg-amber-600', icon: <Activity size={16}/>, description: '敵にぶつかるまで突進攻撃', energyCost: 1, effectType: 'DASH_ATTACK' },
    { name: '雷', type: 'ATTACK', range: [1,2,3,4,5,6], damage: 2, cooldown: 4, color: 'bg-yellow-500 text-black', icon: <Zap size={16}/>, description: '一番遠くの敵を狙い撃つ', energyCost: 1, effectType: 'FURTHEST' },
    { name: '回転モップ', type: 'ATTACK', range: [-1, 1], damage: 2, cooldown: 2, color: 'bg-cyan-700', icon: <RefreshCw size={16}/>, description: '前後を同時に攻撃', energyCost: 1 },
    { name: '竹箒', type: 'ATTACK', range: [1, 2], damage: 2, cooldown: 3, color: 'bg-amber-700', icon: <Move size={16}/>, description: '前方2マスを貫通攻撃', energyCost: 1, effectType: 'PIERCE' },
    { name: '絶対防御', type: 'UTILITY', range: [0], damage: 0, shield: 6, cooldown: 5, color: 'bg-yellow-500 text-black', icon: <Shield size={16}/>, description: 'シールド+6', energyCost: 1 },
];

const SHOP_RELICS: KRelic[] = [
    { id: 'R_BOOTS', name: '瞬足の靴', desc: '移動系カードのCD-1', price: 30 },
    { id: 'R_GLOVES', name: 'パワー手袋', desc: '攻撃ダメージ+1', price: 40 },
    { id: 'R_SHIELD', name: '安全ピン', desc: '毎ターンシールド+1', price: 35 },
    { id: 'R_POTION', name: '給食の牛乳', desc: 'HPを10回復', price: 15 },
];

const UPGRADE_POOLS: UpgradeOffer[] = [
    { type: 'DMG_1', description: 'ダメージ +1', icon: <Swords size={16}/>, color: 'text-red-400' },
    { type: 'DMG_1_CD_1', description: 'ダメージ +1, クールダウン +1', icon: <Swords size={16}/>, color: 'text-orange-400' },
    { type: 'DMG_2_CD_3', description: 'ダメージ +2, クールダウン +3', icon: <Hammer size={16}/>, color: 'text-red-500' },
    { type: 'CD_MINUS_1', description: 'クールダウン -1', icon: <Clock size={16}/>, color: 'text-blue-400' },
    { type: 'CD_MINUS_2', description: 'クールダウン -2', icon: <Clock size={16}/>, color: 'text-cyan-400' },
    { type: 'CD_MINUS_4_DMG_MINUS_1', description: 'クールダウン -4, ダメージ -1', icon: <Wind size={16}/>, color: 'text-sky-300' },
    { type: 'SLOT_1', description: 'アップグレードスロット +1', icon: <Plus size={16}/>, color: 'text-green-400' },
    { type: 'SLOT_1_CD_MINUS_1', description: 'スロット +1, クールダウン -1', icon: <Plus size={16}/>, color: 'text-emerald-400' },
    { type: 'SACRIFICE', description: 'カードを犠牲にして40G獲得', icon: <Skull size={16}/>, color: 'text-gray-400' },
    { type: 'GAMBLE', description: '戦士の賭け（ランダム変化）', icon: <Shuffle size={16}/>, color: 'text-purple-400' },
];

const getInitialDeck = (): KCard[] => {
    const roundhouse = CARD_DB.find(c => c.name === '回し蹴り')!;
    const chalk = CARD_DB.find(c => c.name === 'チョーク投げ')!;

    return [
        { ...roundhouse, id: 'c1', currentCooldown: 0, slots: 0 },
        { ...chalk, id: 'c2', currentCooldown: 0, slots: 0 },
    ];
};

const ENEMY_TYPES = [
    { name: '不良生徒', maxHp: 4, sprite: 'SENIOR|#a855f7', attackDmg: 2, range: [1], speed: 3, attackCooldown: 1 }, 
    { name: '熱血教師', maxHp: 7, sprite: 'TEACHER|#ef4444', attackDmg: 4, range: [1], speed: 4, attackCooldown: 2 },
    { name: '用務員', maxHp: 5, sprite: 'HUMANOID|#3e2723', attackDmg: 3, range: [1, 2], speed: 5, attackCooldown: 1 },
    { name: '吹奏楽部', maxHp: 6, sprite: 'GIRL|#e91e63', attackDmg: 2, range: [2, 3], speed: 3, attackCooldown: 2 },
    { name: 'ガードマン', maxHp: 10, sprite: 'MUSCLE|#607d8b', attackDmg: 3, range: [1], speed: 2, attackCooldown: 2 },
];

const MID_BOSSES = [
    { stage: 2, name: '鬼軍曹', maxHp: 20, sprite: 'TEACHER|#1a237e', attackDmg: 5, range: [1, 2], speed: 6, attackCooldown: 2 },
    { stage: 3, name: 'マッド科学者', maxHp: 25, sprite: 'WIZARD|#2e7d32', attackDmg: 4, range: [2, 3, 4], speed: 4, attackCooldown: 3 },
    { stage: 4, name: '魔性の音楽教師', maxHp: 30, sprite: 'GIRL|#880e4f', attackDmg: 3, range: [1, 2, 3], speed: 5, attackCooldown: 2 },
    { stage: 5, name: '給食の鬼', maxHp: 50, sprite: 'CHEF|#d84315', attackDmg: 8, range: [1], speed: 2, attackCooldown: 3 },
    { stage: 6, name: '鉄壁の教頭', maxHp: 40, sprite: 'MUSCLE|#37474f', attackDmg: 6, range: [1], speed: 4, attackCooldown: 2 },
];

const KOCHO_PHASES = [
    { name: '校長', maxHp: 30, sprite: 'BOSS|#FFD700', attackDmg: 5, range: [1, 2], attackCooldown: 3 },
    { name: '校長(本気)', maxHp: 40, sprite: 'BOSS|#d32f2f', attackDmg: 7, range: [1, 2, 3], attackCooldown: 2 },
    { name: '校長(最終形態)', maxHp: 60, sprite: 'BOSS|#ffffff', attackDmg: 10, range: [1, 2, 3, 4], attackCooldown: 2 },
];

const GRID_SIZE = 7;

// --- COMPONENT ---
const KochoShowdown: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    
    // State
    const [gameState, setGameState] = useState<KochoGameState>({
        stage: 1,
        subPhase: 'TUTORIAL',
        wave: 1,
        maxWaves: 1,
        turn: 1,
        gridSize: GRID_SIZE,
        player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 10, hp: 10, spriteName: 'HERO_SIDE|赤', shield: 0 },
        enemies: [],
        hand: [],
        queue: [],
        deck: [],
        discard: [],
        status: 'PLAYING',
        logs: ['校長室への道が開かれた...'],
        specialActionCooldown: 0,
        money: 0,
        relics: [],
        shopUpgradeUsed: false,
        campfireUsed: false,
    });

    const [vfxList, setVfxList] = useState<KochoVFX[]>([]);

    // Ref to hold current state for async loops (avoiding stale closures)
    const stateRef = useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const [animating, setAnimating] = useState(false);
    const [rewardCards, setRewardCards] = useState<KCard[]>([]);

    // Shop Upgrade State
    const [upgradeSelection, setUpgradeSelection] = useState<{
        active: boolean;
        cardIndex: number | null;
        currentOffer: UpgradeOffer | null;
        rerollCount: number;
    }>({ active: false, cardIndex: null, currentOffer: null, rerollCount: 0 });

    // Initialization
    useEffect(() => {
        startStage(1);
    }, []);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs.slice(0, 4)] }));
    };

    const addVfx = (type: KochoVFX['type'], pos: number, options: Partial<KochoVFX> = {}) => {
        const id = options.id || Math.random().toString(36).substr(2, 9);
        setVfxList(prev => [...prev, { ...options, id, type, pos }]);
        setTimeout(() => {
            setVfxList(prev => prev.filter(v => v.id !== id));
        }, 800); // Effect duration
    };

    const startStage = (stage: number) => {
        let sub: SubPhase = 'TUTORIAL';
        if (stage > 1 && stage < 7) sub = 'PART_1';
        if (stage === 7) sub = 'FINAL_BOSS';

        const maxWaves = stage === 1 ? 1 : (Math.floor(Math.random() * 3) + 2); // Random 2-4 waves for PART 1

        setGameState(prev => ({
            ...prev,
            stage,
            subPhase: sub,
            wave: 1,
            maxWaves: sub === 'FINAL_BOSS' ? 1 : maxWaves,
            status: 'PLAYING',
            logs: [`Stage ${stage} 開始！`, ...prev.logs],
            shopUpgradeUsed: false,
            campfireUsed: false
        }));

        startWave(1, sub, stage);
    };

    const startWave = (wave: number, sub: SubPhase, stage: number) => {
        // Difficulty Scaling
        let enemyCount = 1;
        let template: any = ENEMY_TYPES[0];

        if (sub === 'TUTORIAL') {
            enemyCount = 1;
            template = ENEMY_TYPES[0];
        } else if (sub === 'MID_BOSS') {
            enemyCount = 1;
            template = MID_BOSSES.find(b => b.stage === stage) || MID_BOSSES[0];
        } else if (sub === 'FINAL_BOSS') {
            enemyCount = 1;
            template = KOCHO_PHASES[0]; // Start phase 1
        } else {
            // Mob Battles (PART_1, PART_2)
            enemyCount = Math.min(3, 1 + Math.floor((stage + wave) / 3));
            const diff = stage + Math.floor(wave / 2);
            const poolIndex = Math.min(ENEMY_TYPES.length - 1, Math.floor(Math.random() * diff));
            template = ENEMY_TYPES[poolIndex];
        }

        const newEnemies: KEntity[] = [];
        
        for (let i = 0; i < enemyCount; i++) {
            // For multiple enemies in mob wave, randomize types slightly
            if (i > 0 && sub.includes('PART')) {
                template = ENEMY_TYPES[Math.floor(Math.random() * Math.min(ENEMY_TYPES.length, stage + 1))];
            }

            // Find valid spawn pos
            let pos = i === 0 ? (stateRef.current.player.pos > 3 ? 0 : 6) : (stateRef.current.player.pos > 3 ? 1 : 5);
            if (newEnemies.some(e => e.pos === pos)) pos = pos === 0 ? 1 : (pos === 6 ? 5 : (pos + 1) % 7); // Simple collision avoidance

            newEnemies.push({
                id: `e_${stage}_${sub}_${wave}_${i}`,
                type: (sub === 'FINAL_BOSS') ? 'BOSS' : (sub === 'MID_BOSS' ? 'MID_BOSS' : 'ENEMY'),
                name: template.name,
                pos: pos,
                facing: pos < 3 ? 1 : -1,
                maxHp: template.maxHp,
                hp: template.maxHp,
                spriteName: template.sprite,
                shield: 0,
                intent: {
                    type: 'WAIT',
                    timer: Math.floor(Math.random() * 2) + 1,
                },
                bossPhase: (sub === 'FINAL_BOSS') ? 0 : undefined
            });
        }

        const isFreshStart = (stage === 1 && wave === 1);
        const currentHand = isFreshStart ? getInitialDeck() : stateRef.current.hand;
        const handWithCD = isFreshStart ? currentHand.map(c => ({ ...c, currentCooldown: 0 })) : currentHand;

        setGameState(prev => ({
            ...prev,
            wave: wave,
            turn: 1,
            player: { 
                ...prev.player, 
                pos: isFreshStart ? 3 : prev.player.pos,
                facing: isFreshStart ? 1 : prev.player.facing,
                shield: 0,
                hp: isFreshStart ? prev.player.maxHp : prev.player.hp
            }, 
            enemies: newEnemies,
            hand: handWithCD,
            queue: [],
            status: 'PLAYING',
            specialActionCooldown: isFreshStart ? 0 : prev.specialActionCooldown,
            money: isFreshStart ? 0 : prev.money,
        }));

        // BGM Logic
        if (sub === 'FINAL_BOSS') audioService.playBGM('dungeon_boss');
        else if (sub === 'MID_BOSS') audioService.playBGM('dungeon_gym'); // Intense
        else if (stage >= 5) audioService.playBGM('dungeon_roof');
        else audioService.playBGM('dungeon_music');
    };

    // --- GAME LOGIC ---

    const tickCooldowns = (state: KochoGameState): KochoGameState => {
        const hasBoots = state.relics.some(r => r.id === 'R_BOOTS');
        return {
            ...state,
            hand: state.hand.map(c => ({
                ...c,
                currentCooldown: Math.max(0, c.currentCooldown - (c.type === 'MOVE' && hasBoots ? 2 : 1))
            })),
            specialActionCooldown: Math.max(0, state.specialActionCooldown - 1)
        };
    };

    const resolveEnemyTurn = (current: KochoGameState): { nextState: KochoGameState, vfx: KochoVFX[] } => {
        let nextState = { ...current };
        let enemies = [...nextState.enemies];
        let player = { ...nextState.player };
        let logs = [...nextState.logs];
        let status = nextState.status;
        const generatedVfx: KochoVFX[] = [];

        // Shield Relic
        if (current.relics.some(r => r.id === 'R_SHIELD')) player.shield += 1;

        enemies = enemies.map(e => e.intent ? { ...e, intent: { ...e.intent, timer: Math.max(0, e.intent.timer - 1) } } : e);

        // --- BOSS PHASE LOGIC CHECK (Before Action) ---
        // If Boss HP is 0 but has phases left, revive
        for (let i = 0; i < enemies.length; i++) {
            let e = enemies[i];
            if (e.hp <= 0 && e.type === 'BOSS' && e.bossPhase !== undefined && e.bossPhase < 2) {
                // Revive!
                const nextPhase = e.bossPhase + 1;
                const template = KOCHO_PHASES[nextPhase];
                e.hp = template.maxHp;
                e.maxHp = template.maxHp;
                e.name = template.name;
                e.spriteName = template.sprite;
                e.bossPhase = nextPhase;
                e.intent = { type: 'WAIT', timer: 2 }; // Recover time
                
                logs = [`${e.name}が真の姿を現した！`, ...logs];
                generatedVfx.push({ id: `v_revive_${Date.now()}`, type: 'BUFF', pos: e.pos });
                audioService.playSound('buff');
                enemies[i] = e;
            }
        }

        for (let i = 0; i < enemies.length; i++) {
            let e = { ...enemies[i] };
            if (e.hp <= 0) continue;

            if (e.intent && e.intent.timer === 0) {
                // --- SUMMON LOGIC ---
                if (e.intent.type === 'SUMMON') {
                    // Try to summon a weak mob in an empty spot
                    const emptyPos = [0,1,2,3,4,5,6].filter(p => p !== player.pos && !enemies.some(en => en.hp > 0 && en.pos === p));
                    if (emptyPos.length > 0) {
                        const spawnPos = emptyPos[Math.floor(Math.random() * emptyPos.length)];
                        const mobTemplate = ENEMY_TYPES[0]; // Weakest
                        const newMob: KEntity = {
                            id: `minion_${Date.now()}`, type: 'ENEMY', name: '召喚生徒', pos: spawnPos, facing: spawnPos < 3 ? 1 : -1,
                            maxHp: 3, hp: 3, spriteName: mobTemplate.sprite, shield: 0,
                            intent: { type: 'WAIT', timer: 2 }
                        };
                        enemies.push(newMob); // Add to end of array
                        logs = [`${e.name}が生徒を呼び出した！`, ...logs];
                        generatedVfx.push({ id: `v_sum_${Date.now()}`, type: 'SUMMON', pos: spawnPos });
                    }
                    e.intent = { type: 'WAIT', timer: 2 };
                } 
                else if (e.intent.type === 'ATTACK') {
                    const attackTiles: number[] = [];
                    const range = e.intent.range || [];
                    range.forEach(r => {
                        const tile = e.pos + (r * e.facing);
                        if (tile >= 0 && tile < GRID_SIZE) attackTiles.push(tile);
                    });

                    let hitSomething = false;

                    // Hit Player
                    if (attackTiles.includes(player.pos)) {
                        const dmg = e.intent.damage || 0;
                        const blocked = Math.min(dmg, player.shield);
                        const finalDmg = dmg - blocked;
                        player.hp = Math.max(0, player.hp - finalDmg);
                        player.shield -= blocked;
                        logs = [`${e.name}の攻撃！ ${finalDmg}ダメージ！`, ...logs];
                        generatedVfx.push({ id: `v_atk_p_${Date.now()}_${i}`, type: 'SLASH', pos: player.pos });
                        if (blocked > 0) generatedVfx.push({ id: `v_blk_p_${Date.now()}_${i}`, type: 'BLOCK', pos: player.pos });
                        if (finalDmg > 0) generatedVfx.push({ id: `v_dmg_p_${Date.now()}_${i}`, type: 'TEXT', pos: player.pos, text: finalDmg, color: 'text-red-500' });
                        audioService.playSound('lose');
                        hitSomething = true;
                        if (player.hp <= 0) status = 'GAME_OVER';
                    }

                    if (!hitSomething) logs = [`${e.name}の攻撃は空を切った。`, ...logs];
                    
                    // Trigger Cooldown
                    let cooldown = 1;
                    if (e.type === 'BOSS' && e.bossPhase !== undefined) {
                        cooldown = KOCHO_PHASES[e.bossPhase].attackCooldown;
                    } else if (e.type === 'MID_BOSS') {
                        const mb = MID_BOSSES.find(m => m.name === e.name);
                        if (mb) cooldown = mb.attackCooldown;
                    } else {
                        const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                        cooldown = template.attackCooldown;
                    }
                    e.intent = { type: 'WAIT', timer: cooldown };
                } else {
                    // AI Decision Phase
                    // Determine Template
                    let template: any = ENEMY_TYPES[0];
                    if (e.type === 'BOSS') template = KOCHO_PHASES[e.bossPhase || 0];
                    else if (e.type === 'MID_BOSS') template = MID_BOSSES.find(m => m.name === e.name) || MID_BOSSES[0];
                    else template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];

                    // Boss Summon Logic (Phase 2/3)
                    if (e.type === 'BOSS' && e.bossPhase! > 0 && Math.random() < 0.2) {
                         e.intent = { type: 'SUMMON', timer: 1 };
                    } else {
                        const validRanges = template.range;
                        const dist = e.pos - player.pos;
                        const absDist = Math.abs(dist);
                        const inRange = validRanges.includes(absDist);
                        const neededFacing = dist < 0 ? 1 : -1;
                        const facingCorrect = e.facing === neededFacing;

                        if (inRange && facingCorrect) {
                            e.intent = { type: 'ATTACK', damage: template.attackDmg, range: template.range, timer: 1 };
                        } else {
                            // Move Logic
                            let bestTargetPos = e.pos;
                            let minCost = 999;
                            for (const r of validRanges) {
                                const t1 = player.pos - r;
                                if (t1 >= 0 && t1 < GRID_SIZE) { const cost = Math.abs(e.pos - t1); if (cost < minCost) { minCost = cost; bestTargetPos = t1; } }
                                const t2 = player.pos + r;
                                if (t2 >= 0 && t2 < GRID_SIZE) { const cost = Math.abs(e.pos - t2); if (cost < minCost) { minCost = cost; bestTargetPos = t2; } }
                            }
                            let moveDir = 0;
                            if (bestTargetPos > e.pos) moveDir = 1; else if (bestTargetPos < e.pos) moveDir = -1;

                            if (moveDir !== 0) {
                                const nextPos = e.pos + moveDir;
                                const blocked = enemies.some((other, idx) => idx !== i && other.pos === nextPos && other.hp > 0) || player.pos === nextPos;
                                if (!blocked) e.pos = nextPos;
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
        
        return { nextState: { ...nextState, enemies, player, logs: logs.slice(0, 4), status }, vfx: generatedVfx };
    };

    // --- ACTION HANDLERS ---
    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        const current = stateRef.current;
        const newPos = current.player.pos + dir;
        
        if (newPos >= 0 && newPos < GRID_SIZE && !current.enemies.some(e => e.pos === newPos && e.hp > 0)) {
            let intermediateState = { ...current, player: { ...current.player, pos: newPos } };
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
        if (current.specialActionCooldown > 0) { audioService.playSound('wrong'); addLog("位置交換: クールダウン中"); return; }

        const p = current.player;
        const targetPos = p.pos + p.facing;
        const enemyInFront = current.enemies.find(e => e.pos === targetPos && e.hp > 0);
        
        if (!enemyInFront) { addLog("目の前に敵がいません"); audioService.playSound('wrong'); return; }

        setAnimating(true);
        addLog("位置交換！");
        audioService.playSound('select');
        addVfx('WARP', p.pos); addVfx('WARP', targetPos);
        
        const newEnemies = current.enemies.map(e => e.id === enemyInFront.id ? { ...e, pos: p.pos } : e);
        let intermediateState = { ...current, player: { ...current.player, pos: targetPos }, enemies: newEnemies, specialActionCooldown: 3 + 1 };
        setGameState(intermediateState);

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
        if (card.currentCooldown > 0) { audioService.playSound('wrong'); addLog("クールダウン中！"); return; }
        if (stateRef.current.queue.length >= 3) { addLog("キューが一杯です！"); return; }
        
        setAnimating(true);
        audioService.playSound('select');
        let current = stateRef.current;
        const newHand = [...current.hand];
        newHand.splice(idx, 1);
        const intermediateState = { ...current, hand: newHand, queue: [...current.queue, card] };
        setGameState(intermediateState);

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
        setGameState(prev => ({ ...prev, queue: newQueue, hand: [...prev.hand, card] }));
    };

    const executeQueue = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating || stateRef.current.queue.length === 0) return;
        setAnimating(true);
        setGameState(prev => ({ ...prev, status: 'EXECUTING' }));

        const queue = [...stateRef.current.queue];
        const cardsReturningToHand: KCard[] = [];
        let currentState = { ...stateRef.current };

        // --- PLAYER COMBO ---
        for (const card of queue) {
            if (currentState.status === 'GAME_OVER') break;
            addLog(`${card.name}！`);
            const p = currentState.player; const pPos = p.pos;
            let nextPlayer = { ...p }; let nextEnemies = currentState.enemies.map(e => ({...e}));
            let hit = false;
            let dmgBonus = 0;
            if (currentState.relics.some(r => r.id === 'R_GLOVES')) dmgBonus += 1;

            let targets: number[] = [];
            if (card.effectType === 'FURTHEST') {
                let furthestDist = -1; let targetPos = -1;
                nextEnemies.forEach(e => {
                    if (e.hp <= 0) return;
                    const dist = Math.abs(e.pos - pPos);
                    if (dist > furthestDist) { furthestDist = dist; targetPos = e.pos; }
                });
                if (targetPos !== -1) targets = [targetPos];
            } else {
                targets = card.range.map(r => pPos + (r * p.facing));
            }

            if (card.type === 'ATTACK') {
                if (card.effectType === 'DASH_ATTACK') {
                    let finalPos = pPos;
                    for (let i = 1; i <= Math.max(...card.range); i++) {
                        const checkPos = pPos + (i * p.facing);
                        if (checkPos < 0 || checkPos >= GRID_SIZE) break;
                        const hitEnemy = nextEnemies.find(e => e.pos === checkPos && e.hp > 0);
                        if (hitEnemy) { targets = [checkPos]; break; }
                        finalPos = checkPos;
                    }
                    nextPlayer.pos = finalPos;
                }

                const hits = nextEnemies.filter(e => targets.includes(e.pos) && e.hp > 0);
                const isRanged = card.range.some(r => r > 1);
                if (isRanged && hits.length === 0) {
                    targets.forEach(t => { if (t >= 0 && t < GRID_SIZE) addVfx('BLAST', t, { color: 'text-gray-500' }); });
                }

                if (hits.length > 0) {
                    hit = true;
                    hits.forEach(e => {
                        let finalDmg = card.damage + dmgBonus;
                        if (card.effectType === 'COUNTER') {
                            if (e.intent && (e.intent.type === 'ATTACK' || e.intent.timer <= 1)) {
                                finalDmg *= 3; addLog("カウンター成功！"); addVfx('COUNTER', e.pos);
                            }
                        }
                        e.hp -= finalDmg;
                        addLog(`${e.name} に ${finalDmg} ダメージ！`);
                        addVfx(isRanged ? 'BLAST' : 'SLASH', e.pos);
                        addVfx('TEXT', e.pos, { text: finalDmg, color: 'text-yellow-400' });

                        if (card.effectType === 'PUSH') {
                            const pushDir = p.facing; let targetPos = e.pos;
                            for(let k=0; k<2; k++) {
                                const next = targetPos + pushDir;
                                const isBlocked = nextEnemies.some(o => o.pos === next && o.hp > 0) || nextPlayer.pos === next || next < 0 || next >= GRID_SIZE;
                                if (!isBlocked) targetPos = next; else break;
                            }
                            if (targetPos !== e.pos) { e.pos = targetPos; addLog(`${e.name}を吹き飛ばした！`); addVfx('IMPACT', e.pos); }
                        }
                        if (card.effectType === 'PULL') {
                            const dest = p.pos + p.facing; 
                            const isBlocked = nextEnemies.some(o => o.pos === dest && o.id !== e.id && o.hp > 0) || nextPlayer.pos === dest;
                            if (!isBlocked && dest >= 0 && dest < GRID_SIZE) { e.pos = dest; addLog(`${e.name}を引き寄せた！`); addVfx('IMPACT', e.pos); }
                        }
                    });
                    if (card.effectType === 'RECOIL') {
                        const recoilPos = p.pos - p.facing;
                        const isBlocked = nextEnemies.some(e => e.pos === recoilPos && e.hp > 0) || recoilPos < 0 || recoilPos >= GRID_SIZE;
                        if (!isBlocked) { nextPlayer.pos = recoilPos; addLog("反動で後退！"); }
                    }
                    if (card.shield && card.shield > 0) { nextPlayer.shield += card.shield; addLog(`シールド +${card.shield}`); addVfx('BLOCK', p.pos); }
                    audioService.playSound('attack');
                } else {
                    addLog("空振り..."); audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                const dist = card.range[0]; const target = pPos + (dist * p.facing);
                if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target && e.hp > 0)) {
                    nextPlayer.pos = target; audioService.playSound('select');
                } else { addLog("移動できない！"); }
            } else if (card.type === 'UTILITY') {
                if (card.name === 'バックステップ') {
                    const target = pPos - p.facing;
                    if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target && e.hp > 0)) {
                        nextPlayer.pos = target; audioService.playSound('select');
                    }
                } else if (card.shield && card.shield > 0) {
                    nextPlayer.shield += card.shield; addVfx('BLOCK', p.pos); audioService.playSound('block');
                }
            }

            currentState = { ...currentState, player: nextPlayer, enemies: nextEnemies };
            cardsReturningToHand.push({ ...card, currentCooldown: card.cooldown });
            setGameState(currentState);
            await new Promise(r => setTimeout(r, 400));
        }

        // --- ENEMY TURN (Once after Combo) ---
        if (currentState.status !== 'GAME_OVER' && currentState.enemies.some(e => e.hp > 0)) {
             const anyEnemyActing = currentState.enemies.some(e => e.hp > 0 && e.intent && e.intent.timer <= 1);
             const delay = anyEnemyActing ? 250 : 30;
             await new Promise(r => setTimeout(r, delay));
             const { nextState, vfx } = resolveEnemyTurn(currentState);
             vfx.forEach(v => addVfx(v.type, v.pos, v));
             currentState = tickCooldowns(nextState);
             setGameState(currentState);
             if (anyEnemyActing) await new Promise(r => setTimeout(r, 400));
        }

        // --- PHASE TRANSITION LOGIC ---
        setGameState(prev => {
            if (prev.status === 'GAME_OVER') return prev;
            let newHand = [...prev.hand, ...cardsReturningToHand];
            
            // Check if all enemies dead (ignoring reviving bosses for a split second, handled in resolve)
            const aliveEnemies = currentState.enemies.filter(e => e.hp > 0);
            
            if (aliveEnemies.length === 0) {
                // Determine Next Step based on current SubPhase
                const currentStage = prev.stage;
                const currentSub = prev.subPhase;
                const rewardMoney = 10 + currentStage * 2;
                
                let nextSub: SubPhase = 'TUTORIAL';
                let nextStage = currentStage;
                let nextStatus: KochoGameState['status'] = 'WAVE_CLEAR';
                
                // Flow Logic
                if (currentSub === 'TUTORIAL') {
                    // Stage 1 Done -> Shop (Skipping reward for tutorial simplicity? No let's do reward)
                    nextSub = 'REWARD';
                } else if (currentSub === 'PART_1') {
                    nextSub = 'REWARD';
                } else if (currentSub === 'REWARD') {
                     // Should be handled by UI, but logic here for safety
                } else if (currentSub === 'PART_2') {
                    nextSub = 'CAMPFIRE';
                } else if (currentSub === 'MID_BOSS') {
                    nextSub = 'SHOP';
                } else if (currentSub === 'FINAL_BOSS') {
                    nextStatus = 'VICTORY';
                    return { ...prev, status: 'VICTORY', queue: [], hand: newHand, enemies: [], money: prev.money + 100 };
                }

                // Auto transitions for clear
                if (nextStatus === 'WAVE_CLEAR') {
                    setTimeout(() => handleSubPhaseComplete(nextSub, nextStage, rewardMoney), 1000);
                    return { ...prev, status: 'PHASE_CLEAR', queue: [], hand: newHand, enemies: [], money: prev.money + rewardMoney, logs: [...prev.logs, `Clear! +${rewardMoney}G`] };
                }
            }

            return { ...prev, status: 'PLAYING', queue: [], hand: newHand };
        });
        setAnimating(false);
    };

    const handleSubPhaseComplete = (nextSub: SubPhase, nextStage: number, money: number) => {
        // Handle transitions
        if (nextSub === 'REWARD') {
            generateRewards();
            setGameState(prev => ({ ...prev, subPhase: 'REWARD', status: 'PLAYING' }));
            audioService.playSound('win');
        } else if (nextSub === 'CAMPFIRE') {
            setGameState(prev => ({ ...prev, subPhase: 'CAMPFIRE', status: 'PLAYING', campfireUsed: false }));
            audioService.playBGM('menu');
        } else if (nextSub === 'SHOP') {
            setGameState(prev => ({ ...prev, subPhase: 'SHOP', status: 'PLAYING', shopUpgradeUsed: false }));
            audioService.playBGM('poker_shop');
        } else {
             // Go to next battle part immediately? No, usually triggered by UI
        }
    };

    const proceedNext = () => {
        const current = stateRef.current;
        if (current.subPhase === 'REWARD') {
            // Already handled by selection
        } else if (current.subPhase === 'CAMPFIRE') {
            // Go to Mid Boss
            startWave(1, 'MID_BOSS', current.stage);
        } else if (current.subPhase === 'SHOP') {
            // Go to Next Stage
            startStage(current.stage + 1);
        } else if (current.subPhase === 'TUTORIAL') {
            // Go to Reward (handled by logic above, this might be redundant)
        }
    };

    const generateRewards = () => {
        const pool = CARD_DB.filter(c => !stateRef.current.hand.some(h => h.name === c.name)); 
        const options: KCard[] = [];
        for (let i = 0; i < 2; i++) {
            const template = pool[Math.floor(Math.random() * pool.length)] || pool[0];
            options.push({ ...template, id: `rew_${Date.now()}_${i}`, currentCooldown: 0, slots: 0 });
        }
        setRewardCards(options);
    };

    const selectReward = (card: KCard) => {
        const nextSub = stateRef.current.subPhase === 'TUTORIAL' ? 'SHOP' : 'PART_2'; // Tut -> Shop, Part1 -> Part2
        
        setGameState(prev => ({
            ...prev,
            hand: [...prev.hand, card],
            subPhase: nextSub,
            status: 'PLAYING'
        }));
        
        if (nextSub === 'PART_2') {
             setTimeout(() => startWave(1, 'PART_2', stateRef.current.stage), 100);
        } else if (nextSub === 'SHOP') {
             // Go to Shop for tutorial flow
             audioService.playBGM('poker_shop');
        }
    };

    // --- CAMPFIRE LOGIC ---
    const useCampfire = (index: number) => {
        if (gameState.campfireUsed) return;
        
        const newHand = [...gameState.hand];
        const card = { ...newHand[index] };
        
        // Free Upgrade
        card.damage += 1; // Simple upgrade
        card.upgraded = true;
        newHand[index] = card;

        setGameState(prev => ({
            ...prev,
            hand: newHand,
            campfireUsed: true
        }));
        audioService.playSound('buff');
        addLog(`${card.name}を強化した！`);
    };

    // --- SHOP LOGIC ---
    const buyShopItem = (item: KRelic) => {
        if (gameState.money >= item.price) {
            if (item.id === 'R_POTION') {
                setGameState(prev => ({
                    ...prev,
                    money: prev.money - item.price,
                    player: { ...prev.player, hp: Math.min(prev.player.maxHp, prev.player.hp + 10) }
                }));
                audioService.playSound('buff');
                addLog("HPが回復した！");
            } else {
                if (gameState.relics.some(r => r.id === item.id)) return;
                setGameState(prev => ({
                    ...prev,
                    money: prev.money - item.price,
                    relics: [...prev.relics, item]
                }));
                audioService.playSound('select');
                addLog(`${item.name}を購入！`);
            }
        } else {
            audioService.playSound('wrong');
        }
    };

    // Shop Upgrade System (Paid)
    const selectCardForUpgrade = (index: number) => {
        if (gameState.shopUpgradeUsed) {
            addLog("ショップでの強化は1回までです。");
            audioService.playSound('wrong');
            return;
        }
        generateUpgradeOffer();
        setUpgradeSelection({ active: true, cardIndex: index, rerollCount: 0, currentOffer: null });
        audioService.playSound('select');
    };

    const generateUpgradeOffer = () => {
        const offer = UPGRADE_POOLS[Math.floor(Math.random() * UPGRADE_POOLS.length)];
        setUpgradeSelection(prev => ({ ...prev, currentOffer: offer }));
    };

    const rerollUpgrade = () => {
        if (gameState.money < 10) { audioService.playSound('wrong'); return; }
        if (upgradeSelection.rerollCount >= 3) { audioService.playSound('wrong'); return; }
        setGameState(prev => ({ ...prev, money: prev.money - 10 }));
        generateUpgradeOffer();
        setUpgradeSelection(prev => ({ ...prev, rerollCount: prev.rerollCount + 1 }));
        audioService.playSound('select');
    };

    const confirmUpgrade = () => {
        const { cardIndex, currentOffer } = upgradeSelection;
        if (cardIndex === null || !currentOffer) return;
        let newHand = [...gameState.hand];
        const card = { ...newHand[cardIndex] };
        
        switch (currentOffer.type) {
            case 'DMG_1': card.damage += 1; break;
            case 'DMG_1_CD_1': card.damage += 1; card.cooldown += 1; break;
            case 'DMG_2_CD_3': card.damage += 2; card.cooldown += 3; break;
            case 'CD_MINUS_1': card.cooldown = Math.max(0, card.cooldown - 1); break;
            case 'CD_MINUS_2': card.cooldown = Math.max(0, card.cooldown - 2); break;
            case 'CD_MINUS_4_DMG_MINUS_1': card.cooldown = Math.max(0, card.cooldown - 4); card.damage = Math.max(0, card.damage - 1); break;
            case 'SLOT_1': card.slots = (card.slots || 0) + 1; break;
            case 'SLOT_1_CD_MINUS_1': card.slots = (card.slots || 0) + 1; card.cooldown = Math.max(0, card.cooldown - 1); break;
            case 'SACRIFICE': newHand.splice(cardIndex, 1); setGameState(prev => ({ ...prev, money: prev.money + 40 })); break;
            case 'GAMBLE': 
                const pool = CARD_DB.filter(c => c.name !== card.name);
                const randomCard = pool[Math.floor(Math.random() * pool.length)];
                newHand[cardIndex] = { ...randomCard, id: card.id, currentCooldown: 0, slots: 0 };
                break;
        }

        if (currentOffer.type !== 'SACRIFICE' && currentOffer.type !== 'GAMBLE') {
            card.upgraded = true;
            newHand[cardIndex] = card;
        }

        setGameState(prev => ({ ...prev, hand: newHand, shopUpgradeUsed: true }));
        setUpgradeSelection({ active: false, cardIndex: null, currentOffer: null, rerollCount: 0 });
        audioService.playSound('buff');
    };

    // --- RENDER HELPERS ---
    const getGridContent = (idx: number) => {
        const p = gameState.player;
        const e = gameState.enemies.find(en => en.pos === idx && en.hp > 0);
        const cellVfx = vfxList.filter(v => v.pos === idx);
        
        return (
            <div className="relative w-full h-full flex items-end justify-center">
                {/* VFX Layer */}
                {cellVfx.map(v => (
                    <div key={v.id} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        {v.type === 'SLASH' && <div className="w-full h-1 bg-white rotate-45 animate-ping shadow-[0_0_10px_white]"></div>}
                        {v.type === 'BLAST' && <div className="w-full h-full rounded-full border-4 border-orange-500 animate-ping"></div>}
                        {v.type === 'BLOCK' && <div className="text-blue-400 animate-bounce"><Shield size={32} /></div>}
                        {v.type === 'TEXT' && <div className={`text-xl font-bold animate-bounce ${v.color || 'text-white'} drop-shadow-md`}>{v.text}</div>}
                        {v.type === 'COUNTER' && <div className="text-yellow-400 font-bold text-xs animate-pulse">COUNTER!</div>}
                        {v.type === 'IMPACT' && <div className="absolute w-full h-full bg-white/50 animate-ping rounded-full"></div>}
                        {v.type === 'WARP' && <div className="text-cyan-400 animate-spin"><Move size={24}/></div>}
                        {v.type === 'SUMMON' && <div className="text-purple-400 animate-ping"><Ghost size={32}/></div>}
                        {v.type === 'BUFF' && <div className="text-yellow-400 animate-pulse"><ArrowUp size={32}/></div>}
                    </div>
                ))}

                {p.pos === idx && (
                    <div className="relative w-full h-full flex items-end justify-center z-10">
                        <div className={`transition-transform duration-200 ${p.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                            <PixelSprite seed="HERO" name={p.spriteName} className="w-16 h-16 md:w-32 md:h-32"/>
                        </div>
                        {p.shield > 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded border border-white">{p.shield}</div>}
                        <div className="absolute -bottom-6 w-20 text-center bg-black/50 text-white text-xs rounded border border-green-500">HP {p.hp}/{p.maxHp}</div>
                    </div>
                )}
                {e && (
                    <div className="relative w-full h-full flex items-end justify-center z-10">
                        <div className={`transition-transform duration-200 ${e.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                            <PixelSprite seed={e.id} name={e.spriteName} className="w-16 h-16 md:w-32 md:h-32"/>
                        </div>
                        {e.intent && e.intent.type === 'ATTACK' && e.intent.timer === 1 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                    <Swords size={12} className="mr-1"/> !
                                </div>
                            </div>
                        )}
                        {e.intent && e.intent.type === 'SUMMON' && (
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 animate-pulse">
                                <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                    <Ghost size={12} className="mr-1"/> !
                                </div>
                            </div>
                        )}
                        {e.intent && e.intent.type === 'WAIT' && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                                <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                    <Hourglass size={12} className="mr-1"/> {e.intent.timer}
                                </div>
                            </div>
                        )}
                        <div className="absolute -bottom-6 w-16 text-center bg-black/50 text-white text-xs rounded border border-red-500">{e.hp}/{e.maxHp}</div>
                    </div>
                )}
            </div>
        );
    };

    const isDangerZone = (idx: number) => {
        return gameState.enemies.some(e => {
            if (e.hp <= 0) return false;
            if (e.intent?.type === 'ATTACK' && e.intent.timer === 1) {
                const range = e.intent.range || [];
                const targets = range.map(r => e.pos + (r * e.facing));
                return targets.includes(idx);
            }
            return false;
        });
    };

    // --- MAIN RENDER ---
    return (
        <div className="flex flex-col h-full w-full bg-[#1a1a2e] text-white font-mono relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/40 border-b border-indigo-500/30 shrink-0">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white"><ArrowLeft className="mr-2"/> Quit</button>
                <h2 className="text-xl font-bold text-indigo-100 tracking-widest hidden md:block flex items-center">
                    KOCHO SHOWDOWN <span className="text-sm text-pink-400 ml-2">Stage {gameState.stage} - {gameState.subPhase}</span>
                </h2>
                <div className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <Coins size={16}/> {gameState.money} G
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
                
                {/* LEFT COLUMN: Game Field */}
                <div className="flex-1 relative bg-[#1a1a2e] flex flex-col items-center justify-center p-4 overflow-hidden">
                    
                    {/* OVERLAYS (Victory, GameOver, Reward, Shop, Campfire) */}
                    {(gameState.status === 'VICTORY' || gameState.status === 'GAME_OVER' || gameState.subPhase === 'REWARD' || gameState.subPhase === 'SHOP' || gameState.subPhase === 'CAMPFIRE') && (
                        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-4">
                            
                            {/* REWARD UI */}
                            {gameState.subPhase === 'REWARD' && (
                                <div className="text-center w-full">
                                    <h2 className="text-3xl font-bold text-yellow-400 mb-8 flex items-center justify-center"><Gift className="mr-2"/> Card Reward</h2>
                                    <div className="flex gap-4 md:gap-8 justify-center flex-wrap">
                                        {rewardCards.map((card, i) => (
                                            <div key={i} className="w-32 md:w-40 bg-slate-800 border-4 border-yellow-500 rounded-xl p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => selectReward(card)}>
                                                <div className="text-4xl mb-4 text-indigo-400">{card.icon}</div>
                                                <div className="font-bold text-white mb-2 text-center text-sm md:text-base">{card.name}</div>
                                                <div className="text-xs text-gray-400 text-center">{card.description}</div>
                                                <button className="mt-4 bg-yellow-600 text-black font-bold px-4 py-1 rounded-full text-xs">Select</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CAMPFIRE UI */}
                            {gameState.subPhase === 'CAMPFIRE' && (
                                <div className="text-center w-full">
                                    <h2 className="text-3xl font-bold text-orange-400 mb-4 flex items-center justify-center"><Flame className="mr-2"/> Rest Site</h2>
                                    <p className="text-gray-400 mb-8">Choose one card to upgrade for free.</p>
                                    
                                    {!gameState.campfireUsed ? (
                                        <div className="flex gap-2 justify-center flex-wrap max-w-4xl overflow-y-auto max-h-[60vh] custom-scrollbar p-2">
                                            {gameState.hand.map((card, i) => (
                                                <div key={i} className="bg-slate-800 p-2 rounded border border-slate-600 hover:border-orange-500 cursor-pointer w-24 h-32 flex flex-col items-center justify-between" onClick={() => useCampfire(i)}>
                                                    <div className="text-[10px] text-center font-bold">{card.name}</div>
                                                    <div className="text-orange-400">{card.icon}</div>
                                                    <div className="text-[9px] text-gray-400 text-center">DMG+1</div>
                                                    <div className="text-[9px] bg-black px-1 rounded">Lv.{card.upgraded ? 2 : 1}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xl text-yellow-300 mb-6">Rested and ready!</p>
                                            <button onClick={proceedNext} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg">Proceed</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SHOP UI */}
                            {gameState.subPhase === 'SHOP' && (
                                <div className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto relative">
                                    {/* ... Shop UI (Reuse previous, add Next button) ... */}
                                    {upgradeSelection.active && upgradeSelection.currentOffer && (
                                         <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-200 rounded-lg">
                                            <h3 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-yellow-600 pb-2">Blacksmith</h3>
                                            <div className="bg-slate-800 border-2 border-indigo-500 p-6 rounded-xl text-center mb-8 w-full max-w-sm">
                                                <div className={`text-6xl mb-4 flex justify-center ${upgradeSelection.currentOffer.color}`}>{upgradeSelection.currentOffer.icon}</div>
                                                <div className="text-xl font-bold mb-2">{upgradeSelection.currentOffer.description}</div>
                                                <div className="text-gray-400 text-sm">Target: {gameState.hand[upgradeSelection.cardIndex!]?.name}</div>
                                            </div>
                                            <div className="flex flex-col gap-4 w-full max-w-xs">
                                                <button onClick={confirmUpgrade} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"><Hammer className="mr-2"/> Apply</button>
                                                <button onClick={rerollUpgrade} disabled={upgradeSelection.rerollCount >= 3 || gameState.money < 10} className={`bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center shadow-lg transition-colors ${upgradeSelection.rerollCount >= 3 || gameState.money < 10 ? 'opacity-50 cursor-not-allowed' : ''}`}><RefreshCw className="mr-2"/> Reroll (10G)</button>
                                                <button onClick={() => setUpgradeSelection({active:false, cardIndex:null, currentOffer:null, rerollCount:0})} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mb-6 shrink-0">
                                         <h2 className="text-3xl font-bold text-indigo-400 flex items-center"><ShoppingBag className="mr-2"/> Shop</h2>
                                         <button onClick={proceedNext} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center shadow-lg">Next Stage <ArrowRight className="ml-2"/></button>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 flex-grow">
                                        <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-4 overflow-y-auto custom-scrollbar">
                                            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                                                <span className="flex items-center"><Hammer className="mr-2 text-red-400"/> Deck Upgrade</span>
                                                <span className={`text-xs ${gameState.shopUpgradeUsed ? 'text-red-500' : 'text-green-400'}`}>{gameState.shopUpgradeUsed ? '(Done)' : '(Once)'}</span>
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {gameState.hand.map((card, i) => (
                                                    <div key={i} className={`bg-slate-800 p-3 rounded border relative transition-all ${gameState.shopUpgradeUsed ? 'opacity-50 cursor-not-allowed border-slate-600' : 'hover:border-yellow-400 cursor-pointer border-slate-600'}`} onClick={() => selectCardForUpgrade(i)}>
                                                        <div className="font-bold text-sm text-white mb-1">{card.name} {card.upgraded && <span className="text-yellow-400 text-xs">★</span>}</div>
                                                        <div className="text-xs text-gray-400 mb-2">{card.description}</div>
                                                        <div className="flex gap-2 text-[10px]">{card.damage > 0 && <span className="text-red-400 bg-red-900/30 px-1 rounded">ATK:{card.damage}</span>}<span className="text-blue-400 bg-blue-900/30 px-1 rounded">CD:{card.cooldown}</span></div>
                                                        {!gameState.shopUpgradeUsed && <div className="absolute top-2 right-2 text-yellow-500"><Plus size={16}/></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-full md:w-80 bg-slate-900 border border-slate-600 rounded-lg p-4 shrink-0">
                                            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Gift className="mr-2 text-yellow-400"/> Relics</h3>
                                            <div className="space-y-4">
                                                {SHOP_RELICS.map(item => {
                                                    const owned = gameState.relics.some(r => r.id === item.id) && item.id !== 'R_POTION';
                                                    return (
                                                        <div key={item.id} className={`bg-slate-800 p-3 rounded border flex justify-between items-center ${owned ? 'opacity-50 border-gray-700' : 'border-slate-500'}`}>
                                                            <div><div className="font-bold text-sm text-yellow-200">{item.name}</div><div className="text-xs text-gray-400">{item.desc}</div></div>
                                                            <button disabled={owned} onClick={() => buyShopItem(item)} className={`px-3 py-1 rounded text-sm font-bold ${owned ? 'bg-gray-600 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}>{owned ? 'Sold' : `${item.price}G`}</button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* VICTORY / GAMEOVER */}
                            {gameState.status === 'VICTORY' && (
                                <div className="text-center animate-in zoom-in">
                                    <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce mx-auto"/>
                                    <h2 className="text-4xl font-bold text-white mb-4">GRADUATION!</h2>
                                    <p className="text-gray-300 mb-8">You defeated the Principal.</p>
                                    <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded text-xl font-bold hover:bg-indigo-500">Return</button>
                                </div>
                            )}
                            {gameState.status === 'GAME_OVER' && (
                                <div className="text-center animate-in zoom-in">
                                    <Skull size={64} className="text-red-500 mb-4 mx-auto"/>
                                    <h2 className="text-4xl font-bold text-red-500 mb-4">EXPELLED</h2>
                                    <button onClick={() => startStage(1)} className="bg-white text-black px-8 py-3 rounded text-xl font-bold hover:bg-gray-200">Retry</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Gameplay View */}
                    {['PLAYING', 'EXECUTING', 'WAVE_CLEAR', 'PHASE_CLEAR'].includes(gameState.status) && (
                        <>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg text-center pointer-events-none z-10">
                                {gameState.logs.map((log, i) => (
                                    <div key={i} className={`text-sm ${i===0 ? 'text-white font-bold text-shadow-md' : 'text-gray-500'} transition-opacity duration-500`}>{log}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1 md:gap-2 w-full max-w-full md:max-w-5xl px-2 mb-4 shrink-0 max-h-full aspect-[7/2] md:aspect-auto">
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

                {/* RIGHT COLUMN: Controls */}
                {gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY' && !['REWARD','SHOP','CAMPFIRE'].includes(gameState.subPhase) && (
                    <div className="w-full md:w-80 bg-[#0f0f1b] border-t md:border-t-0 md:border-l border-indigo-900 p-2 md:p-4 shrink-0 flex flex-col gap-2 md:h-full md:overflow-y-auto custom-scrollbar">
                        
                        {/* 1. Queue Display */}
                        <div className="flex justify-between items-center gap-2 bg-black/30 p-2 rounded-lg border border-indigo-900/30 shrink-0">
                            <div className="flex gap-1 justify-center items-center flex-grow">
                                {[...Array(3)].map((_, i) => {
                                    const card = gameState.queue[i];
                                    return card ? (
                                        <div key={i} className="w-12 h-16 md:w-16 md:h-20 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-center relative group cursor-pointer hover:border-red-400 shrink-0" onClick={() => handleUnqueueCard(i)}>
                                            <div className={`w-full h-1 ${card.color} absolute top-0`}></div>
                                            <div className="text-[9px] md:text-xs text-center font-bold px-1 overflow-hidden whitespace-nowrap text-ellipsis w-full">{card.name}</div>
                                            <div className="text-gray-400 scale-75">{card.icon}</div>
                                            <X size={12} className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100"/>
                                        </div>
                                    ) : (
                                        <div key={`empty-${i}`} className="w-12 h-16 md:w-16 md:h-20 border border-dashed border-gray-700 rounded flex items-center justify-center text-gray-700 text-[9px] shrink-0">Empty</div>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={executeQueue} 
                                disabled={gameState.queue.length === 0 || animating}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shadow-lg transition-all shrink-0 ${gameState.queue.length > 0 ? 'bg-indigo-600 border-indigo-400 text-white hover:scale-105 active:scale-95 cursor-pointer animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Play size={20} className="fill-current mb-1"/> EXEC
                            </button>
                        </div>

                        {/* 2. Hand Cards */}
                        <div className="flex md:flex-col md:flex-nowrap gap-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto pb-2 px-1 custom-scrollbar min-h-[100px] md:min-h-0 md:flex-grow items-center md:items-stretch">
                            {gameState.hand.map((card, i) => (
                                <div 
                                    key={card.id} 
                                    className={`w-20 h-28 md:w-full md:h-auto bg-slate-800 border-2 rounded-lg flex flex-col md:flex-row justify-between p-1 md:p-2 cursor-pointer transition-transform relative shadow-lg shrink-0 md:shrink ${card.upgraded ? 'border-yellow-400' : 'border-slate-600'} ${card.currentCooldown > 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-2 md:hover:translate-y-0 md:hover:translate-x-2'}`}
                                    onClick={() => handleQueueCard(card, i)}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1 md:w-1 md:h-full ${card.color} rounded-t-sm md:rounded-l-sm`}></div>
                                    <div className="flex flex-col h-full w-full md:hidden">
                                        <div className="mt-1 text-[9px] font-bold text-center leading-tight truncate">{card.name}</div>
                                        <div className="flex justify-center my-0.5 text-indigo-300 scale-75">{card.icon}</div>
                                        <div className="text-[8px] text-gray-400 text-center leading-tight h-6 overflow-hidden">{card.description}</div>
                                        <div className="flex justify-between items-center text-[8px] text-gray-500 mt-auto font-mono w-full">
                                            <span>CD:{card.cooldown}</span>
                                            {card.damage > 0 ? <span className="text-red-400 font-bold">{card.damage}</span> : <span className="opacity-70">{card.type}</span>}
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-row items-center w-full pl-2 gap-2">
                                        <div className="text-indigo-300">{card.icon}</div>
                                        <div className="flex-grow min-w-0">
                                            <div className="text-xs font-bold truncate">{card.name}</div>
                                            <div className="text-[10px] text-gray-400 truncate">{card.description}</div>
                                        </div>
                                        <div className="flex flex-col items-end text-[10px] font-mono shrink-0">
                                            <span className="text-gray-500">CD:{card.cooldown}</span>
                                            {card.damage > 0 && <span className="text-red-400 font-bold flex items-center"><Swords size={10} className="mr-0.5"/>{card.damage}</span>}
                                        </div>
                                    </div>
                                    {card.currentCooldown > 0 && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10">
                                            <Clock size={20} className="text-gray-400 mb-1"/>
                                            <span className="text-xl font-bold text-white">{card.currentCooldown}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 3. Movement Controls */}
                        <div className="flex justify-center items-center gap-4 py-2 border-t border-indigo-900/30 relative shrink-0">
                            <button onClick={() => handleMove(-1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-full border border-slate-500 active:bg-slate-800 transition-colors shadow-lg"><ChevronLeft size={24}/></button>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-1">
                                    <button onClick={handleTurn} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg border border-slate-500 text-sm font-bold flex items-center justify-center active:bg-slate-800 transition-colors w-16">TURN</button>
                                    <button onClick={handleSwapPosition} className={`px-2 py-2 rounded-lg border flex items-center justify-center transition-colors w-12 ${gameState.specialActionCooldown > 0 ? 'bg-gray-800 border-gray-600 text-gray-500' : 'bg-cyan-700 border-cyan-400 text-cyan-100 hover:bg-cyan-600 active:scale-95'}`} title="位置交換 (CD: 3)">{gameState.specialActionCooldown > 0 ? <span className="text-xs font-bold">{gameState.specialActionCooldown}</span> : <RefreshCw size={16} />}</button>
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
