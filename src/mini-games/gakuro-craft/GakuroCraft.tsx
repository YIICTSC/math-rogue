import '../shared/lobby.css';
import HostSpectator, { useSpectatorTarget } from '../shared/HostSpectator';
import HomeView from './HomeView';
import { homeAt, roomTile } from './homeSocial';
import {VirtualStick,MovementSettings} from './TouchControls';
import {loadTouchControl,saveTouchControl,type TouchControl} from './touchInput';
import {CENTER_X,CENTER_Z,MAP_WIDTH,MAP_HEIGHT} from './map';
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
import { addPlayer, createWorld, CRAFTABLES, MATERIALS, RECIPES, SIZE, type Building, type Material, type Reply, type Tool, type World } from './engine';
import { CraftRoom, loadIsland } from './network';
import { craftInviteUrl, normalizeCraftCode } from './invite';
import { copyInviteUrl } from '../shared/copyInviteUrl';
import CraftCanvas from './CraftCanvas';
import LessonPicker from './LessonPicker';
import AvatarCreator from './AvatarCreator';
import { loadAvatar, saveAvatar } from './avatar';
import { CraftSound } from './sound';
import {village,shopRows} from './progression';
import {GoalsPanel,HomePanel} from './GoalsPanel';
import {gameOf} from './homeGames';
import './craft.css';

const ITEMS: Record<Material, [string, string]> = { wood:['🪵','木材'],stone:['🪨','石'],seed:['🌱','種'],crop:['🌾','作物'],fish:['🐟','魚'],plank:['🟫','木の床'],brick:['🧱','石のブロック'],flower:['🌷','花壇'],lamp:['🏮','ランタン'],bench:['🪑','ベンチ'],roof:['🏠','屋根'],fence:['🚧','フェンス'],window:['🪟','窓'],campfire:['🔥','たき火'],fruit:['🍎','果実'],meal:['🍲','料理'] };
const TOOLS: [Tool,string,string][] = [['gather','⛏','採集'],['pick','🍎','果実摘み'],['plant','🌱','種まき'],['water','💧','水やり'],['harvest','🌾','収穫'],['fish','🎣','釣り'],['build','🏡','建築'],['remove','↩','片づけ']];
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
  const [selected,setSelected]=useState(-1),[tool,setTool]=useState<Tool>('gather'),[building,setBuilding]=useState<Building>('plank'),[panel,setPanel]=useState<'bag'|'help'|'invite'|'avatar'|'goals'|'home'|'controls'|null>(null),[zoom,setZoom]=useState(.95);
  const [quiz,setQuiz]=useState<Quiz|null>(null),[answer,setAnswer]=useState<Answer|null>(null),[waiting,setWaiting]=useState(false);
  const [avatar,setAvatar]=useState(loadAvatar),[soundOn,setSoundOn]=useState(()=>{try{return localStorage.getItem('gakuro-craft-sound')!=='off';}catch{return true;}});
  const sound=useRef<CraftSound|null>(null),workTimer=useRef<ReturnType<typeof setInterval>|null>(null),workAction=useRef(()=>{}),biteSound=useRef(0);
  const previousBgm=useRef<ReturnType<typeof audioService.getCurrentBgmPlayback>>(null);
  const room=useRef<CraftRoom|null>(null),selection=useRef<LessonSelection|null>(null),recorded=useRef(new Set<string>()),input=useRef(new Set<string>()),mounted=useRef(true);
  const quizOpen=useRef(false),worldOpen=useRef(false),waitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const preview=useMemo(()=>{const w=createWorld(2026);addPlayer(w,'preview',name,color,avatar);w.tiles[(CENTER_Z-3)*SIZE+CENTER_X].blocks=['plank','plank'];w.tiles[(CENTER_Z-2)*SIZE+CENTER_X+2].blocks=['flower'];w.tiles[(CENTER_Z+1)*SIZE+CENTER_X-2].blocks=['lamp'];return w;},[name,color,avatar]);
  const [touchControl,setTouchControl]=useState<TouchControl>(loadTouchControl),analog=useRef<{dx:number;dz:number}|null>(null);
  const [saved]=useState(()=>!!loadIsland());
  const self=room.current?.selfId||'preview',me=world?.players[self];
  const spectating=!!me?.spectator;
  const candidates=Object.values((world?.players||{}) as World['players']).filter(p=>p.id!==self&&!p.spectator);
  const spectators=useSpectatorTarget(spectating,candidates.map(p=>p.id));
  const watched=world?.players[spectators.target||''];
  const watchedHome=world&&watched?.indoors?homeAt(world,roomTile(watched)):undefined;
  useEffect(()=>{room.current?.observe(spectating?spectators.target:null);},[spectating,spectators.target]);
  const activeGame=world?gameOf(world,self):undefined;
  const craftBgm:Exclude<Parameters<typeof audioService.playBGM>[0],'random'>=
    !world?(picking?'relic_select':'menu')
    :quiz||waiting?'math'
    :activeGame?.phase==='finished'?'reward'
    :activeGame?.phase==='playing'?'poker_play'
    :activeGame?'kocho_setup'
    :me?.indoors||panel==='home'?'rest'
    :panel==='bag'?'shop'
    :panel==='goals'?'event'
    :'map';
  const craftBgmLoops=craftBgm!=='reward';
  worldOpen.current=!!world&&!spectating;quizOpen.current=!!quiz||!!panel||waiting;
  const clearInput=()=>{if(workTimer.current){clearInterval(workTimer.current);workTimer.current=null;}input.current.clear();analog.current=null;room.current?.sendCommand({type:'move',dx:0,dz:0});};
  const record=(r:Answer)=>{
    if(recorded.current.has(r.token))return;recorded.current.add(r.token);
    const q=r.question,assignment=room.current?.host?selection.current?.assignment:undefined;
    const result={mode:q.mode,subjectId:q.mode,correct:r.correct,elapsedMs:r.elapsedMs,problemId:q.problemId,problemKey:q.problemId||`${q.mode}:${q.question}`,question:q.question,correctAnswer:r.answer,selectedAnswer:r.selected};
    storageService.saveAssignmentAnswer({...result,assignmentId:assignment?.id,unitName:q.unitName,answeredAt:new Date().toISOString()});
    if(assignment)managementPortalService.queueAnswer(assignment,result);managementPortalService.queueLearningActivity(result,assignment);
  };
  const newRoom=()=>{
    clearInput();room.current?.close();recorded.current.clear();
    if(waitTimer.current)clearTimeout(waitTimer.current);
    setQuiz(null);setAnswer(null);setWaiting(false);setPanel(null);setSelected(-1);
    const r=new CraftRoom(w=>{if(mounted.current)setWorld(w);},reply=>{
      if(!mounted.current)return;
      if(reply.type==='notice'){setNotice(reply.text);sound.current?.play(reply.cue||'error');if(!reply.cue&&workTimer.current){clearInterval(workTimer.current);workTimer.current=null;}if(reply.cue&&navigator.vibrate)navigator.vibrate(12);}
      else if(reply.type==='quiz'){setQuiz(reply);setAnswer(null);setWaiting(false);clearInput();}
      else {sound.current?.play(reply.correct?'correct':'wrong');setAnswer(reply);setWaiting(false);record(reply);}
      if(waitTimer.current)clearTimeout(waitTimer.current);
    },s=>{if(mounted.current){setError(s);setBusy(false);}});try{let profile=localStorage.getItem('gakuro-craft-profile');if(!profile||! /^[A-Za-z0-9-]{8,64}$/.test(profile)){profile=crypto.randomUUID();localStorage.setItem('gakuro-craft-profile',profile);}r.profileId=profile;}catch{}room.current=r;return r;
  };
  useEffect(()=>{
    mounted.current=true;previousBgm.current=audioService.getCurrentBgmPlayback();audioService.stopBGM();const audio=new CraftSound();sound.current=audio;const hobbySound=(e:Event)=>audio.play((e as CustomEvent<string>).detail);window.addEventListener('craft-hobby-sound',hobbySound);
    window.addEventListener('pointerdown',audio.unlock,true);window.addEventListener('touchstart',audio.unlock,true);window.addEventListener('keydown',audio.unlock,true);
    let lastPosition:{x:number;z:number}|null=null;const steps=setInterval(()=>{const p=room.current?.world?.players[room.current.selfId];if(p&&!quizOpen.current&&!document.hidden){if(lastPosition&&Math.hypot(p.x-lastPosition.x,p.z-lastPosition.z)>.15)audio.play('step');lastPosition={x:p.x,z:p.z};}else lastPosition=null;},280);
    const key=(e:KeyboardEvent,down:boolean)=>{if(!worldOpen.current||quizOpen.current||(e.target as HTMLElement)?.closest('input,textarea,select'))return;const k=e.key.toLowerCase();if(down&&!e.repeat&&(k==='e'||k===' ')&&!(e.target as HTMLElement)?.closest('button')){e.preventDefault();workAction.current();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();if(down)input.current.add(k);else input.current.delete(k);}};
    const kd=(e:KeyboardEvent)=>key(e,true),ku=(e:KeyboardEvent)=>key(e,false),stop=()=>clearInput();window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
    const timer=setInterval(()=>{if(!worldOpen.current)return;const i=input.current,u=Number(i.has('w')||i.has('arrowup')),d=Number(i.has('s')||i.has('arrowdown')),l=Number(i.has('a')||i.has('arrowleft')),r=Number(i.has('d')||i.has('arrowright'));let dx=(r-l+d-u)/Math.SQRT2,dz=(l-r+d-u)/Math.SQRT2;if(analog.current){dx=analog.current.dx;dz=analog.current.dz;}if(quizOpen.current||document.hidden)dx=dz=0;const n=Math.max(1,Math.hypot(dx,dz));room.current?.sendCommand({type:'move',dx:dx/n,dz:dz/n});},100);
    return()=>{mounted.current=false;clearInterval(timer);clearInterval(steps);clearInput();window.removeEventListener('pointerdown',audio.unlock,true);window.removeEventListener('touchstart',audio.unlock,true);window.removeEventListener('keydown',audio.unlock,true);window.removeEventListener('craft-hobby-sound',hobbySound);audio.close();if(waitTimer.current)clearTimeout(waitTimer.current);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop);room.current?.close();const previous=previousBgm.current;previousBgm.current=null;if(previous){void audioService.playBGM(previous.type as Exclude<Parameters<typeof audioService.playBGM>[0],'random'>,previous.loop,previous.options).then(()=>{if(previous.paused&&audioService.getCurrentBgmType()===previous.type)return audioService.pauseBGM();});}else audioService.stopBGM();};
  },[]);
  useEffect(()=>{void audioService.playBGM(craftBgm,craftBgmLoops);},[craftBgm,craftBgmLoops]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer);},[notice]);
  useEffect(()=>{clearInput();},[quiz?.token,panel]);
  useEffect(()=>{if(world?.paused||me?.indoors)clearInput();},[world?.paused,me?.indoors]);
  useEffect(()=>{const f=me?.fishing;if(f&&world&&world.time>=f.biteAt&&biteSound.current!==f.biteAt){biteSound.current=f.biteAt;sound.current?.play('bite');}},[me?.fishing,world?.time]);
  useEffect(()=>{if(me?.indoors&&!spectating)setPanel('home');},[me?.indoors]);
  const enter=async(sel:LessonSelection)=>{
    if(!allowHost||!picking)return;setBusy(true);setError('');selection.current=sel;
    try {const first=buildLesson(sel),unique=new Map<string,KartQuestion>();for(let i=0;i<12;i++)for(const q of (i?buildLesson(sel):first).questions)unique.set(`${q.mode}:${q.question}`,q);
      const r=newRoom();if(picking==='create')await r.create(name,color,[...unique.values()],first.title,resume,avatar);else r.practice(name,color,[...unique.values()],first.title,resume,avatar);
      if(mounted.current){setPicking(null);setSelected(-1);setPanel(room.current?.code?'invite':'help');}
    }catch(e){room.current?.close();setWorld(null);if(mounted.current)setError(e instanceof Error?e.message:String(e));}finally{if(mounted.current)setBusy(false);}
  };
  const join=async()=>{setBusy(true);setError('');try{await newRoom().join(code,name,color,avatar);if(mounted.current)setPanel(room.current?.code?'invite':'help');}catch(e){room.current?.close();if(mounted.current){setWorld(null);setError(e instanceof Error?e.message:String(e));}}finally{if(mounted.current)setBusy(false);}};
  const ask=()=>{clearInput();setPanel(null);setWaiting(true);room.current?.sendCommand({type:'quiz'});if(waitTimer.current)clearTimeout(waitTimer.current);waitTimer.current=setTimeout(()=>{setWaiting(false);},4000);};
  const respond=(i:number)=>{if(!quiz)return;setWaiting(true);room.current?.sendCommand({type:'answer',token:quiz.token,option:i});if(waitTimer.current)clearTimeout(waitTimer.current);waitTimer.current=setTimeout(()=>setWaiting(false),4000);};
  const leave=()=>{clearInput();room.current?.close();room.current=null;setWorld(null);setQuiz(null);setAnswer(null);setPanel(null);setError('');onClose();};
  const movementBlocked=!!(world?.paused||quiz||panel||waiting||me?.indoors);
  const chooseTouchControl=(value:TouchControl)=>{clearInput();setTouchControl(value);saveTouchControl(value);};
  const stickMove=(value:{dx:number;dz:number}|null)=>{analog.current=value;if(!value)room.current?.sendCommand({type:'move',dx:0,dz:0});};
  const pad=(key:string)=>({onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{if(movementBlocked||e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);input.current.add(key);},onPointerUp:()=>input.current.delete(key),onPointerCancel:()=>input.current.delete(key),onLostPointerCapture:()=>input.current.delete(key)});
  const changeAvatar=(a:typeof avatar)=>{setAvatar(a);setColor(a.shirt);saveAvatar(a);};
  const work=()=>{if(selected<0||world?.paused||quiz||panel)return;sound.current?.unlock();room.current?.sendCommand({type:'act',tool,tile:tool==='fish'?me?.fishing?.tile??selected:selected,building});};workAction.current=work;
  const startWork=(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);stopWork();work();if(['gather','build','remove'].includes(tool))workTimer.current=setInterval(work,420);};
  const stopWork=()=>{if(workTimer.current)clearInterval(workTimer.current);workTimer.current=null;};
  const closePanel=()=>{if(me?.indoors)room.current?.sendCommand({type:'home_leave'});setPanel(null);};
  const changeSpectator=(value:boolean)=>{clearInput();setQuiz(null);setAnswer(null);setWaiting(false);setPanel(null);setSelected(-1);room.current?.setSpectator(value);};
  const settlement=world?village(world):null;
  const invite=world&&room.current?.host&&room.current?.code?craftInviteUrl(window.location.href,room.current.code):'';
  return <TranslatedUiTree mode={languageMode}><main className={`gc-root ${world?'gc-playing':''}`}>
    <CraftCanvas world={world||preview} selfId={world?(spectating?spectators.target||self:self):'preview'} selected={selected} zoom={zoom} onSelect={i=>{if(world&&!spectating&&!quiz&&!panel)setSelected(i);}}/>
    {world&&spectating&&room.current?.host&&room.current.code&&<HostSpectator enabled={spectating} onChange={changeSpectator} name={watched?.name} count={candidates.length} onNext={spectators.next} languageMode={languageMode}>{watched&&<><span>⚡ {Math.floor(watched.energy)}/100</span><span>{t('正解')} {watched.correct}</span><span>{t(watched.indoors?'家の中':'島を探索中')}</span></>}{spectating&&<><button onClick={()=>setPanel('invite')}>{t('参加者')}</button><button onClick={leave}>{t('退出')}</button></>}</HostSpectator>}
    {spectating&&watchedHome&&watched&&world&&<div className="gc-spectator-home"><HomeView home={watchedHome} slot={-1} onSelect={()=>{}} t={t} avatar={watched.avatar} time={world.time}/></div>}
    {!world&&!picking?<div className="gc-welcome"><section className="gc-panel gc-lobby"><div className="gc-eyebrow">LEARNING ROGUE · ISLAND LIFE</div><h1>{t('学ロクラフト')}</h1><p>{t('学んで、つくって、みんなで暮らす。')}</p><div className="gc-tags"><span>{t('最大40人')}</span><span>{t('共有の島')}</span><span>{t('開発中')}</span></div>
      <label>{t('名前')}<input maxLength={16} value={name} disabled={busy} onChange={e=>setName(e.target.value)} /></label><details className="gc-character"><summary>{t('キャラクタークリエイト')}</summary><AvatarCreator value={avatar} onChange={changeAvatar} t={t}/></details>
      {allowHost&&<><div className="gc-row"><button className="gc-primary" disabled={busy||!name.trim()} onClick={()=>setPicking('create')}>{t('みんなの島を開く')}</button><button disabled={busy||!name.trim()} onClick={()=>setPicking('practice')}>{t('ひとりで遊ぶ')}</button></div>{saved&&<label className="gc-checkbox"><input type="checkbox" checked={resume} onChange={e=>setResume(e.target.checked)}/>{t('保存した島を続ける')}</label>}</>}
      <div className="gc-join"><label>{t('招待コード')}<input autoCapitalize="characters" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC234" disabled={busy}/></label><button disabled={busy||!normalizeCraftCode(code)||!name.trim()} onClick={join}>{t('島に参加')}</button></div>
      {busy&&<p role="status">{t('島と問題を準備中…')}</p>}{error&&<p className="gc-error" role="alert">{t(error)}</p>}<button className="gc-quiet" onClick={leave}>{t('タイトルへ戻る')}</button>
    </section></div>:null}
    {picking&&<LessonPicker languageMode={languageMode} busy={busy} error={error} onSelect={enter} onBack={()=>{if(!busy){setPicking(null);setError('');}}}/>}
    {world&&panel==='invite'&&<div className="gc-shade"><section className="gc-panel gc-collection online-collection" role="dialog" aria-modal="true" aria-label={t('参加者')}><header><h2>{t('参加者')} · {Object.keys(world.players).length} / 40</h2><button onClick={()=>setPanel(null)}>{t('閉じる')}</button></header><div className="gc-collection-info"><strong className="gc-room-code">{room.current?.code}</strong><input readOnly aria-label={t('招待リンク')} value={invite} onFocus={e=>e.target.select()}/><button onClick={async()=>setNotice(await copyInviteUrl(invite)?'コピーしました':'リンクを選択してコピーしてください。')}>{t('招待URLをコピー')}</button></div><div className="gc-collection-roster online-roster" data-allow-japanese="true">{Object.values(world.players).map(p=><div key={p.id} data-self={p.id===self}><b className="online-member-name">{p.name}</b>{p.id===self&&<small>{t('あなた')}</small>}{p.spectator&&<small>{t('観戦モード')}</small>}</div>)}</div><footer>{room.current?.host&&<button onClick={()=>changeSpectator(!spectating)}>{t(spectating?'プレイに戻る':'観戦モードにする')}</button>}<button className="gc-primary" onClick={()=>setPanel(null)}>{t('島に戻る')}</button></footer></section></div>}
    {world&&me&&!spectating&&<>
      <header className="gc-hud gc-panel"><div><b>{t('学ロクラフト')}</b><small>DAY {1+Math.floor(world.time/240)} · {Object.keys(world.players).length}/40 · {MAP_WIDTH}×{MAP_HEIGHT}</small></div><div className="gc-energy"><span>⚡ {t('エネルギー')} <b>{Math.floor(me.energy)}/100</b></span><progress value={me.energy} max={100}/></div><button onClick={()=>setPanel(panel==='help'?null:'help')} aria-label={t('遊び方')}>?</button><button onClick={leave}>{t('退出')}</button></header>
      <aside className="gc-goal gc-panel"><small>{t(settlement!.stage.name)}</small><b>🌿 {settlement!.score} / {settlement!.next?.need??settlement!.score}</b><progress max={settlement!.next?.need||Math.max(1,settlement!.score)} value={settlement!.score}/><button onClick={()=>setPanel('goals')}>{t('島の発展と依頼')}</button><button onClick={()=>room.current?.sendCommand({type:'donate'})}>{t('広場で納品')}</button></aside>
      <div className="gc-top-actions">{room.current?.host&&room.current.code&&<button onClick={()=>changeSpectator(true)}>{t('観戦モードにする')}</button>}<button onClick={()=>setPanel('controls')}>{t('移動操作')}</button><button onClick={()=>setPanel('home')}>🏡 {t('自分の家')}</button><button onClick={()=>{sound.current?.unlock();setSoundOn(sound.current?.toggle()??true);}} aria-pressed={soundOn}>{soundOn?'🔊':'🔇'} SE</button><button onClick={()=>setPanel('avatar')}>☺ {t('見た目')}</button><button onClick={()=>setPanel(panel==='bag'?null:'bag')}>🎒 {t('持ち物とクラフト')}</button>{invite&&<button onClick={()=>setPanel(panel==='invite'?null:'invite')}>↗ {t('参加者')}</button>}<div className="gc-row"><button aria-label={t('縮小')} onClick={()=>setZoom(z=>Math.max(.55,z-.15))}>−</button><button aria-label={t('拡大')} onClick={()=>setZoom(z=>Math.min(1.5,z+.15))}>＋</button></div></div>
      {(world.paused||error)&&<div className="gc-status" role="status">{t(world.paused?'ホストが戻るまで一時停止中です。':error)}</div>}
      {me.fishing&&<div className={`gc-fishing ${world.time>=me.fishing.biteAt?'bite':''}`} role="status">🎣 {t(world.time>=me.fishing.biteAt?'今！引き上げよう！':'魚を待っています…')}<progress max={1.5} value={Math.max(0,me.fishing.expires-world.time)}/></div>}{notice&&<div className="gc-toast" role="status">{t(notice)}</div>}
      {touchControl==='stick'?<div className="gc-pad gc-stick-pad" aria-label={t('移動')}><VirtualStick disabled={movementBlocked} t={t} onMove={stickMove}/></div>:<div className="gc-pad" aria-label={t('移動')}><button disabled={movementBlocked} {...pad('arrowup')} aria-label={t('上')}>↑</button><button disabled={movementBlocked} {...pad('arrowleft')} aria-label={t('左')}>←</button><div>✥</div><button disabled={movementBlocked} {...pad('arrowright')} aria-label={t('右')}>→</button><button disabled={movementBlocked} {...pad('arrowdown')} aria-label={t('下')}>↓</button></div>}
      <button className="gc-study" onClick={ask} disabled={world.paused||waiting}>⚡ {t('問題で回復')}<small>{t('正解ごとに +30')}</small></button>
      <footer className="gc-toolbar gc-panel"><small className="gc-work-tip">{t('作業ボタンを長押しで連続作業')} · 🪙 {me.coins||0}{me.buffUntil>world.time?' · 🍲 '+Math.ceil(me.buffUntil-world.time)+'s':''}</small><div className="gc-tools">{TOOLS.map(([value,icon,label])=><button key={value} aria-pressed={tool===value} onClick={()=>{setTool(value);if(value==='build')setPanel('bag');}}><span>{icon}</span>{t(label)}</button>)}</div><div className="gc-action-row"><span>{selected<0?t('近くのマスをタップして選択'):tool==='build'?`${ITEMS[building][0]} ${t(ITEMS[building][1])} · ${me.bag[building]}`:`${selected%SIZE}, ${Math.floor(selected/SIZE)}`}</span><button className="gc-primary" disabled={selected<0||world.paused||!!quiz} onPointerDown={startWork} onPointerUp={stopWork} onPointerCancel={stopWork} onLostPointerCapture={stopWork} onClick={e=>{if(e.detail===0)work();}}>{t(me.fishing?'引き上げる':'選んだ場所で作業')}</button></div></footer>
      {panel&&panel!=='invite'&&<div className="gc-shade"><section className="gc-panel gc-sheet" role="dialog" aria-modal="true" aria-label={t(panel==='bag'?'持ち物とクラフト':panel==='avatar'?'キャラクタークリエイト':panel==='goals'?'島の発展と依頼':panel==='home'?'自分の家':panel==='controls'?'移動操作':'遊び方')}><header><h2>{t(panel==='bag'?'持ち物とクラフト':panel==='avatar'?'キャラクタークリエイト':panel==='goals'?'島の発展と依頼':panel==='home'?'自分の家':panel==='controls'?'移動操作':'遊び方')}</h2><button onClick={closePanel} aria-label={t('閉じる')}>✕</button></header>
        {panel==='controls'?<><MovementSettings value={touchControl} onChange={chooseTouchControl} t={t}/><button className="gc-primary" onClick={()=>setPanel(null)}>{t('島に戻る')}</button></>:panel==='goals'?<GoalsPanel world={world} me={me} t={t} items={ITEMS} send={c=>room.current?.sendCommand(c)}/>:panel==='home'?<HomePanel world={world} me={me} t={t} items={ITEMS} selected={selected} onChooseLand={closePanel} onStudy={ask} onDress={()=>setPanel('avatar')} send={c=>room.current?.sendCommand(c)}/>:panel==='avatar'?<><AvatarCreator value={avatar} onChange={changeAvatar} t={t}/><button className="gc-primary" onClick={()=>{room.current?.sendCommand({type:'appearance',avatar});setPanel(me.indoors?'home':null);}}>{t('この見た目にする')}</button></>:panel==='bag'?<><div className="gc-inventory">{MATERIALS.map(k=><div key={k}><span>{ITEMS[k][0]}</span><small>{t(ITEMS[k][1])}</small><b>{me.bag[k]}</b></div>)}</div><h3>{t('材料からつくる')}</h3><div className="gc-recipes">{CRAFTABLES.map(b=><div key={b}><span><b>{ITEMS[b][0]} {t(ITEMS[b][1])}</b><small>{Object.entries(RECIPES[b]).map(([k,n])=>`${t(ITEMS[k as Material][1])} ×${n}`).join(' / ')} · ⚡3</small></span><button disabled={me.energy<3||Object.entries(RECIPES[b]).some(([k,n])=>me.bag[k as Material]<n!)} onClick={()=>room.current?.sendCommand({type:'craft',material:b})}>{t('つくる')}</button>{b==='meal'?<button disabled={!me.bag.meal} onClick={()=>{room.current?.sendCommand({type:'eat'});setPanel(null);}}>{t('食べる')}</button>:<button disabled={!me.bag[b]} onClick={()=>{setBuilding(b);setTool('build');setPanel(null);}}>{t('置く')}</button>}</div>)}</div><h3>{t('広場のお店')}</h3><p>{t('納品でコインを集めて、広場で買い物。')}</p><div className="gc-furniture">{shopRows(world).map(row=><button key={row.material} disabled={me.coins<row.price} onClick={()=>room.current?.sendCommand({type:'buy',material:row.material})}>{ITEMS[row.material][0]} {t(ITEMS[row.material][1])} · 🪙{row.price}</button>)}</div></>:<><p>{t('矢印キー・WASD、または画面左下の十字ボタン・スティックで移動。')}</p><MovementSettings value={touchControl} onChange={chooseTouchControl} t={t}/><p>{t('近くのマスを選び、道具を選んで「選んだ場所で作業」を押します。')}</p><p>{t('木や石を採集してクラフト。床は橋になり、ブロックは4段まで積めます。')}</p><p>{t('釣りは浮きが沈むタイミングで引き上げると大成功。雨の日は畑に自然と水が入ります。')}</p><p>{t('種は90秒で成長。水やりで45秒に短縮。海や川では釣りができます。')}</p><p>{t('屋根・窓・フェンスで家づくり。木の果実を摘んだり、たき火で料理して移動速度を上げられます。')}</p><p>{t('エネルギーがなくなっても「問題で回復」で再開できます。')}</p><p>{t('島の発展と依頼で目標を確認。自分の家は入口を建て、家具を飾り、島の発展に合わせて拡張できます。')}</p><p>{t('島はホストの端末に自動保存。次回は「保存した島を続ける」を選べます。')}</p><button className="gc-primary" onClick={()=>setPanel(null)}>{t('島に戻る')}</button></>}
      </section></div>}
      {quiz&&<QuizDialog quiz={quiz} answer={answer} waiting={waiting||world.paused} onAnswer={respond} onNext={ask} onClose={()=>{setQuiz(null);setAnswer(null);if(me.indoors)setPanel('home');clearInput();}} t={t}/>}
    </>}
  </main></TranslatedUiTree>;
}
