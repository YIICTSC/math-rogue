
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sword, Shield, Zap, Clock, RotateCcw, Skull } from 'lucide-react';
import { audioService } from '../services/audioService';
import PixelSprite from './PixelSprite';

interface KochoShowdownProps {
    onBack: () => void;
}

type CardType = 'ATTACK' | 'DEFEND' | 'BUFF' | 'SPECIAL';

interface KochoCard {
    id: string;
    name: string;
    type: CardType;
    description: string;
    damage: number;
    block: number;
    cooldown: number;
    currentCooldown: number;
    color: string;
    icon: React.ReactNode;
}

interface GameState {
    playerHp: number;
    playerMaxHp: number;
    playerBlock: number;
    enemyHp: number;
    enemyMaxHp: number;
    enemyBlock: number;
    enemyCharge: number; // For special attack
    turn: number;
    hand: KochoCard[];
    phase: 'PLAYER_TURN' | 'ENEMY_TURN' | 'GAME_OVER' | 'VICTORY';
    logs: string[];
}

const CARDS_DB: KochoCard[] = [
    { id: 'c1', name: '竹刀', type: 'ATTACK', description: '基本攻撃', damage: 8, block: 0, cooldown: 0, currentCooldown: 0, color: 'bg-red-500', icon: <Sword size={24}/> },
    { id: 'c2', name: '没収', type: 'ATTACK', description: '強力な一撃', damage: 15, block: 0, cooldown: 2, currentCooldown: 0, color: 'bg-red-700', icon: <Skull size={24}/> },
    { id: 'c3', name: '校則', type: 'DEFENSE', description: '防御を固める', damage: 0, block: 10, cooldown: 0, currentCooldown: 0, color: 'bg-blue-500', icon: <Shield size={24}/> },
    { id: 'c4', name: '鉄壁', type: 'DEFENSE', description: '完全防御', damage: 0, block: 25, cooldown: 3, currentCooldown: 0, color: 'bg-blue-700', icon: <Shield size={24}/> },
    { id: 'c5', name: '朝礼', type: 'BUFF', description: 'HPを回復', damage: 0, block: 0, cooldown: 4, currentCooldown: 0, color: 'bg-green-500', icon: <Zap size={24}/> },
];

const INITIAL_STATE: GameState = {
    playerHp: 100,
    playerMaxHp: 100,
    playerBlock: 0,
    enemyHp: 300,
    enemyMaxHp: 300,
    enemyBlock: 0,
    enemyCharge: 0,
    turn: 1,
    hand: CARDS_DB.map(c => ({...c})), // Deep copy cards
    phase: 'PLAYER_TURN',
    logs: ['校長先生が現れた！', '「君の退学処分を取り消してほしければ、私を倒してみたまえ！」']
};

const KochoShowdown: React.FC<KochoShowdownProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        audioService.playBGM('dungeon_boss');
        return () => audioService.stopBGM();
    }, []);

    const addLog = (msg: string) => {
        setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 5) }));
    };

    const handleQueueCard = async (card: KochoCard, idx: number) => {
        if (gameState.phase !== 'PLAYER_TURN' || animating || card.currentCooldown > 0) {
            if (card.currentCooldown > 0) audioService.playSound('wrong');
            return;
        }

        setSelectedCardIdx(idx);
        setAnimating(true);
        audioService.playSound('select');

        // Player Action
        let damage = card.damage;
        let block = card.block;
        let heal = 0;
        if (card.name === '朝礼') heal = 20;

        addLog(`あなたのターン: ${card.name}！`);
        
        // Visual delay
        await new Promise(r => setTimeout(r, 500));
        audioService.playSound(damage > 0 ? 'attack' : (block > 0 ? 'block' : 'buff'));

        setGameState(prev => {
            let enemyBlock = prev.enemyBlock;
            let enemyHp = prev.enemyHp;
            
            if (damage > 0) {
                if (enemyBlock >= damage) {
                    enemyBlock -= damage;
                    damage = 0;
                } else {
                    damage -= enemyBlock;
                    enemyBlock = 0;
                }
                enemyHp = Math.max(0, enemyHp - damage);
            }

            const newHand = prev.hand.map((c, i) => {
                if (i === idx) return { ...c, currentCooldown: c.cooldown + 1 }; // Set cooldown (+1 because it decrements next turn)
                return c;
            });

            return {
                ...prev,
                playerHp: Math.min(prev.playerMaxHp, prev.playerHp + heal),
                playerBlock: prev.playerBlock + block,
                enemyHp,
                enemyBlock,
                hand: newHand
            };
        });

        if (damage > 0) addLog(`${damage}ダメージを与えた！`);
        if (block > 0) addLog(`ブロック${block}を得た！`);
        if (heal > 0) addLog(`HPが${heal}回復した！`);

        await new Promise(r => setTimeout(r, 1000));

        setGameState(prev => {
             if (prev.enemyHp <= 0) {
                 audioService.playSound('win');
                 return { ...prev, phase: 'VICTORY' };
             }
             return { ...prev, phase: 'ENEMY_TURN' };
        });
        
        setSelectedCardIdx(null);
        setAnimating(false);
    };

    useEffect(() => {
        if (gameState.phase === 'VICTORY') {
            addLog("校長先生「見事だ...退学は取り消そう。」");
        }
        if (gameState.phase === 'ENEMY_TURN' && !animating) {
            const timer = setTimeout(processEnemyTurn, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState.phase, animating]);

    const processEnemyTurn = async () => {
        setAnimating(true);
        
        // Enemy Logic
        let action = 'ATTACK';
        let val = 15;
        
        if (gameState.enemyCharge >= 2) {
            action = 'SPECIAL';
            val = 40;
        } else if (gameState.turn % 3 === 2) {
            action = 'CHARGE';
            val = 0;
        } else {
            action = Math.random() < 0.7 ? 'ATTACK' : 'BLOCK';
            if (action === 'BLOCK') val = 15;
        }

        if (action === 'SPECIAL') {
            addLog("校長先生の「全校集会」攻撃！");
            await new Promise(r => setTimeout(r, 800));
            audioService.playSound('lose');
        } else if (action === 'CHARGE') {
            addLog("校長先生はマイクの調子を確認している...(チャージ)");
            await new Promise(r => setTimeout(r, 800));
            audioService.playSound('buff');
        } else if (action === 'BLOCK') {
            addLog("校長先生は生徒手帳で防御した。");
            await new Promise(r => setTimeout(r, 800));
            audioService.playSound('block');
        } else {
            addLog("校長先生の説教攻撃！");
            await new Promise(r => setTimeout(r, 800));
            audioService.playSound('attack');
        }

        setGameState(prev => {
            let pBlock = prev.playerBlock;
            let pHp = prev.playerHp;
            let eBlock = prev.enemyBlock;
            let charge = prev.enemyCharge;

            if (action === 'ATTACK' || action === 'SPECIAL') {
                if (action === 'SPECIAL') charge = 0;
                
                if (pBlock >= val) {
                    pBlock -= val;
                    val = 0;
                } else {
                    val -= pBlock;
                    pBlock = 0;
                }
                pHp = Math.max(0, pHp - val);
            } else if (action === 'BLOCK') {
                eBlock += val;
            } else if (action === 'CHARGE') {
                charge++;
            }

            // Cooldown Reduction
            const nextHand = prev.hand.map(c => ({
                ...c,
                currentCooldown: Math.max(0, c.currentCooldown - 1)
            }));

            return {
                ...prev,
                playerHp: pHp,
                playerBlock: 0,
                enemyBlock: eBlock,
                enemyCharge: charge,
                turn: prev.turn + 1,
                hand: nextHand,
                phase: pHp <= 0 ? 'GAME_OVER' : 'PLAYER_TURN'
            };
        });

        setAnimating(false);
    };

    // Reset Enemy Block at start of Player Turn
    useEffect(() => {
        if (gameState.phase === 'PLAYER_TURN') {
             setGameState(prev => ({ ...prev, enemyBlock: 0 }));
        }
    }, [gameState.turn]);


    return (
        <div className="flex flex-col h-full w-full bg-[#1a1a2e] text-white p-4 relative font-sans">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                <div className="font-bold text-xl flex items-center"><Sword className="mr-2 text-red-400"/> 校長対決 (Turn {gameState.turn})</div>
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center bg-slate-800 px-3 py-1 rounded"><ArrowLeft size={16} className="mr-1"/> 逃げる</button>
            </div>

            {/* Battle Area */}
            <div className="flex-grow flex flex-col justify-center items-center gap-8 relative">
                
                {/* Enemy */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className={`w-32 h-32 ${animating && gameState.phase === 'PLAYER_TURN' ? 'animate-shake' : ''}`}>
                            <PixelSprite seed="BOSS" name="BOSS|#FFD700" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                        </div>
                        {gameState.enemyBlock > 0 && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white shadow-lg animate-bounce">
                                {gameState.enemyBlock}
                            </div>
                        )}
                        {gameState.enemyCharge > 0 && (
                            <div className="absolute top-0 left-0 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-yellow-400 shadow-lg animate-pulse">
                                !
                            </div>
                        )}
                    </div>
                    <div className="w-48 bg-slate-800 border-2 border-slate-600 rounded-full h-4 mt-2 overflow-hidden relative">
                        <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(gameState.enemyHp / gameState.enemyMaxHp) * 100}%` }}></div>
                        <span className="absolute inset-0 text-[10px] flex items-center justify-center font-bold drop-shadow-md">{gameState.enemyHp}/{gameState.enemyMaxHp}</span>
                    </div>
                    <div className="text-yellow-200 font-bold mt-1">校長先生</div>
                </div>

                {/* VS / Log */}
                <div className="w-full max-w-md h-24 bg-black/50 rounded border border-slate-600 p-2 overflow-y-auto flex flex-col-reverse text-xs text-gray-300 font-mono custom-scrollbar">
                    {gameState.logs.map((log, i) => (
                        <div key={i} className="border-b border-white/10 pb-0.5 mb-0.5">{log}</div>
                    ))}
                </div>

                {/* Player */}
                <div className="flex flex-col items-center w-full">
                    <div className="flex justify-between items-end w-full max-w-md px-4 mb-2">
                        <div className="flex items-center">
                            <div className={`w-16 h-16 mr-4 ${animating && gameState.phase === 'ENEMY_TURN' ? 'animate-shake' : ''}`}>
                                <PixelSprite seed="HERO" name="HERO_BACK|赤" className="w-full h-full" />
                            </div>
                            <div>
                                <div className="text-blue-200 font-bold">わんぱく小学生</div>
                                <div className="w-32 bg-slate-800 border-2 border-slate-600 rounded-full h-3 mt-1 overflow-hidden relative">
                                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(gameState.playerHp / gameState.playerMaxHp) * 100}%` }}></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">HP {gameState.playerHp}/{gameState.playerMaxHp}</div>
                            </div>
                        </div>
                        {gameState.playerBlock > 0 && (
                            <div className="flex flex-col items-center text-blue-400">
                                <Shield size={24} />
                                <span className="font-bold">{gameState.playerBlock}</span>
                            </div>
                        )}
                    </div>

                    {/* Hand */}
                    <div className="w-full max-w-md bg-slate-900/80 p-2 rounded-xl border border-slate-700 overflow-x-auto">
                        <div className="flex gap-2 min-w-max pb-2 px-1">
                            {gameState.hand.map((card, i) => (
                                <div 
                                    key={card.id} 
                                    className={`w-20 h-28 md:w-24 md:h-32 bg-slate-800 border-2 rounded-lg flex flex-col justify-between p-1 md:p-2 cursor-pointer transition-transform relative shadow-lg shrink-0 ${selectedCardIdx === i ? 'border-yellow-400 scale-105' : 'border-slate-600'} ${card.currentCooldown > 0 || gameState.phase !== 'PLAYER_TURN' ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-2 hover:border-white'}`}
                                    onClick={() => handleQueueCard(card, i)}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1 ${card.color} rounded-t-sm`}></div>
                                    <div className="mt-1 text-[9px] md:text-xs font-bold text-center leading-tight truncate text-white">{card.name}</div>
                                    <div className="flex justify-center my-0.5 text-white scale-75 md:scale-100">{card.icon}</div>
                                    <div className="text-[8px] md:text-[9px] text-gray-400 text-center leading-tight h-6 overflow-hidden">{card.description}</div>
                                    
                                    <div className="flex justify-between items-center text-[8px] md:text-[10px] text-gray-500 mt-auto font-mono w-full px-0.5 border-t border-slate-700 pt-1">
                                        <span className={card.currentCooldown > 0 ? "text-red-400 font-bold" : ""}>CD:{card.cooldown}</span>
                                        {card.damage > 0 ? (
                                            <span className="text-red-400 font-bold flex items-center">
                                                {card.damage}
                                            </span>
                                        ) : (
                                            <span className="text-[7px] md:text-[8px]">{card.type}</span>
                                        )}
                                    </div>
                                    
                                    {/* Cooldown Overlay */}
                                    {card.currentCooldown > 0 && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10 backdrop-blur-[1px]">
                                            <Clock size={20} className="text-gray-400 mb-1"/>
                                            <span className="text-xl font-bold text-white">{card.currentCooldown}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            {gameState.phase === 'VICTORY' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-4xl font-bold text-yellow-400 mb-4">勝利！</h2>
                    <p className="text-gray-300 mb-8">校長先生に認められた！</p>
                    <button onClick={onBack} className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200">戻る</button>
                </div>
            )}
            
            {gameState.phase === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                    <div className="text-6xl mb-4">💀</div>
                    <h2 className="text-4xl font-bold text-white mb-4">敗北...</h2>
                    <p className="text-red-200 mb-8">退学処分となった。</p>
                    <button onClick={() => setGameState(INITIAL_STATE)} className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 flex items-center"><RotateCcw className="mr-2"/> 再挑戦</button>
                    <button onClick={onBack} className="mt-4 text-white underline">戻る</button>
                </div>
            )}
        </div>
    );
};

export default KochoShowdown;
