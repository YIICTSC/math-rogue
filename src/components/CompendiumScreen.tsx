
import React, { useMemo } from 'react';
import { CARDS_LIBRARY } from '../constants';
import { Card as ICard, CardType } from '../types';
import Card from './Card';
import { BookOpen, Lock, ArrowLeft } from 'lucide-react';

interface CompendiumScreenProps {
  unlockedCardNames: string[];
  onBack: () => void;
}

const CompendiumScreen: React.FC<CompendiumScreenProps> = ({ unlockedCardNames, onBack }) => {
  
  const allCards: ICard[] = useMemo(() => {
    return Object.values(CARDS_LIBRARY).map((template, idx) => ({
         ...template,
         id: `compendium-card-${idx}`
    })).sort((a, b) => {
        // Sort by Type then Cost then Name
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });
  }, []);

  const totalCards = allCards.length;
  const currentLibraryUnlockedCount = allCards.filter(c => unlockedCardNames.includes(c.name)).length;
  const percentage = Math.floor((currentLibraryUnlockedCount / totalCards) * 100);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-50 bg-amber-900 pointer-events-none"></div>

        {/* Header */}
        <div className="z-10 bg-black/80 border-b-4 border-amber-600 p-4 flex justify-between items-center shadow-xl">
            <div className="flex items-center">
                <BookOpen size={32} className="text-amber-500 mr-3" />
                <div>
                    <h2 className="text-2xl font-bold text-amber-100">カード図鑑</h2>
                    <p className="text-xs text-gray-400">収集率: {percentage}% ({currentLibraryUnlockedCount}/{totalCards})</p>
                </div>
            </div>
            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors cursor-pointer"
            >
                <ArrowLeft size={16} className="mr-2" /> 戻る
            </button>
        </div>

        {/* Grid */}
        <div className="z-10 flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8 justify-items-center">
                {allCards.map((card, idx) => {
                    const isUnlocked = unlockedCardNames.includes(card.name);

                    return (
                        <div key={idx} className="relative group scale-90 md:scale-100 origin-top">
                            {isUnlocked ? (
                                <div className="transform hover:scale-105 transition-transform duration-200">
                                    <Card card={card} onClick={() => {}} disabled={false} />
                                </div>
                            ) : (
                                <div className="w-32 h-48 border-[3px] border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 opacity-50 select-none grayscale">
                                    <Lock size={32} className="text-gray-500 mb-2" />
                                    <div className="text-4xl text-gray-600 font-bold">?</div>
                                    <div className="text-[10px] text-gray-500 mt-2 text-center">{card.rarity}</div>
                                    <div className="text-[8px] text-gray-600 text-center">{card.type}</div>
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

export default CompendiumScreen;
