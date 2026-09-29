import React, { useEffect, useRef } from 'react';
import type { Race, Racer } from './engine';
import { answerLane, LANE_COLORS, QUIZ_END, QUIZ_GATES } from './learning';
import MathText from '../../components/MathText';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import { MAP_SYMBOL_ASSET_MAP } from '../../components/mapSymbolImageMap';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
export default function QuizBoard({ world, racer, languageMode, sound }: { world: Race; racer: Racer; languageMode: LanguageMode; sound: boolean }) {
  const done = racer.quizAnswers.filter(a => a !== -2).length;
  const feedback = done > 0 && world.time - racer.quizFeedbackAt < 2.5;
  const index = feedback ? done - 1 : Math.min(done, 2), q = world.lesson?.questions[index];
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = (s: string) => trans(s, languageMode);
  const speaking = useRef<SpeechSynthesisUtterance | null>(null);
  const speak = () => { if (!q?.audioPrompt || !sound || !('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(q.audioPrompt.text); u.lang = q.audioPrompt.lang || 'ja-JP'; u.rate = .85; window.speechSynthesis.cancel(); speaking.current = u; window.speechSynthesis.speak(u); };
  useEffect(() => { if (canvas.current && q?.visual) drawProblemVisual(canvas.current, q.visual); }, [q]);
  useEffect(() => { if (!feedback && !world.paused && world.phase === 'race') speak(); return () => { if (speaking.current && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }; }, [q?.id, sound, world.paused, world.phase]);
  if (!q || !['race', 'countdown'].includes(world.phase) || racer.finish || (racer.quizApplied && racer.distance > QUIZ_END + 230)) return null;
  const lane = answerLane(racer.x), correct = feedback && racer.quizAnswers[index] === q.correct;
  const result = racer.quizApplied || (done === 3 && !feedback);
  const resultText = ['クラッシュ！', '減速…', 'そのままレースへ', '全問正解！ブースト！'][racer.quizCorrect];
  const symbol = q.visual?.kind === 'map_symbol' ? MAP_SYMBOL_ASSET_MAP[q.visual.symbol] : null;
  return <section className={`gk-quiz-board ${feedback ? correct ? 'is-correct' : 'is-wrong' : ''} ${result ? 'is-summary' : ''}`} aria-label={t('学習電光掲示板')}>
    <div className="gk-board-top"><b>LEARNING STRAIGHT</b><span>{result ? `${racer.quizCorrect} / 3` : `${index + 1} / 3`}</span><span>{t('正解')} {racer.quizCorrect}</span></div>
    {result ? <div className="gk-quiz-summary" role="status"><strong>{racer.quizCorrect} / 3</strong><b>{t(resultText)}</b></div> : <>
      <div className="gk-board-content" data-allow-japanese="true">
        <div className="gk-question-copy">{q.passage && <p className="gk-passage">{q.passage}</p>}<strong><MathText text={q.question} /></strong>{q.audioPrompt && <button onClick={speak} disabled={!sound}>{t('聞く')}</button>}</div>
        {q.visual && (symbol ? <img className="gk-question-visual" src={symbol.src} alt="" /> : <canvas className="gk-question-visual" ref={canvas} width={520} height={360} aria-label={t('問題の図')} />)}
      </div>
      <div className="gk-answers" data-allow-japanese="true">{q.options.map((option, i) => <div key={i} className={`${i === lane ? 'is-selected' : ''} ${feedback && i === q.correct ? 'is-answer' : ''}`} style={{ '--lane': LANE_COLORS[i] } as React.CSSProperties}><b>{i + 1}</b><MathText text={option} /></div>)}</div>
      <div className="gk-board-footer" role="status">{feedback ? <><b className="gk-answer-mark">{correct ? '〇' : '×'}</b><span>{t('正答')}：<span data-allow-japanese="true"><MathText text={q.options[q.correct]} /></span></span></> : <><span>{t('正しいレーンでゲートを通過')}</span><b>{Math.max(0, Math.ceil(QUIZ_GATES[index] - racer.distance))} m</b></>}</div>
    </>}
  </section>;
}
