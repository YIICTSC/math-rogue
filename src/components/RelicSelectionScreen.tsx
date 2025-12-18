
import React, { useEffect } from 'react';
import { Relic, LanguageMode } from '../types';
import { Gem, MousePointer2 } from 'lucide-react';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';

interface RelicSelectionScreenProps {
  relics: Relic[];
  onSelect: (relic: Relic) => void;
  languageMode: LanguageMode;
}

const RelicSelectionScreen: React.FC<RelicSelectionScreenProps> = ({ relics, onSelect, languageMode }) => {
  useEffect(() => {
    // Play "shop" theme for selection phase as it fits the "equipping" mood
    audioService.playBGM('shop');
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative overflow-y-auto custom-scrollbar">
      
      <div className="z-10 flex flex-col items-center min-h-full justify-start p-4 py-12">
        <div className="text-center mb-8 shrink-0">
            <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 md:mb-4 flex items-center justify-center animate-pulse">
            <Gem className="mr-3" size={32} /> {trans("旅の始まり", languageMode)}
            </h2>
            <p className="text-sm md:text-xl text-gray-300">{trans("冒険の助けとなる遺物（レリック）を1つ選んでください", languageMode)}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 pb-8">
            {relics.map((relic) => (
            <div 
                key={relic.id} 
                className="group w-full max-w-[280px] md:w-64 bg-black/60 border-2 border-gray-500 hover:border-yellow-400 p-4 md:p-6 rounded-lg flex flex-col items-center cursor-pointer transition-all hover:bg-black/80 hover:-translate-y-1 shadow-lg shrink-0"
                onClick={() => onSelect(relic)}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center mb-4 group-hover:border-yellow-500 transition-colors">
                    <Gem size={32} className="text-yellow-200" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-yellow-100 mb-2 group-hover:text-yellow-400">{trans(relic.name, languageMode)}</h3>
                <p className="text-xs md:text-sm text-gray-400 text-center mb-4 min-h-[2.5rem] md:min-h-[3rem]">{trans(relic.description, languageMode)}</p>
                <div className="mt-auto bg-blue-600 px-4 py-2 rounded text-sm font-bold flex items-center group-hover:bg-blue-500 w-full justify-center">
                    <MousePointer2 size={16} className="mr-2" /> {trans("選択する", languageMode)}
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RelicSelectionScreen;