import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BellRing, BookOpen, Check, CircleHelp, Crown, Fullscreen, Grid3X3, Heart, Link2, Mic2, Moon, PanelsTopLeft, PenLine, Radio, RefreshCw, Target, Trophy, Users, Volume2, VolumeX, Vote, X } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { LessonSelection } from '../mini-games/gakuro-kart/questions';
import { OFFLINE_DISTRIBUTABLE } from '../config/runtime';
import { MODES, type ShowAction, type ShowError, type ShowMode, type ShowView } from './types';
import { copy, ERRORS, MODE_COPY } from './copy';
import { addressText, clearQuizLocation, invitationFromLocation, markHost, parseAddress, type RoomAddress } from './invite';
import { QuizShowRoom, quizShowServerUrl, savedHost } from './room';
import { starterQuestions } from './questions';
import InvitePanel from './InvitePanel';
import HostDesk from './HostDesk';
import { AnswerGrid, AnswerInput, Leaderboard, QuestionStage } from './Stage';
import QuestionEditor from './QuestionEditor';
import Rules from './Rules';
import WolfPanel from './WolfPanel';
import useQuizAudio from './useQuizAudio';
import './quiz-show.css';

const OnlineLessonPicker = lazy(() => import('../mini-games/shared/OnlineLessonPicker'));
const modeIcons = { STANDARD: PanelsTopLeft, BUZZER: BellRing, SURVIVAL: Heart, TEAMS: Users, CONSENSUS: Link2, MAJORITY: Users, NEAREST: Target, DRAW: PenLine, VOTE: Vote, WOLF: Moon };
const PHASES = {
  lobby: ['参加受付', 'LOBBY', 'さんかうけつけ'], ready: ['次の問題', 'GET READY', 'つぎのもんだい'], open: ['回答受付中', 'ON AIR · ANSWER NOW', 'こたえうけつけちゅう'],
  closed: ['回答締切', 'ANSWERS LOCKED', 'こたえしめきり'], reveal: ['回答オープン', 'REVEAL', 'こたえオープン'], voting: ['投票タイム', 'VOTE NOW', 'とうひょうタイム'],
  scoreboard: ['順位発表', 'RESULTS', 'じゅんいはっぴょう'], finished: ['最終結果', 'FINALE', 'さいしゅうけっか'], review: ['審議の確認', 'DELIBERATION CHECK', 'しんぎのかくにん'], trial: ['人狼投票', 'SUSPECT VOTE', 'じんろうとうひょう'], night: ['秘密の夜', 'NIGHT ACTIONS', 'ひみつのよる'], dawn: ['朝の発表', 'DAYBREAK', 'あさのはっぴょう'],
} as const;
export interface QuizShowProps { languageMode?: LanguageMode; onBack: () => void; direct?: boolean }
export default function QuizShow({ languageMode = 'JAPANESE', onBack, direct = false }: QuizShowProps) {
  const initial = useRef(direct ? invitationFromLocation() : null).current, language = initial?.language || languageMode, t = copy(language);
  const [view, setView] = useState<ShowView | null>(null), [error, setError] = useState<ShowError | null>(null), [state, setState] = useState<'connecting' | 'connected' | 'reconnecting' | 'ended'>('connecting'), [busy, setBusy] = useState(false), [tab, setTab] = useState(initial ? 'join' : 'home');
  const [name, setName] = useState(''), [code, setCode] = useState(initial ? addressText(initial.address) : ''), [mode, setMode] = useState<ShowMode>('STANDARD'), [title, setTitle] = useState(t('みんなでクイズ番組', 'Everyone’s Quiz Show', 'みんなでクイズばんぐみ')), [transport, setTransport] = useState<RoomAddress['transport']>('host');
  const [rules, setRules] = useState(false), [editor, setEditor] = useState(false), [lesson, setLesson] = useState(false), [lessonBusy, setLessonBusy] = useState(false), [lessonError, setLessonError] = useState(''), [lessonCount, setLessonCount] = useState(12), [inviteOpen, setInviteOpen] = useState(false), [, setInkVersion] = useState(0), [sound, setSound] = useState(true);
  const room = useRef<QuizShowRoom | null>(null), restore = useRef(savedHost()).current, session = useRef(0);
  const quizAudio = useQuizAudio(view, sound);
  const [screenOverview, setScreenOverview] = useState<boolean | null>(null);
  useEffect(() => setScreenOverview(null), [view?.overview]);
  const overview = view?.role === 'screen' && (screenOverview ?? view.overview) && !!view.round && !['lobby', 'ready', 'review', 'trial', 'night', 'dawn'].includes(view.phase);
  useEffect(() => {
    if ((!rules && !editor) || lesson) return;
    const dialog = document.querySelector<HTMLElement>('.qs-app .qs-modal[role="dialog"]'); if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const tab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],summary')].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1); if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', tab, true); return () => { document.removeEventListener('keydown', tab, true); if (previous?.isConnected) previous.focus(); };
  }, [rules, editor, lesson]);
  const active = state === 'connected' && !busy;
  useEffect(() => () => { session.current++; room.current?.close(); }, []);
  function makeRoom() {
    room.current?.close();
    const current = ++session.current;
    const next = new QuizShowRoom(v => { if (current === session.current) setView(v); }, e => { if (current === session.current) setError(e); }, s => { if (current === session.current) setState(s); }, () => { if (current === session.current) setInkVersion(v => v + 1); });
    room.current = next; return { next, current };
  }
  async function create(resume = false) {
    if (busy || OFFLINE_DISTRIBUTABLE) return; setBusy(true); setError(null);
    const { next, current } = makeRoom();
    try {
      await next.create(transport, resume);
      if (current !== session.current) return;
      if (!resume) { next.send({ type: 'configure', title: title.trim() || t('みんなでクイズ番組', 'Everyone’s Quiz Show', 'みんなでクイズばんぐみ'), mode, teamCount: 2 }); next.send({ type: 'bank', questions: starterQuestions(mode, language) }); }
      markHost(next.address, language);
    } catch (e) { if (current === session.current) { setError(errorCode(e)); next.close(); setView(null); } }
    finally { if (current === session.current) setBusy(false); }
  }
  async function join(screen = false) {
    if (busy || OFFLINE_DISTRIBUTABLE) return;
    const address = parseAddress(code); if (!address) { setError('NOT_FOUND'); return; } if (!screen && !name.trim()) { setError('NAME'); return; }
    setBusy(true); setError(null); const { next, current } = makeRoom();
    try { await next.join(address, name.trim(), screen); } catch (e) { if (current === session.current) { setError(errorCode(e)); next.close(); setView(null); } } finally { if (current === session.current) setBusy(false); }
  }
  useEffect(() => {
    if (!initial) return;
    const timer = setTimeout(() => {
      if (initial.host && restore && addressText(restore.address) === addressText(initial.address)) void create(true);
      else if (initial.screen) void join(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function leave() { session.current++; room.current?.close(); room.current = null; clearQuizLocation(); onBack(); }
  function send(a: ShowAction) { if (!active || !room.current) return; if (!room.current.send(a)) setError('NETWORK'); }
  async function importLesson(selection: LessonSelection) {
    if (!room.current || lessonBusy) return; setLessonBusy(true); setLessonError('');
    try {
      const { buildLesson } = await import('../mini-games/gakuro-kart/questions'), pack = buildLesson(selection, lessonCount);
      const questions = pack.questions.map(q => ({ id: q.id, prompt: q.question, answer: q.options[q.correct], aliases: [], options: [...q.options], format: 'CHOICE' as const, seconds: 50, points: 100, passage: q.passage, visual: q.visual, audioPrompt: q.audioPrompt }));
      if (!room.current.send({ type: 'bank', questions })) throw new Error(); setLesson(false); setEditor(false);
    } catch { setLessonError(t('問題を用意できませんでした。別の単元か少ない問題数を選んでください。', 'Could not prepare the pack. Try another unit or fewer questions.', 'もんだいをよういできません。べつのたんげんをえらんでね。')); } finally { setLessonBusy(false); }
  }
  const errorText = error ? t(...(ERRORS[error] || ERRORS.NETWORK)) : '';
  function enableSound() { if (!quizAudio.ready) { quizAudio.unlock(); return; } setSound(v => !v); }
  const ModeIcon = modeIcons[view?.mode || mode];
  return <div className={`qs-app ${view ? 'qs-in-show' : 'qs-entrance'} ${initial ? 'qs-direct-entry' : ''} ${view?.role === 'screen' ? 'qs-audience' : ''} ${overview ? 'qs-overview' : ''}`} data-quiz-show data-language={language} data-quiz-bgm={quizAudio.music} data-quiz-speaking={quizAudio.speaking}>
    <header className="qs-app-header"><button className="qs-back" onClick={leave}><ArrowLeft size={18} /><span>{t('一覧へ', 'Back', 'いちらんへ')}</span></button><div className="qs-brand"><Radio size={21} /><span>GAKURO <b>QUIZ LIVE</b></span></div><nav><button aria-label={t('遊び方', 'How to play', 'あそびかた')} onClick={() => setRules(true)}><CircleHelp size={20} /><span>{t('遊び方', 'Guide', 'あそびかた')}</span></button>{view && <button aria-label={t('音声切替', 'Toggle music and sound', 'おんせいきりかえ')} aria-pressed={sound} onClick={enableSound}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>}{view?.role === 'host' && <button onClick={() => setInviteOpen(v => !v)}><Link2 size={18} />{t('招待', 'Invite', 'しょうたい')}</button>}{view?.role === 'screen' && <button aria-pressed={screenOverview ?? view.overview} onClick={() => setScreenOverview(!(screenOverview ?? view.overview))}><Grid3X3 size={18} /><span>{t('全員一覧', 'All panels', 'みんないちらん')}</span></button>}{view?.role === 'screen' && <button aria-label={t('全画面表示', 'Fullscreen', 'ぜんがめんひょうじ')} onClick={() => { void document.documentElement.requestFullscreen?.().catch(() => {}); }}><Fullscreen size={20} /></button>}</nav></header>
    {errorText && <div className="qs-error qs-global-error" role="alert"><span>{errorText}</span><button aria-label={t('閉じる', 'Dismiss', 'とじる')} onClick={() => setError(null)}><X size={16} /></button></div>}
    {!view ? <main className="qs-entry-main"><section className="qs-entry-hero"><div className="qs-entry-copy"><span className="qs-eyebrow"><span className="qs-red-dot" /> EVERYONE IS THE STAR</span><h1>{t('みんなで', 'Everyone’s', 'みんなで')}<br /><em>{t('クイズ番組', 'Quiz Show', 'クイズばんぐみ')}</em></h1><p>{t('ひらめきも、珍回答も、主役になる。', 'Bright ideas. Wild answers. Your moment in the spotlight.', 'ひらめきも、おもしろいこたえも、しゅやくになる。')}</p><div className="qs-feature-pills"><span><Users size={17} />{t('最大40人', 'Up to 40 players', '40にんまで')}</span><span><PenLine size={17} />{t('手書き・テキスト', 'Ink & text', 'てがき・もじ')}</span><span><Crown size={17} />{t('司会で進行', 'Host-led', 'しかいですすむ')}</span></div></div><div className="qs-hero-visual" aria-hidden="true"><div className="qs-spotlight qs-spotlight-one" /><div className="qs-spotlight qs-spotlight-two" /><span className="qs-marquee">QUIZ</span><span className="qs-marquee-live">LIVE!</span><div className="qs-hero-panels">{['A', '?', 'B'].map((s, i) => <div key={s} style={{ '--i': i } as React.CSSProperties}><span>{s}</span><i>PLAYER {i + 1}</i></div>)}</div><div className="qs-hero-stage" /></div></section>
      <section className={`qs-entry-console ${initial ? 'is-direct' : ''}`}><div className="qs-entry-tabs" role="tablist"><button role="tab" aria-selected={tab === 'home'} onClick={() => setTab('home')} disabled={busy}><Mic2 size={19} />{t('司会として作る', 'Host a show', 'しかいとしてつくる')}</button><button role="tab" aria-selected={tab === 'join'} onClick={() => setTab('join')} disabled={busy}><Users size={19} />{t('参加する', 'Join a show', 'さんかする')}</button></div>
        {OFFLINE_DISTRIBUTABLE ? <p className="qs-error">{t('このモードはオンライン版で利用できます。', 'This mode is available in the online edition.', 'このモードはオンラインばんであそべるよ。')}</p> : tab === 'join' ? <form className="qs-entry-form" onSubmit={e => { e.preventDefault(); void join(); }}><div><span className="qs-eyebrow">YOUR ANSWER PANEL</span><h2>{initial ? t('名前を入れて、番組へ！', 'Your name, and you’re in!', 'なまえをいれて、ばんぐみへ！') : t('部屋に参加', 'Join the room', 'へやにさんか')}</h2></div>{!initial && <label>{t('部屋コード', 'Room code', 'へやコード')}<input value={code} maxLength={8} disabled={busy} placeholder="H-123456" autoCapitalize="characters" onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} /></label>}<label>{t('表示する名前', 'Your display name', 'ひょうじするなまえ')}<input autoFocus={!!initial && !initial.screen} value={name} onChange={e => setName(e.target.value)} maxLength={20} disabled={busy} autoComplete="nickname" placeholder={t('20文字以内', 'Up to 20 characters', '20もじまで')} /></label><button className="qs-primary" type="submit" disabled={busy}>{busy ? <RefreshCw className="qs-spin" size={19} /> : <ArrowRight size={20} />}{busy ? t('接続中…', 'Connecting…', 'せつぞくちゅう…') : t('この名前で参加！', 'Join the show!', 'このなまえでさんか！')}</button><p>{t('アカウント・学年の設定は不要。名前だけで参加できます。', 'No account or grade setup. Just your name.', 'アカウントやがくねんのせっていはいらないよ。')}</p>{initial && <small>{addressText(initial.address)}</small>}</form> : <div className="qs-entry-form"><label>{t('番組名', 'Show title', 'ばんぐみめい')}<input disabled={busy} value={title} maxLength={80} onChange={e => setTitle(e.target.value)} /></label><label>{t('ゲームルール', 'Game rules', 'ゲームルール')}<select disabled={busy} value={mode} onChange={e => setMode(e.target.value as ShowMode)}>{MODES.map(m => <option key={m} value={m}>{t(...MODE_COPY[m].slice(0, 3) as [string, string, string])}</option>)}</select></label><p className="qs-entry-rule"><ModeIcon size={24} />{t(...MODE_COPY[mode].slice(3, 6) as [string, string, string])}</p>{quizShowServerUrl() && <label>{t('進行方法', 'Hosting', 'しんこうほうほう')}<select value={transport} disabled={busy} onChange={e => setTransport(e.target.value as RoomAddress['transport'])}><option value="host">{t('司会端末で進行', 'Host on this device', 'しかいたんまつですすめる')}</option><option value="server">{t('専用サーバーで進行', 'Dedicated server', 'せんようサーバーですすめる')}</option></select></label>}<button className="qs-primary" disabled={busy} onClick={() => { void create(); }}>{busy ? <RefreshCw className="qs-spin" size={19} /> : <Mic2 size={20} />}{busy ? t('部屋を作成中…', 'Creating room…', 'へやをつくっているよ…') : t('ホスト部屋を作成', 'Create host room', 'ホストべやをつくる')}</button><small>{t('回答者40人＋司会1人。作成後に問題を編集・単元から出題できます。司会画面は開いたままにしてください。', '40 answerers + one host. Edit questions or use learning units after creating the room. Keep the host page open.', '40にんとしかいであそべるよ。へやをつくってからもんだいをえらべるよ。')}</small>{restore && <button disabled={busy} onClick={() => { void create(true); }}><RefreshCw size={16} />{t('前の司会部屋を再開', 'Resume your previous host room', 'まえのしかいべやをさいかい')} · {addressText(restore.address)}</button>}</div>}
      </section><section className="qs-mode-selection"><header><span className="qs-eyebrow">10 WAYS TO STEAL THE SHOW</span><h2>{t('今日は、どの番組にする？', 'What’s on your show today?', 'きょうは、どのばんぐみにする？')}</h2></header><div className="qs-mode-grid">{MODES.map(m => { const Icon = modeIcons[m]; return <button key={m} className={mode === m ? 'is-selected' : ''} disabled={busy} onClick={() => { setMode(m); setTab('home'); }}><span className="qs-mode-icon"><Icon size={25} /></span><b>{t(...MODE_COPY[m].slice(0, 3) as [string, string, string])}</b><p>{t(...MODE_COPY[m].slice(3, 6) as [string, string, string])}</p><ArrowRight size={17} /></button>; })}</div></section></main> : <main className={`qs-show-main qs-role-${view.role}`}>
      <div className="qs-show-heading"><div><span className={`qs-live-pill ${view.phase === 'open' ? 'is-live' : ''}`}><i />{t(...PHASES[view.phase] as [string, string, string])}</span><h1 data-allow-japanese="true">{view.title}</h1><span className="qs-mode-caption"><ModeIcon size={16} />{t(...MODE_COPY[view.mode].slice(0, 3) as [string, string, string])}</span></div><div className="qs-show-meta"><b><Users size={17} />{view.players.filter(p => p.connected).length}<small> / 40</small></b><span>{room.current && addressText(room.current.address)}</span><small>{view.role === 'host' ? t('司会画面', 'HOST', 'しかいがめん') : view.role === 'screen' ? t('上映画面', 'AUDIENCE', 'じょうえいがめん') : view.players.find(p => p.id === view.self)?.name}</small></div></div>
      {(state === 'reconnecting' || !view.hostConnected || state === 'ended') && <div className="qs-connection-notice" role="status"><RefreshCw size={18} />{state === 'ended' ? t('部屋は終了しました。', 'This room has ended.', 'へやはしゅうりょうしたよ。') : t('接続を回復しています。司会画面を開いたままお待ちください。', 'Reconnecting. Keep the host page open and please wait.', 'せつぞくをなおしているよ。まってね。')}</div>}
      {inviteOpen && room.current && <InvitePanel address={room.current.address} language={language} />}
      {overview && view.round ? <section className="qs-overview-scene" data-overview-scene style={{ '--qs-rows': Math.max(1, Math.ceil(view.round.tiles.length / 8)), '--qs-rows-wide': Math.max(1, Math.ceil(view.round.tiles.length / 10)), '--qs-rows-phone': Math.max(1, Math.ceil(view.round.tiles.length / 5)) } as React.CSSProperties}><div className="qs-overview-question"><span>Q{String(view.index + 1).padStart(2, '0')}</span><h2 data-allow-japanese="true">{view.round.mode === 'DRAW' && !view.round.showAnswer ? t('この絵は何でしょう？', 'What is this drawing?', 'このえはなんでしょう？') : view.round.prompt}</h2>{view.round.showAnswer && view.round.answer && <b data-allow-japanese="true">{t('正解', 'Answer', 'せいかい')}: {view.round.answer}</b>}</div><div className="qs-overview-label"><span><Grid3X3 size={15} />{t('全員の回答', 'ALL ANSWER PANELS', 'みんなのこたえ')}</span><b>{view.round.tiles.filter(a => a.submitted).length} / {view.round.eligible.length - (view.round.artist ? 1 : 0)}</b></div><AnswerGrid view={view} room={room.current!} language={language} send={send} connected={active} /></section> : <div className="qs-studio-layout"><div className="qs-stage-column">{view.phase === 'lobby' ? <><div className="qs-lobby-banner"><span className="qs-eyebrow">WELCOME TO THE STUDIO</span><h2>{t('まもなく、開演。', 'The spotlight is waiting.', 'まもなく、かいえん。')}</h2><p>{view.role === 'host' ? t('URL・QRで招待して、問題を用意しよう。', 'Invite your players and prepare your questions.', 'しょうたいして、もんだいをよういしよう。') : t('参加できました！司会のスタートを待ってね。', 'You’re in! Wait for the host to start.', 'さんかできたよ！スタートをまってね。')}</p></div>{(view.role === 'host' || view.role === 'screen') && room.current && <InvitePanel address={room.current.address} language={language} />}<section className="qs-player-lobby"><header><Users /><h3>{t('スタジオの参加者', 'In the studio', 'スタジオのさんかしゃ')}</h3><b>{view.players.length} / 40</b></header><div>{view.players.map((p, i) => <span key={p.id} className={`${p.id === view.self ? 'is-mine' : ''} ${p.connected ? '' : 'is-away'}`}><i style={{ background: `hsl(${i * 53 % 360} 50% 55%)` }}>{p.name.slice(0, 1)}</i><b>{p.name}</b>{p.connected ? <Check size={14} /> : '○'}</span>)}</div>{!view.players.length && <p className="qs-muted">{t('最初の参加者をお待ちしています。', 'Waiting for the first player.', 'さいしょのさんかしゃをまっているよ。')}</p>}</section></> : <>
        {view.wolf && <WolfPanel view={view} language={language} send={send} connected={active} />}
        {!['review', 'trial', 'night', 'dawn'].includes(view.phase) && view.phase !== 'finished' && <QuestionStage view={view} room={room.current!} language={language} speak={quizAudio.speak} stopSpeech={quizAudio.stopSpeech} speaking={quizAudio.speaking} />}
        {view.role === 'player' && view.round && !['review', 'trial', 'night', 'dawn', 'finished'].includes(view.phase) && <AnswerInput key={view.round.id} view={view} room={room.current!} language={language} connected={active} />}
        {['scoreboard', 'finished'].includes(view.phase) && <Leaderboard view={view} language={language} />}
        {view.round && !['ready', 'review', 'trial', 'night', 'dawn'].includes(view.phase) && <section className="qs-panels-section"><header><PanelsTopLeft size={19} /><h3>{t('回答フリップ', 'Answer panels', 'こたえフリップ')}</h3><span>{view.round.tiles.filter(a => a.submitted).length} / {view.round.eligible.length - (view.round.artist ? 1 : 0)}</span></header><AnswerGrid view={view} room={room.current!} language={language} send={send} connected={active} /></section>}
      </>}</div>{view.role === 'host' && <HostDesk view={view} language={language} connected={active} send={send} onEdit={() => setEditor(true)} onLesson={() => { setLessonError(''); setLesson(true); }} onSamples={() => send({ type: 'bank', questions: starterQuestions(view.mode, language) })} />}</div>}
    </main>}
    {rules && <Rules language={language} onClose={() => setRules(false)} />}
    {editor && view?.host && <QuestionEditor bank={view.host.bank} language={language} onSave={questions => send({ type: 'bank', questions })} onClose={() => setEditor(false)} onLesson={() => { setLesson(true); setLessonError(''); }} />}
    {lesson && <Suspense fallback={<div className="qs-loading" role="status">{t('単元を読み込み中…', 'Loading learning units…', 'たんげんをよみこみちゅう…')}</div>}><OnlineLessonPicker extraHeader={<label className="quiz-show-lesson-count">{t('出題数', 'Question count', 'しゅつだいすう')}<select disabled={lessonBusy} value={lessonCount} onChange={e => setLessonCount(Number(e.target.value))}>{[6, 12, 30].map(n => <option key={n} value={n}>{n}</option>)}</select></label>} activity="quiz-show" languageMode={language} busy={lessonBusy} error={lessonError} onSelect={selection => { void importLesson(selection); }} onBack={() => { if (!lessonBusy) setLesson(false); }} /></Suspense>}
  </div>;
}
function errorCode(error: unknown): ShowError { const text = error instanceof Error ? error.message : ''; return text in ERRORS ? text as ShowError : 'NETWORK'; }
