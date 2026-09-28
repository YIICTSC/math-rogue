import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COURSES, HEROES, ITEMS, LAPS, MAX_RACERS, PALETTE, createRace, addRacer, ranking, type Race } from './engine';
import { getTrack, sampleTrack } from './track';
import { KartRoom } from './network';
import { KartAudio } from './audio';
import KartCanvas from './KartCanvas';
import './kart.css';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type { LanguageMode } from '../../types';

const time = (n: number) => `${Math.floor(n / 60)}:${(n % 60).toFixed(2).padStart(5, '0')}`;
function MiniMap({ world, self }: { world: Race; self: string }) {
  const path = useMemo(() => getTrack(world.course).points.filter((_, i) => i % 8 === 0).map((p, i) => `${i ? 'L' : 'M'}${p.x * .19 + 12},${p.z * .19 + 92}`).join(' ') + 'Z', [world.course]);
  return <svg className="gk-map" viewBox="-8 0 122 140" aria-label="Circuit map"><path d={path} fill="none" stroke="#ffffff30" strokeWidth="5" /><path d={path} fill="none" stroke="#b9e0e055" strokeWidth="1" />{Object.values(world.players).sort((a, b) => Number(a.id === self) - Number(b.id === self)).map(p => { const pt = sampleTrack(p.distance, world.course); return <circle key={p.id} cx={pt.x * .19 + 12} cy={pt.z * .19 + 92} r={p.id === self ? 3.5 : 1.7} fill={p.id === self ? '#d9ff6a' : p.cpu ? '#9eafc2' : '#5fe8ef'} />; })}</svg>;
}
export default function GakuroKart({ onClose, languageMode = 'JAPANESE' }: { onClose: () => void; languageMode?: LanguageMode }) {
  const [world, setWorld] = useState<Race | null>(null), [name, setName] = useState('Racer'), [hero, setHero] = useState(0), [course, setCourse] = useState(0), [code, setCode] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false), [fill, setFill] = useState(true), [sound, setSound] = useState(true);
  const room = useRef<KartRoom | null>(null), audio = useRef<KartAudio | null>(null), generation = useRef(0);
  const input = useRef({ left: false, right: false, brake: false, drift: false });
  const currentPhase = useRef(world?.phase); currentPhase.current = world?.phase;
  const self = room.current?.selfId || 'preview', me = world?.players[self];
  const preview = useMemo(() => { const w = createRace(course); addRacer(w, 'preview', name, hero); w.players.preview.x = 0; return w; }, [course, name, hero]);
  const clearInput = () => { input.current = { left: false, right: false, brake: false, drift: false }; room.current?.send({ type: 'input', steer: 0, brake: false, drift: false }); };
  useEffect(() => { clearInput(); }, [world?.phase]);
  useEffect(() => { audio.current?.update(world, self); }, [world, self]);
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
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', blur);
    let padItem = false;
    const timer = setInterval(() => {
      if (currentPhase.current !== 'race') return;
      const pad = navigator.getGamepads?.()?.[0], axis = pad && Math.abs(pad.axes[0]) > .15 ? pad.axes[0] : 0;
      room.current?.send({ type: 'input', steer: axis || Number(input.current.right) - Number(input.current.left), brake: input.current.brake || !!pad?.buttons[6]?.pressed, drift: input.current.drift || !!pad?.buttons[0]?.pressed });
      if (pad?.buttons[1]?.pressed && !padItem) room.current?.send({ type: 'item' }); padItem = !!pad?.buttons[1]?.pressed;
    }, 50);
    return () => { generation.current++; clearInterval(timer); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', blur); room.current?.close(); audio.current?.close(); };
  }, []);
  const start = async (mode: 'practice' | 'create' | 'join') => {
    const token = ++generation.current; setBusy(true); setError(''); room.current?.close();
    if (!audio.current) audio.current = new KartAudio(); void audio.current.unlock().catch(() => {});
    const r = new KartRoom(w => { if (generation.current === token) setWorld(w); }, m => { if (generation.current === token) setError(m); }); room.current = r;
    try { if (mode === 'practice') r.practice(name, hero, course); else if (mode === 'create') await r.create(name, hero, course); else await r.join(code, name, hero); }
    catch (e) { r.close(); if (generation.current === token) { setWorld(null); setError(e instanceof Error ? e.message : 'Connection failed'); } }
    finally { if (generation.current === token) setBusy(false); }
  };
  const leave = () => { generation.current++; clearInput(); room.current?.close(); room.current = null; setWorld(null); setError(''); setCopied(false); setBusy(false); };
  const touch = (key: keyof typeof input.current) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); input.current[key] = true; },
    onPointerUp: () => { input.current[key] = false; }, onPointerCancel: () => { input.current[key] = false; }, onLostPointerCapture: () => { input.current[key] = false; },
  });
  const order = world ? ranking(world) : [], place = order.findIndex(p => p.id === self) + 1, length = getTrack(world?.course ?? course).length;
  const active = world?.phase === 'race' && !world.paused && !me?.finish;
  const front = order.slice(0, 5); if (me && place > 5) front.push(me);
  return <TranslatedUiTree mode={languageMode}><main className={`gk-root ${world ? 'gk-playing' : ''}`} data-gamepad-initial-scope="gakuro-kart">
    <header className="gk-header"><button className="gk-back" onClick={world || busy ? leave : onClose}>← <span>{world ? 'ガレージ' : '学習ローグ'}</span></button><div className="gk-brand">GAKURO<span>APEX<span className="gk-brand-dot">●</span></span></div><div className="gk-header-right"><span className="gk-live">40 RACERS / 3 LAPS</span><button aria-label="Sound toggle" className="gk-sound" onClick={() => { if (!audio.current) audio.current = new KartAudio(); void audio.current.unlock().catch(() => {}); setSound(audio.current.toggle()); }}>{sound ? 'SOUND ON' : 'SOUND OFF'}</button></div></header>
    {error && <div className="gk-error" role="alert">{error}</div>}
    {!world ? <div className="gk-garage">
      <section className="gk-preview"><KartCanvas world={preview} selfId="preview" preview /><div className="gk-preview-shade" /><div className="gk-preview-copy"><span className="gk-eyebrow">THE AFTER-SCHOOL GRAND PRIX</span><h1>BREAK<br />THE <em>LIMIT.</em></h1><p>放課後を、ぶっちぎれ。</p><div className="gk-pills"><span>FULL 3D</span><span>40 PLAYER GRID</span><span>DRIFT & BOOST</span></div></div><div className="gk-course-caption"><span>0{course + 1} / CIRCUIT</span><strong>{COURSES[course].name}</strong><span>{COURSES[course].subtitle}</span></div></section>
      <section className="gk-setup"><span className="gk-eyebrow">YOUR NEXT STARTING LINE</span><h2>走る準備は、いい？</h2><label>レーサー名<input maxLength={16} value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="gk-section-label">01 / CHOOSE YOUR PILOT</div><div className="gk-heroes">{HEROES.map((h, i) => <button key={h} aria-pressed={hero === i} onClick={() => setHero(i)} style={{ '--pilot': PALETTE[i] } as React.CSSProperties}><span className="gk-helmet"><i /></span><strong>{h}</strong><small>0{i + 1}</small></button>)}</div>
        <div className="gk-section-label">02 / CHOOSE YOUR WORLD</div><div className="gk-courses">{COURSES.map((c, i) => <button key={c.name} aria-pressed={course === i} onClick={() => setCourse(i)}><span>0{i + 1}</span><div><b>{c.name}</b><small>{c.subtitle}</small></div><span className="gk-course-dot" style={{ background: c.accent }} /></button>)}</div>
        <div className="gk-actions"><button className="gk-primary" disabled={busy} onClick={() => start('practice')}>40台でレース <span>↗</span></button><button className="gk-online" disabled={busy} onClick={() => start('create')}>オンラインの部屋を作る <span>＋</span></button></div>
        <div className="gk-join"><input aria-label="ルームコード" placeholder="6文字のルームコード" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} /><button disabled={busy || code.length !== 6} onClick={() => start('join')}>参加 →</button></div>
        <p className="gk-note">{busy ? '接続中…' : 'ひとりでも39台のライバル。オンラインは最大40人。'}</p>
      </section>
      <section className="gk-rules"><div><span>01 / CARVE</span><h3>曲がって、ためる。</h3><p>左右でハンドル。カーブでドリフトを押し続け、離してターボ。長くためるほど強く加速。</p></div><div><span>02 / CHASE</span><h3>背中を追って、抜く。</h3><p>前の車の真後ろでスリップストリーム。加速パネルとジャンプ台をつなぎ、ライバルを抜き去ろう。</p></div><div><span>03 / OVERTAKE</span><h3>最後まで、逆転。</h3><p>光るクリスタルでアイテム獲得。ニトロ、防御、前方へのパルス、追い上げロケット。勝負は3周。</p></div></section>
    </div> : <>
      <section className={`gk-race-view ${me?.boost ? 'is-boosting' : ''}`}><KartCanvas world={world} selfId={self} />
        <div className="gk-vignette" />{me && me.boost > 0 && active && <div className="gk-speed-streaks" />}
        <div className="gk-hud"><div className="gk-position"><span>POSITION</span><strong>{String(place).padStart(2, '0')}<small> / {order.length}</small></strong></div><div className="gk-lap"><span>LAP</span><strong>{Math.min(LAPS, Math.max(1, Math.floor((me?.distance || 0) / length) + 1))}<small> / {LAPS}</small></strong></div><div className="gk-race-time"><span>{world.finishAt ? 'FINISH WINDOW' : 'RACE TIME'}</span><strong>{world.finishAt ? Math.ceil(world.remaining) : time(world.time)}</strong></div></div>
        <div className="gk-leaderboard">{front.map(p => <div key={p.id} className={p.id === self ? 'is-self' : ''}><b>{order.indexOf(p) + 1}</b><i style={{ background: PALETTE[p.hero] }} /><span>{p.name}</span><small>{p.finish ? 'FIN' : p.id === self ? 'YOU' : `${Math.max(0, Math.round((order[0].distance - p.distance)))}m`}</small></div>)}</div>
        <MiniMap world={world} self={self} />
        <div className="gk-track-label"><b>{COURSES[world.course].name}</b><span>{Math.round(Math.max(0, (me?.distance || 0) / (length * LAPS)) * 100)}%</span><i style={{ width: `${Math.max(0, Math.min(100, (me?.distance || 0) / (length * LAPS) * 100))}%` }} /></div>
        <div className="gk-speed"><strong>{Math.round((me?.speed || 0) * 3.6)}</strong><span>KM/H</span></div>
        {active && <div className="gk-drive-feedback"><b>{me?.jump ? 'AIR TIME' : me?.boost ? 'BOOST!' : me && me.draft > .7 ? 'SLIPSTREAM' : me && me.charge > .6 ? 'RELEASE TO BOOST' : 'AUTO ACCEL'}</b><div className="gk-charge"><i style={{ width: `${(me?.charge || 0) / 2.4 * 100}%` }} /><span /><span /></div><small>DRIFT CHARGE</small></div>}
        {world.phase === 'lobby' && <div className="gk-overlay"><section className="gk-card"><small>GRID / READY ROOM</small><h2>スターティンググリッド</h2>{room.current?.code && <button className="gk-code" onClick={async () => { try { await navigator.clipboard.writeText(room.current!.code); setCopied(true); } catch { setError('コードを選択してコピーしてください。'); } }}>{room.current.code}<small>{copied ? 'コピー済み' : 'コピー'}</small></button>}<p>参加者 {order.filter(p => !p.cpu).length} / {MAX_RACERS}</p><div className="gk-roster">{order.map(p => <div key={p.id}><i style={{ background: PALETTE[p.hero] }} />{p.name}{p.id === self && <small>YOU</small>}</div>)}</div><p className="gk-note">ホストは画面を開いたままプレイしてください。</p>{room.current?.host ? <><label className="gk-fill"><input type="checkbox" checked={fill} onChange={e => setFill(e.target.checked)} />空き枠をCPUで埋める</label><button className="gk-primary" onClick={e => { e.currentTarget.blur(); room.current?.start(fill); }}>レースを開始 →</button></> : <p>ホストのスタートを待っています。</p>}<div className="gk-quick-help">← → / A D : STEER<br />SPACE / SHIFT : DRIFT　↓ / S : BRAKE　E : ITEM<br />GAMEPAD : STICK / A / LT / B</div></section></div>}
        {world.phase === 'countdown' && <div className="gk-countdown"><span>{Math.ceil(world.remaining)}</span><p>GET READY TO BREAK AWAY</p></div>}
        {world.phase === 'race' && !!me?.finish && <div className="gk-finished"><b>FINISH</b><span>#{place} · {time(me.finish)}</span><p>全員のゴールを待っています。</p></div>}
        {world.phase === 'result' && <div className="gk-overlay"><section className="gk-card gk-result-card"><small>THE AFTER-SCHOOL GRAND PRIX</small><h2>{place === 1 ? 'YOU WIN!' : `FINISH / #${place}`}</h2><div className="gk-result-stats"><div><b>{me?.finish ? time(me.finish) : 'DNF'}</b><span>TIME</span></div><div><b>{me?.drifts || 0}</b><span>DRIFT BOOSTS</span></div><div><b>{me?.overtakes || 0}</b><span>OVERTAKES</span></div></div><ol className="gk-results">{order.map((p, i) => <li key={p.id} className={p.id === self ? 'is-self' : ''}><b>{String(i + 1).padStart(2, '0')}</b><i style={{ background: PALETTE[p.hero] }} /><span>{p.name}<small>{p.cpu ? 'CPU' : 'PLAYER'}</small></span><strong>{p.finish ? time(p.finish) : 'DNF'}</strong></li>)}</ol>{room.current?.host ? <button className="gk-primary" onClick={() => room.current?.rematch()}>もう一度レース</button> : <p>ホストの再戦を待っています。</p>}<button className="gk-secondary" onClick={leave}>ガレージへ戻る</button></section></div>}
      </section>
      <nav className="gk-controls" aria-label="Race controls"><div className="gk-steering"><button aria-label="Steer left" disabled={!active} {...touch('left')}>◀<small>A / ←</small></button><button aria-label="Steer right" disabled={!active} {...touch('right')}>▶<small>D / →</small></button></div><div className="gk-control-hint">AUTO ACCEL<span>CHASE YOUR LIMIT.</span></div><button className="gk-brake" disabled={!active} {...touch('brake')}>BRAKE<small>↓ / S</small></button><button className="gk-drift" disabled={!active} {...touch('drift')}>DRIFT<small>SPACE / SHIFT</small></button><button className="gk-item" disabled={!active || !me?.item} onClick={() => room.current?.send({ type: 'item' })}><b>{me?.item ? ITEMS[me.item] : '◇'}</b><small>ITEM / E</small></button></nav>
    </>}
  </main></TranslatedUiTree>;
}
