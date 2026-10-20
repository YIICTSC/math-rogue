import React, { useEffect, useRef } from 'react';
import MathText from '../../components/MathText';
import { MAP_SYMBOL_ASSET_MAP } from '../../components/mapSymbolImageMap';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import type { GolfCommand, GolfView } from './engine';
export default function QuizPanel({ quiz, languageMode, disabled, send }: { quiz: NonNullable<GolfView['quiz']>; languageMode: LanguageMode; disabled: boolean; send: (c: GolfCommand) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), q = quiz.question, t = (s: string) => trans(s, languageMode);
  const symbol = q.visual?.kind === 'map_symbol' ? MAP_SYMBOL_ASSET_MAP[q.visual.symbol] : null;
  useEffect(() => { if (canvas.current && q.visual && !symbol) drawProblemVisual(canvas.current, q.visual); }, [q.id, quiz.shotId, symbol]);
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, [q.id, quiz.shotId]);
  const sender=useRef(send);sender.current=send;
  const panel = useRef<HTMLElement>(null);
  const sent = useRef('');
  const once = (type: 'answer' | 'continue', option = 0) => {
    const key = `${quiz.shotId}:${quiz.index}:${type}`;
    if (disabled || sent.current === key) return;
    sent.current = key;
    sender.current(type === 'answer' ? {type, shotId: quiz.shotId, index: quiz.index, option} : {type, shotId: quiz.shotId, index: quiz.index});
  };
  const advance = useRef(() => once('continue')); advance.current = () => once('continue');
  useEffect(() => {
    if (quiz.answer === null || disabled) return;
    const timer = window.setTimeout(() => advance.current(), 850);
    return () => window.clearTimeout(timer);
  }, [quiz.answer, quiz.shotId, quiz.index, disabled]);
  useEffect(() => {
    if (!disabled) panel.current?.querySelector<HTMLButtonElement>('button[data-quiz-action]:not(:disabled)')?.focus();
  }, [quiz.shotId, quiz.index, quiz.answer, disabled]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.defaultPrevented || disabled || event.altKey || event.ctrlKey || event.metaKey || (event.target as Element)?.closest('input,textarea,select,[contenteditable=true],[role=dialog]')) return;
      const option = /^[1-4]$/.test(event.key) ? Number(event.key) - 1 : -1;
      if (option >= 0 && quiz.answer === null) { event.preventDefault(); once('answer', option); }
      else if ((event.key === 'Enter' || event.key === ' ') && !(event.target as Element)?.closest('button')) { event.preventDefault(); once(quiz.answer === null ? 'answer' : 'continue'); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [quiz.shotId, quiz.index, quiz.answer, disabled]);
  const speak = () => { if (!q.audioPrompt || !('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(q.audioPrompt.text); u.lang = q.audioPrompt.lang || 'ja-JP'; u.rate = .85; window.speechSynthesis.speak(u); };
  return <section ref={panel} data-gamepad-question-screen data-gamepad-modal className="gg-quiz gg-panel" aria-label={t('ショット前の3問')}>
    <header><span>{t('ショット前の3問')}</span><b>{quiz.index + 1} / 3</b></header>
    <div className="gg-question" data-allow-japanese="true">
      {q.passage && <p className="gg-passage">{q.passage}</p>}
      <strong><MathText text={q.question} /></strong>
      {q.visual && (symbol ? <img src={symbol.src} alt="" /> : <canvas ref={canvas} width={520} height={360} aria-label={t('問題の図')} />)}
    </div>
    {q.audioPrompt && <button disabled={disabled || !('speechSynthesis' in window)} onClick={speak}>{t('聞く')}</button>}
    <div className="gg-options" data-allow-japanese="true">{q.options.map((option, i) => <button data-quiz-action key={i} disabled={disabled || quiz.answer !== null} className={quiz.answer === i ? 'is-correct' : quiz.selected === i ? 'is-wrong' : ''} onClick={() => once('answer', i)}><b>{i + 1}</b><MathText text={option} /></button>)}</div>
  </section>;
}
