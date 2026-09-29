import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageMode } from '../../types';
import { trans } from '../../utils/textUtils';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import MathText from '../../components/MathText';
import { drawProblemVisual } from '../../utils/drawProblemVisual';
import { MAP_SYMBOL_ASSET_MAP } from '../../components/mapSymbolImageMap';
import { storageService } from '../../services/storageService';
import { managementPortalService } from '../../services/managementPortalService';
import { audioService } from '../../services/audioService';
import { buildLesson, type LessonSelection } from '../gakuro-kart/questions';
import type { KartQuestion } from '../gakuro-kart/learning';
import { addPlayer, createWorld, BUILDINGS, MATERIALS, RECIPES, SIZE, type Building, type Material, type Reply, type Tool, type World } from './engine';
import { CraftRoom, loadIsland } from './network';
import { craftInviteUrl, normalizeCraftCode } from './invite';
import CraftCanvas, { COLORS } from './CraftCanvas';
import LessonPicker from './LessonPicker';
import './craft.css';

const ITEMS: Record<Material, [string, string]> = { wood:['🪵','木材'],stone:['🪨','石'],seed:['🌱','種'],crop:['🌾','作物'],fish:['🐟','魚'],plank:['🟫','木の床'],brick:['🧱','石のブロック'],flower:['🌷','花壇'],lamp:['🏮','ランタン'],bench:['🪑','ベンチ'] };
const TOOLS: [Tool,string,string][] = [['gather','⛏','採集'],['plant','🌱','種まき'],['water','💧','水やり'],['harvest','🌾','収穫'],['fish','🎣','釣り'],['build','🏡','建築'],['remove','↩','片づけ']];
type Quiz = Extract<Reply,{type:'quiz'}>;
type Answer = Extract<Reply,{type:'answer'}>;
function QuizDialog({quiz,answer,waiting,onAnswer,onNext,onClose,t}: {quiz:Quiz;answer:Answer|null;waiting:boolean;onAnswer:(i:number)=>void;onNext:()=>void;onClose:()=>void;t:(s:string)=>string}) {
  const canvas=useRef<HTMLCanvasElement>(null),q=quiz.question;
  useEffect(()=>{if(canvas.current&&q.visual)drawProblemVisual(canvas.current,q.visual);},[q]);
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();},[q]);
  const symbol=q.visual?.kind==='map_symbol'?MAP_SYMBOL_ASSET_MAP[q.visual.symbol]:null;
  return <div className="gc-shade"><section className="gc-quiz gc-panel" role="dialog" aria-modal="true" aria-label={t('問題で回復')}>
    <header><div><small>LEARNING BREAK</small><h2>{t('問題で回復')}</h2></div><button onClick={onClose} aria-label={t('閉じる')}>✕</button></header>
    <p>{t('正解でエネルギー +30。不正解でも減りません。')}</p>
    <div className="gc-question" data-allow-japanese="true">{q.passage&&<p>{q.passage}</p>}<MathText text={q.question}/></div>
    {q.visual&&(symbol?<img className="gc-visual" src={symbol.src} alt=""/>:<canvas ref={canvas} className="gc-visual" width={520} height={360}/>)}
    {q.audioPrompt&&<button onClick={()=>{if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.audioPrompt!.text);u.lang=q.audioPrompt!.lang||'ja-JP';u.rate=.85;window.speechSynthesis.speak(u);}}}>{t('聞く')}</button>}
    <div className="gc-options" data-allow-japanese="true">{q.options.map((o,i)=><button key={i} disabled={!!answer||waiting} onClick={()=>onAnswer(i)} className={answer&&o===answer.answer?'gc-correct':''}><b>{i+1}</b><MathText text={o}/></button>)}</div>
    {answer?<div className={`gc-feedback ${answer.correct?'good':''}`} role="status"><strong>{answer.correct?'〇':'×'} {t(answer.correct?'正解！エネルギー回復':'正答を確認しましょう')}</strong><span data-allow-japanese="true"><MathText text={answer.answer}/></span><div className="gc-row"><button onClick={onNext}>{t('次の問題')}</button><button className="gc-primary" onClick={onClose}>{t('島に戻る')}</button></div></div>:<small>{t('好きなときに島に戻れます。')}</small>}
  </section></div>;
}
export default function GakuroCraft({onClose,languageMode='JAPANESE',inviteCode='',allowHost=false}:{onClose:()=>void;languageMode?:LanguageMode;inviteCode?:string;allowHost?:boolean}) {
  const t=(s:string)=>trans(s,languageMode);
  const [world,setWorld]=useState<World|null>(null),[name,setName]=useState('Player'),[color,setColor]=useState(0),[code,setCode]=useState(inviteCode);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[picking,setPicking]=useState<'practice'|'create'|null>(null),[resume,setResume]=useState(false);
  const [selected,setSelected]=useState(-1),[tool,setTool]=useState<Tool>('gather'),[building,setBuilding]=useState<Building>('plank'),[panel,setPanel]=useState<'bag'|'help'|'invite'|null>(null),[zoom,setZoom]=useState(.95);
  const [quiz,setQuiz]=useState<Quiz|null>(null),[answer,setAnswer]=useState<Answer|null>(null),[waiting,setWaiting]=useState(false);
  const room=useRef<CraftRoom|null>(null),selection=useRef<LessonSelection|null>(null),recorded=useRef(new Set<string>()),input=useRef(new Set<string>()),mounted=useRef(true);
  const quizOpen=useRef(false),worldOpen=useRef(false),waitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const preview=useMemo(()=>{const w=createWorld(2026);addPlayer(w,'preview',name,color);w.tiles[17*SIZE+20].blocks=['plank','plank'];w.tiles[18*SIZE+22].blocks=['flower'];w.tiles[21*SIZE+18].blocks=['lamp'];return w;},[name,color]);
  const [saved]=useState(()=>!!loadIsland());
  const self=room.current?.selfId||'preview',me=world?.players[self];
  worldOpen.current=!!world;quizOpen.current=!!quiz||!!panel;
  const clearInput=()=>{input.current.clear();room.current?.sendCommand({type:'move',dx:0,dz:0});};
  const record=(r:Answer)=>{
    if(recorded.current.has(r.token))return;recorded.current.add(r.token);
    const q=r.question,assignment=room.current?.host?selection.current?.assignment:undefined;
    const result={mode:q.mode,subjectId:q.mode,correct:r.correct,elapsedMs:r.elapsedMs,problemId:q.problemId,problemKey:q.problemId||`${q.mode}:${q.question}`,question:q.question,correctAnswer:r.answer,selectedAnswer:r.selected};
    storageService.saveAssignmentAnswer({...result,assignmentId:assignment?.id,unitName:q.unitName,answeredAt:new Date().toISOString()});
    if(assignment)managementPortalService.queueAnswer(assignment,result);managementPortalService.queueLearningActivity(result,assignment);
  };
  const newRoom=()=>{
    room.current?.close();recorded.current.clear();input.current.clear();
    if(waitTimer.current)clearTimeout(waitTimer.current);
    setQuiz(null);setAnswer(null);setWaiting(false);setPanel(null);setSelected(-1);
    const r=new CraftRoom(w=>{if(mounted.current)setWorld(w);},reply=>{
      if(!mounted.current)return;
      if(reply.type==='notice')setNotice(reply.text);
      else if(reply.type==='quiz'){setQuiz(reply);setAnswer(null);setWaiting(false);clearInput();}
      else {setAnswer(reply);setWaiting(false);record(reply);}
      if(waitTimer.current)clearTimeout(waitTimer.current);
    },s=>{if(mounted.current){setError(s);setBusy(false);}});room.current=r;return r;
  };
  useEffect(()=>{
    mounted.current=true;audioService.stopBGM();
    const key=(e:KeyboardEvent,down:boolean)=>{if(!worldOpen.current||quizOpen.current||(e.target as HTMLElement)?.closest('input,textarea,select'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();if(down)input.current.add(k);else input.current.delete(k);}};
    const kd=(e:KeyboardEvent)=>key(e,true),ku=(e:KeyboardEvent)=>key(e,false),stop=()=>clearInput();window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
    const timer=setInterval(()=>{if(!worldOpen.current)return;const i=input.current,u=Number(i.has('w')||i.has('arrowup')),d=Number(i.has('s')||i.has('arrowdown')),l=Number(i.has('a')||i.has('arrowleft')),r=Number(i.has('d')||i.has('arrowright'));let dx=(r-l+d-u)/Math.SQRT2,dz=(l-r+d-u)/Math.SQRT2;if(quizOpen.current||document.hidden)dx=dz=0;const n=Math.max(1,Math.hypot(dx,dz));room.current?.sendCommand({type:'move',dx:dx/n,dz:dz/n});},100);
    return()=>{mounted.current=false;clearInterval(timer);if(waitTimer.current)clearTimeout(waitTimer.current);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);room.current?.close();};
  },[]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer);},[notice]);
  useEffect(()=>{clearInput();},[quiz?.token,panel]);
  const enter=async(sel:LessonSelection)=>{
    if(!allowHost||!picking)return;setBusy(true);setError('');selection.current=sel;
    try {const first=buildLesson(sel),unique=new Map<string,KartQuestion>();for(let i=0;i<12;i++)for(const q of (i?buildLesson(sel):first).questions)unique.set(`${q.mode}:${q.question}`,q);
      const r=newRoom();if(picking==='create')await r.create(name,color,[...unique.values()],first.title,resume);else r.practice(name,color,[...unique.values()],first.title,resume);
      if(mounted.current){setPicking(null);setSelected(-1);setPanel('help');}
    }catch(e){room.current?.close();setWorld(null);if(mounted.current)setError(e instanceof Error?e.message:String(e));}finally{if(mounted.current)setBusy(false);}
  };
  const join=async()=>{setBusy(true);setError('');try{await newRoom().join(code,name,color);if(mounted.current)setPanel('help');}catch(e){room.current?.close();if(mounted.current){setWorld(null);setError(e instanceof Error?e.message:String(e));}}finally{if(mounted.current)setBusy(false);}};
  const ask=()=>{clearInput();setPanel(null);setWaiting(true);room.current?.sendCommand({type:'quiz'});if(waitTimer.current)clearTimeout(waitTimer.current);waitTimer.current=setTimeout(()=>{setWaiting(false);},4000);};
  const respond=(i:number)=>{if(!quiz)return;setWaiting(true);room.current?.sendCommand({type:'answer',token:quiz.token,option:i});if(waitTimer.current)clearTimeout(waitTimer.current);waitTimer.current=setTimeout(()=>setWaiting(false),4000);};
  const leave=()=>{clearInput();room.current?.close();room.current=null;setWorld(null);setQuiz(null);setAnswer(null);setPanel(null);setError('');onClose();};
  const pad=(key:string)=>({onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);input.current.add(key);},onPointerUp:()=>input.current.delete(key),onPointerCancel:()=>input.current.delete(key),onLostPointerCapture:()=>input.current.delete(key)});
  const invite=world&&room.current?.code?craftInviteUrl(window.location.href,room.current.code):'';
  return <TranslatedUiTree mode={languageMode}><main className={`gc-root ${world?'gc-playing':''}`}>
    <CraftCanvas world={world||preview} selfId={world?self:'preview'} selected={selected} zoom={zoom} onSelect={i=>{if(world&&!quiz&&!panel)setSelected(i);}}/>
    {!world&&!picking?<div className="gc-welcome"><section className="gc-panel gc-lobby"><div className="gc-eyebrow">LEARNING ROGUE · ISLAND LIFE</div><h1>{t('学ロクラフト')}</h1><p>{t('学んで、つくって、みんなで暮らす。')}</p><div className="gc-tags"><span>{t('最大40人')}</span><span>{t('共有の島')}</span><span>{t('開発中')}</span></div>
      <label>{t('名前')}<input maxLength={16} value={name} disabled={busy} onChange={e=>setName(e.target.value)} /></label><div className="gc-colors">{COLORS.map((c,i)=><button key={c} aria-label={`${t('カラー')} ${i+1}`} aria-pressed={color===i} style={{background:c}} onClick={()=>setColor(i)} disabled={busy}>{color===i?'✓':''}</button>)}</div>
      {allowHost&&<><div className="gc-row"><button className="gc-primary" disabled={busy||!name.trim()} onClick={()=>setPicking('create')}>{t('みんなの島を開く')}</button><button disabled={busy||!name.trim()} onClick={()=>setPicking('practice')}>{t('ひとりで遊ぶ')}</button></div>{saved&&<label className="gc-checkbox"><input type="checkbox" checked={resume} onChange={e=>setResume(e.target.checked)}/>{t('保存した島を続ける')}</label>}</>}
      <div className="gc-join"><label>{t('招待コード')}<input autoCapitalize="characters" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC234" disabled={busy}/></label><button disabled={busy||!normalizeCraftCode(code)||!name.trim()} onClick={join}>{t('島に参加')}</button></div>
      {busy&&<p role="status">{t('島と問題を準備中…')}</p>}{error&&<p className="gc-error" role="alert">{t(error)}</p>}<button className="gc-quiet" onClick={leave}>{t('タイトルへ戻る')}</button>
    </section></div>:null}
    {picking&&<LessonPicker languageMode={languageMode} busy={busy} error={error} onSelect={enter} onBack={()=>{if(!busy){setPicking(null);setError('');}}}/>}
    {world&&me&&<>
      <header className="gc-hud gc-panel"><div><b>{t('学ロクラフト')}</b><small>DAY {1+Math.floor(world.time/240)} · {Object.keys(world.players).length}/40</small></div><div className="gc-energy"><span>⚡ {t('エネルギー')} <b>{Math.floor(me.energy)}/100</b></span><progress value={me.energy} max={100}/></div><button onClick={()=>setPanel(panel==='help'?null:'help')} aria-label={t('遊び方')}>?</button><button onClick={leave}>{t('退出')}</button></header>
      <aside className="gc-goal gc-panel"><small>{t('島のみんなの記録')}</small><b>🌾 {world.harvested}　🏡 {world.built}　★ {world.donated}</b><span>{t('広場に作物か魚を納品すると種がもらえます。')}</span><button onClick={()=>room.current?.sendCommand({type:'donate'})}>{t('広場で納品')}</button></aside>
      <div className="gc-top-actions"><button onClick={()=>setPanel(panel==='bag'?null:'bag')}>🎒 {t('持ち物とクラフト')}</button>{invite&&<button onClick={()=>setPanel(panel==='invite'?null:'invite')}>↗ {t('招待')}</button>}<div className="gc-row"><button aria-label={t('縮小')} onClick={()=>setZoom(z=>Math.max(.55,z-.15))}>−</button><button aria-label={t('拡大')} onClick={()=>setZoom(z=>Math.min(1.5,z+.15))}>＋</button></div></div>
      {(world.paused||error)&&<div className="gc-status" role="status">{t(world.paused?'ホストが戻るまで一時停止中です。':error)}</div>}
      {notice&&<div className="gc-toast" role="status">{t(notice)}</div>}
      <div className="gc-pad" aria-label={t('移動')}><button {...pad('arrowup')} aria-label={t('上')}>↑</button><button {...pad('arrowleft')} aria-label={t('左')}>←</button><div>✥</div><button {...pad('arrowright')} aria-label={t('右')}>→</button><button {...pad('arrowdown')} aria-label={t('下')}>↓</button></div>
      <button className="gc-study" onClick={ask} disabled={world.paused||waiting}>⚡ {t('問題で回復')}<small>{t('正解ごとに +30')}</small></button>
      <footer className="gc-toolbar gc-panel"><div className="gc-tools">{TOOLS.map(([value,icon,label])=><button key={value} aria-pressed={tool===value} onClick={()=>{setTool(value);if(value==='build')setPanel('bag');}}><span>{icon}</span>{t(label)}</button>)}</div><div className="gc-action-row"><span>{selected<0?t('近くのマスをタップして選択'):tool==='build'?`${ITEMS[building][0]} ${t(ITEMS[building][1])} · ${me.bag[building]}`:`${selected%SIZE}, ${Math.floor(selected/SIZE)}`}</span><button className="gc-primary" disabled={selected<0||world.paused||!!quiz} onClick={()=>room.current?.sendCommand({type:'act',tool,tile:selected,building})}>{t('選んだ場所で作業')}</button></div></footer>
      {panel&&<div className="gc-shade"><section className="gc-panel gc-sheet" role="dialog" aria-modal="true" aria-label={t(panel==='bag'?'持ち物とクラフト':panel==='invite'?'招待':'遊び方')}><header><h2>{t(panel==='bag'?'持ち物とクラフト':panel==='invite'?'招待':'遊び方')}</h2><button onClick={()=>setPanel(null)} aria-label={t('閉じる')}>✕</button></header>
        {panel==='bag'?<><div className="gc-inventory">{MATERIALS.map(k=><div key={k}><span>{ITEMS[k][0]}</span><small>{t(ITEMS[k][1])}</small><b>{me.bag[k]}</b></div>)}</div><h3>{t('材料からつくる')}</h3><div className="gc-recipes">{BUILDINGS.map(b=><div key={b}><span><b>{ITEMS[b][0]} {t(ITEMS[b][1])}</b><small>{Object.entries(RECIPES[b]).map(([k,n])=>`${t(ITEMS[k as Material][1])} ×${n}`).join(' / ')} · ⚡3</small></span><button disabled={me.energy<3||Object.entries(RECIPES[b]).some(([k,n])=>me.bag[k as Material]<n!)} onClick={()=>room.current?.sendCommand({type:'craft',material:b})}>{t('つくる')}</button><button disabled={!me.bag[b]} onClick={()=>{setBuilding(b);setTool('build');setPanel(null);}}>{t('置く')}</button></div>)}</div></>:panel==='invite'?<><p>{t('このリンクからはデバッグ設定なしで参加できます。')}</p><strong className="gc-room-code">{room.current?.code}</strong><input readOnly aria-label={t('招待リンク')} value={invite} onFocus={e=>e.target.select()}/><button className="gc-primary" onClick={async()=>{try{await navigator.clipboard.writeText(invite);setNotice('コピーしました');}catch{setNotice('リンクを選択してコピーしてください。');}}}>{t('招待URLをコピー')}</button><p>{t('ホストの画面を開いたまま遊んでください。')}</p></>:<><p>{t('矢印キー・WASD、または画面左下の矢印で移動。')}</p><p>{t('近くのマスを選び、道具を選んで「選んだ場所で作業」を押します。')}</p><p>{t('木や石を採集してクラフト。床は橋になり、ブロックは4段まで積めます。')}</p><p>{t('種は90秒で成長。水やりで45秒に短縮。海や川では釣りができます。')}</p><p>{t('エネルギーがなくなっても「問題で回復」で再開できます。')}</p><p>{t('島はホストの端末に自動保存。次回は「保存した島を続ける」を選べます。')}</p><button className="gc-primary" onClick={()=>setPanel(null)}>{t('島に戻る')}</button></>}
      </section></div>}
      {quiz&&<QuizDialog quiz={quiz} answer={answer} waiting={waiting||world.paused} onAnswer={respond} onNext={ask} onClose={()=>{setQuiz(null);setAnswer(null);clearInput();}} t={t}/>}
    </>}
  </main></TranslatedUiTree>;
}
