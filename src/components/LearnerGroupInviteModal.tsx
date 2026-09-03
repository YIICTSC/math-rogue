import React, { useEffect, useState } from 'react';
import { Link2, LoaderCircle, School, UserRoundCheck } from 'lucide-react';
import {
  LearnerGroupInvitation,
  ManagementProfile,
  managementPortalService,
} from '../services/managementPortalService';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { childSafetyService } from '../services/childSafetyService';

type Props = {
  token: string;
  open: boolean;
  languageMode: LanguageMode;
  onLinked: (profile: ManagementProfile) => void;
  onCancel: () => void;
};

export default function LearnerGroupInviteModal({ token, open, languageMode, onLinked, onCancel }: Props) {
  const [invitation, setInvitation] = useState<LearnerGroupInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const t = (text: string) => trans(text, languageMode);

  useEffect(() => {
    if (!open || !token) return;
    let active = true;
    setLoading(true);
    setError('');
    void managementPortalService.fetchLearnerInvitation(token)
      .then((result) => {
        if (!active) return;
        // 期限切れ・停止済みのURLは参加登録には使えないが、児童を
        // タイトル画面で止めない。URLを消して通常起動へ戻す。
        if (result.unavailableReason) {
          managementPortalService.clearLearnerInvitationToken();
          onCancel();
          return;
        }
        // すでにこのグループへ所属している端末は入力を再表示しない。
        // 既存プロフィールをそのまま親へ渡して、通常のタイトル画面へ進む。
        if (result.alreadyJoined) {
          const profile = managementPortalService.getProfile();
          if (profile) {
            managementPortalService.clearLearnerInvitationToken();
            onLinked(profile);
            return;
          }
        }
        setInvitation(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error && reason.message !== 'Failed to fetch'
          ? reason.message
          : t('招待情報を確認できませんでした。'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open, token, languageMode]);

  if (!open) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoining(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const profile = await managementPortalService.joinLearnerInvitation(token, {
        attendanceNumber: String(form.get('attendanceNumber') || ''),
        displayName: String(form.get('displayName') || ''),
      });
      managementPortalService.clearLearnerInvitationToken();
      onLinked(profile);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('グループに参加できませんでした。'));
    } finally {
      setJoining(false);
    }
  };

  return <div className="fixed inset-0 z-[10045] flex items-center justify-center bg-black/90 p-3">
    <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-cyan-300 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-white shadow-[0_0_55px_rgba(34,211,238,0.3)] sm:p-7" data-gamepad-navigation-root>
      <div className="text-center">
        <School className="mx-auto mb-3 text-cyan-300" size={42} />
        <div className="text-xs font-black tracking-[.25em] text-cyan-300">GROUP INVITATION</div>
        <h2 className="my-3 text-2xl font-black">{t('グループに参加')}</h2>
      </div>

      {loading ? <div className="flex items-center justify-center gap-3 py-10 font-bold text-slate-300"><LoaderCircle className="animate-spin" />{t('招待情報を確認中…')}</div> : invitation ? <>
        <div className="mb-5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 p-4 text-center">
          <strong className="block text-lg text-cyan-100">{invitation.groupName}</strong>
          <span className="mt-1 block text-sm text-slate-300">{invitation.organizationName}</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <p className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold leading-5 text-slate-300">{t('9〜12歳では氏名と出席番号を送信しません。保護者または学校が発行した招待だけを使用してください。')}</p>
          {!childSafetyService.isChild() && <label className="block text-sm font-black text-slate-200">
            {t('出席番号（任意）')}
            <input name="attendanceNumber" maxLength={32} inputMode="numeric" autoComplete="off" className="mt-2 w-full rounded-xl border-2 border-slate-600 bg-slate-950 px-4 py-3 text-base font-bold outline-none focus:border-cyan-300" />
          </label>}
          {!childSafetyService.isChild() && <label className="block text-sm font-black text-slate-200">
            {t('氏名（任意）')}
            <input name="displayName" maxLength={32} autoComplete="name" className="mt-2 w-full rounded-xl border-2 border-slate-600 bg-slate-950 px-4 py-3 text-base font-bold outline-none focus:border-cyan-300" />
          </label>}
          <button data-gamepad-initial-choice disabled={joining} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50">
            {joining ? <LoaderCircle className="animate-spin" size={20} /> : <UserRoundCheck size={20} />}
            {t(joining ? '参加と連携をしています…' : '参加してこの端末を連携')}
          </button>
        </form>
      </> : null}

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-500 bg-red-950/60 p-3 text-sm font-bold text-red-100">{error}</div>}
      <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-700 bg-black/30 p-3 text-xs leading-5 text-slate-400"><Link2 className="mt-0.5 shrink-0" size={16} />{t('氏名と出席番号は公開ランキングには送信されません。')}</div>
      <button type="button" onClick={onCancel} className="mt-4 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-black text-slate-200">{t('あとで参加する')}</button>
    </div>
  </div>;
}
