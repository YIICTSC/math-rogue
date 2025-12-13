
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Wind, Trophy, Zap, Shield, Move, AlertTriangle, RefreshCw, Layers, Crosshair, Skull, Heart, Battery, ChevronsRight, ChevronsLeft, Info, Check, Play, X, Box, Grid } from 'lucide-react';
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
    type: 'CANNON' | 'ENGINE' | 'EMPTY' | 'MISSILE' | 'SHIELD';
    name: string;
    slots: EnergySlot[]; // Multiple slots per part
    multiplier: number; // Effect multiplier per energy
    basePower: number; // Flat bonus when activated
    hp: number; // Part HP (Visual mainly)
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

type GamePhase = 'TUTORIAL' | 'SETUP' | 'BATTLE' | 'REWARD' | 'VACATION' | 'GAME_OVER' | 'VICTORY';

// --- DATABASE ---

const createEmptyPart = (id: string): ShipPart => ({
    id, type: 'EMPTY', name: '空きスロット', slots: [], multiplier: 0, basePower: 0, hp: 0
});

const STARTING_PARTS_LAYOUT: ShipPart[] = [
    // Row 0
    { id: 'p0', type: 'CANNON', name: '連装キャノン', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1, basePower: 2, hp: 10 },
    { id: 'p1', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p2', type: 'ENGINE', name: '補助スラスター', slots: [{req:'BLUE', value:null}], multiplier: 1, basePower: 0, hp: 10 },
    // Row 1
    { id: 'p3', type: 'CANNON', name: '主砲', slots: [{req:'ORANGE', value:null}, {req:'ANY', value:null}], multiplier: 1.5, basePower: 5, hp: 10 },
    { id: 'p4', type: 'CANNON', name: '機関銃', slots: [{req:'ANY', value:null}], multiplier: 1, basePower: 1, hp: 10 },
    { id: 'p5', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    // Row 2
    { id: 'p6', type: 'CANNON', name: '連装キャノン', slots: [{req:'ANY', value:null}, {req:'ANY', value:null}], multiplier: 1, basePower: 2, hp: 10 },
    { id: 'p7', type: 'EMPTY', name: '空き', slots: [], multiplier: 0, basePower: 0, hp: 0 },
    { id: 'p8', type: 'ENGINE', name: '補助スラスター', slots: [{req:'BLUE', value:null}], multiplier: 1, basePower: 0, hp: 10 },
];

const ENEMY_DATA = [
    { name: "折り紙偵察機", hp: 30, durability: 4, parts: ['CANNON', 'EMPTY', 'CANNON'] }, // Simple 3-row mapping for enemy
    { name: "ノート爆撃機", hp: 45, durability: 5, parts: ['CANNON', 'CANNON', 'EMPTY'] },
    { name: "定規戦艦", hp: 70, durability: 6, parts: ['CANNON', 'CANNON', 'CANNON'] }, 
    { name: "コンパス要塞", hp: 100, durability: 10, parts: ['CANNON', 'MISSILE', 'CANNON'] }, 
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
            `}
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

const ShipPartView: React.FC<{ part: ShipPart, onClick?: () => void, isEnemy?: boolean, highlight?: boolean }> = ({ part, onClick, isEnemy, highlight }) => {
    let icon = <Box size={14}/>;
    let colorClass = 'bg-slate-800 border-slate-600';
    let textColor = 'text-slate-400';
    
    if (part.type === 'CANNON') { icon = <Crosshair size={14}/>; colorClass = 'bg-red-900/60 border-red-500/50'; textColor='text-red-200'; }
    if (part.type === 'ENGINE') { icon = <Move size={14}/>; colorClass = 'bg-emerald-900/60 border-emerald-500/50'; textColor='text-emerald-200'; }
    if (part.type === 'MISSILE') { icon = <Send size={14}/>; colorClass = 'bg-orange-900/60 border-orange-500/50'; textColor='text-orange-200'; }
    if (part.type === 'SHIELD') { icon = <Shield size={14}/>; colorClass = 'bg-blue-900/60 border-blue-500/50'; textColor='text-blue-200'; }
    
    if (part.type === 'EMPTY') {
        return (
            <div className="w-full h-full border border-dashed border-slate-700 bg-black/20 rounded flex items-center justify-center">
                <div className="w-1 h-1 bg-slate-700 rounded-full"/>
            </div>
        );
    }

    // Calculate total loaded value
    const loadedCount = part.slots.filter(s => s.value !== null).length;
    const isFull = loadedCount === part.slots.length && part.slots.length > 0;
    
    let totalPower = 0;
    if (isFull) {
        const energySum = part.slots.reduce((sum, s) => sum + (s.value || 0), 0);
        totalPower = Math.floor(part.basePower + energySum * part.multiplier);
    }

    return (
        <div 
            onClick={onClick}
            className={`
                relative w-full h-full border rounded flex flex-col justify-between p-1 transition-all overflow-hidden
                ${colorClass} ${highlight ? 'ring-2 ring-yellow-400 brightness-125' : ''}
                ${isFull ? 'brightness-110 shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]' : ''}
                cursor-pointer hover:bg-opacity-80
            `}
        >
            <div className="flex justify-between items-center">
                <div className={`${textColor}`}>{icon}</div>
                {isFull && <div className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{totalPower}</div>}
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
        parts: JSON.parse(JSON.stringify(STARTING_PARTS_LAYOUT))
    });

    const [enemy, setEnemy] = useState<ShipState>({
        yOffset: 1,
        hp: 20, maxHp: 20, fuel: 0, maxFuel: 0, durability: 3, maxDurability: 3, isStunned: false,
        parts: [] // Enemy parts are simplified (1 per row usually)
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
            parts: eParts
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
        if (!selectedCardId) return;
        const cardIndex = hand.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) return;

        const card = hand[cardIndex];
        const part = player.parts[partIndex];

        if (part.type === 'EMPTY') { addLog("そこには何もありません"); return; }
        
        // Find first empty compatible slot
        const slotIdx = part.slots.findIndex(s => s.value === null && (s.req === 'ANY' || s.req === card.color));
        
        if (slotIdx === -1) {
            if (part.slots.every(s => s.value !== null)) addLog("エネルギー充填完了しています");
            else addLog("色が合いません！");
            return;
        }

        // Load
        const newParts = [...player.parts];
        const newSlots = [...part.slots];
        newSlots[slotIdx] = { ...newSlots[slotIdx], value: card.value };
        newParts[partIndex] = { ...part, slots: newSlots };
        
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

        let enemyStunDmg = 0; 
        let tempEnemyHp = enemy.hp;
        let tempPlayerHp = player.hp;

        // Iterate Rows (0 to MAX_ROWS-1)
        for (let r = 0; r < MAX_ROWS; r++) {
            if (tempEnemyHp <= 0) break;

            // --- Player Power Calculation ---
            // A row on the field might correspond to Ship Row 0, 1, or 2.
            const pRelIdx = r - player.yOffset;
            let pPower = 0;
            let pShield = 0;
            
            if (pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT) {
                // Get all parts in this row (e.g. indices 0,1,2 for Row 0)
                const startIdx = pRelIdx * SHIP_WIDTH;
                const rowParts = player.parts.slice(startIdx, startIdx + SHIP_WIDTH);
                
                rowParts.forEach(p => {
                    const loadedCount = p.slots.filter(s => s.value !== null).length;
                    const isFull = loadedCount === p.slots.length && p.slots.length > 0;
                    
                    if (isFull) {
                        const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                        const output = Math.floor(p.basePower + energySum * p.multiplier);
                        
                        if (p.type === 'CANNON' || p.type === 'MISSILE') pPower += output;
                        if (p.type === 'SHIELD') pShield += output;
                        // Engine logic could go here (e.g. dodge chance or fuel restore)
                    }
                });
            }

            // --- Enemy Power Calculation ---
            // Simple mapping: Enemy Part Index matches relative row
            const eRelIdx = r - enemy.yOffset;
            const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === r);
            let ePower = 0;
            
            if (intent && intent.type === 'ATTACK' && !enemy.isStunned) {
                ePower = intent.value;
            }

            // --- Resolve Clash ---
            if (pPower > 0 || ePower > 0) {
                if (pPower > ePower) {
                    const diff = pPower - ePower;
                    tempEnemyHp = Math.max(0, tempEnemyHp - diff);
                    setEnemy(prev => ({...prev, hp: tempEnemyHp}));
                    enemyStunDmg++;
                    
                } else if (ePower > pPower) {
                    let diff = ePower - pPower;
                    // Apply Shield
                    const blocked = Math.min(diff, pShield);
                    diff -= blocked;
                    
                    if (diff > 0) {
                        tempPlayerHp = Math.max(0, tempPlayerHp - diff);
                        setPlayer(prev => ({...prev, hp: tempPlayerHp}));
                    }
                }
            }
            
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

        // Cleanup: Clear loaded values
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
                setPhase('REWARD');
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

    const handleReward = () => {
        // Simple reward for now
        if (Math.random() > 0.5) {
            setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + 10)}));
            addLog("修理キットでHP回復！");
        } else {
            setPlayer(p => ({...p, maxFuel: p.maxFuel + 1, fuel: p.maxFuel + 1}));
            addLog("燃料タンク拡張！");
        }
        setStage(s => s + 1);
        initBattle(stage + 1);
    };

    // --- RENDER HELPERS ---

    const renderGridRow = (rowIndex: number) => {
        // --- Player Parts in this relative row ---
        const pRelIdx = rowIndex - player.yOffset;
        const inShip = pRelIdx >= 0 && pRelIdx < SHIP_HEIGHT;
        
        // Indices of parts in this row: (pRelIdx * 3) to (pRelIdx * 3 + 2)
        const partsToRender = inShip ? player.parts.slice(pRelIdx * 3, pRelIdx * 3 + 3) : [];

        // Enemy Part (Simplified to 1 per row for enemy visual)
        const eRelIdx = rowIndex - enemy.yOffset;
        const ePart = (eRelIdx >= 0 && eRelIdx < SHIP_HEIGHT) ? enemy.parts[eRelIdx] : null;
        
        const intent = enemyIntents.find(i => (i.row + enemy.yOffset) === rowIndex);
        
        let prediction = null;
        // Simplified prediction: Sum up currently loaded power in this row vs enemy power
        let pPower = 0;
        partsToRender.forEach(p => {
             const loadedCount = p.slots.filter(s => s.value !== null).length;
             const isFull = loadedCount === p.slots.length && p.slots.length > 0;
             if (isFull && (p.type === 'CANNON' || p.type === 'MISSILE')) {
                 const energySum = p.slots.reduce((sum, s) => sum + (s.value || 0), 0);
                 pPower += Math.floor(p.basePower + energySum * p.multiplier);
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
                
                {/* Player Side (3 Slots) */}
                <div className="w-1/2 flex justify-end pr-2 border-r border-dashed border-white/20 relative">
                    {inShip ? (
                        <div className="flex gap-1 w-full justify-end">
                            {partsToRender.map((part, i) => (
                                <div key={part.id} className="w-1/3 max-w-[80px]">
                                    <ShipPartView 
                                        part={part} 
                                        onClick={() => handlePartClick((pRelIdx * 3) + i)} 
                                        highlight={!!selectedCardId}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full opacity-10 bg-grid-pattern"></div>
                    )}
                </div>

                {/* Middle Lane (Prediction) */}
                <div className="w-16 md:w-24 relative flex items-center justify-center shrink-0">
                    {prediction ? prediction : (
                        enemy.isStunned && ePart ? <div className="text-yellow-500 font-bold text-xs">STUNNED</div> : null
                    )}
                </div>

                {/* Enemy Side */}
                <div className="w-1/3 pl-2 border-l border-dashed border-white/20">
                    {ePart && (
                        <div className="w-full opacity-80">
                            <ShipPartView part={ePart} isEnemy={true} />
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
                <h1 className="text-4xl font-bold mb-4">紙飛行機バトル v2</h1>
                <div className="max-w-md text-sm text-gray-300 space-y-2 mb-8 bg-slate-800 p-4 rounded border border-slate-600">
                    <p>・機体は3x3のモジュールで構成されています。</p>
                    <p>・各行の合計出力で敵と競い合います。</p>
                    <p>・モジュールにはエネルギーカードを装填します。</p>
                    <p>・スロットの色に合ったカードしか入りません（白は任意）。</p>
                    <p>・全てのスロットを埋めるとモジュールが起動します！</p>
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
