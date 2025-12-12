
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Wind, Trophy, Zap, Shield, Move, AlertTriangle, RefreshCw, Layers, Crosshair, Skull, Heart, Battery, ChevronsRight, Info, Check, Play } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

// --- TYPES & CONSTANTS ---

const MAX_ROWS = 5; // Battle grid height
const SHIP_HEIGHT = 3; // Player ship height
const MAX_FUEL = 3;

type EnergyColor = 'WHITE' | 'BLUE' | 'ORANGE';

interface EnergyCard {
    id: string;
    value: number;
    color: EnergyColor;
}

interface ShipPart {
    id: string;
    type: 'CANNON' | 'SHIELD' | 'ENGINE' | 'EMPTY' | 'MISSILE';
    name: string;
    colorReq: EnergyColor | 'ANY'; // Requirement to load
    loadedValue: number | null; // Currently loaded energy
    multiplier: number; // Effect multiplier
    baseShield: number; // Passive shield provided
    hp: number; // Part HP (if destroyed, unusable) - Simplified: Hull HP is global, but parts can be disabled? Keeping simple: Hull HP global.
}

interface ShipState {
    yOffset: number; // 0 to MAX_ROWS - SHIP_HEIGHT
    hp: number;
    maxHp: number;
    shield: number; // Temporary shield for the turn
    fuel: number;
    maxFuel: number;
    durability: number; // Enemy only: Stun threshold
    maxDurability: number;
    isStunned: boolean;
    parts: ShipPart[]; // Array of parts corresponding to ship rows (0 to SHIP_HEIGHT-1)
    weaknessRevealed?: boolean;
}

interface EnemyIntent {
    row: number; // Relative to enemy ship
    type: 'ATTACK' | 'SHIELD' | 'BUFF' | 'DEBUFF';
    value: number;
}

interface PoolState {
    genNumbers: number[];
    genColors: EnergyColor[];
    coolNumbers: number[];
    coolColors: EnergyColor[];
}

type GamePhase = 'TUTORIAL' | 'SETUP' | 'BATTLE' | 'REWARD' | 'VACATION' | 'GAME_OVER' | 'VICTORY';

// --- DATABASE ---

const STARTING_PARTS: ShipPart[] = [
    { id: 'p1', type: 'CANNON', name: '鉛筆キャノン', colorReq: 'ANY', loadedValue: null, multiplier: 1, baseShield: 0, hp: 10 },
    { id: 'p2', type: 'SHIELD', name: '消しゴム装甲', colorReq: 'ANY', loadedValue: null, multiplier: 1, baseShield: 0, hp: 10 },
    { id: 'p3', type: 'ENGINE', name: '紙ブースター', colorReq: 'ANY', loadedValue: null, multiplier: 1, baseShield: 0, hp: 10 },
];

const ENEMY_DATA = [
    { name: "折り紙偵察機", hp: 20, durability: 3, parts: ['CANNON', 'EMPTY', 'SHIELD'] },
    { name: "ノート爆撃機", hp: 30, durability: 4, parts: ['CANNON', 'CANNON', 'EMPTY'] },
    { name: "定規戦艦", hp: 50, durability: 5, parts: ['SHIELD', 'CANNON', 'CANNON'] }, // Elite
    { name: "コンパス要塞", hp: 80, durability: 8, parts: ['CANNON', 'SHIELD', 'CANNON'] }, // Boss
];

// --- COMPONENTS ---

const EnergyCardView: React.FC<{ card: EnergyCard, onClick?: () => void, selected?: boolean }> = ({ card, onClick, selected }) => {
    const bgColor = card.color === 'ORANGE' ? 'bg-orange-500' : card.color === 'BLUE' ? 'bg-blue-500' : 'bg-slate-200 text-black';
    const borderColor = card.color === 'ORANGE' ? 'border-orange-700' : card.color === 'BLUE' ? 'border-blue-700' : 'border-slate-400';
    
    return (
        <div 
            onClick={onClick}
            className={`
                w-16 h-24 md:w-20 md:h-28 rounded-lg border-b-4 border-r-2 ${borderColor} ${bgColor} 
                flex flex-col items-center justify-center cursor-pointer transition-transform relative shadow-md
                ${selected ? '-translate-y-4 ring-2 ring-yellow-400 z-10' : 'hover:-translate-y-1'}
            `}
        >
            <div className={`text-2xl md:text-4xl font-black ${card.color === 'WHITE' ? 'text-slate-800' : 'text-white'}`}>{card.value}</div>
            <div className={`text-[10px] md:text-xs font-bold mt-1 ${card.color === 'WHITE' ? 'text-slate-600' : 'text-white/80'}`}>ENERGY</div>
            {/* Color Icon */}
            <div className="absolute top-1 right-1">
                {card.color === 'ORANGE' && <Zap size={12} className="text-yellow-200 fill-current"/>}
                {card.color === 'BLUE' && <Wind size={12} className="text-cyan-200 fill-current"/>}
            </div>
        </div>
    );
};

const ShipPartView: React.FC<{ part: ShipPart, isActive: boolean, onClick?: () => void, isEnemy?: boolean }> = ({ part, isActive, onClick, isEnemy }) => {
    let icon = <Info size={16}/>;
    let colorClass = 'bg-slate-700';
    
    if (part.type === 'CANNON') { icon = <Crosshair size={20}/>; colorClass = 'bg-red-900/80 border-red-500'; }
    if (part.type === 'SHIELD') { icon = <Shield size={20}/>; colorClass = 'bg-blue-900/80 border-blue-500'; }
    if (part.type === 'ENGINE') { icon = <Move size={20}/>; colorClass = 'bg-emerald-900/80 border-emerald-500'; }
    if (part.type === 'MISSILE') { icon = <Send size={20}/>; colorClass = 'bg-orange-900/80 border-orange-500'; }
    if (part.type === 'EMPTY') { icon = <div className="w-4 h-4 bg-black/50 rounded-full"/>; colorClass = 'bg-gray-800 border-gray-600'; }

    // Slot requirement indicator
    const reqColor = part.colorReq === 'ORANGE' ? 'text-orange-500' : part.colorReq === 'BLUE' ? 'text-blue-500' : 'text-white';

    return (
        <div 
            onClick={onClick}
            className={`
                relative h-12 md:h-14 w-full border-2 rounded flex items-center px-2 mb-1 transition-all
                ${colorClass} ${isActive ? 'ring-2 ring-yellow-400 brightness-110' : ''}
                ${isEnemy ? 'justify-end' : 'justify-start'}
            `}
        >
            {/* Value Display */}
            {part.loadedValue !== null && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-white drop-shadow-md z-10 flex items-center">
                    {part.type === 'SHIELD' ? <Shield size={16} className="mr-1 text-blue-300"/> : <Zap size={16} className="mr-1 text-yellow-300"/>}
                    {part.loadedValue * part.multiplier}
                </div>
            )}
            
            {/* Content */}
            <div className={`flex items-center gap-2 ${isEnemy ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-1.5 rounded-full bg-black/40 ${reqColor}`}>{icon}</div>
                <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-bold text-gray-300 leading-none">{part.name}</span>
                    {!isEnemy && part.type !== 'EMPTY' && (
                        <span className="text-[8px] text-gray-400">
                             req: {part.colorReq === 'ANY' ? 'ANY' : part.colorReq} (x{part.multiplier})
                        </span>
                    )}
                </div>
            </div>
            
            {/* Loaded Bar Background */}
            {part.loadedValue !== null && (
                <div className="absolute inset-0 bg-white/10 z-0 animate-pulse pointer-events-none" style={{ width: `${Math.min(100, part.loadedValue * 10)}%` }}></div>
            )}
        </div>
    );
};

const PaperPlaneBattle: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // --- STATE ---
    const [phase, setPhase] = useState<GamePhase>('TUTORIAL');
    const [stage, setStage] = useState(1); // 1-12
    const [turn, setTurn] = useState(1);
    
    // Pools
    const [pool, setPool] = useState<PoolState>({
        genNumbers: [1,2,3,4,5,6,7,8,9, 3,4,5], 
        genColors: ['WHITE','WHITE','WHITE','WHITE','BLUE','BLUE','BLUE','ORANGE','ORANGE'], 
        coolNumbers: [],
        coolColors: []
    });

    const [hand, setHand] = useState<EnergyCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Ships
    const [player, setPlayer] = useState<ShipState>({
        yOffset: 1, // Start middle
        hp: 30, maxHp: 30, shield: 0, fuel: MAX_FUEL, maxFuel: MAX_FUEL, durability: 0, maxDurability: 0, isStunned: false,
        parts: [...STARTING_PARTS]
    });

    const [enemy, setEnemy] = useState<ShipState>({
        yOffset: 1,
        hp: 20, maxHp: 20, shield: 0, fuel: 0, maxFuel: 0, durability: 3, maxDurability: 3, isStunned: false,
        parts: []
    });

    const [enemyIntents, setEnemyIntents] = useState<EnemyIntent[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [showPool, setShowPool] = useState(false);
    const [animating, setAnimating] = useState(false);

    // --- GAME LOGIC ---

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 4)]);

    const initBattle = (stageNum: number) => {
        // Enemy Gen
        const enemyIdx = Math.min(ENEMY_DATA.length - 1, Math.floor((stageNum - 1) / 3));
        const template = ENEMY_DATA[enemyIdx];
        
        // Parts Gen
        const eParts: ShipPart[] = template.parts.map((t, i) => ({
            id: `ep_${i}`,
            type: t as any,
            name: t === 'CANNON' ? '敵砲台' : t === 'SHIELD' ? '敵装甲' : '空きスロット',
            colorReq: 'ANY', loadedValue: null, multiplier: 1, baseShield: 0, hp: 10
        }));

        setEnemy({
            yOffset: 1,
            hp: template.hp, maxHp: template.hp,
            durability: template.durability, maxDurability: template.durability,
            shield: 0, fuel: 0, maxFuel: 0, isStunned: false,
            parts: eParts
        });

        // Reset Player Temp Stats
        setPlayer(prev => ({
            ...prev,
            shield: 0,
            yOffset: 1, // Reset position
            parts: prev.parts.map(p => ({ ...p, loadedValue: null }))
        }));

        setTurn(1);
        setHand([]);
        generateEnemyIntents(1, eParts, template.durability); // Initial Intent
        drawEnergy(4); // Turn 1 draw
        setPhase('BATTLE');
        addLog(`バトル開始！ 敵: ${template.name}`);
        audioService.playBGM('battle');
    };

    const generateEnemyIntents = (turnNum: number, parts: ShipPart[], durability: number) => {
        // Simple AI: Randomly load cannons or shield
        const intents: EnemyIntent[] = [];
        parts.forEach((p, idx) => {
            if (p.type === 'CANNON') {
                if (Math.random() < 0.7) {
                    intents.push({ row: idx, type: 'ATTACK', value: 2 + Math.floor(turnNum/3) });
                }
            } else if (p.type === 'SHIELD') {
                if (Math.random() < 0.5) {
                    intents.push({ row: idx, type: 'SHIELD', value: 3 });
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
                
                // Shuffle if refilled
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
                    
                    // Add to cooling immediately (conceptually used when card is played, but for simplicity cycle them here or on play? 
                    // Cobalt Core recycles on play/discard. Let's do on play/discard.)
                    // Wait, if I remove from Gen now, I should hold them in "Hand" state, then move to Cool on use.
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
        if (!selectedCardId) return;
        const cardIndex = hand.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) return;

        const card = hand[cardIndex];
        const part = player.parts[partIndex];

        // Validation
        if (part.type === 'EMPTY') { addLog("そこには何もありません"); return; }
        if (part.loadedValue !== null) { addLog("既にエネルギーが装填されています"); return; }
        if (part.colorReq !== 'ANY' && part.colorReq !== card.color) { addLog("色が合いません！"); return; }

        // Load
        const newParts = [...player.parts];
        newParts[partIndex] = { ...part, loadedValue: card.value };
        setPlayer(prev => ({ ...prev, parts: newParts }));
        
        // Remove card, Recycle
        const newHand = [...hand];
        newHand.splice(cardIndex, 1);
        setHand(newHand);
        recycleCard(card);
        setSelectedCardId(null);
        audioService.playSound('buff');
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

        // 1. Player Action Resolution
        let totalPlayerDmg = 0;
        let totalEnemyDmg = 0;
        let enemyStunDmg = 0;

        // Iterate Rows (0 to MAX_ROWS-1)
        for (let r = 0; r < MAX_ROWS; r++) {
            // Check Player Part at this absolute row
            // Player occupies rows: player.yOffset to player.yOffset + SHIP_HEIGHT - 1
            const pRelIdx = r - player.yOffset;
            const pPart = (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) ? player.parts[pRelIdx] : null;

            // Check Enemy Part
            const eRelIdx = r - enemy.yOffset;
            const ePart = (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) ? enemy.parts[eRelIdx] : null;

            // Enemy Intent on this row
            const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === r);

            // Calculate Powers
            let pPower = 0;
            let pShield = 0;
            if (pPart && pPart.loadedValue !== null) {
                if (pPart.type === 'CANNON') pPower = pPart.loadedValue * pPart.multiplier;
                if (pPart.type === 'SHIELD') pShield = pPart.loadedValue * pPart.multiplier;
            }
            if (pPart) pShield += pPart.baseShield; // Passive shield

            let ePower = 0;
            let eShield = 0;
            if (intent) {
                if (intent.type === 'ATTACK') ePower = intent.value;
                if (intent.type === 'SHIELD') eShield = intent.value;
            }
            // Add existing enemy shield if any? Simplified: Intent executes immediately
            
            // Resolve Clash
            // Attack vs Attack = Difference
            // Attack vs Shield = Blocked
            // Attack vs Hull = Damage

            let rowLog = `Row ${r+1}: `;
            
            // Player Attack
            if (pPower > 0) {
                // If enemy attacking, clash
                if (ePower > 0) {
                    if (pPower > ePower) {
                        const diff = pPower - ePower;
                        ePower = 0; // Enemy attack neutralized
                        // Remaining hits hull
                        enemyStunDmg += 1; // Winning a clash counts for stun? Or just damage? 
                        // Prompt: "Higher total power deals difference... Wins X rows > Durability -> Stun"
                        // Let's assume winning a row contributes to stun
                        
                        // Deal diff damage to enemy
                        const dmg = Math.max(0, diff - eShield); // Shield blocks remainder
                        if (dmg > 0) {
                            setEnemy(prev => ({...prev, hp: Math.max(0, prev.hp - dmg)}));
                            rowLog += `P Hit ${dmg}! `;
                        } else {
                            rowLog += `P Blocked. `;
                        }
                        enemyStunDmg++;
                    } else if (ePower > pPower) {
                        const diff = ePower - pPower;
                        pPower = 0; // Player attack neutralized
                        ePower = diff; // Remaining enemy power
                        rowLog += `Clash Lose. `;
                    } else {
                        pPower = 0; ePower = 0;
                        rowLog += `Clash Draw. `;
                    }
                } else {
                    // Direct hit on enemy
                    const dmg = Math.max(0, pPower - eShield);
                    if (dmg > 0) {
                        setEnemy(prev => ({...prev, hp: Math.max(0, prev.hp - dmg)}));
                        rowLog += `P Hit ${dmg}! `;
                    } else {
                        rowLog += `P Blocked. `;
                    }
                    enemyStunDmg++;
                }
            }

            // Enemy Attack (Remaining)
            if (ePower > 0) {
                // Check if Player Shield exists in this row (Loaded shield)
                const dmg = Math.max(0, ePower - pShield);
                if (dmg > 0) {
                    // Global Shield check? "Shield" part usually adds to row, but maybe global?
                    // Let's assume row-based shield for tactical depth
                    setPlayer(prev => ({...prev, hp: Math.max(0, prev.hp - dmg)}));
                    rowLog += `E Hit ${dmg}! `;
                } else {
                    rowLog += `E Blocked. `;
                }
            }
            
            // if (rowLog !== `Row ${r+1}: `) addLog(rowLog);
            await new Promise(r => setTimeout(r, 200));
        }

        // Stun Logic
        if (enemyStunDmg >= enemy.durability && !enemy.isStunned) {
            addLog("敵をスタンさせた！(次ターン行動不能)");
            setEnemy(prev => ({...prev, isStunned: true}));
            audioService.playSound('win');
        } else if (enemy.isStunned) {
            addLog("敵はスタンから回復した。");
            setEnemy(prev => ({...prev, isStunned: false, durability: prev.maxDurability}));
        } else {
             // Reduce durability? Or reset? "Durability... decrements... if 0 stun... resets next turn"
             // Implies cumulative over turn? No, "Wins row count > Durability".
             // Let's reduce durability by wins
             const newDur = Math.max(0, enemy.durability - enemyStunDmg);
             setEnemy(prev => ({...prev, durability: newDur}));
             if (newDur === 0) {
                 // Stun applied for NEXT turn
                 setEnemy(prev => ({...prev, isStunned: true}));
                 addLog("敵の体勢を崩した！");
             }
        }

        // Cleanup
        setPlayer(prev => ({ ...prev, parts: prev.parts.map(p => ({...p, loadedValue: null})) }));
        
        await new Promise(r => setTimeout(r, 500));
        setAnimating(false);

        if (player.hp <= 0) {
            setPhase('GAME_OVER');
            audioService.playSound('lose');
        } else if (enemy.hp <= 0) {
            audioService.playSound('win');
            if (stage === 12) {
                setPhase('VICTORY');
            } else {
                setPhase('REWARD');
            }
        } else {
            // Next Turn
            setTurn(prev => prev + 1);
            generateEnemyIntents(turn + 1, enemy.parts, enemy.durability);
            drawEnergy(3);
        }
    };

    const handleReward = () => {
        // Simple reward: Heal or Fuel Max Up
        // In full ver: Add Parts
        if (Math.random() > 0.5) {
            setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + 10)}));
            addLog("修理キットでHP回復！");
        } else {
            setPlayer(p => ({...p, maxFuel: p.maxFuel + 1, fuel: p.maxFuel + 1}));
            addLog("燃料タンク拡張！");
        }
        setStage(s => s + 1);
        
        // Vacation check?
        // 12 battles, 11 vacations.
        // For simplicity in this minigame, just go next battle
        initBattle(stage + 1);
    };

    // --- RENDER HELPERS ---

    const renderGridRow = (rowIndex: number) => {
        // Player Ship Part
        const pRelIdx = rowIndex - player.yOffset;
        const pPart = (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) ? player.parts[pRelIdx] : null;

        // Enemy Ship Part
        const eRelIdx = rowIndex - enemy.yOffset;
        const ePart = (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) ? enemy.parts[eRelIdx] : null;
        
        // Enemy Intent
        const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === rowIndex);

        return (
            <div key={rowIndex} className="flex items-center h-16 border-b border-white/10 relative">
                {/* Player Side */}
                <div className="w-1/3 flex justify-end pr-2 border-r border-dashed border-white/20 relative">
                    {pPart && (
                        <div className="w-full">
                            <ShipPartView 
                                part={pPart} 
                                isActive={false} 
                                onClick={() => handlePartClick(pRelIdx)} 
                            />
                        </div>
                    )}
                </div>

                {/* Middle Lane (Projectiles/Intent) */}
                <div className="w-1/3 relative flex items-center justify-center">
                    {intent && !enemy.isStunned && (
                        <div className="flex items-center gap-1 text-red-400 animate-pulse">
                            <ChevronsRight size={24} className="rotate-180"/> 
                            <span className="font-bold text-xl">{intent.value}</span>
                            {intent.type === 'ATTACK' && <Crosshair size={16}/>}
                            {intent.type === 'SHIELD' && <Shield size={16}/>}
                        </div>
                    )}
                    {enemy.isStunned && ePart && (
                         <div className="text-yellow-500 font-bold text-sm">STUNNED</div>
                    )}
                </div>

                {/* Enemy Side */}
                <div className="w-1/3 pl-2 border-l border-dashed border-white/20">
                    {ePart && (
                        <div className="w-full opacity-80">
                            <ShipPartView part={ePart} isActive={false} isEnemy={true} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---

    if (phase === 'TUTORIAL') {
        return (
            <div className="w-full h-full bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-mono">
                <Send size={64} className="text-cyan-400 mb-4 animate-bounce"/>
                <h1 className="text-4xl font-bold mb-4">紙飛行機バトル</h1>
                <div className="max-w-md text-sm text-gray-300 space-y-2 mb-8 bg-slate-800 p-4 rounded border border-slate-600">
                    <p>・エネルギーカードをパーツに装填して攻撃！</p>
                    <p>・同じ行の敵パーツと威力を競います。</p>
                    <p>・勝てば差分がダメージに。負ければ被弾。</p>
                    <p>・燃料を使って上下に回避しよう。</p>
                    <p>・敵の耐久を削りきるとスタンします。</p>
                </div>
                <button onClick={() => initBattle(1)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow-lg animate-pulse flex items-center">
                    <Play className="mr-2"/> 出撃
                </button>
                <button onClick={onBack} className="mt-4 text-gray-500 hover:text-white underline text-xs">戻る</button>
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
            <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                <div className="absolute inset-0 flex flex-col justify-center py-4">
                    {[0,1,2,3,4].map(row => renderGridRow(row))}
                </div>

                {/* Enemy Status Float */}
                <div className="absolute top-2 right-2 bg-red-900/50 p-2 rounded border border-red-500/50 text-right">
                    <div className="text-xs text-red-200">{enemy.isStunned ? "STUNNED" : "ENEMY"}</div>
                    <div className="text-lg font-bold">{enemy.hp} HP</div>
                    <div className="text-xs flex justify-end items-center gap-1 text-blue-300">
                        <Shield size={12}/> Durability: {enemy.durability}
                    </div>
                </div>

                {/* Logs */}
                <div className="absolute bottom-2 right-2 w-48 pointer-events-none opacity-70">
                    {logs.map((l, i) => <div key={i} className="text-[10px] text-right bg-black/50 mb-0.5 px-1 rounded">{l}</div>)}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="h-40 md:h-48 bg-[#0a0a10] border-t border-cyan-900 p-2 flex gap-2 shrink-0 z-20">
                {/* Movement Controls */}
                <div className="flex flex-col gap-2 justify-center w-16 md:w-20 shrink-0">
                    <button onClick={() => handleMove(-1)} className="flex-1 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:bg-cyan-900 flex items-center justify-center text-cyan-400 shadow-inner">
                        ▲
                    </button>
                    <div className="text-center text-[10px] text-gray-500">MOVE</div>
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
                    className="w-20 md:w-24 bg-red-900 hover:bg-red-800 border-2 border-red-600 rounded-lg flex flex-col items-center justify-center text-red-100 font-bold shadow-lg active:translate-y-1 transition-all"
                >
                    <RefreshCw size={24} className={animating ? "animate-spin" : ""}/>
                    <span className="text-xs mt-1">ENGAGE</span>
                </button>
            </div>

            {/* Overlays */}
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

            {(phase === 'VICTORY' || phase === 'GAME_OVER' || phase === 'REWARD') && (
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
                        {phase === 'REWARD' && (
                            <>
                                <Check size={64} className="text-green-500 mx-auto mb-4"/>
                                <h2 className="text-2xl font-bold text-white mb-2">BATTLE WON</h2>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={handleReward} className="bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded font-bold text-black flex items-center">
                                        <Battery className="mr-2"/> 修理 & 補給
                                    </button>
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
