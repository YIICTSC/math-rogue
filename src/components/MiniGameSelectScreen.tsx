
import React from 'react';
import { ArrowLeft, Club, Gamepad2, Skull } from 'lucide-react';

interface MiniGameSelectScreenProps {
  onSelect: (gameId: string) => void;
  onBack: () => void;
}

const MiniGameSelectScreen: React.FC<MiniGameSelectScreenProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      
      <div className="z-10 w-full h-full flex flex-col items-center p-4 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-lg flex flex-col items-center min-h-full justify-center py-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse flex items-center shrink-0">
                <Gamepad2 className="mr-2 md:mr-3 text-yellow-400" size={32} /> ミニゲーム選択
            </h2>
            
            <div className="grid grid-cols-1 gap-4 w-full mb-8 shrink-0">
                {/* Poker Game Card */}
                <button
                    onClick={() => onSelect('POKER')}
                    className="group relative bg-slate-800 border-4 border-slate-600 hover:border-purple-500 hover:bg-slate-700 p-6 rounded-xl flex flex-row items-center transition-all shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden text-left"
                >
                    <div className="absolute top-0 right-0 bg-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md">POPULAR</div>
                    <div className="bg-purple-900/50 p-4 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300 border-2 border-purple-500/30 shrink-0">
                        <Club size={32} className="text-purple-400 fill-current" />
                    </div>
                    <div>
                        <span className="text-xl font-bold mb-1 text-white group-hover:text-purple-300 transition-colors block">放課後ポーカー</span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200 leading-tight block">
                            役を作ってスコアを稼げ！<br/>アイテムを駆使するローグライク。
                        </span>
                    </div>
                </button>

                {/* Survivor Game Card */}
                <button
                    onClick={() => onSelect('SURVIVOR')}
                    className="group relative bg-slate-800 border-4 border-slate-600 hover:border-red-500 hover:bg-slate-700 p-6 rounded-xl flex flex-row items-center transition-all shadow-xl hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] overflow-hidden text-left"
                >
                    <div className="absolute top-0 right-0 bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-md">NEW!</div>
                    <div className="bg-red-900/50 p-4 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300 border-2 border-red-500/30 shrink-0">
                        <Skull size={32} className="text-red-400 fill-current" />
                    </div>
                    <div>
                        <span className="text-xl font-bold mb-1 text-white group-hover:text-red-300 transition-colors block">校庭サバイバー</span>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200 leading-tight block">
                            迫りくる敵の大群から生き残れ！<br/>ヴァンサバ風アクション。
                        </span>
                    </div>
                </button>
            </div>

            <button 
                onClick={onBack} 
                className="text-gray-400 hover:text-white flex items-center border-b border-transparent hover:border-white transition-colors text-base py-2 mt-auto"
            >
                <ArrowLeft className="mr-2" size={20} /> タイトルへ戻る
            </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGameSelectScreen;