
import React, { useState, useEffect } from 'react';
import { Player, Card as ICard, CardType, TargetType, LanguageMode, VSRecord } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { CHARACTERS } from '../constants';
import { Heart, Shield, Zap, Swords, RotateCcw, Trophy, Skull, User, ArrowRight, Home, AlertCircle, TrendingDown, Droplets, Sword, Hexagon, Radiation } from 'lucide-react';

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

    // --- BGM Control ---
    useEffect(() => {
        if (phase === 'BATTLE') {
            audioService.playBGM('battle');
        } else if (phase === 'RESULT') {
            audioService.stopBGM();
        }
    }, [phase]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 3)]);

    const applyDebuff = (target: Player, powerId: string, amount: number): Player => {
        const nextPowers = { ...target.powers };
        if (nextPowers['ARTIFACT'] && nextPowers['ARTIFACT'] > 0) {
            nextPowers['ARTIFACT']--;
            addLog("キラキラがデバフを防いだ！");
            return { ...target, powers: nextPowers };
        }
        nextPowers[powerId] = (nextPowers[powerId] || 0) + amount;
        return { ...target, powers: nextPowers };
    };

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

        // --- 先行1ターン目の制約 (より厳密にチェック) ---
        const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
        if (owner === 1 && turnCount === 1 && isAttack) {
            audioService.playSound('wrong');
            addLog("先行1ターン目はアタック不可！");
            return;
        }

        const current = owner === 1 ? p1State : p2State;
        const target = owner === 1 ? p2State : p1State;

        if (current.currentEnergy < card.cost) {
            audioService.playSound('wrong');
            return;
        }

        setIsAnimating(true);
        audioService.playSound(isAttack ? 'attack' : 'block');

        let nextCurrent = { ...current, powers: { ...current.powers } };
        let nextTarget = { ...target, powers: { ...target.powers } };

        nextCurrent.currentEnergy -= card.cost;
        nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== card.id);
        nextCurrent.discardPile.push(card);

        // --- ダメージ計算ロジック ---
        if (card.damage !== undefined || card.damageBasedOnBlock) {
            let baseDmg = card.damage || 0;
            if (card.damageBasedOnBlock) baseDmg += nextCurrent.block;

            // 筋力（ムキムキ）
            baseDmg += (nextCurrent.strength || 0);
            if (nextCurrent.powers['STRENGTH']) baseDmg += nextCurrent.powers['STRENGTH'];

            let finalDmg = baseDmg;

            // 弱体（へろへろ）: 与ダメージ 25% 減
            if (nextCurrent.powers['WEAK'] && nextCurrent.powers['WEAK'] > 0) {
                finalDmg = Math.floor(finalDmg * 0.75);
            }

            // 脆弱（びくびく）: 被ダメージ 50% 増
            if (nextTarget.powers['VULNERABLE'] && nextTarget.powers['VULNERABLE'] > 0) {
                finalDmg = Math.floor(finalDmg * 1.5);
            }

            // ブロック処理
            const damageToReflect = finalDmg; // 反射用
            if (nextTarget.block >= finalDmg) {
                nextTarget.block -= finalDmg;
                finalDmg = 0;
            } else {
                finalDmg -= nextTarget.block;
                nextTarget.block = 0;
                nextTarget.currentHp = Math.max(0, nextTarget.currentHp - finalDmg);
            }
            addLog(`${owner === 1 ? 'P1' : 'P2'}が${card.name}で${finalDmg}ダメ！`);

            // トゲトゲ反射
            if (damageToReflect > 0 && nextTarget.powers['THORNS'] && nextTarget.powers['THORNS'] > 0) {
                const reflect = nextTarget.powers['THORNS'];
                nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - reflect);
                addLog(`トゲトゲで${reflect}反射ダメージ！`);
            }
        }

        // ブロック獲得
        if (card.block) {
            let blk = card.block;
            if (nextCurrent.powers['DEXTERITY']) blk += nextCurrent.powers['DEXTERITY'];
            nextCurrent.block += blk;
        }

        // バフ・デバフ付与
        if (card.strength) nextCurrent.strength += card.strength;
        if (card.weak) nextTarget = applyDebuff(nextTarget, 'WEAK', card.weak);
        if (card.vulnerable) nextTarget = applyDebuff(nextTarget, 'VULNERABLE', card.vulnerable);
        if (card.poison) nextTarget = applyDebuff(nextTarget, 'POISON', card.poison);
        
        if (card.applyPower) {
            const pid = card.applyPower.id;
            const amt = card.applyPower.amount;
            // デバフIDのリスト
            const debuffs = ['WEAK', 'VULNERABLE', 'POISON', 'FRAIL', 'CONFUSED'];
            if (debuffs.includes(pid)) {
                nextTarget = applyDebuff(nextTarget, pid, amt);
            } else {
                nextCurrent.powers[pid] = (nextCurrent.powers[pid] || 0) + amt;
            }
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

        if (nextTarget.currentHp <= 0 || nextCurrent.currentHp <= 0) {
            if (nextTarget.currentHp <= 0) finishMatch(owner);
            else finishMatch(owner === 1 ? 2 : 1);
        }
    };

    const handleEndTurn = (owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating || phase !== 'BATTLE') return;
        
        const current = owner === 1 ? p1State : p2State;
        const nextOwner = owner === 1 ? 2 : 1;
        const nextToAct = nextOwner === 1 ? p1State : p2State;

        let updatedCurrent = { ...current, powers: { ...current.powers } };
        
        // 毒ダメージ処理
        if (updatedCurrent.powers['POISON'] && updatedCurrent.powers['POISON'] > 0) {
            const poisonDmg = updatedCurrent.powers['POISON'];
            updatedCurrent.currentHp = Math.max(0, updatedCurrent.currentHp - poisonDmg);
            updatedCurrent.powers['POISON']--;
            addLog(`${owner === 1 ? 'P1' : 'P2'}は毒で${poisonDmg}ダメージ！`);
        }

        // デバフ減少
        if (updatedCurrent.powers['WEAK']) updatedCurrent.powers['WEAK']--;
        if (updatedCurrent.powers['VULNERABLE']) updatedCurrent.powers['VULNERABLE']--;
        if (updatedCurrent.powers['FRAIL']) updatedCurrent.powers['FRAIL']--;

        if (owner === 1) setP1State(updatedCurrent); else setP2State(updatedCurrent);

        if (updatedCurrent.currentHp <= 0) {
            finishMatch(nextOwner);
            return;
        }

        if (nextOwner === 1) setTurnCount(prev => prev + 1);

        const processed = { ...nextToAct };
        processed.block = 0; 
        processed.currentEnergy = processed.maxEnergy;
        
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

    const renderPowers = (powers: Record<string, number>, strength: number) => {
        const badges = [];
        
        // 筋力 (ムキムキ)
        const totalStr = strength + (powers['STRENGTH'] || 0);
        if (totalStr !== 0) {
            badges.push(
                <div key="str" className="flex items-center bg-red-900/60 border border-red-500 rounded px-1 gap-1 text-[10px]" title="ムキムキ: 攻撃ダメージ増加">
                    <Sword size={10} className="text-red-400"/>
                    <span className="font-bold text-red-100">{totalStr}</span>
                </div>
            );
        }
        
        // 敏捷 (カチカチ)
        if (powers['DEXTERITY'] && powers['DEXTERITY'] !== 0) {
            badges.push(
                <div key="dex" className="flex items-center bg-blue-900/60 border border-blue-500 rounded px-1 gap-1 text-[10px]" title="カチカチ: ブロック獲得量増加">
                    <Shield size={10} className="text-blue-400"/>
                    <span className="font-bold text-blue-100">{powers['DEXTERITY']}</span>
                </div>
            );
        }

        // 弱体 (へろへろ)
        if (powers['WEAK'] > 0) {
            badges.push(
                <div key="weak" className="flex items-center bg-slate-700/60 border border-slate-400 rounded px-1 gap-1 text-[10px]" title="へろへろ: 与えるダメージ減少">
                    <TrendingDown size={10} className="text-slate-300"/>
                    <span className="font-bold text-slate-100">{powers['WEAK']}</span>
                </div>
            );
        }

        // 脆弱 (びくびく)
        if (powers['VULNERABLE'] > 0) {
            badges.push(
                <div key="vul" className="flex items-center bg-pink-900/60 border border-pink-500 rounded px-1 gap-1 text-[10px]" title="びくびく: 受けるダメージ増加">
                    <AlertCircle size={10} className="text-pink-300"/>
                    <span className="font-bold text-pink-100">{powers['VULNERABLE']}</span>
                </div>
            );
        }

        // 毒 (ドクドク)
        if (powers['POISON'] > 0) {
            badges.push(
                <div key="psn" className="flex items-center bg-green-900/60 border border-green-500 rounded px-1 gap-1 text-[10px]" title="ドクドク: ターン終了時にダメージ">
                    <Droplets size={10} className="text-green-300"/>
                    <span className="font-bold text-green-100">{powers['POISON']}</span>
                </div>
            );
        }

        // アーティファクト (キラキラ)
        if (powers['ARTIFACT'] > 0) {
            badges.push(
                <div key="art" className="flex items-center bg-yellow-900/60 border border-yellow-500 rounded px-1 gap-1 text-[10px]" title="キラキラ: デバフを無効化">
                    <Hexagon size={10} className="text-yellow-300"/>
                    <span className="font-bold text-yellow-100">{powers['ARTIFACT']}</span>
                </div>
            );
        }

        // トゲトゲ
        if (powers['THORNS'] > 0) {
            badges.push(
                <div key="thorns" className="flex items-center bg-orange-900/60 border border-orange-500 rounded px-1 gap-1 text-[10px]" title="トゲトゲ: 攻撃を受けた時に反撃">
                    <Radiation size={10} className="text-orange-400"/>
                    <span className="font-bold text-orange-100">{powers['THORNS']}</span>
                </div>
            );
        }

        return badges;
    };

    if (phase === 'NAMING') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-600 p-8 rounded-3xl w-full max-sm shadow-2xl text-center animate-in zoom-in duration-300">
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
            <div className={`flex-1 border-b-2 border-indigo-500/30 relative transform rotate-180 transition-colors duration-300 ${turnOwner === 2 ? 'bg-red-600/10' : 'bg-black/20'}`}>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-red-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p2State.currentHp}/{p2State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p2State.block}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
                                {renderPowers(p2State.powers, p2State.strength)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-red-500 font-bold">{opponentName.toUpperCase() || 'PLAYER 2'}</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1 mt-1">
                                <Zap size={14} fill="currentColor"/> {p2State.currentEnergy}/{p2State.maxEnergy}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 h-44 overflow-x-auto pb-4 custom-scrollbar">
                        {p2State.hand.map(card => (
                            <div key={card.id} className="scale-90 origin-bottom transform-gpu">
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
                        className={`w-full py-3 rounded-xl font-bold text-lg border-2 shadow-lg transition-all ${turnOwner === 2 ? 'bg-red-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        TURN END
                    </button>
                </div>
            </div>

            {/* Middle Bar */}
            <div className="h-16 bg-black flex items-center justify-between border-y-2 border-indigo-600 px-6 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none"></div>
                <div className="text-xs text-indigo-300 font-black italic tracking-widest z-10">TURN {turnCount}</div>
                <div className="text-sm text-white font-bold truncate max-w-[60%] text-center z-10 px-4 bg-indigo-900/40 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                    {logs[0]}
                </div>
                <div className="text-xs text-indigo-400 font-black z-10">VS</div>
            </div>

            {/* Player 1 Area (Bottom) */}
            <div className={`flex-1 relative transition-colors duration-300 ${turnOwner === 1 ? 'bg-blue-600/10' : 'bg-black/20'}`}>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-blue-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p1State.currentHp}/{p1State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p1State.block}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
                                {renderPowers(p1State.powers, p1State.strength)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-blue-400 font-bold uppercase">Player 1 (YOU)</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1 mt-1">
                                <Zap size={14} fill="currentColor"/> {p1State.currentEnergy}/{p1State.maxEnergy}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 h-44 overflow-x-auto pb-4 custom-scrollbar">
                        {p1State.hand.map(card => {
                            // 先行1ターン目のアタック禁止を視覚的に反映
                            const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
                            const isAttackRestricted = turnCount === 1 && isAttack;
                            
                            return (
                                <div key={card.id} className="scale-90 origin-bottom transform-gpu">
                                    <Card 
                                        card={card} 
                                        onClick={() => handlePlayCard(card, 1)} 
                                        disabled={turnOwner !== 1 || isAnimating || p1State.currentEnergy < card.cost || isAttackRestricted}
                                        languageMode={languageMode}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => handleEndTurn(1)}
                        disabled={turnOwner !== 1 || isAnimating}
                        className={`w-full py-3 rounded-xl font-bold text-lg border-2 shadow-lg transition-all ${turnOwner === 1 ? 'bg-blue-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        TURN END
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VSBattleScene;
