import { Cockpit, panels } from './Cockpit';
import { adjustTrim, configure, logFix, selectPanel } from './instruments';
import { VirtualStick } from '../gakuro-craft/TouchControls';
import { stepPatrol, type Patrol, type RadioEvent } from './patrol';
import { PatrolSight } from './PatrolSight';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Compass, Crosshair, Gauge, Pause, Play, RotateCcw, Wind } from 'lucide-react';
import GameplayGamepadHint from '../../components/GameplayGamepadHint';
import { audioService } from '../../services/audioService';
import { PAD, useGameplayGamepad } from '../../hooks/useGameplayGamepad';
import type { LanguageMode } from '../../types';
import { DISCIPLINES, RUNWAY, localize, type Lesson, type Phrase } from './courses';
import { makeRouteScene, type RouteImages } from './routeScene';
import { center, cruiseRate, photo } from './routes';
import { assetUrl } from '../../utils/assetPaths';
import { makeFlightScene } from './FlightScene';
import {
  aimPoint,
  altitude,
  bearingTo,
  beginFlight,
  neutralInput,
  STEP,
  stepFlight,
  windAt,
  type Flight,
  type Report,
} from './simulation';

const CUES: Record<NonNullable<Flight['lastAction']>, Phrase> = {
  canopy: ['開傘！', 'Canopy open!', 'かいさん！'],
  reserve: ['予備の傘が開いた', 'Reserve canopy open', 'よびの かさが ひらいた'],
  launch: ['離陸！', 'Liftoff!', 'りりく！'],
  gate: ['リング通過！', 'Ring cleared!', 'リング つうか！'],
  thermal: ['上昇気流に乗った', 'Thermal lift', 'じょうしょうきりゅうに のった'],
};
const controls: Record<string, string> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'primary',
  ShiftLeft: 'brake',
  ShiftRight: 'brake',
};
type Props = {
  lesson: Lesson;
  language: LanguageMode;
  onDone: (r: Report) => void;
  onExit: () => void;
  onRetry: () => void;
  routeImages?: RouteImages;
  patrol?: Patrol;
  onRadio?: (event: RadioEvent) => void;
  onRadioStop?: () => void;
  onPatrolLost?: () => void;
};

function CourseMap({ flight: s, label }: { flight: Flight; label: string }) {
  const route = s.lesson.route;
  if (route) {
    const { region } = route,
      w = 150,
      h = (w * region.height) / region.width;
    const pos = (p: { x: number; z: number }) => [
      (0.5 + p.x / region.width) * w,
      (0.5 + p.z / region.height) * h,
    ];
    const pts = [center(route.from), ...s.lesson.gates, center(route.to)];
    const [x, y] = pos(s);
    return (
      <svg
        className="fs-map fs-route-map"
        viewBox={'0 0 ' + w + ' ' + h}
        aria-label={label}
        role="img"
      >
        <image href={assetUrl(photo(region.key))} width={w} height={h} preserveAspectRatio="none" />
        <polyline
          points={pts.map((p) => pos(p).join(',')).join(' ')}
          fill="none"
          stroke="#ffe698"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        {[route.from, route.to].map((port) => {
          const [cx, cy] = pos(center(port));
          return <circle key={port.code} cx={cx} cy={cy} r="3.5" fill="#ffd768" stroke="#142d38" />;
        })}
        <path
          d="M0 -7 L4 5 L0 3 L-4 5Z"
          transform={'translate(' + x + ' ' + y + ') rotate(' + (s.heading * 180) / Math.PI + ')'}
          fill="white"
          stroke="#163f50"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  const { lesson } = s,
    plane = lesson.aircraft === 'plane';
  const extent = plane ? 610 : lesson.aircraft === 'jetpack' ? 147 : 260;
  const cx = plane ? 0 : lesson.target.x,
    cz = plane ? 40 : (lesson.start.z + lesson.target.z) / 2;
  const x = (v: number) => 50 + ((v - cx) * 46) / extent,
    z = (v: number) => 50 + ((v - cz) * 46) / extent;
  return (
    <svg className="fs-map" viewBox="0 0 100 100" role="img" aria-label={label}>
      <defs>
        <pattern id="fs-map-grid" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
          <path
            d="M12.5 0H0V12.5"
            fill="none"
            stroke="#a8c4bc"
            strokeOpacity=".22"
            strokeWidth=".5"
          />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#fs-map-grid)" />
      <rect
        x={x(-RUNWAY.halfWidth)}
        y={z(-RUNWAY.halfLength)}
        width={(64 * 46) / extent}
        height={(620 * 46) / extent}
        fill="#7b9c98"
        opacity=".65"
      />
      <polyline
        points={[lesson.start, ...lesson.gates, lesson.target]
          .map((p) => [x(p.x), z(p.z)].join(','))
          .join(' ')}
        stroke="#bedbc3"
        fill="none"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {lesson.gates.map((g, k) => (
        <circle
          key={k}
          cx={x(g.x)}
          cy={z(g.z)}
          r={k === s.nextGate ? 3.7 : 2}
          fill={k < s.nextGate ? '#69cdb0' : '#224853'}
          stroke={k === s.nextGate ? '#ffc266' : '#90cfc7'}
          strokeWidth="1.4"
        />
      ))}
      <circle cx={x(lesson.target.x)} cy={z(lesson.target.z)} r="3" fill="#ffdd9b" />
      <path
        transform={`translate(${x(s.x)} ${z(s.z)}) rotate(${(s.heading * 180) / Math.PI})`}
        d="M0 -5 L3.5 4 L0 2.5 L-3.5 4Z"
        fill="white"
        stroke="#193e4d"
        strokeWidth=".7"
      />
      <text x="5" y="11" fill="#fff4d5" fontSize="8">
        N
      </text>
    </svg>
  );
}

export default function FlightDeck({
  lesson,
  language,
  onDone,
  onExit,
  onRetry,
  routeImages,
  patrol,
  onRadio,
  onRadioStop,
  onPatrolLost,
}: Props) {
  const t = (...p: Phrase) => localize(p, language);
  const discipline = DISCIPLINES.find((d) => d.id === lesson.aircraft)!;
  const s = useMemo(() => beginFlight(lesson), [lesson]);
  const canvas = useRef<HTMLCanvasElement>(null),
    keys = useRef(new Set<string>()),
    touches = useRef(new Map<number, string>());
  const capturedPointers = useRef(new Map<number, HTMLElement>());
  const stick = useRef({ turn: 0, pitch: 0 });
  const pad = useRef(neutralInput()),
    halted = useRef(false),
    survey = useRef(false),
    primaryTap = useRef(false),
    brakeTap = useRef(false);
  const [paused, setPaused] = useState(false),
    [lost, setLost] = useState(false),
    [, refresh] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  const callbacks = useRef({ onRadio, onRadioStop, onPatrolLost });
  callbacks.current = { onRadio, onRadioStop, onPatrolLost };
  const fighting = patrol?.phase === 'fight';
  const primaryLabel = fighting
    ? t('射撃', 'Fire', 'しゃげき')
    : localize(discipline.primary, language);
  const secondaryLabel = fighting
    ? t('バースト', 'Burst', 'バースト') + ' ' + patrol.sortie.energy + '/5'
    : localize(discipline.secondary, language);
  const clear = useCallback(() => {
    // Release held controls before replacing the flight screen.
    for (const [id, control] of capturedPointers.current) {
      if (control.hasPointerCapture(id)) control.releasePointerCapture(id);
      delete control.dataset.held;
    }
    capturedPointers.current.clear();
    keys.current.clear();
    touches.current.clear();
    primaryTap.current = false;
    brakeTap.current = false;
    pad.current = neutralInput();
    stick.current = { turn: 0, pitch: 0 };
  }, []);
  const pause = useCallback(
    (value: boolean) => {
      halted.current = value;
      if (value) callbacks.current.onRadioStop?.();
      clear();
      setPaused(value);
    },
    [clear],
  );
  const changeView = () => {
    if (patrol?.phase === 'fight') return;
    survey.current = !survey.current;
    refresh((n) => n + 1);
  };
  useGameplayGamepad('flight-school', (p) => {
    pad.current = { turn: p.x, pitch: -p.y, primary: p.buttons[PAD.A], brake: p.buttons[PAD.B] };
    if (p.pressed[PAD.B]) brakeTap.current = true;
    if (p.pressed[PAD.A]) primaryTap.current = true;
    if (p.pressed[PAD.X]) changeView();
    if (s.instruments && !halted.current) {
      const c = s.instruments;
      if (p.pressed[PAD.Y]) selectPanel(s, panels[(panels.indexOf(c.panel) + 1) % 3]);
      if (p.pressed[PAD.RB] && c.panel === 'systems') {
        if (!c.armed) c.armed = true;
        else if (c.started)
          configure(
            s,
            c.configuration === 'departure'
              ? 'cruise'
              : c.configuration === 'cruise'
                ? 'landing'
                : 'departure',
          );
      }
      if (p.pressed[PAD.RB] && c.panel === 'navigation') logFix(s);
      if (c.panel === 'systems' && c.started) {
        if (p.pressed[PAD.LT]) adjustTrim(c, -1);
        if (p.pressed[PAD.RT]) adjustTrim(c, 1);
      }
    }
    if (p.pressed[PAD.MENU]) pause(true);
  });
  useEffect(() => {
    const surface = canvas.current!;
    let scene: ReturnType<typeof makeFlightScene>;
    try {
      scene =
        lesson.route && routeImages
          ? makeRouteScene(surface, lesson.route, routeImages, !!patrol)
          : makeFlightScene(surface, lesson, !!patrol);
    } catch {
      setLost(true);
      pause(true);
      return;
    }
    let frame = 0,
      previous = performance.now(),
      accumulator = 0,
      nextHud = 0,
      cueSerial = 0,
      sawScenery = false,
      calledHome = false;
    const blur = () => pause(true),
      hidden = () => {
        if (document.hidden) blur();
      };
    const contextLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
      pause(true);
    };
    const key = (e: KeyboardEvent) => {
      if (e.type === 'keyup') {
        keys.current.delete(e.code);
        return;
      }
      if (halted.current) return;
      if (s.instruments && /^Digit[123]$/.test(e.code)) {
        e.preventDefault();
        selectPanel(s, panels[Number(e.code.at(-1)) - 1]);
        refresh((n) => n + 1);
        return;
      }
      if (
        s.instruments &&
        !s.instruments.started &&
        e.code === 'Space' &&
        e.target instanceof HTMLButtonElement
      )
        return;
      if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'KeyC') {
        e.preventDefault();
        if (!e.repeat) {
          if (e.code === 'KeyC') changeView();
          else pause(true);
        }
        return;
      }
      if (controls[e.code]) {
        e.preventDefault();
        keys.current.add(e.code);
        if (!e.repeat && controls[e.code] === 'primary') primaryTap.current = true;
        if (!e.repeat && controls[e.code] === 'brake') brakeTap.current = true;
      }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.15, Math.max(0, (now - previous) / 1000));
      previous = now;
      if (halted.current) {
        accumulator = 0;
        frame = requestAnimationFrame(tick);
        return;
      }
      const active = new Set(touches.current.values());
      for (const code of keys.current) active.add(controls[code]);
      const input = {
        turn:
          stick.current.turn +
          pad.current.turn +
          Number(active.has('right')) -
          Number(active.has('left')),
        pitch:
          stick.current.pitch +
          pad.current.pitch +
          Number(active.has('up')) -
          Number(active.has('down')),
        primary: primaryTap.current || pad.current.primary || active.has('primary'),
        brake: brakeTap.current || pad.current.brake || active.has('brake'),
      };
      accumulator += dt;
      while (accumulator >= STEP && !s.result && !patrol?.failed) {
        if (patrol) {
          const inBattle = patrol.phase === 'fight';
          stepPatrol(s, patrol, input, (event) => callbacks.current.onRadio?.(event));
          if (inBattle && patrol.sortie.sound) audioService.playFlightSound(patrol.sortie.sound);
          if (patrol.phase === 'fight') survey.current = false;
        } else stepFlight(s, input);
        primaryTap.current = false;
        brakeTap.current = false;
        accumulator -= STEP;
      }
      if (patrol?.failed) {
        halted.current = true;
        clear();
        callbacks.current.onPatrolLost?.();
        return;
      }
      scene.draw(
        s,
        input,
        survey.current,
        dt,
        patrol?.phase === 'fight' ? patrol.sortie : undefined,
      );
      if (!patrol && s.airborne && !s.result) {
        if (!sawScenery && s.elapsed > 4 && altitude(s) > 15) {
          sawScenery = true;
          callbacks.current.onRadio?.('vista');
        }
        if (!calledHome && lesson.aircraft === 'plane' && s.nextGate === lesson.gates.length) {
          calledHome = true;
          callbacks.current.onRadio?.('home');
        }
      }
      if (cueSerial !== s.serial) {
        cueSerial = s.serial;
        const action = s.lastAction;
        if (!patrol && action === 'launch') callbacks.current.onRadio?.('lift');
        if (action)
          audioService.playFlightSound(
            action === 'reserve'
              ? 'canopy'
              : action === 'launch' && lesson.aircraft === 'jetpack'
                ? 'thrust'
                : action,
          );
      }
      if (s.result) {
        halted.current = true;
        clear();
        if (!patrol && s.result.reason === 'landed') callbacks.current.onRadio?.('land');
        done.current(s.result);
        return;
      }
      if (now >= nextHud) {
        refresh((n) => n + 1);
        nextHud = now + (patrol?.phase === 'fight' ? 32 : 95);
      }
      frame = requestAnimationFrame(tick);
    };
    scene.draw(s, neutralInput(), false, STEP);
    frame = requestAnimationFrame(tick);
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', key, true);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hidden);
    surface.addEventListener('webglcontextlost', contextLost);
    return () => {
      cancelAnimationFrame(frame);
      clear();
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('keyup', key, true);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hidden);
      surface.removeEventListener('webglcontextlost', contextLost);
      scene.dispose();
    };
  }, [s, lesson, clear, pause, routeImages, patrol]);
  function press(action: string, face: React.ReactNode, label: string, shortcut?: string) {
    const release = (e: React.PointerEvent<HTMLButtonElement>) => {
      touches.current.delete(e.pointerId);
      delete e.currentTarget.dataset.held;
    };
    return (
      <button
        type="button"
        aria-label={label}
        data-flight-control={action}
        className={'fs-ctl fs-' + action}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          touches.current.set(e.pointerId, action);
          if (action === 'primary') primaryTap.current = true;
          if (action === 'brake') brakeTap.current = true;
          e.currentTarget.dataset.held = 'true';
        }}
        onPointerUp={release}
        onLostPointerCapture={release}
        onPointerCancel={release}
      >
        {face}
        {shortcut && <small>{shortcut}</small>}
      </button>
    );
  }
  const target = aimPoint(s),
    distance = Math.round(Math.hypot(target.x - s.x, target.z - s.z)),
    wind = windAt(s),
    gate = lesson.gates[s.nextGate];
  const heading = ((s.heading * 180) / Math.PI + 3600) % 360;
  function nextInstruction() {
    if (lesson.aircraft === 'jetpack' && gate)
      return t('輪の中でホバー', 'Hover inside the hoop', 'わの なかで ホバー');
    if (lesson.aircraft === 'plane' && !s.airborne)
      return t('加速 ＋ ↑ で離陸', 'Power + ↑ to lift off', 'かそく ＋ ↑ で りりく');
    if (lesson.route)
      return gate
        ? t('航路を巡航', 'Follow the route', 'こうろを じゅんこう')
        : t('着陸進入・減速', 'Final approach · slow down', 'ちゃくりくしんにゅう・げんそく');
    if (lesson.aircraft === 'parachute' && !s.canopy)
      return t('高度115 m付近で開傘', 'Open near 115 m', 'こうど 115 m ふきんで かいさん');
    if (lesson.aircraft === 'glider' && s.thermalTime < 1)
      return t('金色の気流を通過', 'Catch the golden thermal', 'きんいろの きりゅうを つうか');
    if (gate) return t('橙のリングへ', 'Aim for the amber ring', 'だいだいの リングへ');
    return lesson.aircraft === 'plane'
      ? t('滑走路に沿って着陸', 'Line up with the runway', 'かっそうろに そって ちゃくりく')
      : t('着地円の中心へ', 'Land on the bullseye', 'ちゃくちえんの まんなかへ');
  }
  return (
    <div
      className={
        'fs-deck' +
        (fighting ? ' fs-battle' : '') +
        (fighting && patrol.sortie.hurt > 0 ? ' fs-hurt' : '') +
        (fighting && patrol.sortie.burst > 0 ? ' fs-bursting' : '')
      }
      data-patrol-phase={patrol?.phase}
      data-gamepad-live={paused ? undefined : 'flight-school'}
      data-flight-stage="flight"
      data-expert={!!s.instruments}
      data-airborne={s.airborne}
      data-canopy={s.canopy}
      onGotPointerCapture={(e) => {
        if (e.target instanceof HTMLElement)
          capturedPointers.current.set(e.pointerId, e.target);
      }}
      onLostPointerCapture={(e) => capturedPointers.current.delete(e.pointerId)}
    >
      <canvas
        ref={canvas}
        aria-label={t('飛行訓練の3D空域', '3D training airspace', 'ひこうくんれんの 3Dくういき')}
      />
      <header className="fs-hudtop">
        <div className="fs-flight-id">
          <b>
            {lesson.route
              ? lesson.route.from.code + ' → ' + lesson.route.to.code
              : lesson.airport.code}
          </b>
          <span>
            {patrol
              ? localize(patrol.sortie.mission.name, language)
              : lesson.route
                ? t('空港間フライト', 'Airport routes', 'くうこうかんフライト')
                : localize(lesson.airport.name, language) +
                  ' · ' +
                  localize(discipline.name, language)}
          </span>
        </div>
        <div className="fs-tools">
          <button
            disabled={fighting}
            onClick={changeView}
            aria-pressed={survey.current}
            aria-label={t('視点切替', 'Change view', 'してんきりかえ')}
          >
            <Camera size={18} />
          </button>
          <button onClick={() => pause(true)} aria-label={t('一時停止', 'Pause', 'いちじていし')}>
            <Pause size={18} />
          </button>
        </div>
      </header>
      {s.instruments ? (
        <Cockpit flight={s} language={language} refresh={() => refresh((n) => n + 1)} />
      ) : (
        <div className="fs-telemetry">
          <div>
            <span>{t('高度', 'Altitude', 'こうど')}</span>
            <b data-flight-altitude>{Math.round(altitude(s))}</b>
            <small>m</small>
          </div>
          <div>
            <span>{t('速度', 'Speed', 'そくど')}</span>
            <b data-flight-speed>{Math.round(Math.abs(s.speed) * 3.6)}</b>
            <small>km/h</small>
          </div>
          <div>
            <Wind size={13} />
            <i
              style={{
                transform: `rotate(${(Math.atan2(wind.x, -wind.z) * 180) / Math.PI - heading}deg)`,
              }}
            >
              ↑
            </i>
            <small>{Math.hypot(wind.x, wind.z).toFixed(1)} m/s</small>
          </div>
          {lesson.aircraft === 'jetpack' && (
            <div>
              <span>{t('燃料', 'Fuel', 'ねんりょう')}</span>
              <b>{Math.ceil(s.fuel)}</b>
              <small>%</small>
            </div>
          )}
        </div>
      )}
      {(!s.instruments || s.instruments.panel === 'navigation') && (
        <CourseMap flight={s} label={t('航路図', 'Course map', 'こうろず')} />
      )}
      {fighting && (
        <>
          <PatrolSight s={patrol.sortie} />
          <div className="fs-combat-readout">
            {t('編隊', 'Wave', 'へんたい')} {patrol.sortie.wave + 1}/
            {patrol.sortie.mission.waves.length} · {t('耐久', 'Hull', 'たいきゅう')}{' '}
            {patrol.sortie.hull}
            {' · ' +
              Math.ceil(
                patrol.sortie.mission.seconds * (patrol.sortie.mode === 'practice' ? 1.35 : 1) -
                  patrol.sortie.time,
              ) +
              ' s'}
            {patrol.sortie.mission.escort &&
              ' · ' + t('輸送艇', 'Convoy', 'ゆそうてい') + ' ' + patrol.sortie.convoy}
          </div>
        </>
      )}
      {!fighting && (!s.instruments || s.instruments.panel === 'navigation') && (
        <div className="fs-waypoint">
          <span
            className="fs-way-arrow"
            style={{ transform: `rotate(${bearingTo(s, target)}rad)` }}
          >
            ↑
          </span>
          <div>
            <b>{nextInstruction()}</b>
            <small>
              {lesson.route ? (
                <>
                  {(Math.hypot(s.x - lesson.target.x, s.z - lesson.target.z) / 1000).toFixed(1)} km
                  · {t('海抜', 'MSL', 'かいばつ')} {Math.round(s.y)} m{' '}
                  {gate && ' → ' + Math.round(gate.y) + ' m'} · ×
                  {Math.round(cruiseRate(s, lesson.route))}
                </>
              ) : (
                <>
                  {s.nextGate}/{lesson.gates.length} ◇ · {distance} m{gate && ` · ↥ ${gate.y} m`}
                </>
              )}
            </small>
            {lesson.aircraft === 'jetpack' && s.dwell > 0 && (
              <progress aria-label={t('ホバー', 'Hover', 'ホバー')} value={s.dwell} max={0.65} />
            )}
          </div>
        </div>
      )}
      {!fighting &&
        s.lastAction &&
        s.lastAction !== 'thermal' &&
        s.elapsed - s.lastCueTime < 1.4 && (
          <div className="fs-cue" key={s.serial}>
            {lesson.route && s.lastAction === 'gate'
              ? t('経由地点を通過', 'Waypoint reached', 'けいゆちてんを つうか')
              : localize(CUES[s.lastAction], language)}
          </div>
        )}
      {s.inThermal && (
        <div className="fs-lift">
          <Wind size={14} />
          {localize(CUES.thermal, language)}
        </div>
      )}
      {lesson.route && (
        <small className="fs-route-credit">
          {t(
            '地形・写真：国土地理院',
            'Terrain & imagery · GSI Japan',
            'ちけい・しゃしん：こくどちりいん',
          )}
        </small>
      )}
      <div className="fs-touch">
        <div className="fs-stick-zone">
          <VirtualStick
            axes="direct"
            disabled={paused || lost}
            t={() => t('操縦スティック', 'Flight stick', 'そうじゅうスティック')}
            onMove={(v) => {
              stick.current = { turn: v?.dx ?? 0, pitch: -(v?.dz ?? 0) };
            }}
          />
        </div>
        <div className="fs-actions">
          {press(
            'brake',
            <>
              <Crosshair />
              {secondaryLabel}
            </>,
            secondaryLabel,
            'Shift',
          )}
          {press(
            'primary',
            <>
              {fighting ? <Crosshair /> : <Gauge />}
              {primaryLabel}
            </>,
            primaryLabel,
            'Space',
          )}
        </div>
      </div>
      {paused && (
        <div className="fs-cover">
          <section role="dialog" aria-modal="true" className="fs-panel fs-dialog">
            <Compass size={32} />
            <h2>
              {lost
                ? t(
                    '3D画面を開けませんでした',
                    'The 3D view is unavailable',
                    '3Dがめんを ひらけませんでした',
                  )
                : t('一時停止', 'Flight paused', 'いちじていし')}
            </h2>
            <p>
              {lost
                ? t(
                    '再試行して空域を読み込み直してください。',
                    'Retry to reload the airspace.',
                    'さいしこうして くういきを よみこみなおしてください。',
                  )
                : localize(discipline.controls, language)}
            </p>
            {s.instruments && (
              <p>
                {t(
                  '計器切替は1〜3キー、パッドはY。RBで電源・機器設定・航点記録、機器画面でLT／RTはトリム調整。',
                  'Use keys 1–3 or gamepad Y to switch panels. RB operates the selected panel. LT/RT adjust trim on Systems.',
                  '1〜3キー または Yで けいきを きりかえ。RBで でんげん・せってい・こうてんきろく。ききがめんの LT／RTで トリムを ちょうせい。',
                )}
              </p>
            )}
            <GameplayGamepadHint mode="flight-school" />
            {!lost && (
              <button autoFocus className="fs-main" onClick={() => pause(false)}>
                <Play size={17} />
                {t('飛行を再開', 'Resume flight', 'ひこうを さいかい')}
              </button>
            )}
            <button onClick={onRetry}>
              <RotateCcw size={16} />
              {t('やり直す', 'Retry flight', 'やりなおす')}
            </button>
            <button onClick={onExit}>
              {patrol
                ? t('課目選択へ', 'Mission select', 'かもくせんたくへ')
                : lesson.route
                  ? t('航路選択へ', 'Route selection', 'こうろせんたくへ')
                  : t('格納庫へ', 'Back to hangar', 'かくのうこへ')}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
