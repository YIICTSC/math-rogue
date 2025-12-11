
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, X, RotateCcw, Swords, Shield, RefreshCw, Zap, Trophy, Skull, ChevronsRight, ChevronLeft, ChevronRight, Clock, Ghost, ArrowRightLeft, Gift, ShoppingBag, Hammer, Coins, Plus, Crosshair, Heart, Move, AlertTriangle, Hourglass } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left
type GamePhase = 'BATTLE_1' | 'REWARD' | 'BATTLE_2' | 'SHOP' | 'BOSS';

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
    upgraded?: boolean;
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
        type: 'ATTACK' | 'MOVE' | 'WAIT';
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

interface KochoGameState {
    phase: GamePhase;
    wave: number;
    maxWaves: number;
    turn: number;
    gridSize: number;
    player: KEntity;
    enemies: KEntity[];
    hand: KCard[];
    queue: KCard[]; // Max 3
    deck: KCard[]; // Kept for structure but unused in CD mode
    discard: KCard[]; // Kept for structure but unused in CD mode
    status: 'PLAYING' | 'EXECUTING' | 'GAME_OVER' | 'VICTORY' | 'WAVE_CLEAR' | 'PHASE_CLEAR';
    logs: string[];
    specialActionCooldown: number;
    money: number;
    relics: KRelic[];
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
    { name: '竹刀', type: 'ATTACK', range: [1], damage: 2, cooldown: 0, color: 'bg-emerald-600', icon: <Swords size={16}/>, description: 'CT0。隙のない連撃', energyCost: 0 },
    { name: '釘バット', type: 'ATTACK', range: [1], damage: 5, cooldown: 3, color: 'bg-red-800', icon: <Hammer size={16}/>, description: '高火力の一撃', energyCost: 1 },
    { name: '鉄の定規', type: 'ATTACK', range: [1], damage: 2, shield: 2, cooldown: 2, color: 'bg-slate-500', icon: <Shield size={16}/>, description: '攻防一体。シールド+2', energyCost: 1 },
    { name: '回転モップ', type: 'ATTACK', range: [-1, 1], damage: 2, cooldown: 2, color: 'bg-cyan-700', icon: <RefreshCw size={16}/>, description: '前後を同時に攻撃', energyCost: 1 },
    { name: '竹箒', type: 'ATTACK', range: [2], damage: 3, cooldown: 2, color: 'bg-amber-700', icon: <Move size={16}/>, description: '2マス先を突く(リーチ)', energyCost: 1 },
    { name: '消しゴム手裏剣', type: 'ATTACK', range: [3, 4], damage: 2, cooldown: 1, color: 'bg-white text-black', icon: <Crosshair size={16}/>, description: '遠距離速射', energyCost: 1 },
    { name: '絶対防御', type: 'UTILITY', range: [0], damage: 0, shield: 6, cooldown: 5, color: 'bg-yellow-500 text-black', icon: <Shield size={16}/>, description: 'シールド+6', energyCost: 1 },
    { name: '校長像召喚', type: 'UTILITY', range: [1], damage: 0, shield: 0, cooldown: 6, color: 'bg-stone-500', icon: <AlertTriangle size={16}/>, description: '盾となる像を置く(未実装)', energyCost: 1 }, // Placeholder concept
];

const SHOP_RELICS: KRelic[] = [
    { id: 'R_BOOTS', name: '瞬足の靴', desc: '移動系カードのCD-1', price: 30 },
    { id: 'R_GLOVES', name: 'パワー手袋', desc: '攻撃ダメージ+1', price: 40 },
    { id: 'R_SHIELD', name: '安全ピン', desc: '毎ターンシールド+1', price: 35 },
    { id: 'R_POTION', name: '給食の牛乳', desc: 'HPを10回復', price: 15 }, // Instant consumable treated as relic for purchase logic
];

const getInitialDeck = (): KCard[] => {
    // Initial Deck: Roundhouse Kick & Chalk Throw ONLY
    const roundhouse = CARD_DB.find(c => c.name === '回し蹴り')!;
    const chalk = CARD_DB.find(c => c.name === 'チョーク投げ')!;

    return [
        { ...roundhouse, id: 'c1', currentCooldown: 0 },
        { ...chalk, id: 'c2', currentCooldown: 0 },
    ];
};

const ENEMY_TYPES = [
    { name: '不良生徒', maxHp: 6, sprite: 'SENIOR|#a855f7', attackDmg: 2, range: [1], speed: 3, attackCooldown: 1 }, 
    { name: '熱血教師', maxHp: 12, sprite: 'TEACHER|#ef4444', attackDmg: 4, range: [1], speed: 4, attackCooldown: 2 },
    { name: '用務員', maxHp: 8, sprite: 'HUMANOID|#3e2723', attackDmg: 3, range: [1, 2], speed: 5, attackCooldown: 1 },
    { name: '教頭', maxHp: 15, sprite: 'MUSCLE|#1565c0', attackDmg: 5, range: [1], speed: 6, attackCooldown: 2 },
    { name: '校長', maxHp: 50, sprite: 'BOSS|#FFD700', attackDmg: 8, range: [1, 2, 3], speed: 4, attackCooldown: 3 },
];

const GRID_SIZE = 7;

// --- COMPONENT ---
const KochoShowdown: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    
    // State
    const [gameState, setGameState] = useState<KochoGameState>({
        phase: 'BATTLE_1',
        wave: 1,
        maxWaves: 3,
        turn: 1,
        gridSize: GRID_SIZE,
        player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 20, hp: 20, spriteName: 'HERO_SIDE|赤', shield: 0 },
        enemies: [],
        hand: [],
        queue: [],
        deck: [],
        discard: [],
        status: 'PLAYING',
        logs: ['校長室への道が開かれた...'],
        specialActionCooldown: 0,
        money: 0,
        relics: []
    });

    // Ref to hold current state for async loops (avoiding stale closures)
    const stateRef = useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const [animating, setAnimating] = useState(false);
    const [rewardCards, setRewardCards] = useState<KCard[]>([]);

    // Initialization
    useEffect(() => {
        startWave(1, 'BATTLE_1');
        audioService.playBGM('dungeon_gym');
    }, []);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs.slice(0, 4)] }));
    };

    const startWave = (wave: number, phase: GamePhase) => {
        // Difficulty Scaling
        let enemyCount = 1;
        if (phase === 'BATTLE_1') enemyCount = Math.min(2, 1 + Math.floor(wave / 2));
        if (phase === 'BATTLE_2') enemyCount = Math.min(3, 1 + Math.floor(wave / 1.5));
        if (phase === 'BOSS') enemyCount = 1;

        const newEnemies: KEntity[] = [];
        
        // Spawn Enemies
        for (let i = 0; i < enemyCount; i++) {
            let template = ENEMY_TYPES[0];
            
            if (phase === 'BOSS') {
                template = ENEMY_TYPES[4]; // Principal
            } else {
                const diff = (phase === 'BATTLE_2' ? 2 : 0) + wave;
                const poolIndex = Math.min(ENEMY_TYPES.length - 2, Math.floor(Math.random() * diff));
                template = ENEMY_TYPES[poolIndex];
            }
            
            // Find valid spawn pos (not on player, not on other enemies)
            let pos = i === 0 ? (stateRef.current.player.pos > 3 ? 0 : 6) : (stateRef.current.player.pos > 3 ? 1 : 5);
            
            newEnemies.push({
                id: `e_${phase}_${wave}_${i}`,
                type: 'ENEMY',
                name: template.name,
                pos: pos,
                facing: pos < 3 ? 1 : -1,
                maxHp: template.maxHp,
                hp: template.maxHp,
                spriteName: template.sprite,
                shield: 0,
                intent: {
                    type: 'WAIT',
                    timer: Math.floor(Math.random() * 2) + 1, // Staggered start
                }
            });
        }

        const isFreshStart = (phase === 'BATTLE_1' && wave === 1);
        const currentHand = isFreshStart ? getInitialDeck() : stateRef.current.hand;
        
        // If starting new wave in same battle, keep cooldowns. If fresh start, reset.
        const handWithCD = isFreshStart ? currentHand.map(c => ({ ...c, currentCooldown: 0 })) : currentHand;

        setGameState(prev => ({
            ...prev,
            phase: phase,
            wave: wave,
            maxWaves: phase === 'BATTLE_1' ? 3 : (phase === 'BATTLE_2' ? 4 : 1),
            turn: 1,
            player: { 
                ...prev.player, 
                // Reset pos/hp only on complete restart (Wave 1 of Battle 1)
                // Otherwise keep position and HP
                pos: isFreshStart ? 3 : prev.player.pos,
                facing: isFreshStart ? 1 : prev.player.facing,
                shield: 0,
                hp: isFreshStart ? prev.player.maxHp : prev.player.hp
            }, 
            enemies: newEnemies,
            hand: handWithCD,
            queue: [],
            status: 'PLAYING',
            logs: [`${phase === 'BOSS' ? '決戦' : `Wave ${wave}`} 開始！`],
            specialActionCooldown: isFreshStart ? 0 : prev.specialActionCooldown,
            money: isFreshStart ? 0 : prev.money
        }));

        if (phase === 'BOSS') audioService.playBGM('dungeon_boss');
        else if (phase === 'BATTLE_2') audioService.playBGM('dungeon_science');
        else audioService.playBGM('dungeon_gym');
    };

    // --- GAME LOGIC ---

    const tickCooldowns = (state: KochoGameState): KochoGameState => {
        // Relic: Boots (Move CD -1)
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

    const resolveEnemyTurn = (current: KochoGameState): KochoGameState => {
        let nextState = { ...current };
        let enemies = [...nextState.enemies];
        let player = { ...nextState.player };
        let logs = [...nextState.logs];
        let status = nextState.status;

        // Relic: Shield (Passive Shield)
        const hasShieldRelic = current.relics.some(r => r.id === 'R_SHIELD');
        if (hasShieldRelic) player.shield += 1;

        // 1. Decrement Enemy Timers
        enemies = enemies.map(e => e.intent ? { ...e, intent: { ...e.intent, timer: Math.max(0, e.intent.timer - 1) } } : e);

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

                    // Hit Player
                    if (attackTiles.includes(player.pos)) {
                        const dmg = e.intent.damage || 0;
                        const blocked = Math.min(dmg, player.shield);
                        const finalDmg = dmg - blocked;
                        
                        player.hp = Math.max(0, player.hp - finalDmg);
                        player.shield -= blocked;
                        
                        logs = [`${e.name}の攻撃！ ${finalDmg}ダメージ！`, ...logs];
                        audioService.playSound('lose');
                        hitSomething = true;
                        
                        if (player.hp <= 0) {
                            status = 'GAME_OVER';
                        }
                    }

                    // Hit Other Enemies (Friendly Fire)
                    for (let j = 0; j < enemies.length; j++) {
                        if (i === j) continue; // Don't hit self
                        let target = { ...enemies[j] }; // Copy target
                        if (target.hp <= 0) continue;

                        if (attackTiles.includes(target.pos)) {
                            const dmg = e.intent.damage || 0;
                            const blocked = Math.min(dmg, target.shield); // Enemies use shield too
                            const finalDmg = dmg - blocked;

                            target.hp = Math.max(0, target.hp - finalDmg);
                            target.shield = Math.max(0, target.shield - blocked);

                            logs = [`${e.name}の流れ弾が${target.name}にヒット！ ${finalDmg}ダメージ！`, ...logs];
                            // Play attack sound for friendly fire?
                            // audioService.playSound('attack'); 
                            hitSomething = true;
                            
                            // Update the enemy in the array
                            enemies[j] = target;
                        }
                    }

                    if (!hitSomething) {
                        logs = [`${e.name}の攻撃は空を切った。`, ...logs];
                    }
                    
                    // Trigger Cooldown
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    e.intent = { type: 'WAIT', timer: template.attackCooldown || 1 };
                } else {
                    // AI Decision Phase (MOVE or WAIT ended)
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    const validRanges = template.range;

                    const dist = e.pos - player.pos;
                    const absDist = Math.abs(dist);
                    const inRange = validRanges.includes(absDist);
                    const neededFacing = dist < 0 ? 1 : -1;
                    const facingCorrect = e.facing === neededFacing;

                    if (inRange && facingCorrect) {
                        e.intent = { 
                            type: 'ATTACK', 
                            damage: template.attackDmg, 
                            range: template.range, 
                            timer: 1 
                        };
                    } else {
                        let bestTargetPos = e.pos;
                        let minCost = 999;

                        for (const r of validRanges) {
                            const t1 = player.pos - r;
                            if (t1 >= 0 && t1 < GRID_SIZE) {
                                const cost = Math.abs(e.pos - t1);
                                if (cost < minCost) { minCost = cost; bestTargetPos = t1; }
                            }
                            const t2 = player.pos + r;
                            if (t2 >= 0 && t2 < GRID_SIZE) {
                                const cost = Math.abs(e.pos - t2);
                                if (cost < minCost) { minCost = cost; bestTargetPos = t2; }
                            }
                        }

                        let moveDir = 0;
                        if (bestTargetPos > e.pos) moveDir = 1;
                        else if (bestTargetPos < e.pos) moveDir = -1;

                        if (moveDir !== 0) {
                            const nextPos = e.pos + moveDir;
                            const blocked = enemies.some((other, idx) => idx !== i && other.pos === nextPos) || player.pos === nextPos;
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
            enemies[i] = e;
            if (status === 'GAME_OVER') break;
        }
        
        return { ...nextState, enemies, player, logs: logs.slice(0, 4), status };
    };

    // --- ACTION HANDLERS ---

    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);

        const current = stateRef.current;
        const newPos = current.player.pos + dir;
        
        if (newPos >= 0 && newPos < GRID_SIZE && !current.enemies.some(e => e.pos === newPos)) {
            // 1. Move Player
            let intermediateState = {
                ...current,
                player: { ...current.player, pos: newPos }
            };
            audioService.playSound('select');
            
            // 2. Enemy Reaction
            await new Promise(r => setTimeout(r, 200)); 
            let finalState = resolveEnemyTurn(intermediateState);
            finalState = tickCooldowns(finalState);
            setGameState(finalState);
        } else {
            audioService.playSound('wrong');
        }
        setAnimating(false);
    };

    const handleTurn = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        
        // 1. Player Action (Turn)
        let current = stateRef.current;
        current = { ...current, player: { ...current.player, facing: (current.player.facing * -1) as Facing } };
        addLog("向きを変えた。");
        audioService.playSound('select');

        // 2. Enemy Reaction (Turn consumes a turn)
        await new Promise(r => setTimeout(r, 200));
        current = resolveEnemyTurn(current);
        current = tickCooldowns(current);
        
        setGameState(current);
        setAnimating(false);
    };

    const handleWait = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        addLog("待機した。");
        audioService.playSound('select');
        
        let finalState = resolveEnemyTurn(stateRef.current);
        finalState = tickCooldowns(finalState);
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
        const enemyInFront = current.enemies.find(e => e.pos === targetPos);
        
        if (!enemyInFront) {
            addLog("目の前に敵がいません");
            audioService.playSound('wrong');
            return;
        }

        setAnimating(true);
        addLog("位置交換！");
        audioService.playSound('select');
        
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

        // 2. Enemy Reaction
        await new Promise(r => setTimeout(r, 200)); 
        let finalState = resolveEnemyTurn(intermediateState);
        finalState = tickCooldowns(finalState);
        
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
        current = {
            ...current,
            hand: newHand,
            queue: [...current.queue, card]
        };
        addLog(`${card.name}を計画...`);

        // 2. Enemy Reaction (Planning consumes a turn)
        await new Promise(r => setTimeout(r, 300));
        current = resolveEnemyTurn(current);
        current = tickCooldowns(current);

        setGameState(current);
        setAnimating(false);
    };

    const handleUnqueueCard = (idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        
        // Unqueue does NOT consume a turn
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
        
        // --- PLAYER COMBO PHASE ---
        let currentState = { ...stateRef.current };

        for (const card of queue) {
            if (currentState.status === 'GAME_OVER') break;

            addLog(`${card.name}！`);
            
            const p = currentState.player;
            const pPos = p.pos;
            let nextPlayer = { ...p };
            let nextEnemies = currentState.enemies.map(e => ({...e}));
            
            let hit = false;

            // Relic Buffs
            let dmgBonus = 0;
            if (currentState.relics.some(r => r.id === 'R_GLOVES')) dmgBonus += 1;

            if (card.type === 'ATTACK') {
                const targets = card.range.map(r => pPos + (r * p.facing));
                const hits = nextEnemies.filter(e => targets.includes(e.pos));
                if (hits.length > 0) {
                    hit = true;
                    hits.forEach(e => {
                        e.hp -= (card.damage + dmgBonus);
                        addLog(`${e.name} に ${card.damage + dmgBonus} ダメージ！`);
                    });
                    
                    // Add shield from attack cards (e.g. Iron Ruler)
                    if (card.shield && card.shield > 0) {
                        nextPlayer.shield += card.shield;
                        addLog(`シールド +${card.shield}`);
                    }

                    audioService.playSound('attack');
                } else {
                    addLog("空振り...");
                    audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                const dist = card.range[0];
                const target = pPos + (dist * p.facing);
                if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target)) {
                    nextPlayer.pos = target;
                    audioService.playSound('select');
                } else {
                    addLog("移動できない！");
                }
            } else if (card.type === 'UTILITY') {
                if (card.name === 'バックステップ') {
                    const target = pPos - p.facing;
                    if (target >= 0 && target < GRID_SIZE && !nextEnemies.some(e => e.pos === target)) {
                        nextPlayer.pos = target;
                        audioService.playSound('select');
                    }
                } else if (card.shield && card.shield > 0) {
                    nextPlayer.shield += card.shield;
                    audioService.playSound('block');
                }
            }

            // Update intermediate state (Player effect applied)
            currentState = {
                ...currentState,
                player: nextPlayer,
                enemies: nextEnemies.filter(e => e.hp > 0)
            };

            // --- ADDED LOGIC: TIME PASSES DURING EXECUTION ---
            await new Promise(r => setTimeout(r, 200)); // Delay for readability
            
            // Trigger enemy turn & cooldowns
            // IMPORTANT: We must update currentState with the result of these functions
            currentState = resolveEnemyTurn(currentState);
            currentState = tickCooldowns(currentState);
            // -------------------------------------------------

            // Card will return to hand after combo
            cardsReturningToHand.push({
                ...card,
                currentCooldown: card.cooldown
            });

            // Update UI to show step
            setGameState(currentState);
            
            // Wait for animation/visual
            await new Promise(r => setTimeout(r, 400));
        }

        // --- CLEANUP PHASE ---
        setGameState(prev => {
            if (prev.status === 'GAME_OVER') return prev;
            
            // Return executed cards to hand
            let newHand = [...prev.hand, ...cardsReturningToHand];

            // WAVE CLEAR LOGIC
            // Use currentState enemies as they are the most up to date after the loop
            if (currentState.enemies.length === 0) {
                const rewardMoney = 10;
                if (prev.wave < prev.maxWaves) {
                    setTimeout(() => startWave(prev.wave + 1, prev.phase), 1000);
                    return { ...prev, status: 'WAVE_CLEAR', queue: [], hand: newHand, money: prev.money + rewardMoney, logs: [...prev.logs, `Wave Clear! +${rewardMoney}G`] };
                } else {
                    setTimeout(() => handlePhaseComplete(), 1000);
                    return { ...prev, status: 'PHASE_CLEAR', queue: [], hand: newHand, money: prev.money + rewardMoney, logs: [...prev.logs, `Battle Clear! +${rewardMoney}G`] };
                }
            }

            return {
                ...prev,
                status: 'PLAYING',
                queue: [], // Queue cleared
                hand: newHand,
                // specialActionCooldown ticked during planning AND execution loop
            };
        });

        setAnimating(false);
    };

    const handlePhaseComplete = () => {
        const current = stateRef.current;
        if (current.phase === 'BATTLE_1') {
            generateRewards();
            setGameState(prev => ({ ...prev, phase: 'REWARD', status: 'PLAYING' }));
            audioService.playSound('win');
        } else if (current.phase === 'BATTLE_2') {
            setGameState(prev => ({ ...prev, phase: 'SHOP', status: 'PLAYING' }));
            audioService.playBGM('poker_shop');
        } else if (current.phase === 'BOSS') {
            setGameState(prev => ({ ...prev, status: 'VICTORY' }));
            audioService.playSound('win');
        }
    };

    const generateRewards = () => {
        const pool = CARD_DB.filter(c => !stateRef.current.hand.some(h => h.name === c.name)); // Avoid dupes if possible
        const options: KCard[] = [];
        for (let i = 0; i < 2; i++) {
            const template = pool[Math.floor(Math.random() * pool.length)] || pool[0];
            options.push({ ...template, id: `rew_${Date.now()}_${i}`, currentCooldown: 0 });
        }
        setRewardCards(options);
    };

    const selectReward = (card: KCard) => {
        setGameState(prev => ({
            ...prev,
            hand: [...prev.hand, card],
            phase: 'BATTLE_2',
            status: 'PLAYING'
        }));
        setTimeout(() => startWave(1, 'BATTLE_2'), 100);
    };

    const buyUpgrade = (idx: number) => {
        const cost = 20;
        if (gameState.money >= cost) {
            const newHand = [...gameState.hand];
            const card = newHand[idx];
            if (card) {
                // Simple Upgrade: Dmg+1 or Shield+1
                if (card.damage > 0) card.damage += 1;
                if (card.shield && card.shield > 0) card.shield += 1;
                card.upgraded = true;
                
                setGameState(prev => ({
                    ...prev,
                    money: prev.money - cost,
                    hand: newHand
                }));
                audioService.playSound('buff');
                addLog(`${card.name}を強化した！`);
            }
        } else {
            audioService.playSound('wrong');
        }
    };

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

    const goToBoss = () => {
        startWave(1, 'BOSS');
    };

    // --- RENDER HELPERS ---
    const getGridContent = (idx: number) => {
        const p = gameState.player;
        const e = gameState.enemies.find(en => en.pos === idx);
        
        if (p.pos === idx) {
            return (
                <div className="relative w-full h-full flex items-end justify-center">
                    <div className={`transition-transform duration-200 ${p.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                        <PixelSprite seed="HERO" name={p.spriteName} className="w-16 h-16"/>
                    </div>
                    {p.shield > 0 && <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded border border-white">{p.shield}</div>}
                    <div className="absolute -bottom-6 w-20 text-center bg-black/50 text-white text-xs rounded border border-green-500">HP {p.hp}/{p.maxHp}</div>
                </div>
            );
        }
        if (e) {
            const isAttacking = e.intent && e.intent.type === 'ATTACK' && e.intent.timer === 1;
            const isWaiting = e.intent && e.intent.type === 'WAIT';
            return (
                <div className="relative w-full h-full flex items-end justify-center">
                    <div className={`transition-transform duration-200 ${e.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                        <PixelSprite seed={e.id} name={e.spriteName} className="w-16 h-16"/>
                    </div>
                    {isAttacking && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                <Swords size={12} className="mr-1"/> !
                            </div>
                        </div>
                    )}
                    {isWaiting && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold border border-white shadow-lg flex items-center">
                                <Hourglass size={12} className="mr-1"/> {e.intent!.timer}
                            </div>
                        </div>
                    )}
                    <div className="absolute -bottom-6 w-16 text-center bg-black/50 text-white text-xs rounded border border-red-500">{e.hp}/{e.maxHp}</div>
                </div>
            );
        }
        return null;
    };

    const isDangerZone = (idx: number) => {
        return gameState.enemies.some(e => {
            if (e.intent?.type === 'ATTACK' && e.intent.timer === 1) {
                const range = e.intent.range || [];
                const targets = range.map(r => e.pos + (r * e.facing));
                return targets.includes(idx);
            }
            return false;
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1a1a2e] text-white font-mono relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/40 border-b border-indigo-500/30 shrink-0">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white"><ArrowLeft className="mr-2"/> Quit</button>
                <h2 className="text-xl font-bold text-indigo-100 tracking-widest hidden md:block">
                    KOCHO SHOWDOWN <span className="text-sm text-pink-400 ml-2">{gameState.phase === 'BOSS' ? 'FINAL' : `Wave ${gameState.wave}/${gameState.maxWaves}`}</span>
                </h2>
                <div className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                    <Coins size={16}/> {gameState.money} G
                </div>
            </div>

            {/* Game Area (Grid) */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-y-auto custom-scrollbar">
                
                {/* Reward Phase UI */}
                {gameState.phase === 'REWARD' && (
                    <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-8">
                        <h2 className="text-3xl font-bold text-yellow-400 mb-8 flex items-center"><Gift className="mr-2"/> Card Reward</h2>
                        <div className="flex gap-8 justify-center flex-wrap">
                            {rewardCards.map((card, i) => (
                                <div key={i} className="w-40 bg-slate-800 border-4 border-yellow-500 rounded-xl p-4 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer" onClick={() => selectReward(card)}>
                                    <div className="text-4xl mb-4 text-indigo-400">{card.icon}</div>
                                    <div className="font-bold text-white mb-2 text-center">{card.name}</div>
                                    <div className="text-xs text-gray-400 text-center">{card.description}</div>
                                    <button className="mt-4 bg-yellow-600 text-black font-bold px-4 py-1 rounded-full">Select</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shop Phase UI */}
                {gameState.phase === 'SHOP' && (
                    <div className="absolute inset-0 bg-black/95 z-40 flex flex-col p-4 md:p-8 overflow-y-auto">
                        <h2 className="text-3xl font-bold text-indigo-400 mb-6 flex items-center shrink-0"><ShoppingBag className="mr-2"/> Shop & Upgrade</h2>
                        <div className="flex flex-col md:flex-row gap-8 flex-grow">
                            {/* Upgrade Section */}
                            <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-4 overflow-y-auto custom-scrollbar">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Hammer className="mr-2 text-red-400"/> Upgrade Deck (20G)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {gameState.hand.map((card, i) => (
                                        <div key={i} className="bg-slate-800 p-3 rounded border border-slate-600 relative">
                                            <div className="font-bold text-sm text-white">{card.name} {card.upgraded && <span className="text-yellow-400 text-xs">+1</span>}</div>
                                            <div className="text-xs text-gray-400">{card.description}</div>
                                            {card.damage > 0 && <div className="text-xs text-red-400">DMG: {card.damage}</div>}
                                            {card.shield && <div className="text-xs text-blue-400">SHIELD: {card.shield}</div>}
                                            <button onClick={() => buyUpgrade(i)} className="absolute top-2 right-2 bg-green-700 text-white text-xs px-2 py-1 rounded hover:bg-green-600">UP</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Items Section */}
                            <div className="w-full md:w-80 bg-slate-900 border border-slate-600 rounded-lg p-4 shrink-0">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Gift className="mr-2 text-yellow-400"/> Relics</h3>
                                <div className="space-y-4">
                                    {SHOP_RELICS.map(item => {
                                        const owned = gameState.relics.some(r => r.id === item.id) && item.id !== 'R_POTION';
                                        return (
                                            <div key={item.id} className={`bg-slate-800 p-3 rounded border flex justify-between items-center ${owned ? 'opacity-50 border-gray-700' : 'border-slate-500'}`}>
                                                <div>
                                                    <div className="font-bold text-sm text-yellow-200">{item.name}</div>
                                                    <div className="text-xs text-gray-400">{item.desc}</div>
                                                </div>
                                                <button disabled={owned} onClick={() => buyShopItem(item)} className={`px-3 py-1 rounded text-sm font-bold ${owned ? 'bg-gray-600 text-gray-400' : 'bg-yellow-600 text-black hover:bg-yellow-500'}`}>{owned ? 'Sold' : `${item.price}G`}</button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={goToBoss} className="mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-lg text-xl flex items-center justify-center animate-pulse border-2 border-red-400">
                                    <Skull className="mr-2"/> CHALLENGE BOSS
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Standard Gameplay View */}
                {(gameState.phase === 'BATTLE_1' || gameState.phase === 'BATTLE_2' || gameState.phase === 'BOSS') && (
                    <>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg text-center pointer-events-none z-10">
                            {gameState.logs.map((log, i) => (
                                <div key={i} className={`text-sm ${i===0 ? 'text-white font-bold text-shadow-md' : 'text-gray-500'} transition-opacity duration-500`}>{log}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 w-full max-w-4xl px-2 mb-4 shrink-0">
                            {[...Array(GRID_SIZE)].map((_, i) => (
                                <div key={i} className={`aspect-[1/2] md:aspect-square border-2 ${isDangerZone(i) ? 'border-red-500 bg-red-900/20' : 'border-indigo-800 bg-black/30'} rounded-lg flex items-end justify-center relative`}>
                                    {getGridContent(i)}
                                    <div className="absolute bottom-1 right-1 text-[8px] md:text-[10px] text-gray-700">{i}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Status Overlay */}
                {gameState.status === 'VICTORY' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                        <h2 className="text-4xl font-bold text-white mb-4">GRADUATION!</h2>
                        <p className="text-gray-300 mb-8">You defeated the Principal.</p>
                        <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded text-xl font-bold hover:bg-indigo-500">Return</button>
                    </div>
                )}
                {gameState.status === 'GAME_OVER' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                        <Skull size={64} className="text-red-500 mb-4"/>
                        <h2 className="text-4xl font-bold text-red-500 mb-4">EXPELLED</h2>
                        <button onClick={() => startWave(1, 'BATTLE_1')} className="bg-white text-black px-8 py-3 rounded text-xl font-bold hover:bg-gray-200">Retry</button>
                    </div>
                )}

            </div>

            {/* Controls Area (Bottom) - Only show during Gameplay */}
            {gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY' && gameState.phase !== 'SHOP' && gameState.phase !== 'REWARD' && (
                <div className="bg-[#0f0f1b] border-t-4 border-indigo-900 p-2 md:p-4 shrink-0 flex flex-col gap-2">
                    
                    {/* 1. Queue Display */}
                    <div className="flex justify-between items-center gap-2 bg-black/30 p-2 rounded-lg border border-indigo-900/30">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest writing-mode-vertical rotate-180 hidden md:block">QUEUE</div>
                        <div className="flex gap-1 md:gap-2 justify-start items-center flex-grow overflow-x-auto">
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

                    {/* 2. Hand Cards (Scrollable) */}
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 custom-scrollbar min-h-[100px] items-center">
                        {gameState.hand.map((card, i) => (
                            <div 
                                key={card.id} 
                                className={`w-20 h-28 md:w-24 md:h-32 bg-slate-800 border-2 rounded-lg flex flex-col justify-between p-1 md:p-2 cursor-pointer transition-transform relative shadow-lg shrink-0 ${card.upgraded ? 'border-yellow-400' : 'border-slate-600'} ${card.currentCooldown > 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`}
                                onClick={() => handleQueueCard(card, i)}
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 ${card.color} rounded-t-sm`}></div>
                                <div className="mt-1 text-[9px] md:text-xs font-bold text-center leading-tight truncate">{card.name}</div>
                                <div className="flex justify-center my-0.5 text-indigo-300 scale-75 md:scale-100">{card.icon}</div>
                                <div className="text-[8px] md:text-[9px] text-gray-400 text-center leading-tight h-6 overflow-hidden">{card.description}</div>
                                <div className="flex justify-between items-center text-[8px] md:text-[10px] text-gray-500 mt-auto font-mono w-full">
                                    <span>CD:{card.cooldown}</span>
                                    {card.damage > 0 ? (
                                        <span className="text-red-400 font-bold flex items-center">
                                            <Swords size={10} className="mr-0.5"/>{card.damage}
                                        </span>
                                    ) : (
                                        <span className="opacity-70">{card.type}</span>
                                    )}
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
                    <div className="flex justify-center items-center gap-4 py-2 border-t border-indigo-900/30 relative">
                        <button onClick={() => handleMove(-1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-full border border-slate-500 active:bg-slate-800 transition-colors shadow-lg"><ChevronLeft size={24}/></button>
                        
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-1">
                                <button onClick={handleTurn} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg border border-slate-500 text-sm font-bold flex items-center justify-center active:bg-slate-800 transition-colors w-16">TURN</button>
                                <button 
                                    onClick={handleSwapPosition}
                                    className={`px-2 py-2 rounded-lg border flex items-center justify-center transition-colors w-12 ${gameState.specialActionCooldown > 0 ? 'bg-gray-800 border-gray-600 text-gray-500' : 'bg-cyan-700 border-cyan-400 text-cyan-100 hover:bg-cyan-600 active:scale-95'}`}
                                    title="位置交換 (CD: 3)"
                                >
                                    {gameState.specialActionCooldown > 0 ? (
                                        <span className="text-xs font-bold">{gameState.specialActionCooldown}</span>
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                </button>
                            </div>
                            <button onClick={handleWait} className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg border border-gray-600 text-xs flex items-center justify-center active:bg-gray-900 transition-colors w-28 text-gray-400"><Clock size={12} className="mr-1"/> WAIT</button>
                        </div>

                        <button onClick={() => handleMove(1)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-full border border-slate-500 active:bg-slate-800 transition-colors shadow-lg"><ChevronRight size={24}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KochoShowdown;
