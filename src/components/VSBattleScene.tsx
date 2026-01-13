
import React, { useState, useEffect } from 'react';
import { Player, Card as ICard, CardType, TargetType, LanguageMode } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { Heart, Shield, Zap, Swords, RotateCcw, Trophy, Skull } from 'lucide-react';

interface VSBattleSceneProps {
    player1: Player; // 自分
    player2: Player; // 相手
    onFinish: (winner: 1 | 2) => void;
    languageMode: LanguageMode;
}

const VSBattleScene: React.FC<VSBattleSceneProps> = ({ player1, player2, onFinish, languageMode }) => {
    const [p1State, setP1State] = useState<Player>(() => initPlayer(player1));
    const [p2State, setP2State] = useState<Player>(() => initPlayer(player2));
    const [turnOwner, setTurnOwner] = useState<1 | 2>(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [logs, setLogs] = useState<string[]>(["対戦開始！"]);

    function initPlayer(p: Player): Player {
        const deck = [...p.deck].sort(() => Math.random() - 0.5);
        const drawPile = [...deck];
        const hand = drawPile.splice(0, 5);
        return {
            ...p,
            currentEnergy: 3,
            maxEnergy: 3,
            block: 0,
            hand: hand,
            drawPile: drawPile,
            discardPile: [],
            powers: { ...p.powers }
        };
    }

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 3)]);

    const handlePlayCard = (card: ICard, owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating) return;
        const current = owner === 1 ? p1State : p2State;
        const target = owner === 1 ? p2State : p1State;

        if (current.currentEnergy < card.cost) {
            audioService.playSound('wrong');
            return;
        }

        setIsAnimating(true);
        audioService.playSound(card.type === CardType.ATTACK ? 'attack' : 'block');

        // カード効果の解決（簡易版）
        let nextCurrent = { ...current };
        let nextTarget = { ...target };

        nextCurrent.currentEnergy -= card.cost;
        nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== card.id);
        nextCurrent.discardPile.push(card);

        if (card.damage) {
            let dmg = card.damage + (nextCurrent.strength || 0);
            if (nextTarget.block >= dmg) {
                nextTarget.block -= dmg;
                dmg = 0;
            } else {
                dmg -= nextTarget.block;
                nextTarget.block = 0;
                nextTarget.currentHp = Math.max(0, nextTarget.currentHp - dmg);
            }
            addLog(`${owner === 1 ? 'P1' : 'P2'}が${card.name}で${dmg}ダメージ！`);
        }

        if (card.block) {
            nextCurrent.block += card.block;
            addLog(`${owner === 1 ? 'P1' : 'P2'}が${card.block}ブロック獲得！`);
        }

        if (card.draw) {
            for(let i=0; i<card.draw; i++) {
                if (nextCurrent.drawPile.length === 0) {
                    nextCurrent.drawPile = [...nextCurrent.discardPile].sort(() => Math.random() - 0.5);
                    nextCurrent.discardPile = [];
                }
                const drawn = nextCurrent.drawPile.pop();
                if (drawn) nextCurrent.hand.push(drawn);
            }
        }

        if (owner === 1) {
            setP1State(nextCurrent);
            setP2State(nextTarget);
        } else {
            setP2State(nextCurrent);
            setP1State(nextTarget);
        }

        setIsAnimating(false);

        // 勝利判定
        if (nextTarget.currentHp <= 0) {
            onFinish(owner);
        }
    };

    const handleEndTurn = (owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating) return;
        
        const nextOwner = owner === 1 ? 2 : 1;
        const nextToAct = nextOwner === 1 ? p1State : p2State;

        // 次のプレイヤーのターン開始処理
        const processed = { ...nextToAct };
        processed.block = 0; // ブロックリセット
        processed.currentEnergy = processed.maxEnergy;
        
        // ドロー（5枚になるまで引く）
        while(processed.hand.length < 5) {
            if (processed.drawPile.length === 0) {
                if (processed.discardPile.length === 0) break;
                processed.drawPile = [...processed.discardPile].sort(() => Math.random() - 0.5);
                processed.discardPile = [];
            }
            const drawn = processed.drawPile.pop();
            if (drawn) processed.hand.push(drawn);
            else break;
        }

        if (nextOwner === 1) setP1State(processed); else setP2State(processed);
        
        setTurnOwner(nextOwner);
        addLog(`${nextOwner === 1 ? 'P1' : 'P2'}のターン`);
        audioService.playSound('select');
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden font-mono">
            {/* Player 2 Area (Top, Rotated) */}
            <div className="flex-1 border-b-2 border-indigo-500/30 relative transform rotate-180 bg-red-900/10">
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    {/* Status */}
                    <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-red-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p2State.currentHp}/{p2State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p2State.block}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">PLAYER 2</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1">
                                <Zap size={14} fill="currentColor"/> {p2State.currentEnergy}/{p2State.maxEnergy}
                            </div>
                        </div>
                    </div>

                    {/* Hand P2 */}
                    <div className="flex justify-center gap-1 h-32 overflow-x-auto pb-2">
                        {p2State.hand.map(card => (
                            <div key={card.id} className="scale-75 origin-bottom">
                                <Card 
                                    card={card} 
                                    onClick={() => handlePlayCard(card, 2)} 
                                    disabled={turnOwner !== 2 || isAnimating || p2State.currentEnergy < card.cost}
                                    languageMode={languageMode}
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => handleEndTurn(2)}
                        disabled={turnOwner !== 2 || isAnimating}
                        className={`w-full py-2 rounded font-bold text-sm border-2 ${turnOwner === 2 ? 'bg-red-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        TURN END
                    </button>
                </div>
            </div>

            {/* Middle Bar: Logs */}
            <div className="h-12 bg-black flex items-center justify-center border-y-2 border-indigo-600 px-4 shrink-0">
                <div className="text-[10px] text-indigo-300 font-bold truncate">
                    {logs[0]}
                </div>
            </div>

            {/* Player 1 Area (Bottom) */}
            <div className="flex-1 relative bg-blue-900/10">
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-blue-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p1State.currentHp}/{p1State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p1State.block}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">PLAYER 1 (YOU)</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1">
                                <Zap size={14} fill="currentColor"/> {p1State.currentEnergy}/{p1State.maxEnergy}
                            </div>
                        </div>
                    </div>

                    {/* Hand P1 */}
                    <div className="flex justify-center gap-1 h-32 overflow-x-auto pb-2">
                        {p1State.hand.map(card => (
                            <div key={card.id} className="scale-75 origin-bottom">
                                <Card 
                                    card={card} 
                                    onClick={() => handlePlayCard(card, 1)} 
                                    disabled={turnOwner !== 1 || isAnimating || p1State.currentEnergy < card.cost}
                                    languageMode={languageMode}
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => handleEndTurn(1)}
                        disabled={turnOwner !== 1 || isAnimating}
                        className={`w-full py-2 rounded font-bold text-sm border-2 ${turnOwner === 1 ? 'bg-blue-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        TURN END
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VSBattleScene;
