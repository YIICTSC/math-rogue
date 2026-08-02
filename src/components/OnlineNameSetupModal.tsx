import React, { useEffect, useState } from 'react';
import { Check, Dice5, Globe2, Link2, ShieldCheck, Smartphone, X } from 'lucide-react';
import { LanguageMode } from '../types';
import { onlineRankingService, OnlineRankingProfile } from '../services/onlineRankingService';
import { trans } from '../utils/textUtils';

interface Props {
  open: boolean;
  languageMode: LanguageMode;
  onClose: () => void;
  onRegistered: (profile: OnlineRankingProfile) => void;
  profile?: OnlineRankingProfile | null;
  initialMode?: 'manage' | 'rename';
  onDecline?: () => void;
}

const OnlineNameSetupModal: React.FC<Props> = ({ open, languageMode, onClose, onRegistered, profile, initialMode = 'manage', onDecline }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'register' | 'redeem' | 'rename'>('register');
  const [transferCode, setTransferCode] = useState('');
  const [issuedCode, setIssuedCode] = useState('');

  const loadSuggestions = async (selectFirst = true) => {
    setError('');
    try {
      const next = await onlineRankingService.getSuggestions();
      setSuggestions(next);
      if (selectFirst && !name && next[0]) setName(next[0]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('オンラインランキングは準備中です。', languageMode));
    }
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setIssuedCode('');
    if (profile && initialMode === 'rename') {
      setName(profile.displayName);
      setMode('rename');
      void loadSuggestions(false);
    } else {
      setMode('register');
      if (!profile) void loadSuggestions();
    }
  }, [open, profile, initialMode]);
  if (!open) return null;

  const issueLinkCode = async () => {
    setLoading(true); setError('');
    try { setIssuedCode((await onlineRankingService.createDeviceLinkCode()).code); }
    catch (reason) { setError(reason instanceof Error ? reason.message : trans('連携コードを発行できませんでした。', languageMode)); }
    finally { setLoading(false); }
  };

  const redeemLinkCode = async () => {
    setLoading(true); setError('');
    try { onRegistered(await onlineRankingService.redeemDeviceLinkCode(transferCode)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : trans('端末連携を完了できませんでした。', languageMode)); }
    finally { setLoading(false); }
  };

  const startRename = () => {
    setName(profile?.displayName || '');
    setError('');
    setMode('rename');
    void loadSuggestions(false);
  };

  const submitRename = async () => {
    if (!name.trim() || name.trim() === profile?.displayName) return;
    setLoading(true);
    setError('');
    try {
      onRegistered(await onlineRankingService.updateDisplayName(name.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('公開名を変更できませんでした。', languageMode));
    } finally { setLoading(false); }
  };

  if (profile && mode !== 'rename') return <div className="fixed inset-0 z-[10036] flex items-center justify-center bg-black/85 p-2 sm:p-4" data-gamepad-modal data-gamepad-initial-scope="online-profile-manage">
    <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border-4 border-cyan-300 bg-slate-950 p-4 text-center text-white shadow-[0_0_45px_rgba(34,211,238,0.25)] sm:max-h-[calc(100dvh-2rem)] sm:p-6" data-gamepad-navigation-root>
      <button onClick={onClose} className="absolute right-3 top-3 rounded-lg border border-slate-600 bg-slate-900 p-2 text-slate-300" aria-label={trans('閉じる', languageMode)}><X size={18} /></button>
      <Smartphone className="mx-auto mb-3 text-cyan-300" size={38} /><div className="text-xs font-black tracking-[.25em] text-cyan-300">DEVICE LINK</div><h2 className="my-3 text-2xl font-black">{trans('別の端末と連携する', languageMode)}</h2>
      <p className="mb-5 text-sm font-bold leading-6 text-slate-300">{trans('新しい端末の「コードで引き継ぐ」に入力する、10分間・1回限りのコードを発行します。', languageMode)}</p>
      <button data-gamepad-initial-choice onClick={startRename} className="mb-3 w-full rounded-xl border-2 border-lime-400 bg-lime-950/50 px-4 py-3 font-black text-lime-100">{trans('公開名を変更', languageMode)}</button>
      {issuedCode ? <div className="mb-5 rounded-xl border-2 border-lime-300 bg-lime-950/50 p-5"><small className="font-black text-lime-200">TRANSFER CODE</small><div className="mt-2 font-mono text-4xl font-black tracking-[.14em] text-white">{issuedCode}</div><p className="mt-3 text-xs text-lime-100/70">{trans('このコードを公開したり、他人へ渡したりしないでください。', languageMode)}</p></div> : <button onClick={() => void issueLinkCode()} disabled={loading} className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40"><Link2 size={18} />{loading ? trans('発行中…', languageMode) : trans('連携コードを発行', languageMode)}</button>}
      {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950/60 p-3 text-xs font-bold text-red-100">{error}</div>}
      <button onClick={onClose} className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-black">{trans('閉じる', languageMode)}</button>
    </div>
  </div>;

  if (profile && mode === 'rename') return <div className="fixed inset-0 z-[10036] flex items-center justify-center bg-black/85 p-2 sm:p-4" data-gamepad-modal data-gamepad-initial-scope="online-profile-rename">
    <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-4 border-lime-300 bg-slate-950 p-4 text-white sm:max-h-[calc(100dvh-2rem)] sm:p-6" data-gamepad-navigation-root>
      <button onClick={() => setMode('register')} className="absolute right-3 top-3 rounded-lg border border-slate-600 bg-slate-900 p-2 text-slate-300" aria-label={trans('閉じる', languageMode)}><X size={18} /></button>
      <div className="text-center text-xs font-black tracking-[.25em] text-lime-300">ONLINE RANKING</div>
      <h2 className="mb-2 mt-3 text-center text-2xl font-black">{trans('公開名を変更', languageMode)}</h2>
      <p className="mb-5 text-center text-sm font-bold text-slate-300">{trans('新しい公開名は、過去のランキング記録にも反映されます。', languageMode)}</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {suggestions.map((suggestion) => <button key={suggestion} onClick={() => setName(suggestion)} className={`min-w-0 break-words rounded-xl border px-2 py-3 text-xs font-black ${name === suggestion ? 'border-lime-300 bg-lime-300 text-slate-950' : 'border-slate-600 bg-slate-900 text-slate-100'}`}>{suggestion}</button>)}
      </div>
      <button onClick={() => void loadSuggestions()} className="mx-auto mb-4 flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-950/60 px-4 py-2 text-xs font-black text-cyan-100"><Dice5 size={15} />{trans('ほかの候補を見る', languageMode)}</button>
      <label className="mb-4 block text-xs font-black text-slate-300">{trans('自由入力', languageMode)}
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} className="mt-2 w-full rounded-xl border-2 border-slate-600 bg-black px-4 py-3 text-lg font-black text-white outline-none focus:border-lime-300" placeholder={trans('2～16文字', languageMode)} />
      </label>
      {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950/60 p-3 text-center text-xs font-bold text-red-100">{error}</div>}
      <div className="grid grid-cols-2 gap-2">
        <button data-gamepad-initial-choice onClick={() => setMode('register')} className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-black">{trans('戻る', languageMode)}</button>
        <button onClick={() => void submitRename()} disabled={!name.trim() || name.trim() === profile.displayName || loading} className="rounded-xl bg-lime-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40">{loading ? trans('変更中…', languageMode) : trans('この名前に変更', languageMode)}</button>
      </div>
    </div>
  </div>;

  if (mode === 'redeem') return <div className="fixed inset-0 z-[10036] flex items-center justify-center bg-black/85 p-2 sm:p-4" data-gamepad-modal data-gamepad-initial-scope="online-profile-redeem">
    <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border-4 border-cyan-300 bg-slate-950 p-4 text-white sm:max-h-[calc(100dvh-2rem)] sm:p-6" data-gamepad-navigation-root>
      <button onClick={onClose} className="absolute right-3 top-3 rounded-lg border border-slate-600 bg-slate-900 p-2 text-slate-300" aria-label={trans('あとで決める', languageMode)}><X size={18} /></button>
      <div className="text-center text-xs font-black tracking-[.25em] text-cyan-300">DEVICE LINK</div><h2 className="my-3 text-center text-2xl font-black">{trans('コードで引き継ぐ', languageMode)}</h2><p className="mb-5 text-center text-sm font-bold leading-6 text-slate-300">{trans('すでに参加している端末で発行した8文字のコードを入力してください。', languageMode)}</p>
      <input value={transferCode} onChange={(event) => setTransferCode(event.target.value.toUpperCase())} maxLength={9} autoCapitalize="characters" className="mb-4 w-full rounded-xl border-2 border-cyan-500 bg-black px-4 py-4 text-center font-mono text-3xl font-black uppercase tracking-[.12em] text-white" placeholder="ABCD-EFGH" />
      {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950/60 p-3 text-center text-xs font-bold text-red-100">{error}</div>}
      <div className="flex gap-2"><button data-gamepad-initial-choice onClick={() => setMode('register')} className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-black">{trans('新しく参加', languageMode)}</button><button onClick={() => void redeemLinkCode()} disabled={transferCode.replace(/[^A-Z0-9]/g, '').length !== 8 || loading} className="flex-[1.4] rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40">{loading ? trans('連携中…', languageMode) : trans('この端末へ引き継ぐ', languageMode)}</button></div>
    </div>
  </div>;

  const submit = async () => {
    if (!accepted || !name.trim()) return;
    setLoading(true);
    setError('');
    try {
      onRegistered(await onlineRankingService.register(name.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('公開名を登録できませんでした。', languageMode));
    } finally { setLoading(false); }
  };

  return <div className="fixed inset-0 z-[10036] flex items-center justify-center bg-black/85 p-2 sm:p-4" data-gamepad-modal data-gamepad-initial-scope="online-profile-register">
    <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-4 border-lime-300 bg-slate-950 p-3 text-white shadow-[0_0_45px_rgba(190,242,100,0.28)] sm:max-h-[calc(100dvh-2rem)] sm:p-5" data-gamepad-navigation-root>
      <button onClick={onClose} className="absolute right-2 top-2 rounded-lg border border-slate-600 bg-slate-900 p-1.5 text-slate-300 hover:text-white sm:right-3 sm:top-3 sm:p-2" aria-label={trans('あとで決める', languageMode)}><X size={18} /></button>
      <div className="mb-1 pr-9 text-center text-[10px] font-black tracking-[0.24em] text-lime-300 sm:mb-2 sm:pr-0 sm:text-xs sm:tracking-[0.3em]">ONLINE RANKING</div>
      <h2 className="mb-1 pr-9 text-center text-lg font-black leading-tight sm:mb-2 sm:pr-0 sm:text-2xl">{trans('ランキング用の公開名を決めよう', languageMode)}</h2>
      <p className="mx-auto mb-3 max-w-lg text-center text-xs font-bold leading-5 text-slate-300 sm:mb-5 sm:text-sm sm:leading-6">{trans('本名や学校名は使わず、ランキングでみんなに見せる名前を選んでください。あとからでも設定できます。', languageMode)}</p>
      <button data-gamepad-initial-choice onClick={() => setMode('redeem')} className="mx-auto mb-3 flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-950/60 px-3 py-2 text-[11px] font-black text-cyan-100 sm:mb-5 sm:px-4 sm:text-xs"><Smartphone size={15} />{trans('別の端末からコードで引き継ぐ', languageMode)}</button>

      <div className="mb-2 grid grid-cols-3 gap-1.5 sm:mb-4 sm:gap-2">
        {suggestions.map((suggestion) => <button key={suggestion} onClick={() => setName(suggestion)} className={`min-w-0 break-words rounded-lg border px-1.5 py-2 text-[11px] font-black leading-tight sm:rounded-xl sm:px-3 sm:py-3 sm:text-sm ${name === suggestion ? 'border-lime-300 bg-lime-300 text-slate-950' : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-lime-500'}`}>{suggestion}</button>)}
      </div>
      <button onClick={() => void loadSuggestions()} className="mx-auto mb-3 flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-cyan-950/60 px-3 py-1.5 text-[11px] font-black text-cyan-100 sm:mb-5 sm:px-4 sm:py-2 sm:text-xs"><Dice5 size={15} />{trans('ほかの候補を見る', languageMode)}</button>

      <label className="mb-3 block text-[11px] font-black text-slate-300 sm:mb-4 sm:text-xs">{trans('自由入力', languageMode)}
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} className="mt-1.5 w-full rounded-xl border-2 border-slate-600 bg-black px-3 py-2.5 text-base font-black text-white outline-none focus:border-lime-300 sm:mt-2 sm:px-4 sm:py-3 sm:text-lg" placeholder={trans('2～16文字', languageMode)} />
      </label>

      <label className="mb-3 flex cursor-pointer items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-[10px] font-bold leading-4 text-slate-300 sm:mb-4 sm:gap-3 sm:p-3 sm:text-xs sm:leading-5">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-lime-400" />
        <span><ShieldCheck size={16} className="mr-1 inline text-lime-300" />{trans('公開名と集計済みの記録をオンラインランキングに送信します。本名・学年・組・番号・問題文・回答内容は送信しません。', languageMode)}</span>
      </label>

      {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950/60 p-3 text-center text-xs font-bold text-red-100">{error}</div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <button onClick={onClose} className="min-w-0 rounded-xl border border-slate-600 bg-slate-800 px-2 py-2.5 text-sm font-black text-slate-200 sm:px-4 sm:py-3 sm:text-base">{trans('あとで決める', languageMode)}</button>
        <button onClick={() => void submit()} disabled={!accepted || !name.trim() || loading} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-lime-300 px-2 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:py-3 sm:text-base"><Check size={17} />{loading ? trans('登録中…', languageMode) : trans('この名前で参加する', languageMode)}</button>
      </div>
      {onDecline && <button onClick={onDecline} className="mt-2 w-full rounded-xl border border-slate-700 bg-black/40 px-3 py-2.5 text-xs font-black text-slate-400 hover:border-slate-500 hover:text-slate-200">{trans('ランキングに参加しない', languageMode)}</button>}
      <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9px] font-bold leading-4 text-slate-500 sm:mt-4 sm:gap-2 sm:text-[10px]"><Globe2 className="shrink-0" size={12} />{trans('同じ名前のプレイヤーは識別コードで区別されます。', languageMode)}</div>
    </div>
  </div>;
};

export default OnlineNameSetupModal;
