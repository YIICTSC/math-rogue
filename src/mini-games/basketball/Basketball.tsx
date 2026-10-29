import SportsPresentation from '../shared/SportsPresentation';
import SportsSetupScreen from '../shared/SportsSetupScreen';
import GameTitleScreen from '../shared/GameTitleScreen';
import InviteJoin from '../shared/InviteJoin';
import React,{useEffect,useRef,useState} from 'react';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import {trans} from '../../utils/textUtils';
import {assetUrl} from '../../utils/assetPaths';
import type {AssignmentAnswerResult,LanguageMode} from '../../types';
import {storageService} from '../../services/storageService';
import {audioService} from '../../services/audioService';
import {useSessionResultExit} from '../../services/useSessionResultExit';
import {useGameplayGamepad,PAD} from '../../hooks/useGameplayGamepad';
import {initialTransport,normalizeRoomInput,shareRoomCode,validRoomAddress,type OnlineTransport} from '../../services/onlineTransport';
import {useSportsInvitation} from '../shared/useSportsInvitation';
import {shotDirection} from '../shared/shotDirection';
import SportsInviteBox from '../shared/SportsInviteBox';
import TransportPicker from '../shared/TransportPicker';
import SportsCharacterDialog from '../shared/SportsCharacterDialog';
import QuizPanel from '../gakuro-golf/QuizPanel';
import {loadAvatar,validAvatar,type KartAvatar} from '../gakuro-kart/avatar';
import type {LessonSelection} from '../gakuro-kart/questions';
import {BasketRoom} from './network';
import type {BasketView,BasketCommand,Position} from './types';
import {POSITIONS,ROLES} from './rules';
import {actionButtons,type CourtAction} from './controls';
import {tutorialFinished,finishTutorial} from './tutorial';
import {basketballInviteUrl} from './invite';
import BasketCanvas from './BasketCanvas';
import BasketMatch from './BasketMatch';
import '../tennis/tennis.css';
import './basketball.css';
const Lessons=React.lazy(()=>import('../shared/OnlineLessonPicker'));
const readRole=():Position=>{try{const role=localStorage.getItem('gakuro-basketball-role-v2') as Position;return POSITIONS.includes(role)?role:'SF';}catch{return 'SF';}};
export default function Basketball({onClose,languageMode='JAPANESE',inviteCode='',inviteName,onAnswerResult}:{onClose:()=>void;languageMode?:LanguageMode;inviteCode?:string;inviteName?:string;onAnswerResult?:(r:AssignmentAnswerResult)=>void}){
 const t=(s:string)=>trans(s,languageMode);
 const [entry,setEntry]=useState<'title'|'practice'|'host'|'join'>('title');
 useEffect(()=>{const icon=new Image();icon.src=assetUrl('sprites/basketball/action-icons-v1.webp');},[]);
 const[view,setView]=useState<BasketView|null>(null),[message,msg]=useState(''),[name,setName]=useState(inviteName??(inviteCode?'':'Player')),[code,setCode]=useState(inviteCode),[transport,setTransport]=useState<OnlineTransport>(initialTransport),[busy,setBusy]=useState(false),[picker,setPicker]=useState<'practice'|'host'|'change'|null>(null),[creator,setCreator]=useState(false),[menu,setMenu]=useState(false),[pad,setPad]=useState({x:0,y:0}),[role,setRole]=useState<Position>(readRole);
 const[avatar,setAvatar]=useState<KartAvatar>(()=>{try{const a=JSON.parse(localStorage.getItem('gakuro-basketball-avatar-v1')||'null');return validAvatar(a)?a:loadAvatar();}catch{return loadAvatar();}});
 const[tutorialDone,setTutorialDone]=useState(tutorialFinished),forceTutorial=useRef(false);
 const field=useRef<HTMLDivElement>(null),room=useRef<BasketRoom|null>(null),mounted=useRef(true),snapshot=useRef(view),axis=useRef({x:0,y:0}),keys=useRef(new Set<string>()),padId=useRef<number|null>(null),activeRef=useRef(false),holdingShot=useRef(false),gamepadShot=useRef(false);
 snapshot.current=view;
 const self=room.current?.selfId||'local',me=view?.players.find(p=>p.id===self),m=view?.match,u=m?.units.find(u=>u.owner===self);
 const active=view?.phase==='playing'&&m?.phase==='play'&&!!u&&!view.paused&&!menu&&!creator&&m.tutorial?.stage!=='complete';activeRef.current=!!active;
 const send=useRef<(command:BasketCommand)=>void>(()=>{});send.current=c=>room.current?.send(c);
 const cancelShot=()=>{if(holdingShot.current)send.current({type:'shot-cancel'});holdingShot.current=false;gamepadShot.current=false;};
 const reset=()=>{cancelShot();axis.current={x:0,y:0};keys.current.clear();padId.current=null;setPad({x:0,y:0});send.current({type:'move',x:0,y:0});};
 const quit=()=>{reset();const old=room.current;room.current=null;old?.close();setView(null);setMenu(false);setPicker(null);msg('');setEntry('title');};useSessionResultExit('basketball',quit);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;room.current?.close();};},[]);
 useEffect(()=>{if(!active)reset();room.current?.pause(menu||creator);},[active,menu,creator]);
 useEffect(()=>{if(view?.practice&&m?.tutorial?.stage==='complete'){finishTutorial();setTutorialDone(true);}},[view?.practice,m?.tutorial?.stage]);
 const soundEvent=useRef('');useEffect(()=>{if(!m)return;const key=`${m.id}:${m.serial}`;if(soundEvent.current&&soundEvent.current!==key){if(['SHOT','PERFECT RELEASE','DUNK','PASS','CONTESTED'].includes(m.notice))audioService.playAttackEffectSound('projectile');else if(['STEAL','BASKET!','3 POINTS!','BLOCK','REBOUND WIN','INTERCEPT','SKILL'].includes(m.notice))audioService.playSound('select');}soundEvent.current=key;},[m?.id,m?.serial]);
 useEffect(()=>{const release=audioService.acquireBgmScene('map',{mode:'NEW',theme:'high-school'});return()=>release();},[]);
 const changeAvatar=(a:KartAvatar)=>{setAvatar(a);try{localStorage.setItem('gakuro-basketball-avatar-v1',JSON.stringify(a));}catch{}};
 const changeRole=(r:Position)=>{setRole(r);try{localStorage.setItem('gakuro-basketball-role-v2',r);}catch{}};
 useEffect(()=>{if(view?.phase==='lobby'){send.current({type:'avatar',avatar});send.current({type:'role',role});}},[avatar,role,view?.phase]);
 const callback=useRef(onAnswerResult),recorded=useRef(new Set<string>()),started=useRef(new Map<string,number>());callback.current=onAnswerResult;
 useEffect(()=>{const q=view?.quiz;if(!q)return;const key=`${q.id}:${q.index}`;if(!started.current.has(key))started.current.set(key,performance.now());if(q.selected===null||q.answer===null||recorded.current.has(key))return;recorded.current.add(key);const r:AssignmentAnswerResult={mode:q.question.mode,correct:q.selected===q.answer,elapsedMs:performance.now()-started.current.get(key)!,problemId:q.question.problemId,problemKey:q.question.id,question:q.question.question,correctAnswer:q.question.options[q.answer],selectedAnswer:q.question.options[q.selected]};if(callback.current)callback.current(r);else{storageService.saveAssignmentAnswer({...r,answeredAt:new Date().toISOString()});if(r.correct){storageService.saveMathCorrectCount(storageService.getMathCorrectCount()+1);const counts=storageService.getModeCorrectCounts();storageService.saveModeCorrectCounts({...counts,[r.mode]:(counts[r.mode]||0)+1});}}},[view?.quiz?.id,view?.quiz?.index,view?.quiz?.selected,view?.quiz?.answer]);
 const makeRoom=()=>{recorded.current.clear();started.current.clear();const next=new BasketRoom(v=>{if(mounted.current&&room.current===next)setView(v);},s=>{if(mounted.current&&room.current===next)msg(s);});next.transport=transport;room.current=next;return next;};
 const selectLesson=async(selection:LessonSelection)=>{
  const intent=picker;if(!intent||busy)return;setBusy(true);msg('');let r=room.current;
  try{const{buildLesson}=await import('../gakuro-kart/questions');buildLesson(selection,3);if(!mounted.current)return;if(intent!=='change'){r=makeRoom();if(intent==='host')await r.create(name.trim());else r.practice(name.trim(),forceTutorial.current||!tutorialDone);}if(!mounted.current||r!==room.current||!r)return;r.setLesson(h=>buildLesson(selection,3,h),selection);r.send({type:'avatar',avatar});r.send({type:'role',role});setPicker(null);}
  catch(e){msg(e instanceof Error?e.message:'Connection error');if(intent!=='change'){r?.close(false);room.current=null;setView(null);}}finally{if(mounted.current)setBusy(false);}
 };
 const join=async()=>{if(busy||!name.trim()||!validRoomAddress(code))return;setBusy(true);msg('');const r=makeRoom();try{await r.join(code,name.trim());if(mounted.current&&r===room.current){r.send({type:'avatar',avatar});r.send({type:'role',role});}}catch(e){r.close(false);room.current=null;if(mounted.current){setView(null);msg(e instanceof Error?e.message:'Connection error');}}finally{if(mounted.current)setBusy(false);}};
 useSportsInvitation(inviteCode,inviteName,join);
 const direction=()=>shotDirection(keys.current,axis.current);
 const perform=(action:CourtAction,phase?:'start'|'release'|'cancel')=>{
  if(action==='shoot'&&(phase==='release'||phase==='cancel')){if(!holdingShot.current)return;holdingShot.current=false;send.current({type:phase==='cancel'?'shot-cancel':'shot-release'});return;}
  if(!activeRef.current)return;
  if(action==='shoot'){const input=direction();send.current({type:'move',...input});holdingShot.current=true;send.current({type:'shot-start'});return;}
  const command:Record<Exclude<CourtAction,'shoot'>,BasketCommand>={steal:{type:'catch'},dash:{type:'dodge'},pass:{type:'pass'},block:{type:'block'},rebound:{type:'rebound'},screen:{type:'screen'},call:{type:'call'},special:{type:'special'}};
  send.current(command[action]);
 };
 const actionRef=useRef(perform);actionRef.current=perform;
 useEffect(()=>{
  const primary=()=>{const v=snapshot.current,unit=v?.match?.units.find(u=>u.owner===room.current?.selfId);return v?.match&&unit?actionButtons(v.match,unit)[0].id:'shoot';};
  const down=(event:KeyboardEvent)=>{if((event.target as Element)?.closest('input,select,textarea,[role=dialog]'))return;const key=event.key.toLowerCase();if(key==='escape'&&snapshot.current?.phase==='playing'){event.preventDefault();setMenu(v=>!v);return;}if(!activeRef.current)return;if(['arrowup','arrowdown','arrowleft','arrowright',' ','z','x','c','v','b','shift'].includes(key))event.preventDefault();keys.current.add(key);if(event.repeat)return;
   const v=snapshot.current,unit=v?.match?.units.find(u=>u.owner===room.current?.selfId),held=v?.match?.ball.holder===unit?.id;
   if(key==='z')actionRef.current(primary(),'start');else if(key==='x')actionRef.current('steal');else if(key==='c')actionRef.current(held?'pass':v?.match?.possession===unit?.side?'screen':'steal');else if(key==='v')actionRef.current('rebound');else if(key==='b')actionRef.current('block');else if(key===' ')actionRef.current('dash');else if(key==='shift')actionRef.current('special');
  };
  const up=(event:KeyboardEvent)=>{keys.current.delete(event.key.toLowerCase());if(event.key.toLowerCase()==='z')actionRef.current('shoot','release');};
  const hidden=()=>{if(document.hidden)reset();},system=()=>{if(snapshot.current?.phase==='playing')setMenu(true);};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',hidden);window.addEventListener('learning-rogue:open-gamepad-system-menu',system);
  let moving=false;const timer=setInterval(()=>{if(!activeRef.current)return;const input=direction();if(input.x||input.y||moving)send.current({type:'move',...input});moving=!!(input.x||input.y);},50);
  return()=>{clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('learning-rogue:open-gamepad-system-menu',system);};
 },[]);
 useGameplayGamepad('basketball',p=>{
  if(!activeRef.current||!p.active){if(padId.current===null){axis.current={x:0,y:0};setPad({x:0,y:0});}if(gamepadShot.current)cancelShot();return;}
  axis.current={x:p.x,y:-p.y};if(p.x!==pad.x||-p.y!==pad.y)setPad(axis.current);
  if(p.pressed[PAD.MENU]){setMenu(true);return;}
  const current=snapshot.current,unit=current?.match?.units.find(u=>u.owner===room.current?.selfId),buttons=current?.match&&unit?actionButtons(current.match,unit):null;
  if(p.pressed[PAD.A]&&buttons){actionRef.current(buttons[0].id,'start');gamepadShot.current=buttons[0].id==='shoot';}
  if(gamepadShot.current&&!p.buttons[PAD.A]){actionRef.current('shoot','release');gamepadShot.current=false;}
  if(p.pressed[PAD.B]&&buttons)actionRef.current(buttons[1].id);
  if(p.pressed[PAD.X])actionRef.current('dash');if(p.pressed[PAD.Y])actionRef.current(current?.match?.ball.holder===unit?.id?'pass':'call');
  if(p.pressed[PAD.LB])actionRef.current('rebound');if(p.pressed[PAD.RB])actionRef.current('special');
 });
 const analog=(event:React.PointerEvent<HTMLDivElement>)=>{if(padId.current!==event.pointerId)return;const r=event.currentTarget.getBoundingClientRect(),x=(event.clientX-r.left-r.width/2)/(r.width*.35),y=-(event.clientY-r.top-r.height/2)/(r.height*.35),length=Math.max(1,Math.hypot(x,y));axis.current={x:x/length,y:y/length};setPad(axis.current);};
 const padDown=(event:React.PointerEvent<HTMLDivElement>)=>{if(!active)return;padId.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);analog(event);};
 const padUp=()=>{padId.current=null;axis.current={x:0,y:0};setPad(axis.current);send.current({type:'move',x:0,y:0});};
 const rolePicker=<section className="bk-role-picker"><h3>{t('ポジションを選ぶ')}</h3><div>{POSITIONS.map(r=><button key={r} aria-label={`${r} · ${t(ROLES[r].tag)}`} title={t(ROLES[r].description)} aria-pressed={role===r} disabled={busy} onClick={()=>changeRole(r)}><strong>{r}</strong><span>{t(ROLES[r].tag)}</span></button>)}</div><p>{t(ROLES[role].description)}</p><small>{t('得意技')} · {t(ROLES[role].skill)}</small></section>;
 const bracket=<div className="bk-bracket">{view?.bracket.map(b=><button key={b.id} disabled={!!u&&m?.phase!=='finished'} onClick={()=>{room.current?.observe(b.id);setMenu(false);}}><small>ROUND {b.round+1}</small><span>TEAM {b.teams[0]+1} · {b.teams[1]===null?'BYE':`TEAM ${b.teams[1]+1}`}</span><strong>{b.score[0]} : {b.score[1]}</strong><b>{b.winner!==null?`★ TEAM ${b.winner+1}`:b.phase==='study'?'STUDY':'LIVE'}</b></button>)}</div>;
 if(!view&&(inviteCode||entry==='join'))return <InviteJoin title="GAKURO BASKETBALL" name={name} onName={setName} code={code} onCode={inviteCode?undefined:setCode} onJoin={join} onClose={()=>{setEntry('title');msg('');if(inviteCode)onClose();}} busy={busy} error={t(message)} languageMode={languageMode}/>;
 if(!view&&entry==='title'&&!picker)return <GameTitleScreen kind="basketball" title="GAKURO BASKETBALL" subtitle={t('つなげ、跳べ、ゴールを奪え。')} backdrop={null} languageMode={languageMode} backLabel={t('スポーツへ戻る')} onClose={onClose} actions={[{label:t('ひとりで練習'),onClick:()=>setEntry('practice')},{label:t('オンラインの部屋を作る'),onClick:()=>setEntry('host')},{label:t('招待に参加する'),onClick:()=>setEntry('join')}]}/>;
 if(!view||view.phase==='lobby')return <><SportsSetupScreen sport="basketball" brand="GAKURO BASKETBALL" title={t(view?'スタート前の集合':entry==='host'?'オンラインの部屋を作る':'ひとりで練習')} languageMode={languageMode} onBack={()=>view?quit():setEntry('title')} preview={<BasketCanvas view={view} selfId={self} avatar={avatar} suspended={creator}/>} caption={t('ハーフコートで3対3。役割と連携で勝利をつかもう。')} members={view?.players} selfId={self} footer={!view?<div className="sp-footer-row">{entry==='practice'&&<button disabled={busy||!name.trim()} onClick={()=>{forceTutorial.current=true;setPicker('practice');}}>{t('操作を練習')}</button>}<button className="online-entry-primary" aria-label={t(!view?(entry==='host'?'問題を選んで部屋を作る':'CPUと対戦'):(view.practice?'CPU戦を開始':'大会を開始'))} disabled={busy||!name.trim()} onClick={()=>{forceTutorial.current=false;setPicker(entry==='host'?'host':'practice');}}>{t(entry==='host'?'問題を選んで部屋を作る':'CPUと対戦')} →</button></div>:<div className="sp-footer-row">{!view.practice&&<button onClick={()=>room.current?.setSpectator(!me?.spectator)}>{t(me?.spectator?'出場する':'観戦する')}</button>}{room.current?.host?<button className="online-entry-primary" aria-label={t(!view?(entry==='host'?'問題を選んで部屋を作る':'CPUと対戦'):(view.practice?'CPU戦を開始':'大会を開始'))} disabled={!view.title||view.players.filter(p=>p.connected&&!p.spectator).length<(view.practice?1:2)} onClick={()=>room.current?.start()}>{t(view.practice?'CPU戦を開始':'大会を開始')} →</button>:<p role="status">{t('ホストの開始を待っています。')}</p>}</div>}>
 <div className="sp-player">{!view&&<label>{t('参加名')}<input value={name} maxLength={16} autoComplete="nickname" disabled={busy} onChange={e=>setName(e.target.value)}/></label>}<button disabled={busy} onClick={()=>setCreator(true)}>{t('キャラクタークリエイト')}</button></div>{rolePicker}
 {!view&&entry==='host'&&<TransportPicker compact game="basketball" languageMode={languageMode} value={transport} onChange={setTransport} disabled={busy}/>}{view&&<div className="sp-room">{room.current?.code&&<SportsInviteBox compact code={shareRoomCode(room.current.code,room.current.transport)} url={basketballInviteUrl(location.href,shareRoomCode(room.current.code,room.current.transport))} t={t}/>}<div className="sp-lesson"><p data-allow-japanese="true">{view.title}</p>{room.current?.host&&<button onClick={()=>setPicker('change')}>{t('問題を変更')}</button>}</div></div>}{message&&<p role="alert">{t(message)}</p>}
 </SportsSetupScreen>{creator&&<SportsCharacterDialog sport="basketball" avatar={avatar} onChange={changeAvatar} onClose={()=>setCreator(false)} languageMode={languageMode}/>} {picker&&<React.Suspense fallback={<div className="sports-loading">LOADING…</div>}><Lessons activity="basketball" languageMode={languageMode} busy={busy} error={message} onSelect={selectLesson} onBack={()=>{if(!busy)setPicker(null);}}/></React.Suspense>}</>;
 return <TranslatedUiTree mode={languageMode}><main className={'tn-root bk-root '+(view?.phase==='playing'?'bk-playing':'')} data-gamepad-navigation-root data-gamepad-live={active?'basketball':undefined}>
  {view?.phase==='result'&&<section className="tn-results bk-results"><small>THE ACADEMY · FINAL WHISTLE</small><h1>{t('大会結果')}</h1><h2>{view.champion===null?'—':`TEAM ${view.champion+1}`}</h2><div className="bk-result-stats"><header><span>{t('選手')}</span><b>PTS</b><b>AST</b><b>REB</b><b>BLK</b></header>{view.players.filter(p=>!p.spectator).map(p=><div key={p.id}><span data-allow-japanese="true">{p.role} · {p.name}</span><b>{p.stats.points}</b><b>{p.stats.assists}</b><b>{p.stats.rebounds}</b><b>{p.stats.blocks}</b></div>)}</div>{bracket}<div className="tn-result-actions">{room.current?.host&&<button onClick={()=>room.current?.rematch()}>{t('もう一度遊ぶ')}</button>}<button onClick={quit}>{t('バスケットボールの入口へ')}</button></div></section>}
  <SportsPresentation viewerId={self} sport="basketball" stream={view?.phase==='playing'?m?.id??null:null} events={m?.sportsEvents} actors={m?.units??[]} paused={!!view?.paused||!!view?.quiz||menu||creator} languageMode={languageMode}/>
  {view?.phase==='playing'&&m&&<BasketMatch view={view} m={m} u={u} self={self} active={!!active} menu={menu||creator} t={t} field={field} pad={pad} onPadDown={padDown} onPadMove={analog} onPadUp={padUp} onAction={perform} onMenu={()=>setMenu(true)} onQuit={quit} onContinue={()=>send.current({type:'tutorial-complete'})}/>}
  {view?.quiz&&<div className="tn-learning"><QuizPanel title="バスケットボールの学習タイム" languageMode={languageMode} disabled={!!view.paused} quiz={{shotId:view.quiz.id,index:view.quiz.index,question:view.quiz.question,selected:view.quiz.selected,answer:view.quiz.answer}} send={c=>{if(c.type==='answer')send.current({type:'answer',id:c.shotId,index:c.index,option:c.option});else if(c.type==='continue')send.current({type:'continue',id:c.shotId,index:c.index});}}/></div>}
  {view?.phase==='playing'&&m?.phase==='study'&&!view.quiz&&<p className="bk-waiting">{t('相手の学習を待っています。')}</p>}
  {menu&&<div className="tn-modal-backdrop" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setMenu(false);if(e.key==='Tab'){const nodes=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}}}><section className="tn-modal bk-help" role="dialog" aria-modal="true" aria-label={t('操作ガイド')}><header><h2>{t('操作ガイド')}</h2><button autoFocus onClick={()=>setMenu(false)}>{t('コートへ戻る')} ×</button></header><p>{t('ハーフコートで3分間。奪ったボールは外へ運んでから攻撃。')}</p><p>{t('シュートは長押しして黄色で離そう。守備が近いと成功率が下がります。')}</p><p>{t('Z：攻守のアクション　C：パス／守備　X：スティール　V：リバウンド　B：ブロック　Space：ドライブ　Shift：スキル')}</p><p>{t('味方がボールを持つ時は、パス要求とスクリーンで連携。')}</p><p>{t('試合前と1分ごとに3問。正解で集中力とスキルゲージが回復。')}</p><p>{t(ROLES[role].description)} {t(ROLES[role].skill)}</p>{bracket}<button onClick={quit}>{t('大会を終了')}</button></section></div>}
  {creator&&<SportsCharacterDialog sport="basketball" avatar={avatar} onChange={changeAvatar} onClose={()=>setCreator(false)} languageMode={languageMode}/>}
  {picker&&<React.Suspense fallback={<div className="sports-loading">LOADING…</div>}><Lessons activity="basketball" languageMode={languageMode} busy={busy} error={message} onSelect={selectLesson} onBack={()=>{if(!busy)setPicker(null);}}/></React.Suspense>}
 </main></TranslatedUiTree>;
}
