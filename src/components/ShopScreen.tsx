
import React, { useState } from 'react';
import { Player, Card as ICard, Relic, Potion } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { ShoppingBag, Trash2, Coins, Gem, FlaskConical, X } from 'lucide-react';

interface ShopScreenProps {
  player: Player;
  shopCards: ICard[];
  shopRelics?: Relic[];
  shopPotions?: Potion[]; 
  onBuyCard: (card: ICard) => void;
  onBuyRelic: (relic: Relic) => void;
  onBuyPotion: (potion: Potion) => void; 
  onRemoveCard: (cardId: string, cost: number) => void;
  onLeave: () => void;
}

const REMOVE_COST = 75;

const ShopScreen: React.FC<ShopScreenProps> = ({ player, shopCards, shopRelics = [], shopPotions = [], onBuyCard, onBuyRelic, onBuyPotion, onRemoveCard, onLeave }) => {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [removed, setRemoved] = useState(false);
  const [viewMode, setViewMode] = useState<'BUY' | 'REMOVE'>('BUY');
  
  // Inspection State
  const [inspectedItem, setInspectedItem] = useState<{
      type: 'CARD' | 'RELIC' | 'POTION';
      data: any;
  } | null>(null);

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
      // We don't check full here, App handles replacement logic.
      // But we still check gold.
      let price = potion.price || 50;
      if (player.relics.find(r => r.id === 'MEMBERSHIP_CARD')) price = Math.floor(price * 0.5);

      if (player.gold >= price) {
          onBuyPotion(potion);
          // Note: If swap is cancelled in App, this state shouldn't ideally update, 
          // but for shop logic it's simpler to assume success or let user try again if logic permits.
          // Since App.tsx handles the actual "add to inventory" and deduction, 
          // we only mark purchased if we trust the flow. 
          // However, due to the async nature of the modal in App.tsx, we can't easily know if they cancelled.
          // For now, we won't mark as sold immediately if it might be cancelled, 
          // OR we accept that clicking it triggers the process and if they cancel, they can click again.
          // We will NOT add to purchasedIds immediately for potions to allow retry if cancelled.
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

  const getProcessedDescription = (card: ICard) => {
      let desc = card.description;
      if (card.damage !== undefined) desc = desc.replace(/(\d+)ダメージ/g, `${card.damage}ダメージ`);
      if (card.block !== undefined) desc = desc.replace(/ブロック(\d+)/g, `ブロック${card.block}`);
      return desc;
  };

  const getCardKeywords = (card: ICard) => {
      const keywords = [];
      if (card.exhaust) keywords.push(KEYWORD_DEFINITIONS.EXHAUST);
      if (card.strength) keywords.push(KEYWORD_DEFINITIONS.STRENGTH);
      // ... others
      if (card.block) keywords.push(KEYWORD_DEFINITIONS.BLOCK);
      return keywords;
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'RELIC' | 'POTION', data: any) => {
      e.preventDefault();
      setInspectedItem({ type, data });
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
       
       {/* Header */}
       <div className="z-20 flex justify-between items-center bg-black/90 p-3 border-b-4 border-yellow-600 shadow-xl shrink-0">
           <div className="flex items-center">
               <ShoppingBag size={24} className="text-yellow-500 mr-2" />
               <div>
                   <h2 className="text-xl font-bold text-yellow-100">購買部</h2>
                   <p className="text-xs text-gray-400">「へいらっしゃい！」</p>
               </div>
           </div>
           
           <div className="flex items-center gap-2">
                <div className="flex items-center bg-yellow-900 px-3 py-1 rounded-full border border-yellow-500">
                    <Coins className="text-yellow-400 mr-1" size={16}/>
                    <span className="text-sm font-bold">{player.gold}円</span>
                </div>
                <button onClick={onLeave} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded font-bold border-2 border-white cursor-pointer text-xs">
                    出る
                </button>
           </div>
       </div>

       {/* Inspection Modal */}
       {inspectedItem && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
                <div className="bg-gray-800 border-4 border-white w-full max-w-sm p-6 rounded-lg shadow-2xl relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>

                    {inspectedItem.type === 'CARD' && (
                        <>
                            <div className="scale-125 mb-6"><Card card={inspectedItem.data} onClick={() => {}} disabled={false} /></div>
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">{inspectedItem.data.name}</h3>
                            <p className="text-gray-300 text-center text-sm">{getProcessedDescription(inspectedItem.data)}</p>
                        </>
                    )}

                    {inspectedItem.type === 'RELIC' && (
                        <>
                            <div className="w-24 h-24 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                <Gem className="text-yellow-400" size={48}/>
                            </div>
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">{inspectedItem.data.name}</h3>
                            <div className="bg-black/50 p-2 rounded text-xs text-gray-400 mb-4">{inspectedItem.data.rarity} Relic</div>
                            <p className="text-white text-center">{inspectedItem.data.description}</p>
                        </>
                    )}

                    {inspectedItem.type === 'POTION' && (
                        <>
                            <div className="w-24 h-24 bg-gray-800 border-2 border-white/50 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                <FlaskConical size={48} style={{ color: inspectedItem.data.color }}/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{inspectedItem.data.name}</h3>
                            <div className="bg-black/50 p-2 rounded text-xs text-gray-400 mb-4">{inspectedItem.data.rarity} Potion</div>
                            <p className="text-white text-center">{inspectedItem.data.description}</p>
                        </>
                    )}
                </div>
            </div>
       )}

       {/* Content */}
       <div className="z-10 flex-grow flex flex-col items-center overflow-hidden relative">
           
           <div className="flex gap-2 my-4 shrink-0 z-30 w-full justify-center px-4">
                <button 
                    onClick={() => setViewMode('BUY')}
                    className={`flex-1 py-2 rounded border-2 cursor-pointer text-sm ${viewMode === 'BUY' ? 'bg-yellow-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                >
                    購入
                </button>
                <button 
                    onClick={() => setViewMode('REMOVE')}
                    disabled={removed || player.gold < getPrice(REMOVE_COST)}
                    className={`flex-1 py-2 rounded border-2 flex items-center justify-center gap-1 cursor-pointer text-sm ${viewMode === 'REMOVE' ? 'bg-red-600 border-white' : 'bg-gray-800 border-gray-600 text-gray-400'} ${removed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Trash2 size={14}/> カード削除 ({getPrice(REMOVE_COST)} 円)
                </button>
           </div>

           {viewMode === 'BUY' && (
                <div className="flex-grow w-full overflow-y-auto custom-scrollbar pb-20">
                    
                    {(shopRelics.length > 0 || shopPotions.length > 0) && (
                        <div className="flex justify-center flex-wrap gap-4 mb-6 border-b border-gray-700 pb-6 px-4">
                            {/* Relics */}
                            {shopRelics.map(relic => {
                                const isSold = purchasedIds.includes(relic.id);
                                const price = getPrice(relic.price || 150);
                                const canAfford = player.gold >= price;
                                return (
                                    <div 
                                        key={relic.id} 
                                        className={`group relative w-28 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}
                                        onContextMenu={(e) => handleContextMenu(e, 'RELIC', relic)}
                                        onClick={() => { /* Mobile tap to inspect if simpler? stick to buy logic for click */ }}
                                    >
                                        <div className="w-16 h-16 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-2 shadow-lg cursor-help" onClick={(e) => { e.stopPropagation(); setInspectedItem({ type: 'RELIC', data: relic }); }}>
                                            <Gem className="text-yellow-400" size={24}/>
                                        </div>
                                        <div className="text-xs font-bold text-center truncate w-full">{relic.name}</div>
                                        <div className="text-[9px] text-gray-400 text-center mb-2 h-8 overflow-hidden leading-tight">{relic.description}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyRelic(relic)}
                                                disabled={!canAfford}
                                                className={`px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {price} 円
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12 text-xs">売切れ</div>}
                                    </div>
                                )
                            })}

                            {/* Potions */}
                            {shopPotions.map(potion => {
                                const isSold = purchasedIds.includes(potion.id);
                                const price = getPrice(potion.price || 50);
                                const canAfford = player.gold >= price; // Check handled in App logic for full belt
                                const isFull = player.potions.length >= 3; 

                                return (
                                    <div 
                                        key={potion.id} 
                                        className={`group relative w-28 flex flex-col items-center ${isSold ? 'opacity-20 grayscale' : ''}`}
                                        onContextMenu={(e) => handleContextMenu(e, 'POTION', potion)}
                                    >
                                        <div className="w-12 h-12 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-2 shadow-lg cursor-help" onClick={(e) => { e.stopPropagation(); setInspectedItem({ type: 'POTION', data: potion }); }}>
                                            <FlaskConical size={24} style={{ color: potion.color }}/>
                                        </div>
                                        <div className="text-xs font-bold text-center truncate w-full">{potion.name}</div>
                                        <div className="text-[9px] text-gray-400 text-center mb-2 h-8 overflow-hidden leading-tight">{potion.description}</div>
                                        
                                        {!isSold && (
                                            <button 
                                                onClick={() => handleBuyPotion(potion)}
                                                disabled={!canAfford}
                                                className={`px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {isFull ? '入替' : ''} {price} 円
                                            </button>
                                        )}
                                        {isSold && <div className="text-red-500 font-bold rotate-12 text-xs">売切れ</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Cards Section */}
                    <div className="flex flex-wrap justify-center gap-4 p-2">
                        {shopCards.map(card => {
                            const isSold = purchasedIds.includes(card.id);
                            const price = getPrice(card.price || 50);
                            const canAfford = player.gold >= price;

                            return (
                                <div key={card.id} className={`relative group transition-all scale-90 ${isSold ? 'opacity-20 grayscale' : ''}`}>
                                    <Card 
                                        card={card} 
                                        onClick={() => handleBuyCard(card)} 
                                        disabled={isSold} 
                                        onInspect={() => setInspectedItem({ type: 'CARD', data: card })}
                                    />
                                    {!isSold && (
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full text-center z-20">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleBuyCard(card); }}
                                                disabled={!canAfford}
                                                className={`
                                                    px-2 py-0.5 rounded-full font-bold text-xs shadow-lg border border-white
                                                    ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                                                `}
                                            >
                                                {price} 円
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
               <div className="w-full h-full overflow-y-auto p-4 bg-black/40 rounded custom-scrollbar mb-4">
                   <div className="grid grid-cols-3 gap-2 pt-4">
                       {player.deck.map(card => (
                           <div key={card.id} className="scale-75 origin-top-left w-24 h-36 cursor-pointer relative group" onClick={() => handleRemove(card.id)}>
                                <Card card={card} onClick={() => handleRemove(card.id)} disabled={false} onInspect={() => setInspectedItem({ type: 'CARD', data: card })} />
                                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/20 transition-colors flex items-center justify-center rounded-lg z-20">
                                    <Trash2 className="opacity-0 group-hover:opacity-100 text-red-500 bg-black p-2 rounded-full border border-red-500" size={32} />
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
