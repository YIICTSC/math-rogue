import '../shared/lobby.css';
import HostSpectator, { useSpectatorTarget } from '../shared/HostSpectator';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import { trans } from '../../utils/textUtils';
import type { LanguageMode } from '../../types';
import { buildLesson, type LessonSelection } from '../gakuro-kart/questions';
import { benefits, CLUBS, MAX_PLAYERS, type Club, type GolfCommand, type GolfView } from './engine';
import { HOLES, distance, surface } from './course';
import { GolfRoom } from './network';
import GolfCanvas from './GolfCanvas';
import ShotMeter from './ShotMeter';
import CourseHud, { ClubIcon } from './CourseHud';
import { predictShot } from './motion';
import LessonPicker from './LessonPicker';
import QuizPanel from './QuizPanel';
import AvatarCreator from '../gakuro-kart/AvatarCreator';
import { loadAvatar, validAvatar, type KartAvatar } from '../gakuro-kart/avatar';
import './golf.css';
import { useGolfAudio } from './useGolfAudio';
const lies = { green: 'グリーン', fairway: 'フェアウェイ', rough: 'ラフ', sand: 'バンカー', water: '池', ob: 'OB' };
export default function GakuroGolf({ onClose, languageMode = 'JAPANESE' }: { onClose: () => void; languageMode?: LanguageMode }) {
  const [view, setView] = useState<GolfView | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [name, setName] = useState('Player'), [code, setCode] = useState(''), [picker, setPicker] = useState<'practice' | 'host' | 'change' | null>(null);
  const [club, setClub] = useState<Club>('driver'), [power, setPower] = useState(.7), [offset, setOffset] = useState(0), [overview, setOverview] = useState(false), [showScores, setShowScores] = useState(false);
  const [spin, setSpin] = useState(0), [meterActive, setMeterActive] = useState(false);
  const [avatar, setAvatar] = useState<KartAvatar>(() => { try { const saved = JSON.parse(localStorage.getItem('gakuro-golf-avatar-v1') || 'null'); return validAvatar(saved) ? saved : loadAvatar(); } catch { return loadAvatar(); } });
  const [showCreator, setShowCreator] = useState(false);
  const [holeCount, setHoleCount] = useState(18), [rules, setRules] = useState(false);
  const room = useRef<GolfRoom | null>(null), mounted = useRef(true);
  useEffect(() => { if (view?.phase === 'lobby') room.current?.send({ type: 'avatar', avatar }); else if (view) setShowCreator(false); }, [avatar, view?.phase]);
  const changeAvatar = (value: KartAvatar) => { setAvatar(value); try { localStorage.setItem('gakuro-golf-avatar-v1', JSON.stringify(value)); } catch { /* Session editing still works. */ } };
  const t = (s: string) => trans(s, languageMode);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; room.current?.close(); room.current = null; }; }, []);
  const self = room.current?.selfId || '', own = view?.players.find(p => p.id === self);
  const spectating = !!own?.spectator;
  const candidates = (view?.players || []).filter(p => p.id !== self && p.connected && !p.spectator);
  const spectators = useSpectatorTarget(spectating, candidates.map(p => p.id));
  const viewId = spectating ? spectators.target || self : self;
  const me = view?.players.find(p => p.id === viewId), hole = HOLES[me?.hole ?? 0];
  useEffect(() => { room.current?.observe(spectating ? spectators.target : null); }, [spectating, spectators.target]);
  useGolfAudio(view, me);
  const remaining = me ? distance(me, hole.cup) : hole.cup.z;
  const baseAngle = me ? Math.atan2(hole.cup.x - me.x, hole.cup.z - me.z) : 0;
  const angle = Math.atan2(Math.sin(baseAngle + offset * Math.PI / 180), Math.cos(baseAngle + offset * Math.PI / 180));
  useEffect(() => { if (me?.phase === 'aim') { setOffset(0); setPower(.7); setClub(remaining < 22 ? 'putter' : remaining < 55 ? 'wedge' : remaining < 110 ? 'iron' : 'driver'); } }, [me?.phase, me?.shotId]);
  const leave = () => { const old = room.current; room.current = null; old?.close(); setView(null); setMessage(''); setPicker(null); setBusy(false); };
  const createRoom = () => {
    const next = new GolfRoom(v => { if (mounted.current && room.current === next) setView(v); }, m => { if (mounted.current && room.current === next) setMessage(m); });
    room.current = next; return next;
  };
  const selectLesson = async (selection: LessonSelection) => {
    const intent = picker; if (!intent || busy) return; setBusy(true); setMessage('');
    let current = room.current;
    try {
      // Yield so the preparation state is painted before building a large question pool.
      await new Promise(resolve => setTimeout(resolve, 0)); if (!mounted.current) return;
      buildLesson(selection);
      if (intent !== 'change') { current = createRoom(); if (intent === 'host') await current.create(name); else current.practice(name); }
      if (!current || room.current !== current || !mounted.current) return;
      current.setLesson(() => buildLesson(selection), selection);
      if (intent !== 'change') current.setHoleCount(holeCount); setPicker(null);
    } catch (e) { if (mounted.current) { if (intent !== 'change' && current && room.current === current) { room.current = null; current.close(); setView(null); } setMessage(e instanceof Error ? e.message : '問題を準備できませんでした。'); } }
    finally { if (mounted.current) setBusy(false); }
  };
  const join = async () => {
    if (busy) return; setBusy(true); setMessage(''); const current = createRoom();
    try { await current.join(code, name); }
    catch (e) { if (mounted.current && room.current === current) { room.current = null; current.close(); setView(null); setMessage(e instanceof Error ? e.message : '接続できませんでした。'); } }
    finally { if (mounted.current) setBusy(false); }
  };
  const send = (c: GolfCommand) => { if (!spectating && !view?.paused) room.current?.send(c); };
  const bonus = benefits(me?.correct ?? 0);
  const projected = useMemo(()=>me?.phase==='aim' ? predictShot(me,club,angle,power,club === 'putter' ? 0 : spin).at(-1) : undefined,[me?.phase,me?.hole,me?.x,me?.z,me?.correct,club,angle,power,spin]);
  const carry = me&&projected ? distance(me,projected) : 0;
  const scoreRows = [...(view?.players || [])].filter(p => !p.spectator).sort((a, b) => {
    const completeA = a.phase === 'finished', completeB = b.phase === 'finished';
    return Number(completeB) - Number(completeA) || b.scores.length - a.scores.length || a.scores.reduce((s, n) => s + n, 0) - b.scores.reduce((s, n) => s + n, 0) || a.slot - b.slot;
  });
  return <TranslatedUiTree mode={languageMode}><main className={`gg-root ${view?.phase==='lobby'?'gg-collecting':''} ${!view?'gg-title-screen':''} ${view&&view.phase!=='lobby'&&!picker?'gg-playing':''} ${spectating?'gg-spectating':''}`} data-gamepad-initial-scope="gakuro-golf">
    <header className="gg-header"><button onClick={() => { leave(); onClose(); }}>{t('タイトルへ')}</button><div className="gg-brand">GAKURO <strong>GOLF</strong><small>LEARN · AIM · SWING</small></div><span className="gg-debug">{t('開発中・デバッグ限定')}</span></header>
    {view && room.current?.host && room.current.code && (view.phase==='lobby'||spectating) && <HostSpectator enabled={spectating} canChangeMode={view.phase === 'lobby'} onChange={value => room.current?.setSpectator(value)} name={spectators.target ? me?.name : undefined} count={candidates.length} onNext={spectators.next} languageMode={languageMode}>{me && spectators.target && <><span>HOLE {me.hole + 1} / {view.holeCount}</span><span>{t('打数')} {me.strokes}</span><span>{t('残り')} {remaining.toFixed(1)} m</span><span>{t(me.phase === 'quiz' ? '問題に挑戦中' : me.phase === 'aim' ? 'ショットを準備する' : me.phase === 'moving' ? 'ボールの行方を見よう' : me.phase === 'finished' ? '完走' : me.phase === 'holed' ? 'カップイン！' : 'プレイ中')}</span></>}</HostSpectator>}
    {message && <div role="alert" className="gg-message">{t(message)}</div>}
    {picker ? <LessonPicker languageMode={languageMode} busy={busy} error={message} onSelect={selectLesson} onBack={() => { if (!busy) { setPicker(null); setMessage(''); } }} /> : <>
      <section className={`gg-stage ${!view || view.phase === 'lobby' ? 'gg-preview' : ''} ${me?.phase === 'aim' ? 'gg-aiming' : ''}`}>
        <GolfCanvas view={view} selfId={viewId} spectator={spectating} aim={angle} overview={overview} club={club} power={power} spin={club === 'putter' ? 0 : spin} avatar={spectating ? me?.avatar || avatar : avatar} />
        {!view && <div className="gg-welcome gg-panel">
          <div className="gg-title-copy"><p className="gg-eyebrow">THE LEARNING LINKS / 18 HOLES</p><h1>GAKURO<br /><em>GOLF</em></h1><p>{t('学んで、狙って、カップイン。')}</p><p className="gg-muted">{t('18ホール・最大40人のオンラインゴルフ')}</p><button onClick={() => setRules(!rules)} aria-expanded={rules}>{t('遊び方')}</button></div>
          <div className="gg-title-actions">
            <label>{t('参加名')}<input value={name} maxLength={16} onChange={e => setName(e.target.value)} disabled={busy} /></label>
            <label>{t('プレイするホール数')}<select value={holeCount} disabled={busy} onChange={e => setHoleCount(Number(e.target.value))}>{Array.from({length:18},(_,i)=><option key={i} value={i+1}>{i+1} H / PAR {HOLES.slice(0,i+1).reduce((n,h)=>n+h.par,0)}</option>)}</select></label>
            <button disabled={busy} onClick={() => setShowCreator(true)}>{t('キャラクタークリエイト')}</button>
            <button className="gg-primary" disabled={busy} onClick={() => setPicker('host')}>{t('問題を選んで部屋を作る')}</button>
            <div className="gg-join"><input aria-label={t('ルームコード')} placeholder="ABC234" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} disabled={busy} /><button disabled={busy || code.trim().length !== 6} onClick={join}>{t('参加する')}</button></div>
            <button disabled={busy} onClick={() => setPicker('practice')}>{t('ひとりで練習')}</button>
            {busy && <p role="status">{t('接続中…')}</p>}
          </div>
        </div>}
        {view?.phase === 'lobby' && <div className="gg-lobby gg-panel online-collection"><header className="online-collection-heading"><h2>{t('スタート前の集合')}</h2><strong>{view.players.length} / {MAX_PLAYERS} {t('人')}</strong></header><div className="online-collection-layout"><div className="gg-roster online-roster" data-allow-japanese="true">{view.players.map(p => <span key={p.id} data-self={p.id === self}><b className="online-member-name">{p.name}</b>{p.spectator && ' · ' + t('観戦モード')}</span>)}</div>
          <aside className="online-collection-controls"><p>{t('ルームコード')} <strong className="gg-code">{room.current?.code || 'SOLO'}</strong></p><p data-allow-japanese="true">{view.title}</p><label>{t('プレイするホール数')}<select value={view.holeCount} disabled={!room.current?.host || busy} onChange={e => room.current?.setHoleCount(Number(e.target.value))}>{Array.from({length:18},(_,i)=><option key={i} value={i+1}>{i+1} H / PAR {HOLES.slice(0,i+1).reduce((n,h)=>n+h.par,0)}</option>)}</select></label>{room.current?.host ? <><button disabled={busy} onClick={() => setPicker('change')}>{t('問題の範囲を変更')}</button><button className="gg-primary" disabled={!view.title || busy || !view.players.some(p => p.connected && !p.spectator)} onClick={() => room.current?.start()}>{t('ラウンド開始')}</button><p className="gg-muted">{t(room.current?.serverHosted ? 'サーバーが試合を進行します。ホストの離席でもプレイできます。' : 'ホストは画面を開いたままにしてください。離席中は全員が一時停止します。')}</p></> : <p>{t('ホストの開始を待っています。')}</p>}
          <button onClick={() => setShowCreator(true)}>{t('キャラクタークリエイト')}</button><button onClick={leave}>{t('部屋を退出')}</button></aside></div></div>}
        {view && view.phase !== 'lobby' && me && <>
          <CourseHud player={me} hole={hole} remaining={remaining} aim={angle} players={view.players} holeCount={view.holeCount} t={t}/>
          <div className="gg-course-tools"><button aria-pressed={overview} onClick={() => setOverview(!overview)}>{t(overview ? 'ボールを追う' : 'コース全景')}</button><button aria-expanded={showScores} onClick={() => setShowScores(!showScores)}>{t('スコアボード')}</button><button onClick={leave}>{t('部屋を退出')}</button></div>
          <div className="gg-lie"><span>{t(lies[surface(hole, me)])}</span>{me.penalty&&<span role="status">{t('池・OB：1打罰で元の位置へ')}</span>}<span>{view.players.filter(p => p.connected).length} / {MAX_PLAYERS}</span></div>
          {view.paused && <p className="gg-paused" role="status">{t('ホストの画面が戻るまで一時停止しています。')}</p>}
          {view.phase === 'playing' && <div className="gg-play-ui">
            {!spectating && me.phase === 'ready' && <section className="gg-shot gg-panel"><h2>{t('次のショットを強くしよう')}</h2>{me.penalty && <p role="status">{t('池・OB：1打罰で元の位置へ')}</p>}<p>{t('3問の効果は次の3ショットに適用。罰打は回数に含みません。')}</p><button className="gg-primary" disabled={view.paused} onClick={() => send({ type: 'quiz' })}>{t('3問に挑戦')}</button></section>}
            {view.quiz && (!spectating || view.observedId === spectators.target) && <QuizPanel quiz={view.quiz} languageMode={languageMode} disabled={view.paused || spectating} send={send} />}
            {!spectating && me.phase === 'aim' && <section className="gg-shot gg-panel gg-shot-console"><div className="gg-shot-title"><h2>{t('ショットを準備する')}</h2><b>{me.correct} / 3 {t('正解')} · {t('効果残り')} {me.shotsLeft}</b></div><div className="gg-bonus"><span>{t('最大パワー')} <b>{Math.round(bonus.power * 100)}%</b></span><span>{t('方向の誤差')} <b>±{bonus.spread}°</b></span></div><div className="gg-club-readout"><ClubIcon club={club}/><div><strong>{t(CLUBS[club].name)}</strong><span>{t('推定飛距離')} {carry.toFixed(0)} m</span><span>{t('効果残り')} {me.shotsLeft} / 3</span></div></div><div className="gg-clubs">{(Object.keys(CLUBS) as Club[]).map(c => <button key={c} aria-pressed={club === c} disabled={view.paused || meterActive} onClick={() => setClub(c)}>{t(CLUBS[c].name)}</button>)}</div><label className="gg-aim-control">{t('狙う方向')} <b>{offset}°</b><input type="range" min={-180} max={180} step={1} value={offset} onChange={e => setOffset(Number(e.target.value))} disabled={view.paused || meterActive} /></label><div className="gg-contact"><button className="gg-contact-ball" aria-label={t('打点：上でトップスピン、下でバックスピン')} disabled={view.paused || meterActive || club === 'putter'} onPointerDown={e => { const r = e.currentTarget.getBoundingClientRect(); setSpin(Math.max(-1,Math.min(1,1-2*(e.clientY-r.top)/r.height))); }}><i style={{top:`${50-(club === 'putter' ? 0 : spin)*35}%`}}/></button><label>{t(club === 'putter' || spin === 0 ? '中央の打点' : spin > 0 ? 'トップスピン' : 'バックスピン')}<input aria-label={t('打点')} type="range" min={-1} max={1} step={.1} value={club === 'putter' ? 0 : spin} disabled={view.paused || meterActive || club === 'putter'} onChange={e => setSpin(Number(e.target.value))}/></label></div><ShotMeter limit={bonus.power} key={me.shotId} disabled={view.paused || !me.connected} t={t} onActive={setMeterActive} onPower={setPower} onShot={(power,impact) => send({ type: 'shot', shotId: me.shotId, club, angle, power, impact, spin: club === 'putter' ? 0 : spin })}/></section>}
            {me.phase === 'moving' && <p className="gg-flying" role="status">{me.shotQuality && <strong className={`gg-shot-quality ${me.shotQuality}`}>{me.shotQuality === 'nice' ? 'NICE SHOT!' : me.shotQuality === 'good' ? 'GOOD SHOT' : 'MISS'}</strong>}{t('ボールの行方を見よう')}</p>}
            {!spectating && me.phase === 'holed' && <section className="gg-shot gg-panel"><p className="gg-eyebrow">HOLE {me.hole + 1} / COMPLETE</p><h2>{t(me.capped ? '打数上限でホール終了' : 'カップイン！')}</h2><p>{me.strokes} {t('打')} · PAR {hole.par} · {me.strokes - hole.par > 0 ? '+' : ''}{me.strokes - hole.par}</p><button className="gg-primary" disabled={view.paused} onClick={() => send({ type: 'next' })}>{t(me.hole === view.holeCount - 1 ? 'ラウンド結果へ' : '次のホール')}</button></section>}
            {me.phase === 'finished' && <p className="gg-flying" role="status">{t('完走！ほかのプレイヤーの終了を待っています。')}</p>}
          </div>}
          {(showScores || view.phase === 'result') && <section className="gg-scores gg-panel"><header><h2>{t(view.phase === 'result' ? 'ラウンド結果' : 'スコアボード')}</h2>{view.phase !== 'result' && <button onClick={() => setShowScores(false)}>{t('閉じる')}</button>}</header><p className="gg-muted">{t('選んだホールの合計打数が少ない人が勝ち。同点は同順位です。')}</p><div className="gg-score-scroll"><table><thead><tr><th>{t('順位')}</th><th>{t('参加名')}</th>{HOLES.slice(0,view.holeCount).map((_, i) => <th key={i}>H{i + 1}</th>)}<th>{t('合計')}</th><th>{t('状態')}</th></tr></thead><tbody>{scoreRows.map(p => <tr key={p.id} className={p.id === me.id ? 'is-self' : ''}><td>{p.phase === 'finished' ? 1 + scoreRows.filter(other => other.phase === 'finished' && other.scores.reduce((s, n) => s + n, 0) < p.scores.reduce((s, n) => s + n, 0)).length : '—'}</td><td data-allow-japanese="true">{p.name}</td>{HOLES.slice(0,view.holeCount).map((_, i) => <td key={i}>{p.scores[i] ?? '—'}</td>)}<td>{p.scores.reduce((s, n) => s + n, 0)}</td><td>{t(!p.connected && p.phase !== 'finished' ? '途中退出' : p.phase === 'finished' ? '完走' : 'プレイ中')}</td></tr>)}</tbody></table></div>{view.phase === 'result' && <button className="gg-primary" onClick={leave}>{t('クラブハウスへ')}</button>}</section>}
        </>}
      </section>
      {!view && rules && <aside className="gg-rules gg-panel"><button onClick={()=>setRules(false)}>{t('閉じる')}</button><div><b>01 / LEARN</b><p>{t('開始時と3ショットごとに、選んだ範囲から3問。')}</p></div><div><b>02 / AIM</b><p>{t('0・1・2・3問正解で最大パワー55・70・85・100%。')}</p></div><div><b>03 / SWING</b><p>{t('クラブと方向を選んでカップを狙おう。池とOBは1打罰。')}</p></div></aside>}
    </>}
    {showCreator && <div className="gg-character-overlay" onKeyDown={e => {
      if (e.key === 'Escape') setShowCreator(false);
      if (e.key === 'Tab') {
        const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}><section className="gg-character-dialog gg-panel" role="dialog" aria-modal="true" aria-label={t('キャラクタークリエイト')}><header><b>YOUR GOLFER</b><button autoFocus onClick={() => setShowCreator(false)}>{t('確定')}</button></header><div className="gg-character-preview"><GolfCanvas view={null} selfId="" aim={0} overview={false} avatar={avatar} portrait /></div><AvatarCreator value={avatar} onChange={changeAvatar} languageMode={languageMode} activity="golf" /></section></div>}
  </main></TranslatedUiTree>;
}
