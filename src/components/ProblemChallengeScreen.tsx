
import React, { useState, useEffect } from 'react';
import { GameMode, LanguageMode } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import { ArrowLeft, Brain, Book, Languages, Music, Play, Trophy, Home, Shuffle, CheckCircle, Target, ChevronRight, LogOut, GraduationCap, Star } from 'lucide-react';
import { trans } from '../utils/textUtils';

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

interface SubMode {
    id: string;
    name: string;
    mode: GameMode;
}

interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    subModes: SubMode[];
}

const CATEGORIES: Category[] = [
  { 
    id: 'MATH', 
    name: 'さんすう', 
    icon: <Brain />, 
    color: 'emerald',
    subModes: [
        { id: 'ADDITION', name: 'たし算', mode: GameMode.ADDITION },
        { id: 'SUBTRACTION', name: 'ひき算', mode: GameMode.SUBTRACTION },
        { id: 'MULTIPLICATION', name: 'かけ算', mode: GameMode.MULTIPLICATION },
        { id: 'DIVISION', name: 'わり算', mode: GameMode.DIVISION },
        { id: 'MIXED', name: 'ミックス', mode: GameMode.MIXED },
    ]
  },
  { 
    id: 'KANJI', 
    name: 'かんじ', 
    icon: <Book />, 
    color: 'cyan',
    subModes: [
        { id: 'K1', name: '小学1年', mode: GameMode.KANJI_1 },
        { id: 'K2', name: '小学2年', mode: GameMode.KANJI_2 },
        { id: 'K3', name: '小学3年', mode: GameMode.KANJI_3 },
        { id: 'K4', name: '小学4年', mode: GameMode.KANJI_4 },
        { id: 'K5', name: '小学5年', mode: GameMode.KANJI_5 },
        { id: 'K6', name: '小学6年', mode: GameMode.KANJI_6 },
        { id: 'K7', name: '中学1年', mode: GameMode.KANJI_7 },
        { id: 'K8', name: '中学2年', mode: GameMode.KANJI_8 },
        { id: 'K9', name: '中学3年', mode: GameMode.KANJI_9 },
        { id: 'K_MIXED', name: 'ミックス', mode: GameMode.KANJI_MIXED },
    ]
  },
  { 
    id: 'ENGLISH', 
    name: 'えいご', 
    icon: <Languages />, 
    color: 'indigo',
    subModes: [
        { id: 'E_ES', name: '小学校', mode: GameMode.ENGLISH_ES },
        { id: 'E_J1', name: '中学1年', mode: GameMode.ENGLISH_J1 },
        { id: 'E_J2', name: '中学2年', mode: GameMode.ENGLISH_J2 },
        { id: 'E_J3', name: '中学3年', mode: GameMode.ENGLISH_J3 },
        { id: 'E_MIXED', name: 'ミックス', mode: GameMode.ENGLISH_MIXED },
        { id: 'C1', name: '会話 Lv1', mode: GameMode.ENGLISH_CONV_1 },
        { id: 'C2', name: '会話 Lv2', mode: GameMode.ENGLISH_CONV_2 },
        { id: 'C3', name: '会話 Lv3', mode: GameMode.ENGLISH_CONV_3 },
        { id: 'C4', name: '会話 Lv4', mode: GameMode.ENGLISH_CONV_4 },
        { id: 'C5', name: '会話 Lv5', mode: GameMode.ENGLISH_CONV_5 },
    ]
  },
];

const ProblemChallengeScreen: React.FC<ProblemChallengeScreenProps> = ({ onBack, languageMode }) => {
  const [phase, setPhase] = useState<'SELECT' | 'CHALLENGE'>('SELECT');
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [selectedSubMode, setSelectedSubMode] = useState<SubMode>(CATEGORIES[0].subModes[0]);
  const [selectedBgmId, setSelectedBgmId] = useState('random');
  const [streak, setStreak] = useState(0);
  const [records, setRecords] = useState<Record<string, number>>({});
  const [isQuitting, setIsQuitting] = useState(false);

  useEffect(() => {
    audioService.init();
    setRecords(storageService.getChallengeRecords());
  }, []);

  const handleCategorySelect = (cat: Category) => {
      setSelectedCategory(cat);
      setSelectedSubMode(cat.subModes[cat.subModes.length - 1]); 
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

  if (phase === 'CHALLENGE') {
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
          {selectedCategory.id === 'MATH' && (
            <MathChallengeScreen 
              key={streak} 
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {selectedCategory.id === 'KANJI' && (
            <KanjiChallengeScreen 
              key={streak}
              mode={selectedSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {selectedCategory.id === 'ENGLISH' && (
            <EnglishChallengeScreen 
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
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-4xl bg-gray-900 border-4 border-emerald-600 rounded-2xl shadow-2xl p-4 md:p-8 flex flex-col gap-6">
        <div className="text-center border-b border-gray-800 pb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1 flex items-center justify-center gap-3">
            <GraduationCap size={36}/> 問題チャレンジ
          </h2>
          <div className="flex items-center justify-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-widest">
            <Star size={12} fill="currentColor"/> ミニゲーム解放カウント対象 <Star size={12} fill="currentColor"/>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all shrink-0 lg:shrink ${selectedCategory.id === cat.id ? `bg-${cat.color}-900/40 border-${cat.color}-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]` : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'}`}
              >
                <span className={selectedCategory.id === cat.id ? `text-${cat.color}-400` : 'text-gray-600'}>{cat.icon}</span>
                <span className="font-bold whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-6 flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
              <ChevronRight size={14} className="text-emerald-500"/> 種目を選択
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-800/50 p-3 rounded-xl border border-gray-700 max-h-64 overflow-y-auto custom-scrollbar">
                {selectedCategory.subModes.map(sub => {
                  const recordKey = `${selectedCategory.id}_${sub.id}`;
                  const isSelected = selectedSubMode.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubMode(sub); audioService.playSound('select'); }}
                      className={`flex flex-col p-2 rounded-lg border-2 transition-all ${isSelected ? 'bg-emerald-600 border-white text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                    >
                      <span className="text-xs font-bold mb-1 truncate w-full">{sub.name}</span>
                      <div className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-black/40 text-yellow-500'}`}>
                        BEST: {records[recordKey] || 0}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
              <Music size={14} className="text-emerald-500"/> BGM設定
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-1">
                {BGM_OPTIONS.map(bgm => (
                  <button
                    key={bgm.id}
                    onClick={() => { setSelectedBgmId(bgm.id); audioService.playSound('select'); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedBgmId === bgm.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                  >
                    <span className="truncate">{bgm.name}</span>
                    {selectedBgmId === bgm.id && <CheckCircle size={12} className="shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center mt-4 border-t border-gray-800 pt-6">
          <div className="bg-black/40 px-6 py-2 rounded-full border border-emerald-900/50 flex items-center gap-4">
              <div className="text-xs text-gray-500">選択中:</div>
              <div className="text-sm font-bold text-emerald-400">{selectedCategory.name} / {selectedSubMode.name}</div>
          </div>

          <button 
            onClick={handleStart}
            className="w-full md:w-80 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-xl shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 animate-pulse"
          >
            <Play fill="currentColor" size={24}/> チャレンジ開始！
          </button>
          
          <button 
            onClick={onBack}
            className="text-gray-600 hover:text-white flex items-center gap-2 transition-colors py-2 text-sm"
          >
            <ArrowLeft size={16}/> タイトルへ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

const LogOut = ({size}:{size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

export default ProblemChallengeScreen;
