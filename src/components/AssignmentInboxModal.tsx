import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CloudOff, Link2, LoaderCircle, RefreshCw, School, Unlink, X } from 'lucide-react';
import {
  ManagedAssignment,
  ManagementProfile,
  ManagementRelationship,
  getNextRequiredManagedAssignment,
  isManagedAssignmentComplete,
  managementPortalService,
  sortManagedAssignments,
} from '../services/managementPortalService';
import { AssignmentPayload, LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (assignment: AssignmentPayload) => void;
  onProfileChange: (profile: ManagementProfile | null) => void;
  languageMode: LanguageMode;
};

type InboxFilter = 'all' | 'new' | 'today' | 'soon' | 'completed';

const isDueToday = (dueAt?: string | null) => {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  const now = new Date();
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
};

const isDueSoon = (dueAt?: string | null) => {
  if (!dueAt || isDueToday(dueAt)) return false;
  const remaining = new Date(dueAt).getTime() - Date.now();
  return remaining > 0 && remaining <= 3 * 86400000;
};

export default function AssignmentInboxModal({ open, onClose, onSelect, onProfileChange, languageMode }: Props) {
  const [profile, setProfile] = useState<ManagementProfile | null>(() => managementPortalService.getProfile());
  const [assignments, setAssignments] = useState<ManagedAssignment[]>(() => managementPortalService.getCachedAssignments());
  const [relationships, setRelationships] = useState<ManagementRelationship[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [openingId, setOpeningId] = useState('');
  const t = (text: string) => trans(text, languageMode);
  const statusLabel = (status: string) => t(status === 'completed' ? '達成済み' : status === 'in_progress' ? '挑戦中' : '未着手');
  const formatQuestionCount = (count: number) => languageMode === 'ENGLISH' ? `${count} questions` : languageMode === 'HIRAGANA' ? `${count}もん` : `${count}問`;
  const formatProgress = (correct: number, target: number, retries: number) => languageMode === 'ENGLISH'
    ? `${correct}/${target} correct · ${retries} retries`
    : languageMode === 'HIRAGANA'
      ? `${correct}/${target}もんせいかい・さいちょうせん ${retries}かい`
      : `${correct}/${target}問正解・再挑戦 ${retries}回`;

  const sortedAssignments = useMemo(() => sortManagedAssignments(assignments), [assignments]);
  const nextRequiredAssignment = useMemo(() => getNextRequiredManagedAssignment(assignments), [assignments]);
  const filterCounts = useMemo<Record<InboxFilter, number>>(() => ({
    all: assignments.length,
    new: assignments.filter((item) => item.status === 'unopened').length,
    today: assignments.filter((item) => item.status !== 'completed' && isDueToday(item.dueAt)).length,
    soon: assignments.filter((item) => item.status !== 'completed' && isDueSoon(item.dueAt)).length,
    completed: assignments.filter((item) => item.status === 'completed' || Number(item.correctCount || 0) >= Math.max(1, Number(item.targetCorrect || 10))).length,
  }), [assignments]);
  const visibleAssignments = useMemo(() => sortedAssignments.filter((item) => {
    if (filter === 'new') return item.status === 'unopened';
    if (filter === 'today') return item.status !== 'completed' && isDueToday(item.dueAt);
    if (filter === 'soon') return item.status !== 'completed' && isDueSoon(item.dueAt);
    if (filter === 'completed') return item.status === 'completed' || Number(item.correctCount || 0) >= Math.max(1, Number(item.targetCorrect || 10));
    return true;
  }), [filter, sortedAssignments]);

  const sync = async () => {
    if (!managementPortalService.getProfile()) return;
    setLoading(true);
    setError('');
    try {
      await managementPortalService.flushPending();
      const [nextAssignments, relationshipData] = await Promise.all([
        managementPortalService.fetchAssignments(),
        managementPortalService.fetchRelationships(),
      ]);
      setAssignments(nextAssignments);
      setRelationships(relationshipData.relationships);
      setOffline(false);
      const nextProfile = managementPortalService.getProfile();
      setProfile(nextProfile);
      onProfileChange(nextProfile);
    } catch (reason) {
      setOffline(true);
      setError(t(assignments.length > 0 ? '通信できないため、端末に保存した課題を表示しています。' : reason instanceof Error ? reason.message : '同期できませんでした。'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && profile) void sync();
    // Opening the modal is the deliberate refresh trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const link = async (event: React.FormEvent) => {
    event.preventDefault();
    if (code.replace(/\s/g, '').length < 6) return;
    setLoading(true);
    setError('');
    try {
      const linked = await managementPortalService.linkDevice(code);
      setProfile(linked);
      onProfileChange(linked);
      setCode('');
      const [nextAssignments, relationshipData] = await Promise.all([
        managementPortalService.fetchAssignments(),
        managementPortalService.fetchRelationships(),
      ]);
      setAssignments(nextAssignments);
      setRelationships(relationshipData.relationships);
      setOffline(false);
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : '連携できませんでした。コードと有効期限を確認してください。'));
    } finally {
      setLoading(false);
    }
  };

  const unlink = async () => {
    if (!window.confirm(t('この端末と管理ポータルの連携を解除しますか？'))) return;
    setLoading(true);
    setError('');
    try {
      await managementPortalService.unlinkDevice();
      setProfile(null);
      setAssignments([]);
      setRelationships([]);
      onProfileChange(null);
    } catch {
      setError(t('端末を安全に解除できませんでした。通信を確認して再試行するか、保護者・先生に管理ポータルから端末を失効してもらってください。'));
    } finally {
      setLoading(false);
    }
  };

  const openAssignment = async (assignment: ManagedAssignment) => {
    setOpeningId(assignment.id);
    setError('');
    try {
      onSelect(await managementPortalService.fetchAssignmentPayload(assignment.id));
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : '課題を開けませんでした。通信を確認してください。'));
    } finally {
      setOpeningId('');
    }
  };

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-950/90 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-inbox-title">
      <section className="max-h-[96vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-4 border-cyan-300 bg-slate-950 text-slate-100 shadow-[0_0_45px_rgba(34,211,238,0.28)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-900 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <div className="text-[10px] font-black tracking-[0.28em] text-cyan-300">ASSIGNMENT INBOX</div>
            <h2 id="assignment-inbox-title" className="text-xl font-black sm:text-2xl">{t('課題受信箱')}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 p-2 text-slate-300 hover:bg-slate-800" aria-label={t('閉じる')}><X size={20} /></button>
        </header>

        {!profile ? (
          <div className="p-5 sm:p-8">
            <div className="mx-auto max-w-xl rounded-2xl border border-cyan-700 bg-cyan-950/35 p-5 sm:p-7">
              <Link2 className="mb-4 text-cyan-300" size={34} />
              <h3 className="text-lg font-black">{t('保護者・先生からの課題を受け取る')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t('管理ポータルで発行された10分間・1回限りの端末連携コードを入力してください。')}</p>
              <form onSubmit={link} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  maxLength={16}
                  autoComplete="one-time-code"
                  placeholder={t('連携コード')}
                  className="min-w-0 flex-1 rounded-xl border-2 border-slate-600 bg-slate-900 px-4 py-3 text-center font-mono text-xl font-black tracking-[0.18em] outline-none focus:border-cyan-300"
                />
                <button disabled={loading || code.replace(/\s/g, '').length < 6} className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
                  {t(loading ? '連携中…' : 'この端末を連携')}
                </button>
              </form>
              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs leading-5 text-slate-400">{t('本名・学校名・問題文・入力した解答は送信しません。学習進度として課題ID、正誤、再挑戦、所要時間だけを同期します。')}</div>
              {error && <p className="mt-3 text-sm font-bold text-rose-300">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950"><School size={21} /></span>
                <div>
                  <strong className="block" data-allow-japanese>{profile.displayName || t('連携済みの学習者')}</strong>
                  <small className="text-slate-400" data-allow-japanese>{relationships.map((item) => `${item.organizationName} / ${item.groupName}`).join('・') || t('管理ポータルと連携済み')}</small>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void sync()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-cyan-600 px-3 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-950 disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={15} /> : <RefreshCw size={15} />}{t('同期')}</button>
                <button type="button" onClick={() => void unlink()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 disabled:opacity-50"><Unlink size={15} />{t('解除')}</button>
              </div>
            </div>

            {relationships.length > 0 && <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="mb-2 text-[10px] font-black tracking-[0.16em] text-slate-400">{t('進度を閲覧できる所属先')}</div>
              <div className="flex flex-wrap gap-2">{relationships.map((item) => <span key={`${item.groupId}:${item.organizationName}`} className="rounded-full border border-cyan-800 bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-100" data-allow-japanese>{item.organizationName} / {item.groupName}</span>)}</div>
            </div>}

            {error && <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm font-bold ${offline ? 'border-amber-700 bg-amber-950/40 text-amber-200' : 'border-rose-700 bg-rose-950/40 text-rose-200'}`}>{offline && <CloudOff size={18} />}{error}</div>}

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {([
                ['all', 'すべて'], ['new', '新着'], ['today', '今日まで'], ['soon', '期限間近'], ['completed', '達成済み'],
              ] as Array<[InboxFilter, string]>).map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black ${filter === id ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>{t(label)} <span className="ml-1 opacity-70">{filterCounts[id]}</span></button>)}
            </div>

            <div className="grid gap-3">
              {visibleAssignments.length === 0 && !loading ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-700 px-5 py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={38} />
                  <h3 className="font-black">{t('この分類の課題はありません')}</h3>
                  <p className="mt-1 text-sm text-slate-400">{t('別の分類を選ぶか、同期して新しい課題を確認してください。')}</p>
                </div>
              ) : visibleAssignments.map((assignment) => {
                const target = Math.max(1, Number(assignment.targetCorrect || 10));
                const unitCount = assignment.units?.length || 1;
                const progress = Math.min(100, Math.round(Number(assignment.correctCount || 0) / target * 100));
                const completed = isManagedAssignmentComplete(assignment) || progress >= 100;
                const blockedByRequired = Boolean(nextRequiredAssignment && nextRequiredAssignment.id !== assignment.id);
                return (
                  <article key={assignment.id} className={`rounded-2xl border p-4 sm:p-5 ${completed ? 'border-emerald-800 bg-emerald-950/20' : 'border-slate-700 bg-slate-900'}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black">
                          <span className="rounded-full bg-cyan-950 px-2 py-1 text-cyan-200">{t(assignment.subject)}</span>
                          <span className={`rounded-full px-2 py-1 ${assignment.requirementType === 'required' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-300'}`}>{t(assignment.requirementType === 'required' ? '必須課題' : '任意課題')}</span>
                          <span className="rounded-full bg-indigo-950 px-2 py-1 text-indigo-200">{t(assignment.playMode === 'problem_only' ? '問題チャレンジのみ' : 'フリー')}</span>
                          <span className={completed ? 'text-emerald-300' : 'text-amber-300'}>{statusLabel(completed ? 'completed' : assignment.status)}</span>
                        </div>
                        <h3 className="truncate text-lg font-black" data-allow-japanese>{t(assignment.title)}</h3>
                        <p className="mt-1 text-sm text-slate-400" data-allow-japanese>{unitCount > 1 ? `${languageMode === 'ENGLISH' ? `${unitCount} units` : `${unitCount}単元`}・` : ''}{t(assignment.unitLabel)}・{t('目標')} {formatQuestionCount(target)}{assignment.dueAt ? `・${t('期限')} ${new Date(assignment.dueAt).toLocaleString(languageMode === 'ENGLISH' ? 'en-US' : 'ja-JP')}` : `・${t('期限なし')}`}</p>
                        {assignment.description && <p className="mt-2 text-xs leading-5 text-slate-300" data-allow-japanese>{t(assignment.description)}</p>}
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} /></div>
                        <small className="mt-1 block text-slate-500">{formatProgress(assignment.correctCount, target, assignment.retryCorrectCount)}</small>
                      </div>
                      <button
                        type="button"
                        disabled={completed || blockedByRequired || Boolean(openingId)}
                        onClick={() => void openAssignment(assignment)}
                        className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        {t(completed ? '達成済み' : blockedByRequired ? '先に必須課題' : openingId === assignment.id ? '読込中…' : assignment.status === 'in_progress' ? 'つづきから' : '課題を開く')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
