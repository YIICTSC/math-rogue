import React, { useEffect, useRef, useState } from 'react';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import { useGameplayGamepad, PAD } from '../../hooks/useGameplayGamepad';
import RoundBroadcast from './RoundBroadcast';
import { audioService, type BgmPlaybackOptions } from '../../services/audioService';
import { GameMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { gameText, translate } from './copy';
import { Sprite, type Localize } from './art';
import { controlsFor, type RushControl } from './controls';
import { VirtualControls } from './VirtualControls';
import { CATALOG, canPlayChapter, CHAPTER_ROUNDS, readStory, THEMES } from './catalog';
import { RUSH_BEST_KEY, STORY_KEY, type Prop } from './rules';
import { GENRES, type Genre } from './originals/model';
import ChapterMenu from './ChapterMenu';
import { readDiscovery, recordEncounter } from './discovery';
import { ActionBoard } from './action/ActionBoard';
import { S } from './action/physics';
import { actionVoiceFor, castFor, directionFor, soundFor } from './direction';
import { RushPortrait } from './RoundEffects';
import { usesDashMovement } from './actorSprite';
import { TITLE_TRACK, musicFor } from './music';
import {
  control, steer, difficulty, MAX_MISSES, RUSH_BLOCK, isSpeedUp, playElapsed, remainingTime, resumeAfterStudy, pause, start, step, type Mode, type Stage,
} from './engine';
import './after-school-rush.css';
import './round-effects.css';
import './arcade.css';
import './action/action.css';

const TITLE_ART = 'sprites/after-school-rush/title-v1.webp';
const TITLE_ICON = 'sprites/after-school-rush/menu-icon-v1.webp';
const HALL = 'sprites/backgrounds/learning-rogue/event-hallway.webp';

function readBest() {
  try {
    const n = Number(localStorage.getItem(RUSH_BEST_KEY));
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

const MARQUEE: Prop[] = ['coin', 'raspberry', 'slime', 'books', 'shield', 'hourglass', 'gem', 'wind'];

export default function AfterSchoolRush({
  onBack, problemMode = GameMode.MIXED, problemModePool, answerMode, assignment, onAnswerResult,
  languageMode = 'JAPANESE',
}: MiniGameComponentProps) {
  const [stage, setStage] = useState<Stage>({ tag: 'lobby' });
  const stageRef = useRef(stage);
  const mounted = useRef(true);
  const rootRef = useRef<HTMLElement>(null);
  const audioWarning = useRef(false);
  const actionAudioAt = useRef(-Infinity);
  const voicedAction = useRef(false);
  const music = useRef<ReturnType<typeof audioService.acquireBgmScene> | null>(null);
  const quizOffset = useRef(0);
  const [quizCorrect, setQuizCorrect] = useState<number | null>(null);
  const [learning, setLearning] = useState({ correct: 0, answered: 0 });
  const clockCue = useRef('');
  const heldKeys = useRef(new Set<string>());
  const padAxes = useRef({ x: 0, y: 0, ignore: false, active: false });
  const [menu, setMenu] = useState<'home' | 'story' | 'practice'>('home');
  const [scores, setScores] = useState(readStory);
  const [discovered, setDiscovered] = useState(readDiscovery);
  const discoveryRef = useRef(discovered);
  const [chapter, setChapter] = useState(0);
  const [genre, setGenre] = useState<Genre | ''>('');
  const [best, setBest] = useState(readBest);
  const l: Localize = (ja, en, hira) => translate(languageMode, [ja, en, hira]);
  const title = l('放課後ミニラッシュ', 'After-School Mini Rush', 'ほうかごミニラッシュ');

  // WebView audio can be interrupted or unavailable during a screen transition.
  // Its recovery must never prevent a control or a round transition from committing.
  function sound(effect: () => void) {
    try { effect(); } catch (error) {
      if (!audioWarning.current) { audioWarning.current = true; console.warn('Mini Rush audio is temporarily unavailable.', error); }
    }
  }
  function foley(entry: Parameters<typeof soundFor>[0], event: Parameters<typeof soundFor>[1], index = 4) {
    const clip = soundFor(entry, event, index);
    if (clip) audioService.playMiniRushFoley(clip.path, clip.duration, clip.fallback);
    return !!clip;
  }

  function show(next: Stage) {
    if (!mounted.current) return;
    const old = stageRef.current;
    if (next === old) return;
    if ((next.tag !== 'play' && next.tag !== 'ready') || next.pausedAt !== undefined) heldKeys.current.clear();
    stageRef.current = next;
    setStage(next);
    if (next.tag === 'play' && next.run.mode.kind === 'story'
      && (old.tag !== 'play' || old.round.entry.key !== next.round.entry.key || old.run.number !== next.run.number)) {
      const known = recordEncounter(next.run.mode, next.round.entry, discoveryRef.current);
      if (known.length !== discoveryRef.current.length) { discoveryRef.current = known; setDiscovered(known); }
    }
    if (next.tag === 'study') setQuizCorrect(null);
    sound(() => {
    if (next.tag === 'play' && old.tag === 'play' && next.round.entry.key === old.round.entry.key && next.round.state[S.HP] < old.round.state[S.HP]) {
      if (!foley(next.round.entry, 'hurt')) audioService.playMiniRushCue('tap');
    }
    if (next.tag === 'play' && old.tag === 'play' && next.round.entry.key === old.round.entry.key
      && next.round.state[S.SCORE] > old.round.state[S.SCORE] && next.round.action === old.round.action) {
      if (!foley(next.round.entry, 'score')) audioService.playMiniRushCue('collect');
    }
    if ((next.tag === 'ready' || next.tag === 'play' || next.tag === 'feedback') && next.pausedAt !== undefined) {
      audioService.stopMiniRushAudio();
    } else if (next.tag === 'lobby') {
      audioService.stopMiniRushAudio();
    } else if (next.tag === 'study') {
      audioService.stopMiniRushAudio();
    } else if (next.tag === 'ready' && old.tag !== 'ready') {
      if (next.run.number > 1) audioService.playMiniRushCue(next.round.entry.game.boss ? 'boss' : isSpeedUp(next.run) ? 'speed' : 'ready');
      actionAudioAt.current = -Infinity;
      voicedAction.current = false;
      const cast = castFor(next.round.entry);
      const clips = (['start', 'action', 'score', 'hurt', 'clear'] as const).flatMap(event => [soundFor(next.round.entry, event, 4), soundFor(next.round.entry, event, 5)]).filter(clip => !!clip);
      audioService.prepareMiniRushFoley(clips.map(clip => clip.path));
      const actionVoices = [actionVoiceFor(next.round.entry, 4), actionVoiceFor(next.round.entry, 5)].flatMap(voice => voice ? [voice[0]] : []);
      if (next.round.entry.game.action && usesDashMovement(next.round.entry.game.action.family)) {
        for (const folder of ['heroes', 'slides']) {
          const image = new Image();
          image.src = assetUrl(`sprites/go-home-dash/${folder}/${cast.id}.webp`);
          void image.decode().catch(() => {});
        }
      }
      audioService.prepareMiniRushVoices([cast.cheer[0], cast.retry[0], ...actionVoices]);
      foley(next.round.entry, 'start');
    } else if (next.tag === 'play' && old.tag === 'ready') {
      audioService.stopMiniRushVoice();
    } else if (next.tag === 'feedback' && old.tag !== 'feedback') {
      const clear = next.outcome === 'clear';
      const cast = castFor(next.round.entry);
      audioService.playMiniRushCue(clear ? next.round.entry.game.boss ? 'finale' : 'clear'
        : next.outcome === 'time' ? 'time' : 'miss');
      if (clear) foley(next.round.entry, 'clear');
      const voice = clear ? cast.cheer : cast.retry;
      if (next.round.entry.game.boss || voice[1] <= 1400) audioService.playMiniRushVoice(...voice);
      if (next.recovered) audioService.playMiniRushCue('recover');
    }
    if (next.tag === 'play') {
      const second = Math.ceil(remainingTime(next) / 1000), key = `${next.run.number}:${second}`;
      if (second > 0 && second <= 3 && clockCue.current !== key) { clockCue.current = key; audioService.playMiniRushCue('count'); }
    }
    });
    if (next.tag === 'results' && next.run.mode.kind === 'rush' && next.run.score > readBest()) {
      try { localStorage.setItem(RUSH_BEST_KEY, String(next.run.score)); } catch { /* Storage can be unavailable. */ }
      setBest(previous => Math.max(previous, next.run.score));
    }
    if (next.tag === 'results' && next.run.mode.kind === 'story' && next.run.completed) {
      const index = next.run.mode.chapter;
      const saved = readStory();
      saved[index] = Math.max(saved[index], next.run.score);
      try { localStorage.setItem(STORY_KEY, JSON.stringify(saved)); } catch { /* Storage can be unavailable. */ }
      setScores(previous => previous.map((score, i) => Math.max(score, saved[i])));
    }
  }

  function launch(mode: Mode) {
    setQuizCorrect(null);
    setLearning({ correct: 0, answered: 0 });
    clockCue.current = '';
    heldKeys.current.clear();
    sound(() => { audioService.stopMiniRushAudio(); audioService.playMiniRushCue('start'); });
    show(start(mode, performance.now()));
  }

  function openStory() {
    const next = THEMES.findIndex((_, i) => !scores[i] && canPlayChapter(i, scores));
    setChapter(next >= 0 ? next : 0);
    setMenu('story');
  }

  function input(command: RushControl) {
    const current = stageRef.current;
    const now = performance.now();
    const next = control(current, now, command);
    show(next);
    sound(() => {
    if (current.tag === 'play' && (next.tag === 'play' || next.tag === 'feedback')
      && next.round.action && next.round.action !== current.round.action && (next.tag === 'play' || next.outcome === 'clear')) {
      const direction = directionFor(next.round.entry, next.round.action.index);
      if (now - actionAudioAt.current >= 75) {
        actionAudioAt.current = now;
        if (!foley(next.round.entry, 'action', next.round.action.index)) audioService.playMiniRushCue(direction.cue);
      }
      if (next.tag === 'play' && !voicedAction.current && direction.effort) {
        const effort = actionVoiceFor(next.round.entry, next.round.action.index);
        if (effort) {
          voicedAction.current = true;
          audioService.playMiniRushVoice(...effort);
        }
      }
    }
    });
  }

  const active = stage.tag === 'play' || stage.tag === 'ready' || stage.tag === 'feedback';
  const paused = active && stage.pausedAt !== undefined;
  const roundNumber = active ? stage.run.number : 0;
  const activeKey = active ? stage.round.entry.key : '';
  const studying = stage.tag === 'study' || stage.tag === 'results' && stage.run.mode.kind !== 'practice' && quizCorrect === null;
  const selectedMusic = active ? musicFor(stage.round.entry, stage.run.mode.kind === 'rush' ? Math.floor((stage.run.number - 1) / RUSH_BLOCK) : undefined) : undefined;
  const musicTrack = selectedMusic?.type ?? (studying ? 'math'
      : stage.tag === 'results' ? stage.run.mode.kind === 'practice' ? 'poker_shop' : stage.run.completed ? 'victory' : 'game_over'
        : menu === 'story' ? 'map' : menu === 'practice' ? 'poker_shop' : TITLE_TRACK);
  const musicTheme = selectedMusic?.options.theme ?? 'high-school';
  const musicMode = selectedMusic?.options.mode;

  useEffect(() => {
    const options: BgmPlaybackOptions = audioService.getBgmMode() === 'STUDY' ? { theme: 'high-school' }
      : { theme: 'high-school', mode: audioService.getBgmMode() === 'OLD' ? 'OLD' : 'NEW' };
    sound(() => { music.current = audioService.acquireBgmScene(TITLE_TRACK, options, 25); });
    return () => { const scope = music.current; music.current = null; sound(() => scope?.()); };
  }, []);

  useEffect(() => {
    const saved = audioService.getBgmMode();
    sound(() => music.current?.update(musicTrack, { theme: musicTheme, mode: saved === 'STUDY' ? undefined : musicMode ?? (saved === 'OLD' ? 'OLD' : 'NEW') }));
  }, [musicTrack, musicTheme, musicMode]);

  useEffect(() => {
    if (!active || paused) return;
    let raf = 0;
    let last = -Infinity;
    const frame = (now: number) => {
      // Reserve the next frame before notification/media work. A one-off
      // callback failure must not leave READY or feedback frozen indefinitely.
      raf = requestAnimationFrame(frame);
      if (now - last >= 24) {
        last = now;
        show(step(stageRef.current, now));
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, paused]);

  useEffect(() => {
    mounted.current = true;
    const onHide = () => {
      const current = stageRef.current;
      if (document.hidden && (current.tag === 'play' || current.tag === 'ready' || current.tag === 'feedback') && current.pausedAt === undefined) {
        show(pause(current, performance.now()));
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', onHide);
      sound(() => audioService.stopMiniRushAudio());
    };
  }, []);

  useEffect(() => {
    if (studying) return;
    const root = rootRef.current;
    const selector = paused ? '[data-asr-resume]' : stage.tag === 'play'
      ? '[data-asr-button=a]' : '[data-gamepad-initial-choice]';
    (root?.querySelector<HTMLElement>(selector) ?? root)?.focus({ preventScroll: true });
  }, [stage.tag, roundNumber, activeKey, paused, menu, studying]);

  function steering(x: number, y: number) {
    show(steer(stageRef.current, performance.now(), x, y));
  }
  function keyAxes() {
    const keys = heldKeys.current;
    steering(Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')), Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')));
  }
  function keyup(event: React.KeyboardEvent) {
    if (event.key.startsWith('Arrow')) { heldKeys.current.delete(event.key); keyAxes(); }
  }
  function keydown(event: React.KeyboardEvent) {
    const current = stageRef.current;
    if (current.tag !== 'play' && current.tag !== 'ready' && current.tag !== 'feedback') return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat) { heldKeys.current.clear(); show(pause(current, performance.now())); }
      return;
    }
    if ((current.tag !== 'play' && current.tag !== 'ready') || current.pausedAt !== undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat || heldKeys.current.has(event.key)) { heldKeys.current.add(event.key); keyAxes(); }
      return;
    }
    const key = event.key.toLowerCase(), command = ['z', ' ', 'enter'].includes(key) ? 'a' : key === 'x' ? 'b' : undefined;
    if (command) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) input(command); }
  }
  useEffect(() => {
    const release = () => { heldKeys.current.clear(); steering(0, 0); };
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, []);
  useGameplayGamepad('mini-rush', pad => {
    const before = padAxes.current, current = stageRef.current;
    if (!pad.active) { if (before.active) steering(0, 0); padAxes.current = { x: 0, y: 0, ignore: before.ignore || before.active, active: false }; return; }
    if (current.tag !== 'play' && current.tag !== 'ready' && current.tag !== 'feedback') return;
    if (pad.pressed[PAD.MENU]) { heldKeys.current.clear(); show(pause(current, performance.now())); return; }
    if (current.tag !== 'play' || current.pausedAt !== undefined) {
      if (current.tag === 'ready' && current.pausedAt === undefined) {
        if (pad.pressed[PAD.A]) input('a'); else if (pad.pressed[PAD.B]) input('b');
      }
      before.ignore = Math.hypot(pad.x, pad.y) > .1; before.active = true; before.x = pad.x; before.y = pad.y; return;
    }
    if (Math.hypot(pad.x, pad.y) < .1) before.ignore = false;
    if (!before.ignore && (!before.active || Math.abs(pad.x - before.x) > .01 || Math.abs(pad.y - before.y) > .01)) steering(pad.x, pad.y);
    before.x = pad.x; before.y = pad.y; before.active = true;
    if (pad.pressed[PAD.A]) input('a'); else if (pad.pressed[PAD.B]) input('b');
  });

  const game = active ? stage.round.entry.game : undefined;
  const theme = active ? THEMES[stage.round.entry.chapter] : null;
  const cast = active ? castFor(stage.round.entry) : null;
  const isBoss = Boolean(game?.boss);
  const isStoryResult = stage.tag === 'results' && stage.run.mode.kind === 'story';
  const resultChapter = isStoryResult && stage.run.mode.kind === 'story' ? stage.run.mode.chapter : null;
  const resultTheme = resultChapter === null ? null : THEMES[resultChapter];
  const phaseElapsed = active ? Math.max(0, stage.now - stage.since) : 0;
  const elapsed = active ? stage.tag === 'play' ? playElapsed(stage) : stage.tag === 'feedback' ? stage.resolvedAt ?? 0 : 0 : 0;
  const remaining = active ? remainingTime(stage) : 0;
  const backdrop = theme?.art ?? resultTheme?.art ?? (stage.tag === 'lobby' && menu === 'home' ? TITLE_ART : HALL);
  const skin = { '--asr-accent': isBoss ? '#ffb4b7' : theme?.color ?? '#ffdc68', '--asr-backdrop': `url("${assetUrl(backdrop)}")` } as React.CSSProperties;

  return (
    <main className="asr-root" data-asr-screen={stage.tag} data-asr-mode={'run' in stage ? stage.run.mode.kind : undefined}
      data-gamepad-live={active && !paused ? 'mini-rush' : undefined} ref={rootRef} tabIndex={-1} style={skin} onKeyDown={keydown} onKeyUp={keyup}
      data-gamepad-navigation-root data-gamepad-initial-scope={`mini-rush-${stage.tag}-${paused}-${menu}-${activeKey}`}
      aria-label={title} lang={languageMode === 'ENGLISH' ? 'en' : 'ja'}>
      {stage.tag === 'lobby' && <div className="asr-lobby">
        <header className="asr-top">
          <button type="button" className="asr-quiet" data-gamepad-back onClick={menu !== 'home' ? () => setMenu('home') : onBack}>
            ← {menu !== 'home' ? l('タイトルへ', 'Title', 'タイトルへ') : l('ゲーム一覧', 'Games', 'ゲームいちらん')}
          </button>
          <span className="asr-best"><Sprite name="coin" />{l('最高', 'BEST', 'さいこう')} <b>{best}</b></span>
        </header>
        {menu !== 'home' ? <ChapterMenu view={menu} chapter={chapter} setChapter={setChapter}
          scores={scores} discovered={discovered} launch={launch} l={l} mode={languageMode} genre={genre} setGenre={setGenre} /> : <section className="asr-title-card">
          <div className="asr-title-art" aria-hidden="true">
            <img className="asr-title-key-art" src={assetUrl(TITLE_ART)} alt="" fetchPriority="high" />
          </div>
          <div className="asr-title-copy">
            <div className="asr-title-kicker"><img src={assetUrl(TITLE_ICON)} alt="" /><small>LEARNING ROGUE / ARCADE</small></div>
            <h1>{languageMode === 'ENGLISH' ? title : <>{l('放課後', 'After School', 'ほうかご')}<br />ミニラッシュ</>}</h1>
            <p>{l(`文化祭の鐘を取り戻す10章の物語。全${CATALOG.length}本のアクションに挑戦！`,
              `A ten-chapter story to save the festival chime. ${CATALOG.length} action microgames. Stick + A / B!`,
              `ぶんかさいの かねを とりもどす 10しょうの おはなし。${CATALOG.length}ほんの アクションに ちょうせん！`)}</p>
            <div className="asr-menu">
              <button type="button" className="asr-primary" data-gamepad-initial-choice onClick={openStory}>
                {l('ストーリー', 'Story', 'ストーリー')} <span aria-hidden="true">▶</span>
              </button>
              <button type="button" className="asr-secondary" onClick={() => launch({ kind: 'rush' })}>{l('ラッシュ', 'Rush', 'ラッシュ')} <small>{l('数秒勝負・8本ごとにボス！', 'Quick games. Boss every 8!', 'すうびょうしょうぶ・8ほんごとにボス！')}</small></button>
              <button type="button" className="asr-secondary" onClick={() => { setChapter(0); setGenre(''); setMenu('practice'); }}>{l('お題図鑑', 'Game Library', 'おだいずかん')}</button>
            </div>
          </div>
          <div className="asr-marquee" aria-hidden="true">{MARQUEE.map(art => <Sprite key={art} name={art} />)}</div>
        </section>}
      </div>}

      {active && game && <>
        <header className="asr-top" inert={paused}>
          <div className="asr-hud">
            <span>{stage.run.mode.kind === 'practice' ? l('練習', 'PRACTICE', 'れんしゅう') : `ROUND ${String(stage.run.number).padStart(2, '0')}${stage.run.mode.kind === 'story' ? ` / ${CHAPTER_ROUNDS}` : ''}`}</span>
            {stage.run.mode.kind !== 'practice' && <span className="asr-lives"
              aria-label={`${l('残りライフ', 'Lives left', 'のこりライフ')} ${MAX_MISSES - stage.run.misses}`}>
              {Array.from({ length: MAX_MISSES }, (_, i) => <i key={i} data-lost={i >= MAX_MISSES - stage.run.misses} aria-hidden="true">♥</i>)}
            </span>}
          </div>
          <div className="asr-hud">
            <span>{stage.run.score} <small>PTS</small></span>
            <button type="button" className="asr-quiet" data-gamepad-back
              data-gamepad-initial-choice={stage.tag !== 'play' && !paused || undefined}
              aria-label={l('一時停止', 'Pause', 'いちじていし')} onClick={() => show(pause(stageRef.current, performance.now()))}>Ⅱ</button>
          </div>
        </header>
        <section className="asr-cabinet" data-asr-phase={stage.tag} data-asr-paused={paused || undefined}
          data-asr-outcome={stage.outcome} aria-label={isBoss && theme ? l(...theme.boss) : gameText(languageMode, game.title)} inert={paused}>
          <div className="asr-cabinet-top">
            <span><Sprite name={isBoss ? 'shield' : game.action?.item ?? game.icon} />{isBoss && theme ? l(...theme.boss) : gameText(languageMode, game.title)}</span>
            {cast && <div className="asr-cast-credit" data-actor={cast.id}>
              <RushPortrait id={cast.id} /><span>{l(...cast.name)}</span>
            </div>}
          </div>
          <div className="asr-phase-label">
            {stage.tag === 'ready' ? l('出番！', 'You’re up!', 'でばん！')
              : l(...GENRES[game.genre])}
            {!isBoss && stage.run.mode.kind !== 'practice' && ` · LV ${difficulty(stage.run) + 1}`}
          </div>
          <div className="asr-block-progress" aria-hidden="true">{Array.from({ length: RUSH_BLOCK }, (_, i) => <i key={i} data-done={i < (stage.run.number - 1) % RUSH_BLOCK} data-current={i === (stage.run.number - 1) % RUSH_BLOCK}>{i === RUSH_BLOCK - 1 ? '◆' : '●'}</i>)}</div>
          {stage.tag === 'play' && <div className="asr-time" data-urgent={remaining <= 2000}>
            <meter aria-label={l('残り時間', 'Time remaining', 'のこりじかん')} min={0} max={stage.round.duration / stage.round.speed} value={remaining} />
            <b aria-hidden="true">{(Math.ceil(remaining / 100) / 10).toFixed(1)}</b>
          </div>}
          {stage.tag === 'feedback' && <div className="asr-verdict" role="status" data-outcome={stage.outcome}>
            <Sprite name={stage.outcome === 'clear' ? 'bell' : 'hourglass'} />
            <h2>{stage.outcome === 'clear' ? l('クリア！', 'Clear!', 'クリア！')
              : stage.outcome === 'time' ? l('時間切れ！', 'Time’s up!', 'じかんぎれ！') : l('ミス！', 'Miss!', 'ミス！')}</h2>
            {stage.outcome === 'clear' && <b>+{stage.points} PTS {stage.run.streak > 1 && `· ${stage.run.streak} COMBO`}</b>}
            {stage.recovered && <span className="asr-life-recovered">♥ +1</span>}
          </div>}
          <h2>{gameText(languageMode, game.cue)}</h2>
          <ActionBoard key={`${roundNumber}-${activeKey}`} entry={stage.round.entry} state={stage.round.state}
            elapsed={stage.tag === 'feedback' ? stage.resolvedAt ?? 0 : elapsed}
            action={stage.round.action} outcome={stage.outcome} feedbackElapsed={stage.tag === 'feedback' ? phaseElapsed : 0} mode={languageMode} />
          <VirtualControls key={`controls-${roundNumber}-${activeKey}`} entry={stage.round.entry} state={stage.round.state}
            elapsed={elapsed} mode={languageMode} cursor={stage.round.cursor ?? 0} canUndo={!!stage.round.history?.length}
            enabled={(stage.tag === 'play' || stage.tag === 'ready') && !paused} onControl={input} onSteer={steering} />
          <RoundBroadcast stage={stage} mode={languageMode} />
        </section>
        {paused && <div className="asr-pause" role="dialog" aria-modal="true" aria-label={l('一時停止', 'Paused', 'いちじていし')} data-gamepad-modal>
          <section>
            <h2>{l('一時停止', 'Paused', 'いちじていし')}</h2>
            <p>{gameText(languageMode, stage.round.entry.game.cue)}</p>
            <small>{l('スティックで移動・選択、Aで操作、Bで補助。矢印キーとZ・Xにも対応。', 'Move or choose with the stick, act with A, use B for the second action. Keyboard: arrows + Z / X.', 'スティックで いどう・せんたく、Aでそうさ、Bでほじょ。やじるしキーとZ・Xもつかえる。')}</small>
            <button type="button" className="asr-primary" data-asr-resume data-gamepad-initial-choice
              onClick={() => show(pause(stageRef.current, performance.now()))}>{l('続ける', 'Resume', 'つづける')}</button>
            <button type="button" className="asr-secondary" onClick={() => show({ tag: 'lobby' })}>
              {menu === 'story' ? l('章一覧へ', 'Chapter list', 'しょういちらんへ')
                : menu === 'practice' ? l('お題図鑑へ', 'Game library', 'おだいずかんへ') : l('タイトルへ', 'Title', 'タイトルへ')}
            </button>
          </section>
        </div>}
      </>}

      {studying && (stage.tag === 'results' || stage.tag === 'study') && <div className="asr-quiz" data-asr-quiz>
        <MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode}
          assignment={assignment} languageMode={languageMode} problemOffset={quizOffset.current}
          rewardHint={stage.tag === 'study' ? l('ひと息ついて3問！ 次はスピードアップ', 'Three questions, then the next gear!', 'ひといきついて3もん！ つぎはスピードアップ') : stage.run.completed
            ? l('章クリア！ 3問にチャレンジ', 'Chapter cleared! Try three questions.', 'しょうクリア！ 3もんに チャレンジ')
            : l('ゲームオーバー。最後に3問！', 'Game over. Three final questions!', 'ゲームオーバー。さいごに 3もん！')}
          onAnswerResult={onAnswerResult} onComplete={correct => {
            if (!mounted.current) return;
            quizOffset.current += 3;
            sound(() => audioService.stopMiniRushVoice());
            setLearning(previous => ({ correct: previous.correct + correct, answered: previous.answered + 3 }));
            if (stageRef.current.tag === 'study') { setQuizCorrect(null); show(resumeAfterStudy(stageRef.current, performance.now())); }
            else setQuizCorrect(correct);
          }} />
      </div>}
      {stage.tag === 'results' && !studying && <section className="asr-results">
        <Sprite name={stage.run.wins ? 'gem' : 'hourglass'} />
        <h1>{resultTheme ? stage.run.completed ? l('章クリア！', 'Chapter clear!', 'しょうクリア！')
          : l('ゲームオーバー', 'Game over', 'ゲームオーバー')
          : stage.run.mode.kind === 'rush' ? l('ゲームオーバー', 'Game over', 'ゲームオーバー') : l('今回の記録', 'Your result', 'こんかいの きろく')}</h1>
        {resultTheme && <p>{stage.run.completed ? l(...resultTheme.clear)
          : l('3回ミスする前にボスまでたどり着き、章の最後のお題をクリアしよう。', 'Reach the boss before three misses and clear the chapter’s final challenge.', '3かい ミスする まえに ボスへ すすみ、しょうの さいごの おだいを クリアしよう。')}</p>}
        {learning.answered > 0 && <p className="asr-quiz-score">{l(`問題は${learning.answered}問中${learning.correct}問正解`, `${learning.correct} of ${learning.answered} questions correct`, `もんだいは ${learning.answered}もんちゅう ${learning.correct}もん せいかい`)}</p>}
        <strong>{stage.run.score} <small>PTS</small></strong>
        <dl>
          <div><dt>{l('クリア数', 'Cleared', 'クリアすう')}</dt><dd>{stage.run.wins}</dd></div>
          <div><dt>{l('最高連続', 'Best streak', 'さいこうれんぞく')}</dt><dd>{stage.run.bestStreak}</dd></div>
          {stage.run.mode.kind === 'rush' && <div><dt>{l('ボス撃破', 'Bosses cleared', 'ボスげきは')}</dt><dd>{stage.run.bosses}</dd></div>}
          {stage.run.mode.kind === 'rush' && <div><dt>{l('自己ベスト', 'Personal best', 'じこベスト')}</dt><dd>{best}</dd></div>}
        </dl>
        <div className="asr-menu">
          {resultChapter !== null && stage.run.completed && resultChapter + 1 < THEMES.length
            ? <button type="button" className="asr-primary" data-gamepad-initial-choice onClick={() => { setChapter(resultChapter + 1); show({ tag: 'lobby' }); }}>
              {l('次の章へ', 'Next chapter', 'つぎの しょうへ')}
            </button>
            : <button type="button" className="asr-primary" data-gamepad-initial-choice onClick={() => launch(stage.run.mode)}>
              {l('もう一度', 'Play again', 'もういちど')}
            </button>}
          <button type="button" className="asr-secondary" data-gamepad-back onClick={() => show({ tag: 'lobby' })}>
            {stage.run.mode.kind === 'practice' ? l('お題を選ぶ', 'Choose a game', 'おだいを えらぶ')
              : stage.run.mode.kind === 'story' ? l('章一覧へ', 'Chapter list', 'しょういちらんへ') : l('タイトルへ', 'Title', 'タイトルへ')}
          </button>
        </div>
      </section>}
    </main>
  );
}
