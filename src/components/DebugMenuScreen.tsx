
import React, { useMemo, useState } from 'react';
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } from '../constants';
import { Card as ICard, Relic, Potion, CardType, TargetType } from '../types';
import Card from './Card';
import { ArrowRight, Trash2, Plus, Gem, FlaskConical, Swords, Shield, Zap, Search, Beaker, RotateCcw } from 'lucide-react';

interface DebugMenuScreenProps {
  onStart: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
  onBack: () => void;
}

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({ onStart, onBack }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'SYNTHESIS'>('CARDS');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection State
  const [selectedDeck, setSelectedDeck] = useState<ICard[]>([]);
  const [selectedRelics, setSelectedRelics] = useState<Relic[]>([]);
  const [selectedPotions, setSelectedPotions] = useState<Potion[]>([]);

  // Synthesis State
  const [synthSlot1, setSynthSlot1] = useState<ICard | null>(null);
  const [synthSlot2, setSynthSlot2] = useState<ICard | null>(null);
  const [synthResult, setSynthResult] = useState<ICard | null>(null);

  // Libraries
  const allCards = useMemo(() => Object.values(CARDS_LIBRARY).sort((a, b) => a.type.localeCompare(b.type) || a.cost - b.cost), []);
  const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
  const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);

  const filteredCards = allCards.filter(c => 
      c.name.includes(searchTerm) || 
      c.description.includes(searchTerm) || 
      c.type.includes(searchTerm)
  );

  const handleAddCard = (template: any) => {
      const newCard: ICard = { ...template, id: `debug-${Date.now()}-${Math.random()}` };
      
      if (activeTab === 'SYNTHESIS') {
          if (!synthSlot1) setSynthSlot1(newCard);
          else if (!synthSlot2) setSynthSlot2(newCard);
      } else {
          setSelectedDeck([...selectedDeck, newCard]);
      }
  };

  const handleRemoveCard = (index: number) => {
      const newDeck = [...selectedDeck];
      newDeck.splice(index, 1);
      setSelectedDeck(newDeck);
  };

  const toggleRelic = (relic: Relic) => {
      if (selectedRelics.find(r => r.id === relic.id)) {
          setSelectedRelics(selectedRelics.filter(r => r.id !== relic.id));
      } else {
          setSelectedRelics([...selectedRelics, relic]);
      }
  };

  const togglePotion = (potionTemplate: any) => {
      if (selectedPotions.length >= 3) return;
      const newPotion: Potion = { ...potionTemplate, id: `debug-pot-${Date.now()}` };
      setSelectedPotions([...selectedPotions, newPotion]);
  };

  const removePotion = (index: number) => {
      const newPots = [...selectedPotions];
      newPots.splice(index, 1);
      setSelectedPotions(newPots);
  };

  const clearDeck = () => setSelectedDeck([]);

  // --- Helper Duplicated from App.tsx ---
  const getShapeFromCard = (card: ICard): string => {
    if (card.textureRef) return card.textureRef.split('|')[0];
    
    const n = card.name;
    if (n.includes('薬') || n.includes('ポーション')) return 'POTION';
    if (n.includes('靴') || n.includes('足') || n.includes('ステップ') || n.includes('ダッシュ') || n.includes('ジャンプ')) return 'SHOE';
    if (n.includes('本') || n.includes('書') || n.includes('研究') || n.includes('学習')) return 'NOTEBOOK';
    if (n.includes('拳') || n.includes('パンチ') || n.includes('打') || n.includes('頭突き')) return 'FIST';
    if (n.includes('火') || n.includes('炎') || n.includes('熱')) return 'FLAME';
    if (n.includes('雷') || n.includes('電')) return 'LIGHTNING';
    
    // Default by Type
    if (card.type === CardType.ATTACK) return 'SWORD';
    if (card.type === CardType.SKILL) return 'SHIELD';
    if (card.type === CardType.POWER) return 'FLAME';
    return 'NOTEBOOK';
  };

  // --- Synthesis Logic ---
  const performSynthesis = () => {
      if (!synthSlot1 || !synthSlot2) return;
      const c1 = synthSlot1;
      const c2 = synthSlot2;

      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      const newCost = Math.max(c1.cost, c2.cost);
      
      // Sum numeric stats
      const sum = (k: keyof ICard) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      const newDamage = sum('damage');
      const newBlock = sum('block');
      const newDraw = sum('draw');
      const newEnergy = sum('energy');
      const newHeal = sum('heal');
      const newPoison = sum('poison');
      const newWeak = sum('weak');
      const newVulnerable = sum('vulnerable');
      const newStrength = sum('strength');
      const newSelfDamage = sum('selfDamage');
      const newPoisonMultiplier = sum('poisonMultiplier');

      // Play Copies Logic (Sum extra hits)
      const extraHits1 = c1.playCopies || 0;
      const extraHits2 = c2.playCopies || 0;
      const newExtraHits = extraHits1 + extraHits2;
      const newTotalHits = 1 + newExtraHits;

      // Merge booleans
      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;

      // Determine Type & Target
      let newType = c1.type;
      if (newDamage > 0) newType = CardType.ATTACK;
      else if (c1.type === CardType.POWER || c2.type === CardType.POWER) newType = CardType.POWER;
      else newType = CardType.SKILL;

      let newTarget = TargetType.ENEMY;
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.ENEMY || c2.target === TargetType.ENEMY) newTarget = TargetType.ENEMY;
      else newTarget = TargetType.SELF;
      
      if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
          newTarget = TargetType.ENEMY;
      }

      // Generate Description
      const parts: string[] = [];
      if (newDamage > 0) {
          let text = `${newDamage}ダメージ`;
          if (newTarget === TargetType.ALL_ENEMIES) text = `全体に${text}`;
          else if (newTarget === TargetType.RANDOM_ENEMY) text = `ランダムな敵に${text}`;
          else if (newTarget === TargetType.SELF) text = `自分に${text}`;
          
          if (newTotalHits > 1) text += `を${newTotalHits}回`;
          parts.push(text);
      }
      if (newBlock > 0) parts.push(`ブロック${newBlock}`);
      if (newPoison > 0) parts.push(`ドクドク${newPoison}`);
      if (newWeak > 0) parts.push(`へろへろ${newWeak}`);
      if (newVulnerable > 0) parts.push(`びくびく${newVulnerable}`);
      if (newStrength > 0) parts.push(`ムキムキ${newStrength}`);
      if (newPoisonMultiplier > 0) parts.push(`毒を${newPoisonMultiplier}倍`);
      if (newDraw > 0) parts.push(`${newDraw}枚引く`);
      if (newEnergy > 0) parts.push(`E${newEnergy}を得る`);
      if (newHeal > 0) parts.push(`HP${newHeal}回復`);
      if (newSelfDamage > 0) parts.push(`自分に${newSelfDamage}ダメージ`);
      
      let description = parts.join("。") + (parts.length > 0 ? "。" : "");
      if (parts.length === 0) description = "効果なし。";

      // Fix: If c1 is a standard card (no textureRef), map it to a generic Icon ID to prevent it matching Entity sprites.
      const shapeSource = c1.textureRef ? c1.textureRef.split('|')[0] : getShapeFromCard(c1);
      const colorSource = c2.textureRef ? (c2.textureRef.split('|')[1] || c2.textureRef.split('|')[0]) : c2.name;
      const newTextureRef = `${shapeSource}|${colorSource}|${newType}`;

      const newCard: ICard = {
          id: `synth-debug-${Date.now()}`,
          name: newName,
          cost: newCost,
          type: newType,
          target: newTarget,
          description: description,
          rarity: 'SPECIAL',
          damage: newDamage || undefined,
          block: newBlock || undefined,
          draw: newDraw || undefined,
          energy: newEnergy || undefined,
          heal: newHeal || undefined,
          poison: newPoison || undefined,
          weak: newWeak || undefined,
          vulnerable: newVulnerable || undefined,
          strength: newStrength || undefined,
          selfDamage: newSelfDamage || undefined,
          poisonMultiplier: newPoisonMultiplier || undefined,
          playCopies: newExtraHits > 0 ? newExtraHits : undefined,
          exhaust: newExhaust,
          innate: newInnate,
          textureRef: newTextureRef
      };

      setSynthResult(newCard);
  };

  const addSynthToDeck = () => {
      if (synthResult) {
          setSelectedDeck([...selectedDeck, { ...synthResult, id: `synth-added-${Date.now()}` }]);
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="bg-red-900/90 border-b-2 border-red-500 p-4 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-red-100 flex items-center">
                <Zap size={24} className="mr-2" /> DEBUG LOADOUT
            </h2>
            <div className="flex gap-4">
                <button onClick={onBack} className="text-gray-300 hover:text-white underline">戻る</button>
                <button 
                    onClick={() => onStart(selectedDeck, selectedRelics, selectedPotions)}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold flex items-center shadow-lg border-2 border-white animate-pulse"
                >
                    GAME START <ArrowRight size={16} className="ml-2"/>
                </button>
            </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Left Panel: Library & Synthesis */}
            <div className="w-1/2 md:w-2/3 border-r border-gray-700 flex flex-col bg-gray-800/50">
                {/* Tabs */}
                <div className="flex bg-gray-800 border-b border-gray-700">
                    <button onClick={() => setActiveTab('CARDS')} className={`flex-1 py-3 font-bold ${activeTab === 'CARDS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>CARDS</button>
                    <button onClick={() => setActiveTab('RELICS')} className={`flex-1 py-3 font-bold ${activeTab === 'RELICS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>RELICS</button>
                    <button onClick={() => setActiveTab('POTIONS')} className={`flex-1 py-3 font-bold ${activeTab === 'POTIONS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>POTIONS</button>
                    <button onClick={() => setActiveTab('SYNTHESIS')} className={`flex-1 py-3 font-bold ${activeTab === 'SYNTHESIS' ? 'bg-purple-900 text-white' : 'text-purple-400 hover:bg-gray-750'}`}>SYNTHESIS</button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                    
                    {activeTab === 'SYNTHESIS' && (
                        <div className="mb-8 border-b-2 border-purple-500 pb-4">
                            <h3 className="text-purple-300 font-bold mb-4 flex items-center"><Beaker className="mr-2"/> SYNTHESIS LAB</h3>
                            <div className="flex items-center justify-center gap-4 mb-4 bg-black/40 p-4 rounded-xl">
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="w-24 h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                        onClick={() => setSynthSlot1(null)}
                                    >
                                        {synthSlot1 ? (
                                            <div className="scale-75 pointer-events-none"><Card card={synthSlot1} onClick={()=>{}} disabled={false}/></div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Slot 1</span>
                                        )}
                                    </div>
                                </div>
                                <Plus size={24} className="text-gray-500" />
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="w-24 h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                        onClick={() => setSynthSlot2(null)}
                                    >
                                        {synthSlot2 ? (
                                            <div className="scale-75 pointer-events-none"><Card card={synthSlot2} onClick={()=>{}} disabled={false}/></div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Slot 2</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={performSynthesis}
                                        disabled={!synthSlot1 || !synthSlot2}
                                        className={`px-4 py-2 rounded font-bold text-sm ${!synthSlot1 || !synthSlot2 ? 'bg-gray-700 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-500 animate-pulse'}`}
                                    >
                                        Synthesize
                                    </button>
                                    <button 
                                        onClick={() => { setSynthSlot1(null); setSynthSlot2(null); setSynthResult(null); }}
                                        className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                                    >
                                        <RotateCcw size={12} className="mr-1"/> Reset
                                    </button>
                                </div>
                                
                                {synthResult && (
                                    <>
                                        <ArrowRight size={24} className="text-purple-400" />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="scale-90"><Card card={synthResult} onClick={()=>{}} disabled={false} /></div>
                                            <button 
                                                onClick={addSynthToDeck}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold w-full"
                                            >
                                                Add to Deck
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="text-center text-xs text-gray-400 mb-2">Select cards below to fill slots</div>
                        </div>
                    )}

                    {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                <input 
                                    type="text" 
                                    placeholder="Search cards..." 
                                    className="w-full bg-black border border-gray-600 rounded pl-10 p-2 text-white focus:border-blue-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {filteredCards.map((c, idx) => (
                                    <div key={idx} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAddCard(c)}>
                                        <div className="scale-75 origin-top-left pointer-events-none">
                                            <Card card={{...c, id: 'temp'}} onClick={()=>{}} disabled={false} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'RELICS' && (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {allRelics.map((r) => {
                                const isSelected = selectedRelics.some(sr => sr.id === r.id);
                                return (
                                    <div 
                                        key={r.id} 
                                        onClick={() => toggleRelic(r)}
                                        className={`p-3 rounded border-2 cursor-pointer flex flex-col items-center text-center ${isSelected ? 'bg-yellow-900/50 border-yellow-400' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
                                    >
                                        <Gem size={24} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                                        <span className="text-xs mt-2 font-bold">{r.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'POTIONS' && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {allPotions.map((p, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => togglePotion(p)}
                                    className="p-3 rounded border-2 border-gray-700 hover:border-white bg-black/40 cursor-pointer flex flex-col items-center text-center"
                                >
                                    <FlaskConical size={24} style={{ color: p.color }} />
                                    <span className="text-xs mt-2 font-bold">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Current Loadout */}
            <div className="w-1/2 md:w-1/3 flex flex-col bg-black/20">
                <div className="p-3 bg-black/50 border-b border-gray-700 font-bold text-gray-300">
                    CURRENT LOADOUT
                </div>
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-6">
                    
                    {/* Deck */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-blue-300 flex items-center"><Swords size={16} className="mr-2"/> Deck ({selectedDeck.length})</h3>
                            <button onClick={clearDeck} className="text-xs text-red-400 hover:text-red-200">Clear All</button>
                        </div>
                        <div className="space-y-1">
                            {selectedDeck.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700 text-xs group">
                                    <span className={c.type === CardType.ATTACK ? 'text-red-300' : c.type === CardType.SKILL ? 'text-blue-300' : 'text-yellow-300'}>
                                        {c.name}
                                    </span>
                                    <button onClick={() => handleRemoveCard(idx)} className="text-gray-500 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {selectedDeck.length === 0 && <div className="text-gray-600 text-xs italic">No cards selected</div>}
                        </div>
                    </div>

                    {/* Relics */}
                    <div>
                        <h3 className="font-bold text-yellow-300 mb-2 flex items-center"><Gem size={16} className="mr-2"/> Relics ({selectedRelics.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedRelics.map(r => (
                                <div key={r.id} className="bg-gray-800 p-2 rounded border border-yellow-700 flex items-center text-xs" title={r.description}>
                                    <span className="truncate max-w-[100px]">{r.name}</span>
                                    <button onClick={() => toggleRelic(r)} className="ml-2 text-gray-500 hover:text-red-500"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Potions */}
                    <div>
                        <h3 className="font-bold text-purple-300 mb-2 flex items-center"><FlaskConical size={16} className="mr-2"/> Potions ({selectedPotions.length}/3)</h3>
                        <div className="space-y-1">
                            {selectedPotions.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700 text-xs">
                                    <span style={{color: p.color}}>{p.name}</span>
                                    <button onClick={() => removePotion(idx)} className="text-gray-500 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};

const X = ({size}:{size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default DebugMenuScreen;
