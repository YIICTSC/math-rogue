

import React, { useMemo, useState } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } from '../constants';
import { Card as ICard, CardType } from '../types';
import Card from './Card';
import { BookOpen, Lock, ArrowLeft, Swords, Gem, FlaskConical, Skull } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { ENEMY_NAMES } from '../services/geminiService';

interface CompendiumScreenProps {
  unlockedCardNames: string[];
  onBack: () => void;
}

const CompendiumScreen: React.FC<CompendiumScreenProps> = ({ unlockedCardNames, onBack }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'ENEMIES'>('CARDS');

  const allCards = useMemo(() => {
    return Object.values(CARDS_LIBRARY).sort((a, b) => {
        // Sort by Type then Cost then Name
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });
  }, []);

  const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
  const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
  
  // Create dummy enemy objects for display
  const allEnemies = useMemo(() => {
      return ENEMY_NAMES.map((name, idx) => ({
          name: name,
          id: `enemy-comp-${idx}`,
          seed: `enemy-seed-${idx}`
      }));
  }, []);

  const totalCards = allCards.length;
  const currentLibraryUnlockedCount = allCards.filter(c => unlockedCardNames.includes(c.name)).length;
  const percentage = Math.floor((currentLibraryUnlockedCount / totalCards) * 100);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        
        {/* Header */}
        <div className="z-10 bg-black/80 border-b-4 border-amber-600 p-4 flex flex-col md:flex-row justify-between items-center shadow-xl gap-4">
            <div className="flex items-center">
                <BookOpen size={32} className="text-amber-500 mr-3" />
                <div>
                    <h2 className="text-2xl font-bold text-amber-100">大図鑑</h2>
                    {activeTab === 'CARDS' && <p className="text-xs text-gray-400">収集率: {percentage}%</p>}
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('CARDS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='CARDS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Swords size={14} className="mr-1"/> カード
                </button>
                <button onClick={() => setActiveTab('RELICS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='RELICS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Gem size={14} className="mr-1"/> レリック
                </button>
                <button onClick={() => setActiveTab('POTIONS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='POTIONS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <FlaskConical size={14} className="mr-1"/> 薬
                </button>
                <button onClick={() => setActiveTab('ENEMIES')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='ENEMIES' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Skull size={14} className="mr-1"/> 魔物
                </button>
            </div>

            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" /> 戻る
            </button>
        </div>

        {/* Content Area */}
        <div className="z-10 flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
            
            {activeTab === 'CARDS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 justify-items-center">
                    {allCards.map((template, idx) => {
                        const isUnlocked = unlockedCardNames.includes(template.name);
                        const cardInstance: ICard = { id: `compendium-${idx}`, ...template };

                        return (
                            <div key={idx} className="relative group">
                                {isUnlocked ? (
                                    <div className="transform hover:scale-105 transition-transform duration-200">
                                        <Card card={cardInstance} onClick={() => {}} disabled={false} />
                                    </div>
                                ) : (
                                    <div className="w-32 h-48 border-[3px] border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-4 opacity-50 select-none grayscale">
                                        <Lock size={32} className="text-gray-500 mb-2" />
                                        <div className="text-4xl text-gray-600 font-bold">?</div>
                                        <div className="text-[10px] text-gray-500 mt-2 text-center">{template.rarity}</div>
                                        <div className="text-[8px] text-gray-600 text-center">{template.type}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'RELICS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allRelics.map((relic, idx) => (
                        <div key={idx} className="bg-black/60 border border-gray-600 p-4 rounded flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gray-800 rounded-full border border-yellow-600 flex items-center justify-center mb-2">
                                <Gem size={24} className="text-yellow-400" />
                            </div>
                            <div className="text-yellow-200 font-bold text-sm mb-1">{relic.name}</div>
                            <div className="text-[10px] text-gray-400">{relic.description}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'POTIONS' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allPotions.map((potion, idx) => (
                        <div key={idx} className="bg-black/60 border border-gray-600 p-4 rounded flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center mb-2 border border-white/30">
                                <FlaskConical size={24} style={{ color: potion.color }} />
                            </div>
                            <div className="text-white font-bold text-sm mb-1">{potion.name}</div>
                            <div className="text-[10px] text-gray-400">{potion.description}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'ENEMIES' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {allEnemies.map((enemy, idx) => (
                        <div key={idx} className="bg-black/60 border border-gray-600 p-2 rounded flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-2 bg-gray-900 rounded">
                                <PixelSprite seed={enemy.seed} name={enemy.name} className="w-full h-full" size={16} />
                            </div>
                            <div className="text-red-200 font-bold text-xs truncate w-full">{enemy.name}</div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    </div>
  );
};

export default CompendiumScreen;