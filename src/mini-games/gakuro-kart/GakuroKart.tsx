import React, { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../utils/assetPaths';
import { COURSES, HEROES, ITEMS, TRACK_LENGTH, createRace, addRacer, ranking, type Race, type Subject } from './engine';
import { KartRoom } from './network';
import KartCanvas, { HERO_SHEET } from './KartCanvas';
import './kart.css';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type { LanguageMode } from '../../types';

function Hero({ index }: { index: number }) {
  return <span className="gk-hero" style={{ backgroundImage: `url("${assetUrl(HERO_SHEET)}")`, backgroundPosition: `${index * 50}% 0` }} />;
}
export default function GakuroKart({ onClose, languageMode = 'JAPANESE' }: { onClose: () => void; languageMode?: LanguageMode }) {
  const [world, setWorld] = useState<Race | null>(null), [name, setName] = useState('レーサー'), [hero, setHero] = useState(0);
  const [course, setCourse] = useState(0), [subject, setSubject] = useState<Subject>('arithmetic'), [code, setCode] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false);
  const room = useRef<KartRoom | null>(null), input = useRef({ left: false, right: false, brake: false });
  const self = room.current?.selfId || 'preview', me = world?.players[self];
  const preview = createRace(course); addRacer(preview, 'preview', name, hero);
  const currentPhase = useRef(world?.phase); currentPhase.current = world?.phase;
  const clearInput = () => { input.current = { left: false, right: false, brake: false }; room.current?.send({ type: 'input', steer: 0, brake: false }); };
  useEffect(() => { clearInput(); }, [world?.phase]);
  useEffect(() => {
    const key = (e: KeyboardEvent, down: boolean) => {
      if ((e.target as HTMLElement)?.closest('input,select,textarea') || currentPhase.current !== 'race') return;
      const k = e.key.toLowerCase();
      if (['arrowleft', 'a', 'arrowright', 'd', 'arrowdown', 's', ' ', 'e'].includes(k)) e.preventDefault();
      if (k === 'arrowleft' || k === 'a') input.current.left = down;
      if (k === 'arrowright' || k === 'd') input.current.right = down;
      if (k === 'arrowdown' || k === 's' || k === ' ') input.current.brake = down;
      if (k === 'e' && down && !e.repeat) room.current?.send({ type: 'item' });
    };
    const down = (e: KeyboardEvent) => key(e, true), up = (e: KeyboardEvent) => key(e, false);
    const blur = () => clearInput();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', blur);
    const timer = setInterval(() => { if (currentPhase.current === 'race') room.current?.send({ type: 'input', steer: Number(input.current.right) - Number(input.current.left), brake: input.current.brake }); }, 50);
    return () => { clearInterval(timer); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', blur); room.current?.close(); };
  }, []);
  const start = async (mode: 'practice' | 'create' | 'join') => {
    setBusy(true); setError(''); room.current?.close();
    const r = new KartRoom(setWorld, setError); room.current = r;
    try {
      if (mode === 'practice') r.practice(name, hero, course, subject);
      else if (mode === 'create') await r.create(name, hero, course, subject);
      else await r.join(code, name, hero);
    } catch (e) { r.close(); setWorld(null); setError(e instanceof Error ? e.message : '接続できませんでした。'); }
    finally { setBusy(false); }
  };
  const leave = () => { room.current?.close(); room.current = null; clearInput(); setWorld(null); setError(''); setCopied(false); };
  const touch = (key: 'left' | 'right' | 'brake') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); input.current[key] = true; },
    onPointerUp: () => { input.current[key] = false; }, onPointerCancel: () => { input.current[key] = false; }, onLostPointerCapture: () => { input.current[key] = false; },
  });
  const order = world ? ranking(world) : [], place = order.findIndex(p => p.id === self) + 1;
  return <TranslatedUiTree mode={languageMode}><main className="gk-root" data-gamepad-initial-scope="gakuro-kart">
    <header className="gk-header"><button onClick={world ? leave : onClose} disabled={busy}>← {world ? 'ガレージ' : '学習ローグ'}</button><div><small>LEARNING ROGUE / AFTER SCHOOL RACING</small><h1>スーパー学ロカート</h1></div><span className="gk-tag">AUTO ACCEL</span></header>
    {error && <div className="gk-error" role="alert">{error}</div>}
    {!world ? <div className="gk-garage">
      <section className="gk-preview"><KartCanvas world={preview} selfId="preview" /><div className="gk-preview-copy"><span>放課後、学びが速さになる。</span><h2>曲がれ。考えろ。<br />その先へ。</h2><p>ハンドルとブレーキで走りを磨く<br />学習 × オンラインカートレース</p></div><span className="gk-course-caption">{COURSES[course].name}</span></section>
      <section className="gk-setup"><div className="gk-section-label">01 / DRIVER</div><label>レーサー名<input maxLength={16} value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="gk-heroes">{HEROES.map((h, i) => <button key={h} aria-pressed={hero === i} onClick={() => setHero(i)}><Hero index={i} /><span>{h}</span></button>)}</div>
        <div className="gk-section-label">02 / COURSE & LEARNING</div><label>コース<select value={course} onChange={e => setCourse(Number(e.target.value))}>{COURSES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}</select></label>
        <label>問題<select value={subject} onChange={e => setSubject(e.target.value as Subject)}><option value="arithmetic">たし算・ひき算</option><option value="multiply">九九</option></select></label>
        <div className="gk-actions"><button className="gk-primary" disabled={busy} onClick={() => start('practice')}>ひとりで練習 / CPU 3人</button><button disabled={busy} onClick={() => start('create')}>オンラインの部屋を作る</button></div>
        <div className="gk-join"><input aria-label="ルームコード" placeholder="6文字のルームコード" maxLength={6} value={code} onChange={e => setCode(e.target.value.toUpperCase())} /><button disabled={busy || code.length !== 6} onClick={() => start('join')}>参加</button></div>
        <p className="gk-note">最大8人。参加者には部屋のコース・問題設定が適用されます。{busy && ' 接続中…'}</p>
      </section>
      <section className="gk-rules"><div><b>01　アクセルはおまかせ</b><p>← → / A D で操舵。↓ / Space でブレーキ。E でアイテム。タッチ端末は画面のボタンを同時押し。</p></div><div><b>02　25秒ごとに3問</b><p>全員が停車して学習。1問10秒。最高速度は85＋正解数×15＋正解した速さのボーナス（最大24）。全員回答後、または30秒で再開。</p></div><div><b>03　90秒の走行で勝負</b><p>走行距離で順位を決定。中央の「？」で道具を獲得。ミルクで加速、定規で保護、チョークで近くの相手を減速。</p></div></section>
    </div> : <>
      <section className="gk-race-view"><KartCanvas world={world} selfId={self} />
        <div className="gk-hud"><div><strong>{place}<small> / {order.length}</small></strong><span>POSITION</span></div><div><strong>{Math.ceil(Math.max(0, 90 - world.driveTime))}<small> s</small></strong><span>走行のこり</span></div><div><strong>{Math.round(me?.speed || 0)}<small> km/h</small></strong><span>最高 {me?.cap} / LAP {Math.floor((me?.distance || 0) / TRACK_LENGTH) + 1}</span></div></div>
        <div className="gk-track-label">{COURSES[world.course].name} <span>次の学習まで {Math.ceil(Math.max(0, world.nextQuiz - world.driveTime))} 秒</span></div>
        {world.phase === 'lobby' && <div className="gk-overlay"><section className="gk-card"><small>READY TO LEARN. READY TO RACE.</small><h2>スタート前のホームルーム</h2>{room.current?.code && <button className="gk-code" onClick={async () => { try { await navigator.clipboard.writeText(room.current!.code); setCopied(true); } catch { setError('コードを選択してコピーしてください。'); } }}>{room.current.code} <small>{copied ? 'コピー済み' : 'コピー'}</small></button>}<div className="gk-roster">{order.map(p => <div key={p.id}><Hero index={p.hero} /><span>{p.name}{p.id === self ? '（あなた）' : ''}</span></div>)}</div><p>参加者 {order.length} / 8 ・ {world.subject === 'multiply' ? '九九' : 'たし算・ひき算'}</p>{room.current?.host ? <button className="gk-primary" onClick={e => { e.currentTarget.blur(); room.current?.start(); }}>みんなでスタート</button> : <p>ホストがスタートするまで待ってね。</p>}</section></div>}
        {world.phase === 'countdown' && <div className="gk-countdown"><span>{Math.ceil(world.remaining)}</span><p>ハンドルを準備！</p></div>}
        {world.phase === 'quiz' && me && <div className="gk-overlay"><section className="gk-card gk-quiz" aria-live="polite"><small>LEARNING PIT STOP / ROUND {world.round}</small><h2>学習ピットイン</h2><p>全員停車中 ・ あと {Math.ceil(world.remaining)} 秒</p>{me.quizIndex < 3 ? <><div className="gk-question-meta">第 {me.quizIndex + 1} 問 / 3 <span>この問題 あと {Math.ceil(Math.max(0, 10 - (world.time - me.questionAt)))} 秒</span></div><h3>{world.questions[me.quizIndex]?.text}</h3><div className="gk-options">{world.questions[me.quizIndex]?.options.map((v, i) => <button key={`${world.round}-${me.quizIndex}-${i}`} onClick={() => room.current?.send({ type: 'answer', index: me.quizIndex, choice: i, round: world.round })}>{v}</button>)}</div></> : <><h3>{me.quizCorrect} / 3 正解</h3><p>次の最高速度 <strong>{me.cap} km/h</strong></p><p>みんなの回答を待っています…</p></>}<p className="gk-feedback">{me.feedback || '正確に、すばやく答えよう。'}</p></section></div>}
        {world.phase === 'result' && <div className="gk-overlay"><section className="gk-card"><small>FINISH / SCHOOL GRAND PRIX</small><h2>レース結果</h2><ol className="gk-results">{order.map((p, i) => <li key={p.id} className={p.id === self ? 'is-self' : ''}><b>{i + 1}</b><Hero index={p.hero} /><span>{p.name}<small>正解 {p.correct} / {p.answered}</small></span><strong>{Math.round(p.distance)} m</strong></li>)}</ol><button className="gk-primary" onClick={leave}>ガレージへ戻る</button></section></div>}
      </section>
      <nav className="gk-controls" aria-label="カート操作"><div><button aria-label="左へハンドル" disabled={world.phase !== 'race'} {...touch('left')}>◀<small>LEFT</small></button><button aria-label="右へハンドル" disabled={world.phase !== 'race'} {...touch('right')}>▶<small>RIGHT</small></button></div><button className="gk-item" disabled={world.phase !== 'race' || !me?.item} onClick={() => room.current?.send({ type: 'item' })}>{me?.item ? ITEMS[me.item] : '？ 道具を拾おう'}<small>ITEM / E</small></button><button className="gk-brake" disabled={world.phase !== 'race'} {...touch('brake')}>ブレーキ<small>↓ / SPACE</small></button></nav>
    </>}
  </main></TranslatedUiTree>;
}
