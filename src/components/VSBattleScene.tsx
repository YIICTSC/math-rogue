
import React, { useState, useEffect } from 'react';
import { Player, Card as ICard, CardType, TargetType, LanguageMode, VSRecord } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { CHARACTERS } from '../constants';
import { Heart, Shield, Zap, Swords, RotateCcw, Trophy, Skull, User, ArrowRight, Home } from 'lucide-react';

interface VSBattleSceneProps {
    player1: Player; // 自分
    player2: Player; // 相手
    onFinish: (winner: 1 | 2) => void;
    languageMode: LanguageMode;
}

const VSBattleScene: React.FC<VSBattleSceneProps> = ({ player1, player2, onFinish, languageMode }) => {
    const [phase, setPhase] = useState<'NAMING' | 'BATTLE' | 'RESULT'>('NAMING');
    const [opponentName, setOpponentName] = useState("");
    const [p1State, setP1State] = useState<Player>(() => initPlayer(player1));
    const [p2State, setP2State] = useState<Player>(() => initPlayer(player2));
    const [turnOwner, setTurnOwner] = useState<1 | 2>(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [logs, setLogs] = useState<string[]>(["対戦開始！"]);
    const [turnCount, setTurnCount] = useState(1);
    const [winner, setWinner] = useState<1 | 2 | null>(null);

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

    const handleStartBattle = () => {
        if (!opponentName.trim()) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('select');
        setPhase('BATTLE');
    };

    const handlePlayCard = (card: ICard, owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating || phase !== 'BATTLE') return;
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
            finishMatch(owner);
        }
    };

    const handleEndTurn = (owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating || phase !== 'BATTLE') return;
        
        const nextOwner = owner === 1 ? 2 : 1;
        const nextToAct = nextOwner === 1 ? p1State : p2State;

        if (nextOwner === 1) setTurnCount(prev => prev + 1);

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

    const finishMatch = (matchWinner: 1 | 2) => {
        setWinner(matchWinner);
        setPhase('RESULT');
        audioService.playSound('win');

        // 記録の保存
        const p1Char = CHARACTERS.find(c => c.id === player1.id)?.name || "不明";
        const p2Char = CHARACTERS.find(c => c.id === player2.id)?.name || "不明";

        const record: VSRecord = {
            id: `vs-${Date.now()}`,
            date: Date.now(),
            opponentName: opponentName,
            playerCharName: p1Char,
            opponentCharName: p2Char,
            victory: matchWinner === 1,
            turns: turnCount
        };
        storageService.saveVSRecord(record);
    };

    if (phase === 'NAMING') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-600 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in duration-300">
                    <User size={64} className="text-indigo-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-2 italic tracking-tighter">BATTLE ENTRY</h2>
                    <p className="text-gray-400 text-xs mb-8">対戦相手の名前を入力してください</p>
                    
                    <input 
                        type="text" 
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        placeholder="相手の名前"
                        className="w-full bg-black border-2 border-indigo-900 rounded-xl px-4 py-3 text-center text-xl font-bold focus:border-indigo-400 outline-none transition-all mb-8 placeholder:text-gray-700"
                        autoFocus
                    />

                    <button 
                        onClick={handleStartBattle}
                        disabled={!opponentName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        READY <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'RESULT') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-500 p-8 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(79,70,229,0.4)] text-center animate-in zoom-in duration-300">
                    {winner === 1 ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                            <h2 className="text-5xl font-black text-yellow-400 italic mb-2 tracking-tighter">WINNER!</h2>
                        </>
                    ) : (
                        <>
                            <Skull size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
                            <h2 className="text-5xl font-black text-red-500 italic mb-2 tracking-tighter">DEFEATED</h2>
                        </>
                    )}
                    
                    <div className="bg-black/40 rounded-2xl p-6 border border-indigo-900/50 mb-8 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Opponent</p>
                                <p className="text-xl font-black text-indigo-100">{opponentName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Turns</p>
                                <p className="text-xl font-black text-indigo-400">{turnCount}</p>
                            </div>
                        </div>
                        <div className="border-t border-indigo-900/30 pt-4 text-xs text-gray-400 italic">
                            勝負の記録は図鑑の「記録」に保存されました。
                        </div>
                    </div>

                    <button 
                        onClick={() => onFinish(winner!)}
                        className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <Home size={20}/> タイトルへ戻る
                    </button>
                </div>
            </div>
        );
    }

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
                            <div className="text-xs text-red-500 font-bold">{opponentName.toUpperCase() || 'PLAYER 2'}</div>
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

            {/* Middle Bar: Logs & Turn Count */}
            <div className="h-14 bg-black flex items-center justify-between border-y-2 border-indigo-600 px-6 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none"></div>
                <div className="text-xs text-indigo-300 font-black italic tracking-widest z-10">TURN {turnCount}</div>
                <div className="text-[10px] text-white font-bold truncate max-w-[60%] text-center z-10 px-4">
                    {logs[0]}
                </div>
                <div className="text-xs text-indigo-400 font-black z-10">VS</div>
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
                            <div className="text-xs text-blue-400 font-bold">PLAYER 1 (YOU)</div>
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
