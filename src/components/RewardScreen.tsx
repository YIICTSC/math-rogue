
import React, { useEffect, useState, useRef } from 'react';
import { Card as ICard, RewardItem, Potion } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { Gift, Gem, Coins, FlaskConical, X } from 'lucide-react';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem, replacePotionId?: string) => void;
  onSkip: () => void;
  isLoading: boolean;
  currentPotions?: Potion[];
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading, currentPotions = [] }) => {
  const [replaceReward, setReplaceReward] = useState<RewardItem | null>(null);
  
  const [inspectedItem, setInspectedItem] = useState<{ type: 'CARD' | 'RELIC' | 'POTION', data: any } | null>(null);
  const longPressTimer = useRef<any>(null);

  const handleTouchStart = (itemType: 'RELIC' | 'POTION', data: any) => {
      longPressTimer.current = setTimeout(() => {
          setInspectedItem({ type: itemType, data });
      }, 500);
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

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

  const getCardKeywords = (card: ICard) => {
      const keywords = [];
      if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
      if (card.strength || card.description.includes('ムキムキ')) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
      if (card.vulnerable || card.description.includes('びくびく')) keywords.push(KEYWORD_DEFINITIONS.VULNERABLE);
      if (card.weak || card.description.includes('へろへろ')) keywords.push(KEYWORD_DEFINITIONS.WEAK);
      if (card.block || card.description.includes('ブロック')) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
      if (card.draw || card.description.includes('引く')) keywords.push(KEYWORD_DEFINITIONS.DRAW);
      return keywords;
  };

  const getProcessedDescription = (card: ICard) => {
      let desc = card.description;
      if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}ダメージ`);
      if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `ブロック${card.block}`);
      if (card.poison !== undefined) desc = desc.replace(/ドクドク(\d+)/g, `ドクドク${card.poison}`);
      if (card.weak !== undefined) desc = desc.replace(/へろへろ(\d+)/g, `へろへろ${card.weak}`);
      if (card.vulnerable !== undefined) desc = desc.replace(/びくびく(\d+)/g, `びくびく${card.vulnerable}`);
      if (card.strength !== undefined) desc = desc.replace(/ムキムキ(\d+)/g, `ムキムキ${card.strength}`);
      return desc;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative p-4">
      
      {/* Inspection Modal */}
       {inspectedItem && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
                <div className="bg-gray-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center mb-4">
                        {inspectedItem.type === 'CARD' && (
                            <div className="scale-100 mb-4">
                                <Card card={inspectedItem.data} onClick={() => {}} disabled={false} />
                            </div>
                        )}
                        {inspectedItem.type === 'RELIC' && (
                            <div className="w-20 h-20 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <Gem className="text-yellow-400" size={40}/>
                            </div>
                        )}
                        {inspectedItem.type === 'POTION' && (
                            <div className="w-20 h-20 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-4 shadow-lg">
                                <FlaskConical size={40} style={{ color: inspectedItem.data.color }}/>
                            </div>
                        )}
                        
                        <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2 text-center w-full">
                            {inspectedItem.data.name}
                        </h3>
                    </div>

                    <div className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded text-center">
                        {inspectedItem.type === 'CARD' ? getProcessedDescription(inspectedItem.data) : inspectedItem.data.description}
                    </div>
                    
                    {/* Keywords List for Cards */}
                    {inspectedItem.type === 'CARD' && (
                        <div className="space-y-2">
                            {getCardKeywords(inspectedItem.data).map((k, idx) => (
                                <div key={idx} className="flex flex-col text-left text-sm bg-gray-700/50 p-2 rounded">
                                    <span className="font-bold text-yellow-300 mb-0.5">{k.title}</span>
                                    <span className="text-gray-300 text-xs">{k.desc}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

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
                        <Card 
                            card={reward.value as ICard} 
                            onClick={() => !isLoading && onSelectReward(reward)} 
                            disabled={isLoading} 
                            onInspect={(c) => setInspectedItem({ type: 'CARD', data: c })}
                        />
                    </div>
                    <button onClick={() => onSelectReward(reward)} className="mt-4 bg-blue-600 px-6 py-2 text-sm font-bold rounded border hover:bg-blue-500 shadow-lg w-full">カード獲得</button>
                </div>
            )}
            
            {reward.type === 'RELIC' && (
                <div 
                    className="w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => onSelectReward(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'RELIC', data: reward.value }); }}
                    onTouchStart={() => handleTouchStart('RELIC', reward.value)}
                    onTouchEnd={handleTouchEnd}
                >
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
                <div 
                    className="w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => handlePotionClick(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'POTION', data: reward.value }); }}
                    onTouchStart={() => handleTouchStart('POTION', reward.value)}
                    onTouchEnd={handleTouchEnd}
                >
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

export default RewardScreen;
