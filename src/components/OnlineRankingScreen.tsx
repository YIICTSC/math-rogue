import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Globe2, RefreshCw, ShieldCheck, Trophy } from 'lucide-react';
import { LanguageMode } from '../types';
import { onlineRankingService, OnlineLeaderboardEntry, OnlinePeriodType, OnlineRankingDefinition } from '../services/onlineRankingService';
import { trans } from '../utils/textUtils';
import { getOnlineRankingCategory, ONLINE_RANKING_CATEGORIES, ONLINE_RANKING_FALLBACKS } from '../data/onlineRankingDefinitions';

interface Props { onBack: () => void; onLocal: () => void; onRequestName: () => void; onRequestNameChange: () => void; languageMode: LanguageMode; }

const OnlineRankingScreen: React.FC<Props> = ({ onBack, onLocal, onRequestName, onRequestNameChange, languageMode }) => {
  const [rankingId, setRankingId] = useState(ONLINE_RANKING_FALLBACKS[0].id);
  const [periodType, setPeriodType] = useState<OnlinePeriodType>('weekly');
  const [rankings, setRankings] = useState<OnlineRankingDefinition[]>(ONLINE_RANKING_FALLBACKS);
  const [entries, setEntries] = useState<OnlineLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(() => onlineRankingService.getPendingSubmissionCount());
  const profile = onlineRankingService.getProfile();
  const t = (text: string) => trans(text, languageMode);
  const formatTeamCount = (count: number) => languageMode === 'ENGLISH'
    ? `TEAM · ${count} ${count === 1 ? 'member' : 'members'}`
    : languageMode === 'HIRAGANA'
      ? `チーム・${count}にん`
      : `TEAM・${count}人`;

  const load = async (sync = false) => {
    setLoading(true); setError('');
    try {
      if (sync && profile) {
        try { await onlineRankingService.syncCurrentSnapshots(); }
        catch (reason) { console.warn('Online ranking snapshot sync failed', reason); }
      }
      const data = await onlineRankingService.getLeaderboard(rankingId, periodType);
      setEntries(data.entries); setRankings(data.rankings);
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : 'オンラインランキングを読み込めませんでした。'));
    } finally { setPendingCount(onlineRankingService.getPendingSubmissionCount()); setLoading(false); }
  };

  useEffect(() => { void load(Boolean(profile)); }, [rankingId, periodType]);
  const active = rankings.find((ranking) => ranking.id === rankingId) || rankings[0];
  const activeCategory = getOnlineRankingCategory(rankingId);
  const categoryRankings = activeCategory.rankingIds
    .map((id) => rankings.find((ranking) => ranking.id === id))
    .filter((ranking): ranking is OnlineRankingDefinition => !!ranking);

  const selectRanking = (nextRankingId: string) => {
    setRankingId(nextRankingId);
    if (nextRankingId.startsWith('growth_')) setPeriodType('all');
  };

  const selectCategory = (categoryId: string) => {
    const category = ONLINE_RANKING_CATEGORIES.find((item) => item.id === categoryId);
    const firstAvailable = category?.rankingIds.find((id) => rankings.some((ranking) => ranking.id === id));
    if (firstAvailable) selectRanking(firstAvailable);
  };

  return <div className="flex h-full w-full flex-col bg-slate-950 text-white">
    <header className="shrink-0 border-b-2 border-lime-400/40 bg-black">
      <div className="flex flex-col items-stretch gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2"><Globe2 className="shrink-0 text-lime-300" /><div className="min-w-0"><div className="text-[9px] font-black tracking-[.25em] text-lime-300">ONLINE</div><h2 className="truncate text-base font-black sm:text-xl">{trans('オンラインランキング', languageMode)}</h2></div></div>
        <div className="flex flex-wrap justify-end gap-1.5 sm:ml-auto sm:shrink-0 sm:flex-nowrap sm:gap-2">{profile && <><button onClick={onRequestNameChange} className="rounded-lg border border-lime-500 bg-lime-950 px-2 py-2 text-[10px] font-black text-lime-100 sm:px-3 sm:text-xs">{trans('公開名を変更', languageMode)}</button><button onClick={onRequestName} className="rounded-lg border border-cyan-600 bg-cyan-950 px-2 py-2 text-[10px] font-black text-cyan-100 sm:px-3 sm:text-xs">{trans('端末連携', languageMode)}</button></>}<button onClick={onLocal} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-[10px] font-black sm:px-3 sm:text-xs">{trans('端末記録', languageMode)}</button><button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-[10px] font-black sm:px-3 sm:text-xs"><ArrowLeft size={15} />{trans('戻る', languageMode)}</button></div>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-slate-800 px-3 py-2 custom-scrollbar sm:px-4" aria-label={trans('ランキングカテゴリ', languageMode)}>
        {ONLINE_RANKING_CATEGORIES.map((category) => <button key={category.id} onClick={() => selectCategory(category.id)} className={`min-w-[116px] rounded-xl border px-3 py-2 text-left transition-colors ${activeCategory.id === category.id ? 'border-lime-300 bg-lime-300 text-slate-950' : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'}`}><small className={`block text-[8px] font-black tracking-[.18em] ${activeCategory.id === category.id ? 'text-slate-700' : 'text-slate-500'}`}>{category.caption}</small><strong className="mt-0.5 block whitespace-nowrap text-xs">{trans(category.label, languageMode)}</strong></button>)}
      </nav>
    </header>

    <nav className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-700 bg-slate-900 px-3 py-2 custom-scrollbar sm:px-4" aria-label={trans('詳細ランキング', languageMode)}>
      <span className="shrink-0 text-[9px] font-black tracking-widest text-slate-500">DETAIL</span>
      {categoryRankings.map((ranking) => <button key={ranking.id} onClick={() => selectRanking(ranking.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black ${rankingId === ranking.id ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{trans(ranking.label, languageMode)}</button>)}
    </nav>

    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
      <div className="flex gap-1">{(['daily','weekly','monthly','season','all'] as OnlinePeriodType[]).map((period) => <button key={period} disabled={rankingId.startsWith('growth_') && period !== 'all'} onClick={() => setPeriodType(period)} className={`rounded-full px-3 py-1.5 text-xs font-black disabled:opacity-30 ${periodType === period ? 'bg-cyan-300 text-slate-950' : 'text-slate-400'}`}>{trans(period === 'daily' ? '今日' : period === 'weekly' ? '今週' : period === 'monthly' ? '今月' : period === 'season' ? 'シーズン' : '歴代', languageMode)}</button>)}</div>
      <button onClick={() => void load(true)} disabled={loading} className="flex items-center gap-1 rounded-lg border border-cyan-600/50 px-3 py-2 text-xs font-black text-cyan-200"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{trans('同期', languageMode)}</button>
    </div>

    <main className="flex-grow overflow-y-auto p-4 custom-scrollbar">
      {!profile && <section className="mx-auto mb-4 max-w-4xl rounded-xl border-2 border-amber-400 bg-amber-950/50 p-5 text-center"><ShieldCheck className="mx-auto mb-2 text-amber-300" /><h3 className="font-black">{trans('公開名を決めるとランキングに参加できます', languageMode)}</h3><p className="my-2 text-xs text-amber-100/70">{trans('閲覧だけなら今すぐ利用できます。', languageMode)}</p><button onClick={onRequestName} className="rounded-lg bg-amber-300 px-5 py-2 font-black text-slate-950">{trans('公開名を決める', languageMode)}</button></section>}
      <section className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-end justify-between"><div><div className="text-xs font-black tracking-widest text-cyan-300">{trans(active?.description || '', languageMode)}</div><h3 className="mt-1 text-2xl font-black">{trans(active?.label || '', languageMode)}</h3></div>{profile && <div className="text-right text-xs text-slate-400">{trans('参加名', languageMode)}<strong className="ml-2 text-white">{profile.displayName}</strong> #{profile.publicCode}</div>}</div>
        <div className="mb-4 rounded-xl border border-cyan-800/70 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-50"><strong className="mr-2 text-cyan-300">{trans('計算方法', languageMode)}</strong>{trans(active?.calculation || active?.description || '', languageMode)}</div>
        {error ? <div className="rounded-xl border border-red-500 bg-red-950/50 p-6 text-center text-sm font-bold">{error}</div> : loading ? <div className="p-16 text-center font-black text-cyan-200">{trans('集計中…', languageMode)}</div> : entries.length === 0 ? <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900 p-16 text-center"><Trophy className="mx-auto mb-3 text-slate-600" size={44}/><h4 className="font-black">{trans('まだ記録がありません', languageMode)}</h4><p className="mt-2 text-xs text-slate-500">{trans('最初のランカーを待っています。', languageMode)}</p></div> : <div className="space-y-2">{entries.map((entry) => { const isTeam = active?.scope === 'team'; const isMine = isTeam ? entry.memberPublicCodes?.includes(profile?.publicCode || '') : entry.playerId === profile?.id; return <article key={entry.entryId || entry.playerId || entry.teamId} className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border p-4 ${isMine ? 'border-lime-400 bg-lime-950/40' : entry.rank <= 3 ? 'border-amber-500/60 bg-amber-950/30' : 'border-slate-700 bg-slate-900'}`}><div className="text-center text-xl font-black">{entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}</div><div><small className="mb-1 block text-[10px] font-black text-lime-300">{isTeam ? formatTeamCount(entry.memberNames?.length || 0) : t(String(entry.currentTitle || entry.metadata?.title || '駆け出しの冒険者'))}</small><strong className="block" data-allow-japanese>{entry.displayName}</strong><small className="text-slate-500">{isTeam ? entry.memberPublicCodes?.map((code) => `#${code}`).join(' ・ ') : `#${entry.publicCode}`}</small></div><div className="font-mono text-xl font-black text-cyan-200">{entry.score.toLocaleString()} <small className="text-xs text-slate-400">{t(active?.unit || '')}</small></div></article>; })}</div>}
      </section>
    </main>
    <footer className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-black px-4 py-2 text-[10px] text-slate-500"><span>{pendingCount > 0 ? `${trans('未送信記録', languageMode)} ${pendingCount}・${trans('オンライン復帰時に自動送信', languageMode)}` : trans('本名・学校情報・回答内容は送信しません', languageMode)}</span><a href={onlineRankingService.getPublicUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-300">{trans('Web版を見る', languageMode)}<ExternalLink size={11}/></a></footer>
  </div>;
};

export default OnlineRankingScreen;
