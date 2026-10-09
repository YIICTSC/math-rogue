import {useVrBgm,cue} from './audio';
import React, { useEffect, useRef, useState } from 'react';
import type { KartLesson } from '../gakuro-kart/learning';
import MathText from '../../components/MathText';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import { storageService } from '../../services/storageService';
export default function Quiz({lesson, onComplete, onAnswer, en=false}: {lesson:KartLesson;onComplete:()=>void;onAnswer?:(choice:number)=>void;en?:boolean}) {
  useVrBgm('quiz',1,50);
  const [answers,setAnswers]=useState<number[]>([]),[feedback,setFeedback]=useState(false); const locked=useRef(false),canvas=useRef<HTMLCanvasElement>(null),started=useRef(performance.now());
  const index=Math.min(answers.length,2),q=lesson.questions[index];
  const display=feedback?lesson.questions[Math.max(0,answers.length-1)]:q;
  useEffect(()=>{if(display.visual&&canvas.current)drawProblemVisual(canvas.current,display.visual);if(!feedback)started.current=performance.now();},[display,feedback]);
  const complete = useRef(onComplete); complete.current = onComplete;
  useEffect(()=>{if(!feedback)return;const timer=window.setTimeout(()=>{if(answers.length===3)complete.current();else {locked.current=false;setFeedback(false);}},850);return()=>window.clearTimeout(timer);},[feedback,answers.length]);
  const choose=(choice:number)=>{if(locked.current)return;locked.current=true;cue(choice===q.correct?'correct':'wrong');onAnswer?.(choice);storageService.saveAssignmentAnswer({mode:q.mode,problemId:q.problemId,question:q.question,correctAnswer:q.options[q.correct],selectedAnswer:q.options[choice],correct:choice===q.correct,elapsedMs:performance.now()-started.current,answeredAt:new Date().toISOString()});setFeedback(true);setAnswers(a=>[...a,choice]);};
  return <div className="gear-overlay"><section><h2>{en?'LEARNING CHECK':'単元チェック'} {feedback?answers.length:index+1}/3</h2><small>{lesson.title}</small>{display.passage&&<p>{display.passage}</p>}<p><MathText text={display.question}/></p>{display.visual&&<canvas ref={canvas} width={520} height={360} style={{maxWidth:'100%'}}/>}{display.audioPrompt&&<button onClick={()=>{const u=new SpeechSynthesisUtterance(display.audioPrompt!.text);u.lang=display.audioPrompt!.lang||'ja-JP';speechSynthesis.speak(u);}}>{en?'Listen':'聞く'}</button>}{display.options.map((o,i)=><button key={i} disabled={feedback} onClick={()=>choose(i)} style={{display:'block',width:'100%',textAlign:'left',background:feedback?(i===display.correct?'#b9dfab':i===answers.at(-1)?'#f3b2a5':undefined):undefined,color:feedback?'#152b22':undefined}}><MathText text={o}/></button>)}</section></div>;
}
