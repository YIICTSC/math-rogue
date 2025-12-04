

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ScrollText, Calendar, Skull, Trophy, Club, Swords, Timer, Zap } from 'lucide-react';
import { RankingEntry, PokerScoreEntry, SurvivorScoreEntry } from '../types';
import { storageService } from '../services/storageService';

interface RankingScreenProps {
  onBack: () => void;
}

const RankingScreen: React.FC<RankingScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'ADVENTURE' | 'POKER' | 'SURVIVOR'>('ADVENTURE');
  const [adventureData, setAdventureData] = useState<RankingEntry[]>([]);
  const [pokerData, setPokerData] = useState<PokerScoreEntry[]>([]);
  const [survivorData, setSurvivorData] = useState<SurvivorScoreEntry[]>([]);

  useEffect(() => {
      setAdventureData(storageService.getLocalScores());
      setPokerData(storageService.getPokerScores());
      setSurvivorData(storageService.getSurvivorScores());
  }, []);

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="z-10 bg-black border-b-2 border-gray-600 p-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
            <div className="flex items-center">
                <ScrollText size={24} className="text-gray-400 mr-2" />
                <h2 className="text-xl font-bold text-gray-100">記録 (Records)</h2>
            </div>
            
            <div className="flex bg-gray-800 rounded p-1">
                <button 
                    onClick={() => setActiveTab('ADVENTURE')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors ${activeTab === 'ADVENTURE' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Swords className="mr-1 md:mr-2" size={16}/> Adv
                </button>
                <button 
                    onClick={() => setActiveTab('POKER')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors ${activeTab === 'POKER' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Club className="mr-1 md:mr-2" size={16}/> Poker
                </button>
                <button 
                    onClick={() => setActiveTab('SURVIVOR')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors ${activeTab === 'SURVIVOR' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Skull className="mr-1 md:mr-2" size={16}/> Survivor
                </button>
            </div>

            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} className="mr-2" /> 戻る
            </button>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'ADVENTURE' && (
                adventureData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <ScrollText size={48} className="mb-4 opacity-50" />
                        <p>まだ冒険の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {adventureData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className={`flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 shadow-lg transition-colors ${
                                    entry.victory 
                                    ? 'bg-yellow-900/10 border-yellow-500 hover:bg-yellow-900/20' 
                                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                }`}
                            >
                                {/* Left: Result Icon & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className={`p-2 rounded-full mr-3 ${entry.victory ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                        {entry.victory ? <Trophy size={20} /> : <Skull size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${entry.victory ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {entry.victory ? 'VICTORY' : 'DEFEATED'}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Character Info */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="text-lg font-bold text-white">
                                        {entry.characterName || '不明な冒険者'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        到達: Act {entry.act} - Floor {entry.floor}
                                    </div>
                                    {entry.challengeMode && <div className="text-[10px] text-red-400 font-bold border border-red-500 px-1 inline-block rounded mt-1">1A1D Mode</div>}
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'POKER' && (
                pokerData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Club size={48} className="mb-4 opacity-50" />
                        <p>ポーカーの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {pokerData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-purple-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors"
                            >
                                {/* Left: Ante & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-purple-500/20 text-purple-400">
                                        <Club size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-purple-300">
                                            ANTE {entry.ante} Reached
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Money */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="text-sm text-gray-400">最終所持金</div>
                                    <div className="text-lg font-bold text-yellow-400">
                                        ${entry.money.toLocaleString()}
                                    </div>
                                </div>

                                {/* Right: Best Hand Score */}
                                <div className="w-full md:w-48 text-right">
                                    <div className="text-xs text-gray-500">BEST HAND</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {entry.bestHandScore ? entry.bestHandScore.toLocaleString() : '-'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'SURVIVOR' && (
                survivorData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Skull size={48} className="mb-4 opacity-50" />
                        <p>サバイバーの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {survivorData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-red-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors"
                            >
                                {/* Left: Time & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-red-500/20 text-red-400">
                                        <Timer size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-red-300 font-mono text-xl">
                                            {formatTime(entry.timeSurvived)}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Level & Weapons */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-black px-2 py-0.5 rounded border border-gray-600 text-yellow-400 font-bold">LV {entry.levelReached}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                                        {entry.weapons && entry.weapons.length > 0 ? entry.weapons.map(w => (
                                            <span key={w} className="bg-gray-700 px-1 rounded text-[10px]">{w}</span>
                                        )) : 'No Weapons'}
                                    </div>
                                </div>

                                {/* Right: Icon */}
                                <div className="w-full md:w-32 text-right flex justify-end">
                                    <Zap size={24} className="text-gray-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
        
        {/* Footer */}
        <div className="p-2 text-center text-[10px] text-gray-600 bg-black border-t border-gray-800">
            最新の50件まで表示されます。
        </div>
    </div>
  );
};

export default RankingScreen;