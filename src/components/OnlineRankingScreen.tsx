import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Globe2, RefreshCw, ShieldCheck, Trophy } from 'lucide-react';
import { LanguageMode } from '../types';
import { onlineRankingService, OnlineLeaderboardEntry, OnlinePeriodType, OnlineRankingDefinition } from '../services/onlineRankingService';
import { trans } from '../utils/textUtils';

interface Props { onBack: () => void; onLocal: () => void; onRequestName: () => void; languageMode: LanguageMode; }

const fallbackRankings: OnlineRankingDefinition[] = [
  { id: 'learning_correct', label: '今週の正解王', unit: '問', accent: 'cyan', description: '期間内に正解した問題数' },
  { id: 'learning_accuracy', label: '正答率マスター', unit: '%', accent: 'green', description: '10問以上に挑戦したときの正答率' },
  { id: 'learning_retry', label: '苦手克服王', unit: '問', accent: 'violet', description: '間違えた後に正解できた問題数' },
  { id: 'assignment_complete', label: '課題達成王', unit: '件', accent: 'amber', description: '達成した課題数' },
  { id: 'adventure_score', label: '冒険王', unit: 'pt', accent: 'rose', description: '1人での冒険の最高スコア' },
  { id: 'coop_adventure_score', label: '協力プレイ冒険', unit: 'pt', accent: 'lime', description: '登録済みの仲間と協力して記録したチーム最高スコア', scope: 'team' },
  { id: 'card_standard_power', label: '課題カード最強王', unit: '威力', accent: 'lime', description: '標準条件の最大威力' },
  { id: 'card_efficiency', label: 'カードコスパ王', unit: '威力/EN', accent: 'orange', description: 'エナジー1あたりの最大標準威力' },
  { id: 'card_collection', label: 'カードコレクター', unit: '種', accent: 'blue', description: 'カードの収集数' },
  { id: 'card_collection_rate', label: 'カード収集率王', unit: '%', accent: 'teal', description: '通常カード全体に対する収集率' },
  { id: 'card_actual_damage', label: '実戦最大一撃王', unit: 'ダメージ', accent: 'red', description: '実戦で記録した1回の最大ダメージ' },
  { id: 'poker_best_hand', label: '放課後ポーカー', unit: '点', accent: 'gold', description: '放課後ポーカーの最高ハンド得点' },
  { id: 'survivor_score', label: '校庭サバイバー', unit: 'pt', accent: 'magenta', description: '校庭サバイバーの最高スコア' },
  { id: 'dungeon_score', label: '風来の小学生', unit: 'pt', accent: 'indigo', description: '風来の小学生の最高スコア' },
  { id: 'dungeon2_score', label: '風来の小学生2', unit: 'pt', accent: 'navy', description: '風来の小学生2の最高スコア' },
  { id: 'kocho_score', label: '校長対決', unit: 'pt', accent: 'purple', description: '校長対決・エンドレスの最高到達スコア' },
  { id: 'paper_plane_score', label: '紙飛行機バトル', unit: 'pt', accent: 'sky', description: '紙飛行機バトルの最高スコア' },
  { id: 'go_home_score', label: '帰宅ダッシュ', unit: 'pt', accent: 'yellow', description: '帰宅ダッシュの最高スコア' },
  { id: 'growth_clear_count', label: '冒険踏破王', unit: '回', accent: 'emerald', description: '学習ローグの累計クリア回数' },
  { id: 'growth_mastered_modes', label: '学びの達人王', unit: '分野', accent: 'mint', description: 'マスターした学習分野の数' },
];

const OnlineRankingScreen: React.FC<Props> = ({ onBack, onLocal, onRequestName, languageMode }) => {
  const [rankingId, setRankingId] = useState(fallbackRankings[0].id);
  const [periodType, setPeriodType] = useState<OnlinePeriodType>('weekly');
  const [rankings, setRankings] = useState(fallbackRankings);
  const [entries, setEntries] = useState<OnlineLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(() => onlineRankingService.getPendingSubmissionCount());
  const profile = onlineRankingService.getProfile();

  const load = async (sync = false) => {
    setLoading(true); setError('');
    try {
      if (sync && profile) await onlineRankingService.syncCurrentSnapshots();
      const data = await onlineRankingService.getLeaderboard(rankingId, periodType);
      setEntries(data.entries); setRankings(data.rankings);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('オンラインランキングを読み込めませんでした。', languageMode));
    } finally { setPendingCount(onlineRankingService.getPendingSubmissionCount()); setLoading(false); }
  };

  useEffect(() => { void load(Boolean(profile)); }, [rankingId, periodType]);
  const active = rankings.find((ranking) => ranking.id === rankingId) || rankings[0];

  return <div className="flex h-full w-full flex-col bg-slate-950 text-white">
    <header className="flex shrink-0 flex-col gap-3 border-b-2 border-lime-400/40 bg-black p-4 md:flex-row md:items-center">
      <div className="flex items-center gap-2"><Globe2 className="text-lime-300" /><div><div className="text-[10px] font-black tracking-[.25em] text-lime-300">ONLINE</div><h2 className="text-xl font-black">{trans('オンラインランキング', languageMode)}</h2></div></div>
      <div className="flex flex-1 gap-2 overflow-x-auto md:justify-center">{rankings.map((ranking) => <button key={ranking.id} onClick={() => { setRankingId(ranking.id); if (ranking.id.startsWith('growth_')) setPeriodType('all'); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black ${rankingId === ranking.id ? 'bg-lime-300 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{trans(ranking.label, languageMode)}</button>)}</div>
      <div className="flex gap-2">{profile && <button onClick={onRequestName} className="rounded-lg border border-cyan-600 bg-cyan-950 px-3 py-2 text-xs font-black text-cyan-100">{trans('端末連携', languageMode)}</button>}<button onClick={onLocal} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-black">{trans('端末記録', languageMode)}</button><button onClick={onBack} className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-black"><ArrowLeft size={15} />{trans('戻る', languageMode)}</button></div>
    </header>

    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
      <div className="flex gap-1">{(['daily','weekly','monthly','season','all'] as OnlinePeriodType[]).map((period) => <button key={period} disabled={rankingId.startsWith('growth_') && period !== 'all'} onClick={() => setPeriodType(period)} className={`rounded-full px-3 py-1.5 text-xs font-black disabled:opacity-30 ${periodType === period ? 'bg-cyan-300 text-slate-950' : 'text-slate-400'}`}>{trans(period === 'daily' ? '今日' : period === 'weekly' ? '今週' : period === 'monthly' ? '今月' : period === 'season' ? 'シーズン' : '歴代', languageMode)}</button>)}</div>
      <button onClick={() => void load(true)} disabled={loading} className="flex items-center gap-1 rounded-lg border border-cyan-600/50 px-3 py-2 text-xs font-black text-cyan-200"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />{trans('同期', languageMode)}</button>
    </div>

    <main className="flex-grow overflow-y-auto p-4 custom-scrollbar">
      {!profile && <section className="mx-auto mb-4 max-w-4xl rounded-xl border-2 border-amber-400 bg-amber-950/50 p-5 text-center"><ShieldCheck className="mx-auto mb-2 text-amber-300" /><h3 className="font-black">{trans('公開名を決めるとランキングに参加できます', languageMode)}</h3><p className="my-2 text-xs text-amber-100/70">{trans('閲覧だけなら今すぐ利用できます。', languageMode)}</p><button onClick={onRequestName} className="rounded-lg bg-amber-300 px-5 py-2 font-black text-slate-950">{trans('公開名を決める', languageMode)}</button></section>}
      <section className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-end justify-between"><div><div className="text-xs font-black tracking-widest text-cyan-300">{trans(active?.description || '', languageMode)}</div><h3 className="mt-1 text-2xl font-black">{trans(active?.label || '', languageMode)}</h3></div>{profile && <div className="text-right text-xs text-slate-400">{trans('参加名', languageMode)}<strong className="ml-2 text-white">{profile.displayName}</strong> #{profile.publicCode}</div>}</div>
        {error ? <div className="rounded-xl border border-red-500 bg-red-950/50 p-6 text-center text-sm font-bold">{error}</div> : loading ? <div className="p-16 text-center font-black text-cyan-200">{trans('集計中…', languageMode)}</div> : entries.length === 0 ? <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900 p-16 text-center"><Trophy className="mx-auto mb-3 text-slate-600" size={44}/><h4 className="font-black">{trans('まだ記録がありません', languageMode)}</h4><p className="mt-2 text-xs text-slate-500">{trans('最初のランカーを待っています。', languageMode)}</p></div> : <div className="space-y-2">{entries.map((entry) => { const isTeam = active?.scope === 'team'; const isMine = isTeam ? entry.memberPublicCodes?.includes(profile?.publicCode || '') : entry.playerId === profile?.id; return <article key={entry.entryId || entry.playerId || entry.teamId} className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border p-4 ${isMine ? 'border-lime-400 bg-lime-950/40' : entry.rank <= 3 ? 'border-amber-500/60 bg-amber-950/30' : 'border-slate-700 bg-slate-900'}`}><div className="text-center text-xl font-black">{entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}</div><div><small className="mb-1 block text-[10px] font-black text-lime-300">{isTeam ? `TEAM・${entry.memberNames?.length || 0}人` : String(entry.currentTitle || entry.metadata?.title || '駆け出しの冒険者')}</small><strong className="block">{entry.displayName}</strong><small className="text-slate-500">{isTeam ? entry.memberPublicCodes?.map((code) => `#${code}`).join(' ・ ') : `#${entry.publicCode}`}</small></div><div className="font-mono text-xl font-black text-cyan-200">{entry.score.toLocaleString()} <small className="text-xs text-slate-400">{active?.unit}</small></div></article>; })}</div>}
      </section>
    </main>
    <footer className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-black px-4 py-2 text-[10px] text-slate-500"><span>{pendingCount > 0 ? `${trans('未送信記録', languageMode)} ${pendingCount}・${trans('オンライン復帰時に自動送信', languageMode)}` : trans('本名・学校情報・回答内容は送信しません', languageMode)}</span><a href={onlineRankingService.getPublicUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-300">{trans('Web版を見る', languageMode)}<ExternalLink size={11}/></a></footer>
  </div>;
};

export default OnlineRankingScreen;
