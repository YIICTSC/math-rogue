
import React from 'react';
import { Character } from '../types';
import { Lock, Heart, Coins, Gem, ArrowRight } from 'lucide-react';
import { RELIC_LIBRARY, CARDS_LIBRARY } from '../constants';

interface CharacterSelectionScreenProps {
  characters: Character[];
  unlockedCount: number;
  onSelect: (character: Character) => void;
}

const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({ characters, unlockedCount, onSelect }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative overflow-hidden">
      
      <div className="z-10 flex flex-col items-center justify-start h-full p-4 pt-8 overflow-y-auto custom-scrollbar">
        <div className="text-center mb-8 shrink-0">
            <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
             主人公選択
            </h2>
            <p className="text-sm text-gray-400">冒険に挑むキャラクターを選んでください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl pb-20">
            {characters.map((char, index) => {
                const isUnlocked = index < unlockedCount;
                const relic = RELIC_LIBRARY[char.startingRelicId];
                
                // Color mapping for Tailwind
                const colorMap: Record<string, string> = {
                    'red': 'border-red-600 bg-red-900/40 hover:bg-red-900/60',
                    'green': 'border-green-600 bg-green-900/40 hover:bg-green-900/60',
                    'blue': 'border-blue-600 bg-blue-900/40 hover:bg-blue-900/60',
                    'purple': 'border-purple-600 bg-purple-900/40 hover:bg-purple-900/60',
                    'gray': 'border-gray-600 bg-gray-800/40 hover:bg-gray-800/60',
                    'yellow': 'border-yellow-600 bg-yellow-900/40 hover:bg-yellow-900/60',
                    'orange': 'border-orange-600 bg-orange-900/40 hover:bg-orange-900/60',
                    'cyan': 'border-cyan-600 bg-cyan-900/40 hover:bg-cyan-900/60',
                    'pink': 'border-pink-600 bg-pink-900/40 hover:bg-pink-900/60',
                    'lime': 'border-lime-600 bg-lime-900/40 hover:bg-lime-900/60',
                    'amber': 'border-amber-600 bg-amber-900/40 hover:bg-amber-900/60',
                };
                
                const baseClass = `relative border-4 rounded-xl p-4 transition-all duration-300 flex flex-col items-center ${isUnlocked ? 'cursor-pointer hover:-translate-y-2 shadow-lg' : 'opacity-60 cursor-not-allowed grayscale'}`;
                const colorClass = isUnlocked ? (colorMap[char.color] || 'border-gray-600') : 'border-gray-700 bg-gray-900';

                return (
                    <div 
                        key={char.id} 
                        className={`${baseClass} ${colorClass}`}
                        onClick={() => isUnlocked && onSelect(char)}
                    >
                        {!isUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 rounded-lg">
                                <Lock size={48} className="text-gray-400 mb-2" />
                                <span className="text-gray-400 font-bold">LOCKED</span>
                                <span className="text-xs text-gray-500 mt-1">クリア回数: {index}回で解放</span>
                            </div>
                        )}

                        <div className="w-24 h-24 mb-4 relative drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                             <img 
                                src={char.imageData} 
                                alt={char.name} 
                                className="w-full h-full pixel-art" 
                                style={{ imageRendering: 'pixelated' }}
                             />
                        </div>

                        <div className="w-full flex justify-between items-start mb-4 border-b border-white/20 pb-2">
                            <h3 className="text-xl font-bold text-white truncate mr-2">{char.name}</h3>
                            <div className="flex gap-2 text-xs shrink-0">
                                <span className="flex items-center text-red-300"><Heart size={12} className="mr-1"/> {char.maxHp}</span>
                                <span className="flex items-center text-yellow-300"><Coins size={12} className="mr-1"/> {char.gold}</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-300 mb-4 text-center h-12 leading-relaxed flex items-center justify-center">
                            {char.description}
                        </p>

                        {/* Starting Relic */}
                        <div className="w-full bg-black/40 rounded p-2 mb-4 flex items-center">
                            <div className="w-10 h-10 bg-gray-800 rounded-full border-2 border-gray-500 flex items-center justify-center mr-3 shrink-0">
                                <Gem size={20} className="text-yellow-200" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="text-[10px] text-gray-400">初期レリック</div>
                                <div className="font-bold text-sm text-yellow-100 truncate">{relic ? relic.name : '???'}</div>
                            </div>
                        </div>

                        {/* Deck Preview (Compact) */}
                        <div className="w-full bg-black/40 rounded p-2 mb-4">
                            <div className="text-[10px] text-gray-400 mb-1">得意なカード</div>
                            <div className="text-xs text-white leading-relaxed truncate">
                                {Array.from(new Set(char.deckTemplate)).filter(id => !['STRIKE','DEFEND'].includes(id)).map(cardId => {
                                    const card = CARDS_LIBRARY[cardId];
                                    return card ? card.name : '';
                                }).join(', ') || '基本カードのみ'}
                            </div>
                        </div>

                        {isUnlocked && (
                            <div className="mt-auto w-full bg-white/10 hover:bg-white/20 text-center py-2 rounded font-bold text-white flex items-center justify-center">
                                選択 <ArrowRight size={16} className="ml-2" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectionScreen;
