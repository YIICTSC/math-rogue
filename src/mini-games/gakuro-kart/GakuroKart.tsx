import InviteJoin from '../shared/InviteJoin';
import {initialTransport,shareRoomCode,validRoomAddress} from '../../services/onlineTransport';
import type {OnlineTransport} from '../../services/onlineTransport';
import TransportPicker from '../shared/TransportPicker';
import WaitingHomeDash from '../shared/WaitingHomeDash';
import StorybookQuality from '../../three/StorybookQuality';
import CourseEditor from './CourseEditor';
import {loadCourses} from './courseStorage';
import type {CustomCourse} from './track';
import {trans} from '../../utils/textUtils';
import GameTitleScreen from '../shared/GameTitleScreen';
import '../shared/lobby.css';
import HostSpectator, { useSpectatorTarget } from '../shared/HostSpectator';
import NextCoursePicker from './NextCoursePicker';
import LapCountPicker from './LapCountPicker';
import SteeringPad from './SteeringPad';
import { minimapGeometry } from './minimap';
import AvatarCreator from './AvatarCreator';
import { AVATAR_COLORS, loadAvatar, saveAvatar, type KartAvatar } from './avatar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COURSES, ITEMS, ITEM_EFFECTS, DEFAULT_LAPS, MAX_RACERS, createRace, addRacer, ranking, type Race } from './engine';
import { getTrack, sampleTrack } from './track';
import { KartRoom } from './network';
import { kartInviteUrl, normalizeKartCode } from './invite';
import { copyInviteUrl } from '../shared/copyInviteUrl';
import { KartAudio } from './audio';
import KartCanvas from './KartCanvas';
import './kart.css';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type { LanguageMode } from '../../types';
import LessonPicker from './LessonPicker';
import QuizBoard from './QuizBoard';
import { QUIZ_END, quizDistance, type KartLesson } from './learning';
import type { LessonSelection } from './questions';
import { storageService } from '../../services/storageService';
import { managementPortalService } from '../../services/managementPortalService';
import { audioService, type BgmPlaybackOptions } from '../../services/audioService';

const time = (n: number) => `${Math.floor(n / 60)}:${(n % 60).toFixed(2).padStart(5, '0')}`;
type KartBgmType = Exclude<Parameters<typeof audioService.playBGM>[0], 'random'>;
type KartBgmChoice = { type: KartBgmType; options: BgmPlaybackOptions };
// Order follows COURSES. Each entry pins its source set: marked-old tracks use
// OLD, while unmarked tracks use NEW regardless of the title-screen preference.
const KART_COURSE_BGMS: readonly KartBgmChoice[] = [
  { type: 'battle', options: { mode: 'NEW', theme: 'high-school' } },
  { type: 'paper_plane_battle', options: { mode: 'OLD' } },
  { type: 'survivor_metal', options: { mode: 'OLD' } },
  { type: 'paper_plane_battle', options: { mode: 'NEW' } },
  { type: 'paper_plane_vacation', options: { mode: 'NEW' } },
  { type: 'map', options: { mode: 'NEW', theme: 'high-school' } },
  { type: 'battle', options: { mode: 'OLD', theme: 'magic-female' } },
  { type: 'final_boss', options: { mode: 'OLD', theme: 'magic-male' } },
];
function MiniMap({ world, self }: { world: Race; self: string }) {
  const map = useMemo(() => minimapGeometry(world.course,world.customCourse), [world.course,world.customCourse]);
  const racers = Object.values(world.players);
  return <svg className="gk-map" viewBox="0 0 122 140" aria-label="Circuit map"><path d={map.path} fill="none" stroke="#ffffff30" strokeWidth="5" /><path d={map.path} fill="none" stroke="#b9e0e055" strokeWidth="1" />{racers.filter(p => !p.spectator).sort((a, b) => Number(a.id === self) - Number(b.id === self)).map(p => { const pt = map.project(sampleTrack(p.distance, world.course, p.x,world.customCourse)); return <circle key={p.id} cx={pt.x} cy={pt.y} r={p.id === self ? 3.5 : 1.7} fill={p.id === self ? '#d9ff6a' : p.cpu ? '#9eafc2' : '#5fe8ef'} />; })}</svg>;
}
export default function GakuroKart({ onClose, languageMode = 'JAPANESE', inviteCode = '', allowHost = true }: { onClose: () => void; languageMode?: LanguageMode; inviteCode?: string; allowHost?: boolean }) {
  const [transport,setTransport]=useState<OnlineTransport>(initialTransport);
  const [world, setWorld] = useState<Race | null>(null), [name, setName] = useState(inviteCode?'':'Racer'), [hero] = useState(0), [course, setCourse] = useState(0), [code, setCode] = useState(inviteCode);
  const [customCourse,setCustomCourse]=useState<CustomCourse>(),[nextCustom,setNextCustom]=useState<CustomCourse>(),[editingCourse,setEditingCourse]=useState(false);
  const [entry,setEntry]=useState<'title'|'practice'|'create'|'join'|'avatar'>('title');
  const [avatarBack,setAvatarBack]=useState<'practice'|'create'|'join'>('practice');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [lobbyAvatarOpen,setLobbyAvatarOpen]=useState(Boolean(inviteCode));
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false), [fill, setFill] = useState(true), [sound, setSound] = useState(true);
  const [avatar, setAvatar] = useState(loadAvatar);
  const [nextCourse, setNextCourse] = useState(0);
  const [nextLaps, setNextLaps] = useState(DEFAULT_LAPS);
  useEffect(() => { if (world) { setNextCourse(world.course); setNextLaps(world.laps); setNextCustom(world.customCourse); } }, [world?.course, world?.laps, world?.seed]);
  const [picking, setPicking] = useState<'practice' | 'create' | 'edit' | null>(null);
  const selection = useRef<LessonSelection | null>(null), recorded = useRef(new Set<string>());
  const wakeAudio = () => { if (!audio.current) audio.current = new KartAudio(); void audio.current.unlock().catch(() => {}); };
  const room = useRef<KartRoom | null>(null), audio = useRef<KartAudio | null>(null), generation = useRef(0);
  const invite = world && room.current?.host && room.current.code ? kartInviteUrl(window.location.href, shareRoomCode(room.current.code,room.current.transport)) : '';
  const copyInvitation = async () => { if (await copyInviteUrl(invite)) setInviteCopied(true); else setError('リンクを選択してコピーしてください。'); };
  const input = useRef({ left: false, right: false, brake: false, drift: false });
  const stickInput = useRef(0);
  const currentPhase = useRef(world?.phase); currentPhase.current = world?.phase;
  const self = room.current?.selfId || 'preview', own = world?.players[self];
  const racers = Object.values((world?.players || {}) as Race['players']);
  const spectating = !!own?.spectator;
  const spectators = useSpectatorTarget(spectating, racers.filter(p => p.id !== self && !p.cpu && !p.spectator).map(p => p.id));
  const viewId = spectating ? spectators.target || self : self, me = world?.players[viewId];
  currentPhase.current = spectating ? undefined : world?.phase;
  const latestAudioState = useRef<{ world: Race | null; self: string }>({ world: null, self: 'preview' });
  latestAudioState.current = { world, self: viewId };
  const preview = useMemo(() => { const w = createRace(world?.course ?? course,1,3,world?world.customCourse:customCourse); addRacer(w, 'preview', name, hero); w.players.preview.x = 0; w.players.preview.distance = 0; w.players.preview.avatar = avatar; return w; }, [world?.course,world?.customCourse,customCourse, course, name, hero, avatar]);
  const changeAvatar = (value: KartAvatar) => { if (room.current?.world && room.current.world.phase !== 'lobby') return; setAvatar(value); saveAvatar(value); room.current?.setAvatar(value); };
  const clearInput = () => { stickInput.current = 0; input.current = { left: false, right: false, brake: false, drift: false }; room.current?.send({ type: 'input', steer: 0, brake: false, drift: false }); };
  useEffect(() => { clearInput(); }, [world?.phase]);
  useEffect(() => () => {
    audioService.setBgmDuckMultiplier(1);
    audioService.stopBGM();
  }, []);
  useEffect(() => {
    const me = own;
    if (!world?.lesson || !me || me.cpu || me.spectator) return;
    const assignment = room.current?.host ? selection.current?.assignment : undefined;
    world.lesson.questions.forEach((q, i) => {
      const key = `${world.seed}:${me.quizLap}:${i}`;
      if (me.quizAnswers[i] === -2 || recorded.current.has(key)) return;
      recorded.current.add(key);
      const result = { mode: q.mode, subjectId: q.mode, correct: me.quizAnswers[i] === q.correct, elapsedMs: me.quizTimes[i] * 1000, problemId: q.problemId, problemKey: q.problemId || `${q.mode}:${q.question}`, question: q.question, correctAnswer: q.options[q.correct], selectedAnswer: q.options[me.quizAnswers[i]] || '' };
      storageService.saveAssignmentAnswer({ ...result, assignmentId: assignment?.id, unitName: q.unitName, answeredAt: new Date().toISOString() });
      if (assignment) managementPortalService.queueAnswer(assignment, result);
      managementPortalService.queueLearningActivity(result, assignment);
    });
  }, [world, self]);
  useEffect(() => { audio.current?.update(world, viewId); }, [world, viewId]);
  useEffect(() => {
    const key = (e: KeyboardEvent, down: boolean) => {
      if ((e.target as HTMLElement)?.closest('input,select,textarea') || currentPhase.current !== 'race') return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a', 'arrowright', 'd', 'arrowdown', 's', ' ', 'e', 'shift'].includes(k)) e.preventDefault();
      if (k === 'arrowleft' || k === 'a') input.current.left = down;
      if (k === 'arrowright' || k === 'd') input.current.right = down;
      if (k === 'arrowdown' || k === 's') input.current.brake = down;
      if (k === 'shift' || k === ' ') input.current.drift = down;
      if (k === 'e' && down && !e.repeat) room.current?.send({ type: 'item' });
    };
    const down = (e: KeyboardEvent) => key(e, true), up = (e: KeyboardEvent) => key(e, false), blur = () => clearInput();
    const resumeAudio = () => {
      if (document.hidden || !audio.current) return;
      const current = audio.current;
      void current.unlock().then(() => current.update(latestAudioState.current.world, latestAudioState.current.self)).catch(() => undefined);
    };
    const visibility = () => { blur(); if (!document.hidden) resumeAudio(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    window.addEventListener('focus', resumeAudio); window.addEventListener('pageshow', resumeAudio); document.addEventListener('visibilitychange', visibility);
    let padItem = false;
    const timer = setInterval(() => {
      if (currentPhase.current !== 'race') return;
      const pad = navigator.getGamepads?.()?.[0], axis = pad && Math.abs(pad.axes[0]) > .15 ? pad.axes[0] : 0;
      // Screen-right is negative on our track-space axis, so invert stick and button inputs.
      room.current?.send({ type: 'input', steer: -(stickInput.current || axis || Number(input.current.right) - Number(input.current.left)), brake: input.current.brake || !!pad?.buttons[6]?.pressed, drift: input.current.drift || !!pad?.buttons[0]?.pressed });
      if (pad?.buttons[1]?.pressed && !padItem) room.current?.send({ type: 'item' }); padItem = !!pad?.buttons[1]?.pressed;
    }, 50);
    return () => { generation.current++; clearInterval(timer); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); window.removeEventListener('focus', resumeAudio); window.removeEventListener('pageshow', resumeAudio); document.removeEventListener('visibilitychange', visibility); room.current?.close(); audio.current?.close(); };
  }, []);
  const start = async (mode: 'practice' | 'create' | 'join', lesson?: KartLesson) => {
    if (busy || !name.trim() || (mode !== 'join' && !allowHost)) return;
    setInviteCopied(false);
    const token = ++generation.current; setBusy(true); setError(''); room.current?.close();
    if (!audio.current) audio.current = new KartAudio(); void audio.current.unlock().catch(() => {});
    const r = new KartRoom(w => { if (generation.current === token) setWorld(w); }, m => { if (generation.current === token) setError(m); }); r.transport=transport;room.current = r;
    try { if (mode === 'practice') r.practice(name, hero, course,customCourse); else if (mode === 'create') await r.create(name, hero, course,customCourse); else await r.join(code, name, hero, avatar); if (r.host) r.setAvatar(avatar); if (lesson && r.host) r.setLesson(lesson); }
    catch (e) { r.close(); if (generation.current === token) { setWorld(null); setError(e instanceof Error ? e.message : 'Connection failed'); } }
    finally { if (generation.current === token) setBusy(false); }
  };
  const chooseLesson = async (choice: LessonSelection) => {
    if (busy || !picking) return;
    wakeAudio(); setBusy(true); setError('');
    const target = picking, token = generation.current;
    try {
      const { buildLesson } = await import('./questions');
      if (generation.current !== token) return;
      const lesson = buildLesson(choice, 15); selection.current = choice;
      if (target === 'edit') room.current?.setLesson(lesson);
      else await start(target, lesson);
      if (room.current?.world) setPicking(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Problem preparation failed'); }
    finally { setBusy(false); }
  };
  const restart = async () => {
    if (busy) return;
    wakeAudio(); setBusy(true); setError('');
    const token = generation.current;
    try { const { buildLesson } = await import('./questions'); if (generation.current === token) room.current?.rematch(selection.current ? buildLesson(selection.current, 15) : undefined, nextCourse, nextLaps,nextCustom); }
    catch (e) { setError(e instanceof Error ? e.message : 'Problem preparation failed'); }
    finally { if (generation.current === token) setBusy(false); }
  };
  const leave = () => { generation.current++; clearInput(); room.current?.close(); room.current = null; setWorld(null); setError(''); setCopied(false); setBusy(false); setPicking(null); setEntry('title'); recorded.current.clear(); };
  const touch = (key: keyof typeof input.current) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); input.current[key] = true; },
    onPointerUp: () => { input.current[key] = false; }, onPointerCancel: () => { input.current[key] = false; }, onLostPointerCapture: () => { input.current[key] = false; },
  });
  const order = world ? ranking(world) : [], place = order.findIndex(p => p.id === viewId) + 1, length = getTrack(world?.course ?? course,world?world.customCourse:customCourse).length;
  const quizProgress = me ? quizDistance(me.distance, length) : QUIZ_END;
  const quizBoardVisible = Boolean(
    world?.phase === 'race'
    && world.lesson
    && me
    && !me.finish
    && me.distance >= me.quizLap * length
    && (!me.quizApplied || quizProgress <= QUIZ_END + 230),
  );
  useEffect(() => {
    audioService.setBgmDuckMultiplier(quizBoardVisible ? 0.48 : 1);
  }, [quizBoardVisible]);
  useEffect(() => {
    if (picking) {
      void audioService.playBGM('math', true, { mode: 'NEW' });
      return;
    }
    if (!world) {
      void audioService.playBGM('paper_plane_setup', true, { mode: 'NEW' });
      return;
    }
    if (world.phase === 'lobby') {
      void audioService.playBGM('paper_plane_setup', true, { mode: 'NEW' });
      return;
    }
    if (world.phase === 'countdown' || world.phase === 'race') {
      const choice = KART_COURSE_BGMS[world.course] ?? KART_COURSE_BGMS[0];
      void audioService.playBGM(choice.type, true, choice.options);
      return;
    }
    if (world.phase === 'result') {
      const nextCourseChanged = nextCourse !== world.course;
      void audioService.playBGM(nextCourseChanged ? 'paper_plane_setup' : 'victory', true, { mode: 'NEW' });
    }
  }, [picking, world?.phase, world?.course, nextCourse]);
  const active = world?.phase === 'race' && !world.paused && !spectating;
  const front = order.slice(0, 5); if (me && place > 5) front.push(me);
  if(editingCourse)return <CourseEditor languageMode={languageMode} initial={world?nextCustom:customCourse} onClose={()=>setEditingCourse(false)} onUse={c=>{if(world){setNextCustom(c);setNextCourse(c.theme);}else{setCustomCourse(c);setCourse(c.theme);setEntry('practice');}setEditingCourse(false);}}/>;
  if (picking) return <LessonPicker languageMode={languageMode} busy={busy} error={error} onSelect={chooseLesson} onBack={() => { generation.current++; setPicking(null); setError(''); }} />;
  if(!world&&inviteCode)return <InviteJoin title="GAKURO GP" name={name} onName={setName} onJoin={()=>start('join')} onClose={onClose} busy={busy} error={trans(error,languageMode)} languageMode={languageMode}/>;
  if(!world&&entry==='title')return <GameTitleScreen kind="kart" title={trans('スーパー学ロカート',languageMode)} subtitle="学んで加速。みんなでグランプリへ。" languageMode={languageMode} onClose={onClose} backdrop={<KartCanvas world={preview} selfId="preview" preview/>} actions={[...(allowHost?[{label:'ひとりでレース',onClick:()=>setEntry('practice')},{label:'オンラインの部屋を作る',onClick:()=>setEntry('create')},{label:'オリジナルコース作成',onClick:()=>setEditingCourse(true)}] : []),{label:'招待に参加する',onClick:()=>setEntry('join')}]}/>;
  return <TranslatedUiTree mode={languageMode}><main className={`gk-root ${world ? 'gk-playing'+(world.phase==='lobby'?' gk-preparing':'') : 'gk-intro-root'}`} data-gamepad-initial-scope="gakuro-kart" onPointerDownCapture={wakeAudio} onTouchStartCapture={wakeAudio} onKeyDownCapture={wakeAudio}>
    <header className="gk-header"><button className="gk-back" onClick={world || busy ? leave : ()=>setEntry('title')}>← <span>{world ? 'ガレージ' : 'タイトル'}</span></button><div className="gk-brand">GAKURO<span>GP<span className="gk-brand-dot">●</span></span></div><div className="gk-header-right"><StorybookQuality languageMode={languageMode}/><span className="gk-live">40 RACERS / {world?.laps ?? DEFAULT_LAPS} LAPS</span><button aria-label="Sound toggle" className="gk-sound" onClick={() => { if (!audio.current) audio.current = new KartAudio(); void audio.current.unlock().catch(() => {}); setSound(audio.current.toggle()); }}>{sound ? 'SOUND ON' : 'SOUND OFF'}</button></div></header>
    {world && room.current?.host && room.current.code && <HostSpectator enabled={spectating} canChangeMode={['lobby', 'result'].includes(world.phase)} onChange={value => { clearInput(); room.current?.setSpectator(value); }} name={spectators.target ? me?.name : undefined} count={racers.filter(p => p.id !== self && !p.cpu && !p.spectator).length} onNext={spectators.next} languageMode={languageMode}>{me && spectators.target && <><span>#{place} / {order.length}</span><span>LAP {Math.min(world.laps, Math.max(1, Math.floor(me.distance / length) + 1))} / {world.laps}</span><span>{Math.round(me.speed * 3.6)} KM/H</span></>}</HostSpectator>}
    {error && <div className="gk-error" role="alert">{error}</div>}
    {!world ? <div className="gk-garage">
      <section className={`gk-preview ${entry==='avatar'?'gk-avatar-focused':''}`}><KartCanvas world={preview} selfId="preview" preview /><div className="gk-preview-shade" /><div className="gk-preview-copy"><span className="gk-eyebrow">THE AFTER-SCHOOL GRAND PRIX</span><h1>BREAK<br />THE <em>LIMIT.</em></h1><p>放課後を、ぶっちぎれ。</p><div className="gk-pills"><span>FULL 3D</span><span>40 PLAYER GRID</span><span>DRIFT & BOOST</span></div></div><div className="gk-course-caption"><span>0{course + 1} / CIRCUIT</span><strong>{customCourse?.name??COURSES[course].name}</strong><span>{COURSES[course].subtitle}</span></div></section>
      <section className="gk-setup gk-entry-setup">
      {entry==='avatar'?<><div className="gk-entry-heading"><h2>キャラクタークリエイト</h2><button onClick={()=>setEntry(avatarBack)}>戻る</button></div><div className="gk-entry-avatar"><AvatarCreator value={avatar} onChange={changeAvatar} languageMode={languageMode}/></div></>:<>
        <div className="gk-entry-heading"><h2>{entry==='practice'?'ひとりでレース':entry==='create'?'オンラインの部屋を作る':'招待に参加する'}</h2><button onClick={()=>{setAvatarBack(entry as 'practice'|'create'|'join');setEntry('avatar');}}>キャラクタークリエイト</button></div>
        {(entry==='create'||entry==='join')&&<TransportPicker game="kart" value={transport} onChange={setTransport} disabled={busy} languageMode={languageMode}/>}
        <label>レーサー名<input maxLength={16} value={name} onChange={e=>setName(e.target.value)}/></label>
        {entry==='join'?<><label>ルームコード<input aria-label="ルームコード" maxLength={8} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label><button className="gk-primary" disabled={busy||!normalizeKartCode(code)||!name.trim()} onClick={()=>start('join')}>参加 →</button></>:<><label>コースを選ぶ<select value={course} onChange={e=>{setCourse(Number(e.target.value));setCustomCourse(undefined);}}>{COURSES.map((c,i)=><option key={c.name} value={i}>{c.name}</option>)}</select></label><details className="gk-entry-guide"><summary>オリジナルコース</summary><select aria-label="保存したコース" value={customCourse?.name??''} onChange={e=>{const c=loadCourses().find(c=>c.name===e.target.value);setCustomCourse(c);if(c)setCourse(c.theme);}}><option value="">コースを選ぶ</option>{loadCourses().map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select><button onClick={()=>setEditingCourse(true)}>オリジナルコース作成</button>{customCourse&&<p data-allow-japanese="true">{customCourse.name}</p>}</details><button className="gk-primary" disabled={busy||!name.trim()} onClick={()=>setPicking(entry as 'practice'|'create')}>問題を選んでレースへ</button></>}
        <small>{busy?'接続中…':entry==='join'?'招待コードを入力すると参加できます。':'ひとりでも39台のライバル。オンラインは最大40人。'}</small>
        <details className="gk-entry-guide"><summary>操作ガイド</summary><p>左右でハンドル。ドリフトをためてターボ。アイテムで逆転を狙おう。</p></details>
      </>}
      </section>
    </div> : <>
      <section className={`gk-race-view ${me?.boost ? 'is-boosting' : ''} ${world.lesson && me && !me.finish && quizProgress < QUIZ_END + 230 ? 'has-quiz' : ''} ${me?.crash ? 'is-crashing' : ''}`}><KartCanvas world={world} selfId={viewId} />
        <div className="gk-vignette" />{me && me.boost > 0 && active && <div className="gk-speed-streaks" />}
        <div className="gk-hud"><div className="gk-position"><span>POSITION</span><strong>{String(place).padStart(2, '0')}<small> / {order.length}</small></strong></div><div className="gk-lap"><span>LAP</span><strong>{Math.min(world.laps, Math.max(1, Math.floor((me?.distance || 0) / length) + 1))}<small> / {world.laps}</small></strong></div><div className="gk-race-time"><span>{world.finishAt ? 'FINISH WINDOW' : 'RACE TIME'}</span><strong>{world.finishAt ? Math.ceil(world.remaining) : time(world.time)}</strong></div></div>
        <div className="gk-leaderboard">{front.map(p => <div key={p.id} className={p.id === viewId ? 'is-self' : ''}><b>{order.indexOf(p) + 1}</b><i style={{ background: AVATAR_COLORS[p.avatar.outfit] }} /><span>{p.name}</span><small>{p.finish ? 'FIN' : p.id === viewId ? spectating ? 'WATCH' : 'YOU' : `${Math.max(0, Math.round((Math.min(length * world.laps, order[0].distance) - p.distance)))}m`}</small></div>)}</div>
        {me && world.lesson && <QuizBoard world={world} racer={me} languageMode={languageMode} sound={sound} />}
        <MiniMap world={world} self={viewId} />
        <div className="gk-track-label"><b>{world.customCourse?.name??COURSES[world.course].name}</b><span>{Math.round(Math.max(0, Math.min(1, (me?.distance || 0) / (length * world.laps))) * 100)}%</span><i style={{ width: `${Math.max(0, Math.min(100, (me?.distance || 0) / (length * world.laps) * 100))}%` }} /></div>
        <div className="gk-speed"><strong>{Math.round((me?.speed || 0) * 3.6)}</strong><span>KM/H</span></div>
        {active && <div className="gk-drive-feedback"><b>{me?.crash ? 'CRASH!' : world.lesson && me && !me.finish && quizProgress < QUIZ_END ? 'CHOOSE YOUR LANE' : me?.jump ? 'AIR TIME' : me?.boost ? 'BOOST!' : me && me.draft > .7 ? 'SLIPSTREAM' : me && me.charge > .6 ? 'RELEASE TO BOOST' : 'AUTO ACCEL'}</b><div className="gk-charge"><i style={{ width: `${(me?.charge || 0) / 2.4 * 100}%` }} /><span /><span /></div><small>DRIFT CHARGE</small></div>}
        {world.phase === 'lobby' && <div className="gk-overlay"><section className="gk-card gk-ready-card online-collection">
          <header className="online-collection-heading"><div><small>GRID / READY ROOM</small><h2>スターティンググリッド</h2></div><strong>参加者 {racers.filter(p => !p.cpu).length} / {MAX_RACERS}</strong></header>
          <div className="online-collection-layout"><div className="online-collection-left"><div className="online-self-preview"><KartCanvas world={preview} selfId="preview" preview /></div><div className="gk-roster online-roster" data-allow-japanese="true">{racers.filter(p=>!p.cpu).map(p => <div key={p.id} data-self={p.id===self}><i style={{ background: AVATAR_COLORS[p.avatar.outfit] }} /><span className="online-member-name">{p.name}</span>{p.spectator ? <small>WATCH</small> : p.id === self && <small>YOU</small>}</div>)}</div></div>
          <aside className="online-collection-controls">{room.current?.code && <button className="gk-code" onClick={async () => { try { await navigator.clipboard.writeText(shareRoomCode(room.current!.code,room.current!.transport)); setCopied(true); } catch { setError('コードを選択してコピーしてください。'); } }}>{shareRoomCode(room.current.code,room.current.transport)}<small>{copied ? 'コピー済み' : 'コピー'}</small></button>}
          {invite && <div className="gk-invite"><input readOnly aria-label="招待リンク" value={invite} onFocus={e => e.target.select()} /><button onClick={copyInvitation}>{inviteCopied ? 'コピーしました' : '招待URLをコピー'}</button></div>}
          <details className="online-avatar-details" open={lobbyAvatarOpen} onToggle={e=>setLobbyAvatarOpen(e.currentTarget.open)}><summary>キャラクタークリエイト</summary><AvatarCreator value={avatar} onChange={changeAvatar} languageMode={languageMode} /></details>
          <details className="online-avatar-details"><summary>周回数 · {world.laps}</summary><LapCountPicker value={world.laps} onChange={laps => room.current?.setLaps(laps)} disabled={!room.current?.host} languageMode={languageMode} /></details>
          {room.current?.host ? <><div className="gk-lesson-summary"><p>{world.lesson?.title}</p><button onClick={() => setPicking('edit')}>問題を選び直す</button></div><label className="gk-fill"><input type="checkbox" checked={fill} onChange={e => setFill(e.target.checked)} />空き枠をCPUで埋める</label><button className="gk-primary" disabled={!world.lesson || (!fill && !order.length)} onClick={e => { wakeAudio(); e.currentTarget.blur(); room.current?.start(fill); }}>レースを開始 →</button></> : <p>ホストのスタートを待っています。</p>}</aside></div>
          <WaitingHomeDash languageMode={languageMode}/>
        </section></div>}
        {world.phase === 'countdown' && <div className="gk-countdown"><span>{Math.ceil(world.remaining)}</span><p>GET READY TO BREAK AWAY</p></div>}
        {!spectating && world.phase === 'race' && !!me?.finish && <div className="gk-finished"><b>FREE RUN</b><span>#{place} · {time(me.finish)}</span><p>順位・タイム確定！結果がそろうまで自由に走れます。</p></div>}
        {world.phase === 'result' && <div className="gk-overlay"><section className="gk-card gk-result-card"><small>THE AFTER-SCHOOL GRAND PRIX</small><h2>{spectating ? 'RACE RESULTS' : place === 1 ? 'YOU WIN!' : `FINISH / #${place}`}</h2><div className="gk-result-stats"><div><b>{me?.finish ? time(me.finish) : 'DNF'}</b><span>TIME</span></div><div><b>{me?.drifts || 0}</b><span>DRIFT BOOSTS</span></div><div><b>{me?.overtakes || 0}</b><span>OVERTAKES</span></div></div><div className="gk-result-grid"><div className="gk-result-ranking"><ol className="gk-results">{order.map((p, i) => <li key={p.id} className={p.id === viewId ? 'is-self' : ''}><b>{String(i + 1).padStart(2, '0')}</b><i style={{ background: AVATAR_COLORS[p.avatar.outfit] }} /><span>{p.name}<small>{p.cpu ? 'CPU' : 'PLAYER'}</small></span><strong>{p.quizCorrectTotal}/{3 * world.laps} · {p.finish ? time(p.finish) : 'DNF'}</strong></li>)}</ol></div><aside className="gk-result-actions">{room.current?.host ? <><div className="gk-result-settings"><button onClick={()=>setEditingCourse(true)}>オリジナルコース作成</button>{nextCustom&&<p data-allow-japanese="true">{nextCustom.name}</p>}<NextCoursePicker value={nextCourse} onChange={value=>{setNextCourse(value);setNextCustom(undefined);}} disabled={busy} languageMode={languageMode} /><LapCountPicker value={nextLaps} onChange={setNextLaps} disabled={busy} languageMode={languageMode} /></div><button className="gk-primary" disabled={busy} onClick={restart}>もう一度レース</button></> : <p>ホストの再戦を待っています。</p>}<button className="gk-secondary" onClick={leave}>ガレージへ戻る</button></aside></div></section></div>}
      </section>
      {!spectating && world.phase === 'race' && <nav className="gk-controls" aria-label="Race controls"><div className="gk-steering"><SteeringPad disabled={!active} onChange={value => { stickInput.current = value; }} /></div><div className="gk-control-hint">AUTO ACCEL<span>CHASE YOUR LIMIT.</span></div><button className="gk-brake" disabled={!active} {...touch('brake')}>BRAKE<small>↓ / S</small></button><button className="gk-drift" disabled={!active} {...touch('drift')}>DRIFT<small>SPACE / SHIFT</small></button><button className="gk-item" disabled={!active || !me?.item || !!(world.lesson && me && !me.finish && quizProgress < QUIZ_END)} onClick={() => room.current?.send({ type: 'item' })}><b>{me?.item ? ITEMS[me.item] : '◇'}</b><small>ITEM / E</small>{me?.item && <span className="gk-item-effect">{ITEM_EFFECTS[me.item]}</span>}</button></nav>}
    </>}
  </main></TranslatedUiTree>;
}
