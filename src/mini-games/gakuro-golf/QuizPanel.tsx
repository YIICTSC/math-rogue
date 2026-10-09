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
  useEffect(() => {
    if (quiz.answer === null || disabled) return;
    const timer = window.setTimeout(() => sender.current({ type: 'continue', shotId: quiz.shotId, index: quiz.index }), 850);
    return () => window.clearTimeout(timer);
  }, [quiz.answer, quiz.shotId, quiz.index, disabled]);
  const speak = () => { if (!q.audioPrompt || !('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(q.audioPrompt.text); u.lang = q.audioPrompt.lang || 'ja-JP'; u.rate = .85; window.speechSynthesis.speak(u); };
  return <section className="gg-quiz gg-panel" aria-label={t('ショット前の3問')}>
    <header><span>{t('ショット前の3問')}</span><b>{quiz.index + 1} / 3</b></header>
    <div className="gg-question" data-allow-japanese="true">
      {q.passage && <p className="gg-passage">{q.passage}</p>}
      <strong><MathText text={q.question} /></strong>
      {q.visual && (symbol ? <img src={symbol.src} alt="" /> : <canvas ref={canvas} width={520} height={360} aria-label={t('問題の図')} />)}
    </div>
    {q.audioPrompt && <button disabled={disabled || !('speechSynthesis' in window)} onClick={speak}>{t('聞く')}</button>}
    <div className="gg-options" data-allow-japanese="true">{q.options.map((option, i) => <button key={i} disabled={disabled || quiz.answer !== null} className={quiz.answer === i ? 'is-correct' : quiz.selected === i ? 'is-wrong' : ''} onClick={() => send({ type: 'answer', shotId: quiz.shotId, index: quiz.index, option: i })}><b>{i + 1}</b><MathText text={option} /></button>)}</div>

  </section>;
}
