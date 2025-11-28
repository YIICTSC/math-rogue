
import React from 'react';
import { Card as ICard, RewardItem, Potion } from '../types';
import Card from './Card';
import { Gift, Loader2, Gem, Coins, FlaskConical } from 'lucide-react';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-8">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/800/600?grayscale&blur=5')] opacity-20 bg-cover pointer-events-none"></div>
      
      <div className="z-10 text-center mb-8">
        <h2 className="text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
          <Gift className="mr-3" size={40} /> 勝利の報酬
        </h2>
        <p className="text-gray-300">欲しい報酬を選択してください</p>
      </div>

      <div className={`z-10 flex flex-wrap justify-center gap-8 mb-12 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {rewards.map((reward) => (
          <div key={reward.id} className="transform hover:scale-105 transition-transform duration-200">
            {reward.type === 'CARD' && (
                <div>
                    <Card card={reward.value as ICard} onClick={() => !isLoading && onSelectReward(reward)} disabled={isLoading} />
                    <button onClick={() => onSelectReward(reward)} className="mt-2 bg-blue-600 w-full py-1 text-sm font-bold rounded border hover:bg-blue-500">カード獲得</button>
                </div>
            )}
            
            {reward.type === 'RELIC' && (
                <div className="w-32 h-48 bg-black/60 border-2 border-yellow-500 rounded flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-black/80" onClick={() => onSelectReward(reward)}>
                    <Gem size={48} className="text-yellow-400 mb-2" />
                    <div className="text-yellow-100 font-bold text-center mb-1">{reward.value.name}</div>
                    <div className="text-[10px] text-gray-400 text-center">{reward.value.description}</div>
                    <button className="mt-auto bg-yellow-600 w-full py-1 text-sm font-bold rounded border hover:bg-yellow-500">レリック獲得</button>
                </div>
            )}

            {reward.type === 'GOLD' && (
                <div className="w-32 h-48 bg-black/60 border-2 border-yellow-500 rounded flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-black/80" onClick={() => onSelectReward(reward)}>
                    <Coins size={48} className="text-yellow-400 mb-2" />
                    <div className="text-yellow-100 font-bold text-center">{reward.value} ゴールド</div>
                    <button className="mt-auto bg-yellow-600 w-full py-1 text-sm font-bold rounded border hover:bg-yellow-500">獲得</button>
                </div>
            )}

            {reward.type === 'POTION' && (
                <div className="w-32 h-48 bg-black/60 border-2 border-white/50 rounded flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-black/80" onClick={() => onSelectReward(reward)}>
                    <FlaskConical size={48} style={{ color: (reward.value as Potion).color }} className="mb-2" />
                    <div className="text-white font-bold text-center mb-1">{reward.value.name}</div>
                    <div className="text-[10px] text-gray-400 text-center">{reward.value.description}</div>
                    <button className="mt-auto bg-gray-600 w-full py-1 text-sm font-bold rounded border hover:bg-gray-500">ポーション獲得</button>
                </div>
            )}
          </div>
        ))}
      </div>

      <div className="z-10">
        <button 
          onClick={onSkip}
          disabled={isLoading}
          className="text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "読み込み中..." : "これ以上受け取らずに進む >>"}
        </button>
      </div>
    </div>
  );
};

export default RewardScreen;
