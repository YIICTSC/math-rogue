
import React, { useState } from 'react';
import { Player, Card as ICard, GameState } from '../types';
import { CARDS_LIBRARY } from '../constants';
import { storageService } from '../services/storageService';
import { ArrowLeft, Save, Trash2, Plus, Zap, Skull, Settings } from 'lucide-react';

interface DebugMenuScreenProps {
  player: Player;
  onUpdatePlayer: (p: Player) => void;
  onBack: () => void;
  onResetProgress: () => void;
  gameState: GameState;
}

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({ player, onUpdatePlayer, onBack, onResetProgress, gameState }) => {
  const [addCardId, setAddCardId] = useState<string>('STRIKE');
  const [debugMathSkip, setDebugMathSkip] = useState(storageService.getDebugMathSkip());
  const [debugHpOne, setDebugHpOne] = useState(storageService.getDebugHpOne());

  const handleAddCard = () => {
      const template = CARDS_LIBRARY[addCardId];
      if (template) {
          const newCard: ICard = { ...template, id: `debug-${Date.now()}` };
          onUpdatePlayer({ ...player, deck: [...player.deck, newCard] });
      }
  };

  const handleHeal = () => {
      onUpdatePlayer({ ...player, currentHp: player.maxHp });
  };

  const handleAddGold = () => {
      onUpdatePlayer({ ...player, gold: player.gold + 100 });
  };

  const handleTakeDamage = () => {
      onUpdatePlayer({ ...player, currentHp: Math.max(1, player.currentHp - 10) });
  };

  const toggleMathSkip = () => {
      const newVal = !debugMathSkip;
      setDebugMathSkip(newVal);
      storageService.saveDebugMathSkip(newVal);
  };

  const toggleHpOne = () => {
      const newVal = !debugHpOne;
      setDebugHpOne(newVal);
      storageService.saveDebugHpOne(newVal);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative p-8">
        <div className="z-10 bg-black/80 border-2 border-red-500 p-6 rounded-lg max-w-2xl mx-auto shadow-2xl overflow-y-auto max-h-full">
            <h2 className="text-3xl font-bold text-red-500 mb-6 flex items-center">
                <Settings className="mr-2" /> DEBUG MENU
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                    <h3 className="font-bold border-b border-gray-700 pb-2">Player Stats</h3>
                    <button onClick={handleHeal} className="w-full bg-green-700 hover:bg-green-600 py-2 rounded text-sm font-bold flex items-center justify-center">
                        <Plus size={16} className="mr-2"/> Full Heal
                    </button>
                    <button onClick={handleTakeDamage} className="w-full bg-red-700 hover:bg-red-600 py-2 rounded text-sm font-bold flex items-center justify-center">
                        <Skull size={16} className="mr-2"/> Take 10 Dmg
                    </button>
                    <button onClick={handleAddGold} className="w-full bg-yellow-700 hover:bg-yellow-600 py-2 rounded text-sm font-bold flex items-center justify-center">
                        <Zap size={16} className="mr-2"/> +100 Gold
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold border-b border-gray-700 pb-2">Deck Management</h3>
                    <div className="flex gap-2">
                        <select 
                            value={addCardId} 
                            onChange={(e) => setAddCardId(e.target.value)}
                            className="bg-gray-800 border border-gray-600 text-white text-xs p-2 rounded flex-grow"
                        >
                            {Object.keys(CARDS_LIBRARY).map(key => (
                                <option key={key} value={key}>{CARDS_LIBRARY[key].name}</option>
                            ))}
                        </select>
                        <button onClick={handleAddCard} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-sm font-bold">Add</button>
                    </div>
                    <div className="text-xs text-gray-400">
                        Deck Size: {player.deck.length}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold border-b border-gray-700 pb-2 mb-4">Settings</h3>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={debugMathSkip} onChange={toggleMathSkip} className="w-4 h-4"/>
                        <span className="text-sm">Skip Math Challenges (Auto Correct)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={debugHpOne} onChange={toggleHpOne} className="w-4 h-4"/>
                        <span className="text-sm">Enemies have 1 HP</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <button onClick={onResetProgress} className="bg-red-900 hover:bg-red-800 text-red-200 px-4 py-2 rounded text-sm flex items-center">
                    <Trash2 size={16} className="mr-2"/> Reset Save Data
                </button>
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold flex items-center">
                    <ArrowLeft size={16} className="mr-2"/> Back
                </button>
            </div>
        </div>
    </div>
  );
};

export default DebugMenuScreen;
