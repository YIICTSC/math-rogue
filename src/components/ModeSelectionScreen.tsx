import React, { useState } from 'react';
import { GameMode, LanguageMode } from '../types';
import {
  Brain, Book, Languages, FlaskConical, Globe, MapPin,
  Home, ArrowLeft
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubjectCategoryType } from '../subjectConfig';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
  languageMode: LanguageMode;
  modeMasteryMap?: Record<string, boolean>;
}

const CATEGORY_LABELS: Record<SubjectCategoryType, string> = {
  MATH: 'けいさん',
  MATH_GRADES: 'さんすう・数学',
  KANJI: 'かんじ',
  SCIENCE: 'せいかつ・理科',
  SOCIAL: 'しゃかい',
  ENGLISH: 'えいご',
  MAP_PREF: '地図・日本',
  IT_INFO: 'ICT・情報',
};

const SUBMODE_LABELS: Record<string, string> = {
  ADD_1DIGIT: '1けたのたし算',
  ADD_1DIGIT_CARRY: 'たし算（くりあがり）',
  SUB_1DIGIT: '1けたのひき算',
  SUB_1DIGIT_BORROW: 'ひき算（くりさがり）',
  ADDITION: '2けたのたし算',
  SUBTRACTION: '2けたのひき算',
  MULTIPLICATION: 'かけ算',
  DIVISION: 'わり算',
  MIXED: 'ミックス',
  K1: '小1漢字',
  K2: '小2漢字',
  K3: '小3漢字',
  K4: '小4漢字',
  K5: '小5漢字',
  K6: '小6漢字',
  K7: '中1漢字',
  K8: '中2漢字',
  K9: '中3漢字',
  K_MIXED: 'ミックス',
  E_ES: '小学校英語',
  E_J1: '中1英語',
  E_J2: '中2英語',
  E_J3: '中3英語',
  E_MIXED: 'ミックス',
  C1: '会話 Lv1',
  C2: '会話 Lv2',
  C3: '会話 Lv3',
  C4: '会話 Lv4',
  C5: '会話 Lv5',
  MS: '地図記号',
  PF: '都道府県',
  PC: '県庁所在地',
  IT_WIN: 'Windows',
  IT_IPAD: 'iPad',
  IT_CHROME: 'Chromebook',
  IT_NET: 'スマホ・ネット',
  IT_LIT: '情報リテラシー',
  IT_PROG: 'プログラミング',
  IT_SEC: 'モラル・セキュリティ',
};

const getCategoryIcon = (id: SubjectCategoryType) => {
  switch (id) {
    case 'MATH': return <Brain size={20} />;
    case 'KANJI': return <Book size={20} />;
    case 'ENGLISH': return <Languages size={20} />;
    case 'SCIENCE': return <FlaskConical size={20} />;
    case 'SOCIAL': return <Globe size={20} />;
    case 'MAP_PREF': return <MapPin size={20} />;
    default: return <Home size={20} />;
  }
};

const getCategoryClasses = (color: string) => {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-900' };
    case 'cyan': return { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-900' };
    case 'indigo': return { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-900' };
    case 'amber': return { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-amber-400', border: 'border-amber-900' };
    case 'orange': return { bg: 'bg-orange-600', hover: 'hover:bg-orange-500', text: 'text-orange-400', border: 'border-orange-900' };
    case 'rose': return { bg: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-rose-400', border: 'border-rose-900' };
    default: return { bg: 'bg-slate-600', hover: 'hover:bg-slate-500', text: 'text-slate-400', border: 'border-slate-900' };
  }
};

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onSelectMode, onBack, modeMasteryMap = {} }) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);

  const handleSelect = (mode: GameMode) => {
    audioService.playSound('select');
    onSelectMode(mode);
  };

  const isMastered = (mode: GameMode) => !!modeMasteryMap[mode];
  const getCategoryLabel = (id: SubjectCategoryType) => CATEGORY_LABELS[id] || id;
  const getSubLabel = (id: string, fallback: string) => SUBMODE_LABELS[id] || fallback;

  const renderMasteryPrefix = (mode: GameMode) => {
    if (!isMastered(mode)) return null;
    return <span className="text-red-500 font-black font-sans mr-1">◎</span>;
  };

  const renderCategoryContent = (cat: SubjectCategoryConfig) => {
    const theme = getCategoryClasses(cat.color);

    if (cat.uiType === 'grid') {
      return (
        <div className={`grid ${cat.id === 'KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
          {cat.subModes.map(sub => (
            <button
              key={sub.id}
              onClick={() => handleSelect(sub.mode)}
              className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-white transition-colors text-[10px] md:text-xs font-bold truncate"
            >
              {renderMasteryPrefix(sub.mode)}
              {getSubLabel(sub.id, sub.name)}
            </button>
          ))}
        </div>
      );
    }

    if (cat.uiType === 'grade_term') {
      const grades = (cat.id === 'SCIENCE' || cat.id === 'MATH_GRADES') ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [3, 4, 5, 6, 7, 8, 9];
      const selectedMode = (() => {
        if (cat.id === 'MATH_GRADES') return `MATH_G${selectedGrade}_${selectedTerm}`;
        if (cat.id === 'SCIENCE') return selectedGrade <= 2 ? `LIFE_${selectedGrade}_${selectedTerm}` : `SCIENCE_${selectedGrade}_${selectedTerm}`;
        return `SOCIAL_${selectedGrade}_${selectedTerm}`;
      })() as GameMode;

      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">学年</span>
            <div className="flex-1 grid grid-cols-5 gap-1">
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`p-1 rounded text-[9px] md:text-[10px] font-bold border transition-colors ${selectedGrade === g ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                >
                  {g <= 6 ? `${g}年` : `中${g - 6}`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 whitespace-nowrap">学期</span>
            <div className="flex-1 flex gap-1">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t)}
                  className={`flex-1 p-1 rounded text-[10px] font-bold border transition-colors ${selectedTerm === t ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                >
                  {t}学期
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleSelect(selectedMode)}
            className={`w-full ${theme.bg} ${theme.hover} p-2 rounded font-bold text-xs shadow-lg transition-all text-white`}
          >
            {renderMasteryPrefix(selectedMode)}
            この条件で開始
          </button>

          {cat.id === 'SOCIAL' && (
            <div className="grid grid-cols-3 gap-1 mt-2">
              {cat.subModes.filter(s => !s.id.includes('SO')).map(s => (
                <button key={s.id} onClick={() => handleSelect(s.mode)} className="bg-indigo-900/40 border border-indigo-500 p-1 rounded text-[9px] font-bold hover:bg-indigo-800 text-indigo-200">
                  {renderMasteryPrefix(s.mode)}
                  {getSubLabel(s.id, s.name)}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (cat.uiType === 'english_mixed') {
      const words = cat.subModes.filter(s => s.id.startsWith('E_'));
      const convs = cat.subModes.filter(s => s.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {words.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-indigo-400 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-700 my-1"></div>
          <div className="grid grid-cols-3 gap-1.5">
            {convs.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-pink-900/40 border border-pink-500/50 p-1 rounded hover:bg-pink-800 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
            <button onClick={() => handleSelect(GameMode.ENGLISH_MIXED)} className="bg-indigo-900/60 border border-indigo-500 p-1 rounded hover:bg-indigo-800 text-[10px] font-bold">
              {renderMasteryPrefix(GameMode.ENGLISH_MIXED)}
              ミックス
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-4 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl flex flex-col items-center my-auto pb-10">
        <h2 className="text-3xl font-bold mb-6 text-yellow-400 mt-4 tracking-widest">モード選択</h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBJECT_CATEGORIES.map(cat => {
            const theme = getCategoryClasses(cat.color);
            return (
              <div key={cat.id} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 flex flex-col shadow-xl animate-in fade-in slide-in-from-bottom-2">
                <h3 className={`text-xl font-bold ${theme.text} border-b ${theme.border} pb-2 flex items-center mb-4`}>
                  {getCategoryIcon(cat.id)}
                  <span className="ml-2">{getCategoryLabel(cat.id)}</span>
                </h3>
                <div className="flex-grow">{renderCategoryContent(cat)}</div>
              </div>
            );
          })}
        </div>

        <button onClick={onBack} className="mt-12 text-gray-400 hover:text-white underline mb-8 flex items-center gap-2">
          <ArrowLeft size={16} /> もどる
        </button>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;
