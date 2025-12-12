
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, X, RotateCcw, Swords, Shield, RefreshCw, Zap, Trophy, Skull, ChevronsRight, ChevronLeft, ChevronRight, Clock, Ghost, ArrowRightLeft, Gift, ShoppingBag, Hammer, Coins, Plus, Crosshair, Heart, Move, AlertTriangle, Hourglass, Maximize2, Minimize2, Wind, Anchor, Flame, Activity, ArrowUp, Dna, Shuffle, Star } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left
type CardEffectType = 'NORMAL' | 'COUNTER' | 'PUSH' | 'PULL' | 'RECOIL' | 'DASH_ATTACK' | 'FURTHEST' | 'PIERCE' | 'TELEPORT';
type GameSubStep = 'WAVE_1' | 'REWARD' | 'WAVE_2' | 'UPGRADE' | 'MID_BOSS' | 'SHOP' | 'FINAL_BOSS';

interface KCard {
    id: string;
    name: string;
    type: 'ATTACK' | 'MOVE' | 'UTILITY';
    range: number[]; // Relative range
    damage: number;
    shield?: number;
    cooldown: number; 
    currentCooldown: number; // Runtime state
    color: string;
    icon: React.ReactNode;
    description: string;
    energyCost: number; 
    upgraded?: boolean;
    effectType?: CardEffectType;
    slots?: number; // Extra upgrade slots
}

interface KEntity {
    id: string;
    type: 'PLAYER' | 'ENEMY';
    enemyType?: string; // For Boss Logic
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
        timer: number; // Turns until execution
    };
    
    // Status
    shield: number;
}

interface KRelic {
    id: string;
    name: string;
    desc: string;
    price: number;
}

interface KochoVFX {
    id: string;
    type: 'SLASH' | 'BLAST' | 'TEXT' | 'BLOCK' | 'HEAL' | 'BUFF' | 'COUNTER' | 'IMPACT' | 'WARP' | 'EVOLVE';
    pos: number;
    text?: string | number;
    color?: string;
}

interface KochoGameState {
    stage: number; // 1-7
    subStep: GameSubStep;
    wave: number;
    maxWaves: number;
    turn: number;
    gridSize: number;
    player: KEntity;
    enemies: KEntity[];
    hand: KCard[];
    queue: KCard[]; // Max 3
    deck: KCard[]; 
    discard: KCard[]; 
    status: 'PLAYING' | 'EXECUTING' | 'GAME_OVER' | 'VICTORY' | 'WAVE_CLEAR' | 'STEP_CLEAR';
    logs: string[];
    specialActionCooldown: number;
    money: number;
    relics: KRelic[];
    shopUpgradeUsed: boolean;
    bossPhase: number; // 1, 2, 3 for Final Boss
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
    { id: 'R_POTION', name: '給食の牛乳', desc: 'HPを10回復', price: 15 }, // Instant consumable
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
    { name: '不良生徒', maxHp: 3, sprite: 'SENIOR|#a855f7', attackDmg: 2, range: [1], speed: 3, attackCooldown: 1 }, 
    { name: '熱血教師', maxHp: 6, sprite: 'TEACHER|#ef4444', attackDmg: 4, range: [1], speed: 4, attackCooldown: 2 },
    { name: '用務員', maxHp: 4, sprite: 'HUMANOID|#3e2723', attackDmg: 3, range: [1, 2], speed: 5, attackCooldown: 1 },
    { name: '飼育委員', maxHp: 3, sprite: 'GIRL|#a5d6a7', attackDmg: 1, range: [1, 2], speed: 3, attackCooldown: 1 },
];

const MID_BOSS_TYPES = [
    { name: '体育教師(強)', maxHp: 20, sprite: 'MUSCLE|#1565c0', attackDmg: 6, range: [1], speed: 6, attackCooldown: 2 },
    { name: 'マッドサイエンス', maxHp: 18, sprite: 'WIZARD|#00bcd4', attackDmg: 5, range: [2, 3], speed: 3, attackCooldown: 2 },
    { name: '音楽の亡霊', maxHp: 15, sprite: 'GHOST|#9c27b0', attackDmg: 4, range: [1, 2, 3], speed: 4, attackCooldown: 1 },
    { name: '図書室の主', maxHp: 25, sprite: 'BOSS|#795548', attackDmg: 8, range: [1], speed: 2, attackCooldown: 3 },
    { name: '教頭先生', maxHp: 30, sprite: 'TEACHER|#3e2723', attackDmg: 7, range: [1, 2], speed: 5, attackCooldown: 2 },
];

const FINAL_BOSS_PHASES = [
    { name: '校長先生', maxHp: 40, sprite: 'BOSS|#FFD700', attackDmg: 6, range: [1, 2], speed: 4, attackCooldown: 2 },
    { name: '激怒した校長', maxHp: 50, sprite: 'BOSS|#d32f2f', attackDmg: 8, range: [1, 2, 3], speed: 5, attackCooldown: 1 },
    { name: '真・校長先生', maxHp: 60, sprite: 'BOSS|#212121', attackDmg: 10, range: [1, 2, 3, 4], speed: 6, attackCooldown: 2 },
];

const GRID_SIZE = 7;

// --- COMPONENT ---
const KochoShowdown: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    
    // State
    const [gameState, setGameState] = useState<KochoGameState>({
        stage: 1,
        subStep: 'WAVE_1',
        wave: 1,
        maxWaves: 1,
        turn: 1,
        gridSize: GRID_SIZE,
        player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 15, hp: 15, spriteName: 'HERO_SIDE|赤', shield: 0 },
        enemies: [],
        hand: [],
        queue: [],
        deck: [],
        discard: [],
        status: 'PLAYING',
        logs: [],
        specialActionCooldown: 0,
        money: 0,
        relics: [],
        shopUpgradeUsed: false,
        bossPhase: 1
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
        initGame();
    }, []);

    const initGame = () => {
        // Stage 1: Tutorial
        startStage(1, 'WAVE_1');
    };

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

    const startStage = (stage: number, subStep: GameSubStep) => {
        let maxWaves = 1;
        let bgmType: any = 'dungeon_gym';
        let logMsg = `Stage ${stage} 開始！`;
        
        if (stage === 1) {
            maxWaves = 1; // Tutorial
        } else if (stage === 7) {
            maxWaves = 1; // Final Boss
            subStep = 'FINAL_BOSS';
            bgmType = 'dungeon_boss';
            logMsg = "最終決戦！";
        } else {
            // Stages 2-6
            if (subStep === 'WAVE_1' || subStep === 'WAVE_2') {
                maxWaves = Math.floor(Math.random() * 6) + 3; // 3-8 waves
                bgmType = 'dungeon_gym'; 
                if (stage >= 4) bgmType = 'dungeon_science';
            } else if (subStep === 'MID_BOSS') {
                maxWaves = 1;
                bgmType = 'battle';
                logMsg = "強敵出現！";
            }
        }
        
        // Reset player pos/stats if first stage
        const isFreshGame = stage === 1 && subStep === 'WAVE_1';
        const currentHand = isFreshGame ? getInitialDeck() : stateRef.current.hand;
        const handWithCD = isFreshGame ? currentHand.map(c => ({ ...c, currentCooldown: 0 })) : currentHand;

        setGameState(prev => ({
            ...prev,
            stage,
            subStep,
            wave: 1,
            maxWaves,
            turn: 1,
            player: { 
                ...prev.player, 
                pos: isFreshGame ? 3 : prev.player.pos,
                facing: isFreshGame ? 1 : prev.player.facing,
                shield: 0,
                hp: isFreshGame ? 15 : prev.player.hp
            }, 
            enemies: [], // Cleared, will be spawned by spawnEnemies
            hand: handWithCD,
            queue: [],
            status: 'PLAYING',
            logs: [logMsg],
            specialActionCooldown: 0,
            money: isFreshGame ? 0 : prev.money,
            shopUpgradeUsed: false,
            bossPhase: 1
        }));
        
        audioService.playBGM(bgmType);
        setTimeout(() => spawnEnemies(stage, subStep, 1), 100);
    };

    const spawnEnemies = (stage: number, subStep: GameSubStep, wave: number) => {
        let newEnemies: KEntity[] = [];
        const currentP = stateRef.current.player;

        if (subStep === 'FINAL_BOSS') {
            const template = FINAL_BOSS_PHASES[0];
            newEnemies.push({
                id: 'final_boss',
                type: 'ENEMY',
                enemyType: 'FINAL_BOSS',
                name: template.name,
                pos: currentP.pos > 3 ? 0 : 6,
                facing: currentP.pos > 3 ? 1 : -1,
                maxHp: template.maxHp,
                hp: template.maxHp,
                spriteName: template.sprite,
                shield: 0,
                intent: { type: 'WAIT', timer: 2 }
            });
        } else if (subStep === 'MID_BOSS') {
            const template = MID_BOSS_TYPES[(stage - 2) % MID_BOSS_TYPES.length];
            newEnemies.push({
                id: 'mid_boss',
                type: 'ENEMY',
                name: template.name,
                pos: currentP.pos > 3 ? 0 : 6,
                facing: currentP.pos > 3 ? 1 : -1,
                maxHp: template.maxHp,
                hp: template.maxHp,
                spriteName: template.sprite,
                shield: 0,
                intent: { type: 'WAIT', timer: 1 }
            });
        } else {
            // Mobs
            const count = Math.min(3, 1 + Math.floor(wave / 2));
            for (let i = 0; i < count; i++) {
                const template = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
                let pos = i === 0 ? (currentP.pos > 3 ? 0 : 6) : (currentP.pos > 3 ? 1 : 5);
                // Avoid overlap
                if (newEnemies.some(e => e.pos === pos)) pos = (pos === 0 ? 1 : (pos === 6 ? 5 : (pos + 1) % 7));
                
                newEnemies.push({
                    id: `e_${stage}_${subStep}_${wave}_${i}`,
                    type: 'ENEMY',
                    name: template.name,
                    pos: pos,
                    facing: pos < 3 ? 1 : -1,
                    maxHp: template.maxHp,
                    hp: template.maxHp,
                    spriteName: template.sprite,
                    shield: 0,
                    intent: { type: 'WAIT', timer: Math.floor(Math.random() * 2) + 1 }
                });
            }
        }
        
        setGameState(prev => ({ ...prev, enemies: newEnemies }));
    };

    // --- LOGIC ---

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

        // Passive Shield
        if (current.relics.some(r => r.id === 'R_SHIELD')) player.shield += 1;

        // Decrement Timers
        enemies = enemies.map(e => e.intent ? { ...e, intent: { ...e.intent, timer: Math.max(0, e.intent.timer - 1) } } : e);

        for (let i = 0; i < enemies.length; i++) {
            let e = { ...enemies[i] };
            if (e.hp <= 0) continue;

            if (e.intent && e.intent.timer === 0) {
                if (e.intent.type === 'SUMMON') {
                    // Final Boss Summon Logic
                    const emptySlots = [0, 1, 5, 6].filter(p => !enemies.some(en => en.pos === p) && player.pos !== p);
                    if (emptySlots.length > 0) {
                        const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
                        const template = ENEMY_TYPES[0]; // Mob
                        const newMob: KEntity = {
                            id: `summon_${Date.now()}`, type: 'ENEMY', name: template.name, pos: slot,
                            facing: slot < 3 ? 1 : -1, maxHp: template.maxHp, hp: template.maxHp, spriteName: template.sprite, shield: 0,
                            intent: { type: 'WAIT', timer: 1 }
                        };
                        enemies.push(newMob);
                        logs = [`${e.name}が雑魚を召喚した！`, ...logs];
                        generatedVfx.push({ id: `v_sum_${Date.now()}`, type: 'WARP', pos: slot });
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
                        generatedVfx.push({ id: `v_atk_p_${i}`, type: 'SLASH', pos: player.pos });
                        if (blocked > 0) generatedVfx.push({ id: `v_blk_p_${i}`, type: 'BLOCK', pos: player.pos });
                        if (finalDmg > 0) generatedVfx.push({ id: `v_dmg_p_${i}`, type: 'TEXT', pos: player.pos, text: finalDmg, color: 'text-red-500' });
                        audioService.playSound('lose');
                        hitSomething = true;
                        if (player.hp <= 0) status = 'GAME_OVER';
                    }
                    // Friendly Fire
                    for (let j = 0; j < enemies.length; j++) {
                        if (i === j) continue;
                        let target = { ...enemies[j] };
                        if (target.hp <= 0) continue;
                        if (attackTiles.includes(target.pos)) {
                            const dmg = e.intent.damage || 0;
                            const blocked = Math.min(dmg, target.shield);
                            const finalDmg = dmg - blocked;
                            target.hp = Math.max(0, target.hp - finalDmg);
                            target.shield = Math.max(0, target.shield - blocked);
                            logs = [`${e.name}の流れ弾！ ${target.name}に${finalDmg}ダメ`, ...logs];
                            generatedVfx.push({ id: `v_atk_e_${j}`, type: 'SLASH', pos: target.pos });
                            enemies[j] = target;
                            hitSomething = true;
                        }
                    }
                    if (!hitSomething) logs = [`${e.name}の攻撃は空を切った。`, ...logs];
                    
                    // Reset Intent based on Type
                    if (e.enemyType === 'FINAL_BOSS') {
                        const phaseData = FINAL_BOSS_PHASES[nextState.bossPhase - 1];
                        e.intent = { type: Math.random() < 0.3 ? 'SUMMON' : 'WAIT', timer: phaseData.attackCooldown };
                    } else if (e.id === 'mid_boss') {
                        const template = MID_BOSS_TYPES.find(t => t.name === e.name) || MID_BOSS_TYPES[0];
                         e.intent = { type: 'WAIT', timer: template.attackCooldown };
                    } else {
                        const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                        e.intent = { type: 'WAIT', timer: template.attackCooldown };
                    }
                } else {
                    // AI Decision (MOVE / ATTACK Prep)
                    let template: any = ENEMY_TYPES.find(t => t.name === e.name);
                    if (e.enemyType === 'FINAL_BOSS') template = FINAL_BOSS_PHASES[nextState.bossPhase - 1];
                    else if (e.id === 'mid_boss') template = MID_BOSS_TYPES.find(t => t.name === e.name);
                    if (!template) template = ENEMY_TYPES[0];

                    const validRanges = template.range;
                    const dist = e.pos - player.pos;
                    const absDist = Math.abs(dist);
                    const inRange = validRanges.includes(absDist);
                    const neededFacing = dist < 0 ? 1 : -1;

                    if (inRange && e.facing === neededFacing) {
                        e.intent = { type: 'ATTACK', damage: template.attackDmg, range: template.range, timer: 1 };
                    } else {
                        // Move Logic
                        let moveDir = 0;
                        if (player.pos > e.pos) moveDir = 1; else if (player.pos < e.pos) moveDir = -1;
                        if (moveDir !== 0) {
                            const nextPos = e.pos + moveDir;
                            const blocked = enemies.some((other, idx) => idx !== i && other.pos === nextPos) || player.pos === nextPos;
                            if (!blocked) e.pos = nextPos;
                            e.facing = moveDir as Facing;
                        } else {
                            e.facing = neededFacing as Facing;
                        }
                        e.intent = { type: 'MOVE', timer: 1 };
                    }
                }
            }
            enemies[i] = e;
            if (status === 'GAME_OVER') break;
        }
        
        return { nextState: { ...nextState, enemies, player, logs: logs.slice(0, 4), status }, vfx: generatedVfx };
    };

    // --- PLAYER ACTION HANDLERS ---
    // (Move, Turn, Wait, Swap, Queue, Unqueue - mostly same as before, simplified for brevity)
    
    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        const current = stateRef.current;
        const newPos = current.player.pos + dir;
        if (newPos >= 0 && newPos < GRID_SIZE && !current.enemies.some(e => e.pos === newPos)) {
            let next = { ...current, player: { ...current.player, pos: newPos } };
            setGameState(next);
            audioService.playSound('select');
            const anyActing = current.enemies.some(e => e.intent && e.intent.timer <= 1);
            await new Promise(r => setTimeout(r, anyActing ? 250 : 50));
            const { nextState, vfx } = resolveEnemyTurn(next);
            vfx.forEach(v => addVfx(v.type, v.pos, v));
            setGameState(tickCooldowns(nextState));
        } else audioService.playSound('wrong');
        setAnimating(false);
    };

    const handleTurn = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        let current = stateRef.current;
        let next = { ...current, player: { ...current.player, facing: (current.player.facing * -1) as Facing } };
        setGameState(next);
        audioService.playSound('select');
        const anyActing = current.enemies.some(e => e.intent && e.intent.timer <= 1);
        await new Promise(r => setTimeout(r, anyActing ? 250 : 50));
        const { nextState, vfx } = resolveEnemyTurn(next);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        setGameState(tickCooldowns(nextState));
        setAnimating(false);
    };
    
    const handleWait = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        audioService.playSound('select');
        const anyActing = stateRef.current.enemies.some(e => e.intent && e.intent.timer <= 1);
        await new Promise(r => setTimeout(r, anyActing ? 250 : 50));
        const { nextState, vfx } = resolveEnemyTurn(stateRef.current);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        setGameState(tickCooldowns(nextState));
        setAnimating(false);
    };

    const handleQueueCard = async (card: KCard, idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        if (card.currentCooldown > 0 || stateRef.current.queue.length >= 3) { audioService.playSound('wrong'); return; }
        setAnimating(true);
        audioService.playSound('select');
        let current = stateRef.current;
        const newHand = [...current.hand]; newHand.splice(idx, 1);
        const next = { ...current, hand: newHand, queue: [...current.queue, card] };
        setGameState(next);
        const anyActing = current.enemies.some(e => e.intent && e.intent.timer <= 1);
        await new Promise(r => setTimeout(r, anyActing ? 250 : 50));
        const { nextState, vfx } = resolveEnemyTurn(next);
        vfx.forEach(v => addVfx(v.type, v.pos, v));
        setGameState(tickCooldowns(nextState));
        setAnimating(false);
    };

    const handleUnqueueCard = (idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        const card = stateRef.current.queue[idx];
        const newQueue = [...stateRef.current.queue]; newQueue.splice(idx, 1);
        setGameState(prev => ({ ...prev, queue: newQueue, hand: [...prev.hand, card] }));
    };

    const executeQueue = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating || stateRef.current.queue.length === 0) return;
        setAnimating(true);
        setGameState(prev => ({ ...prev, status: 'EXECUTING' }));

        const queue = [...stateRef.current.queue];
        const cardsReturning: KCard[] = [];
        let currentState = { ...stateRef.current };

        // Player Actions
        for (const card of queue) {
            if (currentState.status === 'GAME_OVER') break;
            
            const p = currentState.player;
            let nextPlayer = { ...p };
            let nextEnemies = currentState.enemies.map(e => ({...e}));
            let hit = false;
            let dmgBonus = currentState.relics.some(r => r.id === 'R_GLOVES') ? 1 : 0;

            let targets: number[] = [];
            if (card.effectType === 'FURTHEST') {
                let fDist = -1, tPos = -1;
                nextEnemies.forEach(e => { const d = Math.abs(e.pos - p.pos); if (d > fDist) { fDist = d; tPos = e.pos; } });
                if (tPos !== -1) targets = [tPos];
            } else {
                targets = card.range.map(r => p.pos + (r * p.facing));
            }

            if (card.type === 'ATTACK') {
                 if (card.effectType === 'DASH_ATTACK') {
                    let finalPos = p.pos;
                    for (let i = 1; i <= Math.max(...card.range); i++) {
                        const checkPos = p.pos + (i * p.facing);
                        if (checkPos < 0 || checkPos >= GRID_SIZE) break;
                        if (nextEnemies.some(e => e.pos === checkPos)) { targets = [checkPos]; break; }
                        finalPos = checkPos;
                    }
                    nextPlayer.pos = finalPos;
                }
                
                const hits = nextEnemies.filter(e => targets.includes(e.pos));
                if (hits.length > 0) {
                    hit = true;
                    hits.forEach(e => {
                        let finalDmg = card.damage + dmgBonus;
                        if (card.effectType === 'COUNTER' && e.intent?.type === 'ATTACK') { finalDmg *= 3; addVfx('COUNTER', e.pos); }
                        e.hp -= finalDmg;
                        addLog(`${e.name}に${finalDmg}ダメ`);
                        addVfx('SLASH', e.pos); addVfx('TEXT', e.pos, {text:finalDmg, color:'text-yellow-400'});

                        // Final Boss Evolution Check
                        if (e.enemyType === 'FINAL_BOSS' && e.hp <= 0 && currentState.bossPhase < 3) {
                             e.hp = FINAL_BOSS_PHASES[currentState.bossPhase].maxHp;
                             currentState.bossPhase += 1;
                             const nextPhase = FINAL_BOSS_PHASES[currentState.bossPhase - 1];
                             e.name = nextPhase.name;
                             e.spriteName = nextPhase.sprite;
                             e.maxHp = nextPhase.maxHp;
                             addLog("校長が進化した！");
                             addVfx('EVOLVE', e.pos);
                             audioService.playSound('buff');
                        }

                        if (card.effectType === 'PUSH') {
                            const pushDir = p.facing;
                            let targetPos = e.pos;
                            for(let k=0; k<2; k++) {
                                const next = targetPos + pushDir;
                                const isBlocked = nextEnemies.some(o => o.pos === next) || nextPlayer.pos === next || next < 0 || next >= GRID_SIZE;
                                if (!isBlocked) targetPos = next; else break;
                            }
                            if (targetPos !== e.pos) { e.pos = targetPos; addVfx('IMPACT', e.pos); }
                        }
                        if (card.effectType === 'PULL') {
                             const dest = p.pos + p.facing;
                             const isBlocked = nextEnemies.some(o => o.pos === dest && o.id !== e.id) || nextPlayer.pos === dest;
                             if (!isBlocked && dest >= 0 && dest < GRID_SIZE) { e.pos = dest; addVfx('IMPACT', e.pos); }
                        }
                    });
                    if (card.effectType === 'RECOIL') {
                        const rPos = p.pos - p.facing;
                        if (rPos >= 0 && rPos < GRID_SIZE && !nextEnemies.some(e=>e.pos===rPos)) nextPlayer.pos = rPos;
                    }
                    if (card.shield) { nextPlayer.shield += card.shield; addVfx('BLOCK', p.pos); }
                    audioService.playSound('attack');
                } else {
                    addLog("空振り"); audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                const target = p.pos + (card.range[0] * p.facing);
                if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target)) {
                    nextPlayer.pos = target; audioService.playSound('select');
                }
            } else if (card.type === 'UTILITY') {
                 if (card.name === 'バックステップ') {
                     const t = p.pos - p.facing;
                     if (t >= 0 && t < GRID_SIZE && !nextEnemies.some(e => e.pos === t)) nextPlayer.pos = t;
                 } else if (card.shield) { nextPlayer.shield += card.shield; addVfx('BLOCK', p.pos); }
                 audioService.playSound('block');
            }

            currentState = { ...currentState, player: nextPlayer, enemies: nextEnemies.filter(e => e.hp > 0) };
            cardsReturning.push({ ...card, currentCooldown: card.cooldown });
            setGameState(currentState);
            await new Promise(r => setTimeout(r, 400));
        }

        // Enemy Reaction after combo
        if (currentState.status !== 'GAME_OVER' && currentState.enemies.length > 0) {
            const anyActing = currentState.enemies.some(e => e.intent && e.intent.timer <= 1);
            await new Promise(r => setTimeout(r, anyActing ? 250 : 50));
            const { nextState, vfx } = resolveEnemyTurn(currentState);
            vfx.forEach(v => addVfx(v.type, v.pos, v));
            currentState = tickCooldowns(nextState);
            setGameState(currentState);
        }

        // Cleanup & Phase Check
        setGameState(prev => {
            if (prev.status === 'GAME_OVER') return prev;
            let newHand = [...prev.hand, ...cardsReturning];
            
            if (currentState.enemies.length === 0) {
                const rewardMoney = 10;
                // Complex Progression Logic
                setTimeout(handleWaveClear, 1000);
                return { ...prev, status: 'WAVE_CLEAR', queue: [], hand: newHand, money: prev.money + rewardMoney, logs: [...prev.logs, `Wave Clear! +${rewardMoney}G`] };
            }

            return { ...prev, status: 'PLAYING', queue: [], hand: newHand };
        });
        setAnimating(false);
    };

    const handleWaveClear = () => {
        const s = stateRef.current;
        if (s.wave < s.maxWaves) {
            startStage(s.stage, s.subStep); // Next wave, same step (increment happens in spawn logic wrapper or here)
            // Correction: startStage resets wave to 1. We need a specific "next wave" function or pass wave num.
            // Let's modify spawnEnemies or pass wave number to startStage?
            // Actually, simplified: update state here, then call spawnEnemies
            setGameState(prev => ({ ...prev, wave: prev.wave + 1, status: 'PLAYING', turn: 1 }));
            setTimeout(() => spawnEnemies(s.stage, s.subStep, s.wave + 1), 100);
        } else {
            handlePhaseComplete();
        }
    };

    const handlePhaseComplete = () => {
        const s = stateRef.current;
        let nextStage = s.stage;
        let nextStep: GameSubStep = 'WAVE_1';

        // Tutorial -> Main Loop
        if (s.stage === 1) {
            nextStage = 2;
            nextStep = 'WAVE_1';
        } else if (s.stage === 7) {
            // Victory
            setGameState(prev => ({ ...prev, status: 'VICTORY' }));
            audioService.playSound('win');
            return;
        } else {
            // Main Loop (2-6)
            // WAVE_1 -> REWARD -> WAVE_2 -> UPGRADE -> MID_BOSS -> SHOP -> (Next Stage)
            if (s.subStep === 'WAVE_1') nextStep = 'REWARD';
            else if (s.subStep === 'REWARD') nextStep = 'WAVE_2';
            else if (s.subStep === 'WAVE_2') nextStep = 'UPGRADE';
            else if (s.subStep === 'UPGRADE') nextStep = 'MID_BOSS';
            else if (s.subStep === 'MID_BOSS') nextStep = 'SHOP';
            else if (s.subStep === 'SHOP') {
                nextStage = s.stage + 1;
                nextStep = 'WAVE_1';
            }
        }

        // Logic for specialized screens
        if (nextStep === 'REWARD') {
            generateRewards();
            setGameState(prev => ({ ...prev, stage: nextStage, subStep: nextStep, status: 'STEP_CLEAR', phase: 'REWARD' as any })); // Using phase prop for UI switch
        } else if (nextStep === 'SHOP') {
            setGameState(prev => ({ ...prev, stage: nextStage, subStep: nextStep, status: 'STEP_CLEAR', phase: 'SHOP' as any, shopUpgradeUsed: false }));
        } else if (nextStep === 'UPGRADE') {
             // Treat Upgrade as a shop phase but force specific UI? Or just reuse Shop UI with only upgrade?
             // Let's reuse Shop Phase UI but maybe auto-trigger upgrade modal or separate UI
             // For simplicity, reuse SHOP UI layout but filter content
             setGameState(prev => ({ ...prev, stage: nextStage, subStep: nextStep, status: 'STEP_CLEAR', phase: 'SHOP' as any, shopUpgradeUsed: false }));
        } else {
             startStage(nextStage, nextStep);
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
        setGameState(prev => ({ ...prev, hand: [...prev.hand, card] }));
        handlePhaseComplete(); // Move to next step (WAVE_2)
    };

    const leaveShop = () => {
        handlePhaseComplete(); // Move to next (Next Stage or MidBoss depending on flow, here Shop is last)
    };

    // --- UI COMPONENTS ---
    // (Reusing existing components structure, adjusted for new phases)

    const getGridContent = (idx: number) => {
        const p = gameState.player;
        const e = gameState.enemies.find(en => en.pos === idx);
        const cellVfx = vfxList.filter(v => v.pos === idx);
        
        return (
            <div className="relative w-full h-full flex items-end justify-center">
                {/* VFX Layer */}
                {cellVfx.map(v => (
                    <div key={v.id} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        {v.type === 'SLASH' && <div className="w-full h-1 bg-white rotate-45 animate-ping shadow-[0_0_10px_white]"></div>}
                        {v.type === 'EVOLVE' && <div className="absolute inset-0 bg-yellow-400/50 animate-ping rounded-full"></div>}
                        {v.type === 'BLAST' && <div className="w-full h-full rounded-full border-4 border-orange-500 animate-ping"></div>}
                        {v.type === 'TEXT' && <div className={`text-xl font-bold animate-bounce ${v.color || 'text-white'} drop-shadow-md`}>{v.text}</div>}
                    </div>
                ))}

                {p.pos === idx && (
                    <div className="relative w-full h-full flex items-end justify-center">
                        <div className={`transition-transform duration-200 ${p.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                            <PixelSprite seed="HERO" name={p.spriteName} className="w-16 h-16 md:w-32 md:h-32"/>
                        </div>
                        {p.shield > 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded border border-white">{p.shield}</div>}
                        <div className="absolute -bottom-6 w-20 text-center bg-black/50 text-white text-xs rounded border border-green-500">HP {p.hp}/{p.maxHp}</div>
                    </div>
                )}
                {e && (
                    <div className="relative w-full h-full flex items-end justify-center">
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
                        <div className="absolute -bottom-6 w-16 text-center bg-black/50 text-white text-xs rounded border border-red-500">{e.hp}/{e.maxHp}</div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1a1a2e] text-white font-mono relative overflow-hidden">
             {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/40 border-b border-indigo-500/30 shrink-0">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white"><ArrowLeft className="mr-2"/> Quit</button>
                <h2 className="text-xl font-bold text-indigo-100 tracking-widest hidden md:block">
                    KOCHO SHOWDOWN <span className="text-sm text-pink-400 ml-2">Stage {gameState.stage} - {gameState.subStep}</span>
                </h2>
                <div className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <Coins size={16}/> {gameState.money} G
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
                 <div className="flex-1 relative bg-[#1a1a2e] flex flex-col items-center justify-center p-4 overflow-hidden">
                    
                    {/* Overlays */}
                    {(gameState.status === 'VICTORY' || gameState.status === 'GAME_OVER' || gameState.subStep === 'REWARD' || gameState.subStep === 'SHOP' || gameState.subStep === 'UPGRADE') && (
                        <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-4">
                             {/* REWARD UI */}
                            {gameState.subStep === 'REWARD' && (
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

                            {/* SHOP / UPGRADE UI */}
                            {(gameState.subStep === 'SHOP' || gameState.subStep === 'UPGRADE') && (
                                <div className="w-full h-full flex flex-col p-4 md:p-8 overflow-y-auto relative">
                                    <h2 className="text-3xl font-bold text-indigo-400 mb-6 flex items-center shrink-0">
                                        {gameState.subStep === 'SHOP' ? <ShoppingBag className="mr-2"/> : <Hammer className="mr-2"/>}
                                        {gameState.subStep === 'SHOP' ? 'School Store' : 'Workshop'}
                                    </h2>
                                    
                                    <div className="flex gap-8">
                                         {/* Cards for Upgrade (Always visible in Shop/Upgrade) */}
                                         <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-4 overflow-y-auto custom-scrollbar">
                                             <div className="grid grid-cols-2 gap-4">
                                                {gameState.hand.map((card, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="bg-slate-800 p-3 rounded border border-slate-600"
                                                    >
                                                        <div className="font-bold text-sm text-white mb-1">{card.name}</div>
                                                        <div className="text-xs text-gray-400 mb-2">{card.description}</div>
                                                        {/* Simplified Upgrade Logic for this snippet */}
                                                    </div>
                                                ))}
                                             </div>
                                         </div>
                                         
                                         {/* Shop Items */}
                                         {gameState.subStep === 'SHOP' && (
                                             <div className="w-80 bg-slate-900 border border-slate-600 rounded-lg p-4">
                                                 <div className="space-y-4">
                                                     {SHOP_RELICS.map(item => (
                                                         <div key={item.id} className="bg-slate-800 p-3 rounded border border-slate-500 flex justify-between items-center">
                                                             <div><div className="font-bold text-sm text-yellow-200">{item.name}</div><div className="text-xs text-gray-400">{item.desc}</div></div>
                                                             <button className="px-3 py-1 rounded text-sm font-bold bg-yellow-600 text-black">{item.price}G</button>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                    </div>
                                    <button onClick={leaveShop} className="mt-8 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg text-xl w-full">Next Battle</button>
                                </div>
                            )}

                             {/* VICTORY UI */}
                            {gameState.status === 'VICTORY' && (
                                <div className="text-center animate-in zoom-in">
                                    <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce mx-auto"/>
                                    <h2 className="text-4xl font-bold text-white mb-4">GRADUATION!</h2>
                                    <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded text-xl font-bold hover:bg-indigo-500">Return</button>
                                </div>
                            )}
                            
                             {/* GAME OVER UI */}
                            {gameState.status === 'GAME_OVER' && (
                                <div className="text-center animate-in zoom-in">
                                    <Skull size={64} className="text-red-500 mb-4 mx-auto"/>
                                    <h2 className="text-4xl font-bold text-red-500 mb-4">EXPELLED</h2>
                                    <button onClick={() => startStage(1, 'WAVE_1')} className="bg-white text-black px-8 py-3 rounded text-xl font-bold hover:bg-gray-200">Retry</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Battle Grid */}
                    {(gameState.status === 'PLAYING' || gameState.status === 'EXECUTING') && (
                        <div className="grid grid-cols-7 gap-1 md:gap-2 w-full max-w-5xl px-2 mb-4 shrink-0">
                            {[...Array(GRID_SIZE)].map((_, i) => (
                                <div key={i} className="aspect-[1/2] md:aspect-[3/4] border-2 border-indigo-800 bg-black/30 rounded-lg">
                                    {getGridContent(i)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Logs */}
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg text-center pointer-events-none z-10">
                        {gameState.logs.map((log, i) => (
                            <div key={i} className={`text-sm ${i===0 ? 'text-white font-bold text-shadow-md' : 'text-gray-500'} transition-opacity duration-500`}>{log}</div>
                        ))}
                    </div>

                 </div>

                 {/* Right Sidebar (Controls) */}
                 {gameState.status === 'PLAYING' && (
                     <div className="w-full md:w-80 bg-[#0f0f1b] border-l border-indigo-900 p-4 flex flex-col gap-4">
                         <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg border border-indigo-900/30">
                            {/* Queue Visuals */}
                             <div className="flex gap-1 justify-center items-center flex-grow">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-12 h-16 border border-slate-600 rounded bg-slate-800 flex items-center justify-center">
                                        {gameState.queue[i] ? <div className={`w-full h-full ${gameState.queue[i].color} opacity-50`}></div> : <span className="text-xs text-gray-600">Empty</span>}
                                    </div>
                                ))}
                             </div>
                             <button onClick={executeQueue} className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-indigo-400 shadow-lg hover:scale-105 active:scale-95 transition-transform">
                                 <Play size={24} className="fill-current text-white"/>
                             </button>
                         </div>

                         {/* Hand */}
                         <div className="flex flex-col gap-2 overflow-y-auto flex-grow custom-scrollbar">
                             {gameState.hand.map((card, i) => (
                                 <div key={card.id} className={`bg-slate-800 border p-2 rounded cursor-pointer hover:border-yellow-400 flex items-center gap-2 ${card.currentCooldown > 0 ? 'opacity-50' : ''}`} onClick={() => handleQueueCard(card, i)}>
                                     <div className={`w-1 h-full ${card.color}`}></div>
                                     <div className="text-indigo-300">{card.icon}</div>
                                     <div className="flex-1 min-w-0">
                                         <div className="font-bold text-xs truncate">{card.name}</div>
                                         <div className="text-[9px] text-gray-400 truncate">{card.description}</div>
                                     </div>
                                     {card.currentCooldown > 0 && <div className="font-bold text-gray-500">{card.currentCooldown}</div>}
                                 </div>
                             ))}
                         </div>
                         
                         {/* Movement */}
                         <div className="flex justify-center gap-4">
                             <button onClick={() => handleMove(-1)} className="p-4 bg-slate-700 rounded-full"><ChevronLeft/></button>
                             <button onClick={handleTurn} className="px-4 bg-slate-700 rounded-lg text-sm font-bold">TURN</button>
                             <button onClick={handleWait} className="px-4 bg-slate-700 rounded-lg text-sm font-bold text-gray-400">WAIT</button>
                             <button onClick={() => handleMove(1)} className="p-4 bg-slate-700 rounded-full"><ChevronRight/></button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default KochoShowdown;
