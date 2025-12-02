
import React, { useState } from 'react';
import { Card as ICard, Player } from '../types';
import Card from './Card';
import { X, FlaskConical, Plus, ArrowRight } from 'lucide-react';

interface DebugMenuScreenProps {
    player: Player;
    onClose: () => void;
    onSynthesize: (c1: ICard, c2: ICard) => ICard;
}

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({ player, onClose, onSynthesize }) => {
    const [synthSlot1, setSynthSlot1] = useState<ICard | null>(null);
    const [synthSlot2, setSynthSlot2] = useState<ICard | null>(null);
    const [synthResult, setSynthResult] = useState<ICard | null>(null);

    const handleCardSelect = (card: ICard) => {
        if (!synthSlot1) {
            setSynthSlot1(card);
        } else if (!synthSlot2 && card.id !== synthSlot1.id) {
            setSynthSlot2(card);
        }
    };

    const performSynthesis = () => {
        if (!synthSlot1 || !synthSlot2) return;
        const result = onSynthesize(synthSlot1, synthSlot2);
        setSynthResult(result);
        setSynthSlot1(null);
        setSynthSlot2(null);
    };

    const reset = () => {
        setSynthSlot1(null);
        setSynthSlot2(null);
        setSynthResult(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white p-4 relative">
            <button onClick={onClose} className="absolute top-4 right-4 bg-red-600 p-2 rounded z-20">
                <X />
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center"><FlaskConical className="mr-2"/> Debug Synthesis</h2>
            
            <div className="flex items-center justify-center gap-4 mb-8 bg-gray-800 p-4 rounded">
                <div className="w-32 h-48 border-2 border-dashed border-gray-500 flex items-center justify-center rounded">
                    {synthSlot1 ? <Card card={synthSlot1} onClick={() => setSynthSlot1(null)} disabled={false} /> : "Slot 1"}
                </div>
                <Plus />
                <div className="w-32 h-48 border-2 border-dashed border-gray-500 flex items-center justify-center rounded">
                    {synthSlot2 ? <Card card={synthSlot2} onClick={() => setSynthSlot2(null)} disabled={false} /> : "Slot 2"}
                </div>
                <ArrowRight />
                <div className="w-32 h-48 border-2 border-yellow-500 flex items-center justify-center rounded bg-black">
                    {synthResult ? <Card card={synthResult} onClick={() => {}} disabled={false} /> : "Result"}
                </div>
            </div>

            <div className="flex justify-center gap-4 mb-4">
                <button onClick={performSynthesis} disabled={!synthSlot1 || !synthSlot2} className="bg-purple-600 px-6 py-2 rounded disabled:opacity-50">Synthesize</button>
                <button onClick={reset} className="bg-gray-600 px-6 py-2 rounded">Reset</button>
            </div>

            <div className="flex-grow overflow-y-auto bg-black/50 p-4 rounded">
                <h3 className="mb-2 font-bold">Player Deck</h3>
                <div className="flex flex-wrap gap-2">
                    {player.deck.map(card => (
                        <div key={card.id} className="scale-75 origin-top-left w-24 h-36">
                            <Card 
                                card={card} 
                                onClick={() => handleCardSelect(card)} 
                                disabled={synthSlot1?.id === card.id || synthSlot2?.id === card.id} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugMenuScreen;
