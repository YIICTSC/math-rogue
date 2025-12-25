
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, ENEMY_LIBRARY } from '../constants';
import { Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import { BookOpen, Lock, ArrowLeft, Swords, Gem, FlaskConical, Skull, X } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';

interface CompendiumScreenProps {
  unlockedCardNames: string[];
  onBack: () => void;
  languageMode: LanguageMode;
}

const CompendiumScreen: React.FC<CompendiumScreenProps> = ({ unlockedCardNames, onBack, languageMode }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'ENEMIES'>('CARDS');
  const [unlockedRelics, setUnlockedRelics] = useState<string[]>([]);
  const [unlockedPotions, setUnlockedPotions] = useState<string[]>([]);
  const [defeatedEnemies, setDefeatedEnemies] = useState<string[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<{
      type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY';
      data: any;
      unlocked: boolean;
  } | null>(null);

  const longPressTimer = useRef<any>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
        handleItemClick(type, data, unlocked);
    }, 700);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > 10) {
        handlePointerUp();
    }
  };

  useEffect(() => {
      setUnlockedRelics(storageService.getUnlockedRelics());
      setUnlockedPotions(storageService.getUnlockedPotions());
      setDefeatedEnemies(storageService.getDefeatedEnemies());
  }, []);

  const allCards = useMemo(() => {
    return Object.values(CARDS_LIBRARY).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });
  }, []);

  const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
  const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);
  const allEnemies = useMemo(() => Object.values(ENEMY_LIBRARY).sort((a, b) => a.tier - b.tier), []);

  const totalCards = allCards.length;
  const currentLibraryUnlockedCount = allCards.filter(c => unlockedCardNames.includes(c.name)).length;
  const percentage = Math.floor((currentLibraryUnlockedCount / totalCards) * 100);

  const handleItemClick = (type: 'CARD' | 'RELIC' | 'POTION' | 'ENEMY', data: any, unlocked: boolean) => {
      setSelectedItem({ type, data, unlocked });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        
        {/* Header */}
        <div className="z-10 bg-black/80 border-b-4 border-amber-600 p-4 flex flex-col md:flex-row justify-between items-center shadow-xl gap-4 shrink-0">
            <div className="flex items-center">
                <BookOpen size={32} className="text-amber-500 mr-3" />
                <div>
                    <h2 className="text-2xl font-bold text-amber-100">{trans("図鑑", languageMode)}</h2>
                    {activeTab === 'CARDS' && <p className="text-xs text-gray-400">{trans("収集率", languageMode)}: {percentage}%</p>}
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('CARDS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='CARDS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Swords size={14} className="mr-1"/> {trans("カード", languageMode)}
                </button>
                <button onClick={() => setActiveTab('RELICS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='RELICS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Gem size={14} className="mr-1"/> {trans("レリック", languageMode)}
                </button>
                <button onClick={() => setActiveTab('POTIONS')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='POTIONS' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <FlaskConical size={14} className="mr-1"/> {trans("薬", languageMode)}
                </button>
                <button onClick={() => setActiveTab('ENEMIES')} className={`px-3 py-1 rounded text-sm font-bold flex items-center ${activeTab==='ENEMIES' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    <Skull size={14} className="mr-1"/> {trans("魔物", languageMode)}
                </button>
            </div>

            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" /> {trans("戻る", languageMode)}
            </button>
        </div>

        {/* Content Area */}
        <div className="z-10 flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/leather.png')] bg-amber-900/20">
            
            {activeTab === 'CARDS' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
                    {allCards.map((template, idx) => {
                        const isUnlocked = unlockedCardNames.includes(template.name);
                        const cardInstance: ICard = { id: `compendium-${idx}`, ...template };

                        return (
                            <div key={idx} className="relative group cursor-pointer" onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)}>
                                {isUnlocked ? (
                                    <div className="transform hover:scale-105 transition-transform duration-200 scale-75 origin-top-left w-24 h-36">
                                        <Card card={cardInstance} onClick={() => handleItemClick('CARD', cardInstance, isUnlocked)} disabled={false} languageMode={languageMode}/>
                                    </div>
                                ) : (
                                    <div className="w-24 h-36 border-[3px] border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center p-2 opacity-50 select-none grayscale">
                                        <Lock size={24} className="text-gray-500 mb-2" />
                                        <div className="text-xl text-gray-600 font-bold">?</div>
                                        <div className="text-[8px] text-gray-500 mt-2 text-center">{template.rarity}</div>
                                        <div className="text-[6px] text-gray-600 text-center">{template.type}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'RELICS' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {allRelics.map((relic, idx) => {
                        const isUnlocked = unlockedRelics.includes(relic.id);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleItemClick('RELIC', relic, isUnlocked)}
                                onPointerDown={(e) => handlePointerDown(e, 'RELIC', relic, isUnlocked)}
                                onPointerUp={handlePointerUp}
                                onPointerMove={handlePointerMove}
                                className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-yellow-500' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                            >
                                <div className={`w-12 h-12 bg-gray-800 rounded-full border border-yellow-600 flex items-center justify-center mb-2 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                    <Gem size={24} className="text-yellow-400" />
                                </div>
                                <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-yellow-200' : 'text-gray-600'}`}>{isUnlocked ? trans(relic.name, languageMode) : '???'}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'POTIONS' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {allPotions.map((potion, idx) => {
                        const isUnlocked = unlockedPotions.includes(potion.templateId);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleItemClick('POTION', potion, isUnlocked)}
                                onPointerDown={(e) => handlePointerDown(e, 'POTION', potion, isUnlocked)}
                                onPointerUp={handlePointerUp}
                                onPointerMove={handlePointerMove}
                                className={`bg-black/60 border ${isUnlocked ? 'border-gray-600 hover:border-white' : 'border-gray-800'} p-4 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center`}
                            >
                                <div className={`w-12 h-12 bg-gray-800 rounded flex items-center justify-center mb-2 border border-white/30 ${!isUnlocked ? 'grayscale opacity-30' : ''}`}>
                                    <FlaskConical size={24} style={{ color: potion.color }} />
                                </div>
                                <div className={`font-bold text-xs mb-1 truncate w-full ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{isUnlocked ? trans(potion.name, languageMode) : '???'}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'ENEMIES' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {allEnemies.map((enemy, idx) => {
                        const isUnlocked = defeatedEnemies.includes(enemy.name);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleItemClick('ENEMY', enemy, isUnlocked)}
                                onPointerDown={(e) => handlePointerDown(e, 'ENEMY', enemy, isUnlocked)}
                                onPointerUp={handlePointerUp}
                                onPointerMove={handlePointerMove}
                                className={`bg-black/60 border ${isUnlocked ? 'border-red-900 hover:border-red-500' : 'border-gray-800'} p-2 rounded flex flex-col items-center text-center cursor-pointer transition-colors aspect-square justify-center relative overflow-hidden`}
                            >
                                <div className={`w-16 h-16 mb-2 bg-gray-900 rounded ${!isUnlocked ? 'brightness-0 opacity-20' : ''}`}>
                                    <PixelSprite seed={enemy.name} name={enemy.name} className="w-full h-full" size={16} />
                                </div>
                                <div className={`font-bold text-[10px] truncate w-full ${isUnlocked ? 'text-red-200' : 'text-gray-600'}`}>{isUnlocked ? trans(enemy.name, languageMode) : '???'}</div>
                                {!isUnlocked && <Lock size={16} className="absolute top-2 right-2 text-gray-600" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Detail Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                <div className="bg-gray-800 border-4 border-amber-600 w-full max-w-md p-6 rounded-lg shadow-2xl relative animate-in zoom-in duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>

                    <h3 className={`text-2xl font-bold mb-4 ${selectedItem.unlocked ? 'text-amber-200' : 'text-gray-500'}`}>
                        {selectedItem.unlocked ? trans(selectedItem.data.name, languageMode) : trans('未発見', languageMode)}
                    </h3>

                    <div className="mb-6 flex items-center justify-center min-h-[100px]">
                        {selectedItem.type === 'CARD' && (
                            selectedItem.unlocked ? (
                                <div className="scale-110"><Card card={selectedItem.data} onClick={() => {}} disabled={false} languageMode={languageMode}/></div>
                            ) : <Lock size={64} className="text-gray-600"/>
                        )}
                        {selectedItem.type === 'RELIC' && (
                            selectedItem.unlocked ? <Gem size={80} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> : <Gem size={80} className="text-gray-700" />
                        )}
                        {selectedItem.type === 'POTION' && (
                            selectedItem.unlocked ? <FlaskConical size={80} style={{ color: selectedItem.data.color }} className="drop-shadow-[0_0_10px_currentColor]" /> : <FlaskConical size={80} className="text-gray-700" />
                        )}
                        {selectedItem.type === 'ENEMY' && (
                            <div className="w-32 h-32 bg-black rounded border border-gray-600">
                                {selectedItem.unlocked ? 
                                    <PixelSprite seed={selectedItem.data.name} name={selectedItem.data.name} className="w-full h-full" size={16} /> 
                                    : <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl">?</div>
                                }
                            </div>
                        )}
                    </div>

                    <div className="bg-black/40 p-4 rounded border border-gray-600 w-full text-left">
                        {selectedItem.unlocked ? (
                            <>
                                <p className="text-gray-300 text-sm leading-relaxed mb-2">{trans(selectedItem.data.description, languageMode)}</p>
                                {selectedItem.type === 'ENEMY' && <p className="text-red-400 text-xs mt-2 font-mono">{trans("危険度", languageMode)}: Tier {selectedItem.data.tier}</p>}
                                {selectedItem.type === 'RELIC' && <p className="text-yellow-600 text-xs mt-2 font-mono">{trans("レアリティ", languageMode)}: {selectedItem.data.rarity}</p>}
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm italic">{trans("このアイテムはまだ発見されていません。", languageMode)}<br/>{trans("冒険を進めて解禁しましょう。", languageMode)}</p>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CompendiumScreen;
