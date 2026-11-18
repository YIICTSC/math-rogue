import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Crosshair,
  Orbit,
  Pause,
  Flag,
} from 'lucide-react';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import type { LanguageMode } from '../../types';
import { PAD, useGameplayGamepad } from '../../hooks/useGameplayGamepad';
import { audioService } from '../../services/audioService';
import { localize, type Airport, type Phrase, type Training } from './courses';
import {
  MISSIONS,
  aircraftScreen,
  newSortie,
  scoreSortie,
  shielded,
  stepSortie,
  underSight,
  type Sortie,
} from './combat';
import { combatScene } from './combatScene';
import { useFlightMusic } from './music';
import { FLIGHT_COMBAT_LOG_KEY } from './logbook';

type Study = Pick<
  React.ComponentProps<typeof MiniGameProblemChallenge>,
  'mode' | 'modePool' | 'assignment' | 'answerMode' | 'onAnswerResult'
>;
const bindings: Record<string, string> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'fire',
  ShiftLeft: 'burst',
  ShiftRight: 'burst',
};
function controlsText(t: (...p: Phrase) => string) {
  return t(
    '方向キーで照準を移動。Spaceで連射、5発命中でShiftのバースト。赤い予告円から抜けよう。',
    'Steer the sight with the arrows. Hold Space to fire. Five hits charge a Shift burst. Leave red warning circles before they flash.',
    'ほうこうキーで しょうじゅんを いどう。Spaceで れんしゃ、5はつ めいちゅうで Shiftの バースト。あかい えんから にげよう。',
  );
}
function readBest(): Record<string, number> {
  try {
    const value = JSON.parse(localStorage.getItem(FLIGHT_COMBAT_LOG_KEY) || '{}');
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, v]) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100,
      ),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}
function combatDeckKey(airport: Airport, s: Sortie) {
  return [airport.code, s.mission.id, s.mode].join('/');
}

function Battle({
  s,
  port,
  language,
  finish,
  leave,
}: {
  s: Sortie;
  port: Airport;
  language: LanguageMode;
  finish: () => void;
  leave: () => void;
}) {
  const t = (...v: Phrase) => localize(v, language),
    canvas = useRef<HTMLCanvasElement>(null);
  const held = useRef(new Set<string>()),
    touches = useRef(new Map<number, string>()),
    tap = useRef(''),
    pad = useRef({ x: 0, y: 0, fire: false, burst: false });
  const stopped = useRef(false),
    [paused, setPause] = useState(false),
    [lost, setLost] = useState(false),
    [, refresh] = useState(0);
  const onFinish = useRef(finish);
  onFinish.current = finish;
  function pause(on: boolean) {
    held.current.clear();
    touches.current.clear();
    tap.current = '';
    pad.current = { x: 0, y: 0, fire: false, burst: false };
    stopped.current = on;
    setPause(on);
  }
  useGameplayGamepad('flight-school', (p) => {
    pad.current = { x: p.x, y: -p.y, fire: p.buttons[PAD.A], burst: p.buttons[PAD.B] };
    if (p.pressed[PAD.MENU]) pause(true);
  });
  useEffect(() => {
    const surface = canvas.current!;
    let view: ReturnType<typeof combatScene>;
    try {
      view = combatScene(surface, port);
    } catch {
      setLost(true);
      pause(true);
      return;
    }
    let raf = 0,
      last = performance.now(),
      acc = 0,
      nextHud = 0;
    const key = (e: KeyboardEvent) => {
      if (e.type === 'keyup') {
        held.current.delete(e.code);
        return;
      }
      if (stopped.current) return;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        pause(true);
        return;
      }
      if (bindings[e.code]) {
        e.preventDefault();
        held.current.add(e.code);
        if (!e.repeat) tap.current = bindings[e.code];
      }
    };
    const blur = () => pause(true),
      visibility = () => {
        if (document.hidden) blur();
      },
      lostContext = (e: Event) => {
        e.preventDefault();
        setLost(true);
        pause(true);
      };
    const tick = (now: number) => {
      const elapsed = Math.min(0.12, (now - last) / 1000);
      last = now;
      if (!stopped.current) {
        const actions = new Set([
          ...touches.current.values(),
          ...Array.from(held.current, (k) => bindings[k]),
        ]);
        acc += elapsed;
        while (acc >= 1 / 60 && !s.finished) {
          stepSortie(
            s,
            {
              x: pad.current.x + Number(actions.has('right')) - Number(actions.has('left')),
              y: pad.current.y + Number(actions.has('up')) - Number(actions.has('down')),
              fire: pad.current.fire || actions.has('fire') || tap.current === 'fire',
              burst: pad.current.burst || actions.has('burst') || tap.current === 'burst',
            },
            1 / 60,
          );
          tap.current = '';
          if (s.sound) audioService.playFlightSound(s.sound);
          acc -= 1 / 60;
        }
        view.draw(s);
        if (now >= nextHud) {
          refresh((n) => n + 1);
          nextHud = now + 32;
        }
        if (s.finished) {
          onFinish.current();
          return;
        }
      } else acc = 0;
      raf = requestAnimationFrame(tick);
    };
    view.draw(s);
    raf = requestAnimationFrame(tick);
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', key, true);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    surface.addEventListener('webglcontextlost', lostContext);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('keyup', key, true);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      surface.removeEventListener('webglcontextlost', lostContext);
      view.dispose();
    };
  }, [s, port]);
  const position = (x: number, y: number) => ({
    left: (1 + x) * 50 + '%',
    top: (1 - y) * 50 + '%',
  });
  function button(action: string, label: string, face: React.ReactNode) {
    return (
      <button
        aria-label={label}
        className={'fs-ctl fs-' + action}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          touches.current.set(e.pointerId, action);
          tap.current = action;
        }}
        onLostPointerCapture={(e) => touches.current.delete(e.pointerId)}
        onPointerUp={(e) => touches.current.delete(e.pointerId)}
        onPointerCancel={(e) => touches.current.delete(e.pointerId)}
      >
        {face}
      </button>
    );
  }
  return (
    <div
      className={
        'fs-deck fs-battle' + (s.hurt > 0 ? ' fs-hurt' : '') + (s.burst > 0 ? ' fs-bursting' : '')
      }
      data-gamepad-live={paused ? undefined : 'flight-school'}
    >
      <canvas ref={canvas} aria-label={localize(s.mission.name, language)} />
      <header className="fs-hudtop">
        <div className="fs-flight-id">
          <b>{port.code}</b>
          <span>
            {localize(s.mission.name, language)} · {s.wave + 1}/{s.mission.waves.length}
          </span>
        </div>
        <div className="fs-tools">
          <button onClick={() => pause(true)} aria-label={t('一時停止', 'Pause', 'いちじていし')}>
            <Pause size={18} />
          </button>
        </div>
      </header>
      <div className="fs-telemetry">
        <div>
          {t('耐久', 'Hull', 'たいきゅう')} {Math.max(0, s.hull)}
        </div>
        <div>
          {t('残り', 'Time', 'のこり')}{' '}
          {Math.ceil(Math.max(0, s.mission.seconds * (s.mode === 'practice' ? 1.35 : 1) - s.time))}{' '}
          s
        </div>
        {s.mission.escort && (
          <div>
            {t('輸送艇', 'Convoy', 'ゆそうてい')} {s.convoy}
          </div>
        )}
      </div>
      {s.targets
        .filter((o) => o.hp > 0)
        .map((o) => (
          <span
            key={o.id}
            className={'fs-contact' + (shielded(s, o) ? ' protected' : '')}
            style={position(o.x, o.y)}
          >
            {shielded(s, o) ? '◇ ' : ''}
            {o.hp}
          </span>
        ))}
      {s.warnings.map((w, i) => (
        <i
          key={i}
          className="fs-danger"
          style={{
            ...position(aircraftScreen(w.x, w.y).x, aircraftScreen(w.x, w.y).y),
            opacity: Math.min(1, 1.7 - w.life * 0.5),
          }}
        />
      ))}
      <Crosshair
        className={
          'fs-sight' +
          (s.targets.some((o) => o.hp > 0 && !shielded(s, o) && underSight(s, o)) ? ' locked' : '')
        }
        style={position(s.x, s.y)}
      />
      <div className="fs-touch">
        <div className="fs-dpad">
          {button('up', t('上', 'Up', 'うえ'), <ArrowUp />)}
          {button('left', t('左', 'Left', 'ひだり'), <ArrowLeft />)}
          {button('down', t('下', 'Down', 'した'), <ArrowDown />)}
          {button('right', t('右', 'Right', 'みぎ'), <ArrowRight />)}
        </div>
        <div className="fs-actions">
          {button(
            'burst',
            t('バースト', 'Burst', 'バースト'),
            <>
              <Orbit />
              {t('バースト', 'Burst', 'バースト')} {s.energy}/5
            </>,
          )}
          {button(
            'fire',
            t('射撃', 'Fire', 'しゃげき'),
            <>
              <Crosshair />
              {t('射撃', 'Fire', 'しゃげき')}
            </>,
          )}
        </div>
      </div>
      {paused && (
        <div className="fs-cover">
          <section role="dialog" className="fs-panel fs-dialog">
            <h2>
              {lost
                ? t('描画を再開できません', '3D view unavailable', 'がめんを ひらけません')
                : t('一時停止', 'Paused', 'いちじていし')}
            </h2>
            <p>{controlsText(t)}</p>
            {!lost && (
              <button autoFocus className="fs-main" onClick={() => pause(false)}>
                {t('再開', 'Resume', 'さいかい')}
              </button>
            )}
            <button onClick={leave}>{t('課目選択へ', 'Mission select', 'かもくせんたくへ')}</button>
          </section>
        </div>
      )}
    </div>
  );
}

export default function CombatSchool({
  airport,
  language,
  onExit,
  study,
}: {
  airport: Airport;
  language: LanguageMode;
  onExit: () => void;
  study: Study;
}) {
  const t = (...p: Phrase) => localize(p, language);
  const [mission, select] = useState(MISSIONS[0]),
    [mode, setMode] = useState<Training>('practice'),
    [stage, setStage] = useState<'brief' | 'quiz' | 'play' | 'result'>('brief');
  const [sortie, setSortie] = useState(() => newSortie(mission, mode)),
    [book, setBook] = useState(readBest);
  useFlightMusic(
    stage === 'play'
      ? 'paper_plane_battle'
      : stage === 'quiz'
        ? 'math'
        : stage === 'result' && sortie.finished === 'clear'
          ? 'victory'
          : 'paper_plane_setup',
    'elementary',
    30,
  );
  const fly = () => {
    audioService.playFlightSound('start');
    setSortie(newSortie(mission, mode));
    setStage('play');
  };
  function finish() {
    const passed = sortie.finished === 'clear';
    audioService.playFlightSound(passed ? 'gate' : 'end');
    if (passed) {
      const key = combatDeckKey(airport, sortie),
        saved = readBest();
      saved[key] = Math.max(saved[key] ?? 0, scoreSortie(sortie));
      setBook(saved);
      try {
        localStorage.setItem(FLIGHT_COMBAT_LOG_KEY, JSON.stringify(saved));
      } catch {}
    }
    setStage('result');
  }
  if (stage === 'quiz')
    return (
      <div className="fs-quiz">
        <MiniGameProblemChallenge {...study} languageMode={language} onComplete={fly} />
      </div>
    );
  if (stage === 'play')
    return (
      <Battle
        s={sortie}
        port={airport}
        language={language}
        finish={finish}
        leave={() => setStage('brief')}
      />
    );
  return (
    <div className="fs-shell">
      <nav className="fs-nav">
        <button onClick={onExit}>
          <ArrowLeft size={16} />
          {t('格納庫', 'Hangar', 'かくのうこ')}
        </button>
        <span>
          {airport.code} · {localize(airport.name, language)}
        </span>
      </nav>
      <section className="fs-panel fs-result fs-sorties">
        <h1>
          <Flag /> {t('空中戦闘訓練', 'Aerial combat school', 'くうちゅうせんとうくんれん')}
        </h1>
        {stage === 'brief' ? (
          <>
            <div className="fs-crafts">
              {MISSIONS.map((m) => (
                <button key={m.id} aria-pressed={mission === m} onClick={() => select(m)}>
                  {localize(m.name, language)}
                </button>
              ))}
            </div>
            <b>{localize(mission.brief, language)}</b>
            <p>{controlsText(t)}</p>
            <label>
              {t('訓練区分', 'Training level', 'くんれんくぶん')}{' '}
              <select value={mode} onChange={(e) => setMode(e.target.value as Training)}>
                <option value="practice">{t('練習', 'Practice', 'れんしゅう')}</option>
                <option value="exam">{t('技能検定', 'Flight test', 'ぎのうけんてい')}</option>
              </select>
            </label>
            <p>
              {t('最高得点', 'Best score', 'さいこうとくてん')}　
              {book[[airport.code, mission.id, mode].join('/')] ?? '—'}
            </p>
            <div className="fs-which">
              <button
                className="fs-main"
                onClick={() => (mode === 'exam' ? setStage('quiz') : fly())}
              >
                {mode === 'exam'
                  ? t('座学から開始', 'Start ground school', 'ざがくから かいし')
                  : t('出撃', 'Launch', 'しゅつげき')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>
              {sortie.finished === 'clear'
                ? t('任務達成', 'Mission clear', 'にんむたっせい')
                : sortie.finished === 'escort'
                  ? t('輸送艇が離脱', 'Convoy lost', 'ゆそうていが りだつ')
                  : sortie.finished === 'time'
                    ? t('時間終了', 'Time expired', 'じかんしゅうりょう')
                    : t('機体シールド消失', 'Shield depleted', 'きたいシールドしょうしつ')}
            </h2>
            <b>
              {localize(mission.name, language)} · {scoreSortie(sortie)} / 100
            </b>
            <p>
              {t('撃破', 'Targets cleared', 'げきは')} {sortie.kills} /{' '}
              {mission.waves.flat().length} · {t('命中', 'Hits', 'めいちゅう')} {sortie.hits}/
              {sortie.shots}
            </p>
            <div className="fs-which">
              <button className="fs-main" onClick={fly}>
                {t('再挑戦', 'Retry', 'さいちょうせん')}
              </button>
              <button onClick={() => setStage('brief')}>
                {t('課目選択へ', 'Mission select', 'かもくせんたくへ')}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
