
import React from 'react';
import { ArrowLeft, Music, Construction } from 'lucide-react';

interface SchoolRhythmGameProps {
  onBack: () => void;
}

const SchoolRhythmGame: React.FC<SchoolRhythmGameProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-pink-950 text-white relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
        
        <div className="z-10 flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-black/60 p-12 rounded-xl border-4 border-pink-500 shadow-2xl flex flex-col items-center">
                <div className="bg-pink-900 p-6 rounded-full mb-6 animate-bounce border-2 border-pink-400">
                    <Music size={64} className="text-pink-200" />
                </div>
                <h2 className="text-4xl font-bold text-pink-300 mb-4">音楽室リズム</h2>
                <div className="flex items-center text-yellow-400 mb-8 font-bold text-xl bg-black/40 px-4 py-2 rounded">
                    <Construction className="mr-2" /> 鋭意制作中...
                </div>
                <p className="text-gray-300 mb-8 max-w-md leading-relaxed">
                    放課後の音楽室で繰り広げられるリズムバトル！<br/>
                    リコーダー、ピアノ、そして謎の校内放送...<br/>
                    近日公開予定！
                </p>
                <button 
                    onClick={onBack}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold flex items-center transition-colors border-2 border-gray-500"
                >
                    <ArrowLeft className="mr-2" /> 戻る
                </button>
            </div>
        </div>
    </div>
  );
};

export default SchoolRhythmGame;
