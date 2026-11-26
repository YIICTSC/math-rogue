import { useEffect, useRef, useState } from 'react';
import MathText from '../../components/MathText';
import QuestionListenButton from '../../components/QuestionListenButton';
import { MAP_SYMBOL_ASSET_MAP } from '../../components/mapSymbolImageMap';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import { matchesSchoolAnswer, schoolAnswerOptions, schoolQuestionNeedsChoices } from '../../utils/schoolAnswer';
import { useSchoolAnswerInput } from '../../utils/useSchoolAnswerInput';
import { trans } from '../../utils/textUtils';
import type { KartQuestion } from '../gakuro-kart/learning';
import { useWords } from './presentation';

export function Study({question,typing,read,onAnswer,onClose,retry,reward}:{question:KartQuestion;typing:boolean;read:boolean;onAnswer:(right:boolean)=>void;onClose:()=>void;retry?:()=>void;reward:string}){
  const {t,language}=useWords(), canvas=useRef<HTMLCanvasElement>(null);
  const [input,setInput]=useState(''),[result,setResult]=useState<boolean|undefined>(undefined);
  const answered=useRef(false);
  const actual=question.options[question.correct];
  const strict=schoolAnswerOptions(question.mode,question.question);
  const answer=(correct:boolean)=>{
    if(answered.current)return;
    answered.current=true;setResult(correct);onAnswer(correct);
  };
  const correct=(value:string)=>matchesSchoolAnswer(value,actual,strict);
  const {isComposing,...inputEvents}=useSchoolAnswerInput(setInput,value=>{if(correct(value))answer(true);});
  const type=typing&&!schoolQuestionNeedsChoices(question.question);
  const visual=question.visual?.kind==='map_symbol'?MAP_SYMBOL_ASSET_MAP[question.visual.symbol]:null;
  useEffect(()=>{if(canvas.current&&question.visual)drawProblemVisual(canvas.current,question.visual);},[question]);
  const shown=(value:string)=>language==='HIRAGANA'?trans(value,'HIRAGANA'):value;
  return <article className="pr-study" data-gamepad-question-screen>
    <p className="pr-study-reward">{reward}</p>
    {question.passage&&<p className="pr-passage" data-allow-japanese="true"><MathText text={shown(question.passage)} /></p>}
    <h3 data-allow-japanese="true"><MathText text={shown(question.question)} /></h3>
    {question.visual&&(visual?<img className="pr-problem-visual" src={visual.src} alt="" />:<canvas className="pr-problem-visual" ref={canvas} width={520} height={360} aria-label={t('問題の図','Problem diagram')} />)}
    <QuestionListenButton languageMode={language} muteBgm={Boolean(question.audioPrompt)} questionKey={question.id} autoPlay={read} disabled={result!==undefined||!read}
      prompt={question.audioPrompt??(read?{text:question.question,lang:'ja-JP',autoPlay:false}:undefined)} />
    {result===undefined&&(type
      ? <form className="pr-inline" onSubmit={e=>{e.preventDefault();if(input.trim()&&!isComposing())answer(correct(input));}}>
          <input autoComplete="off" aria-label={t('答え','Answer')} value={input} {...inputEvents} />
          <button type="submit" disabled={!input.trim()} className="pr-primary">{t('決定','Check')}</button>
        </form>
      : <div className="pr-choice-grid" data-allow-japanese="true">{question.options.map((o,i)=><button key={i} onClick={()=>answer(i===question.correct)}><small>{i+1}</small> <MathText text={shown(o)} /></button>)}</div>)}
    {result!==undefined&&<div className="pr-study-feedback" role="status">
      <strong>{result?t('正解！','Correct!'):t('あとで復習しよう。','Saved for review.')}</strong>
      <p>{t('正答','Answer')} <span data-allow-japanese="true"><MathText text={shown(actual)} /></span></p>
      {question.hint&&<p data-allow-japanese="true"><MathText text={shown(question.hint)} /></p>}
      {!result&&!question.hint&&question.visual&&<p>{t('図の手がかりと答えを見比べてみよう。','Compare the diagram’s clues with the answer.')}</p>}
      {!result&&retry&&<button onClick={retry}>{t('もう一度考える','Try again')}</button>}
      <button onClick={onClose} className="pr-primary">{t('戻る','Continue')}</button>
    </div>}
  </article>;
}
