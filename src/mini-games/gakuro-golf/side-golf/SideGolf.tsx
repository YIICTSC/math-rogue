import React,{useEffect,useRef,useState} from 'react';
import type {LanguageMode} from '../../../types';
import {trans} from '../../../utils/textUtils';
import TranslatedUiTree from '../../../components/TranslatedUiTree';
import {audioService} from '../../../services/audioService';
import {storageService} from '../../../services/storageService';
import type {KartAvatar} from '../../gakuro-kart/avatar';
import AvatarCreator from '../../gakuro-kart/AvatarCreator';
import {buildLesson,type LessonSelection} from '../../gakuro-kart/questions';
import type {KartLesson} from '../../gakuro-kart/learning';
import type {GolfCommand} from '../engine';
import {GOLF_HOLE_BGM} from '../useGolfAudio';
import LessonPicker from '../LessonPicker';
import QuizPanel from '../QuizPanel';
import {SIDE_COURSES,TOURS,ITEM_INFO,type Item,type Power} from './courses';
import {createSideState,tickSide,shootSide,airBrake,rewindSide,grantStudyItems} from './physics';
import SideCanvas from './SideCanvas';
import ActionIcon from './ActionIcon';
import './sideGolf.css';
type Progress=Record<string,{best:number;coins:number;stars:number}>;
type KeyAction='shot'|'left'|'right'|'brake'|'undo';
const defaultKeys:Record<KeyAction,string>={shot:'Enter',left:'ArrowLeft',right:'ArrowRight',brake:'KeyB',undo:'KeyR'};
const loadProgress=():Progress=>{try{const p=JSON.parse(localStorage.getItem('gakuro-side-golf-progress-v1')||'{}');return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}catch{return {};}};
export default function SideGolf({onClose,languageMode,avatar,onAvatar}:{onClose:()=>void;languageMode:LanguageMode;avatar:KartAvatar;onAvatar:(a:KartAvatar)=>void}){
 const t=(s:string)=>trans(s,languageMode),[tour,setTour]=useState(0),[playing,setPlaying]=useState(false),[progress,setProgress]=useState<Progress>(loadProgress),[picker,setPicker]=useState<number|null>(null),[selection,setSelection]=useState<LessonSelection|null>(null);
 const game=useRef(createSideState(0)),[snapshot,setSnapshot]=useState(()=>structuredClone(game.current)),[angle,setAngle]=useState(44),[shot,setShot]=useState<Power>('normal'),[power,setPower]=useState(.65),[charging,setCharging]=useState(false),chargeStart=useRef<number|null>(null),[holdMode,setHoldMode]=useState(false);
 const [paused,setPaused]=useState(false),[help,setHelp]=useState(false),[creator,setCreator]=useState(false),[overview,setOverview]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [keys,setKeys]=useState<Record<KeyAction,string>>(()=>{try{return {...defaultKeys,...JSON.parse(localStorage.getItem('gakuro-side-golf-keys-v1')||'{}')};}catch{return defaultKeys;}}),[binding,setBinding]=useState<KeyAction|null>(null);
 const [lesson,setLesson]=useState<KartLesson|null>(null),[questionIndex,setQuestionIndex]=useState(0),[answer,setAnswer]=useState<number|null>(null),[selected,setSelected]=useState<number|null>(null),[budget,setBudget]=useState(0),[correct,setCorrect]=useState(3);
 const quizSerial=useRef(0),quizCorrect=useRef(0),history=useRef<string[]>([]),session=useRef(crypto.randomUUID()),lastShot=useRef(0),recorded=useRef('');
 const course=SIDE_COURSES[snapshot.courseId],locked=paused||help||creator||!!lesson||picker!==null;
 const current=useRef({playing,locked,paused,angle,shot,correct,budget,holdMode});current.current={playing,locked,paused,angle,shot,correct,budget,holdMode};
 const startStudy=(source:LessonSelection)=>{try{const next=buildLesson(source,3,history.current);setLesson(next);setQuestionIndex(0);setSelected(null);setAnswer(null);quizCorrect.current=0;quizSerial.current++;}catch(e){setMessage(e instanceof Error?e.message:'問題を準備できませんでした。');}};
 const cancelCharge=()=>{chargeStart.current=null;setCharging(false);};
 const launch=(id:number,source=selection)=>{cancelCharge();game.current=createSideState(id);setSnapshot(structuredClone(game.current));setAngle(44);setPower(.65);setShot('normal');setOverview(false);setPaused(false);setHelp(false);setPlaying(true);setMessage('');setBudget(0);lastShot.current=0;recorded.current='';if(source)startStudy(source);else setPicker(id);};
 const choose=(id:number)=>{if(selection)launch(id);else setPicker(id);};
 const pickLesson=async(source:LessonSelection)=>{if(busy||picker===null)return;setBusy(true);const id=picker;try{buildLesson(source,3);setSelection(source);setPicker(null);launch(id,source);}catch(e){setMessage(e instanceof Error?e.message:'問題を準備できませんでした。');}finally{setBusy(false);}};
 const submit=(command:GolfCommand)=>{
  if(!lesson)return;const q=lesson.questions[questionIndex];
  if(command.type==='answer'&&command.index===questionIndex&&selected===null){const ok=command.option===q.correct;setSelected(command.option);setAnswer(q.correct);if(ok)quizCorrect.current++;
   storageService.saveAssignmentAnswer({pointReceipt:`side-golf:${session.current}:${quizSerial.current}:${questionIndex}`,mode:q.mode,problemId:q.problemId,problemKey:q.id,question:q.question,correct:ok,correctAnswer:q.options[q.correct],selectedAnswer:q.options[command.option],answeredAt:new Date().toISOString(),elapsedMs:0});history.current=[...history.current,q.id].slice(-120);
  }else if(command.type==='continue'&&selected!==null){if(questionIndex===2){setCorrect(quizCorrect.current);grantStudyItems(game.current,quizCorrect.current);setBudget(3);setLesson(null);setSnapshot(structuredClone(game.current));}else{setQuestionIndex(n=>n+1);setSelected(null);setAnswer(null);}}
 };
 const fire=(amount:number)=>{const s=game.current,p=current.current;cancelCharge();if(p.locked||s.phase!=='aim'||p.budget<1)return;if(shootSide(s,p.angle,amount,p.shot,p.correct)){setBudget(n=>Math.max(0,n-1));lastShot.current=performance.now();setSnapshot(structuredClone(s));}};
 const tap=()=>{const p=current.current;if(!p.playing||p.locked||game.current.phase!=='aim'||p.budget<1)return;if(chargeStart.current===null){chargeStart.current=performance.now();setCharging(true);}else{const elapsed=(performance.now()-chargeStart.current)/1250,amount=.05+.95*(1-Math.abs((elapsed%2)-1));fire(amount);}};
 const controls=useRef({tap,fire,cancelCharge});controls.current={tap,fire,cancelCharge};
 useEffect(()=>{
  if(!playing)return;let frame=0,previous=performance.now(),broadcast=0,lastSerial=game.current.serial;
  const update=(now:number)=>{const dt=Math.min(.06,(now-previous)/1000);previous=now;const p=current.current;
   if(!p.locked){tickSide(game.current,dt);if(chargeStart.current!==null){const elapsed=(now-chargeStart.current)/1250;setPower(.05+.95*(1-Math.abs((elapsed%2)-1)));}}
   const s=game.current;if(s.serial!==lastSerial){lastSerial=s.serial;const kind=s.event;if(kind==='shot')audioService.playGolfSound('swing');else if(kind==='water')audioService.playGolfSound('water');else if(kind==='goal')audioService.playGolfSound(s.strokes<SIDE_COURSES[s.courseId].par?'birdie':'cup');else if(kind==='land')audioService.playGolfSound('land');else audioService.playSound(kind==='coin'?'correct':'select');}
   if(s.phase==='holed'&&!s.conceded&&recorded.current!==`${s.courseId}/${s.strokes}`){recorded.current=`${s.courseId}/${s.strokes}`;const par=SIDE_COURSES[s.courseId].par,stars=s.strokes<par?3:s.strokes===par?2:1;setProgress(old=>{const prior=old[String(s.courseId)],next={...old,[s.courseId]:{best:Math.min(prior?.best??99,s.strokes),coins:Math.max(prior?.coins??0,s.coins.length),stars:Math.max(prior?.stars??0,stars)}};try{localStorage.setItem('gakuro-side-golf-progress-v1',JSON.stringify(next));}catch{}return next;});}
   broadcast+=dt;if(broadcast>=.08){broadcast=0;setSnapshot(structuredClone(s));}frame=requestAnimationFrame(update);
  };frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);
 },[playing]);
 useEffect(()=>{const lost=()=>{controls.current.cancelCharge();endRepeat();if(document.hidden)setPaused(true);};document.addEventListener('visibilitychange',lost);window.addEventListener('blur',lost);return()=>{document.removeEventListener('visibilitychange',lost);window.removeEventListener('blur',lost);};},[]);
 useEffect(()=>{if(locked){cancelCharge();endRepeat();}},[locked]);
 useEffect(()=>{const scope=audioService.acquireBgmScene('map',{mode:'NEW',theme:'elementary'},20);const track=GOLF_HOLE_BGM[(snapshot.courseId*3)%GOLF_HOLE_BGM.length];scope.update(track.type,track.options);return()=>scope();},[snapshot.courseId]);
 const brake=()=>{if(!locked&&airBrake(game.current))setSnapshot(structuredClone(game.current));};
 const undo=()=>{if(!locked&&rewindSide(game.current)){cancelCharge();setSnapshot(structuredClone(game.current));setBudget(n=>Math.min(3,n+1));}};
 const actions=useRef({brake,undo});actions.current={brake,undo};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(binding){e.preventDefault();e.stopImmediatePropagation();if(e.code!=='Escape'){const next={...keys,[binding]:e.code};setKeys(next);try{localStorage.setItem('gakuro-side-golf-keys-v1',JSON.stringify(next));}catch{}}setBinding(null);return;}
  if(!current.current.playing||e.repeat&&![keys.left,keys.right].includes(e.code))return;
  if(e.code==='Escape'){e.preventDefault();setPaused(v=>!v);return;}
  if(current.current.locked)return;
  if(e.code===keys.shot||e.code==='Enter'){e.preventDefault();e.stopImmediatePropagation();controls.current.tap();}
  else if(e.code===keys.left){e.preventDefault();setAngle(n=>Math.min(180,n+3));}else if(e.code===keys.right){e.preventDefault();setAngle(n=>Math.max(-180,n-3));}
  else if(e.code===keys.brake){e.preventDefault();actions.current.brake();}else if(e.code===keys.undo){e.preventDefault();actions.current.undo();}
 };document.addEventListener('keydown',key,true);return()=>document.removeEventListener('keydown',key,true);},[keys,binding]);
 const repeat=useRef<ReturnType<typeof setInterval>|null>(null);
 const endRepeat=()=>{if(repeat.current)clearInterval(repeat.current);repeat.current=null;};
 useEffect(()=>()=>endRepeat(),[]);
 const rotate=(e:React.PointerEvent<HTMLButtonElement>,direction:number)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setAngle(n=>Math.max(-180,Math.min(180,n+direction*3)));endRepeat();repeat.current=setInterval(()=>setAngle(n=>Math.max(-180,Math.min(180,n+direction*3))),50);};
 useEffect(()=>{if(game.current.inventory[shot]<1)setShot('normal');},[snapshot.inventory[shot],shot]);
 const totalStars=Object.values(progress).reduce((n,p)=>n+(Number(p?.stars)||0),0),finished=snapshot.phase==='holed';
 const goTours=()=>{cancelCharge();setPlaying(false);setLesson(null);setPaused(false);setHelp(false);};
 if(picker!==null)return <LessonPicker languageMode={languageMode} busy={busy} error={message} onSelect={pickLesson} onBack={()=>{setPicker(null);goTours();}}/>;
 return <TranslatedUiTree mode={languageMode}><main className={`sg-root ${playing?'sg-playing':''}`} style={{'--sg-accent':TOURS[playing?course.tour:tour].accent,'--sg-sky':TOURS[playing?course.tour:tour].sky} as React.CSSProperties}>
 {!playing?<>
  <header className="sg-header"><button onClick={onClose}>{t('ゴルフの入口へ')}</button><div><small>GAKURO GOLF</small><h1>{t('星渡り2D')}</h1></div><button onClick={()=>setCreator(true)}>{t('キャラクタークリエイト')}</button></header>
  <section className="sg-tour-intro"><p>72 HOLES · 8 WORLDS</p><h2>{t('角度ひとつで、世界を飛び越えよう。')}</h2><p>{t('壁も天井も近道になる。学んでアイテムを補充し、自分だけのルートでカップへ。')}</p><b>★ {totalStars} / 216</b></section>
  <nav className="sg-tours" aria-label={t('ツアーを選ぶ')}>{TOURS.map((v,i)=><button key={v.name} aria-pressed={tour===i} onClick={()=>setTour(i)} style={{'--tour-color':v.turf} as React.CSSProperties}><i aria-hidden="true">{String(i+1).padStart(2,'0')}</i><span>{t(v.name)}</span><small>{Array.from({length:9},(_,n)=>progress[i*9+n]).filter(Boolean).length} / 9</small></button>)}</nav>
  <section className="sg-hole-library"><div><h2>{t(TOURS[tour].name)}</h2><p>{t(TOURS[tour].hint)}</p></div><div className="sg-hole-grid">{SIDE_COURSES.filter(c=>c.tour===tour).map(c=>{const best=progress[c.id];return <button key={c.id} onClick={()=>choose(c.id)}><b>{String(c.number+1).padStart(2,'0')}</b><span>{t(c.name)}</span><small>PAR {c.par} · {best?`${best.best} / ${'★'.repeat(best.stars)}`:'—'}</small></button>;})}</div><button className="sg-primary" onClick={()=>choose(tour*9)}><ActionIcon kind="play"/>{t('このツアーを始める')}</button></section>
 </>:<>
  <div className="sg-field"><SideCanvas key={snapshot.courseId} game={game} angle={angle} power={power} shot={shot} correct={correct} avatar={avatar} overview={overview} paused={locked}/>
   <header className="sg-match-hud"><div className="sg-hole-number"><small>HOLE</small><b>{course.number+1}</b></div><div><b>{t(course.theme.name)}</b><small>{t(course.name)} · PAR {course.par}</small><strong>{t('打数')} {snapshot.strokes} <em>◇ {snapshot.coins.length} / 3</em></strong></div><nav><button aria-label={t('コース全景')} aria-pressed={overview} onClick={()=>setOverview(v=>!v)}><ActionIcon kind="map"/></button><button aria-label={t('操作ガイド')} onClick={()=>setHelp(true)}><ActionIcon kind="help"/></button><button aria-label={t('一時停止')} onClick={()=>setPaused(true)}><ActionIcon kind="pause"/></button></nav></header>
   <div className="sg-location" aria-hidden="true"><i style={{left:`${Math.max(0,Math.min(100,snapshot.ball.x/course.width*100))}%`}}/><b style={{left:`${course.cup.x/course.width*100}%`}}>⚑</b></div>
   {!locked&&!finished&&<p className="sg-play-hint">{t(snapshot.phase==='flight'?'空中ブレーキで着地点を調整できる！':budget<1?'3問に答えてショットとアイテムを補充しよう':'左右で角度。ショットを押してパワーを決めよう。')}</p>}
  </div>
  <footer className="sg-controls" aria-disabled={locked||finished}>
   <div className="sg-aim-buttons"><button aria-label={t('左に狙う')} disabled={locked||snapshot.phase!=='aim'||charging} onPointerDown={e=>rotate(e,1)} onPointerUp={endRepeat} onPointerCancel={endRepeat} onLostPointerCapture={endRepeat} onClick={e=>{if(e.detail===0)setAngle(n=>Math.min(180,n+3));}}><ActionIcon kind="left"/></button><output>{angle}°</output><button aria-label={t('右に狙う')} disabled={locked||snapshot.phase!=='aim'||charging} onPointerDown={e=>rotate(e,-1)} onPointerUp={endRepeat} onPointerCancel={endRepeat} onLostPointerCapture={endRepeat} onClick={e=>{if(e.detail===0)setAngle(n=>Math.max(-180,n-3));}}><ActionIcon kind="right"/></button></div>
   <div className="sg-power-meter" role="meter" aria-label={t('ショットパワー')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(power*100)}><i style={{width:`${power*100}%`}}/><b>{Math.round(power*100)}%</b></div>
   <button className="sg-brake" title={t(ITEM_INFO.brake.hint)} aria-label={t('空中ブレーキ')} disabled={locked||snapshot.phase!=='flight'||snapshot.inventory.brake<1} onClick={brake}><ActionIcon kind="brake"/><small>{snapshot.inventory.brake}</small></button>
   <button className="sg-shot" disabled={locked||snapshot.phase!=='aim'||budget<1} aria-label={t('ショット')} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);tap();}} onPointerUp={e=>{if(holdMode&&chargeStart.current!==null){const elapsed=(performance.now()-chargeStart.current)/1250;fire(.05+.95*(1-Math.abs((elapsed%2)-1)));}}} onPointerCancel={cancelCharge} onClick={e=>{if(e.detail===0)tap();}}><ActionIcon kind="shot"/><strong>{t(charging?'パワー確定':'ショット')}</strong><small>{budget} / 3</small></button>
  </footer>
  <div className="sg-items" aria-label={t('パワーアップの球')}>{(['normal','sticky','ice','heavy','bounce','float','phase'] as Power[]).map(item=><button key={item} aria-pressed={shot===item} disabled={locked||charging||snapshot.phase!=='aim'||snapshot.inventory[item]<1} onClick={()=>setShot(item)} title={t(ITEM_INFO[item].hint)}><ActionIcon kind={ITEM_INFO[item].icon}/><span>{t(ITEM_INFO[item].name)}</span><small>{item==='normal'?'∞':snapshot.inventory[item]}</small></button>)}<button disabled={locked||!snapshot.previous||snapshot.inventory.undo<1} onClick={undo} title={t(ITEM_INFO.undo.hint)} aria-label={t('時戻し')}><ActionIcon kind="undo"/><span>{t('時戻し')}</span><small>{snapshot.inventory.undo}</small></button></div>
  {!locked&&!finished&&<p className="sg-item-hint">{t(ITEM_INFO[shot].hint)}</p>}
  {!locked&&!finished&&budget<1&&snapshot.phase==='aim'&&<div className="sg-study-prompt"><button className="sg-primary" onClick={()=>selection&&startStudy(selection)}>{t('3問に挑戦')}</button></div>}
  {finished&&!lesson&&<div className="sg-overlay"><section className="sg-result"><small>{snapshot.conceded?'NEXT CHALLENGE':snapshot.strokes===1?'HOLE IN ONE':snapshot.strokes<course.par?'BIRDIE!':'NICE FINISH!'}</small><h2>{t(snapshot.conceded?'打数上限でホール終了':'カップイン！')}</h2><div className="sg-result-stars" aria-hidden="true">{snapshot.conceded?'':snapshot.strokes<course.par?'★★★':snapshot.strokes===course.par?'★★':'★'}</div><p>{snapshot.strokes} / PAR {course.par} · ◇ {snapshot.coins.length} / 3</p><div className="sg-result-actions"><button className="sg-primary" onClick={()=>launch((course.id+1)%SIDE_COURSES.length)}>{t(course.number===8?'次のツアーへ':'次のホール')}</button><button onClick={()=>launch(course.id)}>{t('もう一度挑戦')}</button><button onClick={goTours}>{t('ツアー選択へ')}</button></div></section></div>}
 </>}
 {lesson&&<div className="sg-overlay sg-quiz"><div className="sg-quiz-body"><b>{t('正解するとアイテムも補充！')}</b><QuizPanel languageMode={languageMode} disabled={paused} quiz={{shotId:quizSerial.current,index:questionIndex,question:(()=>{const {correct:_correct,...q}=lesson.questions[questionIndex];return q;})(),selected,answer}} send={submit}/></div></div>}
 {(paused||help)&&playing&&<div className="sg-overlay"><section className="sg-menu" role="dialog" aria-modal="true" aria-label={t('操作ガイド')}><header><h2>{t(help?'操作ガイド':'一時停止')}</h2><button autoFocus onClick={()=>{setPaused(false);setHelp(false);}}>{t('プレイを続ける')}</button></header><p>{t('少ない打数でカップへ。水・溶岩・落下は1打罰で打つ前の位置へ。18打で次へ進めます。')}</p><p>{t('3ショットごとに3問。正解するとパワーとアイテムが回復します。')}</p><label><input type="checkbox" checked={holdMode} onChange={e=>setHoldMode(e.target.checked)}/>{t('長押しして離すショット操作')}</label><p>{t('通常は2回タップ。1回目でゲージ開始、2回目でショット。画面をドラッグして探索、ダブルタップで視点を戻せます。')}</p><div className="sg-help-items">{(Object.keys(ITEM_INFO) as Item[]).filter(i=>i!=='normal').map(i=><article key={i}><ActionIcon kind={ITEM_INFO[i].icon}/><b>{t(ITEM_INFO[i].name)}</b><p>{t(ITEM_INFO[i].hint)}</p></article>)}</div><details><summary>{t('キー設定')}</summary>{(Object.keys(keys) as KeyAction[]).map(action=><button key={action} onClick={()=>setBinding(action)}>{t(action==='shot'?'ショット':action==='left'?'左に狙う':action==='right'?'右に狙う':action==='brake'?'空中ブレーキ':'時戻し')} : {binding===action?t('割り当てるキーを押してください'):keys[action]}</button>)}</details><div className="sg-menu-actions"><button onClick={()=>{setPaused(false);setHelp(false);launch(course.id);}}>{t('もう一度挑戦')}</button><button onClick={goTours}>{t('ツアー選択へ')}</button></div></section></div>}
 {creator&&<div className="sg-overlay"><section className="sg-menu" role="dialog" aria-modal="true" aria-label={t('キャラクタークリエイト')}><header><h2>{t('キャラクタークリエイト')}</h2><button onClick={()=>setCreator(false)}>{t('確定')}</button></header><AvatarCreator value={avatar} onChange={onAvatar} languageMode={languageMode} activity="golf"/></section></div>}
 {message&&<p role="alert" className="sg-message">{t(message)}</p>}
 </main></TranslatedUiTree>;
}
