
import React, { useState, useEffect } from 'react';
import { GameMode, LanguageMode, GameScreen } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';
import { ArrowLeft, Brain, Book, Languages, Music, Play, Trophy, Home, Shuffle, CheckCircle, Target, ChevronRight, LogOut, GraduationCap, Star, Volume2, VolumeX, FlaskConical, Map as MapIcon, Globe, MapPin } from 'lucide-react';
import { trans } from '../utils/textUtils';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubModeConfig, getChallengeScreenForMode } from '../subjectConfig';

interface ProblemChallengeScreenProps {
  onBack: () => void;
  languageMode: LanguageMode;
}

const BGM_OPTIONS = [
  { id: 'random', name: 'ランダム (自動切替)' },
  { id: 'school_psyche', name: '一般教室 (風来1)' },
  { id: 'dungeon_gym', name: '体育館 (風来2)' },
  { id: 'dungeon_science', name: '理科室 (風来3)' },
  { id: 'dungeon_music', name: '音楽室 (風来4)' },
  { id: 'dungeon_library', name: '図書室 (風来5)' },
  { id: 'dungeon_roof', name: '屋上 (風来6)' },
  { id: 'dungeon_boss', name: 'ボス戦 (風来)' },
  { id: 'battle', name: '通常バトル (本編)' },
  { id: 'boss', name: 'ボス戦 (本編)' },
  { id: 'mid_boss', name: 'エリート戦 (本編)' },
  { id: 'final_boss', name: '最終決戦 (本編)' },
  { id: 'poker_shop', name: '購買部 (ポーカー)' },
  { id: 'poker_play', name: '勝負中 (ポーカー)' },
  { id: 'survivor_metal', name: '校庭サバイバー' },
  { id: 'paper_plane_setup', name: '格納庫 (紙飛行機)' },
  { id: 'paper_plane_battle', name: '空中戦 (紙飛行機)' },
  { id: 'paper_plane_vacation', name: '休暇中 (紙飛行機)' },
  { id: 'menu', name: 'メインメニュー' },
  { id: 'map', name: 'マップ移動' },
  { id: 'shop', name: 'ショップ' },
  { id: 'event', name: 'イベント' },
  { id: 'rest', name: '休憩' },
  { id: 'reward', name: '報酬獲得' },
  { id: 'math', name: '学習タイム' },
  { id: 'victory', name: '勝利ファンファーレ' },
  { id: 'game_over', name: 'ゲームオーバー' },
];

const getCategoryIcon = (id: string) => {
    switch(id) {
        case 'MATH': return <Brain size={20} />;
        case 'KANJI': return <Book size={20} />;
        case 'ENGLISH': return <Languages size={20} />;
        case 'SCIENCE': return <FlaskConical size={20} />;
        case 'SOCIAL': return <Globe size={20} />;
        case 'MAP_PREF': return <MapPin size={20} />;
        default: return <Home size={20} />;
    }
};

// カテゴリカラーからボタンの背景色（強度別）を取得するヘルパー
const getTailwindColorClass = (color: string, isSelected: boolean) => {
    switch(color) {
        case 'emerald': return isSelected ? 'bg-emerald-600' : 'bg-emerald-900/60';
        case 'cyan': return isSelected ? 'bg-cyan-600' : 'bg-cyan-900/60';
        case 'indigo': return isSelected ? 'bg-indigo-600' : 'bg-indigo-900/60';
        case 'amber': return isSelected ? 'bg-amber-600' : 'bg-amber-900/60';
        case 'orange': return isSelected ? 'bg-orange-600' : 'bg-orange-900/60';
        case 'rose': return isSelected ? 'bg-rose-600' : 'bg-rose-900/60';
        default: return isSelected ? 'bg-slate-600' : 'bg-slate-900/60';
    }
};

const getGlowColorClass = (color: string) => {
    switch(color) {
        case 'emerald': return 'shadow-[0_0_15px_rgba(16,185,129,0.5)]';
        case 'cyan': return 'shadow-[0_0_15px_rgba(6,182,212,0.5)]';
        case 'indigo': return 'shadow-[0_0_15px_rgba(79,70,229,0.5)]';
        case 'amber': return 'shadow-[0_0_15px_rgba(245,158,11,0.5)]';
        case 'orange': return 'shadow-[0_0_15px_rgba(249,115,22,0.5)]';
        case 'rose': return 'shadow-[0_0_15px_rgba(244,63,94,0.5)]';
        default: return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
    }
};

const ProblemChallengeScreen: React.FC<ProblemChallengeScreenProps> = ({ onBack, languageMode }) => {
  const [phase, setPhase] = useState<'SELECT' | 'CHALLENGE'>('SELECT');
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategoryConfig>(SUBJECT_CATEGORIES[0]);
  const [selectedSubMode, setSelectedSubMode] = useState<SubModeConfig>(SUBJECT_CATEGORIES[0].subModes[0]);
  const [selectedBgmId, setSelectedBgmId] = useState('random');
  const [streak, setStreak] = useState(0);
  const [records, setRecords] = useState<Record<string, number>>({});
  const [isQuitting, setIsQuitting] = useState(false);
  
  // Voice feature control
  const [voiceEnabled, setVoiceEnabled] = useState(() => storageService.getEnglishVoiceEnabled());

  useEffect(() => {
    audioService.init();
    setRecords(storageService.getChallengeRecords());
  }, []);

  const handleCategorySelect = (cat: SubjectCategoryConfig) => {
      setSelectedCategory(cat);
      setSelectedSubMode(cat.subModes[0]); 
      audioService.playSound('select');
  };

  const handleStart = () => {
    setPhase('CHALLENGE');
    setStreak(0);
    
    if (selectedBgmId === 'random') {
      audioService.playRandomBGM();
    } else {
      audioService.playBGM(selectedBgmId as any, true);
    }
  };

  const handleCompleteOne = (correctCount: number) => {
    if (correctCount > 0) {
      const newStreak = streak + correctCount;
      setStreak(newStreak);
      
      const recordKey = `${selectedCategory.id}_${selectedSubMode.id}`;
      if (!records[recordKey] || newStreak > records[recordKey]) {
          storageService.saveChallengeRecord(recordKey, newStreak);
          setRecords(prev => ({ ...prev, [recordKey]: newStreak }));
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsQuitting(true);
    setTimeout(() => {
        setPhase('SELECT');
        setIsQuitting(false);
        audioService.playBGM('menu');
    }, 800);
  };

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    storageService.saveEnglishVoiceEnabled(newVal);
    audioService.playSound('select');
  };

  if (phase === 'CHALLENGE') {
    const ChallengeScreen = getChallengeScreenForMode(selectedSubMode.mode);
    
    return (
      <div className="w-full h-full relative bg-black flex flex-col">
        <div className="bg-black/80 border-b-2 border-gray-700 p-2 flex justify-between items-center z-50 shrink-0">
          <div className="flex gap-4 items-center">
            <div className="text-yellow-400 font-bold flex items-center gap-2">
              <Target size={20}/> 正解数: <span className="text-2xl font-mono">{streak}</span>
            </div>
            <div className="text-gray-500 text-xs font-bold border-l border-gray-700 pl-4 hidden sm:block">
              {selectedSubMode.name} ベスト: <span className="text-white font-mono">{records[`${selectedCategory.id}_${selectedSubMode.id}`] || 0}</span> 問
            </div>
          </div>
          <button 
            onClick={handleFinish}
            className="bg-red-900/60 hover:bg-red-800 border border-red-500 px-4 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            <LogOut size={14}/> 終了
          </button>
        </div>

        <div className="flex-1 min-h-0 relative">
          {ChallengeScreen === GameScreen.MATH_CHALLENGE && (
            <MathChallengeScreen 
              key={streak} 
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.KANJI_CHALLENGE && (
            <KanjiChallengeScreen 
              key={streak}
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.ENGLISH_CHALLENGE && (
            <EnglishChallengeScreen 
              key={streak}
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.GENERAL_CHALLENGE && (
            <GeneralChallengeScreen 
              key={streak}
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
        </div>

        {isQuitting && (
            <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center animate-in fade-in duration-300">
                <div className="text-center">
                    <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-bold text-white mb-2">チャレンジ終了！</h3>
                    <p className="text-gray-400">今回の記録: <span className="text-yellow-400 text-xl font-bold">{streak}</span> 問</p>
                    <p className="text-green-400 text-xs mt-4 animate-pulse">※累計正解数に加算されました</p>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-4xl bg-gray-900 border-4 border-emerald-600 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col gap-4">
        <div className="text-center border-b border-gray-800 pb-3">
          <h2 className="text-2xl md:text-4xl font-bold text-emerald-400 mb-0.5 flex items-center justify-center gap-3">
            <GraduationCap size={32} className="md:size-36"/> 問題チャレンジ
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-yellow-500 font-bold text-[10px] uppercase tracking-wider">
            <Star size={10} fill="currentColor"/> ミニゲーム解放カウント対象 <Star size={10} fill="currentColor"/>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1.5 lg:pb-0 scrollbar-hide">
            {SUBJECT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-2 p-2.5 md:p-4 rounded-xl border-2 transition-all shrink-0 lg:shrink ${selectedCategory.id === cat.id ? `bg-emerald-900/40 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]` : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'}`}
              >
                <span className={selectedCategory.id === cat.id ? `text-emerald-400` : 'text-gray-600'}>{getCategoryIcon(cat.id)}</span>
                <span className="font-bold whitespace-nowrap text-sm md:text-base">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <h3 className="text-[10px] md:text-sm font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-tight">
              <ChevronRight size={12} className="text-emerald-500"/> 種目を選択
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-gray-800 max-h-40 md:max-h-80 overflow-y-auto custom-scrollbar shadow-inner">
                {selectedCategory.subModes.map((sub, i) => {
                  const recordKey = `${selectedCategory.id}_${sub.id}`;
                  const isSelected = selectedSubMode.id === sub.id;
                  const buttonColor = getTailwindColorClass(selectedCategory.color, isSelected);
                  const glowEffect = isSelected ? getGlowColorClass(selectedCategory.color) : '';
                  
                  return (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubMode(sub); audioService.playSound('select'); }}
                      className={`
                        flex flex-col p-2 rounded-xl border-2 transition-all transform hover:-translate-y-0.5 active:scale-95
                        ${isSelected 
                            ? 'border-white z-10 scale-105 ' + glowEffect 
                            : 'border-transparent opacity-70 hover:opacity-100'} 
                        ${buttonColor}
                      `}
                    >
                      <span className="text-[11px] md:text-xs font-black text-white mb-1 truncate w-full leading-tight text-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {sub.name}
                      </span>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="bg-black/40 px-1.5 rounded text-[8px] md:text-[9px] font-mono text-white/90 border border-white/10">
                          BEST: {records[recordKey] || 0}
                        </div>
                        {isSelected && <CheckCircle size={12} className="text-white animate-pulse" />}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex flex-col">
                <h3 className="text-[10px] md:text-sm font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-tight">
                <Music size={12} className="text-emerald-500"/> BGM
                </h3>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-1.5 max-h-32 md:max-h-48 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1">
                    {BGM_OPTIONS.map(bgm => (
                    <button
                        key={bgm.id}
                        onClick={() => { setSelectedBgmId(bgm.id); audioService.playSound('select'); }}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${selectedBgmId === bgm.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                        <span className="truncate">{bgm.name}</span>
                        {selectedBgmId === bgm.id && <CheckCircle size={10} className="shrink-0 ml-1" />}
                    </button>
                    ))}
                </div>
                </div>
            </div>

            {selectedCategory.id === 'ENGLISH' && (
                <div className="flex flex-col">
                    <h3 className="text-[10px] md:text-sm font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-tight">
                    <Volume2 size={12} className="text-emerald-500"/> 読み上げ設定
                    </h3>
                    <button 
                        onClick={toggleVoice}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 font-bold transition-all ${voiceEnabled ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        <div className="flex items-center gap-2">
                            {voiceEnabled ? <Volume2 size={16} className="text-cyan-400"/> : <VolumeX size={16}/>}
                            <span className="text-xs">{voiceEnabled ? 'オン' : 'オフ'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${voiceEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${voiceEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                        </div>
                    </button>
                </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center mt-2 border-t border-gray-800 pt-4 shrink-0">
          <div className="bg-black/40 px-4 py-1.5 rounded-full border border-emerald-900/50 flex items-center gap-2">
              <div className="text-[10px] text-gray-500">選択中:</div>
              <div className="text-xs font-bold text-emerald-400">{selectedCategory.name} / {selectedSubMode.name}</div>
          </div>

          <button 
            onClick={handleStart}
            className="w-full md:w-80 bg-emerald-600 hover:bg-emerald-500 text-white py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse"
          >
            <Play fill="currentColor" size={20}/> チャレンジ開始！
          </button>
          
          <button 
            onClick={onBack}
            className="text-gray-600 hover:text-white flex items-center gap-2 transition-colors py-1 text-xs"
          >
            <ArrowLeft size={14}/> タイトルへ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemChallengeScreen;
