
import React, { useEffect, useState } from 'react';
import { Card as ICard, RewardItem, Potion } from '../types';
import Card from './Card';
import { Gift, Gem, Coins, FlaskConical, X } from 'lucide-react';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem, replacePotionId?: string) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading }) => {
  const [replaceModeItem, setReplaceModeItem] = useState<RewardItem | null>(null);
  
  // Need current potions to show in modal. Since RewardScreen doesn't receive player prop directly,
  // we assume the parent handles the logic or we'd need to pass player.
  // Actually, we can't show "which potion to replace" without knowing the player's current potions.
  // Let's check App.tsx. RewardScreen gets `rewards`. It doesn't get `player`.
  // Wait, I can pass `player` or just `potions` to RewardScreen.
  // BUT: App.tsx calls RewardScreen.
  // I will need to update App.tsx to pass player or potions to RewardScreen.
  // OR: I can cheat and look at how App.tsx handles it.
  // Actually, the simplest way is to update App.tsx to pass `player` to RewardScreen.
  // But wait, the previous code didn't pass player.
  // I'll modify App.tsx to pass `potions` to RewardScreen.
  // But for this change block I am only modifying RewardScreen.
  // Ah, I need to know *what* potions the player has to display them.
  // I'll assume `potions` is passed as a prop now. I will update App.tsx to pass it.
  
  // Actually, I can just use a callback to ask for replacement if the parent says "it's full".
  // But the UI needs to render the player's potions.
  // Let's assume for this file update that `currentPotions` is passed.
  // I'll add `currentPotions` to props interface.
  // But wait, App.tsx is already updated in my plan.
  // I'll update App.tsx to pass `currentPotions={gameState.player.potions}`.
  
  useEffect(() => {
    if (!isLoading && rewards.length === 0) {
      const timer = setTimeout(() => {
        onSkip();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rewards, isLoading, onSkip]);

  const handlePotionClick = (reward: RewardItem) => {
      // We need to know if we are full.
      // Since we don't have player prop in the original signature, 
      // let's rely on a new prop `currentPotions` or similar.
      // I will assume the parent passes `currentPotions` in the updated App.tsx.
      // If not passed, we can't show the modal properly.
      // Let's check the props again.
      // To keep it clean, I will update the interface to accept `currentPotions`.
      
      // If we don't have currentPotions, we just try to select.
      // If the App logic checks for full, it might fail silently or we need a way to know.
      // Let's add `currentPotions` to props.
      
      // Since I can update App.tsx, I will pass `currentPotions`.
      if (replaceModeItem) return;
      
      // Logic handled inside render for modal
      onSelectReward(reward);
  };

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
                <div className="w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => {
                    // Logic to check if full comes from Parent (or passed prop)
                    // But here we can cheat: The parent (App) knows state.
                    // If we want modal here, we need potions prop.
                    // I will define `currentPotions` prop in this file but since I can't see the parent call in this file context,
                    // I'll assume the prop is available or handle it via a wrapper.
                    // Actually, the cleanest way without breaking interface too much is to let the parent
                    // pass a special handler or just pass the potions list.
                    // Let's assume `currentPotions` is passed.
                    // NOTE: I am adding `currentPotions` to props in this content block.
                    if (onSelectReward.length > 1) { // Check if function accepts replacement
                         // This check is weak.
                         // Let's just call a local handler that checks props.
                         // Since I am updating the file entirely:
                    }
                    // For now, simple call. The logic for modal will be inside the component if I add the prop.
                    // Since I cannot change the Props interface in App.tsx simultaneously in this single file block (I mean I can, but I need to be consistent).
                    // I will add `currentPotions` to props below.
                }}>
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-white/50 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <FlaskConical size={40} style={{ color: (reward.value as Potion).color }} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-white font-bold text-lg mb-2 truncate">{reward.value.name}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{reward.value.description}</div>
                    </div>
                    <button 
                        className="bg-gray-600 px-6 py-2 text-sm font-bold rounded border hover:bg-gray-500 w-full mt-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            // If we have potions prop (I will add it below), check length
                            // If length >= 3, show modal.
                            // Else call onSelectReward.
                            // I need to use the prop I'm about to add.
                            // Hack: Casting props to any to access new prop if TS complains, but I'm rewriting the interface so it's fine.
                            const props: any = { rewards, onSelectReward, onSkip, isLoading }; // implicit
                            // Actually, I'll just write the component correctly assuming the prop exists.
                            // But wait, I need to update App.tsx to pass it. I did that in the previous block description.
                            // Wait, I haven't added the prop to App.tsx yet in the XML. I will do that.
                            
                            // Let's use a local handler in the main return.
                        }}
                    >
                        獲得
                    </button>
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

// Re-defining with correct props including potions
const RewardScreenWithPotions: React.FC<RewardScreenProps & { currentPotions?: Potion[] }> = ({ rewards, onSelectReward, onSkip, isLoading, currentPotions = [] }) => {
  const [replaceReward, setReplaceReward] = useState<RewardItem | null>(null);

  useEffect(() => {
    if (!isLoading && rewards.length === 0) {
      const timer = setTimeout(() => {
        onSkip();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rewards, isLoading, onSkip]);

  const handlePotionClick = (reward: RewardItem) => {
      if (currentPotions.length >= 3) {
          setReplaceReward(reward);
      } else {
          onSelectReward(reward);
      }
  };

  const confirmReplace = (replaceId: string) => {
      if (!replaceReward) return;
      onSelectReward(replaceReward, replaceId);
      setReplaceReward(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-4">
      
      {/* Replacement Modal */}
      {replaceReward && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplaceReward(null)}>
               <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                   <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setReplaceReward(null)}>
                       <X size={24} className="text-gray-400 hover:text-white" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-4">ポーションがいっぱいです</h3>
                   <p className="text-sm text-gray-300 mb-6">どれを捨てて入れ替えますか？</p>
                   
                   <div className="flex justify-center gap-4 mb-4">
                        {currentPotions.map(p => (
                            <div 
                                key={p.id} 
                                className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => confirmReplace(p.id)}
                            >
                                <div className="w-12 h-12 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center mb-1">
                                    <FlaskConical size={24} style={{ color: p.color }} />
                                </div>
                                <div className="text-xs text-gray-400 w-16 truncate text-center">{p.name}</div>
                            </div>
                        ))}
                   </div>
                   
                   <button onClick={() => setReplaceReward(null)} className="mt-4 text-sm text-gray-500 hover:text-white underline">
                       やっぱりやめる
                   </button>
               </div>
           </div>
       )}

      <div className="z-10 text-center mb-4 shrink-0 pt-4">
        <h2 className="text-3xl md:text-4xl text-yellow-400 font-bold mb-2 flex items-center justify-center animate-pulse">
          <Gift className="mr-3" size={32} /> 勝利の報酬
        </h2>
        <p className="text-gray-300 text-sm">欲しい報酬を選択してください</p>
      </div>

      <div className={`z-10 flex flex-row items-center gap-8 w-full overflow-x-auto custom-scrollbar px-4 pt-20 pb-8 min-h-[420px] snap-x ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {rewards.map((reward) => (
          <div key={reward.id} className="snap-center shrink-0 transform hover:scale-105 transition-transform duration-200 flex justify-center">
            
            {reward.type === 'CARD' && (
                <div className="flex flex-col items-center w-48"> 
                    <div className="scale-110 mb-8 mt-6">
                        <Card card={reward.value as ICard} onClick={() => !isLoading && onSelectReward(reward)} disabled={isLoading} />
                    </div>
                    <button onClick={() => onSelectReward(reward)} className="mt-4 bg-blue-600 px-6 py-2 text-sm font-bold rounded border hover:bg-blue-500 shadow-lg w-full">カード獲得</button>
                </div>
            )}
            
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

            {reward.type === 'POTION' && (
                <div className="w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => handlePotionClick(reward)}>
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-white/50 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <FlaskConical size={40} style={{ color: (reward.value as Potion).color }} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-white font-bold text-lg mb-2 truncate">{reward.value.name}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{reward.value.description}</div>
                    </div>
                    <button className="bg-gray-600 px-6 py-2 text-sm font-bold rounded border hover:bg-gray-500 w-full mt-2">
                        {currentPotions.length >= 3 ? "入替" : "獲得"}
                    </button>
                </div>
            )}
          </div>
        ))}
        
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

export default RewardScreenWithPotions;
