import React, { useEffect, useRef, useState } from 'react';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import { audioService, type BgmPlaybackOptions } from '../../services/audioService';
import { GameMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { gameText, translate } from './copy';
import { CHOICE_KEYS, Sprite, type Localize } from './art';
import { CATALOG, canPlayChapter, CHAPTER_ROUNDS, readStory, THEMES } from './catalog';
import { RUSH_BEST_KEY, STORY_KEY, type Input, type Prop } from './rules';
import { GENRES, type Genre } from './originals/model';
import ChapterMenu from './ChapterMenu';
import { OriginalBoard } from './OriginalBoard';
import { castFor, directionFor } from './direction';
import { RushPortrait } from './RoundEffects';
import { TITLE_TRACK, trackFor } from './music';
import {
  difficulty, MAX_MISSES, pause, start, step, type Mode, type Stage,
} from './engine';
import './after-school-rush.css';
import './playfield.css';
import './depth-pieces.css';
import './action-pieces.css';
import './round-effects.css';

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
  const rootRef = useRef<HTMLElement>(null);
  const actionAudioAt = useRef(-Infinity);
  const voicedAction = useRef(false);
  const music = useRef<ReturnType<typeof audioService.acquireBgmScene> | null>(null);
  const quizOffset = useRef(0);
  const [quizCorrect, setQuizCorrect] = useState<number | null>(null);
  const [menu, setMenu] = useState<'home' | 'story' | 'practice'>('home');
  const [scores, setScores] = useState(readStory);
  const [chapter, setChapter] = useState(0);
  const [genre, setGenre] = useState<Genre | ''>('');
  const [best, setBest] = useState(readBest);
  const l: Localize = (ja, en, hira) => translate(languageMode, [ja, en, hira]);
  const title = l('放課後ミニラッシュ', 'After-School Mini Rush', 'ほうかごミニラッシュ');

  function show(next: Stage) {
    const old = stageRef.current;
    if (next === old) return;
    stageRef.current = next;
    setStage(next);
    if (next.tag !== 'lobby' && next.tag !== 'results' && next.pausedAt !== undefined) {
      audioService.stopMiniRushAudio();
    } else if (next.tag === 'lobby') {
      audioService.stopMiniRushAudio();
    } else if (next.tag === 'ready' && old.tag !== 'ready') {
      actionAudioAt.current = -Infinity;
      voicedAction.current = false;
      const cast = castFor(next.round.entry);
      audioService.prepareMiniRushVoices([cast.cheer[0], cast.retry[0], ...(cast.effort ? [cast.effort[0]] : [])]);
    } else if (next.tag === 'play' && old.tag === 'ready') {
      audioService.stopMiniRushVoice();
    } else if (next.tag === 'feedback' && old.tag !== 'feedback') {
      const clear = next.outcome === 'clear';
      const cast = castFor(next.round.entry);
      audioService.playMiniRushCue(clear ? next.round.entry.game.boss ? 'finale' : 'clear'
        : next.outcome === 'time' ? 'time' : 'miss');
      audioService.playMiniRushVoice(...(clear ? cast.cheer : cast.retry));
    }
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
    audioService.stopMiniRushAudio();
    audioService.playMiniRushCue('start');
    show(start(mode, performance.now()));
  }

  function openStory() {
    const next = THEMES.findIndex((_, i) => !scores[i] && canPlayChapter(i, scores));
    setChapter(next >= 0 ? next : 0);
    setMenu('story');
  }

  function input(value: Input) {
    const current = stageRef.current;
    const now = performance.now();
    const next = step(current, now, value);
    if (current.tag === 'play' && (next.tag === 'play' || next.tag === 'feedback')
      && next.round.action !== current.round.action && (next.tag === 'play' || next.outcome === 'clear')) {
      const direction = directionFor(next.round.entry, value.index);
      if (now - actionAudioAt.current >= 75) {
        actionAudioAt.current = now;
        audioService.playMiniRushCue(direction.cue);
      }
      if (next.tag === 'play' && !voicedAction.current && direction.effort) {
        const effort = castFor(next.round.entry).effort;
        if (effort) {
          voicedAction.current = true;
          audioService.playMiniRushVoice(...effort);
        }
      }
    }
    show(next);
  }

  const active = stage.tag === 'play' || stage.tag === 'ready' || stage.tag === 'feedback';
  const paused = active && stage.pausedAt !== undefined;
  const roundNumber = active ? stage.run.number : 0;
  const activeKey = active ? stage.round.entry.key : '';
  const studying = stage.tag === 'results' && stage.run.mode.kind !== 'practice' && quizCorrect === null;
  const musicTrack = active ? trackFor(stage.round.entry)
    : studying ? 'math'
      : stage.tag === 'results' ? stage.run.mode.kind === 'practice' ? 'poker_shop' : stage.run.completed ? 'victory' : 'game_over'
        : menu === 'story' ? 'map' : menu === 'practice' ? 'poker_shop' : TITLE_TRACK;

  useEffect(() => {
    const options: BgmPlaybackOptions = audioService.getBgmMode() === 'STUDY' ? { theme: 'high-school' }
      : { theme: 'high-school', mode: audioService.getBgmMode() === 'OLD' ? 'OLD' : 'NEW' };
    const scope = audioService.acquireBgmScene(TITLE_TRACK, options, 25);
    music.current = scope;
    return () => { music.current = null; scope(); };
  }, []);

  useEffect(() => {
    const saved = audioService.getBgmMode();
    music.current?.update(musicTrack, { theme: 'high-school', mode: saved === 'STUDY' ? undefined : saved === 'OLD' ? 'OLD' : 'NEW' });
  }, [musicTrack]);

  useEffect(() => {
    if (!active || paused) return;
    let raf = 0;
    let last = -Infinity;
    const frame = (now: number) => {
      if (now - last >= 24) {
        last = now;
        show(step(stageRef.current, now));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, paused]);

  useEffect(() => {
    const onHide = () => {
      const current = stageRef.current;
      if (document.hidden && (current.tag === 'play' || current.tag === 'ready' || current.tag === 'feedback') && current.pausedAt === undefined) {
        show(pause(current, performance.now()));
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      audioService.stopMiniRushAudio();
    };
  }, []);

  useEffect(() => {
    if (studying) return;
    const root = rootRef.current;
    const selector = paused ? '[data-asr-resume]' : stage.tag === 'play'
      ? '[data-asr-choice][data-gamepad-initial-choice]' : '[data-gamepad-initial-choice]';
    (root?.querySelector<HTMLElement>(selector) ?? root)?.focus({ preventScroll: true });
  }, [stage.tag, roundNumber, activeKey, paused, menu, studying]);

  function keydown(event: React.KeyboardEvent) {
    const current = stageRef.current;
    if (current.tag !== 'play' && current.tag !== 'ready' && current.tag !== 'feedback') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) show(pause(current, performance.now()));
      return;
    }
    if (current.tag !== 'play' || current.pausedAt !== undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = CHOICE_KEYS.indexOf(event.key.toUpperCase());
    if (index >= 0) {
      event.preventDefault();
      if (!event.repeat) input({ index });
    }
  }

  const game = active ? stage.round.entry.game : undefined;
  const theme = active ? THEMES[stage.round.entry.chapter] : null;
  const cast = active ? castFor(stage.round.entry) : null;
  const isBoss = Boolean(game?.boss);
  const isStoryResult = stage.tag === 'results' && stage.run.mode.kind === 'story';
  const resultChapter = isStoryResult && stage.run.mode.kind === 'story' ? stage.run.mode.chapter : null;
  const resultTheme = resultChapter === null ? null : THEMES[resultChapter];
  const elapsed = active ? Math.max(0, stage.now - stage.since) : 0;
  const remaining = active ? Math.max(0, stage.round.duration - elapsed) : 0;
  const backdrop = theme?.art ?? resultTheme?.art ?? (stage.tag === 'lobby' && menu === 'home' ? TITLE_ART : HALL);
  const skin = { '--asr-accent': isBoss ? '#ffb4b7' : theme?.color ?? '#ffdc68', '--asr-backdrop': `url("${assetUrl(backdrop)}")` } as React.CSSProperties;

  return (
    <main className="asr-root" ref={rootRef} tabIndex={-1} style={skin} onKeyDown={keydown}
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
          scores={scores} launch={launch} l={l} mode={languageMode} genre={genre} setGenre={setGenre} /> : <section className="asr-title-card">
          <div className="asr-title-art" aria-hidden="true">
            <img className="asr-title-key-art" src={assetUrl(TITLE_ART)} alt="" fetchPriority="high" />
          </div>
          <div className="asr-title-copy">
            <div className="asr-title-kicker"><img src={assetUrl(TITLE_ICON)} alt="" /><small>LEARNING ROGUE / ARCADE</small></div>
            <h1>{languageMode === 'ENGLISH' ? title : <>{l('放課後', 'After School', 'ほうかご')}<br />ミニラッシュ</>}</h1>
            <p>{l(`文化祭の鐘を取り戻す10章の物語。全${CATALOG.length}本のお題に挑戦！`,
              `A ten-chapter story to save the festival chime. Play ${CATALOG.length} microgames!`,
              `ぶんかさいの かねを とりもどす 10しょうの おはなし。${CATALOG.length}ほんの おだいに ちょうせん！`)}</p>
            <div className="asr-menu">
              <button type="button" className="asr-primary" data-gamepad-initial-choice onClick={openStory}>
                {l('ストーリー', 'Story', 'ストーリー')} <span aria-hidden="true">▶</span>
              </button>
              <button type="button" className="asr-secondary" onClick={() => launch({ kind: 'rush' })}>{l('ラッシュ', 'Rush', 'ラッシュ')}</button>
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
            <span><Sprite name={isBoss ? 'shield' : game.icon} />{isBoss && theme ? l(...theme.boss) : gameText(languageMode, game.title)}</span>
            {cast && <div className="asr-cast-credit" data-actor={cast.id}>
              <RushPortrait id={cast.id} /><span>{l(...cast.name)}</span>
            </div>}
          </div>
          <div className="asr-phase-label">
            {stage.tag === 'ready' ? l('出番！', 'You’re up!', 'でばん！')
              : l(...GENRES[game.genre])}
            {!isBoss && stage.run.mode.kind !== 'practice' && ` · LV ${difficulty(stage.run) + 1}`}
          </div>
          {stage.tag === 'play' && <div className="asr-time">
            <meter aria-label={l('残り時間', 'Time remaining', 'のこりじかん')} min={0} max={stage.round.duration} value={remaining} />
            <b aria-hidden="true">{(Math.ceil(remaining / 100) / 10).toFixed(1)}</b>
          </div>}
          {stage.tag === 'feedback' ? <div className="asr-verdict" role="status" data-outcome={stage.outcome}>
            <Sprite name={stage.outcome === 'clear' ? 'bell' : 'hourglass'} />
            <h2>{stage.outcome === 'clear' ? l('クリア！', 'Clear!', 'クリア！')
              : stage.outcome === 'time' ? l('時間切れ！', 'Time’s up!', 'じかんぎれ！') : l('ミス！', 'Miss!', 'ミス！')}</h2>
            {stage.outcome === 'clear' && <b>+{stage.points} PTS {stage.run.streak > 1 && `· ×${stage.run.streak}`}</b>}
          </div> : <h2 role={stage.tag === 'ready' ? 'status' : undefined}>{gameText(languageMode, game.cue)}</h2>}
          <OriginalBoard key={`${roundNumber}-${activeKey}`} entry={stage.round.entry} state={stage.round.state}
            elapsed={stage.tag === 'feedback' ? stage.resolvedAt ?? 0 : elapsed}
            action={stage.round.action} outcome={stage.outcome} preview={stage.tag === 'ready'}
            feedbackElapsed={stage.tag === 'feedback' ? elapsed : 0}
            mode={languageMode} select={index => input({ index })} />
        </section>
        {paused && <div className="asr-pause" role="dialog" aria-modal="true" aria-label={l('一時停止', 'Paused', 'いちじていし')} data-gamepad-modal>
          <section>
            <h2>{l('一時停止', 'Paused', 'いちじていし')}</h2>
            <button type="button" className="asr-primary" data-asr-resume data-gamepad-initial-choice
              onClick={() => show(pause(stageRef.current, performance.now()))}>{l('続ける', 'Resume', 'つづける')}</button>
            <button type="button" className="asr-secondary" onClick={() => show({ tag: 'lobby' })}>
              {menu === 'story' ? l('章一覧へ', 'Chapter list', 'しょういちらんへ')
                : menu === 'practice' ? l('お題図鑑へ', 'Game library', 'おだいずかんへ') : l('タイトルへ', 'Title', 'タイトルへ')}
            </button>
          </section>
        </div>}
      </>}

      {studying && stage.tag === 'results' && <div className="asr-quiz" data-asr-quiz>
        <MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode}
          assignment={assignment} languageMode={languageMode} problemOffset={quizOffset.current}
          rewardHint={stage.run.completed
            ? l('章クリア！ 3問にチャレンジ', 'Chapter cleared! Try three questions.', 'しょうクリア！ 3もんに チャレンジ')
            : l('ゲームオーバー。最後に3問！', 'Game over. Three final questions!', 'ゲームオーバー。さいごに 3もん！')}
          onAnswerResult={onAnswerResult} onComplete={correct => {
            quizOffset.current += 3;
            audioService.stopMiniRushVoice();
            setQuizCorrect(correct);
          }} />
      </div>}
      {stage.tag === 'results' && !studying && <section className="asr-results">
        <Sprite name={stage.run.wins ? 'gem' : 'hourglass'} />
        <h1>{resultTheme ? stage.run.completed ? l('章クリア！', 'Chapter clear!', 'しょうクリア！')
          : l('ゲームオーバー', 'Game over', 'ゲームオーバー')
          : stage.run.mode.kind === 'rush' ? l('ゲームオーバー', 'Game over', 'ゲームオーバー') : l('今回の記録', 'Your result', 'こんかいの きろく')}</h1>
        {resultTheme && <p>{stage.run.completed ? l(...resultTheme.clear)
          : l('3回ミスする前にボスまでたどり着き、章の最後のお題をクリアしよう。', 'Reach the boss before three misses and clear the chapter’s final challenge.', '3かい ミスする まえに ボスへ すすみ、しょうの さいごの おだいを クリアしよう。')}</p>}
        {quizCorrect !== null && <p className="asr-quiz-score">{l(`問題は3問中${quizCorrect}問正解`, `${quizCorrect} of 3 questions correct`, `もんだいは 3もんちゅう ${quizCorrect}もん せいかい`)}</p>}
        <strong>{stage.run.score} <small>PTS</small></strong>
        <dl>
          <div><dt>{l('クリア数', 'Cleared', 'クリアすう')}</dt><dd>{stage.run.wins}</dd></div>
          <div><dt>{l('最高連続', 'Best streak', 'さいこうれんぞく')}</dt><dd>{stage.run.bestStreak}</dd></div>
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
