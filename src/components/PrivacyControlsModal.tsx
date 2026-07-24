import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Trash2, Unlink, X } from 'lucide-react';
import { childSafetyService } from '../services/childSafetyService';
import { managementPortalService, type ManagementProfile } from '../services/managementPortalService';
import { onlineRankingService, type OnlineRankingProfile } from '../services/onlineRankingService';
import { storageService } from '../services/storageService';
import { LanguageMode } from '../types';

type Props = {
  open: boolean;
  languageMode: LanguageMode;
  onlineProfile: OnlineRankingProfile | null;
  managementProfile: ManagementProfile | null;
  onClose: () => void;
  onOnlineProfileChange: (profile: OnlineRankingProfile | null) => void;
  onManagementProfileChange: (profile: ManagementProfile | null) => void;
};

const ageLabel: Record<string, string> = {
  '9_12': '9〜12歳',
  '13_15': '13〜15歳',
  '16_17': '16〜17歳',
  '18_PLUS': '18歳以上',
};

export default function PrivacyControlsModal(props: Props) {
  const { open, onClose, onlineProfile, managementProfile, onOnlineProfileChange, onManagementProfileChange } = props;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!open) return null;
  const settings = childSafetyService.getSettings();

  const deleteRanking = async () => {
    if (!window.confirm('オンラインランキングの公開名、識別コード、スコア、集計記録を削除します。元に戻せません。続けますか？')) return;
    setBusy(true); setMessage('');
    try {
      await onlineRankingService.deleteServerData();
      onOnlineProfileChange(null);
      setMessage('ランキングのサーバーデータを削除しました。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'ランキングデータを削除できませんでした。');
    } finally { setBusy(false); }
  };

  const requestLearningDeletion = async () => {
    if (!window.confirm('教員・保護者向け集計データの削除を申請し、この端末の連携を停止しますか？')) return;
    setBusy(true); setMessage('');
    try {
      const result = await managementPortalService.requestDataDeletion();
      onManagementProfileChange(null);
      setMessage(`学習集計データの削除を申請しました。実行予定: ${new Date(result.executeAfter).toLocaleDateString('ja-JP')}`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '削除申請を送信できませんでした。');
    } finally { setBusy(false); }
  };

  const verifyRankingConsent = async () => {
    setBusy(true); setMessage('');
    try {
      const { proof } = await managementPortalService.getRankingConsentProof();
      await onlineRankingService.verifyChildConsent(proof);
      setMessage('保護者許可を確認しました。匿名ランキングへ参加できます。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '保護者許可を確認できませんでした。');
    } finally { setBusy(false); }
  };

  const unlink = async () => {
    if (!window.confirm('教員・保護者向け集計との端末連携を解除しますか？')) return;
    setBusy(true); setMessage('');
    try {
      await managementPortalService.unlinkDevice();
      onManagementProfileChange(null);
      setMessage('端末連携を解除しました。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '端末連携を解除できませんでした。');
    } finally { setBusy(false); }
  };

  const revokeLearningConsent = async () => {
    if (!window.confirm('教員・保護者向け学習集計への許可を取り消しますか？新しい学習記録の送信を停止します。')) return;
    setBusy(true); setMessage('');
    try {
      await managementPortalService.revokeLearningConsent();
      setMessage('学習集計への許可を取り消し、新しい記録の送信を停止しました。');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '許可を取り消せませんでした。');
    } finally { setBusy(false); }
  };

  const clearLocal = () => {
    if (!window.confirm('この端末のゲーム進行、学習記録、設定をすべて削除します。サーバーデータは別のボタンで削除してください。続けますか？')) return;
    storageService.clearAllLocalData();
    window.location.reload();
  };

  return <div data-gamepad-modal data-gamepad-initial-scope="privacy-controls" className="fixed inset-0 z-[10090] flex items-center justify-center bg-black/90 p-3" role="dialog" aria-modal="true" aria-labelledby="privacy-controls-title">
    <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border-4 border-cyan-300 bg-slate-950 p-5 text-white sm:p-7">
      <header className="flex items-start justify-between gap-3">
        <div><ShieldCheck className="mb-2 text-cyan-300" size={34} /><h2 id="privacy-controls-title" className="text-2xl font-black">プライバシーとデータ</h2></div>
        <button data-gamepad-back data-gamepad-initial-choice onClick={onClose} className="rounded-lg border border-slate-600 p-2" aria-label="閉じる"><X size={18} /></button>
      </header>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4"><small className="text-slate-400">年齢区分</small><strong className="mt-1 block text-lg">{settings.ageBand ? ageLabel[settings.ageBand] : '未設定'}</strong></article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4"><small className="text-slate-400">教員・保護者向け学習集計</small><strong className="mt-1 block text-lg">{managementProfile ? `連携中（${settings.learningAggregationAuthority === 'guardian' ? '保護者' : '学校'}）` : '未連携'}</strong></article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4"><small className="text-slate-400">匿名ランキング</small><strong className="mt-1 block text-lg">{onlineProfile ? `参加中: ${onlineProfile.displayName}` : '未参加'}</strong></article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4"><small className="text-slate-400">9〜12歳のランキング許可</small><strong className="mt-1 block text-lg">{settings.rankingConsentVerifiedAt ? '保護者確認済み' : '未確認・投稿停止'}</strong></article>
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4"><small className="text-slate-400">協力・レース通信</small><strong className="mt-1 block text-lg">年齢に関係なく利用可能</strong></article>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {settings.ageBand === '9_12' && onlineProfile && !settings.rankingConsentVerifiedAt && managementProfile && (
          <button disabled={busy} onClick={() => void verifyRankingConsent()} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400 bg-cyan-950 px-4 py-3 font-black text-cyan-100">
            <ShieldCheck size={17} />保護者許可を確認
          </button>
        )}
        {managementProfile && <button disabled={busy} onClick={() => void unlink()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-500 bg-slate-800 px-4 py-3 font-black"><Unlink size={17} />端末連携を解除</button>}
        {managementProfile && settings.learningAggregationAuthorizedAt && <button disabled={busy} onClick={() => void revokeLearningConsent()} className="flex items-center justify-center gap-2 rounded-xl border border-amber-500 bg-amber-950 px-4 py-3 font-black text-amber-100"><ShieldCheck size={17} />学習集計の許可を取り消す</button>}
        {managementProfile && <button disabled={busy} onClick={() => void requestLearningDeletion()} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-950 px-4 py-3 font-black text-rose-100"><Trash2 size={17} />学習集計データを削除申請</button>}
        {onlineProfile && <button disabled={busy} onClick={() => void deleteRanking()} className="flex items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-950 px-4 py-3 font-black text-rose-100"><Trash2 size={17} />ランキングデータを削除</button>}
        <button disabled={busy} onClick={clearLocal} className="flex items-center justify-center gap-2 rounded-xl border border-rose-700 bg-slate-900 px-4 py-3 font-black text-rose-200"><Trash2 size={17} />この端末の全データを削除</button>
      </div>
      {message && <p className="mt-4 rounded-xl border border-cyan-800 bg-cyan-950/40 p-3 text-sm font-bold text-cyan-100">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-cyan-300">
        <a href="./privacy.html" target="_blank" rel="noreferrer" className="flex items-center gap-1">プライバシーポリシー <ExternalLink size={13} /></a>
        <a href="./delete-data.html" target="_blank" rel="noreferrer" className="flex items-center gap-1">データ削除方法 <ExternalLink size={13} /></a>
      </div>
    </section>
  </div>;
}
