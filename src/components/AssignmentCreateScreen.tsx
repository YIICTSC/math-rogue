import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clipboard, Copy, Download, ExternalLink, Plus, Send, Trash2, Upload } from 'lucide-react';
import { AssignmentCustomProblem, AssignmentPayload, AssignmentUnit, AnswerMode, LanguageMode } from '../types';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig } from '../subjectConfig';
import { SubjectCategoryType } from '../subjectConfig';
import { CATEGORY_LABELS, NATIVE_ENGLISH_PROBLEM_CATEGORIES, UPPER_PROBLEM_CATEGORIES, getCurrentUnitsForCategory, getSelectableGrades } from './ModeSelectionScreen';
import { createAssignmentUrl } from '../utils/assignmentUtils';
import { trans, transProblemSubjectName } from '../utils/textUtils';
import { formatProblemUnitName } from '../utils/problemUnitName';
import { audioService } from '../services/audioService';
import { getManagementPortalUrl } from '../services/managementPortalService';

interface AssignmentCreateScreenProps {
  onBack: () => void;
  languageMode: LanguageMode;
}

const isGradeUnitCategory = (categoryId: SubjectCategoryType) =>
  ['MATH_GRADES', 'KOKUGO_GRADES', 'ENGLISH', 'LIFE', 'SCIENCE', 'SOCIAL', 'SUMMARY', 'NATIVE_ELA', 'NATIVE_MATH', 'NATIVE_SCIENCE', 'NATIVE_SOCIAL', 'NATIVE_JAPANESE'].includes(categoryId);
type AssignmentProblemSetView = 'standard' | 'upper' | 'nativeEnglish';
const DEFAULT_TARGET_CORRECT = 10;
const CUSTOM_OPTION_COUNT = 3;
const CUSTOM_PROBLEM_TEMPLATE_HEADERS = ['問題文', '正解', '誤答候補1', '誤答候補2', '誤答候補3', 'メモ'];
const CUSTOM_PROBLEM_TEMPLATE_ROWS = [
  ['日本で一番高い山は？', '富士山', '北岳', '筑波山', '阿蘇山', 'メモ列は読み込みません'],
  ['「apple」の意味は？', 'りんご', 'みかん', 'ぶどう', 'バナナ', ''],
];
const CUSTOM_PROBLEM_TEMPLATE_HEADERS_EN = ['Question', 'Answer', 'Wrong Choice 1', 'Wrong Choice 2', 'Wrong Choice 3', 'Note'];
const CUSTOM_PROBLEM_TEMPLATE_ROWS_EN = [
  ['What is the largest planet in our solar system?', 'Jupiter', 'Mars', 'Earth', 'Venus', 'The note column is ignored'],
  ['What is 6 x 7?', '42', '36', '48', '56', ''],
];

const getDefaultDueAt = () => {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  due.setHours(23, 59, 0, 0);
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
};

const escapeCsvCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

const createCustomProblemTemplateCsv = (languageMode: LanguageMode) => {
  const rows = languageMode === 'ENGLISH'
    ? [CUSTOM_PROBLEM_TEMPLATE_HEADERS_EN, ...CUSTOM_PROBLEM_TEMPLATE_ROWS_EN]
    : [CUSTOM_PROBLEM_TEMPLATE_HEADERS, ...CUSTOM_PROBLEM_TEMPLATE_ROWS];
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
};

const parseDelimitedText = (text: string, delimiter: ',' | '\t') => {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!inQuotes && char === '\n') {
      row.push(cell.trim());
      if (row.some((item) => item.length > 0)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((item) => item.length > 0)) rows.push(row);
  return rows;
};

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, '').replace(/[\s（）()_\-]/g, '').toLowerCase();

const findColumnIndex = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

const parseCustomProblemRows = (text: string) => {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/).find((line) => line.trim()) || '';
  const delimiter: ',' | '\t' = firstLine.includes('\t') ? '\t' : ',';
  const rows = parseDelimitedText(text, delimiter);
  if (rows.length === 0) return { problems: [] as AssignmentCustomProblem[], skipped: 0 };

  const headerCandidate = rows[0];
  const headerQuestionIndex = findColumnIndex(headerCandidate, ['問題文', '問題', 'question', 'q']);
  const headerAnswerIndex = findColumnIndex(headerCandidate, ['正解', '答え', '解答', 'answer', 'a']);
  const hasHeader = headerQuestionIndex >= 0 && headerAnswerIndex >= 0;
  const questionIndex = hasHeader ? headerQuestionIndex : 0;
  const answerIndex = hasHeader ? headerAnswerIndex : 1;
  const optionIndexes = hasHeader
    ? [
      findColumnIndex(headerCandidate, ['誤答候補1', '誤答1', '選択肢1', 'option1', 'wrong1']),
      findColumnIndex(headerCandidate, ['誤答候補2', '誤答2', '選択肢2', 'option2', 'wrong2']),
      findColumnIndex(headerCandidate, ['誤答候補3', '誤答3', '選択肢3', 'option3', 'wrong3']),
    ]
    : [2, 3, 4];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const now = Date.now();
  let skipped = 0;
  const problems = dataRows.reduce<AssignmentCustomProblem[]>((acc, row, index) => {
    const question = (row[questionIndex] || '').trim();
    const answer = (row[answerIndex] || '').trim();
    if (!question || !answer) {
      skipped += 1;
      return acc;
    }
    const rawOptions = optionIndexes.map((optionIndex) => (
      optionIndex >= 0 ? (row[optionIndex] || '').trim() : ''
    ));
    acc.push({
      id: `custom-import-${now}-${index}`,
      question,
      answer,
      options: Array.from({ length: CUSTOM_OPTION_COUNT }, (_, optionIndex) => rawOptions[optionIndex] || ''),
    });
    return acc;
  }, []);

  return { problems, skipped };
};

const AssignmentCreateScreen: React.FC<AssignmentCreateScreenProps> = ({ onBack, languageMode }) => {
  const initialProblemSetView: AssignmentProblemSetView = languageMode === 'ENGLISH' ? 'nativeEnglish' : 'standard';
  const initialCategories = initialProblemSetView === 'nativeEnglish' ? NATIVE_ENGLISH_PROBLEM_CATEGORIES : SUBJECT_CATEGORIES;
  const initialCategory = initialCategories[0] || SUBJECT_CATEGORIES.find((cat) => cat.id === 'MATH_GRADES') || SUBJECT_CATEGORIES[0];
  const [selectedCategoryId, setSelectedCategoryId] = useState<SubjectCategoryType>(initialCategory.id);
  const [selectedGrade, setSelectedGrade] = useState(() => getSelectableGrades(initialCategory.id)[0] || 1);
  const [selectedUnits, setSelectedUnits] = useState<AssignmentUnit[]>([]);
  const [title, setTitle] = useState(() => trans('今日の課題', languageMode));
  const [dueAt, setDueAt] = useState(() => getDefaultDueAt());
  const [gameMode, setGameMode] = useState<'FREE' | 'CHALLENGE_ONLY'>('FREE');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('CHOICE');
  const [customProblems, setCustomProblems] = useState<AssignmentCustomProblem[]>([]);
  const [customTargetCorrect, setCustomTargetCorrect] = useState(DEFAULT_TARGET_CORRECT);
  const [customImportNotice, setCustomImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [problemSetView, setProblemSetView] = useState<AssignmentProblemSetView>(initialProblemSetView);
  const customProblemFileInputRef = useRef<HTMLInputElement | null>(null);
  const categories = useMemo<SubjectCategoryConfig[]>(() => {
    if (problemSetView === 'upper') return UPPER_PROBLEM_CATEGORIES;
    if (problemSetView === 'nativeEnglish') return NATIVE_ENGLISH_PROBLEM_CATEGORIES;
    return SUBJECT_CATEGORIES;
  }, [problemSetView]);
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
  const validCustomProblems = useMemo(
    () => customProblems.filter((problem) => problem.question.trim() && problem.answer.trim()),
    [customProblems],
  );
  const validCustomProblemCount = validCustomProblems.length;
  const hasKanjiUnit = selectedUnits.some((unit) => unit.modes.some((mode) => /KANJI|KANKEN/.test(String(mode))));
  useEffect(() => {
    if (!hasKanjiUnit && answerMode === 'WRITING') setAnswerMode('CHOICE');
  }, [answerMode, hasKanjiUnit]);
  const effectiveCustomTargetCorrect = validCustomProblemCount > 0
    ? Math.min(validCustomProblemCount, Math.max(1, Math.floor(customTargetCorrect || 1)))
    : Math.max(1, Math.floor(customTargetCorrect || DEFAULT_TARGET_CORRECT));
  const formatQuestionCount = (count: number) => languageMode === 'ENGLISH' ? `${count} questions` : `${count}問`;
  const formatEntryCount = (count: number) => languageMode === 'ENGLISH' ? `${count} entries` : `${count}件`;
  const formatSelectableGrade = (grade: number) => {
    if (languageMode === 'ENGLISH') return grade <= 6 ? `Grade ${grade}` : `JH ${grade - 6}`;
    return grade <= 6 ? `${grade}年` : `中${grade - 6}`;
  };
  const formatUnitName = (name: string) => formatProblemUnitName(name, languageMode, selectedCategoryId);

  const changeProblemSetView = (view: AssignmentProblemSetView) => {
    const nextCategories = view === 'upper'
      ? UPPER_PROBLEM_CATEGORIES
      : view === 'nativeEnglish'
        ? NATIVE_ENGLISH_PROBLEM_CATEGORIES
        : SUBJECT_CATEGORIES;
    const nextCategoryId = nextCategories[0]?.id || 'MATH_GRADES';
    setProblemSetView(view);
    setSelectedCategoryId(nextCategoryId);
    setSelectedGrade(getSelectableGrades(nextCategoryId)[0] || 1);
    audioService.playSound('select');
  };

  const assignment = useMemo<AssignmentPayload>(() => ({
    id: `assignment-${Date.now()}`,
    title: title.trim() || trans('学習ローグ課題', languageMode),
    units: selectedUnits,
    customProblems: validCustomProblems,
    customTargetCorrect: effectiveCustomTargetCorrect,
    dueAt,
    gameMode,
    answerMode,
    createdAt: new Date().toISOString(),
  }), [answerMode, dueAt, effectiveCustomTargetCorrect, gameMode, languageMode, selectedUnits, title, validCustomProblems]);

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
    setCustomImportNotice(null);
  };

  const updateCustomTargetCorrect = (targetCorrect: number) => {
    const maxTarget = validCustomProblemCount > 0 ? validCustomProblemCount : 999;
    const normalizedTarget = Math.max(1, Math.min(maxTarget, Math.floor(targetCorrect || 1)));
    setCustomTargetCorrect(normalizedTarget);
  };

  const updateCustomProblem = (id: string, patch: Partial<AssignmentCustomProblem>) => {
    setCustomProblems((prev) => prev.map((problem) => problem.id === id ? {
      ...problem,
      ...patch,
      options: patch.options ? patch.options.slice(0, CUSTOM_OPTION_COUNT) : problem.options,
    } : problem));
  };

  const downloadCustomProblemTemplate = () => {
    const blob = new Blob([createCustomProblemTemplateCsv(languageMode)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'learning-rogue-original-problems-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setCustomImportNotice({ type: 'success', message: trans('テンプレートCSVをダウンロードしました。ExcelやGoogle Sheetsで編集できます。', languageMode) });
    audioService.playSound('select');
  };

  const importCustomProblemFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { problems, skipped } = parseCustomProblemRows(text);
      if (problems.length === 0) {
        setCustomImportNotice({ type: 'error', message: trans('読み込める問題がありません。問題文と正解の列を確認してください。', languageMode) });
        return;
      }
      setCustomProblems((prev) => [...prev, ...problems]);
      setCustomImportNotice({
        type: 'success',
        message: languageMode === 'ENGLISH'
          ? `${formatQuestionCount(problems.length)} added.${skipped > 0 ? ` ${skipped} blank rows skipped.` : ''}`
          : `${formatQuestionCount(problems.length)}を追加しました。${skipped > 0 ? `未入力行 ${formatEntryCount(skipped)}はスキップしました。` : ''}`,
      });
      audioService.playSound('select');
    } catch (error) {
      setCustomImportNotice({ type: 'error', message: trans('ファイルの読み込みに失敗しました。CSVまたはTSV形式で保存してから読み込んでください。', languageMode) });
    } finally {
      event.target.value = '';
    }
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
      window.prompt(trans('課題URLをコピーしてください', languageMode), url);
    }
    audioService.playSound('select');
  };

  const canCopy = selectedUnits.length > 0 || assignment.customProblems.length > 0;

  return (
    <div data-gamepad-initial-scope="assignment-create-screen" className="assignment-create-screen h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="assignment-create-shell flex h-full flex-col bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_38%),linear-gradient(180deg,#020617,#0f172a)]">
        <div className="assignment-create-header flex items-center justify-between border-b border-cyan-500/30 px-4 py-3">
          <button data-gamepad-back data-gamepad-initial-choice onClick={onBack} className="assignment-create-back flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
            <ArrowLeft size={16} /> {trans('戻る', languageMode)}
          </button>
          <div className="assignment-create-title flex items-center gap-2 text-cyan-200">
            <Clipboard size={18} />
            <h2 className="text-xl font-black tracking-wider">{trans('課題送信', languageMode)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={getManagementPortalUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-violet-400 bg-violet-500/15 px-3 py-2 text-sm font-black text-violet-100 hover:bg-violet-500/25"
            >
              <ExternalLink size={16} /> {trans('管理ポータル', languageMode)}
            </a>
            <button
              onClick={copyUrl}
              disabled={!canCopy}
              className={`assignment-create-copy flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${canCopy ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
            >
              <Copy size={16} /> {trans('URLコピー', languageMode)}
            </button>
          </div>
        </div>

        <div className="assignment-create-grid grid flex-1 min-h-0 gap-4 overflow-hidden p-4 lg:grid-cols-[1.2fr_1.8fr_1fr]">
          <section className="assignment-create-settings min-h-0 overflow-y-auto rounded-xl border border-slate-700 bg-black/35 p-3 custom-scrollbar">
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-slate-400">{trans('課題名', languageMode)}</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold text-slate-400">{trans('回答期限', languageMode)}</span>
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
            </label>
            <div className="mb-3">
              <div className="mb-1 text-xs font-bold text-slate-400">{trans('ゲームモード', languageMode)}</div>
              <div className="grid grid-cols-2 gap-2">
                {(['FREE', 'CHALLENGE_ONLY'] as const).map((mode) => (
                  <button key={mode} onClick={() => setGameMode(mode)} className={`rounded-lg border px-2 py-2 text-xs font-black ${gameMode === mode ? 'border-cyan-300 bg-cyan-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-200'}`}>
                    {trans(mode === 'FREE' ? 'フリー' : '問題チャレンジのみ', languageMode)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-1 text-xs font-bold text-slate-400">{trans('答え方', languageMode)}</div>
              <div className={`grid ${hasKanjiUnit ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                {(hasKanjiUnit ? ['CHOICE', 'INPUT', 'WRITING'] : ['CHOICE', 'INPUT']).map((mode) => (
                  <button key={mode} onClick={() => setAnswerMode(mode)} className={`rounded-lg border px-2 py-2 text-xs font-black ${answerMode === mode ? 'border-yellow-300 bg-yellow-400 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-200'}`}>
                    {trans(mode === 'CHOICE' ? '4択' : mode === 'WRITING' ? '書き' : '入力', languageMode)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs leading-5 text-cyan-100">
              {trans('URLで開くと課題モードとして開始します。フリーの場合は通常のゲーム内問題も課題範囲へ差し替えます。', languageMode)}
            </div>
          </section>

          <section className="assignment-create-units flex min-h-0 flex-col rounded-xl border border-slate-700 bg-black/35 p-3">
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              {([
                ['standard', '通常問題'],
                ['upper', '高校生以上'],
                ['nativeEnglish', '英語圏児童向け'],
              ] as const).map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => changeProblemSetView(view)}
                  className={`rounded-lg border px-2 py-2 text-[10px] font-black transition-colors ${
                    problemSetView === view
                      ? 'border-yellow-300 bg-yellow-400 text-slate-950'
                      : 'border-cyan-300/70 bg-slate-900 text-cyan-100 hover:bg-cyan-950'
                  }`}
                >
                  {trans(label, languageMode)}
                </button>
              ))}
            </div>
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
                    {formatSelectableGrade(grade)}
                  </button>
                ))}
              </div>
            )}
            <div className="assignment-create-unit-grid grid flex-1 min-h-0 grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
              {units.map((unit) => {
                const selected = selectedUnits.some((item) => item.id === unit.id);
                return (
                  <button key={unit.id} onClick={() => toggleUnit(unit)} className={`min-h-14 rounded-lg border px-3 py-2 text-left text-xs font-bold ${selected ? 'border-cyan-200 bg-cyan-500 text-slate-950' : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-400'}`}>
                    {formatUnitName(unit.name)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="assignment-create-side flex min-h-0 flex-col gap-3">
            <div className="assignment-create-selected rounded-xl border border-slate-700 bg-black/35 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-black text-cyan-200">
                  {trans('選択中', languageMode)} {trans('単元', languageMode)} {formatEntryCount(selectedUnits.length)} / {trans('オリジナル', languageMode)} {formatQuestionCount(validCustomProblemCount)}
                </div>
                <button onClick={() => setSelectedUnits([])} className="text-xs font-bold text-slate-400 hover:text-white">{trans('選択解除', languageMode)}</button>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-slate-200 custom-scrollbar">
                {selectedUnits.length === 0 && validCustomProblemCount === 0 ? (
                  <div className="text-slate-500">{trans('単元またはオリジナル問題を選択してください', languageMode)}</div>
                ) : (
                  <>
                    {selectedUnits.map((unit) => (
                      <div key={unit.id} className="mb-2 rounded border border-slate-700 bg-slate-900/70 p-2">
                        <div className="mb-1 font-bold text-slate-100">{formatUnitName(unit.name)}</div>
                        <label className="flex items-center justify-between gap-2 text-[10px] text-slate-300">
                          {trans('目標正答数', languageMode)}
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
                    {validCustomProblemCount > 0 && (
                      <div className="mb-2 rounded border border-emerald-500/50 bg-emerald-950/30 p-2">
                        <div className="mb-1 font-bold text-emerald-100">{trans('オリジナル問題:', languageMode)} {formatQuestionCount(validCustomProblemCount)}</div>
                        <div className="text-[10px] text-emerald-200">{trans('目標正答数:', languageMode)} {formatQuestionCount(effectiveCustomTargetCorrect)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="assignment-create-custom flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700 bg-black/35 p-3">
              <div className="mb-2 grid grid-cols-1 gap-2">
                <button onClick={addCustomProblem} className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100">
                  <Plus size={14} /> {trans('オリジナル問題', languageMode)}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={downloadCustomProblemTemplate}
                    className="flex items-center justify-center gap-1 rounded-lg border border-cyan-400 bg-cyan-500/15 px-2 py-2 text-[10px] font-black text-cyan-100 hover:bg-cyan-500/25"
                  >
                    <Download size={13} /> {trans('テンプレートCSV', languageMode)}
                  </button>
                  <button
                    type="button"
                    onClick={() => customProblemFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1 rounded-lg border border-violet-400 bg-violet-500/15 px-2 py-2 text-[10px] font-black text-violet-100 hover:bg-violet-500/25"
                  >
                    <Upload size={13} /> {trans('CSV読込', languageMode)}
                  </button>
                </div>
                <input
                  ref={customProblemFileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                  onChange={importCustomProblemFile}
                  className="hidden"
                />
                <div className="rounded border border-slate-700 bg-slate-950/80 p-2 text-[10px] leading-4 text-slate-300">
                  {trans('Excel / Google Sheetsでテンプレートを編集し、CSVまたはTSVで保存して読み込めます。4択の場合は誤答候補1〜3を使います。', languageMode)}
                </div>
                <div className="rounded border border-emerald-500/40 bg-emerald-950/25 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-bold text-emerald-100">
                    <span>{trans('送信対象:', languageMode)} {formatQuestionCount(validCustomProblemCount)}</span>
                    <span>{trans('目標:', languageMode)} {languageMode === 'ENGLISH' ? `${effectiveCustomTargetCorrect} correct` : `${effectiveCustomTargetCorrect}問正解`}</span>
                  </div>
                  <label className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-200">
                    {trans('オリジナル問題の目標正答数', languageMode)}
                    <input
                      type="number"
                      min={1}
                      max={validCustomProblemCount > 0 ? validCustomProblemCount : 999}
                      value={effectiveCustomTargetCorrect}
                      onChange={(event) => updateCustomTargetCorrect(Number(event.target.value))}
                      disabled={validCustomProblemCount === 0}
                      className="w-20 rounded border border-slate-600 bg-black px-2 py-1 text-right text-xs font-black text-white disabled:cursor-not-allowed disabled:text-slate-500"
                    />
                  </label>
                </div>
                {customImportNotice && (
                  <div className={`rounded border p-2 text-[10px] font-bold leading-4 ${
                    customImportNotice.type === 'success'
                      ? 'border-emerald-500/50 bg-emerald-950/35 text-emerald-100'
                      : 'border-red-500/50 bg-red-950/35 text-red-100'
                  }`}>
                    {customImportNotice.message}
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {customProblems.map((problem) => (
                  <div key={problem.id} className="mb-2 rounded-lg border border-slate-700 bg-slate-900/80 p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{trans('問題', languageMode)}</span>
                      <button onClick={() => setCustomProblems((prev) => prev.filter((item) => item.id !== problem.id))} className="text-red-300"><Trash2 size={13} /></button>
                    </div>
                    <input value={problem.question} onChange={(e) => updateCustomProblem(problem.id, { question: e.target.value })} placeholder={trans('問題文', languageMode)} className="mb-1 w-full rounded border border-slate-600 bg-black px-2 py-1 text-xs" />
                    <input value={problem.answer} onChange={(e) => updateCustomProblem(problem.id, { answer: e.target.value })} placeholder={trans('正解', languageMode)} className="w-full rounded border border-slate-600 bg-black px-2 py-1 text-xs" />
                    {answerMode === 'CHOICE' && (
                      <div className="mt-2 grid gap-1">
                        <div className="text-[10px] font-bold text-slate-400">{trans('4択の誤答候補（未入力なら自動生成）', languageMode)}</div>
                        {Array.from({ length: CUSTOM_OPTION_COUNT }).map((_, index) => (
                          <input
                            key={`${problem.id}-option-${index}`}
                            value={problem.options[index] || ''}
                            onChange={(e) => {
                              const nextOptions = [...problem.options];
                              nextOptions[index] = e.target.value;
                              updateCustomProblem(problem.id, { options: nextOptions });
                            }}
                            placeholder={`${trans('誤答候補', languageMode)} ${index + 1}`}
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
                <div className="mb-1 flex items-center gap-1 font-black"><Send size={12} /> {trans(copyFailed ? '手動でコピーしてください' : 'コピーしました', languageMode)}</div>
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
