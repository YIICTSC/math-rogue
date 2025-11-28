
import React, { useState } from 'react';
import { Player, Card as ICard } from '../types';
import Card from './Card';
import { Flame, Hammer, ArrowRight, FlaskConical, Plus } from 'lucide-react';
import { getUpgradedCard } from '../App';

interface RestScreenProps {
  player: Player;
  onRest: () => void;
  onUpgrade: (card: ICard) => void;
  onSynthesize: (c1: ICard, c2: ICard) => void;
  onLeave: () => void;
}

const RestScreen: React.FC<RestScreenProps> = ({ player, onRest, onUpgrade, onSynthesize, onLeave }) => {
  const [mode, setMode] = useState<'CHOICE' | 'UPGRADE' | 'SYNTHESIS' | 'PREVIEW_UPGRADE' | 'PREVIEW_SYNTHESIS' | 'DONE'>('CHOICE');
  const [message, setMessage] = useState("静かな教室を見つけた。休憩できそうだ...");
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [synthCards, setSynthCards] = useState<ICard[]>([]);

  const healAmount = Math.floor(player.maxHp * 0.3);

  const handleRest = () => {
      onRest();
      setMode('DONE');
      setMessage(`昼寝をしてHPが ${healAmount} 回復した。体力がみなぎる！`);
  };

  const handleSmithChoice = () => {
      setMode('UPGRADE');
      setMessage("どの道具（カード）を改良する？");
  };

  const handleSynthesizeChoice = () => {
      if (player.deck.length < 2) {
          setMessage("カードが足りなくて合成できない...");
          return;
      }
      setMode('SYNTHESIS');
      setSynthCards([]);
      setMessage("合体させたいカードを2枚選んでね。");
  };

  const handleCardClick = (card: ICard) => {
      if (mode === 'UPGRADE') {
          if (card.upgraded) return;
          setSelectedCard(card);
          setMode('PREVIEW_UPGRADE');
          setMessage("このカードを強化しますか？");
      } else if (mode === 'SYNTHESIS') {
          if (synthCards.find(c => c.id === card.id)) {
              // Deselect
              setSynthCards(synthCards.filter(c => c.id !== card.id));
          } else {
              if (synthCards.length < 2) {
                  const newSelection = [...synthCards, card];
                  setSynthCards(newSelection);
                  if (newSelection.length === 2) {
                      setMode('PREVIEW_SYNTHESIS');
                      setMessage("この2枚を合体させますか？（元のカードは消えます）");
                  }
              }
          }
      }
  };

  const confirmUpgrade = () => {
      if (selectedCard) {
          onUpgrade(selectedCard);
          setMode('DONE');
          setMessage(`${selectedCard.name} が強化された！使いやすくなったようだ。`);
          setSelectedCard(null);
      }
  };

  const confirmSynthesize = () => {
      if (synthCards.length === 2) {
          onSynthesize(synthCards[0], synthCards[1]);
          setMode('DONE');
          setMessage("カードが融合し、新たな力が生まれた！");
          setSynthCards([]);
      }
  };

  const cancelPreview = () => {
      if (mode === 'PREVIEW_UPGRADE') {
          setMode('UPGRADE');
          setSelectedCard(null);
          setMessage("どのカードを鍛える？");
      } else if (mode === 'PREVIEW_SYNTHESIS') {
          setMode('SYNTHESIS');
          setSynthCards([]); // Clear selection to restart or keep? Let's clear for simplicity
          setMessage("合体させたいカードを2枚選んでね。");
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative items-center justify-center p-4 md:p-8">
        
        <div className="z-10 bg-black p-6 md:p-8 border-4 border-orange-800 rounded-lg max-w-4xl w-full text-center shadow-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-3xl md:text-4xl text-orange-500 font-bold mb-4 flex items-center justify-center shrink-0">
                <Flame className="mr-3 animate-pulse" /> 放課後の教室
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 min-h-[3rem] shrink-0 whitespace-pre-wrap">{message}</p>

            {mode === 'CHOICE' && (
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    <button 
                        onClick={handleRest}
                        className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-green-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        <Flame size={40} className="text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg">休憩</span>
                        <span className="text-xs text-gray-400">HP {healAmount} 回復</span>
                    </button>

                    <button 
                        onClick={handleSmithChoice}
                        className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-yellow-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        <Hammer size={40} className="text-yellow-500 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-lg">工夫</span>
                        <span className="text-xs text-gray-400">カードを1枚強化</span>
                    </button>

                    <button 
                        onClick={handleSynthesizeChoice}
                        className="group flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-purple-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        <FlaskConical size={40} className="text-purple-500 group-hover:shake transition-transform" />
                        <span className="font-bold text-lg">実験</span>
                        <span className="text-xs text-gray-400">2枚を合体</span>
                    </button>
                </div>
            )}

            {(mode === 'UPGRADE' || mode === 'SYNTHESIS') && (
                <div className="flex flex-col items-center flex-grow overflow-hidden">
                     <div className="flex flex-wrap justify-center gap-4 overflow-y-auto w-full p-4 border-inner bg-gray-900/50 rounded custom-scrollbar">
                        {player.deck.filter(c => mode === 'SYNTHESIS' ? true : !c.upgraded).map(card => {
                            const isSelected = synthCards.some(s => s.id === card.id);
                            return (
                                <div 
                                    key={card.id} 
                                    className={`scale-75 md:scale-90 transition-transform cursor-pointer relative ${isSelected ? 'ring-4 ring-purple-500 rounded-lg scale-95' : 'hover:scale-100'}`} 
                                    onClick={() => handleCardClick(card)}
                                >
                                    <Card card={card} onClick={() => handleCardClick(card)} disabled={false} />
                                    {isSelected && <div className="absolute top-0 right-0 bg-purple-600 text-white rounded-full p-1"><FlaskConical size={16}/></div>}
                                </div>
                            );
                        })}
                        {mode === 'UPGRADE' && player.deck.every(c => c.upgraded) && <p className="text-gray-500">強化できるカードがない...</p>}
                     </div>
                     <button onClick={() => { setMode('CHOICE'); setSynthCards([]); }} className="mt-4 text-gray-400 underline hover:text-white shrink-0">戻る</button>
                </div>
            )}

            {mode === 'PREVIEW_UPGRADE' && selectedCard && (
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
                        <div className="scale-90 md:scale-100">
                             <Card card={selectedCard} onClick={() => {}} disabled={false} />
                             <div className="text-center mt-2 text-gray-400">強化前</div>
                        </div>
                        <ArrowRight size={32} className="text-yellow-500 animate-pulse" />
                        <div className="scale-100 md:scale-110">
                             <Card card={getUpgradedCard(selectedCard)} onClick={() => {}} disabled={false} />
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

            {mode === 'PREVIEW_SYNTHESIS' && synthCards.length === 2 && (
                <div className="flex flex-col items-center flex-grow overflow-y-auto custom-scrollbar w-full">
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4 flex-grow content-center">
                        <div className="scale-[0.65] md:scale-90 origin-center">
                             <Card card={synthCards[0]} onClick={() => {}} disabled={false} />
                        </div>
                        <Plus size={20} className="text-gray-500" />
                        <div className="scale-[0.65] md:scale-90 origin-center">
                             <Card card={synthCards[1]} onClick={() => {}} disabled={false} />
                        </div>
                        <ArrowRight size={24} className="text-purple-500 animate-pulse mx-1 md:mx-2" />
                        
                        <div className="w-24 h-36 md:w-32 md:h-48 border-4 border-purple-500 bg-black rounded-lg flex flex-col items-center justify-center animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.6)] shrink-0">
                            <FlaskConical size={32} className="text-purple-400 mb-2" />
                            <div className="text-purple-200 font-bold text-sm">???</div>
                            <div className="text-[10px] text-purple-400 mt-1">融合中...</div>
                        </div>
                    </div>
                    <div className="flex gap-4 pb-4 shrink-0 justify-center">
                        <button onClick={confirmSynthesize} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold border border-white shadow-lg whitespace-nowrap">
                            合体！
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg border border-gray-400 whitespace-nowrap">
                            戻る
                        </button>
                    </div>
                </div>
            )}

            {mode === 'DONE' && (
                <button 
                    onClick={onLeave}
                    className="bg-orange-700 hover:bg-orange-600 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg animate-bounce mt-8 mx-auto"
                >
                    出発する
                </button>
            )}
        </div>
    </div>
  );
};

export default RestScreen;
