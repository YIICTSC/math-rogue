import React,{useEffect,useRef,useState} from 'react';
import MathText from '../../components/MathText';
import QuestionListenButton from '../../components/QuestionListenButton';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import type { LanguageMode } from '../../types';
import type { TaskView, Command } from './rules';
import type { Copy } from './Settings';

export default function TaskDialog({task,label,t,language,clock,send}:{task:TaskView;label:string;t:Copy;language:LanguageMode;clock:number;send:(c:Command)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const [text,setText]=useState(''),[selections,setSelections]=useState<number[]>([]);
  const clockRef=useRef({clock,at:performance.now()});
  const [now,setNow]=useState(clock);
  const q=task.question,puzzle=task.puzzle;
  useEffect(()=>{clockRef.current={clock,at:performance.now()};},[clock]);
  useEffect(()=>{
    if(!puzzle)return;
    const timer=setInterval(()=>setNow(clockRef.current.clock+performance.now()-clockRef.current.at),33);
    return ()=>clearInterval(timer);
  },[puzzle?.started]);
  useEffect(()=>{if(q?.visual&&canvas.current)drawProblemVisual(canvas.current,q.visual);},[q]);
  const respond=(data:Omit<Extract<Command,{type:'answer'}>,'type'|'token'>)=>send({type:'answer',token:task.token,...data});
  const pulse=puzzle?(Math.max(0,now-puzzle.started)%1600)/1600:0;
  const warm=!!puzzle&&puzzle.kind==='memory'&&now-puzzle.started<2700;
  const instruction=puzzle?.kind==='wire'?t('見本と同じ順に記号をつなごう。','Connect the symbols in the order shown.')
    :puzzle?.kind==='memory'?t('記号の順番を覚え、表示が消えたら入力しよう。','Remember the sequence, then enter it after it disappears.')
    :puzzle?.kind==='tiles'?t('光ったマスを左上から順につなごう。','Connect the lit tiles from top left to bottom right.')
    :puzzle?.kind==='pulse'?t('ランプが緑の間に押そう。','Press while the light is green.'):t('小さい数字から順に押そう。','Press the numbers in ascending order.');
  return <div className="sm-overlay"><section className="sm-dialog sm-task" role="dialog" aria-modal="true" aria-label={label}>
    <header><div><small>{task.purpose==='repair'?t('設備の復旧','Facility repair'):t('学習端末','Learning terminal')}</small><h2>{label}</h2></div><button onClick={()=>send({type:'close-task'})} aria-label={t('端末を閉じる','Close terminal')}>×</button></header>
    {q&&<>
      {q.passage&&<p className="sm-passage" data-allow-japanese="true">{q.passage}</p>}
      <p className="sm-question" data-allow-japanese="true"><MathText text={q.question}/></p>
      {q.visual&&<canvas ref={canvas} className="sm-visual" width={420} height={280} aria-label={t('問題の図','Question diagram')}/>}
      <QuestionListenButton prompt={q.audioPrompt} questionKey={String(task.token)} languageMode={language} autoPlay/>
      {task.format==='choice'?<div className="sm-answers">{q.options?.map((option,i)=><button key={option} data-allow-japanese="true" onClick={()=>respond({choice:i})}><b>{i+1}</b><MathText text={option}/></button>)}</div>
        :<form className="sm-answer-form" onSubmit={e=>{e.preventDefault();if(text.trim())respond({text});}}>
          <label>{t('答えを入力','Answer')}<input value={text} maxLength={180} onChange={e=>setText(e.target.value)} inputMode="text" autoComplete="off"/></label>
          <button className="sm-primary" disabled={!text.trim()}>{t('決定','Submit')}</button>
        </form>}
    </>}
    {puzzle&&<div>
      <p>{instruction}</p>
      {puzzle.kind==='pulse'?<div className="sm-pulse"><progress max={1} value={pulse}/><button data-hot={pulse>=.35&&pulse<=.67} onClick={()=>respond({puzzle:[0]})}>{t('同期する','Sync')}</button></div>:<>
        {puzzle.pattern&&(puzzle.kind==='wire'||warm)&&<p className="sm-pattern" aria-live="polite">{puzzle.pattern.map(i=>puzzle.pieces[i]).join(' → ')}</p>}
        <div className={'sm-pieces '+(puzzle.kind==='tiles'?'is-tiles':'')}>{puzzle.pieces.map((piece,i)=><button key={i} aria-label={puzzle.kind==='tiles'?t('マス','Tile')+' '+(i+1)+' '+piece:piece}
          aria-pressed={selections.includes(i)} disabled={warm||selections.includes(i)} onClick={()=>setSelections(values=>[...values,i])}>{piece}</button>)}</div>
        <p className="sm-pattern" aria-live="polite">{selections.map(i=>puzzle.pieces[i]).join(' → ')||'—'}</p>
        <div className="sm-inline"><button onClick={()=>setSelections([])}>{t('やり直す','Reset')}</button><button className="sm-primary" disabled={!selections.length||warm} onClick={()=>respond({puzzle:selections})}>{t('接続する','Connect')}</button></div>
      </>}
    </div>}
    {task.wrong&&<p role="status" className="sm-warning">{t('もう一度試そう。','Try again.')}</p>}
  </section></div>;
}
