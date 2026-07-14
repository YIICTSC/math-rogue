
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActStats, LanguageMode, Card as ICard, MagicRomanceProgress } from '../types';
import { GAME_STORIES } from '../data/stories';
import { HIGH_SCHOOL_STORIES } from '../data/highSchoolStories';
import { getMagicActStoryPart, MAGIC_STORIES } from '../data/magicStories';
import { ROMANCE_TARGETS } from '../data/romanceTargets';
import { MAGIC_HEROES, isMagicMaleProtagonist } from '../data/magicHeroes';
import { ADDITIONAL_CARDS } from '../constants1';
import { trans, transEventText } from '../utils/textUtils';
import { Skull, Coins, Brain, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { audioService } from '../services/audioService';
import Card from './Card';
import { assetUrl } from '../utils/assetPaths';

interface FloorResultScreenProps {
  act: number;
  stats: ActStats;
  storyIndex: number;
  onNext: () => void;
  languageMode: LanguageMode;
  newlyUnlockedCardName?: string; // 追加
  typingMode?: boolean;
  visualTheme?: 'elementary' | 'high-school' | 'magic';
  magicHeroId?: string;
  magicRomance?: MagicRomanceProgress;
}

const FloorResultScreen: React.FC<FloorResultScreenProps> = ({ act, stats, storyIndex, onNext, languageMode, newlyUnlockedCardName, typingMode = false, visualTheme = 'elementary', magicHeroId = 'AKARI', magicRomance }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  const storyPool = visualTheme === 'high-school'
    ? HIGH_SCHOOL_STORIES
    : visualTheme === 'magic'
      ? MAGIC_STORIES
      : GAME_STORIES;
  const storySet = storyPool[storyIndex % storyPool.length] || storyPool[0];
  const closestTargetEntry = useMemo(() => {
    const ranked = Object.entries(magicRomance?.affection ?? {}).sort((a, b) => b[1] - a[1]);
    if (!ranked.length || ranked[0][1] <= 0) return null;
    return {
      target: isMagicMaleProtagonist(magicHeroId)
        ? MAGIC_HEROES.find((entry) => entry.id === ranked[0][0])
        : ROMANCE_TARGETS.find((entry) => entry.id === ranked[0][0]),
      affection: ranked[0][1],
    };
  }, [magicHeroId, magicRomance]);
  const currentPart = useMemo(() => {
    return visualTheme === 'magic'
      ? getMagicActStoryPart(magicHeroId, act, closestTargetEntry?.target?.name, closestTargetEntry?.affection, storySet)
      : storySet.parts[(act - 1) % 3];
  }, [visualTheme, magicHeroId, act, closestTargetEntry, storySet]);

  // 解放されたカード情報の取得
  const unlockedCard = useMemo(() => {
    if (!newlyUnlockedCardName) return null;
    const cardTemplate = Object.values(ADDITIONAL_CARDS).find(c => c.name === newlyUnlockedCardName);
    if (!cardTemplate) return null;
    return { ...cardTemplate, id: `unlock-display-${Date.now()}` } as ICard;
  }, [newlyUnlockedCardName]);


  useEffect(() => {
    let index = 0;
    const rawContent = currentPart.content;
    const translatedContent = transEventText(rawContent, languageMode);
    
    setDisplayedText("");
    setIsTyping(true);
    
    const interval = setInterval(() => {
      if (index < translatedContent.length) {
        setDisplayedText(translatedContent.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 40);

    return () => {
      clearInterval(interval);
    };
  }, [currentPart.content, languageMode]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(transEventText(currentPart.content, languageMode));
      setIsTyping(false);
    } else {
      onNext();
      audioService.playSound('select');
    }
  };

  useEffect(() => {
    if (!typingMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '1') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingMode, isTyping, currentPart, languageMode]);

  return (
    <div
      className="main-floor-result-screen w-full h-full bg-[#0a0a0a] bg-cover bg-center flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden font-mono"
      style={visualTheme === 'magic' ? { backgroundImage: `url(${assetUrl('sprites/backgrounds/learning-rogue/magic-act-clear.webp')})` } : undefined}
    >
      {visualTheme === 'magic' && <div className="absolute inset-0 bg-slate-950/62 pointer-events-none" />}
      {/* Background decoration */}
      <div className={`absolute inset-0 pointer-events-none flex items-center justify-center ${visualTheme === 'magic' ? 'opacity-5' : 'opacity-10'}`}>
        <BookOpen className="text-gray-500 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px]" />
      </div>

      <div className="floor-result-panel z-10 w-full max-w-2xl md:max-w-5xl bg-black/90 border-2 sm:border-4 border-gray-700 p-4 sm:p-8 md:p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[95vh] flex flex-col overflow-y-auto md:overflow-hidden custom-scrollbar">
        <div className="floor-result-header text-center mb-4 sm:mb-6 md:mb-4 shrink-0">
          <h2 className="floor-result-heading text-3xl sm:text-4xl md:text-5xl font-black text-gray-100 mb-2 tracking-tighter italic">
            {languageMode === 'ENGLISH' ? `ACT ${act} CLEARED` : languageMode === 'HIRAGANA' ? `だい${act}しょう くりあ` : `第${act}章クリア`}
          </h2>
          <div className="h-1 w-24 sm:w-32 bg-gray-500 mx-auto rounded-full"></div>
        </div>

        {/* Responsive Body Grid: Only grid on md: when unlockedCard exists */}
        <div className={`floor-result-body flex flex-col flex-grow min-h-0 ${unlockedCard ? 'has-unlocked-card md:grid md:grid-cols-12 md:gap-6' : ''}`}>
            
            {/* Left Side: Unlocked Card (Column 1-5 on PC) */}
            {unlockedCard && (
                <div className="floor-result-unlocked md:col-span-5 flex flex-col justify-center mb-6 md:mb-0">
                    <div className="floor-result-unlocked-panel p-4 bg-yellow-600/10 border-2 border-yellow-500/50 rounded-xl animate-in zoom-in duration-700 delay-300 h-full flex flex-col">
                        <div className="floor-result-unlocked-title flex items-center justify-center gap-2 text-yellow-400 font-black text-xs sm:text-sm mb-3 italic tracking-widest shrink-0">
                            <Sparkles size={16}/> {trans('新しいカードを解放！', languageMode)} <Sparkles size={16}/>
                        </div>
                        <div className="floor-result-unlocked-content flex flex-row md:flex-col items-center justify-center gap-4 flex-grow">
                            <div className="floor-result-card-preview scale-75 sm:scale-90 md:scale-100 origin-center shrink-0">
                                <Card card={unlockedCard} onClick={()=>{}} disabled={false} languageMode={languageMode}/>
                            </div>
                            <div className="floor-result-unlocked-copy text-left md:text-center flex-1 md:flex-initial">
                                <h4 className="text-white font-bold text-lg mb-1">{trans(unlockedCard.name, languageMode)}</h4>
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{trans(unlockedCard.description, languageMode)}</p>
                                <p className="text-yellow-500/70 text-[9px] mt-2 font-bold uppercase tracking-tighter hidden md:block">{trans('次から報酬候補に登場', languageMode)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Side: Stats + Story (Column 6-12 on PC) */}
            <div className={`floor-result-main ${unlockedCard ? 'md:col-span-7' : 'w-full max-w-2xl mx-auto'} flex flex-col flex-grow min-h-0`}>
                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-3 mb-4 shrink-0">
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Skull className="text-red-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">{trans('倒した敵', languageMode)}</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.enemiesDefeated}</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Coins className="text-yellow-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">{trans('獲得ゴールド', languageMode)}</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.goldGained}G</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 sm:p-3 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
                        <Brain className="text-emerald-500 mb-1" size={16} />
                        <div className="text-[7px] sm:text-[9px] text-gray-500 uppercase font-bold tracking-widest text-center">{trans('正解数', languageMode)}</div>
                        <div className="text-lg sm:text-xl font-black text-white">{stats.mathCorrect}</div>
                    </div>
                </div>

                {/* Story Section */}
                <div className="floor-result-story-panel bg-gray-800/30 border-2 border-gray-700 p-4 sm:p-6 md:p-4 rounded-lg mb-4 min-h-[8rem] md:min-h-0 relative flex-grow flex flex-col justify-center">
                    <div className="floor-result-story-title absolute -top-3 left-4 sm:left-6 bg-gray-700 px-2 sm:px-3 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-widest z-10">
                        {languageMode === 'ENGLISH' && visualTheme === 'magic'
                          ? trans('章クリア記録', languageMode)
                          : transEventText(currentPart.title, languageMode)}
                    </div>
                    <div className="overflow-y-auto custom-scrollbar h-full max-h-[150px] md:max-h-none pr-1">
                        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-200">
                            {displayedText}
                            {isTyping && <span className="inline-block w-1.5 sm:w-2 h-4 sm:h-5 bg-emerald-500 ml-1 animate-pulse align-middle"></span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Area */}
        <div className="floor-result-footer mt-2 shrink-0">
            <button 
                onClick={handleNext}
                className={`w-full py-3 sm:py-4 md:py-3 rounded-lg font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transition-all transform active:scale-95 shadow-xl border-b-4 ${isTyping ? 'bg-slate-200 text-slate-900 border-slate-400 hover:bg-white' : 'bg-white text-black border-gray-300 hover:bg-gray-200'}`}
            >
                {isTyping ? trans("スキップ", languageMode) : trans("次へ進む", languageMode)} <ArrowRight size={20} className="sm:size-6" />{typingMode && ' [Enter]'}
            </button>
        </div>
      </div>

      <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-6 text-gray-700 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] hidden xs:block">
        {trans('章クリア記録', languageMode)} v1.3
      </div>
    </div>
  );
};

export default FloorResultScreen;
