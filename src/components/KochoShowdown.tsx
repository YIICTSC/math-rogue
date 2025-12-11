import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, X, RotateCcw, Swords, Shield, Footprints, RefreshCw, Zap, Trophy, Skull, Info, ChevronsRight, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES ---
type Facing = 1 | -1; // 1: Right, -1: Left
type TileEffect = 'ATTACK' | 'BUFF' | 'NONE';

interface KCard {
    id: string;
    name: string;
    type: 'ATTACK' | 'MOVE' | 'UTILITY';
    range: number[]; // Relative range, e.g. [1, 2] means 1 and 2 tiles in front
    damage: number;
    cooldown: number; // Not used in queue execution logic directly but maybe for deck building?
    color: string;
    icon: React.ReactNode;
    description: string;
    energyCost: number; // Consumes 'Time' in execution? Or simple slot cost? Shogun uses execution turns.
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

interface KochoGameState {
    wave: number;
    turn: number;
    gridSize: number;
    player: KEntity;
    enemies: KEntity[];
    hand: KCard[];
    queue: KCard[]; // Max 3
    deck: KCard[];
    discard: KCard[]; // Added Discard Pile
    status: 'PLAYING' | 'EXECUTING' | 'GAME_OVER' | 'VICTORY' | 'WAVE_CLEAR';
    logs: string[];
}

// --- DATA ---
const CARD_DB: KCard[] = [
    { id: 'slash', name: '定規スラッシュ', type: 'ATTACK', range: [1], damage: 3, cooldown: 0, color: 'bg-red-600', icon: <Swords size={16}/>, description: '目の前の敵を斬る', energyCost: 1 },
    { id: 'poke', name: 'コンパス突き', type: 'ATTACK', range: [2], damage: 2, cooldown: 0, color: 'bg-orange-600', icon: <Zap size={16}/>, description: '2マス先を攻撃', energyCost: 1 },
    { id: 'dash', name: 'ダッシュ', type: 'MOVE', range: [2], damage: 0, cooldown: 0, color: 'bg-blue-600', icon: <ChevronsRight size={16}/>, description: '前方に2マス移動', energyCost: 1 },
    { id: 'backstep', name: 'バックステップ', type: 'UTILITY', range: [-1], damage: 0, cooldown: 0, color: 'bg-gray-600', icon: <RotateCcw size={16}/>, description: '1マス下がる', energyCost: 1 },
    { id: 'shout', name: '大声', type: 'ATTACK', range: [1, 2, 3], damage: 1, cooldown: 0, color: 'bg-yellow-600', icon: <Zap size={16}/>, description: '前方3マスに音波攻撃', energyCost: 1 },
    { id: 'bow', name: 'お辞儀', type: 'UTILITY', range: [0], damage: 0, cooldown: 0, color: 'bg-green-600', icon: <Shield size={16}/>, description: '待機してシールド+1', energyCost: 1 },
];

const getInitialDeck = (): KCard[] => {
    return [
        { ...CARD_DB[0], id: 'c1' },
        { ...CARD_DB[0], id: 'c2' },
        { ...CARD_DB[1], id: 'c3' },
        { ...CARD_DB[3], id: 'c4' },
        { ...CARD_DB[5], id: 'c5' },
    ];
};

const ENEMY_TYPES = [
    { name: '不良生徒', maxHp: 5, sprite: 'SENIOR|#212121', attackDmg: 2, range: [1], speed: 3 },
    { name: '熱血教師', maxHp: 10, sprite: 'TEACHER|#ef4444', attackDmg: 4, range: [1], speed: 4 },
    { name: '用務員', maxHp: 8, sprite: 'HUMANOID|#3e2723', attackDmg: 3, range: [1, 2], speed: 5 },
    { name: '教頭', maxHp: 15, sprite: 'MUSCLE|#1565c0', attackDmg: 5, range: [1], speed: 6 },
    { name: '校長', maxHp: 30, sprite: 'BOSS|#FFD700', attackDmg: 8, range: [1, 2, 3], speed: 4 },
];

const GRID_SIZE = 7;

// --- COMPONENT ---
const KochoShowdown: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    
    // State
    const [gameState, setGameState] = useState<KochoGameState>({
        wave: 1,
        turn: 1,
        gridSize: GRID_SIZE,
        player: { id: 'p1', type: 'PLAYER', name: '勇者', pos: 3, facing: 1, maxHp: 20, hp: 20, spriteName: 'HERO_SIDE|赤', shield: 0 },
        enemies: [],
        hand: [],
        queue: [],
        deck: getInitialDeck(),
        discard: [],
        status: 'PLAYING',
        logs: ['校長室への道が開かれた...']
    });

    // Ref to hold current state for async loops (avoiding stale closures)
    const stateRef = useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const [animating, setAnimating] = useState(false);
    const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

    // Initialization
    useEffect(() => {
        startWave(1);
        audioService.playBGM('dungeon_boss');
    }, []);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs.slice(0, 4)] }));
    };

    const startWave = (wave: number) => {
        const enemyCount = Math.min(3, 1 + Math.floor(wave / 2));
        const newEnemies: KEntity[] = [];
        
        // Spawn Enemies
        for (let i = 0; i < enemyCount; i++) {
            const isBoss = wave === 5 && i === 0;
            const template = isBoss ? ENEMY_TYPES[4] : ENEMY_TYPES[Math.floor(Math.random() * (Math.min(ENEMY_TYPES.length - 1, wave)))];
            
            let pos = i === 0 ? 0 : 6; // Simple spawn logic (ends)
            if (newEnemies.some(e => e.pos === pos)) pos = pos === 0 ? 1 : 5; // Avoid overlap
            
            newEnemies.push({
                id: `e_${wave}_${i}`,
                type: 'ENEMY',
                name: template.name,
                pos: pos,
                facing: pos < 3 ? 1 : -1,
                maxHp: template.maxHp,
                hp: template.maxHp,
                spriteName: template.sprite,
                shield: 0,
                intent: {
                    type: 'MOVE',
                    timer: Math.floor(Math.random() * 2) + 1,
                    targetPos: 3 // Aim for center initially
                }
            });
        }

        // Reshuffle ALL cards back to deck
        const current = stateRef.current;
        const allCards = [...current.deck, ...current.hand, ...current.discard, ...current.queue];
        const newDeck = allCards.sort(() => Math.random() - 0.5);
        
        // Draw 5
        const drawCount = 5;
        const newHand = newDeck.splice(0, drawCount);

        setGameState(prev => ({
            ...prev,
            wave: wave,
            turn: 1,
            player: { ...prev.player, pos: 3, facing: 1, shield: 0 }, // Reset pos
            enemies: newEnemies,
            hand: newHand,
            deck: newDeck,
            discard: [],
            queue: [],
            status: 'PLAYING',
            logs: [`Wave ${wave} 開始！`]
        }));
        
        updateEnemyIntents(newEnemies, 3); // Calculate initial intents based on player pos 3
    };

    // --- GAME LOGIC HELPER ---
    const updateEnemyIntents = (enemies: KEntity[], playerPos: number) => {
        enemies.forEach(e => {
            if (!e.intent) e.intent = { type: 'WAIT', timer: 1 };
            
            // If timer > 0, just wait (it decrements on player action)
            if (e.intent.timer > 0) return;

            // Timer hit 0 last turn, now plan next move
            // Simple AI:
            const dist = e.pos - playerPos;
            const absDist = Math.abs(dist);
            const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
            
            // Can attack?
            if (template.range.includes(absDist)) {
                // Check facing
                const correctFacing = (dist < 0 && e.facing === 1) || (dist > 0 && e.facing === -1);
                if (correctFacing) {
                    e.intent = { type: 'ATTACK', damage: template.attackDmg, range: template.range, timer: template.speed };
                    return;
                }
            }

            // Move towards player
            const moveDir = dist < 0 ? 1 : -1;
            e.intent = { type: 'MOVE', targetPos: e.pos + moveDir, timer: Math.floor(template.speed / 2) };
        });
    };

    // --- ACTIONS ---
    const tickWorld = async (actionType: 'MOVE' | 'WAIT' | 'EXECUTE') => {
        // Use Ref to get the latest state for logic calculation
        const current = stateRef.current;
        
        // 1. Decrement Enemy Timers
        const enemies = [...current.enemies];
        enemies.forEach(e => {
            if (e.intent) e.intent.timer = Math.max(0, e.intent.timer - 1);
        });
        
        // 2. Resolve Enemy Actions (Zero Timer)
        for (const e of enemies) {
            if (e.intent && e.intent.timer === 0 && e.hp > 0) {
                // Execute Intent
                if (e.intent.type === 'ATTACK') {
                    // Check if player is in range
                    const p = current.player;
                    const dist = Math.abs(e.pos - p.pos);
                    const rangeHit = e.intent.range?.includes(dist);
                    const facingHit = (e.pos < p.pos && e.facing === 1) || (e.pos > p.pos && e.facing === -1);
                    
                    if (rangeHit && facingHit) {
                        // Hit Player
                        const dmg = e.intent.damage || 0;
                        const blocked = Math.min(dmg, p.shield);
                        const finalDmg = dmg - blocked;
                        
                        // NOTE: Updating React state here, but we must update our local tracking too if we were doing complex chain
                        setGameState(prev => ({
                            ...prev,
                            player: { ...prev.player, hp: Math.max(0, prev.player.hp - finalDmg), shield: prev.player.shield - blocked }
                        }));
                        addLog(`${e.name}の攻撃！ ${finalDmg}ダメージ！`);
                        audioService.playSound('lose'); // hurt sound
                        await new Promise(r => setTimeout(r, 200));
                        
                        // Check gameOver against calculating value
                        if (current.player.hp - finalDmg <= 0) {
                            setGameState(prev => ({ ...prev, status: 'GAME_OVER' }));
                            return; // Stop processing
                        }
                    } else {
                        // Miss
                        addLog(`${e.name}の攻撃は空を切った。`);
                    }
                    
                    // Reset Intent
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    e.intent = { type: 'WAIT', timer: template.speed }; // Cooldown
                } 
                else if (e.intent.type === 'MOVE') {
                    // Move logic
                    const target = e.intent.targetPos;
                    if (target !== undefined && target >= 0 && target < GRID_SIZE) {
                        // Check collision
                        const blocked = enemies.some(other => other.id !== e.id && other.pos === target) || current.player.pos === target;
                        if (!blocked) {
                            e.pos = target;
                            // Update facing
                            if (target < current.player.pos) e.facing = 1; else e.facing = -1;
                        }
                    }
                    // Reset Intent (Plan attack or move next)
                    const template = ENEMY_TYPES.find(t => t.name === e.name) || ENEMY_TYPES[0];
                    e.intent = { type: 'WAIT', timer: Math.floor(template.speed/2) }; // Shorter wait after move
                }
            }
        }
        
        // Update intents based on new positions
        updateEnemyIntents(enemies, current.player.pos);
        setGameState(prev => ({ ...prev, enemies }));
    };

    const handleMove = async (dir: -1 | 1) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);

        const newPos = stateRef.current.player.pos + dir;
        
        // Check bounds & collision
        if (newPos >= 0 && newPos < GRID_SIZE && !stateRef.current.enemies.some(e => e.pos === newPos)) {
            setGameState(prev => ({
                ...prev,
                player: { ...prev.player, pos: newPos, facing: dir } // Face movement direction
            }));
            audioService.playSound('select');
            await tickWorld('MOVE');
        } else {
            // Blocked or OOB
            audioService.playSound('wrong');
            // Just change facing if blocked
            setGameState(prev => ({
                ...prev,
                player: { ...prev.player, facing: dir }
            }));
        }
        
        setAnimating(false);
    };

    const handleTurn = async () => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        setAnimating(true);
        setGameState(prev => ({ ...prev, player: { ...prev.player, facing: (prev.player.facing * -1) as Facing } }));
        await tickWorld('WAIT');
        setAnimating(false);
    };

    const handleQueueCard = (card: KCard, idx: number) => {
        if (stateRef.current.status !== 'PLAYING' || animating) return;
        if (stateRef.current.queue.length >= 3) {
            addLog("キューが一杯です！");
            return;
        }
        
        // Move from Hand to Queue
        const newHand = [...stateRef.current.hand];
        newHand.splice(idx, 1);
        
        setGameState(prev => ({
            ...prev,
            hand: newHand,
            queue: [...prev.queue, card]
        }));
        audioService.playSound('select');
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
        
        for (const card of queue) {
            // Highlight current card (not implemented visually but logical delay)
            addLog(`${card.name} を実行！`);
            
            // Execute Card Effect (Use latest ref state)
            const p = stateRef.current.player;
            let pPos = p.pos;
            
            if (card.type === 'ATTACK') {
                const targets = card.range.map(r => pPos + (r * p.facing));
                const hits = stateRef.current.enemies.filter(e => targets.includes(e.pos));
                
                if (hits.length > 0) {
                    hits.forEach(e => {
                        e.hp -= card.damage;
                        addLog(`${e.name} に ${card.damage} ダメージ！`);
                    });
                    audioService.playSound('attack');
                } else {
                    addLog("空振り...");
                    audioService.playSound('select');
                }
            } else if (card.type === 'MOVE') {
                const dist = card.range[0];
                const target = pPos + (dist * p.facing);
                if (target >= 0 && target < GRID_SIZE && !stateRef.current.enemies.some(e => e.pos === target)) {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, pos: target } }));
                    audioService.playSound('select');
                } else {
                    addLog("移動できない！");
                }
            } else if (card.type === 'UTILITY') {
                if (card.id === 'bow') {
                    setGameState(prev => ({ ...prev, player: { ...prev.player, shield: prev.player.shield + 1 } }));
                    addLog("防御を固めた。");
                    audioService.playSound('block');
                } else if (card.id === 'backstep') {
                    const target = pPos - p.facing;
                    if (target >= 0 && target < GRID_SIZE && !stateRef.current.enemies.some(e => e.pos === target)) {
                        setGameState(prev => ({ ...prev, player: { ...prev.player, pos: target } }));
                        audioService.playSound('select');
                    }
                }
            }

            // Clean up dead enemies
            setGameState(prev => ({
                ...prev,
                enemies: prev.enemies.filter(e => e.hp > 0)
            }));

            // Wait a bit
            await new Promise(r => setTimeout(r, 500));

            // Enemy Turn Tick
            await tickWorld('EXECUTE');
            
            // Check Game Over using Ref (updated by tickWorld effect or setGameState)
            if ((stateRef.current as KochoGameState).status === 'GAME_OVER') break;
        }

        // Draw and Shuffle Logic
        setGameState(prev => {
            if (prev.status === 'GAME_OVER') return prev;
            
            let newDeck = [...prev.deck];
            let newDiscard = [...prev.discard, ...queue];
            let newHand = [...prev.hand];
            
            const needed = 5 - newHand.length;
            
            if (needed > 0) {
                // If deck is smaller than needed, recycle discard
                if (newDeck.length < needed) {
                    newDeck = [...newDeck, ...newDiscard].sort(() => Math.random() - 0.5);
                    newDiscard = [];
                }
                
                const drawn = newDeck.splice(0, needed);
                newHand = [...newHand, ...drawn];
            }

            if (prev.enemies.length === 0) {
                // Wave Clear
                if (prev.wave === 5) return { ...prev, status: 'VICTORY', queue: [], hand: newHand, deck: newDeck, discard: newDiscard };
                else {
                    setTimeout(() => startWave(prev.wave + 1), 1000);
                    return { ...prev, status: 'WAVE_CLEAR', queue: [] };
                }
            }

            return {
                ...prev,
                status: 'PLAYING',
                queue: [],
                hand: newHand,
                deck: newDeck,
                discard: newDiscard
            };
        });

        setAnimating(false);
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
            return (
                <div className="relative w-full h-full flex items-end justify-center">
                    <div className={`transition-transform duration-200 ${e.facing === -1 ? 'scale-x-[-1]' : ''}`}>
                        <PixelSprite seed={e.id} name={e.spriteName} className="w-16 h-16"/>
                    </div>
                    {/* Intent Overlay */}
                    {e.intent && e.intent.timer <= 2 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                            {e.intent.type === 'ATTACK' && <div className="bg-red-600 text-white text-xs px-1 rounded flex items-center"><Swords size={12} className="mr-1"/> {e.intent.damage} <span className="ml-1 text-[10px]">({e.intent.timer})</span></div>}
                            {e.intent.type === 'MOVE' && <div className="bg-blue-600 text-white text-xs px-1 rounded flex items-center"><Footprints size={12} className="mr-1"/> <span className="text-[10px]">({e.intent.timer})</span></div>}
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
            if (e.intent?.type === 'ATTACK' && e.intent.timer === 0) { // Will attack THIS execution step
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
            <div className="flex justify-between items-center p-4 bg-black/40 border-b border-indigo-500/30">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white"><ArrowLeft className="mr-2"/> Quit</button>
                <h2 className="text-xl font-bold text-indigo-100 tracking-widest">KOCHO SHOWDOWN <span className="text-sm text-pink-400 ml-2">Wave {gameState.wave}</span></h2>
                <div className="text-xs text-gray-500 flex gap-4">
                    <span>Deck: {gameState.deck.length}</span>
                    <span>Discard: {gameState.discard.length}</span>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 relative">
                
                {/* Logs */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg text-center pointer-events-none">
                    {gameState.logs.map((log, i) => (
                        <div key={i} className={`text-sm ${i===0 ? 'text-white font-bold text-shadow-md' : 'text-gray-500'} transition-opacity duration-500`}>{log}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-8 w-full max-w-4xl px-2">
                    {[...Array(GRID_SIZE)].map((_, i) => (
                        <div key={i} className={`aspect-square border-2 ${isDangerZone(i) ? 'border-red-500 bg-red-900/20' : 'border-indigo-800 bg-black/30'} rounded-lg flex items-end justify-center relative`}>
                            {getGridContent(i)}
                            <div className="absolute bottom-1 right-1 text-[10px] text-gray-700">{i}</div>
                        </div>
                    ))}
                </div>

                {/* Status Overlay */}
                {gameState.status === 'VICTORY' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                        <h2 className="text-4xl font-bold text-white mb-4">GRADUATION!</h2>
                        <button onClick={onBack} className="bg-indigo-600 px-8 py-3 rounded text-xl font-bold hover:bg-indigo-500">Return</button>
                    </div>
                )}
                {gameState.status === 'GAME_OVER' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                        <Skull size={64} className="text-red-500 mb-4"/>
                        <h2 className="text-4xl font-bold text-red-500 mb-4">EXPELLED</h2>
                        <button onClick={() => startWave(1)} className="bg-white text-black px-8 py-3 rounded text-xl font-bold hover:bg-gray-200">Retry</button>
                    </div>
                )}

            </div>

            {/* Controls Area (Bottom) */}
            <div className="bg-[#0f0f1b] border-t-4 border-indigo-900 p-4 shrink-0">
                
                {/* Queue Display */}
                <div className="flex justify-center items-center gap-4 mb-4 min-h-[80px]">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest writing-mode-vertical rotate-180">QUEUE</div>
                    <div className="flex gap-2 bg-black/50 p-2 rounded-lg border border-indigo-900/50 min-w-[300px] justify-center items-center">
                        {gameState.queue.map((card, i) => (
                            <div key={i} className="w-16 h-20 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-center relative group cursor-pointer hover:border-red-400" onClick={() => handleUnqueueCard(i)}>
                                <div className={`w-full h-1 ${card.color} absolute top-0`}></div>
                                <div className="text-xs text-center font-bold px-1 overflow-hidden whitespace-nowrap text-ellipsis w-full">{card.name}</div>
                                <div className="text-gray-400 scale-75">{card.icon}</div>
                                <X size={12} className="absolute -top-1 -right-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100"/>
                            </div>
                        ))}
                        {[...Array(3 - gameState.queue.length)].map((_, i) => (
                            <div key={`empty-${i}`} className="w-16 h-20 border border-dashed border-gray-700 rounded flex items-center justify-center text-gray-700 text-xs">Empty</div>
                        ))}
                    </div>
                    <button 
                        onClick={executeQueue} 
                        disabled={gameState.queue.length === 0 || animating}
                        className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shadow-lg transition-all ${gameState.queue.length > 0 ? 'bg-indigo-600 border-indigo-400 text-white hover:scale-105 active:scale-95 cursor-pointer animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'}`}
                    >
                        <Play size={24} className="fill-current mb-1"/> EXEC
                    </button>
                </div>

                {/* Hand & Actions */}
                <div className="flex justify-between items-end">
                    {/* Movement Controls */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button onClick={() => handleMove(-1)} className="bg-slate-700 hover:bg-slate-600 p-3 rounded border border-slate-500"><ChevronLeft/></button>
                            <button onClick={handleTurn} className="bg-slate-700 hover:bg-slate-600 p-3 rounded border border-slate-500 text-xs font-bold w-12 flex items-center justify-center">TURN</button>
                            <button onClick={() => handleMove(1)} className="bg-slate-700 hover:bg-slate-600 p-3 rounded border border-slate-500"><ChevronRight/></button>
                        </div>
                        <div className="text-center text-[10px] text-gray-500">MOVEMENT</div>
                    </div>

                    {/* Hand Cards */}
                    <div className="flex gap-2 overflow-x-auto pb-2 px-2 custom-scrollbar max-w-xl">
                        {gameState.hand.map((card, i) => (
                            <div 
                                key={card.id} 
                                className={`w-24 h-32 bg-slate-800 border-2 rounded-lg flex flex-col justify-between p-2 cursor-pointer transition-transform hover:-translate-y-2 relative shadow-lg ${selectedCardIdx === i ? 'border-yellow-400' : 'border-slate-600'}`}
                                onClick={() => handleQueueCard(card, i)}
                            >
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${card.color} rounded-t-sm`}></div>
                                <div className="mt-1 text-xs font-bold text-center leading-tight">{card.name}</div>
                                <div className="flex justify-center my-1 text-indigo-300">{card.icon}</div>
                                <div className="text-[9px] text-gray-400 text-center leading-tight h-8 overflow-hidden">{card.description}</div>
                                <div className="text-[10px] text-gray-500 text-right mt-1 font-mono">{card.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KochoShowdown;