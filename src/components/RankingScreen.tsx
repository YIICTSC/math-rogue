
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ScrollText, Calendar, Skull, Trophy } from 'lucide-react';
import { RankingEntry } from '../types';
import { storageService } from '../services/storageService';

interface RankingScreenProps {
  onBack: () => void;
}

const RankingScreen: React.FC<RankingScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<RankingEntry[]>([]);

  useEffect(() => {
      setData(storageService.getLocalScores());
  }, []);

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="z-10 bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center">
                <ScrollText size={24} className="text-gray-400 mr-2" />
                <h2 className="text-xl font-bold text-gray-100">冒険の記録</h2>
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
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ScrollText size={48} className="mb-4 opacity-50" />
                    <p>まだ冒険の記録はありません。</p>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-3">
                    {data.map((entry, idx) => (
                        <div 
                            key={idx} // Use index as fallback key if id is missing or duplicate in older saves
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
