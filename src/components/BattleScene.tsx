
import React, { useEffect, useState, useRef } from 'react';
import { Enemy, Player, Card as ICard, CardType, SelectionState, Potion, FloatingText } from '../types';
import Card from './Card';
import { Heart, Shield, Zap, Skull, Layers, X, Sword, AlertCircle, TrendingDown, Droplets, Hexagon, Gem, FlaskConical, Info } from 'lucide-react';
import PixelSprite from './PixelSprite';

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
}

const POWER_DEFINITIONS: Record<string, {name: string, desc: string}> = {
    WEAK: { name: "弱体", desc: "攻撃で与えるダメージが25%減少する。" },
    VULNERABLE: { name: "脆弱", desc: "攻撃から受けるダメージが50%増加する。" },
    POISON: { name: "毒", desc: "ターン終了時にHPダメージを受け、数値が1減る。" },
    STRENGTH: { name: "筋力", desc: "攻撃ダメージがその数値分増加する。" },
    DEXTERITY: { name: "敏捷性", desc: "ブロックを得るカードの効果がその数値分増加する。" },
    ARTIFACT: { name: "アーティファクト", desc: "次に受けるデバフを無効化する。" },
    INTANGIBLE: { name: "無形", desc: "受けるダメージとHP減少が1になる。" },
    THORNS: { name: "トゲ", desc: "攻撃を受けた時、相手にその数値分のダメージを与える。" },
    METALLICIZE: { name: "金属化", desc: "ターン終了時、その数値分のブロックを得る。" },
    REGEN: { name: "再生", desc: "ターン終了時、その数値分HPを回復し、数値が1減る。" },
    STRENGTH_DOWN: { name: "筋力低下", desc: "ターン終了時、筋力が通常の値に戻る。" },
    DEMON_FORM: { name: "悪魔化", desc: "ターン開始時、筋力を得る。" },
    ECHO_FORM: { name: "反響", desc: "各ターン、最初にプレイしたカードを2回使用する。" },
    BARRICADE: { name: "バリケード", desc: "ターン開始時にブロックが消滅しなくなる。" },
    NOXIOUS_FUMES: { name: "有毒ガス", desc: "ターン開始時、敵全体に毒を与える。" },
    INFINITE_BLADES: { name: '無限の刃', desc: 'ターン開始時、手札にナイフを加える。' },
    AFTER_IMAGE: { name: '残像', desc: 'カードを使用する度、ブロック1を得る。' },
    THOUSAND_CUTS: { name: '千切れ', desc: 'カードを使用する度、敵全体にダメージを与える。' },
    TOOLS_OF_THE_TRADE: { name: '商売道具', desc: 'ターン開始時、1枚引いて1枚捨てる。' },
    ENVENOM: { name: '猛毒', desc: '攻撃でダメージを与えた時、毒1を与える。' },
    STATIC_DISCHARGE: { name: '静電放電', desc: '攻撃を受けた時、ランダムな敵にダメージを与える。' },
    BUFFER: { name: 'バッファー', desc: '次に受けるHPダメージを0にする。' },
    CREATIVE_AI: { name: '創造的AI', desc: 'ターン開始時、ランダムなパワーカードを加える。' },
    DEVA_FORM: { name: 'デバ化', desc: 'ターン開始時、エネルギーを得る。' },
    MASTER_REALITY: { name: '真なる理', desc: 'カードが生成された時、それをアップグレードする。' },
    BURST: { name: 'バースト', desc: '次にプレイするスキルカードが2回発動する。' },
    DOUBLE_POISON: { name: '触媒', desc: '毒の効果を増幅させる。' },
    LOSE_STRENGTH: { name: '筋力低下', desc: 'ターン終了時、筋力を失う。' },
    CORRUPTION: { name: '堕落', desc: 'スキルカードのコストが0になり、使用時に廃棄される。' },
    FEEL_NO_PAIN: { name: '無痛', desc: 'カードが廃棄される度、ブロックを得る。' },
    RUPTURE: { name: '破裂', desc: 'HPを失った時、筋力を得る。' },
    EVOLVE: { name: '進化', desc: '状態異常カードを引いた時、カードを引く。' },
    APOTHEOSIS: { name: '神格化', desc: 'デッキの全てのカードがアップグレードされる。' },
    ACCURACY: { name: '精度上昇', desc: 'ナイフのダメージが増加する。' },
    STRATEGIST: { name: '戦略家', desc: 'このカードが捨てられた時、エネルギーを得る。' },
};

// Component for handling floating damage/heal numbers
const FloatingTextOverlay: React.FC<{ data: FloatingText | null }> = ({ data }) => {
    if (!data) return null;

    return (
        <div 
            key={data.id} // Forces re-mount to restart animation on new ID
            className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 font-bold text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] pointer-events-none ${data.color}`}
            style={{ 
                animation: 'float-up-fade 0.8s ease-out forwards'
            }}
        >
            <style>
                {`
                    @keyframes float-up-fade {
                        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                        20% { transform: translate(-50%, -100%) scale(1.2); opacity: 1; }
                        100% { transform: translate(-50%, -250%) scale(1); opacity: 0; }
                    }
                `}
            </style>
            {data.text}
        </div>
    );
};

const BattleScene: React.FC<BattleSceneProps> = ({ 
  player, enemies, selectedEnemyId, onSelectEnemy, onPlayCard, onEndTurn, turnLog, narrative, lastActionTime, lastActionType, actingEnemyId,
  selectionState, onHandSelection, onUsePotion
}) => {
  
  const playerHpPercent = (player.currentHp / player.maxHp) * 100;
  
  const [isActing, setIsActing] = useState(false);
  const [showDeck, setShowDeck] = useState(false);
  const [tooltip, setTooltip] = useState<{title: string, desc: string} | null>(null);
  const [potionConfirmation, setPotionConfirmation] = useState<Potion | null>(null);

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
        case CardType.ATTACK: return '-translate-y-12 scale-105 z-30'; 
        case CardType.SKILL: return '-translate-x-2 scale-95 brightness-150 sepia-0';
        case CardType.POWER: return 'scale-110 -translate-y-2 brightness-125 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]';
        default: return '';
    }
  };

  const getEnemyActionClass = (enemy: Enemy) => {
      if (actingEnemyId !== enemy.id) return '';
      if (enemy.nextIntent.type === 'ATTACK') {
          return 'translate-y-16 z-50'; 
      } else if (enemy.nextIntent.type === 'DEFEND') {
          return 'scale-90 brightness-150'; 
      } else {
          return 'scale-125 -translate-y-4 brightness-125'; 
      }
  };

  const sortedDeck = [...player.deck].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  const showInfo = (title: string, desc: string) => {
      setTooltip({ title, desc });
  };

  return (
    <div className="flex flex-col h-full relative bg-gray-900 overflow-hidden">
      
      {/* 1. Top Bar: Narrative (Compact) */}
      <div className="h-8 shrink-0 bg-black border-b-2 border-gray-700 flex items-center px-4 text-xs text-green-400 overflow-hidden whitespace-nowrap justify-between z-30">
        <span className="truncate mr-4"><span className="animate-pulse mr-2">&gt;&gt;</span> {narrative}</span>
        <span className="text-yellow-400">{turnLog}</span>
      </div>

      {/* 2. Battle Viewport (Enemies & Player Sprite) - Scrollable to prevent overlap */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col justify-between p-2 bg-gray-800/50 gap-4">
        
        {/* Selection Overlay */}
        {selectionState.active && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 z-40 text-center py-2 px-6 border-b-2 border-yellow-500 animate-pulse rounded shadow-xl pointer-events-none">
                <span className="text-yellow-400 font-bold text-sm">
                    {selectionState.type === 'DISCARD' && `捨ててください (${selectionState.amount})`}
                    {selectionState.type === 'COPY' && `コピーしてください (${selectionState.amount})`}
                    {selectionState.type === 'EXHAUST' && `廃棄してください (${selectionState.amount})`}
                </span>
            </div>
        )}

        {/* Tooltip Modal Overlay */}
        {tooltip && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setTooltip(null)}>
                <div className="bg-black border-2 border-white p-4 rounded max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <h3 className="text-yellow-400 font-bold mb-2 text-lg border-b border-gray-600 pb-1">{tooltip.title}</h3>
                    <p className="text-white text-sm whitespace-pre-wrap">{tooltip.desc}</p>
                    <button onClick={() => setTooltip(null)} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded">閉じる</button>
                </div>
            </div>
        )}

        {/* Potion Confirmation Modal */}
        {potionConfirmation && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setPotionConfirmation(null)}>
                <div className="bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-w-xs w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center">
                            <FlaskConical size={32} style={{color: potionConfirmation.color}} />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{potionConfirmation.name}</h3>
                    <p className="text-gray-300 mb-6 text-sm whitespace-pre-wrap">{potionConfirmation.description}</p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => { onUsePotion(potionConfirmation); setPotionConfirmation(null); }} 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold border border-white transition-colors"
                        >
                            使用する
                        </button>
                        <button 
                            onClick={() => setPotionConfirmation(null)} 
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 transition-colors"
                        >
                            やめる
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Enemies Area (Top) */}
        <div className="flex justify-center items-start pt-14 gap-2 min-h-[180px] shrink-0">
            {enemies.map((enemy) => {
                const enemyHpPercent = (enemy.currentHp / enemy.maxHp) * 100;
                const isSelected = selectedEnemyId === enemy.id;
                const actionClass = getEnemyActionClass(enemy);
                
                return (
                    <div 
                        key={enemy.id} 
                        onClick={() => onSelectEnemy(enemy.id)}
                        className={`flex flex-col items-center z-10 transition-transform duration-200 cursor-pointer relative ${isSelected && !actionClass ? 'scale-105 z-20' : ''} ${!isSelected && !actionClass ? 'hover:scale-105' : ''} ${actionClass}`}
                    >
                        {/* Damage Popup */}
                        <FloatingTextOverlay data={enemy.floatingText} />

                        {/* Intent Bubble */}
                        <div 
                            className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-white text-black text-xs font-extrabold px-1.5 py-0.5 rounded border-2 border-red-600 animate-bounce whitespace-nowrap shadow-xl flex items-center justify-center min-w-[40px]"
                            onClick={(e) => { e.stopPropagation(); showInfo("敵の行動", enemy.nextIntent.type === 'ATTACK' ? `${enemy.nextIntent.value} ダメージを与える攻撃` : enemy.nextIntent.type === 'DEFEND' ? `${enemy.nextIntent.value} ブロックを得る` : "バフまたはデバフを使用"); }}
                        >
                            {enemy.nextIntent.type === 'ATTACK' && <><Skull size={12} className="mr-1 text-red-600"/> {enemy.nextIntent.value}</>}
                            {enemy.nextIntent.type === 'DEFEND' && <><Shield size={12} className="mr-1 text-blue-600"/> {enemy.nextIntent.value}</>}
                            {(enemy.nextIntent.type === 'BUFF' || enemy.nextIntent.type === 'DEBUFF') && <><Zap size={12} className="mr-1 text-yellow-600"/> !</>}
                            {enemy.nextIntent.type === 'UNKNOWN' && <span className="text-gray-600">?</span>}
                        </div>

                        <div className="w-16 h-16 md:w-20 md:h-20 relative mb-1">
                            <PixelSprite seed={enemy.id} name={enemy.name} className="w-full h-full drop-shadow-lg" />
                        </div>

                        <div className={`w-24 md:w-28 bg-black/90 border-2 px-1 py-0.5 text-white text-[9px] md:text-[10px] transition-colors shadow-md rounded ${isSelected ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-gray-600'}`}>
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-red-200 font-bold truncate flex-1">{enemy.name}</span>
                                {enemy.block > 0 && <span className="text-blue-300 flex items-center bg-blue-900/80 px-1 rounded text-[8px] font-bold ml-1" onClick={(e)=>{e.stopPropagation(); showInfo("ブロック", "次のターン開始時までダメージを防ぐ。");}}><Shield size={8} className="mr-0.5"/> {enemy.block}</span>}
                            </div>
                            
                            {/* HP Bar & Text */}
                            <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600 mb-0.5" onClick={(e) => { e.stopPropagation(); showInfo("HP", `現在: ${enemy.currentHp} / 最大: ${enemy.maxHp}`); }}>
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500" style={{width: `${enemyHpPercent}%`}}></div>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white shadow-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none">
                                    {enemy.currentHp}/{enemy.maxHp}
                                </div>
                            </div>

                            {/* Status Icons */}
                            <div className="flex flex-wrap gap-0.5 justify-center min-h-[14px]">
                                {enemy.vulnerable > 0 && (
                                    <div className="flex items-center bg-pink-900/80 rounded px-0.5 border border-pink-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo("脆弱", "攻撃から受けるダメージが50%増加。");}}>
                                        <AlertCircle size={8} className="text-pink-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.vulnerable}</span>
                                    </div>
                                )}
                                {enemy.weak > 0 && (
                                    <div className="flex items-center bg-gray-700/80 rounded px-0.5 border border-gray-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo("弱体", "攻撃で与えるダメージが25%減少。");}}>
                                        <TrendingDown size={8} className="text-gray-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.weak}</span>
                                    </div>
                                )}
                                {enemy.poison > 0 && (
                                    <div className="flex items-center bg-green-900/80 rounded px-0.5 border border-green-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo("毒", "ターン終了時にHPダメージを受け、数値が1減る。");}}>
                                        <Droplets size={8} className="text-green-300"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.poison}</span>
                                    </div>
                                )}
                                {enemy.artifact > 0 && (
                                    <div className="flex items-center bg-yellow-900/80 rounded px-0.5 border border-yellow-500/50 cursor-pointer" onClick={(e)=>{e.stopPropagation(); showInfo("アーティファクト", "デバフを無効化する。");}}>
                                        <Hexagon size={8} className="text-yellow-200"/> <span className="text-[8px] ml-0.5 font-bold">{enemy.artifact}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Player Area (Bottom Left) */}
        <div className="flex items-end pl-2 pb-2 shrink-0 mt-auto">
            <div className="flex items-end relative">
                {/* Damage Popup */}
                <FloatingTextOverlay data={player.floatingText} />

                {/* Player Sprite */}
                <div className={`w-20 h-20 md:w-24 md:h-24 relative transition-all duration-150 ease-out mr-2 ${getActionClass()}`} onClick={() => showInfo("勇者", "あなたのキャラクター。\nHPが0になるとゲームオーバー。")}>
                     <img 
                        src={player.imageData} 
                        alt="Hero" 
                        className="w-full h-full pixel-art" 
                        style={{ imageRendering: 'pixelated' }}
                     />
                </div>

                {/* Player Stats Panel */}
                <div className="bg-black/80 border-2 border-white p-1 text-white text-xs w-36 md:w-40 mb-2 shadow-lg rounded z-20">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400 flex items-center font-bold" onClick={() => showInfo("HP", "ヒットポイント。0になると死亡する。")}><Heart size={12} className="mr-1"/> {player.currentHp}/{player.maxHp}</span>
                        <span className="text-blue-400 flex items-center font-bold" onClick={() => showInfo("ブロック", "敵の攻撃ダメージを防ぐ。ターン終了時に消滅する。")}><Shield size={12} className="mr-1"/> {player.block}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full border border-gray-500 overflow-hidden mb-1">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${playerHpPercent}%`}}></div>
                    </div>
                    
                    {/* Relics/Potions Compact Row */}
                    <div className="flex items-center justify-between border-t border-gray-700 pt-1">
                        <div className="flex -space-x-1 overflow-hidden w-20">
                            {player.relics.slice(0,5).map(r => (
                                <div key={r.id} className="w-4 h-4 md:w-5 md:h-5 bg-gray-700 rounded-full border border-yellow-600 flex items-center justify-center shrink-0 cursor-pointer relative group" onClick={() => showInfo(r.name, r.description)}>
                                    <Gem size={10} className="text-yellow-400" />
                                    {player.relicCounters[r.id] !== undefined && player.relicCounters[r.id] > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold border border-black shadow">
                                            {player.relicCounters[r.id]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-0.5">
                            {player.potions.map(p => (
                                 <div 
                                    key={p.id} 
                                    onClick={() => {
                                        if (!actingEnemyId && !selectionState.active) {
                                            setPotionConfirmation(p);
                                        }
                                    }}
                                    className="w-4 h-4 md:w-5 md:h-5 bg-gray-800 rounded border border-white flex items-center justify-center cursor-pointer hover:scale-110"
                                 >
                                    <FlaskConical size={10} style={{ color: p.color }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Power Icons */}
                    <div className="flex flex-wrap gap-0.5 mt-1">
                        {player.strength !== 0 && (
                            <span 
                                className={`flex items-center ${player.strength > 0 ? 'text-red-400' : 'text-gray-400'} text-[9px] font-bold border border-gray-700 px-1 rounded bg-black cursor-pointer`}
                                onClick={() => showInfo("筋力", "攻撃カードのダメージを増加させる。")}
                            >
                                <Sword size={8} className="mr-0.5"/> {player.strength}
                            </span>
                        )}
                        {Object.entries(player.powers).map(([key, val]) => {
                            if ((val as number) <= 0) return null;
                            const def = POWER_DEFINITIONS[key] || { name: key, desc: "効果不明" };
                            return (
                                <span key={key} className="text-yellow-400 text-[8px] border border-yellow-600 px-0.5 rounded bg-black/50 cursor-pointer" onClick={() => showInfo(def.name, def.desc)}>
                                    {def.name}:{val as number}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Control Bar (Energy, Deck, End Turn) */}
      <div className="h-12 bg-gray-800 border-t-2 border-white flex items-center justify-between px-2 shrink-0 z-20 shadow-lg">
          
          {/* Energy */}
          <div className="flex items-center">
              <div className="bg-black border-2 border-yellow-500 text-yellow-400 px-2 py-0.5 rounded-full flex items-center shadow-lg mr-2" onClick={() => showInfo("エネルギー", "カードを使用するために必要。ターン毎に回復する。")}>
                  <Zap size={14} className="mr-1 fill-yellow-400"/>
                  <span className="text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
              </div>
              <div className="text-[9px] text-gray-400 flex flex-col leading-tight">
                  <span onClick={() => setShowDeck(true)} className="cursor-pointer hover:text-white flex items-center"><Layers size={10} className="mr-1"/> {player.deck.length}</span>
                  <span className="flex items-center" onClick={() => showInfo("捨て札", "使用済みカード。山札が切れるとリシャッフルされる。")}><X size={10} className="mr-1"/> {player.discardPile.length}</span>
              </div>
          </div>

          {/* End Turn */}
          <button 
              onClick={!actingEnemyId && !selectionState.active ? onEndTurn : undefined}
              disabled={!!actingEnemyId || selectionState.active}
              className={`
                bg-red-600 border-2 border-white px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded
                ${!actingEnemyId && !selectionState.active ? 'hover:bg-red-500 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}
              `}
          >
              {selectionState.active ? "選択中" : "ターン終了"}
          </button>
      </div>

      {/* 4. Hand Area (Horizontal Scroll) */}
      <div className={`h-44 md:h-48 bg-gray-900 border-t border-gray-700 relative z-10 ${selectionState.active ? 'bg-blue-900/20' : ''}`}>
        <div className="w-full h-full overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 flex items-center gap-2 custom-scrollbar touch-pan-x">
            {player.hand.map((card) => {
                // Check for special disabling conditions
                const isClashDisabled = card.name === '激突' && player.hand.some(c => c.type !== CardType.ATTACK && c.id !== card.id);
                const isGrandFinaleDisabled = card.name === 'グランドフィナーレ' && player.drawPile.length > 0;
                const specialDisabled = isClashDisabled || isGrandFinaleDisabled;
                
                // Visual Cost Override for Corruption
                const displayCard = { ...card };
                if (player.powers['CORRUPTION'] && card.type === CardType.SKILL) {
                    displayCard.cost = 0;
                }

                return (
                    <div key={card.id} className={`inline-block align-middle transition-transform duration-200 ${selectionState.active ? 'cursor-pointer hover:-translate-y-4' : ''}`}>
                        <Card 
                            card={displayCard} 
                            onClick={() => {
                                if (selectionState.active) {
                                    onHandSelection(card);
                                } else {
                                    if (!specialDisabled) onPlayCard(card);
                                }
                            }} 
                            disabled={
                                selectionState.active 
                                ? false 
                                : (player.currentEnergy < displayCard.cost || !!actingEnemyId || card.unplayable || specialDisabled)
                            }
                        />
                    </div>
                );
            })}
            {/* Spacer for right side of scroll */}
            <div className="w-4 shrink-0"></div>
        </div>
      </div>

      {/* Deck View Modal */}
      {showDeck && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeck(false)}>
            <div className="bg-gray-800 border-4 border-white w-full max-w-md h-[80vh] flex flex-col relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-black border-b-2 border-gray-600 p-4 flex justify-between items-center">
                    <h2 className="text-white text-xl font-bold flex items-center">
                        <Layers className="mr-2"/> デッキ一覧
                    </h2>
                    <button onClick={() => setShowDeck(false)} className="text-gray-400 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow bg-gray-900/90">
                    <div className="grid grid-cols-3 gap-2 justify-items-center">
                        {sortedDeck.map((card) => (
                            <div key={card.id} className="scale-75 origin-top-left w-24 h-36">
                                <Card card={card} onClick={() => {}} disabled={false} />
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
