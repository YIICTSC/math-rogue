import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { LanguageMode } from '../../types';
import { trans } from '../../utils/textUtils';
import { GP_VISUAL_BYTES, GP_VISUAL_FILES } from '../../generated/kartVisualAssets';
import { loadAvatar } from './avatar';
import { prepareGpVisuals, type GpVisualProgress } from './visualPreload';
import './kartPreparation.css';

let modulePromise: ReturnType<typeof importKart> | undefined;
function importKart() { return import('./GakuroKart'); }
const loadKart = () => modulePromise ??= importKart().catch(error => { modulePromise = undefined; throw error; });
const Kart = lazy(loadKart);
const initial: GpVisualProgress = { stage: 'checking', completedFiles: 0, totalFiles: GP_VISUAL_FILES.length, readyBytes: 0, totalBytes: GP_VISUAL_BYTES };
type Props = { onClose: () => void; languageMode?: LanguageMode; inviteCode?: string; allowHost?: boolean };

/** GP is mounted only after its visuals are resident, before any online handshake. */
export default function KartEntry(props: Props) {
  const [progress, setProgress] = useState(initial), [ready, setReady] = useState(false), [error, setError] = useState(false), [reloadNeeded, setReloadNeeded] = useState(false), [attempt, setAttempt] = useState(0);
  const t = (text: string) => trans(text, props.languageMode || 'JAPANESE');
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setReloadNeeded(false); setProgress(initial);
    // StrictMode's first effect is cleaned up before this task starts.
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      const codeReady = loadKart();
      // Observe immediately, even if code download fails before the visual pack finishes.
      void codeReady.catch(() => undefined);
      void (async () => {
        let visualsReady = false;
        try {
          await prepareGpVisuals(value => { if (!controller.signal.aborted) setProgress(value); }, controller.signal);
          if (controller.signal.aborted) return;
          visualsReady = true;
          await codeReady;
          const [{ prepareStorybookCharacters }, { prepareProtagonistModel }] = await Promise.all([
            import('../../three/storybookCharacters'), import('../../three/protagonistModel'),
          ]);
          await Promise.all([prepareStorybookCharacters(), prepareProtagonistModel(loadAvatar().protagonist)]);
          if (!controller.signal.aborted) setReady(true);
        } catch {
          if (!controller.signal.aborted) { setReloadNeeded(visualsReady); setError(true); }
        }
      })();
    });
    return () => controller.abort();
  }, [attempt]);

  if (ready) return <Suspense fallback={null}><Kart {...props}/></Suspense>;
  const percent = Math.floor(100 * progress.readyBytes / progress.totalBytes);
  return <section className="gp-prepare" aria-label="GAKURO GP" data-gp-preparation data-gamepad-modal onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); props.onClose(); }
  }}>
    <header><button autoFocus onClick={props.onClose}>← {t('学習ローグへ')}</button><span>GAKURO GRAND PRIX</span></header>
    <div className="gp-prepare-layout"><div className="gp-prepare-brand" aria-hidden="true"><small>GET READY FOR THE GRID</small><b>GAKURO<span>GP<i>●</i></span></b><div className="gp-prepare-road"/></div>
      <div className="gp-prepare-panel"><small>BEFORE THE GREEN LIGHT</small><h1>{t('GPの表示素材を準備しています')}</h1><p>{t('GPを遊ぶための画像と3Dモデルを先に読み込みます。')}</p>
        <div className="gp-prepare-status" role="status">{t(error ? reloadNeeded ? '表示の準備を完了できませんでした。再読み込みしてください。' : '素材を読み込めませんでした。通信を確認して再試行してください。' : progress.stage === 'checking' ? '保存済みの素材を確認しています' : progress.stage === 'preparing' ? 'レーサーとコースを準備しています' : '表示素材をダウンロードしています')}</div>
        <progress aria-label={t('GPの表示素材の準備状況')} max={progress.totalBytes} value={progress.readyBytes}/><div className="gp-prepare-numbers"><strong>{percent}%</strong><span>{(progress.readyBytes / 1048576).toFixed(1)} / {(progress.totalBytes / 1048576).toFixed(1)} MB</span><span>{progress.completedFiles} / {progress.totalFiles}</span></div>
        <p className="gp-prepare-note">{t('保存できた素材は次回から再利用します。')}</p>{error && <button className="gp-prepare-retry" onClick={() => reloadNeeded ? location.reload() : setAttempt(value => value + 1)}>{t(reloadNeeded ? '再読み込み' : '再試行')}</button>}
      </div></div>
  </section>;
}
