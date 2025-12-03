
import React, { useEffect, useState, useRef } from 'react';
import { Enemy, Player, Card as ICard, CardType, SelectionState, Potion, FloatingText, EnemyIntentType, CodexSelection } from '../types';
import Card, { KEYWORD_DEFINITIONS } from './Card';
import { Heart, Shield, Zap, Skull, Layers, X, Sword, AlertCircle, TrendingDown, Droplets, Hexagon, Gem, FlaskConical, Info, FileText, BookOpen, ArrowRight } from 'lucide-react';
import PixelSprite from './PixelSprite';
import { audioService } from '../services/audioService';

interface BattleSceneProps {
  player: Player;
  enemies: Enemy[];
  selectedEnemyId: string | null;
  onSelectEnemy: (id: string) => void;
  onPlayCard: (card: ICard) => void;
  onEndTurn: () => void;
  turnLog: string;
  narrative: string;
  lastActionTime: number;
  lastActionType: CardType | null;
  actingEnemyId: string | null;
  selectionState: SelectionState;
  onHandSelection: (card: ICard) => void;
  onUsePotion: (potion: Potion) => void;
  combatLog: string[];
  codexSelection?: CodexSelection;
  onCodexSelect?: (card: ICard | null) => void;
}

const BattleScene: React.FC<BattleSceneProps> = ({ 
  player, enemies, selectedEnemyId, onSelectEnemy, onPlayCard, onEndTurn, turnLog, narrative, lastActionTime, lastActionType, actingEnemyId,
  selectionState, onHandSelection, onUsePotion, combatLog, codexSelection, onCodexSelect
}) => {
  
  const playerHpPercent = (player.currentHp / player.maxHp) * 100;
  
  const [isActing, setIsActing] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (lastActionTime > 0) {
      setIsActing(true);
      const timer = setTimeout(() => {
        setIsActing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastActionTime]);

  const getActionClass = () => {
    if (!isActing) return '';
    switch (lastActionType) {
        case CardType.ATTACK: return 'translate-x-12 -translate-y-4 scale-105'; 
        case CardType.SKILL: return '-translate-x-2 scale-95 brightness-150 sepia-0';
        case CardType.POWER: return 'scale-110 -translate-y-2 brightness-125 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]';
        default: return '';
    }
  };

  const getEnemyActionClass = (enemy: Enemy) => {
      if (actingEnemyId !== enemy.id) return '';
      if (enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND') {
          return '-translate-x-12 z-50 scale-110'; 
      } else if (enemy.nextIntent.type === 'DEFEND') {
          return 'scale-95 brightness-150'; 
      } else {
          return 'scale-110 -translate-y-2 brightness-125'; 
      }
  };

  const sortedDeck = [...player.deck].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Top Bar: Narrative */}
      <div className="h-10 md:h-12 bg-black border-b-4 border-gray-700 flex items-center px-4 text-xs md:text-sm text-green-400 overflow-hidden whitespace-nowrap justify-between shrink-0 z-30">
        <span className="truncate mr-4"><span className="animate-pulse mr-2">>></span> {narrative}</span>
        <button onClick={() => setShowLog(!showLog)} className="text-gray-500 hover:text-white flex items-center">
            <FileText size={14} className="mr-1"/> Log
        </button>
      </div>

      {/* Combat Log Overlay */}
      {showLog && (
          <div className="absolute top-12 right-0 w-64 max-h-48 bg-black/90 border-l-2 border-b-2 border-gray-500 overflow-y-auto z-50 p-2 text-xs text-gray-300 font-mono custom-scrollbar">
              {combatLog.slice().reverse().map((log, i) => (
                  <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>
              ))}
          </div>
      )}

      {/* Battle Area */}
      <div className="flex-grow bg-gray-900 relative overflow-hidden flex justify-between items-center px-2 md:px-4 py-4 bg-[url('https://picsum.photos/800/400?grayscale&blur=2')] bg-cover bg-blend-multiply">
        
        {/* Codex Selection Modal (Nilry's Codex) */}
        {codexSelection?.active && (
            <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 animate-in fade-in">
                <h3 className="text-xl text-yellow-400 font-bold mb-4 flex items-center"><BookOpen className="mr-2"/> 攻略本: カードを1枚選んでください</h3>
                <div className="flex gap-4 mb-8">
                    {codexSelection.candidates.map(card => (
                        <div key={card.id} className="scale-90 hover:scale-100 transition-transform cursor-pointer" onClick={() => onCodexSelect && onCodexSelect(card)}>
                            <Card card={card} onClick={() => onCodexSelect && onCodexSelect(card)} disabled={false} />
                        </div>
                    ))}
                </div>
                <button onClick={() => onCodexSelect && onCodexSelect(null)} className="text-gray-400 hover:text-white underline">スキップ</button>
            </div>
        )}

        {/* Selection Overlay */}
        {selectionState.active && (
            <div className="absolute top-0 left-0 w-full bg-black/80 z-40 text-center py-2 border-b-2 border-yellow-500 animate-pulse">
                <span className="text-yellow-400 font-bold text-lg">
                    {selectionState.type === 'DISCARD' && `カードを ${selectionState.amount} 枚捨ててください`}
                    {selectionState.type === 'COPY' && `コピーするカードを選択してください`}
                    {selectionState.type === 'EXHAUST' && `廃棄するカードを選択してください`}
                </span>
            </div>
        )}

        {/* Player Sprite & Stats */}
        <div className="flex flex-col items-center z-10 w-1/4 relative">
            {/* Player Floating Text */}
            {player.floatingText && (
               <div key={player.floatingText.id} className={`absolute -top-10 left-1/2 -translate-x-1/2 text-2xl font-black ${player.floatingText.color} animate-float-up pointer-events-none drop-shadow-md whitespace-nowrap z-50`}>
                   {player.floatingText.iconType === 'sword' && <Sword size={20} className="inline mr-1"/>}
                   {player.floatingText.iconType === 'shield' && <Shield size={20} className="inline mr-1"/>}
                   {player.floatingText.iconType === 'heart' && <Heart size={20} className="inline mr-1"/>}
                   {player.floatingText.text}
               </div>
            )}

            <div className="mb-2 w-32 md:w-48 bg-black/80 border-2 border-white p-2 text-white text-xs">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-red-400 flex items-center"><Heart size={10} className="mr-1"/> {player.currentHp}/{player.maxHp}</span>
                    <span className="text-blue-400 flex items-center"><Shield size={10} className="mr-1"/> {player.block}</span>
                </div>
                
                {/* Relics & Potions Row */}
                <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-700 pb-1">
                    {/* Relics */}
                    <div className="flex gap-1 flex-wrap">
                        {player.relics.map(r => (
                            <div key={r.id} className="w-4 h-4 md:w-5 md:h-5 bg-gray-700 rounded-full border border-yellow-600 flex items-center justify-center relative group" title={`${r.name}: ${r.description}`}>
                                <Gem size={10} className="text-yellow-400" />
                            </div>
                        ))}
                    </div>
                    {/* Potions */}
                    <div className="flex gap-1 ml-auto">
                        {player.potions.map(p => (
                             <div 
                                key={p.id} 
                                onClick={() => !actingEnemyId && !selectionState.active && onUsePotion(p)}
                                className={`w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded border border-white flex items-center justify-center relative group cursor-pointer hover:scale-125 transition-transform`}
                                title={`${p.name}: ${p.description}`}
                             >
                                <FlaskConical size={10} style={{ color: p.color }} />
                            </div>
                        ))}
                        {[...Array(3 - player.potions.length)].map((_, i) => (
                             <div key={i} className="w-4 h-4 md:w-5 md:h-5 bg-black/50 rounded border border-gray-700 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                             </div>
                        ))}
                    </div>
                </div>

                {/* Player Powers */}
                <div className="flex flex-wrap gap-1 mb-1">
                    {player.strength !== 0 && (
                        <span className={`flex items-center ${player.strength > 0 ? 'text-red-400' : 'text-gray-400'} text-[9px]`}>
                            <Sword size={8} className="mr-0.5"/> {player.strength}
                        </span>
                    )}
                    {Object.entries(player.powers).map(([key, val]) => (val as number) > 0 && (
                        <span key={key} className="text-yellow-400 text-[9px] border border-yellow-600 px-0.5 rounded flex items-center" title={key}>
                            {key === 'INTANGIBLE' ? '👻' : key === 'THORNS' ? '🌵' : key === 'REGEN' ? '❤️' : key.substring(0,2)}:{val as number}
                        </span>
                    ))}
                </div>

                <div className="w-full h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${playerHpPercent}%`}}></div>
                </div>
            </div>
            
            <div className={`w-24 h-24 md:w-32 md:h-32 relative transition-all duration-150 ease-out ${getActionClass()}`}>
                 <img 
                    src={player.imageData} 
                    alt="Hero" 
                    className="w-full h-full pixel-art drop-shadow-lg" 
                    style={{ imageRendering: 'pixelated' }}
                 />
            </div>
        </div>

        {/* Center Info */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center w-full pointer-events-none z-0">
            <div className="text-yellow-400 text-lg mb-2 animate-pulse font-bold drop-shadow-md bg-black/50 px-4 rounded">{turnLog}</div>
        </div>

        {/* Enemies */}
        <div className="flex justify-center items-end gap-2 md:gap-4 w-3/4 pr-2 md:pr-4 h-full pb-8">
            {enemies.map((enemy) => {
                const enemyHpPercent = (enemy.currentHp / enemy.maxHp) * 100;
                const isSelected = selectedEnemyId === enemy.id;
                const actionClass = getEnemyActionClass(enemy);
                
                return (
                    <div 
                        key={enemy.id} 
                        onClick={() => onSelectEnemy(enemy.id)}
                        className={`flex flex-col items-center z-10 transition-transform duration-200 cursor-pointer relative ${isSelected && !actionClass ? 'scale-105 md:scale-110' : ''} ${!isSelected && !actionClass ? 'hover:scale-105' : ''} ${actionClass}`}
                    >
                        {/* Floating Text */}
                        {enemy.floatingText && (
                           <div key={enemy.floatingText.id} className={`absolute -top-12 left-1/2 -translate-x-1/2 text-2xl font-black ${enemy.floatingText.color} animate-float-up pointer-events-none drop-shadow-md whitespace-nowrap z-50`}>
                               {enemy.floatingText.iconType === 'sword' && <Sword size={20} className="inline mr-1"/>}
                               {enemy.floatingText.iconType === 'shield' && <Shield size={20} className="inline mr-1"/>}
                               {enemy.floatingText.iconType === 'poison' && <Droplets size={20} className="inline mr-1"/>}
                               {enemy.floatingText.text}
                           </div>
                        )}

                        {/* Intent Bubble */}
                        <div className="mb-2 bg-white text-black text-[10px] p-1 rounded border-2 border-red-500 animate-bounce shadow-md">
                            {(enemy.nextIntent.type === 'ATTACK' || enemy.nextIntent.type === 'ATTACK_DEBUFF' || enemy.nextIntent.type === 'ATTACK_DEFEND') && (
                                <span className="flex items-center font-bold">
                                    <Skull size={12} className="mr-1"/> 
                                    {enemy.nextIntent.value + enemy.strength}
                                    {enemy.strength !== 0 && <span className="text-[8px] text-gray-500 ml-0.5">({enemy.strength > 0 ? '+' : ''}{enemy.strength})</span>}
                                </span>
                            )}
                            {enemy.nextIntent.type === 'DEFEND' && <span className="flex items-center"><Shield size={12} className="mr-1"/> {enemy.nextIntent.value}</span>}
                            {(enemy.nextIntent.type === 'BUFF' || enemy.nextIntent.type === 'DEBUFF' || enemy.nextIntent.type === 'UNKNOWN') && <span className="flex items-center"><Zap size={12} className="mr-1"/> !</span>}
                        </div>

                        <div className={`mb-1 w-24 md:w-28 bg-black/80 border-2 p-1 text-white text-[10px] transition-colors ${isSelected ? 'border-yellow-400 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-red-500'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-red-400 truncate w-12">{enemy.name}</span>
                                <span className="text-blue-400 flex items-center"><Shield size={8} className="mr-1"/> {enemy.block}</span>
                            </div>
                            
                            {/* Status Effects */}
                            <div className="flex flex-wrap gap-1 mb-1 justify-end min-h-[14px]">
                                {enemy.strength !== 0 && (
                                    <span className="text-red-400 flex items-center bg-red-900/50 px-1 rounded" title="筋力">
                                        <Sword size={8} className="mr-0.5"/> {enemy.strength}
                                    </span>
                                )}
                                {enemy.vulnerable > 0 && (
                                    <span className="text-pink-400 flex items-center bg-pink-900/50 px-1 rounded" title="びくびく">
                                        <AlertCircle size={8} className="mr-0.5"/> {enemy.vulnerable}
                                    </span>
                                )}
                                {enemy.weak > 0 && (
                                    <span className="text-gray-400 flex items-center bg-gray-700/50 px-1 rounded" title="へろへろ">
                                        <TrendingDown size={8} className="mr-0.5"/> {enemy.weak}
                                    </span>
                                )}
                                {enemy.poison > 0 && (
                                    <span className="text-green-400 flex items-center bg-green-900/50 px-1 rounded" title="ドクドク">
                                        <Droplets size={8} className="mr-0.5"/> {enemy.poison}
                                    </span>
                                )}
                                {enemy.artifact > 0 && (
                                    <span className="text-yellow-200 flex items-center bg-yellow-900/50 px-1 rounded" title="アーティファクト">
                                        <Hexagon size={8} className="mr-0.5"/> {enemy.artifact}
                                    </span>
                                )}
                            </div>

                            <div className="w-full h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${enemyHpPercent}%`}}></div>
                            </div>
                            <div className="text-right mt-0.5 font-mono">{enemy.currentHp}/{enemy.maxHp}</div>
                        </div>

                        <div className="w-20 h-20 md:w-24 md:h-24 relative">
                            {isSelected && (
                                <div className="absolute -top-6 -left-4 text-yellow-400 animate-bounce pointer-events-none">
                                    <ArrowRight className="rotate-90" size={24} />
                                </div>
                            )}
                            <PixelSprite seed={enemy.enemyType === 'THE_HEART' ? 'BOSS' : enemy.name} name={enemy.name} className="w-full h-full" size={16} />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Player Hand & Controls */}
      <div className={`h-56 md:h-64 bg-gray-900 border-t-4 border-white p-2 md:p-4 flex flex-col relative z-20 ${selectionState.active ? 'shadow-[0_-5px_20px_rgba(255,255,0,0.3)]' : ''}`}>
        
        {/* Energy & Deck Info */}
        <div className="absolute -top-5 md:-top-6 left-2 md:left-4 flex space-x-2">
            <div className="bg-black border-2 border-yellow-500 text-yellow-400 px-3 py-1 rounded-full flex items-center shadow-lg">
                <Zap size={14} className="mr-1 fill-yellow-400"/>
                <span className="text-sm md:text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
            </div>
            
            <button 
                onClick={() => setShowDeck(true)}
                className="bg-black border-2 border-blue-500 text-blue-400 px-3 py-1 rounded-full text-xs flex items-center hover:bg-blue-900/50 hover:text-white transition-colors cursor-pointer"
            >
                <Layers size={12} className="mr-1"/>
                {player.deck.length}
            </button>
            <div className="bg-black border-2 border-gray-500 text-gray-400 px-3 py-1 rounded-full text-xs flex items-center">
                捨て: {player.discardPile.length}
            </div>
        </div>

        {/* End Turn Button */}
        <div className="absolute -top-5 md:-top-6 right-2 md:right-4">
            <button 
                onClick={!actingEnemyId && !selectionState.active ? onEndTurn : undefined}
                disabled={!!actingEnemyId || selectionState.active}
                className={`bg-red-600 border-2 border-white px-4 md:px-6 py-1 md:py-2 text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded
                  ${!actingEnemyId && !selectionState.active ? 'hover:bg-red-500 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                `}
            >
                {selectionState.active ? "選択中..." : "ターン終了"}
            </button>
        </div>

        {/* Cards */}
        <div className="flex-grow flex items-center justify-start md:justify-center gap-1 md:gap-2 px-2 md:px-8 overflow-x-auto pb-4 pt-2 custom-scrollbar snap-x">
            {player.hand.map((card) => (
                <div key={card.id} className={`snap-center shrink-0 ${selectionState.active ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}>
                    <Card 
                        card={card} 
                        onClick={() => {
                            if (selectionState.active) {
                                onHandSelection(card);
                            } else {
                                onPlayCard(card);
                            }
                        }} 
                        disabled={
                            selectionState.active 
                            ? false 
                            : (player.currentEnergy < card.cost || !!actingEnemyId || card.unplayable)
                        }
                    />
                </div>
            ))}
        </div>
      </div>

      {/* Deck View Modal */}
      {showDeck && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeck(false)}>
            <div className="bg-gray-800 border-4 border-white w-full max-w-4xl h-[80vh] flex flex-col relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center">
                    <h2 className="text-white text-xl font-bold flex items-center">
                        <Layers className="mr-2"/> デッキ一覧 ({player.deck.length})
                    </h2>
                    <button onClick={() => setShowDeck(false)} className="text-gray-400 hover:text-white p-1 border border-transparent hover:border-white rounded cursor-pointer">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 md:p-8 overflow-y-auto flex-grow bg-gray-900/90 custom-scrollbar">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-items-center">
                        {sortedDeck.map((card) => (
                            <div key={card.id} className="scale-75 md:scale-90 hover:scale-100 transition-transform origin-top-left">
                                <Card 
                                    card={card} 
                                    onClick={() => {}} 
                                    disabled={false}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default BattleScene;
