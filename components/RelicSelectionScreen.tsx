
import React from 'react';
import { Relic } from '../types';
import { Gem, MousePointer2 } from 'lucide-react';

interface RelicSelectionScreenProps {
  relics: Relic[];
  onSelect: (relic: Relic) => void;
}

const RelicSelectionScreen: React.FC<RelicSelectionScreenProps> = ({ relics, onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-8">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/800/600?grayscale&blur=5')] opacity-20 bg-cover pointer-events-none"></div>
      
      <div className="z-10 text-center mb-12">
        <h2 className="text-4xl text-yellow-400 font-bold mb-4 flex items-center justify-center animate-pulse">
          <Gem className="mr-3" size={40} /> 旅の始まり
        </h2>
        <p className="text-xl text-gray-300">冒険の助けとなる遺物（レリック）を1つ選んでください</p>
      </div>

      <div className="z-10 flex flex-wrap justify-center gap-8">
        {relics.map((relic) => (
          <div 
            key={relic.id} 
            className="group w-64 bg-black/60 border-2 border-gray-500 hover:border-yellow-400 p-6 rounded-lg flex flex-col items-center cursor-pointer transition-all hover:bg-black/80 hover:-translate-y-2 shadow-lg"
            onClick={() => onSelect(relic)}
          >
            <div className="w-20 h-20 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center mb-4 group-hover:border-yellow-500 transition-colors">
                 <Gem size={32} className="text-yellow-200" />
            </div>
            <h3 className="text-xl font-bold text-yellow-100 mb-2 group-hover:text-yellow-400">{relic.name}</h3>
            <p className="text-sm text-gray-400 text-center mb-4 min-h-[3rem]">{relic.description}</p>
            <div className="mt-auto bg-blue-600 px-4 py-2 rounded text-sm font-bold flex items-center group-hover:bg-blue-500">
                <MousePointer2 size={16} className="mr-2" /> 選択する
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelicSelectionScreen;
