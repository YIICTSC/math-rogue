import EquipmentBar from './EquipmentBar';
import {audioService} from '../../services/audioService';
import {useVrBgm,createRunAudio,cue} from './audio';
import Quiz from './Quiz';
import type {KartLesson} from '../gakuro-kart/learning';
import type {KartAvatar} from '../gakuro-kart/avatar';
import React, { useEffect, useRef, useState } from 'react';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { MISSIONS, DIFFICULTIES, floorHeight, nearbySwitch, underPassage, sensorActive, holdCandidate, objectivesComplete, SAVE_KEY, createRun, distance, rank, readRecords, step, type Input, type Records, type Run } from './engine';
import { createScene, type ViewMode } from './scene';
import StagePreview from './StagePreview';
import './gakurogear.css';

export default function GakuroGear({ onBack, languageMode, lesson, avatar, onConfigure, editing=false }: MiniGameComponentProps & {lesson?:KartLesson;avatar?:KartAvatar;onConfigure?:()=>void;editing?:boolean}) {
  const editingRef=useRef(editing);editingRef.current=editing;
  const en = languageMode === 'ENGLISH';
  const t = (ja: string, english: string) => en ? english : ja;
  const [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false), [attempt, setAttempt] = useState(0);
  const [records, setRecords] = useState<Records>(readRecords), [paused, setPaused] = useState(false), [error, setError] = useState('');
  const [quizDone,setQuizDone]=useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overhead');
  const view = useRef({ mode: 'overhead' as ViewMode, yaw: Math.PI });
  const turn = useRef(0), lookPointer = useRef<{ id: number; x: number } | null>(null);
  const changeView = (mode: ViewMode) => { view.current = { mode, yaw: live.current?.player.angle ?? Math.PI }; setViewMode(mode); clearInput(); };
  const [difficulty, setDifficulty] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const mission = MISSIONS[selected];
  const [hud, setHud] = useState<Run>(() => createRun(mission));
  useVrBgm(!playing?'lobby':hud.status==='playing'?'training':lesson&&!quizDone?'quiz':hud.status==='clear'?'clear':'fail',mission.id);
  const sceneRef=useRef<ReturnType<typeof createScene>|null>(null);
  useEffect(()=>{if(avatar)sceneRef.current?.setAvatar(avatar);},[avatar]);
  const host = useRef<HTMLDivElement>(null), live = useRef<Run | null>(null), pauseRef = useRef(false);
  const input = useRef<Input>({ x: 0, z: 0, crouch: false, interact: false, decoy: false });
  const stick = useRef<{ id: number; x: number; y: number } | null>(null);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [crouch, setCrouch] = useState(false);
  const clearInput = () => { turn.current = 0; lookPointer.current = null; input.current.x = 0; input.current.z = 0; input.current.interact = false; input.current.decoy = false; input.current.hold = false; input.current.shoot = false; input.current.useItem = false; stick.current = null; setStickPosition({ x: 0, y: 0 }); };
  const togglePause = () => { pauseRef.current = !pauseRef.current; setPaused(pauseRef.current); clearInput(); };
  const start = () => { void audioService.unlockAudio(); cue('select'); setQuizDone(false); clearInput(); input.current.crouch = false; setCrouch(false); pauseRef.current = false; setPaused(false); setError(''); setHud(createRun(mission)); setPlaying(true); setAttempt(v => v + 1); };
  useEffect(() => {
    if (!playing || !host.current) return;
    const s = createRun(mission); live.current = s; view.current.yaw = s.player.angle;
    let sceneView: ReturnType<typeof createScene>;
    try { sceneView = createScene(host.current, mission, avatar); } catch { setError(t('3Dの初期化に失敗しました。ブラウザのハードウェアアクセラレーションを確認してください。', '3D could not start. Check hardware acceleration in your browser.')); return; }
    sceneRef.current=sceneView;
    const keys = new Set<string>(); let frame = 0, previous = performance.now(), lastHud = 0, saved = false;
    function keydown(e: KeyboardEvent) {
      if(editingRef.current || (e.target instanceof HTMLElement && e.target.closest('select,input,textarea')))return;
      if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyC', 'KeyQ', 'KeyF', 'KeyR', 'KeyV', 'KeyJ', 'KeyL', 'KeyX', 'Escape', 'Space'].includes(e.code)) return;
      e.preventDefault(); e.stopPropagation();
      if (e.code === 'Escape' && !e.repeat) { togglePause(); keys.clear(); return; }
      if (pauseRef.current || s.status !== 'playing') return;
      if (e.code === 'KeyV' && !e.repeat) { const modes: ViewMode[] = ['overhead', 'first', 'third']; changeView(modes[(modes.indexOf(view.current.mode) + 1) % 3]); keys.clear(); return; }
      keys.add(e.code);
      if (e.code === 'KeyC' && !e.repeat) { input.current.crouch = !input.current.crouch; setCrouch(input.current.crouch); }
      if (e.code === 'KeyQ' && !e.repeat) input.current.decoy = true;
      if (e.code === 'KeyX' && !e.repeat) input.current.useItem = true;
      if (e.code === 'KeyR' && !e.repeat) input.current.shoot = true;
    }
    function keyup(e: KeyboardEvent) { if (keys.has(e.code)) { e.preventDefault(); e.stopPropagation(); } keys.delete(e.code); }
    const blur = () => { keys.clear(); clearInput(); pauseRef.current = true; setPaused(true); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('keydown', keydown, true); window.addEventListener('keyup', keyup, true); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    const sounds=createRunAudio();
    const loop = (now: number) => {
      const dt = (now - previous) / 1000; previous = now;
      if (!pauseRef.current) {
        const relative = view.current.mode !== 'overhead';
        const x = Number(keys.has('KeyD') || (!relative && keys.has('ArrowRight'))) - Number(keys.has('KeyA') || (!relative && keys.has('ArrowLeft')));
        const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
        let moveX = x || input.current.x, moveZ = z || input.current.z;
        if (relative) {
          const rotation = Number(keys.has('KeyL') || keys.has('ArrowRight')) - Number(keys.has('KeyJ') || keys.has('ArrowLeft')) + turn.current;
          view.current.yaw -= rotation * Math.min(dt, .05) * 1.9;
          const yaw = view.current.yaw, right = moveX, forward = -moveZ;
          moveX = -Math.cos(yaw) * right + Math.sin(yaw) * forward;
          moveZ = Math.sin(yaw) * right + Math.cos(yaw) * forward;
        }
        step(mission, s, { ...input.current, x: moveX, z: moveZ, facing: relative ? view.current.yaw : undefined, hold: input.current.hold || keys.has('KeyF'), interact: input.current.interact || keys.has('KeyE') || keys.has('Space') }, dt);
        if (s.holdTarget >= 0) view.current.yaw = s.player.angle;
        input.current.decoy = false; input.current.shoot = false; input.current.useItem = false;
      }
      if (s.status === 'clear' && !saved) {
        saved = true; const next = readRecords(), score = rank(mission, s), old = next[mission.id];
        if (!old || 'SAB'.indexOf(score) < 'SAB'.indexOf(old.rank) || (score === old.rank && s.time < old.time)) next[mission.id] = { time: s.time, rank: score };
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { setSaveError(true); }
        setRecords(next);
      }
      sceneView.draw(s, view.current); sounds(s,mission.limit);
      if (now - lastHud > 90) { setHud({ ...s, player: { ...s.player }, guards: s.guards.map(g => ({ ...g })), collected: [...s.collected] }); lastHud = now; }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); sceneView.dispose(); sceneRef.current=null; window.removeEventListener('keydown', keydown, true); window.removeEventListener('keyup', keyup, true); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); live.current = null; };
  }, [playing, selected, attempt]);
  const count = hud.collected.filter(Boolean).length;
  const canHold = holdCandidate(mission, hud) >= 0;
  const ready = objectivesComplete(mission, hud);
  const switchNear = nearbySwitch(mission, hud) >= 0;
  const nearIndex = mission.targets.findIndex((p,i)=>!hud.collected[i]&&distance({...p,y:floorHeight(mission,p)},hud.player)<1.2);
  const near=nearIndex>=0;
  const leave = () => { clearInput(); setPlaying(false); };
  const hold = (field: 'interact' | 'hold', value: boolean) => { input.current[field] = value; };
  return <div className="gear-shell" data-testid="gakurogear">
    <header className="gear-header"><button onClick={playing ? leave : onBack}>{t('← 戻る', '← Back')}</button><div><strong>GAKURO</strong><span>VR TRAINING / SCHOOL OPERATIONS</span></div>{onConfigure&&<button onClick={()=>{clearInput();if(playing&&!paused)togglePause();onConfigure();}}>{t('キャラクタークリエイト','Character creator')}</button>}<span className="gear-tag">SOLO / 3D</span></header>
    {!playing ? <main className="gear-select gear-stage-select">
      <section className="gear-intro"><StagePreview mission={mission}/><div className="gear-eyebrow">TACTICAL SCHOOL / TRAINING PROGRAM</div><h1>GAKURO<br /><em>VR {t('トレーニング', 'TRAINING')}</em></h1><p>{t('見つからずに、任務を果たせ。', 'Complete the mission. Stay unseen.')}</p><div className="gear-brief">{t('学校から都市・山岳・地下基地まで300任務。広さと高低差、救助・端末・防衛の目標に合わせ、6種類の武器と4種類のアイテムを使い分けよう。', '300 missions across schools, cities, mountains and bases. Adapt six weapons and four items to different sizes, elevation, rescue, relay and defense objectives.')}</div><div className="gear-stats"><span>300<br /><small>MISSIONS</small></span><span>{Object.keys(records).length.toString().padStart(2, '0')}<br /><small>CLEARED</small></span><span>PS-ERA<br /><small>LOW POLYGON</small></span></div><div className="gear-help">{t('移動: WASD / 矢印 / スティック　しゃがむ: C　回収: E長押し　音のデコイ: Q　ホールド: F長押し　装備選択: スロット　攻撃: R　アイテム: X　視点: V　旋回: J/L・画面ドラッグ　一時停止: Esc', 'Move: WASD / arrows / stick · C: crouch · Hold E: collect · Q: sound decoy · Hold F: sleep hold · Slots: equip · R: attack · X: item · V: view · J/L or drag: turn · Esc: pause')}</div></section>
      <section className="gear-missions"><h2>{t('ミッション選択', 'SELECT MISSION')}</h2><div className="gear-difficulties">{DIFFICULTIES.map((d, i) => <button key={d.en} aria-pressed={difficulty === i} onClick={() => { setDifficulty(i); setSelected(i*60); }}>{i*60+1}–{(i+1)*60}<small>60 STAGES</small></button>)}</div><div className="gear-mission-list">{MISSIONS.filter(m => Math.floor((m.id-1)/60) === difficulty).sort((a,b)=>a.id-b.id).map(m => <button key={m.id} className={`gear-mission ${selected === m.id - 1 ? 'selected' : ''}`} onClick={() => setSelected(m.id - 1)} aria-pressed={selected === m.id - 1}><span className="gear-number">{String(m.id).padStart(2, '0')}</span><span><strong>{en ? m.en : m.name}</strong><small>{(m.size??8)*2}m · {m.terrain?.[0]?.height??0}m ↑ / {m.targets.length} TASKS / {m.routes.length} PATROLS / {m.cameras.length} CAMERAS</small></span><b>{records[m.id]?.rank ?? '—'}</b></button>)}</div><details className="gear-brief gear-mission-brief"><summary>{t('任務の詳細・ヒント','Mission details and hints')}</summary><strong>BRIEFING / {String(mission.id).padStart(2, '0')}</strong><p>{en ? mission.hintEn : mission.hint}</p><p>{mission.obstacles.some(b => b.kind === 'crawl') && t('黄色い低いシャッターはしゃがんで通過。', 'Crouch under yellow shutters. ')}{!!mission.switches?.length && t('オレンジのスイッチでE長押し→青い扉が開く。', 'Hold E at orange switches to open blue doors. ')}{!!mission.sensors?.length && t('赤い光センサーは消灯中か、しゃがんで通過。', 'Pass red light sensors while off or crouched.')}</p><p>{mission.requireSwitches&&t("全スイッチを起動。", "Activate every switch. ")}{mission.defend&&`${t("防衛地点", "Defense zone")}: ${mission.defend.seconds}s`}</p><p>{t('シャボン弾', 'Bubbles')}: {mission.ammo} / {t('おやすみ時間', 'Sleep duration')}: {mission.sleepDuration}s<br />{t('追加課題：ホールド', 'Objectives: holds')} {mission.requiredHolds} / {t('シャボン命中', 'Bubble hits')} {mission.requiredShots}</p><small>{t('目標時間', 'Target time')}: {mission.par}s · {t('制限', 'Limit')}: {mission.limit}s {records[mission.id] && `· BEST ${records[mission.id].time.toFixed(1)}s`}</small></details><button className="gear-primary" onClick={start}>{t('訓練開始', 'START TRAINING')} →</button></section>
    </main> : <>
      <div className="gear-hud"><div><small>MISSION {String(mission.id).padStart(2, '0')}</small><strong>{en ? mission.en : mission.name}</strong></div><div><small>FILES</small><strong>{count} / {mission.targets.length}</strong></div><div><small>TIME LEFT</small><strong>{Math.max(0, Math.ceil(mission.limit - hud.time))}s</strong></div><button onClick={togglePause}>{t('一時停止', 'Pause')}</button></div>
      <div className="gear-equipment"><span>{mission.targetKinds&&t("青: 資料 / 桃: 救助 / 黄: 端末", "Blue: files / Pink: rescue / Yellow: relay")}</span><span>{t('ホールド', 'Holds')} {hud.holds}/{mission.requiredHolds || '—'}</span><span>{t('シャボン命中', 'Bubble hits')} {hud.shots}/{mission.requiredShots || '—'}</span><span>{t('おやすみ中', 'Asleep')} {hud.guards.filter(g => g.sleep > 0).length} {hud.guards.some(g => g.sleep > 0) && `(${Math.ceil(Math.min(...hud.guards.filter(g => g.sleep > 0).map(g => g.sleep)))}s)`}</span></div><nav className="gear-viewbar" aria-label={t('視点切替', 'Camera view')}>{(['overhead', 'first', 'third'] as ViewMode[]).map((mode, i) => <button key={mode} onClick={() => changeView(mode)} aria-pressed={viewMode === mode}>{t(['俯瞰', '一人称', '三人称'][i], ['Overhead', 'First person', 'Third person'][i])}</button>)}{viewMode !== 'overhead' && <><button aria-label={t('左に旋回', 'Turn left')} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); turn.current = -1; }} onPointerUp={() => { turn.current = 0; }} onPointerCancel={() => { turn.current = 0; }}>↶</button><button aria-label={t('右に旋回', 'Turn right')} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); turn.current = 1; }} onPointerUp={() => { turn.current = 0; }} onPointerCancel={() => { turn.current = 0; }}>↷</button><small>{t('画面ドラッグで旋回 / J・L', 'Drag to turn / J · L')}</small></>}</nav>
      <div className="gear-field"><EquipmentBar run={hud} stageId={mission.id} en={en} onInput={v=>Object.assign(input.current,v)}/><div className="gear-canvas" ref={host} onPointerDown={e => { if (view.current.mode === 'overhead' || paused) return; e.currentTarget.setPointerCapture(e.pointerId); lookPointer.current = { id: e.pointerId, x: e.clientX }; }} onPointerMove={e => { const last = lookPointer.current; if (!last || last.id !== e.pointerId) return; view.current.yaw -= (e.clientX - last.x) * .007; last.x = e.clientX; }} onPointerUp={() => { lookPointer.current = null; }} onPointerCancel={() => { lookPointer.current = null; }} /><div className="gear-scanlines" /><div className={`gear-alert ${hud.detection > 0 ? 'warning' : ''}`}><span>{hud.detection > 0 ? t('警戒上昇 — 遮蔽物へ！', 'SUSPICION — FIND COVER!') : t('未発見', 'UNDETECTED')}</span><progress max={100} value={hud.detection} /></div>
      <svg className="gear-radar" viewBox={`${-(mission.size??8)} ${-(mission.size??8)} ${(mission.size??8)*2} ${(mission.size??8)*2}`} aria-label={t('レーダー', 'Radar')}><rect x={-(mission.size??8)} y={-(mission.size??8)} width={(mission.size??8)*2} height={(mission.size??8)*2} fill="#071e20" />{mission.obstacles.map((b, i) => (b.kind !== 'door' || !hud.switches[b.switchId ?? 0]) && <rect key={i} x={b.x - b.w / 2} y={b.z - b.d / 2} width={b.w} height={b.d} fill={b.kind === 'crawl' ? '#c5a254' : b.kind === 'door' ? '#538ea5' : '#61716c'} />)}{(mission.switches ?? []).map((p, i) => <circle key={`switch-${i}`} cx={p.x} cy={p.z} r=".3" fill={hud.switches[i] ? '#73ffb0' : '#ffbb5e'} />)}{(mission.sensors ?? []).map((b, i) => sensorActive(b.period, hud.time) && <rect key={`sensor-${i}`} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} fill="#ff6579" />)}{mission.targets.map((p, i) => !hud.collected[i] && <circle key={i} cx={p.x} cy={p.z} r=".38" fill="#70eaff" />)}{hud.guards.map((g, i) => <path key={i} d="M0 -.5 L.35 .4 L-.35 .4 Z" fill={g.sleep > 0 ? "#9bdcff" : "#ffa263"} transform={`translate(${g.x},${g.z}) rotate(${180 - g.angle * 180 / Math.PI})`} />)}<circle cx={mission.exit.x} cy={mission.exit.z} r=".6" fill={ready ? '#70ffa3' : '#476350'} /><circle cx={hud.player.x} cy={hud.player.z} r=".35" fill="white" /></svg>
      <div className="gear-objective">{mission.defend&&<span>⚑ {hud.defended.toFixed(1)}/{mission.defend.seconds}s · </span>}{mission.requireSwitches&&<span>▣ {hud.switches.filter(Boolean).length}/{hud.switches.length} · </span>}{switchNear ? t('E／回収を長押しして扉を開く', 'Hold E / Collect to open door') : underPassage(mission, hud.player) ? t('低い通路：抜けるまでしゃがみ移動', 'Low passage: stay crouched until clear') : canHold ? t('背後チャンス！F／ホールドを長押し', 'Behind target! Hold F / Hold') : near ? t('止まってE／回収を長押し', 'Stop and hold E / Collect') : ready ? t('緑の出口へ向かえ', 'Reach the green exit') : count === mission.targets.length ? t('追加課題を達成して出口へ', 'Complete the extra objectives') : mission.targetKinds?t('救助・端末・資料の全目標を達成せよ', 'Complete rescue, relay and file objectives'):t('青い資料を回収せよ', 'Recover the blue files')}{hud.switchProgress > 0 && <progress max={.65} value={hud.switchProgress} />}{hud.holdProgress > 0 && <progress max={.9} value={hud.holdProgress} />}{hud.interact > 0 && <progress max={mission.targetKinds?.[nearIndex]==='relay'?1.5:mission.targetKinds?.[nearIndex]==='rescue'?1.2:.8} value={hud.interact} />}</div>
      {lesson && hud.status !== 'playing' && !quizDone && <Quiz lesson={{...lesson,questions:Array.from({length:3},(_,i)=>lesson.questions[((attempt-1)*3+i)%lesson.questions.length])}} en={en} onComplete={()=>setQuizDone(true)}/>}
      {(paused || (hud.status !== 'playing' && (!lesson || quizDone)) || error) && <div className="gear-overlay"><section role="dialog" aria-modal="true"><small>GAKURO / TRAINING REPORT</small><h2>{error ? t('起動エラー', 'STARTUP ERROR') : hud.status === 'clear' ? 'MISSION COMPLETE' : hud.status === 'caught' ? t('発見された', 'DETECTED') : hud.status === 'timeout' ? 'TIME UP' : t('一時停止', 'PAUSED')}</h2>{error ? <p>{error}</p> : hud.status === 'clear' ? <><div className="gear-rank">{rank(mission, hud)}</div><p>{hud.time.toFixed(1)}s / {t('最大警戒', 'Peak suspicion')} {Math.round(hud.peak)}%</p><p>{t('S評価: 目標時間以内・警戒ゼロ', 'S rank: within target time, zero suspicion')}</p>{saveError && <p>{t('記録を保存できませんでした。', 'Could not save the record.')}</p>}</> : <p>{en ? mission.hintEn : mission.hint}</p>}{paused && hud.status === 'playing' && !error && <button className="gear-primary" onClick={togglePause}>{t('再開', 'RESUME')}</button>}{!error && <button onClick={start}>{t('もう一度', 'RETRY')}</button>}{hud.status === 'clear' && selected < MISSIONS.length - 1 && <button onClick={() => { setDifficulty(Math.floor((MISSIONS[selected+1].id-1)/60)); setSelected(selected + 1); start(); }}>{t('次のミッション', 'NEXT MISSION')}</button>}<button onClick={leave}>{t('ミッション選択へ', 'MISSION SELECT')}</button></section></div>}
      </div>
      <footer className="gear-controls"><div className="gear-stick" role="group" aria-label={t('移動スティック', 'Movement stick')} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); const r = e.currentTarget.getBoundingClientRect(); stick.current = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }} onPointerMove={e => { const s = stick.current; if (!s || s.id !== e.pointerId) return; const dx = e.clientX - s.x, dy = e.clientY - s.y, len = Math.max(28, Math.hypot(dx, dy)); input.current.x = dx / len; input.current.z = dy / len; setStickPosition({ x: dx / len * 25, y: dy / len * 25 }); }} onPointerUp={() => { input.current.x = input.current.z = 0; stick.current = null; setStickPosition({ x: 0, y: 0 }); }} onPointerCancel={() => { input.current.x = input.current.z = 0; stick.current = null; setStickPosition({ x: 0, y: 0 }); }}><span style={{ transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)` }}>✥</span></div><button aria-pressed={hud.crouch} onClick={() => { input.current.crouch = !input.current.crouch; setCrouch(input.current.crouch); }}>{t(hud.crouch ? 'しゃがみ中' : 'しゃがむ', hud.crouch ? 'CROUCHING' : 'CROUCH')}<small>C</small></button><button onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); hold('interact', true); }} onPointerUp={() => hold('interact', false)} onPointerCancel={() => hold('interact', false)} onKeyDown={e => { if (e.key === 'Enter') hold('interact', true); }} onKeyUp={() => hold('interact', false)}>{t('回収（長押し）', 'HOLD TO COLLECT')}<small>E</small></button><button aria-label={t('おやすみホールド', 'Sleep hold')} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); hold('hold', true); }} onPointerUp={() => hold('hold', false)} onPointerCancel={() => hold('hold', false)} onKeyDown={e => { if (e.key === 'Enter') hold('hold', true); }} onKeyUp={() => hold('hold', false)} className={canHold ? 'gear-action-ready' : ''}>{t('ホールド', 'HOLD')}<small>F {t('長押し', 'HOLD')}</small></button></footer>
    </>}
  </div>;
}
