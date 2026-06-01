
import React, { useEffect, useState } from 'react';
import { Player, Card as ICard, LanguageMode } from '../types';
import Card from './Card';
import { BedDouble, Hammer, ArrowRight, FlaskConical, Plus, Shuffle, Check, DoorOpen, Eraser } from 'lucide-react';
import { getUpgradedCard } from '../utils/cardUtils';
import { trans } from '../utils/textUtils';
import { assetUrl } from '../utils/assetPaths';
import { CARD_ERASER_NAME, getErasableEffectOptions } from '../utils/cardEraser';

const REST_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];

interface RestScreenProps {
  player: Player;
  onRest: () => void;
  onUpgrade: (card: ICard) => void;
  onSynthesize: (cards: ICard[]) => ICard;
  onSelfStudy: (card: ICard, effectId: string) => void;
  onLeave: () => void;
  languageMode: LanguageMode;
  typingMode?: boolean;
  scienceRoomChance?: number;
  interactionDisabled?: boolean;
  interactionDisabledMessage?: string;
}

const RestScreen: React.FC<RestScreenProps> = ({ player, onRest, onUpgrade, onSynthesize, onSelfStudy, onLeave, languageMode, typingMode = false, scienceRoomChance = 0.5, interactionDisabled = false, interactionDisabledMessage }) => {
  const [mode, setMode] = useState<'CHOICE' | 'UPGRADE' | 'SYNTHESIS' | 'SELF_STUDY' | 'ERASER_EFFECT' | 'PREVIEW_UPGRADE' | 'PREVIEW_SYNTHESIS' | 'RESULT' | 'DONE'>('CHOICE');
  const [message, setMessage] = useState("放課後の校舎だ。どこへ行こう？");
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [synthCards, setSynthCards] = useState<ICard[]>([]);
  const [resultCard, setResultCard] = useState<ICard | null>(null);
  
  // 50% chance for Science Room to be open normally
  const [isScienceRoomOpen] = useState(() => Math.random() < scienceRoomChance);

  const isMage = player.id === 'MAGE';
  // Science Club Kid (MAGE) always has the key to the Science Room
  const scienceRoomAvailable = isMage || isScienceRoomOpen;
  
  const healAmount = Math.floor(player.maxHp * 0.3);
  const requiredCards = isMage ? 3 : 2;
  const hasCardEraser = player.deck.some(card => card.name === CARD_ERASER_NAME || card.originalNames?.includes(CARD_ERASER_NAME));
  const synthesisCandidates = player.deck.filter(card => !card.familiarSummon);
  const selectableCards = mode === 'UPGRADE'
    ? player.deck.filter(c => !c.upgraded)
    : mode === 'SELF_STUDY'
      ? player.deck.filter(c => getErasableEffectOptions(c).length > 0)
    : mode === 'SYNTHESIS'
      ? synthesisCandidates
    : player.deck;
  const selectedEraserOptions = selectedCard ? getErasableEffectOptions(selectedCard) : [];

  useEffect(() => {
      if (!typingMode || interactionDisabled) return;
      const handleKeyDown = (e: KeyboardEvent) => {
          if (mode === 'CHOICE') {
              if (e.key === '1') { e.preventDefault(); handleRest(); }
              else if (e.key === '2') { e.preventDefault(); handleSmithChoice(); }
              else if (e.key === '3') { e.preventDefault(); handleSynthesizeChoice(); }
              else if (e.key === '4' && hasCardEraser) { e.preventDefault(); handleSelfStudyChoice(); }
              else if (e.key === '0' || e.key === 'Enter') { e.preventDefault(); onLeave(); }
              return;
          }
          if (mode === 'UPGRADE' || mode === 'SYNTHESIS' || mode === 'SELF_STUDY') {
              const shortcutIndex = REST_SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
              if (shortcutIndex >= 0) {
                  const card = selectableCards[shortcutIndex];
                  if (card) {
                      e.preventDefault();
                      handleCardClick(card);
                  }
              } else if (mode === 'SYNTHESIS' && e.key.toLowerCase() === 'r') {
                  e.preventDefault();
                  handleRandomSynthesis();
              } else if (e.key === '0' || e.key === 'Escape') {
                  e.preventDefault();
                  setMode('CHOICE');
                  setSynthCards([]);
                  setSelectedCard(null);
                  setMessage("放課後の校舎だ。どこへ行こう？");
              }
              return;
          }
          if (mode === 'ERASER_EFFECT') {
              const index = Number(e.key) - 1;
              if (index >= 0 && selectedCard && selectedEraserOptions[index]) {
                  e.preventDefault();
                  confirmSelfStudy(selectedEraserOptions[index].id);
              } else if (e.key === '0' || e.key === 'Escape') {
                  e.preventDefault();
                  setMode('SELF_STUDY');
              }
              return;
          }
          if (mode === 'PREVIEW_UPGRADE') {
              if (e.key === '1' || e.key === 'Enter') { e.preventDefault(); confirmUpgrade(); }
              else if (e.key === '0' || e.key === 'Escape') { e.preventDefault(); cancelPreview(); }
              return;
          }
          if (mode === 'PREVIEW_SYNTHESIS') {
              if (e.key === '1' || e.key === 'Enter') { e.preventDefault(); confirmSynthesize(); }
              else if (e.key === '0' || e.key === 'Escape') { e.preventDefault(); cancelPreview(); }
              return;
          }
          if (mode === 'RESULT') {
              if (e.key === 'Enter' || e.key === '1') {
                  e.preventDefault();
                  setMode('DONE');
                  setResultCard(null);
              }
              return;
          }
          if (mode === 'DONE' && (e.key === 'Enter' || e.key === '1')) {
              e.preventDefault();
              onLeave();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, mode, selectableCards, synthCards, selectedCard, requiredCards, interactionDisabled, hasCardEraser, selectedEraserOptions]);

  const handleRest = () => {
      if (interactionDisabled) return;
      onRest();
      setMode('DONE');
      setMessage(languageMode === 'ENGLISH'
          ? `You took a nap in the infirmary bed. Healed ${healAmount} HP!`
          : `保健室のベッドで仮眠をとった。HPが ${healAmount} 回復した！`);
  };

  const handleSmithChoice = () => {
      if (interactionDisabled) return;
      setMode('UPGRADE');
      setMessage("図工室だ。どの道具（カード）を改良する？");
  };

  const handleSynthesizeChoice = () => {
      if (interactionDisabled) return;
      if (!scienceRoomAvailable) return;
      if (synthesisCandidates.length < requiredCards) {
          setMessage(trans(`実験材料（カード）が${requiredCards}枚足りない...`, languageMode));
          return;
      }
      setMode('SYNTHESIS');
      setSynthCards([]);
      setMessage(isMage 
          ? `理科室だ。混ぜ合わせたいカードを3枚選んでね。\n(理科クラブ部長特典：3枚合成！)` 
          : "理科室だ。混ぜ合わせたいカードを2枚選んでね。");
  };

  const handleSelfStudyChoice = () => {
      if (interactionDisabled || !hasCardEraser) return;
      setMode('SELF_STUDY');
      setSelectedCard(null);
      setMessage("自習だ。カード消しゴムで、どのカードの不要な効果を消す？");
  };

  const handleCardClick = (card: ICard) => {
      if (interactionDisabled) return;
      if (mode === 'UPGRADE') {
          if (card.upgraded) return;
          setSelectedCard(card);
          setMode('PREVIEW_UPGRADE');
          setMessage("このカードを改良しますか？");
      } else if (mode === 'SYNTHESIS') {
          if (synthCards.find(c => c.id === card.id)) {
              // Deselect
              setSynthCards(synthCards.filter(c => c.id !== card.id));
          } else {
              // Select Logic
              if (synthCards.length < requiredCards) {
                  const newSelection = [...synthCards, card];
                  setSynthCards(newSelection);
                  
                  if (newSelection.length === requiredCards) {
                      setMode('PREVIEW_SYNTHESIS');
                      setMessage(trans(`この${requiredCards}枚を実験（合成）しますか？（元のカードは消えます）`, languageMode));
                  }
              }
          }
      } else if (mode === 'SELF_STUDY') {
          const options = getErasableEffectOptions(card);
          if (options.length === 0) return;
          setSelectedCard(card);
          setMode('ERASER_EFFECT');
          setMessage("消したい効果を選んでください。カード消しゴムは使用後に除外されます。");
      }
  };

  const confirmSelfStudy = (effectId: string) => {
      if (interactionDisabled || !selectedCard) return;
      onSelfStudy(selectedCard, effectId);
      setMode('DONE');
      setMessage(languageMode === 'ENGLISH'
          ? `Removed an unwanted effect from ${trans(selectedCard.name, languageMode)}! The card eraser was used up.`
          : `${trans(selectedCard.name, languageMode)} の不要な効果を消した！カード消しゴムは使い切った。`);
      setSelectedCard(null);
  };

  const handleRandomSynthesis = () => {
      if (interactionDisabled) return;
      if (synthesisCandidates.length < requiredCards) return;
      const shuffled = [...synthesisCandidates].sort(() => Math.random() - 0.5);
      const selection = shuffled.slice(0, requiredCards);
      setSynthCards(selection);
      setMode('PREVIEW_SYNTHESIS');
      setMessage(trans(`ランダムな${requiredCards}枚で実験しますか？`, languageMode));
  };

  const confirmUpgrade = () => {
      if (interactionDisabled) return;
      if (selectedCard) {
          onUpgrade(selectedCard);
          setMode('DONE');
          setMessage(languageMode === 'ENGLISH'
              ? `${trans(selectedCard.name, languageMode)} was upgraded! It feels sharper now.`
              : `${trans(selectedCard.name, languageMode)} が強化された！切れ味が増したようだ。`);
          setSelectedCard(null);
      }
  };

  const confirmSynthesize = () => {
      if (interactionDisabled) return;
      if (synthCards.length === requiredCards) {
          const result = onSynthesize(synthCards);
          setResultCard(result);
          setMode('RESULT');
          setMessage("実験成功！新たな力が生まれた！");
          setSynthCards([]);
      }
  };

  const cancelPreview = () => {
      if (interactionDisabled) return;
      if (mode === 'PREVIEW_UPGRADE') {
          setMode('UPGRADE');
          setSelectedCard(null);
          setMessage("どのカードを改良する？");
      } else if (mode === 'PREVIEW_SYNTHESIS') {
          setMode('SYNTHESIS');
          setSynthCards([]); 
          setMessage(isMage 
              ? `混ぜ合わせたいカードを3枚選んでね。` 
              : "混ぜ合わせたいカードを2枚選んでね。");
      }
  };

  return (
    <div
      className="main-rest-screen flex flex-col h-full w-full bg-gray-900 bg-cover bg-center text-white relative items-center justify-center p-4 md:p-8"
      style={{ backgroundImage: `url(${assetUrl('sprites/backgrounds/learning-rogue/rest-infirmary.webp')})` }}
    >
        <div className="absolute inset-0 bg-slate-950/58 pointer-events-none" />
        
        <div className="z-10 bg-black p-6 md:p-8 border-4 border-orange-800 rounded-lg max-w-4xl w-full text-center shadow-2xl flex flex-col max-h-[90vh]">
            {interactionDisabled && (
                <div className="mb-4 rounded-lg border border-cyan-500/50 bg-cyan-950/30 px-4 py-3 text-center text-sm font-bold text-cyan-100">
                    {interactionDisabledMessage ? trans(interactionDisabledMessage, languageMode) : trans('他のプレイヤーの選択を待っています', languageMode)}
                </div>
            )}
            <h2 className="text-3xl md:text-4xl text-orange-500 font-bold mb-4 flex items-center justify-center shrink-0">
                <DoorOpen className="mr-3" /> {trans("放課後の探索", languageMode)}
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 min-h-[3rem] shrink-0 whitespace-pre-wrap">{trans(message, languageMode)}</p>

            {mode === 'CHOICE' && (
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    {/* Health Room (Rest) */}
                    <button 
                        onClick={handleRest}
                        className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-green-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">1</div>}
                        <BedDouble size={40} className="text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg">{trans("保健室", languageMode)}</span>
                        <span className="text-xs text-gray-400">HP {healAmount} {trans("回復", languageMode)}</span>
                    </button>

                    {/* Art Room (Upgrade) */}
                    <button 
                        onClick={handleSmithChoice}
                        className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-yellow-500 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">2</div>}
                        <Hammer size={40} className="text-yellow-500 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-lg">{trans("図工室", languageMode)}</span>
                        <span className="text-xs text-gray-400">{trans("カード強化", languageMode)}</span>
                    </button>

                    {/* Science Room (Synthesis) */}
                    <button 
                        onClick={handleSynthesizeChoice}
                        disabled={!scienceRoomAvailable}
                        className={`group relative flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all w-32 md:w-40
                            ${scienceRoomAvailable 
                                ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-800 cursor-pointer' 
                                : 'border-gray-800 bg-black/50 opacity-50 cursor-not-allowed grayscale'}
                        `}
                    >
                        {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">3</div>}
                        <FlaskConical size={40} className={`text-purple-500 ${scienceRoomAvailable ? 'group-hover:shake' : ''} transition-transform`} />
                        <span className="font-bold text-lg">{trans("理科室", languageMode)}</span>
                        <span className="text-xs text-gray-400">
                            {scienceRoomAvailable 
                                ? (isMage ? trans("3枚合成", languageMode) : trans("カード合成", languageMode)) 
                                : trans("鍵がかかってる", languageMode)}
                        </span>
                    </button>
                    {hasCardEraser && (
                        <button 
                            onClick={handleSelfStudyChoice}
                            className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-600 hover:border-cyan-400 rounded-lg hover:bg-gray-800 transition-all w-32 md:w-40"
                        >
                            {typingMode && <div className="absolute right-2 top-2 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">4</div>}
                            <Eraser size={40} className="text-cyan-300 group-hover:rotate-12 transition-transform" />
                            <span className="font-bold text-lg">{trans("自習", languageMode)}</span>
                            <span className="text-xs text-gray-400">{trans("不要効果を削除", languageMode)}</span>
                        </button>
                    )}
                </div>
            )}

            {(mode === 'UPGRADE' || mode === 'SYNTHESIS' || mode === 'SELF_STUDY') && (
                <div className="flex flex-col items-center flex-grow overflow-hidden">
                     {mode === 'SYNTHESIS' && (
                         <button 
                            onClick={handleRandomSynthesis}
                            className="mb-4 flex items-center bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full border border-purple-500 transition-colors text-sm"
                         >
                             <Shuffle size={14} className="mr-2" /> {trans(`ランダムな${requiredCards}枚を選ぶ`, languageMode)}
                         </button>
                     )}
                     <div className="flex flex-wrap justify-center gap-4 overflow-y-auto w-full p-4 border-inner bg-gray-900/50 rounded custom-scrollbar">
                        {selectableCards.map((card, index) => {
                            const isSelected = synthCards.some(s => s.id === card.id);
                            const shortcutKey = REST_SHORTCUT_KEYS[index];
                            return (
                                <div 
                                    key={card.id} 
                                    className={`scale-75 md:scale-90 transition-transform cursor-pointer relative ${isSelected ? 'ring-4 ring-purple-500 rounded-lg scale-95' : 'hover:scale-100'}`} 
                                    onClick={() => handleCardClick(card)}
                                >
                                    {typingMode && shortcutKey && <div className="absolute right-1 top-1 z-30 rounded-full border border-cyan-300 bg-cyan-950/95 px-1.5 py-0.5 text-[10px] font-black uppercase text-cyan-200">{shortcutKey}</div>}
                                    <Card card={card} onClick={() => handleCardClick(card)} disabled={false} languageMode={languageMode}/>
                                    {isSelected && <div className="absolute top-0 right-0 bg-purple-600 text-white rounded-full p-1"><FlaskConical size={16}/></div>}
                                </div>
                            );
                        })}
                        {mode === 'UPGRADE' && player.deck.every(c => c.upgraded) && <p className="text-gray-500">{trans("強化できるカードがない...", languageMode)}</p>}
                        {mode === 'SELF_STUDY' && selectableCards.length === 0 && <p className="text-gray-500">{trans("消せる効果があるカードがない...", languageMode)}</p>}
                     </div>
                     {typingMode && (
                        <div className="mt-3 text-xs text-cyan-200/90">
                            {trans("カード選択:", languageMode)} 1-9 / QWERTY... ・ {trans("戻る:", languageMode)} 0 / Esc
                            {mode === 'SYNTHESIS' ? ` ・ ${trans("ランダム合成:", languageMode)} R` : ''}
                        </div>
                     )}
                     <button onClick={() => { setMode('CHOICE'); setSynthCards([]); setMessage("放課後の校舎だ。どこへ行こう？"); }} className="mt-4 text-gray-400 underline hover:text-white shrink-0">{trans("戻る", languageMode)}{typingMode && ' [0]'}</button>
                </div>
            )}

            {mode === 'ERASER_EFFECT' && selectedCard && (
                <div className="flex flex-col items-center gap-4">
                    <div className="scale-90">
                        <Card card={selectedCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                    </div>
                    <div className="grid w-full max-w-xl gap-3">
                        {selectedEraserOptions.map((option, index) => (
                            <button
                                key={option.id}
                                onClick={() => confirmSelfStudy(option.id)}
                                className="relative rounded border-2 border-cyan-500 bg-cyan-950/40 px-4 py-3 text-left hover:bg-cyan-900/60"
                            >
                                {typingMode && <span className="absolute right-2 top-2 rounded-full border border-cyan-300 px-2 py-0.5 text-xs font-black">{index + 1}</span>}
                                <div className="font-black text-cyan-100">{trans(option.label, languageMode)}</div>
                                <div className="text-xs text-cyan-200/80">{trans(option.description, languageMode)}</div>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setMode('SELF_STUDY')} className="text-gray-400 underline hover:text-white">{trans("戻る", languageMode)}{typingMode && ' [0]'}</button>
                </div>
            )}

            {mode === 'PREVIEW_UPGRADE' && selectedCard && (
                <div className="rest-upgrade-preview flex flex-col items-center">
                    <div className="rest-upgrade-preview-cards flex items-center justify-center gap-4 md:gap-8 mb-8">
                        <div className="rest-upgrade-before scale-90 md:scale-100">
                             <Card card={selectedCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                             <div className="text-center mt-2 text-gray-400">{trans("強化前", languageMode)}</div>
                        </div>
                        <ArrowRight size={32} className="text-yellow-500 animate-pulse" />
                        <div className="rest-upgrade-after scale-100 md:scale-110">
                             <Card card={getUpgradedCard(selectedCard)} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                             <div className="text-center mt-2 text-green-400 font-bold">{trans("強化後", languageMode)}</div>
                        </div>
                    </div>
                    {typingMode && (
                        <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-sm text-cyan-100">
                            {trans("確認:", languageMode)} 1 / Enter ・ {trans("キャンセル:", languageMode)} 0 / Esc
                        </div>
                    )}
                    <div className="rest-upgrade-actions flex gap-4">
                        <button onClick={confirmUpgrade} className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded font-bold border border-white">
                            {trans("改良する", languageMode)}{typingMode && ' [1]'}
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-2 rounded border border-gray-400">
                            {trans("やめる", languageMode)}{typingMode && ' [0]'}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'PREVIEW_SYNTHESIS' && synthCards.length === requiredCards && (
                <div className="flex flex-col items-center flex-grow overflow-y-auto custom-scrollbar w-full">
                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4 flex-grow content-center">
                        {synthCards.map((card, idx) => (
                            <React.Fragment key={card.id}>
                                <div className="scale-[0.65] md:scale-90 origin-center">
                                     <Card card={card} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                                </div>
                                {idx < synthCards.length - 1 && <Plus size={20} className="text-gray-500" />}
                            </React.Fragment>
                        ))}
                        
                        <ArrowRight size={24} className="text-purple-500 animate-pulse mx-1 md:mx-2" />
                        
                        <div className="w-24 h-36 md:w-32 md:h-48 border-4 border-purple-500 bg-black rounded-lg flex flex-col items-center justify-center animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.6)] shrink-0">
                            <FlaskConical size={32} className="text-purple-400 mb-2" />
                            <div className="text-purple-200 font-bold text-sm">???</div>
                            <div className="text-[10px] text-purple-400 mt-1">{trans("実験中...", languageMode)}</div>
                        </div>
                    </div>
                    {typingMode && (
                        <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-4 py-2 text-sm text-cyan-100">
                            {trans("確認:", languageMode)} 1 / Enter ・ {trans("キャンセル:", languageMode)} 0 / Esc
                        </div>
                    )}
                    <div className="flex gap-4 pb-4 shrink-0 justify-center">
                        <button onClick={confirmSynthesize} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold border border-white shadow-lg whitespace-nowrap">
                            {trans("実験開始！", languageMode)}{typingMode && ' [1]'}
                        </button>
                        <button onClick={cancelPreview} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg border border-gray-400 whitespace-nowrap">
                            {trans("戻る", languageMode)}{typingMode && ' [0]'}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'RESULT' && resultCard && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="scale-110 mb-8">
                        <Card card={resultCard} onClick={() => {}} disabled={false} languageMode={languageMode}/>
                    </div>
                    <button 
                        onClick={() => { setMode('DONE'); setResultCard(null); }}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg flex items-center"
                    >
                        <Check className="mr-2" /> OK{typingMode && ' [Enter]'}
                    </button>
                </div>
            )}

            {mode === 'DONE' && (
                <button 
                    onClick={onLeave}
                    className="bg-orange-700 hover:bg-orange-600 text-white px-8 py-3 rounded text-xl font-bold border-2 border-white shadow-lg animate-bounce mt-8 mx-auto"
                >
                    {trans("出発する", languageMode)}{typingMode && ' [Enter]'}
                </button>
            )}
        </div>
    </div>
  );
};

export default RestScreen;
