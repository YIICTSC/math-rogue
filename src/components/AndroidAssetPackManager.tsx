import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, HardDrive, RefreshCw, Trash2, WifiOff, X } from 'lucide-react';
import { LanguageMode } from '../types';
import {
  androidAssetPackService,
  AndroidAssetPackSnapshot,
} from '../services/androidAssetPackService';
import type { AndroidAssetPackId } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';

const EMPTY_SNAPSHOT: AndroidAssetPackSnapshot = {
  available: false,
  manifest: null,
  installed: {},
  downloading: null,
  progress: null,
  error: null,
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.ceil(bytes / 1024 ** 2)} MB`;
};

type ManagerProps = {
  languageMode: LanguageMode;
  compact?: boolean;
};

export const AndroidAssetPackManager: React.FC<ManagerProps> = ({ languageMode, compact = false }) => {
  const [snapshot, setSnapshot] = useState<AndroidAssetPackSnapshot>(EMPTY_SNAPSHOT);
  const [busyAll, setBusyAll] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void androidAssetPackService.getSnapshot().then(setSnapshot);
  }, []);

  useEffect(() => {
    refresh();
    return androidAssetPackService.subscribe(refresh);
  }, [refresh]);

  const packs = useMemo(
    () => snapshot.manifest ? Object.values(snapshot.manifest.packs) : [],
    [snapshot.manifest],
  );
  const missingPackIds = packs.filter(pack => !snapshot.installed[pack.id]).map(pack => pack.id);
  const basicPackIds = (['visual-elementary', 'audio-common'] as AndroidAssetPackId[])
    .filter(packId => !snapshot.installed[packId]);
  const installedBytes = packs
    .filter(pack => snapshot.installed[pack.id])
    .reduce((sum, pack) => sum + pack.totalBytes, 0);
  const totalBytes = packs.reduce((sum, pack) => sum + pack.totalBytes, 0);
  const isBusy = Boolean(snapshot.downloading) || busyAll;

  const downloadPack = async (packId: AndroidAssetPackId) => {
    setLocalError(null);
    try {
      await androidAssetPackService.downloadPack(packId);
      setNeedsReload(true);
      refresh();
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : trans('ダウンロードに失敗しました。', languageMode));
    }
  };

  const downloadPacks = async (packIds: AndroidAssetPackId[]) => {
    setBusyAll(true);
    setLocalError(null);
    try {
      for (const packId of packIds) {
        await androidAssetPackService.downloadPack(packId);
      }
      setNeedsReload(true);
      refresh();
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : trans('ダウンロードに失敗しました。', languageMode));
    } finally {
      setBusyAll(false);
    }
  };

  const deletePack = async (packId: AndroidAssetPackId, label: string) => {
    if (!window.confirm(trans(`${label}を端末から削除しますか？`, languageMode))) return;
    setLocalError(null);
    try {
      await androidAssetPackService.deletePack(packId);
      setNeedsReload(true);
      refresh();
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : trans('削除に失敗しました。', languageMode));
    }
  };

  if (!snapshot.available) return null;

  if (!snapshot.manifest) {
    return (
      <div className="rounded-lg border border-amber-400/50 bg-amber-950/40 p-3 text-sm text-amber-100">
        <div className="flex items-center gap-2 font-bold"><WifiOff size={16} />{trans('素材一覧を取得できません', languageMode)}</div>
        <p className="mt-1 text-xs">{snapshot.error || trans('通信状態を確認して再試行してください。', languageMode)}</p>
        <button type="button" onClick={refresh} className="mt-2 rounded border border-amber-300/60 px-3 py-1 text-xs">
          {trans('再試行', languageMode)}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black"><HardDrive size={16} />{trans('オフライン素材', languageMode)}</div>
            <p className="mt-1 text-xs text-slate-300">
              {trans('Wi-Fi接続時に必要な素材を保存すると、次回から画像・音声を通信なしで利用できます。', languageMode)}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-cyan-100">
            {formatBytes(installedBytes)} / {formatBytes(totalBytes)}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy || basicPackIds.length === 0}
            onClick={() => void downloadPacks(basicPackIds)}
            className="rounded border border-emerald-300 bg-emerald-700 px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-1"><Download size={14} />{trans('おすすめ基本セット', languageMode)}</span>
          </button>
          <button
            type="button"
            disabled={isBusy || missingPackIds.length === 0}
            onClick={() => void downloadPacks(missingPackIds)}
            className="rounded border border-cyan-300 bg-cyan-700 px-3 py-1.5 font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-1"><Download size={14} />{trans('未取得をすべてダウンロード', languageMode)}</span>
          </button>
          {needsReload && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded border border-emerald-300 bg-emerald-700 px-3 py-1.5 font-bold"
            >
              <span className="flex items-center gap-1"><RefreshCw size={14} />{trans('反映して再起動', languageMode)}</span>
            </button>
          )}
        </div>
      </div>

      {(localError || snapshot.error) && (
        <div className="rounded border border-red-400/50 bg-red-950/50 p-2 text-xs text-red-100">
          {localError || snapshot.error}
        </div>
      )}

      {snapshot.progress && (
        <div className="rounded-lg border border-sky-500/40 bg-slate-950/70 p-3">
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span>{trans('ダウンロード中', languageMode)}: {snapshot.progress.completedFiles}/{snapshot.progress.totalFiles}</span>
            <span>{Math.floor((snapshot.progress.completedBytes / Math.max(1, snapshot.progress.totalBytes)) * 100)}%</span>
          </div>
          <progress className="h-2 w-full" max={snapshot.progress.totalBytes} value={snapshot.progress.completedBytes} />
          <div className="mt-1 truncate text-[10px] text-slate-400">
            {formatBytes(snapshot.progress.completedBytes)} / {formatBytes(snapshot.progress.totalBytes)}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {packs.map(pack => {
          const installed = Boolean(snapshot.installed[pack.id]);
          const downloading = snapshot.downloading === pack.id;
          return (
            <div key={pack.id} className="rounded-lg border border-slate-600 bg-slate-900/75 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 font-bold">
                    {installed && <CheckCircle2 size={15} className="text-emerald-400" />}
                    {trans(pack.label, languageMode)}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{trans(pack.description, languageMode)}</p>
                </div>
                <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px]">{formatBytes(pack.totalBytes)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {installed ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void deletePack(pack.id, pack.label)}
                    className="rounded border border-red-400/60 bg-red-950/50 px-2.5 py-1 text-xs disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1"><Trash2 size={12} />{trans('削除', languageMode)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void downloadPack(pack.id)}
                    className="rounded border border-cyan-400/60 bg-cyan-900/60 px-2.5 py-1 text-xs disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1"><Download size={12} />{trans(downloading ? '取得中' : 'ダウンロード', languageMode)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        {trans('中断後は同じボタンから再開できます。素材はアプリ専用領域に保存され、アンインストール時に削除されます。', languageMode)}
      </p>
    </div>
  );
};

type StartupProps = {
  languageMode: LanguageMode;
};

export const AndroidAssetPackStartupModal: React.FC<StartupProps> = ({ languageMode }) => {
  const [open, setOpen] = useState(
    () => androidAssetPackService.isAvailable() && !androidAssetPackService.hasSeenInitialPrompt(),
  );

  if (!open) return null;

  const close = () => {
    androidAssetPackService.markInitialPromptSeen();
    setOpen(false);
  };

  return (
    <div className="app-modal-overlay fixed inset-0 z-[10040] flex items-center justify-center bg-black/75 p-3">
      <div className="app-modal-panel max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-xl border-2 border-cyan-400/60 bg-slate-950 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{trans('オフライン素材を準備', languageMode)}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {trans('ゲーム本体はインストール済みです。画像・音声は必要な種類だけ追加で保存できます。', languageMode)}
            </p>
          </div>
          <button type="button" onClick={close} className="rounded p-1 hover:bg-slate-800" aria-label={trans('閉じる', languageMode)}>
            <X size={18} />
          </button>
        </div>
        <AndroidAssetPackManager languageMode={languageMode} compact />
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={close} className="rounded border border-slate-500 bg-slate-800 px-4 py-2 text-sm font-bold">
            {trans('あとで設定から行う', languageMode)}
          </button>
        </div>
      </div>
    </div>
  );
};
