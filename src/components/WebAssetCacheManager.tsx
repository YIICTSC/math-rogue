import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, HardDrive, RefreshCw, ShieldCheck, Trash2, WifiOff } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { VisualThemeId } from '../data/visualThemes';
import { trans } from '../utils/textUtils';
import {
  deleteThemeAssets,
  downloadThemeAssets,
  getThemeCacheStats,
  getWebAssetManifest,
  getWebStorageEstimate,
  isPersistentWebStorage,
  isWebAssetCacheAvailable,
  requestPersistentWebStorage,
  type WebAssetManifest,
  type WebStorageEstimate,
  type WebThemeCacheStats,
  type WebThemeDownloadProgress,
} from '../services/webAssetCacheService';

const THEMES: Array<{ id: VisualThemeId; label: string; description: string }> = [
  { id: 'elementary', label: '小学生編', description: '小学校テーマの画像を保存します。' },
  { id: 'high-school', label: '高校生編', description: '高校テーマの画像を保存します。' },
  { id: 'magic', label: 'マジック編', description: 'マジックテーマの画像を保存します。' },
];

const EMPTY_STATS: WebThemeCacheStats = { cachedFiles: 0, totalFiles: 0, cachedBytes: 0, totalBytes: 0 };

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.ceil(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const percent = (stats: WebThemeCacheStats) => (
  stats.totalBytes > 0 ? Math.floor((stats.cachedBytes / stats.totalBytes) * 100) : 0
);

type Props = {
  languageMode: LanguageMode;
  theme: VisualThemeId;
};

export const WebAssetCacheManager: React.FC<Props> = ({ languageMode, theme }) => {
  const [manifest, setManifest] = useState<WebAssetManifest | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<VisualThemeId>(theme);
  const [stats, setStats] = useState<Record<VisualThemeId, WebThemeCacheStats>>({
    elementary: EMPTY_STATS,
    'high-school': EMPTY_STATS,
    magic: EMPTY_STATS,
  });
  const [progress, setProgress] = useState<WebThemeDownloadProgress | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<WebStorageEstimate | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (nextTheme: VisualThemeId = selectedTheme) => {
    setLoading(true);
    setError(null);
    try {
      const [nextManifest, nextStats, nextEstimate, nextPersistent] = await Promise.all([
        getWebAssetManifest(),
        getThemeCacheStats(nextTheme),
        getWebStorageEstimate(),
        isPersistentWebStorage(),
      ]);
      setManifest(nextManifest);
      setStats(current => ({ ...current, [nextTheme]: nextStats }));
      setStorageEstimate(nextEstimate);
      setPersistent(nextPersistent);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('素材一覧を取得できません', languageMode));
    } finally {
      setLoading(false);
    }
  }, [languageMode, selectedTheme]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    void refresh(selectedTheme);
  }, [refresh, selectedTheme]);

  const selectedThemeInfo = useMemo(
    () => THEMES.find(item => item.id === selectedTheme) || THEMES[0],
    [selectedTheme],
  );
  const selectedStats = stats[selectedTheme];
  const selectedManifest = manifest?.themes[selectedTheme];
  const isDownloading = busy && progress !== null;

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const nextStats = await downloadThemeAssets(selectedTheme, setProgress);
      setStats(current => ({ ...current, [selectedTheme]: nextStats }));
      setStorageEstimate(await getWebStorageEstimate());
      setProgress(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('ダウンロードに失敗しました。', languageMode));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(trans(`${selectedThemeInfo.label}の素材を端末から削除しますか？`, languageMode))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteThemeAssets(selectedTheme);
      setStats(current => ({ ...current, [selectedTheme]: EMPTY_STATS }));
      setStorageEstimate(await getWebStorageEstimate());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : trans('削除に失敗しました。', languageMode));
    } finally {
      setBusy(false);
    }
  };

  const handlePersist = async () => {
    const result = await requestPersistentWebStorage();
    setPersistent(result);
  };

  if (!isWebAssetCacheAvailable()) return null;

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black"><HardDrive size={16} />{trans('オフライン素材', languageMode)}</div>
            <p className="mt-1 text-xs text-slate-300">{trans('Wi-Fi接続時に画像素材を保存すると、次回から画像の読み込みを短縮できます。', languageMode)}</p>
          </div>
          {storageEstimate && storageEstimate.quota > 0 && (
            <div className="shrink-0 text-right text-xs text-cyan-100">
              {formatBytes(storageEstimate.usage)} / {formatBytes(storageEstimate.quota)}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void handlePersist()} disabled={busy} className="rounded border border-emerald-300 bg-emerald-700 px-3 py-1.5 font-bold disabled:opacity-50">
            <span className="flex items-center gap-1"><ShieldCheck size={14} />{trans('保存領域を保護', languageMode)}</span>
          </button>
          <button type="button" onClick={() => void refresh()} disabled={busy || loading} className="rounded border border-slate-400 bg-slate-800 px-3 py-1.5 font-bold disabled:opacity-50">
            <span className="flex items-center gap-1"><RefreshCw size={14} />{trans('再確認', languageMode)}</span>
          </button>
        </div>
        {persistent !== null && (
          <p className="mt-2 text-xs text-slate-300">
            {persistent ? trans('保存領域を保護しています。', languageMode) : trans('保存領域を保護できませんでした。', languageMode)}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded border border-amber-400/50 bg-amber-950/50 p-2 text-xs text-amber-100">
          <div className="flex items-center gap-2 font-bold"><WifiOff size={14} />{error}</div>
          <button type="button" onClick={() => void refresh()} className="mt-2 rounded border border-amber-300/60 px-3 py-1 text-xs">{trans('再試行', languageMode)}</button>
        </div>
      )}

      <div className="rounded-lg border border-slate-700 bg-black/20 p-3">
        <div className="mb-2 font-black text-cyan-100">{trans('テーマを選んで保存', languageMode)}</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEMES.map(item => {
            const itemStats = stats[item.id];
            const itemManifest = manifest?.themes[item.id];
            const selected = selectedTheme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTheme(item.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${selected ? 'border-cyan-300 bg-cyan-950/70' : 'border-slate-600 bg-slate-900/70 hover:border-slate-400'}`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {itemStats.cachedFiles > 0 && itemStats.cachedFiles === itemStats.totalFiles && <CheckCircle2 size={15} className="text-emerald-400" />}
                  {trans(item.label, languageMode)}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{trans(item.description, languageMode)}</p>
                <div className="mt-2 text-[10px] text-cyan-100">
                  {itemStats.totalFiles > 0 ? `${formatBytes(itemStats.cachedBytes)} / ${formatBytes(itemStats.totalBytes)} (${percent(itemStats)}%)` : itemManifest ? formatBytes(itemManifest.totalBytes) : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-sky-500/40 bg-slate-950/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-black text-white">{trans(selectedThemeInfo.label, languageMode)}</div>
            <p className="mt-1 text-xs text-slate-400">{trans('中断後は同じボタンから再開できます。素材はブラウザの専用領域に保存されます。', languageMode)}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-cyan-100">
            {formatBytes(selectedStats.cachedBytes)} / {formatBytes(selectedManifest?.totalBytes || selectedStats.totalBytes)}
          </div>
        </div>
        {isDownloading && progress && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between gap-2 text-xs">
              <span>{trans('ダウンロード中', languageMode)}: {progress.cachedFiles}/{progress.totalFiles}</span>
              <span>{percent(progress)}%</span>
            </div>
            <progress className="h-2 w-full" max={progress.totalBytes} value={progress.cachedBytes} />
            <div className="mt-1 truncate text-[10px] text-slate-400">{progress.activePath || trans('確認中', languageMode)}</div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleDownload()} disabled={busy || loading || !selectedManifest || selectedStats.cachedFiles === selectedStats.totalFiles} className="rounded border border-cyan-300 bg-cyan-700 px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-50">
            <span className="flex items-center gap-1"><Download size={14} />{trans('ダウンロード', languageMode)}</span>
          </button>
          <button type="button" onClick={() => void refresh()} disabled={busy || loading} className="rounded border border-slate-500 bg-slate-800 px-3 py-1.5 font-bold disabled:opacity-50">
            <span className="flex items-center gap-1"><RefreshCw size={14} />{trans('更新', languageMode)}</span>
          </button>
          <button type="button" onClick={() => void handleDelete()} disabled={busy || selectedStats.cachedFiles === 0} className="rounded border border-red-400/60 bg-red-950/50 px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-50">
            <span className="flex items-center gap-1"><Trash2 size={14} />{trans('削除', languageMode)}</span>
          </button>
        </div>
        {loading && <p className="mt-2 text-xs text-slate-400">{trans('確認中', languageMode)}…</p>}
      </div>
    </div>
  );
};
