import { Capacitor } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { ANDROID_ASSET_PACK_VERSIONS } from '../generated/androidAssetPackVersions';
import {
  ANDROID_ASSET_PACK_ROOT,
  ANDROID_ASSET_PACK_STATE_KEY,
  AndroidAssetPackId,
  getAndroidAssetLocalFileName,
  readAndroidAssetPackInstallState,
} from '../utils/assetPaths';

export type AndroidAssetPackFile = {
  path: string;
  size: number;
  sha256: string;
};

export type AndroidAssetPack = {
  id: AndroidAssetPackId;
  label: string;
  description: string;
  kind: 'visual' | 'audio';
  theme: 'elementary' | 'high-school' | 'magic';
  version: string;
  totalBytes: number;
  files: AndroidAssetPackFile[];
};

type AndroidAssetPackManifest = {
  schemaVersion: number;
  hostedBaseUrl: string;
  contentVersion: string;
  packs: Record<AndroidAssetPackId, AndroidAssetPack>;
};

export type AndroidAssetPackProgress = {
  packId: AndroidAssetPackId;
  completedBytes: number;
  totalBytes: number;
  completedFiles: number;
  totalFiles: number;
  activePath?: string;
};

export type AndroidAssetPackSnapshot = {
  available: boolean;
  manifest: AndroidAssetPackManifest | null;
  installed: Partial<Record<AndroidAssetPackId, boolean>>;
  downloading: AndroidAssetPackId | null;
  progress: AndroidAssetPackProgress | null;
  error: string | null;
};

const STATE_CHANGED_EVENT = 'learning-rogue:android-asset-packs-changed';
const PROMPT_SEEN_KEY = 'learning_rogue_android_asset_pack_prompt_seen_v1';
const MAX_CONCURRENT_DOWNLOADS = 4;

const encodeHostedPath = (path: string) =>
  path.split('/').map(segment => encodeURIComponent(segment)).join('/');

const getTransferProgressKey = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname);
  } catch {
    return url;
  }
};

const formatError = (reason: unknown) => {
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === 'object' && 'message' in reason) return String(reason.message);
  return '素材のダウンロードに失敗しました。通信状態と空き容量を確認してください。';
};

class AndroidAssetPackService {
  private manifestPromise: Promise<AndroidAssetPackManifest> | null = null;
  private downloading: AndroidAssetPackId | null = null;
  private progress: AndroidAssetPackProgress | null = null;
  private error: string | null = null;

  isAvailable() {
    return Capacitor.getPlatform() === 'android'
      && Capacitor.isPluginAvailable('Filesystem')
      && Capacitor.isPluginAvailable('FileTransfer');
  }

  hasSeenInitialPrompt() {
    return window.localStorage.getItem(PROMPT_SEEN_KEY) === 'true';
  }

  markInitialPromptSeen() {
    window.localStorage.setItem(PROMPT_SEEN_KEY, 'true');
  }

  subscribe(listener: () => void) {
    window.addEventListener(STATE_CHANGED_EVENT, listener);
    return () => window.removeEventListener(STATE_CHANGED_EVENT, listener);
  }

  private notify() {
    window.dispatchEvent(new Event(STATE_CHANGED_EVENT));
  }

  async getManifest(): Promise<AndroidAssetPackManifest> {
    if (!this.manifestPromise) {
      const manifestUrl = new URL('android-asset-pack-manifest.json', window.location.href).toString();
      this.manifestPromise = fetch(manifestUrl)
        .then(async response => {
          if (!response.ok) throw new Error('素材一覧を読み込めませんでした。');
          return response.json() as Promise<AndroidAssetPackManifest>;
        })
        .then(manifest => {
          if (manifest.schemaVersion !== 1) throw new Error('素材一覧の形式が対応外です。');
          return manifest;
        })
        .catch(reason => {
          this.manifestPromise = null;
          throw reason;
        });
    }
    return this.manifestPromise;
  }

  async getSnapshot(): Promise<AndroidAssetPackSnapshot> {
    if (!this.isAvailable()) {
      return { available: false, manifest: null, installed: {}, downloading: null, progress: null, error: null };
    }
    let manifest: AndroidAssetPackManifest | null = null;
    try {
      manifest = await this.getManifest();
    } catch (reason) {
      this.error = formatError(reason);
    }
    const state = readAndroidAssetPackInstallState();
    const installed = Object.fromEntries(
      (Object.keys(ANDROID_ASSET_PACK_VERSIONS) as AndroidAssetPackId[])
        .map(packId => [packId, state.installedVersions[packId] === ANDROID_ASSET_PACK_VERSIONS[packId]])
    ) as Record<AndroidAssetPackId, boolean>;
    return {
      available: true,
      manifest,
      installed,
      downloading: this.downloading,
      progress: this.progress,
      error: this.error,
    };
  }

  async downloadPack(packId: AndroidAssetPackId) {
    if (!this.isAvailable()) throw new Error('追加ダウンロードはAndroidアプリで利用できます。');
    if (this.downloading) throw new Error('別の素材パックをダウンロード中です。');

    const manifest = await this.getManifest();
    const pack = manifest.packs[packId];
    if (!pack || pack.version !== ANDROID_ASSET_PACK_VERSIONS[packId]) {
      throw new Error('素材一覧が現在のアプリと一致しません。アプリを更新してください。');
    }

    this.downloading = packId;
    this.error = null;
    this.progress = {
      packId,
      completedBytes: 0,
      totalBytes: pack.totalBytes,
      completedFiles: 0,
      totalFiles: pack.files.length,
    };
    this.notify();

    const packDirectory = `${ANDROID_ASSET_PACK_ROOT}/${packId}`;
    await Filesystem.mkdir({ path: packDirectory, directory: Directory.Data, recursive: true }).catch(() => undefined);
    const directoryUri = (await Filesystem.getUri({ path: packDirectory, directory: Directory.Data })).uri.replace(/\/$/, '');
    const transferredByUrl = new Map<string, number>();
    let completedBytes = 0;
    let completedFiles = 0;

    const listener = await FileTransfer.addListener('progress', event => {
      if (event.type !== 'download') return;
      transferredByUrl.set(getTransferProgressKey(event.url), event.bytes);
      const inFlightBytes = Array.from(transferredByUrl.values()).reduce((sum, bytes) => sum + bytes, 0);
      this.progress = {
        packId,
        completedBytes: Math.min(pack.totalBytes, completedBytes + inFlightBytes),
        totalBytes: pack.totalBytes,
        completedFiles,
        totalFiles: pack.files.length,
        activePath: event.url,
      };
      this.notify();
    });

    let cursor = 0;
    let aborted = false;
    const downloadNext = async () => {
      while (!aborted && cursor < pack.files.length) {
        const file = pack.files[cursor++];
        const localFileName = getAndroidAssetLocalFileName(file.path);
        const localPath = `${packDirectory}/${localFileName}`;
        const remoteUrl = `${manifest.hostedBaseUrl}${encodeHostedPath(file.path)}`;

        let alreadyDownloaded = false;
        try {
          const existing = await Filesystem.stat({ path: localPath, directory: Directory.Data });
          alreadyDownloaded = existing.type === 'file' && existing.size === file.size;
        } catch {
          alreadyDownloaded = false;
        }

        if (!alreadyDownloaded) {
          const progressKey = getTransferProgressKey(remoteUrl);
          transferredByUrl.set(progressKey, 0);
          try {
            await FileTransfer.downloadFile({
              url: remoteUrl,
              path: `${directoryUri}/${localFileName}`,
              progress: true,
              connectTimeout: 30_000,
              readTimeout: 120_000,
            });
            const downloaded = await Filesystem.stat({ path: localPath, directory: Directory.Data });
            if (downloaded.size !== file.size) {
              await Filesystem.deleteFile({ path: localPath, directory: Directory.Data }).catch(() => undefined);
              throw new Error(`${file.path} の検証に失敗しました。再試行してください。`);
            }
          } catch (reason) {
            aborted = true;
            throw reason;
          } finally {
            transferredByUrl.delete(progressKey);
          }
        }

        completedBytes += file.size;
        completedFiles += 1;
        this.progress = {
          packId,
          completedBytes,
          totalBytes: pack.totalBytes,
          completedFiles,
          totalFiles: pack.files.length,
          activePath: file.path,
        };
        this.notify();
      }
    };

    try {
      const results = await Promise.allSettled(Array.from(
        { length: Math.min(MAX_CONCURRENT_DOWNLOADS, pack.files.length) },
        () => downloadNext(),
      ));
      const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      if (failure) throw failure.reason;
      const rootUri = (await Filesystem.getUri({ path: ANDROID_ASSET_PACK_ROOT, directory: Directory.Data })).uri;
      const current = readAndroidAssetPackInstallState();
      const next = {
        rootUrl: Capacitor.convertFileSrc(rootUri).replace(/\/$/, ''),
        installedVersions: {
          ...current.installedVersions,
          [packId]: pack.version,
        },
      };
      window.localStorage.setItem(ANDROID_ASSET_PACK_STATE_KEY, JSON.stringify(next));
    } catch (reason) {
      this.error = formatError(reason);
      throw reason;
    } finally {
      await listener.remove();
      this.downloading = null;
      this.progress = null;
      this.notify();
    }
  }

  async deletePack(packId: AndroidAssetPackId) {
    if (!this.isAvailable()) return;
    if (this.downloading) throw new Error('ダウンロード中は削除できません。');
    await Filesystem.rmdir({
      path: `${ANDROID_ASSET_PACK_ROOT}/${packId}`,
      directory: Directory.Data,
      recursive: true,
    }).catch(() => undefined);
    const current = readAndroidAssetPackInstallState();
    const installedVersions = { ...current.installedVersions };
    delete installedVersions[packId];
    window.localStorage.setItem(ANDROID_ASSET_PACK_STATE_KEY, JSON.stringify({ ...current, installedVersions }));
    this.notify();
  }
}

export const androidAssetPackService = new AndroidAssetPackService();
