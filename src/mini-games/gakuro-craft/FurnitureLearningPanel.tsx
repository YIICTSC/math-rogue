import React,{useEffect,useRef,useState} from 'react';
import {GameMode} from '../../types';
import MathText from '../../components/MathText';
import {drawProblemVisual} from '../../utils/drawProblemVisual';
import {storageService} from '../../services/storageService';
import type {HomeGame,HomeGameWorld,GameCommand} from './homeGames';
import './furnitureLearning.css';
export default function FurnitureLearningPanel({world,g,selfId,t,send}:{world:HomeGameWorld;g:HomeGame;selfId:string;t:(s:string)=>string;send:(c:GameCommand)=>void}){
 const l=world.learning?.[selfId],[error,setError]=useState(false),[retry,setRetry]=useState(0),[feedback,setFeedback]=useState<number|null>(null),canvas=useRef<HTMLCanvasElement>(null),submitted=useRef(''),clicked=useRef(''),started=useRef(performance.now());
 useEffect(()=>{if(!l?.due||l.lesson)return;const key=`${g.key}:${l.batch}:${retry}`;if(submitted.current===key)return;submitted.current=key;let cancelled=false;setError(false);import('../gakuro-kart/questions').then(({buildLesson})=>{const lesson=buildLesson(world.learningSelection||{mode:GameMode.MULTIPLICATION},3);if(!cancelled)send({type:'game_learn_set',key:g.key,batch:l.batch,lesson});}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[l?.due,l?.batch,l?.lesson,g.key,retry]);
 useEffect(()=>{if(!l?.answers.length){setFeedback(null);return;}setFeedback(l.answers.length-1);const timer=setTimeout(()=>{setFeedback(null);started.current=performance.now();},850);return()=>clearTimeout(timer);},[l?.batch,l?.answers.length]);
 const index=feedback??Math.min(2,l?.answers.length||0),q=l?.lesson?.questions[index];
 useEffect(()=>{if(q?.visual&&canvas.current)drawProblemVisual(canvas.current,q.visual);},[q]);
 useEffect(()=>()=>{if('speechSynthesis'in window)window.speechSynthesis.cancel();},[]);
 if(!l?.due)return null;
 const answer=(option:number)=>{if(!q||world.paused||feedback!==null||l.answers.length>=3)return;const key=`${l.batch}:${l.answers.length}`;if(clicked.current===key)return;clicked.current=key;if(!world.preview)storageService.saveAssignmentAnswer({mode:q.mode,problemId:q.problemId,question:q.question,correctAnswer:q.options[q.correct],selectedAnswer:q.options[option],correct:option===q.correct,elapsedMs:performance.now()-started.current,answeredAt:new Date().toISOString()});send({type:'game_learn_answer',key:g.key,batch:l.batch,index:l.answers.length,option});};
 return <div className="gc-learning" role="dialog" aria-modal="true" aria-label={t('ゲームの合間に3問')} onKeyDown={e=>e.stopPropagation()}><section>
 <header><h2>{t('ゲームの合間に3問')}</h2><b>{Math.min(3,l.answers.length+(feedback===null?1:0))}/3</b></header><p>{t(l.reason==='stages'?'3ステージ達成！学習して次の冒険へ。':'3ゲーム終了！学習して次の対戦へ。')}</p>
 {!l.lesson?<>{error?<><p>{t('選択した範囲から問題を準備できませんでした。')}</p><button onClick={()=>setRetry(n=>n+1)}>{t('再読み込み')}</button></>:<p>{t('問題を準備中')}</p>}</>:l.answers.length===3&&feedback===null?<><h3>{t('3問の学習が完了しました。')}</h3><p>{l.answers.filter((a,i)=>a===l.lesson!.questions[i].correct).length}/3 · {t('正解')}</p><button disabled={world.paused} onClick={()=>send({type:'game_learn_finish',key:g.key,batch:l.batch})}>{t('ゲームに戻る')}</button></>:q&&<>
 <div data-allow-japanese="true">{q.passage&&<p>{q.passage}</p>}<h3><MathText text={q.question}/></h3>{q.visual&&<canvas ref={canvas} width={520} height={360}/>}</div>
 {q.audioPrompt&&<button disabled={world.paused} onClick={()=>{if('speechSynthesis'in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.audioPrompt!.text);u.lang=q.audioPrompt!.lang||'ja-JP';window.speechSynthesis.speak(u);}}}>{t('聞く')}</button>}
 <div className="gc-learning-options" data-allow-japanese="true">{q.options.map((o,i)=><button key={i} disabled={world.paused||feedback!==null} className={feedback!==null?(i===q.correct?'correct':i===l.answers[feedback]?'wrong':''):''} onClick={()=>answer(i)}><MathText text={o}/></button>)}</div>
 {feedback!==null&&<p role="status">{t(l.answers[feedback]===q.correct?'正解':'答えを確認しよう。')} <span data-allow-japanese="true"><MathText text={q.options[q.correct]}/></span></p>}</>}
 <button className="gc-learning-exit" onClick={()=>send({type:'game_leave',key:g.key})}>{t('対戦から退出')}</button>
 </section></div>;
}
