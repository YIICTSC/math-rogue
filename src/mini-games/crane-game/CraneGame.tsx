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
  CRANE_REPLAY_COST,
  CRANE_PRIZES,
  clampCraneX,
  clampProgress,
  easeInOut,
  getCarryDropPoint,
  getHangingPrizeRotation,
  interpolateCraneX,
  getPrizePose,
} from './craneGameEngine';
import type { CraneCatch, CranePermanentEffect, CranePrizeDefinition, CranePrizeId } from './craneGameEngine';

type CranePhase = 'AIM' | 'DROPPING' | 'CLOSING' | 'LIFTING' | 'CARRYING' | 'DROPPING_INTO_CHUTE' | 'FALLING' | 'RESULT';
type CraneDropReason = 'MISSED' | 'SLIPPED' | 'DELIVERED';

export interface CraneGameResult {
  outcome: 'WIN' | 'LOSE';
  reason: CraneDropReason;
  prizeId: string | null;
  /** All prizes delivered during this attempt, including chute-chain drops. */
  prizeIds?: CranePrizeId[];
  prizeLabel: string | null;
  goldReward: number;
  /** Permanent main-game effects represented by the delivered prizes. */
  permanentEffects?: CranePermanentEffect[];
}

interface CraneGameProps {
  onBack: () => void;
  onCraneComplete?: (result: CraneGameResult) => void;
  onCraneReplay?: () => boolean;
  /** Prize ids whose one-time main-game bonuses have already been claimed. */
  claimedCranePrizeIds?: CranePrizeId[];
  /** Current main-game wallet balance, shown when replay is available. */
  craneGold?: number;
  languageMode?: LanguageMode;
  eventMode?: boolean;
}

const copy = (mode: LanguageMode | string, ja: string, hira: string, en: string) => (
  mode === 'ENGLISH' ? en : mode === 'HIRAGANA' ? hira : ja
);

const SPRITE_SHEET = 'sprites/mini-games/crane-game/crane-game-sprites-4x4-alpha-v1.png';
const HELD_PRIZE_SHEET = 'sprites/mini-games/crane-game/crane-game-held-prizes-3x2-alpha-v1.png';
const CABINET_BACKGROUND = 'sprites/mini-games/crane-game/crane-game-cabinet-v2.png';
const CLAW_TOP_Y = 7;
const CLAW_DROP_Y = 63;
const FALLING_START_Y = CLAW_TOP_Y + 24;
const FALLING_END_Y = 96;
const PRIZE_CONTACT_Y = CLAW_DROP_Y - 4;
const PRIZE_CONTACT_PADDING = 3;
const PRIZE_CHUTE_TRIGGER_X = CRANE_CHUTE_X + 3;
const KNOCKED_PRIZE_FALL_DURATION_MS = 560;
const KNOCKED_PRIZE_FALL_END_Y = 112;
const SLIPPED_PRIZE_SETTLE_Y = 91;
// A released prize can only knock a neighbour that is actually beside the
// outlet.  Keep the contact pocket close to the chute so distant prizes do not
// join the same chain by proximity alone.
const CHUTE_CHAIN_CONTACT_X = 11;
const CHUTE_CHAIN_CONTACT_Y = 11;
const PRIZE_LAYOUT_MIN_X = 27;
const PRIZE_LAYOUT_MAX_X = 88;
const PRIZE_LAYOUT_MIN_Y = 77;
const PRIZE_LAYOUT_MAX_Y = 90;
const PRIZE_LAYOUT_MIN_SPACING = 5.5;
const CRANE_PRIZES_PER_GAME = 6;

type PrizeMotionStatus = 'FLOOR' | 'ROLLING' | 'FALLING' | 'REMOVED';

interface PrizeMotion {
  x: number;
  y: number;
  rotation: number;
  floorY: number;
  velocityX: number;
  angularVelocity: number;
  status: PrizeMotionStatus;
  rollStartedAt: number;
  fallStartedAt: number;
  fallStartY: number;
}

type PrizeMotionMap = Record<CranePrizeId, PrizeMotion>;
type CaughtMode = 'CLAW' | 'KNOCKED' | null;

const shufflePrizes = (prizes: CranePrizeDefinition[]): CranePrizeDefinition[] => {
  const shuffled = [...prizes];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const selectRandomPrizes = (): CranePrizeDefinition[] => (
  shufflePrizes(CRANE_PRIZES).slice(0, Math.min(CRANE_PRIZES_PER_GAME, CRANE_PRIZES.length))
);

const createInitialPrizeMotions = (prizes: CranePrizeDefinition[]): PrizeMotionMap => {
  const placedX: number[] = [];
  const randomizedPrizes = shufflePrizes(prizes);
  const nextMotions = randomizedPrizes.map((prize) => {
    let x = PRIZE_LAYOUT_MIN_X + Math.random() * (PRIZE_LAYOUT_MAX_X - PRIZE_LAYOUT_MIN_X);
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = PRIZE_LAYOUT_MIN_X + Math.random() * (PRIZE_LAYOUT_MAX_X - PRIZE_LAYOUT_MIN_X);
      if (placedX.every((existingX) => Math.abs(existingX - candidate) >= PRIZE_LAYOUT_MIN_SPACING)) {
        x = candidate;
        break;
      }
    }
    placedX.push(x);
    const basePose = getPrizePose(prize, 0);
    const pose = {
      x,
      y: Math.max(PRIZE_LAYOUT_MIN_Y, Math.min(PRIZE_LAYOUT_MAX_Y, basePose.y + (Math.random() - 0.5) * 7)),
      rotation: basePose.rotation + (Math.random() - 0.5) * 24,
    };
    return [prize.id, {
      ...pose,
      floorY: pose.y,
      velocityX: 0,
      angularVelocity: 0,
      status: 'FLOOR' as const,
      rollStartedAt: 0,
      fallStartedAt: 0,
      fallStartY: pose.y,
    }];
  });
  return Object.fromEntries(nextMotions) as PrizeMotionMap;
};

const findAvailableCatchCandidate = (clawX: number, motions: PrizeMotionMap, prizes: CranePrizeDefinition[]): CraneCatch | null => {
  const candidates = prizes
    .filter((prize) => motions[prize.id].status === 'FLOOR')
    .map((prize) => {
      const motion = motions[prize.id];
      const pose = { x: motion.x, y: motion.y, rotation: motion.rotation };
      return { prize, pose, distance: Math.abs(pose.x - clawX) };
    })
    .filter((candidate) => candidate.distance <= candidate.prize.catchRadius)
    .sort((left, right) => left.distance - right.distance);
  return candidates[0] ?? null;
};

interface SpriteSheetProps {
  index: number;
  className?: string;
  style?: React.CSSProperties;
  sheet?: string;
  columns?: number;
  rows?: number;
  aspectRatio?: number;
}

const Sprite: React.FC<SpriteSheetProps> = ({ index, className = '', style, sheet, columns = 4, rows = 4, aspectRatio = 1 }) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const isRedCapsule = index === 8 && (!sheet || sheet === SPRITE_SHEET) && columns === 4 && rows === 4;
  return (
    <span
      aria-hidden="true"
      className={`crane-game-sprite${isRedCapsule ? ' crane-game-red-capsule' : ''} ${className}`}
      style={{
        backgroundImage: `url("${assetUrl(sheet ?? SPRITE_SHEET)}")`,
        backgroundPosition: `${(column / Math.max(1, columns - 1)) * 100}% ${(row / Math.max(1, rows - 1)) * 100}%`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        aspectRatio,
        ...style,
      }}
    />
  );
};

const HeldPrizeSprite: React.FC<SpriteSheetProps> = ({ index, className = '', style, sheet, columns = 3, rows = 2, aspectRatio = 1 }) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return (
    <span
      aria-hidden="true"
      className={`crane-game-held-sprite ${className}`}
      style={{
        backgroundImage: `url("${assetUrl(sheet ?? HELD_PRIZE_SHEET)}")`,
        backgroundPosition: `${(column / Math.max(1, columns - 1)) * 100}% ${(row / Math.max(1, rows - 1)) * 100}%`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        aspectRatio,
        ...style,
      }}
    />
  );
};

const CraneGame: React.FC<CraneGameProps> = ({
  onBack,
  onCraneComplete,
  onCraneReplay,
  claimedCranePrizeIds = [],
  craneGold,
  languageMode = 'JAPANESE',
  eventMode = false,
}) => {
  const [phase, setPhase] = useState<CranePhase>('AIM');
  const [activePrizes] = useState<CranePrizeDefinition[]>(() => selectRandomPrizes());
  const [claw, setClaw] = useState({ x: 50, y: CLAW_TOP_Y });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [caught, setCaught] = useState<CraneCatch | null>(null);
  const [caughtMode, setCaughtMode] = useState<CaughtMode>(null);
  const [catchStartedAt, setCatchStartedAt] = useState(0);
  const [dropReason, setDropReason] = useState<CraneDropReason>('MISSED');
  const [chuteDelivered, setChuteDelivered] = useState(false);
  const [bonusPrizeIds, setBonusPrizeIds] = useState<CranePrizeId[]>([]);
  const [deliveredPrizeIds, setDeliveredPrizeIds] = useState<CranePrizeId[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<CraneGameResult[]>([]);
  const [replayDenied, setReplayDenied] = useState(false);
  const [prizeMotions, setPrizeMotions] = useState<PrizeMotionMap>(() => createInitialPrizeMotions(activePrizes));
  // The animation loop and the rendered sprites must read the same position.
  // Keeping the latest coordinates in a ref avoids state-updater side effects
  // causing the held composite to jump when a phase changes.
  const clawPositionRef = useRef({ x: 50, y: CLAW_TOP_Y });
  const activePrizesRef = useRef<CranePrizeDefinition[]>(activePrizes);
  const prizeMotionsRef = useRef<PrizeMotionMap>(prizeMotions);
  const contactedPrizeIds = useRef<Set<CranePrizeId>>(new Set());
  const chainContactedPrizeIds = useRef<Set<CranePrizeId>>(new Set());
  const bonusPrizeIdsRef = useRef<Set<CranePrizeId>>(new Set());
  const deliveredPrizeIdsRef = useRef<Set<CranePrizeId>>(new Set());
  const caughtRef = useRef<CraneCatch | null>(null);
  const caughtModeRef = useRef<CaughtMode>(null);
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
  const finishSubmittedRef = useRef(false);
  const replaySubmittedRef = useRef(false);
  const [finishSubmitted, setFinishSubmitted] = useState(false);

  // Record every prize that actually reaches the outlet through both a ref and
  // state. The animation loop can cross the chute and finish the result on
  // adjacent frames; the ref makes the award idempotent while state drives the
  // result re-render. This is deliberately reset per attempt so prizes
  // removed on an earlier paid replay are not counted a second time.
  const registerDeliveredPrize = useCallback((prizeId: CranePrizeId) => {
    if (deliveredPrizeIdsRef.current.has(prizeId)) return;
    deliveredPrizeIdsRef.current.add(prizeId);
    setDeliveredPrizeIds((currentIds) => currentIds.includes(prizeId) ? currentIds : [...currentIds, prizeId]);
  }, []);

  // Record a chained/secondary prize as both a visible bonus and a delivered
  // prize. The two collections have separate UI purposes, but share the same
  // idempotent delivery record used by the result payload.
  const registerBonusPrize = useCallback((prizeId: CranePrizeId) => {
    if (bonusPrizeIdsRef.current.has(prizeId)) return;
    bonusPrizeIdsRef.current.add(prizeId);
    setBonusPrizeIds((currentIds) => currentIds.includes(prizeId) ? currentIds : [...currentIds, prizeId]);
    registerDeliveredPrize(prizeId);
  }, [registerDeliveredPrize]);

  // Keep every prize awarded during this attempt as one ordered collection.
  // The primary catch, direct-contact rolls, and chute-chain prizes are all
  // shown in the result overlay, so a lucky multi-drop is never reduced to
  // only the first prize.
  const deliveredPrizes = useMemo<CranePrizeDefinition[]>(() => {
    // Merge the ref as well as state so the result can render the award on the
    // same frame that the falling animation reaches the outlet.
    const recordedDeliveredIds = Array.from(new Set([
      ...deliveredPrizeIds,
      ...deliveredPrizeIdsRef.current,
      ...bonusPrizeIds,
      ...bonusPrizeIdsRef.current,
    ]));
    const deliveredByAttempt = recordedDeliveredIds
      .filter((prizeId) => prizeId !== caught?.prize.id)
      .map((prizeId) => activePrizes.find((prize) => prize.id === prizeId))
      .filter((prize): prize is CranePrizeDefinition => Boolean(prize));
    return [
      ...(caught && chuteDelivered ? [caught.prize] : []),
      ...deliveredByAttempt,
    ];
  }, [activePrizes, bonusPrizeIds, caught, chuteDelivered, deliveredPrizeIds]);

  const attemptResult = useMemo<CraneGameResult>(() => {
    const won = deliveredPrizes.length > 0;
    const displayedPrizes = won ? deliveredPrizes : caught ? [caught.prize] : [];
    const prizeLabel = displayedPrizes.length > 0
      ? displayedPrizes.map((prize) => copy(languageMode, prize.label.ja, prize.label.hira, prize.label.en)).join(' ＋ ')
      : null;
    return {
      outcome: won ? 'WIN' : 'LOSE',
      reason: won ? 'DELIVERED' : caught ? dropReason : 'MISSED',
      prizeId: deliveredPrizes[0]?.id ?? caught?.prize.id ?? null,
      prizeIds: deliveredPrizes.map((prize) => prize.id),
      prizeLabel,
      goldReward: won ? deliveredPrizes.reduce((total, prize) => total + prize.goldReward, 0) : 8,
      permanentEffects: deliveredPrizes.map((prize) => prize.permanentEffect),
    };
  }, [caught, deliveredPrizes, dropReason, languageMode]);

  // A paid replay is still part of the same main-game event. Keep earlier
  // attempts in the completion payload so a prize won before replay is not
  // lost, while the result overlay below intentionally shows only the current
  // attempt for readability.
  const result = useMemo<CraneGameResult>(() => {
    if (attemptHistory.length === 0) return attemptResult;
    const allPrizeIds = Array.from(new Set(
      attemptHistory.flatMap((entry) => entry.prizeIds ?? (entry.prizeId ? [entry.prizeId as CranePrizeId] : []))
        .concat(attemptResult.prizeIds ?? (attemptResult.prizeId ? [attemptResult.prizeId as CranePrizeId] : [])),
    ));
    const winningLabels = attemptHistory
      .filter((entry) => entry.outcome === 'WIN' && entry.prizeLabel)
      .map((entry) => entry.prizeLabel as string)
      .concat(attemptResult.outcome === 'WIN' && attemptResult.prizeLabel ? [attemptResult.prizeLabel] : []);
    const permanentEffects = attemptHistory
      .flatMap((entry) => entry.permanentEffects ?? [])
      .concat(attemptResult.permanentEffects ?? []);
    const hasWin = allPrizeIds.length > 0;
    return {
      ...attemptResult,
      outcome: hasWin ? 'WIN' : attemptResult.outcome,
      reason: hasWin ? 'DELIVERED' : attemptResult.reason,
      prizeId: allPrizeIds[0] ?? attemptResult.prizeId,
      prizeIds: allPrizeIds,
      prizeLabel: winningLabels.length > 0 ? winningLabels.join(' ＋ ') : attemptResult.prizeLabel,
      goldReward: attemptHistory.reduce((total, entry) => total + entry.goldReward, 0) + attemptResult.goldReward,
      permanentEffects,
    };
  }, [attemptHistory, attemptResult]);

  const currentResultPrizes = useMemo<CranePrizeDefinition[]>(() => {
    const prizes = (attemptResult.prizeIds ?? [])
      .map((prizeId) => activePrizes.find((prize) => prize.id === prizeId))
      .filter((prize): prize is CranePrizeDefinition => Boolean(prize));
    return prizes.length > 0 ? prizes : caught ? [caught.prize] : [];
  }, [activePrizes, attemptResult.prizeIds, caught]);

  const claimedPrizeIdSet = useMemo(() => new Set(claimedCranePrizeIds), [claimedCranePrizeIds]);

  const resetGame = useCallback(() => {
    finishSubmittedRef.current = false;
    setFinishSubmitted(false);
    heldDirection.current = 0;
    lastDirection.current = 0;
    startedAt.current = performance.now();
    elapsedRef.current = 0;
    setElapsedMs(0);
    caughtRef.current = null;
    caughtModeRef.current = null;
    setCaught(null);
    setCaughtMode(null);
    setCatchStartedAt(0);
    setDropReason('MISSED');
    setChuteDelivered(false);
    setBonusPrizeIds([]);
    bonusPrizeIdsRef.current = new Set();
    setDeliveredPrizeIds([]);
    deliveredPrizeIdsRef.current = new Set();
    carryStartedAt.current = 0;
    carryStartX.current = 50;
    carryDropPoint.current = null;
    chuteDropStartedAt.current = 0;
    fallStartedAt.current = 0;
    fallStartX.current = 50;
    contactedPrizeIds.current = new Set();
    chainContactedPrizeIds.current = new Set();
    // Replay is another attempt in the same cabinet. Keep the selected six and
    // their motion map so a rolled, slipped, or removed prize is not silently
    // re-positioned between attempts. A fresh random lineup is selected when
    // the crane-game screen is entered (the initial state above).
    const initialPosition = { x: 50, y: CLAW_TOP_Y };
    clawPositionRef.current = initialPosition;
    setClaw(initialPosition);
    setPhase('AIM');
    audioService.playSound('select');
  }, []);

  const replay = useCallback(() => {
    if (finishSubmittedRef.current || replaySubmittedRef.current || !eventMode || phase !== 'RESULT' || !onCraneReplay) return;
    if (!onCraneReplay()) {
      setReplayDenied(true);
      audioService.playSound('wrong');
      return;
    }
    // Lock before changing phase so two rapid pointer/click events cannot
    // charge the replay fee twice while React is still batching the update.
    replaySubmittedRef.current = true;
    setReplayDenied(false);
    setAttemptHistory((history) => [...history, attemptResult]);
    resetGame();
  }, [attemptResult, eventMode, onCraneReplay, phase, resetGame]);

  useEffect(() => {
    if (phase === 'AIM') replaySubmittedRef.current = false;
  }, [phase]);

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
    let closeTimer: number | null = null;
    if (phase === 'CLOSING') {
      // Keep the physics loop alive while the claw closes so a miss can still
      // push a nearby prize during the same visible attempt.
      closeTimer = window.setTimeout(() => setPhase('LIFTING'), 420);
    }
    if (phase === 'RESULT') {
      audioService.playSound(caught && chuteDelivered ? 'buff' : 'wrong');
      return () => {
        if (closeTimer !== null) window.clearTimeout(closeTimer);
      };
    }

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(34, now - previous);
      previous = now;
      const elapsed = now - startedAt.current;
      elapsedRef.current = elapsed;
      setElapsedMs(elapsed);

      const current = clawPositionRef.current;
      let next = current;
      let nextPhase: CranePhase | null = null;
      let completedClawFall = false;

      if (phase === 'AIM') {
        const direction = heldDirection.current;
        if (direction !== 0) lastDirection.current = direction;
        next = { ...current, x: clampCraneX(current.x + direction * delta * 0.035) };
      } else if (phase === 'DROPPING') {
        const nextY = Math.min(CLAW_DROP_Y, current.y + delta * 0.052);
        next = { ...current, y: nextY };
        if (nextY >= CLAW_DROP_Y) {
          if (caughtModeRef.current === null) {
            const catchableCandidate = findAvailableCatchCandidate(current.x, prizeMotionsRef.current, activePrizesRef.current);
            caughtRef.current = catchableCandidate;
            caughtModeRef.current = catchableCandidate ? 'CLAW' : null;
            setCaught(catchableCandidate);
            setCaughtMode(catchableCandidate ? 'CLAW' : null);
            setCatchStartedAt(elapsed);
            setDropReason(catchableCandidate ? 'DELIVERED' : 'MISSED');
            setChuteDelivered(false);
            carryDropPoint.current = catchableCandidate ? getCarryDropPoint(Math.random(), catchableCandidate.prize) : null;
          }
          nextPhase = 'CLOSING';
        }
      } else if (phase === 'LIFTING') {
        const nextY = Math.max(CLAW_TOP_Y, current.y - delta * 0.043);
        next = { ...current, y: nextY };
        if (nextY <= CLAW_TOP_Y) {
          carryStartX.current = next.x;
          carryStartedAt.current = elapsed;
          nextPhase = 'CARRYING';
        }
      } else if (phase === 'CARRYING') {
        const carryProgress = clampProgress((elapsed - carryStartedAt.current) / CRANE_CARRY_DURATION_MS);
        const nextX = interpolateCraneX(carryStartX.current, CRANE_CHUTE_X, carryProgress);
        // Keep the carriage level after lifting. The generated held sprite is
        // one arm-and-prize image, so a shared, stable y coordinate keeps it
        // visibly attached while it travels to the chute.
        next = { ...current, x: nextX, y: CLAW_TOP_Y };
        if (caughtRef.current && caughtModeRef.current === 'CLAW' && carryDropPoint.current !== null && carryProgress >= carryDropPoint.current) {
          fallStartedAt.current = elapsed;
          fallStartX.current = nextX;
          setDropReason('SLIPPED');
          nextPhase = 'FALLING';
        } else if (caughtRef.current && caughtModeRef.current === 'CLAW' && carryProgress >= 1) {
          chuteDropStartedAt.current = elapsed;
          setDropReason('DELIVERED');
          nextPhase = 'DROPPING_INTO_CHUTE';
        } else if (!caughtRef.current && carryProgress >= 1) {
          // A miss still returns the empty claw to the chute before showing
          // the result, preserving the cabinet's full route.
          chuteDropStartedAt.current = elapsed;
          nextPhase = 'DROPPING_INTO_CHUTE';
        }
      } else if (phase === 'DROPPING_INTO_CHUTE') {
        const chuteProgress = clampProgress((elapsed - chuteDropStartedAt.current) / CRANE_CHUTE_DROP_DURATION_MS);
        next = { ...current, x: CRANE_CHUTE_X, y: CLAW_TOP_Y };
        if (chuteProgress >= 1) {
          fallStartedAt.current = elapsed;
          fallStartX.current = CRANE_CHUTE_X;
          nextPhase = 'FALLING';
        }
      } else if (phase === 'FALLING') {
        const fallProgress = clampProgress((elapsed - fallStartedAt.current) / CRANE_FALL_DURATION_MS);
        next = {
          ...current,
          x: interpolateCraneX(fallStartX.current, CRANE_CHUTE_X, Math.min(1, fallProgress * 0.8)),
          y: CLAW_TOP_Y,
        };
        if (fallProgress >= 1) {
          setChuteDelivered(dropReason === 'DELIVERED' || caughtModeRef.current === 'KNOCKED');
          nextPhase = 'RESULT';
          completedClawFall = true;
        }
      }

      const currentMotions = prizeMotionsRef.current;
      const nextMotions = { ...currentMotions };
      let prizeMotionsChanged = false;

      // Commit the caught prize's final position before the result screen. A
      // slipped prize settles back onto the floor where it fell; a delivered
      // prize stays removed from the bay when the player tries again.
      if (completedClawFall && caughtRef.current && caughtModeRef.current === 'CLAW') {
        const prize = caughtRef.current.prize;
        const motion = nextMotions[prize.id];
        const finalRotation = caughtRef.current.pose.rotation
          + 72
          + getHangingPrizeRotation(0, Math.max(0, elapsed - catchStartedAt), lastDirection.current);
        nextMotions[prize.id] = {
          ...motion,
          x: dropReason === 'SLIPPED' ? clampCraneX(fallStartX.current) : CRANE_CHUTE_X,
          y: dropReason === 'SLIPPED' ? Math.min(SLIPPED_PRIZE_SETTLE_Y, FALLING_END_Y) : KNOCKED_PRIZE_FALL_END_Y,
          rotation: finalRotation,
          status: dropReason === 'SLIPPED' ? 'FLOOR' : 'REMOVED',
          velocityX: 0,
          angularVelocity: 0,
          fallStartY: dropReason === 'SLIPPED' ? SLIPPED_PRIZE_SETTLE_Y : KNOCKED_PRIZE_FALL_END_Y,
        };
        if (dropReason !== 'SLIPPED') registerDeliveredPrize(prize.id);
        prizeMotionsChanged = true;
      }

      // A near miss is a physical impact, not a disappearing attempt. The
      // closest prize is reserved for a true catch; only the single closest
      // neighbouring prize receives an impulse, so one touch does not send the
      // whole pile flying.
      if (phase === 'DROPPING' && next.y >= PRIZE_CONTACT_Y && caughtModeRef.current === null) {
        const candidateAtDrop = findAvailableCatchCandidate(current.x, nextMotions, activePrizesRef.current);
        let closestContact: { prize: CranePrizeDefinition; motion: PrizeMotion; distance: number; contactRange: number } | null = null;
        for (const prize of activePrizesRef.current) {
          const motion = nextMotions[prize.id];
          if (motion.status !== 'FLOOR' || contactedPrizeIds.current.has(prize.id)) continue;
          if (candidateAtDrop?.prize.id === prize.id) continue;
          const contactRange = prize.catchRadius + PRIZE_CONTACT_PADDING;
          const distance = Math.abs(motion.x - next.x);
          if (distance > contactRange) continue;
          if (!closestContact || distance < closestContact.distance) {
            closestContact = { prize, motion, distance, contactRange };
          }
        }
        if (closestContact) {
          const { prize, motion, distance, contactRange } = closestContact;
          const pushDirection = motion.x === next.x
            ? (lastDirection.current === 1 ? 1 : -1)
            : Math.sign(motion.x - next.x);
          const closeness = clampProgress(1 - distance / contactRange);
          // A light brush should only rotate/nudge the prize; a hard, centered
          // hit can still send it all the way toward the outlet. A rare strong
          // impact keeps the outcome surprising without making every touch a
          // full-bay roll.
          const luckyImpact = Math.random() < 0.16;
          const pushSpeed = luckyImpact
            ? 0.038 + closeness * 0.012
            : 0.008 + closeness * 0.03;
          nextMotions[prize.id] = {
            ...motion,
            status: 'ROLLING',
            velocityX: pushDirection * pushSpeed,
            angularVelocity: pushDirection * (0.035 + closeness * 0.055),
            rollStartedAt: elapsed,
          };
          contactedPrizeIds.current.add(prize.id);
          prizeMotionsChanged = true;
        }
      }

      // A prize released over the chute can physically bump a neighbouring
      // prize before it disappears. Limit the hit to the chute-side pocket and
      // one closest target so a single drop creates a believable chain, not a
      // pile-wide cascade.
      if (
        phase === 'FALLING'
        && dropReason === 'DELIVERED'
        && caughtRef.current
        && caughtModeRef.current === 'CLAW'
      ) {
        const releaseProgress = clampProgress((elapsed - fallStartedAt.current) / CRANE_FALL_DURATION_MS);
        const releasedY = FALLING_START_Y + (FALLING_END_Y - FALLING_START_Y) * easeInOut(releaseProgress);
        if (releasedY >= CLAW_DROP_Y + 5) {
          const primaryPrizeId = caughtRef.current.prize.id;
          let closestChainTarget: { prize: CranePrizeDefinition; motion: PrizeMotion; distance: number } | null = null;
          for (const prize of activePrizesRef.current) {
            const motion = nextMotions[prize.id];
            if (prize.id === primaryPrizeId || chainContactedPrizeIds.current.has(prize.id)) continue;
            if (motion.status !== 'FLOOR' && motion.status !== 'ROLLING') continue;
            if (motion.x > CRANE_CHUTE_X + CHUTE_CHAIN_CONTACT_X) continue;
            const horizontalDistance = Math.abs(motion.x - fallStartX.current);
            const verticalDistance = Math.abs(motion.y - releasedY);
            if (horizontalDistance > CHUTE_CHAIN_CONTACT_X || verticalDistance > CHUTE_CHAIN_CONTACT_Y) continue;
            const distance = horizontalDistance + verticalDistance;
            if (!closestChainTarget || distance < closestChainTarget.distance) {
              closestChainTarget = { prize, motion, distance };
            }
          }
          if (closestChainTarget) {
            const { prize, motion } = closestChainTarget;
            nextMotions[prize.id] = {
              ...motion,
              status: 'ROLLING',
              velocityX: -0.042,
              angularVelocity: -0.08,
              rollStartedAt: elapsed,
            };
            chainContactedPrizeIds.current.add(prize.id);
            prizeMotionsChanged = true;
          }
        }
      }

      let knockedPrizeAtChute: { prize: CranePrizeDefinition; pose: PrizeMotion } | null = null;
      for (const prize of activePrizesRef.current) {
        const motion = nextMotions[prize.id];
        if (motion.status === 'ROLLING') {
          const friction = Math.pow(0.04, delta / 1000);
          let velocityX = motion.velocityX * friction;
          let x = motion.x + motion.velocityX * delta;
          if (x >= 93) {
            x = 93;
            velocityX = -Math.abs(velocityX) * 0.28;
          }
          const rollingMs = elapsed - motion.rollStartedAt;
          const bob = Math.abs(Math.sin(rollingMs / 85)) * Math.min(1.2, Math.abs(velocityX) * 18);
          const updated: PrizeMotion = {
            ...motion,
            x,
            y: motion.floorY - bob,
            rotation: motion.rotation + motion.angularVelocity * delta,
            velocityX,
            angularVelocity: motion.angularVelocity * friction,
          };

          if (velocityX < 0 && x <= PRIZE_CHUTE_TRIGGER_X) {
            updated.status = 'FALLING';
            updated.x = CRANE_CHUTE_X;
            updated.y = motion.floorY;
            updated.fallStartedAt = elapsed;
            updated.fallStartY = motion.floorY;
            updated.velocityX = 0;
            updated.angularVelocity = -0.12;
            knockedPrizeAtChute = { prize, pose: updated };
          } else if (Math.abs(velocityX) < 0.0005 && rollingMs > 220) {
            updated.status = 'FLOOR';
            updated.y = motion.floorY;
            updated.velocityX = 0;
            updated.angularVelocity = 0;
          }
          nextMotions[prize.id] = updated;
          prizeMotionsChanged = true;
        } else if (motion.status === 'FALLING') {
          const fallProgress = clampProgress((elapsed - motion.fallStartedAt) / KNOCKED_PRIZE_FALL_DURATION_MS);
          const updated: PrizeMotion = {
            ...motion,
            x: CRANE_CHUTE_X,
            y: motion.fallStartY + (KNOCKED_PRIZE_FALL_END_Y - motion.fallStartY) * easeInOut(fallProgress),
            rotation: motion.rotation + 0.24 * delta,
          };
          if (fallProgress >= 1) {
            updated.status = 'REMOVED';
            const primaryPrizeId = caughtRef.current?.prize.id;
            const isSecondaryDelivery = Boolean(
              primaryPrizeId
              && primaryPrizeId !== prize.id
              && (caughtModeRef.current === 'CLAW' || caughtModeRef.current === 'KNOCKED'),
            );
            registerDeliveredPrize(prize.id);
            if (isSecondaryDelivery || chainContactedPrizeIds.current.has(prize.id)) registerBonusPrize(prize.id);
            if (caughtModeRef.current === 'KNOCKED' && caughtRef.current?.prize.id === prize.id) {
              setChuteDelivered(true);
              nextPhase = 'RESULT';
            }
          }
          nextMotions[prize.id] = updated;
          prizeMotionsChanged = true;
        }
      }

      if (knockedPrizeAtChute && !caughtRef.current && caughtModeRef.current === null) {
        const { prize, pose } = knockedPrizeAtChute;
        const knockedCatch: CraneCatch = {
          prize,
          pose: { x: pose.x, y: pose.y, rotation: pose.rotation },
          distance: 0,
        };
        caughtRef.current = knockedCatch;
        caughtModeRef.current = 'KNOCKED';
        setCaught(knockedCatch);
        setCaughtMode('KNOCKED');
        setCatchStartedAt(elapsed);
        setDropReason('DELIVERED');
      }

      // Commit the result only after the primary route and every other
      // physically affected prize have settled.  In particular, a chute
      // chain can finish after the intended prize has already passed the
      // outlet, and a slipped primary can coexist with a secondary win.  By
      // waiting on all other ROLLING/FALLING motions here, the current attempt
      // can record a secondary-only drop or both prizes instead of confirming
      // the result on the first falling object.
      if (nextPhase === 'RESULT') {
        // When the arm misses, there is no resolved primary id yet.  Still
        // wait for any prize it brushed to settle, because that prize may be
        // the only one that reaches the outlet and therefore the only win for
        // this attempt.
        const resolvedPrizeId = caughtRef.current?.prize.id;
        const otherPrizeStillMoving = activePrizesRef.current.some((prize) => (
          prize.id !== resolvedPrizeId
          && (nextMotions[prize.id].status === 'ROLLING' || nextMotions[prize.id].status === 'FALLING')
        ));
        // A near-miss prize becomes the temporary primary as soon as it
        // crosses the chute lip, but it is not awarded until its own fall
        // animation reaches the bottom.  Do not let an empty-claw result on
        // the same frame skip that final delivery step.
        const resolvedPrizeStillFalling = Boolean(
          resolvedPrizeId
          && caughtModeRef.current === 'KNOCKED'
          && nextMotions[resolvedPrizeId]?.status === 'FALLING',
        );
        if (otherPrizeStillMoving || resolvedPrizeStillFalling) nextPhase = null;
      }

      if (prizeMotionsChanged) {
        prizeMotionsRef.current = nextMotions;
        setPrizeMotions(nextMotions);
      }
      clawPositionRef.current = next;
      setClaw(next);
      if (nextPhase) setPhase(nextPhase);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      if (closeTimer !== null) window.clearTimeout(closeTimer);
    };
  }, [caught, caughtMode, catchStartedAt, chuteDelivered, dropReason, phase, registerBonusPrize, registerDeliveredPrize]);

  const beginMove = (direction: -1 | 1) => {
    if (phase !== 'AIM') return;
    heldDirection.current = direction;
    lastDirection.current = direction;
  };
  const stopMove = () => { heldDirection.current = 0; };
  const nudgeMove = (direction: -1 | 1) => {
    if (phase !== 'AIM') return;
    lastDirection.current = direction;
    const next = { ...clawPositionRef.current, x: clampCraneX(clawPositionRef.current.x + direction * 5) };
    clawPositionRef.current = next;
    setClaw(next);
  };

  const renderPrize = (prize: CranePrizeDefinition) => {
    const motion = prizeMotions[prize.id];
    const isPrizeCaught = caught?.prize.id === prize.id;
    const isDelivered = isPrizeCaught && chuteDelivered;
    if (isDelivered || motion.status === 'REMOVED') return null;

    const isFalling = isPrizeCaught && (
      phase === 'FALLING' || (phase === 'RESULT' && dropReason === 'SLIPPED')
    ) || motion.status === 'FALLING';
    const isHeld = isPrizeCaught && caughtMode === 'CLAW' && !isFalling && phase !== 'RESULT';
    // Once caught, the floor sprite is replaced by one ImageGen-held sprite so
    // the arm and the prize share one transform during the full lift/carry route.
    if (isHeld) return null;
    const pose = isPrizeCaught && caught ? caught.pose : motion;

    if (isFalling) {
      const isKnockedFall = motion.status === 'FALLING';
      const fallProgress = isKnockedFall
        ? clampProgress((elapsedMs - motion.fallStartedAt) / KNOCKED_PRIZE_FALL_DURATION_MS)
        : phase === 'FALLING'
          ? clampProgress((elapsedMs - fallStartedAt.current) / CRANE_FALL_DURATION_MS)
          : 1;
      const x = isKnockedFall ? motion.x : fallStartX.current;
      const y = isKnockedFall
        ? motion.y
        : FALLING_START_Y + ((dropReason === 'SLIPPED' ? SLIPPED_PRIZE_SETTLE_Y : FALLING_END_Y) - FALLING_START_Y) * easeInOut(fallProgress);
      const rotation = isKnockedFall
        ? motion.rotation
        : pose.rotation
          + fallProgress * 72
          + getHangingPrizeRotation(0, Math.max(0, elapsedMs - catchStartedAt), lastDirection.current);
      return (
        <Sprite
          key={prize.id}
          index={prize.spriteIndex}
          className="crane-game-prize is-falling"
          sheet={prize.spriteSheet}
          columns={prize.spriteColumns}
          rows={prize.spriteRows}
          aspectRatio={prize.spriteAspectRatio}
          style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
        />
      );
    }

    return (
      <Sprite
        key={prize.id}
        index={prize.spriteIndex}
        className={`crane-game-prize${motion.status === 'ROLLING' ? ' is-rolling' : ''}`}
        sheet={prize.spriteSheet}
        columns={prize.spriteColumns}
        rows={prize.spriteRows}
        aspectRatio={prize.spriteAspectRatio}
        style={{ left: `${pose.x}%`, top: `${pose.y}%`, transform: `translate(-50%, -50%) rotate(${pose.rotation}deg)` }}
      />
    );
  };

  const finish = useCallback(() => {
    if (phase !== 'RESULT' || finishSubmittedRef.current) return;
    finishSubmittedRef.current = true;
    setFinishSubmitted(true);
    if (onCraneComplete) onCraneComplete(result);
    else onBack();
  }, [onBack, onCraneComplete, phase, result]);

  const isHoldingPrize = Boolean(caught && caughtMode === 'CLAW' && (
    phase === 'CLOSING'
    || phase === 'LIFTING'
    || phase === 'CARRYING'
    || phase === 'DROPPING_INTO_CHUTE'
  ));
  const hasRollingPrize = activePrizes.some((prize) => prizeMotions[prize.id].status === 'ROLLING');
  const hasKnockedPrizeFalling = activePrizes.some((prize) => prizeMotions[prize.id].status === 'FALLING');

  return (
    <main className="crane-game-screen" data-gamepad-initial-scope="crane-game">
      <div className="crane-game-machine" style={{ backgroundImage: `url("${assetUrl(CABINET_BACKGROUND)}")` }}>
        <button type="button" className="crane-game-back" onClick={phase === 'RESULT' ? finish : onBack} aria-label={copy(languageMode, '戻る', 'もどる', 'Back')}>
          <ArrowLeft size={18} />
        </button>

        <header className="crane-game-marquee">
          <span>{copy(languageMode, '放課後クレーン', 'ほうかご クレーン', 'AFTER-SCHOOL CRANE')}</span>
          <small>{eventMode ? copy(languageMode, '初回無料・リプレイ100G', 'しょかい むりょう・リプレイ100G', 'FIRST PLAY FREE · REPLAY 100G') : copy(languageMode, 'フリープレイ', 'フリー プレイ', 'FREE PLAY')}</small>
        </header>

        <section className="crane-game-chamber" aria-label={copy(languageMode, 'クレーンゲームの景品台', 'クレーンゲームの けいひんだい', 'Crane game prize bay')}>
          <div className="crane-game-cable" style={{ left: `${claw.x}%`, height: `${claw.y + 7}%` }} />
          {activePrizes.map(renderPrize)}
          {isHoldingPrize && caught ? (
            <HeldPrizeSprite
              index={caught.prize.heldSpriteIndex}
              className="crane-game-held-prize"
              sheet={caught.prize.heldSpriteSheet}
              columns={caught.prize.heldSpriteColumns}
              rows={caught.prize.heldSpriteRows}
              aspectRatio={caught.prize.heldSpriteAspectRatio}
              style={{
                left: `${claw.x}%`,
                top: `${claw.y}%`,
              }}
            />
          ) : (
            <Sprite
              index={phase === 'AIM' || phase === 'DROPPING' ? 1 : 2}
              className="crane-game-claw"
              style={{ left: `${claw.x}%`, top: `${claw.y}%` }}
            />
          )}
          {phase === 'AIM' && <div className="crane-game-aim-line" style={{ left: `${claw.x}%` }} />}
        </section>

        <div className="crane-game-status" role="status" aria-live="polite">
          {phase === 'AIM' && copy(languageMode, '左右で狙って、ボタンでアームを下ろそう！', 'さゆうで ねらって、ボタンで アームを おろそう！', 'Aim with Left/Right, then drop the claw!')}
          {phase === 'DROPPING' && (hasRollingPrize
            ? copy(languageMode, 'ガツン！景品が転がった！', 'ガツン！けいひんが ころがった！', 'THUD! The prize rolled!')
            : copy(languageMode, 'アーム降下中…', 'アーム こうかちゅう…', 'Claw descending…'))}
          {phase === 'CLOSING' && (hasKnockedPrizeFalling
            ? copy(languageMode, '搬出口へ滑り込んだ！', 'はんしゅつぐちへ すべりこんだ！', 'A prize slid into the outlet!')
            : hasRollingPrize
              ? copy(languageMode, '景品が転がっている…', 'けいひんが ころがっている…', 'The prize is rolling…')
              : copy(languageMode, 'キャッチ！', 'キャッチ！', 'GRAB!'))}
          {phase === 'LIFTING' && copy(languageMode, '持ち上げ中…', 'もちあげちゅう…', 'Lifting…')}
          {phase === 'CARRYING' && copy(languageMode, '獲得口へ運搬中…', 'かくとくぐちへ うんぱんちゅう…', 'Carrying to the chute…')}
          {phase === 'DROPPING_INTO_CHUTE' && copy(languageMode, '獲得口でリリース！', 'かくとくぐちで リリース！', 'Releasing over the chute!')}
          {phase === 'FALLING' && (bonusPrizeIds.length > 0
            ? copy(languageMode, '連鎖で景品も落下！', 'れんさで けいひんも らっか！', 'A second prize fell in too!')
            : dropReason === 'DELIVERED'
              ? copy(languageMode, '獲得口へ落下！', 'かくとくぐちへ らっか！', 'Dropping into the chute!')
              : copy(languageMode, '景品が落下！', 'けいひんが らっか！', 'The prize slipped!'))}
        </div>

        <div className="crane-game-controls" aria-label={copy(languageMode, '操作ボタン', 'そうさ ボタン', 'Controls')}>
          <button type="button" onPointerDown={() => beginMove(-1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} onClick={() => nudgeMove(-1)} disabled={phase !== 'AIM'}>
            <ChevronLeft />
          </button>
          <button type="button" onPointerDown={() => beginMove(1)} onPointerUp={stopMove} onPointerCancel={stopMove} onPointerLeave={stopMove} onClick={() => nudgeMove(1)} disabled={phase !== 'AIM'}>
            <ChevronRight />
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
        </div>

        {phase === 'RESULT' && (
          <div
            className={`crane-game-result${currentResultPrizes.length <= 1 ? ' is-single-prize' : ''}`}
            role="dialog"
            aria-modal="true"
            data-gamepad-navigation-root
          >
            <div
              className={`crane-game-result-prizes${currentResultPrizes.length <= 1 ? ' is-single' : ''}`}
              aria-label={copy(languageMode, '今回獲得した景品', 'こんかい かくとくした けいひん', 'Prizes won this turn')}
            >
              {currentResultPrizes.length > 0
                ? currentResultPrizes.map((prize) => (
                    <Sprite
                      key={`result-${prize.id}`}
                      index={prize.spriteIndex}
                      className="crane-game-result-prize"
                      sheet={prize.spriteSheet}
                      columns={prize.spriteColumns}
                      rows={prize.spriteRows}
                      aspectRatio={prize.spriteAspectRatio}
                    />
                  ))
                : caught
                  ? <Sprite
                      index={caught.prize.spriteIndex}
                      className="crane-game-result-prize"
                      sheet={caught.prize.spriteSheet}
                      columns={caught.prize.spriteColumns}
                      rows={caught.prize.spriteRows}
                      aspectRatio={caught.prize.spriteAspectRatio}
                    />
                  : <Sprite index={15} className="crane-game-result-prize" />}
            </div>
            <div className="crane-game-result-copy">
              <Sparkles aria-hidden="true" />
              <h2>
                {attemptResult.outcome === 'WIN'
                  ? copy(languageMode, '獲得口に落下！', 'かくとくぐちに らっか！', 'DROPPED IN!')
                  : caught && dropReason === 'SLIPPED'
                    ? copy(languageMode, '途中でポロリ…', 'とちゅうで ポロリ…', 'SLIPPED ON THE WAY…')
                    : copy(languageMode, 'おしい！', 'おしい！', 'SO CLOSE!')}
              </h2>
              <p>
                {attemptResult.outcome === 'WIN'
                  ? attemptResult.prizeLabel
                  : caught
                    ? copy(languageMode, 'あと少しで獲得口だった…', 'あと すこしで かくとくぐちだった…', 'It almost made the chute…')
                  : copy(languageMode, '参加賞をもらった', 'さんかしょうを もらった', 'You received a consolation prize')}
              </p>
              {eventMode && attemptResult.outcome === 'WIN' && currentResultPrizes.length > 0 && (
                <div className="crane-game-result-effects" aria-label={copy(languageMode, '本編の永続効果と取得状況', 'ほんぺんの えいぞく こうかと しゅとく じょうきょう', 'Permanent bonuses and claim status')}>
                  <span>{copy(languageMode, '本編効果・取得状況', 'ほんぺん こうか・しゅとく じょうきょう', 'MAIN-GAME BONUS · CLAIM STATUS')}</span>
                  {currentResultPrizes.map((prize) => {
                    const isClaimed = claimedPrizeIdSet.has(prize.id);
                    const status = isClaimed
                      ? copy(languageMode, '獲得済み', 'かくとくずみ', 'OWNED')
                      : copy(languageMode, '新規効果', 'しんき こうか', 'NEW BONUS');
                    return (
                      <strong key={`effect-${prize.id}`} className={isClaimed ? 'is-owned' : 'is-new'}>
                        <em>{status}</em> {copy(languageMode, prize.permanentEffect.label.ja, prize.permanentEffect.label.hira, prize.permanentEffect.label.en)}
                      </strong>
                    );
                  })}
                  <small>{copy(languageMode, '同じ景品の効果は重複しません', 'おなじ けいひんの こうかは ちょうふくしません', 'Duplicate prizes do not stack')}</small>
                </div>
              )}
              {eventMode && replayDenied && (
                <small className="crane-game-replay-denied">
                  {copy(languageMode, `リプレイには${CRANE_REPLAY_COST}G必要です`, `リプレイには${CRANE_REPLAY_COST}Gひつようです`, `You need ${CRANE_REPLAY_COST}G to replay`)}
                </small>
              )}
              {eventMode && <strong>{attemptResult.goldReward}G</strong>}
              {eventMode && (
                <span className="crane-game-result-wallet" role="status" aria-live="polite">
                  {copy(languageMode, '所持G', 'しょじG', 'G ON HAND')}: {craneGold ?? 0}G
                </span>
              )}
            </div>
            <div className="crane-game-result-actions">
              {eventMode && (
                <button type="button" onClick={replay} disabled={!onCraneReplay || finishSubmitted}>
                  <RotateCcw size={17} /> {copy(languageMode, `リプレイ（${CRANE_REPLAY_COST}G）`, `リプレイ（${CRANE_REPLAY_COST}G）`, `REPLAY (${CRANE_REPLAY_COST}G)`)}
                </button>
              )}
              {!eventMode && (
                <button type="button" onClick={resetGame}>
                  <RotateCcw size={17} /> {copy(languageMode, 'もう一度', 'もういちど', 'PLAY AGAIN')}
                </button>
              )}
              <button type="button" data-gamepad-initial-choice onClick={finish} disabled={finishSubmitted}>
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
