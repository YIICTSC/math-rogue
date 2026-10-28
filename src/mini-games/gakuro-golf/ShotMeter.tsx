import React, { useEffect, useRef, useState } from 'react';
import { impactAt, meterPosition, powerAt, MAX_SNAP, SWEEP_MS, MAX_HOLD_MS, IMPACT_CENTER } from './shotTiming';
const TUTORIAL_POWER = .5;
type TutorialStage = 'start' | 'power-moving' | 'power-wait' | 'impact-moving' | 'impact-wait';
export default function ShotMeter({ disabled, onShot, onPower, onActive, t, limit = 1, tutorial = false, specialTutorial = false }: { disabled: boolean; limit?: number; tutorial?: boolean; specialTutorial?: boolean; onShot: (power: number, impact: number) => void; onPower: (power: number) => void; onActive: (active: boolean) => void; t: (s: string) => string }) {
  const [active, setActive] = useState(false), [locked, setLocked] = useState<number | null>(null), [returning, setReturning] = useState(false);
  const state = useRef({ start: 0, power: null as number | null, active: false });
  const [tutorialStage, setTutorialStage] = useState<TutorialStage>('start');
  const guide = useRef<{stage: TutorialStage; stopped: number}>({stage: 'start', stopped: 0});
  const stage = (value: TutorialStage) => { guide.current.stage = value; setTutorialStage(value); };
  const callbacks = useRef({ onShot, onPower, onActive }); callbacks.current = { onShot, onPower, onActive };
  const lastInput = useRef(-Infinity);
  const cursor = useRef<HTMLSpanElement>(null);
  const cancel = () => { state.current.active = false; setActive(false); setLocked(null); setReturning(false); stage('start'); callbacks.current.onActive(false); };
  const finish = (impact: number) => { const power = state.current.power ?? .05; cancel(); callbacks.current.onShot(power, impact); };
  const tap = () => {
    if (disabled) return;
    lastInput.current = performance.now();
    const s = state.current;
    if (!s.active) { s.start = performance.now(); s.power = null; s.active = true; setActive(true); setLocked(null); setReturning(false); if (tutorial) stage('power-moving'); callbacks.current.onActive(true); return; }
    if (tutorial) {
      if (guide.current.stage === 'power-wait') { s.power = TUTORIAL_POWER; setLocked(TUTORIAL_POWER); callbacks.current.onPower(TUTORIAL_POWER); s.start = performance.now() - guide.current.stopped; stage('impact-moving'); }
      else if (guide.current.stage === 'impact-wait') finish(0);
      return;
    }
    const m = meterPosition(performance.now() - s.start);
    if (s.power === null) { if (m.returning && m.position < MAX_SNAP) return; s.power = powerAt(m.position); setLocked(s.power); callbacks.current.onPower(s.power); }
    else if (m.returning) finish(impactAt(m.position));
  };
  useEffect(()=>{
    const controller=(event:Event)=>{if((event as CustomEvent).detail==='cancel')cancel();else tap();};
    window.addEventListener('learning-rogue:golf-meter',controller);
    return()=>window.removeEventListener('learning-rogue:golf-meter',controller);
  },[disabled,active]);
  useEffect(()=>{if(active||disabled)return;const key=(e:KeyboardEvent)=>{if(e.repeat||!(e.code==='Enter'||e.code==='Space')||(e.target as Element)?.closest('input,textarea,select,[role=dialog],[data-meter-ignore]'))return;e.preventDefault();e.stopPropagation();tap();};document.addEventListener('keydown',key,true);return()=>document.removeEventListener('keydown',key,true);},[active,disabled]);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const draw = () => { const s = state.current; if (!s.active) return; let elapsed = performance.now() - s.start;
      if (tutorial) {
        const g = guide.current;
        if (g.stage === 'power-moving' && elapsed >= SWEEP_MS * TUTORIAL_POWER) { g.stopped = SWEEP_MS * TUTORIAL_POWER; stage('power-wait'); }
        else if (g.stage === 'impact-moving' && elapsed >= SWEEP_MS + MAX_HOLD_MS + SWEEP_MS * (1 - IMPACT_CENTER)) { g.stopped = SWEEP_MS + MAX_HOLD_MS + SWEEP_MS * (1 - IMPACT_CENTER); stage('impact-wait'); }
        if (g.stage === 'power-wait' || g.stage === 'impact-wait') elapsed = g.stopped;
      }
      const m = meterPosition(elapsed);
      if (cursor.current) cursor.current.style.left = `${m.position * 100}%`;
      if (m.returning) setReturning(true);
      if (m.expired) { finish(1); return; } frame = requestAnimationFrame(draw);
    };
    const pointer = (e: PointerEvent) => { if (e.button !== 0 || (e.target as Element).closest('[data-meter-ignore]') || (tutorial && !(e.target as Element).closest('.gg-meter-actions button'))) return; e.preventDefault(); e.stopPropagation(); tap(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); else if ((e.target as Element)?.closest('[data-meter-ignore]')) return; else if (!e.repeat && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); e.stopPropagation(); tap(); } };
    const visibility = () => { if (document.hidden) cancel(); };
    frame = requestAnimationFrame(draw); document.addEventListener('pointerdown', pointer, true); document.addEventListener('keydown', key, true); document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', cancel);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', pointer, true); document.removeEventListener('keydown', key, true); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', cancel); };
  }, [active, disabled, tutorial]);
  useEffect(() => () => { state.current.active = false; callbacks.current.onActive(false); }, []);
  return <div className="gg-timing" data-active={active} data-returning={returning}>
    {tutorial && <p className="gg-meter-tutorial" role="status">{t(tutorialStage === 'start' ? specialTutorial ? '必殺ゲージ満タン！黄色インパクトで自動発動。ボタンを押そう' : 'はじめてのショット：ボタンを押してゲージを動かそう' : tutorialStage === 'power-moving' ? 'ゲージが止まるまで待とう' : tutorialStage === 'power-wait' ? 'ここで押すとパワーが決まるよ' : tutorialStage === 'impact-moving' ? 'ゲージが黄色に戻るまで待とう' : specialTutorial ? '黄色で押そう！強烈なスピンでカップイン！' : '黄色に重なったら押してショット！')}</p>}
    <div className="gg-meter-heading"><b>{locked === null ? t('1回目：パワーを決める') : returning ? t('2回目：下の中心に合わせる') : t('右端まで進んでから戻ります')}</b><span>{locked === null ? `MAX ${Math.round(limit * 100)}%` : `${Math.round(locked * 100)}%`}</span></div>
    <div className={`gg-meter-track ${locked !== null ? 'is-impact' : ''}`}><span className="gg-meter-fill" style={{ width: `${(locked ?? 0) * 100}%` }}/>{locked !== null && <i className="gg-meter-lock" style={{ left: `${locked * 100}%` }}/>}<span className="gg-meter-cursor" ref={cursor}/></div>
    <div className="gg-impact-strip"><span/><i/>{locked!==null&&<b className="gg-impact-cue" aria-label={t('ここでインパクトを合わせる')}>↑</b>}</div>
    <div className="gg-meter-actions"><button className="gg-primary" disabled={disabled} onClick={e => { if (e.detail === 0 && !state.current.active && performance.now() - lastInput.current > 250) tap(); }} onPointerDown={e => { if (e.button === 0 && !state.current.active) { e.preventDefault(); tap(); } }} onKeyDown={e => { if (!state.current.active && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tap(); } }}>{t(tutorial ? 'ショット' : active ? '画面タッチで確定' : 'ショット')}</button></div>
  </div>;
}
