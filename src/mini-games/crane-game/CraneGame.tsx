import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Crosshair, RotateCcw, Sparkles } from 'lucide-react';
import { LanguageMode } from '../../types';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import {
  CRANE_CHUTE_DROP_DURATION_MS,
  CRANE_CHUTE_X,
  CRANE_CARRY_DURATION_MS,
  CRANE_FALL_DURATION_MS,
  CRANE_PRIZES,
  CraneCatch,
  CranePrizeDefinition,
  clampCraneX,
  clampProgress,
  easeInOut,
  findCatchCandidate,
  getCarryDropPoint,
  getHangingPrizeRotation,
  interpolateCraneX,
  getPrizePose,
} from './craneGameEngine';

type CranePhase = 'AIM' | 'DROPPING' | 'CLOSING' | 'LIFTING' | 'CARRYING' | 'DROPPING_INTO_CHUTE' | 'FALLING' | 'RESULT';
type CraneDropReason = 'MISSED' | 'SLIPPED' | 'DELIVERED';

export interface CraneGameResult {
  outcome: 'WIN' | 'LOSE';
  reason: CraneDropReason;
  prizeId: string | null;
  prizeLabel: string | null;
  goldReward: number;
}

interface CraneGameProps {
  onBack: () => void;
  onCraneComplete?: (result: CraneGameResult) => void;
  languageMode?: LanguageMode;
  eventMode?: boolean;
}

const copy = (mode: LanguageMode | string, ja: string, hira: string, en: string) => (
  mode === 'ENGLISH' ? en : mode === 'HIRAGANA' ? hira : ja
);

const SPRITE_SHEET = 'sprites/mini-games/crane-game/crane-game-sprites-4x4-alpha-v1.png';
const CABINET_BACKGROUND = 'sprites/mini-games/crane-game/crane-game-cabinet-v1.png';
const CHUTE_FENCE_OVERLAY = 'sprites/mini-games/crane-game/crane-game-chute-fence-v1.png';
const CLAW_TOP_Y = 7;
const CLAW_DROP_Y = 63;
const CHUTE_DROP_Y = 68;
const FALLING_START_Y = CLAW_TOP_Y + 24;
const FALLING_END_Y = 96;

const Sprite: React.FC<{ index: number; className?: string; style?: React.CSSProperties }> = ({ index, className = '', style }) => {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <span
      aria-hidden="true"
      className={`crane-game-sprite ${className}`}
      style={{
        backgroundImage: `url("${assetUrl(SPRITE_SHEET)}")`,
        backgroundPosition: `${(column / 3) * 100}% ${(row / 3) * 100}%`,
        ...style,
      }}
    />
  );
};

const CraneGame: React.FC<CraneGameProps> = ({
  onBack,
  onCraneComplete,
  languageMode = 'JAPANESE',
  eventMode = false,
}) => {
  const [phase, setPhase] = useState<CranePhase>('AIM');
  const [claw, setClaw] = useState({ x: 50, y: CLAW_TOP_Y });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [caught, setCaught] = useState<CraneCatch | null>(null);
  const [catchStartedAt, setCatchStartedAt] = useState(0);
  const [dropReason, setDropReason] = useState<CraneDropReason>('MISSED');
  const [chuteDelivered, setChuteDelivered] = useState(false);
  const heldDirection = useRef<-1 | 0 | 1>(0);
  const lastDirection = useRef<-1 | 0 | 1>(0);
  const elapsedRef = useRef(0);
  const startedAt = useRef(performance.now());
  const carryStartedAt = useRef(0);
  const carryStartX = useRef(50);
  const carryDropPoint = useRef<number | null>(null);
  const chuteDropStartedAt = useRef(0);
  const fallStartedAt = useRef(0);
  const fallStartX = useRef(50);

  const result = useMemo<CraneGameResult>(() => {
    const delivered = Boolean(caught && chuteDelivered);
    if (!caught) return { outcome: 'LOSE', reason: 'MISSED', prizeId: null, prizeLabel: null, goldReward: 8 };
    return {
      outcome: delivered ? 'WIN' : 'LOSE',
      reason: delivered ? 'DELIVERED' : dropReason,
      prizeId: caught.prize.id,
      prizeLabel: copy(languageMode, caught.prize.label.ja, caught.prize.label.hira, caught.prize.label.en),
      goldReward: delivered ? caught.prize.goldReward : 8,
    };
  }, [caught, chuteDelivered, dropReason, languageMode]);

  const resetGame = useCallback(() => {
    heldDirection.current = 0;
    lastDirection.current = 0;
    startedAt.current = performance.now();
    elapsedRef.current = 0;
    setElapsedMs(0);
    setCaught(null);
    setCatchStartedAt(0);
    setDropReason('MISSED');
    setChuteDelivered(false);
    carryStartedAt.current = 0;
    carryStartX.current = 50;
    carryDropPoint.current = null;
    chuteDropStartedAt.current = 0;
    fallStartedAt.current = 0;
    fallStartX.current = 50;
    setClaw({ x: 50, y: CLAW_TOP_Y });
    setPhase('AIM');
    audioService.playSound('select');
  }, []);

  const dropClaw = useCallback(() => {
    if (phase !== 'AIM') return;
    heldDirection.current = 0;
    setPhase('DROPPING');
    audioService.playSound('select');
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && phase === 'AIM') {
        event.preventDefault();
        heldDirection.current = -1;
        lastDirection.current = -1;
      } else if (event.key === 'ArrowRight' && phase === 'AIM') {
        event.preventDefault();
        heldDirection.current = 1;
        lastDirection.current = 1;
      } else if ((event.key === ' ' || event.key === 'Enter') && phase === 'AIM') {
        event.preventDefault();
        dropClaw();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') heldDirection.current = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dropClaw, phase]);

  useEffect(() => {
    if (phase === 'CLOSING') {
      const timer = window.setTimeout(() => setPhase('LIFTING'), 420);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'RESULT') {
      audioService.playSound(caught && chuteDelivered ? 'buff' : 'wrong');
      return;
    }

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(34, now - previous);
      previous = now;
      const elapsed = now - startedAt.current;
      elapsedRef.current = elapsed;
      setElapsedMs(elapsed);

      setClaw((current) => {
        if (phase === 'AIM') {
          const direction = heldDirection.current;
          if (direction !== 0) lastDirection.current = direction;
          return { ...current, x: clampCraneX(current.x + direction * delta * 0.035) };
        }
        if (phase === 'DROPPING') {
          const nextY = Math.min(CLAW_DROP_Y, current.y + delta * 0.052);
          if (nextY >= CLAW_DROP_Y) {
            const candidate = findCatchCandidate(current.x, elapsed);
            setCaught(candidate);
            setCatchStartedAt(elapsed);
            setDropReason(candidate ? 'DELIVERED' : 'MISSED');
            setChuteDelivered(false);
            carryDropPoint.current = candidate ? getCarryDropPoint(Math.random(), candidate.prize) : null;
            setPhase('CLOSING');
          }
          return { ...current, y: nextY };
        }
        if (phase === 'LIFTING') {
          const nextY = Math.max(CLAW_TOP_Y, current.y - delta * 0.043);
          if (nextY <= CLAW_TOP_Y) {
            carryStartX.current = current.x;
            carryStartedAt.current = elapsed;
            setPhase('CARRYING');
          }
          return { ...current, y: nextY };
        }
        if (phase === 'CARRYING') {
          const carryProgress = clampProgress((elapsed - carryStartedAt.current) / CRANE_CARRY_DURATION_MS);
          const nextX = interpolateCraneX(carryStartX.current, CRANE_CHUTE_X, carryProgress);
          const carriageSwing = Math.sin(carryProgress * Math.PI) * 2.4;
          if (caught && carryDropPoint.current !== null && carryProgress >= carryDropPoint.current) {
            fallStartedAt.current = elapsed;
            fallStartX.current = nextX;
            setDropReason('SLIPPED');
            setPhase('FALLING');
          } else if (carryProgress >= 1) {
            chuteDropStartedAt.current = elapsed;
            setDropReason('DELIVERED');
            setPhase('DROPPING_INTO_CHUTE');
          }
          return { ...current, x: nextX, y: CLAW_TOP_Y + carriageSwing };
        }
        if (phase === 'DROPPING_INTO_CHUTE') {
          const chuteProgress = clampProgress((elapsed - chuteDropStartedAt.current) / CRANE_CHUTE_DROP_DURATION_MS);
          const nextY = CLAW_TOP_Y + (CHUTE_DROP_Y - CLAW_TOP_Y) * easeInOut(chuteProgress);
          if (chuteProgress >= 1) {
            setChuteDelivered(Boolean(caught));
            setPhase('RESULT');
          }
          return { ...current, x: CRANE_CHUTE_X, y: nextY };
        }
        if (phase === 'FALLING') {
          const fallProgress = clampProgress((elapsed - fallStartedAt.current) / CRANE_FALL_DURATION_MS);
          if (fallProgress >= 1) setPhase('RESULT');
          return {
            ...current,
            x: interpolateCraneX(fallStartX.current, CRANE_CHUTE_X, Math.min(1, fallProgress * 0.8)),
            y: CLAW_TOP_Y,
          };
        }
        return current;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [caught, chuteDelivered, phase]);

  const beginMove = (direction: -1 | 1) => {
    if (phase !== 'AIM') return;
    heldDirection.current = direction;
    lastDirection.current = direction;
  };
  const stopMove = () => { heldDirection.current = 0; };
  const nudgeMove = (direction: -1 | 1) => {
    if (phase !== 'AIM') return;
    lastDirection.current = direction;
    setClaw(current => ({ ...current, x: clampCraneX(current.x + direction * 5) }));
  };

  const renderPrize = (prize: CranePrizeDefinition) => {
    const isPrizeCaught = caught?.prize.id === prize.id;
    const isDelivered = isPrizeCaught && chuteDelivered;
    if (isDelivered) return null;

    const isFalling = isPrizeCaught && (
      phase === 'FALLING' || (phase === 'RESULT' && dropReason === 'SLIPPED')
    );
    const isHeld = isPrizeCaught && !isFalling && phase !== 'RESULT';
    const pose = getPrizePose(prize, isPrizeCaught ? catchStartedAt : elapsedMs);

    if (isFalling) {
      const fallProgress = phase === 'FALLING'
        ? clampProgress((elapsedMs - fallStartedAt.current) / CRANE_FALL_DURATION_MS)
        : 1;
      const x = fallStartX.current;
      const y = FALLING_START_Y + (FALLING_END_Y - FALLING_START_Y) * easeInOut(fallProgress);
      const rotation = pose.rotation
        + fallProgress * 72
        + getHangingPrizeRotation(0, Math.max(0, elapsedMs - catchStartedAt), lastDirection.current);
      return (
        <Sprite
          key={prize.id}
          index={prize.spriteIndex}
          className="crane-game-prize is-falling"
          style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
        />
      );
    }

    const x = isHeld ? claw.x : pose.x;
    const y = isHeld ? Math.min(93, claw.y + 24) : pose.y;
    const rotation = isHeld
      ? getHangingPrizeRotation(pose.rotation, Math.max(0, elapsedMs - catchStartedAt), lastDirection.current)
      : pose.rotation;
    return (
      <Sprite
        key={prize.id}
        index={prize.spriteIndex}
        className={`crane-game-prize ${isHeld ? 'is-caught' : ''}`}
        // The same prize element moves from the floor into the claw. No precomposed grab sprite is used.
        style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
      />
    );
  };

  const finish = () => {
    if (onCraneComplete) onCraneComplete(result);
    else onBack();
  };

  return (
    <main className="crane-game-screen" data-gamepad-initial-scope="crane-game">
      <div className="crane-game-machine" style={{ backgroundImage: `url("${assetUrl(CABINET_BACKGROUND)}")` }}>
        <button type="button" className="crane-game-back" onClick={onBack} aria-label={copy(languageMode, '戻る', 'もどる', 'Back')}>
          <ArrowLeft size={18} />
        </button>

        <header className="crane-game-marquee">
          <span>{copy(languageMode, '放課後クレーン', 'ほうかご クレーン', 'AFTER-SCHOOL CRANE')}</span>
          <small>{eventMode ? copy(languageMode, 'イベントボーナス', 'イベント ボーナス', 'EVENT BONUS') : copy(languageMode, 'フリープレイ', 'フリー プレイ', 'FREE PLAY')}</small>
        </header>

        <section className="crane-game-chamber" aria-label={copy(languageMode, 'クレーンゲームの景品台', 'クレーンゲームの けいひんだい', 'Crane game prize bay')}>
          <div className="crane-game-cable" style={{ left: `${claw.x}%`, height: `${claw.y + 7}%` }} />
          {CRANE_PRIZES.map(renderPrize)}
          <Sprite
            index={phase === 'AIM' || phase === 'DROPPING' ? 1 : 2}
            className="crane-game-claw"
            style={{ left: `${claw.x}%`, top: `${claw.y}%` }}
          />
          {phase === 'AIM' && <div className="crane-game-aim-line" style={{ left: `${claw.x}%` }} />}
        </section>

        <div
          className="crane-game-chute-overlay"
          aria-hidden="true"
          style={{ backgroundImage: `url("${assetUrl(CHUTE_FENCE_OVERLAY)}")` }}
        />
        <div
          className="crane-game-chute-overlay crane-game-chute-overlay-front"
          aria-hidden="true"
          style={{ backgroundImage: `url("${assetUrl(CHUTE_FENCE_OVERLAY)}")` }}
        />

        <div className="crane-game-status">
          {phase === 'AIM' && copy(languageMode, '左右で狙って、ボタンでアームを下ろそう！', 'さゆうで ねらって、ボタンで アームを おろそう！', 'Aim with Left/Right, then drop the claw!')}
          {phase === 'DROPPING' && copy(languageMode, 'アーム降下中…', 'アーム こうかちゅう…', 'Claw descending…')}
          {phase === 'CLOSING' && copy(languageMode, 'キャッチ！', 'キャッチ！', 'GRAB!')}
          {phase === 'LIFTING' && copy(languageMode, '持ち上げ中…', 'もちあげちゅう…', 'Lifting…')}
          {phase === 'CARRYING' && copy(languageMode, '獲得口へ運搬中…', 'かくとくぐちへ うんぱんちゅう…', 'Carrying to the chute…')}
          {phase === 'DROPPING_INTO_CHUTE' && copy(languageMode, '獲得口でリリース！', 'かくとくぐちで リリース！', 'Releasing over the chute!')}
          {phase === 'FALLING' && copy(languageMode, '景品が落下！', 'けいひんが らっか！', 'The prize slipped!')}
        </div>

        <div className="crane-game-controls" aria-label={copy(languageMode, '操作ボタン', 'そうさ ボタン', 'Controls')}>
          <button type="button" onPointerDown={() => beginMove(-1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} onClick={() => nudgeMove(-1)} disabled={phase !== 'AIM'}>
            <ChevronLeft />
          </button>
          <button
            type="button"
            data-gamepad-initial-choice
            className="crane-game-drop"
            onClick={dropClaw}
            disabled={phase !== 'AIM'}
          >
            <Crosshair />
            <span>{copy(languageMode, 'おろす', 'おろす', 'DROP')}</span>
          </button>
          <button type="button" onPointerDown={() => beginMove(1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} onClick={() => nudgeMove(1)} disabled={phase !== 'AIM'}>
            <ChevronRight />
          </button>
        </div>

        {phase === 'RESULT' && (
          <div className="crane-game-result" role="dialog" aria-modal="true" data-gamepad-navigation-root>
            {caught ? <Sprite index={caught.prize.spriteIndex} className="crane-game-result-prize" /> : <Sprite index={15} className="crane-game-result-prize" />}
            <div className="crane-game-result-copy">
              <Sparkles aria-hidden="true" />
              <h2>
                {caught && chuteDelivered
                  ? copy(languageMode, '獲得口に落下！', 'かくとくぐちに らっか！', 'DROPPED IN!')
                  : caught && dropReason === 'SLIPPED'
                    ? copy(languageMode, '途中でポロリ…', 'とちゅうで ポロリ…', 'SLIPPED ON THE WAY…')
                    : copy(languageMode, 'おしい！', 'おしい！', 'SO CLOSE!')}
              </h2>
              <p>
                {caught
                  ? chuteDelivered
                    ? result.prizeLabel
                    : copy(languageMode, 'あと少しで獲得口だった…', 'あと すこしで かくとくぐちだった…', 'It almost made the chute…')
                  : copy(languageMode, '参加賞をもらった', 'さんかしょうを もらった', 'You received a consolation prize')}
              </p>
              {eventMode && <strong>{result.goldReward}G</strong>}
            </div>
            <div className="crane-game-result-actions">
              {!eventMode && (
                <button type="button" onClick={resetGame}>
                  <RotateCcw size={17} /> {copy(languageMode, 'もう一度', 'もういちど', 'PLAY AGAIN')}
                </button>
              )}
              <button type="button" data-gamepad-initial-choice onClick={finish}>
                {eventMode ? copy(languageMode, '受け取って進む', 'うけとって すすむ', 'CLAIM & CONTINUE') : copy(languageMode, '終了', 'おわる', 'FINISH')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CraneGame;
