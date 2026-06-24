import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, UserRound } from 'lucide-react';
import { AssignmentPayload, LanguageMode, StudentProfile } from '../types';
import { storageService } from '../services/storageService';
import { STUDENT_GRADE_OPTIONS, getCurrentSchoolYear } from '../utils/dailyAssignmentUtils';

interface SubmissionScreenProps {
  onBack: () => void;
  assignment: AssignmentPayload | null;
  languageMode: LanguageMode;
  onProfileChange?: (profile: StudentProfile) => void;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
};

const formatDate = (value?: string) => {
  if (!value) return '未設定';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ja-JP');
};

const sanitizeFileNamePart = (value: string) =>
  String(value || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '')
    .trim();

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SubmissionScreen: React.FC<SubmissionScreenProps> = ({ onBack, assignment, onProfileChange }) => {
  const [profile, setProfile] = useState<StudentProfile>(() => storageService.getStudentProfile());
  const answers = useMemo(() => storageService.getAssignmentAnswers(), []);
  const targetAnswers = useMemo(() => (
    assignment
      ? answers.filter((answer) => answer.assignmentId === assignment.id)
      : answers
  ), [answers, assignment]);
  const answerCount = targetAnswers.length;
  const correctCount = targetAnswers.filter((answer) => answer.correct).length;
  const accuracy = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0;
  const elapsedMs = targetAnswers.reduce((total, answer) => total + Math.max(0, answer.elapsedMs || 0), 0);
  const mistakeRows = useMemo(() => (
    targetAnswers
      .filter((answer) => !answer.correct && !answer.isRetry && (answer.question || answer.problemKey))
      .map((answer) => {
        const retry = targetAnswers.find((candidate) => (
          candidate.isRetry &&
          candidate.retryOfProblemKey &&
          candidate.retryOfProblemKey === (answer.problemKey || answer.problemId) &&
          new Date(candidate.answeredAt).getTime() >= new Date(answer.answeredAt).getTime()
        ));
        return { answer, retry };
      })
  ), [targetAnswers]);
  const unitProgress = useMemo(() => (
    assignment?.units.map((unit) => {
      const unitAnswers = targetAnswers.filter((answer) => unit.modes.includes(answer.mode));
      const unitCorrect = unitAnswers.filter((answer) => answer.correct).length;
      const targetCorrect = Math.max(1, Number(unit.targetCorrect || 10));
      return {
        unit,
        correct: unitCorrect,
        target: targetCorrect,
        percent: Math.min(100, Math.round((unitCorrect / targetCorrect) * 100)),
      };
    }) || []
  ), [assignment, targetAnswers]);
  const latestAt = targetAnswers.reduce<string | undefined>((latest, answer) => {
    if (!latest) return answer.answeredAt;
    return new Date(answer.answeredAt).getTime() > new Date(latest).getTime() ? answer.answeredAt : latest;
  }, undefined);

  const updateProfile = (patch: Partial<StudentProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    storageService.saveStudentProfile(next);
    onProfileChange?.(next);
  };

  const buildReportHtml = () => {
    const pageOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    const reportFileName = [
      sanitizeFileNamePart(profile.grade),
      sanitizeFileNamePart(profile.className) ? `${sanitizeFileNamePart(profile.className)}組` : '',
      sanitizeFileNamePart(profile.number) ? `${sanitizeFileNamePart(profile.number)}番` : '',
      sanitizeFileNamePart(profile.name),
      sanitizeFileNamePart(assignment?.title || '学習実績'),
    ].filter(Boolean).join('_') || '学習ローグ提出レポート';
    return `
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${reportFileName}</title>
<style>
@page { size: A4 ${pageOrientation}; margin: 12mm; }
body { font-family: "Yu Gothic", "Meiryo", sans-serif; padding: 32px; color: #0f172a; }
h1 { font-size: 24px; margin: 0 0 16px; }
.meta { border: 1px solid #94a3b8; padding: 14px; margin-bottom: 18px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
.cell { border: 1px solid #cbd5e1; padding: 12px; }
.label { font-size: 12px; color: #475569; }
.value { font-size: 22px; font-weight: 800; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
th { background: #e2e8f0; }
@media print { button { display: none; } }
</style>
</head>
<body>
<h1>学習ローグ 提出レポート</h1>
<div class="meta">
  <div>課題: ${assignment?.title || '自身の学習実績'}</div>
  <div>期限: ${assignment ? formatDate(assignment.dueAt) : 'なし'}</div>
  <div>学年・組・番号・名前: ${profile.grade || '-'} ${profile.className || '-'}組 ${profile.number || '-'}番 ${profile.name || '-'}</div>
  <div>作成日時: ${new Date().toLocaleString('ja-JP')}</div>
</div>
${unitProgress.length > 0 ? `<table style="margin-bottom:18px"><thead><tr><th>単元</th><th>目標</th><th>正答</th><th>進捗</th></tr></thead><tbody>${unitProgress.map((item) => `<tr><td>${item.unit.name}</td><td>${item.target}</td><td>${item.correct}</td><td>${item.percent}%</td></tr>`).join('')}</tbody></table>` : ''}
<div class="grid">
  <div class="cell"><div class="label">回答数</div><div class="value">${answerCount}</div></div>
  <div class="cell"><div class="label">正答数</div><div class="value">${correctCount}</div></div>
  <div class="cell"><div class="label">正答率</div><div class="value">${accuracy}%</div></div>
  <div class="cell"><div class="label">回答時間</div><div class="value">${formatDuration(elapsedMs)}</div></div>
</div>
${mistakeRows.length > 0 ? `<h2>間違えた問題と再出題結果</h2><table><thead><tr><th>問題</th><th>自分の回答</th><th>正解</th><th>再出題結果</th></tr></thead><tbody>${mistakeRows.map(({ answer, retry }) => `<tr><td>${escapeHtml(answer.question || answer.problemKey)}</td><td>${escapeHtml(answer.selectedAnswer)}</td><td>${escapeHtml(answer.correctAnswer)}</td><td>${retry ? (retry.correct ? '正答' : '不正解') : '未出題'}${retry ? `<br><span class="label">回答: ${escapeHtml(retry.selectedAnswer)}</span>` : ''}</td></tr>`).join('')}</tbody></table>` : ''}
<script>window.onload = () => window.print();</script>
</body>
</html>`;
  };

  const downloadPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildReportHtml());
    win.document.close();
  };

  return (
    <div className="submission-screen h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="submission-shell flex h-full flex-col bg-[linear-gradient(180deg,#020617,#111827)]">
        <div className="submission-header flex items-center justify-between border-b border-emerald-500/30 px-4 py-3">
          <button onClick={onBack} className="submission-back flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
            <ArrowLeft size={16} /> 戻る
          </button>
          <div className="submission-title flex items-center gap-2 text-emerald-200">
            <FileText size={18} />
            <h2 className="text-xl font-black tracking-wider">{assignment ? '提出' : '学習実績'}</h2>
          </div>
          <button onClick={downloadPdf} className="submission-pdf flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300">
            <Download size={16} /> PDF
          </button>
        </div>

        <div className="submission-grid grid flex-1 min-h-0 gap-4 overflow-y-auto p-4 custom-scrollbar lg:grid-cols-[1fr_1.4fr]">
          <section className="submission-profile rounded-xl border border-slate-700 bg-black/35 p-4">
            <div className="submission-section-title mb-4 flex items-center gap-2 text-lg font-black text-white">
              <UserRound size={18} /> 提出者
            </div>
            <div className="submission-profile-grid grid grid-cols-4 gap-2">
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-400">学年</span>
                <select
                  value={profile.grade}
                  onChange={(e) => updateProfile({ grade: e.target.value, schoolYear: getCurrentSchoolYear() })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm font-bold"
                >
                  <option value="">未設定</option>
                  {STUDENT_GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-400">組</span>
                <input value={profile.className} onChange={(e) => updateProfile({ className: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-400">番号</span>
                <input value={profile.number} onChange={(e) => updateProfile({ number: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-400">名前</span>
                <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold" />
              </label>
            </div>

            <div className="submission-target mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4">
              <div className="text-xs font-bold text-emerald-200">対象</div>
              <div className="mt-1 text-xl font-black">{assignment?.title || '自身の学習実績'}</div>
              <div className="mt-1 text-xs text-slate-300">期限: {assignment ? formatDate(assignment.dueAt) : 'なし'}</div>
              {assignment && (
                <div className="mt-3 text-xs leading-5 text-slate-200">
                  {assignment.units.map((unit) => `${unit.name} (${unit.targetCorrect || 10}問)`).join(' / ') || 'オリジナル問題'}
                </div>
              )}
            </div>
          </section>

          <section className="submission-results rounded-xl border border-slate-700 bg-black/35 p-4">
            <div className="submission-stats grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['回答数', `${answerCount}`],
                ['正答数', `${correctCount}`],
                ['正答率', `${accuracy}%`],
                ['回答時間', formatDuration(elapsedMs)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                  <div className="text-xs font-bold text-slate-400">{label}</div>
                  <div className="mt-1 text-2xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-400">最終回答: {formatDate(latestAt)}</div>
            {unitProgress.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                <div className="mb-2 text-sm font-black text-emerald-200">単元別目標</div>
                <div className="space-y-2">
                  {unitProgress.map((item) => (
                    <div key={item.unit.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-100">{item.unit.name}</span>
                        <span className="font-mono text-slate-300">{item.correct}/{item.target}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/60">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mistakeRows.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/20 p-3">
                <div className="mb-2 text-sm font-black text-rose-100">間違えた問題と再出題結果</div>
                <div className="max-h-64 overflow-y-auto rounded border border-slate-700 custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-950 text-slate-300">
                      <tr>
                        <th className="p-2">問題</th>
                        <th className="p-2">回答</th>
                        <th className="p-2">正解</th>
                        <th className="p-2">再出題</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mistakeRows.map(({ answer, retry }) => (
                        <tr key={`${answer.answeredAt}-${answer.problemKey || answer.problemId || answer.question}`} className="border-t border-slate-800">
                          <td className="p-2 text-slate-100">{answer.question || answer.problemKey || '-'}</td>
                          <td className="p-2 text-rose-200">{answer.selectedAnswer || '-'}</td>
                          <td className="p-2 text-emerald-200">{answer.correctAnswer || '-'}</td>
                          <td className={`p-2 font-bold ${retry?.correct ? 'text-emerald-300' : retry ? 'text-rose-300' : 'text-slate-400'}`}>
                            {retry ? (retry.correct ? '正答' : '不正解') : '未出題'}
                            {retry?.selectedAnswer && <div className="mt-0.5 font-normal text-slate-300">回答: {retry.selectedAnswer}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SubmissionScreen;
