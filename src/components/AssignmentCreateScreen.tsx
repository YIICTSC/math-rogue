import React, { useMemo, useState } from 'react';
import { ArrowLeft, Clipboard, Copy, Plus, Send, Trash2 } from 'lucide-react';
import { AssignmentCustomProblem, AssignmentPayload, AssignmentUnit, AnswerMode, LanguageMode } from '../types';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig } from '../subjectConfig';
import { SubjectCategoryType } from '../subjectConfig';
import { CATEGORY_LABELS, UPPER_PROBLEM_CATEGORIES, getCurrentUnitsForCategory, getSelectableGrades } from './ModeSelectionScreen';
import { createAssignmentUrl } from '../utils/assignmentUtils';
import { transProblemSubjectName } from '../utils/textUtils';
import { audioService } from '../services/audioService';

interface AssignmentCreateScreenProps {
  onBack: () => void;
  languageMode: LanguageMode;
}

const isGradeUnitCategory = (categoryId: SubjectCategoryType) =>
  ['MATH_GRADES', 'KOKUGO_GRADES', 'ENGLISH', 'LIFE', 'SCIENCE', 'SOCIAL', 'SUMMARY'].includes(categoryId);
const DEFAULT_TARGET_CORRECT = 10;
const CUSTOM_OPTION_COUNT = 3;

const getDefaultDueAt = () => {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  due.setHours(23, 59, 0, 0);
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
};

const AssignmentCreateScreen: React.FC<AssignmentCreateScreenProps> = ({ onBack, languageMode }) => {
  const initialCategory = SUBJECT_CATEGORIES.find((cat) => cat.id === 'MATH_GRADES') || SUBJECT_CATEGORIES[0];
  const [selectedCategoryId, setSelectedCategoryId] = useState<SubjectCategoryType>(initialCategory.id);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [selectedUnits, setSelectedUnits] = useState<AssignmentUnit[]>([]);
  const [title, setTitle] = useState('今日の課題');
  const [dueAt, setDueAt] = useState(() => getDefaultDueAt());
  const [gameMode, setGameMode] = useState<'FREE' | 'CHALLENGE_ONLY'>('FREE');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('CHOICE');
  const [customProblems, setCustomProblems] = useState<AssignmentCustomProblem[]>([]);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [showUpperProblems, setShowUpperProblems] = useState(false);
  const categories = useMemo<SubjectCategoryConfig[]>(() => {
    return showUpperProblems ? UPPER_PROBLEM_CATEGORIES : SUBJECT_CATEGORIES;
  }, [showUpperProblems]);
  const category = categories.find((cat) => cat.id === selectedCategoryId) || initialCategory;
  const grades = getSelectableGrades(selectedCategoryId);
  const units = useMemo(
    () => {
      if (isGradeUnitCategory(selectedCategoryId)) {
        return getCurrentUnitsForCategory(selectedCategoryId, selectedGrade).map((unit) => ({
          id: `${selectedCategoryId}:${unit.id}`,
          name: unit.name,
          modes: unit.modes || (unit.mode ? [unit.mode] : []),
          targetCorrect: DEFAULT_TARGET_CORRECT,
        }));
      }
      return category.subModes.map((sub) => ({
        id: `${selectedCategoryId}:${sub.id}`,
        name: sub.name,
        modes: [sub.mode],
        targetCorrect: DEFAULT_TARGET_CORRECT,
      }));
    },
    [category.subModes, selectedCategoryId, selectedGrade],
  );

  const assignment = useMemo<AssignmentPayload>(() => ({
    id: `assignment-${Date.now()}`,
    title: title.trim() || '学習ローグ課題',
    units: selectedUnits,
    customProblems: customProblems.filter((problem) => problem.question.trim() && problem.answer.trim()),
    dueAt,
    gameMode,
    answerMode,
    createdAt: new Date().toISOString(),
  }), [answerMode, customProblems, dueAt, gameMode, selectedUnits, title]);

  const toggleUnit = (unit: AssignmentUnit) => {
    setSelectedUnits((prev) => (
      prev.some((item) => item.id === unit.id)
        ? prev.filter((item) => item.id !== unit.id)
        : [...prev, unit]
    ));
    audioService.playSound('select');
  };

  const updateUnitTarget = (unitId: string, targetCorrect: number) => {
    const normalizedTarget = Math.max(1, Math.min(999, Math.floor(targetCorrect || 1)));
    setSelectedUnits((prev) => prev.map((unit) => (
      unit.id === unitId ? { ...unit, targetCorrect: normalizedTarget } : unit
    )));
  };

  const addCustomProblem = () => {
    setCustomProblems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, question: '', answer: '', options: Array(CUSTOM_OPTION_COUNT).fill('') },
    ]);
  };

  const updateCustomProblem = (id: string, patch: Partial<AssignmentCustomProblem>) => {
    setCustomProblems((prev) => prev.map((problem) => problem.id === id ? {
      ...problem,
      ...patch,
      options: patch.options ? patch.options.slice(0, CUSTOM_OPTION_COUNT) : problem.options,
    } : problem));
  };

  const copyUrl = async () => {
    const url = createAssignmentUrl(assignment);
    setCopiedUrl(url);
    setCopyFailed(false);
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch (e) {
      copied = false;
    }

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch (e) {
        copied = false;
      } finally {
        document.body.removeChild(textarea);
      }
    }

    if (!copied) {
      setCopyFailed(true);
      window.prompt('課題URLをコピーしてください', url);
    }
    audioService.playSound('select');
  };

  const canCopy = selectedUnits.length > 0 || assignment.customProblems.length > 0;

  return (
    <div className="assignment-create-screen h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="assignment-create-shell flex h-full flex-col bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_38%),linear-gradient(180deg,#020617,#0f172a)]">
        <div className="assignment-create-header flex items-center justify-between border-b border-cyan-500/30 px-4 py-3">
          <button onClick={onBack} className="assignment-create-back flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
            <ArrowLeft size={16} /> 戻る
          </button>
          <div className="assignment-create-title flex items-center gap-2 text-cyan-200">
            <Clipboard size={18} />
            <h2 className="text-xl font-black tracking-wider">課題送信</h2>
          </div>
          <button
            onClick={copyUrl}
            disabled={!canCopy}
            className={`assignment-create-copy flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${canCopy ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
          >
            <Copy size={16} /> URLコピー
          </button>
        </div>

        <div className="assignment-create-grid grid flex-1 min-h-0 gap-4 overflow-hidden p-4 lg:grid-cols-[1.2fr_1.8fr_1fr]">
          <section className="assignment-create-settings min-h-0 overflow-y-auto rounded-xl border border-slate-700 bg-black/35 p-3 custom-scrollbar">
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-slate-400">課題名</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-slate-400">回答期限</span>
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
            </label>
            <div className="mb-3">
              <div className="mb-1 text-xs font-bold text-slate-400">ゲームモード</div>
              <div className="grid grid-cols-2 gap-2">
                {(['FREE', 'CHALLENGE_ONLY'] as const).map((mode) => (
                  <button key={mode} onClick={() => setGameMode(mode)} className={`rounded-lg border px-2 py-2 text-xs font-black ${gameMode === mode ? 'border-cyan-300 bg-cyan-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-200'}`}>
                    {mode === 'FREE' ? 'フリー' : '問題チャレンジのみ'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-1 text-xs font-bold text-slate-400">答え方</div>
              <div className="grid grid-cols-2 gap-2">
                {(['CHOICE', 'INPUT'] as const).map((mode) => (
                  <button key={mode} onClick={() => setAnswerMode(mode)} className={`rounded-lg border px-2 py-2 text-xs font-black ${answerMode === mode ? 'border-yellow-300 bg-yellow-400 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-200'}`}>
                    {mode === 'CHOICE' ? '4択' : '入力'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs leading-5 text-cyan-100">
              URLで開くと課題モードとして開始します。フリーの場合は通常のゲーム内問題も課題範囲へ差し替えます。
            </div>
          </section>

          <section className="assignment-create-units flex min-h-0 flex-col rounded-xl border border-slate-700 bg-black/35 p-3">
            <button
              type="button"
              onClick={() => {
                const nextShowUpper = !showUpperProblems;
                const nextCategories = nextShowUpper ? UPPER_PROBLEM_CATEGORIES : SUBJECT_CATEGORIES;
                setShowUpperProblems(nextShowUpper);
                setSelectedCategoryId(nextCategories[0]?.id || 'MATH_GRADES');
                setSelectedGrade(getSelectableGrades(nextCategories[0]?.id || 'MATH_GRADES')[0] || 1);
                audioService.playSound('select');
              }}
              className={`mb-2 rounded-lg border px-3 py-2 text-xs font-black transition-colors ${
                showUpperProblems
                  ? 'border-yellow-300 bg-yellow-400 text-slate-950'
                  : 'border-cyan-300/70 bg-slate-900 text-cyan-100 hover:bg-cyan-950'
              }`}
            >
              {showUpperProblems ? '通常問題へ' : '高校生以上'}
            </button>
            <div className="mb-2 grid grid-cols-3 gap-1 sm:grid-cols-4">
              {categories.map((cat, index) => (
                <button key={`${cat.id}-${index}`} onClick={() => { setSelectedCategoryId(cat.id); setSelectedGrade(getSelectableGrades(cat.id)[0] || 1); }} className={`rounded-lg border px-2 py-2 text-xs font-black ${selectedCategoryId === cat.id ? 'border-cyan-300 bg-cyan-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-300'}`}>
                  {transProblemSubjectName(CATEGORY_LABELS[cat.id] || cat.name, languageMode)}
                </button>
              ))}
            </div>
            {isGradeUnitCategory(selectedCategoryId) && (
              <div className="mb-2 flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {grades.map((grade) => (
                  <button key={grade} onClick={() => setSelectedGrade(grade)} className={`shrink-0 rounded border px-2 py-1 text-[10px] font-black ${selectedGrade === grade ? 'border-yellow-300 bg-yellow-400 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-300'}`}>
                    {grade <= 6 ? `${grade}年` : `中${grade - 6}`}
                  </button>
                ))}
              </div>
            )}
            <div className="assignment-create-unit-grid grid flex-1 min-h-0 grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
              {units.map((unit) => {
                const selected = selectedUnits.some((item) => item.id === unit.id);
                return (
                  <button key={unit.id} onClick={() => toggleUnit(unit)} className={`min-h-14 rounded-lg border px-3 py-2 text-left text-xs font-bold ${selected ? 'border-cyan-200 bg-cyan-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-400'}`}>
                    {unit.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="assignment-create-side flex min-h-0 flex-col gap-3">
            <div className="assignment-create-selected rounded-xl border border-slate-700 bg-black/35 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-black text-cyan-200">選択中 {selectedUnits.length}件</div>
                <button onClick={() => setSelectedUnits([])} className="text-xs font-bold text-slate-400 hover:text-white">解除</button>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-slate-200 custom-scrollbar">
                {selectedUnits.length === 0 ? <div className="text-slate-500">単元を選択してください</div> : selectedUnits.map((unit) => (
                  <div key={unit.id} className="mb-2 rounded border border-slate-700 bg-slate-900/70 p-2">
                    <div className="mb-1 font-bold text-slate-100">{unit.name}</div>
                    <label className="flex items-center justify-between gap-2 text-[10px] text-slate-300">
                      目標正答数
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={unit.targetCorrect || DEFAULT_TARGET_CORRECT}
                        onChange={(event) => updateUnitTarget(unit.id, Number(event.target.value))}
                        className="w-20 rounded border border-slate-600 bg-black px-2 py-1 text-right text-xs font-black text-white"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="assignment-create-custom flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700 bg-black/35 p-3">
              <button onClick={addCustomProblem} className="mb-2 flex items-center justify-center gap-2 rounded-lg border border-emerald-400 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100">
                <Plus size={14} /> オリジナル問題
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {customProblems.map((problem) => (
                  <div key={problem.id} className="mb-2 rounded-lg border border-slate-700 bg-slate-900/80 p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">問題</span>
                      <button onClick={() => setCustomProblems((prev) => prev.filter((item) => item.id !== problem.id))} className="text-red-300"><Trash2 size={13} /></button>
                    </div>
                    <input value={problem.question} onChange={(e) => updateCustomProblem(problem.id, { question: e.target.value })} placeholder="問題文" className="mb-1 w-full rounded border border-slate-600 bg-black px-2 py-1 text-xs" />
                    <input value={problem.answer} onChange={(e) => updateCustomProblem(problem.id, { answer: e.target.value })} placeholder="正解" className="w-full rounded border border-slate-600 bg-black px-2 py-1 text-xs" />
                    {answerMode === 'CHOICE' && (
                      <div className="mt-2 grid gap-1">
                        <div className="text-[10px] font-bold text-slate-400">4択の誤答候補（未入力なら自動生成）</div>
                        {Array.from({ length: CUSTOM_OPTION_COUNT }).map((_, index) => (
                          <input
                            key={`${problem.id}-option-${index}`}
                            value={problem.options[index] || ''}
                            onChange={(e) => {
                              const nextOptions = [...problem.options];
                              nextOptions[index] = e.target.value;
                              updateCustomProblem(problem.id, { options: nextOptions });
                            }}
                            placeholder={`誤答候補 ${index + 1}`}
                            className="w-full rounded border border-slate-700 bg-black/70 px-2 py-1 text-xs"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {copiedUrl && (
              <div className={`rounded-lg border p-2 text-[10px] break-all ${copyFailed ? 'border-amber-500/50 bg-amber-950/35 text-amber-100' : 'border-emerald-500/40 bg-emerald-950/35 text-emerald-100'}`}>
                <div className="mb-1 flex items-center gap-1 font-black"><Send size={12} /> {copyFailed ? '手動でコピーしてください' : 'コピーしました'}</div>
                {copiedUrl}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCreateScreen;
