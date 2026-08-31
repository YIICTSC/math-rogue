import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Crosshair, RotateCcw, Sparkles } from 'lucide-react';
import { LanguageMode } from '../../types';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import {
  CRANE_PRIZES,
  CraneCatch,
  CranePrizeDefinition,
  clampCraneX,
  findCatchCandidate,
  getHangingPrizeRotation,
  getPrizePose,
} from './craneGameEngine';

type CranePhase = 'AIM' | 'DROPPING' | 'CLOSING' | 'LIFTING' | 'RESULT';

export interface CraneGameResult {
  outcome: 'WIN' | 'LOSE';
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
const CLAW_TOP_Y = 7;
const CLAW_DROP_Y = 63;

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
  const heldDirection = useRef<-1 | 0 | 1>(0);
  const lastDirection = useRef<-1 | 0 | 1>(0);
  const elapsedRef = useRef(0);
  const startedAt = useRef(performance.now());

  const result = useMemo<CraneGameResult>(() => {
    if (!caught) return { outcome: 'LOSE', prizeId: null, prizeLabel: null, goldReward: 8 };
    return {
      outcome: 'WIN',
      prizeId: caught.prize.id,
      prizeLabel: copy(languageMode, caught.prize.label.ja, caught.prize.label.hira, caught.prize.label.en),
      goldReward: caught.prize.goldReward,
    };
  }, [caught, languageMode]);

  const resetGame = useCallback(() => {
    heldDirection.current = 0;
    lastDirection.current = 0;
    startedAt.current = performance.now();
    elapsedRef.current = 0;
    setElapsedMs(0);
    setCaught(null);
    setCatchStartedAt(0);
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
      audioService.playSound(caught ? 'buff' : 'wrong');
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
            setPhase('CLOSING');
          }
          return { ...current, y: nextY };
        }
        if (phase === 'LIFTING') {
          const nextY = Math.max(CLAW_TOP_Y, current.y - delta * 0.043);
          if (nextY <= CLAW_TOP_Y) setPhase('RESULT');
          return { ...current, y: nextY };
        }
        return current;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [caught, phase]);

  const beginMove = (direction: -1 | 1) => {
    if (phase !== 'AIM') return;
    heldDirection.current = direction;
    lastDirection.current = direction;
  };
  const stopMove = () => { heldDirection.current = 0; };

  const renderPrize = (prize: CranePrizeDefinition) => {
    const isCaught = caught?.prize.id === prize.id;
    const pose = getPrizePose(prize, isCaught ? catchStartedAt : elapsedMs);
    const x = isCaught ? claw.x : pose.x;
    const y = isCaught ? Math.min(88, claw.y + 24) : pose.y;
    const rotation = isCaught
      ? getHangingPrizeRotation(pose.rotation, Math.max(0, elapsedMs - catchStartedAt), lastDirection.current)
      : pose.rotation;
    return (
      <Sprite
        key={prize.id}
        index={prize.spriteIndex}
        className={`crane-game-prize ${isCaught ? 'is-caught' : ''}`}
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

        <div className="crane-game-status">
          {phase === 'AIM' && copy(languageMode, '左右で狙って、ボタンでアームを下ろそう！', 'さゆうで ねらって、ボタンで アームを おろそう！', 'Aim with Left/Right, then drop the claw!')}
          {phase === 'DROPPING' && copy(languageMode, 'アーム降下中…', 'アーム こうかちゅう…', 'Claw descending…')}
          {phase === 'CLOSING' && copy(languageMode, 'キャッチ！', 'キャッチ！', 'GRAB!')}
          {phase === 'LIFTING' && copy(languageMode, '持ち上げ中…', 'もちあげちゅう…', 'Lifting…')}
        </div>

        <div className="crane-game-controls" aria-label={copy(languageMode, '操作ボタン', 'そうさ ボタン', 'Controls')}>
          <button type="button" onPointerDown={() => beginMove(-1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} disabled={phase !== 'AIM'}>
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
          <button type="button" onPointerDown={() => beginMove(1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} disabled={phase !== 'AIM'}>
            <ChevronRight />
          </button>
        </div>

        {phase === 'RESULT' && (
          <div className="crane-game-result" role="dialog" aria-modal="true" data-gamepad-navigation-root>
            {caught ? <Sprite index={caught.prize.spriteIndex} className="crane-game-result-prize" /> : <Sprite index={15} className="crane-game-result-prize" />}
            <div className="crane-game-result-copy">
              <Sparkles aria-hidden="true" />
              <h2>{caught ? copy(languageMode, '景品ゲット！', 'けいひん ゲット！', 'PRIZE GET!') : copy(languageMode, 'おしい！', 'おしい！', 'SO CLOSE!')}</h2>
              <p>{caught ? result.prizeLabel : copy(languageMode, '参加賞をもらった', 'さんかしょうを もらった', 'You received a consolation prize')}</p>
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
