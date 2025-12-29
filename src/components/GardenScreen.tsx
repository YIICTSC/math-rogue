
import React, { useState } from 'react';
import { Player, GardenSlot, Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import PixelSprite from './PixelSprite';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { Sprout, Trash2, ArrowRight, Home, shovel, Leaf, Sun } from 'lucide-react';
import { GROWN_PLANTS } from '../constants';

interface GardenScreenProps {
  player: Player;
  onPlant: (slotIndex: number, card: ICard) => void;
  onHarvest: (slotIndex: number) => void;
  onLeave: () => void;
  languageMode: LanguageMode;
}

const GardenScreen: React.FC<GardenScreenProps> = ({ player, onPlant, onHarvest, onLeave, languageMode }) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isSelectingSeed, setIsSelectingSeed] = useState(false);

  const handleSlotClick = (idx: number) => {
    const slot = player.garden![idx];
    if (slot.plantedCard) {
      if (slot.growth >= slot.maxGrowth) {
        onHarvest(idx);
        audioService.playSound('win');
      } else {
        // まだ成長中
        audioService.playSound('select');
      }
    } else {
      setSelectedSlot(idx);
      setIsSelectingSeed(true);
      audioService.playSound('select');
    }
  };

  const seedsInDeck = player.deck.filter(c => c.isSeed);

  return (
    <div className="flex flex-col h-full w-full bg-[#2d1b0e] text-white p-4 font-mono relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <div className="z-10 flex justify-between items-center bg-black/60 p-4 border-b-4 border-[#5d4037] mb-6 rounded-lg shadow-xl">
        <div className="flex items-center">
          <div className="bg-green-900 p-2 rounded-full mr-3 border border-green-500">
            <Leaf className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-100">{trans("学級菜園", languageMode)}</h2>
            <p className="text-xs text-gray-400">{trans("種を植えて、強力な植物を育てよう", languageMode)}</p>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="bg-green-700 hover:bg-green-600 px-6 py-2 rounded font-bold border-2 border-white transition-all shadow-lg flex items-center gap-2"
        >
          <Home size={18}/> {trans("マップへ", languageMode)}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-grow overflow-hidden">
        {/* Garden Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#3e2723] border-8 border-[#5d4037] rounded-xl shadow-2xl relative">
            {player.garden?.map((slot, i) => (
              <div 
                key={i}
                onClick={() => handleSlotClick(i)}
                className={`
                  w-20 h-20 md:w-32 md:h-32 border-4 rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all
                  ${slot.plantedCard ? 'bg-[#4e342e] border-green-800' : 'bg-[#2d1b0e] border-[#5d4037] hover:border-yellow-600'}
                  ${selectedSlot === i ? 'ring-4 ring-yellow-400' : ''}
                `}
              >
                {!slot.plantedCard ? (
                  <div className="opacity-20 flex flex-col items-center">
                    <Sprout size={32} />
                    <span className="text-[10px] mt-1">{trans("空き", languageMode)}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full h-full p-2">
                    <div className={`flex-grow flex items-center justify-center ${slot.growth >= slot.maxGrowth ? 'animate-bounce' : ''}`}>
                      <PixelSprite 
                        seed={slot.plantedCard.id} 
                        name={slot.plantedCard.textureRef} 
                        className={`w-12 h-12 md:w-20 md:h-20 ${slot.growth < slot.maxGrowth ? 'grayscale brightness-50' : ''}`} 
                      />
                    </div>
                    {/* Growth Progress Bar */}
                    <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/20 mt-1">
                      <div 
                        className={`h-full transition-all duration-1000 ${slot.growth >= slot.maxGrowth ? 'bg-yellow-400' : 'bg-green-500'}`}
                        style={{ width: `${(slot.growth / slot.maxGrowth) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[8px] md:text-[10px] mt-1 font-bold">
                      {slot.growth >= slot.maxGrowth ? trans("収穫可能！", languageMode) : `${trans("成長中", languageMode)} (${slot.growth}/${slot.maxGrowth})`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seed Selection Sidebar */}
        <div className="w-full md:w-80 bg-black/40 border-2 border-[#5d4037] rounded-xl p-4 flex flex-col overflow-hidden shadow-inner">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center border-b border-[#5d4037] pb-2">
             <Sun className="mr-2" size={20}/> {trans("持っている種", languageMode)}
          </h3>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
            {seedsInDeck.length === 0 ? (
              <div className="text-gray-500 italic text-center py-10 text-sm">
                {trans("デッキに「種」がありません", languageMode)}
              </div>
            ) : (
              seedsInDeck.map((seed) => (
                <div 
                  key={seed.id}
                  onClick={() => selectedSlot !== null && onPlant(selectedSlot, seed)}
                  className={`
                    p-3 bg-[#4e342e] border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 group
                    ${selectedSlot !== null ? 'hover:border-green-400 hover:bg-[#5d4037]' : 'opacity-50 grayscale cursor-not-allowed'}
                    ${selectedSlot === null ? '' : 'border-[#5d4037]'}
                  `}
                >
                  <div className="w-12 h-12 shrink-0 bg-black/40 rounded flex items-center justify-center">
                    <PixelSprite seed={seed.id} name={seed.textureRef} className="w-10 h-10" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-sm text-green-100 truncate">{trans(seed.name, languageMode)}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">
                      {trans("必要成長数", languageMode)}: {seed.growthRequired}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-green-500 opacity-0 group-hover:opacity-100" />
                </div>
              ))
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded text-[10px] text-yellow-200 leading-relaxed">
            {trans("※種を植えると、収穫するまでデッキから一時的に除外されます。戦闘終了ごとに成長します。", languageMode)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenScreen;
