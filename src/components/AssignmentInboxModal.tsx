import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Link2, RefreshCw, Unlink, X } from 'lucide-react';
import type { AssignmentPayload, LanguageMode } from '../types';
import { learningManagementService, type ManagementAssignment, type PendingManagementReward } from '../services/learningManagementService';
import { trans } from '../utils/textUtils';

interface Props {
  languageMode: LanguageMode;
  onClose: () => void;
  onOpenAssignment: (assignment: AssignmentPayload) => void;
  onRewardsClaimed: (rewards: PendingManagementReward[]) => void;
}

export default function AssignmentInboxModal({ languageMode, onClose, onOpenAssignment, onRewardsClaimed }: Props) {
  const [connection, setConnection] = useState(() => learningManagementService.getConnection());
  const [code, setCode] = useState('');
  const [assignments, setAssignments] = useState<ManagementAssignment[]>(() => learningManagementService.getCachedAssignments());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const sync = useCallback(async () => {
    setBusy(true); setMessage('');
    try {
      const sent = await learningManagementService.flushProgress();
      const next = await learningManagementService.fetchAssignments();
      setAssignments(next);
      const rewards = await learningManagementService.getPendingRewards();
      for (const reward of rewards) {
        await learningManagementService.claimReward(reward.grantId);
      }
      if (rewards.length) onRewardsClaimed(rewards);
      setMessage(`${trans('同期しました', languageMode)}${sent ? `（${sent}件送信）` : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : trans('同期に失敗しました', languageMode));
    } finally { setBusy(false); }
  }, [languageMode, onRewardsClaimed]);

  useEffect(() => { if (connection) void sync(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const link = async () => {
    setBusy(true); setMessage('');
    try {
      const next = await learningManagementService.linkDevice(code);
      setConnection(next); setCode('');
      await sync();
    } catch (error) { setMessage(error instanceof Error ? error.message : trans('連携に失敗しました', languageMode)); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[10040] flex items-center justify-center bg-black/90 p-3" onClick={onClose}>
    <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl border-2 border-cyan-400 bg-slate-950 p-4 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-black">{trans('学校・家庭からの課題', languageMode)}</h2><p className="mt-1 text-xs text-slate-300">{trans('先生や保護者から届いた課題を、この端末で受け取ります。', languageMode)}</p></div>
        <button onClick={onClose} className="rounded-full border border-slate-600 p-2"><X size={18}/></button>
      </div>
      {!connection ? <section className="rounded-xl border border-cyan-700 bg-cyan-950/30 p-4">
        <div className="mb-2 flex items-center gap-2 font-black"><Link2 size={18}/>{trans('端末を連携', languageMode)}</div>
        <p className="mb-3 text-sm text-slate-300">{trans('管理者から受け取った連携コードを入力してください。', languageMode)}</p>
        <div className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} maxLength={32} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 font-mono uppercase" placeholder="ABCD-EFGH"/><button disabled={busy} onClick={link} className="rounded-lg bg-cyan-400 px-5 font-black text-slate-950 disabled:opacity-50">{trans('連携', languageMode)}</button></div>
      </section> : <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-700 bg-emerald-950/20 p-3 text-sm"><span className="flex items-center gap-2 text-emerald-200"><CheckCircle2 size={17}/>{trans('端末連携済み', languageMode)}</span><div className="flex gap-2"><button disabled={busy} onClick={() => void sync()} className="flex items-center gap-1 rounded-lg border border-cyan-500 px-3 py-2 text-cyan-200"><RefreshCw size={15} className={busy ? 'animate-spin' : ''}/>{trans('同期', languageMode)}</button><button onClick={() => { learningManagementService.unlinkDevice(); setConnection(null); setAssignments([]); }} className="flex items-center gap-1 rounded-lg border border-red-700 px-3 py-2 text-red-300"><Unlink size={15}/>{trans('解除', languageMode)}</button></div></div>
        <div className="space-y-3">{assignments.length === 0 ? <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center text-slate-400">{trans('現在、配信中の課題はありません。', languageMode)}</div> : assignments.map(a => <article key={a.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-cyan-100">{a.title}</h3><p className="mt-1 text-sm text-slate-300">{a.unitLabel} ・ {a.correctCount}/{a.targetCorrect} {trans('問正解', languageMode)}</p>{a.description && <p className="mt-2 text-xs text-slate-400">{a.description}</p>}</div><button disabled={a.status === 'completed'} onClick={() => onOpenAssignment(learningManagementService.toAssignmentPayload(a))} className="rounded-lg bg-amber-400 px-4 py-2 font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{a.status === 'completed' ? trans('達成済み', languageMode) : trans('この課題に挑戦', languageMode)}</button></div>
        </article>)}</div>
      </>}
      {message && <p className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-cyan-200">{message}</p>}
    </div>
  </div>;
}
