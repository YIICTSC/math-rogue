import React, { useEffect, useRef, useState } from 'react';

export default function SteeringPad({ disabled, onChange }: { disabled: boolean; onChange: (value: number) => void }) {
  const [value, setValue] = useState(0);
  const pointer = useRef<number | null>(null), change = useRef(onChange);
  change.current = onChange;
  const reset = () => { pointer.current = null; setValue(0); change.current(0); };
  useEffect(() => { if (disabled) reset(); }, [disabled]);
  useEffect(() => {
    const blur = () => reset(), visibility = () => { if (document.hidden) reset(); };
    window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); change.current(0); };
  }, []);
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || pointer.current !== e.pointerId) return;
    const box = e.currentTarget.getBoundingClientRect(), travel = Math.max(1, (box.width - 52) / 2);
    const raw = Math.max(-1, Math.min(1, (e.clientX - box.left - box.width / 2) / travel));
    setValue(raw);
    // A small neutral zone avoids accidental steering while holding the center.
    change.current(Math.abs(raw) <= .08 ? 0 : Math.sign(raw) * (Math.abs(raw) - .08) / .92);
  };
  const release = (e: React.PointerEvent<HTMLButtonElement>) => { if (pointer.current === e.pointerId) reset(); };
  return <button type="button" className={`gk-stick ${value ? 'is-steering' : ''}`} aria-label="Steering stick" disabled={disabled}
    onPointerDown={e => { if (disabled || pointer.current !== null || e.button !== 0) return; e.preventDefault(); pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
    onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
    <span className="gk-stick-arrow gk-stick-left" aria-hidden="true">◀</span><span className="gk-stick-arrow gk-stick-right" aria-hidden="true">▶</span>
    <span className="gk-stick-track" aria-hidden="true"><span className="gk-stick-thumb" style={{ left: `${(value + 1) * 50}%` }}>●</span></span>
    <small>STEER</small>
  </button>;
}
