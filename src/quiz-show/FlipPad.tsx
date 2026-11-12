import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Undo2, Trash2, PenLine } from 'lucide-react';
import type { LanguageMode } from '../types';
import { copy } from './copy';
import type { InkStroke } from './types';

export const INK_COLORS = ['#14203a', '#d62f5c', '#1767bf', '#18825f', '#a15ac2', '#ffffff'];
export function InkView({ strokes, label = '', className = '' }: { strokes: InkStroke[]; label?: string; className?: string }) {
  return <svg className={`qs-ink-view ${className}`} viewBox="0 0 1000 650" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet"><rect width="1000" height="650" fill="#fffdf6" />{strokes.map((s, i) => s.p.length === 2 ? <circle key={i} cx={s.p[0]} cy={s.p[1] * .65} r={s.w / 2} fill={INK_COLORS[s.c]} /> : <polyline key={i} points={Array.from({ length: s.p.length / 2 }, (_, k) => `${s.p[k * 2]},${s.p[k * 2 + 1] * .65}`).join(' ')} fill="none" stroke={INK_COLORS[s.c]} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />)}</svg>;
}
export default function FlipPad({ strokes, onChange, disabled, language }: { strokes: InkStroke[]; onChange: (ink: InkStroke[]) => void; disabled: boolean; language: LanguageMode }) {
  const t = copy(language), [color, setColor] = useState(0), [width, setWidth] = useState(7), [drawing, setDrawing] = useState(false);
  const live = useRef(strokes), pointer = useRef<number | null>(null), pad = useRef<HTMLDivElement>(null), callback = useRef(onChange); callback.current = onChange;
  useEffect(() => { if (pointer.current === null) live.current = strokes; }, [strokes]);
  useEffect(() => { if (disabled) { pointer.current = null; setDrawing(false); } }, [disabled]);
  function point(e: React.PointerEvent) { const r = pad.current!.getBoundingClientRect(); return [Math.round(Math.max(0, Math.min(1000, (e.clientX - r.left) / r.width * 1000))), Math.round(Math.max(0, Math.min(1000, (e.clientY - r.top) / r.height * 1000)))]; }
  function change(ink: InkStroke[]) { live.current = ink; callback.current(ink); }
  const points = strokes.reduce((n, s) => n + s.p.length / 2, 0), full = points >= 1800 || strokes.length >= 80;
  function end(e: React.PointerEvent) { if (e.pointerId !== pointer.current) return; pointer.current = null; setDrawing(false); if (pad.current?.hasPointerCapture(e.pointerId)) pad.current.releasePointerCapture(e.pointerId); callback.current([...live.current]); }
  return <div className="qs-flip-pad"><div className="qs-ink-tools"><span className="qs-pen-colors">{INK_COLORS.slice(0, 5).map((c, i) => <button type="button" key={c} aria-label={`${t('インク', 'Ink', 'いろ')} ${i + 1}`} aria-pressed={color === i} disabled={disabled || drawing} style={{ '--ink': c } as React.CSSProperties} onClick={() => setColor(i)} />)}</span><button type="button" title={t('消しゴム', 'Eraser', 'けしゴム')} aria-label={t('消しゴム', 'Eraser', 'けしゴム')} disabled={disabled || drawing} aria-pressed={color === 5} onClick={() => setColor(5)}><Eraser size={18} /></button><label><PenLine size={15} /><select aria-label={t('ペンの太さ', 'Pen width', 'ペンのふとさ')} disabled={disabled || drawing} value={width} onChange={e => setWidth(Number(e.target.value))}><option value={4}>{t('細', 'Fine', 'ほそい')}</option><option value={7}>{t('中', 'Medium', 'ふつう')}</option><option value={16}>{t('太', 'Thick', 'ふとい')}</option></select></label><button type="button" aria-label={t('一画戻す', 'Undo stroke', 'ひとつもどす')} disabled={disabled || drawing || !strokes.length} onClick={() => change(strokes.slice(0, -1))}><Undo2 size={18} /></button><button type="button" aria-label={t('全部消す', 'Clear board', 'ぜんぶけす')} disabled={disabled || drawing || !strokes.length} onClick={() => change([])}><Trash2 size={18} /></button></div>
    <div ref={pad} className={`qs-draw-surface ${disabled ? 'is-disabled' : ''}`} role="application" aria-label={t('手書きフリップ。指やペンで書けます', 'Handwriting panel. Draw with a finger, mouse or pen.', 'ゆびやペンでかいてね')}
      onPointerDown={e => { if (disabled || full || pointer.current !== null || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); setDrawing(true); change([...live.current, { c: color, w: width, p: point(e) }]); }}
      onPointerMove={e => { if (disabled || e.pointerId !== pointer.current) return; e.preventDefault(); const ink = live.current, last = ink[ink.length - 1], p = point(e); if (!last || ink.reduce((n, s) => n + s.p.length / 2, 0) >= 1800 || Math.hypot(p[0] - last.p.at(-2)!, p[1] - last.p.at(-1)!) < 3) return; change([...ink.slice(0, -1), { ...last, p: [...last.p, ...p] }]); }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { pointer.current = null; setDrawing(false); }}>
      <InkView strokes={strokes} label={t('手書き回答', 'Handwritten answer', 'てがきのこたえ')} />{!strokes.length && <span className="qs-draw-placeholder"><PenLine size={28} />{t('ここに書こう', 'Write here', 'ここにかこう')}</span>}
    </div>{full && <small role="status">{t('ボードがいっぱいです。一画戻すか、消して続きを書けます。', 'Board limit reached. Undo or clear to keep drawing.', 'いっぱいになったよ。もどすか、けしてね。')}</small>}
  </div>;
}
