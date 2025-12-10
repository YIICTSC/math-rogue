
import React, { useState } from 'react';
import { Player, Card as ICard } from '../types';
import Card from './Card';
import { Flame, Hammer, ArrowUpCircle, ArrowRight } from 'lucide-react';
import { calculateUpgrade } from '../App';

interface RestScreenProps {
  player: Player;
  onRest: () => void;
  onUpgrade: (card: ICard) => void;
  onLeave: () => void;
}

const RestScreen: React.FC<RestScreenProps> = ({ player, onRest, onUpgrade, onLeave }) => {
  const [mode, setMode] = useState<'CHOICE' | 'UPGRADE' | 'PREVIEW' | 'DONE'>('CHOICE');
  const [message, setMessage] = useState("焚き火を見つけた。温かい...");
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);

  const healAmount = Math.floor(player.maxHp * 0.3);

  const handleRest = () => {
      onRest();
      setMode('DONE');
      setMessage(`HPが ${healAmount} 回復した。体力がみなぎる！`);
  };

  const handleSmithChoice = () => {
      setMode('UPGRADE');
      setMessage("どのカードを鍛える？");
  };

  const handleCardClick = (card: ICard) => {
      if (card.upgraded) return;
      setSelectedCard(card);
      setMode('PREVIEW');
      setMessage("このカードを強化しますか？");
  };

  const confirmUpgrade = () => {
      if (selectedCard) {
          onUpgrade(selectedCard);
          setMode('DONE');
          setMessage(`${selectedCard.name} が強化された！切れ味が増したようだ。`);
          setSelectedCard(null);
      }
  };

  const cancelPreview = () => {
      setMode('UPGRADE');
      setSelectedCard(null);
      setMessage("どのカードを鍛える？");
  };

  const getUpgradedVersion = (card: ICard): ICard => {
      return {
          ...card,
          upgraded: true,
          damage: calculateUpgrade(card.damage),
          block: calculateUpgrade(card.block)
      };
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-8">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/800/600?grayscale&blur=4')] opacity-30 bg-cover pointer-events-none"></div>
        
        <div className="z-10 bg-black/80 p-8 border-4 border-orange-800 rounded-lg max-w-4xl w-full text-center shadow-2xl">
            <h2 className="text-4xl text-orange-500 font-bold mb-4 flex items-center justify-center">
                <Flame className="mr-3 animate-pulse" /> 休息の地
            </h2>
            <p className="text-xl text-gray-300 mb-8 min-h-[3rem]">{message}</p>

            {mode === 'CHOICE' && (
                <div className="flex justify-center gap-8">
                    <button 
                        onClick={handleRest}
                        className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-green-500 rounded-lg hover:bg-gray-800 transition-all w-40"
                    >
                        <Flame size={48} className="text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg">休憩</span>
                        <span className="text-xs text-gray-400">HP {healAmount} 回復</span>
                    </button>

                    <button 
                        onClick={handleSmithChoice}
                        className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-yellow-500 rounded-lg hover:bg-gray-800 transition-all w-40"
                    >
                        <Hammer size={48} className="text-yellow-500 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-lg">鍛冶</span>
                        <span className="text-xs text-gray-400">カードを1枚強化</span>
                    </button>
                </div>
            )}

            {mode === 'UPGRADE' && (
                <div className="flex flex-col items-center h-[50vh]">
                     <div className="flex flex-wrap justify-center gap-4 overflow-y-auto w-full p-4 border-inner bg-gray-900/50 rounded custom-scrollbar">
                        {player.deck.filter(c => !c.upgraded).map(card => (
                            <div key={card.id} className="scale-75 hover:scale-90 transition-transform cursor-pointer" onClick={() => handleCardClick(card)}>
                                <Card card={card} onClick={() => handleCardClick(card)} disabled={false} />
                            </div>
                        ))}
                        {player.deck.every(c => c.upgraded) && <p className="text-gray-500">強化できるカードがない...</p>}
                     </div>
                     <button onClick={() => setMode('CHOICE')} className="mt-4 text-gray-400 underline hover:text-white">戻る</button>
                </div>
            )}

            {mode === 'PREVIEW' && selectedCard && (
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center gap-8 mb-8">
                        <div className="scale-100">
                             <Card card={selectedCard} onClick={() => {}} disabled={true} />
                             <div className="text-center mt-2 text-gray-400">強化前</div>
                        </div>
                        <ArrowRight size={32} className="text-yellow-500 animate-pulse" />
                        <div className="scale-110">
                             <Card card={getUpgradedVersion(selectedCard)} onClick={() => {}} disabled={true} />
                             <div className="text-center mt-2 text-green-400 font-bold">強化後</div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={confirmUpgrade} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded font-bold border border-white">
                            強化する
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-2 rounded border border-gray-400">
                            やめる
                        </button>
                    </div>
                </div>
            )}

            {mode === 'DONE' && (
                <button 
                    onClick={onLeave}
                    className="bg-orange-700 hover:bg-orange-600 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg animate-bounce"
                >
                    出発する
                </button>
            )}
        </div>
    </div>
  );
};

export default RestScreen;
