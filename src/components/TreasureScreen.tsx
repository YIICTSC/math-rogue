
import React, { useState, useEffect } from 'react';
import { Archive, Key, Check } from 'lucide-react';
import { RewardItem, LanguageMode } from '../types';
import { audioService } from '../services/audioService';
import { trans } from '../utils/textUtils';

interface TreasureScreenProps {
  onOpen: () => void;
  onLeave: () => void;
  rewards: RewardItem[];
  hasCursedKey: boolean;
  languageMode: LanguageMode;
}

const TreasureScreen: React.FC<TreasureScreenProps> = ({ onOpen, onLeave, rewards, hasCursedKey, languageMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Play suspenseful "event" music when chest is discovered
    audioService.playBGM('event');
  }, []);

  const handleOpen = () => {
      setIsOpen(true);
      audioService.playSound('select'); // Chest open sound
      audioService.playBGM('reward'); // Switch to uplifting "reward" music
      onOpen();
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-8">
      <div className="z-10 flex flex-col items-center text-center">
          
          {!isOpen ? (
              <>
                <h2 className="text-4xl text-yellow-400 font-bold mb-8 animate-pulse">{trans("宝箱を発見！", languageMode)}</h2>
                <div 
                    onClick={handleOpen}
                    className="cursor-pointer transition-transform hover:scale-110 mb-8 relative"
                >
                    <Archive size={128} className="text-yellow-600 fill-yellow-900" />
                    {hasCursedKey && (
                        <div className="absolute -top-4 -right-4 bg-purple-900 border border-purple-500 rounded-full p-2 animate-bounce" title="呪いの鍵: 呪いが入っています">
                            <Key size={32} className="text-purple-400" />
                        </div>
                    )}
                </div>
                <p className="text-gray-400 mb-8">{trans("中には何が入っているだろうか？", languageMode)}</p>
                <button 
                    onClick={handleOpen}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded font-bold text-xl border-2 border-yellow-300"
                >
                    {trans("開ける", languageMode)}
                </button>
              </>
          ) : (
              <>
                <h2 className="text-4xl text-yellow-400 font-bold mb-8">{trans("獲得！", languageMode)}</h2>
                <div className="mb-12 flex flex-col gap-4 animate-in fade-in zoom-in duration-500">
                    <Archive size={128} className="text-yellow-400 mb-4 mx-auto opacity-50" />
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        {rewards.map((r, idx) => (
                            <div key={idx} className="bg-black/60 border-2 border-yellow-500 p-4 rounded-lg flex items-center gap-4 min-w-[200px]">
                                {r.type === 'RELIC' && <span className="text-2xl">💎</span>}
                                {r.type === 'GOLD' && <span className="text-2xl">💰</span>}
                                {r.type === 'CARD' && <span className="text-2xl">🃏</span>} 
                                <div className="text-left">
                                    <div className="font-bold text-yellow-100">
                                        {r.type === 'GOLD' ? `${r.value} G` : trans(r.value.name, languageMode)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {r.type === 'RELIC' ? trans(r.value.description, languageMode) : (r.type === 'CARD' ? trans('呪い', languageMode) : trans('ゴールド', languageMode))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={onLeave}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded font-bold text-xl border-2 border-white flex items-center"
                >
                    <Check className="mr-2" /> {trans("進む", languageMode)}
                </button>
              </>
          )}

      </div>
    </div>
  );
};

export default TreasureScreen;
