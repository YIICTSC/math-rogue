import React, { useEffect, useRef, useState } from 'react';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import { nextSpectatorTarget, SPECTATOR_INTERVAL_MS } from './spectator';
import './spectator.css';

export function useSpectatorTarget(enabled: boolean, ids: string[]) {
  const [target, setTarget] = useState<string | null>(null);
  const candidates = useRef(ids);
  candidates.current = ids;
  const membership = JSON.stringify([...ids].sort());
  useEffect(() => {
    setTarget(current => enabled ? (current && candidates.current.includes(current) ? current : nextSpectatorTarget(candidates.current, current)) : null);
  }, [enabled, membership]);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setTarget(current => nextSpectatorTarget(candidates.current, current)), SPECTATOR_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
  // A departing participant must never remain the camera target for a frame.
  return { target: enabled ? (target && ids.includes(target) ? target : ids[0] || null) : null,
    next: () => setTarget(current => nextSpectatorTarget(candidates.current, current)) };
}

export default function HostSpectator({ enabled, canChangeMode = true, onChange, name, count, onNext, languageMode, children }: {
  enabled: boolean; canChangeMode?: boolean; onChange: (enabled: boolean) => void;
  name?: string; count: number; onNext: () => void; languageMode: LanguageMode; children?: React.ReactNode;
}) {
  const t = (text: string) => trans(text, languageMode);
  return <section className="host-spectator" aria-label={t('ホスト観戦')}>
    <div className="host-spectator-controls">
      <button type="button" aria-pressed={enabled} disabled={!canChangeMode} onClick={() => onChange(!enabled)}>{t(enabled ? canChangeMode ? 'プレイに戻る' : '観戦モード' : '観戦モードにする')}</button>
      {enabled && <><strong data-allow-japanese="true">{name || t('参加プレイヤーを待っています。')}</strong><span>{t('8秒ごとにランダム切替')}</span><button type="button" disabled={!count} onClick={onNext}>{t('次のプレイヤー')}</button></>}
    </div>
    {enabled && children && <div className="host-spectator-details">{children}</div>}
  </section>;
}
