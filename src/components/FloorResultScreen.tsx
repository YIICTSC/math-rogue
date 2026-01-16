
import React, { useState, useEffect, useCallback } from 'react';
import { ActStats, LanguageMode } from '../types';
import { GAME_STORIES } from '../data/stories';
import { trans } from '../utils/textUtils';
import { Skull, Coins, Brain, ArrowRight, BookOpen } from 'lucide-react';
import { audioService } from '../services/audioService';

interface FloorResultScreenProps {
  act: number;
  stats: ActStats;
  storyIndex: number;
  onNext: () => void;
  languageMode: LanguageMode;
}

const FloorResultScreen: React.FC<FloorResultScreenProps> = ({ act, stats, storyIndex, onNext, languageMode }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  
  const storySet = GAME_STORIES[storyIndex] || GAME_STORIES[0];
  // エンドレスモード対策: アクトが4以上になってもストーリーがループするように修正
  const currentPart = storySet.parts[(act - 1) % 3]; 

  // 音声読み上げ関数
  const speakStory = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // 既存の読み上げをキャンセル
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85; // 少しゆっくりめに（ストーリーテラー風）
    utterance.pitch = 1.0; // 標準的なピッチ
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    let index = 0;
    const rawContent = currentPart.content;
    const translatedContent = trans(rawContent, languageMode);
    
    setDisplayedText("");
    setIsTyping(true);

    // 読み上げ開始
    speakStory(translatedContent);
    
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
      // コンポーネントが消える時に音声を止める
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentPart, languageMode, speakStory]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(trans(currentPart.content, languageMode));
      setIsTyping(false);
    } else {
      // 次へ進む前に音声を確実に止める
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      onNext();
      audioService.playSound('select');
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-3 sm:p-6 md:p-12 relative overflow-hidden font-mono">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <BookOpen className="text-gray-500 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px]" />
      </div>

      <div className="z-10 w-full max-w-2xl bg-black/90 border-2 sm:border-4 border-gray-700 p-4 sm:p-8 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500 max-h-[95vh] flex flex-col overflow-y-auto custom-scrollbar">
        <div className="text-center mb-6 sm:mb-10 shrink-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-100 mb-2 tracking-tighter italic">
            ACT {act} <span className="text-gray-500 not-italic text-2xl sm:text-4xl">CLEARED</span>
          </h2>
          <div className="h-1 w-24 sm:w-32 bg-gray-500 mx-auto rounded-full"></div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-6 mb-6 sm:mb-12 shrink-0">
          <div className="bg-gray-900/50 p-2 sm:p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
            <Skull className="text-red-500 mb-1 sm:mb-2" size={18} />
            <div className="text-[7px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Enemies</div>
            <div className="text-lg sm:text-2xl font-black text-white">{stats.enemiesDefeated}</div>
          </div>
          <div className="bg-gray-900/50 p-2 sm:p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
            <Coins className="text-yellow-500 mb-1 sm:mb-2" size={18} />
            <div className="text-[7px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Gold</div>
            <div className="text-lg sm:text-2xl font-black text-white">{stats.goldGained}G</div>
          </div>
          <div className="bg-gray-900/50 p-2 sm:p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center">
            <Brain className="text-emerald-500 mb-1 sm:mb-2" size={18} />
            <div className="text-[7px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest text-center">Correct</div>
            <div className="text-lg sm:text-2xl font-black text-white">{stats.mathCorrect}</div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-gray-800/30 border-2 border-gray-700 p-4 sm:p-6 rounded-lg mb-6 sm:mb-10 min-h-[10rem] sm:min-h-[12rem] relative flex-grow flex flex-col justify-center">
          <div className="absolute -top-3 left-4 sm:left-6 bg-gray-700 px-2 sm:px-3 py-0.5 rounded text-[8px] sm:text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {trans(currentPart.title, languageMode)}
          </div>
          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-200">
            {displayedText}
            {isTyping && <span className="inline-block w-1.5 sm:w-2 h-4 sm:h-5 bg-emerald-500 ml-1 animate-pulse align-middle"></span>}
          </p>
        </div>

        <button 
          onClick={handleNext}
          className={`w-full py-3 sm:py-4 rounded-lg font-black text-lg sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transition-all transform active:scale-95 shadow-xl border-b-4 shrink-0 ${isTyping ? 'bg-gray-700 border-gray-900 text-gray-400' : 'bg-white text-black border-gray-300 hover:bg-gray-200'}`}
        >
          {isTyping ? trans("スキップ", languageMode) : trans("次へ進む", languageMode)} <ArrowRight size={20} className="sm:size-6" />
        </button>
      </div>

      {/* Decorative Label */}
      <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-6 text-gray-700 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] hidden xs:block">
        Act Completion Record v1.1
      </div>
    </div>
  );
};

export default FloorResultScreen;
