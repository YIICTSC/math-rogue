
import React, { useState } from 'react';
import { Player, Card as ICard, Relic, Potion } from '../types';
import Card from './Card';
import { ShoppingBag, Trash2, Coins, Gem, FlaskConical } from 'lucide-react';

interface ShopScreenProps {
  player: Player;
  shopCards: ICard[];
  shopRelics?: Relic[];
  shopPotions?: Potion[]; // New
  onBuyCard: (card: ICard) => void;
  onBuyRelic: (relic: Relic) => void;
  onBuyPotion: (potion: Potion) => void; // New
  onRemoveCard: (cardId: string, cost: number) => void;
  onLeave: () => void;
}

const REMOVE_COST = 75;

const ShopScreen: React.FC<ShopScreenProps> = ({ player, shopCards, shopRelics = [], shopPotions = [], onBuyCard, onBuyRelic, onBuyPotion, onRemoveCard, onLeave }) => {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [removed, setRemoved] = useState(false);
  const [viewMode, setViewMode] = useState<'BUY' | 'REMOVE'>('BUY');

  const handleBuyCard = (card: ICard) => {
    if (purchasedIds.includes(card.id)) return;
    let price = card.price || 50;
    if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);

    if (player.gold >= price) {
        onBuyCard(card);
        setPurchasedIds([...purchasedIds, card.id]);
    }
  };

  const handleBuyRelic = (relic: Relic) => {
    if (purchasedIds.includes(relic.id)) return;
    let price = relic.price || 150;
    if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);

    if (player.gold >= price) {
        onBuyRelic(relic);
        setPurchasedIds([...purchasedIds, relic.id]);
    }
  };

  const handleBuyPotion = (potion: Potion) => {
      if (purchasedIds.includes(potion.id)) return;
      if (player.potions.length >= 3) return; // Full

      let price = potion.price || 50;
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);

      if (player.gold >= price) {
          onBuyPotion(potion);
          setPurchasedIds([...purchasedIds, potion.id]);
      }
  };

  const handleRemove = (cardId: string) => {
      let cost = REMOVE_COST;
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) cost = Math.floor(cost * 0.5);

      if (player.gold >= cost && !removed) {
          onRemoveCard(cardId, cost);
          setRemoved(true);
          setViewMode('BUY');
      }
  };

  const getPrice = (base: number) => {
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) return Math.floor(base * 0.5);
      return base;
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none bg-yellow-900"></div>

       {/* Header */}
       <div className="z-20 flex justify-between items-center bg-black/90 p-4 border-b-4 border-yellow-600 shadow-xl shrink-0">
           <div className="flex items-center">
               <ShoppingBag size={32} className="text-yellow-500 mr-2" />
               <div>
                   <h2 className="text-2xl font-bold text-yellow-100">怪しい商人</h2>
                   <p className="text-xs text-gray-400">「いいもの揃ってるよ...」</p>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
                <div className="flex items-center bg-yellow-900 px-4 py-2 rounded-full border border-yellow-500">
                    <Coins className="text-yellow-400 mr-2" />
                    <span className="text-xl font-bold">{player.gold} G</span>
                </div>
                <button onClick={onLeave} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-bold border-2 border-white cursor-pointer">
                    店を出る
                </button>
           </div>
       </div>

       {/* Content */}
       <div className="z-10 flex-grow flex flex-col items-center overflow-hidden relative">
           
           {/* Actions Toggle */}
           <div className="flex gap-4 my-6 shrink-0 z-30">
                <button 
                    onClick={() => setViewMode('BUY')}
                    className={`px-6 py-2 rounded border-2 cursor-pointer ${viewMode === 'BUY' ? 'bg-yellow-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                >
                    商品購入
                </button>
                <button 
                    onClick={() => setViewMode('REMOVE')}
                    disabled={removed || player.gold < getPrice(REMOVE_COST)}
                    className={`px-6 py-2 rounded border-2 flex items-center gap-2 cursor-pointer ${viewMode === 'REMOVE' ? 'bg-red-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'} ${removed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Trash2 size={16}/> カード削除 ({getPrice(REMOVE_COST)} G)
                </button>
           </div>

           {viewMode === 'BUY' && (
                <div className="flex-grow w-full overflow-y-auto custom-scrollbar">
                    
                    {/* Relics & Potions Section */}
                    {(shopRelics.length > 0 || shopPotions.length > 0) && (
                        <div className="flex justify-center flex-wrap gap-8 mb-8 border-b border-gray-700 pb-8 px-8">
                            {/* Relics */}
                            {shopRelics.map(relic => {
                                const isSold = purchasedIds.includes(relic.id);
                                const price = getPrice(relic.price || 150);
                                const canAfford = player.gold >= price;
                                return (
                                    <div key={relic.id} className={`group relative w-32 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}>
                                        <div className="w-20 h-20 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                                            <Gem className="text-yellow-400" size={32}/>
                                        </div>
                                        <div className="text-sm font-bold text-center">{relic.name}</div>
                                        <div className="text-[10px] text-gray-400 text-center mb-2 h-8 overflow-hidden">{relic.description}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyRelic(relic)}
                                                disabled={!canAfford}
                                                className={`px-3 py-1 rounded-full font-bold text-sm shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {price} G
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12">SOLD</div>}
                                    </div>
                                )
                            })}

                            {/* Potions */}
                            {shopPotions.map(potion => {
                                const isSold = purchasedIds.includes(potion.id);
                                const price = getPrice(potion.price || 50);
                                const canAfford = player.gold >= price && player.potions.length < 3;
                                const isFull = player.potions.length >= 3;

                                return (
                                    <div key={potion.id} className={`group relative w-32 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}>
                                        <div className="w-16 h-16 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-2 shadow-lg">
                                            <FlaskConical size={32} style={{ color: potion.color }}/>
                                        </div>
                                        <div className="text-sm font-bold text-center">{potion.name}</div>
                                        <div className="text-[10px] text-gray-400 text-center mb-2 h-8 overflow-hidden">{potion.description}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyPotion(potion)}
                                                disabled={!canAfford}
                                                className={`px-3 py-1 rounded-full font-bold text-sm shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {isFull ? '満杯' : `${price} G`}
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12">SOLD</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Cards Section */}
                    <div className="flex flex-wrap justify-center gap-8 p-4 pb-20">
                        {shopCards.map(card => {
                            const isSold = purchasedIds.includes(card.id);
                            const price = getPrice(card.price || 50);
                            const canAfford = player.gold >= price;

                            return (
                                <div key={card.id} className={`relative group transition-all ${isSold ? 'opacity-20 grayscale' : ''}`}>
                                    <Card 
                                        card={card} 
                                        onClick={() => handleBuyCard(card)} 
                                        disabled={isSold} 
                                    />
                                    {!isSold && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full text-center z-20">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleBuyCard(card); }}
                                                disabled={!canAfford}
                                                className={`
                                                    px-3 py-1 rounded-full font-bold text-sm shadow-lg border border-white
                                                    ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                                                `}
                                            >
                                                {price} G
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
           )}

           {viewMode === 'REMOVE' && (
               <div className="w-full max-w-5xl h-full overflow-y-auto p-4 bg-black/40 rounded border border-gray-700 custom-scrollbar mb-4">
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 pt-10">
                       {player.deck.map(card => (
                           <div key={card.id} className="scale-90 cursor-pointer hover:scale-100 transition-transform relative group" onClick={() => handleRemove(card.id)}>
                                <Card card={card} onClick={() => handleRemove(card.id)} disabled={false} />
                                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 transition-colors flex items-center justify-center rounded-lg z-20">
                                    <Trash2 className="opacity-0 group-hover:opacity-100 text-red-500 bg-black p-2 rounded-full border border-red-500" size={48} />
                                </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

       </div>
    </div>
  );
};

export default ShopScreen;
