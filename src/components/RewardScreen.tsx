
import React from 'react';
import { Card as ICard, RewardItem, Potion } from '../types';
import Card from './Card';
import { Gift, Gem, Coins, FlaskConical } from 'lucide-react';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-4">
      
      <div className="z-10 text-center mb-4 shrink-0 pt-4">
        <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
          <Gift className="mr-3" size={32} /> 勝利の報酬
        </h2>
        <p className="text-gray-300 text-sm">欲しい報酬を選択してください</p>
      </div>

      {/* Horizontal Scroll Container */}
      <div className={`z-10 flex flex-row items-center gap-8 w-full overflow-x-auto custom-scrollbar px-4 pt-20 pb-8 min-h-[420px] snap-x ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {rewards.map((reward) => (
          <div key={reward.id} className="snap-center shrink-0 transform hover:scale-105 transition-transform duration-200 flex justify-center">
            
            {/* Card Reward */}
            {reward.type === 'CARD' && (
                <div className="flex flex-col items-center w-48"> 
                    <div className="scale-110 mb-8 mt-6">
                        <Card card={reward.value as ICard} onClick={() => !isLoading && onSelectReward(reward)} disabled={isLoading} />
                    </div>
                    <button onClick={() => onSelectReward(reward)} className="mt-4 bg-blue-600 px-6 py-2 text-sm font-bold rounded border hover:bg-blue-500 shadow-lg w-full">カード獲得</button>
                </div>
            )}
            
            {/* Relic Reward */}
            {reward.type === 'RELIC' && (
                <div className="w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => onSelectReward(reward)}>
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Gem size={40} className="text-yellow-400" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-yellow-100 font-bold text-lg mb-2 truncate">{reward.value.name}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{reward.value.description}</div>
                    </div>
                    <button className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2">獲得</button>
                </div>
            )}

            {/* Gold Reward */}
            {reward.type === 'GOLD' && (
                <div className="w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => onSelectReward(reward)}>
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Coins size={40} className="text-yellow-400" />
                    </div>
                    <div className="text-center mb-auto flex flex-col justify-center h-full">
                        <div className="text-yellow-100 font-bold text-2xl mb-2">{reward.value} G</div>
                        <div className="text-xs text-gray-400">ゴールドを獲得</div>
                    </div>
                    <button className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2">獲得</button>
                </div>
            )}

            {/* Potion Reward */}
            {reward.type === 'POTION' && (
                <div className="w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => onSelectReward(reward)}>
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-white/50 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <FlaskConical size={40} style={{ color: (reward.value as Potion).color }} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-white font-bold text-lg mb-2 truncate">{reward.value.name}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{reward.value.description}</div>
                    </div>
                    <button className="bg-gray-600 px-6 py-2 text-sm font-bold rounded border hover:bg-gray-500 w-full mt-2">獲得</button>
                </div>
            )}
          </div>
        ))}
        
        {/* Padding at the end for scrolling comfort */}
        <div className="w-4 shrink-0"></div>
      </div>

      <div className="z-10 pb-4">
        <button 
          onClick={onSkip}
          disabled={isLoading}
          className="text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base p-2"
        >
          {isLoading ? "読み込み中..." : "これ以上受け取らずに進む >>"}
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;
