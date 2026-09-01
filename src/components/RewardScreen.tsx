
import React, { useEffect, useState, useRef } from 'react';
import { Card as ICard, RewardItem, Potion, LanguageMode, RaceTrickCard, CoopSupportCard } from '../types';
import Card from './Card';
import CardInspectionModal from './CardInspectionModal';
import { Gift, Gem, Coins, FlaskConical, X, Flag, Sparkles, Users } from 'lucide-react';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import { PotionIcon, RelicIcon } from './ItemIcon';
import type { VisualThemeId } from '../data/visualThemes';
import type { EndlessRewardChoice } from '../data/endlessMode';

interface RewardScreenProps {
  rewards: RewardItem[];
  onSelectReward: (item: RewardItem, replacePotionId?: string) => void;
  onSkip: () => void;
  isLoading: boolean;
  currentPotions?: Potion[];
  potionCapacity?: number;
  languageMode: LanguageMode;
  typingMode?: boolean;
  dummyRewards?: number;
  autoSkipWhenEmpty?: boolean;
  skipDisabled?: boolean;
  skipDisabledMessage?: string;
  interactionDisabled?: boolean;
  interactionDisabledMessage?: string;
  visualTheme?: VisualThemeId;
  endlessFloor?: number;
  endlessBossName?: string;
  endlessBonusGold?: number;
  onRerollEndlessReward?: () => void;
  endlessRerollAvailable?: boolean;
}

const RewardScreen: React.FC<RewardScreenProps> = ({ rewards, onSelectReward, onSkip, isLoading, currentPotions = [], potionCapacity = 3, languageMode, typingMode = false, dummyRewards = 0, autoSkipWhenEmpty = true, skipDisabled = false, skipDisabledMessage, interactionDisabled = false, interactionDisabledMessage, visualTheme = 'elementary', endlessFloor, endlessBossName, endlessBonusGold, onRerollEndlessReward, endlessRerollAvailable = false }) => {
  const [replaceReward, setReplaceReward] = useState<RewardItem | null>(null);
  const [inspectedItem, setInspectedItem] = useState<{ type: 'CARD' | 'RELIC' | 'POTION', data: any } | null>(null);
  const longPressTimer = useRef<any>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currencyLabel = visualTheme === 'magic' ? '魔晶' : 'ゴールド';

  const handlePointerDown = (e: React.PointerEvent, itemType: 'RELIC' | 'POTION', data: any) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
          setInspectedItem({ type: itemType, data });
      }, 700);
  };

  const handlePointerUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
      if (dist > 10) {
          handlePointerUp();
      }
  };

  useEffect(() => {
    if (autoSkipWhenEmpty && !isLoading && !interactionDisabled && rewards.length === 0) {
      const timer = setTimeout(() => {
        onSkip();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoSkipWhenEmpty, rewards, isLoading, interactionDisabled, onSkip]);

  useEffect(() => {
    if (!typingMode || interactionDisabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (inspectedItem) {
        if (e.key === 'Escape' || e.key === '0' || e.key === 'Enter') {
          e.preventDefault();
          setInspectedItem(null);
        }
        return;
      }
      if (replaceReward) {
        if (e.key >= '1' && e.key <= '9') {
          const index = Number(e.key) - 1;
          const potion = currentPotions[index];
          if (potion) {
            e.preventDefault();
            confirmReplace(potion.id);
          }
        } else if (e.key === '0' || e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          setReplaceReward(null);
        }
        return;
      }
      if (e.key.toLowerCase() === 'r' && endlessRerollAvailable && onRerollEndlessReward && rewards.some(reward => reward.type === 'ENDLESS_REWARD')) {
        e.preventDefault();
        onRerollEndlessReward();
      } else if (e.key >= '1' && e.key <= '9') {
        const index = Number(e.key) - 1;
        const reward = rewards[index];
        if (!reward) return;
        e.preventDefault();
        if (reward.type === 'POTION') {
          handlePotionClick(reward);
        } else {
          onSelectReward(reward);
        }
      } else if ((e.key === '0' || e.key === 'Enter') && !skipDisabled) {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, isLoading, inspectedItem, replaceReward, currentPotions, rewards, onSkip, interactionDisabled, skipDisabled, endlessRerollAvailable, onRerollEndlessReward]);

  const handlePotionClick = (reward: RewardItem) => {
      if (interactionDisabled) return;
      if (currentPotions.length >= potionCapacity) {
          setReplaceReward(reward);
      } else {
          onSelectReward(reward);
      }
  };

  const confirmReplace = (replaceId: string) => {
      if (interactionDisabled) return;
      if (!replaceReward) return;
      onSelectReward(replaceReward, replaceId);
      setReplaceReward(null);
  };

  return (
    <div
      data-gamepad-initial-scope="reward-screen"
      data-gamepad-navigation-root
      className="main-reward-screen flex flex-col items-center justify-center h-full w-full bg-gray-900 bg-cover bg-center text-white relative p-4"
      style={{
        backgroundImage: `url(${assetUrl(visualTheme === 'magic'
          ? 'sprites/backgrounds/learning-rogue/magic-reward-sanctuary.webp'
          : 'sprites/backgrounds/learning-rogue/reward-rooftop.webp')})`
      }}
    >
      <div className="absolute inset-0 bg-slate-950/58 pointer-events-none" />
      
      {/* Inspection Modal */}
       {inspectedItem?.type === 'CARD' && (
            <CardInspectionModal
                card={inspectedItem.data}
                languageMode={languageMode}
                onClose={() => setInspectedItem(null)}
            />
        )}
       {inspectedItem && inspectedItem.type !== 'CARD' && (
            <div className="app-modal-overlay fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setInspectedItem(null)}>
                <div className="app-modal-panel app-item-inspection-modal bg-gray-800 border-2 border-white p-6 rounded-lg max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInspectedItem(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2">
                        <X size={24} />
                    </button>
                    
                    <div className="flex flex-col items-center mb-4">
                        {inspectedItem.type === 'RELIC' && (
                            <div className="w-20 h-20 bg-gray-800 border-4 border-yellow-600 rounded-full flex items-center justify-center mb-4 shadow-lg p-3">
                                <RelicIcon id={inspectedItem.data.id} alt={trans(inspectedItem.data.name, languageMode)} />
                            </div>
                        )}
                        {inspectedItem.type === 'POTION' && (
                            <div className="w-20 h-20 bg-gray-800 border-2 border-white/50 rounded flex items-center justify-center mb-4 shadow-lg p-3">
                                <PotionIcon id={inspectedItem.data.templateId} alt={trans(inspectedItem.data.name, languageMode)} />
                            </div>
                        )}
                        
                        <h3 className="text-2xl font-bold text-yellow-400 mb-2 border-b border-gray-600 pb-2 text-center w-full">
                            {trans(inspectedItem.data.name, languageMode)}
                        </h3>
                    </div>

                    <div className="text-lg text-white mb-6 leading-relaxed whitespace-pre-wrap font-bold bg-black/30 p-3 rounded text-center">
                        {trans(inspectedItem.data.description, languageMode)}
                    </div>
                </div>
            </div>
        )}

      {/* Replacement Modal */}
      {replaceReward && (
           <div data-gamepad-modal data-gamepad-initial-scope="reward-potion-replace" className="app-modal-overlay app-potion-replace-modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplaceReward(null)}>
               <div className="app-modal-panel app-potion-replace-modal relative bg-gray-900 border-2 border-white p-6 rounded shadow-2xl max-sm w-full text-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                   <button type="button" data-gamepad-back className="absolute top-2 right-2 cursor-pointer" onClick={() => setReplaceReward(null)} aria-label={trans('やめる', languageMode)}>
                       <X size={24} className="text-gray-400 hover:text-white" />
                   </button>
                   <h3 className="text-xl font-bold text-white mb-4">{trans("ポーションがいっぱいです", languageMode)}</h3>
                   <p className="text-sm text-gray-300 mb-6">{trans("どれを捨てて入れ替えますか？", languageMode)}</p>
                   
                   <div className="flex justify-center gap-4 mb-4">
                        {currentPotions.map((p, index) => (
                            <div
                                key={p.id}
                                role="button"
                                tabIndex={0}
                                data-gamepad-initial-choice={index === 0 ? true : undefined}
                                data-gamepad-zone="reward-potion-replace-options"
                                data-gamepad-order={index}
                                className="relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => confirmReplace(p.id)}
                            >
                                {typingMode && <div className="absolute -right-1 -top-1 z-10 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">{currentPotions.findIndex(cp => cp.id === p.id) + 1}</div>}
                                <div className="w-12 h-12 bg-gray-800 border-2 border-white rounded-full flex items-center justify-center mb-1 p-1.5">
                                    <PotionIcon id={p.templateId} alt={trans(p.name, languageMode)} />
                                </div>
                                <div className="text-xs text-gray-400 w-16 truncate text-center">{trans(p.name, languageMode)}</div>
                            </div>
                        ))}
                   </div>
                   
                   <button data-gamepad-back data-gamepad-zone="reward-potion-replace-cancel" data-gamepad-order={0} onClick={() => setReplaceReward(null)} className="mt-4 text-sm text-gray-500 hover:text-white underline">
                       {trans("やめる", languageMode)}{typingMode && ' [0]'}
                   </button>
               </div>
           </div>
       )}

      <div className="z-10 text-center mb-4 shrink-0 pt-4">
        {interactionDisabled && (
          <div className="mx-auto mb-4 max-w-xl rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
            {interactionDisabledMessage ? trans(interactionDisabledMessage, languageMode) : trans('他のプレイヤーの選択を待っています', languageMode)}
          </div>
        )}
        <h2 className="text-3xl md:text-4xl text-amber-100 font-bold mb-2 flex items-center justify-center animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] [text-shadow:0_0_10px_rgba(120,53,15,0.95)]">
          <Gift className="mr-3" size={32} /> {trans(visualTheme === 'magic' ? "魔力回収" : "勝利", languageMode)}
        </h2>
        {rewards.some(reward => reward.type === 'ENDLESS_REWARD') && (
          <div className="mx-auto mb-2 max-w-2xl rounded-lg border border-fuchsia-400/50 bg-fuchsia-950/40 px-3 py-2 text-xs font-black text-fuchsia-100">
            FLOOR {String(endlessFloor ?? 0).padStart(2, '0')} BOSS REWARD
            {endlessBossName && <span className="ml-2 text-white">{endlessBossName}</span>}
            {typeof endlessBonusGold === 'number' && <span className="ml-2 text-amber-200">+{endlessBonusGold}G</span>}
          </div>
        )}
        <p className="text-white text-sm font-bold drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] [text-shadow:0_0_8px_rgba(15,23,42,0.9)]">{trans(visualTheme === 'magic' ? "結界に残った魔力から、次に持ち込む力を選んでください" : "欲しい報酬を選択してください", languageMode)}</p>
        {rewards.some(reward => reward.type === 'ENDLESS_REWARD') && onRerollEndlessReward && (
          <button
            type="button"
            data-gamepad-initial-choice
            data-gamepad-zone="endless-reward-reroll"
            disabled={!endlessRerollAvailable || interactionDisabled || isLoading}
            onClick={onRerollEndlessReward}
            className="mt-2 rounded border border-fuchsia-300/70 bg-fuchsia-900/70 px-4 py-1.5 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {trans(endlessRerollAvailable ? '再抽選（残り1回）' : '再抽選済み', languageMode)}{typingMode && endlessRerollAvailable && ' [R]'}
          </button>
        )}
      </div>

      <div className={`z-10 flex flex-row items-center gap-8 w-full overflow-x-auto md:justify-center landscape:justify-center custom-scrollbar px-4 pt-20 pb-8 min-h-[420px] snap-x ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {rewards.map((reward, rewardIndex) => (
          <div key={reward.id} className="snap-center shrink-0 transform hover:scale-105 transition-transform duration-200 flex justify-center">
            
            {reward.type === 'CARD' && (
                <div className="relative flex flex-col items-center w-48"> 
                    {typingMode && <div className="absolute right-0 top-0 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="scale-110 mb-8 mt-6">
                        <Card 
                            card={reward.value as ICard} 
                            onClick={() => !isLoading && !interactionDisabled && onSelectReward(reward)} 
                            disabled={isLoading || interactionDisabled} 
                            onInspect={(c) => setInspectedItem({ type: 'CARD', data: c })}
                            languageMode={languageMode}
                        />
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} onClick={() => !interactionDisabled && onSelectReward(reward)} disabled={interactionDisabled} className="mt-4 bg-blue-600 px-6 py-2 text-sm font-bold rounded border hover:bg-blue-500 shadow-lg w-full disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}
            
            {reward.type === 'RELIC' && (
                <div 
                    className="relative w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => !interactionDisabled && onSelectReward(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'RELIC', data: reward.value }); }}
                    onPointerDown={(e) => handlePointerDown(e, 'RELIC', reward.value)}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-3 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)] h-20 w-20">
                        <RelicIcon id={reward.value.id} alt={trans(reward.value.name, languageMode)} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-yellow-100 font-bold text-lg mb-2 truncate">{trans(reward.value.name, languageMode)}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{trans(reward.value.description, languageMode)}</div>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'GOLD' && (
                <div className="relative w-48 bg-black/60 border-2 border-yellow-500 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-4 rounded-full border-2 border-yellow-600 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Coins size={40} className="text-yellow-400" />
                    </div>
                    <div className="text-center mb-auto flex flex-col justify-center h-full">
                        <div className="text-yellow-100 font-bold text-2xl mb-2">{reward.value} G</div>
                        <div className="text-xs text-gray-400">{trans(`${currencyLabel}を獲得`, languageMode)}</div>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} className="bg-yellow-600 px-6 py-2 text-sm font-bold rounded border hover:bg-yellow-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'POTION' && (
                <div 
                    className="relative w-48 bg-black/60 border-2 border-white/50 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" 
                    onClick={() => !interactionDisabled && handlePotionClick(reward)}
                    onContextMenu={(e) => { e.preventDefault(); setInspectedItem({ type: 'POTION', data: reward.value }); }}
                    onPointerDown={(e) => handlePointerDown(e, 'POTION', reward.value)}
                    onPointerUp={handlePointerUp}
                    onPointerMove={handlePointerMove}
                >
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-gray-800 p-3 rounded-full border-2 border-white/50 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)] h-20 w-20">
                        <PotionIcon id={(reward.value as Potion).templateId} alt={trans(reward.value.name, languageMode)} />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="text-white font-bold text-lg mb-2 truncate">{trans(reward.value.name, languageMode)}</div>
                        <div className="text-xs text-gray-400 leading-tight h-16 overflow-hidden">{trans(reward.value.description, languageMode)}</div>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} className="bg-gray-600 px-6 py-2 text-sm font-bold rounded border hover:bg-gray-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'ENDLESS_REWARD' && (
                <div
                    className="relative w-56 bg-gradient-to-b from-slate-950/95 to-indigo-950/90 border-2 border-cyan-400 rounded-xl flex flex-col items-center justify-between p-5 cursor-pointer hover:bg-indigo-900/90 shadow-[0_0_24px_rgba(34,211,238,0.22)] h-80"
                    onClick={() => !interactionDisabled && onSelectReward(reward)}
                >
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="rounded-full border-2 border-cyan-300 bg-slate-900 p-4 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.38)]">
                        <Gem size={36} />
                    </div>
                    <div className="mt-3 w-full text-center">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">{(reward.value as EndlessRewardChoice).slot}</div>
                        <div className="mb-2 text-lg font-black text-white">{trans((reward.value as EndlessRewardChoice).name, languageMode)}</div>
                        <div className="mb-2 text-xs font-bold leading-relaxed text-slate-200">{trans((reward.value as EndlessRewardChoice).description, languageMode)}</div>
                        <span className="inline-flex rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] font-black text-amber-200">{(reward.value as EndlessRewardChoice).scope}</span>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} onClick={(event) => { event.stopPropagation(); onSelectReward(reward); }} className="bg-cyan-600 px-6 py-2 text-sm font-bold rounded border border-cyan-200 hover:bg-cyan-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("この報酬を選ぶ", languageMode)}</button>
                </div>
            )}

            {reward.type === 'RACE_TRICK' && (
                <div className="relative w-48 bg-gradient-to-b from-fuchsia-950/90 to-slate-950 border-2 border-fuchsia-400 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-fuchsia-950/70 p-4 rounded-full border-2 border-fuchsia-300 mb-4 shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                        <Flag size={40} className="text-fuchsia-200" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-200 mb-1">
                            <Sparkles size={12} />
                            Race Trick
                        </div>
                        <div className="text-fuchsia-50 font-bold text-lg mb-2">{trans((reward.value as RaceTrickCard).name, languageMode)}</div>
                        <div className="text-xs text-fuchsia-100/80 leading-tight h-16 overflow-hidden">{trans((reward.value as RaceTrickCard).description, languageMode)}</div>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} className="bg-fuchsia-600 px-6 py-2 text-sm font-bold rounded border hover:bg-fuchsia-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}

            {reward.type === 'COOP_SUPPORT' && (
                <div className="relative w-48 bg-gradient-to-b from-emerald-950/90 to-slate-950 border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-between p-6 cursor-pointer hover:bg-black/80 shadow-lg h-72" onClick={() => !interactionDisabled && onSelectReward(reward)}>
                    {typingMode && <div className="absolute right-2 top-2 z-20 rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">{rewards.findIndex(r => r.id === reward.id) + 1}</div>}
                    <div className="bg-emerald-950/70 p-4 rounded-full border-2 border-emerald-300 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <Users size={40} className="text-emerald-200" />
                    </div>
                    <div className="text-center mb-auto w-full">
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 mb-1">
                            <Sparkles size={12} />
                            Coop Support
                        </div>
                        <div className="text-emerald-50 font-bold text-lg mb-2">{trans((reward.value as CoopSupportCard).name, languageMode)}</div>
                        <div className="text-xs text-emerald-100/80 leading-tight h-16 overflow-hidden">{trans((reward.value as CoopSupportCard).description, languageMode)}</div>
                    </div>
                    <button data-gamepad-initial-choice data-gamepad-zone="reward-options" data-gamepad-order={rewardIndex} disabled={interactionDisabled} className="bg-emerald-600 px-6 py-2 text-sm font-bold rounded border hover:bg-emerald-500 w-full mt-2 disabled:cursor-not-allowed disabled:opacity-50">{trans("獲得", languageMode)}</button>
                </div>
            )}
          </div>
        ))}
        {Array.from({ length: dummyRewards }).map((_, index) => (
          <div key={`dummy-${index}`} className="snap-center shrink-0 flex justify-center opacity-80">
            <div className="relative w-48 bg-black/40 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-between p-6 shadow-lg h-72 pointer-events-none">
              <div className="bg-slate-800 p-4 rounded-full border-2 border-slate-500 mb-4">
                <X size={40} className="text-slate-400" />
              </div>
              <div className="text-center mb-auto w-full">
                <div className="text-slate-100 font-bold text-lg mb-2">{trans("ダミー報酬", languageMode)}</div>
                <div className="text-xs text-slate-400 leading-tight h-16 overflow-hidden">{trans("プリントが混ざっていて選べません。", languageMode)}</div>
              </div>
              <button className="bg-slate-700 px-6 py-2 text-sm font-bold rounded border w-full mt-2">{trans("選択不可", languageMode)}</button>
            </div>
          </div>
        ))}
      </div>

      {skipDisabled && rewards.length === 0 && (
        <div className="z-10 mb-4 rounded-lg border border-yellow-500/40 bg-yellow-950/20 px-4 py-3 text-center text-sm font-bold text-yellow-100">
          {skipDisabledMessage ? trans(skipDisabledMessage, languageMode) : trans('他のプレイヤーの報酬完了を待っています', languageMode)}
        </div>
      )}

      <div className="z-10">
        {skipDisabled && skipDisabledMessage && (
          <div className="mb-2 text-center text-xs font-bold text-yellow-300">{trans(skipDisabledMessage, languageMode)}</div>
        )}
        <button
          data-gamepad-zone="reward-skip"
          data-gamepad-order={0}
          onClick={interactionDisabled || skipDisabled ? undefined : onSkip}
          disabled={isLoading || interactionDisabled || skipDisabled}
          className="text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
        >
          {isLoading ? trans("読み込み中...", languageMode) : `${trans("これ以上受け取らずに進む", languageMode)} >>`}
        </button>
        {typingMode && <div className="mt-2 text-center text-[10px] font-bold text-cyan-300">{languageMode === 'ENGLISH' ? '1-9: Select / 0 or Enter: Continue' : trans('1-9: 選択 / 0 or Enter: 進む', languageMode)}</div>}
      </div>
    </div>
  );
};

export default RewardScreen;
