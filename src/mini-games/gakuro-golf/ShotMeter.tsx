import React, { useEffect, useRef, useState } from 'react';
import { impactAt, meterPosition } from './shotTiming';
export default function ShotMeter({ disabled, onShot, onPower, onActive, t, limit = 1 }: { disabled: boolean; limit?: number; onShot: (power: number, impact: number) => void; onPower: (power: number) => void; onActive: (active: boolean) => void; t: (s: string) => string }) {
  const [active, setActive] = useState(false), [locked, setLocked] = useState<number | null>(null), [returning, setReturning] = useState(false);
  const state = useRef({ start: 0, power: null as number | null, active: false });
  const callbacks = useRef({ onShot, onPower, onActive }); callbacks.current = { onShot, onPower, onActive };
  const cursor = useRef<HTMLSpanElement>(null);
  const cancel = () => { state.current.active = false; setActive(false); setLocked(null); callbacks.current.onActive(false); };
  const finish = (impact: number) => { const power = state.current.power ?? .05; cancel(); callbacks.current.onShot(power, impact); };
  const tap = () => {
    if (disabled) return;
    const s = state.current;
    if (!s.active) { s.start = performance.now(); s.power = null; s.active = true; setActive(true); setLocked(null); setReturning(false); callbacks.current.onActive(true); return; }
    const m = meterPosition(performance.now() - s.start);
    if (s.power === null) { if (m.returning) return; s.power = Math.max(.05, m.position); setLocked(s.power); callbacks.current.onPower(s.power); }
    else if (m.returning) finish(impactAt(m.position));
  };
  useEffect(()=>{if(active||disabled)return;const key=(e:KeyboardEvent)=>{if(e.repeat||!(e.code==='Enter'||e.code==='Space')||(e.target as Element)?.closest('input,textarea,select,[role=dialog]'))return;e.preventDefault();e.stopPropagation();tap();};document.addEventListener('keydown',key,true);return()=>document.removeEventListener('keydown',key,true);},[active,disabled]);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const draw = () => { const s = state.current; if (!s.active) return; const m = meterPosition(performance.now() - s.start);
      if (cursor.current) cursor.current.style.left = `${m.position * 100}%`;
      if (m.returning) setReturning(true);
      if (m.expired) { finish(1); return; } frame = requestAnimationFrame(draw);
    };
    const pointer = (e: PointerEvent) => { if ((e.target as Element).closest('[data-meter-ignore]')) return; e.preventDefault(); e.stopPropagation(); tap(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); else if (!e.repeat && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); e.stopPropagation(); tap(); } };
    const visibility = () => { if (document.hidden) cancel(); };
    frame = requestAnimationFrame(draw); document.addEventListener('pointerdown', pointer, true); document.addEventListener('keydown', key, true); document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', cancel);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', pointer, true); document.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', cancel); };
  }, [active, disabled]);
  useEffect(() => () => { state.current.active = false; callbacks.current.onActive(false); }, []);
  return <div className="gg-timing" data-active={active} data-returning={returning}>
    <div className="gg-meter-heading"><b>{locked === null ? t('1回目：パワーを決める') : returning ? t('2回目：下の中心に合わせる') : t('右端まで進んでから戻ります')}</b><span>{locked === null ? `MAX ${Math.round(limit * 100)}%` : `${Math.round(locked * 100)}%`}</span></div>
    <div className="gg-meter-track"><span className="gg-meter-fill" style={{ width: `${(locked ?? 0) * 100}%` }}/>{locked !== null && <i className="gg-meter-lock" style={{ left: `${locked * 100}%` }}/>}<span className="gg-meter-cursor" ref={cursor}/></div>
    <div className="gg-impact-strip"><span/><i/>{locked!==null&&<b className="gg-impact-cue" aria-label={t('ここでインパクトを合わせる')}>↑</b>}</div>
    <div className="gg-meter-actions"><button className="gg-primary" disabled={disabled} onClick={e => { if (e.detail === 0 && !state.current.active) tap(); }} onPointerDown={() => { if (!state.current.active) tap(); }} onKeyDown={e => { if (!state.current.active && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tap(); } }}>{t(active ? '画面タッチで確定' : 'ショット')}</button></div>
  </div>;
}
