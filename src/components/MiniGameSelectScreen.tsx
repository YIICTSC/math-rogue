import React from 'react';
import { ArrowLeft, Club, HelpCircle, Gamepad2 } from 'lucide-react';

interface MiniGameSelectScreenProps {
  onSelect: (gameId: string) => void;
  onBack: () => void;
}

const MiniGameSelectScreen: React.FC<MiniGameSelectScreenProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white p-4 items-center justify-center font-mono relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse flex items-center">
            <Gamepad2 className="mr-3 text-yellow-400" size={40} /> ミニゲーム選択
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-12">
            {/* Poker Game Card */}
            <button
                onClick={() => onSelect('POKER')}
                className="group relative bg-slate-800 border-4 border-slate-600 hover:border-purple-500 hover:bg-slate-700 p-8 rounded-xl flex flex-col items-center transition-all shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden"
            >
                <div className="absolute top-0 right-0 bg-purple-600 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">POPULAR</div>
                <div className="bg-purple-900/50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-purple-500/30">
                    <Club size={64} className="text-purple-400 fill-current" />
                </div>
                <span className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">放課後ポーカー</span>
                <span className="text-sm text-gray-400 group-hover:text-gray-200">
                    役を作ってスコアを稼げ！<br/>アイテムを駆使するローグライク。
                </span>
            </button>

            {/* Placeholder Card */}
            <div className="relative bg-gray-800/30 border-4 border-gray-700 p-8 rounded-xl flex flex-col items-center select-none overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <div className="bg-gray-900 border-2 border-gray-600 px-6 py-2 rounded text-gray-400 font-bold -rotate-12 text-2xl shadow-2xl">COMING SOON</div>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-full mb-6 filter blur-[2px]">
                    <HelpCircle size={64} className="text-gray-600" />
                </div>
                <span className="text-2xl font-bold mb-3 text-gray-600 blur-[1px]">???</span>
                <span className="text-sm text-gray-600 blur-[1px]">
                    新しいゲームを開発中...
                </span>
            </div>
        </div>

        <button 
            onClick={onBack} 
            className="text-gray-400 hover:text-white flex items-center border-b border-transparent hover:border-white transition-colors text-lg"
        >
            <ArrowLeft className="mr-2" size={24} /> タイトルへ戻る
        </button>
      </div>
    </div>
  );
};

export default MiniGameSelectScreen;